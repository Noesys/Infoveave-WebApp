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
import * as _s from "underscore.string";
import { ApplicationView } from "./applicationView";
import { Form, TextBox, CheckBox, Button, Message, A } from "./../components/formComponents";
import { InfoveaveLogo } from   "./../components/infoveaveLogo";
import { AuthorisationStore, DataSourceStore } from "./../data/dataStore";
import { Urls } from "../data/constants";
interface ILoginProps {
    history?: any;
}

interface ILoginState {
    inProgress: boolean;
    hasError: boolean;
    errorMessage: string;
    username: string;
    password: string;
    forgotVisible?: boolean;
}

export class Login extends ApplicationView<ILoginProps, ILoginState> {
    constructor() {
        super();
        this.loadLanguage("login");
    }

    private _dataStore: AuthorisationStore = new AuthorisationStore();

    componentWillMount = () => {
        this.setState({
            inProgress: false,
            hasError: false,
            errorMessage: "",
            username: "",
            password: "",
            forgotVisible: true,
        });
    };

    onFieldChange = (fieldName, value) => {
        let updateObj = {};
        updateObj[fieldName] = value;
        this.updateStateImmutable(updateObj);
    };

    keyUnbinder = null;

    componentDidMount() {
        super.componentDidMount();
        this.keyUnbinder = keymage("enter", () => { this.login(); });
    }

    componentWillUnmount() {
        this.keyUnbinder();
    };

    login = () => {
        if ((this.refs["form"] as Form).isValid()) {
            this.setState(_.assign(this.state, { inProgress: true }) as ILoginState);
            this._dataStore.Login(this.state.username, this.state.password).then((result) => {
                this._dataStore.SetLogin(result.data);
                Promise.all([
                    this._dataStore.GetPermissionsAndStore(result.data.access_token),
                    this._dataStore.GetRoute(result.data.access_token),
                    this._dataStore.GetUserInfoForLogin(result.data.access_token),
                ]).then((results) => {
                    let lang = _s.isBlank(results[2].data.language) ? "en" : results[2].data.language;
                    localStorage.setItem("language", lang);
                    this.updateStateImmutable({ inProgress: false, hasError: false, errorMessage: null });
                    this.props.history.push(results[1]);
                });
            }).catch((error) => {
                let errorMessage = (error != null && error.data != null && error.data.error_description != null) ? error.data.error_description : this.gs("ContactSupport");
                this.updateStateImmutable({ inProgress: false, hasError: true, errorMessage: this.s("InvalidPassword") });
            });
        }
    };

    forgotPasswordClick = () => {
        if (_s.isBlank(this.state.username)) {
            this.notify("Login", "error", false, this.s("EnterUsername"));
            return;
        }
        let user: any = { userName: this.state.username, tenant: Urls.getTenant() };
        this._authStore.ForgotPassword(user).then((results) => {
            this.notify("Login", "success", false, _s.sprintf(this.s("ForgotPasswordSuccess"), results.data.email));
        }).catch((results) => {
            this.notify("Login", "error", false, this.s("ForgotResetFailure"));
        });
    };

    render() {
        return (
            <div className="login-wrapper">
                <div className="loginContainer bg-white">
                    <div className="loginLogo">
                        <InfoveaveLogo />
                    </div>
                    <div className="p-l-50 m-l-20 p-r-50 m-r-20 sm-p-l-15 sm-p-r-15 sm-p-t-40">
                        <div className="loginForm">
                            <p className="p-t-35">{this.s("SignInMessage") }</p>
                            <Form className="p-t-15" ref="form">
                                { (this.state.inProgress) ? <Message type="info" message="Please Wait" inProgress={true} /> : "" }
                                { (this.state.hasError && !this.state.inProgress) ? <Message type="danger" message={this.state.errorMessage} /> : "" }
                                <TextBox caption={this.s("Login") } type="text"  placeholder="Username" required={true} value={this.state.username} onChange={_.partial(this.onFieldChange, "username") } />
                                <TextBox caption={this.s("Password") } type="password" placeholder="Credentials" required={true} value={this.state.password}  onChange={_.partial(this.onFieldChange, "password") } />
                                { (this.state.forgotVisible) ? <a className="pull-right" style={{cursor:"pointer"}} onClick={this.forgotPasswordClick}>{this.s("ForgotPassword") }</a> : "" }
                            </Form>
                            <Button className="btn-cons m-t-10" type="button" title={this.s("SignIn") } onClick={this.login}>{this.s("SignIn") }</Button>
                        </div>
                        <div className="loginCopyright m-t-80">
                            <h2 className="semi-bold">Visual Analytics Studio</h2>
                            <p className="small">
                                © 2013-2016 Noesys Software Pvt Ltd.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
};