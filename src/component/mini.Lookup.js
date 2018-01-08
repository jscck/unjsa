mini.Lookup = function () {
	this.data = [];
	mini.Lookup.superclass.constructor.apply(this, arguments);

	mini.on(this._textEl, "mouseup", this.__OnMouseUp, this);

	this.on("showpopup", this.__OnShowPopup, this);

}
mini.extend(mini.Lookup, mini.PopupEdit, {
	allowInput: true,

	valueField: "id",
	textField: "text",
	delimiter: ',',

	multiSelect: false,

	data: [],

	grid: null,
	_destroyPopup: false,


	uiCls: "mini-lookup",
	destroy: function (removeEl) {

		if (this.grid) {


			this.grid.un("rowclick", this.__OnGridRowClickChanged, this);
			this.grid.un("load", this.__OnGridLoad, this);
			this.grid.un("checkall", this.__OnGridRowClickChanged, this);
			this.grid = null;


		}
		mini.Lookup.superclass.destroy.call(this, removeEl);
	},
	setMultiSelect: function (value) {
		this.multiSelect = value;

		if (this.grid) this.grid.setMultiSelect(value);
	},
	setGrid: function (value) {

		if (typeof value == "string") {
			mini.parse(value);
			value = mini.get(value);
		}
		this.grid = mini.getAndCreate(value);
		if (this.grid) {
			this.grid.setMultiSelect(this.multiSelect);
			this.grid.setCheckSelectOnLoad(false);
			this.grid.on("rowclick", this.__OnGridRowClickChanged, this);
			this.grid.on("load", this.__OnGridLoad, this);
			this.grid.on("checkall", this.__OnGridRowClickChanged, this);

		}
	},
	getGrid: function () {
		return this.grid;
	},
	setValueField: function (valueField) {
		this.valueField = valueField;
	},
	getValueField: function () {
		return this.valueField;
	},
	setTextField: function (value) {

		this.textField = value;
	},
	getTextField: function () {
		return this.textField;
	},
	deselectAll: function () {
		this.data = [];
		this.setValue("");
		this.setText("");
		if (this.grid) this.grid.deselectAll();
	},

	getItemValue: function (item) {
		return String(item[this.valueField]);
	},
	getItemText: function (item) {
		var t = item[this.textField];
		return mini.isNull(t) ? '' : String(t);
	},
	getValueAndText: function (records) {
		if (mini.isNull(records)) records = [];

		var values = [];
		var texts = [];
		for (var i = 0, l = records.length; i < l; i++) {
			var record = records[i];
			if (record) {
				values.push(this.getItemValue(record));
				texts.push(this.getItemText(record));
			}
		}
		return [values.join(this.delimiter), texts.join(this.delimiter)];
	},
	_createData: function () {
		this.value = mini.isNull(this.value) ? "" : String(this.value);
		this.text = mini.isNull(this.text) ? "" : String(this.text);



		var data = [];
		var values = this.value.split(this.delimiter);
		var texts = this.text.split(this.delimiter);
		var len = values.length;

		if (this.value) {
			for (var i = 0, l = len; i < l; i++) {
				var row = {};
				var id = values[i];
				var text = texts[i];
				row[this.valueField] = id ? id : "";
				row[this.textField] = text ? text : "";
				data.push(row);
			}
		}
		this.data = data;

	},
	_getValueMaps: function (rows) {

		var vs = {};
		for (var i = 0, l = rows.length; i < l; i++) {
			var row = rows[i];
			var id = row[this.valueField];
			vs[id] = row;
		}
		return vs;
	},
	setValue: function (value) {

		mini.Lookup.superclass.setValue.call(this, value);
		this._createData();
	},
	setText: function (value) {
		mini.Lookup.superclass.setText.call(this, value);
		this._createData();
	},
	__OnGridRowClickChanged: function (e) {


		var rows = this._getValueMaps(this.grid.getList());
		var sels = this._getValueMaps(this.grid.getSelecteds());
		var vs = this._getValueMaps(this.data);
		if (this.multiSelect == false) {
			vs = {};
			this.data = [];
		}

		var removes = {};
		for (var id in vs) {
			var o = vs[id];
			if (rows[id]) {
				if (sels[id]) {

				} else {
					removes[id] = o;
				}
			}
		}
		for (var i = this.data.length - 1; i >= 0; i--) {
			var o = this.data[i];
			var id = o[this.valueField];
			if (removes[id]) this.data.removeAt(i);
		}


		for (var id in sels) {
			var o = sels[id];
			if (!vs[id]) this.data.push(o);
		}



		var vts = this.getValueAndText(this.data);

		this.setValue(vts[0]);
		this.setText(vts[1]);

		this._OnValueChanged();
	},
	__OnGridLoad: function (e) {
		this.__OnShowPopup(e);
	},
	__OnShowPopup: function (e) {

		var vsb = String(this.value).split(this.delimiter);
		var vs = {};
		for (var i = 0, l = vsb.length; i < l; i++) {
			var v = vsb[i];
			vs[v] = 1;
		}

		var rows = this.grid.getData();


		var sels = [];
		for (var i = 0, l = rows.length; i < l; i++) {
			var row = rows[i];
			var id = row[this.valueField];
			if (vs[id]) sels.push(row);
		}

		this.grid.selects(sels);
	},



	doUpdate: function () {
		mini.Lookup.superclass.doUpdate.call(this);
		this._textEl.readOnly = true;
		this.el.style.cursor = "default";

	},
	__OnInputKeyDown: function (e) {
		mini.Lookup.superclass.__OnInputKeyDown.call(this, e);

		switch (e.keyCode) {
			case 46:
			case 8:

				break;
			case 37:

				break;
			case 39:

				break;
		}







	},
	__OnMouseUp: function (e) {
		if (this.isReadOnly()) return;


		var rg = mini.getSelectRange(this._textEl);
		var start = rg[0], end = rg[1];


		var index = this._findTextIndex(start);


	},
	_findTextIndex: function (rgIndex) {
		var index = -1;
		if (this.text == "") return index;

		var texts = String(this.text).split(this.delimiter);
		var len = 0;
		for (var i = 0, l = texts.length; i < l; i++) {
			var text = texts[i];
			if (len < rgIndex && rgIndex <= len + text.length) {
				index = i;
				break;
			}
			len = len + text.length + 1;
		}
		return index;
	},


	getAttrs: function (el) {
		var attrs = mini.Lookup.superclass.getAttrs.call(this, el);

		mini._ParseString(el, attrs,
			["grid", "valueField", "textField"
			 ]
		);
		mini._ParseBool(el, attrs,
			["multiSelect"
			 ]
		);

		return attrs;
	}
});

mini.regClass(mini.Lookup, 'lookup');
