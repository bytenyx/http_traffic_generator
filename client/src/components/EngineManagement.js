import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EngineManagement = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [resourceUsage, setResourceUsage] = useState({ cpu: 0, memory: 0 });

  useEffect(() => {
    // 模拟获取日志
    fetchLogs();
    // 模拟获取资源使用情况
    fetchResourceUsage();
    const interval = setInterval(fetchResourceUsage, 5000); // 每5秒更新一次资源使用情况
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = () => {
    // 这里应该从服务器获取真实日志，现在使用模拟数据
    const mockLogs = [
      { time: new Date().toISOString(), level: 'INFO', message: '引擎启动成功' },
      { time: new Date().toISOString(), level: 'INFO', message: '加载场景配置' },
      { time: new Date().toISOString(), level: 'INFO', message: '开始发送请求' },
    ];
    setLogs(mockLogs);
  };

  const fetchResourceUsage = () => {
    // 这里应该从服务器获取真实资源使用情况，现在使用模拟数据
    const mockUsage = {
      cpu: Math.random() * 50 + 10, // 10-60%
      memory: Math.random() * 40 + 20, // 20-60%
    };
    setResourceUsage(mockUsage);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>引擎管理</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>资源占用</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
            <h3>CPU使用率</h3>
            <div style={{ width: '100%', height: '20px', backgroundColor: '#e0e0e0', borderRadius: '10px', overflow: 'hidden' }}>
              <div 
                style={{
                  width: `${resourceUsage.cpu}%`,
                  height: '100%',
                  backgroundColor: resourceUsage.cpu > 70 ? '#ff4d4f' : resourceUsage.cpu > 40 ? '#faad14' : '#52c41a',
                  borderRadius: '10px'
                }}
              />
            </div>
            <p style={{ marginTop: '5px' }}>{resourceUsage.cpu.toFixed(2)}%</p>
          </div>
          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
            <h3>内存使用率</h3>
            <div style={{ width: '100%', height: '20px', backgroundColor: '#e0e0e0', borderRadius: '10px', overflow: 'hidden' }}>
              <div 
                style={{
                  width: `${resourceUsage.memory}%`,
                  height: '100%',
                  backgroundColor: resourceUsage.memory > 70 ? '#ff4d4f' : resourceUsage.memory > 40 ? '#faad14' : '#52c41a',
                  borderRadius: '10px'
                }}
              />
            </div>
            <p style={{ marginTop: '5px' }}>{resourceUsage.memory.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>运行日志</h2>
        <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', maxHeight: '400px', overflow: 'auto' }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px', fontSize: '14px' }}>
              <span style={{ color: '#666' }}>{new Date(log.time).toLocaleString()} </span>
              <span style={{ 
                color: log.level === 'ERROR' ? '#ff4d4f' : log.level === 'WARNING' ? '#faad14' : '#52c41a',
                marginRight: '10px'
              }}>[{log.level}]</span>
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>引擎设置</h2>
        <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <p>这里可以设置引擎的CPU、内存使用上限及日志保存路径等。</p>
          <div style={{ marginBottom: '10px' }}>
            <label>CPU使用上限（%）：</label>
            <input type="number" min="1" max="100" defaultValue="80" style={{ marginLeft: '10px', width: '100px' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>内存使用上限（%）：</label>
            <input type="number" min="1" max="100" defaultValue="80" style={{ marginLeft: '10px', width: '100px' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>最大并发连接数：</label>
            <input type="number" min="1" defaultValue="50" style={{ marginLeft: '10px', width: '100px' }} />
          </div>
          <button>保存设置</button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate('/')} style={{ marginRight: '10px' }}>返回首页</button>
        <button onClick={() => navigate('/task-execution')}>查看任务执行</button>
      </div>
    </div>
  );
};

export default EngineManagement;