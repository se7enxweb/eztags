<?php
/**
 * Every image the eztags scripts write into the page has a text alternative: alt (empty for the language flag next to
 * the tag's name, which repeats nothing a screen reader needs) or a title. Without one axe reports image-alt, a
 * serious finding, on every edit form with a tags field. Reads the files only, without the kernel.
 *
 * Run directly with:
 *   php tests/eztagsscriptimagealttest.php
 *
 *  IA-01 - no <img in design/standard/javascript/*.js (minified files left out) without an alt or a title
 *  IA-02 - the suggested, selected and autocomplete items of jquery.eztags.js carry alt="" on their flag
 */

$failures = 0;
function iaCheck( $ok, $message )
{
    global $failures;
    echo ( $ok ? 'PASS' : 'FAIL' ), ": $message\n";
    if ( !$ok )
        $failures++;
}

$root = dirname( __DIR__ );

// IA-01: an <img up to the end of its tag in the script source (the tag may be built over several string pieces)
$bad = array();
foreach ( glob( $root . '/design/standard/javascript/*.js' ) as $file )
{
    if ( substr( $file, -7 ) === '.min.js' )
        continue;
    $source = file_get_contents( $file );
    if ( preg_match_all( '/<img\b.*?(?<!%)>/s', $source, $m ) )
        foreach ( $m[0] as $tag )
            if ( !preg_match( '/\s(alt|title)=/', $tag ) )
                $bad[] = basename( $file ) . ': ' . preg_replace( '/\s+/', ' ', substr( $tag, 0, 80 ) );
}
iaCheck( !$bad, 'IA-01 every image of the scripts has an alt or a title' . ( $bad ? ': ' . implode( '; ', $bad ) : '' ) );

// IA-02
$source = (string)@file_get_contents( $root . '/design/standard/javascript/jquery.eztags.js' );
iaCheck( preg_match_all( '/<img src="<%=tag\.flagSrc %>" alt="" \/>/', $source ) === 3, 'IA-02 the three tag item templates give the flag alt=""' );

echo $failures ? "FAIL: $failures\n" : "PASS: all\n";
exit( $failures ? 1 : 0 );
