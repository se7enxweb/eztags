<?php
/**
 * The code of extension/eztags/modules/tags/delete.php, moved into a class (#207 stage 1). The file extension/eztags/modules/tags/delete.php is one call to it.
 * Guide: doc/bc/6.0/cli_cronjob_view_abstractions.md
 */

namespace Exponential\View\Extension\Eztags\Tags
{

class Delete extends \Exponential\Runnable\ModuleView
{
    public function run( array $scope )
    {
        // the including function's variables ($Params, $Module, $cli, ...)
        foreach ( array_keys( $scope ) as $__name )
            if ( $__name !== 'this' && $__name !== 'scope' )
                ${$__name} = &$scope[$__name];
        unset( $__name );

        $http = \eZHTTPTool::instance();

        $tagID = (int) $Params['TagID'];
        $deleteAllowed = true;
        $error = '';

        $tag = \eZTagsObject::fetchWithMainTranslation( $tagID );
        if ( !$tag instanceof \eZTagsObject )
            return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->handleError( \eZError::KERNEL_NOT_FOUND, 'kernel' ) );

        if ( $http->hasPostVariable( 'NoButton' ) )
            return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->redirectToView( 'id', array( $tag->attribute( 'id' ) ) ) );

        if ( $tag->attribute( 'main_tag_id' ) != 0 )
            return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->redirectToView( 'delete', array( $tag->attribute( 'main_tag_id' ) ) ) );

        if ( $tag->getSubTreeLimitationsCount() > 0 )
        {
            $deleteAllowed = false;
            $error = \ezpI18n::tr( 'extension/eztags/errors', 'Tag cannot be modified because it is being used as subtree limitation in one or more class attributes.' );
        }

        if ( $http->hasPostVariable( 'YesButton' ) && $deleteAllowed )
        {
            $db = \eZDB::instance();
            $db->begin();

            $parentTag = $tag->getParent( true );
            if ( $parentTag instanceof \eZTagsObject )
                $parentTag->updateModified();

            /* Extended Hook */
            if ( class_exists( 'ezpEvent', false ) )
                \ezpEvent::getInstance()->filter( 'tag/delete', $tag );

            $tag->recursivelyDeleteTag();

            $db->commit();

            if ( $parentTag instanceof \eZTagsObject )
                return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->redirectToView( 'id', array( $parentTag->attribute( 'id' ) ) ) );

            return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->redirectToView( 'dashboard', array() ) );
        }

        $tpl = \eZTemplate::factory();

        $tpl->setVariable( 'tag', $tag );
        $tpl->setVariable( 'delete_allowed', $deleteAllowed );
        $tpl->setVariable( 'error', $error );

        $Result = array();
        $Result['content']    = $tpl->fetch( 'design:tags/delete.tpl' );
        $Result['ui_context'] = 'edit';
        $Result['path']       = \eZTagsObject::generateModuleResultPath( false, null,
                                                                        \ezpI18n::tr( 'extension/eztags/tags/edit', 'Delete tag' ) );

        return $this->viewResult( isset( $Result ) ? $Result : null, null );
    }
}

}
