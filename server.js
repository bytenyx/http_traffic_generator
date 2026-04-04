const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const systemInfo = require('systeminformation');
const { v4: uuidv4 } = require('uuid');
const Papa = require('papaparse');
const XLSX = require('xlsx');
const jsonpath = require('jsonpath');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 确保数据目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 场景数据文件
const scenesFile = path.join(dataDir, 'scenes.json');
if (!fs.existsSync(scenesFile)) {
  fs.writeFileSync(scenesFile, JSON.stringify([]));
}

// 引擎状态文件
const engineStateFile = path.join(dataDir, 'engineState.json');
if (!fs.existsSync(engineStateFile)) {
  fs.writeFileSync(engineStateFile, JSON.stringify({
    running: false,
    currentScene: null,
    startTime: null,
    metrics: {
      qps: 0,
      targetQps: 0,
      successRate: 0,
      failureRate: 0,
      avgLatency: 0
    }
  }));
}

// 日志目录
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 执行引擎
let engineInterval = null;
let requestCount = 0;
let successCount = 0;
let failureCount = 0;
let totalLatency = 0;
let lastSecond = 0;

// 参数池数据
let paramPoolData = [];
let paramPoolIndex = 0;

// 生成随机字符串
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 替换动态变量
const replaceDynamicVariables = (text) => {
  if (!text) return text;
  
  // 替换时间戳
  text = text.replace(/\{\{timestamp\}\}/g, Date.now().toString());
  
  // 替换UUID
  text = text.replace(/\{\{uuid\}\}/g, uuidv4());
  
  // 替换随机字符串
  text = text.replace(/\{\{randomString(?::(\d+))?\}\}/g, (match, length) => {
    return generateRandomString(length ? parseInt(length) : 10);
  });
  
  // 替换参数池变量
  if (paramPoolData.length > 0) {
    const param = paramPoolData[paramPoolIndex];
    paramPoolIndex = (paramPoolIndex + 1) % paramPoolData.length;
    for (const key in param) {
      text = text.replace(new RegExp(`\{\{${key}\}\}`), param[key]);
    }
  }
  
  return text;
};

// 加载参数池
const loadParamPool = (filePath, fetchMode) => {
  try {
    if (fs.existsSync(filePath)) {
      const csvContent = fs.readFileSync(filePath, 'utf8');
      const result = Papa.parse(csvContent, { header: true });
      paramPoolData = result.data;
      if (fetchMode === 'random') {
        // 随机打乱参数池
        paramPoolData.sort(() => Math.random() - 0.5);
      }
      paramPoolIndex = 0;
    }
  } catch (error) {
    console.error('Failed to load param pool:', error);
    paramPoolData = [];
  }
};

// 执行前置请求
const executePreRequest = async (preRequest, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const { method, url, body, timeout } = preRequest;
        const options = {
          hostname: new URL(url).hostname,
          port: new URL(url).port || (url.startsWith('https') ? 443 : 80),
          path: new URL(url).pathname + new URL(url).search,
          method,
          timeout: timeout || 5000
        };

        const req = (url.startsWith('https') ? https : http).request(options, (res) => {
          let responseData = '';
          res.on('data', (chunk) => {
            responseData += chunk;
          });
          res.on('end', () => {
            // 检查响应状态码
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, data: responseData, statusCode: res.statusCode });
            } else {
              reject({ 
                success: false, 
                error: `HTTP error: ${res.statusCode}`,
                statusCode: res.statusCode,
                data: responseData
              });
            }
          });
        });

        req.on('error', (error) => {
          reject({ 
            success: false, 
            error: `Network error: ${error.message}`,
            originalError: error.message
          });
        });

        req.on('timeout', () => {
          req.destroy();
          reject({ 
            success: false, 
            error: `Request timeout after ${timeout || 5000}ms`
          });
        });

        if (body) {
          req.write(body);
        }

        req.end();
      });
    } catch (error) {
      console.error(`Pre-request attempt ${attempt} failed:`, error.error || error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      // 指数退避重试
      const delay = 1000 * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// 提取参数
const extractParams = (responseData, paramsConfig) => {
  const extractedParams = {};
  
  if (!paramsConfig || paramsConfig.length === 0) {
    return extractedParams;
  }

  paramsConfig.forEach(param => {
    try {
      if (param.type === 'json') {
        // JSON路径提取
        const parsedData = JSON.parse(responseData);
        const value = jsonpath.query(parsedData, param.rule);
        if (value && value.length > 0) {
          extractedParams[param.name] = value[0];
        }
      } else if (param.type === 'regex') {
        // 正则表达式提取
        const regex = new RegExp(param.rule);
        const match = responseData.match(regex);
        if (match && match.length > 1) {
          extractedParams[param.name] = match[1];
        }
      }
    } catch (error) {
      console.error(`Failed to extract parameter ${param.name}:`, error);
    }
  });

  return extractedParams;
};

// 替换前置参数
const replacePreParams = (text, preParams) => {
  if (!text) return text;
  
  for (const key in preParams) {
    text = text.replace(new RegExp(`\{\{pre_${key}\}\}`), preParams[key]);
  }
  
  return text;
};

// 计算目标QPS
const calculateTargetQps = (qpsConfig, elapsedTime) => {
  const { type, fixedQps, steps, linear, custom, minQps, maxQps } = qpsConfig;
  let targetQps = 0;

  switch (type) {
    case 'fixed':
      targetQps = fixedQps;
      break;
    case 'step':
      let cumulativeTime = 0;
      for (const step of steps) {
        cumulativeTime += step.duration;
        if (elapsedTime < cumulativeTime) {
          targetQps = step.qps;
          break;
        }
      }
      break;
    case 'linear':
      const { startQps, endQps, duration } = linear;
      if (elapsedTime <= duration) {
        const slope = (endQps - startQps) / duration;
        targetQps = startQps + slope * elapsedTime;
      } else {
        targetQps = endQps;
      }
      break;
    case 'custom':
      // 找到当前时间点对应的QPS值
      let currentQps = 0;
      for (let i = 0; i < custom.length; i++) {
        if (elapsedTime >= custom[i].time) {
          currentQps = custom[i].qps;
        } else {
          break;
        }
      }
      targetQps = currentQps;
      break;
    default:
      targetQps = fixedQps;
  }

  // 应用QPS上下限
  return Math.max(minQps, Math.min(maxQps, targetQps));
};

// 发送HTTP请求
const sendHttpRequest = (httpConfig, preParams = {}) => {
  return new Promise((resolve) => {
    const start = Date.now();
    
    // 替换动态变量和前置参数
    let url = httpConfig.url;
    url = replaceDynamicVariables(url);
    url = replacePreParams(url, preParams);
    
    const options = {
      hostname: new URL(url).hostname,
      port: new URL(url).port || (url.startsWith('https') ? 443 : 80),
      path: new URL(url).pathname + new URL(url).search,
      method: httpConfig.method,
      headers: {}
    };

    // 添加请求头（替换动态变量和前置参数）
    if (httpConfig.headers && httpConfig.headers.length > 0) {
      httpConfig.headers.forEach(header => {
        let value = header.value;
        value = replaceDynamicVariables(value);
        value = replacePreParams(value, preParams);
        options.headers[header.key] = value;
      });
    }

    const req = (url.startsWith('https') ? https : http).request(options, (res) => {
      const latency = Date.now() - start;
      totalLatency += latency;
      successCount++;
      resolve({ success: true, latency });
    });

    req.on('error', (error) => {
      const latency = Date.now() - start;
      totalLatency += latency;
      failureCount++;
      resolve({ success: false, latency, error: error.message });
    });

    // 设置超时
    req.setTimeout(httpConfig.timeout, () => {
      const latency = Date.now() - start;
      totalLatency += latency;
      failureCount++;
      req.destroy();
      resolve({ success: false, latency, error: 'Request timeout' });
    });

    // 发送请求体（替换动态变量和前置参数）
    if (httpConfig.body) {
      let body = httpConfig.body;
      body = replaceDynamicVariables(body);
      body = replacePreParams(body, preParams);
      req.write(body);
    }

    req.end();
  });
};

// 检查资源使用情况
const checkResourceUsage = async (cpuLimit, memoryLimit) => {
  try {
    const cpu = await systemInfo.currentLoad();
    const memory = await systemInfo.mem();
    const cpuUsage = cpu.currentload;
    const memoryUsage = (memory.used / memory.total) * 100;

    return {
      cpuUsage,
      memoryUsage,
      overLimit: cpuUsage > cpuLimit || memoryUsage > memoryLimit
    };
  } catch (error) {
    console.error('Failed to check resource usage:', error);
    return { cpuUsage: 0, memoryUsage: 0, overLimit: false };
  }
};

// 启动执行引擎
const startEngine = async (sceneId) => {
  try {
    const scenes = JSON.parse(fs.readFileSync(scenesFile, 'utf8'));
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }

    const { qpsConfig, httpConfig, dynamicParams, preOperations } = scene;
    const startTime = Date.now();
    requestCount = 0;
    successCount = 0;
    failureCount = 0;
    totalLatency = 0;
    lastSecond = Math.floor(Date.now() / 1000);
    let preParams = {};

    // 加载参数池
    if (dynamicParams && dynamicParams.paramPool && dynamicParams.paramPool.enabled) {
      loadParamPool(dynamicParams.paramPool.filePath, dynamicParams.paramPool.fetchMode);
    } else {
      paramPoolData = [];
    }

    // 执行前置操作
    if (preOperations && preOperations.enabled && preOperations.requests && preOperations.requests.length > 0) {
      for (const preRequest of preOperations.requests) {
        try {
          const result = await executePreRequest(preRequest);
          if (result.success) {
            // 提取参数
            if (preRequest.params && preRequest.params.length > 0) {
              const extracted = extractParams(result.data, preRequest.params);
              preParams = { ...preParams, ...extracted };
            }
          } else {
            throw new Error(`前置请求失败: ${result.error}`);
          }
        } catch (error) {
          console.error('Failed to execute pre-request:', error);
          stopEngine();
          return;
        }
      }
    }

    // 更新引擎状态
    const state = {
      running: true,
      currentScene: sceneId,
      startTime: new Date().toISOString(),
      metrics: {
        qps: 0,
        targetQps: 0,
        successRate: 0,
        failureRate: 0,
        avgLatency: 0
      }
    };
    fs.writeFileSync(engineStateFile, JSON.stringify(state, null, 2));

    // 执行引擎循环
    engineInterval = setInterval(async () => {
      const currentTime = Date.now();
      const elapsedTime = (currentTime - startTime) / 1000;
      const currentSecond = Math.floor(currentTime / 1000);

      // 检查是否达到任务总时长
      if (elapsedTime >= qpsConfig.duration) {
        stopEngine();
        return;
      }

      // 计算目标QPS
      const targetQps = calculateTargetQps(qpsConfig, elapsedTime);

      // 检查资源使用情况
      const resourceUsage = await checkResourceUsage(80, 80); // CPU和内存限制为80%
      let adjustedQps = targetQps;
      if (resourceUsage.overLimit) {
        // 资源使用超出限制，降低QPS
        adjustedQps = Math.max(qpsConfig.minQps, targetQps * 0.8);
      }

      // 计算当前秒需要发送的请求数
      if (currentSecond > lastSecond) {
        // 重置计数器
        requestCount = 0;
        lastSecond = currentSecond;
      }

      // 发送请求
      if (requestCount < adjustedQps) {
        sendHttpRequest(httpConfig, preParams);
        requestCount++;
      }

      // 更新监控指标
      const totalRequests = successCount + failureCount;
      const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 0;
      const failureRate = totalRequests > 0 ? (failureCount / totalRequests) * 100 : 0;
      const avgLatency = totalRequests > 0 ? totalLatency / totalRequests : 0;

      // 更新引擎状态
      const updatedState = {
        running: true,
        currentScene: sceneId,
        startTime: state.startTime,
        metrics: {
          qps: requestCount,
          targetQps: adjustedQps,
          successRate,
          failureRate,
          avgLatency
        }
      };
      fs.writeFileSync(engineStateFile, JSON.stringify(updatedState, null, 2));

    }, 10); // 每10毫秒检查一次

  } catch (error) {
    console.error('Failed to start engine:', error);
    stopEngine();
  }
};

// 停止执行引擎
const stopEngine = () => {
  if (engineInterval) {
    clearInterval(engineInterval);
    engineInterval = null;
  }

  // 更新引擎状态
  const state = {
    running: false,
    currentScene: null,
    startTime: null,
    metrics: {
      qps: 0,
      targetQps: 0,
      successRate: 0,
      failureRate: 0,
      avgLatency: 0
    }
  };
  fs.writeFileSync(engineStateFile, JSON.stringify(state, null, 2));
};

// API路由

// 获取所有场景
app.get('/api/scenes', (req, res) => {
  try {
    const scenes = JSON.parse(fs.readFileSync(scenesFile, 'utf8'));
    res.json(scenes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read scenes' });
  }
});

// 创建场景
app.post('/api/scenes', (req, res) => {
  try {
    const scenes = JSON.parse(fs.readFileSync(scenesFile, 'utf8'));
    const newScene = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    scenes.push(newScene);
    fs.writeFileSync(scenesFile, JSON.stringify(scenes, null, 2));
    res.json(newScene);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create scene' });
  }
});

// 更新场景
app.put('/api/scenes/:id', (req, res) => {
  try {
    const scenes = JSON.parse(fs.readFileSync(scenesFile, 'utf8'));
    const index = scenes.findIndex(scene => scene.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Scene not found' });
    }
    scenes[index] = {
      ...scenes[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(scenesFile, JSON.stringify(scenes, null, 2));
    res.json(scenes[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update scene' });
  }
});

// 删除场景
app.delete('/api/scenes/:id', (req, res) => {
  try {
    const scenes = JSON.parse(fs.readFileSync(scenesFile, 'utf8'));
    const filteredScenes = scenes.filter(scene => scene.id !== req.params.id);
    fs.writeFileSync(scenesFile, JSON.stringify(filteredScenes, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete scene' });
  }
});

// 获取引擎状态
app.get('/api/engine/state', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(engineStateFile, 'utf8'));
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read engine state' });
  }
});

// 启动引擎
app.post('/api/engine/start', (req, res) => {
  try {
    const { sceneId } = req.body;
    startEngine(sceneId);
    const state = JSON.parse(fs.readFileSync(engineStateFile, 'utf8'));
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start engine' });
  }
});

// 停止引擎
app.post('/api/engine/stop', (req, res) => {
  try {
    stopEngine();
    const state = JSON.parse(fs.readFileSync(engineStateFile, 'utf8'));
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop engine' });
  }
});

// 导出报表
app.get('/api/engine/export-report', (req, res) => {
  try {
    // 生成报表数据
    const reportData = [
      ['指标', '值'],
      ['总请求数', successCount + failureCount],
      ['成功数', successCount],
      ['失败数', failureCount],
      ['成功率', `${((successCount / (successCount + failureCount)) * 100).toFixed(2)}%`],
      ['失败率', `${((failureCount / (successCount + failureCount)) * 100).toFixed(2)}%`],
      ['平均时延', `${(totalLatency / (successCount + failureCount)).toFixed(2)} ms`]
    ];

    // 创建工作簿和工作表
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, '报表');

    // 生成Excel文件
    const filename = `report_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, 'logs', filename);
    XLSX.writeFile(wb, filePath);

    // 发送文件
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Failed to download report:', err);
        res.status(500).json({ error: 'Failed to download report' });
      } else {
        // 清理临时文件
        setTimeout(() => {
          fs.unlinkSync(filePath);
        }, 5000);
      }
    });
  } catch (error) {
    console.error('Failed to export report:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'client', 'build')));

// 前端路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});