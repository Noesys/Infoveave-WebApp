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
import * as Constants from "./../data/constants";
import { ApplicationView, IApplicationViewBaseState} from "./applicationView";
import { PageContainer } from "./../components/pageContainer";
import { TabContainer, WizardContainer, TabPage } from "./../components/tabContainer";
import { ReportStore, QueryBuilderStore } from "./../data/dataStore";
import { Report, User, IWhereField } from "./../data/models";
import { ModalDialog, ModalContent, ModalDialogSize} from "./../components/modalDialogs";
import { Form, TextBox, DropDown, DropDown2, Button, FileInput, RadioList, CheckBox} from "./../components/formComponents";
import { DataTable, ColumnType } from "./../components/dataTable";
import * as _s from "underscore.string";
import * as _ from "lodash";
import Select from "react-select";
import { CanAccess } from "./../components/canAccess";
import { ReportScheduler, ParameterEditor } from "./../components/reportScheduler";
import TagsInput from "react-tagsinput";
import DateRangePicker  from "react-bootstrap-daterangepicker";

let SelectAsync: any = Select.Async;

interface IReports extends IApplicationViewBaseState {
    reports: Array<any>;
    queryReports: Array<any>;
    newReportName: string;
    newReportFileName: string;
    reportId: number;
    reportSendEmails: string[];
    reportParameters: IWhereField[];
    reportDataSourceId: number;
    reportSendType:  "report" | "dataReport";
    newReportDataReportId: number;
    newReportDataReportName: string;
}

export class ReportManager extends ApplicationView<{}, IReports> {
    Module = "Reports";
    constructor() {
        super();
        this.loadLanguage("reportManager");
        this.state = {
            reports : [],
            queryReports: [],
            reportId: 0,
            newReportName: null,
            newReportFileName: null,
            helpSteps: [],
            reportSendType : null,
            reportSendEmails: [],
            reportParameters: [],
            reportDataSourceId: null,
            newReportDataReportId: null,
            newReportDataReportName : null,
        };
    }

    private _reportStore = new ReportStore();
    private _queryBuilderStore = new QueryBuilderStore();

    componentWillMount() {
        this.reloadReports();
        this.reloadDataReports();
     };
    reloadDataReports= () => {
        this._queryBuilderStore.GetDataReports().then((result) => {this.updateStateImmutable({queryReports: result.data}); });
    };
    reloadReports  = () => {
        this._reportStore.GetReports().then((result) => { this.updateStateImmutable({reports: result.data}); });
    };
    addReportClick = () => {
        this.updateStateImmutable({ newReportName: null, newReportFileName : null, newReportDataReportName : null, newReportDataReportId : null });
        (this.refs["modalAdd"] as ModalDialog).showDialog();
       };
    addDataReportClick = () => {
        this.navigateTo("/queryBuilder");
    };
    uploadfile = () => {
        let input = (this.refs["fileInput"] as FileInput).Selectedfile();
        this._reportStore.FileUpload(this.state.reportId, input).then((result) => {
            this.updateStateImmutable({ newReportFileName: result.data.fileName, newReportDataReportId: result.data.reportId, newReportDataReportName: result.data.name });
            this.notify(Constants.ViewComponent.Report, "success", true, _s.sprintf(this.s("FileUpload")));
         }).catch((error) => {
            this.notify(Constants.ViewComponent.Report, "error", false, _s.sprintf(this.s("UploadError")));
        });
     };

    saveReportClick = () => {
        if (!(this.refs["addReportForm"] as any).isValid()) {
            return;
        }
        let reportData = {
            name: this.state.newReportName,
            fileName: this.state.newReportFileName,
            reportId: this.state.newReportDataReportId,
            scheduleReport: null,
            mailTo: null,
            type: null,
        } as Report;
        this._reportStore.AddReport(reportData).then((result) => {
            (this.refs["modalAdd"] as ModalDialog).hideDialog();
            this.notify(Constants.ViewComponent.Report, "success", true, _s.sprintf("%s Report" + this.gs("SavedSuccessfully"), result.data.name));
            this._reportStore.GetReports().then((res1) => {
                this.updateStateImmutable({ reports: res1.data, reportData: { name: null, filename: null } });
            });
        }).catch((err) => {
            (this.refs["modalAdd"] as ModalDialog).hideDialog();
            this.notify(Constants.ViewComponent.Report, "error", false, _s.sprintf(this.gs("ErrorSaving") + " %s", err));
        });
    };

  reportRowClickHandler = (action, row: Report) => {
        if (action === "MailReport") {
            this._authStore.GetUserInfo().then((user) => {
                 this.updateStateImmutable({ reportSendType: "report", reportId: row.id, reportParameters: (_.isArray(row.parameter) ? row.parameter : []), reportSendEmails: [user.email], reportDataSourceId: row.dataSourceId });
                (this.refs["modalsMail"] as ModalDialog).showDialog();
            });
       } else if (action === "ScheduleReport") {
          (this.refs["reportScheduler"] as ReportScheduler).showDialog("report", row.id, row.scheduleReport, _s.isBlank(row.mailTo) ? [] : row.mailTo.split(";"), row.parameter, row.scheduleParameter , row.dataSourceId);
       } else if (action === "Edit") {
           this.navigateTo("/reportEditor#" + row.id);
       } else if (action === "Delete") {
           bootbox.confirm({
               title: this.gs("AreYouSure"),
               message: _s.sprintf(this.s("DeleteMessage"), row.name),
               callback: (result) => {
                   if (!result) return;
                   this._reportStore.DeleteReport(row.id).then((res1) => {
                        this.reloadReports();
                        this.notify(Constants.ViewComponent.Report, "success", true, this.s("DeletedSuccessfully"));
                   }).catch((error) => {
                        this.notify(Constants.ViewComponent.Report, "error", false, _s.sprintf(this.s("DeleteError")));
                   }); }
                });
           }
        };

   sendReport = () => {
      if (this.state.reportSendEmails === []) return;
      let reportStore = null;
      if (this.state.reportSendType === "report") {
          reportStore = this._reportStore;
      }else {
          reportStore = this._queryBuilderStore;
          if (_.chain(this.state.reportParameters).map(m => m.expression).filter(e => e == null || e.length === 0).value().length > 0) {
            return;
          }
      }
      let parameters = _.cloneDeep(this.state.reportParameters);
      _.each(parameters, (p) => {
          if (p.field.type === "Date" && _.isArray(p.expression)) {
              p.expression = _.map(p.expression, (v: any) => v.format("YYYY-MM-DD"));
          }
      });
      reportStore.SendReport(this.state.reportId, { scheduleString: "", recipients: this.state.reportSendEmails, parameters: parameters }).then((results) => {
          (this.refs["modalsMail"] as ModalDialog).hideDialog();
           this.notify(Constants.ViewComponent.Report, "success", true, this.s("MailScheduled"));
      });
  };

  queryReportsRowClickHandler = (action, row: Report) => {
      if (action === "MailReport") {
          this._authStore.GetUserInfo().then((user) => {
              this.updateStateImmutable({ reportSendType: "dataReport", reportId: row.id, reportParameters: (_.isArray(row.parameter) ? row.parameter : []), reportSendEmails: [user.email], reportDataSourceId: row.dataSourceId });
              (this.refs["modalsMail"] as ModalDialog).showDialog();
          });
      } else if (action === "ScheduleReport") {
           (this.refs["reportScheduler"] as ReportScheduler).showDialog("dataReport", row.id, row.scheduleReport, _s.isBlank(row.mailTo) ? [] : row.mailTo.split(";"), row.parameter, row.scheduleParameter, row.dataSourceId);
      } else if (action === "Edit") {
          this.navigateTo("/reportEditor#" + row.id);
      } else if (action === "Delete") {
            bootbox.confirm({
                title: this.gs("AreYouSure"),
                message: _s.sprintf(this.s("DeleteMessage"), row.name),
                callback: (result) => {
                    if (result) {
                        this._queryBuilderStore.DeleteDataReport(row.id).then((res1) => {
                            this.notify(Constants.ViewComponent.Report, "success", true, this.s("DeletedSuccessfully"));
                            this.reloadDataReports();
                        }).catch((error) => {
                         this.notify(Constants.ViewComponent.Report, "error", false, _s.sprintf(this.s("DeleteError")));
                        });
                    }
                }});
      }
  };

  downloadReportClick = () => {
      let form: HTMLFormElement = document.createElement("form");
      form.method = "POST";
      form.target = "_new";
      form.action = Constants.Urls.baseUrl() + "/Report/" + Constants.Urls.getTenant() + "/" + this.state.reportId + "/Download";
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      (this.refs["modalDownload"] as ModalDialog).hideDialog();
  };
  onFieldChange = (model, fieldName, value) => {
      if (model === "state") {
          let newState = _.clone(this.state);
          newState[fieldName] = value;
          this.setState(newState);
          return;
      }
      _.set(model, fieldName, value);
  };


  sendDataReport = () => {
      // TODO: implement 
  };

  saveReportSchedule = () => {
      this.reloadReports();
      this.reloadDataReports();
  };


   toolbarDOM = (): any => {
       return (
           <div className="btn-group">
               <CanAccess module="Reports" view="DataReports" action="Add">
                   <button type="button" className="btn btn-primary" onClick={this.addDataReportClick} data-help ="QueryReports"  ><i className="fa fa-plus"><i className="fa fa-database"></i></i></button>
               </CanAccess>
           </div>
       );
   };

  scheduleRenderer = (row: Report) => {
      let cronString = row.scheduleReport;
      if (_s.isBlank(cronString)) return "";
      let data = cronString.split(" ").map(d => _s.trim(d));
      let minute: any = data[0];
      let hour: any = data[1];
      let dayOfMonth = data[2];
      let month = data[3];
      let dayOfWeek = data[4];
      let date = new Date();
      date.setUTCHours(hour, minute);
      let mintues = (date.getMinutes().toString().length === 2) ? date.getMinutes().toString() : "0" + date.getMinutes().toString();
      let timeString = `at ${date.getHours()}:${mintues}`;
      // if both day and month are specified 
      if (dayOfMonth !== "*" && month !== "*") {
          return `Today ${timeString}`;
      }
      // if every thing is * * * It is daily
      if (dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
          return `Every Day ${timeString}`;
      }
      // 1-5 is dayOfWeek is all weekDays
      if (dayOfMonth === "*" && month === "*" && dayOfWeek === "1-5") {
          return `Every Week Day ${timeString}`;
      }
      // Comma present is weekDays so use that
      if (dayOfMonth === "*" && month === "*" && _s.contains(dayOfWeek, ",")) {
          let days = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Firday", "Saturday", "Sunday"];
          return `Every ${dayOfWeek.split(",").map(d => days[parseInt(d,10)]).join(",")} ${timeString}`;
      }
      if (dayOfMonth !== "*" && month === "*" && dayOfWeek === "*") {
          return `Every ${dayOfMonth} of Month ${timeString}`;
      };
  };
  reportParameterUpdate = (field, values) => {
       let parameters = _.cloneDeep(this.state.reportParameters);
        let parameter = _.find(parameters, (p) => p.field.value === field.value);
        parameter.expression = values;
        this.updateStateImmutable({ reportParameters: parameters });
  };

   render() {
       return (<PageContainer showBreadCrumb={true} breadCrumbPath={[{ title: this.s("ReportManager"), link: "#" }]} toolbar={this.toolbarDOM() }  loading={this.state.loading}  onHelpClick={this.onHelpClick}>
            <ReportScheduler ref="reportScheduler" saveSchedule={this.saveReportSchedule} reportStore={this._reportStore} queryStore={this._queryBuilderStore} />
           <ModalDialog title= {this.s("MailReport") } size={ModalDialogSize.Large} ref="modalsMail"
               actions={<Button caption={this.s("Send") } type="button" onClick={this.sendReport} />}>
               <ModalContent>
                        <h5>{this.s("EnterEmails")}</h5>
                        <TagsInput value={this.state.reportSendEmails} onChange={_.partial(this.onFieldChange,"state","reportSendEmails")} onlyUnique={true}
                        validationRegex={/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/} />
                        { (this.state.reportParameters.length > 0) ? <h5>{this.s("Parameters")}</h5> : <div/> }
                        <ParameterEditor dataStore={this._queryBuilderStore} parameters={this.state.reportParameters} dataSourceId={this.state.reportDataSourceId} parameterUpdate={this.reportParameterUpdate}  />
               </ModalContent>
           </ModalDialog>
           <ModalDialog title= {this.s("NewReport") } size={ModalDialogSize.Large} ref="modalAdd"
               actions={<Button caption={this.gs("Save") } type="button" onClick={this.saveReportClick} />}>
               <ModalContent>
                   <Form ref="addReportForm">
                       <TextBox type="text" required={true} value={this.state.newReportName} caption={this.s("ReportName") }  onChange={_.partial(this.onFieldChange, "state", "newReportName") } />
                       <div>{ _s.isBlank(this.state.newReportDataReportName) ? "" : <h4>{this.s("Recognised")} : {this.state.newReportDataReportName}</h4> }</div>
                       <FileInput caption={this.s("SelectFile") } ref="fileInput" />
                       <Button caption={this.s("Process") } type="button" onClick={this.uploadfile}/>
                   </Form>
               </ModalContent>
           </ModalDialog>
           <ModalDialog title= {this.s("Download") } size={ModalDialogSize.Large} ref="modalDownload"
               actions= {<Button caption={this.s("Download") } type="button" dataHelp="DownloadReport" onClick={this.downloadReportClick} /> }>
               <ModalContent>
                    &nbsp;
               </ModalContent>
           </ModalDialog>
           <TabContainer>
               <TabPage caption={this.s("QueryReports") } visible ={this.canAccess(this.Module, "DataReports", "List") }>
                   <DataTable title="" data={this.state.queryReports} hasActions={true}
                       rowAction={this.queryReportsRowClickHandler} stopTableCreation={true}
                       actions={[
                           { caption: this.s("RunReport"), visible: this.canAccess(this.Module, "DataReports", "Run"), iconClass: "fa fa-envelope-o", action: "MailReport" },
                           { caption: this.s("Schedule"), visible: this.canAccess(this.Module, "DataReports", "Modify"), iconClass: "fa fa-calendar", action: "ScheduleReport" },
                           { caption: this.gs("Delete"), visible: this.canAccess(this.Module, "DataReports", "Delete"), iconClass: "fa-trash-o", action: "Delete" }]}
                       columns={[
                           { caption: this.s("Type"), type: ColumnType.String, name: "type" },
                           { caption: this.s("Name"), type: ColumnType.String, name: "name" },
                           { caption: this.s("CreatedBy"), type: ColumnType.String, name: "createdBy" },
                           { caption: this.s("CreatedOn"), type: ColumnType.RelativeDate, name: "createdOn" },
                           { caption: this.s("Schedule"), type: ColumnType.Renderer, name: "scheduleReport", render: this.scheduleRenderer },
                           { caption: this.s("MailTo"), type: ColumnType.String, name: "mailTo" }]} />,
               </TabPage>
           </TabContainer>
           {this.helperDOM() }
       </PageContainer>
       );
        };
}
