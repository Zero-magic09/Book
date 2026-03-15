// pages/farmer/real-shot/real-shot.js
const app = getApp();
const { get, post, del, formatImageURL } = require('../../../utils/request.js');

Page({
    data: {
        photos: [], // {id, url, description}
        farmerId: null,
        // Dragging state
        dragging: false,
        dragIndex: -1,
        dragX: 0,
        dragY: 0,
        dragItem: null,
        containerTop: 0,
        containerLeft: 0,
        itemWidth: 0,
        itemHeight: 0,
        columns: 2
    },

    onLoad() {
        const storedUser = wx.getStorageSync('userInfo') || app.globalData.userInfo;
        const farmerId = storedUser ? (storedUser.farmerId || storedUser.userId) : null;
        if (farmerId) {
            this.setData({ farmerId });
            this.fetchPhotos();
        }
    },

    fetchPhotos() {
        get(`/farmer/${this.data.farmerId}/photos`).then(res => {
            if (res.code === 200) {
                const photos = (res.data || []).map(p => ({
                    ...p,
                    url: formatImageURL(p.url)
                }));
                this.setData({ photos });
                this.initGridInfo();
            }
        });
    },

    initGridInfo() {
        const query = wx.createSelectorQuery();
        query.select('.shot-grid').boundingClientRect();
        query.select('.shot-item').boundingClientRect();
        query.exec((res) => {
            if (res[0] && res[1]) {
                this.setData({
                    containerTop: res[0].top,
                    containerLeft: res[0].left,
                    itemWidth: res[1].width,
                    itemHeight: res[1].height
                });
            }
        });
    },

    handleUpload() {
        if (this.data.photos.length >= 6) {
            wx.showToast({ title: '最多上传6张', icon: 'none' });
            return;
        }

        wx.chooseImage({
            count: 6 - this.data.photos.length,
            success: (res) => {
                const tempFilePaths = res.tempFilePaths;
                wx.showLoading({ title: '上传中' });

                const uploadTasks = tempFilePaths.map(path => {
                    return new Promise((resolve, reject) => {
                        wx.uploadFile({
                            url: 'http://127.0.0.1:8080/api/common/upload',
                            filePath: path,
                            name: 'file',
                            header: {
                                'Authorization': 'Bearer ' + wx.getStorageSync('token')
                            },
                            success: (uploadRes) => {
                                console.log('Upload Response raw data:', uploadRes.data);
                                if (uploadRes.statusCode !== 200) {
                                    reject(`HTTP Error: ${uploadRes.statusCode}`);
                                    return;
                                }
                                try {
                                    const data = JSON.parse(uploadRes.data);
                                    if (data.code === 200) {
                                        resolve(data.data); // URL
                                    } else {
                                        reject(data.message || 'Server error');
                                    }
                                } catch (e) {
                                    console.error('Parse upload response failed:', e, uploadRes.data);
                                    reject('Response is not valid JSON');
                                }
                            },
                            fail: (err) => {
                                console.error('wx.uploadFile fail:', err);
                                reject(err);
                            }
                        });
                    });
                });

                Promise.all(uploadTasks).then(urls => {
                    const newPhotos = [...this.data.photos];
                    urls.forEach(url => {
                        newPhotos.push({
                            id: Date.now() + Math.random(), // Temporary ID for local management
                            url: formatImageURL(url),
                            isNew: true
                        });
                    });
                    this.setData({ photos: newPhotos });
                    wx.hideLoading();
                }).catch(err => {
                    wx.hideLoading();
                    wx.showToast({ title: '上传失败: ' + (typeof err === 'string' ? err : '网络错误'), icon: 'none' });
                    console.error('Upload failed details:', err);
                });
            }
        });
    },

    handleDelete(e) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
            title: '移除照片',
            content: '确定要从列表中移除这张照片吗？(保存后生效)',
            success: (res) => {
                if (res.confirm) {
                    const newPhotos = this.data.photos.filter(p => p.id !== id);
                    this.setData({ photos: newPhotos });
                }
            }
        });
    },

    handleSave() {
        if (!this.data.farmerId) return;

        wx.showLoading({ title: '保存中' });
        const imageUrls = this.data.photos.map(p => p.url);

        post(`/farmer/${this.data.farmerId}/photos/batch`, imageUrls).then(res => {
            wx.hideLoading();
            if (res.code === 200) {
                wx.showToast({ title: '保存成功', icon: 'success' });
                this.fetchPhotos();
            } else {
                wx.showToast({ title: res.message || '保存失败', icon: 'none' });
            }
        }).catch(err => {
            wx.hideLoading();
            wx.showToast({ title: '网络错误', icon: 'none' });
        });
    },

    // --- Drag and Drop Logic ---

    touchStart(e) {
        const index = e.currentTarget.dataset.index;
        const { clientX, clientY } = e.touches[0];

        this.setData({
            dragging: true,
            dragIndex: index,
            dragItem: this.data.photos[index],
            dragX: clientX - this.data.containerLeft,
            dragY: clientY - this.data.containerTop
        });
    },

    touchMove(e) {
        if (!this.data.dragging) return;

        const { clientX, clientY } = e.touches[0];
        const x = clientX - this.data.containerLeft;
        const y = clientY - this.data.containerTop;

        this.setData({
            dragX: x,
            dragY: y
        });

        // Calculate target index based on x, y
        const col = Math.floor(x / (this.data.itemWidth + 10)); // 10 is approx half of gap
        const row = Math.floor(y / (this.data.itemHeight + 10));
        let targetIndex = row * this.data.columns + col;

        if (targetIndex < 0) targetIndex = 0;
        if (targetIndex >= this.data.photos.length) targetIndex = this.data.photos.length - 1;

        if (targetIndex !== this.data.dragIndex) {
            this.swapPhotos(this.data.dragIndex, targetIndex);
        }
    },

    touchEnd() {
        this.setData({
            dragging: false,
            dragIndex: -1,
            dragItem: null
        });
    },

    swapPhotos(fromIndex, toIndex) {
        const list = [...this.data.photos];
        const item = list.splice(fromIndex, 1)[0];
        list.splice(toIndex, 0, item);

        this.setData({
            photos: list,
            dragIndex: toIndex
        });
    }
})
