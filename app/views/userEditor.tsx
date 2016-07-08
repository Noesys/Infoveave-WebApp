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
import {Form, TextBox, DropDown, Button, CheckBox} from "./../components/formComponents";
import { DataSourceWithMeasuresDimensions, Dimension, Measure } from "./../data/models";
import { DataTable, ColumnType } from "./../components/dataTable";
import { User, Role} from "./../data/models";
import * as _s from "underscore.string";
import * as _ from "lodash";
import { UserStore } from "./../data/dataStore";
import Select from "react-select";
let SelectAsync: any = Select.Async;


interface IUserEditorProps {
    params: {
        id: number;
    };
    context: { datasource: any, dimension: any, dimensionItems: any }[];
}

interface IUserEditorState extends IApplicationViewBaseState {
    user: User;
    mode: string;
    importDashboards: boolean;
    roles?: { id: number, name: string }[];
}
export class UserEditor extends ApplicationView<IUserEditorProps, IUserEditorState> {
    private _dataStore = new UserStore();
    constructor() {
        super();
        this.loadLanguage("users");
    }
    componentWillMount() {
        this.setState({
            loading: false,
            helpSteps: [],
            mode: "Add",
            importDashboards: false,
            user: { id: 0, newPassword: null, confirmPassword: null, oldPassword: null, email: null, userName: null, firstName: null, lastName: null, roleId: 0 },
         });
         this._dataStore.GetRoles().then((allResults) => {
            this.updateStateImmutable({ roles: allResults.data });
            if (this.props.params.id.toString() === "0") return;
            this._dataStore.GetUser(this.props.params.id).then((results) => {
                this.updateStateImmutable({
                    mode: "Edit",
                    user: {
                        id: results.data.id,
                        roleId: results.data.roleId,
                        email: results.data.email,
                        userName: results.data.userName,
                        firstName: results.data.firstName,
                        lastName: results.data.lastName,
                        createdOn: results.data.createdOn
                    },
                });
            }).catch((error) => {
                this.updateStateImmutable({ error: error.data.message, loading: false });
                this.notify(Constants.ViewComponent.User, "error", false, this.s(error.data.message));
            });
        });
    }

    onComplexFieldChange = (model, fieldName, value) => {
        if (model === "state.user") {
            let newState = _.clone(this.state);
            newState.user[fieldName] = value;
            this.setState(newState);
            return;
        }
        _.set(model, fieldName, value);
    };
    saveUserClick = () => {
        if (!(this.refs["form"] as any).isValid()) {
            return;
        }
        this.updateStateImmutable({ error: null, loading: true, });
        let user: User = {
            userName: this.state.user.userName,
            firstName: this.state.user.firstName,
            lastName: this.state.user.lastName,
            email: this.state.user.email,
            newPassword: this.state.user.newPassword,
            confirmPassword: null,
            roleId: this.state.user.roleId,
            importDashboards: this.state.importDashboards,
        };
        if (this.state.mode === "Add") {
            this._dataStore.AddUser(user).then((result) => {
                this.notify(Constants.ViewComponent.User, "success", true, _s.sprintf(this.s("SavedSuccessFully"), this.state.user.userName));
                this.hideLoading();
                this.navigateTo("/userManager");
            }).catch((error) => {
                this.updateStateImmutable({ error: error.data.message, loading: false });
                this.notify(Constants.ViewComponent.User, "error", false, this.s(error.data.message), this.state.user.userName);
            });
        } else {
            this._dataStore.UpdateUser(this.state.user.id, user).then((result) => {
                this.notify(Constants.ViewComponent.User, "success", true, _s.sprintf(this.s("UpdatedSuccessFully"), this.state.user.userName));
                this.hideLoading();
                this.navigateTo("/userManager");
            }).catch((error) => {
                this.updateStateImmutable({ error: error.data.message, loading: false });
                this.notify(Constants.ViewComponent.User, "error", false, this.s(error.data.message), this.state.user.userName);
            });
        }
    };

    updateState = (key: string, value: string) => {
        let newState = _.clone(this.state);
        newState[key] = value;
        this.setState(newState);
        return;
    };

    render() {
        return <PageContainer showBreadCrumb={true} breadCrumbPath={[{ title: this.s(this.state.mode + "User"), link: "#" }]}  loading={this.state.loading} onHelpClick={this.onHelpClick}>
            <Form className="p-t-15" ref="form">
                <div className="panel panel-white">
                    <div className="panel-body">
                        <div className="row">
                            <div className="col-md-5">
                                <DropDown caption={this.s("role") } required ={true} placeholder ={this.s("selectRole") } options={this.state.roles} onChange={_.partial(this.onComplexFieldChange,"state.user", "roleId") } optionsText="name"
                                    optionsValue ="id" value={this.state.user.roleId}></DropDown>
                                <TextBox type="text" caption={this.s("userName") }  required={true} placeholder ={this.s("userName") } onChange={_.partial(this.onComplexFieldChange, "state.user", "userName") }
                                    value={this.state.user.userName} disabled={(this.state.mode === "Edit") } />
                                <TextBox type="text" caption={this.s("firstName") }  required={true}  placeholder ={this.s("firstName") }  onChange={_.partial(this.onComplexFieldChange, "state.user", "firstName") }
                                    value={this.state.user.firstName} disabled={false} />
                                <TextBox type="text" caption={this.s("lastName") }  required={true} placeholder ={this.s("lastName") } onChange={_.partial(this.onComplexFieldChange, "state.user", "lastName") }
                                    value={this.state.user.lastName} disabled={false} />
                                <TextBox type="email" caption={this.s("email") }  required={true} placeholder ={this.s("email") } onChange={_.partial(this.onComplexFieldChange, "state.user", "email") }
                                    value={this.state.user.email} disabled={false} />
                                { (this.state.mode === "Edit") ? null :
                                <div>
                                 <TextBox type="password" caption={this.s("password") }  required={false} placeholder ={this.s("password") } onChange={_.partial(this.onComplexFieldChange, "state.user", "newPassword") }
                                    value={this.state.user.newPassword} disabled={false} />
                                <CheckBox value="importDashboards" caption={this.s("ImportOrganisationBoards")} checked={this.state.importDashboards} onChange={_.partial(this.updateState,"importDashboards") as any} />
                                </div>
                                }
                            </div>
                            <div className="col-md-1">
                            </div>
                            <div className="col-md-6">
                            </div>
                        </div>
                        <div className="row">
                            <div className="btn-group col-md-6">
                                <Button type="button" className="btn btn-primary" data-test="role.saveUser" data-help="role.saveUser" title={this.s("saveUser") } onClick={this.saveUserClick}>{this.s("save") }</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Form>
            {this.helperDOM() }
        </PageContainer>;
    }
}