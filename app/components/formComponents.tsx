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
import * as _s from "underscore.string";
import { BaseComponent } from "./baseComponent";
import Select from "react-select";
let SelectAsync: any = Select.Async;

interface IBaseProps {
    children?: any;
    className?: string;
    ref?: any;
    dataHelp?: string;
}


interface IFormProps extends IBaseProps {

}
interface IFormState {

}
export class Form extends BaseComponent<IFormProps, IFormState> {
    static displayName = "Form";
    isValid = (): boolean => {
        return $(ReactDOM.findDOMNode(this.refs["form"])).valid();
    };

    componentDidMount() {
        $(ReactDOM.findDOMNode(this.refs["form"])).validate();
    }
    render() {
        return (
            <form ref="form" role="form">
                { this.props.children }
                </form>
        );
    };
}

interface ICheckBoxProps extends IBaseProps {
    value: string;
    caption: string;
    checked?: boolean;
    onChange?(val: boolean): void;
    key?: any;
    disabled?: boolean;
}
interface ICheckBoxState {

}
export class CheckBox extends BaseComponent<ICheckBoxProps, ICheckBoxState> {
    static displayName = "CheckBox";
    render() {
        let cbId = "cb_" + this.randomId;
        return (
            <div className="checkbox">
                  <input type="checkbox" disabled={this.props.disabled} value={this.props.value} id={cbId} checked={this.props.checked} onChange={this.changeVal}/>
                  <label htmlFor={cbId}>{this.props.caption}</label>
                </div>
        );
    };

    changeVal = (event) => {
        let val = event.target.checked;
        if (this.props.onChange != null) {
            this.props.onChange(val);
        }
    };

}


interface ITextBoxProps extends IBaseProps {
    type: string;
    caption: string;
    placeholder?: string;
    required?: boolean;
    size?: string;
    disabled?: boolean;
    mask?: string;
    regex?: string;
    onChange?: Function;
    value?: any;
    key?: any;
    datHelp?: string;
    minimum?: number;
    maximum?: number;
}
interface ITextBoxState {
    value?: any;
}
export class TextBox extends BaseComponent<ITextBoxProps, ITextBoxState> {
    static displayName = "TextBox";
    getType = () => {
        switch (this.props.type) {
            case "text":
                return "text";
            case "number":
                return "number";
            case "url":
                return "text";
            case "currency":
                return "text";
            case "email":
                return "email";
            case "password":
                return "password";
            default:
                return "text";
        }
    };
    componentWillMount() {
        this.setState({ value: this.props.value });
    };

    componentWillReceiveProps = (newProps: ITextBoxProps) => {
        if (newProps.value !== this.state.value) {
            this.setState({ value: newProps.value });
        }
    };

    onChange = (event) => {
        let val = event.target.value;
        if (this.props.type === "number" && _s.contains(val, ".")) { if (isNaN(parseFloat(val))) { val = null; } else { val = parseFloat(val); } }
        // if (this.props.type == "number" && !_.contains(val,".")){ if (isNaN(parseInt(val))) { val = null; }else {  val = parseInt(val); } }
        if (this.props.type === "text" || this.props.type === "url" || this.props.type === "email" || this.props.type === "password") { if (val === "") { val = null; } };
        this.setState({ value: val });
        if (this.props.onChange == null) { return; }
        this.props.onChange(val);
    };

    onBlur = (event) => {
        if (this.props.disabled) { return; }
        let val = event.target.value;
        if (this.props.type === "number" && _s.contains(val, ".")) { if (isNaN(parseFloat(val))) { val = null; } else { val = parseFloat(val); } };
        // if (this.props.type == "number" && !_.contains(val,".")){ if (isNaN(parseInt(val))) { val = null; }else {  val = parseInt(val); } };
        if (this.props.type === "text" || this.props.type === "url" || this.props.type === "email" || this.props.type === "password") { if (val === "") { val = null; } };
        this.setState({ value: val });
        if (this.props.onChange == null) { return; }
        this.props.onChange(val);
    };

    render() {
        let labelAttributes = {
            className: (this.props.size === "large") ? "label-lg" : (this.props.size === "small") ? "label-sm" : ""
        };

        let inputAttributes = {
            type: this.getType(),
            className: ((this.props.size === "large") ? "input-lg" : (this.props.size === "small") ? "input-sm" : "") + " form-control",
            placeholder: (this.props.placeholder !== "") ? this.props.placeholder : this.props.caption,
        };
        if (this.props.type === "number" && this.props.minimum != null) {
            inputAttributes["min"] = this.props.minimum;
        }
         if (this.props.type === "number" && this.props.maximum != null) {
            inputAttributes["max"] = this.props.maximum;
        }
        if (this.props.disabled) {
            inputAttributes["disabled"] = "disabled";
            inputAttributes["value"] = this.props.value;
        };
        if (this.props.required) {
            inputAttributes["data-rule-required"] = true;
        }
        if (this.getType() === "email") {
            inputAttributes["data-rule-email"] = true;
        }
        if (this.getType() === "url") {
            inputAttributes["data-rule-url"] = true;
        }
        let name = this.props.caption.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

        return (
            <div data-help={this.props.dataHelp} className={ ((this.props.required) ? "required " : " ") + "form-group" }>
                <label {...labelAttributes}>{this.props.caption}</label>
                    <input name={name} {...inputAttributes} onChange={this.onChange} onBlur={this.onBlur} value={this.state.value} />
                </div>
        );
    }
}


interface IButtonProps extends IBaseProps {
    caption?: string;
    onClick?: Function;
    type: string;
    disabled?: boolean;
    dataHelp?: string;
    dataAction?: Function;
    title?: string;
    style?: React.CSSProperties;
}
interface IButtonState { }
export class Button extends BaseComponent<IButtonProps, IButtonState> {
    static displayName = "Button";
    handleOnClick = () => {
        if (this.props.disabled) { return; };
        if (this.props.onClick == null) { return; };
        this.props.onClick();
    };
    shouldComponentUpdate(nextProps: IButtonProps, nextState: IButtonState): boolean {
        return !(_.isEqual(this.props, nextProps) && _.isEqual(this.state, nextState));
    }

    render() {
        let className = "btn ";
        if (this.props.className == null || this.props.className === "primary") {
            className += "btn-primary ";
        }
        className += this.props.className;
        if (!_s.contains(className, "hint--")) {
            className += " hint--bottom";
        }
        let content = (this.props.caption != null) ? <span>{this.props.caption}</span> : this.props.children;
        return <button disabled={this.props.disabled} className={className} type={this.props.type} onClick={this.handleOnClick} style={this.props.style} data-help={this.props.dataHelp} data-hint={this.props.title}>{content}</button>;
    }
}


interface IMessageProps extends IBaseProps {
    type: string;
    message: string;
    inProgress?: boolean;
}
interface IMessageState {

}
export class Message extends BaseComponent<IMessageProps, IMessageState> {
    static displayName = "Message";

    shouldComponentUpdate(nextProps: any, nextState: any): boolean {
        return !(_.isEqual(this.props, nextProps));
    }
    render() {
        let className = "alert alert-" + this.props.type;
        return (<div className={className}> { (this.props.inProgress) ? <i className="fa fa-spinner fa-pulse"></i> : "" } {this.props.message}</div>);
    }
}


interface ISimpleDropdownProps extends IBaseProps {
    size?: string;
    caption: string;
    options: Array<any>;
    optionsText?: string;
    optionsValue?: string;
}

interface ISimpleDropdownState {
}

export class SimpleDropdown extends BaseComponent<ISimpleDropdownProps, ISimpleDropdownState> {
    static displayName = "SimpleDropdown";
    generateOptions = () => {
        let options = _.map(this.props.options, (op) => {
            if (this.props.optionsValue != null) {
                return <option key={ "ky" + op[this.props.optionsValue]} value={op[this.props.optionsValue]}>{op[this.props.optionsText]}</option>;
            } else {
                return <option value={op} key={"ky" + op}>{op}</option>;
            }
        });
        return options;
    };

    componentDidMount = () => {
        new SelectFx($(ReactDOM.findDOMNode(this.refs["simpleSelect"])).get(0));
    };

    render() {
        let labelAttributes = {
            className: (this.props.size === "large") ? "label-lg" : (this.props.size === "small") ? "label-sm" : ""
        };
        let className = "cs-select cs-skin-slide " + (this.props.className != null ? this.props.className : "");
        return (
            <div className="form-group">
                <label {...labelAttributes}>{this.props.caption}</label>
                <div className="cs-wrapper">
                <select className={className} ref="simpleSelect">
                    { this.generateOptions() }
                    </select>
                    </div>
                </div>
        );
    }
}

interface IRadioListProps extends IBaseProps {
    caption?: string;
    options: { caption: string, value: any }[];
    onChange?: Function;
    value?: any;
    paddingRight?: string;
    dataHelp?: string;
}

interface IRadioListState {
    value?: any;
    dataHelp?: string;
}

export class RadioList extends BaseComponent<IRadioListProps, IRadioListState> {
    static displayName = "RadioList";
    componentWillMount() {
        this.setState({ value: this.props.value });
    }


    onChange = (event) => {
        this.setState({ value: event.target.value });
        if (this.props.onChange == null) { return; };
        this.props.onChange(event.target.value);
    };
    /*componentDidUpdate = (x) => {
        $("[id^=ro_" + this.randomId + "]").attr("checked",false);
        if (this.props.value != null){
            let ix = _.indexOf(this.props.options,_.find(this.props.options,(o)=> o.value == this.props.value));
            if (ix != null){
                 $("[id^=ro_" + this.randomId + "_" + ix  + "]").attr("checked",true);
            }
        }
    };*/

    componentWillReceiveProps = (newProps: ITextBoxProps) => {
        if (newProps.value == null) { return; }
        if (newProps.value !== this.state.value) {
            this.setState({ value: newProps.value });
        }
    };

    generateDOM = () => {
        return _.map(this.props.options, (op, ix) => {
            return (
                <div key={"rl_" + this.randomId + "_" + ix} style={{ "display": "inline-block", "paddingRight": (this.props.paddingRight != null) ? this.props.paddingRight : 20 }}>
                      <input type="radio" value={op.value} name={this.randomId} id={"ro_" + this.randomId + "_" + ix} onChange={this.onChange} checked={op.value === this.state.value}/>
                      <label htmlFor={"ro_" + this.randomId + "_" + ix}>{op.caption}</label>
                    </div>
            );
        });
    };


    render() {
        return (
            <div data-help={this.props.dataHelp} className="form-group">
                <label>{this.props.caption}</label>
                    <div className="radio radio-success">
                    {this.generateDOM() }
                        </div>
                </div>
        );
    }
}

export interface IFileInputProps extends IBaseProps {
    caption: string;
    dataHelp?: string;
    fileSelected?: any;
}

export interface IFileInputState {
      dataHelp?: string;
}
export class FileInput extends BaseComponent<IFileInputProps, IFileInputState> {
    static displayName = "FileInput";
    HasFile = (): boolean => {
        return ((ReactDOM.findDOMNode(this.refs["file"]) as any).files.length > 0);
    };

    Selectedfile = (): File => {
        return ((ReactDOM.findDOMNode(this.refs["file"]) as any) as any).files[0];
    };


    render() {
        return (
            <div data-help={this.props.dataHelp} className="form-group">
                <label>{this.props.caption}</label>
                    <input type="file" ref="file" onChange={this.props.fileSelected} />
                </div>
        );
    }
}


export interface IDropDownProps extends IBaseProps {
    options?: Array<any>;
    optionsText?: string;
    optionsValue?: string;
    multiple?: boolean;
    size?: string;
    caption: string;
    required?: boolean;
    placeholder?: string;
    onChange?: Function;
    value?: any;
    key?: any;
    useAjax?: boolean;
    ajaxMethod?(searchTerm: string): Promise<any>;
    clearable?: boolean;
    dataHelp?: string;
}

export interface IDropDownState {

}

export class DropDown extends BaseComponent<IDropDownProps, IDropDownState> {
    static displayName = "DropDown";
    generateOptions = () => {
        let options = _.map(this.props.options, (op) => {
            if (this.props.optionsValue != null) {
                return <option key={ "ky" + op[this.props.optionsValue]} value={op[this.props.optionsValue]}>{op[this.props.optionsText]}</option>;
            } else {
                return <option value={op} key={"ky" + op}>{op}</option>;
            }
        });
        return options;
    };

    componentDidMount = () => {
        let selectOpts = {
            placeholder: (this.props.placeholder != null) ? this.props.placeholder : this.gs("PleaseSelect"),
            allowClear: true,
        };
        if (this.props.useAjax === true && this.props.ajaxMethod != null) {
            selectOpts["query"] = (query) => {
                this.props.ajaxMethod(query.term).then((data) => {
                    let cbData = { results: [] };
                    if (this.props.optionsValue != null) {
                        _.each(data, (d) => { cbData.results.push({ id: d[this.props.optionsValue], text: d[this.props.optionsText] }); });
                    } else {
                        _.each(data, (d) => { cbData.results.push({ id: d, text: d }); });
                    };
                    query.callback(cbData);
                });
            };
            selectOpts["minimumInputLength"] = 2;
            selectOpts["multiple"] = this.props.multiple;
            selectOpts["initSelection"] = (element, cb) => {
                let cbData = [];
                if (this.props.optionsValue != null) {
                    _.each(this.props.value, (d) => { cbData.push({ id: d[this.props.optionsValue], text: d[this.props.optionsText] }); });
                } else {
                    _.each(this.props.value, (d) => { cbData.push({ id: d, text: d }); });
                };
                cb(cbData);
            };
        };
        $(ReactDOM.findDOMNode(this.refs["select"])).select2(selectOpts);
        if (this.props.value != null) {
            $(ReactDOM.findDOMNode(this.refs["select"])).select2("val", this.props.value);
        }
        $(ReactDOM.findDOMNode(this.refs["select"])).on("change", (obj: any) => {
            if (this.props.onChange == null) { return; }
            let val = obj.val;
            this.props.onChange(val);
        });
    };

    componentDidUpdate = () => {
        $(ReactDOM.findDOMNode(this.refs["select"])).select2("val", this.props.value);
    };

    componentDOM = (className) => {
        if (this.props.useAjax) {
            return (<div><input className={className + "" } ref="select" style={{ width: "100%" }} /></div>);
        } else {
            return <select className={className} ref="select" multiple={this.props.multiple} style={{ width: "100%" }}>
                    { (this.props.multiple) ? null : <option></option> }
                    { this.generateOptions() }
                </select>;
        }
    };

    render() {
        let labelAttributes = {
            className: (this.props.size === "large") ? "label-lg" : (this.props.size === "small") ? "label-sm" : ""
        };
        let className = " " + (this.props.className != null ? this.props.className : "");
        return (
            <div className={ ((this.props.required) ? "required " : " ") + "form-group" }>
                <label {...labelAttributes}>{this.props.caption}</label>
                {this.componentDOM(className) }
                </div>
        );
    }

}

export class A extends BaseComponent<React.HTMLProps<HTMLAnchorElement>, any> {
    static displayName = "A";

    shouldComponentUpdate(nextProps: any, nextState: any): boolean {
        return !(_.isEqual(this.props, nextProps));
    }

    render() {
        let props = _.clone(this.props);
        props = _.merge(props, { "data-hint": this.props.title, className: this.props.className + " hint--bottom" });
        props.title = null;
        return <a {...props} data-hint={this.props.title} className={this.props.className + " hint--bottom"} >{this.props.children}</a>;
    }
}


export class DropDown2 extends BaseComponent<IDropDownProps, IDropDownState> {
    static displayName = "DropDown";

    onChange = (option: { label: string, value: any } | { label: string, value: any }[]) => {
        if (this.props.onChange == null) return;
        this.props.onChange(option);
    };

    componentDOM = (className) => {
        let cla = (this.props.clearable === null) ? true : this.props.clearable;
        if (!this.props.useAjax) {
            let options = (this.props.optionsText == null) ? _.map(this.props.options, (op) => { return { label: op, value: op }; }) : this.props.options;
            return <Select required ={true} multi={this.props.multiple} options={options} value={this.props.value} onChange={this.onChange} labelKey={this.props.optionsText} valueKey={this.props.optionsValue} clearable={cla} />;
        } else {
            return <SelectAsync  required ={true} multi={this.props.multiple} value={this.props.value} minimumInput={2} loadOptions={this.props.ajaxMethod} onChange={this.onChange} />;
        }
    };

    render() {
        let labelAttributes = {
            className: (this.props.size === "large") ? "label-lg" : (this.props.size === "small") ? "label-sm" : ""
        };
        let className = " " + (this.props.className != null ? this.props.className : "");
        return (
            <div data-help={this.props.dataHelp} className={ ((this.props.required) ? "required " : " ") + "form-group" }>
                <label {...labelAttributes}  >{this.props.caption}</label>
                {this.componentDOM(className) }
                </div>
        );
    }

}