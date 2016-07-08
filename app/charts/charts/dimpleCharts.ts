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
import { IChartMetaData, ChartFeature, BaseChart, BaseChartWidgetOptions, BaseWidgetOptions, DisplayPosition, IChartSelectedMeasure, IChartSelectedDimension, WidgetOptionType, ColorRegistry } from "./../base";
import * as _s  from "underscore.string";
import $ from "jquery";
import { WidgetDataRequest } from "./../../data/models";
import { DateRangeInterval, DateHelpers } from "./../../helpers/dateHelpers";
/**
 * @class Dimple Base Chart (Abstract Implementation)
 */
export abstract class DimpleBaseChart extends BaseChart {
    protected _chartType: string;

    fitChart() {
        return true;
    }

    cleansedDataUpdated() {
        return this.cleansedData;
    }

    renderChart() {
        if (this._htmlElement == null) { return; }
        if (this.cleansedData == null || this.cleansedData.length === 0) { return; };
        this._htmlElement.innerHTML = "";
        this.baseElementSetup();
        let dimensions = this.getAreaInfo();
        if (!_s.contains(this._htmlElement.className, "dimpleChart")) {
            this._htmlElement.className += " dimpleChart";
        };
        let svg = dimple.newSvg(this._htmlElement, dimensions.width, dimensions.height);
        let dataToUse = this.cleansedDataUpdated();
        let chart = new dimple.chart(svg, dataToUse);
        let allDimensionItems = _.uniq(_.flattenDeep(_.map(dataToUse, (cd) => {
            return _.map(this.getDimensionsAtLevel(), (dim) => {
                return cd[dim.name];
            });
        })));
        _.each(allDimensionItems, (ad) => {
            chart.assignColor(ad, ColorRegistry.getColor(ad));
        });
        let setup = this.typeSpecificSetup(chart);
        _.each(setup.axes, (axis) => {
            axis.fontFamily = this.fontFamily;
        });
        chart.setMargins("10px", "10px", "10px", "10px");

        _.each(setup.series, (series) => {
            series.addEventHandler("mouseover", (e) => {
                let basePosition = $(e.selectedShape[0][0]).offset();
                let xTipPos = 0;
                let yTipPos = 0;
                let fontColor = "#000";
                // type of svg
                let shape = "g";
                if ((e.selectedShape[0][0]).toString().indexOf("Circle") > 0) {
                    shape = "circle";
                    xTipPos = Math.ceil(parseInt($(e.selectedShape[0][0]).attr("cx"), 10));
                    yTipPos = Math.ceil(parseInt($(e.selectedShape[0][0]).attr("cy"), 10));
                    let rTipPos = Math.ceil(parseInt($(e.selectedShape[0][0]).attr("r"), 10));
                    fontColor = $(e.selectedShape[0][0]).attr("stroke");
                    xTipPos = Math.ceil(basePosition.left) + rTipPos;
                    yTipPos = Math.ceil(basePosition.top);
                } else if ((e.selectedShape[0][0]).toString().indexOf("Rect") > 0) {
                    shape = "rect";
                    xTipPos = Math.ceil(parseInt($(e.selectedShape[0][0]).attr("width"), 10)) / 2;
                    yTipPos = Math.ceil(parseInt($(e.selectedShape[0][0]).attr("height"), 10));
                    fontColor = $(e.selectedShape[0][0]).attr("fill");
                    xTipPos = Math.ceil(basePosition.left) + xTipPos;
                    yTipPos = Math.ceil(basePosition.top);
                } else if ((e.selectedShape[0][0]).toString().indexOf("Path") > 0) {
                    shape = "path";
                    fontColor = $(e.selectedShape[0][0]).attr("stroke");
                    xTipPos = Math.ceil(basePosition.left);
                    yTipPos = Math.ceil(basePosition.top);
                }
                let numOfDimensions = this.getDimensionsAtLevel().length;
                let numOfMeasures = this.getMeasuresAtLevel().length;
                let toolTipData = this.typeSpecificTooltipData(e);
                let baseData = {
                    "title": "OK",
                    "description": "",
                    "color": fontColor,
                    // "icon": "/assets/img/icon.png",
                    "style": "knockout",
                    "x": xTipPos,
                    "y": yTipPos,
                    "id": "d3DimpleTooltip",
                    "width": 200,
                    "align": "top center",
                    "font-family": this.fontFamily,
                    "arrow": true,
                    "data": [],
                };
                let x = _.assign(baseData, toolTipData);
                d3plus.tooltip.create(x);
            });
            series.addEventHandler("mouseleave", (e) => {
                d3plus.tooltip.remove("d3DimpleTooltip");
            });
        });


        let leftMargin = 60;
        if (this._chartType === "bar") { leftMargin += 50; };
        if (this.getOption("Simplify Axis Labels") == null || this.getOption("Simplify Axis Labels") === false) { leftMargin += 25; }
        let legend = null;
        if (this.getOption("Show Legends") && this._chartType !== "dimpleParettoChart") {
            legend = chart.addLegend(leftMargin, 5, dimensions.width - (leftMargin + 10), "50px", "right");
            legend.fontFamily = this.fontFamily;
            chart.setBounds(leftMargin, 50, dimensions.width - (leftMargin + 10), dimensions.height - 130);

        } else {
            chart.setBounds(leftMargin, 50, dimensions.width - (leftMargin + 10), dimensions.height - 130);
        }
        chart.draw(800);
        svg.selectAll("path.dimple-series-2").style("stroke-dasharray", "2");
        if (this.getOption("Show Legends") && this._chartType !== "dimpleParettoChart") {
            let filterValues = dimple.getUniqueValues(this.cleansedData, _.last(setup.legendsOn));
            chart.legends = [];
            let self = this;
            legend.shapes.selectAll(".dimple-legend").on("click", function(e) {
                d3plus.tooltip.remove("d3DimpleTooltip");
                let hide = false;
                let newFilters = [];
                filterValues.forEach(function(f) {
                    if (f === e.aggField.slice(-1)[0]) {
                        hide = true;
                    } else {
                        newFilters.push(f);
                    }
                });
                // Hide the shape or show it
                if (hide) {
                    d3.select(this.parentNode).select("rect").style("opacity", 0.2);
                } else {
                    newFilters.push(e.aggField.slice(-1)[0]);
                    d3.select(this.parentNode).select("rect").style("opacity", 0.8);
                }
                // Update the filters
                filterValues = newFilters;
                chart.data = dimple.filterData(self.cleansedData, _.last(setup.legendsOn), filterValues);
                chart.draw(0);
            });
        }
        let elements = _.map($(this._htmlElement).find(".dimple-axis").find("text"), (ele) => {
            return { element: ele, rotated: this.getRotationDegrees(ele) };
        });
        let filtered = _.filter(elements, (e) => e.rotated === 90);
        _.each(filtered, (e) => {
            if ($(e.element).text().length > 10) { $(e.element).text($(e.element).text().substr(0, 10) + ".."); }
        });
    };

    getPrefixSuffix = () => {
        let suffix = "";
        if (this.measureMetaData[0].prefix != null) suffix += this.measureMetaData[0].prefix;
        if (this.measureMetaData[0].suffix != null) suffix += this.measureMetaData[0].suffix;
        if (suffix.length > 0) { suffix = " (" + suffix + ")"; };
        return suffix;
    };

    getRotationDegrees = (obj: JQuery) => {
        let matrix = $(obj).attr("transform");
        if (matrix == null) { return 0; }
        if (matrix !== "none" && matrix !== "") {
            let values = matrix.split("(")[1].split(")")[0].split(",");
            let a: number = _s.toNumber(values[0]);
            return a;
        } else {
            return 0;
        }
    };

    abstract typeSpecificSetup(chart: any): { axes: any[], legendsOn: string[], series: any[] };
    abstract typeSpecificTooltipData(e: any): { title?: string, description?: string, width?: number, height?: number, data: { name: string, value: any, desc: string, highlight?: boolean }[], };
};


export class DimpleColumnChart extends DimpleBaseChart {
    static MetaData: IChartMetaData = {
        prototype: DimpleColumnChart.prototype,
        family: "Charts & Graphs",
        name: "D3ColumnChart",
        title: "Column Chart",
        preview: "/assets/img/charts/columnChart.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Measure", required: true, measurePosition: DisplayPosition.Left }],
        dimensions: [
            { index: 0, name: "Bars", required: true, dimensionPosition: DisplayPosition.Right },
            { index: 1, name: "Group", required: false, dimensionPosition: DisplayPosition.Right },
            { index: 2, name: "Stack", required: false, dimensionPosition: DisplayPosition.Right }
        ],
        widgetOptions: _.union(BaseChartWidgetOptions, [
            { type: WidgetOptionType.Checkbox, name: "Simplify Axis Labels", default: false },
            { type: WidgetOptionType.DropDown, name: "Display Type", options: ["Value", "Percentage"], default: "Value" },
            { type: WidgetOptionType.Checkbox, name: "No Spacing", default: false},
            { type: WidgetOptionType.DropDown, name: "Sort Order", options: ["Categorize by X-Axis", "Categorize by Group", "Ascending by Y-Axis", "Descending by Y-Axis"], default: "Categorize by X-Axis" }
        ]),
        defaultWidth: 5,
        defaultHeight: 12,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.DownloadImage, ChartFeature.OfficeDocument]
    };
    _chartType = "column";

    getMetaData() {
        return DimpleColumnChart.MetaData;
    };

    typeSpecificSetup(chart: any) {
        let measures = this.getMeasuresAtLevel().map((m) => m.name);
        let yAxis = [];
        _.each(measures, (m, ix) => {
            let yax: any = null;
            if (this.getOption("Display Type") === "Percentage") {
                yax = chart.addPctAxis("y", m);
            } else {
                yax = chart.addMeasureAxis("y", m);
                if (this.getDimensionName("Stack") == null) {
                    let mm = this.getMinMax(m);
                    yax.overrideMin = mm.min;
                    yax.overrideMax = mm.max;
                }
            }
             if (this.getOption("Simplify Axis Labels") == null || this.getOption("Simplify Axis Labels") === false) yax.tickFormat = "0,.2r";
             yAxis.push(yax);
            _.last(yAxis).title = m + this.getPrefixSuffix();
            _.last(yAxis).ticks = 5;
        });
        let xAxis = null;
        let series = null;
        let xAxisDimensions = [this.getDimensionName("Bars")];
        if (this.getDimensionName("Group") != null) {
            xAxisDimensions.push(this.getDimensionName("Group"));
        };
        let categoryDimensions = [];
        if (this.getDimensionName("Group") == null && this.getDimensionName("Stack") == null) {
            categoryDimensions.push(this.getDimensionName("Bars"));
        } else {
            if (this.getDimensionName("Group") != null) {
                categoryDimensions.push(this.getDimensionName("Group"));
            }
            if (this.getDimensionName("Stack") != null) {
                categoryDimensions.push(this.getDimensionName("Stack"));
            }
        }
        xAxis = chart.addCategoryAxis("x", xAxisDimensions);
        series = chart.addSeries(categoryDimensions, dimple.plot.bar);
        series.barGap = (this.getOption("No Spacing")) ? 0 : 0.2;
        series.clusterBarGap = (this.getOption("No Spacing")) ? 0 : 0.1;

        if (this.getOption("Sort Order") === "Categorize by X-Axis") {
            xAxis.addOrderRule(this.getDimensionName("Bars"));
        } else if (this.getOption("Sort Order") === "Categorize by Group") {
            xAxis.addOrderRule("category");
        } else if (this.getOption("Sort Order") === "Ascending by Y-Axis") {
            xAxis.addOrderRule(this.getMeasureName("Measure"), false);
        } else if (this.getOption("Sort Order") === "Descending by Y-Axis") {
            xAxis.addOrderRule(this.getMeasureName("Measure"), true);
        }

        series.addEventHandler("click", (args) => {
            d3plus.tooltip.remove("d3DimpleTooltip");
            let xAxisD = _.find(this.getDimensionsAtLevel(), (d) => d.axis === "Bars").query;
            this.drillAction([{ query: xAxisD, item: args.xValue }]);
        });
        series.addEventHandler("contextmenu", (args) => {
            let content = this.typeSpecificTooltipData(args);
            let firstTitle = (this.getDimensionName("Stack") != null) ? this.getDimensionName("Stack")
                            : (this.getDimensionName("Group") != null) ? this.getDimensionName("Group")
                            : this.getDimensionName("Bars");
            content.data.splice(0, 0, { name: firstTitle, value: content.title, highlight: false });
            this.showContextMenu(content.data);
        });
        return { axes: _.flatten([xAxis, yAxis]), series: [series], legendsOn: categoryDimensions };
    };

    typeSpecificTooltipData(e: any) {
        let data = [];

        let prefix = "";
        let suffix = "";
        if (this.measureMetaData[0].prefix !== null) {
            prefix = this.measureMetaData[0].prefix;
        }
        if (this.measureMetaData[0].suffix !== null) {
            suffix = this.measureMetaData[0].suffix;
        }

        let title = (e.seriesValue.length === 2) ? e.seriesValue[1] : e.seriesValue[0];
        if (this.getDimensionName("Group") != null && this.getDimensionName("Stack") != null) {
            data.push({ name: this.getDimensionName("Bars"), value: e.xValue });
            data.push({ name: this.getDimensionName("Group"), value: e.seriesValue[0] });
        } else if (this.getDimensionName("Group") != null) {
            data.push({ name: this.getDimensionName("Bars"), value: e.xValue });
        } else if (this.getDimensionName("Stack") != null) {
            data.push({ name: this.getDimensionName("Bars"), value: e.xValue });
        }
        if (this.getOption("Display Type") !== "Percentage") {
            data.push({ name: this.getMeasureName("Measure"), value: `${prefix} ${this.numberFormat(e.yValue)} ${suffix}`, highlight: true });
        } else {
            let value = null;
            let columnValues = _.chain(this.cleansedData).filter(cd => cd[this.getDimensionName("Bars")] === e.xValue).map((cd) => cd[this.getMeasureName("Measure")]).value();
            let total = _.sum(columnValues);
            if (this.getDimensionName("Group") != null && this.getDimensionName("Stack") != null) {
                value = _.find(this.cleansedData, (cd) => cd[this.getDimensionName("Bars")] === e.xValue
                    && cd[this.getDimensionName("Group")] === e.seriesValue[0]
                    && cd[this.getDimensionName("Stack")] === e.seriesValue[1]
                );
                if (value != null) {
                    data.push({ name: this.getMeasureName("Measure"), value: `${prefix} ${this.numberFormat(value[this.getMeasureName("Measure")])} ${suffix}`, highlight: true });
                    data.push({ name: "% Contribution", value: `${prefix} ${this.numberFormat(value[this.getMeasureName("Measure")] * 100 / total)} ${suffix}` + " %", highlight: false });
                }
            } else if (this.getDimensionName("Group") != null) {
                value = _.find(this.cleansedData, (cd) => cd[this.getDimensionName("Bars")] === e.xValue
                    && cd[this.getDimensionName("Group")] === e.seriesValue[0]
                );
                if (value != null) {
                    data.push({ name: this.getMeasureName("Measure"), value: `${prefix} ${this.numberFormat(value[this.getMeasureName("Measure")])} ${suffix}` , highlight: true });
                    data.push({ name: "% Contribution", value: `${prefix} ${this.numberFormat(value[this.getMeasureName("Measure")] * 100 / total)} ${suffix}` + " %", highlight: false });
                }
            } else if (this.getDimensionName("Stack") != null) {
                value = _.find(this.cleansedData, (cd) => cd[this.getDimensionName("Bars")] === e.xValue
                    && cd[this.getDimensionName("Stack")] === e.seriesValue[0]
                );
                if (value != null) {
                    data.push({ name: this.getMeasureName("Measure"), value: `${prefix} ${this.numberFormat(value[this.getMeasureName("Measure")])} ${suffix}`, highlight: true });
                    data.push({ name: "% Contribution", value: `${prefix} ${this.numberFormat(value[this.getMeasureName("Measure")] * 100 / total)} ${suffix}` + " %", highlight: false });
                }
            }
        }
        return {
            title: title,
            data: data
        };
    }
}

export class DimpleBarChart extends DimpleBaseChart {
    static MetaData: IChartMetaData = {
        prototype: DimpleBarChart.prototype,
        family: "Charts & Graphs",
        name: "D3BarChart",
        title: "Bar Chart",
        preview: "/assets/img/charts/barChart.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Measure", required: true, measurePosition: DisplayPosition.Left }],
        dimensions: [
            { index: 0, name: "Bars", required: true, dimensionPosition: DisplayPosition.Right },
            { index: 1, name: "Group", required: false, dimensionPosition: DisplayPosition.Right },
            { index: 2, name: "Stack", required: false, dimensionPosition: DisplayPosition.Right }
        ],
        widgetOptions: _.union(BaseChartWidgetOptions, [
            { type: WidgetOptionType.Checkbox, name: "Simplify Axis Labels", default: false },
            { type: WidgetOptionType.DropDown, name: "Display Type", options: ["Value", "Percentage"], default: "Value" },
            { type: WidgetOptionType.Checkbox, name: "No Spacing", default: false},
            { type: WidgetOptionType.DropDown, name: "Sort Order", options: ["Alphabetical", "Category", "Ascending", "Descending"], default: "Alphabetical" }
        ]),
        defaultWidth: 5,
        defaultHeight: 12,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.DownloadImage, ChartFeature.OfficeDocument]
    };
    _chartType = "bar";

    getMetaData() {
        return DimpleBarChart.MetaData;
    };

    typeSpecificSetup(chart: any) {
        let measures = this.getMeasuresAtLevel().map((m) => m.name);
        let yAxis = [];
        _.each(measures, (m, ix) => {
            let yax: any = null;
            if (this.getOption("Display Type") === "Percentage") {
                yax = chart.addPctAxis("x", m);
            } else {
                yax = chart.addMeasureAxis("x", m);
                if (this.getDimensionName("Stack") == null) {
                    let mm = this.getMinMax(m);
                    yax.overrideMin = mm.min;
                    yax.overrideMax = mm.max;
                }

            }
            if (this.getOption("Simplify Axis Labels") == null || this.getOption("Simplify Axis Labels") === false) yax.tickFormat = "0,.2r";
            yAxis.push(yax);
            _.last(yAxis).title = m + this.getPrefixSuffix();
            _.last(yAxis).ticks = 5;
        });
        let xAxis = null;
        let series = null;

        let xAxisDimensions = [this.getDimensionName("Bars")];

        if (this.getDimensionName("Group") !== null) {
            xAxisDimensions.push(this.getDimensionName("Group"));
        };
        let categoryDimensions = [];
        if (this.getDimensionName("Group") === null && this.getDimensionName("Stack") === null) {
            categoryDimensions.push(this.getDimensionName("Bars"));
        } else {
            if (this.getDimensionName("Group") !== null) {
                categoryDimensions.push(this.getDimensionName("Group"));
            }
            if (this.getDimensionName("Stack") !== null) {
                categoryDimensions.push(this.getDimensionName("Stack"));
            }
        }
        xAxis = chart.addCategoryAxis("y", xAxisDimensions);
        series = chart.addSeries(categoryDimensions, dimple.plot.bar);
        series.barGap = (this.getOption("No Spacing")) ? 0 : 0.2;
        series.clusterBarGap = (this.getOption("No Spacing")) ? 0 : 0.1;

        if (this.getOption("Sort Order") === "Alphabetical") {
            xAxis.addOrderRule(this.getDimensionName("Bars"));
        } else if (this.getOption("Sort Order") === "Category") {
            xAxis.addOrderRule("category");
        } else if (this.getOption("Sort Order") === "Ascending") {
            xAxis.addOrderRule(this.getMeasureName("Measure"), false);
        } else if (this.getOption("Sort Order") === "Descending") {
            xAxis.addOrderRule(this.getMeasureName("Measure"), true);
        }

        series.addEventHandler("click", (args) => {
            d3plus.tooltip.remove("d3DimpleTooltip");
            let xAxisD = _.find(this.getDimensionsAtLevel(), (d) => d.axis === "Bars").query;
            this.drillAction([{ query: xAxisD, item: args.yValue }]);
        });
        series.addEventHandler("contextmenu", (args) => {
            let content = this.typeSpecificTooltipData(args);
            let firstTitle = (this.getDimensionName("Stack") != null) ? this.getDimensionName("Stack")
                            : (this.getDimensionName("Group") != null) ? this.getDimensionName("Group")
                            : this.getDimensionName("Bars");
            content.data.splice(0, 0, { name: firstTitle, value: content.title, highlight: false });
            this.showContextMenu(content.data);
        });
        return { axes: _.flatten([xAxis, yAxis]), series: [series], legendsOn: categoryDimensions };
    };

    typeSpecificTooltipData(e: any) {
        let data = [];

        let prefix = "";
        let suffix = "";
        if (this.measureMetaData[0].prefix !== null) {
            prefix = this.measureMetaData[0].prefix;
        }
        if (this.measureMetaData[0].suffix !== null) {
            suffix = this.measureMetaData[0].suffix;
        }

        let title = (e.seriesValue.length === 2) ? e.seriesValue[1] : e.seriesValue[0];
        let rb = {};
        if (this.getDimensionName("Group") !== null && this.getDimensionName("Stack") !== null) {
            data.push({ name: this.getDimensionName("Bars"), value: e.yValue });
            data.push({ name: this.getDimensionName("Group"), value: e.seriesValue[0] });
            rb = _.find(this.cleansedData, (cd) => cd[this.getDimensionName("Bars")] === e.yValue && cd[this.getDimensionName("Group")] === e.seriesValue[0] && cd[this.getDimensionName("Stack")] === e.seriesValue[1]);
        } else if (this.getDimensionName("Group") !== null) {
            data.push({ name: this.getDimensionName("Bars"), value: e.yValue });
            rb = _.find(this.cleansedData, (cd) => cd[this.getDimensionName("Bars")] === e.yValue && cd[this.getDimensionName("Group")] === e.seriesValue[0]);
        } else if (this.getDimensionName("Stack") !== null) {
            data.push({ name: this.getDimensionName("Bars"), value: e.yValue });
            rb = _.find(this.cleansedData, (cd) => cd[this.getDimensionName("Bars")] === e.yValue && cd[this.getDimensionName("Stack")] === e.seriesValue[0]);
        } else {
            data.push({ name: this.getDimensionName("Bars"), value: e.yValue });
            rb = _.find(this.cleansedData, (cd) => cd[this.getDimensionName("Bars")] === e.yValue);
        }
        data.push({ name: this.getMeasureName("Measure"), value: `${prefix} ${this.numberFormat(rb[this.getMeasureName("Measure")])} ${suffix}`, highlight: true });
        return {
            title: title,
            data: data
        };
    }
}

export class DimpleBubbleChart extends DimpleBaseChart {
    static MetaData: IChartMetaData = {
        prototype: DimpleBubbleChart.prototype,
        family: "Charts & Graphs",
        name: "D3BubbleChart",
        title: "Bubble Chart",
        preview: "/assets/img/charts/bubbleChart.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Y-Axis", required: true, measurePosition: DisplayPosition.Left },
            { index: 1, name: "Size", required: false, measurePosition: DisplayPosition.Left }
        ],
        dimensions: [
            { index: 0, name: "X-Axis", required: true, dimensionPosition: DisplayPosition.Right },
            { index: 1, name: "Group", required: false, dimensionPosition: DisplayPosition.Right },
        ],
        widgetOptions: _.union(BaseChartWidgetOptions, [
            { type: WidgetOptionType.Checkbox, name: "Simplify Axis Labels", default: false },
            { type: WidgetOptionType.DropDown, name: "Sort Order", options: ["Alphabetical", "Category", "Ascending by Y-Axis", "Ascending by Size", "Descending by Y-Axis", "Descending by Size"], default: "Alphabetical" }
        ]),
        defaultWidth: 5,
        defaultHeight: 12,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.DownloadImage, ChartFeature.OfficeDocument]
    };
    _chartType = "bubble";

    getMetaData() {
        return DimpleBubbleChart.MetaData;
    };

    typeSpecificSetup(chart: any) {
        let measures = this.getMeasuresAtLevel().map((m) => m.name);
        let yAxis = [];
        let yax = chart.addMeasureAxis("y", this.getMeasureName("Y-Axis"));
        if (this.getOption("Simplify Axis Labels") == null || this.getOption("Simplify Axis Labels") === false) yax.tickFormat = "0,.2r";
        yAxis.push(yax);
        let mm = this.getMinMax(this.getMeasureName("Y-Axis"));
        yax.overrideMin = mm.min;
        yax.overrideMax = mm.max;
        let zMeasure = (this.getMeasureName("Size") === null) ? this.getMeasureName("Y-Axis") : this.getMeasureName("Size");
        let zAxis = chart.addMeasureAxis("z", zMeasure);
        _.last(yAxis).title = this.getMeasureName("Y-Axis") + this.getPrefixSuffix();
        _.last(yAxis).ticks = 5;

        let xAxis = null;
        let series = null;
        let xAxisDimensions = [this.getDimensionName("X-Axis")];
        if (this.getDimensionName("Group") != null) {
            xAxisDimensions.push(this.getDimensionName("Group"));
        };
        let categoryDimensions = [];
        if (this.getDimensionName("Group") == null) {
            categoryDimensions.push(this.getDimensionName("X-Axis"));
        } else {
            categoryDimensions.push(this.getDimensionName("Group"));
        }
        xAxis = chart.addCategoryAxis("x", xAxisDimensions);
        series = chart.addSeries(categoryDimensions, dimple.plot.bubble);

        if (this.getOption("Sort Order") === "Alphabetical") {
            xAxis.addOrderRule(this.getDimensionName("X-Axis"));
        } else if (this.getOption("Sort Order") === "Category") {
            xAxis.addOrderRule("category");
        } else if (this.getOption("Sort Order") === "Ascending by Y-Axis") {
            xAxis.addOrderRule(this.getMeasureName("Y-Axis"), false);
        } else if (this.getOption("Sort Order") === "Ascending by Size") {
            xAxis.addOrderRule(this.getMeasureName("Size"), false);
        } else if (this.getOption("Sort Order") === "Descending by Y-Axis") {
            xAxis.addOrderRule(this.getMeasureName("Y-Axis"), true);
        } else if (this.getOption("Sort Order") === "Descending by Size") {
            xAxis.addOrderRule(this.getMeasureName("Size"), true);
        }

        series.addEventHandler("click", (args) => {
            d3plus.tooltip.remove("d3DimpleTooltip");
            let xAxisD = _.find(this.getDimensionsAtLevel(), (d) => d.axis === "X-Axis").query;
            this.drillAction([{ query: xAxisD, item: args.xValue }]);
        });
        series.addEventHandler("contextmenu", (args) => {
            let content = this.typeSpecificTooltipData(args);
            let firstTitle = (this.getDimensionName("Group") != null) ? this.getDimensionName("Group")
                            : this.getDimensionName("X-Axis");
            content.data.splice(0, 0, { name: firstTitle, value: content.title, highlight: false });
            this.showContextMenu(content.data);
        });
        return { axes: _.flatten([xAxis, yAxis]), series: [series], legendsOn: categoryDimensions };
    };

    typeSpecificTooltipData(e: any) {
        let data = [];

        let prefix = "", prefix1 = "";
        let suffix = "", suffix1 = "";
        if (this.measureMetaData[0].prefix !== null) {
            prefix = this.measureMetaData[0].prefix;
        }
        if (this.measureMetaData[0].suffix !== null) {
            suffix = this.measureMetaData[0].suffix;
        }
        if (this.measureMetaData[1].prefix !== null) {
            prefix1 = this.measureMetaData[1].prefix;
        }
        if (this.measureMetaData[1].suffix !== null) {
            suffix1 = this.measureMetaData[1].suffix;
        }

        let title = (e.seriesValue.length === 2) ? e.seriesValue[1] : e.seriesValue[0];

        if (this.getDimensionName("Group") != null) {
            data.push({ name: this.getDimensionName("X-Axis"), value: e.xValue });

        }
        data.push({ name: this.getMeasureName("Y-Axis"), value: (e.yValue % 1 === 0) ? `${prefix} ${(e.yValue)} ${suffix}` : `${prefix} ${(this.numberFormat(e.yValue))} ${suffix}`, highlight: true });
        data.push({ name: this.getMeasureName("Size"), value: (e.zValue % 1 === 0) ? `${prefix1} ${e.zValue} ${suffix1}` : `${prefix1} ${(this.numberFormat(e.zValue))} ${suffix1}` , highlight: true });
        return {
            title: title,
            data: data
        };
    }
}


export class DimpleLineChart extends DimpleBaseChart {
    static MetaData: IChartMetaData = {
        prototype: DimpleLineChart.prototype,
        family: "Charts & Graphs",
        name: "DimpleLineChart",
        title: "Line Chart",
        preview: "/assets/img/charts/lineChart.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Measure", required: true, measurePosition: DisplayPosition.Left },
        ],
        dimensions: [
            { index: 0, name: "X-Axis", required: true, dimensionPosition: DisplayPosition.Right },
            { index: 1, name: "Group", required: false, dimensionPosition: DisplayPosition.Right },
        ],
        widgetOptions: _.union(BaseChartWidgetOptions, [
            { type: WidgetOptionType.Checkbox, name: "Simplify Axis Labels", default: false },
            { type: WidgetOptionType.Checkbox, name: "Line Markers", default: true },
            { type: WidgetOptionType.DropDown, name: "Type", options: ["Normal", "Spline", "Step"], default: "Normal" },
            { type: WidgetOptionType.DropDown, name: "Sort Order", options: ["Alphabetical", "Category", "Ascending", "Descending"], default: "Alphabetical" }
        ]),
        defaultWidth: 5,
        defaultHeight: 12,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.DownloadImage, ChartFeature.OfficeDocument]
    };
    _chartType = "line";

    getMetaData() {
        return DimpleLineChart.MetaData;
    };

    typeSpecificSetup(chart: any) {
        let measures = this.getMeasuresAtLevel().map((m) => m.name);
        let yAxis = [];
        _.each(measures, (m, ix) => {
            let yax = chart.addMeasureAxis("y", m);
            if (this.getOption("Simplify Axis Labels") == null || this.getOption("Simplify Axis Labels") === false) yax.tickFormat = "0,.2r";
            yAxis.push(yax);
            let mm = this.getMinMax(m);
            yax.overrideMin = mm.min;
            yax.overrideMax = mm.max;
            _.last(yAxis).title = m + this.getPrefixSuffix();
            _.last(yAxis).ticks = 5;
        });
        let xAxis = null;
        let series = null;
        let xAxisDimensions = [this.getDimensionName("X-Axis")];
        if (this.getDimensionName("Group") != null) {
            xAxisDimensions.push(this.getDimensionName("Group"));
        };
        let categoryDimensions = [];
        if (this.getDimensionName("Group") == null) {
            // categoryDimensions.push(this.getDimensionName("X-Axis"));
        } else {
            categoryDimensions.push(this.getDimensionName("Group"));
        }
        xAxis = chart.addCategoryAxis("x", xAxisDimensions);
        series = chart.addSeries(categoryDimensions, dimple.plot.line);
        series.lineMarkers = this.getOption("Line Markers");
        series.interpolation = (this.getOption("Type") === "Normal") ? null : (this.getOption("Type") === "Spline") ? "cardinal" : "step";

        if (this.getOption("Sort Order") === "Alphabetical") {
            xAxis.addOrderRule(this.getDimensionName("X-Axis"));
        } else if (this.getOption("Sort Order") === "Category") {
            xAxis.addOrderRule("category");
        } else if (this.getOption("Sort Order") === "Ascending") {
            xAxis.addOrderRule(this.getMeasureName("Measure"), false);
        } else if (this.getOption("Sort Order") === "Descending") {
            xAxis.addOrderRule(this.getMeasureName("Measure"), true);
        }

        series.addEventHandler("click", (args) => {
            d3plus.tooltip.remove("d3DimpleTooltip");
            let xAxisD = _.find(this.getDimensionsAtLevel(), (d) => d.axis === "X-Axis").query;
            this.drillAction([{ query: xAxisD, item: args.xValue }]);
        });
        series.addEventHandler("contextmenu", (args) => {
            let content = this.typeSpecificTooltipData(args);
            let firstTitle = (this.getDimensionName("Group") != null) ? this.getDimensionName("Group")
                            : this.getDimensionName("X-Axis");
            content.data.splice(0, 0, { name: firstTitle, value: content.title, highlight: false });
            this.showContextMenu(content.data);
        });
        return { axes: _.flatten([xAxis, yAxis]), series: [series], legendsOn: categoryDimensions };
    };

    typeSpecificTooltipData(e: any) {
        let data = [];
        let prefix = "";
        let suffix = "";
        if (this.measureMetaData[0].prefix !== null) {
            prefix = this.measureMetaData[0].prefix;
        }
        if (this.measureMetaData[0].suffix !== null) {
            suffix = this.measureMetaData[0].suffix;
        }
        let title = (e.seriesValue.length === 2) ? e.seriesValue[1] : e.seriesValue[0];
        if (this.getDimensionName("Group") != null) {
            data.push({ name: this.getDimensionName("X-Axis"), value: e.xValue });
        }
        data.push({ name: this.getMeasureName("Measure"), value: `${prefix} ${this.numberFormat(e.yValue)} ${suffix}`, highlight: true });
        return {
            title: title,
            data: data
        };
    }
}



export class DimpleAreaChart extends DimpleBaseChart {
    static MetaData: IChartMetaData = {
        prototype: DimpleAreaChart.prototype,
        family: "Charts & Graphs",
        name: "DimpleAreaChart",
        title: "Area Chart",
        preview: "/assets/img/charts/areaChart.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Measure", required: true, measurePosition: DisplayPosition.Left },
        ],
        dimensions: [
            { index: 0, name: "X-Axis", required: true, dimensionPosition: DisplayPosition.Right },
            { index: 1, name: "Group", required: false, dimensionPosition: DisplayPosition.Right },
        ],
        widgetOptions: _.union(BaseChartWidgetOptions, [
            { type: WidgetOptionType.Checkbox, name: "Simplify Axis Labels", default: false },
            { type: WidgetOptionType.Checkbox, name: "Line Markers", default: true },
            { type: WidgetOptionType.DropDown, name: "Type", options: ["Normal", "Spline", "Step"], default: "Normal" },
            { type: WidgetOptionType.DropDown, name: "Sort Order", options: ["Alphabetical", "Category", "Ascending", "Descending"], default: "Alphabetical" }
        ]),
        defaultWidth: 5,
        defaultHeight: 12,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.DownloadImage, ChartFeature.OfficeDocument]
    };
    _chartType = "area";

    getMetaData() {
        return DimpleAreaChart.MetaData;
    };

    typeSpecificSetup(chart: any) {
        let measures = this.getMeasuresAtLevel().map((m) => m.name);
        let yAxis = [];
        _.each(measures, (m, ix) => {
            let yax = chart.addMeasureAxis("y", m);
            if (this.getOption("Simplify Axis Labels") == null || this.getOption("Simplify Axis Labels") === false) yax.tickFormat = "0,.2r";
            yAxis.push(yax);
            let mm = this.getMinMax(m);
            yax.overrideMin = mm.min;
            yax.overrideMax = mm.max;
            _.last(yAxis).title = m + this.getPrefixSuffix();
            _.last(yAxis).ticks = 5;
        });
        let xAxis = null;
        let series = null;
        let xAxisDimensions = [this.getDimensionName("X-Axis")];
        if (this.getDimensionName("Group") !== null) {
            xAxisDimensions.push(this.getDimensionName("Group"));
        };
        let categoryDimensions = [];
        if (this.getDimensionName("Group") === null) {
            categoryDimensions.push(this.getDimensionName("X-Axis"));
        } else {
            categoryDimensions.push(this.getDimensionName("Group"));
        }
        xAxis = chart.addCategoryAxis("x", xAxisDimensions);
        series = chart.addSeries(categoryDimensions, dimple.plot.area);
        series.lineMarkers = this.getOption("Line Markers");
        series.interpolation = (this.getOption("Type") === "Normal") ? null : (this.getOption("Type") === "Spline") ? "cardinal" : "step";

        if (this.getOption("Sort Order") === "Alphabetical") {
            xAxis.addOrderRule(this.getDimensionName("X-Axis"));
        } else if (this.getOption("Sort Order") === "Category") {
            xAxis.addOrderRule("category");
        } else if (this.getOption("Sort Order") === "Ascending") {
            xAxis.addOrderRule(this.getMeasureName("Measure"), false);
        } else if (this.getOption("Sort Order") === "Descending") {
            xAxis.addOrderRule(this.getMeasureName("Measure"), true);
        }

        series.addEventHandler("click", (args) => {
            d3plus.tooltip.remove("d3DimpleTooltip");
            let xAxisD = _.find(this.getDimensionsAtLevel(), (d) => d.axis === "X-Axis").query;
            this.drillAction([{ query: xAxisD, item: args.xValue }]);
        });
        series.addEventHandler("contextmenu", (args) => {
            let content = this.typeSpecificTooltipData(args);
            let firstTitle = (this.getDimensionName("Group") != null) ? this.getDimensionName("Group")
                            : this.getDimensionName("X-Axis");
            content.data.splice(0, 0, { name: firstTitle, value: content.title, highlight: false });
            this.showContextMenu(content.data);
        });
        return { axes: _.flatten([xAxis, yAxis]), series: [series], legendsOn: categoryDimensions };
    };

    typeSpecificTooltipData(e: any) {
        let data = [];
        let prefix = "";
        let suffix = "";
        if (this.measureMetaData[0].prefix !== null) {
            prefix = this.measureMetaData[0].prefix;
        }
        if (this.measureMetaData[0].suffix !== null) {
            suffix = this.measureMetaData[0].suffix;
        }
        let title = "";
        if (this.getDimensionName("Group") !== null) {
            title = (e.seriesValue.length === 2) ? e.seriesValue[1] : e.seriesValue[0];
        }
        if (this.getDimensionName("Group") !== null) {
            data.push({ name: this.getDimensionName("X-Axis"), value: e.xValue });
        } else {
            data.push({ name: this.getDimensionName("X-Axis"), value: e.xValue });
        }
        data.push({ name: this.getMeasureName("Measure"), value: `${prefix} ${this.numberFormat(e.yValue)} ${suffix}`, highlight: true });
        return {
            title: title,
            data: data
        };
    }
}

export class DimpleColumnLineChart extends DimpleBaseChart {
    static MetaData: IChartMetaData = {
        prototype: DimpleColumnLineChart.prototype,
        family: "Charts & Graphs",
        name: "DimpleColumnLineChart",
        title: "Column Line Chart",
        preview: "/assets/img/charts/columnLineChart.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Column", required: true, measurePosition: DisplayPosition.Left },
            { index: 0, name: "Line", required: true, measurePosition: DisplayPosition.Left },
        ],
        dimensions: [
            { index: 0, name: "X-Axis", required: true, dimensionPosition: DisplayPosition.Right },
            { index: 1, name: "Group", required: false, dimensionPosition: DisplayPosition.Right },
        ],
        widgetOptions: _.union(BaseChartWidgetOptions, [
            { type: WidgetOptionType.Checkbox, name: "Simplify Axis Labels", default: false },
            { type: WidgetOptionType.Checkbox, name: "Line Markers", default: true },
            { type: WidgetOptionType.Checkbox, name: "Categorize by X-Axis", default: true },
            { type: WidgetOptionType.DropDown, name: "Type", options: ["Normal", "Spline", "Step"], default: "Normal" },
            { type: WidgetOptionType.DropDown, name: "Sort Order", options: ["Alphabetical", "Category", "Ascending by Column", "Ascending by Line", "Descending by Column", "Descending by Line"], default: "Alphabetical" }
        ]),
        defaultWidth: 5,
        defaultHeight: 12,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.DownloadImage, ChartFeature.OfficeDocument]
    };
    _chartType = "columnLine";

    getMetaData() {
        return DimpleColumnLineChart.MetaData;
    };

    typeSpecificSetup(chart: any) {
        let measures = this.getMeasuresAtLevel().map((m) => m.name);
        let yAxis = [];
        _.each(measures, (m, ix) => {
            let yax = chart.addMeasureAxis("y", m);
            yAxis.push(yax);
            let mm = this.getMinMax(m);
            yax.overrideMin = mm.min;
            yax.overrideMax = mm.max;
            _.last(yAxis).title = m + this.getPrefixSuffix();
            _.last(yAxis).ticks = 5;
        });
        _.last(yAxis).hidden = true;
        let xAxis = null;
        let xAxisDimensions = [this.getDimensionName("X-Axis")];
        if (this.getDimensionName("Group") != null) {
            xAxisDimensions.push(this.getDimensionName("Group"));
        };
        let categoryDimensions = [];
        if (this.getDimensionName("Group") == null) {
            // categoryDimensions.push(this.getDimensionName("X-Axis"));
        } else {
            categoryDimensions.push(this.getDimensionName("Group"));
        }
        xAxis = chart.addCategoryAxis("x", xAxisDimensions);

        if (this.getOption("Sort Order") === "Alphabetical") {
            xAxis.addOrderRule(this.getDimensionName("X-Axis"));
        } else if (this.getOption("Sort Order") === "Category") {
            xAxis.addOrderRule("category");
        } else if (this.getOption("Sort Order") === "Ascending by Column") {
            xAxis.addOrderRule(this.getMeasureName("Column"), false);
        } else if (this.getOption("Sort Order") === "Ascending by Line") {
            xAxis.addOrderRule(this.getMeasureName("Line"), false);
        } else if (this.getOption("Sort Order") === "Descending by Column") {
            xAxis.addOrderRule(this.getMeasureName("Column"), true);
        } else if (this.getOption("Sort Order") === "Descending by Line") {
            xAxis.addOrderRule(this.getMeasureName("Line"), true);
        }

        if (this.getOption("Categorize by X-Axis")) {
            if (this.getDimensionName("Group") === null) {
                categoryDimensions.push(this.getDimensionName("X-Axis"));
            }
        }

        let bars = chart.addSeries(categoryDimensions, dimple.plot.bar, [xAxis, _.first(yAxis)]);
        let lines = chart.addSeries(categoryDimensions, dimple.plot.line, [xAxis, _.last(yAxis)]);
        lines.lineMarkers = this.getOption("Line Markers");
        lines.interpolation = (this.getOption("Type") === "Normal") ? null : (this.getOption("Type") === "Spline") ? "cardinal" : "step";
        bars.addEventHandler("click", (args) => {
            d3plus.tooltip.remove("d3DimpleTooltip");
            let xAxisD = _.find(this.getDimensionsAtLevel(), (d) => d.axis === "X-Axis").query;
            this.drillAction([{ query: xAxisD, item: args.xValue }]);
        });
        lines.addEventHandler("click", (args) => {
            d3plus.tooltip.remove("d3DimpleTooltip");
            let xAxisD = _.find(this.getDimensionsAtLevel(), (d) => d.axis === "X-Axis").query;
            this.drillAction([{ query: xAxis, item: args.xValue }]);
        });
        lines.addEventHandler("contextmenu", (args) => {
            let content = this.typeSpecificTooltipData(args);
            let firstTitle = (this.getDimensionName("Group") != null) ? this.getDimensionName("Group")
                            : this.getDimensionName("X-Axis");
            content.data.splice(0, 0, { name: firstTitle, value: content.title, highlight: false });
            this.showContextMenu(content.data);
        });
        return { axes: _.flatten([xAxis, yAxis]), series: [bars, lines], legendsOn: categoryDimensions };
    };

    typeSpecificTooltipData(e: any) {
        let data = [];

        let prefix = "", prefix1 = "";
        let suffix = "", suffix1 = "";
        if (this.measureMetaData[0].prefix !== null) {
            prefix = this.measureMetaData[0].prefix;
        }
        if (this.measureMetaData[0].suffix !== null) {
            suffix = this.measureMetaData[0].suffix;
        }
        if (this.measureMetaData[1].prefix !== null) {
            prefix1 = this.measureMetaData[1].prefix;
        }
        if (this.measureMetaData[1].suffix !== null) {
            suffix1 = this.measureMetaData[1].suffix;
        }

        let title = (e.seriesValue.length === 2) ? e.seriesValue[1] : e.seriesValue[0];

        if (this.getDimensionName("Group") != null) {
            data.push({ name: this.getDimensionName("X-Axis"), value: e.xValue });

        }
        if ((e.selectedShape[0][0]).toString().indexOf("Circle") > 0) {
            data.push({ name: this.getMeasureName("Line"), value: `${prefix} ${this.numberFormat(e.yValue)} ${suffix}`, highlight: true });
        } else if ((e.selectedShape[0][0]).toString().indexOf("Rect") > 0) {
            data.push({ name: this.getMeasureName("Column"), value: `${prefix1} ${this.numberFormat(e.yValue)} ${suffix1}`, highlight: true });
        }

        return {
            title: title,
            data: data
        };
    }
}


export class DimplePieDonutChart extends DimpleBaseChart {
    static MetaData: IChartMetaData = {
        prototype: DimplePieDonutChart.prototype,
        family: "Charts & Graphs",
        name: "DimplePieDonutChart",
        title: "Pie / Donut Chart",
        preview: "/assets/img/charts/pieChart.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Measure", required: true, measurePosition: DisplayPosition.Left },
        ],
        dimensions: [
            { index: 0, name: "Dimension", required: true, dimensionPosition: DisplayPosition.Right },
        ],
        widgetOptions: _.union(BaseChartWidgetOptions, [
            { type: WidgetOptionType.Checkbox, name: "Simplify Axis Labels", default: false },
            { type: WidgetOptionType.DropDown, name: "Type", options: ["Pie", "Donut"], default: "Pie" }
        ]),
        defaultWidth: 5,
        defaultHeight: 12,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.DownloadImage, ChartFeature.OfficeDocument]
    };
    _chartType = "pieDonut";

    getPostData(filters: { name: string, operator: string, items: string[] }[], dateFilters: string[], mode: DateRangeInterval, progression: number, startDate: Date, endDate: Date): WidgetDataRequest[] {
        // Custom Implementation as Parallel/ Previous Period stuff needs to be done

        let postData = super.getPostData(filters, dateFilters, mode, progression, startDate, endDate);
        let additional: WidgetDataRequest = _.cloneDeep(postData[0]);
        additional.dimensions = [];
        let postData2 = [postData[0], additional];
        return postData2;
    };

    getMetaData() {
        return DimplePieDonutChart.MetaData;
    };

    typeSpecificSetup(chart: any) {
        let measures = this.getMeasuresAtLevel().map((m) => m.name);

        let measureAxis = null;
        _.each(measures, (m, ix) => {
            measureAxis = chart.addMeasureAxis("p", m);
            measureAxis.title = m + this.getPrefixSuffix();
            if (this.getOption("Simplify Axis Labels") == null || this.getOption("Simplify Axis Labels") === false) measureAxis.tickFormat = "0,.2r";
        });
        let categoryDimensions = [];
        categoryDimensions.push(this.getDimensionName("Dimension"));
        let series = chart.addSeries(categoryDimensions, dimple.plot.pie);
        series.addEventHandler("click", (args) => {
            d3plus.tooltip.remove("d3DimpleTooltip");
            let xAxis = _.find(this.getDimensionsAtLevel(), (d) => d.axis === "Dimension").query;
            this.drillAction([{ query: xAxis, item: args.xValue }]);
        });
        if (this.getOption("Type") !== "Pie") {
            series.innerRadius = "50px";
        }
        series.addEventHandler("click", (args) => {
            d3plus.tooltip.remove("d3DimpleTooltip");
            let xAxis = _.find(this.getDimensionsAtLevel(), (d) => d.axis === "Dimension").query;
            this.drillAction([{ query: xAxis, item: args.seriesValue[0] }]);
        });
        series.addEventHandler("contextmenu", (args) => {
            let content = this.typeSpecificTooltipData(args);
            let firstTitle = this.getDimensionName("Dimension");
            content.data.splice(0, 0, { name: firstTitle, value: content.title, highlight: false });
            this.showContextMenu(content.data);
        });
        return { axes: _.flatten([measureAxis]), series: [series], legendsOn: categoryDimensions };
    };

    typeSpecificTooltipData(e: any) {
        let data = [];
        let prefix = "";
        let suffix = "";
        if (this.measureMetaData[0].prefix !== null) {
            prefix = this.measureMetaData[0].prefix;
        }
        if (this.measureMetaData[0].suffix !== null) {
            suffix = this.measureMetaData[0].suffix;
        }
        let title = e.seriesValue[0];
        let total = _.map(this.cleansedDataAdditional[1][0]);
        let measureTotal = parseFloat(total[1].toString());
        let contribution = Math.round((e.pValue / measureTotal) * 100);
        data.push({ name: this.getMeasureName("Measure"), value: `${prefix} ${this.numberFormat(e.pValue)} ${suffix}`, highlight: true });
        data.push({ name: "% contribution", value: this.numberFormat(contribution) + " %", highlight: true });
        return {
            title: title,
            data: data
        };
    }
}

export class DimpleGroupPieChart extends DimpleBaseChart {
    static MetaData: IChartMetaData = {
        prototype: DimpleGroupPieChart.prototype,
        family: "Charts & Graphs",
        name: "DimpleGroupPieChart",
        title: "Grouped Pie/Donut Chart",
        preview: "/assets/img/charts/pieBubbleChart.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Y-Axis", required: true, measurePosition: DisplayPosition.Left },
        ],
        dimensions: [
            { index: 0, name: "X-Axis", required: true, dimensionPosition: DisplayPosition.Right },
            { index: 1, name: "Group", required: true, dimensionPosition: DisplayPosition.Right },
            { index: 1, name: "Slicer", required: true, dimensionPosition: DisplayPosition.Right }
        ],
        widgetOptions: _.union(BaseChartWidgetOptions, [
            { type: WidgetOptionType.Checkbox, name: "Simplify Axis Labels", default: false },
            { type: WidgetOptionType.DropDown, name: "Type", options: ["Pie", "Donut"], default: "Pie" },
            { type: WidgetOptionType.DropDown, name: "Sort Order", options: ["Alphabetical", "Category", "Ascending", "Descending"], default: "Alphabetical" }
        ]),
        defaultWidth: 5,
        defaultHeight: 12,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.DownloadImage, ChartFeature.OfficeDocument]
    };
    _chartType = "bubble";

    getMetaData() {
        return DimpleGroupPieChart.MetaData;
    };

    typeSpecificSetup(chart: any) {
        let measures = this.getMeasuresAtLevel().map((m) => m.name);
        let yAxis = [];
        let yax = chart.addMeasureAxis("y", this.getMeasureName("Y-Axis"));
        let pax = chart.addMeasureAxis("p", this.getMeasureName("Y-Axis"));
        if (this.getOption("Simplify Axis Labels") == null || this.getOption("Simplify Axis Labels") === false) yax.tickFormat = "0,.2r";
        yAxis.push(yax);
        let mm = this.getMinMax(this.getMeasureName("Y-Axis"));
        yax.overrideMin = mm.min;
        yax.overrideMax = mm.max;
        _.last(yAxis).title = this.getMeasureName("Y-Axis") + this.getPrefixSuffix();
        _.last(yAxis).ticks = 5;

        let xAxis = null;
        let series = null;
        let xAxisDimensions = [this.getDimensionName("X-Axis")];
        let categoryDimensions = [];
        if (this.getDimensionName("Group") != null) {
            categoryDimensions.push(this.getDimensionName("Group"));
        };
        categoryDimensions.push(this.getDimensionName("Slicer"));
        xAxis = chart.addCategoryAxis("x", xAxisDimensions);
        series = chart.addSeries(categoryDimensions, dimple.plot.pie);
        if (this.getOption("Type") !== "Pie") {
            series.innerRadius = "50px";
        }
        series.outerRadius = 30;

        if (this.getOption("Sort Order") === "Alphabetical") {
            xAxis.addOrderRule(this.getDimensionName("X-Axis"));
        } else if (this.getOption("Sort Order") === "Category") {
            xAxis.addOrderRule("category");
        } else if (this.getOption("Sort Order") === "Ascending") {
            xAxis.addOrderRule(this.getMeasureName("Y-Axis"), false);
        } else if (this.getOption("Sort Order") === "Descending") {
            xAxis.addOrderRule(this.getMeasureName("Y-Axis"), true);
        }

        series.addEventHandler("click", (args) => {
            d3plus.tooltip.remove("d3DimpleTooltip");
            let xAxisD = _.find(this.getDimensionsAtLevel(), (d) => d.axis === "X-Axis").query;
            this.drillAction([{ query: xAxisD, item: args.xValue }]);
        });
        series.addEventHandler("contextmenu", (args) => {
            let content = this.typeSpecificTooltipData(args);
            let firstTitle = (this.getDimensionName("Slicer") != null) ? this.getDimensionName("Slicer")
                            : (this.getDimensionName("Group") != null) ? this.getDimensionName("Group")
                            : this.getDimensionName("X-Axis");
            content.data.splice(0, 0, { name: firstTitle, value: content.title, highlight: false });
            this.showContextMenu(content.data);
        });
        return { axes: _.flatten([xAxis, yAxis]), series: [series], legendsOn: categoryDimensions };
    };

    typeSpecificTooltipData(e: any) {
        let data = [];
        let prefix = "";
        let suffix = "";
        if (this.measureMetaData[0].prefix !== null) {
            prefix = this.measureMetaData[0].prefix;
        }
        if (this.measureMetaData[0].suffix !== null) {
            suffix = this.measureMetaData[0].suffix;
        }
        let title = (e.seriesValue.length === 2) ? e.seriesValue[1] : e.seriesValue[0];
        if (this.getDimensionName("Group") != null && this.getDimensionName("Slicer") != null) {
            data.push({ name: this.getDimensionName("X-Axis"), value: e.xValue });
            data.push({ name: this.getDimensionName("Group"), value: e.seriesValue[0] });
        } else if (this.getDimensionName("Group") != null) {
            data.push({ name: this.getDimensionName("X-Axis"), value: e.xValue });
        } else if (this.getDimensionName("Slicer") != null) {
            data.push({ name: this.getDimensionName("X-Axis"), value: e.xValue });
        }
        data.push({ name: this.getMeasureName("Y-Axis"), value: this.numberFormat(e.pValue) });
        data.push({ name: "Total " + this.getMeasureName("Y-Axis"), value: `${prefix} ${this.numberFormat(e.yValue)} ${suffix}`, highlight: true });
        data.push({ name: "% contribution", value: this.numberFormat(e.pValue * 100 / e.yValue) + " %", highlight: true });
        return {
            title: title,
            data: data
        };
    }
}


export class DimpleParettoChart extends DimpleBaseChart {
    static MetaData: IChartMetaData = {
        prototype: DimpleParettoChart.prototype,
        family: "Business Widgets",
        name: "DimpleParettoChart",
        title: "Paretto Chart",
        preview: "/assets/img/charts/paretoChart.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Measure", required: true, measurePosition: DisplayPosition.Left },
        ],
        dimensions: [
            { index: 0, name: "Dimension", required: true, dimensionPosition: DisplayPosition.Right },
        ],
        widgetOptions: _.union(BaseChartWidgetOptions, [
            { type: WidgetOptionType.Checkbox, name: "Simplify Axis Labels", default: false },
            { type: WidgetOptionType.Checkbox, name: "Line Markers", default: true },
            { type: WidgetOptionType.DropDown, name: "Rule", options: ["80/20", "70/30", "60/40"], default: "80/20" },
            { type: WidgetOptionType.DropDown, name: "Sort Order", options: ["Alphabetical", "Category", "Ascending", "Descending"], default: "Alphabetical" }
        ]),
        defaultWidth: 5,
        defaultHeight: 12,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.DownloadImage, ChartFeature.OfficeDocument]
    };
    _chartType = "dimpleParettoChart";

    getMetaData() {
        return DimpleParettoChart.MetaData;
    };

    typeSpecificSetup(chart: any) {
        let x = chart.addCategoryAxis("x", this.getDimensionName("Dimension"));
        let y1 = chart.addMeasureAxis("y", this.getMeasureName("Measure"));
        let y2 = chart.addMeasureAxis("y", "Cumulative Percent");
        let y3 = chart.addMeasureAxis("y", "CutOff");
        if (this.getOption("Simplify Axis Labels") == null || this.getOption("Simplify Axis Labels") === false) y1.tickFormat = "0,.2r";
        let self = this;
        y2.overrideMax = 1;
        y2.overrideMin = 0;
        y2.tickFormat = "%";
        y3.overrideMax = 1;
        y3.overrideMin = 0;
        y3.tickFormat = "%";
        y2.hidden = true;
        y3.hidden = true;
        let bars = chart.addSeries(this.getMeasureName("Measure"), dimple.plot.bar, [x, y1]);
        let lines1 = chart.addSeries("Cummulative %", dimple.plot.line, [x, y2]);
        let lines2 = chart.addSeries("Cut Off", dimple.plot.line, [x, y3]);
        lines1.lineMarkers = true;

        if (this.getOption("Sort Order") === "Alphabetical") {
            x.addOrderRule(this.getDimensionName("Dimension"));
        } else if (this.getOption("Sort Order") === "Category") {
            x.addOrderRule("category");
        } else if (this.getOption("Sort Order") === "Ascending") {
            x.addOrderRule(this.getMeasureName("Measure"), false);
        } else if (this.getOption("Sort Order") === "Descending") {
            x.addOrderRule(this.getMeasureName("Measure"), true);
        }

        bars.addEventHandler("contextmenu", (args) => {
            let content = self.typeSpecificTooltipData(args);
            let firstTitle = self.getDimensionName("Dimension");
            content.data.splice(0, 0, { name: firstTitle, value: content.title, highlight: false });
            self.showContextMenu(content.data);
        });
        lines1.addEventHandler("contextmenu", (args) => {
            let content = self.typeSpecificTooltipData(args);
            let firstTitle = self.getDimensionName("Dimension");
            content.data.splice(0, 0, { name: firstTitle, value: content.title, highlight: false });
            self.showContextMenu(content.data);
        });
        lines2.addEventHandler("contextmenu", (args) => {
            let content = self.typeSpecificTooltipData(args);
            let firstTitle = self.getDimensionName("Dimension");
            content.data.splice(0, 0, { name: firstTitle, value: content.title, highlight: false });
            self.showContextMenu(content.data);
        });
        return { axes: _.flatten([x, y1, y2, y3]), series: [bars, lines1, lines2], legendsOn: [this.getDimensionName("Dimension")] };
    };

    cleansedDataUpdated() {
        let total = _.reduce(this.cleansedData, (sum, cd) => {
            return sum += cd[this.getMeasureName("Measure")];
        }, 0);
        let CutOffOption = this.getOption("Rule");
        let cutOffValue = (CutOffOption === "80/20") ? 0.8 : (CutOffOption === "70/30") ? 0.7 : 0.6;
        let data = _.map(_.sortBy(this.cleansedData, (cd) => cd[this.getMeasureName("Measure")]).reverse(), (cd, ix) => {
            let d = {};
            d[this.getDimensionName("Dimension")] = cd[this.getDimensionName("Dimension")];
            d[this.getMeasureName("Measure")] = cd[this.getMeasureName("Measure")];
            d["Cumulative Percent"] = cd[this.getMeasureName("Measure")] / total;
            d["CutOff"] = cutOffValue;
            return d;
        });
        _.each(data, (d, ix) => {
            d["order"] = ix;
            if (ix === 0) return;
            d["Cumulative Percent"] = data[ix - 1]["Cumulative Percent"] + d["Cumulative Percent"];
        });
        return data;
    }

    typeSpecificTooltipData(e: any) {
        let data = [];
        let prefix = "";
        let suffix = "";
        if (this.measureMetaData[0].prefix !== null) {
            prefix = this.measureMetaData[0].prefix;
        }
        if (this.measureMetaData[0].suffix !== null) {
            suffix = this.measureMetaData[0].suffix;
        }
        let title = e.xValue;
        let shape = "bar";
        if ((e.selectedShape[0][0]).toString().indexOf("Circle") > 0) {
            shape = "circle";
        }
        if (shape === "bar") {
            data.push({ name: this.getMeasureName("Measure"), value: `${prefix} ${this.numberFormat(e.yValue)} ${suffix}`, highlight: true });
        } else {
            title = e.seriesValue[0];
            if (title !== "Cut Off")
                data.push({ name: this.getDimensionName("Dimension"), value: this.numberFormat(e.xValue) });
            data.push({ name: this.getMeasureName("Measure"), value: `${prefix} ${this.numberFormat(e.yValue * 100)} ${suffix}` + " %", highlight: true });
        }
        return {
            title: title,
            data: data
        };
    }
}

export class DimpleBlockMatrix extends DimpleBaseChart {
    static MetaData: IChartMetaData = {
        prototype: DimpleBlockMatrix.prototype,
        family: "Charts & Graphs",
        name: "D3BlockMatrix",
        title: "Block Matrix Chart",
        preview: "/assets/img/charts/blockmatrix.png",
        drillDowns: 3,
        measures: [
            { index: 0, name: "Measure", required: true, measurePosition: DisplayPosition.Left }
            ],
        dimensions: [
            { index: 0, name: "Dimension 1", required: true, dimensionPosition: DisplayPosition.Right },
            { index: 1, name: "Dimension 2", required: false, dimensionPosition: DisplayPosition.Right }
        ],
        widgetOptions: _.union(BaseChartWidgetOptions, [
            { type: WidgetOptionType.Checkbox, name: "Simplify Axis Labels", default: false },
        ]),
        defaultWidth: 5,
        defaultHeight: 12,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.DownloadImage, ChartFeature.OfficeDocument]
    };
    _chartType = "blockMatrix";

    getMetaData() {
        return DimpleBlockMatrix.MetaData;
    };

    typeSpecificSetup(chart: any) {
        let measures = this.getMeasuresAtLevel().map((m) => m.name);
        let yAxis = null;
        let xAxis = null;
        let series = null;
        let xAxisDimensions = [this.getDimensionName("Dimension 1")];
        if (this.getDimensionName("Dimension 2") != null) {
            xAxisDimensions.push(this.getDimensionName("Dimension 2"));
        };
        let categoryDimensions = [];
        if (this.getDimensionName("Dimension 2") == null) {
             categoryDimensions.push(this.getDimensionName("Dimension 1"));
        } else {
            categoryDimensions.push(this.getDimensionName("Dimension 2"));
        }
        xAxis = chart.addCategoryAxis("x", xAxisDimensions);
        yAxis = chart.addCategoryAxis("y", this.getMeasureName("Measure"));
        if (this.getOption("Simplify Axis Labels") == null || this.getOption("Simplify Axis Labels") === false) yAxis.tickFormat = "0,.2r";
        yAxis.ticks = 10;
        series = chart.addSeries(categoryDimensions, dimple.plot.bar);

        return { axes: _.flatten([xAxis, yAxis]), series: [series], legendsOn: categoryDimensions };
    };

    typeSpecificTooltipData(e: any) {
        let data = [];
        let title = (e.seriesValue.length === 2) ? e.seriesValue[1] : e.seriesValue[0];
        if (this.getDimensionName("Dimension 2") != null) {
            data.push({ name: this.getDimensionName("Dimension 1"), value: e.xValue });
        }
        data.push({ name: this.getMeasureName("Measure"), value: this.numberFormat(e.yValue), highlight: true });
        return {
            title: title,
            data: data
        };
    }
}

export class DimpleVerticalFloatingBars extends DimpleBaseChart {
    static MetaData: IChartMetaData = {
        prototype: DimpleVerticalFloatingBars.prototype,
        family: "Charts & Graphs",
        name: "D3VerticalFloatingBars",
        title: "Vertical Floating Bar Chart",
        preview: "/assets/img/charts/verticalfloatingbars.png",
        drillDowns: 3,
        measures: [
            { index: 0, name: "Measure", required: true, measurePosition: DisplayPosition.Left }
            ],
        dimensions: [
            { index: 0, name: "Dimension 1", required: true, dimensionPosition: DisplayPosition.Right },
            { index: 1, name: "Dimension 2", required: false, dimensionPosition: DisplayPosition.Right }
        ],
        widgetOptions: _.union(BaseChartWidgetOptions, [
            { type: WidgetOptionType.Checkbox, name: "Simplify Axis Labels", default: false },
        ]),
        defaultWidth: 5,
        defaultHeight: 12,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.DownloadImage, ChartFeature.OfficeDocument]
    };
    _chartType = "verticalFloatingBars";

    getMetaData() {
        return DimpleVerticalFloatingBars.MetaData;
    };

    typeSpecificSetup(chart: any) {
        let measures = this.getMeasuresAtLevel().map((m) => m.name);
        let yAxis = null;
        let xAxis = null;
        let series = null;

        let categoryDimensions = [];
        if (this.getDimensionName("Dimension 2") === null) {
            categoryDimensions.push(this.getDimensionName("Dimension 1"));
        } else {
            categoryDimensions.push(this.getDimensionName("Dimension 2"));
        }

        xAxis = chart.addCategoryAxis("x", this.getDimensionName("Dimension 1"));
        yAxis = chart.addMeasureAxis("y", this.getMeasureName("Measure"));
        if (this.getOption("Simplify Axis Labels") == null || this.getOption("Simplify Axis Labels") === false) yAxis.tickFormat = "0,.2r";
        series = chart.addSeries(categoryDimensions, dimple.plot.bar);
        series.stacked = false;

        return { axes: _.flatten([xAxis, yAxis]), series: [series], legendsOn: categoryDimensions };
    };

    typeSpecificTooltipData(e: any) {
        let data = [];
        let value = null;
        let title = (e.seriesValue.length === 2) ? e.seriesValue[1] : e.seriesValue[0];
        if (this.getDimensionName("Dimension 2") != null) {
            data.push({ name: this.getDimensionName("Dimension 1"), value: e.xValue });
        }
        data.push({ name: this.getMeasureName("Measure"), value: this.numberFormat(e.yValue), highlight: true });

        return {
            title: title,
            data: data
        };
    }
}

export class DimpleHorizontalFloatingBars extends DimpleBaseChart {
    static MetaData: IChartMetaData = {
        prototype: DimpleHorizontalFloatingBars.prototype,
        family: "Charts & Graphs",
        name: "D3HorizontalFloatingBars",
        title: "Horizontal Floating Bar Chart",
        preview: "/assets/img/charts/horizontalfloatingbars.png",
        drillDowns: 3,
        measures: [
            { index: 0, name: "Measure", required: true, measurePosition: DisplayPosition.Left }
            ],
        dimensions: [
            { index: 0, name: "Dimension 1", required: true, dimensionPosition: DisplayPosition.Right },
            { index: 1, name: "Dimension 2", required: false, dimensionPosition: DisplayPosition.Right }
        ],
        widgetOptions: _.union(BaseChartWidgetOptions, [
            { type: WidgetOptionType.Checkbox, name: "Simplify Axis Labels", default: false },
        ]),
        defaultWidth: 5,
        defaultHeight: 12,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.DownloadImage, ChartFeature.OfficeDocument]
    };
    _chartType = "horizontalFloatingBars";

    getMetaData() {
        return DimpleHorizontalFloatingBars.MetaData;
    };

    typeSpecificSetup(chart: any) {
        let measures = this.getMeasuresAtLevel().map((m) => m.name);
        let yAxis = null;
        let xAxis = null;
        let series = null;

        let categoryDimensions = [];

        if (this.getDimensionName("Dimension 2") === null) {
            categoryDimensions.push(this.getDimensionName("Dimension 1"));
        } else {
            categoryDimensions.push(this.getDimensionName("Dimension 2"));
        }
        yAxis = chart.addCategoryAxis("y", this.getDimensionName("Dimension 1"));
        xAxis = chart.addMeasureAxis("x", this.getMeasureName("Measure"));
        if (this.getOption("Simplify Axis Labels") == null || this.getOption("Simplify Axis Labels") === false) yAxis.tickFormat = "0,.2r";

        series = chart.addSeries(categoryDimensions, dimple.plot.bar);
        series.stacked = false;

        return { axes: _.flatten([xAxis, yAxis]), series: [series], legendsOn: categoryDimensions };
    };

    typeSpecificTooltipData(e: any) {
        let data = [];
        let value = null;
        let title = (e.seriesValue.length === 2) ? e.seriesValue[1] : e.seriesValue[0];

        if (this.getDimensionName("Dimension 2") != null) {
            data.push({ name: this.getDimensionName("Dimension 1"), value: e.yValue });
        }

        if (this.getMeasureName("Measure") != null) {
            value = _.find(this.cleansedData, (cd) =>
                cd[this.getDimensionName("Dimension 1")] === e.yValue &&
                cd[this.getDimensionName("Dimension 2")] === e.seriesValue[0]
            );
        }

        if (value != null) {
            data.push({ name: this.getMeasureName("Measure"), value: this.numberFormat(value[this.getMeasureName("Measure")]), highlight: true });
        }

        return {
            title: title,
            data: data
        };
    }
}
