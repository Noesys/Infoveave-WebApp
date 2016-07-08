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
import {Header} from "./../components/header";
import Paper from "material-ui/lib/paper";

export interface IPageContainerProps {
    children?: any;
    showBreadCrumb?: boolean;
    breadCrumbPath?: {
        title: any,
        link: string
    }[];
    pageTitle?: string;
    containerContent?: any;
    toolbar?: any;
    loading: boolean;
    progressContent?: string;
    onHelpClick(): void;
}

export interface IPageContainerState {

}


export class PageContainer extends BaseComponent<IPageContainerProps, IPageContainerState> {
    static displayName = "PageContainer";
    paperStyle = { height: 150,  width: 200, margin: 20, textAlign: "center", display: "inline-block" };
    breadCrumbDom = () => {
        return (<div className="jumbotron" data-pages="parallax">
            {(this.props.loading) ?
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 100000, backgroundColor: "white", verticalAlign: "middle", textAlign: "center", "display": "table-cell", opacity: 0.9 }}>
                <div style={{ display: "inline-block", marginTop: "300px" }}>
                <Paper style={this.paperStyle} zDepth={5}>
                    <br/><br/>
                    <img src="/assets/img/logo_loading.gif"/>
                    <br/>
                    {(this.props.progressContent == null) ? this.gs("PleaseWait") : this.props.progressContent}
                    </Paper>
                    </div>
                    </div>
                :
                null
            }
            <div style={{ margin: "0 25px" }}>
            <div className="pull-right topToolbar">
                   { this.props.toolbar }
                </div>
              <div className="inner" style={{ "transform": "translateY(0px)", "opacity": 1, "width": "50%" }}>
                <ul className="breadcrumb">
                   {
                   this.props.breadCrumbPath.map((bc, ix) => {
                       return <li key={"bli_" + this.randomId + "_" + ix  }><a className={ (ix === this.props.breadCrumbPath.length - 1) ? "active" : ""} >{bc.title}</a></li>;
                   })
                   }
                    </ul>
                  </div>
                </div>
            </div>);
    };
    render() {
        return (
            <div>
                    <Header pageTitle={this.props.pageTitle} onHelpClick={this.props.onHelpClick}/>
                    <div className="page-content-wrapper">
                        <div className="content">
                        { (this.props.showBreadCrumb) ? this.breadCrumbDom() : "" }
                        <div className="container-fluid">
                        { this.props.children }
                            </div>
                            </div>
                        </div>
                </div>
        );
    }
}