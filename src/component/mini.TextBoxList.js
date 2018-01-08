mini.TextBoxList = function(el) {
    mini.TextBoxList.superclass.constructor.call(this, null);
    this.data = [];
    this.selecteds = [];
    this.doUpdate();
    if (el) mini.applyTo.call(this, el);
};
mini.extend(mini.TextBoxList, mini.ValidatorBase, {
    formField: true,
    remote: true,
    value: "",
    text: "",
    valueField: "id",
    textField: "text",
    selecteds: null,
    data: null,
    url: "",
    delay: 150,
    allowInput: true,
    editIndex: 0,
    _focusCls: "mini-textboxlist-focus",
    _itemHoverClass: "mini-textboxlist-item-hover",
    _itemSelectedClass: "mini-textboxlist-item-selected",
    _closeHoverClass: "mini-textboxlist-close-hover",
    textName: "",
    uiCls: "mini-textboxlist",
    errorIconEl: null,
    valueFromSelect: true,
    inputMode: false,
    ajaxDataType: "text",
    ajaxContentType: "application/x-www-form-urlencoded; charset=UTF-8",
    placeholder: "",
    emptyText: "No Result",
    loadingText: "Loading...",
    errorText: "Error",
    popupLoadingText: "<span class='mini-textboxlist-popup-loading'>Loading...</span>",
    popupErrorText: "<span class='mini-textboxlist-popup-error'>Error</span>",
    popupEmptyText: "<span class='mini-textboxlist-popup-noresult'>No Result</span>",
    isShowPopup: false,
    popupHeight: "",
    popupMinHeight: 30,
    popupMaxHeight: 150,
    searchField: "key",
    setTextName: function($) {
        this.textName = $
    },
    getTextName: function() {
        return this.textName
    },
    getData: function() {
        return this.data
    },
    setData: function($) {
        this.data = $
    },
    getRemote: function() {
        return this.remote
    },
    setRemote: function($) {
        this.remote = $
    },
    _create: function () {
		var html = '<table class="mini-textboxlist" cellpadding="0" cellspacing="0"><tr ><td class="mini-textboxlist-border"><ul></ul><a href="#"></a><input type="hidden"/></td></tr></table>';
		var d = document.createElement("div");
		d.innerHTML = html;
		this.el = d.firstChild;
		var td = this.el.getElementsByTagName("td")[0];
		this.ulEl = td.firstChild;
		this._valueEl = td.lastChild;
		this.focusEl = td.childNodes[1];
	},
    destroy: function (removeEl) {
		if (this.isShowPopup) {
			this.hidePopup();
		}
		if (this._inputEl) {
			mini.clearEvent(this._inputEl);
			this._inputEl.onkeyup = null;
			this._inputEl.onfocus = null;
			this._inputEl.onblur = null;
		}
		mini.un(document, "mousedown", this.__OnDocMouseDown, this);
		mini.TextBoxList.superclass.destroy.call(this, removeEl);
	},
    _initEvents: function () {
		mini.TextBoxList.superclass._initEvents.call(this);
		mini.on(this.el, "mousemove", this.__OnMouseMove, this);
		mini.on(this.el, "mouseout", this.__OnMouseOut, this);
		mini.on(this.el, "mousedown", this.__OnMouseDown, this);
		mini.on(this.el, "click", this.__OnClick, this);
		mini.on(this.el, "keydown", this.__OnKeyDown, this);
		mini.on(document, "mousedown", this.__OnDocMouseDown, this);
	},
    __OnDocMouseDown: function (e) {
		if (this.isReadOnly()) return;
		if (this.isShowPopup) {
			if (!mini.isAncestor(this.popup.el, e.target)) {
				this.hidePopup();
			}
		}
		var sf = this;
		if (this._focused) {
			if (this.within(e) == false) {
				clearInterval(this._ValueChangeTimer);
				this.select(null, false);
				setTimeout(function () {
					sf.showInput(false);
				}, 100);
				this.removeCls(this._focusCls);
				this._focused = false;
			}
		}
	},
    getErrorIconEl: function () {
		if (!this._errorIconEl) {
			var tr = this.el.rows[0];
			var td = tr.insertCell(1);
			td.style.cssText = 'width:18px;vertical-align:top;';
			td.innerHTML = '<div class="mini-errorIcon"></div>';
			this._errorIconEl = td.firstChild;
		}
		return this._errorIconEl;
	},
    _RemoveErrorIcon: function () {
		if (this._errorIconEl) {
			jQuery(this._errorIconEl.parentNode).remove();
		}
		this._errorIconEl = null;
	},
	doLayout: function () {
		if (this.canLayout() == false) return;
		mini.TextBoxList.superclass.doLayout.call(this);

		this.doReadOnly();
	},
	doReadOnly: function () {
		if (this.isReadOnly() || this.allowInput == false) {
			this._inputEl.readOnly = true;
		} else {
			this._inputEl.readOnly = false;
		}
	},
    doUpdate: function () {

		if (this._ValueChangeTimer) clearInterval(this._ValueChangeTimer);
		if (this._inputEl) mini.un(this._inputEl, "keydown", this.__OnInputKeyDown, this);

		var sb = [];
		var id = this.uid;
		for (var i = 0, l = this.selecteds.length; i < l; i++) {
			var o = this.selecteds[i];
			var li_id = id + "$text$" + i;
			var text = mini._getMap(this.textField, o);
			if (mini.isNull(text)) text = "";
			sb[sb.length] = '<li id="' + li_id + '" class="mini-textboxlist-item" title="'+ text +'">';
			sb[sb.length] = text;
			sb[sb.length] = '<span class="mini-textboxlist-close"></span></li>';
		}
		var inputid = id + "$input";
		sb[sb.length] = '<li id="' + inputid + '" class="mini-textboxlist-inputLi"><input class="mini-textboxlist-input" type="text" autocomplete="off"></li>';

		this.ulEl.innerHTML = sb.join("");

		this.editIndex = this.selecteds.length;
		if (this.editIndex < 0) this.editIndex = 0;

		this.inputLi = this.ulEl.lastChild;
		this._inputEl = this.inputLi.firstChild;
		this._inputEl.placeholder = this.placeholder;
		mini.on(this._inputEl, "keydown", this.__OnInputKeyDown, this);
		var sf = this;
		this._inputEl.onkeyup = function () {
			sf._syncInputSize();
		}
		sf._ValueChangeTimer = null;
		sf._LastInputText = sf._inputEl.value;
		this._inputEl.onfocus = function () {
			sf._LastInputText = sf._inputEl.value;
			sf._ValueChangeTimer = setInterval(function () {

				if (!sf._focused) {
					clearInterval(sf._ValueChangeTimer);
					sf._ValueChangeTimer = null;
					return;
				}
				if (sf._LastInputText != sf._inputEl.value) {
					sf._startQuery();
					sf._LastInputText = sf._inputEl.value;
				}
			}, 10);
			sf.addCls(sf._focusCls);
			sf._focused = true;
			sf.fire("focus");
		}
		this._inputEl.onblur = function () {
			clearInterval(sf._ValueChangeTimer);
			sf._ValueChangeTimer = null;
			sf.fire("blur");
			if (sf.validateOnLeave && sf.isEditable()) {
				sf._tryValidate();
			}
		}

		this.doReadOnly();
	},

    getItemByEvent: function (event) {
		var domItem = mini.findParent(event.target, "mini-textboxlist-item");
		if (domItem) {
			var ids = domItem.id.split("$");
			var id = ids[ids.length - 1];
			return this.selecteds[id];
		}
	},
    getItem: function (id) {
		if (typeof id == "number") return this.selecteds[id];
		if (typeof id == "object") return id;
	},
	getItemEl: function (o) {
		var index = this.selecteds.indexOf(o);
		var li_id = this.uid + "$text$" + index;
		return document.getElementById(li_id);
	},
	hoverItem: function (item, e) {
		if (this.isReadOnly() || this.enabled == false) return;
		this.blurItem();
		var li = this.getItemEl(item);
		mini.addClass(li, this._itemHoverClass);

		if (e && mini.hasClass(e.target, "mini-textboxlist-close")) {
			mini.addClass(e.target, this._closeHoverClass);
		}
	},
    blurItem: function () {
		var len = this.selecteds.length;
		for (var i = 0, l = len; i < l; i++) {
			var o = this.selecteds[i];
			var li = this.getItemEl(o);
			if (li) {
				mini.removeClass(li, this._itemHoverClass);
				mini.removeClass(li.lastChild, this._closeHoverClass);
			}
		}
	},
    showInput: function (index) {
		this.select(null);
		if (mini.isNumber(index)) {
			this.editIndex = index;
		} else {
			this.editIndex = this.selecteds.length;
		}
		if (this.editIndex < 0) this.editIndex = 0;
		if (this.editIndex > this.selecteds.length) this.editIndex = this.selecteds.length;

		var inputLi = this.inputLi;
		inputLi.style.display = "block";

		if (mini.isNumber(index) && index < this.selecteds.length) {
			var item = this.selecteds[index];
			var itemEl = this.getItemEl(item);
			jQuery(itemEl).before(inputLi);
		} else {
			this.ulEl.appendChild(inputLi);
		}
		if (index !== false) {
			setTimeout(function () {
				try {
					inputLi.firstChild.focus();
					mini.selectRange(inputLi.firstChild, 100);
				} catch (e) {
				}
			}, 10);
		} else {
			this.lastInputText = "";
			this._inputEl.value = "";
		}
		return inputLi;
	},
    select: function (item) {
		item = this.getItem(item);
		if (this._selected) {
			var itemEl = this.getItemEl(this._selected);
			mini.removeClass(itemEl, this._itemSelectedClass);
		}
		this._selected = item;
		if (this._selected) {
			var itemEl = this.getItemEl(this._selected);
			mini.addClass(itemEl, this._itemSelectedClass);
		}
		var sf = this;
		if (this._selected) {
			this.focusEl.focus();
			var me = this;
			setTimeout(function () {
				try {
					me.focusEl.focus();
				} catch (ex) { }
			}, 50);
		}

		if (this._selected) {
			sf.addCls(sf._focusCls);
			sf._focused = true;
		}
	},
    _doInsertInputValue: function () {
		var text = this.getInputText();
		var item = {};
		item[this.textField] = text;
		item[this.valueField] = text;
		var index = this.editIndex;
		this.insertItem(index, item);
	},
    _doInsertSelectValue: function () {
		if (this._listbox.getData().length == 0) return;
		var item = this._listbox.getSelected();
		var index = this.editIndex;

		if (item) {
			item = mini.clone(item);
			this.insertItem(index, item);
		}
	},
    insertItem: function (index, item) {
		this.selecteds.insert(index, item);
		var text = this.getText();
		var value = this.getValue();

		this.setValue(value, false);
		this.setText(text, false);

		this._createSelecteds();

		this.doUpdate();

		this.showInput(index + 1);

		this._OnValueChanged();
	},
    removeItem: function (item) {
		if (!item) return;
		var itemEl = this.getItemEl(item);
		mini.removeNode(itemEl);

		this.selecteds.remove(item);

		var text = this.getText();
		var value = this.getValue();
		this.setValue(value, false);
		this.setText(text, false);

		this._OnValueChanged();
	},
	_createSelecteds: function () {
		var texts = (this.text ? this.text : "").split(",");
		var values = (this.value ? this.value : "").split(",");

		if (values[0] == "") values = [];
		var len = values.length;
		this.selecteds.length = len;
		for (var i = 0, l = len; i < l; i++) {
			var o = this.selecteds[i];
			if (!o) {
				o = {};
				this.selecteds[i] = o;
			}
			var text = !mini.isNull(texts[i]) ? texts[i] : "";
			var value = !mini.isNull(values[i]) ? values[i] : "";
			mini._setMap(this.textField, text, o);
			mini._setMap(this.valueField, value, o);
		}
		this.value = this.getValue();
		this.text = this.getText();
	},
    getInputText: function () {
		return this._inputEl ? this._inputEl.value : "";
	},
    getText: function () {
		var sb = [];
		for (var i = 0, l = this.selecteds.length; i < l; i++) {
			var o = this.selecteds[i];
			var name = mini._getMap(this.textField, o);
			if (mini.isNull(name)) name = "";
			name = name.replace(",", "\uff0c");
			sb.push(name);
		}
		return sb.join(",");
	},
    getValue: function () {
		var sb = [];
		for (var i = 0, l = this.selecteds.length; i < l; i++) {
			var o = this.selecteds[i];
			var v = mini._getMap(this.valueField, o);
			sb.push(v);
		}
		return sb.join(",")
	},
    getFormValue: function () {
		var value = this.value;
		if (value === null || value === undefined) value = "";
		return String(value);
	},


	setName: function (value) {
		if (this.name != value) {
			this.name = value;
			this._valueEl.name = value;
		}
	},
    setValue: function (value) {
		if (mini.isNull(value)) value = "";
		if (this.value != value) {
			this.value = value;
			this._valueEl.value = value;
			this._createSelecteds();
			this.doUpdate();
		}
	},
    setText: function (value) {
		if (mini.isNull(value)) value = "";
		if (this.text !== value) {
			this.text = value;
			this._createSelecteds();
			this.doUpdate();
		}
	},
	setValueField: function (value) {
		this.valueField = value;
		this._createSelecteds();
	},
	getValueField: function () {
		return this.valueField;
	},
	setTextField: function (value) {
		this.textField = value;
		this._createSelecteds();
	},
	getTextField: function () {
		return this.textField;
	},
    setAllowInput: function (value) {
		this.allowInput = value;
		this.doLayout();
	},
	getAllowInput: function () {
		return this.allowInput;
	},
	setUrl: function (value) {
		this.url = value;
	},
	getUrl: function () {
		return this.url;
	},
	setPopupHeight: function (value) {
		this.popupHeight = value;
	},
	getPopupHeight: function () {
		return this.popupHeight;
	},
	setPopupMinHeight: function (value) {
		this.popupMinHeight = value;
	},
	getPopupMinHeight: function () {
		return this.popupMinHeight;
	},
	setPopupMaxHeight: function (value) {
		this.popupMaxHeight = value;
	},
	getPopupMaxHeight: function () {
		return this.popupMaxHeight;
	},
    setValueFromSelect: function (value) {
		this.valueFromSelect = value;
	},
	getValueFromSelect: function () {
		return this.valueFromSelect;
	},

	doQuery: function () {
		this._startQuery(true);
	},
    _syncInputSize: function () {
		if (this.isDisplay() == false) return;
		var text = this.getInputText();
		var size = mini.measureText(this._inputEl, text);
		var width = size.width > 20 ? size.width + 4 : 20;
		var elWidth = mini.getWidth(this.el, true);
		if (width > elWidth - 15) width = elWidth - 15;
		this._inputEl.style.width = width + "px";
	},
    setIputMode: function($) {
        this.inputMode = $
    },
    getIputMode: function() {
        return this.inputMode
    },
    _startQuery: function (oldText) {
		var sf = this;
		if (this.inputMode) return;
		setTimeout(function () {
			sf._syncInputSize();
		}, 1);
		this.showPopup("loading");
		this._stopQuery();
		this._loading = true;
		this.delayTimer = setTimeout(function () {
			var text = sf._inputEl.value;
			sf._doQuery();
		}, this.delay);
	},

    _getSelectedMap: function() {
        var A = {};
        for (var $ = 0, _ = this.selecteds.length; $ < _; $++) {
            var B = this.selecteds[$];
            A[B[this.valueField]] = B[this.textField]
        }
        return A
    },
    _getFilterLocalData: function(F) {
        var $ = this,
            _ = [],
            E = this._getSelectedMap();
        F = (F || "").toLowerCase();
        for (var A = 0, D = $.data.length; A < D; A++) {
            var G = $.data[A],
                B = G[this.valueField];
            if (!E[B]) {
                var C = G[this.textField];
                if (!F || String(C).toLowerCase().indexOf(F) != -1) _.push(G)
            }
        }
        return _
    },
    _doQuery: function () {
		if (this.isDisplay() == false) return;
		var text = this.getInputText();


		var sf = this;
		if (!sf.remote) {
            var data = this._getFilterLocalData(text);
            sf._listbox.setData(data);
            sf.showPopup();
            sf._listbox._focusItem(0, true);
            sf._loading = false;
            return;
        }

		var dataSource = this._listbox.getData();
		var params = {

			value: this.getValue(),
			text: this.getText()
		};
		params[this.searchField] = text;

		var url = this.url;
		var fn = typeof url == "function" ? url : window[url];
		if (typeof fn == "function") {
			url = fn(this);
		}
		if (!url) return;
		var ajaxMethod = "post";
		if (url) {
			if (url.indexOf(".txt") != -1 || url.indexOf(".json") != -1) {
				ajaxMethod = "get";
			}
		}
		var e = {
			url: url,
			async: true,
			params: params,
			data: params,
			type: this.ajaxType ? this.ajaxType : ajaxMethod,
			cache: false,
			cancel: false
		};

		jQuery.extend(true, e, this.ajaxOptions);

		this.fire("beforeload", e);
		if (e.cancel) return;

		var me = this;
		mini.copyTo(e, {
			success: function (text, textStatus, xhr) {
				delete e.params;
				var obj = { text: text, result: null, sender: me, options: e, xhr: xhr };
				var result = null;
				try {
					mini_doload(obj);
					result = obj.result;
					if (!result) {
						result = mini.decode(text);
					}
				} catch (ex) {
					if (mini_debugger == true) {
						throw new Error("textboxlist json is error");
					}
				}
				if (mini.isArray(result)) result = { data: result };
				if (me.dataField) {
					result.data = mini._getMap(me.dataField, result);
				}
				if (!result.data) result.data = [];

				sf._listbox.setData(result.data);
				sf.showPopup();
				sf._listbox._focusItem(0, true);
				sf.fire("load", { data: result.data, result: result });
				sf._loading = false;

				if (sf._selectOnLoad) {
					sf.__doSelectValue();
					sf._selectOnLoad = null;
				}
			},
			error: function (jqXHR, textStatus, errorThrown) {
				sf.showPopup("error");
			}
		});
		sf._ajaxer = mini.ajax(e);
	},

    _stopQuery: function () {
		if (this.delayTimer) {
			clearTimeout(this.delayTimer);
			this.delayTimer = null;
		}
		if (this._ajaxer) {
			this._ajaxer.abort();
		}
		this._loading = false;
	},
    within: function (e) {
		if (mini.isAncestor(this.el, e.target)) return true;
		if (this.showPopup && this.popup && this.popup.within(e)) return true;
		return false;
	},
    setPlaceholder: function(value) {
        this.placeholder = value
    },
    getPlaceholder: function() {
        return this.placeholder
    },
    setEmptyText: function(value) {
        this.popupEmptyText = "<span class='mini-textboxlist-popup-noresult'>" + value + "</span>";
        this.emptyText = value
    },
    getEmptyText: function() {
        return this.emptyText
    },
    setLoadingText: function(value) {
        this.popupLoadingText = "<span class='mini-textboxlist-popup-noresult'>" + value + "</span>";
        this.loadingText = value
    },
    getLoadingText: function() {
        return this.loadingText
    },
    setErrorText: function(value) {
        this.popupEmptyText = "<span class='mini-textboxlist-popup-noresult'>" + value + "</span>";
        this.errorText = value
    },
    getErrorText: function() {
        return this.errorText
    },
    _createPopup: function () {
		if (!this.popup) {
			this.popup = new mini.ListBox();
			this.popup.addCls("mini-textboxlist-popup");
			this.popup.setStyle("position:absolute;left:0;top:0;");
			this.popup.showEmpty = true;
			this.popup.setValueField(this.valueField);
			this.popup.setTextField(this.textField);
			this.popup.render(document.body);

			this.popup.on("itemclick", function (e) {
				this.hidePopup();

				this._doInsertSelectValue();
			}, this);
		}
		this._listbox = this.popup;
		return this.popup;
	},
    showPopup: function (action) {
		if (this.isDisplay() == false) return;
		this.isShowPopup = true;

		var popup = this._createPopup();

		popup.el.style.zIndex = mini.getMaxZIndex();
		var control = this._listbox;
		control.emptyText = this.popupEmptyText;


		if (action == "loading") {
			control.emptyText = this.popupLoadingText;
			this._listbox.setData([]);
		} else if (action == "error") {
			control.emptyText = this.popupLoadingText;
			this._listbox.setData([]);
		}
		this._listbox.doUpdate();

		var box = this.getBox();
		var x = box.x, y = box.y + box.height;

		this.popup.el.style.display = "block";
		mini.setXY(popup.el, -1000, -1000);
		this.popup.setWidth(box.width);

		this.popup.setHeight(this.popupHeight);

		if (this.popup.getHeight() < this.popupMinHeight) {
			this.popup.setHeight(this.popupMinHeight);
		}
		if (this.popup.getHeight() > this.popupMaxHeight) {
			this.popup.setHeight(this.popupMaxHeight);
		}
		mini.setXY(popup.el, x, y);

	},
    hidePopup: function () {
		this.isShowPopup = false;
		if (this.popup) this.popup.el.style.display = "none";
	},

	__OnMouseMove: function (e) {
		if (this.enabled == false) return;
		var item = this.getItemByEvent(e);
		if (!item) {
			this.blurItem();
			return;
		}
		this.hoverItem(item, e);
	},
	__OnMouseOut: function (e) {
		this.blurItem();
	},
	__OnMouseDown: function(e){
	},
    __OnClick: function (e) {
    	var me = this;
		if (this.isReadOnly() || this.enabled == false) return;
		if (this.enabled == false) return;


		var item = this.getItemByEvent(e);
		if (!item) {
			if (mini.findParent(e.target, "mini-textboxlist-input")) {

			} else {
				this.showInput();
			}
			return;
		}
		this.focusEl.focus();
		this.select(item);

		if (e && mini.hasClass(e.target, "mini-textboxlist-close")) {
			this.removeItem(item);
			this.fire("removeitem", {
                item: item
            })
		}
	},
    __OnKeyDown: function (e) {

		if (this.isReadOnly() || this.allowInput == false) return false;

		var index = this.selecteds.indexOf(this._selected);

		var sf = this;
		function remove() {
			var item = sf.selecteds[index];
			sf.removeItem(item);

			item = sf.selecteds[index];
			if (!item) item = sf.selecteds[index - 1];
			sf.select(item);
			if (!item) {
				sf.showInput();
			}
		}

		switch (e.keyCode) {
			case 8:

				e.preventDefault();
				remove();
				break;
			case 37:
			case 38:
				this.select(null);
				this.showInput(index);

				break;
			case 39:
			case 40:
				index += 1;
				this.select(null);
				this.showInput(index);

				break;
			case 46:
				remove();
				break;
		}
	},
    __doSelectValue: function () {
		var item = this._listbox.getFocusedItem();
		if (item) {
			this._listbox.setSelected(item);
			this.lastInputText = this.text;
			this.hidePopup();
			this._doInsertSelectValue();
		} else if (!this.valueFromSelect) {
			var text = this.getInputText().trim();
			if (text) {
				this._doInsertInputValue();
			}
		}
	},
	__OnInputKeyDown: function (e) {
		this._selectOnLoad = null;
		if (this.isReadOnly() || this.allowInput == false) return false;
		e.stopPropagation();
		if (this.isReadOnly() || this.allowInput == false) return;

		var range = mini.getSelectRange(this._inputEl);
		var start = range[0], end = range[1], textLen = this._inputEl.value.length;
		var isFirst = start == end && start == 0;
		var isLast = start == end && end == textLen;


		if (this.isReadOnly() || this.allowInput == false) {
			e.preventDefault();
		}
		if (e.keyCode == 9) {
			this.hidePopup();
			return;
		}
		if (e.keyCode == 16 || e.keyCode == 17 || e.keyCode == 18) return;

		switch (e.keyCode) {
			case 13:
				if (this.inputMode) {
                    var H = this.getInputText().trim();
                    if (H) this._doInsertInputValue();
                    return;
                }
				if (this.isShowPopup) {
					e.preventDefault();
					if (this._loading) {
						this._selectOnLoad = true;
						return;
					}
					var focused = this._listbox.getFocusedItem();
                    if (focused && focused.enabled === false) return;
					this.__doSelectValue();
				}
				break;

			case 27:
				e.preventDefault();
				this.hidePopup();
				break;
			case 8:
				if (isFirst) {
					e.preventDefault();
				}
			case 37:
				if (isFirst) {
					if (this.isShowPopup) {
						this.hidePopup();
					} else {
						if (this.editIndex > 0) {
							var index = this.editIndex - 1;
							if (index < 0) index = 0;
							if (index >= this.selecteds.length) index = this.selecteds.length - 1;

							this.showInput(false);
							this.select(index);
						}
					}
				}
				break;
			case 39:
				if (isLast) {
					if (this.isShowPopup) {
						this.hidePopup();
					} else {
						if (this.editIndex <= this.selecteds.length - 1) {
							var index = this.editIndex;
							this.showInput(false);
							this.select(index);
						}
					}
				}
				break;
			case 38:
				e.preventDefault();
				if (this.isShowPopup) {
					var index = -1;
					var item = this._listbox.getFocusedItem();
					if (item) index = this._listbox.indexOf(item);
					index--;
					if (index < 0) index = 0;
					this._listbox._focusItem(index, true);
				}
				break;
			case 40:
				e.preventDefault();
				if (this.isShowPopup) {
					var index = -1;
					var item = this._listbox.getFocusedItem();
					if (item) index = this._listbox.indexOf(item);
					index++
					if (index < 0) index = 0;
					if (index >= this._listbox.getCount()) index = this._listbox.getCount() - 1;
					this._listbox._focusItem(index, true);
				} else {
					this._startQuery(true);
				}
				break;
			default:
				break;
		}
	},

    focus: function () {
		try {
			this._inputEl.focus();
		} catch (e) {
		}
	},
	blur: function () {
		try {
			this._inputEl.blur();
		} catch (e) {
		}
	},
    searchField: mini_searchField,
    setSearchField: function (value) {
		this.searchField = value;
	},
	getSearchField: function () {
		return this.searchField;
	},
    getAttrs: function (el) {
		var attrs = mini.TextBox.superclass.getAttrs.call(this, el);
		var jq = jQuery(el);

		mini._ParseString(el, attrs,
			["value", "text", "valueField", "textField", "url", "popupHeight",
			"textName", "onfocus", "onbeforeload", "onload", "searchField",
			"emptyText", "loadingText", "errorText", "onblur", "onremoveitem", "placeholder"
			 ]
		);
		mini._ParseBool(el, attrs,
			["allowInput", "valueFromSelect",  "remote", "inputMode"
			 ]
		);

		mini._ParseInt(el, attrs,
			["popupMinHeight", "popupMaxHeight"
			 ]
		);
		return attrs;
	}
});


mini.regClass(mini.TextBoxList, "textboxlist");
