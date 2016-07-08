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
import * as _s  from "underscore.string";
import { BaseComponent } from "./baseComponent";
import * as Constants from "./../data/constants";
import { ChartFactory } from "./../charts/chartFactory";
import { WizardContainer, TabPage, TabContainer } from "./tabContainer";
import { BaseChart, IChartMetaData, DisplayPosition, WidgetOptionType, IChartConstructorData } from "./../charts/base";
import { Widget, DataSourceWithMeasuresDimensions, Measure, Dimension, } from "./../data/models";
import { GalleryView2, IGalleryItem } from "./galleryView";
import { CoreDataStore } from "./../data/dataStore";
import TimePicker from "material-ui/lib/time-picker/time-picker";
import { Form, TextBox, DropDown, DropDown2, Button, FileInput, RadioList, CheckBox} from "./../components/formComponents";
import { ModalDialog, ModalContent, ModalDialogSize} from "./../components/modalDialogs";
import Select from  "react-select";
import { ReportStore, QueryBuilderStore } from "./../data/dataStore";
import { ISelectField, IWhereField } from "./../data/models";
import DateRangePicker  from "react-bootstrap-daterangepicker";
import { DateRanges} from "./../helpers/dateHelpers";

interface IReportSchedulerProps {
    ref: any;
    saveSchedule?: () => void;
    reportStore: ReportStore;
    queryStore: QueryBuilderStore;
}

interface IReportSchedulerState {
    reportId: number;
    schedulePeriod: string;
    reportHour: Date;
    reportFqDaily: string;
    reportFqWeekDays: number[];
    reportFqDateOfMonth: string;
    appUsers: { label: string, value: string }[];
    selectedUsers: string [];
    reportParameters: IWhereField[];
    reportDataSourceId: number;
    reportType: "report" | "dataReport";
}

export class ReportScheduler extends BaseComponent<IReportSchedulerProps, IReportSchedulerState> {

    constructor() {
        super();
        this.state = {
            reportId : 0,
            reportHour: null,
            appUsers: [],
            schedulePeriod: "today",
            reportFqDaily: null,
            reportFqWeekDays: [],
            reportFqDateOfMonth: null,
            selectedUsers: [],
            reportParameters: [],
            reportDataSourceId : null,
            reportType: "report"
        };
    }

    componentWillMount() {
        this.props.reportStore.GetUsersEmails().then((results) => {
            let users = _.map(results.data, (d) => {
                return {
                    label: d,
                    value: d
                };
            });
            this.updateStateImmutable({ appUsers : users });
        });
    }

    static displayName = "ReportScheduler";

    showDialog = (reportType: "report" | "dataReport", reportId: number, cronString: string, recipients: string[], reportParameters: IWhereField[], scheduledParamters: IWhereField[], reportDataSourceId: number) => {
        (this.refs["modalSchedule"] as ModalDialog).showDialog();
        _.delay(() => {
            let params = (scheduledParamters.length > 0) ? scheduledParamters : (reportParameters.length > 0) ? reportParameters : [];
            this.updateStateImmutable({ reportType: reportType, reportId: reportId, selectedUsers: recipients, reportParameters: params, reportDataSourceId: reportDataSourceId });
            this.setStateFromString(cronString);
        }, 500);
    };

    hideDialog = () => {
        (this.refs["modalSchedule"] as ModalDialog).showDialog();
    };

    scheduleSave = () => {
        let schedule = this.stateToScheduleString();
        if (schedule == null) {
            bootbox.alert(this.s("PleaseSelectTime"));
            return;
        }
        if (this.state.selectedUsers.length === 0) {
            bootbox.alert(this.s("PleaseSelectUsers"));
            return;
        }
        if (this.props.saveSchedule != null) {
             if (_.chain(this.state.reportParameters).map(m => m.expression).filter(e => e == null || e.length === 0).value().length > 0) {
                    bootbox.alert(this.s("PleaseSelectAllParameters"));
                    return;
                };
                let parameters = _.cloneDeep(this.state.reportParameters);
                _.each(parameters, (p) => {
                    if (p.field.type === "Date") {
                        p.expression = _.map(p.expression, (v: any) => v.format("YYYY-MM-DD"));
                    }
                });
                let scheduleData = {
                    scheduleString: schedule,
                    recipients: this.state.selectedUsers,
                    parameters: parameters
                };
            if (this.state.reportType === "report") {
                this.props.reportStore.ScheduleReport(this.state.reportId, scheduleData).then((results) => {
                    (this.refs["modalSchedule"] as ModalDialog).hideDialog();
                    this.notify(Constants.ViewComponent.Report, "success", true, _s.sprintf(this.s("ScheduledSuccessfully")));
                    this.props.saveSchedule();
                });
            } else {
                this.props.queryStore.ScheduleReport(this.state.reportId, scheduleData).then((results) => {
                    (this.refs["modalSchedule"] as ModalDialog).hideDialog();
                    this.notify(Constants.ViewComponent.Report, "success", true, _s.sprintf(this.s("ScheduledSuccessfully")));
                    this.props.saveSchedule();
                });
            }
        }
    };

    onTimePickerChange = (err, value) => {
        this.updateStateImmutable({ reportHour: value });
        (this.refs["timePicker"] as any).setTime(value);
    };

    updateState = (key: string, value: any) => {
        let obj = {};
        obj[key] = value;
        this.updateStateImmutable(obj);
    };

    dailyEditorDom = () => {
        return (
            <div>
                <h5>Daily Options</h5>
                    <RadioList options={[
                        { caption: this.s("EveryDay"), value: "every" },
                        { caption: this.s("EveryWeekDay"), value: "everyWeekDay" }]}
                         onChange={_.partial(this.updateState, "reportFqDaily") }
                         value={this.state.reportFqDaily } />
            </div>
        );
    };

    weeklyDaysChanged = (key: number, checked: boolean) => {
        let fqw = _.clone(this.state.reportFqWeekDays);
        if (checked) {
            fqw.push(key);
        }else {
            fqw = fqw.filter(f => f !== key);
        }
        this.updateStateImmutable({ reportFqWeekDays : fqw });
    };

    weeklyEditorDom = () => {
        return (
            <div>
                <h5>Weekly Options</h5>
                <CheckBox caption={this.s("MonDay") } value={"1"} checked={_.includes(this.state.reportFqWeekDays, 1) }  onChange={_.partial(this.weeklyDaysChanged, 1) }/>
                <CheckBox caption={this.s("TuesDay") } value={"2"}  checked={_.includes(this.state.reportFqWeekDays, 2) } onChange={_.partial(this.weeklyDaysChanged, 2) } />
                <CheckBox caption={this.s("WednesDay") } value={"3"} checked={_.includes(this.state.reportFqWeekDays, 3) }  onChange={_.partial(this.weeklyDaysChanged, 3) } />
                <CheckBox caption={this.s("ThursDay") } value={"4"} checked={_.includes(this.state.reportFqWeekDays, 4) } onChange={_.partial(this.weeklyDaysChanged, 4) } />
                <CheckBox caption={this.s("FriDay") } value={"5"}  checked={_.includes(this.state.reportFqWeekDays, 5) } onChange={_.partial(this.weeklyDaysChanged, 5) } />
                <CheckBox caption={this.s("SaturDay") } value={"6"}checked={_.includes(this.state.reportFqWeekDays, 6) }  onChange={_.partial(this.weeklyDaysChanged, 6) } />
                <CheckBox caption={this.s("SunDay") } value={"7"} checked={_.includes(this.state.reportFqWeekDays, 7) } onChange={_.partial(this.weeklyDaysChanged, 7) }  />
            </div>
        );
    };
    monthlyEditorDom = () => {
        return (
            <div>
                <h5>Monthly Options</h5>
                <div className="col-md-4">
                    <TextBox caption={this.s("DateOfMonth") } required={true} type="number" value={this.state.reportFqDateOfMonth} minimum={1} maximum={31} onChange={_.partial(this.updateState, "reportFqDateOfMonth") } />
                </div>
            </div>
        );
    };

    schedulePeriodChange = (value) => {
        this.updateStateImmutable({schedulePeriod: value });
    };

    stateToScheduleString = () => {
        if (this.state.reportHour == null) return null;
        // lets take the time selected and convert it into UTC time
        let minute = (this.state.reportHour).getUTCMinutes();
        let hour = (this.state.reportHour).getUTCHours();

        let dayOfMonth = "";
        let month = "";
        let dayOfWeek = "";

        if (this.state.schedulePeriod === "today") {
           dayOfMonth = (this.state.reportHour).getUTCDate().toString();
           month = ((this.state.reportHour).getMonth() + 1).toString();
           dayOfWeek = "*";
        };
        if (this.state.schedulePeriod === "daily") {
            dayOfMonth = "*";
            month = "*";
            dayOfWeek = (this.state.reportFqDaily === "every") ? "*" : "1-5";
        }
        if (this.state.schedulePeriod === "weekly") {
            dayOfMonth = "*";
            month = "*";
            dayOfWeek = (this.state.reportFqWeekDays.length > 0 && this.state.reportFqWeekDays.length < 7) ? this.state.reportFqWeekDays.join(",") : "*";
        }
        if (this.state.schedulePeriod === "monthly") {
            dayOfMonth = (_s.isBlank(this.state.reportFqDateOfMonth)) ? "1" : "*";
            month = "*";
            dayOfWeek = "*";
        }
        return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
    };
    reportParameterUpdate = (field, values) => {
        let parameters = _.cloneDeep(this.state.reportParameters);
        let parameter = _.find(parameters, (p) => p.field.value === field.value);
        parameter.expression = values;
        this.updateStateImmutable({ reportParameters: parameters });
    };

    parametersDOM = () => {
        if (this.state.reportParameters.length === 0) return <div/>;
        return <div className="col-md-12">
            <h5>{this.s("Parameters")}</h5>
            <ParameterEditor dataSourceId={this.state.reportDataSourceId} parameters={this.state.reportParameters} dataStore={this.props.queryStore} parameterUpdate={this.reportParameterUpdate} />
            </div>;
    };

    setStateFromString = (cronString) => {
        if (_s.isBlank(cronString)) return;
        let data = cronString.split(" ").map(d => _s.trim(d));
        let minute = data[0];
        let hour = data[1];
        let dayOfMonth = data[2];
        let month = data[3];
        let dayOfWeek = data[4];
        let date = new Date();
        date.setUTCHours(hour, minute);
        // first lets read the the minute and hour 
        (this.refs["timePicker"] as any).setTime(date);
        // if both day and month are specified 
         if (dayOfMonth !== "*" && month !== "*") {
            this.updateStateImmutable({ reportHour: date, schedulePeriod: "today" });
            return;
         }
        // if every thing is * * * It is daily
        if (dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
            this.updateStateImmutable({ reportHour: date, schedulePeriod: "daily", reportFqDaily: "every" });
            return;
        }
        // 1-5 is dayOfWeek is all weekDays
        if (dayOfMonth === "*" && month === "*" && dayOfWeek === "1-5") {
            this.updateStateImmutable({ reportHour: date, schedulePeriod: "daily", reportFqDaily: "everyWeekDay" });
            return;
        }
        // Comma present is weekDays so use that
        if (dayOfMonth === "*" && month === "*" && _s.contains(dayOfWeek, ",")) {
            this.updateStateImmutable({ reportHour: date, schedulePeriod: "weekly", reportFqWeekDays: dayOfWeek.split(",").map(d => parseInt(d, 10)) });
            return;
        }
       if (dayOfMonth !== "*" && month === "*" &&  dayOfWeek === "*") {
            this.updateStateImmutable({ reportHour: date, schedulePeriod: "monthly", reportFqDateOfMonth: dayOfMonth });
            return;
        };
    };

    selectedUsersChange = (data: { label: string, value: string }[]) => {
        this.updateStateImmutable({ selectedUsers : _.map(data, (d) => d.value) });
    };

    render() {
        return <ModalDialog title= {this.s("ScheduleReport") } size={ModalDialogSize.Large} ref="modalSchedule"
            actions={<Button caption={this.gs("Save") } type="button" onClick={this.scheduleSave} />}>
            <ModalContent>
                <Form ref="form">
                    <div  >
                        <div className="col-md-5">
                            <TimePicker ref="timePicker" format="ampm" hintText="12hr Format" onChange={this.onTimePickerChange} />
                        </div>
                        <div className="col-md-12">
                            <RadioList options={[
                                { caption: this.s("Today"), value: "today" },
                                { caption: this.s("Daily"), value: "daily" },
                                { caption: this.s("Weekly"), value: "weekly" },
                                { caption: this.s("Monthly"), value: "monthly" }]
                            }  onChange={this.schedulePeriodChange} value={this.state.schedulePeriod} />
                            {(this.state.schedulePeriod === "daily") ? this.dailyEditorDom() : ""}
                            {(this.state.schedulePeriod === "weekly") ? this.weeklyEditorDom() : ""}
                            {(this.state.schedulePeriod === "monthly") ? this.monthlyEditorDom() : ""}
                        </div>
                        <div className="col-md-12">
                            <h5>{this.s("SendTo")}</h5>
                            <Select options={this.state.appUsers} value={this.state.selectedUsers} multi={true} onChange={_.partial(this.selectedUsersChange)} />
                        </div>
                        {(this.state.reportParameters.length > 0) ? this.parametersDOM() : <div/> }
                    </div>
                </Form>
            </ModalContent>
        </ModalDialog>;
    }
}

interface IParameterEditorProps {
     dataSourceId: number;
     parameters: IWhereField[];
     parameterUpdate(field, values): void;
     dataStore: QueryBuilderStore;
}

export class ParameterEditor extends React.Component<IParameterEditorProps, {}> {
    parameterUpdate = (field, values) => {
        this.props.parameterUpdate(field, values);
    };

    getItems = (dataSourceId: number, field: string, query: string): Promise<{ options: string[] }> => {
        return new Promise((resolve, reject) => {
            this.props.dataStore.GetFieldItems(dataSourceId, field, null, query).then((results) => {
                resolve({ options: _.map(results.data, (d) => { return { label: d, value: d }; }) });
            }).catch(() => {
                reject();
            });
        });
    };

    render() {
        return <div>{ _.map(this.props.parameters, (p, ix) => {
            if (p.field.type !== "Date") {
                return <div key={"ddpl" + ix}>
                    <DropDown2 required= {true} caption={p.field.label} multiple={true} useAjax={true}
                    value={_.find(this.props.parameters, (pm) => pm.field.value === p.field.value).expression}
                    ajaxMethod={_.partial(this.getItems, this.props.dataSourceId, p.field.value) }
                    onChange={_.partial(this.parameterUpdate, p.field) }/>
                    <br/>
                </div>;
            } else {
                let value = _.find(this.props.parameters, (pm) => pm.field.value === p.field.value).expression;
                let displayValue = (value == null || value.length !== 2) ? "" : (value[0].format("DD-MMM-YYYY") + " to " + value[1].format("DD-MMM-YYYY"));
                let props = {};
                let selectVal = null;
                if (value != null && _.isArray(value)) {
                    props["startDate"] = value[0];
                    props["endDate"] = value[1];
                }
                if (value != null && !_.isArray(value)) {
                    selectVal = value;
                }
                return <div key={"ddpl" + ix} className="form-group">
                    <div className="col-md-12">
                    <label>{p.field.label}</label>
                    </div>
                    <div className="col-md-5 hidden-sm hidden-xs">
                        <Select options={_.filter(DateRanges,d => d.id !== 999)} value={selectVal} labelKey="name" valueKey="id" onChange={(val) => { this.parameterUpdate(p.field, val.id);  }} />
                    </div>
                    <div className="col-md-1 hidden-sm hidden-xs">
                        or
                    </div>
                    <div className="col-md-6">
                        <DateRangePicker ranges={[]} {...props} onEvent={(event, picker) => {
                            let value = [picker.startDate, picker.endDate];
                            this.parameterUpdate(p.field, value);
                        } }>
                            <div className="input-group date">
                                <input type="text" className="form-control" value={displayValue} />
                                <span className="input-group-addon"><i className="fa fa-calendar"></i></span>
                            </div>
                        </DateRangePicker>
                    </div>
                    <br/>
                </div>;
            };
        }) }</div>;
    }
}