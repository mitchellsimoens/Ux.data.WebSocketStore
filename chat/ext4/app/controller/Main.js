Ext.define('Chat.controller.Main', {
    extend : 'Ext.app.Controller',

    refs : [
        {
            ref      : 'viewport',
            selector : 'chat-viewport'
        }
    ],

    config : {
        isTyping     : false,
        lastType     : false,
        typingBuffer : 1,
        whoTyping    : []
    },

    constructor : function (config) {
        var me = this;

        me.initConfig(config);

        Chat.controller.Main.superclass.constructor.call(me, config);

        me.initTypingTimer = Ext.Function.bind(me.initTypingTimer, me);
    },

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
                specialkey : me.doSendMessageText,
                keyup      : me.doSendTyping
            }
        });

        app.on({
            scope              : me,
            loginsuccess       : me.onLoginSuccess,
            servertypingchange : me.onTypingChange
        });

        me.initTypingTimer();
    },

    applyLastType : function(date) {
        if (Ext.isDate(date)) {
            date = Ext.Date.format(date, 'U');
        }

        return date;
    },

    applyWhoTyping : function(names) {
        return Ext.Array.clone(names);
    },

    updateWhoTyping : function(names) {
        var num   = names.length,
            store = Ext.getStore('Users'),
            name, index;

        if (!store) {
            return;
        }

        store.each(function (rec) {
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
        if (e.keyCode === 13 && field.getValue().length > 0) {
            this.doSendMessage(field);
        }
    },

    doSendTyping : function(field, e) {
        //need more? TODO
        if (e.keyCode !== 13) {
            this.setLastType(new Date());
            this.fireTyping(true);
            this.setIsTyping(true);
        }
    },

    initTypingTimer : function () {
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
                me.fireTyping(stillTyping);
            }

            me.setIsTyping(stillTyping);
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

    onTypingChange : function(name, typing) {
        var whoTyping = this.getWhoTyping(),
            index     = Ext.Array.indexOf(whoTyping, name);

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