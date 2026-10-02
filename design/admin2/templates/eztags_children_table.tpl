{def $parent_tag_id = 0}
{if is_set( $tag )}
    {set $parent_tag_id = $tag.id}
{/if}

{def $item_type = ezpreference( 'admin_eztags_list_limit' )}
{def $number_of_items = min( $item_type, 3 )|choose( 10, 10, 25, 50 )}

<div class="context-block">
    <div class="box-header">
        <h2 class="context-title">
            {if is_set( $tag )}<a href={$tag.depth|gt( 1 )|choose( '/tags/dashboard'|ezurl, concat( '/tags/id/', $tag.parent.id )|ezurl )} title="{'Up one level.'|i18n(  'extension/eztags/tags/view'  )}"><img src={'up-16x16-grey.png'|ezimage} alt="{'Up one level.'|i18n( 'extension/eztags/tags/view' )}" title="{'Up one level.'|i18n( 'extension/eztags/tags/view' )}" /></a>&nbsp;{/if}{'Children tags'|i18n( 'extension/eztags/tags/view' )} (<span id="eztags-children-count">0</span>)
        </h2>
    </div>

    <div class="box-content">
        <div id="action-controls-container">
            <div id="action-controls"></div>
            <div id="action-filter"></div>
            <div id="tpg"></div>
        </div>
        <form id="eztags-children-actions" method="post" enctype="multipart/form-data">
            <div id="eztags-tag-children-table"></div>
        </form>
        <div id="bpg"></div>

        <div id="to-dialog-container"></div>

        {def $languages = fetch( content, prioritized_languages )}
        <script type="text/javascript">
            var languages = {ldelim}{*
                *}{foreach $languages as $language}{*
                    *}'{$language.locale|wash( javascript )}': {ldelim}{*
                        *}name: '{$language.locale_object.intl_language_name|wash( javascript )}',{*
                        *}flag: '{$language.locale|flag_icon}'{*
                    *}{rdelim}{*
                    *}{delimiter}, {/delimiter}{*
                *}{/foreach}{*
            *}{rdelim};

            var i18n = {ldelim}{*
                *}id: "{'ID'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}tag_name: "{'Tag name'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}translations: "{'Tag translations'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}modified: "{'Modified'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}first_page: "&laquo;",{*
                *}last_page: "&raquo;",{*
                *}previous_page: "&lsaquo;",{*
                *}next_page: "&rsaquo;",{*
                *}select_visible: "{'Select all visible'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}select_none: "{'Select none'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}select_toggle: "{'Invert selection'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}select: "{'Select'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}add_child: "{'Add tag'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}add_child_group: "{'Translation'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}more_actions: "{'More actions'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}more_actions_denied: "{'You do not have permissions for any of available actions'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}remove_selected: "{'Remove selected tags'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}move_selected: "{'Move selected tags'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}no_actions: "{'Use the checkboxes to select one or more tags.'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}table_options: "{'Table options'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}close_table_options: "{'Close'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}number_of_items: "{'Number of tags per page'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}loading: "{'Loading...'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}",{*
                *}no_tags: "{'No tags found.'|i18n( 'extension/eztags/tags/view' )|wash( javascript )}"{*
            *}{rdelim};

            var permissions = {ldelim}{*
                *}add: {if fetch( user, has_access_to, hash( module, tags, function, add ) )}true{else}false{/if},{*
                *}edit: {if fetch( user, has_access_to, hash( module, tags, function, edit ) )}true{else}false{/if},{*
                *}remove: {if fetch( user, has_access_to, hash( module, tags, function, delete ) )}true{else}false{/if}{*
            *}{rdelim};

            var urls = {ldelim}{*
                *}data: {concat( '/ezjscore/call/ezjsctagschildren::tagsChildren::', $parent_tag_id, '?ContentType=json&' )|ezurl},{*
                *}view: {'/tags/id/'|ezurl},{*
                *}add: {concat( '/tags/add/', $parent_tag_id )|ezurl},{*
                *}edit: {'/tags/edit/'|ezurl},{*
                *}deletetags: {'/tags/deletetags'|ezurl},{*
                *}movetags: {'/tags/movetags'|ezurl}{*
            *}{rdelim};

            jQuery(document).ready(function($) {ldelim}
                var settings = {ldelim}
                    rowsPerPage: {$number_of_items},
                    languages: languages,
                    permissions: permissions,
                    urls: urls,
                    i18n: i18n
                {rdelim};
                {* The table: Exponential UI's exp::datatable *}
                if ( window.Exp && Exp.$ && Exp.$.fn.expDataTable && $.fn.eZTagsChildrenExp )
                    $('#eztags-tag-children-table').eZTagsChildrenExp( settings );
            {rdelim});
        </script>
        {if ezini( 'ExtensionSettings', 'ActiveExtensions' )|contains( 'expui' )}
            {* the texts Exponential UI's table shows itself (page links, sorting, the filter), translated *}
            {exp_config( hash( 'strings', array( 'Loading...', 'No records found.', 'Data error.', 'Click to sort ascending', 'Click to sort descending',
                                                 'Pages', 'Page %page', 'Page %page of %pages', 'First page', 'Previous page', 'Next page', 'Last page',
                                                 'Table actions', 'Select %name', 'Filter', 'Sorted by %column, ascending', 'Sorted by %column, descending' ) ) )}
        {/if}
    </div>
</div>

{undef}
