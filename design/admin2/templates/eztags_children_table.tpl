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
        {* The table's settings, read by eztags_admin.js, which starts the table (jquery.eztagschildren.js): no inline
           script (Content Security Policy) *}
        {def $languages = fetch( content, prioritized_languages )
             $children_languages = hash()}
        {foreach $languages as $language}
            {set $children_languages = $children_languages|merge( hash( $language.locale, hash( 'name', $language.locale_object.intl_language_name, 'flag', $language.locale|flag_icon ) ) )}
        {/foreach}
        <form id="eztags-children-actions" method="post" enctype="multipart/form-data">
            <div id="eztags-tag-children-table" data-eztags-children="{json_encode( hash(
                'rowsPerPage', $number_of_items,
                'languages', $children_languages,
                'permissions', hash(
                    'add', cond( fetch( user, has_access_to, hash( module, tags, function, add ) ), true(), false() ),
                    'edit', cond( fetch( user, has_access_to, hash( module, tags, function, edit ) ), true(), false() ),
                    'remove', cond( fetch( user, has_access_to, hash( module, tags, function, delete ) ), true(), false() ) ),
                'urls', hash(
                    'data', concat( '/ezjscore/call/ezjsctagschildren::tagsChildren::', $parent_tag_id, '?ContentType=json&' )|ezurl( no ),
                    'view', '/tags/id/'|ezurl( no ),
                    'add', concat( '/tags/add/', $parent_tag_id )|ezurl( no ),
                    'edit', '/tags/edit/'|ezurl( no ),
                    'deletetags', '/tags/deletetags'|ezurl( no ),
                    'movetags', '/tags/movetags'|ezurl( no ) ),
                'i18n', hash(
                    'id', 'ID'|i18n( 'extension/eztags/tags/view' ),
                    'tag_name', 'Tag name'|i18n( 'extension/eztags/tags/view' ),
                    'translations', 'Tag translations'|i18n( 'extension/eztags/tags/view' ),
                    'modified', 'Modified'|i18n( 'extension/eztags/tags/view' ),
                    'first_page', '&laquo;',
                    'last_page', '&raquo;',
                    'previous_page', '&lsaquo;',
                    'next_page', '&rsaquo;',
                    'select_visible', 'Select all visible'|i18n( 'extension/eztags/tags/view' ),
                    'select_none', 'Select none'|i18n( 'extension/eztags/tags/view' ),
                    'select_toggle', 'Invert selection'|i18n( 'extension/eztags/tags/view' ),
                    'select', 'Select'|i18n( 'extension/eztags/tags/view' ),
                    'add_child', 'Add tag'|i18n( 'extension/eztags/tags/view' ),
                    'add_child_group', 'Translation'|i18n( 'extension/eztags/tags/view' ),
                    'more_actions', 'More actions'|i18n( 'extension/eztags/tags/view' ),
                    'more_actions_denied', 'You do not have permissions for any of available actions'|i18n( 'extension/eztags/tags/view' ),
                    'remove_selected', 'Remove selected tags'|i18n( 'extension/eztags/tags/view' ),
                    'move_selected', 'Move selected tags'|i18n( 'extension/eztags/tags/view' ),
                    'no_actions', 'Use the checkboxes to select one or more tags.'|i18n( 'extension/eztags/tags/view' ),
                    'table_options', 'Table options'|i18n( 'extension/eztags/tags/view' ),
                    'close_table_options', 'Close'|i18n( 'extension/eztags/tags/view' ),
                    'number_of_items', 'Number of tags per page'|i18n( 'extension/eztags/tags/view' ),
                    'loading', 'Loading...'|i18n( 'extension/eztags/tags/view' ),
                    'no_tags', 'No tags found.'|i18n( 'extension/eztags/tags/view' ) ) ) )|wash}"></div>
        </form>
        <div id="bpg"></div>

        <div id="to-dialog-container"></div>

        {ezscript( array( 'eztags_admin.js' ) )}
        {if ezini( 'ExtensionSettings', 'ActiveExtensions' )|contains( 'expui' )}
            {* the texts Exponential UI's table shows itself (page links, sorting, the filter), translated *}
            {exp_config( hash( 'strings', array( 'Loading...', 'No records found.', 'Data error.', 'Click to sort ascending', 'Click to sort descending',
                                                 'Pages', 'Page %page', 'Page %page of %pages', 'First page', 'Previous page', 'Next page', 'Last page',
                                                 'Table actions', 'Select %name', 'Filter', 'Sorted by %column, ascending', 'Sorted by %column, descending' ) ) )}
        {/if}
    </div>
</div>

{undef}
