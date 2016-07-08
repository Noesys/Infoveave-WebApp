/// <reference path="../../typings/tsd.d.ts"/>
(function ($) {
    var Application = (function () {
        function Application() {
            var _this = this;
            this.VERSION = "2.0.0";
            this.AUTHOR = "Noesys";
            this.SUPPORT = "support@infoveave.com";
            // Set environment vars
            this.setUserOS = function () {
                var OSName = "";
                if (navigator.appVersion.indexOf("Win") != -1)
                    OSName = "windows";
                if (navigator.appVersion.indexOf("Mac") != -1)
                    OSName = "mac";
                if (navigator.appVersion.indexOf("X11") != -1)
                    OSName = "unix";
                if (navigator.appVersion.indexOf("Linux") != -1)
                    OSName = "linux";
                _this.$body.addClass(OSName);
            };
            this.setUserAgent = function () {
                if (navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i)) {
                    _this.$body.addClass('mobile');
                }
                else {
                    _this.$body.addClass('desktop');
                    if (navigator.userAgent.match(/MSIE 9.0/)) {
                        _this.$body.addClass('ie9');
                    }
                }
            };
            // Pages util functions
            this.isVisibleXs = function () {
                (!$('#pg-visible-xs').length) && _this.$body.append('<div id="pg-visible-xs" class="visible-xs" />');
                return $('#pg-visible-xs').is(':visible');
            };
            this.isVisibleSm = function () {
                (!$('#pg-visible-sm').length) && _this.$body.append('<div id="pg-visible-sm" class="visible-sm" />');
                return $('#pg-visible-sm').is(':visible');
            };
            this.isVisibleMd = function () {
                (!$('#pg-visible-md').length) && _this.$body.append('<div id="pg-visible-md" class="visible-md" />');
                return $('#pg-visible-md').is(':visible');
            };
            this.isVisibleLg = function () {
                (!$('#pg-visible-lg').length) && _this.$body.append('<div id="pg-visible-lg" class="visible-lg" />');
                return $('#pg-visible-lg').is(':visible');
            };
            this.getUserAgent = function () {
                return $('body').hasClass('mobile') ? "mobile" : "desktop";
            };
            this.setFullScreen = function (element) {
                // Supports most browsers and their versions.
                var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullscreen;
                if (requestMethod) {
                    requestMethod.call(element);
                }
                else if (typeof window.ActiveXObject !== "undefined") {
                    var wscript = new ActiveXObject("WScript.Shell");
                    if (wscript !== null) {
                        wscript.SendKeys("{F11}");
                    }
                }
            };
            this.getColor = function (color, opacity) {
                opacity = parseFloat(opacity) || 1;
                var elem = $('.pg-colors').length ? $('.pg-colors') : $('<div class="pg-colors"></div>').appendTo('body');
                var colorElem = elem.find('[data-color="' + color + '"]').length ? elem.find('[data-color="' + color + '"]') : $('<div class="bg-' + color + '" data-color="' + color + '"></div>').appendTo(elem);
                var color = colorElem.css('background-color');
                var rgb = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                var rgba = "rgba(" + rgb[1] + ", " + rgb[2] + ", " + rgb[3] + ', ' + opacity + ')';
                return rgba;
            };
            // Initialize Layout
            this.initDropDown = function () {
                // adjust width of each dropdown to match content width
                $('.dropdown-default').each(function () {
                    var btn = $(this).find('.dropdown-menu').siblings('.dropdown-toggle');
                    var offset = 0;
                    var padding = btn.actual('innerWidth') - btn.actual('width');
                    var menuWidth = $(this).find('.dropdown-menu').actual('outerWidth');
                    if (btn.actual('outerWidth') < menuWidth) {
                        btn.width(menuWidth - offset);
                        $(this).find('.dropdown-menu').width(btn.actual('outerWidth'));
                    }
                    else {
                        $(this).find('.dropdown-menu').width(btn.actual('outerWidth'));
                    }
                });
            };
            this.initFormGroupDefault = function () {
                $('.form-group.form-group-default').click(function () {
                    $(this).find(':input').focus();
                });
                $('body').on('focus', '.form-group.form-group-default :input', function () {
                    $('.form-group.form-group-default').removeClass('focused');
                    $(this).parents('.form-group').addClass('focused');
                });
                $('body').on('blur', '.form-group.form-group-default :input', function () {
                    $(this).parents('.form-group').removeClass('focused');
                    if ($(this).val()) {
                        $(this).closest('.form-group').find('label').addClass('fade');
                    }
                    else {
                        $(this).closest('.form-group').find('label').removeClass('fade');
                    }
                });
                $('.form-group.form-group-default .checkbox, .form-group.form-group-default .radio').hover(function () {
                    $(this).parents('.form-group').addClass('focused');
                }, function () {
                    $(this).parents('.form-group').removeClass('focused');
                });
            };
            this.initSlidingTabs = function () {
                // TODO: move this to a separate file
                $('a[data-toggle="tab"]').on('show.bs.tab', function (e) {
                    //e = $(e.relatedTarget || e.target).parent().find('a[data-toggle=tab]');
                    e = $(e.target).parent().find('a[data-toggle=tab]');
                    var hrefPrev = e.attr('href');
                    var hrefCurrent = e.attr('href');
                    if (!$(hrefCurrent).is('.slide-left, .slide-right'))
                        return;
                    $(hrefCurrent).addClass('sliding');
                    setTimeout(function () {
                        $(hrefCurrent).removeClass('sliding');
                    }, 100);
                });
            };
            this.initNotificationCenter = function () {
                $('.notification-list .dropdown-menu').on('click', function (event) {
                    event.stopPropagation();
                });
                $('.toggle-more-details').on('click', function (event) {
                    var p = $(this).closest('.heading');
                    p.closest('.heading').children('.more-details').stop().slideToggle('fast', function () {
                        p.toggleClass('open');
                    });
                });
            };
            this.initProgressBars = function () {
                $(window).on('load', function () {
                    $('.progress-bar').each(function () {
                        $(this).css('width', $(this).attr("data-percentage"));
                    });
                    // Hack: FF doesn't play SVG animations set as background-image
                    $('.progress-bar-indeterminate, .progress-circle-indeterminate, .mapplic-pin').hide().show(0);
                });
            };
            this.initView = function () {
                $('[data-navigate="view"]').on('click', function (e) {
                    e.preventDefault();
                    var el = $(this).attr('data-view-port');
                    $(el).toggleClass($(this).attr('data-view-animation'));
                    return false;
                });
            };
            // Initialize Plugins
            this.initTooltipPlugin = function () {
                $.fn.tooltip && $('[data-toggle="tooltip"]').tooltip();
            };
            this.initSelect2Plugin = function () {
                $.fn.select2 && $('[data-init-plugin="select2"]').each(function () {
                    $(this).select2({
                        minimumResultsForSearch: ($(this).attr('data-disable-search') == 'true' ? -1 : 1)
                    }).on('select2-opening', function () {
                        $.fn.scrollbar && $('.select2-results').scrollbar({
                            ignoreMobile: false
                        });
                    });
                });
            };
            this.initScrollBarPlugin = function () {
                $.fn.scrollbar && $('.scrollable').scrollbar({
                    ignoreOverlay: false
                });
            };
            this.initListView = function () {
                $.fn.ioslist && $('[data-init-list-view="ioslist"]').ioslist();
                $.fn.scrollbar && $('.list-view-wrapper').scrollbar({
                    ignoreOverlay: false
                });
            };
            //initSwitcheryPlugin = function () {
            //    // Switchery - ios7 switch
            //    window.Switchery && $('[data-init-plugin="switchery"]').each(function () {
            //        new Switchery($(this).get(0), {
            //            color: $.ApplicationInstance.getColor('success')
            //        });
            //    });
            //}
            //initSelectFxPlugin = function () {
            //    window.SelectFx && $('select[data-init-plugin="cs-select"]').each(function () {
            //        var el = $(this).get(0);
            //        $(el).wrap('<div class="cs-wrapper"></div>');
            //        new SelectFx(el);
            //    });
            //}
            this.initUnveilPlugin = function () {
                // lazy load retina images
                $.fn.unveil && $("img").unveil();
            };
            this.initValidatorPlugin = function () {
                $.validator && $.validator.setDefaults({
                    ignore: "",
                    showErrors: function (errorMap, errorList) {
                        var $this = this;
                        $.each(this.successList, function (index, value) {
                            var parent = $(this).closest('.form-group-attached');
                            if (parent.length)
                                return $(value).popover("hide");
                        });
                        return $.each(errorList, function (index, value) {
                            var parent = $(value.element).closest('.form-group-attached');
                            if (!parent.length) {
                                return $this.defaultShowErrors();
                            }
                            var _popover;
                            _popover = $(value.element).popover({
                                trigger: "manual",
                                placement: "top",
                                html: true,
                                container: parent.closest('form'),
                                content: value.message
                            });
                            _popover.data("bs.popover").options.content = value.message;
                            var parent = $(value.element).closest('.form-group');
                            parent.addClass('has-error');
                            $(value.element).popover("show");
                        });
                    },
                    onfocusout: function (element) {
                        var parent = $(element).closest('.form-group');
                        if ($(element).valid()) {
                            parent.removeClass('has-error');
                            parent.next('.error').remove();
                        }
                    },
                    onkeyup: function (element) {
                        var parent = $(element).closest('.form-group');
                        if ($(element).valid()) {
                            $(element).removeClass('error');
                            parent.removeClass('has-error');
                            parent.next('label.error').remove();
                            parent.find('label.error').remove();
                        }
                        else {
                            parent.addClass('has-error');
                        }
                    },
                    errorPlacement: function (error, element) {
                        var parent = $(element).closest('.form-group');
                        if (parent.hasClass('form-group-default')) {
                            parent.addClass('has-error');
                            error.insertAfter(parent);
                        }
                        else {
                            error.insertAfter(element);
                        }
                    }
                });
            };
            // Call initializers
            this.init = function () {
                // init layout
                this.initDropDown();
                this.initFormGroupDefault();
                this.initSlidingTabs();
                this.initNotificationCenter();
                this.initProgressBars();
                // init plugins
                this.initTooltipPlugin();
                this.initSelect2Plugin();
                this.initScrollBarPlugin();
                //this.initSwitcheryPlugin();
                //this.initSelectFxPlugin();
                this.initUnveilPlugin();
                this.initValidatorPlugin();
                this.initView();
                this.initListView();
            };
            this.pageScrollElement = 'html, body';
            this.$body = $('body');
            this.setUserOS();
            this.setUserAgent();
        }
        return Application;
    })();
    $.ApplicationInstance = new Application();
    $.ApplicationInstance.init();
})(jQuery);
(function ($) {
    'use strict';
    // SIDEBAR CLASS DEFINITION
    // ======================
    var Sidebar = function (element, options) {
        this.$element = $(element);
        this.options = $.extend(true, {}, $.fn.sidebar.defaults, options);
        this.bezierEasing = [.05, .74, .27, .99];
        this.cssAnimation = true;
        this.menuClosedCSS;
        this.menuOpenCSS;
        this.css3d = true;
        this.sideBarWidth = 280;
        this.sideBarWidthCondensed = 280 - 70;
        this.$sidebarMenu = this.$element.find('.sidebar-menu > ul');
        this.$pageContainer = $(this.options.pageContainer);
        this.$body = $('body');
        if (!this.$sidebarMenu.length)
            return;
        // apply perfectScrollbar plugin only for desktops
        /*($.ApplicationInstance.getUserAgent() == 'desktop') && this.$sidebarMenu.scrollbar({
            ignoreOverlay: false
        });*/
        if (!Modernizr.csstransitions)
            this.cssAnimation = false;
        if (!Modernizr.csstransforms3d)
            this.css3d = false;
        this.menuOpenCSS = (this.css3d == true ? 'translate3d(' + this.sideBarWidthCondensed + 'px, 0,0)' : 'translate(' + this.sideBarWidthCondensed + 'px, 0)');
        this.menuClosedCSS = (this.css3d == true ? 'translate3d(0, 0,0)' : 'translate(0, 0)');
        // Bind events
        // Toggle sub menus
        this.$sidebarMenu.find('li > a').on('click', function (e) {
            if ($(this).parent().children('.sub-menu') === false) {
                return;
            }
            var parent = $(this).parent().parent();
            var tempElem = $(this).parent();
            parent.children('li.open').children('a').children('.arrow').removeClass('open');
            parent.children('li.open').children('a').children('.arrow').removeClass('active');
            parent.children('li.open').children('.sub-menu').slideUp(200, function () {
            });
            parent.children('li').removeClass('open');
            var sub = $(this).parent().children('.sub-menu');
            if (sub.is(":visible")) {
                $('.arrow', $(this)).removeClass("open");
                sub.slideUp(200, function () {
                    $(this).parent().removeClass("active");
                });
            }
            else {
                $('.arrow', $(this)).addClass("open");
                $(this).parent().addClass("open");
                sub.slideDown(200, function () { });
            }
            //e.preventDefault();
        });
        // Toggle sidebar
        $('.sidebar-slide-toggle').on('click touchend', function (e) {
            e.preventDefault();
            $(this).toggleClass('active');
            var el = $(this).attr('data-pages-toggle');
            if (el != null) {
                $(el).toggleClass('show');
            }
        });
        var _this = this;
        function sidebarMouseEnter(e) {
            if ($.ApplicationInstance.isVisibleSm() || $.ApplicationInstance.isVisibleXs()) {
                return false;
            }
            if ($('.close-sidebar').data('clicked')) {
                return;
            }
            if (_this.$body.hasClass('menu-pin'))
                return;
            if (_this.cssAnimation) {
                _this.$element.css({
                    'transform': _this.menuOpenCSS
                });
                _this.$body.addClass('sidebar-visible');
            }
            else {
                _this.$element.stop().animate({
                    left: '0px'
                }, 400, $.bez(_this.bezierEasing), function () {
                    _this.$body.addClass('sidebar-visible');
                });
            }
        }
        function sidebarMouseLeave(e) {
            if ($.ApplicationInstance.isVisibleSm() || $.ApplicationInstance.isVisibleXs()) {
                return false;
            }
            if (typeof e != 'undefined') {
                var target = $(e.target);
                if (target.parent('.page-sidebar').length) {
                    return;
                }
            }
            if (_this.$body.hasClass('menu-pin'))
                return;
            if ($('.sidebar-overlay-slide').hasClass('show')) {
                $('.sidebar-overlay-slide').removeClass('show');
                $("[data-pages-toggle']").removeClass('active');
            }
            if (_this.cssAnimation) {
                _this.$element.css({
                    'transform': _this.menuClosedCSS
                });
                _this.$body.removeClass('sidebar-visible');
            }
            else {
                _this.$element.stop().animate({
                    left: '-' + _this.sideBarWidthCondensed + 'px'
                }, 400, $.bez(_this.bezierEasing), function () {
                    _this.$body.removeClass('sidebar-visible');
                    setTimeout(function () {
                        $('.close-sidebar').data({
                            clicked: false
                        });
                    }, 100);
                });
            }
        }
        this.$element.bind('mouseenter mouseleave', sidebarMouseEnter);
        this.$pageContainer.bind('mouseover', sidebarMouseLeave);
    };
    // Toggle sidebar for mobile view   
    Sidebar.prototype.toggleSidebar = function (toggle) {
        var timer;
        if (this.$body.hasClass('sidebar-open')) {
            this.$body.removeClass('sidebar-open');
            timer = setTimeout(function () {
                this.$element.removeClass('visible');
            }.bind(this), 400);
        }
        else {
            clearTimeout(timer);
            this.$element.addClass('visible');
            setTimeout(function () {
                this.$body.addClass('sidebar-open');
            }.bind(this), 10);
        }
    };
    Sidebar.prototype.togglePinSidebar = function (toggle) {
        if (toggle == 'hide') {
            this.$body.removeClass('menu-pin');
        }
        else if (toggle == 'show') {
            this.$body.addClass('menu-pin');
        }
        else {
            this.$body.toggleClass('menu-pin');
        }
    };
    // SIDEBAR PLUGIN DEFINITION
    // =======================
    function Plugin(option) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('pg.sidebar');
            var options = typeof option == 'object' && option;
            if (!data)
                $this.data('pg.sidebar', (data = new Sidebar(this, options)));
            if (typeof option == 'string')
                data[option]();
        });
    }
    var old = $.fn.sidebar;
    $.fn.sidebar = Plugin;
    $.fn.sidebar.Constructor = Sidebar;
    $.fn.sidebar.defaults = {
        pageContainer: '.page-container'
    };
    // SIDEBAR PROGRESS NO CONFLICT
    // ====================
    $.fn.sidebar.noConflict = function () {
        $.fn.sidebar = old;
        return this;
    };
    // SIDEBAR PROGRESS DATA API
    //===================
    $(document).on('ready', function () {
        $('[data-pages="sidebar"]').each(function () {
            var $sidebar = $(this);
            $sidebar.sidebar($sidebar.data());
        });
    });
    /* $(document).on('click.pg.sidebar.data-api', '[data-toggle-pin="sidebar"]', function (e) {
        e.preventDefault();
        var $this = $(this);
        var $target = $('[data-pages="sidebar"]');
        $target.data('pg.sidebar').togglePinSidebar();
        return false;
    });
    $(document).on('click.pg.sidebar.data-api touchstart', '[data-toggle="sidebar"]', function (e) {
        e.preventDefault();
        var $this = $(this);
        var $target = $('[data-pages="sidebar"]');
        $target.data('pg.sidebar').toggleSidebar();
        return false;
    });*/
    window.sideBarInit = function () {
        $('[data-pages="sidebar"]').each(function () {
                var $sidebar = $(this);
                $sidebar.sidebar($sidebar.data());
        });
        $(document).on('click.pg.sidebar.data-api', '[data-toggle-pin="sidebar"]', function (e) {
            e.preventDefault();
            var $this = $(this);
            var $target = $('[data-pages="sidebar"]');
            $target.data('pg.sidebar').togglePinSidebar();
            return false;
        });
        $(document).on('click.pg.sidebar.data-api touchstart', '[data-toggle="sidebar"]', function (e) {
            e.preventDefault();
            var $this = $(this);
            var $target = $('[data-pages="sidebar"]');
            $target.data('pg.sidebar').toggleSidebar();
            return false;
        });
    };
})(jQuery);
(function ($) {

    'use strict';

    var Notification = function (container, options) {

        var self = this;

        // Element collection
        self.container = $(container); // 'body' recommended
        self.notification = $('<div class="pgn"></div>');
        self.options = $.extend(true, {}, $.fn.pgNotification.defaults, options);

        if (!self.container.find('.pgn-wrapper[data-position=' + this.options.position + ']').length) {
            self.wrapper = $('<div class="pgn-wrapper" data-position="' + this.options.position + '"></div>');
            self.container.append(self.wrapper);
        } else {
            self.wrapper = $('.pgn-wrapper[data-position=' + this.options.position + ']');
        }

        self.alert = $('<div class="alert"></div>');
        self.alert.addClass('alert-' + self.options.type);

        if (self.options.style == 'bar') {
            new BarNotification();
        } else if (self.options.style == 'flip') {
            new FlipNotification();
        } else if (self.options.style == 'circle') {
            new CircleNotification();
        } else if (self.options.style == 'simple') {
            new SimpleNotification();
        } else { // default = 'simple'
            new SimpleNotification();
        }

        // Notification styles
        function SimpleNotification() {

            self.notification.addClass('pgn-simple');

            self.alert.append(self.options.message);
            if (self.options.showClose) {
                var close = $('<button type="button" class="close" data-dismiss="alert"></button>')
                    .append('<span aria-hidden="true">&times;</span>')
                    .append('<span class="sr-only">Close</span>');

                self.alert.prepend(close);
            }

        }

        function BarNotification() {

            self.notification.addClass('pgn-bar');

            self.alert.append('<span>' + self.options.message + '</span>');
            self.alert.addClass('alert-' + self.options.type);


            if (self.options.showClose) {
                var close = $('<button type="button" class="close" data-dismiss="alert"></button>')
                    .append('<span aria-hidden="true">&times;</span>')
                    .append('<span class="sr-only">Close</span>');

                self.alert.prepend(close);
            }

        }

        function CircleNotification() {

            self.notification.addClass('pgn-circle');

            var table = '<div>';
            if (self.options.thumbnail) {
                table += '<div class="pgn-thumbnail"><div>' + self.options.thumbnail + '</div></div>';
            }

            table += '<div class="pgn-message"><div>';

            if (self.options.title) {
                table += '<p class="bold">' + self.options.title + '</p>';
            }
            table += '<p>' + self.options.message + '</p></div></div>';
            table += '</div>';

            if (self.options.showClose) {
                table += '<button type="button" class="close" data-dismiss="alert">';
                table += '<span aria-hidden="true">&times;</span><span class="sr-only">Close</span>';
                table += '</button>';
            }


            self.alert.append(table);
            self.alert.after('<div class="clearfix"></div>');

        }

        function FlipNotification() {

            self.notification.addClass('pgn-flip');
            //if (self.options.thumbnail) {
            //    self.alert.append('<div class="pgn-thumbnail"><div>' + self.options.thumbnail + '</div></div>');
            //}
            self.alert.append("<span>" + self.options.message + "</span>");
            if (self.options.showClose) {
                var close = $('<button type="button" class="close" data-dismiss="alert"></button>')
                    .append('<span aria-hidden="true">&times;</span>')
                    .append('<span class="sr-only">Close</span>');

                self.alert.prepend(close);
            }

        }

        self.notification.append(self.alert);

        // bind to Bootstrap closed event for alerts 
        self.alert.on('closed.bs.alert', function () {
            self.notification.remove();
            self.options.onClosed();
            // refresh layout after removal
        });

        return this; // enable chaining
    };

    Notification.VERSION = "1.0.0";

    Notification.prototype.show = function () {

        // TODO: add fadeOut animation on show as option
        this.wrapper.prepend(this.notification);

        this.options.onShown();

        if (this.options.timeout != 0) {
            var _this = this;
            // settimeout removes scope. use .bind(this)
            setTimeout(function () {
                this.notification.fadeOut("slow", function () {
                    $(this).remove();
                    _this.options.onClosed();
                });
            }.bind(this), this.options.timeout);
        }

    };

    $.fn.pgNotification = function (options) {
        return new Notification(this, options);
    };

    $.fn.pgNotification.defaults = {
        style: 'simple',
        message: null,
        position: 'top-right',
        type: 'info',
        showClose: true,
        timeout: 4000,
        onShown: function () { },
        onClosed: function () { }
    }
})(jQuery);

/**
 * selectFx.js v1.0.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2014, Codrops
 * http://www.codrops.com
 */
;
(function (window) {

    'use strict';

    /**
     * based on from https://github.com/inuyaksa/jquery.nicescroll/blob/master/jquery.nicescroll.js
     */
    function hasParent(e, p) {
        if (!e) return false;
        var el = e.target || e.srcElement || e || false;
        while (el && el != p) {
            el = el.parentNode || false;
        }
        return (el !== false);
    };

    /**
     * extend obj function
     */
    function extend(a, b) {
        for (var key in b) {
            if (b.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        }
        return a;
    }

    /**
     * SelectFx function
     */
    function SelectFx(el, options) {
        this.el = el;
        this.options = extend({}, this.options);
        extend(this.options, options);
        this._init();
    }

    /**
     * Pure-JS alternative to jQuery closest()
     */
    function closest(elem, selector) {
        var matchesSelector = elem.matches || elem.webkitMatchesSelector || elem.mozMatchesSelector || elem.msMatchesSelector;
        while (elem) {
            if (matchesSelector.bind(elem)(selector)) {
                return elem;
            } else {
                elem = elem.parentElement;
            }
        }
        return false;
    }

    /**
     * jQuery offset() in pure JS
     */
    function offset(el) {
        return {
            left: el.getBoundingClientRect().left + window.pageXOffset - el.ownerDocument.documentElement.clientLeft,
            top: el.getBoundingClientRect().top + window.pageYOffset - el.ownerDocument.documentElement.clientTop
        }

    }

    /**
     * jQuery after() in pure JS
     */
    function insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }
    /**
     * SelectFx options
     */
    SelectFx.prototype.options = {
        // if true all the links will open in a new tab.
        // if we want to be redirected when we click an option, we need to define a data-link attr on the option of the native select element
        newTab: true,
        // when opening the select element, the default placeholder (if any) is shown
        stickyPlaceholder: true,
        // default container is body
        container: 'body',
        // callback when changing the value
        onChange: function (el) {
            //console.log(el);
            //var event = document.createEvent('HTMLEvents');
            //event.initEvent('change', true, false);
            //el.dispatchEvent(event);
        }
    }

    /**
     * init function
     * initialize and cache some vars
     */
    SelectFx.prototype._init = function () {
        // check if we are using a placeholder for the native select box
        // we assume the placeholder is disabled and selected by default
        var selectedOpt = this.el.querySelector('option[selected]');
        this.hasDefaultPlaceholder = selectedOpt && selectedOpt.disabled;

        // get selected option (either the first option with attr selected or just the first option)
        this.selectedOpt = selectedOpt || this.el.querySelector('option');

        // create structure
        this._createSelectEl();

        // all options
        this.selOpts = [].slice.call(this.selEl.querySelectorAll('li[data-option]'));

        // total options
        this.selOptsCount = this.selOpts.length;

        // current index
        this.current = this.selOpts.indexOf(this.selEl.querySelector('li.cs-selected')) || -1;

        // placeholder elem
        this.selPlaceholder = this.selEl.querySelector('span.cs-placeholder');

        // init events
        this._initEvents();

        this.el.onchange = function () {
            var index = this.selectedIndex;
            var inputText = this.children[index].innerHTML.trim();
            console.log(inputText);
        }

    }

    /**
     * creates the structure for the select element
     */
    SelectFx.prototype._createSelectEl = function () {
        var self = this,
            options = '',
            createOptionHTML = function (el) {
                var optclass = '',
                    classes = '',
                    link = '';

                if (el.selectedOpt && !this.foundSelected && !this.hasDefaultPlaceholder) {
                    classes += 'cs-selected ';
                    this.foundSelected = true;
                }
                // extra classes
                if (el.getAttribute('data-class')) {
                    classes += el.getAttribute('data-class');
                }
                // link options
                if (el.getAttribute('data-link')) {
                    link = 'data-link=' + el.getAttribute('data-link');
                }

                if (classes !== '') {
                    optclass = 'class="' + classes + '" ';
                }

                return '<li ' + optclass + link + ' data-option data-value="' + el.value + '"><span>' + el.textContent + '</span></li>';
            };

        [].slice.call(this.el.children).forEach(function (el) {
            if (el.disabled) {
                return;
            }

            var tag = el.tagName.toLowerCase();

            if (tag === 'option') {
                options += createOptionHTML(el);
            } else if (tag === 'optgroup') {
                options += '<li class="cs-optgroup"><span>' + el.label + '</span><ul>';
                [].slice.call(el.children).forEach(function (opt) {
                    options += createOptionHTML(opt);
                })
                options += '</ul></li>';
            }
        });

        var opts_el = '<div class="cs-options"><ul>' + options + '</ul></div>';
        this.selEl = document.createElement('div');
        this.selEl.className = this.el.className;
        this.selEl.tabIndex = this.el.tabIndex;
        this.selEl.innerHTML = '<span class="cs-placeholder">' + this.selectedOpt.textContent + '</span>' + opts_el;
        this.el.parentNode.appendChild(this.selEl);
        this.selEl.appendChild(this.el);

        // backdrop to support dynamic heights of the dropdown
        var backdrop = document.createElement('div');
        backdrop.className = 'cs-backdrop';
        this.selEl.appendChild(backdrop);
    }

    /**
     * initialize the events
     */
    SelectFx.prototype._initEvents = function () {
        var self = this;

        // open/close select
        this.selPlaceholder.addEventListener('click', function () {
            self._toggleSelect();
        });

        // clicking the options
        this.selOpts.forEach(function (opt, idx) {
            opt.addEventListener('click', function () {
                self.current = idx;
                self._changeOption();
                // close select elem
                self._toggleSelect();
            });
        });

        // close the select element if the target it�s not the select element or one of its descendants..
        document.addEventListener('click', function (ev) {
            var target = ev.target;
            if (self._isOpen() && target !== self.selEl && !hasParent(target, self.selEl)) {
                self._toggleSelect();
            }
        });

        // keyboard navigation events
        this.selEl.addEventListener('keydown', function (ev) {
            var keyCode = ev.keyCode || ev.which;

            switch (keyCode) {
                // up key
                case 38:
                    ev.preventDefault();
                    self._navigateOpts('prev');
                    break;
                    // down key
                case 40:
                    ev.preventDefault();
                    self._navigateOpts('next');
                    break;
                    // space key
                case 32:
                    ev.preventDefault();
                    if (self._isOpen() && typeof self.preSelCurrent != 'undefined' && self.preSelCurrent !== -1) {
                        self._changeOption();
                    }
                    self._toggleSelect();
                    break;
                    // enter key
                case 13:
                    ev.preventDefault();
                    if (self._isOpen() && typeof self.preSelCurrent != 'undefined' && self.preSelCurrent !== -1) {
                        self._changeOption();
                        self._toggleSelect();
                    }
                    break;
                    // esc key
                case 27:
                    ev.preventDefault();
                    if (self._isOpen()) {
                        self._toggleSelect();
                    }
                    break;
            }
        });
    }

    /**
     * navigate with up/dpwn keys
     */
    SelectFx.prototype._navigateOpts = function (dir) {
        if (!this._isOpen()) {
            this._toggleSelect();
        }

        var tmpcurrent = typeof this.preSelCurrent != 'undefined' && this.preSelCurrent !== -1 ? this.preSelCurrent : this.current;

        if (dir === 'prev' && tmpcurrent > 0 || dir === 'next' && tmpcurrent < this.selOptsCount - 1) {
            // save pre selected current - if we click on option, or press enter, or press space this is going to be the index of the current option
            this.preSelCurrent = dir === 'next' ? tmpcurrent + 1 : tmpcurrent - 1;
            // remove focus class if any..
            this._removeFocus();
            // add class focus - track which option we are navigating
            classie.add(this.selOpts[this.preSelCurrent], 'cs-focus');
        }
    }

    /**
     * open/close select
     * when opened show the default placeholder if any
     */
    SelectFx.prototype._toggleSelect = function () {
        var backdrop = this.selEl.querySelector('.cs-backdrop');
        var container = document.querySelector(this.options.container);
        var mask = container.querySelector('.dropdown-mask');
        var csOptions = this.selEl.querySelector('.cs-options');
        var csPlaceholder = this.selEl.querySelector('.cs-placeholder');

        var csPlaceholderWidth = csPlaceholder.offsetWidth;
        var csPlaceholderHeight = csPlaceholder.offsetHeight;
        var csOptionsWidth = csOptions.scrollWidth;

        if (this._isOpen()) {
            if (this.current !== -1) {
                // update placeholder text
                this.selPlaceholder.textContent = this.selOpts[this.current].textContent;
            }

            var dummy = this.selEl.data;

            var parent = dummy.parentNode;
            //parent.appendChild(this.selEl);
            insertAfter(this.selEl, dummy);
            this.selEl.removeAttribute('style');

            parent.removeChild(dummy);

            // Hack for FF
            // http://stackoverflow.com/questions/12088819/css-transitions-on-new-elements
            var x = this.selEl.clientHeight;

            // reset backdrop
            backdrop.style.transform = backdrop.style.webkitTransform = backdrop.style.MozTransform = backdrop.style.msTransform = backdrop.style.OTransform = 'scale3d(1,1,1)';
            classie.remove(this.selEl, 'cs-active');

            mask.style.display = 'none';
            csOptions.style.overflowY = 'hidden';
            csOptions.style.width = 'auto';

            var parentFormGroup = closest(this.selEl, '.form-group');
            parentFormGroup && classie.removeClass(parentFormGroup, 'focused');

        } else {
            if (this.hasDefaultPlaceholder && this.options.stickyPlaceholder) {
                // everytime we open we wanna see the default placeholder text
                this.selPlaceholder.textContent = this.selectedOpt.textContent;
            }

            var dummy;
            if (this.selEl.parentNode.querySelector('.dropdown-placeholder')) {
                dummy = this.selEl.parentNode.querySelector('.dropdown-placeholder');
            } else {
                dummy = document.createElement('div');
                classie.add(dummy, 'dropdown-placeholder');
                //this.selEl.parentNode.appendChild(dummy);
                insertAfter(dummy, this.selEl);

            }


            dummy.style.height = csPlaceholderHeight + 'px';
            dummy.style.width = this.selEl.offsetWidth + 'px';

            this.selEl.data = dummy;



            this.selEl.style.position = 'absolute';
            var offsetselEl = offset(this.selEl);

            this.selEl.style.left = offsetselEl.left + 'px';
            this.selEl.style.top = offsetselEl.top + 'px';

            container.appendChild(this.selEl);

            // decide backdrop's scale factor depending on the content height
            var contentHeight = csOptions.offsetHeight;
            var originalHeight = csPlaceholder.offsetHeight;

            var contentWidth = csOptions.offsetWidth;
            var originalWidth = csPlaceholder.offsetWidth;

            var scaleV = contentHeight / originalHeight;
            var scaleH = (contentWidth > originalWidth) ? contentWidth / originalWidth : 1.05;
            //backdrop.style.transform = backdrop.style.webkitTransform = backdrop.style.MozTransform = backdrop.style.msTransform = backdrop.style.OTransform = 'scale3d(' + scaleH + ', ' + scaleV + ', 1)';
            backdrop.style.transform = backdrop.style.webkitTransform = backdrop.style.MozTransform = backdrop.style.msTransform = backdrop.style.OTransform = 'scale3d(' + 1 + ', ' + scaleV + ', 1)';

            if (!mask) {
                mask = document.createElement('div');
                classie.add(mask, 'dropdown-mask');
                container.appendChild(mask);
            }

            mask.style.display = 'block';

            classie.add(this.selEl, 'cs-active');

            var resizedWidth = (csPlaceholderWidth < csOptionsWidth) ? csOptionsWidth : csPlaceholderWidth;

            this.selEl.style.width = resizedWidth + 'px';
            this.selEl.style.height = originalHeight + 'px';
            csOptions.style.width = '100%';

            setTimeout(function () {
                csOptions.style.overflowY = 'auto';
            }, 300);

        }
    }

    /**
     * change option - the new value is set
     */
    SelectFx.prototype._changeOption = function () {
        // if pre selected current (if we navigate with the keyboard)...
        if (typeof this.preSelCurrent != 'undefined' && this.preSelCurrent !== -1) {
            this.current = this.preSelCurrent;
            this.preSelCurrent = -1;
        }

        // current option
        var opt = this.selOpts[this.current];

        // update current selected value
        this.selPlaceholder.textContent = opt.textContent;

        // change native select element�s value
        this.el.value = opt.getAttribute('data-value');

        // remove class cs-selected from old selected option and add it to current selected option
        var oldOpt = this.selEl.querySelector('li.cs-selected');
        if (oldOpt) {
            classie.remove(oldOpt, 'cs-selected');
        }
        classie.add(opt, 'cs-selected');

        // if there�s a link defined
        if (opt.getAttribute('data-link')) {
            // open in new tab?
            if (this.options.newTab) {
                window.open(opt.getAttribute('data-link'), '_blank');
            } else {
                window.location = opt.getAttribute('data-link');
            }
        }

        // callback
        this.options.onChange(this.el);
    }

    /**
     * returns true if select element is opened
     */
    SelectFx.prototype._isOpen = function (opt) {
        return classie.has(this.selEl, 'cs-active');
    }

    /**
     * removes the focus class from the option
     */
    SelectFx.prototype._removeFocus = function (opt) {
        var focusEl = this.selEl.querySelector('li.cs-focus')
        if (focusEl) {
            classie.remove(focusEl, 'cs-focus');
        }
    }

    /**
     * add to global namespace
     */
    window.SelectFx = SelectFx;

})(window);