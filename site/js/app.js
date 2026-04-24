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
    return score;
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
        <button class="btn-ghost" id="r-share">[ SHARE · 复制分享文案 ]</button>
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
    $('#r-share').addEventListener('click', () => {
      const txt = `我是「${p.cn}」（${p.en}）\n${p.punch}\n—— 来测测你的暗区人格：18 种，你会是哪一种？`;
      navigator.clipboard?.writeText(txt).then(() => {
        toast('已复制分享文案');
      }).catch(() => alert(txt));
    });

    // pair-item 点击 → 弹层
    $$('.pair-item').forEach(el => {
      el.addEventListener('click', () => openModal(el.dataset.id));
    });
  }

  function pairItem(id){
    const p = PERSONAS[id];
    return `
      <div class="pair-item" data-id="${id}">
        <img src="${p.img}" alt=""/>
        <div>
          <div class="pi-cn">${p.cn}</div>
          <div class="pi-en">${p.en}</div>
        </div>
      </div>
    `;
  }

  /* ------------ 图鉴 ------------ */
  let codexFilter = 'all';
  function renderCodex(){
    const grid = $('#codex-grid');
    const list = Object.values(PERSONAS).filter(p => codexFilter === 'all' || p.rarity === codexFilter);
    grid.innerHTML = list.map((p, i) => `
      <article class="codex-card" data-id="${p.id}" style="animation-delay:${i*40}ms">
        <div class="cc-img"><img src="${p.img}" alt="${p.cn}" loading="lazy"/></div>
        <div class="cc-body">
          <div class="cc-cn">${p.cn}</div>
          <div class="cc-en">${p.en}</div>
          <div class="cc-meta">
            <span class="cc-rare ${p.rarity}">${p.rarity}</span>
            <span class="cc-code">${p.code}</span>
          </div>
        </div>
      </article>
    `).join('');
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
    $('#modal-card').innerHTML = `
      <button class="modal-close" aria-label="关闭" data-close>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div class="m-hero"><img src="${p.img}" alt=""/></div>
      <div class="m-body">
        <div class="result-eyebrow">${p.code} · ${p.rarity === '普通' ? 'COMMON' : p.rarity === '稀有' ? 'RARE' : 'HIDDEN'}</div>
        <h2 class="m-name">${p.cn}</h2>
        <div class="m-en">${p.en}</div>
        <div class="m-punch">"${p.punch}"</div>
        <p class="m-sum">${p.summary}</p>
        <ul class="vibes">
          ${p.vibes.map(v=>`<li>${v}</li>`).join('')}
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
  const PERSONA_LIST = Object.values(PERSONAS);
  const RARITY_EN = { '普通':'COMMON', '稀有':'RARE', '隐藏':'HIDDEN' };
  const SHOWCASE_PAGE_SIZE = 5;
  const TOTAL_SHOWCASE_PAGES = Math.ceil(PERSONA_LIST.length / SHOWCASE_PAGE_SIZE);
  let showcaseIdx = Math.floor(Math.random() * PERSONA_LIST.length);

  const escHtml = (s) => String(s).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

  function renderShowcaseCard(){
    const card = document.getElementById('ps-card');
    if (!card) return;
    const p = PERSONA_LIST[showcaseIdx];
    const features = p.features || [];
    const idxStr = String(showcaseIdx + 1).padStart(2, '0');
    const totalStr = String(PERSONA_LIST.length).padStart(2, '0');

    // 右侧刻度：生成 18 个小段，当前高亮
    const scaleMarks = PERSONA_LIST.map((_, i) => `<i class="${i === showcaseIdx ? 'on' : ''}"></i>`).join('');

    card.innerHTML = `
      <span class="ps-corner-bl"></span><span class="ps-corner-br"></span>
      <div class="ps-head">
        <span class="ps-label">PERSONA // ${escHtml(p.code)}</span>
        <span class="ps-badge"><i></i>DARK ZONE</span>
      </div>

      <div class="ps-left-col">
        <div class="ps-title">
          <div class="ps-en">${escHtml(p.en)}</div>
          <div class="ps-cn">${escHtml(p.cn)}</div>
          <div class="ps-code">${RARITY_EN[p.rarity] || 'COMMON'} · ${escHtml(p.rarity)}款</div>
        </div>
        <ul class="ps-features">
          ${features.map(f => `
            <li class="ps-feature">
              <span class="ps-ico"><svg><use href="#ico-${escHtml(f.icon)}"/></svg></span>
              <span class="ps-txt">
                <span class="ps-en-s">${escHtml(f.en)}</span>
                <span class="ps-cn-s">${escHtml(f.cn)}</span>
              </span>
            </li>
          `).join('')}
        </ul>
      </div>

      <div class="ps-illust">
        <img src="${p.img}" alt="${escHtml(p.cn)}"/>
        <div class="ps-scale">
          <b>${idxStr}</b>
          <span>/ ${totalStr}</span>
          ${scaleMarks}
        </div>
      </div>
    `;
  }

  function renderShowcaseRail(){
    const thumbs = document.getElementById('ps-thumbs');
    const dots   = document.getElementById('ps-dots');
    if (!thumbs || !dots) return;

    const page = Math.floor(showcaseIdx / SHOWCASE_PAGE_SIZE);
    const start = page * SHOWCASE_PAGE_SIZE;
    const end = Math.min(start + SHOWCASE_PAGE_SIZE, PERSONA_LIST.length);

    let thumbHtml = '';
    for (let i = start; i < end; i++){
      const p = PERSONA_LIST[i];
      thumbHtml += `
        <button class="ps-thumb ${i === showcaseIdx ? 'active' : ''}" data-idx="${i}" aria-label="${escHtml(p.cn)}">
          <img src="${p.img}" alt="" loading="lazy"/>
          <span class="ps-thumb-label">${escHtml(p.en)}</span>
        </button>
      `;
    }
    // 不足 5 张时补占位，保持 grid 对齐
    for (let i = end - start; i < SHOWCASE_PAGE_SIZE; i++){
      thumbHtml += `<span class="ps-thumb" style="visibility:hidden" aria-hidden="true"></span>`;
    }
    thumbs.innerHTML = thumbHtml;

    let dotHtml = '';
    for (let i = 0; i < TOTAL_SHOWCASE_PAGES; i++){
      dotHtml += `<button class="ps-dot ${i === page ? 'active' : ''}" data-page="${i}" aria-label="第 ${i+1} 页"></button>`;
    }
    dots.innerHTML = dotHtml;
  }

  function setShowcase(idx){
    const n = PERSONA_LIST.length;
    showcaseIdx = ((idx % n) + n) % n;
    renderShowcaseCard();
    renderShowcaseRail();
  }

  function initShowcase(){
    if (!document.getElementById('ps-card')) return;
    renderShowcaseCard();
    renderShowcaseRail();

    // 点击缩略卡 → 切换当前
    document.getElementById('ps-thumbs').addEventListener('click', (e) => {
      const btn = e.target.closest('.ps-thumb[data-idx]');
      if (!btn) return;
      setShowcase(Number(btn.dataset.idx));
    });

    // 左右箭头：整页翻（切到目标页第一张）
    document.querySelectorAll('.ps-arrow').forEach(b => {
      b.addEventListener('click', () => {
        const dir = Number(b.dataset.dir) || 1;
        const page = Math.floor(showcaseIdx / SHOWCASE_PAGE_SIZE);
        const nextPage = (page + dir + TOTAL_SHOWCASE_PAGES) % TOTAL_SHOWCASE_PAGES;
        setShowcase(nextPage * SHOWCASE_PAGE_SIZE);
      });
    });

    // 圆点：跳到对应页第一张
    document.getElementById('ps-dots').addEventListener('click', (e) => {
      const d = e.target.closest('.ps-dot[data-page]');
      if (!d) return;
      setShowcase(Number(d.dataset.page) * SHOWCASE_PAGE_SIZE);
    });
  }

  initShowcase();
})();
