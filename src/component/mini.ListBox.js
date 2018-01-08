mini.ListBox = function() {
    mini.ListBox.superclass.constructor.apply(this, arguments);
}
mini.extend(mini.ListBox, mini.ListControl, {
    formField: true,


    columns: null,
    columnWidth: 80,

    showNullItem: false,
    nullItemText: "",

    showEmpty: false,
    emptyText: "",

    showCheckBox: false,
    showAllCheckBox: true,
    multiSelect: false,

    _itemCls: "mini-listbox-item",
    _itemHoverCls: "mini-listbox-item-hover",
    _itemSelectedCls: "mini-listbox-item-selected",

    uiCls: "mini-listbox",
    _create: function() {
        var el = this.el = document.createElement("div");
        this.el.className = "mini-listbox";

        this.el.innerHTML = '<div class="mini-listbox-border"><div class="mini-listbox-header"></div><div class="mini-listbox-view"></div><input type="hidden"/></div><div class="mini-errorIcon"></div>';

        this._borderEl = this.el.firstChild;
        this._headerEl = this._borderEl.firstChild;
        this._viewEl = this._borderEl.childNodes[1];
        this._valueEl = this._borderEl.childNodes[2];

        this._errorIconEl = this.el.lastChild;

        this._scrollViewEl = this._viewEl;


        this._viewEl.innerHTML = '<div class="mini-grid-rows-content"></div>';

        this._contentEl = this._viewEl.firstChild;
    },
    _initEvents: function() {
        mini.ListBox.superclass._initEvents.call(this);
        mini._BindEvents(function() {
            mini_onOne(this._viewEl, "scroll", this.__OnScroll, this);


        }, this);

    },
    destroy: function(removeEl) {
        if (this._viewEl) {
            this._viewEl.onscroll = null;
            mini.clearEvent(this._viewEl);
            this._viewEl = null;
        }
        this._borderEl = this._headerEl = this._viewEl = this._valueEl = this._errorIconEl = this._scrollViewEl = this._contentEl = null;
        mini.ListBox.superclass.destroy.call(this, removeEl);
    },
    setColumns: function(value) {

        if (!mini.isArray(value)) value = [];
        this.columns = value;

        for (var i = 0, l = this.columns.length; i < l; i++) {
            var column = this.columns[i];

            if (column.type) {
                if (!mini.isNull(column.header) && typeof column.header !== "function") {
                    if (column.header.trim() == "") {
                        delete column.header;
                    }
                }
                var col = mini._getColumn(column.type);
                if (col) {
                    var _column = mini.copyTo({}, column);
                    mini.copyTo(column, col);
                    mini.copyTo(column, _column);
                }
            }

            var width = parseInt(column.width);
            if (mini.isNumber(width) && String(width) == column.width) column.width = width + "px";
            if (mini.isNull(column.width)) column.width = this.columnWidth + "px";
        }

        this.doUpdate();
    },
    isVisibleColumn: function($) {
        $ = this.getColumn($);
        if ($.visible == false) return false;
        return true
    },
    getColumn: function(index) {
        var t = typeof index;
        if (t == "number") return this.columns[index];
        else if (t == "object") return index;
        else {
            for (var i = 0, len = this.columns.length; i < len; i++) {
                var column = this.columns[i];
                if (column.name == index) return column
            }
            return null
        }
    },
    hideColumn: function($) {
        $ = this.getColumn($);
        if (!$) return;
        $.visible = false;
        this.doUpdate()
    },
    showColumn: function($) {
        $ = this.getColumn($);
        if (!$) return;
        $.visible = true;
        this.doUpdate()
    },
    getColumns: function() {
        return this.columns;
    },
    doUpdate: function() {
        if (this._allowUpdate === false) return;
        var hasColumns = this.columns && this.columns.length > 0;
        if (hasColumns) {
            mini.addClass(this.el, "mini-listbox-showColumns");
        } else {
            mini.removeClass(this.el, "mini-listbox-showColumns");
        }
        this._headerEl.style.display = hasColumns ? "" : "none";

        var sb = [];
        if (hasColumns) {
            sb[sb.length] = '<table class="mini-listbox-headerInner" cellspacing="0" cellpadding="0"><tr>';
            var ckAllId = this.uid + "$ck$all";
            sb[sb.length] = '<td class="mini-listbox-checkbox"><input type="checkbox" id="' + ckAllId + '"></td>';
            for (var j = 0, k = this.columns.length; j < k; j++) {
                var column = this.columns[j];
                var header = column.header;
                if (mini.isNull(header)) header = '&nbsp;';

                var w = column.width;
                if (mini.isNumber(w)) w = w + "px";

                sb[sb.length] = '<td class="';
                if (column.headerCls) sb[sb.length] = column.headerCls;
                sb[sb.length] = '" style="';
                if (column.headerStyle) sb[sb.length] = column.headerStyle + ";";
                if (w) {
                    sb[sb.length] = 'width:' + w + ';';
                }
                if (column.headerAlign) {
                    sb[sb.length] = 'text-align:' + column.headerAlign + ';';
                }
                sb[sb.length] = '">';
                sb[sb.length] = header;
                sb[sb.length] = '</td>';
            }
            sb[sb.length] = '</tr></table>';
        }
        this._headerEl.innerHTML = sb.join('');

        var sb = [];
        var data = this.data;

        sb[sb.length] = '<table class="mini-listbox-items" cellspacing="0" cellpadding="0">';

        if (this.showEmpty && data.length == 0) {

            sb[sb.length] = '<tr><td colspan="20">' + this.emptyText + '</td></tr>';
        } else {
            this._doNullItem();

            for (var i = 0, l = data.length; i < l; i++) {
                var item = data[i];

                var rowClsIndex = -1;
                var rowCls = " ";
                var rowStyleIndex = -1;
                var rowStyle = " ";

                sb[sb.length] = '<tr id="';
                sb[sb.length] = this._createItemId(i);
                sb[sb.length] = '" index="';
                sb[sb.length] = i;
                sb[sb.length] = '" class="mini-listbox-item ';

                if (item.enabled === false) {
                    sb[sb.length] = ' mini-disabled ';
                }

                rowClsIndex = sb.length;
                sb[sb.length] = rowCls;
                sb[sb.length] = '" style="';
                rowStyleIndex = sb.length;
                sb[sb.length] = rowStyle;
                sb[sb.length] = '">';

                var ckid = this._createCheckId(i);
                var ckName = this.name;
                var ckValue = this.getItemValue(item);

                var disable = '';
                if (item.enabled === false) {
                    disable = 'disabled';
                }

                if (item.__NullItem === true) {
                    sb[sb.length] = '<td class="mini-listbox-checkbox"></td>';
                } else {
                    sb[sb.length] = '<td class="mini-listbox-checkbox"><input ' + disable + ' id="' + ckid + '" type="checkbox" ></td>';
                }

                if (hasColumns) {
                    for (var j = 0, k = this.columns.length; j < k; j++) {
                        var column = this.columns[j];

                        var e = this._OnDrawCell(item, i, column);

                        var w = column.width;
                        if (typeof w == "number") w = w + "px";

                        sb[sb.length] = '<td class="';
                        if (e.cellCls) sb[sb.length] = e.cellCls;
                        sb[sb.length] = '" style="';
                        if (e.cellStyle) sb[sb.length] = e.cellStyle + ";";
                        if (w) {
                            sb[sb.length] = 'width:' + w + ';';
                        }
                        if (column.align) {
                            sb[sb.length] = 'text-align:' + column.align + ';';
                        }
                        sb[sb.length] = '">';
                        sb[sb.length] = e.cellHtml;
                        sb[sb.length] = '</td>';

                        if (e.rowCls) rowCls = e.rowCls;
                        if (e.rowStyle) rowStyle = e.rowStyle;
                    }
                } else {
                    var e = this._OnDrawCell(item, i, null);
                    sb[sb.length] = '<td class="';
                    if (e.cellCls) sb[sb.length] = e.cellCls;
                    sb[sb.length] = '" style="';
                    if (e.cellStyle) sb[sb.length] = e.cellStyle;
                    sb[sb.length] = '">';
                    sb[sb.length] = e.cellHtml;
                    sb[sb.length] = '</td>';

                    if (e.rowCls) rowCls = e.rowCls;
                    if (e.rowStyle) rowStyle = e.rowStyle;
                }

                sb[rowClsIndex] = rowCls;
                sb[rowStyleIndex] = rowStyle;

                sb[sb.length] = '</tr>';
            }
        }
        sb[sb.length] = '</table>';

        var innerHTML = sb.join("");

        this._viewEl.firstChild.innerHTML = innerHTML;

        this._doSelects();

        this.doLayout();
    },
    doLayout: function(isValid) {

        if (!this.canLayout()) return;

        if (this.columns && this.columns.length > 0) {
            mini.addClass(this.el, "mini-listbox-showcolumns");
        } else {
            mini.removeClass(this.el, "mini-listbox-showcolumns");
        }
        if (this.showCheckBox) {
            mini.removeClass(this.el, "mini-listbox-hideCheckBox");
        } else {
            mini.addClass(this.el, "mini-listbox-hideCheckBox");
        }

        var ckAllId = this.uid + "$ck$all";
        var ck = document.getElementById(ckAllId);
        if (ck) ck.style.display = this.showAllCheckBox ? "" : "none";

        var viewEl = this._viewEl;
        var autoHeight = this.isAutoHeight();

        if (autoHeight) viewEl.style.height = "auto";

        var h = this.getHeight(true);

        var w = mini.getWidth(this._borderEl, true);
        var elWidth = w;

        if (!mini.isIE6) viewEl.style.width = w + "px";

        var h2 = mini.getHeight(this._headerEl);
        h = h - h2;
        viewEl.style.height = h + "px";

        if (isIE) {
            var table1 = this._headerEl.firstChild,
                table2 = this._viewEl.firstChild.firstChild;
            if (this._viewEl.offsetHeight >= this._viewEl.scrollHeight) {
                table2.style.width = "100%";
                if (table1) table1.style.width = "100%";
            } else {

                var w = parseInt(table2.parentNode.offsetWidth) + 'px'

                if (table1) table1.style.width = w;
            }
        }
        if (this._viewEl.offsetHeight < this._viewEl.scrollHeight) {

            var scrollBarWidth = jQuery(this._viewEl).width() - jQuery(this._contentEl).width();
            this._headerEl.style.width = (elWidth - scrollBarWidth) + "px";

        } else {
            this._headerEl.style.width = "100%";
        }

    },
    setShowCheckBox: function(value) {
        this.showCheckBox = value;
        this.doLayout();
    },
    getShowCheckBox: function() {
        return this.showCheckBox;
    },
    setShowAllCheckBox: function(value) {
        this.showAllCheckBox = value;
        this.doLayout();
    },
    getShowAllCheckBox: function() {
        return this.showAllCheckBox;
    },
    setShowNullItem: function(value) {
        if (this.showNullItem != value) {
            this.showNullItem = value;

            this._doNullItem();

            this.doUpdate();
        }
    },
    getShowNullItem: function() {
        return this.showNullItem;
    },
    setNullItemText: function(value) {

        if (this.nullItemText != value) {
            this.nullItemText = value;

            this._doNullItem();

            this.doUpdate();
        }
    },
    getNullItemText: function() {
        return this.nullItemText;
    },
    _doNullItem: function() {
        for (var i = 0, l = this.data.length; i < l; i++) {
            var item = this.data[i];
            if (item.__NullItem) {
                this.data.removeAt(i);
                break;
            }
        }
        if (this.showNullItem) {
            var item = {
                __NullItem: true
            };
            item[this.textField] = "";
            item[this.valueField] = "";
            this.data.insert(0, item);
        }
    },
    _OnDrawCell: function(record, index, column) {
        var value = column ? mini._getMap(column.field, record) : this.getItemText(record);
        var e = {
            sender: this,
            index: index,
            rowIndex: index,
            record: record,
            item: record,
            column: column,
            field: column ? column.field : null,
            value: value,
            cellHtml: value,
            rowCls: null,
            cellCls: column ? (column.cellCls || '') : "",
            rowStyle: null,
            cellStyle: column ? (column.cellStyle || '') : ""
        };

        var hasColumns = this.columns && this.columns.length > 0;
        if (!hasColumns) {
            if (index == 0 && this.showNullItem) {
                e.cellHtml = this.nullItemText;
            }
        }
        if (e.autoEscape == true) {
            e.cellHtml = mini.htmlEncode(e.cellHtml);
        }

        if (column) {
            if (column.dateFormat) {
                if (mini.isDate(e.value)) e.cellHtml = mini.formatDate(value, column.dateFormat);
                else e.cellHtml = value;
            }
            var renderer = column.renderer;
            if (renderer) {
                fn = typeof renderer == "function" ? renderer : window[renderer];
                if (fn) {
                    e.cellHtml = fn.call(column, e);
                }
            }
        }

        this.fire("drawcell", e);

        if (e.cellHtml === null || e.cellHtml === undefined || e.cellHtml === "") e.cellHtml = "&nbsp;";

        return e;
    },
    __OnScroll: function(e) {
        this._headerEl.scrollLeft = this._viewEl.scrollLeft;
    },
    __OnClick: function(e) {

        var ckAllId = this.uid + "$ck$all";
        if (e.target.id == ckAllId) {
            var ck = document.getElementById(ckAllId);
            if (ck) {
                var checked = ck.checked;

                var value = this.getValue();;

                if (checked) {
                    this.selectAll();
                } else {
                    this.deselectAll();
                }
                this._OnSelectionChanged();

                if (value != this.getValue()) {
                    this._OnValueChanged();

                    this.fire("itemclick", {
                        htmlEvent: e
                    });
                }
            }
            return;
        }

        this._fireEvent(e, 'Click');
    },
    setValue: function($) {
        mini.ListBox.superclass.setValue.call(this, $);
        this._doCheckState()
    },
    _doCheckState: function() {
        var $ = this.uid + "$ck$all",
            _ = jQuery(document.getElementById($));
        if (this._isSelectedAll() && this.getSelecteds().length != 0) _.prop("checked", true);
        else _.prop("checked", false)
    },
    _OnValueChanged: function($) {
        mini.ListBox.superclass._OnValueChanged.call(this);
        this._doCheckState()
    },
    getAttrs: function(el) {
        var attrs = mini.ListBox.superclass.getAttrs.call(this, el);

        mini._ParseString(el, attrs, ["nullItemText", "ondrawcell"]);
        mini._ParseBool(el, attrs, ["showCheckBox", "showAllCheckBox", "showNullItem"]);

        if (el.nodeName.toLowerCase() != "select") {
            var cs = mini.getChildNodes(el);
            for (var i = 0, l = cs.length; i < l; i++) {
                var node = cs[i];
                var property = jQuery(node).attr("property");
                if (!property) continue;
                property = property.toLowerCase();
                if (property == "columns") {
                    attrs.columns = mini._ParseColumns(node);
                } else if (property == "data") {
                    attrs.data = node.innerHTML;
                }
            }
        }

        return attrs;
    }
});
mini.regClass(mini.ListBox, "listbox");
