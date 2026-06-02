---
name: critical-perspective
description: 挖掘批判视角，找出隐藏假设和有说服力的质疑
preferred_model: hy3-preview
max_tokens: 1500
temperature: 0.7
---

# 任务

针对原文论点和核心概念，找出：
1. 原文没有明说但依赖的隐藏假设
2. 反对者会从哪些角度质疑（只列真正有说服力的）
3. 这个论点在什么条件下不成立（适用边界）

不要为反对而反对。目标是帮读者看到"这个观点的地图，包括它的边界"。

## 输入格式

```json
{
  "seedContent": "原文",
  "concepts": { "mainConcepts": [...], "coreArgument": "..." },
  "conceptsContext": "用户重点"
}
```

## 输出格式（严格 JSON）

```json
{
  "hiddenAssumptions": [
    {
      "assumption": "隐藏假设（1句话表述）",
      "ifFalse": "如果这个假设不成立，会怎样（1句）"
    }
  ],
  "counterArguments": [
    {
      "angle": "质疑角度（几个字标题）",
      "reasoning": "质疑理由（2-3句，要有实质内容）",
      "strength": "弱|中|强"
    }
  ],
  "applicabilityBoundary": "这个论点在什么场景下成立，在什么场景下不成立（1段，50-80字）",
  "authorBias": "原文作者可能存在的视角偏差（1句，可以为null）"
}
```

## 要求

- counterArguments 中 strength=强 的不超过2条，避免夸大
- 如果原文已经自我反驳过某个角度，不要重复
- hiddenAssumptions 是读者通常不会意识到的，不是显而易见的
- 语气中立，不带情绪，不为某一方站队
