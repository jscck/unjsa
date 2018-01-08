mini.PayPass = function() {
    mini.PayPass.superclass.constructor.apply(this, arguments);
}
mini.extend(mini.PayPass, mini.TextBox, {
    maxLength: 6,
    _emptyCls: "mini-paypass-empty",
    _focusCls: "mini-paypass-focus",
    _disabledCls: "mini-paypass-disabled",
    uiCls: "mini-paypass",
    _create: function() {
        html = '<input type="text" class="realInput"/>'+
                '<div class="bogusInput">' +
                    this._getInputsHtml() + 
                '</div>';
        html = '<span class="mini-paypass-border">' + html + '</span>';
        html += '<input type="hidden"/>';
        this.el = document.createElement("span");
        this.el.className = "mini-paypass mini-textbox";
        this.el.innerHTML = html;
        this._borderEl = this.el.firstChild;
        this._textEl = this._borderEl.firstChild;
        this._valueEl = this.el.lastChild;
        this._realInput = this._borderEl.children[0];
        this._bogusInput = this._borderEl.children[1];
        this.bogusInputArr = this._bogusInput.children;

        this._doEmpty();
    },
    _getInputsHtml: function(){
        return ('<input type="password" style="width:'+ parseFloat(unit.floorer(100 / this.maxLength, 1)).toFixed(1) +'%;" disabled/>').repeat(this.maxLength)
    },
    _initEvents: function() {
        mini._BindEvents(function() {
            // mini_onOne(this._textEl, "drop", this.__OnDropText, this);
            mini_onOne(this._textEl, "change", this.__OnInputTextChanged, this);
            mini_onOne(this._textEl, "input", this.__OnInputTextChanged, this);
            mini_onOne(this._textEl, "focus", this.__OnFocus, this);
            mini_onOne(this.el, "mousedown", this.__OnMouseDown, this);

            var v = this.value;
            this.value = null;
            if (this.el) {
                this.setValue(v);
            }

        }, this);
        this.on("validation", this.__OnValidation, this);
    },
    destroy: function(removeEl) {
        mini.PayPass.superclass.destroy.call(this, removeEl);
    },
    doLayout: function() {
        // if (this._doLabelLayout) {
        //     this._labelLayout();
        // }
    },
    setValue: function(value) {

        if (value === null || value === undefined) value = "";
        value = String(value);
        if (value.length > this.maxLength) {
            value = value.substring(0, this.maxLength);
        }
        if (this.value !== value) {
            this.value = value;
            this._valueEl.value = this._textEl.value = value;
            for(var i = 0; i < this.maxLength; i++){
                this.bogusInputArr[i].value = value[i] ? value[i] : "";
            }
            this._doEmpty();
        }
    },
    getBoxInputValue:function(){
        var val = "";
        for(var i in this.bogusInputArr){
            if(!this.bogusInputArr[i].value){
                break;
            }
            val += this.bogusInputArr[i].value;
        }
        return val;
    },
    setMaxLength: function(value) {

        this.maxLength = value;
        mini.setAttr(this._textEl, "maxLength", value);
        // rerender
        this._bogusInput.innerHTML = this._getInputsHtml();
        this.bogusInputArr = this._bogusInput.children;

        if (this._InputType == "textarea" && mini.isIE) {
            mini.on(this._textEl, "keyup", this.__OnMaxLengthKeyUp, this);
            mini.on(this._textEl, "keypress", this.__OnMaxLengthKeyUp, this);
            mini.on(this._textEl, "paste", this.__OnPaste, this);
        }
    },
    getAttrs: function(el) {
        var attrs = mini.PayPass.superclass.getAttrs.call(this, el);
        return attrs;
    }
});

mini.regClass(mini.PayPass, 'paypass');
