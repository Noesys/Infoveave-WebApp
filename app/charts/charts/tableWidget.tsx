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
/// <reference path="../../../typings/references.d.ts"/>
"use strict";
import { IChartMetaData, ChartFeature, BaseChart, BaseWidgetOptions, DisplayPosition, IChartSelectedMeasure, IChartSelectedDimension, WidgetOptionType, ColorRegistry } from "./../base";
import * as _s  from "underscore.string";
import { WidgetDataRequest } from "./../../data/models";
import * as React from "react";
import * as ReactDOM from "react-dom";
import ReactDataGrid from "react-data-grid/addons";

export class TabularChart extends BaseChart {
    static MetaData: IChartMetaData = {
        prototype: TabularChart.prototype,
        family: "Tabular Data",
        name: "TabularChart",
        title: "Tabular Data (HTML)",
        preview: "/assets/img/charts/tabularData.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Measure 1", required: true, measurePosition: DisplayPosition.Left },
            { index: 1, name: "Measure 2", required: false, measurePosition: DisplayPosition.Left },
            { index: 2, name: "Measure 3", required: false, measurePosition: DisplayPosition.Left }],
        dimensions: [
            { index: 0, name: "Dimension 1", required: true, dimensionPosition: DisplayPosition.Right },
            { index: 1, name: "Dimension 2", required: false, dimensionPosition: DisplayPosition.Right },
            { index: 2, name: "Dimension 3", required: false, dimensionPosition: DisplayPosition.Right }
        ],
        widgetOptions: _.union(BaseWidgetOptions, []),
        defaultWidth: 5,
        defaultHeight: 12,
        featureSupport: [ChartFeature.DownloadData,  ChartFeature.OfficeDocument]
    };

    getMetaData() {
        return TabularChart.MetaData;
    }

    fitChart() {
        return true;
    }


    renderChart() {
        if (this._htmlElement == null) { return; }
        if (this.cleansedData == null || this.cleansedData.length === 0) { return; };
        ReactDOM.unmountComponentAtNode(this._htmlElement);
        this._htmlElement.innerHTML = "";
        this.baseElementSetup();
        let dimensions = this.getAreaInfo();

        let rowGetter = (key: number) => {
            return this.cleansedData[key];
        };
        let columns = [];
        let displayFormatter = (query: string, props: { value: number }) => <div style={{ textAlign: "right" }}>{
            _.find(this.measureMetaData, (metaData) => {
                if (metaData.query === query) {
                    return metaData;
                }
            }).prefix}
            {this.numberFormat(props.value) }
            {_.find(this.measureMetaData, (metaData) => {
                if (metaData.query === query) {
                    return metaData;
                }
            }).suffix}
        </div>;
        _.each(this.getDimensionsAtLevel(), (dimension) => {
            columns.push({ key: dimension.name, name: dimension.name, width: 150, resizable: true, sortable: true });
        });
        _.each(this.getMeasuresAtLevel(), (measure) => {
            columns.push({ key: measure.name, name: measure.name, width: 150, resizable: true, sortable: true, formatter: _.partial(displayFormatter, measure.query) });
        });
        let content = <TableStateComponent columns={columns} rows={this.cleansedData}  width={dimensions.width - 20} height={dimensions.height} minHeight={dimensions.height - 10} />;
        ReactDOM.render(content, this._htmlElement);
    }


}


export class TableStateComponent extends React.Component<{
    columns: any[],
    rows: any[],
    width: number,
    height: number,
    minHeight: number },
    { sortedRows: any[] }> {


    componentWillMount() {
        this.setState({ sortedRows: this.props.rows });
    }

    rowGetter = (key: number) => {
        return this.state.sortedRows[key];
    };

    handleGridSort = (sortColumn, sortDirection) => {
        let rows = (!_s.contains(sortColumn, "(Change)")) ?
             _.sortBy(this.props.rows, sortColumn) :
             _.sortBy(this.props.rows, sortColumn, (o) => o.value);
        if (sortDirection === "DESC") {
            rows = rows.reverse();
        };
         this.setState({ sortedRows: rows });
    };

    render() {
        return <ReactDataGrid columns={this.props.columns} rowGetter={this.rowGetter} rowsCount={this.props.rows.length}
        width={this.props.width} height={this.props.height} minHeight={this.props.minHeight} onGridSort={this.handleGridSort}/>;
    }
}