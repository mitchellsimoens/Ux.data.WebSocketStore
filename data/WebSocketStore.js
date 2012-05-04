Ext.define('Ux.data.WebSocketStore', {
    extend : 'Ext.data.Store',

    config : {
        /**
         * @cfg {String} socketId The id of the socket to be
         */
        socketId           : true,
        /**
         * @cfg {Object} actionEvents The events to be used for CRUD and registration/deregistration
         */
        actionEvents       : {
            create     : 'create',
            read       : 'read',
            update     : 'update',
            destroy    : 'destroy',
            batch      : 'batch',
            register   : 'register',
            unregister : 'unregister'
        },
        /**
         * @cfg {Boolean} verbose Turn on some console logging
         */
        verbose            : false,
        /**
         * @cfg {Object} extraParams Parameters to send with each request
         */
        extraParams        : true,
        /**
         * @cfg {Boolean} runQueueOnAction true to execute the queue after an action has finished
         */
        runQueueOnAction   : true,
        /**
         * queue is the queue of requests. This should not be changed.
         * @private
         */
        queue              : [],
        /**
         * @cfg {Boolean} batch true to send entire queue in one request. Defaults to false.
         */
        batch              : false,
        /**
         * @cfg {Socket} socket The socket connection to use.
         */
        socket             : null,
        /**
         * @property {Boolean} registered Whether the store is registered with the backend.
         * You don't always need to do this.
         */
        registered         : false,
        /**
         * @cfg {Boolean} autoLoad true to load the store automatically upon instantiation
         */
        autoLoad           : false,
        /**
         * @cfg {String} socketIdParam The parameter name to send the socketId
         */
        socketIdParam      : 'socketId',
        /**
         * @cfg {String} paramsParam The parameter name to send the params in each request
         */
        paramsParam        : 'params',
        /**
         * @cfg {String} idProperty The property to be used to get the id
         */
        idProperty         : 'id',
        /**
         * @cfg {String} rootProperty The property to be used to get the data, this is required
         */
        rootProperty       : 'data',
        /**
         * @cfg {String} successProperty The property to be used to get whether the request was successful
         */
        successProperty    : 'success',
        /**
         * @cfg {String} totalProperty The property to be used to get the total number of records.
         */
        totalProperty      : 'total',
        /**
         * @private totalCount The total count of records returned from the server
         */
        totalCount         : 0,
        /**
         * @cfg {String} messageProperty The property to be used to get an error message
         */
        messageProperty    : 'message',
        /**
         * @cfg {String} clientIdParam The param to use to pass the clientId to and from the server.
         * This is important as it is what maps the phantom record id when the server returns the
         * new record data.
         */
        clientIdParam      : 'clientId',
        /**
         * @cfg {Boolean} enablePagingParams true to allow paging params to be sent in each request.
         */
        enablePagingParams : true,
        /**
         * @cfg {Number} pageSize The size of a single page.
         */
        pageSize : 25,
        /**
         * @cfg {String} startParam The param name to send as the start paging parameter
         */
        startParam         : 'start',
        /**
         * @cfg {String} pageParam The param name to send as the page number
         */
        pageParam          : 'page',
        /**
         * @cfg {String} limitParam The param name to send as the number of records to return
         */
        limitParam         : 'limit',
        /**
         * @cfg {String} groupParam The param name to send as the group to group remotely
         */
        groupParam         : 'group',
        grouper            : null,
        //sorting
        /**
         * @cfg {Boolean} simpleSortMode To enable simple sorting, set this to true to have a flat sorting
         */
        simpleSortMode     : false,
        /**
         * @cfg {String} sortParam The param name to send as the sort parameter
         */
        sortParam          : 'sort',
        /**
         * @cfg {String} directionParam The param name to send as the direction of sort
         */
        directionParam     : 'dir',
        //filtering
        /**
         * @cfg {String} filterParam The param to send as the filter for remote filtering.
         */
        filterParam        : 'filter',
        filters            : []
    },

    constructor : function (config) {
        if (!config) {
            config = {};
        }

        var me = this;

        /**
         * These methods will be used as the websocket event listeners
         * so we must ensure the scope is of this store.
         */
        me.onRegister   = Ext.Function.bind(me.onRegister,   me);
        me.onUnRegister = Ext.Function.bind(me.onUnRegister, me);
        me.onBatch      = Ext.Function.bind(me.onBatch,      me);
        me.onCreate     = Ext.Function.bind(me.onCreate,     me);
        me.onRead       = Ext.Function.bind(me.onRead,       me);
        me.onUpdate     = Ext.Function.bind(me.onUpdate,     me);
        me.onDestroy    = Ext.Function.bind(me.onDestroy,    me);

        /**
         * Ext JS 4 needs to execute this, ST2 does it auto
         */
        if (Ext.name === 'Ext') {
            me.initConfig(config);
        }

        me.callParent([config]);
    },

    /**
     * This destroy method is very important to call as it will clean
     * up the events from the socket. You should call this when you want
     * to destroy the store like when the view is destroyed.
     */
    destroy : function () {
        var me = this;

        /**
         * Remove all events from the socket as to not leak
         */
        me.removeSocketEvents(null, true);

        me.callParent();
    },

    /**
     * This applyProxy method ensures that we aren't going to
     * use a proxy, this store does everything internal.
     */
    applyProxy : function () {
        /**
         * We do need to make sure that we sync removed records
         */
        this.setSyncRemovedRecords(true);

        return null;
    },

    /**
     * Each store must have a socketId, this will create one
     * if one is not provided. Suggested is to return
     * the socket id from the server.
     */
    applySocketId : function (id) {
        if (!Ext.isString(id)) {
            id = Ext.id();
        }

        return id;
    },

    /**
     * An Object of parameters to send on all requests
     */
    applyExtraParams : function(params) {
        if (typeof params !== 'object') {
            params = {};
        }

        return params;
    },

    /**
     * This sets the socketId as a parameter so the server
     * can know what socket the request came from.
     */
    updateSocketId : function(id) {
        var me            = this,
            extraParams   = me.getExtraParams(),
            socketIdParam = me.getSocketIdParam();

        if (typeof extraParams !== 'object') {
            extraParams = {};
        }

        extraParams[socketIdParam] = id;

        me.setExtraParams(extraParams);
    },

    /**
     * Sets the events on the socket and sends the regsiter event.
     * This is optional.
     */
    updateSocket : function (socket, oldSocket) {
        var me     = this,
            events = me.getActionEvents(),
            id     = me.getSocketId();

        if (oldSocket && oldSocket.emit && events.unregister) {
            oldSocket.emit(events.unregister, id);
        }

        if (socket.on && events.register) {
            socket.on(events.register, me.onRegister);

            socket.emit(events.register, id);
        }
    },

    /**
     * This adds the required events to the socket.
     * Will be making this more dynamic TODO
     * @private
     */
    initSocketEvents : function (socket) {
        var me     = this,
            events = me.getActionEvents();

        if (!socket) {
            socket = me.getSocket();
        }

        if (!socket) {
            return;
        }

        this.removeSocketEvents(socket);

        events.register   && socket.on(events.register,   me.onRegister);
        events.unregister && socket.on(events.unregister, me.onUnRegister);
        events.batch      && socket.on(events.batch,      me.onBatch);
        events.create     && socket.on(events.create,     me.onCreate);
        events.read       && socket.on(events.read,       me.onRead);
        events.update     && socket.on(events.update,     me.onUpdate);
        events.destroy    && socket.on(events.destroy,    me.onDestroy);
    },

    /**
     * This will remove events from the socket and optionally
     * set the socket to null.
     * This needs to be dynamic TODO
     * @private
     * @param socket
     * @param destroy
     */
    removeSocketEvents : function (socket, destroy) {
        var events = this.getActionEvents();

        if (!socket) {
            socket = this.getSocket();
        }

        if (!socket) {
            return;
        }

        events.register   && socket.removeAllListeners(events.register);
        events.unregister && socket.removeAllListeners(events.unregister);
        events.batch      && socket.removeAllListeners(events.batch);
        events.create     && createsocket.removeAllListeners(events.create);
        events.read       && socket.removeAllListeners(events.read);
        events.update     && socket.removeAllListeners(events.update);
        events.destroy    && socket.removeAllListeners(events.destroy);

        if (destroy) {
            this.setSocket(null);
        }
    },

    /**
     * Execute a read event
     * @param {Object} options This can override the default parameters
     */
    load : function (options) {
        var me      = this,
            verbose = me.getVerbose(),
            socket  = me.getSocket(),
            events  = me.getActionEvents(),
            params  = me.getParams(options);

        if (!me.getRegistered()) {
            verbose && console.warn('Cannot load when not registered');
            return;
        }

        verbose && console.warn('Loading...');

        //TODO handle paging, filter, sort etc
        socket.emit(events.read, params);
    },

    /**
     * Sets up the queue and runs the queue.
     * @param {Boolean} batch true to run the queue as a batch, defaults to the batch config.
     */
    sync : function(batch) {
        var me               = this,
            verbose          = me.getVerbose(),
            createdRecords   = me.getNewRecords(),
            updatedRecords   = me.getUpdatedRecords(),
            destroyedRecords = me.getRemovedRecords(),
            clientIdParam    = me.getClientIdParam(),
            paramsParam      = me.getParamsParam(),
            params           = me.getParams(),
            queue            = [],
            i                = 0,
            record, data;

        /**
         * Get the new records, clientIdParam is used here, very important
         */
        for (; i < createdRecords.length; i++) {
            record = createdRecords[i];
            data   = record.getData();

            data.action         = 'create';
            data[clientIdParam] = record.getId() || record.internalId;
            data[paramsParam]   = params;

            queue.push(data);
        }

        i = 0;

        /**
         * Get the updated records, clientIdParam is used here, very important
         */
        for (; i < updatedRecords.length; i++) {
            record = updatedRecords[i];
            data   = record.getData();
            data   = record.getData();

            data.action         = 'update';
            data[clientIdParam] = record.getId() || record.internalId;
            data[paramsParam]   = params;

            queue.push(data);
        }

        i = 0;

        /**
         * Get the removed records, clientIdParam is used here, very important
         */
        for (; i < destroyedRecords.length; i++) {
            record = destroyedRecords[i];
            data   = record.getData();

            data.action         = 'destroy';
            data[clientIdParam] = record.getId() || record.internalId;
            data[paramsParam]   = params;

            queue.push(data);
        }

        verbose && console.warn('Queue', queue);

        me.setQueue(queue);
        me.runQueue(batch);
    },

    /**
     * Gets all the paging, grouping, filters params.
     * @param {Object} options You can override some params by passing them in
     */
    getParams : function (options) {
        if (!options) {
            options = {};
        }

        var me             = this,
            verbose        = me.getVerbose(),
            params         = me.getExtraParams(),
            //grouping
            groupParam     = me.getGroupParam(),
            grouper        = me.getGrouper(),
            //sorting
            simpleSortMode = me.getSimpleSortMode(),
            sortParam      = me.getSortParam(),
            directionParam = me.getDirectionParam(),
            sorters        = me.getSorters(),
            //filtering
            filterParam    = me.getFilterParam(),
            filters        = me.getFilters(),
            //paging
            page           = options.page     || me.currentPage,
            limit          = options.pagesize || me.getPageSize(),
            start          = (page - 1) * limit,
            pageParam      = me.getPageParam(),
            startParam     = me.getStartParam(),
            limitParam     = me.getLimitParam();

        if (me.getEnablePagingParams()) {
            if (pageParam && page !== null) {
                params[pageParam] = page;
            }

            if (startParam && start !== null) {
                params[startParam] = start;
            }

            if (limitParam && limit !== null) {
                params[limitParam] = limit;
            }
        }

        if (groupParam && grouper) {
            // Grouper is a subclass of sorter, so we can just use the sorter method

            verbose && console.warn('Need to test encodeSorters');
            //params[groupParam] = me.encodeSorters([grouper]);
        }

        if (sortParam && sorters && sorters.length > 0) {
            if (simpleSortMode) {
                params[sortParam]      = sorters[0].getProperty();
                params[directionParam] = sorters[0].getDirection();
            } else {
                verbose && console.warn('Need to test encodeSorters');
                //params[sortParam] = me.encodeSorters(sorters);
            }
        }

        if (filterParam && filters && filters.length > 0) {
            verbose && console.warn('Need to test encodeFilters');
            //params[filterParam] = me.encodeFilters(filters);
        }

        return params;
    },

    /**
     * Encode the sorters for remote sorting.
     * This needs to be tested TODO
     * @param sorters
     */
    encodeSorters : function (sorters) {
        var min = [],
            sLen = sorters.length,
            s = 0,
            sorter;

        for (; s < sLen; s++) {
            sorter = sorters[s];
            min[s] = {
                property  : sorter.getProperty(),
                direction : sorter.getDirection()
            };
        }

        return min;

    },

    /**
     * Encode the filters for remote filtering.
     * This needs to be tested TODO
     * @param filters
     */
    encodeFilters : function (filters) {
        var min = [],
            fLen = filters.length,
            f = 0,
            filter;

        for (; f < fLen; f++) {
            filter = filters[f];
            min[i] = {
                property : filter.getProperty(),
                value    : filter.getValue()
            };
        }

        return min;
    },

    /**
     * Sends the actual requests off either as a batch or a single request at once.
     * @param batch
     */
    runQueue : function (batch) {
        var me      = this,
            verbose = me.getVerbose(),
            socket  = me.getSocket(),
            queue   = me.getQueue(),
            events  = me.getActionEvents(),
            request, event;

        /**
         * If the queue is empty, stop the queue running
         */
        if (!queue || queue.length === 0) {
            verbose && console.warn('Queue is empty');
            return;
        }

        verbose && console.warn(batch ? 'Going to batch requests' : 'Not going to batch requests');

        if (!batch) {
            batch = me.getBatch();
        }

        if (batch) {
            /**
             * Run the queue in batch mode
             */
            event = events.batch;

            socket.emit(event, queue);
        } else {
            /**
             * Send a single request one at a time.
             */
            request = queue[0];
            event   = events[request.action];

            socket.emit(event, request);
        }
    },

    /**
     * Removes a request from the queue.
     * @param clientId
     * @param action
     */
    removeFromQueue : function (clientId, action) {
        var me            = this,
            verbose       = me.getVerbose(),
            clientIdParam = me.getClientIdParam(),
            queue         = me.getQueue(),
            q             = 0,
            qLen          = queue.length,
            newQueue      = [],
            request;

        for (; q < qLen; q++) {
            request = queue[q];

            if (request[clientIdParam] === clientId && request.action === action) {
                verbose && console.warn('Removed request from queue', clientId, action);
                break;
            } else {
                newQueue.push(request);
            }
        }

        me.setQueue(newQueue);
    },

    /**
     * Gets the idProperty value.
     * For Sencha Touch 2 it executes model.getIdProperty().
     * For Ext JS 4, it has to get the idProperty from the model class itself.
     */
    getIdProperty : function() {
        var model = this.getModel();

        return model.getIdProperty ? model.getIdProperty() : (model.idProperty ? model.idProperty : model.superclass.idProperty);
    },

    /**
     * Find the record from the clientId.
     * @param clientId
     */
    getRecord : function(clientId) {
        return this.getAt(this.findBy(function (record, id) {
            return record.internalId === clientId || record.getId() === clientId;
        }))
    },

    /**
     * Handle the register event. This will load the store and init the events.
     * @param success
     * @private
     */
    onRegister : function(success) {
        var me = this;

        me.setRegistered(success);

        if (success) {
            var socket = me.getSocket(),
                events = me.getActionEvents();

            me.initSocketEvents(socket);
            socket.removeListener(events.register, me.onRegister);
        }

        if (me.getAutoLoad()) {
            me.load();
        }
    },

    /**
     * Handle the unregister event. This will remove events from the socket
     * @param success
     * @private
     */
    onUnRegister : function (success) {
        if (success) {
            var me     = this,
                socket = me.getSocket(),
                events = me.getActionEvents();

            me.setRegistered(false);

            me.removeSocketEvents(socket);

            socket && socket.on(events.register, me.onRegister);
        }
    },

    /**
     * handle the batch event. This will loop through the returned data
     * and take the necessary action on each.
     * This method should use abstracted CRUD methods TODO
     * @param datas
     * @private
     */
    onBatch : function(datas) {
        var me            = this,
            verbose       = me.getVerbose(),
            d             = 0,
            root          = datas.data,
            dLen          = root.length,
            clientIdParam = me.getClientIdParam(),
            idProperty    = me.getIdProperty(),
            data, action, clientId, rec, removed, newRemoved, r, rLen;

        for (; d < dLen; d++) {
            data     = root[d];
            action   = data.action;
            clientId = data[clientIdParam];
            rec      = me.getRecord(clientId);

            if (action === 'destroy') {
                /**
                 * If a record was found, the server is telling
                 * the client to delete a record. If one is not found
                 * the client had deleted the record and sent a sync
                 * request.
                 */
                if (rec) {
                    //temporarily not keep track of destroyed records
                    //this is because the server is telling the client
                    //to remove the records so we don't need to sync
                    //with the server
                    me.setSyncRemovedRecords(false);

                    me.remove(rec);

                    verbose && console.warn('Record removed from store in batch', rec);

                    me.setSyncRemovedRecords(true);

                    me.removeFromQueue(clientId, action);
                } else {
                    removed    = me.removed;
                    newRemoved = [];
                    r          = 0;
                    rLen       = removed.length;

                    for (; r < rLen; r++) {
                        rec = removed[r];

                        if (rec.getId() !== clientId) {
                            newRemoved.push(rec)
                        }
                    }

                    me.removed = newRemoved;

                    verbose && console.warn('Record removed from batch', data);

                    me.removeFromQueue(clientId, action);
                }
            } else {
                /**
                 * Created and updated records work near the same.
                 */
                if (rec) {
                    if (action === 'create') {
                        /**
                         * Client sent the request to server, server returned
                         * data and need to update the id of the record.
                         */
                        rec.setId(data[idProperty]);
                    }

                    rec.set(data);
                    rec.commit();

                    me.removeFromQueue(clientId, action);

                    verbose && console.warn('Record from batch', rec);
                } else {
                    /**
                     * Server is pushing data to the client. Server
                     * can only create records, it cannot edit a nonexistent
                     * record. Can think about just creating a new record.
                     */
                    if (action === 'create') {
                        me.add(data);

                        me.removeFromQueue(clientId, action);

                        verbose && console.warn('Record create from batch', data);
                    } else {
                        verbose && console.warn('Record not found while trying to edit in batch', data);
                    }
                }
            }
        }
    },

    /**
     * Handle the create event.
     * @param datas
     * @private
     */
    onCreate : function(datas) {
        var me               = this,
            runQueueOnAction = me.getRunQueueOnAction(),
            successProperty  = me.getSuccessProperty(),
            totalProperty    = me.getTotalProperty(),
            messageProperty  = me.getMessageProperty(),
            rootProperty     = me.getRootProperty(),
            success          = datas[successProperty],
            total            = datas[totalProperty],
            message          = datas[messageProperty],
            root             = datas[rootProperty],
            model            = me.getModel(),
            idProperty       = me.getIdProperty(),
            clientIdParam    = me.getClientIdParam(),
            r                = 0,
            rLen             = root.length,
            records          = [],
            data, clientId, rec;

        if (success) {
            for (; r < rLen; r++) {
                data     = root[r];
                clientId = data[clientIdParam];
                rec      = clientId ? me.getRecord(clientId) : false;

                /**
                 * If a record is found, the client created the record
                 * and a sync request was sent to the server. If a record
                 * is not found, the server is pushing a new record to the
                 * client.
                 */
                if (rec) {
                    rec.setId(data[idProperty]);
                    rec.set(data);
                    rec.commit();
                } else {
                    records.push(
                        new model(data)
                    );
                }

                me.removeFromQueue(clientId, 'create');
            }

            if (records.length > 0) {
                me.add(records);
            }

            if (typeof total === 'number') {
                me.setTotalCount(total);
            }

            /**
             * TODO need custom event?
             */
            //me.fireEvent('addrecords', me, records);
        } else {
            me.fireEvent('exception', me, success, message);
        }

        /**
         * Run the queue.
         */
        if (runQueueOnAction) {
            me.runQueue();
        }
    },

    /**
     * Handle the read event
     * @param data
     * @private
     */
    onRead : function (data) {
        var me               = this,
            runQueueOnAction = me.getRunQueueOnAction(),
            successProperty  = me.getSuccessProperty(),
            totalProperty    = me.getTotalProperty(),
            messageProperty  = me.getMessageProperty(),
            rootProperty     = me.getRootProperty(),
            success          = data[successProperty],
            total            = data[totalProperty],
            message          = data[messageProperty],
            root             = data[rootProperty],
            records;

        if (success) {
            /**
             * Remove all records and add the new records. This
             * can happen if the client emitted the read event
             * or the server emitted the read event on it's own.
             */
            me.removeAll();

            if (root && root.length > 0) {
                records = me.add(root);
            }

            if (typeof total === 'number') {
                me.setTotalCount(total);
            }

            me.fireEvent('load', me, records, success, null);
        } else {
            me.fireEvent('exception', me, success, message);
        }

        /**
         * Run the queue.
         */
        if (runQueueOnAction) {
            me.runQueue();
        }
    },

    /**
     * Handle the update event
     * @param datas
     * @private
     */
    onUpdate : function(datas) {
        var me               = this,
            runQueueOnAction = me.getRunQueueOnAction(),
            successProperty  = me.getSuccessProperty(),
            totalProperty    = me.getTotalProperty(),
            messageProperty  = me.getMessageProperty(),
            rootProperty     = me.getRootProperty(),
            success          = datas[successProperty],
            total            = datas[totalProperty],
            message          = datas[messageProperty],
            root             = datas[rootProperty],
            idProperty       = me.getIdProperty(),
            clientIdParam    = me.getClientIdParam(),
            r                = 0,
            rLen             = root.length,
            data, clientId, rec;

        if (success) {
            for (; r < rLen; r++) {
                data     = root[r];
                clientId = data[clientIdParam];
                rec      = me.getRecord(clientId);

                /**
                 * If a record is not found, nothing will happen.
                 * Maybe create a new record? TODO
                 */
                if (!rec) {
                    continue;
                }

                if (data[idProperty]) {
                    rec.setId(data[idProperty]);
                }

                rec.set(data);
                rec.commit();

                me.removeFromQueue(clientId, 'update');
            }

            if (typeof total === 'number') {
                me.setTotalCount(total);
            }

            /**
             * Need custom event? TODO
             */
            //me.fireEvent('updaterecords', me, records);
        } else {
            me.fireEvent('exception', me, success, message);
        }

        /**
         * Run the queue.
         */
        if (runQueueOnAction) {
            me.runQueue();
        }
    },

    /**
     * Handle the destroy event.
     * @param datas
     * @private
     */
    onDestroy : function(datas) {
        var me               = this,
            runQueueOnAction = me.getRunQueueOnAction(),
            successProperty  = me.getSuccessProperty(),
            rootProperty     = me.getRootProperty(),
            totalProperty    = me.getTotalProperty(),
            messageProperty  = me.getMessageProperty(),
            clientIdParam    = me.getClientIdParam(),
            success          = datas[successProperty],
            root             = datas[rootProperty],
            total            = datas[totalProperty],
            message          = datas[messageProperty],
            r                = 0,
            rLen             = root.length,
            data, clientId, removed, newRemoved, i, iLen, rec;

        if (success) {
            for (; r < rLen; r++) {
                data     = root[r];
                clientId = data[clientIdParam];
                rec      = me.getRecord(clientId);

                /**
                 * If a record is found, the server emitted the destroy
                 * event on it's own. If a record is not found, the
                 * client emitted the destroy method.
                 */
                if (rec) {
                    /**
                     * Temporarily not keep track of destroyed records
                     * this is because the server is telling the client
                     * to remove the records so we don't need to sync
                     * with the server
                     */
                    me.setSyncRemovedRecords(false);

                    me.remove(rec);

                    me.setSyncRemovedRecords(true);
                } else {
                    removed    = me.removed;
                    newRemoved = [];
                    i          = 0;
                    iLen       = removed.length;

                    for (; i < iLen; i++) {
                        rec = removed[i];

                        if (rec.getId() !== clientId) {
                            newRemoved.push(rec)
                        }
                    }

                    me.removed = newRemoved;
                }

                me.removeFromQueue(clientId, 'destroy');
            }

            if (typeof total === 'number') {
                me.setTotalCount(total);
            }

            /**
             * Need a custom event? TODO
             */
            //me.fireEvent('removerecords', me, records);
        } else {
            me.fireEvent('exception', me, success, message);
        }

        /**
         * Run the queue.
         */
        if (runQueueOnAction) {
            me.runQueue();
        }
    }
});