mini.CheckBoxList = function() {
    mini.CheckBoxList.superclass.constructor.apply(this, arguments);
}
mini.extend(mini.CheckBoxList, mini.ListControl, {
    formField: true,
    _labelFieldCls: 'mini-labelfield-checkboxlist',

    multiSelect: true,
    repeatItems: 0,
    repeatLayout: "none",
    repeatDirection: "horizontal",

    _itemCls: "mini-checkboxlist-item",
    _itemHoverCls: "mini-checkboxlist-item-hover",
    _itemSelectedCls: "mini-checkboxlist-item-selected",

    _tableCls: "mini-checkboxlist-table",
    _tdCls: "mini-checkboxlist-td",
    _checkType: "checkbox",

    uiCls: "mini-checkboxlist",
    _create: function() {
        var el = this.el = document.createElement("div");
        this.el.className = this.uiCls;

        this.el.innerHTML = '<table cellpadding="0" border="0" cellspacing="0" style="display:table;"><tr><td><div class="mini-list-inner"></div><div class="mini-errorIcon"></div><input type="hidden" /></td></tr></table>';

        this.cellEl = el.getElementsByTagName("td")[0];
        this._innerEl = this.cellEl.firstChild;
        this._valueEl = this.cellEl.lastChild;
        this._errorIconEl = this.cellEl.childNodes[1];

        this._borderEl = this.el.firstChild;
        var A = this;
        mini_on(this.el, "keyup", function(e) {
            if (e.keyCode == 32) $(e.target).click()
        })
    },
    _getRepeatTable: function() {
        var table = [];
        if (this.repeatItems > 0) {
            if (this.repeatDirection == "horizontal") {
                var row = [];
                for (var i = 0, l = this.data.length; i < l; i++) {
                    var item = this.data[i];
                    if (row.length == this.repeatItems) {
                        table.push(row);
                        row = [];
                    }
                    row.push(item);
                }
                table.push(row);
            } else {
                var len = this.repeatItems > this.data.length ? this.data.length : this.repeatItems;
                for (var i = 0, l = len; i < l; i++) {
                    table.push([]);
                }
                for (var i = 0, l = this.data.length; i < l; i++) {
                    var item = this.data[i];
                    var index = i % this.repeatItems;
                    table[index].push(item);
                }
            }
        } else {
            table = [this.data.clone()];
        }
        return table;
    },
    doUpdate: function() {
        var data = this.data;
        var s = "";

        for (var i = 0, l = data.length; i < l; i++) {
            var item = data[i];
            item._i = i;
        }

        if (this.repeatLayout == "flow") {

            var table = this._getRepeatTable();
            for (var i = 0, l = table.length; i < l; i++) {
                var row = table[i];
                for (var j = 0, k = row.length; j < k; j++) {
                    var item = row[j];
                    s += this._createItemHtml(item, item._i);
                }
                if (i != l - 1) {
                    s += '<br/>';
                }
            }


        } else if (this.repeatLayout == "table") {
            var table = this._getRepeatTable();
            s += '<table class="' + this._tableCls + '" cellpadding="0" cellspacing="1">';
            for (var i = 0, l = table.length; i < l; i++) {
                var row = table[i];
                s += '<tr>';
                for (var j = 0, k = row.length; j < k; j++) {
                    var item = row[j];
                    s += '<td class="' + this._tdCls + '">';
                    s += this._createItemHtml(item, item._i);
                    s += '</td>';
                }
                s += '</tr>';
            }
            s += '</table>';
        } else {
            for (var i = 0, l = data.length; i < l; i++) {
                var item = data[i];
                s += this._createItemHtml(item, i);
            }
        }
        this._innerEl.innerHTML = s;

        for (var i = 0, l = data.length; i < l; i++) {
            var item = data[i];
            delete item._i;
        }
    },
    _createItemHtml: function(item, index) {
        var e = this._OnDrawItem(item, index);
        var id = this._createItemId(index);
        var ckId = this._createCheckId(index);
        var ckValue = this.getItemValue(item);

        var disable = '';

        var s = '<div id="' + id + '" index="' + index + '" class="' + this._itemCls + ' ';
        if (item.enabled === false) {
            s += ' mini-disabled ';
            disable = 'disabled';
        }

        var onclick = 'onclick="return false"';

        onclick = 'onmousedown="this._checked = this.checked;" onclick="this.checked = this._checked"';


        s += e.itemCls + '" style="' + e.itemStyle + '"><span class="mini-list-icon"></span><input style="display:none;" ' + onclick + ' ' + disable + ' value="' + ckValue + '" id="' + ckId + '" type="' + this._checkType + '" /><label for="' + ckId + '" onclick="return false;">';
        s += e.itemHtml + '</label></div>';
        return s;
    },
    _OnDrawItem: function(item, index) {
        var value = this.getItemText(item);
        var e = {
            index: index,
            item: item,
            itemHtml: value,
            itemCls: "",
            itemStyle: ""
        };
        this.fire("drawitem", e);

        if (e.itemHtml === null || e.itemHtml === undefined) e.itemHtml = "";

        return e;
    },

    setRepeatItems: function(value) {
        value = parseInt(value);
        if (isNaN(value)) value = 0;
        if (this.repeatItems != value) {
            this.repeatItems = value;
            this.doUpdate();
        }
    },
    getRepeatItems: function() {
        return this.repeatItems;
    },
    setRepeatLayout: function(value) {
        if (value != "flow" && value != "table") value = "none";
        if (this.repeatLayout != value) {
            this.repeatLayout = value;
            this.doUpdate();
        }
    },
    getRepeatLayout: function() {
        return this.repeatLayout;
    },
    setRepeatDirection: function(value) {
        if (value != "vertical") value = "horizontal";
        if (this.repeatDirection != value) {
            this.repeatDirection = value;
            this.doUpdate();
        }
    },
    getRepeatDirection: function() {
        return this.repeatDirection;
    },

    getAttrs: function(el) {
        var attrs = mini.CheckBoxList.superclass.getAttrs.call(this, el);
        var jq = jQuery(el);

        mini._ParseString(el, attrs, [
            "ondrawitem"
        ]);

        var repeatItems = parseInt(jq.attr("repeatItems"));
        if (!isNaN(repeatItems)) {
            attrs.repeatItems = repeatItems;
        }
        var repeatLayout = jq.attr("repeatLayout");
        if (repeatLayout) {
            attrs.repeatLayout = repeatLayout;
        }
        var repeatDirection = jq.attr("repeatDirection");
        if (repeatDirection) {
            attrs.repeatDirection = repeatDirection;
        }
        return attrs;
    }
});
mini.regClass(mini.CheckBoxList, "checkboxlist");
