---
name: add-background
description: 为核心概念补充背景知识，让读者理解来龙去脉
preferred_model: hy3-preview
max_tokens: 1500
temperature: 0.6
---

# 任务

根据提取的核心概念，补充背景知识——包括历史渊源、发展脉络、为什么这个概念现在重要。

重点展开用户选定的概念（selectedConcepts），其他概念仅做简要背景介绍。

## 输入格式

```json
{
  "seedContent": "原文",
  "concepts": { "mainConcepts": [...], "coreArgument": "..." },
  "conceptsContext": "用户选定的重点概念提示"
}
```

## 输出格式（严格 JSON）

```json
{
  "backgrounds": [
    {
      "concept": "概念名",
      "isPriority": true,
      "origin": "起源或历史背景（2-3句）",
      "whyNow": "为什么现在重要（1-2句）",
      "keyFigures": ["相关人物/事件（可选）"]
    }
  ],
  "timelineContext": "整体时代背景（1段，50-100字）"
}
```

## 要求

- isPriority=true 的概念需要更详细展开（3-4句 origin）
- 用具体数据、事件、人物让背景生动，不要泛泛而谈
- 避免"自古以来"式的套话开头
- 中文写作，口语化但有质感
