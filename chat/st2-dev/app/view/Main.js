Ext.define('Chat.view.Main', {
    extend : 'Ext.Container',
    xtype  : 'chat-main',

    requires: [
        'Chat.view.Login',
        'Chat.view.Chat',
        'Chat.view.Message',
        'Chat.view.Users'
    ],

    config: {
        layout : 'fit',
        items  : [
            {
                xtype : 'chat-login'
            }
        ]
    }
});
