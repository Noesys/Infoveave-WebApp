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
import { DataTable, ColumnType } from "./../components/dataTable";
import * as _s from "underscore.string";
import * as _ from "lodash";
import { UserStore } from "./../data/dataStore";
import { CanAccess } from "./../components/canAccess";

interface IUserManagerState extends IApplicationViewBaseState {
    user: Array<any>;
}
export class UserManager extends ApplicationView<{}, IUserManagerState> {
    private _dataStore = new UserStore();
     Module = "UserManagement"; View = "User";
    constructor() {
        super();
        this.loadLanguage("users");
    }
    componentWillMount() {
         this.setState({ user: [], helpSteps: [], loading: false });
         this._dataStore.GetUsers().then((result) => {
            this.updateStateImmutable({ user: result.data });
        }).catch((error) => {
                        this.updateStateImmutable({ error: error.data.message, loading: false });
                        this.notify(Constants.ViewComponent.User, "error", false, this.s(error.data.message), this.state.user);
        });
    }
    addUserClick = () => {
       this.navigateTo("/userEditor/" + 0);
       return;
    };
    toolbarDOM = (): any => {
        return (
            <div className="btn-group">
              <CanAccess module={this.Module} view={this.View}  action="Add">
                <Button type="button" className="btn btn-primary hint--left" title="Add New User" dataHelp="AddNewUser" onClick={this.addUserClick}><i className="fa fa-plus"></i></Button>

             </CanAccess>
            </div>
        );
    };
    rowClickHandler = (action, row ) => {
        if (action === "Edit") {
           this.navigateTo("/userEditor/" + row.id);
           return;
        } else if (action === "Delete") {
            bootbox.confirm({title: this.gs("AreYouSure"), message: _s.sprintf(this.s("DeleteMessage"), row.name), callback: (result) => {
                if (result) {
                    this._dataStore.DeleteUser(row.id).then((res1) => {
                        this.notify(Constants.ViewComponent.Role, "success", true, this.s("DeletedSuccessfully"));
                        this._dataStore.GetUsers().then((res2) => { this.updateStateImmutable({user: res2.data}); });
                    }).catch((error) => {
                        this.updateStateImmutable({ error: error.data.message, loading: false });
                        this.notify(Constants.ViewComponent.User, "error", false, this.s(error.data.message), this.state.user);
                    });
                }
            }
           });
           return;
        } else if (action === "Unlock") {
            this._dataStore.UnlockUser(row.id).then((result) => {
                 this.notify(Constants.ViewComponent.Role, "success", true, this.s("UnlockSuccessfully"));
            }).catch((error) => {
                this.updateStateImmutable({ error: error.data.message, loading: false });
                this.notify(Constants.ViewComponent.User, "error", false, this.s(error.data.message), this.state.user);
            });
        } else if (action === "Reset") {
            this._dataStore.ResetPassword(row.id).then((result) => {
                 this.notify(Constants.ViewComponent.Role, "success", true, this.s("ResetSuccessfully"));
            }).catch((error) => {
                this.updateStateImmutable({ error: error.data.message, loading: false });
                this.notify(Constants.ViewComponent.User, "error", false, this.s(error.data.message), this.state.user);
            });
        };
     };

    render() {
        return  <PageContainer showBreadCrumb={true} breadCrumbPath={[{ title: this.s("users"), link: "#" }]} toolbar={this.toolbarDOM()} loading={this.state.loading}  onHelpClick={this.onHelpClick}>
                 <CanAccess module={this.Module} view={this.View}  action="List">
                  <DataTable title="" allowSearch={true} data={this.state.user} hasActions={true}
                       rowAction={this.rowClickHandler}    stopTableCreation={true}
                            actions={[
                                { caption: this.gs("Edit"), visible: this.canAccess(this.Module,this.View,"Modify"), dataHelp:"Edit", iconClass: "fa-pencil", action: "Edit" },
                                { caption: this.gs("Delete"),visible: this.canAccess(this.Module,this.View,"Delete"), dataHelp:"Delete", iconClass: "fa-trash-o", action: "Delete" },
                                { caption: this.gs("Unlock"), visible: this.canAccess(this.Module,this.View,"Unlock"), dataHelp:"Unlock", iconClass: "fa-unlock", action: "Unlock" },
                                { caption: this.gs("Reset"),visible: this.canAccess(this.Module,this.View,"Reset"), dataHelp:"Reset", iconClass: "fa-cog", action: "Reset" }]}
                            columns={[
                                { caption: this.s("userName"), type: ColumnType.String, name: "userName" },
                                { caption: this.s("firstName"), type: ColumnType.String, name: "firstName" },
                                 { caption: this.s("lastName"), type: ColumnType.String, name: "lastName" },
                                { caption: this.s("email"), type: ColumnType.String, name: "email" },
                                 { caption: this.s("createdDateTime"), type: ColumnType.RelativeDate, name: "createdOn" },
                                ]} />
                 </CanAccess>
                 {this.helperDOM()}
        </PageContainer>;
    }
}