import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Progress,
  List,
  Tag,
  Typography,
  InputNumber,
  Button,
  Space,
  Divider,
} from 'antd';
import {
  DashboardOutlined,
  DatabaseOutlined,
  SettingOutlined,
  HomeOutlined,
  FileTextOutlined,
  SaveOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const EngineManagement = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [resourceUsage, setResourceUsage] = useState({ cpu: 0, memory: 0 });
  const [settings, setSettings] = useState({
    cpuLimit: 80,
    memoryLimit: 80,
    maxConnections: 50,
  });

  useEffect(() => {
    fetchLogs();
    fetchResourceUsage();
    const interval = setInterval(fetchResourceUsage, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = () => {
    const mockLogs = [
      { time: new Date().toISOString(), level: 'INFO', message: '引擎启动成功' },
      { time: new Date().toISOString(), level: 'INFO', message: '加载场景配置' },
      { time: new Date().toISOString(), level: 'INFO', message: '开始发送请求' },
      { time: new Date(Date.now() - 60000).toISOString(), level: 'WARNING', message: 'CPU使用率超过60%' },
      { time: new Date(Date.now() - 120000).toISOString(), level: 'INFO', message: 'QPS调整至目标值' },
    ];
    setLogs(mockLogs);
  };

  const fetchResourceUsage = () => {
    const mockUsage = {
      cpu: Math.random() * 50 + 10,
      memory: Math.random() * 40 + 20,
    };
    setResourceUsage(mockUsage);
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR':
        return '#ef4444';
      case 'WARNING':
        return '#f59e0b';
      case 'INFO':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card
            className="glass-card"
            bordered={false}
            title={
              <Space>
                <DashboardOutlined style={{ color: '#00d4ff' }} />
                <Title level={4} style={{ margin: 0, color: '#fff' }}>CPU使用率</Title>
              </Space>
            }
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Progress
                type="dashboard"
                percent={Math.round(resourceUsage.cpu)}
                strokeColor={{
                  '0%': resourceUsage.cpu > 70 ? '#ef4444' : resourceUsage.cpu > 40 ? '#f59e0b' : '#10b981',
                  '100%': resourceUsage.cpu > 70 ? '#dc2626' : resourceUsage.cpu > 40 ? '#d97706' : '#059669',
                }}
                trailColor="rgba(255, 255, 255, 0.1)"
                format={(percent) => (
                  <span style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                    {percent}%
                  </span>
                )}
              />
              <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                当前CPU使用率
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12}>
          <Card
            className="glass-card"
            bordered={false}
            title={
              <Space>
                <DatabaseOutlined style={{ color: '#7c3aed' }} />
                <Title level={4} style={{ margin: 0, color: '#fff' }}>内存使用率</Title>
              </Space>
            }
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Progress
                type="dashboard"
                percent={Math.round(resourceUsage.memory)}
                strokeColor={{
                  '0%': resourceUsage.memory > 70 ? '#ef4444' : resourceUsage.memory > 40 ? '#f59e0b' : '#10b981',
                  '100%': resourceUsage.memory > 70 ? '#dc2626' : resourceUsage.memory > 40 ? '#d97706' : '#059669',
                }}
                trailColor="rgba(255, 255, 255, 0.1)"
                format={(percent) => (
                  <span style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                    {percent}%
                  </span>
                )}
              />
              <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                当前内存使用率
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        className="glass-card"
        bordered={false}
        style={{ marginTop: 16 }}
        title={
          <Space>
            <FileTextOutlined style={{ color: '#00d4ff' }} />
            <Title level={4} style={{ margin: 0, color: '#fff' }}>运行日志</Title>
          </Space>
        }
      >
        <List
          dataSource={logs}
          renderItem={(log) => (
            <List.Item style={{ border: 'none', padding: '12px 0' }}>
              <Space style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(log.time).toLocaleString()}
                </Text>
                <Tag
                  color={getLevelColor(log.level)}
                  style={{ margin: 0, fontWeight: 'bold' }}
                >
                  {log.level}
                </Tag>
                <Text style={{ color: '#fff' }}>{log.message}</Text>
              </Space>
            </List.Item>
          )}
          style={{ maxHeight: 300, overflow: 'auto' }}
        />
      </Card>

      <Card
        className="glass-card"
        bordered={false}
        style={{ marginTop: 16 }}
        title={
          <Space>
            <SettingOutlined style={{ color: '#f472b6' }} />
            <Title level={4} style={{ margin: 0, color: '#fff' }}>引擎设置</Title>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <div>
              <Text type="secondary">CPU使用上限（%）</Text>
              <InputNumber
                min={1}
                max={100}
                value={settings.cpuLimit}
                onChange={(value) => setSettings({ ...settings, cpuLimit: value })}
                style={{ width: '100%', marginTop: 8 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div>
              <Text type="secondary">内存使用上限（%）</Text>
              <InputNumber
                min={1}
                max={100}
                value={settings.memoryLimit}
                onChange={(value) => setSettings({ ...settings, memoryLimit: value })}
                style={{ width: '100%', marginTop: 8 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div>
              <Text type="secondary">最大并发连接数</Text>
              <InputNumber
                min={1}
                value={settings.maxConnections}
                onChange={(value) => setSettings({ ...settings, maxConnections: value })}
                style={{ width: '100%', marginTop: 8 }}
              />
            </div>
          </Col>
        </Row>

        <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)', margin: '24px 0' }} />

        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
              border: 'none',
            }}
          >
            保存设置
          </Button>
          <Button
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
          >
            返回首页
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default EngineManagement;