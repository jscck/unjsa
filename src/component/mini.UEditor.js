mini.UEditor = function() {
    mini.UEditor.superclass.constructor.apply(this, arguments);
}
mini.extend(mini.UEditor, mini.TextBox, {

    height: 300,
    initialFrameHeight: 300,
    _emptyCls: "mini-ueditor-empty",
    _focusCls: "mini-ueditor-focus",
    _disabledCls: "mini-ueditor-disabled",
    uiCls: "mini-ueditor",
    defaultToolbar: [["undo", "redo", "|", "bold", "italic", "underline", "fontborder", "strikethrough", "|", "forecolor", "backcolor", "fontsize", "justifyleft", "justifycenter", "justifyright", "|", "|", "selectall", "cleardoc", "removeformat"]],
    _create: function() {

        var ueid = this.ueid = this.uid + "$ueditor";
        html = '<div class="mini-ueditor-box" id="'+ ueid +'"></div>';
        html = '<span class="mini-ueditor-border">' + html + '</span>';
        html += '<input type="hidden"/>';

        this.el = document.createElement("div");
        this.el.className = "mini-ueditor";
        this.el.innerHTML = html;
        // this._borderEl = this.el.firstChild;
        // this._textEl = this._borderEl.firstChild;
        this._valueEl = this.el.lastChild;
        this._doEmpty();
    },
    _initEvents: function() {
        mini._BindEvents(function() {
            // mini_onOne(this._textEl, "drop", this.__OnDropText, this);
            // mini_onOne(this._textEl, "change", this.__OnInputTextChanged, this);
            // mini_onOne(this._textEl, "focus", this.__OnFocus, this);
            // mini_onOne(this.el, "mousedown", this.__OnMouseDown, this);

            this.initUEditor();
            this.initUEditorEvents();
        }, this);
        this.on("validation", this.__OnValidation, this);
    },
    initUEditor: function(){
        var me = this;
        if(!UE){
            mini.alert("UE 没有加载");
            return false;
        }
        if(this.ueObj){
            return;
        }
        var ueObj = UE.getEditor(this.ueid, {
            toolbars: this.defaultToolbar,
            initialFrameHeight: this.initialFrameHeight
        });
        this.ueObj = ueObj;

        this.fire('rendered', {
            ueObj: ueObj
        })
        var v = this.value;
        this.value = null;
        if (this.el && v) {
            this.setValue(v);
        }

    },
    initUEditorEvents: function(){
        var me = this;
        if(this.ueObj){
            var editor = this.ueObj;
            editor.addListener("contentChange", function(){
                me.setValue(me.getContent(), false);
            });
        }
    },
    setValue: function(value, dochange) {
        if (typeof dochange == 'undefined') {
            dochange = true;
        }
        if (value === null || value === undefined) value = "";
        value = String(value);
        if (value.length > this.maxLength) {
            value = value.substring(0, this.maxLength);
        }
        if (this.value !== value) {
            this.value = value;
            this._valueEl.value  = value;
            dochange && this.setContent(value);
            this._doEmpty();
        }
    },
    getContent:function () {
        return this.ueObj.getContent();
    },
    setContent: function (content) {
        var me = this;
        if(this.ueObj.isReady){
            this.ueObj.setContent(content);
        } else {
            this.ueObj.addListener('ready', function(){
                me.ueObj.setContent(content);
            })
        } 
    },
    setDisabled: function () {
        this.ueObj.setDisabled();
    },
    setEnabled: function(value) {
        this.enabled = value;
        if (this.enabled) {
            this.ueObj.setEnabled();
        } else {
            this.ueObj.setDisabled();
        }   
    },
    setReadOnly: function(value) {
        if (this.readOnly != value) {
            this.readOnly = value;
            this.deferUpdate();
        }
    },
    _inputEventsInited: true,
    _initInputEvents: function() {
        if (this._inputEventsInited) return;
        this._inputEventsInited = true;

        mini.on(this._textEl, "blur", this.__OnBlur, this);
        mini.on(this._textEl, "keydown", this.__OnInputKeyDown, this);
        mini.on(this._textEl, "keyup", this.__OnInputKeyUp, this);
        mini.on(this._textEl, "keypress", this.__OnInputKeyPress, this);

        mini_onOne(this.el, "click", this.__OnClick, this);
    },
    destroy: function(removeEl) {

        if(this.ueObj){
            try {
                this.ueObj.destroy();
            } catch(e) {};
        }

        mini.UEditor.superclass.destroy.call(this, removeEl);
    },
    doLayout: function() {
        // if (this._doLabelLayout) {
        //     this._labelLayout();
        // }
    },
    _placeholdered: false,
    _doEmpty: function() {
        if(this.ueObj) {
            this.ueObj.setOpt('initContent',  this.emptyText);
        }
    },
    deferUpdate: function(){
        var me = this;
        if(this.ueObj){
            if(this.ueObj.isReady){
                this.doUpdate();
            } else {
                this.ueObj.addListener('ready', function(){
                    me.doUpdate();
                })
            }
        } else {
            setTimeout(function(){
                me.deferUpdate();
            }, 100)
        }
    },
    doUpdate: function() {
        if (this.enabled) {
            this.removeCls(this._disabledCls);
        } else {
            this.addCls(this._disabledCls);
        }
        if (this.isReadOnly() || this.allowInput == false) {
            this.ueObj.setDisabled();
            mini.addClass(this.el, "mini-ueditor-readOnly");
        } else {
            this.ueObj.setEnabled();
            mini.removeClass(this.el, "mini-ueditor-readOnly");
        }
        if (this.required) {
            this.addCls(this._requiredCls);
        } else {
            this.removeCls(this._requiredCls);
        }
        // if (this.enabled && !this.isReadOnly()) {
        //     this.ueObj.setEnabled();
        // } else {
        //     this.ueObj.setDisabled();
        // }
    },
    getAttrs: function(el) {
        var attrs = mini.UEditor.superclass.getAttrs.call(this, el);
        var jq = jQuery(el);
        mini._ParseString(el, attrs, [ "onrendered",
             'initialFrameHeight'
        ]);
        // mini._ParseBool(el, attrs, ["allowInput", "selectOnFocus"]);
        // mini._ParseInt(el, attrs, ["maxLength", "minLength", "minHeight", "minWidth"]);

        return attrs;
    }
});

mini.regClass(mini.UEditor, 'ueditor');
