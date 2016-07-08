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
import Spacing from "material-ui/lib/styles/spacing";
import zIndex from "material-ui/lib/styles/zIndex";
import Colors from "material-ui/lib/styles/colors";

export var muiTheme = {
    spacing: Spacing,
    zIndex: zIndex,
    fontFamily: "'Segoe UI',ptsans,'Helvetica Neue',serif",
    palette: {
        primary1Color: "#6D5CAE",
        primary2Color: "#5B4D91",
        primary3Color: "#8A7DBE",
        accent1Color: "#10CFBD",
        accent2Color: "#0DAD9E",
        accent3Color: "#40D9CA",
        textColor: Colors.darkBlack,
        alternateTextColor: Colors.white,
        canvasColor: Colors.white,
        borderColor: Colors.grey300,
        disabledColor: Colors.grey300,
        pickerHeaderColor: Colors.cyan500,
    }
};

export var getBaseStyle = (singleLine?: boolean) => {
    let style =  {
    control: {
        backgroundColor: "#fff",
        fontSize: 14,
        fontWeight: "normal",
    },
    highlighter: {
    },
    textarea: {
        padding: 9,
        minHeight: 250,
        outline: 0,
        border: 0,
        margin: 0,
        letterSpacing: "0.14px"
    },
    input: {
        padding: 1,
        margin: 0,
        border: "2px inset",
    },
    suggestions: {
        border: "1px solid rgba(0,0,0,0.15)",
        fontSize: 12,
        item: {
            padding: "5px 15px",
            borderBottom: "1px solid rgba(0,0,0,0.15)",

            "&focused": {
                backgroundColor: "#eee",
            }
        }
    }
    };
    if (singleLine) {
        style.control = _.extend(style.control, {
            display: "inline-block",

            width: 130,
        }) as any;
        style.highlighter = _.extend(style.highlighter, {
            padding: 1,
            border: "2px inset transparent",
        }) as any;
    } else {
        style.control = _.extend(style.control, {
            fontFamily: "Monaco, Consolas, monospace",
        }) as any;
        style.highlighter = _.extend(style.highlighter, {
            padding: 9,
        });
    }

    return style;
};