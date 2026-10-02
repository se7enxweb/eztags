<?php
/**
 * The code of extension/eztags/modules/tags/deletetags.php, moved into a class (#207 stage 1). The file extension/eztags/modules/tags/deletetags.php is one call to it.
 * Guide: doc/bc/6.0/cli_cronjob_view_abstractions.md
 */
/*
 * The original header of extension/eztags/modules/tags/deletetags.php:
 *
 *  @var eZModule $Module
 */

namespace Exponential\View\Extension\Eztags\Tags
{

class Deletetags extends \Exponential\Runnable\ModuleView
{
    public function run( array $scope )
    {
        // the including function's variables ($Params, $Module, $cli, ...)
        foreach ( array_keys( $scope ) as $__name )
            if ( $__name !== 'this' && $__name !== 'scope' )
                ${$__name} = &$scope[$__name];
        unset( $__name );

        $http = \eZHTTPTool::instance();

        $tagIDs = $http->sessionVariable( 'eZTagsDeleteIDArray', $http->postVariable( 'SelectedIDArray' ), array() );
        if ( !is_array( $tagIDs ) || empty( $tagIDs ) )
            return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->handleError( \eZError::KERNEL_NOT_FOUND, 'kernel' ) );

        /** @var eZTagsObject[] $tagsList */
        $tagsList = \eZTagsObject::fetchList( array( 'id' => array( $tagIDs ) ), null, null, true );
        if ( !is_array( $tagsList ) || empty( $tagsList ) )
            return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->handleError( \eZError::KERNEL_NOT_FOUND, 'kernel' ) );

        $http->setSessionVariable( 'eZTagsDeleteIDArray', $tagIDs );

        $parentTagID = (int) $tagsList[0]->attribute( 'parent_id' );

        if ( $http->hasPostVariable( 'NoButton' ) )
        {
            $http->removeSessionVariable( 'eZTagsDeleteIDArray' );

            if ( $parentTagID > 0 )
                return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->redirectToView( 'id', array( $parentTagID ) ) );

            return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->redirectToView( 'dashboard', array() ) );
        }
        else if ( $http->hasPostVariable( 'YesButton' ) )
        {
            $db = \eZDB::instance();

            foreach ( $tagsList as $tag )
            {
                if ( $tag->getSubTreeLimitationsCount() > 0 || $tag->attribute( 'main_tag_id' ) != 0 )
                    continue;

                $db->begin();

                $parentTag = $tag->getParent( true );
                if ( $parentTag instanceof \eZTagsObject )
                    $parentTag->updateModified();

                /* Extended Hook */
                if ( class_exists( 'ezpEvent', false ) )
                    \ezpEvent::getInstance()->filter( 'tag/delete', $tag );

                $tag->recursivelyDeleteTag();

                $db->commit();
            }

            $http->removeSessionVariable( 'eZTagsDeleteIDArray' );

            if ( $parentTagID > 0 )
                return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->redirectToView( 'id', array( $parentTagID ) ) );

            return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->redirectToView( 'dashboard', array() ) );
        }

        $tpl = \eZTemplate::factory();
        $tpl->setVariable( 'tags', $tagsList );

        $Result = array();
        $Result['content']    = $tpl->fetch( 'design:tags/deletetags.tpl' );
        $Result['ui_context'] = 'edit';
        $Result['path']       = \eZTagsObject::generateModuleResultPath( false, null,
                                                                        \ezpI18n::tr( 'extension/eztags/tags/edit', 'Delete tags' ) );

        return $this->viewResult( isset( $Result ) ? $Result : null, null );
    }
}

}
