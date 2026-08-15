/**
 * render.js
 * -----------------------------------------------------------------------
 * Todo o desenho é feito em <canvas> com formas vetoriais originais e
 * estilizadas (círculos, curvas de Bézier, elipses) — nenhuma imagem
 * médica realista é utilizada, conforme pedido no briefing. Cada função
 * `draw<Forma>` recebe o centro (x, y) e o raio (r) do objeto e desenha
 * um ícone reconhecível, mas simplificado e educativo.
 * -----------------------------------------------------------------------
 */

const Render = (() => {

  function withShadow(ctx, fn) {
    ctx.save();
    ctx.shadowColor = 'rgba(122, 23, 52, 0.28)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    fn();
    ctx.restore();
  }

  function circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }

  // 0 — Folículo: pequena vesícula arredondada com brilho suave.
  function folliculo(ctx, x, y, r, lv) {
    withShadow(ctx, () => {
      circle(ctx, x, y, r);
      ctx.fillStyle = lv.color;
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, r * 0.08);
      ctx.strokeStyle = lv.colorDark;
      ctx.stroke();
    });
    // brilho (highlight) — sugere superfície líquida/celular
    ctx.beginPath();
    ctx.arc(x - r * 0.32, y - r * 0.32, r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fill();
  }

  // 1 — Ovócito II: célula com núcleo deslocado e corpúsculo polar.
  function oocyte(ctx, x, y, r, lv) {
    withShadow(ctx, () => {
      circle(ctx, x, y, r);
      ctx.fillStyle = lv.color;
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, r * 0.07);
      ctx.strokeStyle = lv.colorDark;
      ctx.stroke();
    });
    // núcleo
    ctx.beginPath();
    ctx.arc(x + r * 0.15, y - r * 0.1, r * 0.34, 0, Math.PI * 2);
    ctx.fillStyle = lv.colorDark;
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.globalAlpha = 1;
    // corpúsculo polar (detalhe científico discreto)
    ctx.beginPath();
    ctx.arc(x - r * 0.62, y - r * 0.5, r * 0.13, 0, Math.PI * 2);
    ctx.fillStyle = lv.colorDark;
    ctx.fill();
  }

  // 2 — Ovário: forma amendoada com pequenos folículos internos.
  function ovary(ctx, x, y, r, lv) {
    withShadow(ctx, () => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.25);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.98, r * 0.72, 0, 0, Math.PI * 2);
      ctx.fillStyle = lv.color;
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, r * 0.06);
      ctx.strokeStyle = lv.colorDark;
      ctx.stroke();
      ctx.restore();
    });
    const spots = [[-0.35, -0.1, 0.20], [0.15, 0.2, 0.16], [0.4, -0.15, 0.13], [-0.05, -0.35, 0.11]];
    spots.forEach(([dx, dy, rr]) => {
      ctx.beginPath();
      ctx.arc(x + dx * r, y + dy * r, rr * r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fill();
      ctx.strokeStyle = lv.colorDark;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  // 3 — Tuba uterina: tubo curvo com fímbrias (franjas) na extremidade.
  function tube(ctx, x, y, r, lv) {
    withShadow(ctx, () => {
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.moveTo(-r * 0.75, r * 0.55);
      ctx.quadraticCurveTo(-r * 0.9, -r * 0.4, 0, -r * 0.75);
      ctx.quadraticCurveTo(r * 0.85, -r * 1.0, r * 0.7, -r * 0.35);
      ctx.quadraticCurveTo(r * 0.55, r * 0.05, -r * 0.35, r * 0.35);
      ctx.closePath();
      ctx.fillStyle = lv.color;
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, r * 0.07);
      ctx.strokeStyle = lv.colorDark;
      ctx.stroke();
      // fímbrias (pequenas franjas na extremidade superior)
      ctx.lineWidth = Math.max(1.2, r * 0.06);
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(r * 0.55 + i * r * 0.08, -r * 0.7);
        ctx.quadraticCurveTo(r * 0.7 + i * r * 0.12, -r * 0.95, r * 0.55 + i * r * 0.16, -r * 1.15);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  // 4 — Útero: silhueta em forma de pera/triângulo com conexões laterais.
  function uterus(ctx, x, y, r, lv) {
    withShadow(ctx, () => {
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.moveTo(0, r * 0.95);
      ctx.quadraticCurveTo(-r * 0.95, r * 0.5, -r * 0.55, -r * 0.35);
      ctx.quadraticCurveTo(-r * 0.3, -r * 0.85, 0, -r * 0.55);
      ctx.quadraticCurveTo(r * 0.3, -r * 0.85, r * 0.55, -r * 0.35);
      ctx.quadraticCurveTo(r * 0.95, r * 0.5, 0, r * 0.95);
      ctx.closePath();
      ctx.fillStyle = lv.color;
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, r * 0.07);
      ctx.strokeStyle = lv.colorDark;
      ctx.stroke();
      ctx.restore();
    });
  }

  // 5 — Vagina: canal alongado com leves estrias (rugosidades).
  function vagina(ctx, x, y, r, lv) {
    withShadow(ctx, () => {
      ctx.save();
      ctx.translate(x, y);
      const w = r * 0.85;
      const h = r * 1.05;
      ctx.beginPath();
      ctx.moveTo(-w, -h * 0.5);
      ctx.arcTo(-w, h, 0, h, w * 0.6);
      ctx.arcTo(w, h, w, -h * 0.5, w * 0.6);
      ctx.arcTo(w, -h, 0, -h, w * 0.6);
      ctx.arcTo(-w, -h, -w, -h * 0.5, w * 0.6);
      ctx.closePath();
      ctx.fillStyle = lv.color;
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, r * 0.07);
      ctx.strokeStyle = lv.colorDark;
      ctx.stroke();
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = Math.max(1, r * 0.04);
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-w * 0.6, i * h * 0.32);
        ctx.quadraticCurveTo(0, i * h * 0.32 + r * 0.1, w * 0.6, i * h * 0.32);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    });
  }

  // 6 — Feto: forma curvada estilizada (cabeça + corpo em "C"), abstrata.
  function fetus(ctx, x, y, r, lv) {
    withShadow(ctx, () => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(0.15);
      ctx.beginPath();
      ctx.moveTo(r * 0.15, -r * 0.85);
      ctx.quadraticCurveTo(r * 0.85, -r * 0.55, r * 0.55, r * 0.05);
      ctx.quadraticCurveTo(r * 0.35, r * 0.55, -r * 0.25, r * 0.8);
      ctx.quadraticCurveTo(-r * 0.55, r * 0.6, -r * 0.15, r * 0.3);
      ctx.quadraticCurveTo(r * 0.05, -r * 0.05, -r * 0.35, -r * 0.35);
      ctx.quadraticCurveTo(-r * 0.55, -r * 0.7, r * 0.15, -r * 0.85);
      ctx.closePath();
      ctx.fillStyle = lv.color;
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, r * 0.06);
      ctx.strokeStyle = lv.colorDark;
      ctx.stroke();
      // cabeça
      ctx.beginPath();
      ctx.arc(r * 0.28, -r * 0.55, r * 0.34, 0, Math.PI * 2);
      ctx.fillStyle = lv.color;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }

  // 7 — Bebê: rosto simples e amigável, forma arredondada.
  function baby(ctx, x, y, r, lv) {
    withShadow(ctx, () => {
      circle(ctx, x, y, r);
      ctx.fillStyle = lv.color;
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, r * 0.06);
      ctx.strokeStyle = lv.colorDark;
      ctx.stroke();
    });
    // rosto (dois olhos + sorriso) — bem simples e amigável
    ctx.fillStyle = lv.colorDark;
    ctx.beginPath();
    ctx.arc(x - r * 0.28, y - r * 0.05, r * 0.07, 0, Math.PI * 2);
    ctx.arc(x + r * 0.28, y - r * 0.05, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y + r * 0.18, r * 0.32, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.lineWidth = Math.max(1.5, r * 0.06);
    ctx.strokeStyle = lv.colorDark;
    ctx.lineCap = 'round';
    ctx.stroke();
    // topete
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.95);
    ctx.quadraticCurveTo(x + r * 0.15, y - r * 1.15, x + r * 0.05, y - r * 0.8);
    ctx.strokeStyle = lv.colorDark;
    ctx.stroke();
  }

  // 8 — Pessoa: pictograma humano estilizado, neutro e respeitoso.
  function person(ctx, x, y, r, lv) {
    withShadow(ctx, () => {
      // cabeça
      ctx.beginPath();
      ctx.arc(x, y - r * 0.55, r * 0.32, 0, Math.PI * 2);
      ctx.fillStyle = lv.color;
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, r * 0.055);
      ctx.strokeStyle = lv.colorDark;
      ctx.stroke();
      // corpo (trapézio arredondado)
      ctx.beginPath();
      ctx.moveTo(x - r * 0.18, y - r * 0.22);
      ctx.quadraticCurveTo(x - r * 0.65, y - r * 0.1, x - r * 0.62, y + r * 0.55);
      ctx.quadraticCurveTo(x - r * 0.6, y + r * 0.92, x, y + r * 0.92);
      ctx.quadraticCurveTo(x + r * 0.6, y + r * 0.92, x + r * 0.62, y + r * 0.55);
      ctx.quadraticCurveTo(x + r * 0.65, y - r * 0.1, x + r * 0.18, y - r * 0.22);
      ctx.closePath();
      ctx.fillStyle = lv.color;
      ctx.fill();
      ctx.stroke();
    });
  }

  const SHAPES = { folliculo, oocyte, ovary, tube, uterus, vagina, fetus, baby, person };

  function drawObject(ctx, obj) {
    const lv = LEVELS[obj.levelIndex];
    const r = obj.radius * (obj.scale ?? 1);
    ctx.save();
    if (obj.wobble) {
      ctx.translate(obj.x, obj.y);
      ctx.rotate(obj.wobble);
      ctx.translate(-obj.x, -obj.y);
    }
    (SHAPES[lv.shape] || folliculo)(ctx, obj.x, obj.y, r, lv);
    ctx.restore();
  }

  function drawDangerLine(ctx, width, yPos, pulse) {
    ctx.save();
    ctx.strokeStyle = `rgba(255, 59, 92, ${0.55 + pulse * 0.35})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(8, yPos);
    ctx.lineTo(width - 8, yPos);
    ctx.stroke();
    ctx.restore();
  }

  function drawParticle(ctx, p) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  }

  function drawAimGhost(ctx, x, y, radius, levelIndex, floorY) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = '#E0245E';
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, floorY);
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.setLineDash([]);
    const lv = LEVELS[levelIndex];
    (SHAPES[lv.shape] || folliculo)(ctx, x, y, radius, lv);
    ctx.restore();
  }

  return { drawObject, drawDangerLine, drawParticle, drawAimGhost, SHAPES };
})();
