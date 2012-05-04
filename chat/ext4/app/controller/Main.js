Ext.define('Chat.controller.Main', {
    extend : 'Ext.app.Controller',

    refs : [
        {
            ref      : 'viewport',
            selector : 'chat-viewport'
        }
    ],

    init : function(app) {
        var me = this;

        me.control({
            'button[action=login]' : {
                click : me.doLogin
            },
            'textfield[name=name]' : {
                specialkey : me.doLoginText
            },
            'button[action=sendMessage]' : {
                click : me.doSendMessage
            },
            'textfield[name=message]' : {
                specialkey : me.doSendMessageText
            }
        });

        app.on('loginsuccess', me.onLoginSuccess, me);
    },

    getApplication : function() {
        return this.application;
    },

    doLogin : function(button) {
        var form   = button.up('chat-login'),

            values = form.getValues(),
            name   = values.name,
            app    = this.getApplication();

        app.fireEvent('login', app, name);
    },

    doLoginText : function(field, e) {
        if (e.keyCode === 13) {
            this.doLogin(field);
        }
    },

    onLoginSuccess : function (app, name, socketId) {
        app.username = name;
        app.socketId = socketId;

        var viewport   = this.getViewport(),
            messages   = Ext.getStore('Messages'),
            users      = Ext.getStore('Users'),
            controller = app.getController('Socketio'),
            socket     = controller.getSocket();

        viewport.removeAll();

        viewport.add([
            {
                xtype  : 'chat-chat',
                region : 'center'
            },
            {
                xtype  : 'chat-message',
                region : 'south'
            },
            {
                xtype  : 'chat-users',
                region : 'west',
                width  : 200
            }
        ]);

        messages.setSocketId(socketId);
        messages.setSocket(socket);
        users   .setSocketId(socketId);
        users   .setSocket(socket);

        users.add({
            name : name
        });
        users.sync();
    },

    doSendMessage : function(button) {
        var form    = button.up('chat-message'),
            field   = button.isXType('textfield') ? button : form.down('textfield'),
            values  = form.getValues(),
            message = values.message,
            store   = Ext.getStore('Messages'),
            name    = this.getApplication().username;

        store.add({
            name    : name,
            message : message,
            date    : new Date()
        });
        store.sync();

        if (field) {
            field.reset();
            field.focus();
        }
    },

    doSendMessageText : function(field, e) {
        if (e.keyCode === 13) {
            this.doSendMessage(field);
        }
    }
});