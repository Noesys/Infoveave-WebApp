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
import * as Constants from "./../data/constants";
import { ChartFactory } from "./../charts/chartFactory";
import { WizardContainer, TabPage, TabContainer } from "./tabContainer";
import { BaseChart, IChartMetaData, DisplayPosition, WidgetOptionType, IChartConstructorData } from "./../charts/base";
import { Widget, DataSourceWithMeasuresDimensions, Measure, Dimension, } from "./../data/models";
import { GalleryView, IGalleryItem } from "./galleryView";
import { DropDown, DropDown2, CheckBox, TextBox, RadioList, Button } from "./formComponents";
import { InfoboardStore, CoreDataStore } from "./../data/dataStore";
import { FilterBuilder } from "./filterBuilder";
import * as HTML5Backend  from "react-dnd-html5-backend";
import * as _s from "underscore.string";
import Dialog from "material-ui/lib/dialog";
import { DateRangeInterval, DateHelpers } from "./../helpers/dateHelpers";
import { DateRangePicker } from "./../components/dateRangePicker";
import RaisedButton from "material-ui/lib/raised-button";
import { muiTheme } from "./../components/muiTheme";
import ThemeManager from "material-ui/lib/styles/theme-manager";
import Select from "react-select";

interface IWidgetDesignerProps {
    ref: any;
    widgets: Widget[];
    widgetSelected(widgetType: string, widgetId: number, defaultWidth: number, defaultHeight: number): void;
    widgetDeleted(id: number): void;
}

interface IWidgetDesignerState {
    selectedWidget: IChartMetaData;
    dataSources: DataSourceWithMeasuresDimensions[];
    selectedDataSources: DataSourceWithMeasuresDimensions[];
    measures: Measure[];
    dimensions: Dimension[];
    dateDimensions: Dimension[];
    selectedDateDimension: number;
    selectedMeasures: { level: number, name: string, measure: Measure }[];
    selectedDimensions: { level: number, name: string, dimension: Dimension }[];
    selectedOptions: { name: string, value: any }[];
    drillBy: string;
    currentDrillLevel: number;
    name: string;
    description: string;
    drillDownQuestionOpen: boolean;
    filters: { name: any, operator: string, items: string[] }[];
    fixedDate: boolean;
    selectedDateRange: string;
    selectedDateRangeData: string[];
    dateRange: {
        mode: DateRangeInterval,
        beginDate: Date,
        endDate: Date,
        progression: number;
    };
}


/**
 * WidgetDesigner
 */
export class WidgetDesigner extends BaseComponent<IWidgetDesignerProps, IWidgetDesignerState> {
    static displayName = "WidgetDesigner";
    private _dataStore: InfoboardStore;
    private _widgetStore: CoreDataStore = new CoreDataStore();
    wizardNext = (tab: any, navigation: any, ix: number) => {
        // if (ix === 1) { if (this.state.selectedWidget == null) {  return false; }; }
        if (ix === 1) {
            if (!this.validateMeasuresAndDimensionsAtLevel(0)) {
                this.notify(Constants.ViewComponent.Infoboard, "warning", false, this.s("SelectMeasuresAndDimensions"));
                return false;
           };
            if (this.state.selectedWidget.drillDowns === 0) {
                // setTimeout(() => { (this.refs["wizardAdd"] as WizardContainer).jumpToTab(2); }, 200);
                return true;
            }
            this.updateStateImmutable({ drillDownQuestionOpen: true });
            return false;
        }
        if (this.state.selectedWidget.drillDowns > 0 && ix === 2) {
            if (this.state.drillBy != null && !this.validateMeasuresAndDimensionsAtLevel(this.state.currentDrillLevel)) {
                this.notify(Constants.ViewComponent.Infoboard, "warning", false, this.s("SelectMeasuresAndDimensions"));
                return false;
           };
            setTimeout(() => { this.renderPreview(); }, 500);
            return true;
        }
        if ((this.state.selectedWidget.drillDowns > 0 && ix === 3) || (this.state.selectedWidget.drillDowns === 0 && ix === 2)) {
            if (_s.isBlank(this.state.name)) {
                this.notify(Constants.ViewComponent.Infoboard, "warning", false, this.s("EnterWidgetName"));
                return false;
            }
            return true;
        }
        if ((this.state.selectedWidget.drillDowns > 0 && ix === 4) || (this.state.selectedWidget.drillDowns === 0 && ix === 3)) {
            this.saveWidget();
            return true;
        }
        return true;
    };

    validateMeasuresAndDimensionsAtLevel = (level: number): boolean => {
        let metaData = this.getChartMetaData();
        let missing = false;
        _.each(_.filter(metaData.measures, (m) => m.required), (m) => {
            let levelToCheck = (level === 0) ? 0 : (this.state.drillBy === "measure") ? level : 0;
            let exists = _.find(this.state.selectedMeasures, (sm) => sm.name === m.name && sm.level === levelToCheck);
            if (exists == null) { missing = true; }
        });
        _.each(_.filter(metaData.dimensions, (d) => d.required), (d) => {
            let levelToCheck = (level === 0) ? 0 : (this.state.drillBy === "dimension") ? level : 0;
            let exists = _.find(this.state.selectedDimensions, (sd) => sd.name === d.name && sd.level === levelToCheck);
            if (exists == null) { missing = true; }
        });
        if (this.state.selectedDateDimension == null) {
            return false;
        }
        return !missing;
    };

    componentWillMount = () => {
        this._dataStore = new InfoboardStore();
        let startDate = moment().startOf("month").toDate();
        let endDate = moment().endOf("month").toDate();
        let selectedDateRange = DateHelpers.selectedDateRange(DateRangeInterval.Years, 999, startDate, endDate);
        let rangeValues = DateHelpers.getQueryDates(DateRangeInterval.Years, 999, startDate, endDate);

        this.setState({selectedWidget: null,
            dataSources: [],
            selectedDataSources: [],
            measures: [],
            dimensions: [],
            dateDimensions: [],
            selectedDateDimension: null,
            selectedMeasures: [],
            selectedDimensions: [],
            selectedOptions: [],
            filters: [],
            drillBy: null,
            currentDrillLevel: 0,
            name: null,
            description: null,
            drillDownQuestionOpen: false,
            fixedDate: false,
            selectedDateRange: selectedDateRange,
            selectedDateRangeData: rangeValues,
            dateRange: {
                mode: DateRangeInterval.Years,
                beginDate: startDate,
                endDate: endDate,
                progression: 999
            }
        });
        this._dataStore.GetDataSources().then((results) => {
            this.updateStateImmutable({dataSources: results.data});
        });
    };

    getChartFamilies = () => {
        let cfs = [this.gs("Existing"), this.gs("SharedWidgets")];
        let uniq = _.uniq(_.map(ChartFactory.GetMetaData(), (m) => m.family));
        return _.union(cfs, uniq);
    };

    selectWidget = (type: string) => {
        let selectedWidget = this.getChartByType(type);
        let options = _.map(selectedWidget.widgetOptions, (wo: any) => {
            return { name: wo.name, value: wo.default };
        });
        this.updateStateImmutable({
            selectedWidget: selectedWidget,
            selectedOptions: options,
            selectedMeasures: [],
            name: null,
            description: null,
            drillBy: null,
            currentDrillLevel: 0,
            filters: [],
            selectedDimensions: [],
            selectedDateDimension : null });
        // (this.refs["wizardAdd"] as WizardContainer).moveNext();
    };

    widgetSelected = (type: string, id: number, defaultWidth: number, defaultHeight: number) => {
        if (this.props.widgetSelected != null) {
            this.props.widgetSelected(type, id, defaultWidth, defaultHeight);
        }
    };

    resetState = () => {
        this.updateStateImmutable({
            selectedWidget: null,
            selectedDataSource: null,
            measures: [],
            dimensions: [],
            dateDimensions: [],
            selectedDateDimension: null,
            selectedMeasures: [],
            selectedDimensions: [],
            selectedOptions: [],
            filters: [],
            drillBy: null,
            currentDrillLevel: 0
        });
        (this.refs["wizardAdd"] as WizardContainer).jumpToTab(0);
    };

    getChartByType = (name: string) => {
        return _.find(ChartFactory.GetMetaData(), (m) => m.name === name);
    };

    deleteWidget = (id: number) => {
        this._widgetStore.DeleteWidget(id).then((results) => {
            this.notify(Constants.ViewComponent.Infoboard, "success", true, this.s("WidgetDeleted"));
            this.props.widgetDeleted(id);
        });
    };

    getChartsByFamily = (chartFamily: string): IGalleryItem[] => {
        if (chartFamily === "Existing Widgets") {
            let charts = _.map(this.props.widgets, (w) => {
                let ch = this.getChartByType(w.type);
                if (ch == null) { return null; }
                return {
                    title: w.name,
                    smallDescription: "(" + ch.title + ")",
                    imagePreview: ch.preview,
                    actions: [
                        { text: <i className="fa fa-plus" />, action: () => { this.widgetSelected(w.type, w.id, ch.defaultWidth, ch.defaultHeight); } },
                        { text: <i className="fa fa-trash-o" />, action: () => { this.deleteWidget(w.id); } }
                        ]
                } as IGalleryItem;
            });
            return _.filter(charts, (c) => c != null);
        } else {
            let scharts = _.filter(ChartFactory.GetMetaData(), (m) => m.family === chartFamily);
            return _.map(scharts, (c) => {
                return {
                    title: c.title,
                    description: "",
                    imagePreview: c.preview,
                    actions: [{ text: this.gs("SelectWidget"), action: () => { this.selectWidget(c.name); } }]
                } as IGalleryItem;
            });
        }
    };

    /*
    selectorDOM = () => {
        return <div style={{height:"600px"}}>
                <TabContainer position="left">
                    {_.map(this.getChartFamilies(), (cf, ix) => {
                        return <TabPage key={"wdse" + ix} caption={cf}>
                            <GalleryView items={this.getChartsByFamily(cf) } /></TabPage>;
                    }) }
                    </TabContainer>
            </div>;
    };
    */

    getChartMetaData = (): IChartMetaData => {
        if (this.state.selectedWidget == null) {
            return {
                measures: [],
                dimensions: [],
                family: "",
                name: "",
                title: "",
                preview: "",
                drillDowns: 0,
                widgetOptions: [],
                prototype: null,
                defaultWidth: 2,
                defaultHeight: 2,
                featureSupport: []
            };
       };
        return this.state.selectedWidget;
    };

    selectDataSource = (dataSources: DataSourceWithMeasuresDimensions[]) => {
        let commonDimensions: Dimension[] = [];
        _.each(dataSources, (dataSource, ix) => {
            if (ix === 0) {
                commonDimensions = dataSource.dimensions;
            } else {
                commonDimensions = _.intersectionBy(commonDimensions, dataSource.dimensions, "query");
            }
        });
        commonDimensions.push({ id: 0, dataSourceId: 0, isDate: false, name : "Date", query: "Date" });
        this.updateStateImmutable({
            selectedDataSources: dataSources,
            measures: _.flatten(_.map(dataSources, (d: DataSourceWithMeasuresDimensions) => d.measures)),
            dimensions: _.filter(commonDimensions, (cd) => !cd.isDate),
            dateDimensions: _.filter(commonDimensions, (cd) => cd.isDate),
            selectedDimensions: [],
            selectedMeasures: [],
            selectDateDimension: null,
        });
    };

    selectDateDimension = (dimension: Dimension) => {
        let id = (dimension == null) ? null :   dimension.id;
        this.updateStateImmutable({ selectedDateDimension: id });
    };

    renderPreview = () => {
        try {
            let measures = [];
            let dimensions = [];
            for (let i = 0; i <= 3; i++) {
                let measuresAtLevel = _.map(_.filter(this.state.selectedMeasures, (sm) => sm.level === i), (sm) => {
                    return { axis: sm.name, dataSourceId: sm.measure.dataSourceId, id: sm.measure.id, name: sm.measure.name, query: sm.measure.query }; });
                let dimensionsAtLevel = _.map(_.filter(this.state.selectedDimensions, (sd) => sd.level === i), (sd) => {
                    return { axis: sd.name, dataSourceId: sd.dimension.dataSourceId, id: sd.dimension.id, name: sd.dimension.name, query: sd.dimension.query }; });
                if (measuresAtLevel.length > 0) {
                    measures.push({ level: i, measures: measuresAtLevel });
                }
                if (dimensionsAtLevel.length > 0) {
                    dimensions.push({ level: i, dimensions: dimensionsAtLevel });
                }
           };
            let customDate =  (_.find(this.state.dateDimensions, (d) => d.id === this.state.selectedDateDimension) != null) ?
                _.find(this.state.dateDimensions, (d) => d.id === parseInt(this.state.selectedDateDimension as any, 10)).query : "";
            let chart1 = ChartFactory.CreateChart(this.state.selectedWidget.name, measures, dimensions, customDate, [], [], null);
            chart1.setPreviewMode((ReactDOM.findDOMNode(this.refs["chartArea1"]) as HTMLElement));
            let chart2 = ChartFactory.CreateChart(this.state.selectedWidget.name, measures, dimensions, customDate, this.state.selectedOptions, [], null);
            chart2.setPreviewMode((ReactDOM.findDOMNode(this.refs["chartArea2"]) as HTMLElement));
            let chart3 = ChartFactory.CreateChart(this.state.selectedWidget.name, measures, dimensions, customDate, this.state.selectedOptions, [], null);
            chart3.setPreviewMode((ReactDOM.findDOMNode(this.refs["chartArea3"]) as HTMLElement));
        } catch (e) {
            if (this.refs["chartArea1"] != null) (ReactDOM.findDOMNode(this.refs["chartArea1"]) as HTMLElement).innerHTML = "";
            if (this.refs["chartArea2"] != null) (ReactDOM.findDOMNode(this.refs["chartArea2"]) as HTMLElement).innerHTML = "";
            if (this.refs["chartArea3"] != null) (ReactDOM.findDOMNode(this.refs["chartArea3"]) as HTMLElement).innerHTML = "";
            console.log(e);
        }
    };

    saveWidget = (): void => {
        let measures = [];
        let dimensions = [];
        for (let i = 0; i <= 3; i++) {
            let measuresAtLevel = _.map(_.filter(this.state.selectedMeasures, (sm) => sm.level === i), (sm) => {
                return { axis: sm.name, dataSourceId: sm.measure.dataSourceId, id: sm.measure.id, name: sm.measure.name, query: sm.measure.query }; });
            let dimensionsAtLevel = _.map(_.filter(this.state.selectedDimensions, (sd) => sd.level === i), (sd) => {
                return { axis: sd.name, dataSourceId: sd.dimension.dataSourceId, id: sd.dimension.id, name: sd.dimension.name, query: sd.dimension.query }; });
            if (measuresAtLevel.length > 0) {
                measures.push({ level: i, measures: measuresAtLevel });
            }
            if (dimensionsAtLevel.length > 0) {
                dimensions.push({ level: i, dimensions: dimensionsAtLevel });
            }
       };
        let customDate = _.find(this.state.dateDimensions, (d) => d.id === parseInt(this.state.selectedDateDimension as any, 10)).query;
        let dateSelected2 = null;
        if (this.state.fixedDate) {
            dateSelected2 = { mode: this.state.dateRange.mode,
                beginDate: this.state.dateRange.beginDate,
                endDate: this.state.dateRange.endDate,
                progression: this.state.dateRange.progression,
                range: (this.state.dateRange.progression === 999) ? this.state.selectedDateRangeData : null,
            };
        }
        let widgetData = {
            schema: 2,
            measures: measures,
            dimensions: dimensions,
            dateQuery: customDate,
            options: this.state.selectedOptions,
            filters: this.state.filters,
            fixedDate: dateSelected2
        } as IChartConstructorData;
        let widget = {
            name: this.state.name,
            description: this.state.description,
            type: this.state.selectedWidget.name,
            data: JSON.stringify(widgetData),
            dataSourceIds: JSON.stringify(_.map(this.state.selectedDataSources, (s) => s.id)),
        } as Widget;
        this._dataStore.CreateWidget(widget).then((results) => {
            this.widgetSelected(results.data.type, results.data.id, this.state.selectedWidget.defaultWidth, this.state.selectedWidget.defaultHeight);
        });
    };

    removeMeasure = (name: string, measure: Measure): void => {
        let selected = _.clone(this.state.selectedMeasures);
        let updated = _.filter(selected, (s) => s.name !== name);
        this.updateStateImmutable({ selectedMeasures: updated });
        this.renderPreview();
    };

    removeDimension = (name: string, dimension: Dimension): void => {
        let selected = _.clone(this.state.selectedDimensions);
        let updated = _.filter(selected, (s) => s.name !== name);
        this.updateStateImmutable({ selectedDimensions: updated });
        this.renderPreview();
    };

    /*
    measureTargetDOM = (level: number, position: DisplayPosition) => {
        return _.map(_.filter(this.getChartMetaData().measures, (m) => m.measurePosition === position), (m, ix) => {
            let selectedInfo = _.find(this.state.selectedMeasures, (sm) => sm.name === m.name && sm.level === level);
            let pos = (position === DisplayPosition.Top || position === DisplayPosition.Bottom) ? DisplayPosition.Bottom : DisplayPosition.Right;
            if (pos === DisplayPosition.Bottom) {
                return <div className="col-md-4" key={"wdmt" + ix} >
                    <MeasureDropTarget name={m.name} position={pos} selectedMeasure={(selectedInfo == null) ? null : selectedInfo.measure} removeSelected={this.removeMeasure}  />
                    </div>;
            }
            return <MeasureDropTarget key={"wdmt" + ix} name={m.name} position={pos} selectedMeasure={(selectedInfo == null) ? null : selectedInfo.measure} removeSelected={this.removeMeasure}  />;
        });
    };

    dimensionTargetDOM = (level: number, position: DisplayPosition) => {
        return _.map(_.filter(this.getChartMetaData().dimensions, (d) => d.dimensionPosition === position), (d, ix) => {
            let selectedInfo = _.find(this.state.selectedDimensions, (sd) => sd.name === d.name && sd.level === level);
            let pos = (position === DisplayPosition.Top || position === DisplayPosition.Bottom) ? DisplayPosition.Bottom : DisplayPosition.Right;
            if (pos === DisplayPosition.Bottom) {
                return <div className="col-md-4" key={"wddt" + ix}>
                 <DimensionDropTarget name={d.name} position={pos} selectedDimension={(selectedInfo == null) ? null : selectedInfo.dimension}  removeSelected={this.removeDimension}/>
                    </div>;
            }
            return <DimensionDropTarget key={"wddt" + ix} name={d.name} position={pos} selectedDimension={(selectedInfo == null) ? null : selectedInfo.dimension}  removeSelected={this.removeDimension}/>;
        });
    };*/

    measureSelected = (level: number, name: string, measure: Measure) => {
        if (measure == null) {
            this.removeMeasure(name, null);
            return;
        }
        let selected = _.clone(this.state.selectedMeasures);
        let measureAlreadyAdded = _.includes(_.map(this.state.selectedMeasures, (sm) => sm.measure.name), measure.name);
        if (measureAlreadyAdded === true) {
            return;
        }
        let existing = _.find(selected, (m) => m.name === name && m.level === level);
        if (existing == null) {
            let newObj = { level: level, name: name, measure: measure };
            selected.push(newObj);
        } else {
            existing.measure = measure;
        }
        this.updateStateImmutable({ selectedMeasures: selected });
        this.renderPreview();
    };

    dimensionSelected = (level: number, name: string, dimension: Dimension) => {
        if (dimension == null) {
            this.removeDimension(name, null);
            return;
        }
        let selected = _.clone(this.state.selectedDimensions);
        let dimensionAlreadyAdded = _.includes(_.map(this.state.selectedDimensions, (sd) => sd.dimension.name), dimension.name);
        if (dimensionAlreadyAdded === true) {
            return;
        }
        let existing = _.find(selected, (d) => d.name === name && d.level === level);
        if (existing == null) {
            let newObj = { level: level, name: name, dimension: dimension };
            selected.push(newObj);
        } else {
            existing.dimension = dimension;
        }
        this.updateStateImmutable({ selectedDimensions: selected });
        this.renderPreview();
    };


   measureTargetDOM = (level: number, position: DisplayPosition) => {
       return  _.map(_.filter(this.getChartMetaData().measures, (m) => m.measurePosition === position), (m, ix) => {
            let selectedInfo = _.find(this.state.selectedMeasures, (sm) => sm.name === m.name && sm.level === level);
            let pos = (position === DisplayPosition.Top || position === DisplayPosition.Bottom) ? DisplayPosition.Bottom : DisplayPosition.Right;
            return <div className="m-b-10 row" key={"wdms" + level + ix}>
                <div className="col-md-4">
                    <label>{m.name}</label> <span className="hint--bottom hint--meduim"><i className="fa fa-info-circle"/></span><br/>
                    <sup>({this.s("Measure")})</sup>
                </div>
                <div className="col-md-8">
                    <Select value={(selectedInfo == null) ? null : selectedInfo.measure.query} options={this.state.measures} labelKey="name" valueKey="query" onChange={_.partial(this.measureSelected,level,m.name)}  />
                </div>
            </div>;
       });
   };

   dimensionTargetDOM = (level: number, position: DisplayPosition) => {
       return _.map(_.filter(this.getChartMetaData().dimensions, (d) => d.dimensionPosition === position), (d, ix) => {
            let selectedInfo = _.find(this.state.selectedDimensions, (sd) => sd.name === d.name && sd.level === level);
            let pos = (position === DisplayPosition.Top || position === DisplayPosition.Bottom) ? DisplayPosition.Bottom : DisplayPosition.Right;
            return <div className="m-b-10 row"  key={"wdds" + level + ix}>
                <div className="col-md-4">
                    <label>{d.name}</label> <i className="fa fa-info-circle"/><br/>
                    <sup>({this.s("Dimension")})</sup>
                </div>
                <div className="col-md-8">
                    <Select value={(selectedInfo == null) ? null : selectedInfo.dimension.query} options={this.state.dimensions} labelKey="name" valueKey="query" onChange={_.partial(this.dimensionSelected,level,d.name)}  />
                </div>
            </div>;
       });
   };

    measuresAndDimensionsDOM = () => {
        return <div className="row">
            <div className="col-md-3">
                <div className="form-group">
                    <label>{this.s("DataSource")}</label>
                    <Select options={this.state.dataSources} multi={true} onChange={this.selectDataSource} value={this.state.selectedDataSources} labelKey="name" valueKey="id" />
                </div>
                <div style={{ "paddingTop": "25px", height: "232px" }} >
                    {this.measureTargetDOM(0, DisplayPosition.Left) }
                    {this.dimensionTargetDOM(0, DisplayPosition.Left) }
                 </div>
            </div>
            <div className="col-md-6">
                <div className="panel panel-success">
                    <div className="panel-body no-padding"  style={{height:"290px"}}>
                        <div style={{width:"100%","height":"94%"}}>
                            <div ref="chartArea1" className="widgetDesignerPreview">
                            </div>
                        </div>
                        <div className="small p-r-5 pull-right">
                            { this.s("PreviewText") }
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md-3">
                <DropDown2 options={this.state.dateDimensions} caption={this.s("Date")} optionsText="name" optionsValue="id" value={this.state.selectedDateDimension} onChange={this.selectDateDimension} />
                 <div style={{"paddingTop":"25px",height:"232px"}} >
                    {this.measureTargetDOM(0, DisplayPosition.Right) }
                    {this.dimensionTargetDOM(0, DisplayPosition.Right) }
            </div>
            </div>
             <div className="col-md-3">
            </div>
            <div className="col-md-6">
                {this.measureTargetDOM(0, DisplayPosition.Bottom) }
                {this.dimensionTargetDOM(0, DisplayPosition.Bottom) }
            </div>
            <div className="col-md-3">
            </div>

        </div>;
    };
            /* {this.measureWellDom(0)}
            {this.dimensionWellDom(0,false)} */
    optionsDOM = () => {
        if (this.state.selectedWidget == null) {
            return;
        }
        return _.map(this.state.selectedWidget.widgetOptions, (op, ix) => {
            if (op.type === WidgetOptionType.DropDown) {
                return <DropDown2 key={"wdop" + ix} caption={op.name}
                    options={_.map(op.options,(o) => { return { label: o, value: o }; })}
                    optionsText="label" optionsValue="value" value={_.find(this.state.selectedOptions, (so) => so.name === op.name).value}
                    onChange={_.partial(this.updateOption, op.name) } clearable={false}/>;
            } else if (op.type === WidgetOptionType.Checkbox) {
                return <CheckBox key={"wdop" + ix} caption={op.name} value={op.name} checked={_.find(this.state.selectedOptions, (so) => so.name === op.name).value} onChange={_.partial(this.updateOption, op.name) }/>;
            } else if (op.type === WidgetOptionType.Input) {
                return <TextBox key={"wdop" + ix} caption={op.name} type="number" value={_.find(this.state.selectedOptions, (so) => so.name === op.name).value} onChange={_.partial(this.updateOption, op.name) }/>;
            }
        });
    };

   loadDimensionsItems = (dataSourceId: number, options: number, query): Promise<string[]> => {
       return new Promise((callback) => {
           this._dataStore.GetDimensionItems(dataSourceId, options, query).then((results) => {
               callback(results.data);
           }).catch((err) => {
               callback([]);
           });
       });
   };

   loadDimensionsItemsUsingName = (name: string, query: string): Promise<{ value: any; label: string }[]> => {
       let dimension = _.find(this.state.dimensions, (d) => d.query === name);
       return new Promise((resolve) => {
           this.loadDimensionsItems(dimension.dataSourceId, dimension.id, query).then((data) => {
               resolve({ options : _.map(data, (d) => { return { value: d, label: d }; })});
           });
       });
   };

   filtersUpdated = (filters: { name: any, operator: string, items: string[] }[]) => {
       this.updateStateImmutable({ filters: filters });
   };

   filtersDOM = () => {
       let allFilters = _.chain(this.state.dimensions).filter((d) => d.isDate !== true && d.name !== "Date").map((d) => { return { value: d.query, label: d.name }; }).value();
       return <FilterBuilder columns={allFilters} filters={this.state.filters} filtesUpdated={this.filtersUpdated} itemsCallback={this.loadDimensionsItemsUsingName} />;
   };

   updateOption = (name: string, value: any) => {
       let toUpdate = (value.value != null) ? value.value : value;
       let options = _.clone(this.state.selectedOptions);
       let op = _.find(options, (o) => o.name === name);
       op.value = toUpdate;
       this.updateStateImmutable({ selectedOptions: options });
       this.renderPreview();
   };

   updateDrillBy = (drillBy: { caption: string, value: string }) => {
       let db = (drillBy == null) ? null : drillBy.value;
       let measures = _.clone(this.state.selectedMeasures);
       let dimensions = _.clone(this.state.selectedDimensions);
       measures = _.filter(measures, (m) => m.level === 0);
       dimensions = _.filter(dimensions, (d) => d.level === 0);
       this.updateStateImmutable({ selectedMeasures: measures, selectedDimensions: dimensions, drillBy: db, currentDrillLevel: 1 });
   };

   /* measureWellDom = (level: number) => {
       let measuresCanAdd = _.filter(this.state.measures, (m) => !_.includes(_.map(this.state.selectedMeasures, (sm) => sm.measure.name), m.name));
       return <div className="col-md-6">
                    <h5>{this.s("Measures") }</h5>
                    <div style={{ "maxHeight": "70px" }} className="scrollable">
                    {_.map(measuresCanAdd, (m, ix) => {
                        return <MeasureItemDraggable key={"wdms" + ix} measure={m} handler={_.partial(this.measureSelected, level) } />;
                    }) }
                        </div>
           </div>;
   };

   dimensionWellDom = (level: number, addOffset: boolean) => {
       let dimensionsCanAdd = _.filter(this.state.dimensions, (d) => !_.includes(_.map(this.state.selectedDimensions, (sd) => sd.dimension.name), d.name));
       return <div className={"col-md-6" + ((addOffset) ? " col-md-offset-6" : "") } style={{ marginBottom: "10px" }}>
                    <h5>{this.s("Dimensions") }</h5>
                    <div style={{ "maxHeight": "70px" }} className="scrollable">
                    {_.map(dimensionsCanAdd, (d, ix) => {
                        return <DimensionItemDraggable key={"wdms" + ix} dimension={d} handler={_.partial(this.dimensionSelected, level) }/>;
                    }) }
                        </div>
           </div>;
   };*/

   breadcrumbDOM = () => {
       if (this.state.selectedWidget == null) {
           return null;
       }
       let levels = [];
       for (let i = 0; i <= this.state.currentDrillLevel; i++) {
           let measures = _.map(_.filter(this.state.selectedMeasures, (sm) => sm.level === i), (m) => m.measure.name);
           let dimensions = _.map(_.filter(this.state.selectedDimensions, (sd) => sd.level === i), (d) => d.dimension.name);
           if (i !== this.state.currentDrillLevel) {
               levels.push(<li key={"wdbc" + i}>{this.s("Level") + " " + (i + 1) } </li>); // ({measures.join(", ")}  by {dimensions.join(", ")})
           } else {
               if (i > 1) {
                   levels.push(<li key={"wdbc" + i}><a onClick={_.partial(this.removeDrillLevel, i) }>{this.s("Level") + (i + 1) } <i className="fa fa-minus-circle"></i></a></li>);
               } else {
                   levels.push(<li key={"wdbc" + i}>{this.s("Level") + (i + 1) }</li>);
               }
           }
      };
       if (this.state.currentDrillLevel < (this.state.selectedWidget.drillDowns - 1)) {
           levels.push(<li key="wdbcad"><a onClick={this.addDrillLevel}>{this.s("AddLevel") } <i className="fa fa-plus-circle"></i></a></li>);
       }
       return <ul className="breadcrumb">{levels}</ul>;
   };

   addDrillLevel = () => {
       if (this.state.drillBy == null) {
           return;
       }
       if (this.state.drillBy != null && !this.validateMeasuresAndDimensionsAtLevel(this.state.currentDrillLevel)) {
           this.notify(Constants.ViewComponent.Infoboard, "warning", false, this.s("SelectMeasuresAndDimensions"));
           return;
       }
       let l = this.state.currentDrillLevel;
       l += 1;
       this.updateStateImmutable({ currentDrillLevel: l });
   };

   removeDrillLevel = (level: number) => {
       let l = this.state.currentDrillLevel;
       let measures = _.filter(this.state.selectedMeasures, (sm) => sm.level !== level);
       let dimensions = _.filter(this.state.selectedDimensions, (sd) => sd.level !== level);
       l -= 1;
       this.updateStateImmutable({ currentDrillLevel: l, selectedMeasures: measures, selectedDimensions: dimensions });
   };

   updateState = (key: string, value: string) => {
       let obj = {};
       obj[key] = value;
       this.updateStateImmutable(obj);
   };

   drillDownYes = () => {
       (this.refs["wizardAdd"] as WizardContainer).jumpToTab(1);
       this.updateStateImmutable({ currentDrillLevel: 1 });
       setTimeout(() => { this.renderPreview(); }, 500);
       this.updateStateImmutable({ drillDownQuestionOpen: false });
   };

   drillDownNo = () => {
       let measures = _.filter(this.state.selectedMeasures, (sm) => sm.level === 0);
       let dimensions = _.filter(this.state.selectedDimensions, (sd) => sd.level === 0);
       this.updateStateImmutable({ currentDrillLevel: 1, selectedDimensions: dimensions, selectedMeasures: measures });
       (this.refs["wizardAdd"] as WizardContainer).jumpToTab(2);
       setTimeout(() => { this.renderPreview(); }, 500);
       this.updateStateImmutable({ drillDownQuestionOpen: false });
   };

   actions = [
      <RaisedButton label={this.gs("Yes")} primary={true} onTouchTap={this.drillDownYes} style={{marginRight:"10px"}} />,
      <RaisedButton label={this.gs("No")} onTouchTap={this.drillDownNo} />,
    ];

    applyDateRange = () => {
        (this.refs["dateRangePicker"] as DateRangePicker).hidePicker();
    };

    showDateRange = () => {
        (this.refs["dateRangePicker"] as DateRangePicker).togglePicker();
    };

    dateRangeChange = (mode: DateRangeInterval, progression: number, beginDate: Date, endDate: Date, displayContent: string, range: string[]) => {
        // this.state.selectedDateRangeData, this.state.dateRange.mode,  this.state.dateRange.progression,  this.state.dateRange.beginDate,  this.state.dateRange.endDate
        let newDateRange = {
                mode: mode,
                beginDate: beginDate,
                endDate: endDate,
                progression: progression
            };
        if (_.isEqual(this.state.dateRange, newDateRange)) {
            return;
        }
        this.updateStateImmutable({
            dateRange: newDateRange,
            selectedDateRange: displayContent,
            selectedDateRangeData: range,
            dateRangeChangePending: true,
        });
    };

    datePickerDOM = () => {
         return <div>
                <Button type="button" style={{ width: "275px", textAlign: "center" }} className="btn btn-white" title={this.s("DateRange") }  onClick={this.showDateRange} dataHelp="DateRange">
                 {this.state.selectedDateRange}<i className="fa fa-calendar pull-right" style={{ marginTop: "0.2em" }}></i>
             </Button>
             <DateRangePicker ref="dateRangePicker" mode={this.state.dateRange.mode} beginDate={this.state.dateRange.beginDate} endDate={this.state.dateRange.endDate}
             progression={this.state.dateRange.progression} onChange={this.dateRangeChange} applySelection={this.applyDateRange}positionClass="customDatePicker2" /></div>;
     };

     fixedDateChange = () => {
       this.updateStateImmutable({fixedDate : !this.state.fixedDate });
     };

   drillDownDOM = () => {
       return <TabPage caption={this.s("DrillDowns")} dataHelp="DrillDowns">
                <div className="col-md-3"  style={{height:"80px"}}>
                    <DropDown2 caption={this.s("DrillBy")} options={[
                        {caption:this.s("Measure"),value:"measure"},
                        {caption:this.s("Dimension"),value:"dimension"}]}
                        onChange={this.updateDrillBy} optionsText="caption" optionsValue="value" value={this.state.drillBy} />
                </div>
                 <div className="col-md-6"  style={{height:"80px"}}>
                    {this.breadcrumbDOM()}
                 </div>
                 <div className="col-md-3"  style={{height:"80px"}}>
                </div>
                <div className="col-md-3" style={{paddingTop:"50px",height:"322px"}}>
                    {(this.state.drillBy === "measure") ? this.measureTargetDOM(this.state.currentDrillLevel,DisplayPosition.Left) : null}
                    {(this.state.drillBy === "dimension") ? this.dimensionTargetDOM(this.state.currentDrillLevel,DisplayPosition.Left) : null}
                </div>
                <div className="col-md-6">
                    <div className="panel panel-success">
                    <div className="panel-body no-padding"  style={{height:"300px"}}>
                        <div style={{width:"100%","height":"70%"}}>
                            <div ref="chartArea2"  className="widgetDesignerPreview">
                            </div>
                        </div>
                        <div className="small p-r-5 pull-right">
                            { this.s("PreviewText") }
                        </div>
                    </div>
                </div>
                </div>
                <div className="col-md-3"  style={{paddingTop:"50px",height:"322px"}}>
                    {(this.state.drillBy === "measure") ? this.measureTargetDOM(this.state.currentDrillLevel,DisplayPosition.Right) : null}
                    {(this.state.drillBy === "dimension") ? this.dimensionTargetDOM(this.state.currentDrillLevel,DisplayPosition.Right) : null}
                </div>
                <div className="col-md-3"></div>
                <div className="col-md-6">
                    {(this.state.drillBy === "measure") ? this.measureTargetDOM(this.state.currentDrillLevel,DisplayPosition.Bottom) : null}
                    {(this.state.drillBy === "dimension") ? this.dimensionTargetDOM(this.state.currentDrillLevel,DisplayPosition.Bottom) : null}
                </div>
                <div className="col-md-3"></div>
               </TabPage>;
   };

   render() {
       return <div>
           <Dialog title={this.s("AddDrillDowns") } actions={this.actions} modal={true}  open={this.state.drillDownQuestionOpen}>
               {this.s("DrillDownsMessage") }
           </Dialog>
           <WizardContainer ref="wizardAdd"  buttonTexts={{ first: this.gs("StartOver"), next: this.gs("Next"), previous: this.gs("Previous"), finish: this.gs("CreateWidget") }} onNext={this.wizardNext}>
               <TabPage caption={this.s("MeasuresDimensions") } dataHelp="Measure">
                   {this.measuresAndDimensionsDOM() }
               </TabPage>
               { (this.state.selectedWidget != null && this.state.selectedWidget.drillDowns > 0) ? this.drillDownDOM() : null }
               <TabPage caption={this.s("Options") } dataHelp="Options">
                   <div className="row">
                       <div className="col-md-3">
                           <TextBox caption={this.s("Name") } value={this.state.name} type="text" onChange={_.partial(this.updateState, "name") } required={true}/>
                       </div>
                       <div className="col-md-9">
                            <TextBox caption={this.s("Description") } value={this.state.description} onChange={_.partial(this.updateState, "description") } type="text" required={false}/>
                       </div>
                   </div>
                   <div className="col-md-3 m-b-20">
                       <CheckBox caption={this.s("FixedDate") } value="FixedDate" checked={this.state.fixedDate} onChange={this.fixedDateChange}/>
                       { (this.state.fixedDate !== false) ? this.datePickerDOM() : null }
                       {this.optionsDOM() }
                   </div>

                   <div className="col-md-9 m-b-20" style={{ height: "400px" }}>
                       <div className="panel panel-success">
                           <div className="panel-body no-padding"  style={{ height: "334px" }}>
                               <div  style={{ width: "100%", "height": "98%" }}>
                                   <div ref="chartArea3"  className="widgetDesignerPreview">
                                   </div>
                               </div>
                               <div className="small p-r-5 pull-right">
                                   { this.s("PreviewText") }
                               </div>
                           </div>
                       </div>
                   </div>

               </TabPage>
               <TabPage caption={this.s("Filters") } dataHelp="Filters">
                   <div className="col-md-12 scrollable m-b-20" style={{ height: "450px" }}>
                       {this.filtersDOM() }
                   </div>
               </TabPage>
           </WizardContainer></div>;
   }
   static childContextTypes: React.ValidationMap<any> = {
       muiTheme : React.PropTypes.object
   };

   getChildContext() {
        return {
            muiTheme: ThemeManager.getMuiTheme(muiTheme),
        };
    };
}
// export default DragDropContext<IWidgetDesignerProps>(HTML5Backend)(WidgetDesigner);
