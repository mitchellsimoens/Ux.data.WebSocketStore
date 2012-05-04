Ext.define('Chat.view.Users', {
    extend : 'Ext.dataview.List',
    xtype  : 'chat-users',

    config : {
        itemTpl : '{name} {[values.typing ? "typing..." : ""]}',
        store   : 'Users'
    }
});