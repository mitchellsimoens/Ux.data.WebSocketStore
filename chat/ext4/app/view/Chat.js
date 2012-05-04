Ext.define('Chat.view.Chat', {
    extend : 'Ext.grid.Panel',
    alias  : 'widget.chat-chat',

    title   : 'Messages',
    columns : [
        {
            header    : 'Name',
            dataIndex : 'name',
            width     : 100
        },
        {
            header    : 'Date',
            dataIndex : 'date',
            width     : 100
        },
        {
            header    : 'Message',
            dataIndex : 'message',
            flex      : 1
        }
    ],

    initComponent : function() {
        var me = this;

        me.store = Ext.getStore('Messages');

        Chat.view.Chat.superclass.initComponent.call(me);
    }
});