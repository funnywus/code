# Eagle Science & Tech - 视觉实验室

高级视觉实验室，基于 Gemini AI 的多模态创作平台。

## 功能特性

- 🔐 **API Key 管理**：首次使用时提示输入 Gemini API Key，安全存储在本地浏览器
- 🏪 **旗舰店设计**：一键生成多尺寸店铺装修图
- 🎬 **经典复刻模式**：深度拆解参考视频，克隆镜头语言
- ✨ **灵感创作模式**：AI 导演从零策划商业脚本
- 🎭 **剧情大片模式**：角色锁定与连贯分镜生成
- 🛍️ **亚马逊 Listing**：电商主副图深度优化

## 快速开始

### 1. 安装依赖

```bash
pnpm install
# 或
npm install
```

### 2. 配置 API Key

首次启动应用时，系统会自动提示输入 Gemini API Key。

**获取 API Key：**
1. 访问 [Google AI Studio](https://aistudio.google.com/apikey)
2. 登录 Google 账号
3. 点击 "Get API Key" 创建新密钥
4. 复制密钥并粘贴到应用中

**修改 API Key：**
- 在侧边栏点击 "修改 API Key" 按钮
- 或清除浏览器本地存储后重新启动

### 3. 启动应用

```bash
pnpm dev
# 或
npm run dev
```

## 技术栈

- React + TypeScript
- Vite
- Tailwind CSS
- Google Gemini AI
- Lucide Icons

## 环境变量

可选：在 `.env` 文件中配置默认 API Key（不推荐，建议使用应用内配置）

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

## 联系支持

微信咨询：CoinTuring

---

© 2024 棵鹰科技 Eagle Science & Tech. All rights reserved.
