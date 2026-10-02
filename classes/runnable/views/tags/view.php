<?php
/**
 * The code of extension/eztags/modules/tags/view.php, moved into a class (#207 stage 1). The file extension/eztags/modules/tags/view.php is one call to it.
 * Guide: doc/bc/6.0/cli_cronjob_view_abstractions.md
 */
/*
 * The original header of extension/eztags/modules/tags/view.php:
 *
 *  @var eZModule $Module
 */

namespace Exponential\View\Extension\Eztags\Tags
{

class View extends \Exponential\Runnable\ModuleView
{
    public function run( array $scope )
    {
        // the including function's variables ($Params, $Module, $cli, ...)
        foreach ( array_keys( $scope ) as $__name )
            if ( $__name !== 'this' && $__name !== 'scope' )
                ${$__name} = &$scope[$__name];
        unset( $__name );

        $http = \eZHTTPTool::instance();
        $keywordArray = $Params['Parameters'];
        if ( !is_array( $keywordArray ) || empty( $keywordArray ) )
            return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->handleError( \eZError::KERNEL_NOT_FOUND, 'kernel' ) );

        $tag = \eZTagsObject::fetchByUrl( $keywordArray );
        if ( !$tag instanceof \eZTagsObject )
            return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->handleError( \eZError::KERNEL_NOT_FOUND, 'kernel' ) );

        $viewParameters = array();
        if ( isset( $Params['Offset'] ) )
            $viewParameters['offset'] = (int) $Params['Offset'];

        $tpl = \eZTemplate::factory();

        $tpl->setVariable( 'tag', $tag );
        $tpl->setVariable( 'view_parameters', $viewParameters );
        $tpl->setVariable( 'show_reindex_message', false );

        if ( $http->hasSessionVariable( 'eZTagsShowReindexMessage' ) )
        {
            $http->removeSessionVariable( 'eZTagsShowReindexMessage' );
            $tpl->setVariable( 'show_reindex_message', true );
        }

        $Result = array();
        $Result['content'] = $tpl->fetch( 'design:tags/view.tpl' );
        $Result['path']    = \eZTagsObject::generateModuleResultPath( $tag, true, false, false );

        return $this->viewResult( isset( $Result ) ? $Result : null, null );
    }
}

}
