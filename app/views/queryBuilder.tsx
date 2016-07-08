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
import { TabContainer, WizardContainer, TabPage } from "./../components/tabContainer";
import { Form, TextBox, DropDown2, Button, CheckBox, RadioList} from "./../components/formComponents";
import { DataTable, ColumnType } from "./../components/dataTable";
import * as _s from "underscore.string";
import * as _ from "lodash";
import { CanAccess } from "./../components/canAccess";
import { DataSource } from "./../data/models";
import { QueryBuilderStore } from "./../data/dataStore";
import Select from "react-select";
import ReactDataGrid from "react-data-grid/addons";
import DateRangePicker  from "react-bootstrap-daterangepicker";
import RefreshIndicator from "material-ui/lib/refresh-indicator";
import { MentionsInput, Mention } from "react-mentions";
import { getBaseStyle } from "./../components/muiTheme";
import { ISelectField, IWhereField, TableWithColumnMapping } from "./../data/models";
import { ParameterEditor } from "./../components/reportScheduler";
let SelectAsync: any = Select.Async;

interface IWhereFieldContainer {
    comparer: string;
    fields: IWhereField[];
    sets: IWhereFieldContainer[];
}

interface IQueryBuilderEditorProps {
    params: {
        id: number;
    };
}

interface IQueryBuilderState extends IApplicationViewBaseState {
    dataSources: DataSource[];
    reportName: string;
    selectedDataSource: DataSource;
    availableTables: TableWithColumnMapping[];
    selectedTable: TableWithColumnMapping;
    availableFields: { label: string, value: string }[];
    selectFields: ISelectField[];
    groupByFields: { label: string, value: string }[];
    orderByFields: { field: {label: string, value: string }, sort: string  }[];
    whereFields: IWhereFieldContainer;
    sql: string;
    previewRows: any[];
    parameters: IWhereField[];
    newColumnCalculation: string;
    newColumnCalculationRefers: any[];
}

export class QueryBuilder extends ApplicationView<IQueryBuilderEditorProps, IQueryBuilderState> {
    Module = "Reports";
    View = "QueryBuilder";
    private _dataStore: QueryBuilderStore = new QueryBuilderStore();
    constructor() {
        super();
        this.loadLanguage("queryBuilder");
    }

    componentWillMount() {
        this.setState({ loading: false, helpSteps: [], dataSources: [], selectedDataSource: null, availableTables: [], selectedTable: null, reportName: null, availableFields: [],
            selectFields: [{ function: null, field: null, display: null} ], groupByFields: [], orderByFields: [],
            whereFields: { comparer: "and", fields: [{ field: null, comparer: null, expression: null }], sets: []},
            sql: null, newColumnCalculation: "", newColumnCalculationRefers: [], previewRows: [], parameters: []
        });
        this._dataStore.GetDataSources().then((results) => {
            this.updateStateImmutable({ dataSources: results.data});
        });
    };

    selectedDataSourceChange = (value) => {
        this.updateStateImmutable({ selectedDataSource: value, availableTables: [], selectedTable: null, availableFields: [] });
        if (value == null) return;
        this._dataStore.GetDataSourceTables(value.id).then((results) => {
            this.updateStateImmutable({ availableTables: results.data });
        });
    };

    selectedTableChange = (value) => {
        let fields = (value != null) ? _.map(value.columnMapping as any, (s: any) => { return { label: s.displayName, value: s.tableName, type: s.type }; }) : [];
        this.updateStateImmutable({ selectedTable: value, availableFields: fields });
    }
    selectDOM = () => {
        return <div className="col-md-12">
            <div className="row">
                <div className="col-md-3">
                    <h5>{this.s("Function")}</h5>
                </div>
                <div className="col-md-3">
                    <h5>{this.s("Field")}</h5>
                </div>
                <div className="col-md-3">
                    <h5>{this.s("SelectAs")}</h5>
                </div>
                <div className="col-md-3">
                    <Button type="button" title={this.s("AddField")} onClick={this.addSelectField} dataHelp="AddField"><i className="fa fa-plus"/></Button>
                </div>
            </div>
            {this.selectItemsDOM()}
        </div>;
    };

    selectFunction = ["sum", "count", "min", "max", "avg", "distinct"];

    selectItemsDOM = () => {
        return _.map(this.state.selectFields, (field, ix) => {
            return <div className="row" key={"qbsf" + ix} style={{padding:"5px 0"}}>
                <div className="col-md-3">
                    <Select   options={_.map(this.selectFunction, (f) => { return { label: f, value: f}; }) } value={field.function} onChange={_.partial(this.selectFieldValueChange,ix,"function")} />
                </div>
                <div className="col-md-3">
                    <Select required= {true}  options={this.state.availableFields} onChange={_.partial(this.selectFieldValueChange,ix,"field")} value={field.field}/>
                </div>
                <div className="col-md-3">
                    <input required= {true}  className="form-control" onChange={_.partial(this.selectFieldValueChange,ix,"display")} value={field.display} />
                </div>
                <div className="col-md-3">
                    { (ix > 0) ? <Button type="button"  className="btn-danger" onClick={_.partial(this.removeSelectField,ix)}  ><i className="fa fa-trash-o"  /></Button> : <div/> }
                </div>
            </div>;
        });
    };

    addSelectField = () => {
       let fields = _.clone(this.state.selectFields);
       fields.push({ function : null, field: null, display: null });
       this.updateStateImmutable({ selectFields: fields});
    };

    removeSelectField = (ix: number) => {
       let fields = _.clone(this.state.selectFields);
       let removed = fields.splice(ix, 1);
       this.updateStateImmutable({ selectFields: fields});
    };

    selectFieldValueChange = (ix: number, field: string, value: any) => {
       let fields = _.clone(this.state.selectFields);
       let currentField = fields[ix];
       if (field !== "display" && value != null) {
           currentField[field] = value.value;
       }
       if (field === "display" && value != null) {
           currentField[field] = value.target.value;
       }
       if (field === "field") {
           currentField["display"] = (value == null) ? null : value.label;
       }
       this.updateStateImmutable({ selectFields: fields});
    };

    ordeyByDOM = () => {
        return <div className="col-md-12">
            <div className="row">
                <div className="col-md-3">
                    <h5>{this.s("Field")}</h5>
                </div>
                <div className="col-md-3">
                    <h5>{this.s("Order")}</h5>
                </div>
                <div className="col-md-3">
                    <Button type="button" title={this.s("AddField")} data-help="AddField" onClick={this.addOrderByField}><i className="fa fa-plus"/></Button>
                </div>
            </div>
            {this.OrderByItemsDOM()}
        </div>;
    };

    sortOrder = () => [{ label: this.s("Ascending"), value: "asc" }, { label: this.s("Descending"), value: "desc" }];

    OrderByItemsDOM = () => {
        return _.map(this.state.orderByFields, (field, ix) => {
            return <div className="row" key={"qbsf" + ix} style={{padding:"5px 0"}}>
                <div className="col-md-3">
                    <Select data-help="field" options={this.state.availableFields} onChange={_.partial(this.orderByFieldValueChange,ix,"field")} value={field.field}/>
                </div>
                <div className="col-md-3">
                    <Select options={this.sortOrder()} onChange={_.partial(this.orderByFieldValueChange,ix,"sort")} value={field.sort} />
                </div>
                <div className="col-md-3">
                    <Button type="button" className="btn-danger" onClick={_.partial(this.removeOrderByField,ix)}><i className="fa fa-trash-o" /></Button>
                </div>
            </div>;
        });
    };

    addOrderByField = () => {
       let fields = _.clone(this.state.orderByFields);
       fields.push({ field: null, sort: null });
       this.updateStateImmutable({ orderByFields: fields});
    };

    removeOrderByField = (ix: number) => {
       let fields = _.clone(this.state.orderByFields);
       let removed = fields.splice(ix, 1);
       this.updateStateImmutable({ orderByFields: fields});
    };

    orderByFieldValueChange = (ix: number, field: string, value: any) => {
       let fields = _.clone(this.state.orderByFields);
       let currentField = fields[ix];
       currentField[field] = (field === "sort" && value != null) ? value.value : value;
       this.updateStateImmutable({ orderByFields: fields});
    };

    getComparer = (type: string) => {
        if (type === "Text" || type === "Boolean") {
            return [
                {label: "Equal", value: "equal"},
                {label: "Not Equal", value: "notequal"},
                {label: "In", value: "in"},
                {label: "Not In", value: "notin"},
                {label: "Like", value: "like"},
                {label: "Is Empty", value: "isNull"},
                {label: "Is Not Empty", value: "isNotNull"},
                {label: "Ask Later", value: "parameter"}
                ];
        }
        if (type === "Decimal" || type === "Integer") {
            return [
                {label: "Equal", value: "equal"},
                {label: "Not Equal", value: "notequal"},
                {label: "In", value: "in"},
                {label: "Not In", value: "notin"},
                {label: "Greater Than", value: "greaterThan"},
                {label: "Greater Than or Equals", value: "greaterThanEquals"},
                {label: "Less Than", value: "lessThan"},
                {label: "Less Than or Equals", value: "lessThanEquals"},
                {label: "Is Empty", value: "isNull"},
                {label: "Is Not Empty", value: "isNotNull"},
                {label: "Ask Later", value: "parameter"}
                ];
        }
        if (type === "Date") {
            return [
                {label: "Between", value: "between"},
                {label: "Ask Later", value: "parameter"}
                ];
        }
        return [];
    };

    whereFieldCompareChange = (path: string, value: string) => {
        let whereField = _.cloneDeep(this.state.whereFields);
        let traverseSteps = path.split("|");
        traverseSteps.splice(0, 1);
        let containerToUse = whereField;
        if (traverseSteps.length > 0) {
            _.each(traverseSteps, (step) => {
                containerToUse = containerToUse.sets[parseInt(step, 10)];
            });
        }
        containerToUse.comparer = value;
        this.updateStateImmutable({whereFields: whereField });
    };

    whereFieldItemColumnChange = (path: string, ix: number, value: any) => {
        let whereField = _.cloneDeep(this.state.whereFields);
        let traverseSteps = path.split("|");
        traverseSteps.splice(0, 1);
        let containerToUse = whereField;
        if (traverseSteps.length > 0) {
            _.each(traverseSteps, (step) => {
                containerToUse = containerToUse.sets[parseInt(step, 10)];
            });
        }
        containerToUse.fields[ix].field = value;
        this.updateStateImmutable({whereFields: whereField });
    };

    whereFieldItemComparerChange = (path: string, ix: number, value: any) => {
        let whereField = _.cloneDeep(this.state.whereFields);
        let traverseSteps = path.split("|");
        traverseSteps.splice(0, 1);
        let containerToUse = whereField;
        if (traverseSteps.length > 0) {
            _.each(traverseSteps, (step) => {
                containerToUse = containerToUse.sets[parseInt(step, 10)];
            });
        }
        containerToUse.fields[ix].comparer = (value != null) ? value.value : null;
        containerToUse.fields[ix].expression = null;
        this.updateStateImmutable({whereFields: whereField });
    };

    whereFieldItemValueChange = (path: string, ix: number, field: { label: string, value: string, type: string, }, comparer: string, value: any) => {
        let whereField = _.cloneDeep(this.state.whereFields);
        let traverseSteps = path.split("|");
        traverseSteps.splice(0, 1);
        let containerToUse = whereField;
        if (traverseSteps.length > 0) {
            _.each(traverseSteps, (step) => {
                containerToUse = containerToUse.sets[parseInt(step, 10)];
            });
        }
        if (value == null) {
            containerToUse.fields[ix].expression = null;
            this.updateStateImmutable({whereFields: whereField });
            return;
        }
        if (_.includes(["like"], comparer)) containerToUse.fields[ix].expression = value;
        if (_.includes(["greaterthan", "greaterthanequals", "lessthan", "lessthanequals"], comparer)) {
            if (field.type === "Integer") containerToUse.fields[ix].expression = parseInt(value, 10);
            if (field.type === "Decimal") containerToUse.fields[ix].expression = parseFloat(value);
        };
        if (_.includes(["equal", "notequal"], comparer)) {
            containerToUse.fields[ix].expression = value;
        }
        if (_.includes(["in", "notin"], comparer)) {
            containerToUse.fields[ix].expression = value;
        }
        if (comparer === "between") {
            containerToUse.fields[ix].expression = value;
        }
        this.updateStateImmutable({whereFields: whereField });
    };

    whereFieldItemDeleteClick = (path: string, ix: number) => {
        let whereField = _.cloneDeep(this.state.whereFields);
        let traverseSteps = path.split("|");
        traverseSteps.splice(0, 1);
        let containerToUse = whereField;
        if (traverseSteps.length > 0) {
            _.each(traverseSteps, (step) => {
                containerToUse = containerToUse.sets[parseInt(step, 10)];
            });
        }
        containerToUse.fields.splice(ix, 1);
        this.updateStateImmutable({whereFields: whereField });
    };

    whereContainerAddClick = (path: string, type: string) => {
        let whereField = _.cloneDeep(this.state.whereFields);
        // path Traversal Code
        let traverseSteps = path.split("|");
        traverseSteps.splice(0, 1);
        let containerToUse = whereField;
        if (traverseSteps.length > 0) {
            _.each(traverseSteps, (step) => {
                containerToUse = containerToUse.sets[parseInt(step, 10)];
            });
        }
        if (type === "field") {
            containerToUse.fields.push({ field: null, comparer: null, expression: null });
        } else {
            containerToUse.sets.push({ comparer : "and", fields: [{ field: null, comparer: null, expression: null }], sets: [] });
        }
        this.updateStateImmutable({whereFields: whereField });
    };

    whereContainerDeleteClick = (path: string) => {
        let whereField = _.cloneDeep(this.state.whereFields);
        // path Traversal Code
        let traverseSteps = path.split("|");
        traverseSteps.splice(0, 1);
        let containerToUse = whereField;
        if (traverseSteps.length > 0) {
            for (let i = 0; i < traverseSteps.length - 1; i++) {
                containerToUse = containerToUse.sets[parseInt(traverseSteps[i], 10)];
            }
        }
        containerToUse.sets.splice(parseInt(_.last(traverseSteps), 10), 1);
        this.updateStateImmutable({ whereFields: whereField });
    };

    getItems = (dataSourceId: number, field: string, tableName: string, query: string): Promise<{options: string[]}> => {
        return new Promise((resolve, reject) => {
            this._dataStore.GetFieldItems(dataSourceId, field, tableName, query).then((results) => {
                resolve({ options: _.map(results.data, (d) => { return { label: d, value: d }; }) });
            }).catch(() => {
                reject();
            });
        });
    };

    whereFieldValueDOM = (path: string, ix: number, field: { label: string, value: string, type: string }, comparer: string, value: any) => {
        if (field == null || _.includes([null, "parameter", "isNull", "isNotNull"], comparer)) return <div/>;
        if (_.includes(["like"], comparer)) return <input type="text" value={value} className="form-control" onChange={(e) => { this.whereFieldItemValueChange(path, ix,field,comparer, (e.target as HTMLInputElement).value); }}/>;
        if (_.includes(["greaterthan", "greaterthanequals", "lessthan", "lessthanequals"], comparer))
            return <input type="number" value={value} className="form-control"onChange={(e) => { this.whereFieldItemValueChange(path, ix,field,comparer, (e.target as HTMLInputElement).value); }}/>;
        let selectProps = {
            minimumInput: 2,
            loadOptions: _.partial(this.getItems, this.state.selectedDataSource.id, field.value, this.state.selectedTable.tableName),
            onChange: _.partial(this.whereFieldItemValueChange, path, ix, field, comparer),
            value: value
        };
        if (_.includes(["equal", "notequal"], comparer)) {
            return <SelectAsync {...selectProps} />;
        }
        if (_.includes(["in", "notin"], comparer)) {
            return <SelectAsync multi={true} {...selectProps} />;
        }
        if (comparer === "between") {
            let displayValue = (value == null || value.length === 0) ? "" : (value[0].format("DD-MMM-YYYY") + " to " + value[1].format("DD-MMM-YYYY"));
            let props = {};
            if  (value != null && value.length > 0) {
                props["startDate"] = value[0];
                props["endDate"] = value[1];
            }
            return  <DateRangePicker ranges={[]} {...props} onEvent={(event,picker) => {
                let val = [picker.startDate, picker.endDate];
                this.whereFieldItemValueChange(path, ix, field, comparer, val);
            }}>
                    <div className="input-group date">
                      <input type="text" className="form-control" value={displayValue} />
                      <span className="input-group-addon"><i className="fa fa-calendar"></i></span>
                    </div>
            </DateRangePicker>;
        }
    };

    whereBuilderDOM = (container: IWhereFieldContainer, path: string) => {
       return <div key={"wcb" + path} className="card full-width" style={{minHeight:"50px"}}>
                <div style={{marginLeft:"20px", marginTop:"-10px"}}>
                    <div className="btn-group">
                        <button type="button" className={"btn btn-complete " + (("and" === container.comparer) ? "active" : "")} onClick={_.partial(this.whereFieldCompareChange,path,"and")} data-help="And"> And </button>
                        <button type="button" className={"btn btn-complete " + (("or" === container.comparer) ? "active" : "")} onClick={_.partial(this.whereFieldCompareChange,path,"or")} data-help="Or"> Or </button>
                      </div>
                </div>
                <div className="pull-right" style={{marginRight:"20px", marginTop:"-10px"}}>
                    <div className="btn-group btn-group-sm">
                        <button type="button" className={"btn btn-primary btn-complete"} onClick={_.partial(this.whereContainerAddClick,path,"group")} data-help="AddGroup" > Add Group </button>
                        <button type="button" className={"btn btn-primary btn-complete"} onClick={_.partial(this.whereContainerAddClick,path,"field")} data-help="AddField"> Add Field </button>
                        {(path !== "") ? <button type="button" className={"btn btn-danger btn-complete"} onClick={_.partial(this.whereContainerDeleteClick,path,"field")} data-help="Deletefield"> Delete Group </button> : "" }
                    </div>
                </div>
                <div>
                {
                    _.map(container.fields,(field,ix) => {
                        return <div key={path + "fl" + ix} style={{padding: "10px", minHeight:"60px"}} >
                            <div className="col-md-3">
                                <Select options={this.state.availableFields} value={field.field} onChange={_.partial(this.whereFieldItemColumnChange,path,ix)} />
                            </div>
                            <div className="col-md-3">
                                <Select options={this.getComparer((field.field == null) ? null : field.field.type)} value={field.comparer} onChange={_.partial(this.whereFieldItemComparerChange,path,ix)} />
                            </div>
                            <div className="col-md-3">
                                {this.whereFieldValueDOM(path, ix, field.field, field.comparer, field.expression)}
                            </div>
                            <div className="col-md-3">
                                { (ix > 0) ? <button type="button" className={"btn btn-danger btn-sm btn-complete"} data-help="Deletefield"
                                    onClick={_.partial(this.whereFieldItemDeleteClick,path, ix)} > <i className="fa fa-trash-o" /> </button> : null }
                            </div>
                        </div>;
                    })
                }
                </div>
                <div style={{paddingLeft:"20px", paddingRight:"20px"}}>
                {
                    _.map(container.sets,(set, ix) => this.whereBuilderDOM(set, path + "|" + ix))
                }
                </div>
       </div>;
    };

    reportPreview = () => {
        if (!(this.refs["form"] as any).isValid()) {
            this.notify(Constants.ViewComponent.QueryBuilder, "error", false, _s.sprintf(this.s("selectallFileds")));
            return;
        }
        // Show The Parameters only if there are any parameters selected in where filter
        let parameters = this.getParameterRecursive(this.state.whereFields);
        parameters = _.uniqBy(parameters, (p) => p.field.value);
        this.updateStateImmutable({ sql: null, previewRows: [], parameters: parameters });
        if (parameters.length > 0) {
            (this.refs["modalParameters"] as ModalDialog).showDialog();
            return;
        }
        this.generateSQLAndPreview();
    };

    clear = () => {
        this.updateStateImmutable({ sql: null, newColumnCalculation: "", newColumnCalculationRefers: [], previewRows: [], parameters: [] });
    };

    getParameterFromMentions = (data: { id: any, display: any }[]) => {
        return _.map(data, (p) => {
            let iwhereFled = {
                field: { label: p.display, value: p.id },
                comparer: "parameter",
                expression: null
            } as IWhereField;
            return iwhereFled;
        });
    };

    manualPreview = () => {
        if (!(this.refs["manualQueryform"] as any).isValid()) {
            this.notify(Constants.ViewComponent.QueryBuilder, "error", false, _s.sprintf(this.s("selectallFileds")));
            return;
        }
        this.updateStateImmutable({ sql: this.state.newColumnCalculation, previewRows: [], parameters: null });
        let parameters = this.getParameterFromMentions(this.state.newColumnCalculationRefers);
        parameters = _.uniqBy(parameters, (p) => p.field.value);
        this.updateStateImmutable({ sql: null, previewRows: [], parameters: parameters });
        if (parameters.length > 0) {
            (this.refs["modalManualParameters"] as ModalDialog).showDialog();
            return;
        }
        this.generateManualSQLAndPreview();
    };

    saveManualReport = () => {
        if (!(this.refs["manualQueryform"] as any).isValid()) {
            this.notify(Constants.ViewComponent.QueryBuilder, "error", false, _s.sprintf(this.s("selectallFileds")));
            return;
        }
        let parameters = this.getParameterFromMentions(this.state.newColumnCalculationRefers);
        parameters = _.uniqBy(parameters, (p) => p.field.value);
        let data = {
            parameters: parameters
        };
        let dataReport = {
            name: this.state.reportName,
            jsonSQLQuery: data,
            query: this.state.newColumnCalculation,
            dataSourceId: this.state.selectedDataSource.id
        };
        if (this.props.params.id === null || this.props.params.id === undefined) {
            this._dataStore.SaveManualSQLQuery(dataReport).then((results) => {
                this.notify(Constants.ViewComponent.QueryBuilder, "success", true, _s.sprintf(this.s("AddedSuccessFully")));
                this.navigateTo("/queryBuilder/" + results.data.id);
            }).catch((error) => {
                this.notify(Constants.ViewComponent.QueryBuilder, "error", false, _s.sprintf(this.s("SaveError")));
            });
        } else {
            this._dataStore.UpdateManualSQLQuery(this.props.params.id, dataReport).then((results) => {
                this.notify(Constants.ViewComponent.QueryBuilder, "success", true, _s.sprintf(this.s("AddedSuccessFully")));
                this.navigateTo("/queryBuilder/" + results.data.id);
            }).catch((error) => {
                this.notify(Constants.ViewComponent.QueryBuilder, "error", false, _s.sprintf(this.s("SaveError")));
            });
        }
    };

    saveReport = () => {
        if (!(this.refs["form"] as any).isValid()) {
            this.notify(Constants.ViewComponent.QueryBuilder, "error", false, _s.sprintf(this.s("selectallFileds")));
            return;
        }
        let parameters = this.getParameterRecursive(this.state.whereFields);
        parameters = _.uniqBy(parameters, (p) => p.field.value);
        let data = {
            selectFields: this.state.selectFields,
            groupByFields: this.state.groupByFields,
            orderByFields: this.state.orderByFields,
            whereFields: this.state.whereFields,
            parameters: parameters
        };
        let dataReport = {
            name: this.state.reportName,
            jsonSQLQuery: data,
            dataSourceId: this.state.selectedDataSource.id
        };
        if (this.props.params.id === null || this.props.params.id === undefined) {
            this._dataStore.SaveSQLQuery(dataReport).then((results) => {
                this.notify(Constants.ViewComponent.QueryBuilder, "success", true, _s.sprintf(this.s("AddedSuccessFully")));
                this.navigateTo("/queryBuilder/" + results.data.id);
            }).catch((error) => {
                this.notify(Constants.ViewComponent.QueryBuilder, "error", false, _s.sprintf(this.s("SaveError")));
            });
        } else {
            this._dataStore.UpdateSQLQuery(this.props.params.id, dataReport).then((results) => {
                this.notify(Constants.ViewComponent.QueryBuilder, "success", true, _s.sprintf(this.s("AddedSuccessFully")));
                this.navigateTo("/queryBuilder/" + results.data.id);
            }).catch((error) => {
                this.notify(Constants.ViewComponent.QueryBuilder, "error", false, _s.sprintf(this.s("SaveError")));
            });
        }
    };

    generateManualSQLAndPreview = () => {
        (this.refs["modalManualParameters"] as ModalDialog).hideDialog();
        let data = {
            query: this.state.newColumnCalculation.replace("(columnName:__id__)", " ").replace("(table:__id__)", " ").replace("(columnName:__id__)", " "),
            parameters: this.state.parameters
        };
        this._dataStore.GetManualSQLQuery(this.state.selectedDataSource.id, data).then((results) => {
            if (JSON.parse(results.data.result).length === 0)
                this.notify(Constants.ViewComponent.QueryBuilder, "success", true, _s.sprintf(this.s("Nodata")));
            this.updateStateImmutable({ sql: results.data.query, previewRows: JSON.parse(results.data.result) });
            (this.refs["modalPreview"] as ModalDialog).showDialog();
        }).catch((error) => {
            this.updateStateImmutable({ sql: error["data"]["message"], previewRows: [] });
            this.notify(Constants.ViewComponent.QueryBuilder, "error", false, _s.sprintf(this.s("GenerateError")));
            (this.refs["modalPreview"] as ModalDialog).showDialog();
        });
    };

    generateSQLAndPreview = () => {
        (this.refs["modalParameters"] as ModalDialog).hideDialog();
        (this.refs["modalPreview"] as ModalDialog).showDialog();
        let data = {
            selectFields: this.state.selectFields,
            groupByFields: this.state.groupByFields,
            orderByFields: this.state.orderByFields,
            whereFields: this.state.whereFields,
            parameters: this.state.parameters
        };
        this._dataStore.GetSQLQuery(this.state.selectedDataSource.id, this.state.selectedTable.tableName, data).then((results) => {
            if (JSON.parse(results.data.result).length === 0)
                this.notify(Constants.ViewComponent.QueryBuilder, "success", true, _s.sprintf(this.s("Nodata")));
            this.updateStateImmutable({ sql: results.data.query, previewRows: JSON.parse(results.data.result) });
            (this.refs["modalPreview"] as ModalDialog).showDialog();
        }).catch((error) => {
            this.updateStateImmutable({ sql: error["data"]["message"], previewRows: [] });
            this.notify(Constants.ViewComponent.QueryBuilder, "error", false, _s.sprintf(this.s("GenerateError")));
        });
    };

    previewDOM = () => {
        return <div className="row">
            <div className="col-md-3">
                <h5>{this.s("SQL")}</h5>
                <textarea readOnly={true} value={this.state.sql} style={{width:"100%", height:"150px"}} />
            </div>
            <div className="col-md-9">
                <ReactDataGrid columns={(this.state.previewRows.length === 0) ? [] : _.map(_.keys(this.state.previewRows[0]),(k) => { return { key: k, name: k, width : 150 }; })} minHeight={350} height={350} width="100%" minWidth="100%"
                      enableCellSelect={true} rowGetter={this.previewRowGetter} rowsCount={this.state.previewRows.length}/>
            </div>
        </div>;
    };

    newColumnCalculationChange = (ev, newVaue, newPlainText, mentions) => {
        this.updateStateImmutable({ newColumnCalculation : newVaue});
        if (JSON.stringify(mentions) === JSON.stringify(this.state.newColumnCalculationRefers)) {
            return;
        };
        let columns = _.map(mentions, (m: any) => {
            return { key: m.id, name: m.id, width: 150, resizable: true };
        });
        columns = _.uniqBy(columns, (m) => m.key);
        let paramMentions  = _.find(mentions , ( m: any) =>  m.type === "columnValue" );
        let filterMentions  = _.filter(mentions , ( m: any) =>  m.type === "columnValue" );
        this.updateStateImmutable({newColumnCalculationRefers: filterMentions, newColumnPreviewColumns: columns});
    };

    parameterUpdate = (field, values) => {
        let parameters = _.cloneDeep(this.state.parameters);
        let parameter = _.find(parameters, (p) => p.field.value === field.value);
        parameter.expression = values;
        this.updateStateImmutable({ parameters: parameters });
    };

    parametersDOM = () => {
       /* return _.map(this.state.parameters, (p, ix) => {
            if (p.field.type !== "Date") {
                return <div key={"ddpl" + ix}>
                <DropDown2 required= {true} caption={p.field.label} multiple={true} useAjax={true} value={_.find(this.state.parameters,(pm) => pm.field.value === p.field.value).expression} 
                    ajaxMethod={_.partial(this.getItems,this.state.selectedDataSource.id,p.field.value)}
                onChange={_.partial(this.parameterUpdate,p.field)}/>
                </div>;
            }
            let value = _.find(this.state.parameters, (pm) => pm.field.value === p.field.value).expression;
            let displayValue = (value == null || value.length === 0) ? "" : (value[0].format("DD-MMM-YYYY") + " to " + value[1].format("DD-MMM-YYYY"));
            let props = {};
            if  (value != null && value.length > 0) {
                props["startDate"] = value[0];
                props["endDate"] = value[1];
            }
             return <div key={"ddpl" + ix}>
                 <DateRangePicker ranges={[]} {...props} onEvent={(event,picker) => {
                let value = [picker.startDate, picker.endDate];
                this.parameterUpdate(p.field, value);
            }}>
                    <div className="input-group date">
                      <input type="text" className="form-control" value={displayValue} />
                      <span className="input-group-addon"><i className="fa fa-calendar"></i></span>
                    </div>
            </DateRangePicker>
            </div>;
        }); */
        if (this.state.selectedDataSource == null) return <div/>;
        return <ParameterEditor dataSourceId={this.state.selectedDataSource.id} parameters={this.state.parameters} dataStore={this._dataStore} parameterUpdate={this.parameterUpdate} />;
    };

    getParameterRecursive = (container: IWhereFieldContainer): IWhereField[] => {
        let items = _.filter(container.fields, (field) => field != null &&  field.comparer === "parameter");
        return _.union(items, _.flatten(_.map(container.sets, (s) => this.getParameterRecursive(s))));
    };

    previewRowGetter = (i: number) => {
        return this.state.previewRows[i];
    };

    render() {
        return (
            <PageContainer showBreadCrumb={true} breadCrumbPath={[{ title: this.s("QueryBuilder"), link: "#" }]} toolbar={null}  loading={this.state.loading}  onHelpClick={this.onHelpClick}>
                <ModalDialog title={this.s("Preview") } size={ModalDialogSize.Full} ref="modalPreview"
                    actions={null}>
                        <ModalContent noPadding={true}>
                            {this.previewDOM()}
                        </ModalContent>
                 </ModalDialog>
                  <ModalDialog title={this.s("Parameters") } size={ModalDialogSize.Medium} ref="modalParameters"
                    actions={null}>
                        <ModalContent noPadding={true}>
                            {this.parametersDOM()}
                            <br/><br/>
                            <Button type="button" onClick={this.generateSQLAndPreview} >{this.s("GenerateSQLPreview")}</Button>
                        </ModalContent>
                 </ModalDialog>
                  <ModalDialog title={this.s("Parameters") } size={ModalDialogSize.Medium} ref="modalManualParameters"
                    actions={null}>
                        <ModalContent noPadding={true}>
                            {this.parametersDOM()}
                            <br/><br/>
                            <Button type="button" onClick={this.generateManualSQLAndPreview} >{this.s("GenerateSQLPreview")}</Button>
                        </ModalContent>
                 </ModalDialog>
                    <TabContainer>
                        <TabPage caption={this.s("QueryBuilder")} visible ={this.canAccess(this.Module,this.View,"List")}>
                           <Form className="p-t-15" ref="form">
                                <div className="panel panel-white">
                                    <div className="panel-heading">
                                        <h4>{this.s("BasicInfo")}</h4>
                                     </div>
                                    <div className="panel-body">
                                        <div className="col-md-3">
                                            <TextBox dataHelp ="ReportName" caption={this.s("ReportName") } required ={true} type="text" onChange={_.partial(this.onFieldChange,"state","reportName")} value={this.state.reportName} />
                                        </div>
                                        <div className="col-md-3">
                                            <DropDown2  required ={true} caption={this.s("DataSource") }  multiple={false} options={this.state.dataSources}
                                                optionsText="name" optionsValue="id" onChange={this.selectedDataSourceChange} value={this.state.selectedDataSource}  dataHelp ="DataSource"/>
                                        </div>
                                        <div className="col-md-3">
                                            <DropDown2  required ={true} caption={this.s("Table") }  multiple={false} options={this.state.availableTables}
                                                optionsText="tableName" optionsValue="tableName" onChange={this.selectedTableChange} value={this.state.selectedTable}  dataHelp ="DataSource"/>
                                        </div>
                                        <div className="col-md-3">
                                            <br/>
                                            <Button dataHelp ="Preview" type="button"  onClick={this.reportPreview}>{this.s("Preview")}</Button>
                                            &nbsp;
                                            <Button dataHelp ="SaveAsReport" type="button" onClick={this.saveReport}>{this.s("SaveAsReport")}</Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="panel panel-white">
                                    <div className="panel-heading">
                                        <h4>{this.s("Select")}</h4>
                                    </div>
                                    <div className="panel-body">
                                        {this.selectDOM()}
                                    </div>
                                </div>
                                <div className="panel panel-white">
                                    <div className="panel-heading">
                                        <h4>{this.s("GroupBy")}</h4>
                                    </div>
                                    <div className="panel-body">
                                        <Select multi={true} value={this.state.groupByFields} options={this.state.availableFields} onChange={_.partial(this.onFieldChange,"state","groupByFields")}/>
                                    </div>
                                </div>
                                <div className="panel panel-white">
                                    <div className="panel-heading">
                                        <h4>{this.s("Where")}</h4>
                                    </div>
                                    <div className="panel-body">
                                        {this.whereBuilderDOM(this.state.whereFields,"")}
                                    </div>
                                </div>
                                <div className="panel panel-white">
                                    <div className="panel-heading">
                                        <h4>{this.s("OrderBy")}</h4>
                                    </div>
                                    <div className="panel-body">
                                        {this.ordeyByDOM()}
                                    </div>
                                </div>
                                {this.helperDOM() }
                              </Form>
                        </TabPage>
                         <TabPage caption={this.s("ManualQuery")} visible ={this.canAccess(this.Module,this.View,"List")}>
                        <Form className="p-t-15" ref="manualQueryform">
                                <div className="panel panel-white">
                                    <div className="panel-body">
                                        <div className="col-md-3">
                                            <TextBox caption={this.s("ReportName") } required ={true} type="text" onChange={_.partial(this.onFieldChange,"state","reportName")} value={this.state.reportName} />
                                        </div>
                                        <div className="col-md-3">
                                            <DropDown2 dataHelp ="DataSource" required ={true} caption={this.s("DataSource") }  multiple={false}
                                                options={this.state.dataSources} optionsText="name" optionsValue="id" onChange={this.selectedDataSourceChange} value={this.state.selectedDataSource}   />
                                        </div>
                                         <div className="col-md-6">
                                            <br/>
                                            <Button type="button" onClick={this.manualPreview}>{this.s("Preview")}</Button>
                                            &nbsp;
                                            <Button type="button" onClick={this.saveManualReport}>{this.s("Save")}</Button>
                                            &nbsp;
                                            <Button type="button" onClick={this.clear}>{this.s("Clear")}</Button>
                                        </div>
                                         <div className="col-md-12">
                                            <div className="form-group form-group-default" style={{height:"300px"}}>
                                                <label>{this.s("SQL")}</label><sup>{this.s("Use#")}</sup>
                                                <MentionsInput value={this.state.newColumnCalculation} onChange={this.newColumnCalculationChange} className="form-control" style={getBaseStyle()} markup="@[__id__](__type__:__id__)">
                                                    <Mention trigger="@"  type="table" style={{backgroundColor:"#eee" }} data={_.map(this.state.dataSources,(d) => { return { id: d.name, display: d.name}; })}/>
                                                     <Mention trigger="#"  type="columnName" style={{backgroundColor:"#eee" }} data={_.map(this.state.availableFields,(d) => { return { id: d.value, display: d.label}; })}/>
                                                      <Mention trigger="^"  type="columnValue" style={{backgroundColor:"#eee" }} data={_.map(this.state.availableFields,(d) => { return { id: d.value, display: d.label}; })}/>
                                                 </MentionsInput>
                                            </div>
                                        </div>
                                     </div>
                                </div>
                              </Form>
                        </TabPage>
                    </TabContainer>
            </PageContainer>
            );
    }
} 