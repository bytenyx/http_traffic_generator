import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
  const [scenes, setScenes] = useState([]);
  const [engineState, setEngineState] = useState({ running: false });

  useEffect(() => {
    fetchScenes();
    fetchEngineState();
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

  const deleteScene = async (id) => {
    if (window.confirm('确定要删除这个场景吗？')) {
      try {
        await axios.delete(`/api/scenes/${id}`);
        fetchScenes();
      } catch (error) {
        console.error('Failed to delete scene:', error);
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>HTTP流量发生器</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>引擎状态</h2>
        <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <p>状态: {engineState.running ? '运行中' : '已停止'}</p>
          {engineState.running && (
            <p>当前场景: {engineState.currentScene}</p>
          )}
          <div style={{ marginTop: '10px' }}>
            {!engineState.running ? (
              <button disabled>启动引擎</button>
            ) : (
              <button onClick={stopEngine}>停止引擎</button>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <Link to="/scene-config">
          <button>新建场景</button>
        </Link>
        <Link to="/task-execution">
          <button style={{ marginLeft: '10px' }}>任务执行</button>
        </Link>
        <Link to="/engine-management">
          <button style={{ marginLeft: '10px' }}>引擎管理</button>
        </Link>
      </div>

      <h2>场景列表</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>场景名称</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>创建时间</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {scenes.map(scene => (
            <tr key={scene.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px' }}>{scene.name}</td>
              <td style={{ padding: '8px' }}>{new Date(scene.createdAt).toLocaleString()}</td>
              <td style={{ padding: '8px' }}>
                <Link to={`/scene-config/${scene.id}`}>
                  <button style={{ marginRight: '5px' }}>编辑</button>
                </Link>
                {!engineState.running && (
                  <button 
                    style={{ marginRight: '5px' }} 
                    onClick={() => startEngine(scene.id)}
                  >
                    执行
                  </button>
                )}
                <button onClick={() => deleteScene(scene.id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Home;