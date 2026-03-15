// pages/index/index.js
const app = getApp()

Page({
    data: {
        roles: [
            {
                type: 'CONSUMER',
                title: '我是消费者',
                desc: '地道农特产 追溯全过程',
                icon: '🛒',
                bgColor: 'bg-emerald-50',
                borderColor: 'border-emerald-100',
                iconBg: 'bg-emerald-100',
                iconTextColor: 'text-emerald-600',
                path: '/pages/auth/login-consumer/login-consumer'
            },
            {
                type: 'FARMER',
                title: '我是农户',
                desc: '上架家乡味 管理种植志',
                icon: '👨‍🌾',
                bgColor: 'bg-amber-50',
                borderColor: 'border-amber-100',
                iconBg: 'bg-amber-100',
                iconTextColor: 'text-amber-600',
                path: '/pages/auth/login-farmer/login-farmer'
            }
        ]
    },

    onLoad() {
    },

    handleRoleSelect(e) {
        const path = e.currentTarget.dataset.path;
        wx.navigateTo({
            url: path
        });
    }
})
