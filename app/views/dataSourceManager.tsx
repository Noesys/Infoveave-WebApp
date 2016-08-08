/**
 * Copyright © 2015-2016 Noesys Software Pvt.Ltd. - All Rights Reserved
 * -------------',
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
import { TextBox, RadioList, Button, FileInput, Message, CheckBox } from   "./../components/formComponents";
import { Table, Column, ColumnGroup, Cell }  from "fixed-data-table";
import { DataSourceStore } from "./../data/dataStore";
import { AuthorisationStore } from "./../data/dataStore";
import { InputDataSource, DataSource } from "./../data/models";
import * as _s  from "underscore.string";
import { CanAccess } from "./../components/canAccess";
interface IDataSourceManagerState extends IApplicationViewBaseState {
    dataSources: DataSource[];
}


interface IDataSourceManagerProps {

}


export class DataSourceManager extends ApplicationView<IDataSourceManagerProps, IDataSourceManagerState> {
    Module = "DataManagement";
    constructor() {
        super();
        this.loadLanguage("dataSourceManager");
    }
    private _dataStore: DataSourceStore = new DataSourceStore();
    componentWillMount = () => {
        this.setState({ loading: false, dataSources: [], helpSteps: [] });
        this._dataStore.GetDataSources().then((results) => {
            this.updateStateImmutable({ dataSources: results.data, loading: false });
        }).catch((results) => {
            this.hideLoading();
        });
        this.avaiableDataSources = [];
       if (this.canAccess(this.Module, "MondrianDataSource", "List")) {
           this.avaiableDataSources.push({
                title: this.s("CreateMondrianSource"),
                smallDescription: this.s("CreateMondrianSourceDescription"),
                description: "",
                imagePreview: this.getImageForType("mondrianDirect"),
                images: [this.getImageForType("mondrianDirect")],
                actions: (this.canAccess(this.Module, "MondrianDataSource", "Add")) ? [{ text: <i className="fa fa-plus"/>, action: () => { this.navigateTo("/dataSourceMondrian"); } }] : []
            }
            );
       }
    };
    getImageForType = (type: string) => {
        switch (type) {
             case "mondrianDirect":
                return "/assets/img/ds/mondrian_pr.png";
            default:
                break;
        }
    };

    avaiableDataSources: Array<IGalleryItem> = [];

    dataSourceItems = (): Array<IGalleryItem> => {
        return _.map(this.state.dataSources, (d) => {
            let actions = [];
            if (d.canShare) {
                 actions.push({ text: <i className={"fa fa-share-alt " + ((d.isPublic === true) ? " btn-success" : "") } />, primary: (d.isPublic), action: () => { this.toggleDataSource(d.id, d.isPublic); } });
            }
            if (d.type === "mondrianDirect" && (this.canAccess(this.Module, "MondrianDataSource", "Delete")) && (!d.isPublic)) {
                actions.push({ text: <i className="fa fa-trash-o"/>, action: () => { this.deleteDataSource(d.id); } });
            }
            return {
                title: d.name,
                smallDescription: "",
                description: "",
                imagePreview: this.getImageForType(d.type),
                images: [this.getImageForType(d.type)],
                actions: actions
            };
        });
    };

    goToUpload = (id: number) => {
        this.navigateTo("/dataUpload/" + id);
    };

    toggleDataSource = (id: number, isPublic: boolean) => {
        this._dataStore.ToggleDataSourceShare(id).then((results) => {
            this.notify(Constants.ViewComponent.DataSource, "success", true, this.s((isPublic) ? "UnShareSuccessfully" : "SharedSuccessfully"));
            let dataSources = _.clone(this.state.dataSources);
            let dataSource = _.find(dataSources, (d) => d.id === id);
            dataSource.isPublic = !dataSource.isPublic;
            this.updateStateImmutable({ dataSources: dataSources });
        });
    };

    deleteDataSource = (id: number) => {
        bootbox.confirm(this.s("AreYouSure"), (result) => {
            if (!result) return;
            this._dataStore.DeleteDataSource(id).then((results) => {
                let dataSources = _.filter(this.state.dataSources, (ds) => ds.id !== id);
                this.updateStateImmutable({dataSources : dataSources});
                this.notify(Constants.ViewComponent.DataSource, "success", true, this.s("DeletedSuccessfully"));
            }).catch((results) => {
                this.notify(Constants.ViewComponent.DataSource, "error", true, this.s("DeleteDataSourceError"));
            });
        });
    };


    render() {
        return <PageContainer showBreadCrumb={true} breadCrumbPath={[{ title: this.s("DataSources"), link: "#" }]}  loading={this.state.loading}  onHelpClick={this.onHelpClick}>
                    <TabContainer>
                        <TabPage caption={this.s("MyDatasources")} dataHelp="MyDatasource" visible ={this.canAccess(this.Module,"DataSource","List")}>
                            <GalleryView2 items={this.dataSourceItems()} />
                            </TabPage>
                        <TabPage caption={this.s("NewDataSource") } dataHelp="NewDatasource" visible ={this.canAccess(this.Module,"DataSource","Add")}>
                            <GalleryView2 items={this.avaiableDataSources} />
                        </TabPage>
                    </TabContainer>
                    {this.helperDOM()}
                </PageContainer>;
    };
}