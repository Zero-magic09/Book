const baseURL = 'http://127.0.0.1:8080/api';

const request = (options) => {
    // 处理URL拼接，防止双斜杠
    let url = options.url.indexOf('/') === 0 ? options.url : '/' + options.url;

    return new Promise((resolve, reject) => {
        wx.request({
            url: baseURL + url,
            method: options.method || 'GET',
            data: options.data || {},
            header: {
                'content-type': 'application/json',
                // 如果有token则自动带上，前端统一添加 Bearer 前缀
                ...(wx.getStorageSync('token') ? { 'Authorization': 'Bearer ' + wx.getStorageSync('token') } : {}),
                ...(options.header || {})
            },
            success(res) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(res.data);
                } else {
                    wx.showToast({
                        title: res.data.message || '请求失败',
                        icon: 'none'
                    });
                    reject(res);
                }
            },
            fail(err) {
                wx.showToast({
                    title: '网络连接异常',
                    icon: 'none'
                });
                reject(err);
            }
        });
    });
};

const get = (url, data) => request({ url, method: 'GET', data });
const post = (url, data) => request({ url, method: 'POST', data });
const put = (url, data) => request({ url, method: 'PUT', data });
const del = (url, data) => request({ url, method: 'DELETE', data });

const formatImageURL = (url) => {
    // console.log('[formatImageURL] Input:', url);
    const placeholder = 'https://picsum.photos/seed/product/400/300';

    if (!url || url === 'null' || url === 'undefined') {
        // console.log('[formatImageURL] Empty/null, using placeholder');
        return placeholder;
    }

    if (url.indexOf('http') === 0) {
        return url;
    }

    if (url.indexOf('[') === 0 && url.indexOf(']') !== -1) {
        try {
            const arr = JSON.parse(url);
            if (arr.length > 0) return formatImageURL(arr[0]);
        } catch (e) { }
    }

    if (url.indexOf('/uploads/') === 0) {
        const fullURL = 'http://127.0.0.1:8080' + url;
        console.log('[formatImageURL] Success:', url, '->', fullURL);
        return fullURL;
    }

    if (url.indexOf('uploads/') === 0) {
        const fullURL = 'http://127.0.0.1:8080/' + url;
        console.log('[formatImageURL] Success (missing slash):', url, '->', fullURL);
        return fullURL;
    }

    return url;
};

module.exports = {
    request,
    get,
    post,
    put,
    del,
    formatImageURL
};
