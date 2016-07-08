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
import { InfoboardStore } from "./../data/dataStore";
import { ApplicationView, IApplicationViewBaseState } from "../views/applicationView";
import * as _s from "underscore.string";
import * as _ from "lodash";
import { Widget, Infoboard, InfoboardItem, Measure, Dimension } from "./../data/models";
import Infinite from "react-infinite";
interface IFilterMenuProps {
    dataStore: InfoboardStore;
    dimension: Dimension;
    selected: string[];
    onRemove?(dimension: Dimension): void;
    onShow?(dimension: Dimension): void;
    showRemove: boolean;
    key: string;
    ref?: any;
    nonInfoboard?: boolean;
    onChange(values: string[]): void;
}
interface IFilterMenuState {
   availableItems: string[];
   searchText: string;
   panelStyle: React.CSSProperties;
   visible: boolean;
   itemsToDisplay: string[];
}

export class FilterMenu extends ApplicationView<IFilterMenuProps, IFilterMenuState> {
    static displayName = "FilterMenu";

    constructor() {
        super();
        this.state = { availableItems: [], panelStyle: { display: "none" }, searchText: null, itemsToDisplay: [], visible: false };
    };

    componentWillMount() {
        if (this.props.dimension.id === 0) { return; }
        this.props.dataStore.GetDimensionItems(this.props.dimension.dataSourceId, this.props.dimension.id, "").then((results) => {
            let items =  _.filter(_.map(results.data, (r) => _s.titleize(r)), (a) => a !== "All");
            this.updateStateImmutable({availableItems: items, itemsToDisplay: items});
        });
    };

    componentDidMount () {
        $(ReactDOM.findDOMNode(this.refs["filterBackdrop"])).on("click", this.hidePanel);
    };

    shouldComponentUpdate(nextProps: IFilterMenuProps, nextState: IFilterMenuState): boolean {
       //  return !(_.isEqual(this.props, nextProps) && _.isEqual(this.state, nextState));
       return  true;
    };

    toggleVisibility = () => {
        let parentNode = ReactDOM.findDOMNode(this.refs["target"]);
        let offset = $(parentNode).offset();
        let posY = offset.top - $(window).scrollTop();
        let posX = offset.left - $(window).scrollLeft();
        if (this.state.panelStyle.display === "none") {
            if (this.props.onShow != null) { this.props.onShow(this.props.dimension); }
            this.updateStateImmutable({visible: true, searchText: null, panelStyle: {display: "block", position: "absolute", width: "350px", top: 36, left: 5  }});
        }else {
            this.updateStateImmutable({visible: false, panelStyle: {display: "none"}});
        }
    };

    hidePanel = () => {
         this.updateStateImmutable({ visible: false, panelStyle: {display: "none"}});
    };

    textChange = () => {
       let value = (this.refs["search"] as HTMLInputElement).value;
       let items = this.state.availableItems;
       if (!_s.isBlank(value)) {
            items = _.filter(items, (i) => _s.contains(i.toLowerCase(), value.toLowerCase()));
        }
       this.updateStateImmutable({ searchText: value, itemsToDisplay: items });
    };

    debouncedTextChange = _.debounce(this.textChange, 500);

    toggleCheckAll = (e) => {
        if (this.state.searchText != null && this.state.searchText.length > 0) {
            if (e.target.checked) {
                this.props.onChange(this.state.itemsToDisplay);
            }else {
                this.props.onChange([]);
            }
        } else {
             if (e.target.checked) {
                this.props.onChange(this.state.availableItems);
            }else {
                this.props.onChange([]);
            }
        }
    };

    checkChange = (e) => {
        let items = this.props.selected;
        if (e.target.checked) {
            items.push(e.target.value);
            this.props.onChange(items);
        }else {
            items = _.filter(items, (i) => i !== e.target.value);
            this.props.onChange(items);
        }
    };

    itemsDOM = () => {
        return _.map(this.state.itemsToDisplay, (item, ix) => {
            let checked = (_.includes(this.props.selected, item));
            return <div key={"flcbk" + this.props.dimension.id + ix} className="checkbox check-success checkbox-circle">
                      <input type="checkbox" value={item} id={`flcb-${this.props.dimension.id}-${ix}`} checked={checked} onChange={this.checkChange} />
                      <label htmlFor={`flcb-${this.props.dimension.id}-${ix}`}>{item}</label>
                </div>;
        });
    };

    searchAreaDOM = () => {
        return <div><div className="input-group transparent">
                                <span className="input-group-addon">
                                        <i className="fa fa-search"></i>
                                    </span>
                                    <input type="text" ref="search" placeholder={this.gs("Search")} className="form-control"  onChange={this.debouncedTextChange} onBlur={this.debouncedTextChange} />
                            </div>
                            <div>
                            <br/>
                            <div className="checkbox check-success checkbox-circle">
                                    <input type="checkbox" value="checkAll" id={`flsacb-${this.props.dimension.id}`} onChange={this.toggleCheckAll} />
                                    <label htmlFor={`flsacb-${this.props.dimension.id}`}>{(_s.isBlank(this.state.searchText) ? this.gs("SelectAll") : this.gs("SelectFiltered"))}</label>
                                </div>
                            </div></div>;
    };

    itemsAreaDOM = () => {
        if (!this.state.visible) return <div/>;
        return <div className="panel-body filterContent scrollable" style={{minHeight:"300px", maxHeight:"300px"}}>
                <Infinite containerHeight={280} elementHeight={20}>
                            {this.itemsDOM()}
                 </Infinite>
                        </div>;
    };

    selectedDateFilterDOM = () => {
        if (this.props.dimension.id !== 0 || this.props.selected == null || this.props.selected.length === 0) {
            return;
        }
        let item = this.props.selected[0].split(".");
        let display = _.last(item).replace("[", "").replace("]", "");
        return <div className="panel-body"><span className="label">{display}</span></div>;
    };

    render() {
        let count = "All";
        if (this.state.availableItems.length > 0 && this.props.selected.length > 0 && this.props.selected.length < this.state.availableItems.length) {
            count = this.props.selected.length.toString();
        }

        return <div className={"dimension " + (this.props.nonInfoboard ? "m-t-5 m-l-5 m-b-5 m-r-5" : "") } style={{display: "inline-block"}} data-dimension={this.props.dimension.id}>
                <button className={"btn "  + (this.props.nonInfoboard ? "btn-default btn-sm" : "btn-noBorder")} ref="target" onClick={this.toggleVisibility}>
                    <span className="badge badge-info">{count}</span> {this.props.dimension.name}</button>
                <div className={"filter-backdrop " + ((!this.state.visible) ? "hidden" : "") } ref="filterBackdrop">&nbsp; </div>
                <div className="panel panel-default filterPanel" style={this.state.panelStyle}>
                        <div className="panel-heading p-t-10 seperator">
                        <div className="panel-title"><sup>{this.gs("ApplyFilter")}</sup><br/>{this.props.dimension.name}</div>
                        <div className="pull-right">
                            { (this.props.showRemove) ? <button className="btn btn-white hint--bottom" onClick={_.partial(this.props.onRemove,this.props.dimension)} data-hint={this.s("RemoveFilter")}>
                                <i className="fa fa-trash-o"></i></button> : "" }
                            <button className="btn btn-white hint--bottom" onClick={this.toggleVisibility} data-hint={this.gs("Close")}><i className="fa fa-times"></i></button>
                        </div>
                        <br/>
                            { (this.props.dimension.id !== 0) ? this.searchAreaDOM() : <div/> }
                         </div>
                        { (this.props.dimension.id !== 0) ? this.itemsAreaDOM() : this.selectedDateFilterDOM() }
                 </div>
           </div>;
    };
}
