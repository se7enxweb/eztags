(function( $ ) {
    var makeRequest = function( dataTable, dataSource ) {
        if ( dataTable != null && dataSource != null ) {
            var oState = dataTable.getState();

            if ( oState.pagination )
                oState.pagination.recordOffset = 0;

            dataTable.filterString = $( '#action-filter-input' ).val();

            var request = dataTable.get( 'generateRequest' )( oState, dataTable );

            dataSource.sendRequest(request, {
                success: dataTable.onDataReturnSetRows,
                failure: dataTable.onDataReturnSetRows,
                argument: oState,
                scope: dataTable
            });
        }
    };

    var buildRequest = function( oState, oSelf ) {
        var pagingString = '';
        if ( oState.pagination ) {
            pagingString = '&offset=' + oState.pagination.recordOffset + '&limit=' + oState.pagination.rowsPerPage;
        }

        var sortByString = '';
        if ( oState.sortedBy ) {
            sortByString = '&sortby=' + oState.sortedBy.key;
            var sortDirection = oState.sortedBy.dir === YAHOO.widget.DataTable.CLASS_DESC ? 'desc' : 'asc';
            sortByString += '&sortdirection=' + sortDirection;
        }

        var filterString = '';
        if ( oSelf.filterString ) {
            filterString = '&filter=' + encodeURIComponent( oSelf.filterString );
        }

        return pagingString + sortByString + filterString;
    };

    var initDataTable = function( base, settings ) {

        /* Custom display formatter definition */

        var tagMenu = function( cell, record, column, data ) {
            var translationArray = [];

            $(record.getData( 'translations' )).each(function( i, e ) {
                translationArray.push({
                    locale: e,
                    name: settings.languages[e].name
                });
            });

            var a = new YAHOO.util.Element( document.createElement( 'a' ) );
            a.on('click', function(e) {
                ezpopmenu_showTopLevel(e, 'TagMenu', {
                    '%tagID%': record.getData( 'id' ),
                    '%languages%': translationArray
                },
                record.getData( 'keyword' ), -1, -1 );
            });

            var div = new YAHOO.util.Element( document.createElement( 'div' ) );
            div.addClass( 'crankfield' );
            div.appendTo( a );

            a.appendTo( cell );
        };

        var tagCheckbox = function( cell, record, column, data ) {
            cell.innerHTML = '<input type="checkbox" name="SelectedIDArray[]" value="' + record.getData( 'id' ) + '" />';
        };

        var tagTranslations = function( cell, record, column, data ) {
            var html = '';

            $(data).each(function(i, e) {
                if( settings.permissions.edit )
                    html += '<a href="' + settings.urls.edit + '/' + record.getData( 'id' ) + '/' + e + '">';

                html += '<img src="' + settings.languages[e].flag + '" width="18" height="12" style="margin-right: 4px;" alt="' + settings.languages[e].name + '" title="' + settings.languages[e].name + '"/>';

                if( settings.permissions.edit )
                    html += '</a>'
            });

            cell.innerHTML = html;
        };

        var tagName = function( cell, record, column, data ) {
            cell.innerHTML = '<a href="' + settings.urls.view + '/' + record.getData( 'id' ) + '">' + record.getData( 'keyword' ) + '</a>';
        };

        /* Paginator definition */

        var dataTablePaginator = new YAHOO.widget.Paginator({
            rowsPerPage: settings.rowsPerPage,
            containers: [ 'bpg' ],
            firstPageLinkLabel: settings.i18n.first_page,
            lastPageLinkLabel: settings.i18n.last_page,
            previousPageLinkLabel: settings.i18n.previous_page,
            nextPageLinkLabel: settings.i18n.next_page,
            template: '<div class="yui-pg-backward">{FirstPageLink}{PreviousPageLink}</div>{PageLinks}<div class="yui-pg-forward">{NextPageLink}{LastPageLink}</div>'
        });

        dataTablePaginator.subscribe('render', function () {
            var prevPageLink, nextPageLink, prevPageLinkNode, nextPageLinkNode, tpg;

            tpg = YAHOO.util.Dom.get( 'tpg' );

            // Instantiate the UI Component
            prevPageLink = new YAHOO.widget.Paginator.ui.PreviousPageLink( this );
            nextPageLink = new YAHOO.widget.Paginator.ui.NextPageLink( this );

            // render the UI Component
            prevPageLinkNode = prevPageLink.render( tpg );
            nextPageLinkNode = nextPageLink.render( tpg );

            // Append the generated node into the container
            tpg.appendChild( prevPageLinkNode );
            tpg.appendChild( nextPageLinkNode );
        });

        /* Selection button */

        var selectItemsButtonAction = function( type, args, item ) {
            $( '#eztags-tag-children-table' ).find( ':checkbox' ).prop( 'checked', item.value );
        };

        var selectItemsButtonInvert = function( type, args, item ) {
            var checks = $( '#eztags-tag-children-table' ).find( ':checkbox' ).each(function(){
                this.checked = !this.checked;
            });
        };

        var selectItemsButtonActions = [
            { text: settings.i18n.select_visible, id: 'ezopt-menu-check', value: 1, onclick: { fn: selectItemsButtonAction } },
            { text: settings.i18n.select_none, id: 'ezopt-menu-uncheck', value: 0, onclick: { fn: selectItemsButtonAction } },
            { text: settings.i18n.select_toggle, id: 'ezopt-menu-toggle', onclick: { fn: selectItemsButtonInvert } }
        ];

        var selectItemsButton = new YAHOO.widget.Button({
            type: 'menu',
            id: 'ezbtn-items',
            label: settings.i18n.select,
            name: 'select-items-button',
            menu: selectItemsButtonActions,
            container: 'action-controls'
        });

        /* Create new tag button */

        var createNewButtonAction = function( type, args ) {
            $('form[id=eztags-children-actions]').prop( 'action', settings.urls.add + '/' + args[1].value ).trigger( 'submit' );
        };

        var createNewButtonOptions = [];
        for ( var l in languages ) {
            if ( languages.hasOwnProperty( l ) ) {
                createNewButtonOptions.push( { text: languages[l].name, value: l } );
            }
        }

        var createNewButton = new YAHOO.widget.Button({
            type: 'menu',
            id: 'ezbtn-new',
            label: settings.i18n.add_child,
            name: 'create-new-button',
            menu: createNewButtonOptions,
            container: 'action-controls'
        });

        if ( !settings.permissions.add ) {
            createNewButton.set( 'disabled', true );
        }

        var createNewButtonMenu  = createNewButton.getMenu();
        createNewButtonMenu.cfg.setProperty( 'scrollincrement', 5 );
        createNewButtonMenu.subscribe( 'click', createNewButtonAction );
        createNewButtonMenu.setItemGroupTitle( settings.i18n.add_child_group, 0 );

        /* More actions button */

        var moreActionsButtonAction = function( type, args, item ) {
            if ( $( '#eztags-tag-children-table input[name=\"SelectedIDArray[]\"]:checked' ).length == 0 )
                return;

            if ( item.value == 0 && settings.permissions.remove ) {
                $( 'form[id=eztags-children-actions]' ).prop( 'action', settings.urls.deletetags ).trigger( 'submit' );
            }
            else if ( item.value == 1 && settings.permissions.edit ) {
                $( 'form[id=eztags-children-actions]' ).prop( 'action', settings.urls.movetags ).trigger( 'submit' );
            }
        };

        var moreActionsButtonActions = [];
        if ( settings.permissions.remove ) {
            moreActionsButtonActions.push({
                text: settings.i18n.remove_selected, id: 'ezopt-menu-remove',
                value: 0,
                onclick: { fn: moreActionsButtonAction },
                disabled: false
            });
        }

        if ( settings.permissions.edit ) {
            moreActionsButtonActions.push({
                text: settings.i18n.move_selected, id: 'ezopt-menu-move',
                value: 1,
                onclick: { fn: moreActionsButtonAction },
                disabled: false
            });
        }

        if ( moreActionsButtonActions.length == 0 ) {
            moreActionsButtonActions.push({
                text: settings.i18n.more_actions_denied,
                disabled: true
            });
        }

        var noMoreActionsButtonActions = [
            { text: settings.i18n.no_actions, disabled: true }
        ];

        var moreActionsButton = new YAHOO.widget.Button({
            type: 'menu',
            id: 'ezbtn-more',
            label: settings.i18n.more_actions,
            name: 'more-actions-button',
            menu: noMoreActionsButtonActions,
            container: 'action-controls'
        });

        //  enable 'more actions' when rows are checked
        moreActionsButton.getMenu().subscribe('beforeShow', function () {
            if ( $( '#eztags-tag-children-table input[name=\"SelectedIDArray[]\"]:checked' ).length == 0 ) {
                this.clearContent();
                this.addItems( noMoreActionsButtonActions );
                this.render();
            } else {
                this.clearContent();
                this.addItems( moreActionsButtonActions );
                this.render();
            }
        });

        /* Table options button & dialog */

        // Shows dialog, creating one when necessary
        var colLayoutHasChanged = true;
        var showTableOptionsDialog = function( e ) {
            YAHOO.util.Event.stopEvent( e );

            if ( colLayoutHasChanged ) {
                // Populate Dialog
                var tableOptionsHTML = '<fieldset>';
                tableOptionsHTML += '<legend>' + settings.i18n.number_of_items + '</legend><div class="block">';

                var rowsPerPageDefinition = [
                    { id: 1, count: 10 },
                    { id: 2, count: 25 },
                    { id: 3, count: 50 }
                ];

                for ( var i = 0, l = rowsPerPageDefinition.length; i < l ; i++ ) {
                    var rowDefinition = rowsPerPageDefinition[i];
                    tableOptionsHTML += '<div class="table-options-row"><span class="table-options-key">'+ rowDefinition.count + '</span>';
                    tableOptionsHTML += '<span class="table-options-value"><input id="table-option-row-btn-' + rowDefinition.id + '" type="radio" name="TableOptionValue" value="' + rowDefinition.count + '"' + ( settings.rowsPerPage == rowDefinition.count ? ' checked="checked"' : '' ) + ' /></span></div>';

                    YAHOO.util.Event.on('table-option-row-btn-' + rowDefinition.id, 'click', function( e, a ) {
                        dataTablePaginator.setRowsPerPage( a.count );
                        $.ez.setPreference( 'admin_eztags_list_limit', a.id );
                    }, rowDefinition);
                }

                tableOptionsHTML += '</div></fieldset>';

                tableOptionsDialog.setBody( tableOptionsHTML );
                colLayoutHasChanged = false;
            }

            tableOptionsDialog.show();
        };

        var hideTableOptionsDialog = function( e ) {
            this.hide();
        };

        var tableOptionsButton = new YAHOO.widget.Button({
            label: settings.i18n.table_options,
            id: 'ezbtn-options',
            container: 'action-controls',
            onclick: { fn: showTableOptionsDialog, obj: this, scope: true }
        });

        var tableOptionsDialog = new YAHOO.widget.SimpleDialog('to-dialog-container', {
            width: '25em',
            visible: false,
            modal: true,
            buttons: [{
                text: settings.i18n.close_table_options,
                handler: function( e ){
                    this.hide();
                }
            }],
            fixedcenter: 'contained',
            constrainToViewport: true
        });

        var escKeyListener = new YAHOO.util.KeyListener(
            document,
            { keys: 27 },
            { fn: tableOptionsDialog.hide, scope: tableOptionsDialog, correctScope: true }
        );

        tableOptionsDialog.cfg.queueProperty( 'keylisteners', escKeyListener );
        tableOptionsDialog.setHeader( settings.i18n.table_options );
        tableOptionsDialog.render();

        /* Filter box */

        var filterTextBox = new YAHOO.util.Element( document.createElement( 'input' ) );
        filterTextBox.set( 'type', 'text' );
        filterTextBox.set( 'size', '40' );
        filterTextBox.set( 'id', 'action-filter-input' );
        filterTextBox.addClass( 'action-filter-input' );

        var filterContainer = new YAHOO.util.Element( document.getElementById( 'action-filter' ) );
        filterContainer.appendChild( filterTextBox );

        // stupid IE
        var eventToBind = navigator.userAgent.match( /MSIE/ ) ? 'keydown' : 'input';
        var filterTimeoutHandler;

        $( '#action-filter-input' ).on(eventToBind, function(){
            if ( filterTimeoutHandler )
                clearTimeout( filterTimeoutHandler );

            filterTimeoutHandler = setTimeout( function() {
                makeRequest( dataTable, dataSource );
            }, 400 );
        });

        /* Data source definition */

        var timeStampYuiParser = function ( oData ) {
            if ( oData != null )
                return new Date( oData * 1000 );
            else
                return null;
        };

        var dataSourceFields = [
            { key: 'id', parser: 'number' },
            { key: 'keyword', parser: 'string' },
            { key: 'modified', parser: timeStampYuiParser },
            { key: 'translations' }
        ];

        var dataSource = new YAHOO.util.XHRDataSource(settings.urls.data, {
            responseType: YAHOO.util.DataSource.TYPE_JSON,
            responseSchema: {
                resultsList: 'content.data',
                fields: dataSourceFields,
                metaFields: {
                    totalRecords: 'content.count',
                    recordOffset: 'content.offset',
                    filterString: 'content.filter'
                }
            }
        });

        /* Data table definition */

        var dataTableColumns = [
            { key: 'checkbox', label:'', sortable: false, resizeable: false, formatter: tagCheckbox },
            { key: 'crank', label:'', sortable: false, resizeable: false, formatter: tagMenu },
            { key: 'id', label: settings.i18n.id, sortable: true, resizeable: true, formatter: 'text' },
            { key: 'keyword', label: settings.i18n.tag_name, sortable: true, resizeable: true, formatter: tagName },
            { key: 'translations', label: settings.i18n.translations, sortable: false, resizeable: true, formatter: tagTranslations },
            { key: 'modified', label: settings.i18n.modified, sortable: true, resizeable: true, formatter: 'date' }
        ];

        var dataTable = new YAHOO.widget.DataTable(base, dataTableColumns, dataSource, {
            dateOptions: { format: '%d.%m.%Y %H:%M' },
            generateRequest: buildRequest,
            dynamicData: true,
            initialLoad: false,
            sortedBy: {
                key: 'keyword',
                dir: YAHOO.widget.DataTable.CLASS_ASC
            },
            paginator: dataTablePaginator,
            MSG_LOADING: settings.i18n.loading,
            MSG_EMPTY: settings.i18n.no_tags
        });

        dataTable.handleDataReturnPayload = function( oRequest, oResponse, oPayload ) {
            oPayload.totalRecords = oResponse.meta.totalRecords;
            oPayload.pagination.recordOffset = oResponse.meta.recordOffset;
            dataTable.filterString = oResponse.meta.filterString;
            $( '#eztags-children-count' ).html( oResponse.meta.totalRecords );
            return oPayload;
        };

        makeRequest( dataTable, dataSource );
    };

    $.fn.eZTagsChildren = function( settings ) {
        var defaults = {
            rowsPerPage: 10
        };
        settings = $.extend( defaults, settings );
        var base = this[0];

        var yuiLoader = new YAHOO.util.YUILoader({
            base: settings.urls.yui2,
            loadOptional: true
        });
        yuiLoader.require( [ 'connection', 'datasource', 'datatable', 'paginator', 'dragdrop', 'button', 'container' ] );
        yuiLoader.onSuccess = function() {
            initDataTable( base, settings );
        };
        yuiLoader.insert( [], 'js' );

        return this;
    };

    /*
     * The same table on Exponential UI's $.fn.expDataTable (exp::datatable), without YUI. The template starts it
     * when Exponential UI is there (window.Exp && Exp.$.fn.expDataTable), and eZTagsChildren (YUI 2) otherwise.
     * Same requests (ezjsctagschildren::tagsChildren with offset, limit, sortby, sortdirection and filter), same
     * forms posted (tags/add, tags/deletetags, tags/movetags with SelectedIDArray[]), same preference
     * (admin_eztags_list_limit), same ids for the controls.
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
})(jQuery);
