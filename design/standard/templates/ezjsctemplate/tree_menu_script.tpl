{run-once}
{if is_unset( $menu_persistence )}{def $menu_persistence = ezini( 'TreeMenu', 'MenuPersistence', 'eztags.ini' )|eq( 'enabled' )}{/if}
{if is_unset( $current_user )}{def $current_user = fetch( user, current_user )}{/if}
{def $tree_path = array()}
{if is_set( $module_result.path[0].tag_id )}
    {foreach $module_result.path as $element}{set $tree_path = $tree_path|append( concat( '', $element.tag_id ) )}{/foreach}
{/if}

{* The settings of the tag trees in the selection dialogs (TagsStructureMenuParams), read by tagsstructuremenu.js:
   a data block instead of an inline script (Content Security Policy). < and > are written as < and >. *}
{set-block variable=$tree_params_json}{json_encode( hash(
    'path', $tree_path,
    'useCookie', $menu_persistence,
    'perm', concat( $current_user.role_id_list|implode( ',' ), '|' , $current_user.limited_assignment_value_list|implode( ',' ) )|md5,
    'expiry', fetch( content, content_tree_menu_expiry ),
    'modal', true(),
    'context', 'browse',
    'showTips', ezini( 'TreeMenu', 'ToolTips', 'eztags.ini' )|eq( 'enabled' ),
    'autoOpen', false(),
    'tag_id_string', 'Tag ID'|i18n( 'extension/eztags/tags/treemenu' ),
    'parent_tag_id_string', 'Parent tag ID'|i18n( 'extension/eztags/tags/treemenu' ),
    'fold_string', 'Fold/Unfold'|i18n( 'design/admin/contentstructuremenu' ),
    'treemenu_base_url', 'tags/treemenu'|ezurl( no ),
    'not_allowed_string', 'Dynamic tree not allowed for this siteaccess'|i18n( 'extension/eztags/tags/treemenu' ),
    'no_tag_string', 'Tag does not exist'|i18n( 'extension/eztags/tags/treemenu' ),
    'internal_error_string', 'Internal error'|i18n( 'extension/eztags/tags/treemenu' ) ) )}{/set-block}
<script type="application/json" id="eztags-tree-params">{$tree_params_json|explode( '<' )|implode( '<' )|explode( '>' )|implode( '>' )}</script>
{undef $tree_path $tree_params_json}
{/run-once}
