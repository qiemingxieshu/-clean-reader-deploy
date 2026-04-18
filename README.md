# 📖 纯净阅读 (Clean Reader)

类似夸克阅读模式的网页阅读工具，提取网页正文，去除广告和干扰元素。

## ✨ 功能特点

- 🧹 **纯净阅读** - 自动提取网页正文，去除广告、导航等干扰
- 📱 **响应式设计** - 完美适配 PC、平板、手机
- 🌙 **主题切换** - 支持浅色、深色、护眼三种主题
- 🔤 **字体调节** - 可调整字体大小（小/中/大/特大）
- 🌐 **跨平台** - 任何设备都能打开

## 🚀 快速开始

### 1. 安装依赖

```bash
cd reader-app
npm install
```

### 2. 启动服务

```bash
npm start
```

或者开发模式（自动重启）：

```bash
npm run dev
```

### 3. 打开浏览器

访问 `http://localhost:3000`

## 📖 使用方法

1. 在输入框中粘贴任意网页链接
2. 点击"开始阅读"按钮
3. 享受纯净的阅读体验
4. 使用工具栏切换主题、调整字体大小

## 🛠️ 技术栈

- **前端**: HTML5, CSS3, JavaScript (原生)
- **后端**: Node.js, Express
- **内容提取**: @readerapi/readability
- **HTML 解析**: JSDOM

## 📁 项目结构

```
reader-app/
├── package.json      # 项目配置和依赖
├── server.js         # 后端服务器
├── public/           # 静态资源
│   ├── index.html    # 主页面
│   ├── styles.css    # 样式文件
│   └── app.js        # 前端逻辑
└── README.md         # 说明文档
```

## 🌍 部署到云端

### Vercel 部署

1. 安装 Vercel CLI: `npm i -g vercel`
2. 在项目目录运行: `vercel`
3. 按提示完成部署

### Netlify 部署

1. 将代码推送到 GitHub
2. 在 Netlify 导入仓库
3. 自动部署

### Docker 部署

```bash
docker build -t clean-reader .
docker run -p 3000:3000 clean-reader
```

## ⚙️ 环境变量

- `PORT` - 服务端口 (默认: 3000)

## 📝 注意事项

- 某些网站可能由于反爬虫策略无法提取内容
- 建议仅用于个人学习和研究
- 尊重网站版权和 robots.txt 协议

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📄 许可证

MIT License
