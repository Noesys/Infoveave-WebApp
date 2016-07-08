/**
 * Copyright © 2015-2016 Noesys Software Pvt.Ltd. - All Rights Reserved
 * -------------
 * This file is part of Infoveave.
 * Infoveave is dual licensed under Infoveave Commercial License and AGPL v3
 * -------------
 * You should have received a copy of the GNU Affero General Public License v3
 * along with this program (Infoveave)',
 * You can be released from the requirements of the license by purchasing
 * a commercial license. Buying such a license is mandatory as soon as you
 * develop commercial activities involving the Infoveave without
 * disclosing the source code of your own applications.
 * -------------
 * Authors: Naresh Jois <naresh@noesyssoftware.com>, et al.
 */
"use strict";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { BaseComponent } from "./baseComponent";
import { Widget, WidgetAnnotation, Dimension } from "./../data/models";
import { CoreDataStore } from "./../data/dataStore";
import { ChartFactory } from "./../charts/chartFactory";
import { IChartMetaData, ChartFeature, BaseChart, IChartConstructorData, WidgetOptionType, IWidgetOptionWithValue } from "./../charts/base";
import { A } from "./../components/formComponents";
import * as _s from "underscore.string";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import * as axios from "axios";
import { Urls } from "../data/constants";
import * as pako from "pako";
import { DateRangeInterval } from "../helpers/dateHelpers";
import Menu from "material-ui/lib/menus/menu";
import IconMenu from "material-ui/lib/menus/icon-menu";
import MenuItem from "material-ui/lib/menus/menu-item";
import IconButton from "material-ui/lib/icon-button";
import Divider from "material-ui/lib/divider";
import FontIcon from "material-ui/lib/font-icon";
import { Subscriptions } from "./../data/constants";
import * as PubSub from "pubsub-js";

interface IWidgetViewProps {
    id: number;
    ref: any;
    key?: any;
    containerRef: number;
    onRemove(): void;
    onDrill(newLevel: number, info: { query: string, item: string }[]): void;
    onShare?(): void;
}

enum WidgetLoadState {
    InProgress = 0,
    LoadFromCache = 10,
    LoadFromDB = 20,
    ErrorState = 30,
    NoData = 50
}
interface IWidgetViewState extends IChartMetaData {
    currentState: WidgetLoadState;
    errorMessage: string;
    fullScreen: boolean;
    widget: Widget;
    chartMetaData: IChartMetaData;
    chartInstance: BaseChart;
    loadQueue: { level: number, filters: { name: string, operator: string, items: string[] }[], dateFilters: string[], mode: DateRangeInterval, progression: number, startDate: Date, endDate: Date };
    showBreadCrumb: boolean;
    hackForMenu: string;
    lastStateDate: Date;
    lastEndDate: Date;
    annotations: WidgetAnnotation[];

}
export class WidgetView extends BaseComponent<IWidgetViewProps, IWidgetViewState> {
    static displayName = "Widget";
    private _dataStore = new CoreDataStore();
    componentWillMount() {
        let baseState = ChartFactory.GetEmptyMetadata();
        let state = _.merge(baseState, {
            currentState: WidgetLoadState.InProgress,
            fullScreen: false,
            errorMessage: null,
            widget: null,
            loadQueue: null,
            showBreadCrumb: true,
            lastStateDate: null,
            lastEndDate: null,
            annotations: []
        });
        this.setState(state as IWidgetViewState);
        this._dataStore.GetWidget(this.props.id).then((results) => {
            this.updateStateImmutable({ widget: results.data });
            let chartMetaData = ChartFactory.GetMetaDataForType(results.data.type);
            if (chartMetaData == null) {
                this.updateStateImmutable({ currentState: WidgetLoadState.ErrorState, errorMessage: "Widget type not avaiable anymore" });
                return;
            }
            this.setState(_.assign(this.state, chartMetaData) as IWidgetViewState);
            let savedData = JSON.parse(results.data.data) as IChartConstructorData;
            if (savedData.schema !== 2) {
                this.updateStateImmutable({ currentState: WidgetLoadState.ErrorState, errorMessage: "Chart Factory doesn't support Schema yet" });
                return;
            }
            let chart = ChartFactory.CreateChart(results.data.type, savedData.measures, savedData.dimensions, savedData.dateQuery, savedData.options, savedData.filters, savedData.fixedDate);
            chart.setDataSourceIds(JSON.parse(results.data.dataSourceIds));
            chart.DrillAction = this.props.onDrill;
            chart.OnShowContextMenu = this.showContextMenu;
            let showBreadCrumb = chart.showPanelTitle();
            this.updateStateImmutable({ currentState: WidgetLoadState.InProgress, chartInstance: chart, showBreadCrumb: showBreadCrumb });
            chart.setArea(ReactDOM.findDOMNode(this.refs["content"]) as HTMLElement);
            if (this.state.loadQueue != null) {
                this.loadData(this.state.loadQueue.level, this.state.loadQueue.filters, this.state.loadQueue.dateFilters,
                    this.state.loadQueue.mode, this.state.loadQueue.progression, this.state.loadQueue.startDate, this.state.loadQueue.endDate);
                this.updateStateImmutable({ loadQueue: null, lastStateDate: this.state.loadQueue.startDate, lastEndDate: this.state.loadQueue.endDate });
            };
        }).catch((results) => {
            this.updateStateImmutable({ currentState: WidgetLoadState.ErrorState, errorMessage: "No Widget in database" });
        });
        PubSub.subscribe(Subscriptions.AddAnnotation, (action: any, data: { widgetId: number, annotation: WidgetAnnotation }) => {
            if (data.widgetId !== this.props.id) return;
            let annotations = _.clone(this.state.annotations);
            annotations.push(data.annotation);
            this.updateStateImmutable({ annotations: annotations });
        });
    }

    setSliceDimension = (dimension: Dimension) => {
        let sliceDim: Dimension = dimension;
        let baseData = this.state.chartInstance;
        baseData.setSlice(sliceDim);
    };

    componentWillUnMount = () => {
        PubSub.unsubscribe(Subscriptions.AddAnnotation);
    };

    loadData = (level: number, filters: { name: string, operator: string, items: string[] }[], dateFilters: string[], mode: DateRangeInterval, progression: number, startDate: Date, endDate: Date) => {
        let ci = this.state.chartInstance;
        if (ci == null) {
            // Widget Has not been loaded at this instant
            // so put the data in a queue and resume operation
            // once the widget load ins complete
            this.updateStateImmutable({ loadQueue: { level: level, filters: filters, dateFilters: dateFilters, mode: mode, progression: progression, startDate: startDate, endDate: endDate } });
            return;
        }
        ci.clearContent();
        this.updateStateImmutable({ currentState: WidgetLoadState.InProgress, lastStateDate: startDate, endDate: endDate });
        ci.setDrillLevel(level);
        let widgetRequestData = ci.getPostData(filters, dateFilters, mode, progression, startDate, endDate);
        _.map(widgetRequestData, (request, ix) => {
            this._dataStore.GetWidgetData(request).then((results) => {
                let state = WidgetLoadState.NoData;
                if (results.data.data.length === 0 && ix === 0) {
                    this.updateStateImmutable({ currentState: state });
                    ci.clearContent();
                    return;
                }
                state = (results.data.dataFetchedFrom === 0) ? WidgetLoadState.LoadFromDB : WidgetLoadState.LoadFromCache;
                this.updateStateImmutable({ currentState: state });
                try {
                    ci.setData(ix, results.data.data, results.data.measureMetaData, results.data.dateIntervalUsed);
                } catch (e) {
                    console.error(e);
                    ci.clearContent();
                    this.updateStateImmutable({ currentState: WidgetLoadState.ErrorState, errorMessage: e.message });
                }
            }).catch((results) => {
                let message = (results.data == null) ? "Connection Lost" : (results.data.message != null) ? results.data.message : "Unknown Error, Look at Console";
                this.updateStateImmutable({ currentState: WidgetLoadState.ErrorState, errorMessage: message });
            });
        });
        this._dataStore.GetWidgetAnnotations(this.props.id, { startDate: moment(startDate).format("YYYY-MM-DD"), endDate: moment(endDate).format("YYYY-MM-DD"), data: null, content: null }).then((results) => {
            this.updateStateImmutable({ annotations: results.data });
        });
    };

    getWidgetIcon = (state: WidgetLoadState) => {
        switch (state) {
            case WidgetLoadState.InProgress:
                return "fa fa-spinner";
            case WidgetLoadState.LoadFromCache:
                return "fa fa-bolt";
            case WidgetLoadState.LoadFromDB:
                return "fa fa-cubes";
            case WidgetLoadState.ErrorState:
                return "fa fa-exclamation-circle";
            case WidgetLoadState.NoData:
                return "fa fa-file-o";
            default:
                return "fa fa-file-o";
        }
    };

    togglefullScreen = () => {
        this.updateStateImmutable({ fullScreen: !this.state.fullScreen });
        setTimeout(this.reRender, 250);
    };

    bodyDOM = () => {
        if (this.state.currentState === WidgetLoadState.NoData) {
            return <div className="noData"><div>{this.gs("NoData") }</div></div>;
        }
        if (this.state.currentState === WidgetLoadState.InProgress) {
            return <div className="widgetDataLoading"><div><img src="/assets/img/logo_loading.gif"/></div></div>;
        }
        if (this.state.currentState === WidgetLoadState.ErrorState) {
            return <div className="widgetDataLoading"><div><i className="fa fa-exclamation-circle" style={{ "fontSize": "32px" }}></i><br/>{this.gs("CouldNotLoad") } <a onClick={null} >{this.gs("ClickToTry") }</a></div></div>;
        }
        return null;
    };

    onDownloadData = () => {
        if (this.state.chartInstance == null) { return; };
        let dataToExport = this.state.chartInstance.GetDownloadData();
        let keys = _.keys(dataToExport[0]);
        let csvContent = "data:text/csv;charset=utf-8,";
        _.each(keys, (k) => {
            if (k !== "order")
                csvContent += "\"" + k + "\",";
        });
        csvContent = _s.rtrim(csvContent, ",");
        csvContent += "\n";
        _.each(dataToExport, (cd) => {
            _.each(keys, (k) => {
                if (k !== "order")
                    csvContent += "\"" + cd[k] + "\",";
            });
            csvContent = _s.rtrim(csvContent, ",") + "\r\n";
        });
        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "chart_data.csv");
        link.click();
    };

    onDownloadImage = () => {
        if (this.state.chartInstance == null) { return; };
        let imgdata = this.state.chartInstance.GetDownloadImageData();
        this.getCssStyle().then((css) => {
            if (css != null) {
                imgdata = imgdata.replace("</svg>", _s.sprintf("<style>%s</style></svg>", css));
            }
            imgdata = imgdata.replace("<svg ", "<svg xmlns=\"http://www.w3.org/2000/svg\" ");
            let form = document.createElement("form");
            let element1 = document.createElement("input");
            let element2 = document.createElement("input");

            form.method = "POST";
            form.action =  Urls.domainUrl() + "/Services/Image";

            element1.value = btoa(pako.gzip(imgdata, { to: "string" }));
            element1.name = "data";
            element1.type = "hidden";
            form.appendChild(element1);
            document.body.appendChild(form);

            form.submit();
            document.body.removeChild(form);
        });
    };

     private getCssStyle(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (_s.isBlank(this.state.chartInstance.additionalStyleSheet)) {
                resolve(null);
                return;
            }
            axios.get(this.state.chartInstance.additionalStyleSheet).then((results) => {
                resolve(results.data);
            }).catch((results) => {
                reject(null);
            });
        });
    }

    showContextMenu = (data: {name: string, value: number, highlight: boolean }[]) => {
        let menu = <Menu desktop={true}>
            <MenuItem primaryText={this.gs("AddAnnotation")} onTouchTap={_.partial(this.showAnnotator,data)} />
        </Menu>;
        $("#contextMenu").css("top", (window as any).mousePosY).css("left", (window as any).mousePosX).css("display", "block");
        ReactDOM.unmountComponentAtNode(document.getElementById("contextMenu"));
        ReactDOM.render(menu, document.getElementById("contextMenu"));
        (window as any).contextMenuHandled = true;
    };

    showAnnotator = (data: {name: string, value: number, highlight: boolean }[]) => {
        return;
    };

    showAnnotationsClick = () => {
       PubSub.publish(Subscriptions.ShowAnnotations, this.state.annotations);
    };
    reRender = () => {
        if (this.state.chartInstance == null) { return; };
        (this.state.chartInstance as BaseChart).renderChart();
    };

    downloadOptionMenuDOM = () => {
        let ops = (this.state.currentState === WidgetLoadState.NoData) ? null : [];
        if (ops != null && this.state.featureSupport.length > 0 && _.includes(this.state.featureSupport, ChartFeature.DownloadData)) {
            if (ops.length === 0) ops.push(<Divider key={this.randomId + "dv"}/>);
            ops.push(<MenuItem key={this.randomId + "dda1"} primaryText={this.gs("DownloadData")} onTouchTap={this.onDownloadData} />);
        }
        if (ops != null && this.state.featureSupport.length > 0 && _.includes(this.state.featureSupport, ChartFeature.DownloadImage)) {
            if (ops.length === 0) ops.push(<Divider key={this.randomId + "dv"}/>);
            ops.push(<MenuItem key={this.randomId + "dda2"} primaryText={this.gs("DownloadImage")} onTouchTap={this.onDownloadImage} />);
        }
        return ops;
    };

    chartOptionChanged = (optionName: string, value: any) => {
        this.state.chartInstance.setOption(optionName, value);
        if (optionName === "Show Title") {
            this.updateStateImmutable({ showBreadCrumb: value });
        } else {
            this.updateStateImmutable({ hackForMenu: this._makeid(5) });
        }
    };

    chartOptions = () => {
        if (this.state.currentState === WidgetLoadState.InProgress) return null;
        if (this.state.chartInstance == null) return null;
        let options = [
            <Divider key={this.randomId + "dv2"}/>
        ];
        _.each(_.filter(this.state.chartInstance.getOptions(), (option) => option.type === WidgetOptionType.Checkbox) , (option, ix) => {
            options.push(<MenuItem key={this.randomId + "wo" + ix} primaryText={option.name} checked={option.value} onTouchTap={_.partial(this.chartOptionChanged, option.name,!option.value)} />);
        });
        _.each(_.filter(this.state.chartInstance.getOptions(), (option) => option.type === WidgetOptionType.DropDown), (option, ix) => {
            let menuItems = _.map(option.options, (subOp, ix2) => {
                return <MenuItem key={this.randomId + "wo" + ix + "sub" + ix2} primaryText={subOp} checked={(option.value === subOp) } onTouchTap={_.partial(this.chartOptionChanged, option.name, subOp) } />;
            });
            options.push(<MenuItem leftIcon={<FontIcon className="fa fa-caret-right" />}  key={this.randomId + "wo" + (options.length + ix)} primaryText={option.name} menuItems={menuItems} />);
        });
        return options;
    };

    olddrop = () => {
         return <li>
                <A className="text-white" title={this.gs("Options") } data-toggle="dropdown">
                    <i className="fa fa-cog"></i>
                    </A>
                <ul className="dropdown-menu pull-right" role="menu">
                    <li><a onClick={this.props.onRemove}><i className="fa fa-trash-o"></i> {this.gs("Delete") }</a></li>
                    <li><a onClick={this.props.onShare}><i className="fa fa-clipboard"></i> {this.gs("EmbedCode") }</a></li>
                    {(this.state.currentState === WidgetLoadState.NoData) ? null : <li><a onClick={this.onDownloadData}><i className="fa fa-download"></i> {this.gs("DownloadData") }</a></li> }
                    {(this.state.currentState === WidgetLoadState.NoData) ? null : <li><a onClick={this.onDownloadImage}><i className="fa fa-camera-retro"></i> {this.gs("DownloadImage") }</a></li> }
                    <li></li>
                    </ul>
                </li>;
    };

    panelControlsDOM = () => {
        let stateMessage = "";
        if (this.state.currentState === WidgetLoadState.LoadFromCache) {
            stateMessage = this.gs("LoadedFromCache");
        }
        if (this.state.currentState === WidgetLoadState.LoadFromDB) {
            stateMessage = this.gs("LoadedFromCube");
        }
        if (this.state.currentState === WidgetLoadState.NoData) {
            stateMessage = this.gs("NoData");
        }
        if (this.state.errorMessage != null) {
            stateMessage = this.state.errorMessage;
        }
        return <div className="panel-controls hidden-xs" style={{ "zIndex": 200 }}>
            <ul>
                { (this.state.widget != null && this.state.widget.description != null && this.state.widget.description.length > 0) ?
                    <li>
                        <a className="text-white hint--left hint--medium" data-hint={this.state.widget.description}> <i className="fa fa-info-circle"  /></a>
                    </li> : null }
                <li>
                    <a data-hint={stateMessage} className="text-white hint--left hint--medium"><i className={this.getWidgetIcon(this.state.currentState) }></i></a>
                </li>

                <IconMenu desktop={true} closeOnItemTouchTap={false} iconButtonElement={<a className="text-white hint--left hint-small" data-hint={this.gs("Options") } style={{ cursor: "pointer" }} data-toggle="dropdown">
                    <i className="fa fa-cog text-white"></i>
                </a>}
                    anchorOrigin={{ horizontal: "left", vertical: "bottom" }} targetOrigin={{ horizontal: "right", vertical: "top" }} >
                    <MenuItem primaryText={this.gs("Delete") } onTouchTap={this.props.onRemove} />
                    {this.downloadOptionMenuDOM() }
                </IconMenu>
                <li>
                    <a className="hint--left" data-hint={this.gs("DragToMove") } ><i className="fa fa-arrows moveHandle"></i></a>
                </li>
            </ul>
        </div>;
    };

    panelHeadingDOM = () => {
        return <div className="panel-heading panel-heading-bg">
                  {this.panelControlsDOM() }
                  {(this.state.widget != null) ? <div className="panel-title">{this.state.widget.name}</div>  : null }
            </div>;
    };

    render() {
        return <div className={"ivWidget panel panel-default " + ((this.state.fullScreen) ? " fullScreen" : (this.state.currentState === WidgetLoadState.InProgress) ? " loading" : "") }>
                { (this.state.showBreadCrumb) ? this.panelHeadingDOM() : null }
                <div className={"panel-body no-padding"} data-help = "Widget">
                    { (!this.state.showBreadCrumb) ? this.panelHeadingDOM() : null  }
                    {this.bodyDOM() }
                    {(this.state.chartInstance != null) ?
                        <div ref="content" className={"chart " + ((this.state.chartInstance != null && this.state.chartInstance.fitChart()) ? "" : "scrollable")} style={{ width: "100%", height: "100%" }}></div> : null}
                    </div>
            </div>;
    };
}