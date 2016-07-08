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
import { BaseComponent } from "./components/baseComponent";

export class App extends React.Component<any, {language: string}> {
    static displayName = "Application";

    componentDidMount = () => {
        (window as any).sideBarInit();
        (window as any).mousePosX = 0;
        (window as any).mousePosY = 0;
        (window as any).contextMenuHandled = false;
        $(document).bind("mousemove", (e) => {
            (window as any).mousePosX = e.pageX;
            (window as any).mousePosY = e.pageY;
        });
        $(document).click((e) => {
            if ($("#contextMenu").css("display") === "block") {
                $("#contextMenu").css("display", "none");
            }
        });
        $(document).bind("contextmenu", (e) => {
            if ((window as any).contextMenuHandled) {
                (window as any).contextMenuHandled = false;
                e.preventDefault();
                return;
            }
            if ($("#contextMenu").css("display") === "block") {
                $("#contextMenu").css("display", "none");
            }
        });
    };

    render() {
        return <div className="appView">
                <div className="page-container">
                    {this.props.children}
                    </div>
                <div id="contextMenu" style={{position:"absolute",top:0,left:0, display:"none"}}/>
            </div>;
    }
}

export class AppLogin extends BaseComponent<any, any> {
    render() {
        return this.props.children;
    }
}
