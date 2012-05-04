Ext.Loader.setPath({
    'Ux'   : '../Ux',
    'Chat' : 'app'
});

Ext.require([
    'Chat.view.Viewport',
    'Chat.controller.Main',
    'Chat.controller.Socketio'
]);

Ext.define('Override.app.Application', {
    override : 'Ext.app.Application',

    constructor : function (config) {
        var name = config.name;

        Ext.ClassManager.setNamespace(name + '.app', this);

        this.callOverridden([config]);
    }
});

Ext.application({
    name : 'Chat',

    username : null,

    controllers : [
        'Main',
        'Socketio'
    ],

    models : [
        'Message',
        'User'
    ],

    stores : [
        'Messages',
        'Users'
    ],

    requires : [
        'Ux.data.WebSocketStore'
    ],

    autoCreateViewport : true,

    launch : function() {
        /*window.onbeforeunload = function() {
            var controller = Chat.app.getController('Socketio'),
                socket     = controller;

            console.log(controller);

            return 'You haven\'t logged out yet. Please log out first.';
        };*/
    }
});