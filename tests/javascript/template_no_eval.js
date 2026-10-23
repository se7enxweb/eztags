/*
 * Renders the templates of jquery.eztags.js and jquery.eztags.select.js with the CSP-safe renderer (no eval(), no
 * new Function()) and compares the result with the expected markup; eztags.js (admin4, no jQuery) has to render the
 * same templates alike. Runs in Node without a browser:
 *   node tests/javascript/template_no_eval.js
 * Prints one PASS or FAIL line per check and exits non-zero on a failure.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var root = path.join(__dirname, '..', '..');
var source = fs.readFileSync(path.join(root, 'design/standard/javascript/jquery.eztags.js'), 'utf8');

// Turn eval and new Function off in the sandbox, as a Content Security Policy without 'unsafe-eval' does.
var context = vm.createContext({}, { codeGeneration: { strings: false, wasm: false } });
var warnings = [];
var $ = function(arg){ return typeof arg === 'function' ? undefined : { each: function(){ return this; } }; };
$.fn = {};
// jQuery 4 (ezjscore) has no $.trim, $.isArray, $.type ...: the stub leaves them out, so a call to one fails here too
$.extend = function(target){
  for (var i = 1; i < arguments.length; i++) {
    var src = arguments[i];
    if (src && typeof src === 'object' || typeof src === 'function') {
      for (var k in src) { if (Object.prototype.hasOwnProperty.call(src, k)) { target[k] = src[k]; } }
    }
  }
  return target;
};
$.map = function(a, f){ return a.map(f); };
$.inArray = function(v, a){ return a.indexOf(v); };
context.$ = $;
context.window = { console: { warn: function(m){ warnings.push(m); } } };
vm.runInContext(source, context, { filename: 'jquery.eztags.js' });

var failures = 0;
var check = function(ok, message){
  console.log((ok ? 'PASS' : 'FAIL') + ': ' + message);
  if (!ok) { failures++; }
};

var EzTags = $.EzTags;
var self = { tplCache: {} };
var tpl = function(str, data){ return EzTags.Base.prototype.tpl.call(self, str, data); };
var defaults = EzTags.Base.defaults.templates;
var tr = { removeTag: 'Remove tag', clickAddThisTag: 'Click to add' };

check(typeof EzTags.Base.prototype.tpl === 'function', 'T-01 the plugin loads with code generation from strings disabled');

check(tpl(defaults.selectedItem.join(''), { tag: { cid: 7, flagSrc: '/f.gif', name: 'Bike' }, tr: tr }) ===
      '<li data-cid="7"><img src="/f.gif" alt="" />Bike<a href="#" class="js-tags-remove" title="Remove tag">&times;</a></li>',
      'T-02 selectedItem renders the path expressions');

var auto = defaults.autocompleteItem.join('');
check(tpl(auto, { tag: { cid: 1, main_tag_id: '0', flagSrc: '/f.gif', name: 'A', parent_name: 'P' }, tr: tr })
        .indexOf('class="js-autocomplete-item resultItem"') !== -1,
      'T-03 the synonym choice prints nothing for a main tag');
check(tpl(auto, { tag: { cid: 1, main_tag_id: '12', flagSrc: '/f.gif', name: 'A', parent_name: 'P' }, tr: tr })
        .indexOf('class="js-autocomplete-item resultItem itemSynonym"') !== -1,
      'T-04 the synonym choice prints " itemSynonym" for a synonym');

check(tpl('<option value="<%= tag.id %>" <%= selected %> ><%= tag.name %></option>', { tag: { id: 3, name: 'X' }, selected: null }) ===
      '<option value="3"  >X</option>', 'T-05 null prints nothing (the select builder option)');
check(tpl('<b><%= missing.deep.path %></b>', { tr: tr }) === '<b></b>', 'T-06 a missing path prints nothing');
check(tpl("a\n<%= tr.removeTag %>\tb", { tr: tr }) === 'a Remove tag b', 'T-07 line breaks and tabs become spaces, as before');
check(tpl('<%= x == 5 ? "five" : "other" %>|<%= x != 5 ? "a" : \'b\' %>', { x: '5' }) === 'five|b',
      'T-08 == and != compare loosely, single and double quotes');

warnings.length = 0;
check(tpl('<% alert(1) %><%= alert(1) %>ok', {}) === 'ok' && warnings.length === 2,
      'T-09 code blocks and other expressions print nothing and are reported on the console');

var skeleton = tpl(defaults.skeleton.join(''), { tr: { addNew: 'Add new', findTag: 'Find' } });
check(skeleton.indexOf('<%') === -1 && skeleton.indexOf('value="Add new"') !== -1, 'T-10 the skeleton renders completely');

var selectSource = fs.readFileSync(path.join(root, 'design/standard/javascript/jquery.eztags.select.js'), 'utf8');
check(!/\beval\s*\(|new\s+Function\s*\(/.test((source + selectSource).replace(/^\s*\/\/.*$/mg, '')), 'T-11 neither script uses eval() or new Function()');

var treeSource = fs.readFileSync(path.join(root, 'design/standard/javascript/jquery.eztags.tree.js'), 'utf8');
check(/'core'\s*:\s*\{[^}]*'worker'\s*:\s*false/.test(treeSource), 'T-12 the tag tree turns the jsTree blob: worker off (no worker-src blob: needed)');

// eztags.js, the plain JavaScript version admin4 loads: the same templates, rendered the same way, also with code
// generation from strings disabled
var plainSource = fs.readFileSync(path.join(root, 'design/standard/javascript/eztags.js'), 'utf8');
var plainContext = vm.createContext({}, { codeGeneration: { strings: false, wasm: false } });
plainContext.window = plainContext;
plainContext.console = { warn: function(m){ warnings.push(m); } };
plainContext.document = { readyState: 'complete', getElementById: function(){ return null; }, querySelectorAll: function(){ return []; },
                          addEventListener: function(){} };
plainContext.setTimeout = function(){};
vm.runInContext(plainSource, plainContext, { filename: 'eztags.js' });
var Plain = plainContext.EzTags;
check(Plain && typeof Plain.Base.prototype.tpl === 'function', 'T-13 eztags.js loads with code generation from strings disabled');
var plainTpl = function(str, data){ return Plain.Base.prototype.tpl.call({ tplCache: {} }, str, data); };
var same = true;
['skeleton', 'suggestedItem', 'selectedItem', 'autocompleteItem'].forEach(function(name){
  var t1 = defaults[name].join(''), t2 = Plain.Base.defaults.templates[name].join('');
  var data = { tag: { cid: 'c9', main_tag_id: '4', flagSrc: '/f.gif', name: 'N', parent_name: 'P' }, tr: { addNew: 'Add', findTag: 'Find', removeTag: 'R', clickAddThisTag: 'C' } };
  if (t1 !== t2 || tpl(t1, data) !== plainTpl(t2, data)) { same = false; }
});
check(same, 'T-14 eztags.js has the templates of jquery.eztags.js and renders them alike');
check(!/\beval\s*\(|new\s+Function\s*\(/.test(plainSource.replace(/^\s*\/\/.*$/mg, '')), 'T-15 eztags.js uses neither eval() nor new Function()');

process.exit(failures ? 1 : 0);
