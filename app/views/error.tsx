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
import * as React from "react";
export class ErrorView extends React.Component<{}, {}> {
    render() {
        return <div className="container-xs-height full-height">
      <div className="row-xs-height">
        <div className="col-xs-height col-middle">
          <div className="error-container text-center">
            <h1 className="error-number">404</h1>
            <h2 className="semi-bold">Sorry but we couldnt find this page</h2>
            <p>This page you are looking for does not exsist <a href="#">Report this?</a>
            </p>
            <div className="error-container-innner text-center">
            </div>
          </div>
        </div>
      </div>
    </div>;
    }
}