import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar } from 'antd';
import {
    DashboardOutlined,
    UserOutlined,
    ShopOutlined,
    ShoppingCartOutlined,
    CommentOutlined,
    TagOutlined,
    BankOutlined,
    LogoutOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    AppstoreOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // 路由一般保护
    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
        }
    }, [navigate]);

    const menuItems = [
        { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
        {
            key: 'users_group', label: '用户管理', type: 'group',
            children: [
                { key: '/users', icon: <UserOutlined />, label: '用户列表' },
                { key: '/farmers', icon: <UserOutlined />, label: '农户管理' },
                { key: '/addresses', icon: <TagOutlined />, label: '收货地址' },
            ]
        },
        {
            key: 'products_group', label: '商品管理', type: 'group',
            children: [
                { key: '/products', icon: <ShopOutlined />, label: '产品列表' },
            ]
        },
        {
            key: 'orders_group', label: '交易管理', type: 'group',
            children: [
                { key: '/orders', icon: <ShoppingCartOutlined />, label: '订单管理' },
            ]
        },
        {
            key: 'interaction_group', label: '互动管理', type: 'group',
            children: [
                { key: '/reviews', icon: <CommentOutlined />, label: '评价管理' },
            ]
        },
        {
            key: 'marketing_group', label: '营销管理', type: 'group',
            children: [
                { key: '/coupons', icon: <TagOutlined />, label: '优惠券' },
                { key: '/user_coupons', icon: <TagOutlined />, label: '用户优惠券' },
            ]
        },
        {
            key: 'others_group', label: '其他', type: 'group',
            children: [
                { key: '/bank_accounts', icon: <BankOutlined />, label: '银行账户' },
                { key: '/farm_photos', icon: <BankOutlined />, label: '农场照片' },
            ]
        },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const userMenu = {
        items: [
            { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: handleLogout }
        ]
    };

    return (
        <Layout style={{ height: '100vh', overflow: 'hidden', background: '#f4f7f5' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={240}
                style={{
                    background: '#1a4d2e',
                    boxShadow: '4px 0 10px rgba(0,0,0,0.05)',
                    zIndex: 10,
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    overflowY: 'auto'
                }}
            >
                <div style={{
                    height: 80,
                    margin: '16px auto',
                    color: '#f4f7f5',
                    fontSize: 22,
                    fontFamily: '"Playfair Display", serif',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    letterSpacing: '1px'
                }}>
                    {collapsed ? '🌾' : '🌾 乡村农产品直销'}
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                    style={{
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.7)',
                        borderRight: 0,
                        padding: '0 8px'
                    }}
                    inlineIndent={24}
                />
                <style>
                    {`
                        .ant-menu-item { margin-bottom: 8px !important; border-radius: 12px !important; }
                        .ant-menu-item-selected { background-color: rgba(212,175,55,0.15) !important; color: #d4af37 !important; }
                        .ant-menu-item-selected .ant-menu-item-icon { color: #d4af37 !important; }
                        .ant-menu-item:hover { color: #f4f7f5 !important; }
                        .ant-menu-item-active { color: #f4f7f5 !important; }
                        .ant-menu-item-group-title { color: rgba(255,255,255,0.3) !important; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 16px; }
                        .ant-menu-inline .ant-menu-item { color: rgba(255,255,255,0.85); }
                        
                        /* Sidebar scrollbar styling */
                        .ant-layout-sider-children::-webkit-scrollbar { width: 4px; }
                        .ant-layout-sider-children::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                        .ant-layout-sider-children:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
                    `}
                </style>
            </Sider>
            <Layout style={{
                background: '#f4f7f5',
                marginLeft: collapsed ? 80 : 240,
                transition: 'all 0.2s',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Header style={{
                    padding: '0 32px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '80px',
                    boxShadow: '0 4px 12px rgba(26, 77, 46, 0.05)',
                    margin: '16px',
                    borderRadius: '20px',
                    zIndex: 9,
                    flexShrink: 0
                }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: '18px', color: '#1a4d2e' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <Dropdown menu={userMenu} placement="bottomRight">
                            <div style={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '6px 16px',
                                background: '#f4f7f5',
                                borderRadius: '30px',
                                transition: 'all 0.3s'
                            }}>
                                <Avatar style={{ backgroundColor: '#1a4d2e' }} icon={<UserOutlined />} />
                                <span style={{ fontWeight: 500, color: '#1a1a1a' }}>{user.realName || '管理员'}</span>
                            </div>
                        </Dropdown>
                    </div>
                </Header>
                <Content style={{
                    margin: '0 16px 24px 16px',
                    padding: '24px 32px',
                    background: '#fff',
                    borderRadius: '24px',
                    boxShadow: '0 10px 30px rgba(26, 77, 46, 0.04)',
                    overflowY: 'auto',
                    flex: 1
                }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AppLayout;
