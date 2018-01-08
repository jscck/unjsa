/*
    标准模板：弹出选择面板
    注意，只需要修改搜索框和mini.DataGrid相关的列配置信息即可。
*/

mini.BaseSelectWindow = function (el, options) {
    options || (options = {});
    mini.BaseSelectWindow.superclass.constructor.apply(this, arguments);

    if(!this.filterFields){
        this.filterFields = [{type: 'textbox', name: 'key', width: '250', emptyText: (options.keyLable || this.keyLable).replace('：', '')}];
    }

    var allowPass = ['initGrid', 'dblClickSelect', 'gridcolumns', 'filterFields', 'keyLable', 'url', 'title','filterSelected', 'multiSelect',
    'crossPageSelect', 'keyField',  'params', 'closeAction', 'showPager', 'showSearch', 'showFooter', 'showToolbar', 'showCheckColumn', 'idField', 'ajaxType', 'okButtonLabel', 'cancelButtonLabel'];

    for(var i in options){
        if(~allowPass.indexOf(i) && options[i] !== undefined){
            this[i] = options[i];
        }
    }

    // 兼容
    if(this.filterFields && this.filterFields[0].emptyText == 'KEYLABLE'){
         this.filterFields[0].emptyText = (options.keyLable || this.keyLable).replace('：', '');
    }

    var allowMethods = ['getToolbarHtml', 'getFooterHtml'];
    for(var i in options){
        if(~allowMethods.indexOf(i) && $.isFunction(options[i])){
            this[i] = options[i];
        }
    }

    this.initControls();
    this.initEvents();
}
mini.extend(mini.BaseSelectWindow, mini.Window, {
    url: "",
    keyField: "key",
    multiSelect: false,
    title: "查询",
    keyLable: "KEYLABLE：",  // optional
    searchLable: "查询：",
    width: 760,
    height: 400,
    bodyStyle: "padding:0;",
    allowResize: true,
    showModal: true,
    showToolbar: true,
    showFooter: true,
    showPager: true,
    filterSelected: false,
    crossPageSelect: true,
    dblClickSelect: true,
    closeAction: 'destroy',
    showCheckColumn: false,
    idField: "id",
    ajaxType: "GET",
    gridcolumns: [],
    __selectMaps: {},
    // okButtonLabel: '确定',
    // cancelButtonLabel: '取消',
    getToolbarHtml: function(){
        var labelId = this.id + "$label";
        var topHtml =
            '<div style="padding:5px;text-align:left;" id="'+ this.toolbarBoxId +'">'
                // + '<span id="' + labelId + '">' + this.keyLable + '</span>    '
                // + '<input name="keyText" class="mini-textbox" style="width:250px;"/> '
                + '<a name="searchBtn" class="mini-button">查找</a>'
            + '</div>';
        return topHtml;
    },
    getFooterHtml: function(){
        var footerHtml =
            '<div class="mini-window-buttons" style="padding:8px;text-align:center;">'
                + '<a name="okBtn" class="mini-button mini-button-ok" style="width:60px;">确定</a>       '
                + '<span style="display:inline-block;width:15px;"></span>'
                + '<a name="cancelBtn" class="mini-button mini-button-cancel" style="width:60px;">取消</a>       '
            + '</div>';
        return footerHtml;
    },
    initGrid: function(){
        return new mini.DataGrid();
    },
    initControls: function () {
        var toolbarEl = this.getToolbarEl();
        var footerEl = this.getFooterEl();
        var bodyEl = this.getBodyEl();

        //toolbar
        var labelId = this.id + "$label";

        this.toolbarBoxId = this.id + '$toobar';

        var topHtml = this.getToolbarHtml();

        jQuery(toolbarEl).append(topHtml);

        this.setFilterFields();
        //footer
        var footerHtml = this.getFooterHtml();
        jQuery(footerEl).append(footerHtml);


        var actionCol = { type: "checkcolumn", field:"checkbox", width:'50', headerAlign: "center" };

        /////////////////////////////////////////////////////
        //body
        this.grid = this.initGrid();
        this.grid.on("drawcell", function (e) {
            var record = e.record,
                    column = e.column,
                    field = e.field,
                    value = e.value;
            var type = record.Type;
            if (field == "RecordStatus") {
                if (record.RecordStatus == 0) {
                    e.cellHtml = "未审核";
                } else {
                    e.cellHtml = "已审核";
                }
            }
        });

        if(this.showCheckColumn)
            this.gridcolumns.unshift(actionCol);

        this.grid.set({
            multiSelect: this.multiSelect,
            showPager: this.showPager,
            ajaxType: this.ajaxType,
            idField: this.idField,
            allowCellSelect: true,
            style: "width: 100%;height: 100%;",
            borderStyle: "border:0",
            columns: $.isFunction(this.gridcolumns) ? this.gridcolumns() : this.gridcolumns
        });

        if(this.multiSelect && this.filterSelected){
            this.hooksData();
        }

        if(this.grid instanceof mini.DataGrid){
            this.grid.setUrl(this.url);
        }
        this.grid.render(bodyEl);
        mini.relMethod(this, this.grid, ['load','setIdField', 'getIdField', 'setColumns', 'getColumns']);
        //组件对象
        mini.parse(this.el);

        this._okBtn = mini.getbyName("okBtn", this);
        this._cancelBtn = mini.getbyName("cancelBtn", this);
        this._searchBtn = mini.getbyName("searchBtn", this);
        this._keyText = mini.getbyName("keyText", this);
    },
    setFilterFields: function(fileds){
        this.filterFields = fileds || this.filterFields;
        var toolbarEl = this.getToolbarEl();
        if(this.filterFields && this.filterFields.length){
            var toolabrbox = mini.byId(this.toolbarBoxId, toolbarEl);
            mini.forEach(this.filterFields.reverse(), function(item){
                item.style = 'margin-right: 5px;';
                var field = mini.create(item);
                field.render(toolabrbox, 'prepend');
            })
        }
    },
    initEvents: function () {
        var me = this;
        this._searchBtn && this._searchBtn.on("click", this.__onSearchBtnClick, this);
        if(this._searchBtn){
            var btn = new mini.Button();
            btn.setText("重置");
            btn.setStyle('margin-left: 5px;');
            btn.render(this._searchBtn.el, 'after');
            btn.on("click", function () {
                var cparams = {};
                var params = mini.pluck(this.filterFields, 'name');
                for (var i = 0; i < params.length; i++) {
                    var control = mini.getbyName(params[i], this);
                    if (control) {
                        if(!control.enabled){
                            control.setEnabled(true);
                        }
                        if (control.type == 'datepicker') {
                            control.setText('');
                            control.setValue('');
                        } else {
                            control.setValue('');
                        }
                    }
                }
            }, this);
            this._resetBtn = btn;
        }

        this._keyText && this._keyText.on("enter", this.__onKeyTextEnter, this);

        this._okBtn && this._okBtn.on("click", this.__onOkBtnClick, this);


        this._cancelBtn && this._cancelBtn.on("click", this.__onCancelBtnClick , this);
        this.on("beforebuttonclick", this.__onBeforeButtonClick, this);
        this.grid.on('cellclick', this.__onCellClick, this);

        if(this.dblClickSelect){
            this.setDblClickSelect(true);
        }

        if(this.multiSelect && this.crossPageSelect){
            this.setCrossPageSelect(true);
        }
    },
    __onCellClick: function(ev){
        var me = this;
        var e = ev.htmlEvent;
        var databindEl = mini.findParent(e.target, 'data-bind'); // Cls
        if(databindEl){
            var action = databindEl.getAttribute('data-bind');
            var row = this.grid.getRowByEvent(e);
            var ret = true;
            if (this._Callback) ret = this._Callback(action, row);
            if (ret !== false) {
                setTimeout(function(){
                    me.hide();
                }, 50);
                
            }
        }
        // getRowByEvent
    },
    __onSearchBtnClick: function (e) {
            // var key = this._keyText.getValue();
            // key = $.trim(key);
        var params = mini.pluck(this.filterFields, 'name');
        var cparams = {};
        for (var i = 0; i < params.length; i++) {
            var control = mini.getbyName(params[i], this);
            if (control && control.enabled) {
                if (control.type == 'datepicker') {
                    cparams[params[i]] = control.getText();
                } else {
                    cparams[params[i]] = control.getValue();
                }
            }
        }
        this.search(cparams);
    },
    __onKeyTextEnter: function (e) {
        var key = this._keyText.getValue();
            key = $.trim(key);
            this.search(key);
    },
    __onOkBtnClick: function (e) {
        var ret = true;
        if (this._Callback) ret = this._Callback('ok');
        if (ret !== false) {
            this.hide();
        }
    },
    __onCancelBtnClick: function (e) {
        var ret = true;
        if (this._Callback) ret = this._Callback('cancel');
        if (ret !== false) {
            this.hide();
        }
    },
    __onBeforeButtonClick: function (e) {
        if (e.name == "close") {
            e.cancel = true;
            var ret = true;
            if (this._Callback) ret = this._Callback('close');
            if (ret !== false) {
                this.hide();
            }
        }
    },
    show: function(){
        mini.BaseSelectWindow.superclass.show.call(this);
        this.addCls("mini-window-anim");
    },
    hide: function() {
        mini.BaseSelectWindow.superclass.hide.call(this);
        this.destroy();
    },
    destroy: function (removeEl) {
        this._searchBtn && this._searchBtn.un("click", this.__onSearchBtnClick, this);
        this._resetBtn && this._resetBtn.un("click");
        this._keyText && this._keyText.un("enter", this.__onKeyTextEnter, this);
        this._okBtn && this._okBtn.un("click", this.__onOkBtnClick, this);
        this._cancelBtn && this._cancelBtn.un("click", this.__onCancelBtnClick , this);
        this.un("beforebuttonclick", this.__onBeforeButtonClick, this);

        if(this.multiSelect && this.filterSelected){
            this.grid.un("drawcell", this.__OnGridDrawCell, this);
        }
        this.grid.un('rowdblclick', this.__OnGridRowDlClick, this);
        this.grid.un('cellclick', this.__onCellClick, this);
        this.grid.un('load', this.__OnGridLoadSelects, this);
        this.grid.un('selectionchanged', this.__OnGridSelectionChanged, this);
        this.grid.destroy();
        this.grid = null;
        this._selectData = null;
        this.__selectMaps = null;

        mini.BaseSelectWindow.superclass.destroy.call(this, removeEl);
    },
    isOldDataSelected: function(id){
        var data = this._selectData;
        var idField = this.getIdField();
        for (var i = 0; i < data.length; i++) {
            if(data[i][idField] == id){
                return true;
            }
        }
        return false;
    },
    hooksData: function() { // hooks for multiselect
        var me = this;
        this.grid.on("drawcell", this.__OnGridDrawCell, this);
    },
    __OnGridDrawCell: function (e) {
        var record = e.record,
                column = e.column,
                field = e.field,
                value = e.value;
        var type = record.Type;
        if (field == "checkbox") {
            if (this.isOldDataSelected(record[this.getIdField()])) {
                e.cellHtml = "已选";
                e.column.readOnly = true;
            }
        }
    },
    __OnGridRowDlClick: function(){
        this._okBtn && this._okBtn.fire("click");
    },
    setDblClickSelect: function(value) {
        this.dblClickSelect = value;
        if(value){
            this.grid.on('rowdblclick', this.__OnGridRowDlClick, this);
        } else {
            this.grid.un('rowdblclick', this.__OnGridRowDlClick, this);
        }
    },
    setKeyLable: function (value) {
        // var labelId = this.id + "$label";
        // var label = document.getElementById(label);
        // if (label) {
        //     label.innerHTML = value;
        //     this.keyLable = value;
        // }
    },
    setSearchLable: function (value) {
        this._searchBtn.setText(value);
    },
    setUrl: function (value) {
        this.url = value;
        this.grid.setUrl(value);
    },
    setKeyField: function (value) {
        this.keyField = value;
    },
    __OnGridLoadSelects: function (){
        var rows = this.__selectMaps[this.grid.getPageIndex()];
        if(rows) this.grid.selects(rows);
    },
    __OnGridSelectionChanged: function(){
        var rows = this.grid.getSelecteds();
        this.__selectMaps[this.grid.getPageIndex()] = rows;
    },
    setCrossPageSelect: function(value){
        this.crossPageSelect = value;
        this.__selectMaps = {};
        if(value){
            this.grid.on('load', this.__OnGridLoadSelects, this);
            this.grid.on('selectionchanged', this.__OnGridSelectionChanged, this);
        } else {
            try{
               this.grid.un('load', this.__OnGridLoadSelects, this);
               this.grid.un('selectionchanged', this.__OnGridSelectionChanged, this);
            }catch(e){}
        }
    },
    setMultiSelect: function (value) {
        this.multiSelect = value;
        this.grid.setMultiSelect(value);
    },
    setShowPager: function(value){
        this.showPager = value;
        this.grid.setShowPager(value);
    },
    search: function (args) {
        // if(!key){
        //     return;
        // }
        // var args = {};
        // args[this.keyField] = key;
        args = $.extend({}, args, this.params);
        this.searchAction(args);
        // this.grid.load(args);
    },
    searchAction: function(params){
        this.grid.load(params);
    },
    gridSet: function(o){
        this.grid.set(o);
    },
    gridOn: function(){
        var args = [].slice.call(arguments, 0),
            a1 = args[0],
            a2 = args[1],
            a3 = args[2];
        switch (args.length) {
            case 2:
                this.grid.on(a1, a2);
                return;
            case 3:
                this.grid.on(a1, a2, a3);
                return;
            default:
                this.grid.on.apply(this.grid, args);
                return;
        }
    },
    setSortBy: function(key, value) {
        this.grid.sortBy(key, value);
    },
    setData: function (data, callback) {
        var list = this.grid.getDataView();
        this.grid.clearSelect();
        this._selectData = data || [];
        this._Callback = callback;
    },
    getAllSelecteds: function() {
        var selectMaps = this.__selectMaps;
        var data = [];
        for(var pageIndex in selectMaps){
            var rows = selectMaps[pageIndex];
            data.addRange(rows);
        }
        return data;
    },
    getData: function () {
        var row;
        if(this.multiSelect) {
            if(this.crossPageSelect){
                row = this.getAllSelecteds();
            } else {
                row = this.grid.getSelecteds();
            }
            if(this.filterSelected){
                var temp = [];
                for (var i = 0; i < row.length; i++) {
                    if(!this.isOldDataSelected(row[i][this.getIdField()])){
                        temp.push(row[i]);
                    }
                }
                return temp;
            }

        } else {
            row = this.grid.getSelected();
        }
        return row;
    }
});
mini.regClass(mini.BaseSelectWindow, "baseselectwindow");
mini.useExports(mini.BaseSelectWindow);
