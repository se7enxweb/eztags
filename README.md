# eZ Tags LS

eZ Tags LS brings real taxonomy management to Exponential. Tags live in a tree,
can have synonyms and translations, and are attached to content through the
`eztags` datatype, which editors fill with autocomplete, a select list or a tree.
It is for site builders who need categories, keywords or folksonomies that are
easier to manage than the kernel's `ezkeyword` datatype, and for developers who
want to list, filter and link content by tag in templates.

- Package: [`se7enxweb/eztags`](https://packagist.org/packages/se7enxweb/eztags)
- Source and issues: <https://github.com/se7enxweb/eztags>
- License: GNU General Public License v2.0 (or any later version), see [LICENSE](LICENSE)

## Contents

- [What you get](#what-you-get)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Template reference](#template-reference)
- [Permissions](#permissions)
- [Scripts](#scripts)
- [Upgrading](#upgrading)
- [Known limits](#known-limits)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License and credits](#license-and-credits)

## What you get

- **A tag tree** with as many levels as you need, managed in its own admin tab:
  add, edit, move, merge, translate and delete tags, turn a tag into a synonym of
  another, and see which content uses a tag.
- **Synonyms**: "Automobile" can be a synonym of "Car"; filters and fetches can
  include synonyms or not.
- **Multilingual tags**: each tag has translations and a main language, and can
  be marked as always available.
- **The `eztags` datatype** for content classes, with a subtree limit, a maximum
  number of tags, an option to hide the root tag, and three edit views:
  *Default* (autocomplete with suggestions and adding new tags in place),
  *Select* and *Tree*.
- **Tag pages** for visitors at `tags/view/<path>` (for example
  `tags/view/Countries/Croatia`) with the tag and its content.
- **Template fetch functions, attribute filters and operators** to list tags,
  find content by tag and draw a tag cloud.
- **A `taglink` custom tag** for rich text, linking to a tag by its ID.
- **eZ Find integration** (optional): tags are indexed in Solr, and Solr can
  serve the tag cloud, tag suggestions and related tags.
- **A converter** from `ezkeyword` attributes to `eztags` attributes.
- Translations of the interface in many languages (`translations/`).

## Requirements

- Exponential 6.x
- PHP 8.0 or later
- The ezjscore extension (part of Exponential)
- Optional: [Exponential UI](https://github.com/se7enxweb/expui) (`se7enxweb/expui`,
  installed with eZ Tags by Composer). When it is active, the children tables of
  the tags admin use it; without it they fall back to the older tables.
- Optional: [eZ Find](https://github.com/se7enxweb/ezfind), for suggestions,
  related tags and the tag cloud over Solr
- Three database tables (`eztags`, `eztags_attribute_link`, `eztags_keyword`):
  installation step 3

## Installation

### With Composer

From the root of your Exponential installation:

```bash
composer require se7enxweb/eztags
```

The Exponential legacy installer puts the extension in `extension/eztags`.
Continue with step 2 below.

### By hand

1. Download a release from <https://github.com/se7enxweb/eztags/releases> and
   unpack it so that the files are in `extension/eztags/`
   (`extension/eztags/ezinfo.php` must exist).

2. Activate the extension in `settings/override/site.ini.append.php`:

   ```ini
   [ExtensionSettings]
   ActiveExtensions[]=eztags
   ```

   or in the administration under *Setup > Extensions*.

3. Create the tables, with the schema file for any supported database:

   ```bash
   php bin/php/ezsqlinsertschema.php --type=mysql --user=<user> --password=<password> \
       extension/eztags/share/db_schema.dba <database>
   ```

   or with the SQL file of your database (`sql/mysql`, `sql/postgresql`, `sql/sqlite`):

   ```bash
   mysql -u <user> -p <database> < extension/eztags/sql/mysql/schema.sql
   ```

4. Regenerate the autoload array and clear the caches:

   ```bash
   php bin/php/ezpgenerateautoloads.php --extension
   php bin/php/ezcache.php --clear-all
   ```

5. Let visitors see tags: give the Anonymous role the policy *tags / view*
   (and *tags / read* if your site uses the tag tree menu).

6. Optional, faster tree menu: copy or symlink `index_treemenu_tags.php` next to
   `index.php` and add these rewrite rules before the general one:

   ```apache
   RewriteRule tags/treemenu/? index_treemenu_tags.php
   RewriteRule ^index_treemenu_tags\.php - [L]
   ```

7. Optional, eZ Find: add these two fields inside `<fields>` of your Solr
   `schema.xml` (`extension/ezfind/java/solr/ezp-default/conf/schema.xml` for the
   bundled server), restart Solr and re-index:

   ```xml
   <field name="ezf_df_tags" type="lckeyword" indexed="true" stored="true" multiValued="true" termVectors="true"/>
   <field name="ezf_df_tag_ids" type="sint" indexed="true" stored="true" multiValued="true" termVectors="true"/>
   ```

The original notes, with older details, are in [doc/INSTALL.md](doc/INSTALL.md).

## Configuration

Do not edit `extension/eztags/settings/eztags.ini`; put your changes in
`settings/override/eztags.ini.append.php` or in a siteaccess. These are all the
settings, with their defaults:

```ini
[GeneralSettings]
# The URL prefix of tag pages
URLPrefix=tags/view
# enabled shows the older children list in tags/id and tags/dashboard instead of the table
ShowOldStyleChildrenList=disabled
# New tags are created as always available
DefaultAlwaysAvailable=false
# Use Solr for the tag cloud when eZ Find is available
TagCloudOverSolr=enabled
# Number of suggestions of the autocomplete in content edit
MaxResults=24
# start: match the start of a tag; any: match any part of it
AutoCompleteType=start

[TreeMenu]
ToolTips=enabled
# Children shown per tag in the tree, 0 for all
MaxTags=100
AutoopenCurrentTag=enabled
# Remember opened branches in a cookie
MenuPersistence=enabled

[Icons]
# Icons from design/standard/images/tag_icons; IconMap[<tag ID>] applies to that tag and its subtree
Default=empty.png
IconMap[]
#IconMap[1]=people.png

[SearchSettings]
# Results per page of tags/search
SearchLimit=15
# Re-index related content when a tag changes and delayed indexing is off (slow)
ReindexWhenDelayedIndexingDisabled=disabled
# disabled: index the main tag instead of a synonym (useful for facets)
IndexSynonyms=enabled
# Also index the synonyms of a tag (needs IndexSynonyms=enabled)
IncludeSynonyms=disabled
# Also index the parent tags of a tag
IndexParentTags=disabled

[EditSettings]
# The edit views a class attribute can choose
AvailableViews[]
AvailableViews[Default]=Default view
AvailableViews[Select]=Select view
AvailableViews[Tree]=Tree view
```

The extension also registers the datatype (`content.ini`), the `taglink` custom
tag (`content.ini`, `ezoe_attributes.ini`), its ezjscore server functions
`ezjsctags` and `ezjsctagschildren` (`ezjscore.ini`), the attribute filters
(`extendedattributefilter.ini`), the Solr field mapping (`ezfind.ini`) and the
admin tab (`menu.ini`).

## Usage

### 1. Build the tag tree

Open the **Tags** tab in the administration. In the admin4 design it shows a
tags icon (`Icon=tags` in `[Topmenu_eztags]` of `settings/menu.ini.append.php`).
The tab opens the dashboard (`tags/dashboard`) with the tags at the root of the tree
and the tabs *Latest tags*, *Latest content* and *Tags search*.

- *Add child tag* (`tags/add/<parent tag ID>`) adds a tag below another one, or at the root.
- Open a tag (`tags/id/<tag ID>`) to edit it, translate it, add a synonym, move
  it, merge it into another tag, make it a synonym, or delete it.
- *Show all content related to tag* lists the content that uses it.
- *Tags search* (`tags/search`) finds tags by name.

### 2. Add a tags attribute to a class

In *Setup > Classes*, edit a class (for example *Article*), add an attribute of
the type **Tags** and choose:

- *Limit by tags subtree*: editors only pick tags below this tag;
- *Hide root subtree limit tag when editing object*: the subtree's root tag is not offered;
- *Maximum number of allowed tags* (0 for no limit);
- *Edit view*: Default, Select or Tree.

### 3. Tag content

When editors edit an object of that class, they type into the tags field and pick
suggestions, or add new tags in place (if they may add tags there), or choose
from the select list or the tree, depending on the edit view.

### 4. Show tags on the site

The bundled view template of the datatype links each tag to its tag page and adds
the keywords to the page's meta keywords. In your own templates:

```smarty
{foreach $node.data_map.tags.content.tags as $tag}
    <a href={$tag.url|ezurl}>{$tag.keyword|wash}</a>
{/foreach}
```

The attribute content also has `tag_ids`, `keywords`, `keyword_string`,
`meta_keyword_string`, `parent_string` and `tags_count`.

A tag page (`tags/view/<path>`) renders `design:tags/view.tpl` with the variable
`$tag`; override that template in your site design to change it. A tag has,
among others, `keyword`, `url`, `parent`, `children`, `children_count`,
`related_objects`, `related_objects_count`, `synonyms`, `main_tag`,
`is_synonym`, `path`, `icon` and `translations`.

## Template reference

### Fetch functions

```smarty
{* one tag *}
{def $tag = fetch( tags, tag, hash( 'tag_id', 42 ) )}
{def $tag = fetch( tags, tag_by_remote_id, hash( 'remote_id', '1143ae02e8c0995ccd15a1847e886328' ) )}
{def $tag = fetch( tags, tag_by_url, hash( 'url', 'Countries/Croatia' ) )}

{* all tags with a keyword *}
{def $tags = fetch( tags, tags_by_keyword, hash( 'keyword', 'Croatia' ) )}

{* the newest tags, optionally below a tag *}
{def $latest = fetch( tags, latest_tags, hash( 'parent_tag_id', 42, 'limit', 10 ) )}

{* children (list) or the whole subtree (tree) of a tag *}
{def $tags = fetch( tags, tree, hash(
        'parent_tag_id',    42,
        'sort_by',          array( 'modified', 'desc' ),
        'offset',           0,
        'limit',            15,
        'depth',            4,
        'depth_operator',   'le',
        'include_synonyms', true() ) )}

{def $count = fetch( tags, tree_count, hash( 'parent_tag_id', 42, 'depth', 4, 'depth_operator', 'le' ) )}
```

- `list` and `list_count` return the first level below a tag, `tree` and
  `tree_count` the whole subtree; `depth` and `depth_operator` (`lt`, `gt`, `le`,
  `ge`, `eq`) only apply to the tree fetches.
- `sort_by` sorts by `id`, `parent_id`, `main_tag_id`, `keyword`, `depth`,
  `path_string`, `modified` or `remote_id`, with `asc` or `desc`.
- Every fetch takes an optional `language` (a locale like `'cro-HR'` or an array
  of locales). Without it, tags come in the languages of
  `site.ini [RegionalSettings] SiteLanguageList`.

More examples are in [doc/USAGE.md](doc/USAGE.md).

### Content by tag: attribute filters

```smarty
{* content below node 2 that has tag 42 or tag 24 *}
{def $nodes = fetch( content, list, hash(
        'parent_node_id', 2,
        'extended_attribute_filter', hash(
            'id',     'TagsAttributeFilter',
            'params', hash( 'tag_id', array( 42, 24 ) ) ) ) )}
```

| Filter ID | Matches content that has |
| --- | --- |
| `TagsAttributeFilter` | at least one of the tags in `tag_id` |
| `TagsAttributeAndFilter` | all of the tags in `tag_id` |
| `TagsAttributeAndMultipleFilter` | at least one tag of every group: `tag_id` is an array of groups, e.g. `array( array( 1, 2 ), array( 3 ) )` |
| `TagsTreeAttributeFilter` | a tag anywhere below `parent_tag_id` (an ID or an array); `exclude_parent` leaves out the parent tag itself, `type` `'and'` requires every parent |

The tag filters take `include_synonyms` (synonyms count unless you pass
`false()`) and `language`.

### Template operators

```smarty
{* a tag cloud, from Solr when eZ Find is available, else from the database *}
{eztagscloud( hash( 'class_identifier', 'article',
                    'parent_node_id',   2,
                    'offset',           0,
                    'limit',            20,
                    'sort_by',          array( 'count', false() ),
                    'post_sort_by',     'keyword' ) )}

{* "Countries / Croatia": the path of a tag, with "(+n)" after tags that have synonyms *}
{eztags_parent_string( 42 )}

{* the image URL of a tag icon, small (default) or normal *}
<img src="{$tag.icon|tag_icon}" alt="" />

{* the policy limitations of the current user for a module function *}
{def $access = user_limitations( 'tags', 'add' )}
```

`sort_by` of the cloud sorts by `keyword` or `count`, `true()` ascending; the
optional `post_sort_by` (`keyword`, `keyword_reverse`, `count`, `count_reverse`)
sorts the result again. `latest_tags( 10 )` still works but is deprecated: use
`fetch( tags, latest_tags, ... )`.

### Rich text

The custom tag `taglink` (attribute `tag`, the tag ID, plus optional `id`,
`title`, `target` and `class`) links a piece of text to a tag page.

## Permissions

The module `tags` has these policy functions (module.php):

| Function | Views | Use |
| --- | --- | --- |
| `read` | `treemenu` | The tag tree menu. |
| `view` | `view` | Tag pages on the site; give it to Anonymous. |
| `dashboard` | `dashboard` | The admin tab; the tab is only shown with it. |
| `id` | `id`, `list_objects` | A tag's admin page and its content. |
| `search` | `search` | Searching tags in the admin. |
| `add` | `add` | Adding tags; can be limited to a tag subtree (limitation *Tag*). |
| `addsynonym`, `editsynonym`, `deletesynonym` | same names | Managing synonyms. |
| `edit` | `edit`, `movetags`, `translation` | Editing, moving and translating tags. |
| `delete` | `delete`, `deletetags` | Deleting tags. |
| `makesynonym`, `merge` | same names | Turning a tag into a synonym, merging tags. |

Editors who may add new tags while editing content need `add` for the subtree of
the attribute.

## Scripts

Convert an `ezkeyword` attribute to an `eztags` attribute of the same class. The
keywords become tags below `--parent-tag-id`. The script updates the published
versions in place, so clear the caches and re-index afterwards:

```bash
php extension/eztags/bin/php/convertezkeyword.php \
    --from-attr-id=123 --to-attr-id=456 --parent-tag-id=42
```

`update/common/scripts` holds the scripts that older upgrades call for (see
[doc/UPGRADE.md](doc/UPGRADE.md)). eZ Tags has no cron jobs.

## Upgrading

1. Replace `extension/eztags` with the new release (`composer update se7enxweb/eztags`,
   or unpack the archive over it).
2. Read the release notes on <https://github.com/se7enxweb/eztags/releases>.
   Upgrades from versions before 2.2 have database steps, described in
   [doc/UPGRADE.md](doc/UPGRADE.md) (`update/database/<mysql|postgresql>`).
3. Regenerate the autoloads and clear the caches (installation step 4).

## Known limits

- The `eztags` datatype cannot be used for sorting, nor in the plain
  `attribute_filter` of content fetches; use the attribute filters above.
- Suggestions, related tags and the Solr tag cloud need eZ Find with the two
  schema fields of installation step 7.
- With delayed indexing off, editing a tag does not re-index the content that uses
  it unless `ReindexWhenDelayedIndexingDisabled=enabled`.

## Troubleshooting

- **Visitors get "access denied" on tag pages**: give Anonymous *tags / view*.
- **The Tags tab is missing**: the user needs *tags / dashboard*; clear the caches
  after activating the extension.
- **No suggestions in the tags field**: check that ezjscore is active, and for
  Solr suggestions that eZ Find is configured with the two schema fields.
- **The tag cloud is empty with eZ Find**: re-index after adding the schema
  fields, or set `TagCloudOverSolr=disabled` to use the database.
- **New classes or templates are not found**: regenerate the autoloads and clear
  the caches.

## Contributing

Bug reports and pull requests are welcome at <https://github.com/se7enxweb/eztags>.
Please state the Exponential and PHP versions and how to reproduce the problem.

## License and credits

eZ Tags is licensed under the GNU General Public License v2.0 (or any later
version), see [LICENSE](LICENSE).

eZ Tags was created by Netgen for eZ Publish, whose legacy line its creator later
discontinued, with contributions from the eZ Community; Netgen continued it for
newer platforms as the [Netgen Tags Bundle](https://github.com/netgen/TagsBundle).
The history of the early versions is in [doc/CHANGELOG.md](doc/CHANGELOG.md), and
a user manual of that time is in `doc/eztags-user-manual.pdf`. 7x and the
Exponential Foundation maintain eZ Tags for Exponential.
