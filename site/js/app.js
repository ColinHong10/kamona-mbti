/* =========================================================
 * 暗区人格 · 逻辑层
 * ========================================================= */
(() => {
  if (!window.__DATA__){
    console.error('[暗区 MBTI] 数据加载失败：window.__DATA__ 未定义，请检查 data.js');
    document.body.innerHTML = '<div style="color:#fff;padding:40px;font:14px/1.6 -apple-system,sans-serif;">数据加载失败，请刷新页面或检查控制台。</div>';
    return;
  }
  const { PERSONAS, QUESTIONS, SIGNATURE } = window.__DATA__;

  /* ------------ 工具 ------------ */
  const $  = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const clamp = (n,min,max) => Math.max(min, Math.min(max,n));
  const APEX_UNLOCK_KEY = 'dark-zone-mbti-apex-unlocked';
  let apexUnlocked = false;
  try {
    apexUnlocked = localStorage.getItem(APEX_UNLOCK_KEY) === '1';
  } catch {}

  function isApexLocked(id){
    return id === 'apex' && !apexUnlocked;
  }

  function unlockApexIfNeeded(id){
    if (id !== 'apex' || apexUnlocked) return;
    apexUnlocked = true;
    try {
      localStorage.setItem(APEX_UNLOCK_KEY, '1');
    } catch {}
    if (document.getElementById('codex-grid')) renderCodex();
    if (document.getElementById('ps-card')?.dataset.templateReady) {
      updateShowcaseCard();
      updateShowcaseRail();
    }
  }

  function personaImage(p, type = 'img'){
    if (!p || isApexLocked(p.id)) return '';
    return type === 'cutout' ? (p.cutout || p.img) : p.img;
  }

  /* ------------ 路由（封面 / 答题 / 结果 / 图鉴） ------------ */
  const screens = {
    cover:  $('[data-screen="cover"]'),
    quiz:   $('[data-screen="quiz"]'),
    result: $('[data-screen="result"]'),
    codex:  $('[data-screen="codex"]'),
  };
  // 路由栈顺序：决定切页方向（forward: 右滑入；back: 左滑入）
  const ROUTE_ORDER = ['cover','quiz','result','codex'];
  let currentScreen = 'cover';
  let isAnimating = false;

  function show(name, opts = {}){
    if (isAnimating) return;
    if (name === currentScreen){
      window.scrollTo(0,0);
      return;
    }
    const direction = opts.direction
      || (ROUTE_ORDER.indexOf(name) >= ROUTE_ORDER.indexOf(currentScreen) ? 'forward' : 'back');

    const fromEl = screens[currentScreen];
    const toEl   = screens[name];
    if (!toEl) return;

    isAnimating = true;

    // 立即回顶
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 清理残留 class
    fromEl.classList.remove('screen-enter-fwd','screen-enter-back','screen-leave-fwd','screen-leave-back');
    toEl.classList.remove('screen-enter-fwd','screen-enter-back','screen-leave-fwd','screen-leave-back');

    // 离场：给 fromEl 加 is-leaving（保持显示）+ 方向动画
    fromEl.classList.add('is-leaving');
    fromEl.classList.add(direction === 'forward' ? 'screen-leave-fwd' : 'screen-leave-back');

    // 入场：激活 toEl
    toEl.classList.add('is-active');
    toEl.classList.add(direction === 'forward' ? 'screen-enter-fwd' : 'screen-enter-back');

    // 动画结束后清理
    const DUR = 480;
    setTimeout(() => {
      Object.entries(screens).forEach(([k, el]) => {
        el.classList.remove('screen-enter-fwd','screen-enter-back','screen-leave-fwd','screen-leave-back','is-leaving');
        if (k !== name){
          el.classList.remove('is-active');
        } else {
          el.classList.add('is-active');
          el.style.opacity = '';
          el.style.transform = '';
        }
      });
      currentScreen = name;
      isAnimating = false;
    }, DUR);

    // 切换 body class（给 bg-kv 等依赖当前 screen 的样式使用）
    document.body.classList.toggle('on-cover',  name === 'cover');
    document.body.classList.toggle('on-quiz',   name === 'quiz');
    document.body.classList.toggle('on-result', name === 'result');
    document.body.classList.toggle('on-codex',  name === 'codex');
  }

  $$('[data-goto]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const target = a.getAttribute('data-goto');
    if (target === 'codex') renderCodex();
    show(target);
  }));

  /* ------------ 封面 ------------ */
  $('#btn-start').addEventListener('click', startQuiz);

  /* ------------ 答题：分页模式（每页 5 题） ------------ */
  const PAGE_SIZE = 5;
  const TOTAL_PAGES = Math.ceil(QUESTIONS.length / PAGE_SIZE);
  let pageIdx = 0;
  let answers = new Array(QUESTIONS.length).fill(null); // answers[i] = optionIndex or null

  function startQuiz(){
    pageIdx = 0;
    answers = new Array(QUESTIONS.length).fill(null);
    show('quiz');
    $('#q-total').textContent = QUESTIONS.length;
    renderPage();
  }

  function renderPage(){
    const body = $('#quiz-body');
    const start = pageIdx * PAGE_SIZE;
    const end   = Math.min(start + PAGE_SIZE, QUESTIONS.length);

    // 离场动画
    const old = body.querySelector('.q-page');
    const render = () => {
      body.innerHTML = '';
      const page = document.createElement('div');
      page.className = 'q-page';

      // 页头
      page.innerHTML = `
        <div class="q-eyebrow">PART ${String(pageIdx + 1).padStart(2,'0')} / ${String(TOTAL_PAGES).padStart(2,'0')} · Q${start+1}–Q${end}</div>
      `;

      // 题目列表
      const list = document.createElement('div');
      list.className = 'q-list';
      for (let i = start; i < end; i++){
        const q = QUESTIONS[i];
        const block = document.createElement('section');
        block.className = 'q-block';
        block.dataset.qi = i;
        block.style.animationDelay = `${(i-start) * 90}ms`;
        block.innerHTML = `
          <div class="q-num">Q${String(i+1).padStart(2,'0')}</div>
          <h3 class="q-title">${q.q}</h3>
          <div class="q-options"></div>
        `;
        const opts = block.querySelector('.q-options');
        q.options.forEach((opt, oi) => {
          const btn = document.createElement('button');
          btn.className = 'q-opt';
          if (answers[i] === oi) btn.classList.add('selected');
          btn.innerHTML = `
            <span class="opt-key">${'ABCD'[oi]}</span>
            <span class="opt-text">${opt.text}</span>
          `;
          btn.addEventListener('click', () => {
            answers[i] = oi;
            $$('.q-opt', opts).forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            updateNextBtn();
            updateProgress();
          });
          opts.appendChild(btn);
        });
        list.appendChild(block);
      }
      page.appendChild(list);

      // 底部操作条
      const nav = document.createElement('div');
      nav.className = 'q-nav';
      nav.innerHTML = `
        <button class="btn-ghost" id="q-prev" ${pageIdx === 0 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          <span>PREV</span>
        </button>
        <div class="q-nav-meta">PROGRESS · <span id="q-page-done">0</span>/<span>${end-start}</span></div>
        <button class="btn-primary" id="q-next" disabled>
          <span>${pageIdx === TOTAL_PAGES - 1 ? '[ CONFIRM · 查看结果 ]' : '[ NEXT ]'}</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      `;
      page.appendChild(nav);

      body.appendChild(page);

      $('#q-prev').addEventListener('click', () => {
        if (pageIdx > 0){ pageIdx--; renderPage(); }
      });
      $('#q-next').addEventListener('click', () => {
        if (!isPageDone()) return;
        if (pageIdx < TOTAL_PAGES - 1){
          pageIdx++; renderPage();
        } else {
          computeAndShowResult();
        }
      });

      updateProgress();
      updateNextBtn();

      // 滚到答题区顶部（让用户第一眼看到题目）
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
    };

    if (old){
      old.classList.add('leave');
      setTimeout(render, 220);
    } else {
      render();
    }
  }

  function isPageDone(){
    const start = pageIdx * PAGE_SIZE;
    const end   = Math.min(start + PAGE_SIZE, QUESTIONS.length);
    for (let i = start; i < end; i++) if (answers[i] === null) return false;
    return true;
  }
  function countPageDone(){
    const start = pageIdx * PAGE_SIZE;
    const end   = Math.min(start + PAGE_SIZE, QUESTIONS.length);
    let n = 0;
    for (let i = start; i < end; i++) if (answers[i] !== null) n++;
    return n;
  }
  function updateNextBtn(){
    const next = document.getElementById('q-next');
    const done = document.getElementById('q-page-done');
    if (done) done.textContent = countPageDone();
    if (next) next.disabled = !isPageDone();
  }

  function updateProgress(){
    const total = QUESTIONS.length;
    const done  = answers.filter(a => a !== null).length;
    $('#q-idx').textContent = done;
    const pct = (done / total) * 100;
    $('#q-fill').style.width = `${clamp(pct, 2, 100)}%`;
  }

  $('#btn-back').addEventListener('click', () => {
    if (pageIdx > 0){ pageIdx--; renderPage(); }
    else show('cover', { direction:'back' });
  });
  $('#btn-exit').addEventListener('click', () => {
    if (confirm('确定退出本次测试？进度会丢失。')) show('cover', { direction:'back' });
  });

  /* ------------ 计分算法 ------------ */
  function computeScores(){
    const score = {};
    Object.keys(PERSONAS).forEach(k => score[k] = 0);
    answers.forEach((optIdx, qi) => {
      if (optIdx === null || optIdx === undefined) return;
      const w = QUESTIONS[qi].options[optIdx].w || {};
      for (const k in w) score[k] = (score[k] || 0) + w[k];
    });
    return applySignatureBlend(score);
  }

  function applySignatureBlend(score){
    const blended = { ...score };
    Object.values(SIGNATURE).forEach(ids => {
      const dimSum = ids.reduce((sum, id) => sum + (score[id] || 0), 0);
      if (!dimSum) return;
      const dimAvg = dimSum / ids.length;
      ids.forEach(id => {
        blended[id] = (blended[id] || 0) + dimAvg * 0.08;
      });
    });
    return blended;
  }

  function pickWinner(score){
    // 最高分 + 并列时用签名维度偏向 + 隐藏款门槛
    const entries = Object.entries(score).sort((a,b) => b[1] - a[1]);
    let top = entries[0][0];
    const topScore = entries[0][1];

    // 隐藏款 apex：必须进攻+技术双项高分
    const offense = SIGNATURE.offense.reduce((s,k)=>s + (score[k]||0), 0);
    const tech    = SIGNATURE.tech.reduce((s,k)=>s + (score[k]||0), 0);
    if (score.apex >= topScore - 1 && offense >= 10 && tech >= 6){
      top = 'apex';
    }

    // 平票：签名维度加权挑
    const tied = entries.filter(e => e[1] === topScore).map(e => e[0]);
    if (tied.length > 1){
      const dimScore = {};
      tied.forEach(id => {
        let s = topScore;
        Object.entries(SIGNATURE).forEach(([dim, ids]) => {
          if (ids.includes(id)){
            const dimSum = ids.reduce((a,k)=>a + (score[k]||0), 0);
            s += dimSum * 0.1;
          }
        });
        dimScore[id] = s;
      });
      top = Object.entries(dimScore).sort((a,b)=>b[1]-a[1])[0][0];
    }

    return top;
  }

  function computeAndShowResult(){
    const score = computeScores();
    const winnerId = pickWinner(score);
    renderResult(winnerId, score);
    show('result');
  }

  /* ------------ 结果渲染 ------------ */
  function renderResult(winnerId, score){
    unlockApexIfNeeded(winnerId);
    const p = PERSONAS[winnerId];
    const total = Object.values(score).reduce((a,b)=>a+b,0) || 1;

    // Top 5 分布
    const top5 = Object.entries(score).sort((a,b)=>b[1]-a[1]).slice(0,5)
      .filter(([,v]) => v > 0);

    const html = `
      <section class="result-hero">
        <div>
          <div class="result-eyebrow">IDENTITY CONFIRMED · 测试结果 <span class="result-code">${p.code}</span></div>
          <h1 class="result-name">${p.cn}</h1>
          <div class="result-en">${p.en}</div>
          <div class="result-rarity"><span class="rd rd--${p.rarity}"></span> ${p.rarity === '普通' ? 'COMMON' : p.rarity === '稀有' ? 'RARE' : 'HIDDEN'} · ${p.rarity}款</div>
          <div class="result-punch">"${p.punch}"</div>
          <p class="result-summary">${p.summary}</p>
          <div class="result-tags">${p.tag.split(' ').map(t=>`<span class="tag">${t}</span>`).join('')}</div>
          <ul class="vibes">
            ${p.vibes.map(v=>`<li>${v}</li>`).join('')}
          </ul>
        </div>
        <div class="result-img">
          <div class="r-img-wrap">
            <img src="${p.img}" alt="${p.cn}"/>
          </div>
        </div>
      </section>

      <section class="result-bars">
        <h3>PERSONA DISTRIBUTION · 人格分布</h3>
        ${top5.map(([id, v]) => {
          const pct = Math.round((v / top5[0][1]) * 100);
          const per = PERSONAS[id];
          return `
            <div class="bar-row">
              <div class="bar-name">${per.cn}</div>
              <div class="bar-track"><div class="bar-fill" data-pct="${pct}" style="width:0%"></div></div>
              <div class="bar-v">${pct}%</div>
            </div>`;
        }).join('')}
      </section>

      <section class="result-pair">
        <div class="pair-card">
          <h4 class="ok">SQUAD COMPATIBLE · 适合组队</h4>
          <p class="pair-sub">和这些人一起上线，最容易活着撤离。</p>
          <div class="pair-list">
            ${p.match.map(id => pairItem(id)).join('')}
          </div>
        </div>
        <div class="pair-card">
          <h4 class="no">AVOID · 建议回避</h4>
          <p class="pair-sub">和这些人一起开黑，容易直接结束友情。</p>
          <div class="pair-list">
            ${p.clash.map(id => pairItem(id)).join('')}
          </div>
        </div>
      </section>

      <section class="result-actions">
        <button class="btn-primary" id="r-retest">
          <span>[ RETRY · 再测一次 ]</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3 12a9 9 0 109-9M3 3v6h6"/></svg>
        </button>
        <button class="btn-ghost" id="r-codex">[ CODEX · 图鉴 ]</button>
        <button class="btn-ghost" id="r-share">[ SHARE · 分享结果图 ]</button>
      </section>
    `;
    $('#result-wrap').innerHTML = html;

    // 分数条填充动画
    setTimeout(() => {
      $$('.bar-fill').forEach(el => {
        el.style.width = el.dataset.pct + '%';
      });
    }, 120);

    // 事件
    $('#r-retest').addEventListener('click', startQuiz);
    $('#r-codex').addEventListener('click', () => { renderCodex(); show('codex'); });
    $('#r-share').addEventListener('click', () => shareResultPoster(p));

    // pair-item 点击 → 弹层
    $$('.pair-item').forEach(el => {
      el.addEventListener('click', () => openModal(el.dataset.id));
    });
  }

  async function shareResultPoster(p){
    const btn = $('#r-share');
    const oldText = btn?.textContent;
    if (btn){
      btn.disabled = true;
      btn.textContent = '[ GENERATING · 生成中 ]';
    }

    try {
      const shareUrl = getShareUrl();
      const blob = await createResultPosterBlob(p, shareUrl);
      const filename = `dark-zone-mbti-${p.id || 'result'}.png`;
      const text = `我是「${p.cn}」（${p.en}）\n${p.punch}\n—— 来测测你的暗区人格：18 种，你会是哪一种？\n${shareUrl}`;
      const file = new File([blob], filename, { type:'image/png' });
      const shareData = {
        title:'暗区人格 · DARK ZONE MBTI',
        text,
        url: shareUrl,
        files:[file]
      };

      if (navigator.share && navigator.canShare?.({ files:[file] })){
        try {
          await navigator.share(shareData);
          toast('已拉起分享面板');
          return;
        } catch (err){
          if (err?.name === 'AbortError'){
            toast('已取消分享');
            return;
          }
        }
      }

      downloadBlob(blob, filename);
      await copyShareText(text);
      toast('已下载结果图并复制文案');
    } catch (err){
      console.error('[暗区 MBTI] 分享图生成失败：', err);
      const fallback = `我是「${p.cn}」（${p.en}）\n${p.punch}\n—— 来测测你的暗区人格：18 种，你会是哪一种？\n${getShareUrl()}`;
      await copyShareText(fallback).catch(() => alert(fallback));
      toast('图片生成失败，已复制文案');
    } finally {
      if (btn){
        btn.disabled = false;
        btn.textContent = oldText || '[ SHARE · 分享结果图 ]';
      }
    }
  }

  function getShareUrl(){
    if (location.protocol === 'file:') return location.href.split('#')[0];
    return `${location.origin}${location.pathname}`;
  }

  async function createResultPosterBlob(p, shareUrl){
    await document.fonts?.ready?.catch?.(() => {});
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d');
    drawPosterBackground(ctx, canvas.width, canvas.height);
    await drawPosterContent(ctx, p, shareUrl);
    return await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')), 'image/png', 0.95);
    });
  }

  function drawPosterBackground(ctx, w, h){
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#11161b');
    bg.addColorStop(0.5, '#090b0e');
    bg.addColorStop(1, '#16100e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ca4d32';
    ctx.globalAlpha = 0.18;
    ctx.fillRect(0, 0, 18, h);
    ctx.fillRect(w - 18, 0, 18, h);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(202,77,50,.35)';
    ctx.lineWidth = 2;
    for (let y = 120; y < h; y += 120){
      ctx.beginPath();
      ctx.moveTo(58, y);
      ctx.lineTo(w - 58, y);
      ctx.stroke();
    }

    const glow = ctx.createRadialGradient(w * 0.7, h * 0.36, 20, w * 0.7, h * 0.36, 520);
    glow.addColorStop(0, 'rgba(202,77,50,.28)');
    glow.addColorStop(1, 'rgba(202,77,50,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  async function drawPosterContent(ctx, p, shareUrl){
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const accent = '#ca4d32';
    const text = '#f4f1eb';
    const muted = '#9aa3aa';

    ctx.save();
    ctx.strokeStyle = 'rgba(244,241,235,.28)';
    ctx.lineWidth = 3;
    ctx.strokeRect(58, 58, w - 116, h - 116);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    drawCornerTicks(ctx, 58, 58, w - 116, h - 116, 54);
    ctx.restore();

    ctx.fillStyle = accent;
    ctx.font = '700 34px RobotoCondensed, Arial, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('DARK ZONE MBTI', 92, 130);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = muted;
    ctx.font = '700 26px RobotoCondensed, Arial, sans-serif';
    ctx.fillText('IDENTITY CONFIRMED', 92, 176);

    ctx.fillStyle = 'rgba(202,77,50,.92)';
    ctx.fillRect(90, 222, 230, 42);
    ctx.fillStyle = '#fff';
    ctx.font = '700 24px RobotoCondensed, Arial, sans-serif';
    ctx.fillText(`${rarityEn(p.rarity)} · ${p.code}`, 112, 251);

    await drawPersonaFigure(ctx, p);

    ctx.fillStyle = text;
    ctx.font = fitFont(ctx, p.cn, 86, 'FZLT, "Microsoft YaHei", sans-serif', 720);
    ctx.fillText(p.cn, 92, 708);
    ctx.fillStyle = accent;
    ctx.font = '800 44px Refrigerator, RobotoCondensed, Arial, sans-serif';
    drawWrappedText(ctx, p.en.toUpperCase(), 94, 760, 720, 50, 1);

    ctx.fillStyle = 'rgba(244,241,235,.08)';
    ctx.fillRect(92, 810, 760, 130);
    ctx.strokeStyle = 'rgba(202,77,50,.45)';
    ctx.strokeRect(92, 810, 760, 130);
    ctx.fillStyle = text;
    ctx.font = '700 34px FZLT, "Microsoft YaHei", sans-serif';
    drawWrappedText(ctx, `“${p.punch}”`, 124, 862, 690, 46, 2);

    drawPosterTags(ctx, p.tag.split(' ').filter(Boolean).slice(0, 3), 92, 986, 770);

    ctx.fillStyle = muted;
    ctx.font = '500 28px FZLT, "Microsoft YaHei", sans-serif';
    drawWrappedText(ctx, p.summary, 92, 1088, 650, 42, 3);

    const qr = createQrMatrix(shareUrl);
    drawQr(ctx, qr, 790, 1084, 194);
    ctx.fillStyle = text;
    ctx.font = '700 26px FZLT, "Microsoft YaHei", sans-serif';
    ctx.fillText('扫码测试你的暗区人格', 748, 1312);
    ctx.fillStyle = muted;
    ctx.font = '700 18px RobotoCondensed, Arial, sans-serif';
    ctx.fillText('ARENA BREAKOUT · FAN-MADE FOR FUN', 92, 1356);
  }

  function drawCornerTicks(ctx, x, y, w, h, len){
    ctx.beginPath();
    ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
    ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
    ctx.moveTo(x + w, y + h - len); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - len, y + h);
    ctx.moveTo(x + len, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - len);
    ctx.stroke();
  }

  async function drawPersonaFigure(ctx, p){
    const src = personaImage(p, 'cutout') || personaImage(p) || p.img;
    try {
      const img = await loadImage(src);
      drawImageContain(ctx, img, 392, 172, 560, 540);
    } catch {
      ctx.fillStyle = 'rgba(202,77,50,.18)';
      ctx.fillRect(420, 230, 450, 390);
      ctx.fillStyle = '#f4f1eb';
      ctx.font = '800 64px Refrigerator, RobotoCondensed, Arial, sans-serif';
      ctx.fillText(p.code || 'MBTI', 500, 440);
    }
  }

  function loadImage(src){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function drawImageContain(ctx, img, x, y, w, h){
    const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const iw = img.naturalWidth * scale;
    const ih = img.naturalHeight * scale;
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  }

  function drawPosterTags(ctx, tags, x, y, maxW){
    let cx = x;
    let cy = y;
    ctx.font = '700 24px RobotoCondensed, FZLT, Arial, sans-serif';
    tags.forEach(tag => {
      const label = tag.replace(/^#/, '# ');
      const tw = ctx.measureText(label).width + 34;
      if (cx + tw > x + maxW){
        cx = x;
        cy += 48;
      }
      ctx.fillStyle = 'rgba(202,77,50,.16)';
      ctx.fillRect(cx, cy, tw, 36);
      ctx.strokeStyle = 'rgba(202,77,50,.55)';
      ctx.strokeRect(cx, cy, tw, 36);
      ctx.fillStyle = '#f4f1eb';
      ctx.fillText(label, cx + 17, cy + 25);
      cx += tw + 14;
    });
  }

  function drawWrappedText(ctx, text, x, y, maxW, lineH, maxLines = Infinity){
    const chars = [...String(text)];
    let line = '';
    let lines = [];
    chars.forEach(ch => {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line){
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    lines = lines.slice(0, maxLines);
    if (lines.length && lines.length === maxLines && chars.length){
      while (ctx.measureText(lines[lines.length - 1] + '…').width > maxW){
        lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
      }
      if (lines.join('').length < chars.join('').length) lines[lines.length - 1] += '…';
    }
    lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lineH));
  }

  function fitFont(ctx, text, maxPx, family, maxW){
    let px = maxPx;
    do {
      ctx.font = `700 ${px}px ${family}`;
      if (ctx.measureText(text).width <= maxW) break;
      px -= 3;
    } while (px > 42);
    return `700 ${px}px ${family}`;
  }

  function rarityEn(rarity){
    return rarity === '普通' ? 'COMMON' : rarity === '稀有' ? 'RARE' : 'HIDDEN';
  }

  function downloadBlob(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  async function copyShareText(text){
    if (navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }

  function createQrMatrix(text){
    const version = 5;
    const size = version * 4 + 17;
    const dataCodewords = 108;
    const eccCodewords = 26;
    const bytes = new TextEncoder().encode(text);
    const maxBytes = Math.floor((dataCodewords * 8 - 12) / 8);
    const payload = bytes.length > maxBytes ? bytes.slice(0, maxBytes) : bytes;
    const data = qrEncodeData(payload, dataCodewords);
    const ecc = qrReedSolomon(data, eccCodewords);
    const bits = [...data, ...ecc].flatMap(b => {
      const out = [];
      for (let i = 7; i >= 0; i--) out.push(((b >>> i) & 1) === 1);
      return out;
    });
    const base = qrCreateBaseMatrix(size);
    qrPlaceData(base.modules, base.func, bits, 0);
    qrDrawFormat(base.modules, base.func, 0);
    return base.modules;
  }

  function qrEncodeData(bytes, dataCodewords){
    const bits = [];
    const push = (val, len) => {
      for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
    };
    push(0b0100, 4); // byte mode
    push(bytes.length, 8);
    bytes.forEach(b => push(b, 8));
    const cap = dataCodewords * 8;
    const terminator = Math.min(4, cap - bits.length);
    push(0, terminator);
    while (bits.length % 8) bits.push(0);

    const out = [];
    for (let i = 0; i < bits.length; i += 8){
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      out.push(b);
    }
    for (let pad = 0; out.length < dataCodewords; pad ^= 1){
      out.push(pad ? 0x11 : 0xec);
    }
    return out;
  }

  function qrCreateBaseMatrix(size){
    const modules = Array.from({ length:size }, () => Array(size).fill(false));
    const func = Array.from({ length:size }, () => Array(size).fill(false));
    const set = (x, y, dark, isFunc = true) => {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      modules[y][x] = dark;
      if (isFunc) func[y][x] = true;
    };

    [[0,0], [size - 7, 0], [0, size - 7]].forEach(([x, y]) => {
      for (let dy = -1; dy <= 7; dy++){
        for (let dx = -1; dx <= 7; dx++){
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue;
          const inCore = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
          const dark = inCore && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
          set(xx, yy, dark);
        }
      }
    });

    for (let i = 8; i < size - 8; i++){
      const dark = i % 2 === 0;
      set(6, i, dark);
      set(i, 6, dark);
    }

    qrDrawAlignment(set, 30, 30);
    set(8, size - 8, true);

    for (let i = 0; i < 9; i++){
      if (i !== 6){
        set(8, i, false);
        set(i, 8, false);
      }
    }
    for (let i = 0; i < 8; i++){
      set(size - 1 - i, 8, false);
      set(8, size - 1 - i, false);
    }

    return { modules, func };
  }

  function qrDrawAlignment(set, cx, cy){
    for (let dy = -2; dy <= 2; dy++){
      for (let dx = -2; dx <= 2; dx++){
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        set(cx + dx, cy + dy, d !== 1);
      }
    }
  }

  function qrPlaceData(modules, func, bits, mask){
    const size = modules.length;
    let bitIdx = 0;
    let upward = true;
    for (let right = size - 1; right >= 1; right -= 2){
      if (right === 6) right--;
      for (let vert = 0; vert < size; vert++){
        const y = upward ? size - 1 - vert : vert;
        for (let j = 0; j < 2; j++){
          const x = right - j;
          if (func[y][x]) continue;
          const raw = bitIdx < bits.length ? bits[bitIdx++] : false;
          modules[y][x] = Boolean(raw) !== qrMask(mask, x, y);
        }
      }
      upward = !upward;
    }
  }

  function qrMask(mask, x, y){
    if (mask === 0) return (x + y) % 2 === 0;
    if (mask === 1) return y % 2 === 0;
    if (mask === 2) return x % 3 === 0;
    if (mask === 3) return (x + y) % 3 === 0;
    if (mask === 4) return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    if (mask === 5) return ((x * y) % 2 + (x * y) % 3) === 0;
    if (mask === 6) return (((x * y) % 2 + (x * y) % 3) % 2) === 0;
    return (((x + y) % 2 + (x * y) % 3) % 2) === 0;
  }

  function qrDrawFormat(modules, func, mask){
    const size = modules.length;
    const bits = qrFormatBits(mask);
    const set = (x, y, i) => {
      modules[y][x] = ((bits >>> i) & 1) !== 0;
      func[y][x] = true;
    };

    for (let i = 0; i <= 5; i++) set(8, i, i);
    set(8, 7, 6);
    set(8, 8, 7);
    set(7, 8, 8);
    for (let i = 9; i < 15; i++) set(14 - i, 8, i);

    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, i);
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, i);
    modules[size - 8][8] = true;
  }

  function qrFormatBits(mask){
    const ecl = 1; // L
    let data = (ecl << 3) | mask;
    let rem = data << 10;
    const poly = 0x537;
    for (let i = 14; i >= 10; i--){
      if (((rem >>> i) & 1) !== 0) rem ^= poly << (i - 10);
    }
    return ((data << 10) | (rem & 0x3ff)) ^ 0x5412;
  }

  function qrReedSolomon(data, degree){
    const gen = qrRsGenerator(degree);
    const rem = Array(degree).fill(0);
    data.forEach(byte => {
      const factor = byte ^ rem.shift();
      rem.push(0);
      gen.forEach((coef, i) => {
        rem[i] ^= qrGfMul(coef, factor);
      });
    });
    return rem;
  }

  function qrRsGenerator(degree){
    let result = [1];
    for (let i = 0; i < degree; i++){
      const next = Array(result.length + 1).fill(0);
      result.forEach((coef, j) => {
        next[j] ^= qrGfMul(coef, 1);
        next[j + 1] ^= qrGfMul(coef, qrGfPow(2, i));
      });
      result = next;
    }
    return result.slice(1);
  }

  function qrGfPow(x, power){
    let y = 1;
    for (let i = 0; i < power; i++) y = qrGfMul(y, x);
    return y;
  }

  function qrGfMul(x, y){
    let z = 0;
    for (let i = 7; i >= 0; i--){
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xff;
  }

  function drawQr(ctx, modules, x, y, size){
    const n = modules.length;
    const quiet = 4;
    const cell = Math.floor(size / (n + quiet * 2));
    const real = cell * (n + quiet * 2);
    ctx.fillStyle = '#f4f1eb';
    ctx.fillRect(x, y, real, real);
    ctx.fillStyle = '#101419';
    modules.forEach((row, yy) => {
      row.forEach((dark, xx) => {
        if (dark) ctx.fillRect(x + (xx + quiet) * cell, y + (yy + quiet) * cell, cell, cell);
      });
    });
  }

  function pairItem(id){
    const p = PERSONAS[id];
    const locked = isApexLocked(id);
    return `
      <div class="pair-item ${locked ? 'is-locked' : ''}" data-id="${id}">
        ${locked ? '<span class="pi-lock" aria-hidden="true">?</span>' : `<img src="${personaImage(p)}" alt=""/>`}
        <div>
          <div class="pi-cn">${locked ? '隐藏人格' : p.cn}</div>
          <div class="pi-en">${locked ? 'CLASSIFIED' : p.en}</div>
        </div>
      </div>
    `;
  }

  /* ------------ 图鉴 ------------ */
  let codexFilter = 'all';
  function renderCodex(){
    const grid = $('#codex-grid');
    const list = Object.values(PERSONAS).filter(p => codexFilter === 'all' || p.rarity === codexFilter);
    grid.innerHTML = list.map((p, i) => {
      const locked = isApexLocked(p.id);
      return `
      <article class="codex-card ${locked ? 'is-locked' : ''}" data-id="${p.id}" style="animation-delay:${i*40}ms">
        <div class="cc-img ${locked ? 'is-locked' : ''}">
          ${locked ? '<span class="locked-mark" aria-hidden="true">?</span>' : `<img src="${personaImage(p)}" alt="${p.cn}" loading="lazy"/>`}
        </div>
        <div class="cc-body">
          <div class="cc-cn">${locked ? '隐藏人格' : p.cn}</div>
          <div class="cc-en">${locked ? 'CLASSIFIED' : p.en}</div>
          <div class="cc-meta">
            <span class="cc-rare ${p.rarity}">${p.rarity}</span>
            <span class="cc-code">${locked ? '???' : p.code}</span>
          </div>
        </div>
      </article>
    `;
    }).join('');
    $$('.codex-card').forEach(el => {
      el.addEventListener('click', () => openModal(el.dataset.id));
    });
  }
  $('#codex-filter').addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (!b) return;
    $$('.chip').forEach(c => c.classList.remove('active'));
    b.classList.add('active');
    codexFilter = b.dataset.filter;
    renderCodex();
  });

  /* ------------ Modal ------------ */
  const modal = $('#modal');
  function openModal(id){
    const p = PERSONAS[id];
    const locked = isApexLocked(id);
    $('#modal-card').innerHTML = `
      <button class="modal-close" aria-label="关闭" data-close>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div class="m-hero ${locked ? 'is-locked' : ''}">
        ${locked ? '<span class="locked-mark" aria-hidden="true">?</span>' : `<img src="${personaImage(p)}" alt=""/>`}
      </div>
      <div class="m-body">
        <div class="result-eyebrow">${locked ? '???' : p.code} · ${p.rarity === '普通' ? 'COMMON' : p.rarity === '稀有' ? 'RARE' : 'HIDDEN'}</div>
        <h2 class="m-name">${locked ? '隐藏人格' : p.cn}</h2>
        <div class="m-en">${locked ? 'CLASSIFIED' : p.en}</div>
        <div class="m-punch">"${locked ? '开出这种人格后，档案将自动解锁。' : p.punch}"</div>
        <p class="m-sum">${locked ? '该人格形象已封存。完成测试并获得隐藏人格后，图鉴与首页展示会显示真实形象。' : p.summary}</p>
        <ul class="vibes">
          ${(locked ? ['未解锁前不显示角色外观', '结果命中后会在本机保留解锁状态'] : p.vibes).map(v=>`<li>${v}</li>`).join('')}
        </ul>
        <div class="result-pair" style="margin-top:24px">
          <div class="pair-card">
            <h4 class="ok">SQUAD COMPATIBLE · 适合组队</h4>
            <div class="pair-list">${p.match.map(pairItem).join('')}</div>
          </div>
          <div class="pair-card">
            <h4 class="no">AVOID · 建议回避</h4>
            <div class="pair-list">${p.clash.map(pairItem).join('')}</div>
          </div>
        </div>
      </div>
    `;
    modal.hidden = false;
    // 切换嵌套的 pair-item
    $$('.pair-item', modal).forEach(el => {
      el.addEventListener('click', ev => { ev.stopPropagation(); openModal(el.dataset.id); });
    });
  }
  modal.addEventListener('click', e => {
    if (e.target.matches('[data-close]') || e.target.closest('[data-close]')) {
      modal.hidden = true;
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) modal.hidden = true;
  });

  /* ------------ Toast ------------ */
  let toastT;
  function toast(msg){
    let el = document.getElementById('__toast');
    if (!el){
      el = document.createElement('div');
      el.id = '__toast';
      el.style.cssText = 'position:fixed;left:50%;bottom:80px;transform:translateX(-50%);padding:12px 22px;background:#0f1114;color:#fff;font-family:\"Refrigerator\",\"RobotoCondensed\",sans-serif;font-size:13px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;border:1px solid #ca4d32;z-index:200;box-shadow:0 20px 50px rgba(0,0,0,.6), 0 0 0 1px rgba(202,77,50,.15);opacity:0;transition:opacity 240ms ease, transform 240ms ease;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toastT);
    toastT = setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(8px)';
    }, 1800);
  }

  /* ------------ 快捷键：左右方向键翻页 ------------ */
  document.addEventListener('keydown', e => {
    if (screens.quiz.hidden) return;
    if (e.key === 'ArrowRight'){
      const next = document.getElementById('q-next');
      if (next && !next.disabled) next.click();
    } else if (e.key === 'ArrowLeft'){
      const prev = document.getElementById('q-prev');
      if (prev && !prev.disabled) prev.click();
    }
  });

  /* ------------ 初始化 ------------ */
  modal.hidden = true;
  // 初始只显示封面
  Object.entries(screens).forEach(([k, el]) => {
    el.removeAttribute('hidden'); // 不再依赖 hidden 属性
    if (k === 'cover') el.classList.add('is-active');
    else el.classList.remove('is-active');
  });
  currentScreen = 'cover';
  document.body.classList.add('on-cover');
  renderCodex();

  /* ============ 封面 · 人格橱窗 Showcase ============ */
  const SHOWCASE_ORDER = [
    'safe_rusher',
    'lone_wolf',
    'headtap',
    'babysitter',
    'loot_goblin',
    'w_maniac',
    'squad_commander',
    'sniper',
    'chad',
    'rat',
    'thermal',
    'knife',
    'backpack',
    'stash',
    'extraction_camper',
    'leg_meta',
    'evita_simp',
    'apex'
  ];
  const PERSONA_LIST = SHOWCASE_ORDER.map(id => PERSONAS[id]).filter(Boolean);
  const RARITY_EN = { '普通':'COMMON', '稀有':'RARE', '隐藏':'HIDDEN' };
  const SHOWCASE_PAGE_SIZE = 5;
  const TOTAL_SHOWCASE_PAGES = Math.ceil(PERSONA_LIST.length / SHOWCASE_PAGE_SIZE);
  const SHOWCASE_AUTOPLAY_MS = 4000;
  let showcaseIdx = 0;
  let showcaseTimer = null;
  let showcasePaused = false;

  // 稀有度 → class
  const RARITY_CLASS = { '普通':'r-common', '稀有':'r-rare', '隐藏':'r-hidden' };

  // 生成坐标刻度（x 方向 12 段、y 方向 10 段）
  function coordTicks(n, activeIdx){
    let html = '';
    for (let i = 0; i < n; i++){
      const on = (i === activeIdx) ? 'on' : '';
      html += `<i class="${on}"></i>`;
    }
    return html;
  }

  function cardTemplateHTML(){
    return `
      <span class="ps-corner-tl"></span>
      <span class="ps-corner-tr"></span>
      <span class="ps-corner-bl"></span>
      <span class="ps-corner-br"></span>

      <header class="ps-head">
        <span class="ps-file-no">FILE NO. <span data-ps="fileNo"></span></span>
        <span class="ps-classify"><i></i>DARK ZONE · PERSONA PROFILE</span>
      </header>

      <div class="ps-left-col">
        <div class="ps-title" data-role="title">
          <div class="ps-en" data-ps="en"></div>
          <div class="ps-cn" data-ps="cn"></div>
          <div class="ps-rarity" data-ps="rarityWrap">
            RARITY · <b data-ps="rarityEn"></b> · <span data-ps="rarityCn"></span>款
          </div>
        </div>
        <p class="ps-desc" data-ps="summary"></p>
        <div class="ps-tags" data-role="tags">
          <span class="ps-tag" data-ps-tag="0"></span>
          <span class="ps-tag" data-ps-tag="1"></span>
          <span class="ps-tag" data-ps-tag="2"></span>
        </div>
        <div class="ps-features-head" data-role="feat-head">TRAITS · 战术特征</div>
        <ul class="ps-features" data-role="features">
          ${Array.from({ length: 5 }, (_, i) => `
            <li class="ps-feature" data-ps-feature="${i}" style="animation-delay:${120 + i * 90}ms">
              <span class="ps-ico"><svg><use data-ps="featureIcon${i}" href="#ico-safe-box"/></svg></span>
              <span class="ps-txt">
                <span class="ps-en-s" data-ps="featureEn${i}"></span>
                <span class="ps-cn-s" data-ps="featureCn${i}"></span>
              </span>
            </li>
          `).join('')}
        </ul>
      </div>

      <div class="ps-illust">
        <div class="ps-coord-x">${coordTicks(12, -1)}</div>
        <div class="ps-coord-y">${coordTicks(10, -1)}</div>
        <div class="ps-glow"></div>
        <div class="ps-particles" data-role="particles">
          ${Array.from({ length: 14 }, (_, i) => `<i class="ps-spark ps-spark-${i + 1}"></i>`).join('')}
        </div>
        <div class="ps-stage"></div>
        <div class="ps-figure" data-role="figure">
          <img data-ps="figure" src="" alt=""/>
          <span class="ps-figure-lock" aria-hidden="true">?</span>
        </div>
      </div>

      <footer class="ps-footer">
        <span>REF · <span class="ps-code-tag" data-ps="codeTag"></span></span>
        <span>CLASSIFIED / FOR RUNNERS ONLY</span>
      </footer>
    `;
  }

  function thumbTemplateHTML(){
    return Array.from({ length: SHOWCASE_PAGE_SIZE }, (_, i) => `
      <button class="ps-thumb" data-thumb-slot="${i}" data-idx="-1" aria-label="">
        <span class="ps-thumb-idx" data-thumb-idx="${i}"></span>
        <img data-thumb-img="${i}" src="" alt="" loading="lazy"/>
        <span class="ps-thumb-lock" aria-hidden="true">?</span>
        <span class="ps-thumb-label" data-thumb-label="${i}"></span>
      </button>
    `).join('');
  }

  function dotTemplateHTML(){
    return Array.from({ length: TOTAL_SHOWCASE_PAGES }, (_, i) =>
      `<button class="ps-dot" data-page="${i}" aria-label="第 ${i + 1} 页"></button>`
    ).join('');
  }

  function ensureShowcaseTemplate(){
    const card = document.getElementById('ps-card');
    const thumbs = document.getElementById('ps-thumbs');
    const dots = document.getElementById('ps-dots');
    if (!card || !thumbs || !dots) return false;
    if (!card.dataset.templateReady){
      card.innerHTML = cardTemplateHTML();
      card.dataset.templateReady = 'true';
    }
    if (!thumbs.dataset.templateReady){
      thumbs.innerHTML = thumbTemplateHTML();
      thumbs.dataset.templateReady = 'true';
    }
    if (!dots.dataset.templateReady){
      dots.innerHTML = dotTemplateHTML();
      dots.dataset.templateReady = 'true';
    }
    return true;
  }

  function setText(root, key, value){
    const el = root.querySelector(`[data-ps="${key}"]`);
    if (el) el.textContent = value || '';
  }

  function updateCoordTicks(card, idx){
    const xActive = Math.min(11, Math.floor(idx * 12 / PERSONA_LIST.length));
    const yActive = Math.min(9,  Math.floor(idx * 10 / PERSONA_LIST.length));
    $$('.ps-coord-x i', card).forEach((el, i) => el.classList.toggle('on', i === xActive));
    $$('.ps-coord-y i', card).forEach((el, i) => el.classList.toggle('on', i === yActive));
  }

  function seededUnit(seed){
    const x = Math.sin(seed * 997.3) * 10000;
    return x - Math.floor(x);
  }

  function updateParticles(card, idx){
    $$('.ps-spark', card).forEach((spark, i) => {
      const sx = 14 + seededUnit((idx + 1) * 17 + i) * 74;
      const sy = 58 + seededUnit((idx + 1) * 29 + i) * 30;
      const drift = 10 + seededUnit((idx + 1) * 43 + i) * 26;
      const scale = .55 + seededUnit((idx + 1) * 53 + i) * 1.35;
      spark.style.setProperty('--spark-x', `${sx.toFixed(2)}%`);
      spark.style.setProperty('--spark-y', `${sy.toFixed(2)}%`);
      spark.style.setProperty('--spark-drift', `${drift.toFixed(1)}px`);
      spark.style.setProperty('--spark-scale', scale.toFixed(2));
      spark.style.setProperty('--spark-delay', `${(-seededUnit((idx + 1) * 61 + i) * 3.8).toFixed(2)}s`);
    });
  }

  function updateShowcaseCard(){
    const card = document.getElementById('ps-card');
    if (!card) return;
    const p = PERSONA_LIST[showcaseIdx];
    const idxStr = String(showcaseIdx + 1).padStart(2, '0');
    const totalStr = String(PERSONA_LIST.length).padStart(2, '0');
    const features = (p.features || []).slice(0, 5);
    const tags = String(p.tag || '').split(/\s+/).filter(Boolean).slice(0, 3);
    const rarityClass = RARITY_CLASS[p.rarity] || 'r-common';
    const rarityEN = RARITY_EN[p.rarity] || 'COMMON';
    const figure = card.querySelector('[data-ps="figure"]');
    const locked = isApexLocked(p.id);

    card.classList.toggle('is-apex-locked', locked);
    setText(card, 'fileNo', `${idxStr} / ${totalStr}`);
    setText(card, 'en', locked ? 'CLASSIFIED' : p.en);
    setText(card, 'cn', locked ? '隐藏人格' : p.cn);
    setText(card, 'rarityEn', rarityEN);
    setText(card, 'rarityCn', p.rarity);
    setText(card, 'summary', locked ? '该人格档案已加密。完成测试并开出隐藏人格后，真实形象会自动解锁。' : p.summary);
    setText(card, 'codeTag', `${locked ? '???' : p.code}-${idxStr}`);

    const rarityWrap = card.querySelector('[data-ps="rarityWrap"]');
    if (rarityWrap) rarityWrap.className = `ps-rarity ${rarityClass}`;

    tags.forEach((tag, i) => {
      const el = card.querySelector(`[data-ps-tag="${i}"]`);
      if (!el) return;
      el.textContent = tag;
      el.hidden = false;
    });
    for (let i = tags.length; i < 3; i++){
      const el = card.querySelector(`[data-ps-tag="${i}"]`);
      if (el) el.hidden = true;
    }

    for (let i = 0; i < 5; i++){
      const feature = features[i];
      const row = card.querySelector(`[data-ps-feature="${i}"]`);
      if (row) row.hidden = !feature;
      if (!feature) continue;
      const use = card.querySelector(`[data-ps="featureIcon${i}"]`);
      if (use) use.setAttribute('href', `#ico-${feature.icon}`);
      setText(card, `featureEn${i}`, feature.en);
      setText(card, `featureCn${i}`, feature.cn);
    }

    if (figure){
      const src = personaImage(p, 'cutout');
      if (locked) {
        figure.removeAttribute('src');
        figure.alt = '隐藏人格未解锁';
      } else {
        if (figure.getAttribute('src') !== src) figure.src = src;
        figure.alt = p.cn;
      }
    }

    updateCoordTicks(card, showcaseIdx);
    updateParticles(card, showcaseIdx);

    card.classList.remove('is-updating');
    void card.offsetWidth;
    card.classList.add('is-updating');
  }

  function updateShowcaseRail(){
    const thumbs = document.getElementById('ps-thumbs');
    const dots   = document.getElementById('ps-dots');
    if (!thumbs || !dots) return;

    const page = Math.floor(showcaseIdx / SHOWCASE_PAGE_SIZE);
    const start = page * SHOWCASE_PAGE_SIZE;
    const end = Math.min(start + SHOWCASE_PAGE_SIZE, PERSONA_LIST.length);

    $$('.ps-thumb', thumbs).forEach((btn, slot) => {
      const idx = start + slot;
      const p = PERSONA_LIST[idx];
      const visible = idx < end && Boolean(p);
      const locked = visible && isApexLocked(p.id);
      btn.style.visibility = visible ? '' : 'hidden';
      btn.dataset.idx = visible ? String(idx) : '-1';
      btn.classList.toggle('active', idx === showcaseIdx);
      btn.classList.toggle('is-locked', locked);
      btn.setAttribute('aria-label', visible ? (locked ? '隐藏人格未解锁' : p.cn) : '');

      const num = btn.querySelector(`[data-thumb-idx="${slot}"]`);
      const img = btn.querySelector(`[data-thumb-img="${slot}"]`);
      const label = btn.querySelector(`[data-thumb-label="${slot}"]`);
      if (num) num.textContent = visible ? String(idx + 1).padStart(2, '0') : '';
      if (img && visible){
        const src = personaImage(p, 'cutout');
        if (locked) {
          img.removeAttribute('src');
          img.alt = '隐藏人格未解锁';
        } else {
          img.src = src;
          img.alt = '';
        }
      }
      if (label) label.textContent = visible ? (locked ? 'CLASSIFIED' : p.en) : '';
    });

    $$('.ps-dot', dots).forEach((dot, i) => {
      dot.classList.toggle('active', i === page);
    });
  }

  function setShowcase(idx, opts = {}){
    const n = PERSONA_LIST.length;
    const next = ((idx % n) + n) % n;
    const previousPage = Math.floor(showcaseIdx / SHOWCASE_PAGE_SIZE);
    showcaseIdx = next;
    const currentPage = Math.floor(showcaseIdx / SHOWCASE_PAGE_SIZE);
    updateShowcaseCard();
    updateShowcaseRail();
    if (opts.announce && previousPage !== currentPage) {
      toast(`PERSONA PAGE ${currentPage + 1}`);
    }
  }

  function stopShowcaseAutoplay(){
    if (showcaseTimer) {
      clearInterval(showcaseTimer);
      showcaseTimer = null;
    }
  }

  function startShowcaseAutoplay(){
    stopShowcaseAutoplay();
    showcaseTimer = setInterval(() => {
      if (showcasePaused) return;
      if (document.hidden) return;
      if (!document.body.classList.contains('on-cover')) return;
      setShowcase(showcaseIdx + 1, { transition: true });
    }, SHOWCASE_AUTOPLAY_MS);
  }

  function initShowcase(){
    if (!ensureShowcaseTemplate()) return;
    updateShowcaseCard();
    updateShowcaseRail();

    // 点击缩略卡 → 切换当前
    document.getElementById('ps-thumbs').addEventListener('click', (e) => {
      const btn = e.target.closest('.ps-thumb[data-idx]');
      if (!btn) return;
      const idx = Number(btn.dataset.idx);
      if (idx >= 0) setShowcase(idx);
    });

    // 左右箭头：整页翻（切到目标页第一张）
    document.querySelectorAll('.ps-arrow').forEach(b => {
      b.addEventListener('click', () => {
        const dir = Number(b.dataset.dir) || 1;
        const page = Math.floor(showcaseIdx / SHOWCASE_PAGE_SIZE);
        const nextPage = (page + dir + TOTAL_SHOWCASE_PAGES) % TOTAL_SHOWCASE_PAGES;
        setShowcase(nextPage * SHOWCASE_PAGE_SIZE, { announce: true });
      });
    });

    // 圆点：跳到对应页第一张
    document.getElementById('ps-dots').addEventListener('click', (e) => {
      const d = e.target.closest('.ps-dot[data-page]');
      if (!d) return;
      setShowcase(Number(d.dataset.page) * SHOWCASE_PAGE_SIZE);
    });

    const showcase = document.querySelector('.cover-showcase');
    if (showcase){
      showcase.addEventListener('pointerenter', () => { showcasePaused = true; });
      showcase.addEventListener('pointerleave', () => { showcasePaused = false; });
      showcase.addEventListener('focusin', () => { showcasePaused = true; });
      showcase.addEventListener('focusout', () => { showcasePaused = false; });
    }
    startShowcaseAutoplay();
  }

  initShowcase();
})();
