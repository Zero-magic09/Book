// components/ui-tabbar/ui-tabbar.js
Component({
    properties: {
        activeTab: {
            type: String,
            value: ''
        },
        items: {
            type: Array,
            value: []
        },
        color: {
            type: String,
            value: '#64748b'
        },
        selectedColor: {
            type: String,
            value: '#10b981'
        }
    },

    methods: {
        handleSelect(e) {
            const id = e.currentTarget.dataset.id;
            this.triggerEvent('select', id);
        }
    }
})
