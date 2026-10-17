/*
  eztags: draws the tag trees declared in data-eztags-tree (the left tree of the tags pages and the trees of the tag
  selection dialogs), which inline scripts wrote with document.writeln before, so the pages run under a Content
  Security Policy without 'unsafe-inline'. Printed after each tree element (ezscript), it draws the trees found so far;
  trees after it are drawn when the page is parsed. Needs tagsstructuremenu.js.

    <ul data-eztags-tree='{"attribute_id":"0", "params":{...}, "root":{...}, "load_root":false, "once":true}'>
      attribute_id  the tree's id: window['treeMenu_' + attribute_id] holds its TagsStructureMenu, as before
      params        the TagsStructureMenu settings; without it those of the data block #eztags-tree-params
                    (ezjsctemplate/tree_menu_script.tpl, also set as window.TagsStructureMenuParams)
      root          the root entry (id, parent_id, has_children, keyword, url, icon, modified; false = now)
      load_root     true: load the children of root.id (a tree limited to a tag), false: those of the top level
      once          true: not drawn when window['treeMenu_' + attribute_id] exists already
*/
( function()
{
    function sharedParams()
    {
        if ( window.TagsStructureMenuParams )
            return window.TagsStructureMenuParams;
        var block = document.getElementById( 'eztags-tree-params' );
        if ( !block )
            return null;
        try { window.TagsStructureMenuParams = JSON.parse( block.textContent ); } catch ( e ) { return null; }
        return window.TagsStructureMenuParams;
    }

    function draw()
    {
        if ( typeof window.TagsStructureMenu !== 'function' || !document.querySelectorAll )
            return;
        var trees = document.querySelectorAll( '[data-eztags-tree]' );
        for ( var i = 0; i < trees.length; i++ )
        {
            var el = trees[i];
            if ( el.getAttribute( 'data-eztags-tree-drawn' ) )
                continue;
            var conf;
            try { conf = JSON.parse( el.getAttribute( 'data-eztags-tree' ) ); } catch ( e ) { conf = null; }
            var params = conf && ( conf.params || sharedParams() );
            if ( !conf || !params )
                continue;
            el.setAttribute( 'data-eztags-tree-drawn', '1' );

            var name = 'treeMenu_' + conf.attribute_id;
            if ( conf.once && window[name] !== undefined )
                continue;

            // the path is compared with the tag ids of the tree as text
            var path = params.path || [];
            for ( var p = 0; p < path.length; p++ )
                path[p] = String( path[p] );
            params.path = path;

            var now = new Date().valueOf(), root = conf.root;
            root.modified = root.modified || now;
            var menu = new TagsStructureMenu( params, String( conf.attribute_id ) );
            window[name] = menu;
            el.innerHTML = menu.generateEntry( root, false, true );
            if ( conf.load_root )
                menu.load( true, root.id, root.modified );
            else
                menu.load( false, 0, now );
        }
    }

    draw();
    if ( document.readyState === 'loading' && document.addEventListener && !window.eZTagsTreeWaiting )
    {
        window.eZTagsTreeWaiting = true;
        document.addEventListener( 'DOMContentLoaded', draw );
    }
} )();
