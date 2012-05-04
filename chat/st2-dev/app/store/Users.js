Ext.define('Chat.store.Users', {
    extend : 'Ux.data.WebSocketStore',

    requires : [
        'Ux.data.WebSocketStore',
        'Chat.model.User'
    ],

    config : {
        autoLoad     : true,
        model        : 'Chat.model.User',
        actionEvents : {
            create     : 'create_user',
            read       : 'read_user',
            update     : 'update_user',
            destroy    : 'destroy_user',
            batch      : 'batch_user',
            register   : 'register',
            unregister : 'unregister'
        }
    },

    applySocket : function (socket) {
        if (typeof socket !== 'object') {
            var app        = Chat.app,
                controller = app.getController('Socketio');

            socket = controller.getSocket();
        }

        return socket;
    }
});