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
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as _ from "lodash";
import { BaseComponent } from "./baseComponent";
import { RadioList } from "./formComponents";
import * as _s from "underscore.string";
import { DateRangeInterval, DateHelpers  } from "./../helpers/dateHelpers";

interface IDateRangePickerProps {
    mode: DateRangeInterval;
    beginDate: Date;
    endDate: Date;
    progression?: number;
    ref?: string;
    onChange(mode: DateRangeInterval, progression: number, beginDate: Date, endDate: Date, displayText: string, queryDates: string[]): void;
    applySelection(): void;
    positionClass: string;
}
interface IDateRangePickerState {
    visible: boolean;
}

export class DateRangePicker extends BaseComponent<IDateRangePickerProps, IDateRangePickerState> {
    static displayName = "DateRangePicker";
    private dateRanges = [{ id: 101, name: this.gs("ThisWeek") },
        { id: 102, name: this.gs("Last2Weeks") },
        { id: 103, name: this.gs("Last4Weeks") },
        { id: 104, name: this.gs("LastWeek") },
        { id: 201, name: this.gs("ThisMonth") },
        { id: 202, name: this.gs("Last2Months") },
        { id: 203, name: this.gs("Last3Months") },
        { id: 204, name: this.gs("Last6Months") },
        { id: 205, name: this.gs("Last12Months") },
        { id: 301, name: this.gs("ThisQuarter") },
        { id: 302, name: this.gs("Last2Quarters") },
        { id: 401, name: this.gs("ThisYear") },
        { id: 402, name: this.gs("Last2Years") },
        { id: 999, name: this.gs("Custom") }];

    componentWillMount() {
        this.setState({ visible: false });
    };

    componentDidMount() {
        let calMode = (this.props.mode === DateRangeInterval.Years) ? 2 : (this.props.mode === DateRangeInterval.Quarters || this.props.mode === DateRangeInterval.Months || this.props.mode === DateRangeInterval.Custom) ? 1 : 0;
        $(ReactDOM.findDOMNode(this.refs["beginDate"])).datepicker({
            calendarWeeks: false,
            startView: calMode,
            minViewMode: calMode
        }).on("changeDate", _.partial(this.dataChangeHandler, "beginDate"));
        $(ReactDOM.findDOMNode(this.refs["endDate"])).datepicker({
            calendarWeeks: false,
            startView: calMode,
            minViewMode: calMode
        }).on("changeDate", _.partial(this.dataChangeHandler, "endDate"));
        $(ReactDOM.findDOMNode(this.refs["dataRageBackdrop"])).on("click", this.props.applySelection);
    }
    componentDidUpdate = (prevProps: IDateRangePickerProps, prevState) => {
        if (this.props.beginDate === prevProps.beginDate && this.props.endDate === prevProps.endDate && this.props.mode === prevProps.mode) { return; };
        if (this.props.mode !== prevProps.mode) {
            // Mode has Changed
            $(ReactDOM.findDOMNode(this.refs["beginDate"])).datepicker("remove");
            $(ReactDOM.findDOMNode(this.refs["endDate"])).datepicker("remove");
            let calMode = (this.props.mode === DateRangeInterval.Years) ? 2 : (this.props.mode === DateRangeInterval.Quarters || this.props.mode === DateRangeInterval.Months || this.props.mode === DateRangeInterval.Custom) ? 1 : 0;
            $(ReactDOM.findDOMNode(this.refs["beginDate"])).datepicker({
                calendarWeeks: false,
                startView: calMode,
                minViewMode: calMode,
                allowDeselection: false
            }).on("changeDate", _.partial(this.dataChangeHandler, "beginDate"));
            $(ReactDOM.findDOMNode(this.refs["endDate"])).datepicker({
                calendarWeeks: false,
                startView: calMode,
                minViewMode: calMode,
                allowDeselection: false
            }).on("changeDate", _.partial(this.dataChangeHandler, "endDate"));
        }
        $(ReactDOM.findDOMNode(this.refs["beginDate"])).datepicker("update", moment(moment(this.props.beginDate).format("YYYY-MM-DD")).toDate());
        $(ReactDOM.findDOMNode(this.refs["endDate"])).datepicker("update", moment(moment(this.props.endDate).format("YYYY-MM-DD")).toDate());
    };

    dataChangeHandler = (type: string, e: any) => {
        let mode = this.props.mode;
        if (mode === DateRangeInterval.Custom) {
            mode = DateRangeInterval.Months;
        }
        let startDate = new Date();
        let endDate = new Date();
        if (type === "beginDate") {
            startDate = e.date;
            endDate = (this.props.endDate == null) ? e.date : this.props.endDate;
        }
        if (type === "endDate") {
            startDate = (this.props.beginDate == null) ? e.date : this.props.beginDate;
            endDate = e.date;
        }
        if (moment(startDate).diff(moment(endDate)) > 0) {
            endDate = startDate;
        };
        switch (mode) {
            case DateRangeInterval.Years:
                startDate = moment(startDate).startOf("year").toDate();
                endDate = moment(endDate).endOf("year").toDate();
                break;
            case DateRangeInterval.Quarters:
                startDate = moment(startDate).startOf("quarter").toDate();
                endDate = moment(endDate).endOf("quarter").toDate();
                break;
            case DateRangeInterval.Months:
                startDate = moment(startDate).startOf("month").toDate();
                endDate = moment(endDate).endOf("month").toDate();
                break;
            case DateRangeInterval.Weeks:
                startDate = moment(startDate).startOf("week").toDate();
                endDate = moment(endDate).endOf("week").toDate();
                break;
            default:
                startDate = moment(startDate).toDate();
                endDate = moment(endDate).toDate();
        }
        let text = DateHelpers.selectedDateRange(mode, 999, startDate, endDate);
        let range = DateHelpers.getQueryDates(mode, 999, startDate, endDate);
        this.props.onChange(mode, 999, startDate, endDate, text, range);
    };

    componentWillUnmount() {
        $(ReactDOM.findDOMNode(this.refs["beginDate"])).off("changeDate");
        $(ReactDOM.findDOMNode(this.refs["endDate"])).off("changeDate");
    };

    showPicker = () => {
        this.setState({ visible: true });
    };

    hidePicker = () => {
        this.setState({ visible: false });

    };

    togglePicker = () => {
        if (this.state.visible) {
            this.raisePropChange();
            this.props.applySelection();
        } else {
            this.showPicker();
        }
    };

    protected raisePropChange = () => {
        let text = DateHelpers.selectedDateRange(this.props.mode, this.props.progression, this.props.beginDate, this.props.endDate);
        let range = DateHelpers.getQueryDates(this.props.mode, this.props.progression, this.props.beginDate, this.props.endDate);
        this.props.onChange(this.props.mode, this.props.progression, this.props.beginDate, this.props.endDate, text, range);
    };

    modeChange = (data: string) => {
        let val = parseInt(data, 10) as DateRangeInterval;
        let startDate = new Date();
        let endDate = new Date();
        switch (val) {
            case DateRangeInterval.Years:
                startDate = moment().startOf("year").toDate();
                endDate = moment().endOf("year").toDate();
                break;
            case DateRangeInterval.Quarters:
                startDate = moment().startOf("quarter").toDate();
                endDate = moment().endOf("quarter").toDate();
                break;
            case DateRangeInterval.Months:
                startDate = moment().startOf("month").toDate();
                endDate = moment().endOf("month").toDate();
                break;
            case DateRangeInterval.Weeks:
                startDate = moment().startOf("week").toDate();
                endDate = moment().endOf("week").toDate();
                break;
            case DateRangeInterval.Days:
                startDate = moment().toDate();
                endDate = moment().toDate();
                break;
           default:
                startDate = moment().toDate();
                endDate = moment().toDate();
        }
        if (this.props.onChange != null) {
            let text = DateHelpers.selectedDateRange(val, 999, startDate, endDate);
            let range = DateHelpers.getQueryDates(val, 999, startDate, endDate);
            this.props.onChange(val, 999, startDate, endDate, text, range);
        };
    };

    setProgression = (progression: number) => {
        let res = DateHelpers.getStartEndDate(progression);
        let mode = res.mode, startDate = res.startDate, endDate = res.endDate;
        let text = DateHelpers.selectedDateRange(mode, progression, startDate, endDate);
        let range = DateHelpers.getQueryDates(mode, progression, startDate, endDate);
        if (progression !== 999) {
            this.updateStateImmutable({ visible: false });
            this.props.onChange(mode, progression, startDate, endDate, text, range);
            this.props.applySelection();
        }
        if (progression === 999) {
            this.props.onChange(mode, progression, startDate, endDate, text, range);
        }
    };
    customDateDOM = () => {
        return _.map(this.dateRanges, (m, ix) => {
            return <li key={"drpl" + ix} className={(this.props.progression === m.id) ? "bg-primary" : ""} onClick={_.partial(this.setProgression, m.id) }>{m.name}</li>;
        });
    };


    render() {
        return <div>
        <div className={"dataRageBackdrop " + ((!this.state.visible) ? "hidden" : "") } ref="dataRageBackdrop">&nbsp; </div>
        <div className={"dateRangePicker row " + this.props.positionClass + ((!this.state.visible) ? " hidden" : "") } style={{ zIndex: 500 }}>
                    <div className="col-md-9">
                        <div className="col-md-12">
                            <RadioList options={[
                                { caption: this.gs("Years"), value: "4" },
                                { caption: this.gs("Quarters"), value: "3" },
                                { caption: this.gs("Months"), value: "2" },
                                { caption: this.gs("Weeks"), value: "1" },
                                { caption: this.gs("Days"), value: "0" }
                            ]} value={this.props.mode.toString() } paddingRight="5px" onChange={this.modeChange} />
                            </div>
                         <div className="col-md-12">
                            <div className="input-group">
                            <input type="text" className="form-control" ref="textFromDate" readOnly={true} value={DateHelpers.getDisplayDate(this.props.mode, this.props.beginDate) } />
                            <span className="input-group-addon">{this.gs("To") }</span>
                            <input type="text" className="form-control"  ref="textFromDate" readOnly={true}  value={DateHelpers.getDisplayDate(this.props.mode, this.props.endDate) } />
                                </div>
                             </div>
                         <div className="col-md-6" style={{ padding: 0 }}>
                            <div ref="beginDate">
                                </div>
                             </div>
                         <div className="col-md-6" style={{ padding: 0 }}>
                            <div ref="endDate">
                                </div>
                             </div>
                        </div>
                     <div className="col-md-3" style={{ cursor: "pointer", padding: 0 }} >
                        <ul>
                            {this.customDateDOM() }
                            </ul>
                         </div>
            </div>
            </div>;
    };
}