import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TaskExecution = () => {
  const navigate = useNavigate();
  const [engineState, setEngineState] = useState({ running: false, metrics: {} });
  const [scene, setScene] = useState(null);

  useEffect(() => {
    fetchEngineState();
    const interval = setInterval(fetchEngineState, 1000); // 每秒更新一次
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
      const foundScene = response.data.find(s => s.id === sceneId);
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

  return (
    <div style={{ padding: '20px' }}>
      <h1>任务执行</h1>
      
      {engineState.running ? (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h2>执行状态</h2>
            <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <p>状态: 运行中</p>
              <p>当前场景: {scene ? scene.name : '未知'}</p>
              <p>启动时间: {new Date(engineState.startTime).toLocaleString()}</p>
              <button onClick={stopEngine} style={{ marginTop: '10px' }}>停止引擎</button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h2>实时监控</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                <h3>QPS</h3>
                <p>实际: {engineState.metrics.qps || 0}</p>
                <p>目标: {engineState.metrics.targetQps || 0}</p>
              </div>
              <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                <h3>成功率</h3>
                <p>{(engineState.metrics.successRate || 0).toFixed(2)}%</p>
              </div>
              <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                <h3>平均时延</h3>
                <p>{(engineState.metrics.avgLatency || 0).toFixed(2)} ms</p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h2>场景配置</h2>
            {scene && (
              <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                <p><strong>场景名称:</strong> {scene.name}</p>
                <p><strong>QPS曲线类型:</strong> {scene.qpsConfig.type}</p>
                <p><strong>请求方法:</strong> {scene.httpConfig.method}</p>
                <p><strong>请求地址:</strong> {scene.httpConfig.url}</p>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h2>报表导出</h2>
            <button 
              onClick={() => {
                window.location.href = '/api/engine/export-report';
              }}
            >
              导出Excel报表
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
          <p>引擎未运行，请在首页选择场景并启动引擎。</p>
          <button onClick={() => navigate('/')} style={{ marginTop: '10px' }}>返回首页</button>
        </div>
      )}
    </div>
  );
};

export default TaskExecution;