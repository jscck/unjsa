if (!window.mini) window.mini = {};

mini.MultiUpload = function () {

    mini.MultiUpload.superclass.constructor.call(this);
    var me = this;
    me.postParam = {};
    setTimeout(function () {
        //  me.initComponents();
        me.bindEvents();
    }, 300);
}

mini.extend(mini.MultiUpload, mini.DataGrid, {

    uiCls: 'mini-multiupload',

    flashUrl: '',
    uploadUrl: '',
    uploader: undefined,
    uploadName: "Fdata",
    limitSize: "10MB",
    limitType: "*",
    uploadLimit: 0,
    queueLimit: 10,
    postParam: null,
    //  continuity: false,  //连续上传
    autoUpload: false,   //选中即上传

    customSettings: { queue: null },

    columnsTexts: {
        nameColumnHeader: "文件名",
        typeColumnHeader: "文件类型",
        sizeColumnHeader: "文件大小",
        completeColumnHeader: "上传进度",
        statusColumnHeader: "上传状态",
        actionColumnHeader: "操作"

    },
    mimeTypes: {},
    fileSingleSizeLimit: 10 * 1024 * 1024,
    setMimeTypes: function(obj){
        this.mimeTypes = obj;
    },
    setFileSingleSizeLimit: function(val){
        this.fileSingleSizeLimit = val;
    },
    _create: function () {
        mini.MultiUpload.superclass._create.call(this);
        var me = this;
        var defaultColumns = [
                    { "type": "indexColumn" },
                    { field: "name", width: 150, header: me.columnsTexts.nameColumnHeader },
                    { field: "type", width: 50, header: me.columnsTexts.typeColumnHeader, align: "center", headerAlign: "center" },
                    { field: "size", width: 60, header: me.columnsTexts.sizeColumnHeader, align: "center", headerAlign: "center" },
                    { field: "complete", width: 80, header: me.columnsTexts.completeColumnHeader, headerAlign: "center" },
                    { field: "status", width: 60, header: me.columnsTexts.statusColumnHeader, align: "center", headerAlign: "center" },
                    { field: "action", width: 30, header: me.columnsTexts.actionColumnHeader, align: "center", headerAlign: "center" }
                  ];

        me.set({
            showPager: false,
            showToolbar: true,
            columns: defaultColumns
        })
        var toolbarEl = me.getToolbarEl();
        toolbarEl.style.height = "30px";

        me._uploadId = me._id + "_button_placeholder";
        var sb = [];
        sb.push('<table><tr><td style="width:80px; height:30px; padding-left:3px;"><a class="mini-button" iconCls="icon-search" style="width:80px">浏览...</a><span class="mini-upload"><span id="' + me._uploadId + '" class="mini-upload-placeholder" style=""></span></span>');
        // sb.push('<table><tr><td style="width:80px"><div class="mini-upload" style=""><span id="' + me._uploadId + '" class="mini-upload-placeholder" style=""></span><span class="mini-upload-button" style="">浏览...</span></div>');
        sb.push('</td><td style="padding-left:3px;"><a class="mini-button" iconCls="icon-upload" name="multiupload">批量上传</a>');
        sb.push('</td><td style="padding-left:3px;"><a class="mini-button" iconCls="icon-remove" name="removeAll">清空上传</a>');
        sb.push('</td></tr></table>');
        toolbarEl.innerHTML = sb.join("");
        // me._fileEl = mini.append(toolbarEl, '<div style="width:80px;height:20px;display:inline-block;padding-left:5px;padding-top:2px;"><span id="' + me._uploadId + '" style="display:inline-block;width:100%;height:100%">浏览...</span></div>');

    },
    __OnMouseMove: function () {
        var me = this;
        if (!me.uploader) {
        	var uploader =  WebUploader.create({
		        // swf文件路径
		        swf:  me.flashUrl || me.swf,
		        // 文件接收服务端。
		        server: me.uploadUrl || me.server,
		        // 选择文件的按钮。可选。
		        // 内部根据当前运行是创建，可能是input元素，也可能是flash.
		        pick: '#' + me._uploadId,
		        // 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
		        resize: false,
		        // 自动上传
		        // auto: true,
		        // 文件上传参数表，用来标记文件的所有者（如果是一篇文章的附件，就是文章的ID）
		        formData: {
		            owner: 'zhidian.webuploader'
		        },
		        fileVal: 'fileupload',
		        // 单个文件大小限制（单位：byte），这里限制为 100M
		        fileSingleSizeLimit: me.fileSingleSizeLimit,
                accept: me.mimeTypes
		    });

		    uploader.on('uploadBeforeSend', function(obj, data, headers){
				$.extend(headers, {
					Authorization: COM_CONFIG.TOKEN
		    	});
		    })

		    // 添加到上传队列
		    uploader.on('fileQueued', function (file) {
		        var size = mini.bytesToSize(file.size);
		        var row = { fileId: file.id, name: file.name, type: file.ext, size: size, complete: 0, status: "等待上传" };
		        me.addRow(row);
		    });
		    uploader.on('uploadProgress', mini.createDelegate(me.__on_upload_progress, me));
		    uploader.on('uploadSuccess', mini.createDelegate(me.__on_upload_success, me));
		    uploader.on('uploadError', mini.createDelegate(me.__on_upload_error, me));
		    // 不管上传成功还是失败，都会触发 uploadComplete 事件
		    uploader.on('uploadComplete', function (file) {
		        uploader.removeFile(file, true);
		    });
		    // 当开始上传流程时触发
		    uploader.on('startUpload', function () {
		        me.uploadButton.setEnabled(false);
		    });
		    // 当所有文件上传结束时触发
		    uploader.on('uploadFinished', function () {
		        me.uploadButton.setEnabled(true);
		    });
		    uploader.on('error', function (type, arg, file) {
		        if (type == "Q_TYPE_DENIED") {
		            mini.alert("请上传正确格式文件");
		        } else if (type == "Q_EXCEED_SIZE_LIMIT") {
		            mini.alert('文件[' + file.name + ']大小超出限制值');
		        } else {
		            mini.alert("上传出错！请检查后重新上传！错误代码" + type);
		        }
		    });

            // var upload = new SWFUpload({
            //     file_post_name: me.uploadName,
            //     upload_url: me.uploadUrl,
            //     flash_url: me.flashUrl,

            //     file_size_limit: me.limitSize,  // 10MB  
            //     file_types: me.limitType,   //此处也可以修改成你想限制的类型，比如：*.doc;*.wpd;*.pdf  
            //     file_types_description: me.typesDescription,
            //     file_upload_limit: parseInt(me.uploadLimit),
            //     file_queue_limit: me.queueLimit,

            //     // 事件处理设置（所有的自定义处理方法都在handler.js文件里）  
            //     file_queued_handler: mini.createDelegate(me.__on_file_queued, me),

            //     upload_error_handler: mini.createDelegate(me.__on_upload_error, me),
            //     upload_success_handler: mini.createDelegate(me.__on_upload_success, me),
            //     upload_complete_handler: mini.createDelegate(me.__on_upload_complete, me),
            //     upload_progress_handler: mini.createDelegate(me.__on_upload_progress, me),

            //     file_queue_error_handler: mini.createDelegate(me.__on_file_queued_error, me),

            //     // 按钮设置
            //     //button_placeholder: this.uploadEl,
            //     button_placeholder_id: me._id + "$button_placeholder",
            //     button_width: 80,
            //     button_height: 25,
            //     button_window_mode: "transparent",
            //     button_action: SWFUpload.BUTTON_ACTION.SELECT_FILES,  //对话框按shift多选文件
            //     button_text: '',
            //     // button_text_style: ".redText { color: #FF0000; }",  
            //     button_text_left_padding: 0,
            //     button_text_top_padding: 0,
            //     button_image_url: 'http://about:blank;',
            //     //  button_image_url: "http://www.swfupload.org/button_sprite.png",  
            //     // Debug 设置
            //     debug: false

            // });
            // upload.flashReady();

            me.uploader = uploader;
            me.uploadButton.on("click", function () {
                var rows = me.getData();
                if (rows.length > 0) {
                    me.continuity = true;
                    me.uploader.upload();
                }
            });
            me.removeButton.on("click", function () {
                var rows = me.getData();
                for (var i = 0, l = rows.length; i < l; i++) {
                    me.uploader.removeFile(rows[i].fileId);
                    // me.customSettings.queue.remove(rows[i].fileId);
                }
                me.clearData();
            });
        }
    },
    bindEvents: function () {
        var me = this;
        me._fileEl = document.getElementById(me._uploadId);
        me.uploadEl = me._fileEl;
        var toolbarEl = me.getToolbarEl();
        mini.on(me.uploadEl, "mousemove", me.__OnMouseMove, me);
        me.uploadButton = mini.getbyName("multiupload", toolbarEl);
        me.removeButton = mini.getbyName("removeAll", toolbarEl);
        if(!WebUploader.Uploader.support()){
            mini.alert("Web Uploader 不支持您的浏览器！<br/>如果你使用的是IE浏览器，请尝试升级 flash 播放器");
        }
        me.on("drawcell", function (e) {
            var field = e.field;
            var record = e.record;
            var uid = record._uid;
            var value = e.value;
            //            if (field == "size") {
            //                e.cellHtml = bytesToSize(e.value);
            //            }
            if (field == "complete") {
                e.cellHtml = '<div class="progressbar">'
                                + '<div class="progressbar-percent" style="width:' + value + '%;"></div>'
                                + '<div class="progressbar-label">' + value + '%</div>'
                            + '</div>';
            }
            if (field == "status") {
                if (e.value == 0) {
                    e.cellHtml = "准备上传";
                } else if (e.value == 1) {
                    e.cellHtml = "上传成功";
                } else if (e.value == 2) {
                    e.cellHtml = "上传失败";
                }
            }
            if (field == "action") {
                e.cellHtml = '<a class="upicon-remove" name="' + uid + '"><a>';

            }
        })
        $(document.body).on("click", ".upicon-remove", function (e) {
            var uid = $(this).attr("name");
            var row = me.getRowByUID(uid);
            var stats = me.uploader.getStats();
            var files = me.uploader.getFiles();
            for (var i = 0; i < files.length; i++) {
                if(files[i].id == row.fileId){
                    me.uploader.removeFile(files[i]);
                }
            }
            me.removeRow(row);
        })
    },
    startUpload: function (fileId) {

        var me = this;
        if (me.uploader) {
            if (me.postParam) {
                me.uploader.setPostParams(this.postParam);
            }
            if (fileId) {
                me.uploader.startUpload(fileId);
            } else {
                me.uploader.startUpload();
            }
        }
    },
    addPostParam: function (value) {
        mini.copyTo(this.postParam, value);
    },
    setPostParam: function (value) {
        this.addPostParam(value);
    },
    getPostParam: function () {
        return this.postParam;
    },
    serverDataParse: function(data){
        data = mini.decode(data);
        return {
            status: data.status,
            message: data.message,
            data: data.data
        };
    },
    __on_file_queued: function (file) {
        var me = this;
        var row = {};
        row.name = file.name;
        row.type = file.type;
        row.status = 0;
        row.fileId = file.id;
        row.size = mini.bytesToSize(file.size);
        row.complete = 0;
        me.addRow(row);
        me.customSettings.queue = me.customSettings.queue || new Array();
        me.customSettings.queue.push(file.id);
        if (me.autoUpload) {
            me.startUpload(file.id);
        }
    },
    __on_upload_error: function (file, errorCode, msg) {

        var me = this;
        if (file) {
            var row = me.findRow(function (row) {
                if (row.fileId == file.id) return true;
            })
            me.updateRow(row, { status: 2 });
        }
    },
    __on_upload_success: function (file, serverData) {
        var me = this;
        var row = me.findRow(function (row) {
            if (row.fileId == file.id) return true;
        })
        var data = me.serverDataParse(serverData);

        if(data.status == 1){
            me.updateRow(row, { status: 1, complete: 100, serverData: data.data });
        } else {
            me.updateRow(row, { status: 2 });
        }
    },
    __on_upload_complete: function (file) {
        //实现连续上传功能
        //        if (this.continuity || this.autoUpload) {
        //            if (this.uploader.getStats().files_queued == 0) {
        //                this.continuity = false;
        //            }
        if (this.uploader.getStats().files_queued !== 0) {
            this.startUpload();
        }
        //  }

    },
    __on_upload_progress: function (file, percentage) {

        // var percent = mini.formatNumber(complete / total, "n2") * 100;
        var me = this;
        var row = me.findRow(function (row) {
            if (row.fileId == file.id) return true;
        })
        me.updateRow(row, { complete: percentage });

    },
    __on_file_queued_error: function (file, errorCode, msg) {
        mini.alert("文件选择出错!errorCode:" + errorCode + "");
    },
    setUploadUrl: function (url) {
        this.uploadUrl = url;
    },
    getUploadUrl: function () {
        return this.uploadUrl;
    },
    setFlashUrl: function (url) {
        this.flashUrl = url;
    },
    getFlashUrl: function () {
        return this.flashUrl;
    },
    setLimitType: function (type) {
        this.limitType = type;
    },
    getLimitType: function () {
        return this.limitType;
    },
    setLimitSize: function (size) {
        this.limitSize = size;
    },
    getLimitTSize: function () {
        return this.limitSize;
    },
    setUploadName: function (name) {
        this.uploadName = name;
    },
    getUploadName: function () {
        return this.uploadName;
    },
    setAutoUpload: function (val) {
        this.autoUpload = val;
    },
    getAutoUpload: function () {
        return this.autoUpload;
    },

    setQueueLimit: function (num) {
        this.queueLimit = num;
    },
    getQueueLimit: function () {
        return this.queueLimit;
    },
    destroy: function(removeEl){
        this.uploader && this.uploader.destroy(); // destroy
        $(document.body).off("click", ".upicon-remove");
        mini.MultiUpload.superclass.destroy.call(this, removeEl);
    },
    getAttrs: function (el) {
        var attrs = mini.MultiUpload.superclass.getAttrs.call(this, el);
        mini._ParseString(el, attrs,
            ["uploadUrl", "flashUrl", "limitType", "limitSize", "uploadName", "queueLimit"]
        );
        mini._ParseBool(el, attrs,
            ["autoUpload"]
        );
        return attrs;
    }

});

mini.regClass(mini.MultiUpload, "multiupload");
mini.useExports(mini.MultiUpload);


