import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Tag, Image, Space, Button, message, Dropdown, Popconfirm } from 'antd';
import { PlusOutlined, DownOutlined, DeleteOutlined } from '@ant-design/icons';
import request from '@/utils/request';
import AppLayout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import GenericTable from '@/pages/GenericTable';
import ProtectedRoute from './ProtectedRoute';

// Table Configurations
const tableConfigs = {
    users: {
        endpoint: '/admin/users',
        title: '用户列表',
        searchHint: '搜索用户名、登录账号',
        columns: [
            { title: 'ID', dataIndex: 'id', width: 80 },
            {
                title: '头像',
                dataIndex: 'avatar',
                width: 80,
                hideInForm: true,
                render: (text) => {
                    const baseUrl = 'http://localhost:8080';
                    const src = text?.startsWith('/uploads/') ? baseUrl + text : text;
                    return <img src={src || 'https://picsum.photos/seed/default/40/40'} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt="avatar" />;
                }
            },
            { title: '登陆账号', dataIndex: 'phone' },
            { title: '角色', dataIndex: 'role' },
            { title: '真实姓名', dataIndex: 'realName' },
            { title: '状态', dataIndex: 'status' },
            { title: '创建时间', dataIndex: 'createdAt' }
        ]
    },
    farmers: {
        endpoint: '/admin/farmers/all',
        title: '农户管理',
        allowAdd: false,
        searchHint: '搜索农场名称、地址',
        columns: [
            { title: 'ID', dataIndex: 'id', width: 80 },
            { title: '农场名称', dataIndex: 'farmName' },
            { title: '省份', dataIndex: 'province' },
            { title: '城市', dataIndex: 'city' },
            { title: '详细地址', dataIndex: 'address' },
            { title: '描述', dataIndex: 'description', ellipsis: true },
            {
                title: '认证状态',
                dataIndex: 'verified',
                render: (_, record) => {
                    if (record.auditStatus === 'APPROVED' || record.verified === true) {
                        return <Tag color="green">已认证</Tag>;
                    } else if (record.auditStatus === 'REJECTED') {
                        return <Tag color="red">已拒绝</Tag>;
                    } else if (record.auditStatus === 'NOT_SUBMITTED') {
                        return <Tag color="blue">待提交</Tag>;
                    } else {
                        return <Tag color="orange">待审核</Tag>;
                    }
                }
            },
            { title: '入驻时间', dataIndex: 'createdAt' },
            {
                title: '操作',
                key: 'action',
                render: (_, record) => {
                    // Only show audit button when status is strictly PENDING
                    const isPending = record.auditStatus === 'PENDING';

                    return (
                        <Space>
                            {isPending && (
                                <Dropdown
                                    menu={{
                                        items: [
                                            {
                                                key: 'approve',
                                                label: <span style={{ color: '#52c41a' }}>通过</span>,
                                                onClick: async () => {
                                                    try {
                                                        const res = await request.post(`/admin/farmers/${record.id}/verify`);
                                                        if (res.code === 200) {
                                                            message.success('农户认证已通过');
                                                            window.dispatchEvent(new CustomEvent('refresh-table'));
                                                        } else {
                                                            message.error(res.message || '操作失败');
                                                        }
                                                    } catch (e) {
                                                        message.error('操作异常');
                                                    }
                                                }
                                            },
                                            {
                                                key: 'reject',
                                                label: <span style={{ color: '#ff4d4f' }}>拒绝</span>,
                                                onClick: async () => {
                                                    try {
                                                        const res = await request.post(`/admin/farmers/${record.id}/reject?reason=不符合要求`);
                                                        if (res.code === 200) {
                                                            message.success('农户认证已拒绝');
                                                            window.dispatchEvent(new CustomEvent('refresh-table'));
                                                        } else {
                                                            message.error(res.message || '操作失败');
                                                        }
                                                    } catch (e) {
                                                        message.error('操作异常');
                                                    }
                                                }
                                            }
                                        ]
                                    }}
                                >
                                    <Button
                                        size="small"
                                        style={{
                                            fontSize: '12px',
                                            height: '24px',
                                            padding: '0 8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            borderColor: '#1890ff',
                                            color: '#1890ff'
                                        }}
                                    >
                                        审核 <DownOutlined />
                                    </Button>
                                </Dropdown>
                            )}
                            <Popconfirm
                                title="确定要删除这个农户吗？"
                                onConfirm={async () => {
                                    try {
                                        const res = await request.delete(`/admin/farmers/${record.id}`);
                                        if (res.code === 200) {
                                            message.success('删除成功');
                                            window.dispatchEvent(new CustomEvent('refresh-table'));
                                        } else {
                                            message.error(res.message || '删除失败');
                                        }
                                    } catch (e) {
                                        message.error('删除异常');
                                    }
                                }}
                                okText="确定"
                                cancelText="取消"
                            >
                                <Button danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </Space>
                    )
                }
            }
        ],
        hideActions: true
    },
    products: {
        endpoint: '/admin/products/all',
        title: '产品列表',
        searchHint: '搜索产品名称、分类',
        columns: [
            {
                title: '图片',
                dataIndex: 'images',
                width: 80,
                hideInForm: true,
                render: (text, record) => {
                    const baseUrl = 'http://localhost:8080';
                    let src = record.image; // Fallback to main image

                    if (record.images) {
                        try {
                            const detailImages = typeof record.images === 'string' ? JSON.parse(record.images) : record.images;
                            if (Array.isArray(detailImages) && detailImages.length > 0) {
                                src = detailImages[0];
                            }
                        } catch (e) {
                            console.error('Parse images failed', e);
                        }
                    }

                    const finalSrc = src?.startsWith('/uploads/') ? baseUrl + src : src;
                    return <img src={finalSrc || 'https://picsum.photos/seed/prod/40/40'} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} alt="product" />;
                }
            },
            { title: '产品名称', dataIndex: 'name', ellipsis: true },
            {
                title: '产品价格',
                dataIndex: 'price',
                render: (v, record) => `${v}元/${record.unit || '斤'}`
            },
            { title: '库存数量', dataIndex: 'stock', width: 100 },
            { title: '产地', dataIndex: 'origin', ellipsis: true, width: 120 },
            { title: '产品描述', dataIndex: 'description', ellipsis: true },
            {
                title: '推广标签',
                dataIndex: 'badge',
                width: 150,
                render: (text) => {
                    if (!text) return null;
                    return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
                            {text.split(/[,，]/).filter(t => t && t.trim()).map(tag => (
                                <Tag color="green" key={tag} style={{ margin: 0, fontSize: '12px' }}>{tag}</Tag>
                            ))}
                        </div>
                    );
                }
            },
            {
                title: '状态',
                dataIndex: 'status',
                width: 100,
                type: 'select',
                options: [
                    { label: '待审核', value: 'PENDING' },
                    { label: '已上架', value: 'APPROVED' },
                    { label: '已驳回', value: 'REJECTED' },
                    { label: '已下架', value: 'OFFLINE' }
                ],
                render: (status) => {
                    const statusMap = {
                        'PENDING': { color: 'gold', text: '待审核' },
                        'APPROVED': { color: 'green', text: '已上架' },
                        'REJECTED': { color: 'red', text: '已驳回' },
                        'OFFLINE': { color: 'gray', text: '已下架' }
                    };
                    const s = statusMap[status] || { color: 'default', text: status };
                    return <Tag color={s.color}>{s.text}</Tag>;
                }
            },
            { title: '归属农户', dataIndex: ['farmer', 'id'], type: 'farmer-select', hideInTable: true, rules: [{ required: true }] },
            { title: '单位', dataIndex: 'unit', hideInTable: true, placeholder: '例：斤、份、箱' },
        ]
    },
    orders: {
        endpoint: '/admin/orders/all',
        title: '订单管理',
        searchHint: '搜索订单号、用户名',
        columns: [
            { title: '订单号', dataIndex: 'orderNo', width: 160 },
            {
                title: '商品明细',
                dataIndex: 'items',
                width: 200,
                hideInForm: true,
                render: (items) => {
                    if (!items || items.length === 0) return '-';
                    return (
                        <div style={{ fontSize: 12 }}>
                            {items.slice(0, 2).map((item, idx) => (
                                <div key={idx} style={{ marginBottom: 4 }}>
                                    <span style={{ fontWeight: 500 }}>{item.productName}</span>
                                    <span style={{ color: '#666', marginLeft: 8 }}>x{item.quantity}</span>
                                    <span style={{ color: '#d4af37', marginLeft: 8 }}>¥{item.subtotal}</span>
                                </div>
                            ))}
                            {items.length > 2 && <div style={{ color: '#999' }}>...共{items.length}件商品</div>}
                        </div>
                    );
                }
            },
            { title: '订单总额', dataIndex: 'totalAmount', width: 100, render: (v) => `¥${v}` },
            {
                title: '状态',
                dataIndex: 'status',
                width: 100,
                type: 'select',
                options: [
                    { label: '待支付', value: 'PENDING' },
                    { label: '待发货', value: 'PAID' },
                    { label: '待收货', value: 'SHIPPED' },
                    { label: '已完成', value: 'COMPLETED' },
                    { label: '已取消', value: 'CANCELLED' }
                ],
                render: (status) => {
                    const map = {
                        'PENDING': { color: 'gold', text: '待支付' },
                        'PAID': { color: 'cyan', text: '待发货' },
                        'SHIPPED': { color: 'blue', text: '待收货' },
                        'COMPLETED': { color: 'green', text: '已完成' },
                        'CANCELLED': { color: 'red', text: '已取消' }
                    };
                    const s = map[String(status).toUpperCase()] || { color: 'default', text: status };
                    return <Tag color={s.color}>{s.text}</Tag>;
                }
            },
            { title: '下单用户', dataIndex: ['user', 'realName'], width: 100 },
            { title: '下单时间', dataIndex: 'createdAt', width: 170 },
            {
                title: '收货地址',
                dataIndex: 'addressSnapshot',
                hideInTable: true,
                hideInForm: true
            }
        ],
        allowAdd: false
    },
    addresses: {
        endpoint: '/admin/addresses/all',
        title: '收货地址',
        searchHint: '搜索收货人、电话',
        columns: [
            { title: '用户名', dataIndex: ['user', 'realName'], hideInForm: true },
            { title: '用户ID', dataIndex: ['user', 'id'], type: 'consumer-select', hideInTable: true },
            { title: '收货人', dataIndex: 'name' },
            { title: '联系电话', dataIndex: 'phone' },
            { title: '省份', dataIndex: 'province' },
            { title: '城市', dataIndex: 'city' },
            { title: '详细地址', dataIndex: 'address' }
        ]
    },
    coupons: {
        endpoint: '/admin/coupons/all',
        title: '优惠券',
        searchHint: '搜索优惠券名称',
        columns: [
            { title: 'ID', dataIndex: 'id', width: 80 },
            { title: '名称', dataIndex: 'name' },
            { title: '类型', dataIndex: 'type', hideInTable: true },
            { title: '面值', dataIndex: 'value' },
            { title: '最低消费', dataIndex: 'minSpend' },
            { title: '剩余数量', dataIndex: 'remainingCount' },
            {
                title: '状态',
                dataIndex: 'status',
                type: 'select',
                options: [
                    { label: '库存正常', value: 1 },
                    { label: '库存不足', value: 0 }
                ]
            }
        ]
    },
    user_coupons: {
        endpoint: '/admin/user-coupons/all',
        title: '用户优惠券',
        searchHint: '搜索用户姓名、优惠券名称',
        columns: [
            { title: '用户姓名', dataIndex: ['user', 'realName'], hideInForm: true },
            { title: '选择用户', dataIndex: ['user', 'id'], type: 'consumer-select', required: true, hideInTable: true },
            { title: '优惠券', dataIndex: ['coupon', 'name'], hideInForm: true },
            { title: '选择优惠券', dataIndex: ['coupon', 'id'], type: 'coupon-select', required: true, hideInTable: true },
            { title: '领取时间', dataIndex: 'getTime', type: 'datetime', required: true }
        ]
    },
    reviews: {
        endpoint: '/admin/reviews/all',
        title: '评价管理',
        allowAdd: false,
        searchHint: '搜索评价内容、商品、用户',
        columns: [
            { title: '评价商品', dataIndex: ['product', 'name'] },
            { title: '评价人', dataIndex: ['user', 'realName'] },
            { title: '评分', dataIndex: 'rating' },
            { title: '内容', dataIndex: 'content' },
            { title: '评价时间', dataIndex: 'createdAt' }
        ],
        allowEdit: false,
        allowDelete: false,
        hideActions: true
    },

    bank_accounts: {
        endpoint: '/admin/bank-accounts/all',
        title: '银行账户',
        searchHint: '搜索银行名称、账号、持卡人',
        columns: [
            { title: '农户ID', dataIndex: 'farmerId', type: 'farmer-select' },
            { title: '银行名称', dataIndex: 'bankName' },
            { title: '银行账号', dataIndex: 'accountNumber' },
            { title: '开户人', dataIndex: 'accountHolder' }
        ]
    },
    farm_photos: {
        endpoint: '/admin/farm-photos/all',
        title: '农场照片',
        hideSearch: true,
        viewMode: 'grid',
        columns: [
            { title: '农户ID', dataIndex: 'farmerId', type: 'farmer-select', required: true },
            { title: '图片', dataIndex: 'url', type: 'multi-image', required: true }
        ]
    }
};

const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <AppLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Dashboard />
            },
            ...Object.entries(tableConfigs).map(([key, config]) => ({
                path: key,
                element: <GenericTable config={config} key={key} />
            })),
            {
                path: '*',
                element: <Navigate to="/" replace />
            }
        ]
    }
], {
    future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true
    }
});

export default router;
