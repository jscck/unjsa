mini.OutlookTree = function () {
	mini.OutlookTree.superclass.constructor.apply(this, arguments);

	this.data = [];
}
mini.extend(mini.OutlookTree, mini.OutlookBar, {
	url: "",
	textField: "text",
	iconField: "iconCls",
	urlField: "url",

	resultAsTree: false,
	nodesField: "children",
	idField: "id",
	parentField: "pid",

	style: "width:100%;height:100%;",


	showTreeLines: true,


	set: function (kv) {
		if (typeof kv == 'string') {
			return this;
		}

		var url = kv.url;
		delete kv.url;
		var activeIndex = kv.activeIndex;
		delete kv.activeIndex;

		mini.OutlookTree.superclass.set.call(this, kv);

		if (url) {
			this.setUrl(url);
		}
		if (mini.isNumber(activeIndex)) {
			this.setActiveIndex(activeIndex);
		}
		return this;
	},
	uiCls: "mini-outlooktree",
	destroy: function (removeEl) {
		this._destroyTrees(removeEl);

		mini.OutlookTree.superclass.destroy.call(this, removeEl);
	},
	_destroyTrees: function (removeEl) {
		if (this._trees) {
			var cs = this._trees.clone();

			for (var i = 0, l = cs.length; i < l; i++) {
				var p = cs[i];
				p.destroy(removeEl);
			}
			this._trees.length = 0;
		}
	},

	_doParseFields: function (list) {
		for (var i = 0, l = list.length; i < l; i++) {
			var o = list[i];
			o.text = o[this.textField];
			o.url = o[this.urlField];
			o.iconCls = o[this.iconField];
		}
	},
	_doLoad: function () {


		var items = [];

		try {
			items = mini._getResult(this.url, null, null, null, null, this.dataField);
		} catch (ex) {

			if (mini_debugger == true) {
				alert("outlooktree json is error.");
			}
		}

		if (this.dataField && !mini.isArray(items)) {
			items = mini._getMap(this.dataField, items);
		}
		if (!items) items = [];

		if (this.resultAsTree == false) {
			items = mini.arrayToTree(items, this.nodesField, this.idField, this.parentField)
		}

		var list = mini.treeToArray(items, this.nodesField, this.idField, this.parentField)
		this._doParseFields(list);

		this.createNavBarTree(items);
		this.fire("load");
	},
	loadList: function (list, idField, parentField) {
		idField = idField || this.idField;
		parentField = parentField || this.parentField;
		this._doParseFields(list);
		var tree = mini.arrayToTree(list, this.nodesField, idField, parentField);
		this.load(tree);
	},
	load: function (value) {
		if (typeof value == "string") {
			this.setUrl(value);
		} else {
			var list = mini.treeToArray(value, this.itemsField, this.idField, this.parentField)
			this._doParseFields(list);

			this.createNavBarTree(value);
		}
	},
	setData: function (value) {
		this.load(value);
	},
	getData: function () {
		return this.data;
	},
	setUrl: function (value) {
		this.url = value;
		this._doLoad();
	},
	getUrl: function () {
		return this.url;
	},
	setTextField: function (value) {
		this.textField = value;
	},
	getTextField: function () {
		return this.textField;
	},
	setIconField: function (value) {
		this.iconField = value;
	},
	getIconField: function () {
		return this.iconField;
	},
	setUrlField: function (value) {
		this.urlField = value;
	},
	getUrlField: function () {
		return this.urlField;
	},
	setResultAsTree: function (value) {
		this.resultAsTree = value;
	},
	getResultAsTree: function () {
		return this.resultAsTree;
	},
	setNodesField: function (value) {
		this.nodesField = value;
	},
	getNodesField: function () {
		return this.nodesField;
	},
	setIdField: function (value) {
		this.idField = value;

	},
	getIdField: function () {
		return this.idField;
	},
	setParentField: function (value) {
		this.parentField = value;
	},
	getParentField: function () {
		return this.parentField;
	},
	_selected: null,
	getSelected: function () {
		return this._selected;
	},
	isSelectedNode: function (node) {
		node = this.getNode(node);
		if (!node) return false;
		var tree = this._getOwnerTree(node);
		if (!tree) return false;
		return tree.isSelectedNode(node);
	},
	selectNode: function (node) {
		node = this.getNode(node);
		if (!node) return;
		var tree = this._getOwnerTree(node);
		tree.selectNode(node);
	},
	expandPath: function (node) {
		node = this.getNode(node);
		if (!node) return;
		var tree = this._getOwnerTree(node);
		tree.expandPath(node);
		this.expandGroup(tree._ownerGroup);
	},
	expandNode: function (node, deep) {
		var node = this.getNode(node);
		if (!node) return;
		var tree = this._getOwnerTree(node);
		tree.expandNode(node, deep);
	},
	collapseNode: function (node, deep) {
		var node = this.getNode(node);
		if (!node) return;
		var tree = this._getOwnerTree(node);
		tree.collapseNode(node, deep);
	},
	findNodes: function (fn, scope) {
		var nodes = [];
		scope = scope || this;
		for (var i = 0, l = this._trees.length; i < l; i++) {
			var tree = this._trees[i];
			var nds = tree.findNodes(fn, scope);
			nodes.addRange(nds);
		}
		return nodes;
	},
	getNode: function (node) {

		for (var i = 0, l = this._trees.length; i < l; i++) {
			var tree = this._trees[i];
			var n = tree.getNode(node);
			if (n) return n;
		}
		return null;
	},

	getList: function () {
		var list = [];
		for (var i = 0, l = this._trees.length; i < l; i++) {
			var tree = this._trees[i];
			var nodes = tree.getList();
			list.addRange(nodes);
		}
		return list;
	},
	_getOwnerTree: function (node) {
		if (!node) return;
		for (var i = 0, l = this._trees.length; i < l; i++) {
			var tree = this._trees[i];
			if (tree.getby_id(node._id)) return tree;
		}
	},
	expandOnLoad: false,
	setExpandOnLoad: function (value) {
		this.expandOnLoad = value;
	},
	getExpandOnLoad: function () {
		return this.expandOnLoad;
	},

	showArrow: false,
	setShowArrow: function (value) {
		this.showArrow = value;
	},
	getShowArrow: function () {
		return this.showArrow;
	},

	showTreeIcon: true,
	setShowTreeIcon: function (value) {
		this.showTreeIcon = value;
	},
	getShowTreeIcon: function (value) {
		return this.showTreeIcon;
	},

	expandOnNodeClick: false,
	setExpandOnNodeClick: function (value) {
		this.expandOnNodeClick = value;
	},
	getExpandOnNodeClick: function () {
		return this.expandOnNodeClick;
	},
	expandNodeOnLoad: false,
	setExpandNodeOnLoad: function (value) {
		this.expandNodeOnLoad = value;
	},
	getExpandNodeOnLoad: function () {
		return this.expandNodeOnLoad;
	},

	_handlerTree: function (e) {

		e.tree = e.sender;
		e.sender = this;
		var type = "node" + e.type;
		if (e.type.indexOf("before") == 0) {
			type = "beforenode" + e.type.replace("before", "");
		}

		this.fire(type, e);
	},
	getAttrs: function (el) {
		var attrs = mini.OutlookTree.superclass.getAttrs.call(this, el);

		attrs.text = el.innerHTML;
		mini._ParseString(el, attrs,
			["url", "textField", "urlField", "idField", "parentField", "nodesField", "iconField",
				"onnodeclick", "onnodeselect", "onnodemousedown", "ondrawnode",
				"expandOnLoad", "imgPath",
				"onbeforenodeexpand", "onnodeexpand", "onbeforenodecollapse", "onnodecollapse",
				"onload", "onbeforenodeselect"
			]
		);
		mini._ParseBool(el, attrs,
			["resultAsTree", "showArrow", "showTreeIcon", "expandOnNodeClick", "expandNodeOnLoad", "showTreeLines"]
		);


		if (attrs.expandOnLoad) {
			var level = parseInt(attrs.expandOnLoad);
			if (mini.isNumber(level)) {
				attrs.expandOnLoad = level;
			} else {
				attrs.expandOnLoad = attrs.expandOnLoad == "true" ? true : false;
			}
		}

		return attrs;
	},

	imgPath: "",
	setImgPath: function (value) {
		this.imgPath = value;
	},
	getImgPath: function () {
		return this.imgPath;
	},

	autoCollapse: true,
	activeIndex: 0,
	createNavBarTree: function (tree) {
		this._destroyTrees();

		var that = this;
		if (!mini.isArray(tree)) tree = [];
		this.data = tree;


		var groups = [];
		for (var i = 0, l = this.data.length; i < l; i++) {
			var o = this.data[i];
			var group = {};
			group.title = o.text;
			group.iconCls = o.iconCls;
			groups.push(group);

			group._children = o[this.nodesField];
		}

		this.setGroups(groups);
		this.setActiveIndex(this.activeIndex);



		this._trees = [];


		for (var i = 0, l = this.groups.length; i < l; i++) {
			var group = this.groups[i];
			var groupBodyEl = this.getGroupBodyEl(group);

			var tree = new mini.Tree();
			tree.set({

				showTreeLines: this.showTreeLines,

				expandOnNodeClick: this.expandOnNodeClick,

				showTreeIcon: this.showTreeIcon,

				showArrow: this.showArrow,
				imgPath: this.imgPath,
				idField: this.idField,
				parentField: this.parentField,
				textField: this.textField,
				expandOnLoad: this.expandNodeOnLoad,
				style: "width:100%;height:auto;border:0;background:none",
				data: group._children,
				onbeforeload: function (e) {
					e.url = that.url;
				}
			});

			tree.render(groupBodyEl);
			tree.on("nodeclick", this.__OnNodeClick, this);
			tree.on("nodeselect", this.__OnNodeSelect, this);
			tree.on("nodemousedown", this.__OnNodeMouseDown, this);
			tree.on("drawnode", this.__OnDrawNode, this);

			tree.on("beforeexpand", this._handlerTree, this);
			tree.on("beforecollapse", this._handlerTree, this);
			tree.on("expand", this._handlerTree, this);
			tree.on("collapse", this._handlerTree, this);

			tree.on("beforeselect", this._handlerTree, this);


			this._trees.push(tree);
			delete group._children

			tree._ownerGroup = group;













		}
	},
	__OnNodeMouseDown: function (e) {
		var eve = {
			node: e.node,
			isLeaf: e.sender.isLeaf(e.node),
			htmlEvent: e.htmlEvent
		};
		this.fire("nodemousedown", eve);
	},
	__OnNodeClick: function (e) {
		var eve = {
			node: e.node,
			isLeaf: e.sender.isLeaf(e.node),
			htmlEvent: e.htmlEvent
		};
		this.fire("nodeclick", eve);
	},
	__OnNodeSelect: function (e) {
		if (!e.node) return;
		for (var i = 0, l = this._trees.length; i < l; i++) {
			var tree = this._trees[i];
			if (tree != e.sender) {
				tree.selectNode(null);
			}
		}

		var eve = {
			node: e.node,
			isLeaf: e.sender.isLeaf(e.node),
			htmlEvent: e.htmlEvent
		};
		this._selected = e.node;
		this.fire("nodeselect", eve);
	},
	__OnDrawNode: function (e) {
		this.fire("drawnode", e);
	}
});
mini.regClass(mini.OutlookTree, "outlooktree");

mini.NavBarTree = function () {
	mini.NavBarTree.superclass.constructor.apply(this, arguments);
}
mini.extend(mini.NavBarTree, mini.OutlookTree, {
	uiCls: "mini-navbartree"
});
mini.regClass(mini.NavBarTree, "navbartree");
