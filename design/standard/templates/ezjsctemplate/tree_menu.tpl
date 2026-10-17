{* A tag tree of a selection dialog, drawn by tagsstructuremenu.js from data-eztags-tree with the settings of
   tree_menu_script.tpl (eztags_tree.js starts it); no inline script (Content Security Policy). As before, a tree whose
   treeMenu_<attribute id> already exists on the page is not drawn again ('once'). *}
{if $root_tag}
    {def $tree_root = hash(
        'id', $root_tag.id,
        'parent_id', $root_tag.parent_id,
        'has_children', $root_tag.children_count|gt( 0 ),
        'synonyms_count', $root_tag.synonyms_count,
        'keyword', $root_tag.keyword,
        'url', concat( 'tags/id/', $root_tag.id )|ezurl( no ),
        'icon', $root_tag.icon|tag_icon,
        'modified', $root_tag.modified )}
{else}
    {def $tree_root = hash(
        'id', 0,
        'parent_id', 0,
        'has_children', true(),
        'keyword', 'Top level tags'|i18n( 'extension/eztags/tags/treemenu' ),
        'url', 'tags/dashboard'|ezurl( no ),
        'icon', ezini( 'Icons', 'Default', 'eztags.ini' )|tag_icon,
        'modified', false() )}
{/if}
<ul class="content_tree_menu" data-eztags-tree="{json_encode( hash( 'attribute_id', concat( '', $attribute_id ), 'root', $tree_root, 'load_root', cond( $root_tag, true(), false() ), 'once', true() ) )|wash}"></ul>
{ezscript( array( 'eztags_tree.js' ) )}
{undef $tree_root}
