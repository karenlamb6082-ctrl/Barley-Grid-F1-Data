import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-server',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          // 尝试加载根目录的 .env 文件到 process.env (以便本地开发直接读取密钥)
          try {
            const envPath = path.resolve(process.cwd(), '.env');
            if (fs.existsSync(envPath)) {
              const envContent = fs.readFileSync(envPath, 'utf-8');
              envContent.split('\n').forEach(line => {
                const matched = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
                if (matched) {
                  const key = matched[1].trim();
                  let val = matched[2].trim();
                  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                  }
                  process.env[key] = val;
                }
              });
            }
          } catch (e) {
            // 忽略 env 加载失败
          }

          if (req.url === '/api/hot-topics') {
            try {
              // 动态导入 api 函数
              const { default: handler } = await import('./api/hot-topics.js');
              
              const mockReq = {
                method: req.method,
                headers: req.headers,
                url: req.url,
              };
              
              const mockRes = {
                statusCode: 200,
                headers: {},
                setHeader(name, val) {
                  this.headers[name] = val;
                  res.setHeader(name, val);
                },
                status(code) {
                  this.statusCode = code;
                  res.statusCode = code;
                  return this;
                },
                json(data) {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify(data));
                  return this;
                },
                end(data) {
                  res.end(data);
                  return this;
                }
              };
              
              await handler(mockReq, mockRes);
              return;
            } catch (err) {
              console.error('Vite 本地 API 模拟器执行失败:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
          }

          // 挂载 /api/chat 对话仿真代理
          if (req.url === '/api/chat' && req.method === 'POST') {
            try {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { default: handler } = await import('./api/chat.js');
                  
                  const mockReq = {
                    method: req.method,
                    headers: req.headers,
                    url: req.url,
                    body: JSON.parse(body || '{}')
                  };
                  
                  const mockRes = {
                    statusCode: 200,
                    headers: {},
                    setHeader(name, val) {
                      this.headers[name] = val;
                      res.setHeader(name, val);
                    },
                    status(code) {
                      this.statusCode = code;
                      res.statusCode = code;
                      return this;
                    },
                    json(data) {
                      res.setHeader('Content-Type', 'application/json; charset=utf-8');
                      res.end(JSON.stringify(data));
                      return this;
                    },
                    end(data) {
                      res.end(data);
                      return this;
                    }
                  };
                  
                  await handler(mockReq, mockRes);
                } catch (innerErr) {
                  console.error('Vite 本地 Chat API 执行失败:', innerErr);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: innerErr.message }));
                }
              });
              return;
            } catch (err) {
              console.error('Vite 本地 API Body 解析失败:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
          }

          next();
        });
      }
    }
  ],
  server: {
    proxy: {
      // 代理 F1 官方 LiveTiming 静态数据，绕过 CORS
      '/f1timing': {
        target: 'https://livetiming.formula1.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/f1timing/, '/static'),
      },
    },
  },
})
