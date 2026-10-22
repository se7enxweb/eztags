{* The scripts and styles of the tags field (content/datatype/edit/eztags.tpl): jQuery, jQuery UI, jqModal, jsTree and
   the eztags plugins. Required here so that the field also works in a design that loads only what templates ask for
   (eztags' FrontendJavaScriptList is not loaded there); the packer drops what the page has already. admin4 has its
   own version of this template, without jQuery. *}
{ezscript_require( array( 'ezjsc::jquery', 'ezjsc::jqueryio', 'ezjsc::jqueryUI', 'jqmodal.js', 'jstree.min.js', 'jquery.eztags.js',
                          'jquery.eztags.select.js', 'jquery.eztags.tree.js', 'tagsstructuremenu.js' ) )}
{ezcss_require( array( 'jqmodal.css', 'tagssuggest.css', 'contentstructure-tree.css', 'jstree/eztags/style.css' ) )}
