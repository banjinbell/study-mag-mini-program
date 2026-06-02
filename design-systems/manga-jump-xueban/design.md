---
version: 0.1
name: Manga Jump · 学習マガジン
slug: manga-jump-xueban
forked-from: manga-jump
description: |
  学伴 是一份「每天出一期」的学習マガジン。AI 把你读到的一篇文章炼成一档双人対談（阿杰 × 小白）的播客，
  而整个产品的视觉假装自己是一本 1990 年代周刊漫画杂志的当日刊。重墨刊头、红斜切横幅、米色报纸底、
  网点纹理；双人主持的「対談卡」是 hero — 墨线漫画头像 + 墨色 chunky 波形 + 红色 Anton drop-cap 起篇。
  没有 4 格漫画，没有心情表情系统；杂志的"連載"骨架被重新映射到学伴的"每日一刊"节奏。

audience: 25–35 年轻白领，通勤型终身学习者，公众号/小红书重度读者，听播客做收尾消化。
canvas: 393×852 px (iPhone 14/15)，小程序设计稿宽 750 rpx；1 px ≈ 1.91 rpx。
fidelity-ceiling: brand-immersive — 全屏视觉骨架、自定义刊头、自定义 tab bar。

# ─── Tokens ──────────────────────────────────────

colors:
  newsprint:   "#F4EFE3"   # 页面底色（必带网点）
  paper:       "#FAF7EE"   # 卡片/容器填充（暖于底色）
  ink:         "#0B0B0B"   # 文本、边框、墨线（暖黑，从不使用 #000）
  ink-soft:    "#5A5448"   # 副信息、日期、引文
  red:         "#D8321F"   # JUMP 红 — 刊头横幅、drop-cap、唯一 hero 阴影
  yellow:      "#F4CC2A"   # 黄贴纸 NEW!/FIN. 与正文 highlight 划重点
  blue:        "#2A4E8A"   # 特别号备选（年终特辑），默认刊期不出现
  rule:        "rgba(11,11,11, 0.18)"     # 实线规则线
  rule-faint:  "rgba(11,11,11, 0.08)"     # 虚线分隔（往期列表）

shadows:
  ink-offset:     "4px 4px 0 #0B0B0B"
  ink-offset-sm:  "2.5px 2.5px 0 #0B0B0B"
  red-offset:     "5px 5px 0 #D8321F"      # ← 全屏唯一一处，標準頭條卡专用
  red-offset-sm:  "3px 3px 0 #D8321F"      # ← tab bar 激活态专用

textures:
  screentone:
    pattern: "radial dots, 4px tile, 1.2px dot, opacity 0.08, color ink"
    use: "底色 #F4EFE3 之上必盖一层；所有 paper 卡片之内不再盖网点。"
    asset: "miniprogram/images/manga/screentone-dots-8.png  (≤6KB, 4×4 tile)"
  motion-lines:
    pattern: "radial line burst, 1.2/0.6px alternating"
    use: "保留在 design.md 中作为可选；本默认刊期不使用（无扉页、无 4 格）。"
    asset: "miniprogram/images/manga/speed-radial.svg (≤4KB)"

typography:
  display:
    family: "Anton, 'Bebas Neue', 'Noto Sans SC', sans-serif"
    size:   "44px / 84rpx"
    weight: 400
    lineHeight: 0.85
    letterSpacing: "-1px"
    transform: uppercase
  headline:
    family: "'Noto Sans SC', 'PingFang SC', system-ui, sans-serif"
    size:   "22px / 42rpx"
    weight: 900
    lineHeight: 1.15
  episode-title:
    family: "'Noto Sans SC', 'PingFang SC', system-ui, sans-serif"
    size:   "26px / 50rpx"
    weight: 900
    lineHeight: 1.1
    description: "今日 hero card 主标题专用；其他屏一律走 headline。"
  body:
    family: "'Noto Sans SC', 'PingFang SC', system-ui, sans-serif"
    size:   "14px / 28rpx"
    weight: 400
    lineHeight: 1.7
  body-serif:
    family: "'Noto Serif SC', 'Songti SC', 'STSong', serif"
    size:   "14px / 28rpx"
    weight: 400
    lineHeight: 1.75
    description: "仅用于「学习材料」长文阅读页正文。其他屏一律走 body。"
  body-heavy:
    family: "'Noto Sans SC', sans-serif"
    size:   "14px / 28rpx"
    weight: 700
    lineHeight: 1.4
  eyebrow:
    family: "Anton, 'Bebas Neue', sans-serif"
    size:   "11px / 21rpx"
    letterSpacing: "0.15em"
    transform: uppercase
    description: "双语小字标签：`今日連載 / TODAY'S EPISODE`、`本期已刊 / THIS WEEK`。"
  micro-label:
    family: "'Noto Sans SC', sans-serif"
    size:   "10px / 19rpx"
    weight: 900
    letterSpacing: "0.18em"
  callsign:
    family: "Anton, 'Bebas Neue', sans-serif"
    size:   "16px / 30rpx"
    letterSpacing: "0.06em"
    description: "EP 编号专用：`EP.07`、`VOL.23`、`P.01`。"
  drop-cap:
    family: "Anton, 'Bebas Neue', 'Noto Sans SC', sans-serif"
    size:   "48px / 92rpx"
    weight: 400
    color: "{colors.red}"
    lineHeight: 0.9
    description: |
      hero 标题首字单独成块的红字 drop-cap。中文起篇首字用 Anton 体显示（仅 Latin 不行），
      所以中文场景退而求其次：用 Noto Sans SC 900 + color red，size 同上。

spacing:
  scale-base: 4
  s1:  "4px / 8rpx"
  s2:  "8px / 16rpx"
  s3:  "12px / 24rpx"
  s4:  "16px / 32rpx"
  s5:  "20px / 40rpx"
  s6:  "24px / 48rpx"
  s8:  "32px / 64rpx"
  s12: "48px / 92rpx"
  page-margin-x: "16px / 32rpx"
  page-margin-y: "20px / 40rpx"

radii:
  square:      "0"          # ← 默认值，所有卡片、CTA、tab bar 块都用它
  bubble:      "12px / 24rpx"   # 仅速记气泡（往期评论可选）
  circle:      "50%"        # 仅头像剪影

borders:
  frame:        "2px solid #0B0B0B"     # 标准卡片
  frame-heavy:  "2.5px solid #0B0B0B"   # hero 卡 / CTA
  rule:         "2.5px solid #0B0B0B"   # 刊头分割线
  rule-thin:    "1.5px solid #0B0B0B"   # 列表项间分割
  rule-dashed:  "1.5px dashed rgba(11,11,11, 0.30)"  # 往期列表项间

components:
  masthead:
    description: |
      每屏首页/列表页顶部必有：
      ① 红斜切横幅 `STUDY MAG / 学習マガジン`（skewX -8°，红底白字，Anton 13px +0.14em），右下挂 4px 黑色硬阴影；
      ② 2.5px 墨色实线；
      ③ Anton `VOL.23` 42px + Noto 900 `六月号` 22px + Anton `2026 · 第 154 期` 12px（行内 baseline 对齐）；
      ④ Noto 400 灰字 tagline「每日 · 把一篇好文，做成你的双人播客」。
      去掉刊头 = 产品塌成普通笔记 app。
    used-on: ["首页", "列表页"]
    forbidden-on: ["播放页", "学习材料阅读页", "我的页"]

  banner-skew:
    background: "{colors.red}"
    color: "#FAF7EE"
    transform: "skewX(-8deg)"
    padding: "4px 14px / 8rpx 28rpx"
    boxShadow: "{shadows.ink-offset}"
    description: "红斜切横幅。Anton uppercase。文字本身要 skewX(+8deg) 反向校正。"
    used-where: "刊头主标；可选地用作章节大标（`今日連載`）。"
    forbidden-where: "禁用作 CTA 按钮（会读成 button）；禁出现 >1 次 per 屏。"

  episode-hero-card:
    border: "{borders.frame-heavy}"
    background: "{colors.paper}"
    boxShadow: "{shadows.red-offset}"
    padding: "14px 14px 12px / 28rpx 28rpx 24rpx"
    description: |
      **系统的 hero move。** 今日 EP 头条卡 — 唯一携带红色硬阴影的元素。
      内含：双语 eyebrow + 红 Anton drop-cap 起篇标题 + 双人主持人墨线头像 + 墨色 chunky 波形 + sticker。
      拿走这张卡，系统塌成「漫画主题的待办清单」。
    used-where: "首页（且仅首页），全屏唯一一张。"
    forbidden-where: "禁出现在其他页；禁同屏多张；禁去掉红阴影改为 ink 阴影（会塌成普通卡）。"

  host-face:
    description: |
      双人主持人的墨线漫画头像。两个固定 SVG：
      - **阿杰（HostFace · A）**：尖刺背头、窄眼半笑、墨色脸颊楔形。
      - **小白（HostFace · B）**：圆刘海、大圆眼带白点高光、影线腮红。
      28–56px 三档尺寸：tab/列表 28px · hero 卡 36px · 详情页 56px。
      headshot 永远是侧脸或半身，**永远不画整身**（学伴的「漫画」就到此为止）。
    used-where: "hero 卡、详情页主持人栏、列表项预览。"
    forbidden-where: "禁用作 tab bar 图标；禁三个或更多并列；禁用 Unicode emoji 替代。"

  ink-waveform:
    description: |
      墨色块状波形。56 根 chunky 黑 bar，每根 width 3px height 4–22px，gap 1.5px；
      已播部分填实 ink，未播部分透明度 18%。**不发光、不渐变、不彩色**。
    used-where: "hero 卡内；详情页播放器。"
    forbidden-where: "禁霓虹/渐变/单根 >24px height（变成均衡器风格就出戏）。"

  sticker:
    background: "{colors.yellow}"
    border: "1.5px solid #0B0B0B"
    boxShadow: "{shadows.ink-offset-sm}"
    rotation: "4°–8°（正负随机）"
    padding: "2px 9px / 4rpx 18rpx"
    description: "Anton 11px uppercase 黄色贴纸：`NEW!`、`FIN.`、`HOT`。"
    used-where: "hero 卡右上角；列表项最新一条；CTA 角标。"
    forbidden-where: "禁同屏 >2 张；禁 0° 不旋转（会读成普通 tag）；禁换非黄色背景。"

  cta-primary:
    background: "{colors.ink}"
    color: "#FAF7EE"
    border: "2.5px solid #0B0B0B"
    boxShadow: "{shadows.ink-offset}"
    padding: "14px / 28rpx"
    description: "首屏底部「粘贴新一期」按钮。黑底白字 Noto 900 16px +0.2em。"
    used-where: "首页底部固定（在 tab bar 之上 16px）。"
    forbidden-where: "禁用红阴影（红阴影留给 hero 卡）；禁圆角；禁渐变。"

  cta-floating-add:
    background: "{colors.red}"
    border: "2.5px solid #0B0B0B"
    boxShadow: "{shadows.ink-offset-sm}"
    borderRadius: "{radii.circle}"
    size: "56px"
    description: "悬浮 ＋ 按钮，唯一的圆形元素；Anton 32px `＋`。"
    used-where: "列表页右下角，距底 tab bar 顶 18px。"
    forbidden-where: "禁首页（首页已经有 cta-primary）。"

  list-row:
    borderTop: "{borders.rule-dashed}"
    padding: "10px 0 / 20rpx 0"
    description: |
      往期列表项：左 Anton 16px 编号 (`EP.06`)，中 Noto 700 14px 标题（单行省略），
      右 Anton 12px 日期。仅列表，没有缩略图。
    used-where: "首页本周已刊 · 列表页全部。"
    forbidden-where: "禁加图标列；禁加多行 description；禁加 border-radius。"

  tab-bar:
    height: "82px / 156rpx (含安全区)"
    background: "{colors.paper}"
    borderTop: "{borders.frame-heavy}"
    description: |
      底部 tab bar，3 个 tab：今日 TODAY · 档案 ARCHIVE · 我的 ME。
      每个 tab = 46×46 方块 + 双语标签（Noto 900 10px 中文 / Anton 8px 英文）。
      激活态：黑色边框换 red，背景填 red，文字白，整块 translate(-1px,-1px) + red-offset-sm 阴影。
    used-where: "首页 · 列表 · 我的（3 个 tab 页）。"
    forbidden-where: "禁详情页（详情页 tab bar 隐藏，让出视觉给学习材料）。"

  reading-page-frame:
    description: |
      学习材料阅读页（点击 hero 进入）专属：
      - 顶部 sticky 子刊头：`第 七 話` 红 banner + 标题 + 阿杰×小白 头像
      - 正文走 body-serif（Noto Serif SC），首字红色 Anton drop-cap
      - 段落首字下沉，段间距 24px
      - 重点句加 yellow highlighter（无 padding 无 radius，一道黄色 swipe）
      - 底部固定播放器条（音频 + 进度），墨线 frame
    used-where: "学习材料阅读页（taskId 路径）。"
    forbidden-where: "禁出现在首页。"

mini-program-adapter:
  rpx-conversion: "设计稿基于 393×852 px；落地 wxss 时 1px ≈ 1.91rpx。所有 token 都标注了 px / rpx 双值，wxss 中统一用 rpx。"
  fonts:
    custom-loads: 2
    plan:
      - "Anton (Latin display)：subset → 仅 0-9 + 大写 A-Z + 常用字符，woff2 ≤80KB。app.js 启动 wx.loadFontFace。"
      - "Noto Sans SC 900 (CJK chrome)：subset → 常见 1500 字 + 兼容杂志词汇（連載·扉頁·対談·話 etc.），woff2 ≤180KB。"
    fallback: |
      - Anton 不可用 → 显示 system geometric sans。后果：刊头失去 weight 感（已知 gap）。
      - Noto Sans SC 900 不可用 → 显示 PingFang SC 600（iOS）/ Microsoft Yahei Bold（Android）。
      - Noto Serif SC 400 不加载，仅声明 font-family，落到系统宋体（iOS Songti SC / Android 系统兜底）。
    font-display: swap
  safe-area: "tab bar 高度 = 82px 视觉 + env(safe-area-inset-bottom)；cta-primary `bottom: calc(92rpx + env(safe-area-inset-bottom))`。"
  capsule: "微信胶囊在顶部右上 87×32px；刊头 marginTop 设 116rpx 以避开。"
  asset-paths:
    - "miniprogram/images/manga/screentone-dots-8.png"
    - "miniprogram/images/manga/speed-radial.svg (备用 · 默认刊期不使用)"
    - "miniprogram/images/manga/host-a.svg"
    - "miniprogram/images/manga/host-b.svg"
---

# Manga Jump · 学習マガジン

## FORK 来历

这是从基底系统 **`manga-jump`** fork 而来。基底是为「漫画日记」app 设计的，hero move 是「AI 生成的 4 格漫画页」。学伴的 hero feature 是「双人播客」而非漫画，且面向 25–35 通勤白领（基底原 Avoid-for 明确列了 "productivity tools" 和 "audiences over 35 unprimed for manga"），所以是 FORK 而非 SELECT。

### 继承（不动）
- 刊头骨架：红斜切横幅 + 2.5px 墨线 + Anton VOL/月号 双语刊期
- 调色板：newsprint + paper + ink + 一红一黄 的两色印刷气质
- 网点底纹（screentone）8% 不透明覆盖整个底色
- 硬偏移阴影体系（ink-offset 默认 · red-offset 全屏唯一）
- Anton + Noto Sans SC 900 的"杂志心跳"配对
- 红色 Anton drop-cap 起篇
- 黄色 NEW!/FIN. 旋转贴纸
- 双语 eyebrow（`今日連載 / TODAY'S EPISODE`）
- 无圆角、无渐变、无 blur 的克制原则

### 替换（axis substitution）
| 维度 | 基底 manga-jump | manga-jump · 学伴 |
|---|---|---|
| **Hero move** | 4 格漫画（2×2 grid，screentone 天空，speech bubble） | **対談頭條卡**：红阴影边框 + 红 Anton drop-cap 起篇 + 阿杰×小白双人墨线头像 + 墨色 chunky 波形 |
| 刊名 | `DIARY MAG / 日記マガジン` | `STUDY MAG / 学習マガジン` |
| 周期 | 月刊（`VOL.07 · 三月号`） | 每日一刊（`VOL.23 · 六月号 · 第 154 期`） |
| 心情系统 | `MangaMood` 5 张表情 SVG | 删除 — 学伴不记录心情 |
| 主插画 | 4 格漫画页（占首页约 1/2 高度） | 删除 — 不画漫画页/扉页；唯一漫画元素是头条卡里的两个主持人头像 |
| body 字体 | Noto Serif SC（日记体） | Noto Sans SC（首页主用）/ Noto Serif SC（仅阅读页） |
| Audience | 16–35 漫画读者 | 25–35 白领，通勤型终身学习者 |

### 新增（学伴专属）
- **対談頭條卡**（`episode-hero-card`）：新的 hero primitive。
- **`HostFace · A` / `HostFace · B`**：两个固定 SVG 主持人墨线头像（阿杰 / 小白），替代基底的 5 张 MangaMood 表情。
- **`ink-waveform`**：墨色块状波形 primitive，把播客可视化进墨线纸刊语言。
- **`reading-page-frame`**：学习材料长文阅读页的专属容器，子刊头 + 黄色 highlighter + 底部固定播放器条。
- **每日一刊节奏**：列表页的 `第 154 期` 自动递增；档案分组按"周"而非按"月"。

### 删除（带走的可承受损失）
- `comic-panel` primitive — 学伴不生成漫画。
- `manga-mood-face` primitive — 学伴不记录心情。
- `motion-lines` 主用法 — 留作可选 token，默认刊期不出现。
- `MangaMood` 5 张表情 SVG 资源 — 不打包进 miniprogram/images。

---

## When to reach for this system

**Best for**
- 通勤场景下的学习/听播客 app；
- "公众号长文 → AI 学习材料 + 双人播客"这一对 pipeline 居于核心的产品；
- 25–35 白领，读过周刊漫画但不一定是当下漫画用户；
- 想让"每日一篇"这件事有"出刊"仪式感的产品；
- 高识别度、可截图分享的 brand-immersive 小程序。

**Avoid for**
- 笔记类、文档类、表单类、管理后台 — 系统视觉自我太强会盖住任务；
- 用户 >45 岁且不接受漫画语汇；
- 需要 dark mode 主战场的产品（系统本质是印刷品，反色后红色塌陷）；
- 任何"漫画/插画是关键内容"的产品 — 本 fork 已删除漫画 primitive；
- 信任度/严肃度优先的产品（保险、金融、医疗）— 红色斜切 + 旋转贴纸不严肃。

**Neighbors** — 1990s 周刊少年 Jump 封面 · 平凡社《POPEYE》《BRUTUS》早期封面 · ChibiMaruko 内页分镜 · Risograph zine · 黑鸟青年杂志 · 一条早期推送排版 · Underline 月刊 · 《单读》专题页 · 小宇宙某些 NPR 风电台节目封面。

---

## Aesthetic direction

| | |
|---|---|
| **Thesis** | *学伴 是一本以为自己是 1990 年代周刊少年 Jump 的学习杂志。每天出一期，每期一档双口対談，正文用宋体读得下去，刊头永远红斜切。* |
| **One world** | 1990 年代东京 · 神保町 · 漫画杂志生态。Anton 来自欧美杂志拼版，宋体来自亚洲印刷传统，红斜切来自 Jump 封面，黄贴纸来自校刊 — 全部活在"实体杂志"那一个世界里。 |
| **Tactile qualities** | 米黄报纸纸感、墨线略浮起一线、网点是手贴的、红色是单色专色印刷、贴纸有翘起的胶痕。一切都微微歪着。 |
| **Three keywords** | *连载 (serialized) · 重墨 (inked) · 不响 (quiet-loud — 看起来很响其实在做安静的事)* |

### Hero move

**唯一 hero move：対談頭條卡（`episode-hero-card`）。**

> 拿走它，剩下的系统会塌成「漫画主题的待办清单 app」。

它本身是六个动作叠出来的一张卡：
1. 2.5px 墨色硬边框；
2. 4px 红色硬偏移阴影（全屏仅此一处）；
3. 红 Anton 48px drop-cap 起篇（`深`、`A`、`如`、`07` 都可）；
4. 紧接 Noto Sans 900 26px 两行标题；
5. 阿杰 + 小白 36px 墨线头像并排 + Anton 主持人称号；
6. 56 根墨色 chunky 波形 + Anton 14px 时长。

没有任何 hero 元素 — 渐变光斑、玻璃磨砂、动效 — 与之竞争。

---

## Color

**两色印刷气质。** 黑墨 + 一红，外加少量黄做高亮。其余全是报纸底色或纸面。蓝是冬季特别号保留色，默认刊期不出现。

### Tokens

```css
--mj-newsprint  : #F4EFE3;     /* 页面底色，必带网点 */
--mj-paper      : #FAF7EE;     /* 卡片/容器填充 */
--mj-ink        : #0B0B0B;     /* 文字、边框、波形 — 暖黑，永不用 #000 */
--mj-ink-soft   : #5A5448;     /* 副信息、日期、tagline */
--mj-red        : #D8321F;     /* 刊头横幅、drop-cap、唯一 hero 阴影、tab 激活 */
--mj-yellow     : #F4CC2A;     /* NEW!/FIN. 贴纸、正文 highlighter */
--mj-blue       : #2A4E8A;     /* 仅冬季/特别号备用，默认不出现 */
--mj-rule       : rgba(11,11,11, 0.18);
--mj-rule-faint : rgba(11,11,11, 0.08);
```

### 角色赋值（every token has used-where AND forbidden-where — F6）

| Token | Used where | Forbidden where |
|---|---|---|
| `--mj-newsprint` | 页面底色；必盖 8% 网点 | 卡片内（卡片用 `paper`）；不带网点 |
| `--mj-paper` | 卡片填充、波形 bar 背板、CTA-secondary、tab bar 默认底 | 页面底色；任何容器内嵌容器（再嵌就读不出层次） |
| `--mj-ink` | 全部文字、所有边框、波形已播 bar、墨线头像填充 | tab bar 激活态文字（激活态走 `paper`）；任何 hover/press 浅化色 |
| `--mj-ink-soft` | 副信息（日期、第 X 期、tagline、波形未播 bar） | 主标题、CTA 文字、刊头主字 |
| `--mj-red` | 刊头横幅、drop-cap、`episode-hero-card` 阴影、tab 激活态 | 任意 hover 高亮；任意 CTA 文字色；超过 **3 处 per 屏** |
| `--mj-yellow` | `NEW!`/`FIN.` 贴纸、正文 highlighter swipe | 任何文字色；任何 >2 处 per 屏 |
| `--mj-blue` | 冬季特别号刊头横幅、年终特辑封面 | 默认刊期；任何 CTA |
| `--mj-rule` | 列表项实线分隔 | 卡片边框（边框用 ink 实色 2px） |
| `--mj-rule-faint` | 往期列表虚线分隔 | 任何主分隔；任何 CTA 边框 |

### 同屏红色预算

| 元素 | 红色用量 | 备注 |
|---|---|---|
| 刊头横幅 | 1 | 横幅填充 + 墨色硬阴影 |
| 唯一 hero card 阴影 | 1 | 全屏唯一 5px red-offset |
| Drop-cap | 1 | hero 卡内首字 |
| Tab 激活态 | 1 | 仅当前页 |
| **合计上限** | **3** | 超 3 视觉就吵 |

---

## Typography

**三个声音**：Anton 杂志拉丁 chrome · Noto Sans SC 900 中文重头字 · Noto Serif SC 仅阅读页正文。没有 italic — 强调靠 weight / color / skew。

- **Anton / Bebas Neue** — `VOL.23`、`EP.07`、`CHAPTER 07`、`BY 阿杰`、tab bar 英文小注。永远大写、永远不切小写。
- **Noto Sans SC 900** — `六月号`、hero 标题、tab 中文标签、刊头副标。承担"重击"。
- **Noto Sans SC 700** — 列表项标题、CTA 文字、卡片内副标。
- **Noto Sans SC 400** — 首页所有 body（说明文字、tagline、表单文字）。
- **Noto Serif SC 400** — **唯独**学习材料长文阅读页正文。其他地方一律不用宋体。

### Scale 落地表

| Token | Size (px / rpx) | Family | Weight | Use |
|---|---|---|---|---|
| `--ty-display` | 44 / 84 | Anton | 400 | `VOL.23` 刊号、大型统计数字 |
| `--ty-headline` | 22 / 42 | Noto Sans SC | 900 | 列表页标题、二级标题 |
| `--ty-episode-title` | 26 / 50 | Noto Sans SC | 900 | hero 卡今日 EP 标题（仅此一处） |
| `--ty-body` | 14 / 28 | Noto Sans SC | 400 | 首页全部 body |
| `--ty-body-serif` | 14 / 28 | Noto Serif SC | 400 | **仅** 学习材料阅读页正文 |
| `--ty-body-heavy` | 14 / 28 | Noto Sans SC | 700 | 列表项标题、CTA |
| `--ty-eyebrow` | 11 / 21 | Anton | 400 | 双语 chrome 小字 |
| `--ty-micro-label` | 10 / 19 | Noto Sans SC | 900 | 字段标签（无大写化） |
| `--ty-callsign` | 16 / 30 | Anton | 400 | `EP.07`、`VOL.23` |
| `--ty-drop-cap` | 48 / 92 | Anton OR Noto 900 | 400/900 | 红色起篇首字（仅 hero 与阅读页） |

### Signature treatments

- **Anton + Noto 900 是系统心跳。** `VOL.23` Anton 紧靠 `六月号` Noto 900 是规范配对，刊头永远这么写。
- **红 Anton drop-cap = 起篇的仪式。** 当首字是英数（`A`、`07`、`How`），用 Anton 48px。当首字是中文（`深`、`如`、`为`），用 Noto Sans 900 48px 红色 — 接受这次不是 Anton；视觉量保持。
- **双语 eyebrow 必须。** 字段标签 `标题 / TITLE`、章节 `今日連載 / TODAY'S EPISODE`、模式 `撰稿中 · DRAFTING`、状态 `READY / 已刊`。单语 eyebrow 立刻让杂志气质塌掉。
- **没有 italic。** 强调 = weight 900 / color red / skewX(-8°) 红横幅。任何 italic 立刻出戏。
- **黄色 highlighter 是阅读页专利。** 在 body-serif 正文里给重点句加 yellow background span — 无 padding 无 radius，像一道马克笔。**只在阅读页**，首页和列表页不允许出现。
- **整屏 ≥1 个旋转元素**（贴纸 4–8° / 红横幅 skewX -8° / 激活 tab translate -1px）。完全 0° 直角的屏 = 默认笔记 app。

---

## Layout

学伴是 3 个主 tab + 1 个非 tab 阅读页 + 1 个播放页。每个屏的 layout 骨架：

### 首页（home / 今日）

```
0px    ─────────────────────────────  status bar (54px)
54px   ─────────────────────────────  capsule
116px  ┌──────────────────────────┐  ┐
       │ ▰ STUDY MAG / 学習マガジン   │  │ MASTHEAD (88px)
       │ ──── 2.5px ink rule ──── │  │
       │ VOL.23  六月号    第 154 期 │  │
       │ 每日 · 把一篇好文…           │  │
204px  └──────────────────────────┘  ┘
       ┌──────────────────────────┐  ┐
       │  EP.07   今日連載          │  │
       │ ┌───────────────────────┐│  │
       │ │ 深 度工作的四种模式      ││  │ EPISODE HERO CARD (260px)
       │ │ 阿杰 × 小白             ││  │  [red-offset shadow]
       │ │ ▍▎▌▎▊▏▊▎▍▎ 14:32/22:08 ││  │
       │ └───────────────────────┘│  │
       └──────────────────────────┘  ┘
       ┌──────────────────────────┐  ┐
       │ 本周已刊 / THIS WEEK 05/07 │  │
       │ ─────────────────────    │  │ LIST (160-220px)
       │ EP.06  为什么大公司…  06.01│  │
       │ ─────────────────────    │  │
       │ EP.05  AI 时代的写作…  05.30│ │
       └──────────────────────────┘  ┘
       ┌──────────────────────────┐  ┐
       │  ▮ 粘贴新一期 ▮            │  │ CTA-PRIMARY (52px)
       └──────────────────────────┘  ┘
       ┌──────────────────────────┐  ┐
       │  ▢今日   ▣档案   ▢我的      │  │ TAB BAR (82px + safe-area)
       └──────────────────────────┘  ┘
```

**规则**：
- 一屏只能有 **1 张** `episode-hero-card`；
- 一屏 **必有** 刊头；
- 一屏 **必有** 1 处旋转（默认是刊头横幅的 -8° skew）；
- 列表行无缩略图、无图标列；
- CTA-primary 始终在 tab bar 之上 16px 处。

### 列表页（档案 / Archive）

刊头继承首页规范，但 `第 154 期` 改成 `共 154 期`。列表按"周"分组（不是按"月"），每组顶端有 Anton 16px 周编号 + `[ 6 月第 1 周 / WEEK 22 ]` 双语 eyebrow。右下角悬浮 `cta-floating-add`（红圆 + 墨阴影）。

### 阅读页（学习材料长文）

- 顶部 sticky 子刊头（高度 68px）：
  - `第 七 話` 红斜切横幅
  - Noto 900 标题
  - 阿杰 × 小白 28px 头像（缩小版）
- 正文走 `body-serif`，首段首字红色 48px drop-cap；
- 段落间距 24px；
- 重点句加黄色 highlighter swipe（**仅此页允许**）；
- 底部固定播放器条（高 64px）：墨色 frame + ink-waveform + 时长 + 播放/暂停。

### 播放页（player）

- 隐藏 tab bar；
- 顶部刊头退化为「mini callsign 条」：`EP.07 · 深度工作的四种模式 · 22:08`；
- 中央放大版主持人头像（56px×2）；
- 主视觉是放大的 ink-waveform（72 根 bar，可拖动 scrub）；
- 底部三按钮：上一期 / 播放 / 下一期（无后退 15s/快进按钮 — 学伴是听完整期）。

### Spacing / Radii / Borders（落地）

```css
/* spacing — multiples of 4，全部以 rpx 给出 */
--space-1: 8rpx;   --space-2: 16rpx;  --space-3: 24rpx;
--space-4: 32rpx;  --space-5: 40rpx;  --space-6: 48rpx;
--space-8: 64rpx;  --space-12: 92rpx;
--page-margin-x: 32rpx;
--page-margin-y: 40rpx;

/* radii — almost everything is square */
--radius-square: 0;
--radius-bubble: 24rpx;   /* 仅速记气泡，本默认刊期不使用 */
--radius-circle: 50%;     /* 仅 cta-floating-add + 头像 */

/* borders — 重墨 */
--border-frame:        4rpx solid #0B0B0B;       /* 标准卡 */
--border-frame-heavy:  5rpx solid #0B0B0B;       /* hero + CTA */
--border-rule:         5rpx solid #0B0B0B;       /* 刊头分隔 */
--border-rule-thin:    3rpx solid #0B0B0B;       /* 列表实线 */
--border-rule-dashed:  3rpx dashed rgba(11,11,11, 0.30);  /* 往期虚线 */

/* shadows — 仅硬偏移，永无 blur */
--shadow-ink:        8rpx 8rpx 0 #0B0B0B;
--shadow-ink-sm:     5rpx 5rpx 0 #0B0B0B;
--shadow-red:       10rpx 10rpx 0 #D8321F;     /* 唯一 hero */
--shadow-red-sm:     6rpx 6rpx 0 #D8321F;      /* tab 激活 */
```

---

## Depth

系统只有两种深度工具：**硬偏移阴影** + **网点底纹**。无渐变、无 blur、无 glow、无 backdrop-blur。

| 工具 | 用法 | 上限 |
|---|---|---|
| Ink 偏移阴影 (`4–4px 0 ink`) | 卡片、CTA、刊头横幅、列表分组容器的默认抬升 | 无上限 |
| Red 偏移阴影 (`5–5px 0 red`) | **整屏唯一** 携带它的元素就是 hero — 只能给 `episode-hero-card` 或学习材料阅读页的子刊头 | 1 处 / 屏 |
| Red 偏移阴影 sm (`3–3px 0 red`) | 仅 tab bar 激活态使用 | 1 处 / 屏（与 hero 不同位） |
| 网点底纹 | 整个 `--mj-newsprint` 底色之上必盖 1 层，opacity 0.08 | 不在 paper 卡片之内重复盖 |

**禁用清单**：`box-shadow` 带 blur radius（`0 4px 12px ...`）、CSS 渐变（`linear/radial-gradient`）、`backdrop-filter`、`filter: blur()`、`text-shadow` 带 blur、动态 SVG 滤镜。

---

## Illustration direction

> *基底 manga-jump 的"插画 = 4 格漫画页"约定在本 fork 中作废。*

本系统只有 **3 处** 允许出现"插画形式"的内容：

### 1 · 双人主持人墨线头像

两个固定 SVG，不随期数变化：

- **阿杰（HostFace · A）** — 尖刺背头、窄眼半笑、墨色脸颊楔形、眉毛紧。代表"挑刺、反共识、追问"。
- **小白（HostFace · B）** — 圆刘海、大圆眼带白点高光、影线腮红、小嘴弯。代表"好奇、铺垫、共情"。

两人都是 mid-shot（头 + 肩），永远不画整身。SVG 仅黑白两色 + paper 填充。

**Asset 文件**：
- `miniprogram/images/manga/host-a.svg` (≤4KB)
- `miniprogram/images/manga/host-b.svg` (≤4KB)

**尺寸档**：28px (tab/列表) · 36px (hero 卡) · 56px (详情/播放页) — 不要任意中间尺寸。

### 2 · 墨色 chunky 波形

不是插画，但是系统里的"图形语言"。规则：
- 56 根 bar (首页 hero) / 72 根 bar (播放页 scrub)
- 每根 width 3px / height 4–22px
- gap 1.5px
- 已播 = ink 实色；未播 = ink 18% 透明度
- **禁** 渐变、霓虹、彩色、动效弹跳

### 3 · 网点底纹

底色 `--mj-newsprint` 之上必盖 4×4 PNG/SVG 网点 pattern @ 8% — 没有它系统塌成普通 web 页。

### 不再生成的内容

- ✗ 4 格漫画页（基底原 hero，本 fork 删除）；
- ✗ 扉页 splash plate（曾考虑，用户否决）；
- ✗ MangaMood 表情系统；
- ✗ 任何 AI 生成的图像 — 学伴不调用图像模型。

---

## Voice & copy

按 **「1990 代漫画杂志主编做学习栏目」** 写。短、双语、克制、不撒娇。

| Slot | Example |
|---|---|
| 刊头主标 | `STUDY MAG / 学習マガジン` (红斜切，永远全大写 + 日文) |
| 刊期 | `VOL.23  六月号  ·  2026 · 第 154 期` |
| Tagline | `每日 · 把一篇好文，做成你的双人播客` |
| Eyebrow（章节） | `今日連載 / TODAY'S EPISODE` · `本期已刊 / THIS WEEK` · `档案 / ARCHIVE` |
| EP 标签 | `EP.07 · 第七話`（红横幅）+ `2026·06·02`（Anton 副字） |
| Hero 标题 | `深度工作的四种模式`（Noto 900 26px，首字`深`红 Anton drop-cap 48px） |
| 主持人称号 | `BY 阿杰 × 小白` (Anton 9px) |
| 状态贴纸 | `NEW!`（hero 右上角，黄底黑边，旋转 6°）· `FIN.`（已听完，旋转 -4°）· `LIVE`（生成中） |
| 模式 eyebrow | `撰稿中 · DRAFTING` (生成中) · `已刊 · ISSUED`（完成） · `脱稿 · OFF DECK`（失败） |
| CTA-primary | `▮ 粘贴新一期 ▮` (Noto 900 16px +0.2em) |
| CTA-floating | `＋`（Anton 32px，红圆里） |
| Tab 标签 | `今日 / TODAY` · `档案 / ARCHIVE` · `我的 / ME` |
| Tagline 错误态 | `脱稿 — 重新粘一次试试` (Noto 700 14px，无表情符号) |
| 空状态 | `本期未開始 / EPISODE NOT YET STARTED` + `▮ 粘第一篇 ▮` CTA |

**声音原则**：
- 不要说"你"，说"今日"（"今日連載"、"今日已完"）— 杂志口吻不指人；
- 不要用 emoji（黄贴纸 / drop-cap / Anton 数字承担表达），用了就出戏；
- 中日英可以混排（`今日連載 / TODAY'S EPISODE`、`第 七 話 · CHAPTER 07`）— 这是刊物语言不是 bug。

---

## Do & Don't

### Do（8 条）

1. 每个首页/列表页顶部必有完整刊头（红横幅 + 2.5px 墨线 + Anton + Noto + 双语副刊号）。
2. 首页 hero 卡用且仅用 1 张 `episode-hero-card`，红阴影专属。
3. 每屏 ≥1 个旋转元素（贴纸、红横幅 skew、激活 tab 偏移）。
4. 双语 eyebrow 永远配对（`今日 / TODAY`、`档案 / ARCHIVE`）。
5. 列表分隔用 `--rule-dashed`（1.5px dashed @ 30% ink）；卡片边框用 ink 实色 2px。
6. 用 Anton 给所有 `EP.07`、`VOL.23`、`P.01` 编号 — 不掺中文数字进 callsign。
7. 阅读页正文 highlighter（黄 swipe）每段 ≤1 处，整篇 ≤6 处。
8. 学习材料正文必须走 Noto Serif SC — 首页和列表页不准出现宋体。

### Don't（9 条）

1. 不要用 `#000000` — ink 永远 `#0B0B0B`。
2. 不要给卡片加圆角。Square 是默认。仅头像 + 悬浮 ＋ 按钮可圆。
3. 不要引入第 3 种 spot color。红 + 黄 + 蓝（仅特别号）就是上限。
4. 不要用 blur / glow / backdrop-filter / 任何带模糊的 box-shadow / 任何 CSS 渐变。
5. 不要给 hero 之外的元素加红阴影。红阴影是 hero 的徽章。
6. 不要在阅读页之外用 Noto Serif SC — serif 一出现，杂志的"chrome"气质崩。
7. 不要画整身的主持人 — 头像只有 mid-shot。
8. 不要用 Unicode emoji — 用 Anton 数字 / 黄贴纸 / 双语 eyebrow 替代。
9. 不要让 italic 出现 — 没有 italic mode，任何斜体都会读成 bug。

---

## CJK & International

系统 **CJK-first by design**：刊头是中日混排（`STUDY MAG / 学習マガジン`、`第 七 話`、`六月号`），Latin 仅做 chrome 和 callsign。

| Role | CJK | Latin counterpart | 是否可替代 |
|---|---|---|---|
| Display 大刊号 | Noto Sans SC 900 `六月号` | Anton 44 `VOL.23` | 配对必须同框 |
| Headline | Noto Sans SC 900 | Anton 22 uppercase | 中文场景默认 CJK，Latin 仅做副字 |
| Drop cap | Noto Sans SC 900 red 48px | Anton 48 red | 中文起篇用 Noto，英文 / 数字起篇用 Anton |
| Body（首页/列表/播放） | Noto Sans SC 400 | — | 无 Latin body 用法 |
| Body（阅读页） | Noto Serif SC 400 | — | 仅此页；落不到字时降级到系统宋体 |
| Eyebrow / chrome | Noto Sans 900（中文小字部分） | Anton +0.15em uppercase | 必须配对，单语 chrome 立刻塌 |
| Callsign（EP/VOL/P.） | — | Anton | 永远 Latin，不译为中文数字 |

### CJK 排版细节

- 行高：headline 1.15；body 1.7；body-serif 1.75。
- 中文字距：`letter-spacing: 0`；+0.15em 仅 Latin。
- 标点：正文用全角（，。：；！？「」）；Latin eyebrow 内用半角。
- "盘古之白"：中日韩字符紧邻 Latin/数字时，插一个 ASCII 空格（`阿杰 × 小白`、`EP.07 · 深度工作的四种模式`）。
- 中文 drop-cap **不可** 用 `Anton` 字体（无字形）— 退到 Noto Sans 900 同尺寸同颜色，视觉量不变。
- 日文章节词作为 ornament 使用 — `学習マガジン`、`第 X 話`、`扉頁`、`連載` — 即便用户全中文也保留这些日文字串，这是杂志声音。

---

## Mini-program 落地适配

### rpx 与画布

- 设计稿基准 393×852 px（iPhone 14/15）。
- wxss 中统一使用 rpx：`1px ≈ 1.91rpx`（750 / 393）。
- 所有 token 表都给 `px / rpx` 双值；开发只看 rpx 列。

### 自定义字体加载（关键 ⚠）

小程序原生没有 `@font-face` 直接加载远端字体的可靠途径，必须使用 `wx.loadFontFace`。

**在 `app.js` 里**：

```js
App({
  onLaunch() {
    // 1) Anton — Latin display, subset 仅 0-9 + A-Z + 常用符号
    wx.loadFontFace({
      family: 'Anton',
      source: 'url("https://<cdn>/fonts/anton-subset.woff2")',
      desc: { weight: 'normal', style: 'normal' },
      global: true,
      success: () => console.log('[font] Anton loaded'),
    });
    // 2) Noto Sans SC 900 — CJK chrome
    wx.loadFontFace({
      family: 'NotoSansSC',
      source: 'url("https://<cdn>/fonts/noto-sans-sc-900-subset.woff2")',
      desc: { weight: 'normal', style: 'normal' },
      global: true,
    });
  },
});
```

**预算上限**（platform.md F9）：
- 自定义字体 ≤ **2 个** weight；
- 每个 woff2 ≤ **150 KB**（Anton 实测 ≤80KB，Noto SC 900 subset ≤180KB — 略超，但单次首屏，可接受）；
- `font-display: swap` 等价于 wx.loadFontFace 的默认行为；
- 加载失败 fallback：
  - Anton → 系统几何 sans-serif（刊头会失去 condense 感，已知 gap）；
  - Noto Sans SC → iOS `PingFang SC 600` / Android `Microsoft Yahei Bold` — 视觉量降一档可接受；
  - Noto Serif SC 不主动加载，仅声明 family，落系统宋体（iOS Songti SC / Android 缺省）。

### 安全区 / 胶囊 / tab bar

```wxss
/* tab bar */
.mj-tabbar {
  height: 156rpx;                                    /* 82px 视觉 */
  padding-bottom: env(safe-area-inset-bottom);
}
/* primary cta 浮在 tab bar 之上 16px */
.mj-cta-primary {
  bottom: calc(172rpx + env(safe-area-inset-bottom));
}
/* 顶部刊头让出胶囊 */
.mj-masthead { margin-top: 116rpx; }   /* 60px = status bar + capsule */
```

### 静态资源（提交到 miniprogram/images/manga/）

```
miniprogram/images/manga/
├── screentone-dots-8.png      ← 4×4 网点 pattern，≤6KB，wxss background-image 平铺
├── host-a.svg                  ← 阿杰墨线头像，≤4KB
├── host-b.svg                  ← 小白墨线头像，≤4KB
├── speed-radial.svg            ← 备用，默认刊期不引用
└── fonts/                      ← 不打包字体，wx.loadFontFace 远端拉
```

### Chrome-only → WXSS-safe degradation 表（gate F9）

| Preview 用到的 Chrome-only 效果 | 落到小程序的安全做法 |
|---|---|
| `box-shadow: 0 4px 12px rgba(...)` 软阴影 | **从未使用** — 系统只有硬偏移阴影（`Npx Npx 0 color`），WXSS 完全等价 ✓ |
| `backdrop-filter: blur()` | **从未使用** — 全系统无玻璃磨砂 ✓ |
| CSS `linear-gradient` / `radial-gradient` | **从未使用** — 全色块印刷气质 ✓ |
| `text-shadow` 带 blur | **从未使用** — drop-cap 是 solid color，不靠阴影 ✓ |
| 网点 pattern（preview 中用 inline SVG data URL） | 替换为 4×4 PNG 平铺 (`screentone-dots-8.png`)，背景图引用 |
| 主持人头像（preview 中 inline SVG） | 抽离为外部 SVG 文件 `host-a.svg` / `host-b.svg`，wxml 用 `<image>` 引用 |
| 速度线 radial SVG（preview splash 用） | 默认刊期不使用；若启用，做成 SVG 资源外置 |
| Anton / Noto Sans SC 字体 | `wx.loadFontFace` 全局加载 + 远端 CDN + 兜底 fallback 链 |
| `transform: skewX(-8deg)` 红横幅 | WXSS `transform` 直接支持 ✓ |
| `transform: rotate(6deg)` 黄贴纸 | WXSS 直接支持 ✓ |
| `writing-mode: vertical-rl`（曾在扉页用） | 默认刊期不使用；小程序仅支持 inline-block 旋转近似（已删此用法）|

**Silent-failure 风险**：本系统已完全规避 platform.md 的 silent-failure 清单（无 backdrop-filter、无 filter、无 DOM clip-path、无 scroll-driven、无 :has()）。X5 老 Android 表现与 iOS 一致。

---

## Iteration checklist

发布每个新屏前过一遍 — 全是 yes/no 题：

1. [ ] 这屏顶部是不是有完整刊头（红横幅 + 2.5px 墨线 + VOL + 月号 + 副刊号）？
2. [ ] 这屏正好有 **一处** 红阴影元素（hero 卡或子刊头），没有第二处？
3. [ ] 这屏正好有 **一张** `episode-hero-card`（首页才有），没有第二张？
4. [ ] 这屏 ≥1 个旋转元素（贴纸 / 红横幅 / 激活 tab）？
5. [ ] 这屏有没有任何带 blur 的 box-shadow / 任何 CSS 渐变 / 任何 italic？（应该全是 no）
6. [ ] 所有 EP 编号、刊号、页码都是 Anton 不是中文数字？
7. [ ] 这屏有没有出现 Noto Serif SC 宋体？（除阅读页外应该 no）

---

## Known gaps

诚实清单 — 不掩饰还没解决的事。

- **字体首次加载抖动**：Anton + Noto Sans SC 远端拉，首次进入小程序前 200–800ms 走系统 fallback 渲染一遍再切换，刊头会"重排"。可接受但需向用户隐藏（小程序启动页"加载中"）。
- **Anton 在低端 Android 上栅格化偏粗**：subset woff2 在 ≥36px 时清晰，但 24px 以下（如 `EP.06` 列表小字）有时挂边。可接受；若挑剔，改用 PNG 切片替换 callsign。
- **Noto Sans SC 900 体积 ≥180KB**：超过 platform.md 推荐的 150KB/weight。可接受但应监控首次启动指标；若需进一步压缩，按 GB2312（6700 字）subset 至 ~120KB，代价是部分生僻字落回系统字体一档。
- **没有 dark mode**：本质是印刷品，反色后红色暗化为褐色、网点变白沙、Anton 失去 chrome 气质。正解是出"夜场特别号"（`--mj-newsprint` 换为深绿 `#0F2A24` 暗印纸感、保留 jump-red、加扁平网点），而不是简单 invert。**优先级 P3**。
- **对话稿在阅读页的层次未定**：阅读页正文走宋体，但 AI 生成的双口対談稿（阿杰：X / 小白：Y）该怎么排（缩进？双栏？头像左右分页？）尚未定。**P1**，是首屏体验之后第二要紧的事。
- **未做对比度复核**：黄底黑边贴纸的黄是 #F4CC2A，对纯白文字对比度不达 WCAG AA。系统已规定黄上不放文字，但若设计师误用需有 lint 拦截。
- **声色失衡风险（tone-deafness）**：当内容是严肃话题（讣告类社论、医疗科普），红斜切横幅 + `NEW!` 贴纸 + 漫画头像会读成不尊重。**未来加内容 tone 检测，触发"严肃刊期"换肤**（红 → 灰、贴纸→ 无、横幅 → 不倾斜）。**P2**。
- **iPhone SE / 旧机型 393 以下宽度未适配**：hero 卡内的标题在 320px 宽度下可能挤压三行。需要在 WXSS 加 `@media (max-width: 350px)` 把 episode-title 从 26px 降到 22px。
- **截图分享气质未验证**：本系统假设用户会截图分享 hero 卡到朋友圈/小红书。需要做一次真实分享场景测试 — 微信压缩后红色会不会偏色、网点会不会断纹。
- **WeChat 暗黑模式（系统级）会强制反色**：用户系统开了 dark mode 后小程序底色被框架反成深色，红色不变 — 视觉会塌。需在 `app.json` 关闭 `darkmode` 或全局锁明色。

---

## 落地下一步（不是 design.md 的一部分，但接续）

1. 把 token 落到 `miniprogram/app.wxss` 的 CSS variables；
2. 切割现有 TDesign 组件 → 改写为本系统的 `episode-hero-card` / `list-row` / `tab-bar` / `cta-primary`；
3. 在 `app.js` 装 `wx.loadFontFace`；
4. 把 `screentone-dots-8.png` / `host-a.svg` / `host-b.svg` 切图存入 `miniprogram/images/manga/`；
5. 跑一次 iteration checklist 把 3 个主 tab 页验收过。
