// pages/farmer/info/info.js
const app = getApp();
const { get, put, post } = require('../../../utils/request.js');

Page({
    data: {
        farmerId: null,
        verified: false,
        isPending: false,
        info: {
            name: '', // farmName
            province: '',
            city: '',
            address: '',
            location: '118.2341, 36.4562',
            story: '' // description
        },
        region: []
    },

    onLoad() {
        const storedUser = wx.getStorageSync('userInfo') || app.globalData.userInfo;
        const farmerId = storedUser ? storedUser.farmerId : null;
        if (farmerId) {
            this.setData({ farmerId });
            this.loadFarmerInfo(farmerId);
        }
    },

    loadFarmerInfo(id) {
        get(`/farmer/${id}/profile`).then(res => {
            if (res.code === 200) {
                const data = res.data.farmerInfo;
                const isVerified = !!data.verified;
                // strict check for pending status
                // If it is NOT_SUBMITTED, it is NOT pending.
                const isPending = data.auditStatus === 'PENDING';

                // If denied, allow resubmission (not pending)
                const isRejected = data.auditStatus === 'REJECTED';

                this.setData({
                    verified: isVerified,
                    isPending: isPending,
                    info: {
                        name: data.farmName || '',
                        province: data.province || '',
                        city: data.city || '',
                        address: data.address || '',
                        location: '118.2341, 36.4562', // data.location if available
                        story: data.description || ''
                    },
                    region: [data.province || '', data.city || '', '']
                });
            }
        });
    },

    bindRegionChange: function (e) {
        console.log('picker发送选择改变，携带值为', e.detail.value)
        this.setData({
            region: e.detail.value,
            'info.province': e.detail.value[0],
            'info.city': e.detail.value[1]
        })
    },

    handleReset() {
        wx.showModal({
            title: '重新认证',
            content: '确定要重新认证吗？当前认证状态将被清除。',
            success: (res) => {
                if (res.confirm) {
                    post(`/farmer/${this.data.farmerId}/reset-certification`).then(res => {
                        if (res.code === 200) {
                            this.setData({ verified: false, isPending: false });
                            wx.showToast({ title: '已进入编辑状态' });
                        }
                    });
                }
            }
        });
    },

    handleInput(e) {
        const field = e.currentTarget.dataset.field;
        this.setData({
            [`info.${field}`]: e.detail.value
        });
    },

    handleLocation() {
        wx.showLoading({ title: '定位中...' });
        setTimeout(() => {
            wx.hideLoading();
            this.setData({ 'info.location': '121.4737, 31.2304' });
            wx.showToast({ title: '定位已更新', icon: 'none' });
        }, 1000);
    },

    handleSubmit() {
        const { name, province, city, address, story } = this.data.info;

        if (!name || !province || !city || !address || !story) {
            wx.showToast({
                title: '请填写完整信息',
                icon: 'none'
            });
            return;
        }

        const updateData = {
            farmName: name,
            province: province,
            city: city,
            address: address,
            description: story
        };

        put(`/farmer/${this.data.farmerId}/profile`, updateData).then(res => {
            if (res.code === 200) {
                wx.showToast({
                    title: '提交成功，请耐心等待',
                    icon: 'none',
                    duration: 2000
                });
                // Update local state to pending
                this.setData({ isPending: true });

                // 重新加载数据，反映真实状态
                setTimeout(() => {
                    this.loadFarmerInfo(this.data.farmerId);
                }, 2000);
            } else {
                wx.showToast({ title: res.message || '保存失败', icon: 'none' });
            }
        });
    }
})
