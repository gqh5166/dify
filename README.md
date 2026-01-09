# dify

## P2P 阅后即焚图片传输演示

这是一个基于 WebRTC 的点对点（P2P）端到端加密图片传输示例，实现了阅后即焚功能。

### 主要特性

- **端到端加密**：使用 ECDH (P-256) 进行密钥协商，AES-GCM 加密图片数据
- **点对点传输**：通过 WebRTC DataChannel 直接传输，服务器不保存图片或密钥
- **阅后即焚**：接收端查看图片后 10 秒自动销毁，并尽力清零内存中的敏感数据
- **最小化信令服务器**：仅用于转发 WebRTC 信令和房间管理，不存储任何用户数据

### 技术架构

#### 服务器端 (server.js)
- Node.js + Express + WebSocket (ws)
- 仅提供信令转发和房间管理功能
- 不保存图片、密钥或任何明文数据

#### 客户端 (public/index.html)
- 单文件 HTML 应用，包含完整的 UI 和逻辑
- ECDH 临时密钥协商（P-256 曲线）
- AES-GCM 端到端加密
- WebRTC DataChannel 点对点传输
- 分片发送机制（16KB 每片）
- Canvas 渲染和水印
- 倒计时后自动清理敏感数据

### 安装和运行

#### 前置要求
- Node.js 14+ 
- npm

#### 步骤

1. **安装依赖**
```bash
npm install
```

2. **启动服务器**
```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

3. **使用方法**

**发送端操作：**
1. 打开浏览器访问 `http://localhost:3000`
2. 点击"创建会话"按钮
3. 复制显示的房间 ID 并发送给接收端
4. 等待接收端加入
5. 连接建立后，点击"选择并发送图片"选择要发送的图片

**接收端操作：**
1. 打开浏览器访问 `http://localhost:3000`（可以在另一个标签页或设备）
2. 输入发送端提供的房间 ID
3. 点击"加入会话"
4. 等待 P2P 连接建立和密钥协商完成
5. 接收并查看加密传输的图片
6. 图片将在 10 秒后自动销毁

### 安全说明

#### 安全特性
- ✅ 端到端加密：ECDH + AES-GCM
- ✅ 临时密钥：每次会话生成新的密钥对
- ✅ 服务器零知识：信令服务器不接触明文或密钥
- ✅ 点对点传输：图片数据直接在两端传输，不经过服务器
- ✅ 阅后即焚：接收端查看后自动销毁
- ✅ 内存清理：尽最大努力撤销 ObjectURL 和清空引用

#### 已知限制

⚠️ **本应用无法阻止以下行为：**
- 用户截屏（Ctrl+PrintScreen、系统截图工具等）
- 用户使用相机或手机拍摄屏幕
- 恶意浏览器扩展或恶意软件
- 浏览器开发者工具调试和数据导出

⚠️ **NAT 穿透限制：**
- 使用公共 STUN 服务器进行 NAT 穿透
- 在对称 NAT 环境下可能连接失败
- 若需要更强的连接能力，需配置 TURN 服务器（但会导致数据经过中继服务器）

⚠️ **JavaScript 内存管理：**
- JavaScript 无法保证立即清零内存
- 垃圾回收机制由浏览器控制
- 敏感数据可能在内存中残留直到被覆盖

#### 建议

- 🔒 不要传输极度敏感的内容
- 🔒 在可信的网络环境下使用
- 🔒 使用 HTTPS 部署到生产环境
- 🔒 考虑在物理安全的环境中使用

### 部署到生产环境

1. **使用 HTTPS**
   - 获取 SSL 证书（Let's Encrypt 等）
   - 配置 HTTPS 服务器

2. **配置环境变量**
```bash
PORT=3000 npm start
```

3. **使用 PM2 或其他进程管理器**
```bash
npm install -g pm2
pm2 start server.js --name webrtc-image-demo
```

4. **（可选）配置 TURN 服务器**

编辑 `public/index.html` 中的 ICE 服务器配置：
```javascript
pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { 
      urls: 'turn:your-turn-server.com:3478',
      username: 'user',
      credential: 'password'
    }
  ]
});
```

### 许可证

MIT

### 贡献

欢迎提交 Issue 和 Pull Request！

### 技术细节

#### 加密流程
1. 双方生成 ECDH 密钥对（P-256 曲线）
2. 通过信令服务器交换公钥
3. 使用对方公钥和自己私钥派生共享密钥
4. 导入共享密钥为 AES-GCM 密钥（256 位）
5. 发送端使用随机 IV 加密图片
6. 接收端使用相同 IV 解密图片

#### 传输流程
1. 发送端读取图片为 ArrayBuffer
2. 使用 AES-GCM 加密
3. 分片为 16KB 的块
4. 通过 DataChannel 发送元数据（IV、分片数）
5. 逐个发送加密分片
6. 接收端合并分片并解密
7. 使用 Canvas 渲染并添加水印
8. 倒计时 10 秒后销毁

#### 清理机制
- 撤销 Blob ObjectURL
- 清空数组和变量引用
- 关闭 DataChannel 和 PeerConnection
- 通知服务器销毁房间
- 关闭 WebSocket 连接
