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
import * as ReactPerf from "react-addons-perf";
import * as _ from "lodash";
import { Router, Route, browserHistory, IndexRoute } from "react-router";
import { App, AppLogin } from "./app";
import { Login } from "./views/login";
import { InfoboardView } from "./views/infoboard";
import { DataSourceManager } from "./views/dataSourceManager";
import { UserManager } from "./views/userManager";
import { RoleManager } from "./views/roleManager";
import { RoleEditor } from "./views/roleEditor";
import { UserEditor } from "./views/userEditor";
import { ReportManager } from "./views/reportManager";
import { DataSourceMondrian } from "./views/dataSourceMondrian";
import { QueryBuilder } from "./views/queryBuilder";
import { Urls } from "./data/constants";
import { Profile } from "./views/profile";
import { ColorPalette } from "./views/colorPalette";
import { ErrorView } from "./views/error";


let defaultRoute: any =  Login;
// ReactPerf.start();
// (window as any).reactPerf = ReactPerf;
ReactDOM.render(
        <Router history={browserHistory}>
            <Route path="/" component={AppLogin}>
                <IndexRoute component={defaultRoute} />
            </Route>
            <Route path="/app/" component={App as any}>
                <Route path="infoboards/:id" component={InfoboardView as any}/>
                <Route path="dataSourceManager" component={DataSourceManager as any}/>
                <Route path="dataSourceMondrian" component={DataSourceMondrian as any} />
                <Route path="dataSourceMondrian/:id" component={DataSourceMondrian as any} />
                <Route path="userManager" component={UserManager as any}/>
                <Route path="roleManager" component={RoleManager as any}/>
                <Route path="roleEditor/:id" component={RoleEditor as any}/>
                <Route path="userEditor/:id" component={UserEditor as any}/>
                <Route path="reportManager" component={ReportManager as any}/>
                <Route path="reportManager/:id" component={ReportManager as any}/>
                <Route path="queryBuilder" component={QueryBuilder as any}/>
                <Route path="queryBuilder/:id" component={QueryBuilder as any}/>
                <Route path="colorPalette" component={ColorPalette as any} />
                <Route path="profile" component={Profile as any}/>
                <Route path="*" component={ErrorView}/>
            </Route>
        </Router>,
        document.getElementById("app-Container")
);