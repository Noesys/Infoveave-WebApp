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

export interface Widget {
    id: number;
    name: string;
    description: string;
    type: string;
    data: string;
    dataSourceIds: string;
    shortCode: string;
    isPublic: boolean;
}

export interface InfoboardItem {
    id?: number;
    w: number;
    h: number;
    x: number;
    y: number;
    widgetId: number;
    autoPosition?: boolean;
}

export interface Infoboard {
    id?: number;
    name: string;
    options?: string;
    shortCode?: string;
    items?: InfoboardItem[];
    measures?: Measure[];
    dimensions?: Dimension[];
    sortOrder?: number;
    isPublic?: boolean;
    layouts?: string;
}


export interface Measure {
    id?: number;
    name?: string;
    query: string;
    dataSourceId?: number;
}

export interface Dimension {
    id?: number;
    name: string;
    query: string;
    isDate: boolean;
    dataSourceId?: number;
}



export interface InputDataSource {
    adapter: string;
    server: string;
    database: string;
    cube: string;
    fileName?: string;
}


export interface DataSource {
    id: number;
    name: string;
    type: string;
    columnMapping?: string;
    validationSchema?: string;
    isPublic?: boolean;
    canShare?: boolean;
}

export interface TableWithColumnMapping {
    dataSourceId: number;
    tableName: string;
    caolumnMapping: {label: string, value: string; type: string; }[];
}

export interface DataSourceWithMeasuresDimensions {
    id: number;
    name: string;
    type: string;
    measures: Measure[];
    dimensions: Dimension[];
}

export interface WidgetRequestDimension {
    query: string;
    items: string[];
}
export interface WidgetDataRequest {
    measures: Measure[];
    dimensions: WidgetRequestDimension[];
    filters: WidgetRequestDimension[];
    startDate: string;
    endDate: string;
    dateQuery: string;
    retrieveNullValues: boolean;
}

export interface MeasureMetadata {
    query: string;
    isPercent: boolean;
    prefix: string;
    suffix: string;
}

export interface WidgetDataResponse {
    data: Array<any>;
    measureMetaData: MeasureMetadata[];
    dataFetchedFrom: number;
    executionTime: number;
    dateIntervalUsed: string;
}
export interface User {
    id?: number;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    imagePath?: string;
    createdOn?: Date;
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    isLocked?: boolean;
    roleId: Number;
    roleName?: string;
    language?: string;
    importDashboards?: boolean;
}

export interface IUserContext {
    "dataSourceId": number;
    "dimensionId": number;
    "query": string;
    "items": string[];
}

export interface View {
    view: string;
    displayName: string;
    actions: string[];
}
export interface Permission {
    module: string;
    displayName: string;
    displayPath: string;
    Views: View [];
}
export interface Role {
    id?: number;
    name: string;
    permissions: string;
    checkedPermissions?: string[];
    permissionTemplate: Permission[];
    createdBy?: string;
    createdOn?: Date;
}
export interface Report {
     id?: number;
     name: string;
     createdBy?: string;
     createdOn?: Date;
     scheduleReport: string;
     mailTo: string;
     type: string;
     reportId?: number;
     parameter?: IWhereField[];
     scheduleParameter?: IWhereField[];
     fileName: string;
     dataSourceId?: number;
}

export interface ReportSchedule {
    scheduleString: string;
    recipients: string[];
    parameters: IWhereField[];
}

export interface ISelectField {
    function: string;
    field: {label: string, value: string };
    display: string;
}

export interface IWhereField {
    field: { label: string, value: string, type: string  };
    comparer: string;
    expression: any;
}

export interface CalculatedMeasure {
    id?: number;
    name: string;
    description: string;
    query: string;
    formula: string;
    prefix: string;
    suffix: string;
    isPercent?: boolean;
}

export interface WidgetAnnotation {
    id?: number;
    startDate: string;
    endDate: string;
    content: string;
    data: string;
    createdByUser?: string;
    createdBy?: number;
    createdOn?: Date;
}
