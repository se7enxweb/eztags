/*
 * Copyright CJW Network and Exponential Foundation. All rights reserved.
 * License: GNU General Public License v2.0 or later (GPL-2.0-or-later)
 *
 * The tags field of the edit form and the tag selection dialogs, on plain JavaScript: the same as jquery.eztags.js,
 * jquery.eztags.select.js and jquery.eztags.tree.js (which the older designs and the site keep loading with jQuery,
 * jQuery UI, jqModal and jsTree), without any of them. The admin design admin4 loads this file instead.
 *
 * The field (div[data-eztags], content/datatype/edit/eztags.tpl) is built as before: the same markup, the same
 * templates (rendered without code generation from strings, see "Templates"), the same hidden inputs and the same
 * server calls, sent as jQuery sent them (ezjscore's $.ez(): a POST to ezjscore/call/ with the fields,
 * ezjscServer_function_arguments and the form token; the tree builder's GETs with ContentType=json). What differs:
 * - the tag picker (ezjsctemplate/modal_dialog.tpl) is a <dialog> (EzTags.Dialog) instead of a jqModal window: it is
 *   modal, keeps the focus inside (Tab and Shift+Tab go round), closes with Escape and its close button, and gives
 *   the focus back to the control that opened it. It cannot be dragged.
 * - the tree builder's tree (EzTags.TreeView) is a list of its own instead of jsTree: a WAI-ARIA tree whose items
 *   are the tag links (see TreeView); the tags are loaded with the same requests, on the same occasions.
 * - the selected tags are sorted with the mouse by this file (no jQuery UI sortable): the list has the class
 *   with_sortable as before, an item being moved the class is-sorting.
 * EzTags (window.EzTags) has the classes of $.EzTags: Tag, Collection, Base, Default, Select, Tree, plus Dialog and
 * TreeView; an instance's on(), off() and trigger() work on its element with DOM events (CustomEvent, the data in
 * event.detail and as the handler's second argument, as jQuery passed it).
 *
 * The address of the server calls: #eztags-settings ({"call_url": ".../ezjscore/call/"}, a data block of
 * eztags/edit_scripts.tpl), else Exponential UI's Exp.config.call, else /ezjscore/call/.
 */
( function()
{
    'use strict';

    if ( window.EzTags && window.EzTags.plain )
        return;

    // Helpers (what the jQuery version took from jQuery) ===========================================================

    var hasOwn = Object.prototype.hasOwnProperty;

    function isPlainObject( obj )
    {
        if ( !obj || Object.prototype.toString.call( obj ) !== '[object Object]' )
            return false;
        var proto = Object.getPrototypeOf( obj );
        return proto === null || proto === Object.prototype;
    }

    // jQuery.extend( [deep,] target, sources... ): undefined values are not copied, deep copies plain objects and
    // arrays
    function extend()
    {
        var args = Array.prototype.slice.call( arguments ), deep = false;
        if ( typeof args[0] === 'boolean' )
            deep = args.shift();
        var target = args.shift() || {};
        for ( var i = 0; i < args.length; i++ )
        {
            var src = args[i];
            if ( src === null || src === undefined )
                continue;
            for ( var key in src )
            {
                var copy = src[key];
                if ( key === '__proto__' || target === copy )
                    continue;
                if ( deep && copy && ( isPlainObject( copy ) || Array.isArray( copy ) ) )
                {
                    var current = target[key], clone;
                    if ( Array.isArray( copy ) )
                        clone = Array.isArray( current ) ? current : [];
                    else
                        clone = isPlainObject( current ) ? current : {};
                    target[key] = extend( true, clone, copy );
                }
                else if ( copy !== undefined )
                {
                    target[key] = copy;
                }
            }
        }
        return target;
    }

    // jQuery.map(): the results that are not null or undefined, arrays flattened
    function map( list, fn )
    {
        var out = [];
        for ( var i = 0; i < list.length; i++ )
        {
            var value = fn( list[i], i );
            if ( value === null || value === undefined )
                continue;
            if ( Array.isArray( value ) )
                out.push.apply( out, value );
            else
                out.push( value );
        }
        return out;
    }

    // jQuery.each() over an array: fn( index, item ) with this = item; false stops
    function each( list, fn )
    {
        for ( var i = 0; i < list.length; i++ )
        {
            if ( fn.call( list[i], i, list[i] ) === false )
                break;
        }
        return list;
    }

    // The values of an element's data-* attributes, as jQuery's .data() read them
    function readData( el )
    {
        var data = {};
        if ( !el || !el.attributes )
            return data;
        for ( var i = 0; i < el.attributes.length; i++ )
        {
            var name = el.attributes[i].name;
            if ( name.indexOf( 'data-' ) !== 0 )
                continue;
            var key = name.slice( 5 ).replace( /-([a-z])/g, function( all, letter ) { return letter.toUpperCase(); } );
            data[key] = dataValue( el.attributes[i].value );
        }
        return data;
    }

    function dataValue( value )
    {
        if ( value === 'true' )
            return true;
        if ( value === 'false' )
            return false;
        if ( value === 'null' )
            return null;
        if ( value === +value + '' )
            return +value;
        if ( /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/.test( value ) )
        {
            try { return JSON.parse( value ); } catch ( e ) { return value; }
        }
        return value;
    }

    // HTML parsed as jQuery( html ) parsed it: the nodes of a div's innerHTML
    function parseHTML( html )
    {
        var div = document.createElement( 'div' );
        div.innerHTML = html;
        return Array.prototype.slice.call( div.childNodes );
    }

    // jQuery's addClass() and removeClass(): the class attribute is written only when it changes
    function classes( el )
    {
        return ( ' ' + ( el.getAttribute( 'class' ) || '' ).replace( /[\t\r\n\f ]+/g, ' ' ) + ' ' );
    }

    function setClass( el, value )
    {
        var raw = el.getAttribute( 'class' ) || '', final = value.trim().replace( /[\t\r\n\f ]+/g, ' ' );
        if ( raw !== final )
            el.setAttribute( 'class', final );
    }

    function addClass( el, name )
    {
        if ( !el )
            return;
        var cur = classes( el );
        if ( cur.indexOf( ' ' + name + ' ' ) < 0 )
            cur += name + ' ';
        setClass( el, cur );
    }

    function removeClass( el, name )
    {
        if ( !el )
            return;
        var cur = classes( el );
        while ( cur.indexOf( ' ' + name + ' ' ) > -1 )
            cur = cur.replace( ' ' + name + ' ', ' ' );
        setClass( el, cur );
    }

    // jQuery's hide() and show(): the inline display is kept while hidden; shown, an element its style sheet hides
    // gets the display of its kind (block for a div)
    var hiddenDisplay = typeof WeakMap === 'function' ? new WeakMap() : null;

    function hide( el )
    {
        if ( !el )
            return;
        var display = el.style.display;
        if ( display !== 'none' )
        {
            if ( hiddenDisplay )
                hiddenDisplay.set( el, display );
            el.style.display = 'none';
        }
    }

    function show( el )
    {
        if ( !el )
            return;
        if ( el.style.display === 'none' )
            el.style.display = ( hiddenDisplay && hiddenDisplay.get( el ) ) || '';
        if ( el.style.display === '' && document.documentElement.contains( el ) && window.getComputedStyle( el ).display === 'none' )
            el.style.display = defaultDisplay( el.nodeName );
    }

    var defaultDisplays = {};
    function defaultDisplay( nodeName )
    {
        if ( defaultDisplays[nodeName] )
            return defaultDisplays[nodeName];
        var temp = document.body.appendChild( document.createElement( nodeName ) ), display = window.getComputedStyle( temp ).display;
        temp.parentNode.removeChild( temp );
        if ( !display || display === 'none' )
            display = 'block';
        defaultDisplays[nodeName] = display;
        return display;
    }

    // The content height of an element, as jQuery's height() measured it
    function contentHeight( el )
    {
        var style = window.getComputedStyle( el ), height = parseFloat( style.height );
        if ( /px$/.test( style.height ) && !isNaN( height ) && style.boxSizing !== 'border-box' )
            return height;
        if ( !el.getClientRects().length )
            return 0;
        var px = function( name ) { return parseFloat( style[name] ) || 0; };
        return el.offsetHeight - px( 'paddingTop' ) - px( 'paddingBottom' ) - px( 'borderTopWidth' ) - px( 'borderBottomWidth' );
    }

    function closest( el, selector, stop )
    {
        for ( ; el && el.nodeType === 1 && el !== stop; el = el.parentNode )
        {
            if ( el.matches( selector ) )
                return el;
        }
        return null;
    }

    // Server calls ================================================================================================

    var settingsBlock;
    function callUrl()
    {
        if ( settingsBlock === undefined )
        {
            var block = document.getElementById( 'eztags-settings' );
            try { settingsBlock = block ? JSON.parse( block.textContent ) : null; } catch ( e ) { settingsBlock = null; }
        }
        if ( settingsBlock && settingsBlock.call_url )
            return settingsBlock.call_url;
        if ( window.Exp && window.Exp.config && window.Exp.config.call )
            return window.Exp.config.call;
        return '/ezjscore/call/';
    }

    // jQuery.param() (not traditional)
    function param( data )
    {
        var s = [];
        var add = function( key, value )
        {
            value = typeof value === 'function' ? value() : value;
            s.push( encodeURIComponent( key ) + '=' + encodeURIComponent( value === null || value === undefined ? '' : value ) );
        };
        var build = function( prefix, obj )
        {
            if ( Array.isArray( obj ) )
            {
                each( obj, function( i, v )
                {
                    if ( /\[\]$/.test( prefix ) )
                        add( prefix, v );
                    else
                        build( prefix + '[' + ( typeof v === 'object' && v !== null ? i : '' ) + ']', v );
                } );
            }
            else if ( obj !== null && typeof obj === 'object' )
            {
                for ( var name in obj )
                    build( prefix + '[' + name + ']', obj[name] );
            }
            else
            {
                add( prefix, obj );
            }
        };
        for ( var prefix in data )
            build( prefix, data[prefix] );
        return s.join( '&' );
    }

    // A request for JSON as jQuery.ajax() sent it: success( data ) for an answer in 200-299 or 304 that is JSON;
    // a failure is dropped, as the jQuery version had no error callback
    function requestJSON( method, url, body, success )
    {
        var xhr = new XMLHttpRequest();
        xhr.open( method, url, true );
        if ( body !== null )
            xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8' );
        xhr.setRequestHeader( 'Accept', 'application/json, text/javascript, */*; q=0.01' );
        xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
        xhr.onload = function()
        {
            if ( ( xhr.status < 200 || xhr.status >= 300 ) && xhr.status !== 304 )
                return;
            var data;
            try { data = JSON.parse( xhr.responseText ); } catch ( e ) { return; }
            success( data );
        };
        xhr.send( body );
        return xhr;
    }

    // ezjscore's $.ez( callArgs, post, callBack ) with post an object: a POST of the fields, the call and the token
    function ez( callArgs, post, callBack )
    {
        var token = '', tokenNode = document.getElementById( 'ezxform_token_js' );
        if ( tokenNode )
            token = tokenNode.getAttribute( 'title' );
        post['ezjscServer_function_arguments'] = callArgs;
        post['ezxform_token'] = token;
        // jQuery.ajax() deep-copied the data first, which leaves out the fields whose value is undefined
        return requestJSON( 'POST', callUrl(), param( extend( true, {}, post ) ).replace( /%20/g, '+' ), callBack );
    }

    // jQuery.getJSON( url, callBack )
    function getJSON( url, callBack )
    {
        return requestJSON( 'GET', url, null, callBack );
    }

    // Borrowed from backbonejs with few tweeks =====================================================================
    var klass_extend = function( protoProps, staticProps )
    {
        var parent = this;
        var child;

        if ( protoProps && ( protoProps.hasOwnProperty( 'constructor' ) ) )
            child = protoProps.constructor;
        else
            child = function() { return parent.apply( this, arguments ); };

        extend( child, parent, staticProps );

        var Surrogate = function() { this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate();

        if ( protoProps )
            extend( child.prototype, protoProps );

        child.__super__ = parent.prototype;

        return child;
    };

    // Namespace ===================================================================================================
    var KEY_NAMES = { Escape: 27, Esc: 27, Tab: 9, Enter: 13, ArrowLeft: 37, Left: 37, ArrowUp: 38, Up: 38,
                      ArrowRight: 39, Right: 39, ArrowDown: 40, Down: 40, ' ': 32, Spacebar: 32 };

    var EzTags = {
        plain: true,

        debouncer: function( fn, delay, context )
        {
            var to;
            return function()
            {
                to && clearTimeout( to );
                to = setTimeout( Function.prototype.bind.apply( fn, [context].concat( Array.prototype.slice.apply( arguments ) ) ), delay );
            };
        },

        key: {
            ESC: 27,
            TAB: 9,
            RETURN: 13,
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            SPACE: 32
        },

        // the key of e (its which or keyCode, else its key) is one of keys
        is_key: function( e, keys )
        {
            var self = this, code = e.which || e.keyCode || KEY_NAMES[e.key] || 0;
            !Array.isArray( keys ) && ( keys = [keys] );
            keys = map( keys, function( name ) { return self.key[name]; } );
            return keys.indexOf( code ) > -1;
        }
    };

    // Tag =========================================================================================================
    var Tag = function( attributes )
    {
        if ( attributes instanceof Tag )
            return attributes;
        extend( this, {
            id: 0,
            parent_name: null,
            cid: this.constructor.uid(),
            flagSrc: attributes.locale ? this.constructor.iconPath + attributes.locale + '.gif' : null
        }, attributes );
    };

    Tag.id = 0;
    Tag.uid = function() { return 'c' + ( ++this.id ); };
    Tag.prototype.remove = function() { return this.tags_suggest.remove( this.cid ); };
    Tag.prototype.parent = function()
    {
        return this.collection.find_by( 'id', this.parent_id );
    };

    Tag.prototype.parents = function()
    {
        if ( this._parents )
            return this._parents;
        var tag = this;
        this._parents = [];

        while ( tag )
        {
            tag = tag.parent();
            tag && this._parents.unshift( tag );
        }
        return this._parents;
    };

    Tag.prototype.children = function()
    {
        return this.collection.filter( function( item ) { return this.id === item.parent_id; }.bind( this ) );
    };

    Tag.prototype.self_and_parents = function()
    {
        return this.parents().concat( [this] );
    };

    // Simple collection class =====================================================================================
    var Collection = function()
    {
        this.items = [];
        this.indexed = {};
    };

    Collection.prototype.find_by_with_index = function( attr, value )
    {
        var tag = null;
        for ( var i = this.items.length - 1; i >= 0; i-- )
        {
            if ( this.items[i][attr] === value )
            {
                tag = this.items[i];
                break;
            }
        }
        return tag ? { item: tag, index: i } : null;
    };

    Collection.prototype.filter = function( iterator )
    {
        var out = [];
        for ( var i = 0; i < this.items.length; i++ )
        {
            if ( iterator( this.items[i], i ) )
                out.push( this.items[i] );
        }
        return out;
    };

    Collection.prototype.each = function( iterator )
    {
        return each( this.items, iterator );
    };

    Collection.prototype.find_by = function()
    {
        var result = this.find_by_with_index.apply( this, arguments );
        return result ? result.item : null;
    };

    Collection.prototype.add = function( item )
    {
        if ( !item )
            throw new Error( 'Item is not provided' );
        if ( item.id && this.indexed[item.id] )
            return null; // if exists
        item.collection = this;
        this.items.push( item );
        this.index_add( item );
        return item;
    };

    Collection.prototype.remove = function( item )
    {
        this.items.splice( this.find_by_with_index( 'cid', item.cid ).index, 1 );
        this.index_remove( item );
        item.collection = null;
        return item;
    };

    Collection.prototype.index_add = function( item )
    {
        this.indexed[item.cid] = item;
        this.indexed[item.id] = item;
    };

    Collection.prototype.index_remove = function( item )
    {
        delete this.indexed[item.cid];
        delete this.indexed[item.id];
    };

    Collection.prototype.find = function( id_or_cid )
    {
        return this.indexed[id_or_cid] || null;
    };

    Collection.prototype.length = function()
    {
        return this.items.length;
    };

    Collection.prototype.push = function( item ) { return this.add( item ); };

    Collection.prototype.sort_by = function( ids, atomic )
    {
        var self = this, items = map( ids, function( id ) { return self.find( id ); } );
        atomic && ( this.items = items );
        return items;
    };

    Collection.prototype.clear = function()
    {
        this.indexed = {};
        this.items = [];
    };

    // Templates ===================================================================================================
    // The templates are rendered without eval() or new Function(), so the tags field works under a Content Security
    // Policy without 'unsafe-eval'. A template is HTML with <%= expression %> tags, where the expression is
    // - a dotted path into the data: <%= tag.name %>, <%= tr.addNew %> (null and undefined print nothing), or
    // - a comparison choosing one of two strings: <%= tag.main_tag_id !== "0" ? " itemSynonym" : "" %>
    //   (===, !==, == or != against a quoted string, a number, null, true or false).
    // Anything else (other expressions, <% code %> blocks) prints nothing and is reported on the console.
    var TPL_PATH = '([A-Za-z_$][\\w$]*(?:\\.[A-Za-z_$][\\w$]*)*)';
    var TPL_STRING = '(?:"([^"]*)"|\'([^\']*)\')';
    var TPL_PATH_RE = new RegExp( '^' + TPL_PATH + '$' );
    var TPL_CHOICE_RE = new RegExp( '^' + TPL_PATH + '\\s*(===|!==|==|!=)\\s*("[^"]*"|\'[^\']*\'|-?\\d+(?:\\.\\d+)?|null|true|false)' +
                                    '\\s*\\?\\s*' + TPL_STRING + '\\s*:\\s*' + TPL_STRING + '$' );

    var tplLookup = function( data, path )
    {
        var value = data, keys = path.split( '.' );
        for ( var i = 0; i < keys.length; i++ )
        {
            if ( value === null || value === undefined )
                return undefined;
            value = value[keys[i]];
        }
        return value;
    };

    var tplLiteral = function( match )
    {
        if ( match.charAt( 0 ) === '"' || match.charAt( 0 ) === '\'' )
            return match.slice( 1, -1 );
        if ( match === 'null' )
            return null;
        if ( match === 'true' || match === 'false' )
            return match === 'true';
        return parseFloat( match );
    };

    var tplWarn = function( message )
    {
        if ( window.console && window.console.warn )
            window.console.warn( 'eZ Tags: ' + message );
    };

    var tplCompileExpression = function( expression )
    {
        var m = TPL_PATH_RE.exec( expression );
        if ( m )
        {
            var key = m[1];
            return function( data ) { return tplLookup( data, key ); };
        }
        m = TPL_CHOICE_RE.exec( expression );
        if ( m )
        {
            var path = m[1], operator = m[2], literal = tplLiteral( m[3] ),
                whenTrue = m[4] !== undefined ? m[4] : m[5],
                whenFalse = m[6] !== undefined ? m[6] : m[7];
            return function( data )
            {
                var value = tplLookup( data, path ),
                    same = operator.length === 3 ? value === literal : value == literal; /*jshint ignore:line*/
                return ( operator.charAt( 0 ) === '!' ? !same : same ) ? whenTrue : whenFalse;
            };
        }
        tplWarn( 'unsupported template expression: ' + expression );
        return function() { return undefined; };
    };

    var tplCompile = function( str )
    {
        var parts = [], re = /<%(=?)([\s\S]*?)%>/g, last = 0, m;
        str = str.replace( /[\r\t\n]/g, ' ' );
        while ( ( m = re.exec( str ) ) !== null )
        {
            parts.push( str.slice( last, m.index ) );
            if ( m[1] === '=' )
                parts.push( tplCompileExpression( m[2].trim() ) );
            else
                tplWarn( 'template code blocks are not supported: <%' + m[2] + '%>' );
            last = re.lastIndex;
        }
        parts.push( str.slice( last ) );
        return function( data )
        {
            var out = '', value;
            for ( var i = 0; i < parts.length; i++ )
            {
                if ( typeof parts[i] === 'string' )
                {
                    out += parts[i];
                    continue;
                }
                value = parts[i]( data || {} );
                out += value === null || value === undefined ? '' : String( value );
            }
            return out;
        };
    };

    // Dialog ======================================================================================================
    /*
      A modal dialog on a <dialog> element (the tag picker of ezjsctemplate/modal_dialog.tpl): open( opener ) shows it
      with showModal() (the page behind it is inert), moves the focus to its first control, keeps Tab and Shift+Tab
      inside, closes with Escape and with any element of class jqmClose in it, and close() gives the focus back to
      the control that had it before (opener). onShow and onHide run after each change. On an element that is not a
      <dialog> (or a browser without showModal) it is shown and hidden with the hidden attribute, the rest the same.
    */
    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
                    'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    var Dialog = function( el, opts )
    {
        this.el = el;
        this.opts = opts || {};
        this.isOpen = false;
        if ( !el || el.eztagsDialog )
            return;
        el.eztagsDialog = this;
        var self = this;
        el.addEventListener( 'cancel', function( e )
        {
            // Escape: closed here, so the focus goes back where it came from
            e.preventDefault();
            self.close();
        } );
        el.addEventListener( 'keydown', function( e )
        {
            if ( e.defaultPrevented )
                return;
            if ( e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27 )
            {
                e.preventDefault();
                e.stopPropagation();
                self.close();
            }
            else if ( e.key === 'Tab' || e.keyCode === 9 )
            {
                self.trap( e );
            }
        } );
        el.addEventListener( 'click', function( e )
        {
            var closer = closest( e.target, '.jqmClose', el.parentNode );
            if ( closer && el.contains( closer ) )
            {
                e.preventDefault();
                self.close();
            }
        } );
    };

    Dialog.of = function( el, opts )
    {
        if ( !el )
            return null;
        var dialog = el.eztagsDialog || new Dialog( el, opts );
        if ( opts )
            dialog.opts = extend( dialog.opts, opts );
        return dialog;
    };

    Dialog.prototype.focusables = function()
    {
        var list = this.el.querySelectorAll( FOCUSABLE ), out = [];
        for ( var i = 0; i < list.length; i++ )
        {
            if ( list[i].getClientRects().length || !list[i].closest( '[hidden]' ) )
                out.push( list[i] );
        }
        return out;
    };

    Dialog.prototype.trap = function( e )
    {
        var items = this.focusables();
        if ( !items.length )
        {
            e.preventDefault();
            return;
        }
        var first = items[0], last = items[items.length - 1], active = document.activeElement;
        if ( e.shiftKey && ( active === first || !this.el.contains( active ) ) )
        {
            e.preventDefault();
            last.focus();
        }
        else if ( !e.shiftKey && ( active === last || !this.el.contains( active ) ) )
        {
            e.preventDefault();
            first.focus();
        }
    };

    Dialog.prototype.open = function( opener )
    {
        if ( !this.el || this.isOpen )
            return;
        this.opener = opener || document.activeElement;
        this.isOpen = true;
        if ( typeof this.el.showModal === 'function' )
        {
            if ( !this.el.open )
                this.el.showModal();
        }
        else
        {
            this.el.removeAttribute( 'hidden' );
            this.el.setAttribute( 'open', '' );
        }
        // the first control of its content, else the first one (the close button)
        var items = this.focusables(), body = this.el.querySelector( '.eztags-dialog-body' ), target = null;
        for ( var i = 0; i < items.length && !target; i++ )
        {
            if ( body && body.contains( items[i] ) )
                target = items[i];
        }
        target = target || items[0];
        if ( target )
            target.focus();
        else
        {
            this.el.setAttribute( 'tabindex', '-1' );
            this.el.focus();
        }
        this.opts.onShow && this.opts.onShow.call( this );
    };

    Dialog.prototype.close = function()
    {
        if ( !this.el || !this.isOpen )
            return;
        this.isOpen = false;
        if ( typeof this.el.close === 'function' && this.el.open )
            this.el.close();
        else
            this.el.removeAttribute( 'open' );
        var opener = this.opener;
        this.opener = null;
        if ( opener && typeof opener.focus === 'function' && document.documentElement.contains( opener ) )
            opener.focus();
        this.opts.onHide && this.opts.onHide.call( this );
    };

    // TagSuggest ==================================================================================================
    var Base = function( el, opts )
    {
        opts || ( opts = {} );
        this.el = el;
        this.listeners = [];
        this.opts = extend( true, {}, this.constructor.defaults, opts, readData( el ) );
        this.tplCache = {};
        this.opts.templates = extend( {}, this.constructor.defaults.templates, this.templates, opts.templates );
        this.group_id = this.el.getAttribute( 'id' ).replace( this.opts.main_id_prefix, '' );
        this.TagKlass = this.opts.TagKlass || Tag;
        this.TagKlass.iconPath = this.opts.iconPath || '';

        this.CollectionKlass = this.opts.CollectionKlass || Collection;

        this.tags = new this.CollectionKlass();
        this.autocomplete_tags = new this.CollectionKlass();

        this.setup_ui();
        this.unserialize();
        this.setup_tree_picker();
        this.render_tags();

        this.initialize && this.initialize();
        this.setup_events();
    };

    Base.defaults = {
        main_id_prefix: 'eztags',

        minCharacters: 1,
        maxResults: 24,
        maxHeight: 150,
        suggestTimeout: 500,
        subtreeLimit: 0,
        hideRootTag: 0,
        maxTags: 0,
        isFilter: false,
        hasAddAccess: false,
        ezjscAutocomplete: 'ezjsctags::autocomplete',
        ezjscSuggest: 'ezjsctags::suggest',
        locale: null,
        iconPath: null,
        sortable: true,

        translations: {
            selectedTags: 'SELECTEDTAGS',
            loading: 'LOADING',
            noSelectedTags: 'NOSELECTEDTAGS',
            suggestedTags: 'SUGGESTEDTAGS',
            noSuggestedTags: 'NOSUGGESTEDTAGS',
            addNew: 'ADDNEW',
            clickAddThisTag: 'CLICKADDTHISTAG',
            removeTag: 'REMOVETAG',
            translateTag: 'TRANSLATETAG',
            existingTranslations: 'EXISTINGTRANSLATIONS',
            noExistingTranslations: 'NOEXISTINGTRANSLATIONS',
            addTranslation: 'ADDTRANSLATION',
            cancel: 'CANCEL',
            ok: 'OK',
            findTag: 'FINDTAG',
            chooseTag: 'CHOOSETAG'
        },

        templates: {
            skeleton: [
                '<div class="tagssuggest-ui">',
                    '<div class="tags-output">',
                        '<label><%=tr.selectedTags%>:</label>',
                        '<div class="tags-list tags-listed no-results">',
                            '<p class="loading"><%=tr.loading%></p>',
                            '<p class="no-results"><%=tr.noSelectedTags%>.</p>',
                            '<ul class="float-break clearfix js-tags-selected"></ul>',
                        '</div>',
                    '</div>',
                    '<div class="tags-input">',
                        '<label><%=tr.suggestedTags%>:</label>',
                        '<div class="tags-list tags-suggested no-results">',
                            '<p class="loading"><%=tr.loading%></p>',
                            '<p class="no-results"><%=tr.noSuggestedTags%>.</p>',
                            '<ul class="float-break clearfix js-tags-suggested">',
                        '</div>',
                        '<div class="tagssuggestfieldwrap">',
                            '<input class="tagssuggestfield tags-input-field" type="text" size="70" value="" autocomplete="off" aria-label="<%=tr.findTag%>" />',
                            '<div class="tagssuggestresults jsonSuggestResults"><div class="results-wrap" /></div>',
                        '</div>',
                        '<input type="button" value="<%=tr.addNew%>" class="button-add-tag button-disabled" disabled="disabled" />',
                    '</div>',
                '</div>'
            ],
            suggestedItem: ['<li class="js-suggested-item" data-cid="<%= tag.cid %>" title="<%=tr.clickAddThisTag%>"><img src="<%=tag.flagSrc %>" alt="" /><%=tag.name%></li>'],
            selectedItem: ['<li data-cid="<%= tag.cid %>"><img src="<%=tag.flagSrc %>" alt="" /><%=tag.name%><a href="#" class="js-tags-remove" title="<%=tr.removeTag%>">&times;</a></li>'],
            autocompleteItem: ['<div data-cid="<%= tag.cid %>" class="js-autocomplete-item resultItem<%= tag.main_tag_id !== "0" ? " itemSynonym" : "" %>"><a href="#"><img src="<%=tag.flagSrc %>" alt="" /><%=tag.name%><span><%= tag.parent_name %></span></a></div>']
        }
    };

    Base.prototype.tpl = function( str, data )
    {
        var fn = this.tplCache[str] || ( this.tplCache[str] = tplCompile( str ) );
        return data ? fn( data ) : fn;
    };

    /**
     * Renders template
     * @param  {string} name  Name of template to render.
     * @param  {object} data  Optional data to pass into view.
     * @return {string} String containing markup to render.
     */
    Base.prototype.render_template = function( name, data )
    {
        var inPage = this.el.querySelector( '.' + name );
        var t = this.opts.templates[name] = ( inPage && inPage.innerHTML ) || this.opts.templates[name],
            result = t && this.tpl( t.join ? t.join( '' ) : t, extend( {}, data, { tr: this.opts.translations } ) );
        this.trigger( 'render', { name: name, data: data } );
        return result;
    };

    Base.prototype.render_skeleton = function()
    {
        var nodes = parseHTML( this.render_template( 'skeleton' ) ), self = this;
        var find = function( selector, fn )
        {
            each( nodes, function( i, node )
            {
                if ( node.nodeType === 1 )
                    Array.prototype.forEach.call( node.querySelectorAll( selector ), fn );
            } );
        };
        !this.opts.hasAddAccess && find( '.button-add-tag', function( el ) { el.parentNode.removeChild( el ); } );
        find( '.tags-listed', function( el ) { removeClass( el, 'no-results' ); } );
        each( nodes, function( i, node ) { self.el.appendChild( node ); } );
    };

    /**
     * Initializes ui elements
     */
    Base.prototype.setup_ui = function()
    {
        this.render_skeleton();

        this.input = this.$( '.tags-input-field' );
        this.add_button = this.$( '.button-add-tag' );

        this.hidden_inputs = {};
        this.hidden_inputs.tagids     = this.$( '.tagids' );
        this.hidden_inputs.tagnames   = this.$( '.tagnames' );
        this.hidden_inputs.tagpids    = this.$( '.tagpids' );
        this.hidden_inputs.taglocales = this.$( '.taglocales' );

        this.tree_picker_element = document.getElementById( 'parent-selector-tree-' + this.group_id );
        this.selected_tags = this.$( '.js-tags-selected' );
        this.autocomplete_tags_element = this.$( '.results-wrap' );

        this.suggested_tags_element = this.$( '.js-tags-suggested' );
    };

    // Suggest =====================================================================================================
    /**
     * Fetch suggestion tags based on current tag(s) user has set (an ajax call, as before also without tags).
     */
    Base.prototype.fetch_suggestions = function()
    {
        if ( !this.tags.length )
            return;

        ez( this.opts.ezjscSuggest, {
            tag_ids: this.serialize().tagids,
            subtree_limit: this.opts.subtreeLimit,
            hide_root_tag: this.hideRootTag,
            locale: this.opts.locale
        }, this.after_fetch_suggestions.bind( this ) );
    };

    /**
     * Fetch autocomplete. Makes new ajax call only if search string changes.
     * Makes call to after_fech_autocomplete on successful ajax call.
     * @param  {object} e Event object.
     */
    Base.prototype.fetch_autocomplete = function( e )
    {
        if ( EzTags.is_key( e, ['UP', 'DOWN', 'LEFT', 'RIGHT', 'ESC', 'RETURN'] ) )
            return;
        var search_string = this.get_tag_name_from_input();

        if ( search_string.length < this.opts.minCharacters )
            return;
        if ( search_string === this.last_search_string )
        {
            this.render_autocomplete_tags();
            this.show_autocomplete();
            return;
        }
        this.last_search_string = search_string;

        ez( this.opts.ezjscAutocomplete, {
            search_string: search_string,
            subtree_limit: this.opts.subtreeLimit,
            hide_root_tag: this.opts.hideRootTag,
            locale: this.opts.locale
        }, this.after_fetch_autocomplete.bind( this ) );
    };

    /**
     * Fills autocomplete_tags with the fetched tags, then renders and shows them.
     * @param  {object} data Object containing fetch tags.
     */
    Base.prototype.after_fetch_autocomplete = function( data )
    {
        var tags = data.content.tags, self = this;
        tags = tags.slice( 0, this.opts.maxResults );
        this.autocomplete_tags_element.innerHTML = '';
        hide( this.autocomplete_tags_element.parentNode );

        this.autocomplete_tags.clear();
        each( tags, function( i, raw )
        {
            self.autocomplete_tags.add( self.parse_remote_tag( raw ) );
        } );

        this.render_autocomplete_tags();
        this.show_autocomplete();
    };

    /**
     * Renders autocomplete tags.
     */
    Base.prototype.render_autocomplete_tags = function()
    {
        var self = this;
        var items = map( this.available_autocomplete_tags(), function( tag )
        {
            return self.render_template( 'autocompleteItem', { tag: tag } );
        } );
        this.autocomplete_tags_element.innerHTML = items.join( '' );
    };

    /**
     * Shows autocomplete if there are any available autocomplete_tags and the tree picker is NOT open.
     */
    Base.prototype.show_autocomplete = function()
    {
        var available_autocomplete_tags = this.available_autocomplete_tags();
        if ( !available_autocomplete_tags.length || this.tree_picker_open )
            return;
        var results = this.autocomplete_tags_element;
        results.style.height = 'auto';
        show( results.parentNode );
        if ( contentHeight( results ) > this.opts.maxHeight )
            results.style.height = this.opts.maxHeight + 'px';
        if ( !this.hideAutocompleteListener )
        {
            this.hideAutocompleteListener = function( e )
            {
                !closest( e.target, '.tagssuggestfieldwrap' ) && this.close_autocomplete();
            }.bind( this );
            document.addEventListener( 'click', this.hideAutocompleteListener );
        }
    };

    /**
     * Returns the autocomplete tags that are not selected already.
     */
    Base.prototype.available_autocomplete_tags = function()
    {
        var self = this;
        return map( this.autocomplete_tags.items, function( tag )
        {
            if ( !self.tags.find( tag.id ) )
                return tag;
        } );
    };

    /**
     * Hides autocomplete element in view
     */
    Base.prototype.close_autocomplete = function()
    {
        var results = this.$( '.results-wrap' );
        if ( results )
        {
            results.innerHTML = '';
            hide( results.parentNode );
        }
        if ( this.hideAutocompleteListener )
        {
            document.removeEventListener( 'click', this.hideAutocompleteListener );
            this.hideAutocompleteListener = null;
        }
    };

    /**
     * Called after the suggested tags were fetched: puts them into a new collection and renders them.
     * @param  {object} data Data object containing fetched tags from ajax call.
     */
    Base.prototype.after_fetch_suggestions = function( data )
    {
        var self = this;
        this.suggested_tags = new this.CollectionKlass();
        each( data.content.tags, function( i, raw )
        {
            self.suggested_tags.add( self.parse_remote_tag( raw ) );
        } );
        this.render_suggested_tags();
    };

    /**
     * Parses raw tags into TagKlass objects of a collection (a new one when none is given).
     */
    Base.prototype.parse_remote_tags = function( raw_tags, collection )
    {
        var tags = collection || new this.CollectionKlass(),
            self = this;

        each( raw_tags, function( i, raw )
        {
            tags.add( self.parse_remote_tag( raw ) );
        } );

        return tags;
    };

    /**
     * Parse recieved tag and returns new TagKlass object
     */
    Base.prototype.parse_remote_tag = function( raw )
    {
        return new this.TagKlass( raw );
    };

    /**
     * Disable add button when input for tag name is empty. Enable it otherwise.
     */
    Base.prototype.enable_or_disable_add_button = function()
    {
        this.get_tag_name_from_input() ? this.enable_add_button() : this.disable_add_button();
    };

    Base.prototype.enable_add_button = function()
    {
        var button = this.add_button;
        if ( !button )
            return;
        removeClass( button, 'button-disabled' );
        addClass( button, 'button' );
        button.removeAttribute( 'disabled' );
    };

    Base.prototype.disable_add_button = function()
    {
        var button = this.add_button;
        if ( !button )
            return;
        addClass( button, 'button-disabled' );
        removeClass( button, 'button' );
        button.disabled = true;
    };

    Base.prototype.input_focus = function( e )
    {
        e.currentTarget.value.length && this.fetch_autocomplete( e );
    };

    /**
     * Map events on event listeners.
     */
    Base.prototype.setup_events = function()
    {
        var self = this;
        this.add_button && this.add_button.addEventListener( 'click', this.handler_add_buton.bind( this ) );
        this.on( 'click', '.js-tags-remove', this.handler_remove_buton.bind( this ) );
        this.on( 'click', '.js-suggested-item', this.handler_suggested_tag.bind( this ) );
        this.on( 'click', '.js-autocomplete-item', this.handler_autocomplete_tag.bind( this ) );
        if ( this.input )
        {
            this.input.addEventListener( 'keyup', this.enable_or_disable_add_button.bind( this ) );
            this.input.addEventListener( 'keyup', EzTags.debouncer( this.fetch_autocomplete, this.opts.suggestTimeout, this ) );
            this.input.addEventListener( 'keydown', this.navigate_autocomplete_dropdown.bind( this ) );
            this.input.addEventListener( 'focus', function( e ) { self.input_focus( e ); } );
        }
        this.autocomplete_tags_element && this.autocomplete_tags_element.addEventListener( 'keydown', this.navigate_autocomplete_dropdown.bind( this ) );
        this.on( 'add:after', this.close_autocomplete.bind( this ) );

        this.setup_tree_picker_events();
        this.opts.sortable && this.setup_sortable();
    };

    /**
     * Adds the tag the user clicks on in the autocomplete list.
     */
    Base.prototype.handler_autocomplete_tag = function( e )
    {
        e.preventDefault();
        var item = closest( e.target, '[data-cid]' );
        var tag = this.autocomplete_tags.find( item ? dataValue( item.getAttribute( 'data-cid' ) ) : undefined );
        this.add( tag );
    };

    /**
     * Navigation through the autocomplete dropdown: ESC closes it, UP and DOWN move through its items.
     */
    Base.prototype.navigate_autocomplete_dropdown = function( e )
    {
        if ( EzTags.is_key( e, 'ESC' ) )
            this.close_autocomplete();

        if ( !EzTags.is_key( e, ['UP', 'DOWN'] ) )
            return;
        var items = this.autocomplete_tags_element ? Array.prototype.slice.call( this.autocomplete_tags_element.querySelectorAll( 'a' ) ) : [];

        if ( !items.length )
            return;

        // Prevent page from moving
        e.preventDefault();
        e.stopPropagation();

        var index = items.indexOf( e.target );

        EzTags.is_key( e, 'UP' ) && index >= 0                 && index--;
        EzTags.is_key( e, 'DOWN' ) && index < items.length - 1 && index++;

        if ( index > -1 )
            items[index].focus();
        else
            this.input.focus();
    };

    /**
     * A click on a suggested tag: moves it from the suggested tags to the tags of this object.
     */
    Base.prototype.handler_suggested_tag = function( e )
    {
        e.preventDefault();
        if ( this.max_tags_limit_reached() )
            return;
        var item = closest( e.target, '[data-cid]' );
        var tag = this.suggested_tags.find( item ? dataValue( item.getAttribute( 'data-cid' ) ) : undefined );
        this.suggested_tags.remove( tag );
        this.add( tag );
        this.render_suggested_tags();
    };

    /**
     * Adds a new tag on the add button: under subtreeLimit when there is one, else under the parent chosen in the
     * tree picker. At the end, closes autocomplete field.
     */
    Base.prototype.handler_add_buton = function()
    {
        this.new_tag_attributes = {
            name: this.get_tag_name_from_input(),
            locale: this.opts.locale
        };

        if ( !this._validate( this.new_tag_attributes ) )
            return;
        if ( this.opts.subtreeLimit )
        {
            this.new_tag_attributes.parent_id = this.opts.subtreeLimit;
            this.add( this.new_tag_attributes );
        }
        else
        {
            this.show_tree_picker();
        }
        this.close_autocomplete();
    };

    /**
     * Handles tag removal on button click.
     * @return {object}   Tag that was removed.
     */
    Base.prototype.handler_remove_buton = function( e )
    {
        e.preventDefault();
        var item = closest( e.target, '[data-cid]' );
        return this.remove( item ? dataValue( item.getAttribute( 'data-cid' ) ) : undefined );
    };

    // Parent picker ===============================================================================================
    Base.prototype.show_tree_picker = function()
    {
        this.tree_picker && this.tree_picker.open( this.add_button );
    };

    Base.prototype.hide_tree_picker = function()
    {
        this.tree_picker && this.tree_picker.close();
    };

    Base.prototype.setup_tree_picker = function()
    {
        var self = this;
        this.tree_picker = Dialog.of( this.tree_picker_element, {
            onShow: function() { self.tree_picker_open = true; },
            onHide: function() { self.tree_picker_open = false; }
        } );
    };

    Base.prototype.setup_tree_picker_events = function()
    {
        var self = this, picker = this.tree_picker_element;
        picker && picker.addEventListener( 'click', function( e )
        {
            var link = closest( e.target, 'a[rel]', picker );
            if ( !link )
                return;
            e.preventDefault();
            self.select_parent_id_from_tree_picker( link.getAttribute( 'rel' ) ); // parent_id is on rel attribute
        } );
    };

    /**
     * Renders the tags of this.tags in the list of selected tags.
     */
    Base.prototype.render_tags = function()
    {
        var self = this;
        var tags = map( this.tags.items, function( tag )
        {
            return self.render_template( 'selectedItem', { tag: tag } );
        } );
        if ( !this.selected_tags )
            return;
        tags.length ? removeClass( this.selected_tags.parentNode, 'no-results' ) : addClass( this.selected_tags.parentNode, 'no-results' );
        this.selected_tags.innerHTML = tags.join( '' );
    };

    /**
     * Renders the tags of this.suggested_tags in the list of suggested tags.
     */
    Base.prototype.render_suggested_tags = function()
    {
        var self = this;
        var tags = map( this.suggested_tags.items, function( tag )
        {
            return self.render_template( 'suggestedItem', { tag: tag } );
        } );
        if ( !this.suggested_tags_element )
            return;
        tags.length ? removeClass( this.suggested_tags_element.parentNode, 'no-results' ) : addClass( this.suggested_tags_element.parentNode, 'no-results' );
        this.suggested_tags_element.innerHTML = tags.join( '' );
    };

    /**
     * Sets the parent of the tag being created (see handler_add_buton) and adds it.
     * @param  {string} parent_id Id of selected parent.
     */
    Base.prototype.select_parent_id_from_tree_picker = function( parent_id )
    {
        this.new_tag_attributes.parent_id = parent_id;
        this.add( this.new_tag_attributes );
    };

    /**
     * Creates a new tag object from TagKlass and adds it to this.tags.
     * @return {TagKlass object}   Object that was added to this.tags collection.
     */
    Base.prototype.add = function( attributes, opts )
    {
        opts || ( opts = {} );
        if ( this.max_tags_limit_reached() )
            return;
        var tag = new this.TagKlass( attributes );
        this.trigger( 'add:before', { tag: tag }, opts );
        this.tags.add( tag );
        tag.tags_suggest = this;
        this.max_tags_handler();

        this.trigger( 'add:after', { tag: tag }, opts );
        this.after_add( opts );
        return tag;
    };

    /**
     * Check if maximum tags limit is reached and disable/enable input field accordingly.
     */
    Base.prototype.max_tags_handler = function()
    {
        if ( this.input )
            this.input.disabled = this.max_tags_limit_reached();
    };

    /**
     * Checks if limit for maximum tags per object is reached.
     */
    Base.prototype.max_tags_limit_reached = function()
    {
        return this.opts.maxTags ? this.tags.length() >= this.opts.maxTags : false;
    };

    /**
     * Removes a tag from this.tags: the tag, or null when it is not there.
     */
    Base.prototype.remove = function( id )
    {
        var tag = this.tags.find( id );

        if ( tag === null )
            return null;

        this.trigger( 'remove:before', { tag: tag } );
        this.tags.remove( tag );
        this.max_tags_handler();
        this.trigger( 'remove:after', { tag: tag } );
        this.after_remove();
        return tag;
    };

    Base.prototype.add_only_one = function( tag )
    {
        this.tags.clear();
        this.add( tag );
    };

    Base.prototype.exists = function( name )
    {
        return this.tags.find_by( 'name', name ) !== null;
    };

    Base.prototype.valid = function( attributes )
    {
        return !this.exists( attributes.name );
    };

    Base.prototype._validate = function( attributes )
    {
        var result = this.valid( attributes );
        var event = 'tag:' + [result ? 'valid' : 'invalid'];
        this.trigger( event, { attributes: attributes } );
        return result;
    };

    Base.prototype.after_add = function( opts )
    {
        opts || ( opts = {} );
        if ( opts.silent )
            return;
        this.update_inputs();
        this.render_tags();
    };

    Base.prototype.after_remove = function()
    {
        this.update_inputs();
        this.render_tags();
    };

    /**
     * The tags as four arrays: ids, locales, parent ids and names.
     */
    Base.prototype.serialize = function()
    {
        var data = {
            tagids:     [],
            taglocales: [],
            tagpids:    [],
            tagnames:   []
        };

        each( this.tags.items, function( index, tag )
        {
            data.tagids.push( tag.id );
            data.taglocales.push( tag.locale );
            data.tagpids.push( tag.parent_id );
            data.tagnames.push( tag.name );
        } );

        return data;
    };

    /**
     * Reads the tags of the hidden inputs into this.tags, silently (no rendering).
     */
    Base.prototype.unserialize = function()
    {
        var self = this;
        var ids = this.parse_hidden_input( 'tagids' );
        var names = this.parse_hidden_input( 'tagnames' );
        var locales = this.parse_hidden_input( 'taglocales' );
        var pids = this.parse_hidden_input( 'tagpids' );

        each( ids, function( i, id )
        {
            self.add( {
                id: id,
                name: names[i],
                locale: locales[i],
                parent_id: pids[i]
            }, { silent: true } );
        } );
    };

    Base.prototype.parse_hidden_input = function( name )
    {
        var input = this.hidden_inputs[name], val = input ? String( input.value ).replace( /\r/g, '' ).trim() : '';
        return val ? val.split( '|#' ) : [];
    };

    Base.prototype.update_inputs = function()
    {
        var self = this, data = this.serialize();
        for ( var k in data )
        {
            if ( self.hidden_inputs[k] )
                self.hidden_inputs[k].value = data[k].join( '|#' );
        }
    };

    Base.prototype.get_tag_name_from_input = function()
    {
        return this.input ? String( this.input.value ).replace( /\r/g, '' ).trim() : '';
    };

    Base.prototype.clear_input = function()
    {
        if ( this.input )
            this.input.value = '';
        return this.input;
    };

    /*
      The selected tags are put into another order with the mouse (or a pen or a finger): pressed on a tag (not on
      its remove link) and moved by more than a few pixels, the tag follows the pointer among the others; released,
      the new order is saved (on_sortable_update) when it changed. The list has the class with_sortable.
    */
    Base.prototype.setup_sortable = function()
    {
        var self = this, list = this.selected_tags, drag = null;
        if ( !list )
            return;
        addClass( list, 'with_sortable' );

        var order = function()
        {
            return map( Array.prototype.slice.call( list.children ), function( li ) { return li.getAttribute( 'data-cid' ); } );
        };

        var move = function( e )
        {
            if ( !drag )
                return;
            if ( !drag.moving )
            {
                if ( Math.abs( e.clientX - drag.x ) + Math.abs( e.clientY - drag.y ) < 4 )
                    return;
                drag.moving = true;
                addClass( drag.li, 'is-sorting' );
            }
            e.preventDefault();
            var items = Array.prototype.slice.call( list.children );
            for ( var i = 0; i < items.length; i++ )
            {
                if ( items[i] === drag.li )
                    continue;
                var r = items[i].getBoundingClientRect();
                if ( e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom )
                {
                    var after = e.clientX > r.left + r.width / 2;
                    list.insertBefore( drag.li, after ? items[i].nextSibling : items[i] );
                    break;
                }
            }
        };

        var end = function()
        {
            if ( !drag )
                return;
            var moved = drag.moving, before = drag.order;
            removeClass( drag.li, 'is-sorting' );
            drag = null;
            document.removeEventListener( 'mousemove', move );
            document.removeEventListener( 'mouseup', end );
            if ( moved )
            {
                // the click that ends the move does not open or remove anything
                var swallow = function( e ) { e.preventDefault(); e.stopPropagation(); };
                list.addEventListener( 'click', swallow, true );
                setTimeout( function() { list.removeEventListener( 'click', swallow, true ); }, 0 );
                var now = order();
                if ( now.join( ',' ) !== before.join( ',' ) )
                    self.on_sortable_update( now );
            }
        };

        list.addEventListener( 'mousedown', function( e )
        {
            if ( e.button !== 0 || closest( e.target, '.js-tags-remove', list ) )
                return;
            var li = closest( e.target, 'li', list );
            if ( !li || li.parentNode !== list )
                return;
            drag = { li: li, x: e.clientX, y: e.clientY, moving: false, order: order() };
            document.addEventListener( 'mousemove', move );
            document.addEventListener( 'mouseup', end );
        } );
    };

    Base.prototype.on_sortable_update = function( new_order )
    {
        this.tags.sort_by( new_order, true );
        this.update_inputs();
    };

    Base.prototype.destroy = function()
    {
        // TODO: implement destroy
    };

    Tag.extend = Collection.extend = Base.extend = klass_extend;

    /* Events: trigger, on, off on the element, and $ for an element inside it */
    Base.prototype.trigger = function( event, data, opts )
    {
        if ( opts && opts.silent )
            return;
        var detail = extend( { instance: this }, data ), e;
        if ( typeof window.CustomEvent === 'function' )
            e = new CustomEvent( event, { bubbles: true, cancelable: true, detail: detail } );
        else
        {
            e = document.createEvent( 'CustomEvent' );
            e.initCustomEvent( event, true, true, detail );
        }
        this.el.dispatchEvent( e );
    };

    /**
     * on( type, [selector,] handler ): handler( event, data ) with this = the element (the one matching selector
     * when one is given); data is a custom event's detail
     */
    Base.prototype.on = function( type, selector, handler )
    {
        if ( typeof selector === 'function' )
        {
            handler = selector;
            selector = null;
        }
        var el = this.el;
        var listener = function( e )
        {
            var target = el;
            if ( selector )
            {
                target = closest( e.target, selector, el.parentNode );
                if ( !target || !el.contains( target ) )
                    return;
            }
            var result = handler.call( target, e, e.detail );
            if ( result === false )
            {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        this.listeners.push( { type: type, selector: selector, handler: handler, listener: listener } );
        el.addEventListener( type, listener );
    };

    Base.prototype.off = function( type, selector, handler )
    {
        if ( typeof selector === 'function' )
        {
            handler = selector;
            selector = undefined;
        }
        for ( var i = this.listeners.length - 1; i >= 0; i-- )
        {
            var l = this.listeners[i];
            if ( ( !type || l.type === type ) && ( selector === undefined || l.selector === selector ) && ( !handler || l.handler === handler ) )
            {
                this.el.removeEventListener( l.type, l.listener );
                this.listeners.splice( i, 1 );
            }
        }
    };

    Base.prototype.$ = function( selector )
    {
        return this.el.querySelector( selector );
    };

    // Exports
    EzTags.Tag = Tag;
    EzTags.Collection = Collection;
    EzTags.Base = Base;
    EzTags.Dialog = Dialog;

    EzTags.Default = EzTags.Base.extend( {

        initialize: function()
        {
            this.fetch_suggestions_debounced = EzTags.debouncer( this.fetch_suggestions, this.opts.suggestTimeout, this );
            this.fetch_suggestions_debounced();
        },

        after_add: function( opts )
        {
            opts || ( opts = {} );
            if ( opts.silent )
                return;
            this.update_inputs();
            if ( this.input )
                this.input.value = '';
            this.hide_tree_picker();
            this.render_tags();
            this.new_tag_attributes = {};
            this.fetch_suggestions_debounced();
        },

        after_remove: function()
        {
            this.update_inputs();
            this.render_tags();
            this.fetch_suggestions_debounced();
        }

    } );

    // Select builder ==============================================================================================
    EzTags.Select = EzTags.Base.extend( {
        templates: {
            option: ['<option value="<%= tag.id %>" <%= selected %> ><%= tag.name %></option>'],
            select: ['<select class="js-tag-select form-control" aria-label="<%=tr.chooseTag%>"></select>'],
            skeleton: [
                '<div class="selects"></div>'
            ]
        },

        /**
         * Fetches the tags to choose from, then appends a dropdown per selected tag (and one more), or one
         * dropdown; listens to the changes of the dropdowns.
         */
        initialize: function()
        {
            var self = this;
            this.fetch_available_tags( function()
            {
                if ( this.tags.length() )
                {
                    each( this.tags.items, function( i, tag )
                    {
                        self.append_select( tag );
                    } );
                    self.selects = self.$( '.selects' );
                    self.should_append_new_select();
                    self.update_selects();
                }
                else
                {
                    self.append_select();
                }
            } );
            this.selects = this.$( '.selects' );
            this.on( 'change', '.js-tag-select', this.on_select.bind( this ) );
        },

        /**
         * A dropdown changed: the tag chosen before is removed, the new one added; a blank choice removes the tag
         * (and its dropdown, when another blank one is there).
         */
        on_select: function( e )
        {
            var select = e.target,
                id = select.value,
                tag = select.eztagsLinkedTag,
                new_tag;

            if ( id )
            {
                new_tag = this.available_tags.find( id );
                tag && this.remove( tag.id );
                this.add( new_tag );
                !tag && this.should_append_new_select();
                this.link_tag_and_select( new_tag, select );
            }
            else
            {
                if ( tag )
                {
                    var blank = false;
                    each( Array.prototype.slice.call( select.parentNode.children ), function( i, sibling )
                    {
                        // jQuery's val(): null for a dropdown with no option chosen
                        if ( sibling !== select && ( sibling.selectedIndex < 0 ? null : sibling.value ) === '' )
                            blank = true;
                    } );
                    blank && tag.select && tag.select.parentNode && tag.select.parentNode.removeChild( tag.select );
                    this.remove( tag.id );
                    this.unlink_tag_and_select( tag, select );
                }
            }
            this.update_selects();
        },

        link_tag_and_select: function( tag, select )
        {
            tag.select = select;
            select.eztagsLinkedTag = tag;
        },

        unlink_tag_and_select: function( tag, select )
        {
            tag.select = null;
            select.eztagsLinkedTag = null;
        },

        /**
         * A tag chosen in one dropdown is disabled in the others; the dropdown linked to a tag shows it chosen.
         */
        update_selects: function()
        {
            var self = this;
            each( Array.prototype.slice.call( this.el.querySelectorAll( 'option' ) ), function( i, option )
            {
                option.disabled = false;
                option.selected = false;
            } );
            each( Array.prototype.slice.call( this.el.querySelectorAll( 'select' ) ), function( i, select )
            {
                var linked_tag = select.eztagsLinkedTag;
                each( self.tags.items, function( j, tag )
                {
                    var options = select.querySelectorAll( 'option[value="' + tag.id + '"]' );
                    for ( var o = 0; o < options.length; o++ )
                    {
                        if ( linked_tag && tag.id === linked_tag.id )
                            options[o].selected = true;
                        else
                            options[o].disabled = true;
                    }
                } );
            } );
        },

        should_append_new_select: function()
        {
            if ( this.max_tags_limit_reached() )
                return;
            this.append_select();
        },

        fetch_available_tags: function( done )
        {
            var self = this;
            ez( 'ezjsctags::children::' + this.opts.subtreeLimit + '::' + this.opts.hideRootTag + '::' + this.opts.locale, {}, function( data )
            {
                self.available_tags = self.parse_remote_tags( data.content.tags );
                done.call( self );
            } );
        },

        /**
         * Fills a dropdown with a blank choice and all available tags, linked with unlinked_tag.
         */
        setup_select: function( select, unlinked_tag )
        {
            var self = this, selected, html = '';
            var dummy_tag = new this.TagKlass( { id: '', name: '' } );
            html += self.render_template( 'option', { tag: dummy_tag, selected: null } );

            unlinked_tag && this.link_tag_and_select( unlinked_tag, select );

            each( this.available_tags.items, function( i, tag )
            {
                selected = unlinked_tag && tag.id === unlinked_tag.id ? 'selected="selected"' : '';
                html += self.render_template( 'option', { tag: tag, selected: selected } );
            } );
            select.insertAdjacentHTML( 'beforeend', html );
        },

        /**
         * Appends a dropdown to div.selects, linked with unlinked_tag.
         */
        append_select: function( unlinked_tag )
        {
            var select = parseHTML( this.render_template( 'select' ) )[0];
            this.setup_select( select, unlinked_tag );
            this.selects.appendChild( select );
        }
    } );

    // Tree builder ================================================================================================
    /*
      The tag tree of the tree builder (content/datatype/edit/view/tree.tpl, div.ez-tags-tree-selector with
      data-config-url and data-base-url), in place of jsTree: a WAI-ARIA tree.

        <ul class="eztags-tree" role="tree" aria-label="Choose a tag" aria-multiselectable="true">
          <li class="eztags-tree-node is-open" role="none">
            <span class="eztags-tree-toggle" aria-hidden="true"></span>
            <a class="eztags-tree-anchor" role="treeitem" href="#" tabindex="0" aria-level="1" aria-setsize="1"
               aria-posinset="1" aria-expanded="true" aria-selected="false" data-id="7" data-name="..."
               data-parent_id="0" data-locale="eng-GB"><img src="icon" alt="" /> keyword</a>
            <ul class="eztags-tree-group" role="group">...</ul>
          </li>
        </ul>

      The data-* attributes are the a_attr of the server (ezjsctags::tree), data-selected="true" marks a tag of the
      field (aria-selected="true"), a node the server sends disabled (the top level) has aria-disabled="true".
      Requests: the configuration (data-config-url?ContentType=json), then the children of a tag (data-base-url +
      id + ?ContentType=json) when it is opened the first time: the root, which opens by itself, unless the root is
      hidden (its children are then the top of the tree).
      Mouse: a click on a tag adds it to the field, a click on the toggle (or a double click on the tag) opens or
      closes it. Keyboard (one item in the Tab order): Up and Down move through the shown items, Right opens a tag
      or moves to its first child, Left closes it or moves to its parent, Home and End go to the first and last item,
      typed letters to the next item starting with them, Enter and Space add the tag.
    */
    var TreeView = function( el, field )
    {
        this.el = el;
        this.field = field;
        this.rootNodeAdded = false;
        this.rootNode = {};
        this.typed = '';
        this.typedAt = 0;
        if ( el )
            this.getSetupData();
    };

    TreeView.prototype.getSetupData = function()
    {
        getJSON( this.el.getAttribute( 'data-config-url' ) + '?ContentType=json', function( data )
        {
            this.rootNode = data.content.config.rootTag;
            this.hideRoot = data.content.config.hideRootTag;
            this.initialiseTree();
        }.bind( this ) );
    };

    // As jsTree's data function: the nodes under node ('#': the top), handed to cb
    TreeView.prototype.getTreeData = function( node, cb )
    {
        if ( this.rootNodeAdded || this.hideRoot )
        {
            var tagId = node.id == '#' ? this.rootNode.id : node.id;
            getJSON( this.el.getAttribute( 'data-base-url' ) + tagId + '?ContentType=json', function( data )
            {
                var children = data.content.children;
                var selected = this.field.tags.items;
                for ( var i = 0; i < children.length; i++ )
                {
                    ( children[i].parent == this.rootNode.id && this.hideRoot ) && ( children[i].parent = '#' );
                    for ( var j = 0; j < selected.length; j++ )
                    {
                        if ( children[i].id.toString() == selected[j].id )
                        {
                            children[i].a_attr = children[i].a_attr || {};
                            children[i].a_attr['data-selected'] = true;
                        }
                    }
                }
                cb( children );
            }.bind( this ) );
        }
        else
        {
            // set before the root is drawn: the root comes open and loads its children at once
            this.rootNodeAdded = true;
            cb( [this.rootNode] );
        }
    };

    TreeView.prototype.initialiseTree = function()
    {
        var self = this, tr = this.field.opts.translations;
        var ul = document.createElement( 'ul' );
        ul.className = 'eztags-tree';
        ul.setAttribute( 'role', 'tree' );
        ul.setAttribute( 'aria-label', tr.chooseTag );
        ul.setAttribute( 'aria-multiselectable', 'true' );
        ul.setAttribute( 'aria-busy', 'true' );
        this.el.innerHTML = '';
        this.el.appendChild( ul );
        this.tree = ul;

        ul.addEventListener( 'click', function( e )
        {
            var toggle = closest( e.target, '.eztags-tree-toggle', ul );
            if ( toggle )
            {
                e.preventDefault();
                self.toggle( toggle.parentNode );
                return;
            }
            var anchor = closest( e.target, 'a.eztags-tree-anchor', ul );
            if ( anchor )
            {
                e.preventDefault();
                self.activate( anchor );
            }
        } );
        ul.addEventListener( 'dblclick', function( e )
        {
            var anchor = closest( e.target, 'a.eztags-tree-anchor', ul );
            if ( anchor )
            {
                e.preventDefault();
                self.toggle( anchor.parentNode );
            }
        } );
        ul.addEventListener( 'keydown', this.keydown.bind( this ) );
        ul.addEventListener( 'focusin', function( e )
        {
            if ( e.target.getAttribute && e.target.getAttribute( 'role' ) === 'treeitem' )
                self.tabStop( e.target );
        } );

        this.getTreeData( { id: '#' }, function( nodes )
        {
            ul.removeAttribute( 'aria-busy' );
            self.append( ul, nodes, 1 );
        } );
    };

    // Draws nodes into list (level: their aria-level); a node that comes open loads its children
    TreeView.prototype.append = function( list, nodes, level )
    {
        for ( var i = 0; i < nodes.length; i++ )
        {
            var node = nodes[i], state = node.state || {}, attrs = node.a_attr || {};
            var li = document.createElement( 'li' );
            li.className = 'eztags-tree-node ' + ( node.children ? 'is-closed' : 'is-leaf' );
            li.setAttribute( 'role', 'none' );
            li.eztagsNode = node;

            var toggle = document.createElement( 'span' );
            toggle.className = 'eztags-tree-toggle';
            toggle.setAttribute( 'aria-hidden', 'true' );
            li.appendChild( toggle );

            var a = document.createElement( 'a' );
            a.className = 'eztags-tree-anchor';
            a.setAttribute( 'href', '#' );
            a.setAttribute( 'role', 'treeitem' );
            a.setAttribute( 'tabindex', '-1' );
            a.setAttribute( 'aria-level', String( level ) );
            a.setAttribute( 'aria-setsize', String( nodes.length ) );
            a.setAttribute( 'aria-posinset', String( i + 1 ) );
            for ( var name in attrs )
            {
                if ( hasOwn.call( attrs, name ) && attrs[name] !== null && attrs[name] !== undefined && attrs[name] !== false )
                    a.setAttribute( name, String( attrs[name] ) );
            }
            a.setAttribute( 'aria-selected', a.getAttribute( 'data-selected' ) === 'true' ? 'true' : 'false' );
            if ( state.disabled )
                a.setAttribute( 'aria-disabled', 'true' );
            if ( node.children )
                a.setAttribute( 'aria-expanded', 'false' );
            if ( node.icon )
            {
                var img = document.createElement( 'img' );
                img.setAttribute( 'src', node.icon );
                img.setAttribute( 'alt', '' );
                img.className = 'eztags-tree-icon';
                a.appendChild( img );
            }
            a.appendChild( document.createTextNode( node.text === undefined || node.text === null ? '' : String( node.text ) ) );
            li.appendChild( a );
            list.appendChild( li );

            if ( node.children && state.opened )
                this.toggle( li );
        }
        if ( !this.tree.querySelector( '[role="treeitem"][tabindex="0"]' ) )
        {
            var first = this.tree.querySelector( '[role="treeitem"]' );
            first && first.setAttribute( 'tabindex', '0' );
        }
    };

    // Opens or closes the node li; its children are loaded the first time
    TreeView.prototype.toggle = function( li )
    {
        var node = li && li.eztagsNode, a = li && this.anchorOf( li );
        if ( !node || !node.children || !a )
            return false;
        var group = this.groupOf( li );
        if ( a.getAttribute( 'aria-expanded' ) === 'true' )
        {
            a.setAttribute( 'aria-expanded', 'false' );
            li.className = li.className.replace( /\bis-open\b/, 'is-closed' );
            group && ( group.hidden = true );
            return true;
        }
        if ( group )
        {
            group.hidden = false;
            a.setAttribute( 'aria-expanded', 'true' );
            li.className = li.className.replace( /\bis-closed\b/, 'is-open' );
            return true;
        }
        if ( li.eztagsLoading )
            return true;
        li.eztagsLoading = true;
        a.setAttribute( 'aria-busy', 'true' );
        var self = this, level = parseInt( a.getAttribute( 'aria-level' ), 10 ) + 1;
        this.getTreeData( node, function( children )
        {
            li.eztagsLoading = false;
            a.removeAttribute( 'aria-busy' );
            var list = document.createElement( 'ul' );
            list.className = 'eztags-tree-group';
            list.setAttribute( 'role', 'group' );
            li.appendChild( list );
            a.setAttribute( 'aria-expanded', 'true' );
            li.className = li.className.replace( /\bis-closed\b/, 'is-open' );
            if ( !children.length )
            {
                // nothing under it after all: a leaf
                li.removeChild( list );
                a.removeAttribute( 'aria-expanded' );
                li.className = li.className.replace( /\bis-open\b/, 'is-leaf' );
                return;
            }
            self.append( list, children, level );
        } );
        return true;
    };

    TreeView.prototype.anchorOf = function( li )
    {
        for ( var c = li.firstChild; c; c = c.nextSibling )
        {
            if ( c.nodeType === 1 && c.tagName === 'A' )
                return c;
        }
        return null;
    };

    TreeView.prototype.groupOf = function( li )
    {
        for ( var c = li.firstChild; c; c = c.nextSibling )
        {
            if ( c.nodeType === 1 && c.tagName === 'UL' )
                return c;
        }
        return null;
    };

    // A tag link chosen (click, Enter, Space): its tag is added to the field, unless the node is disabled
    TreeView.prototype.activate = function( a )
    {
        if ( a.getAttribute( 'aria-disabled' ) === 'true' )
            return;
        this.tabStop( a );
        this.field.add( readData( a ) );
    };

    TreeView.prototype.mark = function( id, selected )
    {
        if ( !this.tree )
            return;
        var anchors = this.tree.querySelectorAll( 'a.eztags-tree-anchor' );
        for ( var i = 0; i < anchors.length; i++ )
        {
            if ( anchors[i].getAttribute( 'data-id' ) !== String( id ) )
                continue;
            if ( selected )
                anchors[i].setAttribute( 'data-selected', 'true' );
            else
                anchors[i].removeAttribute( 'data-selected' );
            anchors[i].setAttribute( 'aria-selected', selected ? 'true' : 'false' );
        }
    };

    TreeView.prototype.shownItems = function()
    {
        var all = this.tree.querySelectorAll( '[role="treeitem"]' ), out = [];
        for ( var i = 0; i < all.length; i++ )
        {
            if ( !all[i].closest( '[hidden]' ) )
                out.push( all[i] );
        }
        return out;
    };

    TreeView.prototype.tabStop = function( item )
    {
        var current = this.tree.querySelector( '[role="treeitem"][tabindex="0"]' );
        if ( current && current !== item )
            current.setAttribute( 'tabindex', '-1' );
        item.setAttribute( 'tabindex', '0' );
    };

    TreeView.prototype.keydown = function( e )
    {
        var item = e.target;
        if ( e.altKey || e.ctrlKey || e.metaKey || !item.getAttribute || item.getAttribute( 'role' ) !== 'treeitem' )
            return;
        var li = item.parentNode, items = this.shownItems(), index = items.indexOf( item ), next = null, handled = false;
        switch ( e.key )
        {
            case 'ArrowDown': next = items[index + 1] || null; break;
            case 'ArrowUp': next = index > 0 ? items[index - 1] : null; break;
            case 'Home': next = items[0] || null; break;
            case 'End': next = items[items.length - 1] || null; break;
            case 'ArrowRight':
                if ( item.getAttribute( 'aria-expanded' ) === 'false' )
                    handled = this.toggle( li );
                else if ( item.getAttribute( 'aria-expanded' ) === 'true' )
                {
                    var group = this.groupOf( li ), first = group && group.querySelector( '[role="treeitem"]' );
                    next = first || null;
                    handled = true;
                }
                break;
            case 'ArrowLeft':
                if ( item.getAttribute( 'aria-expanded' ) === 'true' )
                    handled = this.toggle( li );
                else
                {
                    var parentLi = li.parentNode && li.parentNode.parentNode;
                    next = parentLi && parentLi.tagName === 'LI' ? this.anchorOf( parentLi ) : null;
                }
                break;
            case 'Enter':
            case ' ':
                this.activate( item );
                handled = true;
                break;
            default:
                if ( !e.key || e.key.length !== 1 || !/\S/.test( e.key ) )
                    return;
                // Type-ahead: letters typed within half a second form one search
                var now = new Date().getTime();
                this.typed = ( now - this.typedAt < 500 ? this.typed : '' ) + e.key.toLowerCase();
                this.typedAt = now;
                var start = this.typed.length === 1 ? index + 1 : index;
                for ( var n = 0; n < items.length && !next; n++ )
                {
                    var candidate = items[( start + n + items.length ) % items.length];
                    if ( String( candidate.textContent ).trim().toLowerCase().indexOf( this.typed ) === 0 )
                        next = candidate;
                }
        }
        if ( next )
        {
            this.tabStop( next );
            next.focus();
            handled = true;
        }
        if ( handled )
            e.preventDefault();
    };

    EzTags.TreeView = TreeView;

    EzTags.Tree = EzTags.Default.extend( {
        setup_events: function()
        {
            EzTags.Default.prototype.setup_events.apply( this, arguments );
            this.on( 'remove:after', this.remove_data_selected.bind( this ) );
            this.on( 'add:after', function( e, data )
            {
                this.add_data_selected( data.tag.id );
            }.bind( this ) );
            this.addTree();
        },

        addTree: function()
        {
            var wrapper = this.el.parentNode;
            this.treeView = new TreeView( wrapper ? wrapper.querySelector( '.ez-tags-tree-selector' ) : null, this );
        },

        // marks the tag in the tree: data-selected (styled) and aria-selected
        remove_data_selected: function( e, data )
        {
            this.treeView && this.treeView.mark( data.tag.id, false );
        },

        add_data_selected: function( id )
        {
            this.treeView && this.treeView.mark( id, true );
        }
    } );

    /**
     * Used when editing class in administration for attribute property "Limit by tags subtree", and on the tags
     * pages (Select parent, Select main tag): the button opens the tag picker, a tag chosen in it is written into the
     * hidden field and its path into the text beside it.
     */
    EzTags.AdminClassInterface = function()
    {
        var buttons_base_selector = 'eztags-parent-selector-button-',
            buttons = document.querySelectorAll( '[id^="' + buttons_base_selector + '"]' ),
            trees = document.querySelectorAll( '.parent-selector-tree' ),
            dialogs = [],
            parent_id,
            parent_keyword;

        if ( !buttons.length || !trees.length )
            return;

        // The path of a tag link of the tree: the keywords of its parents and its own, separated by /
        function getParentTagHierarchy( tag, i )
        {
            if ( !tag )
                return '';
            if ( tag.getAttribute( 'rel' ) === '0' )
                return i === 0 ? '(no parent)' : '';
            var div = tag.parentNode ? tag.parentNode.closest( 'div' ) : null,
                prev = div ? div.previousElementSibling : null;
            var parent = getParentTagHierarchy( prev && prev.tagName === 'A' ? prev : null, ++i );
            var span = tag.parentNode.querySelector( 'span' );
            return ( parent ? parent + '/' : '' ) + ( span ? span.innerHTML : '' );
        }

        for ( var t = 0; t < trees.length; t++ )
            dialogs.push( Dialog.of( trees[t], {} ) );

        Array.prototype.forEach.call( buttons, function( button )
        {
            button.addEventListener( 'click', function( e )
            {
                e.preventDefault();
                parent_id      = document.getElementById( this.id.replace( buttons_base_selector, 'eztags_parent_id_' ) );
                parent_keyword = document.getElementById( this.id.replace( buttons_base_selector, 'eztags_parent_keyword_' ) );
                var opener = this;
                dialogs.forEach( function( dialog ) { dialog.open( opener ); } );
            } );
        } );

        document.addEventListener( 'click', function( e )
        {
            var tag = closest( e.target, '.contentstructure a:not([class^="openclose"])' );
            if ( !tag )
                return;
            e.preventDefault();
            if ( tag.closest( 'li.disabled' ) )
            {
                e.stopPropagation();
                return;
            }
            parent_keyword && ( parent_keyword.innerHTML = getParentTagHierarchy( tag, 0 ) );
            parent_id && ( parent_id.value = tag.getAttribute( 'rel' ) );
            dialogs.forEach( function( dialog ) { dialog.close(); } );
        } );
    };

    /**
     * EzTags.init( [root] ): builds the fields under root (the document) that are not built yet, with the builder
     * their data-builder names (Default, Select, Tree)
     */
    EzTags.init = function( root )
    {
        var fields = ( root || document ).querySelectorAll( '[data-eztags]' );
        for ( var i = 0; i < fields.length; i++ )
        {
            var el = fields[i];
            if ( el.eztagsInstance || el.getAttribute( 'data-eztags-ready' ) )
                continue;
            var builder = readData( el ).builder || 'Default';
            if ( typeof EzTags[builder] !== 'function' )
                builder = 'Default';
            el.eztagsInstance = new EzTags[builder]( el, {} );
        }
    };

    // Expose class
    window.EzTags = EzTags;

    // Auto initialize, when the page is parsed (one turn later, as jQuery's ready)
    function start()
    {
        setTimeout( function()
        {
            EzTags.init();
            EzTags.AdminClassInterface();
        }, 0 );
    }
    if ( document.readyState === 'loading' )
        document.addEventListener( 'DOMContentLoaded', start );
    else
        start();
} )();
