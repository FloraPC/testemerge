/**
 * app.js
 * -----------------------------------------------------------------------
 * Camada de interface: navegação entre telas, ligação dos botões,
 * HUD (pontuação / recorde / próximo objeto) e os overlays (pausa,
 * fim de jogo, vitória, enciclopédia educativa, tutorial). O motor de
 * física (game.js) não conhece nada disso — só recebe callbacks.
 * -----------------------------------------------------------------------
 */

(function () {
  let game = null;
  let pendingRecordAfterGameOver = false;
  let lastRunScore = 0;
  let lastRunHighestLevel = -1;

  // ---------------------------------------------------------------------
  // Utilitários de tela
  // ---------------------------------------------------------------------
  function $(id) { return document.getElementById(id); }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $('screen-' + id).classList.add('active');
    window.scrollTo(0, 0); // evita reabrir a nova tela "no meio" do scroll da tela anterior
  }

  function showOverlay(id) {
    const el = $('overlay-' + id);
    el.classList.add('active');
    el.setAttribute('aria-hidden', 'false');
    // Move o foco para dentro do overlay (acessibilidade via teclado).
    const focusable = el.querySelector('button, [href], input, select, textarea, [tabindex]');
    if (focusable) requestAnimationFrame(() => focusable.focus());
  }
  function hideOverlay(id) {
    $('overlay-' + id).classList.remove('active');
    $('overlay-' + id).setAttribute('aria-hidden', 'true');
  }

  function fmtScore(n) {
    return String(Math.max(0, Math.floor(n))).padStart(4, '0');
  }

  // ---------------------------------------------------------------------
  // HUD
  // ---------------------------------------------------------------------
  function updateRecordHUD() {
    const val = fmtScore(Storage.getTopScore());
    const hud = $('hud-record');
    const splash = $('splash-record');
    if (hud) hud.textContent = val;
    if (splash) splash.textContent = val;
  }

  function drawSplashArc() {
    LEVELS.forEach((lv, i) => { if ($('arc-icon-' + i)) drawMiniPreview('arc-icon-' + i, i); });
  }

  function drawMiniPreview(canvasId, levelIndex) {
    const c = $(canvasId);
    const ctx = c.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = c.clientWidth || 56;
    c.width = size * dpr;
    c.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const r = size * 0.36;
    Render.drawObject(ctx, { x: size / 2, y: size / 2, radius: r, scale: 1, levelIndex });
  }

  // ---------------------------------------------------------------------
  // Tela: Splash / Início
  // ---------------------------------------------------------------------
  function initSplash() {
    $('btn-start-game').addEventListener('click', () => {
      AudioFX.unlock();
      const name = Storage.getPlayerName();
      if (!name) { showScreen('name'); return; }
      goToTutorialOrGame();
    });
    $('btn-open-records').addEventListener('click', () => { renderRecords(); showScreen('records'); });
    $('btn-open-accessibility').addEventListener('click', () => { showScreen('accessibility'); });
    $('btn-open-howto').addEventListener('click', () => { showOverlayTutorial(true); });
    $('btn-open-about').addEventListener('click', () => { showScreen('about'); });
    updateRecordHUD();
    requestAnimationFrame(() => requestAnimationFrame(drawSplashArc));
    window.addEventListener('resize', debounce(drawSplashArc, 200));
  }

  function goToTutorialOrGame() {
    if (!Storage.hasSeenTutorial()) {
      showOverlayTutorial(false);
    } else {
      beginMatch();
    }
  }

  // ---------------------------------------------------------------------
  // Tela: Nome do jogador
  // ---------------------------------------------------------------------
  function initNameScreen() {
    const input = $('input-player-name');
    $('btn-name-continue').addEventListener('click', () => {
      const name = (input.value || 'Jogador').trim() || 'Jogador';
      Storage.setPlayerName(name);
      goToTutorialOrGame();
    });
    $('btn-name-skip').addEventListener('click', () => {
      Storage.setPlayerName('Jogador');
      goToTutorialOrGame();
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('btn-name-continue').click(); });
  }

  // ---------------------------------------------------------------------
  // Tela: Recordes
  // ---------------------------------------------------------------------
  function renderRecords() {
    const list = Storage.getRecords();
    const el = $('records-list');
    el.innerHTML = '';
    if (!list.length) {
      el.innerHTML = '<li class="records-empty">Ainda não há recordes. Jogue para ser o primeiro!</li>';
      return;
    }
    list.slice(0, 10).forEach((rec, i) => {
      const li = document.createElement('li');
      li.className = 'record-item';
      li.innerHTML = `<span class="record-rank">${i + 1}.</span>
        <span class="record-name">${escapeHtml(rec.name)}</span>
        <span class="record-score">${fmtScore(rec.score)}</span>`;
      el.appendChild(li);
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function initRecordsScreen() {
    $('btn-records-back').addEventListener('click', () => showScreen('splash'));
  }

  // ---------------------------------------------------------------------
  // Tela: Acessibilidade
  // ---------------------------------------------------------------------
  function initAccessibilityScreen() {
    const s = A11y.get();
    $('toggle-contrast').checked = !!s.highContrast;
    $('select-font-size').value = s.fontSize;
    $('toggle-reduce-motion').checked = !!s.reduceMotion;
    $('toggle-sound').checked = !!s.soundOn;
    $('range-volume').value = Math.round((s.volume ?? 0.7) * 100);
    $('toggle-vibration').checked = !!s.vibrationOn;

    $('toggle-contrast').addEventListener('change', (e) => A11y.update({ highContrast: e.target.checked }));
    $('select-font-size').addEventListener('change', (e) => A11y.update({ fontSize: e.target.value }));
    $('toggle-reduce-motion').addEventListener('change', (e) => A11y.update({ reduceMotion: e.target.checked }));
    $('toggle-sound').addEventListener('change', (e) => A11y.update({ soundOn: e.target.checked }));
    $('range-volume').addEventListener('input', (e) => A11y.update({ volume: e.target.value / 100 }));
    $('toggle-vibration').addEventListener('change', (e) => A11y.update({ vibrationOn: e.target.checked }));

    $('btn-accessibility-back').addEventListener('click', () => {
      // Volta para a tela de onde veio: pausa (se o jogo estiver ativo) ou splash.
      if (game && game.running) { showScreen('game'); showOverlay('pause'); }
      else showScreen('splash');
    });
  }

  // ---------------------------------------------------------------------
  // Tela: Sobre
  // ---------------------------------------------------------------------
  function initAboutScreen() {
    $('btn-about-back').addEventListener('click', () => showScreen('splash'));
  }

  // ---------------------------------------------------------------------
  // Tutorial
  // ---------------------------------------------------------------------
  function showOverlayTutorial(fromMenu) {
    const list = $('tutorial-steps');
    list.innerHTML = '';
    TUTORIAL_STEPS.forEach((step) => {
      const li = document.createElement('li');
      li.textContent = step;
      list.appendChild(li);
    });
    $('btn-tutorial-done').onclick = () => {
      Storage.markTutorialSeen();
      hideOverlay('tutorial');
      if (!fromMenu) beginMatch();
    };
    showOverlay('tutorial');
  }

  // ---------------------------------------------------------------------
  // Jogo — inicialização e HUD durante a partida
  // ---------------------------------------------------------------------
  function ensureGame() {
    if (game) return game;
    const canvas = $('game-canvas');
    game = new MergeGame(canvas, {
      onScoreChange: (score) => { $('hud-score').textContent = fmtScore(score); },
      onNextChange: (current, next) => { drawMiniPreview('hud-next-canvas', next); },
      onMerge: (levelIndex, lv) => { /* reservado para reações futuras */ },
      onGameOver: (result) => onGameOver(result),
      onWin: () => onWin()
    });
    window.addEventListener('resize', debounce(() => { if (game) game.resize(); }, 150));
    window.addEventListener('orientationchange', () => { if (game) setTimeout(() => game.resize(), 200); });

    // Hook de depuração opcional (não visível na UI): só é criado quando a
    // página é aberta com "?debug=1" na URL. Útil para suporte técnico do
    // MUDI-UEM inspecionar o estado do jogo sem afetar jogadores comuns.
    if (window.location.search.includes('debug=1')) {
      window.FMDebug = { game, Storage, A11y };
    }
    return game;
  }

  function debounce(fn, wait) {
    let t = null;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }

  function beginMatch() {
    showScreen('game');
    ensureGame();
    game.resize();
    game.reset();
    updateRecordHUD();
    $('hud-score').textContent = fmtScore(0);
    game.start();
  }

  function initGameScreen() {
    $('btn-pause').addEventListener('click', () => {
      if (!game) return;
      game.pause();
      showOverlay('pause');
    });
    $('btn-hud-sound').addEventListener('click', () => {
      const s = A11y.get();
      A11y.update({ soundOn: !s.soundOn });
      $('btn-hud-sound').textContent = A11y.get().soundOn ? '🔊' : '🔇';
      $('btn-hud-sound').setAttribute('aria-label', A11y.get().soundOn ? 'Desativar som' : 'Ativar som');
    });
    $('btn-hud-info').addEventListener('click', () => openEncyclopedia());

    // Pausa
    $('btn-pause-continue').addEventListener('click', () => { hideOverlay('pause'); game.resume(); });
    $('btn-pause-restart').addEventListener('click', () => { hideOverlay('pause'); game.reset(); game.resume(); updateRecordHUD(); $('hud-score').textContent = fmtScore(0); });
    $('btn-pause-settings').addEventListener('click', () => { hideOverlay('pause'); showScreen('accessibility'); });
    $('btn-pause-menu').addEventListener('click', () => { hideOverlay('pause'); game.stop(); showScreen('splash'); updateRecordHUD(); });
  }

  // ---------------------------------------------------------------------
  // Fim de jogo
  // ---------------------------------------------------------------------
  function onGameOver(result) {
    lastRunScore = result.score;
    lastRunHighestLevel = result.highestLevel;
    const isRecord = Storage.isNewRecord(result.score);

    $('gameover-score').textContent = fmtScore(result.score);
    $('gameover-highest').textContent = result.highestLevel >= 0 ? LEVELS[result.highestLevel].name : '—';
    $('gameover-record-badge').style.display = isRecord ? 'block' : 'none';

    const hasName = !!Storage.getPlayerName();
    $('gameover-name-row').style.display = hasName ? 'none' : 'flex';

    pendingRecordAfterGameOver = true;
    showOverlay('gameover');
  }

  function commitRecord() {
    if (!pendingRecordAfterGameOver) return;
    let name = Storage.getPlayerName();
    const nameInput = $('input-gameover-name');
    if (!name && nameInput && nameInput.value.trim()) {
      name = nameInput.value.trim();
      Storage.setPlayerName(name);
    }
    if (!name) name = 'Jogador';
    Storage.addRecord(name, lastRunScore);
    pendingRecordAfterGameOver = false;
    updateRecordHUD();
  }

  function initGameOverScreen() {
    $('btn-gameover-again').addEventListener('click', () => {
      commitRecord();
      hideOverlay('gameover');
      beginMatch();
    });
    $('btn-gameover-records').addEventListener('click', () => {
      commitRecord();
      hideOverlay('gameover');
      renderRecords();
      showScreen('records');
    });
    $('btn-gameover-menu').addEventListener('click', () => {
      commitRecord();
      hideOverlay('gameover');
      showScreen('splash');
      updateRecordHUD();
    });
  }

  // ---------------------------------------------------------------------
  // Vitória (criar "Pessoa" pela primeira vez na partida)
  // ---------------------------------------------------------------------
  function onWin() {
    const wrap = $('win-chain');
    wrap.innerHTML = '';
    LEVELS.forEach((lv, i) => {
      const item = document.createElement('div');
      item.className = 'chain-item';
      const canvas = document.createElement('canvas');
      canvas.className = 'chain-icon';
      canvas.id = 'win-icon-' + i;
      const label = document.createElement('span');
      label.textContent = lv.name;
      item.appendChild(canvas);
      item.appendChild(label);
      wrap.appendChild(item);
    });
    showOverlay('win');
    // desenha os ícones após o overlay estar visível (dimensões corretas)
    requestAnimationFrame(() => LEVELS.forEach((lv, i) => drawMiniPreview('win-icon-' + i, i)));
  }

  function initWinScreen() {
    $('btn-win-continue').addEventListener('click', () => { hideOverlay('win'); game.resume(); });
    $('btn-win-finish').addEventListener('click', () => {
      hideOverlay('win');
      onGameOver({ score: game.score, highestLevel: game.highestLevelReached });
      game.stop();
    });
  }

  // ---------------------------------------------------------------------
  // Enciclopédia educativa (ficha de cada estrutura)
  // ---------------------------------------------------------------------
  function openEncyclopedia() {
    if (game) game.pause();
    const grid = $('encyclopedia-grid');
    const detail = $('encyclopedia-detail');
    detail.classList.remove('active');
    grid.innerHTML = '';
    LEVELS.forEach((lv, i) => {
      const btn = document.createElement('button');
      btn.className = 'encyclopedia-item';
      btn.setAttribute('aria-label', 'Ver informações sobre ' + lv.name);
      const canvas = document.createElement('canvas');
      canvas.className = 'encyclopedia-icon';
      canvas.id = 'ency-icon-' + i;
      const label = document.createElement('span');
      label.textContent = lv.name;
      btn.appendChild(canvas);
      btn.appendChild(label);
      btn.addEventListener('click', () => showEncyclopediaDetail(i));
      grid.appendChild(btn);
    });
    showOverlay('encyclopedia');
    requestAnimationFrame(() => LEVELS.forEach((lv, i) => drawMiniPreview('ency-icon-' + i, i)));
  }

  function showEncyclopediaDetail(i) {
    const lv = LEVELS[i];
    $('encyclopedia-detail-title').textContent = lv.name;
    $('encyclopedia-detail-desc').textContent = lv.description;
    $('encyclopedia-detail-fact').textContent = lv.curiosity;
    $('encyclopedia-detail').classList.add('active');
    requestAnimationFrame(() => drawMiniPreview('encyclopedia-detail-icon', i));
  }

  function initEncyclopedia() {
    $('btn-encyclopedia-close').addEventListener('click', () => {
      hideOverlay('encyclopedia');
      if (game && game.running) game.resume();
    });
    $('btn-encyclopedia-back').addEventListener('click', () => $('encyclopedia-detail').classList.remove('active'));
  }

  // ---------------------------------------------------------------------
  // Inicialização geral
  // ---------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    A11y.init();
    initSplash();
    initNameScreen();
    initRecordsScreen();
    initAccessibilityScreen();
    initAboutScreen();
    initGameScreen();
    initGameOverScreen();
    initWinScreen();
    initEncyclopedia();

    const input = $('input-player-name');
    if (input) input.value = Storage.getPlayerName();

    showScreen('splash');

    // Registra o Service Worker (funcionamento offline / instalação PWA).
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch(() => {
          // Falha silenciosa: o jogo continua funcionando online normalmente.
        });
      });
    }
  });
})();
