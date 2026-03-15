// pages/common/personal-info/personal-info.js
const app = getApp();
const { get, put, formatImageURL } = require('../../../utils/request.js');

Page({
    data: {
        role: 'consumer', // 'consumer' or 'farmer'
        userInfo: {
            userId: null,
            avatar: '',
            name: '',
            phone: '',
            roleTag: ''
        }
    },

    onLoad(options) {
        const role = options.role || 'consumer';
        this.setData({ role });

        this.loadUserId();

        wx.setNavigationBarTitle({
            title: role === 'farmer' ? '农户资料编辑' : '个人资料编辑'
        });
    },

    loadUserId() {
        // 尝试获取用户ID
        const storedUser = wx.getStorageSync('userInfo') || app.globalData.userInfo;
        if (storedUser && storedUser.userId) {
            this.loadData(storedUser.userId);
        } else {
            // 如果未登录，尝试使用默认测试用户ID 5 (仅供演示)
            // 在正式环境中应跳转登录
            wx.showToast({ title: '未检测到登录信息，使用默认用户', icon: 'none' });
            this.loadData(5);
        }
    },

    loadData(userId) {
        get(`/users/${userId}/profile`).then(res => {
            if (res.code === 200) {
                const data = res.data;
                this.setData({
                    userInfo: {
                        userId: data.id,
                        avatar: formatImageURL(data.avatar) || 'https://picsum.photos/seed/default/200/200',
                        name: data.name || '',
                        phone: data.phone || '',
                        roleTag: data.roleTag || '用户'
                    }
                });
            } else {
                wx.showToast({ title: '加载失败', icon: 'none' });
            }
        });
    },

    handleInput(e) {
        const value = e.detail.value;
        this.setData({
            'userInfo.name': value
        });
    },

    handleAvatarChoose() {
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                const tempFilePath = res.tempFiles[0].tempFilePath;

                wx.showLoading({ title: '上传中...' });

                // Upload file to backend
                wx.uploadFile({
                    url: 'http://127.0.0.1:8080/api/common/upload',
                    filePath: tempFilePath,
                    name: 'file',
                    header: {
                        'Authorization': 'Bearer ' + wx.getStorageSync('token')
                    },
                    success: (uploadRes) => {
                        wx.hideLoading();
                        try {
                            const data = JSON.parse(uploadRes.data);
                            if (data.code === 200) {
                                // Important: Format the URL immediately so it shows up
                                const { formatImageURL } = require('../../../utils/request.js');
                                this.setData({
                                    'userInfo.avatar': formatImageURL(data.data)
                                });
                            } else {
                                wx.showToast({ title: '上传失败: ' + data.message, icon: 'none' });
                            }
                        } catch (e) {
                            wx.showToast({ title: '解析失败', icon: 'none' });
                        }
                    },
                    fail: (err) => {
                        wx.hideLoading();
                        wx.showToast({ title: '上传出错', icon: 'none' });
                    }
                });
            }
        });
    },

    handleSave() {
        const { userId, name, avatar } = this.data.userInfo;
        if (!userId) return;

        wx.showLoading({ title: '保存中...' });

        put(`/users/${userId}/profile`, {
            name: name,
            avatar: avatar // 注意：如果是临时路径，后端可能无法访问用于显示，需确保是网络图片
        }).then(res => {
            wx.hideLoading();
            if (res.code === 200) {
                wx.showToast({
                    title: '修改成功',
                    icon: 'success',
                    duration: 1500,
                    success: () => {
                        setTimeout(() => {
                            wx.navigateBack();
                        }, 1500);
                    }
                });
            } else {
                wx.showToast({ title: res.message || '修改失败', icon: 'none' });
            }
        }).catch(() => {
            wx.hideLoading();
        });
    }
})
