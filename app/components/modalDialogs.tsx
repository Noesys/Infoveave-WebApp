"use strict";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { BaseComponent } from "./baseComponent";
import Dialog from "material-ui/lib/dialog";
export enum ModalDialogSize {
    Small = 1,
    Medium = 2,
    Large = 3,
    Full = 4
}

interface IModalDialogProps {
    title: any;
    subTitle?: any;
    children?: ModalContent;
    summary?: any;
    actions?: any;
    size: ModalDialogSize;
    ref?: string;
    dataHelp?: string;
}

interface IModalDialogState {
    open: boolean;
}
export class ModalDialog extends BaseComponent<IModalDialogProps, IModalDialogState> {
    static displayName = "ModalDialog";

    componentWillMount() {
        this.setState({open: false});
    };

    componentDidMount() {
        $("#mdlDg" + this.randomId).modal({
            keyboard: false,
            backdrop: "static",
            show: false
        });
    };

    shouldComponentUpdate = (props: IModalDialogProps, state: IModalDialogState) => {
        return ! (_.isEqual(props, this.props) && _.isEqual(state, this.state));
    };

    render() {
        let props = { className: "modal-dialog" };
        let contentStyle = {};
        if (this.props.size === ModalDialogSize.Large) {
            props.className += " modal-lg";
        }
        if (this.props.size === ModalDialogSize.Small) {
            props.className += " modal-sm";
        }
        if (this.props.size === ModalDialogSize.Full) {
            props["style"] = { "width": "100%" };
            contentStyle["marginTop"] = "-50px";
            contentStyle["marginLeft"] = "50px";
            contentStyle["width"] = "95%";
            contentStyle["maxWidth"] = "none";
        }
        return (
               <div id={"mdlDg" + this.randomId} className="modal fade stick-up" tabIndex={-1} role="dialog" aria-hidden="true" style={{}}>
                <div {...props}>
                    <div className="modal-content">
                        <div className="modal-header clearfix text-left">
                            <button type="button" className="close" onClick={this.hideDialog} ><i className="pg-close fs-14"></i></button>
                            <h3 dangerouslySetInnerHTML={{ __html: this.props.title }}></h3>
                            {(this.props.subTitle !== "" && this.props.subTitle != null) ? <p>{this.props.subTitle}</p> : null}
                            </div>
                        <div className="modal-body">
                            <div className="row">
                                {(this.state.open) ? this.props.children : null}
                                </div>
                            <div className="row">
                                <div className="col-sm-8">
                                    </div>
                                <div className="col-sm-4 m-t-10 sm-m-t-10">
                                    <div className="pull-right">
                                        {this.props.actions}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>

        );
    }

    showDialog = () => {
       $("#mdlDg" + this.randomId).modal("show");
       this.setState({open: true});

    };

    hideDialog = () => {
       $("#mdlDg" + this.randomId).modal("hide");
       this.setState({open: false});
    };
}


export class ModalContent extends BaseComponent<{ noPadding?: boolean, children?: any }, {}> {
    static displayName = "ModalContent";
    render() {
        let style = (this.props.noPadding) ? { margin: "-24px" } : null;
        return (
            <div>{this.props.children}</div>
        );
    }
}

export class ModalActions extends BaseComponent<{ children?: any }, {}> {
    static displayName = "ModalActions";
    render() {
        return (
            <div>{this.props.children}</div>
        );
    }
}