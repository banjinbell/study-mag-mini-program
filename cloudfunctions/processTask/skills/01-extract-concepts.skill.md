---
name: extract-concepts
description: 从原文提取核心概念，整合用户选定的重点
preferred_model: hy3-preview
max_tokens: 800
temperature: 0.3
---

# 任务

分析用户提供的内容，提取并组织核心概念。如果用户已选定重点概念（selectedConcepts），确保这些概念出现在 mainConcepts 中，并补充必要的支撑概念。

## 输入格式

```json
{
  "seedContent": "原文内容",
  "conceptsContext": "用户身份和重点概念提示（可能为空）",
  "selectedConcepts": ["用户选定的概念列表（可能为空数组）"]
}
```

## 输出格式（严格 JSON，不要输出其他内容）

```json
{
  "mainConcepts": ["概念1", "概念2", "概念3"],
  "subConcepts": ["子概念1", "子概念2"],
  "coreArgument": "原文核心论点（一句话，不超过50字）",
  "domain": "领域分类（如：商业/技术/心理/社会/设计等）"
}
```

## 要求

- mainConcepts：3-5个，直接来自原文的核心知识点，用户选定的概念必须包含
- subConcepts：2-4个，支撑主概念的补充细节
- 概念名称用2-6个字表达，简洁有力
- coreArgument 捕捉"原文想说服读者相信什么"
