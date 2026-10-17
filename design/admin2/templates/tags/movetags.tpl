<div class="context-block tags-edit">
    <div class="box-header">
        <h1 class="context-title">{'Move tags'|i18n( 'extension/eztags/tags/edit' )}</h1>
        <div class="header-mainline"></div>
    </div>

    {if $error|count}
        <div class="message-error">
            <h2>{$error|wash}</h2>
        </div>
    {/if}

    <div class="box-content">
        <div class="block">
            <p>{'Are you sure you want to move selected tags?'|i18n( 'extension/eztags/tags/edit' )}</p>
        </div>

        <div class="block">
            <table class="list" cellspacing="0">
                <tr>
                    <th colspan="2">{'Tag'|i18n( 'extension/eztags/tags/edit' )}</th>
                    <th>{'Related objects count'|i18n( 'extension/eztags/tags/edit' )}</th>
                    <th>{'Children count'|i18n( 'extension/eztags/tags/edit' )}</th>
                </tr>

                {foreach $tags as $tag sequence array( 'bglight', 'bgdark' ) as $sequence}
                    <tr class="{$sequence}">
                        <td class="tight"><img class="transparent-png-icon" src="{$tag.icon|tag_icon}" alt="{$tag.keyword|wash}" /></td>
                        <td>{eztags_parent_string( $tag.id )|wash}</td>
                        <td>{$tag.related_objects_count|wash}</td>
                        <td>{$tag.children_count|wash}</td>
                    </tr>
                {/foreach}
            </table>
        </div>

        <form name="tageditform" id="tageditform" enctype="multipart/form-data" method="post" action={'/tags/movetags'|ezurl}>
            <div class="block tag-edit-parent">
                {if ezhttp_hasvariable( 'TagEditParentID', 'post' )}
                    {def $parent_tag_id = ezhttp( 'TagEditParentID', 'post' )}
                {else}
                    {def $parent_tag_id = $tags.0.parent_id}
                {/if}

                <label>{'Parent tag'|i18n( 'extension/eztags/tags/edit' )}</label>
                <input id="eztags_parent_id_0" type="hidden" name="TagEditParentID" value="{$parent_tag_id}" />
                <input id="hide_tag_id_0" type="hidden" name="TagHideID" value="{ezhttp( 'eZTagsMoveIDArray', 'session' )|implode( ';' )}" />
                <span id="eztags_parent_keyword_0">{eztags_parent_string( $parent_tag_id )|wash}</span>
                <input class="button" type="button" name="SelectParentButton" id="eztags-parent-selector-button-0" value="{'Select parent'|i18n( 'extension/eztags/tags/edit' )}" />
            </div>

            <div class="controlbar">
                <div class="block">
                    <input class="defaultbutton" type="submit" name="SaveButton" value="{'Save'|i18n( 'extension/eztags/tags/edit' )}" />
                    <input class="button" type="submit" name="DiscardButton" value="{'Discard'|i18n( 'extension/eztags/tags/edit' )}" data-eztags-discard-confirm="{'Are you sure you want to discard changes?'|i18n( 'extension/eztags/tags/edit' )|wash}" />
                    <input type="hidden" name="DiscardConfirm" value="1" />
                </div>
            </div>
        </form>
    </div>
</div>

{include uri='design:ezjsctemplate/modal_dialog.tpl'}

{ezscript( array( 'eztags_admin.js' ) )}

{undef $parent_tag_id}
