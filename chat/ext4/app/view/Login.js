Ext.define('Chat.view.Login', {
    extend : 'Ext.form.Panel',
    alias  : 'widget.chat-login',

    requires : [
        'Ext.form.field.Text',
        'Ext.button.Button'
    ],

    items : [
        {
            xtype      : 'textfield',
            fieldLabel : 'Name',
            allowBlank : false,
            name       : 'name'
        },
        {
            xtype  : 'button',
            text   : 'Login',
            action : 'login'
        }
    ]
});