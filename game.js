/**
 * game.js
 * -----------------------------------------------------------------------
 * Motor do jogo: física simples de círculos (gravidade + resolução de
 * colisão por correção de posição + impulso), mecânica de soltar
 * objetos, fusão de pares iguais, pontuação, linha de perigo e condição
 * de vitória. Não depende de nenhuma biblioteca externa — decisão
 * deliberada para manter o PWA leve e 100% confiável offline.
 *
 * O motor é desacoplado da interface (app.js): ele expõe callbacks
 * (onScoreChange, onMerge, onGameOver, onWin) para que a camada de UI
 * reaja sem que a física precise conhecer o DOM.
 * -----------------------------------------------------------------------
 */

class MergeGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;

    this.objects = [];
    this.particles = [];
    this.floatingLabels = [];
    this.nextId = 1;

    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.highestLevelReached = -1;
    this.wonOnce = false;

    this.running = false;
    this.paused = false;
    this.gameOverFired = false;

    this.aimX = 0;
    this.dropCooldown = 0;
    this.canDrop = true;
    this.currentLevel = this._pickSpawnLevel();
    this.nextLevel = this._pickSpawnLevel();

    this.dangerRatio = 0.20;     // posição vertical da linha de perigo
    this.dangerLimitMs = 2000;   // tempo tolerado acima da linha
    this.dangerPulse = 0;
    this.overDangerMs = 0;

    this._lastTime = null;
    this._resizeObserver = null;
    this._boundLoop = this._loop.bind(this);

    this._setupInput();
    this.resize();
  }

  // ------------------------------------------------------------------
  // Configuração de tamanho responsivo
  // ------------------------------------------------------------------
  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(240, rect.width);
    this.height = Math.max(320, rect.height);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.floorY = this.height - 6;
    this.dangerY = this.height * this.dangerRatio;
    this.spawnY = Math.max(26, this.dangerY * 0.55);
    this.gravity = this.height * 2.35;

    if (this.aimX === 0) this.aimX = this.width / 2;
    this.aimX = Math.min(Math.max(this.aimX, this._radiusFor(this.currentLevel)), this.width - this._radiusFor(this.currentLevel));
  }

  _radiusFor(levelIndex) {
    // radiusRatio já é a fração desejada da largura da área de jogo —
    // sem multiplicador extra, para que o maior objeto (Pessoa, ~0.21)
    // sempre caiba com folga mesmo nas telas mais estreitas.
    return LEVELS[levelIndex].radiusRatio * this.width;
  }

  // ------------------------------------------------------------------
  // Entrada do jogador (mouse + toque) — "arrastar para mirar, soltar
  // para lançar" funciona igualmente bem com o dedo ou com o mouse.
  // ------------------------------------------------------------------
  _setupInput() {
    const getX = (evt) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
      return clientX - rect.left;
    };

    const onMove = (evt) => {
      if (!this.running || this.paused) return;
      const x = getX(evt);
      const r = this._radiusFor(this.currentLevel);
      this.aimX = Math.min(Math.max(x, r + 4), this.width - r - 4);
    };

    const onDown = (evt) => {
      if (!this.running || this.paused) return;
      this._pointerActive = true;
      onMove(evt);
    };

    const onUp = (evt) => {
      if (!this._pointerActive) return;
      this._pointerActive = false;
      this.drop();
    };

    this.canvas.addEventListener('mousemove', onMove);
    this.canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    this.canvas.addEventListener('touchmove', (e) => { onMove(e); e.preventDefault(); }, { passive: false });
    this.canvas.addEventListener('touchstart', (e) => { onDown(e); e.preventDefault(); }, { passive: false });
    this.canvas.addEventListener('touchend', (e) => { onUp(e); e.preventDefault(); }, { passive: false });

    // Teclado: setas para mirar, espaço/enter para soltar (acessibilidade).
    this._keyHandler = (e) => {
      if (!this.running || this.paused) return;
      const r = this._radiusFor(this.currentLevel);
      const step = this.width * 0.04;
      if (e.key === 'ArrowLeft') { this.aimX = Math.max(r + 4, this.aimX - step); }
      else if (e.key === 'ArrowRight') { this.aimX = Math.min(this.width - r - 4, this.aimX + step); }
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.drop(); }
    };
    window.addEventListener('keydown', this._keyHandler);
  }

  _pickSpawnLevel() {
    return SPAWN_POOL[Math.floor(Math.random() * SPAWN_POOL.length)];
  }

  // ------------------------------------------------------------------
  // Ciclo de vida
  // ------------------------------------------------------------------
  start() {
    this.running = true;
    this.paused = false;
    this._lastTime = null;
    requestAnimationFrame(this._boundLoop);
  }

  pause() { this.paused = true; }
  // O laço requestAnimationFrame continua vivo enquanto `running` for
  // verdadeiro (ver _loop) — por isso resume() só precisa reabilitar as
  // atualizações; chamar requestAnimationFrame aqui de novo duplicaria o
  // laço e faria a física rodar em velocidade dobrada.
  resume() { this.paused = false; }

  // Encerra o laço por completo (usado ao voltar ao menu ou no fim de
  // jogo). O listener de teclado permanece ativo — ele já verifica
  // `running`/`paused` internamente — para que start() possa religar o
  // laço mais tarde sem precisar recriar handlers.
  stop() {
    this.running = false;
  }

  reset() {
    this.objects = [];
    this.particles = [];
    this.floatingLabels = [];
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.highestLevelReached = -1;
    this.wonOnce = false;
    this.gameOverFired = false;
    this.overDangerMs = 0;
    this.currentLevel = this._pickSpawnLevel();
    this.nextLevel = this._pickSpawnLevel();
    this._notifyNext();
    this._notifyScore();
  }

  // ------------------------------------------------------------------
  // Soltar objeto
  // ------------------------------------------------------------------
  drop() {
    if (!this.running || this.paused || !this.canDrop) return;
    const r = this._radiusFor(this.currentLevel);
    this.objects.push({
      id: this.nextId++,
      levelIndex: this.currentLevel,
      x: this.aimX,
      y: this.spawnY,
      vx: 0,
      vy: 40,
      radius: r,
      scale: 1,
      merging: false,
      restTime: 0
    });
    AudioFX.drop();
    AudioFX.vibrate(12);

    this.currentLevel = this.nextLevel;
    this.nextLevel = this._pickSpawnLevel();
    this._notifyNext();

    this.canDrop = false;
    this.dropCooldown = 380; // ms — evita cliques repetidos gerando várias peças
  }

  // ------------------------------------------------------------------
  // Laço principal
  // ------------------------------------------------------------------
  _loop(timestamp) {
    if (!this.running) return;
    if (this._lastTime == null) this._lastTime = timestamp;
    let dt = (timestamp - this._lastTime) / 1000;
    this._lastTime = timestamp;
    dt = Math.min(dt, 1 / 30); // evita saltos grandes (aba em segundo plano)

    if (!this.paused) {
      this._update(dt);
    }
    this._render();

    if (this.running) requestAnimationFrame(this._boundLoop);
  }

  _update(dt) {
    // cooldown de disparo
    if (!this.canDrop) {
      this.dropCooldown -= dt * 1000;
      if (this.dropCooldown <= 0) this.canDrop = true;
    }

    // combo — janela de tempo para combinações consecutivas
    if (this.comboTimer > 0) {
      this.comboTimer -= dt * 1000;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    this._physicsStep(dt);
    this._resolveMerges();
    this._updateDangerLine(dt);
    this._updateParticles(dt);
    this._updateFloatingLabels(dt);
  }

  // ------------------------------------------------------------------
  // Física: integração + resolução de colisões (paredes, chão, pares)
  // ------------------------------------------------------------------
  _physicsStep(dt) {
    const wallRestitution = 0.15;
    const floorFriction = 0.86;
    const airDamping = 0.94; // dissipa energia mais rápido para pilhas assentarem de verdade

    // 1) Integra movimento (gravidade + velocidade) uma vez por quadro.
    for (const o of this.objects) {
      if (o.merging) continue;
      o.vy += this.gravity * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.vx *= airDamping;
      o.vy *= airDamping;
    }

    // 2) Resolve restrições (paredes, chão e sobreposição entre pares) de
    //    forma iterativa e intercalada — assim uma correção de par não
    //    "empurra" um objeto para dentro do chão sem que isso seja
    //    corrigido de volta no mesmo quadro (bug corrigido: antes o chão
    //    só era checado uma vez, antes das colisões entre pares). Apenas
    //    a primeira passada aplica restituição (quique); as seguintes só
    //    corrigem posição, para não reinjetar energia a cada iteração.
    const iterations = 5;
    for (let it = 0; it < iterations; it++) {
      const applyBounce = it === 0;
      for (const o of this.objects) {
        if (o.merging) continue;
        if (o.x - o.radius < 0) { o.x = o.radius; o.vx = applyBounce ? -o.vx * wallRestitution : 0; }
        if (o.x + o.radius > this.width) { o.x = this.width - o.radius; o.vx = applyBounce ? -o.vx * wallRestitution : 0; }
        if (o.y + o.radius > this.floorY) {
          o.y = this.floorY - o.radius;
          if (applyBounce) { o.vy *= -wallRestitution; o.vx *= floorFriction; }
          else if (o.vy > 0) { o.vy = 0; }
        }
      }
      for (let i = 0; i < this.objects.length; i++) {
        const a = this.objects[i];
        if (a.merging) continue;
        for (let j = i + 1; j < this.objects.length; j++) {
          const b = this.objects[j];
          if (b.merging) continue;
          this._resolvePair(a, b);
        }
      }
    }

    // 3) "Adormece" objetos quase parados — sem isso, pilhas empilhadas
    //    ficam com um tremor residual infinito e nunca são consideradas em
    //    repouso pela linha de perigo (ver _updateDangerLine).
    for (const o of this.objects) {
      if (Math.abs(o.vx) < 18) o.vx = 0;
      if (Math.abs(o.vy) < 18) o.vy = 0;
    }
  }

  _resolvePair(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    const minDist = a.radius + b.radius;
    if (dist >= minDist) return;

    const overlap = minDist - dist;
    const nx = dx / dist;
    const ny = dy / dist;

    // massa proporcional à área — objetos maiores empurram menos
    const massA = a.radius * a.radius;
    const massB = b.radius * b.radius;
    const totalMass = massA + massB;
    const pushA = overlap * (massB / totalMass);
    const pushB = overlap * (massA / totalMass);

    a.x -= nx * pushA;
    a.y -= ny * pushA;
    b.x += nx * pushB;
    b.y += ny * pushB;

    // impulso simples ao longo da normal (amortecido, evita quicar demais)
    const relVx = b.vx - a.vx;
    const relVy = b.vy - a.vy;
    const velAlongNormal = relVx * nx + relVy * ny;
    if (velAlongNormal < 0) {
      const restitution = 0.06; // baixo: objetos empilhados não devem quicar como bolas de borracha
      const impulse = -(1 + restitution) * velAlongNormal / (1 / massA + 1 / massB);
      const ix = impulse * nx;
      const iy = impulse * ny;
      a.vx -= ix / massA;
      a.vy -= iy / massA;
      b.vx += ix / massB;
      b.vy += iy / massB;
    }

    // marca para fusão se forem do mesmo nível e ainda não houver fusão
    // máxima (Pessoa não se funde com outra Pessoa).
    if (a.levelIndex === b.levelIndex && a.levelIndex < MAX_LEVEL_INDEX) {
      if (!a.merging && !b.merging) {
        a.merging = true;
        b.merging = true;
        this._mergeQueue = this._mergeQueue || [];
        this._mergeQueue.push([a, b]);
      }
    }
  }

  // ------------------------------------------------------------------
  // Processa as fusões marcadas durante a passada de física
  // ------------------------------------------------------------------
  _resolveMerges() {
    if (!this._mergeQueue || !this._mergeQueue.length) return;
    const queue = this._mergeQueue;
    this._mergeQueue = [];

    for (const [a, b] of queue) {
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const newLevel = a.levelIndex + 1;
      const lv = LEVELS[newLevel];

      this.objects = this.objects.filter(o => o !== a && o !== b);

      const newObj = {
        id: this.nextId++,
        levelIndex: newLevel,
        x: midX,
        y: midY,
        vx: 0,
        vy: 0,
        radius: this._radiusFor(newLevel),
        scale: 0.55,
        merging: false,
        restTime: 0
      };
      this.objects.push(newObj);

      // pontuação + combo
      const basePoints = LEVELS[a.levelIndex].points;
      this.combo += 1;
      this.comboTimer = 1500;
      const comboBonus = Math.round(basePoints * 0.12 * (this.combo - 1));
      this.score += basePoints + comboBonus;
      this._notifyScore();

      this._spawnParticles(midX, midY, lv.colorDark);
      this._spawnFloatingLabel(midX, midY, lv.name);

      if (newLevel >= 6) AudioFX.bigMerge(); else AudioFX.merge(newLevel);
      AudioFX.vibrate(newLevel >= 6 ? [20, 30, 20] : 15);

      if (newLevel > this.highestLevelReached) this.highestLevelReached = newLevel;

      if (this.callbacks.onMerge) this.callbacks.onMerge(newLevel, lv);

      // animação de "pop" ao nascer
      this._animateScaleIn(newObj);

      if (newLevel === MAX_LEVEL_INDEX && !this.wonOnce) {
        this.wonOnce = true;
        AudioFX.celebrate();
        if (this.callbacks.onWin) this.callbacks.onWin();
      }
    }
  }

  _animateScaleIn(obj) {
    const start = performance.now();
    const dur = 220;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      obj.scale = 0.55 + 0.45 * (1 - Math.pow(1 - p, 3));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ------------------------------------------------------------------
  // Linha de perigo — só conta tempo quando o objeto está praticamente
  // parado (evita derrota injusta por uma peça apenas "passando" pela
  // linha durante a queda).
  // ------------------------------------------------------------------
  _updateDangerLine(dt) {
    let anyOverLimit = false;
    let anyOverLine = false;

    for (const o of this.objects) {
      const top = o.y - o.radius;
      const resting = Math.abs(o.vy) < 40 && Math.abs(o.vx) < 40;
      if (top < this.dangerY && resting) {
        o.restTime += dt * 1000;
        anyOverLine = true;
        if (o.restTime > this.dangerLimitMs) anyOverLimit = true;
      } else if (top >= this.dangerY) {
        o.restTime = 0;
      }
      // se não está "resting", mantém o tempo acumulado (não zera por um
      // pequeno tremor), mas também não avança — comportamento estável.
    }

    this.dangerPulse = anyOverLine ? (Math.sin(performance.now() / 140) * 0.5 + 0.5) : 0;

    if (anyOverLimit && !this.gameOverFired) {
      this._triggerGameOver();
    }
  }

  _triggerGameOver() {
    this.gameOverFired = true;
    this.running = false;
    AudioFX.gameOver();
    AudioFX.vibrate([30, 40, 30]);
    if (this.callbacks.onGameOver) {
      this.callbacks.onGameOver({
        score: this.score,
        highestLevel: this.highestLevelReached
      });
    }
  }

  // ------------------------------------------------------------------
  // Partículas e rótulos flutuantes (feedback visual discreto)
  // ------------------------------------------------------------------
  _spawnParticles(x, y, color) {
    const reduce = A11y.get().reduceMotion;
    const count = reduce ? 0 : 8;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 60 + Math.random() * 90;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        radius: 2.5 + Math.random() * 2.5,
        color,
        life: 500,
        maxLife: 500
      });
    }
  }

  _updateParticles(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += this.gravity * 0.5 * dt;
      p.life -= dt * 1000;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  _spawnFloatingLabel(x, y, text) {
    this.floatingLabels.push({ x, y, text, life: 1100, maxLife: 1100 });
  }

  _updateFloatingLabels(dt) {
    for (const l of this.floatingLabels) {
      l.y -= 22 * dt;
      l.life -= dt * 1000;
    }
    this.floatingLabels = this.floatingLabels.filter(l => l.life > 0);
  }

  // ------------------------------------------------------------------
  // Notificações para a camada de UI (app.js)
  // ------------------------------------------------------------------
  _notifyScore() {
    if (this.callbacks.onScoreChange) this.callbacks.onScoreChange(this.score);
  }
  _notifyNext() {
    if (this.callbacks.onNextChange) this.callbacks.onNextChange(this.currentLevel, this.nextLevel);
  }

  // ------------------------------------------------------------------
  // Renderização
  // ------------------------------------------------------------------
  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // fundo suave (gradiente vertical sutil)
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, 'rgba(255, 246, 249, 0.4)');
    grad.addColorStop(1, 'rgba(255, 214, 226, 0.25)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    Render.drawDangerLine(ctx, this.width, this.dangerY, this.dangerPulse);

    for (const o of this.objects) Render.drawObject(ctx, o);
    for (const p of this.particles) Render.drawParticle(ctx, p);

    // mira / próximo objeto a soltar
    if (this.running && !this.paused && this.canDrop) {
      Render.drawAimGhost(ctx, this.aimX, this.spawnY, this._radiusFor(this.currentLevel), this.currentLevel, this.dangerY);
    }

    // rótulos flutuantes com nome da estrutura recém-criada
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '600 14px system-ui, sans-serif';
    for (const l of this.floatingLabels) {
      ctx.globalAlpha = Math.max(0, l.life / l.maxLife);
      ctx.fillStyle = '#7A1734';
      ctx.fillText(l.text, l.x, l.y);
    }
    ctx.restore();
  }
}
