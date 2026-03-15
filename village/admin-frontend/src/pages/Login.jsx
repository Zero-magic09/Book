import React, { useState } from 'react';
import { Form, Input, Button, message, ConfigProvider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '@/api/admin';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const res = await login({
                username: values.username,
                password: values.password
            });
            if (res.code === 200) {
                if (res.data.role !== 'ADMIN') {
                    message.error('非管理员账号禁止访问');
                    return;
                }
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data));
                message.success('欢迎回来，管理员');
                navigate('/');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#1a4d2e',
                    borderRadius: 16,
                    fontFamily: 'Inter, sans-serif',
                },
            }}
        >
            <style>
                {`
                    @keyframes float {
                        0% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(-20px) rotate(5deg); }
                        100% { transform: translateY(0px) rotate(0deg); }
                    }
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes bgMove {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    .animate-slide-up {
                        animation: slideUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                    }
                    .delay-1 { animation-delay: 0.1s; }
                    .delay-2 { animation-delay: 0.2s; }
                    .delay-3 { animation-delay: 0.3s; }
                    .login-button:hover {
                        transform: translateY(-2px) scale(1.02);
                        box-shadow: 0 15px 30px rgba(26, 77, 46, 0.3) !important;
                    }
                    .login-button:active {
                        transform: translateY(0) scale(0.98);
                    }
                `}
            </style>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                width: '100vw',
                overflow: 'hidden',
                background: 'linear-gradient(-45deg, #f4f7f5, #e8ede9, #1a4d2e20, #f4f7f5)',
                backgroundSize: '400% 400%',
                animation: 'bgMove 15s ease infinite',
                position: 'relative'
            }}>
                {/* Dynamic Background Elements */}
                <div style={{
                    position: 'absolute',
                    top: '10%',
                    left: '15%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, #d4af3715 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'float 8s ease-in-out infinite'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '15%',
                    right: '10%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, #1a4d2e10 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'float 12s ease-in-out infinite reverse'
                }} />

                {/* Login Card */}
                <div className="animate-slide-up" style={{
                    width: '100%',
                    maxWidth: '460px',
                    padding: '48px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '32px',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 25px 50px -12px rgba(26, 77, 46, 0.15)',
                    textAlign: 'center',
                    zIndex: 10
                }}>
                    <div style={{ marginBottom: '40px' }} className="animate-slide-up delay-1">
                        <div style={{
                            fontSize: '40px',
                            marginBottom: '16px',
                            display: 'inline-block',
                            filter: 'drop-shadow(0 5px 15px rgba(212,175,55,0.3))'
                        }}>
                            🌾
                        </div>
                        <h1 style={{
                            fontFamily: '"Playfair Display", serif',
                            fontSize: '36px',
                            margin: '0 0 12px 0',
                            color: '#1a4d2e',
                            fontWeight: 700
                        }}>
                            乡村农产品直销平台
                        </h1>
                        <p style={{
                            color: '#666',
                            fontSize: '15px',
                            letterSpacing: '1px',
                            opacity: 0.8
                        }}>
                            请证明您的管理员身份
                        </p>
                    </div>

                    <Form
                        name="login"
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                        requiredMark={false}
                        className="animate-slide-up delay-2"
                    >
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: '请输入用户名' }]}
                            style={{ marginBottom: '20px' }}
                        >
                            <Input
                                placeholder="用户名 (admin)"
                                prefix={<UserOutlined style={{ color: '#1a4d2e', marginRight: '8px', opacity: 0.5 }} />}
                                style={{
                                    padding: '14px 20px',
                                    borderRadius: '16px',
                                    border: '1.5px solid rgba(26, 77, 46, 0.1)',
                                    background: 'rgba(255,255,255,0.5)',
                                    fontSize: '16px'
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: '请输入密码' }]}
                            style={{ marginBottom: '32px' }}
                        >
                            <Input.Password
                                placeholder="访问密码"
                                prefix={<LockOutlined style={{ color: '#1a4d2e', marginRight: '8px', opacity: 0.5 }} />}
                                style={{
                                    padding: '14px 20px',
                                    borderRadius: '16px',
                                    border: '1.5px solid rgba(26, 77, 46, 0.1)',
                                    background: 'rgba(255,255,255,0.5)',
                                    fontSize: '16px'
                                }}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                className="login-button"
                                block
                                style={{
                                    height: '58px',
                                    borderRadius: '18px',
                                    fontSize: '17px',
                                    fontWeight: 600,
                                    background: '#1a4d2e',
                                    border: 'none',
                                    boxShadow: '0 10px 20px rgba(26, 77, 46, 0.2)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    letterSpacing: '2px'
                                }}
                            >
                                启动管理引擎
                            </Button>
                        </Form.Item>
                    </Form>

                    <div style={{
                        marginTop: '40px',
                        paddingTop: '24px',
                        borderTop: '1px solid rgba(26, 77, 46, 0.05)',
                        fontSize: '13px',
                        color: '#999',
                        fontFamily: 'Inter, sans-serif'
                    }} className="animate-slide-up delay-3">
                        © 2026 乡村农产品直销平台 · 数字化赋能乡村振兴
                    </div>
                </div>
            </div>
        </ConfigProvider>
    );
};

export default Login;
