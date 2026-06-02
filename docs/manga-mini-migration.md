# 学伴迁移到 mini env 操作手册

> 目标：把学伴从体验版 `<old-env-id>`（无免费 Token）迁到个人版 `<your-env-id>`（含 1 亿 hy3-preview Token + 1 万张 hunyuan-image 生图），用上小程序成长计划赠送资源。

## 已自动完成的（前端 + 后端代码）

| 文件 | 改动 |
|---|---|
| `miniprogram/app.js` | `env` 字段切到 `<your-env-id>` |
| `cloudfunctions/processTask/package.json` | 加 `@cloudbase/node-sdk ^3.16.0` 依赖 |
| `cloudfunctions/processTask/providers/text/hy3-preview.js` | 改用 `@cloudbase/node-sdk` 的 `ai.createModel('hunyuan-v3')` — 自动走当前 env 的免费 Token，不再吃 `HUNYUAN_API_KEY` |
| `cloudfunctions/processTask/skills/*.skill.md` | 6 个 skill 的 `preferred_model` 全部切到 `hy3-preview` |
| `CLAUDE.md` | 主环境更新为 mini |

## 必须你手动做的（MCP 不能跨账号操作 mini env）

> mini env 来自微信小程序后台报名（Source: miniapp），跟你腾讯云 CAM 账号不是同一所有权 — Claude 的 MCP 工具只能操作 CAM 名下的 env，所以下面这几步你自己来。

### 步骤 1 · 在 mini env 建 `tasks` 集合（5 分钟）

打开微信开发者工具 → 左下角 **云开发** → 切换环境为 `<your-env-id>` → **数据库 → +新建集合 → 名称：tasks**

然后给 `tasks` 集合定义索引（在该集合的「索引管理」标签）：

| 索引名 | 字段 | 唯一 | 说明 |
|---|---|---|---|
| `taskId_unique` | `taskId: 升序` | ✓ | 关键：防 task 重复 |
| `openid_created` | `_openid: 升序, createdAt: 降序` | — | list 页按用户+时间倒序查 |

「数据权限」标签里把规则设为：

```json
{
  "read": "doc._openid == auth.openid",
  "write": false
}
```

读限自己 openid，写禁止（只能云函数操作）。

### 步骤 2 · 部署 4 个云函数到 mini env（10 分钟）

微信开发者工具 → 云开发 → **环境切到 <your-env-id>**。

然后在项目左侧 `cloudfunctions/` 目录下，对**每个**云函数右键 → **「上传并部署：云端安装依赖（不上传 node_modules）」**：

- [ ] `createTask`
- [ ] `processTask` — 这次首次部署会装 `@cloudbase/node-sdk` 新依赖，大概 30 秒
- [ ] `extractConcepts`
- [ ] `cronCleanup`

⚠ 部署时如果报「环境不一致」错，说明 cloudfunctions 子目录下还有遗留的 `node_modules` 是旧 env 装的，把每个函数下的 `node_modules` 删掉重新部署即可。

### 步骤 3 · 给 `processTask` 配环境变量（5 分钟）

云开发后台 → 云函数 → processTask → 配置 → 环境变量。把下表 22 项配上（之前 default env 那 38 项里**有用的**这些）：

| 变量名 | 值 | 说明 |
|---|---|---|
| `TEXT_PROVIDER` | **`hy3-preview`** | ← 关键改动，走 CloudBase 免费 Token |
| `REASONING_TEXT_PROVIDER` | **`hy3-preview`** | ← 同上 |
| `FAST_TEXT_MODEL` | `hy3-preview` | 一致即可 |
| `VISION_PROVIDER` | `qwen3-vl-plus` | 视觉 OCR — 仍走通义 |
| `VISION_MODEL_FAST` | `qwen3-vl-plus` | |
| `DASHSCOPE_API_KEY` | *（从旧 env 复制）* | 视觉 OCR 用 |
| `TTS_PROVIDER` | `doubao-podcast` | 字节豆包播客 TTS |
| `VOLC_PODCAST_RESOURCE_ID` | `volc.service_type.10050` | |
| `VOLC_PODCAST_SPEAKER_A` | `zh_female_mizaitongxue_v2_saturn_bigtts` | |
| `VOLC_PODCAST_SPEAKER_B` | `zh_male_dayixiansheng_v2_saturn_bigtts` | |
| `VOLC_TTS_APP_ID` | *（从旧 env 复制）* | |
| `VOLC_TTS_APP_KEY` | *（从旧 env 复制）* | |
| `VOLC_TTS_ACCESS_KEY` | *（从旧 env 复制）* | |

> 旧 env 里那些 `DEEPSEEK_API_KEY`、`HUNYUAN_API_KEY`、`MINIMAX_API_KEY`、`MOONSHOT_API_KEY`、`ZHIPU_API_KEY`、`ARK_*`、`ELEVENLABS_API_KEY`、`SILICONFLOW_API_KEY`、`TENCENT_*` 这些 **mini env 不用配** — 学伴现在只走 hy3-preview（免费）+ 通义视觉 + 豆包 TTS 三家。要保留作 fallback 也可以全复制。

获取旧 env 这些 key 的值：在 default env 后台 → 云函数 → processTask → 配置 → 环境变量，逐项复制粘贴。

### 步骤 4 · 给 mini env 加白名单（5 分钟）

[mp.weixin.qq.com](https://mp.weixin.qq.com) → 学伴小程序后台 → 开发管理 → 开发设置 → 服务器域名 → 修改：

**downloadFile 合法域名**（追加 2 条）：
- `https://cdn.jsdelivr.net` — Manga Jump 字体
- `https://6d69-<your-env-id>-1437230918.tcb.qcloud.la` — mini env 的存储 CDN，音频播放/图片预览要用

**uploadFile 合法域名**（追加 1 条）：
- `https://6d69-<your-env-id>-1437230918.tcb.qcloud.la` — submit 图片模式要上传

### 步骤 5 · 在 mini env 配置 cronCleanup 触发器（5 分钟）

云开发后台 → 云函数 → cronCleanup → 触发器 → 新建：

- 触发周期：**`0 */5 * * * * *`**（每 5 分钟）
- 名称：cleanup-cron

旧 env 里这个触发器需要重新配置，不会跨 env 自动同步。

### 步骤 6 · 验证（5 分钟）

1. 微信开发者工具点 **「预览」** → 扫码进真机
2. 投一篇短文（粘 200 字）→ 看是否成功进入 processing 状态
3. 进 mini env 后台 → 云函数 → processTask → 实时日志 → 应该看到混元调用，不再看到 DeepSeek
4. 等 2-3 分钟看是否生成完成
5. mini env 后台 → AI 模型 → 生文模型 → **应该看到 hy3-preview 用了一点 Token**（这是确认免费包真在用的关键证据）

## 旧 env 怎么处理

`<old-env-id>` 现在事实上废弃了。三个选项：

- **A · 留着备用** — 不动它。6 个月后体验版会自动到期。免费时不收费。
- **B · 现在删** — 控制台 → 环境管理 → 销毁。注意会删掉旧 tasks 集合的所有数据（如果有还需要的数据先导出）。
- **C · 保留作开发测试** — 你写新功能时在旧 env 跑测试，避免污染 mini 的 Token 配额。但前端代码不切回去（只在云函数级别测）。

推荐 **A**。

## 翻车点排查

| 现象 | 原因 | 解决 |
|---|---|---|
| 前端 `wx.cloud.callFunction` 报 `Cloud function not found` | mini env 没部署 createTask | 重做步骤 2 |
| processTask 报 `EXCEED_TOKEN_QUOTA_LIMIT` | 不在 mini env / Token 用完 | 检查云函数所在 env；查后台 Token 用量 |
| processTask 报 `module not found: @cloudbase/node-sdk` | 部署时没装依赖 | 删 cloudfunctions/processTask/node_modules → 重新「上传并部署：云端安装依赖」 |
| 音频播放 403 | 旧 env 存储桶白名单还在用 | 加 mini env 的 `6d69-...tcb.qcloud.la` 到 downloadFile 合法域名 |
| 视觉 OCR 报 401 | `DASHSCOPE_API_KEY` 没复制 | 检查 mini env processTask 的环境变量 |

## 预计省钱效果

| 模型 | 之前（default + DeepSeek 自费） | 之后（mini + hy3-preview 免费） |
|---|---|---|
| 一次完整 task tokens | ~8,000 input + 4,000 output | 同 — 但全免费 |
| 单次成本 | ~¥0.012（DeepSeek v4-flash） | ¥0 |
| 1 亿 Token 能跑多少次 | — | **约 8,000 次完整任务** |
| 节省 | — | 约 **¥100 / 1 亿 token 耗尽前** |

生图资源（1 万张 hunyuan-image）目前未接入，可作为下一步优化（player 页学习材料封面图）。
