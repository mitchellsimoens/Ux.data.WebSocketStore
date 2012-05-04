Ext.define('Chat.view.Message', {
    extend : 'Ext.form.Panel',
    alias  : 'widget.chat-message',

    layout : {
        type : 'hbox'
    },

    items : [
        {
            xtype           : 'textfield',
            emptyText       : 'Message',
            flex            : 1,
            name            : 'message',
            enableKeyEvents : true
        },
        {
            xtype  : 'button',
            text   : 'Send',
            action : 'sendMessage'
        }
    ]
});