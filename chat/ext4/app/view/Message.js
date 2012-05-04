Ext.define('Chat.view.Message', {
    extend : 'Ext.form.Panel',
    alias  : 'widget.chat-message',

    layout : {
        type : 'hbox'
    },

    items : [
        {
            xtype     : 'textfield',
            emptyText : 'Message',
            flex      : 1,
            name      : 'message'
        },
        {
            xtype  : 'button',
            text   : 'Send',
            action : 'sendMessage'
        }
    ]
});