# Level 3: 复现项目的详细指南

适合对象：想照着代码复现项目，并理解每个接口、每个函数、每个库具体做了什么的学生。

## 目标

复现一个可以部署到公网的共享记事本。

最终效果：

```text
浏览器打开网页
显示所有备忘录
可以新增备忘录
可以查看备忘录
可以编辑备忘录
可以删除备忘录
手机和电脑访问同一个公网地址时数据同步
```

## 第 1 步：创建项目目录

项目结构如下：

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
  render.yaml
  .gitignore
```

其中：

```text
public/   放浏览器要加载的前端文件
data/     放运行时生成的数据文件
scripts/  放测试脚本
```

## 第 2 步：初始化 npm 项目

执行：

```bash
npm init -y
```

安装 Express：

```bash
npm install express
```

`express` 是后端服务器框架，本项目使用它来：

```text
创建 Web 服务
解析 JSON 请求体
托管静态前端文件
定义 API 路由
返回 JSON 响应
```

## 第 3 步：配置 package.json

关键配置：

```json
{
  "main": "server.js",
  "engines": {
    "node": "22.x"
  },
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^5.2.1"
  }
}
```

解释：

```text
main       项目的主入口文件
engines    希望部署平台使用 Node 22
start      npm start 实际执行 node server.js
express    后端框架依赖
```

Render 部署时会运行：

```bash
npm ci
npm start
```

## 第 4 步：创建后端入口 server.js

`server.js` 的职责是：

```text
创建 Express 应用
启用 JSON 请求体解析
托管 public 静态文件
定义备忘录 API
启动服务器
导出 app 供测试使用
```

### 引入依赖

```js
const express = require('express');
const path = require('path');
const database = require('./database');
```

含义：

```text
express   创建服务器和 API
path      拼接文件路径
database  调用数据读写函数
```

### 创建 app 和端口

```js
const app = express();
const PORT = process.env.PORT || 3000;
```

`process.env.PORT` 很重要。Render 会给服务分配端口，例如 `10000`。本地没有这个变量时，就使用 `3000`。

### 解析 JSON 请求体

```js
app.use(express.json());
```

如果没有这一行，后端就无法从 `req.body.content` 里拿到前端传来的备忘录内容。

### 托管静态文件

```js
app.use(express.static(path.join(__dirname, 'public')));
```

这行代码让服务器可以返回：

```text
public/index.html
public/style.css
public/app.js
```

所以用户访问网站首页时，能看到前端页面。

## 第 5 步：实现 API

### GET /api/memos

用途：获取所有备忘录。

前端调用位置：

```js
fetch('/api/memos')
```

后端代码：

```js
app.get('/api/memos', (req, res) => {
  res.json(database.getAllMemos());
});
```

调用链：

```text
public/app.js -> GET /api/memos -> server.js -> database.getAllMemos()
```

返回数据示例：

```json
[
  {
    "id": 1,
    "content": "准备课程材料",
    "created_at": "2026-07-14T12:00:00.000Z",
    "updated_at": "2026-07-14T12:00:00.000Z"
  }
]
```

### GET /api/memos/:id

用途：获取某一条备忘录详情。

前端调用位置：

```js
fetch(`/api/memos/${id}`)
```

后端代码逻辑：

```text
从 URL 里取 id
调用 database.getMemo(id)
如果找不到，返回 404
如果找到，返回这条备忘录
```

对应代码：

```js
const memo = database.getMemo(req.params.id);
```

`req.params.id` 表示 URL 里的动态参数。

例如：

```text
/api/memos/3
```

那么：

```text
req.params.id 是 "3"
```

### POST /api/memos

用途：新增备忘录。

前端调用位置：

```js
fetch('/api/memos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content })
})
```

这里用到了 `fetch` 的几个配置：

```text
method   请求方法，POST 表示新增
headers  告诉服务器请求体是 JSON
body     真正发送的数据
```

后端处理逻辑：

```text
读取 req.body.content
去掉前后空格
如果为空，返回 400
否则调用 database.createMemo(content)
返回 201 和新增后的备忘录
```

关键代码：

```js
const content = req.body.content?.trim();
```

这里的 `?.` 是可选链，避免 `req.body.content` 不存在时报错。

### PUT /api/memos/:id

用途：编辑备忘录。

前端调用位置：

```js
fetch(`/api/memos/${currentMemoId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content })
})
```

后端处理逻辑：

```text
读取 id
读取新 content
检查 content 不能为空
调用 database.updateMemo(id, content)
如果找不到 id，返回 404
如果更新成功，返回更新后的备忘录
```

### DELETE /api/memos/:id

用途：删除备忘录。

前端调用位置：

```js
fetch(`/api/memos/${currentMemoId}`, {
  method: 'DELETE'
})
```

后端处理逻辑：

```text
读取 id
调用 database.deleteMemo(id)
如果找不到 id，返回 404
如果删除成功，返回 { success: true }
```

## 第 6 步：实现数据层 database.js

`database.js` 使用 Node 内置的 `fs` 和 `path`。

### fs

`fs` 是 file system 的缩写，用来操作文件。

本项目用到：

```js
fs.existsSync()
fs.mkdirSync()
fs.writeFileSync()
fs.readFileSync()
```

### path

`path` 用来处理路径。

```js
path.join(__dirname, 'data')
```

这样写比直接拼字符串更稳，因为 Windows 和 Linux 的路径分隔符不同。

### 数据文件位置

```js
const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'memos.json');
```

最终数据会写到：

```text
data/memos.json
```

### ensureStore()

用途：确保数据目录和数据文件存在。

流程：

```text
如果 data/ 不存在，创建 data/
如果 data/memos.json 不存在，写入空数组 []
```

### readMemos()

用途：读取所有备忘录。

流程：

```text
调用 ensureStore()
读取 data/memos.json
用 JSON.parse 转成 JavaScript 数组
```

### writeMemos(memos)

用途：把备忘录数组写回文件。

流程：

```text
调用 ensureStore()
用 JSON.stringify 把数组转成 JSON 字符串
写入 data/memos.json
```

### getAllMemos()

用途：获取所有备忘录，并按更新时间倒序排列。

关键代码思想：

```text
最新更新的备忘录排在最前面
```

### getMemo(id)

用途：根据 id 找一条备忘录。

关键点：

```js
Number(id)
```

URL 里的 id 是字符串，比如 `"3"`，而数据里的 id 是数字，比如 `3`，所以要转换。

### createMemo(content)

用途：创建备忘录。

流程：

```text
读取原来的 memos
生成当前时间 now
计算下一个 id
创建 memo 对象
push 到数组
写回文件
返回新 memo
```

id 的计算方式：

```js
const nextId = memos.reduce((maxId, memo) => Math.max(maxId, memo.id), 0) + 1;
```

意思是：找到当前最大 id，然后加 1。

### updateMemo(id, content)

用途：修改备忘录。

流程：

```text
读取 memos
根据 id 找 memo
找不到返回 null
找到后修改 content 和 updated_at
写回文件
返回修改后的 memo
```

### deleteMemo(id)

用途：删除备忘录。

流程：

```text
读取 memos
过滤掉指定 id 的 memo
如果长度没变，说明没找到
如果长度变了，写回文件
返回 true 或 false
```

## 第 7 步：实现前端页面 index.html

页面结构分为三块：

```text
主页面
新增 / 查看 / 编辑弹窗
删除确认弹窗
```

主页面：

```html
<main class="app">
  <header class="header">
    <h1>共享记事本</h1>
    <button id="newMemoButton" type="button">新增备忘录</button>
  </header>

  <section id="memoList" class="memo-list" aria-label="备忘录列表"></section>
</main>
```

`id="memoList"` 很重要，`app.js` 会通过它找到列表容器并插入备忘录。

弹窗里的关键元素：

```html
<textarea id="memoInput" rows="8" aria-label="备忘录内容"></textarea>
```

`app.js` 会读取和修改这个输入框的值。

## 第 8 步：实现样式 style.css

样式重点是：

```text
白色背景
页面最大宽度 720px
备忘录用浅灰边框卡片展示
弹窗居中
手机端按钮变成一列
```

几个关键 class：

```text
.app           页面主容器
.header        标题和新增按钮
.memo-list     备忘录列表
.memo-item     单条备忘录
.modal         弹窗遮罩
.modal-panel   弹窗内容
.hidden        隐藏元素
```

`.hidden` 很关键：

```css
.hidden {
  display: none;
}
```

前端通过添加或删除这个 class 控制弹窗显示和隐藏。

## 第 9 步：实现前端交互 app.js

### 获取页面元素

```js
const memoList = document.querySelector('#memoList');
const modal = document.querySelector('#modal');
const memoInput = document.querySelector('#memoInput');
```

`document.querySelector()` 用来从 HTML 里找到元素。

### 保存当前状态

```js
let currentMemoId = null;
let mode = 'create';
```

含义：

```text
currentMemoId  当前正在查看或编辑的备忘录 id
mode           当前弹窗模式：create、view、edit
```

### loadMemos()

用途：加载并渲染列表。

流程：

```text
请求 GET /api/memos
得到 memos 数组
清空 memoList
如果没有数据，显示“暂无备忘录”
如果有数据，为每条 memo 创建 article 元素
点击 article 时打开详情弹窗
```

### openCreateModal()

用途：打开新增弹窗。

它会：

```text
清空 currentMemoId
设置 mode 为 create
清空输入框
启用输入框
显示保存和取消按钮
隐藏编辑、删除、关闭按钮
显示弹窗
```

### openViewModal(id)

用途：打开查看弹窗。

它会：

```text
请求 GET /api/memos/:id
保存 currentMemoId
设置 mode 为 view
把内容填入 textarea
禁用 textarea
显示编辑、删除、关闭按钮
```

### switchToEditMode()

用途：从查看模式切换到编辑模式。

它会：

```text
设置 mode 为 edit
启用 textarea
显示保存、删除、取消按钮
隐藏编辑和关闭按钮
```

### saveMemo()

用途：保存新增或编辑。

核心判断：

```js
if (mode === 'create') {
  // POST /api/memos
}

if (mode === 'edit') {
  // PUT /api/memos/:id
}
```

保存成功后：

```text
关闭弹窗
重新加载列表
```

### deleteMemo()

用途：删除当前备忘录。

流程：

```text
请求 DELETE /api/memos/:id
关闭删除确认弹窗
关闭详情弹窗
重新加载列表
```

### escapeHtml(text)

用途：防止用户输入的 HTML 被浏览器当成真正标签执行。

例如用户输入：

```html
<script>alert(1)</script>
```

如果不处理，可能有安全问题。

`escapeHtml()` 会把特殊字符转换成普通文本显示。

## 第 10 步：本地运行

安装依赖：

```bash
npm install
```

启动：

```bash
npm start
```

浏览器打开：

```text
http://localhost:3000
```

## 第 11 步：局域网测试

电脑和手机连接同一个 Wi-Fi。

电脑执行：

```bash
ipconfig
```

找到 IPv4 地址，例如：

```text
192.168.1.107
```

手机访问：

```text
http://192.168.1.107:3000
```

如果手机能打开，并且新增、编辑、删除能同步，说明局域网访问成功。

## 第 12 步：部署到 Render

项目包含：

```text
render.yaml
```

内容大意：

```yaml
services:
  - type: web
    name: shared-memo-app
    runtime: node
    plan: free
    buildCommand: npm ci
    startCommand: npm start
    envVars:
      - key: NODE_VERSION
        value: 22
```

部署流程：

```text
1. 把代码推送到 GitHub
2. 在 Render 创建 Blueprint
3. 选择 GitHub 仓库
4. Render 读取 render.yaml
5. Render 执行 npm ci
6. Render 执行 npm start
7. 服务变成 Live
8. 获得公网 URL
```

## 第 13 步：接口和功能对照表

| 用户操作 | 前端函数 | API | 后端路由 | 数据函数 |
| --- | --- | --- | --- | --- |
| 打开页面加载列表 | `loadMemos()` | `GET /api/memos` | `app.get('/api/memos')` | `getAllMemos()` |
| 点击备忘录查看 | `openViewModal(id)` | `GET /api/memos/:id` | `app.get('/api/memos/:id')` | `getMemo(id)` |
| 新增并保存 | `saveMemo()` | `POST /api/memos` | `app.post('/api/memos')` | `createMemo(content)` |
| 编辑并保存 | `saveMemo()` | `PUT /api/memos/:id` | `app.put('/api/memos/:id')` | `updateMemo(id, content)` |
| 确认删除 | `deleteMemo()` | `DELETE /api/memos/:id` | `app.delete('/api/memos/:id')` | `deleteMemo(id)` |

## 第 14 步：测试脚本

项目里有：

```text
scripts/smoke-test.js
```

它会自动测试：

```text
启动 app
新增一条测试备忘录
读取列表
编辑这条备忘录
删除这条备忘录
确认每一步返回正确
```

运行：

```bash
node scripts/smoke-test.js
```

看到：

```text
Smoke test passed
```

说明核心 API 正常。

## 第 15 步：常见问题

### 为什么 data/memos.json 不提交到 GitHub

因为它是运行时数据。

`.gitignore` 里有：

```text
data/memos.json
```

这表示本地测试产生的数据不会被提交。

### 为什么不用数据库服务器

为了降低教学门槛。

这个项目重点是：

```text
前端如何请求后端
后端如何提供 API
数据如何被保存和读取
项目如何部署到公网
```

JSON 文件足够支撑这个教学目标。

### Render 上的数据会永久保存吗

不保证。

Render 免费服务重新构建或重启后，运行时文件可能丢失。因此这个项目适合教学演示，不适合正式生产使用。

### 如果要做正式项目怎么办

正式项目应该使用真正的数据库，例如：

```text
PostgreSQL
MySQL
MongoDB
```

但那属于下一阶段学习内容。

## 学习路线建议

建议按这个顺序阅读代码：

```text
1. public/index.html
2. public/style.css
3. public/app.js
4. server.js
5. database.js
6. render.yaml
7. scripts/smoke-test.js
```

这样可以从“用户看到什么”逐步走到“服务器和数据如何工作”。
