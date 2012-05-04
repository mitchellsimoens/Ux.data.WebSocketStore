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
        var me = this;

        app.on({
            scope        : me,
            login        : me.doLogin,
            typingchange : me.doTyping
        });
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

            socket.on('typingchange', function(data) {
                me.getApplication().fireEvent('servertypingchange', data.name, data.typing);
            });

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
    },

    doTyping : function(app, typing) {
        var socket = this.getSocket();

        socket.emit('typingchange', {
            name   : app.username,
            typing : typing
        });
    }
});