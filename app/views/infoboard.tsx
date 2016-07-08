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
import * as React from "react";
import * as ReactDOM from "react-dom";
import { BaseComponent } from "./../components/baseComponent";
import { ApplicationView, IApplicationViewBaseState } from "./applicationView";
import { PageContainer } from "./../components/pageContainer";
import { ModalDialog, ModalContent, ModalDialogSize} from "./../components/modalDialogs";
import { Form, TextBox, DropDown, Button, RadioList} from "./../components/formComponents";
import { DataTable, ColumnType } from "./../components/dataTable";
import { DateRangePicker } from "./../components/dateRangePicker";
import { DateRangeInterval, DateHelpers, DateRanges  } from "./../helpers/dateHelpers";
import * as _s from "underscore.string";
import * as _ from "lodash";
import { Urls } from "./../data/constants";
import { InfoboardStore } from "./../data/dataStore";
import { Widget, Infoboard, InfoboardItem, Measure, Dimension, DataSource, User } from "./../data/models";
import { WidgetDesigner } from "./../components/widgetDesigner";
import { WidgetSelector } from "./../components/widgetSelector";
import {WidgetView} from "./../components/widget";
import { FilterMenu } from "./../components/filterMenu";
import * as RGL from "react-grid-layout";
import { CanAccess } from "./../components/canAccess";
import IconMenu from "material-ui/lib/menus/icon-menu";
import MenuItem from "material-ui/lib/menus/menu-item";
import IconButton from "material-ui/lib/icon-button";
import Divider from "material-ui/lib/divider";
import FontIcon from "material-ui/lib/font-icon";
import { ColorRegistry } from "../charts/base";
let ResponsiveGridLayout = RGL.Responsive;


interface IInfoboardState extends IApplicationViewBaseState {
    boardItems: InfoboardItem[];
    boardName: string;
    selectedDateRange: string;
    selectedDateRangeData: string[];
    measures: Measure[];
    dimensions: Dimension[];
    dateRange: {
        mode: DateRangeInterval,
        beginDate: Date,
        endDate: Date,
        progression: number;
    };
    widgets: Widget[];
    boardFilters: { dimension: Dimension, items: string[] }[];
    boardSlicer: {dimension: Dimension}[];
    undoStates: {
        dateRange: { mode: DateRangeInterval, beginDate: Date, endDate: Date, progression: number; },
        boardFilters: { dimension: Dimension, items: string[] }[],
        selectedDateRange: string;
        selectedDateRangeData: string[],
        widgetLevels: { itemId: number, level: number }[],
    }[];
    redoStates: {
        dateRange: { mode: DateRangeInterval, beginDate: Date, endDate: Date, progression: number; },
        boardFilters: { dimension: Dimension, items: string[] }[],
        selectedDateRange: string;
        selectedDateRangeData: string[],
        widgetLevels: { itemId: number, level: number }[]
    }[];
    widgetLevels: { itemId: number, level: number, drillHistory: {query: string, item: string}[][] }[];
    dateRangeChangePending: boolean;
    filterChangePending: boolean;
    shortCodeWidgetId: number;
    shortCodeDateRange: number;
    shortCodeLink: string;
    dataSources: DataSource[];
    users: User[];
    widgetCreationName?: string;
    layouts?: string;
}

export class InfoboardView extends ApplicationView<{ params: { id: number} }, IInfoboardState> {
   static displayName = "Infoboard";
   Module = "Infoboards";
   View = "Infoboard";
   constructor() {
        super();
        this.loadLanguage("infoboard");
        this.state = {
            boardName: "",
            boardItems: [],
            measures: [],
            dimensions: [],
            loading: true,
            selectedDateRange: "",
            selectedDateRangeData: [],
            dateRange: {
                mode: DateRangeInterval.Custom,
                beginDate: null,
                endDate: null,
                progression: 201
            },
            widgets: [],
            boardFilters: [],
            boardSlicer: [],
            undoStates: [],
            redoStates: [],
            widgetLevels: [],
            helpSteps: [],
            dateRangeChangePending: false,
            filterChangePending: false,
            shortCodeWidgetId: null,
            shortCodeDateRange: null,
            shortCodeLink: null,
            dataSources: [],
            users: [],
            widgetCreationName : null,
            layouts: null
        };
    }

    private _dataStore = new InfoboardStore();
    componentWillMount() {
        this._dataStore.GetWidgets().then((results) => {
            this.updateStateImmutable({ widgets: results.data });
        });
        this._dataStore.GetDataSources().then((results) => {
            this.updateStateImmutable({ dataSources: results.data });
            this.loadInfoboard(this.props.params.id);
            window.addEventListener("resize", this.widowResizeHandler);
        });
        this._dataStore.GetUsers().then((results) => {
            this.updateStateImmutable({ users: results.data });
        });
    };
    componentWillReceiveProps = (nextProps) => {
        if (nextProps.params == null || nextProps.params.id == null) { return; };
        this.loadInfoboard(nextProps.params.id);
    };

    loadInfoboard = (id) => {
        this._dataStore.GetColorPalette().then((results) => {
            ColorRegistry.SetColorRegistryInfo(results.data);
        });
        this._dataStore.GetInfoboard(id).then((results) => {
            if (results.data == null) {
                return;
            }
            let sortedItems = _.sortBy(_.sortBy(results.data.items, (i) => i.x), (i) => i.y);
            this.updateStateImmutable({
                boardName: results.data.name,
                layouts: results.data.layouts,
                boardItems: sortedItems,
                widgetLevels: _.map(results.data.items, (i) => { return { itemId: i.id, level: 0}; }),
                measures: results.data.measures,
                dimensions: results.data.dimensions,
                loading: false
            });
            let defaultOptions = JSON.parse(results.data.options);
            let startDate: Date, endDate: Date;
            if (defaultOptions.dateRange.progression !== 999) {
                let res = DateHelpers.getStartEndDate(defaultOptions.dateRange.progression);
                startDate = res.startDate;
                endDate = res.endDate;
                defaultOptions.dateRange.beginDate = startDate;
                defaultOptions.dateRange.endDate = endDate;
            }else {
                startDate = defaultOptions.dateRange.beginDate;
                endDate = defaultOptions.dateRange.endDate;
            }
            let selectedDateRange = DateHelpers.selectedDateRange(defaultOptions.dateRange.mode, defaultOptions.dateRange.progression, startDate, endDate);
            let rangeValues = DateHelpers.getQueryDates(defaultOptions.dateRange.mode, defaultOptions.dateRange.progression, startDate, endDate);
            let filters = (defaultOptions.filters == null) ? [] : defaultOptions.filters;
            this.updateStateImmutable({
                dateRange: defaultOptions.dateRange,
                selectedDateRange: selectedDateRange,
                selectedDateRangeData: rangeValues,
                boardFilters: filters,
            });
            this.reloadInfoboard(false, true);
        });
     };

    componentWillUnmount() {
        window.removeEventListener("resize", this.widowResizeHandler);
    };

    reloadInfoboard = (saveState: boolean, createUndoState: boolean) => {
        (this.refs["dateRangePicker"] as DateRangePicker).hidePicker();
        if (createUndoState) {
            this.undoCreateState();
        }
        if (saveState) {
            this.saveInfoboardState();
        }
        this.updateStateImmutable({dateRangeChangePending: false, filterChangePending: false });
        let filters = _.map(this.state.boardFilters, (bf) => {
                return { name : bf.dimension.query, operator: "Exactly", items: bf.items };
        });
        _.each(this.getWidgetsOnBoard(), (widget) => {
            let levelForWidget = _.find(this.state.widgetLevels, (l) => l.itemId === widget.props.containerRef).level;
            widget.loadData(levelForWidget, filters, this.state.selectedDateRangeData, this.state.dateRange.mode, this.state.dateRange.progression, this.state.dateRange.beginDate, this.state.dateRange.endDate);
        });
    };


    saveInfoboardState = () => {
        let info = {
            schema: 2,
            dateRange: {
                mode: this.state.dateRange.mode,
                beginDate: (this.state.dateRange.progression === 999) ? moment(this.state.dateRange.beginDate).format("YYYY-MM-DD") : null,
                endDate: (this.state.dateRange.progression === 999) ? moment(this.state.dateRange.endDate).format("YYYY-MM-DD") : null,
                progression: this.state.dateRange.progression
            },
            filters: this.state.boardFilters,
        };
        this._dataStore.UpdateInfoboard(this.props.params.id, { name: this.state.boardName, options: JSON.stringify(info) });
    };


    showDateRange = () => {
        (this.refs["dateRangePicker"] as DateRangePicker).togglePicker();
    };

    dateRangeChange = (mode: DateRangeInterval, progression: number, beginDate: Date, endDate: Date, displayContent: string, range: string[]) => {
        let newDateRange = {
                mode: mode,
                beginDate: beginDate,
                endDate: endDate,
                progression: progression
            };
        if (_.isEqual(this.state.dateRange, newDateRange)) {
            return;
        }
        this.updateStateImmutable({
            dateRange: newDateRange,
            selectedDateRange: displayContent,
            selectedDateRangeData: range,
            dateRangeChangePending: true,
        });
    };

    applyDateRange = () => {
        (this.refs["dateRangePicker"] as DateRangePicker).hidePicker();
        if (this.state.dateRangeChangePending) {
            this.reloadInfoboard(true, true);
        }
    };

    showAddWizard = (mode) => {
        (this.refs["modalAdd"] as ModalDialog).showDialog();
        _.delay(() => (this.refs["widgetSelector"] as WidgetSelector).setMode(mode), 250);
    };

    widgetSeletected = (type: string, id: number, defaultWidth: number, defaultHeight: number) => {
        (this.refs["modalAdd"] as ModalDialog).hideDialog();
        (this.refs["modalCreate"] as ModalDialog).hideDialog();
        this._dataStore.GetWidgets().then((results) => {
            this.updateStateImmutable({ widgets: results.data });
        });
        this._dataStore.AddWidgetToBoard(this.props.params.id, { widgetId: id, w: defaultWidth, h: defaultHeight, x: 10, y: 10 }).then((results) => {
            let boardItems = _.clone(this.state.boardItems);
            let widgetLevels = _.clone(this.state.widgetLevels);
            let ogLayouts = _.clone(this.state.layouts);
            let ogLayoutsObject: { lg?: any[], md?: any[], sm?: any[] } = { lg: [], md: [], sm: [] };
            if (!_s.isBlank(ogLayouts)) {
                ogLayoutsObject = JSON.parse(ogLayouts);
            }
            if (ogLayoutsObject.lg != null) {
                ogLayoutsObject.lg.push({ x: 0, y : 0, i: results.data.id.toString(), w: defaultWidth, h: defaultHeight, minW : 2, minH : 2 });
            }
            if (ogLayoutsObject.md != null) {
                ogLayoutsObject.md.push({ x: 0, y : 0, i: results.data.id.toString(), w: defaultWidth, h: defaultHeight, minW : 2, minH : 2 });
            }
            if (ogLayoutsObject.sm != null) {
                ogLayoutsObject.sm.push({ x: 0, y : 0, i: results.data.id.toString(), w: defaultWidth, h: defaultHeight, minW : 2, minH : 2 });
            }
            boardItems.push({ id: results.data.id, widgetId: results.data.widgetId, w: defaultWidth, h: defaultHeight, x: 10, y: 10, autoPosition: true });
            widgetLevels.push({ itemId: results.data.id, level: 0, drillHistory: [] });
            this.updateStateImmutable({ widgetLevels: widgetLevels, boardItems: boardItems, layouts: JSON.stringify(ogLayoutsObject) });
            let filters = _.map(this.state.boardFilters, (bf) => {
                return { name: bf.dimension.query, operator: "Exactly", items: bf.items };
            });
            let widgets = _.filter(this.getWidgetsOnBoard(), (w) => w.props.id === results.data.widgetId);
            _.each(widgets, (widget) => {
                widget.loadData(0, filters, this.state.selectedDateRangeData, this.state.dateRange.mode, this.state.dateRange.progression, this.state.dateRange.beginDate, this.state.dateRange.endDate);
            });
        });
    };

    onWidgetDrill = (itemId: number, newLevel: number, info: { query: string, item: string }[]) => {
        this.undoCreateState();
        let widgetLevels = _.clone(this.state.widgetLevels);
        let currentWidget = _.find(widgetLevels, (i) => i.itemId === itemId);
        let filters = _.clone(this.state.boardFilters);
        if (newLevel > currentWidget.level) {
            // Drill in to the widget
            _.each(info, (i) => {
                let dimension = _.find(this.state.dimensions, (dim) => dim.query === i.query);
                if (dimension == null) { return; };
                let existingFilter = _.find(filters, (f) => f.dimension.query === i.query);
                if (existingFilter == null) {
                    filters.push({ dimension: dimension, items: [i.item] });
                } else {
                    existingFilter.items = _.uniq(_.flatten(_.union(existingFilter.items, [i.item])));
                }
            });
            if (currentWidget.drillHistory == null) { currentWidget.drillHistory = []; };
            currentWidget.drillHistory.push(info);
        } else {
            // Drill out of Widget
            let lastDrillInfo = _.last(currentWidget.drillHistory);
            _.each(lastDrillInfo, (ld) => {
                let existingFilter = _.find(filters, (f) => f.dimension.query === ld.query);
                if (existingFilter == null) { return; }
                existingFilter.items = _.filter(existingFilter.items, (i) => i !== ld.item);
            });
            filters = _.filter(filters, (f) => f.items.length > 0);
            currentWidget.drillHistory = _.slice(currentWidget.drillHistory, 0, currentWidget.drillHistory.length - 1);
        }
        currentWidget.level = newLevel;
        this.updateStateImmutable({ boardFilters: filters, widgetLevels: widgetLevels });
        _.delay(() => { this.reloadInfoboard(true, false); } , 250);
    };

    addFilter = (dim: Dimension) => {
        let filters = this.state.boardFilters;
        let existing = _.find(filters, (f) => f.dimension.query === dim.query);
        if (existing != null) { return; };
        filters.push({ dimension: dim, items: []});
        this.updateStateImmutable({boardFilters: filters});
    };

    filterItemsDOM = () => {
        let menuItems = [];
        let grouped = _.groupBy(_.filter(this.state.dimensions, (d) => d.dataSourceId !== 0 && d.isDate === false) , (d) => d.dataSourceId);
        _.each(grouped, (items, g) => {
            let dataSource = _.find(this.state.dataSources, (d) => d.id === parseInt(g, 10));
            let subMenuItems = _.map(items, (item, ix2) => {
                return <MenuItem key={"ifsm" + g + ix2} primaryText={item.name} onTouchTap={() => { this.addFilter(item); }} />;
            });
            if (dataSource != null) {
                menuItems.push(<MenuItem key={"ifm" + g} primaryText={dataSource.name} leftIcon={<FontIcon className="fa fa-caret-right" />}  menuItems={subMenuItems}  />);
            }
        });
        // return _.map(_.filter(this.state.dimensions, (dim: Dimension) => dim.isDate === false), (dim: Dimension, ix) => {
            // return <MenuItem key={"ifm" + ix} eventKey={(ix + 1)} onSelect={_.partial(this.addFilter,dim)}>{dim.name}</MenuItem>;
        // });
        return menuItems;
    };

    removeFilter = (dim: Dimension) => {
       let filters = this.state.boardFilters;
       filters = _.filter(filters, (f) => f.dimension.query !== dim.query);
       this.updateStateImmutable({boardFilters: filters, filterChangePending: true });
       this.reloadInfoboard(true, true);
    };

    filterShow = (dim: Dimension) => {
       let filters = this.state.boardFilters;
       filters = _.filter(filters, (f) => f.dimension.query !== dim.query);
       _.each(filters, (f) => {
           (this.refs["bfel" + f.dimension.id] as FilterMenu).hidePanel();
       });
    };

    filterUpdate = (dim: Dimension, items: string[]) => {
        let filters = this.state.boardFilters;
        let filter = _.find(filters, (f) => f.dimension.query === dim.query);
        filter.items = items;
        this.updateStateImmutable({ boardFilters: filters, filterChangePending: true });
    };

    filterButtonsDOM = () => {
        return _.map(this.state.boardFilters, (bf, ix) => {
            return <FilterMenu key={"ifm" + ix} ref={"bfel" + bf.dimension.id} dimension={bf.dimension} dataStore={this._dataStore}
            selected={bf.items} showRemove={true} onRemove={this.removeFilter} onShow={this.filterShow} onChange={_.partial(this.filterUpdate,bf.dimension)} />;
        });
    };

    addSlicer = (dim: Dimension) => {
        this.state.boardSlicer = [];
        let slicer = this.state.boardSlicer;
        let existing = _.find(slicer, (s) => s.dimension.query === dim.query);
         if (existing != null) { return; };
         slicer.push({ dimension: dim });
         if (dim == null) {
             this.updateStateImmutable({ boardSlicer: [] });
         } else {
             this.updateStateImmutable({ boardSlicer: slicer });
         }
         _.each(this.getWidgetsOnBoard(), (widget) => {
            widget.setSliceDimension(dim);
        });
        this.reloadInfoboard(true, false);
    };

    slicerItems = () => {
        let menuItems = [];
        let groupedItems = _.groupBy(_.filter(this.state.dimensions, (d) => d.dataSourceId !== 0 && d.isDate === false), (d) => d.dataSourceId);
        _.each(groupedItems, (items, g) => {
            let dataSource = _.find(this.state.dataSources, (d) => d.id === parseInt(g, 10));
            let subMenuItems = _.map(items, (item, ix2) => {
                return <MenuItem key={"ifsm" + g + ix2} primaryText={item.name} onTouchTap={() => { this.addSlicer(item); } }/>;
            });
            if (dataSource != null) {
                menuItems.push(<MenuItem key={"ifm" + g} primaryText={dataSource.name} leftIcon={<FontIcon className="fa fa-caret-right" />}  menuItems={subMenuItems}  />);
            }
        });
        return menuItems;
    };

    slicerItemName = () => {
        let dim: Dimension = null;
        return _.map(this.state.boardSlicer, (bs, ix) => {
            if (bs.dimension.name === _.last(this.state.boardSlicer).dimension.name) {
                return <div key={"ifm" + ix} className="btn btn-default"  disabled={true} style={{ opacity: 1 }} ref="target" >
                    {bs.dimension.name} <button key={"ifm" + ix} className="fa fa-trash-o fabgnone" onClick= {_.partial(this.addSlicer, dim) } >
                    </button></div>;
            }
        });
    };

    removeWidget = (id: number) => {
        let boardItems = _.clone(this.state.boardItems);
        boardItems = _.filter(boardItems, (bi) => bi.id !== id);
        this.updateStateImmutable({ boardItems: boardItems });
        this._dataStore.RemoveWidgetFromBoard(this.props.params.id, id);
    };

    undoCreateState = () => {
        let undoStates = this.state.undoStates;
        undoStates.push({
            dateRange: this.state.dateRange,
            boardFilters: this.state.boardFilters,
            selectedDateRange: this.state.selectedDateRange,
            selectedDateRangeData: this.state.selectedDateRangeData,
            widgetLevels: this.state.widgetLevels
        });
        this.updateStateImmutable({ undoStates: undoStates, redoStates: [] });
    };

    undoClick = () => {
       let undoStates = this.state.undoStates;
       if (undoStates.length < 2) { return; };
       let currentState = _.last(undoStates);
       undoStates = _.slice(undoStates, 0 , undoStates.length - 1);
       let undoState = _.last(undoStates);
       let redoStates = this.state.redoStates;
       redoStates.push(currentState);
       this.updateStateImmutable({
           dateRange: undoState.dateRange,
           boardFilters: undoState.boardFilters,
           undoStates: undoStates,
           redoStates: redoStates,
           selectedDateRange: undoState.selectedDateRange,
           selectedDateRangeData: undoState.selectedDateRangeData,
           widgetLevels: undoState.widgetLevels,
        });
       this.reloadInfoboard(true, false);
    };

    redoClick = () => {
       let redoStates = this.state.redoStates;
       if (redoStates.length === 0) { return; };
       let currentState = _.last(redoStates);
       redoStates = _.slice(redoStates, 0 , redoStates.length - 1);
       let undoStates = this.state.undoStates;
       undoStates.push(currentState);
       this.updateStateImmutable({
           dateRange: currentState.dateRange,
           boardFilters: currentState.boardFilters,
           undoStates: undoStates,
           redoStates: redoStates,
           selectedDateRange: currentState.selectedDateRange,
           selectedDateRangeData: currentState.selectedDateRangeData,
           widgetLevels: currentState.widgetLevels,
       });
       this.reloadInfoboard(true, false);
    };

    getWidgetsOnBoard = (): WidgetView[] => {
        let refs = _.keys(this.refs);
        refs = _.filter(refs, (r) => _s.startsWith(r, "boardItem"));
        return _.map(refs, (r) => {
            return (this.refs[r] as WidgetView);
        });
    };

    shortCodeCopy = (widgetId) => {
        this.generateShortCodeLink(widgetId, 201);
        (this.refs["modalShare"] as ModalDialog).showDialog();
    };

    shortCodeRangeChange = (newValue: string) => {
        this.generateShortCodeLink(this.state.shortCodeWidgetId, parseInt(newValue, 10));
    };

    protected generateShortCodeLink = (widgetId: number, progression: number) => {
        let link = btoa(widgetId + "|" + progression);
        this.updateStateImmutable({shortCodeLink: Urls.domainUrl() + "charts/" + Urls.getTenant() + "/" + link, shortCodeDateRange: progression, shortCodeWidgetId: widgetId });
    };

    generateDOM() {
        return _.map(this.state.boardItems, (boardItem, ix) => {
            return <div key={boardItem.id}>
                    <WidgetView  ref={"boardItem" + boardItem.id} id={boardItem.widgetId} containerRef={boardItem.id}
                        onRemove={_.partial(this.removeWidget, boardItem.id) } onDrill={_.partial(this.onWidgetDrill, boardItem.id)}
                        onShare={_.partial(this.shortCodeCopy,boardItem.widgetId)}
                        />
                </div>;
        });
    };

    onLayoutChange = (layout: any[], layouts: { lg?: any[], md?: any[], sm?: any[]}) => {
        if (layout.length === 0) return;
        if (layout[0].w === 1 && layout[0].h === 1) {
            // this.updateStateImmutable({ boardItems: this.state.boardItems, layouts: this.state.layouts });
            return;
        }
        let ogLayouts = _.clone(this.state.layouts);
        let ogLayoutsObject: { lg?: any[], md?: any[], sm?: any[] } = {};
        if (!_s.isBlank(ogLayouts)) {
            ogLayoutsObject = JSON.parse(ogLayouts);
        }
        if (layouts.lg != null) {
            ogLayoutsObject.lg = layouts.lg;
        }
        if (layouts.md != null) {
            ogLayoutsObject.md = layouts.md;
        }
        if (layouts.sm != null) {
            ogLayoutsObject.sm = layouts.sm;
        }
        this._dataStore.UpdateInfoboardLayout(this.props.params.id, { layouts: JSON.stringify(ogLayoutsObject) }).then((res) => {
            // do nothing
        });
        let items = _.map(layout, (item) => { return { id: parseInt(item.i, 10), x: item.x, y: item.y, w: item.w, h: item.h }; });
        let boardItems = _.clone(this.state.boardItems);
        let changedItems: number[] = [];
        _.each(items, (item) => {
            let boardItem = _.find(boardItems, (b) => b.id === item.id);
            if (boardItem == null) return;
            if (boardItem.w !== item.w || boardItem.h !== item.h) {
                changedItems.push(boardItem.id);
            }
            boardItem = _.assign(boardItem, item) as any;
        });
        this.updateStateImmutable({ boardItems: boardItems, layouts: JSON.stringify(ogLayoutsObject) });
        this.debouncedRedrawWidgets(changedItems);
        this.debouncedSaveWidgetLayout();
    };

    saveWidgetLayout = () => {
        this._dataStore.UpdateInfoboardState(this.props.params.id, _.map(this.state.boardItems, (bi) => { return { id: bi.id, x: bi.x, y: bi.y, w: bi.w, h: bi.h };  })).then((results) => {
            // DO Nothing;
        });
    };

    redrawWidgets = (ids?: number[]) => {
        if (ids == null) {
            _.each(this.getWidgetsOnBoard(), (widget) => { widget.reRender(); });
        }else {
            _.each(this.getWidgetsOnBoard(), (widget) => {
                if (_.includes(ids, widget.props.containerRef)) {
                    widget.reRender();
                }
            });
        };
    };

    debouncedRedrawWidgets = _.debounce(this.redrawWidgets, 500);

    widowResizeHandler = (e) => {
        this.debouncedRedrawWidgets(null);
    };

    debouncedSaveWidgetLayout = _.debounce(this.saveWidgetLayout, 1000);

    goClick = () => {
        (this.refs["dateRangePicker"] as DateRangePicker).hidePicker();
        if (this.state.dateRangeChangePending || this.state.filterChangePending) {
            this.reloadInfoboard(true, true);
        }
    };

    widgetDeleted = (id) => {
        this.updateStateImmutable(
            { widgets : _.filter(this.state.widgets, (f) => f.id !== id),
              boardItems : _.filter(this.state.boardItems, (bi) => bi.widgetId !== id)
            });
    };
     widgetCreationSelected = (type: string, title: string) => {
        (this.refs["modalAdd"] as ModalDialog).hideDialog();
        (this.refs["modalCreate"] as ModalDialog).showDialog();
        this.setState({ widgetCreationName: title } as any);
        _.delay(() => {
            (this.refs["widgetDesigner"] as WidgetDesigner).resetState();
            (this.refs["widgetDesigner"] as WidgetDesigner).selectWidget(type);
        }, 500);
    };

    widgetShareToggled = (id) => {
        let widgets = _.cloneDeep(this.state.widgets);
        let widget = _.find(widgets, (w) => w.id === id);
        widget.isPublic = !widget.isPublic;
        this.updateStateImmutable({ widgets: widgets});
    };

    render() {
        let blankSetup = {};
        let layouts = _s.isBlank(this.state.layouts) ?  blankSetup : JSON.parse(this.state.layouts);
        return <PageContainer showBreadCrumb={false} loading={this.state.loading} onHelpClick={this.onHelpClick}>
            <ModalDialog title={this.s("CreateWidgetTitle") + " (" + this.state.widgetCreationName + ")" } size={ModalDialogSize.Full} ref="modalCreate"
                actions={null}>
                <ModalContent noPadding={true}>
                    <WidgetDesigner ref="widgetDesigner" widgets={this.state.widgets} widgetSelected={this.widgetSeletected} widgetDeleted={this.widgetDeleted} />
                </ModalContent>
            </ModalDialog>
            <ModalDialog title={this.s("AddWidgetTitle") } size={ModalDialogSize.Full} ref="modalAdd" actions={null}>
                <ModalContent noPadding={true}>
                    <WidgetSelector ref="widgetSelector" widgets={this.state.widgets} widgetSelected={this.widgetSeletected}
                        widgetDeleted={this.widgetDeleted} widgetShareToggled={this.widgetShareToggled} widgetCreationSelected={this.widgetCreationSelected} />
                </ModalContent>
            </ModalDialog>
            <ModalDialog title={this.s("ShareWidget") } size={ModalDialogSize.Medium} ref="modalShare" actions={null}>
                <ModalContent>
                    <Form ref="form">
                        <DropDown caption={this.s("DateRange") } value={this.state.shortCodeDateRange} options={_.filter(DateRanges, (d) => d.id !== 999) } optionsText="name" optionsValue="id" onChange={this.shortCodeRangeChange} />
                        <TextBox type="text" caption={this.s("ShortCode") } value={this.state.shortCodeLink}/>
                    </Form>
                </ModalContent>
            </ModalDialog>
            <div className="infoboardDiv">
            <h5 className="boardTitle">{this.state.boardName}</h5>
            <div className="header boardHeader bg-default hidden-xs">
                <div className="btn-toolbar pull-right" role="toolbar">
                    <div className="btn-group">
                        <CanAccess module={this.Module} view="Widget" action="Add">
                            <IconMenu desktop={true} className="btn-group" iconButtonElement={
                                <div className="btn btn-default hint--bottom" data-hint={this.s("AddWidget") }><i className="fa fa-plus"></i></div>
                            } anchorOrigin={{ horizontal: "right", vertical: "bottom" }} targetOrigin={{ horizontal: "right", vertical: "top" }}>
                                <MenuItem primaryText={this.s("AddExistingWidget") } onTouchTap={_.partial(this.showAddWizard, "Existing") } />
                                <MenuItem primaryText={this.s("CreateNewWidget") } onTouchTap={_.partial(this.showAddWizard, "Create") } />
                            </IconMenu>
                        </CanAccess>
                        <IconMenu desktop={true} closeOnItemTouchTap={false} className="btn-group" iconButtonElement={
                        <div className="btn btn-default hint--bottom" data-hint={this.s("AddFilter")}><i style={{color:"white"}} className="fa fa-filter"></i></div>
                    }
                        anchorOrigin={{ horizontal: "right", vertical: "bottom" }} targetOrigin={{ horizontal: "right", vertical: "top" }} >
                        {this.filterItemsDOM() }
                    </IconMenu>
                    <IconMenu desktop={true} closeOnItemTouchTap={false} className="btn-group" iconButtonElement={
                        <div className="btn btn-default hint--bottom" data-hint={this.s("AddSlicer")}><i style={{ color: "white" }} className="fa fa-bars"></i></div>
                    }
                        anchorOrigin={{ horizontal: "right", vertical: "bottom" }} targetOrigin={{ horizontal: "right", vertical: "top" }} >
                        {this.slicerItems() }
                    </IconMenu>
                    <Button type="button" style={{ width: "275px", textAlign: "center" }} className="btn btn-default" title={this.s("DateRange") } onClick={this.showDateRange} dataHelp="DateRange">
                            {this.state.selectedDateRange}<i className="fa fa-calendar pull-right" style={{ marginTop: "0.2em" }}></i>
                        </Button>
                        <Button type="button" className="btn btn-success fa fa-arrow-right" title={this.gs("Go") } onClick={this.goClick} dataHelp="Go">
                            <span>&nbsp; <i className="fa fa-refresh"></i></span>
                        </Button>
                    </div>
                </div>
                <div className="btn-toolbar filterToolbarContainer" role="toolbar" style={{ display: "inline-block" }}>
                    <div className="btn-group">
                        { (this.state.boardFilters.length > 0) ? (<div className="btn btn-default" style={{ opacity: 1 }} disabled={true}>{this.s("FilterdBy") + ":"}</div>) : "" }
                        {this.filterButtonsDOM() }
                    </div>
                </div>
                <div className="btn-toolbar filterToolbarContainer" role="toolbar" style={{ display: "inline-block" }}>
                    <div className="btn-group slicerDiv">
                        { (this.state.boardSlicer.length > 0) ? (<div className="btn btn-default" style={{ opacity: 1 }} disabled={true}>{this.s("SlicedBy") + ":"}</div>) : "" }
                        {this.slicerItemName() }
                    </div>
                </div>
            </div>
            <DateRangePicker ref="dateRangePicker" mode={this.state.dateRange.mode} beginDate={this.state.dateRange.beginDate}
                endDate={this.state.dateRange.endDate} progression={this.state.dateRange.progression} onChange={this.dateRangeChange}
                applySelection={this.applyDateRange} positionClass="customDatePicker"  />
            <ResponsiveGridLayout rowHeight={100} onLayoutChange={this.onLayoutChange} draggableHandle=".moveHandle"
                layouts={layouts} breakpoints={{ lg: 1200, md: 996, sm: 768 }} cols={{ lg: 12, md: 10, sm: 6 }}>
                {this.generateDOM() }
            </ResponsiveGridLayout>
            {this.helperDOM() }
            <div className="footerLogo">
            </div>
            </div>
        </PageContainer>;
    }
}
