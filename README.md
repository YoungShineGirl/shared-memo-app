# 共享记事本

一个用于教学的极简共享记事本网页工程示例。

## 本地运行

```bash
npm install
npm start
```

打开：

```text
http://localhost:3000
```

## 项目结构

```text
server.js          后端服务器和 API
database.js        SQLite 数据库初始化
public/index.html  页面结构
public/style.css   页面样式
public/app.js      前端交互逻辑
data/              本地数据库目录
```

## 部署配置

部署平台需要使用：

```text
Build Command: npm install
Start Command: npm start
```

默认端口来自环境变量 `PORT`，本地没有 `PORT` 时使用 `3000`。
