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
/// <reference path="../../typings/references.d.ts"/>
"use strict";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Constants from "./../data/constants";
import * as _ from "lodash";
import * as _s from "underscore.string";
import { InfoveaveLogo } from   "./infoveaveLogo";
import { CommonStore, AuthorisationStore } from "./../data/dataStore";
import { ModalDialog, ModalContent, ModalDialogSize} from "./modalDialogs";
import { Form, TextBox, Button } from "./formComponents";
import { BaseComponent } from "./baseComponent";
import * as PubSub from "pubsub-js";
import $ from "jquery";
import { Link } from "react-router";
import IconMenu from "material-ui/lib/menus/icon-menu";
import MenuItem from "material-ui/lib/menus/menu-item";
import IconButton from "material-ui/lib/icon-button";
import RaisedButton from "material-ui/lib/raised-button";
import Divider from "material-ui/lib/divider";
import injectTapEventPlugin from "react-tap-event-plugin";
import FontIcon from "material-ui/lib/font-icon";
import Dialog from "material-ui/lib/dialog";
import { Urls } from "../data/constants";
import { CanAccess } from "./canAccess";
/* tslint:disable */
let versionInfo: any = require("./../version.json");
/* tslint:enable */
injectTapEventPlugin();

class InfoboardMenuLink {
    id: number;
    name: string;
    shortCode: string;
    side: string;
    constructor(id: number, name: string, shortCode: string) {
        this.id = id;
        this.name = name;
        this.shortCode = shortCode;
        if (name.trim().split(" ").length > 1) {
            let s = _.filter(name.split(" "), (n) => n !== "");
            this.side = s[0][0].toUpperCase() + s[1][0].toLowerCase();
        } else {
            this.side = _s.titleize(name.substr(0, 2));
        }
    }
}

interface IHeaderProperties {
    pageTitle: string;
    onHelpClick?(): void;
}

interface IHeaderState {
    user?: {
        version: string;
        name: string;
        imagePath: string;
        username: string;
        id: number;
    };
    helpOpen?: boolean;
    currentHelpSteps?: { image: string, content: any }[];
    currentHelpStep?: number;
    currentHelpName?: string;
    infoboards?: Array<InfoboardMenuLink>;
    newInfoboardName?: string;
    addInfoboardDisabled?: boolean;
}

let ShouldRender = (props: { _store: AuthorisationStore, view: string, action?: string, children?: any }) => {
    let permissions = props._store.GetUserPermissions();
    let fperms = _.filter(permissions, (a) => a.view === props.view);
    if (props.action != null) {
        fperms = _.filter(fperms, (a) => a.action === props.action);
    }
    return (fperms.length > 0) ? props.children : <li/>;
};

let ShouldRenderIncludes = (props: { _store: AuthorisationStore, views: string[], children?: any }) => {
    let permissions = props._store.GetUserPermissions();
    return (_.find(permissions, (a) => _.includes(props.views, a.view)) != null) ? props.children : <li/>;
};

export class Header extends BaseComponent<IHeaderProperties, IHeaderState> {
    static displayName = "Header";
    private _dataStore = new CommonStore();
    private _authStore = new AuthorisationStore();

    constructor() {
        super();
        this.state = {
            helpOpen: false,
            user: { name: "Infoveave User", imagePath: "", username: "", id: null, version: null },
            currentHelpSteps: [],
            currentHelpStep: -1,
            currentHelpName: null
        };
    }
    componentWillMount() {
        this.updateUserInfo(false);
        this.setState({ infoboards: [], newInfoboardName: null, addInfoboardDisabled: false });
        this._dataStore.GetInfoboards().then((result) => {
            let boards = _.map(result.data, (i) => new InfoboardMenuLink(i.id, i.name, i.shortCode));
            this.setState({ infoboards: boards, newInfoboardName: null, addInfoboardDisabled: false });
        });
    };

    updateUserInfo = (forceUpdate: boolean) => {
        this._dataStore.GetUserInfo(forceUpdate).then((result) => {
            let user = _.assign(_.clone(this.state.user), result) as any;
            user.name = result.firstName + " " + result.lastName;
            this.setState({ user: user } as any);
        });
    };

    logoutClick = (event) => {
        event.preventDefault();
        PubSub.publish(Constants.Subscriptions.Logout, null);
    };

    editProfileClick = () => {
        PubSub.publish(Constants.Subscriptions.Navigate, "/profile");
    };

    quickViewToggle = () => {
        $("#quickview").toggleClass("open");
        $("#link-quickview-alerts").find("a").click();
    };

    hideTenantLogo = () => {
        $("#tenantLogo").css("display", "none");
    };

    componentDidMount() {
        PubSub.subscribe(Constants.Subscriptions.ProfileUpdate, () => {
            this.updateUserInfo(true);
        });
        PubSub.subscribe(Constants.Subscriptions.UnAuthorised, () => {
            (this.props as any).history.push("/");
        });
        PubSub.subscribe(Constants.Subscriptions.InfoboardUpdate, (key, data: any[]) => {
            let infoboards = _.map(data, (d) => {
                return new InfoboardMenuLink(d.id, d.name, d.shortCode);
            });
            this.updateStateImmutable({ infoboards: infoboards });
            this.forceUpdate();
        });
    };

    componentWillUnmount() {
        PubSub.unsubscribe(Constants.Subscriptions.ProfileUpdate);
        PubSub.unsubscribe(Constants.Subscriptions.UnAuthorised);
        PubSub.unsubscribe(Constants.Subscriptions.InfoboardUpdate);
    }

    boardLinksDom = () => {
        return _.map(this.state.infoboards, (i: InfoboardMenuLink, ix) => {
            return (
                <li key={"lmil" + ix} className="">
                    <Link to={"/app/infoboards/" + i.id}>{i.name}</Link>
                </li>
            );
        });
    };

    saveInfoboardClick = () => {
        if (_s.isBlank(this.state.newInfoboardName)) return;
        this.setState({ addInfoboardDisabled: true });
        (this.refs["modalAdd"] as ModalDialog).hideDialog();
        this._dataStore.AddInfoboard({ name: this.state.newInfoboardName }).then((results) => {
            let boards = this.state.infoboards;
            boards.push(new InfoboardMenuLink(results.data.id, results.data.name, results.data.shortCode));
            this.updateStateImmutable({ infoboards: boards, newInfoboardName: null });
            PubSub.publish(Constants.Subscriptions.Navigate, "/infoboards/" + results.data.id);
        });
    };

    newInfoboardNameChange = (newValue: string) => {
        this.updateStateImmutable({ newInfoboardName: newValue });
    };

    addInfoboard = () => {
        this.setState({ addInfoboardDisabled: false });
        (this.refs["modalAdd"] as ModalDialog).showDialog();
        return;
    };

    shouldComponentUpdate(nextProps: IHeaderProperties, nextState: IHeaderState): boolean {
        return (!_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState));
    };

    reload = () => {
        window.location.reload(true);
    };

    render() {
        let userImage = (this.state.user != null && this.state.user.id != null) ? `${Urls.baseUrl()}/User/${Urls.getTenant()}/${this.state.user.id}/ProfileImage?q=${this._makeid(5)}` : "";
        return (
            <nav className="navbar navbar-default navbar-fixed-top">
                <ModalDialog title={this.gs("AddInfoboardTitle") } size={ModalDialogSize.Medium} ref="modalAdd" actions={
                    <Button caption={this.gs("Save") } type="button" disabled={this.state.addInfoboardDisabled} title="Save" onClick={this.saveInfoboardClick} />
                }><br/>
                    <ModalContent>
                        <Form ref="form">
                            <TextBox type="text" caption={this.gs("Name") } value={this.state.newInfoboardName} onChange={this.newInfoboardNameChange}/>
                        </Form>
                    </ModalContent>
                </ModalDialog>
                <div className="container-fluid">
                    <div className="navbar-header">
                        <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
                            <span className="sr-only">Toggle navigation</span>
                            <span className="icon-bar"></span>
                            <span className="icon-bar"></span>
                            <span className="icon-bar"></span>
                        </button>
                        <a className="navbar-brand" href="#"><InfoveaveLogo/></a>
                    </div>

                    <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                        <ul className="nav navbar-nav">
                        </ul>
                        <ul className="nav navbar-nav navbar-right">
                            <ShouldRender _store={this._authStore} view="Infoboards">
                                <li className="dropdown">
                                    <a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><i className="fa fa-book" aria-hidden="true"></i>
                                        <span className="title"> {this.gs("Infoboards") }</span>
                                    </a>
                                    <ul className="dropdown-menu">
                                        { this.boardLinksDom() }
                                        <li role="separator" className="divider"></li>
                                        <ShouldRender _store={this._authStore} view="Infoboards" action="Add">
                                            <li className="">
                                                <a onClick={this.addInfoboard} data-help="leftSidebar.AddInfoboard" style={{ "cursor": "pointer" }}>{this.gs("AddInfoboard") } <i className="fa fa-plus-circle" aria-hidden="true"></i></a>
                                            </li>
                                        </ShouldRender>
                                    </ul>
                                </li>
                            </ShouldRender>
                            <ShouldRender _store={this._authStore} view="QueryBuilder">
                                <li className="dropdown">
                                    <a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><i className="fa fa-list-alt" aria-hidden="true"></i> Reports</a>
                                    <ul className="dropdown-menu">
                                        <li><Link to="/app/reportManager">{this.gs("Reports") }</Link></li>
                                        <li><Link to="/app/queryBuilder">{this.gs("QueryBulider") }</Link></li>
                                    </ul>
                                </li>
                            </ShouldRender>
                            <ShouldRenderIncludes _store={this._authStore} views={["DataSource", "User", "Role", "ColorPalette"]}>
                                <li className="dropdown">
                                    <a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><i className="fa fa-user" aria-hidden="true"></i> Administration</a>
                                    <ul className="dropdown-menu">
                                        <ShouldRender _store={this._authStore} view="Role">
                                            <li><Link to="/app/roleManager">Roles</Link></li>
                                        </ShouldRender>
                                        <ShouldRender _store={this._authStore} view="User">
                                            <li><Link to="/app/userManager">Manage Users</Link></li>
                                        </ShouldRender>
                                        <ShouldRender _store={this._authStore} view="DataSource">
                                            <li><Link to="/app/dataSourceManager">Data Sources</Link></li>
                                        </ShouldRender>
                                        <ShouldRender _store={this._authStore} view="ColorPalette">
                                            <li><Link to="/app/colorPalette">Color Palette</Link></li>
                                        </ShouldRender>
                                    </ul>
                                </li>
                            </ShouldRenderIncludes>
                            <li><div className="pull-right hidden-sm hidden-xs">
                                <div className="header-inner">
                                    <IconMenu desktop={true} iconButtonElement={<IconButton><div className="thumbnail-wrapper d32 circular inline hint--left" style={{ fontSize: "12px" }}>
                                        <img src={userImage} className="hint--left" data-hint="Profile, Options"  alt={this.gs("EditProfile") } data-src={userImage} data-src-retina={userImage} width="32" height="32"/></div></IconButton>}
                                        anchorOrigin={{ horizontal: "right", vertical: "top" }} targetOrigin={{ horizontal: "right", vertical: "top" }} >
                                        <MenuItem primaryText={this.state.user.name} style={{ fontSize: "14px" }} onTouchTap={this.reload} />
                                        <Divider/>
                                        <MenuItem primaryText={<Link to="/app/profile" style={{ color: "black" }}>{this.gs("EditProfile") }</Link>}  />
                                        <MenuItem primaryText={this.gs("LogOut") }  onTouchTap={this.logoutClick} />
                                        <Divider/>
                                        <MenuItem primaryText={`${this.gs("Version")} : A.${this.state.user.version} C.${versionInfo.version}`}/>
                                    </IconMenu>
                                    <i className="p-l-5 demo-fs-23 fa fa-question-circle"/>
                                </div>
                            </div></li>
                        </ul>
                    </div>
                </div>
            </nav>
        );
    }
}
// leftIcon={<i className="fa fa-user"/>}
// leftIcon={<i className="fa fa-bell"/>}
// leftIcon={<i className="fa fa-power-off"/>}