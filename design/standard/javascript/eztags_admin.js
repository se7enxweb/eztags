/*
  eztags in the administration without inline code: what inline scripts and on...= attributes of the tags pages did
  before, so the pages run under a Content Security Policy without 'unsafe-inline'. Printed with ezscript where the
  scripts stood; it may be printed more than once on a page and sets itself up once. Plain JavaScript, for every
  administration design and kernel version.

  Read on every print (and when the page is parsed):
    [data-eztags-menus='{"TagMenu":{"depth":0,"headerID":"tag-header","elements":{...}}, ...}']
        the context menus' entries, added to menuArray (never assigned anew) for ezpopupmenu.js
    #eztags-tag-children-table[data-eztags-children='{settings}']   the children table (eztags_children.js, on
        Exponential UI's exp::datatable), started one turn after the page is parsed, as before
  One listener per event on the document:
    a[data-eztags-menu-item="TagMenu"]   pointing at a menu item: ezpopmenu_mouseOver( menu ), or with
        data-eztags-submenu="TagEditSubmenu" ezpopmenu_showSubLevel( event, submenu, item id )
    [data-eztags-discard-confirm="Question?"]   a discard button: confirm(); the form's DiscardConfirm field is set to
        0 first, so the server does not ask again
    [data-eztags-history-back]   goes back one page
    [data-eztags-location="url"]   goes to the URL
    [data-eztags-toggle-checkboxes="Locale[]"]   inverts the checkboxes of that name in its form
    [data-eztags-highlight="button id"]   a change makes that button the default button (class defaultbutton);
        with data-eztags-highlight-reset a change makes it a plain button again
*/
( function()
{
    function parse( el, attribute )
    {
        try { return JSON.parse( el.getAttribute( attribute ) || 'null' ); } catch ( e ) { return null; }
    }

    function closest( el, attribute )
    {
        for ( ; el && el.nodeType === 1; el = el.parentNode )
        {
            if ( el.hasAttribute( attribute ) )
                return el;
        }
        return null;
    }

    function registerMenus()
    {
        var nodes = document.querySelectorAll( '[data-eztags-menus]' );
        for ( var n = 0; n < nodes.length; n++ )
        {
            if ( nodes[n].getAttribute( 'data-eztags-menus-added' ) )
                continue;
            nodes[n].setAttribute( 'data-eztags-menus-added', '1' );
            var menus = parse( nodes[n], 'data-eztags-menus' ) || {};
            if ( window.menuArray === undefined )
                window.menuArray = {};
            for ( var menuID in menus )
            {
                var entry = {}, conf = menus[menuID];
                for ( var key in conf )
                {
                    if ( key !== 'elements' )
                        entry[key] = conf[key];
                }
                entry['elements'] = {};
                for ( var itemID in conf['elements'] )
                    entry['elements'][itemID] = conf['elements'][itemID];
                window.menuArray[menuID] = entry;
            }
        }
    }

    function startChildrenTable()
    {
        var el = document.getElementById( 'eztags-tag-children-table' );
        if ( !el || el.getAttribute( 'data-eztags-children-started' ) )
            return;
        var settings = parse( el, 'data-eztags-children' );
        if ( !settings )
            return;
        el.setAttribute( 'data-eztags-children-started', '1' );
        // The table: Exponential UI's exp::datatable
        if ( window.Exp && window.Exp.datatable && typeof window.eZTagsChildren === 'function' )
            window.eZTagsChildren( el, settings );
    }

    function scan()
    {
        if ( !document.querySelectorAll )
            return;
        registerMenus();
    }

    scan();

    if ( window.eZTagsAdminListening || !document.addEventListener )
        return;
    window.eZTagsAdminListening = true;

    // as before (on jQuery's ready): one turn after the page is parsed, after the scripts of the page
    function startLater()
    {
        setTimeout( startChildrenTable, 0 );
    }
    document.addEventListener( 'DOMContentLoaded', function()
    {
        scan();
        startLater();
    } );
    if ( document.readyState !== 'loading' )
        startLater();

    document.addEventListener( 'mouseover', function( e )
    {
        var item = closest( e.target, 'data-eztags-menu-item' );
        if ( !item || item.tagName !== 'A' )
            return;
        var submenu = item.getAttribute( 'data-eztags-submenu' );
        if ( submenu )
        {
            if ( typeof window.ezpopmenu_showSubLevel === 'function' )
                window.ezpopmenu_showSubLevel( e, submenu, item.id );
        }
        else if ( typeof window.ezpopmenu_mouseOver === 'function' )
        {
            window.ezpopmenu_mouseOver( item.getAttribute( 'data-eztags-menu-item' ) );
        }
    } );

    document.addEventListener( 'click', function( e )
    {
        var el = closest( e.target, 'data-eztags-discard-confirm' );
        if ( el )
        {
            var field = el.form && el.form.elements['DiscardConfirm'];
            // Disable/bypass the reload-based (plain HTML) confirmation interface.
            if ( field )
                field.value = '0';
            if ( !window.confirm( el.getAttribute( 'data-eztags-discard-confirm' ) ) )
                e.preventDefault();
            return;
        }
        if ( ( el = closest( e.target, 'data-eztags-history-back' ) ) )
        {
            e.preventDefault();
            window.history.back();
            return;
        }
        if ( ( el = closest( e.target, 'data-eztags-location' ) ) )
        {
            e.preventDefault();
            window.location = el.getAttribute( 'data-eztags-location' );
            return;
        }
        if ( ( el = closest( e.target, 'data-eztags-toggle-checkboxes' ) ) )
        {
            e.preventDefault();
            var form = el.form || closestForm( el );
            if ( !form )
                return;
            var boxes = form.elements[el.getAttribute( 'data-eztags-toggle-checkboxes' )];
            if ( !boxes )
                return;
            if ( boxes.length === undefined )
                boxes = [boxes];
            for ( var i = 0; i < boxes.length; i++ )
            {
                // as ezjs_toggleCheckboxes(): inverted, except disabled ones
                if ( boxes[i].type === 'checkbox' && !boxes[i].disabled )
                    boxes[i].checked = !boxes[i].checked;
            }
        }
    } );

    function closestForm( el )
    {
        for ( ; el && el.nodeType === 1; el = el.parentNode )
        {
            if ( el.tagName === 'FORM' )
                return el;
        }
        return null;
    }

    document.addEventListener( 'change', function( e )
    {
        var el = closest( e.target, 'data-eztags-highlight' );
        var button = el && document.getElementById( el.getAttribute( 'data-eztags-highlight' ) );
        if ( !button )
            return;
        var on = !el.hasAttribute( 'data-eztags-highlight-reset' );
        button.className = button.className.replace( /(^|\s)(defaultbutton|button)(\s|$)/, '$1' + ( on ? 'defaultbutton' : 'button' ) + '$3' );
    } );
} )();
