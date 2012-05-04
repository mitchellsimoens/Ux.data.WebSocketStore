Ext.define('Chat.view.Viewport', {
    extend : 'Ext.container.Viewport',
    alias  : 'widget.chat-viewport',

    requires : [
        'Ext.layout.container.Border',
        'Chat.view.Login',
        'Chat.view.Chat',
        'Chat.view.Message',
        'Chat.view.Users'
    ],

    layout : 'border',

    items : [
        {
            xtype  : 'chat-login',
            region : 'center'
        }
    ]
});