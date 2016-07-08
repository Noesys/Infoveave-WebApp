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
import { BaseChart, IChartMetaData, IChartSelectedMeasure, IChartSelectedDimension } from "./base";
import { DimpleBaseChart, DimpleColumnChart, DimpleBarChart, DimpleBubbleChart, DimpleLineChart, DimpleAreaChart, DimpleColumnLineChart, DimplePieDonutChart } from "./charts/dimpleCharts";
import { LabelWidget } from "./charts/textWidgets";
import { TabularChart } from "./charts/tableWidget";
import { PivotViewChart } from "./charts/pivotView";
import { NigeriaMap, NigeriaLGAMap } from "./charts/nigeriaMap";
import { DateRangeInterval } from "../helpers/dateHelpers";
/**
 * Import the charts into this file
 * sample - import { ParallelSetChart } from "./charts/parallelSetChart";
 */
export class ChartFactory {
    /**
     * Add custom charts this object
     */
    protected static Charts: any[] = [
        DimpleColumnChart,
        DimpleBarChart,
        DimpleBubbleChart,
        DimpleLineChart,
        DimpleAreaChart,
        DimpleColumnLineChart,
        DimplePieDonutChart,
        LabelWidget,
        TabularChart,
        PivotViewChart,
        NigeriaMap,
        NigeriaLGAMap,
    ];

    static GetMetaData(): IChartMetaData[] {
        return _.map(ChartFactory.Charts, (c) => c.MetaData);
    };

    static GetMetaDataForType(type: string): IChartMetaData {
        let metadata = _.find(ChartFactory.Charts, (c) => c.MetaData.name === type);
        if (metadata == null) { return null; };
        return metadata.MetaData;
    };

    /**
     * Create a Chart Instance based on given name
     * @param  {string} name
     * @param  {{level:number} measures
     * @param  {IChartSelectedMeasure[]}[]} measures
     * @param  {{level:number} dimensions
     * @param  {IChartSelectedDimension[]}[]} dimensions
     * @param  {string} dateDimension
     * @param  {{name:string} options
     * @param  {any}[]} value
     * @param  {{name:string} filters
     * @param  {string[]}[]} items
     * @returns BaseChart
     */
    static CreateChart(
        name: string,
        measures: { level: number, measures: IChartSelectedMeasure[] }[],
        dimensions: { level: number, dimensions: IChartSelectedDimension[] }[],
        dateDimension: string,
        options: { name: string, value: any }[],
        filters: { name: string, operator: string, items: string[] }[],
        fixedDate: { mode: DateRangeInterval, progression: number, beginDate: Date, endDate: Date, range: string[] }
        ): BaseChart {
        let chartPrototype = _.find(ChartFactory.Charts, (c) => (c.MetaData as IChartMetaData).name === name);
        if (chartPrototype == null) {
            throw "Chart Not Found";
       };
        return new chartPrototype(measures, dimensions, dateDimension, options, filters, fixedDate);
    }

    static GetEmptyMetadata(): IChartMetaData {
        return {
            defaultHeight: 2,
            defaultWidth: 2,
            dimensions: [],
            drillDowns: 0,
            measures: [],
            widgetOptions: [],
            title: null,
            family: null,
            name: null,
            preview: null,
            prototype: null,
            showBreadCrumb: true,
            featureSupport: [] } as IChartMetaData;
    };
}