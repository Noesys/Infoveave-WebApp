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
import { IChartMetaData, ChartFeature, BaseChart, BaseWidgetOptions, DisplayPosition, IChartSelectedMeasure, IChartSelectedDimension, WidgetOptionType, ColorRegistry, TransparentComponent, AutoSizeText } from "./../base";
import * as _s  from "underscore.string";
import { WidgetDataRequest } from "./../../data/models";
import { DateRangeInterval, DateHelpers } from "./../../helpers/dateHelpers";
import $ from "jquery";

export class PivotViewChart extends BaseChart {
    static MetaData: IChartMetaData = {
        prototype: PivotViewChart.prototype,
        family: "Tabular Data",
        name: "PivotView",
        title: "Pivot View",
        preview: "/assets/img/charts/tabularData.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Measure", required: true, measurePosition: DisplayPosition.Left },
            ],
        dimensions: [
            { index: 0, name: "Row 1", required: false, dimensionPosition: DisplayPosition.Left },
            { index: 5, name: "Column 1", required: false, dimensionPosition: DisplayPosition.Right },
        ],
        widgetOptions: _.union(BaseWidgetOptions, [
            { type: WidgetOptionType.DropDown, name: "Display As", options: ["Table"], default: "Table" },
        ]),
        defaultWidth: 5,
        defaultHeight: 12,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.OfficeDocument]
    };

    getMetaData() {
        return PivotViewChart.MetaData;
    }

    fitChart() {
        return false;
    }

    renderChart() {
        if (this._htmlElement == null) { return; }
        this._htmlElement.innerHTML = "";
        if (this.cleansedData == null || this.cleansedData.length === 0) { return; };
        this.baseElementSetup();
        let dimensions = this.getAreaInfo();
        $(this._htmlElement).css("padding", "5px");
        let sum = $.pivotUtilities.aggregatorTemplates.sum;
        let avg = $.pivotUtilities.aggregatorTemplates.average;
        let numberFormat = $.pivotUtilities.numberFormat;
        let intFormat = numberFormat({ digitsAfterDecimal: 0 });
        let renderer = $.pivotUtilities.renderers[this.getOption("Display As")];

        let onRows = _.map(_.filter(this.getDimensionsAtLevel(), (d) => _s.contains(d.axis, "Row")), (d) =>  d.name);
        let onColumns = _.map(_.filter(this.getDimensionsAtLevel(), (d) => _s.contains(d.axis, "Column")), (d) =>  d.name);
        $(this._htmlElement).pivot(
            this.cleansedData,
            {
                rows: onRows,
                cols: onColumns,
                aggregator: sum(intFormat)([this.getMeasureName("Measure")]),
                renderer: renderer
            }
        );

    }


}