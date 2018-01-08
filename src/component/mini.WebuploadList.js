mini.WebuploadList = function() {
    mini.WebuploadList.superclass.constructor.apply(this, arguments);
    
}
mini.extend(mini.WebuploadList, mini.ListControl, {

    formField: true,
    _labelFieldCls: 'mini-labelfield-webuploadlist',

    // multiSelect: true,
    // repeatItems: 0,
    // repeatLayout: "none",
    // repeatDirection: "horizontal",

    _itemCls: "mini-webuploadlist-item",
    _itemHoverCls: "mini-webuploadlist-item-hover",
    _itemSelectedCls: "mini-webuploadlist-item-selected",

    _tableCls: "mini-webuploadlist-table",
    _tdCls: "mini-webuploadlist-td",
    _checkType: "checkbox",

    uiCls: "mini-webuploadlist",
    _controlCls: 'mini-webuploadlist-add',
    uploadUrl: '',
    uploadOnSelect: true,

    serverTextField: 'data',
    serverValueField: 'data',
    accept: {
        title: 'Images',
        extensions: 'gif,jpg,jpeg,bmp,png',
        mimeTypes: 'image/*'
    },

    _create: function() {
        var el = this.el = document.createElement("div");
        this.el.className = this.uiCls;

        this.el.innerHTML = '<div class="mini-webuploadlist-border"><div class="mini-webuploadlist-view"></div><div class="mini-webuploadlist-control"></div><input type="hidden"/></div><div class="mini-errorIcon"></div>';

        this._borderEl = this.el.firstChild;
        this._viewEl = this._borderEl.firstChild;
        this._controlEl = this._borderEl.childNodes[1];

        this._controlEl.id = this._uploadId = this.uid + "_upload_filePicker";
        mini.addClass(this._controlEl, this._controlCls);

        this._valueEl = this._borderEl.childNodes[2];

        this._errorIconEl = this.el.lastChild;

        this._scrollViewEl = this._viewEl;

        this._viewEl.innerHTML = '<div class="mini-grid-rows-content"></div>';

        this._contentEl = this._innerEl =  this._viewEl.firstChild;

        mini.on(this._controlEl, "mousemove", this._CreateWebUpload, this);

    },
    _CreateWebUpload: function(){
        var sf = this;
        if (!this.uploader) {
            var uploader =  WebUploader.create({
                // swf文件路径
                swf:  sf.flashUrl || sf.swf,
                // 文件接收服务端。
                server: sf.uploadUrl || sf.server,
                // 选择文件的按钮。可选。
                // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                pick: {
                    id: '#' + sf._uploadId,
                    multiple: true
                },
                // 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
                resize: false,
                chunked: true,
                // 自动上传
                // auto: true,
                // 文件上传参数表，用来标记文件的所有者（如果是一篇文章的附件，就是文章的ID）
                formData: {
                    owner: 'zhidian.webuploader'
                },
                fileVal: 'fileupload',
                // 单个文件大小限制（单位：byte），这里限制为 100M
                fileSingleSizeLimit: 10 * 1024 * 1024,
                accept: sf.accept || {}
            });

            try{
                // Authorization
                if(window.mini_rest_token){
                    uploader.on('uploadBeforeSend', function(obj, data, headers){
                        $.extend(headers, {
                            Authorization: window.mini_rest_token
                        });
                    })
                }
            } catch(e) {}

            uploader.on('uploadComplete', function (file) {
                uploader.removeFile(file, true);
            });
            uploader.on('fileQueued', mini.createDelegate(this.__on_file_queued, this));
            uploader.on('uploadProgress', mini.createDelegate(this.__on_upload_progress, this));
            uploader.on('uploadSuccess', mini.createDelegate(this.__on_upload_success, this));
            uploader.on('uploadError', mini.createDelegate(this.__on_upload_error, this));
            uploader.on('uploadComplete',  mini.createDelegate(this.__on_upload_complete, this));
            this.uploader = uploader;
        }
    },
    _initEvents: function() {
        mini.WebuploadList.superclass._initEvents.call(this);
        mini._BindEvents(function() {
            // this._createWebupload();
            // mini_onOne(this._viewEl, "scroll", this.__OnScroll, this);
            // mini.on(this._innerEl, "click", this.__innerOnClick, this);
        }, this);
    },
    __innerOnClick: function(e){

    },
    startUpload: function(params) {
        var e = {
            cancel: false
        };
        this.fire("beforeupload", e);
        if (e.cancel == true) return;
        if (this.uploader) {
            // this.uploader.setPostParams(this.postParam);
            this.uploader.upload()
        }
    },
    __on_file_queued: function(file) {
        var me = this;
        var e = {
            file: file
        };

        var sj = {};
            // sj[me.textField] = item;
            sj[me.valueField] = file.id;

        this.addData(sj);
        var len = this.data.length - 1;
        var ss = me._createItemHtml(sj, len);
        var $li = $(ss);
        $prgress = $li.find('.progress span');
        $li.appendTo(me._innerEl);

        file.on('statuschange', function(cur, prev) {
            if (prev === 'progress') {
                $prgress.hide().width(0);
            } else if (prev === 'queued') {
                $li.off('mouseenter mouseleave');
                // $btns.remove();
            }
            // 成功
            if (cur === 'error' || cur === 'invalid') {
                showError(file.statusText);
                // percentages[file.id][1] = 1;
            } else if (cur === 'interrupt') {
                showError('interrupt');
            } else if (cur === 'queued') {
                // percentages[file.id][1] = 0;
            } else if (cur === 'progress') {
                // $info.remove();
                $prgress.css('display', 'block');
            } else if (cur === 'complete') {
                // $li.append('<span class="success"></span>');
            }
            $li.removeClass('state-' + prev).addClass('state-' + cur);
        });

        if (this.uploadOnSelect) {
            this.startUpload();
        }

        this.fire("fileselect", e);
    },
    getValueEl: function(){
        this.uid + + ckValue
    },
    _createItemValueId:  function(id){
        return this.uid + '_' + id
    },
    getfileItemEl: function(file){
        var id = this._createItemValueId(file.id);
        var item = $('[valueid='+ id+']')[0];
        return item;
    },
    showUploadProgress: true,
    __on_upload_progress: function(file, percentage) {
        if (this.showUploadProgress) {
            var item = this.getfileItemEl(file);
            var _progressbarEl = $(item).find('.progress')[0];
            var totalWidth = mini.getWidth(_progressbarEl);
            var width = totalWidth * percentage;
            var processEl = $(_progressbarEl).find('span')[0];
            mini.setWidth(processEl, width);
        }
        var e = {
            file: file,
            percentage: percentage
        };
        this.fire("uploadprogress", e);
    },
    __on_upload_success: function(file, serverData) {
        var e = {
            file: file,
            serverData: serverData
        };
        // if(this.serverTextField){
        //     var text = mini._getMap(this.serverTextField, serverData);
        //     if(text) {
        //         this.setText(text);
        //     }
        // }
        if(this.serverValueField){
            var value = mini._getMap(this.serverValueField, serverData);
            if(value) {
                var item = this.getfileItemEl(file);
                var $li = $(item);
                $li.find('.imgWrap');
                var $wrap = $li.find('.imgWrap');
                $wrap.html('<img src="' + value + '" style="width:110px; height: 110px;">');
                this.updateData(file.id, value);
            }
        }
        this.fire("uploadsuccess", e);
    },
    __on_upload_error: function(file, code, message) {
        if (message == "File Cancelled") return;
        var e = {
            file: file,
            code: code,
            message: message
        };
        this.fire("uploaderror", e);

    },
    __on_upload_complete: function(e) {

        this.fire("uploadcomplete", e);
    },
    setValue: function(data) {
        if(typeof data == 'string' && data != '') {
            data = data.split(',');
        }
        data || (data = []);
        var me = this;
        var data = data.map(function(item, index){
            var ss = {};
            ss[me.textField] = item;
            ss[me.valueField] = 'wud_' + index;
            return ss;
        });
        this.setData(data);
    },
    getValue: function() {
        var data  = this.getData();
        return mini.pluck(data, this.textField);
    },
    addData: function(data){
        this.data.push(data);
        // this.doUpdate();
    },
    updateData: function(id, text){
        var item = this.getItem(id);
        item[this.textField] = text;
    },
    destroy: function(removeEl) {
        if (this._viewEl) {
            this._viewEl.onscroll = null;
            mini.clearEvent(this._viewEl);
            this._viewEl = null;
        }
        this._borderEl = this._headerEl = this._viewEl = this._valueEl = this._errorIconEl = this._scrollViewEl = this._contentEl = null;
        mini.WebuploadList.superclass.destroy.call(this, removeEl);
    },
    doUpdate: function() {
        var data = this.data;
        var s = "";

        for (var i = 0, l = data.length; i < l; i++) {
            var item = data[i];
            item._i = i;
        }

        for (var i = 0, l = data.length; i < l; i++) {
            var item = data[i];
            s += this._createItemHtml(item, i);
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
        var ss = this._createItemValueId(ckValue);
        var disable = '';

        // <div id="WU_FILE_0">
        //     <p class="title">iddown.jpg</p>
        //     <p class="imgWrap">
        //         <img src="">
        //     </p>
        //     <p class="progress">
        //     <span></span>
        //     </p>
        //     <div class="file-panel" style="height: 0px;">
        //         <span class="cancel">删除</span>
        //         <span class="rotateRight hidden">向右旋转</span>
        //         <span class="rotateLeft hidden">向左旋转</span>
        //     </div>
        // </div>

        var s = '<div id="' + id + '" index="' + index + '" value="'+ ckValue +'" valueid="'+ ss  +'" class="' + this._itemCls + ' ';
        // if (item.enabled === false) {
        //     s += ' mini-disabled ';
        //     disable = 'disabled';
        // }
        // var onclick = 'onclick="return false"';
        // onclick = 'onmousedown="this._checked = this.checked;" onclick="this.checked = this._checked"';

        s += e.itemCls + '" style="' + e.itemStyle + '">'
            // + '<div class="title">'+ e.itemHtml +'</div>'
            + '<div class="imgWrap">'
            + (e.itemHtml ?'<img src="'+ e.itemHtml +'">' : '')
            +'</div>'
            + '<div class="progress"><span></span></div>'
            + '<div class="actions">'
                + '<i class="fa fa-eye item_view"  aria-hidden="true"></i>'
                + '<i class="fa fa-trash item_del" aria-hidden="true"></i>'
            + '</div>'
        + '</div>';
        return s;
    },
    removeItem: function(item){
        var index = this.data.indexOf(item);
        if (index != -1) {
            this.data.removeAt(index);
            // this._checkSelecteds();
            // this.doUpdate();
        }
    },
    getItemByEvent: function(event) {
        var domItem = mini.findParent(event.target, this._itemCls);
        if (domItem) {
            var id = mini.getAttr(domItem, "value");
            for (var i = 0; i < this.data.length; i++) {
                if(this.data[i][this.valueField] == id){
                    return this.data[i];
                }
            }
            // return this.data[index];
        }
    },
    _OnItemClick: function(item, e){
        if (mini.findParent(e.target, 'item_view')) {
             var e = {
                item: item,
                data: this.data,
                htmlEvent: e
            };
            this.fire("itemview", e);
        }
        if (mini.findParent(e.target, 'item_del')) {
            var ev = {
                cancel: false,
                item: item,
                htmlEvent: e
            };
            this.fire("itemdel", ev);
            if(ev.cancel == true) return;
            var domItem = mini.findParent(e.target, this._itemCls);
            $(domItem).remove();
            this.removeItem(item);
        }
    },
    removeItemByEvent: function(item, e){
        var domItem = mini.findParent(e.target, this._itemCls);
        $(domItem).remove();
        this.removeItem(item);
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
    getAttrs: function(el) {
        var attrs = mini.WebuploadList.superclass.getAttrs.call(this, el);
        mini._ParseString(el, attrs, [
            "ondrawitem" , 'uploadUrl', 'onitemview', 'onitemdel'
        ]);

        mini._ParseBool(el, attrs, ["uploadOnSelect"]);

        if(attrs.flashUrl)
            attrs.flashUrl = mini.parseUsePath(attrs.flashUrl);
        if(attrs.uploadUrl)
            attrs.uploadUrl = mini.parseServerPath(attrs.uploadUrl);


        return attrs;
    }
});

mini.regClass(mini.WebuploadList, 'webuploadlist');
