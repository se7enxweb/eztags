{*
  The left menu of the tags module in admin4 (and the designs built on it, such as admin4l): the tag tree, then admin4's
  own width switch (parts/left_width_control.tpl), the same markup, script and preference as every kernel module's menu.
  admin4 draws the column's drag handle in its page layout, so this menu has none.
*}
{if and( is_set( $module_result.ui_context ), $module_result.ui_context|eq( 'navigation' ), fetch( user, has_access_to, hash( module, tags, function, read ) ) )}
    <div id="content-tree">
        <div class="box-header">
            <h4>{'Tags structure'|i18n( 'extension/eztags/tags/treemenu' )}</h4>
        </div>

        <div class="box-content">
            <div id="contentstructure">
                {include uri='design:tagsstructuremenu/tags_structure_menu_dynamic.tpl' menu_persistence=true()}
            </div>
        </div>
    </div>

    {include uri='design:parts/left_width_control.tpl'}
{/if}
