# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目简介

**学伴**——微信小程序，用户上传公众号/小红书截图或粘贴文字，AI 将内容扩展为结构化学习资料，再合成双人播客音频，支持锁屏播放。Phase 1 后端已完成部署，Phase 2 进入前端开发。

- CloudBase 环境：`<your-env-id>`（个人版 baas_personal，小程序成长计划自动开通）
  - 含 1 亿 hy3-preview Token 资源包 + 1 万张 hunyuan-image 资源包，2026-11-28 到期
  - 旧环境 `<old-env-id>`（体验版 baas_trial）已废弃，不享免费 Token
- AppID：`<your-appid>`

## 常用命令

```bash
# 运行 Benchmark（评估各模型输出质量）
cd scripts
cp .env.example .env        # 首次：填入 API Keys
npm run bench               # = node benchmark.js all
npm run bench:text          # 跑所有文本 provider
npm run bench:vision        # 视觉 provider（需 fixtures/*.jpg）
npm run bench:tts           # TTS，生成 fixtures/output/tts-*.mp3
node benchmark.js text deepseek-v4-flash  # 只跑指定 provider（无 npm 快捷方式）

# 部署单个云函数（推荐 MCP，不走 CLI）
mcp__cloudbase__manageFunctions action=updateFunctionCode \
  functionName=processTask functionRootPath=cloudfunctions
# 改环境变量
mcp__cloudbase__manageFunctions action=updateFunctionConfig \
  functionName=processTask envVariables='{...}'
```

**前端开发**（微信开发者工具内操作）：
- `miniprogram/` 下改动后实时热更（开发者工具自动编译）
- 装新 npm 包后必须：微信开发者工具 → 工具 → 构建 npm

## 整体架构

### 数据流

```
提交页 → createTask（返回 taskId, <1s）
            ↓ fire-and-forget
        processTask（300s，跑完整管线）
            ↓ 写 tasks 集合
播放页 ← db.watch() 实时监听 ← status=done
```

### 云函数（`cloudfunctions/`）

| 函数 | Timeout | 作用 |
|---|---|---|
| `createTask` | 10s | 创建任务记录（同步），fire-and-forget 触发 processTask |
| `extractConcepts` | 60s | 提交后快速提取 5-10 个候选概念（供用户 focus picker 用） |
| `processTask` | 300s | 主管线：OCR→概念→三路补充（并行）→综合→对话稿→TTS→上传 |
| `cronCleanup` | 30s | 每 5 分钟触发，将卡 >10 分钟的 pending 标记 failed |

**processTask 管线顺序**：
1. 视觉 OCR（图片输入时，`providers/vision/`）
2. `01-extract-concepts` → 确认概念
3. 并行三路：`02-add-background` + `03-expand-related` + `04-critical-perspective`（默认走 REASONING_TEXT_PROVIDER）
4. `05-synthesize-article` → 综合学习资料
5. `06-write-dialogue` → 对话稿
6. TTS 合成（`providers/tts/`）→ 上传云存储
7. 订阅消息推送（可选，需 `TMPL_ID`）

### Skill 文件（`cloudfunctions/processTask/skills/`）

每个 `.skill.md` 有 YAML frontmatter（`preferred_model`、`max_tokens`、`temperature`）+ 系统 prompt 正文。`loader.js` 解析 frontmatter，按 `preferred_model` → `TEXT_PROVIDER` 环境变量 → `deepseek-v3` 的优先级选 provider。

### Provider 层（`cloudfunctions/processTask/providers/`）

```
providers/
├── vision/index.js      # qwen3-vl-plus（首选）
├── text/index.js        # deepseek-v4-flash（主力）、deepseek-v4-pro（推理）、hy3-preview 等
└── tts/index.js         # tencent-podcast（首选，原生双人）
```

每个 text provider 导出 `runWithSkill({ systemPrompt, userInput, options })`，TTS provider 导出 `synthesizeDialogue(dialogue)`。

### 数据库（`tasks` 集合）

关键字段：`_openid`、`taskId`（唯一索引）、`status`（pending/processing/done/failed）、`inputType`（image/text）、`inputFileID`、`inputText`、`extractedConcepts`、`selectedConcepts`、`dialogue`、`audioFileID`

安全规则：读限自己 `_openid`，写全部禁止（只能由云函数操作）。

### 前端（`miniprogram/`）

- **3 页**：`pages/submit`（输入）、`pages/list`（历史）、`pages/player`（播放）
- **UI**：TDesign MiniProgram（`miniprogram/node_modules/tdesign-miniprogram`）
- **API 封装**：`utils/api.js`——`createTask`、`startProcessing`（fire-and-forget）、`watchTask`（db.watch）、`listMyTasks`、`fileIdToUrl`
- **音频**：`wx.getBackgroundAudioManager()`，src 必须是 https URL（用 `fileIdToUrl` 从 fileID 转换）

## 模型 API 参考

当前推荐选型：
- 视觉 OCR：`qwen3-vl-plus`（DASHSCOPE_API_KEY）
- 主笔文本：`deepseek-v4-flash`（DEEPSEEK_API_KEY）
- 批判推理：`deepseek-v4-pro`（DEEPSEEK_API_KEY）
- TTS：`tencent-podcast`（TENCENT_APP_ID + TENCENT_SECRET_ID + TENCENT_SECRET_KEY）

## 环境变量

云函数环境变量通过 `mcp__cloudbase__manageFunctions action=updateFunctionConfig` 推送。本地 Benchmark 用 `scripts/.env`（参考 `scripts/.env.example`）。两边必须同步，`VISION_PROVIDER` / `TEXT_PROVIDER` / `REASONING_TEXT_PROVIDER` / `TTS_PROVIDER` 是切换 provider 的总开关。

## 关键注意事项

- `wx.cloud.callFunction` 同步上限 15s——processTask 用 fire-and-forget，结果通过 `db.watch` 推给前端
- wxml 对象字面量语法：`{{ {key: val} }}`（外两花括号是 wxml，里面是 JS 对象）
- npm 包只能装在 `miniprogram/` 子目录，装完必须在微信开发者工具里"构建 npm"
- TDesign 组件路径：`tdesign-miniprogram/[name]/[name]`（顶层，不是嵌套子目录）
- 云存储 fileID 在前端播放前必须先 `wx.cloud.getTempFileURL` 换成 https URL
- 体验版云函数 timeout 上限 300s，内存上限 256MB（OOM 风险：TTS 大 Buffer 拼接）
- Skill frontmatter 字段（`preferred_model`/`max_tokens`/`temperature`）一旦改名，`loader.js` 不会报错，会静默 fallback 到默认 provider——改 key 时务必同步改 `loader.js`
- `cronCleanup` 是 CloudBase 定时触发器（每 5 分钟），不是代码里的 `setInterval`。改 cron 表达式要在 `cloudfunctions/cronCleanup/config.json` 或 MCP `manageFunctions` 里改，不在函数代码里
