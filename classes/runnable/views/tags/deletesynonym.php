<?php
/**
 * The code of extension/eztags/modules/tags/deletesynonym.php, moved into a class (#207 stage 1). The file extension/eztags/modules/tags/deletesynonym.php is one call to it.
 * Guide: doc/bc/6.0/cli_cronjob_view_abstractions.md
 */
/*
 * The original header of extension/eztags/modules/tags/deletesynonym.php:
 *
 *  @var eZModule $Module
 */

namespace Exponential\View\Extension\Eztags\Tags
{

class Deletesynonym extends \Exponential\Runnable\ModuleView
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

        $tag = \eZTagsObject::fetchWithMainTranslation( $tagID );
        if ( !$tag instanceof \eZTagsObject )
            return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->handleError( \eZError::KERNEL_NOT_FOUND, 'kernel' ) );

        if ( $http->hasPostVariable( 'NoButton' ) )
            return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->redirectToView( 'id', array( $tag->attribute( 'id' ) ) ) );

        if ( $tag->attribute( 'main_tag_id' ) == 0 )
            return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->redirectToView( 'delete', array( $tag->attribute( 'id' ) ) ) );

        if ( $http->hasPostVariable( 'YesButton' ) )
        {
            $db = \eZDB::instance();
            $db->begin();

            $parentTag = $tag->getParent( true );
            if ( $parentTag instanceof \eZTagsObject )
                $parentTag->updateModified();

            $tag->registerSearchObjects();

            if ( $http->hasPostVariable( 'TransferObjectsToMainTag' ) )
            {
                /* Extended Hook */
                if ( class_exists( 'ezpEvent', false ) )
                {
                    \ezpEvent::getInstance()->filter(
                        'tag/transferobjects',
                        array(
                            'tag' => $tag,
                            'newTag' => $tag->getMainTag()
                        )
                    );
                }

                $tag->transferObjectsToAnotherTag( $tag->attribute( 'main_tag_id' ) );
            }

            /* Extended Hook */
            if ( class_exists( 'ezpEvent', false ) )
            {
                \ezpEvent::getInstance()->filter( 'tag/delete', $tag );
            }

            $tag->remove();

            $db->commit();

            return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->redirectToView( 'id', array( $tag->attribute( 'main_tag_id' ) ) ) );
        }

        $tpl = \eZTemplate::factory();

        $tpl->setVariable( 'tag', $tag );

        $Result = array();
        $Result['content']    = $tpl->fetch( 'design:tags/deletesynonym.tpl' );
        $Result['ui_context'] = 'edit';
        $Result['path']       = \eZTagsObject::generateModuleResultPath( false, null,
                                                                        \ezpI18n::tr( 'extension/eztags/tags/edit', 'Delete synonym' ) );

        return $this->viewResult( isset( $Result ) ? $Result : null, null );
    }
}

}
