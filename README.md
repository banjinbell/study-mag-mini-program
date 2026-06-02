# 学伴 · STUDY MAG

> 微信小程序——把各类平台的截图或文字喂进来，AI 把它扩展成结构化学习资料，再合成一段双人播客音频，支持锁屏播放。

🔗 **在线视觉 Demo（GitHub Pages）：** https://banjinbell.github.io/hearly-mini-program/

> 注：在线 Demo 只是首屏设计稿的 1:1 静态预览，真正的小程序需要在微信里运行。要体验完整功能请按下方"自部署指南"自行跑一份。

---

## 它能做什么

```
┌──────────┐    ┌────────────┐    ┌──────────┐    ┌────────┐
│ 上传截图  │ →  │ 视觉 OCR    │ →  │ 概念抽取  │ →  │ 三路   │
│ 或粘文字  │    │ (qwen-vl)  │    │           │    │ 并行扩 │
└──────────┘    └────────────┘    └──────────┘    │  写    │
                                                  └───┬────┘
                                                      ↓
                                      ┌──────────┐  综合
                                  ┌── │  双人 TTS │ ←─ 对话稿
                                  │   └──────────┘
                                  ↓
                          锁屏播放学习播客
```

- **3 页**：提交 / 历史 / 播放
- **后端**：CloudBase 云函数管线（fire-and-forget，全程 < 5 分钟）
- **模型**：视觉 qwen3-vl-plus / 文本 deepseek-v4-flash / TTS tencent-podcast
- **播放**：`wx.getBackgroundAudioManager` 支持锁屏与后台

---

## 项目结构

```
miniprogram/              微信小程序前端（TDesign）
  pages/
    submit/               提交页（上传截图 / 粘贴文字）
    list/                 历史任务
    player/               播放页（db.watch 实时更新）
  utils/api.js            云函数调用封装
  env.config.js           ← 本地环境 ID（gitignored）

cloudfunctions/           CloudBase 云函数
  createTask/             创建任务记录（同步，<1s）
  processTask/            主管线（300s 超时）
    skills/               每步 prompt（带 YAML frontmatter）
    providers/
      vision/             视觉 OCR
      text/               文本生成
      tts/                双人对话 TTS
  extractConcepts/        快速抽概念供 focus picker
  cronCleanup/            每 5 分钟扫一遍卡住的任务

scripts/                  本地 benchmark（评估各模型质量）
docs/                     设计稿 / 迁移文档 / 在线 Demo
```

---

## 自部署指南

> 这是开源仓库，**不包含** AppID、CloudBase 环境 ID、API Key。要跑起来需要自己准备以下 4 样东西。

### 1. 准备账号

| 需要 | 在哪申请 |
|---|---|
| 小程序 AppID | https://mp.weixin.qq.com |
| CloudBase 环境 | https://console.cloud.tencent.com/tcb（推荐开通"小程序成长计划"，免费送 Token） |
| DeepSeek API Key | https://platform.deepseek.com |
| Dashscope (千问) API Key | https://dashscope.console.aliyun.com |
| 腾讯云 TTS 凭证 | https://console.cloud.tencent.com/cam（SecretId / SecretKey + AppID） |

### 2. 克隆并填本地配置

```bash
git clone https://github.com/banjinbell/hearly-mini-program.git
cd hearly-mini-program

# 微信小程序工程配置
cp project.config.example.json project.config.json
#   编辑 project.config.json，把 "appid" 改成你的小程序 AppID

# CloudBase 环境配置
cp miniprogram/env.config.example.js miniprogram/env.config.js
#   编辑 env.config.js，填入你的 CloudBase 环境 ID

# 本地 benchmark 用的密钥（可选，前端跑不需要）
cp scripts/.env.example scripts/.env
#   填入 4 套 API Key
```

### 3. 部署云函数

```bash
# 安装 CloudBase CLI
npm i -g @cloudbase/cli
tcb login

# 部署 4 个云函数
cd cloudfunctions/createTask     && npm i && cd -
cd cloudfunctions/processTask    && npm i && cd -
cd cloudfunctions/extractConcepts && npm i && cd -
cd cloudfunctions/cronCleanup    && npm i && cd -

tcb fn deploy createTask -e <your-env-id>
tcb fn deploy processTask -e <your-env-id>
tcb fn deploy extractConcepts -e <your-env-id>
tcb fn deploy cronCleanup -e <your-env-id>
```

### 4. 给云函数配环境变量

在 CloudBase 控制台 → 云函数 → processTask → 环境变量，填入：

```
VISION_PROVIDER=qwen3-vl-plus
TEXT_PROVIDER=deepseek-v4-flash
REASONING_TEXT_PROVIDER=deepseek-v4-pro
TTS_PROVIDER=tencent-podcast

DASHSCOPE_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...
TENCENT_APP_ID=...
TENCENT_SECRET_ID=...
TENCENT_SECRET_KEY=...
```

### 5. 打开小程序

微信开发者工具 → 导入项目 → 选 repo 根目录 → 编译。

---

## 本地 benchmark（评估模型质量）

```bash
cd scripts
cp .env.example .env        # 填 API Key
npm i
npm run bench               # 跑全套
npm run bench:text          # 只跑文本
npm run bench:vision        # 视觉（需 fixtures/*.jpg）
npm run bench:tts           # TTS，输出到 fixtures/output/
```

---

## 文档

- [`CLAUDE.md`](CLAUDE.md) — 给 AI 助手看的项目说明（架构 / 约定 / 易踩坑）

---

## 许可

MIT
