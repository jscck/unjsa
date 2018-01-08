mini.AutoComplete = function () {
	mini.AutoComplete.superclass.constructor.apply(this, arguments);



	var sf = this;
	sf._ValueChangeTimer = null;

	this._textEl.onfocus = function () {

		sf._LastInputText = sf._textEl.value;
		sf._ValueChangeTimer = setInterval(function () {


			if (sf._LastInputText != sf._textEl.value) {


				sf._tryQuery();
				sf._LastInputText = sf._textEl.value;

				if (sf._textEl.value == "" && sf.value != "") {
					sf.setValue("");
					sf._OnValueChanged();
				}
			}
		}, 10);



	}
	this._textEl.onblur = function () {
		clearInterval(sf._ValueChangeTimer);
		if (!sf.isShowPopup()) {
			if (sf._LastInputText != sf._textEl.value) {

				if (sf._textEl.value == "" && sf.value != "") {
					sf.setValue("");
					sf._OnValueChanged();
				}
			}
		}
	}

	this._buttonEl.style.display = "none";

	this._doInputLayout();
}
mini.extend(mini.AutoComplete, mini.ComboBox, {
	url: "",
	allowInput: true,
	delay: 150,

	showButton: false,

	searchField: mini_searchField,

	minChars: 0,

	_buttonWidth: 0,

	uiCls: "mini-autocomplete",

	_initInput: function () {
		var me = this;

		if (isFirefox) {
			this._textEl.oninput = function () {
				if (!me.enterQuery) {
					me._tryQuery();
				}
			}
		}
	},

	setUrl: function (value) {
		this.url = value;
	},
	setValue: function (value) {

		if (mini.isNull(value)) value = "";
		if (this.value != value) {
			this.value = value;
			this._valueEl.value = this.value;
		}
		this.__oldText = '';
	},
	setText: function (value) {
		if (mini.isNull(value)) value = "";
		if (this.text != value) {
			this.text = value;
			this._LastInputText = value;
		}




		this._textEl.value = this.text;


	},

	setMinChars: function (value) {
		this.minChars = value;
	},
	getMinChars: function () {
		return this.minChars;
	},
	setSearchField: function (value) {
		this.searchField = value;
	},
	getSearchField: function () {
		return this.searchField;
	},



	popupEmptyText: "No Result",
	setPopupEmptyText: function (value) {
		this.popupEmptyText = value;
	},
	getPopupEmptyText: function (value) {
		return this.popupEmptyText;
	},
	loadingText: "Loading...",
	setLoadingText: function (value) {
		this.loadingText = value;
	},
	getLoadingText: function (value) {
		return this.loadingText;
	},
	errorText: "Error",
	setErrorText: function (value) {
		this.errorText = value;
	},
	getErrorText: function (value) {
		return this.errorText;
	},






	getPopupEmptyHtml: function () {
		return "<span class='mini-textboxlist-popup-noresult'>" + this.popupEmptyText + "</span>";
	},
	getPopupLoadingHtml: function () {
		return "<span class='mini-textboxlist-popup-loading'>" + this.loadingText + "</span>"
	},
	getPopupErrorHtml: function () {
		return "<span class='mini-textboxlist-popup-error'>" + this.errorText + "</span>";
	},

	showPopup: function (action) {

		var popup = this.getPopup();
		var control = this._listbox;
		control.showEmpty = true;
		control.emptyText = this.getPopupEmptyHtml();
		if (action == "loading") {
			control.emptyText = this.getPopupLoadingHtml();
			this._listbox.setData([]);
		} else if (action == "error") {
			control.emptyText = this.getPopupErrorHtml();
			this._listbox.setData([]);
		}
		this._listbox.doUpdate();

		mini.AutoComplete.superclass.showPopup.call(this);


	},




	__OnInputKeyDown: function (e) {
		var ex = { htmlEvent: e };
		this.fire("keydown", ex);
		if (e.keyCode == 8 && (this.isReadOnly() || this.allowInput == false)) {
			return false;
		}
		if (e.keyCode == 9) {
			this.hidePopup();
			return;
		}
		if (e.keyCode == 16 || e.keyCode == 17 || e.keyCode == 18) {
			return;
		}

		if (this.isReadOnly()) return;

		switch (e.keyCode) {
			case 27:
				if (this.isShowPopup()) {
					e.stopPropagation();
				}

				this.hidePopup();
				break;
			case 13:


				if (!this.isShowPopup() || this._listbox.getData().length == 0) {
					if (this.enterQuery) {
						this._tryQuery(this._textEl.value);
					}
				}

				if (this.isShowPopup()) {
					e.preventDefault();
					e.stopPropagation();

					var index = this._listbox.getFocusedIndex();

					if (index != -1) {
						var item = this._listbox.getAt(index);
						var vts = this._listbox.getValueAndText([item]);
						var value = vts[0];

						this.setText(vts[1]);





						this.setValue(value);

						this._OnValueChanged();



					}
				} else {

					this.fire("enter", ex);
				}

				this.hidePopup();
				this.focus();
				break;
			case 37:
				break;
			case 38:
				var index = this._listbox.getFocusedIndex();
				if (index == -1) {
					index = 0;
					if (!this.multiSelect) {
						var item = this._listbox.findItems(this.value)[0];
						if (item) {
							index = this._listbox.indexOf(item);
						}
					}
				}
				if (this.isShowPopup()) {
					if (!this.multiSelect) {
						index -= 1;
						if (index < 0) index = 0;
						this._listbox._focusItem(index, true);
					}
				}
				break;
			case 39:
				break;
			case 40:

				var index = this._listbox.getFocusedIndex();
				if (this.isShowPopup()) {
					if (!this.multiSelect) {
						index += 1;
						if (index > this._listbox.getCount() - 1) index = this._listbox.getCount() - 1;
						this._listbox._focusItem(index, true);
					}
				} else {
					this._tryQuery(this._textEl.value);
				}
				break;
			default:
				if (this.enterQuery == true) {
					this.hidePopup();
					this.focus();
				} else {

					this._keydownQuery();


				}

				break;
		}
	},

	_keydownQuery: function () {
		var me = this;







		if (me._keydownTimer) {
			clearTimeout(me._keydownTimer);
			me._keydownTimer = null;
		}

		me._keydownTimer = setTimeout(function () {

			var text = me._textEl.value;
			if (text != me.__oldText) {
				me._tryQuery(text);


				me.__oldText = text;
			}

		}, 20);

	},

	enterQuery: false,
	doQuery: function () {
		this._tryQuery();
	},
	_tryQuery: function (oldText) {
		var sf = this;
		if (this._queryTimer) {
			clearTimeout(this._queryTimer);
			this._queryTimer = null;
		}
		this._queryTimer = setTimeout(function () {
			var text = sf._textEl.value;

			sf._doQuery(text);





		}, this.delay);
		this.showPopup("loading");
	},

	_doQuery: function (key) {

		if (this._ajaxer) {
			this._ajaxer.abort();
		}

		var url = this.url;
		var ajaxMethod = "post";
		if (url) {
			if (url.indexOf(".txt") != -1 || url.indexOf(".json") != -1) {
				ajaxMethod = "get";
			}
		}

		var params = {};
		params[this.searchField] = key;

		var e = {
			url: url,
			async: true,
			params: params,
			data: params,
			type: this.ajaxType ? this.ajaxType : ajaxMethod,
			cache: false,
			cancel: false
		};

		this.fire("beforeload", e);

		var me = this;
		function doload(data, result) {
			me._listbox.setData(data);
			me.showPopup();
			me._listbox._focusItem(0, true);
			me.data = data;
			me.fire("load", { data: data, result: result });
		}

		if (e.cancel) {
			var data = e.result || [];
			doload(data, data);
			return;
		}




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
						throw new Error("autocomplete json is error");
					}
				}
				if (mini.isArray(result)) result = { data: result };











				if (me.dataField) {
					result.data = mini._getMap(me.dataField, result);
				}
				if (!result.data) result.data = [];

				doload(result.data, result);






			},
			error: function (jqXHR, textStatus, errorThrown) {



			}
		});

		this._ajaxer = mini.ajax(e);
	},
	setEnterQuery: function (value) {
		this.enterQuery = value;
	},
	getEnterQuery: function () {
		return this.enterQuery;
	},

	getAttrs: function (el) {
		var attrs = mini.AutoComplete.superclass.getAttrs.call(this, el);

		mini._ParseString(el, attrs,
			["searchField", "popupEmptyText", "loadingText", "errorText"]
		);
		mini._ParseBool(el, attrs,
			["enterQuery"]
		);


		return attrs;
	}
});

mini.regClass(mini.AutoComplete, "autocomplete");
