Ext.define('Chat.view.Message', {
    extend : 'Ext.Toolbar',
    xtype  : 'chat-message',

    config : {
        textfield : null,
        items     : [
            {
                xtype       : 'textfield',
                placeHolder : 'Message',
                flex        : 1
            },
            {
                xtype  : 'button',
                text   : 'Send',
                ui     : 'confirm',
                action : 'sendMessage'
            }
        ],

        control : {
            'button' : {
                tap : 'handleButtonTap'
            },
            'textfield' : {
                action : 'handleTextfieldAction',
                keyup  : 'handleTextfieldKey'
            }
        }
    },

    getMessage : function() {
        var field = this.getTextfield();

        if (!field) {
            this.setTextfield(
                field = this.down('textfield')
            );
        }

        return field.getValue();
    },

    handleButtonTap : function() {
        var message = this.getMessage();

        this.fireEvent('sendmessage', this, message);
    },

    handleTextfieldAction : function(field, e) {
        if (e.browserEvent.keyCode === 13) {
            this.handleButtonTap();
        }
    },

    handleTextfieldKey : function(field, e) {
        if (e.browserEvent.keyCode !== 13) {
            this.fireEvent('keyup', this, field, e);
        }
    }
});