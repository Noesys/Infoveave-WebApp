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

export class InfoveaveLogo extends BaseComponent<{ darkbg?: boolean }, {}> {
    static displayName = "InfoveaveLogo";

    shouldComponentUpdate(nextProps: any, nextState: any): boolean {
        return !(_.isEqual(this.props, nextProps));
    }

    render() {
        let logoLocation = (this.props.darkbg) ? "/assets/img/infoveave_darkbg.svg" : "/assets/img/infoveave_lightbg.svg";
        return (
            <img src={logoLocation} alt="logo" data-src={logoLocation} data-src-retina={logoLocation} className="loginLogoImg"/>
        );
    }
} 