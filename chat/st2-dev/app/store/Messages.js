Ext.define('Chat.store.Messages', {
    extend : 'Ux.data.WebSocketStore',

    requires : [
        'Chat.model.Message'
    ],

    config : {
        model : 'Chat.model.Message'
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