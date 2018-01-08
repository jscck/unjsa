
mini.UploadWindow = function (el, options) {

    if(options === undefined){
        options = el;
    }
    options || (options = {});
    var args = [null, options];
    mini.UploadWindow.superclass.constructor.apply(this, args);
    var allowMethods = ['getToolbarHtml', 'getFooterHtml'];
    for(var i in options){
        if(~allowMethods.indexOf(i) && $.isFunction(options[i])){
            this[i] = options[i];
        }
    }

    this.postParam = {};
    this.initialize(options);
}
mini.extend(mini.UploadWindow, mini.Window, {
    title: "上传面板",
    width: 760,
    height: 425,
    allowResize: true,
    showModal: true,
    showToolbar: false,
    showFooter: true,
    showPager: true,
    useFlash: false, // flash or html
    autoUpload: false, 
    closeAction:'destroy',
    uploadAttrs: [ 'uploadUrl', 'flashUrl', 'limitType', 'limitSize'], // 'data',
    uploadMethods: ['setPostParam','getPostParam'],
    setUploadName: function(name){
        this.uploadName = name;
        if(this.uploader)
            this.uploader.setName(name);
    },
    getUploadName: function(){
        return this.uploadName;
    },
    setLimitType: function (value) {
        this.limitType = value;
        if (this.uploader) this.uploader.setLimitType(this.limitType);

        if(!this.useFlash && this.uploader) {
            var accept = this.limitType.replace(/\*/g, '').replace(/\;/g, ',');
            this.uploader._fileEl.setAttribute('accept', accept);
        }
    },
    setDescription: function(description){
        this.description = description;
        if(this.descBox){
            this.descBox.innerHTML = description;
        }
    },
    getDescription: function(){
        return this.description;
    },
    getLimitType: function () {
        return this.limitType;
    },
    setUploadUrl: function(value){
        this.uploadUrl = value;
    },
    getUploadUrl: function(){
        return this.uploadUrl;
    },
    setUseFlash: function(value){
        this.useFlash = value;
    },
    getUseFlash: function(){
        return this.useFlash;
    },
    setAutoUpload: function(value){
        this.autoUpload = value;
        if(this.useFlash){
            this.uploader.set({
                uploadOnSelect: this.autoUpload
            });
        } else {
            if(this.autoUpload){
                this.uploader.on('fileselect', function(e){
                    this.startUpload();
                }, this);
            }
        }
    },
    getAutoUpload: function(){
        return this.autoUpload;
    },
    serverDataParse: function(data){
        data = mini.decode(data);
        if(data.Status == 1){
            return {
                data: mini.decode(data.Data),
                status: 1,
                message: data.Msg
            };
        } else {
            return {
                data: mini.decode(data.Data),
                status: 0,
                message: data.Msg
            }
        }
    },
    _uploadsuccess: function(data){
        var me = this;
        data = me.serverDataParse(data);
        me.setUploadMessage(data.message, data.status);
        me.fire('uploadsuccess',  { serverdata: data });
        me.started = false;
    },
    startUpload: function () {
        if(this.started) return; // set flag
        this.started = true;
        var me = this;
        if(this.useFlash){
            if (me.uploader) {
                if (me.postParam) {
                    me.uploader.setPostParam(me.postParam);
                }
                me.uploader.startUpload();
            }
        } else {
            me.uploader.validate();
            if(!me.uploader.getIsValid()){
                mini.alert(me.uploader.errorText);
                return false;
            }
            $.ajaxFileUpload({
                url: this.uploadUrl,
                secureuri: false,
                data: this.postParam,
                fileElementId: $(this.uploader.el).find('input:file')[0],
                dataType: "json",
                success: function (data) {
                    me._uploadsuccess(data);
                },
                error: function (xhr, status, e) {
                    mini.alert(e.message);
                }
            });
        }
    },
    setUploadMessage: function(message, status){
        var ss = [];
        if(this.tipsBox){
            this.tipsBox.innerHTML = message;
            if(message){
                if(status){
                   mini.addClass(this.tipsBox, 'text-success'); 
                } else {
                   mini.addClass(this.tipsBox, 'text-danger');
                }
            } else {
                mini.removeClass(this.tipsBox, 'text-success');
                mini.removeClass(this.tipsBox, 'text-danger');
            }
        }
    },
    addPostParam: function (value) {
        mini.copyTo(this.postParam, value);
    },
    setPostParam: function (value) {
        this.addPostParam(value);
        if(this.useFlash){
            this.uploader.setPostParam(this.postParam);
        }
    },
    getPostParam: function () {
        return this.postParam;
    },
    initialize: function(options){
        var useFlash = options.useFlash;
        delete options.useFlash;

        if (!mini.isNull(useFlash)) {
            this.setUseFlash(useFlash);
        }
        // options
        this.initControls(options);
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
        var me = this;
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

        if(this.useFlash){
            if(!mini.flashChecker().f){
                mini.alert("请安装flash插件，刷新页面重试！");
            }
            this.uploader = new mini.FileUpload();
            this.regApply(this.uploader, this.uploadAttrs);
            mini.relMethod(this, this.uploader, this.uploadMethods);
            this.uploader.set({
                flashUrl: mini.parseUsePath("plugins/swfupload/swfupload.swf"),
            });
            this.uploader.on('uploadsuccess', function(e){
                me._uploadsuccess(e.serverData);
            }, this);
        } else {
            this.uploader = new mini.HtmlFile();
            this.uploader.setRequired(true);
            this.uploader.setRequiredErrorText("请选择上传文件");
            // this.regApply(this.uploader, ['limitType']);
            
        }
        this.uploader.render(bodyEl);

        // for upload tips
        var span = document.createElement('span');
        span.id = this.id + '$tips';
        mini.addClass(span, 'ml-5');
        this.tipsBox = span;
        $(bodyEl).append(span);
        // for description 
        var div = document.createElement('div');
        div.id = this.id + '$desc';
        mini.addClass(div, 'pt-5');
        this.descBox = div;
        $(bodyEl).append(div);
        
        //组件对象
        mini.parse(this.el);
        this._okBtn = mini.getbyName("okBtn", this);
        this._cancelBtn = mini.getbyName("cancelBtn", this);

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
        mini.UploadWindow.superclass.show.call(this);
        this.addCls("mini-window-anim");
    },
    hide: function() {
        mini.UploadWindow.superclass.hide.call(this);
        this.destroy();
    },
    destroy: function (removeEl) {
        this._okBtn && this._okBtn.un("click", this.__onOkBtnClick, this);
        this._cancelBtn && this._cancelBtn.un("click", this.__onCancelBtnClick , this);
        this.un("beforebuttonclick", this.__onBeforeButtonClick, this);

        this.uploader.destroy();
        this.uploader = null;
        mini.UploadWindow.superclass.destroy.call(this, removeEl);
    },

    uploadSet: function(o){
        this.uploader.set(o);
    },
    uploadOn: function(){
        var args = [].slice.call(arguments, 0),
            a1 = args[0],
            a2 = args[1],
            a3 = args[2];
        switch (args.length) {
            case 2:
                this.uploader.on(a1, a2);
                return;
            case 3:
                this.uploader.on(a1, a2, a3);
                return;
            default:
                this.uploader.on.apply(this.uploader, args);
                return;
        }
    },
    getData: function(){
        var data = this.uploader.getData();
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
mini.regClass(mini.UploadWindow, "uploadwindow");
mini.useExports(mini.UploadWindow);