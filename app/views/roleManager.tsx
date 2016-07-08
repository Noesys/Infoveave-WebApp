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
import {ApplicationView, IApplicationViewBaseState } from "./applicationView";
import { PageContainer } from "./../components/pageContainer";
import {ModalDialog, ModalContent, ModalDialogSize} from "./../components/modalDialogs";
import {Form, TextBox, DropDown, Button} from "./../components/formComponents";
import { DataTable, ColumnType } from "./../components/dataTable";
import * as _s from "underscore.string";
import * as _ from "lodash";
import { RoleStore } from "./../data/dataStore";
import { CanAccess } from "./../components/canAccess";

interface IRoleManagerState extends IApplicationViewBaseState {
    role: Array<any>;
}
export class RoleManager extends ApplicationView<{}, IRoleManagerState> {
    private _dataStore = new RoleStore();
    Module = "UserManagement"; View = "Role";
    constructor() {
        super();
        this.loadLanguage("roles");
    }
    componentWillMount() {
         this.setState({ role: [], helpSteps: [], loading: false });
         this._dataStore.GetRoles().then((result) => {
            this.updateStateImmutable({ role: result.data });
        }).catch((error) => {
            this.updateStateImmutable({ error: error.data.message, loading: false });
            this.notify(Constants.ViewComponent.Role, "error", false, this.s(error.data.message));
         });
    }
    addRoleClick = () => {
       this.navigateTo("/roleEditor/" + 0);
    };
    toolbarDOM = (): any => {
        return (
            <div className="btn-group">
             <CanAccess module={this.Module} view={this.View} action="Add">
               <Button type="button"  className="btn btn-primary hint--left" title={this.gs("AddRole")} dataHelp="AddRole" onClick={this.addRoleClick}><i className="fa fa-plus"></i></Button>
             </CanAccess>
            </div>
        );
    };
    rowClickHandler = (action, row ) => {
        if (action === "Edit") {
           this.navigateTo("/roleEditor/" + row.id);
           return;
        } else if (action === "Delete") {
           bootbox.confirm({
               title: this.gs("AreYouSure"),
               message: _s.sprintf(this.s("DeleteMessage"), row.name),
               callback: (result) => {
                   if (result) {
                       this._dataStore.DeleteRole(row.id).then((res1) => {
                           this.notify(Constants.ViewComponent.Role, "success", true, this.s("DeletedSuccessfully"));
                           this._dataStore.GetRoles().then((res2) => {
                               this.updateStateImmutable({role: res2.data});
                           });
                        }).catch((error) => {
                            this.updateStateImmutable({ error: error.data.message, loading: false });
                            this.notify(Constants.ViewComponent.Role, "error", false, this.s(error.data.message));
                        });
                    }
                }});
           return;
      };
     };
    render() {
        return <PageContainer showBreadCrumb={true} breadCrumbPath={[{ title: this.s("roles"), link: "#" }]} toolbar={this.toolbarDOM() }  loading={this.state.loading}  onHelpClick={this.onHelpClick} >
            <CanAccess module={this.Module} view={this.View}  action="List">
                <DataTable title="" allowSearch={true} data={this.state.role} hasActions={true}
                    rowAction={this.rowClickHandler}    stopTableCreation={true}
                    actions={[
                        { caption: this.gs("Edit"), visible: this.canAccess(this.Module, this.View, "Modify"), dataHelp: "Edit", iconClass: "fa-pencil", action: "Edit" },
                        { caption: this.gs("Delete"), visible: this.canAccess(this.Module, this.View, "Delete"), dataHelp: "Delete", iconClass: "fa-trash-o", action: "Delete" }]}
                    columns={[
                        { caption: this.s("name"), type: ColumnType.String, name: "name" },
                        { caption: this.s("createdBy"), type: ColumnType.String, name: "createdBy" },
                        { caption: this.s("createdOn"), type: ColumnType.RelativeDate, name: "createdOn" }
                    ]} />
            </CanAccess>
            {this.helperDOM() }
        </PageContainer>;
    }
}