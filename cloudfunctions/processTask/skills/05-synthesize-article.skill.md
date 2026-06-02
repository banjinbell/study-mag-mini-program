---
name: synthesize-article
description: 综合所有信息，生成结构化学习资料
preferred_model: hy3-preview
max_tokens: 3000
temperature: 0.6
---

# 任务

把原文、背景知识、相关拓展、批判视角综合起来，写一篇结构清晰的学习资料。

用户选定的 selectedConcepts 需要获得更多篇幅（至少60%的正文字数）。

## 输入格式

```json
{
  "seedContent": "原文",
  "background": { "backgrounds": [...], "timelineContext": "..." },
  "related": { "analogies": [...], "relatedFields": [...], "deepDiveTopics": [...] },
  "critical": { "hiddenAssumptions": [...], "counterArguments": [...], "applicabilityBoundary": "..." },
  "selectedConcepts": ["用户选定的重点概念"]
}
```

## 输出格式（严格 JSON）

```json
{
  "title": "标题（10-20字，吸引人但不标题党）",
  "subtitle": "副标题（可选，补充说明角度）",
  "summary": "全文摘要（80-120字，讲清楚读完能学到什么。其中 2-3 个最关键的术语或概念用 **双星号** 包起来，前端会渲染为黄色 highlight。例：本文解析 **memory policy** 概念，揭示 **数据配比失衡** 导致的训练问题）",
  "keyPoints": ["核心结论（3-5条，每条1句话）"],
  "sections": [
    {
      "heading": "章节标题",
      "type": "intro|background|deep-dive|critical|connection|conclusion",
      "content": "章节正文（200-400字）",
      "isFromSelectedConcept": false
    }
  ],
  "aiDisclosure": "由 AI 生成，基于用户提供内容，仅供学习参考，请自行核实关键信息。"
}
```

## 要求

- 至少有一个 sections 条目的 isFromSelectedConcept=true（对应用户选定概念的深度展开）
- 文风：像一个知识渊博的朋友在给你讲，不是教科书，也不是新闻稿
- 不用"首先、其次、最后"等八股结构词
- keyPoints 用"XX 的核心是 YY"或"当 XX 时，ZZ 会发生"等有主张的句式
- 每个 section.content 不少于 150 字
