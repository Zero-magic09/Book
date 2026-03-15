Component({
    properties: {
        variant: {
            type: String,
            value: 'primary' // primary, secondary, outline, danger
        },
        disabled: {
            type: Boolean,
            value: false
        },
        className: {
            type: String,
            value: ''
        }
    },
    methods: {
        onTap() {
            if (!this.properties.disabled) {
                this.triggerEvent('click');
            }
        }
    }
})
