import request from '@/utils/request'

export function login(data) {
    return request({
        url: '/auth/login',
        method: 'post',
        data
    })
}

export function getStats() {
    return request({
        url: '/admin/statistics',
        method: 'get'
    })
}

export function getOrderCurve() {
    return request({
        url: '/admin/statistics/orders',
        method: 'get'
    })
}

export function getActivities() {
    return request({
        url: '/admin/statistics/activities',
        method: 'get'
    })
}
