<?php
/**
 * The code of extension/eztags/modules/tags/list_objects.php, moved into a class (#207 stage 1). The file extension/eztags/modules/tags/list_objects.php is one call to it.
 * Guide: doc/bc/6.0/cli_cronjob_view_abstractions.md
 */
/*
 * The original header of extension/eztags/modules/tags/list_objects.php:
 *
 *  @var eZModule $Module
 */

namespace Exponential\View\Extension\Eztags\Tags
{

class ListObjects extends \Exponential\Runnable\ModuleView
{
    public function run( array $scope )
    {
        // the including function's variables ($Params, $Module, $cli, ...)
        foreach ( array_keys( $scope ) as $__name )
            if ( $__name !== 'this' && $__name !== 'scope' )
                ${$__name} = &$scope[$__name];
        unset( $__name );

        $tagID = (int) $Params['TagID'];
        $locale = (string) $Params['Locale'];
        $locale = !empty( $locale ) ? $locale : false;

        $http = \eZHTTPTool::instance();

        $tag = \eZTagsObject::fetch( $tagID, $locale );
        if ( !$tag instanceof \eZTagsObject )
            return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->handleError( \eZError::KERNEL_NOT_FOUND, 'kernel' ) );

        $viewParameters = array();
        if ( isset( $Params['Offset'] ) )
            $viewParameters['offset'] = (int) $Params['Offset'];

        $tpl = \eZTemplate::factory();

        $tpl->setVariable( 'tag', $tag );
        $tpl->setVariable( 'view_parameters', $viewParameters );

        $Result = array();
        $Result['content'] = $tpl->fetch( 'design:tags/list_objects.tpl' );
        $Result['path']    = \eZTagsObject::generateModuleResultPath( $tag, false );

        return $this->viewResult( isset( $Result ) ? $Result : null, null );
    }
}

}
