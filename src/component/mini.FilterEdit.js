mini.FilterEdit = function () {
	mini.FilterEdit.superclass.constructor.apply(this, arguments);

	this.on("buttonclick", this.__OnButtonClick, this);
	this.on("closeclick", this.__OnCloseClick, this);

}
mini.extend(mini.FilterEdit, mini.ButtonEdit, {

	uiCls: "mini-filteredit",
	_deferSetText: false,

	value: "",
	filterValue: "",
	filterData: null,

	_getMenu: function () {
		var self = this;
		if (!this.menu) {
			this.menu = new mini.Menu();
			this.menu.on("itemclick", function (e) {
				self.setFilterValue(e.item.value);
				self._OnValueChanged();
			});
		}
		return this.menu;
	},
	__OnButtonClick: function (e) {
		var menu = this._getMenu();

		var data = (this.filterData || []).clone();
		menu.setItems(data);

		var item = this.findItem(this.filterValue);
		menu.setSelectedItem(item);

		menu.showAtEl(this._buttonsEl, {});
	},
	__OnCloseClick: function (e) {
		this.setText("");
		this.setValue("");
		this.setFilterValue("");
		this._OnValueChanged();
	},

	findItem: function (value) {
		var menu = this._getMenu();
		var items = menu.getItems();
		for (var i = 0, l = items.length; i < l; i++) {
			var item = items[i];
			if (item.value == value) {
				return item;
			}
		}
		return null;
	},

	setValue: function (value) {

		if (value === null || value === undefined) value = "";
		value = String(value);

		this.value = value;
		this._valueEl.value = this._textEl.value = value;
	},
	getFilterData: function () {
		return this.filterData || [];
	},
	setFilterData: function (value) {
		if (!mini.isArray(value)) value = [];
		this.filterData = value;
	},
	getFilterValue: function () {
		return this.filterValue || "";
	},
	setFilterValue: function (value) {
		if (value === null || value === undefined) value = "";
		this.filterValue = value;
	},

	getAttrs: function (el) {
		var attrs = mini.FilterEdit.superclass.getAttrs.call(this, el);
		var jq = jQuery(el);

		mini._ParseString(el, attrs,
			["value", "text", "filterValue", "filterData"
			 ]
		);

		if (typeof attrs.filterData == "string") {
			try {
				attrs.filterData = eval('(' + attrs.filterData + ')');
			} catch (e) {
				attrs.filterData = mini._getMap(attrs.filterData, window);
			}
		}

		return attrs;
	}


});

mini.regClass(mini.FilterEdit, "filteredit");
