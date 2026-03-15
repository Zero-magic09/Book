import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import './index.css'

import { ConfigProvider } from 'antd'

const theme = {
    token: {
        colorPrimary: '#1a4d2e',
        borderRadius: 14,
        fontFamily: 'Inter, sans-serif',
    },
    components: {
        Card: {
            borderRadiusLG: 20,
        },
        Table: {
            headerBg: '#f0f4f1',
            headerColor: '#1a4d2e',
        }
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ConfigProvider theme={theme}>
            <RouterProvider router={router} />
        </ConfigProvider>
    </React.StrictMode>,
)
