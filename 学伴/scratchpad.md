# 学伴 PRD Deck — scratchpad

## Deliverable
- Slide deck, 1920×1080, STUDY MAG / 学習マガジン magazine aesthetic.
- Chinese-primary + bilingual chrome (中文 / 日 ornament / EN eyebrows).
- Embedded **interactive phone** (`<xueban-phone>`): navigate New / Archive / Me / Player; tap PLAY to hear real podcast (assets/podcast.mp3, ~1.08MB doubao TTS), waveform tracks progress, scrub works.
- Built from PRD v3 (自用 alpha, owner Jane).

## Visual system (from manga-jump-xueban/design.md) — BINDING
Colors: newsprint #F4EFE3 (bg + 8% screentone dots), paper #FAF7EE (cards), ink #0B0B0B (text/border/wave), ink-soft #5A5448, red #D8321F (banner/dropcap/ONE hero shadow/active), yellow #F4CC2A (NEW!/FIN sticker + highlighter). Blue #2A4E8A special-issue only.
Type: Anton (Latin display/callsign — VOL/EP, always UPPERCASE), Noto Sans SC 900 (CJK headlines/heartbeat), Noto Sans SC 400 (body), Noto Serif SC (reading page only).
Depth: ONLY hard offset shadows (Npx Npx 0 color) + screentone. NO blur, NO gradient, NO glow, NO italic, NO rounded corners (square default; circle only avatar/+btn).
Signatures: red skewX(-8deg) banner; red Anton drop-cap to open; yellow rotated NEW!/FIN sticker; bilingual eyebrows (今日連載 / TODAY'S EPISODE); ≥1 rotated element per screen. Red budget ≤3 per screen. NO emoji.

## Title sequence (style: Chinese topic noun-phrase + bilingual eyebrow)
01 封面 — 学伴 STUDY MAG · 你的第二海马体 · PRD v3
02 定位 / POSITIONING — 你的第二海马体
03 痛点 / THE PROBLEM — 收藏夹永远 99+
04 核心机制 / HOW IT WORKS — 扔进去 → 后台整理 → 通勤听
05 现场演示 / LIVE DEMO — 点开听一期（live phone, player, real audio）★ hero
06 输入 / INPUT — 截图 / 文字 / 链接，零摩擦
07 处理管线 / THE PIPELINE — 云端七步，用户无感
08 播客页 / THE PLAYER — 三档详细程度，跳过已知
09 档案 / ARCHIVE — 攒进来的，找得回来
10 我的 / 约稿单 — 越用越合口味
11 非功能需求 / NON-FUNCTIONAL — 一秒返回，五分钟成片
12 视觉语言 / DESIGN LANGUAGE — 一本以为自己是周刊漫画的学习杂志
13 范围外 / OUT OF SCOPE — v3 不做的事
14 成功指标 / METRICS — 把我从收藏夹里救出来
15 现阶段 / STATUS — Phase 1 ✅ · Phase 2 ✅ · 日常自用
16 封底 / FIN — 自用，不打算公开发布

## Type scale (CSS vars, 1920×1080)
--type-display 200px (Anton VOL) · --type-title 92px · --type-subtitle 52px · --type-headline 64px (Noto 900)
--type-body 34px · --type-small 28px · --type-eyebrow 24px · --type-callsign 30px (Anton)
--pad-x 110px · --pad-top 96px · --pad-bottom 84px · --gap-title 44px · --gap-item 28px

## Phone screens to recreate (from real wxml/wxss, .mj-* verbatim, rpx→px 1:1 internal 750-wide canvas)
- New(submit): masthead NEW/把碎片，变成播客; mode tabs 文字/图片/链接(active); link textarea; CTA 开始生成播客; tab bar.
- Player: ← BACK / STUDY MAG·date; 今日連載·TODAY banner; drop-cap A + 「I驱动的第二大脑实践指南」; 导读/LEDE highlights 第二大脑/人AI分工/知识复利; host chip 小诺·阿明 + 3 MIN.; hero card ON AIR·EP + waveform + time + scrub + ⟲-15s / PAUSE(red shadow) / +30s⟳; 核心观点/KEY POINTS 01..04. NO tab bar.
- Me(profile): ME/约稿单·我的杂志; 身份 input 设计师; 信息密度 slider 中/MED; 对谈偏好 stickers(反共识犀利/速度快 on); 关注领域 #AI #商业 #编程 on + 自定义; SAVE; tab bar (我的 active).
- Archive(list): masthead VOL.23 六月号 共154期; 已刊/ISSUED list rows EP.07..; floating + ; tab bar (档案 active).

## Tweaks
- accent color (red default / blue special-issue) → drives banners, dropcap, hero shadow, active states across deck (NOT the phone — phone stays canonical).
- screentone on/off.
