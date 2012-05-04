Ext.define('Chat.controller.Main', {
    extend : 'Ext.app.Controller',

    config : {
        refs : {
            main : 'chat-main'
        },
        control : {
            'chat-login' : {
                dologin : 'doLogin'
            },
            'chat-message' : {
                sendmessage : 'doSendMessage'
            }
        }
    },

    init : function(app) {
        app.on('loginsuccess', 'onLoginSuccess', this);
    },

    doLogin : function(login, name) {
        var app =  this.getApplication();

        app.fireEvent('login', app, name);
    },

    onLoginSuccess : function(app, name, socketId) {
        app.username = name;

        var main       = this.getMain(),
            messages   = Ext.getStore('Messages'),
            users      = Ext.getStore('Users'),
            controller = app.getController('Socketio'),
            socket     = controller.getSocket();

        main.removeAll();

        main.add([
            {
                xtype : 'chat-chat'
            },
            {
                xtype  : 'chat-message',
                docked : 'bottom'
            },
            {
                width  : 200,
                docked : 'left',
                layout : 'fit',
                items  : [
                    {
                        xtype : 'chat-users'
                    },
                    {
                        xtype  : 'toolbar',
                        docked : 'top',
                        title  : 'Users'
                    }
                ]
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

    doSendMessage : function (component, message) {
        var store = Ext.getStore('Messages'),
            name = Chat.app.username,
            field = component.getTextfield();

        store.add({
            name    : name,
            message : message,
            date    : new Date()
        });
        store.sync();

        if (field) {
            field.setValue('');
        }
    }
});