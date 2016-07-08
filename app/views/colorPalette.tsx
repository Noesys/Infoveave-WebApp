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
import * as Constants from "./../data/constants";
import { ApplicationView, IApplicationViewBaseState } from "./applicationView";
import { PageContainer } from "./../components/pageContainer";
import { ModalDialog, ModalContent, ModalDialogSize} from "./../components/modalDialogs";
import { Form, TextBox, DropDown, Button} from "./../components/formComponents";
import { DataSourceWithMeasuresDimensions, Dimension, Measure } from "./../data/models";
import { DataTable, ColumnType } from "./../components/dataTable";
import * as _s from "underscore.string";
import * as _ from "lodash";
import { InfoboardStore, DataSourceStore } from "./../data/dataStore";
import InputColor from "react-input-color";
import Select from "react-select";
let SelectAsync: any = Select.Async;


interface IColorPaletteState extends IApplicationViewBaseState {
    dataSources: DataSourceWithMeasuresDimensions[];
    selectedDataSource: DataSourceWithMeasuresDimensions;
    dimensions: Dimension[];
    dimensionItem: { value: any, label: string };
    colorMap: {
        randomId: string,
        datasource: DataSourceWithMeasuresDimensions,
        dimension: Dimension,
        dimensionItem: { value: string; label: string; } ,
        color: string
    }[];
}

export class ColorPalette extends ApplicationView<{}, IColorPaletteState> {
    private _dataStore = new InfoboardStore();
    private _dataSourceStore = new DataSourceStore();
    constructor() {
        super();
        this.loadLanguage("colorPalette");
    }

    componentWillMount() {
        this.setState({
            helpSteps: [],
            loading: true,
            dataSources: [],
            selectedDataSource: null,
            dimensionItem: null,
            dimensions: [],
            colorMap: []
        });
        Promise.all([
            this._dataStore.GetDataSources(),
            this._dataSourceStore.GetColorPalette()
        ]).then((results) => {
            let colorMap = _.map(results[1].data, (cm, ix) => {
                return {
                    randomId:  this.randomId + "f" + ix,
                    datasource: _.find(results[0].data, (d) => d.id === cm.dataSourceId),
                    dimension: _.find(results[0].data, (d) => d.id === cm.dataSourceId).dimensions.find(dim => dim.id === cm.dimensionId),
                    dimensionItem : { label : cm.dimensionItem, value : cm.dataSourceId + cm.dimensionItem },
                    color: cm.color
                };
            });
            this.updateStateImmutable({
                loading: false,
                dataSources: results[0].data,
                colorMap: colorMap
            });
        });
    }

    addColor = () => {
        let colorPicker = { randomId: this.randomId + "f" + this.state.colorMap.length, datasource: null, dimension: null, dimensionItem: null, color: null };
        let newColor = _.cloneDeep(this.state.colorMap);
        newColor.push(colorPicker);
        this.updateStateImmutable({ colorMap: newColor });
    };

    removeColor = (randomId) => {
        let newColor = _.cloneDeep(this.state.colorMap);
        newColor = _.filter(newColor, (nf) => nf.randomId !== randomId);
        this.updateStateImmutable({ colorMap: newColor });
    };

    dimensionItemCallback = (options: Dimension, query: string): Promise<any[]> => {
        return new Promise((resolve) => {
            if (_s.isBlank(query) || (options == null)) {
                resolve([]);
                return;
            }
            let dimension = _.find(this.state.dimensions, (d) => d.query === options.query);
            this.loadDimensionsItems(dimension.dataSourceId, dimension.id, "").then((data) => {
                let dimensionItems = _.map(data, (di) => {  return {value: dimension.dataSourceId + di, label: di}; });
                let newDimensionItems = _.filter(dimensionItems, (di) => ! _.includes(_.cloneDeep(this.state.colorMap).map(cdi => (cdi.dimensionItem != null) ? cdi.dimensionItem.value : null), di.value));
                resolve({ options: newDimensionItems });
           });
        });
    };

    loadDimensionsItems = (dataSourceId: number, options: number, query): Promise<string[]> => {
        return new Promise((callback) => {
            let newColor = _.cloneDeep(this.state.colorMap);
            this._dataStore.GetDimensionItems(dataSourceId, options, query).then((results) => {
                callback(results.data);
            }).catch((err) => {
                callback([]);
            });
        });
    };

    selectedDataSourceChange = (randomId: string, value: DataSourceWithMeasuresDimensions) => {
        let newColor = _.cloneDeep(this.state.colorMap);
        let fetchColor = _.find(newColor, (nf) => nf.randomId === randomId);
        fetchColor.datasource = value;
        if (value == null) {
            fetchColor.dimension = null;
            fetchColor.dimensionItem = null;
            this.updateStateImmutable({
                colorMap: newColor,
                dimensions: null,
                dimensionItem: null
            });
            return;
        }

        this.updateStateImmutable({
            colorMap: newColor,
            dimensions: _.filter(value.dimensions, d => !d.isDate)
        });
    };

    dimensionItemChange = (randomId: string, newValue: { label: string, value: string } | any) => {
        let newColor = _.cloneDeep(this.state.colorMap);
        let fetchcolor = _.find(newColor, (nf) => nf.randomId === randomId);
        fetchcolor.dimensionItem = newValue;
        this.updateStateImmutable({ colorMap: newColor });
    };

    dimensionChange = (randomId: string, value: Dimension) => {
        let newColor = _.cloneDeep(this.state.colorMap);
        let fetchcolor = _.find(newColor, (nf) => nf.randomId === randomId);
        fetchcolor.dimension = value;
        if (value == null) {
            fetchcolor.dimensionItem = null;
            this.updateStateImmutable({
                colorMap: newColor,
                dimensions: null,
                dimensionItem: null
            });
            return;
        }
        this.updateStateImmutable({ colorMap: newColor });
    };

    onColorChange = ( randomId: string, selectedColor ) => {
       let newColor = _.cloneDeep(this.state.colorMap);
       let fetchcolor = _.find(newColor, (nf) => nf.randomId === randomId);
       fetchcolor.color = selectedColor;
       this.updateStateImmutable({ colorMap: newColor });
    };

    saveClick = () => {
        if (this.state.colorMap.length === 0 || this.state.colorMap[0].datasource == null) return;
        let data = _.map(this.state.colorMap, (cm) => {
            return {
                dataSourceId: cm.datasource.id,
                dimensionId: cm.dimension.id,
                dimensionName: cm.dimension.name,
                dimensionItem: _s.titleize(cm.dimensionItem.label),
                color : cm.color
            };
        });
        this._dataSourceStore.SaveColorPalette(data).then((result) => {
            this.notify(Constants.ViewComponent.ColorPalette, "success", true, _s.sprintf(this.s("SavedSuccessFully")));
        });
    };

    buttonDOM = () => {
        return <div className="row" style={{ marginTop: 15 }}>
            <div className="col-md-2"><button type="button" className="btn btn-primary hint--bottom" onClick={this.addColor} >{this.s("AddColor") }</button></div>
            <div className="col-md-2"><button type="button" className="btn btn-primary hint--bottom" onClick={this.saveClick} >{this.s("Save") }</button></div>
        </div>;
    };

    colorDOM = () => {
        return _.map(this.state.colorMap, (cp, ix) => {
            let itemsSelectProps = {
                value: cp.dimensionItem,
                multi: false,
                minimumInput: 1,
                loadOptions: _.partial(this.dimensionItemCallback, cp.dimension),
                onChange: _.partial(this.dimensionItemChange, cp.randomId)
            };
            return <div key={"fb" + ix} className="row" style={{ "marginTop": "5px", "marginBottom": "5px" }}>
                <div className="col-md-2">
                    <Select options={this.state.dataSources} value={cp.datasource} labelKey="name" valueKey="id" onChange={_.partial(this.selectedDataSourceChange, cp.randomId) } />
                </div>
                <div className="col-md-2">
                    <Select options={this.state.dimensions} value={cp.dimension} clearable={false} labelKey="name" valueKey="id"  onChange={_.partial(this.dimensionChange, cp.randomId) } />
                </div>
                <div className="col-md-2">
                    <SelectAsync {...itemsSelectProps}/>
                </div>

                <div className="col-md-3 wrapper">
                    <input className="form-control" type="text" value={ cp.color } />
                    <InputColor value={ cp.color } defaultValue={ (cp.color) ? cp.color : "#345678" }  onChange={_.partial(this.onColorChange, cp.randomId)} />
                </div>
                <div className="col-md-1">
                    <button type="button" className="btn btn-danger" onClick={_.partial(this.removeColor, cp.randomId) } ><i className="fa fa-trash-o"/></button>
                </div>
            </div>;
        });
    };

    render() {
        return <PageContainer showBreadCrumb={true} breadCrumbPath={[{ title: this.s("ColorPalette"), link: "#" }]}  loading={this.state.loading} onHelpClick={null}>
            <Form className="p-t-15" ref="form">
                <div className="panel panel-white">
                    <div className="panel-body">
                        <div className="row" style={{marginBottom:20}}>
                            <h4>{this.s("ColorPalette")}</h4>
                            <div>{this.s("ColorPaletteMessage")}</div>
                        </div>
                        <div className="row">
                            {this.colorDOM() }
                            {this.buttonDOM() }
                        </div>
                    </div>
                </div>
            </Form>
            {this.helperDOM() }
        </PageContainer>;
    }
}
