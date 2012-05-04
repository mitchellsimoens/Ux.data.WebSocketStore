Ext.define('Chat.controller.Main', {
    extend : 'Ext.app.Controller',

    config : {
        isTyping     : false,
        lastType     : false,
        typingBuffer : 1,
        whoTyping    : [],
        refs         : {
            main : 'chat-main'
        },
        control      : {
            'chat-login' : {
                dologin : 'doLogin'
            },
            'chat-message' : {
                sendmessage : 'doSendMessage',
                keyup       : 'doSendTyping'
            }
        }
    },

    init : function(app) {
        var me = this;

        app.on({
            scope              : me,
            loginsuccess       : 'onLoginSuccess',
            servertypingchange : 'onTypingChange'
        });

        me.initTypingTimer = Ext.Function.bind(me.initTypingTimer, me);

        me.initTypingTimer();
    },

    applyLastType : function (date) {
        if (Ext.isDate(date)) {
            date = Ext.Date.format(date, 'U');
        }

        return date;
    },

    applyWhoTyping : function (names) {
        return Ext.Array.clone(names);
    },

    updateWhoTyping : function (names) {
        var num   = names.length,
            store = Ext.getStore('Users'),
            name, index;

        if (!store) {
            return;
        }

        store.each(function(rec) {
            if (num === 0) {
                rec.set('typing', false);
            } else {
                name  = rec.get('name');
                index = Ext.Array.indexOf(names, name);

                rec.set('typing', index !== -1);
            }

            rec.commit();
        });
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
    },

    doSendTyping : function() {
        this.setLastType(new Date());
        this.fireTyping(true);
        this.setIsTyping(true);
    },

    initTypingTimer : function() {
        var me       = this,
            isTyping = me.getIsTyping();

        if (isTyping) {
            var lastType     = me.getLastType(),
                buffer       = me.getTypingBuffer(),
                now          = Ext.Date.format(new Date(), 'U'),
                diff         = now - lastType,
                stillTyping  = diff <= buffer,
                typingChange = stillTyping !== isTyping;

            if (typingChange) {
                me.fireTyping (stillTyping);
                me.setIsTyping(stillTyping);
            }
        }

        setTimeout(me.initTypingTimer, 500);
    },

    fireTyping : function(typing) {
        var isTyping = this.getIsTyping();

        if (isTyping !== typing) {
            var app = this.getApplication();

            app.fireEvent('typingchange', app, typing);
        }
    },

    onTypingChange : function (name, typing) {
        var whoTyping = this.getWhoTyping(),
            index = Ext.Array.indexOf(whoTyping, name);

        if (typing) {
            if (index === -1) {
                whoTyping.push(name);
            }
        } else {
            whoTyping = Ext.Array.remove(whoTyping, name);
        }

        this.setWhoTyping(whoTyping);
    }
});