{* The tag picker in admin4: a modal <dialog> (eztags.js, EzTags.Dialog) instead of the jqModal window of the other
   designs, with the same trees (ezjsctemplate/tree_menu.tpl) and the same id, so the tags field and the Select
   parent buttons find it as before. The close button keeps the class jqmClose, which closes the picker. *}
{if is_unset( $attribute_id )}{def $attribute_id = '0'}{/if}
{include uri='design:ezjsctemplate/tree_menu_script.tpl' menu_persistence=false()}
{ezscript_require( array( 'eztags.js', 'tagsstructuremenu.js' ) )}

<dialog class="eztags-dialog parent-selector-tree" id="parent-selector-tree-{$attribute_id}" aria-labelledby="parent-selector-tree-{$attribute_id}-title">
    <div class="eztags-dialog-header">
        <h2 class="eztags-dialog-title" id="parent-selector-tree-{$attribute_id}-title">{'Select tag'|i18n( 'extension/eztags/tags/treemenu' )}</h2>
        <button type="button" class="eztags-dialog-close jqmClose" aria-label="{'Close'|i18n( 'extension/eztags/tags/view' )|wash}" title="{'Close'|i18n( 'extension/eztags/tags/view' )|wash}">&times;</button>
    </div>
    <div class="eztags-dialog-body">
        <div id="content-tree-{$attribute_id}">
            <div class="contentstructure">
            {if and( is_set( $root_tag ), $root_tag|is_array )}
                {foreach $root_tag as $key => $value}
                    {include uri='design:ezjsctemplate/tree_menu.tpl' attribute_id=concat( $attribute_id, '_', $key ) root_tag=$value}
                    {delimiter}<hr />{/delimiter}
                {/foreach}
            {else}
                {include uri='design:ezjsctemplate/tree_menu.tpl' attribute_id=$attribute_id root_tag=cond( is_set( $root_tag ), $root_tag, false() )}
            {/if}
            </div>
        </div>
    </div>
</dialog>
