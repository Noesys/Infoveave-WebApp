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
// <reference path="../../../typings/references.d.ts"/>
"use strict";
import { IChartMetaData, ChartFeature, BaseChart, BaseWidgetOptions, DisplayPosition, IChartSelectedMeasure, IChartSelectedDimension, WidgetOptionType, ColorRegistry, TransparentComponent, AutoSizeText } from "./../base";
import * as _s  from "underscore.string";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { WidgetDataRequest } from "./../../data/models";
import { DateRangeInterval, DateHelpers } from "./../../helpers/dateHelpers";

export class MoodWidget extends BaseChart {
    static MetaData: IChartMetaData = {
        prototype: MoodWidget.prototype,
        family: "Text Widgets",
        name: "MoodWidget",
        title: "Mood Widget",
        preview: "/assets/img/charts/moodWidget.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Measure", required: true, measurePosition: DisplayPosition.Left },
            ],
        dimensions: [],
        widgetOptions: _.union(BaseWidgetOptions, [
            { type: WidgetOptionType.DropDown, name: "Better When", options: ["Higher Value", "Lower Value"], default: "Higher Value" },
            { type: WidgetOptionType.DropDown, name: "Compare To", options: ["Parallel", "Previous"], default: "Parallel" }
        ]),
        defaultWidth: 5,
        defaultHeight: 8,
        featureSupport: [ChartFeature.OfficeDocument]
    };

    getMetaData() {
        return MoodWidget.MetaData;
    }

    fitChart() {
        return true;
    }

    getPostData(filters: { name: string, operator: string, items: string[] }[], dateFilters: string[], mode: DateRangeInterval, progression: number, startDate: Date, endDate: Date): WidgetDataRequest[] {
        // Custom Implementation as Parallel/ Previous Period stuff needs to be done
        let postData = super.getPostData(filters, dateFilters, mode, progression, startDate, endDate);
        let additional: WidgetDataRequest = JSON.parse(JSON.stringify(postData[0]));
        // for this widget we know that dates are alwas part of filters
        let additionalDates = DateHelpers.getQueryDatesParallel((this.getOption("Compare To") !== "Parallel"), mode, progression, startDate, endDate);
        let appliedDateFilters = _.find(additional.filters, (f) => f.query === "Date");
        appliedDateFilters.items = additionalDates.range;
        additional.startDate = additionalDates.startDate;
        additional.endDate = additionalDates.endDate;
        let postData2 = [postData[0], additional];
        return postData2;
    };

    renderChart() {
        if (this._htmlElement == null) { return; }
        if (this.cleansedData == null || this.cleansedData.length === 0) { return; };
        if (this.cleansedDataAdditional[1] == null) { return; }
        ReactDOM.unmountComponentAtNode(this._htmlElement);
        this._htmlElement.innerHTML = "";
        this.baseElementSetup();
        let dimensions = this.getAreaInfo();
        let currentPeriod = "Current Period",
            previousPeriod = this.getOption("Compare To") + " Period",
            currentValue = this.cleansedData[0][this.getMeasureName("Measure")],
            previousValue = this.cleansedDataAdditional[1][0][this.getMeasureName("Measure")];
       if (currentValue == null) { currentValue = 0; }
       if (previousValue == null) { previousValue = 0; }
       let changeByActual = currentValue - previousValue;
       let changeByPercent = (previousValue === currentValue) ? 0 : (previousValue === 0) ? 1 : (currentValue === 0) ? -1 : ((currentValue - previousValue) / previousValue);
       let prefix = this.measureMetaData[0].prefix;
       let suffix = this.measureMetaData[0].suffix;
       let option = this.getOption("Better When");
       let bgClass = "bg-info";
       if (option === "Higher Value" && currentValue > previousValue) { bgClass = "bg-success"; }
       if (option === "Higher Value" && currentValue === previousValue) { bgClass = "bg-info"; }
       if (option === "Higher Value" && currentValue < previousValue) { bgClass = "bg-danger"; }
       if (option === "Lower Value" && currentValue < previousValue) { bgClass = "bg-success"; }
       if (option === "Lower Value" && currentValue === previousValue) { bgClass = "bg-info"; }
       if (option === "Lower Value" && currentValue > previousValue) { bgClass = "bg-danger"; }
       let widgetContent = <TransparentComponent post={() => {
            $(this._htmlElement).find(".metro").liveTile();
       } }><div className={"panel-body " + bgClass + " no-padding"}>
    <div className="metro live-tile " data-delay="3500" data-mode="carousel">
        <div className="slide-front tiles slide active">
            <div className="padding-30">
                <div className="pull-bottom p-b-30 bottom-right bottom-left p-l-30 p-r-30">
                     <h5 className="no-margin semi-bold p-b-5">{this.getMeasureName("Measure")}</h5>
                    <h3 className="semi-bold text-white"><i className={"fa " + ((changeByActual > 0) ? "fa-sort-up" : "fa-sort-down") + " small text-white"}></i> {prefix} {this.numberFormat(currentValue)} {suffix}</h3>
                    <p>
                        <span className="text-black">Change By</span> <span className="m-l-20 hint-text">{prefix} {this.numberFormat(changeByActual)} {suffix}</span>
                        </p>
                    </div>
                </div>
            </div>
        <div className="slide-back tiles">
            <div className="container-sm-height full-height">
                <div className="row-sm-height">
                    <div className="col-sm-height padding-25">
                        <p className="hint-text text-white"><b> { (changeByActual > 0) ? " Up by" : " Down by" }  {this.numberFormat(changeByPercent * 100)} % </b></p>
                        <p className="p-t-10 text-black">{currentPeriod}</p>
                        <div className="p-t-10">
                            <p className="hint-text inline"><span className="m-l-20"><b>{prefix} {this.numberFormat(currentValue)} {suffix}</b></span>
                                </p>
                            </div>
                        <p className="p-t-10 text-black">{previousPeriod}</p>
                        <div className="p-t-10">
                            <p className="hint-text inline"><span className="m-l-20"><b>{prefix} {this.numberFormat(previousValue)} {suffix}</b></span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
               </div></TransparentComponent>;

       ReactDOM.render(widgetContent, this._htmlElement);
    }


}


export class LabelWidget extends BaseChart {
    static MetaData: IChartMetaData = {
        prototype: LabelWidget.prototype,
        family: "Text Widgets",
        name: "LabelWidget",
        title: "Label Widget",
        preview: "/assets/img/charts/labelWidget.png",
        drillDowns: 0,
        measures: [
            { index: 0, name: "Measure", required: true, measurePosition: DisplayPosition.Left },
            ],
        dimensions: [],
        widgetOptions: _.union(BaseWidgetOptions, [
             { type: WidgetOptionType.DropDown, name: "Color", options: ["Green", "Yellow", "Red", "Blue", "Dark"], default: "Green" },
        ]),
        defaultWidth: 2,
        defaultHeight: 4,
        featureSupport: [ChartFeature.OfficeDocument]
    };

    getMetaData() {
        return LabelWidget.MetaData;
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
        let elId1 = this.gererateRandomId(5);

        let prefix = this.measureMetaData[0].prefix;
        let suffix = this.measureMetaData[0].suffix;
        let currentValue = this.cleansedData[0][this.getMeasureName("Measure")];

        let option = this.getOption("Color");

        let bgClass = "bg-success";
        if (option === "Yellow") { bgClass = "bg-warning"; };
        if (option === "Red") { bgClass = "bg-danger"; };
        if (option === "Blue") { bgClass = "bg-info"; };
        if (option === "Dark") { bgClass = "bg-primary"; };

        let widgetContent = <TransparentComponent>
        <div className={"block panel padder-v " + bgClass + " item"} style={{ height: "100%", border: "none" }}>
            <div className="text-white block" style={{ textAlign: "center", height: "60%"}}>
                <AutoSizeText fontRatio={9} >{prefix} {this.numberFormat(currentValue)} {suffix}</AutoSizeText>
                </div>
            <div className="text-muted block" style={{ textAlign: "center", height: "40%"}}>
            <AutoSizeText  fontRatio={15}>{this.getMeasureName("Measure") }</AutoSizeText></div>
            </div>
            </TransparentComponent>;

        ReactDOM.render(widgetContent, this._htmlElement);
    }


}


