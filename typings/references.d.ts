/// <reference path="tsd.d.ts" />
declare var SelectFx: any;

declare module "react-grid-layout" {
    export var Responsive: any;
}

declare var canvg: any;

declare module "d3-funnel" {
    export default D3Funnel;
}
declare var D3Funnel: any;
declare var HTML5Backend: any;
declare var google: any;
declare var GLatLng: any;
declare var OverlappingMarkerSpiderfier: any;
declare var L: any;

interface ID3PlusInterface {
    viz(): ID3PlusInterface;
    container(reference: string | any): ID3PlusInterface;
    data(data: any[]): ID3PlusInterface;
    type(type: string): ID3PlusInterface;
    id(id: string | string[] | any): ID3PlusInterface;
    text(text: string | string[]): ID3PlusInterface;
    x(text: string | string[] | any): ID3PlusInterface;
    y(text: string | string[] | any): ID3PlusInterface;
    legend(data?: boolean | any): ID3PlusInterface;
    color(func: any): ID3PlusInterface;
    time(time: string): ID3PlusInterface;
    coords(topojson: any): ID3PlusInterface;
    size(data: any): ID3PlusInterface;
    format(data: any): ID3PlusInterface;
    mouse(data: any): ID3PlusInterface;
    shape(data: any): ID3PlusInterface;
    shape(data: any): ID3PlusInterface;
    depth(data: any): ID3PlusInterface;
    attrs(data: any): ID3PlusInterface;
    labels(data: any): ID3PlusInterface;
    cols(data: any): ID3PlusInterface;
    axes(data: any): ID3PlusInterface;
    font(data: any): ID3PlusInterface;
    edges(data: any): ID3PlusInterface;
    nodes(data: any): ID3PlusInterface;
    focus(data: any): ID3PlusInterface;
    timeline(data: any): ID3PlusInterface;
    order(data: any): ID3PlusInterface;
    draw(): ID3PlusInterface;
    ui: any;
    tooltip: any;
    client: {
        ie: boolean;
    };
    evt: {
        over: any;
        out: any;
    };
    textwrap(): ID3PlusInterface;
    resize(b: boolean): ID3PlusInterface;
}

declare var d3plus: ID3PlusInterface;

declare var dimple: any;

declare module "react-dnd-html5-backend" {
    export default HTML5Backend;
}

interface XlsxUtils {
    sheet_to_json(data: XlsxSheet);
}

interface XlsxWorkBook {
    SheetNames: string[];
    Sheets: XlsxSheet[];
}

interface XlsxSheet {

}

declare module "xlsx" {
    export function read(data: any, options: { type: string }): XlsxWorkBook;
    export var utils: XlsxUtils;
}
interface PgNotificationOptions {
    thumbnail?: string;
    style: string;
    message: string;
    position: string;
    timeout?: number;
    type: string;
}

interface JQuery {
    pgNotification(options: PgNotificationOptions): JQuery;
    bootstrapWizard(options: any): JQuery;
    bootstrapWizard(options: any, options2: any): JQuery;
    select2(options?: any): JQuery;
    select2(options?: any, options2?: any): JQuery;
    dataTable(options?: any): JQuery;
    fnFilter(val: any): JQuery;
    gridstack(options: any): JQuery;
    modal(options: any): JQuery;
    Dropdown(): JQuery;
    liveTile(): JQuery;
    pivot(data: any[], options: any): JQuery;
}

interface JQueryStatic {
    powerTour(tourOptions: any): JQuery;
    pivotUtilities: any;
}

declare namespace __React {
    interface HTMLProps<T> extends HTMLAttributes, Props<T> {
        _grid?: any;
    }
}


declare var ColorPicker: any;
declare module "react-input-color" {
    export default ColorPicker;
}

declare var Select: any;
declare module "react-select" {
    export default Select;
}

declare var TagsInput: any;
declare module "react-tagsinput" {
    export default TagsInput;
}

declare var DateRangePicker: any;

declare module "react-bootstrap-daterangepicker" {
    export default DateRangePicker;
}

declare module "react-selectize" {
    export var SimpleSelect: __React.Component<any, any>;
}

declare var ReactDataGrid: any;

declare module "react-data-grid/addons" {
    export default ReactDataGrid;
}
declare var CheckboxTree: any;
declare module "react-checkbox-tree" {
    export default CheckboxTree;
}
declare module "pako" {
}

declare var injectTapEventPlugin: () => void;
declare module "react-tap-event-plugin" {
    export default injectTapEventPlugin;
}

declare var keymage: any;

declare module "react-mentions" {
    export var MentionsInput: any;
    export var Mention: any;
}

declare var Sortable: any;

declare module "sortablejs" {
    export default Sortable;
}

declare var Editor: any;
declare module "draft-js-plugins-editor" {
    export default Editor;
    
}

declare var createMentionPlugin: any;
declare module "draft-js-mention-plugin" {
    export default createMentionPlugin;
    export var defaultSuggestionsFilter: any;
}

declare var createHashtagPlugin: any;
declare module "draft-js-hashtag-plugin" {
    export default createHashtagPlugin;
}

declare module "immutable" {
    export var fromJS :any;
}

declare module "draft-js" {
    export var EditorState: any;
}

declare var Datamap: any;
declare module "datamaps" {
    export default Datamap;
}
