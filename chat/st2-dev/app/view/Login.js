Ext.define('Chat.view.Login', {
    extend : 'Ext.form.Panel',
    xtype  : 'chat-login',

    requires : [
        'Ext.form.FieldSet',
        'Ext.field.Text',
        'Ext.Button'
    ],

    config : {
        textfield  : null,
        scrollable : false,
        items      : [
            {
                xtype : 'fieldset',
                title : 'Login',
                items : [
                    {
                        xtype : 'textfield',
                        label : 'Name',
                        name  : 'name'
                    },
                    {
                        xtype  : 'button',
                        text   : 'Login',
                        ui     : 'confirm',
                        action : 'login'
                    }
                ]
            }
        ],

        control : {
            'button' : {
                tap : 'handleButtonTap'
            },
            'textfield' : {
                action : 'handleTextfieldAction'
            }
        }
    },

    getName : function() {
        var field = this.getTextfield();

        if (!field) {
            this.setTextfield(
                field = this.down('textfield')
            );
        }

        return field.getValue();
    },

    handleButtonTap : function() {
        var name = this.getName();

        this.fireEvent('dologin', this, name);
    },

    handleTextfieldAction : function(field, e) {
        if (e.browserEvent.keyCode === 13) {
            this.handleButtonTap();
        }
    }
});