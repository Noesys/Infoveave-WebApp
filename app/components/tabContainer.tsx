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
import { Tabs, Tab } from "react-bootstrap";

interface ITabContainerProps {
    children?: TabPage[];
    style?: string;
    noAnimation?: boolean;
    position?: string;
    dataHelp?: string;
}

interface ITabContainerState {
    dataHelp?: string;

}


interface ITabPageProps {
    children?: any;
    visible?: boolean;
    caption: string;
    noPadding?: boolean;
    key?: any;
    dataHelp?: string;
}

interface ITabPageState {

}


export class TabContainer extends BaseComponent<ITabContainerProps, ITabContainerState> {
    static displayName = "TabContainer";
    generateHeadersDOM = () => {
        let children: any = _.isArray(this.props.children) ? this.props.children : [this.props.children];
        return _.map(children, (tab: TabPage, ix) => {
            return (tab.props.visible  || tab.props.visible == null) ?
                <li data-help={tab.props.dataHelp} className="" key={"tli_" + this.randomId + "_" + ix } ><a href={"#tab_" + this.randomId + "_" + ix } data-toggle="tab" role="tab">{tab.props.caption}</a></li> : "";
        });
    };

    generateTabContentDOM = () => {
        let children: any = _.isArray(this.props.children) ? this.props.children : [this.props.children];
        return _.map(children, (tab: TabPage, ix) => {
            return (tab.props.visible || tab.props.visible == null) ?
                <div data-help={tab.props.dataHelp} className={"tab-pane " + ((this.props.noAnimation) ? "" : "slide-left") + ((tab.props.noPadding) ? " no-padding" : "") }
                    id={"tab_" + this.randomId + "_" + ix }  key={"tde_" + this.randomId + "_" + ix } >
                    { tab.props.children }
                </div> : "";
        });
    };

    getTabClassName = () => {
        switch (this.props.style) {
            case "style1":
                return "nav-tabs-linetriangle";
            case "style2":
                return "nav-tabs-fillup";
            default:
                return "nav-tabs-simple";

        };
    };

    getTabPoition = () => {
        switch (this.props.position) {
            case "left":
                return "nav-tabs-left";
            case "right":
                return "nav-tabs-right";
            default:
                return "";
        }
    };

    componentDidMount = () => {
        $(ReactDOM.findDOMNode(this.refs["tabHeaders"])).find("li").first().addClass("active");
        $(ReactDOM.findDOMNode(this.refs["tabContent"])).find("div.tab-pane").first().addClass("active");
    };

    render() {
        return (<div className="panel">
                  <ul className={"nav nav-tabs " + this.getTabClassName() + " " + this.getTabPoition() } role="tablist" ref="tabHeaders">
                    { this.generateHeadersDOM() }
                      </ul>
                  <div className="tab-content" ref="tabContent">
                    { this.generateTabContentDOM() }
                      </div>
            </div>);
    }
}

export class TabPage extends BaseComponent<ITabPageProps, ITabPageState> {
    static displayName = "TabPage";
}



interface IWizardContainerProps {
    ref?: any;
    children?: TabPage[];
    buttonTexts: { first: string, next: string, previous: string, finish: string; };
    onNext?(tab: any, navigation: any, ix: number): boolean;
    onPrevious?(tab: any, navigation: any, ix: number): boolean;
    onFinish?(): void;
    buttonsPosition?: string;
    noPadding?: boolean;
    dataHelp?: string;
}

interface IWizardContainerState {
    currentStep: number;
    dataHelp?: string;
}

export class WizardContainerOld extends BaseComponent<IWizardContainerProps, IWizardContainerState> {
    static displayName = "Wizard";
    generateHeadersDOM = () => {
        return _.map(this.props.children, (tab, ix) => {
            return <li className="" key={"tli_" + this.randomId + "_" + ix } ><a href={"#tab_" + this.randomId + "_" + ix } data-toggle="tab" role="tab">{tab.props.caption}</a></li>;
        });
    };

    generateTabContentDOM = () => {
        return _.map(this.props.children, (tab, ix) => {
            return <div  className={"tab-pane slide-left " + ((tab.props.noPadding) ? "no-padding" : "padding-10") } id={"tab_" + this.randomId + "_" + ix }  key={"tde_" + this.randomId + "_" + ix }>
                    { (ix !== this.state.currentStep) ? null : tab.props.children }
                </div>;
        });
    };

    moveNext = () => {
        let domNode = ReactDOM.findDOMNode(this.refs["wizardContainer"]);
        $(domNode).bootstrapWizard("next");
    };

    movePrevious = () => {
        let domNode = ReactDOM.findDOMNode(this.refs["wizardContainer"]);
        $(domNode).bootstrapWizard("previous");
    };

    jumpToTab = (tab: number) => {
        let domNode = ReactDOM.findDOMNode(this.refs["wizardContainer"]);
        this.updateStateImmutable({ currentStep: tab });
        $(domNode).bootstrapWizard("show", tab);
    };

    componentWillMount = () => {
        this.setState({ currentStep: 0 });
    };

    componentDidMount = () => {
        this.updateStateImmutable({ currentStep: 0 });
        let domNode = ReactDOM.findDOMNode(this.refs["wizardContainer"]);
        $(domNode).bootstrapWizard({
            onTabShow: function(tab, navigation, index) {
                let $total = navigation.find("li").length;
                let $current = index + 1;

                // If it"s the last tab then hide the last button and show the finish instead
                if ($current >= $total) {
                    $(domNode).find(".pager .next").hide();
                    $(domNode).find(".pager .finish").show().removeClass("disabled hidden");
                } else {
                    $(domNode).find(".pager .next").show();
                    $(domNode).find(".pager .finish").hide();
                }

                let li = navigation.find("li.active");

            },
            onTabClick: (tab, navigation, index) => {
                return false;
            },
            onNext: (tab, navigation, index) => {
                if (this.props.onNext != null) {
                    let res = this.props.onNext(tab, navigation, index);
                    if (res) this.updateStateImmutable({ currentStep: this.state.currentStep + 1 });
                    return res;
                }
                this.updateStateImmutable({ currentStep: this.state.currentStep + 1 });
                return true;
            },
            onPrevious: (tab, navigation, index) => {
                if (this.props.onPrevious != null) {
                    let res = this.props.onPrevious(tab, navigation, index);
                    if (res) this.updateStateImmutable({ currentStep: this.state.currentStep - 1 });
                    return res;
                }
                this.updateStateImmutable({ currentStep: this.state.currentStep - 1 });
                return true;
            },
            onInit: function() {
                $(domNode).children("ul").removeClass("nav-pills");
            },
            onFinish: () => {
                if (this.props.onFinish != null) { this.props.onFinish(); }
            }
        });

    };

    controlsDOM = () => {
        return <div className={"padding-10 bg-white " + ((this.props.buttonsPosition === "Top") ? "pull-right" : "") }>
                  <ul className="pager wizard">
                    <li className="next" style={{ display: "inline" }}>
                      <button className="btn btn-primary btn-cons pull-right" type="button"><span>{this.props.buttonTexts.next}</span></button>
                        </li>
                    <li className="next finish" style={{ display: "none" }}>
                      <button className="btn btn-primary btn-cons pull-right" type="button">
                        <span>{this.props.buttonTexts.finish}</span>
                          </button>
                        </li>
                    <li className="previous first hidden disabled">
                      <button className="btn btn-default btn-cons pull-right" type="button">
                        <span>{this.props.buttonTexts.first}</span>
                          </button>
                        </li>
                    <li className="previous disabled">
                      <button className="btn btn-default btn-cons pull-right" type="button">
                        <span>{this.props.buttonTexts.previous}</span>
                          </button>
                        </li>
                      </ul>
            </div>;
    };

    render() {
        let ulStyle = ((this.props.buttonsPosition === "Top") ? { "display": "inline-block" } : {});
        let contentStyle = ((this.props.buttonsPosition === "Top") ? { "width": "100%" } : {});
        return (<div className="" ref="wizardContainer">
                  {((this.props.buttonsPosition === "Top") ? this.controlsDOM() : null) }
                  <ul className={"nav nav-tabs nav-tabs-fillup"} role="tablist" ref="tabHeaders" style={ulStyle}>
                    { this.generateHeadersDOM() }
                      </ul>
                  <div  className={"tab-content " + ((this.props.noPadding) ? "no-padding" : "") } ref="tabContent" style={contentStyle} data-help={this.props.dataHelp}>
                    { this.generateTabContentDOM() }
                    {((this.props.buttonsPosition !== "Top") ? this.controlsDOM() : null) }
                      </div>
            </div>);
    }

}


export class WizardContainer extends BaseComponent<IWizardContainerProps, IWizardContainerState> {
    static displayName = "Wizard";

    moveNext = () => {
        if (this.props.onNext == null) {
            if (this.state.currentStep === (this.props.children.length - 1)) {
                return;
            }
        }
        if (this.props.onNext(null, "next", this.state.currentStep + 1) === true) {
            if (this.state.currentStep === (this.props.children.length - 1)) {
                // this.updateStateImmutable({currentStep: 0});
                return;
            }
            this.updateStateImmutable({currentStep: this.state.currentStep + 1});
            return;
        }
    };

    movePrevious = () => {
        if (this.state.currentStep === 0) {
            return;
        }
        if (this.props.onPrevious == null) {
            this.updateStateImmutable({currentStep: this.state.currentStep - 1});
            return;
        }
        if (this.props.onPrevious(null, "previous", this.state.currentStep - 1) === true) {
            this.updateStateImmutable({currentStep: this.state.currentStep - 1});
            return;
        }
    };

    jumpToTab = (tab: number) => {
        this.setState({ currentStep: tab });
    };

    componentWillMount = () => {
        this.setState({ currentStep: 0 });
    };

    componentDidMount = () => {
        this.updateStateImmutable({ currentStep: 0 });
        let domNode = ReactDOM.findDOMNode(this.refs["wizardContainer"]);
        $(domNode).find("ul.nav").addClass("nav-tabs-fillup");
    };

    controlsDOM = () => {
        return <div className={"no-padding bg-white "}>
                  <ul className="pager wizard">
                    <li data-help={this.props.dataHelp} className="next" style={{ display: "inline" }}>
                      <button  className="btn btn-primary btn-cons pull-right" type="button" onClick={this.moveNext} >
                      <span>{(this.state.currentStep === (this.props.children.length - 1)) ? this.props.buttonTexts.finish : this.props.buttonTexts.next}</span></button>
                        </li>
                    <li data-help={this.props.dataHelp} className={"previous " + ((this.state.currentStep ===  0) ? "disabled" : "")}>
                      <button  className="btn btn-default btn-cons pull-right" type="button" onClick={this.movePrevious}>
                        <span>{this.props.buttonTexts.previous}</span>
                          </button>
                        </li>
                      </ul>
            </div>;
    };

    generateTabContentDOM = () => {
        return _.map(_.filter(this.props.children, (c) => c != null), (tab, ix) => {
            return <Tab  key={"wz" + ix}  eventKey={ix} title={tab.props.caption} data-help={tab.props.dataHelp}>
                    { (this.state.currentStep === ix) ? <div style={{height:"500px",overflowY:"auto","overflowX":"hidden"}} >{tab.props.children}</div> : null }
                    { (this.state.currentStep === ix) ? this.controlsDOM() : null }
                </Tab>;
        });
    };

    onSelect = (key: number) => {
        // this.updateStateImmutable({currentStep : key});
    };

    render() {
        return (<div className="bg-white" data-help={this.props.dataHelp}> <Tabs  ref="wizardContainer"  activeKey={this.state.currentStep} position="top" onSelect={this.onSelect} animation={false}>
                       {this.generateTabContentDOM()}
                </Tabs></div>);
    }

}