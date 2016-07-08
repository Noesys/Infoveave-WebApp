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
import * as PureRenderMixin from "react-addons-pure-render-mixin";
import * as PubSub from "pubsub-js";
import * as Constants from "./../data/constants";
export class BaseComponent<Tp, Ts> extends React.Component<Tp, Ts> {
    createElementId = (name: string) => {
        return name.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    };
    randomId: string;
    protected _makeid(no: number) {
        let text = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < no; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    };

    constructor() {
        super();
        this.randomId = this._makeid(4);
        if ((window as any).baseLanguageData == null) {
            /* tslint:disable */
            let baseLanguageData = require("./../i18n/base");
            /* tslint:enable */
            (window as any).baseLanguageData = baseLanguageData;
        }
    };

    updateStateImmutable (Object: any) {
        this.setState(_.assign(this.state, Object) as Ts);
    };

    setLanguage(locale) {
        if (Modernizr.localstorage) {
            localStorage.setItem("language", locale);
        } else {
            (window as any).appLanguage = locale;
        }
    }

    notify(component: string, type: "warning" | "error" | "info" | "success", persist: boolean, message: string, additionlData?: any) {
         let level: any = type;
            if (level === "error") {
                level = "danger";
            }
        $("body").pgNotification({
            thumbnail: "<img src='/assets/ico/64_ts.png'/>",
            style: "flip",
            timeout: 3000,
            position: "top-right",
            type: level,
            message: message
        }).show();
        if (persist) {
            PubSub.publish(Constants.Subscriptions.Notify, { component: component, type: type, message: message, additionlData: additionlData });
        }
    };

    /*
    shouldComponentUpdate () {
        return PureRenderMixin.shouldComponentUpdate.apply(this, arguments);
    };*/

    getLangauge() {
        let lang = "";
        if (Modernizr.localstorage) {
            lang = localStorage.getItem("language");
        } else {
            lang = (window as any).appLanguage;
        }
        if (lang === "" || lang == null) { lang = "en"; this.setLanguage("en"); }
        return lang;
    };

    gs(key: string): string {
        if ((window as any).baseLanguageData == null) { return "i18n Not Loaded"; };
        if ((window as any).baseLanguageData[this.getLangauge()] == null) { return "i18n Language missing"; };
        if ((window as any).baseLanguageData[this.getLangauge()][key] == null) { return "i18n Content missing"; };
        return (window as any).baseLanguageData[this.getLangauge()][key];
    };

    s(key: string): string {
        if ((window as any).languageData == null) { return "i18n Not Loaded"; };
        if ((window as any).languageData[this.getLangauge()] == null) { return "i18n Language missing"; };
        if ((window as any).languageData[this.getLangauge()][key] == null) { return "i18n Content missing"; };
        return (window as any).languageData[this.getLangauge()][key];
    };

}