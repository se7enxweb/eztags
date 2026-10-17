<div class="controlbar">
    <div class="button-left">
        <div class="block">
            {if fetch( user, has_access_to, hash( module, tags, function, editsynonym ) )}
                <form name="editsynonym" id="editsynonym" class="eztags-inline-form" enctype="multipart/form-data" method="post" action={concat( 'tags/editsynonym/', $tag.id )|ezurl}>
                    <input class="defaultbutton" type="submit" name="SubmitButton" value="{"Edit synonym"|i18n( "extension/eztags/tags/view" )}" />
                </form>
            {/if}
            {if fetch( user, has_access_to, hash( module, tags, function, deletesynonym ) )}
                <form name="tagdelete" id="tagdelete" class="eztags-inline-form eztags-inline-form-last" enctype="multipart/form-data" method="post" action={concat( 'tags/deletesynonym/', $tag.id )|ezurl}>
                    <input class="button" type="submit" name="SubmitButton" value="{"Delete synonym"|i18n( "extension/eztags/tags/view" )}" />
                </form>
            {/if}
        </div>
    </div>
    <div class="float-break"></div>
</div>
