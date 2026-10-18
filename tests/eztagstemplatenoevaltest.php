<?php
/**
 * The tags field works under a Content Security Policy without 'unsafe-eval': no script of design/standard/javascript
 * (minified third-party files left out) calls eval() or new Function(), and the templates of jquery.eztags.js render
 * with code generation from strings switched off (tests/javascript/template_no_eval.js, run when Node is installed).
 * Reads the files only, without the kernel.
 *
 * Run directly with:
 *   php tests/eztagstemplatenoevaltest.php
 *
 *  NE-01 - no eval( or new Function( outside comment lines in design/standard/javascript/*.js (minified files left out)
 *  NE-02 - tests/javascript/template_no_eval.js passes (skipped without node)
 */

$failures = 0;
function neCheck( $ok, $message )
{
    global $failures;
    echo ( $ok ? 'PASS' : 'FAIL' ), ": $message\n";
    if ( !$ok )
        $failures++;
}

$root = dirname( __DIR__ );

// NE-01
$bad = array();
foreach ( glob( $root . '/design/standard/javascript/*.js' ) as $file )
{
    if ( substr( $file, -7 ) === '.min.js' )
        continue;
    $source = preg_replace( '#^\s*//.*$#m', '', file_get_contents( $file ) );
    if ( preg_match( '/\beval\s*\(|new\s+Function\s*\(/', $source ) )
        $bad[] = basename( $file );
}
neCheck( !$bad, 'NE-01 no script calls eval() or new Function()' . ( $bad ? ': ' . implode( ', ', $bad ) : '' ) );

// NE-02
$node = trim( (string)shell_exec( 'command -v node 2>/dev/null' ) );
if ( $node === '' )
{
    echo "SKIP: NE-02 node is not installed\n";
}
else
{
    exec( escapeshellarg( $node ) . ' ' . escapeshellarg( $root . '/tests/javascript/template_no_eval.js' ) . ' 2>&1', $output, $code );
    neCheck( $code === 0, 'NE-02 the templates render without eval()' . ( $code === 0 ? '' : ":\n" . implode( "\n", $output ) ) );
}

echo $failures ? "FAIL: $failures\n" : "PASS: all\n";
exit( $failures ? 1 : 0 );
