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
import { BaseComponent } from "./../components/baseComponent";
import { PageContainer } from "./../components/pageContainer";
import { GalleryView2, IGalleryItem } from "./../components/galleryView";
import { TabContainer, WizardContainer, TabPage } from "./../components/tabContainer";
import { ApplicationView, IApplicationViewBaseState } from "./applicationView";
import { Form, TextBox, RadioList, Button, FileInput, Message, CheckBox, DropDown2 } from   "./../components/formComponents";
import { Table, Column, ColumnGroup, Cell }  from "fixed-data-table";
import { DataSourceStore } from "./../data/dataStore";
import { AuthorisationStore } from "./../data/dataStore";
import { InputDataSource, DataSource, Measure, Dimension } from "./../data/models";
import * as _s  from "underscore.string";
import { CanAccess } from "./../components/canAccess";
import { Accordion, Panel } from "react-bootstrap";

interface IDimension {
    name: string;
    query: string;
    isDate: boolean;
}

interface IMeasure {
    name: string;
    query: string;
    uom: string;
    isPrefix: boolean;
}

interface IDimensionEditorProps {
    dimensionNameText: string;
    dimensions: Array<IDimension>;
    onChange(ix: number, newName: string): void;
    dataHelp?: string;
};


class DimensionEditor extends BaseComponent<IDimensionEditorProps, {}> {
    static displayName = "DimensionEditor";
    renderItems = () => {
        return _.map(this.props.dimensions, (dim, ix) => {
            return <Panel key={"dide" + this.randomId + ix} header={<span><i className="fa fa-plus-circle"/> {dim.name}</span>} eventKey={ix + 1}>
                <TextBox data-help={this.props.dataHelp} required={true} type="text" caption={this.props.dimensionNameText} value={dim.name} onChange={_.partial(this.handleChange, ix) }/>
            </Panel>;
        });
    };

    handleChange = (ix, newValue) => {
        if (this.props.onChange != null) { this.props.onChange(ix, newValue); }
    };

    render() {
        return (
            <Accordion  collapsible={true} defaultExpanded={false}>
                {this.renderItems() }
            </Accordion>
        );
    };

}


interface IMeasureEditorProps {
    measureNameText: string;
    uomNameText: string;
    isPrefixNameText: string;
    measures: Array<IMeasure>;
    onChange(ix: number, property: string, value: any): void;
};

class MeasureEditor extends BaseComponent<IMeasureEditorProps, {}> {
    static displayName = "MeasureEditor";
    renderItems = () => {
        return _.map(this.props.measures, (mes, ix) => {
            return <Panel header={<span><i className="fa fa-plus-circle"/> {mes.name}</span>}  key={"dime" + this.randomId + ix} eventKey={ix + 1}>
                <div className="row">
                    <div className="col-md-12">
                        <TextBox required={true} type="text" caption={this.props.measureNameText} value={mes.name} onChange={_.partial(this.handleChange, ix, "name") }/>
                    </div>
                    <div className="col-md-6">
                        <TextBox  type="text" caption={this.props.uomNameText} value={mes.uom} onChange={_.partial(this.handleChange, ix, "uom") }/>
                    </div>
                    <div className="col-md-6">
                        <div className="form-group">
                            <label> </label><br/>
                            <CheckBox caption={this.props.isPrefixNameText} value="isPrefix" checked={mes.isPrefix} onChange={_.partial(this.handleChange, ix, "isPrefix") } />
                        </div>
                    </div>
                </div>
            </Panel>;
        });
    };

    handleChange = (ix, property, newValue) => {
        if (this.props.onChange != null) { this.props.onChange(ix, property, newValue); }
    };
    render() {
        return (
            <Accordion collapsible={true} defaultExpanded={false}>
                {this.renderItems() }
            </Accordion>
        );
    };

}


interface IDataSourceMondrianState extends IApplicationViewBaseState {
    databaseType?: string;
    server?: string;
    database?: string;
    port?: string;
    username?: string;
    password?: string;
    analysisDatabase?: string;
    analysisDatabases?: string[];
    cube?: string;
    cubes?: string[];
    schemaFile?: File;
    schemaValid?: boolean;
    schemaErrors?: string[];
    savedFileName?: string;
    measures?: IMeasure[];
    dimensions?: IDimension[];
    dateDimensions?: IDimension[];
    dataSourceName?: string;
}


interface IDataSourceMondrianProps {

}


export class DataSourceMondrian extends ApplicationView<IDataSourceMondrianProps, IDataSourceMondrianState> {
    static displayName = "DataSourceMondrian";
    Module = "DataManagement";
    constructor() {
        super();
        this.state = {
            loading: false,
            helpSteps: [],
            databaseType: "mysql",
            server: null,
            port: null,
            username: null,
            password: null,
            schemaFile: null,
            schemaValid: false,
            schemaErrors: [],
            measures: [],
            dimensions: [],
            dateDimensions: [],
            dataSourceName: null
        };
        this.loadLanguage("dataSourceMondrian");
    }
    private _dataStore: DataSourceStore = new DataSourceStore();


    wizardNext = (tab: any, navigation: any, ix: number): boolean => {
        if (ix === 1) {
            this.showLoading();
            this._dataStore.GetMondiranDirectMeasureDimensions({
                adapter: "mondrianDirect",
                server: JSON.stringify({
                    type: this.state.databaseType,
                    server: this.state.server,
                    database: this.state.database,
                    username: this.state.username,
                    password: this.state.password,
                    port: parseInt(this.state.port, 10)
                }),
                database: this.state.analysisDatabase,
                cube: this.state.cube,
                fileName: this.state.savedFileName,
            }).then((res) => {
                this.hideLoading();
                this.setState({
                    measures: _.map(res.data.measures, m => m as IMeasure),
                    dimensions: _.map(_.filter(res.data.dimensions, d => !d.isDate), d => d as IDimension),
                    dateDimensions: _.map(_.filter(res.data.dimensions, d => d.isDate), d => d as IDimension)
                });
                (this.refs["wizard"] as WizardContainer).jumpToTab(1);
            }).catch((result) => {
                this.hideLoading();
                let errors = [];
                try {
                    errors.push(JSON.parse(result.data.additionalInformation.InnerException.Message).error);
                } catch (e) {
                    errors.push(this.s("GenericMondrianError"));
                }
                this.setState({ schemaValid: false, schemaErrors: errors, measures: [], dimensions: [] });
            });
            return false;
        }
        if (ix === 2) {
            if (_s.isBlank(this.state.dataSourceName)) {
                return;
            }
            this.showLoading();
            this._dataStore.CreateMondiranDirectSource({
                adapter: "mondrianDirect",
                server: JSON.stringify({
                    type: this.state.databaseType,
                    server: this.state.server,
                    database: this.state.database,
                    username: this.state.username,
                    password: this.state.password,
                    port: parseInt(this.state.port, 10)
                }),
                name: this.state.dataSourceName,
                database: this.state.analysisDatabase,
                cube: this.state.cube,
                fileName: this.state.savedFileName,
                measures: this.state.measures,
                dimensions: _.union(this.state.dimensions, this.state.dateDimensions)
            }).then((results) => {
                this.hideLoading();
                this.navigateTo("/dataSourceManager");
            }).catch((results) => {
                this.hideLoading();
                this.notify(Constants.ViewComponent.DataSource, "error", false, _s.sprintf(this.s("DataSourceSaveFailure")));
            });
        }
    };

    fileSelected = () => {
        this.setState({ schemaFile: (this.refs["refSchema"] as FileInput).Selectedfile(), schemaErrors: [], schemaValid: false });
        this._dataStore.ValidateSchema((this.refs["refSchema"] as FileInput).Selectedfile()).then((results) => {
            this.setState({ schemaValid: true, cubes: results.data.cubeNames, analysisDatabases: [results.data.analysisDatabase], savedFileName : results.data.fileName });
        }).catch((results) => {
            let errors = (results.data != null) ? results.data : [];
            this.setState({ schemaErrors: errors, cubes: [], cube: null, analysisDatabases: [], analysisDatabase: null, savedFileName: null });
        });
    };

    dataSourceNameChange = (newValue) => {
        this.updateStateImmutable({ dataSourceName: newValue });
    };

    dimensionEdited = (ix: number, newName: string) => {
        let dimensions = _.clone(this.state.dimensions);
        dimensions[ix].name = newName;
        this.updateStateImmutable({ dimensions: dimensions });
    };

    dateDimensionEdited = (ix: number, newName: string) => {
        let dimensions = _.clone(this.state.dateDimensions);
        dimensions[ix].name = newName;
        this.updateStateImmutable({ dateDimensions: dimensions });
    };

    measureEdited = (ix: number, property: string, value: any) => {
        let measures = _.clone(this.state.measures);
        measures[ix][property] = value;
        this.updateStateImmutable({ measures: measures });
    };

    render() {
        return <PageContainer showBreadCrumb={true} breadCrumbPath={[{ title: this.s("MondrianDataSource"), link: "#" }]}  loading={this.state.loading}  onHelpClick={this.onHelpClick}>
            <WizardContainer ref="wizard" buttonTexts={{ first: this.gs("StartOver"), next: this.gs("Next"), previous: this.gs("Previous"), finish: this.s("SaveDataSource") }}  onNext={this.wizardNext} noPadding={false}>
                <TabPage caption={this.s("DatabaseAndSchema") }>
                    <div className="row">
                        <Form ref="mainForm">
                        <div className="col-md-5">
                            <DropDown2 caption={this.s("DatabaseType") } required={true} options={[{ name: "Mysql / Percona / MariaDB", value: "mysql" }, { name: "PostgreSQL", value: "pgsql" }, { name: "Microsoft SQL", value: "mssql" }]}
                                optionsText="name" optionsValue="value" value={this.state.databaseType} onChange={(s) => this.setState({ databaseType: s.value }) }/>
                            <TextBox caption={this.s("Server") } required={true} type="text" value={this.state.server} onChange={(v) => this.setState({ server: v }) } />
                            <TextBox caption={this.s("Port") } required={true}  type="number" value={this.state.port} onChange={(v) => this.setState({ port: v }) } />
                            <TextBox caption={this.s("Database") } required={true} type="text" value={this.state.database} onChange={(v) => this.setState({ database: v }) } />
                            <TextBox caption={this.s("Username") } required={true} type="text" value={this.state.username} onChange={(v) => this.setState({ username: v }) } />
                            <TextBox caption={this.s("Password") } required={true} type="password" value={this.state.password} onChange={(v) => this.setState({ password: v }) } />
                        </div>
                        <div className = "col-md-1">
                        </div>
                        <div className="col-md-5">
                            <FileInput ref="refSchema" caption={this.s("MondrianSchema") } fileSelected={this.fileSelected}/>
                            {(this.state.schemaErrors.length > 0) ? <div className="alert alert-danger">{this.state.schemaErrors}</div> : null}
                            {(this.state.schemaValid) ?
                                <div>
                                    <DropDown2 caption={this.s("AnalysisDatabase") } required={true}  options={this.state.analysisDatabases}
                                        value={this.state.analysisDatabase} onChange={(s) => this.setState({ analysisDatabase: (s == null) ? null : s.value }) }/>
                                    <DropDown2 caption={this.s("Cube") } required={true}  options={this.state.cubes} value={this.state.cube} onChange={(s) => this.setState({ cube: (s == null) ? null : s.value }) }/>
                                </div>
                                : null }
                        </div>
                        </Form>
                    </div>
                </TabPage>
                <TabPage caption={this.s("MeasuresAndDimensions") }>
                    <TextBox  required={true} caption={this.s("DataSourceName") } dataHelp="DataSourceName" type="text" onChange={this.dataSourceNameChange} value={this.state.dataSourceName} />
                    <div className="row">
                        <div data-help="Dimensions" className="col-md-3">
                            <h4>{this.s("Dimensions") }</h4>
                            <DimensionEditor  dimensions={this.state.dimensions} dimensionNameText={this.s("Name") } onChange={this.dimensionEdited} />
                        </div>
                        <div data-help="TimeDimensions" className="col-md-3">
                            <h4>{this.s("TimeDimensions") }</h4>
                            <DimensionEditor dimensions={this.state.dateDimensions} dimensionNameText={this.s("Name") } onChange={this.dateDimensionEdited} />
                        </div>
                        <div data-help="Measures" className="col-md-3">
                            <h4>{this.s("Measures") }</h4>
                            <MeasureEditor measureNameText={this.s("Name") } measures={this.state.measures} onChange={this.measureEdited} uomNameText={this.s("UOM") } isPrefixNameText={this.s("IsPrefix") } />
                        </div>
                    </div>
                </TabPage>
            </WizardContainer>
            {this.helperDOM() }
        </PageContainer>;
    };
}