{def $tags_add_access = fetch( user, has_access_to, hash( module, tags, function, add ) )
     $tags_edit_access = fetch( user, has_access_to, hash( module, tags, function, edit ) )
     $tags_delete_access = fetch( user, has_access_to, hash( module, tags, function, delete ) )
     $tags_merge_access = fetch( user, has_access_to, hash( module, tags, function, merge ) )
     $tags_add_synonym_access = fetch( user, has_access_to, hash( module, tags, function, addsynonym ) )
     $tags_make_synonym_access = fetch( user, has_access_to, hash( module, tags, function, makesynonym ) )
     $show_full_menu = or( $tags_add_access, $tags_edit_access, $tags_delete_access, $tags_merge_access, $tags_add_synonym_access, $tags_make_synonym_access )
     $tag_menus = hash()
     $tag_menu_elements = hash()}

{* The menus' entries for menuArray, as JSON in data-eztags-menus: eztags_admin.js adds them to menuArray, so the page
   needs no inline script (Content Security Policy). *}
{if $show_full_menu}
    {if $tags_add_access}
        {set $tag_menu_elements = $tag_menu_elements|merge( hash( 'add-child-tag', hash( 'url', '/tags/add/%tagID%'|ezurl( 'no' ) ) ) )}
    {/if}
    {if $tags_delete_access}
        {set $tag_menu_elements = $tag_menu_elements|merge( hash( 'delete-tag', hash( 'url', '/tags/delete/%tagID%'|ezurl( 'no' ) ) ) )}
    {/if}
    {if $tags_merge_access}
        {set $tag_menu_elements = $tag_menu_elements|merge( hash( 'merge-tag', hash( 'url', '/tags/merge/%tagID%'|ezurl( 'no' ) ) ) )}
    {/if}
    {if $tags_add_synonym_access}
        {set $tag_menu_elements = $tag_menu_elements|merge( hash( 'add-synonym-tag', hash( 'url', '/tags/addsynonym/%tagID%'|ezurl( 'no' ) ) ) )}
    {/if}
    {if $tags_make_synonym_access}
        {set $tag_menu_elements = $tag_menu_elements|merge( hash( 'make-synonym-tag', hash( 'url', '/tags/makesynonym/%tagID%'|ezurl( 'no' ) ) ) )}
    {/if}
    {set $tag_menus = $tag_menus|merge( hash( 'TagMenu', hash( 'depth', 0, 'headerID', 'tag-header', 'elements', $tag_menu_elements ) ) )}

    {if $tags_edit_access}
        {set $tag_menus = $tag_menus|merge( hash( 'TagEditSubmenu', hash( 'depth', 1, 'elements', hash(
            'edit-tag-languages', hash( 'variable', '%languages%',
                                        'content', concat( '<a href="', '/tags/edit/%tagID%/%locale%'|ezurl( 'no' ), '" data-eztags-menu-item="TagEditSubmenu">%name%</a>' ) ),
            'edit-tag-languages-new', hash( 'url', '/tags/edit/%tagID%'|ezurl( 'no' ) ) ) ) ) )}
    {/if}
{/if}

{if $tags_add_access}
    {set $tag_menus = $tag_menus|merge( hash( 'TagMenuSimple', hash( 'depth', 0, 'headerID', 'tag-simple-header', 'elements', hash(
        'add-child-tag-simple', hash( 'url', '/tags/add/%tagID%'|ezurl( 'no' ) ) ) ) ) )}
{/if}

{if $tag_menus|count}
    <div hidden data-eztags-menus="{json_encode( $tag_menus )|wash}"></div>
    {ezscript( array( 'eztags_admin.js' ) )}
{/if}

{if $show_full_menu}
    <div class="popupmenu" id="TagMenu">
        <div class="popupmenuheader"><h3 id="tag-header">XXX</h3>
            <div class="break"></div>
        </div>
        {if $tags_add_access}
            <a id="add-child-tag" href="#" data-eztags-menu-item="TagMenu">{"Add child tag"|i18n( "extension/eztags/tags/treemenu" )}</a>
        {/if}
        {if $tags_edit_access}
            <a id="edit-tag" href="#" class="more" data-eztags-menu-item="TagMenu" data-eztags-submenu="TagEditSubmenu" data-menu-submenu="TagEditSubmenu">{"Edit tag"|i18n( "extension/eztags/tags/treemenu" )}</a>
        {/if}
        {if $tags_delete_access}
            <a id="delete-tag" href="#" data-eztags-menu-item="TagMenu">{"Delete tag"|i18n( "extension/eztags/tags/treemenu" )}</a>
        {/if}
        {if $tags_merge_access}
            <a id="merge-tag" href="#" data-eztags-menu-item="TagMenu">{"Merge tag"|i18n( "extension/eztags/tags/treemenu" )}</a>
        {/if}
        <hr />
        {if $tags_add_synonym_access}
            <a id="add-synonym-tag" href="#" data-eztags-menu-item="TagMenu">{"Add synonym"|i18n( "extension/eztags/tags/treemenu" )}</a>
        {/if}
        {if $tags_make_synonym_access}
            <a id="make-synonym-tag" href="#" data-eztags-menu-item="TagMenu">{"Convert to synonym"|i18n( "extension/eztags/tags/treemenu" )}</a>
        {/if}
    </div>
{/if}

{if $tags_edit_access}
    <div class="popupmenu" id="TagEditSubmenu">
        <div id="edit-tag-languages"></div>
        <hr />
        <a id="edit-tag-languages-new" href="#" data-eztags-menu-item="TagEditSubmenu">{'New translation'|i18n( 'extension/eztags/tags/treemenu' )}</a>
    </div>
{/if}

{if $tags_add_access}
    <div class="popupmenu" id="TagMenuSimple">
        <div class="popupmenuheader"><h3 id="tag-simple-header">XXX</h3>
            <div class="break"></div>
        </div>
        <a id="add-child-tag-simple" href="#" data-eztags-menu-item="TagMenuSimple">{"Add child tag"|i18n( "extension/eztags/tags/treemenu" )}</a>
    </div>
{/if}

{undef}
