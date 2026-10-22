{* The scripts and styles of the tags field (content/datatype/edit/eztags.tpl) in admin4: eztags.js, plain JavaScript
   (no jQuery, jQuery UI, jqModal or jsTree), and tagsstructuremenu.js for the trees of the tag picker. The address of
   ezjscore's server calls goes into a data block, as ezjsc::jqueryio gave it to the jQuery version. *}
{ezscript_require( array( 'eztags.js', 'tagsstructuremenu.js' ) )}
{ezcss_require( array( 'tagssuggest.css', 'contentstructure-tree.css', 'eztags.css' ) )}
{run-once}
<script type="application/json" id="eztags-settings">{json_encode( hash( 'call_url', 'ezjscore/call/'|ezurl( no ) ) )}</script>
{/run-once}
