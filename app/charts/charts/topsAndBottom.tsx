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
import * as React from "react";
import * as ReactDOM from "react-dom";
import { IChartMetaData, ChartFeature, BaseChart, BaseWidgetOptions, DisplayPosition, IChartSelectedMeasure, IChartSelectedDimension, WidgetOptionType, ColorRegistry, TransparentComponent } from "./../base";
import * as _s  from "underscore.string";
import { WidgetDataRequest } from "./../../data/models";
import { DateRangeInterval } from "./../../helpers/dateHelpers";

abstract class TopsAndBottom extends BaseChart {
    protected _type: string = "";

    fitChart() {
        return true;
    }

    getPostData(filters: { name: string, operator: string, items: string[] }[], dateFilters: string[], mode: DateRangeInterval, progression: number, startDate: Date, endDate: Date): WidgetDataRequest[] {
        // Custom Implementation as Date needs to be added by the chart Itself
        let postData = super.getPostData(filters, dateFilters, mode, progression, startDate, endDate);
        let currentDimension = _.find(postData[0].dimensions, (d) => d.query === this.getDimensionsAtLevel()[0].query);
        currentDimension.items = [this._type + this.getOption("Count")];
        return postData;
    };

    renderChart() {
        if (this._htmlElement == null) { return; }
        if (this.cleansedData == null || this.cleansedData.length === 0) { return; };
        ReactDOM.unmountComponentAtNode(this._htmlElement);
        this._htmlElement.innerHTML = "";
        this.baseElementSetup();
        let dimensions = this.getAreaInfo();
        // Code Here

        let newElementId = this.gererateRandomId(6);
        let newElementId2 = this.gererateRandomId(6);
        let self = this;
        let content = null;
        let chartData = null;
        let prefix = "";
        let suffix = "";
        if (self.measureMetaData[0].prefix !== null) {
            prefix = self.measureMetaData[0].prefix;
        }
        if (self.measureMetaData[0].suffix !== null) {
            suffix = self.measureMetaData[0].suffix;
        }
        let chartrender = () => {
            _.delay(() => {
                d3plus.viz()
                    .container("#" + newElementId)
                    .data(this.cleansedData)
                    .type("pie")
                    .id(this.getDimensionName("Dimension"))
                    .color((d) => {
                        return ColorRegistry.getColor(d[this.getDimensionName("Dimension")]);
                    })
                    .size(this.getMeasureName("Measure"))
                    .format({
                        "number": function (toolTipData, params) {
                            if (toolTipData) {
                                chartData = (+toolTipData.toFixed(2) % 1 === 0) ? _s.numberFormat(toolTipData) : _s.numberFormat(toolTipData, 2);
                            }
                            if (params.key === "share") {
                                chartData = chartData + " %";
                            } else {
                                chartData = `${prefix} ${chartData} ${suffix}`;
                            }
                            return chartData;
                        }
                    })
                    .draw()
                    .mouse({
                        "click": function (d) {
                            let baseData = {
                                "data": [
                                    { name: self.getDimensionName("Dimension"), value: d[self.getDimensionName("Dimension")] },
                                    { name: self.getMeasureName("Measure"), value: self.numberFormat(d[self.getMeasureName("Measure")]), highlight: true }
                                ],
                            };
                            content = baseData;
                            self.showContextMenu(content.data);
                        }
                    });
            }, 1000);
        };
        let dimensionName = this.getDimensionName("Dimension");
        let measureName = this.getMeasureName("Measure");
        let height = dimensions.height - 300;

        let formatter = (value: number) => {
           return  <div> {prefix} {this.numberFormat(value)} {suffix}</div>;
        };

        let component = <TransparentComponent post={chartrender}><div style={{width:"100%",height:"100%",overflowX:"hidden","overflowY":"hidden"}}>
            <div id={newElementId} style={{width:"100%", height:"300px"}} ></div>
            <div className="scrollable" style={{height:height}}>
            <table className="table table-condensed table-hover topsAndBottoms">
                <thead>
                    <tr>
                    <th className="padding-10">{dimensionName}</th>
                    <th className="padding-10" style={{textAlign:"right"}}>{measureName}</th>
                    </tr>
                </thead>
                <tbody>
                    {_.map(this.cleansedData, (cd, ix) => {
                        return <tr key={this.gererateRandomId(3) + ix}>
                            <td className="padding-10"><div className="hint--right" data-hint={cd[dimensionName]}>{cd[dimensionName]}</div></td>
                            <td className="padding-10" style={{textAlign:"right"}}><div className="hint--left" data-hint={cd[measureName]}>{formatter(cd[measureName])}</div></td>
                        </tr>;
                    })}
                </tbody>
            </table></div></div>
        </TransparentComponent>;

        ReactDOM.render(component, this._htmlElement);

    }
}

export class TopNChart extends TopsAndBottom {
    static MetaData: IChartMetaData = {
        prototype: TopNChart.prototype,
        family: "Business Widgets",
        name: "TopNChart",
        title: "Top N Chart",
        preview: "/assets/img/charts/topN.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Measure", required: true, measurePosition: DisplayPosition.Left }],
        dimensions: [
            { index: 0, name: "Dimension", required: true, dimensionPosition: DisplayPosition.Right }
        ],
        widgetOptions: _.union(BaseWidgetOptions, [
                { type: WidgetOptionType.DropDown, name: "Count", options: ["5", "10", "20"], default: "5" },
            ])
        ,
        defaultWidth: 3,
        defaultHeight: 20,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.OfficeDocument]
    };

    getMetaData() {
        return TopNChart.MetaData;
    }

    protected _type = "Top";

}

export class BottomNChart extends TopsAndBottom {
    static MetaData: IChartMetaData = {
        prototype: TopNChart.prototype,
        family: "Business Widgets",
        name: "BottomNChart",
        title: "Bottom N Chart",
        preview: "/assets/img/charts/bottomN.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Measure", required: true, measurePosition: DisplayPosition.Left }],
        dimensions: [
            { index: 0, name: "Dimension", required: true, dimensionPosition: DisplayPosition.Right }
        ],
        widgetOptions: _.union(BaseWidgetOptions, [
                { type: WidgetOptionType.DropDown, name: "Count", options: ["5", "10", "20"], default: "5" },
            ])
        ,
        defaultWidth: 3,
        defaultHeight: 20,
        featureSupport: [ChartFeature.DownloadData, ChartFeature.OfficeDocument]
    };

    getMetaData() {
        return BottomNChart.MetaData;
    }

    protected _type = "Bottom";

}

