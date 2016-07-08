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
import { AuthorisationStore } from "./../data/dataStore";

interface ICanAccessProps {
    module: string;
    view: string;
    action: string;
    key?: any;
    children?: any;
}

export class CanAccess extends React.Component<ICanAccessProps, {}> {
    static displayName = "CanAccess";
    private _dataStore = new AuthorisationStore();

    shouldComponentUpdate(nextProps: ICanAccessProps, nextState: any): boolean {
        return !(_.isEqual(this.props, nextProps));
    }

    render() {
        if (_.find(this._dataStore.GetUserPermissions(), (p) => { return (p.module === this.props.module && p.view === this.props.view && p.action === this.props.action);  } ) != null) {
            return this.props.children;
        };
        return null;
    }
}