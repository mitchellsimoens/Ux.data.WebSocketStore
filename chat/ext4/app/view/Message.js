Ext.define('Chat.view.Message', {
    extend : 'Ext.form.Panel',
    alias  : 'widget.chat-message',

    height : 60,

    layout : {
        type  : 'vbox',
        align : 'stretch'
    },

    items : [
        {
            xtype  : 'component',
            which  : 'whoTyping',
            height : 30
        },
        {
            xtype  : 'container',
            flex   : 1,
            layout : {
                type  : 'hbox',
                align : 'stretch'
            },
            items  : [
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
        }
    ]
});