<?php /* #?ini charset="utf-8"?

[ExtensionSettings]
DesignExtensions[]=eztags

[JavaScriptSettings]
FrontendJavaScriptList[]=ezjsc::jquery
FrontendJavaScriptList[]=ezjsc::jqueryio
FrontendJavaScriptList[]=ezjsc::jqueryUI
FrontendJavaScriptList[]=jqmodal.js
FrontendJavaScriptList[]=jstree.min.js
FrontendJavaScriptList[]=jquery.eztags.js
FrontendJavaScriptList[]=jquery.eztags.select.js
FrontendJavaScriptList[]=jquery.eztags.tree.js
FrontendJavaScriptList[]=tagsstructuremenu.js

# No BackendJavaScriptList: the admin does not load jQuery on every page. The tag field
# (content/datatype/edit/eztags.tpl, through eztags/edit_scripts.tpl) and the tags pages request the tag scripts
# themselves: admin4 the plain JavaScript ones (eztags.js, tagsstructuremenu.js, eztags_children.js), without jQuery.
# The older admin designs (admin3, adminui, admin) still load jQuery and the plugins on every page.
ClassicBackendJavaScriptList[]=ezjsc::jqueryUI
ClassicBackendJavaScriptList[]=jqmodal.js
ClassicBackendJavaScriptList[]=jstree.min.js
ClassicBackendJavaScriptList[]=jquery.eztags.js
ClassicBackendJavaScriptList[]=jquery.eztags.select.js
ClassicBackendJavaScriptList[]=jquery.eztags.tree.js
ClassicBackendJavaScriptList[]=tagsstructuremenu.js

[StylesheetSettings]
BackendCSSFileList[]=jqmodal.css
BackendCSSFileList[]=tagssuggest.css
BackendCSSFileList[]=contentstructure-tree.css
BackendCSSFileList[]=jstree/eztags/style.css
# The templates' own styles (no inline CSS in the templates)
BackendCSSFileList[]=eztags.css

FrontendCSSFileList[]=jqmodal.css
FrontendCSSFileList[]=tagssuggest.css
FrontendCSSFileList[]=contentstructure-tree.css
FrontendCSSFileList[]=jstree/eztags/style.css
FrontendCSSFileList[]=eztags.css
*/
