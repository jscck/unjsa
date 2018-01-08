mini.OutlookBar = function () {
	this._initGroups();
	mini.OutlookBar.superclass.constructor.apply(this, arguments);
}
mini.extend(mini.OutlookBar, mini.Control, {
	width: 180,

	expandOnLoad: false,

	activeIndex: -1,
	autoCollapse: false,

	groupCls: "",
	groupStyle: "",
	groupHeaderCls: "",
	groupHeaderStyle: "",
	groupBodyCls: "",
	groupBodyStyle: "",

	groupHoverCls: "",
	groupActiveCls: "",

	allowAnim: true,

	imgPath: '',

	set: function (kv) {
		if (typeof kv == 'string') {
			return this;
		}

		var _allowLayout = this._allowLayout;
		this._allowLayout = false;

		var activeIndex = kv.activeIndex;
		delete kv.activeIndex;

		if (kv.imgPath) this.setImgPath(kv.imgPath);
		delete kv.imgPath;

		mini.OutlookBar.superclass.set.call(this, kv);

		if (mini.isNumber(activeIndex)) {
			this.setActiveIndex(activeIndex);
		}

		this._allowLayout = _allowLayout;
		this.doLayout();

		return this;
	},

	uiCls: "mini-outlookbar",
	_create: function () {
		this.el = document.createElement("div");
		this.el.className = "mini-outlookbar";
		this.el.innerHTML = '<div class="mini-outlookbar-border"></div>';
		this._borderEl = this.el.firstChild;

	},
	_initEvents: function () {

		mini._BindEvents(function () {
			mini.on(this.el, "click", this.__OnClick, this);
		}, this);

		var hoverCls = "mini-outlookbar-hover"
		jQuery(this.el).on("mouseenter", ".mini-outlookbar-groupHeader", function (e) {
			jQuery(e.currentTarget).addClass(hoverCls);
		});
		jQuery(this.el).on("mouseleave", ".mini-outlookbar-groupHeader", function (e) {
			jQuery(e.currentTarget).removeClass(hoverCls);
		});
	},
	destroy: function (removeEl) {

		if (!this.destroyed && this.el) {
			jQuery(this.el).off("mouseenter");
			jQuery(this.el).off("mouseleave");

			if (this.groups) {
				for (var i = 0, l = this.groups.length; i < l; i++) {
					var group = this.groups[i];
					delete group._el;
				}
				this.groups = null;
			}
		}
		mini.OutlookBar.superclass.destroy.call(this, removeEl);
	},

	_createGroupId: function (group) {
		return this.uid + "$" + group._id;
	},
	_GroupId: 1,
	_initGroups: function () {
		this.groups = [];
	},
	_createGroupEl: function (group) {

		var id = this._createGroupId(group);
		var s = '<div id="' + id + '" class="mini-outlookbar-group ' + group.cls + '" style="' + group.style + '">'
					+ '<div class="mini-outlookbar-groupHeader ' + group.headerCls + '" style="' + group.headerStyle + ';"></div>'
					+ '<div class="mini-outlookbar-groupBody ' + group.bodyCls + '" style="' + group.bodyStyle + ';"></div>'
				+ '</div>';
		var el = mini.append(this._borderEl, s);

		var bodyEl = el.lastChild;
		var cs = group.body;
		delete group.body;
		if (cs) {
			if (!mini.isArray(cs)) cs = [cs];
			for (var i = 0, l = cs.length; i < l; i++) {
				var node = cs[i];
				mini.append(bodyEl, node);

			}
			cs.length = 0;
		}


		if (group.bodyParent) {
			var p = group.bodyParent;
			while (p.firstChild) {
				bodyEl.appendChild(p.firstChild);
			}
		}
		delete group.bodyParent;

		return el;
	},
	createGroup: function (options) {
		var group = mini.copyTo({
			_id: this._GroupId++,
			name: "",
			title: "",

			cls: "",
			style: "",
			iconCls: "",
			iconStyle: "",
			headerCls: "",
			headerStyle: "",
			bodyCls: "",
			bodyStyle: "",

			visible: true,
			enabled: true,
			showCollapseButton: true,
			expanded: this.expandOnLoad

		}, options);


		return group;
	},
	setImgPath: function (value) {
		this.imgPath = value;
	},
	getImgPath: function () {
		return this.imgPath;
	},
	setGroups: function (groups) {
		if (!mini.isArray(groups)) return;
		this.removeAll();

		for (var i = 0, l = groups.length; i < l; i++) {
			this.addGroup(groups[i]);
		}
	},
	getGroups: function () {
		return this.groups;
	},
	addGroup: function (group, index) {
		if (typeof group == "string") {
			group = { title: group };
		}
		group = this.createGroup(group);

		if (typeof index != "number") index = this.groups.length;
		this.groups.insert(index, group);

		var el = this._createGroupEl(group);
		group._el = el;
		var index = this.groups.indexOf(group);
		var targetGroup = this.groups[index + 1];
		if (targetGroup) {
			var tEl = this.getGroupEl(targetGroup);
			jQuery(tEl).before(el);
		}
		this.doUpdate();
		return group;
	},
	updateGroup: function (group, options) {
		var group = this.getGroup(group);
		if (!group) return;
		mini.copyTo(group, options);
		this.doUpdate();
	},
	removeGroup: function (group) {
		group = this.getGroup(group);
		if (!group) return;
		var groupEl = this.getGroupEl(group);
		if (groupEl) groupEl.parentNode.removeChild(groupEl);


		this.groups.remove(group);
		this.doUpdate();
	},
	removeAll: function () {
		for (var i = this.groups.length - 1; i >= 0; i--) {
			this.removeGroup(i);
		}
	},
	moveGroup: function (group, index) {
		group = this.getGroup(group);
		if (!group) return;
		target = this.getGroup(index);

		var groupEl = this.getGroupEl(group);
		this.groups.remove(group);

		if (target) {
			index = this.groups.indexOf(target);
			this.groups.insert(index, group);
			var tEl = this.getGroupEl(target);
			jQuery(tEl).before(groupEl);
		} else {
			this.groups.add(group);
			this._borderEl.appendChild(groupEl);
		}

		this.doUpdate();
	},

	_getIconImg: function (img) {


		return img && this.imgPath + img;
	},

	doUpdate: function () {
		for (var i = 0, l = this.groups.length; i < l; i++) {
			var group = this.groups[i];
			var groupEl = group._el;
			var headerEl = groupEl.firstChild;
			var groupBodyEl = groupEl.lastChild;

			var img = this._getIconImg(group.img);

			var style = 'background-image:url(' + img + ')';

			var icons = '<div class="mini-outlookbar-icon mini-iconfont ' + group.iconCls + '" style="' + group.iconStyle + ';"></div>';



			var s = '<div class="mini-tools"><span class="mini-tools-collapse" style="' + (group.showCollapseButton ? "" : "display:none;") + '"></span></div>'
					+ ((group.iconStyle || group.iconCls || group.img) ? icons : '')

					+ '<div class="mini-outlookbar-groupTitle">' + group.title + '</div>';

			headerEl.innerHTML = s;

			if (img) {
				var iconEl = headerEl.childNodes[1];
				mini.setStyle(iconEl, style);
			}


			if (group.enabled) {
				mini.removeClass(groupEl, "mini-disabled");
			} else {
				mini.addClass(groupEl, "mini-disabled");
			}

			mini.addClass(groupEl, group.cls);
			mini.setStyle(groupEl, group.style);

			mini.addClass(groupBodyEl, group.bodyCls);
			mini.setStyle(groupBodyEl, group.bodyStyle);

			mini.addClass(headerEl, group.headerCls);
			mini.setStyle(headerEl, group.headerStyle);

			mini.removeClass(groupEl, "mini-outlookbar-firstGroup");
			mini.removeClass(groupEl, "mini-outlookbar-lastGroup");
			if (i == 0) {
				mini.addClass(groupEl, "mini-outlookbar-firstGroup");
			}
			if (i == l - 1) {
				mini.addClass(groupEl, "mini-outlookbar-lastGroup");
			}
		}
		this.doLayout();
	},
	doLayout: function () {
		if (!this.canLayout()) return;
		if (this._inAniming) return;

		this._doLayoutInner();

		for (var i = 0, l = this.groups.length; i < l; i++) {
			var group = this.groups[i];
			var groupEl = group._el;
			var groupBodyEl = groupEl.lastChild;

			if (group.expanded) {
				mini.addClass(groupEl, "mini-outlookbar-expand");
				mini.removeClass(groupEl, "mini-outlookbar-collapse");
			} else {
				mini.removeClass(groupEl, "mini-outlookbar-expand");
				mini.addClass(groupEl, "mini-outlookbar-collapse");
			}
			groupBodyEl.style.height = "auto";
			groupBodyEl.style.display = group.expanded ? "block" : "none";

			groupEl.style.display = group.visible ? "" : "none";

			var w = mini.getWidth(groupEl, true);
			var padding = mini.getPaddings(groupBodyEl);
			var border = mini.getBorders(groupBodyEl);
			if (jQuery.boxModel) {
				w = w - padding.left - padding.right - border.left - border.right;
			}
			groupBodyEl.style.width = w + "px";
		}

		var autoHeight = this.isAutoHeight();

		var acGroup = this.getActiveGroup();
		if (!autoHeight && this.autoCollapse && !this.expandOnLoad && acGroup) {
			var groupEl = this.getGroupEl(this.activeIndex);
			groupEl.lastChild.style.height = this._getFillGroupBodyHeight() + "px";
		} else {

		}



		mini.layout(this._borderEl);
	},
	_doLayoutInner: function () {
		if (this.isAutoHeight()) {
			this._borderEl.style.height = "auto";
		} else {
			var h = this.getHeight(true);
			if (!jQuery.boxModel) {
				var b2 = mini.getBorders(this._borderEl);
				h = h + b2.top + b2.bottom;
			}
			if (h < 0) h = 0;
			this._borderEl.style.height = h + "px";
		}
	},

	_getFillGroupBodyHeight: function () {

		var h = jQuery(this.el).height();
		var b2 = mini.getBorders(this._borderEl);
		h = h - b2.top - b2.bottom;

		var acGroup = this.getActiveGroup();
		var h2 = 0;
		for (var i = 0, l = this.groups.length; i < l; i++) {
			var group = this.groups[i];
			var div = this.getGroupEl(group);
			if (group.visible == false || group == acGroup) continue;
			var display = div.lastChild.style.display;
			div.lastChild.style.display = "none";
			var dh = jQuery(div).outerHeight();
			div.lastChild.style.display = display;


			var margin = mini.getMargins(div);

			dh = dh + margin.top + margin.bottom;

			h2 += dh;
		}

		h = h - h2;

		var groupEl = this.getGroupEl(this.activeIndex);
		if (!groupEl) return 0;
		h = h - jQuery(groupEl.firstChild).outerHeight();
		if (jQuery.boxModel) {

			var padding = mini.getPaddings(groupEl.lastChild);
			var border = mini.getBorders(groupEl.lastChild);

			h = h - padding.top - padding.bottom - border.top - border.bottom;
		}

		var padding = mini.getPaddings(groupEl);
		var border = mini.getBorders(groupEl);
		var margin = mini.getMargins(groupEl);

		h = h - margin.top - margin.bottom;
		h = h - padding.top - padding.bottom - border.top - border.bottom;

		if (h < 0) h = 0;
		return h;
	},

	getGroup: function (index) {
		if (typeof index == "object") return index;
		if (typeof index == "number") {
			return this.groups[index];
		} else {
			for (var i = 0, l = this.groups.length; i < l; i++) {
				var group = this.groups[i];
				if (group.name == index) return group;
			}
		}
	},
	_getGroupById: function (id) {
		for (var i = 0, l = this.groups.length; i < l; i++) {
			var group = this.groups[i];
			if (group._id == id) return group;
		}
	},
	getGroupEl: function (index) {
		var group = this.getGroup(index);
		if (!group) return null;
		return group._el;
	},
	getGroupBodyEl: function (index) {
		var groupEl = this.getGroupEl(index);
		if (groupEl) return groupEl.lastChild;
		return null;
	},

	setAutoCollapse: function (value) {
		this.autoCollapse = value;
	},
	getAutoCollapse: function () {
		return this.autoCollapse;
	},
	setExpandOnLoad: function (value) {
		this.expandOnLoad = value;
	},
	getExpandOnLoad: function () {
		return this.expandOnLoad;
	},

	setActiveIndex: function (value) {

		var preActive = this.activeIndex;

		var group = this.getGroup(value);
		var acGroup = this.getGroup(this.activeIndex);
		var fire = group != acGroup;

		if (group) {
			this.activeIndex = this.groups.indexOf(group);
		} else {
			this.activeIndex = -1;
		}




		var group = this.getGroup(this.activeIndex);
		if (group) {
			var anim = this.allowAnim;
			this.allowAnim = false;
			this.expandGroup(group);
			this.allowAnim = anim;
		}


		if (this.activeIndex == -1 && preActive != -1) {
			this.collapseGroup(preActive);
		}




	},
	getActiveIndex: function () {
		return this.activeIndex;
	},
	getActiveGroup: function () {
		return this.getGroup(this.activeIndex);
	},
	showGroup: function (group) {
		group = this.getGroup(group);
		if (!group || group.visible == true) return;
		group.visible = true;
		this.doUpdate();
	},
	hideGroup: function (group) {
		group = this.getGroup(group);
		if (!group || group.visible == false) return;
		group.visible = false;
		this.doUpdate();
	},
	toggleGroup: function (group) {
		group = this.getGroup(group);
		if (!group) return;
		if (group.expanded) {
			this.collapseGroup(group);
		} else {
			this.expandGroup(group);
		}
	},
	collapseGroup: function (group) {
		group = this.getGroup(group);
		if (!group) return;
		var expanded = group.expanded;

		var fillHeight = 0;
		if (this.autoCollapse && !this.expandOnLoad && !this.isAutoHeight()) {
			fillHeight = this._getFillGroupBodyHeight();
		}

		var fire = false;
		group.expanded = false;
		var index = this.groups.indexOf(group);
		if (index == this.activeIndex) {
			this.activeIndex = -1;
			fire = true;
		}

		var el = this.getGroupBodyEl(group);
		if (this.allowAnim && expanded) {
			this._inAniming = true;

			el.style.display = "block";
			el.style.height = "auto";
			if (this.autoCollapse && !this.expandOnLoad && !this.isAutoHeight()) {
				el.style.height = fillHeight + "px";
			}
			var config = { height: "1px" };

			mini.addClass(el, "mini-outlookbar-overflow");

			mini.removeClass(this.getGroupEl(group), "mini-outlookbar-expand");

			var sf = this;
			var jq = jQuery(el);
			jq.animate(
			config,
			180,
			function () {
				sf._inAniming = false;
				mini.removeClass(el, "mini-outlookbar-overflow");
				sf.doLayout();
			}
			);
		} else {
			this.doLayout();
		}

		var e = {
			group: group,
			index: this.groups.indexOf(group),
			name: group.name
		};
		this.fire("Collapse", e);

		if (fire) {

			this.fire("activechanged");
		}
	},
	expandGroup: function (group) {
		group = this.getGroup(group);
		if (!group) return;

		var expanded = group.expanded;



		group.expanded = true;
		this.activeIndex = this.groups.indexOf(group);

		fire = true;

		if (this.autoCollapse && !this.expandOnLoad) {
			for (var i = 0, l = this.groups.length; i < l; i++) {
				var g = this.groups[i];
				if (g.expanded && g != group) {
					this.collapseGroup(g);
				}
			}
		}

		var el = this.getGroupBodyEl(group);
		if (this.allowAnim && expanded == false) {
			this._inAniming = true;

			el.style.display = "block";

			if (this.autoCollapse && !this.expandOnLoad && !this.isAutoHeight()) {
				var fillHeight = this._getFillGroupBodyHeight();
				el.style.height = (fillHeight) + "px";
			} else {
				el.style.height = "auto";
			}

			var h = mini.getHeight(el);

			el.style.height = "1px";
			var config = { height: h + "px" };

			var overflow = el.style.overflow;
			el.style.overflow = "hidden";
			mini.addClass(el, "mini-outlookbar-overflow");


			mini.addClass(this.getGroupEl(group), "mini-outlookbar-expand");

			var sf = this;
			var jq = jQuery(el);
			jq.animate(
				config,
				180,
				function () {
					el.style.overflow = overflow;
					mini.removeClass(el, "mini-outlookbar-overflow");
					sf._inAniming = false;
					sf.doLayout();
				}
			);
		} else {
			this.doLayout();
		}

		var e = {
			group: group,
			index: this.groups.indexOf(group),
			name: group.name
		};
		this.fire("Expand", e);

		if (fire) {

			this.fire("activechanged");
		}
	},
	_tryToggleGroup: function (group) {
		group = this.getGroup(group);
		if (group.enabled == false) return;
		var e = {
			group: group,
			groupIndex: this.groups.indexOf(group),
			groupName: group.name,
			cancel: false
		};
		if (group.expanded) {
			this.fire("BeforeCollapse", e);
			if (e.cancel == false) {
				this.collapseGroup(group);
			}
		} else {
			this.fire("BeforeExpand", e);
			if (e.cancel == false) {
				this.expandGroup(group);
			}
		}
	},

	_getGroupByEvent: function (e) {
		var el = mini.findParent(e.target, 'mini-outlookbar-group');
		if (!el) return null;
		var ids = el.id.split("$");
		var id = ids[ids.length - 1];
		return this._getGroupById(id);
	},
	__OnClick: function (e) {
		if (this._inAniming) return;
		var hd = mini.findParent(e.target, 'mini-outlookbar-groupHeader');
		if (!hd) return;

		var group = this._getGroupByEvent(e);
		if (!group) return;

		this._tryToggleGroup(group);
	},








	parseGroups: function (nodes) {
		var groups = [];
		for (var i = 0, l = nodes.length; i < l; i++) {
			var node = nodes[i];

			var group = {};
			groups.push(group);

			group.style = node.style.cssText;
			mini._ParseString(node, group,
				["name", "title", "cls", "iconCls", "iconStyle", "headerCls", "headerStyle", "bodyCls", "bodyStyle"
				 ]
			);
			mini._ParseBool(node, group,
				["visible", "enabled", "showCollapseButton", "expanded"
				 ]
			);



			group.bodyParent = node;

		}
		return groups;
	},
	getAttrs: function (el) {
		var attrs = mini.OutlookBar.superclass.getAttrs.call(this, el);

		mini._ParseString(el, attrs,
			["onactivechanged", "oncollapse", "onexpand", "imgPath"
				]
		);


		mini._ParseBool(el, attrs,
			["autoCollapse", "allowAnim", "expandOnLoad"
				]
		);
		mini._ParseInt(el, attrs,
			["activeIndex"
				]
		);

		var nodes = mini.getChildNodes(el);
		attrs.groups = this.parseGroups(nodes);

		return attrs;
	}
});
mini.regClass(mini.OutlookBar, "outlookbar");

mini.NavBar = function () {
	mini.NavBar.superclass.constructor.apply(this, arguments);
}
mini.extend(mini.NavBar, mini.OutlookBar, {
	uiCls: "mini-navbar"
});
mini.regClass(mini.NavBar, "navbar");
