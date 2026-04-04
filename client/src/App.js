import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import {
  HomeOutlined,
  SettingOutlined,
  DashboardOutlined,
  ControlOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import Home from './components/Home';
import SceneConfig from './components/SceneConfig';
import TaskExecution from './components/TaskExecution';
import EngineManagement from './components/EngineManagement';
import './styles/global.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/task-execution',
      icon: <DashboardOutlined />,
      label: '任务执行',
    },
    {
      key: '/engine-management',
      icon: <ControlOutlined />,
      label: '引擎管理',
    },
  ];

  const handleMenuClick = (e) => {
    navigate(e.key);
  };

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/scene-config')) {
      return '/';
    }
    return path;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        theme="dark"
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <ThunderboltOutlined style={{ fontSize: 28, color: '#00d4ff' }} />
          {!collapsed && (
            <Title level={4} style={{
              margin: '0 0 0 12px',
              color: '#fff',
              background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              HTTP流量发生器
            </Title>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            background: 'transparent',
            borderRight: 0,
          }}
          theme="dark"
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 24px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
        }}>
          <Title level={4} style={{
            margin: 0,
            color: '#fff',
            background: 'linear-gradient(135deg, #00d4ff, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {location.pathname === '/' && '场景管理'}
            {location.pathname.startsWith('/scene-config') && '场景配置'}
            {location.pathname === '/task-execution' && '任务执行'}
            {location.pathname === '/engine-management' && '引擎管理'}
          </Title>
        </Header>
        <Content style={{
          margin: 0,
          padding: 24,
          background: 'transparent',
          minHeight: 'calc(100vh - 64px)',
        }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/scene-config/:id?" element={<SceneConfig />} />
            <Route path="/task-execution" element={<TaskExecution />} />
            <Route path="/engine-management" element={<EngineManagement />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;