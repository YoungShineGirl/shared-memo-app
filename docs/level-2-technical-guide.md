# Level 2: 技术栈和实现细节

适合对象：已经理解网页分为前端和后端，想进一步知道本项目用了哪些技术、每个文件做什么、功能是怎么实现的学生。

## 项目技术栈

本项目使用的技术栈很轻量：

```text
前端：HTML + CSS + 原生 JavaScript
后端：Node.js + Express
数据存储：JSON 文件
依赖管理：npm
代码托管：GitHub
公网部署：Render
```

没有使用 Vue、React、数据库服务器或复杂构建工具，是为了让学生先看清楚网页工程最基本的结构。

## 项目目录

```text
shared-memo-app/
  public/
    index.html
    style.css
    app.js
  data/
    .gitkeep
  scripts/
    smoke-test.js
  database.js
  server.js
  package.json
  package-lock.json
  render.yaml
  README.md
```

## 各文件职责

### public/index.html

负责页面结构。

里面包含：

```text
标题
新增备忘录按钮
备忘录列表容器
新增 / 查看 / 编辑弹窗
删除确认弹窗
style.css 引用
app.js 引用
```

HTML 不负责保存数据，也不负责请求服务器。它主要提供浏览器要显示的元素。

### public/style.css

负责页面外观。

它定义了：

```text
白色背景
页面最大宽度
按钮样式
备忘录卡片样式
弹窗样式
手机端布局适配
```

### public/app.js

负责前端交互。

它做的事情包括：

```text
找到页面上的按钮、输入框、列表区域
监听按钮点击事件
调用 fetch 请求后端 API
根据后端返回的数据更新页面
控制弹窗打开和关闭
```

这是浏览器里运行的 JavaScript。

### server.js

负责后端服务和 API。

它使用 Express 创建服务器，并定义 API：

```text
GET    /api/memos
GET    /api/memos/:id
POST   /api/memos
PUT    /api/memos/:id
DELETE /api/memos/:id
```

同时它也负责托管静态网页：

```js
app.use(express.static(path.join(__dirname, 'public')));
```

这行代码表示：浏览器访问网站首页时，服务器可以把 `public/` 里的 HTML、CSS、JS 文件发给浏览器。

### database.js

负责数据读写。

虽然文件名叫 database，但它现在不是连接传统数据库，而是用 JSON 文件存储数据。

它导出这些函数：

```text
getAllMemos()
getMemo(id)
createMemo(content)
updateMemo(id, content)
deleteMemo(id)
```

`server.js` 不直接操作文件，而是调用这些函数。这是一个很重要的工程习惯：让不同文件各自负责一类事情。

### package.json

负责说明项目如何运行，以及需要哪些依赖。

关键内容：

```json
{
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^5.2.1"
  }
}
```

Render 部署时也会读取这个文件。

### render.yaml

负责告诉 Render 怎么部署这个项目。

关键配置：

```yaml
buildCommand: npm ci
startCommand: npm start
```

含义：

```text
npm ci       根据 package-lock.json 安装依赖
npm start    启动服务器
```

## 前端如何请求后端

前端使用浏览器内置的 `fetch`。

获取备忘录列表：

```js
const response = await fetch('/api/memos');
const memos = await response.json();
```

新增备忘录：

```js
await fetch('/api/memos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content })
});
```

编辑备忘录：

```js
await fetch(`/api/memos/${currentMemoId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content })
});
```

删除备忘录：

```js
await fetch(`/api/memos/${currentMemoId}`, {
  method: 'DELETE'
});
```

## 后端如何接收请求

Express 使用路由处理不同请求。

例如新增备忘录：

```js
app.post('/api/memos', (req, res) => {
  const content = req.body.content?.trim();

  if (!content) {
    res.status(400).json({ error: 'Content is required' });
    return;
  }

  res.status(201).json(database.createMemo(content));
});
```

这里可以看到三个动作：

```text
1. 从请求体里取 content
2. 检查内容不能为空
3. 调用 database.createMemo 保存并返回结果
```

## 数据如何保存

`database.js` 使用 Node.js 内置模块：

```js
const fs = require('fs');
const path = require('path');
```

其中：

```text
fs    用来读写文件
path  用来拼接跨平台文件路径
```

数据文件路径：

```js
const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'memos.json');
```

如果文件不存在，程序会自动创建：

```js
fs.writeFileSync(dataFile, '[]\n');
```

备忘录保存为数组：

```json
[
  {
    "id": 1,
    "content": "第一条备忘录",
    "created_at": "2026-07-14T12:00:00.000Z",
    "updated_at": "2026-07-14T12:00:00.000Z"
  }
]
```

## 为什么不用 SQLite

项目最初可以用 SQLite 教学，但部署到 Render 时，`sqlite3` 是原生模块，可能遇到 Linux 系统库兼容问题。

为了让教学项目更容易公网部署，现在改成 JSON 文件存储：

```text
优点：部署简单，不需要原生依赖
缺点：不适合高并发和长期生产使用
```

这对教学演示是合适的，因为重点是理解前后端架构和 API 流程。

## 主要功能流程

### 加载列表

```text
浏览器打开网页
app.js 执行 loadMemos()
fetch('/api/memos')
server.js 调用 database.getAllMemos()
database.js 读取 data/memos.json
返回备忘录数组
app.js 渲染列表
```

### 新增备忘录

```text
点击新增
打开弹窗
输入内容
点击保存
POST /api/memos
createMemo(content)
写入 data/memos.json
重新加载列表
```

### 编辑备忘录

```text
点击某条备忘录
GET /api/memos/:id
打开查看弹窗
点击编辑
修改内容
PUT /api/memos/:id
updateMemo(id, content)
重新加载列表
```

### 删除备忘录

```text
点击某条备忘录
点击删除
打开确认弹窗
点击确认删除
DELETE /api/memos/:id
deleteMemo(id)
重新加载列表
```

## 这个项目的工程思想

这个项目虽然小，但已经体现了几个重要工程思想：

```text
前端和后端分工
页面和数据分离
API 作为沟通接口
数据访问集中在 database.js
部署配置写入 render.yaml
依赖写入 package.json
```

这些思想在更大的真实项目中也会继续使用。
