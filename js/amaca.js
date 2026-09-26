/* Ombralunga: l'amaca sotto il noce.
   Una catena di punti con la gravità (integrazione di Verlet): pende fra il gancio sul tronco
   e il palo, dondola col vento e si spinge col mouse o col dito. L'ombra sul prato la segue. */

export function creaAmaca(svg, { tocco = false } = {}) {
  if (!svg) return null;
  const corda = svg.querySelector('.amaca__corda');
  const telo = svg.querySelector('.amaca__telo');
  const ombra = svg.querySelector('.amaca__ombra');
  const A = { x: 300, y: 330 }, B = { x: 720, y: 330 };
  const N = 18;
  const lunghezza = Math.hypot(B.x - A.x, B.y - A.y) * 1.16;
  const passo = lunghezza / (N - 1);
  const punti = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const x = A.x + (B.x - A.x) * t, y = A.y + Math.sin(Math.PI * t) * 80;
    punti.push({ x, y, px: x, py: y });
  }
  let attivo = false, tempo = 0;
  const mano = { x: -999, y: -999, vx: 0, vy: 0, t: 0 };

  function passoFisica(dt) {
    tempo += dt;
    const vento = Math.sin(tempo * 0.9) * 0.05 + Math.sin(tempo * 2.3) * 0.02;
    for (let i = 1; i < N - 1; i++) {
      const p = punti[i];
      const vx = (p.x - p.px) * 0.985, vy = (p.y - p.py) * 0.985;
      p.px = p.x; p.py = p.y;
      const centro = Math.sin(Math.PI * i / (N - 1));
      p.x += vx + vento * centro;
      p.y += vy + 0.45;
      /* la mano spinge i punti vicini nella direzione in cui si muove */
      const d = Math.hypot(p.x - mano.x, p.y - mano.y);
      if (d < 70 && mano.t > 0) {
        const k = (1 - d / 70) * 0.35;
        p.x += mano.vx * k; p.y += mano.vy * k * 0.5;
      }
    }
    mano.t = Math.max(0, mano.t - dt);
    for (let k = 0; k < 10; k++) {
      punti[0].x = A.x; punti[0].y = A.y; punti[N - 1].x = B.x; punti[N - 1].y = B.y;
      for (let i = 0; i < N - 1; i++) {
        const a = punti[i], b = punti[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || 0.001;
        const diff = (dist - passo) / dist * 0.5;
        const ox = dx * diff, oy = dy * diff;
        if (i > 0) { a.x += ox; a.y += oy; }
        if (i + 1 < N - 1) { b.x -= ox; b.y -= oy; }
      }
    }
  }

  function disegna() {
    corda.setAttribute('d', 'M' + punti.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L'));
    /* il telo è una fascia più spessa al centro, dal terzo punto al terzultimo */
    const su = [], giu = [];
    for (let i = 2; i < N - 2; i++) {
      const t = (i - 2) / (N - 5), sp = Math.sin(Math.PI * t) * 20 + 3;
      su.push(`${punti[i].x.toFixed(1)} ${(punti[i].y - sp * 0.35).toFixed(1)}`);
      giu.unshift(`${punti[i].x.toFixed(1)} ${(punti[i].y + sp).toFixed(1)}`);
    }
    telo.setAttribute('d', `M${su.join('L')}L${giu.join('L')}Z`);
    let mx = 0, my = 0; for (let i = 4; i < N - 4; i++) { mx += punti[i].x; my += punti[i].y; }
    mx /= N - 8; my /= N - 8;
    ombra.setAttribute('cx', (mx + 30).toFixed(1));
    ombra.setAttribute('rx', (150 + (560 - my) * 0.2).toFixed(1));
    ombra.setAttribute('opacity', (0.2 + (my - 330) / 900).toFixed(3));
  }

  const inSvg = (cx, cy) => {
    const m = svg.getScreenCTM(); if (!m) return null;
    const p = svg.createSVGPoint(); p.x = cx; p.y = cy;
    return p.matrixTransform(m.inverse());
  };
  let ultimo = null;
  const muovi = (e) => {
    const p = inSvg(e.clientX, e.clientY); if (!p) return;
    if (ultimo) { mano.vx = p.x - ultimo.x; mano.vy = p.y - ultimo.y; mano.t = 0.12; }
    mano.x = p.x; mano.y = p.y; ultimo = p;
  };
  if (!tocco) svg.addEventListener('pointermove', muovi);
  svg.addEventListener('click', (e) => {
    const p = inSvg(e.clientX, e.clientY); if (!p) return;
    mano.x = p.x; mano.y = p.y; mano.vx = 22; mano.vy = -6; mano.t = 0.2;
  });

  for (let i = 0; i < 240; i++) passoFisica(1 / 60);
  disegna();
  const giro = (t, dtMs) => { const dt = Math.min(1 / 30, dtMs / 1000); passoFisica(dt); disegna(); };
  return {
    avvia() { if (attivo) return; attivo = true; gsap.ticker.add(giro); },
    ferma() { attivo = false; gsap.ticker.remove(giro); },
  };
}
