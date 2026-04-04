import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Tag, Space, Modal, Typography, Row, Col, Statistic } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { confirm } = Modal;

const Home = () => {
  const navigate = useNavigate();
  const [scenes, setScenes] = useState([]);
  const [engineState, setEngineState] = useState({ running: false });

  useEffect(() => {
    fetchScenes();
    fetchEngineState();
    const interval = setInterval(fetchEngineState, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchScenes = async () => {
    try {
      const response = await axios.get('/api/scenes');
      setScenes(response.data);
    } catch (error) {
      console.error('Failed to fetch scenes:', error);
    }
  };

  const fetchEngineState = async () => {
    try {
      const response = await axios.get('/api/engine/state');
      setEngineState(response.data);
    } catch (error) {
      console.error('Failed to fetch engine state:', error);
    }
  };

  const startEngine = async (sceneId) => {
    try {
      await axios.post('/api/engine/start', { sceneId });
      fetchEngineState();
      navigate('/task-execution');
    } catch (error) {
      console.error('Failed to start engine:', error);
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

  const deleteScene = (id, name) => {
    confirm({
      title: '确认删除',
      content: `确定要删除场景"${name}"吗？`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await axios.delete(`/api/scenes/${id}`);
          fetchScenes();
        } catch (error) {
          console.error('Failed to delete scene:', error);
        }
      },
    });
  };

  const columns = [
    {
      title: '场景名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong style={{ color: '#fff' }}>{text}</Text>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <Text type="secondary">{text || '-'}</Text>,
    },
    {
      title: 'QPS类型',
      dataIndex: ['qpsConfig', 'type'],
      key: 'qpsType',
      render: (type) => {
        const typeMap = {
          fixed: '固定QPS',
          step: '阶梯曲线',
          linear: '线性曲线',
          custom: '自定义折线',
        };
        return <Tag color="cyan">{typeMap[type] || type}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time) => <Text type="secondary">{new Date(time).toLocaleString()}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/scene-config/${record.id}`)}
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
              border: 'none',
            }}
          >
            编辑
          </Button>
          {!engineState.running && (
            <Button
              type="default"
              icon={<PlayCircleOutlined />}
              onClick={() => startEngine(record.id)}
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10b981',
                color: '#10b981',
              }}
            >
              执行
            </Button>
          )}
          <Button
            type="default"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteScene(record.id, record.name)}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#ef4444',
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card className="glass-card" bordered={false}>
            <div className="data-card">
              <ThunderboltOutlined style={{ fontSize: 32, color: '#00d4ff', marginBottom: 16 }} />
              <div className="data-value">{engineState.running ? '运行中' : '已停止'}</div>
              <div className="data-label">引擎状态</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="glass-card" bordered={false}>
            <div className="data-card">
              <CheckCircleOutlined style={{ fontSize: 32, color: '#10b981', marginBottom: 16 }} />
              <div className="data-value">{scenes.length}</div>
              <div className="data-label">场景总数</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="glass-card" bordered={false}>
            <div className="data-card">
              {engineState.running ? (
                <>
                  <StopOutlined style={{ fontSize: 32, color: '#ef4444', marginBottom: 16 }} />
                  <Button
                    type="primary"
                    danger
                    size="large"
                    icon={<StopOutlined />}
                    onClick={stopEngine}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      border: 'none',
                    }}
                  >
                    停止引擎
                  </Button>
                </>
              ) : (
                <>
                  <PlayCircleOutlined style={{ fontSize: 32, color: '#10b981', marginBottom: 16 }} />
                  <Text type="secondary">选择场景启动引擎</Text>
                </>
              )}
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
            <Title level={4} style={{ margin: 0, color: '#fff' }}>场景列表</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/scene-config')}
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                border: 'none',
              }}
            >
              新建场景
            </Button>
          </div>
        }
      >
        <Table
          dataSource={scenes}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无场景，点击"新建场景"开始创建' }}
        />
      </Card>
    </div>
  );
};

export default Home;