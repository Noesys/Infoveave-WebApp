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
import * as _ from "lodash";
import * as _s from "underscore.string";
import * as chance from "chance";
import { WidgetDataRequest, Dimension } from "./../data/models";
import { ColorsArray } from "./otherColors";
import $ from "jquery";
import { DateRangeInterval, DateHelpers } from "../helpers/dateHelpers";
import * as React from "react";
import * as ReactDOM from "react-dom";

export interface IChartMeasure {
    index: number;
    name: string;
    required: boolean;
    measurePosition: DisplayPosition;
}

export interface IChartDimension {
    index: number;
    name: string;
    required: boolean;
    dimensionPosition: DisplayPosition;
}

export interface IChartSelectedMeasure {
    axisIndex: number;
    axis: string;
    dataSourceId: number;
    id: number;
    name: string;
    query: string;
}

export interface IChartSelectedDimension {
    axisIndex: number;
    axis: string;
    dataSourceId: number;
    id: number;
    name: string;
    query: string;
}

export enum WidgetOptionType {
    DropDown = 0,
    Checkbox = 1,
    Input = 2
}
export interface IWidgetOption {
    name: string;
    options?: Array<any>;
    type: WidgetOptionType;
    default: any;
}

export interface IWidgetOptionWithValue {
    name: string;
    options?: Array<any>;
    type: WidgetOptionType;
    default: any;
    value: any;
}

export enum ChartFeature {
    DownloadImage = 0,
    DownloadData = 1,
    OfficeDocument = 2
}

export interface IChartMetaData {
    prototype: any;
    family: string;
    name: string;
    title: string;
    preview: string;
    drillDowns: number;
    measures: IChartMeasure[];
    dimensions: IChartDimension[];
    widgetOptions: IWidgetOption[];
    defaultWidth: number;
    defaultHeight: number;
    featureSupport: ChartFeature[];
}

export enum DisplayPosition {
    Top = 0,
    Left = 1,
    Bottom = 2,
    Right = 3
}
export interface IChartConstructorData {
    schema: number;
    measures: { level: number, measures: IChartSelectedMeasure[] }[];
    dimensions: { level: number, dimensions: IChartSelectedDimension[] }[];
    dateQuery: string;
    options: { name: string, value: any }[];
    filters: { name: string, operator: string, items: string[] }[];
    fixedDate: { mode: DateRangeInterval, beginDate: Date, endDate: Date, progression: number, range: string[] };
}

export const BaseWidgetOptions: IWidgetOption[] = [
    { type: WidgetOptionType.Checkbox, name: "Show Title", default: true },
    { type: WidgetOptionType.Checkbox, name: "Hide Zero Values", default: false },
    { type: WidgetOptionType.Checkbox, name: "Retrieve Null Values", default: false }
];

export const BaseChartWidgetOptions: IWidgetOption[] = _.union(
    BaseWidgetOptions,
    [
        { type: WidgetOptionType.Checkbox, name: "Show Legends", default: true },
        // { type: WidgetOptionType.Checkbox, name: "Show Values", default: true }
    ]
);



/** The Abstract class on which every other chart is based on */
export abstract class BaseChart {
    static MetaData: IChartMetaData;
    private _measures: { level: number, measures: IChartSelectedMeasure[] }[];
    private _dimensions: { level: number, dimensions: IChartSelectedDimension[] }[];
    private _options: { name: string, value: any }[];
    private _filters: { name: string, operator: string, items: string[] }[];
    private _dateDimension: string;
    private _fixedDate: { mode: DateRangeInterval, progression: number, beginDate: Date, endDate: Date, range: string[] };
    _sliceDimension: Dimension;
    _maxDrillLevels: number;
    _htmlElement: HTMLElement;
    _htmlReference: string;
    /**
     * Implementation is a must
     * @param {{level:number, mertics: IChartSelectedMeasure[] }[]} measures - Selected Measures along with metadata.
     * @param {{level:number:IChartSelectedDimension[]}[]} dimensions - Selected Dimensions at each level with metadata.
     * @param {{option:string,value:any}[]} chartOptions - Selected Chart options.
     * @param {{name:string,items:string[]}[]} filters - Preset Filters of the widget.
     */
    constructor(
        measures: { level: number, measures: IChartSelectedMeasure[] }[],
        dimensions: { level: number, dimensions: IChartSelectedDimension[] }[],
        dateDimension: string,
        options: { name: string, value: any }[],
        filters: { name: string,  operator: string, items: string[] }[],
        fixedDate: { mode: DateRangeInterval, progression: number, beginDate: Date, endDate: Date, range: string[] }) {
        let metaData = this.getMetaData();
        _.each(_.filter(metaData.measures, (m) => m.required), (mm) => {
            let allSelected = _.flatten(_.map(measures, (m) => m.measures));
            let me = _.find(allSelected, (m) => m.axis === mm.name);
            if (me == null) { throw "Required Measures Not Added"; };
        });
        _.each(_.filter(metaData.dimensions, (d) => d.required), (dm) => {
            let allSelected = _.flatten(_.map(dimensions, (d) => d.dimensions));
            let de = _.find(allSelected, (d) => d.axis === dm.name);
            if (de == null) { throw "Required Dimension Not Added"; };
        });
        this._measures = measures;
        this._dimensions = dimensions;
        this._dateDimension = dateDimension;
        this._sliceDimension = null;
        this._options = options;
        this._filters = filters;
        this._fixedDate = fixedDate;
        this._maxDrillLevels = _.max(_.union(_.map(this._measures, (m) => m.level), _.map(this._dimensions, (d) => d.level)));
    }

    private _dataSourceIds: number[];

    setDataSourceIds(dataSourceIds: number[]) {
        this._dataSourceIds = dataSourceIds;
    }

    abstract fitChart(): boolean;
    /**
     * Render the Chart to the Attached div
     */
    abstract renderChart(): void;


    /**
     * Method to return the Static information down to base
     */
    abstract getMetaData(): IChartMetaData;

    setArea = (htmlElement: HTMLElement) => {
        this._htmlElement = htmlElement;
    };

    protected baseElementSetup = () => {
        let elementId = this.getMetaData().name + "-" + this.gererateRandomId(5);
        $(this._htmlElement).attr("id", elementId);
        this._htmlReference = "#" + elementId;
        if (this._currentDrillLevel > 0) {
            $(this._htmlElement).append("<div class=\"pull-left widgetBack\" style=\"position:absolute;top:50px;left:20px;cursor:pointer\"><i class=\"fa fa-arrow-circle-left\" style=\"font-size:24px\"></i></fa>");
            $(this._htmlElement).find(".widgetBack").click(this.backClick);
        }
    };

    setSlice = (dimName: Dimension) => {
        this._sliceDimension = dimName;
    };

    backClick = () => {
        if (this._currentDrillLevel === 0) { return; };
        this._currentDrillLevel -= 1;
        if (this._previewMode) {
          this.generatePreview(this._currentDrillLevel);
       };
        if (this.DrillAction != null) {
            this.DrillAction(this._currentDrillLevel, null);
        }
    };

    public OnShowContextMenu: (data: { name: string, value: number, highlight: boolean }[]) => void;

    public DrillAction: (newLevel: number, info: { query: string, item: string }[]) => void;

    protected drillAction(info: { query: string, item: string }[]) {
        if (this._currentDrillLevel === this._maxDrillLevels) {
            return;
        }
        if (this._previewMode) {
            this.generatePreview(this._currentDrillLevel + 1);
        }
        if (this.DrillAction != null) {
            // See if DrillDown is on Date, If So then Make sure that each item in the list is updated
            // using the dateIntervalUsed earlier for the data;
            if (info.length > 0 && _.find(info, (i) => i.query === "Date" ) != null) {
                _.each(_.filter(info, (i) => i.query === "Date"), (item) => {
                    item.item = this.dateIntervalUsed + ".[" + item.item + "]";
                });
            }
            // Lets Check if the drill is on measures or dimensions
            // and if on measures then no need to pass info
            if (this._measures[this._currentDrillLevel + 1] != null) {
                this.DrillAction(this._currentDrillLevel + 1, []);
            }else {
                this.DrillAction(this._currentDrillLevel + 1, info);
            }
        }
    };
    /**
     * Generate Chart Data Request.
     * Dimensions are matched based on query and merged with filters
     * If the chart already has a preset filter, chart's filters take
     * precedence over containers filters 
     */
    getPostData(filters: { name: string, operator: string, items: string[] }[], dateFilters: string[], mode: DateRangeInterval, progression: number, startDate: Date, endDate: Date): WidgetDataRequest[] {
        // if the widget has fixed dates, we will force the widget to use the saved information
        if (this._fixedDate != null) {
            let newDateRange = null;
            if (this._fixedDate.progression === 999) {
                newDateRange = this._fixedDate.range;
            }else {
                newDateRange = DateHelpers.getQueryDates(this._fixedDate.mode, this._fixedDate.progression, this._fixedDate.beginDate, this._fixedDate.endDate);
            }
            mode = this._fixedDate.mode;
            startDate = this._fixedDate.beginDate;
            endDate = this._fixedDate.endDate;
            dateFilters = newDateRange;
        }
        // Lets Merge the filters first, 
        // and this means that widget filters are always overridden 
        // when filters from board are applied
        let filtersRemaining = _.map(filters, (f) => { return { query: f.name, operator: f.operator, items: f.items };  });
        let commonFilters = _.map(this._filters, (f) => {
            let inFilters = _.find(filtersRemaining, (fr) => fr.query === f.name);
            if (inFilters != null) {
                filtersRemaining = _.filter(filtersRemaining, (fi) => fi.query !== inFilters.query);
            }
             return { query: f.name, operator: f.operator, items: (inFilters != null) ? f.items : inFilters.items  }; // This line now has the reverse logic - Change the items here if the behaviour explained above needs to reversed
        });
        let allFilters = _.union(commonFilters, filtersRemaining);
        // Now Using all filters replace the items in dimension with the ones in filters;
        let dateFiltersAdded = false;
        let mergedDimensions = _.map(this.getDimensionsAtLevel(), (dim) => {
            if (dim.name === "Date") {
                dateFiltersAdded = true;
                // If the Chart has a drill action there might be a possibility that 
                // there will be a Date filter in allFilters which has to override the boardFilter
                if (_.find(allFilters, (f) => f.query === "Date") != null) {
                    let items = _.clone(_.find(allFilters, (f) => f.query === "Date").items);
                    allFilters = _.filter(allFilters, (f) => f.query !== "Date");
                    return { query: dim.query, items: items};
               };
                return { query: dim.query, items: dateFilters };
            } else {
                let inFilters = _.find(allFilters, (f) => f.query === dim.query);
                if (inFilters != null) {
                    allFilters = _.filter(allFilters, (f) => f.query !== inFilters.query);
                    return { query: dim.query, operator: inFilters.operator, items: inFilters.items };
                }
            }
            return { query: dim.query, items: [] };
        });
        // Additionall Make sure the Date Doesn't get Added Twice
        if (!dateFiltersAdded && (_.find(allFilters, (f) => f.query === "Date") == null)) {
            allFilters.push({ query: "Date", operator: "Exactly", items: dateFilters });
        }
        let data: WidgetDataRequest = {
            measures: _.map(this.getMeasuresAtLevel(), (m) => { return { id: m.id, query: m.query, dataSourceId: m.dataSourceId }; }),
            dimensions: mergedDimensions,
            filters: allFilters,
            startDate: moment(startDate).format("YYYY-MM-DD"),
            endDate: moment(endDate).format("YYYY-MM-DD"),
            dateQuery: this._dateDimension,
            retrieveNullValues: this.getOption("Retrieve Null Values")
        };
        return [data];
    };

    /**
     * Current DrillLevel
     */
    protected _currentDrillLevel: number = 0;

    setDrillLevel = (level: number): void => {
        this._currentDrillLevel = level;
    };

    /**
     * Core CleansedData
     */
    protected cleansedData: Array<any>;

    /**
     * Additional Data
     */
    protected cleansedDataAdditional: Array<Array<any>> = [];

    protected measureMetaData: { query: string, isPercent: boolean, prefix: string, suffix: string }[];

    protected dateIntervalUsed: string = "";

    /*
    * Set the Data that is recived;
    * The method is also transforming the recieved data from server and replacing the keys to names.
    */
    setData = (set: number, data: Array<any>, measureMetaData: { query: string, isPercent: boolean, prefix: string, suffix: string }[], dateIntervalUsed: string) => {
        this.dateIntervalUsed = dateIntervalUsed;
        this.measureMetaData = measureMetaData;
        if (data.length === 0) {
            this.renderChart();
            return;
       };
        let keys = data[0];
        let updateKeyMap = {};
        _.each(keys, (k) => {
            if (k === "Date") {
                updateKeyMap["Date"] = { name: "Date", type: "Date", ix : keys.indexOf(k) };
                return;
            }
            let dm = _.find(this.getDimensionsAtLevel(), (d) => d.query.toLowerCase() === k.toLowerCase());
            if (dm != null) {
                updateKeyMap[k] = { name: dm.name, type: "dimension", ix: keys.indexOf(k) };
                return;
            };
            let mn = _.find(_.flatten(_.map(this._measures, (m) => m.measures)), (m) => m.query.toLowerCase() === k.toLowerCase());
            if (mn != null) {
                updateKeyMap[k] = { name: mn.name, type: "measure", ix: keys.indexOf(k) };
                return;
            }
            updateKeyMap[k] = { name: k };
        });
        let newData = _.map(data, (row, ix) => {
            if (ix === 0) return;
            let tr = { order: ix };
            _.each(_.keys(updateKeyMap), (k) => {
                tr[updateKeyMap[k].name] = (updateKeyMap[k].type === "dimension") ? _s.titleize(row[updateKeyMap[k].ix]) : row[updateKeyMap[k].ix];
            });
            return tr;
        });
        newData.splice(0, 1);
        if (this.getOption("Hide Zero Values")) {
            newData = _.filter(newData, (n) => {
                 let allValues = _.map(this.getMeasuresAtLevel(), (m) => n[m.name]);
                 if (_.uniq(allValues).length === 1 && _.uniq(allValues)[0] === 0) return false;
                 return true;
            });
        }
        /*if (newData.length > 50) {
            let firstMeasure = this.getMeasuresAtLevel()[0].name;
            newData = _.sortBy(newData, (n) => n[firstMeasure]).reverse();
            newData = _.take(newData, 50);
        }*/
        if (set === 0) {
            this.cleansedData = newData;
        }
        this.cleansedDataAdditional[set] = newData;
        this.renderChart();
    };

    /**
     * Get Selected Measures at Current Level 
     * and if not found that at Level-0
     */
    getMeasuresAtLevel = (): IChartSelectedMeasure[] => {
        let measures = _.find(this._measures, (m) => m.level === this._currentDrillLevel);
        if (measures == null && this._currentDrillLevel === 0) return null;
        if (measures == null && this._currentDrillLevel > 0) { return this._measures[0].measures; };
        return measures.measures;
    };

    /**
     * Get Selected Dimensions at Current Level 
     * and if not found that at Level-0
     */
    getDimensionsAtLevel = (): IChartSelectedDimension[] => {
        let dimensions = _.find(this._dimensions, (d) => d.level === this._currentDrillLevel);
        if (dimensions == null && this._currentDrillLevel === 0) return null;
        let cDimension: { level: number, dimensions: IChartSelectedDimension[] } = JSON.parse(JSON.stringify(dimensions));
        if (this._sliceDimension != null && _.includes(this._dataSourceIds, this._sliceDimension.dataSourceId)) {
            let index = null;
            let dimData = [];
            let dimData1 = [];
            dimData.push(this._dimensions[0].dimensions[0].name);
            dimData.push(this._dimensions[0].dimensions[0].query);
            cDimension.dimensions[0].name = this._sliceDimension.name;
            cDimension.dimensions[0].query = this._sliceDimension.query;
            let matchedDim = _.find(cDimension.dimensions, (d, ix) => {
                if (d.name === this._sliceDimension.name) {
                    index = ix;
                    return d;
                }
            });
            if (matchedDim != null) {
                _.each(cDimension.dimensions, (d, ix) => {
                    if (ix <= index && ix > 0) {
                        dimData1[0] = d.name;
                        dimData1[1] = d.query;
                        d.name = dimData[0];
                        d.query = dimData[1];
                        dimData[0] = dimData1[0];
                        dimData[1] = dimData1[1];
                    }
                });
            }
            return cDimension.dimensions;
        } else {
        if (dimensions == null && this._currentDrillLevel > 0) { return this._dimensions[0].dimensions; }
        return dimensions.dimensions;
        }
    };

    protected _previewMode: boolean = false;

    /**
     * Set the Chart to Start using preview data
     */
    setPreviewMode = (htmlElement: HTMLElement) => {
        this._previewMode = true;
        this.setArea(htmlElement);
        this.generatePreview(0);
    };

    /**
     * Generate Random Data based on the selected data
     * and set it to cleansedData to preview
     * 
     */
    protected generatePreview = (level: number) => {
        let chanceG = new chance.Chance();
        let data = [];
        let dimensions = this.getDimensionsAtLevel();
        let measures = this.getMeasuresAtLevel();
        if (measures == null) { return; };
        this.measureMetaData = [];
        if (dimensions == null) {
            let row = {};
            _.each(measures, (m) => {
                row[m.name] = chanceG.floating({ min: 1000, max: 5000, fixed: 2 });
                this.measureMetaData.push({ query: m.query, prefix: "", suffix: "", isPercent: false });
            });
            data = [row];
        } else {
            for (let i = 0; i <= dimensions.length * 5; i++) {
                let row = {};
                _.each(dimensions, (d) => {
                    if (d.name === "Date") {
                        row["Date"] = chanceG.month() + ", " + (new Date()).getFullYear();
                    } else {
                        row[d.name] = d.name + " " + chanceG.integer({ min: 1, max: 3 });
                    }
                });
                _.each(measures, (m) => {
                    row[m.name] = chanceG.floating({ min: 1000, max: 5000, fixed: 2 });
                    this.measureMetaData.push({ query: m.query, prefix: "", suffix: "", isPercent: false });
                });
                data.push(row);
            }
        }
        _.each(data, (d, ix) => { d["order"] = ix; });
        this.cleansedData = data;
        this.renderChart();
    };

    /**
     * Get Width and Height of the HTMLElement
     */
    protected getAreaInfo = (): { width: number, height: number } => {
        return { width: this._htmlElement.offsetWidth, height: this._htmlElement.offsetHeight };
    };

    /**
     * Get Selected Option for the widget if none provided use default value;
     */
    protected getOption(name: string) {
        let option = _.find(this._options, (o) => o.name === name);
        if (option != null) {
            return option.value;
        } else {
            let op = _.find(this.getMetaData().widgetOptions, (o) => o.name === name);
            return (op != null) ? op.default : null;
        }
    }

    protected numberFormat(data: number) {
        if (data == null) { return null; };
        return ( +data.toFixed(2) % 1 === 0) ? _s.numberFormat(data) : _s.numberFormat(data, 2);
    };


    showPanelTitle = (): boolean => {
        return this.getOption("Show Title");
    };

    /**
     * Get Minimum and Maximum value for a given Measures
     */
    protected getMinMax(measure: string, noModify?: boolean): { min: number, max: number } {
        let min = _.min(_.map(this.cleansedData, (cd) => cd[measure]));
        let max = _.max(_.map(this.cleansedData, (cd) => cd[measure]));
        if (noModify != null && noModify === true) return { min: min, max: max };
        return { min: min - (min * 0.2) , max: max + (max * 0.2) };
    }

    /**
     * Get Dimension Name for a given axis
     */
    protected getDimensionName(axis: string): string {
        let dimensions = this.getDimensionsAtLevel();
        let dimension = _.find(dimensions, (d) => d.axis === axis);
        if (dimension == null) { return null; };
        return dimension.name;
    }

    /**
     * Get Measure Name for a given axis
     */
    protected getMeasureName(axis: string): string {
        let measures = this.getMeasuresAtLevel();
        let measure = _.find(measures, (d) => d.axis === axis);
        if (measure == null) { return null; };
        return measure.name;
    }

    clearContent = (): void => {
        this._htmlElement.innerHTML = "";
    };

    protected gererateRandomId = (no: number) => {
        let text = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < no; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    };

    public GetDownloadData = () => {
        // Fisrt Check if there is a export Data if there that takes precedence over cleansed Data
        let dataToExport = [];
        if (this.cleansedData != null && this.cleansedData.length > 0) {
            dataToExport = this.cleansedData;
        }
        return dataToExport;
    };

    public GetDownloadImageData = () => {
        let imgdata = $(this._htmlElement).find("svg").get($(this._htmlElement).find("svg").length - 1).outerHTML;
        return imgdata;
    };
    public additionalStyleSheet: string = "";

    protected fontFamily = "'Open Sans'";
    protected fontSize = 10;

    public getOptions = (): IWidgetOptionWithValue[] => {
        let options = _.cloneDeep(this.getMetaData().widgetOptions) as IWidgetOptionWithValue[];
        _.each(options, (o) => {
            o.value = this.getOption(o.name);
        });
        return options;
    };

    public setOption = (optionName: string, value: any) => {
        let option = _.find(this._options, (o) => o.name === optionName);
        if (option == null) {
            return;
        }
        option.value = value;
        _.delay(() => this.renderChart(), 200);
    };

    public showContextMenu = (data: { name: string, value: number, highlight: boolean }[]) => {
        return;
        // this.OnShowContextMenu(data);
    };

}

export class ColorRegistry {
    public static colorPallete: string[] = _.union([
        "#6D5CAE", "#10CFBD", "#48B0F7", "#F8D053", "#F55753", "#3B4752",
        "#5B4D91", "#0DAD9E", "#3C93CE", "#CFAE45", "#CD4945", "#313B44",
        "#8A7DBE", "#40D9CA", "#6DC0F9", "#F9D975", "#F77975", "#626C75",
        "#413768", "#0A7C71", "#2B6A94", "#957D32", "#933432", "#232B31",
        "#AAB69B"
    ], (ColorsArray as any));

    private static staticDimensionMap: string[][] = [];
    private static dimensionMap: string[][] = [];
    private static unUsedColors: string[] = [];

    static SetColorRegistryInfo = (data: { dimensionName: string, dimensionItem: string, color: string }[]) => {
        ColorRegistry.staticDimensionMap = _.map(data, (d) => [d.dimensionItem, d.color]);
        let stored = localStorage.getItem("ColorRegistry");
        ColorRegistry.dimensionMap = (stored != null) ? JSON.parse(stored) : [];
        let usedColors = _.union(ColorRegistry.staticDimensionMap.map(m => m[1]), ColorRegistry.dimensionMap.map(m => m[1]));
        ColorRegistry.unUsedColors = ColorRegistry.colorPallete.filter(c => !_.includes(usedColors, c));
    };

    static getColor = (item: string): string => {
        // first see if its already part of either dimension
        let color = "";
        let found = _.find(_.union(ColorRegistry.staticDimensionMap, ColorRegistry.dimensionMap), (d) => d[0] === item);
        if (found != null) {
            color = found[1];
        } else {
            color = ColorRegistry.unUsedColors[0];
            ColorRegistry.dimensionMap.push([item, color]);
            ColorRegistry.unUsedColors.splice(0, 1);
            ColorRegistry.debouncedSaveDimensionMap();
        }
        return color;
    };

    static saveDimensionMapToStorage = () => {
        localStorage.setItem("ColorRegistry", JSON.stringify(ColorRegistry.dimensionMap));
    };

    static debouncedSaveDimensionMap = _.debounce(ColorRegistry.saveDimensionMapToStorage, 1000);
}

export class TransparentComponent extends React.Component<{ children?: any, pre?: () => void, post?: () => void }, {}> {
    componentWillMount() {
        if (this.props.pre != null) {
            this.props.pre();
        }
    };

    componentDidMount() {
       if (this.props.post != null) {
           this.props.post();
       }
    };

    render() {
        return this.props.children;
    }
}


export class AutoSizeText extends React.Component<{children?: any, fontRatio?: number}, {}> {
    settings = {
         maximum   : 9999,
         minimum   : 1,
         maxFont   : 9999,
         minFont   : 1,
         fontRatio : 10
    };

    componentDidMount() {
        let settings: any = _.extend(this.settings, this.props);
        let elw = (ReactDOM.findDOMNode(this.refs["content"]) as HTMLElement).offsetWidth,
            width = elw > settings.maximum ? settings.maximum : elw < settings.minimum ? settings.minimum : elw,
            fontBase = width / settings.fontRatio,
            fontSize = fontBase > settings.maxFont ? settings.maxFont : fontBase < settings.minFont ? settings.minFont : fontBase,
            elh = (ReactDOM.findDOMNode(this.refs["content"]) as HTMLElement).offsetHeight;
        $(ReactDOM.findDOMNode(this.refs["content"]) as HTMLElement).css("font-size", fontSize + "px").css("line-height", elh + "px");
    };

    render() {
        return React.createElement("div", {ref : "content", style: { "width": "100%", height: "100%", "padding": "5px"}}, this.props.children);
    }
}