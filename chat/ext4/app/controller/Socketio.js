Ext.define('Chat.controller.Socketio', {
    extend : 'Ext.app.Controller',

    config : {
        socket : true
    },

    constructor : function(config) {
        var me = this;

        me.initConfig(config);

        Chat.controller.Socketio.superclass.constructor.call(me, config);
    },

    init : function (app) {
        app.on('login', this.doLogin, this);
    },

    getApplication : function () {
        return this.application;
    },

    applySocket : function () {
        return io.connect(location.origin);
    },

    updateSocket : function (socket) {
        var me = this;

        socket.on('login', function (data) {
            setInterval(function () {
                socket.emit('keep-alive', null)
            }, 10000);

            me.onLogin.call(me, data);
        });
    },

    doLogin : function (app, name) {
        var socket = this.getSocket();

        socket.emit('login', {
            name : name
        });
    },

    onLogin : function (data) {
        if (data.success) {
            var app      = this.getApplication(),
                socketId = data.socketId,
                messages = Ext.getStore('Messages');

            messages.setSocketId(socketId);

            app.fireEvent('loginsuccess', app, data.name, data.socketId);
        }
    }
});