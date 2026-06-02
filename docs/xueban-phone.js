/* ════════════════════════════════════════════════════════════════════
   <xueban-phone> — 学伴 interactive miniprogram mock
   Recreates the real WeChat miniprogram (New / Archive / Me / Player)
   using the verbatim .mj-* Manga Jump component styles.
   Internal canvas is a 750px-wide coordinate system (rpx → px 1:1),
   auto-scaled to fit the host box. Plays the real podcast audio.
   Attributes:
     start = "new" | "archive" | "me" | "player"   (default "player")
   ════════════════════════════════════════════════════════════════════ */
(function () {
  const SCREENTONE = "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Ccircle cx='4' cy='4' r='1.2' fill='%230B0B0B' opacity='0.08'/%3E%3C/svg%3E\")";

  // Deterministic chunky waveform heights (looks like the mockup)
  const WAVE = [10,16,26,40,30,18,12,22,34,52,44,28,16,10,14,24,38,30,20,12,18,30,46,36,24,14,10,16,28,42,32,20,12,16,26,40,52,38,26,16,10,14,22,34,28,18,12,20,32,44,30,18];

  const TOKENS = `
    :host{ --mj-newsprint:#F4EFE3; --mj-paper:#FAF7EE; --mj-ink:#0B0B0B; --mj-ink-soft:#5A5448;
      --mj-red:#D8321F; --mj-yellow:#F4CC2A; --mj-rule:rgba(11,11,11,.18); --mj-rule-dashed-color:rgba(11,11,11,.30);
      --mj-shadow-ink:8px 8px 0 #0B0B0B; --mj-shadow-ink-sm:5px 5px 0 #0B0B0B;
      --mj-shadow-red:10px 10px 0 #D8321F; --mj-shadow-red-sm:6px 6px 0 #D8321F;
      --mj-border-frame:4px solid #0B0B0B; --mj-border-frame-heavy:5px solid #0B0B0B;
      --mj-page-x:32px;
      --mj-font-display:'Anton','Bebas Neue',sans-serif;
      --mj-font-headline:'Noto Sans SC','PingFang SC',sans-serif;
      --mj-font-body:'Noto Sans SC','PingFang SC',sans-serif;
      display:block; position:relative; width:100%; height:100%; }
  `;

  // Ported .mj-* component CSS (rpx values used directly as px in the 750-canvas)
  const COMPONENTS = `
    *{ box-sizing:border-box; -webkit-font-smoothing:antialiased; }
    .device{ position:absolute; top:0; left:0; transform-origin:top left;
      width:790px; height:1664px; background:#0B0B0B; border-radius:88px;
      padding:20px; box-shadow:0 40px 80px rgba(11,11,11,.34), 0 8px 24px rgba(11,11,11,.28); }
    .screen{ position:relative; width:750px; height:1624px; border-radius:64px; overflow:hidden;
      background-color:var(--mj-newsprint); background-image:${SCREENTONE}; background-repeat:repeat;
      background-size:16px 16px; color:var(--mj-ink); display:flex; flex-direction:column;
      font-family:var(--mj-font-body); }

    /* ── WeChat chrome ── */
    .statusbar{ height:96px; flex-shrink:0; display:flex; align-items:flex-end; justify-content:space-between;
      padding:0 52px 12px; position:relative; }
    .statusbar__time{ font-family:var(--mj-font-body); font-weight:700; font-size:30px; color:var(--mj-ink); letter-spacing:.01em; }
    .island{ position:absolute; top:22px; left:50%; transform:translateX(-50%); width:248px; height:64px; background:#0B0B0B; border-radius:34px; }
    .statusbar__sys{ display:flex; align-items:center; gap:12px; }
    .bars{ display:flex; align-items:flex-end; gap:3px; height:24px; }
    .bars i{ width:5px; background:var(--mj-ink); border-radius:1px; }
    .bars i:nth-child(1){height:9px} .bars i:nth-child(2){height:14px} .bars i:nth-child(3){height:19px} .bars i:nth-child(4){height:24px}
    .wifi{ width:30px; height:22px; }
    .batt{ width:52px; height:26px; border:3px solid var(--mj-ink); border-radius:6px; position:relative; padding:3px; }
    .batt::after{ content:''; position:absolute; right:-7px; top:7px; width:4px; height:10px; background:var(--mj-ink); border-radius:0 2px 2px 0; }
    .batt i{ display:block; height:100%; width:78%; background:var(--mj-ink); border-radius:2px; }

    .navbar{ height:88px; flex-shrink:0; display:flex; align-items:center; justify-content:center; position:relative; padding:0 28px; }
    .navbar__title{ font-family:var(--mj-font-body); font-weight:500; font-size:30px; color:var(--mj-ink); letter-spacing:.02em; }
    .navbar__back{ position:absolute; left:28px; top:50%; transform:translateY(-50%); width:40px; height:40px; cursor:pointer; }
    .navbar__back svg{ width:100%; height:100%; }
    .capsule{ position:absolute; right:28px; top:50%; transform:translateY(-50%); width:174px; height:64px;
      background:#fff; border:1px solid rgba(11,11,11,.10); border-radius:34px; display:flex; align-items:center; }
    .capsule__half{ flex:1; display:flex; align-items:center; justify-content:center; }
    .capsule__half:first-child{ border-right:1px solid rgba(11,11,11,.12); }
    .capsule__dots{ display:flex; gap:8px; }
    .capsule__dots i{ width:9px; height:9px; border-radius:50%; background:#0B0B0B; }
    .capsule__o{ width:34px; height:34px; border:3.5px solid #0B0B0B; border-radius:50%; position:relative; }
    .capsule__o::after{ content:''; position:absolute; inset:6px; border-radius:50%; background:#0B0B0B; }

    /* ── scrolling viewport ── */
    .viewport{ flex:1; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; }
    .viewport::-webkit-scrollbar{ width:0; }
    .screen-body{ padding:8px var(--mj-page-x) 60px; }

    /* ── masthead ── */
    .mj-masthead{ padding:16px 0 12px; }
    .mj-masthead__row{ display:flex; align-items:baseline; gap:20px; }
    .mj-masthead__rule{ height:5px; background:var(--mj-ink); margin:14px 0 16px; }
    .mj-tagline{ font-family:var(--mj-font-body); font-size:22px; color:var(--mj-ink-soft); margin-top:6px; letter-spacing:.02em; }
    .mj-banner-skew{ display:inline-block; background:var(--mj-red); transform:skewX(-8deg); padding:8px 22px; box-shadow:var(--mj-shadow-ink-sm); }
    .mj-banner-skew__text{ display:inline-block; transform:skewX(8deg); font-family:var(--mj-font-display); font-size:22px; color:var(--mj-paper); letter-spacing:.18em; }

    .mj-vol{ font-family:var(--mj-font-display); font-size:84px; line-height:.85; letter-spacing:-2px; color:var(--mj-ink); }
    .mj-vol-cn{ font-family:var(--mj-font-headline); font-weight:900; font-size:42px; color:var(--mj-ink); }
    .mj-vol-issue{ font-family:var(--mj-font-display); font-size:22px; color:var(--mj-ink-soft); letter-spacing:.14em; margin-left:auto; }

    .mj-eyebrow{ font-family:var(--mj-font-display); font-size:22px; letter-spacing:.16em; color:var(--mj-ink-soft); text-transform:uppercase; }
    .mj-eyebrow-cn{ font-family:var(--mj-font-headline); font-weight:900; font-size:34px; color:var(--mj-ink); letter-spacing:.02em; }
    .mj-eyebrow-row{ display:flex; align-items:baseline; gap:18px; margin:36px 0 20px; }
    .mj-eyebrow-row .mj-eyebrow-rule{ flex:1; height:4px; background:var(--mj-ink); }

    .mj-headline{ font-family:var(--mj-font-headline); font-weight:900; font-size:46px; line-height:1.2; color:var(--mj-ink); letter-spacing:.005em; }
    .mj-body{ font-family:var(--mj-font-body); font-size:27px; line-height:1.8; color:var(--mj-ink); }
    .mj-body-heavy{ font-family:var(--mj-font-body); font-weight:700; font-size:26px; line-height:1.4; color:var(--mj-ink); }
    .mj-callsign{ font-family:var(--mj-font-display); font-size:28px; letter-spacing:.08em; color:var(--mj-ink); cursor:pointer; }
    .mj-callsign--soft{ color:var(--mj-ink-soft); font-size:22px; cursor:default; }
    .mj-time{ font-family:var(--mj-font-display); font-size:24px; letter-spacing:.08em; color:var(--mj-ink); }
    .mj-drop-cap{ font-family:var(--mj-font-headline); font-weight:900; font-size:128px; color:var(--mj-red); line-height:.85; float:left; margin-right:16px; margin-top:8px; }

    .mj-card{ background:var(--mj-paper); border:var(--mj-border-frame); box-shadow:var(--mj-shadow-ink-sm); padding:32px; margin-bottom:48px; }
    .mj-card--hero{ border:var(--mj-border-frame-heavy); box-shadow:var(--mj-shadow-red); padding:28px 28px 32px; }
    .mj-card--solid{ background:var(--mj-paper); border:var(--mj-border-frame); box-shadow:var(--mj-shadow-ink); }

    .mj-sticker{ display:inline-block; background:var(--mj-yellow); border:3px solid var(--mj-ink); padding:4px 18px;
      font-family:var(--mj-font-display); font-size:22px; letter-spacing:.12em; color:var(--mj-ink); box-shadow:var(--mj-shadow-ink-sm); }
    .mj-sticker--rotate-pos{ transform:rotate(6deg); }
    .mj-sticker--rotate-neg{ transform:rotate(-3deg); }

    .mj-cta-primary{ display:flex; align-items:center; justify-content:center; width:100%; background:var(--mj-ink);
      border:var(--mj-border-frame-heavy); box-shadow:var(--mj-shadow-ink); padding:28px 32px; color:var(--mj-paper);
      font-family:var(--mj-font-body); font-weight:900; font-size:32px; letter-spacing:.2em; cursor:pointer;
      transition:transform .08s, box-shadow .08s; }
    .mj-cta-primary:active{ transform:translate(3px,3px); box-shadow:5px 5px 0 var(--mj-ink); }
    .mj-cta-primary--disabled{ background:var(--mj-ink-soft); box-shadow:5px 5px 0 var(--mj-ink-soft); opacity:.5; }
    .mj-cta-secondary{ display:flex; align-items:center; justify-content:center; width:100%; background:var(--mj-paper);
      border:var(--mj-border-frame); box-shadow:var(--mj-shadow-ink-sm); padding:22px 28px; color:var(--mj-ink);
      font-family:var(--mj-font-body); font-weight:700; font-size:28px; letter-spacing:.08em; cursor:pointer; }

    .mj-host-face{ display:inline-block; width:56px; height:56px; filter:drop-shadow(2px 2px 0 var(--mj-ink)); flex-shrink:0; }
    .mj-host-face--sm{ width:44px; height:44px; }
    .mj-host-chip{ display:inline-flex; align-items:center; gap:12px; background:var(--mj-paper); border:3px solid var(--mj-ink);
      box-shadow:var(--mj-shadow-ink-sm); padding:8px 20px 8px 12px; }
    .mj-host-chip__name{ font-family:var(--mj-font-headline); font-weight:900; font-size:22px; color:var(--mj-ink); letter-spacing:.02em; margin-left:4px; }

    .mj-waveform{ display:flex; align-items:flex-end; gap:4px; height:64px; }
    .mj-waveform--lg{ height:88px; }
    .mj-waveform__bar{ width:6px; background:rgba(11,11,11,.18); flex-shrink:0; transition:background .08s; }
    .mj-waveform__bar--played{ background:var(--mj-ink); }

    .mj-meta-row{ display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:32px; }
    .mj-time-row{ display:flex; align-items:center; justify-content:space-between; margin-top:18px; }

    .mj-keypoint{ display:flex; align-items:flex-start; gap:24px; margin-top:28px; }
    .mj-keypoint:first-child{ margin-top:0; }
    .mj-keypoint__num{ width:64px; height:64px; flex-shrink:0; background:var(--mj-ink); border:var(--mj-border-frame);
      box-shadow:var(--mj-shadow-ink-sm); display:flex; align-items:center; justify-content:center;
      font-family:var(--mj-font-display); font-size:32px; color:var(--mj-paper); letter-spacing:.04em; }
    .mj-keypoint__text{ flex:1; font-family:var(--mj-font-body); font-weight:500; font-size:27px; line-height:1.7; color:var(--mj-ink); padding-top:4px; }
    .mj-highlight{ background:var(--mj-yellow); padding:0 2px; }

    .mj-list-row{ display:flex; align-items:center; gap:20px; padding:22px 28px; border-top:3px dashed var(--mj-rule-dashed-color); cursor:pointer; transition:background .1s; }
    .mj-list-row:first-child{ border-top:none; }
    .mj-list-row:active{ background:rgba(216,50,31,.06); }
    .mj-list-row__num{ font-family:var(--mj-font-display); font-size:30px; color:var(--mj-red); letter-spacing:.06em; width:96px; flex-shrink:0; }
    .mj-list-row__title{ flex:1; font-family:var(--mj-font-body); font-weight:700; font-size:26px; color:var(--mj-ink); line-height:1.4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
    .mj-tag{ display:inline-flex; align-items:center; font-family:var(--mj-font-display); font-size:20px; letter-spacing:.14em; padding:3px 14px; border:2px solid var(--mj-ink); box-shadow:3px 3px 0 var(--mj-ink); flex-shrink:0; }
    .mj-tag--done{ background:var(--mj-yellow); transform:rotate(-3deg); }
    .mj-tag--processing{ background:var(--mj-red); color:var(--mj-paper); transform:rotate(2deg); }
    .mj-tag--pending{ background:var(--mj-paper); color:var(--mj-ink-soft); }

    .mj-fin-divider{ display:flex; align-items:center; justify-content:center; gap:24px; margin:56px 0 16px; }
    .mj-fin-divider__rule{ flex:1; height:2px; background:var(--mj-rule); }
    .mj-disclaimer{ font-family:var(--mj-font-display); font-size:20px; color:var(--mj-ink-soft); letter-spacing:.20em; text-align:center; margin-top:16px; }

    .mj-on-air{ display:flex; align-items:center; font-family:var(--mj-font-display); font-size:20px; color:var(--mj-red); letter-spacing:.22em; }
    .mj-dot-live{ display:inline-block; width:14px; height:14px; background:var(--mj-red); margin-right:12px; animation:mj-pulse 1.6s ease-in-out infinite; }
    @keyframes mj-pulse{ 0%,100%{opacity:1} 50%{opacity:.35} }
    .mj-card-hero__topbar{ display:flex; align-items:center; justify-content:space-between; }

    /* scrub slider */
    .mj-scrub{ -webkit-appearance:none; appearance:none; width:100%; height:6px; background:linear-gradient(var(--mj-ink),var(--mj-ink)) no-repeat, #5A5448; background-size:0% 100%; margin:22px 0 4px; cursor:pointer; }
    .mj-scrub::-webkit-slider-thumb{ -webkit-appearance:none; width:28px; height:28px; border-radius:50%; background:var(--mj-red); border:0; cursor:pointer; }
    .mj-scrub::-moz-range-thumb{ width:28px; height:28px; border-radius:50%; background:var(--mj-red); border:0; }

    .mj-player-controls{ display:flex; align-items:center; justify-content:center; gap:56px; margin-top:24px; }
    .mj-player-ctrl{ display:flex; flex-direction:column; align-items:center; gap:8px; cursor:pointer; }
    .mj-player-ctrl__btn{ width:88px; height:88px; background:var(--mj-paper); border:var(--mj-border-frame); box-shadow:var(--mj-shadow-ink-sm); display:flex; align-items:center; justify-content:center; transition:transform .08s, box-shadow .08s; }
    .mj-player-ctrl:active .mj-player-ctrl__btn{ transform:translate(2px,2px); box-shadow:3px 3px 0 var(--mj-ink); }
    .mj-player-ctrl__btn--play{ width:128px; height:128px; background:var(--mj-ink); box-shadow:8px 8px 0 var(--mj-red); }
    .mj-player-ctrl:active .mj-player-ctrl__btn--play{ box-shadow:4px 4px 0 var(--mj-red); }
    .mj-player-ctrl__icon{ width:44px; height:44px; }
    .mj-player-ctrl__icon--play{ width:48px; height:52px; }
    .mj-player-ctrl__label{ font-family:var(--mj-font-display); font-size:20px; color:var(--mj-ink-soft); letter-spacing:.12em; }
    .mj-player-ctrl__label--main{ color:var(--mj-ink); letter-spacing:.14em; }
    .mj-mini-top{ display:flex; align-items:baseline; justify-content:space-between; padding-top:8px; }

    /* mode tabs (new page) */
    .mj-mode-tabs{ display:flex; gap:16px; margin:32px 0 20px; }
    .mj-mode-tab{ flex:1; background:var(--mj-paper); border:var(--mj-border-frame); padding:20px 0; text-align:center;
      font-family:var(--mj-font-body); font-weight:700; font-size:26px; color:var(--mj-ink); box-shadow:var(--mj-shadow-ink-sm); letter-spacing:.04em; cursor:pointer; }
    .mj-mode-tab--active{ background:var(--mj-ink); color:var(--mj-paper); transform:translate(-2px,-2px); box-shadow:6px 6px 0 var(--mj-red); }
    .mj-textarea{ width:100%; background:var(--mj-paper); border:var(--mj-border-frame); box-shadow:var(--mj-shadow-ink-sm); padding:24px;
      font-family:var(--mj-font-body); font-size:28px; line-height:1.7; color:var(--mj-ink-soft); min-height:240px; }
    .mj-footnote{ font-family:var(--mj-font-body); font-size:22px; color:var(--mj-ink-soft); line-height:1.6; margin-top:16px; }

    /* profile */
    .prof-input{ width:100%; height:80px; line-height:80px; background:var(--mj-paper); border:4px solid var(--mj-ink); box-shadow:var(--mj-shadow-ink-sm); padding:0 24px; font-family:var(--mj-font-body); font-size:28px; color:var(--mj-ink); margin-bottom:12px; }
    .prof-stickers{ display:flex; flex-wrap:wrap; gap:12px; margin-bottom:12px; }
    .prof-sticker{ display:inline-block; background:var(--mj-paper); border:3px solid var(--mj-ink); box-shadow:var(--mj-shadow-ink-sm); padding:8px 18px; font-family:var(--mj-font-body); font-weight:700; font-size:24px; color:var(--mj-ink); letter-spacing:.02em; cursor:pointer; }
    .prof-sticker--on{ background:var(--mj-yellow); transform:translate(-1px,-1px) rotate(-2deg); box-shadow:4px 4px 0 var(--mj-ink); }
    .prof-sticker--add{ background:var(--mj-newsprint); border-style:dashed; color:var(--mj-ink-soft); box-shadow:none; }
    .prof-density{ margin-bottom:12px; padding:4px 8px 0; }
    .prof-density__track{ position:relative; height:10px; background:#5A5448; margin:24px 8px 0; }
    .prof-density__fill{ position:absolute; left:0; top:0; height:100%; width:50%; background:var(--mj-ink); }
    .prof-density__knob{ position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:34px; height:34px; border-radius:50%; background:var(--mj-red); }
    .prof-density__labels{ display:flex; justify-content:space-between; margin-top:18px; padding:0 4px; }
    .prof-density__lab{ font-family:var(--mj-font-display); font-size:20px; letter-spacing:.1em; color:var(--mj-ink-soft); }
    .prof-density__lab--on{ color:var(--mj-red); font-weight:700; }

    /* tab bar */
    .mj-tabbar{ flex-shrink:0; padding:12px 32px 30px; background:#FAF7EE; border-top:4px solid #0B0B0B; display:flex; align-items:flex-start; justify-content:space-around; }
    .mj-tabbar__item{ display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; cursor:pointer; }
    .mj-tabbar__block{ width:84px; height:84px; background:#FAF7EE; border:4px solid #0B0B0B; box-shadow:5px 5px 0 #0B0B0B; display:flex; align-items:center; justify-content:center; transition:transform .08s, box-shadow .08s; }
    .mj-tabbar__icon{ width:48px; height:48px; }
    .mj-tabbar__label-cn{ font-family:var(--mj-font-headline); font-weight:700; font-size:20px; color:#5A5448; letter-spacing:.04em; margin-top:4px; line-height:1.15; }
    .mj-tabbar__label-en{ font-family:var(--mj-font-display); font-size:15px; color:#5A5448; letter-spacing:.16em; line-height:1; }
    .mj-tabbar__item--active .mj-tabbar__block{ background:#D8321F; box-shadow:5px 5px 0 #D8321F; transform:translate(-2px,-2px); }
    .mj-tabbar__item--active .mj-tabbar__label-cn{ color:#0B0B0B; font-weight:900; }
    .mj-tabbar__item--active .mj-tabbar__label-en{ color:#D8321F; }
    .home-indicator{ position:absolute; bottom:14px; left:50%; transform:translateX(-50%); width:200px; height:8px; border-radius:4px; background:rgba(11,11,11,.5); z-index:50; pointer-events:none; }
  `;

  const ICON = {
    play: 'assets/icon-play.svg', pause: 'assets/icon-pause.svg',
    back15: 'assets/icon-seek-back.svg', fwd30: 'assets/icon-seek-fwd.svg',
    hostA: 'assets/host-a.svg', hostB: 'assets/host-b.svg',
    link: 'assets/icon-link.svg',
    tabNew: 'assets/icon-tab-new.svg', tabNewA: 'assets/icon-tab-new-active.svg',
    tabList: 'assets/icon-tab-list.svg', tabListA: 'assets/icon-tab-list-active.svg',
    tabMe: 'assets/icon-tab-me.svg', tabMeA: 'assets/icon-tab-me-active.svg',
  };

  function wavebars(extraClassFn) {
    return WAVE.map((h, i) => `<div class="mj-waveform__bar" data-i="${i}" style="height:${h}px"></div>`).join('');
  }

  function tabbar(active) {
    // active: 'new' | 'archive' | 'me'   (player => no tabbar, handled by caller)
    const t = (key, cn, en, icon, iconA) => {
      const on = active === key;
      return `<div class="mj-tabbar__item ${on ? 'mj-tabbar__item--active' : ''}" data-nav="${key}">
        <div class="mj-tabbar__block"><img class="mj-tabbar__icon" src="${on ? iconA : icon}"></div>
        <div class="mj-tabbar__label-cn">${cn}</div><div class="mj-tabbar__label-en">${en}</div></div>`;
    };
    return `<div class="mj-tabbar">
      ${t('new','新建','NEW',ICON.tabNew,ICON.tabNewA)}
      ${t('archive','档案','ARCHIVE',ICON.tabList,ICON.tabListA)}
      ${t('me','我的','ME',ICON.tabMe,ICON.tabMeA)}
    </div>`;
  }

  // ── Screen bodies ──────────────────────────────────────────────
  const SCREENS = {
    new: () => `<div class="screen-body">
      <div class="mj-masthead">
        <div class="mj-banner-skew"><div class="mj-banner-skew__text">STUDY MAG · 学習マガジン</div></div>
        <div class="mj-masthead__rule"></div>
        <div class="mj-masthead__row"><span class="mj-vol">NEW</span><span class="mj-vol-cn">把碎片，变成播客</span></div>
        <div class="mj-tagline">把一篇好文 · 做成你的双人播客 · 锁屏可听</div>
      </div>
      <div class="mj-eyebrow-row" style="margin-top:20px;"><span class="mj-eyebrow-cn">投稿方式</span><span class="mj-eyebrow">/ INPUT MODE</span><span class="mj-eyebrow-rule"></span></div>
      <div class="mj-mode-tabs">
        <div class="mj-mode-tab" data-mode="text">文字 / TXT</div>
        <div class="mj-mode-tab" data-mode="image">图片 / IMG</div>
        <div class="mj-mode-tab mj-mode-tab--active" data-mode="link">链接 / URL</div>
      </div>
      <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
        <img src="${ICON.link}" style="width:48px;height:48px;"><span class="mj-body-heavy">小红书 / 公众号链接</span>
      </div>
      <div class="mj-textarea">例：http://xhslink.com/xxx 或 https://mp.weixin.qq.com/s/xxx</div>
      <div class="mj-footnote">小红书仅支持图文笔记 · 公众号支持图文文章 · 视频暂不支持</div>
      <div class="mj-cta-primary" data-submit style="margin-top:56px;">▮ 开始生成播客 ▮</div>
      <div class="mj-disclaimer" style="margin-top:32px;">BY AI · 仅供学习参考 · FOR STUDY ONLY</div>
    </div>`,

    archive: () => `<div class="screen-body">
      <div class="mj-masthead">
        <div class="mj-banner-skew"><div class="mj-banner-skew__text">STUDY MAG · 学習マガジン</div></div>
        <div class="mj-masthead__rule"></div>
        <div class="mj-masthead__row"><span class="mj-vol">VOL.23</span><span class="mj-vol-cn">六月号</span><span class="mj-vol-issue">共 154 期</span></div>
        <div class="mj-tagline">攒进来的，都被自动整理 · 找得回来</div>
      </div>
      <div class="mj-eyebrow-row" style="margin-top:16px;"><span class="mj-eyebrow-cn">已刊</span><span class="mj-eyebrow">/ ISSUED · 本周 05</span><span class="mj-eyebrow-rule"></span></div>
      <div class="mj-card mj-card--solid" style="padding:0;">
        <div class="mj-list-row" data-open><span class="mj-list-row__num">EP.07</span><span class="mj-list-row__title">AI 驱动的第二大脑实践指南</span><span class="mj-tag mj-tag--done">已刊</span></div>
        <div class="mj-list-row" data-open><span class="mj-list-row__num">EP.06</span><span class="mj-list-row__title">为什么大公司做不出好产品</span><span class="mj-tag mj-tag--done">已刊</span></div>
        <div class="mj-list-row" data-open><span class="mj-list-row__num">EP.05</span><span class="mj-list-row__title">AI 时代的写作还值得练吗</span><span class="mj-tag mj-tag--done">已刊</span></div>
        <div class="mj-list-row" data-open><span class="mj-list-row__num">EP.04</span><span class="mj-list-row__title">注意力是这个时代最贵的货币</span><span class="mj-tag mj-tag--processing">撰稿中</span></div>
        <div class="mj-list-row" data-open><span class="mj-list-row__num">EP.03</span><span class="mj-list-row__title">行为经济学里的五个反直觉</span><span class="mj-tag mj-tag--done">已刊</span></div>
      </div>
      <div class="mj-fin-divider"><span class="mj-fin-divider__rule"></span><span class="mj-sticker mj-sticker--rotate-neg">END / 完</span><span class="mj-fin-divider__rule"></span></div>
      <div class="mj-disclaimer">下拉刷新 · 长按撤刊 · PULL / LONG-PRESS</div>
    </div>`,

    me: () => `<div class="screen-body">
      <div class="mj-masthead">
        <div class="mj-banner-skew"><div class="mj-banner-skew__text">STUDY MAG · 学習マガジン</div></div>
        <div class="mj-masthead__rule"></div>
        <div class="mj-masthead__row"><span class="mj-vol">ME</span><span class="mj-vol-cn">约稿单 · 我的杂志</span></div>
        <div class="mj-tagline">填完这份单子 · 听到的播客会更像写给你的</div>
      </div>
      <div class="mj-eyebrow-row"><span class="mj-eyebrow-cn">身份</span><span class="mj-eyebrow">/ IDENTITY</span></div>
      <div class="prof-input">设计师</div>
      <div class="mj-eyebrow-row"><span class="mj-eyebrow-cn">信息密度</span><span class="mj-eyebrow">/ DENSITY</span></div>
      <div class="prof-density">
        <div class="prof-density__track"><div class="prof-density__fill"></div><div class="prof-density__knob"></div></div>
        <div class="prof-density__labels"><span class="prof-density__lab">轻 / LIGHT</span><span class="prof-density__lab prof-density__lab--on">中 / MED</span><span class="prof-density__lab">密 / DENSE</span></div>
      </div>
      <div class="mj-eyebrow-row"><span class="mj-eyebrow-cn">对谈偏好</span><span class="mj-eyebrow">/ TONE · 多选</span></div>
      <div class="prof-stickers">
        <span class="prof-sticker" data-toggle>严肃学术</span><span class="prof-sticker" data-toggle>轻松日常</span>
        <span class="prof-sticker prof-sticker--on" data-toggle>反共识犀利</span><span class="prof-sticker" data-toggle>工具方法论</span>
        <span class="prof-sticker" data-toggle>故事化讲述</span><span class="prof-sticker prof-sticker--on" data-toggle>速度快</span><span class="prof-sticker" data-toggle>慢节奏</span>
      </div>
      <div class="mj-eyebrow-row"><span class="mj-eyebrow-cn">关注领域</span><span class="mj-eyebrow">/ TOPICS · 多选</span></div>
      <div class="prof-stickers">
        <span class="prof-sticker" data-toggle>#AI</span><span class="prof-sticker prof-sticker--on" data-toggle>#商业</span>
        <span class="prof-sticker" data-toggle>#心理学</span><span class="prof-sticker" data-toggle>#设计</span>
        <span class="prof-sticker prof-sticker--on" data-toggle>#编程</span><span class="prof-sticker" data-toggle>#哲学</span>
        <span class="prof-sticker" data-toggle>#行为经济学</span><span class="prof-sticker" data-toggle>#历史</span>
        <span class="prof-sticker" data-toggle>#科学</span><span class="prof-sticker" data-toggle>#文学</span>
        <span class="prof-sticker prof-sticker--add">＋ 自定义</span>
      </div>
      <div class="mj-cta-primary" style="margin-top:36px;">▮ 存档 / SAVE ▮</div>
      <div class="mj-fin-divider"><span class="mj-fin-divider__rule"></span><span class="mj-sticker mj-sticker--rotate-neg">FIN. / 完</span><span class="mj-fin-divider__rule"></span></div>
      <div class="mj-disclaimer">BY AI · 仅供学习参考 · FOR STUDY ONLY</div>
    </div>`,

    player: () => `<div class="screen-body">
      <div class="mj-mini-top"><span class="mj-callsign" data-nav="archive">← BACK</span><span class="mj-callsign mj-callsign--soft">STUDY MAG · 2026·06·02</span></div>
      <div style="padding-top:24px;">
        <div class="mj-banner-skew" style="margin-bottom:24px;"><div class="mj-banner-skew__text">今日連載 · TODAY</div></div>
        <div><span class="mj-drop-cap">A</span><span class="mj-headline">I 驱动的第二大脑实践指南</span></div>
        <div style="clear:both;height:8px;"></div>
        <div class="mj-eyebrow-row" style="margin-top:32px;"><span class="mj-eyebrow">导读 / LEDE</span><span class="mj-eyebrow-rule"></span></div>
        <div class="mj-body">本文解析<span class="mj-highlight">第二大脑</span>的范式转变，讲解<span class="mj-highlight">人 AI 分工</span>的具体落地逻辑，揭示<span class="mj-highlight">知识复利</span>如何在 AI 辅助下真正落地，帮你跳出传统笔记"收藏即吃灰"的困境。</div>
        <div class="mj-meta-row">
          <div class="mj-host-chip"><img class="mj-host-face mj-host-face--sm" src="${ICON.hostA}"><img class="mj-host-face mj-host-face--sm" src="${ICON.hostB}"><span class="mj-host-chip__name">小诺 · 阿明</span></div>
          <div class="mj-sticker mj-sticker--rotate-neg">3 MIN.</div>
        </div>
      </div>
      <div class="mj-card mj-card--hero" style="margin-top:48px;">
        <div class="mj-card-hero__topbar"><div class="mj-on-air"><span class="mj-dot-live"></span>ON AIR · EP</div><span class="mj-callsign mj-callsign--soft">2026·06·02</span></div>
        <div class="mj-waveform mj-waveform--lg" style="margin-top:18px;" data-wave>${wavebars()}</div>
        <div class="mj-time-row"><span class="mj-time" data-cur>00:00</span><span class="mj-time" style="color:var(--mj-ink-soft);" data-dur>03:05</span></div>
        <input type="range" class="mj-scrub" min="0" max="1000" value="0" data-scrub>
        <div class="mj-player-controls">
          <div class="mj-player-ctrl" data-seek="-15"><div class="mj-player-ctrl__btn"><img class="mj-player-ctrl__icon" src="${ICON.back15}"></div><div class="mj-player-ctrl__label">−15s</div></div>
          <div class="mj-player-ctrl" data-toggle-play><div class="mj-player-ctrl__btn mj-player-ctrl__btn--play"><img class="mj-player-ctrl__icon mj-player-ctrl__icon--play" src="${ICON.play}" data-playicon></div><div class="mj-player-ctrl__label mj-player-ctrl__label--main" data-playlabel>PLAY</div></div>
          <div class="mj-player-ctrl" data-seek="30"><div class="mj-player-ctrl__btn"><img class="mj-player-ctrl__icon" src="${ICON.fwd30}"></div><div class="mj-player-ctrl__label">+30s</div></div>
        </div>
      </div>
      <div style="margin-top:64px;">
        <div class="mj-eyebrow-row"><span class="mj-eyebrow-cn">核心观点</span><span class="mj-eyebrow">/ KEY POINTS · 全 04</span><span class="mj-eyebrow-rule"></span></div>
        <div class="mj-keypoint"><div class="mj-keypoint__num">01</div><div class="mj-keypoint__text">第二大脑的核心是让 AI 承担知识整理工作，而非让人手动维护。</div></div>
        <div class="mj-keypoint"><div class="mj-keypoint__num">02</div><div class="mj-keypoint__text">"收藏即吃灰"的根因不是记性差，而是信息流量超过了人工整理的速度。</div></div>
        <div class="mj-keypoint"><div class="mj-keypoint__num">03</div><div class="mj-keypoint__text">把记忆与检索外包出去，大脑才能腾出来做真正的思考和创造。</div></div>
        <div class="mj-keypoint"><div class="mj-keypoint__num">04</div><div class="mj-keypoint__text">知识复利来自反复调用，而不是一次性收藏；可听化大幅提高复用率。</div></div>
      </div>
      <div class="mj-fin-divider"><span class="mj-fin-divider__rule"></span><span class="mj-sticker mj-sticker--rotate-neg">FIN. / 完</span><span class="mj-fin-divider__rule"></span></div>
      <div class="mj-disclaimer">BY AI · 仅供学习参考 · FOR STUDY ONLY</div>
    </div>`,
  };

  const TITLES = { new:'学伴 · 新建', archive:'学伴 · 档案', me:'学伴 · 我的', player:'学伴 · 学習マガジン' };

  class XuebanPhone extends HTMLElement {
    connectedCallback() {
      if (this._mounted) return; this._mounted = true;
      this.root = this.attachShadow({ mode: 'open' });
      this.current = this.getAttribute('start') || 'player';
      this.root.innerHTML = `<style>${TOKENS}${COMPONENTS}</style>
        <div class="device"><div class="screen">
          <div class="statusbar">
            <span class="statusbar__time">12:02</span><div class="island"></div>
            <div class="statusbar__sys">
              <div class="bars"><i></i><i></i><i></i><i></i></div>
              <svg class="wifi" viewBox="0 0 30 22"><path d="M15 5C9 5 4 8 1 12l3 3c3-3 6-5 11-5s8 2 11 5l3-3C26 8 21 5 15 5z" fill="#0B0B0B" opacity=".35"/><path d="M15 12c-3 0-5 1-7 3l7 7 7-7c-2-2-4-3-7-3z" fill="#0B0B0B"/></svg>
              <div class="batt"><i></i></div>
            </div>
          </div>
          <div class="navbar">
            <div class="navbar__back" data-nav="archive" style="display:none"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="#0B0B0B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <span class="navbar__title"></span>
            <div class="capsule"><div class="capsule__half"><div class="capsule__dots"><i></i><i></i><i></i></div></div><div class="capsule__half"><div class="capsule__o"></div></div></div>
          </div>
          <div class="viewport"></div>
          <div class="home-indicator"></div>
        </div></div>`;

      this.device = this.root.querySelector('.device');
      this.screenEl = this.root.querySelector('.screen');
      this.viewport = this.root.querySelector('.viewport');
      this.titleEl = this.root.querySelector('.navbar__title');
      this.backBtn = this.root.querySelector('.navbar__back');

      // single shared audio element
      this.audio = new Audio('assets/podcast.mp3');
      this.audio.preload = 'metadata';
      this.playing = false;

      this.render();
      this.fit();
      this._ro = new ResizeObserver(() => this.fit());
      this._ro.observe(this);
      window.addEventListener('resize', this._onResize = () => this.fit());
    }
    disconnectedCallback() {
      if (this._ro) this._ro.disconnect();
      window.removeEventListener('resize', this._onResize);
      if (this.audio) { this.audio.pause(); }
    }

    fit() {
      const w = this.clientWidth, h = this.clientHeight;
      if (!w || !h) return;
      const devW = 790, devH = 1664;
      const scale = Math.min(w / devW, h / devH);
      const left = (w - devW * scale) / 2;
      const top = (h - devH * scale) / 2;
      this.device.style.transform = `translate(${left}px,${top}px) scale(${scale})`;
    }

    go(screen) {
      if (screen === this.current) return;
      if (this.current === 'player') this.pauseAudio();
      this.current = screen;
      this.render();
    }

    render() {
      const s = this.current;
      this.titleEl.textContent = TITLES[s];
      this.backBtn.style.display = s === 'player' ? 'flex' : 'none';
      const showTab = s !== 'player';
      this.viewport.innerHTML = SCREENS[s]() + (showTab ? '' : '');
      // tabbar lives as a sibling of viewport inside screen (fixed bottom feel)
      const oldTab = this.screenEl.querySelector('.mj-tabbar');
      if (oldTab) oldTab.remove();
      if (showTab) {
        const wrap = document.createElement('div');
        wrap.innerHTML = tabbar(s);
        const tb = wrap.firstElementChild;
        this.screenEl.insertBefore(tb, this.root.querySelector('.home-indicator'));
        tb.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', () => this.go(el.dataset.nav)));
      }
      this.viewport.scrollTop = 0;
      this.bind();
      if (s === 'player') this.initPlayer();
    }

    bind() {
      this.root.querySelectorAll('[data-nav]').forEach(el => {
        if (el.closest('.mj-tabbar')) return;
        el.addEventListener('click', () => this.go(el.dataset.nav));
      });
      this.backBtn.onclick = () => this.go('archive');
      const submit = this.viewport.querySelector('[data-submit]');
      if (submit) submit.addEventListener('click', () => this.go('player'));
      this.viewport.querySelectorAll('[data-open]').forEach(el => el.addEventListener('click', () => this.go('player')));
      this.viewport.querySelectorAll('[data-toggle]').forEach(el => el.addEventListener('click', () => el.classList.toggle('prof-sticker--on') || el.classList.toggle('mj-mode-tab--active')));
      this.viewport.querySelectorAll('.mj-mode-tab').forEach(el => el.addEventListener('click', () => {
        this.viewport.querySelectorAll('.mj-mode-tab').forEach(t => t.classList.remove('mj-mode-tab--active'));
        el.classList.add('mj-mode-tab--active');
      }));
    }

    initPlayer() {
      const bars = [...this.viewport.querySelectorAll('.mj-waveform__bar')];
      const curEl = this.viewport.querySelector('[data-cur]');
      const durEl = this.viewport.querySelector('[data-dur]');
      const scrub = this.viewport.querySelector('[data-scrub]');
      const playIcon = this.viewport.querySelector('[data-playicon]');
      const playLabel = this.viewport.querySelector('[data-playlabel]');
      const a = this.audio;
      const fmt = (t) => { if (!isFinite(t)) t = 0; const m = Math.floor(t/60), s = Math.floor(t%60); return `${m}:${String(s).padStart(2,'0')}`; };
      const paint = () => {
        const dur = a.duration || 185;
        const prog = dur ? a.currentTime / dur : 0;
        const played = Math.round(prog * bars.length);
        bars.forEach((b, i) => b.classList.toggle('mj-waveform__bar--played', i < played));
        if (curEl) curEl.textContent = fmt(a.currentTime);
        if (scrub) { scrub.value = String(Math.round(prog * 1000)); scrub.style.backgroundSize = (prog*100)+'% 100%'; }
      };
      const setPlayUI = () => {
        if (playIcon) playIcon.src = this.playing ? ICON.pause : ICON.play;
        if (playLabel) playLabel.textContent = this.playing ? 'PAUSE' : 'PLAY';
      };
      a.onloadedmetadata = () => { if (durEl) durEl.textContent = fmt(a.duration); paint(); };
      if (a.readyState >= 1 && durEl) durEl.textContent = fmt(a.duration);
      a.ontimeupdate = paint;
      a.onended = () => { this.playing = false; setPlayUI(); };
      this._setPlayUI = setPlayUI;

      this.viewport.querySelector('[data-toggle-play]').addEventListener('click', () => {
        if (this.playing) { a.pause(); this.playing = false; }
        else { a.play().catch(()=>{}); this.playing = true; }
        setPlayUI();
      });
      this.viewport.querySelectorAll('[data-seek]').forEach(el => el.addEventListener('click', () => {
        a.currentTime = Math.max(0, Math.min((a.duration||185), a.currentTime + Number(el.dataset.seek)));
        paint();
      }));
      if (scrub) scrub.addEventListener('input', () => {
        const dur = a.duration || 185; a.currentTime = (Number(scrub.value)/1000) * dur; paint();
      });
      setPlayUI(); paint();
    }

    pauseAudio() { if (this.audio) { this.audio.pause(); this.playing = false; } }
  }

  customElements.define('xueban-phone', XuebanPhone);
})();
