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
/// <reference path="../../typings/references.d.ts"/>
"use strict";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { BaseComponent } from "./../components/baseComponent";
import $ from "jquery";
import * as PubSub from "pubsub-js";
import * as Constants from "./../data/constants";
import { AuthorisationStore } from "./../data/dataStore";
import { Redirect } from "react-router";
import ThemeManager from "material-ui/lib/styles/theme-manager";
import { muiTheme } from "./../components/muiTheme";


export interface IApplicationViewBaseState {
    loading?: boolean;
    helpSteps?: any[];
}

export abstract class ApplicationView<T, V> extends BaseComponent<T, V> {

    static childContextTypes = {
        muiTheme : React.PropTypes.object
    };

    getChildContext() {
        return {
            muiTheme: ThemeManager.getMuiTheme(muiTheme),
        };
    };

    _authStore: AuthorisationStore = new AuthorisationStore();
    onHelpClick = () => {
       return;
    };

    getHash(): any {
        if (window.location.hash) {
            let hash = window.location.hash.substring(1);
            if (hash.length === 0) {
                return null;
            } else {
                return hash;
            }
        } else {
            return null;
        }
    }

    onFieldChange = (model, fieldName, value) => {
        if (model === "state") {
            let newState = _.clone(this.state);
            newState[fieldName] = value;
            this.setState(newState);
            return;

        }
        _.set(model, fieldName, value);
    };

    navigateTo = (url: string) => {
        (this.props as any).history.push("/app" + url);
    };

    updateStateImmutable(Object: any) {
        this.setState(_.assign(this.state, Object) as V);
    };
    removeItemFromArray = (array: any[], object: any) => {
        return _.chain(array).map(a => JSON.stringify(a)).filter(a => a !== JSON.stringify(object)).map(a => JSON.parse(a)).value();
    };

    showLoading = (progress?: string) => {
        this.updateStateImmutable({ loading: true, progressContent : progress });
    };

    hideLoading = () => {
        this.updateStateImmutable({ loading: false });
    };

    loadLanguage = (name: string) => {
        /* tslint:disable */
        let languageData = require("./../i18n/" + name);
        (window as any).languageData = languageData;
        /* let languageHelpData = require("./../i18n/" + name + ".help");
        (window as any).helpData = languageHelpData;*/
        /* tslint:enable */
    };

    componentDidMount() {
        /* let steps = (window as any).helpData[this.getLangauge()];
        this.updateStateImmutable({ helpSteps: steps}); */
        PubSub.subscribe(Constants.Subscriptions.Logout, () => {
            localStorage.removeItem("token");
            localStorage.removeItem("token_type");
            localStorage.removeItem("userInfo");
            localStorage.removeItem("ups");
            (this.props as any).history.push("/");
        });
        PubSub.subscribe(Constants.Subscriptions.Navigate, (action: string, data: string) => {
            this.navigateTo(data);
        });
    };

    helperDOM() {
      return <div/>;
    };

    parseJSON = (data: string): any | boolean => {
        let val = {};
        try {
            val = JSON.parse(data);
            return val;
        } catch (e) {
            return false;
        }
    };
    canAccess = (module: string, view: string, action: string)  : boolean => {
        let permissions = this._authStore.GetUserPermissions();
         if (_.find(permissions, (p) => { return (p.module === module && p.view === view && p.action === action);  } ) != null) {
            return true;
        } else {
            return false;
        };
    };
}