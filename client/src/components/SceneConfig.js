import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Tabs,
  Space,
  Switch,
  Typography,
  Row,
  Col,
  Divider,
  message,
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const SceneConfig = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [scene, setScene] = useState({
    name: '',
    description: '',
    qpsConfig: {
      type: 'fixed',
      fixedQps: 10,
      steps: [{ qps: 10, duration: 300 }],
      linear: { startQps: 10, endQps: 100, duration: 600 },
      custom: [{ time: 0, qps: 10 }],
      duration: 3600,
      minQps: 1,
      maxQps: 1000,
    },
    httpConfig: {
      method: 'GET',
      url: '',
      headers: [],
      body: '',
      bodyType: 'json',
      timeout: 5000,
    },
    dynamicParams: {
      variables: [],
      paramPool: { enabled: false, filePath: '', fetchMode: 'random' },
    },
    preOperations: { enabled: false, requests: [] },
  });

  useEffect(() => {
    if (id) {
      fetchScene();
    }
  }, [id]);

  const fetchScene = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/scenes');
      const foundScene = response.data.find((s) => s.id === id);
      if (foundScene) {
        setScene(foundScene);
        form.setFieldsValue(foundScene);
      }
    } catch (error) {
      console.error('Failed to fetch scene:', error);
      message.error('加载场景失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const sceneData = { ...scene, ...values };
      
      if (id) {
        await axios.put(`/api/scenes/${id}`, sceneData);
        message.success('场景更新成功');
      } else {
        await axios.post('/api/scenes', sceneData);
        message.success('场景创建成功');
      }
      navigate('/');
    } catch (error) {
      console.error('Failed to save scene:', error);
      message.error('保存场景失败');
    }
  };

  return (
    <div>
      <Card className="glass-card" bordered={false} loading={loading}>
        <Form form={form} layout="vertical" initialValues={scene}>
          <Title level={3} style={{ color: '#fff', marginBottom: 24 }}>
            {id ? '编辑场景' : '新建场景'}
          </Title>

          <Tabs defaultActiveKey="basic" tabPosition="left">
            <TabPane tab="基本信息" key="basic">
              <Card className="glass-card-strong" bordered={false} style={{ marginBottom: 16 }}>
                <Form.Item
                  label="场景名称"
                  name="name"
                  rules={[{ required: true, message: '请输入场景名称' }]}
                >
                  <Input placeholder="请输入场景名称" />
                </Form.Item>
                <Form.Item label="场景描述" name="description">
                  <TextArea rows={3} placeholder="请输入场景描述" />
                </Form.Item>
              </Card>
            </TabPane>

            <TabPane tab="QPS配置" key="qps">
              <Card className="glass-card-strong" bordered={false} style={{ marginBottom: 16 }}>
                <Form.Item label="曲线类型" name={['qpsConfig', 'type']}>
                  <Select>
                    <Select.Option value="fixed">固定QPS</Select.Option>
                    <Select.Option value="step">阶梯曲线</Select.Option>
                    <Select.Option value="linear">线性曲线</Select.Option>
                    <Select.Option value="custom">自定义折线</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label="任务总执行时长（秒）" name={['qpsConfig', 'duration']}>
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item label="最小QPS" name={['qpsConfig', 'minQps']}>
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item label="最大QPS" name={['qpsConfig', 'maxQps']}>
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item noStyle shouldUpdate>
                  {({ getFieldValue }) => {
                    const type = getFieldValue(['qpsConfig', 'type']);
                    if (type === 'fixed') {
                      return (
                        <Form.Item label="固定QPS值" name={['qpsConfig', 'fixedQps']}>
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      );
                    }
                    return null;
                  }}
                </Form.Item>
              </Card>
            </TabPane>

            <TabPane tab="HTTP请求" key="http">
              <Card className="glass-card-strong" bordered={false} style={{ marginBottom: 16 }}>
                <Form.Item label="请求方法" name={['httpConfig', 'method']}>
                  <Select>
                    <Select.Option value="GET">GET</Select.Option>
                    <Select.Option value="POST">POST</Select.Option>
                    <Select.Option value="PUT">PUT</Select.Option>
                    <Select.Option value="DELETE">DELETE</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="请求地址"
                  name={['httpConfig', 'url']}
                  rules={[{ required: true, message: '请输入请求地址' }]}
                >
                  <Input placeholder="请输入HTTP/HTTPS地址，支持动态变量如{{timestamp}}" />
                </Form.Item>

                <Form.Item label="请求体类型" name={['httpConfig', 'bodyType']}>
                  <Select>
                    <Select.Option value="json">JSON</Select.Option>
                    <Select.Option value="form">Form</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label="请求体" name={['httpConfig', 'body']}>
                  <TextArea rows={4} placeholder="请输入请求体内容，支持动态变量如{{timestamp}}" />
                </Form.Item>

                <Form.Item label="请求超时（毫秒）" name={['httpConfig', 'timeout']}>
                  <InputNumber min={100} style={{ width: '100%' }} />
                </Form.Item>
              </Card>
            </TabPane>

            <TabPane tab="动态参数" key="dynamic">
              <Card className="glass-card-strong" bordered={false} style={{ marginBottom: 16 }}>
                <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>
                  支持的动态变量
                </Title>
                <ul style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: 24 }}>
                  <li>{`{{timestamp}} - 毫秒级时间戳`}</li>
                  <li>{`{{uuid}} - 唯一标识符`}</li>
                  <li>{`{{randomString}} - 随机字符串`}</li>
                  <li>{`{{randomString:10}} - 指定长度的随机字符串`}</li>
                </ul>

                <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                <Form.Item label="启用参数池" name={['dynamicParams', 'paramPool', 'enabled']} valuePropName="checked">
                  <Switch />
                </Form.Item>

                <Form.Item noStyle shouldUpdate>
                  {({ getFieldValue }) => {
                    const enabled = getFieldValue(['dynamicParams', 'paramPool', 'enabled']);
                    if (enabled) {
                      return (
                        <>
                          <Form.Item label="CSV文件路径" name={['dynamicParams', 'paramPool', 'filePath']}>
                            <Input placeholder="请输入CSV文件路径" />
                          </Form.Item>
                          <Form.Item label="取值方式" name={['dynamicParams', 'paramPool', 'fetchMode']}>
                            <Select>
                              <Select.Option value="random">随机</Select.Option>
                              <Select.Option value="sequence">顺序</Select.Option>
                            </Select>
                          </Form.Item>
                        </>
                      );
                    }
                    return null;
                  }}
                </Form.Item>
              </Card>
            </TabPane>

            <TabPane tab="前置操作" key="preOperations">
              <Card className="glass-card-strong" bordered={false} style={{ marginBottom: 16 }}>
                <Form.Item label="启用前置操作" name={['preOperations', 'enabled']} valuePropName="checked">
                  <Switch />
                </Form.Item>

                <Form.Item noStyle shouldUpdate>
                  {({ getFieldValue }) => {
                    const enabled = getFieldValue(['preOperations', 'enabled']);
                    if (enabled) {
                      return (
                        <div style={{ marginTop: 16 }}>
                          <Text type="secondary">前置请求配置（最多3个）</Text>
                          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                            提取的参数可通过 {`{{pre_参数名}}`} 在主请求中使用
                          </Text>
                        </div>
                      );
                    }
                    return null;
                  }}
                </Form.Item>
              </Card>
            </TabPane>
          </Tabs>

          <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                border: 'none',
              }}
            >
              保存场景
            </Button>
            <Button icon={<RollbackOutlined />} onClick={() => navigate('/')}>
              取消
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default SceneConfig;