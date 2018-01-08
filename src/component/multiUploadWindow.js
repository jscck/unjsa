
mini.MultiUploadWindow = function (el, options) {
    options || (options = {});
    mini.MultiUploadWindow.superclass.constructor.apply(this, arguments);

    var allowMethods = ['getFooterHtml'];
    for(var i in options){
        if(~allowMethods.indexOf(i) && $.isFunction(options[i])){
            this[i] = options[i];
        }
    }
    this.initialize();

}
mini.extend(mini.MultiUploadWindow, mini.Window, {
    title: "上传面板",
    width: 760,
    height: 425,
    bodyStyle: "padding:0;",
    allowResize: true,
    showModal: true,
    showToolbar: false,
    showFooter: true,
    showPager: true,
    closeAction:'destroy',
    uploadAttrs: [ 'uploadUrl', 'flashUrl', 'limitType', 'mimeTypes', 'limitSize', 'fileSingleSizeLimit', 'uploadName', 'queueLimit', 
            'autoUpload'], // 'data',

    uploadMethods: ['setPostParam','getPostParam'],
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
        return '';
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
        var topHtml = this.getToolbarHtml();

        jQuery(toolbarEl).append(topHtml);

        //footer
        var footerHtml = this.getFooterHtml();
        jQuery(footerEl).append(footerHtml);

      
        this.upload = new mini.MultiUpload();

        this.regApply(this.upload, this.uploadAttrs);
        mini.relMethod(this, this.upload, this.uploadMethods);

        this.upload.set({
            style: "width: 100%;height: 100%;",
            borderStyle: 'border:0;',
            flashUrl: mini.parseUsePath("plugins/webuploader/Uploader.swf"),
            uploadName: 'fileupload'
        });
        this.upload.addPostParam({
            userId: COM_CONFIG.Id
        })

        this.upload.render(bodyEl);

        //组件对象
        mini.parse(this.el);

        this._okBtn = mini.getbyName("okBtn", this);
        this._cancelBtn = mini.getbyName("cancelBtn", this);
    },
    setServerDataParse: function(fn){
        if (typeof fn == 'function'){
            this.upload.serverDataParse = fn;
        }
    },
    initEvents: function () {
        var me = this;
        this._okBtn && this._okBtn.on("click", this.__onOkBtnClick, this);
        this._cancelBtn && this._cancelBtn.on("click", this.__onCancelBtnClick , this);
        this.on("beforebuttonclick", this.__onBeforeButtonClick, this);


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
        mini.MultiUploadWindow.superclass.show.call(this);
        this.addCls("mini-window-anim");
    },
    hide: function() {
        mini.MultiUploadWindow.superclass.hide.call(this);
        this.destroy();
    },
    destroy: function (removeEl) {

        this._okBtn && this._okBtn.un("click", this.__onOkBtnClick, this);
        this._cancelBtn && this._cancelBtn.un("click", this.__onCancelBtnClick , this);
        this.un("beforebuttonclick", this.__onBeforeButtonClick, this);

        this.upload.destroy();
        this.upload = null;
        mini.MultiUploadWindow.superclass.destroy.call(this, removeEl);
    },
    uploadSet: function(o){
        this.upload.set(o);
    },
    uploadOn: function(){
        var args = [].slice.call(arguments, 0),
            a1 = args[0],
            a2 = args[1],
            a3 = args[2];
        switch (args.length) {
            case 2:
                this.upload.on(a1, a2);
                return;
            case 3:
                this.upload.on(a1, a2, a3);
                return;
            default:
                this.upload.on.apply(this.upload, args);
                return;
        }
    },
    getData: function(){
        var data = this.upload.getData();
        var tmp = [];
        mini.forEach(data, function(item){
            if(item.status == 1){
                tmp.push(item.serverData);
            }
        })
        return tmp;
    },
    listen: function(callback){
        this._Callback = callback;
    }
});
mini.regClass(mini.MultiUploadWindow, "multiuploadwindow");
mini.useExports(mini.MultiUploadWindow);
