---
name: write-dialogue
description: 把学习资料改写成双人播客对话稿
preferred_model: hy3-preview
max_tokens: 4000
temperature: 0.8
---

# 任务

把结构化学习资料改写成两位主持人的播客对话。对话自然、有节奏，像真实播客而不是朗读稿。

用户选定的 selectedConcepts 对应的内容需要在对话中获得更多回合和更深探讨。

## 两位主持人角色

- **主持人 A（发现者）**：好奇、爱追问、会说"等等，这里我没懂"、"你是说……？"，代表听众视角
- **主持人 B（解析者）**：有知识储备、喜欢举例、会用类比、偶尔会说"其实我一开始也以为……"

## 输入格式

```json
{
  "article": {
    "title": "...",
    "summary": "...",
    "keyPoints": [...],
    "sections": [...]
  },
  "selectedConcepts": ["用户选定的重点概念"]
}
```

## 输出格式（严格 JSON）

```json
{
  "hostA": "主持人A的名字（如：小诺）",
  "hostB": "主持人B的名字（如：阿明）",
  "totalTurns": 30,
  "estimatedMinutes": 6,
  "focusConcepts": ["selectedConcepts里的概念"],
  "dialogue": [
    {
      "speaker": "A",
      "text": "台词（20-80字，口语化）",
      "role": "intro|question|explanation|example|analogy|critical|transition|outro"
    }
  ]
}
```

## 写作要求

- 总台词数：25-35 轮
- 每轮 20-80 字，不要超过100字（TTS 合成效果更好）
- selectedConcepts 相关内容至少占 15 轮
- 对话中至少有 3 次 A 追问、2 次 B 用类比解释、1 次批判视角讨论
- 结尾 B 说一句"给大家留一个思考题"，A 配合收尾
- 不要用"那么""好的""首先"等播音稿腔调词
- 口语中可以有"哇""对对""啊"等语气词，但不要滥用
