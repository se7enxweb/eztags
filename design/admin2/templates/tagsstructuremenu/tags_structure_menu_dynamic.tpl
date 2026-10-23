{if is_unset( $menu_persistence )}{def $menu_persistence = ezini( 'TreeMenu', 'MenuPersistence', 'eztags.ini' )|eq( 'enabled' )}{/if}
{if is_unset( $current_user )}{def $current_user = fetch( user, current_user )}{/if}
{def $tree_path = array()}
{if is_set( $module_result.path[0].tag_id )}
    {foreach $module_result.path as $element}{set $tree_path = $tree_path|append( concat( '', $element.tag_id ) )}{/foreach}
{/if}

{* The tree is drawn by tagsstructuremenu.js from data-eztags-tree (eztags_tree.js starts it), so the page needs no
   inline script (Content Security Policy). treeMenu_0 is set as before. *}
<ul id="content_tree_menu" data-eztags-tree="{json_encode( hash(
    'attribute_id', '0',
    'params', hash(
        'path', $tree_path,
        'useCookie', $menu_persistence,
        'perm', concat( $current_user.role_id_list|implode( ',' ), '|' , $current_user.limited_assignment_value_list|implode( ',' ) )|md5,
        'expiry', fetch( content, content_tree_menu_expiry ),
        'modal', false(),
        'context', $ui_context,
        'showTips', ezini( 'TreeMenu', 'ToolTips', 'eztags.ini' )|eq( 'enabled' ),
        'autoOpen', ezini( 'TreeMenu', 'AutoopenCurrentTag', 'eztags.ini' )|eq( 'enabled' ),
        'tag_id_string', 'Tag ID'|i18n( 'extension/eztags/tags/treemenu' ),
        'parent_tag_id_string', 'Parent tag ID'|i18n( 'extension/eztags/tags/treemenu' ),
        'fold_string', 'Fold/Unfold'|i18n( 'design/admin/contentstructuremenu' ),
        'treemenu_base_url', 'tags/treemenu'|ezurl( no ),
        'not_allowed_string', 'Dynamic tree not allowed for this siteaccess'|i18n( 'extension/eztags/tags/treemenu' ),
        'no_tag_string', 'Tag does not exist'|i18n( 'extension/eztags/tags/treemenu' ),
        'internal_error_string', 'Internal error'|i18n( 'extension/eztags/tags/treemenu' ) ),
    'root', hash(
        'id', 0,
        'parent_id', 0,
        'has_children', true(),
        'keyword', 'Top level tags'|i18n( 'extension/eztags/tags/treemenu' ),
        'url', 'tags/dashboard'|ezurl( no ),
        'icon', ezini( 'Icons', 'Default', 'eztags.ini' )|tag_icon,
        'modified', false() ),
    'load_root', false() ) )|wash}"></ul>
{* tagsstructuremenu.js (plain JavaScript) is not on every admin page; this menu is drawn by the page layout, after
   the head, and the request prints what the head has not loaded yet *}
{ezscript_require( array( 'tagsstructuremenu.js' ) )}
{ezscript( array( 'eztags_tree.js' ) )}
{undef $tree_path}
