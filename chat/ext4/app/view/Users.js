Ext.define('Chat.view.Users', {
    extend : 'Ext.grid.Panel',
    alias  : 'widget.chat-users',

    title   : 'Users',
    columns : [
        {
            header    : 'Name',
            dataIndex : 'name',
            flex      : 1,
            renderer  : function(value, meta, rec) {
                return value + (rec.get('typing') ? ' typing...' : '');
            }
        }
    ],

    initComponent : function() {
        var me = this;

        me.store = Ext.getStore('Users');

        Chat.view.Users.superclass.initComponent.call(me);
    }
});