mini.WebuploadPanel = function(config){
	mini.WebuploadPanel.superclass.constructor.call(this, config);
	// this.el.className += ' mini-webupload';
}

mini.extend(mini.WebuploadPanel, mini.ValidatorBase, {
	name: "",
	formField: true,
	flashUrl: mini.parseUsePath("plugins/webuploader/Uploader.swf"),
	uploadUrl: "",
	fileNumLimit: 20,
    fileSizeLimit: 5 * 1024 * 1024, // 5 M
    fileSingleSizeLimit: 1 * 1024 * 1024, // 1 M
	uiCls: "mini-webuploadpanel",
	serverDataField: 'data',
	errorMessages: {
		Q_EXCEED_NUM_LIMIT: "超出文件张数限制",
		Q_EXCEED_SIZE_LIMIT: "超出文件大小限制",
		Q_TYPE_DENIED: "文件类型不符合",
		F_DUPLICATE: "文件重复了"
	},
	_create: function() {
			var uploadIdPrefix = this.uploadIdPrefix = this.uid + "_upload_";
			this._uploadId = uploadIdPrefix + 'filePicker';
			var html = '<div class="image-uploader">'
			+    '<div class="queueList" id="'+ uploadIdPrefix +'queueList">'
			+        '<div id="'+ uploadIdPrefix + 'dndArea" class="placeholder">'
			+            '<div id="'+ this._uploadId +'"></div>'
			+            '<p>或将照片拖到这里，最多<span id="'+ uploadIdPrefix+'fileNumLimit">20</span>张</p>'
			+            '<p>单张大小不能超过<span id="'+ uploadIdPrefix+'fileSingleSizeLimit"></span>，总大小不能超过<span id="'+ uploadIdPrefix +'fileSizeLimit"></span></p>'
			+        '</div>'
			+    '</div>'
			+    '<div class="statusBar" style="display:none;">'
			+        '<div class="progress">'
			+            '<span class="text">0%</span>'
			+            '<span class="percentage"></span>'
			+        '</div><div class="info"></div>'
			+        '<div class="btns">'
			+            '<div id="'+ uploadIdPrefix + 'filePicker2" class="filePicker2"></div><div class="uploadBtn">开始上传</div>'
			+        '</div>'
			+    '</div>'
			+ '</div>';

        // html = '<div class="mini-ueditor-box" id="'+ ueid +'"></div>';
        // html = '<span class="mini-ueditor-border">' + html + '</span>';
        
        html += '<input type="hidden"/>';
        this.el = document.createElement("div");
        this.el.className = "mini-webuploadpanel";
        this.el.innerHTML = html;
        // this._borderEl = this.el.firstChild;
        // this._textEl = this._borderEl.firstChild;
        this._valueEl = this.el.lastChild;
    },
    _initEvents: function() {
        mini._BindEvents(function() {
            this.uploadMainPicture();
        }, this);
        this.on("validation", this.__OnValidation, this);
    },
    getUploadIdEl: function(str){
    	return $(this.getUploadIdElStr(str));
    },
    getUploadIdElStr: function(str){
    	return '#'+ this.uploadIdPrefix + str
    },
	uploadMainPicture: function(){
		var $ = jQuery, // just in case. Make sure it's not an other libaray.
	        $wrap = this.$wrap = $(this.el.firstChild),
	        // 图片容器
	        $queue = this.$queue =  $('<ul class="filelist"></ul>')
	            .appendTo($wrap.find('.queueList')),
	        // 状态栏，包括进度和控制按钮
	        $statusBar = this.$statusBar = $wrap.find('.statusBar'),
	        // 文件总体选择信息。
	        $info = this.$info = $statusBar.find('.info'),
	        // 上传按钮
	        $upload = this.$upload = $wrap.find('.uploadBtn'),
	        // 没选择文件之前的内容。
	        $placeHolder = this.$placeHolder = $wrap.find('.placeholder'),
	        // 总体进度条
	        $progress = this.$progress = $statusBar.find('.progress').hide(),

	        // 优化retina, 在retina下这个值是2
	        ratio = window.devicePixelRatio || 1,
	        // 所有文件的进度信息，key为file id
	        percentages = this._percentages = {},
	        // WebUploader实例
	        uploader;
	    if (!WebUploader.Uploader.support()) {
	        mini.alert('Web Uploader 不支持您的浏览器！<br/>如果你使用的是IE浏览器，请尝试升级 flash 播放器');
	        return;
	    }
	   	this.getUploadIdEl('fileNumLimit').html(this.fileNumLimit);

	   	this.getUploadIdEl('fileSingleSizeLimit').html(mini.bytesToSize(this.fileSingleSizeLimit));
	   	this.getUploadIdEl('fileSizeLimit').html(mini.bytesToSize(this.fileSizeLimit));
	   	// 添加的文件数量
	   	this._fileCount = 0;
	   	// 添加的文件总大小
	   	this._fileSize = 0;
	    // 缩略图大小
	   	this.thumbnailWidth =  110 * ratio;
	    this.thumbnailHeight =  110 * ratio;
	    // 可能有pedding, ready, uploading, confirm, done.
	   	this.state = 'pedding';

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
		            label: '点击选择图片'
		        },
		        dnd: sf.getUploadIdElStr('queueList'),
		        paste: document.body,
		        disableGlobalDnd: true,
		        chunked: true,
		        fileNumLimit: sf.fileNumLimit,
		        fileSizeLimit: sf.fileSizeLimit,
		        fileSingleSizeLimit: sf.fileSingleSizeLimit,
		        accept: {
		            title: 'Images',
		            extensions: 'gif,jpg,jpeg,bmp,png',
		            mimeTypes: 'image/*'
		        },
		        formData: {
		            owner: 'zhidian.webuploader'
		        },
		        fileVal: 'fileupload'
		    });
		    this.uploader = uploader;

		    if(window.mini_rest_token){
		    	uploader.on('uploadBeforeSend', function(obj, data, headers){
					$.extend(headers, {
						Authorization: window.mini_rest_token
			    	});
			    })
	    	}
			// uploader.on('uploadComplete', function (file) {
			//     uploader.removeFile(file, true);
			// });
			// uploader.on('fileQueued', mini.createDelegate(this.__on_file_queued, this));
			// 	uploader.on('uploadProgress', mini.createDelegate(this.__on_upload_progress, this));
			// uploader.on('uploadSuccess', mini.createDelegate(this.__on_upload_success, this));
			// uploader.on('uploadError', mini.createDelegate(this.__on_upload_error, this));
			// uploader.on('uploadComplete',  mini.createDelegate(this.__on_upload_complete, this));
		    // 添加 添加文件 的按钮，
		    uploader.addButton({
		        id: sf.getUploadIdElStr('filePicker2'),
		        label: '继续添加'
		    });

		    uploader.on('uploadProgress', function(file, percentage) {
		        var $li = $('#' + file.id),
		            $percent = $li.find('.progress span');
		        $percent.css('width', percentage * 100 + '%');
		        percentages[file.id][1] = percentage;
		        sf.updateTotalProgress();
		    })
		    uploader.on('fileQueued', function(file) {
		        sf._fileCount++;
		        sf._fileSize += file.size;

		        if (sf._fileCount === 1) {
		            $placeHolder.addClass('element-invisible');
		            $statusBar.show();
		        }
		        sf.addFile(file);
		        sf.setState('ready');
		        sf.updateTotalProgress();
		    })
		    uploader.on('fileDequeued', function(file) {
		        sf._fileCount--;
		        sf._fileSize -= file.size;
		        if (!sf._fileCount) {
		            sf.setState('pedding');
		        }
		        sf.removeFile(file);
		        sf.updateTotalProgress();
		    });
		    uploader.on('uploadSuccess', function(file, response){
		    	if(sf.serverDataField){
		        	var value = mini._getMap(sf.serverDataField, response);
		        	if(value) {
		        		sf.addValue(value);
		        	}
		        }
		    	// 接收数据
		    });
		    uploader.on('all', function(type) {
		        var stats;
		        switch (type) {
		            case 'uploadFinished':
		                sf.setState('confirm');
		                break;
		            case 'startUpload':
		                sf.setState('uploading');
		                break;

		            case 'stopUpload':
		                sf.setState('paused');
		                break;
		        }
		    });
		    uploader.on('error', function(code, file) {
		    	var detail = (file && file.name ? "，文件名：" + file.name : '');
		        mini.alert('错误：' + (sf.errorMessages[code] || code) + detail);
		    });
		    $upload.on('click', function() {
		        if ($(this).hasClass('disabled')) {
		            return false;
		        }
		        if (sf.state === 'ready') {
		            uploader.upload();
		        } else if (sf.state === 'paused') {
		            uploader.upload();
		        } else if (sf.state === 'uploading') {
		            uploader.stop();
		        }
		    });
		    $info.on('click', '.retry', function() {
		        uploader.retry();
		    });
		    $upload.addClass('state-' + sf.state);
		    this.updateTotalProgress();
	        
        }
	},
	setState: function(val) {
		var sf = this;
		var uploader = this.uploader;
		var $upload = this.$upload;
		var $placeHolder = this.$placeHolder;
		var $queue = this.$queue;
		var $statusBar = this.$statusBar;
		var $progress = this.$progress;
		var state = this.state;
        var file, stats;
        if (val === state) {
            return;
        }
        $upload.removeClass('state-' + state);
        $upload.addClass('state-' + val);
        state = val;
        switch (state) {
            case 'pedding':
                $placeHolder.removeClass('element-invisible');
                $queue.parent().removeClass('filled');
                $queue.hide();
                $statusBar.addClass('element-invisible');
                uploader.refresh();
                break;
            case 'ready':
		        $statusBar.show();
                $placeHolder.addClass('element-invisible');
                sf.getUploadIdEl('filePicker2').removeClass('element-invisible');
                $upload.text('开始上传').removeClass('disabled');
                $queue.parent().addClass('filled');
                $queue.show();
                $statusBar.removeClass('element-invisible');
                uploader.refresh();
                break;
            case 'uploading':
                sf.getUploadIdEl('filePicker2').addClass('element-invisible');
                $progress.show();
                $upload.text('暂停上传');
                break;
            case 'paused':
                $progress.show();
                $upload.text('继续上传');
                break;
            case 'confirm':
                $progress.hide();
                $upload.text('开始上传').addClass('disabled');
                stats = uploader.getStats();
                if (stats.successNum && !stats.uploadFailNum) {
                    sf.setState('finish');
                    return;
                }
                break;
            case 'finish':
                stats = uploader.getStats();
                if (stats.successNum) {
                    toast.success('上传成功');
                    sf.getUploadIdEl('filePicker2').removeClass('element-invisible');
                } else {
                    // 没有成功的图片，重设
                    state = 'done';
                    // location.reload();
                }
                break;
        }

        this.state = state;
        this.updateStatus();
    },
    updateStatus: function () {
    	var fileCount = this._fileCount;
    	var fileSize = this._fileSize;
    	var $info = this.$info;
    	var uploader = this.uploader;
        var text = '',
            stats;
        if (this.state === 'ready') {
            text = '选中' + fileCount + '张图片，共' + WebUploader.formatSize(fileSize) + '。';
        } else if (this.state === 'confirm') {
            stats = uploader.getStats();
            if (stats.uploadFailNum) {
                text = '已成功上传' + stats.successNum + '张照片至XX相册，' + stats.uploadFailNum + '张照片上传失败，<a class="retry" href="#">重新上传</a>失败图片或<a class="ignore" href="#">忽略</a>'
            }
        } else {
            stats = uploader.getStats();
            text = '共' + fileCount + '张（' + WebUploader.formatSize(fileSize) + '），已上传' + stats.successNum + '张';
            if (stats.uploadFailNum) {
                text += '，失败' + stats.uploadFailNum + '张';
            }
        }
        $info.html(text);
    },
    updateTotalProgress: function() {
    	var percentages = this._percentages;
    	var $progress = this.$progress;
        var loaded = 0,
            total = 0,
            spans = $progress.children(),
            percent;
        $.each(percentages, function(k, v) {
            total += v[0];
            loaded += v[0] * v[1];
        });
        percent = total ? loaded / total : 0;
        spans.eq(0).text(Math.round(percent * 100) + '%');
        spans.eq(1).css('width', Math.round(percent * 100) + '%');
        this.updateStatus();
    },
	// 负责view的销毁
    removeFile: function(file) {
    	var percentages = this._percentages;
        var $li = $('#' + file.id);
        delete percentages[file.id];
        this.updateTotalProgress();
        $li.off().find('.file-panel').off().end().remove();
    },
    // 当有文件添加进来时执行，负责view的创建
    addFile: function(file) {
    	var uploader = this.uploader;
    	var $queue = this.$queue;
    	var percentages = this._percentages;
        var $li = $('<li id="' + file.id + '">' + '<p class="title">' + file.name + '</p>' + '<p class="imgWrap"></p>' + '<p class="progress"><span></span></p>' + '</li>'),
            $btns = $('<div class="file-panel">' + '<span class="cancel">删除</span>' + '<span class="rotateRight hidden">向右旋转</span>' + '<span class="rotateLeft hidden">向左旋转</span></div>').appendTo($li),
            $prgress = $li.find('p.progress span'),
            $wrap = $li.find('p.imgWrap'),
            $info = $('<p class="error"></p>'),
            showError = function(code) {
                switch (code) {
                    case 'exceed_size':
                        text = '文件大小超出';
                        break;

                    case 'interrupt':
                        text = '上传暂停';
                        break;

                    default:
                        text = '上传失败，请重试';
                        break;
                }
                $info.text(text).appendTo($li);
            };
        if (file.getStatus() === 'invalid') {
            showError(file.statusText);
        } else {
            // @todo lazyload
            $wrap.text('预览中');
            uploader.makeThumb(file, function(error, src) {
                if (error) {
                    $wrap.text('不能预览');
                    return;
                }
                var img = $('<img src="' + src + '">');
                $wrap.empty().append(img);
            }, this.thumbnailWidth, this.thumbnailHeight);
            percentages[file.id] = [file.size, 0];
            file.rotation = 0;
        }

        file.on('statuschange', function(cur, prev) {
            if (prev === 'progress') {
                $prgress.hide().width(0);
            } else if (prev === 'queued') {
                $li.off('mouseenter mouseleave');
                $btns.remove();
            }
            // 成功
            if (cur === 'error' || cur === 'invalid') {
                showError(file.statusText);
                percentages[file.id][1] = 1;
            } else if (cur === 'interrupt') {
                showError('interrupt');
            } else if (cur === 'queued') {
                percentages[file.id][1] = 0;
            } else if (cur === 'progress') {
                $info.remove();
                $prgress.css('display', 'block');
            } else if (cur === 'complete') {
                $li.append('<span class="success"></span>');
            }
            $li.removeClass('state-' + prev).addClass('state-' + cur);
        });

        $li.on('mouseenter', function() {
            $btns.stop().animate({
                height: 30
            });
        });

        $li.on('mouseleave', function() {
            $btns.stop().animate({
                height: 0
            });
        });

        $btns.on('click', 'span', function() {
            var index = $(this).index(),
                deg;
            switch (index) {
                case 0:
                    uploader.removeFile(file);
                    return;

                case 1:
                    file.rotation += 90;
                    break;

                case 2:
                    file.rotation -= 90;
                    break;
            }
            if (mini.supportTransition) {
                deg = 'rotate(' + file.rotation + 'deg)';
                $wrap.css({
                    '-webkit-transform': deg,
                    '-mos-transform': deg,
                    '-o-transform': deg,
                    'transform': deg
                });
            } else {
                $wrap.css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + (~~ ((file.rotation / 90) % 4 + 4) % 4) + ')');
            }
        });
        $li.appendTo($queue);
    },
	__on_upload_progress: function(){

	},
	__on_upload_success: function(file, serverData) {

	},
	__on_file_queued: function(){

	},

	__on_upload_success: function(){

	},
	__on_upload_error: function(){

	},
	__on_upload_complete: function(){

	},
    setName: function(value) {
        if (this.name != value) {
            this.name = value;
            if (this._valueEl) mini.setAttr(this._valueEl, "name", this.name);
        }
    },
    addValue: function(value){
    	var v = this.value.split(',');
    	v.push(value);
    	this._setValue(v);
    },
    removeValue: function(value){

    },
    setValue: function(value){
    	var sf = this;
    	this._setValue(value);
    	if(mini.isString(value)){
    		value = value.split(',');
    	}
    	this.setState('ready');
    	mini.forEach(value, function(item, index){
    		// sf._fileCount++;
    		sf._addFile(item, index);
    	})
    },
    _addFile: function(item, index){
        // console.info(arguments);
        var sf = this;
        var $queue = this.$queue;
        var file = {
            id: 'wu_uploaded_' + index,
            name: item.split('/').reverse()[0],
        }

        var $li = $('<li id="' + file.id + '">' + '<p class="title">' + file.name + '</p>' + '<p class="imgWrap"></p>' + '<p class="progress"><span></span></p><span class="success"></span>' + '</li>'),
            // $btns = $('<div class="file-panel"><span class="cancel">删除</span></div>').appendTo($li),
            $prgress = $li.find('p.progress span'),
            $wrap = $li.find('p.imgWrap'),
            $info = $('<p class="error"></p>');
            var img = $('<img src="' + item + '" style="width:110px; height: 110px;">');
            $wrap.empty().append(img);


        // $li.on('mouseenter', function() {
        //     $btns.stop().animate({
        //         height: 30
        //     });
        // });

        // $li.on('mouseleave', function() {
        //     $btns.stop().animate({
        //         height: 0
        //     });
        // });
        // $btns.on('click', 'span', function() {
        //     var index = $(this).index(),
        //         deg;
        //     switch (index) {
        //         case 0:
        //             sf.removeFile(item);
        //             return;
        //     }
        // });
        $li.appendTo($queue);

    },
    _setValue: function(value) {
    	if(mini.isArray(value)){
    		value = value.join(',')
    	}
        if (value === null || value === undefined) value = "";
        value = String(value);
        if (this.value !== value) {
            this.value = value;
            this._valueEl.value  = value;
        }
    },
    getValue: function() {
    	if(this.value)
        	return this.value.split(',').slice(0, this.fileNumLimit);
    	else 
    		return [];
    },
    getFormValue: function() {
    	return this.getValue();
    },
	getAttrs: function(el) {
		var attrs = mini.WebuploadPanel.superclass.getAttrs.call(this, el);
		mini._ParseString(el, attrs, [
			"value", "text", "emptyText", "placeholder",
            "onenter", "onkeydown", "onkeyup", "onkeypress", "onclick",
            "maxLengthErrorText", "minLengthErrorText", "onfocus", "onblur",
            "vtype", "rangeLengthErrorText", "rangeErrorText", "rangeCharErrorText",
            "eqtoFieldErrorText", "flashUrl", "uploadUrl", "serverDataField"
        ]);
        mini._ParseInt(el, attrs, ["fileNumLimit", "fileSizeLimit", "fileSingleSizeLimit"]);

        if(attrs.flashUrl)
        	attrs.flashUrl = mini.parseUsePath(attrs.flashUrl);
        if(attrs.uploadUrl)
        	attrs.uploadUrl = mini.parseServerPath(attrs.uploadUrl);
		return attrs;
	}

})
mini.regClass(mini.WebuploadPanel, "webuploadpanel");
