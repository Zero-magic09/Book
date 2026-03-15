import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, Statistic, List, Typography } from 'antd';
import { UserOutlined, ShopOutlined, ShoppingCartOutlined, AppstoreOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { getStats, getOrderCurve, getActivities } from '@/api/admin';
import { Line } from '@ant-design/plots';

const { Title, Text } = Typography;

const Dashboard = () => {
    const [stats, setStats] = useState({});
    const [orderData, setOrderData] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        fetchOrderCurve();
        fetchActivities();
    }, []);

    const fetchData = async () => {
        try {
            const res = await getStats();
            if (res.code === 200) {
                setStats(res.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchOrderCurve = async () => {
        try {
            const res = await getOrderCurve();
            if (res.code === 200) {
                setOrderData(res.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivities = async () => {
        try {
            const res = await getActivities();
            if (res.code === 200) {
                setActivities(res.data || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const config = useMemo(() => ({
        data: orderData,
        xField: 'day',
        yField: 'orders',
        smooth: true,
        color: '#1a4d2e',
        point: {
            size: 5,
            shape: 'circle',
            style: {
                fill: '#fff',
                stroke: '#1a4d2e',
                lineWidth: 2,
            },
        },
        tooltip: {
            showMarkers: false,
        },
        interactions: [
            {
                type: 'marker-active',
            },
        ],
        lineStyle: {
            lineWidth: 3,
            stroke: '#1a4d2e',
        },
        area: {
            style: {
                fill: 'linear-gradient(to bottom, rgba(26, 77, 46, 0.2) 0%, rgba(26, 77, 46, 0) 100%)',
            },
        },
    }), [orderData]);

    return (
        <div style={{ animation: 'slideUp 0.8s ease-out', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: 40 }}>
                <Title level={2} style={{
                    fontFamily: '"Playfair Display", serif',
                    color: '#1a4d2e',
                    margin: 0
                }}>
                    平台概况
                </Title>
                <Text type="secondary">欢迎回来，这是您今天的平台概览。</Text>
            </div>

            <Row gutter={[24, 24]}>
                {[
                    { title: '总用户规模', value: stats.totalUsers, icon: <UserOutlined />, color: '#1a4d2e', trend: '+12.5%' },
                    { title: '认证农户数', value: stats.verifiedFarmers, icon: <UserOutlined />, color: '#d4af37', trend: '+5.2%' },
                    { title: '上架产品总数', value: stats.totalProducts, icon: <ShopOutlined />, color: '#1a4d2e', trend: '+8.1%' },
                    { title: '待审核产品', value: stats.pendingProducts, icon: <ShopOutlined />, color: '#faad14', trend: '需跟进' },
                    { title: '累计订单量', value: stats.totalOrders, icon: <ShoppingCartOutlined />, color: '#1a4d2e', trend: '+20.4%' },
                    { title: '活跃展示专区', value: stats.activeZones, icon: <AppstoreOutlined />, color: '#d4af37', trend: '稳定' },
                ].map((item, index) => (
                    <Col xs={24} sm={12} lg={8} xl={4} key={index}>
                        <Card
                            bordered={false}
                            style={{
                                borderRadius: '24px',
                                boxShadow: '0 8px 24px rgba(26, 77, 46, 0.04)',
                                border: '1px solid rgba(26, 77, 46, 0.05)',
                                overflow: 'hidden'
                            }}
                            bodyStyle={{ padding: '24px' }}
                            hoverable
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '14px',
                                    background: `${item.color}10`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: item.color,
                                    fontSize: '20px'
                                }}>
                                    {item.icon}
                                </div>
                                <Statistic
                                    title={<span style={{ color: '#666', fontSize: '14px', fontWeight: 500 }}>{item.title}</span>}
                                    value={item.value}
                                    valueStyle={{
                                        color: '#1a1a1a',
                                        fontSize: '28px',
                                        fontWeight: 700,
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                />
                                <div style={{ fontSize: '12px', color: item.trend.includes('+') ? '#3f8600' : '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {item.trend.includes('+') && <ArrowUpOutlined style={{ fontSize: '10px' }} />}
                                    <span style={{ fontWeight: 600 }}>{item.trend}</span>
                                    <span style={{ color: '#999' }}>较上月</span>
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
                <Col xs={24} xl={16}>
                    <Card
                        style={{
                            borderRadius: '24px',
                            boxShadow: '0 10px 30px rgba(26, 77, 46, 0.04)',
                            border: '1px solid rgba(26, 77, 46, 0.05)',
                            height: '100%'
                        }}
                        title={<span style={{ fontFamily: '"Playfair Display", serif', fontSize: '20px', fontWeight: 600 }}>交易趋势 (近 7 天)</span>}
                        bordered={false}
                    >
                        <div style={{ height: 350, padding: '10px 0' }}>
                            {orderData.length > 0 ? (
                                <Line {...config} />
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                                    正在获取交易曲线...
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>
                <Col xs={24} xl={8}>
                    <Card
                        style={{
                            borderRadius: '24px',
                            boxShadow: '0 10px 30px rgba(26, 77, 46, 0.04)',
                            border: '1px solid rgba(26, 77, 46, 0.05)',
                            height: '100%'
                        }}
                        title={<span style={{ fontFamily: '"Playfair Display", serif', fontSize: '20px', fontWeight: 600 }}>最新动态</span>}
                        bordered={false}
                        extra={<a href="#" style={{ color: '#1a4d2e', fontSize: '13px' }}>查看更多</a>}
                    >
                        <div style={{ height: 350, overflowY: 'auto', paddingRight: 5 }}>
                            <List
                                itemLayout="horizontal"
                                loading={loading}
                                dataSource={activities}
                                renderItem={(item) => (
                                    <List.Item style={{ padding: '16px 0' }}>
                                        <List.Item.Meta
                                            avatar={
                                                <div style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '12px',
                                                    background: item.type === 'order' || item.type === 'payment' ? '#1a4d2e15' : '#d4af3715',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: item.type === 'order' || item.type === 'payment' ? '#1a4d2e' : '#d4af37'
                                                }}>
                                                    {item.type === 'order' ? <ShoppingCartOutlined /> : <UserOutlined />}
                                                </div>
                                            }
                                            title={<div style={{ display: 'flex', justifyContent: 'space-between' }}><Text strong style={{ fontSize: '14px' }}>{item.title}</Text><Text type="secondary" style={{ fontSize: '11px' }}>{item.time}</Text></div>}
                                            description={<Text type="secondary" style={{ fontSize: '13px' }}>{item.description}</Text>}
                                        />
                                    </List.Item>
                                )}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
