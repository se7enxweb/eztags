<?php
/**
 * The code of extension/eztags/modules/tags/id.php, moved into a class (#207 stage 1). The file extension/eztags/modules/tags/id.php is one call to it.
 * Guide: doc/bc/6.0/cli_cronjob_view_abstractions.md
 */

namespace Exponential\View\Extension\Eztags\Tags
{

class Id extends \Exponential\Runnable\ModuleView
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

        if ( isset( $Params['Tab'] ) )
            $viewParameters['tab'] = trim( $Params['Tab'] );

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
        $Result['path']    = \eZTagsObject::generateModuleResultPath( $tag, false );

        return $this->viewResult( isset( $Result ) ? $Result : null, null );
    }
}

}
