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
import { GalleryView, IGalleryItem } from "./../components/galleryView";
import {Form, TextBox, RadioList, Button, FileInput, Message, CheckBox, DropDown2 } from   "./../components/formComponents";
import { TabContainer, WizardContainer, TabPage } from "./../components/tabContainer";
import { DataTable, ColumnType } from "./../components/dataTable";
import { User, Role, Infoboard} from "./../data/models";
import * as _s from "underscore.string";
import * as _ from "lodash";
import * as PubSub from "pubsub-js";
import { UserStore, CommonStore, InfoboardStore } from "./../data/dataStore";
import Sortable from "sortablejs";
import {Urls} from "../data/constants";
import { CanAccess } from "./../components/canAccess";

interface IProfileEditorProps {
    params: {
        id: string;
    };
}

interface IProfileEditorState extends IApplicationViewBaseState {
    user: User;
    image: string;
    newFile: File;
    newPath: string;
    imagePreviewUrl: string;
    infoboards: Infoboard[];
    newInfoboardName: string;
    renameInfoboardId: number;
    renameInfoboardName: string;
    languageChanged?: boolean;
}

export class Profile extends ApplicationView<IProfileEditorProps, IProfileEditorState> {
    Module = "infobord";
    View = "profile";
    private _dataStore = new UserStore();
    private _commonStore= new CommonStore();

    constructor(props) {
        super();
        this.loadLanguage("profile");
        this.handleImageChange = this.handleImageChange.bind(this);
        this.state = {
            loading: false,
            helpSteps: [],
            image: "",
            user: { id: 0, email: null, newPassword: null, oldPassword: null, confirmPassword: null, userName: null, firstName: null, lastName: null, roleId: 0, imagePath: "" },
            newFile: null,
            imagePreviewUrl: null,
            newPath: "",
            infoboards: [],
            newInfoboardName: null,
            renameInfoboardId: 0,
            renameInfoboardName: null,
            languageChanged: false
        };
    }

    componentWillMount() {
        this._dataStore.GetCurrentUser().then((results) => {
            this.updateStateImmutable({
                user: {
                    id: results.data.id,
                    email: results.data.email,
                    userName: results.data.userName,
                    firstName: results.data.firstName,
                    lastName: results.data.lastName,
                    createdOn: results.data.createdOn,
                    language: results.data.language
                },
                imagePreviewUrl: `${Urls.baseUrl()}/User/${Urls.getTenant()}/${results.data.id}/ProfileImage`

            });
        });
        this._commonStore.GetInfoboards().then((results) => {
            this.updateStateImmutable({ infoboards: results.data });
        });
    };

    onComplexFieldChange = (model, fieldName, value) => {
        if (model === "state.user") {
            let newState = _.clone(this.state);
            newState.user[fieldName] = value;
            this.setState(newState);
            return;
        }
        _.set(model, fieldName, value);
    };

    onComplexChange = (model, fieldName, value) => {
        if (model === "state") {
            let newState = _.clone(this.state);
            newState[fieldName] = value;
            this.setState(newState);
            return;
        }
        _.set(model, fieldName, value);
    };

    onFieldChange = (fieldName, value) => {
        let updateObj = {};
        updateObj[fieldName] = value;
        this.updateStateImmutable(updateObj);
    };

    changePassword = () => {
        (this.refs["modalChangePassword"] as ModalDialog).showDialog();
    };

    savePassword = () => {
        this.updateStateImmutable({ error: null, loading: true, });
        if (this.state.user.newPassword === this.state.user.confirmPassword) {
            this._dataStore.ChangePassword(this.state.user.oldPassword, this.state.user.newPassword).then((result) => {
                this.notify(Constants.ViewComponent.User, "success", true, _s.sprintf(this.s("SavedSuccessFully"), this.state.user.userName));
                this.hideLoading();
            }).catch((error) => {
                this.updateStateImmutable({ error: error.data.message, loading: false });
                this.notify(Constants.ViewComponent.User, "error", false, this.s(error.data.message), this.state.user.userName);
                (this.refs["modalChangePassword"] as ModalDialog).hideDialog();
            });
        } else {
            this.notify(Constants.ViewComponent.User, "error", false, this.s("Passworddonotmatch"), this.state.user.userName);
        }

    };

    UploadImage = () => {
        this._dataStore.UploadImage(this.state.user.id, this.state.newFile).then((result) => {
            this.notify(Constants.ViewComponent.User, "success", true, _s.sprintf(this.s("ProfileImageUpdated")));
            this.updateStateImmutable({ newPath: result.data.path });
            PubSub.publish(Constants.Subscriptions.ProfileUpdate, {});
        }).catch((error) => {
            this.updateStateImmutable({ error: error.data.message, loading: false });
            this.notify(Constants.ViewComponent.User, "error", false, this.s("UpdateUserError"));
        });
    };

    handleImageChange = (e) => {
        e.preventDefault();
        let reader = new FileReader();
        let File = e.target.files[0];
        let filesize = File.size / 1024;
        if (filesize <= 100.0) {
            reader.onloadend = () => {
                this.updateStateImmutable({
                    newFile: File,
                    imagePreviewUrl: reader.result
                });
            };
            reader.readAsDataURL(File);
        } else {
            this.notify(Constants.ViewComponent.User, "error", false, this.s("FileSizeError"));
        }
    };

    insertInfobordClick = () => {
        if (_s.isBlank(this.state.newInfoboardName)) return;
        (this.refs["modalAdd"] as ModalDialog).hideDialog();
        this._commonStore.AddInfoboard({ name: this.state.newInfoboardName }).then((results) => {
            this.notify(Constants.ViewComponent.User, "success", true, _s.sprintf(this.s("SavedSuccessFully")));
            let infoboards = _.cloneDeep(this.state.infoboards);
            infoboards.push(results.data);
            this.updateStateImmutable({ infoboards: infoboards });
        }).catch((error) => {
            this.updateStateImmutable({ error: error.data.message, loading: false });
            this.notify(Constants.ViewComponent.User, "error", false, this.s("AddInfoboardError"));
        });
    };
    saveUser = () => {
        if (!(this.refs["profileForm"] as Form).isValid()) {
            return;
        }
        this.updateStateImmutable({ error: null, loading: true, });
        let user = {
            userName: this.state.user.userName,
            firstName: this.state.user.firstName,
            lastName: this.state.user.lastName,
            email: this.state.user.email,
            createdDateTime: new Date(),
            roleId: this.state.user.roleId,
            imagePath: this.state.newPath,
            language: this.state.user.language,
        } as User;
        this._dataStore.UpdateProfile(user).then((result) => {
            this.notify(Constants.ViewComponent.User, "success", true, _s.sprintf(this.s("UpdatedSuccessFully"), this.state.user.userName));
            this.hideLoading();
            PubSub.publish(Constants.Subscriptions.ProfileUpdate, {});
            if (this.state.languageChanged) {
                localStorage.setItem("language", this.state.user.language);
                window.location.reload();
            }
        }).catch((error) => {
            this.updateStateImmutable({ error: error.data.message, loading: false });
            this.notify(Constants.ViewComponent.User, "error", false, this.s("UpdateUserError"), this.state.user.userName);
        });
    };

    orderSaveHandler = (boards) => {
        this._commonStore.SortInfoboards(boards).then((result) => {
            PubSub.publish(Constants.Subscriptions.InfoboardUpdate, boards);
            this.notify(Constants.ViewComponent.Infoboard, "success", true, this.s("SortedInfoboard"));
        });
    };

    debouncedOrderSave = _.debounce(this.orderSaveHandler, 1000);

    deleteInfoboard = (id) => {
        bootbox.confirm({
            title: this.gs("AreYouSure"),
            message: this.s("DeleteMessage"),
            callback: (result) => {
                if (result) {
                    this._commonStore.DeleteInfoboard(id).then((res) => {
                        this.notify(Constants.ViewComponent.User, "success", true, _s.sprintf(this.s("DeletedSuccessfully")));
                        let boards = _.cloneDeep(this.state.infoboards);
                        boards = _.filter(boards, b => b.id !== id);
                        this.updateStateImmutable({ infoboards : boards });
                        // this.reOrderAndSave(boards);
                        PubSub.publish(Constants.Subscriptions.InfoboardUpdate, boards);
                    }).catch((Error) => {
                        this.notify(Constants.ViewComponent.User, "error", false, this.s("DeleteError"));
                    });
                }
            }
        });
    };

   reOrderAndSave = (boards: Infoboard[]) => {
       _.each(boards, (b, ix) => {
           b.sortOrder = ix;
       });
       this.debouncedOrderSave(boards);
   };

   infoboardsDOM = () => {
       return <div ref={this.sortableContainer}><div className="infoboards" ref={this.sortableGroup}>
            {_.map(this.state.infoboards, (ib, ix) => {
                return <div className="panel panel-default m-b-5 ibs" key={"pib" + ix} data-infoboard={ib.id} data-index={ix}>
                    <div className="panel-heading p-t-5 p-b-5 p-l-10">
                        <div className="pull-right btn-group">
                            <button className="btn btn-primary" onClick={_.partial(this.editClick,ib.id, ib.name)}><i className="fa fa-pencil"/></button>
                            <button className="btn btn-primary" onClick={_.partial(this.deleteInfoboard, ib.id)}><i className="fa fa-trash-o"/></button>
                        </div>
                        <div className="fs-14 m-t-10"><b><i className="fa fa-arrows"/> {ib.name}</b></div>
                    </div>
                </div>;
            })}
       </div></div>;
   };

   sortableContainer = (componentBackingInstance) => {
        if (componentBackingInstance) {
            let options = {
                handle: ".infoboards" // Restricts sort start click/touch to the specified element
            };
            Sortable.create(componentBackingInstance, options);
        }
    };
   sortableGroup = (componentBackingInstance) => {
       // check if backing instance not null
       if (componentBackingInstance) {
           let options = {
               draggable: "div.ibs", // Specifies which items inside the element should be sortable
               group: "shared",
               onUpdate: (evt: any) => {
                  let boards = _.cloneDeep(this.state.infoboards);
                  let boardId = parseInt(evt.item.attributes.getNamedItem("data-infoboard").value, 10);
                  let board = _.find(boards, (b) => b.id === boardId);
                  let oldIndex = parseInt(evt.item.attributes.getNamedItem("data-index").value, 10);
                  boards.splice(oldIndex, 1);
                  boards.splice(evt.newIndex, 0, board);
                  this.reOrderAndSave(boards);
               }
           };
           Sortable.create(componentBackingInstance, options);
       }
   };

   editClick = (id: number, name: string) => {
      this.updateStateImmutable({ renameInfoboardId: id, renameInfoboardName: name });
       (this.refs["modalEdit"] as ModalDialog).showDialog();
   };

   languageChange = (data) => {
       let user = _.clone(this.state.user);
       user.language = data.value;
       this.updateStateImmutable({ user: user, languageChanged: true });
   };

   updateInfobord = () => {
       if (_s.isBlank(this.state.renameInfoboardName)) return;
       (this.refs["modalEdit"] as ModalDialog).hideDialog();
       this._commonStore.UpdateInfoboard(this.state.renameInfoboardId, { name: this.state.renameInfoboardName }).then((result) => {
           let boards = _.cloneDeep(this.state.infoboards);
           let board = _.find(boards, (b) => b.id === this.state.renameInfoboardId);
           board.name = this.state.renameInfoboardName;
           this.updateStateImmutable({ infoboards : boards });
           PubSub.publish(Constants.Subscriptions.InfoboardUpdate, boards);
           this.notify(Constants.ViewComponent.User, "success", true, _s.sprintf(this.s("UpdatedSuccessFully"), this.state.renameInfoboardName));
       }).catch((error) => {
           this.updateStateImmutable({ error: error.data.message, loading: false });
           this.notify(Constants.ViewComponent.Infoboard, "error", false, this.s("UpdateInfoboardError"), this.state.renameInfoboardName);
       });
   };

   exportInfoboards = () => {
       this._commonStore.ExportInfoboards().then((data) => {
           this.notify("Infoboards", "success", true, _s.sprintf(this.s("ExportedSuccessfully"), data));
       }).catch((data) => {
           this.notify("Infoboards", "error", true, this.s("ExportFailed"));
       });
   };

   restoreInfoboards = () => {
        this._commonStore.RestoreInfoboards().then((data) => {
           window.location.reload(true);
       }).catch((data) => {
           this.notify("Infoboards", "error", true, this.s("ImportFailed"));
       });
   }
   render() {
        return <PageContainer showBreadCrumb={true} breadCrumbPath={[{ title: this.s("EditProfile"), link: "#" }]} loading={this.state.loading}  onHelpClick={this.onHelpClick}>
            <ModalDialog title={  this.s("ChangePassword") }  size={ModalDialogSize.Medium} ref="modalChangePassword"
                actions={
                    <Button caption={this.gs("Save") } title="Save" dataHelp="Save" type="button" onClick={this.savePassword} />
                }>
                <ModalContent>
                    <Form ref="form">
                        <TextBox caption={this.s("OldPassword") } type="password" placeholder="Credentials" required={true}
                            onChange={_.partial(this.onComplexFieldChange, "state.user", "oldPassword") } value={this.state.user.oldPassword}  />
                        <TextBox caption={this.s("NewPassword") } type="password" placeholder="Credentials" required={true}
                            onChange={_.partial(this.onComplexFieldChange, "state.user", "newPassword") } value={this.state.user.newPassword}  />
                        <TextBox caption={this.s("ConfirmPassword") } type="password" placeholder="Credentials" required={true}
                            onChange={_.partial(this.onComplexFieldChange, "state.user", "confirmPassword") }  value={this.state.user.confirmPassword}  />
                    </Form>
                </ModalContent>
            </ModalDialog>
             <ModalDialog title= {this.s("EditInfoboard")} size={ModalDialogSize.Medium} ref="modalEdit"
                actions={<Button caption={this.gs("Save") } title="Save" dataHelp="Save" type="button" onClick={this.updateInfobord} />}>
                <ModalContent>
                    <Form ref="form">
                        <TextBox caption={this.s("Name")} required={true} type="text"  onChange={_.partial(this.onComplexChange,"state","renameInfoboardName")} value={this.state.renameInfoboardName} />
                    </Form>
                </ModalContent>
            </ModalDialog>
            <div className="panel panel-white">
                <div className="panel panel-body">
                    <div className="row">
                        <div className="col-md-3">
                            <div className="thumbnail-wrapper circular inline">
                                <img src={this.state.imagePreviewUrl} />
                            </div>
                            <div className="col-md-12">
                                <input type="file" data-help="file" accept="image/png,image/jpeg" onChange={this.handleImageChange} />
                            </div><br/><br/>
                            <div className="col-md-12">
                                <Button dataHelp="UploadImage" type="button" className="btn btn-primary" data-test="role.saveUser" title={this.s("UploadImage") } onClick={this.UploadImage}>{this.s("UploadImage") }</Button><br/><br/>
                            </div>
                            <div className="col-md-12">
                                <Button type="button"  className="btn btn-primary" title={this.s("ChangePassword") } onClick={this.changePassword}>{this.s("ChangePassword") }</Button><br/><br/>
                            </div>
                            <div className="col-md-12">
                                <CanAccess module="Infoboards" view="Infoboards" action="ExportDefault">
                                    <Button type="button" className="btn btn-primary" title={this.s("ExportDefault") } onClick={this.exportInfoboards}>{this.s("ExportDefault") }</Button>
                                </CanAccess>
                                <br/><br/>
                            </div>
                            <div className="col-md-12">
                                <Button type="button"  className="btn btn-primary" title={this.s("RestoreInfoboards") } onClick={this.restoreInfoboards}>{this.s("RestoreInfoboards") }</Button>
                            </div>
                        </div>
                        <div className="col-md-4"><br/>
                            <Form ref="profileForm">
                                <TextBox type="text" caption={this.s("userName") }  required={true} placeholder ={this.s("userName") }
                                    onChange={_.partial(this.onComplexFieldChange, "state.user", "userName") }  value={this.state.user.userName} disabled={true } />
                                <TextBox type="text" caption={this.s("firstName") }  required={true}  placeholder ={this.s("firstName") }
                                    onChange={_.partial(this.onComplexFieldChange, "state.user", "firstName") } value={this.state.user.firstName} disabled={false} />
                                <TextBox type="text" caption={this.s("lastName") }  required={true} placeholder ={this.s("lastName") }
                                    onChange={_.partial(this.onComplexFieldChange, "state.user", "lastName") }  value={this.state.user.lastName} disabled={false} />
                                <TextBox type="email" caption={this.s("Email") }   required={true} placeholder ={this.s("Email") }
                                    onChange={_.partial(this.onComplexFieldChange, "state.user", "email") }  value={this.state.user.email} disabled={false} />
                                <br/>
                                <Button type="button" className="btn btn-primary" data-test="user.saveUser" dataHelp="saveUser" title={this.s("SaveUser") } onClick={this.saveUser}>{this.gs("Save") }</Button>
                            </Form>
                        </div>
                        <div className="col-md-4">
                            <h4>{this.s("ManageInfoboards")}</h4>
                            {this.infoboardsDOM() }
                        </div>
                    </div>
                </div>
            </div>
            {this.helperDOM() }
        </PageContainer>;
    }
 }

