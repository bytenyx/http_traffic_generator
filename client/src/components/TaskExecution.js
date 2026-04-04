import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Typography,
  Space,
  Tag,
  Progress,
  Empty,
} from 'antd';
import {
  StopOutlined,
  DownloadOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  HomeOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const TaskExecution = () => {
  const navigate = useNavigate();
  const [engineState, setEngineState] = useState({ running: false, metrics: {} });
  const [scene, setScene] = useState(null);

  useEffect(() => {
    fetchEngineState();
    const interval = setInterval(fetchEngineState, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchEngineState = async () => {
    try {
      const response = await axios.get('/api/engine/state');
      setEngineState(response.data);
      if (response.data.currentScene) {
        fetchScene(response.data.currentScene);
      }
    } catch (error) {
      console.error('Failed to fetch engine state:', error);
    }
  };

  const fetchScene = async (sceneId) => {
    try {
      const response = await axios.get('/api/scenes');
      const foundScene = response.data.find((s) => s.id === sceneId);
      if (foundScene) {
        setScene(foundScene);
      }
    } catch (error) {
      console.error('Failed to fetch scene:', error);
    }
  };

  const stopEngine = async () => {
    try {
      await axios.post('/api/engine/stop');
      fetchEngineState();
    } catch (error) {
      console.error('Failed to stop engine:', error);
    }
  };

  const exportReport = () => {
    window.location.href = '/api/engine/export-report';
  };

  if (!engineState.running) {
    return (
      <Card className="glass-card" bordered={false}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text type="secondary">引擎未运行，请在首页选择场景并启动引擎</Text>
          }
        >
          <Button
            type="primary"
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
              border: 'none',
            }}
          >
            返回首页
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="glass-card" bordered={false}>
            <div className="data-card">
              <ThunderboltOutlined style={{ fontSize: 32, color: '#00d4ff', marginBottom: 16 }} />
              <div className="data-value">{engineState.metrics.qps || 0}</div>
              <div className="data-label">实际QPS</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                目标: {engineState.metrics.targetQps || 0}
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="glass-card" bordered={false}>
            <div className="data-card">
              <CheckCircleOutlined style={{ fontSize: 32, color: '#10b981', marginBottom: 16 }} />
              <div className="data-value">{(engineState.metrics.successRate || 0).toFixed(1)}%</div>
              <div className="data-label">成功率</div>
              <Progress
                percent={engineState.metrics.successRate || 0}
                showInfo={false}
                strokeColor={{
                  '0%': '#10b981',
                  '100%': '#059669',
                }}
                trailColor="rgba(255, 255, 255, 0.1)"
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="glass-card" bordered={false}>
            <div className="data-card">
              <ClockCircleOutlined style={{ fontSize: 32, color: '#f59e0b', marginBottom: 16 }} />
              <div className="data-value">{(engineState.metrics.avgLatency || 0).toFixed(0)}</div>
              <div className="data-label">平均时延 (ms)</div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="glass-card" bordered={false}>
            <div className="data-card">
              <DashboardOutlined style={{ fontSize: 32, color: '#7c3aed', marginBottom: 16 }} />
              <div className="data-value">{(engineState.metrics.failureRate || 0).toFixed(1)}%</div>
              <div className="data-label">失败率</div>
              <Progress
                percent={engineState.metrics.failureRate || 0}
                showInfo={false}
                strokeColor={{
                  '0%': '#ef4444',
                  '100%': '#dc2626',
                }}
                trailColor="rgba(255, 255, 255, 0.1)"
                status="exception"
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        className="glass-card"
        bordered={false}
        style={{ marginTop: 16 }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0, color: '#fff' }}>
              执行状态
            </Title>
            <Tag color="success" style={{ animation: 'pulse 2s infinite' }}>
              运行中
            </Tag>
          </div>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">当前场景：</Text>
                <Text strong>{scene ? scene.name : '未知'}</Text>
              </div>
              <div>
                <Text type="secondary">启动时间：</Text>
                <Text>{new Date(engineState.startTime).toLocaleString()}</Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space>
              <Button
                type="primary"
                danger
                icon={<StopOutlined />}
                onClick={stopEngine}
                size="large"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none',
                }}
              >
                停止引擎
              </Button>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={exportReport}
                size="large"
                style={{
                  background: 'rgba(0, 212, 255, 0.2)',
                  border: '1px solid #00d4ff',
                  color: '#00d4ff',
                }}
              >
                导出报表
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {scene && (
        <Card
          className="glass-card"
          bordered={false}
          style={{ marginTop: 16 }}
          title={<Title level={4} style={{ margin: 0, color: '#fff' }}>场景配置</Title>}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Text type="secondary">QPS曲线类型</Text>
              <div>
                <Tag color="cyan">{scene.qpsConfig.type}</Tag>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Text type="secondary">请求方法</Text>
              <div>
                <Tag color="blue">{scene.httpConfig.method}</Tag>
              </div>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Text type="secondary">请求地址</Text>
              <div>
                <Text code style={{ color: '#00d4ff' }}>
                  {scene.httpConfig.url}
                </Text>
              </div>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default TaskExecution;