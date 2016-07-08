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
import { BaseComponent } from "./baseComponent";
export enum ColumnType {
    String = 1,
    Date = 2,
    RelativeDate = 3,
    Renderer = 4
}


interface IColumn {
    caption: string;
    name?: string;
    type: ColumnType;
    render?(row: any): string;
    dataHelp?: string;
}

interface IRowAction {
    caption: string;
    visible: boolean;
    iconClass: string;
    action: string;
    dataHelp?: string;
}

interface IDataTableProps {
    title?: string;
    allowSearch?: boolean;
    hasActions: boolean;
    actions: Array<IRowAction>;
    columns: Array<IColumn>;
    data: Array<any>;
    rowAction: Function;
    pageSize?: number;
    stopTableCreation?: boolean;
    condensedView?: boolean;
    dataHelp?: string;
}

interface IDataTableState {

}

export class DataTable extends BaseComponent<IDataTableProps, IDataTableState> {
    static displayName = "DataTable";
    searchDOM() {
        if (this.props.allowSearch) {
            return <div className="pull-right">
                <div className="col-xs-12">
                    <input type="text" className="form-control pull-right" placeholder="Search" ref="searchBox"/>
                    </div>
                </div>;
        }
        return <div></div>;
    };

    headersDOM() {
        let cols = _.map(this.props.columns, (c, ix) => {
            return (<th key={"dth" + ix}>{c.caption}</th>);
        });
        if (this.props.hasActions) {
            cols.push(<th key={"dtha"} style={{ width: "20%" }}>{this.gs("Actions") }</th>);
        }
        return cols;
    };

    rowsDOM() {
        let rows = _.map(this.props.data, (row, ix) => {
            return (
                <tr key={"dtr" + ix} data-key={ix}>
                    {this.rowContentDOM(row, ix) }
                    </tr>
            );
        });
        return rows;
    };

    rowContentDOM(row: any, rowIx: number) {
        let cells = _.map(this.props.columns, (col, ix) => {
            let className = "v-align-middle " + ((ix === 0) ? "semi-bold" : "");
            return (<td key={"dtc-" + rowIx + "-" + ix} className={className}>{this.cellRenderDOM(row, col) }</td>);
        });
        if (this.props.hasActions) {
            cells.push(<td key={"dtca" + rowIx} className="v-align-middle "> {this.rowActionsDOM(rowIx) }</td>);
        };
        return cells;
    };

    cellRenderDOM = (row: any, col: IColumn): any => {
        if (col.type === ColumnType.String && row.type === "docx" && col.name === "type") {
            return <i className="fa fa-file-word-o fa-2x" > </i>;
        }
        if (col.type === ColumnType.String && row.type === "xlsx" && col.name === "type") {
             return <i className="fa fa-file-excel-o fa-2x" ></i>;
        }
       if (col.type === ColumnType.String && row.type === "pptx" && col.name === "type" ) {
           return <i className="fa fa-file-powerpoint-o fa-2x" ></i>;
        }
        if (col.type === ColumnType.String && row.type === "xlsm" && col.name === "type" ) {
            return <i className="fa fa-file-excel-o fa-2x" ></i>;
        }
        if (col.type === ColumnType.String && row.type === "txt" && col.name === "type" ) {
            return <i className="fa fa-file-text-o fa-2x" ></i>;
        }
        if (col.type === ColumnType.String && row.type === "csv" && col.name === "type" ) {
            return <i className="fa fa-file-csv-o fa-2x" ></i>;
        }
        if (col.type === ColumnType.String && row.type === null && col.name === "type") {
            return <i className="fa fa-database fa-2x" ></i>;
        }
        if (col.type === ColumnType.Renderer) {
            return <span dangerouslySetInnerHTML={{__html:col.render(row) }}/>;
        }
        if (col.type === ColumnType.RelativeDate) {
            return moment(row[col.name]).fromNow();
        }
        return row[col.name];
    };

    rowActionsDOM(rowIx: number) {
        let actions = <div className="btn-group">{_.map(_.filter(this.props.actions, (a) => a.visible), (action, ix) => {
        return <button key={"dtra" + rowIx + "-" + ix} type="button" className="btn btn-white" data-help={action.dataHelp} title={action.caption}
            onClick={_.partial(this.rowAction, action.action, rowIx) }><i className={"fa " + action.iconClass}></i></button>;
        }) }</div>;
        return actions;
    };

    rowAction = (action: string, ix: number) => {
        if (this.props.rowAction == null) { return; }
        this.props.rowAction(action, this.props.data[ix]);
    };

    initTableWithSearch() {
        let table = $(ReactDOM.findDOMNode(this.refs["dataTable"]));
        let settings = {
            "sDom": "<'table-responsive't><'row'<p i>>",
            "sPaginationType": "bootstrap",
            "destroy": true,
            "scrollCollapse": true,
            "oLanguage": {
                "sLengthMenu": "_MENU_ ",
                "sInfo": "Showing <b>_START_ to _END_</b> of _TOTAL_ entries"
            },
            "iDisplayLength": 10, // (this.props.pageSize == null) ? 10 : this.props.pageSize
        };
        table.dataTable(settings);
        if (this.props.allowSearch) {
            $(ReactDOM.findDOMNode(this.refs["searchBox"])).keyup(() => { table.fnFilter($(ReactDOM.findDOMNode(this.refs["searchBox"])).val()); });
        }
    };

    componentDidUpdate = () => {
        if (this.props.stopTableCreation) { return; };
        // this.initTableWithSearch();
    };
              //  {this.searchDOM() }
    render() {
        return (
            <div className="panel panel-white">
        <div className="panel-heading">
            <div className="panel-title">{this.props.title}</div>

            <div className="clearfix"></div>
            </div>
        <div className="panel-body">
            <table className={"table table-hover " + ((this.props.condensedView) ? "table-condensed" : "") } id={"dt" + this.randomId} ref="dataTable">
                <thead className="bg-successinfo">
                    <tr>
                        {this.headersDOM() }
                        </tr>
                    </thead>
                <tbody>
                    {this.rowsDOM() }
                    </tbody>
                </table>
            </div>
                </div>
        );
    };
}