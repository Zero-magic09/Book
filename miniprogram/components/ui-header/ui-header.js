// components/ui-header/ui-header.js
Component({
    properties: {
        title: String,
        showBack: {
            type: Boolean,
            value: false
        }
    },
    methods: {
        handleBack() {
            this.triggerEvent('back');
            wx.navigateBack();
        }
    }
})
