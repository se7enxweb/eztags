{* The size of each tag (100 to 200 percent, from eZTagsCloud) is a class in steps of 10 percent, eztags-cloud-size-0
   to eztags-cloud-size-10 in eztags.css, not a style="" attribute: a Content-Security-Policy without 'unsafe-inline'
   for styles drops those. The exact value stays in data-font-size. *}
{foreach $tag_cloud as $tag_cloud_item}
    <a href={$tag_cloud_item.tag.url|ezurl} class="eztags-cloud-item eztags-cloud-size-{$tag_cloud_item.font_size|sub( 100 )|div( 10 )|round|max( 0 )|min( 10 )}" data-font-size="{$tag_cloud_item.font_size|wash}" title="{"%count objects tagged with '%keyword'"|i18n( 'extension/eztags/tagcloud', '', hash( '%count', $tag_cloud_item.count, '%keyword', $tag_cloud_item.keyword|wash ) )}">{$tag_cloud_item.keyword|wash}</a>
{/foreach}
