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
import {WidgetView} from "./widget";
import { BaseComponent } from "./baseComponent";
export interface IGridStackItemProps {
    key: any;
    w: number;
    h: number;
    x: number;
    y: number;
    id: number;
    autoPosition: boolean;
    widgetId: number;
    onRemove(id: number): void;
    onDrill(newLevel: number, info: { query: string, item: string }[]): void;
}
export interface IGridStackItemState {
}

export class GridStackItem extends BaseComponent<IGridStackItemProps, IGridStackItemState> {
    render() {
        return <div className="grid-stack-item-content"><WidgetView ref="widget" id={this.props.widgetId} containerRef={this.props.id} onRemove={_.partial(this.props.onRemove, this.props.id) } onDrill={this.props.onDrill}/></div>;
    }
};

export interface IGridStackProps {
    style?: React.CSSProperties;
    cellHeight: number;
    verticalMargin: number;
    children?: Array<GridStackItem>;
    onChange(data: { id: number, x: number, y: number, h: number, w: number }[]): void;
    draggableClass?: string;
    ref: string;
}

export interface IGridStackState {
    gridStack: any;
}

export class GridStack extends BaseComponent<IGridStackProps, IGridStackState> {
    constructor() {
        super();
    }

    componentDidMount() {
        if ((window as any).items == null) { (window as any).items = []; };
        let gridStack = $(ReactDOM.findDOMNode(this.refs["gridStackContainer"])).gridstack({
            cell_height: this.props.cellHeight,
            vertical_margin: this.props.verticalMargin,
            draggable: { handle: (this.props.draggableClass == null) ? ".grid-stack-item-content" : this.props.draggableClass, scroll: true, appendTo: "body" }
        }).data("gridstack");
        _.each(this.props.children, (item) => {
            this.addItemToGridStack(gridStack, item);
        });
        this.setState({ gridStack: gridStack });
        $(ReactDOM.findDOMNode(this.refs["gridStackContainer"])).on("change", (e, items) => {
            if (items == null || items.length === 0) { return; }
            if (this.props.onChange == null) { return; }
            let newState = _.map(items, (i: any) => {
                return { id: parseInt($(i.el).attr("id").replace("gsChild", "")), x: i.x, y: i.y, w: i.width, h: i.height };
            });
            this.props.onChange(newState);
        });
    };

    // debouncedOnChange = _.debounce(this.props.onChange, 250);

    componentWillUnmount = () => {
        (window as any).items = [];
        $(ReactDOM.findDOMNode(this.refs["gridStackContainer"])).off("change");
    };

    addItemToGridStack = (gridStack: any, item: GridStackItem): void => {
        let key = "gsChild" + item.props.id;
        gridStack.add_widget(
            "<div class=\"grid-stack-item\" id=\"{key}\"><div class=\"gscontainer\"></div></div>".replace("{key}", key),
            item.props.x, item.props.y,
            item.props.w, item.props.h, item.props.autoPosition);
        let instance = ReactDOM.render((item as any), $("#" + key).find(".gscontainer").get(0));
        (window as any).items.push(instance);
    };

    removeItemFromGridStack = (gridStack: any, item: GridStackItem) => {
        let key = "gsChild" + item.props.id;
        gridStack.remove_widget(document.getElementById(key));
        (window as any).items = _.filter((window as any).items, (i: any) => i.props.id !== item.props.id);
    };

    componentDidUpdate = (prevProps: IGridStackProps, prevState) => {
        let oldChildren = prevProps.children;
        let newChildren = this.props.children;
        let itemsToAdd = _.filter(newChildren, (nc) => !_.includes(_.map(oldChildren, (oc) => oc.props.id), nc.props.id));
        let gridStack = this.state.gridStack;
        _.each(itemsToAdd, (item) => {
            this.addItemToGridStack(gridStack, item);
        });
        let itemsToRemove = _.filter(oldChildren, (oc) => !_.includes(_.map(newChildren, (nc) => nc.props.id), oc.props.id));
        _.each(itemsToRemove, (item) => {
            this.removeItemFromGridStack(gridStack, item);
        });
    };

    getWidgets = (): WidgetView[] => {
        return _.map((window as any).items, (i: GridStackItem) => {
            return (i.refs["widget"] as WidgetView);
        });
    };

    reRender = () => {
        _.each((window as any).items, (i: GridStackItem) => {
            (i.refs["widget"] as WidgetView).reRender();
        });
    };
    render() {
        return <div className="grid-stack" style={this.props.style} ref="gridStackContainer"></div>;
    };
}