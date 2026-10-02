(function( $ ) {
    /*
     * The children of a tag (tags/view, tags/dashboard) as a table on Exponential UI's $.fn.expDataTable
     * (exp::datatable): the requests (ezjsctagschildren::tagsChildren with offset, limit, sortby, sortdirection and
     * filter), the forms posted (tags/add, tags/deletetags, tags/movetags with SelectedIDArray[]), the preference
     * (admin_eztags_list_limit) and the ids of the controls.
     */
    var initExpTable = function( base, settings ) {
        var X = window.Exp.$, i18n = settings.i18n, form = function() { return X( 'form[id=eztags-children-actions]' ); };
        var selectedCount = function() { return X( '#eztags-tag-children-table input[name="SelectedIDArray[]"]:checked' ).length; };

        var tagMenu = function( row ) {
            var translationArray = [];
            X.each( row.translations || [], function( i, e ) {
                translationArray.push( { locale: e, name: settings.languages[e].name } );
            });
            var a = X( '<a></a>' ).attr( { href: '#', role: 'button', 'aria-label': X( '<textarea></textarea>' ).html( row.keyword ).val(), 'aria-haspopup': 'menu' } )
                .append( '<div class="crankfield"></div>' );
            a.on( 'click', function( e ) {
                e.preventDefault();
                var ev = e.originalEvent || e;
                if ( !ev.pageX && !ev.pageY ) {
                    var r = this.getBoundingClientRect();
                    ev = { pageX: r.left + window.pageXOffset, pageY: r.bottom + window.pageYOffset };
                }
                window.ezpopmenu_showTopLevel( ev, 'TagMenu', { '%tagID%': row.id, '%languages%': translationArray }, row.keyword, -1, -1 );
            });
            return a;
        };

        var tagTranslations = function( row ) {
            var html = '';
            X.each( row.translations || [], function( i, e ) {
                if ( settings.permissions.edit )
                    html += '<a href="' + settings.urls.edit + '/' + row.id + '/' + e + '">';
                html += '<img src="' + settings.languages[e].flag + '" width="18" height="12" style="margin-right: 4px;" alt="' + settings.languages[e].name + '" title="' + settings.languages[e].name + '"/>';
                if ( settings.permissions.edit )
                    html += '</a>';
            });
            return html;
        };

        var tagName = function( row ) {
            return '<a href="' + settings.urls.view + '/' + row.id + '">' + row.keyword + '</a>';
        };

        var languageItems = [];
        for ( var l in settings.languages ) {
            if ( settings.languages.hasOwnProperty( l ) )
                languageItems.push( { label: settings.languages[l].name, value: l, html: true } );
        }

        var moreActions = [];
        if ( settings.permissions.remove )
            moreActions.push( { id: 'ezopt-menu-remove', label: i18n.remove_selected, value: 0, html: true } );
        if ( settings.permissions.edit )
            moreActions.push( { id: 'ezopt-menu-move', label: i18n.move_selected, value: 1, html: true } );
        if ( moreActions.length == 0 )
            moreActions.push( { label: i18n.more_actions_denied, disabled: true, html: true } );

        var $table = X( base );
        $table.expDataTable({
            columns: [
                { key: 'checkbox', label: '' },
                { key: 'crank', label: '', render: tagMenu },
                { key: 'id', label: i18n.id, sortable: true },
                { key: 'keyword', label: i18n.tag_name, sortable: true, render: tagName },
                { key: 'translations', label: i18n.translations, render: tagTranslations },
                { key: 'modified', label: i18n.modified, sortable: true, format: 'date', dateFormat: '%d.%m.%Y %H:%M' }
            ],
            rowKey: 'id',
            source: {
                url: function( s ) {
                    return settings.urls.data + '&offset=' + s.offset + '&limit=' + s.limit +
                           '&sortby=' + s.sort.key + '&sortdirection=' + ( s.sort.dir === 'desc' ? 'desc' : 'asc' ) +
                           ( s.filter ? '&filter=' + encodeURIComponent( s.filter ) : '' );
                },
                parse: function( json ) {
                    var c = ( json && json.content ) || {};
                    return {
                        rows: X.map( c.data || [], function( r ) {
                            return { id: Number( r.id ), keyword: String( r.keyword ), translations: r.translations,
                                     modified: r.modified != null ? new Date( r.modified * 1000 ) : null };
                        }),
                        total: Number( c.count ) || 0,
                        offset: typeof c.offset === 'number' ? c.offset : undefined
                    };
                }
            },
            onLoad: function( res ) { X( '#eztags-children-count' ).html( this.total ); },
            sort: { key: 'keyword', dir: 'asc' },
            paging: {
                limit: settings.rowsPerPage,
                containers: [ '#bpg' ],
                compact: [ '#tpg' ],
                labels: { first: i18n.first_page, last: i18n.last_page, prev: i18n.previous_page, next: i18n.next_page }
            },
            select: { key: 'checkbox', name: 'SelectedIDArray[]', className: '', value: function( row ) { return row.id; },
                      label: function( row ) { return X( '<textarea></textarea>' ).html( row.keyword ).val(); }, header: false, ranges: false },
            filter: { container: '#action-filter', delay: 400,
                      attrs: { id: 'action-filter-input', 'class': 'action-filter-input', size: 40 } },
            empty: i18n.no_tags,
            loading: i18n.loading,
            actionsContainer: '#action-controls',
            actions: [
                { id: 'ezbtn-items', label: i18n.select, html: true, menu: [
                    { id: 'ezopt-menu-check', label: i18n.select_visible, html: true, onSelect: function() { $table.find( 'input[type=checkbox]' ).prop( 'checked', true ); this.syncAll(); this.emitSelect(); } },
                    { id: 'ezopt-menu-uncheck', label: i18n.select_none, html: true, onSelect: function() { $table.find( 'input[type=checkbox]' ).prop( 'checked', false ); this.syncAll(); this.emitSelect(); } },
                    { id: 'ezopt-menu-toggle', label: i18n.select_toggle, html: true, onSelect: function() { $table.find( 'input[type=checkbox]' ).each( function() { this.checked = !this.checked; } ); this.syncAll(); this.emitSelect(); } }
                ] },
                { id: 'ezbtn-new', label: i18n.add_child, html: true, disabled: !settings.permissions.add,
                  menu: [ { group: i18n.add_child_group, items: languageItems } ],
                  onSelect: function( item ) { form().prop( 'action', settings.urls.add + '/' + item.value ).trigger( 'submit' ); } },
                { id: 'ezbtn-more', label: i18n.more_actions, html: true,
                  menu: function() {
                      return selectedCount() == 0 ? [ { label: i18n.no_actions, disabled: true, html: true } ] : moreActions;
                  },
                  onSelect: function( item ) {
                      if ( selectedCount() == 0 )
                          return;
                      if ( item.value == 0 && settings.permissions.remove )
                          form().prop( 'action', settings.urls.deletetags ).trigger( 'submit' );
                      else if ( item.value == 1 && settings.permissions.edit )
                          form().prop( 'action', settings.urls.movetags ).trigger( 'submit' );
                  } }
            ],
            tableOptions: {
                button: { id: 'ezbtn-options', label: i18n.table_options, html: true },
                container: '#to-dialog-container',
                title: i18n.table_options,
                close: i18n.close_table_options,
                limits: {
                    legend: i18n.number_of_items,
                    items: [ { id: 1, count: 10 }, { id: 2, count: 25 }, { id: 3, count: 50 } ],
                    onSelect: function( item ) {
                        window.Exp.prefs.set( 'admin_eztags_list_limit', item.id ).catch( function( e ) {
                            if ( window.console ) window.console.warn( 'eztags: admin_eztags_list_limit was not saved', e && e.message );
                        });
                    }
                },
                columns: false
            }
        });
        return $table.data( 'expDataTable' );
    };

    $.fn.eZTagsChildrenExp = function( settings ) {
        settings = $.extend( { rowsPerPage: 10 }, settings );
        if ( this[0] )
            initExpTable( this[0], settings );
        return this;
    };

    // The name templates used before; the same table
    $.fn.eZTagsChildren = $.fn.eZTagsChildrenExp;
})(jQuery);
