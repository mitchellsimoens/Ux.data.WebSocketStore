Ext.define('Chat.view.Chat', {
    extend : 'Ext.dataview.List',
    xtype  : 'chat-chat',

    config : {
        itemTpl : '{name} - {message}',
        store   : 'Messages'
    }
});