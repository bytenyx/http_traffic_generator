import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const SceneConfig = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scene, setScene] = useState({
    name: '',
    description: '',
    qpsConfig: {
      type: 'fixed', // fixed, step, linear, custom
      fixedQps: 10,
      steps: [
        { qps: 10, duration: 300 }, // 5分钟
        { qps: 50, duration: 600 }  // 10分钟
      ],
      linear: {
        startQps: 10,
        endQps: 100,
        duration: 600
      },
      custom: [
        { time: 0, qps: 10 },
        { time: 300, qps: 50 },
        { time: 600, qps: 100 }
      ],
      duration: 3600, // 1小时
      minQps: 1,
      maxQps: 1000
    },
    httpConfig: {
      method: 'GET',
      url: '',
      headers: [],
      body: '',
      bodyType: 'json', // json, form
      timeout: 5000
    },
    dynamicParams: {
      variables: [],
      paramPool: {
        enabled: false,
        filePath: '',
        fetchMode: 'random' // random, sequence
      }
    },
    preOperations: {
      enabled: false,
      requests: []
    }
  });

  useEffect(() => {
    if (id) {
      fetchScene();
    }
  }, [id]);

  const fetchScene = async () => {
    try {
      const response = await axios.get(`/api/scenes`);
      const foundScene = response.data.find(s => s.id === id);
      if (foundScene) {
        setScene(foundScene);
      }
    } catch (error) {
      console.error('Failed to fetch scene:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (id) {
        await axios.put(`/api/scenes/${id}`, scene);
      } else {
        await axios.post('/api/scenes', scene);
      }
      navigate('/');
    } catch (error) {
      console.error('Failed to save scene:', error);
    }
  };

  const handleQpsTypeChange = (type) => {
    setScene(prev => ({
      ...prev,
      qpsConfig: {
        ...prev.qpsConfig,
        type
      }
    }));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>{id ? '编辑场景' : '新建场景'}</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>基本信息</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>场景名称：</label>
          <input 
            type="text" 
            value={scene.name} 
            onChange={(e) => setScene({ ...scene, name: e.target.value })} 
            style={{ marginLeft: '10px', width: '300px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>场景描述：</label>
          <textarea 
            value={scene.description} 
            onChange={(e) => setScene({ ...scene, description: e.target.value })} 
            style={{ marginLeft: '10px', width: '300px', height: '100px' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>QPS曲线配置</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>曲线类型：</label>
          <select 
            value={scene.qpsConfig.type} 
            onChange={(e) => handleQpsTypeChange(e.target.value)}
            style={{ marginLeft: '10px' }}
          >
            <option value="fixed">固定QPS</option>
            <option value="step">阶梯曲线</option>
            <option value="linear">线性曲线</option>
            <option value="custom">自定义折线</option>
          </select>
        </div>

        {scene.qpsConfig.type === 'fixed' && (
          <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
            <label>固定QPS值：</label>
            <input 
              type="number" 
              min="1" 
              value={scene.qpsConfig.fixedQps} 
              onChange={(e) => setScene({
                ...scene,
                qpsConfig: {
                  ...scene.qpsConfig,
                  fixedQps: parseInt(e.target.value) || 1
                }
              })}
              style={{ marginLeft: '10px', width: '100px' }}
            />
          </div>
        )}

        {scene.qpsConfig.type === 'step' && (
          <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
            <h3>阶梯配置</h3>
            {scene.qpsConfig.steps.map((step, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                <label>阶梯 {index + 1} QPS：</label>
                <input 
                  type="number" 
                  min="1" 
                  value={step.qps} 
                  onChange={(e) => {
                    const newSteps = [...scene.qpsConfig.steps];
                    newSteps[index].qps = parseInt(e.target.value) || 1;
                    setScene({
                      ...scene,
                      qpsConfig: {
                        ...scene.qpsConfig,
                        steps: newSteps
                      }
                    });
                  }}
                  style={{ marginLeft: '10px', width: '100px' }}
                />
                <label style={{ marginLeft: '20px' }}>持续时间（秒）：</label>
                <input 
                  type="number" 
                  min="1" 
                  value={step.duration} 
                  onChange={(e) => {
                    const newSteps = [...scene.qpsConfig.steps];
                    newSteps[index].duration = parseInt(e.target.value) || 1;
                    setScene({
                      ...scene,
                      qpsConfig: {
                        ...scene.qpsConfig,
                        steps: newSteps
                      }
                    });
                  }}
                  style={{ marginLeft: '10px', width: '100px' }}
                />
              </div>
            ))}
            <button 
              onClick={() => setScene({
                ...scene,
                qpsConfig: {
                  ...scene.qpsConfig,
                  steps: [...scene.qpsConfig.steps, { qps: 10, duration: 300 }]
                }
              })}
            >
              添加阶梯
            </button>
          </div>
        )}

        {scene.qpsConfig.type === 'linear' && (
          <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
            <div style={{ marginBottom: '5px' }}>
              <label>起始QPS：</label>
              <input 
                type="number" 
                min="1" 
                value={scene.qpsConfig.linear.startQps} 
                onChange={(e) => setScene({
                  ...scene,
                  qpsConfig: {
                    ...scene.qpsConfig,
                    linear: {
                      ...scene.qpsConfig.linear,
                      startQps: parseInt(e.target.value) || 1
                    }
                  }
                })}
                style={{ marginLeft: '10px', width: '100px' }}
              />
            </div>
            <div style={{ marginBottom: '5px' }}>
              <label>终止QPS：</label>
              <input 
                type="number" 
                min="1" 
                value={scene.qpsConfig.linear.endQps} 
                onChange={(e) => setScene({
                  ...scene,
                  qpsConfig: {
                    ...scene.qpsConfig,
                    linear: {
                      ...scene.qpsConfig.linear,
                      endQps: parseInt(e.target.value) || 1
                    }
                  }
                })}
                style={{ marginLeft: '10px', width: '100px' }}
              />
            </div>
            <div style={{ marginBottom: '5px' }}>
              <label>持续时间（秒）：</label>
              <input 
                type="number" 
                min="1" 
                value={scene.qpsConfig.linear.duration} 
                onChange={(e) => setScene({
                  ...scene,
                  qpsConfig: {
                    ...scene.qpsConfig,
                    linear: {
                      ...scene.qpsConfig.linear,
                      duration: parseInt(e.target.value) || 1
                    }
                  }
                })}
                style={{ marginLeft: '10px', width: '100px' }}
              />
            </div>
          </div>
        )}

        {scene.qpsConfig.type === 'custom' && (
          <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
            <h3>自定义折线</h3>
            {scene.qpsConfig.custom.map((point, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                <label>时间点（秒）：</label>
                <input 
                  type="number" 
                  min="0" 
                  value={point.time} 
                  onChange={(e) => {
                    const newCustom = [...scene.qpsConfig.custom];
                    newCustom[index].time = parseInt(e.target.value) || 0;
                    setScene({
                      ...scene,
                      qpsConfig: {
                        ...scene.qpsConfig,
                        custom: newCustom
                      }
                    });
                  }}
                  style={{ marginLeft: '10px', width: '100px' }}
                />
                <label style={{ marginLeft: '20px' }}>QPS值：</label>
                <input 
                  type="number" 
                  min="1" 
                  value={point.qps} 
                  onChange={(e) => {
                    const newCustom = [...scene.qpsConfig.custom];
                    newCustom[index].qps = parseInt(e.target.value) || 1;
                    setScene({
                      ...scene,
                      qpsConfig: {
                        ...scene.qpsConfig,
                        custom: newCustom
                      }
                    });
                  }}
                  style={{ marginLeft: '10px', width: '100px' }}
                />
              </div>
            ))}
            <button 
              onClick={() => setScene({
                ...scene,
                qpsConfig: {
                  ...scene.qpsConfig,
                  custom: [...scene.qpsConfig.custom, { time: 0, qps: 10 }]
                }
              })}
            >
              添加时间点
            </button>
          </div>
        )}

        <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
          <h3>时间配置</h3>
          <div style={{ marginBottom: '5px' }}>
            <label>任务总执行时长（秒）：</label>
            <input 
              type="number" 
              min="1" 
              value={scene.qpsConfig.duration} 
              onChange={(e) => setScene({
                ...scene,
                qpsConfig: {
                  ...scene.qpsConfig,
                  duration: parseInt(e.target.value) || 1
                }
              })}
              style={{ marginLeft: '10px', width: '100px' }}
            />
          </div>
        </div>

        <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
          <h3>QPS限制</h3>
          <div style={{ marginBottom: '5px' }}>
            <label>最小QPS：</label>
            <input 
              type="number" 
              min="1" 
              value={scene.qpsConfig.minQps} 
              onChange={(e) => setScene({
                ...scene,
                qpsConfig: {
                  ...scene.qpsConfig,
                  minQps: parseInt(e.target.value) || 1
                }
              })}
              style={{ marginLeft: '10px', width: '100px' }}
            />
          </div>
          <div style={{ marginBottom: '5px' }}>
            <label>最大QPS：</label>
            <input 
              type="number" 
              min="1" 
              value={scene.qpsConfig.maxQps} 
              onChange={(e) => setScene({
                ...scene,
                qpsConfig: {
                  ...scene.qpsConfig,
                  maxQps: parseInt(e.target.value) || 1
                }
              })}
              style={{ marginLeft: '10px', width: '100px' }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>HTTP请求配置</h2>
        <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
          <div style={{ marginBottom: '5px' }}>
            <label>请求方法：</label>
            <select 
              value={scene.httpConfig.method} 
              onChange={(e) => setScene({
                ...scene,
                httpConfig: {
                  ...scene.httpConfig,
                  method: e.target.value
                }
              })}
              style={{ marginLeft: '10px' }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div style={{ marginBottom: '5px' }}>
            <label>请求地址：</label>
            <input 
              type="text" 
              value={scene.httpConfig.url} 
              onChange={(e) => setScene({
                ...scene,
                httpConfig: {
                  ...scene.httpConfig,
                  url: e.target.value
                }
              })}
              style={{ marginLeft: '10px', width: '400px' }}
              placeholder="请输入HTTP/HTTPS地址，支持动态变量如{{timestamp}}"
            />
          </div>
          <div style={{ marginBottom: '5px' }}>
            <label>请求体类型：</label>
            <select 
              value={scene.httpConfig.bodyType} 
              onChange={(e) => setScene({
                ...scene,
                httpConfig: {
                  ...scene.httpConfig,
                  bodyType: e.target.value
                }
              })}
              style={{ marginLeft: '10px' }}
            >
              <option value="json">JSON</option>
              <option value="form">Form</option>
            </select>
          </div>
          <div style={{ marginBottom: '5px' }}>
            <label>请求体：</label>
            <textarea 
              value={scene.httpConfig.body} 
              onChange={(e) => setScene({
                ...scene,
                httpConfig: {
                  ...scene.httpConfig,
                  body: e.target.value
                }
              })}
              style={{ marginLeft: '10px', width: '400px', height: '100px' }}
              placeholder="请输入请求体内容，支持动态变量如{{timestamp}}"
            />
          </div>
          <div style={{ marginBottom: '5px' }}>
            <label>请求超时（毫秒）：</label>
            <input 
              type="number" 
              min="100" 
              value={scene.httpConfig.timeout} 
              onChange={(e) => setScene({
                ...scene,
                httpConfig: {
                  ...scene.httpConfig,
                  timeout: parseInt(e.target.value) || 100
                }
              })}
              style={{ marginLeft: '10px', width: '100px' }}
            />
          </div>
          <div style={{ marginBottom: '5px' }}>
            <h3>请求头</h3>
            {scene.httpConfig.headers.map((header, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                <input 
                  type="text" 
                  placeholder="键" 
                  value={header.key || ''} 
                  onChange={(e) => {
                    const newHeaders = [...scene.httpConfig.headers];
                    newHeaders[index].key = e.target.value;
                    setScene({
                      ...scene,
                      httpConfig: {
                        ...scene.httpConfig,
                        headers: newHeaders
                      }
                    });
                  }}
                  style={{ marginRight: '10px', width: '150px' }}
                />
                <input 
                  type="text" 
                  placeholder="值，支持动态变量如{{timestamp}}" 
                  value={header.value || ''} 
                  onChange={(e) => {
                    const newHeaders = [...scene.httpConfig.headers];
                    newHeaders[index].value = e.target.value;
                    setScene({
                      ...scene,
                      httpConfig: {
                        ...scene.httpConfig,
                        headers: newHeaders
                      }
                    });
                  }}
                  style={{ marginRight: '10px', width: '200px' }}
                />
                <button 
                  onClick={() => {
                    const newHeaders = [...scene.httpConfig.headers];
                    newHeaders.splice(index, 1);
                    setScene({
                      ...scene,
                      httpConfig: {
                        ...scene.httpConfig,
                        headers: newHeaders
                      }
                    });
                  }}
                >
                  删除
                </button>
              </div>
            ))}
            <button 
              onClick={() => setScene({
                ...scene,
                httpConfig: {
                  ...scene.httpConfig,
                  headers: [...scene.httpConfig.headers, { key: '', value: '' }]
                }
              })}
            >
              添加请求头
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>动态参数配置</h2>
        <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
          <div style={{ marginBottom: '10px' }}>
            <h3>基础动态变量</h3>
            <p>支持的动态变量：</p>
            <ul>
              <li>{{timestamp}} - 毫秒级时间戳</li>
              <li>{{uuid}} - 唯一标识符</li>
              <li>{{randomString}} - 随机字符串</li>
              <li>{{randomString:10}} - 指定长度的随机字符串</li>
            </ul>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <h3>参数池</h3>
            <div style={{ marginBottom: '5px' }}>
              <label>
                <input 
                  type="checkbox" 
                  checked={scene.dynamicParams.paramPool.enabled} 
                  onChange={(e) => setScene({
                    ...scene,
                    dynamicParams: {
                      ...scene.dynamicParams,
                      paramPool: {
                        ...scene.dynamicParams.paramPool,
                        enabled: e.target.checked
                      }
                    }
                  })}
                />
                启用参数池
              </label>
            </div>
            {scene.dynamicParams.paramPool.enabled && (
              <div style={{ marginLeft: '20px' }}>
                <div style={{ marginBottom: '5px' }}>
                  <label>CSV文件路径：</label>
                  <input 
                    type="text" 
                    value={scene.dynamicParams.paramPool.filePath} 
                    onChange={(e) => setScene({
                      ...scene,
                      dynamicParams: {
                        ...scene.dynamicParams,
                        paramPool: {
                          ...scene.dynamicParams.paramPool,
                          filePath: e.target.value
                        }
                      }
                    })}
                    style={{ marginLeft: '10px', width: '300px' }}
                    placeholder="请输入CSV文件路径"
                  />
                </div>
                <div style={{ marginBottom: '5px' }}>
                  <label>取值方式：</label>
                  <select 
                    value={scene.dynamicParams.paramPool.fetchMode} 
                    onChange={(e) => setScene({
                      ...scene,
                      dynamicParams: {
                        ...scene.dynamicParams,
                        paramPool: {
                          ...scene.dynamicParams.paramPool,
                          fetchMode: e.target.value
                        }
                      }
                    })}
                    style={{ marginLeft: '10px' }}
                  >
                    <option value="random">随机</option>
                    <option value="sequence">顺序</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>前置操作配置</h2>
        <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>
              <input 
                type="checkbox" 
                checked={scene.preOperations.enabled} 
                onChange={(e) => setScene({
                  ...scene,
                  preOperations: {
                    ...scene.preOperations,
                    enabled: e.target.checked
                  }
                })}
              />
              启用前置操作
            </label>
          </div>
          
          {scene.preOperations.enabled && (
            <div style={{ marginLeft: '20px' }}>
              <h3>前置请求</h3>
              {scene.preOperations.requests.map((req, index) => (
                <div key={index} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <h4>前置请求 {index + 1}</h4>
                  <div style={{ marginBottom: '5px' }}>
                    <label>请求方法：</label>
                    <select 
                      value={req.method || 'GET'} 
                      onChange={(e) => {
                        const newRequests = [...scene.preOperations.requests];
                        newRequests[index].method = e.target.value;
                        setScene({
                          ...scene,
                          preOperations: {
                            ...scene.preOperations,
                            requests: newRequests
                          }
                        });
                      }}
                      style={{ marginLeft: '10px' }}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <label>请求地址：</label>
                    <input 
                      type="text" 
                      value={req.url || ''} 
                      onChange={(e) => {
                        const newRequests = [...scene.preOperations.requests];
                        newRequests[index].url = e.target.value;
                        setScene({
                          ...scene,
                          preOperations: {
                            ...scene.preOperations,
                            requests: newRequests
                          }
                        });
                      }}
                      style={{ marginLeft: '10px', width: '300px' }}
                      placeholder="请输入HTTP/HTTPS地址"
                    />
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <label>请求体：</label>
                    <textarea 
                      value={req.body || ''} 
                      onChange={(e) => {
                        const newRequests = [...scene.preOperations.requests];
                        newRequests[index].body = e.target.value;
                        setScene({
                          ...scene,
                          preOperations: {
                            ...scene.preOperations,
                            requests: newRequests
                          }
                        });
                      }}
                      style={{ marginLeft: '10px', width: '300px', height: '80px' }}
                      placeholder="请输入请求体内容"
                    />
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <label>请求超时（毫秒）：</label>
                    <input 
                      type="number" 
                      min="100" 
                      value={req.timeout || 5000} 
                      onChange={(e) => {
                        const newRequests = [...scene.preOperations.requests];
                        newRequests[index].timeout = parseInt(e.target.value) || 5000;
                        setScene({
                          ...scene,
                          preOperations: {
                            ...scene.preOperations,
                            requests: newRequests
                          }
                        });
                      }}
                      style={{ marginLeft: '10px', width: '100px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <h5>参数提取</h5>
                    {req.params && req.params.map((param, paramIndex) => (
                      <div key={paramIndex} style={{ marginBottom: '5px', marginLeft: '20px' }}>
                        <input 
                          type="text" 
                          placeholder="参数名称" 
                          value={param.name || ''} 
                          onChange={(e) => {
                            const newRequests = [...scene.preOperations.requests];
                            if (!newRequests[index].params) newRequests[index].params = [];
                            newRequests[index].params[paramIndex].name = e.target.value;
                            setScene({
                              ...scene,
                              preOperations: {
                                ...scene.preOperations,
                                requests: newRequests
                              }
                            });
                          }}
                          style={{ marginRight: '10px', width: '100px' }}
                        />
                        <select 
                          value={param.type || 'json'} 
                          onChange={(e) => {
                            const newRequests = [...scene.preOperations.requests];
                            if (!newRequests[index].params) newRequests[index].params = [];
                            newRequests[index].params[paramIndex].type = e.target.value;
                            setScene({
                              ...scene,
                              preOperations: {
                                ...scene.preOperations,
                                requests: newRequests
                              }
                            });
                          }}
                          style={{ marginRight: '10px' }}
                        >
                          <option value="json">JSON路径</option>
                          <option value="regex">正则表达式</option>
                        </select>
                        <input 
                          type="text" 
                          placeholder="提取规则" 
                          value={param.rule || ''} 
                          onChange={(e) => {
                            const newRequests = [...scene.preOperations.requests];
                            if (!newRequests[index].params) newRequests[index].params = [];
                            newRequests[index].params[paramIndex].rule = e.target.value;
                            setScene({
                              ...scene,
                              preOperations: {
                                ...scene.preOperations,
                                requests: newRequests
                              }
                            });
                          }}
                          style={{ marginRight: '10px', width: '150px' }}
                        />
                        <button 
                          onClick={() => {
                            const newRequests = [...scene.preOperations.requests];
                            if (newRequests[index].params) {
                              newRequests[index].params.splice(paramIndex, 1);
                            }
                            setScene({
                              ...scene,
                              preOperations: {
                                ...scene.preOperations,
                                requests: newRequests
                              }
                            });
                          }}
                        >
                          删除
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newRequests = [...scene.preOperations.requests];
                        if (!newRequests[index].params) newRequests[index].params = [];
                        newRequests[index].params.push({ name: '', type: 'json', rule: '' });
                        setScene({
                          ...scene,
                          preOperations: {
                            ...scene.preOperations,
                            requests: newRequests
                          }
                        });
                      }}
                      style={{ marginLeft: '20px' }}
                    >
                      添加参数提取
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      const newRequests = [...scene.preOperations.requests];
                      newRequests.splice(index, 1);
                      setScene({
                        ...scene,
                        preOperations: {
                          ...scene.preOperations,
                          requests: newRequests
                        }
                      });
                    }}
                    style={{ marginTop: '10px' }}
                  >
                    删除前置请求
                  </button>
                </div>
              ))}
              {scene.preOperations.requests.length < 3 && (
                <button 
                  onClick={() => setScene({
                    ...scene,
                    preOperations: {
                      ...scene.preOperations,
                      requests: [...scene.preOperations.requests, {
                        method: 'GET',
                        url: '',
                        body: '',
                        timeout: 5000,
                        params: []
                      }]
                    }
                  })}
                >
                  添加前置请求
                </button>
              )}
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>最多支持3个前置请求</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleSave}>保存场景</button>
        <button onClick={() => navigate('/')} style={{ marginLeft: '10px' }}>取消</button>
      </div>
    </div>
  );
};

export default SceneConfig;