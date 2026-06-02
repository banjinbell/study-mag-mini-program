# 学伴项目 · 模型 API 参考手册

> 截止：2026-05-28
> 所有端点、model 字段、鉴权方式都是当前实测验证过的（除非另有标注）。
> 旧的训练数据可能滞后 1-2 年，**改 API 调用前以本文为准**。

---

## 目录

- [文本模型（Text）](#文本模型)
  - [DeepSeek](#1-deepseek)
  - [阿里通义 Qwen / DashScope](#2-阿里通义-qwen--dashscope百炼)
  - [腾讯 TokenHub（Hy3、DeepSeek 镜像、Youtu-VITA）](#3-腾讯-tokenhub)
  - [腾讯混元（旧版，已不推荐）](#4-腾讯混元旧版已不推荐)
  - [火山豆包 Ark](#5-火山豆包-ark文本视觉)
  - [智谱 GLM / BigModel](#6-智谱-glm--bigmodel)
  - [Moonshot Kimi](#7-moonshot-kimi)
  - [MiniMax](#8-minimax)
- [视觉模型（Vision）](#视觉模型)
- [TTS 模型](#tts-模型)
  - [腾讯播客 TTS](#1-腾讯大模型播客-tts)
  - [豆包播客大模型](#2-火山豆包播客大模型)
  - [豆包 Seed-TTS 2.0](#3-火山豆包-seed-tts-20)
  - [MiniMax Speech](#4-minimax-speech-26)
  - [SiliconFlow（开源托管）](#5-siliconflow-托管开源-tts)
  - [ElevenLabs v3 Dialogue](#6-elevenlabs-v3-text-to-dialogue海外-sota)
- [开源 TTS 模型对照](#开源中文-tts-模型对照)
- [Phase 1 实测排名](#phase-1-实测排名)

---

# 文本模型

## 1. DeepSeek

| 项 | 值 |
|---|---|
| **端点** | `https://api.deepseek.com/chat/completions`（OpenAI 兼容） |
| **鉴权** | `Authorization: Bearer ${DEEPSEEK_API_KEY}` |
| **env 变量** | `DEEPSEEK_API_KEY` |
| **拿 Key** | <https://platform.deepseek.com/api_keys> |
| **官方文档** | <https://api-docs.deepseek.com/> |
| **JSON mode** | ✅ `response_format: { type: 'json_object' }`（prompt 中须含 "json" 字样） |
| **Prompt Caching** | ✅ 自动启用，省钱效果好 |

### 可用模型

| model 字段 | 类型 | 上下文 | 价格 in/out (USD/M) | 说明 |
|---|---|---|---|---|
| `deepseek-v4-flash` | 文本+推理 (hybrid) | 1M | $0.14 / $0.28 | **主力性价比**，2026-04 发布 |
| `deepseek-v4-pro` | 文本+推理 (hybrid) | 1M | $0.435 / $0.87（75% 促销）| 旗舰，agentic coding SOTA |
| `deepseek-chat` | (旧) | - | - | ⚠️ **2026-07-24 废弃**，迁移到 v4-flash |
| `deepseek-reasoner` | (旧) | - | - | ⚠️ **2026-07-24 废弃**，迁移到 v4-pro |

### 注意
- 思考模式控制：`enable_thinking: true` + `thinking_budget: N`
- 也支持 Anthropic Messages 协议（cache 控制更细，本项目暂不用）

---

## 2. 阿里通义 Qwen / DashScope（百炼）

| 项 | 值 |
|---|---|
| **原生端点** | `https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation`（文本）<br>`https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`（视觉/多模态）|
| **OpenAI 兼容端点** | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` |
| **鉴权** | `Authorization: Bearer ${DASHSCOPE_API_KEY}` |
| **env 变量** | `DASHSCOPE_API_KEY` |
| **拿 Key** | <https://bailian.console.aliyun.com/?apiKey=1> |
| **官方文档** | <https://help.aliyun.com/zh/model-studio/qwen-api-reference/> |

### 可用模型

| model 字段 | 类型 | 上下文 | 说明 |
|---|---|---|---|
| `qwen-plus-latest` | 文本 | 128K | ✅ 实测最快 1.7s/概念提取，性价比首选 |
| `qwen3.7-max` | 文本+thinking | 1M | 旗舰，默认开思考所以慢（实测 16s） |
| `qwen3.6-plus` | 文本+视觉混合 | - | 文档提到但 model 字段在 native 端点 400 错误 |
| `qwen3-vl-plus` | 视觉 | - | **当前推荐视觉模型**，高精度 OCR + grounding |
| `qwen-vl-max` | 视觉 | - | (旧) Qwen2.5-VL 底座，新项目用 qwen3-vl-plus |
| `qwq-plus-latest` | 思考模型（only） | - | 纯推理 |

### 注意
- DashScope 原生 API 用 `parameters.result_format: 'message'` + `parameters.enable_thinking` 控制思考
- OpenAI 兼容端点参数风格不同（直接顶层 `temperature` / `max_tokens`）
- **CosyVoice TTS** 也通过 DashScope，但**只支持 WebSocket**（`wss://dashscope.aliyuncs.com/api-ws/v1/inference`）

---

## 3. 腾讯 TokenHub

> **2026-05-27 10:00 正式商业化**，托管 Hy3 / DeepSeek-V4 / YT-VITA 等多家模型。

| 项 | 值 |
|---|---|
| **端点** | `https://tokenhub.tencentmaas.com/v1/chat/completions` |
| **鉴权** | `Authorization: Bearer ${HUNYUAN_API_KEY}`（**TokenHub 的 sk- key**，不是混元旧版的） |
| **env 变量** | `HUNYUAN_API_KEY`（我们项目复用这个名） |
| **拿 Key** | <https://console.cloud.tencent.com/tokenhub> |
| **官方文档** | <https://cloud.tencent.com/document/product/1823/130058>（快速入门） |
| **模型列表文档** | <https://cloud.tencent.com/document/product/1823/130051> |
| **新人免费包** | <https://cloud.tencent.com/document/product/1823/130053>（送 100 万 tokens）|

### 开通流程（**必须按顺序做**）

1. 登录 TokenHub 控制台 → 开通服务
2. 进入 **模型广场** → 右上角 **「新用户福利免费体验」** → **勾选你要的模型** → **「立即领取」**
3. 在 **API Key 管理**生成 key
4. **如果调用返回 `not_authorized`：第 2 步漏了，必须勾选具体模型才能调**

### 可用模型（验证过的）

| model 字段 | 类型 | 说明 |
|---|---|---|
| `hy3-preview` | 文本+thinking | ✅ 295B MoE / 21B active / 256K，2026-04 开源，**国产首选**。`reasoning_effort: no_think / low / high` 控制思考强度 |
| `youtu-vita` | 多模态视觉 | 腾讯优图实验室，OpenAI 兼容多模态消息格式 |
| `deepseek-v4-flash` | 文本+thinking | TokenHub 镜像，跟 DeepSeek 官网同价 |
| `deepseek-v4-pro` | 文本+thinking | TokenHub 镜像，跟 DeepSeek 官网同价 |
| ❌ `deepseek-v3` | - | 不存在 |

### 价格（hy3-preview，2026-05）
输入 ¥1.2/M，cached 输入 ¥0.4/M，输出 ¥4/M

### 注意
- TokenHub 的 key 是 `sk-` 开头，跟混元旧版长得像但**不通用**
- 也有 `ak-` 开头的 key 类型，是 API Key 但需绑定 Token Plan 才能用
- **不要用 `api.lkeap.cloud.tencent.com`** — 那是知识引擎 LKE，不是 TokenHub

---

## 4. 腾讯混元（旧版，已不推荐）

> 用户实测下来 `sk-NKoDE...` 类型的混元旧 key 在 `api.hunyuan.cloud.tencent.com` 上 401，建议直接走 TokenHub。

| 项 | 值 |
|---|---|
| 端点（旧）| `https://api.hunyuan.cloud.tencent.com/v1/chat/completions` |
| 拿 Key（旧）| <https://console.cloud.tencent.com/hunyuan/api-key> |
| 旧模型 | `hunyuan-turbos-latest` / `hunyuan-t1-latest` / `hunyuan-turbos-vision` |
| ⚠️ 状态 | **已被 TokenHub 取代**，新项目直接用 hy3-preview |
| ⚠️ JSON mode | 旧版本 response_format 不可靠，需 prompt 约束 + try/catch |

---

## 5. 火山豆包 Ark（文本/视觉）

| 项 | 值 |
|---|---|
| **端点** | `https://ark.cn-beijing.volces.com/api/v3/chat/completions`（OpenAI 兼容） |
| **鉴权** | `Authorization: Bearer ${ARK_API_KEY}` |
| **env 变量** | `ARK_API_KEY` |
| **拿 Key** | <https://console.volcengine.com/ark> → API Key 管理 |
| **官方文档** | <https://www.volcengine.com/docs/82379>（方舟主文档） |
| **模型列表** | <https://www.volcengine.com/docs/82379/1330310> |

### 可用模型

| model 字段 | 类型 | 上下文 | 说明 |
|---|---|---|---|
| `doubao-seed-1.6-251015` | 文本+thinking | 256K | 主力文本，输出 64K |
| `doubao-seed-1-6-vision-251015` | 视觉+视频+GUI | - | 视觉理解、grounding |

### 注意
- 2026 新策略：**可直接填模型名**，不必先在控制台创建 Endpoint ID（`ep-xxx`）
- 思考模式：`thinking: { type: 'enabled' }`
- 实测速度偏慢（15s+ for 概念提取），不建议作主力

---

## 6. 智谱 GLM / BigModel

| 项 | 值 |
|---|---|
| **端点** | `https://open.bigmodel.cn/api/paas/v4/chat/completions` |
| **鉴权** | `Authorization: Bearer ${ZHIPU_API_KEY}`（**已废弃 JWT**，直接 Bearer）|
| **env 变量** | `ZHIPU_API_KEY` |
| **拿 Key** | <https://open.bigmodel.cn/usercenter/apikeys> |
| **官方文档** | <https://open.bigmodel.cn/dev/api> |

### 可用模型

| model 字段 | 类型 | 上下文 | 价格 ¥/M in/out |
|---|---|---|---|
| `glm-4.6` | 文本+thinking | 200K | ~¥2 / ¥8 | 2025-12 发布，355B/32B MoE |
| `glm-4.6v` | 视觉+thinking | 128K | TBD | 106B/12B MoE |
| `glm-4.5` | 文本 | 128K | - | 上一代 |
| `glm-4.5-flash` | 文本 | 128K | **免费** | 限免轻量档 |

### 注意
- ✅ JSON mode 支持：`response_format: { type: 'json_object' }`
- ✅ 思考控制：`thinking: { type: 'enabled' / 'disabled' }`
- 实测中等速度（5-7s），中文写作风格较稳

---

## 7. Moonshot Kimi

| 项 | 值 |
|---|---|
| **端点** | `https://api.moonshot.cn/v1/chat/completions`（国内）<br>`https://api.moonshot.ai/v1/...`（海外） |
| **鉴权** | `Authorization: Bearer ${MOONSHOT_API_KEY}` |
| **env 变量** | `MOONSHOT_API_KEY` |
| **拿 Key** | <https://platform.moonshot.cn/console/api-keys> |
| **官方文档** | <https://platform.moonshot.ai/docs/api/overview> |

### 可用模型

| model 字段 | 类型 | 上下文 | 价格 USD/M in/out |
|---|---|---|---|
| `kimi-k2.6` | 文本+thinking | 256K（精确 262K）| ~$0.95 / $4.00 | 长文本编码强 |
| `kimi-k2.5` | 文本+thinking+vision | - | ~$0.60 / $2.50 | 含视觉 |
| `kimi-k2-0905-preview` | - | - | $0.50 / $2.00 | 旧版 |
| `moonshot-v1-128k` | 文本 | 128K | - | 老旗舰，仍可用 |

### 注意
- 完全 OpenAI 兼容
- ⚠️ 账户欠费会返回 `429 exceeded_current_quota_error`
- ⚠️ **K2.6 是思考模型，有 3 个特殊要求**：
  1. `temperature` **只接受 1**，传其他值会 400
  2. **不允许空 system message**，systemPrompt 为空时要跳过整个 system 项
  3. **max_tokens 至少 4000**——思考链会先吃掉一大部分 token，给少了 content 是空（finish_reason 会变成 `length`）
- 返回里有 `reasoning_content` 字段是思考链，正式 content 在 `content` 字段

---

## 8. MiniMax

| 项 | 值 |
|---|---|
| **端点（文本）** | `https://api.minimaxi.chat/v1/text/chatcompletion_v2`（国内）<br>`https://api.minimax.io/v1/...`（海外）|
| **端点（TTS）** | `https://api.minimaxi.chat/v1/t2a_v2?GroupId={GROUP_ID}` |
| **鉴权** | 文本：`Authorization: Bearer ${API_KEY}`<br>TTS：**API Key + GroupId**（URL query）|
| **env 变量** | `MINIMAX_API_KEY` + **`MINIMAX_GROUP_ID`**（两个都必需）|
| **拿 Key** | <https://platform.minimaxi.com/user-center/basic-information/interface-key> |
| **官方文档** | <https://platform.minimax.io/docs> |
| **TTS 文档** | <https://platform.minimax.io/docs/api-reference/speech-t2a-http> |

### 可用模型

| model 字段 | 类型 | 上下文 | 价格 USD/M |
|---|---|---|---|
| `MiniMax-M2` | 文本 agentic | 200K | $0.30 / $1.20 in/out |
| `MiniMax-M1` | 文本 | 1M | $0.40 / $2.20 |
| `speech-2.6-hd` | TTS HD | - | $50/M chars (~¥0.36/万字) |
| `speech-2.6-turbo` | TTS 实时 | - | <250ms 延迟 |
| `speech-2.8-hd` / `speech-2.8-turbo` | TTS | - | 更新版本 |

### 注意
- ⚠️ TTS API **没有原生双人对话模式**（不像 ElevenLabs v3）→ 需按段切音色 + Buffer 拼接
- 音色列表 API：`GET /v1/get_voice`
- 音色克隆 API：`POST /v1/voice_clone`（2.6 用 Fluent LoRA）
- ⚠️ 错误可能 status=200 但 `base_resp.status_code != 0`，需要双重检查

---

# 视觉模型

| Provider | model 字段 | 端点 | env | 推荐 |
|---|---|---|---|---|
| **Qwen3-VL-Plus** | `qwen3-vl-plus` | DashScope 多模态 | `DASHSCOPE_API_KEY` | ⭐ **首选**，国内最稳的中文 OCR + 图文理解 |
| **Doubao Vision** | `doubao-seed-1-6-vision-251015` | Ark | `ARK_API_KEY` | 含视频 + GUI Agent + grounding |
| **Hunyuan Vision** | `hunyuan-turbos-vision` | `api.hunyuan.cloud.tencent.com` | `HUNYUAN_API_KEY`（旧版） | 旧版混元 |
| **Youtu-VITA** | `youtu-vita` | TokenHub | `HUNYUAN_API_KEY`（TokenHub） | 腾讯优图新版多模态 |
| **GLM-4.6V** | `glm-4.6v` | BigModel | `ZHIPU_API_KEY` | 视觉 + reasoning |

---

# TTS 模型

## 1. 腾讯大模型播客 TTS

> **原生双人对话**，CloudBase 同机房延迟最低。

| 项 | 值 |
|---|---|
| **端点** | `wss://tts.cloud.tencent.com/stream_ws_podcast` |
| **鉴权** | HmacSHA1 签名（基于腾讯云 SecretId/SecretKey） |
| **env 变量** | `TENCENT_APP_ID`、`TENCENT_SECRET_ID`、`TENCENT_SECRET_KEY` |
| **拿 Key** | <https://console.cloud.tencent.com/cam/capi> |
| **服务开通** | <https://cloud.tencent.com/document/product/1073/56640> |
| **官方文档** | <https://cloud.tencent.com/document/product/1073/124700> |
| **音色列表** | <https://cloud.tencent.com/document/product/1073/126059> |

### 协议要点

- **输出格式**：仅支持 `Codec=pcm`，24kHz；客户端需自行转 mp3
- **必传参数**：Action / AppId / SecretId / Timestamp / Expired / SessionId / SampleRate / Signature
- **签名规则**：
  - 按 key 字典序排序拼 querystring（值用**原始字符串**，**Text 字段不要 URL encode**）
  - 签名原文：`GET` + `tts.cloud.tencent.com` + `/stream_ws_podcast` + `?` + querystring
  - `HmacSHA1(secretKey, signSource).digest('base64')` → URL encode → 加到最终 URL
  - 最终 URL 里的 Text 字段才 URL encode
- **协议流程**：
  1. WSS connect → 服务端返回 `code:0, ready:0`
  2. `ready=1` 后客户端发 `ACTION_SYNTHESIS`（带 `data: JSON.stringify({ObjectType:'TYPE_TEXT', Text:...})`）
  3. 再发 `ACTION_COMPLETE`（`data: ""`）
  4. 流式接收二进制 pcm 帧
  5. 收到 `final:1` 时关闭

---

## 2. 火山豆包播客大模型

> 原生双人对话（对标 NotebookLM）。

| 项 | 值 |
|---|---|
| **端点** | `https://open.bytedanceapi.com/api/v3/tts/podcast`（⚠️ 主云域名，**不是** `openspeech`） |
| **鉴权** | 火山引擎 V4 签名（**HMAC-SHA256 + AK/SK**），**不是** 4-header 那套 |
| **env 变量** | 需要主云 `VOLC_ACCESS_KEY_ID` + `VOLC_SECRET_ACCESS_KEY`（不是语音技术域的）|
| **拿 Key** | <https://console.volcengine.com/iam/keymanage> |
| **服务开通** | <https://console.volcengine.com/speech/app> → 开通"语音播客大模型" |
| **官方文档** | <https://www.volcengine.com/docs/6561/1668014>（SPA，WebFetch 抓不到，需浏览器看）|
| **产品页** | <https://www.volcengine.com/product/podcast> |

### 注意
- 与 `openspeech.bytedance.com` 的 Seed-TTS 2.0 **是不同 API 平台**，鉴权方式不同
- 学伴项目暂未跑通，**当前用腾讯播客替代**

---

## 3. 火山豆包 Seed-TTS 2.0

> 单人 TTS，2025-10 发布。

| 项 | 值 |
|---|---|
| **端点** | `wss://openspeech.bytedance.com/api/v3/tts/bidirection`（双向流式） |
| **HTTP V1（旧）** | `https://openspeech.bytedance.com/api/v1/tts` |
| **鉴权（V3）** | 4 header：`X-Api-App-Key` / `X-Api-Access-Key` / `X-Api-Resource-Id` / `X-Api-Request-Id` |
| **Resource-Id** | `volc.megatts.default` 或 `volc.service_type.10029`（需账号开通） |
| **env 变量** | `VOLC_TTS_APP_KEY` + `VOLC_TTS_ACCESS_KEY` |
| **拿 Key** | <https://console.volcengine.com/speech/app> |
| **鉴权文档** | <https://www.volcengine.com/docs/6561/1105162> |

### 注意
- 旧的 `Bearer;{APPID};{TOKEN}` 鉴权 **已废弃**
- 200+ 预置音色 + 情感/语速指令控制
- 不支持原生双人，要双人播客用上面的"播客大模型"

---

## 4. MiniMax Speech 2.6

见 [MiniMax 章节](#8-minimax)。

### 注意
- 同步上限 10K 字符/请求；异步上限 1M 字符
- ⚠️ 无原生 dialogue API，需自己拼接

---

## 5. SiliconFlow 托管开源 TTS

| 项 | 值 |
|---|---|
| **端点** | `https://api.siliconflow.cn/v1/audio/speech`（OpenAI 兼容） |
| **鉴权** | `Authorization: Bearer ${SILICONFLOW_API_KEY}` |
| **env 变量** | `SILICONFLOW_API_KEY` |
| **拿 Key** | <https://cloud.siliconflow.cn/account/ak> |
| **官方文档** | <https://docs.siliconflow.cn/cn/userguide/capabilities/text-to-speech> |

### 可用模型

| model 字段 | 模型 | 价格 |
|---|---|---|
| `FunAudioLLM/CosyVoice2-0.5B` | CosyVoice 2 | $7.15 / M UTF-8 bytes |
| `IndexTeam/IndexTTS-2` | IndexTTS-2 | $7.15 / M bytes |
| `fishaudio/fish-speech-1.5` | Fish Speech v1.5 | $15 / M bytes |

### 注意
- 性价比最高的开源 TTS 托管方案
- 无原生双人，需按段切音色 + 拼接

---

## 6. ElevenLabs v3 Text-to-Dialogue（海外 SOTA）

| 项 | 值 |
|---|---|
| **端点** | `https://api.elevenlabs.io/v1/text-to-dialogue` |
| **鉴权** | `xi-api-key: ${KEY}` header |
| **env 变量** | `ELEVENLABS_API_KEY` |
| **拿 Key** | <https://elevenlabs.io/app/settings/api-keys> |
| **官方文档** | <https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert> |

### 注意
- **真正原生双人对话**：单请求支持 ≤10 个 voice + ≤2000 字符
- 70+ 语言含中文
- model_id 必须是 `eleven_v3`
- 海外端点，国内云函数访问可能不稳

---

# 开源中文 TTS 模型对照

| 模型 | 出品方 | 最新版本 | 中文质量 | 对话能力 | License | 推荐托管 |
|---|---|---|---|---|---|---|
| **MOSS-TTSD** | OpenMOSS（复旦+清华+少初智能） | v0.5 (2025-07) | 顶级 | ⭐ **原生双人 + 零样本克隆**，专为播客设计 | Apache 2.0 | 自托管 / Replicate |
| **CosyVoice 3** | 阿里达摩院 | 3.0 (2025-12) | SOTA (CER 0.81%) | 多角色需拼接 | Apache 2.0 | 百炼 WSS / SiliconFlow |
| **Higgs Audio v2** | Boson AI | v2 / 3B | 良好 | ⭐ 原生多人 + 自动 BGM | 开源 | Replicate (`lucataco/higgs-audio-v2`) |
| **IndexTTS-2** | B 站 | 2.0 (2025-09) | 优秀（3 万小时中文）| 拼接 | 开源 | SiliconFlow |
| **Fish Speech / OpenAudio S2** | Fish Audio | S2 (2025) | 顶级 | S1 多 voice 拼接 | S1-mini 开源 / S2 商业 | fish.audio / SiliconFlow (v1.5) |
| **Step-Audio 2 mini** | 阶跃星辰 | 2-mini (2025) | 优（方言/唱歌）| 端到端语音对话 | 开源 | 自托管 |
| **F5-TTS v1** | 上海 AI Lab / SWivid | v1 (2025-03) | 良好 | repo 有 podcast 示例 | 开源 | fal.ai |
| **Spark-TTS 0.5B** | HKUST/SparkAudio | 2025-03 | 良好 | 零样本克隆 | **CC BY-NC-SA（不可商用）** | 仅研究 |
| **ChatTTS** | 2Noise | 0.2.5 (2026-04) | 中等（已被超）| 日常对话风 | AGPL | 自托管 |

**学伴项目推荐**：开源首选 MOSS-TTSD（自托管 4090 或 HF Inference Endpoint），托管首选 SiliconFlow + CosyVoice2，质量天花板 ElevenLabs v3。

---

# Phase 1 实测排名

## 文本（提取概念任务，统一 500 max_tokens）

| 排名 | Provider | model | 平均时延 | 概念数 | 备注 |
|---|---|---|---|---|---|
| 🥇 | qwen-plus | `qwen-plus-latest` | **1.75s** | 9-10 | 最快、概念质量好 |
| 🥈 | deepseek-v4-flash | `deepseek-v4-flash` | 2.17s | 7-10 | **主笔默认** |
| 🥉 | hy3-preview | `hy3-preview` | 2.48s | 9-10 | 国产首选 |
| 4 | deepseek-v4-pro | `deepseek-v4-pro` | 3.85s | 10 | **推理默认** |
| 5 | glm-4.6 | `glm-4.6` | 7.5s | 7-8 | 备选 |
| 6 | doubao-seed-1.6 | `doubao-seed-1-6-251015` | 15.2s | 8 | 慢 |
| 7 | qwen3.7-max | `qwen3.7-max` | 16.4s | 8-9 | 思考开太慢 |
| 8 | kimi-k2.6 | `kimi-k2.6` | 19.6s | 7-10 | 思考模型，质量好但慢；需 max_tokens≥4000 |

## 视觉
待测（用户提供测试图后跑）

## TTS
- 腾讯播客：代码完整，签名/协议跑通；等开通腾讯云语音合成服务
- 豆包播客：端点已确认 `open.bytedanceapi.com`，需用 V4 签名 + 主云 AK/SK，未跑通
- MiniMax / SiliconFlow / ElevenLabs：未跑（API Key 缺失或无效）

---

# 项目当前推荐选型

| 用途 | 选型 | 理由 |
|---|---|---|
| 视觉 OCR | `qwen3-vl-plus` | 国内最稳，中文 OCR 强 |
| 概念提取（速度敏感） | `qwen-plus-latest` | 1.75s 最快 |
| 主笔写资料 | `deepseek-v4-flash` | 性价比天花板，1M ctx |
| 批判推理 | `deepseek-v4-pro` | 自带思考链 |
| 国产首选备份 | `hy3-preview` | TokenHub，2.5s |
| TTS 双人播客 | `tencent-podcast` | 原生双人，CloudBase 同机房 |

---

# 通用注意事项

1. **训练数据滞后 1-2 年**——模型名、端点、鉴权都在快速变化，每 2-3 个月需要核对一次
2. **不同平台可能有同名模型**：例如 deepseek-v4-flash 既在 DeepSeek 官网，也在 TokenHub 镜像
3. **TokenHub 的"普通 API Key"和"Token Plan 专属 Key"是两套系统**——需要在模型广场勾选具体模型才能调
4. **混元 OpenAI 兼容端点 JSON mode 不可靠**——用 prompt 约束 + try/catch + loose JSON parser
5. **WSS 端点不能用 HEAD 探活**，用 GET 看 405/400 区分路径是否存在
6. **国内云函数调海外 API（ElevenLabs / OpenAI）不稳定**，需要 retry / 代理
