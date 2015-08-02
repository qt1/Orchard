/*globals jQuery, define, exports, require, window, document */
(function (factory) {
	"use strict";
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	}
	else if(typeof exports === 'object') {
		factory(require('jquery'));
	}
	else {
		factory(jQuery);
	}
}(function ($, undefined) {
	"use strict";
/*!
 * jsTree 3.0.0
 * http://jstree.com/
 *
 * Copyright (c) 2013 Ivan Bozhanov (http://vakata.com)
 *
 * Licensed same as jquery - under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
/*!
 * if using jslint please allow for the jQuery global and use following options: 
 * jslint: browser: true, ass: true, bitwise: true, continue: true, nomen: true, plusplus: true, regexp: true, unparam: true, todo: true, white: true
 */

	// prevent another load? maybe there is a better way?
	if($.jstree) {
		return;
	}

	/**
	 * ### jsTree core functionality
	 */

	// internal variables
	var instance_counter = 0,
		ccp_node = false,
		ccp_mode = false,
		ccp_inst = false,
		themes_loaded = [],
		src = $('script:last').attr('src'),
		_d = document, _node = _d.createElement('LI'), _temp1, _temp2;

	_node.setAttribute('role', 'treeitem');
	_temp1 = _d.createElement('I');
	_temp1.className = 'jstree-icon jstree-ocl';
	_node.appendChild(_temp1);
	_temp1 = _d.createElement('A');
	_temp1.className = 'jstree-anchor';
	_temp1.setAttribute('href','#');
	_temp2 = _d.createElement('I');
	_temp2.className = 'jstree-icon jstree-themeicon';
	_temp1.appendChild(_temp2);
	_node.appendChild(_temp1);
	_temp1 = _temp2 = null;


	/**
	 * holds all jstree related functions and variables, including the actual class and methods to create, access and manipulate instances.
	 * @name $.jstree
	 */
	$.jstree = {
		/** 
		 * specifies the jstree version in use
		 * @name $.jstree.version
		 */
		version : '3.0.0-beta9',
		/**
		 * holds all the default options used when creating new instances
		 * @name $.jstree.defaults
		 */
		defaults : {
			/**
			 * configure which plugins will be active on an instance. Should be an array of strings, where each element is a plugin name. The default is `[]`
			 * @name $.jstree.defaults.plugins
			 */
			plugins : []
		},
		/**
		 * stores all loaded jstree plugins (used internally)
		 * @name $.jstree.plugins
		 */
		plugins : {},
		path : src && src.indexOf('/') !== -1 ? src.replace(/\/[^\/]+$/,'') : ''
	};
	/**
	 * creates a jstree instance
	 * @name $.jstree.create(el [, options])
	 * @param {DOMElement|jQuery|String} el the element to create the instance on, can be jQuery extended or a selector
	 * @param {Object} options options for this instance (extends `$.jstree.defaults`)
	 * @return {jsTree} the new instance
	 */
	$.jstree.create = function (el, options) {
		var tmp = new $.jstree.core(++instance_counter),
			opt = options;
		options = $.extend(true, {}, $.jstree.defaults, options);
		if(opt && opt.plugins) {
			options.plugins = opt.plugins;
		}
		$.each(options.plugins, function (i, k) {
			if(i !== 'core') {
				tmp = tmp.plugin(k, options[k]);
			}
		});
		tmp.init(el, options);
		return tmp;
	};
	/**
	 * the jstree class constructor, used only internally
	 * @private
	 * @name $.jstree.core(id)
	 * @param {Number} id this instance's index
	 */
	$.jstree.core = function (id) {
		this._id = id;
		this._cnt = 0;
		this._data = {
			core : {
				themes : {
					name : false,
					dots : false,
					icons : false
				},
				selected : [],
				last_error : {}
			}
		};
	};
	/**
	 * get a reference to an existing instance
	 *
	 * __Examples__
	 *
	 *	// provided a container with an ID of "tree", and a nested node with an ID of "branch"
	 *	// all of there will return the same instance
	 *	$.jstree.reference('tree');
	 *	$.jstree.reference('#tree');
	 *	$.jstree.reference($('#tree'));
	 *	$.jstree.reference(document.getElementByID('tree'));
	 *	$.jstree.reference('branch');
	 *	$.jstree.reference('#branch');
	 *	$.jstree.reference($('#branch'));
	 *	$.jstree.reference(document.getElementByID('branch'));
	 *
	 * @name $.jstree.reference(needle)
	 * @param {DOMElement|jQuery|String} needle
	 * @return {jsTree|null} the instance or `null` if not found
	 */
	$.jstree.reference = function (needle) {
		if(needle && !$(needle).length) {
			if(needle.id) {
				needle = needle.id;
			}
			var tmp = null;
			$('.jstree').each(function () {
				var inst = $(this).data('jstree');
				if(inst && inst._model.data[needle]) {
					tmp = inst;
					return false;
				}
			});
			return tmp;
		}
		return $(needle).closest('.jstree').data('jstree');
	};
	/**
	 * Create an instance, get an instance or invoke a command on a instance. 
	 * 
	 * If there is no instance associated with the current node a new one is created and `arg` is used to extend `$.jstree.defaults` for this new instance. There would be no return value (chaining is not broken).
	 * 
	 * If there is an existing instance and `arg` is a string the command specified by `arg` is executed on the instance, with any additional arguments passed to the function. If the function returns a value it will be returned (chaining could break depending on function).
	 * 
	 * If there is an existing instance and `arg` is not a string the instance itself is returned (similar to `$.jstree.reference`).
	 * 
	 * In any other case - nothing is returned and chaining is not broken.
	 *
	 * __Examples__
	 *
	 *	$('#tree1').jstree(); // creates an instance
	 *	$('#tree2').jstree({ plugins : [] }); // create an instance with some options
	 *	$('#tree1').jstree('open_node', '#branch_1'); // call a method on an existing instance, passing additional arguments
	 *	$('#tree2').jstree(); // get an existing instance (or create an instance)
	 *	$('#tree2').jstree(true); // get an existing instance (will not create new instance)
	 *	$('#branch_1').jstree().select_node('#branch_1'); // get an instance (using a nested element and call a method)
	 *
	 * @name $().jstree([arg])
	 * @param {String|Object} arg
	 * @return {Mixed}
	 */
	$.fn.jstree = function (arg) {
		// check for string argument
		var is_method	= (typeof arg === 'string'),
			args		= Array.prototype.slice.call(arguments, 1),
			result		= null;
		this.each(function () {
			// get the instance (if there is one) and method (if it exists)
			var instance = $.jstree.reference(this),
				method = is_method && instance ? instance[arg] : null;
			// if calling a method, and method is available - execute on the instance
			result = is_method && method ?
				method.apply(instance, args) :
				null;
			// if there is no instance and no method is being called - create one
			if(!instance && !is_method && (arg === undefined || $.isPlainObject(arg))) {
				$(this).data('jstree', new $.jstree.create(this, arg));
			}
			// if there is an instance and no method is called - return the instance
			if(instance && !is_method) {
				result = instance;
			}
			// if there was a method call which returned a result - break and return the value
			if(result !== null && result !== undefined) {
				return false;
			}
		});
		// if there was a method call with a valid return value - return that, otherwise continue the chain
		return result !== null && result !== undefined ?
			result : this;
	};
	/**
	 * used to find elements containing an instance
	 *
	 * __Examples__
	 *
	 *	$('div:jstree').each(function () {
	 *		$(this).jstree('destroy');
	 *	});
	 *
	 * @name $(':jstree')
	 * @return {jQuery}
	 */
	$.expr[':'].jstree = $.expr.createPseudo(function(search) {
		return function(a) {
			return $(a).hasClass('jstree') &&
				$(a).data('jstree') !== undefined;
		};
	});

	/**
	 * stores all defaults for the core
	 * @name $.jstree.defaults.core
	 */
	$.jstree.defaults.core = {
		/**
		 * data configuration
		 * 
		 * If left as `false` the HTML inside the jstree container element is used to populate the tree (that should be an unordered list with list items).
		 *
		 * You can also pass in a HTML string or a JSON array here.
		 * 
		 * It is possible to pass in a standard jQuery-like AJAX config and jstree will automatically determine if the response is JSON or HTML and use that to populate the tree. 
		 * In addition to the standard jQuery ajax options here you can suppy functions for `data` and `url`, the functions will be run in the current instance's scope and a param will be passed indicating which node is being loaded, the return value of those functions will be used.
		 * 
		 * The last option is to specify a function, that function will receive the node being loaded as argument and a second param which is a function which should be called with the result.
		 *
		 * __Examples__
		 *
		 *	// AJAX
		 *	$('#tree').jstree({
		 *		'core' : {
		 *			'data' : {
		 *				'url' : '/get/children/',
		 *				'data' : function (node) {
		 *					return { 'id' : node.id };
		 *				}
		 *			}
		 *		});
		 *
		 *	// direct data
		 *	$('#tree').jstree({
		 *		'core' : {
		 *			'data' : [
		 *				'Simple root node',
		 *				{
		 *					'id' : 'node_2',
		 *					'text' : 'Root node with options',
		 *					'state' : { 'opened' : true, 'selected' : true },
		 *					'children' : [ { 'text' : 'Child 1' }, 'Child 2']
		 *				}
		 *			]
		 *		});
		 *	
		 *	// function
		 *	$('#tree').jstree({
		 *		'core' : {
		 *			'data' : function (obj, callback) {
		 *				callback.call(this, ['Root 1', 'Root 2']);
		 *			}
		 *		});
		 * 
		 * @name $.jstree.defaults.core.data
		 */
		data			: false,
		/**
		 * configure the various strings used throughout the tree
		 *
		 * You can use an object where the key is the string you need to replace and the value is your replacement.
		 * Another option is to specify a function which will be called with an argument of the needed string and should return the replacement.
		 * If left as `false` no replacement is made.
		 *
		 * __Examples__
		 *
		 *	$('#tree').jstree({
		 *		'core' : {
		 *			'strings' : {
		 *				'Loading...' : 'Please wait ...'
		 *			}
		 *		}
		 *	});
		 *
		 * @name $.jstree.defaults.core.strings
		 */
		strings			: false,
		/**
		 * determines what happens when a user tries to modify the structure of the tree
		 * If left as `false` all operations like create, rename, delete, move or copy are prevented.
		 * You can set this to `true` to allow all interactions or use a function to have better control.
		 *
		 * __Examples__
		 *
		 *	$('#tree').jstree({
		 *		'core' : {
		 *			'check_callback' : function (operation, node, node_parent, node_position) {
		 *				// operation can be 'create_node', 'rename_node', 'delete_node', 'move_node' or 'copy_node'
		 *				// in case of 'rename_node' node_position is filled with the new node name
		 *				return operation === 'rename_node' ? true : false;
		 *			}
		 *		}
		 *	});
		 * 
		 * @name $.jstree.defaults.core.check_callback
		 */
		check_callback	: false,
		/**
		 * a callback called with a single object parameter in the instance's scope when something goes wrong (operation prevented, ajax failed, etc)
		 * @name $.jstree.defaults.core.error
		 */
		error			: $.noop,
		/**
		 * the open / close animation duration in milliseconds - set this to `false` to disable the animation (default is `200`)
		 * @name $.jstree.defaults.core.animation
		 */
		animation		: 200,
		/**
		 * a boolean indicating if multiple nodes can be selected
		 * @name $.jstree.defaults.core.multiple
		 */
		multiple		: true,
		/**
		 * theme configuration object
		 * @name $.jstree.defaults.core.themes
		 */
		themes			: {
			/**
			 * the name of the theme to use (if left as `false` the default theme is used)
			 * @name $.jstree.defaults.core.themes.name
			 */
			name			: false,
			/**
			 * the URL of the theme's CSS file, leave this as `false` if you have manually included the theme CSS (recommended). You can set this to `true` too which will try to autoload the theme.
			 * @name $.jstree.defaults.core.themes.url
			 */
			url				: false,
			/**
			 * the location of all jstree themes - only used if `url` is set to `true`
			 * @name $.jstree.defaults.core.themes.dir
			 */
			dir				: false,
			/**
			 * a boolean indicating if connecting dots are shown
			 * @name $.jstree.defaults.core.themes.dots
			 */
			dots			: true,
			/**
			 * a boolean indicating if node icons are shown
			 * @name $.jstree.defaults.core.themes.icons
			 */
			icons			: true,
			/**
			 * a boolean indicating if the tree background is striped
			 * @name $.jstree.defaults.core.themes.stripes
			 */
			stripes			: false,
			/**
			 * a string (or boolean `false`) specifying the theme variant to use (if the theme supports variants)
			 * @name $.jstree.defaults.core.themes.variant
			 */
			variant			: false,
			/**
			 * a boolean specifying if a reponsive version of the theme should kick in on smaller screens (if the theme supports it). Defaults to `true`.
			 * @name $.jstree.defaults.core.themes.responsive
			 */
			responsive		: true
		},
		/**
		 * if left as `true` all parents of all selected nodes will be opened once the tree loads (so that all selected nodes are visible to the user)
		 * @name $.jstree.defaults.core.expand_selected_onload
		 */
		expand_selected_onload : true
	};
	$.jstree.core.prototype = {
		/**
		 * used to decorate an instance with a plugin. Used internally.
		 * @private
		 * @name plugin(deco [, opts])
		 * @param  {String} deco the plugin to decorate with
		 * @param  {Object} opts options for the plugin
		 * @return {jsTree}
		 */
		plugin : function (deco, opts) {
			var Child = $.jstree.plugins[deco];
			if(Child) {
				this._data[deco] = {};
				Child.prototype = this;
				return new Child(opts, this);
			}
			return this;
		},
		/**
		 * used to decorate an instance with a plugin. Used internally.
		 * @private
		 * @name init(el, optons)
		 * @param {DOMElement|jQuery|String} el the element we are transforming
		 * @param {Object} options options for this instance
		 * @trigger init.jstree, loading.jstree, loaded.jstree, ready.jstree, changed.jstree
		 */
		init : function (el, options) {
			this._model = {
				data : {
					'#' : {
						id : '#',
						parent : null,
						parents : [],
						children : [],
						children_d : [],
						state : { loaded : false }
					}
				},
				changed : [],
				force_full_redraw : false,
				redraw_timeout : false,
				default_state : {
					loaded : true,
					opened : false,
					selected : false,
					disabled : false
				}
			};

			this.element = $(el).addClass('jstree jstree-' + this._id);
			this.settings = options;
			this.element.bind("destroyed", $.proxy(this.teardown, this));

			this._data.core.ready = false;
			this._data.core.loaded = false;
			this._data.core.rtl = (this.element.css("direction") === "rtl");
			this.element[this._data.core.rtl ? 'addClass' : 'removeClass']("jstree-rtl");
			this.element.attr('role','tree');

			this.bind();
			/**
			 * triggered after all events are bound
			 * @event
			 * @name init.jstree
			 */
			this.trigger("init");

			this._data.core.original_container_html = this.element.find(" > ul > li").clone(true);
			this._data.core.original_container_html
				.find("li").addBack()
				.contents().filter(function() {
					return this.nodeType === 3 && (!this.nodeValue || /^\s+$/.test(this.nodeValue));
				})
				.remove();
			this.element.html("<"+"ul class='jstree-container-ul'><"+"li class='jstree-initial-node jstree-loading jstree-leaf jstree-last'><i class='jstree-icon jstree-ocl'></i><"+"a class='jstree-anchor' href='#'><i class='jstree-icon jstree-themeicon-hidden'></i>" + this.get_string("Loading ...") + "</a></li></ul>");
			this._data.core.li_height = this.get_container_ul().children("li:eq(0)").height() || 18;
			/**
			 * triggered after the loading text is shown and before loading starts
			 * @event
			 * @name loading.jstree
			 */
			this.trigger("loading");
			this.load_node('#');
		},
		/**
		 * destroy an instance
		 * @name destroy()
		 */
		destroy : function () {
			this.element.unbind("destroyed", this.teardown);
			this.teardown();
		},
		/**
		 * part of the destroying of an instance. Used internally.
		 * @private
		 * @name teardown()
		 */
		teardown : function () {
			this.unbind();
			this.element
				.removeClass('jstree')
				.removeData('jstree')
				.find("[class^='jstree']")
					.addBack()
					.attr("class", function () { return this.className.replace(/jstree[^ ]*|$/ig,''); });
			this.element = null;
		},
		/**
		 * bind all events. Used internally.
		 * @private
		 * @name bind()
		 */
		bind : function () {
			this.element
				.on("dblclick.jstree", function () {
						if(document.selection && document.selection.empty) {
							document.selection.empty();
						}
						else {
							if(window.getSelection) {
								var sel = window.getSelection();
								try {
									sel.removeAllRanges();
									sel.collapse();
								} catch (ignore) { }
							}
						}
					})
				.on("click.jstree", ".jstree-ocl", $.proxy(function (e) {
						this.toggle_node(e.target);
					}, this))
				.on("click.jstree", ".jstree-anchor", $.proxy(function (e) {
						e.preventDefault();
						$(e.currentTarget).focus();
						this.activate_node(e.currentTarget, e);
					}, this))
				.on('keydown.jstree', '.jstree-anchor', $.proxy(function (e) {
						var o = null;
						switch(e.which) {
							case 13:
							case 32:
								e.type = "click";
								$(e.currentTarget).trigger(e);
								break;
							case 37:
								e.preventDefault();
								if(this.is_open(e.currentTarget)) {
									this.close_node(e.currentTarget);
								}
								else {
									o = this.get_prev_dom(e.currentTarget);
									if(o && o.length) { o.children('.jstree-anchor').focus(); }
								}
								break;
							case 38:
								e.preventDefault();
								o = this.get_prev_dom(e.currentTarget);
								if(o && o.length) { o.children('.jstree-anchor').focus(); }
								break;
							case 39:
								e.preventDefault();
								if(this.is_closed(e.currentTarget)) {
									this.open_node(e.currentTarget, function (o) { this.get_node(o, true).children('.jstree-anchor').focus(); });
								}
								else {
									o = this.get_next_dom(e.currentTarget);
									if(o && o.length) { o.children('.jstree-anchor').focus(); }
								}
								break;
							case 40:
								e.preventDefault();
								o = this.get_next_dom(e.currentTarget);
								if(o && o.length) { o.children('.jstree-anchor').focus(); }
								break;
							// delete
							case 46:
								e.preventDefault();
								o = this.get_node(e.currentTarget);
								if(o && o.id && o.id !== '#') {
									o = this.is_selected(o) ? this.get_selected() : o;
									// this.delete_node(o);
								}
								break;
							// f2
							case 113:
								e.preventDefault();
								o = this.get_node(e.currentTarget);
								/*!
								if(o && o.id && o.id !== '#') {
									// this.edit(o);
								}
								*/
								break;
							default:
								// console.log(e.which);
								break;
						}
					}, this))
				.on("load_node.jstree", $.proxy(function (e, data) {
						if(data.status) {
							if(data.node.id === '#' && !this._data.core.loaded) {
								this._data.core.loaded = true;
								/**
								 * triggered after the root node is loaded for the first time
								 * @event
								 * @name loaded.jstree
								 */
								this.trigger("loaded");
							}
							if(!this._data.core.ready && !this.get_container_ul().find('.jstree-loading:eq(0)').length) {
								this._data.core.ready = true;
								if(this._data.core.selected.length) {
									if(this.settings.core.expand_selected_onload) {
										var tmp = [], i, j;
										for(i = 0, j = this._data.core.selected.length; i < j; i++) {
											tmp = tmp.concat(this._model.data[this._data.core.selected[i]].parents);
										}
										tmp = $.vakata.array_unique(tmp);
										for(i = 0, j = tmp.length; i < j; i++) {
											this.open_node(tmp[i], false, 0);
										}
									}
									this.trigger('changed', { 'action' : 'ready', 'selected' : this._data.core.selected });
								}
								/**
								 * triggered after all nodes are finished loading
								 * @event
								 * @name ready.jstree
								 */
								setTimeout($.proxy(function () { this.trigger("ready"); }, this), 0);
							}
						}
					}, this))
				// THEME RELATED
				.on("init.jstree", $.proxy(function () {
						var s = this.settings.core.themes;
						this._data.core.themes.dots			= s.dots;
						this._data.core.themes.stripes		= s.stripes;
						this._data.core.themes.icons		= s.icons;
						this.set_theme(s.name || "default", s.url);
						this.set_theme_variant(s.variant);
					}, this))
				.on("loading.jstree", $.proxy(function () {
						this[ this._data.core.themes.dots ? "show_dots" : "hide_dots" ]();
						this[ this._data.core.themes.icons ? "show_icons" : "hide_icons" ]();
						this[ this._data.core.themes.stripes ? "show_stripes" : "hide_stripes" ]();
					}, this))
				.on('focus.jstree', '.jstree-anchor', $.proxy(function (e) {
						this.element.find('.jstree-hovered').not(e.currentTarget).mouseleave();
						$(e.currentTarget).mouseenter();
					}, this))
				.on('mouseenter.jstree', '.jstree-anchor', $.proxy(function (e) {
						this.hover_node(e.currentTarget);
					}, this))
				.on('mouseleave.jstree', '.jstree-anchor', $.proxy(function (e) {
						this.dehover_node(e.currentTarget);
					}, this));
		},
		/**
		 * part of the destroying of an instance. Used internally.
		 * @private
		 * @name unbind()
		 */
		unbind : function () {
			this.element.off('.jstree');
			$(document).off('.jstree-' + this._id);
		},
		/**
		 * trigger an event. Used internally.
		 * @private
		 * @name trigger(ev [, data])
		 * @param  {String} ev the name of the event to trigger
		 * @param  {Object} data additional data to pass with the event
		 */
		trigger : function (ev, data) {
			if(!data) {
				data = {};
			}
			data.instance = this;
			this.element.triggerHandler(ev.replace('.jstree','') + '.jstree', data);
		},
		/**
		 * returns the jQuery extended instance container
		 * @name get_container()
		 * @return {jQuery}
		 */
		get_container : function () {
			return this.element;
		},
		/**
		 * returns the jQuery extended main UL node inside the instance container. Used internally.
		 * @private
		 * @name get_container_ul()
		 * @return {jQuery}
		 */
		get_container_ul : function () {
			return this.element.children("ul:eq(0)");
		},
		/**
		 * gets string replacements (localization). Used internally.
		 * @private
		 * @name get_string(key)
		 * @param  {String} key
		 * @return {String}
		 */
		get_string : function (key) {
			var a = this.settings.core.strings;
			if($.isFunction(a)) { return a.call(this, key); }
			if(a && a[key]) { return a[key]; }
			return key;
		},
		/**
		 * gets the first child of a DOM node. Used internally.
		 * @private
		 * @name _firstChild(dom)
		 * @param  {DOMElement} dom
		 * @return {DOMElement}
		 */
		_firstChild : function (dom) {
			dom = dom ? dom.firstChild : null;
			while(dom !== null && dom.nodeType !== 1) {
				dom = dom.nextSibling;
			}
			return dom;
		},
		/**
		 * gets the next sibling of a DOM node. Used internally.
		 * @private
		 * @name _nextSibling(dom)
		 * @param  {DOMElement} dom
		 * @return {DOMElement}
		 */
		_nextSibling : function (dom) {
			dom = dom ? dom.nextSibling : null;
			while(dom !== null && dom.nodeType !== 1) {
				dom = dom.nextSibling;
			}
			return dom;
		},
		/**
		 * gets the previous sibling of a DOM node. Used internally.
		 * @private
		 * @name _previousSibling(dom)
		 * @param  {DOMElement} dom
		 * @return {DOMElement}
		 */
		_previousSibling : function (dom) {
			dom = dom ? dom.previousSibling : null;
			while(dom !== null && dom.nodeType !== 1) {
				dom = dom.previousSibling;
			}
			return dom;
		},
		/**
		 * get the JSON representation of a node (or the actual jQuery extended DOM node) by using any input (child DOM element, ID string, selector, etc)
		 * @name get_node(obj [, as_dom])
		 * @param  {mixed} obj
		 * @param  {Boolean} as_dom
		 * @return {Object|jQuery}
		 */
		get_node : function (obj, as_dom) {
			if(obj && obj.id) {
				obj = obj.id;
			}
			var dom;
			try {
				if(this._model.data[obj]) {
					obj = this._model.data[obj];
				}
				else if(((dom = $(obj, this.element)).length || (dom = $('#' + obj, this.element)).length) && this._model.data[dom.closest('li').attr('id')]) {
					obj = this._model.data[dom.closest('li').attr('id')];
				}
				else if((dom = $(obj, this.element)).length && dom.hasClass('jstree')) {
					obj = this._model.data['#'];
				}
				else {
					return false;
				}

				if(as_dom) {
					obj = obj.id === '#' ? this.element : $(document.getElementById(obj.id));
				}
				return obj;
			} catch (ex) { return false; }
		},
		/**
		 * get the path to a node, either consisting of node texts, or of node IDs, optionally glued together (otherwise an array)
		 * @name get_path(obj [, glue, ids])
		 * @param  {mixed} obj the node
		 * @param  {String} glue if you want the path as a string - pass the glue here (for example '/'), if a falsy value is supplied here, an array is returned
		 * @param  {Boolean} ids if set to true build the path using ID, otherwise node text is used
		 * @return {mixed}
		 */
		get_path : function (obj, glue, ids) {
			obj = obj.parents ? obj : this.get_node(obj);
			if(!obj || obj.id === '#' || !obj.parents) {
				return false;
			}
			var i, j, p = [];
			p.push(ids ? obj.id : obj.text);
			for(i = 0, j = obj.parents.length; i < j; i++) {
				p.push(ids ? obj.parents[i] : this.get_text(obj.parents[i]));
			}
			p = p.reverse().slice(1);
			return glue ? p.join(glue) : p;
		},
		/**
		 * get the next visible node that is below the `obj` node. If `strict` is set to `true` only sibling nodes are returned.
		 * @name get_next_dom(obj [, strict])
		 * @param  {mixed} obj
		 * @param  {Boolean} strict
		 * @return {jQuery}
		 */
		get_next_dom : function (obj, strict) {
			var tmp;
			obj = this.get_node(obj, true);
			if(obj[0] === this.element[0]) {
				tmp = this._firstChild(this.get_container_ul()[0]);
				return tmp ? $(tmp) : false;
			}
			if(!obj || !obj.length) {
				return false;
			}
			if(strict) {
				tmp = this._nextSibling(obj[0]);
				return tmp ? $(tmp) : false;
			}
			if(obj.hasClass("jstree-open")) {
				tmp = this._firstChild(obj.children('ul')[0]);
				return tmp ? $(tmp) : false;
			}
			if((tmp = this._nextSibling(obj[0])) !== null) {
				return $(tmp);
			}
			return obj.parentsUntil(".jstree","li").next("li").eq(0);
		},
		/**
		 * get the previous visible node that is above the `obj` node. If `strict` is set to `true` only sibling nodes are returned.
		 * @name get_prev_dom(obj [, strict])
		 * @param  {mixed} obj
		 * @param  {Boolean} strict
		 * @return {jQuery}
		 */
		get_prev_dom : function (obj, strict) {
			var tmp;
			obj = this.get_node(obj, true);
			if(obj[0] === this.element[0]) {
				tmp = this.get_container_ul()[0].lastChild;
				return tmp ? $(tmp) : false;
			}
			if(!obj || !obj.length) {
				return false;
			}
			if(strict) {
				tmp = this._previousSibling(obj[0]);
				return tmp ? $(tmp) : false;
			}
			if((tmp = this._previousSibling(obj[0])) !== null) {
				obj = $(tmp);
				while(obj.hasClass("jstree-open")) {
					obj = obj.children("ul:eq(0)").children("li:last");
				}
				return obj;
			}
			tmp = obj[0].parentNode.parentNode;
			return tmp && tmp.tagName === 'LI' ? $(tmp) : false;
		},
		/**
		 * get the parent ID of a node
		 * @name get_parent(obj)
		 * @param  {mixed} obj
		 * @return {String}
		 */
		get_parent : function (obj) {
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			return obj.parent;
		},
		/**
		 * get a jQuery collection of all the children of a node (node must be rendered)
		 * @name get_children_dom(obj)
		 * @param  {mixed} obj
		 * @return {jQuery}
		 */
		get_children_dom : function (obj) {
			obj = this.get_node(obj, true);
			if(obj[0] === this.element[0]) {
				return this.get_container_ul().children("li");
			}
			if(!obj || !obj.length) {
				return false;
			}
			return obj.children("ul").children("li");
		},
		/**
		 * checks if a node has children
		 * @name is_parent(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_parent : function (obj) {
			obj = this.get_node(obj);
			return obj && (obj.state.loaded === false || obj.children.length > 0);
		},
		/**
		 * checks if a node is loaded (its children are available)
		 * @name is_loaded(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_loaded : function (obj) {
			obj = this.get_node(obj);
			return obj && obj.state.loaded;
		},
		/**
		 * check if a node is currently loading (fetching children)
		 * @name is_loading(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_loading : function (obj) {
			obj = this.get_node(obj, true);
			return obj && obj.hasClass("jstree-loading");
		},
		/**
		 * check if a node is opened
		 * @name is_open(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_open : function (obj) {
			obj = this.get_node(obj);
			return obj && obj.state.opened;
		},
		/**
		 * check if a node is in a closed state
		 * @name is_closed(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_closed : function (obj) {
			obj = this.get_node(obj);
			return obj && this.is_parent(obj) && !obj.state.opened;
		},
		/**
		 * check if a node has no children
		 * @name is_leaf(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_leaf : function (obj) {
			return !this.is_parent(obj);
		},
		/**
		 * loads a node (fetches its children using the `core.data` setting). Multiple nodes can be passed to by using an array.
		 * @name load_node(obj [, callback])
		 * @param  {mixed} obj
		 * @param  {function} callback a function to be executed once loading is conplete, the function is executed in the instance's scope and receives two arguments - the node and a boolean status
		 * @return {Boolean}
		 * @trigger load_node.jstree
		 */
		load_node : function (obj, callback) {
			var t1, t2;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.load_node(obj[t1], callback);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj) {
				callback.call(this, obj, false);
				return false;
			}
			this.get_node(obj, true).addClass("jstree-loading");
			this._load_node(obj, $.proxy(function (status) {
				obj.state.loaded = status;
				this.get_node(obj, true).removeClass("jstree-loading");
				/**
				 * triggered after a node is loaded
				 * @event
				 * @name load_node.jstree
				 * @param {Object} node the node that was loading
				 * @param {Boolean} status was the node loaded successfully
				 */
				this.trigger('load_node', { "node" : obj, "status" : status });
				if(callback) {
					callback.call(this, obj, status);
				}
			}, this));
			return true;
		},
		/**
		 * handles the actual loading of a node. Used only internally.
		 * @private
		 * @name _load_node(obj [, callback])
		 * @param  {mixed} obj
		 * @param  {function} callback a function to be executed once loading is conplete, the function is executed in the instance's scope and receives one argument - a boolean status
		 * @return {Boolean}
		 */
		_load_node : function (obj, callback) {
			var s = this.settings.core.data, t;
			// use original HTML
			if(!s) {
				return callback.call(this, obj.id === '#' ? this._append_html_data(obj, this._data.core.original_container_html.clone(true)) : false);
			}
			if($.isFunction(s)) {
				return s.call(this, obj, $.proxy(function (d) {
					return d === false ? callback.call(this, false) : callback.call(this, this[typeof d === 'string' ? '_append_html_data' : '_append_json_data'](obj, typeof d === 'string' ? $(d) : d));
				}, this));
			}
			if(typeof s === 'object') {
				if(s.url) {
					s = $.extend(true, {}, s);
					if($.isFunction(s.url)) {
						s.url = s.url.call(this, obj);
					}
					if($.isFunction(s.data)) {
						s.data = s.data.call(this, obj);
					}
					return $.ajax(s)
						.done($.proxy(function (d,t,x) {
								var type = x.getResponseHeader('Content-Type');
								if(type.indexOf('json') !== -1) {
									return callback.call(this, this._append_json_data(obj, d));
								}
								if(type.indexOf('html') !== -1) {
									return callback.call(this, this._append_html_data(obj, $(d)));
								}
							}, this))
						.fail($.proxy(function () {
								callback.call(this, false);
								this._data.core.last_error = { 'error' : 'ajax', 'plugin' : 'core', 'id' : 'core_04', 'reason' : 'Could not load node', 'data' : JSON.stringify(s) };
								this.settings.core.error.call(this, this._data.core.last_error);
							}, this));
				}
				t = ($.isArray(s) || $.isPlainObject(s)) ? JSON.parse(JSON.stringify(s)) : s;
				return callback.call(this, this._append_json_data(obj, t));
			}
			if(typeof s === 'string') {
				return callback.call(this, this._append_html_data(obj, s));
			}
			return callback.call(this, false);
		},
		/**
		 * adds a node to the list of nodes to redraw. Used only internally.
		 * @private
		 * @name _node_changed(obj [, callback])
		 * @param  {mixed} obj
		 */
		_node_changed : function (obj) {
			obj = this.get_node(obj);
			if(obj) {
				this._model.changed.push(obj.id);
			}
		},
		/**
		 * appends HTML content to the tree. Used internally.
		 * @private
		 * @name _append_html_data(obj, data)
		 * @param  {mixed} obj the node to append to
		 * @param  {String} data the HTML string to parse and append
		 * @return {Boolean}
		 * @trigger model.jstree, changed.jstree
		 */
		_append_html_data : function (dom, data) {
			dom = this.get_node(dom);
			dom.children = [];
			dom.children_d = [];
			var dat = data.is('ul') ? data.children() : data,
				par = dom.id,
				chd = [],
				dpc = [],
				m = this._model.data,
				p = m[par],
				s = this._data.core.selected.length,
				tmp, i, j;
			dat.each($.proxy(function (i, v) {
				tmp = this._parse_model_from_html($(v), par, p.parents.concat());
				if(tmp) {
					chd.push(tmp);
					dpc.push(tmp);
					if(m[tmp].children_d.length) {
						dpc = dpc.concat(m[tmp].children_d);
					}
				}
			}, this));
			p.children = chd;
			p.children_d = dpc;
			for(i = 0, j = p.parents.length; i < j; i++) {
				m[p.parents[i]].children_d = m[p.parents[i]].children_d.concat(dpc);
			}
			/**
			 * triggered when new data is inserted to the tree model
			 * @event
			 * @name model.jstree
			 * @param {Array} nodes an array of node IDs
			 * @param {String} parent the parent ID of the nodes
			 */
			this.trigger('model', { "nodes" : dpc, 'parent' : par });
			if(par !== '#') {
				this._node_changed(par);
				this.redraw();
			}
			else {
				this.get_container_ul().children('.jstree-initial-node').remove();
				this.redraw(true);
			}
			if(this._data.core.selected.length !== s) {
				this.trigger('changed', { 'action' : 'model', 'selected' : this._data.core.selected });
			}
			return true;
		},
		/**
		 * appends JSON content to the tree. Used internally.
		 * @private
		 * @name _append_json_data(obj, data)
		 * @param  {mixed} obj the node to append to
		 * @param  {String} data the JSON object to parse and append
		 * @return {Boolean}
		 */
		_append_json_data : function (dom, data) {
			dom = this.get_node(dom);
			dom.children = [];
			dom.children_d = [];
			var dat = data,
				par = dom.id,
				chd = [],
				dpc = [],
				m = this._model.data,
				p = m[par],
				s = this._data.core.selected.length,
				tmp, i, j;
			// *%$@!!!
			if(dat.d) {
				dat = dat.d;
				if(typeof dat === "string") {
					dat = JSON.parse(dat);
				}
			}
			if(!$.isArray(dat)) { dat = [dat]; }
			if(dat.length && dat[0].id !== undefined && dat[0].parent !== undefined) {
				// Flat JSON support (for easy import from DB):
				// 1) convert to object (foreach)
				for(i = 0, j = dat.length; i < j; i++) {
					if(!dat[i].children) {
						dat[i].children = [];
					}
					m[dat[i].id] = dat[i];
				}
				// 2) populate children (foreach)
				for(i = 0, j = dat.length; i < j; i++) {
					m[dat[i].parent].children.push(dat[i].id);
					// populate parent.children_d
					p.children_d.push(dat[i].id);
				}
				// 3) normalize && populate parents and children_d with recursion
				for(i = 0, j = p.children.length; i < j; i++) {
					tmp = this._parse_model_from_flat_json(m[p.children[i]], par, p.parents.concat());
					dpc.push(tmp);
					if(m[tmp].children_d.length) {
						dpc = dpc.concat(m[tmp].children_d);
					}
				}
				// ?) three_state selection - p.state.selected && t - (if three_state foreach(dat => ch) -> foreach(parents) if(parent.selected) child.selected = true;
			}
			else {
				for(i = 0, j = dat.length; i < j; i++) {
					tmp = this._parse_model_from_json(dat[i], par, p.parents.concat());
					if(tmp) {
						chd.push(tmp);
						dpc.push(tmp);
						if(m[tmp].children_d.length) {
							dpc = dpc.concat(m[tmp].children_d);
						}
					}
				}
				p.children = chd;
				p.children_d = dpc;
				for(i = 0, j = p.parents.length; i < j; i++) {
					m[p.parents[i]].children_d = m[p.parents[i]].children_d.concat(dpc);
				}
			}
			this.trigger('model', { "nodes" : dpc, 'parent' : par });

			if(par !== '#') {
				this._node_changed(par);
				this.redraw();
			}
			else {
				// this.get_container_ul().children('.jstree-initial-node').remove();
				this.redraw(true);
			}
			if(this._data.core.selected.length !== s) {
				this.trigger('changed', { 'action' : 'model', 'selected' : this._data.core.selected });
			}
			return true;
		},
		/**
		 * parses a node from a jQuery object and appends them to the in memory tree model. Used internally.
		 * @private
		 * @name _parse_model_from_html(d [, p, ps])
		 * @param  {jQuery} d the jQuery object to parse
		 * @param  {String} p the parent ID
		 * @param  {Array} ps list of all parents
		 * @return {String} the ID of the object added to the model
		 */
		_parse_model_from_html : function (d, p, ps) {
			if(!ps) { ps = []; }
			else { ps = [].concat(ps); }
			if(p) { ps.unshift(p); }
			var c, e, m = this._model.data,
				data = {
					id			: false,
					text		: false,
					icon		: true,
					parent		: p,
					parents		: ps,
					children	: [],
					children_d	: [],
					data		: null,
					state		: { },
					li_attr		: { id : false },
					a_attr		: { href : '#' },
					original	: false
				}, i, tmp, tid;
			for(i in this._model.default_state) {
				if(this._model.default_state.hasOwnProperty(i)) {
					data.state[i] = this._model.default_state[i];
				}
			}
			tmp = $.vakata.attributes(d, true);
			$.each(tmp, function (i, v) {
				v = $.trim(v);
				if(!v.length) { return true; }
				data.li_attr[i] = v;
				if(i === 'id') {
					data.id = v;
				}
			});
			tmp = d.children('a').eq(0);
			if(tmp.length) {
				tmp = $.vakata.attributes(tmp, true);
				$.each(tmp, function (i, v) {
					v = $.trim(v);
					if(v.length) {
						data.a_attr[i] = v;
					}
				});
			}
			tmp = d.children("a:eq(0)").length ? d.children("a:eq(0)").clone() : d.clone();
			tmp.children("ins, i, ul").remove();
			tmp = tmp.html();
			tmp = $('<div />').html(tmp);
			data.text = tmp.html();
			tmp = d.data();
			data.data = tmp ? $.extend(true, {}, tmp) : null;
			data.state.opened = d.hasClass('jstree-open');
			data.state.selected = d.children('a').hasClass('jstree-clicked');
			data.state.disabled = d.children('a').hasClass('jstree-disabled');
			if(data.data && data.data.jstree) {
				for(i in data.data.jstree) {
					if(data.data.jstree.hasOwnProperty(i)) {
						data.state[i] = data.data.jstree[i];
					}
				}
			}
			tmp = d.children("a").children(".jstree-themeicon");
			if(tmp.length) {
				data.icon = tmp.hasClass('jstree-themeicon-hidden') ? false : tmp.attr('rel');
			}
			if(data.state.icon) {
				data.icon = data.state.icon;
			}
			tmp = d.children("ul").children("li");
			do {
				tid = 'j' + this._id + '_' + (++this._cnt);
			} while(m[tid]);
			data.id = data.li_attr.id || tid;
			if(tmp.length) {
				tmp.each($.proxy(function (i, v) {
					c = this._parse_model_from_html($(v), data.id, ps);
					e = this._model.data[c];
					data.children.push(c);
					if(e.children_d.length) {
						data.children_d = data.children_d.concat(e.children_d);
					}
				}, this));
				data.children_d = data.children_d.concat(data.children);
			}
			else {
				if(d.hasClass('jstree-closed')) {
					data.state.loaded = false;
				}
			}
			if(data.li_attr['class']) {
				data.li_attr['class'] = data.li_attr['class'].replace('jstree-closed','').replace('jstree-open','');
			}
			if(data.a_attr['class']) {
				data.a_attr['class'] = data.a_attr['class'].replace('jstree-clicked','').replace('jstree-disabled','');
			}
			m[data.id] = data;
			if(data.state.selected) {
				this._data.core.selected.push(data.id);
			}
			return data.id;
		},
		/**
		 * parses a node from a JSON object (used when dealing with flat data, which has no nesting of children, but has id and parent properties) and appends it to the in memory tree model. Used internally.
		 * @private
		 * @name _parse_model_from_flat_json(d [, p, ps])
		 * @param  {Object} d the JSON object to parse
		 * @param  {String} p the parent ID
		 * @param  {Array} ps list of all parents
		 * @return {String} the ID of the object added to the model
		 */
		_parse_model_from_flat_json : function (d, p, ps) {
			if(!ps) { ps = []; }
			else { ps = ps.concat(); }
			if(p) { ps.unshift(p); }
			var tid = d.id,
				m = this._model.data,
				df = this._model.default_state,
				i, j, c, e,
				tmp = {
					id			: tid,
					text		: d.text || '',
					icon		: d.icon !== undefined ? d.icon : true,
					parent		: p,
					parents		: ps,
					children	: d.children || [],
					children_d	: d.children_d || [],
					data		: d.data,
					state		: { },
					li_attr		: { id : false },
					a_attr		: { href : '#' },
					original	: false
				};
			for(i in df) {
				if(df.hasOwnProperty(i)) {
					tmp.state[i] = df[i];
				}
			}
			if(d && d.data && d.data.jstree && d.data.jstree.icon) {
				tmp.icon = d.data.jstree.icon;
			}
			if(d && d.data) {
				tmp.data = d.data;
				if(d.data.jstree) {
					for(i in d.data.jstree) {
						if(d.data.jstree.hasOwnProperty(i)) {
							tmp.state[i] = d.data.jstree[i];
						}
					}
				}
			}
			if(d && typeof d.state === 'object') {
				for (i in d.state) {
					if(d.state.hasOwnProperty(i)) {
						tmp.state[i] = d.state[i];
					}
				}
			}
			if(d && typeof d.li_attr === 'object') {
				for (i in d.li_attr) {
					if(d.li_attr.hasOwnProperty(i)) {
						tmp.li_attr[i] = d.li_attr[i];
					}
				}
			}
			if(!tmp.li_attr.id) {
				tmp.li_attr.id = tid;
			}
			if(d && typeof d.a_attr === 'object') {
				for (i in d.a_attr) {
					if(d.a_attr.hasOwnProperty(i)) {
						tmp.a_attr[i] = d.a_attr[i];
					}
				}
			}
			if(d && d.children && d.children === true) {
				tmp.state.loaded = false;
				tmp.children = [];
				tmp.children_d = [];
			}
			m[tmp.id] = tmp;
			for(i = 0, j = tmp.children.length; i < j; i++) {
				c = this._parse_model_from_flat_json(m[tmp.children[i]], tmp.id, ps);
				e = m[c];
				tmp.children_d.push(c);
				if(e.children_d.length) {
					tmp.children_d = tmp.children_d.concat(e.children_d);
				}
			}
			delete d.data;
			delete d.children;
			m[tmp.id].original = d;
			if(tmp.state.selected) {
				this._data.core.selected.push(tmp.id);
			}
			return tmp.id;
		},
		/**
		 * parses a node from a JSON object and appends it to the in memory tree model. Used internally.
		 * @private
		 * @name _parse_model_from_json(d [, p, ps])
		 * @param  {Object} d the JSON object to parse
		 * @param  {String} p the parent ID
		 * @param  {Array} ps list of all parents
		 * @return {String} the ID of the object added to the model
		 */
		_parse_model_from_json : function (d, p, ps) {
			if(!ps) { ps = []; }
			else { ps = ps.concat(); }
			if(p) { ps.unshift(p); }
			var tid = false, i, j, c, e, m = this._model.data, df = this._model.default_state, tmp;
			do {
				tid = 'j' + this._id + '_' + (++this._cnt);
			} while(m[tid]);

			tmp = {
				id			: false,
				text		: typeof d === 'string' ? d : '',
				icon		: typeof d === 'object' && d.icon !== undefined ? d.icon : true,
				parent		: p,
				parents		: ps,
				children	: [],
				children_d	: [],
				data		: null,
				state		: { },
				li_attr		: { id : false },
				a_attr		: { href : '#' },
				original	: false
			};
			for(i in df) {
				if(df.hasOwnProperty(i)) {
					tmp.state[i] = df[i];
				}
			}
			if(d && d.id) { tmp.id = d.id; }
			if(d && d.text) { tmp.text = d.text; }
			if(d && d.data && d.data.jstree && d.data.jstree.icon) {
				tmp.icon = d.data.jstree.icon;
			}
			if(d && d.data) {
				tmp.data = d.data;
				if(d.data.jstree) {
					for(i in d.data.jstree) {
						if(d.data.jstree.hasOwnProperty(i)) {
							tmp.state[i] = d.data.jstree[i];
						}
					}
				}
			}
			if(d && typeof d.state === 'object') {
				for (i in d.state) {
					if(d.state.hasOwnProperty(i)) {
						tmp.state[i] = d.state[i];
					}
				}
			}
			if(d && typeof d.li_attr === 'object') {
				for (i in d.li_attr) {
					if(d.li_attr.hasOwnProperty(i)) {
						tmp.li_attr[i] = d.li_attr[i];
					}
				}
			}
			if(tmp.li_attr.id && !tmp.id) {
				tmp.id = tmp.li_attr.id;
			}
			if(!tmp.id) {
				tmp.id = tid;
			}
			if(!tmp.li_attr.id) {
				tmp.li_attr.id = tmp.id;
			}
			if(d && typeof d.a_attr === 'object') {
				for (i in d.a_attr) {
					if(d.a_attr.hasOwnProperty(i)) {
						tmp.a_attr[i] = d.a_attr[i];
					}
				}
			}
			if(d && d.children && d.children.length) {
				for(i = 0, j = d.children.length; i < j; i++) {
					c = this._parse_model_from_json(d.children[i], tmp.id, ps);
					e = m[c];
					tmp.children.push(c);
					if(e.children_d.length) {
						tmp.children_d = tmp.children_d.concat(e.children_d);
					}
				}
				tmp.children_d = tmp.children_d.concat(tmp.children);
			}
			if(d && d.children && d.children === true) {
				tmp.state.loaded = false;
				tmp.children = [];
				tmp.children_d = [];
			}
			delete d.data;
			delete d.children;
			tmp.original = d;
			m[tmp.id] = tmp;
			if(tmp.state.selected) {
				this._data.core.selected.push(tmp.id);
			}
			return tmp.id;
		},
		/**
		 * redraws all nodes that need to be redrawn. Used internally.
		 * @private
		 * @name _redraw()
		 * @trigger redraw.jstree
		 */
		_redraw : function () {
			var nodes = this._model.force_full_redraw ? this._model.data['#'].children.concat([]) : this._model.changed.concat([]),
				f = document.createElement('UL'), tmp, i, j;
			for(i = 0, j = nodes.length; i < j; i++) {
				tmp = this.redraw_node(nodes[i], true, this._model.force_full_redraw);
				if(tmp && this._model.force_full_redraw) {
					f.appendChild(tmp);
				}
			}
			if(this._model.force_full_redraw) {
				f.className = this.get_container_ul()[0].className;
				this.element.empty().append(f);
				//this.get_container_ul()[0].appendChild(f);
			}
			this._model.force_full_redraw = false;
			this._model.changed = [];
			/**
			 * triggered after nodes are redrawn
			 * @event
			 * @name redraw.jstree
			 * @param {array} nodes the redrawn nodes
			 */
			this.trigger('redraw', { "nodes" : nodes });
		},
		/**
		 * redraws all nodes that need to be redrawn or optionally - the whole tree
		 * @name redraw([full])
		 * @param {Boolean} full if set to `true` all nodes are redrawn.
		 */
		redraw : function (full) {
			if(full) {
				this._model.force_full_redraw = true;
			}
			//if(this._model.redraw_timeout) {
			//	clearTimeout(this._model.redraw_timeout);
			//}
			//this._model.redraw_timeout = setTimeout($.proxy(this._redraw, this),0);
			this._redraw();
		},
		/**
		 * redraws a single node. Used internally.
		 * @private
		 * @name redraw_node(node, deep, is_callback)
		 * @param {mixed} node the node to redraw
		 * @param {Boolean} deep should child nodes be redrawn too
		 * @param {Boolean} is_callback is this a recursion call
		 */
		redraw_node : function (node, deep, is_callback) {
			var obj = this.get_node(node),
				par = false,
				ind = false,
				old = false,
				i = false,
				j = false,
				k = false,
				c = '',
				d = document,
				m = this._model.data,
				f = false,
				s = false;
			if(!obj) { return false; }
			if(obj.id === '#') {  return this.redraw(true); }
			deep = deep || obj.children.length === 0;
			node = d.getElementById(obj.id); //, this.element);
			if(!node) {
				deep = true;
				//node = d.createElement('LI');
				if(!is_callback) {
					par = obj.parent !== '#' ? $('#' + obj.parent, this.element)[0] : null;
					if(par !== null && (!par || !m[obj.parent].state.opened)) {
						return false;
					}
					ind = $.inArray(obj.id, par === null ? m['#'].children : m[obj.parent].children);
				}
			}
			else {
				node = $(node);
				if(!is_callback) {
					par = node.parent().parent()[0];
					if(par === this.element[0]) {
						par = null;
					}
					ind = node.index();
				}
				// m[obj.id].data = node.data(); // use only node's data, no need to touch jquery storage
				if(!deep && obj.children.length && !node.children('ul').length) {
					deep = true;
				}
				if(!deep) {
					old = node.children('UL')[0];
				}
				s = node.attr('aria-selected');
				f = node.children('.jstree-anchor')[0] === document.activeElement;
				node.remove();
				//node = d.createElement('LI');
				//node = node[0];
			}
			node = _node.cloneNode(true);
			// node is DOM, deep is boolean

			c = 'jstree-node ';
			for(i in obj.li_attr) {
				if(obj.li_attr.hasOwnProperty(i)) {
					if(i === 'id') { continue; }
					if(i !== 'class') {
						node.setAttribute(i, obj.li_attr[i]);
					}
					else {
						c += obj.li_attr[i];
					}
				}
			}
			if(s && s !== "false") {
				node.setAttribute('aria-selected', true);
			}
			if(!obj.children.length && obj.state.loaded) {
				c += ' jstree-leaf';
			}
			else {
				c += obj.state.opened ? ' jstree-open' : ' jstree-closed';
				node.setAttribute('aria-expanded', obj.state.opened);
			}
			if(obj.parent !== null && m[obj.parent].children[m[obj.parent].children.length - 1] === obj.id) {
				c += ' jstree-last';
			}
			node.id = obj.id;
			node.className = c;
			c = ( obj.state.selected ? ' jstree-clicked' : '') + ( obj.state.disabled ? ' jstree-disabled' : '');
			for(j in obj.a_attr) {
				if(obj.a_attr.hasOwnProperty(j)) {
					if(j === 'href' && obj.a_attr[j] === '#') { continue; }
					if(j !== 'class') {
						node.childNodes[1].setAttribute(j, obj.a_attr[j]);
					}
					else {
						c += ' ' + obj.a_attr[j];
					}
				}
			}
			if(c.length) {
				node.childNodes[1].className = 'jstree-anchor ' + c;
			}
			if((obj.icon && obj.icon !== true) || obj.icon === false) {
				if(obj.icon === false) {
					node.childNodes[1].childNodes[0].className += ' jstree-themeicon-hidden';
				}
				else if(obj.icon.indexOf('/') === -1 && obj.icon.indexOf('.') === -1) {
					node.childNodes[1].childNodes[0].className += ' ' + obj.icon + ' jstree-themeicon-custom';
				}
				else {
					node.childNodes[1].childNodes[0].style.backgroundImage = 'url('+obj.icon+')';
					node.childNodes[1].childNodes[0].style.backgroundPosition = 'center center';
					node.childNodes[1].childNodes[0].style.backgroundSize = 'auto';
					node.childNodes[1].childNodes[0].className += ' jstree-themeicon-custom';
				}
			}
			//node.childNodes[1].appendChild(d.createTextNode(obj.text));
			node.childNodes[1].innerHTML += obj.text;
			// if(obj.data) { $.data(node, obj.data); } // always work with node's data, no need to touch jquery store

			if(deep && obj.children.length && obj.state.opened) {
				k = d.createElement('UL');
				k.setAttribute('role', 'group');
				k.className = 'jstree-children';
				for(i = 0, j = obj.children.length; i < j; i++) {
					k.appendChild(this.redraw_node(obj.children[i], deep, true));
				}
				node.appendChild(k);
			}
			if(old) {
				node.appendChild(old);
			}
			if(!is_callback) {
				// append back using par / ind
				if(!par) {
					par = this.element[0];
				}
				if(!par.getElementsByTagName('UL').length) {
					i = d.createElement('UL');
					i.setAttribute('role', 'group');
					i.className = 'jstree-children';
					par.appendChild(i);
					par = i;
				}
				else {
					par = par.getElementsByTagName('UL')[0];
				}

				if(ind < par.childNodes.length) {
					par.insertBefore(node, par.childNodes[ind]);
				}
				else {
					par.appendChild(node);
				}
				if(f) {
					node.childNodes[1].focus();
				}
			}
			return node;
		},
		/**
		 * opens a node, revaling its children. If the node is not loaded it will be loaded and opened once ready.
		 * @name open_node(obj [, callback, animation])
		 * @param {mixed} obj the node to open
		 * @param {Function} callback a function to execute once the node is opened
		 * @param {Number} animation the animation duration in milliseconds when opening the node (overrides the `core.animation` setting). Use `false` for no animation.
		 * @trigger open_node.jstree, after_open.jstree
		 */
		open_node : function (obj, callback, animation) {
			var t1, t2, d, t;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.open_node(obj[t1], callback, animation);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			animation = animation === undefined ? this.settings.core.animation : animation;
			if(!this.is_closed(obj)) {
				if(callback) {
					callback.call(this, obj, false);
				}
				return false;
			}
			if(!this.is_loaded(obj)) {
				if(this.is_loading(obj)) {
					return setTimeout($.proxy(function () {
						this.open_node(obj, callback, animation);
					}, this), 500);
				}
				this.load_node(obj, function (o, ok) {
					return ok ? this.open_node(o, callback, animation) : (callback ? callback.call(this, o, false) : false);
				});
			}
			else {
				d = this.get_node(obj, true);
				t = this;
				if(d.length) {
					if(obj.children.length && !this._firstChild(d.children('ul')[0])) {
						obj.state.opened = true;
						this.redraw_node(obj, true);
						d = this.get_node(obj, true);
					}
					if(!animation) {
						d[0].className = d[0].className.replace('jstree-closed', 'jstree-open');
						d[0].setAttribute("aria-expanded", true);
					}
					else {
						d
							.children("ul").css("display","none").end()
							.removeClass("jstree-closed").addClass("jstree-open").attr("aria-expanded", true)
							.children("ul").stop(true, true)
								.slideDown(animation, function () {
									this.style.display = "";
									t.trigger("after_open", { "node" : obj });
								});
					}
				}
				obj.state.opened = true;
				if(callback) {
					callback.call(this, obj, true);
				}
				/**
				 * triggered when a node is opened (if there is an animation it will not be completed yet)
				 * @event
				 * @name open_node.jstree
				 * @param {Object} node the opened node
				 */
				this.trigger('open_node', { "node" : obj });
				if(!animation || !d.length) {
					/**
					 * triggered when a node is opened and the animation is complete
					 * @event
					 * @name after_open.jstree
					 * @param {Object} node the opened node
					 */
					this.trigger("after_open", { "node" : obj });
				}
			}
		},
		/**
		 * opens every parent of a node (node should be loaded)
		 * @name _open_to(obj)
		 * @param {mixed} obj the node to reveal
		 * @private
		 */
		_open_to : function (obj) {
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			var i, j, p = obj.parents;
			for(i = 0, j = p.length; i < j; i+=1) {
				if(i !== '#') {
					this.open_node(p[i], false, 0);
				}
			}
			return $(document.getElementById(obj.id));
		},
		/**
		 * closes a node, hiding its children
		 * @name close_node(obj [, animation])
		 * @param {mixed} obj the node to close
		 * @param {Number} animation the animation duration in milliseconds when closing the node (overrides the `core.animation` setting). Use `false` for no animation.
		 * @trigger close_node.jstree, after_close.jstree
		 */
		close_node : function (obj, animation) {
			var t1, t2, t, d;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.close_node(obj[t1], animation);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			animation = animation === undefined ? this.settings.core.animation : animation;
			t = this;
			d = this.get_node(obj, true);
			if(d.length) {
				if(!animation) {
					d[0].className = d[0].className.replace('jstree-open', 'jstree-closed');
					d.attr("aria-expanded", false).children('ul').remove();
				}
				else {
					d
						.children("ul").attr("style","display:block !important").end()
						.removeClass("jstree-open").addClass("jstree-closed").attr("aria-expanded", false)
						.children("ul").stop(true, true).slideUp(animation, function () {
							this.style.display = "";
							d.children('ul').remove();
							t.trigger("after_close", { "node" : obj });
						});
				}
			}
			obj.state.opened = false;
			/**
			 * triggered when a node is closed (if there is an animation it will not be complete yet)
			 * @event
			 * @name close_node.jstree
			 * @param {Object} node the closed node
			 */
			this.trigger('close_node',{ "node" : obj });
			if(!animation || !d.length) {
				/**
				 * triggered when a node is closed and the animation is complete
				 * @event
				 * @name after_close.jstree
				 * @param {Object} node the closed node
				 */
				this.trigger("after_close", { "node" : obj });
			}
		},
		/**
		 * toggles a node - closing it if it is open, opening it if it is closed
		 * @name toggle_node(obj)
		 * @param {mixed} obj the node to toggle
		 */
		toggle_node : function (obj) {
			var t1, t2;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.toggle_node(obj[t1]);
				}
				return true;
			}
			if(this.is_closed(obj)) {
				return this.open_node(obj);
			}
			if(this.is_open(obj)) {
				return this.close_node(obj);
			}
		},
		/**
		 * opens all nodes within a node (or the tree), revaling their children. If the node is not loaded it will be loaded and opened once ready.
		 * @name open_all([obj, animation, original_obj])
		 * @param {mixed} obj the node to open recursively, omit to open all nodes in the tree
		 * @param {Number} animation the animation duration in milliseconds when opening the nodes, the default is no animation
		 * @param {jQuery} reference to the node that started the process (internal use)
		 * @trigger open_all.jstree
		 */
		open_all : function (obj, animation, original_obj) {
			if(!obj) { obj = '#'; }
			obj = this.get_node(obj);
			if(!obj) { return false; }
			var dom = obj.id === '#' ? this.get_container_ul() : this.get_node(obj, true), i, j, _this;
			if(!dom.length) {
				for(i = 0, j = obj.children_d.length; i < j; i++) {
					if(this.is_closed(this._model.data[obj.children_d[i]])) {
						this._model.data[obj.children_d[i]].state.opened = true;
					}
				}
				return this.trigger('open_all', { "node" : obj });
			}
			original_obj = original_obj || dom;
			_this = this;
			dom = this.is_closed(obj) ? dom.find('li.jstree-closed').addBack() : dom.find('li.jstree-closed');
			dom.each(function () {
				_this.open_node(
					this,
					function(node, status) { if(status && this.is_parent(node)) { this.open_all(node, animation, original_obj); } },
					animation || 0
				);
			});
			if(original_obj.find('li.jstree-closed').length === 0) {
				/**
				 * triggered when an `open_all` call completes
				 * @event
				 * @name open_all.jstree
				 * @param {Object} node the opened node
				 */
				this.trigger('open_all', { "node" : this.get_node(original_obj) });
			}
		},
		/**
		 * closes all nodes within a node (or the tree), revaling their children
		 * @name close_all([obj, animation])
		 * @param {mixed} obj the node to close recursively, omit to close all nodes in the tree
		 * @param {Number} animation the animation duration in milliseconds when closing the nodes, the default is no animation
		 * @trigger close_all.jstree
		 */
		close_all : function (obj, animation) {
			if(!obj) { obj = '#'; }
			obj = this.get_node(obj);
			if(!obj) { return false; }
			var dom = obj.id === '#' ? this.get_container_ul() : this.get_node(obj, true),
				_this = this, i, j;
			if(!dom.length) {
				for(i = 0, j = obj.children_d.length; i < j; i++) {
					this._model.data[obj.children_d[i]].state.opened = false;
				}
				return this.trigger('close_all', { "node" : obj });
			}
			dom = this.is_open(obj) ? dom.find('li.jstree-open').addBack() : dom.find('li.jstree-open');
			dom.vakata_reverse().each(function () { _this.close_node(this, animation || 0); });
			/**
			 * triggered when an `close_all` call completes
			 * @event
			 * @name close_all.jstree
			 * @param {Object} node the closed node
			 */
			this.trigger('close_all', { "node" : obj });
		},
		/**
		 * checks if a node is disabled (not selectable)
		 * @name is_disabled(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_disabled : function (obj) {
			obj = this.get_node(obj);
			return obj && obj.state && obj.state.disabled;
		},
		/**
		 * enables a node - so that it can be selected
		 * @name enable_node(obj)
		 * @param {mixed} obj the node to enable
		 * @trigger enable_node.jstree
		 */
		enable_node : function (obj) {
			var t1, t2;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.enable_node(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			obj.state.disabled = false;
			this.get_node(obj,true).children('.jstree-anchor').removeClass('jstree-disabled');
			/**
			 * triggered when an node is enabled
			 * @event
			 * @name enable_node.jstree
			 * @param {Object} node the enabled node
			 */
			this.trigger('enable_node', { 'node' : obj });
		},
		/**
		 * disables a node - so that it can not be selected
		 * @name disable_node(obj)
		 * @param {mixed} obj the node to disable
		 * @trigger disable_node.jstree
		 */
		disable_node : function (obj) {
			var t1, t2;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.disable_node(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			obj.state.disabled = true;
			this.get_node(obj,true).children('.jstree-anchor').addClass('jstree-disabled');
			/**
			 * triggered when an node is disabled
			 * @event
			 * @name disable_node.jstree
			 * @param {Object} node the disabled node
			 */
			this.trigger('disable_node', { 'node' : obj });
		},
		/**
		 * called when a node is selected by the user. Used internally.
		 * @private
		 * @name activate_node(obj, e)
		 * @param {mixed} obj the node
		 * @param {Object} e the related event
		 * @trigger activate_node.jstree
		 */
		activate_node : function (obj, e) {
			if(this.is_disabled(obj)) {
				return false;
			}
			if(!this.settings.core.multiple || (!e.metaKey && !e.ctrlKey && !e.shiftKey) || (e.shiftKey && (!this._data.core.last_clicked || !this.get_parent(obj) || this.get_parent(obj) !== this._data.core.last_clicked.parent ) )) {
				if(!this.settings.core.multiple && (e.metaKey || e.ctrlKey || e.shiftKey) && this.is_selected(obj)) {
					this.deselect_node(obj, false, false, e);
				}
				else {
					this.deselect_all(true);
					this.select_node(obj, false, false, e);
					this._data.core.last_clicked = this.get_node(obj);
				}
			}
			else {
				if(e.shiftKey) {
					var o = this.get_node(obj).id,
						l = this._data.core.last_clicked.id,
						p = this.get_node(this._data.core.last_clicked.parent).children,
						c = false,
						i, j;
					for(i = 0, j = p.length; i < j; i += 1) {
						// separate IFs work whem o and l are the same
						if(p[i] === o) {
							c = !c;
						}
						if(p[i] === l) {
							c = !c;
						}
						if(c || p[i] === o || p[i] === l) {
							this.select_node(p[i], false, false, e);
						}
						else {
							this.deselect_node(p[i], false, false, e);
						}
					}
				}
				else {
					if(!this.is_selected(obj)) {
						this.select_node(obj, false, false, e);
					}
					else {
						this.deselect_node(obj, false, false, e);
					}
				}
			}
			/**
			 * triggered when an node is clicked or intercated with by the user
			 * @event
			 * @name activate_node.jstree
			 * @param {Object} node
			 */
			this.trigger('activate_node', { 'node' : this.get_node(obj) });
		},
		/**
		 * applies the hover state on a node, called when a node is hovered by the user. Used internally.
		 * @private
		 * @name hover_node(obj)
		 * @param {mixed} obj
		 * @trigger hover_node.jstree
		 */
		hover_node : function (obj) {
			obj = this.get_node(obj, true);
			if(!obj || !obj.length || obj.children('.jstree-hovered').length) {
				return false;
			}
			var o = this.element.find('.jstree-hovered'), t = this.element;
			if(o && o.length) { this.dehover_node(o); }

			obj.children('.jstree-anchor').addClass('jstree-hovered');
			/**
			 * triggered when an node is hovered
			 * @event
			 * @name hover_node.jstree
			 * @param {Object} node
			 */
			this.trigger('hover_node', { 'node' : this.get_node(obj) });
			setTimeout(function () { t.attr('aria-activedescendant', obj[0].id); obj.attr('aria-selected', true); }, 0);
		},
		/**
		 * removes the hover state from a nodecalled when a node is no longer hovered by the user. Used internally.
		 * @private
		 * @name dehover_node(obj)
		 * @param {mixed} obj
		 * @trigger dehover_node.jstree
		 */
		dehover_node : function (obj) {
			obj = this.get_node(obj, true);
			if(!obj || !obj.length || !obj.children('.jstree-hovered').length) {
				return false;
			}
			obj.attr('aria-selected', false).children('.jstree-anchor').removeClass('jstree-hovered');
			/**
			 * triggered when an node is no longer hovered
			 * @event
			 * @name dehover_node.jstree
			 * @param {Object} node
			 */
			this.trigger('dehover_node', { 'node' : this.get_node(obj) });
		},
		/**
		 * select a node
		 * @name select_node(obj [, supress_event, prevent_open])
		 * @param {mixed} obj an array can be used to select multiple nodes
		 * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
		 * @param {Boolean} prevent_open if set to `true` parents of the selected node won't be opened
		 * @trigger select_node.jstree, changed.jstree
		 */
		select_node : function (obj, supress_event, prevent_open, e) {
			var dom, t1, t2, th;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.select_node(obj[t1], supress_event, prevent_open, e);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			dom = this.get_node(obj, true);
			if(!obj.state.selected) {
				obj.state.selected = true;
				this._data.core.selected.push(obj.id);
				if(!prevent_open) {
					dom = this._open_to(obj);
				}
				if(dom && dom.length) {
					dom.children('.jstree-anchor').addClass('jstree-clicked');
				}
				/**
				 * triggered when an node is selected
				 * @event
				 * @name select_node.jstree
				 * @param {Object} node
				 * @param {Array} selected the current selection
				 * @param {Object} event the event (if any) that triggered this select_node
				 */
				this.trigger('select_node', { 'node' : obj, 'selected' : this._data.core.selected, 'event' : e });
				if(!supress_event) {
					/**
					 * triggered when selection changes
					 * @event
					 * @name changed.jstree
					 * @param {Object} node
					 * @param {Object} action the action that caused the selection to change
					 * @param {Array} selected the current selection
					 * @param {Object} event the event (if any) that triggered this changed event
					 */
					this.trigger('changed', { 'action' : 'select_node', 'node' : obj, 'selected' : this._data.core.selected, 'event' : e });
				}
			}
		},
		/**
		 * deselect a node
		 * @name deselect_node(obj [, supress_event])
		 * @param {mixed} obj an array can be used to deselect multiple nodes
		 * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
		 * @trigger deselect_node.jstree, changed.jstree
		 */
		deselect_node : function (obj, supress_event, e) {
			var t1, t2, dom;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.deselect_node(obj[t1], supress_event, e);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			dom = this.get_node(obj, true);
			if(obj.state.selected) {
				obj.state.selected = false;
				this._data.core.selected = $.vakata.array_remove_item(this._data.core.selected, obj.id);
				if(dom.length) {
					dom.children('.jstree-anchor').removeClass('jstree-clicked');
				}
				/**
				 * triggered when an node is deselected
				 * @event
				 * @name deselect_node.jstree
				 * @param {Object} node
				 * @param {Array} selected the current selection
				 * @param {Object} event the event (if any) that triggered this deselect_node
				 */
				this.trigger('deselect_node', { 'node' : obj, 'selected' : this._data.core.selected, 'event' : e });
				if(!supress_event) {
					this.trigger('changed', { 'action' : 'deselect_node', 'node' : obj, 'selected' : this._data.core.selected, 'event' : e });
				}
			}
		},
		/**
		 * select all nodes in the tree
		 * @name select_all([supress_event])
		 * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
		 * @trigger select_all.jstree, changed.jstree
		 */
		select_all : function (supress_event) {
			var tmp = this._data.core.selected.concat([]), i, j;
			this._data.core.selected = this._model.data['#'].children_d.concat();
			for(i = 0, j = this._data.core.selected.length; i < j; i++) {
				if(this._model.data[this._data.core.selected[i]]) {
					this._model.data[this._data.core.selected[i]].state.selected = true;
				}
			}
			this.redraw(true);
			/**
			 * triggered when all nodes are selected
			 * @event
			 * @name select_all.jstree
			 * @param {Array} selected the current selection
			 */
			this.trigger('select_all', { 'selected' : this._data.core.selected });
			if(!supress_event) {
				this.trigger('changed', { 'action' : 'select_all', 'selected' : this._data.core.selected, 'old_selection' : tmp });
			}
		},
		/**
		 * deselect all selected nodes
		 * @name deselect_all([supress_event])
		 * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
		 * @trigger deselect_all.jstree, changed.jstree
		 */
		deselect_all : function (supress_event) {
			var tmp = this._data.core.selected.concat([]), i, j;
			for(i = 0, j = this._data.core.selected.length; i < j; i++) {
				if(this._model.data[this._data.core.selected[i]]) {
					this._model.data[this._data.core.selected[i]].state.selected = false;
				}
			}
			this._data.core.selected = [];
			this.element.find('.jstree-clicked').removeClass('jstree-clicked');
			/**
			 * triggered when all nodes are deselected
			 * @event
			 * @name deselect_all.jstree
			 * @param {Object} node the previous selection
			 * @param {Array} selected the current selection
			 */
			this.trigger('deselect_all', { 'selected' : this._data.core.selected, 'node' : tmp });
			if(!supress_event) {
				this.trigger('changed', { 'action' : 'deselect_all', 'selected' : this._data.core.selected, 'old_selection' : tmp });
			}
		},
		/**
		 * checks if a node is selected
		 * @name is_selected(obj)
		 * @param  {mixed}  obj
		 * @return {Boolean}
		 */
		is_selected : function (obj) {
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			return obj.state.selected;
		},
		/**
		 * get an array of all selected node IDs
		 * @name get_selected([full])
		 * @param  {mixed}  full if set to `true` the returned array will consist of the full node objects, otherwise - only IDs will be returned
		 * @return {Array}
		 */
		get_selected : function (full) {
			return full ? $.map(this._data.core.selected, $.proxy(function (i) { return this.get_node(i); }, this)) : this._data.core.selected;
		},
		/**
		 * gets the current state of the tree so that it can be restored later with `set_state(state)`. Used internally.
		 * @name get_state()
		 * @private
		 * @return {Object}
		 */
		get_state : function () {
			var state	= {
				'core' : {
					'open' : [],
					'scroll' : {
						'left' : this.element.scrollLeft(),
						'top' : this.element.scrollTop()
					},
					/*!
					'themes' : {
						'name' : this.get_theme(),
						'icons' : this._data.core.themes.icons,
						'dots' : this._data.core.themes.dots
					},
					*/
					'selected' : []
				}
			}, i;
			for(i in this._model.data) {
				if(this._model.data.hasOwnProperty(i)) {
					if(i !== '#') {
						if(this._model.data[i].state.opened) {
							state.core.open.push(i);
						}
						if(this._model.data[i].state.selected) {
							state.core.selected.push(i);
						}
					}
				}
			}
			return state;
		},
		/**
		 * sets the state of the tree. Used internally.
		 * @name set_state(state [, callback])
		 * @private
		 * @param {Object} state the state to restore
		 * @param {Function} callback an optional function to execute once the state is restored.
		 * @trigger set_state.jstree
		 */
		set_state : function (state, callback) {
			if(state) {
				if(state.core) {
					var res, n, t, _this;
					if(state.core.open) {
						if(!$.isArray(state.core.open)) {
							delete state.core.open;
							this.set_state(state, callback);
							return false;
						}
						res = true;
						n = false;
						t = this;
						$.each(state.core.open.concat([]), function (i, v) {
							n = t.get_node(v);
							if(n) {
								if(t.is_loaded(v)) {
									if(t.is_closed(v)) {
										t.open_node(v, false, 0);
									}
									if(state && state.core && state.core.open) {
										$.vakata.array_remove_item(state.core.open, v);
									}
								}
								else {
									if(!t.is_loading(v)) {
										t.open_node(v, $.proxy(function () { this.set_state(state, callback); }, t), 0);
									}
									// there will be some async activity - so wait for it
									res = false;
								}
							}
						});
						if(res) {
							delete state.core.open;
							this.set_state(state, callback);
						}
						return false;
					}
					if(state.core.scroll) {
						if(state.core.scroll && state.core.scroll.left !== undefined) {
							this.element.scrollLeft(state.core.scroll.left);
						}
						if(state.core.scroll && state.core.scroll.top !== undefined) {
							this.element.scrollTop(state.core.scroll.top);
						}
						delete state.core.scroll;
						this.set_state(state, callback);
						return false;
					}
					/*!
					if(state.core.themes) {
						if(state.core.themes.name) {
							this.set_theme(state.core.themes.name);
						}
						if(typeof state.core.themes.dots !== 'undefined') {
							this[ state.core.themes.dots ? "show_dots" : "hide_dots" ]();
						}
						if(typeof state.core.themes.icons !== 'undefined') {
							this[ state.core.themes.icons ? "show_icons" : "hide_icons" ]();
						}
						delete state.core.themes;
						delete state.core.open;
						this.set_state(state, callback);
						return false;
					}
					*/
					if(state.core.selected) {
						_this = this;
						this.deselect_all();
						$.each(state.core.selected, function (i, v) {
							_this.select_node(v);
						});
						delete state.core.selected;
						this.set_state(state, callback);
						return false;
					}
					if($.isEmptyObject(state.core)) {
						delete state.core;
						this.set_state(state, callback);
						return false;
					}
				}
				if($.isEmptyObject(state)) {
					state = null;
					if(callback) { callback.call(this); }
					/**
					 * triggered when a `set_state` call completes
					 * @event
					 * @name set_state.jstree
					 */
					this.trigger('set_state');
					return false;
				}
				return true;
			}
			return false;
		},
		/**
		 * refreshes the tree - all nodes are reloaded with calls to `load_node`.
		 * @name refresh()
		 * @param {Boolean} skip_loading an option to skip showing the loading indicator
		 * @trigger refresh.jstree
		 */
		refresh : function (skip_loading) {
			this._data.core.state = this.get_state();
			this._cnt = 0;
			this._model.data = {
				'#' : {
					id : '#',
					parent : null,
					parents : [],
					children : [],
					children_d : [],
					state : { loaded : false }
				}
			};
			var c = this.get_container_ul()[0].className;
			if(!skip_loading) {
				this.element.html("<"+"ul class='jstree-container-ul'><"+"li class='jstree-initial-node jstree-loading jstree-leaf jstree-last'><i class='jstree-icon jstree-ocl'></i><"+"a class='jstree-anchor' href='#'><i class='jstree-icon jstree-themeicon-hidden'></i>" + this.get_string("Loading ...") + "</a></li></ul>");
			}
			this.load_node('#', function (o, s) {
				if(s) {
					this.get_container_ul()[0].className = c;
					this.set_state($.extend(true, {}, this._data.core.state), function () {
						/**
						 * triggered when a `refresh` call completes
						 * @event
						 * @name refresh.jstree
						 */
						this.trigger('refresh');
					});
				}
				this._data.core.state = null;
			});
		},
		/**
		 * set (change) the ID of a node
		 * @name set_id(obj, id)
		 * @param  {mixed} obj the node
		 * @param  {String} id the new ID
		 * @return {Boolean}
		 */
		set_id : function (obj, id) {
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			var i, j, m = this._model.data;
			// update parents (replace current ID with new one in children and children_d)
			m[obj.parent].children[$.inArray(obj.id, m[obj.parent].children)] = id;
			for(i = 0, j = obj.parents.length; i < j; i++) {
				m[obj.parents[i]].children_d[$.inArray(obj.id, m[obj.parents[i]].children_d)] = id;
			}
			// update children (replace current ID with new one in parent and parents)
			for(i = 0, j = obj.children.length; i < j; i++) {
				m[obj.children[i]].parent = id;
			}
			for(i = 0, j = obj.children_d.length; i < j; i++) {
				m[obj.children_d[i]].parents[$.inArray(obj.id, m[obj.children_d[i]].parents)] = id;
			}
			i = $.inArray(obj.id, this._data.core.selected);
			if(i !== -1) { this._data.core.selected[i] = id; }
			// update model and obj itself (obj.id, this._model.data[KEY])
			i = this.get_node(obj.id, true);
			if(i) {
				i.attr('id', id);
			}
			delete m[obj.id];
			obj.id = id;
			m[id] = obj;
			return true;
		},
		/**
		 * get the text value of a node
		 * @name get_text(obj)
		 * @param  {mixed} obj the node
		 * @return {String}
		 */
		get_text : function (obj) {
			obj = this.get_node(obj);
			return (!obj || obj.id === '#') ? false : obj.text;
		},
		/**
		 * set the text value of a node. Used internally, please use `rename_node(obj, val)`.
		 * @private
		 * @name set_text(obj, val)
		 * @param  {mixed} obj the node, you can pass an array to set the text on multiple nodes
		 * @param  {String} val the new text value
		 * @return {Boolean}
		 * @trigger set_text.jstree
		 */
		set_text : function (obj, val) {
			var t1, t2, dom, tmp;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.set_text(obj[t1], val);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			obj.text = val;
			dom = this.get_node(obj, true);
			if(dom.length) {
				dom = dom.children(".jstree-anchor:eq(0)");
				tmp = dom.children("I").clone();
				dom.html(val).prepend(tmp);
				/**
				 * triggered when a node text value is changed
				 * @event
				 * @name set_text.jstree
				 * @param {Object} obj
				 * @param {String} text the new value
				 */
				this.trigger('set_text',{ "obj" : obj, "text" : val });
			}
			return true;
		},
		/**
		 * gets a JSON representation of a node (or the whole tree)
		 * @name get_json([obj, options])
		 * @param  {mixed} obj
		 * @param  {Object} options
		 * @param  {Boolean} options.no_state do not return state information
		 * @param  {Boolean} options.no_id do not return ID
		 * @param  {Boolean} options.no_children do not include children
		 * @param  {Boolean} options.no_data do not include node data
		 * @param  {Boolean} options.flat return flat JSON instead of nested
		 * @return {Object}
		 */
		get_json : function (obj, options, flat) {
			obj = this.get_node(obj || '#');
			if(!obj) { return false; }
			if(options && options.flat && !flat) { flat = []; }
			var tmp = {
				'id' : obj.id,
				'text' : obj.text,
				'icon' : this.get_icon(obj),
				'li_attr' : obj.li_attr,
				'a_attr' : obj.a_attr,
				'state' : {},
				'data' : options && options.no_data ? false : obj.data
				//( this.get_node(obj, true).length ? this.get_node(obj, true).data() : obj.data ),
			}, i, j;
			if(options && options.flat) {
				tmp.parent = obj.parent;
			}
			else {
				tmp.children = [];
			}
			if(!options || !options.no_state) {
				for(i in obj.state) {
					if(obj.state.hasOwnProperty(i)) {
						tmp.state[i] = obj.state[i];
					}
				}
			}
			if(options && options.no_id) {
				delete tmp.id;
				if(tmp.li_attr && tmp.li_attr.id) {
					delete tmp.li_attr.id;
				}
			}
			if(options && options.flat && obj.id !== '#') {
				flat.push(tmp);
			}
			if(!options || !options.no_children) {
				for(i = 0, j = obj.children.length; i < j; i++) {
					if(options && options.flat) {
						this.get_json(obj.children[i], options, flat);
					}
					else {
						tmp.children.push(this.get_json(obj.children[i], options));
					}
				}
			}
			return options && options.flat ? flat : (obj.id === '#' ? tmp.children : tmp);
		},
		/**
		 * create a new node (do not confuse with load_node)
		 * @name create_node([obj, node, pos, callback, is_loaded])
		 * @param  {mixed}   par       the parent node
		 * @param  {mixed}   node      the data for the new node (a valid JSON object, or a simple string with the name)
		 * @param  {mixed}   pos       the index at which to insert the node, "first" and "last" are also supported, default is "last"
		 * @param  {Function} callback a function to be called once the node is created
		 * @param  {Boolean} is_loaded internal argument indicating if the parent node was succesfully loaded
		 * @return {String}            the ID of the newly create node
		 * @trigger model.jstree, create_node.jstree
		 */
		create_node : function (par, node, pos, callback, is_loaded) {
			par = this.get_node(par);
			if(!par) { return false; }
			pos = pos === undefined ? "last" : pos;
			if(!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
				return this.load_node(par, function () { this.create_node(par, node, pos, callback, true); });
			}
			if(!node) { node = { "text" : this.get_string('New node') }; }
			if(node.text === undefined) { node.text = this.get_string('New node'); }
			var tmp, dpc, i, j;

			if(par.id === '#') {
				if(pos === "before") { pos = "first"; }
				if(pos === "after") { pos = "last"; }
			}
			switch(pos) {
				case "before":
					tmp = this.get_node(par.parent);
					pos = $.inArray(par.id, tmp.children);
					par = tmp;
					break;
				case "after" :
					tmp = this.get_node(par.parent);
					pos = $.inArray(par.id, tmp.children) + 1;
					par = tmp;
					break;
				case "inside":
				case "first":
					pos = 0;
					break;
				case "last":
					pos = par.children.length;
					break;
				default:
					if(!pos) { pos = 0; }
					break;
			}
			if(pos > par.children.length) { pos = par.children.length; }
			if(!node.id) { node.id = true; }
			if(!this.check("create_node", node, par, pos)) {
				this.settings.core.error.call(this, this._data.core.last_error);
				return false;
			}
			if(node.id === true) { delete node.id; }
			node = this._parse_model_from_json(node, par.id, par.parents.concat());
			if(!node) { return false; }
			tmp = this.get_node(node);
			dpc = [];
			dpc.push(node);
			dpc = dpc.concat(tmp.children_d);
			this.trigger('model', { "nodes" : dpc, "parent" : par.id });

			par.children_d = par.children_d.concat(dpc);
			for(i = 0, j = par.parents.length; i < j; i++) {
				this._model.data[par.parents[i]].children_d = this._model.data[par.parents[i]].children_d.concat(dpc);
			}
			node = tmp;
			tmp = [];
			for(i = 0, j = par.children.length; i < j; i++) {
				tmp[i >= pos ? i+1 : i] = par.children[i];
			}
			tmp[pos] = node.id;
			par.children = tmp;

			this.redraw_node(par, true);
			if(callback) { callback.call(this, this.get_node(node)); }
			/**
			 * triggered when a node is created
			 * @event
			 * @name create_node.jstree
			 * @param {Object} node
			 * @param {String} parent the parent's ID
			 * @param {Number} position the position of the new node among the parent's children
			 */
			this.trigger('create_node', { "node" : this.get_node(node), "parent" : par.id, "position" : pos });
			return node.id;
		},
		/**
		 * set the text value of a node
		 * @name rename_node(obj, val)
		 * @param  {mixed} obj the node, you can pass an array to rename multiple nodes to the same name
		 * @param  {String} val the new text value
		 * @return {Boolean}
		 * @trigger rename_node.jstree
		 */
		rename_node : function (obj, val) {
			var t1, t2, old;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.rename_node(obj[t1], val);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			old = obj.text;
			if(!this.check("rename_node", obj, this.get_parent(obj), val)) {
				this.settings.core.error.call(this, this._data.core.last_error);
				return false;
			}
			this.set_text(obj, val); // .apply(this, Array.prototype.slice.call(arguments))
			/**
			 * triggered when a node is renamed
			 * @event
			 * @name rename_node.jstree
			 * @param {Object} node
			 * @param {String} text the new value
			 * @param {String} old the old value
			 */
			this.trigger('rename_node', { "node" : obj, "text" : val, "old" : old });
			return true;
		},
		/**
		 * remove a node
		 * @name delete_node(obj)
		 * @param  {mixed} obj the node, you can pass an array to delete multiple nodes
		 * @return {Boolean}
		 * @trigger delete_node.jstree, changed.jstree
		 */
		delete_node : function (obj) {
			var t1, t2, par, pos, tmp, i, j, k, l, c;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.delete_node(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			par = this.get_node(obj.parent);
			pos = $.inArray(obj.id, par.children);
			c = false;
			if(!this.check("delete_node", obj, par, pos)) {
				this.settings.core.error.call(this, this._data.core.last_error);
				return false;
			}
			if(pos !== -1) {
				par.children = $.vakata.array_remove(par.children, pos);
			}
			tmp = obj.children_d.concat([]);
			tmp.push(obj.id);
			for(k = 0, l = tmp.length; k < l; k++) {
				for(i = 0, j = obj.parents.length; i < j; i++) {
					pos = $.inArray(tmp[k], this._model.data[obj.parents[i]].children_d);
					if(pos !== -1) {
						this._model.data[obj.parents[i]].children_d = $.vakata.array_remove(this._model.data[obj.parents[i]].children_d, pos);
					}
				}
				if(this._model.data[tmp[k]].state.selected) {
					c = true;
					pos = $.inArray(tmp[k], this._data.core.selected);
					if(pos !== -1) {
						this._data.core.selected = $.vakata.array_remove(this._data.core.selected, pos);
					}
				}
			}
			/**
			 * triggered when a node is deleted
			 * @event
			 * @name delete_node.jstree
			 * @param {Object} node
			 * @param {String} parent the parent's ID
			 */
			this.trigger('delete_node', { "node" : obj, "parent" : par.id });
			if(c) {
				this.trigger('changed', { 'action' : 'delete_node', 'node' : obj, 'selected' : this._data.core.selected, 'parent' : par.id });
			}
			for(k = 0, l = tmp.length; k < l; k++) {
				delete this._model.data[tmp[k]];
			}
			this.redraw_node(par, true);
			return true;
		},
		/**
		 * check if an operation is premitted on the tree. Used internally.
		 * @private
		 * @name check(chk, obj, par, pos)
		 * @param  {String} chk the operation to check, can be "create_node", "rename_node", "delete_node", "copy_node" or "move_node"
		 * @param  {mixed} obj the node
		 * @param  {mixed} par the parent
		 * @param  {mixed} pos the position to insert at, or if "rename_node" - the new name
		 * @return {Boolean}
		 */
		check : function (chk, obj, par, pos) {
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = par && par.id ? par : this.get_node(par);
			var tmp = chk.match(/^move_node|copy_node|create_node$/i) ? par : obj,
				chc = this.settings.core.check_callback;
			if(chk === "move_node") {
				if(obj.id === par.id || $.inArray(obj.id, par.children) === pos || $.inArray(par.id, obj.children_d) !== -1) {
					this._data.core.last_error = { 'error' : 'check', 'plugin' : 'core', 'id' : 'core_01', 'reason' : 'Moving parent inside child', 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
					return false;
				}
			}
			tmp = this.get_node(tmp, true);
			if(tmp.length) { tmp = tmp.data('jstree'); }
			if(tmp && tmp.functions && (tmp.functions[chk] === false || tmp.functions[chk] === true)) {
				if(tmp.functions[chk] === false) {
					this._data.core.last_error = { 'error' : 'check', 'plugin' : 'core', 'id' : 'core_02', 'reason' : 'Node data prevents function: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
				}
				return tmp.functions[chk];
			}
			if(chc === false || ($.isFunction(chc) && chc.call(this, chk, obj, par, pos) === false) || (chc && chc[chk] === false)) {
				this._data.core.last_error = { 'error' : 'check', 'plugin' : 'core', 'id' : 'core_03', 'reason' : 'User config for core.check_callback prevents function: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
				return false;
			}
			return true;
		},
		/**
		 * get the last error
		 * @name last_error()
		 * @return {Object}
		 */
		last_error : function () {
			return this._data.core.last_error;
		},
		/**
		 * move a node to a new parent
		 * @name move_node(obj, par [, pos, callback, is_loaded])
		 * @param  {mixed} obj the node to move, pass an array to move multiple nodes
		 * @param  {mixed} par the new parent
		 * @param  {mixed} pos the position to insert at ("first" and "last" are supported, as well as "before" and "after"), defaults to `0`
		 * @param  {function} callback a function to call once the move is completed, receives 3 arguments - the node, the new parent and the position
		 * @param  {Boolean} internal parameter indicating if the parent node has been loaded
		 * @trigger move_node.jstree
		 */
		move_node : function (obj, par, pos, callback, is_loaded) {
			var t1, t2, old_par, new_par, old_ins, is_multi, dpc, tmp, i, j, k, l, p;
			if($.isArray(obj)) {
				obj = obj.reverse().slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.move_node(obj[t1], par, pos, callback, is_loaded);
				}
				return true;
			}
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = this.get_node(par);
			pos = pos === undefined ? 0 : pos;

			if(!par || !obj || obj.id === '#') { return false; }
			if(!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
				return this.load_node(par, function () { this.move_node(obj, par, pos, callback, true); });
			}

			old_par = (obj.parent || '#').toString();
			new_par = (!pos.toString().match(/^(before|after)$/) || par.id === '#') ? par : this.get_node(par.parent);
			old_ins = this._model.data[obj.id] ? this : $.jstree.reference(obj.id);
			is_multi = !old_ins || !old_ins._id || (this._id !== old_ins._id);
			if(is_multi) {
				if(this.copy_node(obj, par, pos, callback, is_loaded)) {
					if(old_ins) { old_ins.delete_node(obj); }
					return true;
				}
				return false;
			}
			//var m = this._model.data;
			if(new_par.id === '#') {
				if(pos === "before") { pos = "first"; }
				if(pos === "after") { pos = "last"; }
			}
			switch(pos) {
				case "before":
					pos = $.inArray(par.id, new_par.children);
					break;
				case "after" :
					pos = $.inArray(par.id, new_par.children) + 1;
					break;
				case "inside":
				case "first":
					pos = 0;
					break;
				case "last":
					pos = new_par.children.length;
					break;
				default:
					if(!pos) { pos = 0; }
					break;
			}
			if(pos > new_par.children.length) { pos = new_par.children.length; }
			if(!this.check("move_node", obj, new_par, pos)) {
				this.settings.core.error.call(this, this._data.core.last_error);
				return false;
			}
			if(obj.parent === new_par.id) {
				dpc = new_par.children.concat();
				tmp = $.inArray(obj.id, dpc);
				if(tmp !== -1) {
					dpc = $.vakata.array_remove(dpc, tmp);
					if(pos > tmp) { pos--; }
				}
				tmp = [];
				for(i = 0, j = dpc.length; i < j; i++) {
					tmp[i >= pos ? i+1 : i] = dpc[i];
				}
				tmp[pos] = obj.id;
				new_par.children = tmp;
				this._node_changed(new_par.id);
				this.redraw(new_par.id === '#');
			}
			else {
				// clean old parent and up
				tmp = obj.children_d.concat();
				tmp.push(obj.id);
				for(i = 0, j = obj.parents.length; i < j; i++) {
					dpc = [];
					p = old_ins._model.data[obj.parents[i]].children_d;
					for(k = 0, l = p.length; k < l; k++) {
						if($.inArray(p[k], tmp) === -1) {
							dpc.push(p[k]);
						}
					}
					old_ins._model.data[obj.parents[i]].children_d = dpc;
				}
				old_ins._model.data[old_par].children = $.vakata.array_remove_item(old_ins._model.data[old_par].children, obj.id);

				// insert into new parent and up
				for(i = 0, j = new_par.parents.length; i < j; i++) {
					this._model.data[new_par.parents[i]].children_d = this._model.data[new_par.parents[i]].children_d.concat(tmp);
				}
				dpc = [];
				for(i = 0, j = new_par.children.length; i < j; i++) {
					dpc[i >= pos ? i+1 : i] = new_par.children[i];
				}
				dpc[pos] = obj.id;
				new_par.children = dpc;
				new_par.children_d.push(obj.id);
				new_par.children_d = new_par.children_d.concat(obj.children_d);

				// update object
				obj.parent = new_par.id;
				tmp = new_par.parents.concat();
				tmp.unshift(new_par.id);
				p = obj.parents.length;
				obj.parents = tmp;

				// update object children
				tmp = tmp.concat();
				for(i = 0, j = obj.children_d.length; i < j; i++) {
					this._model.data[obj.children_d[i]].parents = this._model.data[obj.children_d[i]].parents.slice(0,p*-1);
					Array.prototype.push.apply(this._model.data[obj.children_d[i]].parents, tmp);
				}

				this._node_changed(old_par);
				this._node_changed(new_par.id);
				this.redraw(old_par === '#' || new_par.id === '#');
			}
			if(callback) { callback.call(this, obj, new_par, pos); }
			/**
			 * triggered when a node is moved
			 * @event
			 * @name move_node.jstree
			 * @param {Object} node
			 * @param {String} parent the parent's ID
			 * @param {Number} position the position of the node among the parent's children
			 * @param {String} old_parent the old parent of the node
			 * @param {Boolean} is_multi do the node and new parent belong to different instances
			 * @param {jsTree} old_instance the instance the node came from
			 * @param {jsTree} new_instance the instance of the new parent
			 */
			this.trigger('move_node', { "node" : obj, "parent" : new_par.id, "position" : pos, "old_parent" : old_par, "is_multi" : is_multi, 'old_instance' : old_ins, 'new_instance' : this });
			return true;
		},
		/**
		 * copy a node to a new parent
		 * @name copy_node(obj, par [, pos, callback, is_loaded])
		 * @param  {mixed} obj the node to copy, pass an array to copy multiple nodes
		 * @param  {mixed} par the new parent
		 * @param  {mixed} pos the position to insert at ("first" and "last" are supported, as well as "before" and "after"), defaults to `0`
		 * @param  {function} callback a function to call once the move is completed, receives 3 arguments - the node, the new parent and the position
		 * @param  {Boolean} internal parameter indicating if the parent node has been loaded
		 * @trigger model.jstree copy_node.jstree
		 */
		copy_node : function (obj, par, pos, callback, is_loaded) {
			var t1, t2, dpc, tmp, i, j, node, old_par, new_par, old_ins, is_multi;
			if($.isArray(obj)) {
				obj = obj.reverse().slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.copy_node(obj[t1], par, pos, callback, is_loaded);
				}
				return true;
			}
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = this.get_node(par);
			pos = pos === undefined ? 0 : pos;

			if(!par || !obj || obj.id === '#') { return false; }
			if(!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
				return this.load_node(par, function () { this.copy_node(obj, par, pos, callback, true); });
			}

			old_par = (obj.parent || '#').toString();
			new_par = (!pos.toString().match(/^(before|after)$/) || par.id === '#') ? par : this.get_node(par.parent);
			old_ins = this._model.data[obj.id] ? this : $.jstree.reference(obj.id);
			is_multi = !old_ins || !old_ins._id || (this._id !== old_ins._id);
			if(new_par.id === '#') {
				if(pos === "before") { pos = "first"; }
				if(pos === "after") { pos = "last"; }
			}
			switch(pos) {
				case "before":
					pos = $.inArray(par.id, new_par.children);
					break;
				case "after" :
					pos = $.inArray(par.id, new_par.children) + 1;
					break;
				case "inside":
				case "first":
					pos = 0;
					break;
				case "last":
					pos = new_par.children.length;
					break;
				default:
					if(!pos) { pos = 0; }
					break;
			}
			if(pos > new_par.children.length) { pos = new_par.children.length; }
			if(!this.check("copy_node", obj, new_par, pos)) {
				this.settings.core.error.call(this, this._data.core.last_error);
				return false;
			}
			node = old_ins ? old_ins.get_json(obj, { no_id : true, no_data : true, no_state : true }) : obj;
			if(!node) { return false; }
			if(node.id === true) { delete node.id; }
			node = this._parse_model_from_json(node, new_par.id, new_par.parents.concat());
			if(!node) { return false; }
			tmp = this.get_node(node);
			dpc = [];
			dpc.push(node);
			dpc = dpc.concat(tmp.children_d);
			this.trigger('model', { "nodes" : dpc, "parent" : new_par.id });

			// insert into new parent and up
			for(i = 0, j = new_par.parents.length; i < j; i++) {
				this._model.data[new_par.parents[i]].children_d = this._model.data[new_par.parents[i]].children_d.concat(dpc);
			}
			dpc = [];
			for(i = 0, j = new_par.children.length; i < j; i++) {
				dpc[i >= pos ? i+1 : i] = new_par.children[i];
			}
			dpc[pos] = tmp.id;
			new_par.children = dpc;
			new_par.children_d.push(tmp.id);
			new_par.children_d = new_par.children_d.concat(tmp.children_d);

			this._node_changed(new_par.id);
			this.redraw(new_par.id === '#');
			if(callback) { callback.call(this, tmp, new_par, pos); }
			/**
			 * triggered when a node is copied
			 * @event
			 * @name copy_node.jstree
			 * @param {Object} node the copied node
			 * @param {Object} original the original node
			 * @param {String} parent the parent's ID
			 * @param {Number} position the position of the node among the parent's children
			 * @param {String} old_parent the old parent of the node
			 * @param {Boolean} is_multi do the node and new parent belong to different instances
			 * @param {jsTree} old_instance the instance the node came from
			 * @param {jsTree} new_instance the instance of the new parent
			 */
			this.trigger('copy_node', { "node" : tmp, "original" : obj, "parent" : new_par.id, "position" : pos, "old_parent" : old_par, "is_multi" : is_multi, 'old_instance' : old_ins, 'new_instance' : this });
			return tmp.id;
		},
		/**
		 * cut a node (a later call to `paste(obj)` would move the node)
		 * @name cut(obj)
		 * @param  {mixed} obj multiple objects can be passed using an array
		 * @trigger cut.jstree
		 */
		cut : function (obj) {
			if(!obj) { obj = this._data.core.selected.concat(); }
			if(!$.isArray(obj)) { obj = [obj]; }
			if(!obj.length) { return false; }
			var tmp = [], o, t1, t2;
			for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
				o = this.get_node(obj[t1]);
				if(o && o.id && o.id !== '#') { tmp.push(o); }
			}
			if(!tmp.length) { return false; }
			ccp_node = tmp;
			ccp_inst = this;
			ccp_mode = 'move_node';
			/**
			 * triggered when nodes are added to the buffer for moving
			 * @event
			 * @name cut.jstree
			 * @param {Array} node
			 */
			this.trigger('cut', { "node" : obj });
		},
		/**
		 * copy a node (a later call to `paste(obj)` would copy the node)
		 * @name copy(obj)
		 * @param  {mixed} obj multiple objects can be passed using an array
		 * @trigger copy.jstre
		 */
		copy : function (obj) {
			if(!obj) { obj = this._data.core.selected.concat(); }
			if(!$.isArray(obj)) { obj = [obj]; }
			if(!obj.length) { return false; }
			var tmp = [], o, t1, t2;
			for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
				o = this.get_node(obj[t1]);
				if(o && o.id && o.id !== '#') { tmp.push(o); }
			}
			if(!tmp.length) { return false; }
			ccp_node = tmp;
			ccp_inst = this;
			ccp_mode = 'copy_node';
			/**
			 * triggered when nodes are added to the buffer for copying
			 * @event
			 * @name copy.jstree
			 * @param {Array} node
			 */
			this.trigger('copy', { "node" : obj });
		},
		/**
		 * get the current buffer (any nodes that are waiting for a paste operation)
		 * @name get_buffer()
		 * @return {Object} an object consisting of `mode` ("copy_node" or "move_node"), `node` (an array of objects) and `inst` (the instance)
		 */
		get_buffer : function () {
			return { 'mode' : ccp_mode, 'node' : ccp_node, 'inst' : ccp_inst };
		},
		/**
		 * check if there is something in the buffer to paste
		 * @name can_paste()
		 * @return {Boolean}
		 */
		can_paste : function () {
			return ccp_mode !== false && ccp_node !== false; // && ccp_inst._model.data[ccp_node];
		},
		/**
		 * copy or move the previously cut or copied nodes to a new parent
		 * @name paste(obj)
		 * @param  {mixed} obj the new parent
		 * @trigger paste.jstree
		 */
		paste : function (obj) {
			obj = this.get_node(obj);
			if(!obj || !ccp_mode || !ccp_mode.match(/^(copy_node|move_node)$/) || !ccp_node) { return false; }
			if(this[ccp_mode](ccp_node, obj)) {
				/**
				 * triggered when paste is invoked
				 * @event
				 * @name paste.jstree
				 * @param {String} parent the ID of the receiving node
				 * @param {Array} node the nodes in the buffer
				 * @param {String} mode the performed operation - "copy_node" or "move_node"
				 */
				this.trigger('paste', { "parent" : obj.id, "node" : ccp_node, "mode" : ccp_mode });
			}
			ccp_node = false;
			ccp_mode = false;
			ccp_inst = false;
		},
		/**
		 * put a node in edit mode (input field to rename the node)
		 * @name edit(obj [, default_text])
		 * @param  {mixed} obj
		 * @param  {String} default_text the text to populate the input with (if omitted the node text value is used)
		 */
		edit : function (obj, default_text) {
			obj = this._open_to(obj);
			if(!obj || !obj.length) { return false; }
			var rtl = this._data.core.rtl,
				w  = this.element.width(),
				a  = obj.children('.jstree-anchor'),
				s  = $('<span>'),
				/*!
				oi = obj.children("i:visible"),
				ai = a.children("i:visible"),
				w1 = oi.width() * oi.length,
				w2 = ai.width() * ai.length,
				*/
				t  = typeof default_text === 'string' ? default_text : this.get_text(obj),
				h1 = $("<"+"div />", { css : { "position" : "absolute", "top" : "-200px", "left" : (rtl ? "0px" : "-1000px"), "visibility" : "hidden" } }).appendTo("body"),
				h2 = $("<"+"input />", {
						"value" : t,
						"class" : "jstree-rename-input",
						// "size" : t.length,
						"css" : {
							"padding" : "0",
							"border" : "1px solid silver",
							"box-sizing" : "border-box",
							"display" : "inline-block",
							"height" : (this._data.core.li_height) + "px",
							"lineHeight" : (this._data.core.li_height) + "px",
							"width" : "150px" // will be set a bit further down
						},
						"blur" : $.proxy(function () {
							var i = s.children(".jstree-rename-input"),
								v = i.val();
							if(v === "") { v = t; }
							h1.remove();
							s.replaceWith(a);
							s.remove();
							this.set_text(obj, t);
							if(this.rename_node(obj, v) === false) {
								this.set_text(obj, t); // move this up? and fix #483
							}
						}, this),
						"keydown" : function (event) {
							var key = event.which;
							if(key === 27) {
								this.value = t;
							}
							if(key === 27 || key === 13 || key === 37 || key === 38 || key === 39 || key === 40 || key === 32) {
								event.stopImmediatePropagation();
							}
							if(key === 27 || key === 13) {
								event.preventDefault();
								this.blur();
							}
						},
						"click" : function (e) { e.stopImmediatePropagation(); },
						"mousedown" : function (e) { e.stopImmediatePropagation(); },
						"keyup" : function (event) {
							h2.width(Math.min(h1.text("pW" + this.value).width(),w));
						},
						"keypress" : function(event) {
							if(event.which === 13) { return false; }
						}
					}),
				fn = {
						fontFamily		: a.css('fontFamily')		|| '',
						fontSize		: a.css('fontSize')			|| '',
						fontWeight		: a.css('fontWeight')		|| '',
						fontStyle		: a.css('fontStyle')		|| '',
						fontStretch		: a.css('fontStretch')		|| '',
						fontVariant		: a.css('fontVariant')		|| '',
						letterSpacing	: a.css('letterSpacing')	|| '',
						wordSpacing		: a.css('wordSpacing')		|| ''
				};
			this.set_text(obj, "");
			s.attr('class', a.attr('class')).append(a.contents().clone()).append(h2);
			a.replaceWith(s);
			h1.css(fn);
			h2.css(fn).width(Math.min(h1.text("pW" + h2[0].value).width(),w))[0].select();
		},


		/**
		 * changes the theme
		 * @name set_theme(theme_name [, theme_url])
		 * @param {String} theme_name the name of the new theme to apply
		 * @param {mixed} theme_url  the location of the CSS file for this theme. Omit or set to `false` if you manually included the file. Set to `true` to autoload from the `core.themes.dir` directory.
		 * @trigger set_theme.jstree
		 */
		set_theme : function (theme_name, theme_url) {
			if(!theme_name) { return false; }
			if(theme_url === true) {
				var dir = this.settings.core.themes.dir;
				if(!dir) { dir = $.jstree.path + '/themes'; }
				theme_url = dir + '/' + theme_name + '/style.css';
			}
			if(theme_url && $.inArray(theme_url, themes_loaded) === -1) {
				$('head').append('<'+'link rel="stylesheet" href="' + theme_url + '" type="text/css" />');
				themes_loaded.push(theme_url);
			}
			if(this._data.core.themes.name) {
				this.element.removeClass('jstree-' + this._data.core.themes.name);
			}
			this._data.core.themes.name = theme_name;
			this.element.addClass('jstree-' + theme_name);
			this.element[this.settings.core.themes.responsive ? 'addClass' : 'removeClass' ]('jstree-' + theme_name + '-responsive');
			/**
			 * triggered when a theme is set
			 * @event
			 * @name set_theme.jstree
			 * @param {String} theme the new theme
			 */
			this.trigger('set_theme', { 'theme' : theme_name });
		},
		/**
		 * gets the name of the currently applied theme name
		 * @name get_theme()
		 * @return {String}
		 */
		get_theme : function () { return this._data.core.themes.name; },
		/**
		 * changes the theme variant (if the theme has variants)
		 * @name set_theme_variant(variant_name)
		 * @param {String|Boolean} variant_name the variant to apply (if `false` is used the current variant is removed)
		 */
		set_theme_variant : function (variant_name) {
			if(this._data.core.themes.variant) {
				this.element.removeClass('jstree-' + this._data.core.themes.name + '-' + this._data.core.themes.variant);
			}
			this._data.core.themes.variant = variant_name;
			if(variant_name) {
				this.element.addClass('jstree-' + this._data.core.themes.name + '-' + this._data.core.themes.variant);
			}
		},
		/**
		 * gets the name of the currently applied theme variant
		 * @name get_theme()
		 * @return {String}
		 */
		get_theme_variant : function () { return this._data.core.themes.variant; },
		/**
		 * shows a striped background on the container (if the theme supports it)
		 * @name show_stripes()
		 */
		show_stripes : function () { this._data.core.themes.stripes = true; this.get_container_ul().addClass("jstree-striped"); },
		/**
		 * hides the striped background on the container
		 * @name hide_stripes()
		 */
		hide_stripes : function () { this._data.core.themes.stripes = false; this.get_container_ul().removeClass("jstree-striped"); },
		/**
		 * toggles the striped background on the container
		 * @name toggle_stripes()
		 */
		toggle_stripes : function () { if(this._data.core.themes.stripes) { this.hide_stripes(); } else { this.show_stripes(); } },
		/**
		 * shows the connecting dots (if the theme supports it)
		 * @name show_dots()
		 */
		show_dots : function () { this._data.core.themes.dots = true; this.get_container_ul().removeClass("jstree-no-dots"); },
		/**
		 * hides the connecting dots
		 * @name hide_dots()
		 */
		hide_dots : function () { this._data.core.themes.dots = false; this.get_container_ul().addClass("jstree-no-dots"); },
		/**
		 * toggles the connecting dots
		 * @name toggle_dots()
		 */
		toggle_dots : function () { if(this._data.core.themes.dots) { this.hide_dots(); } else { this.show_dots(); } },
		/**
		 * show the node icons
		 * @name show_icons()
		 */
		show_icons : function () { this._data.core.themes.icons = true; this.get_container_ul().removeClass("jstree-no-icons"); },
		/**
		 * hide the node icons
		 * @name hide_icons()
		 */
		hide_icons : function () { this._data.core.themes.icons = false; this.get_container_ul().addClass("jstree-no-icons"); },
		/**
		 * toggle the node icons
		 * @name toggle_icons()
		 */
		toggle_icons : function () { if(this._data.core.themes.icons) { this.hide_icons(); } else { this.show_icons(); } },
		/**
		 * set the node icon for a node
		 * @name set_icon(obj, icon)
		 * @param {mixed} obj
		 * @param {String} icon the new icon - can be a path to an icon or a className, if using an image that is in the current directory use a `./` prefix, otherwise it will be detected as a class
		 */
		set_icon : function (obj, icon) {
			var t1, t2, dom, old;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.set_icon(obj[t1], icon);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			old = obj.icon;
			obj.icon = icon;
			dom = this.get_node(obj, true).children(".jstree-anchor").children(".jstree-themeicon");
			if(icon === false) {
				this.hide_icon(obj);
			}
			else if(icon === true) {
				dom.removeClass('jstree-themeicon-custom ' + old).css("background","").removeAttr("rel");
			}
			else if(icon.indexOf("/") === -1 && icon.indexOf(".") === -1) {
				dom.removeClass(old).css("background","");
				dom.addClass(icon + ' jstree-themeicon-custom').attr("rel",icon);
			}
			else {
				dom.removeClass(old).css("background","");
				dom.addClass('jstree-themeicon-custom').css("background", "url('" + icon + "') center center no-repeat").attr("rel",icon);
			}
			return true;
		},
		/**
		 * get the node icon for a node
		 * @name get_icon(obj)
		 * @param {mixed} obj
		 * @return {String}
		 */
		get_icon : function (obj) {
			obj = this.get_node(obj);
			return (!obj || obj.id === '#') ? false : obj.icon;
		},
		/**
		 * hide the icon on an individual node
		 * @name hide_icon(obj)
		 * @param {mixed} obj
		 */
		hide_icon : function (obj) {
			var t1, t2;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.hide_icon(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj === '#') { return false; }
			obj.icon = false;
			this.get_node(obj, true).children("a").children(".jstree-themeicon").addClass('jstree-themeicon-hidden');
			return true;
		},
		/**
		 * show the icon on an individual node
		 * @name show_icon(obj)
		 * @param {mixed} obj
		 */
		show_icon : function (obj) {
			var t1, t2, dom;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.show_icon(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj === '#') { return false; }
			dom = this.get_node(obj, true);
			obj.icon = dom.length ? dom.children("a").children(".jstree-themeicon").attr('rel') : true;
			if(!obj.icon) { obj.icon = true; }
			dom.children("a").children(".jstree-themeicon").removeClass('jstree-themeicon-hidden');
			return true;
		}
	};

	// helpers
	$.vakata = {};
	// reverse
	$.fn.vakata_reverse = [].reverse;
	// collect attributes
	$.vakata.attributes = function(node, with_values) {
		node = $(node)[0];
		var attr = with_values ? {} : [];
		if(node && node.attributes) {
			$.each(node.attributes, function (i, v) {
				if($.inArray(v.nodeName.toLowerCase(),['style','contenteditable','hasfocus','tabindex']) !== -1) { return; }
				if(v.nodeValue !== null && $.trim(v.nodeValue) !== '') {
					if(with_values) { attr[v.nodeName] = v.nodeValue; }
					else { attr.push(v.nodeName); }
				}
			});
		}
		return attr;
	};
	$.vakata.array_unique = function(array) {
		var a = [], i, j, l;
		for(i = 0, l = array.length; i < l; i++) {
			for(j = 0; j <= i; j++) {
				if(array[i] === array[j]) {
					break;
				}
			}
			if(j === i) { a.push(array[i]); }
		}
		return a;
	};
	// remove item from array
	$.vakata.array_remove = function(array, from, to) {
		var rest = array.slice((to || from) + 1 || array.length);
		array.length = from < 0 ? array.length + from : from;
		array.push.apply(array, rest);
		return array;
	};
	// remove item from array
	$.vakata.array_remove_item = function(array, item) {
		var tmp = $.inArray(item, array);
		return tmp !== -1 ? $.vakata.array_remove(array, tmp) : array;
	};
	// browser sniffing
	(function () {
		var browser = {},
			b_match = function(ua) {
			ua = ua.toLowerCase();

			var match =	/(chrome)[ \/]([\w.]+)/.exec( ua ) ||
						/(webkit)[ \/]([\w.]+)/.exec( ua ) ||
						/(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
						/(msie) ([\w.]+)/.exec( ua ) ||
						(ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua )) ||
						[];
				return {
					browser: match[1] || "",
					version: match[2] || "0"
				};
			},
			matched = b_match(window.navigator.userAgent);
		if(matched.browser) {
			browser[ matched.browser ] = true;
			browser.version = matched.version;
		}
		if(browser.chrome) {
			browser.webkit = true;
		}
		else if(browser.webkit) {
			browser.safari = true;
		}
		$.vakata.browser = browser;
	}());
	if($.vakata.browser.msie && $.vakata.browser.version < 8) {
		$.jstree.defaults.core.animation = 0;
	}

/**
 * ### Checkbox plugin
 *
 * This plugin renders checkbox icons in front of each node, making multiple selection much easier. 
 * It also supports tri-state behavior, meaning that if a node has a few of its children checked it will be rendered as undetermined, and state will be propagated up.
 */

	var _i = document.createElement('I');
	_i.className = 'jstree-icon jstree-checkbox';
	/**
	 * stores all defaults for the checkbox plugin
	 * @name $.jstree.defaults.checkbox
	 * @plugin checkbox
	 */
	$.jstree.defaults.checkbox = {
		/**
		 * a boolean indicating if checkboxes should be visible (can be changed at a later time using `show_checkboxes()` and `hide_checkboxes`). Defaults to `true`.
		 * @name $.jstree.defaults.checkbox.visible
		 * @plugin checkbox
		 */
		visible				: true,
		/**
		 * a boolean indicating if checkboxes should cascade down and have an undetermined state. Defaults to `true`.
		 * @name $.jstree.defaults.checkbox.three_state
		 * @plugin checkbox
		 */
		three_state			: true,
		/**
		 * a boolean indicating if clicking anywhere on the node should act as clicking on the checkbox. Defaults to `true`.
		 * @name $.jstree.defaults.checkbox.whole_node
		 * @plugin checkbox
		 */
		whole_node			: true,
		/**
		 * a boolean indicating if the selected style of a node should be kept, or removed. Defaults to `true`.
		 * @name $.jstree.defaults.checkbox.keep_selected_style
		 * @plugin checkbox
		 */
		keep_selected_style	: true
	};
	$.jstree.plugins.checkbox = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);
			this._data.checkbox.uto = false;
			this.element
				.on("init.jstree", $.proxy(function () {
						this._data.checkbox.visible = this.settings.checkbox.visible;
						if(!this.settings.checkbox.keep_selected_style) {
							this.element.addClass('jstree-checkbox-no-clicked');
						}
					}, this))
				.on("loading.jstree", $.proxy(function () {
						this[ this._data.checkbox.visible ? 'show_checkboxes' : 'hide_checkboxes' ]();
					}, this));
			if(this.settings.checkbox.three_state) {
				this.element
					.on('changed.jstree move_node.jstree copy_node.jstree redraw.jstree open_node.jstree', $.proxy(function () {
							if(this._data.checkbox.uto) { clearTimeout(this._data.checkbox.uto); }
							this._data.checkbox.uto = setTimeout($.proxy(this._undetermined, this), 50);
						}, this))
					.on('model.jstree', $.proxy(function (e, data) {
							var m = this._model.data,
								p = m[data.parent],
								dpc = data.nodes,
								chd = [],
								c, i, j, k, l, tmp;

							// apply down
							if(p.state.selected) {
								for(i = 0, j = dpc.length; i < j; i++) {
									m[dpc[i]].state.selected = true;
								}
								this._data.core.selected = this._data.core.selected.concat(dpc);
							}
							else {
								for(i = 0, j = dpc.length; i < j; i++) {
									if(m[dpc[i]].state.selected) {
										for(k = 0, l = m[dpc[i]].children_d.length; k < l; k++) {
											m[m[dpc[i]].children_d[k]].state.selected = true;
										}
										this._data.core.selected = this._data.core.selected.concat(m[dpc[i]].children_d);
									}
								}
							}

							// apply up
							for(i = 0, j = p.children_d.length; i < j; i++) {
								if(!m[p.children_d[i]].children.length) {
									chd.push(m[p.children_d[i]].parent);
								}
							}
							chd = $.vakata.array_unique(chd);
							for(k = 0, l = chd.length; k < l; k++) {
								p = m[chd[k]];
								while(p && p.id !== '#') {
									c = 0;
									for(i = 0, j = p.children.length; i < j; i++) {
										c += m[p.children[i]].state.selected;
									}
									if(c === j) {
										p.state.selected = true;
										this._data.core.selected.push(p.id);
										tmp = this.get_node(p, true);
										if(tmp && tmp.length) {
											tmp.children('.jstree-anchor').addClass('jstree-clicked');
										}
									}
									else {
										break;
									}
									p = this.get_node(p.parent);
								}
							}
							this._data.core.selected = $.vakata.array_unique(this._data.core.selected);
						}, this))
					.on('select_node.jstree', $.proxy(function (e, data) {
							var obj = data.node,
								m = this._model.data,
								par = this.get_node(obj.parent),
								dom = this.get_node(obj, true),
								i, j, c, tmp;
							this._data.core.selected = $.vakata.array_unique(this._data.core.selected.concat(obj.children_d));
							for(i = 0, j = obj.children_d.length; i < j; i++) {
								m[obj.children_d[i]].state.selected = true;
							}
							while(par && par.id !== '#') {
								c = 0;
								for(i = 0, j = par.children.length; i < j; i++) {
									c += m[par.children[i]].state.selected;
								}
								if(c === j) {
									par.state.selected = true;
									this._data.core.selected.push(par.id);
									tmp = this.get_node(par, true);
									if(tmp && tmp.length) {
										tmp.children('.jstree-anchor').addClass('jstree-clicked');
									}
								}
								else {
									break;
								}
								par = this.get_node(par.parent);
							}
							if(dom.length) {
								dom.find('.jstree-anchor').addClass('jstree-clicked');
							}
						}, this))
					.on('deselect_node.jstree', $.proxy(function (e, data) {
							var obj = data.node,
								dom = this.get_node(obj, true),
								i, j, tmp;
							for(i = 0, j = obj.children_d.length; i < j; i++) {
								this._model.data[obj.children_d[i]].state.selected = false;
							}
							for(i = 0, j = obj.parents.length; i < j; i++) {
								this._model.data[obj.parents[i]].state.selected = false;
								tmp = this.get_node(obj.parents[i], true);
								if(tmp && tmp.length) {
									tmp.children('.jstree-anchor').removeClass('jstree-clicked');
								}
							}
							tmp = [];
							for(i = 0, j = this._data.core.selected.length; i < j; i++) {
								if($.inArray(this._data.core.selected[i], obj.children_d) === -1 && $.inArray(this._data.core.selected[i], obj.parents) === -1) {
									tmp.push(this._data.core.selected[i]);
								}
							}
							this._data.core.selected = $.vakata.array_unique(tmp);
							if(dom.length) {
								dom.find('.jstree-anchor').removeClass('jstree-clicked');
							}
						}, this))
					.on('delete_node.jstree', $.proxy(function (e, data) {
							var p = this.get_node(data.parent),
								m = this._model.data,
								i, j, c, tmp;
							while(p && p.id !== '#') {
								c = 0;
								for(i = 0, j = p.children.length; i < j; i++) {
									c += m[p.children[i]].state.selected;
								}
								if(c === j) {
									p.state.selected = true;
									this._data.core.selected.push(p.id);
									tmp = this.get_node(p, true);
									if(tmp && tmp.length) {
										tmp.children('.jstree-anchor').addClass('jstree-clicked');
									}
								}
								else {
									break;
								}
								p = this.get_node(p.parent);
							}
						}, this))
					.on('move_node.jstree', $.proxy(function (e, data) {
							var is_multi = data.is_multi,
								old_par = data.old_parent,
								new_par = this.get_node(data.parent),
								m = this._model.data,
								p, c, i, j, tmp;
							if(!is_multi) {
								p = this.get_node(old_par);
								while(p && p.id !== '#') {
									c = 0;
									for(i = 0, j = p.children.length; i < j; i++) {
										c += m[p.children[i]].state.selected;
									}
									if(c === j) {
										p.state.selected = true;
										this._data.core.selected.push(p.id);
										tmp = this.get_node(p, true);
										if(tmp && tmp.length) {
											tmp.children('.jstree-anchor').addClass('jstree-clicked');
										}
									}
									else {
										break;
									}
									p = this.get_node(p.parent);
								}
							}
							p = new_par;
							while(p && p.id !== '#') {
								c = 0;
								for(i = 0, j = p.children.length; i < j; i++) {
									c += m[p.children[i]].state.selected;
								}
								if(c === j) {
									if(!p.state.selected) {
										p.state.selected = true;
										this._data.core.selected.push(p.id);
										tmp = this.get_node(p, true);
										if(tmp && tmp.length) {
											tmp.children('.jstree-anchor').addClass('jstree-clicked');
										}
									}
								}
								else {
									if(p.state.selected) {
										p.state.selected = false;
										this._data.core.selected = $.vakata.array_remove_item(this._data.core.selected, p.id);
										tmp = this.get_node(p, true);
										if(tmp && tmp.length) {
											tmp.children('.jstree-anchor').removeClass('jstree-clicked');
										}
									}
									else {
										break;
									}
								}
								p = this.get_node(p.parent);
							}
						}, this));
			}
		};
		/**
		 * set the undetermined state where and if necessary. Used internally.
		 * @private
		 * @name _undetermined()
		 * @plugin checkbox
		 */
		this._undetermined = function () {
			var i, j, m = this._model.data, s = this._data.core.selected, p = [], t = this;
			for(i = 0, j = s.length; i < j; i++) {
				if(m[s[i]] && m[s[i]].parents) {
					p = p.concat(m[s[i]].parents);
				}
			}
			// attempt for server side undetermined state
			this.element.find('.jstree-closed').not(':has(ul)')
				.each(function () {
					var tmp = t.get_node(this);
					if(!tmp.state.loaded && tmp.original && tmp.original.state && tmp.original.state.undetermined && tmp.original.state.undetermined === true) {
						p.push(tmp.id);
						p = p.concat(tmp.parents);
					}
				});
			p = $.vakata.array_unique(p);
			i = $.inArray('#', p);
			if(i !== -1) {
				p = $.vakata.array_remove(p, i);
			}

			this.element.find('.jstree-undetermined').removeClass('jstree-undetermined');
			for(i = 0, j = p.length; i < j; i++) {
				if(!m[p[i]].state.selected) {
					s = this.get_node(p[i], true);
					if(s && s.length) {
						s.children('a').children('.jstree-checkbox').addClass('jstree-undetermined');
					}
				}
			}
		};
		this.redraw_node = function(obj, deep, is_callback) {
			obj = parent.redraw_node.call(this, obj, deep, is_callback);
			if(obj) {
				var tmp = obj.getElementsByTagName('A')[0];
				tmp.insertBefore(_i.cloneNode(), tmp.childNodes[0]);
			}
			if(!is_callback && this.settings.checkbox.three_state) {
				if(this._data.checkbox.uto) { clearTimeout(this._data.checkbox.uto); }
				this._data.checkbox.uto = setTimeout($.proxy(this._undetermined, this), 50);
			}
			return obj;
		};
		this.activate_node = function (obj, e) {
			if(this.settings.checkbox.whole_node || $(e.target).hasClass('jstree-checkbox')) {
				e.ctrlKey = true;
			}
			return parent.activate_node.call(this, obj, e);
		};
		/**
		 * show the node checkbox icons
		 * @name show_checkboxes()
		 * @plugin checkbox
		 */
		this.show_checkboxes = function () { this._data.core.themes.checkboxes = true; this.element.children("ul").removeClass("jstree-no-checkboxes"); };
		/**
		 * hide the node checkbox icons
		 * @name hide_checkboxes()
		 * @plugin checkbox
		 */
		this.hide_checkboxes = function () { this._data.core.themes.checkboxes = false; this.element.children("ul").addClass("jstree-no-checkboxes"); };
		/**
		 * toggle the node icons
		 * @name toggle_checkboxes()
		 * @plugin checkbox
		 */
		this.toggle_checkboxes = function () { if(this._data.core.themes.checkboxes) { this.hide_checkboxes(); } else { this.show_checkboxes(); } };
	};

	// include the checkbox plugin by default
	// $.jstree.defaults.plugins.push("checkbox");

/**
 * ### Contextmenu plugin
 *
 * Shows a context menu when a node is right-clicked.
 */
// TODO: move logic outside of function + check multiple move

	/**
	 * stores all defaults for the contextmenu plugin
	 * @name $.jstree.defaults.contextmenu
	 * @plugin contextmenu
	 */
	$.jstree.defaults.contextmenu = {
		/**
		 * a boolean indicating if the node should be selected when the context menu is invoked on it. Defaults to `true`.
		 * @name $.jstree.defaults.contextmenu.select_node
		 * @plugin contextmenu
		 */
		select_node : true,
		/**
		 * a boolean indicating if the menu should be shown aligned with the node. Defaults to `true`, otherwise the mouse coordinates are used.
		 * @name $.jstree.defaults.contextmenu.show_at_node
		 * @plugin contextmenu
		 */
		show_at_node : true,
		/**
		 * an object of actions, or a function that accepts a node and a callback function and calls the callback function with an object of actions available for that node (you can also return the items too).
		 * 
		 * Each action consists of a key (a unique name) and a value which is an object with the following properties (only label and action are required):
		 * 
		 * * `separator_before` - a boolean indicating if there should be a separator before this item
		 * * `separator_after` - a boolean indicating if there should be a separator after this item
		 * * `_disabled` - a boolean indicating if this action should be disabled
		 * * `label` - a string - the name of the action
		 * * `action` - a function to be executed if this item is chosen
		 * * `icon` - a string, can be a path to an icon or a className, if using an image that is in the current directory use a `./` prefix, otherwise it will be detected as a class
		 * * `shortcut` - keyCode which will trigger the action if the menu is open (for example `113` for rename, which equals F2)
		 * * `shortcut_label` - shortcut label (like for example `F2` for rename)
		 * 
		 * @name $.jstree.defaults.contextmenu.items
		 * @plugin contextmenu
		 */
		items : function (o, cb) { // Could be an object directly
			return {
				"create" : {
					"separator_before"	: false,
					"separator_after"	: true,
					"_disabled"			: false, //(this.check("create_node", data.reference, {}, "last")),
					"label"				: "Create",
					"action"			: function (data) {
						var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
						inst.create_node(obj, {}, "last", function (new_node) {
							setTimeout(function () { inst.edit(new_node); },0);
						});
					}
				},
				"rename" : {
					"separator_before"	: false,
					"separator_after"	: false,
					"_disabled"			: false, //(this.check("rename_node", data.reference, this.get_parent(data.reference), "")),
					"label"				: "Rename",
					/*
					"shortcut"			: 113,
					"shortcut_label"	: 'F2',
					"icon"				: "glyphicon glyphicon-leaf",
					*/
					"action"			: function (data) {
						var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
						inst.edit(obj);
					}
				},
				"remove" : {
					"separator_before"	: false,
					"icon"				: false,
					"separator_after"	: false,
					"_disabled"			: false, //(this.check("delete_node", data.reference, this.get_parent(data.reference), "")),
					"label"				: "Delete",
					"action"			: function (data) {
						var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
						if(inst.is_selected(obj)) {
							inst.delete_node(inst.get_selected());
						}
						else {
							inst.delete_node(obj);
						}
					}
				},
				"ccp" : {
					"separator_before"	: true,
					"icon"				: false,
					"separator_after"	: false,
					"label"				: "Edit",
					"action"			: false,
					"submenu" : {
						"cut" : {
							"separator_before"	: false,
							"separator_after"	: false,
							"label"				: "Cut",
							"action"			: function (data) {
								var inst = $.jstree.reference(data.reference),
									obj = inst.get_node(data.reference);
								if(inst.is_selected(obj)) {
									inst.cut(inst.get_selected());
								}
								else {
									inst.cut(obj);
								}
							}
						},
						"copy" : {
							"separator_before"	: false,
							"icon"				: false,
							"separator_after"	: false,
							"label"				: "Copy",
							"action"			: function (data) {
								var inst = $.jstree.reference(data.reference),
									obj = inst.get_node(data.reference);
								if(inst.is_selected(obj)) {
									inst.copy(inst.get_selected());
								}
								else {
									inst.copy(obj);
								}
							}
						},
						"paste" : {
							"separator_before"	: false,
							"icon"				: false,
							"_disabled"			: function (data) {
								return !$.jstree.reference(data.reference).can_paste();
							},
							"separator_after"	: false,
							"label"				: "Paste",
							"action"			: function (data) {
								var inst = $.jstree.reference(data.reference),
									obj = inst.get_node(data.reference);
								inst.paste(obj);
							}
						}
					}
				}
			};
		}
	};

	$.jstree.plugins.contextmenu = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this.element
				.on("contextmenu.jstree", ".jstree-anchor", $.proxy(function (e) {
						e.preventDefault();
						if(!this.is_loading(e.currentTarget)) {
							this.show_contextmenu(e.currentTarget, e.pageX, e.pageY, e);
						}
					}, this))
				.on("click.jstree", ".jstree-anchor", $.proxy(function (e) {
						if(this._data.contextmenu.visible) {
							$.vakata.context.hide();
						}
					}, this));
			/*
			if(!('oncontextmenu' in document.body) && ('ontouchstart' in document.body)) {
				var el = null, tm = null;
				this.element
					.on("touchstart", ".jstree-anchor", function (e) {
						el = e.currentTarget;
						tm = +new Date();
						$(document).one("touchend", function (e) {
							e.target = document.elementFromPoint(e.originalEvent.targetTouches[0].pageX - window.pageXOffset, e.originalEvent.targetTouches[0].pageY - window.pageYOffset);
							e.currentTarget = e.target;
							tm = ((+(new Date())) - tm);
							if(e.target === el && tm > 600 && tm < 1000) {
								e.preventDefault();
								$(el).trigger('contextmenu', e);
							}
							el = null;
							tm = null;
						});
					});
			}
			*/
			$(document).on("context_hide.vakata", $.proxy(function () { this._data.contextmenu.visible = false; }, this));
		};
		this.teardown = function () {
			if(this._data.contextmenu.visible) {
				$.vakata.context.hide();
			}
			parent.teardown.call(this);
		};

		/**
		 * prepare and show the context menu for a node
		 * @name show_contextmenu(obj [, x, y])
		 * @param {mixed} obj the node
		 * @param {Number} x the x-coordinate relative to the document to show the menu at
		 * @param {Number} y the y-coordinate relative to the document to show the menu at
		 * @param {Object} e the event if available that triggered the contextmenu
		 * @plugin contextmenu
		 * @trigger show_contextmenu.jstree
		 */
		this.show_contextmenu = function (obj, x, y, e) {
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			var s = this.settings.contextmenu,
				d = this.get_node(obj, true),
				a = d.children(".jstree-anchor"),
				o = false,
				i = false;
			if(s.show_at_node || x === undefined || y === undefined) {
				o = a.offset();
				x = o.left;
				y = o.top + this._data.core.li_height;
			}
			if(this.settings.contextmenu.select_node && !this.is_selected(obj)) {
				this.deselect_all();
				this.select_node(obj, false, false, e);
			}

			i = s.items;
			if($.isFunction(i)) {
				i = i.call(this, obj, $.proxy(function (i) {
					this._show_contextmenu(obj, x, y, i);
				}, this));
			}
			if($.isPlainObject(i)) {
				this._show_contextmenu(obj, x, y, i);
			}
		};
		/**
		 * show the prepared context menu for a node
		 * @name _show_contextmenu(obj, x, y, i)
		 * @param {mixed} obj the node
		 * @param {Number} x the x-coordinate relative to the document to show the menu at
		 * @param {Number} y the y-coordinate relative to the document to show the menu at
		 * @param {Number} i the object of items to show
		 * @plugin contextmenu
		 * @trigger show_contextmenu.jstree
		 * @private
		 */
		this._show_contextmenu = function (obj, x, y, i) {
			var d = this.get_node(obj, true),
				a = d.children(".jstree-anchor");
			$(document).one("context_show.vakata", $.proxy(function (e, data) {
				var cls = 'jstree-contextmenu jstree-' + this.get_theme() + '-contextmenu';
				$(data.element).addClass(cls);
			}, this));
			this._data.contextmenu.visible = true;
			$.vakata.context.show(a, { 'x' : x, 'y' : y }, i);
			/**
			 * triggered when the contextmenu is shown for a node
			 * @event
			 * @name show_contextmenu.jstree
			 * @param {Object} node the node
			 * @param {Number} x the x-coordinate of the menu relative to the document
			 * @param {Number} y the y-coordinate of the menu relative to the document
			 * @plugin contextmenu
			 */
			this.trigger('show_contextmenu', { "node" : obj, "x" : x, "y" : y });
		};
	};

	// contextmenu helper
	(function ($) {
		var right_to_left = false,
			vakata_context = {
				element		: false,
				reference	: false,
				position_x	: 0,
				position_y	: 0,
				items		: [],
				html		: "",
				is_visible	: false
			};

		$.vakata.context = {
			settings : {
				hide_onmouseleave	: 0,
				icons				: true
			},
			_trigger : function (event_name) {
				$(document).triggerHandler("context_" + event_name + ".vakata", {
					"reference"	: vakata_context.reference,
					"element"	: vakata_context.element,
					"position"	: {
						"x" : vakata_context.position_x,
						"y" : vakata_context.position_y
					}
				});
			},
			_execute : function (i) {
				i = vakata_context.items[i];
				return i && (!i._disabled || ($.isFunction(i._disabled) && !i._disabled({ "item" : i, "reference" : vakata_context.reference, "element" : vakata_context.element }))) && i.action ? i.action.call(null, {
							"item"		: i,
							"reference"	: vakata_context.reference,
							"element"	: vakata_context.element,
							"position"	: {
								"x" : vakata_context.position_x,
								"y" : vakata_context.position_y
							}
						}) : false;
			},
			_parse : function (o, is_callback) {
				if(!o) { return false; }
				if(!is_callback) {
					vakata_context.html		= "";
					vakata_context.items	= [];
				}
				var str = "",
					sep = false,
					tmp;

				if(is_callback) { str += "<"+"ul>"; }
				$.each(o, function (i, val) {
					if(!val) { return true; }
					vakata_context.items.push(val);
					if(!sep && val.separator_before) {
						str += "<"+"li class='vakata-context-separator'><"+"a href='#' " + ($.vakata.context.settings.icons ? '' : 'style="margin-left:0px;"') + ">&#160;<"+"/a><"+"/li>";
					}
					sep = false;
					str += "<"+"li class='" + (val._class || "") + (val._disabled === true || ($.isFunction(val._disabled) && val._disabled({ "item" : val, "reference" : vakata_context.reference, "element" : vakata_context.element })) ? " vakata-contextmenu-disabled " : "") + "' "+(val.shortcut?" data-shortcut='"+val.shortcut+"' ":'')+">";
					str += "<"+"a href='#' rel='" + (vakata_context.items.length - 1) + "'>";
					if($.vakata.context.settings.icons) {
						str += "<"+"i ";
						if(val.icon) {
							if(val.icon.indexOf("/") !== -1 || val.icon.indexOf(".") !== -1) { str += " style='background:url(\"" + val.icon + "\") center center no-repeat' "; }
							else { str += " class='" + val.icon + "' "; }
						}
						str += "><"+"/i><"+"span class='vakata-contextmenu-sep'>&#160;<"+"/span>";
					}
					str += val.label + (val.shortcut?' <span class="vakata-contextmenu-shortcut vakata-contextmenu-shortcut-'+val.shortcut+'">'+ (val.shortcut_label || '') +'</span>':'') + "<"+"/a>";
					if(val.submenu) {
						tmp = $.vakata.context._parse(val.submenu, true);
						if(tmp) { str += tmp; }
					}
					str += "<"+"/li>";
					if(val.separator_after) {
						str += "<"+"li class='vakata-context-separator'><"+"a href='#' " + ($.vakata.context.settings.icons ? '' : 'style="margin-left:0px;"') + ">&#160;<"+"/a><"+"/li>";
						sep = true;
					}
				});
				str  = str.replace(/<li class\='vakata-context-separator'\><\/li\>$/,"");
				if(is_callback) { str += "</ul>"; }
				/**
				 * triggered on the document when the contextmenu is parsed (HTML is built)
				 * @event
				 * @plugin contextmenu
				 * @name context_parse.vakata
				 * @param {jQuery} reference the element that was right clicked
				 * @param {jQuery} element the DOM element of the menu itself
				 * @param {Object} position the x & y coordinates of the menu
				 */
				if(!is_callback) { vakata_context.html = str; $.vakata.context._trigger("parse"); }
				return str.length > 10 ? str : false;
			},
			_show_submenu : function (o) {
				o = $(o);
				if(!o.length || !o.children("ul").length) { return; }
				var e = o.children("ul"),
					x = o.offset().left + o.outerWidth(),
					y = o.offset().top,
					w = e.width(),
					h = e.height(),
					dw = $(window).width() + $(window).scrollLeft(),
					dh = $(window).height() + $(window).scrollTop();
				// може да се спести е една проверка - дали няма някой от класовете вече нагоре
				if(right_to_left) {
					o[x - (w + 10 + o.outerWidth()) < 0 ? "addClass" : "removeClass"]("vakata-context-left");
				}
				else {
					o[x + w + 10 > dw ? "addClass" : "removeClass"]("vakata-context-right");
				}
				if(y + h + 10 > dh) {
					e.css("bottom","-1px");
				}
				e.show();
			},
			show : function (reference, position, data) {
				var o, e, x, y, w, h, dw, dh, cond = true;
				if(vakata_context.element && vakata_context.element.length) {
					vakata_context.element.width('');
				}
				switch(cond) {
					case (!position && !reference):
						return false;
					case (!!position && !!reference):
						vakata_context.reference	= reference;
						vakata_context.position_x	= position.x;
						vakata_context.position_y	= position.y;
						break;
					case (!position && !!reference):
						vakata_context.reference	= reference;
						o = reference.offset();
						vakata_context.position_x	= o.left + reference.outerHeight();
						vakata_context.position_y	= o.top;
						break;
					case (!!position && !reference):
						vakata_context.position_x	= position.x;
						vakata_context.position_y	= position.y;
						break;
				}
				if(!!reference && !data && $(reference).data('vakata_contextmenu')) {
					data = $(reference).data('vakata_contextmenu');
				}
				if($.vakata.context._parse(data)) {
					vakata_context.element.html(vakata_context.html);
				}
				if(vakata_context.items.length) {
					e = vakata_context.element;
					x = vakata_context.position_x;
					y = vakata_context.position_y;
					w = e.width();
					h = e.height();
					dw = $(window).width() + $(window).scrollLeft();
					dh = $(window).height() + $(window).scrollTop();
					if(right_to_left) {
						x -= e.outerWidth();
						if(x < $(window).scrollLeft() + 20) {
							x = $(window).scrollLeft() + 20;
						}
					}
					if(x + w + 20 > dw) {
						x = dw - (w + 20);
					}
					if(y + h + 20 > dh) {
						y = dh - (h + 20);
					}

					vakata_context.element
						.css({ "left" : x, "top" : y })
						.show()
						.find('a:eq(0)').focus().parent().addClass("vakata-context-hover");
					vakata_context.is_visible = true;
					/**
					 * triggered on the document when the contextmenu is shown
					 * @event
					 * @plugin contextmenu
					 * @name context_show.vakata
					 * @param {jQuery} reference the element that was right clicked
					 * @param {jQuery} element the DOM element of the menu itself
					 * @param {Object} position the x & y coordinates of the menu
					 */
					$.vakata.context._trigger("show");
				}
			},
			hide : function () {
				if(vakata_context.is_visible) {
					vakata_context.element.hide().find("ul").hide().end().find(':focus').blur();
					vakata_context.is_visible = false;
					/**
					 * triggered on the document when the contextmenu is hidden
					 * @event
					 * @plugin contextmenu
					 * @name context_hide.vakata
					 * @param {jQuery} reference the element that was right clicked
					 * @param {jQuery} element the DOM element of the menu itself
					 * @param {Object} position the x & y coordinates of the menu
					 */
					$.vakata.context._trigger("hide");
				}
			}
		};
		$(function () {
			right_to_left = $("body").css("direction") === "rtl";
			var to = false;

			vakata_context.element = $("<ul class='vakata-context'></ul>");
			vakata_context.element
				.on("mouseenter", "li", function (e) {
					e.stopImmediatePropagation();

					if($.contains(this, e.relatedTarget)) {
						// премахнато заради delegate mouseleave по-долу
						// $(this).find(".vakata-context-hover").removeClass("vakata-context-hover");
						return;
					}

					if(to) { clearTimeout(to); }
					vakata_context.element.find(".vakata-context-hover").removeClass("vakata-context-hover").end();

					$(this)
						.siblings().find("ul").hide().end().end()
						.parentsUntil(".vakata-context", "li").addBack().addClass("vakata-context-hover");
					$.vakata.context._show_submenu(this);
				})
				// тестово - дали не натоварва?
				.on("mouseleave", "li", function (e) {
					if($.contains(this, e.relatedTarget)) { return; }
					$(this).find(".vakata-context-hover").addBack().removeClass("vakata-context-hover");
				})
				.on("mouseleave", function (e) {
					$(this).find(".vakata-context-hover").removeClass("vakata-context-hover");
					if($.vakata.context.settings.hide_onmouseleave) {
						to = setTimeout(
							(function (t) {
								return function () { $.vakata.context.hide(); };
							}(this)), $.vakata.context.settings.hide_onmouseleave);
					}
				})
				.on("click", "a", function (e) {
					e.preventDefault();
				})
				.on("mouseup", "a", function (e) {
					if(!$(this).blur().parent().hasClass("vakata-context-disabled") && $.vakata.context._execute($(this).attr("rel")) !== false) {
						$.vakata.context.hide();
					}
				})
				.on('keydown', 'a', function (e) {
						var o = null;
						switch(e.which) {
							case 13:
							case 32:
								e.type = "mouseup";
								e.preventDefault();
								$(e.currentTarget).trigger(e);
								break;
							case 37:
								if(vakata_context.is_visible) {
									vakata_context.element.find(".vakata-context-hover").last().parents("li:eq(0)").find("ul").hide().find(".vakata-context-hover").removeClass("vakata-context-hover").end().end().children('a').focus();
									e.stopImmediatePropagation();
									e.preventDefault();
								}
								break;
							case 38:
								if(vakata_context.is_visible) {
									o = vakata_context.element.find("ul:visible").addBack().last().children(".vakata-context-hover").removeClass("vakata-context-hover").prevAll("li:not(.vakata-context-separator)").first();
									if(!o.length) { o = vakata_context.element.find("ul:visible").addBack().last().children("li:not(.vakata-context-separator)").last(); }
									o.addClass("vakata-context-hover").children('a').focus();
									e.stopImmediatePropagation();
									e.preventDefault();
								}
								break;
							case 39:
								if(vakata_context.is_visible) {
									vakata_context.element.find(".vakata-context-hover").last().children("ul").show().children("li:not(.vakata-context-separator)").removeClass("vakata-context-hover").first().addClass("vakata-context-hover").children('a').focus();
									e.stopImmediatePropagation();
									e.preventDefault();
								}
								break;
							case 40:
								if(vakata_context.is_visible) {
									o = vakata_context.element.find("ul:visible").addBack().last().children(".vakata-context-hover").removeClass("vakata-context-hover").nextAll("li:not(.vakata-context-separator)").first();
									if(!o.length) { o = vakata_context.element.find("ul:visible").addBack().last().children("li:not(.vakata-context-separator)").first(); }
									o.addClass("vakata-context-hover").children('a').focus();
									e.stopImmediatePropagation();
									e.preventDefault();
								}
								break;
							case 27:
								$.vakata.context.hide();
								e.preventDefault();
								break;
							default:
								//console.log(e.which);
								break;
						}
					})
				.on('keydown', function (e) {
					e.preventDefault();
					var a = vakata_context.element.find('.vakata-contextmenu-shortcut-' + e.which).parent();
					if(a.parent().not('.vakata-context-disabled')) {
						a.mouseup();
					}
				})
				.appendTo("body");

			$(document)
				.on("mousedown", function (e) {
					if(vakata_context.is_visible && !$.contains(vakata_context.element[0], e.target)) { $.vakata.context.hide(); }
				})
				.on("context_show.vakata", function (e, data) {
					vakata_context.element.find("li:has(ul)").children("a").addClass("vakata-context-parent");
					if(right_to_left) {
						vakata_context.element.addClass("vakata-context-rtl").css("direction", "rtl");
					}
					// also apply a RTL class?
					vakata_context.element.find("ul").hide().end();
				});
		});
	}($));
	// $.jstree.defaults.plugins.push("contextmenu");

/**
 * ### Drag'n'drop plugin
 *
 * Enables dragging and dropping of nodes in the tree, resulting in a move or copy operations.
 */

	/**
	 * stores all defaults for the drag'n'drop plugin
	 * @name $.jstree.defaults.dnd
	 * @plugin dnd
	 */
	$.jstree.defaults.dnd = {
		/**
		 * a boolean indicating if a copy should be possible while dragging (by pressint the meta key or Ctrl). Defaults to `true`.
		 * @name $.jstree.defaults.dnd.copy
		 * @plugin dnd
		 */
		copy : true,
		/**
		 * a number indicating how long a node should remain hovered while dragging to be opened. Defaults to `500`.
		 * @name $.jstree.defaults.dnd.open_timeout
		 * @plugin dnd
		 */
		open_timeout : 500,
		/**
		 * a function invoked each time a node is about to be dragged, invoked in the tree's scope and receives the node as an argument - return `false` to prevent dragging
		 * @name $.jstree.defaults.dnd.is_draggable
		 * @plugin dnd
		 */
		is_draggable : true,
		/**
		 * a boolean indicating if checks should constantly be made while the user is dragging the node (as opposed to checking only on drop), default is `true`
		 * @name $.jstree.defaults.dnd.check_while_dragging
		 * @plugin dnd
		 */
		check_while_dragging : true
	};
	// TODO: now check works by checking for each node individually, how about max_children, unique, etc?
	// TODO: drop somewhere else - maybe demo only?
	$.jstree.plugins.dnd = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this.element
				.on('mousedown touchstart', '.jstree-anchor', $.proxy(function (e) {
					var obj = this.get_node(e.target),
						mlt = this.is_selected(obj) ? this.get_selected().length : 1;
					if(obj && obj.id && obj.id !== "#" && (e.which === 1 || e.type === "touchstart") &&
						(this.settings.dnd.is_draggable === true || ($.isFunction(this.settings.dnd.is_draggable) && this.settings.dnd.is_draggable.call(this, obj)))
					) {
						this.element.trigger('mousedown.jstree');
						return $.vakata.dnd.start(e, { 'jstree' : true, 'origin' : this, 'obj' : this.get_node(obj,true), 'nodes' : mlt > 1 ? this.get_selected() : [obj.id] }, '<div id="jstree-dnd" class="jstree-' + this.get_theme() + '"><i class="jstree-icon jstree-er"></i>' + (mlt > 1 ? mlt + ' ' + this.get_string('nodes') : this.get_text(e.currentTarget, true)) + '<ins class="jstree-copy" style="display:none;">+</ins></div>');
					}
				}, this));
		};
	};

	$(function() {
		// bind only once for all instances
		var lastmv = false,
			laster = false,
			opento = false,
			marker = $('<div id="jstree-marker">&#160;</div>').hide().appendTo('body');

		$(document)
			.bind('dnd_start.vakata', function (e, data) {
				lastmv = false;
			})
			.bind('dnd_move.vakata', function (e, data) {
				if(opento) { clearTimeout(opento); }
				if(!data.data.jstree) { return; }

				// if we are hovering the marker image do nothing (can happen on "inside" drags)
				if(data.event.target.id && data.event.target.id === 'jstree-marker') {
					return;
				}

				var ins = $.jstree.reference(data.event.target),
					ref = false,
					off = false,
					rel = false,
					l, t, h, p, i, o, ok, t1, t2, op, ps, pr;
				// if we are over an instance
				if(ins && ins._data && ins._data.dnd) {
					marker.attr('class', 'jstree-' + ins.get_theme());
					data.helper
						.children().attr('class', 'jstree-' + ins.get_theme())
						.find('.jstree-copy:eq(0)')[ data.data.origin && data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey) ? 'show' : 'hide' ]();


					// if are hovering the container itself add a new root node
					if( (data.event.target === ins.element[0] || data.event.target === ins.get_container_ul()[0]) && ins.get_container_ul().children().length === 0) {
						ok = true;
						for(t1 = 0, t2 = data.data.nodes.length; t1 < t2; t1++) {
							ok = ok && ins.check( (data.data.origin && data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey) ? "copy_node" : "move_node"), (data.data.origin && data.data.origin !== ins ? data.data.origin.get_node(data.data.nodes[t1]) : data.data.nodes[t1]), '#', 'last');
							if(!ok) { break; }
						}
						if(ok) {
							lastmv = { 'ins' : ins, 'par' : '#', 'pos' : 'last' };
							marker.hide();
							data.helper.find('.jstree-icon:eq(0)').removeClass('jstree-er').addClass('jstree-ok');
							return;
						}
					}
					else {
						// if we are hovering a tree node
						ref = $(data.event.target).closest('a');
						if(ref && ref.length && ref.parent().is('.jstree-closed, .jstree-open, .jstree-leaf')) {
							off = ref.offset();
							rel = data.event.pageY - off.top;
							h = ref.height();
							if(rel < h / 3) {
								o = ['b', 'i', 'a'];
							}
							else if(rel > h - h / 3) {
								o = ['a', 'i', 'b'];
							}
							else {
								o = rel > h / 2 ? ['i', 'a', 'b'] : ['i', 'b', 'a'];
							}
							$.each(o, function (j, v) {
								switch(v) {
									case 'b':
										l = off.left - 6;
										t = off.top - 5;
										p = ins.get_parent(ref);
										i = ref.parent().index();
										break;
									case 'i':
										l = off.left - 2;
										t = off.top - 5 + h / 2 + 1;
										p = ref.parent();
										i = 0;
										break;
									case 'a':
										l = off.left - 6;
										t = off.top - 5 + h;
										p = ins.get_parent(ref);
										i = ref.parent().index() + 1;
										break;
								}
								/*!
								// TODO: moving inside, but the node is not yet loaded?
								// the check will work anyway, as when moving the node will be loaded first and checked again
								if(v === 'i' && !ins.is_loaded(p)) { }
								*/
								ok = true;
								for(t1 = 0, t2 = data.data.nodes.length; t1 < t2; t1++) {
									op = data.data.origin && data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey) ? "copy_node" : "move_node";
									ps = i;
									if(op === "move_node" && v === 'a' && (data.data.origin && data.data.origin === ins) && p === ins.get_parent(data.data.nodes[t1])) {
										pr = ins.get_node(p);
										if(ps > $.inArray(data.data.nodes[t1], pr.children)) {
											ps -= 1;
										}
									}
									ok = ok && ( (ins && ins.settings && ins.settings.dnd && ins.settings.dnd.check_while_dragging === false) || ins.check(op, (data.data.origin && data.data.origin !== ins ? data.data.origin.get_node(data.data.nodes[t1]) : data.data.nodes[t1]), p, ps) );
									if(!ok) {
										if(ins && ins.last_error) { laster = ins.last_error(); }
										break;
									}
								}
								if(ok) {
									if(v === 'i' && ref.parent().is('.jstree-closed') && ins.settings.dnd.open_timeout) {
										opento = setTimeout((function (x, z) { return function () { x.open_node(z); }; }(ins, ref)), ins.settings.dnd.open_timeout);
									}
									lastmv = { 'ins' : ins, 'par' : p, 'pos' : i };
									marker.css({ 'left' : l + 'px', 'top' : t + 'px' }).show();
									data.helper.find('.jstree-icon:eq(0)').removeClass('jstree-er').addClass('jstree-ok');
									laster = {};
									o = true;
									return false;
								}
							});
							if(o === true) { return; }
						}
					}
				}
				lastmv = false;
				data.helper.find('.jstree-icon').removeClass('jstree-ok').addClass('jstree-er');
				marker.hide();
			})
			.bind('dnd_scroll.vakata', function (e, data) {
				if(!data.data.jstree) { return; }
				marker.hide();
				lastmv = false;
				data.helper.find('.jstree-icon:eq(0)').removeClass('jstree-ok').addClass('jstree-er');
			})
			.bind('dnd_stop.vakata', function (e, data) {
				if(opento) { clearTimeout(opento); }
				if(!data.data.jstree) { return; }
				marker.hide();
				var i, j, nodes = [];
				if(lastmv) {
					for(i = 0, j = data.data.nodes.length; i < j; i++) {
						nodes[i] = data.data.origin ? data.data.origin.get_node(data.data.nodes[i]) : data.data.nodes[i];
					}
					lastmv.ins[ data.data.origin && data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey) ? 'copy_node' : 'move_node' ](nodes, lastmv.par, lastmv.pos);
				}
				else {
					i = $(data.event.target).closest('.jstree');
					if(i.length && laster && laster.error && laster.error === 'check') {
						i = i.jstree(true);
						if(i) {
							i.settings.core.error.call(this, laster);
						}
					}
				}
			})
			.bind('keyup keydown', function (e, data) {
				data = $.vakata.dnd._get();
				if(data.data && data.data.jstree) {
					data.helper.find('.jstree-copy:eq(0)')[ data.data.origin && data.data.origin.settings.dnd.copy && (e.metaKey || e.ctrlKey) ? 'show' : 'hide' ]();
				}
			});
	});

	// helpers
	(function ($) {
		$.fn.vakata_reverse = [].reverse;
		// private variable
		var vakata_dnd = {
			element	: false,
			is_down	: false,
			is_drag	: false,
			helper	: false,
			helper_w: 0,
			data	: false,
			init_x	: 0,
			init_y	: 0,
			scroll_l: 0,
			scroll_t: 0,
			scroll_e: false,
			scroll_i: false
		};
		$.vakata.dnd = {
			settings : {
				scroll_speed		: 10,
				scroll_proximity	: 20,
				helper_left			: 5,
				helper_top			: 10,
				threshold			: 5
			},
			_trigger : function (event_name, e) {
				var data = $.vakata.dnd._get();
				data.event = e;
				$(document).triggerHandler("dnd_" + event_name + ".vakata", data);
			},
			_get : function () {
				return {
					"data"		: vakata_dnd.data,
					"element"	: vakata_dnd.element,
					"helper"	: vakata_dnd.helper
				};
			},
			_clean : function () {
				if(vakata_dnd.helper) { vakata_dnd.helper.remove(); }
				if(vakata_dnd.scroll_i) { clearInterval(vakata_dnd.scroll_i); vakata_dnd.scroll_i = false; }
				vakata_dnd = {
					element	: false,
					is_down	: false,
					is_drag	: false,
					helper	: false,
					helper_w: 0,
					data	: false,
					init_x	: 0,
					init_y	: 0,
					scroll_l: 0,
					scroll_t: 0,
					scroll_e: false,
					scroll_i: false
				};
				$(document).off("mousemove touchmove", $.vakata.dnd.drag);
				$(document).off("mouseup touchend", $.vakata.dnd.stop);
			},
			_scroll : function (init_only) {
				if(!vakata_dnd.scroll_e || (!vakata_dnd.scroll_l && !vakata_dnd.scroll_t)) {
					if(vakata_dnd.scroll_i) { clearInterval(vakata_dnd.scroll_i); vakata_dnd.scroll_i = false; }
					return false;
				}
				if(!vakata_dnd.scroll_i) {
					vakata_dnd.scroll_i = setInterval($.vakata.dnd._scroll, 100);
					return false;
				}
				if(init_only === true) { return false; }

				var i = vakata_dnd.scroll_e.scrollTop(),
					j = vakata_dnd.scroll_e.scrollLeft();
				vakata_dnd.scroll_e.scrollTop(i + vakata_dnd.scroll_t * $.vakata.dnd.settings.scroll_speed);
				vakata_dnd.scroll_e.scrollLeft(j + vakata_dnd.scroll_l * $.vakata.dnd.settings.scroll_speed);
				if(i !== vakata_dnd.scroll_e.scrollTop() || j !== vakata_dnd.scroll_e.scrollLeft()) {
					/**
					 * triggered on the document when a drag causes an element to scroll
					 * @event
					 * @plugin dnd
					 * @name dnd_scroll.vakata
					 * @param {Mixed} data any data supplied with the call to $.vakata.dnd.start
					 * @param {DOM} element the DOM element being dragged
					 * @param {jQuery} helper the helper shown next to the mouse
					 * @param {jQuery} event the element that is scrolling
					 */
					$.vakata.dnd._trigger("scroll", vakata_dnd.scroll_e);
				}
			},
			start : function (e, data, html) {
				if(e.type === "touchstart" && e.originalEvent && e.originalEvent.changedTouches && e.originalEvent.changedTouches[0]) {
					e.pageX = e.originalEvent.changedTouches[0].pageX;
					e.pageY = e.originalEvent.changedTouches[0].pageY;
					e.target = document.elementFromPoint(e.originalEvent.changedTouches[0].pageX - window.pageXOffset, e.originalEvent.changedTouches[0].pageY - window.pageYOffset);
				}
				if(vakata_dnd.is_drag) { $.vakata.dnd.stop({}); }
				try {
					e.currentTarget.unselectable = "on";
					e.currentTarget.onselectstart = function() { return false; };
					if(e.currentTarget.style) { e.currentTarget.style.MozUserSelect = "none"; }
				} catch(ignore) { }
				vakata_dnd.init_x	= e.pageX;
				vakata_dnd.init_y	= e.pageY;
				vakata_dnd.data		= data;
				vakata_dnd.is_down	= true;
				vakata_dnd.element	= e.currentTarget;
				if(html !== false) {
					vakata_dnd.helper = $("<div id='vakata-dnd'></div>").html(html).css({
						"display"		: "block",
						"margin"		: "0",
						"padding"		: "0",
						"position"		: "absolute",
						"top"			: "-2000px",
						"lineHeight"	: "16px",
						"zIndex"		: "10000"
					});
				}
				$(document).bind("mousemove touchmove", $.vakata.dnd.drag);
				$(document).bind("mouseup touchend", $.vakata.dnd.stop);
				return false;
			},
			drag : function (e) {
				if(e.type === "touchmove" && e.originalEvent && e.originalEvent.changedTouches && e.originalEvent.changedTouches[0]) {
					e.pageX = e.originalEvent.changedTouches[0].pageX;
					e.pageY = e.originalEvent.changedTouches[0].pageY;
					e.target = document.elementFromPoint(e.originalEvent.changedTouches[0].pageX - window.pageXOffset, e.originalEvent.changedTouches[0].pageY - window.pageYOffset);
				}
				if(!vakata_dnd.is_down) { return; }
				if(!vakata_dnd.is_drag) {
					if(
						Math.abs(e.pageX - vakata_dnd.init_x) > $.vakata.dnd.settings.threshold ||
						Math.abs(e.pageY - vakata_dnd.init_y) > $.vakata.dnd.settings.threshold
					) {
						if(vakata_dnd.helper) {
							vakata_dnd.helper.appendTo("body");
							vakata_dnd.helper_w = vakata_dnd.helper.outerWidth();
						}
						vakata_dnd.is_drag = true;
						/**
						 * triggered on the document when a drag starts
						 * @event
						 * @plugin dnd
						 * @name dnd_start.vakata
						 * @param {Mixed} data any data supplied with the call to $.vakata.dnd.start
						 * @param {DOM} element the DOM element being dragged
						 * @param {jQuery} helper the helper shown next to the mouse
						 * @param {Object} event the event that caused the start (probably mousemove)
						 */
						$.vakata.dnd._trigger("start", e);
					}
					else { return; }
				}

				var d  = false, w  = false,
					dh = false, wh = false,
					dw = false, ww = false,
					dt = false, dl = false,
					ht = false, hl = false;

				vakata_dnd.scroll_t = 0;
				vakata_dnd.scroll_l = 0;
				vakata_dnd.scroll_e = false;
				$(e.target)
					.parentsUntil("body").addBack().vakata_reverse()
					.filter(function () {
						return	(/^auto|scroll$/).test($(this).css("overflow")) &&
								(this.scrollHeight > this.offsetHeight || this.scrollWidth > this.offsetWidth);
					})
					.each(function () {
						var t = $(this), o = t.offset();
						if(this.scrollHeight > this.offsetHeight) {
							if(o.top + t.height() - e.pageY < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_t = 1; }
							if(e.pageY - o.top < $.vakata.dnd.settings.scroll_proximity)				{ vakata_dnd.scroll_t = -1; }
						}
						if(this.scrollWidth > this.offsetWidth) {
							if(o.left + t.width() - e.pageX < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_l = 1; }
							if(e.pageX - o.left < $.vakata.dnd.settings.scroll_proximity)				{ vakata_dnd.scroll_l = -1; }
						}
						if(vakata_dnd.scroll_t || vakata_dnd.scroll_l) {
							vakata_dnd.scroll_e = $(this);
							return false;
						}
					});

				if(!vakata_dnd.scroll_e) {
					d  = $(document); w = $(window);
					dh = d.height(); wh = w.height();
					dw = d.width(); ww = w.width();
					dt = d.scrollTop(); dl = d.scrollLeft();
					if(dh > wh && e.pageY - dt < $.vakata.dnd.settings.scroll_proximity)		{ vakata_dnd.scroll_t = -1;  }
					if(dh > wh && wh - (e.pageY - dt) < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_t = 1; }
					if(dw > ww && e.pageX - dl < $.vakata.dnd.settings.scroll_proximity)		{ vakata_dnd.scroll_l = -1; }
					if(dw > ww && ww - (e.pageX - dl) < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_l = 1; }
					if(vakata_dnd.scroll_t || vakata_dnd.scroll_l) {
						vakata_dnd.scroll_e = d;
					}
				}
				if(vakata_dnd.scroll_e) { $.vakata.dnd._scroll(true); }

				if(vakata_dnd.helper) {
					ht = parseInt(e.pageY + $.vakata.dnd.settings.helper_top, 10);
					hl = parseInt(e.pageX + $.vakata.dnd.settings.helper_left, 10);
					if(dh && ht + 25 > dh) { ht = dh - 50; }
					if(dw && hl + vakata_dnd.helper_w > dw) { hl = dw - (vakata_dnd.helper_w + 2); }
					vakata_dnd.helper.css({
						left	: hl + "px",
						top		: ht + "px"
					});
				}
				/**
				 * triggered on the document when a drag is in progress
				 * @event
				 * @plugin dnd
				 * @name dnd_move.vakata
				 * @param {Mixed} data any data supplied with the call to $.vakata.dnd.start
				 * @param {DOM} element the DOM element being dragged
				 * @param {jQuery} helper the helper shown next to the mouse
				 * @param {Object} event the event that caused this to trigger (most likely mousemove)
				 */
				$.vakata.dnd._trigger("move", e);
			},
			stop : function (e) {
				if(e.type === "touchend" && e.originalEvent && e.originalEvent.changedTouches && e.originalEvent.changedTouches[0]) {
					e.pageX = e.originalEvent.changedTouches[0].pageX;
					e.pageY = e.originalEvent.changedTouches[0].pageY;
					e.target = document.elementFromPoint(e.originalEvent.changedTouches[0].pageX - window.pageXOffset, e.originalEvent.changedTouches[0].pageY - window.pageYOffset);
				}
				if(vakata_dnd.is_drag) {
					/**
					 * triggered on the document when a drag stops (the dragged element is dropped)
					 * @event
					 * @plugin dnd
					 * @name dnd_stop.vakata
					 * @param {Mixed} data any data supplied with the call to $.vakata.dnd.start
					 * @param {DOM} element the DOM element being dragged
					 * @param {jQuery} helper the helper shown next to the mouse
					 * @param {Object} event the event that caused the stop
					 */
					$.vakata.dnd._trigger("stop", e);
				}
				$.vakata.dnd._clean();
			}
		};
	}(jQuery));

	// include the dnd plugin by default
	// $.jstree.defaults.plugins.push("dnd");


/**
 * ### Search plugin
 *
 * Adds search functionality to jsTree.
 */

	/**
	 * stores all defaults for the search plugin
	 * @name $.jstree.defaults.search
	 * @plugin search
	 */
	$.jstree.defaults.search = {
		/**
		 * a jQuery-like AJAX config, which jstree uses if a server should be queried for results. 
		 * 
		 * A `str` (which is the search string) parameter will be added with the request. The expected result is a JSON array with nodes that need to be opened so that matching nodes will be revealed.
		 * Leave this setting as `false` to not query the server.
		 * @name $.jstree.defaults.search.ajax
		 * @plugin search
		 */
		ajax : false,
		/**
		 * Indicates if the search should be fuzzy or not (should `chnd3` match `child node 3`). Default is `true`.
		 * @name $.jstree.defaults.search.fuzzy
		 * @plugin search
		 */
		fuzzy : true,
		/**
		 * Indicates if the search should be case sensitive. Default is `false`.
		 * @name $.jstree.defaults.search.case_sensitive
		 * @plugin search
		 */
		case_sensitive : false,
		/**
		 * Indicates if the tree should be filtered to show only matching nodes (keep in mind this can be a heavy on large trees in old browsers). Default is `false`.
		 * @name $.jstree.defaults.search.show_only_matches
		 * @plugin search
		 */
		show_only_matches : false,
		/**
		 * Indicates if all nodes opened to reveal the search result, should be closed when the search is cleared or a new search is performed. Default is `true`.
		 * @name $.jstree.defaults.search.close_opened_onclear
		 * @plugin search
		 */
		close_opened_onclear : true
	};

	$.jstree.plugins.search = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this._data.search.str = "";
			this._data.search.dom = $();
			this._data.search.res = [];
			this._data.search.opn = [];
			this._data.search.sln = null;

			if(this.settings.search.show_only_matches) {
				this.element
					.on("search.jstree", function (e, data) {
						if(data.nodes.length) {
							$(this).find("li").hide().filter('.jstree-last').filter(function() { return this.nextSibling; }).removeClass('jstree-last');
							data.nodes.parentsUntil(".jstree").addBack().show()
								.filter("ul").each(function () { $(this).children("li:visible").eq(-1).addClass("jstree-last"); });
						}
					})
					.on("clear_search.jstree", function (e, data) {
						if(data.nodes.length) {
							$(this).find("li").css("display","").filter('.jstree-last').filter(function() { return this.nextSibling; }).removeClass('jstree-last');
						}
					});
			}
		};
		/**
		 * used to search the tree nodes for a given string
		 * @name search(str [, skip_async])
		 * @param {String} str the search string
		 * @param {Boolean} skip_async if set to true server will not be queried even if configured
		 * @plugin search
		 * @trigger search.jstree
		 */
		this.search = function (str, skip_async) {
			if(str === false || $.trim(str) === "") {
				return this.clear_search();
			}
			var s = this.settings.search,
				a = s.ajax ? $.extend({}, s.ajax) : false,
				f = null,
				r = [],
				p = [], i, j;
			if(this._data.search.res.length) {
				this.clear_search();
			}
			if(!skip_async && a !== false) {
				if(!a.data) { a.data = {}; }
				a.data.str = str;
				return $.ajax(a)
					.fail($.proxy(function () {
						this._data.core.last_error = { 'error' : 'ajax', 'plugin' : 'search', 'id' : 'search_01', 'reason' : 'Could not load search parents', 'data' : JSON.stringify(a) };
						this.settings.core.error.call(this, this._data.core.last_error);
					}, this))
					.done($.proxy(function (d) {
						if(d && d.d) { d = d.d; }
						this._data.search.sln = !$.isArray(d) ? [] : d;
						this._search_load(str);
					}, this));
			}
			this._data.search.str = str;
			this._data.search.dom = $();
			this._data.search.res = [];
			this._data.search.opn = [];

			f = new $.vakata.search(str, true, { caseSensitive : s.case_sensitive, fuzzy : s.fuzzy });

			$.each(this._model.data, function (i, v) {
				if(v.text && f.search(v.text).isMatch) {
					r.push(i);
					p = p.concat(v.parents);
				}
			});
			if(r.length) {
				p = $.vakata.array_unique(p);
				this._search_open(p);
				for(i = 0, j = r.length; i < j; i++) {
					f = this.get_node(r[i], true);
					if(f) {
						this._data.search.dom = this._data.search.dom.add(f);
					}
				}
				this._data.search.res = r;
				this._data.search.dom.children(".jstree-anchor").addClass('jstree-search');
			}
			/**
			 * triggered after search is complete
			 * @event
			 * @name search.jstree
			 * @param {jQuery} nodes a jQuery collection of matching nodes
			 * @param {String} str the search string
			 * @param {Array} res a collection of objects represeing the matching nodes
			 * @plugin search
			 */
			this.trigger('search', { nodes : this._data.search.dom, str : str, res : this._data.search.res });
		};
		/**
		 * used to clear the last search (removes classes and shows all nodes if filtering is on)
		 * @name clear_search()
		 * @plugin search
		 * @trigger clear_search.jstree
		 */
		this.clear_search = function () {
			this._data.search.dom.children(".jstree-anchor").removeClass("jstree-search");
			if(this.settings.search.close_opened_onclear) {
				this.close_node(this._data.search.opn, 0);
			}
			/**
			 * triggered after search is complete
			 * @event
			 * @name clear_search.jstree
			 * @param {jQuery} nodes a jQuery collection of matching nodes (the result from the last search)
			 * @param {String} str the search string (the last search string)
			 * @param {Array} res a collection of objects represeing the matching nodes (the result from the last search)
			 * @plugin search
			 */
			this.trigger('clear_search', { 'nodes' : this._data.search.dom, str : this._data.search.str, res : this._data.search.res });
			this._data.search.str = "";
			this._data.search.res = [];
			this._data.search.opn = [];
			this._data.search.dom = $();
		};
		/**
		 * opens nodes that need to be opened to reveal the search results. Used only internally.
		 * @private
		 * @name _search_open(d)
		 * @param {Array} d an array of node IDs
		 * @plugin search
		 */
		this._search_open = function (d) {
			var t = this;
			$.each(d.concat([]), function (i, v) {
				v = document.getElementById(v);
				if(v) {
					if(t.is_closed(v)) {
						t._data.search.opn.push(v.id);
						t.open_node(v, function () { t._search_open(d); }, 0);
					}
				}
			});
		};
		/**
		 * loads nodes that need to be opened to reveal the search results. Used only internally.
		 * @private
		 * @name _search_load(d, str)
		 * @param {String} str the search string
		 * @plugin search
		 */
		this._search_load = function (str) {
			var res = true,
				t = this,
				m = t._model.data;
			if($.isArray(this._data.search.sln)) {
				if(!this._data.search.sln.length) {
					this._data.search.sln = null;
					this.search(str, true);
				}
				else {
					$.each(this._data.search.sln, function (i, v) {
						if(m[v]) {
							$.vakata.array_remove_item(t._data.search.sln, v);
							if(!m[v].state.loaded) {
								t.load_node(v, function (o, s) { if(s) { t._search_load(str); } });
								res = false;
							}
						}
					});
					if(res) {
						this._data.search.sln = [];
						this._search_load(str);
					}
				}
			}
		};
	};

	// helpers
	(function ($) {
		// from http://kiro.me/projects/fuse.html
		$.vakata.search = function(pattern, txt, options) {
			options = options || {};
			if(options.fuzzy !== false) {
				options.fuzzy = true;
			}
			pattern = options.caseSensitive ? pattern : pattern.toLowerCase();
			var MATCH_LOCATION	= options.location || 0,
				MATCH_DISTANCE	= options.distance || 100,
				MATCH_THRESHOLD	= options.threshold || 0.6,
				patternLen = pattern.length,
				matchmask, pattern_alphabet, match_bitapScore, search;
			if(patternLen > 32) {
				options.fuzzy = false;
			}
			if(options.fuzzy) {
				matchmask = 1 << (patternLen - 1);
				pattern_alphabet = (function () {
					var mask = {},
						i = 0;
					for (i = 0; i < patternLen; i++) {
						mask[pattern.charAt(i)] = 0;
					}
					for (i = 0; i < patternLen; i++) {
						mask[pattern.charAt(i)] |= 1 << (patternLen - i - 1);
					}
					return mask;
				}());
				match_bitapScore = function (e, x) {
					var accuracy = e / patternLen,
						proximity = Math.abs(MATCH_LOCATION - x);
					if(!MATCH_DISTANCE) {
						return proximity ? 1.0 : accuracy;
					}
					return accuracy + (proximity / MATCH_DISTANCE);
				};
			}
			search = function (text) {
				text = options.caseSensitive ? text : text.toLowerCase();
				if(pattern === text || text.indexOf(pattern) !== -1) {
					return {
						isMatch: true,
						score: 0
					};
				}
				if(!options.fuzzy) {
					return {
						isMatch: false,
						score: 1
					};
				}
				var i, j,
					textLen = text.length,
					scoreThreshold = MATCH_THRESHOLD,
					bestLoc = text.indexOf(pattern, MATCH_LOCATION),
					binMin, binMid,
					binMax = patternLen + textLen,
					lastRd, start, finish, rd, charMatch,
					score = 1,
					locations = [];
				if (bestLoc !== -1) {
					scoreThreshold = Math.min(match_bitapScore(0, bestLoc), scoreThreshold);
					bestLoc = text.lastIndexOf(pattern, MATCH_LOCATION + patternLen);
					if (bestLoc !== -1) {
						scoreThreshold = Math.min(match_bitapScore(0, bestLoc), scoreThreshold);
					}
				}
				bestLoc = -1;
				for (i = 0; i < patternLen; i++) {
					binMin = 0;
					binMid = binMax;
					while (binMin < binMid) {
						if (match_bitapScore(i, MATCH_LOCATION + binMid) <= scoreThreshold) {
							binMin = binMid;
						} else {
							binMax = binMid;
						}
						binMid = Math.floor((binMax - binMin) / 2 + binMin);
					}
					binMax = binMid;
					start = Math.max(1, MATCH_LOCATION - binMid + 1);
					finish = Math.min(MATCH_LOCATION + binMid, textLen) + patternLen;
					rd = new Array(finish + 2);
					rd[finish + 1] = (1 << i) - 1;
					for (j = finish; j >= start; j--) {
						charMatch = pattern_alphabet[text.charAt(j - 1)];
						if (i === 0) {
							rd[j] = ((rd[j + 1] << 1) | 1) & charMatch;
						} else {
							rd[j] = ((rd[j + 1] << 1) | 1) & charMatch | (((lastRd[j + 1] | lastRd[j]) << 1) | 1) | lastRd[j + 1];
						}
						if (rd[j] & matchmask) {
							score = match_bitapScore(i, j - 1);
							if (score <= scoreThreshold) {
								scoreThreshold = score;
								bestLoc = j - 1;
								locations.push(bestLoc);
								if (bestLoc > MATCH_LOCATION) {
									start = Math.max(1, 2 * MATCH_LOCATION - bestLoc);
								} else {
									break;
								}
							}
						}
					}
					if (match_bitapScore(i + 1, MATCH_LOCATION) > scoreThreshold) {
						break;
					}
					lastRd = rd;
				}
				return {
					isMatch: bestLoc >= 0,
					score: score
				};
			};
			return txt === true ? { 'search' : search } : search(txt);
		};
	}(jQuery));

	// include the search plugin by default
	// $.jstree.defaults.plugins.push("search");

/**
 * ### Sort plugin
 *
 * Autmatically sorts all siblings in the tree according to a sorting function.
 */

	/**
	 * the settings function used to sort the nodes.
	 * It is executed in the tree's context, accepts two nodes as arguments and should return `1` or `-1`.
	 * @name $.jstree.defaults.sort
	 * @plugin sort
	 */
	$.jstree.defaults.sort = function (a, b) {
		//return this.get_type(a) === this.get_type(b) ? (this.get_text(a) > this.get_text(b) ? 1 : -1) : this.get_type(a) >= this.get_type(b);
		return this.get_text(a) > this.get_text(b) ? 1 : -1;
	};
	$.jstree.plugins.sort = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);
			this.element
				.on("model.jstree", $.proxy(function (e, data) {
						this.sort(data.parent, true);
					}, this))
				.on("rename_node.jstree create_node.jstree", $.proxy(function (e, data) {
						this.sort(data.parent || data.node.parent, false);
						this.redraw_node(data.parent || data.node.parent, true);
					}, this))
				.on("move_node.jstree copy_node.jstree", $.proxy(function (e, data) {
						this.sort(data.parent, false);
						this.redraw_node(data.parent, true);
					}, this));
		};
		/**
		 * used to sort a node's children
		 * @private
		 * @name sort(obj [, deep])
		 * @param  {mixed} obj the node
		 * @param {Boolean} deep if set to `true` nodes are sorted recursively.
		 * @plugin sort
		 * @trigger search.jstree
		 */
		this.sort = function (obj, deep) {
			var i, j;
			obj = this.get_node(obj);
			if(obj && obj.children && obj.children.length) {
				obj.children.sort($.proxy(this.settings.sort, this));
				if(deep) {
					for(i = 0, j = obj.children_d.length; i < j; i++) {
						this.sort(obj.children_d[i], false);
					}
				}
			}
		};
	};

	// include the sort plugin by default
	// $.jstree.defaults.plugins.push("sort");

/**
 * ### State plugin
 *
 * Saves the state of the tree (selected nodes, opened nodes) on the user's computer using available options (localStorage, cookies, etc)
 */

	var to = false;
	/**
	 * stores all defaults for the state plugin
	 * @name $.jstree.defaults.state
	 * @plugin state
	 */
	$.jstree.defaults.state = {
		/**
		 * A string for the key to use when saving the current tree (change if using multiple trees in your project). Defaults to `jstree`.
		 * @name $.jstree.defaults.state.key
		 * @plugin state
		 */
		key		: 'jstree',
		/**
		 * A space separated list of events that trigger a state save. Defaults to `changed.jstree open_node.jstree close_node.jstree`.
		 * @name $.jstree.defaults.state.events
		 * @plugin state
		 */
		events	: 'changed.jstree open_node.jstree close_node.jstree',
		/**
		 * Time in milliseconds after which the state will expire. Defaults to 'false' meaning - no expire.
		 * @name $.jstree.defaults.state.ttl
		 * @plugin state
		 */
		ttl		: false,
		/**
		 * A function that will be executed prior to restoring state with one argument - the state object. Can be used to clear unwanted parts of the state.
		 * @name $.jstree.defaults.state.filter
		 * @plugin state
		 */
		filter	: false
	};
	$.jstree.plugins.state = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);
			var bind = $.proxy(function () {
				this.element.on(this.settings.state.events, $.proxy(function () {
					if(to) { clearTimeout(to); }
					to = setTimeout($.proxy(function () { this.save_state(); }, this), 100);
				}, this));
			}, this);
			this.element
				.on("ready.jstree", $.proxy(function (e, data) {
						this.element.one("restore_state.jstree", bind);
						if(!this.restore_state()) { bind(); }
					}, this));
		};
		/**
		 * save the state
		 * @name save_state()
		 * @plugin state
		 */
		this.save_state = function () {
			var st = { 'state' : this.get_state(), 'ttl' : this.settings.state.ttl, 'sec' : +(new Date()) };
			$.vakata.storage.set(this.settings.state.key, JSON.stringify(st));
		};
		/**
		 * restore the state from the user's computer
		 * @name restore_state()
		 * @plugin state
		 */
		this.restore_state = function () {
			var k = $.vakata.storage.get(this.settings.state.key);
			if(!!k) { try { k = JSON.parse(k); } catch(ex) { return false; } }
			if(!!k && k.ttl && k.sec && +(new Date()) - k.sec > k.ttl) { return false; }
			if(!!k && k.state) { k = k.state; }
			if(!!k && $.isFunction(this.settings.state.filter)) { k = this.settings.state.filter.call(this, k); }
			if(!!k) {
				this.element.one("set_state.jstree", function (e, data) { data.instance.trigger('restore_state', { 'state' : $.extend(true, {}, k) }); });
				this.set_state(k);
				return true;
			}
			return false;
		};
		/**
		 * clear the state on the user's computer
		 * @name clear_state()
		 * @plugin state
		 */
		this.clear_state = function () {
			return $.vakata.storage.del(this.settings.state.key);
		};
	};

	(function ($, undefined) {
		$.vakata.storage = {
			// simply specifying the functions in FF throws an error
			set : function (key, val) { return window.localStorage.setItem(key, val); },
			get : function (key) { return window.localStorage.getItem(key); },
			del : function (key) { return window.localStorage.removeItem(key); }
		};
	}(jQuery));

	// include the state plugin by default
	// $.jstree.defaults.plugins.push("state");

/**
 * ### Types plugin
 *
 * Makes it possible to add predefined types for groups of nodes, which make it possible to easily control nesting rules and icon for each group.
 */

	/**
	 * An object storing all types as key value pairs, where the key is the type name and the value is an object that could contain following keys (all optional).
	 * 
	 * * `max_children` the maximum number of immediate children this node type can have. Do not specify or set to `-1` for unlimited.
	 * * `max_depth` the maximum number of nesting this node type can have. A value of `1` would mean that the node can have children, but no grandchildren. Do not specify or set to `-1` for unlimited.
	 * * `valid_children` an array of node type strings, that nodes of this type can have as children. Do not specify or set to `-1` for no limits.
	 * * `icon` a string - can be a path to an icon or a className, if using an image that is in the current directory use a `./` prefix, otherwise it will be detected as a class. Omit to use the default icon from your theme.
	 *
	 * There are two predefined types:
	 * 
	 * * `#` represents the root of the tree, for example `max_children` would control the maximum number of root nodes.
	 * * `default` represents the default node - any settings here will be applied to all nodes that do not have a type specified.
	 * 
	 * @name $.jstree.defaults.types
	 * @plugin types
	 */
	$.jstree.defaults.types = {
		'#' : {},
		'default' : {}
	};

	$.jstree.plugins.types = function (options, parent) {
		this.init = function (el, options) {
			var i, j;
			if(options && options.types && options.types['default']) {
				for(i in options.types) {
					if(i !== "default" && i !== "#" && options.types.hasOwnProperty(i)) {
						for(j in options.types['default']) {
							if(options.types['default'].hasOwnProperty(j) && options.types[i][j] === undefined) {
								options.types[i][j] = options.types['default'][j];
							}
						}
					}
				}
			}
			parent.init.call(this, el, options);
			this._model.data['#'].type = '#';
		};
		this.bind = function () {
			parent.bind.call(this);
			this.element
				.on('model.jstree', $.proxy(function (e, data) {
						var m = this._model.data,
							dpc = data.nodes,
							t = this.settings.types,
							i, j, c = 'default';
						for(i = 0, j = dpc.length; i < j; i++) {
							c = 'default';
							if(m[dpc[i]].original && m[dpc[i]].original.type && t[m[dpc[i]].original.type]) {
								c = m[dpc[i]].original.type;
							}
							if(m[dpc[i]].data && m[dpc[i]].data.jstree && m[dpc[i]].data.jstree.type && t[m[dpc[i]].data.jstree.type]) {
								c = m[dpc[i]].data.jstree.type;
							}
							m[dpc[i]].type = c;
							if(m[dpc[i]].icon === true && t[c].icon !== undefined) {
								m[dpc[i]].icon = t[c].icon;
							}
						}
					}, this));
		};
		this.get_json = function (obj, options, flat) {
			var i, j,
				m = this._model.data,
				opt = options ? $.extend(true, {}, options, {no_id:false}) : {},
				tmp = parent.get_json.call(this, obj, opt, flat);
			if(tmp === false) { return false; }
			if($.isArray(tmp)) {
				for(i = 0, j = tmp.length; i < j; i++) {
					tmp[i].type = tmp[i].id && m[tmp[i].id] && m[tmp[i].id].type ? m[tmp[i].id].type : "default";
					if(options && options.no_id) {
						delete tmp[i].id;
						if(tmp[i].li_attr && tmp[i].li_attr.id) {
							delete tmp[i].li_attr.id;
						}
					}
				}
			}
			else {
				tmp.type = tmp.id && m[tmp.id] && m[tmp.id].type ? m[tmp.id].type : "default";
				if(options && options.no_id) {
					tmp = this._delete_ids(tmp);
				}
			}
			return tmp;
		};
		this._delete_ids = function (tmp) {
			if($.isArray(tmp)) {
				for(var i = 0, j = tmp.length; i < j; i++) {
					tmp[i] = this._delete_ids(tmp[i]);
				}
				return tmp;
			}
			delete tmp.id;
			if(tmp.li_attr && tmp.li_attr.id) {
				delete tmp.li_attr.id;
			}
			if(tmp.children && $.isArray(tmp.children)) {
				tmp.children = this._delete_ids(tmp.children);
			}
			return tmp;
		};
		this.check = function (chk, obj, par, pos) {
			if(parent.check.call(this, chk, obj, par, pos) === false) { return false; }
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = par && par.id ? par : this.get_node(par);
			var m = obj && obj.id ? $.jstree.reference(obj.id) : null, tmp, d, i, j;
			m = m && m._model && m._model.data ? m._model.data : null;
			switch(chk) {
				case "create_node":
				case "move_node":
				case "copy_node":
					if(chk !== 'move_node' || $.inArray(obj.id, par.children) === -1) {
						tmp = this.get_rules(par);
						if(tmp.max_children !== undefined && tmp.max_children !== -1 && tmp.max_children === par.children.length) {
							this._data.core.last_error = { 'error' : 'check', 'plugin' : 'types', 'id' : 'types_01', 'reason' : 'max_children prevents function: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
							return false;
						}
						if(tmp.valid_children !== undefined && tmp.valid_children !== -1 && $.inArray(obj.type, tmp.valid_children) === -1) {
							this._data.core.last_error = { 'error' : 'check', 'plugin' : 'types', 'id' : 'types_02', 'reason' : 'valid_children prevents function: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
							return false;
						}
						if(m && obj.children_d && obj.parents) {
							d = 0;
							for(i = 0, j = obj.children_d.length; i < j; i++) {
								d = Math.max(d, m[obj.children_d[i]].parents.length);
							}
							d = d - obj.parents.length + 1;
						}
						if(d <= 0 || d === undefined) { d = 1; }
						do {
							if(tmp.max_depth !== undefined && tmp.max_depth !== -1 && tmp.max_depth < d) {
								this._data.core.last_error = { 'error' : 'check', 'plugin' : 'types', 'id' : 'types_03', 'reason' : 'max_depth prevents function: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
								return false;
							}
							par = this.get_node(par.parent);
							tmp = this.get_rules(par);
							d++;
						} while(par);
					}
					break;
			}
			return true;
		};
		/**
		 * used to retrieve the type settings object for a node
		 * @name get_rules(obj)
		 * @param {mixed} obj the node to find the rules for
		 * @return {Object}
		 * @plugin types
		 */
		this.get_rules = function (obj) {
			obj = this.get_node(obj);
			if(!obj) { return false; }
			var tmp = this.get_type(obj, true);
			if(tmp.max_depth === undefined) { tmp.max_depth = -1; }
			if(tmp.max_children === undefined) { tmp.max_children = -1; }
			if(tmp.valid_children === undefined) { tmp.valid_children = -1; }
			return tmp;
		};
		/**
		 * used to retrieve the type string or settings object for a node
		 * @name get_type(obj [, rules])
		 * @param {mixed} obj the node to find the rules for
		 * @param {Boolean} rules if set to `true` instead of a string the settings object will be returned
		 * @return {String|Object}
		 * @plugin types
		 */
		this.get_type = function (obj, rules) {
			obj = this.get_node(obj);
			return (!obj) ? false : ( rules ? $.extend({ 'type' : obj.type }, this.settings.types[obj.type]) : obj.type);
		};
		/**
		 * used to change a node's type
		 * @name set_type(obj, type)
		 * @param {mixed} obj the node to change
		 * @param {String} type the new type
		 * @plugin types
		 */
		this.set_type = function (obj, type) {
			var t, t1, t2, old_type, old_icon;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.set_type(obj[t1], type);
				}
				return true;
			}
			t = this.settings.types;
			obj = this.get_node(obj);
			if(!t[type] || !obj) { return false; }
			old_type = obj.type;
			old_icon = this.get_icon(obj);
			obj.type = type;
			if(old_icon === true || (t[old_type] && t[old_type].icon && old_icon === t[old_type].icon)) {
				this.set_icon(obj, t[type].icon !== undefined ? t[type].icon : true);
			}
			return true;
		};
	};
	// include the types plugin by default
	// $.jstree.defaults.plugins.push("types");

/**
 * ### Unique plugin
 *
 * Enforces that no nodes with the same name can coexist as siblings.
 */

	$.jstree.plugins.unique = function (options, parent) {
		this.check = function (chk, obj, par, pos) {
			if(parent.check.call(this, chk, obj, par, pos) === false) { return false; }
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = par && par.id ? par : this.get_node(par);
			if(!par || !par.children) { return true; }
			var n = chk === "rename_node" ? pos : obj.text,
				c = [],
				m = this._model.data, i, j;
			for(i = 0, j = par.children.length; i < j; i++) {
				c.push(m[par.children[i]].text);
			}
			switch(chk) {
				case "delete_node":
					return true;
				case "rename_node":
				case "copy_node":
					i = ($.inArray(n, c) === -1);
					if(!i) {
						this._data.core.last_error = { 'error' : 'check', 'plugin' : 'unique', 'id' : 'unique_01', 'reason' : 'Child with name ' + n + ' already exists. Preventing: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
					}
					return i;
				case "move_node":
					i = (obj.parent === par.id || $.inArray(n, c) === -1);
					if(!i) {
						this._data.core.last_error = { 'error' : 'check', 'plugin' : 'unique', 'id' : 'unique_01', 'reason' : 'Child with name ' + n + ' already exists. Preventing: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
					}
					return i;
			}
			return true;
		};
	};

	// include the unique plugin by default
	// $.jstree.defaults.plugins.push("unique");


/**
 * ### Wholerow plugin
 *
 * Makes each node appear block level. Making selection easier. May cause slow down for large trees in old browsers.
 */

	var div = document.createElement('DIV');
	div.setAttribute('unselectable','on');
	div.className = 'jstree-wholerow';
	div.innerHTML = '&#160;';
	$.jstree.plugins.wholerow = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this.element
				.on('loading', $.proxy(function () {
						div.style.height = this._data.core.li_height + 'px';
					}, this))
				.on('ready.jstree set_state.jstree', $.proxy(function () {
						this.hide_dots();
					}, this))
				.on("ready.jstree", $.proxy(function () {
						this.get_container_ul().addClass('jstree-wholerow-ul');
					}, this))
				.on("deselect_all.jstree", $.proxy(function (e, data) {
						this.element.find('.jstree-wholerow-clicked').removeClass('jstree-wholerow-clicked');
					}, this))
				.on("changed.jstree", $.proxy(function (e, data) {
						this.element.find('.jstree-wholerow-clicked').removeClass('jstree-wholerow-clicked');
						var tmp = false, i, j;
						for(i = 0, j = data.selected.length; i < j; i++) {
							tmp = this.get_node(data.selected[i], true);
							if(tmp && tmp.length) {
								tmp.children('.jstree-wholerow').addClass('jstree-wholerow-clicked');
							}
						}
					}, this))
				.on("open_node.jstree", $.proxy(function (e, data) {
						this.get_node(data.node, true).find('.jstree-clicked').parent().children('.jstree-wholerow').addClass('jstree-wholerow-clicked');
					}, this))
				.on("hover_node.jstree dehover_node.jstree", $.proxy(function (e, data) {
						this.get_node(data.node, true).children('.jstree-wholerow')[e.type === "hover_node"?"addClass":"removeClass"]('jstree-wholerow-hovered');
					}, this))
				.on("contextmenu.jstree", ".jstree-wholerow", $.proxy(function (e) {
						e.preventDefault();
						$(e.currentTarget).closest("li").children("a:eq(0)").trigger('contextmenu',e);
					}, this))
				.on("click.jstree", ".jstree-wholerow", function (e) {
						e.stopImmediatePropagation();
						var tmp = $.Event('click', { metaKey : e.metaKey, ctrlKey : e.ctrlKey, altKey : e.altKey, shiftKey : e.shiftKey });
						$(e.currentTarget).closest("li").children("a:eq(0)").trigger(tmp).focus();
					})
				.on("click.jstree", ".jstree-leaf > .jstree-ocl", $.proxy(function (e) {
						e.stopImmediatePropagation();
						var tmp = $.Event('click', { metaKey : e.metaKey, ctrlKey : e.ctrlKey, altKey : e.altKey, shiftKey : e.shiftKey });
						$(e.currentTarget).closest("li").children("a:eq(0)").trigger(tmp).focus();
					}, this))
				.on("mouseover.jstree", ".jstree-wholerow, .jstree-icon", $.proxy(function (e) {
						e.stopImmediatePropagation();
						this.hover_node(e.currentTarget);
						return false;
					}, this))
				.on("mouseleave.jstree", ".jstree-node", $.proxy(function (e) {
						this.dehover_node(e.currentTarget);
					}, this));
		};
		this.teardown = function () {
			if(this.settings.wholerow) {
				this.element.find(".jstree-wholerow").remove();
			}
			parent.teardown.call(this);
		};
		this.redraw_node = function(obj, deep, callback) {
			obj = parent.redraw_node.call(this, obj, deep, callback);
			if(obj) {
				var tmp = div.cloneNode(true);
				//tmp.style.height = this._data.core.li_height + 'px';
				if($.inArray(obj.id, this._data.core.selected) !== -1) { tmp.className += ' jstree-wholerow-clicked'; }
				obj.insertBefore(tmp, obj.childNodes[0]);
			}
			return obj;
		};
	};
	// include the wholerow plugin by default
	// $.jstree.defaults.plugins.push("wholerow");

}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJqc3RyZWUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypnbG9iYWxzIGpRdWVyeSwgZGVmaW5lLCBleHBvcnRzLCByZXF1aXJlLCB3aW5kb3csIGRvY3VtZW50ICovXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHRkZWZpbmUoWydqcXVlcnknXSwgZmFjdG9yeSk7XG5cdH1cblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0XHRmYWN0b3J5KHJlcXVpcmUoJ2pxdWVyeScpKTtcblx0fVxuXHRlbHNlIHtcblx0XHRmYWN0b3J5KGpRdWVyeSk7XG5cdH1cbn0oZnVuY3Rpb24gKCQsIHVuZGVmaW5lZCkge1xuXHRcInVzZSBzdHJpY3RcIjtcbi8qIVxuICoganNUcmVlIDMuMC4wXG4gKiBodHRwOi8vanN0cmVlLmNvbS9cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMgSXZhbiBCb3poYW5vdiAoaHR0cDovL3Zha2F0YS5jb20pXG4gKlxuICogTGljZW5zZWQgc2FtZSBhcyBqcXVlcnkgLSB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1JVCBMaWNlbnNlXG4gKiAgIGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwXG4gKi9cbi8qIVxuICogaWYgdXNpbmcganNsaW50IHBsZWFzZSBhbGxvdyBmb3IgdGhlIGpRdWVyeSBnbG9iYWwgYW5kIHVzZSBmb2xsb3dpbmcgb3B0aW9uczogXG4gKiBqc2xpbnQ6IGJyb3dzZXI6IHRydWUsIGFzczogdHJ1ZSwgYml0d2lzZTogdHJ1ZSwgY29udGludWU6IHRydWUsIG5vbWVuOiB0cnVlLCBwbHVzcGx1czogdHJ1ZSwgcmVnZXhwOiB0cnVlLCB1bnBhcmFtOiB0cnVlLCB0b2RvOiB0cnVlLCB3aGl0ZTogdHJ1ZVxuICovXG5cblx0Ly8gcHJldmVudCBhbm90aGVyIGxvYWQ/IG1heWJlIHRoZXJlIGlzIGEgYmV0dGVyIHdheT9cblx0aWYoJC5qc3RyZWUpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHQvKipcblx0ICogIyMjIGpzVHJlZSBjb3JlIGZ1bmN0aW9uYWxpdHlcblx0ICovXG5cblx0Ly8gaW50ZXJuYWwgdmFyaWFibGVzXG5cdHZhciBpbnN0YW5jZV9jb3VudGVyID0gMCxcblx0XHRjY3Bfbm9kZSA9IGZhbHNlLFxuXHRcdGNjcF9tb2RlID0gZmFsc2UsXG5cdFx0Y2NwX2luc3QgPSBmYWxzZSxcblx0XHR0aGVtZXNfbG9hZGVkID0gW10sXG5cdFx0c3JjID0gJCgnc2NyaXB0Omxhc3QnKS5hdHRyKCdzcmMnKSxcblx0XHRfZCA9IGRvY3VtZW50LCBfbm9kZSA9IF9kLmNyZWF0ZUVsZW1lbnQoJ0xJJyksIF90ZW1wMSwgX3RlbXAyO1xuXG5cdF9ub2RlLnNldEF0dHJpYnV0ZSgncm9sZScsICd0cmVlaXRlbScpO1xuXHRfdGVtcDEgPSBfZC5jcmVhdGVFbGVtZW50KCdJJyk7XG5cdF90ZW1wMS5jbGFzc05hbWUgPSAnanN0cmVlLWljb24ganN0cmVlLW9jbCc7XG5cdF9ub2RlLmFwcGVuZENoaWxkKF90ZW1wMSk7XG5cdF90ZW1wMSA9IF9kLmNyZWF0ZUVsZW1lbnQoJ0EnKTtcblx0X3RlbXAxLmNsYXNzTmFtZSA9ICdqc3RyZWUtYW5jaG9yJztcblx0X3RlbXAxLnNldEF0dHJpYnV0ZSgnaHJlZicsJyMnKTtcblx0X3RlbXAyID0gX2QuY3JlYXRlRWxlbWVudCgnSScpO1xuXHRfdGVtcDIuY2xhc3NOYW1lID0gJ2pzdHJlZS1pY29uIGpzdHJlZS10aGVtZWljb24nO1xuXHRfdGVtcDEuYXBwZW5kQ2hpbGQoX3RlbXAyKTtcblx0X25vZGUuYXBwZW5kQ2hpbGQoX3RlbXAxKTtcblx0X3RlbXAxID0gX3RlbXAyID0gbnVsbDtcblxuXG5cdC8qKlxuXHQgKiBob2xkcyBhbGwganN0cmVlIHJlbGF0ZWQgZnVuY3Rpb25zIGFuZCB2YXJpYWJsZXMsIGluY2x1ZGluZyB0aGUgYWN0dWFsIGNsYXNzIGFuZCBtZXRob2RzIHRvIGNyZWF0ZSwgYWNjZXNzIGFuZCBtYW5pcHVsYXRlIGluc3RhbmNlcy5cblx0ICogQG5hbWUgJC5qc3RyZWVcblx0ICovXG5cdCQuanN0cmVlID0ge1xuXHRcdC8qKiBcblx0XHQgKiBzcGVjaWZpZXMgdGhlIGpzdHJlZSB2ZXJzaW9uIGluIHVzZVxuXHRcdCAqIEBuYW1lICQuanN0cmVlLnZlcnNpb25cblx0XHQgKi9cblx0XHR2ZXJzaW9uIDogJzMuMC4wLWJldGE5Jyxcblx0XHQvKipcblx0XHQgKiBob2xkcyBhbGwgdGhlIGRlZmF1bHQgb3B0aW9ucyB1c2VkIHdoZW4gY3JlYXRpbmcgbmV3IGluc3RhbmNlc1xuXHRcdCAqIEBuYW1lICQuanN0cmVlLmRlZmF1bHRzXG5cdFx0ICovXG5cdFx0ZGVmYXVsdHMgOiB7XG5cdFx0XHQvKipcblx0XHRcdCAqIGNvbmZpZ3VyZSB3aGljaCBwbHVnaW5zIHdpbGwgYmUgYWN0aXZlIG9uIGFuIGluc3RhbmNlLiBTaG91bGQgYmUgYW4gYXJyYXkgb2Ygc3RyaW5ncywgd2hlcmUgZWFjaCBlbGVtZW50IGlzIGEgcGx1Z2luIG5hbWUuIFRoZSBkZWZhdWx0IGlzIGBbXWBcblx0XHRcdCAqIEBuYW1lICQuanN0cmVlLmRlZmF1bHRzLnBsdWdpbnNcblx0XHRcdCAqL1xuXHRcdFx0cGx1Z2lucyA6IFtdXG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBzdG9yZXMgYWxsIGxvYWRlZCBqc3RyZWUgcGx1Z2lucyAodXNlZCBpbnRlcm5hbGx5KVxuXHRcdCAqIEBuYW1lICQuanN0cmVlLnBsdWdpbnNcblx0XHQgKi9cblx0XHRwbHVnaW5zIDoge30sXG5cdFx0cGF0aCA6IHNyYyAmJiBzcmMuaW5kZXhPZignLycpICE9PSAtMSA/IHNyYy5yZXBsYWNlKC9cXC9bXlxcL10rJC8sJycpIDogJydcblx0fTtcblx0LyoqXG5cdCAqIGNyZWF0ZXMgYSBqc3RyZWUgaW5zdGFuY2Vcblx0ICogQG5hbWUgJC5qc3RyZWUuY3JlYXRlKGVsIFssIG9wdGlvbnNdKVxuXHQgKiBAcGFyYW0ge0RPTUVsZW1lbnR8alF1ZXJ5fFN0cmluZ30gZWwgdGhlIGVsZW1lbnQgdG8gY3JlYXRlIHRoZSBpbnN0YW5jZSBvbiwgY2FuIGJlIGpRdWVyeSBleHRlbmRlZCBvciBhIHNlbGVjdG9yXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIG9wdGlvbnMgZm9yIHRoaXMgaW5zdGFuY2UgKGV4dGVuZHMgYCQuanN0cmVlLmRlZmF1bHRzYClcblx0ICogQHJldHVybiB7anNUcmVlfSB0aGUgbmV3IGluc3RhbmNlXG5cdCAqL1xuXHQkLmpzdHJlZS5jcmVhdGUgPSBmdW5jdGlvbiAoZWwsIG9wdGlvbnMpIHtcblx0XHR2YXIgdG1wID0gbmV3ICQuanN0cmVlLmNvcmUoKytpbnN0YW5jZV9jb3VudGVyKSxcblx0XHRcdG9wdCA9IG9wdGlvbnM7XG5cdFx0b3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCAkLmpzdHJlZS5kZWZhdWx0cywgb3B0aW9ucyk7XG5cdFx0aWYob3B0ICYmIG9wdC5wbHVnaW5zKSB7XG5cdFx0XHRvcHRpb25zLnBsdWdpbnMgPSBvcHQucGx1Z2lucztcblx0XHR9XG5cdFx0JC5lYWNoKG9wdGlvbnMucGx1Z2lucywgZnVuY3Rpb24gKGksIGspIHtcblx0XHRcdGlmKGkgIT09ICdjb3JlJykge1xuXHRcdFx0XHR0bXAgPSB0bXAucGx1Z2luKGssIG9wdGlvbnNba10pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRtcC5pbml0KGVsLCBvcHRpb25zKTtcblx0XHRyZXR1cm4gdG1wO1xuXHR9O1xuXHQvKipcblx0ICogdGhlIGpzdHJlZSBjbGFzcyBjb25zdHJ1Y3RvciwgdXNlZCBvbmx5IGludGVybmFsbHlcblx0ICogQHByaXZhdGVcblx0ICogQG5hbWUgJC5qc3RyZWUuY29yZShpZClcblx0ICogQHBhcmFtIHtOdW1iZXJ9IGlkIHRoaXMgaW5zdGFuY2UncyBpbmRleFxuXHQgKi9cblx0JC5qc3RyZWUuY29yZSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdHRoaXMuX2lkID0gaWQ7XG5cdFx0dGhpcy5fY250ID0gMDtcblx0XHR0aGlzLl9kYXRhID0ge1xuXHRcdFx0Y29yZSA6IHtcblx0XHRcdFx0dGhlbWVzIDoge1xuXHRcdFx0XHRcdG5hbWUgOiBmYWxzZSxcblx0XHRcdFx0XHRkb3RzIDogZmFsc2UsXG5cdFx0XHRcdFx0aWNvbnMgOiBmYWxzZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRzZWxlY3RlZCA6IFtdLFxuXHRcdFx0XHRsYXN0X2Vycm9yIDoge31cblx0XHRcdH1cblx0XHR9O1xuXHR9O1xuXHQvKipcblx0ICogZ2V0IGEgcmVmZXJlbmNlIHRvIGFuIGV4aXN0aW5nIGluc3RhbmNlXG5cdCAqXG5cdCAqIF9fRXhhbXBsZXNfX1xuXHQgKlxuXHQgKlx0Ly8gcHJvdmlkZWQgYSBjb250YWluZXIgd2l0aCBhbiBJRCBvZiBcInRyZWVcIiwgYW5kIGEgbmVzdGVkIG5vZGUgd2l0aCBhbiBJRCBvZiBcImJyYW5jaFwiXG5cdCAqXHQvLyBhbGwgb2YgdGhlcmUgd2lsbCByZXR1cm4gdGhlIHNhbWUgaW5zdGFuY2Vcblx0ICpcdCQuanN0cmVlLnJlZmVyZW5jZSgndHJlZScpO1xuXHQgKlx0JC5qc3RyZWUucmVmZXJlbmNlKCcjdHJlZScpO1xuXHQgKlx0JC5qc3RyZWUucmVmZXJlbmNlKCQoJyN0cmVlJykpO1xuXHQgKlx0JC5qc3RyZWUucmVmZXJlbmNlKGRvY3VtZW50LmdldEVsZW1lbnRCeUlEKCd0cmVlJykpO1xuXHQgKlx0JC5qc3RyZWUucmVmZXJlbmNlKCdicmFuY2gnKTtcblx0ICpcdCQuanN0cmVlLnJlZmVyZW5jZSgnI2JyYW5jaCcpO1xuXHQgKlx0JC5qc3RyZWUucmVmZXJlbmNlKCQoJyNicmFuY2gnKSk7XG5cdCAqXHQkLmpzdHJlZS5yZWZlcmVuY2UoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SUQoJ2JyYW5jaCcpKTtcblx0ICpcblx0ICogQG5hbWUgJC5qc3RyZWUucmVmZXJlbmNlKG5lZWRsZSlcblx0ICogQHBhcmFtIHtET01FbGVtZW50fGpRdWVyeXxTdHJpbmd9IG5lZWRsZVxuXHQgKiBAcmV0dXJuIHtqc1RyZWV8bnVsbH0gdGhlIGluc3RhbmNlIG9yIGBudWxsYCBpZiBub3QgZm91bmRcblx0ICovXG5cdCQuanN0cmVlLnJlZmVyZW5jZSA9IGZ1bmN0aW9uIChuZWVkbGUpIHtcblx0XHRpZihuZWVkbGUgJiYgISQobmVlZGxlKS5sZW5ndGgpIHtcblx0XHRcdGlmKG5lZWRsZS5pZCkge1xuXHRcdFx0XHRuZWVkbGUgPSBuZWVkbGUuaWQ7XG5cdFx0XHR9XG5cdFx0XHR2YXIgdG1wID0gbnVsbDtcblx0XHRcdCQoJy5qc3RyZWUnKS5lYWNoKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0dmFyIGluc3QgPSAkKHRoaXMpLmRhdGEoJ2pzdHJlZScpO1xuXHRcdFx0XHRpZihpbnN0ICYmIGluc3QuX21vZGVsLmRhdGFbbmVlZGxlXSkge1xuXHRcdFx0XHRcdHRtcCA9IGluc3Q7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiB0bXA7XG5cdFx0fVxuXHRcdHJldHVybiAkKG5lZWRsZSkuY2xvc2VzdCgnLmpzdHJlZScpLmRhdGEoJ2pzdHJlZScpO1xuXHR9O1xuXHQvKipcblx0ICogQ3JlYXRlIGFuIGluc3RhbmNlLCBnZXQgYW4gaW5zdGFuY2Ugb3IgaW52b2tlIGEgY29tbWFuZCBvbiBhIGluc3RhbmNlLiBcblx0ICogXG5cdCAqIElmIHRoZXJlIGlzIG5vIGluc3RhbmNlIGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudCBub2RlIGEgbmV3IG9uZSBpcyBjcmVhdGVkIGFuZCBgYXJnYCBpcyB1c2VkIHRvIGV4dGVuZCBgJC5qc3RyZWUuZGVmYXVsdHNgIGZvciB0aGlzIG5ldyBpbnN0YW5jZS4gVGhlcmUgd291bGQgYmUgbm8gcmV0dXJuIHZhbHVlIChjaGFpbmluZyBpcyBub3QgYnJva2VuKS5cblx0ICogXG5cdCAqIElmIHRoZXJlIGlzIGFuIGV4aXN0aW5nIGluc3RhbmNlIGFuZCBgYXJnYCBpcyBhIHN0cmluZyB0aGUgY29tbWFuZCBzcGVjaWZpZWQgYnkgYGFyZ2AgaXMgZXhlY3V0ZWQgb24gdGhlIGluc3RhbmNlLCB3aXRoIGFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cyBwYXNzZWQgdG8gdGhlIGZ1bmN0aW9uLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyBhIHZhbHVlIGl0IHdpbGwgYmUgcmV0dXJuZWQgKGNoYWluaW5nIGNvdWxkIGJyZWFrIGRlcGVuZGluZyBvbiBmdW5jdGlvbikuXG5cdCAqIFxuXHQgKiBJZiB0aGVyZSBpcyBhbiBleGlzdGluZyBpbnN0YW5jZSBhbmQgYGFyZ2AgaXMgbm90IGEgc3RyaW5nIHRoZSBpbnN0YW5jZSBpdHNlbGYgaXMgcmV0dXJuZWQgKHNpbWlsYXIgdG8gYCQuanN0cmVlLnJlZmVyZW5jZWApLlxuXHQgKiBcblx0ICogSW4gYW55IG90aGVyIGNhc2UgLSBub3RoaW5nIGlzIHJldHVybmVkIGFuZCBjaGFpbmluZyBpcyBub3QgYnJva2VuLlxuXHQgKlxuXHQgKiBfX0V4YW1wbGVzX19cblx0ICpcblx0ICpcdCQoJyN0cmVlMScpLmpzdHJlZSgpOyAvLyBjcmVhdGVzIGFuIGluc3RhbmNlXG5cdCAqXHQkKCcjdHJlZTInKS5qc3RyZWUoeyBwbHVnaW5zIDogW10gfSk7IC8vIGNyZWF0ZSBhbiBpbnN0YW5jZSB3aXRoIHNvbWUgb3B0aW9uc1xuXHQgKlx0JCgnI3RyZWUxJykuanN0cmVlKCdvcGVuX25vZGUnLCAnI2JyYW5jaF8xJyk7IC8vIGNhbGwgYSBtZXRob2Qgb24gYW4gZXhpc3RpbmcgaW5zdGFuY2UsIHBhc3NpbmcgYWRkaXRpb25hbCBhcmd1bWVudHNcblx0ICpcdCQoJyN0cmVlMicpLmpzdHJlZSgpOyAvLyBnZXQgYW4gZXhpc3RpbmcgaW5zdGFuY2UgKG9yIGNyZWF0ZSBhbiBpbnN0YW5jZSlcblx0ICpcdCQoJyN0cmVlMicpLmpzdHJlZSh0cnVlKTsgLy8gZ2V0IGFuIGV4aXN0aW5nIGluc3RhbmNlICh3aWxsIG5vdCBjcmVhdGUgbmV3IGluc3RhbmNlKVxuXHQgKlx0JCgnI2JyYW5jaF8xJykuanN0cmVlKCkuc2VsZWN0X25vZGUoJyNicmFuY2hfMScpOyAvLyBnZXQgYW4gaW5zdGFuY2UgKHVzaW5nIGEgbmVzdGVkIGVsZW1lbnQgYW5kIGNhbGwgYSBtZXRob2QpXG5cdCAqXG5cdCAqIEBuYW1lICQoKS5qc3RyZWUoW2FyZ10pXG5cdCAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gYXJnXG5cdCAqIEByZXR1cm4ge01peGVkfVxuXHQgKi9cblx0JC5mbi5qc3RyZWUgPSBmdW5jdGlvbiAoYXJnKSB7XG5cdFx0Ly8gY2hlY2sgZm9yIHN0cmluZyBhcmd1bWVudFxuXHRcdHZhciBpc19tZXRob2RcdD0gKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSxcblx0XHRcdGFyZ3NcdFx0PSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLFxuXHRcdFx0cmVzdWx0XHRcdD0gbnVsbDtcblx0XHR0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuXHRcdFx0Ly8gZ2V0IHRoZSBpbnN0YW5jZSAoaWYgdGhlcmUgaXMgb25lKSBhbmQgbWV0aG9kIChpZiBpdCBleGlzdHMpXG5cdFx0XHR2YXIgaW5zdGFuY2UgPSAkLmpzdHJlZS5yZWZlcmVuY2UodGhpcyksXG5cdFx0XHRcdG1ldGhvZCA9IGlzX21ldGhvZCAmJiBpbnN0YW5jZSA/IGluc3RhbmNlW2FyZ10gOiBudWxsO1xuXHRcdFx0Ly8gaWYgY2FsbGluZyBhIG1ldGhvZCwgYW5kIG1ldGhvZCBpcyBhdmFpbGFibGUgLSBleGVjdXRlIG9uIHRoZSBpbnN0YW5jZVxuXHRcdFx0cmVzdWx0ID0gaXNfbWV0aG9kICYmIG1ldGhvZCA/XG5cdFx0XHRcdG1ldGhvZC5hcHBseShpbnN0YW5jZSwgYXJncykgOlxuXHRcdFx0XHRudWxsO1xuXHRcdFx0Ly8gaWYgdGhlcmUgaXMgbm8gaW5zdGFuY2UgYW5kIG5vIG1ldGhvZCBpcyBiZWluZyBjYWxsZWQgLSBjcmVhdGUgb25lXG5cdFx0XHRpZighaW5zdGFuY2UgJiYgIWlzX21ldGhvZCAmJiAoYXJnID09PSB1bmRlZmluZWQgfHwgJC5pc1BsYWluT2JqZWN0KGFyZykpKSB7XG5cdFx0XHRcdCQodGhpcykuZGF0YSgnanN0cmVlJywgbmV3ICQuanN0cmVlLmNyZWF0ZSh0aGlzLCBhcmcpKTtcblx0XHRcdH1cblx0XHRcdC8vIGlmIHRoZXJlIGlzIGFuIGluc3RhbmNlIGFuZCBubyBtZXRob2QgaXMgY2FsbGVkIC0gcmV0dXJuIHRoZSBpbnN0YW5jZVxuXHRcdFx0aWYoaW5zdGFuY2UgJiYgIWlzX21ldGhvZCkge1xuXHRcdFx0XHRyZXN1bHQgPSBpbnN0YW5jZTtcblx0XHRcdH1cblx0XHRcdC8vIGlmIHRoZXJlIHdhcyBhIG1ldGhvZCBjYWxsIHdoaWNoIHJldHVybmVkIGEgcmVzdWx0IC0gYnJlYWsgYW5kIHJldHVybiB0aGUgdmFsdWVcblx0XHRcdGlmKHJlc3VsdCAhPT0gbnVsbCAmJiByZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gaWYgdGhlcmUgd2FzIGEgbWV0aG9kIGNhbGwgd2l0aCBhIHZhbGlkIHJldHVybiB2YWx1ZSAtIHJldHVybiB0aGF0LCBvdGhlcndpc2UgY29udGludWUgdGhlIGNoYWluXG5cdFx0cmV0dXJuIHJlc3VsdCAhPT0gbnVsbCAmJiByZXN1bHQgIT09IHVuZGVmaW5lZCA/XG5cdFx0XHRyZXN1bHQgOiB0aGlzO1xuXHR9O1xuXHQvKipcblx0ICogdXNlZCB0byBmaW5kIGVsZW1lbnRzIGNvbnRhaW5pbmcgYW4gaW5zdGFuY2Vcblx0ICpcblx0ICogX19FeGFtcGxlc19fXG5cdCAqXG5cdCAqXHQkKCdkaXY6anN0cmVlJykuZWFjaChmdW5jdGlvbiAoKSB7XG5cdCAqXHRcdCQodGhpcykuanN0cmVlKCdkZXN0cm95Jyk7XG5cdCAqXHR9KTtcblx0ICpcblx0ICogQG5hbWUgJCgnOmpzdHJlZScpXG5cdCAqIEByZXR1cm4ge2pRdWVyeX1cblx0ICovXG5cdCQuZXhwclsnOiddLmpzdHJlZSA9ICQuZXhwci5jcmVhdGVQc2V1ZG8oZnVuY3Rpb24oc2VhcmNoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGEpIHtcblx0XHRcdHJldHVybiAkKGEpLmhhc0NsYXNzKCdqc3RyZWUnKSAmJlxuXHRcdFx0XHQkKGEpLmRhdGEoJ2pzdHJlZScpICE9PSB1bmRlZmluZWQ7XG5cdFx0fTtcblx0fSk7XG5cblx0LyoqXG5cdCAqIHN0b3JlcyBhbGwgZGVmYXVsdHMgZm9yIHRoZSBjb3JlXG5cdCAqIEBuYW1lICQuanN0cmVlLmRlZmF1bHRzLmNvcmVcblx0ICovXG5cdCQuanN0cmVlLmRlZmF1bHRzLmNvcmUgPSB7XG5cdFx0LyoqXG5cdFx0ICogZGF0YSBjb25maWd1cmF0aW9uXG5cdFx0ICogXG5cdFx0ICogSWYgbGVmdCBhcyBgZmFsc2VgIHRoZSBIVE1MIGluc2lkZSB0aGUganN0cmVlIGNvbnRhaW5lciBlbGVtZW50IGlzIHVzZWQgdG8gcG9wdWxhdGUgdGhlIHRyZWUgKHRoYXQgc2hvdWxkIGJlIGFuIHVub3JkZXJlZCBsaXN0IHdpdGggbGlzdCBpdGVtcykuXG5cdFx0ICpcblx0XHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpbiBhIEhUTUwgc3RyaW5nIG9yIGEgSlNPTiBhcnJheSBoZXJlLlxuXHRcdCAqIFxuXHRcdCAqIEl0IGlzIHBvc3NpYmxlIHRvIHBhc3MgaW4gYSBzdGFuZGFyZCBqUXVlcnktbGlrZSBBSkFYIGNvbmZpZyBhbmQganN0cmVlIHdpbGwgYXV0b21hdGljYWxseSBkZXRlcm1pbmUgaWYgdGhlIHJlc3BvbnNlIGlzIEpTT04gb3IgSFRNTCBhbmQgdXNlIHRoYXQgdG8gcG9wdWxhdGUgdGhlIHRyZWUuIFxuXHRcdCAqIEluIGFkZGl0aW9uIHRvIHRoZSBzdGFuZGFyZCBqUXVlcnkgYWpheCBvcHRpb25zIGhlcmUgeW91IGNhbiBzdXBweSBmdW5jdGlvbnMgZm9yIGBkYXRhYCBhbmQgYHVybGAsIHRoZSBmdW5jdGlvbnMgd2lsbCBiZSBydW4gaW4gdGhlIGN1cnJlbnQgaW5zdGFuY2UncyBzY29wZSBhbmQgYSBwYXJhbSB3aWxsIGJlIHBhc3NlZCBpbmRpY2F0aW5nIHdoaWNoIG5vZGUgaXMgYmVpbmcgbG9hZGVkLCB0aGUgcmV0dXJuIHZhbHVlIG9mIHRob3NlIGZ1bmN0aW9ucyB3aWxsIGJlIHVzZWQuXG5cdFx0ICogXG5cdFx0ICogVGhlIGxhc3Qgb3B0aW9uIGlzIHRvIHNwZWNpZnkgYSBmdW5jdGlvbiwgdGhhdCBmdW5jdGlvbiB3aWxsIHJlY2VpdmUgdGhlIG5vZGUgYmVpbmcgbG9hZGVkIGFzIGFyZ3VtZW50IGFuZCBhIHNlY29uZCBwYXJhbSB3aGljaCBpcyBhIGZ1bmN0aW9uIHdoaWNoIHNob3VsZCBiZSBjYWxsZWQgd2l0aCB0aGUgcmVzdWx0LlxuXHRcdCAqXG5cdFx0ICogX19FeGFtcGxlc19fXG5cdFx0ICpcblx0XHQgKlx0Ly8gQUpBWFxuXHRcdCAqXHQkKCcjdHJlZScpLmpzdHJlZSh7XG5cdFx0ICpcdFx0J2NvcmUnIDoge1xuXHRcdCAqXHRcdFx0J2RhdGEnIDoge1xuXHRcdCAqXHRcdFx0XHQndXJsJyA6ICcvZ2V0L2NoaWxkcmVuLycsXG5cdFx0ICpcdFx0XHRcdCdkYXRhJyA6IGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0ICpcdFx0XHRcdFx0cmV0dXJuIHsgJ2lkJyA6IG5vZGUuaWQgfTtcblx0XHQgKlx0XHRcdFx0fVxuXHRcdCAqXHRcdFx0fVxuXHRcdCAqXHRcdH0pO1xuXHRcdCAqXG5cdFx0ICpcdC8vIGRpcmVjdCBkYXRhXG5cdFx0ICpcdCQoJyN0cmVlJykuanN0cmVlKHtcblx0XHQgKlx0XHQnY29yZScgOiB7XG5cdFx0ICpcdFx0XHQnZGF0YScgOiBbXG5cdFx0ICpcdFx0XHRcdCdTaW1wbGUgcm9vdCBub2RlJyxcblx0XHQgKlx0XHRcdFx0e1xuXHRcdCAqXHRcdFx0XHRcdCdpZCcgOiAnbm9kZV8yJyxcblx0XHQgKlx0XHRcdFx0XHQndGV4dCcgOiAnUm9vdCBub2RlIHdpdGggb3B0aW9ucycsXG5cdFx0ICpcdFx0XHRcdFx0J3N0YXRlJyA6IHsgJ29wZW5lZCcgOiB0cnVlLCAnc2VsZWN0ZWQnIDogdHJ1ZSB9LFxuXHRcdCAqXHRcdFx0XHRcdCdjaGlsZHJlbicgOiBbIHsgJ3RleHQnIDogJ0NoaWxkIDEnIH0sICdDaGlsZCAyJ11cblx0XHQgKlx0XHRcdFx0fVxuXHRcdCAqXHRcdFx0XVxuXHRcdCAqXHRcdH0pO1xuXHRcdCAqXHRcblx0XHQgKlx0Ly8gZnVuY3Rpb25cblx0XHQgKlx0JCgnI3RyZWUnKS5qc3RyZWUoe1xuXHRcdCAqXHRcdCdjb3JlJyA6IHtcblx0XHQgKlx0XHRcdCdkYXRhJyA6IGZ1bmN0aW9uIChvYmosIGNhbGxiYWNrKSB7XG5cdFx0ICpcdFx0XHRcdGNhbGxiYWNrLmNhbGwodGhpcywgWydSb290IDEnLCAnUm9vdCAyJ10pO1xuXHRcdCAqXHRcdFx0fVxuXHRcdCAqXHRcdH0pO1xuXHRcdCAqIFxuXHRcdCAqIEBuYW1lICQuanN0cmVlLmRlZmF1bHRzLmNvcmUuZGF0YVxuXHRcdCAqL1xuXHRcdGRhdGFcdFx0XHQ6IGZhbHNlLFxuXHRcdC8qKlxuXHRcdCAqIGNvbmZpZ3VyZSB0aGUgdmFyaW91cyBzdHJpbmdzIHVzZWQgdGhyb3VnaG91dCB0aGUgdHJlZVxuXHRcdCAqXG5cdFx0ICogWW91IGNhbiB1c2UgYW4gb2JqZWN0IHdoZXJlIHRoZSBrZXkgaXMgdGhlIHN0cmluZyB5b3UgbmVlZCB0byByZXBsYWNlIGFuZCB0aGUgdmFsdWUgaXMgeW91ciByZXBsYWNlbWVudC5cblx0XHQgKiBBbm90aGVyIG9wdGlvbiBpcyB0byBzcGVjaWZ5IGEgZnVuY3Rpb24gd2hpY2ggd2lsbCBiZSBjYWxsZWQgd2l0aCBhbiBhcmd1bWVudCBvZiB0aGUgbmVlZGVkIHN0cmluZyBhbmQgc2hvdWxkIHJldHVybiB0aGUgcmVwbGFjZW1lbnQuXG5cdFx0ICogSWYgbGVmdCBhcyBgZmFsc2VgIG5vIHJlcGxhY2VtZW50IGlzIG1hZGUuXG5cdFx0ICpcblx0XHQgKiBfX0V4YW1wbGVzX19cblx0XHQgKlxuXHRcdCAqXHQkKCcjdHJlZScpLmpzdHJlZSh7XG5cdFx0ICpcdFx0J2NvcmUnIDoge1xuXHRcdCAqXHRcdFx0J3N0cmluZ3MnIDoge1xuXHRcdCAqXHRcdFx0XHQnTG9hZGluZy4uLicgOiAnUGxlYXNlIHdhaXQgLi4uJ1xuXHRcdCAqXHRcdFx0fVxuXHRcdCAqXHRcdH1cblx0XHQgKlx0fSk7XG5cdFx0ICpcblx0XHQgKiBAbmFtZSAkLmpzdHJlZS5kZWZhdWx0cy5jb3JlLnN0cmluZ3Ncblx0XHQgKi9cblx0XHRzdHJpbmdzXHRcdFx0OiBmYWxzZSxcblx0XHQvKipcblx0XHQgKiBkZXRlcm1pbmVzIHdoYXQgaGFwcGVucyB3aGVuIGEgdXNlciB0cmllcyB0byBtb2RpZnkgdGhlIHN0cnVjdHVyZSBvZiB0aGUgdHJlZVxuXHRcdCAqIElmIGxlZnQgYXMgYGZhbHNlYCBhbGwgb3BlcmF0aW9ucyBsaWtlIGNyZWF0ZSwgcmVuYW1lLCBkZWxldGUsIG1vdmUgb3IgY29weSBhcmUgcHJldmVudGVkLlxuXHRcdCAqIFlvdSBjYW4gc2V0IHRoaXMgdG8gYHRydWVgIHRvIGFsbG93IGFsbCBpbnRlcmFjdGlvbnMgb3IgdXNlIGEgZnVuY3Rpb24gdG8gaGF2ZSBiZXR0ZXIgY29udHJvbC5cblx0XHQgKlxuXHRcdCAqIF9fRXhhbXBsZXNfX1xuXHRcdCAqXG5cdFx0ICpcdCQoJyN0cmVlJykuanN0cmVlKHtcblx0XHQgKlx0XHQnY29yZScgOiB7XG5cdFx0ICpcdFx0XHQnY2hlY2tfY2FsbGJhY2snIDogZnVuY3Rpb24gKG9wZXJhdGlvbiwgbm9kZSwgbm9kZV9wYXJlbnQsIG5vZGVfcG9zaXRpb24pIHtcblx0XHQgKlx0XHRcdFx0Ly8gb3BlcmF0aW9uIGNhbiBiZSAnY3JlYXRlX25vZGUnLCAncmVuYW1lX25vZGUnLCAnZGVsZXRlX25vZGUnLCAnbW92ZV9ub2RlJyBvciAnY29weV9ub2RlJ1xuXHRcdCAqXHRcdFx0XHQvLyBpbiBjYXNlIG9mICdyZW5hbWVfbm9kZScgbm9kZV9wb3NpdGlvbiBpcyBmaWxsZWQgd2l0aCB0aGUgbmV3IG5vZGUgbmFtZVxuXHRcdCAqXHRcdFx0XHRyZXR1cm4gb3BlcmF0aW9uID09PSAncmVuYW1lX25vZGUnID8gdHJ1ZSA6IGZhbHNlO1xuXHRcdCAqXHRcdFx0fVxuXHRcdCAqXHRcdH1cblx0XHQgKlx0fSk7XG5cdFx0ICogXG5cdFx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuY29yZS5jaGVja19jYWxsYmFja1xuXHRcdCAqL1xuXHRcdGNoZWNrX2NhbGxiYWNrXHQ6IGZhbHNlLFxuXHRcdC8qKlxuXHRcdCAqIGEgY2FsbGJhY2sgY2FsbGVkIHdpdGggYSBzaW5nbGUgb2JqZWN0IHBhcmFtZXRlciBpbiB0aGUgaW5zdGFuY2UncyBzY29wZSB3aGVuIHNvbWV0aGluZyBnb2VzIHdyb25nIChvcGVyYXRpb24gcHJldmVudGVkLCBhamF4IGZhaWxlZCwgZXRjKVxuXHRcdCAqIEBuYW1lICQuanN0cmVlLmRlZmF1bHRzLmNvcmUuZXJyb3Jcblx0XHQgKi9cblx0XHRlcnJvclx0XHRcdDogJC5ub29wLFxuXHRcdC8qKlxuXHRcdCAqIHRoZSBvcGVuIC8gY2xvc2UgYW5pbWF0aW9uIGR1cmF0aW9uIGluIG1pbGxpc2Vjb25kcyAtIHNldCB0aGlzIHRvIGBmYWxzZWAgdG8gZGlzYWJsZSB0aGUgYW5pbWF0aW9uIChkZWZhdWx0IGlzIGAyMDBgKVxuXHRcdCAqIEBuYW1lICQuanN0cmVlLmRlZmF1bHRzLmNvcmUuYW5pbWF0aW9uXG5cdFx0ICovXG5cdFx0YW5pbWF0aW9uXHRcdDogMjAwLFxuXHRcdC8qKlxuXHRcdCAqIGEgYm9vbGVhbiBpbmRpY2F0aW5nIGlmIG11bHRpcGxlIG5vZGVzIGNhbiBiZSBzZWxlY3RlZFxuXHRcdCAqIEBuYW1lICQuanN0cmVlLmRlZmF1bHRzLmNvcmUubXVsdGlwbGVcblx0XHQgKi9cblx0XHRtdWx0aXBsZVx0XHQ6IHRydWUsXG5cdFx0LyoqXG5cdFx0ICogdGhlbWUgY29uZmlndXJhdGlvbiBvYmplY3Rcblx0XHQgKiBAbmFtZSAkLmpzdHJlZS5kZWZhdWx0cy5jb3JlLnRoZW1lc1xuXHRcdCAqL1xuXHRcdHRoZW1lc1x0XHRcdDoge1xuXHRcdFx0LyoqXG5cdFx0XHQgKiB0aGUgbmFtZSBvZiB0aGUgdGhlbWUgdG8gdXNlIChpZiBsZWZ0IGFzIGBmYWxzZWAgdGhlIGRlZmF1bHQgdGhlbWUgaXMgdXNlZClcblx0XHRcdCAqIEBuYW1lICQuanN0cmVlLmRlZmF1bHRzLmNvcmUudGhlbWVzLm5hbWVcblx0XHRcdCAqL1xuXHRcdFx0bmFtZVx0XHRcdDogZmFsc2UsXG5cdFx0XHQvKipcblx0XHRcdCAqIHRoZSBVUkwgb2YgdGhlIHRoZW1lJ3MgQ1NTIGZpbGUsIGxlYXZlIHRoaXMgYXMgYGZhbHNlYCBpZiB5b3UgaGF2ZSBtYW51YWxseSBpbmNsdWRlZCB0aGUgdGhlbWUgQ1NTIChyZWNvbW1lbmRlZCkuIFlvdSBjYW4gc2V0IHRoaXMgdG8gYHRydWVgIHRvbyB3aGljaCB3aWxsIHRyeSB0byBhdXRvbG9hZCB0aGUgdGhlbWUuXG5cdFx0XHQgKiBAbmFtZSAkLmpzdHJlZS5kZWZhdWx0cy5jb3JlLnRoZW1lcy51cmxcblx0XHRcdCAqL1xuXHRcdFx0dXJsXHRcdFx0XHQ6IGZhbHNlLFxuXHRcdFx0LyoqXG5cdFx0XHQgKiB0aGUgbG9jYXRpb24gb2YgYWxsIGpzdHJlZSB0aGVtZXMgLSBvbmx5IHVzZWQgaWYgYHVybGAgaXMgc2V0IHRvIGB0cnVlYFxuXHRcdFx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuY29yZS50aGVtZXMuZGlyXG5cdFx0XHQgKi9cblx0XHRcdGRpclx0XHRcdFx0OiBmYWxzZSxcblx0XHRcdC8qKlxuXHRcdFx0ICogYSBib29sZWFuIGluZGljYXRpbmcgaWYgY29ubmVjdGluZyBkb3RzIGFyZSBzaG93blxuXHRcdFx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuY29yZS50aGVtZXMuZG90c1xuXHRcdFx0ICovXG5cdFx0XHRkb3RzXHRcdFx0OiB0cnVlLFxuXHRcdFx0LyoqXG5cdFx0XHQgKiBhIGJvb2xlYW4gaW5kaWNhdGluZyBpZiBub2RlIGljb25zIGFyZSBzaG93blxuXHRcdFx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuY29yZS50aGVtZXMuaWNvbnNcblx0XHRcdCAqL1xuXHRcdFx0aWNvbnNcdFx0XHQ6IHRydWUsXG5cdFx0XHQvKipcblx0XHRcdCAqIGEgYm9vbGVhbiBpbmRpY2F0aW5nIGlmIHRoZSB0cmVlIGJhY2tncm91bmQgaXMgc3RyaXBlZFxuXHRcdFx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuY29yZS50aGVtZXMuc3RyaXBlc1xuXHRcdFx0ICovXG5cdFx0XHRzdHJpcGVzXHRcdFx0OiBmYWxzZSxcblx0XHRcdC8qKlxuXHRcdFx0ICogYSBzdHJpbmcgKG9yIGJvb2xlYW4gYGZhbHNlYCkgc3BlY2lmeWluZyB0aGUgdGhlbWUgdmFyaWFudCB0byB1c2UgKGlmIHRoZSB0aGVtZSBzdXBwb3J0cyB2YXJpYW50cylcblx0XHRcdCAqIEBuYW1lICQuanN0cmVlLmRlZmF1bHRzLmNvcmUudGhlbWVzLnZhcmlhbnRcblx0XHRcdCAqL1xuXHRcdFx0dmFyaWFudFx0XHRcdDogZmFsc2UsXG5cdFx0XHQvKipcblx0XHRcdCAqIGEgYm9vbGVhbiBzcGVjaWZ5aW5nIGlmIGEgcmVwb25zaXZlIHZlcnNpb24gb2YgdGhlIHRoZW1lIHNob3VsZCBraWNrIGluIG9uIHNtYWxsZXIgc2NyZWVucyAoaWYgdGhlIHRoZW1lIHN1cHBvcnRzIGl0KS4gRGVmYXVsdHMgdG8gYHRydWVgLlxuXHRcdFx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuY29yZS50aGVtZXMucmVzcG9uc2l2ZVxuXHRcdFx0ICovXG5cdFx0XHRyZXNwb25zaXZlXHRcdDogdHJ1ZVxuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogaWYgbGVmdCBhcyBgdHJ1ZWAgYWxsIHBhcmVudHMgb2YgYWxsIHNlbGVjdGVkIG5vZGVzIHdpbGwgYmUgb3BlbmVkIG9uY2UgdGhlIHRyZWUgbG9hZHMgKHNvIHRoYXQgYWxsIHNlbGVjdGVkIG5vZGVzIGFyZSB2aXNpYmxlIHRvIHRoZSB1c2VyKVxuXHRcdCAqIEBuYW1lICQuanN0cmVlLmRlZmF1bHRzLmNvcmUuZXhwYW5kX3NlbGVjdGVkX29ubG9hZFxuXHRcdCAqL1xuXHRcdGV4cGFuZF9zZWxlY3RlZF9vbmxvYWQgOiB0cnVlXG5cdH07XG5cdCQuanN0cmVlLmNvcmUucHJvdG90eXBlID0ge1xuXHRcdC8qKlxuXHRcdCAqIHVzZWQgdG8gZGVjb3JhdGUgYW4gaW5zdGFuY2Ugd2l0aCBhIHBsdWdpbi4gVXNlZCBpbnRlcm5hbGx5LlxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICogQG5hbWUgcGx1Z2luKGRlY28gWywgb3B0c10pXG5cdFx0ICogQHBhcmFtICB7U3RyaW5nfSBkZWNvIHRoZSBwbHVnaW4gdG8gZGVjb3JhdGUgd2l0aFxuXHRcdCAqIEBwYXJhbSAge09iamVjdH0gb3B0cyBvcHRpb25zIGZvciB0aGUgcGx1Z2luXG5cdFx0ICogQHJldHVybiB7anNUcmVlfVxuXHRcdCAqL1xuXHRcdHBsdWdpbiA6IGZ1bmN0aW9uIChkZWNvLCBvcHRzKSB7XG5cdFx0XHR2YXIgQ2hpbGQgPSAkLmpzdHJlZS5wbHVnaW5zW2RlY29dO1xuXHRcdFx0aWYoQ2hpbGQpIHtcblx0XHRcdFx0dGhpcy5fZGF0YVtkZWNvXSA9IHt9O1xuXHRcdFx0XHRDaGlsZC5wcm90b3R5cGUgPSB0aGlzO1xuXHRcdFx0XHRyZXR1cm4gbmV3IENoaWxkKG9wdHMsIHRoaXMpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiB1c2VkIHRvIGRlY29yYXRlIGFuIGluc3RhbmNlIHdpdGggYSBwbHVnaW4uIFVzZWQgaW50ZXJuYWxseS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqIEBuYW1lIGluaXQoZWwsIG9wdG9ucylcblx0XHQgKiBAcGFyYW0ge0RPTUVsZW1lbnR8alF1ZXJ5fFN0cmluZ30gZWwgdGhlIGVsZW1lbnQgd2UgYXJlIHRyYW5zZm9ybWluZ1xuXHRcdCAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIG9wdGlvbnMgZm9yIHRoaXMgaW5zdGFuY2Vcblx0XHQgKiBAdHJpZ2dlciBpbml0LmpzdHJlZSwgbG9hZGluZy5qc3RyZWUsIGxvYWRlZC5qc3RyZWUsIHJlYWR5LmpzdHJlZSwgY2hhbmdlZC5qc3RyZWVcblx0XHQgKi9cblx0XHRpbml0IDogZnVuY3Rpb24gKGVsLCBvcHRpb25zKSB7XG5cdFx0XHR0aGlzLl9tb2RlbCA9IHtcblx0XHRcdFx0ZGF0YSA6IHtcblx0XHRcdFx0XHQnIycgOiB7XG5cdFx0XHRcdFx0XHRpZCA6ICcjJyxcblx0XHRcdFx0XHRcdHBhcmVudCA6IG51bGwsXG5cdFx0XHRcdFx0XHRwYXJlbnRzIDogW10sXG5cdFx0XHRcdFx0XHRjaGlsZHJlbiA6IFtdLFxuXHRcdFx0XHRcdFx0Y2hpbGRyZW5fZCA6IFtdLFxuXHRcdFx0XHRcdFx0c3RhdGUgOiB7IGxvYWRlZCA6IGZhbHNlIH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGNoYW5nZWQgOiBbXSxcblx0XHRcdFx0Zm9yY2VfZnVsbF9yZWRyYXcgOiBmYWxzZSxcblx0XHRcdFx0cmVkcmF3X3RpbWVvdXQgOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdF9zdGF0ZSA6IHtcblx0XHRcdFx0XHRsb2FkZWQgOiB0cnVlLFxuXHRcdFx0XHRcdG9wZW5lZCA6IGZhbHNlLFxuXHRcdFx0XHRcdHNlbGVjdGVkIDogZmFsc2UsXG5cdFx0XHRcdFx0ZGlzYWJsZWQgOiBmYWxzZVxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHR0aGlzLmVsZW1lbnQgPSAkKGVsKS5hZGRDbGFzcygnanN0cmVlIGpzdHJlZS0nICsgdGhpcy5faWQpO1xuXHRcdFx0dGhpcy5zZXR0aW5ncyA9IG9wdGlvbnM7XG5cdFx0XHR0aGlzLmVsZW1lbnQuYmluZChcImRlc3Ryb3llZFwiLCAkLnByb3h5KHRoaXMudGVhcmRvd24sIHRoaXMpKTtcblxuXHRcdFx0dGhpcy5fZGF0YS5jb3JlLnJlYWR5ID0gZmFsc2U7XG5cdFx0XHR0aGlzLl9kYXRhLmNvcmUubG9hZGVkID0gZmFsc2U7XG5cdFx0XHR0aGlzLl9kYXRhLmNvcmUucnRsID0gKHRoaXMuZWxlbWVudC5jc3MoXCJkaXJlY3Rpb25cIikgPT09IFwicnRsXCIpO1xuXHRcdFx0dGhpcy5lbGVtZW50W3RoaXMuX2RhdGEuY29yZS5ydGwgPyAnYWRkQ2xhc3MnIDogJ3JlbW92ZUNsYXNzJ10oXCJqc3RyZWUtcnRsXCIpO1xuXHRcdFx0dGhpcy5lbGVtZW50LmF0dHIoJ3JvbGUnLCd0cmVlJyk7XG5cblx0XHRcdHRoaXMuYmluZCgpO1xuXHRcdFx0LyoqXG5cdFx0XHQgKiB0cmlnZ2VyZWQgYWZ0ZXIgYWxsIGV2ZW50cyBhcmUgYm91bmRcblx0XHRcdCAqIEBldmVudFxuXHRcdFx0ICogQG5hbWUgaW5pdC5qc3RyZWVcblx0XHRcdCAqL1xuXHRcdFx0dGhpcy50cmlnZ2VyKFwiaW5pdFwiKTtcblxuXHRcdFx0dGhpcy5fZGF0YS5jb3JlLm9yaWdpbmFsX2NvbnRhaW5lcl9odG1sID0gdGhpcy5lbGVtZW50LmZpbmQoXCIgPiB1bCA+IGxpXCIpLmNsb25lKHRydWUpO1xuXHRcdFx0dGhpcy5fZGF0YS5jb3JlLm9yaWdpbmFsX2NvbnRhaW5lcl9odG1sXG5cdFx0XHRcdC5maW5kKFwibGlcIikuYWRkQmFjaygpXG5cdFx0XHRcdC5jb250ZW50cygpLmZpbHRlcihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5ub2RlVHlwZSA9PT0gMyAmJiAoIXRoaXMubm9kZVZhbHVlIHx8IC9eXFxzKyQvLnRlc3QodGhpcy5ub2RlVmFsdWUpKTtcblx0XHRcdFx0fSlcblx0XHRcdFx0LnJlbW92ZSgpO1xuXHRcdFx0dGhpcy5lbGVtZW50Lmh0bWwoXCI8XCIrXCJ1bCBjbGFzcz0nanN0cmVlLWNvbnRhaW5lci11bCc+PFwiK1wibGkgY2xhc3M9J2pzdHJlZS1pbml0aWFsLW5vZGUganN0cmVlLWxvYWRpbmcganN0cmVlLWxlYWYganN0cmVlLWxhc3QnPjxpIGNsYXNzPSdqc3RyZWUtaWNvbiBqc3RyZWUtb2NsJz48L2k+PFwiK1wiYSBjbGFzcz0nanN0cmVlLWFuY2hvcicgaHJlZj0nIyc+PGkgY2xhc3M9J2pzdHJlZS1pY29uIGpzdHJlZS10aGVtZWljb24taGlkZGVuJz48L2k+XCIgKyB0aGlzLmdldF9zdHJpbmcoXCJMb2FkaW5nIC4uLlwiKSArIFwiPC9hPjwvbGk+PC91bD5cIik7XG5cdFx0XHR0aGlzLl9kYXRhLmNvcmUubGlfaGVpZ2h0ID0gdGhpcy5nZXRfY29udGFpbmVyX3VsKCkuY2hpbGRyZW4oXCJsaTplcSgwKVwiKS5oZWlnaHQoKSB8fCAxODtcblx0XHRcdC8qKlxuXHRcdFx0ICogdHJpZ2dlcmVkIGFmdGVyIHRoZSBsb2FkaW5nIHRleHQgaXMgc2hvd24gYW5kIGJlZm9yZSBsb2FkaW5nIHN0YXJ0c1xuXHRcdFx0ICogQGV2ZW50XG5cdFx0XHQgKiBAbmFtZSBsb2FkaW5nLmpzdHJlZVxuXHRcdFx0ICovXG5cdFx0XHR0aGlzLnRyaWdnZXIoXCJsb2FkaW5nXCIpO1xuXHRcdFx0dGhpcy5sb2FkX25vZGUoJyMnKTtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIGRlc3Ryb3kgYW4gaW5zdGFuY2Vcblx0XHQgKiBAbmFtZSBkZXN0cm95KClcblx0XHQgKi9cblx0XHRkZXN0cm95IDogZnVuY3Rpb24gKCkge1xuXHRcdFx0dGhpcy5lbGVtZW50LnVuYmluZChcImRlc3Ryb3llZFwiLCB0aGlzLnRlYXJkb3duKTtcblx0XHRcdHRoaXMudGVhcmRvd24oKTtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIHBhcnQgb2YgdGhlIGRlc3Ryb3lpbmcgb2YgYW4gaW5zdGFuY2UuIFVzZWQgaW50ZXJuYWxseS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqIEBuYW1lIHRlYXJkb3duKClcblx0XHQgKi9cblx0XHR0ZWFyZG93biA6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHRoaXMudW5iaW5kKCk7XG5cdFx0XHR0aGlzLmVsZW1lbnRcblx0XHRcdFx0LnJlbW92ZUNsYXNzKCdqc3RyZWUnKVxuXHRcdFx0XHQucmVtb3ZlRGF0YSgnanN0cmVlJylcblx0XHRcdFx0LmZpbmQoXCJbY2xhc3NePSdqc3RyZWUnXVwiKVxuXHRcdFx0XHRcdC5hZGRCYWNrKClcblx0XHRcdFx0XHQuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuY2xhc3NOYW1lLnJlcGxhY2UoL2pzdHJlZVteIF0qfCQvaWcsJycpOyB9KTtcblx0XHRcdHRoaXMuZWxlbWVudCA9IG51bGw7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBiaW5kIGFsbCBldmVudHMuIFVzZWQgaW50ZXJuYWxseS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqIEBuYW1lIGJpbmQoKVxuXHRcdCAqL1xuXHRcdGJpbmQgOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR0aGlzLmVsZW1lbnRcblx0XHRcdFx0Lm9uKFwiZGJsY2xpY2suanN0cmVlXCIsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdGlmKGRvY3VtZW50LnNlbGVjdGlvbiAmJiBkb2N1bWVudC5zZWxlY3Rpb24uZW1wdHkpIHtcblx0XHRcdFx0XHRcdFx0ZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0aWYod2luZG93LmdldFNlbGVjdGlvbikge1xuXHRcdFx0XHRcdFx0XHRcdHZhciBzZWwgPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0XHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0XHRcdHNlbC5yZW1vdmVBbGxSYW5nZXMoKTtcblx0XHRcdFx0XHRcdFx0XHRcdHNlbC5jb2xsYXBzZSgpO1xuXHRcdFx0XHRcdFx0XHRcdH0gY2F0Y2ggKGlnbm9yZSkgeyB9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KVxuXHRcdFx0XHQub24oXCJjbGljay5qc3RyZWVcIiwgXCIuanN0cmVlLW9jbFwiLCAkLnByb3h5KGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnRvZ2dsZV9ub2RlKGUudGFyZ2V0KTtcblx0XHRcdFx0XHR9LCB0aGlzKSlcblx0XHRcdFx0Lm9uKFwiY2xpY2suanN0cmVlXCIsIFwiLmpzdHJlZS1hbmNob3JcIiwgJC5wcm94eShmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdFx0JChlLmN1cnJlbnRUYXJnZXQpLmZvY3VzKCk7XG5cdFx0XHRcdFx0XHR0aGlzLmFjdGl2YXRlX25vZGUoZS5jdXJyZW50VGFyZ2V0LCBlKTtcblx0XHRcdFx0XHR9LCB0aGlzKSlcblx0XHRcdFx0Lm9uKCdrZXlkb3duLmpzdHJlZScsICcuanN0cmVlLWFuY2hvcicsICQucHJveHkoZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0XHRcdHZhciBvID0gbnVsbDtcblx0XHRcdFx0XHRcdHN3aXRjaChlLndoaWNoKSB7XG5cdFx0XHRcdFx0XHRcdGNhc2UgMTM6XG5cdFx0XHRcdFx0XHRcdGNhc2UgMzI6XG5cdFx0XHRcdFx0XHRcdFx0ZS50eXBlID0gXCJjbGlja1wiO1xuXHRcdFx0XHRcdFx0XHRcdCQoZS5jdXJyZW50VGFyZ2V0KS50cmlnZ2VyKGUpO1xuXHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRjYXNlIDM3OlxuXHRcdFx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRcdFx0XHRpZih0aGlzLmlzX29wZW4oZS5jdXJyZW50VGFyZ2V0KSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5jbG9zZV9ub2RlKGUuY3VycmVudFRhcmdldCk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0byA9IHRoaXMuZ2V0X3ByZXZfZG9tKGUuY3VycmVudFRhcmdldCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZihvICYmIG8ubGVuZ3RoKSB7IG8uY2hpbGRyZW4oJy5qc3RyZWUtYW5jaG9yJykuZm9jdXMoKTsgfVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0Y2FzZSAzODpcblx0XHRcdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0XHRcdFx0byA9IHRoaXMuZ2V0X3ByZXZfZG9tKGUuY3VycmVudFRhcmdldCk7XG5cdFx0XHRcdFx0XHRcdFx0aWYobyAmJiBvLmxlbmd0aCkgeyBvLmNoaWxkcmVuKCcuanN0cmVlLWFuY2hvcicpLmZvY3VzKCk7IH1cblx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0Y2FzZSAzOTpcblx0XHRcdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0XHRcdFx0aWYodGhpcy5pc19jbG9zZWQoZS5jdXJyZW50VGFyZ2V0KSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5vcGVuX25vZGUoZS5jdXJyZW50VGFyZ2V0LCBmdW5jdGlvbiAobykgeyB0aGlzLmdldF9ub2RlKG8sIHRydWUpLmNoaWxkcmVuKCcuanN0cmVlLWFuY2hvcicpLmZvY3VzKCk7IH0pO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdG8gPSB0aGlzLmdldF9uZXh0X2RvbShlLmN1cnJlbnRUYXJnZXQpO1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYobyAmJiBvLmxlbmd0aCkgeyBvLmNoaWxkcmVuKCcuanN0cmVlLWFuY2hvcicpLmZvY3VzKCk7IH1cblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdGNhc2UgNDA6XG5cdFx0XHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdFx0XHRcdG8gPSB0aGlzLmdldF9uZXh0X2RvbShlLmN1cnJlbnRUYXJnZXQpO1xuXHRcdFx0XHRcdFx0XHRcdGlmKG8gJiYgby5sZW5ndGgpIHsgby5jaGlsZHJlbignLmpzdHJlZS1hbmNob3InKS5mb2N1cygpOyB9XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdC8vIGRlbGV0ZVxuXHRcdFx0XHRcdFx0XHRjYXNlIDQ2OlxuXHRcdFx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRcdFx0XHRvID0gdGhpcy5nZXRfbm9kZShlLmN1cnJlbnRUYXJnZXQpO1xuXHRcdFx0XHRcdFx0XHRcdGlmKG8gJiYgby5pZCAmJiBvLmlkICE9PSAnIycpIHtcblx0XHRcdFx0XHRcdFx0XHRcdG8gPSB0aGlzLmlzX3NlbGVjdGVkKG8pID8gdGhpcy5nZXRfc2VsZWN0ZWQoKSA6IG87XG5cdFx0XHRcdFx0XHRcdFx0XHQvLyB0aGlzLmRlbGV0ZV9ub2RlKG8pO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0Ly8gZjJcblx0XHRcdFx0XHRcdFx0Y2FzZSAxMTM6XG5cdFx0XHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdFx0XHRcdG8gPSB0aGlzLmdldF9ub2RlKGUuY3VycmVudFRhcmdldCk7XG5cdFx0XHRcdFx0XHRcdFx0LyohXG5cdFx0XHRcdFx0XHRcdFx0aWYobyAmJiBvLmlkICYmIG8uaWQgIT09ICcjJykge1xuXHRcdFx0XHRcdFx0XHRcdFx0Ly8gdGhpcy5lZGl0KG8pO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHQqL1xuXHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKGUud2hpY2gpO1xuXHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sIHRoaXMpKVxuXHRcdFx0XHQub24oXCJsb2FkX25vZGUuanN0cmVlXCIsICQucHJveHkoZnVuY3Rpb24gKGUsIGRhdGEpIHtcblx0XHRcdFx0XHRcdGlmKGRhdGEuc3RhdHVzKSB7XG5cdFx0XHRcdFx0XHRcdGlmKGRhdGEubm9kZS5pZCA9PT0gJyMnICYmICF0aGlzLl9kYXRhLmNvcmUubG9hZGVkKSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5fZGF0YS5jb3JlLmxvYWRlZCA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0XHRcdFx0ICogdHJpZ2dlcmVkIGFmdGVyIHRoZSByb290IG5vZGUgaXMgbG9hZGVkIGZvciB0aGUgZmlyc3QgdGltZVxuXHRcdFx0XHRcdFx0XHRcdCAqIEBldmVudFxuXHRcdFx0XHRcdFx0XHRcdCAqIEBuYW1lIGxvYWRlZC5qc3RyZWVcblx0XHRcdFx0XHRcdFx0XHQgKi9cblx0XHRcdFx0XHRcdFx0XHR0aGlzLnRyaWdnZXIoXCJsb2FkZWRcIik7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0aWYoIXRoaXMuX2RhdGEuY29yZS5yZWFkeSAmJiAhdGhpcy5nZXRfY29udGFpbmVyX3VsKCkuZmluZCgnLmpzdHJlZS1sb2FkaW5nOmVxKDApJykubGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5fZGF0YS5jb3JlLnJlYWR5ID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHRpZih0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQubGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZih0aGlzLnNldHRpbmdzLmNvcmUuZXhwYW5kX3NlbGVjdGVkX29ubG9hZCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR2YXIgdG1wID0gW10sIGksIGo7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGZvcihpID0gMCwgaiA9IHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0bXAgPSB0bXAuY29uY2F0KHRoaXMuX21vZGVsLmRhdGFbdGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkW2ldXS5wYXJlbnRzKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR0bXAgPSAkLnZha2F0YS5hcnJheV91bmlxdWUodG1wKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Zm9yKGkgPSAwLCBqID0gdG1wLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMub3Blbl9ub2RlKHRtcFtpXSwgZmFsc2UsIDApO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLnRyaWdnZXIoJ2NoYW5nZWQnLCB7ICdhY3Rpb24nIDogJ3JlYWR5JywgJ3NlbGVjdGVkJyA6IHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZCB9KTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0XHRcdFx0ICogdHJpZ2dlcmVkIGFmdGVyIGFsbCBub2RlcyBhcmUgZmluaXNoZWQgbG9hZGluZ1xuXHRcdFx0XHRcdFx0XHRcdCAqIEBldmVudFxuXHRcdFx0XHRcdFx0XHRcdCAqIEBuYW1lIHJlYWR5LmpzdHJlZVxuXHRcdFx0XHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdFx0XHRcdHNldFRpbWVvdXQoJC5wcm94eShmdW5jdGlvbiAoKSB7IHRoaXMudHJpZ2dlcihcInJlYWR5XCIpOyB9LCB0aGlzKSwgMCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LCB0aGlzKSlcblx0XHRcdFx0Ly8gVEhFTUUgUkVMQVRFRFxuXHRcdFx0XHQub24oXCJpbml0LmpzdHJlZVwiLCAkLnByb3h5KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdHZhciBzID0gdGhpcy5zZXR0aW5ncy5jb3JlLnRoZW1lcztcblx0XHRcdFx0XHRcdHRoaXMuX2RhdGEuY29yZS50aGVtZXMuZG90c1x0XHRcdD0gcy5kb3RzO1xuXHRcdFx0XHRcdFx0dGhpcy5fZGF0YS5jb3JlLnRoZW1lcy5zdHJpcGVzXHRcdD0gcy5zdHJpcGVzO1xuXHRcdFx0XHRcdFx0dGhpcy5fZGF0YS5jb3JlLnRoZW1lcy5pY29uc1x0XHQ9IHMuaWNvbnM7XG5cdFx0XHRcdFx0XHR0aGlzLnNldF90aGVtZShzLm5hbWUgfHwgXCJkZWZhdWx0XCIsIHMudXJsKTtcblx0XHRcdFx0XHRcdHRoaXMuc2V0X3RoZW1lX3ZhcmlhbnQocy52YXJpYW50KTtcblx0XHRcdFx0XHR9LCB0aGlzKSlcblx0XHRcdFx0Lm9uKFwibG9hZGluZy5qc3RyZWVcIiwgJC5wcm94eShmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHR0aGlzWyB0aGlzLl9kYXRhLmNvcmUudGhlbWVzLmRvdHMgPyBcInNob3dfZG90c1wiIDogXCJoaWRlX2RvdHNcIiBdKCk7XG5cdFx0XHRcdFx0XHR0aGlzWyB0aGlzLl9kYXRhLmNvcmUudGhlbWVzLmljb25zID8gXCJzaG93X2ljb25zXCIgOiBcImhpZGVfaWNvbnNcIiBdKCk7XG5cdFx0XHRcdFx0XHR0aGlzWyB0aGlzLl9kYXRhLmNvcmUudGhlbWVzLnN0cmlwZXMgPyBcInNob3dfc3RyaXBlc1wiIDogXCJoaWRlX3N0cmlwZXNcIiBdKCk7XG5cdFx0XHRcdFx0fSwgdGhpcykpXG5cdFx0XHRcdC5vbignZm9jdXMuanN0cmVlJywgJy5qc3RyZWUtYW5jaG9yJywgJC5wcm94eShmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LmZpbmQoJy5qc3RyZWUtaG92ZXJlZCcpLm5vdChlLmN1cnJlbnRUYXJnZXQpLm1vdXNlbGVhdmUoKTtcblx0XHRcdFx0XHRcdCQoZS5jdXJyZW50VGFyZ2V0KS5tb3VzZWVudGVyKCk7XG5cdFx0XHRcdFx0fSwgdGhpcykpXG5cdFx0XHRcdC5vbignbW91c2VlbnRlci5qc3RyZWUnLCAnLmpzdHJlZS1hbmNob3InLCAkLnByb3h5KGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmhvdmVyX25vZGUoZS5jdXJyZW50VGFyZ2V0KTtcblx0XHRcdFx0XHR9LCB0aGlzKSlcblx0XHRcdFx0Lm9uKCdtb3VzZWxlYXZlLmpzdHJlZScsICcuanN0cmVlLWFuY2hvcicsICQucHJveHkoZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0XHRcdHRoaXMuZGVob3Zlcl9ub2RlKGUuY3VycmVudFRhcmdldCk7XG5cdFx0XHRcdFx0fSwgdGhpcykpO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogcGFydCBvZiB0aGUgZGVzdHJveWluZyBvZiBhbiBpbnN0YW5jZS4gVXNlZCBpbnRlcm5hbGx5LlxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICogQG5hbWUgdW5iaW5kKClcblx0XHQgKi9cblx0XHR1bmJpbmQgOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR0aGlzLmVsZW1lbnQub2ZmKCcuanN0cmVlJyk7XG5cdFx0XHQkKGRvY3VtZW50KS5vZmYoJy5qc3RyZWUtJyArIHRoaXMuX2lkKTtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIHRyaWdnZXIgYW4gZXZlbnQuIFVzZWQgaW50ZXJuYWxseS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqIEBuYW1lIHRyaWdnZXIoZXYgWywgZGF0YV0pXG5cdFx0ICogQHBhcmFtICB7U3RyaW5nfSBldiB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgdG8gdHJpZ2dlclxuXHRcdCAqIEBwYXJhbSAge09iamVjdH0gZGF0YSBhZGRpdGlvbmFsIGRhdGEgdG8gcGFzcyB3aXRoIHRoZSBldmVudFxuXHRcdCAqL1xuXHRcdHRyaWdnZXIgOiBmdW5jdGlvbiAoZXYsIGRhdGEpIHtcblx0XHRcdGlmKCFkYXRhKSB7XG5cdFx0XHRcdGRhdGEgPSB7fTtcblx0XHRcdH1cblx0XHRcdGRhdGEuaW5zdGFuY2UgPSB0aGlzO1xuXHRcdFx0dGhpcy5lbGVtZW50LnRyaWdnZXJIYW5kbGVyKGV2LnJlcGxhY2UoJy5qc3RyZWUnLCcnKSArICcuanN0cmVlJywgZGF0YSk7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiByZXR1cm5zIHRoZSBqUXVlcnkgZXh0ZW5kZWQgaW5zdGFuY2UgY29udGFpbmVyXG5cdFx0ICogQG5hbWUgZ2V0X2NvbnRhaW5lcigpXG5cdFx0ICogQHJldHVybiB7alF1ZXJ5fVxuXHRcdCAqL1xuXHRcdGdldF9jb250YWluZXIgOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5lbGVtZW50O1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogcmV0dXJucyB0aGUgalF1ZXJ5IGV4dGVuZGVkIG1haW4gVUwgbm9kZSBpbnNpZGUgdGhlIGluc3RhbmNlIGNvbnRhaW5lci4gVXNlZCBpbnRlcm5hbGx5LlxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICogQG5hbWUgZ2V0X2NvbnRhaW5lcl91bCgpXG5cdFx0ICogQHJldHVybiB7alF1ZXJ5fVxuXHRcdCAqL1xuXHRcdGdldF9jb250YWluZXJfdWwgOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5lbGVtZW50LmNoaWxkcmVuKFwidWw6ZXEoMClcIik7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBnZXRzIHN0cmluZyByZXBsYWNlbWVudHMgKGxvY2FsaXphdGlvbikuIFVzZWQgaW50ZXJuYWxseS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqIEBuYW1lIGdldF9zdHJpbmcoa2V5KVxuXHRcdCAqIEBwYXJhbSAge1N0cmluZ30ga2V5XG5cdFx0ICogQHJldHVybiB7U3RyaW5nfVxuXHRcdCAqL1xuXHRcdGdldF9zdHJpbmcgOiBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHR2YXIgYSA9IHRoaXMuc2V0dGluZ3MuY29yZS5zdHJpbmdzO1xuXHRcdFx0aWYoJC5pc0Z1bmN0aW9uKGEpKSB7IHJldHVybiBhLmNhbGwodGhpcywga2V5KTsgfVxuXHRcdFx0aWYoYSAmJiBhW2tleV0pIHsgcmV0dXJuIGFba2V5XTsgfVxuXHRcdFx0cmV0dXJuIGtleTtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIGdldHMgdGhlIGZpcnN0IGNoaWxkIG9mIGEgRE9NIG5vZGUuIFVzZWQgaW50ZXJuYWxseS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqIEBuYW1lIF9maXJzdENoaWxkKGRvbSlcblx0XHQgKiBAcGFyYW0gIHtET01FbGVtZW50fSBkb21cblx0XHQgKiBAcmV0dXJuIHtET01FbGVtZW50fVxuXHRcdCAqL1xuXHRcdF9maXJzdENoaWxkIDogZnVuY3Rpb24gKGRvbSkge1xuXHRcdFx0ZG9tID0gZG9tID8gZG9tLmZpcnN0Q2hpbGQgOiBudWxsO1xuXHRcdFx0d2hpbGUoZG9tICE9PSBudWxsICYmIGRvbS5ub2RlVHlwZSAhPT0gMSkge1xuXHRcdFx0XHRkb20gPSBkb20ubmV4dFNpYmxpbmc7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZG9tO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogZ2V0cyB0aGUgbmV4dCBzaWJsaW5nIG9mIGEgRE9NIG5vZGUuIFVzZWQgaW50ZXJuYWxseS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqIEBuYW1lIF9uZXh0U2libGluZyhkb20pXG5cdFx0ICogQHBhcmFtICB7RE9NRWxlbWVudH0gZG9tXG5cdFx0ICogQHJldHVybiB7RE9NRWxlbWVudH1cblx0XHQgKi9cblx0XHRfbmV4dFNpYmxpbmcgOiBmdW5jdGlvbiAoZG9tKSB7XG5cdFx0XHRkb20gPSBkb20gPyBkb20ubmV4dFNpYmxpbmcgOiBudWxsO1xuXHRcdFx0d2hpbGUoZG9tICE9PSBudWxsICYmIGRvbS5ub2RlVHlwZSAhPT0gMSkge1xuXHRcdFx0XHRkb20gPSBkb20ubmV4dFNpYmxpbmc7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZG9tO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogZ2V0cyB0aGUgcHJldmlvdXMgc2libGluZyBvZiBhIERPTSBub2RlLiBVc2VkIGludGVybmFsbHkuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKiBAbmFtZSBfcHJldmlvdXNTaWJsaW5nKGRvbSlcblx0XHQgKiBAcGFyYW0gIHtET01FbGVtZW50fSBkb21cblx0XHQgKiBAcmV0dXJuIHtET01FbGVtZW50fVxuXHRcdCAqL1xuXHRcdF9wcmV2aW91c1NpYmxpbmcgOiBmdW5jdGlvbiAoZG9tKSB7XG5cdFx0XHRkb20gPSBkb20gPyBkb20ucHJldmlvdXNTaWJsaW5nIDogbnVsbDtcblx0XHRcdHdoaWxlKGRvbSAhPT0gbnVsbCAmJiBkb20ubm9kZVR5cGUgIT09IDEpIHtcblx0XHRcdFx0ZG9tID0gZG9tLnByZXZpb3VzU2libGluZztcblx0XHRcdH1cblx0XHRcdHJldHVybiBkb207XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBnZXQgdGhlIEpTT04gcmVwcmVzZW50YXRpb24gb2YgYSBub2RlIChvciB0aGUgYWN0dWFsIGpRdWVyeSBleHRlbmRlZCBET00gbm9kZSkgYnkgdXNpbmcgYW55IGlucHV0IChjaGlsZCBET00gZWxlbWVudCwgSUQgc3RyaW5nLCBzZWxlY3RvciwgZXRjKVxuXHRcdCAqIEBuYW1lIGdldF9ub2RlKG9iaiBbLCBhc19kb21dKVxuXHRcdCAqIEBwYXJhbSAge21peGVkfSBvYmpcblx0XHQgKiBAcGFyYW0gIHtCb29sZWFufSBhc19kb21cblx0XHQgKiBAcmV0dXJuIHtPYmplY3R8alF1ZXJ5fVxuXHRcdCAqL1xuXHRcdGdldF9ub2RlIDogZnVuY3Rpb24gKG9iaiwgYXNfZG9tKSB7XG5cdFx0XHRpZihvYmogJiYgb2JqLmlkKSB7XG5cdFx0XHRcdG9iaiA9IG9iai5pZDtcblx0XHRcdH1cblx0XHRcdHZhciBkb207XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRpZih0aGlzLl9tb2RlbC5kYXRhW29ial0pIHtcblx0XHRcdFx0XHRvYmogPSB0aGlzLl9tb2RlbC5kYXRhW29ial07XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZigoKGRvbSA9ICQob2JqLCB0aGlzLmVsZW1lbnQpKS5sZW5ndGggfHwgKGRvbSA9ICQoJyMnICsgb2JqLCB0aGlzLmVsZW1lbnQpKS5sZW5ndGgpICYmIHRoaXMuX21vZGVsLmRhdGFbZG9tLmNsb3Nlc3QoJ2xpJykuYXR0cignaWQnKV0pIHtcblx0XHRcdFx0XHRvYmogPSB0aGlzLl9tb2RlbC5kYXRhW2RvbS5jbG9zZXN0KCdsaScpLmF0dHIoJ2lkJyldO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYoKGRvbSA9ICQob2JqLCB0aGlzLmVsZW1lbnQpKS5sZW5ndGggJiYgZG9tLmhhc0NsYXNzKCdqc3RyZWUnKSkge1xuXHRcdFx0XHRcdG9iaiA9IHRoaXMuX21vZGVsLmRhdGFbJyMnXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZihhc19kb20pIHtcblx0XHRcdFx0XHRvYmogPSBvYmouaWQgPT09ICcjJyA/IHRoaXMuZWxlbWVudCA6ICQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQob2JqLmlkKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIG9iajtcblx0XHRcdH0gY2F0Y2ggKGV4KSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogZ2V0IHRoZSBwYXRoIHRvIGEgbm9kZSwgZWl0aGVyIGNvbnNpc3Rpbmcgb2Ygbm9kZSB0ZXh0cywgb3Igb2Ygbm9kZSBJRHMsIG9wdGlvbmFsbHkgZ2x1ZWQgdG9nZXRoZXIgKG90aGVyd2lzZSBhbiBhcnJheSlcblx0XHQgKiBAbmFtZSBnZXRfcGF0aChvYmogWywgZ2x1ZSwgaWRzXSlcblx0XHQgKiBAcGFyYW0gIHttaXhlZH0gb2JqIHRoZSBub2RlXG5cdFx0ICogQHBhcmFtICB7U3RyaW5nfSBnbHVlIGlmIHlvdSB3YW50IHRoZSBwYXRoIGFzIGEgc3RyaW5nIC0gcGFzcyB0aGUgZ2x1ZSBoZXJlIChmb3IgZXhhbXBsZSAnLycpLCBpZiBhIGZhbHN5IHZhbHVlIGlzIHN1cHBsaWVkIGhlcmUsIGFuIGFycmF5IGlzIHJldHVybmVkXG5cdFx0ICogQHBhcmFtICB7Qm9vbGVhbn0gaWRzIGlmIHNldCB0byB0cnVlIGJ1aWxkIHRoZSBwYXRoIHVzaW5nIElELCBvdGhlcndpc2Ugbm9kZSB0ZXh0IGlzIHVzZWRcblx0XHQgKiBAcmV0dXJuIHttaXhlZH1cblx0XHQgKi9cblx0XHRnZXRfcGF0aCA6IGZ1bmN0aW9uIChvYmosIGdsdWUsIGlkcykge1xuXHRcdFx0b2JqID0gb2JqLnBhcmVudHMgPyBvYmogOiB0aGlzLmdldF9ub2RlKG9iaik7XG5cdFx0XHRpZighb2JqIHx8IG9iai5pZCA9PT0gJyMnIHx8ICFvYmoucGFyZW50cykge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHR2YXIgaSwgaiwgcCA9IFtdO1xuXHRcdFx0cC5wdXNoKGlkcyA/IG9iai5pZCA6IG9iai50ZXh0KTtcblx0XHRcdGZvcihpID0gMCwgaiA9IG9iai5wYXJlbnRzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRwLnB1c2goaWRzID8gb2JqLnBhcmVudHNbaV0gOiB0aGlzLmdldF90ZXh0KG9iai5wYXJlbnRzW2ldKSk7XG5cdFx0XHR9XG5cdFx0XHRwID0gcC5yZXZlcnNlKCkuc2xpY2UoMSk7XG5cdFx0XHRyZXR1cm4gZ2x1ZSA/IHAuam9pbihnbHVlKSA6IHA7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBnZXQgdGhlIG5leHQgdmlzaWJsZSBub2RlIHRoYXQgaXMgYmVsb3cgdGhlIGBvYmpgIG5vZGUuIElmIGBzdHJpY3RgIGlzIHNldCB0byBgdHJ1ZWAgb25seSBzaWJsaW5nIG5vZGVzIGFyZSByZXR1cm5lZC5cblx0XHQgKiBAbmFtZSBnZXRfbmV4dF9kb20ob2JqIFssIHN0cmljdF0pXG5cdFx0ICogQHBhcmFtICB7bWl4ZWR9IG9ialxuXHRcdCAqIEBwYXJhbSAge0Jvb2xlYW59IHN0cmljdFxuXHRcdCAqIEByZXR1cm4ge2pRdWVyeX1cblx0XHQgKi9cblx0XHRnZXRfbmV4dF9kb20gOiBmdW5jdGlvbiAob2JqLCBzdHJpY3QpIHtcblx0XHRcdHZhciB0bXA7XG5cdFx0XHRvYmogPSB0aGlzLmdldF9ub2RlKG9iaiwgdHJ1ZSk7XG5cdFx0XHRpZihvYmpbMF0gPT09IHRoaXMuZWxlbWVudFswXSkge1xuXHRcdFx0XHR0bXAgPSB0aGlzLl9maXJzdENoaWxkKHRoaXMuZ2V0X2NvbnRhaW5lcl91bCgpWzBdKTtcblx0XHRcdFx0cmV0dXJuIHRtcCA/ICQodG1wKSA6IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0aWYoIW9iaiB8fCAhb2JqLmxlbmd0aCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRpZihzdHJpY3QpIHtcblx0XHRcdFx0dG1wID0gdGhpcy5fbmV4dFNpYmxpbmcob2JqWzBdKTtcblx0XHRcdFx0cmV0dXJuIHRtcCA/ICQodG1wKSA6IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0aWYob2JqLmhhc0NsYXNzKFwianN0cmVlLW9wZW5cIikpIHtcblx0XHRcdFx0dG1wID0gdGhpcy5fZmlyc3RDaGlsZChvYmouY2hpbGRyZW4oJ3VsJylbMF0pO1xuXHRcdFx0XHRyZXR1cm4gdG1wID8gJCh0bXApIDogZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRpZigodG1wID0gdGhpcy5fbmV4dFNpYmxpbmcob2JqWzBdKSkgIT09IG51bGwpIHtcblx0XHRcdFx0cmV0dXJuICQodG1wKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBvYmoucGFyZW50c1VudGlsKFwiLmpzdHJlZVwiLFwibGlcIikubmV4dChcImxpXCIpLmVxKDApO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogZ2V0IHRoZSBwcmV2aW91cyB2aXNpYmxlIG5vZGUgdGhhdCBpcyBhYm92ZSB0aGUgYG9iamAgbm9kZS4gSWYgYHN0cmljdGAgaXMgc2V0IHRvIGB0cnVlYCBvbmx5IHNpYmxpbmcgbm9kZXMgYXJlIHJldHVybmVkLlxuXHRcdCAqIEBuYW1lIGdldF9wcmV2X2RvbShvYmogWywgc3RyaWN0XSlcblx0XHQgKiBAcGFyYW0gIHttaXhlZH0gb2JqXG5cdFx0ICogQHBhcmFtICB7Qm9vbGVhbn0gc3RyaWN0XG5cdFx0ICogQHJldHVybiB7alF1ZXJ5fVxuXHRcdCAqL1xuXHRcdGdldF9wcmV2X2RvbSA6IGZ1bmN0aW9uIChvYmosIHN0cmljdCkge1xuXHRcdFx0dmFyIHRtcDtcblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqLCB0cnVlKTtcblx0XHRcdGlmKG9ialswXSA9PT0gdGhpcy5lbGVtZW50WzBdKSB7XG5cdFx0XHRcdHRtcCA9IHRoaXMuZ2V0X2NvbnRhaW5lcl91bCgpWzBdLmxhc3RDaGlsZDtcblx0XHRcdFx0cmV0dXJuIHRtcCA/ICQodG1wKSA6IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0aWYoIW9iaiB8fCAhb2JqLmxlbmd0aCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRpZihzdHJpY3QpIHtcblx0XHRcdFx0dG1wID0gdGhpcy5fcHJldmlvdXNTaWJsaW5nKG9ialswXSk7XG5cdFx0XHRcdHJldHVybiB0bXAgPyAkKHRtcCkgOiBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGlmKCh0bXAgPSB0aGlzLl9wcmV2aW91c1NpYmxpbmcob2JqWzBdKSkgIT09IG51bGwpIHtcblx0XHRcdFx0b2JqID0gJCh0bXApO1xuXHRcdFx0XHR3aGlsZShvYmouaGFzQ2xhc3MoXCJqc3RyZWUtb3BlblwiKSkge1xuXHRcdFx0XHRcdG9iaiA9IG9iai5jaGlsZHJlbihcInVsOmVxKDApXCIpLmNoaWxkcmVuKFwibGk6bGFzdFwiKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gb2JqO1xuXHRcdFx0fVxuXHRcdFx0dG1wID0gb2JqWzBdLnBhcmVudE5vZGUucGFyZW50Tm9kZTtcblx0XHRcdHJldHVybiB0bXAgJiYgdG1wLnRhZ05hbWUgPT09ICdMSScgPyAkKHRtcCkgOiBmYWxzZTtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIGdldCB0aGUgcGFyZW50IElEIG9mIGEgbm9kZVxuXHRcdCAqIEBuYW1lIGdldF9wYXJlbnQob2JqKVxuXHRcdCAqIEBwYXJhbSAge21peGVkfSBvYmpcblx0XHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdFx0ICovXG5cdFx0Z2V0X3BhcmVudCA6IGZ1bmN0aW9uIChvYmopIHtcblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdGlmKCFvYmogfHwgb2JqLmlkID09PSAnIycpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG9iai5wYXJlbnQ7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBnZXQgYSBqUXVlcnkgY29sbGVjdGlvbiBvZiBhbGwgdGhlIGNoaWxkcmVuIG9mIGEgbm9kZSAobm9kZSBtdXN0IGJlIHJlbmRlcmVkKVxuXHRcdCAqIEBuYW1lIGdldF9jaGlsZHJlbl9kb20ob2JqKVxuXHRcdCAqIEBwYXJhbSAge21peGVkfSBvYmpcblx0XHQgKiBAcmV0dXJuIHtqUXVlcnl9XG5cdFx0ICovXG5cdFx0Z2V0X2NoaWxkcmVuX2RvbSA6IGZ1bmN0aW9uIChvYmopIHtcblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqLCB0cnVlKTtcblx0XHRcdGlmKG9ialswXSA9PT0gdGhpcy5lbGVtZW50WzBdKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmdldF9jb250YWluZXJfdWwoKS5jaGlsZHJlbihcImxpXCIpO1xuXHRcdFx0fVxuXHRcdFx0aWYoIW9iaiB8fCAhb2JqLmxlbmd0aCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gb2JqLmNoaWxkcmVuKFwidWxcIikuY2hpbGRyZW4oXCJsaVwiKTtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIGNoZWNrcyBpZiBhIG5vZGUgaGFzIGNoaWxkcmVuXG5cdFx0ICogQG5hbWUgaXNfcGFyZW50KG9iailcblx0XHQgKiBAcGFyYW0gIHttaXhlZH0gb2JqXG5cdFx0ICogQHJldHVybiB7Qm9vbGVhbn1cblx0XHQgKi9cblx0XHRpc19wYXJlbnQgOiBmdW5jdGlvbiAob2JqKSB7XG5cdFx0XHRvYmogPSB0aGlzLmdldF9ub2RlKG9iaik7XG5cdFx0XHRyZXR1cm4gb2JqICYmIChvYmouc3RhdGUubG9hZGVkID09PSBmYWxzZSB8fCBvYmouY2hpbGRyZW4ubGVuZ3RoID4gMCk7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBjaGVja3MgaWYgYSBub2RlIGlzIGxvYWRlZCAoaXRzIGNoaWxkcmVuIGFyZSBhdmFpbGFibGUpXG5cdFx0ICogQG5hbWUgaXNfbG9hZGVkKG9iailcblx0XHQgKiBAcGFyYW0gIHttaXhlZH0gb2JqXG5cdFx0ICogQHJldHVybiB7Qm9vbGVhbn1cblx0XHQgKi9cblx0XHRpc19sb2FkZWQgOiBmdW5jdGlvbiAob2JqKSB7XG5cdFx0XHRvYmogPSB0aGlzLmdldF9ub2RlKG9iaik7XG5cdFx0XHRyZXR1cm4gb2JqICYmIG9iai5zdGF0ZS5sb2FkZWQ7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBjaGVjayBpZiBhIG5vZGUgaXMgY3VycmVudGx5IGxvYWRpbmcgKGZldGNoaW5nIGNoaWxkcmVuKVxuXHRcdCAqIEBuYW1lIGlzX2xvYWRpbmcob2JqKVxuXHRcdCAqIEBwYXJhbSAge21peGVkfSBvYmpcblx0XHQgKiBAcmV0dXJuIHtCb29sZWFufVxuXHRcdCAqL1xuXHRcdGlzX2xvYWRpbmcgOiBmdW5jdGlvbiAob2JqKSB7XG5cdFx0XHRvYmogPSB0aGlzLmdldF9ub2RlKG9iaiwgdHJ1ZSk7XG5cdFx0XHRyZXR1cm4gb2JqICYmIG9iai5oYXNDbGFzcyhcImpzdHJlZS1sb2FkaW5nXCIpO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogY2hlY2sgaWYgYSBub2RlIGlzIG9wZW5lZFxuXHRcdCAqIEBuYW1lIGlzX29wZW4ob2JqKVxuXHRcdCAqIEBwYXJhbSAge21peGVkfSBvYmpcblx0XHQgKiBAcmV0dXJuIHtCb29sZWFufVxuXHRcdCAqL1xuXHRcdGlzX29wZW4gOiBmdW5jdGlvbiAob2JqKSB7XG5cdFx0XHRvYmogPSB0aGlzLmdldF9ub2RlKG9iaik7XG5cdFx0XHRyZXR1cm4gb2JqICYmIG9iai5zdGF0ZS5vcGVuZWQ7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBjaGVjayBpZiBhIG5vZGUgaXMgaW4gYSBjbG9zZWQgc3RhdGVcblx0XHQgKiBAbmFtZSBpc19jbG9zZWQob2JqKVxuXHRcdCAqIEBwYXJhbSAge21peGVkfSBvYmpcblx0XHQgKiBAcmV0dXJuIHtCb29sZWFufVxuXHRcdCAqL1xuXHRcdGlzX2Nsb3NlZCA6IGZ1bmN0aW9uIChvYmopIHtcblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdHJldHVybiBvYmogJiYgdGhpcy5pc19wYXJlbnQob2JqKSAmJiAhb2JqLnN0YXRlLm9wZW5lZDtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIGNoZWNrIGlmIGEgbm9kZSBoYXMgbm8gY2hpbGRyZW5cblx0XHQgKiBAbmFtZSBpc19sZWFmKG9iailcblx0XHQgKiBAcGFyYW0gIHttaXhlZH0gb2JqXG5cdFx0ICogQHJldHVybiB7Qm9vbGVhbn1cblx0XHQgKi9cblx0XHRpc19sZWFmIDogZnVuY3Rpb24gKG9iaikge1xuXHRcdFx0cmV0dXJuICF0aGlzLmlzX3BhcmVudChvYmopO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogbG9hZHMgYSBub2RlIChmZXRjaGVzIGl0cyBjaGlsZHJlbiB1c2luZyB0aGUgYGNvcmUuZGF0YWAgc2V0dGluZykuIE11bHRpcGxlIG5vZGVzIGNhbiBiZSBwYXNzZWQgdG8gYnkgdXNpbmcgYW4gYXJyYXkuXG5cdFx0ICogQG5hbWUgbG9hZF9ub2RlKG9iaiBbLCBjYWxsYmFja10pXG5cdFx0ICogQHBhcmFtICB7bWl4ZWR9IG9ialxuXHRcdCAqIEBwYXJhbSAge2Z1bmN0aW9ufSBjYWxsYmFjayBhIGZ1bmN0aW9uIHRvIGJlIGV4ZWN1dGVkIG9uY2UgbG9hZGluZyBpcyBjb25wbGV0ZSwgdGhlIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkIGluIHRoZSBpbnN0YW5jZSdzIHNjb3BlIGFuZCByZWNlaXZlcyB0d28gYXJndW1lbnRzIC0gdGhlIG5vZGUgYW5kIGEgYm9vbGVhbiBzdGF0dXNcblx0XHQgKiBAcmV0dXJuIHtCb29sZWFufVxuXHRcdCAqIEB0cmlnZ2VyIGxvYWRfbm9kZS5qc3RyZWVcblx0XHQgKi9cblx0XHRsb2FkX25vZGUgOiBmdW5jdGlvbiAob2JqLCBjYWxsYmFjaykge1xuXHRcdFx0dmFyIHQxLCB0Mjtcblx0XHRcdGlmKCQuaXNBcnJheShvYmopKSB7XG5cdFx0XHRcdG9iaiA9IG9iai5zbGljZSgpO1xuXHRcdFx0XHRmb3IodDEgPSAwLCB0MiA9IG9iai5sZW5ndGg7IHQxIDwgdDI7IHQxKyspIHtcblx0XHRcdFx0XHR0aGlzLmxvYWRfbm9kZShvYmpbdDFdLCBjYWxsYmFjayk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0XHRvYmogPSB0aGlzLmdldF9ub2RlKG9iaik7XG5cdFx0XHRpZighb2JqKSB7XG5cdFx0XHRcdGNhbGxiYWNrLmNhbGwodGhpcywgb2JqLCBmYWxzZSk7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHRcdHRoaXMuZ2V0X25vZGUob2JqLCB0cnVlKS5hZGRDbGFzcyhcImpzdHJlZS1sb2FkaW5nXCIpO1xuXHRcdFx0dGhpcy5fbG9hZF9ub2RlKG9iaiwgJC5wcm94eShmdW5jdGlvbiAoc3RhdHVzKSB7XG5cdFx0XHRcdG9iai5zdGF0ZS5sb2FkZWQgPSBzdGF0dXM7XG5cdFx0XHRcdHRoaXMuZ2V0X25vZGUob2JqLCB0cnVlKS5yZW1vdmVDbGFzcyhcImpzdHJlZS1sb2FkaW5nXCIpO1xuXHRcdFx0XHQvKipcblx0XHRcdFx0ICogdHJpZ2dlcmVkIGFmdGVyIGEgbm9kZSBpcyBsb2FkZWRcblx0XHRcdFx0ICogQGV2ZW50XG5cdFx0XHRcdCAqIEBuYW1lIGxvYWRfbm9kZS5qc3RyZWVcblx0XHRcdFx0ICogQHBhcmFtIHtPYmplY3R9IG5vZGUgdGhlIG5vZGUgdGhhdCB3YXMgbG9hZGluZ1xuXHRcdFx0XHQgKiBAcGFyYW0ge0Jvb2xlYW59IHN0YXR1cyB3YXMgdGhlIG5vZGUgbG9hZGVkIHN1Y2Nlc3NmdWxseVxuXHRcdFx0XHQgKi9cblx0XHRcdFx0dGhpcy50cmlnZ2VyKCdsb2FkX25vZGUnLCB7IFwibm9kZVwiIDogb2JqLCBcInN0YXR1c1wiIDogc3RhdHVzIH0pO1xuXHRcdFx0XHRpZihjYWxsYmFjaykge1xuXHRcdFx0XHRcdGNhbGxiYWNrLmNhbGwodGhpcywgb2JqLCBzdGF0dXMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCB0aGlzKSk7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIGhhbmRsZXMgdGhlIGFjdHVhbCBsb2FkaW5nIG9mIGEgbm9kZS4gVXNlZCBvbmx5IGludGVybmFsbHkuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKiBAbmFtZSBfbG9hZF9ub2RlKG9iaiBbLCBjYWxsYmFja10pXG5cdFx0ICogQHBhcmFtICB7bWl4ZWR9IG9ialxuXHRcdCAqIEBwYXJhbSAge2Z1bmN0aW9ufSBjYWxsYmFjayBhIGZ1bmN0aW9uIHRvIGJlIGV4ZWN1dGVkIG9uY2UgbG9hZGluZyBpcyBjb25wbGV0ZSwgdGhlIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkIGluIHRoZSBpbnN0YW5jZSdzIHNjb3BlIGFuZCByZWNlaXZlcyBvbmUgYXJndW1lbnQgLSBhIGJvb2xlYW4gc3RhdHVzXG5cdFx0ICogQHJldHVybiB7Qm9vbGVhbn1cblx0XHQgKi9cblx0XHRfbG9hZF9ub2RlIDogZnVuY3Rpb24gKG9iaiwgY2FsbGJhY2spIHtcblx0XHRcdHZhciBzID0gdGhpcy5zZXR0aW5ncy5jb3JlLmRhdGEsIHQ7XG5cdFx0XHQvLyB1c2Ugb3JpZ2luYWwgSFRNTFxuXHRcdFx0aWYoIXMpIHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrLmNhbGwodGhpcywgb2JqLmlkID09PSAnIycgPyB0aGlzLl9hcHBlbmRfaHRtbF9kYXRhKG9iaiwgdGhpcy5fZGF0YS5jb3JlLm9yaWdpbmFsX2NvbnRhaW5lcl9odG1sLmNsb25lKHRydWUpKSA6IGZhbHNlKTtcblx0XHRcdH1cblx0XHRcdGlmKCQuaXNGdW5jdGlvbihzKSkge1xuXHRcdFx0XHRyZXR1cm4gcy5jYWxsKHRoaXMsIG9iaiwgJC5wcm94eShmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRcdHJldHVybiBkID09PSBmYWxzZSA/IGNhbGxiYWNrLmNhbGwodGhpcywgZmFsc2UpIDogY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzW3R5cGVvZiBkID09PSAnc3RyaW5nJyA/ICdfYXBwZW5kX2h0bWxfZGF0YScgOiAnX2FwcGVuZF9qc29uX2RhdGEnXShvYmosIHR5cGVvZiBkID09PSAnc3RyaW5nJyA/ICQoZCkgOiBkKSk7XG5cdFx0XHRcdH0sIHRoaXMpKTtcblx0XHRcdH1cblx0XHRcdGlmKHR5cGVvZiBzID09PSAnb2JqZWN0Jykge1xuXHRcdFx0XHRpZihzLnVybCkge1xuXHRcdFx0XHRcdHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgcyk7XG5cdFx0XHRcdFx0aWYoJC5pc0Z1bmN0aW9uKHMudXJsKSkge1xuXHRcdFx0XHRcdFx0cy51cmwgPSBzLnVybC5jYWxsKHRoaXMsIG9iaik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmKCQuaXNGdW5jdGlvbihzLmRhdGEpKSB7XG5cdFx0XHRcdFx0XHRzLmRhdGEgPSBzLmRhdGEuY2FsbCh0aGlzLCBvYmopO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gJC5hamF4KHMpXG5cdFx0XHRcdFx0XHQuZG9uZSgkLnByb3h5KGZ1bmN0aW9uIChkLHQseCkge1xuXHRcdFx0XHRcdFx0XHRcdHZhciB0eXBlID0geC5nZXRSZXNwb25zZUhlYWRlcignQ29udGVudC1UeXBlJyk7XG5cdFx0XHRcdFx0XHRcdFx0aWYodHlwZS5pbmRleE9mKCdqc29uJykgIT09IC0xKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLl9hcHBlbmRfanNvbl9kYXRhKG9iaiwgZCkpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRpZih0eXBlLmluZGV4T2YoJ2h0bWwnKSAhPT0gLTEpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBjYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuX2FwcGVuZF9odG1sX2RhdGEob2JqLCAkKGQpKSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9LCB0aGlzKSlcblx0XHRcdFx0XHRcdC5mYWlsKCQucHJveHkoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0XHRcdGNhbGxiYWNrLmNhbGwodGhpcywgZmFsc2UpO1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuX2RhdGEuY29yZS5sYXN0X2Vycm9yID0geyAnZXJyb3InIDogJ2FqYXgnLCAncGx1Z2luJyA6ICdjb3JlJywgJ2lkJyA6ICdjb3JlXzA0JywgJ3JlYXNvbicgOiAnQ291bGQgbm90IGxvYWQgbm9kZScsICdkYXRhJyA6IEpTT04uc3RyaW5naWZ5KHMpIH07XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5jb3JlLmVycm9yLmNhbGwodGhpcywgdGhpcy5fZGF0YS5jb3JlLmxhc3RfZXJyb3IpO1xuXHRcdFx0XHRcdFx0XHR9LCB0aGlzKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dCA9ICgkLmlzQXJyYXkocykgfHwgJC5pc1BsYWluT2JqZWN0KHMpKSA/IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkocykpIDogcztcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5fYXBwZW5kX2pzb25fZGF0YShvYmosIHQpKTtcblx0XHRcdH1cblx0XHRcdGlmKHR5cGVvZiBzID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLl9hcHBlbmRfaHRtbF9kYXRhKG9iaiwgcykpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGNhbGxiYWNrLmNhbGwodGhpcywgZmFsc2UpO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogYWRkcyBhIG5vZGUgdG8gdGhlIGxpc3Qgb2Ygbm9kZXMgdG8gcmVkcmF3LiBVc2VkIG9ubHkgaW50ZXJuYWxseS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqIEBuYW1lIF9ub2RlX2NoYW5nZWQob2JqIFssIGNhbGxiYWNrXSlcblx0XHQgKiBAcGFyYW0gIHttaXhlZH0gb2JqXG5cdFx0ICovXG5cdFx0X25vZGVfY2hhbmdlZCA6IGZ1bmN0aW9uIChvYmopIHtcblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdGlmKG9iaikge1xuXHRcdFx0XHR0aGlzLl9tb2RlbC5jaGFuZ2VkLnB1c2gob2JqLmlkKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIGFwcGVuZHMgSFRNTCBjb250ZW50IHRvIHRoZSB0cmVlLiBVc2VkIGludGVybmFsbHkuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKiBAbmFtZSBfYXBwZW5kX2h0bWxfZGF0YShvYmosIGRhdGEpXG5cdFx0ICogQHBhcmFtICB7bWl4ZWR9IG9iaiB0aGUgbm9kZSB0byBhcHBlbmQgdG9cblx0XHQgKiBAcGFyYW0gIHtTdHJpbmd9IGRhdGEgdGhlIEhUTUwgc3RyaW5nIHRvIHBhcnNlIGFuZCBhcHBlbmRcblx0XHQgKiBAcmV0dXJuIHtCb29sZWFufVxuXHRcdCAqIEB0cmlnZ2VyIG1vZGVsLmpzdHJlZSwgY2hhbmdlZC5qc3RyZWVcblx0XHQgKi9cblx0XHRfYXBwZW5kX2h0bWxfZGF0YSA6IGZ1bmN0aW9uIChkb20sIGRhdGEpIHtcblx0XHRcdGRvbSA9IHRoaXMuZ2V0X25vZGUoZG9tKTtcblx0XHRcdGRvbS5jaGlsZHJlbiA9IFtdO1xuXHRcdFx0ZG9tLmNoaWxkcmVuX2QgPSBbXTtcblx0XHRcdHZhciBkYXQgPSBkYXRhLmlzKCd1bCcpID8gZGF0YS5jaGlsZHJlbigpIDogZGF0YSxcblx0XHRcdFx0cGFyID0gZG9tLmlkLFxuXHRcdFx0XHRjaGQgPSBbXSxcblx0XHRcdFx0ZHBjID0gW10sXG5cdFx0XHRcdG0gPSB0aGlzLl9tb2RlbC5kYXRhLFxuXHRcdFx0XHRwID0gbVtwYXJdLFxuXHRcdFx0XHRzID0gdGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkLmxlbmd0aCxcblx0XHRcdFx0dG1wLCBpLCBqO1xuXHRcdFx0ZGF0LmVhY2goJC5wcm94eShmdW5jdGlvbiAoaSwgdikge1xuXHRcdFx0XHR0bXAgPSB0aGlzLl9wYXJzZV9tb2RlbF9mcm9tX2h0bWwoJCh2KSwgcGFyLCBwLnBhcmVudHMuY29uY2F0KCkpO1xuXHRcdFx0XHRpZih0bXApIHtcblx0XHRcdFx0XHRjaGQucHVzaCh0bXApO1xuXHRcdFx0XHRcdGRwYy5wdXNoKHRtcCk7XG5cdFx0XHRcdFx0aWYobVt0bXBdLmNoaWxkcmVuX2QubGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRkcGMgPSBkcGMuY29uY2F0KG1bdG1wXS5jaGlsZHJlbl9kKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sIHRoaXMpKTtcblx0XHRcdHAuY2hpbGRyZW4gPSBjaGQ7XG5cdFx0XHRwLmNoaWxkcmVuX2QgPSBkcGM7XG5cdFx0XHRmb3IoaSA9IDAsIGogPSBwLnBhcmVudHMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdG1bcC5wYXJlbnRzW2ldXS5jaGlsZHJlbl9kID0gbVtwLnBhcmVudHNbaV1dLmNoaWxkcmVuX2QuY29uY2F0KGRwYyk7XG5cdFx0XHR9XG5cdFx0XHQvKipcblx0XHRcdCAqIHRyaWdnZXJlZCB3aGVuIG5ldyBkYXRhIGlzIGluc2VydGVkIHRvIHRoZSB0cmVlIG1vZGVsXG5cdFx0XHQgKiBAZXZlbnRcblx0XHRcdCAqIEBuYW1lIG1vZGVsLmpzdHJlZVxuXHRcdFx0ICogQHBhcmFtIHtBcnJheX0gbm9kZXMgYW4gYXJyYXkgb2Ygbm9kZSBJRHNcblx0XHRcdCAqIEBwYXJhbSB7U3RyaW5nfSBwYXJlbnQgdGhlIHBhcmVudCBJRCBvZiB0aGUgbm9kZXNcblx0XHRcdCAqL1xuXHRcdFx0dGhpcy50cmlnZ2VyKCdtb2RlbCcsIHsgXCJub2Rlc1wiIDogZHBjLCAncGFyZW50JyA6IHBhciB9KTtcblx0XHRcdGlmKHBhciAhPT0gJyMnKSB7XG5cdFx0XHRcdHRoaXMuX25vZGVfY2hhbmdlZChwYXIpO1xuXHRcdFx0XHR0aGlzLnJlZHJhdygpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHRoaXMuZ2V0X2NvbnRhaW5lcl91bCgpLmNoaWxkcmVuKCcuanN0cmVlLWluaXRpYWwtbm9kZScpLnJlbW92ZSgpO1xuXHRcdFx0XHR0aGlzLnJlZHJhdyh0cnVlKTtcblx0XHRcdH1cblx0XHRcdGlmKHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZC5sZW5ndGggIT09IHMpIHtcblx0XHRcdFx0dGhpcy50cmlnZ2VyKCdjaGFuZ2VkJywgeyAnYWN0aW9uJyA6ICdtb2RlbCcsICdzZWxlY3RlZCcgOiB0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQgfSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIGFwcGVuZHMgSlNPTiBjb250ZW50IHRvIHRoZSB0cmVlLiBVc2VkIGludGVybmFsbHkuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKiBAbmFtZSBfYXBwZW5kX2pzb25fZGF0YShvYmosIGRhdGEpXG5cdFx0ICogQHBhcmFtICB7bWl4ZWR9IG9iaiB0aGUgbm9kZSB0byBhcHBlbmQgdG9cblx0XHQgKiBAcGFyYW0gIHtTdHJpbmd9IGRhdGEgdGhlIEpTT04gb2JqZWN0IHRvIHBhcnNlIGFuZCBhcHBlbmRcblx0XHQgKiBAcmV0dXJuIHtCb29sZWFufVxuXHRcdCAqL1xuXHRcdF9hcHBlbmRfanNvbl9kYXRhIDogZnVuY3Rpb24gKGRvbSwgZGF0YSkge1xuXHRcdFx0ZG9tID0gdGhpcy5nZXRfbm9kZShkb20pO1xuXHRcdFx0ZG9tLmNoaWxkcmVuID0gW107XG5cdFx0XHRkb20uY2hpbGRyZW5fZCA9IFtdO1xuXHRcdFx0dmFyIGRhdCA9IGRhdGEsXG5cdFx0XHRcdHBhciA9IGRvbS5pZCxcblx0XHRcdFx0Y2hkID0gW10sXG5cdFx0XHRcdGRwYyA9IFtdLFxuXHRcdFx0XHRtID0gdGhpcy5fbW9kZWwuZGF0YSxcblx0XHRcdFx0cCA9IG1bcGFyXSxcblx0XHRcdFx0cyA9IHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZC5sZW5ndGgsXG5cdFx0XHRcdHRtcCwgaSwgajtcblx0XHRcdC8vIColJEAhISFcblx0XHRcdGlmKGRhdC5kKSB7XG5cdFx0XHRcdGRhdCA9IGRhdC5kO1xuXHRcdFx0XHRpZih0eXBlb2YgZGF0ID09PSBcInN0cmluZ1wiKSB7XG5cdFx0XHRcdFx0ZGF0ID0gSlNPTi5wYXJzZShkYXQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZighJC5pc0FycmF5KGRhdCkpIHsgZGF0ID0gW2RhdF07IH1cblx0XHRcdGlmKGRhdC5sZW5ndGggJiYgZGF0WzBdLmlkICE9PSB1bmRlZmluZWQgJiYgZGF0WzBdLnBhcmVudCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdC8vIEZsYXQgSlNPTiBzdXBwb3J0IChmb3IgZWFzeSBpbXBvcnQgZnJvbSBEQik6XG5cdFx0XHRcdC8vIDEpIGNvbnZlcnQgdG8gb2JqZWN0IChmb3JlYWNoKVxuXHRcdFx0XHRmb3IoaSA9IDAsIGogPSBkYXQubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdFx0aWYoIWRhdFtpXS5jaGlsZHJlbikge1xuXHRcdFx0XHRcdFx0ZGF0W2ldLmNoaWxkcmVuID0gW107XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdG1bZGF0W2ldLmlkXSA9IGRhdFtpXTtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyAyKSBwb3B1bGF0ZSBjaGlsZHJlbiAoZm9yZWFjaClcblx0XHRcdFx0Zm9yKGkgPSAwLCBqID0gZGF0Lmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRcdG1bZGF0W2ldLnBhcmVudF0uY2hpbGRyZW4ucHVzaChkYXRbaV0uaWQpO1xuXHRcdFx0XHRcdC8vIHBvcHVsYXRlIHBhcmVudC5jaGlsZHJlbl9kXG5cdFx0XHRcdFx0cC5jaGlsZHJlbl9kLnB1c2goZGF0W2ldLmlkKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyAzKSBub3JtYWxpemUgJiYgcG9wdWxhdGUgcGFyZW50cyBhbmQgY2hpbGRyZW5fZCB3aXRoIHJlY3Vyc2lvblxuXHRcdFx0XHRmb3IoaSA9IDAsIGogPSBwLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRcdHRtcCA9IHRoaXMuX3BhcnNlX21vZGVsX2Zyb21fZmxhdF9qc29uKG1bcC5jaGlsZHJlbltpXV0sIHBhciwgcC5wYXJlbnRzLmNvbmNhdCgpKTtcblx0XHRcdFx0XHRkcGMucHVzaCh0bXApO1xuXHRcdFx0XHRcdGlmKG1bdG1wXS5jaGlsZHJlbl9kLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0ZHBjID0gZHBjLmNvbmNhdChtW3RtcF0uY2hpbGRyZW5fZCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdC8vID8pIHRocmVlX3N0YXRlIHNlbGVjdGlvbiAtIHAuc3RhdGUuc2VsZWN0ZWQgJiYgdCAtIChpZiB0aHJlZV9zdGF0ZSBmb3JlYWNoKGRhdCA9PiBjaCkgLT4gZm9yZWFjaChwYXJlbnRzKSBpZihwYXJlbnQuc2VsZWN0ZWQpIGNoaWxkLnNlbGVjdGVkID0gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRmb3IoaSA9IDAsIGogPSBkYXQubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdFx0dG1wID0gdGhpcy5fcGFyc2VfbW9kZWxfZnJvbV9qc29uKGRhdFtpXSwgcGFyLCBwLnBhcmVudHMuY29uY2F0KCkpO1xuXHRcdFx0XHRcdGlmKHRtcCkge1xuXHRcdFx0XHRcdFx0Y2hkLnB1c2godG1wKTtcblx0XHRcdFx0XHRcdGRwYy5wdXNoKHRtcCk7XG5cdFx0XHRcdFx0XHRpZihtW3RtcF0uY2hpbGRyZW5fZC5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdFx0ZHBjID0gZHBjLmNvbmNhdChtW3RtcF0uY2hpbGRyZW5fZCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHAuY2hpbGRyZW4gPSBjaGQ7XG5cdFx0XHRcdHAuY2hpbGRyZW5fZCA9IGRwYztcblx0XHRcdFx0Zm9yKGkgPSAwLCBqID0gcC5wYXJlbnRzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRcdG1bcC5wYXJlbnRzW2ldXS5jaGlsZHJlbl9kID0gbVtwLnBhcmVudHNbaV1dLmNoaWxkcmVuX2QuY29uY2F0KGRwYyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHRoaXMudHJpZ2dlcignbW9kZWwnLCB7IFwibm9kZXNcIiA6IGRwYywgJ3BhcmVudCcgOiBwYXIgfSk7XG5cblx0XHRcdGlmKHBhciAhPT0gJyMnKSB7XG5cdFx0XHRcdHRoaXMuX25vZGVfY2hhbmdlZChwYXIpO1xuXHRcdFx0XHR0aGlzLnJlZHJhdygpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdC8vIHRoaXMuZ2V0X2NvbnRhaW5lcl91bCgpLmNoaWxkcmVuKCcuanN0cmVlLWluaXRpYWwtbm9kZScpLnJlbW92ZSgpO1xuXHRcdFx0XHR0aGlzLnJlZHJhdyh0cnVlKTtcblx0XHRcdH1cblx0XHRcdGlmKHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZC5sZW5ndGggIT09IHMpIHtcblx0XHRcdFx0dGhpcy50cmlnZ2VyKCdjaGFuZ2VkJywgeyAnYWN0aW9uJyA6ICdtb2RlbCcsICdzZWxlY3RlZCcgOiB0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQgfSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIHBhcnNlcyBhIG5vZGUgZnJvbSBhIGpRdWVyeSBvYmplY3QgYW5kIGFwcGVuZHMgdGhlbSB0byB0aGUgaW4gbWVtb3J5IHRyZWUgbW9kZWwuIFVzZWQgaW50ZXJuYWxseS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqIEBuYW1lIF9wYXJzZV9tb2RlbF9mcm9tX2h0bWwoZCBbLCBwLCBwc10pXG5cdFx0ICogQHBhcmFtICB7alF1ZXJ5fSBkIHRoZSBqUXVlcnkgb2JqZWN0IHRvIHBhcnNlXG5cdFx0ICogQHBhcmFtICB7U3RyaW5nfSBwIHRoZSBwYXJlbnQgSURcblx0XHQgKiBAcGFyYW0gIHtBcnJheX0gcHMgbGlzdCBvZiBhbGwgcGFyZW50c1xuXHRcdCAqIEByZXR1cm4ge1N0cmluZ30gdGhlIElEIG9mIHRoZSBvYmplY3QgYWRkZWQgdG8gdGhlIG1vZGVsXG5cdFx0ICovXG5cdFx0X3BhcnNlX21vZGVsX2Zyb21faHRtbCA6IGZ1bmN0aW9uIChkLCBwLCBwcykge1xuXHRcdFx0aWYoIXBzKSB7IHBzID0gW107IH1cblx0XHRcdGVsc2UgeyBwcyA9IFtdLmNvbmNhdChwcyk7IH1cblx0XHRcdGlmKHApIHsgcHMudW5zaGlmdChwKTsgfVxuXHRcdFx0dmFyIGMsIGUsIG0gPSB0aGlzLl9tb2RlbC5kYXRhLFxuXHRcdFx0XHRkYXRhID0ge1xuXHRcdFx0XHRcdGlkXHRcdFx0OiBmYWxzZSxcblx0XHRcdFx0XHR0ZXh0XHRcdDogZmFsc2UsXG5cdFx0XHRcdFx0aWNvblx0XHQ6IHRydWUsXG5cdFx0XHRcdFx0cGFyZW50XHRcdDogcCxcblx0XHRcdFx0XHRwYXJlbnRzXHRcdDogcHMsXG5cdFx0XHRcdFx0Y2hpbGRyZW5cdDogW10sXG5cdFx0XHRcdFx0Y2hpbGRyZW5fZFx0OiBbXSxcblx0XHRcdFx0XHRkYXRhXHRcdDogbnVsbCxcblx0XHRcdFx0XHRzdGF0ZVx0XHQ6IHsgfSxcblx0XHRcdFx0XHRsaV9hdHRyXHRcdDogeyBpZCA6IGZhbHNlIH0sXG5cdFx0XHRcdFx0YV9hdHRyXHRcdDogeyBocmVmIDogJyMnIH0sXG5cdFx0XHRcdFx0b3JpZ2luYWxcdDogZmFsc2Vcblx0XHRcdFx0fSwgaSwgdG1wLCB0aWQ7XG5cdFx0XHRmb3IoaSBpbiB0aGlzLl9tb2RlbC5kZWZhdWx0X3N0YXRlKSB7XG5cdFx0XHRcdGlmKHRoaXMuX21vZGVsLmRlZmF1bHRfc3RhdGUuaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdFx0XHRkYXRhLnN0YXRlW2ldID0gdGhpcy5fbW9kZWwuZGVmYXVsdF9zdGF0ZVtpXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0dG1wID0gJC52YWthdGEuYXR0cmlidXRlcyhkLCB0cnVlKTtcblx0XHRcdCQuZWFjaCh0bXAsIGZ1bmN0aW9uIChpLCB2KSB7XG5cdFx0XHRcdHYgPSAkLnRyaW0odik7XG5cdFx0XHRcdGlmKCF2Lmxlbmd0aCkgeyByZXR1cm4gdHJ1ZTsgfVxuXHRcdFx0XHRkYXRhLmxpX2F0dHJbaV0gPSB2O1xuXHRcdFx0XHRpZihpID09PSAnaWQnKSB7XG5cdFx0XHRcdFx0ZGF0YS5pZCA9IHY7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0dG1wID0gZC5jaGlsZHJlbignYScpLmVxKDApO1xuXHRcdFx0aWYodG1wLmxlbmd0aCkge1xuXHRcdFx0XHR0bXAgPSAkLnZha2F0YS5hdHRyaWJ1dGVzKHRtcCwgdHJ1ZSk7XG5cdFx0XHRcdCQuZWFjaCh0bXAsIGZ1bmN0aW9uIChpLCB2KSB7XG5cdFx0XHRcdFx0diA9ICQudHJpbSh2KTtcblx0XHRcdFx0XHRpZih2Lmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0ZGF0YS5hX2F0dHJbaV0gPSB2O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHR0bXAgPSBkLmNoaWxkcmVuKFwiYTplcSgwKVwiKS5sZW5ndGggPyBkLmNoaWxkcmVuKFwiYTplcSgwKVwiKS5jbG9uZSgpIDogZC5jbG9uZSgpO1xuXHRcdFx0dG1wLmNoaWxkcmVuKFwiaW5zLCBpLCB1bFwiKS5yZW1vdmUoKTtcblx0XHRcdHRtcCA9IHRtcC5odG1sKCk7XG5cdFx0XHR0bXAgPSAkKCc8ZGl2IC8+JykuaHRtbCh0bXApO1xuXHRcdFx0ZGF0YS50ZXh0ID0gdG1wLmh0bWwoKTtcblx0XHRcdHRtcCA9IGQuZGF0YSgpO1xuXHRcdFx0ZGF0YS5kYXRhID0gdG1wID8gJC5leHRlbmQodHJ1ZSwge30sIHRtcCkgOiBudWxsO1xuXHRcdFx0ZGF0YS5zdGF0ZS5vcGVuZWQgPSBkLmhhc0NsYXNzKCdqc3RyZWUtb3BlbicpO1xuXHRcdFx0ZGF0YS5zdGF0ZS5zZWxlY3RlZCA9IGQuY2hpbGRyZW4oJ2EnKS5oYXNDbGFzcygnanN0cmVlLWNsaWNrZWQnKTtcblx0XHRcdGRhdGEuc3RhdGUuZGlzYWJsZWQgPSBkLmNoaWxkcmVuKCdhJykuaGFzQ2xhc3MoJ2pzdHJlZS1kaXNhYmxlZCcpO1xuXHRcdFx0aWYoZGF0YS5kYXRhICYmIGRhdGEuZGF0YS5qc3RyZWUpIHtcblx0XHRcdFx0Zm9yKGkgaW4gZGF0YS5kYXRhLmpzdHJlZSkge1xuXHRcdFx0XHRcdGlmKGRhdGEuZGF0YS5qc3RyZWUuaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdFx0XHRcdGRhdGEuc3RhdGVbaV0gPSBkYXRhLmRhdGEuanN0cmVlW2ldO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0dG1wID0gZC5jaGlsZHJlbihcImFcIikuY2hpbGRyZW4oXCIuanN0cmVlLXRoZW1laWNvblwiKTtcblx0XHRcdGlmKHRtcC5sZW5ndGgpIHtcblx0XHRcdFx0ZGF0YS5pY29uID0gdG1wLmhhc0NsYXNzKCdqc3RyZWUtdGhlbWVpY29uLWhpZGRlbicpID8gZmFsc2UgOiB0bXAuYXR0cigncmVsJyk7XG5cdFx0XHR9XG5cdFx0XHRpZihkYXRhLnN0YXRlLmljb24pIHtcblx0XHRcdFx0ZGF0YS5pY29uID0gZGF0YS5zdGF0ZS5pY29uO1xuXHRcdFx0fVxuXHRcdFx0dG1wID0gZC5jaGlsZHJlbihcInVsXCIpLmNoaWxkcmVuKFwibGlcIik7XG5cdFx0XHRkbyB7XG5cdFx0XHRcdHRpZCA9ICdqJyArIHRoaXMuX2lkICsgJ18nICsgKCsrdGhpcy5fY250KTtcblx0XHRcdH0gd2hpbGUobVt0aWRdKTtcblx0XHRcdGRhdGEuaWQgPSBkYXRhLmxpX2F0dHIuaWQgfHwgdGlkO1xuXHRcdFx0aWYodG1wLmxlbmd0aCkge1xuXHRcdFx0XHR0bXAuZWFjaCgkLnByb3h5KGZ1bmN0aW9uIChpLCB2KSB7XG5cdFx0XHRcdFx0YyA9IHRoaXMuX3BhcnNlX21vZGVsX2Zyb21faHRtbCgkKHYpLCBkYXRhLmlkLCBwcyk7XG5cdFx0XHRcdFx0ZSA9IHRoaXMuX21vZGVsLmRhdGFbY107XG5cdFx0XHRcdFx0ZGF0YS5jaGlsZHJlbi5wdXNoKGMpO1xuXHRcdFx0XHRcdGlmKGUuY2hpbGRyZW5fZC5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdGRhdGEuY2hpbGRyZW5fZCA9IGRhdGEuY2hpbGRyZW5fZC5jb25jYXQoZS5jaGlsZHJlbl9kKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIHRoaXMpKTtcblx0XHRcdFx0ZGF0YS5jaGlsZHJlbl9kID0gZGF0YS5jaGlsZHJlbl9kLmNvbmNhdChkYXRhLmNoaWxkcmVuKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRpZihkLmhhc0NsYXNzKCdqc3RyZWUtY2xvc2VkJykpIHtcblx0XHRcdFx0XHRkYXRhLnN0YXRlLmxvYWRlZCA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZihkYXRhLmxpX2F0dHJbJ2NsYXNzJ10pIHtcblx0XHRcdFx0ZGF0YS5saV9hdHRyWydjbGFzcyddID0gZGF0YS5saV9hdHRyWydjbGFzcyddLnJlcGxhY2UoJ2pzdHJlZS1jbG9zZWQnLCcnKS5yZXBsYWNlKCdqc3RyZWUtb3BlbicsJycpO1xuXHRcdFx0fVxuXHRcdFx0aWYoZGF0YS5hX2F0dHJbJ2NsYXNzJ10pIHtcblx0XHRcdFx0ZGF0YS5hX2F0dHJbJ2NsYXNzJ10gPSBkYXRhLmFfYXR0clsnY2xhc3MnXS5yZXBsYWNlKCdqc3RyZWUtY2xpY2tlZCcsJycpLnJlcGxhY2UoJ2pzdHJlZS1kaXNhYmxlZCcsJycpO1xuXHRcdFx0fVxuXHRcdFx0bVtkYXRhLmlkXSA9IGRhdGE7XG5cdFx0XHRpZihkYXRhLnN0YXRlLnNlbGVjdGVkKSB7XG5cdFx0XHRcdHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZC5wdXNoKGRhdGEuaWQpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGRhdGEuaWQ7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBwYXJzZXMgYSBub2RlIGZyb20gYSBKU09OIG9iamVjdCAodXNlZCB3aGVuIGRlYWxpbmcgd2l0aCBmbGF0IGRhdGEsIHdoaWNoIGhhcyBubyBuZXN0aW5nIG9mIGNoaWxkcmVuLCBidXQgaGFzIGlkIGFuZCBwYXJlbnQgcHJvcGVydGllcykgYW5kIGFwcGVuZHMgaXQgdG8gdGhlIGluIG1lbW9yeSB0cmVlIG1vZGVsLiBVc2VkIGludGVybmFsbHkuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKiBAbmFtZSBfcGFyc2VfbW9kZWxfZnJvbV9mbGF0X2pzb24oZCBbLCBwLCBwc10pXG5cdFx0ICogQHBhcmFtICB7T2JqZWN0fSBkIHRoZSBKU09OIG9iamVjdCB0byBwYXJzZVxuXHRcdCAqIEBwYXJhbSAge1N0cmluZ30gcCB0aGUgcGFyZW50IElEXG5cdFx0ICogQHBhcmFtICB7QXJyYXl9IHBzIGxpc3Qgb2YgYWxsIHBhcmVudHNcblx0XHQgKiBAcmV0dXJuIHtTdHJpbmd9IHRoZSBJRCBvZiB0aGUgb2JqZWN0IGFkZGVkIHRvIHRoZSBtb2RlbFxuXHRcdCAqL1xuXHRcdF9wYXJzZV9tb2RlbF9mcm9tX2ZsYXRfanNvbiA6IGZ1bmN0aW9uIChkLCBwLCBwcykge1xuXHRcdFx0aWYoIXBzKSB7IHBzID0gW107IH1cblx0XHRcdGVsc2UgeyBwcyA9IHBzLmNvbmNhdCgpOyB9XG5cdFx0XHRpZihwKSB7IHBzLnVuc2hpZnQocCk7IH1cblx0XHRcdHZhciB0aWQgPSBkLmlkLFxuXHRcdFx0XHRtID0gdGhpcy5fbW9kZWwuZGF0YSxcblx0XHRcdFx0ZGYgPSB0aGlzLl9tb2RlbC5kZWZhdWx0X3N0YXRlLFxuXHRcdFx0XHRpLCBqLCBjLCBlLFxuXHRcdFx0XHR0bXAgPSB7XG5cdFx0XHRcdFx0aWRcdFx0XHQ6IHRpZCxcblx0XHRcdFx0XHR0ZXh0XHRcdDogZC50ZXh0IHx8ICcnLFxuXHRcdFx0XHRcdGljb25cdFx0OiBkLmljb24gIT09IHVuZGVmaW5lZCA/IGQuaWNvbiA6IHRydWUsXG5cdFx0XHRcdFx0cGFyZW50XHRcdDogcCxcblx0XHRcdFx0XHRwYXJlbnRzXHRcdDogcHMsXG5cdFx0XHRcdFx0Y2hpbGRyZW5cdDogZC5jaGlsZHJlbiB8fCBbXSxcblx0XHRcdFx0XHRjaGlsZHJlbl9kXHQ6IGQuY2hpbGRyZW5fZCB8fCBbXSxcblx0XHRcdFx0XHRkYXRhXHRcdDogZC5kYXRhLFxuXHRcdFx0XHRcdHN0YXRlXHRcdDogeyB9LFxuXHRcdFx0XHRcdGxpX2F0dHJcdFx0OiB7IGlkIDogZmFsc2UgfSxcblx0XHRcdFx0XHRhX2F0dHJcdFx0OiB7IGhyZWYgOiAnIycgfSxcblx0XHRcdFx0XHRvcmlnaW5hbFx0OiBmYWxzZVxuXHRcdFx0XHR9O1xuXHRcdFx0Zm9yKGkgaW4gZGYpIHtcblx0XHRcdFx0aWYoZGYuaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdFx0XHR0bXAuc3RhdGVbaV0gPSBkZltpXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYoZCAmJiBkLmRhdGEgJiYgZC5kYXRhLmpzdHJlZSAmJiBkLmRhdGEuanN0cmVlLmljb24pIHtcblx0XHRcdFx0dG1wLmljb24gPSBkLmRhdGEuanN0cmVlLmljb247XG5cdFx0XHR9XG5cdFx0XHRpZihkICYmIGQuZGF0YSkge1xuXHRcdFx0XHR0bXAuZGF0YSA9IGQuZGF0YTtcblx0XHRcdFx0aWYoZC5kYXRhLmpzdHJlZSkge1xuXHRcdFx0XHRcdGZvcihpIGluIGQuZGF0YS5qc3RyZWUpIHtcblx0XHRcdFx0XHRcdGlmKGQuZGF0YS5qc3RyZWUuaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdFx0XHRcdFx0dG1wLnN0YXRlW2ldID0gZC5kYXRhLmpzdHJlZVtpXTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmKGQgJiYgdHlwZW9mIGQuc3RhdGUgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRcdGZvciAoaSBpbiBkLnN0YXRlKSB7XG5cdFx0XHRcdFx0aWYoZC5zdGF0ZS5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0XHRcdFx0dG1wLnN0YXRlW2ldID0gZC5zdGF0ZVtpXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmKGQgJiYgdHlwZW9mIGQubGlfYXR0ciA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0Zm9yIChpIGluIGQubGlfYXR0cikge1xuXHRcdFx0XHRcdGlmKGQubGlfYXR0ci5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0XHRcdFx0dG1wLmxpX2F0dHJbaV0gPSBkLmxpX2F0dHJbaV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZighdG1wLmxpX2F0dHIuaWQpIHtcblx0XHRcdFx0dG1wLmxpX2F0dHIuaWQgPSB0aWQ7XG5cdFx0XHR9XG5cdFx0XHRpZihkICYmIHR5cGVvZiBkLmFfYXR0ciA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0Zm9yIChpIGluIGQuYV9hdHRyKSB7XG5cdFx0XHRcdFx0aWYoZC5hX2F0dHIuaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdFx0XHRcdHRtcC5hX2F0dHJbaV0gPSBkLmFfYXR0cltpXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmKGQgJiYgZC5jaGlsZHJlbiAmJiBkLmNoaWxkcmVuID09PSB0cnVlKSB7XG5cdFx0XHRcdHRtcC5zdGF0ZS5sb2FkZWQgPSBmYWxzZTtcblx0XHRcdFx0dG1wLmNoaWxkcmVuID0gW107XG5cdFx0XHRcdHRtcC5jaGlsZHJlbl9kID0gW107XG5cdFx0XHR9XG5cdFx0XHRtW3RtcC5pZF0gPSB0bXA7XG5cdFx0XHRmb3IoaSA9IDAsIGogPSB0bXAuY2hpbGRyZW4ubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdGMgPSB0aGlzLl9wYXJzZV9tb2RlbF9mcm9tX2ZsYXRfanNvbihtW3RtcC5jaGlsZHJlbltpXV0sIHRtcC5pZCwgcHMpO1xuXHRcdFx0XHRlID0gbVtjXTtcblx0XHRcdFx0dG1wLmNoaWxkcmVuX2QucHVzaChjKTtcblx0XHRcdFx0aWYoZS5jaGlsZHJlbl9kLmxlbmd0aCkge1xuXHRcdFx0XHRcdHRtcC5jaGlsZHJlbl9kID0gdG1wLmNoaWxkcmVuX2QuY29uY2F0KGUuY2hpbGRyZW5fZCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGRlbGV0ZSBkLmRhdGE7XG5cdFx0XHRkZWxldGUgZC5jaGlsZHJlbjtcblx0XHRcdG1bdG1wLmlkXS5vcmlnaW5hbCA9IGQ7XG5cdFx0XHRpZih0bXAuc3RhdGUuc2VsZWN0ZWQpIHtcblx0XHRcdFx0dGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkLnB1c2godG1wLmlkKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB0bXAuaWQ7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBwYXJzZXMgYSBub2RlIGZyb20gYSBKU09OIG9iamVjdCBhbmQgYXBwZW5kcyBpdCB0byB0aGUgaW4gbWVtb3J5IHRyZWUgbW9kZWwuIFVzZWQgaW50ZXJuYWxseS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqIEBuYW1lIF9wYXJzZV9tb2RlbF9mcm9tX2pzb24oZCBbLCBwLCBwc10pXG5cdFx0ICogQHBhcmFtICB7T2JqZWN0fSBkIHRoZSBKU09OIG9iamVjdCB0byBwYXJzZVxuXHRcdCAqIEBwYXJhbSAge1N0cmluZ30gcCB0aGUgcGFyZW50IElEXG5cdFx0ICogQHBhcmFtICB7QXJyYXl9IHBzIGxpc3Qgb2YgYWxsIHBhcmVudHNcblx0XHQgKiBAcmV0dXJuIHtTdHJpbmd9IHRoZSBJRCBvZiB0aGUgb2JqZWN0IGFkZGVkIHRvIHRoZSBtb2RlbFxuXHRcdCAqL1xuXHRcdF9wYXJzZV9tb2RlbF9mcm9tX2pzb24gOiBmdW5jdGlvbiAoZCwgcCwgcHMpIHtcblx0XHRcdGlmKCFwcykgeyBwcyA9IFtdOyB9XG5cdFx0XHRlbHNlIHsgcHMgPSBwcy5jb25jYXQoKTsgfVxuXHRcdFx0aWYocCkgeyBwcy51bnNoaWZ0KHApOyB9XG5cdFx0XHR2YXIgdGlkID0gZmFsc2UsIGksIGosIGMsIGUsIG0gPSB0aGlzLl9tb2RlbC5kYXRhLCBkZiA9IHRoaXMuX21vZGVsLmRlZmF1bHRfc3RhdGUsIHRtcDtcblx0XHRcdGRvIHtcblx0XHRcdFx0dGlkID0gJ2onICsgdGhpcy5faWQgKyAnXycgKyAoKyt0aGlzLl9jbnQpO1xuXHRcdFx0fSB3aGlsZShtW3RpZF0pO1xuXG5cdFx0XHR0bXAgPSB7XG5cdFx0XHRcdGlkXHRcdFx0OiBmYWxzZSxcblx0XHRcdFx0dGV4dFx0XHQ6IHR5cGVvZiBkID09PSAnc3RyaW5nJyA/IGQgOiAnJyxcblx0XHRcdFx0aWNvblx0XHQ6IHR5cGVvZiBkID09PSAnb2JqZWN0JyAmJiBkLmljb24gIT09IHVuZGVmaW5lZCA/IGQuaWNvbiA6IHRydWUsXG5cdFx0XHRcdHBhcmVudFx0XHQ6IHAsXG5cdFx0XHRcdHBhcmVudHNcdFx0OiBwcyxcblx0XHRcdFx0Y2hpbGRyZW5cdDogW10sXG5cdFx0XHRcdGNoaWxkcmVuX2RcdDogW10sXG5cdFx0XHRcdGRhdGFcdFx0OiBudWxsLFxuXHRcdFx0XHRzdGF0ZVx0XHQ6IHsgfSxcblx0XHRcdFx0bGlfYXR0clx0XHQ6IHsgaWQgOiBmYWxzZSB9LFxuXHRcdFx0XHRhX2F0dHJcdFx0OiB7IGhyZWYgOiAnIycgfSxcblx0XHRcdFx0b3JpZ2luYWxcdDogZmFsc2Vcblx0XHRcdH07XG5cdFx0XHRmb3IoaSBpbiBkZikge1xuXHRcdFx0XHRpZihkZi5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0XHRcdHRtcC5zdGF0ZVtpXSA9IGRmW2ldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZihkICYmIGQuaWQpIHsgdG1wLmlkID0gZC5pZDsgfVxuXHRcdFx0aWYoZCAmJiBkLnRleHQpIHsgdG1wLnRleHQgPSBkLnRleHQ7IH1cblx0XHRcdGlmKGQgJiYgZC5kYXRhICYmIGQuZGF0YS5qc3RyZWUgJiYgZC5kYXRhLmpzdHJlZS5pY29uKSB7XG5cdFx0XHRcdHRtcC5pY29uID0gZC5kYXRhLmpzdHJlZS5pY29uO1xuXHRcdFx0fVxuXHRcdFx0aWYoZCAmJiBkLmRhdGEpIHtcblx0XHRcdFx0dG1wLmRhdGEgPSBkLmRhdGE7XG5cdFx0XHRcdGlmKGQuZGF0YS5qc3RyZWUpIHtcblx0XHRcdFx0XHRmb3IoaSBpbiBkLmRhdGEuanN0cmVlKSB7XG5cdFx0XHRcdFx0XHRpZihkLmRhdGEuanN0cmVlLmhhc093blByb3BlcnR5KGkpKSB7XG5cdFx0XHRcdFx0XHRcdHRtcC5zdGF0ZVtpXSA9IGQuZGF0YS5qc3RyZWVbaV07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZihkICYmIHR5cGVvZiBkLnN0YXRlID09PSAnb2JqZWN0Jykge1xuXHRcdFx0XHRmb3IgKGkgaW4gZC5zdGF0ZSkge1xuXHRcdFx0XHRcdGlmKGQuc3RhdGUuaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdFx0XHRcdHRtcC5zdGF0ZVtpXSA9IGQuc3RhdGVbaV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZihkICYmIHR5cGVvZiBkLmxpX2F0dHIgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRcdGZvciAoaSBpbiBkLmxpX2F0dHIpIHtcblx0XHRcdFx0XHRpZihkLmxpX2F0dHIuaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdFx0XHRcdHRtcC5saV9hdHRyW2ldID0gZC5saV9hdHRyW2ldO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYodG1wLmxpX2F0dHIuaWQgJiYgIXRtcC5pZCkge1xuXHRcdFx0XHR0bXAuaWQgPSB0bXAubGlfYXR0ci5pZDtcblx0XHRcdH1cblx0XHRcdGlmKCF0bXAuaWQpIHtcblx0XHRcdFx0dG1wLmlkID0gdGlkO1xuXHRcdFx0fVxuXHRcdFx0aWYoIXRtcC5saV9hdHRyLmlkKSB7XG5cdFx0XHRcdHRtcC5saV9hdHRyLmlkID0gdG1wLmlkO1xuXHRcdFx0fVxuXHRcdFx0aWYoZCAmJiB0eXBlb2YgZC5hX2F0dHIgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRcdGZvciAoaSBpbiBkLmFfYXR0cikge1xuXHRcdFx0XHRcdGlmKGQuYV9hdHRyLmhhc093blByb3BlcnR5KGkpKSB7XG5cdFx0XHRcdFx0XHR0bXAuYV9hdHRyW2ldID0gZC5hX2F0dHJbaV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZihkICYmIGQuY2hpbGRyZW4gJiYgZC5jaGlsZHJlbi5sZW5ndGgpIHtcblx0XHRcdFx0Zm9yKGkgPSAwLCBqID0gZC5jaGlsZHJlbi5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0XHRjID0gdGhpcy5fcGFyc2VfbW9kZWxfZnJvbV9qc29uKGQuY2hpbGRyZW5baV0sIHRtcC5pZCwgcHMpO1xuXHRcdFx0XHRcdGUgPSBtW2NdO1xuXHRcdFx0XHRcdHRtcC5jaGlsZHJlbi5wdXNoKGMpO1xuXHRcdFx0XHRcdGlmKGUuY2hpbGRyZW5fZC5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdHRtcC5jaGlsZHJlbl9kID0gdG1wLmNoaWxkcmVuX2QuY29uY2F0KGUuY2hpbGRyZW5fZCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHRtcC5jaGlsZHJlbl9kID0gdG1wLmNoaWxkcmVuX2QuY29uY2F0KHRtcC5jaGlsZHJlbik7XG5cdFx0XHR9XG5cdFx0XHRpZihkICYmIGQuY2hpbGRyZW4gJiYgZC5jaGlsZHJlbiA9PT0gdHJ1ZSkge1xuXHRcdFx0XHR0bXAuc3RhdGUubG9hZGVkID0gZmFsc2U7XG5cdFx0XHRcdHRtcC5jaGlsZHJlbiA9IFtdO1xuXHRcdFx0XHR0bXAuY2hpbGRyZW5fZCA9IFtdO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRlIGQuZGF0YTtcblx0XHRcdGRlbGV0ZSBkLmNoaWxkcmVuO1xuXHRcdFx0dG1wLm9yaWdpbmFsID0gZDtcblx0XHRcdG1bdG1wLmlkXSA9IHRtcDtcblx0XHRcdGlmKHRtcC5zdGF0ZS5zZWxlY3RlZCkge1xuXHRcdFx0XHR0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQucHVzaCh0bXAuaWQpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRtcC5pZDtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIHJlZHJhd3MgYWxsIG5vZGVzIHRoYXQgbmVlZCB0byBiZSByZWRyYXduLiBVc2VkIGludGVybmFsbHkuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKiBAbmFtZSBfcmVkcmF3KClcblx0XHQgKiBAdHJpZ2dlciByZWRyYXcuanN0cmVlXG5cdFx0ICovXG5cdFx0X3JlZHJhdyA6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBub2RlcyA9IHRoaXMuX21vZGVsLmZvcmNlX2Z1bGxfcmVkcmF3ID8gdGhpcy5fbW9kZWwuZGF0YVsnIyddLmNoaWxkcmVuLmNvbmNhdChbXSkgOiB0aGlzLl9tb2RlbC5jaGFuZ2VkLmNvbmNhdChbXSksXG5cdFx0XHRcdGYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdVTCcpLCB0bXAsIGksIGo7XG5cdFx0XHRmb3IoaSA9IDAsIGogPSBub2Rlcy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0dG1wID0gdGhpcy5yZWRyYXdfbm9kZShub2Rlc1tpXSwgdHJ1ZSwgdGhpcy5fbW9kZWwuZm9yY2VfZnVsbF9yZWRyYXcpO1xuXHRcdFx0XHRpZih0bXAgJiYgdGhpcy5fbW9kZWwuZm9yY2VfZnVsbF9yZWRyYXcpIHtcblx0XHRcdFx0XHRmLmFwcGVuZENoaWxkKHRtcCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmKHRoaXMuX21vZGVsLmZvcmNlX2Z1bGxfcmVkcmF3KSB7XG5cdFx0XHRcdGYuY2xhc3NOYW1lID0gdGhpcy5nZXRfY29udGFpbmVyX3VsKClbMF0uY2xhc3NOYW1lO1xuXHRcdFx0XHR0aGlzLmVsZW1lbnQuZW1wdHkoKS5hcHBlbmQoZik7XG5cdFx0XHRcdC8vdGhpcy5nZXRfY29udGFpbmVyX3VsKClbMF0uYXBwZW5kQ2hpbGQoZik7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLl9tb2RlbC5mb3JjZV9mdWxsX3JlZHJhdyA9IGZhbHNlO1xuXHRcdFx0dGhpcy5fbW9kZWwuY2hhbmdlZCA9IFtdO1xuXHRcdFx0LyoqXG5cdFx0XHQgKiB0cmlnZ2VyZWQgYWZ0ZXIgbm9kZXMgYXJlIHJlZHJhd25cblx0XHRcdCAqIEBldmVudFxuXHRcdFx0ICogQG5hbWUgcmVkcmF3LmpzdHJlZVxuXHRcdFx0ICogQHBhcmFtIHthcnJheX0gbm9kZXMgdGhlIHJlZHJhd24gbm9kZXNcblx0XHRcdCAqL1xuXHRcdFx0dGhpcy50cmlnZ2VyKCdyZWRyYXcnLCB7IFwibm9kZXNcIiA6IG5vZGVzIH0pO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogcmVkcmF3cyBhbGwgbm9kZXMgdGhhdCBuZWVkIHRvIGJlIHJlZHJhd24gb3Igb3B0aW9uYWxseSAtIHRoZSB3aG9sZSB0cmVlXG5cdFx0ICogQG5hbWUgcmVkcmF3KFtmdWxsXSlcblx0XHQgKiBAcGFyYW0ge0Jvb2xlYW59IGZ1bGwgaWYgc2V0IHRvIGB0cnVlYCBhbGwgbm9kZXMgYXJlIHJlZHJhd24uXG5cdFx0ICovXG5cdFx0cmVkcmF3IDogZnVuY3Rpb24gKGZ1bGwpIHtcblx0XHRcdGlmKGZ1bGwpIHtcblx0XHRcdFx0dGhpcy5fbW9kZWwuZm9yY2VfZnVsbF9yZWRyYXcgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0Ly9pZih0aGlzLl9tb2RlbC5yZWRyYXdfdGltZW91dCkge1xuXHRcdFx0Ly9cdGNsZWFyVGltZW91dCh0aGlzLl9tb2RlbC5yZWRyYXdfdGltZW91dCk7XG5cdFx0XHQvL31cblx0XHRcdC8vdGhpcy5fbW9kZWwucmVkcmF3X3RpbWVvdXQgPSBzZXRUaW1lb3V0KCQucHJveHkodGhpcy5fcmVkcmF3LCB0aGlzKSwwKTtcblx0XHRcdHRoaXMuX3JlZHJhdygpO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogcmVkcmF3cyBhIHNpbmdsZSBub2RlLiBVc2VkIGludGVybmFsbHkuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKiBAbmFtZSByZWRyYXdfbm9kZShub2RlLCBkZWVwLCBpc19jYWxsYmFjaylcblx0XHQgKiBAcGFyYW0ge21peGVkfSBub2RlIHRoZSBub2RlIHRvIHJlZHJhd1xuXHRcdCAqIEBwYXJhbSB7Qm9vbGVhbn0gZGVlcCBzaG91bGQgY2hpbGQgbm9kZXMgYmUgcmVkcmF3biB0b29cblx0XHQgKiBAcGFyYW0ge0Jvb2xlYW59IGlzX2NhbGxiYWNrIGlzIHRoaXMgYSByZWN1cnNpb24gY2FsbFxuXHRcdCAqL1xuXHRcdHJlZHJhd19ub2RlIDogZnVuY3Rpb24gKG5vZGUsIGRlZXAsIGlzX2NhbGxiYWNrKSB7XG5cdFx0XHR2YXIgb2JqID0gdGhpcy5nZXRfbm9kZShub2RlKSxcblx0XHRcdFx0cGFyID0gZmFsc2UsXG5cdFx0XHRcdGluZCA9IGZhbHNlLFxuXHRcdFx0XHRvbGQgPSBmYWxzZSxcblx0XHRcdFx0aSA9IGZhbHNlLFxuXHRcdFx0XHRqID0gZmFsc2UsXG5cdFx0XHRcdGsgPSBmYWxzZSxcblx0XHRcdFx0YyA9ICcnLFxuXHRcdFx0XHRkID0gZG9jdW1lbnQsXG5cdFx0XHRcdG0gPSB0aGlzLl9tb2RlbC5kYXRhLFxuXHRcdFx0XHRmID0gZmFsc2UsXG5cdFx0XHRcdHMgPSBmYWxzZTtcblx0XHRcdGlmKCFvYmopIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRpZihvYmouaWQgPT09ICcjJykgeyAgcmV0dXJuIHRoaXMucmVkcmF3KHRydWUpOyB9XG5cdFx0XHRkZWVwID0gZGVlcCB8fCBvYmouY2hpbGRyZW4ubGVuZ3RoID09PSAwO1xuXHRcdFx0bm9kZSA9IGQuZ2V0RWxlbWVudEJ5SWQob2JqLmlkKTsgLy8sIHRoaXMuZWxlbWVudCk7XG5cdFx0XHRpZighbm9kZSkge1xuXHRcdFx0XHRkZWVwID0gdHJ1ZTtcblx0XHRcdFx0Ly9ub2RlID0gZC5jcmVhdGVFbGVtZW50KCdMSScpO1xuXHRcdFx0XHRpZighaXNfY2FsbGJhY2spIHtcblx0XHRcdFx0XHRwYXIgPSBvYmoucGFyZW50ICE9PSAnIycgPyAkKCcjJyArIG9iai5wYXJlbnQsIHRoaXMuZWxlbWVudClbMF0gOiBudWxsO1xuXHRcdFx0XHRcdGlmKHBhciAhPT0gbnVsbCAmJiAoIXBhciB8fCAhbVtvYmoucGFyZW50XS5zdGF0ZS5vcGVuZWQpKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGluZCA9ICQuaW5BcnJheShvYmouaWQsIHBhciA9PT0gbnVsbCA/IG1bJyMnXS5jaGlsZHJlbiA6IG1bb2JqLnBhcmVudF0uY2hpbGRyZW4pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0bm9kZSA9ICQobm9kZSk7XG5cdFx0XHRcdGlmKCFpc19jYWxsYmFjaykge1xuXHRcdFx0XHRcdHBhciA9IG5vZGUucGFyZW50KCkucGFyZW50KClbMF07XG5cdFx0XHRcdFx0aWYocGFyID09PSB0aGlzLmVsZW1lbnRbMF0pIHtcblx0XHRcdFx0XHRcdHBhciA9IG51bGw7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGluZCA9IG5vZGUuaW5kZXgoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBtW29iai5pZF0uZGF0YSA9IG5vZGUuZGF0YSgpOyAvLyB1c2Ugb25seSBub2RlJ3MgZGF0YSwgbm8gbmVlZCB0byB0b3VjaCBqcXVlcnkgc3RvcmFnZVxuXHRcdFx0XHRpZighZGVlcCAmJiBvYmouY2hpbGRyZW4ubGVuZ3RoICYmICFub2RlLmNoaWxkcmVuKCd1bCcpLmxlbmd0aCkge1xuXHRcdFx0XHRcdGRlZXAgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKCFkZWVwKSB7XG5cdFx0XHRcdFx0b2xkID0gbm9kZS5jaGlsZHJlbignVUwnKVswXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRzID0gbm9kZS5hdHRyKCdhcmlhLXNlbGVjdGVkJyk7XG5cdFx0XHRcdGYgPSBub2RlLmNoaWxkcmVuKCcuanN0cmVlLWFuY2hvcicpWzBdID09PSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuXHRcdFx0XHRub2RlLnJlbW92ZSgpO1xuXHRcdFx0XHQvL25vZGUgPSBkLmNyZWF0ZUVsZW1lbnQoJ0xJJyk7XG5cdFx0XHRcdC8vbm9kZSA9IG5vZGVbMF07XG5cdFx0XHR9XG5cdFx0XHRub2RlID0gX25vZGUuY2xvbmVOb2RlKHRydWUpO1xuXHRcdFx0Ly8gbm9kZSBpcyBET00sIGRlZXAgaXMgYm9vbGVhblxuXG5cdFx0XHRjID0gJ2pzdHJlZS1ub2RlICc7XG5cdFx0XHRmb3IoaSBpbiBvYmoubGlfYXR0cikge1xuXHRcdFx0XHRpZihvYmoubGlfYXR0ci5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0XHRcdGlmKGkgPT09ICdpZCcpIHsgY29udGludWU7IH1cblx0XHRcdFx0XHRpZihpICE9PSAnY2xhc3MnKSB7XG5cdFx0XHRcdFx0XHRub2RlLnNldEF0dHJpYnV0ZShpLCBvYmoubGlfYXR0cltpXSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0YyArPSBvYmoubGlfYXR0cltpXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmKHMgJiYgcyAhPT0gXCJmYWxzZVwiKSB7XG5cdFx0XHRcdG5vZGUuc2V0QXR0cmlidXRlKCdhcmlhLXNlbGVjdGVkJywgdHJ1ZSk7XG5cdFx0XHR9XG5cdFx0XHRpZighb2JqLmNoaWxkcmVuLmxlbmd0aCAmJiBvYmouc3RhdGUubG9hZGVkKSB7XG5cdFx0XHRcdGMgKz0gJyBqc3RyZWUtbGVhZic7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0YyArPSBvYmouc3RhdGUub3BlbmVkID8gJyBqc3RyZWUtb3BlbicgOiAnIGpzdHJlZS1jbG9zZWQnO1xuXHRcdFx0XHRub2RlLnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsIG9iai5zdGF0ZS5vcGVuZWQpO1xuXHRcdFx0fVxuXHRcdFx0aWYob2JqLnBhcmVudCAhPT0gbnVsbCAmJiBtW29iai5wYXJlbnRdLmNoaWxkcmVuW21bb2JqLnBhcmVudF0uY2hpbGRyZW4ubGVuZ3RoIC0gMV0gPT09IG9iai5pZCkge1xuXHRcdFx0XHRjICs9ICcganN0cmVlLWxhc3QnO1xuXHRcdFx0fVxuXHRcdFx0bm9kZS5pZCA9IG9iai5pZDtcblx0XHRcdG5vZGUuY2xhc3NOYW1lID0gYztcblx0XHRcdGMgPSAoIG9iai5zdGF0ZS5zZWxlY3RlZCA/ICcganN0cmVlLWNsaWNrZWQnIDogJycpICsgKCBvYmouc3RhdGUuZGlzYWJsZWQgPyAnIGpzdHJlZS1kaXNhYmxlZCcgOiAnJyk7XG5cdFx0XHRmb3IoaiBpbiBvYmouYV9hdHRyKSB7XG5cdFx0XHRcdGlmKG9iai5hX2F0dHIuaGFzT3duUHJvcGVydHkoaikpIHtcblx0XHRcdFx0XHRpZihqID09PSAnaHJlZicgJiYgb2JqLmFfYXR0cltqXSA9PT0gJyMnKSB7IGNvbnRpbnVlOyB9XG5cdFx0XHRcdFx0aWYoaiAhPT0gJ2NsYXNzJykge1xuXHRcdFx0XHRcdFx0bm9kZS5jaGlsZE5vZGVzWzFdLnNldEF0dHJpYnV0ZShqLCBvYmouYV9hdHRyW2pdKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRjICs9ICcgJyArIG9iai5hX2F0dHJbal07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZihjLmxlbmd0aCkge1xuXHRcdFx0XHRub2RlLmNoaWxkTm9kZXNbMV0uY2xhc3NOYW1lID0gJ2pzdHJlZS1hbmNob3IgJyArIGM7XG5cdFx0XHR9XG5cdFx0XHRpZigob2JqLmljb24gJiYgb2JqLmljb24gIT09IHRydWUpIHx8IG9iai5pY29uID09PSBmYWxzZSkge1xuXHRcdFx0XHRpZihvYmouaWNvbiA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHRub2RlLmNoaWxkTm9kZXNbMV0uY2hpbGROb2Rlc1swXS5jbGFzc05hbWUgKz0gJyBqc3RyZWUtdGhlbWVpY29uLWhpZGRlbic7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZihvYmouaWNvbi5pbmRleE9mKCcvJykgPT09IC0xICYmIG9iai5pY29uLmluZGV4T2YoJy4nKSA9PT0gLTEpIHtcblx0XHRcdFx0XHRub2RlLmNoaWxkTm9kZXNbMV0uY2hpbGROb2Rlc1swXS5jbGFzc05hbWUgKz0gJyAnICsgb2JqLmljb24gKyAnIGpzdHJlZS10aGVtZWljb24tY3VzdG9tJztcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRub2RlLmNoaWxkTm9kZXNbMV0uY2hpbGROb2Rlc1swXS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAndXJsKCcrb2JqLmljb24rJyknO1xuXHRcdFx0XHRcdG5vZGUuY2hpbGROb2Rlc1sxXS5jaGlsZE5vZGVzWzBdLnN0eWxlLmJhY2tncm91bmRQb3NpdGlvbiA9ICdjZW50ZXIgY2VudGVyJztcblx0XHRcdFx0XHRub2RlLmNoaWxkTm9kZXNbMV0uY2hpbGROb2Rlc1swXS5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9ICdhdXRvJztcblx0XHRcdFx0XHRub2RlLmNoaWxkTm9kZXNbMV0uY2hpbGROb2Rlc1swXS5jbGFzc05hbWUgKz0gJyBqc3RyZWUtdGhlbWVpY29uLWN1c3RvbSc7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdC8vbm9kZS5jaGlsZE5vZGVzWzFdLmFwcGVuZENoaWxkKGQuY3JlYXRlVGV4dE5vZGUob2JqLnRleHQpKTtcblx0XHRcdG5vZGUuY2hpbGROb2Rlc1sxXS5pbm5lckhUTUwgKz0gb2JqLnRleHQ7XG5cdFx0XHQvLyBpZihvYmouZGF0YSkgeyAkLmRhdGEobm9kZSwgb2JqLmRhdGEpOyB9IC8vIGFsd2F5cyB3b3JrIHdpdGggbm9kZSdzIGRhdGEsIG5vIG5lZWQgdG8gdG91Y2gganF1ZXJ5IHN0b3JlXG5cblx0XHRcdGlmKGRlZXAgJiYgb2JqLmNoaWxkcmVuLmxlbmd0aCAmJiBvYmouc3RhdGUub3BlbmVkKSB7XG5cdFx0XHRcdGsgPSBkLmNyZWF0ZUVsZW1lbnQoJ1VMJyk7XG5cdFx0XHRcdGsuc2V0QXR0cmlidXRlKCdyb2xlJywgJ2dyb3VwJyk7XG5cdFx0XHRcdGsuY2xhc3NOYW1lID0gJ2pzdHJlZS1jaGlsZHJlbic7XG5cdFx0XHRcdGZvcihpID0gMCwgaiA9IG9iai5jaGlsZHJlbi5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0XHRrLmFwcGVuZENoaWxkKHRoaXMucmVkcmF3X25vZGUob2JqLmNoaWxkcmVuW2ldLCBkZWVwLCB0cnVlKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0bm9kZS5hcHBlbmRDaGlsZChrKTtcblx0XHRcdH1cblx0XHRcdGlmKG9sZCkge1xuXHRcdFx0XHRub2RlLmFwcGVuZENoaWxkKG9sZCk7XG5cdFx0XHR9XG5cdFx0XHRpZighaXNfY2FsbGJhY2spIHtcblx0XHRcdFx0Ly8gYXBwZW5kIGJhY2sgdXNpbmcgcGFyIC8gaW5kXG5cdFx0XHRcdGlmKCFwYXIpIHtcblx0XHRcdFx0XHRwYXIgPSB0aGlzLmVsZW1lbnRbMF07XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoIXBhci5nZXRFbGVtZW50c0J5VGFnTmFtZSgnVUwnKS5sZW5ndGgpIHtcblx0XHRcdFx0XHRpID0gZC5jcmVhdGVFbGVtZW50KCdVTCcpO1xuXHRcdFx0XHRcdGkuc2V0QXR0cmlidXRlKCdyb2xlJywgJ2dyb3VwJyk7XG5cdFx0XHRcdFx0aS5jbGFzc05hbWUgPSAnanN0cmVlLWNoaWxkcmVuJztcblx0XHRcdFx0XHRwYXIuYXBwZW5kQ2hpbGQoaSk7XG5cdFx0XHRcdFx0cGFyID0gaTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRwYXIgPSBwYXIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ1VMJylbMF07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZihpbmQgPCBwYXIuY2hpbGROb2Rlcy5sZW5ndGgpIHtcblx0XHRcdFx0XHRwYXIuaW5zZXJ0QmVmb3JlKG5vZGUsIHBhci5jaGlsZE5vZGVzW2luZF0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHBhci5hcHBlbmRDaGlsZChub2RlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZihmKSB7XG5cdFx0XHRcdFx0bm9kZS5jaGlsZE5vZGVzWzFdLmZvY3VzKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBub2RlO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogb3BlbnMgYSBub2RlLCByZXZhbGluZyBpdHMgY2hpbGRyZW4uIElmIHRoZSBub2RlIGlzIG5vdCBsb2FkZWQgaXQgd2lsbCBiZSBsb2FkZWQgYW5kIG9wZW5lZCBvbmNlIHJlYWR5LlxuXHRcdCAqIEBuYW1lIG9wZW5fbm9kZShvYmogWywgY2FsbGJhY2ssIGFuaW1hdGlvbl0pXG5cdFx0ICogQHBhcmFtIHttaXhlZH0gb2JqIHRoZSBub2RlIHRvIG9wZW5cblx0XHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBhIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgb25jZSB0aGUgbm9kZSBpcyBvcGVuZWRcblx0XHQgKiBAcGFyYW0ge051bWJlcn0gYW5pbWF0aW9uIHRoZSBhbmltYXRpb24gZHVyYXRpb24gaW4gbWlsbGlzZWNvbmRzIHdoZW4gb3BlbmluZyB0aGUgbm9kZSAob3ZlcnJpZGVzIHRoZSBgY29yZS5hbmltYXRpb25gIHNldHRpbmcpLiBVc2UgYGZhbHNlYCBmb3Igbm8gYW5pbWF0aW9uLlxuXHRcdCAqIEB0cmlnZ2VyIG9wZW5fbm9kZS5qc3RyZWUsIGFmdGVyX29wZW4uanN0cmVlXG5cdFx0ICovXG5cdFx0b3Blbl9ub2RlIDogZnVuY3Rpb24gKG9iaiwgY2FsbGJhY2ssIGFuaW1hdGlvbikge1xuXHRcdFx0dmFyIHQxLCB0MiwgZCwgdDtcblx0XHRcdGlmKCQuaXNBcnJheShvYmopKSB7XG5cdFx0XHRcdG9iaiA9IG9iai5zbGljZSgpO1xuXHRcdFx0XHRmb3IodDEgPSAwLCB0MiA9IG9iai5sZW5ndGg7IHQxIDwgdDI7IHQxKyspIHtcblx0XHRcdFx0XHR0aGlzLm9wZW5fbm9kZShvYmpbdDFdLCBjYWxsYmFjaywgYW5pbWF0aW9uKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdGlmKCFvYmogfHwgb2JqLmlkID09PSAnIycpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0YW5pbWF0aW9uID0gYW5pbWF0aW9uID09PSB1bmRlZmluZWQgPyB0aGlzLnNldHRpbmdzLmNvcmUuYW5pbWF0aW9uIDogYW5pbWF0aW9uO1xuXHRcdFx0aWYoIXRoaXMuaXNfY2xvc2VkKG9iaikpIHtcblx0XHRcdFx0aWYoY2FsbGJhY2spIHtcblx0XHRcdFx0XHRjYWxsYmFjay5jYWxsKHRoaXMsIG9iaiwgZmFsc2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGlmKCF0aGlzLmlzX2xvYWRlZChvYmopKSB7XG5cdFx0XHRcdGlmKHRoaXMuaXNfbG9hZGluZyhvYmopKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHNldFRpbWVvdXQoJC5wcm94eShmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHR0aGlzLm9wZW5fbm9kZShvYmosIGNhbGxiYWNrLCBhbmltYXRpb24pO1xuXHRcdFx0XHRcdH0sIHRoaXMpLCA1MDApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMubG9hZF9ub2RlKG9iaiwgZnVuY3Rpb24gKG8sIG9rKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG9rID8gdGhpcy5vcGVuX25vZGUobywgY2FsbGJhY2ssIGFuaW1hdGlvbikgOiAoY2FsbGJhY2sgPyBjYWxsYmFjay5jYWxsKHRoaXMsIG8sIGZhbHNlKSA6IGZhbHNlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0ZCA9IHRoaXMuZ2V0X25vZGUob2JqLCB0cnVlKTtcblx0XHRcdFx0dCA9IHRoaXM7XG5cdFx0XHRcdGlmKGQubGVuZ3RoKSB7XG5cdFx0XHRcdFx0aWYob2JqLmNoaWxkcmVuLmxlbmd0aCAmJiAhdGhpcy5fZmlyc3RDaGlsZChkLmNoaWxkcmVuKCd1bCcpWzBdKSkge1xuXHRcdFx0XHRcdFx0b2JqLnN0YXRlLm9wZW5lZCA9IHRydWU7XG5cdFx0XHRcdFx0XHR0aGlzLnJlZHJhd19ub2RlKG9iaiwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRkID0gdGhpcy5nZXRfbm9kZShvYmosIHRydWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZighYW5pbWF0aW9uKSB7XG5cdFx0XHRcdFx0XHRkWzBdLmNsYXNzTmFtZSA9IGRbMF0uY2xhc3NOYW1lLnJlcGxhY2UoJ2pzdHJlZS1jbG9zZWQnLCAnanN0cmVlLW9wZW4nKTtcblx0XHRcdFx0XHRcdGRbMF0uc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCB0cnVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRkXG5cdFx0XHRcdFx0XHRcdC5jaGlsZHJlbihcInVsXCIpLmNzcyhcImRpc3BsYXlcIixcIm5vbmVcIikuZW5kKClcblx0XHRcdFx0XHRcdFx0LnJlbW92ZUNsYXNzKFwianN0cmVlLWNsb3NlZFwiKS5hZGRDbGFzcyhcImpzdHJlZS1vcGVuXCIpLmF0dHIoXCJhcmlhLWV4cGFuZGVkXCIsIHRydWUpXG5cdFx0XHRcdFx0XHRcdC5jaGlsZHJlbihcInVsXCIpLnN0b3AodHJ1ZSwgdHJ1ZSlcblx0XHRcdFx0XHRcdFx0XHQuc2xpZGVEb3duKGFuaW1hdGlvbiwgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcblx0XHRcdFx0XHRcdFx0XHRcdHQudHJpZ2dlcihcImFmdGVyX29wZW5cIiwgeyBcIm5vZGVcIiA6IG9iaiB9KTtcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0b2JqLnN0YXRlLm9wZW5lZCA9IHRydWU7XG5cdFx0XHRcdGlmKGNhbGxiYWNrKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2suY2FsbCh0aGlzLCBvYmosIHRydWUpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8qKlxuXHRcdFx0XHQgKiB0cmlnZ2VyZWQgd2hlbiBhIG5vZGUgaXMgb3BlbmVkIChpZiB0aGVyZSBpcyBhbiBhbmltYXRpb24gaXQgd2lsbCBub3QgYmUgY29tcGxldGVkIHlldClcblx0XHRcdFx0ICogQGV2ZW50XG5cdFx0XHRcdCAqIEBuYW1lIG9wZW5fbm9kZS5qc3RyZWVcblx0XHRcdFx0ICogQHBhcmFtIHtPYmplY3R9IG5vZGUgdGhlIG9wZW5lZCBub2RlXG5cdFx0XHRcdCAqL1xuXHRcdFx0XHR0aGlzLnRyaWdnZXIoJ29wZW5fbm9kZScsIHsgXCJub2RlXCIgOiBvYmogfSk7XG5cdFx0XHRcdGlmKCFhbmltYXRpb24gfHwgIWQubGVuZ3RoKSB7XG5cdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0ICogdHJpZ2dlcmVkIHdoZW4gYSBub2RlIGlzIG9wZW5lZCBhbmQgdGhlIGFuaW1hdGlvbiBpcyBjb21wbGV0ZVxuXHRcdFx0XHRcdCAqIEBldmVudFxuXHRcdFx0XHRcdCAqIEBuYW1lIGFmdGVyX29wZW4uanN0cmVlXG5cdFx0XHRcdFx0ICogQHBhcmFtIHtPYmplY3R9IG5vZGUgdGhlIG9wZW5lZCBub2RlXG5cdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0dGhpcy50cmlnZ2VyKFwiYWZ0ZXJfb3BlblwiLCB7IFwibm9kZVwiIDogb2JqIH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBvcGVucyBldmVyeSBwYXJlbnQgb2YgYSBub2RlIChub2RlIHNob3VsZCBiZSBsb2FkZWQpXG5cdFx0ICogQG5hbWUgX29wZW5fdG8ob2JqKVxuXHRcdCAqIEBwYXJhbSB7bWl4ZWR9IG9iaiB0aGUgbm9kZSB0byByZXZlYWxcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdF9vcGVuX3RvIDogZnVuY3Rpb24gKG9iaikge1xuXHRcdFx0b2JqID0gdGhpcy5nZXRfbm9kZShvYmopO1xuXHRcdFx0aWYoIW9iaiB8fCBvYmouaWQgPT09ICcjJykge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHR2YXIgaSwgaiwgcCA9IG9iai5wYXJlbnRzO1xuXHRcdFx0Zm9yKGkgPSAwLCBqID0gcC5sZW5ndGg7IGkgPCBqOyBpKz0xKSB7XG5cdFx0XHRcdGlmKGkgIT09ICcjJykge1xuXHRcdFx0XHRcdHRoaXMub3Blbl9ub2RlKHBbaV0sIGZhbHNlLCAwKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuICQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQob2JqLmlkKSk7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBjbG9zZXMgYSBub2RlLCBoaWRpbmcgaXRzIGNoaWxkcmVuXG5cdFx0ICogQG5hbWUgY2xvc2Vfbm9kZShvYmogWywgYW5pbWF0aW9uXSlcblx0XHQgKiBAcGFyYW0ge21peGVkfSBvYmogdGhlIG5vZGUgdG8gY2xvc2Vcblx0XHQgKiBAcGFyYW0ge051bWJlcn0gYW5pbWF0aW9uIHRoZSBhbmltYXRpb24gZHVyYXRpb24gaW4gbWlsbGlzZWNvbmRzIHdoZW4gY2xvc2luZyB0aGUgbm9kZSAob3ZlcnJpZGVzIHRoZSBgY29yZS5hbmltYXRpb25gIHNldHRpbmcpLiBVc2UgYGZhbHNlYCBmb3Igbm8gYW5pbWF0aW9uLlxuXHRcdCAqIEB0cmlnZ2VyIGNsb3NlX25vZGUuanN0cmVlLCBhZnRlcl9jbG9zZS5qc3RyZWVcblx0XHQgKi9cblx0XHRjbG9zZV9ub2RlIDogZnVuY3Rpb24gKG9iaiwgYW5pbWF0aW9uKSB7XG5cdFx0XHR2YXIgdDEsIHQyLCB0LCBkO1xuXHRcdFx0aWYoJC5pc0FycmF5KG9iaikpIHtcblx0XHRcdFx0b2JqID0gb2JqLnNsaWNlKCk7XG5cdFx0XHRcdGZvcih0MSA9IDAsIHQyID0gb2JqLmxlbmd0aDsgdDEgPCB0MjsgdDErKykge1xuXHRcdFx0XHRcdHRoaXMuY2xvc2Vfbm9kZShvYmpbdDFdLCBhbmltYXRpb24pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0b2JqID0gdGhpcy5nZXRfbm9kZShvYmopO1xuXHRcdFx0aWYoIW9iaiB8fCBvYmouaWQgPT09ICcjJykge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRhbmltYXRpb24gPSBhbmltYXRpb24gPT09IHVuZGVmaW5lZCA/IHRoaXMuc2V0dGluZ3MuY29yZS5hbmltYXRpb24gOiBhbmltYXRpb247XG5cdFx0XHR0ID0gdGhpcztcblx0XHRcdGQgPSB0aGlzLmdldF9ub2RlKG9iaiwgdHJ1ZSk7XG5cdFx0XHRpZihkLmxlbmd0aCkge1xuXHRcdFx0XHRpZighYW5pbWF0aW9uKSB7XG5cdFx0XHRcdFx0ZFswXS5jbGFzc05hbWUgPSBkWzBdLmNsYXNzTmFtZS5yZXBsYWNlKCdqc3RyZWUtb3BlbicsICdqc3RyZWUtY2xvc2VkJyk7XG5cdFx0XHRcdFx0ZC5hdHRyKFwiYXJpYS1leHBhbmRlZFwiLCBmYWxzZSkuY2hpbGRyZW4oJ3VsJykucmVtb3ZlKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0ZFxuXHRcdFx0XHRcdFx0LmNoaWxkcmVuKFwidWxcIikuYXR0cihcInN0eWxlXCIsXCJkaXNwbGF5OmJsb2NrICFpbXBvcnRhbnRcIikuZW5kKClcblx0XHRcdFx0XHRcdC5yZW1vdmVDbGFzcyhcImpzdHJlZS1vcGVuXCIpLmFkZENsYXNzKFwianN0cmVlLWNsb3NlZFwiKS5hdHRyKFwiYXJpYS1leHBhbmRlZFwiLCBmYWxzZSlcblx0XHRcdFx0XHRcdC5jaGlsZHJlbihcInVsXCIpLnN0b3AodHJ1ZSwgdHJ1ZSkuc2xpZGVVcChhbmltYXRpb24sIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcblx0XHRcdFx0XHRcdFx0ZC5jaGlsZHJlbigndWwnKS5yZW1vdmUoKTtcblx0XHRcdFx0XHRcdFx0dC50cmlnZ2VyKFwiYWZ0ZXJfY2xvc2VcIiwgeyBcIm5vZGVcIiA6IG9iaiB9KTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRvYmouc3RhdGUub3BlbmVkID0gZmFsc2U7XG5cdFx0XHQvKipcblx0XHRcdCAqIHRyaWdnZXJlZCB3aGVuIGEgbm9kZSBpcyBjbG9zZWQgKGlmIHRoZXJlIGlzIGFuIGFuaW1hdGlvbiBpdCB3aWxsIG5vdCBiZSBjb21wbGV0ZSB5ZXQpXG5cdFx0XHQgKiBAZXZlbnRcblx0XHRcdCAqIEBuYW1lIGNsb3NlX25vZGUuanN0cmVlXG5cdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gbm9kZSB0aGUgY2xvc2VkIG5vZGVcblx0XHRcdCAqL1xuXHRcdFx0dGhpcy50cmlnZ2VyKCdjbG9zZV9ub2RlJyx7IFwibm9kZVwiIDogb2JqIH0pO1xuXHRcdFx0aWYoIWFuaW1hdGlvbiB8fCAhZC5sZW5ndGgpIHtcblx0XHRcdFx0LyoqXG5cdFx0XHRcdCAqIHRyaWdnZXJlZCB3aGVuIGEgbm9kZSBpcyBjbG9zZWQgYW5kIHRoZSBhbmltYXRpb24gaXMgY29tcGxldGVcblx0XHRcdFx0ICogQGV2ZW50XG5cdFx0XHRcdCAqIEBuYW1lIGFmdGVyX2Nsb3NlLmpzdHJlZVxuXHRcdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gbm9kZSB0aGUgY2xvc2VkIG5vZGVcblx0XHRcdFx0ICovXG5cdFx0XHRcdHRoaXMudHJpZ2dlcihcImFmdGVyX2Nsb3NlXCIsIHsgXCJub2RlXCIgOiBvYmogfSk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiB0b2dnbGVzIGEgbm9kZSAtIGNsb3NpbmcgaXQgaWYgaXQgaXMgb3Blbiwgb3BlbmluZyBpdCBpZiBpdCBpcyBjbG9zZWRcblx0XHQgKiBAbmFtZSB0b2dnbGVfbm9kZShvYmopXG5cdFx0ICogQHBhcmFtIHttaXhlZH0gb2JqIHRoZSBub2RlIHRvIHRvZ2dsZVxuXHRcdCAqL1xuXHRcdHRvZ2dsZV9ub2RlIDogZnVuY3Rpb24gKG9iaikge1xuXHRcdFx0dmFyIHQxLCB0Mjtcblx0XHRcdGlmKCQuaXNBcnJheShvYmopKSB7XG5cdFx0XHRcdG9iaiA9IG9iai5zbGljZSgpO1xuXHRcdFx0XHRmb3IodDEgPSAwLCB0MiA9IG9iai5sZW5ndGg7IHQxIDwgdDI7IHQxKyspIHtcblx0XHRcdFx0XHR0aGlzLnRvZ2dsZV9ub2RlKG9ialt0MV0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0aWYodGhpcy5pc19jbG9zZWQob2JqKSkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5vcGVuX25vZGUob2JqKTtcblx0XHRcdH1cblx0XHRcdGlmKHRoaXMuaXNfb3BlbihvYmopKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmNsb3NlX25vZGUob2JqKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIG9wZW5zIGFsbCBub2RlcyB3aXRoaW4gYSBub2RlIChvciB0aGUgdHJlZSksIHJldmFsaW5nIHRoZWlyIGNoaWxkcmVuLiBJZiB0aGUgbm9kZSBpcyBub3QgbG9hZGVkIGl0IHdpbGwgYmUgbG9hZGVkIGFuZCBvcGVuZWQgb25jZSByZWFkeS5cblx0XHQgKiBAbmFtZSBvcGVuX2FsbChbb2JqLCBhbmltYXRpb24sIG9yaWdpbmFsX29ial0pXG5cdFx0ICogQHBhcmFtIHttaXhlZH0gb2JqIHRoZSBub2RlIHRvIG9wZW4gcmVjdXJzaXZlbHksIG9taXQgdG8gb3BlbiBhbGwgbm9kZXMgaW4gdGhlIHRyZWVcblx0XHQgKiBAcGFyYW0ge051bWJlcn0gYW5pbWF0aW9uIHRoZSBhbmltYXRpb24gZHVyYXRpb24gaW4gbWlsbGlzZWNvbmRzIHdoZW4gb3BlbmluZyB0aGUgbm9kZXMsIHRoZSBkZWZhdWx0IGlzIG5vIGFuaW1hdGlvblxuXHRcdCAqIEBwYXJhbSB7alF1ZXJ5fSByZWZlcmVuY2UgdG8gdGhlIG5vZGUgdGhhdCBzdGFydGVkIHRoZSBwcm9jZXNzIChpbnRlcm5hbCB1c2UpXG5cdFx0ICogQHRyaWdnZXIgb3Blbl9hbGwuanN0cmVlXG5cdFx0ICovXG5cdFx0b3Blbl9hbGwgOiBmdW5jdGlvbiAob2JqLCBhbmltYXRpb24sIG9yaWdpbmFsX29iaikge1xuXHRcdFx0aWYoIW9iaikgeyBvYmogPSAnIyc7IH1cblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdGlmKCFvYmopIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHR2YXIgZG9tID0gb2JqLmlkID09PSAnIycgPyB0aGlzLmdldF9jb250YWluZXJfdWwoKSA6IHRoaXMuZ2V0X25vZGUob2JqLCB0cnVlKSwgaSwgaiwgX3RoaXM7XG5cdFx0XHRpZighZG9tLmxlbmd0aCkge1xuXHRcdFx0XHRmb3IoaSA9IDAsIGogPSBvYmouY2hpbGRyZW5fZC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0XHRpZih0aGlzLmlzX2Nsb3NlZCh0aGlzLl9tb2RlbC5kYXRhW29iai5jaGlsZHJlbl9kW2ldXSkpIHtcblx0XHRcdFx0XHRcdHRoaXMuX21vZGVsLmRhdGFbb2JqLmNoaWxkcmVuX2RbaV1dLnN0YXRlLm9wZW5lZCA9IHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB0aGlzLnRyaWdnZXIoJ29wZW5fYWxsJywgeyBcIm5vZGVcIiA6IG9iaiB9KTtcblx0XHRcdH1cblx0XHRcdG9yaWdpbmFsX29iaiA9IG9yaWdpbmFsX29iaiB8fCBkb207XG5cdFx0XHRfdGhpcyA9IHRoaXM7XG5cdFx0XHRkb20gPSB0aGlzLmlzX2Nsb3NlZChvYmopID8gZG9tLmZpbmQoJ2xpLmpzdHJlZS1jbG9zZWQnKS5hZGRCYWNrKCkgOiBkb20uZmluZCgnbGkuanN0cmVlLWNsb3NlZCcpO1xuXHRcdFx0ZG9tLmVhY2goZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRfdGhpcy5vcGVuX25vZGUoXG5cdFx0XHRcdFx0dGhpcyxcblx0XHRcdFx0XHRmdW5jdGlvbihub2RlLCBzdGF0dXMpIHsgaWYoc3RhdHVzICYmIHRoaXMuaXNfcGFyZW50KG5vZGUpKSB7IHRoaXMub3Blbl9hbGwobm9kZSwgYW5pbWF0aW9uLCBvcmlnaW5hbF9vYmopOyB9IH0sXG5cdFx0XHRcdFx0YW5pbWF0aW9uIHx8IDBcblx0XHRcdFx0KTtcblx0XHRcdH0pO1xuXHRcdFx0aWYob3JpZ2luYWxfb2JqLmZpbmQoJ2xpLmpzdHJlZS1jbG9zZWQnKS5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0LyoqXG5cdFx0XHRcdCAqIHRyaWdnZXJlZCB3aGVuIGFuIGBvcGVuX2FsbGAgY2FsbCBjb21wbGV0ZXNcblx0XHRcdFx0ICogQGV2ZW50XG5cdFx0XHRcdCAqIEBuYW1lIG9wZW5fYWxsLmpzdHJlZVxuXHRcdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gbm9kZSB0aGUgb3BlbmVkIG5vZGVcblx0XHRcdFx0ICovXG5cdFx0XHRcdHRoaXMudHJpZ2dlcignb3Blbl9hbGwnLCB7IFwibm9kZVwiIDogdGhpcy5nZXRfbm9kZShvcmlnaW5hbF9vYmopIH0pO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogY2xvc2VzIGFsbCBub2RlcyB3aXRoaW4gYSBub2RlIChvciB0aGUgdHJlZSksIHJldmFsaW5nIHRoZWlyIGNoaWxkcmVuXG5cdFx0ICogQG5hbWUgY2xvc2VfYWxsKFtvYmosIGFuaW1hdGlvbl0pXG5cdFx0ICogQHBhcmFtIHttaXhlZH0gb2JqIHRoZSBub2RlIHRvIGNsb3NlIHJlY3Vyc2l2ZWx5LCBvbWl0IHRvIGNsb3NlIGFsbCBub2RlcyBpbiB0aGUgdHJlZVxuXHRcdCAqIEBwYXJhbSB7TnVtYmVyfSBhbmltYXRpb24gdGhlIGFuaW1hdGlvbiBkdXJhdGlvbiBpbiBtaWxsaXNlY29uZHMgd2hlbiBjbG9zaW5nIHRoZSBub2RlcywgdGhlIGRlZmF1bHQgaXMgbm8gYW5pbWF0aW9uXG5cdFx0ICogQHRyaWdnZXIgY2xvc2VfYWxsLmpzdHJlZVxuXHRcdCAqL1xuXHRcdGNsb3NlX2FsbCA6IGZ1bmN0aW9uIChvYmosIGFuaW1hdGlvbikge1xuXHRcdFx0aWYoIW9iaikgeyBvYmogPSAnIyc7IH1cblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdGlmKCFvYmopIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHR2YXIgZG9tID0gb2JqLmlkID09PSAnIycgPyB0aGlzLmdldF9jb250YWluZXJfdWwoKSA6IHRoaXMuZ2V0X25vZGUob2JqLCB0cnVlKSxcblx0XHRcdFx0X3RoaXMgPSB0aGlzLCBpLCBqO1xuXHRcdFx0aWYoIWRvbS5sZW5ndGgpIHtcblx0XHRcdFx0Zm9yKGkgPSAwLCBqID0gb2JqLmNoaWxkcmVuX2QubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdFx0dGhpcy5fbW9kZWwuZGF0YVtvYmouY2hpbGRyZW5fZFtpXV0uc3RhdGUub3BlbmVkID0gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRoaXMudHJpZ2dlcignY2xvc2VfYWxsJywgeyBcIm5vZGVcIiA6IG9iaiB9KTtcblx0XHRcdH1cblx0XHRcdGRvbSA9IHRoaXMuaXNfb3BlbihvYmopID8gZG9tLmZpbmQoJ2xpLmpzdHJlZS1vcGVuJykuYWRkQmFjaygpIDogZG9tLmZpbmQoJ2xpLmpzdHJlZS1vcGVuJyk7XG5cdFx0XHRkb20udmFrYXRhX3JldmVyc2UoKS5lYWNoKGZ1bmN0aW9uICgpIHsgX3RoaXMuY2xvc2Vfbm9kZSh0aGlzLCBhbmltYXRpb24gfHwgMCk7IH0pO1xuXHRcdFx0LyoqXG5cdFx0XHQgKiB0cmlnZ2VyZWQgd2hlbiBhbiBgY2xvc2VfYWxsYCBjYWxsIGNvbXBsZXRlc1xuXHRcdFx0ICogQGV2ZW50XG5cdFx0XHQgKiBAbmFtZSBjbG9zZV9hbGwuanN0cmVlXG5cdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gbm9kZSB0aGUgY2xvc2VkIG5vZGVcblx0XHRcdCAqL1xuXHRcdFx0dGhpcy50cmlnZ2VyKCdjbG9zZV9hbGwnLCB7IFwibm9kZVwiIDogb2JqIH0pO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogY2hlY2tzIGlmIGEgbm9kZSBpcyBkaXNhYmxlZCAobm90IHNlbGVjdGFibGUpXG5cdFx0ICogQG5hbWUgaXNfZGlzYWJsZWQob2JqKVxuXHRcdCAqIEBwYXJhbSAge21peGVkfSBvYmpcblx0XHQgKiBAcmV0dXJuIHtCb29sZWFufVxuXHRcdCAqL1xuXHRcdGlzX2Rpc2FibGVkIDogZnVuY3Rpb24gKG9iaikge1xuXHRcdFx0b2JqID0gdGhpcy5nZXRfbm9kZShvYmopO1xuXHRcdFx0cmV0dXJuIG9iaiAmJiBvYmouc3RhdGUgJiYgb2JqLnN0YXRlLmRpc2FibGVkO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogZW5hYmxlcyBhIG5vZGUgLSBzbyB0aGF0IGl0IGNhbiBiZSBzZWxlY3RlZFxuXHRcdCAqIEBuYW1lIGVuYWJsZV9ub2RlKG9iailcblx0XHQgKiBAcGFyYW0ge21peGVkfSBvYmogdGhlIG5vZGUgdG8gZW5hYmxlXG5cdFx0ICogQHRyaWdnZXIgZW5hYmxlX25vZGUuanN0cmVlXG5cdFx0ICovXG5cdFx0ZW5hYmxlX25vZGUgOiBmdW5jdGlvbiAob2JqKSB7XG5cdFx0XHR2YXIgdDEsIHQyO1xuXHRcdFx0aWYoJC5pc0FycmF5KG9iaikpIHtcblx0XHRcdFx0b2JqID0gb2JqLnNsaWNlKCk7XG5cdFx0XHRcdGZvcih0MSA9IDAsIHQyID0gb2JqLmxlbmd0aDsgdDEgPCB0MjsgdDErKykge1xuXHRcdFx0XHRcdHRoaXMuZW5hYmxlX25vZGUob2JqW3QxXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0XHRvYmogPSB0aGlzLmdldF9ub2RlKG9iaik7XG5cdFx0XHRpZighb2JqIHx8IG9iai5pZCA9PT0gJyMnKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHRcdG9iai5zdGF0ZS5kaXNhYmxlZCA9IGZhbHNlO1xuXHRcdFx0dGhpcy5nZXRfbm9kZShvYmosdHJ1ZSkuY2hpbGRyZW4oJy5qc3RyZWUtYW5jaG9yJykucmVtb3ZlQ2xhc3MoJ2pzdHJlZS1kaXNhYmxlZCcpO1xuXHRcdFx0LyoqXG5cdFx0XHQgKiB0cmlnZ2VyZWQgd2hlbiBhbiBub2RlIGlzIGVuYWJsZWRcblx0XHRcdCAqIEBldmVudFxuXHRcdFx0ICogQG5hbWUgZW5hYmxlX25vZGUuanN0cmVlXG5cdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gbm9kZSB0aGUgZW5hYmxlZCBub2RlXG5cdFx0XHQgKi9cblx0XHRcdHRoaXMudHJpZ2dlcignZW5hYmxlX25vZGUnLCB7ICdub2RlJyA6IG9iaiB9KTtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIGRpc2FibGVzIGEgbm9kZSAtIHNvIHRoYXQgaXQgY2FuIG5vdCBiZSBzZWxlY3RlZFxuXHRcdCAqIEBuYW1lIGRpc2FibGVfbm9kZShvYmopXG5cdFx0ICogQHBhcmFtIHttaXhlZH0gb2JqIHRoZSBub2RlIHRvIGRpc2FibGVcblx0XHQgKiBAdHJpZ2dlciBkaXNhYmxlX25vZGUuanN0cmVlXG5cdFx0ICovXG5cdFx0ZGlzYWJsZV9ub2RlIDogZnVuY3Rpb24gKG9iaikge1xuXHRcdFx0dmFyIHQxLCB0Mjtcblx0XHRcdGlmKCQuaXNBcnJheShvYmopKSB7XG5cdFx0XHRcdG9iaiA9IG9iai5zbGljZSgpO1xuXHRcdFx0XHRmb3IodDEgPSAwLCB0MiA9IG9iai5sZW5ndGg7IHQxIDwgdDI7IHQxKyspIHtcblx0XHRcdFx0XHR0aGlzLmRpc2FibGVfbm9kZShvYmpbdDFdKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdGlmKCFvYmogfHwgb2JqLmlkID09PSAnIycpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0b2JqLnN0YXRlLmRpc2FibGVkID0gdHJ1ZTtcblx0XHRcdHRoaXMuZ2V0X25vZGUob2JqLHRydWUpLmNoaWxkcmVuKCcuanN0cmVlLWFuY2hvcicpLmFkZENsYXNzKCdqc3RyZWUtZGlzYWJsZWQnKTtcblx0XHRcdC8qKlxuXHRcdFx0ICogdHJpZ2dlcmVkIHdoZW4gYW4gbm9kZSBpcyBkaXNhYmxlZFxuXHRcdFx0ICogQGV2ZW50XG5cdFx0XHQgKiBAbmFtZSBkaXNhYmxlX25vZGUuanN0cmVlXG5cdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gbm9kZSB0aGUgZGlzYWJsZWQgbm9kZVxuXHRcdFx0ICovXG5cdFx0XHR0aGlzLnRyaWdnZXIoJ2Rpc2FibGVfbm9kZScsIHsgJ25vZGUnIDogb2JqIH0pO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogY2FsbGVkIHdoZW4gYSBub2RlIGlzIHNlbGVjdGVkIGJ5IHRoZSB1c2VyLiBVc2VkIGludGVybmFsbHkuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKiBAbmFtZSBhY3RpdmF0ZV9ub2RlKG9iaiwgZSlcblx0XHQgKiBAcGFyYW0ge21peGVkfSBvYmogdGhlIG5vZGVcblx0XHQgKiBAcGFyYW0ge09iamVjdH0gZSB0aGUgcmVsYXRlZCBldmVudFxuXHRcdCAqIEB0cmlnZ2VyIGFjdGl2YXRlX25vZGUuanN0cmVlXG5cdFx0ICovXG5cdFx0YWN0aXZhdGVfbm9kZSA6IGZ1bmN0aW9uIChvYmosIGUpIHtcblx0XHRcdGlmKHRoaXMuaXNfZGlzYWJsZWQob2JqKSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRpZighdGhpcy5zZXR0aW5ncy5jb3JlLm11bHRpcGxlIHx8ICghZS5tZXRhS2V5ICYmICFlLmN0cmxLZXkgJiYgIWUuc2hpZnRLZXkpIHx8IChlLnNoaWZ0S2V5ICYmICghdGhpcy5fZGF0YS5jb3JlLmxhc3RfY2xpY2tlZCB8fCAhdGhpcy5nZXRfcGFyZW50KG9iaikgfHwgdGhpcy5nZXRfcGFyZW50KG9iaikgIT09IHRoaXMuX2RhdGEuY29yZS5sYXN0X2NsaWNrZWQucGFyZW50ICkgKSkge1xuXHRcdFx0XHRpZighdGhpcy5zZXR0aW5ncy5jb3JlLm11bHRpcGxlICYmIChlLm1ldGFLZXkgfHwgZS5jdHJsS2V5IHx8IGUuc2hpZnRLZXkpICYmIHRoaXMuaXNfc2VsZWN0ZWQob2JqKSkge1xuXHRcdFx0XHRcdHRoaXMuZGVzZWxlY3Rfbm9kZShvYmosIGZhbHNlLCBmYWxzZSwgZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5kZXNlbGVjdF9hbGwodHJ1ZSk7XG5cdFx0XHRcdFx0dGhpcy5zZWxlY3Rfbm9kZShvYmosIGZhbHNlLCBmYWxzZSwgZSk7XG5cdFx0XHRcdFx0dGhpcy5fZGF0YS5jb3JlLmxhc3RfY2xpY2tlZCA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGlmKGUuc2hpZnRLZXkpIHtcblx0XHRcdFx0XHR2YXIgbyA9IHRoaXMuZ2V0X25vZGUob2JqKS5pZCxcblx0XHRcdFx0XHRcdGwgPSB0aGlzLl9kYXRhLmNvcmUubGFzdF9jbGlja2VkLmlkLFxuXHRcdFx0XHRcdFx0cCA9IHRoaXMuZ2V0X25vZGUodGhpcy5fZGF0YS5jb3JlLmxhc3RfY2xpY2tlZC5wYXJlbnQpLmNoaWxkcmVuLFxuXHRcdFx0XHRcdFx0YyA9IGZhbHNlLFxuXHRcdFx0XHRcdFx0aSwgajtcblx0XHRcdFx0XHRmb3IoaSA9IDAsIGogPSBwLmxlbmd0aDsgaSA8IGo7IGkgKz0gMSkge1xuXHRcdFx0XHRcdFx0Ly8gc2VwYXJhdGUgSUZzIHdvcmsgd2hlbSBvIGFuZCBsIGFyZSB0aGUgc2FtZVxuXHRcdFx0XHRcdFx0aWYocFtpXSA9PT0gbykge1xuXHRcdFx0XHRcdFx0XHRjID0gIWM7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZihwW2ldID09PSBsKSB7XG5cdFx0XHRcdFx0XHRcdGMgPSAhYztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGlmKGMgfHwgcFtpXSA9PT0gbyB8fCBwW2ldID09PSBsKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuc2VsZWN0X25vZGUocFtpXSwgZmFsc2UsIGZhbHNlLCBlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmRlc2VsZWN0X25vZGUocFtpXSwgZmFsc2UsIGZhbHNlLCBlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0aWYoIXRoaXMuaXNfc2VsZWN0ZWQob2JqKSkge1xuXHRcdFx0XHRcdFx0dGhpcy5zZWxlY3Rfbm9kZShvYmosIGZhbHNlLCBmYWxzZSwgZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy5kZXNlbGVjdF9ub2RlKG9iaiwgZmFsc2UsIGZhbHNlLCBlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdC8qKlxuXHRcdFx0ICogdHJpZ2dlcmVkIHdoZW4gYW4gbm9kZSBpcyBjbGlja2VkIG9yIGludGVyY2F0ZWQgd2l0aCBieSB0aGUgdXNlclxuXHRcdFx0ICogQGV2ZW50XG5cdFx0XHQgKiBAbmFtZSBhY3RpdmF0ZV9ub2RlLmpzdHJlZVxuXHRcdFx0ICogQHBhcmFtIHtPYmplY3R9IG5vZGVcblx0XHRcdCAqL1xuXHRcdFx0dGhpcy50cmlnZ2VyKCdhY3RpdmF0ZV9ub2RlJywgeyAnbm9kZScgOiB0aGlzLmdldF9ub2RlKG9iaikgfSk7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBhcHBsaWVzIHRoZSBob3ZlciBzdGF0ZSBvbiBhIG5vZGUsIGNhbGxlZCB3aGVuIGEgbm9kZSBpcyBob3ZlcmVkIGJ5IHRoZSB1c2VyLiBVc2VkIGludGVybmFsbHkuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKiBAbmFtZSBob3Zlcl9ub2RlKG9iailcblx0XHQgKiBAcGFyYW0ge21peGVkfSBvYmpcblx0XHQgKiBAdHJpZ2dlciBob3Zlcl9ub2RlLmpzdHJlZVxuXHRcdCAqL1xuXHRcdGhvdmVyX25vZGUgOiBmdW5jdGlvbiAob2JqKSB7XG5cdFx0XHRvYmogPSB0aGlzLmdldF9ub2RlKG9iaiwgdHJ1ZSk7XG5cdFx0XHRpZighb2JqIHx8ICFvYmoubGVuZ3RoIHx8IG9iai5jaGlsZHJlbignLmpzdHJlZS1ob3ZlcmVkJykubGVuZ3RoKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHRcdHZhciBvID0gdGhpcy5lbGVtZW50LmZpbmQoJy5qc3RyZWUtaG92ZXJlZCcpLCB0ID0gdGhpcy5lbGVtZW50O1xuXHRcdFx0aWYobyAmJiBvLmxlbmd0aCkgeyB0aGlzLmRlaG92ZXJfbm9kZShvKTsgfVxuXG5cdFx0XHRvYmouY2hpbGRyZW4oJy5qc3RyZWUtYW5jaG9yJykuYWRkQ2xhc3MoJ2pzdHJlZS1ob3ZlcmVkJyk7XG5cdFx0XHQvKipcblx0XHRcdCAqIHRyaWdnZXJlZCB3aGVuIGFuIG5vZGUgaXMgaG92ZXJlZFxuXHRcdFx0ICogQGV2ZW50XG5cdFx0XHQgKiBAbmFtZSBob3Zlcl9ub2RlLmpzdHJlZVxuXHRcdFx0ICogQHBhcmFtIHtPYmplY3R9IG5vZGVcblx0XHRcdCAqL1xuXHRcdFx0dGhpcy50cmlnZ2VyKCdob3Zlcl9ub2RlJywgeyAnbm9kZScgOiB0aGlzLmdldF9ub2RlKG9iaikgfSk7XG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgdC5hdHRyKCdhcmlhLWFjdGl2ZWRlc2NlbmRhbnQnLCBvYmpbMF0uaWQpOyBvYmouYXR0cignYXJpYS1zZWxlY3RlZCcsIHRydWUpOyB9LCAwKTtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIHJlbW92ZXMgdGhlIGhvdmVyIHN0YXRlIGZyb20gYSBub2RlY2FsbGVkIHdoZW4gYSBub2RlIGlzIG5vIGxvbmdlciBob3ZlcmVkIGJ5IHRoZSB1c2VyLiBVc2VkIGludGVybmFsbHkuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKiBAbmFtZSBkZWhvdmVyX25vZGUob2JqKVxuXHRcdCAqIEBwYXJhbSB7bWl4ZWR9IG9ialxuXHRcdCAqIEB0cmlnZ2VyIGRlaG92ZXJfbm9kZS5qc3RyZWVcblx0XHQgKi9cblx0XHRkZWhvdmVyX25vZGUgOiBmdW5jdGlvbiAob2JqKSB7XG5cdFx0XHRvYmogPSB0aGlzLmdldF9ub2RlKG9iaiwgdHJ1ZSk7XG5cdFx0XHRpZighb2JqIHx8ICFvYmoubGVuZ3RoIHx8ICFvYmouY2hpbGRyZW4oJy5qc3RyZWUtaG92ZXJlZCcpLmxlbmd0aCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRvYmouYXR0cignYXJpYS1zZWxlY3RlZCcsIGZhbHNlKS5jaGlsZHJlbignLmpzdHJlZS1hbmNob3InKS5yZW1vdmVDbGFzcygnanN0cmVlLWhvdmVyZWQnKTtcblx0XHRcdC8qKlxuXHRcdFx0ICogdHJpZ2dlcmVkIHdoZW4gYW4gbm9kZSBpcyBubyBsb25nZXIgaG92ZXJlZFxuXHRcdFx0ICogQGV2ZW50XG5cdFx0XHQgKiBAbmFtZSBkZWhvdmVyX25vZGUuanN0cmVlXG5cdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gbm9kZVxuXHRcdFx0ICovXG5cdFx0XHR0aGlzLnRyaWdnZXIoJ2RlaG92ZXJfbm9kZScsIHsgJ25vZGUnIDogdGhpcy5nZXRfbm9kZShvYmopIH0pO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogc2VsZWN0IGEgbm9kZVxuXHRcdCAqIEBuYW1lIHNlbGVjdF9ub2RlKG9iaiBbLCBzdXByZXNzX2V2ZW50LCBwcmV2ZW50X29wZW5dKVxuXHRcdCAqIEBwYXJhbSB7bWl4ZWR9IG9iaiBhbiBhcnJheSBjYW4gYmUgdXNlZCB0byBzZWxlY3QgbXVsdGlwbGUgbm9kZXNcblx0XHQgKiBAcGFyYW0ge0Jvb2xlYW59IHN1cHJlc3NfZXZlbnQgaWYgc2V0IHRvIGB0cnVlYCB0aGUgYGNoYW5nZWQuanN0cmVlYCBldmVudCB3b24ndCBiZSB0cmlnZ2VyZWRcblx0XHQgKiBAcGFyYW0ge0Jvb2xlYW59IHByZXZlbnRfb3BlbiBpZiBzZXQgdG8gYHRydWVgIHBhcmVudHMgb2YgdGhlIHNlbGVjdGVkIG5vZGUgd29uJ3QgYmUgb3BlbmVkXG5cdFx0ICogQHRyaWdnZXIgc2VsZWN0X25vZGUuanN0cmVlLCBjaGFuZ2VkLmpzdHJlZVxuXHRcdCAqL1xuXHRcdHNlbGVjdF9ub2RlIDogZnVuY3Rpb24gKG9iaiwgc3VwcmVzc19ldmVudCwgcHJldmVudF9vcGVuLCBlKSB7XG5cdFx0XHR2YXIgZG9tLCB0MSwgdDIsIHRoO1xuXHRcdFx0aWYoJC5pc0FycmF5KG9iaikpIHtcblx0XHRcdFx0b2JqID0gb2JqLnNsaWNlKCk7XG5cdFx0XHRcdGZvcih0MSA9IDAsIHQyID0gb2JqLmxlbmd0aDsgdDEgPCB0MjsgdDErKykge1xuXHRcdFx0XHRcdHRoaXMuc2VsZWN0X25vZGUob2JqW3QxXSwgc3VwcmVzc19ldmVudCwgcHJldmVudF9vcGVuLCBlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdGlmKCFvYmogfHwgb2JqLmlkID09PSAnIycpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZG9tID0gdGhpcy5nZXRfbm9kZShvYmosIHRydWUpO1xuXHRcdFx0aWYoIW9iai5zdGF0ZS5zZWxlY3RlZCkge1xuXHRcdFx0XHRvYmouc3RhdGUuc2VsZWN0ZWQgPSB0cnVlO1xuXHRcdFx0XHR0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQucHVzaChvYmouaWQpO1xuXHRcdFx0XHRpZighcHJldmVudF9vcGVuKSB7XG5cdFx0XHRcdFx0ZG9tID0gdGhpcy5fb3Blbl90byhvYmopO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKGRvbSAmJiBkb20ubGVuZ3RoKSB7XG5cdFx0XHRcdFx0ZG9tLmNoaWxkcmVuKCcuanN0cmVlLWFuY2hvcicpLmFkZENsYXNzKCdqc3RyZWUtY2xpY2tlZCcpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8qKlxuXHRcdFx0XHQgKiB0cmlnZ2VyZWQgd2hlbiBhbiBub2RlIGlzIHNlbGVjdGVkXG5cdFx0XHRcdCAqIEBldmVudFxuXHRcdFx0XHQgKiBAbmFtZSBzZWxlY3Rfbm9kZS5qc3RyZWVcblx0XHRcdFx0ICogQHBhcmFtIHtPYmplY3R9IG5vZGVcblx0XHRcdFx0ICogQHBhcmFtIHtBcnJheX0gc2VsZWN0ZWQgdGhlIGN1cnJlbnQgc2VsZWN0aW9uXG5cdFx0XHRcdCAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCB0aGUgZXZlbnQgKGlmIGFueSkgdGhhdCB0cmlnZ2VyZWQgdGhpcyBzZWxlY3Rfbm9kZVxuXHRcdFx0XHQgKi9cblx0XHRcdFx0dGhpcy50cmlnZ2VyKCdzZWxlY3Rfbm9kZScsIHsgJ25vZGUnIDogb2JqLCAnc2VsZWN0ZWQnIDogdGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkLCAnZXZlbnQnIDogZSB9KTtcblx0XHRcdFx0aWYoIXN1cHJlc3NfZXZlbnQpIHtcblx0XHRcdFx0XHQvKipcblx0XHRcdFx0XHQgKiB0cmlnZ2VyZWQgd2hlbiBzZWxlY3Rpb24gY2hhbmdlc1xuXHRcdFx0XHRcdCAqIEBldmVudFxuXHRcdFx0XHRcdCAqIEBuYW1lIGNoYW5nZWQuanN0cmVlXG5cdFx0XHRcdFx0ICogQHBhcmFtIHtPYmplY3R9IG5vZGVcblx0XHRcdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gYWN0aW9uIHRoZSBhY3Rpb24gdGhhdCBjYXVzZWQgdGhlIHNlbGVjdGlvbiB0byBjaGFuZ2Vcblx0XHRcdFx0XHQgKiBAcGFyYW0ge0FycmF5fSBzZWxlY3RlZCB0aGUgY3VycmVudCBzZWxlY3Rpb25cblx0XHRcdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgdGhlIGV2ZW50IChpZiBhbnkpIHRoYXQgdHJpZ2dlcmVkIHRoaXMgY2hhbmdlZCBldmVudFxuXHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdHRoaXMudHJpZ2dlcignY2hhbmdlZCcsIHsgJ2FjdGlvbicgOiAnc2VsZWN0X25vZGUnLCAnbm9kZScgOiBvYmosICdzZWxlY3RlZCcgOiB0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQsICdldmVudCcgOiBlIH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBkZXNlbGVjdCBhIG5vZGVcblx0XHQgKiBAbmFtZSBkZXNlbGVjdF9ub2RlKG9iaiBbLCBzdXByZXNzX2V2ZW50XSlcblx0XHQgKiBAcGFyYW0ge21peGVkfSBvYmogYW4gYXJyYXkgY2FuIGJlIHVzZWQgdG8gZGVzZWxlY3QgbXVsdGlwbGUgbm9kZXNcblx0XHQgKiBAcGFyYW0ge0Jvb2xlYW59IHN1cHJlc3NfZXZlbnQgaWYgc2V0IHRvIGB0cnVlYCB0aGUgYGNoYW5nZWQuanN0cmVlYCBldmVudCB3b24ndCBiZSB0cmlnZ2VyZWRcblx0XHQgKiBAdHJpZ2dlciBkZXNlbGVjdF9ub2RlLmpzdHJlZSwgY2hhbmdlZC5qc3RyZWVcblx0XHQgKi9cblx0XHRkZXNlbGVjdF9ub2RlIDogZnVuY3Rpb24gKG9iaiwgc3VwcmVzc19ldmVudCwgZSkge1xuXHRcdFx0dmFyIHQxLCB0MiwgZG9tO1xuXHRcdFx0aWYoJC5pc0FycmF5KG9iaikpIHtcblx0XHRcdFx0b2JqID0gb2JqLnNsaWNlKCk7XG5cdFx0XHRcdGZvcih0MSA9IDAsIHQyID0gb2JqLmxlbmd0aDsgdDEgPCB0MjsgdDErKykge1xuXHRcdFx0XHRcdHRoaXMuZGVzZWxlY3Rfbm9kZShvYmpbdDFdLCBzdXByZXNzX2V2ZW50LCBlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdGlmKCFvYmogfHwgb2JqLmlkID09PSAnIycpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZG9tID0gdGhpcy5nZXRfbm9kZShvYmosIHRydWUpO1xuXHRcdFx0aWYob2JqLnN0YXRlLnNlbGVjdGVkKSB7XG5cdFx0XHRcdG9iai5zdGF0ZS5zZWxlY3RlZCA9IGZhbHNlO1xuXHRcdFx0XHR0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQgPSAkLnZha2F0YS5hcnJheV9yZW1vdmVfaXRlbSh0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQsIG9iai5pZCk7XG5cdFx0XHRcdGlmKGRvbS5sZW5ndGgpIHtcblx0XHRcdFx0XHRkb20uY2hpbGRyZW4oJy5qc3RyZWUtYW5jaG9yJykucmVtb3ZlQ2xhc3MoJ2pzdHJlZS1jbGlja2VkJyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0LyoqXG5cdFx0XHRcdCAqIHRyaWdnZXJlZCB3aGVuIGFuIG5vZGUgaXMgZGVzZWxlY3RlZFxuXHRcdFx0XHQgKiBAZXZlbnRcblx0XHRcdFx0ICogQG5hbWUgZGVzZWxlY3Rfbm9kZS5qc3RyZWVcblx0XHRcdFx0ICogQHBhcmFtIHtPYmplY3R9IG5vZGVcblx0XHRcdFx0ICogQHBhcmFtIHtBcnJheX0gc2VsZWN0ZWQgdGhlIGN1cnJlbnQgc2VsZWN0aW9uXG5cdFx0XHRcdCAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCB0aGUgZXZlbnQgKGlmIGFueSkgdGhhdCB0cmlnZ2VyZWQgdGhpcyBkZXNlbGVjdF9ub2RlXG5cdFx0XHRcdCAqL1xuXHRcdFx0XHR0aGlzLnRyaWdnZXIoJ2Rlc2VsZWN0X25vZGUnLCB7ICdub2RlJyA6IG9iaiwgJ3NlbGVjdGVkJyA6IHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZCwgJ2V2ZW50JyA6IGUgfSk7XG5cdFx0XHRcdGlmKCFzdXByZXNzX2V2ZW50KSB7XG5cdFx0XHRcdFx0dGhpcy50cmlnZ2VyKCdjaGFuZ2VkJywgeyAnYWN0aW9uJyA6ICdkZXNlbGVjdF9ub2RlJywgJ25vZGUnIDogb2JqLCAnc2VsZWN0ZWQnIDogdGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkLCAnZXZlbnQnIDogZSB9KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogc2VsZWN0IGFsbCBub2RlcyBpbiB0aGUgdHJlZVxuXHRcdCAqIEBuYW1lIHNlbGVjdF9hbGwoW3N1cHJlc3NfZXZlbnRdKVxuXHRcdCAqIEBwYXJhbSB7Qm9vbGVhbn0gc3VwcmVzc19ldmVudCBpZiBzZXQgdG8gYHRydWVgIHRoZSBgY2hhbmdlZC5qc3RyZWVgIGV2ZW50IHdvbid0IGJlIHRyaWdnZXJlZFxuXHRcdCAqIEB0cmlnZ2VyIHNlbGVjdF9hbGwuanN0cmVlLCBjaGFuZ2VkLmpzdHJlZVxuXHRcdCAqL1xuXHRcdHNlbGVjdF9hbGwgOiBmdW5jdGlvbiAoc3VwcmVzc19ldmVudCkge1xuXHRcdFx0dmFyIHRtcCA9IHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZC5jb25jYXQoW10pLCBpLCBqO1xuXHRcdFx0dGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkID0gdGhpcy5fbW9kZWwuZGF0YVsnIyddLmNoaWxkcmVuX2QuY29uY2F0KCk7XG5cdFx0XHRmb3IoaSA9IDAsIGogPSB0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdGlmKHRoaXMuX21vZGVsLmRhdGFbdGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkW2ldXSkge1xuXHRcdFx0XHRcdHRoaXMuX21vZGVsLmRhdGFbdGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkW2ldXS5zdGF0ZS5zZWxlY3RlZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHRoaXMucmVkcmF3KHRydWUpO1xuXHRcdFx0LyoqXG5cdFx0XHQgKiB0cmlnZ2VyZWQgd2hlbiBhbGwgbm9kZXMgYXJlIHNlbGVjdGVkXG5cdFx0XHQgKiBAZXZlbnRcblx0XHRcdCAqIEBuYW1lIHNlbGVjdF9hbGwuanN0cmVlXG5cdFx0XHQgKiBAcGFyYW0ge0FycmF5fSBzZWxlY3RlZCB0aGUgY3VycmVudCBzZWxlY3Rpb25cblx0XHRcdCAqL1xuXHRcdFx0dGhpcy50cmlnZ2VyKCdzZWxlY3RfYWxsJywgeyAnc2VsZWN0ZWQnIDogdGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkIH0pO1xuXHRcdFx0aWYoIXN1cHJlc3NfZXZlbnQpIHtcblx0XHRcdFx0dGhpcy50cmlnZ2VyKCdjaGFuZ2VkJywgeyAnYWN0aW9uJyA6ICdzZWxlY3RfYWxsJywgJ3NlbGVjdGVkJyA6IHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZCwgJ29sZF9zZWxlY3Rpb24nIDogdG1wIH0pO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogZGVzZWxlY3QgYWxsIHNlbGVjdGVkIG5vZGVzXG5cdFx0ICogQG5hbWUgZGVzZWxlY3RfYWxsKFtzdXByZXNzX2V2ZW50XSlcblx0XHQgKiBAcGFyYW0ge0Jvb2xlYW59IHN1cHJlc3NfZXZlbnQgaWYgc2V0IHRvIGB0cnVlYCB0aGUgYGNoYW5nZWQuanN0cmVlYCBldmVudCB3b24ndCBiZSB0cmlnZ2VyZWRcblx0XHQgKiBAdHJpZ2dlciBkZXNlbGVjdF9hbGwuanN0cmVlLCBjaGFuZ2VkLmpzdHJlZVxuXHRcdCAqL1xuXHRcdGRlc2VsZWN0X2FsbCA6IGZ1bmN0aW9uIChzdXByZXNzX2V2ZW50KSB7XG5cdFx0XHR2YXIgdG1wID0gdGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkLmNvbmNhdChbXSksIGksIGo7XG5cdFx0XHRmb3IoaSA9IDAsIGogPSB0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdGlmKHRoaXMuX21vZGVsLmRhdGFbdGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkW2ldXSkge1xuXHRcdFx0XHRcdHRoaXMuX21vZGVsLmRhdGFbdGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkW2ldXS5zdGF0ZS5zZWxlY3RlZCA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHR0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQgPSBbXTtcblx0XHRcdHRoaXMuZWxlbWVudC5maW5kKCcuanN0cmVlLWNsaWNrZWQnKS5yZW1vdmVDbGFzcygnanN0cmVlLWNsaWNrZWQnKTtcblx0XHRcdC8qKlxuXHRcdFx0ICogdHJpZ2dlcmVkIHdoZW4gYWxsIG5vZGVzIGFyZSBkZXNlbGVjdGVkXG5cdFx0XHQgKiBAZXZlbnRcblx0XHRcdCAqIEBuYW1lIGRlc2VsZWN0X2FsbC5qc3RyZWVcblx0XHRcdCAqIEBwYXJhbSB7T2JqZWN0fSBub2RlIHRoZSBwcmV2aW91cyBzZWxlY3Rpb25cblx0XHRcdCAqIEBwYXJhbSB7QXJyYXl9IHNlbGVjdGVkIHRoZSBjdXJyZW50IHNlbGVjdGlvblxuXHRcdFx0ICovXG5cdFx0XHR0aGlzLnRyaWdnZXIoJ2Rlc2VsZWN0X2FsbCcsIHsgJ3NlbGVjdGVkJyA6IHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZCwgJ25vZGUnIDogdG1wIH0pO1xuXHRcdFx0aWYoIXN1cHJlc3NfZXZlbnQpIHtcblx0XHRcdFx0dGhpcy50cmlnZ2VyKCdjaGFuZ2VkJywgeyAnYWN0aW9uJyA6ICdkZXNlbGVjdF9hbGwnLCAnc2VsZWN0ZWQnIDogdGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkLCAnb2xkX3NlbGVjdGlvbicgOiB0bXAgfSk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBjaGVja3MgaWYgYSBub2RlIGlzIHNlbGVjdGVkXG5cdFx0ICogQG5hbWUgaXNfc2VsZWN0ZWQob2JqKVxuXHRcdCAqIEBwYXJhbSAge21peGVkfSAgb2JqXG5cdFx0ICogQHJldHVybiB7Qm9vbGVhbn1cblx0XHQgKi9cblx0XHRpc19zZWxlY3RlZCA6IGZ1bmN0aW9uIChvYmopIHtcblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdGlmKCFvYmogfHwgb2JqLmlkID09PSAnIycpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG9iai5zdGF0ZS5zZWxlY3RlZDtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIGdldCBhbiBhcnJheSBvZiBhbGwgc2VsZWN0ZWQgbm9kZSBJRHNcblx0XHQgKiBAbmFtZSBnZXRfc2VsZWN0ZWQoW2Z1bGxdKVxuXHRcdCAqIEBwYXJhbSAge21peGVkfSAgZnVsbCBpZiBzZXQgdG8gYHRydWVgIHRoZSByZXR1cm5lZCBhcnJheSB3aWxsIGNvbnNpc3Qgb2YgdGhlIGZ1bGwgbm9kZSBvYmplY3RzLCBvdGhlcndpc2UgLSBvbmx5IElEcyB3aWxsIGJlIHJldHVybmVkXG5cdFx0ICogQHJldHVybiB7QXJyYXl9XG5cdFx0ICovXG5cdFx0Z2V0X3NlbGVjdGVkIDogZnVuY3Rpb24gKGZ1bGwpIHtcblx0XHRcdHJldHVybiBmdWxsID8gJC5tYXAodGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkLCAkLnByb3h5KGZ1bmN0aW9uIChpKSB7IHJldHVybiB0aGlzLmdldF9ub2RlKGkpOyB9LCB0aGlzKSkgOiB0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQ7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBnZXRzIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSB0cmVlIHNvIHRoYXQgaXQgY2FuIGJlIHJlc3RvcmVkIGxhdGVyIHdpdGggYHNldF9zdGF0ZShzdGF0ZSlgLiBVc2VkIGludGVybmFsbHkuXG5cdFx0ICogQG5hbWUgZ2V0X3N0YXRlKClcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqIEByZXR1cm4ge09iamVjdH1cblx0XHQgKi9cblx0XHRnZXRfc3RhdGUgOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgc3RhdGVcdD0ge1xuXHRcdFx0XHQnY29yZScgOiB7XG5cdFx0XHRcdFx0J29wZW4nIDogW10sXG5cdFx0XHRcdFx0J3Njcm9sbCcgOiB7XG5cdFx0XHRcdFx0XHQnbGVmdCcgOiB0aGlzLmVsZW1lbnQuc2Nyb2xsTGVmdCgpLFxuXHRcdFx0XHRcdFx0J3RvcCcgOiB0aGlzLmVsZW1lbnQuc2Nyb2xsVG9wKClcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdC8qIVxuXHRcdFx0XHRcdCd0aGVtZXMnIDoge1xuXHRcdFx0XHRcdFx0J25hbWUnIDogdGhpcy5nZXRfdGhlbWUoKSxcblx0XHRcdFx0XHRcdCdpY29ucycgOiB0aGlzLl9kYXRhLmNvcmUudGhlbWVzLmljb25zLFxuXHRcdFx0XHRcdFx0J2RvdHMnIDogdGhpcy5fZGF0YS5jb3JlLnRoZW1lcy5kb3RzXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQqL1xuXHRcdFx0XHRcdCdzZWxlY3RlZCcgOiBbXVxuXHRcdFx0XHR9XG5cdFx0XHR9LCBpO1xuXHRcdFx0Zm9yKGkgaW4gdGhpcy5fbW9kZWwuZGF0YSkge1xuXHRcdFx0XHRpZih0aGlzLl9tb2RlbC5kYXRhLmhhc093blByb3BlcnR5KGkpKSB7XG5cdFx0XHRcdFx0aWYoaSAhPT0gJyMnKSB7XG5cdFx0XHRcdFx0XHRpZih0aGlzLl9tb2RlbC5kYXRhW2ldLnN0YXRlLm9wZW5lZCkge1xuXHRcdFx0XHRcdFx0XHRzdGF0ZS5jb3JlLm9wZW4ucHVzaChpKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGlmKHRoaXMuX21vZGVsLmRhdGFbaV0uc3RhdGUuc2VsZWN0ZWQpIHtcblx0XHRcdFx0XHRcdFx0c3RhdGUuY29yZS5zZWxlY3RlZC5wdXNoKGkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHN0YXRlO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogc2V0cyB0aGUgc3RhdGUgb2YgdGhlIHRyZWUuIFVzZWQgaW50ZXJuYWxseS5cblx0XHQgKiBAbmFtZSBzZXRfc3RhdGUoc3RhdGUgWywgY2FsbGJhY2tdKVxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICogQHBhcmFtIHtPYmplY3R9IHN0YXRlIHRoZSBzdGF0ZSB0byByZXN0b3JlXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgYW4gb3B0aW9uYWwgZnVuY3Rpb24gdG8gZXhlY3V0ZSBvbmNlIHRoZSBzdGF0ZSBpcyByZXN0b3JlZC5cblx0XHQgKiBAdHJpZ2dlciBzZXRfc3RhdGUuanN0cmVlXG5cdFx0ICovXG5cdFx0c2V0X3N0YXRlIDogZnVuY3Rpb24gKHN0YXRlLCBjYWxsYmFjaykge1xuXHRcdFx0aWYoc3RhdGUpIHtcblx0XHRcdFx0aWYoc3RhdGUuY29yZSkge1xuXHRcdFx0XHRcdHZhciByZXMsIG4sIHQsIF90aGlzO1xuXHRcdFx0XHRcdGlmKHN0YXRlLmNvcmUub3Blbikge1xuXHRcdFx0XHRcdFx0aWYoISQuaXNBcnJheShzdGF0ZS5jb3JlLm9wZW4pKSB7XG5cdFx0XHRcdFx0XHRcdGRlbGV0ZSBzdGF0ZS5jb3JlLm9wZW47XG5cdFx0XHRcdFx0XHRcdHRoaXMuc2V0X3N0YXRlKHN0YXRlLCBjYWxsYmFjayk7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHJlcyA9IHRydWU7XG5cdFx0XHRcdFx0XHRuID0gZmFsc2U7XG5cdFx0XHRcdFx0XHR0ID0gdGhpcztcblx0XHRcdFx0XHRcdCQuZWFjaChzdGF0ZS5jb3JlLm9wZW4uY29uY2F0KFtdKSwgZnVuY3Rpb24gKGksIHYpIHtcblx0XHRcdFx0XHRcdFx0biA9IHQuZ2V0X25vZGUodik7XG5cdFx0XHRcdFx0XHRcdGlmKG4pIHtcblx0XHRcdFx0XHRcdFx0XHRpZih0LmlzX2xvYWRlZCh2KSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYodC5pc19jbG9zZWQodikpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dC5vcGVuX25vZGUodiwgZmFsc2UsIDApO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0aWYoc3RhdGUgJiYgc3RhdGUuY29yZSAmJiBzdGF0ZS5jb3JlLm9wZW4pIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0JC52YWthdGEuYXJyYXlfcmVtb3ZlX2l0ZW0oc3RhdGUuY29yZS5vcGVuLCB2KTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZighdC5pc19sb2FkaW5nKHYpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHQub3Blbl9ub2RlKHYsICQucHJveHkoZnVuY3Rpb24gKCkgeyB0aGlzLnNldF9zdGF0ZShzdGF0ZSwgY2FsbGJhY2spOyB9LCB0KSwgMCk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHQvLyB0aGVyZSB3aWxsIGJlIHNvbWUgYXN5bmMgYWN0aXZpdHkgLSBzbyB3YWl0IGZvciBpdFxuXHRcdFx0XHRcdFx0XHRcdFx0cmVzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdGlmKHJlcykge1xuXHRcdFx0XHRcdFx0XHRkZWxldGUgc3RhdGUuY29yZS5vcGVuO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnNldF9zdGF0ZShzdGF0ZSwgY2FsbGJhY2spO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZihzdGF0ZS5jb3JlLnNjcm9sbCkge1xuXHRcdFx0XHRcdFx0aWYoc3RhdGUuY29yZS5zY3JvbGwgJiYgc3RhdGUuY29yZS5zY3JvbGwubGVmdCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5zY3JvbGxMZWZ0KHN0YXRlLmNvcmUuc2Nyb2xsLmxlZnQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0aWYoc3RhdGUuY29yZS5zY3JvbGwgJiYgc3RhdGUuY29yZS5zY3JvbGwudG9wICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnNjcm9sbFRvcChzdGF0ZS5jb3JlLnNjcm9sbC50b3ApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZGVsZXRlIHN0YXRlLmNvcmUuc2Nyb2xsO1xuXHRcdFx0XHRcdFx0dGhpcy5zZXRfc3RhdGUoc3RhdGUsIGNhbGxiYWNrKTtcblx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0LyohXG5cdFx0XHRcdFx0aWYoc3RhdGUuY29yZS50aGVtZXMpIHtcblx0XHRcdFx0XHRcdGlmKHN0YXRlLmNvcmUudGhlbWVzLm5hbWUpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5zZXRfdGhlbWUoc3RhdGUuY29yZS50aGVtZXMubmFtZSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZih0eXBlb2Ygc3RhdGUuY29yZS50aGVtZXMuZG90cyAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0XHRcdFx0dGhpc1sgc3RhdGUuY29yZS50aGVtZXMuZG90cyA/IFwic2hvd19kb3RzXCIgOiBcImhpZGVfZG90c1wiIF0oKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGlmKHR5cGVvZiBzdGF0ZS5jb3JlLnRoZW1lcy5pY29ucyAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0XHRcdFx0dGhpc1sgc3RhdGUuY29yZS50aGVtZXMuaWNvbnMgPyBcInNob3dfaWNvbnNcIiA6IFwiaGlkZV9pY29uc1wiIF0oKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGRlbGV0ZSBzdGF0ZS5jb3JlLnRoZW1lcztcblx0XHRcdFx0XHRcdGRlbGV0ZSBzdGF0ZS5jb3JlLm9wZW47XG5cdFx0XHRcdFx0XHR0aGlzLnNldF9zdGF0ZShzdGF0ZSwgY2FsbGJhY2spO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQqL1xuXHRcdFx0XHRcdGlmKHN0YXRlLmNvcmUuc2VsZWN0ZWQpIHtcblx0XHRcdFx0XHRcdF90aGlzID0gdGhpcztcblx0XHRcdFx0XHRcdHRoaXMuZGVzZWxlY3RfYWxsKCk7XG5cdFx0XHRcdFx0XHQkLmVhY2goc3RhdGUuY29yZS5zZWxlY3RlZCwgZnVuY3Rpb24gKGksIHYpIHtcblx0XHRcdFx0XHRcdFx0X3RoaXMuc2VsZWN0X25vZGUodik7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdGRlbGV0ZSBzdGF0ZS5jb3JlLnNlbGVjdGVkO1xuXHRcdFx0XHRcdFx0dGhpcy5zZXRfc3RhdGUoc3RhdGUsIGNhbGxiYWNrKTtcblx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoJC5pc0VtcHR5T2JqZWN0KHN0YXRlLmNvcmUpKSB7XG5cdFx0XHRcdFx0XHRkZWxldGUgc3RhdGUuY29yZTtcblx0XHRcdFx0XHRcdHRoaXMuc2V0X3N0YXRlKHN0YXRlLCBjYWxsYmFjayk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKCQuaXNFbXB0eU9iamVjdChzdGF0ZSkpIHtcblx0XHRcdFx0XHRzdGF0ZSA9IG51bGw7XG5cdFx0XHRcdFx0aWYoY2FsbGJhY2spIHsgY2FsbGJhY2suY2FsbCh0aGlzKTsgfVxuXHRcdFx0XHRcdC8qKlxuXHRcdFx0XHRcdCAqIHRyaWdnZXJlZCB3aGVuIGEgYHNldF9zdGF0ZWAgY2FsbCBjb21wbGV0ZXNcblx0XHRcdFx0XHQgKiBAZXZlbnRcblx0XHRcdFx0XHQgKiBAbmFtZSBzZXRfc3RhdGUuanN0cmVlXG5cdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0dGhpcy50cmlnZ2VyKCdzZXRfc3RhdGUnKTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiByZWZyZXNoZXMgdGhlIHRyZWUgLSBhbGwgbm9kZXMgYXJlIHJlbG9hZGVkIHdpdGggY2FsbHMgdG8gYGxvYWRfbm9kZWAuXG5cdFx0ICogQG5hbWUgcmVmcmVzaCgpXG5cdFx0ICogQHBhcmFtIHtCb29sZWFufSBza2lwX2xvYWRpbmcgYW4gb3B0aW9uIHRvIHNraXAgc2hvd2luZyB0aGUgbG9hZGluZyBpbmRpY2F0b3Jcblx0XHQgKiBAdHJpZ2dlciByZWZyZXNoLmpzdHJlZVxuXHRcdCAqL1xuXHRcdHJlZnJlc2ggOiBmdW5jdGlvbiAoc2tpcF9sb2FkaW5nKSB7XG5cdFx0XHR0aGlzLl9kYXRhLmNvcmUuc3RhdGUgPSB0aGlzLmdldF9zdGF0ZSgpO1xuXHRcdFx0dGhpcy5fY250ID0gMDtcblx0XHRcdHRoaXMuX21vZGVsLmRhdGEgPSB7XG5cdFx0XHRcdCcjJyA6IHtcblx0XHRcdFx0XHRpZCA6ICcjJyxcblx0XHRcdFx0XHRwYXJlbnQgOiBudWxsLFxuXHRcdFx0XHRcdHBhcmVudHMgOiBbXSxcblx0XHRcdFx0XHRjaGlsZHJlbiA6IFtdLFxuXHRcdFx0XHRcdGNoaWxkcmVuX2QgOiBbXSxcblx0XHRcdFx0XHRzdGF0ZSA6IHsgbG9hZGVkIDogZmFsc2UgfVxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdFx0dmFyIGMgPSB0aGlzLmdldF9jb250YWluZXJfdWwoKVswXS5jbGFzc05hbWU7XG5cdFx0XHRpZighc2tpcF9sb2FkaW5nKSB7XG5cdFx0XHRcdHRoaXMuZWxlbWVudC5odG1sKFwiPFwiK1widWwgY2xhc3M9J2pzdHJlZS1jb250YWluZXItdWwnPjxcIitcImxpIGNsYXNzPSdqc3RyZWUtaW5pdGlhbC1ub2RlIGpzdHJlZS1sb2FkaW5nIGpzdHJlZS1sZWFmIGpzdHJlZS1sYXN0Jz48aSBjbGFzcz0nanN0cmVlLWljb24ganN0cmVlLW9jbCc+PC9pPjxcIitcImEgY2xhc3M9J2pzdHJlZS1hbmNob3InIGhyZWY9JyMnPjxpIGNsYXNzPSdqc3RyZWUtaWNvbiBqc3RyZWUtdGhlbWVpY29uLWhpZGRlbic+PC9pPlwiICsgdGhpcy5nZXRfc3RyaW5nKFwiTG9hZGluZyAuLi5cIikgKyBcIjwvYT48L2xpPjwvdWw+XCIpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5sb2FkX25vZGUoJyMnLCBmdW5jdGlvbiAobywgcykge1xuXHRcdFx0XHRpZihzKSB7XG5cdFx0XHRcdFx0dGhpcy5nZXRfY29udGFpbmVyX3VsKClbMF0uY2xhc3NOYW1lID0gYztcblx0XHRcdFx0XHR0aGlzLnNldF9zdGF0ZSgkLmV4dGVuZCh0cnVlLCB7fSwgdGhpcy5fZGF0YS5jb3JlLnN0YXRlKSwgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0XHQgKiB0cmlnZ2VyZWQgd2hlbiBhIGByZWZyZXNoYCBjYWxsIGNvbXBsZXRlc1xuXHRcdFx0XHRcdFx0ICogQGV2ZW50XG5cdFx0XHRcdFx0XHQgKiBAbmFtZSByZWZyZXNoLmpzdHJlZVxuXHRcdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0XHR0aGlzLnRyaWdnZXIoJ3JlZnJlc2gnKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLl9kYXRhLmNvcmUuc3RhdGUgPSBudWxsO1xuXHRcdFx0fSk7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBzZXQgKGNoYW5nZSkgdGhlIElEIG9mIGEgbm9kZVxuXHRcdCAqIEBuYW1lIHNldF9pZChvYmosIGlkKVxuXHRcdCAqIEBwYXJhbSAge21peGVkfSBvYmogdGhlIG5vZGVcblx0XHQgKiBAcGFyYW0gIHtTdHJpbmd9IGlkIHRoZSBuZXcgSURcblx0XHQgKiBAcmV0dXJuIHtCb29sZWFufVxuXHRcdCAqL1xuXHRcdHNldF9pZCA6IGZ1bmN0aW9uIChvYmosIGlkKSB7XG5cdFx0XHRvYmogPSB0aGlzLmdldF9ub2RlKG9iaik7XG5cdFx0XHRpZighb2JqIHx8IG9iai5pZCA9PT0gJyMnKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0dmFyIGksIGosIG0gPSB0aGlzLl9tb2RlbC5kYXRhO1xuXHRcdFx0Ly8gdXBkYXRlIHBhcmVudHMgKHJlcGxhY2UgY3VycmVudCBJRCB3aXRoIG5ldyBvbmUgaW4gY2hpbGRyZW4gYW5kIGNoaWxkcmVuX2QpXG5cdFx0XHRtW29iai5wYXJlbnRdLmNoaWxkcmVuWyQuaW5BcnJheShvYmouaWQsIG1bb2JqLnBhcmVudF0uY2hpbGRyZW4pXSA9IGlkO1xuXHRcdFx0Zm9yKGkgPSAwLCBqID0gb2JqLnBhcmVudHMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdG1bb2JqLnBhcmVudHNbaV1dLmNoaWxkcmVuX2RbJC5pbkFycmF5KG9iai5pZCwgbVtvYmoucGFyZW50c1tpXV0uY2hpbGRyZW5fZCldID0gaWQ7XG5cdFx0XHR9XG5cdFx0XHQvLyB1cGRhdGUgY2hpbGRyZW4gKHJlcGxhY2UgY3VycmVudCBJRCB3aXRoIG5ldyBvbmUgaW4gcGFyZW50IGFuZCBwYXJlbnRzKVxuXHRcdFx0Zm9yKGkgPSAwLCBqID0gb2JqLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRtW29iai5jaGlsZHJlbltpXV0ucGFyZW50ID0gaWQ7XG5cdFx0XHR9XG5cdFx0XHRmb3IoaSA9IDAsIGogPSBvYmouY2hpbGRyZW5fZC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0bVtvYmouY2hpbGRyZW5fZFtpXV0ucGFyZW50c1skLmluQXJyYXkob2JqLmlkLCBtW29iai5jaGlsZHJlbl9kW2ldXS5wYXJlbnRzKV0gPSBpZDtcblx0XHRcdH1cblx0XHRcdGkgPSAkLmluQXJyYXkob2JqLmlkLCB0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQpO1xuXHRcdFx0aWYoaSAhPT0gLTEpIHsgdGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkW2ldID0gaWQ7IH1cblx0XHRcdC8vIHVwZGF0ZSBtb2RlbCBhbmQgb2JqIGl0c2VsZiAob2JqLmlkLCB0aGlzLl9tb2RlbC5kYXRhW0tFWV0pXG5cdFx0XHRpID0gdGhpcy5nZXRfbm9kZShvYmouaWQsIHRydWUpO1xuXHRcdFx0aWYoaSkge1xuXHRcdFx0XHRpLmF0dHIoJ2lkJywgaWQpO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRlIG1bb2JqLmlkXTtcblx0XHRcdG9iai5pZCA9IGlkO1xuXHRcdFx0bVtpZF0gPSBvYmo7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIGdldCB0aGUgdGV4dCB2YWx1ZSBvZiBhIG5vZGVcblx0XHQgKiBAbmFtZSBnZXRfdGV4dChvYmopXG5cdFx0ICogQHBhcmFtICB7bWl4ZWR9IG9iaiB0aGUgbm9kZVxuXHRcdCAqIEByZXR1cm4ge1N0cmluZ31cblx0XHQgKi9cblx0XHRnZXRfdGV4dCA6IGZ1bmN0aW9uIChvYmopIHtcblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdHJldHVybiAoIW9iaiB8fCBvYmouaWQgPT09ICcjJykgPyBmYWxzZSA6IG9iai50ZXh0O1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogc2V0IHRoZSB0ZXh0IHZhbHVlIG9mIGEgbm9kZS4gVXNlZCBpbnRlcm5hbGx5LCBwbGVhc2UgdXNlIGByZW5hbWVfbm9kZShvYmosIHZhbClgLlxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICogQG5hbWUgc2V0X3RleHQob2JqLCB2YWwpXG5cdFx0ICogQHBhcmFtICB7bWl4ZWR9IG9iaiB0aGUgbm9kZSwgeW91IGNhbiBwYXNzIGFuIGFycmF5IHRvIHNldCB0aGUgdGV4dCBvbiBtdWx0aXBsZSBub2Rlc1xuXHRcdCAqIEBwYXJhbSAge1N0cmluZ30gdmFsIHRoZSBuZXcgdGV4dCB2YWx1ZVxuXHRcdCAqIEByZXR1cm4ge0Jvb2xlYW59XG5cdFx0ICogQHRyaWdnZXIgc2V0X3RleHQuanN0cmVlXG5cdFx0ICovXG5cdFx0c2V0X3RleHQgOiBmdW5jdGlvbiAob2JqLCB2YWwpIHtcblx0XHRcdHZhciB0MSwgdDIsIGRvbSwgdG1wO1xuXHRcdFx0aWYoJC5pc0FycmF5KG9iaikpIHtcblx0XHRcdFx0b2JqID0gb2JqLnNsaWNlKCk7XG5cdFx0XHRcdGZvcih0MSA9IDAsIHQyID0gb2JqLmxlbmd0aDsgdDEgPCB0MjsgdDErKykge1xuXHRcdFx0XHRcdHRoaXMuc2V0X3RleHQob2JqW3QxXSwgdmFsKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdGlmKCFvYmogfHwgb2JqLmlkID09PSAnIycpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRvYmoudGV4dCA9IHZhbDtcblx0XHRcdGRvbSA9IHRoaXMuZ2V0X25vZGUob2JqLCB0cnVlKTtcblx0XHRcdGlmKGRvbS5sZW5ndGgpIHtcblx0XHRcdFx0ZG9tID0gZG9tLmNoaWxkcmVuKFwiLmpzdHJlZS1hbmNob3I6ZXEoMClcIik7XG5cdFx0XHRcdHRtcCA9IGRvbS5jaGlsZHJlbihcIklcIikuY2xvbmUoKTtcblx0XHRcdFx0ZG9tLmh0bWwodmFsKS5wcmVwZW5kKHRtcCk7XG5cdFx0XHRcdC8qKlxuXHRcdFx0XHQgKiB0cmlnZ2VyZWQgd2hlbiBhIG5vZGUgdGV4dCB2YWx1ZSBpcyBjaGFuZ2VkXG5cdFx0XHRcdCAqIEBldmVudFxuXHRcdFx0XHQgKiBAbmFtZSBzZXRfdGV4dC5qc3RyZWVcblx0XHRcdFx0ICogQHBhcmFtIHtPYmplY3R9IG9ialxuXHRcdFx0XHQgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCB0aGUgbmV3IHZhbHVlXG5cdFx0XHRcdCAqL1xuXHRcdFx0XHR0aGlzLnRyaWdnZXIoJ3NldF90ZXh0Jyx7IFwib2JqXCIgOiBvYmosIFwidGV4dFwiIDogdmFsIH0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBnZXRzIGEgSlNPTiByZXByZXNlbnRhdGlvbiBvZiBhIG5vZGUgKG9yIHRoZSB3aG9sZSB0cmVlKVxuXHRcdCAqIEBuYW1lIGdldF9qc29uKFtvYmosIG9wdGlvbnNdKVxuXHRcdCAqIEBwYXJhbSAge21peGVkfSBvYmpcblx0XHQgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcblx0XHQgKiBAcGFyYW0gIHtCb29sZWFufSBvcHRpb25zLm5vX3N0YXRlIGRvIG5vdCByZXR1cm4gc3RhdGUgaW5mb3JtYXRpb25cblx0XHQgKiBAcGFyYW0gIHtCb29sZWFufSBvcHRpb25zLm5vX2lkIGRvIG5vdCByZXR1cm4gSURcblx0XHQgKiBAcGFyYW0gIHtCb29sZWFufSBvcHRpb25zLm5vX2NoaWxkcmVuIGRvIG5vdCBpbmNsdWRlIGNoaWxkcmVuXG5cdFx0ICogQHBhcmFtICB7Qm9vbGVhbn0gb3B0aW9ucy5ub19kYXRhIGRvIG5vdCBpbmNsdWRlIG5vZGUgZGF0YVxuXHRcdCAqIEBwYXJhbSAge0Jvb2xlYW59IG9wdGlvbnMuZmxhdCByZXR1cm4gZmxhdCBKU09OIGluc3RlYWQgb2YgbmVzdGVkXG5cdFx0ICogQHJldHVybiB7T2JqZWN0fVxuXHRcdCAqL1xuXHRcdGdldF9qc29uIDogZnVuY3Rpb24gKG9iaiwgb3B0aW9ucywgZmxhdCkge1xuXHRcdFx0b2JqID0gdGhpcy5nZXRfbm9kZShvYmogfHwgJyMnKTtcblx0XHRcdGlmKCFvYmopIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRpZihvcHRpb25zICYmIG9wdGlvbnMuZmxhdCAmJiAhZmxhdCkgeyBmbGF0ID0gW107IH1cblx0XHRcdHZhciB0bXAgPSB7XG5cdFx0XHRcdCdpZCcgOiBvYmouaWQsXG5cdFx0XHRcdCd0ZXh0JyA6IG9iai50ZXh0LFxuXHRcdFx0XHQnaWNvbicgOiB0aGlzLmdldF9pY29uKG9iaiksXG5cdFx0XHRcdCdsaV9hdHRyJyA6IG9iai5saV9hdHRyLFxuXHRcdFx0XHQnYV9hdHRyJyA6IG9iai5hX2F0dHIsXG5cdFx0XHRcdCdzdGF0ZScgOiB7fSxcblx0XHRcdFx0J2RhdGEnIDogb3B0aW9ucyAmJiBvcHRpb25zLm5vX2RhdGEgPyBmYWxzZSA6IG9iai5kYXRhXG5cdFx0XHRcdC8vKCB0aGlzLmdldF9ub2RlKG9iaiwgdHJ1ZSkubGVuZ3RoID8gdGhpcy5nZXRfbm9kZShvYmosIHRydWUpLmRhdGEoKSA6IG9iai5kYXRhICksXG5cdFx0XHR9LCBpLCBqO1xuXHRcdFx0aWYob3B0aW9ucyAmJiBvcHRpb25zLmZsYXQpIHtcblx0XHRcdFx0dG1wLnBhcmVudCA9IG9iai5wYXJlbnQ7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0dG1wLmNoaWxkcmVuID0gW107XG5cdFx0XHR9XG5cdFx0XHRpZighb3B0aW9ucyB8fCAhb3B0aW9ucy5ub19zdGF0ZSkge1xuXHRcdFx0XHRmb3IoaSBpbiBvYmouc3RhdGUpIHtcblx0XHRcdFx0XHRpZihvYmouc3RhdGUuaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdFx0XHRcdHRtcC5zdGF0ZVtpXSA9IG9iai5zdGF0ZVtpXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmKG9wdGlvbnMgJiYgb3B0aW9ucy5ub19pZCkge1xuXHRcdFx0XHRkZWxldGUgdG1wLmlkO1xuXHRcdFx0XHRpZih0bXAubGlfYXR0ciAmJiB0bXAubGlfYXR0ci5pZCkge1xuXHRcdFx0XHRcdGRlbGV0ZSB0bXAubGlfYXR0ci5pZDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYob3B0aW9ucyAmJiBvcHRpb25zLmZsYXQgJiYgb2JqLmlkICE9PSAnIycpIHtcblx0XHRcdFx0ZmxhdC5wdXNoKHRtcCk7XG5cdFx0XHR9XG5cdFx0XHRpZighb3B0aW9ucyB8fCAhb3B0aW9ucy5ub19jaGlsZHJlbikge1xuXHRcdFx0XHRmb3IoaSA9IDAsIGogPSBvYmouY2hpbGRyZW4ubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdFx0aWYob3B0aW9ucyAmJiBvcHRpb25zLmZsYXQpIHtcblx0XHRcdFx0XHRcdHRoaXMuZ2V0X2pzb24ob2JqLmNoaWxkcmVuW2ldLCBvcHRpb25zLCBmbGF0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHR0bXAuY2hpbGRyZW4ucHVzaCh0aGlzLmdldF9qc29uKG9iai5jaGlsZHJlbltpXSwgb3B0aW9ucykpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG9wdGlvbnMgJiYgb3B0aW9ucy5mbGF0ID8gZmxhdCA6IChvYmouaWQgPT09ICcjJyA/IHRtcC5jaGlsZHJlbiA6IHRtcCk7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBjcmVhdGUgYSBuZXcgbm9kZSAoZG8gbm90IGNvbmZ1c2Ugd2l0aCBsb2FkX25vZGUpXG5cdFx0ICogQG5hbWUgY3JlYXRlX25vZGUoW29iaiwgbm9kZSwgcG9zLCBjYWxsYmFjaywgaXNfbG9hZGVkXSlcblx0XHQgKiBAcGFyYW0gIHttaXhlZH0gICBwYXIgICAgICAgdGhlIHBhcmVudCBub2RlXG5cdFx0ICogQHBhcmFtICB7bWl4ZWR9ICAgbm9kZSAgICAgIHRoZSBkYXRhIGZvciB0aGUgbmV3IG5vZGUgKGEgdmFsaWQgSlNPTiBvYmplY3QsIG9yIGEgc2ltcGxlIHN0cmluZyB3aXRoIHRoZSBuYW1lKVxuXHRcdCAqIEBwYXJhbSAge21peGVkfSAgIHBvcyAgICAgICB0aGUgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSBub2RlLCBcImZpcnN0XCIgYW5kIFwibGFzdFwiIGFyZSBhbHNvIHN1cHBvcnRlZCwgZGVmYXVsdCBpcyBcImxhc3RcIlxuXHRcdCAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBhIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbmNlIHRoZSBub2RlIGlzIGNyZWF0ZWRcblx0XHQgKiBAcGFyYW0gIHtCb29sZWFufSBpc19sb2FkZWQgaW50ZXJuYWwgYXJndW1lbnQgaW5kaWNhdGluZyBpZiB0aGUgcGFyZW50IG5vZGUgd2FzIHN1Y2Nlc2Z1bGx5IGxvYWRlZFxuXHRcdCAqIEByZXR1cm4ge1N0cmluZ30gICAgICAgICAgICB0aGUgSUQgb2YgdGhlIG5ld2x5IGNyZWF0ZSBub2RlXG5cdFx0ICogQHRyaWdnZXIgbW9kZWwuanN0cmVlLCBjcmVhdGVfbm9kZS5qc3RyZWVcblx0XHQgKi9cblx0XHRjcmVhdGVfbm9kZSA6IGZ1bmN0aW9uIChwYXIsIG5vZGUsIHBvcywgY2FsbGJhY2ssIGlzX2xvYWRlZCkge1xuXHRcdFx0cGFyID0gdGhpcy5nZXRfbm9kZShwYXIpO1xuXHRcdFx0aWYoIXBhcikgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdHBvcyA9IHBvcyA9PT0gdW5kZWZpbmVkID8gXCJsYXN0XCIgOiBwb3M7XG5cdFx0XHRpZighcG9zLnRvU3RyaW5nKCkubWF0Y2goL14oYmVmb3JlfGFmdGVyKSQvKSAmJiAhaXNfbG9hZGVkICYmICF0aGlzLmlzX2xvYWRlZChwYXIpKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmxvYWRfbm9kZShwYXIsIGZ1bmN0aW9uICgpIHsgdGhpcy5jcmVhdGVfbm9kZShwYXIsIG5vZGUsIHBvcywgY2FsbGJhY2ssIHRydWUpOyB9KTtcblx0XHRcdH1cblx0XHRcdGlmKCFub2RlKSB7IG5vZGUgPSB7IFwidGV4dFwiIDogdGhpcy5nZXRfc3RyaW5nKCdOZXcgbm9kZScpIH07IH1cblx0XHRcdGlmKG5vZGUudGV4dCA9PT0gdW5kZWZpbmVkKSB7IG5vZGUudGV4dCA9IHRoaXMuZ2V0X3N0cmluZygnTmV3IG5vZGUnKTsgfVxuXHRcdFx0dmFyIHRtcCwgZHBjLCBpLCBqO1xuXG5cdFx0XHRpZihwYXIuaWQgPT09ICcjJykge1xuXHRcdFx0XHRpZihwb3MgPT09IFwiYmVmb3JlXCIpIHsgcG9zID0gXCJmaXJzdFwiOyB9XG5cdFx0XHRcdGlmKHBvcyA9PT0gXCJhZnRlclwiKSB7IHBvcyA9IFwibGFzdFwiOyB9XG5cdFx0XHR9XG5cdFx0XHRzd2l0Y2gocG9zKSB7XG5cdFx0XHRcdGNhc2UgXCJiZWZvcmVcIjpcblx0XHRcdFx0XHR0bXAgPSB0aGlzLmdldF9ub2RlKHBhci5wYXJlbnQpO1xuXHRcdFx0XHRcdHBvcyA9ICQuaW5BcnJheShwYXIuaWQsIHRtcC5jaGlsZHJlbik7XG5cdFx0XHRcdFx0cGFyID0gdG1wO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwiYWZ0ZXJcIiA6XG5cdFx0XHRcdFx0dG1wID0gdGhpcy5nZXRfbm9kZShwYXIucGFyZW50KTtcblx0XHRcdFx0XHRwb3MgPSAkLmluQXJyYXkocGFyLmlkLCB0bXAuY2hpbGRyZW4pICsgMTtcblx0XHRcdFx0XHRwYXIgPSB0bXA7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgXCJpbnNpZGVcIjpcblx0XHRcdFx0Y2FzZSBcImZpcnN0XCI6XG5cdFx0XHRcdFx0cG9zID0gMDtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBcImxhc3RcIjpcblx0XHRcdFx0XHRwb3MgPSBwYXIuY2hpbGRyZW4ubGVuZ3RoO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdGlmKCFwb3MpIHsgcG9zID0gMDsgfVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0aWYocG9zID4gcGFyLmNoaWxkcmVuLmxlbmd0aCkgeyBwb3MgPSBwYXIuY2hpbGRyZW4ubGVuZ3RoOyB9XG5cdFx0XHRpZighbm9kZS5pZCkgeyBub2RlLmlkID0gdHJ1ZTsgfVxuXHRcdFx0aWYoIXRoaXMuY2hlY2soXCJjcmVhdGVfbm9kZVwiLCBub2RlLCBwYXIsIHBvcykpIHtcblx0XHRcdFx0dGhpcy5zZXR0aW5ncy5jb3JlLmVycm9yLmNhbGwodGhpcywgdGhpcy5fZGF0YS5jb3JlLmxhc3RfZXJyb3IpO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRpZihub2RlLmlkID09PSB0cnVlKSB7IGRlbGV0ZSBub2RlLmlkOyB9XG5cdFx0XHRub2RlID0gdGhpcy5fcGFyc2VfbW9kZWxfZnJvbV9qc29uKG5vZGUsIHBhci5pZCwgcGFyLnBhcmVudHMuY29uY2F0KCkpO1xuXHRcdFx0aWYoIW5vZGUpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHR0bXAgPSB0aGlzLmdldF9ub2RlKG5vZGUpO1xuXHRcdFx0ZHBjID0gW107XG5cdFx0XHRkcGMucHVzaChub2RlKTtcblx0XHRcdGRwYyA9IGRwYy5jb25jYXQodG1wLmNoaWxkcmVuX2QpO1xuXHRcdFx0dGhpcy50cmlnZ2VyKCdtb2RlbCcsIHsgXCJub2Rlc1wiIDogZHBjLCBcInBhcmVudFwiIDogcGFyLmlkIH0pO1xuXG5cdFx0XHRwYXIuY2hpbGRyZW5fZCA9IHBhci5jaGlsZHJlbl9kLmNvbmNhdChkcGMpO1xuXHRcdFx0Zm9yKGkgPSAwLCBqID0gcGFyLnBhcmVudHMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdHRoaXMuX21vZGVsLmRhdGFbcGFyLnBhcmVudHNbaV1dLmNoaWxkcmVuX2QgPSB0aGlzLl9tb2RlbC5kYXRhW3Bhci5wYXJlbnRzW2ldXS5jaGlsZHJlbl9kLmNvbmNhdChkcGMpO1xuXHRcdFx0fVxuXHRcdFx0bm9kZSA9IHRtcDtcblx0XHRcdHRtcCA9IFtdO1xuXHRcdFx0Zm9yKGkgPSAwLCBqID0gcGFyLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHR0bXBbaSA+PSBwb3MgPyBpKzEgOiBpXSA9IHBhci5jaGlsZHJlbltpXTtcblx0XHRcdH1cblx0XHRcdHRtcFtwb3NdID0gbm9kZS5pZDtcblx0XHRcdHBhci5jaGlsZHJlbiA9IHRtcDtcblxuXHRcdFx0dGhpcy5yZWRyYXdfbm9kZShwYXIsIHRydWUpO1xuXHRcdFx0aWYoY2FsbGJhY2spIHsgY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldF9ub2RlKG5vZGUpKTsgfVxuXHRcdFx0LyoqXG5cdFx0XHQgKiB0cmlnZ2VyZWQgd2hlbiBhIG5vZGUgaXMgY3JlYXRlZFxuXHRcdFx0ICogQGV2ZW50XG5cdFx0XHQgKiBAbmFtZSBjcmVhdGVfbm9kZS5qc3RyZWVcblx0XHRcdCAqIEBwYXJhbSB7T2JqZWN0fSBub2RlXG5cdFx0XHQgKiBAcGFyYW0ge1N0cmluZ30gcGFyZW50IHRoZSBwYXJlbnQncyBJRFxuXHRcdFx0ICogQHBhcmFtIHtOdW1iZXJ9IHBvc2l0aW9uIHRoZSBwb3NpdGlvbiBvZiB0aGUgbmV3IG5vZGUgYW1vbmcgdGhlIHBhcmVudCdzIGNoaWxkcmVuXG5cdFx0XHQgKi9cblx0XHRcdHRoaXMudHJpZ2dlcignY3JlYXRlX25vZGUnLCB7IFwibm9kZVwiIDogdGhpcy5nZXRfbm9kZShub2RlKSwgXCJwYXJlbnRcIiA6IHBhci5pZCwgXCJwb3NpdGlvblwiIDogcG9zIH0pO1xuXHRcdFx0cmV0dXJuIG5vZGUuaWQ7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBzZXQgdGhlIHRleHQgdmFsdWUgb2YgYSBub2RlXG5cdFx0ICogQG5hbWUgcmVuYW1lX25vZGUob2JqLCB2YWwpXG5cdFx0ICogQHBhcmFtICB7bWl4ZWR9IG9iaiB0aGUgbm9kZSwgeW91IGNhbiBwYXNzIGFuIGFycmF5IHRvIHJlbmFtZSBtdWx0aXBsZSBub2RlcyB0byB0aGUgc2FtZSBuYW1lXG5cdFx0ICogQHBhcmFtICB7U3RyaW5nfSB2YWwgdGhlIG5ldyB0ZXh0IHZhbHVlXG5cdFx0ICogQHJldHVybiB7Qm9vbGVhbn1cblx0XHQgKiBAdHJpZ2dlciByZW5hbWVfbm9kZS5qc3RyZWVcblx0XHQgKi9cblx0XHRyZW5hbWVfbm9kZSA6IGZ1bmN0aW9uIChvYmosIHZhbCkge1xuXHRcdFx0dmFyIHQxLCB0Miwgb2xkO1xuXHRcdFx0aWYoJC5pc0FycmF5KG9iaikpIHtcblx0XHRcdFx0b2JqID0gb2JqLnNsaWNlKCk7XG5cdFx0XHRcdGZvcih0MSA9IDAsIHQyID0gb2JqLmxlbmd0aDsgdDEgPCB0MjsgdDErKykge1xuXHRcdFx0XHRcdHRoaXMucmVuYW1lX25vZGUob2JqW3QxXSwgdmFsKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdGlmKCFvYmogfHwgb2JqLmlkID09PSAnIycpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRvbGQgPSBvYmoudGV4dDtcblx0XHRcdGlmKCF0aGlzLmNoZWNrKFwicmVuYW1lX25vZGVcIiwgb2JqLCB0aGlzLmdldF9wYXJlbnQob2JqKSwgdmFsKSkge1xuXHRcdFx0XHR0aGlzLnNldHRpbmdzLmNvcmUuZXJyb3IuY2FsbCh0aGlzLCB0aGlzLl9kYXRhLmNvcmUubGFzdF9lcnJvcik7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHRcdHRoaXMuc2V0X3RleHQob2JqLCB2YWwpOyAvLyAuYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSlcblx0XHRcdC8qKlxuXHRcdFx0ICogdHJpZ2dlcmVkIHdoZW4gYSBub2RlIGlzIHJlbmFtZWRcblx0XHRcdCAqIEBldmVudFxuXHRcdFx0ICogQG5hbWUgcmVuYW1lX25vZGUuanN0cmVlXG5cdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gbm9kZVxuXHRcdFx0ICogQHBhcmFtIHtTdHJpbmd9IHRleHQgdGhlIG5ldyB2YWx1ZVxuXHRcdFx0ICogQHBhcmFtIHtTdHJpbmd9IG9sZCB0aGUgb2xkIHZhbHVlXG5cdFx0XHQgKi9cblx0XHRcdHRoaXMudHJpZ2dlcigncmVuYW1lX25vZGUnLCB7IFwibm9kZVwiIDogb2JqLCBcInRleHRcIiA6IHZhbCwgXCJvbGRcIiA6IG9sZCB9KTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogcmVtb3ZlIGEgbm9kZVxuXHRcdCAqIEBuYW1lIGRlbGV0ZV9ub2RlKG9iailcblx0XHQgKiBAcGFyYW0gIHttaXhlZH0gb2JqIHRoZSBub2RlLCB5b3UgY2FuIHBhc3MgYW4gYXJyYXkgdG8gZGVsZXRlIG11bHRpcGxlIG5vZGVzXG5cdFx0ICogQHJldHVybiB7Qm9vbGVhbn1cblx0XHQgKiBAdHJpZ2dlciBkZWxldGVfbm9kZS5qc3RyZWUsIGNoYW5nZWQuanN0cmVlXG5cdFx0ICovXG5cdFx0ZGVsZXRlX25vZGUgOiBmdW5jdGlvbiAob2JqKSB7XG5cdFx0XHR2YXIgdDEsIHQyLCBwYXIsIHBvcywgdG1wLCBpLCBqLCBrLCBsLCBjO1xuXHRcdFx0aWYoJC5pc0FycmF5KG9iaikpIHtcblx0XHRcdFx0b2JqID0gb2JqLnNsaWNlKCk7XG5cdFx0XHRcdGZvcih0MSA9IDAsIHQyID0gb2JqLmxlbmd0aDsgdDEgPCB0MjsgdDErKykge1xuXHRcdFx0XHRcdHRoaXMuZGVsZXRlX25vZGUob2JqW3QxXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0XHRvYmogPSB0aGlzLmdldF9ub2RlKG9iaik7XG5cdFx0XHRpZighb2JqIHx8IG9iai5pZCA9PT0gJyMnKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0cGFyID0gdGhpcy5nZXRfbm9kZShvYmoucGFyZW50KTtcblx0XHRcdHBvcyA9ICQuaW5BcnJheShvYmouaWQsIHBhci5jaGlsZHJlbik7XG5cdFx0XHRjID0gZmFsc2U7XG5cdFx0XHRpZighdGhpcy5jaGVjayhcImRlbGV0ZV9ub2RlXCIsIG9iaiwgcGFyLCBwb3MpKSB7XG5cdFx0XHRcdHRoaXMuc2V0dGluZ3MuY29yZS5lcnJvci5jYWxsKHRoaXMsIHRoaXMuX2RhdGEuY29yZS5sYXN0X2Vycm9yKTtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0aWYocG9zICE9PSAtMSkge1xuXHRcdFx0XHRwYXIuY2hpbGRyZW4gPSAkLnZha2F0YS5hcnJheV9yZW1vdmUocGFyLmNoaWxkcmVuLCBwb3MpO1xuXHRcdFx0fVxuXHRcdFx0dG1wID0gb2JqLmNoaWxkcmVuX2QuY29uY2F0KFtdKTtcblx0XHRcdHRtcC5wdXNoKG9iai5pZCk7XG5cdFx0XHRmb3IoayA9IDAsIGwgPSB0bXAubGVuZ3RoOyBrIDwgbDsgaysrKSB7XG5cdFx0XHRcdGZvcihpID0gMCwgaiA9IG9iai5wYXJlbnRzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRcdHBvcyA9ICQuaW5BcnJheSh0bXBba10sIHRoaXMuX21vZGVsLmRhdGFbb2JqLnBhcmVudHNbaV1dLmNoaWxkcmVuX2QpO1xuXHRcdFx0XHRcdGlmKHBvcyAhPT0gLTEpIHtcblx0XHRcdFx0XHRcdHRoaXMuX21vZGVsLmRhdGFbb2JqLnBhcmVudHNbaV1dLmNoaWxkcmVuX2QgPSAkLnZha2F0YS5hcnJheV9yZW1vdmUodGhpcy5fbW9kZWwuZGF0YVtvYmoucGFyZW50c1tpXV0uY2hpbGRyZW5fZCwgcG9zKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYodGhpcy5fbW9kZWwuZGF0YVt0bXBba11dLnN0YXRlLnNlbGVjdGVkKSB7XG5cdFx0XHRcdFx0YyA9IHRydWU7XG5cdFx0XHRcdFx0cG9zID0gJC5pbkFycmF5KHRtcFtrXSwgdGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkKTtcblx0XHRcdFx0XHRpZihwb3MgIT09IC0xKSB7XG5cdFx0XHRcdFx0XHR0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQgPSAkLnZha2F0YS5hcnJheV9yZW1vdmUodGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkLCBwb3MpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0LyoqXG5cdFx0XHQgKiB0cmlnZ2VyZWQgd2hlbiBhIG5vZGUgaXMgZGVsZXRlZFxuXHRcdFx0ICogQGV2ZW50XG5cdFx0XHQgKiBAbmFtZSBkZWxldGVfbm9kZS5qc3RyZWVcblx0XHRcdCAqIEBwYXJhbSB7T2JqZWN0fSBub2RlXG5cdFx0XHQgKiBAcGFyYW0ge1N0cmluZ30gcGFyZW50IHRoZSBwYXJlbnQncyBJRFxuXHRcdFx0ICovXG5cdFx0XHR0aGlzLnRyaWdnZXIoJ2RlbGV0ZV9ub2RlJywgeyBcIm5vZGVcIiA6IG9iaiwgXCJwYXJlbnRcIiA6IHBhci5pZCB9KTtcblx0XHRcdGlmKGMpIHtcblx0XHRcdFx0dGhpcy50cmlnZ2VyKCdjaGFuZ2VkJywgeyAnYWN0aW9uJyA6ICdkZWxldGVfbm9kZScsICdub2RlJyA6IG9iaiwgJ3NlbGVjdGVkJyA6IHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZCwgJ3BhcmVudCcgOiBwYXIuaWQgfSk7XG5cdFx0XHR9XG5cdFx0XHRmb3IoayA9IDAsIGwgPSB0bXAubGVuZ3RoOyBrIDwgbDsgaysrKSB7XG5cdFx0XHRcdGRlbGV0ZSB0aGlzLl9tb2RlbC5kYXRhW3RtcFtrXV07XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnJlZHJhd19ub2RlKHBhciwgdHJ1ZSk7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIGNoZWNrIGlmIGFuIG9wZXJhdGlvbiBpcyBwcmVtaXR0ZWQgb24gdGhlIHRyZWUuIFVzZWQgaW50ZXJuYWxseS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqIEBuYW1lIGNoZWNrKGNoaywgb2JqLCBwYXIsIHBvcylcblx0XHQgKiBAcGFyYW0gIHtTdHJpbmd9IGNoayB0aGUgb3BlcmF0aW9uIHRvIGNoZWNrLCBjYW4gYmUgXCJjcmVhdGVfbm9kZVwiLCBcInJlbmFtZV9ub2RlXCIsIFwiZGVsZXRlX25vZGVcIiwgXCJjb3B5X25vZGVcIiBvciBcIm1vdmVfbm9kZVwiXG5cdFx0ICogQHBhcmFtICB7bWl4ZWR9IG9iaiB0aGUgbm9kZVxuXHRcdCAqIEBwYXJhbSAge21peGVkfSBwYXIgdGhlIHBhcmVudFxuXHRcdCAqIEBwYXJhbSAge21peGVkfSBwb3MgdGhlIHBvc2l0aW9uIHRvIGluc2VydCBhdCwgb3IgaWYgXCJyZW5hbWVfbm9kZVwiIC0gdGhlIG5ldyBuYW1lXG5cdFx0ICogQHJldHVybiB7Qm9vbGVhbn1cblx0XHQgKi9cblx0XHRjaGVjayA6IGZ1bmN0aW9uIChjaGssIG9iaiwgcGFyLCBwb3MpIHtcblx0XHRcdG9iaiA9IG9iaiAmJiBvYmouaWQgPyBvYmogOiB0aGlzLmdldF9ub2RlKG9iaik7XG5cdFx0XHRwYXIgPSBwYXIgJiYgcGFyLmlkID8gcGFyIDogdGhpcy5nZXRfbm9kZShwYXIpO1xuXHRcdFx0dmFyIHRtcCA9IGNoay5tYXRjaCgvXm1vdmVfbm9kZXxjb3B5X25vZGV8Y3JlYXRlX25vZGUkL2kpID8gcGFyIDogb2JqLFxuXHRcdFx0XHRjaGMgPSB0aGlzLnNldHRpbmdzLmNvcmUuY2hlY2tfY2FsbGJhY2s7XG5cdFx0XHRpZihjaGsgPT09IFwibW92ZV9ub2RlXCIpIHtcblx0XHRcdFx0aWYob2JqLmlkID09PSBwYXIuaWQgfHwgJC5pbkFycmF5KG9iai5pZCwgcGFyLmNoaWxkcmVuKSA9PT0gcG9zIHx8ICQuaW5BcnJheShwYXIuaWQsIG9iai5jaGlsZHJlbl9kKSAhPT0gLTEpIHtcblx0XHRcdFx0XHR0aGlzLl9kYXRhLmNvcmUubGFzdF9lcnJvciA9IHsgJ2Vycm9yJyA6ICdjaGVjaycsICdwbHVnaW4nIDogJ2NvcmUnLCAnaWQnIDogJ2NvcmVfMDEnLCAncmVhc29uJyA6ICdNb3ZpbmcgcGFyZW50IGluc2lkZSBjaGlsZCcsICdkYXRhJyA6IEpTT04uc3RyaW5naWZ5KHsgJ2NoaycgOiBjaGssICdwb3MnIDogcG9zLCAnb2JqJyA6IG9iaiAmJiBvYmouaWQgPyBvYmouaWQgOiBmYWxzZSwgJ3BhcicgOiBwYXIgJiYgcGFyLmlkID8gcGFyLmlkIDogZmFsc2UgfSkgfTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHRtcCA9IHRoaXMuZ2V0X25vZGUodG1wLCB0cnVlKTtcblx0XHRcdGlmKHRtcC5sZW5ndGgpIHsgdG1wID0gdG1wLmRhdGEoJ2pzdHJlZScpOyB9XG5cdFx0XHRpZih0bXAgJiYgdG1wLmZ1bmN0aW9ucyAmJiAodG1wLmZ1bmN0aW9uc1tjaGtdID09PSBmYWxzZSB8fCB0bXAuZnVuY3Rpb25zW2Noa10gPT09IHRydWUpKSB7XG5cdFx0XHRcdGlmKHRtcC5mdW5jdGlvbnNbY2hrXSA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHR0aGlzLl9kYXRhLmNvcmUubGFzdF9lcnJvciA9IHsgJ2Vycm9yJyA6ICdjaGVjaycsICdwbHVnaW4nIDogJ2NvcmUnLCAnaWQnIDogJ2NvcmVfMDInLCAncmVhc29uJyA6ICdOb2RlIGRhdGEgcHJldmVudHMgZnVuY3Rpb246ICcgKyBjaGssICdkYXRhJyA6IEpTT04uc3RyaW5naWZ5KHsgJ2NoaycgOiBjaGssICdwb3MnIDogcG9zLCAnb2JqJyA6IG9iaiAmJiBvYmouaWQgPyBvYmouaWQgOiBmYWxzZSwgJ3BhcicgOiBwYXIgJiYgcGFyLmlkID8gcGFyLmlkIDogZmFsc2UgfSkgfTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdG1wLmZ1bmN0aW9uc1tjaGtdO1xuXHRcdFx0fVxuXHRcdFx0aWYoY2hjID09PSBmYWxzZSB8fCAoJC5pc0Z1bmN0aW9uKGNoYykgJiYgY2hjLmNhbGwodGhpcywgY2hrLCBvYmosIHBhciwgcG9zKSA9PT0gZmFsc2UpIHx8IChjaGMgJiYgY2hjW2Noa10gPT09IGZhbHNlKSkge1xuXHRcdFx0XHR0aGlzLl9kYXRhLmNvcmUubGFzdF9lcnJvciA9IHsgJ2Vycm9yJyA6ICdjaGVjaycsICdwbHVnaW4nIDogJ2NvcmUnLCAnaWQnIDogJ2NvcmVfMDMnLCAncmVhc29uJyA6ICdVc2VyIGNvbmZpZyBmb3IgY29yZS5jaGVja19jYWxsYmFjayBwcmV2ZW50cyBmdW5jdGlvbjogJyArIGNoaywgJ2RhdGEnIDogSlNPTi5zdHJpbmdpZnkoeyAnY2hrJyA6IGNoaywgJ3BvcycgOiBwb3MsICdvYmonIDogb2JqICYmIG9iai5pZCA/IG9iai5pZCA6IGZhbHNlLCAncGFyJyA6IHBhciAmJiBwYXIuaWQgPyBwYXIuaWQgOiBmYWxzZSB9KSB9O1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIGdldCB0aGUgbGFzdCBlcnJvclxuXHRcdCAqIEBuYW1lIGxhc3RfZXJyb3IoKVxuXHRcdCAqIEByZXR1cm4ge09iamVjdH1cblx0XHQgKi9cblx0XHRsYXN0X2Vycm9yIDogZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX2RhdGEuY29yZS5sYXN0X2Vycm9yO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogbW92ZSBhIG5vZGUgdG8gYSBuZXcgcGFyZW50XG5cdFx0ICogQG5hbWUgbW92ZV9ub2RlKG9iaiwgcGFyIFssIHBvcywgY2FsbGJhY2ssIGlzX2xvYWRlZF0pXG5cdFx0ICogQHBhcmFtICB7bWl4ZWR9IG9iaiB0aGUgbm9kZSB0byBtb3ZlLCBwYXNzIGFuIGFycmF5IHRvIG1vdmUgbXVsdGlwbGUgbm9kZXNcblx0XHQgKiBAcGFyYW0gIHttaXhlZH0gcGFyIHRoZSBuZXcgcGFyZW50XG5cdFx0ICogQHBhcmFtICB7bWl4ZWR9IHBvcyB0aGUgcG9zaXRpb24gdG8gaW5zZXJ0IGF0IChcImZpcnN0XCIgYW5kIFwibGFzdFwiIGFyZSBzdXBwb3J0ZWQsIGFzIHdlbGwgYXMgXCJiZWZvcmVcIiBhbmQgXCJhZnRlclwiKSwgZGVmYXVsdHMgdG8gYDBgXG5cdFx0ICogQHBhcmFtICB7ZnVuY3Rpb259IGNhbGxiYWNrIGEgZnVuY3Rpb24gdG8gY2FsbCBvbmNlIHRoZSBtb3ZlIGlzIGNvbXBsZXRlZCwgcmVjZWl2ZXMgMyBhcmd1bWVudHMgLSB0aGUgbm9kZSwgdGhlIG5ldyBwYXJlbnQgYW5kIHRoZSBwb3NpdGlvblxuXHRcdCAqIEBwYXJhbSAge0Jvb2xlYW59IGludGVybmFsIHBhcmFtZXRlciBpbmRpY2F0aW5nIGlmIHRoZSBwYXJlbnQgbm9kZSBoYXMgYmVlbiBsb2FkZWRcblx0XHQgKiBAdHJpZ2dlciBtb3ZlX25vZGUuanN0cmVlXG5cdFx0ICovXG5cdFx0bW92ZV9ub2RlIDogZnVuY3Rpb24gKG9iaiwgcGFyLCBwb3MsIGNhbGxiYWNrLCBpc19sb2FkZWQpIHtcblx0XHRcdHZhciB0MSwgdDIsIG9sZF9wYXIsIG5ld19wYXIsIG9sZF9pbnMsIGlzX211bHRpLCBkcGMsIHRtcCwgaSwgaiwgaywgbCwgcDtcblx0XHRcdGlmKCQuaXNBcnJheShvYmopKSB7XG5cdFx0XHRcdG9iaiA9IG9iai5yZXZlcnNlKCkuc2xpY2UoKTtcblx0XHRcdFx0Zm9yKHQxID0gMCwgdDIgPSBvYmoubGVuZ3RoOyB0MSA8IHQyOyB0MSsrKSB7XG5cdFx0XHRcdFx0dGhpcy5tb3ZlX25vZGUob2JqW3QxXSwgcGFyLCBwb3MsIGNhbGxiYWNrLCBpc19sb2FkZWQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0b2JqID0gb2JqICYmIG9iai5pZCA/IG9iaiA6IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdHBhciA9IHRoaXMuZ2V0X25vZGUocGFyKTtcblx0XHRcdHBvcyA9IHBvcyA9PT0gdW5kZWZpbmVkID8gMCA6IHBvcztcblxuXHRcdFx0aWYoIXBhciB8fCAhb2JqIHx8IG9iai5pZCA9PT0gJyMnKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0aWYoIXBvcy50b1N0cmluZygpLm1hdGNoKC9eKGJlZm9yZXxhZnRlcikkLykgJiYgIWlzX2xvYWRlZCAmJiAhdGhpcy5pc19sb2FkZWQocGFyKSkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5sb2FkX25vZGUocGFyLCBmdW5jdGlvbiAoKSB7IHRoaXMubW92ZV9ub2RlKG9iaiwgcGFyLCBwb3MsIGNhbGxiYWNrLCB0cnVlKTsgfSk7XG5cdFx0XHR9XG5cblx0XHRcdG9sZF9wYXIgPSAob2JqLnBhcmVudCB8fCAnIycpLnRvU3RyaW5nKCk7XG5cdFx0XHRuZXdfcGFyID0gKCFwb3MudG9TdHJpbmcoKS5tYXRjaCgvXihiZWZvcmV8YWZ0ZXIpJC8pIHx8IHBhci5pZCA9PT0gJyMnKSA/IHBhciA6IHRoaXMuZ2V0X25vZGUocGFyLnBhcmVudCk7XG5cdFx0XHRvbGRfaW5zID0gdGhpcy5fbW9kZWwuZGF0YVtvYmouaWRdID8gdGhpcyA6ICQuanN0cmVlLnJlZmVyZW5jZShvYmouaWQpO1xuXHRcdFx0aXNfbXVsdGkgPSAhb2xkX2lucyB8fCAhb2xkX2lucy5faWQgfHwgKHRoaXMuX2lkICE9PSBvbGRfaW5zLl9pZCk7XG5cdFx0XHRpZihpc19tdWx0aSkge1xuXHRcdFx0XHRpZih0aGlzLmNvcHlfbm9kZShvYmosIHBhciwgcG9zLCBjYWxsYmFjaywgaXNfbG9hZGVkKSkge1xuXHRcdFx0XHRcdGlmKG9sZF9pbnMpIHsgb2xkX2lucy5kZWxldGVfbm9kZShvYmopOyB9XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0Ly92YXIgbSA9IHRoaXMuX21vZGVsLmRhdGE7XG5cdFx0XHRpZihuZXdfcGFyLmlkID09PSAnIycpIHtcblx0XHRcdFx0aWYocG9zID09PSBcImJlZm9yZVwiKSB7IHBvcyA9IFwiZmlyc3RcIjsgfVxuXHRcdFx0XHRpZihwb3MgPT09IFwiYWZ0ZXJcIikgeyBwb3MgPSBcImxhc3RcIjsgfVxuXHRcdFx0fVxuXHRcdFx0c3dpdGNoKHBvcykge1xuXHRcdFx0XHRjYXNlIFwiYmVmb3JlXCI6XG5cdFx0XHRcdFx0cG9zID0gJC5pbkFycmF5KHBhci5pZCwgbmV3X3Bhci5jaGlsZHJlbik7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgXCJhZnRlclwiIDpcblx0XHRcdFx0XHRwb3MgPSAkLmluQXJyYXkocGFyLmlkLCBuZXdfcGFyLmNoaWxkcmVuKSArIDE7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgXCJpbnNpZGVcIjpcblx0XHRcdFx0Y2FzZSBcImZpcnN0XCI6XG5cdFx0XHRcdFx0cG9zID0gMDtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBcImxhc3RcIjpcblx0XHRcdFx0XHRwb3MgPSBuZXdfcGFyLmNoaWxkcmVuLmxlbmd0aDtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRpZighcG9zKSB7IHBvcyA9IDA7IH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHRcdGlmKHBvcyA+IG5ld19wYXIuY2hpbGRyZW4ubGVuZ3RoKSB7IHBvcyA9IG5ld19wYXIuY2hpbGRyZW4ubGVuZ3RoOyB9XG5cdFx0XHRpZighdGhpcy5jaGVjayhcIm1vdmVfbm9kZVwiLCBvYmosIG5ld19wYXIsIHBvcykpIHtcblx0XHRcdFx0dGhpcy5zZXR0aW5ncy5jb3JlLmVycm9yLmNhbGwodGhpcywgdGhpcy5fZGF0YS5jb3JlLmxhc3RfZXJyb3IpO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRpZihvYmoucGFyZW50ID09PSBuZXdfcGFyLmlkKSB7XG5cdFx0XHRcdGRwYyA9IG5ld19wYXIuY2hpbGRyZW4uY29uY2F0KCk7XG5cdFx0XHRcdHRtcCA9ICQuaW5BcnJheShvYmouaWQsIGRwYyk7XG5cdFx0XHRcdGlmKHRtcCAhPT0gLTEpIHtcblx0XHRcdFx0XHRkcGMgPSAkLnZha2F0YS5hcnJheV9yZW1vdmUoZHBjLCB0bXApO1xuXHRcdFx0XHRcdGlmKHBvcyA+IHRtcCkgeyBwb3MtLTsgfVxuXHRcdFx0XHR9XG5cdFx0XHRcdHRtcCA9IFtdO1xuXHRcdFx0XHRmb3IoaSA9IDAsIGogPSBkcGMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdFx0dG1wW2kgPj0gcG9zID8gaSsxIDogaV0gPSBkcGNbaV07XG5cdFx0XHRcdH1cblx0XHRcdFx0dG1wW3Bvc10gPSBvYmouaWQ7XG5cdFx0XHRcdG5ld19wYXIuY2hpbGRyZW4gPSB0bXA7XG5cdFx0XHRcdHRoaXMuX25vZGVfY2hhbmdlZChuZXdfcGFyLmlkKTtcblx0XHRcdFx0dGhpcy5yZWRyYXcobmV3X3Bhci5pZCA9PT0gJyMnKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHQvLyBjbGVhbiBvbGQgcGFyZW50IGFuZCB1cFxuXHRcdFx0XHR0bXAgPSBvYmouY2hpbGRyZW5fZC5jb25jYXQoKTtcblx0XHRcdFx0dG1wLnB1c2gob2JqLmlkKTtcblx0XHRcdFx0Zm9yKGkgPSAwLCBqID0gb2JqLnBhcmVudHMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdFx0ZHBjID0gW107XG5cdFx0XHRcdFx0cCA9IG9sZF9pbnMuX21vZGVsLmRhdGFbb2JqLnBhcmVudHNbaV1dLmNoaWxkcmVuX2Q7XG5cdFx0XHRcdFx0Zm9yKGsgPSAwLCBsID0gcC5sZW5ndGg7IGsgPCBsOyBrKyspIHtcblx0XHRcdFx0XHRcdGlmKCQuaW5BcnJheShwW2tdLCB0bXApID09PSAtMSkge1xuXHRcdFx0XHRcdFx0XHRkcGMucHVzaChwW2tdKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0b2xkX2lucy5fbW9kZWwuZGF0YVtvYmoucGFyZW50c1tpXV0uY2hpbGRyZW5fZCA9IGRwYztcblx0XHRcdFx0fVxuXHRcdFx0XHRvbGRfaW5zLl9tb2RlbC5kYXRhW29sZF9wYXJdLmNoaWxkcmVuID0gJC52YWthdGEuYXJyYXlfcmVtb3ZlX2l0ZW0ob2xkX2lucy5fbW9kZWwuZGF0YVtvbGRfcGFyXS5jaGlsZHJlbiwgb2JqLmlkKTtcblxuXHRcdFx0XHQvLyBpbnNlcnQgaW50byBuZXcgcGFyZW50IGFuZCB1cFxuXHRcdFx0XHRmb3IoaSA9IDAsIGogPSBuZXdfcGFyLnBhcmVudHMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdFx0dGhpcy5fbW9kZWwuZGF0YVtuZXdfcGFyLnBhcmVudHNbaV1dLmNoaWxkcmVuX2QgPSB0aGlzLl9tb2RlbC5kYXRhW25ld19wYXIucGFyZW50c1tpXV0uY2hpbGRyZW5fZC5jb25jYXQodG1wKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRkcGMgPSBbXTtcblx0XHRcdFx0Zm9yKGkgPSAwLCBqID0gbmV3X3Bhci5jaGlsZHJlbi5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0XHRkcGNbaSA+PSBwb3MgPyBpKzEgOiBpXSA9IG5ld19wYXIuY2hpbGRyZW5baV07XG5cdFx0XHRcdH1cblx0XHRcdFx0ZHBjW3Bvc10gPSBvYmouaWQ7XG5cdFx0XHRcdG5ld19wYXIuY2hpbGRyZW4gPSBkcGM7XG5cdFx0XHRcdG5ld19wYXIuY2hpbGRyZW5fZC5wdXNoKG9iai5pZCk7XG5cdFx0XHRcdG5ld19wYXIuY2hpbGRyZW5fZCA9IG5ld19wYXIuY2hpbGRyZW5fZC5jb25jYXQob2JqLmNoaWxkcmVuX2QpO1xuXG5cdFx0XHRcdC8vIHVwZGF0ZSBvYmplY3Rcblx0XHRcdFx0b2JqLnBhcmVudCA9IG5ld19wYXIuaWQ7XG5cdFx0XHRcdHRtcCA9IG5ld19wYXIucGFyZW50cy5jb25jYXQoKTtcblx0XHRcdFx0dG1wLnVuc2hpZnQobmV3X3Bhci5pZCk7XG5cdFx0XHRcdHAgPSBvYmoucGFyZW50cy5sZW5ndGg7XG5cdFx0XHRcdG9iai5wYXJlbnRzID0gdG1wO1xuXG5cdFx0XHRcdC8vIHVwZGF0ZSBvYmplY3QgY2hpbGRyZW5cblx0XHRcdFx0dG1wID0gdG1wLmNvbmNhdCgpO1xuXHRcdFx0XHRmb3IoaSA9IDAsIGogPSBvYmouY2hpbGRyZW5fZC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0XHR0aGlzLl9tb2RlbC5kYXRhW29iai5jaGlsZHJlbl9kW2ldXS5wYXJlbnRzID0gdGhpcy5fbW9kZWwuZGF0YVtvYmouY2hpbGRyZW5fZFtpXV0ucGFyZW50cy5zbGljZSgwLHAqLTEpO1xuXHRcdFx0XHRcdEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHRoaXMuX21vZGVsLmRhdGFbb2JqLmNoaWxkcmVuX2RbaV1dLnBhcmVudHMsIHRtcCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLl9ub2RlX2NoYW5nZWQob2xkX3Bhcik7XG5cdFx0XHRcdHRoaXMuX25vZGVfY2hhbmdlZChuZXdfcGFyLmlkKTtcblx0XHRcdFx0dGhpcy5yZWRyYXcob2xkX3BhciA9PT0gJyMnIHx8IG5ld19wYXIuaWQgPT09ICcjJyk7XG5cdFx0XHR9XG5cdFx0XHRpZihjYWxsYmFjaykgeyBjYWxsYmFjay5jYWxsKHRoaXMsIG9iaiwgbmV3X3BhciwgcG9zKTsgfVxuXHRcdFx0LyoqXG5cdFx0XHQgKiB0cmlnZ2VyZWQgd2hlbiBhIG5vZGUgaXMgbW92ZWRcblx0XHRcdCAqIEBldmVudFxuXHRcdFx0ICogQG5hbWUgbW92ZV9ub2RlLmpzdHJlZVxuXHRcdFx0ICogQHBhcmFtIHtPYmplY3R9IG5vZGVcblx0XHRcdCAqIEBwYXJhbSB7U3RyaW5nfSBwYXJlbnQgdGhlIHBhcmVudCdzIElEXG5cdFx0XHQgKiBAcGFyYW0ge051bWJlcn0gcG9zaXRpb24gdGhlIHBvc2l0aW9uIG9mIHRoZSBub2RlIGFtb25nIHRoZSBwYXJlbnQncyBjaGlsZHJlblxuXHRcdFx0ICogQHBhcmFtIHtTdHJpbmd9IG9sZF9wYXJlbnQgdGhlIG9sZCBwYXJlbnQgb2YgdGhlIG5vZGVcblx0XHRcdCAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNfbXVsdGkgZG8gdGhlIG5vZGUgYW5kIG5ldyBwYXJlbnQgYmVsb25nIHRvIGRpZmZlcmVudCBpbnN0YW5jZXNcblx0XHRcdCAqIEBwYXJhbSB7anNUcmVlfSBvbGRfaW5zdGFuY2UgdGhlIGluc3RhbmNlIHRoZSBub2RlIGNhbWUgZnJvbVxuXHRcdFx0ICogQHBhcmFtIHtqc1RyZWV9IG5ld19pbnN0YW5jZSB0aGUgaW5zdGFuY2Ugb2YgdGhlIG5ldyBwYXJlbnRcblx0XHRcdCAqL1xuXHRcdFx0dGhpcy50cmlnZ2VyKCdtb3ZlX25vZGUnLCB7IFwibm9kZVwiIDogb2JqLCBcInBhcmVudFwiIDogbmV3X3Bhci5pZCwgXCJwb3NpdGlvblwiIDogcG9zLCBcIm9sZF9wYXJlbnRcIiA6IG9sZF9wYXIsIFwiaXNfbXVsdGlcIiA6IGlzX211bHRpLCAnb2xkX2luc3RhbmNlJyA6IG9sZF9pbnMsICduZXdfaW5zdGFuY2UnIDogdGhpcyB9KTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogY29weSBhIG5vZGUgdG8gYSBuZXcgcGFyZW50XG5cdFx0ICogQG5hbWUgY29weV9ub2RlKG9iaiwgcGFyIFssIHBvcywgY2FsbGJhY2ssIGlzX2xvYWRlZF0pXG5cdFx0ICogQHBhcmFtICB7bWl4ZWR9IG9iaiB0aGUgbm9kZSB0byBjb3B5LCBwYXNzIGFuIGFycmF5IHRvIGNvcHkgbXVsdGlwbGUgbm9kZXNcblx0XHQgKiBAcGFyYW0gIHttaXhlZH0gcGFyIHRoZSBuZXcgcGFyZW50XG5cdFx0ICogQHBhcmFtICB7bWl4ZWR9IHBvcyB0aGUgcG9zaXRpb24gdG8gaW5zZXJ0IGF0IChcImZpcnN0XCIgYW5kIFwibGFzdFwiIGFyZSBzdXBwb3J0ZWQsIGFzIHdlbGwgYXMgXCJiZWZvcmVcIiBhbmQgXCJhZnRlclwiKSwgZGVmYXVsdHMgdG8gYDBgXG5cdFx0ICogQHBhcmFtICB7ZnVuY3Rpb259IGNhbGxiYWNrIGEgZnVuY3Rpb24gdG8gY2FsbCBvbmNlIHRoZSBtb3ZlIGlzIGNvbXBsZXRlZCwgcmVjZWl2ZXMgMyBhcmd1bWVudHMgLSB0aGUgbm9kZSwgdGhlIG5ldyBwYXJlbnQgYW5kIHRoZSBwb3NpdGlvblxuXHRcdCAqIEBwYXJhbSAge0Jvb2xlYW59IGludGVybmFsIHBhcmFtZXRlciBpbmRpY2F0aW5nIGlmIHRoZSBwYXJlbnQgbm9kZSBoYXMgYmVlbiBsb2FkZWRcblx0XHQgKiBAdHJpZ2dlciBtb2RlbC5qc3RyZWUgY29weV9ub2RlLmpzdHJlZVxuXHRcdCAqL1xuXHRcdGNvcHlfbm9kZSA6IGZ1bmN0aW9uIChvYmosIHBhciwgcG9zLCBjYWxsYmFjaywgaXNfbG9hZGVkKSB7XG5cdFx0XHR2YXIgdDEsIHQyLCBkcGMsIHRtcCwgaSwgaiwgbm9kZSwgb2xkX3BhciwgbmV3X3Bhciwgb2xkX2lucywgaXNfbXVsdGk7XG5cdFx0XHRpZigkLmlzQXJyYXkob2JqKSkge1xuXHRcdFx0XHRvYmogPSBvYmoucmV2ZXJzZSgpLnNsaWNlKCk7XG5cdFx0XHRcdGZvcih0MSA9IDAsIHQyID0gb2JqLmxlbmd0aDsgdDEgPCB0MjsgdDErKykge1xuXHRcdFx0XHRcdHRoaXMuY29weV9ub2RlKG9ialt0MV0sIHBhciwgcG9zLCBjYWxsYmFjaywgaXNfbG9hZGVkKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdG9iaiA9IG9iaiAmJiBvYmouaWQgPyBvYmogOiB0aGlzLmdldF9ub2RlKG9iaik7XG5cdFx0XHRwYXIgPSB0aGlzLmdldF9ub2RlKHBhcik7XG5cdFx0XHRwb3MgPSBwb3MgPT09IHVuZGVmaW5lZCA/IDAgOiBwb3M7XG5cblx0XHRcdGlmKCFwYXIgfHwgIW9iaiB8fCBvYmouaWQgPT09ICcjJykgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdGlmKCFwb3MudG9TdHJpbmcoKS5tYXRjaCgvXihiZWZvcmV8YWZ0ZXIpJC8pICYmICFpc19sb2FkZWQgJiYgIXRoaXMuaXNfbG9hZGVkKHBhcikpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMubG9hZF9ub2RlKHBhciwgZnVuY3Rpb24gKCkgeyB0aGlzLmNvcHlfbm9kZShvYmosIHBhciwgcG9zLCBjYWxsYmFjaywgdHJ1ZSk7IH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRvbGRfcGFyID0gKG9iai5wYXJlbnQgfHwgJyMnKS50b1N0cmluZygpO1xuXHRcdFx0bmV3X3BhciA9ICghcG9zLnRvU3RyaW5nKCkubWF0Y2goL14oYmVmb3JlfGFmdGVyKSQvKSB8fCBwYXIuaWQgPT09ICcjJykgPyBwYXIgOiB0aGlzLmdldF9ub2RlKHBhci5wYXJlbnQpO1xuXHRcdFx0b2xkX2lucyA9IHRoaXMuX21vZGVsLmRhdGFbb2JqLmlkXSA/IHRoaXMgOiAkLmpzdHJlZS5yZWZlcmVuY2Uob2JqLmlkKTtcblx0XHRcdGlzX211bHRpID0gIW9sZF9pbnMgfHwgIW9sZF9pbnMuX2lkIHx8ICh0aGlzLl9pZCAhPT0gb2xkX2lucy5faWQpO1xuXHRcdFx0aWYobmV3X3Bhci5pZCA9PT0gJyMnKSB7XG5cdFx0XHRcdGlmKHBvcyA9PT0gXCJiZWZvcmVcIikgeyBwb3MgPSBcImZpcnN0XCI7IH1cblx0XHRcdFx0aWYocG9zID09PSBcImFmdGVyXCIpIHsgcG9zID0gXCJsYXN0XCI7IH1cblx0XHRcdH1cblx0XHRcdHN3aXRjaChwb3MpIHtcblx0XHRcdFx0Y2FzZSBcImJlZm9yZVwiOlxuXHRcdFx0XHRcdHBvcyA9ICQuaW5BcnJheShwYXIuaWQsIG5ld19wYXIuY2hpbGRyZW4pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwiYWZ0ZXJcIiA6XG5cdFx0XHRcdFx0cG9zID0gJC5pbkFycmF5KHBhci5pZCwgbmV3X3Bhci5jaGlsZHJlbikgKyAxO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwiaW5zaWRlXCI6XG5cdFx0XHRcdGNhc2UgXCJmaXJzdFwiOlxuXHRcdFx0XHRcdHBvcyA9IDA7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgXCJsYXN0XCI6XG5cdFx0XHRcdFx0cG9zID0gbmV3X3Bhci5jaGlsZHJlbi5sZW5ndGg7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0aWYoIXBvcykgeyBwb3MgPSAwOyB9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRpZihwb3MgPiBuZXdfcGFyLmNoaWxkcmVuLmxlbmd0aCkgeyBwb3MgPSBuZXdfcGFyLmNoaWxkcmVuLmxlbmd0aDsgfVxuXHRcdFx0aWYoIXRoaXMuY2hlY2soXCJjb3B5X25vZGVcIiwgb2JqLCBuZXdfcGFyLCBwb3MpKSB7XG5cdFx0XHRcdHRoaXMuc2V0dGluZ3MuY29yZS5lcnJvci5jYWxsKHRoaXMsIHRoaXMuX2RhdGEuY29yZS5sYXN0X2Vycm9yKTtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0bm9kZSA9IG9sZF9pbnMgPyBvbGRfaW5zLmdldF9qc29uKG9iaiwgeyBub19pZCA6IHRydWUsIG5vX2RhdGEgOiB0cnVlLCBub19zdGF0ZSA6IHRydWUgfSkgOiBvYmo7XG5cdFx0XHRpZighbm9kZSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdGlmKG5vZGUuaWQgPT09IHRydWUpIHsgZGVsZXRlIG5vZGUuaWQ7IH1cblx0XHRcdG5vZGUgPSB0aGlzLl9wYXJzZV9tb2RlbF9mcm9tX2pzb24obm9kZSwgbmV3X3Bhci5pZCwgbmV3X3Bhci5wYXJlbnRzLmNvbmNhdCgpKTtcblx0XHRcdGlmKCFub2RlKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0dG1wID0gdGhpcy5nZXRfbm9kZShub2RlKTtcblx0XHRcdGRwYyA9IFtdO1xuXHRcdFx0ZHBjLnB1c2gobm9kZSk7XG5cdFx0XHRkcGMgPSBkcGMuY29uY2F0KHRtcC5jaGlsZHJlbl9kKTtcblx0XHRcdHRoaXMudHJpZ2dlcignbW9kZWwnLCB7IFwibm9kZXNcIiA6IGRwYywgXCJwYXJlbnRcIiA6IG5ld19wYXIuaWQgfSk7XG5cblx0XHRcdC8vIGluc2VydCBpbnRvIG5ldyBwYXJlbnQgYW5kIHVwXG5cdFx0XHRmb3IoaSA9IDAsIGogPSBuZXdfcGFyLnBhcmVudHMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdHRoaXMuX21vZGVsLmRhdGFbbmV3X3Bhci5wYXJlbnRzW2ldXS5jaGlsZHJlbl9kID0gdGhpcy5fbW9kZWwuZGF0YVtuZXdfcGFyLnBhcmVudHNbaV1dLmNoaWxkcmVuX2QuY29uY2F0KGRwYyk7XG5cdFx0XHR9XG5cdFx0XHRkcGMgPSBbXTtcblx0XHRcdGZvcihpID0gMCwgaiA9IG5ld19wYXIuY2hpbGRyZW4ubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdGRwY1tpID49IHBvcyA/IGkrMSA6IGldID0gbmV3X3Bhci5jaGlsZHJlbltpXTtcblx0XHRcdH1cblx0XHRcdGRwY1twb3NdID0gdG1wLmlkO1xuXHRcdFx0bmV3X3Bhci5jaGlsZHJlbiA9IGRwYztcblx0XHRcdG5ld19wYXIuY2hpbGRyZW5fZC5wdXNoKHRtcC5pZCk7XG5cdFx0XHRuZXdfcGFyLmNoaWxkcmVuX2QgPSBuZXdfcGFyLmNoaWxkcmVuX2QuY29uY2F0KHRtcC5jaGlsZHJlbl9kKTtcblxuXHRcdFx0dGhpcy5fbm9kZV9jaGFuZ2VkKG5ld19wYXIuaWQpO1xuXHRcdFx0dGhpcy5yZWRyYXcobmV3X3Bhci5pZCA9PT0gJyMnKTtcblx0XHRcdGlmKGNhbGxiYWNrKSB7IGNhbGxiYWNrLmNhbGwodGhpcywgdG1wLCBuZXdfcGFyLCBwb3MpOyB9XG5cdFx0XHQvKipcblx0XHRcdCAqIHRyaWdnZXJlZCB3aGVuIGEgbm9kZSBpcyBjb3BpZWRcblx0XHRcdCAqIEBldmVudFxuXHRcdFx0ICogQG5hbWUgY29weV9ub2RlLmpzdHJlZVxuXHRcdFx0ICogQHBhcmFtIHtPYmplY3R9IG5vZGUgdGhlIGNvcGllZCBub2RlXG5cdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gb3JpZ2luYWwgdGhlIG9yaWdpbmFsIG5vZGVcblx0XHRcdCAqIEBwYXJhbSB7U3RyaW5nfSBwYXJlbnQgdGhlIHBhcmVudCdzIElEXG5cdFx0XHQgKiBAcGFyYW0ge051bWJlcn0gcG9zaXRpb24gdGhlIHBvc2l0aW9uIG9mIHRoZSBub2RlIGFtb25nIHRoZSBwYXJlbnQncyBjaGlsZHJlblxuXHRcdFx0ICogQHBhcmFtIHtTdHJpbmd9IG9sZF9wYXJlbnQgdGhlIG9sZCBwYXJlbnQgb2YgdGhlIG5vZGVcblx0XHRcdCAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNfbXVsdGkgZG8gdGhlIG5vZGUgYW5kIG5ldyBwYXJlbnQgYmVsb25nIHRvIGRpZmZlcmVudCBpbnN0YW5jZXNcblx0XHRcdCAqIEBwYXJhbSB7anNUcmVlfSBvbGRfaW5zdGFuY2UgdGhlIGluc3RhbmNlIHRoZSBub2RlIGNhbWUgZnJvbVxuXHRcdFx0ICogQHBhcmFtIHtqc1RyZWV9IG5ld19pbnN0YW5jZSB0aGUgaW5zdGFuY2Ugb2YgdGhlIG5ldyBwYXJlbnRcblx0XHRcdCAqL1xuXHRcdFx0dGhpcy50cmlnZ2VyKCdjb3B5X25vZGUnLCB7IFwibm9kZVwiIDogdG1wLCBcIm9yaWdpbmFsXCIgOiBvYmosIFwicGFyZW50XCIgOiBuZXdfcGFyLmlkLCBcInBvc2l0aW9uXCIgOiBwb3MsIFwib2xkX3BhcmVudFwiIDogb2xkX3BhciwgXCJpc19tdWx0aVwiIDogaXNfbXVsdGksICdvbGRfaW5zdGFuY2UnIDogb2xkX2lucywgJ25ld19pbnN0YW5jZScgOiB0aGlzIH0pO1xuXHRcdFx0cmV0dXJuIHRtcC5pZDtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIGN1dCBhIG5vZGUgKGEgbGF0ZXIgY2FsbCB0byBgcGFzdGUob2JqKWAgd291bGQgbW92ZSB0aGUgbm9kZSlcblx0XHQgKiBAbmFtZSBjdXQob2JqKVxuXHRcdCAqIEBwYXJhbSAge21peGVkfSBvYmogbXVsdGlwbGUgb2JqZWN0cyBjYW4gYmUgcGFzc2VkIHVzaW5nIGFuIGFycmF5XG5cdFx0ICogQHRyaWdnZXIgY3V0LmpzdHJlZVxuXHRcdCAqL1xuXHRcdGN1dCA6IGZ1bmN0aW9uIChvYmopIHtcblx0XHRcdGlmKCFvYmopIHsgb2JqID0gdGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkLmNvbmNhdCgpOyB9XG5cdFx0XHRpZighJC5pc0FycmF5KG9iaikpIHsgb2JqID0gW29ial07IH1cblx0XHRcdGlmKCFvYmoubGVuZ3RoKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0dmFyIHRtcCA9IFtdLCBvLCB0MSwgdDI7XG5cdFx0XHRmb3IodDEgPSAwLCB0MiA9IG9iai5sZW5ndGg7IHQxIDwgdDI7IHQxKyspIHtcblx0XHRcdFx0byA9IHRoaXMuZ2V0X25vZGUob2JqW3QxXSk7XG5cdFx0XHRcdGlmKG8gJiYgby5pZCAmJiBvLmlkICE9PSAnIycpIHsgdG1wLnB1c2gobyk7IH1cblx0XHRcdH1cblx0XHRcdGlmKCF0bXAubGVuZ3RoKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0Y2NwX25vZGUgPSB0bXA7XG5cdFx0XHRjY3BfaW5zdCA9IHRoaXM7XG5cdFx0XHRjY3BfbW9kZSA9ICdtb3ZlX25vZGUnO1xuXHRcdFx0LyoqXG5cdFx0XHQgKiB0cmlnZ2VyZWQgd2hlbiBub2RlcyBhcmUgYWRkZWQgdG8gdGhlIGJ1ZmZlciBmb3IgbW92aW5nXG5cdFx0XHQgKiBAZXZlbnRcblx0XHRcdCAqIEBuYW1lIGN1dC5qc3RyZWVcblx0XHRcdCAqIEBwYXJhbSB7QXJyYXl9IG5vZGVcblx0XHRcdCAqL1xuXHRcdFx0dGhpcy50cmlnZ2VyKCdjdXQnLCB7IFwibm9kZVwiIDogb2JqIH0pO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogY29weSBhIG5vZGUgKGEgbGF0ZXIgY2FsbCB0byBgcGFzdGUob2JqKWAgd291bGQgY29weSB0aGUgbm9kZSlcblx0XHQgKiBAbmFtZSBjb3B5KG9iailcblx0XHQgKiBAcGFyYW0gIHttaXhlZH0gb2JqIG11bHRpcGxlIG9iamVjdHMgY2FuIGJlIHBhc3NlZCB1c2luZyBhbiBhcnJheVxuXHRcdCAqIEB0cmlnZ2VyIGNvcHkuanN0cmVcblx0XHQgKi9cblx0XHRjb3B5IDogZnVuY3Rpb24gKG9iaikge1xuXHRcdFx0aWYoIW9iaikgeyBvYmogPSB0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQuY29uY2F0KCk7IH1cblx0XHRcdGlmKCEkLmlzQXJyYXkob2JqKSkgeyBvYmogPSBbb2JqXTsgfVxuXHRcdFx0aWYoIW9iai5sZW5ndGgpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHR2YXIgdG1wID0gW10sIG8sIHQxLCB0Mjtcblx0XHRcdGZvcih0MSA9IDAsIHQyID0gb2JqLmxlbmd0aDsgdDEgPCB0MjsgdDErKykge1xuXHRcdFx0XHRvID0gdGhpcy5nZXRfbm9kZShvYmpbdDFdKTtcblx0XHRcdFx0aWYobyAmJiBvLmlkICYmIG8uaWQgIT09ICcjJykgeyB0bXAucHVzaChvKTsgfVxuXHRcdFx0fVxuXHRcdFx0aWYoIXRtcC5sZW5ndGgpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRjY3Bfbm9kZSA9IHRtcDtcblx0XHRcdGNjcF9pbnN0ID0gdGhpcztcblx0XHRcdGNjcF9tb2RlID0gJ2NvcHlfbm9kZSc7XG5cdFx0XHQvKipcblx0XHRcdCAqIHRyaWdnZXJlZCB3aGVuIG5vZGVzIGFyZSBhZGRlZCB0byB0aGUgYnVmZmVyIGZvciBjb3B5aW5nXG5cdFx0XHQgKiBAZXZlbnRcblx0XHRcdCAqIEBuYW1lIGNvcHkuanN0cmVlXG5cdFx0XHQgKiBAcGFyYW0ge0FycmF5fSBub2RlXG5cdFx0XHQgKi9cblx0XHRcdHRoaXMudHJpZ2dlcignY29weScsIHsgXCJub2RlXCIgOiBvYmogfSk7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBnZXQgdGhlIGN1cnJlbnQgYnVmZmVyIChhbnkgbm9kZXMgdGhhdCBhcmUgd2FpdGluZyBmb3IgYSBwYXN0ZSBvcGVyYXRpb24pXG5cdFx0ICogQG5hbWUgZ2V0X2J1ZmZlcigpXG5cdFx0ICogQHJldHVybiB7T2JqZWN0fSBhbiBvYmplY3QgY29uc2lzdGluZyBvZiBgbW9kZWAgKFwiY29weV9ub2RlXCIgb3IgXCJtb3ZlX25vZGVcIiksIGBub2RlYCAoYW4gYXJyYXkgb2Ygb2JqZWN0cykgYW5kIGBpbnN0YCAodGhlIGluc3RhbmNlKVxuXHRcdCAqL1xuXHRcdGdldF9idWZmZXIgOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4geyAnbW9kZScgOiBjY3BfbW9kZSwgJ25vZGUnIDogY2NwX25vZGUsICdpbnN0JyA6IGNjcF9pbnN0IH07XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBjaGVjayBpZiB0aGVyZSBpcyBzb21ldGhpbmcgaW4gdGhlIGJ1ZmZlciB0byBwYXN0ZVxuXHRcdCAqIEBuYW1lIGNhbl9wYXN0ZSgpXG5cdFx0ICogQHJldHVybiB7Qm9vbGVhbn1cblx0XHQgKi9cblx0XHRjYW5fcGFzdGUgOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gY2NwX21vZGUgIT09IGZhbHNlICYmIGNjcF9ub2RlICE9PSBmYWxzZTsgLy8gJiYgY2NwX2luc3QuX21vZGVsLmRhdGFbY2NwX25vZGVdO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogY29weSBvciBtb3ZlIHRoZSBwcmV2aW91c2x5IGN1dCBvciBjb3BpZWQgbm9kZXMgdG8gYSBuZXcgcGFyZW50XG5cdFx0ICogQG5hbWUgcGFzdGUob2JqKVxuXHRcdCAqIEBwYXJhbSAge21peGVkfSBvYmogdGhlIG5ldyBwYXJlbnRcblx0XHQgKiBAdHJpZ2dlciBwYXN0ZS5qc3RyZWVcblx0XHQgKi9cblx0XHRwYXN0ZSA6IGZ1bmN0aW9uIChvYmopIHtcblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdGlmKCFvYmogfHwgIWNjcF9tb2RlIHx8ICFjY3BfbW9kZS5tYXRjaCgvXihjb3B5X25vZGV8bW92ZV9ub2RlKSQvKSB8fCAhY2NwX25vZGUpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRpZih0aGlzW2NjcF9tb2RlXShjY3Bfbm9kZSwgb2JqKSkge1xuXHRcdFx0XHQvKipcblx0XHRcdFx0ICogdHJpZ2dlcmVkIHdoZW4gcGFzdGUgaXMgaW52b2tlZFxuXHRcdFx0XHQgKiBAZXZlbnRcblx0XHRcdFx0ICogQG5hbWUgcGFzdGUuanN0cmVlXG5cdFx0XHRcdCAqIEBwYXJhbSB7U3RyaW5nfSBwYXJlbnQgdGhlIElEIG9mIHRoZSByZWNlaXZpbmcgbm9kZVxuXHRcdFx0XHQgKiBAcGFyYW0ge0FycmF5fSBub2RlIHRoZSBub2RlcyBpbiB0aGUgYnVmZmVyXG5cdFx0XHRcdCAqIEBwYXJhbSB7U3RyaW5nfSBtb2RlIHRoZSBwZXJmb3JtZWQgb3BlcmF0aW9uIC0gXCJjb3B5X25vZGVcIiBvciBcIm1vdmVfbm9kZVwiXG5cdFx0XHRcdCAqL1xuXHRcdFx0XHR0aGlzLnRyaWdnZXIoJ3Bhc3RlJywgeyBcInBhcmVudFwiIDogb2JqLmlkLCBcIm5vZGVcIiA6IGNjcF9ub2RlLCBcIm1vZGVcIiA6IGNjcF9tb2RlIH0pO1xuXHRcdFx0fVxuXHRcdFx0Y2NwX25vZGUgPSBmYWxzZTtcblx0XHRcdGNjcF9tb2RlID0gZmFsc2U7XG5cdFx0XHRjY3BfaW5zdCA9IGZhbHNlO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogcHV0IGEgbm9kZSBpbiBlZGl0IG1vZGUgKGlucHV0IGZpZWxkIHRvIHJlbmFtZSB0aGUgbm9kZSlcblx0XHQgKiBAbmFtZSBlZGl0KG9iaiBbLCBkZWZhdWx0X3RleHRdKVxuXHRcdCAqIEBwYXJhbSAge21peGVkfSBvYmpcblx0XHQgKiBAcGFyYW0gIHtTdHJpbmd9IGRlZmF1bHRfdGV4dCB0aGUgdGV4dCB0byBwb3B1bGF0ZSB0aGUgaW5wdXQgd2l0aCAoaWYgb21pdHRlZCB0aGUgbm9kZSB0ZXh0IHZhbHVlIGlzIHVzZWQpXG5cdFx0ICovXG5cdFx0ZWRpdCA6IGZ1bmN0aW9uIChvYmosIGRlZmF1bHRfdGV4dCkge1xuXHRcdFx0b2JqID0gdGhpcy5fb3Blbl90byhvYmopO1xuXHRcdFx0aWYoIW9iaiB8fCAhb2JqLmxlbmd0aCkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdHZhciBydGwgPSB0aGlzLl9kYXRhLmNvcmUucnRsLFxuXHRcdFx0XHR3ICA9IHRoaXMuZWxlbWVudC53aWR0aCgpLFxuXHRcdFx0XHRhICA9IG9iai5jaGlsZHJlbignLmpzdHJlZS1hbmNob3InKSxcblx0XHRcdFx0cyAgPSAkKCc8c3Bhbj4nKSxcblx0XHRcdFx0LyohXG5cdFx0XHRcdG9pID0gb2JqLmNoaWxkcmVuKFwiaTp2aXNpYmxlXCIpLFxuXHRcdFx0XHRhaSA9IGEuY2hpbGRyZW4oXCJpOnZpc2libGVcIiksXG5cdFx0XHRcdHcxID0gb2kud2lkdGgoKSAqIG9pLmxlbmd0aCxcblx0XHRcdFx0dzIgPSBhaS53aWR0aCgpICogYWkubGVuZ3RoLFxuXHRcdFx0XHQqL1xuXHRcdFx0XHR0ICA9IHR5cGVvZiBkZWZhdWx0X3RleHQgPT09ICdzdHJpbmcnID8gZGVmYXVsdF90ZXh0IDogdGhpcy5nZXRfdGV4dChvYmopLFxuXHRcdFx0XHRoMSA9ICQoXCI8XCIrXCJkaXYgLz5cIiwgeyBjc3MgOiB7IFwicG9zaXRpb25cIiA6IFwiYWJzb2x1dGVcIiwgXCJ0b3BcIiA6IFwiLTIwMHB4XCIsIFwibGVmdFwiIDogKHJ0bCA/IFwiMHB4XCIgOiBcIi0xMDAwcHhcIiksIFwidmlzaWJpbGl0eVwiIDogXCJoaWRkZW5cIiB9IH0pLmFwcGVuZFRvKFwiYm9keVwiKSxcblx0XHRcdFx0aDIgPSAkKFwiPFwiK1wiaW5wdXQgLz5cIiwge1xuXHRcdFx0XHRcdFx0XCJ2YWx1ZVwiIDogdCxcblx0XHRcdFx0XHRcdFwiY2xhc3NcIiA6IFwianN0cmVlLXJlbmFtZS1pbnB1dFwiLFxuXHRcdFx0XHRcdFx0Ly8gXCJzaXplXCIgOiB0Lmxlbmd0aCxcblx0XHRcdFx0XHRcdFwiY3NzXCIgOiB7XG5cdFx0XHRcdFx0XHRcdFwicGFkZGluZ1wiIDogXCIwXCIsXG5cdFx0XHRcdFx0XHRcdFwiYm9yZGVyXCIgOiBcIjFweCBzb2xpZCBzaWx2ZXJcIixcblx0XHRcdFx0XHRcdFx0XCJib3gtc2l6aW5nXCIgOiBcImJvcmRlci1ib3hcIixcblx0XHRcdFx0XHRcdFx0XCJkaXNwbGF5XCIgOiBcImlubGluZS1ibG9ja1wiLFxuXHRcdFx0XHRcdFx0XHRcImhlaWdodFwiIDogKHRoaXMuX2RhdGEuY29yZS5saV9oZWlnaHQpICsgXCJweFwiLFxuXHRcdFx0XHRcdFx0XHRcImxpbmVIZWlnaHRcIiA6ICh0aGlzLl9kYXRhLmNvcmUubGlfaGVpZ2h0KSArIFwicHhcIixcblx0XHRcdFx0XHRcdFx0XCJ3aWR0aFwiIDogXCIxNTBweFwiIC8vIHdpbGwgYmUgc2V0IGEgYml0IGZ1cnRoZXIgZG93blxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFwiYmx1clwiIDogJC5wcm94eShmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHRcdHZhciBpID0gcy5jaGlsZHJlbihcIi5qc3RyZWUtcmVuYW1lLWlucHV0XCIpLFxuXHRcdFx0XHRcdFx0XHRcdHYgPSBpLnZhbCgpO1xuXHRcdFx0XHRcdFx0XHRpZih2ID09PSBcIlwiKSB7IHYgPSB0OyB9XG5cdFx0XHRcdFx0XHRcdGgxLnJlbW92ZSgpO1xuXHRcdFx0XHRcdFx0XHRzLnJlcGxhY2VXaXRoKGEpO1xuXHRcdFx0XHRcdFx0XHRzLnJlbW92ZSgpO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnNldF90ZXh0KG9iaiwgdCk7XG5cdFx0XHRcdFx0XHRcdGlmKHRoaXMucmVuYW1lX25vZGUob2JqLCB2KSA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnNldF90ZXh0KG9iaiwgdCk7IC8vIG1vdmUgdGhpcyB1cD8gYW5kIGZpeCAjNDgzXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0sIHRoaXMpLFxuXHRcdFx0XHRcdFx0XCJrZXlkb3duXCIgOiBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHRcdFx0XHRcdFx0dmFyIGtleSA9IGV2ZW50LndoaWNoO1xuXHRcdFx0XHRcdFx0XHRpZihrZXkgPT09IDI3KSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy52YWx1ZSA9IHQ7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0aWYoa2V5ID09PSAyNyB8fCBrZXkgPT09IDEzIHx8IGtleSA9PT0gMzcgfHwga2V5ID09PSAzOCB8fCBrZXkgPT09IDM5IHx8IGtleSA9PT0gNDAgfHwga2V5ID09PSAzMikge1xuXHRcdFx0XHRcdFx0XHRcdGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGlmKGtleSA9PT0gMjcgfHwga2V5ID09PSAxMykge1xuXHRcdFx0XHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5ibHVyKCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcImNsaWNrXCIgOiBmdW5jdGlvbiAoZSkgeyBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpOyB9LFxuXHRcdFx0XHRcdFx0XCJtb3VzZWRvd25cIiA6IGZ1bmN0aW9uIChlKSB7IGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7IH0sXG5cdFx0XHRcdFx0XHRcImtleXVwXCIgOiBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHRcdFx0XHRcdFx0aDIud2lkdGgoTWF0aC5taW4oaDEudGV4dChcInBXXCIgKyB0aGlzLnZhbHVlKS53aWR0aCgpLHcpKTtcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcImtleXByZXNzXCIgOiBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRcdFx0XHRpZihldmVudC53aGljaCA9PT0gMTMpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdGZuID0ge1xuXHRcdFx0XHRcdFx0Zm9udEZhbWlseVx0XHQ6IGEuY3NzKCdmb250RmFtaWx5JylcdFx0fHwgJycsXG5cdFx0XHRcdFx0XHRmb250U2l6ZVx0XHQ6IGEuY3NzKCdmb250U2l6ZScpXHRcdFx0fHwgJycsXG5cdFx0XHRcdFx0XHRmb250V2VpZ2h0XHRcdDogYS5jc3MoJ2ZvbnRXZWlnaHQnKVx0XHR8fCAnJyxcblx0XHRcdFx0XHRcdGZvbnRTdHlsZVx0XHQ6IGEuY3NzKCdmb250U3R5bGUnKVx0XHR8fCAnJyxcblx0XHRcdFx0XHRcdGZvbnRTdHJldGNoXHRcdDogYS5jc3MoJ2ZvbnRTdHJldGNoJylcdFx0fHwgJycsXG5cdFx0XHRcdFx0XHRmb250VmFyaWFudFx0XHQ6IGEuY3NzKCdmb250VmFyaWFudCcpXHRcdHx8ICcnLFxuXHRcdFx0XHRcdFx0bGV0dGVyU3BhY2luZ1x0OiBhLmNzcygnbGV0dGVyU3BhY2luZycpXHR8fCAnJyxcblx0XHRcdFx0XHRcdHdvcmRTcGFjaW5nXHRcdDogYS5jc3MoJ3dvcmRTcGFjaW5nJylcdFx0fHwgJydcblx0XHRcdFx0fTtcblx0XHRcdHRoaXMuc2V0X3RleHQob2JqLCBcIlwiKTtcblx0XHRcdHMuYXR0cignY2xhc3MnLCBhLmF0dHIoJ2NsYXNzJykpLmFwcGVuZChhLmNvbnRlbnRzKCkuY2xvbmUoKSkuYXBwZW5kKGgyKTtcblx0XHRcdGEucmVwbGFjZVdpdGgocyk7XG5cdFx0XHRoMS5jc3MoZm4pO1xuXHRcdFx0aDIuY3NzKGZuKS53aWR0aChNYXRoLm1pbihoMS50ZXh0KFwicFdcIiArIGgyWzBdLnZhbHVlKS53aWR0aCgpLHcpKVswXS5zZWxlY3QoKTtcblx0XHR9LFxuXG5cblx0XHQvKipcblx0XHQgKiBjaGFuZ2VzIHRoZSB0aGVtZVxuXHRcdCAqIEBuYW1lIHNldF90aGVtZSh0aGVtZV9uYW1lIFssIHRoZW1lX3VybF0pXG5cdFx0ICogQHBhcmFtIHtTdHJpbmd9IHRoZW1lX25hbWUgdGhlIG5hbWUgb2YgdGhlIG5ldyB0aGVtZSB0byBhcHBseVxuXHRcdCAqIEBwYXJhbSB7bWl4ZWR9IHRoZW1lX3VybCAgdGhlIGxvY2F0aW9uIG9mIHRoZSBDU1MgZmlsZSBmb3IgdGhpcyB0aGVtZS4gT21pdCBvciBzZXQgdG8gYGZhbHNlYCBpZiB5b3UgbWFudWFsbHkgaW5jbHVkZWQgdGhlIGZpbGUuIFNldCB0byBgdHJ1ZWAgdG8gYXV0b2xvYWQgZnJvbSB0aGUgYGNvcmUudGhlbWVzLmRpcmAgZGlyZWN0b3J5LlxuXHRcdCAqIEB0cmlnZ2VyIHNldF90aGVtZS5qc3RyZWVcblx0XHQgKi9cblx0XHRzZXRfdGhlbWUgOiBmdW5jdGlvbiAodGhlbWVfbmFtZSwgdGhlbWVfdXJsKSB7XG5cdFx0XHRpZighdGhlbWVfbmFtZSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdGlmKHRoZW1lX3VybCA9PT0gdHJ1ZSkge1xuXHRcdFx0XHR2YXIgZGlyID0gdGhpcy5zZXR0aW5ncy5jb3JlLnRoZW1lcy5kaXI7XG5cdFx0XHRcdGlmKCFkaXIpIHsgZGlyID0gJC5qc3RyZWUucGF0aCArICcvdGhlbWVzJzsgfVxuXHRcdFx0XHR0aGVtZV91cmwgPSBkaXIgKyAnLycgKyB0aGVtZV9uYW1lICsgJy9zdHlsZS5jc3MnO1xuXHRcdFx0fVxuXHRcdFx0aWYodGhlbWVfdXJsICYmICQuaW5BcnJheSh0aGVtZV91cmwsIHRoZW1lc19sb2FkZWQpID09PSAtMSkge1xuXHRcdFx0XHQkKCdoZWFkJykuYXBwZW5kKCc8JysnbGluayByZWw9XCJzdHlsZXNoZWV0XCIgaHJlZj1cIicgKyB0aGVtZV91cmwgKyAnXCIgdHlwZT1cInRleHQvY3NzXCIgLz4nKTtcblx0XHRcdFx0dGhlbWVzX2xvYWRlZC5wdXNoKHRoZW1lX3VybCk7XG5cdFx0XHR9XG5cdFx0XHRpZih0aGlzLl9kYXRhLmNvcmUudGhlbWVzLm5hbWUpIHtcblx0XHRcdFx0dGhpcy5lbGVtZW50LnJlbW92ZUNsYXNzKCdqc3RyZWUtJyArIHRoaXMuX2RhdGEuY29yZS50aGVtZXMubmFtZSk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLl9kYXRhLmNvcmUudGhlbWVzLm5hbWUgPSB0aGVtZV9uYW1lO1xuXHRcdFx0dGhpcy5lbGVtZW50LmFkZENsYXNzKCdqc3RyZWUtJyArIHRoZW1lX25hbWUpO1xuXHRcdFx0dGhpcy5lbGVtZW50W3RoaXMuc2V0dGluZ3MuY29yZS50aGVtZXMucmVzcG9uc2l2ZSA/ICdhZGRDbGFzcycgOiAncmVtb3ZlQ2xhc3MnIF0oJ2pzdHJlZS0nICsgdGhlbWVfbmFtZSArICctcmVzcG9uc2l2ZScpO1xuXHRcdFx0LyoqXG5cdFx0XHQgKiB0cmlnZ2VyZWQgd2hlbiBhIHRoZW1lIGlzIHNldFxuXHRcdFx0ICogQGV2ZW50XG5cdFx0XHQgKiBAbmFtZSBzZXRfdGhlbWUuanN0cmVlXG5cdFx0XHQgKiBAcGFyYW0ge1N0cmluZ30gdGhlbWUgdGhlIG5ldyB0aGVtZVxuXHRcdFx0ICovXG5cdFx0XHR0aGlzLnRyaWdnZXIoJ3NldF90aGVtZScsIHsgJ3RoZW1lJyA6IHRoZW1lX25hbWUgfSk7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBnZXRzIHRoZSBuYW1lIG9mIHRoZSBjdXJyZW50bHkgYXBwbGllZCB0aGVtZSBuYW1lXG5cdFx0ICogQG5hbWUgZ2V0X3RoZW1lKClcblx0XHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdFx0ICovXG5cdFx0Z2V0X3RoZW1lIDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fZGF0YS5jb3JlLnRoZW1lcy5uYW1lOyB9LFxuXHRcdC8qKlxuXHRcdCAqIGNoYW5nZXMgdGhlIHRoZW1lIHZhcmlhbnQgKGlmIHRoZSB0aGVtZSBoYXMgdmFyaWFudHMpXG5cdFx0ICogQG5hbWUgc2V0X3RoZW1lX3ZhcmlhbnQodmFyaWFudF9uYW1lKVxuXHRcdCAqIEBwYXJhbSB7U3RyaW5nfEJvb2xlYW59IHZhcmlhbnRfbmFtZSB0aGUgdmFyaWFudCB0byBhcHBseSAoaWYgYGZhbHNlYCBpcyB1c2VkIHRoZSBjdXJyZW50IHZhcmlhbnQgaXMgcmVtb3ZlZClcblx0XHQgKi9cblx0XHRzZXRfdGhlbWVfdmFyaWFudCA6IGZ1bmN0aW9uICh2YXJpYW50X25hbWUpIHtcblx0XHRcdGlmKHRoaXMuX2RhdGEuY29yZS50aGVtZXMudmFyaWFudCkge1xuXHRcdFx0XHR0aGlzLmVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2pzdHJlZS0nICsgdGhpcy5fZGF0YS5jb3JlLnRoZW1lcy5uYW1lICsgJy0nICsgdGhpcy5fZGF0YS5jb3JlLnRoZW1lcy52YXJpYW50KTtcblx0XHRcdH1cblx0XHRcdHRoaXMuX2RhdGEuY29yZS50aGVtZXMudmFyaWFudCA9IHZhcmlhbnRfbmFtZTtcblx0XHRcdGlmKHZhcmlhbnRfbmFtZSkge1xuXHRcdFx0XHR0aGlzLmVsZW1lbnQuYWRkQ2xhc3MoJ2pzdHJlZS0nICsgdGhpcy5fZGF0YS5jb3JlLnRoZW1lcy5uYW1lICsgJy0nICsgdGhpcy5fZGF0YS5jb3JlLnRoZW1lcy52YXJpYW50KTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIGdldHMgdGhlIG5hbWUgb2YgdGhlIGN1cnJlbnRseSBhcHBsaWVkIHRoZW1lIHZhcmlhbnRcblx0XHQgKiBAbmFtZSBnZXRfdGhlbWUoKVxuXHRcdCAqIEByZXR1cm4ge1N0cmluZ31cblx0XHQgKi9cblx0XHRnZXRfdGhlbWVfdmFyaWFudCA6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX2RhdGEuY29yZS50aGVtZXMudmFyaWFudDsgfSxcblx0XHQvKipcblx0XHQgKiBzaG93cyBhIHN0cmlwZWQgYmFja2dyb3VuZCBvbiB0aGUgY29udGFpbmVyIChpZiB0aGUgdGhlbWUgc3VwcG9ydHMgaXQpXG5cdFx0ICogQG5hbWUgc2hvd19zdHJpcGVzKClcblx0XHQgKi9cblx0XHRzaG93X3N0cmlwZXMgOiBmdW5jdGlvbiAoKSB7IHRoaXMuX2RhdGEuY29yZS50aGVtZXMuc3RyaXBlcyA9IHRydWU7IHRoaXMuZ2V0X2NvbnRhaW5lcl91bCgpLmFkZENsYXNzKFwianN0cmVlLXN0cmlwZWRcIik7IH0sXG5cdFx0LyoqXG5cdFx0ICogaGlkZXMgdGhlIHN0cmlwZWQgYmFja2dyb3VuZCBvbiB0aGUgY29udGFpbmVyXG5cdFx0ICogQG5hbWUgaGlkZV9zdHJpcGVzKClcblx0XHQgKi9cblx0XHRoaWRlX3N0cmlwZXMgOiBmdW5jdGlvbiAoKSB7IHRoaXMuX2RhdGEuY29yZS50aGVtZXMuc3RyaXBlcyA9IGZhbHNlOyB0aGlzLmdldF9jb250YWluZXJfdWwoKS5yZW1vdmVDbGFzcyhcImpzdHJlZS1zdHJpcGVkXCIpOyB9LFxuXHRcdC8qKlxuXHRcdCAqIHRvZ2dsZXMgdGhlIHN0cmlwZWQgYmFja2dyb3VuZCBvbiB0aGUgY29udGFpbmVyXG5cdFx0ICogQG5hbWUgdG9nZ2xlX3N0cmlwZXMoKVxuXHRcdCAqL1xuXHRcdHRvZ2dsZV9zdHJpcGVzIDogZnVuY3Rpb24gKCkgeyBpZih0aGlzLl9kYXRhLmNvcmUudGhlbWVzLnN0cmlwZXMpIHsgdGhpcy5oaWRlX3N0cmlwZXMoKTsgfSBlbHNlIHsgdGhpcy5zaG93X3N0cmlwZXMoKTsgfSB9LFxuXHRcdC8qKlxuXHRcdCAqIHNob3dzIHRoZSBjb25uZWN0aW5nIGRvdHMgKGlmIHRoZSB0aGVtZSBzdXBwb3J0cyBpdClcblx0XHQgKiBAbmFtZSBzaG93X2RvdHMoKVxuXHRcdCAqL1xuXHRcdHNob3dfZG90cyA6IGZ1bmN0aW9uICgpIHsgdGhpcy5fZGF0YS5jb3JlLnRoZW1lcy5kb3RzID0gdHJ1ZTsgdGhpcy5nZXRfY29udGFpbmVyX3VsKCkucmVtb3ZlQ2xhc3MoXCJqc3RyZWUtbm8tZG90c1wiKTsgfSxcblx0XHQvKipcblx0XHQgKiBoaWRlcyB0aGUgY29ubmVjdGluZyBkb3RzXG5cdFx0ICogQG5hbWUgaGlkZV9kb3RzKClcblx0XHQgKi9cblx0XHRoaWRlX2RvdHMgOiBmdW5jdGlvbiAoKSB7IHRoaXMuX2RhdGEuY29yZS50aGVtZXMuZG90cyA9IGZhbHNlOyB0aGlzLmdldF9jb250YWluZXJfdWwoKS5hZGRDbGFzcyhcImpzdHJlZS1uby1kb3RzXCIpOyB9LFxuXHRcdC8qKlxuXHRcdCAqIHRvZ2dsZXMgdGhlIGNvbm5lY3RpbmcgZG90c1xuXHRcdCAqIEBuYW1lIHRvZ2dsZV9kb3RzKClcblx0XHQgKi9cblx0XHR0b2dnbGVfZG90cyA6IGZ1bmN0aW9uICgpIHsgaWYodGhpcy5fZGF0YS5jb3JlLnRoZW1lcy5kb3RzKSB7IHRoaXMuaGlkZV9kb3RzKCk7IH0gZWxzZSB7IHRoaXMuc2hvd19kb3RzKCk7IH0gfSxcblx0XHQvKipcblx0XHQgKiBzaG93IHRoZSBub2RlIGljb25zXG5cdFx0ICogQG5hbWUgc2hvd19pY29ucygpXG5cdFx0ICovXG5cdFx0c2hvd19pY29ucyA6IGZ1bmN0aW9uICgpIHsgdGhpcy5fZGF0YS5jb3JlLnRoZW1lcy5pY29ucyA9IHRydWU7IHRoaXMuZ2V0X2NvbnRhaW5lcl91bCgpLnJlbW92ZUNsYXNzKFwianN0cmVlLW5vLWljb25zXCIpOyB9LFxuXHRcdC8qKlxuXHRcdCAqIGhpZGUgdGhlIG5vZGUgaWNvbnNcblx0XHQgKiBAbmFtZSBoaWRlX2ljb25zKClcblx0XHQgKi9cblx0XHRoaWRlX2ljb25zIDogZnVuY3Rpb24gKCkgeyB0aGlzLl9kYXRhLmNvcmUudGhlbWVzLmljb25zID0gZmFsc2U7IHRoaXMuZ2V0X2NvbnRhaW5lcl91bCgpLmFkZENsYXNzKFwianN0cmVlLW5vLWljb25zXCIpOyB9LFxuXHRcdC8qKlxuXHRcdCAqIHRvZ2dsZSB0aGUgbm9kZSBpY29uc1xuXHRcdCAqIEBuYW1lIHRvZ2dsZV9pY29ucygpXG5cdFx0ICovXG5cdFx0dG9nZ2xlX2ljb25zIDogZnVuY3Rpb24gKCkgeyBpZih0aGlzLl9kYXRhLmNvcmUudGhlbWVzLmljb25zKSB7IHRoaXMuaGlkZV9pY29ucygpOyB9IGVsc2UgeyB0aGlzLnNob3dfaWNvbnMoKTsgfSB9LFxuXHRcdC8qKlxuXHRcdCAqIHNldCB0aGUgbm9kZSBpY29uIGZvciBhIG5vZGVcblx0XHQgKiBAbmFtZSBzZXRfaWNvbihvYmosIGljb24pXG5cdFx0ICogQHBhcmFtIHttaXhlZH0gb2JqXG5cdFx0ICogQHBhcmFtIHtTdHJpbmd9IGljb24gdGhlIG5ldyBpY29uIC0gY2FuIGJlIGEgcGF0aCB0byBhbiBpY29uIG9yIGEgY2xhc3NOYW1lLCBpZiB1c2luZyBhbiBpbWFnZSB0aGF0IGlzIGluIHRoZSBjdXJyZW50IGRpcmVjdG9yeSB1c2UgYSBgLi9gIHByZWZpeCwgb3RoZXJ3aXNlIGl0IHdpbGwgYmUgZGV0ZWN0ZWQgYXMgYSBjbGFzc1xuXHRcdCAqL1xuXHRcdHNldF9pY29uIDogZnVuY3Rpb24gKG9iaiwgaWNvbikge1xuXHRcdFx0dmFyIHQxLCB0MiwgZG9tLCBvbGQ7XG5cdFx0XHRpZigkLmlzQXJyYXkob2JqKSkge1xuXHRcdFx0XHRvYmogPSBvYmouc2xpY2UoKTtcblx0XHRcdFx0Zm9yKHQxID0gMCwgdDIgPSBvYmoubGVuZ3RoOyB0MSA8IHQyOyB0MSsrKSB7XG5cdFx0XHRcdFx0dGhpcy5zZXRfaWNvbihvYmpbdDFdLCBpY29uKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdGlmKCFvYmogfHwgb2JqLmlkID09PSAnIycpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRvbGQgPSBvYmouaWNvbjtcblx0XHRcdG9iai5pY29uID0gaWNvbjtcblx0XHRcdGRvbSA9IHRoaXMuZ2V0X25vZGUob2JqLCB0cnVlKS5jaGlsZHJlbihcIi5qc3RyZWUtYW5jaG9yXCIpLmNoaWxkcmVuKFwiLmpzdHJlZS10aGVtZWljb25cIik7XG5cdFx0XHRpZihpY29uID09PSBmYWxzZSkge1xuXHRcdFx0XHR0aGlzLmhpZGVfaWNvbihvYmopO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZihpY29uID09PSB0cnVlKSB7XG5cdFx0XHRcdGRvbS5yZW1vdmVDbGFzcygnanN0cmVlLXRoZW1laWNvbi1jdXN0b20gJyArIG9sZCkuY3NzKFwiYmFja2dyb3VuZFwiLFwiXCIpLnJlbW92ZUF0dHIoXCJyZWxcIik7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmKGljb24uaW5kZXhPZihcIi9cIikgPT09IC0xICYmIGljb24uaW5kZXhPZihcIi5cIikgPT09IC0xKSB7XG5cdFx0XHRcdGRvbS5yZW1vdmVDbGFzcyhvbGQpLmNzcyhcImJhY2tncm91bmRcIixcIlwiKTtcblx0XHRcdFx0ZG9tLmFkZENsYXNzKGljb24gKyAnIGpzdHJlZS10aGVtZWljb24tY3VzdG9tJykuYXR0cihcInJlbFwiLGljb24pO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGRvbS5yZW1vdmVDbGFzcyhvbGQpLmNzcyhcImJhY2tncm91bmRcIixcIlwiKTtcblx0XHRcdFx0ZG9tLmFkZENsYXNzKCdqc3RyZWUtdGhlbWVpY29uLWN1c3RvbScpLmNzcyhcImJhY2tncm91bmRcIiwgXCJ1cmwoJ1wiICsgaWNvbiArIFwiJykgY2VudGVyIGNlbnRlciBuby1yZXBlYXRcIikuYXR0cihcInJlbFwiLGljb24pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBnZXQgdGhlIG5vZGUgaWNvbiBmb3IgYSBub2RlXG5cdFx0ICogQG5hbWUgZ2V0X2ljb24ob2JqKVxuXHRcdCAqIEBwYXJhbSB7bWl4ZWR9IG9ialxuXHRcdCAqIEByZXR1cm4ge1N0cmluZ31cblx0XHQgKi9cblx0XHRnZXRfaWNvbiA6IGZ1bmN0aW9uIChvYmopIHtcblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdHJldHVybiAoIW9iaiB8fCBvYmouaWQgPT09ICcjJykgPyBmYWxzZSA6IG9iai5pY29uO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogaGlkZSB0aGUgaWNvbiBvbiBhbiBpbmRpdmlkdWFsIG5vZGVcblx0XHQgKiBAbmFtZSBoaWRlX2ljb24ob2JqKVxuXHRcdCAqIEBwYXJhbSB7bWl4ZWR9IG9ialxuXHRcdCAqL1xuXHRcdGhpZGVfaWNvbiA6IGZ1bmN0aW9uIChvYmopIHtcblx0XHRcdHZhciB0MSwgdDI7XG5cdFx0XHRpZigkLmlzQXJyYXkob2JqKSkge1xuXHRcdFx0XHRvYmogPSBvYmouc2xpY2UoKTtcblx0XHRcdFx0Zm9yKHQxID0gMCwgdDIgPSBvYmoubGVuZ3RoOyB0MSA8IHQyOyB0MSsrKSB7XG5cdFx0XHRcdFx0dGhpcy5oaWRlX2ljb24ob2JqW3QxXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0XHRvYmogPSB0aGlzLmdldF9ub2RlKG9iaik7XG5cdFx0XHRpZighb2JqIHx8IG9iaiA9PT0gJyMnKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0b2JqLmljb24gPSBmYWxzZTtcblx0XHRcdHRoaXMuZ2V0X25vZGUob2JqLCB0cnVlKS5jaGlsZHJlbihcImFcIikuY2hpbGRyZW4oXCIuanN0cmVlLXRoZW1laWNvblwiKS5hZGRDbGFzcygnanN0cmVlLXRoZW1laWNvbi1oaWRkZW4nKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogc2hvdyB0aGUgaWNvbiBvbiBhbiBpbmRpdmlkdWFsIG5vZGVcblx0XHQgKiBAbmFtZSBzaG93X2ljb24ob2JqKVxuXHRcdCAqIEBwYXJhbSB7bWl4ZWR9IG9ialxuXHRcdCAqL1xuXHRcdHNob3dfaWNvbiA6IGZ1bmN0aW9uIChvYmopIHtcblx0XHRcdHZhciB0MSwgdDIsIGRvbTtcblx0XHRcdGlmKCQuaXNBcnJheShvYmopKSB7XG5cdFx0XHRcdG9iaiA9IG9iai5zbGljZSgpO1xuXHRcdFx0XHRmb3IodDEgPSAwLCB0MiA9IG9iai5sZW5ndGg7IHQxIDwgdDI7IHQxKyspIHtcblx0XHRcdFx0XHR0aGlzLnNob3dfaWNvbihvYmpbdDFdKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdGlmKCFvYmogfHwgb2JqID09PSAnIycpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRkb20gPSB0aGlzLmdldF9ub2RlKG9iaiwgdHJ1ZSk7XG5cdFx0XHRvYmouaWNvbiA9IGRvbS5sZW5ndGggPyBkb20uY2hpbGRyZW4oXCJhXCIpLmNoaWxkcmVuKFwiLmpzdHJlZS10aGVtZWljb25cIikuYXR0cigncmVsJykgOiB0cnVlO1xuXHRcdFx0aWYoIW9iai5pY29uKSB7IG9iai5pY29uID0gdHJ1ZTsgfVxuXHRcdFx0ZG9tLmNoaWxkcmVuKFwiYVwiKS5jaGlsZHJlbihcIi5qc3RyZWUtdGhlbWVpY29uXCIpLnJlbW92ZUNsYXNzKCdqc3RyZWUtdGhlbWVpY29uLWhpZGRlbicpO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9O1xuXG5cdC8vIGhlbHBlcnNcblx0JC52YWthdGEgPSB7fTtcblx0Ly8gcmV2ZXJzZVxuXHQkLmZuLnZha2F0YV9yZXZlcnNlID0gW10ucmV2ZXJzZTtcblx0Ly8gY29sbGVjdCBhdHRyaWJ1dGVzXG5cdCQudmFrYXRhLmF0dHJpYnV0ZXMgPSBmdW5jdGlvbihub2RlLCB3aXRoX3ZhbHVlcykge1xuXHRcdG5vZGUgPSAkKG5vZGUpWzBdO1xuXHRcdHZhciBhdHRyID0gd2l0aF92YWx1ZXMgPyB7fSA6IFtdO1xuXHRcdGlmKG5vZGUgJiYgbm9kZS5hdHRyaWJ1dGVzKSB7XG5cdFx0XHQkLmVhY2gobm9kZS5hdHRyaWJ1dGVzLCBmdW5jdGlvbiAoaSwgdikge1xuXHRcdFx0XHRpZigkLmluQXJyYXkodi5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpLFsnc3R5bGUnLCdjb250ZW50ZWRpdGFibGUnLCdoYXNmb2N1cycsJ3RhYmluZGV4J10pICE9PSAtMSkgeyByZXR1cm47IH1cblx0XHRcdFx0aWYodi5ub2RlVmFsdWUgIT09IG51bGwgJiYgJC50cmltKHYubm9kZVZhbHVlKSAhPT0gJycpIHtcblx0XHRcdFx0XHRpZih3aXRoX3ZhbHVlcykgeyBhdHRyW3Yubm9kZU5hbWVdID0gdi5ub2RlVmFsdWU7IH1cblx0XHRcdFx0XHRlbHNlIHsgYXR0ci5wdXNoKHYubm9kZU5hbWUpOyB9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0XHRyZXR1cm4gYXR0cjtcblx0fTtcblx0JC52YWthdGEuYXJyYXlfdW5pcXVlID0gZnVuY3Rpb24oYXJyYXkpIHtcblx0XHR2YXIgYSA9IFtdLCBpLCBqLCBsO1xuXHRcdGZvcihpID0gMCwgbCA9IGFycmF5Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHRcdFx0Zm9yKGogPSAwOyBqIDw9IGk7IGorKykge1xuXHRcdFx0XHRpZihhcnJheVtpXSA9PT0gYXJyYXlbal0pIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYoaiA9PT0gaSkgeyBhLnB1c2goYXJyYXlbaV0pOyB9XG5cdFx0fVxuXHRcdHJldHVybiBhO1xuXHR9O1xuXHQvLyByZW1vdmUgaXRlbSBmcm9tIGFycmF5XG5cdCQudmFrYXRhLmFycmF5X3JlbW92ZSA9IGZ1bmN0aW9uKGFycmF5LCBmcm9tLCB0bykge1xuXHRcdHZhciByZXN0ID0gYXJyYXkuc2xpY2UoKHRvIHx8IGZyb20pICsgMSB8fCBhcnJheS5sZW5ndGgpO1xuXHRcdGFycmF5Lmxlbmd0aCA9IGZyb20gPCAwID8gYXJyYXkubGVuZ3RoICsgZnJvbSA6IGZyb207XG5cdFx0YXJyYXkucHVzaC5hcHBseShhcnJheSwgcmVzdCk7XG5cdFx0cmV0dXJuIGFycmF5O1xuXHR9O1xuXHQvLyByZW1vdmUgaXRlbSBmcm9tIGFycmF5XG5cdCQudmFrYXRhLmFycmF5X3JlbW92ZV9pdGVtID0gZnVuY3Rpb24oYXJyYXksIGl0ZW0pIHtcblx0XHR2YXIgdG1wID0gJC5pbkFycmF5KGl0ZW0sIGFycmF5KTtcblx0XHRyZXR1cm4gdG1wICE9PSAtMSA/ICQudmFrYXRhLmFycmF5X3JlbW92ZShhcnJheSwgdG1wKSA6IGFycmF5O1xuXHR9O1xuXHQvLyBicm93c2VyIHNuaWZmaW5nXG5cdChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGJyb3dzZXIgPSB7fSxcblx0XHRcdGJfbWF0Y2ggPSBmdW5jdGlvbih1YSkge1xuXHRcdFx0dWEgPSB1YS50b0xvd2VyQ2FzZSgpO1xuXG5cdFx0XHR2YXIgbWF0Y2ggPVx0LyhjaHJvbWUpWyBcXC9dKFtcXHcuXSspLy5leGVjKCB1YSApIHx8XG5cdFx0XHRcdFx0XHQvKHdlYmtpdClbIFxcL10oW1xcdy5dKykvLmV4ZWMoIHVhICkgfHxcblx0XHRcdFx0XHRcdC8ob3BlcmEpKD86Lip2ZXJzaW9ufClbIFxcL10oW1xcdy5dKykvLmV4ZWMoIHVhICkgfHxcblx0XHRcdFx0XHRcdC8obXNpZSkgKFtcXHcuXSspLy5leGVjKCB1YSApIHx8XG5cdFx0XHRcdFx0XHQodWEuaW5kZXhPZihcImNvbXBhdGlibGVcIikgPCAwICYmIC8obW96aWxsYSkoPzouKj8gcnY6KFtcXHcuXSspfCkvLmV4ZWMoIHVhICkpIHx8XG5cdFx0XHRcdFx0XHRbXTtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRicm93c2VyOiBtYXRjaFsxXSB8fCBcIlwiLFxuXHRcdFx0XHRcdHZlcnNpb246IG1hdGNoWzJdIHx8IFwiMFwiXG5cdFx0XHRcdH07XG5cdFx0XHR9LFxuXHRcdFx0bWF0Y2hlZCA9IGJfbWF0Y2god2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpO1xuXHRcdGlmKG1hdGNoZWQuYnJvd3Nlcikge1xuXHRcdFx0YnJvd3NlclsgbWF0Y2hlZC5icm93c2VyIF0gPSB0cnVlO1xuXHRcdFx0YnJvd3Nlci52ZXJzaW9uID0gbWF0Y2hlZC52ZXJzaW9uO1xuXHRcdH1cblx0XHRpZihicm93c2VyLmNocm9tZSkge1xuXHRcdFx0YnJvd3Nlci53ZWJraXQgPSB0cnVlO1xuXHRcdH1cblx0XHRlbHNlIGlmKGJyb3dzZXIud2Via2l0KSB7XG5cdFx0XHRicm93c2VyLnNhZmFyaSA9IHRydWU7XG5cdFx0fVxuXHRcdCQudmFrYXRhLmJyb3dzZXIgPSBicm93c2VyO1xuXHR9KCkpO1xuXHRpZigkLnZha2F0YS5icm93c2VyLm1zaWUgJiYgJC52YWthdGEuYnJvd3Nlci52ZXJzaW9uIDwgOCkge1xuXHRcdCQuanN0cmVlLmRlZmF1bHRzLmNvcmUuYW5pbWF0aW9uID0gMDtcblx0fVxuXG4vKipcbiAqICMjIyBDaGVja2JveCBwbHVnaW5cbiAqXG4gKiBUaGlzIHBsdWdpbiByZW5kZXJzIGNoZWNrYm94IGljb25zIGluIGZyb250IG9mIGVhY2ggbm9kZSwgbWFraW5nIG11bHRpcGxlIHNlbGVjdGlvbiBtdWNoIGVhc2llci4gXG4gKiBJdCBhbHNvIHN1cHBvcnRzIHRyaS1zdGF0ZSBiZWhhdmlvciwgbWVhbmluZyB0aGF0IGlmIGEgbm9kZSBoYXMgYSBmZXcgb2YgaXRzIGNoaWxkcmVuIGNoZWNrZWQgaXQgd2lsbCBiZSByZW5kZXJlZCBhcyB1bmRldGVybWluZWQsIGFuZCBzdGF0ZSB3aWxsIGJlIHByb3BhZ2F0ZWQgdXAuXG4gKi9cblxuXHR2YXIgX2kgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdJJyk7XG5cdF9pLmNsYXNzTmFtZSA9ICdqc3RyZWUtaWNvbiBqc3RyZWUtY2hlY2tib3gnO1xuXHQvKipcblx0ICogc3RvcmVzIGFsbCBkZWZhdWx0cyBmb3IgdGhlIGNoZWNrYm94IHBsdWdpblxuXHQgKiBAbmFtZSAkLmpzdHJlZS5kZWZhdWx0cy5jaGVja2JveFxuXHQgKiBAcGx1Z2luIGNoZWNrYm94XG5cdCAqL1xuXHQkLmpzdHJlZS5kZWZhdWx0cy5jaGVja2JveCA9IHtcblx0XHQvKipcblx0XHQgKiBhIGJvb2xlYW4gaW5kaWNhdGluZyBpZiBjaGVja2JveGVzIHNob3VsZCBiZSB2aXNpYmxlIChjYW4gYmUgY2hhbmdlZCBhdCBhIGxhdGVyIHRpbWUgdXNpbmcgYHNob3dfY2hlY2tib3hlcygpYCBhbmQgYGhpZGVfY2hlY2tib3hlc2ApLiBEZWZhdWx0cyB0byBgdHJ1ZWAuXG5cdFx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuY2hlY2tib3gudmlzaWJsZVxuXHRcdCAqIEBwbHVnaW4gY2hlY2tib3hcblx0XHQgKi9cblx0XHR2aXNpYmxlXHRcdFx0XHQ6IHRydWUsXG5cdFx0LyoqXG5cdFx0ICogYSBib29sZWFuIGluZGljYXRpbmcgaWYgY2hlY2tib3hlcyBzaG91bGQgY2FzY2FkZSBkb3duIGFuZCBoYXZlIGFuIHVuZGV0ZXJtaW5lZCBzdGF0ZS4gRGVmYXVsdHMgdG8gYHRydWVgLlxuXHRcdCAqIEBuYW1lICQuanN0cmVlLmRlZmF1bHRzLmNoZWNrYm94LnRocmVlX3N0YXRlXG5cdFx0ICogQHBsdWdpbiBjaGVja2JveFxuXHRcdCAqL1xuXHRcdHRocmVlX3N0YXRlXHRcdFx0OiB0cnVlLFxuXHRcdC8qKlxuXHRcdCAqIGEgYm9vbGVhbiBpbmRpY2F0aW5nIGlmIGNsaWNraW5nIGFueXdoZXJlIG9uIHRoZSBub2RlIHNob3VsZCBhY3QgYXMgY2xpY2tpbmcgb24gdGhlIGNoZWNrYm94LiBEZWZhdWx0cyB0byBgdHJ1ZWAuXG5cdFx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuY2hlY2tib3gud2hvbGVfbm9kZVxuXHRcdCAqIEBwbHVnaW4gY2hlY2tib3hcblx0XHQgKi9cblx0XHR3aG9sZV9ub2RlXHRcdFx0OiB0cnVlLFxuXHRcdC8qKlxuXHRcdCAqIGEgYm9vbGVhbiBpbmRpY2F0aW5nIGlmIHRoZSBzZWxlY3RlZCBzdHlsZSBvZiBhIG5vZGUgc2hvdWxkIGJlIGtlcHQsIG9yIHJlbW92ZWQuIERlZmF1bHRzIHRvIGB0cnVlYC5cblx0XHQgKiBAbmFtZSAkLmpzdHJlZS5kZWZhdWx0cy5jaGVja2JveC5rZWVwX3NlbGVjdGVkX3N0eWxlXG5cdFx0ICogQHBsdWdpbiBjaGVja2JveFxuXHRcdCAqL1xuXHRcdGtlZXBfc2VsZWN0ZWRfc3R5bGVcdDogdHJ1ZVxuXHR9O1xuXHQkLmpzdHJlZS5wbHVnaW5zLmNoZWNrYm94ID0gZnVuY3Rpb24gKG9wdGlvbnMsIHBhcmVudCkge1xuXHRcdHRoaXMuYmluZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHBhcmVudC5iaW5kLmNhbGwodGhpcyk7XG5cdFx0XHR0aGlzLl9kYXRhLmNoZWNrYm94LnV0byA9IGZhbHNlO1xuXHRcdFx0dGhpcy5lbGVtZW50XG5cdFx0XHRcdC5vbihcImluaXQuanN0cmVlXCIsICQucHJveHkoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0dGhpcy5fZGF0YS5jaGVja2JveC52aXNpYmxlID0gdGhpcy5zZXR0aW5ncy5jaGVja2JveC52aXNpYmxlO1xuXHRcdFx0XHRcdFx0aWYoIXRoaXMuc2V0dGluZ3MuY2hlY2tib3gua2VlcF9zZWxlY3RlZF9zdHlsZSkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQuYWRkQ2xhc3MoJ2pzdHJlZS1jaGVja2JveC1uby1jbGlja2VkJyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSwgdGhpcykpXG5cdFx0XHRcdC5vbihcImxvYWRpbmcuanN0cmVlXCIsICQucHJveHkoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0dGhpc1sgdGhpcy5fZGF0YS5jaGVja2JveC52aXNpYmxlID8gJ3Nob3dfY2hlY2tib3hlcycgOiAnaGlkZV9jaGVja2JveGVzJyBdKCk7XG5cdFx0XHRcdFx0fSwgdGhpcykpO1xuXHRcdFx0aWYodGhpcy5zZXR0aW5ncy5jaGVja2JveC50aHJlZV9zdGF0ZSkge1xuXHRcdFx0XHR0aGlzLmVsZW1lbnRcblx0XHRcdFx0XHQub24oJ2NoYW5nZWQuanN0cmVlIG1vdmVfbm9kZS5qc3RyZWUgY29weV9ub2RlLmpzdHJlZSByZWRyYXcuanN0cmVlIG9wZW5fbm9kZS5qc3RyZWUnLCAkLnByb3h5KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdFx0aWYodGhpcy5fZGF0YS5jaGVja2JveC51dG8pIHsgY2xlYXJUaW1lb3V0KHRoaXMuX2RhdGEuY2hlY2tib3gudXRvKTsgfVxuXHRcdFx0XHRcdFx0XHR0aGlzLl9kYXRhLmNoZWNrYm94LnV0byA9IHNldFRpbWVvdXQoJC5wcm94eSh0aGlzLl91bmRldGVybWluZWQsIHRoaXMpLCA1MCk7XG5cdFx0XHRcdFx0XHR9LCB0aGlzKSlcblx0XHRcdFx0XHQub24oJ21vZGVsLmpzdHJlZScsICQucHJveHkoZnVuY3Rpb24gKGUsIGRhdGEpIHtcblx0XHRcdFx0XHRcdFx0dmFyIG0gPSB0aGlzLl9tb2RlbC5kYXRhLFxuXHRcdFx0XHRcdFx0XHRcdHAgPSBtW2RhdGEucGFyZW50XSxcblx0XHRcdFx0XHRcdFx0XHRkcGMgPSBkYXRhLm5vZGVzLFxuXHRcdFx0XHRcdFx0XHRcdGNoZCA9IFtdLFxuXHRcdFx0XHRcdFx0XHRcdGMsIGksIGosIGssIGwsIHRtcDtcblxuXHRcdFx0XHRcdFx0XHQvLyBhcHBseSBkb3duXG5cdFx0XHRcdFx0XHRcdGlmKHAuc3RhdGUuc2VsZWN0ZWQpIHtcblx0XHRcdFx0XHRcdFx0XHRmb3IoaSA9IDAsIGogPSBkcGMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRtW2RwY1tpXV0uc3RhdGUuc2VsZWN0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQgPSB0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQuY29uY2F0KGRwYyk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0Zm9yKGkgPSAwLCBqID0gZHBjLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYobVtkcGNbaV1dLnN0YXRlLnNlbGVjdGVkKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGZvcihrID0gMCwgbCA9IG1bZHBjW2ldXS5jaGlsZHJlbl9kLmxlbmd0aDsgayA8IGw7IGsrKykge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG1bbVtkcGNbaV1dLmNoaWxkcmVuX2Rba11dLnN0YXRlLnNlbGVjdGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQgPSB0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQuY29uY2F0KG1bZHBjW2ldXS5jaGlsZHJlbl9kKTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHQvLyBhcHBseSB1cFxuXHRcdFx0XHRcdFx0XHRmb3IoaSA9IDAsIGogPSBwLmNoaWxkcmVuX2QubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYoIW1bcC5jaGlsZHJlbl9kW2ldXS5jaGlsZHJlbi5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGNoZC5wdXNoKG1bcC5jaGlsZHJlbl9kW2ldXS5wYXJlbnQpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRjaGQgPSAkLnZha2F0YS5hcnJheV91bmlxdWUoY2hkKTtcblx0XHRcdFx0XHRcdFx0Zm9yKGsgPSAwLCBsID0gY2hkLmxlbmd0aDsgayA8IGw7IGsrKykge1xuXHRcdFx0XHRcdFx0XHRcdHAgPSBtW2NoZFtrXV07XG5cdFx0XHRcdFx0XHRcdFx0d2hpbGUocCAmJiBwLmlkICE9PSAnIycpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGMgPSAwO1xuXHRcdFx0XHRcdFx0XHRcdFx0Zm9yKGkgPSAwLCBqID0gcC5jaGlsZHJlbi5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0YyArPSBtW3AuY2hpbGRyZW5baV1dLnN0YXRlLnNlbGVjdGVkO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0aWYoYyA9PT0gaikge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRwLnN0YXRlLnNlbGVjdGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkLnB1c2gocC5pZCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRtcCA9IHRoaXMuZ2V0X25vZGUocCwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmKHRtcCAmJiB0bXAubGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dG1wLmNoaWxkcmVuKCcuanN0cmVlLWFuY2hvcicpLmFkZENsYXNzKCdqc3RyZWUtY2xpY2tlZCcpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRwID0gdGhpcy5nZXRfbm9kZShwLnBhcmVudCk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZCA9ICQudmFrYXRhLmFycmF5X3VuaXF1ZSh0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQpO1xuXHRcdFx0XHRcdFx0fSwgdGhpcykpXG5cdFx0XHRcdFx0Lm9uKCdzZWxlY3Rfbm9kZS5qc3RyZWUnLCAkLnByb3h5KGZ1bmN0aW9uIChlLCBkYXRhKSB7XG5cdFx0XHRcdFx0XHRcdHZhciBvYmogPSBkYXRhLm5vZGUsXG5cdFx0XHRcdFx0XHRcdFx0bSA9IHRoaXMuX21vZGVsLmRhdGEsXG5cdFx0XHRcdFx0XHRcdFx0cGFyID0gdGhpcy5nZXRfbm9kZShvYmoucGFyZW50KSxcblx0XHRcdFx0XHRcdFx0XHRkb20gPSB0aGlzLmdldF9ub2RlKG9iaiwgdHJ1ZSksXG5cdFx0XHRcdFx0XHRcdFx0aSwgaiwgYywgdG1wO1xuXHRcdFx0XHRcdFx0XHR0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQgPSAkLnZha2F0YS5hcnJheV91bmlxdWUodGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkLmNvbmNhdChvYmouY2hpbGRyZW5fZCkpO1xuXHRcdFx0XHRcdFx0XHRmb3IoaSA9IDAsIGogPSBvYmouY2hpbGRyZW5fZC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0XHRcdFx0XHRtW29iai5jaGlsZHJlbl9kW2ldXS5zdGF0ZS5zZWxlY3RlZCA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0d2hpbGUocGFyICYmIHBhci5pZCAhPT0gJyMnKSB7XG5cdFx0XHRcdFx0XHRcdFx0YyA9IDA7XG5cdFx0XHRcdFx0XHRcdFx0Zm9yKGkgPSAwLCBqID0gcGFyLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRcdFx0XHRcdFx0YyArPSBtW3Bhci5jaGlsZHJlbltpXV0uc3RhdGUuc2VsZWN0ZWQ7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdGlmKGMgPT09IGopIHtcblx0XHRcdFx0XHRcdFx0XHRcdHBhci5zdGF0ZS5zZWxlY3RlZCA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQucHVzaChwYXIuaWQpO1xuXHRcdFx0XHRcdFx0XHRcdFx0dG1wID0gdGhpcy5nZXRfbm9kZShwYXIsIHRydWUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYodG1wICYmIHRtcC5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dG1wLmNoaWxkcmVuKCcuanN0cmVlLWFuY2hvcicpLmFkZENsYXNzKCdqc3RyZWUtY2xpY2tlZCcpO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRwYXIgPSB0aGlzLmdldF9ub2RlKHBhci5wYXJlbnQpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGlmKGRvbS5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdFx0XHRkb20uZmluZCgnLmpzdHJlZS1hbmNob3InKS5hZGRDbGFzcygnanN0cmVlLWNsaWNrZWQnKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSwgdGhpcykpXG5cdFx0XHRcdFx0Lm9uKCdkZXNlbGVjdF9ub2RlLmpzdHJlZScsICQucHJveHkoZnVuY3Rpb24gKGUsIGRhdGEpIHtcblx0XHRcdFx0XHRcdFx0dmFyIG9iaiA9IGRhdGEubm9kZSxcblx0XHRcdFx0XHRcdFx0XHRkb20gPSB0aGlzLmdldF9ub2RlKG9iaiwgdHJ1ZSksXG5cdFx0XHRcdFx0XHRcdFx0aSwgaiwgdG1wO1xuXHRcdFx0XHRcdFx0XHRmb3IoaSA9IDAsIGogPSBvYmouY2hpbGRyZW5fZC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLl9tb2RlbC5kYXRhW29iai5jaGlsZHJlbl9kW2ldXS5zdGF0ZS5zZWxlY3RlZCA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGZvcihpID0gMCwgaiA9IG9iai5wYXJlbnRzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuX21vZGVsLmRhdGFbb2JqLnBhcmVudHNbaV1dLnN0YXRlLnNlbGVjdGVkID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdFx0dG1wID0gdGhpcy5nZXRfbm9kZShvYmoucGFyZW50c1tpXSwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRcdFx0aWYodG1wICYmIHRtcC5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHRtcC5jaGlsZHJlbignLmpzdHJlZS1hbmNob3InKS5yZW1vdmVDbGFzcygnanN0cmVlLWNsaWNrZWQnKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0dG1wID0gW107XG5cdFx0XHRcdFx0XHRcdGZvcihpID0gMCwgaiA9IHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0XHRcdFx0XHRpZigkLmluQXJyYXkodGhpcy5fZGF0YS5jb3JlLnNlbGVjdGVkW2ldLCBvYmouY2hpbGRyZW5fZCkgPT09IC0xICYmICQuaW5BcnJheSh0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWRbaV0sIG9iai5wYXJlbnRzKSA9PT0gLTEpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHRtcC5wdXNoKHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZFtpXSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZCA9ICQudmFrYXRhLmFycmF5X3VuaXF1ZSh0bXApO1xuXHRcdFx0XHRcdFx0XHRpZihkb20ubGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRcdFx0ZG9tLmZpbmQoJy5qc3RyZWUtYW5jaG9yJykucmVtb3ZlQ2xhc3MoJ2pzdHJlZS1jbGlja2VkJyk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0sIHRoaXMpKVxuXHRcdFx0XHRcdC5vbignZGVsZXRlX25vZGUuanN0cmVlJywgJC5wcm94eShmdW5jdGlvbiAoZSwgZGF0YSkge1xuXHRcdFx0XHRcdFx0XHR2YXIgcCA9IHRoaXMuZ2V0X25vZGUoZGF0YS5wYXJlbnQpLFxuXHRcdFx0XHRcdFx0XHRcdG0gPSB0aGlzLl9tb2RlbC5kYXRhLFxuXHRcdFx0XHRcdFx0XHRcdGksIGosIGMsIHRtcDtcblx0XHRcdFx0XHRcdFx0d2hpbGUocCAmJiBwLmlkICE9PSAnIycpIHtcblx0XHRcdFx0XHRcdFx0XHRjID0gMDtcblx0XHRcdFx0XHRcdFx0XHRmb3IoaSA9IDAsIGogPSBwLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRcdFx0XHRcdFx0YyArPSBtW3AuY2hpbGRyZW5baV1dLnN0YXRlLnNlbGVjdGVkO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRpZihjID09PSBqKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRwLnN0YXRlLnNlbGVjdGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZC5wdXNoKHAuaWQpO1xuXHRcdFx0XHRcdFx0XHRcdFx0dG1wID0gdGhpcy5nZXRfbm9kZShwLCB0cnVlKTtcblx0XHRcdFx0XHRcdFx0XHRcdGlmKHRtcCAmJiB0bXAubGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRtcC5jaGlsZHJlbignLmpzdHJlZS1hbmNob3InKS5hZGRDbGFzcygnanN0cmVlLWNsaWNrZWQnKTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0cCA9IHRoaXMuZ2V0X25vZGUocC5wYXJlbnQpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9LCB0aGlzKSlcblx0XHRcdFx0XHQub24oJ21vdmVfbm9kZS5qc3RyZWUnLCAkLnByb3h5KGZ1bmN0aW9uIChlLCBkYXRhKSB7XG5cdFx0XHRcdFx0XHRcdHZhciBpc19tdWx0aSA9IGRhdGEuaXNfbXVsdGksXG5cdFx0XHRcdFx0XHRcdFx0b2xkX3BhciA9IGRhdGEub2xkX3BhcmVudCxcblx0XHRcdFx0XHRcdFx0XHRuZXdfcGFyID0gdGhpcy5nZXRfbm9kZShkYXRhLnBhcmVudCksXG5cdFx0XHRcdFx0XHRcdFx0bSA9IHRoaXMuX21vZGVsLmRhdGEsXG5cdFx0XHRcdFx0XHRcdFx0cCwgYywgaSwgaiwgdG1wO1xuXHRcdFx0XHRcdFx0XHRpZighaXNfbXVsdGkpIHtcblx0XHRcdFx0XHRcdFx0XHRwID0gdGhpcy5nZXRfbm9kZShvbGRfcGFyKTtcblx0XHRcdFx0XHRcdFx0XHR3aGlsZShwICYmIHAuaWQgIT09ICcjJykge1xuXHRcdFx0XHRcdFx0XHRcdFx0YyA9IDA7XG5cdFx0XHRcdFx0XHRcdFx0XHRmb3IoaSA9IDAsIGogPSBwLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRjICs9IG1bcC5jaGlsZHJlbltpXV0uc3RhdGUuc2VsZWN0ZWQ7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRpZihjID09PSBqKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHAuc3RhdGUuc2VsZWN0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQucHVzaChwLmlkKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dG1wID0gdGhpcy5nZXRfbm9kZShwLCB0cnVlKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYodG1wICYmIHRtcC5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0bXAuY2hpbGRyZW4oJy5qc3RyZWUtYW5jaG9yJykuYWRkQ2xhc3MoJ2pzdHJlZS1jbGlja2VkJyk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdHAgPSB0aGlzLmdldF9ub2RlKHAucGFyZW50KTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0cCA9IG5ld19wYXI7XG5cdFx0XHRcdFx0XHRcdHdoaWxlKHAgJiYgcC5pZCAhPT0gJyMnKSB7XG5cdFx0XHRcdFx0XHRcdFx0YyA9IDA7XG5cdFx0XHRcdFx0XHRcdFx0Zm9yKGkgPSAwLCBqID0gcC5jaGlsZHJlbi5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0XHRcdFx0XHRcdGMgKz0gbVtwLmNoaWxkcmVuW2ldXS5zdGF0ZS5zZWxlY3RlZDtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0aWYoYyA9PT0gaikge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYoIXAuc3RhdGUuc2VsZWN0ZWQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0cC5zdGF0ZS5zZWxlY3RlZCA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZC5wdXNoKHAuaWQpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0bXAgPSB0aGlzLmdldF9ub2RlKHAsIHRydWUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZih0bXAgJiYgdG1wLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRtcC5jaGlsZHJlbignLmpzdHJlZS1hbmNob3InKS5hZGRDbGFzcygnanN0cmVlLWNsaWNrZWQnKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdGlmKHAuc3RhdGUuc2VsZWN0ZWQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0cC5zdGF0ZS5zZWxlY3RlZCA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQgPSAkLnZha2F0YS5hcnJheV9yZW1vdmVfaXRlbSh0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQsIHAuaWQpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0bXAgPSB0aGlzLmdldF9ub2RlKHAsIHRydWUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZih0bXAgJiYgdG1wLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRtcC5jaGlsZHJlbignLmpzdHJlZS1hbmNob3InKS5yZW1vdmVDbGFzcygnanN0cmVlLWNsaWNrZWQnKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRwID0gdGhpcy5nZXRfbm9kZShwLnBhcmVudCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0sIHRoaXMpKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdC8qKlxuXHRcdCAqIHNldCB0aGUgdW5kZXRlcm1pbmVkIHN0YXRlIHdoZXJlIGFuZCBpZiBuZWNlc3NhcnkuIFVzZWQgaW50ZXJuYWxseS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqIEBuYW1lIF91bmRldGVybWluZWQoKVxuXHRcdCAqIEBwbHVnaW4gY2hlY2tib3hcblx0XHQgKi9cblx0XHR0aGlzLl91bmRldGVybWluZWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgaSwgaiwgbSA9IHRoaXMuX21vZGVsLmRhdGEsIHMgPSB0aGlzLl9kYXRhLmNvcmUuc2VsZWN0ZWQsIHAgPSBbXSwgdCA9IHRoaXM7XG5cdFx0XHRmb3IoaSA9IDAsIGogPSBzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRpZihtW3NbaV1dICYmIG1bc1tpXV0ucGFyZW50cykge1xuXHRcdFx0XHRcdHAgPSBwLmNvbmNhdChtW3NbaV1dLnBhcmVudHMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHQvLyBhdHRlbXB0IGZvciBzZXJ2ZXIgc2lkZSB1bmRldGVybWluZWQgc3RhdGVcblx0XHRcdHRoaXMuZWxlbWVudC5maW5kKCcuanN0cmVlLWNsb3NlZCcpLm5vdCgnOmhhcyh1bCknKVxuXHRcdFx0XHQuZWFjaChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0dmFyIHRtcCA9IHQuZ2V0X25vZGUodGhpcyk7XG5cdFx0XHRcdFx0aWYoIXRtcC5zdGF0ZS5sb2FkZWQgJiYgdG1wLm9yaWdpbmFsICYmIHRtcC5vcmlnaW5hbC5zdGF0ZSAmJiB0bXAub3JpZ2luYWwuc3RhdGUudW5kZXRlcm1pbmVkICYmIHRtcC5vcmlnaW5hbC5zdGF0ZS51bmRldGVybWluZWQgPT09IHRydWUpIHtcblx0XHRcdFx0XHRcdHAucHVzaCh0bXAuaWQpO1xuXHRcdFx0XHRcdFx0cCA9IHAuY29uY2F0KHRtcC5wYXJlbnRzKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0cCA9ICQudmFrYXRhLmFycmF5X3VuaXF1ZShwKTtcblx0XHRcdGkgPSAkLmluQXJyYXkoJyMnLCBwKTtcblx0XHRcdGlmKGkgIT09IC0xKSB7XG5cdFx0XHRcdHAgPSAkLnZha2F0YS5hcnJheV9yZW1vdmUocCwgaSk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuZWxlbWVudC5maW5kKCcuanN0cmVlLXVuZGV0ZXJtaW5lZCcpLnJlbW92ZUNsYXNzKCdqc3RyZWUtdW5kZXRlcm1pbmVkJyk7XG5cdFx0XHRmb3IoaSA9IDAsIGogPSBwLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRpZighbVtwW2ldXS5zdGF0ZS5zZWxlY3RlZCkge1xuXHRcdFx0XHRcdHMgPSB0aGlzLmdldF9ub2RlKHBbaV0sIHRydWUpO1xuXHRcdFx0XHRcdGlmKHMgJiYgcy5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdHMuY2hpbGRyZW4oJ2EnKS5jaGlsZHJlbignLmpzdHJlZS1jaGVja2JveCcpLmFkZENsYXNzKCdqc3RyZWUtdW5kZXRlcm1pbmVkJyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0XHR0aGlzLnJlZHJhd19ub2RlID0gZnVuY3Rpb24ob2JqLCBkZWVwLCBpc19jYWxsYmFjaykge1xuXHRcdFx0b2JqID0gcGFyZW50LnJlZHJhd19ub2RlLmNhbGwodGhpcywgb2JqLCBkZWVwLCBpc19jYWxsYmFjayk7XG5cdFx0XHRpZihvYmopIHtcblx0XHRcdFx0dmFyIHRtcCA9IG9iai5nZXRFbGVtZW50c0J5VGFnTmFtZSgnQScpWzBdO1xuXHRcdFx0XHR0bXAuaW5zZXJ0QmVmb3JlKF9pLmNsb25lTm9kZSgpLCB0bXAuY2hpbGROb2Rlc1swXSk7XG5cdFx0XHR9XG5cdFx0XHRpZighaXNfY2FsbGJhY2sgJiYgdGhpcy5zZXR0aW5ncy5jaGVja2JveC50aHJlZV9zdGF0ZSkge1xuXHRcdFx0XHRpZih0aGlzLl9kYXRhLmNoZWNrYm94LnV0bykgeyBjbGVhclRpbWVvdXQodGhpcy5fZGF0YS5jaGVja2JveC51dG8pOyB9XG5cdFx0XHRcdHRoaXMuX2RhdGEuY2hlY2tib3gudXRvID0gc2V0VGltZW91dCgkLnByb3h5KHRoaXMuX3VuZGV0ZXJtaW5lZCwgdGhpcyksIDUwKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBvYmo7XG5cdFx0fTtcblx0XHR0aGlzLmFjdGl2YXRlX25vZGUgPSBmdW5jdGlvbiAob2JqLCBlKSB7XG5cdFx0XHRpZih0aGlzLnNldHRpbmdzLmNoZWNrYm94Lndob2xlX25vZGUgfHwgJChlLnRhcmdldCkuaGFzQ2xhc3MoJ2pzdHJlZS1jaGVja2JveCcpKSB7XG5cdFx0XHRcdGUuY3RybEtleSA9IHRydWU7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcGFyZW50LmFjdGl2YXRlX25vZGUuY2FsbCh0aGlzLCBvYmosIGUpO1xuXHRcdH07XG5cdFx0LyoqXG5cdFx0ICogc2hvdyB0aGUgbm9kZSBjaGVja2JveCBpY29uc1xuXHRcdCAqIEBuYW1lIHNob3dfY2hlY2tib3hlcygpXG5cdFx0ICogQHBsdWdpbiBjaGVja2JveFxuXHRcdCAqL1xuXHRcdHRoaXMuc2hvd19jaGVja2JveGVzID0gZnVuY3Rpb24gKCkgeyB0aGlzLl9kYXRhLmNvcmUudGhlbWVzLmNoZWNrYm94ZXMgPSB0cnVlOyB0aGlzLmVsZW1lbnQuY2hpbGRyZW4oXCJ1bFwiKS5yZW1vdmVDbGFzcyhcImpzdHJlZS1uby1jaGVja2JveGVzXCIpOyB9O1xuXHRcdC8qKlxuXHRcdCAqIGhpZGUgdGhlIG5vZGUgY2hlY2tib3ggaWNvbnNcblx0XHQgKiBAbmFtZSBoaWRlX2NoZWNrYm94ZXMoKVxuXHRcdCAqIEBwbHVnaW4gY2hlY2tib3hcblx0XHQgKi9cblx0XHR0aGlzLmhpZGVfY2hlY2tib3hlcyA9IGZ1bmN0aW9uICgpIHsgdGhpcy5fZGF0YS5jb3JlLnRoZW1lcy5jaGVja2JveGVzID0gZmFsc2U7IHRoaXMuZWxlbWVudC5jaGlsZHJlbihcInVsXCIpLmFkZENsYXNzKFwianN0cmVlLW5vLWNoZWNrYm94ZXNcIik7IH07XG5cdFx0LyoqXG5cdFx0ICogdG9nZ2xlIHRoZSBub2RlIGljb25zXG5cdFx0ICogQG5hbWUgdG9nZ2xlX2NoZWNrYm94ZXMoKVxuXHRcdCAqIEBwbHVnaW4gY2hlY2tib3hcblx0XHQgKi9cblx0XHR0aGlzLnRvZ2dsZV9jaGVja2JveGVzID0gZnVuY3Rpb24gKCkgeyBpZih0aGlzLl9kYXRhLmNvcmUudGhlbWVzLmNoZWNrYm94ZXMpIHsgdGhpcy5oaWRlX2NoZWNrYm94ZXMoKTsgfSBlbHNlIHsgdGhpcy5zaG93X2NoZWNrYm94ZXMoKTsgfSB9O1xuXHR9O1xuXG5cdC8vIGluY2x1ZGUgdGhlIGNoZWNrYm94IHBsdWdpbiBieSBkZWZhdWx0XG5cdC8vICQuanN0cmVlLmRlZmF1bHRzLnBsdWdpbnMucHVzaChcImNoZWNrYm94XCIpO1xuXG4vKipcbiAqICMjIyBDb250ZXh0bWVudSBwbHVnaW5cbiAqXG4gKiBTaG93cyBhIGNvbnRleHQgbWVudSB3aGVuIGEgbm9kZSBpcyByaWdodC1jbGlja2VkLlxuICovXG4vLyBUT0RPOiBtb3ZlIGxvZ2ljIG91dHNpZGUgb2YgZnVuY3Rpb24gKyBjaGVjayBtdWx0aXBsZSBtb3ZlXG5cblx0LyoqXG5cdCAqIHN0b3JlcyBhbGwgZGVmYXVsdHMgZm9yIHRoZSBjb250ZXh0bWVudSBwbHVnaW5cblx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuY29udGV4dG1lbnVcblx0ICogQHBsdWdpbiBjb250ZXh0bWVudVxuXHQgKi9cblx0JC5qc3RyZWUuZGVmYXVsdHMuY29udGV4dG1lbnUgPSB7XG5cdFx0LyoqXG5cdFx0ICogYSBib29sZWFuIGluZGljYXRpbmcgaWYgdGhlIG5vZGUgc2hvdWxkIGJlIHNlbGVjdGVkIHdoZW4gdGhlIGNvbnRleHQgbWVudSBpcyBpbnZva2VkIG9uIGl0LiBEZWZhdWx0cyB0byBgdHJ1ZWAuXG5cdFx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuY29udGV4dG1lbnUuc2VsZWN0X25vZGVcblx0XHQgKiBAcGx1Z2luIGNvbnRleHRtZW51XG5cdFx0ICovXG5cdFx0c2VsZWN0X25vZGUgOiB0cnVlLFxuXHRcdC8qKlxuXHRcdCAqIGEgYm9vbGVhbiBpbmRpY2F0aW5nIGlmIHRoZSBtZW51IHNob3VsZCBiZSBzaG93biBhbGlnbmVkIHdpdGggdGhlIG5vZGUuIERlZmF1bHRzIHRvIGB0cnVlYCwgb3RoZXJ3aXNlIHRoZSBtb3VzZSBjb29yZGluYXRlcyBhcmUgdXNlZC5cblx0XHQgKiBAbmFtZSAkLmpzdHJlZS5kZWZhdWx0cy5jb250ZXh0bWVudS5zaG93X2F0X25vZGVcblx0XHQgKiBAcGx1Z2luIGNvbnRleHRtZW51XG5cdFx0ICovXG5cdFx0c2hvd19hdF9ub2RlIDogdHJ1ZSxcblx0XHQvKipcblx0XHQgKiBhbiBvYmplY3Qgb2YgYWN0aW9ucywgb3IgYSBmdW5jdGlvbiB0aGF0IGFjY2VwdHMgYSBub2RlIGFuZCBhIGNhbGxiYWNrIGZ1bmN0aW9uIGFuZCBjYWxscyB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gd2l0aCBhbiBvYmplY3Qgb2YgYWN0aW9ucyBhdmFpbGFibGUgZm9yIHRoYXQgbm9kZSAoeW91IGNhbiBhbHNvIHJldHVybiB0aGUgaXRlbXMgdG9vKS5cblx0XHQgKiBcblx0XHQgKiBFYWNoIGFjdGlvbiBjb25zaXN0cyBvZiBhIGtleSAoYSB1bmlxdWUgbmFtZSkgYW5kIGEgdmFsdWUgd2hpY2ggaXMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzIChvbmx5IGxhYmVsIGFuZCBhY3Rpb24gYXJlIHJlcXVpcmVkKTpcblx0XHQgKiBcblx0XHQgKiAqIGBzZXBhcmF0b3JfYmVmb3JlYCAtIGEgYm9vbGVhbiBpbmRpY2F0aW5nIGlmIHRoZXJlIHNob3VsZCBiZSBhIHNlcGFyYXRvciBiZWZvcmUgdGhpcyBpdGVtXG5cdFx0ICogKiBgc2VwYXJhdG9yX2FmdGVyYCAtIGEgYm9vbGVhbiBpbmRpY2F0aW5nIGlmIHRoZXJlIHNob3VsZCBiZSBhIHNlcGFyYXRvciBhZnRlciB0aGlzIGl0ZW1cblx0XHQgKiAqIGBfZGlzYWJsZWRgIC0gYSBib29sZWFuIGluZGljYXRpbmcgaWYgdGhpcyBhY3Rpb24gc2hvdWxkIGJlIGRpc2FibGVkXG5cdFx0ICogKiBgbGFiZWxgIC0gYSBzdHJpbmcgLSB0aGUgbmFtZSBvZiB0aGUgYWN0aW9uXG5cdFx0ICogKiBgYWN0aW9uYCAtIGEgZnVuY3Rpb24gdG8gYmUgZXhlY3V0ZWQgaWYgdGhpcyBpdGVtIGlzIGNob3NlblxuXHRcdCAqICogYGljb25gIC0gYSBzdHJpbmcsIGNhbiBiZSBhIHBhdGggdG8gYW4gaWNvbiBvciBhIGNsYXNzTmFtZSwgaWYgdXNpbmcgYW4gaW1hZ2UgdGhhdCBpcyBpbiB0aGUgY3VycmVudCBkaXJlY3RvcnkgdXNlIGEgYC4vYCBwcmVmaXgsIG90aGVyd2lzZSBpdCB3aWxsIGJlIGRldGVjdGVkIGFzIGEgY2xhc3Ncblx0XHQgKiAqIGBzaG9ydGN1dGAgLSBrZXlDb2RlIHdoaWNoIHdpbGwgdHJpZ2dlciB0aGUgYWN0aW9uIGlmIHRoZSBtZW51IGlzIG9wZW4gKGZvciBleGFtcGxlIGAxMTNgIGZvciByZW5hbWUsIHdoaWNoIGVxdWFscyBGMilcblx0XHQgKiAqIGBzaG9ydGN1dF9sYWJlbGAgLSBzaG9ydGN1dCBsYWJlbCAobGlrZSBmb3IgZXhhbXBsZSBgRjJgIGZvciByZW5hbWUpXG5cdFx0ICogXG5cdFx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuY29udGV4dG1lbnUuaXRlbXNcblx0XHQgKiBAcGx1Z2luIGNvbnRleHRtZW51XG5cdFx0ICovXG5cdFx0aXRlbXMgOiBmdW5jdGlvbiAobywgY2IpIHsgLy8gQ291bGQgYmUgYW4gb2JqZWN0IGRpcmVjdGx5XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcImNyZWF0ZVwiIDoge1xuXHRcdFx0XHRcdFwic2VwYXJhdG9yX2JlZm9yZVwiXHQ6IGZhbHNlLFxuXHRcdFx0XHRcdFwic2VwYXJhdG9yX2FmdGVyXCJcdDogdHJ1ZSxcblx0XHRcdFx0XHRcIl9kaXNhYmxlZFwiXHRcdFx0OiBmYWxzZSwgLy8odGhpcy5jaGVjayhcImNyZWF0ZV9ub2RlXCIsIGRhdGEucmVmZXJlbmNlLCB7fSwgXCJsYXN0XCIpKSxcblx0XHRcdFx0XHRcImxhYmVsXCJcdFx0XHRcdDogXCJDcmVhdGVcIixcblx0XHRcdFx0XHRcImFjdGlvblwiXHRcdFx0OiBmdW5jdGlvbiAoZGF0YSkge1xuXHRcdFx0XHRcdFx0dmFyIGluc3QgPSAkLmpzdHJlZS5yZWZlcmVuY2UoZGF0YS5yZWZlcmVuY2UpLFxuXHRcdFx0XHRcdFx0XHRvYmogPSBpbnN0LmdldF9ub2RlKGRhdGEucmVmZXJlbmNlKTtcblx0XHRcdFx0XHRcdGluc3QuY3JlYXRlX25vZGUob2JqLCB7fSwgXCJsYXN0XCIsIGZ1bmN0aW9uIChuZXdfbm9kZSkge1xuXHRcdFx0XHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgaW5zdC5lZGl0KG5ld19ub2RlKTsgfSwwKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0XCJyZW5hbWVcIiA6IHtcblx0XHRcdFx0XHRcInNlcGFyYXRvcl9iZWZvcmVcIlx0OiBmYWxzZSxcblx0XHRcdFx0XHRcInNlcGFyYXRvcl9hZnRlclwiXHQ6IGZhbHNlLFxuXHRcdFx0XHRcdFwiX2Rpc2FibGVkXCJcdFx0XHQ6IGZhbHNlLCAvLyh0aGlzLmNoZWNrKFwicmVuYW1lX25vZGVcIiwgZGF0YS5yZWZlcmVuY2UsIHRoaXMuZ2V0X3BhcmVudChkYXRhLnJlZmVyZW5jZSksIFwiXCIpKSxcblx0XHRcdFx0XHRcImxhYmVsXCJcdFx0XHRcdDogXCJSZW5hbWVcIixcblx0XHRcdFx0XHQvKlxuXHRcdFx0XHRcdFwic2hvcnRjdXRcIlx0XHRcdDogMTEzLFxuXHRcdFx0XHRcdFwic2hvcnRjdXRfbGFiZWxcIlx0OiAnRjInLFxuXHRcdFx0XHRcdFwiaWNvblwiXHRcdFx0XHQ6IFwiZ2x5cGhpY29uIGdseXBoaWNvbi1sZWFmXCIsXG5cdFx0XHRcdFx0Ki9cblx0XHRcdFx0XHRcImFjdGlvblwiXHRcdFx0OiBmdW5jdGlvbiAoZGF0YSkge1xuXHRcdFx0XHRcdFx0dmFyIGluc3QgPSAkLmpzdHJlZS5yZWZlcmVuY2UoZGF0YS5yZWZlcmVuY2UpLFxuXHRcdFx0XHRcdFx0XHRvYmogPSBpbnN0LmdldF9ub2RlKGRhdGEucmVmZXJlbmNlKTtcblx0XHRcdFx0XHRcdGluc3QuZWRpdChvYmopO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0XCJyZW1vdmVcIiA6IHtcblx0XHRcdFx0XHRcInNlcGFyYXRvcl9iZWZvcmVcIlx0OiBmYWxzZSxcblx0XHRcdFx0XHRcImljb25cIlx0XHRcdFx0OiBmYWxzZSxcblx0XHRcdFx0XHRcInNlcGFyYXRvcl9hZnRlclwiXHQ6IGZhbHNlLFxuXHRcdFx0XHRcdFwiX2Rpc2FibGVkXCJcdFx0XHQ6IGZhbHNlLCAvLyh0aGlzLmNoZWNrKFwiZGVsZXRlX25vZGVcIiwgZGF0YS5yZWZlcmVuY2UsIHRoaXMuZ2V0X3BhcmVudChkYXRhLnJlZmVyZW5jZSksIFwiXCIpKSxcblx0XHRcdFx0XHRcImxhYmVsXCJcdFx0XHRcdDogXCJEZWxldGVcIixcblx0XHRcdFx0XHRcImFjdGlvblwiXHRcdFx0OiBmdW5jdGlvbiAoZGF0YSkge1xuXHRcdFx0XHRcdFx0dmFyIGluc3QgPSAkLmpzdHJlZS5yZWZlcmVuY2UoZGF0YS5yZWZlcmVuY2UpLFxuXHRcdFx0XHRcdFx0XHRvYmogPSBpbnN0LmdldF9ub2RlKGRhdGEucmVmZXJlbmNlKTtcblx0XHRcdFx0XHRcdGlmKGluc3QuaXNfc2VsZWN0ZWQob2JqKSkge1xuXHRcdFx0XHRcdFx0XHRpbnN0LmRlbGV0ZV9ub2RlKGluc3QuZ2V0X3NlbGVjdGVkKCkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGluc3QuZGVsZXRlX25vZGUob2JqKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwiY2NwXCIgOiB7XG5cdFx0XHRcdFx0XCJzZXBhcmF0b3JfYmVmb3JlXCJcdDogdHJ1ZSxcblx0XHRcdFx0XHRcImljb25cIlx0XHRcdFx0OiBmYWxzZSxcblx0XHRcdFx0XHRcInNlcGFyYXRvcl9hZnRlclwiXHQ6IGZhbHNlLFxuXHRcdFx0XHRcdFwibGFiZWxcIlx0XHRcdFx0OiBcIkVkaXRcIixcblx0XHRcdFx0XHRcImFjdGlvblwiXHRcdFx0OiBmYWxzZSxcblx0XHRcdFx0XHRcInN1Ym1lbnVcIiA6IHtcblx0XHRcdFx0XHRcdFwiY3V0XCIgOiB7XG5cdFx0XHRcdFx0XHRcdFwic2VwYXJhdG9yX2JlZm9yZVwiXHQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcInNlcGFyYXRvcl9hZnRlclwiXHQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcImxhYmVsXCJcdFx0XHRcdDogXCJDdXRcIixcblx0XHRcdFx0XHRcdFx0XCJhY3Rpb25cIlx0XHRcdDogZnVuY3Rpb24gKGRhdGEpIHtcblx0XHRcdFx0XHRcdFx0XHR2YXIgaW5zdCA9ICQuanN0cmVlLnJlZmVyZW5jZShkYXRhLnJlZmVyZW5jZSksXG5cdFx0XHRcdFx0XHRcdFx0XHRvYmogPSBpbnN0LmdldF9ub2RlKGRhdGEucmVmZXJlbmNlKTtcblx0XHRcdFx0XHRcdFx0XHRpZihpbnN0LmlzX3NlbGVjdGVkKG9iaikpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGluc3QuY3V0KGluc3QuZ2V0X3NlbGVjdGVkKCkpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdGluc3QuY3V0KG9iaik7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XCJjb3B5XCIgOiB7XG5cdFx0XHRcdFx0XHRcdFwic2VwYXJhdG9yX2JlZm9yZVwiXHQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcImljb25cIlx0XHRcdFx0OiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XCJzZXBhcmF0b3JfYWZ0ZXJcIlx0OiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XCJsYWJlbFwiXHRcdFx0XHQ6IFwiQ29weVwiLFxuXHRcdFx0XHRcdFx0XHRcImFjdGlvblwiXHRcdFx0OiBmdW5jdGlvbiAoZGF0YSkge1xuXHRcdFx0XHRcdFx0XHRcdHZhciBpbnN0ID0gJC5qc3RyZWUucmVmZXJlbmNlKGRhdGEucmVmZXJlbmNlKSxcblx0XHRcdFx0XHRcdFx0XHRcdG9iaiA9IGluc3QuZ2V0X25vZGUoZGF0YS5yZWZlcmVuY2UpO1xuXHRcdFx0XHRcdFx0XHRcdGlmKGluc3QuaXNfc2VsZWN0ZWQob2JqKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0aW5zdC5jb3B5KGluc3QuZ2V0X3NlbGVjdGVkKCkpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdGluc3QuY29weShvYmopO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFwicGFzdGVcIiA6IHtcblx0XHRcdFx0XHRcdFx0XCJzZXBhcmF0b3JfYmVmb3JlXCJcdDogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFwiaWNvblwiXHRcdFx0XHQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcIl9kaXNhYmxlZFwiXHRcdFx0OiBmdW5jdGlvbiAoZGF0YSkge1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybiAhJC5qc3RyZWUucmVmZXJlbmNlKGRhdGEucmVmZXJlbmNlKS5jYW5fcGFzdGUoKTtcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XCJzZXBhcmF0b3JfYWZ0ZXJcIlx0OiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XCJsYWJlbFwiXHRcdFx0XHQ6IFwiUGFzdGVcIixcblx0XHRcdFx0XHRcdFx0XCJhY3Rpb25cIlx0XHRcdDogZnVuY3Rpb24gKGRhdGEpIHtcblx0XHRcdFx0XHRcdFx0XHR2YXIgaW5zdCA9ICQuanN0cmVlLnJlZmVyZW5jZShkYXRhLnJlZmVyZW5jZSksXG5cdFx0XHRcdFx0XHRcdFx0XHRvYmogPSBpbnN0LmdldF9ub2RlKGRhdGEucmVmZXJlbmNlKTtcblx0XHRcdFx0XHRcdFx0XHRpbnN0LnBhc3RlKG9iaik7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXHR9O1xuXG5cdCQuanN0cmVlLnBsdWdpbnMuY29udGV4dG1lbnUgPSBmdW5jdGlvbiAob3B0aW9ucywgcGFyZW50KSB7XG5cdFx0dGhpcy5iaW5kID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cGFyZW50LmJpbmQuY2FsbCh0aGlzKTtcblxuXHRcdFx0dGhpcy5lbGVtZW50XG5cdFx0XHRcdC5vbihcImNvbnRleHRtZW51LmpzdHJlZVwiLCBcIi5qc3RyZWUtYW5jaG9yXCIsICQucHJveHkoZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRcdGlmKCF0aGlzLmlzX2xvYWRpbmcoZS5jdXJyZW50VGFyZ2V0KSkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnNob3dfY29udGV4dG1lbnUoZS5jdXJyZW50VGFyZ2V0LCBlLnBhZ2VYLCBlLnBhZ2VZLCBlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LCB0aGlzKSlcblx0XHRcdFx0Lm9uKFwiY2xpY2suanN0cmVlXCIsIFwiLmpzdHJlZS1hbmNob3JcIiwgJC5wcm94eShmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdFx0aWYodGhpcy5fZGF0YS5jb250ZXh0bWVudS52aXNpYmxlKSB7XG5cdFx0XHRcdFx0XHRcdCQudmFrYXRhLmNvbnRleHQuaGlkZSgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sIHRoaXMpKTtcblx0XHRcdC8qXG5cdFx0XHRpZighKCdvbmNvbnRleHRtZW51JyBpbiBkb2N1bWVudC5ib2R5KSAmJiAoJ29udG91Y2hzdGFydCcgaW4gZG9jdW1lbnQuYm9keSkpIHtcblx0XHRcdFx0dmFyIGVsID0gbnVsbCwgdG0gPSBudWxsO1xuXHRcdFx0XHR0aGlzLmVsZW1lbnRcblx0XHRcdFx0XHQub24oXCJ0b3VjaHN0YXJ0XCIsIFwiLmpzdHJlZS1hbmNob3JcIiwgZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0XHRcdGVsID0gZS5jdXJyZW50VGFyZ2V0O1xuXHRcdFx0XHRcdFx0dG0gPSArbmV3IERhdGUoKTtcblx0XHRcdFx0XHRcdCQoZG9jdW1lbnQpLm9uZShcInRvdWNoZW5kXCIsIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdFx0XHRcdGUudGFyZ2V0ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChlLm9yaWdpbmFsRXZlbnQudGFyZ2V0VG91Y2hlc1swXS5wYWdlWCAtIHdpbmRvdy5wYWdlWE9mZnNldCwgZS5vcmlnaW5hbEV2ZW50LnRhcmdldFRvdWNoZXNbMF0ucGFnZVkgLSB3aW5kb3cucGFnZVlPZmZzZXQpO1xuXHRcdFx0XHRcdFx0XHRlLmN1cnJlbnRUYXJnZXQgPSBlLnRhcmdldDtcblx0XHRcdFx0XHRcdFx0dG0gPSAoKCsobmV3IERhdGUoKSkpIC0gdG0pO1xuXHRcdFx0XHRcdFx0XHRpZihlLnRhcmdldCA9PT0gZWwgJiYgdG0gPiA2MDAgJiYgdG0gPCAxMDAwKSB7XG5cdFx0XHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdFx0XHRcdCQoZWwpLnRyaWdnZXIoJ2NvbnRleHRtZW51JywgZSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0ZWwgPSBudWxsO1xuXHRcdFx0XHRcdFx0XHR0bSA9IG51bGw7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdCovXG5cdFx0XHQkKGRvY3VtZW50KS5vbihcImNvbnRleHRfaGlkZS52YWthdGFcIiwgJC5wcm94eShmdW5jdGlvbiAoKSB7IHRoaXMuX2RhdGEuY29udGV4dG1lbnUudmlzaWJsZSA9IGZhbHNlOyB9LCB0aGlzKSk7XG5cdFx0fTtcblx0XHR0aGlzLnRlYXJkb3duID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYodGhpcy5fZGF0YS5jb250ZXh0bWVudS52aXNpYmxlKSB7XG5cdFx0XHRcdCQudmFrYXRhLmNvbnRleHQuaGlkZSgpO1xuXHRcdFx0fVxuXHRcdFx0cGFyZW50LnRlYXJkb3duLmNhbGwodGhpcyk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIHByZXBhcmUgYW5kIHNob3cgdGhlIGNvbnRleHQgbWVudSBmb3IgYSBub2RlXG5cdFx0ICogQG5hbWUgc2hvd19jb250ZXh0bWVudShvYmogWywgeCwgeV0pXG5cdFx0ICogQHBhcmFtIHttaXhlZH0gb2JqIHRoZSBub2RlXG5cdFx0ICogQHBhcmFtIHtOdW1iZXJ9IHggdGhlIHgtY29vcmRpbmF0ZSByZWxhdGl2ZSB0byB0aGUgZG9jdW1lbnQgdG8gc2hvdyB0aGUgbWVudSBhdFxuXHRcdCAqIEBwYXJhbSB7TnVtYmVyfSB5IHRoZSB5LWNvb3JkaW5hdGUgcmVsYXRpdmUgdG8gdGhlIGRvY3VtZW50IHRvIHNob3cgdGhlIG1lbnUgYXRcblx0XHQgKiBAcGFyYW0ge09iamVjdH0gZSB0aGUgZXZlbnQgaWYgYXZhaWxhYmxlIHRoYXQgdHJpZ2dlcmVkIHRoZSBjb250ZXh0bWVudVxuXHRcdCAqIEBwbHVnaW4gY29udGV4dG1lbnVcblx0XHQgKiBAdHJpZ2dlciBzaG93X2NvbnRleHRtZW51LmpzdHJlZVxuXHRcdCAqL1xuXHRcdHRoaXMuc2hvd19jb250ZXh0bWVudSA9IGZ1bmN0aW9uIChvYmosIHgsIHksIGUpIHtcblx0XHRcdG9iaiA9IHRoaXMuZ2V0X25vZGUob2JqKTtcblx0XHRcdGlmKCFvYmogfHwgb2JqLmlkID09PSAnIycpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHR2YXIgcyA9IHRoaXMuc2V0dGluZ3MuY29udGV4dG1lbnUsXG5cdFx0XHRcdGQgPSB0aGlzLmdldF9ub2RlKG9iaiwgdHJ1ZSksXG5cdFx0XHRcdGEgPSBkLmNoaWxkcmVuKFwiLmpzdHJlZS1hbmNob3JcIiksXG5cdFx0XHRcdG8gPSBmYWxzZSxcblx0XHRcdFx0aSA9IGZhbHNlO1xuXHRcdFx0aWYocy5zaG93X2F0X25vZGUgfHwgeCA9PT0gdW5kZWZpbmVkIHx8IHkgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRvID0gYS5vZmZzZXQoKTtcblx0XHRcdFx0eCA9IG8ubGVmdDtcblx0XHRcdFx0eSA9IG8udG9wICsgdGhpcy5fZGF0YS5jb3JlLmxpX2hlaWdodDtcblx0XHRcdH1cblx0XHRcdGlmKHRoaXMuc2V0dGluZ3MuY29udGV4dG1lbnUuc2VsZWN0X25vZGUgJiYgIXRoaXMuaXNfc2VsZWN0ZWQob2JqKSkge1xuXHRcdFx0XHR0aGlzLmRlc2VsZWN0X2FsbCgpO1xuXHRcdFx0XHR0aGlzLnNlbGVjdF9ub2RlKG9iaiwgZmFsc2UsIGZhbHNlLCBlKTtcblx0XHRcdH1cblxuXHRcdFx0aSA9IHMuaXRlbXM7XG5cdFx0XHRpZigkLmlzRnVuY3Rpb24oaSkpIHtcblx0XHRcdFx0aSA9IGkuY2FsbCh0aGlzLCBvYmosICQucHJveHkoZnVuY3Rpb24gKGkpIHtcblx0XHRcdFx0XHR0aGlzLl9zaG93X2NvbnRleHRtZW51KG9iaiwgeCwgeSwgaSk7XG5cdFx0XHRcdH0sIHRoaXMpKTtcblx0XHRcdH1cblx0XHRcdGlmKCQuaXNQbGFpbk9iamVjdChpKSkge1xuXHRcdFx0XHR0aGlzLl9zaG93X2NvbnRleHRtZW51KG9iaiwgeCwgeSwgaSk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHQvKipcblx0XHQgKiBzaG93IHRoZSBwcmVwYXJlZCBjb250ZXh0IG1lbnUgZm9yIGEgbm9kZVxuXHRcdCAqIEBuYW1lIF9zaG93X2NvbnRleHRtZW51KG9iaiwgeCwgeSwgaSlcblx0XHQgKiBAcGFyYW0ge21peGVkfSBvYmogdGhlIG5vZGVcblx0XHQgKiBAcGFyYW0ge051bWJlcn0geCB0aGUgeC1jb29yZGluYXRlIHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudCB0byBzaG93IHRoZSBtZW51IGF0XG5cdFx0ICogQHBhcmFtIHtOdW1iZXJ9IHkgdGhlIHktY29vcmRpbmF0ZSByZWxhdGl2ZSB0byB0aGUgZG9jdW1lbnQgdG8gc2hvdyB0aGUgbWVudSBhdFxuXHRcdCAqIEBwYXJhbSB7TnVtYmVyfSBpIHRoZSBvYmplY3Qgb2YgaXRlbXMgdG8gc2hvd1xuXHRcdCAqIEBwbHVnaW4gY29udGV4dG1lbnVcblx0XHQgKiBAdHJpZ2dlciBzaG93X2NvbnRleHRtZW51LmpzdHJlZVxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dGhpcy5fc2hvd19jb250ZXh0bWVudSA9IGZ1bmN0aW9uIChvYmosIHgsIHksIGkpIHtcblx0XHRcdHZhciBkID0gdGhpcy5nZXRfbm9kZShvYmosIHRydWUpLFxuXHRcdFx0XHRhID0gZC5jaGlsZHJlbihcIi5qc3RyZWUtYW5jaG9yXCIpO1xuXHRcdFx0JChkb2N1bWVudCkub25lKFwiY29udGV4dF9zaG93LnZha2F0YVwiLCAkLnByb3h5KGZ1bmN0aW9uIChlLCBkYXRhKSB7XG5cdFx0XHRcdHZhciBjbHMgPSAnanN0cmVlLWNvbnRleHRtZW51IGpzdHJlZS0nICsgdGhpcy5nZXRfdGhlbWUoKSArICctY29udGV4dG1lbnUnO1xuXHRcdFx0XHQkKGRhdGEuZWxlbWVudCkuYWRkQ2xhc3MoY2xzKTtcblx0XHRcdH0sIHRoaXMpKTtcblx0XHRcdHRoaXMuX2RhdGEuY29udGV4dG1lbnUudmlzaWJsZSA9IHRydWU7XG5cdFx0XHQkLnZha2F0YS5jb250ZXh0LnNob3coYSwgeyAneCcgOiB4LCAneScgOiB5IH0sIGkpO1xuXHRcdFx0LyoqXG5cdFx0XHQgKiB0cmlnZ2VyZWQgd2hlbiB0aGUgY29udGV4dG1lbnUgaXMgc2hvd24gZm9yIGEgbm9kZVxuXHRcdFx0ICogQGV2ZW50XG5cdFx0XHQgKiBAbmFtZSBzaG93X2NvbnRleHRtZW51LmpzdHJlZVxuXHRcdFx0ICogQHBhcmFtIHtPYmplY3R9IG5vZGUgdGhlIG5vZGVcblx0XHRcdCAqIEBwYXJhbSB7TnVtYmVyfSB4IHRoZSB4LWNvb3JkaW5hdGUgb2YgdGhlIG1lbnUgcmVsYXRpdmUgdG8gdGhlIGRvY3VtZW50XG5cdFx0XHQgKiBAcGFyYW0ge051bWJlcn0geSB0aGUgeS1jb29yZGluYXRlIG9mIHRoZSBtZW51IHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudFxuXHRcdFx0ICogQHBsdWdpbiBjb250ZXh0bWVudVxuXHRcdFx0ICovXG5cdFx0XHR0aGlzLnRyaWdnZXIoJ3Nob3dfY29udGV4dG1lbnUnLCB7IFwibm9kZVwiIDogb2JqLCBcInhcIiA6IHgsIFwieVwiIDogeSB9KTtcblx0XHR9O1xuXHR9O1xuXG5cdC8vIGNvbnRleHRtZW51IGhlbHBlclxuXHQoZnVuY3Rpb24gKCQpIHtcblx0XHR2YXIgcmlnaHRfdG9fbGVmdCA9IGZhbHNlLFxuXHRcdFx0dmFrYXRhX2NvbnRleHQgPSB7XG5cdFx0XHRcdGVsZW1lbnRcdFx0OiBmYWxzZSxcblx0XHRcdFx0cmVmZXJlbmNlXHQ6IGZhbHNlLFxuXHRcdFx0XHRwb3NpdGlvbl94XHQ6IDAsXG5cdFx0XHRcdHBvc2l0aW9uX3lcdDogMCxcblx0XHRcdFx0aXRlbXNcdFx0OiBbXSxcblx0XHRcdFx0aHRtbFx0XHQ6IFwiXCIsXG5cdFx0XHRcdGlzX3Zpc2libGVcdDogZmFsc2Vcblx0XHRcdH07XG5cblx0XHQkLnZha2F0YS5jb250ZXh0ID0ge1xuXHRcdFx0c2V0dGluZ3MgOiB7XG5cdFx0XHRcdGhpZGVfb25tb3VzZWxlYXZlXHQ6IDAsXG5cdFx0XHRcdGljb25zXHRcdFx0XHQ6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRfdHJpZ2dlciA6IGZ1bmN0aW9uIChldmVudF9uYW1lKSB7XG5cdFx0XHRcdCQoZG9jdW1lbnQpLnRyaWdnZXJIYW5kbGVyKFwiY29udGV4dF9cIiArIGV2ZW50X25hbWUgKyBcIi52YWthdGFcIiwge1xuXHRcdFx0XHRcdFwicmVmZXJlbmNlXCJcdDogdmFrYXRhX2NvbnRleHQucmVmZXJlbmNlLFxuXHRcdFx0XHRcdFwiZWxlbWVudFwiXHQ6IHZha2F0YV9jb250ZXh0LmVsZW1lbnQsXG5cdFx0XHRcdFx0XCJwb3NpdGlvblwiXHQ6IHtcblx0XHRcdFx0XHRcdFwieFwiIDogdmFrYXRhX2NvbnRleHQucG9zaXRpb25feCxcblx0XHRcdFx0XHRcdFwieVwiIDogdmFrYXRhX2NvbnRleHQucG9zaXRpb25feVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9LFxuXHRcdFx0X2V4ZWN1dGUgOiBmdW5jdGlvbiAoaSkge1xuXHRcdFx0XHRpID0gdmFrYXRhX2NvbnRleHQuaXRlbXNbaV07XG5cdFx0XHRcdHJldHVybiBpICYmICghaS5fZGlzYWJsZWQgfHwgKCQuaXNGdW5jdGlvbihpLl9kaXNhYmxlZCkgJiYgIWkuX2Rpc2FibGVkKHsgXCJpdGVtXCIgOiBpLCBcInJlZmVyZW5jZVwiIDogdmFrYXRhX2NvbnRleHQucmVmZXJlbmNlLCBcImVsZW1lbnRcIiA6IHZha2F0YV9jb250ZXh0LmVsZW1lbnQgfSkpKSAmJiBpLmFjdGlvbiA/IGkuYWN0aW9uLmNhbGwobnVsbCwge1xuXHRcdFx0XHRcdFx0XHRcIml0ZW1cIlx0XHQ6IGksXG5cdFx0XHRcdFx0XHRcdFwicmVmZXJlbmNlXCJcdDogdmFrYXRhX2NvbnRleHQucmVmZXJlbmNlLFxuXHRcdFx0XHRcdFx0XHRcImVsZW1lbnRcIlx0OiB2YWthdGFfY29udGV4dC5lbGVtZW50LFxuXHRcdFx0XHRcdFx0XHRcInBvc2l0aW9uXCJcdDoge1xuXHRcdFx0XHRcdFx0XHRcdFwieFwiIDogdmFrYXRhX2NvbnRleHQucG9zaXRpb25feCxcblx0XHRcdFx0XHRcdFx0XHRcInlcIiA6IHZha2F0YV9jb250ZXh0LnBvc2l0aW9uX3lcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSkgOiBmYWxzZTtcblx0XHRcdH0sXG5cdFx0XHRfcGFyc2UgOiBmdW5jdGlvbiAobywgaXNfY2FsbGJhY2spIHtcblx0XHRcdFx0aWYoIW8pIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdGlmKCFpc19jYWxsYmFjaykge1xuXHRcdFx0XHRcdHZha2F0YV9jb250ZXh0Lmh0bWxcdFx0PSBcIlwiO1xuXHRcdFx0XHRcdHZha2F0YV9jb250ZXh0Lml0ZW1zXHQ9IFtdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBzdHIgPSBcIlwiLFxuXHRcdFx0XHRcdHNlcCA9IGZhbHNlLFxuXHRcdFx0XHRcdHRtcDtcblxuXHRcdFx0XHRpZihpc19jYWxsYmFjaykgeyBzdHIgKz0gXCI8XCIrXCJ1bD5cIjsgfVxuXHRcdFx0XHQkLmVhY2gobywgZnVuY3Rpb24gKGksIHZhbCkge1xuXHRcdFx0XHRcdGlmKCF2YWwpIHsgcmV0dXJuIHRydWU7IH1cblx0XHRcdFx0XHR2YWthdGFfY29udGV4dC5pdGVtcy5wdXNoKHZhbCk7XG5cdFx0XHRcdFx0aWYoIXNlcCAmJiB2YWwuc2VwYXJhdG9yX2JlZm9yZSkge1xuXHRcdFx0XHRcdFx0c3RyICs9IFwiPFwiK1wibGkgY2xhc3M9J3Zha2F0YS1jb250ZXh0LXNlcGFyYXRvcic+PFwiK1wiYSBocmVmPScjJyBcIiArICgkLnZha2F0YS5jb250ZXh0LnNldHRpbmdzLmljb25zID8gJycgOiAnc3R5bGU9XCJtYXJnaW4tbGVmdDowcHg7XCInKSArIFwiPiYjMTYwOzxcIitcIi9hPjxcIitcIi9saT5cIjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0c2VwID0gZmFsc2U7XG5cdFx0XHRcdFx0c3RyICs9IFwiPFwiK1wibGkgY2xhc3M9J1wiICsgKHZhbC5fY2xhc3MgfHwgXCJcIikgKyAodmFsLl9kaXNhYmxlZCA9PT0gdHJ1ZSB8fCAoJC5pc0Z1bmN0aW9uKHZhbC5fZGlzYWJsZWQpICYmIHZhbC5fZGlzYWJsZWQoeyBcIml0ZW1cIiA6IHZhbCwgXCJyZWZlcmVuY2VcIiA6IHZha2F0YV9jb250ZXh0LnJlZmVyZW5jZSwgXCJlbGVtZW50XCIgOiB2YWthdGFfY29udGV4dC5lbGVtZW50IH0pKSA/IFwiIHZha2F0YS1jb250ZXh0bWVudS1kaXNhYmxlZCBcIiA6IFwiXCIpICsgXCInIFwiKyh2YWwuc2hvcnRjdXQ/XCIgZGF0YS1zaG9ydGN1dD0nXCIrdmFsLnNob3J0Y3V0K1wiJyBcIjonJykrXCI+XCI7XG5cdFx0XHRcdFx0c3RyICs9IFwiPFwiK1wiYSBocmVmPScjJyByZWw9J1wiICsgKHZha2F0YV9jb250ZXh0Lml0ZW1zLmxlbmd0aCAtIDEpICsgXCInPlwiO1xuXHRcdFx0XHRcdGlmKCQudmFrYXRhLmNvbnRleHQuc2V0dGluZ3MuaWNvbnMpIHtcblx0XHRcdFx0XHRcdHN0ciArPSBcIjxcIitcImkgXCI7XG5cdFx0XHRcdFx0XHRpZih2YWwuaWNvbikge1xuXHRcdFx0XHRcdFx0XHRpZih2YWwuaWNvbi5pbmRleE9mKFwiL1wiKSAhPT0gLTEgfHwgdmFsLmljb24uaW5kZXhPZihcIi5cIikgIT09IC0xKSB7IHN0ciArPSBcIiBzdHlsZT0nYmFja2dyb3VuZDp1cmwoXFxcIlwiICsgdmFsLmljb24gKyBcIlxcXCIpIGNlbnRlciBjZW50ZXIgbm8tcmVwZWF0JyBcIjsgfVxuXHRcdFx0XHRcdFx0XHRlbHNlIHsgc3RyICs9IFwiIGNsYXNzPSdcIiArIHZhbC5pY29uICsgXCInIFwiOyB9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRzdHIgKz0gXCI+PFwiK1wiL2k+PFwiK1wic3BhbiBjbGFzcz0ndmFrYXRhLWNvbnRleHRtZW51LXNlcCc+JiMxNjA7PFwiK1wiL3NwYW4+XCI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHN0ciArPSB2YWwubGFiZWwgKyAodmFsLnNob3J0Y3V0PycgPHNwYW4gY2xhc3M9XCJ2YWthdGEtY29udGV4dG1lbnUtc2hvcnRjdXQgdmFrYXRhLWNvbnRleHRtZW51LXNob3J0Y3V0LScrdmFsLnNob3J0Y3V0KydcIj4nKyAodmFsLnNob3J0Y3V0X2xhYmVsIHx8ICcnKSArJzwvc3Bhbj4nOicnKSArIFwiPFwiK1wiL2E+XCI7XG5cdFx0XHRcdFx0aWYodmFsLnN1Ym1lbnUpIHtcblx0XHRcdFx0XHRcdHRtcCA9ICQudmFrYXRhLmNvbnRleHQuX3BhcnNlKHZhbC5zdWJtZW51LCB0cnVlKTtcblx0XHRcdFx0XHRcdGlmKHRtcCkgeyBzdHIgKz0gdG1wOyB9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHN0ciArPSBcIjxcIitcIi9saT5cIjtcblx0XHRcdFx0XHRpZih2YWwuc2VwYXJhdG9yX2FmdGVyKSB7XG5cdFx0XHRcdFx0XHRzdHIgKz0gXCI8XCIrXCJsaSBjbGFzcz0ndmFrYXRhLWNvbnRleHQtc2VwYXJhdG9yJz48XCIrXCJhIGhyZWY9JyMnIFwiICsgKCQudmFrYXRhLmNvbnRleHQuc2V0dGluZ3MuaWNvbnMgPyAnJyA6ICdzdHlsZT1cIm1hcmdpbi1sZWZ0OjBweDtcIicpICsgXCI+JiMxNjA7PFwiK1wiL2E+PFwiK1wiL2xpPlwiO1xuXHRcdFx0XHRcdFx0c2VwID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRzdHIgID0gc3RyLnJlcGxhY2UoLzxsaSBjbGFzc1xcPSd2YWthdGEtY29udGV4dC1zZXBhcmF0b3InXFw+PFxcL2xpXFw+JC8sXCJcIik7XG5cdFx0XHRcdGlmKGlzX2NhbGxiYWNrKSB7IHN0ciArPSBcIjwvdWw+XCI7IH1cblx0XHRcdFx0LyoqXG5cdFx0XHRcdCAqIHRyaWdnZXJlZCBvbiB0aGUgZG9jdW1lbnQgd2hlbiB0aGUgY29udGV4dG1lbnUgaXMgcGFyc2VkIChIVE1MIGlzIGJ1aWx0KVxuXHRcdFx0XHQgKiBAZXZlbnRcblx0XHRcdFx0ICogQHBsdWdpbiBjb250ZXh0bWVudVxuXHRcdFx0XHQgKiBAbmFtZSBjb250ZXh0X3BhcnNlLnZha2F0YVxuXHRcdFx0XHQgKiBAcGFyYW0ge2pRdWVyeX0gcmVmZXJlbmNlIHRoZSBlbGVtZW50IHRoYXQgd2FzIHJpZ2h0IGNsaWNrZWRcblx0XHRcdFx0ICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgdGhlIERPTSBlbGVtZW50IG9mIHRoZSBtZW51IGl0c2VsZlxuXHRcdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gcG9zaXRpb24gdGhlIHggJiB5IGNvb3JkaW5hdGVzIG9mIHRoZSBtZW51XG5cdFx0XHRcdCAqL1xuXHRcdFx0XHRpZighaXNfY2FsbGJhY2spIHsgdmFrYXRhX2NvbnRleHQuaHRtbCA9IHN0cjsgJC52YWthdGEuY29udGV4dC5fdHJpZ2dlcihcInBhcnNlXCIpOyB9XG5cdFx0XHRcdHJldHVybiBzdHIubGVuZ3RoID4gMTAgPyBzdHIgOiBmYWxzZTtcblx0XHRcdH0sXG5cdFx0XHRfc2hvd19zdWJtZW51IDogZnVuY3Rpb24gKG8pIHtcblx0XHRcdFx0byA9ICQobyk7XG5cdFx0XHRcdGlmKCFvLmxlbmd0aCB8fCAhby5jaGlsZHJlbihcInVsXCIpLmxlbmd0aCkgeyByZXR1cm47IH1cblx0XHRcdFx0dmFyIGUgPSBvLmNoaWxkcmVuKFwidWxcIiksXG5cdFx0XHRcdFx0eCA9IG8ub2Zmc2V0KCkubGVmdCArIG8ub3V0ZXJXaWR0aCgpLFxuXHRcdFx0XHRcdHkgPSBvLm9mZnNldCgpLnRvcCxcblx0XHRcdFx0XHR3ID0gZS53aWR0aCgpLFxuXHRcdFx0XHRcdGggPSBlLmhlaWdodCgpLFxuXHRcdFx0XHRcdGR3ID0gJCh3aW5kb3cpLndpZHRoKCkgKyAkKHdpbmRvdykuc2Nyb2xsTGVmdCgpLFxuXHRcdFx0XHRcdGRoID0gJCh3aW5kb3cpLmhlaWdodCgpICsgJCh3aW5kb3cpLnNjcm9sbFRvcCgpO1xuXHRcdFx0XHQvLyDQvNC+0LbQtSDQtNCwINGB0LUg0YHQv9C10YHRgtC4INC1INC10LTQvdCwINC/0YDQvtCy0LXRgNC60LAgLSDQtNCw0LvQuCDQvdGP0LzQsCDQvdGP0LrQvtC5INC+0YIg0LrQu9Cw0YHQvtCy0LXRgtC1INCy0LXRh9C1INC90LDQs9C+0YDQtVxuXHRcdFx0XHRpZihyaWdodF90b19sZWZ0KSB7XG5cdFx0XHRcdFx0b1t4IC0gKHcgKyAxMCArIG8ub3V0ZXJXaWR0aCgpKSA8IDAgPyBcImFkZENsYXNzXCIgOiBcInJlbW92ZUNsYXNzXCJdKFwidmFrYXRhLWNvbnRleHQtbGVmdFwiKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRvW3ggKyB3ICsgMTAgPiBkdyA/IFwiYWRkQ2xhc3NcIiA6IFwicmVtb3ZlQ2xhc3NcIl0oXCJ2YWthdGEtY29udGV4dC1yaWdodFwiKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZih5ICsgaCArIDEwID4gZGgpIHtcblx0XHRcdFx0XHRlLmNzcyhcImJvdHRvbVwiLFwiLTFweFwiKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlLnNob3coKTtcblx0XHRcdH0sXG5cdFx0XHRzaG93IDogZnVuY3Rpb24gKHJlZmVyZW5jZSwgcG9zaXRpb24sIGRhdGEpIHtcblx0XHRcdFx0dmFyIG8sIGUsIHgsIHksIHcsIGgsIGR3LCBkaCwgY29uZCA9IHRydWU7XG5cdFx0XHRcdGlmKHZha2F0YV9jb250ZXh0LmVsZW1lbnQgJiYgdmFrYXRhX2NvbnRleHQuZWxlbWVudC5sZW5ndGgpIHtcblx0XHRcdFx0XHR2YWthdGFfY29udGV4dC5lbGVtZW50LndpZHRoKCcnKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRzd2l0Y2goY29uZCkge1xuXHRcdFx0XHRcdGNhc2UgKCFwb3NpdGlvbiAmJiAhcmVmZXJlbmNlKTpcblx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRjYXNlICghIXBvc2l0aW9uICYmICEhcmVmZXJlbmNlKTpcblx0XHRcdFx0XHRcdHZha2F0YV9jb250ZXh0LnJlZmVyZW5jZVx0PSByZWZlcmVuY2U7XG5cdFx0XHRcdFx0XHR2YWthdGFfY29udGV4dC5wb3NpdGlvbl94XHQ9IHBvc2l0aW9uLng7XG5cdFx0XHRcdFx0XHR2YWthdGFfY29udGV4dC5wb3NpdGlvbl95XHQ9IHBvc2l0aW9uLnk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICghcG9zaXRpb24gJiYgISFyZWZlcmVuY2UpOlxuXHRcdFx0XHRcdFx0dmFrYXRhX2NvbnRleHQucmVmZXJlbmNlXHQ9IHJlZmVyZW5jZTtcblx0XHRcdFx0XHRcdG8gPSByZWZlcmVuY2Uub2Zmc2V0KCk7XG5cdFx0XHRcdFx0XHR2YWthdGFfY29udGV4dC5wb3NpdGlvbl94XHQ9IG8ubGVmdCArIHJlZmVyZW5jZS5vdXRlckhlaWdodCgpO1xuXHRcdFx0XHRcdFx0dmFrYXRhX2NvbnRleHQucG9zaXRpb25feVx0PSBvLnRvcDtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgKCEhcG9zaXRpb24gJiYgIXJlZmVyZW5jZSk6XG5cdFx0XHRcdFx0XHR2YWthdGFfY29udGV4dC5wb3NpdGlvbl94XHQ9IHBvc2l0aW9uLng7XG5cdFx0XHRcdFx0XHR2YWthdGFfY29udGV4dC5wb3NpdGlvbl95XHQ9IHBvc2l0aW9uLnk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHRpZighIXJlZmVyZW5jZSAmJiAhZGF0YSAmJiAkKHJlZmVyZW5jZSkuZGF0YSgndmFrYXRhX2NvbnRleHRtZW51JykpIHtcblx0XHRcdFx0XHRkYXRhID0gJChyZWZlcmVuY2UpLmRhdGEoJ3Zha2F0YV9jb250ZXh0bWVudScpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKCQudmFrYXRhLmNvbnRleHQuX3BhcnNlKGRhdGEpKSB7XG5cdFx0XHRcdFx0dmFrYXRhX2NvbnRleHQuZWxlbWVudC5odG1sKHZha2F0YV9jb250ZXh0Lmh0bWwpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKHZha2F0YV9jb250ZXh0Lml0ZW1zLmxlbmd0aCkge1xuXHRcdFx0XHRcdGUgPSB2YWthdGFfY29udGV4dC5lbGVtZW50O1xuXHRcdFx0XHRcdHggPSB2YWthdGFfY29udGV4dC5wb3NpdGlvbl94O1xuXHRcdFx0XHRcdHkgPSB2YWthdGFfY29udGV4dC5wb3NpdGlvbl95O1xuXHRcdFx0XHRcdHcgPSBlLndpZHRoKCk7XG5cdFx0XHRcdFx0aCA9IGUuaGVpZ2h0KCk7XG5cdFx0XHRcdFx0ZHcgPSAkKHdpbmRvdykud2lkdGgoKSArICQod2luZG93KS5zY3JvbGxMZWZ0KCk7XG5cdFx0XHRcdFx0ZGggPSAkKHdpbmRvdykuaGVpZ2h0KCkgKyAkKHdpbmRvdykuc2Nyb2xsVG9wKCk7XG5cdFx0XHRcdFx0aWYocmlnaHRfdG9fbGVmdCkge1xuXHRcdFx0XHRcdFx0eCAtPSBlLm91dGVyV2lkdGgoKTtcblx0XHRcdFx0XHRcdGlmKHggPCAkKHdpbmRvdykuc2Nyb2xsTGVmdCgpICsgMjApIHtcblx0XHRcdFx0XHRcdFx0eCA9ICQod2luZG93KS5zY3JvbGxMZWZ0KCkgKyAyMDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoeCArIHcgKyAyMCA+IGR3KSB7XG5cdFx0XHRcdFx0XHR4ID0gZHcgLSAodyArIDIwKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoeSArIGggKyAyMCA+IGRoKSB7XG5cdFx0XHRcdFx0XHR5ID0gZGggLSAoaCArIDIwKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR2YWthdGFfY29udGV4dC5lbGVtZW50XG5cdFx0XHRcdFx0XHQuY3NzKHsgXCJsZWZ0XCIgOiB4LCBcInRvcFwiIDogeSB9KVxuXHRcdFx0XHRcdFx0LnNob3coKVxuXHRcdFx0XHRcdFx0LmZpbmQoJ2E6ZXEoMCknKS5mb2N1cygpLnBhcmVudCgpLmFkZENsYXNzKFwidmFrYXRhLWNvbnRleHQtaG92ZXJcIik7XG5cdFx0XHRcdFx0dmFrYXRhX2NvbnRleHQuaXNfdmlzaWJsZSA9IHRydWU7XG5cdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0ICogdHJpZ2dlcmVkIG9uIHRoZSBkb2N1bWVudCB3aGVuIHRoZSBjb250ZXh0bWVudSBpcyBzaG93blxuXHRcdFx0XHRcdCAqIEBldmVudFxuXHRcdFx0XHRcdCAqIEBwbHVnaW4gY29udGV4dG1lbnVcblx0XHRcdFx0XHQgKiBAbmFtZSBjb250ZXh0X3Nob3cudmFrYXRhXG5cdFx0XHRcdFx0ICogQHBhcmFtIHtqUXVlcnl9IHJlZmVyZW5jZSB0aGUgZWxlbWVudCB0aGF0IHdhcyByaWdodCBjbGlja2VkXG5cdFx0XHRcdFx0ICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgdGhlIERPTSBlbGVtZW50IG9mIHRoZSBtZW51IGl0c2VsZlxuXHRcdFx0XHRcdCAqIEBwYXJhbSB7T2JqZWN0fSBwb3NpdGlvbiB0aGUgeCAmIHkgY29vcmRpbmF0ZXMgb2YgdGhlIG1lbnVcblx0XHRcdFx0XHQgKi9cblx0XHRcdFx0XHQkLnZha2F0YS5jb250ZXh0Ll90cmlnZ2VyKFwic2hvd1wiKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGhpZGUgOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGlmKHZha2F0YV9jb250ZXh0LmlzX3Zpc2libGUpIHtcblx0XHRcdFx0XHR2YWthdGFfY29udGV4dC5lbGVtZW50LmhpZGUoKS5maW5kKFwidWxcIikuaGlkZSgpLmVuZCgpLmZpbmQoJzpmb2N1cycpLmJsdXIoKTtcblx0XHRcdFx0XHR2YWthdGFfY29udGV4dC5pc192aXNpYmxlID0gZmFsc2U7XG5cdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0ICogdHJpZ2dlcmVkIG9uIHRoZSBkb2N1bWVudCB3aGVuIHRoZSBjb250ZXh0bWVudSBpcyBoaWRkZW5cblx0XHRcdFx0XHQgKiBAZXZlbnRcblx0XHRcdFx0XHQgKiBAcGx1Z2luIGNvbnRleHRtZW51XG5cdFx0XHRcdFx0ICogQG5hbWUgY29udGV4dF9oaWRlLnZha2F0YVxuXHRcdFx0XHRcdCAqIEBwYXJhbSB7alF1ZXJ5fSByZWZlcmVuY2UgdGhlIGVsZW1lbnQgdGhhdCB3YXMgcmlnaHQgY2xpY2tlZFxuXHRcdFx0XHRcdCAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IHRoZSBET00gZWxlbWVudCBvZiB0aGUgbWVudSBpdHNlbGZcblx0XHRcdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gcG9zaXRpb24gdGhlIHggJiB5IGNvb3JkaW5hdGVzIG9mIHRoZSBtZW51XG5cdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0JC52YWthdGEuY29udGV4dC5fdHJpZ2dlcihcImhpZGVcIik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHRcdCQoZnVuY3Rpb24gKCkge1xuXHRcdFx0cmlnaHRfdG9fbGVmdCA9ICQoXCJib2R5XCIpLmNzcyhcImRpcmVjdGlvblwiKSA9PT0gXCJydGxcIjtcblx0XHRcdHZhciB0byA9IGZhbHNlO1xuXG5cdFx0XHR2YWthdGFfY29udGV4dC5lbGVtZW50ID0gJChcIjx1bCBjbGFzcz0ndmFrYXRhLWNvbnRleHQnPjwvdWw+XCIpO1xuXHRcdFx0dmFrYXRhX2NvbnRleHQuZWxlbWVudFxuXHRcdFx0XHQub24oXCJtb3VzZWVudGVyXCIsIFwibGlcIiwgZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0XHRlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXG5cdFx0XHRcdFx0aWYoJC5jb250YWlucyh0aGlzLCBlLnJlbGF0ZWRUYXJnZXQpKSB7XG5cdFx0XHRcdFx0XHQvLyDQv9GA0LXQvNCw0YXQvdCw0YLQviDQt9Cw0YDQsNC00LggZGVsZWdhdGUgbW91c2VsZWF2ZSDQv9C+LdC00L7Qu9GDXG5cdFx0XHRcdFx0XHQvLyAkKHRoaXMpLmZpbmQoXCIudmFrYXRhLWNvbnRleHQtaG92ZXJcIikucmVtb3ZlQ2xhc3MoXCJ2YWthdGEtY29udGV4dC1ob3ZlclwiKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZih0bykgeyBjbGVhclRpbWVvdXQodG8pOyB9XG5cdFx0XHRcdFx0dmFrYXRhX2NvbnRleHQuZWxlbWVudC5maW5kKFwiLnZha2F0YS1jb250ZXh0LWhvdmVyXCIpLnJlbW92ZUNsYXNzKFwidmFrYXRhLWNvbnRleHQtaG92ZXJcIikuZW5kKCk7XG5cblx0XHRcdFx0XHQkKHRoaXMpXG5cdFx0XHRcdFx0XHQuc2libGluZ3MoKS5maW5kKFwidWxcIikuaGlkZSgpLmVuZCgpLmVuZCgpXG5cdFx0XHRcdFx0XHQucGFyZW50c1VudGlsKFwiLnZha2F0YS1jb250ZXh0XCIsIFwibGlcIikuYWRkQmFjaygpLmFkZENsYXNzKFwidmFrYXRhLWNvbnRleHQtaG92ZXJcIik7XG5cdFx0XHRcdFx0JC52YWthdGEuY29udGV4dC5fc2hvd19zdWJtZW51KHRoaXMpO1xuXHRcdFx0XHR9KVxuXHRcdFx0XHQvLyDRgtC10YHRgtC+0LLQviAtINC00LDQu9C4INC90LUg0L3QsNGC0L7QstCw0YDQstCwP1xuXHRcdFx0XHQub24oXCJtb3VzZWxlYXZlXCIsIFwibGlcIiwgZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0XHRpZigkLmNvbnRhaW5zKHRoaXMsIGUucmVsYXRlZFRhcmdldCkpIHsgcmV0dXJuOyB9XG5cdFx0XHRcdFx0JCh0aGlzKS5maW5kKFwiLnZha2F0YS1jb250ZXh0LWhvdmVyXCIpLmFkZEJhY2soKS5yZW1vdmVDbGFzcyhcInZha2F0YS1jb250ZXh0LWhvdmVyXCIpO1xuXHRcdFx0XHR9KVxuXHRcdFx0XHQub24oXCJtb3VzZWxlYXZlXCIsIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdFx0JCh0aGlzKS5maW5kKFwiLnZha2F0YS1jb250ZXh0LWhvdmVyXCIpLnJlbW92ZUNsYXNzKFwidmFrYXRhLWNvbnRleHQtaG92ZXJcIik7XG5cdFx0XHRcdFx0aWYoJC52YWthdGEuY29udGV4dC5zZXR0aW5ncy5oaWRlX29ubW91c2VsZWF2ZSkge1xuXHRcdFx0XHRcdFx0dG8gPSBzZXRUaW1lb3V0KFxuXHRcdFx0XHRcdFx0XHQoZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24gKCkgeyAkLnZha2F0YS5jb250ZXh0LmhpZGUoKTsgfTtcblx0XHRcdFx0XHRcdFx0fSh0aGlzKSksICQudmFrYXRhLmNvbnRleHQuc2V0dGluZ3MuaGlkZV9vbm1vdXNlbGVhdmUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdFx0Lm9uKFwiY2xpY2tcIiwgXCJhXCIsIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHR9KVxuXHRcdFx0XHQub24oXCJtb3VzZXVwXCIsIFwiYVwiLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdGlmKCEkKHRoaXMpLmJsdXIoKS5wYXJlbnQoKS5oYXNDbGFzcyhcInZha2F0YS1jb250ZXh0LWRpc2FibGVkXCIpICYmICQudmFrYXRhLmNvbnRleHQuX2V4ZWN1dGUoJCh0aGlzKS5hdHRyKFwicmVsXCIpKSAhPT0gZmFsc2UpIHtcblx0XHRcdFx0XHRcdCQudmFrYXRhLmNvbnRleHQuaGlkZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdFx0Lm9uKCdrZXlkb3duJywgJ2EnLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdFx0dmFyIG8gPSBudWxsO1xuXHRcdFx0XHRcdFx0c3dpdGNoKGUud2hpY2gpIHtcblx0XHRcdFx0XHRcdFx0Y2FzZSAxMzpcblx0XHRcdFx0XHRcdFx0Y2FzZSAzMjpcblx0XHRcdFx0XHRcdFx0XHRlLnR5cGUgPSBcIm1vdXNldXBcIjtcblx0XHRcdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0XHRcdFx0JChlLmN1cnJlbnRUYXJnZXQpLnRyaWdnZXIoZSk7XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdGNhc2UgMzc6XG5cdFx0XHRcdFx0XHRcdFx0aWYodmFrYXRhX2NvbnRleHQuaXNfdmlzaWJsZSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0dmFrYXRhX2NvbnRleHQuZWxlbWVudC5maW5kKFwiLnZha2F0YS1jb250ZXh0LWhvdmVyXCIpLmxhc3QoKS5wYXJlbnRzKFwibGk6ZXEoMClcIikuZmluZChcInVsXCIpLmhpZGUoKS5maW5kKFwiLnZha2F0YS1jb250ZXh0LWhvdmVyXCIpLnJlbW92ZUNsYXNzKFwidmFrYXRhLWNvbnRleHQtaG92ZXJcIikuZW5kKCkuZW5kKCkuY2hpbGRyZW4oJ2EnKS5mb2N1cygpO1xuXHRcdFx0XHRcdFx0XHRcdFx0ZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcblx0XHRcdFx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdGNhc2UgMzg6XG5cdFx0XHRcdFx0XHRcdFx0aWYodmFrYXRhX2NvbnRleHQuaXNfdmlzaWJsZSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0byA9IHZha2F0YV9jb250ZXh0LmVsZW1lbnQuZmluZChcInVsOnZpc2libGVcIikuYWRkQmFjaygpLmxhc3QoKS5jaGlsZHJlbihcIi52YWthdGEtY29udGV4dC1ob3ZlclwiKS5yZW1vdmVDbGFzcyhcInZha2F0YS1jb250ZXh0LWhvdmVyXCIpLnByZXZBbGwoXCJsaTpub3QoLnZha2F0YS1jb250ZXh0LXNlcGFyYXRvcilcIikuZmlyc3QoKTtcblx0XHRcdFx0XHRcdFx0XHRcdGlmKCFvLmxlbmd0aCkgeyBvID0gdmFrYXRhX2NvbnRleHQuZWxlbWVudC5maW5kKFwidWw6dmlzaWJsZVwiKS5hZGRCYWNrKCkubGFzdCgpLmNoaWxkcmVuKFwibGk6bm90KC52YWthdGEtY29udGV4dC1zZXBhcmF0b3IpXCIpLmxhc3QoKTsgfVxuXHRcdFx0XHRcdFx0XHRcdFx0by5hZGRDbGFzcyhcInZha2F0YS1jb250ZXh0LWhvdmVyXCIpLmNoaWxkcmVuKCdhJykuZm9jdXMoKTtcblx0XHRcdFx0XHRcdFx0XHRcdGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRjYXNlIDM5OlxuXHRcdFx0XHRcdFx0XHRcdGlmKHZha2F0YV9jb250ZXh0LmlzX3Zpc2libGUpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHZha2F0YV9jb250ZXh0LmVsZW1lbnQuZmluZChcIi52YWthdGEtY29udGV4dC1ob3ZlclwiKS5sYXN0KCkuY2hpbGRyZW4oXCJ1bFwiKS5zaG93KCkuY2hpbGRyZW4oXCJsaTpub3QoLnZha2F0YS1jb250ZXh0LXNlcGFyYXRvcilcIikucmVtb3ZlQ2xhc3MoXCJ2YWthdGEtY29udGV4dC1ob3ZlclwiKS5maXJzdCgpLmFkZENsYXNzKFwidmFrYXRhLWNvbnRleHQtaG92ZXJcIikuY2hpbGRyZW4oJ2EnKS5mb2N1cygpO1xuXHRcdFx0XHRcdFx0XHRcdFx0ZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcblx0XHRcdFx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdGNhc2UgNDA6XG5cdFx0XHRcdFx0XHRcdFx0aWYodmFrYXRhX2NvbnRleHQuaXNfdmlzaWJsZSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0byA9IHZha2F0YV9jb250ZXh0LmVsZW1lbnQuZmluZChcInVsOnZpc2libGVcIikuYWRkQmFjaygpLmxhc3QoKS5jaGlsZHJlbihcIi52YWthdGEtY29udGV4dC1ob3ZlclwiKS5yZW1vdmVDbGFzcyhcInZha2F0YS1jb250ZXh0LWhvdmVyXCIpLm5leHRBbGwoXCJsaTpub3QoLnZha2F0YS1jb250ZXh0LXNlcGFyYXRvcilcIikuZmlyc3QoKTtcblx0XHRcdFx0XHRcdFx0XHRcdGlmKCFvLmxlbmd0aCkgeyBvID0gdmFrYXRhX2NvbnRleHQuZWxlbWVudC5maW5kKFwidWw6dmlzaWJsZVwiKS5hZGRCYWNrKCkubGFzdCgpLmNoaWxkcmVuKFwibGk6bm90KC52YWthdGEtY29udGV4dC1zZXBhcmF0b3IpXCIpLmZpcnN0KCk7IH1cblx0XHRcdFx0XHRcdFx0XHRcdG8uYWRkQ2xhc3MoXCJ2YWthdGEtY29udGV4dC1ob3ZlclwiKS5jaGlsZHJlbignYScpLmZvY3VzKCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXHRcdFx0XHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0Y2FzZSAyNzpcblx0XHRcdFx0XHRcdFx0XHQkLnZha2F0YS5jb250ZXh0LmhpZGUoKTtcblx0XHRcdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhlLndoaWNoKTtcblx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KVxuXHRcdFx0XHQub24oJ2tleWRvd24nLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHR2YXIgYSA9IHZha2F0YV9jb250ZXh0LmVsZW1lbnQuZmluZCgnLnZha2F0YS1jb250ZXh0bWVudS1zaG9ydGN1dC0nICsgZS53aGljaCkucGFyZW50KCk7XG5cdFx0XHRcdFx0aWYoYS5wYXJlbnQoKS5ub3QoJy52YWthdGEtY29udGV4dC1kaXNhYmxlZCcpKSB7XG5cdFx0XHRcdFx0XHRhLm1vdXNldXAoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5hcHBlbmRUbyhcImJvZHlcIik7XG5cblx0XHRcdCQoZG9jdW1lbnQpXG5cdFx0XHRcdC5vbihcIm1vdXNlZG93blwiLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdGlmKHZha2F0YV9jb250ZXh0LmlzX3Zpc2libGUgJiYgISQuY29udGFpbnModmFrYXRhX2NvbnRleHQuZWxlbWVudFswXSwgZS50YXJnZXQpKSB7ICQudmFrYXRhLmNvbnRleHQuaGlkZSgpOyB9XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5vbihcImNvbnRleHRfc2hvdy52YWthdGFcIiwgZnVuY3Rpb24gKGUsIGRhdGEpIHtcblx0XHRcdFx0XHR2YWthdGFfY29udGV4dC5lbGVtZW50LmZpbmQoXCJsaTpoYXModWwpXCIpLmNoaWxkcmVuKFwiYVwiKS5hZGRDbGFzcyhcInZha2F0YS1jb250ZXh0LXBhcmVudFwiKTtcblx0XHRcdFx0XHRpZihyaWdodF90b19sZWZ0KSB7XG5cdFx0XHRcdFx0XHR2YWthdGFfY29udGV4dC5lbGVtZW50LmFkZENsYXNzKFwidmFrYXRhLWNvbnRleHQtcnRsXCIpLmNzcyhcImRpcmVjdGlvblwiLCBcInJ0bFwiKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gYWxzbyBhcHBseSBhIFJUTCBjbGFzcz9cblx0XHRcdFx0XHR2YWthdGFfY29udGV4dC5lbGVtZW50LmZpbmQoXCJ1bFwiKS5oaWRlKCkuZW5kKCk7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9KCQpKTtcblx0Ly8gJC5qc3RyZWUuZGVmYXVsdHMucGx1Z2lucy5wdXNoKFwiY29udGV4dG1lbnVcIik7XG5cbi8qKlxuICogIyMjIERyYWcnbidkcm9wIHBsdWdpblxuICpcbiAqIEVuYWJsZXMgZHJhZ2dpbmcgYW5kIGRyb3BwaW5nIG9mIG5vZGVzIGluIHRoZSB0cmVlLCByZXN1bHRpbmcgaW4gYSBtb3ZlIG9yIGNvcHkgb3BlcmF0aW9ucy5cbiAqL1xuXG5cdC8qKlxuXHQgKiBzdG9yZXMgYWxsIGRlZmF1bHRzIGZvciB0aGUgZHJhZyduJ2Ryb3AgcGx1Z2luXG5cdCAqIEBuYW1lICQuanN0cmVlLmRlZmF1bHRzLmRuZFxuXHQgKiBAcGx1Z2luIGRuZFxuXHQgKi9cblx0JC5qc3RyZWUuZGVmYXVsdHMuZG5kID0ge1xuXHRcdC8qKlxuXHRcdCAqIGEgYm9vbGVhbiBpbmRpY2F0aW5nIGlmIGEgY29weSBzaG91bGQgYmUgcG9zc2libGUgd2hpbGUgZHJhZ2dpbmcgKGJ5IHByZXNzaW50IHRoZSBtZXRhIGtleSBvciBDdHJsKS4gRGVmYXVsdHMgdG8gYHRydWVgLlxuXHRcdCAqIEBuYW1lICQuanN0cmVlLmRlZmF1bHRzLmRuZC5jb3B5XG5cdFx0ICogQHBsdWdpbiBkbmRcblx0XHQgKi9cblx0XHRjb3B5IDogdHJ1ZSxcblx0XHQvKipcblx0XHQgKiBhIG51bWJlciBpbmRpY2F0aW5nIGhvdyBsb25nIGEgbm9kZSBzaG91bGQgcmVtYWluIGhvdmVyZWQgd2hpbGUgZHJhZ2dpbmcgdG8gYmUgb3BlbmVkLiBEZWZhdWx0cyB0byBgNTAwYC5cblx0XHQgKiBAbmFtZSAkLmpzdHJlZS5kZWZhdWx0cy5kbmQub3Blbl90aW1lb3V0XG5cdFx0ICogQHBsdWdpbiBkbmRcblx0XHQgKi9cblx0XHRvcGVuX3RpbWVvdXQgOiA1MDAsXG5cdFx0LyoqXG5cdFx0ICogYSBmdW5jdGlvbiBpbnZva2VkIGVhY2ggdGltZSBhIG5vZGUgaXMgYWJvdXQgdG8gYmUgZHJhZ2dlZCwgaW52b2tlZCBpbiB0aGUgdHJlZSdzIHNjb3BlIGFuZCByZWNlaXZlcyB0aGUgbm9kZSBhcyBhbiBhcmd1bWVudCAtIHJldHVybiBgZmFsc2VgIHRvIHByZXZlbnQgZHJhZ2dpbmdcblx0XHQgKiBAbmFtZSAkLmpzdHJlZS5kZWZhdWx0cy5kbmQuaXNfZHJhZ2dhYmxlXG5cdFx0ICogQHBsdWdpbiBkbmRcblx0XHQgKi9cblx0XHRpc19kcmFnZ2FibGUgOiB0cnVlLFxuXHRcdC8qKlxuXHRcdCAqIGEgYm9vbGVhbiBpbmRpY2F0aW5nIGlmIGNoZWNrcyBzaG91bGQgY29uc3RhbnRseSBiZSBtYWRlIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nIHRoZSBub2RlIChhcyBvcHBvc2VkIHRvIGNoZWNraW5nIG9ubHkgb24gZHJvcCksIGRlZmF1bHQgaXMgYHRydWVgXG5cdFx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuZG5kLmNoZWNrX3doaWxlX2RyYWdnaW5nXG5cdFx0ICogQHBsdWdpbiBkbmRcblx0XHQgKi9cblx0XHRjaGVja193aGlsZV9kcmFnZ2luZyA6IHRydWVcblx0fTtcblx0Ly8gVE9ETzogbm93IGNoZWNrIHdvcmtzIGJ5IGNoZWNraW5nIGZvciBlYWNoIG5vZGUgaW5kaXZpZHVhbGx5LCBob3cgYWJvdXQgbWF4X2NoaWxkcmVuLCB1bmlxdWUsIGV0Yz9cblx0Ly8gVE9ETzogZHJvcCBzb21ld2hlcmUgZWxzZSAtIG1heWJlIGRlbW8gb25seT9cblx0JC5qc3RyZWUucGx1Z2lucy5kbmQgPSBmdW5jdGlvbiAob3B0aW9ucywgcGFyZW50KSB7XG5cdFx0dGhpcy5iaW5kID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cGFyZW50LmJpbmQuY2FsbCh0aGlzKTtcblxuXHRcdFx0dGhpcy5lbGVtZW50XG5cdFx0XHRcdC5vbignbW91c2Vkb3duIHRvdWNoc3RhcnQnLCAnLmpzdHJlZS1hbmNob3InLCAkLnByb3h5KGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdFx0dmFyIG9iaiA9IHRoaXMuZ2V0X25vZGUoZS50YXJnZXQpLFxuXHRcdFx0XHRcdFx0bWx0ID0gdGhpcy5pc19zZWxlY3RlZChvYmopID8gdGhpcy5nZXRfc2VsZWN0ZWQoKS5sZW5ndGggOiAxO1xuXHRcdFx0XHRcdGlmKG9iaiAmJiBvYmouaWQgJiYgb2JqLmlkICE9PSBcIiNcIiAmJiAoZS53aGljaCA9PT0gMSB8fCBlLnR5cGUgPT09IFwidG91Y2hzdGFydFwiKSAmJlxuXHRcdFx0XHRcdFx0KHRoaXMuc2V0dGluZ3MuZG5kLmlzX2RyYWdnYWJsZSA9PT0gdHJ1ZSB8fCAoJC5pc0Z1bmN0aW9uKHRoaXMuc2V0dGluZ3MuZG5kLmlzX2RyYWdnYWJsZSkgJiYgdGhpcy5zZXR0aW5ncy5kbmQuaXNfZHJhZ2dhYmxlLmNhbGwodGhpcywgb2JqKSkpXG5cdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQudHJpZ2dlcignbW91c2Vkb3duLmpzdHJlZScpO1xuXHRcdFx0XHRcdFx0cmV0dXJuICQudmFrYXRhLmRuZC5zdGFydChlLCB7ICdqc3RyZWUnIDogdHJ1ZSwgJ29yaWdpbicgOiB0aGlzLCAnb2JqJyA6IHRoaXMuZ2V0X25vZGUob2JqLHRydWUpLCAnbm9kZXMnIDogbWx0ID4gMSA/IHRoaXMuZ2V0X3NlbGVjdGVkKCkgOiBbb2JqLmlkXSB9LCAnPGRpdiBpZD1cImpzdHJlZS1kbmRcIiBjbGFzcz1cImpzdHJlZS0nICsgdGhpcy5nZXRfdGhlbWUoKSArICdcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1lclwiPjwvaT4nICsgKG1sdCA+IDEgPyBtbHQgKyAnICcgKyB0aGlzLmdldF9zdHJpbmcoJ25vZGVzJykgOiB0aGlzLmdldF90ZXh0KGUuY3VycmVudFRhcmdldCwgdHJ1ZSkpICsgJzxpbnMgY2xhc3M9XCJqc3RyZWUtY29weVwiIHN0eWxlPVwiZGlzcGxheTpub25lO1wiPis8L2lucz48L2Rpdj4nKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIHRoaXMpKTtcblx0XHR9O1xuXHR9O1xuXG5cdCQoZnVuY3Rpb24oKSB7XG5cdFx0Ly8gYmluZCBvbmx5IG9uY2UgZm9yIGFsbCBpbnN0YW5jZXNcblx0XHR2YXIgbGFzdG12ID0gZmFsc2UsXG5cdFx0XHRsYXN0ZXIgPSBmYWxzZSxcblx0XHRcdG9wZW50byA9IGZhbHNlLFxuXHRcdFx0bWFya2VyID0gJCgnPGRpdiBpZD1cImpzdHJlZS1tYXJrZXJcIj4mIzE2MDs8L2Rpdj4nKS5oaWRlKCkuYXBwZW5kVG8oJ2JvZHknKTtcblxuXHRcdCQoZG9jdW1lbnQpXG5cdFx0XHQuYmluZCgnZG5kX3N0YXJ0LnZha2F0YScsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XG5cdFx0XHRcdGxhc3RtdiA9IGZhbHNlO1xuXHRcdFx0fSlcblx0XHRcdC5iaW5kKCdkbmRfbW92ZS52YWthdGEnLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xuXHRcdFx0XHRpZihvcGVudG8pIHsgY2xlYXJUaW1lb3V0KG9wZW50byk7IH1cblx0XHRcdFx0aWYoIWRhdGEuZGF0YS5qc3RyZWUpIHsgcmV0dXJuOyB9XG5cblx0XHRcdFx0Ly8gaWYgd2UgYXJlIGhvdmVyaW5nIHRoZSBtYXJrZXIgaW1hZ2UgZG8gbm90aGluZyAoY2FuIGhhcHBlbiBvbiBcImluc2lkZVwiIGRyYWdzKVxuXHRcdFx0XHRpZihkYXRhLmV2ZW50LnRhcmdldC5pZCAmJiBkYXRhLmV2ZW50LnRhcmdldC5pZCA9PT0gJ2pzdHJlZS1tYXJrZXInKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGlucyA9ICQuanN0cmVlLnJlZmVyZW5jZShkYXRhLmV2ZW50LnRhcmdldCksXG5cdFx0XHRcdFx0cmVmID0gZmFsc2UsXG5cdFx0XHRcdFx0b2ZmID0gZmFsc2UsXG5cdFx0XHRcdFx0cmVsID0gZmFsc2UsXG5cdFx0XHRcdFx0bCwgdCwgaCwgcCwgaSwgbywgb2ssIHQxLCB0Miwgb3AsIHBzLCBwcjtcblx0XHRcdFx0Ly8gaWYgd2UgYXJlIG92ZXIgYW4gaW5zdGFuY2Vcblx0XHRcdFx0aWYoaW5zICYmIGlucy5fZGF0YSAmJiBpbnMuX2RhdGEuZG5kKSB7XG5cdFx0XHRcdFx0bWFya2VyLmF0dHIoJ2NsYXNzJywgJ2pzdHJlZS0nICsgaW5zLmdldF90aGVtZSgpKTtcblx0XHRcdFx0XHRkYXRhLmhlbHBlclxuXHRcdFx0XHRcdFx0LmNoaWxkcmVuKCkuYXR0cignY2xhc3MnLCAnanN0cmVlLScgKyBpbnMuZ2V0X3RoZW1lKCkpXG5cdFx0XHRcdFx0XHQuZmluZCgnLmpzdHJlZS1jb3B5OmVxKDApJylbIGRhdGEuZGF0YS5vcmlnaW4gJiYgZGF0YS5kYXRhLm9yaWdpbi5zZXR0aW5ncy5kbmQuY29weSAmJiAoZGF0YS5ldmVudC5tZXRhS2V5IHx8IGRhdGEuZXZlbnQuY3RybEtleSkgPyAnc2hvdycgOiAnaGlkZScgXSgpO1xuXG5cblx0XHRcdFx0XHQvLyBpZiBhcmUgaG92ZXJpbmcgdGhlIGNvbnRhaW5lciBpdHNlbGYgYWRkIGEgbmV3IHJvb3Qgbm9kZVxuXHRcdFx0XHRcdGlmKCAoZGF0YS5ldmVudC50YXJnZXQgPT09IGlucy5lbGVtZW50WzBdIHx8IGRhdGEuZXZlbnQudGFyZ2V0ID09PSBpbnMuZ2V0X2NvbnRhaW5lcl91bCgpWzBdKSAmJiBpbnMuZ2V0X2NvbnRhaW5lcl91bCgpLmNoaWxkcmVuKCkubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0XHRvayA9IHRydWU7XG5cdFx0XHRcdFx0XHRmb3IodDEgPSAwLCB0MiA9IGRhdGEuZGF0YS5ub2Rlcy5sZW5ndGg7IHQxIDwgdDI7IHQxKyspIHtcblx0XHRcdFx0XHRcdFx0b2sgPSBvayAmJiBpbnMuY2hlY2soIChkYXRhLmRhdGEub3JpZ2luICYmIGRhdGEuZGF0YS5vcmlnaW4uc2V0dGluZ3MuZG5kLmNvcHkgJiYgKGRhdGEuZXZlbnQubWV0YUtleSB8fCBkYXRhLmV2ZW50LmN0cmxLZXkpID8gXCJjb3B5X25vZGVcIiA6IFwibW92ZV9ub2RlXCIpLCAoZGF0YS5kYXRhLm9yaWdpbiAmJiBkYXRhLmRhdGEub3JpZ2luICE9PSBpbnMgPyBkYXRhLmRhdGEub3JpZ2luLmdldF9ub2RlKGRhdGEuZGF0YS5ub2Rlc1t0MV0pIDogZGF0YS5kYXRhLm5vZGVzW3QxXSksICcjJywgJ2xhc3QnKTtcblx0XHRcdFx0XHRcdFx0aWYoIW9rKSB7IGJyZWFrOyB9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZihvaykge1xuXHRcdFx0XHRcdFx0XHRsYXN0bXYgPSB7ICdpbnMnIDogaW5zLCAncGFyJyA6ICcjJywgJ3BvcycgOiAnbGFzdCcgfTtcblx0XHRcdFx0XHRcdFx0bWFya2VyLmhpZGUoKTtcblx0XHRcdFx0XHRcdFx0ZGF0YS5oZWxwZXIuZmluZCgnLmpzdHJlZS1pY29uOmVxKDApJykucmVtb3ZlQ2xhc3MoJ2pzdHJlZS1lcicpLmFkZENsYXNzKCdqc3RyZWUtb2snKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdC8vIGlmIHdlIGFyZSBob3ZlcmluZyBhIHRyZWUgbm9kZVxuXHRcdFx0XHRcdFx0cmVmID0gJChkYXRhLmV2ZW50LnRhcmdldCkuY2xvc2VzdCgnYScpO1xuXHRcdFx0XHRcdFx0aWYocmVmICYmIHJlZi5sZW5ndGggJiYgcmVmLnBhcmVudCgpLmlzKCcuanN0cmVlLWNsb3NlZCwgLmpzdHJlZS1vcGVuLCAuanN0cmVlLWxlYWYnKSkge1xuXHRcdFx0XHRcdFx0XHRvZmYgPSByZWYub2Zmc2V0KCk7XG5cdFx0XHRcdFx0XHRcdHJlbCA9IGRhdGEuZXZlbnQucGFnZVkgLSBvZmYudG9wO1xuXHRcdFx0XHRcdFx0XHRoID0gcmVmLmhlaWdodCgpO1xuXHRcdFx0XHRcdFx0XHRpZihyZWwgPCBoIC8gMykge1xuXHRcdFx0XHRcdFx0XHRcdG8gPSBbJ2InLCAnaScsICdhJ107XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0ZWxzZSBpZihyZWwgPiBoIC0gaCAvIDMpIHtcblx0XHRcdFx0XHRcdFx0XHRvID0gWydhJywgJ2knLCAnYiddO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdG8gPSByZWwgPiBoIC8gMiA/IFsnaScsICdhJywgJ2InXSA6IFsnaScsICdiJywgJ2EnXTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHQkLmVhY2gobywgZnVuY3Rpb24gKGosIHYpIHtcblx0XHRcdFx0XHRcdFx0XHRzd2l0Y2godikge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSAnYic6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGwgPSBvZmYubGVmdCAtIDY7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHQgPSBvZmYudG9wIC0gNTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0cCA9IGlucy5nZXRfcGFyZW50KHJlZik7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGkgPSByZWYucGFyZW50KCkuaW5kZXgoKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRjYXNlICdpJzpcblx0XHRcdFx0XHRcdFx0XHRcdFx0bCA9IG9mZi5sZWZ0IC0gMjtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dCA9IG9mZi50b3AgLSA1ICsgaCAvIDIgKyAxO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRwID0gcmVmLnBhcmVudCgpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpID0gMDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRjYXNlICdhJzpcblx0XHRcdFx0XHRcdFx0XHRcdFx0bCA9IG9mZi5sZWZ0IC0gNjtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dCA9IG9mZi50b3AgLSA1ICsgaDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0cCA9IGlucy5nZXRfcGFyZW50KHJlZik7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGkgPSByZWYucGFyZW50KCkuaW5kZXgoKSArIDE7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHQvKiFcblx0XHRcdFx0XHRcdFx0XHQvLyBUT0RPOiBtb3ZpbmcgaW5zaWRlLCBidXQgdGhlIG5vZGUgaXMgbm90IHlldCBsb2FkZWQ/XG5cdFx0XHRcdFx0XHRcdFx0Ly8gdGhlIGNoZWNrIHdpbGwgd29yayBhbnl3YXksIGFzIHdoZW4gbW92aW5nIHRoZSBub2RlIHdpbGwgYmUgbG9hZGVkIGZpcnN0IGFuZCBjaGVja2VkIGFnYWluXG5cdFx0XHRcdFx0XHRcdFx0aWYodiA9PT0gJ2knICYmICFpbnMuaXNfbG9hZGVkKHApKSB7IH1cblx0XHRcdFx0XHRcdFx0XHQqL1xuXHRcdFx0XHRcdFx0XHRcdG9rID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHRmb3IodDEgPSAwLCB0MiA9IGRhdGEuZGF0YS5ub2Rlcy5sZW5ndGg7IHQxIDwgdDI7IHQxKyspIHtcblx0XHRcdFx0XHRcdFx0XHRcdG9wID0gZGF0YS5kYXRhLm9yaWdpbiAmJiBkYXRhLmRhdGEub3JpZ2luLnNldHRpbmdzLmRuZC5jb3B5ICYmIChkYXRhLmV2ZW50Lm1ldGFLZXkgfHwgZGF0YS5ldmVudC5jdHJsS2V5KSA/IFwiY29weV9ub2RlXCIgOiBcIm1vdmVfbm9kZVwiO1xuXHRcdFx0XHRcdFx0XHRcdFx0cHMgPSBpO1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYob3AgPT09IFwibW92ZV9ub2RlXCIgJiYgdiA9PT0gJ2EnICYmIChkYXRhLmRhdGEub3JpZ2luICYmIGRhdGEuZGF0YS5vcmlnaW4gPT09IGlucykgJiYgcCA9PT0gaW5zLmdldF9wYXJlbnQoZGF0YS5kYXRhLm5vZGVzW3QxXSkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0cHIgPSBpbnMuZ2V0X25vZGUocCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmKHBzID4gJC5pbkFycmF5KGRhdGEuZGF0YS5ub2Rlc1t0MV0sIHByLmNoaWxkcmVuKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHBzIC09IDE7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdG9rID0gb2sgJiYgKCAoaW5zICYmIGlucy5zZXR0aW5ncyAmJiBpbnMuc2V0dGluZ3MuZG5kICYmIGlucy5zZXR0aW5ncy5kbmQuY2hlY2tfd2hpbGVfZHJhZ2dpbmcgPT09IGZhbHNlKSB8fCBpbnMuY2hlY2sob3AsIChkYXRhLmRhdGEub3JpZ2luICYmIGRhdGEuZGF0YS5vcmlnaW4gIT09IGlucyA/IGRhdGEuZGF0YS5vcmlnaW4uZ2V0X25vZGUoZGF0YS5kYXRhLm5vZGVzW3QxXSkgOiBkYXRhLmRhdGEubm9kZXNbdDFdKSwgcCwgcHMpICk7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZighb2spIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYoaW5zICYmIGlucy5sYXN0X2Vycm9yKSB7IGxhc3RlciA9IGlucy5sYXN0X2Vycm9yKCk7IH1cblx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdGlmKG9rKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZih2ID09PSAnaScgJiYgcmVmLnBhcmVudCgpLmlzKCcuanN0cmVlLWNsb3NlZCcpICYmIGlucy5zZXR0aW5ncy5kbmQub3Blbl90aW1lb3V0KSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdG9wZW50byA9IHNldFRpbWVvdXQoKGZ1bmN0aW9uICh4LCB6KSB7IHJldHVybiBmdW5jdGlvbiAoKSB7IHgub3Blbl9ub2RlKHopOyB9OyB9KGlucywgcmVmKSksIGlucy5zZXR0aW5ncy5kbmQub3Blbl90aW1lb3V0KTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdGxhc3RtdiA9IHsgJ2lucycgOiBpbnMsICdwYXInIDogcCwgJ3BvcycgOiBpIH07XG5cdFx0XHRcdFx0XHRcdFx0XHRtYXJrZXIuY3NzKHsgJ2xlZnQnIDogbCArICdweCcsICd0b3AnIDogdCArICdweCcgfSkuc2hvdygpO1xuXHRcdFx0XHRcdFx0XHRcdFx0ZGF0YS5oZWxwZXIuZmluZCgnLmpzdHJlZS1pY29uOmVxKDApJykucmVtb3ZlQ2xhc3MoJ2pzdHJlZS1lcicpLmFkZENsYXNzKCdqc3RyZWUtb2snKTtcblx0XHRcdFx0XHRcdFx0XHRcdGxhc3RlciA9IHt9O1xuXHRcdFx0XHRcdFx0XHRcdFx0byA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0aWYobyA9PT0gdHJ1ZSkgeyByZXR1cm47IH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0bGFzdG12ID0gZmFsc2U7XG5cdFx0XHRcdGRhdGEuaGVscGVyLmZpbmQoJy5qc3RyZWUtaWNvbicpLnJlbW92ZUNsYXNzKCdqc3RyZWUtb2snKS5hZGRDbGFzcygnanN0cmVlLWVyJyk7XG5cdFx0XHRcdG1hcmtlci5oaWRlKCk7XG5cdFx0XHR9KVxuXHRcdFx0LmJpbmQoJ2RuZF9zY3JvbGwudmFrYXRhJywgZnVuY3Rpb24gKGUsIGRhdGEpIHtcblx0XHRcdFx0aWYoIWRhdGEuZGF0YS5qc3RyZWUpIHsgcmV0dXJuOyB9XG5cdFx0XHRcdG1hcmtlci5oaWRlKCk7XG5cdFx0XHRcdGxhc3RtdiA9IGZhbHNlO1xuXHRcdFx0XHRkYXRhLmhlbHBlci5maW5kKCcuanN0cmVlLWljb246ZXEoMCknKS5yZW1vdmVDbGFzcygnanN0cmVlLW9rJykuYWRkQ2xhc3MoJ2pzdHJlZS1lcicpO1xuXHRcdFx0fSlcblx0XHRcdC5iaW5kKCdkbmRfc3RvcC52YWthdGEnLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xuXHRcdFx0XHRpZihvcGVudG8pIHsgY2xlYXJUaW1lb3V0KG9wZW50byk7IH1cblx0XHRcdFx0aWYoIWRhdGEuZGF0YS5qc3RyZWUpIHsgcmV0dXJuOyB9XG5cdFx0XHRcdG1hcmtlci5oaWRlKCk7XG5cdFx0XHRcdHZhciBpLCBqLCBub2RlcyA9IFtdO1xuXHRcdFx0XHRpZihsYXN0bXYpIHtcblx0XHRcdFx0XHRmb3IoaSA9IDAsIGogPSBkYXRhLmRhdGEubm9kZXMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdFx0XHRub2Rlc1tpXSA9IGRhdGEuZGF0YS5vcmlnaW4gPyBkYXRhLmRhdGEub3JpZ2luLmdldF9ub2RlKGRhdGEuZGF0YS5ub2Rlc1tpXSkgOiBkYXRhLmRhdGEubm9kZXNbaV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGxhc3Rtdi5pbnNbIGRhdGEuZGF0YS5vcmlnaW4gJiYgZGF0YS5kYXRhLm9yaWdpbi5zZXR0aW5ncy5kbmQuY29weSAmJiAoZGF0YS5ldmVudC5tZXRhS2V5IHx8IGRhdGEuZXZlbnQuY3RybEtleSkgPyAnY29weV9ub2RlJyA6ICdtb3ZlX25vZGUnIF0obm9kZXMsIGxhc3Rtdi5wYXIsIGxhc3Rtdi5wb3MpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGkgPSAkKGRhdGEuZXZlbnQudGFyZ2V0KS5jbG9zZXN0KCcuanN0cmVlJyk7XG5cdFx0XHRcdFx0aWYoaS5sZW5ndGggJiYgbGFzdGVyICYmIGxhc3Rlci5lcnJvciAmJiBsYXN0ZXIuZXJyb3IgPT09ICdjaGVjaycpIHtcblx0XHRcdFx0XHRcdGkgPSBpLmpzdHJlZSh0cnVlKTtcblx0XHRcdFx0XHRcdGlmKGkpIHtcblx0XHRcdFx0XHRcdFx0aS5zZXR0aW5ncy5jb3JlLmVycm9yLmNhbGwodGhpcywgbGFzdGVyKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQuYmluZCgna2V5dXAga2V5ZG93bicsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XG5cdFx0XHRcdGRhdGEgPSAkLnZha2F0YS5kbmQuX2dldCgpO1xuXHRcdFx0XHRpZihkYXRhLmRhdGEgJiYgZGF0YS5kYXRhLmpzdHJlZSkge1xuXHRcdFx0XHRcdGRhdGEuaGVscGVyLmZpbmQoJy5qc3RyZWUtY29weTplcSgwKScpWyBkYXRhLmRhdGEub3JpZ2luICYmIGRhdGEuZGF0YS5vcmlnaW4uc2V0dGluZ3MuZG5kLmNvcHkgJiYgKGUubWV0YUtleSB8fCBlLmN0cmxLZXkpID8gJ3Nob3cnIDogJ2hpZGUnIF0oKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdH0pO1xuXG5cdC8vIGhlbHBlcnNcblx0KGZ1bmN0aW9uICgkKSB7XG5cdFx0JC5mbi52YWthdGFfcmV2ZXJzZSA9IFtdLnJldmVyc2U7XG5cdFx0Ly8gcHJpdmF0ZSB2YXJpYWJsZVxuXHRcdHZhciB2YWthdGFfZG5kID0ge1xuXHRcdFx0ZWxlbWVudFx0OiBmYWxzZSxcblx0XHRcdGlzX2Rvd25cdDogZmFsc2UsXG5cdFx0XHRpc19kcmFnXHQ6IGZhbHNlLFxuXHRcdFx0aGVscGVyXHQ6IGZhbHNlLFxuXHRcdFx0aGVscGVyX3c6IDAsXG5cdFx0XHRkYXRhXHQ6IGZhbHNlLFxuXHRcdFx0aW5pdF94XHQ6IDAsXG5cdFx0XHRpbml0X3lcdDogMCxcblx0XHRcdHNjcm9sbF9sOiAwLFxuXHRcdFx0c2Nyb2xsX3Q6IDAsXG5cdFx0XHRzY3JvbGxfZTogZmFsc2UsXG5cdFx0XHRzY3JvbGxfaTogZmFsc2Vcblx0XHR9O1xuXHRcdCQudmFrYXRhLmRuZCA9IHtcblx0XHRcdHNldHRpbmdzIDoge1xuXHRcdFx0XHRzY3JvbGxfc3BlZWRcdFx0OiAxMCxcblx0XHRcdFx0c2Nyb2xsX3Byb3hpbWl0eVx0OiAyMCxcblx0XHRcdFx0aGVscGVyX2xlZnRcdFx0XHQ6IDUsXG5cdFx0XHRcdGhlbHBlcl90b3BcdFx0XHQ6IDEwLFxuXHRcdFx0XHR0aHJlc2hvbGRcdFx0XHQ6IDVcblx0XHRcdH0sXG5cdFx0XHRfdHJpZ2dlciA6IGZ1bmN0aW9uIChldmVudF9uYW1lLCBlKSB7XG5cdFx0XHRcdHZhciBkYXRhID0gJC52YWthdGEuZG5kLl9nZXQoKTtcblx0XHRcdFx0ZGF0YS5ldmVudCA9IGU7XG5cdFx0XHRcdCQoZG9jdW1lbnQpLnRyaWdnZXJIYW5kbGVyKFwiZG5kX1wiICsgZXZlbnRfbmFtZSArIFwiLnZha2F0YVwiLCBkYXRhKTtcblx0XHRcdH0sXG5cdFx0XHRfZ2V0IDogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFwiZGF0YVwiXHRcdDogdmFrYXRhX2RuZC5kYXRhLFxuXHRcdFx0XHRcdFwiZWxlbWVudFwiXHQ6IHZha2F0YV9kbmQuZWxlbWVudCxcblx0XHRcdFx0XHRcImhlbHBlclwiXHQ6IHZha2F0YV9kbmQuaGVscGVyXG5cdFx0XHRcdH07XG5cdFx0XHR9LFxuXHRcdFx0X2NsZWFuIDogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRpZih2YWthdGFfZG5kLmhlbHBlcikgeyB2YWthdGFfZG5kLmhlbHBlci5yZW1vdmUoKTsgfVxuXHRcdFx0XHRpZih2YWthdGFfZG5kLnNjcm9sbF9pKSB7IGNsZWFySW50ZXJ2YWwodmFrYXRhX2RuZC5zY3JvbGxfaSk7IHZha2F0YV9kbmQuc2Nyb2xsX2kgPSBmYWxzZTsgfVxuXHRcdFx0XHR2YWthdGFfZG5kID0ge1xuXHRcdFx0XHRcdGVsZW1lbnRcdDogZmFsc2UsXG5cdFx0XHRcdFx0aXNfZG93blx0OiBmYWxzZSxcblx0XHRcdFx0XHRpc19kcmFnXHQ6IGZhbHNlLFxuXHRcdFx0XHRcdGhlbHBlclx0OiBmYWxzZSxcblx0XHRcdFx0XHRoZWxwZXJfdzogMCxcblx0XHRcdFx0XHRkYXRhXHQ6IGZhbHNlLFxuXHRcdFx0XHRcdGluaXRfeFx0OiAwLFxuXHRcdFx0XHRcdGluaXRfeVx0OiAwLFxuXHRcdFx0XHRcdHNjcm9sbF9sOiAwLFxuXHRcdFx0XHRcdHNjcm9sbF90OiAwLFxuXHRcdFx0XHRcdHNjcm9sbF9lOiBmYWxzZSxcblx0XHRcdFx0XHRzY3JvbGxfaTogZmFsc2Vcblx0XHRcdFx0fTtcblx0XHRcdFx0JChkb2N1bWVudCkub2ZmKFwibW91c2Vtb3ZlIHRvdWNobW92ZVwiLCAkLnZha2F0YS5kbmQuZHJhZyk7XG5cdFx0XHRcdCQoZG9jdW1lbnQpLm9mZihcIm1vdXNldXAgdG91Y2hlbmRcIiwgJC52YWthdGEuZG5kLnN0b3ApO1xuXHRcdFx0fSxcblx0XHRcdF9zY3JvbGwgOiBmdW5jdGlvbiAoaW5pdF9vbmx5KSB7XG5cdFx0XHRcdGlmKCF2YWthdGFfZG5kLnNjcm9sbF9lIHx8ICghdmFrYXRhX2RuZC5zY3JvbGxfbCAmJiAhdmFrYXRhX2RuZC5zY3JvbGxfdCkpIHtcblx0XHRcdFx0XHRpZih2YWthdGFfZG5kLnNjcm9sbF9pKSB7IGNsZWFySW50ZXJ2YWwodmFrYXRhX2RuZC5zY3JvbGxfaSk7IHZha2F0YV9kbmQuc2Nyb2xsX2kgPSBmYWxzZTsgfVxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZighdmFrYXRhX2RuZC5zY3JvbGxfaSkge1xuXHRcdFx0XHRcdHZha2F0YV9kbmQuc2Nyb2xsX2kgPSBzZXRJbnRlcnZhbCgkLnZha2F0YS5kbmQuX3Njcm9sbCwgMTAwKTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoaW5pdF9vbmx5ID09PSB0cnVlKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdFx0XHRcdHZhciBpID0gdmFrYXRhX2RuZC5zY3JvbGxfZS5zY3JvbGxUb3AoKSxcblx0XHRcdFx0XHRqID0gdmFrYXRhX2RuZC5zY3JvbGxfZS5zY3JvbGxMZWZ0KCk7XG5cdFx0XHRcdHZha2F0YV9kbmQuc2Nyb2xsX2Uuc2Nyb2xsVG9wKGkgKyB2YWthdGFfZG5kLnNjcm9sbF90ICogJC52YWthdGEuZG5kLnNldHRpbmdzLnNjcm9sbF9zcGVlZCk7XG5cdFx0XHRcdHZha2F0YV9kbmQuc2Nyb2xsX2Uuc2Nyb2xsTGVmdChqICsgdmFrYXRhX2RuZC5zY3JvbGxfbCAqICQudmFrYXRhLmRuZC5zZXR0aW5ncy5zY3JvbGxfc3BlZWQpO1xuXHRcdFx0XHRpZihpICE9PSB2YWthdGFfZG5kLnNjcm9sbF9lLnNjcm9sbFRvcCgpIHx8IGogIT09IHZha2F0YV9kbmQuc2Nyb2xsX2Uuc2Nyb2xsTGVmdCgpKSB7XG5cdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0ICogdHJpZ2dlcmVkIG9uIHRoZSBkb2N1bWVudCB3aGVuIGEgZHJhZyBjYXVzZXMgYW4gZWxlbWVudCB0byBzY3JvbGxcblx0XHRcdFx0XHQgKiBAZXZlbnRcblx0XHRcdFx0XHQgKiBAcGx1Z2luIGRuZFxuXHRcdFx0XHRcdCAqIEBuYW1lIGRuZF9zY3JvbGwudmFrYXRhXG5cdFx0XHRcdFx0ICogQHBhcmFtIHtNaXhlZH0gZGF0YSBhbnkgZGF0YSBzdXBwbGllZCB3aXRoIHRoZSBjYWxsIHRvICQudmFrYXRhLmRuZC5zdGFydFxuXHRcdFx0XHRcdCAqIEBwYXJhbSB7RE9NfSBlbGVtZW50IHRoZSBET00gZWxlbWVudCBiZWluZyBkcmFnZ2VkXG5cdFx0XHRcdFx0ICogQHBhcmFtIHtqUXVlcnl9IGhlbHBlciB0aGUgaGVscGVyIHNob3duIG5leHQgdG8gdGhlIG1vdXNlXG5cdFx0XHRcdFx0ICogQHBhcmFtIHtqUXVlcnl9IGV2ZW50IHRoZSBlbGVtZW50IHRoYXQgaXMgc2Nyb2xsaW5nXG5cdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0JC52YWthdGEuZG5kLl90cmlnZ2VyKFwic2Nyb2xsXCIsIHZha2F0YV9kbmQuc2Nyb2xsX2UpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0c3RhcnQgOiBmdW5jdGlvbiAoZSwgZGF0YSwgaHRtbCkge1xuXHRcdFx0XHRpZihlLnR5cGUgPT09IFwidG91Y2hzdGFydFwiICYmIGUub3JpZ2luYWxFdmVudCAmJiBlLm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXMgJiYgZS5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdKSB7XG5cdFx0XHRcdFx0ZS5wYWdlWCA9IGUub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWDtcblx0XHRcdFx0XHRlLnBhZ2VZID0gZS5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLnBhZ2VZO1xuXHRcdFx0XHRcdGUudGFyZ2V0ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChlLm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0ucGFnZVggLSB3aW5kb3cucGFnZVhPZmZzZXQsIGUub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWSAtIHdpbmRvdy5wYWdlWU9mZnNldCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYodmFrYXRhX2RuZC5pc19kcmFnKSB7ICQudmFrYXRhLmRuZC5zdG9wKHt9KTsgfVxuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGUuY3VycmVudFRhcmdldC51bnNlbGVjdGFibGUgPSBcIm9uXCI7XG5cdFx0XHRcdFx0ZS5jdXJyZW50VGFyZ2V0Lm9uc2VsZWN0c3RhcnQgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGZhbHNlOyB9O1xuXHRcdFx0XHRcdGlmKGUuY3VycmVudFRhcmdldC5zdHlsZSkgeyBlLmN1cnJlbnRUYXJnZXQuc3R5bGUuTW96VXNlclNlbGVjdCA9IFwibm9uZVwiOyB9XG5cdFx0XHRcdH0gY2F0Y2goaWdub3JlKSB7IH1cblx0XHRcdFx0dmFrYXRhX2RuZC5pbml0X3hcdD0gZS5wYWdlWDtcblx0XHRcdFx0dmFrYXRhX2RuZC5pbml0X3lcdD0gZS5wYWdlWTtcblx0XHRcdFx0dmFrYXRhX2RuZC5kYXRhXHRcdD0gZGF0YTtcblx0XHRcdFx0dmFrYXRhX2RuZC5pc19kb3duXHQ9IHRydWU7XG5cdFx0XHRcdHZha2F0YV9kbmQuZWxlbWVudFx0PSBlLmN1cnJlbnRUYXJnZXQ7XG5cdFx0XHRcdGlmKGh0bWwgIT09IGZhbHNlKSB7XG5cdFx0XHRcdFx0dmFrYXRhX2RuZC5oZWxwZXIgPSAkKFwiPGRpdiBpZD0ndmFrYXRhLWRuZCc+PC9kaXY+XCIpLmh0bWwoaHRtbCkuY3NzKHtcblx0XHRcdFx0XHRcdFwiZGlzcGxheVwiXHRcdDogXCJibG9ja1wiLFxuXHRcdFx0XHRcdFx0XCJtYXJnaW5cIlx0XHQ6IFwiMFwiLFxuXHRcdFx0XHRcdFx0XCJwYWRkaW5nXCJcdFx0OiBcIjBcIixcblx0XHRcdFx0XHRcdFwicG9zaXRpb25cIlx0XHQ6IFwiYWJzb2x1dGVcIixcblx0XHRcdFx0XHRcdFwidG9wXCJcdFx0XHQ6IFwiLTIwMDBweFwiLFxuXHRcdFx0XHRcdFx0XCJsaW5lSGVpZ2h0XCJcdDogXCIxNnB4XCIsXG5cdFx0XHRcdFx0XHRcInpJbmRleFwiXHRcdDogXCIxMDAwMFwiXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0JChkb2N1bWVudCkuYmluZChcIm1vdXNlbW92ZSB0b3VjaG1vdmVcIiwgJC52YWthdGEuZG5kLmRyYWcpO1xuXHRcdFx0XHQkKGRvY3VtZW50KS5iaW5kKFwibW91c2V1cCB0b3VjaGVuZFwiLCAkLnZha2F0YS5kbmQuc3RvcCk7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH0sXG5cdFx0XHRkcmFnIDogZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0aWYoZS50eXBlID09PSBcInRvdWNobW92ZVwiICYmIGUub3JpZ2luYWxFdmVudCAmJiBlLm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXMgJiYgZS5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdKSB7XG5cdFx0XHRcdFx0ZS5wYWdlWCA9IGUub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWDtcblx0XHRcdFx0XHRlLnBhZ2VZID0gZS5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLnBhZ2VZO1xuXHRcdFx0XHRcdGUudGFyZ2V0ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChlLm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0ucGFnZVggLSB3aW5kb3cucGFnZVhPZmZzZXQsIGUub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWSAtIHdpbmRvdy5wYWdlWU9mZnNldCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoIXZha2F0YV9kbmQuaXNfZG93bikgeyByZXR1cm47IH1cblx0XHRcdFx0aWYoIXZha2F0YV9kbmQuaXNfZHJhZykge1xuXHRcdFx0XHRcdGlmKFxuXHRcdFx0XHRcdFx0TWF0aC5hYnMoZS5wYWdlWCAtIHZha2F0YV9kbmQuaW5pdF94KSA+ICQudmFrYXRhLmRuZC5zZXR0aW5ncy50aHJlc2hvbGQgfHxcblx0XHRcdFx0XHRcdE1hdGguYWJzKGUucGFnZVkgLSB2YWthdGFfZG5kLmluaXRfeSkgPiAkLnZha2F0YS5kbmQuc2V0dGluZ3MudGhyZXNob2xkXG5cdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHRpZih2YWthdGFfZG5kLmhlbHBlcikge1xuXHRcdFx0XHRcdFx0XHR2YWthdGFfZG5kLmhlbHBlci5hcHBlbmRUbyhcImJvZHlcIik7XG5cdFx0XHRcdFx0XHRcdHZha2F0YV9kbmQuaGVscGVyX3cgPSB2YWthdGFfZG5kLmhlbHBlci5vdXRlcldpZHRoKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR2YWthdGFfZG5kLmlzX2RyYWcgPSB0cnVlO1xuXHRcdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0XHQgKiB0cmlnZ2VyZWQgb24gdGhlIGRvY3VtZW50IHdoZW4gYSBkcmFnIHN0YXJ0c1xuXHRcdFx0XHRcdFx0ICogQGV2ZW50XG5cdFx0XHRcdFx0XHQgKiBAcGx1Z2luIGRuZFxuXHRcdFx0XHRcdFx0ICogQG5hbWUgZG5kX3N0YXJ0LnZha2F0YVxuXHRcdFx0XHRcdFx0ICogQHBhcmFtIHtNaXhlZH0gZGF0YSBhbnkgZGF0YSBzdXBwbGllZCB3aXRoIHRoZSBjYWxsIHRvICQudmFrYXRhLmRuZC5zdGFydFxuXHRcdFx0XHRcdFx0ICogQHBhcmFtIHtET019IGVsZW1lbnQgdGhlIERPTSBlbGVtZW50IGJlaW5nIGRyYWdnZWRcblx0XHRcdFx0XHRcdCAqIEBwYXJhbSB7alF1ZXJ5fSBoZWxwZXIgdGhlIGhlbHBlciBzaG93biBuZXh0IHRvIHRoZSBtb3VzZVxuXHRcdFx0XHRcdFx0ICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IHRoZSBldmVudCB0aGF0IGNhdXNlZCB0aGUgc3RhcnQgKHByb2JhYmx5IG1vdXNlbW92ZSlcblx0XHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdFx0JC52YWthdGEuZG5kLl90cmlnZ2VyKFwic3RhcnRcIiwgZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgeyByZXR1cm47IH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBkICA9IGZhbHNlLCB3ICA9IGZhbHNlLFxuXHRcdFx0XHRcdGRoID0gZmFsc2UsIHdoID0gZmFsc2UsXG5cdFx0XHRcdFx0ZHcgPSBmYWxzZSwgd3cgPSBmYWxzZSxcblx0XHRcdFx0XHRkdCA9IGZhbHNlLCBkbCA9IGZhbHNlLFxuXHRcdFx0XHRcdGh0ID0gZmFsc2UsIGhsID0gZmFsc2U7XG5cblx0XHRcdFx0dmFrYXRhX2RuZC5zY3JvbGxfdCA9IDA7XG5cdFx0XHRcdHZha2F0YV9kbmQuc2Nyb2xsX2wgPSAwO1xuXHRcdFx0XHR2YWthdGFfZG5kLnNjcm9sbF9lID0gZmFsc2U7XG5cdFx0XHRcdCQoZS50YXJnZXQpXG5cdFx0XHRcdFx0LnBhcmVudHNVbnRpbChcImJvZHlcIikuYWRkQmFjaygpLnZha2F0YV9yZXZlcnNlKClcblx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdHJldHVyblx0KC9eYXV0b3xzY3JvbGwkLykudGVzdCgkKHRoaXMpLmNzcyhcIm92ZXJmbG93XCIpKSAmJlxuXHRcdFx0XHRcdFx0XHRcdCh0aGlzLnNjcm9sbEhlaWdodCA+IHRoaXMub2Zmc2V0SGVpZ2h0IHx8IHRoaXMuc2Nyb2xsV2lkdGggPiB0aGlzLm9mZnNldFdpZHRoKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5lYWNoKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdHZhciB0ID0gJCh0aGlzKSwgbyA9IHQub2Zmc2V0KCk7XG5cdFx0XHRcdFx0XHRpZih0aGlzLnNjcm9sbEhlaWdodCA+IHRoaXMub2Zmc2V0SGVpZ2h0KSB7XG5cdFx0XHRcdFx0XHRcdGlmKG8udG9wICsgdC5oZWlnaHQoKSAtIGUucGFnZVkgPCAkLnZha2F0YS5kbmQuc2V0dGluZ3Muc2Nyb2xsX3Byb3hpbWl0eSlcdHsgdmFrYXRhX2RuZC5zY3JvbGxfdCA9IDE7IH1cblx0XHRcdFx0XHRcdFx0aWYoZS5wYWdlWSAtIG8udG9wIDwgJC52YWthdGEuZG5kLnNldHRpbmdzLnNjcm9sbF9wcm94aW1pdHkpXHRcdFx0XHR7IHZha2F0YV9kbmQuc2Nyb2xsX3QgPSAtMTsgfVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0aWYodGhpcy5zY3JvbGxXaWR0aCA+IHRoaXMub2Zmc2V0V2lkdGgpIHtcblx0XHRcdFx0XHRcdFx0aWYoby5sZWZ0ICsgdC53aWR0aCgpIC0gZS5wYWdlWCA8ICQudmFrYXRhLmRuZC5zZXR0aW5ncy5zY3JvbGxfcHJveGltaXR5KVx0eyB2YWthdGFfZG5kLnNjcm9sbF9sID0gMTsgfVxuXHRcdFx0XHRcdFx0XHRpZihlLnBhZ2VYIC0gby5sZWZ0IDwgJC52YWthdGEuZG5kLnNldHRpbmdzLnNjcm9sbF9wcm94aW1pdHkpXHRcdFx0XHR7IHZha2F0YV9kbmQuc2Nyb2xsX2wgPSAtMTsgfVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0aWYodmFrYXRhX2RuZC5zY3JvbGxfdCB8fCB2YWthdGFfZG5kLnNjcm9sbF9sKSB7XG5cdFx0XHRcdFx0XHRcdHZha2F0YV9kbmQuc2Nyb2xsX2UgPSAkKHRoaXMpO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aWYoIXZha2F0YV9kbmQuc2Nyb2xsX2UpIHtcblx0XHRcdFx0XHRkICA9ICQoZG9jdW1lbnQpOyB3ID0gJCh3aW5kb3cpO1xuXHRcdFx0XHRcdGRoID0gZC5oZWlnaHQoKTsgd2ggPSB3LmhlaWdodCgpO1xuXHRcdFx0XHRcdGR3ID0gZC53aWR0aCgpOyB3dyA9IHcud2lkdGgoKTtcblx0XHRcdFx0XHRkdCA9IGQuc2Nyb2xsVG9wKCk7IGRsID0gZC5zY3JvbGxMZWZ0KCk7XG5cdFx0XHRcdFx0aWYoZGggPiB3aCAmJiBlLnBhZ2VZIC0gZHQgPCAkLnZha2F0YS5kbmQuc2V0dGluZ3Muc2Nyb2xsX3Byb3hpbWl0eSlcdFx0eyB2YWthdGFfZG5kLnNjcm9sbF90ID0gLTE7ICB9XG5cdFx0XHRcdFx0aWYoZGggPiB3aCAmJiB3aCAtIChlLnBhZ2VZIC0gZHQpIDwgJC52YWthdGEuZG5kLnNldHRpbmdzLnNjcm9sbF9wcm94aW1pdHkpXHR7IHZha2F0YV9kbmQuc2Nyb2xsX3QgPSAxOyB9XG5cdFx0XHRcdFx0aWYoZHcgPiB3dyAmJiBlLnBhZ2VYIC0gZGwgPCAkLnZha2F0YS5kbmQuc2V0dGluZ3Muc2Nyb2xsX3Byb3hpbWl0eSlcdFx0eyB2YWthdGFfZG5kLnNjcm9sbF9sID0gLTE7IH1cblx0XHRcdFx0XHRpZihkdyA+IHd3ICYmIHd3IC0gKGUucGFnZVggLSBkbCkgPCAkLnZha2F0YS5kbmQuc2V0dGluZ3Muc2Nyb2xsX3Byb3hpbWl0eSlcdHsgdmFrYXRhX2RuZC5zY3JvbGxfbCA9IDE7IH1cblx0XHRcdFx0XHRpZih2YWthdGFfZG5kLnNjcm9sbF90IHx8IHZha2F0YV9kbmQuc2Nyb2xsX2wpIHtcblx0XHRcdFx0XHRcdHZha2F0YV9kbmQuc2Nyb2xsX2UgPSBkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRpZih2YWthdGFfZG5kLnNjcm9sbF9lKSB7ICQudmFrYXRhLmRuZC5fc2Nyb2xsKHRydWUpOyB9XG5cblx0XHRcdFx0aWYodmFrYXRhX2RuZC5oZWxwZXIpIHtcblx0XHRcdFx0XHRodCA9IHBhcnNlSW50KGUucGFnZVkgKyAkLnZha2F0YS5kbmQuc2V0dGluZ3MuaGVscGVyX3RvcCwgMTApO1xuXHRcdFx0XHRcdGhsID0gcGFyc2VJbnQoZS5wYWdlWCArICQudmFrYXRhLmRuZC5zZXR0aW5ncy5oZWxwZXJfbGVmdCwgMTApO1xuXHRcdFx0XHRcdGlmKGRoICYmIGh0ICsgMjUgPiBkaCkgeyBodCA9IGRoIC0gNTA7IH1cblx0XHRcdFx0XHRpZihkdyAmJiBobCArIHZha2F0YV9kbmQuaGVscGVyX3cgPiBkdykgeyBobCA9IGR3IC0gKHZha2F0YV9kbmQuaGVscGVyX3cgKyAyKTsgfVxuXHRcdFx0XHRcdHZha2F0YV9kbmQuaGVscGVyLmNzcyh7XG5cdFx0XHRcdFx0XHRsZWZ0XHQ6IGhsICsgXCJweFwiLFxuXHRcdFx0XHRcdFx0dG9wXHRcdDogaHQgKyBcInB4XCJcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0XHQvKipcblx0XHRcdFx0ICogdHJpZ2dlcmVkIG9uIHRoZSBkb2N1bWVudCB3aGVuIGEgZHJhZyBpcyBpbiBwcm9ncmVzc1xuXHRcdFx0XHQgKiBAZXZlbnRcblx0XHRcdFx0ICogQHBsdWdpbiBkbmRcblx0XHRcdFx0ICogQG5hbWUgZG5kX21vdmUudmFrYXRhXG5cdFx0XHRcdCAqIEBwYXJhbSB7TWl4ZWR9IGRhdGEgYW55IGRhdGEgc3VwcGxpZWQgd2l0aCB0aGUgY2FsbCB0byAkLnZha2F0YS5kbmQuc3RhcnRcblx0XHRcdFx0ICogQHBhcmFtIHtET019IGVsZW1lbnQgdGhlIERPTSBlbGVtZW50IGJlaW5nIGRyYWdnZWRcblx0XHRcdFx0ICogQHBhcmFtIHtqUXVlcnl9IGhlbHBlciB0aGUgaGVscGVyIHNob3duIG5leHQgdG8gdGhlIG1vdXNlXG5cdFx0XHRcdCAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCB0aGUgZXZlbnQgdGhhdCBjYXVzZWQgdGhpcyB0byB0cmlnZ2VyIChtb3N0IGxpa2VseSBtb3VzZW1vdmUpXG5cdFx0XHRcdCAqL1xuXHRcdFx0XHQkLnZha2F0YS5kbmQuX3RyaWdnZXIoXCJtb3ZlXCIsIGUpO1xuXHRcdFx0fSxcblx0XHRcdHN0b3AgOiBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRpZihlLnR5cGUgPT09IFwidG91Y2hlbmRcIiAmJiBlLm9yaWdpbmFsRXZlbnQgJiYgZS5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzICYmIGUub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXSkge1xuXHRcdFx0XHRcdGUucGFnZVggPSBlLm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0ucGFnZVg7XG5cdFx0XHRcdFx0ZS5wYWdlWSA9IGUub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWTtcblx0XHRcdFx0XHRlLnRhcmdldCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZS5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLnBhZ2VYIC0gd2luZG93LnBhZ2VYT2Zmc2V0LCBlLm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0ucGFnZVkgLSB3aW5kb3cucGFnZVlPZmZzZXQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKHZha2F0YV9kbmQuaXNfZHJhZykge1xuXHRcdFx0XHRcdC8qKlxuXHRcdFx0XHRcdCAqIHRyaWdnZXJlZCBvbiB0aGUgZG9jdW1lbnQgd2hlbiBhIGRyYWcgc3RvcHMgKHRoZSBkcmFnZ2VkIGVsZW1lbnQgaXMgZHJvcHBlZClcblx0XHRcdFx0XHQgKiBAZXZlbnRcblx0XHRcdFx0XHQgKiBAcGx1Z2luIGRuZFxuXHRcdFx0XHRcdCAqIEBuYW1lIGRuZF9zdG9wLnZha2F0YVxuXHRcdFx0XHRcdCAqIEBwYXJhbSB7TWl4ZWR9IGRhdGEgYW55IGRhdGEgc3VwcGxpZWQgd2l0aCB0aGUgY2FsbCB0byAkLnZha2F0YS5kbmQuc3RhcnRcblx0XHRcdFx0XHQgKiBAcGFyYW0ge0RPTX0gZWxlbWVudCB0aGUgRE9NIGVsZW1lbnQgYmVpbmcgZHJhZ2dlZFxuXHRcdFx0XHRcdCAqIEBwYXJhbSB7alF1ZXJ5fSBoZWxwZXIgdGhlIGhlbHBlciBzaG93biBuZXh0IHRvIHRoZSBtb3VzZVxuXHRcdFx0XHRcdCAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCB0aGUgZXZlbnQgdGhhdCBjYXVzZWQgdGhlIHN0b3Bcblx0XHRcdFx0XHQgKi9cblx0XHRcdFx0XHQkLnZha2F0YS5kbmQuX3RyaWdnZXIoXCJzdG9wXCIsIGUpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCQudmFrYXRhLmRuZC5fY2xlYW4oKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9KGpRdWVyeSkpO1xuXG5cdC8vIGluY2x1ZGUgdGhlIGRuZCBwbHVnaW4gYnkgZGVmYXVsdFxuXHQvLyAkLmpzdHJlZS5kZWZhdWx0cy5wbHVnaW5zLnB1c2goXCJkbmRcIik7XG5cblxuLyoqXG4gKiAjIyMgU2VhcmNoIHBsdWdpblxuICpcbiAqIEFkZHMgc2VhcmNoIGZ1bmN0aW9uYWxpdHkgdG8ganNUcmVlLlxuICovXG5cblx0LyoqXG5cdCAqIHN0b3JlcyBhbGwgZGVmYXVsdHMgZm9yIHRoZSBzZWFyY2ggcGx1Z2luXG5cdCAqIEBuYW1lICQuanN0cmVlLmRlZmF1bHRzLnNlYXJjaFxuXHQgKiBAcGx1Z2luIHNlYXJjaFxuXHQgKi9cblx0JC5qc3RyZWUuZGVmYXVsdHMuc2VhcmNoID0ge1xuXHRcdC8qKlxuXHRcdCAqIGEgalF1ZXJ5LWxpa2UgQUpBWCBjb25maWcsIHdoaWNoIGpzdHJlZSB1c2VzIGlmIGEgc2VydmVyIHNob3VsZCBiZSBxdWVyaWVkIGZvciByZXN1bHRzLiBcblx0XHQgKiBcblx0XHQgKiBBIGBzdHJgICh3aGljaCBpcyB0aGUgc2VhcmNoIHN0cmluZykgcGFyYW1ldGVyIHdpbGwgYmUgYWRkZWQgd2l0aCB0aGUgcmVxdWVzdC4gVGhlIGV4cGVjdGVkIHJlc3VsdCBpcyBhIEpTT04gYXJyYXkgd2l0aCBub2RlcyB0aGF0IG5lZWQgdG8gYmUgb3BlbmVkIHNvIHRoYXQgbWF0Y2hpbmcgbm9kZXMgd2lsbCBiZSByZXZlYWxlZC5cblx0XHQgKiBMZWF2ZSB0aGlzIHNldHRpbmcgYXMgYGZhbHNlYCB0byBub3QgcXVlcnkgdGhlIHNlcnZlci5cblx0XHQgKiBAbmFtZSAkLmpzdHJlZS5kZWZhdWx0cy5zZWFyY2guYWpheFxuXHRcdCAqIEBwbHVnaW4gc2VhcmNoXG5cdFx0ICovXG5cdFx0YWpheCA6IGZhbHNlLFxuXHRcdC8qKlxuXHRcdCAqIEluZGljYXRlcyBpZiB0aGUgc2VhcmNoIHNob3VsZCBiZSBmdXp6eSBvciBub3QgKHNob3VsZCBgY2huZDNgIG1hdGNoIGBjaGlsZCBub2RlIDNgKS4gRGVmYXVsdCBpcyBgdHJ1ZWAuXG5cdFx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuc2VhcmNoLmZ1enp5XG5cdFx0ICogQHBsdWdpbiBzZWFyY2hcblx0XHQgKi9cblx0XHRmdXp6eSA6IHRydWUsXG5cdFx0LyoqXG5cdFx0ICogSW5kaWNhdGVzIGlmIHRoZSBzZWFyY2ggc2hvdWxkIGJlIGNhc2Ugc2Vuc2l0aXZlLiBEZWZhdWx0IGlzIGBmYWxzZWAuXG5cdFx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuc2VhcmNoLmNhc2Vfc2Vuc2l0aXZlXG5cdFx0ICogQHBsdWdpbiBzZWFyY2hcblx0XHQgKi9cblx0XHRjYXNlX3NlbnNpdGl2ZSA6IGZhbHNlLFxuXHRcdC8qKlxuXHRcdCAqIEluZGljYXRlcyBpZiB0aGUgdHJlZSBzaG91bGQgYmUgZmlsdGVyZWQgdG8gc2hvdyBvbmx5IG1hdGNoaW5nIG5vZGVzIChrZWVwIGluIG1pbmQgdGhpcyBjYW4gYmUgYSBoZWF2eSBvbiBsYXJnZSB0cmVlcyBpbiBvbGQgYnJvd3NlcnMpLiBEZWZhdWx0IGlzIGBmYWxzZWAuXG5cdFx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuc2VhcmNoLnNob3dfb25seV9tYXRjaGVzXG5cdFx0ICogQHBsdWdpbiBzZWFyY2hcblx0XHQgKi9cblx0XHRzaG93X29ubHlfbWF0Y2hlcyA6IGZhbHNlLFxuXHRcdC8qKlxuXHRcdCAqIEluZGljYXRlcyBpZiBhbGwgbm9kZXMgb3BlbmVkIHRvIHJldmVhbCB0aGUgc2VhcmNoIHJlc3VsdCwgc2hvdWxkIGJlIGNsb3NlZCB3aGVuIHRoZSBzZWFyY2ggaXMgY2xlYXJlZCBvciBhIG5ldyBzZWFyY2ggaXMgcGVyZm9ybWVkLiBEZWZhdWx0IGlzIGB0cnVlYC5cblx0XHQgKiBAbmFtZSAkLmpzdHJlZS5kZWZhdWx0cy5zZWFyY2guY2xvc2Vfb3BlbmVkX29uY2xlYXJcblx0XHQgKiBAcGx1Z2luIHNlYXJjaFxuXHRcdCAqL1xuXHRcdGNsb3NlX29wZW5lZF9vbmNsZWFyIDogdHJ1ZVxuXHR9O1xuXG5cdCQuanN0cmVlLnBsdWdpbnMuc2VhcmNoID0gZnVuY3Rpb24gKG9wdGlvbnMsIHBhcmVudCkge1xuXHRcdHRoaXMuYmluZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHBhcmVudC5iaW5kLmNhbGwodGhpcyk7XG5cblx0XHRcdHRoaXMuX2RhdGEuc2VhcmNoLnN0ciA9IFwiXCI7XG5cdFx0XHR0aGlzLl9kYXRhLnNlYXJjaC5kb20gPSAkKCk7XG5cdFx0XHR0aGlzLl9kYXRhLnNlYXJjaC5yZXMgPSBbXTtcblx0XHRcdHRoaXMuX2RhdGEuc2VhcmNoLm9wbiA9IFtdO1xuXHRcdFx0dGhpcy5fZGF0YS5zZWFyY2guc2xuID0gbnVsbDtcblxuXHRcdFx0aWYodGhpcy5zZXR0aW5ncy5zZWFyY2guc2hvd19vbmx5X21hdGNoZXMpIHtcblx0XHRcdFx0dGhpcy5lbGVtZW50XG5cdFx0XHRcdFx0Lm9uKFwic2VhcmNoLmpzdHJlZVwiLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xuXHRcdFx0XHRcdFx0aWYoZGF0YS5ub2Rlcy5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdFx0JCh0aGlzKS5maW5kKFwibGlcIikuaGlkZSgpLmZpbHRlcignLmpzdHJlZS1sYXN0JykuZmlsdGVyKGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5uZXh0U2libGluZzsgfSkucmVtb3ZlQ2xhc3MoJ2pzdHJlZS1sYXN0Jyk7XG5cdFx0XHRcdFx0XHRcdGRhdGEubm9kZXMucGFyZW50c1VudGlsKFwiLmpzdHJlZVwiKS5hZGRCYWNrKCkuc2hvdygpXG5cdFx0XHRcdFx0XHRcdFx0LmZpbHRlcihcInVsXCIpLmVhY2goZnVuY3Rpb24gKCkgeyAkKHRoaXMpLmNoaWxkcmVuKFwibGk6dmlzaWJsZVwiKS5lcSgtMSkuYWRkQ2xhc3MoXCJqc3RyZWUtbGFzdFwiKTsgfSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQub24oXCJjbGVhcl9zZWFyY2guanN0cmVlXCIsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XG5cdFx0XHRcdFx0XHRpZihkYXRhLm5vZGVzLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0XHQkKHRoaXMpLmZpbmQoXCJsaVwiKS5jc3MoXCJkaXNwbGF5XCIsXCJcIikuZmlsdGVyKCcuanN0cmVlLWxhc3QnKS5maWx0ZXIoZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLm5leHRTaWJsaW5nOyB9KS5yZW1vdmVDbGFzcygnanN0cmVlLWxhc3QnKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdC8qKlxuXHRcdCAqIHVzZWQgdG8gc2VhcmNoIHRoZSB0cmVlIG5vZGVzIGZvciBhIGdpdmVuIHN0cmluZ1xuXHRcdCAqIEBuYW1lIHNlYXJjaChzdHIgWywgc2tpcF9hc3luY10pXG5cdFx0ICogQHBhcmFtIHtTdHJpbmd9IHN0ciB0aGUgc2VhcmNoIHN0cmluZ1xuXHRcdCAqIEBwYXJhbSB7Qm9vbGVhbn0gc2tpcF9hc3luYyBpZiBzZXQgdG8gdHJ1ZSBzZXJ2ZXIgd2lsbCBub3QgYmUgcXVlcmllZCBldmVuIGlmIGNvbmZpZ3VyZWRcblx0XHQgKiBAcGx1Z2luIHNlYXJjaFxuXHRcdCAqIEB0cmlnZ2VyIHNlYXJjaC5qc3RyZWVcblx0XHQgKi9cblx0XHR0aGlzLnNlYXJjaCA9IGZ1bmN0aW9uIChzdHIsIHNraXBfYXN5bmMpIHtcblx0XHRcdGlmKHN0ciA9PT0gZmFsc2UgfHwgJC50cmltKHN0cikgPT09IFwiXCIpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuY2xlYXJfc2VhcmNoKCk7XG5cdFx0XHR9XG5cdFx0XHR2YXIgcyA9IHRoaXMuc2V0dGluZ3Muc2VhcmNoLFxuXHRcdFx0XHRhID0gcy5hamF4ID8gJC5leHRlbmQoe30sIHMuYWpheCkgOiBmYWxzZSxcblx0XHRcdFx0ZiA9IG51bGwsXG5cdFx0XHRcdHIgPSBbXSxcblx0XHRcdFx0cCA9IFtdLCBpLCBqO1xuXHRcdFx0aWYodGhpcy5fZGF0YS5zZWFyY2gucmVzLmxlbmd0aCkge1xuXHRcdFx0XHR0aGlzLmNsZWFyX3NlYXJjaCgpO1xuXHRcdFx0fVxuXHRcdFx0aWYoIXNraXBfYXN5bmMgJiYgYSAhPT0gZmFsc2UpIHtcblx0XHRcdFx0aWYoIWEuZGF0YSkgeyBhLmRhdGEgPSB7fTsgfVxuXHRcdFx0XHRhLmRhdGEuc3RyID0gc3RyO1xuXHRcdFx0XHRyZXR1cm4gJC5hamF4KGEpXG5cdFx0XHRcdFx0LmZhaWwoJC5wcm94eShmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHR0aGlzLl9kYXRhLmNvcmUubGFzdF9lcnJvciA9IHsgJ2Vycm9yJyA6ICdhamF4JywgJ3BsdWdpbicgOiAnc2VhcmNoJywgJ2lkJyA6ICdzZWFyY2hfMDEnLCAncmVhc29uJyA6ICdDb3VsZCBub3QgbG9hZCBzZWFyY2ggcGFyZW50cycsICdkYXRhJyA6IEpTT04uc3RyaW5naWZ5KGEpIH07XG5cdFx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLmNvcmUuZXJyb3IuY2FsbCh0aGlzLCB0aGlzLl9kYXRhLmNvcmUubGFzdF9lcnJvcik7XG5cdFx0XHRcdFx0fSwgdGhpcykpXG5cdFx0XHRcdFx0LmRvbmUoJC5wcm94eShmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRcdFx0aWYoZCAmJiBkLmQpIHsgZCA9IGQuZDsgfVxuXHRcdFx0XHRcdFx0dGhpcy5fZGF0YS5zZWFyY2guc2xuID0gISQuaXNBcnJheShkKSA/IFtdIDogZDtcblx0XHRcdFx0XHRcdHRoaXMuX3NlYXJjaF9sb2FkKHN0cik7XG5cdFx0XHRcdFx0fSwgdGhpcykpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5fZGF0YS5zZWFyY2guc3RyID0gc3RyO1xuXHRcdFx0dGhpcy5fZGF0YS5zZWFyY2guZG9tID0gJCgpO1xuXHRcdFx0dGhpcy5fZGF0YS5zZWFyY2gucmVzID0gW107XG5cdFx0XHR0aGlzLl9kYXRhLnNlYXJjaC5vcG4gPSBbXTtcblxuXHRcdFx0ZiA9IG5ldyAkLnZha2F0YS5zZWFyY2goc3RyLCB0cnVlLCB7IGNhc2VTZW5zaXRpdmUgOiBzLmNhc2Vfc2Vuc2l0aXZlLCBmdXp6eSA6IHMuZnV6enkgfSk7XG5cblx0XHRcdCQuZWFjaCh0aGlzLl9tb2RlbC5kYXRhLCBmdW5jdGlvbiAoaSwgdikge1xuXHRcdFx0XHRpZih2LnRleHQgJiYgZi5zZWFyY2godi50ZXh0KS5pc01hdGNoKSB7XG5cdFx0XHRcdFx0ci5wdXNoKGkpO1xuXHRcdFx0XHRcdHAgPSBwLmNvbmNhdCh2LnBhcmVudHMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdGlmKHIubGVuZ3RoKSB7XG5cdFx0XHRcdHAgPSAkLnZha2F0YS5hcnJheV91bmlxdWUocCk7XG5cdFx0XHRcdHRoaXMuX3NlYXJjaF9vcGVuKHApO1xuXHRcdFx0XHRmb3IoaSA9IDAsIGogPSByLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRcdGYgPSB0aGlzLmdldF9ub2RlKHJbaV0sIHRydWUpO1xuXHRcdFx0XHRcdGlmKGYpIHtcblx0XHRcdFx0XHRcdHRoaXMuX2RhdGEuc2VhcmNoLmRvbSA9IHRoaXMuX2RhdGEuc2VhcmNoLmRvbS5hZGQoZik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuX2RhdGEuc2VhcmNoLnJlcyA9IHI7XG5cdFx0XHRcdHRoaXMuX2RhdGEuc2VhcmNoLmRvbS5jaGlsZHJlbihcIi5qc3RyZWUtYW5jaG9yXCIpLmFkZENsYXNzKCdqc3RyZWUtc2VhcmNoJyk7XG5cdFx0XHR9XG5cdFx0XHQvKipcblx0XHRcdCAqIHRyaWdnZXJlZCBhZnRlciBzZWFyY2ggaXMgY29tcGxldGVcblx0XHRcdCAqIEBldmVudFxuXHRcdFx0ICogQG5hbWUgc2VhcmNoLmpzdHJlZVxuXHRcdFx0ICogQHBhcmFtIHtqUXVlcnl9IG5vZGVzIGEgalF1ZXJ5IGNvbGxlY3Rpb24gb2YgbWF0Y2hpbmcgbm9kZXNcblx0XHRcdCAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgdGhlIHNlYXJjaCBzdHJpbmdcblx0XHRcdCAqIEBwYXJhbSB7QXJyYXl9IHJlcyBhIGNvbGxlY3Rpb24gb2Ygb2JqZWN0cyByZXByZXNlaW5nIHRoZSBtYXRjaGluZyBub2Rlc1xuXHRcdFx0ICogQHBsdWdpbiBzZWFyY2hcblx0XHRcdCAqL1xuXHRcdFx0dGhpcy50cmlnZ2VyKCdzZWFyY2gnLCB7IG5vZGVzIDogdGhpcy5fZGF0YS5zZWFyY2guZG9tLCBzdHIgOiBzdHIsIHJlcyA6IHRoaXMuX2RhdGEuc2VhcmNoLnJlcyB9KTtcblx0XHR9O1xuXHRcdC8qKlxuXHRcdCAqIHVzZWQgdG8gY2xlYXIgdGhlIGxhc3Qgc2VhcmNoIChyZW1vdmVzIGNsYXNzZXMgYW5kIHNob3dzIGFsbCBub2RlcyBpZiBmaWx0ZXJpbmcgaXMgb24pXG5cdFx0ICogQG5hbWUgY2xlYXJfc2VhcmNoKClcblx0XHQgKiBAcGx1Z2luIHNlYXJjaFxuXHRcdCAqIEB0cmlnZ2VyIGNsZWFyX3NlYXJjaC5qc3RyZWVcblx0XHQgKi9cblx0XHR0aGlzLmNsZWFyX3NlYXJjaCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHRoaXMuX2RhdGEuc2VhcmNoLmRvbS5jaGlsZHJlbihcIi5qc3RyZWUtYW5jaG9yXCIpLnJlbW92ZUNsYXNzKFwianN0cmVlLXNlYXJjaFwiKTtcblx0XHRcdGlmKHRoaXMuc2V0dGluZ3Muc2VhcmNoLmNsb3NlX29wZW5lZF9vbmNsZWFyKSB7XG5cdFx0XHRcdHRoaXMuY2xvc2Vfbm9kZSh0aGlzLl9kYXRhLnNlYXJjaC5vcG4sIDApO1xuXHRcdFx0fVxuXHRcdFx0LyoqXG5cdFx0XHQgKiB0cmlnZ2VyZWQgYWZ0ZXIgc2VhcmNoIGlzIGNvbXBsZXRlXG5cdFx0XHQgKiBAZXZlbnRcblx0XHRcdCAqIEBuYW1lIGNsZWFyX3NlYXJjaC5qc3RyZWVcblx0XHRcdCAqIEBwYXJhbSB7alF1ZXJ5fSBub2RlcyBhIGpRdWVyeSBjb2xsZWN0aW9uIG9mIG1hdGNoaW5nIG5vZGVzICh0aGUgcmVzdWx0IGZyb20gdGhlIGxhc3Qgc2VhcmNoKVxuXHRcdFx0ICogQHBhcmFtIHtTdHJpbmd9IHN0ciB0aGUgc2VhcmNoIHN0cmluZyAodGhlIGxhc3Qgc2VhcmNoIHN0cmluZylcblx0XHRcdCAqIEBwYXJhbSB7QXJyYXl9IHJlcyBhIGNvbGxlY3Rpb24gb2Ygb2JqZWN0cyByZXByZXNlaW5nIHRoZSBtYXRjaGluZyBub2RlcyAodGhlIHJlc3VsdCBmcm9tIHRoZSBsYXN0IHNlYXJjaClcblx0XHRcdCAqIEBwbHVnaW4gc2VhcmNoXG5cdFx0XHQgKi9cblx0XHRcdHRoaXMudHJpZ2dlcignY2xlYXJfc2VhcmNoJywgeyAnbm9kZXMnIDogdGhpcy5fZGF0YS5zZWFyY2guZG9tLCBzdHIgOiB0aGlzLl9kYXRhLnNlYXJjaC5zdHIsIHJlcyA6IHRoaXMuX2RhdGEuc2VhcmNoLnJlcyB9KTtcblx0XHRcdHRoaXMuX2RhdGEuc2VhcmNoLnN0ciA9IFwiXCI7XG5cdFx0XHR0aGlzLl9kYXRhLnNlYXJjaC5yZXMgPSBbXTtcblx0XHRcdHRoaXMuX2RhdGEuc2VhcmNoLm9wbiA9IFtdO1xuXHRcdFx0dGhpcy5fZGF0YS5zZWFyY2guZG9tID0gJCgpO1xuXHRcdH07XG5cdFx0LyoqXG5cdFx0ICogb3BlbnMgbm9kZXMgdGhhdCBuZWVkIHRvIGJlIG9wZW5lZCB0byByZXZlYWwgdGhlIHNlYXJjaCByZXN1bHRzLiBVc2VkIG9ubHkgaW50ZXJuYWxseS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqIEBuYW1lIF9zZWFyY2hfb3BlbihkKVxuXHRcdCAqIEBwYXJhbSB7QXJyYXl9IGQgYW4gYXJyYXkgb2Ygbm9kZSBJRHNcblx0XHQgKiBAcGx1Z2luIHNlYXJjaFxuXHRcdCAqL1xuXHRcdHRoaXMuX3NlYXJjaF9vcGVuID0gZnVuY3Rpb24gKGQpIHtcblx0XHRcdHZhciB0ID0gdGhpcztcblx0XHRcdCQuZWFjaChkLmNvbmNhdChbXSksIGZ1bmN0aW9uIChpLCB2KSB7XG5cdFx0XHRcdHYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh2KTtcblx0XHRcdFx0aWYodikge1xuXHRcdFx0XHRcdGlmKHQuaXNfY2xvc2VkKHYpKSB7XG5cdFx0XHRcdFx0XHR0Ll9kYXRhLnNlYXJjaC5vcG4ucHVzaCh2LmlkKTtcblx0XHRcdFx0XHRcdHQub3Blbl9ub2RlKHYsIGZ1bmN0aW9uICgpIHsgdC5fc2VhcmNoX29wZW4oZCk7IH0sIDApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHQvKipcblx0XHQgKiBsb2FkcyBub2RlcyB0aGF0IG5lZWQgdG8gYmUgb3BlbmVkIHRvIHJldmVhbCB0aGUgc2VhcmNoIHJlc3VsdHMuIFVzZWQgb25seSBpbnRlcm5hbGx5LlxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICogQG5hbWUgX3NlYXJjaF9sb2FkKGQsIHN0cilcblx0XHQgKiBAcGFyYW0ge1N0cmluZ30gc3RyIHRoZSBzZWFyY2ggc3RyaW5nXG5cdFx0ICogQHBsdWdpbiBzZWFyY2hcblx0XHQgKi9cblx0XHR0aGlzLl9zZWFyY2hfbG9hZCA9IGZ1bmN0aW9uIChzdHIpIHtcblx0XHRcdHZhciByZXMgPSB0cnVlLFxuXHRcdFx0XHR0ID0gdGhpcyxcblx0XHRcdFx0bSA9IHQuX21vZGVsLmRhdGE7XG5cdFx0XHRpZigkLmlzQXJyYXkodGhpcy5fZGF0YS5zZWFyY2guc2xuKSkge1xuXHRcdFx0XHRpZighdGhpcy5fZGF0YS5zZWFyY2guc2xuLmxlbmd0aCkge1xuXHRcdFx0XHRcdHRoaXMuX2RhdGEuc2VhcmNoLnNsbiA9IG51bGw7XG5cdFx0XHRcdFx0dGhpcy5zZWFyY2goc3RyLCB0cnVlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHQkLmVhY2godGhpcy5fZGF0YS5zZWFyY2guc2xuLCBmdW5jdGlvbiAoaSwgdikge1xuXHRcdFx0XHRcdFx0aWYobVt2XSkge1xuXHRcdFx0XHRcdFx0XHQkLnZha2F0YS5hcnJheV9yZW1vdmVfaXRlbSh0Ll9kYXRhLnNlYXJjaC5zbG4sIHYpO1xuXHRcdFx0XHRcdFx0XHRpZighbVt2XS5zdGF0ZS5sb2FkZWQpIHtcblx0XHRcdFx0XHRcdFx0XHR0LmxvYWRfbm9kZSh2LCBmdW5jdGlvbiAobywgcykgeyBpZihzKSB7IHQuX3NlYXJjaF9sb2FkKHN0cik7IH0gfSk7XG5cdFx0XHRcdFx0XHRcdFx0cmVzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRpZihyZXMpIHtcblx0XHRcdFx0XHRcdHRoaXMuX2RhdGEuc2VhcmNoLnNsbiA9IFtdO1xuXHRcdFx0XHRcdFx0dGhpcy5fc2VhcmNoX2xvYWQoc3RyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHR9O1xuXG5cdC8vIGhlbHBlcnNcblx0KGZ1bmN0aW9uICgkKSB7XG5cdFx0Ly8gZnJvbSBodHRwOi8va2lyby5tZS9wcm9qZWN0cy9mdXNlLmh0bWxcblx0XHQkLnZha2F0YS5zZWFyY2ggPSBmdW5jdGlvbihwYXR0ZXJuLCB0eHQsIG9wdGlvbnMpIHtcblx0XHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXHRcdFx0aWYob3B0aW9ucy5mdXp6eSAhPT0gZmFsc2UpIHtcblx0XHRcdFx0b3B0aW9ucy5mdXp6eSA9IHRydWU7XG5cdFx0XHR9XG5cdFx0XHRwYXR0ZXJuID0gb3B0aW9ucy5jYXNlU2Vuc2l0aXZlID8gcGF0dGVybiA6IHBhdHRlcm4udG9Mb3dlckNhc2UoKTtcblx0XHRcdHZhciBNQVRDSF9MT0NBVElPTlx0PSBvcHRpb25zLmxvY2F0aW9uIHx8IDAsXG5cdFx0XHRcdE1BVENIX0RJU1RBTkNFXHQ9IG9wdGlvbnMuZGlzdGFuY2UgfHwgMTAwLFxuXHRcdFx0XHRNQVRDSF9USFJFU0hPTERcdD0gb3B0aW9ucy50aHJlc2hvbGQgfHwgMC42LFxuXHRcdFx0XHRwYXR0ZXJuTGVuID0gcGF0dGVybi5sZW5ndGgsXG5cdFx0XHRcdG1hdGNobWFzaywgcGF0dGVybl9hbHBoYWJldCwgbWF0Y2hfYml0YXBTY29yZSwgc2VhcmNoO1xuXHRcdFx0aWYocGF0dGVybkxlbiA+IDMyKSB7XG5cdFx0XHRcdG9wdGlvbnMuZnV6enkgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGlmKG9wdGlvbnMuZnV6enkpIHtcblx0XHRcdFx0bWF0Y2htYXNrID0gMSA8PCAocGF0dGVybkxlbiAtIDEpO1xuXHRcdFx0XHRwYXR0ZXJuX2FscGhhYmV0ID0gKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHR2YXIgbWFzayA9IHt9LFxuXHRcdFx0XHRcdFx0aSA9IDA7XG5cdFx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IHBhdHRlcm5MZW47IGkrKykge1xuXHRcdFx0XHRcdFx0bWFza1twYXR0ZXJuLmNoYXJBdChpKV0gPSAwO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgcGF0dGVybkxlbjsgaSsrKSB7XG5cdFx0XHRcdFx0XHRtYXNrW3BhdHRlcm4uY2hhckF0KGkpXSB8PSAxIDw8IChwYXR0ZXJuTGVuIC0gaSAtIDEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gbWFzaztcblx0XHRcdFx0fSgpKTtcblx0XHRcdFx0bWF0Y2hfYml0YXBTY29yZSA9IGZ1bmN0aW9uIChlLCB4KSB7XG5cdFx0XHRcdFx0dmFyIGFjY3VyYWN5ID0gZSAvIHBhdHRlcm5MZW4sXG5cdFx0XHRcdFx0XHRwcm94aW1pdHkgPSBNYXRoLmFicyhNQVRDSF9MT0NBVElPTiAtIHgpO1xuXHRcdFx0XHRcdGlmKCFNQVRDSF9ESVNUQU5DRSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHByb3hpbWl0eSA/IDEuMCA6IGFjY3VyYWN5O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gYWNjdXJhY3kgKyAocHJveGltaXR5IC8gTUFUQ0hfRElTVEFOQ0UpO1xuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdFx0c2VhcmNoID0gZnVuY3Rpb24gKHRleHQpIHtcblx0XHRcdFx0dGV4dCA9IG9wdGlvbnMuY2FzZVNlbnNpdGl2ZSA/IHRleHQgOiB0ZXh0LnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdGlmKHBhdHRlcm4gPT09IHRleHQgfHwgdGV4dC5pbmRleE9mKHBhdHRlcm4pICE9PSAtMSkge1xuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRpc01hdGNoOiB0cnVlLFxuXHRcdFx0XHRcdFx0c2NvcmU6IDBcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKCFvcHRpb25zLmZ1enp5KSB7XG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdGlzTWF0Y2g6IGZhbHNlLFxuXHRcdFx0XHRcdFx0c2NvcmU6IDFcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBpLCBqLFxuXHRcdFx0XHRcdHRleHRMZW4gPSB0ZXh0Lmxlbmd0aCxcblx0XHRcdFx0XHRzY29yZVRocmVzaG9sZCA9IE1BVENIX1RIUkVTSE9MRCxcblx0XHRcdFx0XHRiZXN0TG9jID0gdGV4dC5pbmRleE9mKHBhdHRlcm4sIE1BVENIX0xPQ0FUSU9OKSxcblx0XHRcdFx0XHRiaW5NaW4sIGJpbk1pZCxcblx0XHRcdFx0XHRiaW5NYXggPSBwYXR0ZXJuTGVuICsgdGV4dExlbixcblx0XHRcdFx0XHRsYXN0UmQsIHN0YXJ0LCBmaW5pc2gsIHJkLCBjaGFyTWF0Y2gsXG5cdFx0XHRcdFx0c2NvcmUgPSAxLFxuXHRcdFx0XHRcdGxvY2F0aW9ucyA9IFtdO1xuXHRcdFx0XHRpZiAoYmVzdExvYyAhPT0gLTEpIHtcblx0XHRcdFx0XHRzY29yZVRocmVzaG9sZCA9IE1hdGgubWluKG1hdGNoX2JpdGFwU2NvcmUoMCwgYmVzdExvYyksIHNjb3JlVGhyZXNob2xkKTtcblx0XHRcdFx0XHRiZXN0TG9jID0gdGV4dC5sYXN0SW5kZXhPZihwYXR0ZXJuLCBNQVRDSF9MT0NBVElPTiArIHBhdHRlcm5MZW4pO1xuXHRcdFx0XHRcdGlmIChiZXN0TG9jICE9PSAtMSkge1xuXHRcdFx0XHRcdFx0c2NvcmVUaHJlc2hvbGQgPSBNYXRoLm1pbihtYXRjaF9iaXRhcFNjb3JlKDAsIGJlc3RMb2MpLCBzY29yZVRocmVzaG9sZCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGJlc3RMb2MgPSAtMTtcblx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IHBhdHRlcm5MZW47IGkrKykge1xuXHRcdFx0XHRcdGJpbk1pbiA9IDA7XG5cdFx0XHRcdFx0YmluTWlkID0gYmluTWF4O1xuXHRcdFx0XHRcdHdoaWxlIChiaW5NaW4gPCBiaW5NaWQpIHtcblx0XHRcdFx0XHRcdGlmIChtYXRjaF9iaXRhcFNjb3JlKGksIE1BVENIX0xPQ0FUSU9OICsgYmluTWlkKSA8PSBzY29yZVRocmVzaG9sZCkge1xuXHRcdFx0XHRcdFx0XHRiaW5NaW4gPSBiaW5NaWQ7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRiaW5NYXggPSBiaW5NaWQ7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRiaW5NaWQgPSBNYXRoLmZsb29yKChiaW5NYXggLSBiaW5NaW4pIC8gMiArIGJpbk1pbik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJpbk1heCA9IGJpbk1pZDtcblx0XHRcdFx0XHRzdGFydCA9IE1hdGgubWF4KDEsIE1BVENIX0xPQ0FUSU9OIC0gYmluTWlkICsgMSk7XG5cdFx0XHRcdFx0ZmluaXNoID0gTWF0aC5taW4oTUFUQ0hfTE9DQVRJT04gKyBiaW5NaWQsIHRleHRMZW4pICsgcGF0dGVybkxlbjtcblx0XHRcdFx0XHRyZCA9IG5ldyBBcnJheShmaW5pc2ggKyAyKTtcblx0XHRcdFx0XHRyZFtmaW5pc2ggKyAxXSA9ICgxIDw8IGkpIC0gMTtcblx0XHRcdFx0XHRmb3IgKGogPSBmaW5pc2g7IGogPj0gc3RhcnQ7IGotLSkge1xuXHRcdFx0XHRcdFx0Y2hhck1hdGNoID0gcGF0dGVybl9hbHBoYWJldFt0ZXh0LmNoYXJBdChqIC0gMSldO1xuXHRcdFx0XHRcdFx0aWYgKGkgPT09IDApIHtcblx0XHRcdFx0XHRcdFx0cmRbal0gPSAoKHJkW2ogKyAxXSA8PCAxKSB8IDEpICYgY2hhck1hdGNoO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0cmRbal0gPSAoKHJkW2ogKyAxXSA8PCAxKSB8IDEpICYgY2hhck1hdGNoIHwgKCgobGFzdFJkW2ogKyAxXSB8IGxhc3RSZFtqXSkgPDwgMSkgfCAxKSB8IGxhc3RSZFtqICsgMV07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiAocmRbal0gJiBtYXRjaG1hc2spIHtcblx0XHRcdFx0XHRcdFx0c2NvcmUgPSBtYXRjaF9iaXRhcFNjb3JlKGksIGogLSAxKTtcblx0XHRcdFx0XHRcdFx0aWYgKHNjb3JlIDw9IHNjb3JlVGhyZXNob2xkKSB7XG5cdFx0XHRcdFx0XHRcdFx0c2NvcmVUaHJlc2hvbGQgPSBzY29yZTtcblx0XHRcdFx0XHRcdFx0XHRiZXN0TG9jID0gaiAtIDE7XG5cdFx0XHRcdFx0XHRcdFx0bG9jYXRpb25zLnB1c2goYmVzdExvYyk7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGJlc3RMb2MgPiBNQVRDSF9MT0NBVElPTikge1xuXHRcdFx0XHRcdFx0XHRcdFx0c3RhcnQgPSBNYXRoLm1heCgxLCAyICogTUFUQ0hfTE9DQVRJT04gLSBiZXN0TG9jKTtcblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChtYXRjaF9iaXRhcFNjb3JlKGkgKyAxLCBNQVRDSF9MT0NBVElPTikgPiBzY29yZVRocmVzaG9sZCkge1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGxhc3RSZCA9IHJkO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0aXNNYXRjaDogYmVzdExvYyA+PSAwLFxuXHRcdFx0XHRcdHNjb3JlOiBzY29yZVxuXHRcdFx0XHR9O1xuXHRcdFx0fTtcblx0XHRcdHJldHVybiB0eHQgPT09IHRydWUgPyB7ICdzZWFyY2gnIDogc2VhcmNoIH0gOiBzZWFyY2godHh0KTtcblx0XHR9O1xuXHR9KGpRdWVyeSkpO1xuXG5cdC8vIGluY2x1ZGUgdGhlIHNlYXJjaCBwbHVnaW4gYnkgZGVmYXVsdFxuXHQvLyAkLmpzdHJlZS5kZWZhdWx0cy5wbHVnaW5zLnB1c2goXCJzZWFyY2hcIik7XG5cbi8qKlxuICogIyMjIFNvcnQgcGx1Z2luXG4gKlxuICogQXV0bWF0aWNhbGx5IHNvcnRzIGFsbCBzaWJsaW5ncyBpbiB0aGUgdHJlZSBhY2NvcmRpbmcgdG8gYSBzb3J0aW5nIGZ1bmN0aW9uLlxuICovXG5cblx0LyoqXG5cdCAqIHRoZSBzZXR0aW5ncyBmdW5jdGlvbiB1c2VkIHRvIHNvcnQgdGhlIG5vZGVzLlxuXHQgKiBJdCBpcyBleGVjdXRlZCBpbiB0aGUgdHJlZSdzIGNvbnRleHQsIGFjY2VwdHMgdHdvIG5vZGVzIGFzIGFyZ3VtZW50cyBhbmQgc2hvdWxkIHJldHVybiBgMWAgb3IgYC0xYC5cblx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuc29ydFxuXHQgKiBAcGx1Z2luIHNvcnRcblx0ICovXG5cdCQuanN0cmVlLmRlZmF1bHRzLnNvcnQgPSBmdW5jdGlvbiAoYSwgYikge1xuXHRcdC8vcmV0dXJuIHRoaXMuZ2V0X3R5cGUoYSkgPT09IHRoaXMuZ2V0X3R5cGUoYikgPyAodGhpcy5nZXRfdGV4dChhKSA+IHRoaXMuZ2V0X3RleHQoYikgPyAxIDogLTEpIDogdGhpcy5nZXRfdHlwZShhKSA+PSB0aGlzLmdldF90eXBlKGIpO1xuXHRcdHJldHVybiB0aGlzLmdldF90ZXh0KGEpID4gdGhpcy5nZXRfdGV4dChiKSA/IDEgOiAtMTtcblx0fTtcblx0JC5qc3RyZWUucGx1Z2lucy5zb3J0ID0gZnVuY3Rpb24gKG9wdGlvbnMsIHBhcmVudCkge1xuXHRcdHRoaXMuYmluZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHBhcmVudC5iaW5kLmNhbGwodGhpcyk7XG5cdFx0XHR0aGlzLmVsZW1lbnRcblx0XHRcdFx0Lm9uKFwibW9kZWwuanN0cmVlXCIsICQucHJveHkoZnVuY3Rpb24gKGUsIGRhdGEpIHtcblx0XHRcdFx0XHRcdHRoaXMuc29ydChkYXRhLnBhcmVudCwgdHJ1ZSk7XG5cdFx0XHRcdFx0fSwgdGhpcykpXG5cdFx0XHRcdC5vbihcInJlbmFtZV9ub2RlLmpzdHJlZSBjcmVhdGVfbm9kZS5qc3RyZWVcIiwgJC5wcm94eShmdW5jdGlvbiAoZSwgZGF0YSkge1xuXHRcdFx0XHRcdFx0dGhpcy5zb3J0KGRhdGEucGFyZW50IHx8IGRhdGEubm9kZS5wYXJlbnQsIGZhbHNlKTtcblx0XHRcdFx0XHRcdHRoaXMucmVkcmF3X25vZGUoZGF0YS5wYXJlbnQgfHwgZGF0YS5ub2RlLnBhcmVudCwgdHJ1ZSk7XG5cdFx0XHRcdFx0fSwgdGhpcykpXG5cdFx0XHRcdC5vbihcIm1vdmVfbm9kZS5qc3RyZWUgY29weV9ub2RlLmpzdHJlZVwiLCAkLnByb3h5KGZ1bmN0aW9uIChlLCBkYXRhKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnNvcnQoZGF0YS5wYXJlbnQsIGZhbHNlKTtcblx0XHRcdFx0XHRcdHRoaXMucmVkcmF3X25vZGUoZGF0YS5wYXJlbnQsIHRydWUpO1xuXHRcdFx0XHRcdH0sIHRoaXMpKTtcblx0XHR9O1xuXHRcdC8qKlxuXHRcdCAqIHVzZWQgdG8gc29ydCBhIG5vZGUncyBjaGlsZHJlblxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICogQG5hbWUgc29ydChvYmogWywgZGVlcF0pXG5cdFx0ICogQHBhcmFtICB7bWl4ZWR9IG9iaiB0aGUgbm9kZVxuXHRcdCAqIEBwYXJhbSB7Qm9vbGVhbn0gZGVlcCBpZiBzZXQgdG8gYHRydWVgIG5vZGVzIGFyZSBzb3J0ZWQgcmVjdXJzaXZlbHkuXG5cdFx0ICogQHBsdWdpbiBzb3J0XG5cdFx0ICogQHRyaWdnZXIgc2VhcmNoLmpzdHJlZVxuXHRcdCAqL1xuXHRcdHRoaXMuc29ydCA9IGZ1bmN0aW9uIChvYmosIGRlZXApIHtcblx0XHRcdHZhciBpLCBqO1xuXHRcdFx0b2JqID0gdGhpcy5nZXRfbm9kZShvYmopO1xuXHRcdFx0aWYob2JqICYmIG9iai5jaGlsZHJlbiAmJiBvYmouY2hpbGRyZW4ubGVuZ3RoKSB7XG5cdFx0XHRcdG9iai5jaGlsZHJlbi5zb3J0KCQucHJveHkodGhpcy5zZXR0aW5ncy5zb3J0LCB0aGlzKSk7XG5cdFx0XHRcdGlmKGRlZXApIHtcblx0XHRcdFx0XHRmb3IoaSA9IDAsIGogPSBvYmouY2hpbGRyZW5fZC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0XHRcdHRoaXMuc29ydChvYmouY2hpbGRyZW5fZFtpXSwgZmFsc2UpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdH07XG5cblx0Ly8gaW5jbHVkZSB0aGUgc29ydCBwbHVnaW4gYnkgZGVmYXVsdFxuXHQvLyAkLmpzdHJlZS5kZWZhdWx0cy5wbHVnaW5zLnB1c2goXCJzb3J0XCIpO1xuXG4vKipcbiAqICMjIyBTdGF0ZSBwbHVnaW5cbiAqXG4gKiBTYXZlcyB0aGUgc3RhdGUgb2YgdGhlIHRyZWUgKHNlbGVjdGVkIG5vZGVzLCBvcGVuZWQgbm9kZXMpIG9uIHRoZSB1c2VyJ3MgY29tcHV0ZXIgdXNpbmcgYXZhaWxhYmxlIG9wdGlvbnMgKGxvY2FsU3RvcmFnZSwgY29va2llcywgZXRjKVxuICovXG5cblx0dmFyIHRvID0gZmFsc2U7XG5cdC8qKlxuXHQgKiBzdG9yZXMgYWxsIGRlZmF1bHRzIGZvciB0aGUgc3RhdGUgcGx1Z2luXG5cdCAqIEBuYW1lICQuanN0cmVlLmRlZmF1bHRzLnN0YXRlXG5cdCAqIEBwbHVnaW4gc3RhdGVcblx0ICovXG5cdCQuanN0cmVlLmRlZmF1bHRzLnN0YXRlID0ge1xuXHRcdC8qKlxuXHRcdCAqIEEgc3RyaW5nIGZvciB0aGUga2V5IHRvIHVzZSB3aGVuIHNhdmluZyB0aGUgY3VycmVudCB0cmVlIChjaGFuZ2UgaWYgdXNpbmcgbXVsdGlwbGUgdHJlZXMgaW4geW91ciBwcm9qZWN0KS4gRGVmYXVsdHMgdG8gYGpzdHJlZWAuXG5cdFx0ICogQG5hbWUgJC5qc3RyZWUuZGVmYXVsdHMuc3RhdGUua2V5XG5cdFx0ICogQHBsdWdpbiBzdGF0ZVxuXHRcdCAqL1xuXHRcdGtleVx0XHQ6ICdqc3RyZWUnLFxuXHRcdC8qKlxuXHRcdCAqIEEgc3BhY2Ugc2VwYXJhdGVkIGxpc3Qgb2YgZXZlbnRzIHRoYXQgdHJpZ2dlciBhIHN0YXRlIHNhdmUuIERlZmF1bHRzIHRvIGBjaGFuZ2VkLmpzdHJlZSBvcGVuX25vZGUuanN0cmVlIGNsb3NlX25vZGUuanN0cmVlYC5cblx0XHQgKiBAbmFtZSAkLmpzdHJlZS5kZWZhdWx0cy5zdGF0ZS5ldmVudHNcblx0XHQgKiBAcGx1Z2luIHN0YXRlXG5cdFx0ICovXG5cdFx0ZXZlbnRzXHQ6ICdjaGFuZ2VkLmpzdHJlZSBvcGVuX25vZGUuanN0cmVlIGNsb3NlX25vZGUuanN0cmVlJyxcblx0XHQvKipcblx0XHQgKiBUaW1lIGluIG1pbGxpc2Vjb25kcyBhZnRlciB3aGljaCB0aGUgc3RhdGUgd2lsbCBleHBpcmUuIERlZmF1bHRzIHRvICdmYWxzZScgbWVhbmluZyAtIG5vIGV4cGlyZS5cblx0XHQgKiBAbmFtZSAkLmpzdHJlZS5kZWZhdWx0cy5zdGF0ZS50dGxcblx0XHQgKiBAcGx1Z2luIHN0YXRlXG5cdFx0ICovXG5cdFx0dHRsXHRcdDogZmFsc2UsXG5cdFx0LyoqXG5cdFx0ICogQSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgcHJpb3IgdG8gcmVzdG9yaW5nIHN0YXRlIHdpdGggb25lIGFyZ3VtZW50IC0gdGhlIHN0YXRlIG9iamVjdC4gQ2FuIGJlIHVzZWQgdG8gY2xlYXIgdW53YW50ZWQgcGFydHMgb2YgdGhlIHN0YXRlLlxuXHRcdCAqIEBuYW1lICQuanN0cmVlLmRlZmF1bHRzLnN0YXRlLmZpbHRlclxuXHRcdCAqIEBwbHVnaW4gc3RhdGVcblx0XHQgKi9cblx0XHRmaWx0ZXJcdDogZmFsc2Vcblx0fTtcblx0JC5qc3RyZWUucGx1Z2lucy5zdGF0ZSA9IGZ1bmN0aW9uIChvcHRpb25zLCBwYXJlbnQpIHtcblx0XHR0aGlzLmJpbmQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRwYXJlbnQuYmluZC5jYWxsKHRoaXMpO1xuXHRcdFx0dmFyIGJpbmQgPSAkLnByb3h5KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0dGhpcy5lbGVtZW50Lm9uKHRoaXMuc2V0dGluZ3Muc3RhdGUuZXZlbnRzLCAkLnByb3h5KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRpZih0bykgeyBjbGVhclRpbWVvdXQodG8pOyB9XG5cdFx0XHRcdFx0dG8gPSBzZXRUaW1lb3V0KCQucHJveHkoZnVuY3Rpb24gKCkgeyB0aGlzLnNhdmVfc3RhdGUoKTsgfSwgdGhpcyksIDEwMCk7XG5cdFx0XHRcdH0sIHRoaXMpKTtcblx0XHRcdH0sIHRoaXMpO1xuXHRcdFx0dGhpcy5lbGVtZW50XG5cdFx0XHRcdC5vbihcInJlYWR5LmpzdHJlZVwiLCAkLnByb3h5KGZ1bmN0aW9uIChlLCBkYXRhKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQub25lKFwicmVzdG9yZV9zdGF0ZS5qc3RyZWVcIiwgYmluZCk7XG5cdFx0XHRcdFx0XHRpZighdGhpcy5yZXN0b3JlX3N0YXRlKCkpIHsgYmluZCgpOyB9XG5cdFx0XHRcdFx0fSwgdGhpcykpO1xuXHRcdH07XG5cdFx0LyoqXG5cdFx0ICogc2F2ZSB0aGUgc3RhdGVcblx0XHQgKiBAbmFtZSBzYXZlX3N0YXRlKClcblx0XHQgKiBAcGx1Z2luIHN0YXRlXG5cdFx0ICovXG5cdFx0dGhpcy5zYXZlX3N0YXRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHN0ID0geyAnc3RhdGUnIDogdGhpcy5nZXRfc3RhdGUoKSwgJ3R0bCcgOiB0aGlzLnNldHRpbmdzLnN0YXRlLnR0bCwgJ3NlYycgOiArKG5ldyBEYXRlKCkpIH07XG5cdFx0XHQkLnZha2F0YS5zdG9yYWdlLnNldCh0aGlzLnNldHRpbmdzLnN0YXRlLmtleSwgSlNPTi5zdHJpbmdpZnkoc3QpKTtcblx0XHR9O1xuXHRcdC8qKlxuXHRcdCAqIHJlc3RvcmUgdGhlIHN0YXRlIGZyb20gdGhlIHVzZXIncyBjb21wdXRlclxuXHRcdCAqIEBuYW1lIHJlc3RvcmVfc3RhdGUoKVxuXHRcdCAqIEBwbHVnaW4gc3RhdGVcblx0XHQgKi9cblx0XHR0aGlzLnJlc3RvcmVfc3RhdGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgayA9ICQudmFrYXRhLnN0b3JhZ2UuZ2V0KHRoaXMuc2V0dGluZ3Muc3RhdGUua2V5KTtcblx0XHRcdGlmKCEhaykgeyB0cnkgeyBrID0gSlNPTi5wYXJzZShrKTsgfSBjYXRjaChleCkgeyByZXR1cm4gZmFsc2U7IH0gfVxuXHRcdFx0aWYoISFrICYmIGsudHRsICYmIGsuc2VjICYmICsobmV3IERhdGUoKSkgLSBrLnNlYyA+IGsudHRsKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0aWYoISFrICYmIGsuc3RhdGUpIHsgayA9IGsuc3RhdGU7IH1cblx0XHRcdGlmKCEhayAmJiAkLmlzRnVuY3Rpb24odGhpcy5zZXR0aW5ncy5zdGF0ZS5maWx0ZXIpKSB7IGsgPSB0aGlzLnNldHRpbmdzLnN0YXRlLmZpbHRlci5jYWxsKHRoaXMsIGspOyB9XG5cdFx0XHRpZighIWspIHtcblx0XHRcdFx0dGhpcy5lbGVtZW50Lm9uZShcInNldF9zdGF0ZS5qc3RyZWVcIiwgZnVuY3Rpb24gKGUsIGRhdGEpIHsgZGF0YS5pbnN0YW5jZS50cmlnZ2VyKCdyZXN0b3JlX3N0YXRlJywgeyAnc3RhdGUnIDogJC5leHRlbmQodHJ1ZSwge30sIGspIH0pOyB9KTtcblx0XHRcdFx0dGhpcy5zZXRfc3RhdGUoayk7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH07XG5cdFx0LyoqXG5cdFx0ICogY2xlYXIgdGhlIHN0YXRlIG9uIHRoZSB1c2VyJ3MgY29tcHV0ZXJcblx0XHQgKiBAbmFtZSBjbGVhcl9zdGF0ZSgpXG5cdFx0ICogQHBsdWdpbiBzdGF0ZVxuXHRcdCAqL1xuXHRcdHRoaXMuY2xlYXJfc3RhdGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gJC52YWthdGEuc3RvcmFnZS5kZWwodGhpcy5zZXR0aW5ncy5zdGF0ZS5rZXkpO1xuXHRcdH07XG5cdH07XG5cblx0KGZ1bmN0aW9uICgkLCB1bmRlZmluZWQpIHtcblx0XHQkLnZha2F0YS5zdG9yYWdlID0ge1xuXHRcdFx0Ly8gc2ltcGx5IHNwZWNpZnlpbmcgdGhlIGZ1bmN0aW9ucyBpbiBGRiB0aHJvd3MgYW4gZXJyb3Jcblx0XHRcdHNldCA6IGZ1bmN0aW9uIChrZXksIHZhbCkgeyByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgdmFsKTsgfSxcblx0XHRcdGdldCA6IGZ1bmN0aW9uIChrZXkpIHsgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpOyB9LFxuXHRcdFx0ZGVsIDogZnVuY3Rpb24gKGtleSkgeyByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSk7IH1cblx0XHR9O1xuXHR9KGpRdWVyeSkpO1xuXG5cdC8vIGluY2x1ZGUgdGhlIHN0YXRlIHBsdWdpbiBieSBkZWZhdWx0XG5cdC8vICQuanN0cmVlLmRlZmF1bHRzLnBsdWdpbnMucHVzaChcInN0YXRlXCIpO1xuXG4vKipcbiAqICMjIyBUeXBlcyBwbHVnaW5cbiAqXG4gKiBNYWtlcyBpdCBwb3NzaWJsZSB0byBhZGQgcHJlZGVmaW5lZCB0eXBlcyBmb3IgZ3JvdXBzIG9mIG5vZGVzLCB3aGljaCBtYWtlIGl0IHBvc3NpYmxlIHRvIGVhc2lseSBjb250cm9sIG5lc3RpbmcgcnVsZXMgYW5kIGljb24gZm9yIGVhY2ggZ3JvdXAuXG4gKi9cblxuXHQvKipcblx0ICogQW4gb2JqZWN0IHN0b3JpbmcgYWxsIHR5cGVzIGFzIGtleSB2YWx1ZSBwYWlycywgd2hlcmUgdGhlIGtleSBpcyB0aGUgdHlwZSBuYW1lIGFuZCB0aGUgdmFsdWUgaXMgYW4gb2JqZWN0IHRoYXQgY291bGQgY29udGFpbiBmb2xsb3dpbmcga2V5cyAoYWxsIG9wdGlvbmFsKS5cblx0ICogXG5cdCAqICogYG1heF9jaGlsZHJlbmAgdGhlIG1heGltdW0gbnVtYmVyIG9mIGltbWVkaWF0ZSBjaGlsZHJlbiB0aGlzIG5vZGUgdHlwZSBjYW4gaGF2ZS4gRG8gbm90IHNwZWNpZnkgb3Igc2V0IHRvIGAtMWAgZm9yIHVubGltaXRlZC5cblx0ICogKiBgbWF4X2RlcHRoYCB0aGUgbWF4aW11bSBudW1iZXIgb2YgbmVzdGluZyB0aGlzIG5vZGUgdHlwZSBjYW4gaGF2ZS4gQSB2YWx1ZSBvZiBgMWAgd291bGQgbWVhbiB0aGF0IHRoZSBub2RlIGNhbiBoYXZlIGNoaWxkcmVuLCBidXQgbm8gZ3JhbmRjaGlsZHJlbi4gRG8gbm90IHNwZWNpZnkgb3Igc2V0IHRvIGAtMWAgZm9yIHVubGltaXRlZC5cblx0ICogKiBgdmFsaWRfY2hpbGRyZW5gIGFuIGFycmF5IG9mIG5vZGUgdHlwZSBzdHJpbmdzLCB0aGF0IG5vZGVzIG9mIHRoaXMgdHlwZSBjYW4gaGF2ZSBhcyBjaGlsZHJlbi4gRG8gbm90IHNwZWNpZnkgb3Igc2V0IHRvIGAtMWAgZm9yIG5vIGxpbWl0cy5cblx0ICogKiBgaWNvbmAgYSBzdHJpbmcgLSBjYW4gYmUgYSBwYXRoIHRvIGFuIGljb24gb3IgYSBjbGFzc05hbWUsIGlmIHVzaW5nIGFuIGltYWdlIHRoYXQgaXMgaW4gdGhlIGN1cnJlbnQgZGlyZWN0b3J5IHVzZSBhIGAuL2AgcHJlZml4LCBvdGhlcndpc2UgaXQgd2lsbCBiZSBkZXRlY3RlZCBhcyBhIGNsYXNzLiBPbWl0IHRvIHVzZSB0aGUgZGVmYXVsdCBpY29uIGZyb20geW91ciB0aGVtZS5cblx0ICpcblx0ICogVGhlcmUgYXJlIHR3byBwcmVkZWZpbmVkIHR5cGVzOlxuXHQgKiBcblx0ICogKiBgI2AgcmVwcmVzZW50cyB0aGUgcm9vdCBvZiB0aGUgdHJlZSwgZm9yIGV4YW1wbGUgYG1heF9jaGlsZHJlbmAgd291bGQgY29udHJvbCB0aGUgbWF4aW11bSBudW1iZXIgb2Ygcm9vdCBub2Rlcy5cblx0ICogKiBgZGVmYXVsdGAgcmVwcmVzZW50cyB0aGUgZGVmYXVsdCBub2RlIC0gYW55IHNldHRpbmdzIGhlcmUgd2lsbCBiZSBhcHBsaWVkIHRvIGFsbCBub2RlcyB0aGF0IGRvIG5vdCBoYXZlIGEgdHlwZSBzcGVjaWZpZWQuXG5cdCAqIFxuXHQgKiBAbmFtZSAkLmpzdHJlZS5kZWZhdWx0cy50eXBlc1xuXHQgKiBAcGx1Z2luIHR5cGVzXG5cdCAqL1xuXHQkLmpzdHJlZS5kZWZhdWx0cy50eXBlcyA9IHtcblx0XHQnIycgOiB7fSxcblx0XHQnZGVmYXVsdCcgOiB7fVxuXHR9O1xuXG5cdCQuanN0cmVlLnBsdWdpbnMudHlwZXMgPSBmdW5jdGlvbiAob3B0aW9ucywgcGFyZW50KSB7XG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24gKGVsLCBvcHRpb25zKSB7XG5cdFx0XHR2YXIgaSwgajtcblx0XHRcdGlmKG9wdGlvbnMgJiYgb3B0aW9ucy50eXBlcyAmJiBvcHRpb25zLnR5cGVzWydkZWZhdWx0J10pIHtcblx0XHRcdFx0Zm9yKGkgaW4gb3B0aW9ucy50eXBlcykge1xuXHRcdFx0XHRcdGlmKGkgIT09IFwiZGVmYXVsdFwiICYmIGkgIT09IFwiI1wiICYmIG9wdGlvbnMudHlwZXMuaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdFx0XHRcdGZvcihqIGluIG9wdGlvbnMudHlwZXNbJ2RlZmF1bHQnXSkge1xuXHRcdFx0XHRcdFx0XHRpZihvcHRpb25zLnR5cGVzWydkZWZhdWx0J10uaGFzT3duUHJvcGVydHkoaikgJiYgb3B0aW9ucy50eXBlc1tpXVtqXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRcdFx0b3B0aW9ucy50eXBlc1tpXVtqXSA9IG9wdGlvbnMudHlwZXNbJ2RlZmF1bHQnXVtqXTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cGFyZW50LmluaXQuY2FsbCh0aGlzLCBlbCwgb3B0aW9ucyk7XG5cdFx0XHR0aGlzLl9tb2RlbC5kYXRhWycjJ10udHlwZSA9ICcjJztcblx0XHR9O1xuXHRcdHRoaXMuYmluZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHBhcmVudC5iaW5kLmNhbGwodGhpcyk7XG5cdFx0XHR0aGlzLmVsZW1lbnRcblx0XHRcdFx0Lm9uKCdtb2RlbC5qc3RyZWUnLCAkLnByb3h5KGZ1bmN0aW9uIChlLCBkYXRhKSB7XG5cdFx0XHRcdFx0XHR2YXIgbSA9IHRoaXMuX21vZGVsLmRhdGEsXG5cdFx0XHRcdFx0XHRcdGRwYyA9IGRhdGEubm9kZXMsXG5cdFx0XHRcdFx0XHRcdHQgPSB0aGlzLnNldHRpbmdzLnR5cGVzLFxuXHRcdFx0XHRcdFx0XHRpLCBqLCBjID0gJ2RlZmF1bHQnO1xuXHRcdFx0XHRcdFx0Zm9yKGkgPSAwLCBqID0gZHBjLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHRcdFx0XHRcdFx0XHRjID0gJ2RlZmF1bHQnO1xuXHRcdFx0XHRcdFx0XHRpZihtW2RwY1tpXV0ub3JpZ2luYWwgJiYgbVtkcGNbaV1dLm9yaWdpbmFsLnR5cGUgJiYgdFttW2RwY1tpXV0ub3JpZ2luYWwudHlwZV0pIHtcblx0XHRcdFx0XHRcdFx0XHRjID0gbVtkcGNbaV1dLm9yaWdpbmFsLnR5cGU7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0aWYobVtkcGNbaV1dLmRhdGEgJiYgbVtkcGNbaV1dLmRhdGEuanN0cmVlICYmIG1bZHBjW2ldXS5kYXRhLmpzdHJlZS50eXBlICYmIHRbbVtkcGNbaV1dLmRhdGEuanN0cmVlLnR5cGVdKSB7XG5cdFx0XHRcdFx0XHRcdFx0YyA9IG1bZHBjW2ldXS5kYXRhLmpzdHJlZS50eXBlO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdG1bZHBjW2ldXS50eXBlID0gYztcblx0XHRcdFx0XHRcdFx0aWYobVtkcGNbaV1dLmljb24gPT09IHRydWUgJiYgdFtjXS5pY29uICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdFx0XHRtW2RwY1tpXV0uaWNvbiA9IHRbY10uaWNvbjtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sIHRoaXMpKTtcblx0XHR9O1xuXHRcdHRoaXMuZ2V0X2pzb24gPSBmdW5jdGlvbiAob2JqLCBvcHRpb25zLCBmbGF0KSB7XG5cdFx0XHR2YXIgaSwgaixcblx0XHRcdFx0bSA9IHRoaXMuX21vZGVsLmRhdGEsXG5cdFx0XHRcdG9wdCA9IG9wdGlvbnMgPyAkLmV4dGVuZCh0cnVlLCB7fSwgb3B0aW9ucywge25vX2lkOmZhbHNlfSkgOiB7fSxcblx0XHRcdFx0dG1wID0gcGFyZW50LmdldF9qc29uLmNhbGwodGhpcywgb2JqLCBvcHQsIGZsYXQpO1xuXHRcdFx0aWYodG1wID09PSBmYWxzZSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdGlmKCQuaXNBcnJheSh0bXApKSB7XG5cdFx0XHRcdGZvcihpID0gMCwgaiA9IHRtcC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0XHR0bXBbaV0udHlwZSA9IHRtcFtpXS5pZCAmJiBtW3RtcFtpXS5pZF0gJiYgbVt0bXBbaV0uaWRdLnR5cGUgPyBtW3RtcFtpXS5pZF0udHlwZSA6IFwiZGVmYXVsdFwiO1xuXHRcdFx0XHRcdGlmKG9wdGlvbnMgJiYgb3B0aW9ucy5ub19pZCkge1xuXHRcdFx0XHRcdFx0ZGVsZXRlIHRtcFtpXS5pZDtcblx0XHRcdFx0XHRcdGlmKHRtcFtpXS5saV9hdHRyICYmIHRtcFtpXS5saV9hdHRyLmlkKSB7XG5cdFx0XHRcdFx0XHRcdGRlbGV0ZSB0bXBbaV0ubGlfYXR0ci5pZDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHR0bXAudHlwZSA9IHRtcC5pZCAmJiBtW3RtcC5pZF0gJiYgbVt0bXAuaWRdLnR5cGUgPyBtW3RtcC5pZF0udHlwZSA6IFwiZGVmYXVsdFwiO1xuXHRcdFx0XHRpZihvcHRpb25zICYmIG9wdGlvbnMubm9faWQpIHtcblx0XHRcdFx0XHR0bXAgPSB0aGlzLl9kZWxldGVfaWRzKHRtcCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiB0bXA7XG5cdFx0fTtcblx0XHR0aGlzLl9kZWxldGVfaWRzID0gZnVuY3Rpb24gKHRtcCkge1xuXHRcdFx0aWYoJC5pc0FycmF5KHRtcCkpIHtcblx0XHRcdFx0Zm9yKHZhciBpID0gMCwgaiA9IHRtcC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0XHR0bXBbaV0gPSB0aGlzLl9kZWxldGVfaWRzKHRtcFtpXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRtcDtcblx0XHRcdH1cblx0XHRcdGRlbGV0ZSB0bXAuaWQ7XG5cdFx0XHRpZih0bXAubGlfYXR0ciAmJiB0bXAubGlfYXR0ci5pZCkge1xuXHRcdFx0XHRkZWxldGUgdG1wLmxpX2F0dHIuaWQ7XG5cdFx0XHR9XG5cdFx0XHRpZih0bXAuY2hpbGRyZW4gJiYgJC5pc0FycmF5KHRtcC5jaGlsZHJlbikpIHtcblx0XHRcdFx0dG1wLmNoaWxkcmVuID0gdGhpcy5fZGVsZXRlX2lkcyh0bXAuY2hpbGRyZW4pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRtcDtcblx0XHR9O1xuXHRcdHRoaXMuY2hlY2sgPSBmdW5jdGlvbiAoY2hrLCBvYmosIHBhciwgcG9zKSB7XG5cdFx0XHRpZihwYXJlbnQuY2hlY2suY2FsbCh0aGlzLCBjaGssIG9iaiwgcGFyLCBwb3MpID09PSBmYWxzZSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdG9iaiA9IG9iaiAmJiBvYmouaWQgPyBvYmogOiB0aGlzLmdldF9ub2RlKG9iaik7XG5cdFx0XHRwYXIgPSBwYXIgJiYgcGFyLmlkID8gcGFyIDogdGhpcy5nZXRfbm9kZShwYXIpO1xuXHRcdFx0dmFyIG0gPSBvYmogJiYgb2JqLmlkID8gJC5qc3RyZWUucmVmZXJlbmNlKG9iai5pZCkgOiBudWxsLCB0bXAsIGQsIGksIGo7XG5cdFx0XHRtID0gbSAmJiBtLl9tb2RlbCAmJiBtLl9tb2RlbC5kYXRhID8gbS5fbW9kZWwuZGF0YSA6IG51bGw7XG5cdFx0XHRzd2l0Y2goY2hrKSB7XG5cdFx0XHRcdGNhc2UgXCJjcmVhdGVfbm9kZVwiOlxuXHRcdFx0XHRjYXNlIFwibW92ZV9ub2RlXCI6XG5cdFx0XHRcdGNhc2UgXCJjb3B5X25vZGVcIjpcblx0XHRcdFx0XHRpZihjaGsgIT09ICdtb3ZlX25vZGUnIHx8ICQuaW5BcnJheShvYmouaWQsIHBhci5jaGlsZHJlbikgPT09IC0xKSB7XG5cdFx0XHRcdFx0XHR0bXAgPSB0aGlzLmdldF9ydWxlcyhwYXIpO1xuXHRcdFx0XHRcdFx0aWYodG1wLm1heF9jaGlsZHJlbiAhPT0gdW5kZWZpbmVkICYmIHRtcC5tYXhfY2hpbGRyZW4gIT09IC0xICYmIHRtcC5tYXhfY2hpbGRyZW4gPT09IHBhci5jaGlsZHJlbi5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5fZGF0YS5jb3JlLmxhc3RfZXJyb3IgPSB7ICdlcnJvcicgOiAnY2hlY2snLCAncGx1Z2luJyA6ICd0eXBlcycsICdpZCcgOiAndHlwZXNfMDEnLCAncmVhc29uJyA6ICdtYXhfY2hpbGRyZW4gcHJldmVudHMgZnVuY3Rpb246ICcgKyBjaGssICdkYXRhJyA6IEpTT04uc3RyaW5naWZ5KHsgJ2NoaycgOiBjaGssICdwb3MnIDogcG9zLCAnb2JqJyA6IG9iaiAmJiBvYmouaWQgPyBvYmouaWQgOiBmYWxzZSwgJ3BhcicgOiBwYXIgJiYgcGFyLmlkID8gcGFyLmlkIDogZmFsc2UgfSkgfTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0aWYodG1wLnZhbGlkX2NoaWxkcmVuICE9PSB1bmRlZmluZWQgJiYgdG1wLnZhbGlkX2NoaWxkcmVuICE9PSAtMSAmJiAkLmluQXJyYXkob2JqLnR5cGUsIHRtcC52YWxpZF9jaGlsZHJlbikgPT09IC0xKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuX2RhdGEuY29yZS5sYXN0X2Vycm9yID0geyAnZXJyb3InIDogJ2NoZWNrJywgJ3BsdWdpbicgOiAndHlwZXMnLCAnaWQnIDogJ3R5cGVzXzAyJywgJ3JlYXNvbicgOiAndmFsaWRfY2hpbGRyZW4gcHJldmVudHMgZnVuY3Rpb246ICcgKyBjaGssICdkYXRhJyA6IEpTT04uc3RyaW5naWZ5KHsgJ2NoaycgOiBjaGssICdwb3MnIDogcG9zLCAnb2JqJyA6IG9iaiAmJiBvYmouaWQgPyBvYmouaWQgOiBmYWxzZSwgJ3BhcicgOiBwYXIgJiYgcGFyLmlkID8gcGFyLmlkIDogZmFsc2UgfSkgfTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0aWYobSAmJiBvYmouY2hpbGRyZW5fZCAmJiBvYmoucGFyZW50cykge1xuXHRcdFx0XHRcdFx0XHRkID0gMDtcblx0XHRcdFx0XHRcdFx0Zm9yKGkgPSAwLCBqID0gb2JqLmNoaWxkcmVuX2QubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdFx0XHRcdFx0ZCA9IE1hdGgubWF4KGQsIG1bb2JqLmNoaWxkcmVuX2RbaV1dLnBhcmVudHMubGVuZ3RoKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRkID0gZCAtIG9iai5wYXJlbnRzLmxlbmd0aCArIDE7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZihkIDw9IDAgfHwgZCA9PT0gdW5kZWZpbmVkKSB7IGQgPSAxOyB9XG5cdFx0XHRcdFx0XHRkbyB7XG5cdFx0XHRcdFx0XHRcdGlmKHRtcC5tYXhfZGVwdGggIT09IHVuZGVmaW5lZCAmJiB0bXAubWF4X2RlcHRoICE9PSAtMSAmJiB0bXAubWF4X2RlcHRoIDwgZCkge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuX2RhdGEuY29yZS5sYXN0X2Vycm9yID0geyAnZXJyb3InIDogJ2NoZWNrJywgJ3BsdWdpbicgOiAndHlwZXMnLCAnaWQnIDogJ3R5cGVzXzAzJywgJ3JlYXNvbicgOiAnbWF4X2RlcHRoIHByZXZlbnRzIGZ1bmN0aW9uOiAnICsgY2hrLCAnZGF0YScgOiBKU09OLnN0cmluZ2lmeSh7ICdjaGsnIDogY2hrLCAncG9zJyA6IHBvcywgJ29iaicgOiBvYmogJiYgb2JqLmlkID8gb2JqLmlkIDogZmFsc2UsICdwYXInIDogcGFyICYmIHBhci5pZCA/IHBhci5pZCA6IGZhbHNlIH0pIH07XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHBhciA9IHRoaXMuZ2V0X25vZGUocGFyLnBhcmVudCk7XG5cdFx0XHRcdFx0XHRcdHRtcCA9IHRoaXMuZ2V0X3J1bGVzKHBhcik7XG5cdFx0XHRcdFx0XHRcdGQrKztcblx0XHRcdFx0XHRcdH0gd2hpbGUocGFyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9O1xuXHRcdC8qKlxuXHRcdCAqIHVzZWQgdG8gcmV0cmlldmUgdGhlIHR5cGUgc2V0dGluZ3Mgb2JqZWN0IGZvciBhIG5vZGVcblx0XHQgKiBAbmFtZSBnZXRfcnVsZXMob2JqKVxuXHRcdCAqIEBwYXJhbSB7bWl4ZWR9IG9iaiB0aGUgbm9kZSB0byBmaW5kIHRoZSBydWxlcyBmb3Jcblx0XHQgKiBAcmV0dXJuIHtPYmplY3R9XG5cdFx0ICogQHBsdWdpbiB0eXBlc1xuXHRcdCAqL1xuXHRcdHRoaXMuZ2V0X3J1bGVzID0gZnVuY3Rpb24gKG9iaikge1xuXHRcdFx0b2JqID0gdGhpcy5nZXRfbm9kZShvYmopO1xuXHRcdFx0aWYoIW9iaikgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdHZhciB0bXAgPSB0aGlzLmdldF90eXBlKG9iaiwgdHJ1ZSk7XG5cdFx0XHRpZih0bXAubWF4X2RlcHRoID09PSB1bmRlZmluZWQpIHsgdG1wLm1heF9kZXB0aCA9IC0xOyB9XG5cdFx0XHRpZih0bXAubWF4X2NoaWxkcmVuID09PSB1bmRlZmluZWQpIHsgdG1wLm1heF9jaGlsZHJlbiA9IC0xOyB9XG5cdFx0XHRpZih0bXAudmFsaWRfY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgeyB0bXAudmFsaWRfY2hpbGRyZW4gPSAtMTsgfVxuXHRcdFx0cmV0dXJuIHRtcDtcblx0XHR9O1xuXHRcdC8qKlxuXHRcdCAqIHVzZWQgdG8gcmV0cmlldmUgdGhlIHR5cGUgc3RyaW5nIG9yIHNldHRpbmdzIG9iamVjdCBmb3IgYSBub2RlXG5cdFx0ICogQG5hbWUgZ2V0X3R5cGUob2JqIFssIHJ1bGVzXSlcblx0XHQgKiBAcGFyYW0ge21peGVkfSBvYmogdGhlIG5vZGUgdG8gZmluZCB0aGUgcnVsZXMgZm9yXG5cdFx0ICogQHBhcmFtIHtCb29sZWFufSBydWxlcyBpZiBzZXQgdG8gYHRydWVgIGluc3RlYWQgb2YgYSBzdHJpbmcgdGhlIHNldHRpbmdzIG9iamVjdCB3aWxsIGJlIHJldHVybmVkXG5cdFx0ICogQHJldHVybiB7U3RyaW5nfE9iamVjdH1cblx0XHQgKiBAcGx1Z2luIHR5cGVzXG5cdFx0ICovXG5cdFx0dGhpcy5nZXRfdHlwZSA9IGZ1bmN0aW9uIChvYmosIHJ1bGVzKSB7XG5cdFx0XHRvYmogPSB0aGlzLmdldF9ub2RlKG9iaik7XG5cdFx0XHRyZXR1cm4gKCFvYmopID8gZmFsc2UgOiAoIHJ1bGVzID8gJC5leHRlbmQoeyAndHlwZScgOiBvYmoudHlwZSB9LCB0aGlzLnNldHRpbmdzLnR5cGVzW29iai50eXBlXSkgOiBvYmoudHlwZSk7XG5cdFx0fTtcblx0XHQvKipcblx0XHQgKiB1c2VkIHRvIGNoYW5nZSBhIG5vZGUncyB0eXBlXG5cdFx0ICogQG5hbWUgc2V0X3R5cGUob2JqLCB0eXBlKVxuXHRcdCAqIEBwYXJhbSB7bWl4ZWR9IG9iaiB0aGUgbm9kZSB0byBjaGFuZ2Vcblx0XHQgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSB0aGUgbmV3IHR5cGVcblx0XHQgKiBAcGx1Z2luIHR5cGVzXG5cdFx0ICovXG5cdFx0dGhpcy5zZXRfdHlwZSA9IGZ1bmN0aW9uIChvYmosIHR5cGUpIHtcblx0XHRcdHZhciB0LCB0MSwgdDIsIG9sZF90eXBlLCBvbGRfaWNvbjtcblx0XHRcdGlmKCQuaXNBcnJheShvYmopKSB7XG5cdFx0XHRcdG9iaiA9IG9iai5zbGljZSgpO1xuXHRcdFx0XHRmb3IodDEgPSAwLCB0MiA9IG9iai5sZW5ndGg7IHQxIDwgdDI7IHQxKyspIHtcblx0XHRcdFx0XHR0aGlzLnNldF90eXBlKG9ialt0MV0sIHR5cGUpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0dCA9IHRoaXMuc2V0dGluZ3MudHlwZXM7XG5cdFx0XHRvYmogPSB0aGlzLmdldF9ub2RlKG9iaik7XG5cdFx0XHRpZighdFt0eXBlXSB8fCAhb2JqKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0b2xkX3R5cGUgPSBvYmoudHlwZTtcblx0XHRcdG9sZF9pY29uID0gdGhpcy5nZXRfaWNvbihvYmopO1xuXHRcdFx0b2JqLnR5cGUgPSB0eXBlO1xuXHRcdFx0aWYob2xkX2ljb24gPT09IHRydWUgfHwgKHRbb2xkX3R5cGVdICYmIHRbb2xkX3R5cGVdLmljb24gJiYgb2xkX2ljb24gPT09IHRbb2xkX3R5cGVdLmljb24pKSB7XG5cdFx0XHRcdHRoaXMuc2V0X2ljb24ob2JqLCB0W3R5cGVdLmljb24gIT09IHVuZGVmaW5lZCA/IHRbdHlwZV0uaWNvbiA6IHRydWUpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fTtcblx0fTtcblx0Ly8gaW5jbHVkZSB0aGUgdHlwZXMgcGx1Z2luIGJ5IGRlZmF1bHRcblx0Ly8gJC5qc3RyZWUuZGVmYXVsdHMucGx1Z2lucy5wdXNoKFwidHlwZXNcIik7XG5cbi8qKlxuICogIyMjIFVuaXF1ZSBwbHVnaW5cbiAqXG4gKiBFbmZvcmNlcyB0aGF0IG5vIG5vZGVzIHdpdGggdGhlIHNhbWUgbmFtZSBjYW4gY29leGlzdCBhcyBzaWJsaW5ncy5cbiAqL1xuXG5cdCQuanN0cmVlLnBsdWdpbnMudW5pcXVlID0gZnVuY3Rpb24gKG9wdGlvbnMsIHBhcmVudCkge1xuXHRcdHRoaXMuY2hlY2sgPSBmdW5jdGlvbiAoY2hrLCBvYmosIHBhciwgcG9zKSB7XG5cdFx0XHRpZihwYXJlbnQuY2hlY2suY2FsbCh0aGlzLCBjaGssIG9iaiwgcGFyLCBwb3MpID09PSBmYWxzZSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdG9iaiA9IG9iaiAmJiBvYmouaWQgPyBvYmogOiB0aGlzLmdldF9ub2RlKG9iaik7XG5cdFx0XHRwYXIgPSBwYXIgJiYgcGFyLmlkID8gcGFyIDogdGhpcy5nZXRfbm9kZShwYXIpO1xuXHRcdFx0aWYoIXBhciB8fCAhcGFyLmNoaWxkcmVuKSB7IHJldHVybiB0cnVlOyB9XG5cdFx0XHR2YXIgbiA9IGNoayA9PT0gXCJyZW5hbWVfbm9kZVwiID8gcG9zIDogb2JqLnRleHQsXG5cdFx0XHRcdGMgPSBbXSxcblx0XHRcdFx0bSA9IHRoaXMuX21vZGVsLmRhdGEsIGksIGo7XG5cdFx0XHRmb3IoaSA9IDAsIGogPSBwYXIuY2hpbGRyZW4ubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdFx0XHRcdGMucHVzaChtW3Bhci5jaGlsZHJlbltpXV0udGV4dCk7XG5cdFx0XHR9XG5cdFx0XHRzd2l0Y2goY2hrKSB7XG5cdFx0XHRcdGNhc2UgXCJkZWxldGVfbm9kZVwiOlxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRjYXNlIFwicmVuYW1lX25vZGVcIjpcblx0XHRcdFx0Y2FzZSBcImNvcHlfbm9kZVwiOlxuXHRcdFx0XHRcdGkgPSAoJC5pbkFycmF5KG4sIGMpID09PSAtMSk7XG5cdFx0XHRcdFx0aWYoIWkpIHtcblx0XHRcdFx0XHRcdHRoaXMuX2RhdGEuY29yZS5sYXN0X2Vycm9yID0geyAnZXJyb3InIDogJ2NoZWNrJywgJ3BsdWdpbicgOiAndW5pcXVlJywgJ2lkJyA6ICd1bmlxdWVfMDEnLCAncmVhc29uJyA6ICdDaGlsZCB3aXRoIG5hbWUgJyArIG4gKyAnIGFscmVhZHkgZXhpc3RzLiBQcmV2ZW50aW5nOiAnICsgY2hrLCAnZGF0YScgOiBKU09OLnN0cmluZ2lmeSh7ICdjaGsnIDogY2hrLCAncG9zJyA6IHBvcywgJ29iaicgOiBvYmogJiYgb2JqLmlkID8gb2JqLmlkIDogZmFsc2UsICdwYXInIDogcGFyICYmIHBhci5pZCA/IHBhci5pZCA6IGZhbHNlIH0pIH07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0XHRjYXNlIFwibW92ZV9ub2RlXCI6XG5cdFx0XHRcdFx0aSA9IChvYmoucGFyZW50ID09PSBwYXIuaWQgfHwgJC5pbkFycmF5KG4sIGMpID09PSAtMSk7XG5cdFx0XHRcdFx0aWYoIWkpIHtcblx0XHRcdFx0XHRcdHRoaXMuX2RhdGEuY29yZS5sYXN0X2Vycm9yID0geyAnZXJyb3InIDogJ2NoZWNrJywgJ3BsdWdpbicgOiAndW5pcXVlJywgJ2lkJyA6ICd1bmlxdWVfMDEnLCAncmVhc29uJyA6ICdDaGlsZCB3aXRoIG5hbWUgJyArIG4gKyAnIGFscmVhZHkgZXhpc3RzLiBQcmV2ZW50aW5nOiAnICsgY2hrLCAnZGF0YScgOiBKU09OLnN0cmluZ2lmeSh7ICdjaGsnIDogY2hrLCAncG9zJyA6IHBvcywgJ29iaicgOiBvYmogJiYgb2JqLmlkID8gb2JqLmlkIDogZmFsc2UsICdwYXInIDogcGFyICYmIHBhci5pZCA/IHBhci5pZCA6IGZhbHNlIH0pIH07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fTtcblx0fTtcblxuXHQvLyBpbmNsdWRlIHRoZSB1bmlxdWUgcGx1Z2luIGJ5IGRlZmF1bHRcblx0Ly8gJC5qc3RyZWUuZGVmYXVsdHMucGx1Z2lucy5wdXNoKFwidW5pcXVlXCIpO1xuXG5cbi8qKlxuICogIyMjIFdob2xlcm93IHBsdWdpblxuICpcbiAqIE1ha2VzIGVhY2ggbm9kZSBhcHBlYXIgYmxvY2sgbGV2ZWwuIE1ha2luZyBzZWxlY3Rpb24gZWFzaWVyLiBNYXkgY2F1c2Ugc2xvdyBkb3duIGZvciBsYXJnZSB0cmVlcyBpbiBvbGQgYnJvd3NlcnMuXG4gKi9cblxuXHR2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnRElWJyk7XG5cdGRpdi5zZXRBdHRyaWJ1dGUoJ3Vuc2VsZWN0YWJsZScsJ29uJyk7XG5cdGRpdi5jbGFzc05hbWUgPSAnanN0cmVlLXdob2xlcm93Jztcblx0ZGl2LmlubmVySFRNTCA9ICcmIzE2MDsnO1xuXHQkLmpzdHJlZS5wbHVnaW5zLndob2xlcm93ID0gZnVuY3Rpb24gKG9wdGlvbnMsIHBhcmVudCkge1xuXHRcdHRoaXMuYmluZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHBhcmVudC5iaW5kLmNhbGwodGhpcyk7XG5cblx0XHRcdHRoaXMuZWxlbWVudFxuXHRcdFx0XHQub24oJ2xvYWRpbmcnLCAkLnByb3h5KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdGRpdi5zdHlsZS5oZWlnaHQgPSB0aGlzLl9kYXRhLmNvcmUubGlfaGVpZ2h0ICsgJ3B4Jztcblx0XHRcdFx0XHR9LCB0aGlzKSlcblx0XHRcdFx0Lm9uKCdyZWFkeS5qc3RyZWUgc2V0X3N0YXRlLmpzdHJlZScsICQucHJveHkoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0dGhpcy5oaWRlX2RvdHMoKTtcblx0XHRcdFx0XHR9LCB0aGlzKSlcblx0XHRcdFx0Lm9uKFwicmVhZHkuanN0cmVlXCIsICQucHJveHkoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0dGhpcy5nZXRfY29udGFpbmVyX3VsKCkuYWRkQ2xhc3MoJ2pzdHJlZS13aG9sZXJvdy11bCcpO1xuXHRcdFx0XHRcdH0sIHRoaXMpKVxuXHRcdFx0XHQub24oXCJkZXNlbGVjdF9hbGwuanN0cmVlXCIsICQucHJveHkoZnVuY3Rpb24gKGUsIGRhdGEpIHtcblx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5maW5kKCcuanN0cmVlLXdob2xlcm93LWNsaWNrZWQnKS5yZW1vdmVDbGFzcygnanN0cmVlLXdob2xlcm93LWNsaWNrZWQnKTtcblx0XHRcdFx0XHR9LCB0aGlzKSlcblx0XHRcdFx0Lm9uKFwiY2hhbmdlZC5qc3RyZWVcIiwgJC5wcm94eShmdW5jdGlvbiAoZSwgZGF0YSkge1xuXHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LmZpbmQoJy5qc3RyZWUtd2hvbGVyb3ctY2xpY2tlZCcpLnJlbW92ZUNsYXNzKCdqc3RyZWUtd2hvbGVyb3ctY2xpY2tlZCcpO1xuXHRcdFx0XHRcdFx0dmFyIHRtcCA9IGZhbHNlLCBpLCBqO1xuXHRcdFx0XHRcdFx0Zm9yKGkgPSAwLCBqID0gZGF0YS5zZWxlY3RlZC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHRcdFx0XHRcdFx0dG1wID0gdGhpcy5nZXRfbm9kZShkYXRhLnNlbGVjdGVkW2ldLCB0cnVlKTtcblx0XHRcdFx0XHRcdFx0aWYodG1wICYmIHRtcC5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdFx0XHR0bXAuY2hpbGRyZW4oJy5qc3RyZWUtd2hvbGVyb3cnKS5hZGRDbGFzcygnanN0cmVlLXdob2xlcm93LWNsaWNrZWQnKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sIHRoaXMpKVxuXHRcdFx0XHQub24oXCJvcGVuX25vZGUuanN0cmVlXCIsICQucHJveHkoZnVuY3Rpb24gKGUsIGRhdGEpIHtcblx0XHRcdFx0XHRcdHRoaXMuZ2V0X25vZGUoZGF0YS5ub2RlLCB0cnVlKS5maW5kKCcuanN0cmVlLWNsaWNrZWQnKS5wYXJlbnQoKS5jaGlsZHJlbignLmpzdHJlZS13aG9sZXJvdycpLmFkZENsYXNzKCdqc3RyZWUtd2hvbGVyb3ctY2xpY2tlZCcpO1xuXHRcdFx0XHRcdH0sIHRoaXMpKVxuXHRcdFx0XHQub24oXCJob3Zlcl9ub2RlLmpzdHJlZSBkZWhvdmVyX25vZGUuanN0cmVlXCIsICQucHJveHkoZnVuY3Rpb24gKGUsIGRhdGEpIHtcblx0XHRcdFx0XHRcdHRoaXMuZ2V0X25vZGUoZGF0YS5ub2RlLCB0cnVlKS5jaGlsZHJlbignLmpzdHJlZS13aG9sZXJvdycpW2UudHlwZSA9PT0gXCJob3Zlcl9ub2RlXCI/XCJhZGRDbGFzc1wiOlwicmVtb3ZlQ2xhc3NcIl0oJ2pzdHJlZS13aG9sZXJvdy1ob3ZlcmVkJyk7XG5cdFx0XHRcdFx0fSwgdGhpcykpXG5cdFx0XHRcdC5vbihcImNvbnRleHRtZW51LmpzdHJlZVwiLCBcIi5qc3RyZWUtd2hvbGVyb3dcIiwgJC5wcm94eShmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdFx0JChlLmN1cnJlbnRUYXJnZXQpLmNsb3Nlc3QoXCJsaVwiKS5jaGlsZHJlbihcImE6ZXEoMClcIikudHJpZ2dlcignY29udGV4dG1lbnUnLGUpO1xuXHRcdFx0XHRcdH0sIHRoaXMpKVxuXHRcdFx0XHQub24oXCJjbGljay5qc3RyZWVcIiwgXCIuanN0cmVlLXdob2xlcm93XCIsIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdFx0XHRlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXHRcdFx0XHRcdFx0dmFyIHRtcCA9ICQuRXZlbnQoJ2NsaWNrJywgeyBtZXRhS2V5IDogZS5tZXRhS2V5LCBjdHJsS2V5IDogZS5jdHJsS2V5LCBhbHRLZXkgOiBlLmFsdEtleSwgc2hpZnRLZXkgOiBlLnNoaWZ0S2V5IH0pO1xuXHRcdFx0XHRcdFx0JChlLmN1cnJlbnRUYXJnZXQpLmNsb3Nlc3QoXCJsaVwiKS5jaGlsZHJlbihcImE6ZXEoMClcIikudHJpZ2dlcih0bXApLmZvY3VzKCk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0Lm9uKFwiY2xpY2suanN0cmVlXCIsIFwiLmpzdHJlZS1sZWFmID4gLmpzdHJlZS1vY2xcIiwgJC5wcm94eShmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdFx0ZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcblx0XHRcdFx0XHRcdHZhciB0bXAgPSAkLkV2ZW50KCdjbGljaycsIHsgbWV0YUtleSA6IGUubWV0YUtleSwgY3RybEtleSA6IGUuY3RybEtleSwgYWx0S2V5IDogZS5hbHRLZXksIHNoaWZ0S2V5IDogZS5zaGlmdEtleSB9KTtcblx0XHRcdFx0XHRcdCQoZS5jdXJyZW50VGFyZ2V0KS5jbG9zZXN0KFwibGlcIikuY2hpbGRyZW4oXCJhOmVxKDApXCIpLnRyaWdnZXIodG1wKS5mb2N1cygpO1xuXHRcdFx0XHRcdH0sIHRoaXMpKVxuXHRcdFx0XHQub24oXCJtb3VzZW92ZXIuanN0cmVlXCIsIFwiLmpzdHJlZS13aG9sZXJvdywgLmpzdHJlZS1pY29uXCIsICQucHJveHkoZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0XHRcdGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG5cdFx0XHRcdFx0XHR0aGlzLmhvdmVyX25vZGUoZS5jdXJyZW50VGFyZ2V0KTtcblx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHR9LCB0aGlzKSlcblx0XHRcdFx0Lm9uKFwibW91c2VsZWF2ZS5qc3RyZWVcIiwgXCIuanN0cmVlLW5vZGVcIiwgJC5wcm94eShmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdFx0dGhpcy5kZWhvdmVyX25vZGUoZS5jdXJyZW50VGFyZ2V0KTtcblx0XHRcdFx0XHR9LCB0aGlzKSk7XG5cdFx0fTtcblx0XHR0aGlzLnRlYXJkb3duID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYodGhpcy5zZXR0aW5ncy53aG9sZXJvdykge1xuXHRcdFx0XHR0aGlzLmVsZW1lbnQuZmluZChcIi5qc3RyZWUtd2hvbGVyb3dcIikucmVtb3ZlKCk7XG5cdFx0XHR9XG5cdFx0XHRwYXJlbnQudGVhcmRvd24uY2FsbCh0aGlzKTtcblx0XHR9O1xuXHRcdHRoaXMucmVkcmF3X25vZGUgPSBmdW5jdGlvbihvYmosIGRlZXAsIGNhbGxiYWNrKSB7XG5cdFx0XHRvYmogPSBwYXJlbnQucmVkcmF3X25vZGUuY2FsbCh0aGlzLCBvYmosIGRlZXAsIGNhbGxiYWNrKTtcblx0XHRcdGlmKG9iaikge1xuXHRcdFx0XHR2YXIgdG1wID0gZGl2LmNsb25lTm9kZSh0cnVlKTtcblx0XHRcdFx0Ly90bXAuc3R5bGUuaGVpZ2h0ID0gdGhpcy5fZGF0YS5jb3JlLmxpX2hlaWdodCArICdweCc7XG5cdFx0XHRcdGlmKCQuaW5BcnJheShvYmouaWQsIHRoaXMuX2RhdGEuY29yZS5zZWxlY3RlZCkgIT09IC0xKSB7IHRtcC5jbGFzc05hbWUgKz0gJyBqc3RyZWUtd2hvbGVyb3ctY2xpY2tlZCc7IH1cblx0XHRcdFx0b2JqLmluc2VydEJlZm9yZSh0bXAsIG9iai5jaGlsZE5vZGVzWzBdKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBvYmo7XG5cdFx0fTtcblx0fTtcblx0Ly8gaW5jbHVkZSB0aGUgd2hvbGVyb3cgcGx1Z2luIGJ5IGRlZmF1bHRcblx0Ly8gJC5qc3RyZWUuZGVmYXVsdHMucGx1Z2lucy5wdXNoKFwid2hvbGVyb3dcIik7XG5cbn0pKTsiXSwiZmlsZSI6ImpzdHJlZS5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9