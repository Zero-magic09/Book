Component({
    options: {
        styleIsolation: 'shared'
    },
    properties: {
        value: {
            type: String,
            value: ''
        },
        placeholder: {
            type: String,
            value: ''
        },
        type: {
            type: String,
            value: 'text'
        },
        password: {
            type: Boolean,
            value: false
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
        handleInput(e) {
            this.triggerEvent('input', e.detail);
        },
        handleFocus(e) {
            this.triggerEvent('focus', e.detail);
        },
        handleBlur(e) {
            this.triggerEvent('blur', e.detail);
        }
    }
})
