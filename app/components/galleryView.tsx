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
import * as _s from "underscore.string";
import Card from "material-ui/lib/card/card";
import CardActions from "material-ui/lib/card/card-actions";
import CardHeader from "material-ui/lib/card/card-header";
import CardMedia from "material-ui/lib/card/card-media";
import CardTitle from "material-ui/lib/card/card-title";
import CardText from "material-ui/lib/card/card-text";
import RaisedButton from "material-ui/lib/raised-button";
import FloatingActionButton from "material-ui/lib/floating-action-button";
import IconButton from "material-ui/lib/icon-button";
interface IGalleryViewState {

}
export interface IGalleryItem {
    title: string;
    imagePreview: string;
    images: string[];
    smallDescription: string;
    description: string;
    actions: {
        text: any;
        action: any;
        primary?: boolean;
        secondary?: boolean;
    }[];
};

interface IGalleryViewProps {
    items: IGalleryItem[];
}

export class GalleryView extends BaseComponent<IGalleryViewProps, IGalleryViewState> {
    static displayName = "Gallery";
    render() {
        return (
            <div className="gallery">
                { this.generateItemsDom() }
                </div>
        );
    }

    generateItemsDom = () => {
        return _.map(this.props.items, (item, ix) => {
            return (
                <div className="gallery-item " data-width="1" data-height="1" key={"gi" + ix}>
    <img src={item.imagePreview} alt="" className="image-responsive-height" />
    <div className="overlayer bottom-left full-width">
        <div className="overlayer-wrapper item-info ">
            <div className="gradient-grey p-l-20 p-r-20 p-t-20 p-b-5">
                <div className="">
                    <div className="pull-left"><div className="bold text-white fs-14 p-t-10">{item.title}</div><div className="no-margin text-white fs-12">{item.smallDescription}</div></div>
                    </div>
                <div className="m-t-10">
                    <div className="inline m-l-10 full-width">
                     <div className="pull-right m-t-10">
                                     {_.map(item.actions, (ac, ix2) => {
                                         return <button key={"gca" + ix2} className="btn btn-primary btn-xs btn-mini bold fs-14 m-r-10"  type="button" onClick={ac.action}>{ac.text}</button>;
                                     }) }
                     </div>

                        <div className="clearfix"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
                    </div>
            );
        });
    };

}

export class GalleryView2 extends BaseComponent<IGalleryViewProps, IGalleryViewState> {
    static displayName = "CardView";
    render() {
        return (
            <div className="gallery">
                { this.generateItemsDom() }
                </div>
        );
    }

    generateItemsDom = () => {
        return _.map(this.props.items, (item, ix) => {
            return (
                <div key={"gi" + ix} className="col-md-2 m-b-10">
                <Card style={{height:"260px"}}>
                    <CardHeader title={item.title} style={{height:"50px"}} />
                    <CardMedia style={{height:"160px", overflow:"hidden"}}
                        overlay={(!_s.isBlank(item.smallDescription)) ? <CardTitle subtitle={item.smallDescription} /> : null}
                    ><img src={item.imagePreview} /></CardMedia> : null }
                    <CardActions>
                        <div className="pull-right">
                        {_.map(item.actions,(ac,ix2) => {
                            return <RaisedButton primary={ac.primary} key={`gvi-${ix}-${ix2}` } style={{width: "30px", minWidth:"30px", height:"30px", marginLeft:"5px"}} onTouchTap={ac.action}>{ac.text}</RaisedButton>;
                        })}
                        </div>
                    </CardActions>
                </Card>
                </div>
            );
        });
    };

}

//  <FloatingActionButton secondary={true} style={{marginLeft: "10px", width:"30px", height:"30px"}} mini={true} key={"gca" + ix2} onTouchTap={ac.action}>{ac.text}</FloatingActionButton>