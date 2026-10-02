<?php
/**
 * The code of extension/eztags/modules/tags/translation.php, moved into a class (#207 stage 1). The file extension/eztags/modules/tags/translation.php is one call to it.
 * Guide: doc/bc/6.0/cli_cronjob_view_abstractions.md
 */
/*
 * The original header of extension/eztags/modules/tags/translation.php:
 *
 *  @var eZModule $Module
 */

namespace Exponential\View\Extension\Eztags\Tags
{

class Translation extends \Exponential\Runnable\ModuleView
{
    public function run( array $scope )
    {
        // the including function's variables ($Params, $Module, $cli, ...)
        foreach ( array_keys( $scope ) as $__name )
            if ( $__name !== 'this' && $__name !== 'scope' )
                ${$__name} = &$scope[$__name];
        unset( $__name );

        $http = \eZHTTPTool::instance();

        $tagID = (int) $http->postVariable( 'TagID', 0 );

        $tag = \eZTagsObject::fetchWithMainTranslation( $tagID );
        if ( !$tag instanceof \eZTagsObject )
            return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->handleError( \eZError::KERNEL_NOT_FOUND, 'kernel' ) );

        if ( $http->hasPostVariable( 'RemoveTranslationButton' ) )
        {
            if ( $http->hasPostVariable( 'Locale' ) && is_array( $http->postVariable( 'Locale' ) ) )
            {
                $mainTranslation = $tag->getMainTranslation();

                $db = \eZDB::instance();
                $db->begin();

                foreach ( $http->postVariable( 'Locale' ) as $locale )
                {
                    $translation = $tag->translationByLocale( $locale );
                    if ( $translation instanceof \eZTagsKeyword && $translation->attribute( 'locale' ) != $mainTranslation->attribute( 'locale' ) )
                        $translation->remove();
                }

                $tag->updateLanguageMask();
                $tag->registerSearchObjects();
                $tag->updateModified();

                $db->commit();
            }
        }
        else if ( $http->hasPostVariable( 'UpdateMainTranslationButton' ) )
        {
            if ( $http->hasPostVariable( 'MainLocale' ) )
            {
                $db = \eZDB::instance();
                $db->begin();

                $tag->updateMainTranslation( $http->postVariable( 'MainLocale' ) );
                $tag->registerSearchObjects();
                $tag->updateModified();

                $db->commit();
            }
        }
        else if ( $http->hasPostVariable( 'UpdateAlwaysAvailableButton' ) )
        {
            $db = \eZDB::instance();
            $db->begin();

            $alwaysAvailable = $http->hasPostVariable( 'AlwaysAvailable' );
            $tag->setAlwaysAvailable( $alwaysAvailable );
            $tag->registerSearchObjects();

            $db->commit();
        }

        return $this->viewResult( isset( $Result ) ? $Result : null,  $Module->redirectToView( 'id', array( $tag->attribute( 'id' ) ) ) );

        return $this->viewResult( isset( $Result ) ? $Result : null, null );
    }
}

}
