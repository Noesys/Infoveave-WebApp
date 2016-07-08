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
import * as _s from "underscore.string";
import { BaseComponent } from "./baseComponent";
import Select from "react-select";
let SelectAsync: any = Select.Async;

interface IFilterBuilderProps {
    columns: { value: any, label: string  }[];
    itemsCallback?(name: any, query: string): Promise<{ value: any; label: string }[]>;
    filters: { name: any, operator: string, items: string[] }[];
    filtesUpdated(filters: { name: any, operator: string, items: string[] }[]): void;
}

interface IFilterBuilderState {
    filters: { randomId: string, name: any, operator: string, items: string[] }[];
}
export class FilterBuilder extends BaseComponent<IFilterBuilderProps, IFilterBuilderState> {
    static displayName = "FilterBuilder";

    addButtonDOM = () => {
        return <div className="row" style={{marginTop:"15px"}}><div className="col-md-12"><button className="btn btn-primary hint--bottom" onClick={this.addFilter} >{this.gs("AddFilter")}</button></div></div>;
    };

    compareOptions = () => {
        return [
            { value: "Exactly", label: this.gs("Exactly") },
            { value: "NotExactly", label: this.gs("NotExactly") },
            { value: "Contains", label: this.gs("Contains") },
            { value: "NotContains", label: this.gs("NotContains") },
        ];
    };

    componentWillMount() {
        this.setState({ filters: _.map(this.props.filters, (f, ix) => {
            return {
                randomId: this.randomId + "f" + ix,
                name: f.name,
                operator: f.operator,
                items: f.items
            };
        })  });
    };

    addFilter = () => {
        let newFilter = { randomId: this.randomId + "f" + this.state.filters.length, name: null, operator: "Exactly", items: [] };
        let newFilters = _.cloneDeep(this.state.filters);
        newFilters.push(newFilter);
        this.raiseFiltersChange(newFilters);
    };

    removeFilter = (randomId) => {
        let newFilters = _.cloneDeep(this.state.filters);
        newFilters = _.filter(newFilters, (nf) => nf.randomId !== randomId);
        this.raiseFiltersChange(newFilters);
    };

    componentWillReceiveProps (newProps: IFilterBuilderProps) {
         this.setState({ filters: _.map(newProps.filters, (f, ix) => {
            return {
                randomId: this.randomId + "f" + ix,
                name: f.name,
                operator: f.operator,
                items: f.items
            };
        })  });
    };

    raiseFiltersChange = (filters: { randomId: string, name: any, operator: string, items: string[] }[]) => {
        let toUpdate = _.map(filters, (nf) => { delete nf.randomId; return nf; });
        this.props.filtesUpdated(toUpdate);
    };

    namefieldChange = (randomId: string, newValue: {label: string, value: string}) => {
        let newFilters = _.cloneDeep(this.state.filters);
        let toUpdate = _.find(newFilters, (nf) => nf.randomId === randomId);
        toUpdate.name = newValue.value;
        this.raiseFiltersChange(newFilters);
    };

    optionfieldChange = (randomId: string, newValue: {label: string, value: string}) => {
        let newFilters = _.cloneDeep(this.state.filters);
        let toUpdate = _.find(newFilters, (nf) => nf.randomId === randomId);
        toUpdate.operator = newValue.value;
        this.raiseFiltersChange(newFilters);
    };

    filterCallback = (option: string , query: string): Promise<any[]> => {
        return new Promise((resolve) => {
           if (_s.isBlank(option) || _s.isBlank(query)) {
                resolve([]);
                return;
           }
           this.props.itemsCallback(option, query).then((results) => {
               resolve(results);
           });
        });
    };

    itemsChange = (randomId: string, newValues: {label: string, value: string}[] | any ) => {
        let newFilters = _.cloneDeep(this.state.filters);
        let toUpdate = _.find(newFilters, (nf) => nf.randomId === randomId);
        toUpdate.items = _.isArray(newValues) ? _.map(newValues, (n: {label: string, value: string}) => n.value) : [newValues.target.value];
        this.raiseFiltersChange(newFilters);
    };

    filtersDOM = () => {
        return _.map(this.state.filters, (filter, ix) => {
            let itemsSelectProps = {
                multi: true,
                value: _.map(filter.items, (i) => { return { label: i, value: i }; }),
                minimumInput: 2,
                allowCreate: (filter.operator === "Contains" || filter.operator === "NotContains"),
                loadOptions: (filter.operator === "Contains" || filter.operator === "NotContains") ? null : _.partial(this.filterCallback, filter.name),
                onChange: _.partial(this.itemsChange, filter.randomId)
            };
            return <div key={"fb" + ix} className="row" style={{"marginTop":"5px","marginBottom":"5px"}}>
                <div className="col-md-3">
                    <Select options={this.props.columns} value={filter.name} clearable={false} onChange={_.partial(this.namefieldChange,filter.randomId)} />
                </div>
                <div className="col-md-3">
                    <Select options={this.compareOptions()} value={filter.operator} clearable={false}  onChange={_.partial(this.optionfieldChange,filter.randomId)}  />
                </div>
                <div className="col-md-5">
                    {(filter.operator === "Contains" || filter.operator === "NotContains") ? <input type="text" className="form-control" onChange={_.partial(this.itemsChange,filter.randomId)} /> : <SelectAsync {...itemsSelectProps}/> }
                </div>
                <div className="col-md-1">
                    <button className="btn btn-danger" onClick={_.partial(this.removeFilter,filter.randomId)} ><i className="fa fa-trash-o"/></button>
                </div>
            </div>;
        });
    };
    render() {
        return (
            <div>
                 {this.filtersDOM()}
                 {this.addButtonDOM()}
            </div>
        );
    }

}