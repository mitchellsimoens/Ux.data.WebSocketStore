Ext.define('Chat.model.Message', {
    extend : 'Ext.data.Model',

    config : {
        fields : [
            'name',
            'message',
            'date'
        ]
    }
});