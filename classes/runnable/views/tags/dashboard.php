<?php
/**
 * The code of extension/eztags/modules/tags/dashboard.php, moved into a class (#207 stage 1). The file extension/eztags/modules/tags/dashboard.php is one call to it.
 * Guide: doc/bc/6.0/cli_cronjob_view_abstractions.md
 */

namespace Exponential\View\Extension\Eztags\Tags
{

class Dashboard extends \Exponential\Runnable\ModuleView
{
    public function run( array $scope )
    {
        // the including function's variables ($Params, $Module, $cli, ...)
        foreach ( array_keys( $scope ) as $__name )
            if ( $__name !== 'this' && $__name !== 'scope' )
                ${$__name} = &$scope[$__name];
        unset( $__name );

        $http = \eZHTTPTool::instance();

        $viewParameters = array();
        if ( isset( $Params['Offset'] ) )
            $viewParameters['offset'] = (int) $Params['Offset'];

        if ( isset( $Params['Tab'] ) )
            $viewParameters['tab'] = trim( $Params['Tab'] );

        $tpl = \eZTemplate::factory();

        $tpl->setVariable( 'view_parameters', $viewParameters );
        $tpl->setVariable( 'show_reindex_message', false );

        if ( $http->hasSessionVariable( 'eZTagsShowReindexMessage' ) )
        {
            $http->removeSessionVariable( 'eZTagsShowReindexMessage' );
            $tpl->setVariable( 'show_reindex_message', true );
        }

        $Result = array();
        $Result['content'] = $tpl->fetch( 'design:tags/dashboard.tpl' );
        $Result['path']    = \eZTagsObject::generateModuleResultPath( false, null,
                                                                     \ezpI18n::tr( 'extension/eztags/tags/view', 'Tags dashboard' ) );

        return $this->viewResult( isset( $Result ) ? $Result : null, null );
    }
}

}
