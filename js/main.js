;(function(window) {

	'use strict';

	var support = { animations : Modernizr.cssanimations },
		animEndEventNames = { 'WebkitAnimation' : 'webkitAnimationEnd', 'OAnimation' : 'oAnimationEnd', 'msAnimation' : 'MSAnimationEnd', 'animation' : 'animationend' },
		animEndEventName = animEndEventNames[ Modernizr.prefixed( 'animation' ) ],
		onEndAnimation = function( el, callback ) {
			var onEndCallbackFn = function( ev ) {
				if( support.animations ) {
					if( ev.target != this ) return;
					this.removeEventListener( animEndEventName, onEndCallbackFn );
				}
				if( callback && typeof callback === 'function' ) { callback.call(); }
			};
			if( support.animations ) {
				el.addEventListener( animEndEventName, onEndCallbackFn );
			}
			else {
				onEndCallbackFn();
			}
		};

	function extend( a, b ) {
		for( var key in b ) {
			if( b.hasOwnProperty( key ) ) {
				a[key] = b[key];
			}
		}
		return a;
	}

	function MLMenu(el, options) {
		this.el = el;
		this.options = extend( {}, this.options );
		extend( this.options, options );
		this.menus = [].slice.call(this.el.querySelectorAll('.menu__level'));
		this.current_menu = 0;
		var current_menu;
		this.menus.forEach(function(menuEl, pos) {
			var items = menuEl.querySelectorAll('.menu__item');
			items.forEach(function(itemEl, iPos) {
				var currentLink = itemEl.querySelector('.menu__link--current');
				if (currentLink) {
					current_menu = pos;
				}
			});
		});

		if (current_menu) {
			this.current_menu = current_menu;
		}

		this._init();
	}

	MLMenu.prototype.options = {
		breadcrumbsCtrl : true,
		initialBreadcrumb : 'all',
		backCtrl : true,
		itemsDelayInterval : 60,
		direction : 'r2l',
		onItemClick : function(ev, itemName) { return false; }
	};

	MLMenu.prototype._init = function() {
    this.menusArr = [];
		this.breadCrumbs = false;
		var self = this;
		var submenus = [];

		this.menus.forEach(function(menuEl, pos) {
			var menu = {menuEl : menuEl, menuItems : [].slice.call(menuEl.querySelectorAll('.menu__item'))};
			self.menusArr.push(menu);
			if( pos === self.current_menu ) {
				classie.add(menuEl, 'menu__level--current');
			}

			var menu_x = menuEl.getAttribute('data-menu');
			var links = menuEl.querySelectorAll('.menu__link');
			links.forEach(function(linkEl, lPos) {
				var submenu = linkEl.getAttribute('data-submenu');
				if (submenu) {
					var pushMe = {"menu":submenu, "name": linkEl.innerHTML };
					if (submenus[pos]) {
						submenus[pos].push(pushMe);
					} else {
						submenus[pos] = []
						submenus[pos].push(pushMe);
					}
				}
			});
		});

		// this.menus.forEach(function(menuEl, pos) {
		// 	var menu_x = menuEl.getAttribute('data-menu');
		// 	submenus.forEach(function(subMenuEl, menu_root) {
		// 		subMenuEl.forEach(function(subMenuItem, subPos) {
		// 			if (subMenuItem.menu == menu_x) {
		// 				self.menusArr[pos].backIdx = menu_root;
		// 				self.menusArr[pos].name = subMenuItem.name;
		// 			}
		// 		});
		// 	});
		// });

		if( self.options.breadcrumbsCtrl ) {
			this.breadcrumbsCtrl = document.createElement('nav');
			this.breadcrumbsCtrl.className = 'menu__breadcrumbs';
			this.breadcrumbsCtrl.setAttribute('aria-label', 'You are here');
			this.el.insertBefore(this.breadcrumbsCtrl, this.el.firstChild);
			this._addBreadcrumb(0);
			if (self.menusArr[self.current_menu].backIdx != 0 && self.current_menu != 0) {
				this._crawlCrumbs(self.menusArr[self.current_menu].backIdx, self.menusArr);
				this.breadCrumbs = true;
			}
			if (self.current_menu != 0) {
				this._addBreadcrumb(self.current_menu);
				this.breadCrumbs = true;
			}
		}
		this._initEvents();
	};

	  MLMenu.prototype._initEvents = function() {
		var self = this;

		for(var i = 0, len = this.menusArr.length; i < len; ++i) {
			this.menusArr[i].menuItems.forEach(function(item, pos) {
				item.querySelector('a').addEventListener('click', function(ev) {
					var submenu = ev.target.getAttribute('data-submenu'),
						itemName = ev.target.innerHTML,
						subMenuEl = self.el.querySelector('ul[data-menu="' + submenu + '"]');

					if( submenu && subMenuEl ) {
						ev.preventDefault();
						self._openSubMenu(subMenuEl, pos, itemName);
					}
					else {
						var currentlink = self.el.querySelector('.menu__link--current');
						if( currentlink ) {
							classie.remove(self.el.querySelector('.menu__link--current'), 'menu__link--current');
						}
						classie.add(ev.target, 'menu__link--current');
						self.options.onItemClick(ev, itemName);
					}
				});
			});
		}

		if( this.options.backCtrl ) {
			this.backCtrl.addEventListener('click', function() {
				self._back();
			});
		}
	};

	MLMenu.prototype._openSubMenu = function(subMenuEl, clickPosition, subMenuName) {
		if( this.isAnimating ) {
			return false;
		}
		this.isAnimating = true;
		this.menusArr[this.menus.indexOf(subMenuEl)].backIdx = this.current_menu;
		this.menusArr[this.menus.indexOf(subMenuEl)].name = subMenuName;
		this._menuOut(clickPosition);
		this._menuIn(subMenuEl, clickPosition);
	};

	MLMenu.prototype._back = function() {
		if( this.isAnimating ) {
			return false;
		}
		this.isAnimating = true;
		this._menuOut();
		var backMenu = this.menusArr[this.menusArr[this.current_menu].backIdx].menuEl;
		this._menuIn(backMenu);
		if( this.options.breadcrumbsCtrl ) {
			this.breadcrumbsCtrl.removeChild(this.breadcrumbsCtrl.lastElementChild);
		}
	};

	MLMenu.prototype._menuOut = function(clickPosition) {
		var self = this,
			currentMenu = this.menusArr[this.current_menu].menuEl,
			isBackNavigation = typeof clickPosition == 'undefined' ? true : false;
		this.menusArr[this.current_menu].menuItems.forEach(function(item, pos) {
			item.style.WebkitAnimationDelay = item.style.animationDelay = isBackNavigation ? parseInt(pos * self.options.itemsDelayInterval) + 'ms' : parseInt(Math.abs(clickPosition - pos) * self.options.itemsDelayInterval) + 'ms';
		});
		if( this.options.direction === 'r2l' ) {
			classie.add(currentMenu, !isBackNavigation ? 'animate-outToLeft' : 'animate-outToRight');
		}
		else {
			classie.add(currentMenu, isBackNavigation ? 'animate-outToLeft' : 'animate-outToRight');
		}
	};

	MLMenu.prototype._menuIn = function(nextMenuEl, clickPosition) {
		var self = this,
			currentMenu = this.menusArr[this.current_menu].menuEl,
			isBackNavigation = typeof clickPosition == 'undefined' ? true : false,
			nextMenuIdx = this.menus.indexOf(nextMenuEl),
			nextMenu = this.menusArr[nextMenuIdx],
			nextMenuEl = nextMenu.menuEl,
			nextMenuItems = nextMenu.menuItems,
			nextMenuItemsTotal = nextMenuItems.length;
			nextMenuItems.forEach(function(item, pos) {
			item.style.WebkitAnimationDelay = item.style.animationDelay = isBackNavigation ? parseInt(pos * self.options.itemsDelayInterval) + 'ms' : parseInt(Math.abs(clickPosition - pos) * self.options.itemsDelayInterval) + 'ms';
		var farthestIdx = clickPosition <= nextMenuItemsTotal/2 || isBackNavigation ? nextMenuItemsTotal - 1 : 0;

		if( pos === farthestIdx ) {
			onEndAnimation(item, function() {
				if( self.options.direction === 'r2l' ) {
					classie.remove(currentMenu, !isBackNavigation ? 'animate-outToLeft' : 'animate-outToRight');
					classie.remove(nextMenuEl, !isBackNavigation ? 'animate-inFromRight' : 'animate-inFromLeft');
				}
				else {
					classie.remove(currentMenu, isBackNavigation ? 'animate-outToLeft' : 'animate-outToRight');
					classie.remove(nextMenuEl, isBackNavigation ? 'animate-inFromRight' : 'animate-inFromLeft');
				}
				classie.remove(currentMenu, 'menu__level--current');
				classie.add(nextMenuEl, 'menu__level--current');
				self.current_menu = nextMenuIdx;

				if( !isBackNavigation ) {
					if( self.options.backCtrl ) {
						classie.remove(self.backCtrl, 'menu__back--hidden');
					}
					self._addBreadcrumb(nextMenuIdx);
				}
				else if( self.current_menu === 0 && self.options.backCtrl ) {
					classie.add(self.backCtrl, 'menu__back--hidden');
				}
				self.isAnimating = false;
				nextMenuEl.focus();
			});
		}
	});

		if( this.options.direction === 'r2l' ) {
			classie.add(nextMenuEl, !isBackNavigation ? 'animate-inFromRight' : 'animate-inFromLeft');
		}
		else {
			classie.add(nextMenuEl, isBackNavigation ? 'animate-inFromRight' : 'animate-inFromLeft');
		}
	};

	MLMenu.prototype._addBreadcrumb = function(idx) {
		if( !this.options.breadcrumbsCtrl ) {
			return false;
		}

		var bc = document.createElement('a');
		bc.href = '#'; // make it focusable
		bc.innerHTML = idx ? this.menusArr[idx].name : this.options.initialBreadcrumb;
		this.breadcrumbsCtrl.appendChild(bc);

		var self = this;
		bc.addEventListener('click', function(ev) {
			ev.preventDefault();
			if( !bc.nextSibling || self.isAnimating ) {
				return false;
			}
			self.isAnimating = true;
			self._menuOut();
			var nextMenu = self.menusArr[idx].menuEl;
			self._menuIn(nextMenu);
			var siblingNode;
			while (siblingNode = bc.nextSibling) {
				self.breadcrumbsCtrl.removeChild(siblingNode);
			}
		});
	};

	MLMenu.prototype._crawlCrumbs = function(currentMenu, menuArray) {
		if (menuArray[currentMenu].backIdx != 0) {
			this._crawlCrumbs(menuArray[currentMenu].backIdx, menuArray);
		}
		this._addBreadcrumb(currentMenu);
	}

	window.MLMenu = MLMenu;

})(window);
