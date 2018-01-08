mini.EditGrid = function() {
    mini.EditGrid.superclass.constructor.apply(this, arguments);
    this.el.className += ' mini-datagrid';
}
//  allowCellEdit 属性为不用设置, 默认为false, 否者失效
//  updateRow, updateRow同时保存编辑数据，以达到重绘数据
//  getEditRowData 返回row数据，而不是拷贝引用
//  减小不必要row重绘
mini.extend(mini.EditGrid, mini.DataGrid, {
    uiCls: "mini-editgrid",
	formField: true,
	_rowSelectedCls: '',
	_rowHoverCls: '',
	getValue: function(){
		return this.getData(); // getAllData
	},
	setValue: function(obj){
		mini.EditGrid.superclass.setData.call(this, obj);
	},
	setData: function(data){
		mini.EditGrid.superclass.setData.call(this, data);
	},
	getData: function(){
		var all = true;
		var data = [];
        var dataView = this.getDataView();
        for (var i = 0, l = dataView.length; i < l; i++) {
            var row = dataView[i];
            if (row._editing == true) {
                var rowData = this.getEditRowData(i, all);
                data.push(rowData);
            } else {
            	var rowData = this.getRow(i);
                data.push(rowData);
            }
        }
        return data;
	},
    getEditRowData: function(row, all, deep) {
        row = this.getRow(row);

        if (!row || !row._editing) return null;

        var idField = this.getIdField();
        var pidField = this.getParentField ? this.getParentField() : null;

        var rowData = {};

        var columns = this.getVisibleColumns();
        for (var i = 0, l = columns.length; i < l; i++) {
            var column = columns[i];
            var cellId = this._createCellId(row, columns[i]);
            var cellEl = document.getElementById(cellId);

            if (!cellEl) continue;

            var e = null;
            if (column.type == "checkboxcolumn" || column.type == "radiobuttoncolumn") {

                var checked = column.isChecked(row, column);
                var value = checked ? column.trueValue : column.falseValue;
                e = this._OnCellCommitEdit(row, column, value);

            } else {
                var editorEl = cellEl.firstChild;
                var editor = mini.get(editorEl);
                if (!editor) continue;
                e = this._OnCellCommitEdit(row, column, null, editor);
            }
            if (deep !== false) {
                mini._setMap(column.field, e.value, rowData);
                if (column.displayField) {
                    mini._setMap(column.displayField, e.text, rowData);
                }
            } else {
                rowData[column.field] = e.value;
                if (column.displayField) {
                    rowData[column.displayField] = e.text;
                }
            }
        }

        rowData[idField] = row[idField];
        if (pidField) {
            rowData[pidField] = row[pidField];
        }

        if (all) {
            // var o = mini.copyTo({}, row);
            rowData = mini.copyTo(row, rowData);
        }

        return rowData;
    },
    doUpdateRows: function() {
    	var me = this;
    	// 重载渲染
    	mini.EditGrid.superclass.doUpdateRows.call(this);
    	this.switchEditStatus();
    },
    _createRowHTML: function(){
        return mini.EditGrid.superclass._createRowHTML.apply(this, arguments);
    },
    _OnDrawCell: function(){
        return mini.EditGrid.superclass._OnDrawCell.apply(this, arguments);
    },
    _doUpdateRowEl: function(row){
        var columns1 = this.getFrozenColumns();
        var columns2 = this.getUnFrozenColumns();

        var rowEl1, rowEl2;

        var rowIndex = this.indexOf(row);

        var s = this._createRowHTML(row, rowIndex, columns2, 2);
        var rowEl = this._getRowEl(row, 2);
        if (!rowEl) return;


        jQuery(rowEl).before(s);
        rowEl1 = rowEl.previousSibling;

        if (rowEl) rowEl.parentNode.removeChild(rowEl);

        if (this.isFrozen()) {
            var s = this._createRowHTML(row, rowIndex, columns1, 1);
            var rowEl = this._getRowEl(row, 1);
            jQuery(rowEl).before(s);
            rowEl2 = rowEl.previousSibling;

            jQuery(rowEl).remove();
        }

        this.swbeginEditRow(row);
        this.deferLayout();
        if (rowEl1 && rowEl2) {
            this._doSyncRowHeight(rowEl1, rowEl2);
        }
    },
    __doUpdateRowEl: function(row){
        var columns1 = this.getFrozenColumns();
        var columns2 = this.getUnFrozenColumns();

        var rowEl1, rowEl2;

        var rowIndex = this.indexOf(row);

        var s = this._createRowHTML(row, rowIndex, columns2, 2);
        var rowEl = this._getRowEl(row, 2);
        if (!rowEl) return;


        jQuery(rowEl).before(s);
        rowEl1 = rowEl.previousSibling;

        if (rowEl) rowEl.parentNode.removeChild(rowEl);

        if (this.isFrozen()) {
            var s = this._createRowHTML(row, rowIndex, columns1, 1);
            var rowEl = this._getRowEl(row, 1);
            jQuery(rowEl).before(s);
            rowEl2 = rowEl.previousSibling;

            jQuery(rowEl).remove();
        }

        // this.deferLayout();
        if (rowEl1 && rowEl2) {
            this._doSyncRowHeight(rowEl1, rowEl2);
        }
    },
    swbeginEditRow: function(row) {
        var me = this;
        if (this.allowCellEdit) return;

        function beginEdit(row) {
            var sss = new Date();

            row = this.getRow(row);
            if (!row) return;
            var rowEl = this._getRowEl(row, 2);
            if (!rowEl) return;

            row._editing = true;
            this.__doUpdateRowEl(row);

            var rowEl = this._getRowEl(row, 2);
            mini.addClass(rowEl, "mini-grid-rowEdit");

            var columns = this.getVisibleColumns();
            for (var i = 0, l = columns.length; i < l; i++) {
                var column = columns[i];
                var value = row[column.field];

                var cellEl = me._getCellEl(row, column);
                if (!cellEl) continue;

                if (typeof column.editor == "string") {
                    column.editor = eval('(' + column.editor + ')');
                }

                var editorConfig = mini.copyTo({}, column.editor);

                editorConfig.id = me.uid + "$" + row._uid + "$" + column._id + "$editor";
                var editor = mini.create(editorConfig);
                if (me._OnCellBeginEdit(row, column, editor)) {
                    if (editor) {
                        mini.addClass(cellEl, "mini-grid-cellEdit");
                        cellEl.innerHTML = "";
                        cellEl.appendChild(editor.el);
                        mini.addClass(editor.el, "mini-grid-editor");
                    }
                }
            }
            this.doLayout();
        }

        this._pushUpdateCallback(beginEdit, this, [row]);
    },
    // getRowByUID: function(uid){
    //     return  mini.EditGrid.superclass.getRowByUID.call(this, uid);
    // },
    switchEditStatus: function(data){
    	var me = this;
		data = data || this.getData();
		mini.forEach(data, function(row){
			me.swbeginEditRow(row);
		});
        // this.deferLayout();
    },
    doUpdate: function(){
        mini.EditGrid.superclass.doUpdate.apply(this, arguments);
    },
    addRow: function(record){
    	mini.EditGrid.superclass.addRow.apply(this, arguments);
        this.swbeginEditRow(record);
    },
    updateRow: function(row, data, options){
        if (this.allowCellEdit) return;
        row = this.getRow(row);
        if (!row || !row._editing) return;
        var rowData = this.getEditRowData(row, false, false);
        var ss = $.extend(rowData, data);
        mini.EditGrid.superclass.updateRow.call(this, row, ss, options);
    },
    updateColumn: function(){
    	mini.EditGrid.superclass.updateColumn.apply(this, arguments);
    },
    validate: function(data) {
        data = data || this.getData();
        if (!mini.isArray(data)) data = [];
        for (var i = 0, l = data.length; i < l; i++) {
            var row = data[i];
            this.validateRow(row);
        }
        return this.isValid();
    }
});

mini.regClass(mini.EditGrid, 'editgrid');
