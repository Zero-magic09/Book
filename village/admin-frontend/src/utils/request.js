import axios from 'axios'
import { message } from 'antd'

const request = axios.create({
    baseURL: '/api',
    timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 响应拦截器
request.interceptors.response.use(
    response => {
        const res = response.data
        // 假设后端格式为 { code: 200, data: ..., message: ... }
        if (res.code !== 200) {
            message.error(res.message || '请求失败')
            // 401: 未登录
            if (res.code === 401) {
                localStorage.removeItem('token')
                window.location.href = '/login'
            }
            return Promise.reject(new Error(res.message || 'Error'))
        }
        return res
    },
    error => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token')
            window.location.href = '/login'
        } else {
            message.error(error.message || '网络错误')
        }
        return Promise.reject(error)
    }
)

export default request
