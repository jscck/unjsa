
/*
    tree select window
*/
mini.TreeSelectWindow = function (el, options) {
    options || (options = {});
    mini.TreeSelectWindow.superclass.constructor.apply(this, arguments);

    var allowMethods = ['getToolbarHtml', 'getFooterHtml'];
    for(var i in options){
        if(~allowMethods.indexOf(i) && $.isFunction(options[i])){
            this[i] = options[i];
        }
    }

    this.initialize();

}
mini.extend(mini.TreeSelectWindow, mini.Window, {
    url: "",
    keyField: "key",

    showCheckBox: false, // showCheckBox
    showFolderCheckBox: false,
    checkRecursive: false,

    title: "查询",
    keyLable: "名称：",
    searchLable: "查询：",
    width: 330,
    height: 400,
    bodyStyle: "padding:0;",
    allowResize: true,
    showModal: true,
    showToolbar: false,
    showFooter: true,
    showPager: true,
    closeAction:'destroy',
    treeAttrs: ['ajaxType', 'url', 'value', 'idField', 'textField', 'iconField', 'nodesField', 
            'parentField', 'imgField', 'imgPath', 'resultAsTree', 'dataField', 'checkedField', 
            'checkRecursive', 'autoCheckParent', 'expandOnLoad', 'showTreeIcon', 'showTreeLines', 
            'allowSelect', 'showCheckBox', 'showRadioButton', 'showFolderCheckBox', 'showExpandButtons', 'enableHotTrack', 
            'expandOnDblClick', 'expandOnNodeClick', 'allowLeafDropIn', 'multiSelect'], // 'data',
    treeMethods: ["load", "loadData", "loadList", "getList", 
            "isChanged", "accept", "loadNode", "getRootNode", 
            "getAncestors", "getParentNode", "getChildNodes", 
            "getAllChildNodes", "isAncestor", "isLeaf", "getLevel", 
            "isExpandedNode", "isCheckedNode", "isVisibleNode", "isEnabledNode", 
            "bubbleParent", "cascadeChild", "eachChild", "removeNodes", 
            "removeNode", "addNodes", "addNode", "updateNode", "moveNode", 
            "setNodeText", "setNodeIconCls", "getNode", "enableNode", "disableNode", 
            "findNodes", "filter", "clearFilter", "expandNode", "collapseNode", "expandLevel", 
            "collapseLevel", "expandPath", "collapsePath", "expandAll", "collapseAll", 
            "scrollIntoView", "selectNode", "getSelectedNode", "getSelectedNodes", "checkNode", "uncheckNode", 
            "checkNodes", "uncheckNodes", "checkAllNodes", "uncheckAllNodes", "getCheckedNodes", "getCheckedTopNodes", "getValue"],
    initialize: function(){
        this.initControls();
        this.initEvents();
    },
    regApply: function(source, methods){
        var target = this;
        mini.forEach(methods, function(key, index){
            var caseKey = key.charAt(0).toUpperCase() + key.substring(1, key.length);
            var ms = ['set' + caseKey, 'get' + caseKey];
            mini.forEach(ms, function(method){
                if(typeof source[method] == 'function'){
                    target[method] = function() {
                        var args = [].slice.call(arguments, 0);
                        if(/^set/.test(method)){
                            target[key] = args[0]; // set value
                        }
                        return source[method].apply(source, args);
                    }
                }
            })
        })
    },
    getToolbarHtml: function(){
        var labelId = this.id + "$label";
        var topHtml =
            '<div style="padding:5px;text-align:left;">'
                + '<span id="' + labelId + '">' + this.keyLable + '</span>    '
                + '<input name="keyText" class="mini-textbox" style="width:250px;"/> '
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
    initControls: function () {
        var toolbarEl = this.getToolbarEl();
        var footerEl = this.getFooterEl();
        var bodyEl = this.getBodyEl();

        //toolbar
        var labelId = this.id + "$label";
        var topHtml = this.getToolbarHtml();

        jQuery(toolbarEl).append(topHtml);

        //footer
        var footerHtml = this.getFooterHtml();
        jQuery(footerEl).append(footerHtml);

      
        this.tree = new mini.Tree();

        this.regApply(this.tree, this.treeAttrs);
        mini.relMethod(this, this.tree, this.treeMethods);

        this.tree.set({
            style: "width: 100%;height: 100%;",
        });

        this.tree.render(bodyEl);

        //组件对象
        mini.parse(this.el);

        this._okBtn = mini.getbyName("okBtn", this);
        this._cancelBtn = mini.getbyName("cancelBtn", this);
        this._searchBtn = mini.getbyName("searchBtn", this);
        this._keyText = mini.getbyName("keyText", this);
    },
    initEvents: function () {
        var me = this;
        this._searchBtn && this._searchBtn.on("click", this.__onSearchBtnClick, this);
        this._keyText && this._keyText.on("enter", this.__onKeyTextEnter, this);
        this._okBtn && this._okBtn.on("click", this.__onOkBtnClick, this);
        this._cancelBtn && this._cancelBtn.on("click", this.__onCancelBtnClick , this);
        this.on("beforebuttonclick", this.__onBeforeButtonClick, this);



    },
    __onSearchBtnClick: function (e) {
            var key = this._keyText.getValue();
            key = $.trim(key);
            this.search(key);
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
        mini.TreeSelectWindow.superclass.show.call(this);
        this.addCls("mini-window-anim");
    },
    hide: function() {
        mini.TreeSelectWindow.superclass.hide.call(this);
        this.destroy();
    },
    destroy: function (removeEl) {
        this._searchBtn && this._searchBtn.un("click", this.__onSearchBtnClick, this);
        this._keyText && this._keyText.un("enter", this.__onKeyTextEnter, this);
        this._okBtn && this._okBtn.un("click", this.__onOkBtnClick, this);
        this._cancelBtn && this._cancelBtn.un("click", this.__onCancelBtnClick , this);
        this.un("beforebuttonclick", this.__onBeforeButtonClick, this);

        this.tree.destroy();
        this.tree = null;
        mini.TreeSelectWindow.superclass.destroy.call(this, removeEl);
    },
    setKeyLable: function (value) {
        var labelId = this.id + "$label";
        var label = document.getElementById(label);
        if (label) {
            label.innerHTML = value;
            this.keyLable = value;
        }
    },
    setSearchLable: function (value) {
        this._searchBtn.setText(value);
    },
    setUrl: function (value) {
        this.url = value;
        this.tree.setUrl(value);
    },
    setKeyField: function (value) {
        this.keyField = value;
    },
    search: function (key) {
        var tree = this.tree;
        if (key == "") {
            tree.clearFilter();
        } else {
            key = key.toLowerCase();
            tree.filter(function (node) {
                var text = node.text ? node.text.toLowerCase() : "";
                if (text.indexOf(key) != -1) {
                    return true;
                }
            });
            tree.expandAll();
        }
    },
    treeSet: function(o){
        this.tree.set(o);
    },
    treeOn: function(){
        var args = [].slice.call(arguments, 0),
            a1 = args[0],
            a2 = args[1],
            a3 = args[2];
        switch (args.length) {
            case 2:
                this.tree.on(a1, a2);
                return;
            case 3:
                this.tree.on(a1, a2, a3);
                return;
            default:
                this.tree.on.apply(this.tree, args);
                return;
        }
    },
    getData: function () {
        var tree = this.tree;
        var nodes = [];
        if (this.showCheckBox == true) nodes = tree.getCheckedNodes();
        else {
            var node = tree.getSelectedNode();
            if (node) nodes.push(node);
        }
        var ids = [], texts = [];
        var id = tree.getIdField(),
            text = tree.getTextField();
        for (var i = 0, l = nodes.length; i < l; i++) {
            var node = nodes[i];
            ids.push(node[id]);
            texts.push(node[text]);
        }
        var data = {};
        data.id = ids.join(",");
        data.text = texts.join(",");
        return data;
    },
    listen: function(callback){
        this._Callback = callback;
    }
});
mini.regClass(mini.TreeSelectWindow, "treeselectwindow");
mini.useExports(mini.TreeSelectWindow);
