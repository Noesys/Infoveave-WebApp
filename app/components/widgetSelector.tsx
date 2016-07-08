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
import { BaseComponent } from "./baseComponent";
import * as Constants from "./../data/constants";
import { ChartFactory } from "./../charts/chartFactory";
import { WizardContainer, TabPage, TabContainer } from "./tabContainer";
import { BaseChart, IChartMetaData, DisplayPosition, WidgetOptionType, IChartConstructorData } from "./../charts/base";
import { Widget, DataSourceWithMeasuresDimensions, Measure, Dimension, } from "./../data/models";
import { GalleryView2, IGalleryItem } from "./galleryView";
import { CoreDataStore } from "./../data/dataStore";

interface IWidgetSelectorProps {
    ref: any;
    widgets: Widget[];
    widgetSelected(widgetType: string, widgetId: number, defaultWidth: number, defaultHeight: number): void;
    widgetDeleted(id: number): void;
    widgetCreationSelected(type: string, title: string): void;
    widgetShareToggled(id: number): void;
}

interface IWidgetSelectorState {
    mode: "Existing" | "Create";
}

export class WidgetSelector extends BaseComponent<IWidgetSelectorProps, IWidgetSelectorState> {
    static displayName = "WidgetSelector";
    private _widgetStore: CoreDataStore = new CoreDataStore();

    constructor() {
        super();
        this.state = {
            mode: "Existing"
        };
    }
    deleteWidget = (id: number) => {
        this._widgetStore.DeleteWidget(id).then((results) => {
            this.notify(Constants.ViewComponent.Infoboard, "success", true, this.s("WidgetDeleted"));
            this.props.widgetDeleted(id);
        });
    };

    setMode = (mode: "Existing" | "Create") => {
        this.setState({mode: mode});
    };

    widgetSelected = (type: string, id: number, defaultWidth: number, defaultHeight: number) => {
        if (this.props.widgetSelected != null) {
            this.props.widgetSelected(type, id, defaultWidth, defaultHeight);
        }
    };
     toggleWidget = (id: number, isPublic: boolean) => {
          this._widgetStore.ToggleWidgetShare(id).then((results) => {
          this.notify(Constants.ViewComponent.Infoboard, "success", true, this.s((isPublic) ? "UnShareSuccssfully" : "SharedSuccssfully"));
          this.props.widgetShareToggled(id);
        });
    };
    getChartFamilies = () => {
        let cfs = [this.gs("Existing"), this.gs("SharedWidgets")];
        let uniq = _.uniq(_.map(ChartFactory.GetMetaData(), (m) => m.family));
        return (this.state.mode === "Existing") ? cfs : uniq;
    };

    getChartByType = (name: string) => {
        return _.find(ChartFactory.GetMetaData(), (m) => m.name === name);
    };

    getChartsByFamily = (chartFamily: string): IGalleryItem[] => {
        if (chartFamily === "Existing Widgets") {
            let charts = _.map(this.props.widgets, (w) => {
                let ch = this.getChartByType(w.type);
                if (ch == null) { return null; }
                let item = {
                    title: w.name,
                    smallDescription: "(" + ch.title + ")",
                    imagePreview: ch.preview,
                    actions: [
                    { text: <i className="fa fa-plus" />, action: () => { this.widgetSelected(w.type, w.id, ch.defaultWidth, ch.defaultHeight); } },
                    { text: <i className={"fa fa-share-alt " + ((w.isPublic === true) ? " btn-success" : "") } />, primary: (w.isPublic), action: () => { this.toggleWidget(w.id, w.isPublic); } },
                     ]
                } as IGalleryItem;
                if (!w.isPublic) item.actions.push( { text: <i className="fa fa-trash-o" />, action: () => { this.deleteWidget(w.id); } });
                return item;
             });
            return _.filter(charts, (c) => c != null);
        } else {
            let scharts = _.filter(ChartFactory.GetMetaData(), (m) => m.family === chartFamily);
            return _.map(scharts, (c) => {
                return {
                    title: c.title,
                    description: "",
                    imagePreview: c.preview,
                    actions: [{ text: <i className="fa fa-play" />, action: () => { this.props.widgetCreationSelected(c.name, c.title); } }]
                } as IGalleryItem;
            });
        }
    };
    render() {
        return <TabContainer>
            {_.map(this.getChartFamilies(), (cf, ix) => {
                return <TabPage key={"wdse" + ix} caption={cf}>
                    <div style={{maxHeight:"550px",overflowX:"hidden",overflowY:"auto"}}>
                        <GalleryView2 items={this.getChartsByFamily(cf) } />
                     </div>
                    </TabPage>;
            }) }
        </TabContainer>;
    }
}