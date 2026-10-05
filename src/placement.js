"use strict";
/** 15-question stratified placement. All scoring is local and uncalibrated. */
window.ArcoPlacement = (() => {
  const A = window.ARCO, E = A.escape, $ = s => document.querySelector(s);
  const TOTAL = 15;
  const TIERS = [
    { title: '識譜與節奏', from: 1, to: 20 },
    { title: '音程與調性', from: 21, to: 40 },
    { title: '和弦與進行', from: 41, to: 60 },
    { title: '延伸與調式', from: 61, to: 80 },
    { title: '樂句與進階和聲', from: 81, to: 100 }
  ];
  let run = null;
  const fingerprint = q => q.prompt.normalize('NFKC').replace(/\s+/g, '').toLowerCase();
  const allQuestions = [...A.Q.values()];
  const token = () => crypto.getRandomValues(new Uint32Array(3)).join('-');
  function seen() { A.getState().onboardingSeen = true; A.save(); }
  function close() { for (const id of ['welcome', 'settings']) { const d = $('#' + id); if (d?.open) d.close(); } }
  function welcome() {
    const d = $('#welcome');
    if (!A.getState().placement && A.getState().placementRecord && location.hash!=='#duel') { start(); return; }
    if (A.hasStart() || ['#placement', '#duel'].includes(location.hash) || !d) return;
    d.innerHTML = `<div class="welcome-art" aria-hidden="true"><span>ARCO</span><div class="welcome-emblem">${A.brandMark('large')}</div><div class="welcome-art-caption">把樂理，帶進演奏。</div></div><div class="welcome-copy"><h1 id="welcome-title">從適合你的起點開始。</h1><p>15 題找到程度，也可直接從第 1 級學起。</p><div class="welcome-facts"><span>${A.icon('clock')}測驗不限時</span><span>${A.icon('check')}每關答對 8 題晉級</span></div><button class="btn" data-action="placement-start" autofocus>開始 15 題程度測驗 ${A.icon('arrow')}</button><button class="btn secondary" data-action="start-from-first">不測驗，從第 1 級開始</button><button class="text-button welcome-import" data-action="import">匯入舊進度</button></div>`;
    d.showModal();
  }

  /** Prefer never-exposed questions. Only reuse least-recently seen items when
   *  this tier/type pool has no unseen item, with prompt-level deduplication. */
  function sample() {
    const history = A.getState().placementSeen || [];
    const seenRank = new Map();
    history.forEach((id, i) => { const q = A.Q.get(id); if (q) seenRank.set(fingerprint(q), i); });
    const usedIds = new Set(), usedPrompts = new Set(), questions = [];
    TIERS.forEach((tier, tierIndex) => {
      const usedLevels = new Set(), usedChapters = new Set();
      const pool = allQuestions.filter(q => q.level >= tier.from && q.level <= tier.to);
      const types = [q => q.difficulty === 1, q => q.difficulty === 2, q => q.difficulty >= 3];
      types.forEach(matchesType => {
        let candidates = pool.filter(q => matchesType(q) && !usedIds.has(q.id) && !usedPrompts.has(fingerprint(q)));
        if (!candidates.length) throw Error('程度測驗題池不足，請重新載入完整網站檔案。');
        const fresh = candidates.filter(q => !seenRank.has(fingerprint(q)));
        if (fresh.length) candidates = fresh;
        else { const oldest = Math.min(...candidates.map(q => seenRank.get(fingerprint(q)))); candidates = candidates.filter(q => seenRank.get(fingerprint(q)) === oldest); }
        const novelLevel = candidates.filter(q => !usedLevels.has(q.level));
        if (novelLevel.length) candidates = novelLevel;
        const novelChapter = candidates.filter(q => !usedChapters.has(Math.floor((q.level - 1) / 10)));
        if (novelChapter.length) candidates = novelChapter;
        const q = A.shuffle(candidates)[0];
        questions.push({ ...q, tier: tierIndex, band: Math.floor((q.level - 1) / 10), order: A.shuffle([0, 1, 2, 3]) });
        usedIds.add(q.id); usedPrompts.add(fingerprint(q)); usedLevels.add(q.level); usedChapters.add(Math.floor((q.level - 1) / 10));
      });
    });
    return questions;
  }
  function recordExposure() {
    const q = current();
    if (!q || run.exposed.has(q.id)) return;
    run.exposed.add(q.id);
    const s = A.getState();
    s.placementSeen = [...(s.placementSeen || []).filter(id => id !== q.id), q.id].slice(-1000);
    A.save();
  }
  function restoreCompleted(){
    const record=A.getState().placementRecord;
    if(!record||!Array.isArray(record.responses)||record.responses.length!==TOTAL)return false;
    const questions=record.responses.map(r=>{const q=A.Q.get(r.qid);return q?{...q,tier:Math.floor((q.level-1)/20),band:Math.floor((q.level-1)/10),order:[...r.order]}:null;});
    if(questions.some(q=>!q))return false;
    run={id:record.id,phase:'result',questions,index:TOTAL,selection:null,responses:record.responses.map((r,i)=>({...r,level:questions[i].level,tier:questions[i].tier,band:questions[i].band,correct:r.choice===questions[i].correct})),committed:new Set(questions.map(q=>q.id)),exposed:new Set(questions.map(q=>q.id)),accepted:false,busy:false,reviewFilter:'wrong'};
    finish(false);return true;
  }
  function start() {
    if (run?.phase==='result' || A.getState().placement || restoreCompleted()) { close(); A.go('placement'); return; }
    if (active()) {
      A.confirmAction({title:'重新開始程度測驗？',message:'目前未完成的作答將不計入結果。已看過的題目仍保留，下次優先抽取新題目。',confirmText:'重新抽題',onConfirm:()=>{run=null;start();}});
      return;
    }
    try {
      const questions = sample();
      seen(); close(); A.stopAudio();
      run = { id: token(), phase: 'test', questions, index: 0, selection: null, responses: [],
        committed: new Set(), exposed: new Set(), accepted: false, busy: false, reviewFilter: 'wrong' };
      A.go('placement');
    } catch (err) { A.notify(err.message || '無法開始測驗，請重新載入網站。'); }
  }
  function current() { return run?.questions[run.index]; }
  function questionToken() { return run && current() ? run.id + ':' + current().id : ''; }
  function answer(choice, expectedToken = questionToken()) {
    if (!active() || run.busy || expectedToken !== questionToken() || run.committed.has(current().id) || !Number.isInteger(choice) || choice < -1 || choice > 3) return;
    run.selection = choice; render(); $('#placement-next')?.focus({ preventScroll: true });
  }
  function next(expectedToken = questionToken()) {
    if (!active() || run.busy || expectedToken !== questionToken() || run.selection === null) return;
    const q = current();
    if (!q || run.committed.has(q.id)) return;
    run.busy = true; run.committed.add(q.id);
    run.responses.push({ qid: q.id, level: q.level, band: q.band, tier: q.tier, choice: run.selection, order: [...q.order], correct: run.selection === q.correct });
    run.index++; run.selection = null; A.stopAudio();
    if (run.responses.length === TOTAL) finish();
    run.busy = false; render(); $('#placement-title')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function finish(persist = true) {
    run.phase = 'result';
    run.bandScores = TIERS.map((tier, i) => ({ ...tier, correct: run.responses.filter(r => r.tier === i && r.correct).length, total: 3 }));
    let consecutive = 0;
    for (const tier of run.bandScores) { if (tier.correct < 2) break; consecutive++; }
    // A later correct answer does not erase an earlier prerequisite gap.
    run.start = consecutive === 0 ? 1 : consecutive * 20;
    run.correct = run.responses.filter(r => r.correct).length;
    run.cautious = run.bandScores.slice(consecutive + 1).some(t => t.correct >= 2);
    if(persist){A.getState().placementRecord={id:run.id,at:Date.now(),responses:run.responses.map(r=>({qid:r.qid,choice:r.choice,order:[...r.order]}))};A.save();}
  }
  function render() {
    if(!run)restoreCompleted();
    if(!run && A.getState().placement){
      const start=A.getState().placement.start;
      A.setContent(`<section class="placement-intro"><div class="feature-mark">${A.icon('check')}</div><h1>已完成程度測驗</h1><p>測驗起點：第 ${start} 級。</p><div class="studio-actions"><button class="btn" data-action="lesson" data-id="${A.unlock()}">繼續學習 ${A.icon('arrow')}</button><a class="text-button" href="#courses">查看課程</a></div></section>`);return;
    }
    if (!run) {
      A.setContent(`<div class="placement-intro"><div class="feature-mark">${A.icon('placement')}</div><h1>15 題，找到你的起點。</h1><p>題目涵蓋五個難度。不限時，不會的題目可選「還不熟悉」。</p><div class="studio-actions"><button class="btn" data-action="placement-start">開始測驗 ${A.icon('arrow')}</button>${!A.hasStart()?'<button class="btn secondary" data-action="start-from-first">從第 1 級開始</button>':''}<a class="text-button" href="#home">返回練習室</a></div></div>`);
      return;
    }
    if (run.phase === 'result') { result(); return; }
    recordExposure();
    const q = current(), t = questionToken(), selected = run.selection !== null, tier = TIERS[q.tier];
    A.setContent(`<div class="quiz-wrap placement-wrap"><div class="quiz-top"><button class="text-button" data-action="placement-cancel">${A.icon('back')}返回課程</button><span class="badge">${A.icon('shuffle')}不限時</span></div><div class="placement-progress"><span>第 ${run.index + 1} / ${TOTAL} 題</span><span>${E(tier.title)} · 範圍 ${tier.from}–${tier.to} 級</span></div><div class="placement-meter" role="progressbar" aria-label="程度測驗進度" aria-valuemin="0" aria-valuemax="15" aria-valuenow="${run.responses.length}">${Array.from({length: TOTAL}, (_, i) => `<i class="${i < run.index ? 'done' : i === run.index ? 'current' : ''}"></i>`).join('')}</div><article class="quiz-card"><div class="question-label"><span>${E(A.D.chapters[q.band].title)}</span><span>${E(q.phase || '觀念應用')}</span></div><h1 id="placement-title" tabindex="-1">${E(q.prompt)}</h1>${q.staff ? A.staffView(q.staff) : ''}${q.audio ? A.audioCard(q.audio, 'question', q.id) : ''}<div class="options" role="group" aria-label="程度測驗選項">${q.order.map((c, i) => `<button class="option ${run.selection === c ? 'current' : ''}" data-action="placement-answer" data-choice="${c}" data-token="${E(t)}" aria-pressed="${run.selection === c}"><span class="letter">${'ABCD'[i]}</span><span class="option-copy">${E(q.options[c])}</span></button>`).join('')}</div><div class="quiz-bottom"><button class="text-button ${run.selection === -1 ? 'selected-unknown' : ''}" data-action="placement-unknown" data-token="${E(t)}">${run.selection === -1 ? '已選：還不熟悉' : '還不熟悉這個觀念'}</button><button id="placement-next" class="btn" data-action="placement-next" data-token="${E(t)}" ${selected ? '' : 'disabled'}>${run.index === TOTAL - 1 ? '查看建議起點' : '確認，下一題'} ${A.icon('arrow')}</button></div></article></div>`);
  }
  function reviewAnswers() {
    const wrong = run.responses.filter(r => !r.correct).length;
    const filter = run.reviewFilter === 'all' ? 'all' : 'wrong';
    const rows = run.responses.map((r, index) => ({r, index})).filter(({r}) => filter === 'all' || !r.correct);
    return `<section class="placement-review"><div class="placement-review-heading"><h2>作答回顧</h2><div class="review-filter" role="group" aria-label="篩選作答紀錄"><button class="btn ${filter === 'wrong' ? '' : 'secondary'} small" data-action="placement-review-filter" data-filter="wrong" aria-pressed="${filter === 'wrong'}">錯題 ${wrong}</button><button class="btn ${filter === 'all' ? '' : 'secondary'} small" data-action="placement-review-filter" data-filter="all" aria-pressed="${filter === 'all'}">全部 ${TOTAL} 題</button></div></div>${rows.length ? rows.map(({r,index}) => {
      // choice is the original option index; never interpret it as the shuffled A/B/C/D position.
      const q = run.questions.find(item => item.id === r.qid);
      const choice = Number.isInteger(r.choice) && r.choice >= 0 && r.choice < q.options.length ? q.options[r.choice] : '還不熟悉';
      return `<article class="placement-answer" data-review-index="${index}" data-qid="${E(q.id)}"><div class="placement-answer-head"><span class="badge">${A.icon(r.correct ? 'check' : 'review')}${r.correct ? '答對' : '待複習'}</span><span class="hint">第 ${q.level} 級</span></div><h3>${index + 1}. ${E(q.prompt)}</h3>${q.staff ? A.staffView(q.staff) : ''}<div class="answer-comparison">${!r.correct ? `<p class="review-your-answer"><span>你的答案</span><strong>${E(choice)}</strong></p>` : ''}<p class="review-correct-answer"><span>正確答案</span><strong>${E(q.options[q.correct])}</strong></p></div><p class="review-explanation">${E(q.explanation)}</p>${q.audio ? A.audioCard(q.audio, 'question', q.id) : ''}</article>`;
    }).join('') : '<p class="review-empty">這次全部答對。</p>'}</section>`;
  }
  function result() {
    const previous = A.getState().placement?.start || 1, effective = Math.max(previous, run.start);
    A.setContent(`<div class="quiz-wrap placement-result"><section class="result-hero"><div class="score-circle"><strong>${run.start}</strong><span>建議起始級數</span></div><div><h1>測驗完成</h1><p>答對 ${run.correct} / ${TOTAL} 題${run.cautious ? '，建議先補穩前段觀念。' : '。'}</p>${A.getState().placement ? `<button class="btn light" data-action="lesson" data-id="${A.unlock()}">繼續學習 ${A.icon('arrow')}</button>` : `<button class="btn light" data-action="placement-accept" data-run="${E(run.id)}">從第 ${run.start} 級開始 ${A.icon('arrow')}</button>`}</div></section><section class="placement-access"><div class="feature-mark">${A.icon('unlock')}</div><div><h2>第 1–${effective} 級開放複習</h2><p>${effective < 100 ? '從第 ' + effective + ' 級起，每關答對 8 題即可解鎖下一關。' : '已開放全部課程，可繼續完成挑戰。'}${previous > run.start ? '你原有的開放範圍不變。' : ''}</p></div></section><div class="placement-explainer"><h2>各階段表現</h2><div class="placement-tier-results">${run.bandScores.map(b => `<div><span>${b.from}–${b.to} 級</span><strong>${b.correct}<small> / 3</small></strong><span>${E(b.title)}</span><span class="tier-verdict">${A.icon(b.correct >= 2 ? 'check' : 'book')}${b.correct >= 2 ? '達標' : '待加強'}</span></div>`).join('')}</div><details class="placement-method"><summary>起點如何決定？</summary><p>每階段至少答對 2 / 3 題才往後推進；前段有缺口時先補強。15 題僅供學習分流，不是正式能力檢定。</p></details></div>${reviewAnswers()}<div class="studio-actions"><a class="text-button" href="#courses">查看課程 ${A.icon('arrow')}</a></div></div>`);
  }

  function accept(expectedRun = run?.id) {
    if (!run || run.phase !== 'result' || run.accepted || expectedRun !== run.id) return;
    run.accepted = true;
    const s = A.getState(), target = run.start;
    s.placement = { start: Math.max(s.placement?.start || 1, target), suggested: target, method: 'stratified-15-v1', at: Date.now(), total: TOTAL, correct: run.correct, weak: [...new Set(run.responses.filter(r => !r.correct).map(r => r.level))], bandScores: run.bandScores.map(t => t.correct) };
    s.testMode = false; s.learningPath = 'placement'; s.lastLevel = target; s.onboardingSeen = true;
    const openThrough = s.placement.start;
    run = null; A.save(); A.go('lesson/' + target);
    A.notify(`已儲存測驗起點。`);
  }
  function active() { return !!run && run.phase === 'test'; }
  function leaveRoute(force = false) {
    // ARCO's shared route guard owns the visible confirmation.
    if (active() && !force) return false;
    run = null; return true;
  }
  function action(a, el) {
    if (a === 'placement-review-filter' && run?.phase === 'result') { run.reviewFilter = el.dataset.filter === 'all' ? 'all' : 'wrong'; result(); }
    else if (a === 'placement-start') start();
    else if (a === 'placement-answer') answer(Number(el.dataset.choice), el.dataset.token);
    else if (a === 'placement-unknown') answer(-1, el.dataset.token);
    else if (a === 'placement-next') next(el.dataset.token);
    else if (a === 'placement-accept') accept(el.dataset.run);
    else if (a === 'placement-cancel') A.go('courses');
    else if (a === 'placement-discard') { run = null; A.go('home'); }
  }

  document.addEventListener('keydown', e => {
    if (location.hash !== '#placement' || !active() || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.repeat || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
    if (/^[1-4]$/.test(e.key)) { e.preventDefault(); answer(current().order[Number(e.key) - 1]); }
  });
  $('#welcome')?.addEventListener('cancel', e => { if(!A.hasStart())e.preventDefault(); });
  setTimeout(() => { if (location.hash === '#placement') render(); else welcome(); }, 0);
  return { welcome, start, render, action, active, leaveRoute, current, getRun: () => run, answer, next, accept, sample, questionToken, tiers: TIERS };
})();
