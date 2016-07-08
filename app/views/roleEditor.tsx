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
import { User, Role} from "./../data/models";
import * as _s from "underscore.string";
import * as _ from "lodash";
import { RoleStore } from "./../data/dataStore";
import CheckboxTree from "react-checkbox-tree";

interface IRoleEditorProps {
    params: {
        id: string;
    };
}
interface IRolerEditorState extends IApplicationViewBaseState {
    role: Role;
    mode: string;
}
export class RoleEditor extends ApplicationView<IRoleEditorProps , IRolerEditorState> {
    private _dataStore = new RoleStore();
    constructor() {
        super();
        this.loadLanguage("roles");
    }
    componentWillMount() {
        this.setState({ mode : "Add", helpSteps: [], loading: false, role: { id: 0, name: null, permissions: null, checkedPermissions: [], permissionTemplate: null}});
        this._dataStore.GetPermissions().then((permissionResults: any) => {
             let allPermissions = _.map(permissionResults.data , (p: any) => {
                  return { value : p.module , title: p.displayName,
                     children: _.map(p.views, (c: any) => {
                         return { value : p.module + "|" + c.view , title: c.displayName,
                                children: _.map(c.actions, (d: any) => {
                                    return {  value: p.module + "|" + c.view + "|" + d , title: d };
                                })
                                };
                     })
                    };
             });
             if (this.props.params.id !== "0") {
                this._dataStore.GetRole(parseInt(this.props.params.id, 10)).then((results: any) => {
                    this.updateStateImmutable({
                        mode : (results.data.id === 0) ? "Add" : "Edit",
                        role: {
                            id: results.data.id,
                            name: results.data.name,
                            createdBy: results.data.createdBy,
                            createdOn: results.data.createdOn,
                            permissions:  results.data.permissions,
                            checkedPermissions: (results.data.permissions === "*") ? [] : JSON.parse(results.data.permissions),
                            permissionTemplate : allPermissions
                        }});
                 }).catch((error) => {
                    this.updateStateImmutable({ error: error.data.message, loading: false });
                    this.notify(Constants.ViewComponent.Role, "error", false, this.s(error.data.message));
                });
            }else {
                 this.updateStateImmutable({
                      mode : "Add" , role: { id: 0, name: null, checkedPermissions: [], permissionTemplate: allPermissions, createdBy: null }
                    });
            }
        });
    }
     onComplexFieldChange = (model, fieldName, value) => {
        if (model === "state.role") {
           let newState = _.clone(this.state);
           newState.role.checkedPermissions = (this.refs["modules"] as any).state.checked;
            newState.role[fieldName] = value;
            this.setState(newState);
            return;
        }
        _.set(model, fieldName, value);
    };
    saveRoleClick = () => {
        if (! (this.refs["form"] as any).isValid()) {
            return ;
        }
        this.updateStateImmutable({ error: null, loading: true, });
        let role = {
            name: this.state.role.name,
            permissions: JSON.stringify(this.state.role.checkedPermissions),
        } as Role;
        if (this.state.mode === "Add") {
            this._dataStore.AddRole(role).then((result) => {
                this.notify(Constants.ViewComponent.Role, "success", true, _s.sprintf(this.s("SavedSuccessFully"), this.state.role.name));
                this.hideLoading();
                this.navigateTo("/roleManager");
            }).catch((error) => {
                this.updateStateImmutable({ error: error.data.message, loading: false });
                this.notify(Constants.ViewComponent.Role, "error", false, this.s(error.data.message));
            });
        } else {
            this._dataStore.UpdateRole(this.state.role.id, role).then((result) => {
                this.notify(Constants.ViewComponent.Role, "success", true, _s.sprintf(this.s("UpdatedSuccessFully"), this.state.role.name));
                this.hideLoading();
                this.navigateTo("/roleManager");
            }).catch((error) => {
                this.updateStateImmutable({ error: error.data.message, loading: false });
                this.notify(Constants.ViewComponent.Role, "error", false, this.s(error.data.message));
            });
        }
    };
    checkBoxTree = () => {
        return (this.state.role.permissionTemplate === null) ? <div></div> : <div>  <CheckboxTree ref="modules"  nodes={this.state.role.permissionTemplate} checked={this.state.role.checkedPermissions} /></div>;
    };
    render() {
        return <PageContainer showBreadCrumb={true} breadCrumbPath={[{ title: this.s(this.state.mode + "Role"), link: "#" }]}  loading={this.state.loading}  onHelpClick={this.onHelpClick} >
                  <Form className="p-t-15" ref="form">
                  <div className="panel panel-white">
                      <div className="panel-body">
                        <div className="row">
                          <div className="col-md-12">
                                <TextBox type="text" caption={this.s("name") }  required={true} placeholder ={this.s("name")}
                                    onChange={_.partial(this.onComplexFieldChange, "state.role", "name") } value={this.state.role.name} disabled={(this.state.mode === "Edit")} />
                          </div>
                          </div>
                         <div className="row">
                            <div className="col-md-12">
                           {this.checkBoxTree()}
                            </div>
                          </div>
                         <div className="row">
                          <div className="btn-group col-md-12">
                                <Button type="button" className="btn btn-primary" data-test="role.saveRole" data-help="role.saveRole" title={this.s("saveRole") } onClick={this.saveRoleClick}>{this.s("save")}</Button>
                          </div>
                       </div>
                     </div>
                  </div>
                 </Form>
                 {this.helperDOM()}
               </PageContainer>;
    }
}