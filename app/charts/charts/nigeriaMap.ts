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
import { IChartMetaData, IWidgetOption, ChartFeature, BaseChart, BaseChartWidgetOptions, DisplayPosition, IChartSelectedMeasure, IChartSelectedDimension, WidgetOptionType, ColorRegistry } from "./../base";
import * as _s  from "underscore.string";
import { WidgetDataRequest } from "./../../data/models";

declare var topojson: any;
export class NigeriaMap extends BaseChart {
    static MetaData: IChartMetaData = {
        prototype: NigeriaMap.prototype,
        family: "Maps",
        name: "NigeriaMap",
        title: "Nigeria State Map",
        preview: "/assets/img/charts/nigeriaMap.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Measure", required: true, measurePosition: DisplayPosition.Left }],
        dimensions: [
            { index: 0, name: "Location", required: true, dimensionPosition: DisplayPosition.Right },
        ],
        widgetOptions: _.union(
            BaseChartWidgetOptions, [
                { type: WidgetOptionType.DropDown, name: "Use Quantile", options: ["No Quantile", "2", "3", "4", "5", "6", "7", "8", "9", "10"], default: "No Quantile" },
                { type: WidgetOptionType.DropDown, name: "Quantile Color", options: ["Green", "Blue", "Purple", "Black", "Orange", "Red", "Grey"], default: "Green" },
                { type: WidgetOptionType.Checkbox, name: "Darker when lower value (Quantile)", default: false }
            ] as IWidgetOption[]),
        defaultWidth: 8,
        defaultHeight: 16,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.DownloadImage, ChartFeature.OfficeDocument]
    };

    getMetaData() {
        return NigeriaMap.MetaData;
    }

    fitChart() {
        return true;
    }

    renderChart() {
        if (this._htmlElement == null) { return; }
        if (this.cleansedData == null || this.cleansedData.length === 0) { return; };
        this._htmlElement.innerHTML = "";
        this.baseElementSetup();
        let dimensions = this.getAreaInfo();

        let width = dimensions.width;
        let height = dimensions.height;
        let fills = {
            defaultFill: "#afafaf"
        };
        let minMax = this.getMinMax(this.getMeasureName("Measure"), true);
        let transperencyDomain: any = null;
        if (this.getOption("Use Quantile") === "No Quantile") {
            _.each(this.cleansedData, (cd) => {
                fills[cd[this.getDimensionName("Location")]] = ColorRegistry.getColor(cd[this.getDimensionName("Location")]);
            });
        } else {
            // Quantile Maps has been selected so first take the number of divisions;
            let divisions = parseInt(this.getOption("Use Quantile"), 10);
            let transperencyRange = [0];
            transperencyDomain = d3.scale.quantile().domain([minMax.min, minMax.max]).range(d3.range(0, divisions));
            if (divisions === 2) {
                transperencyRange = [25, 100];
            }
            if (divisions === 3) {
                transperencyRange = [33, 66, 100];
            }
            if (divisions === 4) {
                transperencyRange = [25, 50, 75, 100];
            }
            if (divisions === 5) {
                transperencyRange = [20, 40, 60, 80, 100];
            }
            if (divisions === 6) {
                transperencyRange = [15, 30, 45, 60, 75, 90];
            }
            if (divisions === 7) {
                transperencyRange = [15, 30, 40, 50, 60, 75, 100];
            }
            if (divisions === 8) {
                transperencyRange = [12, 24, 36, 48, 60, 72, 84, 96];
            }
            if (divisions === 9) {
                transperencyRange = [15, 30, 40, 50, 60, 75, 85, 100];
            }
            if (divisions === 10) {
                transperencyRange = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
            }
            if (this.getOption("Darker when lower value (Quantile)") === true) transperencyRange = transperencyRange.reverse();
            let color = "rgba(37,162,78,";
            if (this.getOption("Quantile Color") === "Blue") color = "rgba(34,107,171,";
            if (this.getOption("Quantile Color") === "Purple") color = "rgba(122,43,157,";
            if (this.getOption("Quantile Color") === "Black") color = "rgba(33,46,62,";
            if (this.getOption("Quantile Color") === "Orange") color = "rgba(199,62,3,";
            if (this.getOption("Quantile Color") === "Red") color = "rgba(176,37,33,";
            if (this.getOption("Quantile Color") === "Grey") color = "rgba(175,182,187,";
            for (let i = 0; i < divisions; i++) {
                fills["key" + i] = `${color}${(transperencyRange[i] / 100)})`;
            }
        }
        let transformedData = {};
        _.each(this.cleansedData, (cd) => {
            let d = { fillKey: (this.getOption("Use Quantile") === "No Quantile") ? cd[this.getDimensionName("Location")] : "key" + transperencyDomain(cd[this.getMeasureName("Measure")]) };
            d[this.getMeasureName("Measure")] = cd[this.getMeasureName("Measure")];
            transformedData[cd[this.getDimensionName("Location")]] = d;
        });

        let dataUrl = "";
        if (this.getDimensionName("Location") != null) {
            dataUrl = `/assets/charting/nigeria${this._currentDrillLevel}.json`;
        }

        let identifierSelector = (data) => {
             return _s.titleize(data.id);
        };
        let self = this;
        let size = (width > height) ? height : width;
        let map = new Datamap({
            element: this._htmlElement,
            responsive: true,
            geographyConfig: {
                dataUrl: dataUrl,
                popupTemplate: (geography, data) => {
                    return null;
                }
            },
            fills: fills,
            data: transformedData,
            scope: "nga",
            setProjection: function (element) {
                let projection = d3.geo.equirectangular()
                    .center([12, 4])
                    .scale(width * 3.6)
                    .translate([width / 1.3, height]);

                let path = d3.geo.path()
                    .projection(projection);
                return { path: path, projection: projection };
            },
            clickHandler: function (data) {
                d3plus.tooltip.remove("d3DataMapsToolTip");
               /* self.drillAction([{ query: self.getDimensionsAtLevel()[0].query, item : identifierSelector(data) }]); */
            },
            identifierPath: identifierSelector,
            /* This is for Zooming 
            done: function(datamap) {
                datamap.svg.call(d3.behavior.zoom().on("zoom", redraw));
                function redraw() {
                    let  evt = <d3.ZoomEvent> d3.event;
                    datamap.svg.selectAll("g").attr("transform", "translate(" + evt.translate + ")scale(" + evt.scale + ")");
                }
            }*/
        });
        map.labels();
        let content = null;
        let mouseOver = (d: any) => {
            let data =  (transformedData[identifierSelector(d)] != null) ?
                { name: self.getMeasureName("Measure"), value: transformedData[identifierSelector(d)][self.getMeasureName("Measure")], hightlight: true }
                : { name: self.getMeasureName("Measure"), value: "No Data" };
            let baseData = {
                "title": identifierSelector(d),
                "description": "",
                "color": ColorRegistry.getColor(identifierSelector(d)),
                // "icon": "/assets/img/icon.png",
                "style": "knockout",
                "x": (d3.event as any).pageX,
                "y": (d3.event as any).pageY,
                "id": "d3DataMapsToolTip",
                "width": 250,
                "align": "top center",
                "font-family": self.fontFamily,
                "arrow": true,
                "data": [data],
            };
            content = baseData;
            d3plus.tooltip.create(baseData);
        };
        let mouseLeave = (d) => {
            d3plus.tooltip.remove("d3DataMapsToolTip");
        };
        if (this.getOption("Show Legends")) {
            _.delay(() => {
                d3.select(this._htmlElement).selectAll("svg").selectAll("path")
                    .on("mouseover", mouseOver)
                    .on("mousemove", mouseOver)
                    .on("mouseleave", mouseLeave)
                    .on("contextmenu", function (e) {
                        let firstTitle = self.getDimensionName("Location");
                        content.data.splice(0, 0, { name: firstTitle, value: content.title, highlight: false });
                        self.showContextMenu(content.data);
                    });
                let scale = null;
                if (this.getOption("Use Quantile") === "No Quantile") {
                    scale = d3.scale.ordinal().domain(_.keys(fills).filter(k => k !== "defaultFill")).range(_.values(fills));
                    return;
                } else {
                    let divisions = parseInt(this.getOption("Use Quantile"), 10);
                    scale = d3.scale.quantile().domain([minMax.min, minMax.max]).range(d3.range(0, divisions).map((d) => fills["key" + d]));
                }
                let svg = d3.select(this._htmlElement).select("svg");

                svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(20,30)");

                let legend = (d3 as any).legend.color()
                    .shapeWidth(30)
                    .labelFormat(d3.format(".2f"))
                    .scale(scale);

                svg.select(".legend").call(legend);
            }, 500);
        }
    }
}

export class NigeriaLGAMap extends BaseChart {
    static MetaData: IChartMetaData = {
        prototype: NigeriaLGAMap.prototype,
        family: "Maps",
        name: "NigeriaLGAMap",
        title: "Nigeria LGA Map",
        preview: "/assets/img/charts/nigeriaMap.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Measure", required: true, measurePosition: DisplayPosition.Left }],
        dimensions: [
            { index: 0, name: "Location", required: true, dimensionPosition: DisplayPosition.Right },
        ],
        widgetOptions: _.union(
            BaseChartWidgetOptions, [
                { type: WidgetOptionType.DropDown, name: "Use Quantile", options: ["No Quantile", "2", "3", "4", "5", "6", "7", "8", "9", "10"], default: "No Quantile" },
                { type: WidgetOptionType.DropDown, name: "Quantile Color", options: ["Green", "Blue", "Purple", "Black", "Orange", "Red", "Grey"], default: "Green" },
                { type: WidgetOptionType.Checkbox, name: "Darker when lower value (Quantile)", default: false }
            ] as IWidgetOption[]),
        defaultWidth: 8,
        defaultHeight: 16,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.DownloadImage, ChartFeature.OfficeDocument]
    };

    getMetaData() {
        return NigeriaLGAMap.MetaData;
    }

    fitChart() {
        return true;
    }

    renderChart() {
        if (this._htmlElement == null) { return; }
        if (this.cleansedData == null || this.cleansedData.length === 0) { return; };
        this._htmlElement.innerHTML = "";
        this.baseElementSetup();
        let dimensions = this.getAreaInfo();

        let width = dimensions.width;
        let height = dimensions.height;
        let fills = {
            defaultFill: "#afafaf"
        };
        let minMax = this.getMinMax(this.getMeasureName("Measure"), true);
        let transperencyDomain: any = null;
        if (this.getOption("Use Quantile") === "No Quantile") {
            _.each(this.cleansedData, (cd) => {
                fills[cd[this.getDimensionName("Location")]] = ColorRegistry.getColor(cd[this.getDimensionName("Location")]);
            });
        } else {
            // Quantile Maps has been selected so first take the number of divisions;
            let divisions = parseInt(this.getOption("Use Quantile"), 10);
            let transperencyRange = [0];
            transperencyDomain = d3.scale.quantile().domain([minMax.min, minMax.max]).range(d3.range(0, divisions));
            if (divisions === 2) {
                transperencyRange = [25, 100];
            }
            if (divisions === 3) {
                transperencyRange = [33, 66, 100];
            }
            if (divisions === 4) {
                transperencyRange = [25, 50, 75, 100];
            }
            if (divisions === 5) {
                transperencyRange = [20, 40, 60, 80, 100];
            }
            if (divisions === 6) {
                transperencyRange = [15, 30, 45, 60, 75, 90];
            }
            if (divisions === 7) {
                transperencyRange = [15, 30, 40, 50, 60, 75, 100];
            }
            if (divisions === 8) {
                transperencyRange = [12, 24, 36, 48, 60, 72, 84, 96];
            }
            if (divisions === 9) {
                transperencyRange = [15, 30, 40, 50, 60, 75, 85, 100];
            }
            if (divisions === 10) {
                transperencyRange = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
            }
            if (this.getOption("Darker when lower value (Quantile)") === true) transperencyRange = transperencyRange.reverse();
            let color = "rgba(37,162,78,";
            if (this.getOption("Quantile Color") === "Blue") color = "rgba(34,107,171,";
            if (this.getOption("Quantile Color") === "Purple") color = "rgba(122,43,157,";
            if (this.getOption("Quantile Color") === "Black") color = "rgba(33,46,62,";
            if (this.getOption("Quantile Color") === "Orange") color = "rgba(199,62,3,";
            if (this.getOption("Quantile Color") === "Red") color = "rgba(176,37,33,";
            if (this.getOption("Quantile Color") === "Grey") color = "rgba(175,182,187,";
            for (let i = 0; i < divisions; i++) {
                fills["key" + i] = `${color}${(transperencyRange[i] / 100)})`;
            }
        }
        let transformedData = {};
        _.each(this.cleansedData, (cd) => {
            let d = { fillKey: (this.getOption("Use Quantile") === "No Quantile") ? cd[this.getDimensionName("Location")] : "key" + transperencyDomain(cd[this.getMeasureName("Measure")]) };
            d[this.getMeasureName("Measure")] = cd[this.getMeasureName("Measure")];
            transformedData[cd[this.getDimensionName("Location")]] = d;
        });

        let dataUrl = "";
        if (this.getDimensionName("Location") != null) {
            dataUrl = `/assets/charting/nigeria1.json`;
        }

        let identifierSelector = (data) => {
             return _s.titleize(data.properties.ADM2);
        };
        let self = this;
        let size = (width > height) ? height : width;
        let map = new Datamap({
            element: this._htmlElement,
            responsive: true,
            geographyConfig: {
                dataUrl: dataUrl,
                popupTemplate: (geography, data) => {
                    return null;
                }
            },
            fills: fills,
            data: transformedData,
            scope: "nga",
            setProjection: function (element) {
                let projection = d3.geo.equirectangular()
                    .center([12, 4])
                    .scale(width * 3.6)
                    .translate([width / 1.3, height]);

                let path = d3.geo.path()
                    .projection(projection);
                return { path: path, projection: projection };
            },
            clickHandler: function (data) {
                d3plus.tooltip.remove("d3DataMapsToolTip");
                /*self.drillAction([{ query: self.getDimensionsAtLevel()[0].query, item : identifierSelector(data) }]);*/
            },
            identifierPath: identifierSelector,
            /* This is for Zooming 
            done: function(datamap) {
                datamap.svg.call(d3.behavior.zoom().on("zoom", redraw));
                function redraw() {
                    let  evt = <d3.ZoomEvent> d3.event;
                    datamap.svg.selectAll("g").attr("transform", "translate(" + evt.translate + ")scale(" + evt.scale + ")");
                }
            }*/
        });
        map.labels();
        let content = null;
        let mouseOver = (d: any) => {
            let data =  (transformedData[identifierSelector(d)] != null) ?
                { name: self.getMeasureName("Measure"), value: transformedData[identifierSelector(d)][self.getMeasureName("Measure")], hightlight: true }
                : { name: self.getMeasureName("Measure"), value: "No Data" };
            let baseData = {
                "title": identifierSelector(d),
                "description": "",
                "color": ColorRegistry.getColor(identifierSelector(d)),
                // "icon": "/assets/img/icon.png",
                "style": "knockout",
                "x": (d3.event as any).pageX,
                "y": (d3.event as any).pageY,
                "id": "d3DataMapsToolTip",
                "width": 250,
                "align": "top center",
                "font-family": self.fontFamily,
                "arrow": true,
                "data": [data],
            };
            content = baseData;
            d3plus.tooltip.create(baseData);
        };
        let mouseLeave = (d) => {
            d3plus.tooltip.remove("d3DataMapsToolTip");
        };
        if (this.getOption("Show Legends")) {
            _.delay(() => {
                d3.select(this._htmlElement).selectAll("svg").selectAll("path")
                    .on("mouseover", mouseOver)
                    .on("mousemove", mouseOver)
                    .on("mouseleave", mouseLeave)
                    .on("contextmenu", function (e) {
                        let firstTitle = self.getDimensionName("Location");
                        content.data.splice(0, 0, { name: firstTitle, value: content.title, highlight: false });
                        self.showContextMenu(content.data);
                    });
                let scale = null;
                if (this.getOption("Use Quantile") === "No Quantile") {
                    scale = d3.scale.ordinal().domain(_.keys(fills).filter(k => k !== "defaultFill")).range(_.values(fills));
                    return;
                } else {
                    let divisions = parseInt(this.getOption("Use Quantile"), 10);
                    scale = d3.scale.quantile().domain([minMax.min, minMax.max]).range(d3.range(0, divisions).map((d) => fills["key" + d]));
                }
                let svg = d3.select(this._htmlElement).select("svg");

                svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(20,30)");

                let legend = (d3 as any).legend.color()
                    .shapeWidth(30)
                    .labelFormat(d3.format(".2f"))
                    .scale(scale);

                svg.select(".legend").call(legend);
            }, 500);
        }
    }
}