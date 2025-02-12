if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};
if(!javaxt.dhtml.style) javaxt.dhtml.style={};

//******************************************************************************
//**  Default Style
//******************************************************************************
/**
 *   Common style definitions for JavaXT components.
 *
 ******************************************************************************/

javaxt.dhtml.style.default = {

    window : {
        panel: "window",
        header: "panel-header window-header",
        title: "window-title",
        button: "window-header-button",
        buttonBar: "window-header-button-bar",
        footerButton: "form-button noselect",
        body: "window-body",
        mask: "window-mask"
    },


    callout : {
        panel: "callout-panel",
        arrow: "callout-arrow"
    },


    form : {
        label: "form-label noselect",
        input: "form-input",
        icon: {
            padding: "0 8px 6px 0"
        },
        button: "form-button noselect",
        radio: "form-radio noselect",
        checkbox: "form-checkbox",
        groupbox: "form-groupbox",
        grouplabel: "form-grouplabel noselect",
        error: {
            input: "form-input-error",
            callout: {
                panel: "error-callout-panel",
                arrow: "error-callout-arrow"
            }
        }
    },


    combobox : {
        input: "form-input form-input-with-button",
        button: "form-button form-input-button pulldown-button-icon",
        menu: "form-input-menu",
        option: "form-input-menu-item",
        newOption: "form-input-menu-item form-input-menu-item-new"
    },


    checkbox : {
        panel: "checkbox-panel",
        box: "checkbox-box",
        label: "checkbox-label",
        check: "checkbox-check",
        select: "checkbox-select",
        disable: "checkbox-disable",
        hover: "checkbox-hover"
    },


    button: {
        button: "button",
        select: "button-selected",
        label: "button-label"
    },


    toolbarButton : {
        button: "toolbar-button",
        select: "toolbar-button-selected",
        hover:  "toolbar-button-hover",
        label: "toolbar-button-label"
    },

    iscroll: {
        horizontalScrollbar: "iScrollHorizontalScrollbar",
        verticalScrollbar: "iScrollVerticalScrollbar",
        indicator: "iScrollIndicator"
    },

    table: {
        headerRow: "table-header",
        headerColumn : "table-header-col",
        row: "table-row",
        column: "table-col",
        selectedRow: "table-row-selected",
        resizeHandle: "table-resizeHandle",
        ascendingSortIcon: "table-icon-sort-asc",
        descendingSortIcon: "table-icon-sort-desc",
        iscroll: null //updated below
    },

    tabPanel: {
        tabBar: "tab-bar",
        activeTab: "tab-active",
        inactiveTab: "tab-inactive",
        tabBody: "tab-body"
    },

    switch: {
        groove: "switch-groove",
        handle: "switch-handle",
        grooveActive: "switch-groove-active",
        handleActive: "switch-handle-active"
    },

    slider: {
        groove: "slider-groove",
        handle: "slider-handle"
    },

    datePicker: {
        panel: "date-picker-panel",
        header: "date-picker-header",
        title: "date-picker-title",
        cell: "date-picker-cell",
        cellHeader: "date-picker-cell-header",
        today: "date-picker-cell-today",
        selectedRow: "date-picker-row-selected",
        selectedCell: "date-picker-cell-selected",
        next: "date-picker-next",
        back: "date-picker-back"
    },


    merge : function(settings, defaults) {
        javaxt.dhtml.utils.merge(settings, defaults);
        return settings;
    }
};

javaxt.dhtml.style.default.table.iscroll = javaxt.dhtml.style.default.iscroll;