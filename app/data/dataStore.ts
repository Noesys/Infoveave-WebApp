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
import * as axios from "axios";
import {  Measure, Dimension, Infoboard, InfoboardItem, Widget,
 InputDataSource, DataSource, DataSourceWithMeasuresDimensions,
WidgetDataRequest, WidgetDataResponse, User, Role, Permission, Report, ReportSchedule, CalculatedMeasure, WidgetAnnotation, TableWithColumnMapping } from "./models";
import { Urls, Subscriptions } from "./constants";
import * as PubSub from "pubsub-js";
import * as _ from "lodash";

export abstract class BaseStore {
    domainUrl = Urls.domainUrl();
    baseUrl = (): string => Urls.baseUrl();
    private _baseheaders = {
    };

    private _authHeaders = () => { return {
        headers: {
            "Authorization": (Modernizr.localstorage) ? ("Bearer " + localStorage["token"]) : ((window as any).aat)
        }
     };
    };

    config: Axios.AxiosXHRConfigBase<any> = _.merge(this._baseheaders, { responseType: "json" });
    authConfig: Axios.AxiosXHRConfigBase<any> = _.merge(this._authHeaders(), { responseType: "json" });

    urlEncodedParams = (config: Axios.AxiosXHRConfigBase<any>): Axios.AxiosXHRConfigBase<any> => {
        config.transformRequest = [function(data) {
            let str = [];
            for (let p in data) {
                if (data.hasOwnProperty(p) && data[p]) {
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(data[p]));
                }
            }
            return str.join("&");
        }];
        return config;
    };
}

export class AuthorisationStore extends BaseStore {

    SetLogin = (data: { access_token: string, expires_in: number, token_type: string }): Boolean => {
        if (Modernizr.localstorage) {
            localStorage.setItem("token_type", data.token_type);
            localStorage.setItem("token", data.access_token);
        } else {
            (window as any).att = data.token_type;
            (window as any).aat = data.access_token;
        }
        return true;
    };


    Login = (username: string, password: string): Axios.IPromise<Axios.AxiosXHR<{ access_token: string, expires_in: number, token_type: string }>> => {
        localStorage.removeItem("userInfo");
        return axios.post(this.domainUrl + "connect/token", {
            grant_type: "password",
            username: username,
            password: password,
            scope: "openid profile email roles offline_access Infoveave",
            acr_values: "tenant:" + localStorage.getItem("Tenant"),
            client_id: "Infoveave.WebApp",
            client_secret: "B7190B8A-DDA2-43C1-A248-18AE9F8B25E9"
        }, this.urlEncodedParams( this.config));
    };

    GetPermissionsAndStore = (token: string): Promise<string> => {
        return new Promise((resolve) => {
            axios.get(this.baseUrl() +  "/User/Permissions", {headers: { "Authorization": "Bearer " + token}, responseType: "json" }  ).then((results) => {
                localStorage.setItem("ups", btoa(JSON.stringify(results.data)));
                resolve("Done");
            });
        });
    };
    GetUserPermissions = (): { module: string, view: string, action: string }[] => {
        let permissions = JSON.parse(atob(localStorage.getItem("ups")));
        let permmap = _.map(permissions, (p) => {
            let perm = p.toString().split("|");
            return {module: perm[0] , view: perm[1], action: perm[2]};
        });
        return permmap;
    };
    GetRoute = (token: string): Promise<string> => {
         return new Promise((resolve, reject) => {
             axios.get(this.baseUrl() + "/User/RouteResolver", { headers: { "Authorization": "Bearer " + token }, responseType: "json" })
                 .then((results: Axios.AxiosXHR<{ routeResolver: string }>) => {
                     resolve(results.data.routeResolver);
                 }).catch((results) => {
                     reject(results);
                 });
         });
    };
    GetUserInfoForLogin = (token: string): Promise<Axios.AxiosXHR<User>> => {
        return new Promise((resolve, reject) => {
            axios.get(this.baseUrl() + "/User/CurrentUser", { headers: { "Authorization": "Bearer " + token }, responseType: "json" })
                .then(resolve).catch(reject);
        });
    };

    GetUserInfo = (forceUpdate?: boolean): Promise<User> => {
        return new Promise<User>((resolve) => {
            if (localStorage["userInfo"] == null || forceUpdate) {
                axios.get(this.baseUrl() + "/User/CurrentUser", this.authConfig).then((results) => {
                    localStorage["userInfo"] = JSON.stringify(results.data);
                    resolve(results.data);
                });
            } else {
                resolve(JSON.parse(localStorage["userInfo"]));
            }
        });
    };

    ForgotPassword = (user: User): Promise<Axios.AxiosXHR<User>> => {
        return new Promise((resolve, reject) => {
            axios.post(`${this.baseUrl()}/User/ForgotPassword`, user, this.config).then(resolve).catch(reject);
        });
    };
}


export class CommonStore extends BaseStore {
    GetUserInfo = (forceUpdate?: boolean) => {
        return new Promise<any>((resolve) => {
            if (localStorage["userInfo"] == null || forceUpdate) {
                axios.get(this.baseUrl() + "/User/CurrentUser", this.authConfig).then((results) => {
                    localStorage["userInfo"] = JSON.stringify(results.data);
                    resolve(results.data);
                });
            } else {
                resolve(JSON.parse(localStorage["userInfo"]));
            }
        });
    };
    GetInfoboards = (): Axios.IPromise<Axios.AxiosXHR<Infoboard[]>> => {
        return axios.get(this.baseUrl() + "/Infoboards", this.authConfig);
    };

    AddInfoboard = (data: Infoboard) : Axios.IPromise<Axios.AxiosXHR<Infoboard>> => {
        return axios.post(this.baseUrl() + "/Infoboards", data, this.authConfig);
    };
    DeleteInfoboard = (id: number) : Axios.IPromise<Axios.AxiosXHR<Infoboard>> => {
        return axios.delete(this.baseUrl() + "/Infoboards/" + id, this.authConfig);
    };

    SortInfoboards = (data: Array<Infoboard>): Axios.IPromise<Axios.AxiosXHR<Infoboard>> => {
        return axios.put(this.baseUrl() + "/Infoboards/sort", data, this.authConfig);
    };

   UpdateInfoboard = (id: number, data: Infoboard): Axios.IPromise<Axios.AxiosXHR<Infoboard>> => {
        return axios.put(this.baseUrl() + "/Infoboards/" + id, data, this.authConfig);
    };

    ShareInfoboard = (id: number, isPublic: Boolean) : Axios.IPromise<Axios.AxiosXHR<Infoboard>> => {
        return axios.put(this.baseUrl() + "/Infoboards/" + id + "/Share", null, this.authConfig);
    };

    ExportInfoboards = () : Axios.IPromise<Axios.AxiosXHR<number>> => {
        return axios.post(`${this.baseUrl()}/Infoboards/ExportDefault`, null, this.authConfig);
    };

    RestoreInfoboards = () : Axios.IPromise<Axios.AxiosXHR<any>> => {
        return axios.post(`${this.baseUrl()}/Infoboards/ImportDefault`, null, this.authConfig);
    };
}


export class UserStore extends BaseStore {

    GetUsers = (): Axios.IPromise<Axios.AxiosXHR<User[]>> => {
        return axios.get(this.baseUrl() + "/User", this.authConfig);
    };
    GetUser = (id: number): Axios.IPromise<Axios.AxiosXHR<User>> => {
        return axios.get(this.baseUrl() + "/User/" + id, this.authConfig);
    };
    DeleteUser = (id: number): Axios.IPromise<Axios.AxiosXHR<any>> => {
        return axios.delete(this.baseUrl() + "/User/" + id, this.authConfig);
    };
    GetRoles = (): Axios.IPromise<Axios.AxiosXHR<Role[]>> => {
        return axios.get(this.baseUrl() + "/Role", this.authConfig);
    };
    AddUser = (data: User): Axios.IPromise<Axios.AxiosXHR<User>> => {
        return axios.post(this.baseUrl() + "/User", data, this.authConfig);
    };
    UpdateUser = (id: number, data: User): Axios.IPromise<Axios.AxiosXHR<User>> => {
        return axios.put(this.baseUrl() + "/User/" + id, data, this.authConfig);
    };
    ResetPassword = (id: number): Axios.IPromise<Axios.AxiosXHR<User>> => {
        return axios.get(this.baseUrl() + "/User/" + id + "/ResetPassword", this.authConfig);
    };
    UnlockUser = (id: number): Axios.IPromise<Axios.AxiosXHR<User>> => {
        return axios.get(this.baseUrl() + "/User/" + id + "/UnlockUser", this.authConfig);
    };
    GetCurrentUser = (): Axios.IPromise<Axios.AxiosXHR<User>> => {
        return axios.get(this.baseUrl() + "/User/CurrentUser", this.authConfig);
    };
    ChangePassword = (oldPassword: string, password: string): Axios.IPromise<Axios.AxiosXHR<User>> => {
        return axios.put(this.baseUrl() + "/User/ChangePassword", { oldPassword: oldPassword, newPassword: password }, this.authConfig);
    };
    UploadImage = (id: number, file: File): Axios.IPromise<Axios.AxiosXHR<{ name: string, path: string }>> => {
        let formData = new FormData();
        formData.append("file", file);
        return axios.post(this.baseUrl() + "/User/" + id + "/ProfileImage", formData, this.authConfig);
    };
    GetDataSources = (): Axios.IPromise<Axios.AxiosXHR<DataSourceWithMeasuresDimensions[]>> => {
        return axios.get(this.baseUrl() + "/User/DataSources", this.authConfig);
    };
    GetDimensionItems = (dataSourceId: number, dimensionId: number, query: string): Axios.IPromise<Axios.AxiosXHR<string[]>> => {
        return axios.get(this.baseUrl() + "/User/DataSources/" + dataSourceId + "/Dimensions/" + dimensionId + "?query=" + query, this.authConfig);
    };
    UpdateProfile = (data: User): Axios.IPromise<Axios.AxiosXHR<User>> => {
        return axios.put(this.baseUrl() + "/User/UpdateProfile", data, this.authConfig);
    };
}
export class RoleStore extends BaseStore {
    GetRoles = (): Axios.IPromise<Axios.AxiosXHR<Role[]>> => {
        return axios.get(this.baseUrl() + "/Role", this.authConfig);
    };
    GetRole = (id: number): Axios.IPromise<Axios.AxiosXHR<Role[]>> => {
        return axios.get(this.baseUrl() + "/Role/" + id, this.authConfig);
    };
    DeleteRole = (id: number): Axios.IPromise<Axios.AxiosXHR<any>> => {
        return axios.delete(this.baseUrl() + "/Role/" + id, this.authConfig);
    };
    AddRole = (data: Role): Axios.IPromise<Axios.AxiosXHR<User>> => {
        return axios.post(this.baseUrl() + "/Role", data, this.authConfig);
    };
    UpdateRole = (id: number, data: Role): Axios.IPromise<Axios.AxiosXHR<User>> => {
        return axios.put(this.baseUrl() + "/Role/" + id, data, this.authConfig);
    };
    GetPermissions = (): Axios.IPromise<Axios.AxiosXHR<Permission[]>> => {
        return axios.get(this.baseUrl() + "/Role/Permissions", this.authConfig);
    };
}

export class DataSourceStore extends BaseStore {
    GetDataSources = (): Axios.IPromise<Axios.AxiosXHR<DataSource[]>> => {
        return axios.get(this.baseUrl() + "/DataSources", this.authConfig);
    };

    GetDataSource = (id: number): Axios.IPromise<Axios.AxiosXHR<DataSource>> => {
        return axios.get(this.baseUrl() + "/DataSources/" + id , this.authConfig);
    };

    CreateUploadDataSource = (data: any): Axios.IPromise<Axios.AxiosXHR<DataSource>> => {
        return axios.post(this.baseUrl() + "/DataSources/FileBased", data, this.authConfig);
    };

    GetMeasuresForSource = (data: InputDataSource): Axios.IPromise<Axios.AxiosXHR<Measure[]>> => {
        return axios.post(this.baseUrl() + "/DataSources/Measures", data, this.authConfig);
    };

    GetDimensionsForSource = (data: InputDataSource): Axios.IPromise<Axios.AxiosXHR<Dimension[]>> => {
        return axios.post(this.baseUrl() + "/DataSources/Dimensions", data, this.authConfig);
    };

    GetMeasures = (dataSourceId: number): Axios.IPromise<Axios.AxiosXHR<Measure[]>> => {
        return axios.get(this.baseUrl() + "/DataSources/" + dataSourceId + "/Measures", this.authConfig);
    };

    GetDimensions = (dataSourceId: number): Axios.IPromise<Axios.AxiosXHR<Dimension[]>> => {
        return axios.get(this.baseUrl() + "/DataSources/" + dataSourceId + "/Dimensions", this.authConfig);
    };

    GetDimensionItems = (dataSourceId: number, dimensionId: number, query: string): Axios.IPromise<Axios.AxiosXHR<{ name: string }[]>> => {
        return axios.get(this.baseUrl() + "/DataSources/" + dataSourceId + "/Dimensions/" + dimensionId + "?query=" + query, this.authConfig);
    };

    DeleteDataSource = (id: number): Axios.IPromise<Axios.AxiosXHR<DataSource>> => {
        return axios.delete(this.baseUrl() + "/DataSources/" + id, this.authConfig);
    };

    ToggleDataSourceShare = (id: number) => {
        return axios.put(this.baseUrl() + "/DataSources/" + id + "/Share", null, this.authConfig);
    };

    CreateUploadBatch = (id: number):  Axios.IPromise<Axios.AxiosXHR<{id: number, batchBeginTime: Date}>> => {
        return axios.post(this.baseUrl() + "/DataSources/" + id + "/UploadBatch", null, this.authConfig);
    };

    UploadBatchData = (id: number, batchId: number, data: any[]):  Axios.IPromise<Axios.AxiosXHR<{id: number, batchBeginTime: Date}>> => {
        return axios.post(this.baseUrl() + "/DataSources/" + id + "/Upload/" + batchId, data, this.authConfig);
    };

    UploadBatchComplete = (id: number, batchId: number):  Axios.IPromise<Axios.AxiosXHR<{}>> => {
        return axios.post(this.baseUrl() + "/DataSources/" + id + "/UploadComplete/" + batchId, {}, this.authConfig);
    };

    GetCalulatedMeasures = (id: number): Axios.IPromise<Axios.AxiosXHR<CalculatedMeasure[]>> => {
        return axios.get(`${this.baseUrl()}/DataSources/${id}/CalculatedMeasures`, this.authConfig);
    };

    CreateCalculatedMeasure = (id: number, data: CalculatedMeasure):  Axios.IPromise<Axios.AxiosXHR<CalculatedMeasure>> => {
        return axios.post(`${this.baseUrl()}/DataSources/${id}/CalculatedMeasures`, data, this.authConfig);
    };

    UpdateCalculatedMeasure = (id: number, measureId: number, data: CalculatedMeasure):  Axios.IPromise<Axios.AxiosXHR<CalculatedMeasure>> => {
        return axios.put(`${this.baseUrl()}/DataSources/${id}/CalculatedMeasures/${measureId}`, data, this.authConfig);
    };

    DeleteCalculatedMeasure = (id: number, measureId: number):  Axios.IPromise<Axios.AxiosXHR<CalculatedMeasure>> => {
        return axios.delete(`${this.baseUrl()}/DataSources/${id}/CalculatedMeasures/${measureId}`, this.authConfig);
    };

    ValidateSchema = (file: File): Axios.IPromise<Axios.AxiosXHR<any>> => {
        let formData = new FormData();
        formData.append("file", file);
        return axios.post(`${this.baseUrl()}/DataSources/MondrianDirect/ValidateSchema`, formData, this.authConfig);
    };

    GetMondiranDirectMeasureDimensions = (data: InputDataSource): Axios.IPromise<Axios.AxiosXHR<{measures: Measure[], dimensions: Dimension[]}>> => {
        return axios.post(`${this.baseUrl()}/DataSources/MondrianDirect/MeasureDimensions`, data, this.authConfig);
    };

    CreateMondiranDirectSource = (data: any ): Axios.IPromise<Axios.AxiosXHR<DataSource>> => {
        return axios.post(`${this.baseUrl()}/DataSources/MondrianDirect/`, data, this.authConfig);
    };

    GetColorPalette = (): Axios.IPromise<Axios.AxiosXHR<{ dataSourceId: number, dimensionId: number, dimensionName: string, dimensionItem: string, color: string }[]>> => {
        return axios.get(`${this.baseUrl()}/ColorPalette`, this.authConfig);
    };

    SaveColorPalette = (data: { dataSourceId: number, dimensionId: number, dimensionItem: string, color: string }[]): Axios.IPromise<Axios.AxiosXHR<DataSource>> => {
        return axios.post(`${this.baseUrl()}/ColorPalette`, data, this.authConfig);
    };

    GetUploadBatchInfo = (id: number): Axios.IPromise<Axios.AxiosXHR<{batchId: number, uploadTime: Date, noOfRows: number}[]>> => {
        return axios.get(`${this.baseUrl()}/DataSources/${id}/UploadBatch`, this.authConfig);
    };
    DeleteUploadBatch = (id: number, batchId: number): Axios.IPromise<Axios.AxiosXHR<any>> => {
        return axios.delete(`${this.baseUrl()}/DataSources/${id}/UploadBatch/${batchId}`, this.authConfig);
    };
    DeleteAllUploadBatches = (id: number): Axios.IPromise<Axios.AxiosXHR<any>> => {
        return axios.delete(`${this.baseUrl()}/DataSources/${id}/UploadBatch/All`, this.authConfig);
    };
}


export class InfoboardStore extends BaseStore {
    GetInfoboard = (id: number): Axios.IPromise<Axios.AxiosXHR<Infoboard>> => {
        return axios.get(this.baseUrl() + "/Infoboards/" + id, this.authConfig);
    };

    GetWidgets = (): Axios.IPromise<Axios.AxiosXHR<Widget[]>> => {
        return axios.get(this.baseUrl() + "/Infoboards/Widgets", this.authConfig);
    };

    GetDataSources = (): Axios.IPromise<Axios.AxiosXHR<DataSourceWithMeasuresDimensions[]>> => {
        return axios.get(this.baseUrl() + "/Infoboards/DataSources", this.authConfig);
    };

    UpdateInfoboard = (id: number, data: Infoboard): Axios.IPromise<Axios.AxiosXHR<Infoboard>> => {
        return axios.put(this.baseUrl() + "/Infoboards/" + id, data, this.authConfig);
    };

    UpdateInfoboardState = (id: number, items: { id: number, x: number, y: number, w: number, h: number }[]) => {
        return axios.post(this.baseUrl() + "/Infoboards/" + id + "/UpdateState", items, this.authConfig);
    };

    UpdateInfoboardLayout = (id: number, data: { layouts: any }) => {
        return axios.put(this.baseUrl() + "/Infoboards/" + id + "/UpdateLayout", data, this.authConfig);
    };

    GetDimensionItems = (dataSourceId: number, dimensionId: number, query: string): Axios.IPromise<Axios.AxiosXHR<string[]>> => {
       return axios.get(this.baseUrl() + "/Infoboards/DataSources/" + dataSourceId + "/Dimensions/" + dimensionId + "?query=" + query, this.authConfig);
    };

    CreateWidget = (data: Widget): Axios.IPromise<Axios.AxiosXHR<Widget>> => {
        return axios.post(this.baseUrl() + "/Infoboards/Widgets", data, this.authConfig);
    };

    AddWidgetToBoard = (id: number, item: InfoboardItem): Axios.IPromise<Axios.AxiosXHR<InfoboardItem>> => {
        return axios.post(this.baseUrl() + "/Infoboards/" + id + "/Items/", item, this.authConfig);
    };

    RemoveWidgetFromBoard = (id: number, linkId: number): Axios.IPromise<Axios.AxiosXHR<any>> => {
        return axios.delete(this.baseUrl() + "/Infoboards/" + id + "/Items/" + linkId, this.authConfig);
    };

    GetUsers = ():  Axios.IPromise<Axios.AxiosXHR<User[]>> => {
        return axios.get(this.baseUrl() + "/Infoboards/Users", this.authConfig);
    };

    GetColorPalette = (): Axios.IPromise<Axios.AxiosXHR<{ dimensionName: string, dimensionItem: string, color: string }[]>> => {
        return axios.get(this.baseUrl() + "/ColorPalette", this.authConfig);
    };
}

export class ReportStore extends BaseStore {
    GetReports = (): Axios.IPromise<Axios.AxiosXHR<Report[]>> => {
        return axios.get(this.baseUrl() + "/Report", this.authConfig);
    };
    FileUpload = (id: number, file: File): Axios.IPromise<Axios.AxiosXHR<any>> => {
        let formData = new FormData();
        formData.append("file", file);
        return axios.post(this.baseUrl() + "/Report/" + id + "/FileUpload", formData, this.authConfig);
    };
    AddReport = (addreport: { name: string, fileName: string }): Axios.IPromise<Axios.AxiosXHR<Report>> => {
        return axios.post(this.baseUrl() + "/Report", addreport, this.authConfig);
    };
    ScheduleReport = (id: number, schedule: ReportSchedule) => {
        return axios.put(this.baseUrl() + "/Report/" + id + "/Schedule", schedule, this.authConfig);
    };
    SendReport = (id: number, schedule: ReportSchedule) => {
        return axios.post(this.baseUrl() + "/Report/" + id + "/Mail", schedule, this.authConfig);
    };

    DeleteReport = (id: number): Axios.IPromise<Axios.AxiosXHR<{ name: string, id: number }>> => {
        return axios.delete(this.baseUrl() + "/Report/" + id, this.authConfig);
    };

    GetUsersEmails = (): Axios.IPromise<Axios.AxiosXHR<{email: string}[]>> => {
        return axios.get(this.baseUrl() + "/User/Emails", this.authConfig);
    };

}


export class QueryBuilderStore extends BaseStore {
    GetDataSources = (): Axios.IPromise<Axios.AxiosXHR<DataSource[]>> => {
        return axios.get(this.baseUrl() + "/QueryBuilder/DataSources", this.authConfig);
    };

    GetFieldItems = (dataSourceId: number, columnName: string, tableName: string, query: string): Axios.IPromise<Axios.AxiosXHR<string[]>> => {
       return axios.get(`${this.baseUrl()}/QueryBuilder/Field/${dataSourceId}/${columnName}/${tableName}?query=${query}`, this.authConfig);
    };

    GetSQLQuery =  (dataSourceId: number, tableName: string, data: any) : Axios.IPromise<Axios.AxiosXHR<{query: string, result: string}>> => {
        return axios.post(`${this.baseUrl()}/QueryBuilder/${dataSourceId}/${tableName}/SQLPreview`, data, this.authConfig);
    };
    GetManualSQLQuery =  (dataSourceId: number, data: any) : Axios.IPromise<Axios.AxiosXHR<{query: string, result: string}>> => {
        return axios.post(this.baseUrl() + "/QueryBuilder/" + dataSourceId + "/ManualSQLPreview", data, this.authConfig);
    };
    SaveSQLQuery =  ( data: any) : Axios.IPromise<Axios.AxiosXHR<{query: string, result: any, id: number}>> => {
        return axios.post(this.baseUrl() + "/QueryBuilder/SaveSQL", data, this.authConfig);
    };
    SaveManualSQLQuery =  ( data: any) : Axios.IPromise<Axios.AxiosXHR<{query: string, result: any, id: number}>> => {
        return axios.post(this.baseUrl() + "/QueryBuilder/SaveManualSQL", data, this.authConfig);
    };
    UpdateSQLQuery =  ( id: number, data: any) : Axios.IPromise<Axios.AxiosXHR<{query: string, result: any, id: number}>> => {
        return axios.post(this.baseUrl() + "/QueryBuilder/" + id + "/SaveSQL", data, this.authConfig);
    };
    UpdateManualSQLQuery =  ( id: number, data: any) : Axios.IPromise<Axios.AxiosXHR<{query: string, result: any, id: number}>> => {
        return axios.post(this.baseUrl() + "/QueryBuilder/" + id + "/SaveManualSQL", data, this.authConfig);
    };

    GetDataReports = (): Axios.IPromise<Axios.AxiosXHR<Report[]>> => {
        return axios.get(this.baseUrl() + "/QueryBuilder", this.authConfig);
    };

    GetDataReport = (id: number): Axios.IPromise<Axios.AxiosXHR<Report>> => {
        return axios.get(`${this.baseUrl()}/QueryBuilder/${id}`, this.authConfig);
    };

    DeleteDataReport = (id: number): Axios.IPromise<Axios.AxiosXHR<{ name: string, id: number }>> => {
        return axios.delete(this.baseUrl() + "/QueryBuilder/" + id, this.authConfig);
    };

    GetReportData = (id: number, data: ReportSchedule) => {
        return axios.post(`${this.baseUrl()}/QueryBuilder/${id}/Data`, data, this.authConfig);
    };

    SendReport = (id: number, schedule: ReportSchedule) => {
        return axios.post(`${this.baseUrl()}/QueryBuilder/${id}/Mail`, schedule, this.authConfig);
    };

    ScheduleReport = (id: number, schedule: ReportSchedule) => {
        return axios.post(`${this.baseUrl()}/QueryBuilder/${id}/Schedule`, schedule, this.authConfig);
    };

    GetDataSourceTables = (id: number): Axios.IPromise<Axios.AxiosXHR<TableWithColumnMapping[]>> => {
        return axios.get(`${this.baseUrl()}/QueryBuilder/DataSources/${id}/Tables`, this.authConfig);
    }
}


export class CoreDataStore extends BaseStore {
    GetWidget = (id: number): Axios.IPromise<Axios.AxiosXHR<Widget>> => {
        return axios.get(this.baseUrl() + "/Data/Widgets/" + id, this.authConfig);
    };

    DeleteWidget = (id: number): Axios.IPromise<Axios.AxiosXHR<Widget>> => {
        return axios.delete(this.baseUrl() + "/Data/Widgets/" + id, this.authConfig);
    };

    ToggleWidgetShare = (id: number) => {
        return axios.put(this.baseUrl() + `/Data/Widgets/${id}/Share`, null, this.authConfig);
    };
    GetWidgetData = (data: WidgetDataRequest): Axios.IPromise<Axios.AxiosXHR<WidgetDataResponse>> => {
        return axios.post(this.baseUrl() + "/Data/Widgets/Data/", data, this.authConfig);
    };

    GetWidgetImageAsBase64 = (tenant: string, id: number, progression: string, width: string, height: string): Axios.IPromise<Axios.AxiosXHR<{image: string, width: number, height: number}>> => {
        return axios.get(this.domainUrl + `/Charts/${tenant}/${id}/${progression}/${width}/${height}/Image`, this.authConfig);
    };

    AddWidgetAnnotation = (id: number, data: WidgetAnnotation): Axios.IPromise<Axios.AxiosXHR<WidgetAnnotation>> => {
        return axios.post(this.baseUrl() + `/Data/Widgets/${id}/Annotate`, data, this.authConfig);
    };

    GetWidgetAnnotations = (id: number, data: WidgetAnnotation): Axios.IPromise<Axios.AxiosXHR<WidgetAnnotation[]>> => {
        return axios.post(this.baseUrl() + `/Data/Widgets/${id}/Annotations`, data, this.authConfig);
    };

    DeleteWidgetAnnotation = (id: number, annotationId: number): Axios.IPromise<Axios.AxiosXHR<WidgetAnnotation>> => {
        return axios.delete(this.baseUrl() + `/Data/Widgets/${id}/Annotations/${annotationId}`, this.authConfig);
    };
}
