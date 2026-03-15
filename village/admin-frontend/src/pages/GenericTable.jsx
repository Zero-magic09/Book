import React, { useRef, useState, useEffect } from 'react';
import { Table, Button, Card, Tag, Modal, Form, Input, message, Popconfirm, Space, Select, Upload, List, Row, Col, Typography, Avatar, Image as AntImage, DatePicker } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import request from '@/utils/request';
import { chinaRegions } from '@/utils/chinaRegions';

const GenericTable = ({ config }) => {
    // Custom component to display values in View mode (handles Form.Item value prop)
    const DisplayValue = ({ value, statusMap, field, record }) => {
        let text = value;
        const baseUrl = 'http://localhost:8080';

        if ((field === 'image' || field === 'avatar') && value) {
            const src = value.startsWith('http') ? value : baseUrl + value;
            return <img src={src} style={{ width: 100, borderRadius: 8 }} alt="main" />;
        }

        if (field === 'images' && value) {
            try {
                const urls = typeof value === 'string' ? JSON.parse(value) : value;
                return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {urls.map((url, i) => {
                            const src = url.startsWith('http') ? url : baseUrl + url;
                            return <img key={i} src={src} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} alt={`thumb-${i}`} />;
                        })}
                    </div>
                );
            } catch (e) {
                return <div>{value}</div>;
            }
        }

        if (field === 'badge' && value) {
            return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', width: 'fit-content' }}>
                    {String(value).split(/[,，]/).filter(v => v && v.trim()).map(tag => (
                        <Tag key={tag} color="success" style={{ margin: 0 }}>{tag}</Tag>
                    ))}
                </div>
            );
        }

        if (field === 'addressSnapshot' && value) {
            // 检查订单状态：只有非待支付状态才显示地址
            const orderStatus = record?.status;
            if (orderStatus === 'PENDING') {
                return (
                    <div style={{
                        background: '#fff7e6',
                        borderRadius: '8px',
                        border: '1px solid #ffd591',
                        padding: '12px',
                        color: '#d46b08',
                        textAlign: 'center'
                    }}>
                        <span>⏳ 用户支付后显示收货地址</span>
                    </div>
                );
            }

            let fullStr = value;
            try {
                const parsed = JSON.parse(value);
                fullStr = parsed.address || value;
            } catch (e) {
                fullStr = value;
            }

            // 解析格式: "详细地址 (姓名 电话)"
            // 正则匹配: 贪婪匹配地址部分，直到最后的括号
            const match = fullStr.match(/^(.*)\s+\((.*)\s+(.*)\)$/);

            if (match) {
                const address = match[1];
                const name = match[2];
                const phone = match[3];
                return (
                    <div style={{
                        background: '#fafafa',
                        borderRadius: '8px',
                        border: '1px solid #f0f0f0',
                        padding: '12px',
                        lineHeight: '24px'
                    }}>
                        <div style={{ display: 'flex', marginBottom: '4px' }}>
                            <span style={{ color: '#666', width: '80px', flexShrink: 0 }}>下单用户：</span>
                            <span style={{ fontSize: '14px', color: '#333' }}>{name}</span>
                        </div>
                        <div style={{ display: 'flex', marginBottom: '4px' }}>
                            <span style={{ color: '#666', width: '80px', flexShrink: 0 }}>联系方式：</span>
                            <span style={{ fontSize: '14px', color: '#333' }}>{phone}</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <span style={{ color: '#666', width: '80px', flexShrink: 0 }}>详细地址：</span>
                            <span style={{ fontSize: '14px', color: '#333' }}>{address}</span>
                        </div>
                    </div>
                );
            }

            return text;
        }

        // 订单商品明细
        if (field === 'items' && Array.isArray(value) && value.length > 0) {
            return (
                <div style={{
                    background: '#fafafa',
                    borderRadius: '8px',
                    border: '1px solid #f0f0f0',
                    padding: '12px'
                }}>
                    {value.map((item, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: idx < value.length - 1 ? '1px solid #f0f0f0' : 'none'
                        }}>
                            <span style={{ fontWeight: 500 }}>{item.productName}</span>
                            <span style={{ color: '#666' }}>x{item.quantity}</span>
                            <span style={{ color: '#d4af37' }}>¥{item.subtotal || item.price}</span>
                        </div>
                    ))}
                </div>
            );
        }

        if (field === 'auditStatus') {
            const map = {
                'PENDING': '等待审核',
                'APPROVED': '通过审核',
                'REJECTED': '已驳回'
            };
            text = map[value] || value;
        } else if (field === 'salesStatus') {
            // Logic: If auditStatus is PENDING, salesStatus display as Not On Sale
            if (record && record.auditStatus === 'PENDING') {
                text = '未上架';
            } else {
                const map = {
                    'ON_SALE': '在售中',
                    'OFFLINE': '已下架',
                    'NOT_ON_SALE': '未上架'
                };
                text = map[value] || value;
            }
        } else if (field && ['createdAt', 'updatedAt', 'traceTime', 'getTime'].includes(field)) {
            text = formatDate(value);
        } else if (value && typeof value !== 'object') {
            const mapKey = String(value);
            let mapItem = statusMap[mapKey] || statusMap[mapKey.toUpperCase()];

            // 为订单详情页提供更准确的状态映射 (防止显示为"待审")
            if (field === 'status' && (record.orderNo || record.id?.toString().startsWith('ORD'))) {
                const orderStatusMap = {
                    'PENDING': '待支付',
                    'PAID': '待发货',
                    'SHIPPED': '待收货',
                    'COMPLETED': '已完成',
                    'CANCELLED': '已取消'
                };
                const statusText = orderStatusMap[mapKey.toUpperCase()];
                if (statusText) text = statusText;
                else if (mapItem) text = mapItem.text;
            } else if (mapItem) {
                text = mapItem.text;
            }
        } else if (value && typeof value === 'object') {
            // Handle nested objects like farmer or user
            if (value.farmName) text = value.farmName;
            else if (value.realName) text = value.realName;
            else text = JSON.stringify(value);
        }
        return (
            <div
                style={{
                    padding: '5px 12px',
                    background: '#fafafa',
                    borderRadius: '8px',
                    border: '1px solid #f0f0f0',
                    color: 'rgba(0, 0, 0, 0.88)',
                    minHeight: '32px',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                {text}
            </div>
        );
    };

    const [data, setData] = useState([]); // This will now hold list of items (possibly grouped)
    const [rawData, setRawData] = useState([]); // Store original response
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', 'add'
    const [currentItem, setCurrentItem] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [consumers, setConsumers] = useState([]);
    const [farmers, setFarmers] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [form] = Form.useForm();
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');

    // Watch farmerId at top level for dynamic capacity calculation
    const selectedFarmerId = Form.useWatch('farmerId', form);

    useEffect(() => {
        fetchData();
        // Check if any column needs consumers or farmers
        const needsConsumers = config.columns.some(col =>
            col.type === 'consumer-select' || (col.dataIndex && String(col.dataIndex).includes('user'))
        ) || config.endpoint.includes('addresses') || config.endpoint.includes('orders');

        const needsFarmers = config.columns.some(col =>
            col.type === 'farmer-select' || (col.dataIndex && String(col.dataIndex).includes('farmer'))
        ) || config.endpoint.includes('products') || config.endpoint.includes('bank-accounts') || config.endpoint.includes('farm-photos');

        const needsCoupons = config.columns.some(col =>
            col.type === 'coupon-select' || (col.dataIndex && String(col.dataIndex).includes('coupon'))
        ) || config.endpoint.includes('user-coupons');

        if (needsConsumers) {
            fetchConsumers();
        }
        if (needsFarmers) {
            fetchFarmers();
        }
        if (needsCoupons) {
            fetchCoupons();
        }

        const handleRefresh = () => fetchData();
        window.addEventListener('refresh-table', handleRefresh);
        return () => window.removeEventListener('refresh-table', handleRefresh);
    }, [config.endpoint, searchText]);

    const fetchFarmers = async () => {
        try {
            const res = await request.get('/admin/farmers/all');
            if (res.code === 200) {
                setFarmers(res.data || []);
            }
        } catch (e) {
            console.error('Fetch farmers failed', e);
        }
    };

    const fetchCoupons = async () => {
        try {
            const res = await request.get('/admin/coupons/all');
            if (res.code === 200) {
                setCoupons(res.data || []);
            }
        } catch (e) {
            console.error('Fetch coupons failed', e);
        }
    };

    const fetchConsumers = async () => {
        try {
            const res = await request.get('/admin/users?role=CONSUMER&size=1000');
            if (res.code === 200) {
                const list = res.data.content || [];
                // Additional frontend filter as safety
                setConsumers(list.filter(u => u.role === 'CONSUMER'));
            }
        } catch (e) {
            console.error('Fetch consumers failed', e);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = config.endpoint;
            if (searchText) {
                const connector = url.includes('?') ? '&' : '?';
                url += `${connector}keyword=${encodeURIComponent(searchText)}`;
            }
            const res = await request.get(url);
            if (res.code === 200) {
                const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
                setRawData(list);
            }
        } catch (e) {
            message.error('获取数据失败');
        } finally {
            setLoading(false);
        }
    };

    // Derived data based on viewMode and farmers list
    useEffect(() => {
        if (config.viewMode === 'grid') {
            const grouped = {};
            rawData.forEach(item => {
                const fid = item.farmerId;
                if (!grouped[fid]) {
                    grouped[fid] = {
                        farmerId: fid,
                        farmer: farmers.find(f => f.id === fid),
                        photos: []
                    };
                }
                grouped[fid].photos.push(item);
            });
            setData(Object.values(grouped));
        } else {
            setData(rawData);
        }
    }, [rawData, farmers, config.viewMode]);

    const handleDelete = async (id) => {
        try {
            // Remove '/all' suffix if present to get base CRUD path
            const baseEndpoint = config.endpoint.endsWith('/all')
                ? config.endpoint.slice(0, -4)
                : config.endpoint;

            const res = await request.delete(`${baseEndpoint}/${id}`);
            if (res.code === 200) {
                message.success('删除成功');
                fetchData();
            } else {
                message.error(res.message || '删除失败');
            }
        } catch (e) {
            message.error('删除操作失败');
        }
    };

    const handleDeletePhoto = async (photoId) => {
        try {
            const res = await request.delete(`/admin/farm-photos/${photoId}`);
            if (res.code === 200) {
                message.success('已删除单张图片');
                fetchData();
            } else {
                message.error(res.message || '删除失败');
            }
        } catch (e) {
            message.error('删除请求失败');
        }
    };

    const handleSave = async (values) => {
        try {
            // Pre-process values to handle image arrays
            const processedValues = { ...values };

            // Check if we are in farm_photos batch mode (Admin side)
            const isFarmPhotosBatch = config.endpoint === '/admin/farm-photos/all' && Array.isArray(values.url);

            if (isFarmPhotosBatch && modalMode === 'add') {
                // Specialized batch save for farm photos (CREATE only)
                const urls = values.url.map(f => {
                    if (f.response) return f.response.data;
                    if (f.url) return f.url.replace('http://localhost:8080', '');
                    return '';
                }).filter(u => !!u);

                const res = await request.post('/admin/farm-photos/batch', {
                    farmerId: values.farmerId,
                    urls: urls
                });

                if (res.code === 200) {
                    message.success('批量提交成功');
                    setModalVisible(false);
                    fetchData();
                } else {
                    message.error(res.message || '操作失败');
                }
                return;
            }

            // Find fields that are multi-image and serialize them for standard JSON CRUD
            config.columns.forEach(col => {
                const field = typeof col === 'object' ? col.dataIndex : col;
                if (field === 'images' || col.type === 'multi-image') {
                    const val = processedValues[field];
                    if (Array.isArray(val) && val.length > 0 && (val[0].uid || val[0].response)) {
                        // It's a fileList, convert to URL array string
                        const urls = val.map(f => {
                            if (f.response) return f.response.data; // New upload
                            if (f.url) {
                                // Existing image, strip domain if present to keep relative
                                return f.url.replace('http://localhost:8080', '');
                            }
                            return '';
                        }).filter(url => !!url);
                        processedValues[field] = JSON.stringify(urls);
                    }
                }
            });

            const baseEndpoint = config.endpoint.endsWith('/all')
                ? config.endpoint.slice(0, -4)
                : config.endpoint;

            let res;
            if (modalMode === 'edit') {
                res = await request.put(`${baseEndpoint}/${currentItem.id}`, processedValues);
            } else {
                res = await request.post(baseEndpoint, processedValues);
            }

            if (res.code === 200) {
                message.success(modalMode === 'edit' ? '更新成功' : '新增成功');
                setModalVisible(false);
                fetchData();
            } else {
                message.error(res.message || '操作失败');
            }
        } catch (e) {
            message.error('操作执行失败');
        }
    };

    const statusMap = {
        'ACTIVE': { color: 'green', text: '正常' },
        '1': { color: 'green', text: '库存正常' },
        '0': { color: 'red', text: '库存不足' },
        'APPROVED': { color: 'green', text: '已审核' },
        'PENDING': { color: 'gold', text: '待审' },
        'DISABLED': { color: 'red', text: '禁用' },
        'OFFLINE': { color: 'red', text: '下架' },
        'true': { color: 'green', text: '已认证' },
        'false': { color: 'orange', text: '未认证' },
        'COMPLETED': { color: 'green', text: '已完成' },
        'SHIPPED': { color: 'blue', text: '已发货' },
        'PAID': { color: 'blue', text: '已支付' },
        'DRAFT': { color: 'orange', text: '草稿' },
        // Roles
        'ADMIN': { color: 'geekblue', text: '管理员' },
        'FARMER': { color: 'cyan', text: '农户' },
        'CONSUMER': { color: 'default', text: '消费者' }
    };

    const handleCancelPreview = () => setPreviewOpen(false);
    const handlePreview = async (file) => {
        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
        setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
    };

    const getBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });

    const formatDate = (isoString) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${y}年${m}月${d}日 ${h}:${min}`;
    };

    const columns = [
        ...config.columns.filter(col => !col.hideInTable).map(col => {
            const field = typeof col === 'object' ? col.dataIndex : col;
            const title = typeof col === 'object' ? col.title : col;

            return {
                ...(typeof col === 'object' ? col : {}),
                title: title,
                dataIndex: field,
                key: Array.isArray(field) ? field.join('.') : field,
                render: (text, record) => {
                    if (col.render) return col.render(text, record);
                    if (field === 'status' || field === 'verified' || field === 'role' || field === 'type') {
                        const s = statusMap[String(text)] || statusMap[String(text).toUpperCase()];
                        return s ? <Tag color={s.color}>{s.text}</Tag> : <Tag>{text}</Tag>;
                    }
                    if (['createdAt', 'updatedAt', 'traceTime', 'getTime'].includes(field)) {
                        return formatDate(text);
                    }
                    if (typeof text === 'boolean') return text ? '是' : '否';
                    return text;
                }
            };
        })
    ];

    if (!config.hideActions) {
        columns.push({
            title: '操作',
            key: 'action',
            align: 'center',
            width: 140,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="link"
                        size="small"
                        icon={<SearchOutlined />}
                        onClick={() => {
                            setCurrentItem(record);
                            setModalMode('view');
                            form.setFieldsValue(record);
                            setModalVisible(true);
                        }}
                    />
                    {config.editable !== false && record.phone !== 'admin' && (
                        <>
                            <Button
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => {
                                    setCurrentItem(record);
                                    setModalMode('edit');
                                    // Reset password field to ensure no leakage from previous edits
                                    form.setFieldsValue({ ...record, password: '' });
                                    setModalVisible(true);
                                }}
                            />
                            <Popconfirm
                                title="确定要删除这一条记录吗？"
                                onConfirm={() => handleDelete(record.id)}
                                okText="确定"
                                cancelText="取消"
                            >
                                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </>
                    )}
                </Space>
            )
        });
    }

    return (
        <div style={{ animation: 'slideUp 0.6s ease-out' }}>
            <Card
                title={
                    <Space size="middle">
                        <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '24px', color: '#1a4d2e', fontWeight: 700 }}>
                            {config.title}
                        </span>
                        {!config.hideSearch && (
                            <Input
                                size="large"
                                placeholder={config.searchHint || "输入关键词搜索..."}
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                allowClear
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                style={{ width: 250, borderRadius: '8px' }}
                            />
                        )}
                    </Space>
                }
                extra={
                    <Space>
                        {config.editable !== false && config.allowAdd !== false && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setCurrentItem(null);
                                    setModalMode('add');
                                    form.resetFields();
                                    setModalVisible(true);
                                }}
                                style={{ borderRadius: '8px', background: '#d4af37', borderColor: '#d4af37' }}
                            >
                                新增条目
                            </Button>
                        )}
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchData}
                            style={{ borderRadius: '8px', borderColor: '#1a4d2e', color: '#1a4d2e' }}
                        >
                            刷新
                        </Button>
                    </Space>
                }
                variant="borderless"
                style={{
                    borderRadius: '24px',
                    boxShadow: '0 10px 30px rgba(26, 77, 46, 0.04)',
                    border: '1px solid rgba(26, 77, 46, 0.05)'
                }}
            >
                {config.viewMode === 'grid' ? (
                    <List
                        grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
                        dataSource={data}
                        loading={loading}
                        renderItem={(item) => (
                            <List.Item>
                                <Card
                                    hoverable
                                    style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #f0f0f0' }}
                                    bodyStyle={{ padding: '20px' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                                        <Avatar
                                            size={48}
                                            src={item.farmer?.user?.avatar ? (item.farmer.user.avatar.startsWith('http') ? item.farmer.user.avatar : `http://localhost:8080${item.farmer.user.avatar}`) : null}
                                            icon={!item.farmer?.user?.avatar && <UserOutlined />}
                                            style={{ background: '#1a4d2e', marginRight: '12px' }}
                                        />
                                        <div>
                                            <Typography.Title level={5} style={{ margin: 0, color: '#1a4d2e' }}>
                                                {item.farmer?.user?.realName || item.farmer?.farmName || `农户 #${item.farmerId}`}
                                            </Typography.Title>
                                            <div style={{ marginTop: 4 }}>
                                                {item.farmer?.verified && <Tag color="green" style={{ marginRight: 0 }}>高级农户</Tag>}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                        {item.photos.map((p, idx) => {
                                            const baseUrl = 'http://localhost:8080';
                                            const src = p.url?.startsWith('/uploads/') ? baseUrl + p.url : p.url;
                                            return (
                                                <div key={idx} style={{ position: 'relative' }}>
                                                    <AntImage
                                                        src={src}
                                                        width="100%"
                                                        height={80}
                                                        style={{ objectFit: 'cover', borderRadius: '8px' }}
                                                    />
                                                    <Popconfirm
                                                        title="删除这张图片？"
                                                        onConfirm={() => handleDeletePhoto(p.id)}
                                                        okText="是"
                                                        cancelText="否"
                                                    >
                                                        <Button
                                                            size="small"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            style={{
                                                                position: 'absolute',
                                                                top: 4,
                                                                right: 4,
                                                                width: 24,
                                                                height: 24,
                                                                padding: 0,
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                background: 'rgba(255,255,255,0.9)',
                                                                borderRadius: '4px',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                            }}
                                                        />
                                                    </Popconfirm>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ marginTop: '16px', textAlign: 'right' }}>
                                        <Button
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => {
                                                Modal.confirm({
                                                    title: '确定要删除该农户的所有照片吗？',
                                                    okText: '确定',
                                                    cancelText: '取消',
                                                    onOk: async () => {
                                                        try {
                                                            const res = await request.delete(`/admin/farm-photos/farmer/${item.farmerId}`);
                                                            if (res.code === 200) {
                                                                message.success('已成功清空该农户的所有照片');
                                                                fetchData();
                                                            } else {
                                                                message.error(res.message || '操作失败');
                                                            }
                                                        } catch (err) {
                                                            message.error('请求服务器失败');
                                                        }
                                                    }
                                                });
                                            }}
                                        >
                                            清空图片
                                        </Button>
                                    </div>
                                </Card>
                            </List.Item>
                        )}
                    />
                ) : (
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={data}
                        loading={loading}
                        pagination={{
                            defaultPageSize: 10,
                            showSizeChanger: true,
                            style: { marginTop: '24px' }
                        }}
                        style={{ borderRadius: '12px', overflow: 'hidden' }}
                    />
                )}

                <Modal
                    title={
                        <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '22px', color: '#1a4d2e' }}>
                            {modalMode === 'view' ? '查看详情' : (modalMode === 'edit' ? '编辑条目' : '新增条目')}
                        </span>
                    }
                    open={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    onOk={() => modalMode !== 'view' && form.submit()}
                    okText="保存"
                    cancelText="取消"
                    footer={modalMode === 'view' ? [
                        <Button key="close" onClick={() => setModalVisible(false)} style={{ borderRadius: '8px' }}>关闭</Button>
                    ] : undefined}
                    width={520}
                    centered
                    forceRender
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSave}
                        style={{ marginTop: '24px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}
                    >
                        {config.columns.map(col => {
                            const field = typeof col === 'object' ? col.dataIndex : col;
                            const title = typeof col === 'object' ? col.title : col;

                            // Skip hidden fields or fields without dataIndex
                            if (!field) return null;
                            // In edit/add mode, skip hideInForm fields; in view mode, show them
                            if (modalMode !== 'view' && col.hideInForm) return null;
                            if (field === 'id') return null;
                            if (modalMode !== 'view' && (field === 'createdAt' || field === 'updatedAt' || field === 'verified')) return null;

                            let inputNode;

                            if (modalMode === 'view') {
                                inputNode = <DisplayValue statusMap={statusMap} field={field} value={form.getFieldValue(field)} record={form.getFieldsValue(true)} />;
                            } else {
                                // Default input
                                inputNode = (
                                    <Input
                                        placeholder={col.placeholder}
                                        style={{
                                            borderRadius: '10px',
                                            padding: '8px 12px'
                                        }}
                                    />
                                );

                                if (col.type === 'select' && col.options) {
                                    inputNode = (
                                        <Select style={{ borderRadius: '10px', width: '100%' }}>
                                            {col.options.map(opt => (
                                                <Select.Option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    );
                                } else if (col.type === 'farmer-select') {
                                    inputNode = (
                                        <Select
                                            style={{ borderRadius: '10px', width: '100%' }}
                                            showSearch
                                            optionFilterProp="children"
                                            placeholder="请选择农户"
                                        >
                                            {farmers.map(f => (
                                                <Select.Option key={f.id} value={f.id}>
                                                    {f.farmName} (ID: {f.id})
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    );
                                } else if (col.type === 'consumer-select') {
                                    inputNode = (
                                        <Select
                                            style={{ borderRadius: '10px', width: '100%' }}
                                            showSearch
                                            optionFilterProp="children"
                                            placeholder="请选择用户"
                                        >

                                            {consumers.map(c => (
                                                <Select.Option key={c.id} value={c.id}>
                                                    {c.realName || c.phone} (ID: {c.id})
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    );
                                } else if (col.type === 'coupon-select') {
                                    inputNode = (
                                        <Select
                                            style={{ borderRadius: '10px', width: '100%' }}
                                            showSearch
                                            optionFilterProp="children"
                                            placeholder="请选择优惠券"
                                        >
                                            {coupons.map(c => (
                                                <Select.Option key={c.id} value={c.id}>
                                                    {c.name} (剩余: {c.remainingCount})
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    );
                                } else if (col.type === 'datetime') {
                                    inputNode = (
                                        <DatePicker
                                            showTime
                                            format="YYYY-MM-DD HH:mm:ss"
                                            style={{ borderRadius: '10px', width: '100%' }}
                                        />
                                    );
                                }

                                // Special handling for Single Image Upload
                                if ((field === 'image' || field === 'url' || col.type === 'image') && col.type !== 'multi-image') {
                                    return (
                                        <Form.Item
                                            key={field}
                                            name={field}
                                            label={<span style={{ fontWeight: 600, color: '#666' }}>{title}</span>}
                                            rules={[{ required: col.required, message: `请上传${title}` }]}
                                            getValueFromEvent={(e) => {
                                                if (Array.isArray(e)) return e;
                                                const file = e && e.fileList && e.fileList[0];
                                                if (file && file.status === 'done' && file.response) {
                                                    return file.response.data;
                                                }
                                                return e && e.fileList;
                                            }}
                                            getValueProps={(val) => {
                                                if (!val) return { fileList: [] };
                                                // If it's the internal fileList state during upload, return as is
                                                if (Array.isArray(val)) return { fileList: val };

                                                const baseUrl = 'http://localhost:8080';
                                                const displayUrl = val.startsWith('http') ? val : baseUrl + val;
                                                return {
                                                    fileList: [{
                                                        uid: '-1',
                                                        name: 'image.png',
                                                        status: 'done',
                                                        url: displayUrl,
                                                        response: { data: val }
                                                    }]
                                                };
                                            }}
                                        >
                                            <Upload
                                                action="/api/common/upload"
                                                listType="picture-card"
                                                maxCount={1}
                                                headers={{ Authorization: 'Bearer ' + localStorage.getItem('token') }}
                                                onPreview={handlePreview}
                                            >
                                                {!form.getFieldValue(field) && (
                                                    <div>
                                                        <PlusOutlined />
                                                        <div style={{ marginTop: 8 }}>上传图片</div>
                                                    </div>
                                                )}
                                            </Upload>
                                        </Form.Item>
                                    );
                                }

                                // Special handling for Multi-Image Upload (Batch Mode)
                                if (field === 'images' || col.type === 'multi-image') {
                                    // Detect capacity for farm photos
                                    let dynamicMax = col.maxCount || 6;
                                    let existingCount = 0;
                                    if (config.endpoint === '/admin/farm-photos/all') {
                                        // Use top-level watched value
                                        if (selectedFarmerId) {
                                            const group = data.find(g => g.farmerId === selectedFarmerId);
                                            existingCount = group ? group.photos.length : 0;
                                            dynamicMax = Math.max(0, 6 - (modalMode === 'edit' ? existingCount - 1 : existingCount));
                                        }
                                    }

                                    return (
                                        <Form.Item
                                            key={field}
                                            name={field}
                                            label={
                                                <Space>
                                                    <span style={{ fontWeight: 600, color: '#666' }}>{title}</span>
                                                    {config.endpoint === '/admin/farm-photos/all' && (
                                                        <span style={{ fontSize: '12px', color: '#999' }}>
                                                            (已传 {existingCount} 张, 还可传 {dynamicMax} 张)
                                                        </span>
                                                    )}
                                                </Space>
                                            }
                                            getValueFromEvent={(e) => {
                                                if (Array.isArray(e)) return e;
                                                return e && e.fileList;
                                            }}
                                            getValueProps={(val) => {
                                                if (!val) return { fileList: [] };
                                                // If it's already an array of file objects (from form state during editing), return it
                                                if (Array.isArray(val) && val.length > 0 && (val[0].uid || val[0].response)) {
                                                    return { fileList: val };
                                                }
                                                try {
                                                    const urls = typeof val === 'string' ? JSON.parse(val) : val;
                                                    if (!Array.isArray(urls)) return {
                                                        fileList: [
                                                            { uid: '-1', name: 'image.png', status: 'done', url: val.startsWith('http') ? val : `http://localhost:8080${val}`, response: { data: val } }
                                                        ]
                                                    };
                                                    return {
                                                        fileList: urls.map((url, index) => ({
                                                            uid: `-${index}`,
                                                            name: `image-${index}`,
                                                            status: 'done',
                                                            url: url.startsWith('http') ? url : `http://localhost:8080${url}`,
                                                            response: { data: url }
                                                        }))
                                                    };
                                                } catch (e) {
                                                    return { fileList: [] };
                                                }
                                            }}
                                        >
                                            <Upload
                                                action="/api/common/upload"
                                                listType="picture-card"
                                                multiple
                                                maxCount={dynamicMax}
                                                headers={{ Authorization: 'Bearer ' + localStorage.getItem('token') }}
                                                onPreview={handlePreview}
                                                disabled={dynamicMax <= 0 && modalMode !== 'edit'}
                                            >
                                                {dynamicMax > 0 && (
                                                    <div>
                                                        <PlusOutlined />
                                                        <div style={{ marginTop: 8 }}>上传 (上限6张)</div>
                                                    </div>
                                                )}
                                            </Upload>
                                        </Form.Item>
                                    );
                                }

                                // Special handling for User ID in Address table
                                if (Array.isArray(field) && field[0] === 'user' && field[1] === 'id') {
                                    inputNode = (
                                        <Select
                                            placeholder="请选择消费者"
                                            style={{ borderRadius: '10px' }}
                                            showSearch
                                            filterOption={(input, option) =>
                                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                            options={consumers.map(u => ({
                                                value: u.id,
                                                label: `${u.realName || '未命名'} (ID: ${u.id} | 手机: ${u.phone})`
                                            }))}
                                        />
                                    );
                                }

                                // Special handling for Farmer ID in Product table
                                if (Array.isArray(field) && field[0] === 'farmer' && field[1] === 'id') {
                                    inputNode = (
                                        <Select
                                            placeholder="请选择农户"
                                            style={{ borderRadius: '10px' }}
                                            showSearch
                                            filterOption={(input, option) =>
                                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                            options={farmers.map(f => ({
                                                value: f.id,
                                                label: `${f.farmName} (ID: ${f.id})`
                                            }))}
                                        />
                                    );
                                }

                                if (field === 'province') {
                                    inputNode = (
                                        <Select
                                            placeholder="请选择省份"
                                            onChange={() => form.setFieldsValue({ city: undefined })}
                                            style={{ borderRadius: '10px' }}
                                            showSearch
                                        >
                                            {Object.keys(chinaRegions).map(p => (
                                                <Select.Option key={p} value={p}>{p}</Select.Option>
                                            ))}
                                        </Select>
                                    );
                                } else if (field === 'salesStatus') {
                                    return (
                                        <Form.Item
                                            noStyle
                                            shouldUpdate={(prev, curr) => prev.auditStatus !== curr.auditStatus}
                                            key={field}
                                        >
                                            {({ getFieldValue }) => {
                                                const auditStatus = getFieldValue('auditStatus');
                                                const isApproved = auditStatus === 'APPROVED' || auditStatus === '通过审核';

                                                // Clone inputNode to add disabled prop
                                                const inputWithDisabled = React.cloneElement(inputNode, {
                                                    disabled: !isApproved,
                                                    placeholder: !isApproved ? '需审核通过后才可售卖' : inputNode.props.placeholder,
                                                    // If disabled, we might want to clear the value or set to a default, but controlled components shouldn't switch uncontrolled.
                                                    // Let's rely on form.setFieldsValue in an effect if we wanted to enforce it, but for now just validation.
                                                });

                                                return (
                                                    <Form.Item
                                                        name={field}
                                                        label={<span style={{ fontWeight: 600, color: '#666' }}>{title}</span>}
                                                        rules={[{ required: modalMode !== 'view' && isApproved, message: '请选择售卖状态' }]}
                                                    >
                                                        {inputWithDisabled}
                                                    </Form.Item>
                                                );
                                            }}
                                        </Form.Item>
                                    );
                                } else if (field === 'city') {
                                    return (
                                        <Form.Item
                                            noStyle
                                            shouldUpdate={(prev, curr) => prev.province !== curr.province}
                                            key={field}
                                        >
                                            {({ getFieldValue }) => {
                                                const province = getFieldValue('province');
                                                const cities = province ? (chinaRegions[province] || []) : [];
                                                return (
                                                    <Form.Item
                                                        name={field}
                                                        label={<span style={{ fontWeight: 600, color: '#666' }}>{title}</span>}
                                                        rules={[{ required: true, message: '请选择城市' }]}
                                                    >
                                                        <Select
                                                            placeholder="请选择城市"
                                                            disabled={!cities.length}
                                                            style={{ borderRadius: '10px' }}
                                                            showSearch
                                                        >
                                                            {cities.map(c => (
                                                                <Select.Option key={c} value={c}>{c}</Select.Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                );
                                            }}
                                        </Form.Item>
                                    );
                                } else if (field === 'role') {
                                    inputNode = (
                                        <Select style={{ borderRadius: '10px' }}>
                                            <Select.Option value="FARMER">农户</Select.Option>
                                            <Select.Option value="CONSUMER">消费者</Select.Option>
                                        </Select>
                                    );
                                } else if (field === 'status') {
                                    if (col.options) {
                                        inputNode = (
                                            <Select style={{ borderRadius: '10px' }}>
                                                {col.options.map(opt => (
                                                    <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                                                ))}
                                            </Select>
                                        );
                                    } else {
                                        inputNode = (
                                            <Select style={{ borderRadius: '10px' }}>
                                                <Select.Option value="ACTIVE">正常</Select.Option>
                                                <Select.Option value="DISABLED">异常</Select.Option>
                                            </Select>
                                        );
                                    }
                                } else if (field === 'badge') {
                                    inputNode = (
                                        <Select
                                            mode="tags"
                                            style={{ borderRadius: '10px' }}
                                            placeholder="请选择或输入标签"
                                            tokenSeparators={[',', '，', ' ']}
                                            options={col.options}
                                        />
                                    );
                                }
                            }

                            if (field === 'badge' && inputNode) {
                                // Special handling for badge value transformation (String <-> Array)
                                return (
                                    <Form.Item
                                        name={field}
                                        label={<span style={{ fontWeight: 600, color: '#666' }}>{title}</span>}
                                        key={field}
                                        getValueFromEvent={(val) => {
                                            if (Array.isArray(val)) return val.join(',');
                                            return val;
                                        }}
                                        getValueProps={(val) => {
                                            if (!val) return { value: [] };
                                            // Handle both English and Chinese commas
                                            return { value: String(val).split(/[,，]/).filter(v => v && v.trim()) };
                                        }}
                                    >
                                        {inputNode}
                                    </Form.Item>
                                );
                            }

                            return (
                                <Form.Item
                                    name={field}
                                    label={<span style={{ fontWeight: 600, color: '#666' }}>{title}</span>}
                                    key={field}
                                    rules={[{ required: modalMode !== 'view' }]}
                                >
                                    {inputNode}
                                </Form.Item>
                            );
                        })}

                        {/* Only show password reset for user table in edit mode */}
                        {modalMode === 'edit' && config.endpoint && config.endpoint.includes('/users') && (
                            <Form.Item
                                name="password"
                                label={<span style={{ fontWeight: 600, color: '#666' }}>重置密码</span>}
                            >
                                <Input.Password
                                    placeholder="若不修改请留空"
                                    style={{ borderRadius: '10px', padding: '8px 12px' }}
                                />
                            </Form.Item>
                        )}
                    </Form>
                </Modal>

                <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={handleCancelPreview}>
                    <img alt="example" style={{ width: '100%' }} src={previewImage} />
                </Modal>
            </Card>
        </div>
    );
};

export default GenericTable;
