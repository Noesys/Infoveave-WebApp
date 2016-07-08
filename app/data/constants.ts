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
export const Urls = {
    domainUrl : () => {
        if (window.location.hostname.toLowerCase() === "localhost" && localStorage.getItem("ApplicationURL") != null && localStorage.getItem("ApplicationURL") !== "") {
            return "http://" + localStorage.getItem("ApplicationURL") + "/";
        }
        if (window.location.hostname.toLowerCase() === "localhost") {
            return "http://localhost:8311/";
        }
        return (window.location.protocol + "//" + window.location.host + "/");
    } ,
    baseUrl: () => {
        if (window.location.hostname.toLowerCase() === "localhost" && localStorage.getItem("ApplicationURL") != null && localStorage.getItem("ApplicationURL") !== "") {
            return "http://" + localStorage.getItem("ApplicationURL") + "/api/v2";
        }
        if (window.location.hostname.toLowerCase() === "localhost") {
            return "http://localhost:8311/api/v2";
        }
        return "/api/v2";
    } ,
    getTenant : () => {
        let tenant = null;
        tenant = localStorage.getItem("Tenant");
        if (tenant === null || tenant === "" || tenant === undefined) {
            if ((window as any).tenant != null) {
                tenant = (window as any).tenant;
            }
        };
        return tenant;
    }
};

export const ViewComponent = {
    Infoboard: "Infoboard",
    DataSource: "Data Source",
    Formula: "Formula",
    WhatIfAnalysis: "What If Analysis",
    DataUpload: "Data Upload",
    User: "Users",
    Role: "Roles",
    Report: "Reports",
    QueryBuilder : "QueryBuilders",
    ColorPalette: "ColorPalette"
};

export const Subscriptions = {
    Logout: "logout",
    Notify: "notify",
    ProfileUpdate: "profileUpdate",
    Navigate: "navigate",
    InfoboardUpdate: "infoboardUpdate",
    ShowAnnotations: "showAnnotations",
    AddAnnotation: "addAnnotation",
    UnAuthorised: "unAuthorised"
};