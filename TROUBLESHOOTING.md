# 故障排查指南

本文档提供常见问题的诊断和解决方案。

---

## "Failed to send message" 错误排查

当您尝试发送消息时看到 "Failed to send message" 错误，请按照以下步骤进行排查：

### 1. 检查后端服务状态

**问题表现**：
- 前端无法连接到后端
- 浏览器控制台显示网络错误（ERR_CONNECTION_REFUSED）

**检查步骤**：
```bash
# 1. 检查后端进程是否运行
ps aux | grep node

# 2. 检查端口5001是否被占用
lsof -i :5001
# 或
netstat -an | grep 5001

# 3. 尝试手动访问健康检查端点
curl http://localhost:5001/api/health
```

**解决方案**：
```bash
# 如果后端未运行，启动后端服务
cd backend
npm run dev
# 或
npm run start
```

**预期结果**：
- 应该看到类似 "Server running on port 5001" 的输出
- curl命令应返回健康状态JSON

---

### 2. 检查LLM服务连接

**问题表现**：
- 后端服务正常运行
- 错误信息提示 "Cannot connect to LM Studio" 或超时

**检查步骤**：

#### 2.1 确认LM Studio运行状态
```bash
# 检查LM Studio进程
ps aux | grep "LM Studio"

# 检查端口1234是否开放
lsof -i :1234
# 或
netstat -an | grep 1234
```

#### 2.2 测试LLM API连接
```bash
# 测试LM Studio API是否可访问
curl http://127.0.0.1:1234/v1/models

# 或使用后端测试脚本
cd backend
npm run test:lm-studio
```

#### 2.3 检查环境变量配置
```bash
# 查看.env文件中的LLM配置
cat backend/.env | grep LLM
cat backend/.env | grep LM_STUDIO

# 确认以下变量设置正确：
# LLM_PROVIDER=lm-studio
# LM_STUDIO_URL=http://127.0.0.1:1234
# LLM_MODEL_NAME=你的模型名称
```

**解决方案**：

1. **启动LM Studio**：
   - 打开LM Studio应用程序
   - 加载一个模型（推荐：Llama 3.2 3B或更大）
   - 确保"Local Server"选项卡中服务器已启动
   - 确认端口为1234

2. **检查模型是否已加载**：
   - 在LM Studio中查看是否有模型被激活
   - 确认模型状态为"Running"或"Ready"

3. **修改端口配置（如果需要）**：
   ```bash
   # 如果LM Studio运行在不同端口，更新.env文件
   echo "LM_STUDIO_URL=http://127.0.0.1:YOUR_PORT" >> backend/.env

   # 重启后端服务
   ```

---

### 3. 检查CORS配置

**问题表现**：
- 浏览器控制台显示CORS错误
- 错误信息包含 "Access-Control-Allow-Origin"

**检查步骤**：
```bash
# 查看浏览器控制台的详细错误信息
# 应该会看到类似：
# "Access to XMLHttpRequest at 'http://localhost:5001/api/chat/message'
#  from origin 'http://localhost:5173' has been blocked by CORS policy"
```

**解决方案**：

1. **检查后端CORS配置**：
   ```typescript
   // backend/src/server.ts
   // 确认包含以下代码：
   app.use(cors({
     origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
     credentials: true,
   }));
   ```

2. **检查环境变量**：
   ```bash
   # 确认.env中的CORS配置
   cat backend/.env | grep CORS

   # 如果需要，添加：
   echo "CORS_ORIGIN=http://localhost:5173" >> backend/.env
   ```

3. **重启后端服务**

---

### 4. 检查API请求配置

**问题表现**：
- 前端发送请求到错误的URL
- 404 Not Found错误

**检查步骤**：

1. **查看浏览器网络面板**：
   - 打开Chrome DevTools → Network标签
   - 尝试发送消息
   - 查看请求的完整URL

2. **检查前端API配置**：
   ```bash
   # 查看前端.env文件
   cat frontend/.env | grep VITE_API_URL
   ```

**解决方案**：
```bash
# 确保前端.env文件包含正确的API地址
echo "VITE_API_URL=http://localhost:5001" >> frontend/.env

# 重新构建/重启前端
cd frontend
npm run dev
```

---

### 5. 查看详细错误日志

**获取更多诊断信息**：

#### 5.1 前端日志
打开浏览器控制台（F12），查看：
- Console标签：错误消息和堆栈跟踪
- Network标签：失败的HTTP请求详情
  - Request Headers
  - Response Headers
  - Response Body（错误详情）

#### 5.2 后端日志
```bash
# 查看后端控制台输出
# 查找以下关键信息：
# - HTTP请求日志
# - LLM服务调用日志
# - 错误堆栈跟踪

# 如果实现了文件日志，查看日志文件：
tail -f backend/logs/error.log
tail -f backend/logs/combined.log
```

#### 5.3 启用调试模式
```bash
# 设置日志级别为debug
echo "LOG_LEVEL=debug" >> backend/.env

# 重启后端服务
```

---

### 6. 网络问题排查

**问题表现**：
- 请求超时
- 连接被拒绝

**检查步骤**：
```bash
# 1. 检查防火墙设置
# macOS:
sudo pfctl -s rules

# Linux:
sudo iptables -L

# 2. 检查是否有代理设置
echo $HTTP_PROXY
echo $HTTPS_PROXY

# 3. 测试本地网络连接
ping 127.0.0.1
curl http://127.0.0.1:5001/api/health
curl http://127.0.0.1:1234/v1/models
```

**解决方案**：
1. 临时禁用防火墙测试（仅用于诊断）
2. 清除代理设置
3. 确认localhost解析正确

---

### 7. 请求超时问题

**问题表现**：
- 请求长时间无响应，最终超时
- 超时错误（ETIMEDOUT）

**可能原因**：
- LLM模型响应慢
- 模型太大，推理时间长
- 系统资源不足

**解决方案**：

1. **增加超时时间**：
   ```typescript
   // frontend/src/services/api.ts
   const api = axios.create({
     baseURL: API_BASE_URL,
     timeout: 60000, // 从30秒增加到60秒
   });
   ```

2. **使用更小的模型**：
   - 在LM Studio中切换到更小的模型（如3B或7B）
   - 重新加载模型

3. **检查系统资源**：
   ```bash
   # 检查CPU和内存使用
   top
   # 或
   htop

   # 如果资源不足，关闭其他应用程序
   ```

---

## 常见错误代码说明

### 400 Bad Request
- **原因**：请求参数验证失败
- **解决**：检查发送的消息格式，确保不为空

### 401 Unauthorized
- **原因**：认证失败（如果启用了认证）
- **解决**：检查token是否有效，重新登录

### 403 Forbidden
- **原因**：没有访问权限
- **解决**：验证邀请码或密码

### 404 Not Found
- **原因**：API端点不存在
- **解决**：检查请求URL是否正确

### 500 Internal Server Error
- **原因**：后端服务器错误
- **解决**：查看后端日志，检查LLM连接

### 502 Bad Gateway
- **原因**：LLM服务不可用
- **解决**：确保LM Studio正在运行并已加载模型

### 504 Gateway Timeout
- **原因**：LLM响应超时
- **解决**：使用更小的模型或增加超时时间

---

## 快速诊断检查清单

当遇到"Failed to send message"错误时，依次检查：

- [ ] **后端服务运行中** - `curl http://localhost:5001/api/health`
- [ ] **LM Studio运行中** - 检查应用程序是否打开
- [ ] **模型已加载** - LM Studio中模型状态为"Running"
- [ ] **端口正确** - LM Studio使用端口1234
- [ ] **前端API配置正确** - VITE_API_URL=http://localhost:5001
- [ ] **CORS配置正确** - 后端允许前端origin
- [ ] **浏览器控制台无CORS错误**
- [ ] **网络请求到达后端** - 检查Network标签
- [ ] **后端日志无错误** - 查看控制台输出

---

## 获取帮助

如果以上步骤都无法解决问题，请收集以下信息：

1. **环境信息**：
   - 操作系统和版本
   - Node.js版本：`node -v`
   - npm版本：`npm -v`
   - LM Studio版本

2. **错误详情**：
   - 浏览器控制台完整错误信息
   - 后端控制台完整错误信息
   - Network请求详情（Request/Response）

3. **配置信息**：
   - backend/.env内容（隐藏敏感信息）
   - frontend/.env内容

4. **复现步骤**：
   - 详细描述如何触发错误

然后提交Issue到GitHub仓库，或联系技术支持。

---

## 预防性措施

为避免将来出现类似问题：

1. **实现健康检查**：
   - 定期检查后端和LLM服务状态
   - 在UI中显示连接状态指示器

2. **添加详细日志**：
   - 记录所有API请求/响应
   - 记录LLM调用详情
   - 实现结构化日志系统

3. **优化错误处理**：
   - 根据错误类型显示具体提示
   - 提供重试机制
   - 实现优雅降级

4. **监控和告警**：
   - 监控API响应时间
   - 监控错误率
   - 设置告警阈值

5. **文档维护**：
   - 保持配置文档更新
   - 记录常见问题和解决方案
   - 提供快速开始指南
