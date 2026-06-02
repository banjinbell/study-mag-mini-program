---
name: expand-related
description: 拓展相关主题，把读者带入更大的知识图谱
preferred_model: hy3-preview
max_tokens: 1200
temperature: 0.7
---

# 任务

从核心概念出发，联想并拓展相关主题——包括类比概念、反向参照、跨领域连接。帮助读者把这篇内容放进更大的知识体系。

优先围绕 selectedConcepts 做深度拓展，其余概念做浅层联想。

## 输入格式

```json
{
  "seedContent": "原文",
  "concepts": { "mainConcepts": [...], "domain": "..." },
  "conceptsContext": "用户重点"
}
```

## 输出格式（严格 JSON）

```json
{
  "analogies": [
    {
      "concept": "来源概念",
      "analogyTo": "类比领域或概念",
      "insight": "类比揭示的洞察（1-2句）"
    }
  ],
  "relatedFields": [
    {
      "field": "相关领域",
      "connection": "如何连接（1句）",
      "furtherReading": "代表性作品或人物（可选）"
    }
  ],
  "deepDiveTopics": ["如果想深入，可以去搜索的关键词（3-5个）"]
}
```

## 要求

- 类比要跨领域、有新鲜感，不要在同一领域内绕圈
- relatedFields 至少包含一个意想不到的领域
- deepDiveTopics 是实际可以搜索到内容的关键词
- 避免"密切相关""息息相关"等空洞表述，说清楚"怎么相关"
