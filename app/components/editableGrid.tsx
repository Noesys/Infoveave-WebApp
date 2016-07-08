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

interface IGridEditorComponent {
}

interface IGridDropDownEditorProps {
    options: string[];
    value?: string;
    onChange?: Function;
    column?: any;
}

interface IGridDropDownEditorState {
}

export class GridDropDownEditor extends BaseComponent<IGridDropDownEditorProps, IGridDropDownEditorState> implements IGridEditorComponent {

    optionsDom = () => {
        return _.map(this.props.options, (o, ix) => {
            return <option value={o} key={"gdeo_" + this.randomId + "_" + ix}>{o}</option>;
        });
    };
    handleChange = (e) => {
        if (this.props.onChange != null) this.props.onChange(e.target.value);
    };
    componentDidMount = () => {
        // new SelectFx($(React.findDOMNode(this.refs["select"])).get(0));
    };


    render() {
        return (
            <select ref="select" style={{ width: "100%", border: "none" }} className="cs-select cs-skin-slide " onChange={this.handleChange} value={this.props.value}>
                { this.optionsDom() }
                </select>
        );
    }
};





interface IGridMultiSelectEditorProps {
    options: string[];
    value?: string[];
    onChange?: Function;
    column?: any;
}

interface IGridMultiSelectEditorState {
}

export class GridMultiSelectEditor extends BaseComponent<IGridMultiSelectEditorProps, IGridMultiSelectEditorState> implements IGridEditorComponent {
    componentWillMount = () => {
    };
    optionsDom = () => {
        return _.map(this.props.options, (o, ix) => {
            return <option value={o} key={"gdeo_" + this.randomId + "_" + ix}>{o}</option>;
        });
    };
    componentDidMount = () => {
        $(ReactDOM.findDOMNode(this.refs["select"])).select2();
        $(ReactDOM.findDOMNode(this.refs["select"])).val(this.props.value).trigger("change");
        $(ReactDOM.findDOMNode(this.refs["select"])).on("change", (e) => {
            if (this.props.onChange != null) {
                this.props.onChange($(ReactDOM.findDOMNode(this.refs["select"])).val());
            }
        });
    };


    render() {
        return (
            <select ref="select" multiple={true} style={{ width: "100%", border: "none" }}>
                { this.optionsDom() }
                </select>
        );
    }
};

interface IGridMultiSelectComboEditorProps {
    options?: string[];
    value?: string[];
    onChange?: Function;
    column?: any;
}

interface IGridMultiSelectComboEditorState {
}

export class GridMultiSelectComboEditor extends BaseComponent<IGridMultiSelectComboEditorProps, IGridMultiSelectComboEditorState> implements IGridEditorComponent {
    componentWillMount = () => {
    };
    optionsDom = () => {
        return _.map(this.props.options, (o, ix) => {
            return <option value={o} key={"gdeo_" + this.randomId + "_" + ix}>{o}</option>;
        });
    };
    componentDidMount = () => {
        $(ReactDOM.findDOMNode(this.refs["select"])).select2({
            tags: true,
            maximumSelectionLength: 1
        });
        $(ReactDOM.findDOMNode(this.refs["select"])).val(this.props.value).trigger("change");
        $(ReactDOM.findDOMNode(this.refs["select"])).on("change", (e) => {
            if (this.props.onChange != null) {
                this.props.onChange($(ReactDOM.findDOMNode(this.refs["select"])).val());
            }
        });
    };


    render() {
        return (
            <select ref="select" multiple={true} style={{ width: "100%", border: "none" }}>
                { this.optionsDom() }
                </select>
        );
    }
};



interface IGridCheckBoxEditorProps {
    value?: boolean;
    onChange?: Function;
    column?: any;
    options?: boolean;
}


interface IGridCheckBoxEditorState {
}



export class GridCheckBoxEditor extends BaseComponent<IGridCheckBoxEditorProps, IGridCheckBoxEditorState> {
    componentWillMount = () => {
    };
    changeHandler = (e) => {
        if (this.props.onChange != null) this.props.onChange(e.target.checked);
    };

    render() {
        return (
            <div className="checkbox check-success">
              <input type="checkbox" checked={this.props.value} value="1" onChange={this.changeHandler} id={"gche_" + this.randomId} disabled={this.props.options} />
               <label htmlFor={"gche_" + this.randomId}>&nbsp; </label>
                </div>
        );
    }
}



interface IEditableGridProps {
    columns: { name: string, key: string, editable?: boolean, editor?: JSX.Element }[];
    rows: any[];
    onRowUpdate(rowNumber: number, key: string, newValue: string): void;
}

interface IEditableGridState {

}

export class EditableGrid extends BaseComponent<IEditableGridProps, IEditableGridState> {
    headerDOM = () => {
        return _.map(this.props.columns, (c) => {
            return <th className="sorting_asc" tabIndex={0} aria-controls="condensedTable" rowSpan={1} colSpan={1} key={"egth_" + this.randomId + "_" + c.key}>{c.name}</th>;
        });
    };

    contentDOM = () => {
        return _.map(this.props.rows, (row, ix) => {
            return <tr role="row" className={ (ix % 2 === 0) ? "odd" : "even" } key={"egtr_" + this.randomId + "_" + ix }>
                      { this.rowDOM(row, ix) }
                </tr>;
        });
    };

    rowDOM = (row: any, rowIx: number) => {
        return _.map(this.props.columns, (column, ix) => {
            let content = <td className="v-align-middle" key={"egtd" + this.randomId + "_" + rowIx + "_" + ix}>{(column.editable) ? this.cellDOM(row, rowIx, column) : row[column.key]}</td>;
            return content;
        });
    };

    cellDOM = (row: any, rowIx: number, column: { name: string, key: string, editable?: boolean, editor?: JSX.Element }) => {
        if (column.editor == null) {
            return <input type="text" className="form-control" defaultValue={row[column.key]} onChange={_.partial(this.textChange, rowIx, column.key) as any} />;
        } else {
            let newProps = { value: row[column.key], onChange: _.partial(this.handleRowUpdate, rowIx, column.key) };
            if (row[column.key + ".options"] != null) {
                newProps["options"] = row[column.key + ".options"];
            };
            let cloned = React.cloneElement(column.editor, _.extend(column.editor.props, newProps));
            return cloned;
        };
    };

    textChange = (rowIx: number, key: string, e: any) => {
        if (this.props.onRowUpdate != null) this.props.onRowUpdate(rowIx, key, e.target.value);
    };

    handleRowUpdate = (rowIx: number, key: string, newValue: string) => {
        if (this.props.onRowUpdate != null) this.props.onRowUpdate(rowIx, key, newValue);
    };

    render() {
        return (<div className="table-responsive">
                  <div id="condensedTable_wrapper" className="dataTables_wrapper form-inline no-footer">
                    <table className="table table-hover table-condensed dataTable no-footer" id="condensedTable" role="grid">
                        <thead>
                          <tr role="row">
                            {this.headerDOM() }
                              </tr>
                            </thead>
                    <tbody>
                    { this.contentDOM() }
                        </tbody>
                        </table></div>
            </div>);
    };
}
