# Manga Jump 字体部署 · 学伴

> 关联：[design.md](../design-systems/manga-jump-xueban/design.md#mini-program-落地适配) · [app.js](../miniprogram/app.js)

## 现状

`app.js` 在 `onLaunch` 里通过 `wx.loadFontFace` 全局加载两个字体（global: true → 三页一次性生效）：

| 绑定 family | 用途 | 源 (jsDelivr @fontsource v5) | 大小 |
|---|---|---|---|
| `Anton` | Latin 杂志 chrome — VOL/EP/Anton 编号 | `cdn.jsdelivr.net/npm/@fontsource/anton@5/files/anton-latin-400-normal.woff2` | **18 KB** |
| `MJ Heading` *(=Noto Sans SC 900)* | CJK 重头字 — 刊头、标题、drop-cap、eyebrow-cn | `cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5/files/noto-sans-sc-chinese-simplified-900-normal.woff2` | **1.07 MB** |

Anton 完美。MJ Heading **比 design.md 写的 150KB 上限大 7×**，是当前最大遗留 gap。

> **为什么不直接绑 `Noto Sans SC`**：`wx.loadFontFace` 把字体绑定到 family + weight 组合。一旦把 900 字体绑到 `Noto Sans SC`，所有 `font-family: 'Noto Sans SC'` 的元素无论指定 weight 400 / 700 / 900 都会显示成 900——正文全变粗。所以用专属 family 名 `'MJ Heading'` 隔离 900 字体，body 完全脱钩走系统 PingFang SC。

## 一步部署（必做 · 5 分钟）

**在小程序后台加白名单。**

1. 打开 [mp.weixin.qq.com](https://mp.weixin.qq.com) → 登录学伴小程序账号
2. 左侧菜单 → 开发管理 → 开发设置
3. 滚到「服务器域名」→ 修改 → **downloadFile 合法域名** 这一栏加：
   ```
   https://cdn.jsdelivr.net
   ```
4. 保存

完成后：
- 微信开发者工具里 重新编译，应能看到 console `[mj-font] Anton loaded` 与 `[mj-font] MJ Heading (Noto SC 900) loaded`
- 真机首次进入：1–2 秒系统兜底 → CDN 字体到位
- 第二次起：本地缓存秒开

> **没加白名单的症状**：console 报 `[mj-font] xxx fallback: url not in domain list`，刊头永远是系统 PingFang SC 渲染（Bold 不是 900，视觉偏淡）。

## 进阶：把 Noto Sans SC 压到 250KB（P2 · 可选）

`@fontsource` 的 chinese-simplified 子集 = 全部 7000 简体字，1 MB。学伴的"杂志型 chrome"实际只需要 GB2312 一级字库的 **~2300 高频字** + 标点 + 日文常用 ornament 字（連載 扉頁 撰稿 完 etc.），子集化后 ~250 KB。

### 子集化脚本（需 Python 3 + fonttools）

```bash
# 装依赖
pip install fonttools brotli zopfli

# 下载源字体（用 @fontsource 的 woff2 解开比较费劲，直接用 Google 官方）
curl -L -o noto-sans-sc-900.otf \
  'https://github.com/notofonts/noto-cjk/raw/main/Sans/SubsetOTF/SC/NotoSansSC-Black.otf'

# 准备字符表（GB2312 一级字库 + 学伴杂志术语）
cat > unicodes.txt <<'EOF'
U+0020-007E
U+00A0-00FF
U+2000-206F
U+3000-303F
U+4E00-4FFF
U+5000-5FFF
U+6000-67FF
U+6800-6FFF
U+7000-77FF
U+7800-7FFF
U+8000-87FF
U+8800-8FFF
U+9000-97FF
U+9800-9FFF
EOF

# 子集化（学伴杂志态额外常用字也并入）
pyftsubset noto-sans-sc-900.otf \
  --unicodes-file=unicodes.txt \
  --text='連載扉頁撰稿対談話刊期号號月年週週週週週週週日日日日已未脱稿' \
  --output-file=noto-sans-sc-900-xueban-subset.woff2 \
  --flavor=woff2 \
  --layout-features='*' \
  --no-hinting

# 检查大小
ls -lh noto-sans-sc-900-xueban-subset.woff2
# 期待：~250-300 KB
```

### 部署子集化字体（两条路）

#### 路径 A · 上传 CloudBase 云存储（学伴已有 env）

```bash
# 用项目里现成的 cloudbase MCP（或 tcb CLI）
tcb storage upload \
  noto-sans-sc-900-xueban-subset.woff2 \
  /fonts/noto-sans-sc-900-xueban-subset.woff2 \
  -e <old-env-id>
# 拿到一个 https://636c-... .tcb.qcloud.la/ 之类的 URL
```

把 URL 域名加进小程序后台白名单（同上 downloadFile）。改 `app.js` 里 `FONT_NOTO_SC_900` 常量指向这个 URL。

#### 路径 B · 上传自有 CDN

任意 CDN 都行，只要返回 `content-type: font/woff2` 且 CORS 允许小程序。把 host 加白名单，改 `app.js` URL。

### 验收

- 进入 submit 页：刊头 `STUDY MAG / 学習マガジン` 红斜切看起来字面"很拉伸感"（Anton 特征）
- 刊头下面 `NEW 新刊投稿 2026 · 編輯部` 三个声音并列：`NEW` 是 Anton 顶天立地、`新刊投稿` 是真 900 weight 黑底重墨、`2026` 是 Anton 副字
- 列表页 `EP.06` `EP.05` 这种编号是 Anton 红色斜体感
- 章节折叠的 `CH.01` 同上

## 不做子集化的代价

- **首次冷启动**：进入小程序前 1–2 秒，刊头/标题渲染走系统 PingFang SC Bold（不是 900），视觉偏淡。1–2 秒后切换到真 Noto SC 900，会有一次"重排闪烁"。
- **流量**：每个用户首次访问消耗 1.07 MB（CDN 命中后浏览器/小程序本地缓存 7 天）。
- **CloudBase 流量账单**：完全不动 — 字体走 jsDelivr。

## 字体许可

- **Anton** — SIL Open Font License 1.1，商用免费。Vernon Adams 设计。
- **Noto Sans SC** — SIL Open Font License 1.1，商用免费。Google + Adobe 联合发布。

无需在 app 内署名。

## 后续路径

| 任务 | 优先级 | 备注 |
|---|---|---|
| 加 jsDelivr 白名单 | **P0** | 必做，5 分钟 |
| 真机验证首屏体验 | **P0** | iPhone 14/15 一遍、X5 老 Android 一遍 |
| pyftsubset 子集化 | P2 | 1 MB → ~250KB；首屏抖动消失。等真机用户有抱怨再做。 |
| Noto Serif SC 阅读页正文加载 | P3 | design.md 里写"仅声明 family 不加载"。如果未来阅读页要保证字体一致，再加。 |
| dark mode / 夜场特别号 | P3 | design.md Known Gaps 里 |
