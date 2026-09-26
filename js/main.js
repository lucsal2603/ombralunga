/* Ombralunga: la regia.
   GSAP 3.15 (ScrollTrigger, SplitText, CustomEase, MotionPath, Flip) + Lenis.
   Una sola regola: ogni ombra viene da una luce. Le funzioni sono nell'ordine delle sezioni. */
import { creaPergolato } from './pergolato.js?v=20260926102449';
import { creaAmaca } from './amaca.js?v=20260926102449';

const html = document.documentElement;
const QA = html.classList.contains('qa');
const STATICO = html.classList.contains('statico');
const TOCCO = matchMedia('(hover: none), (pointer: coarse)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (a, b, v) => Math.min(b, Math.max(a, v));
const rad = (d) => (d * Math.PI) / 180;
const lerp = (a, b, t) => a + (b - a) * t;

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, MotionPathPlugin, Flip);
CustomEase.create('sole', '0.22, 1, 0.36, 1');
CustomEase.create('ombra', '0.65, 0, 0.35, 1');
gsap.defaults({ ease: 'sole', duration: 0.9 });
ScrollTrigger.config({ ignoreMobileResize: true });

/* ------------------------------------------------------------------ scorrimento morbido */
let lenis = null;
if (!QA && !STATICO && window.Lenis) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
}
gsap.ticker.lagSmoothing(0);
const vaiA = (dove, opz = {}) => {
  if (lenis) lenis.scrollTo(dove, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 3), ...opz });
  else {
    const y = typeof dove === 'number' ? dove : dove.getBoundingClientRect().top + scrollY;
    scrollTo({ top: y, behavior: opz.immediate ? 'instant' : 'smooth' });
  }
};
ScrollTrigger.addEventListener('refresh', () => lenis && lenis.resize());

/* ------------------------------------------------------------------ grana di stampa */
(function grana() {
  const c = document.createElement('canvas'); c.width = c.height = 220;
  const x = c.getContext('2d'); if (!x) return;
  const img = x.createImageData(220, 220);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 120 + ((Math.random() * 135) | 0);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  $('.grana').style.backgroundImage = `url(${c.toDataURL()})`;
})();

/* ================================================================== PAROLE IN PIEDI
   Lettere ritte su una linea di terra e la loro ombra stesa su un piano in prospettiva.
   Il piano è un div ruotato in 3D attorno alla linea di terra: l'ombra è la stessa parola,
   capovolta e inclinata secondo il sole. La prospettiva la fa allungare verso chi guarda. */
function inPiedi({ palco, lettere, visibile = lettere, ombra, terra, larghezza = 0.9, baseFrazione = 0.8, altezzaMax = 0.34 }) {
  const piano = ombra.parentElement;
  const sl = SplitText.create(visibile, { type: 'chars', charsClass: 'lettera' });
  const so = SplitText.create(ombra, { type: 'chars', charsClass: 'lettera' });
  const bl = document.createElement('i'); bl.className = 'base-misura'; visibile.appendChild(bl);
  const bo = document.createElement('i'); bo.className = 'base-misura'; ombra.appendChild(bo);
  const stato = { baseY: 0, corpo: 100 };

  function misura() {
    const W = palco.clientWidth, H = palco.clientHeight;
    palco.style.setProperty('--corpo-nome', '100px');
    const w100 = visibile.offsetWidth || 1;
    const corpo = Math.min((W * larghezza) / w100 * 100, H * altezzaMax / 0.74);
    palco.style.setProperty('--corpo-nome', corpo.toFixed(2) + 'px');
    const baseY = Math.round(H * baseFrazione);
    const baseLettere = bl.offsetTop;
    palco.style.setProperty('--nome-top', (baseY - baseLettere) + 'px');
    palco.style.setProperty('--base-y', baseY + 'px');
    palco.style.setProperty('--ombra-base', bo.offsetTop + 'px');
    palco.style.setProperty('--prospettiva', Math.round(Math.max(W, H) * 0.95) + 'px');
    sl.chars.forEach((c) => gsap.set(c, { transformOrigin: `50% ${bl.offsetTop - c.offsetTop}px` }));
    so.chars.forEach((c) => gsap.set(c, { transformOrigin: `50% ${bo.offsetTop - c.offsetTop}px` }));
    stato.baseY = baseY; stato.corpo = corpo;
  }

  /* el: altezza del sole in gradi; az: gradi a destra (+) o a sinistra (-) di chi guarda */
  function stendi(el, az, forza = 1) {
    const lung = clamp(0.25, 9, 1 / Math.tan(rad(clamp(1.5, 89, el)))) * forza;
    const lato = -Math.atan(Math.tan(rad(az)));
    ombra.style.transform = `skewX(${lato}rad) scaleY(${-lung})`;
  }

  misura();
  return { misura, stendi, lettere: sl.chars, ombre: so.chars, stato, piano };
}

/* ================================================================== APERTURA: la meridiana */
const apertura = (() => {
  const palco = $('.apertura__palco');
  const scena = $('.scena');
  const svg = $('.scena__svg');
  const STRETTO = innerWidth < 761;
  const W0 = STRETTO ? 62 : 72, W1 = STRETTO ? 70 : 79;
  scena.style.setProperty('--wdth', W0);
  const pied = inPiedi({
    palco: scena,
    lettere: $('.nome--lettere'),
    visibile: $('.nome--lettere .nome__visibile'),
    ombra: $('.scena__terra .nome--ombra'),
    terra: $('.scena__terra'),
    larghezza: STRETTO ? 0.93 : 0.8,
    baseFrazione: innerWidth < 761 ? 0.66 : 0.79,
  });

  /* tavolozze del cielo al variare dell'altezza del sole */
  const TAV = [
    { el: 3, ca: '#B26A6E', cm: '#EA8A57', cb: '#F6BD72', so: '#FFD08A', al: '#FAC690', lo: '#A57C92', me: '#6D6A43', vi: '#4E4C33', cl: '#D08A4E', cv: '#D99752', le: '#74301F', bo: '#F29A5C', mu: '#F2B784', fo: 0.62 },
    { el: 16, ca: '#E0B088', cm: '#F0CC93', cb: '#F8E0AE', so: '#FFE6AE', al: '#FFEFCB', lo: '#9F9AB5', me: '#77844E', vi: '#586A3F', cl: '#D2A85D', cv: '#DCB061', le: '#8C3924', bo: '#EE9660', mu: '#F2CB9B', fo: 0.56 },
    { el: 38, ca: '#CAD2D6', cm: '#E7E2C5', cb: '#F4E6BD', so: '#FFF5DA', al: '#FFFAE8', lo: '#9CA7C2', me: '#7C8C54', vi: '#5E7043', cl: '#CDAE62', cv: '#D9B566', le: '#A5442B', bo: '#F0A071', mu: '#EFD6AE', fo: 0.46 },
    { el: 66, ca: '#BCCDD8', cm: '#E2E5D2', cb: '#F2EACA', so: '#FFFBEC', al: '#FFFDF3', lo: '#A3AEC6', me: '#81915A', vi: '#627548', cl: '#D0B266', cv: '#DBB96B', le: '#AE492E', bo: '#F2A77A', mu: '#F3DDB8', fo: 0.4 },
  ];
  const chiavi = Object.keys(TAV[0]).filter((k) => k !== 'el');
  const interp = {};
  chiavi.forEach((k) => { interp[k] = TAV.slice(0, -1).map((t, i) => gsap.utils.interpolate(t[k], TAV[i + 1][k])); });
  function tavolozza(el) {
    let i = 0; while (i < TAV.length - 2 && el > TAV[i + 1].el) i++;
    const t = clamp(0, 1, (el - TAV[i].el) / (TAV[i + 1].el - TAV[i].el));
    const o = {}; chiavi.forEach((k) => { o[k] = interp[k][i](t); }); return o;
  }

  const q = (s) => svg.querySelector(s);
  const el = {
    ca: q('.cielo-alto'), cm: q('.cielo-medio'), cb: q('.cielo-basso'),
    cl: q('.campo-lontano'), cv: q('.campo-vicino'),
    sole: q('.scena__sole'), disco: q('.sole-disco'), alone1: q('.sole-alone--1'), alone2: q('.sole-alone--2'),
    lontano: q('.colle--lontano'), medio: q('.colle--medio'), vicino: q('.colle--vicino'),
    ombraFattoria: q('.ombra-fattoria'), corpoFattoria: q('.fattoria-corpo'), fattoria: q('.scena__fattoria'),
    sLontano: q('.strato--lontano'), sMedio: q('.strato--medio'), sVicino: q('.strato--vicino'),
  };
  const cresce = { f: 1 };
  const muri = $$('#fattoria .f-muro', svg);

  /* luce = base (apertura) + scorrimento + mouse */
  const base = { el: 64, az: -6 };
  const scorri = { el: 0, az: 0 };
  const mira = { x: 0, y: 0 };
  let sporco = true;
  const segna = () => { sporco = true; };
  const ultimaLuce = { x: '', y: '' };

  function applica() {
    if (!sporco) return; sporco = false;
    const e = clamp(2, 72, base.el + scorri.el - mira.y * 3);
    const a = clamp(-62, 40, base.az + scorri.az + mira.x * 13);
    const t = tavolozza(e);
    el.ca.setAttribute('stop-color', t.ca); el.cm.setAttribute('stop-color', t.cm); el.cb.setAttribute('stop-color', t.cb);
    el.cl.setAttribute('stop-color', t.cl); el.cv.setAttribute('stop-color', t.cv);
    el.lontano.style.fill = t.lo; el.medio.style.fill = t.me; el.vicino.style.fill = t.vi;
    el.disco.style.fill = t.so; el.alone1.style.fill = t.al; el.alone2.style.fill = t.al;
    muri.forEach((m) => { m.style.fill = t.mu; });
    const sx = 800 + a * 13 + mira.x * 10, sy = 640 - e * 8.4;
    el.sole.setAttribute('transform', `translate(${sx.toFixed(1)} ${sy.toFixed(1)})`);
    /* ombra del casale sul colle: capovolta, schiacciata dalla distanza, inclinata dal sole */
    const L = clamp(0.2, 8, 1 / Math.tan(rad(e)));
    const f = 0.2, c = cresce.f;
    el.corpoFattoria.setAttribute('transform', `scale(1 ${c.toFixed(4)})`);
    el.ombraFattoria.setAttribute('transform', `matrix(1 0 ${(Math.tan(rad(a)) * L * f * 1.6 * c).toFixed(3)} ${(-L * f * c).toFixed(3)} 0 0)`);
    scena.style.setProperty('--lettera', t.le);
    scena.style.setProperty('--bordo', t.bo);
    scena.style.setProperty('--ombra-forza', t.fo.toFixed(3));
    pied.stendi(e, a, 1);
    /* la luce dei link e dei bottoni segue il sole dell'apertura, entro limiti tranquilli */
    const lx = (clamp(-4, 4, -Math.tan(rad(a)) * 3)).toFixed(1), ly = (clamp(2, 5, 2 + L * 0.6)).toFixed(1);
    if (lx !== ultimaLuce.x || ly !== ultimaLuce.y) {
      ultimaLuce.x = lx; ultimaLuce.y = ly;
      html.style.setProperty('--lx', lx + 'px');
      html.style.setProperty('--ly', ly + 'px');
    }
  }
  gsap.ticker.add(applica);

  /* inquadratura dell'SVG: sui telefoni in verticale il casale resta nel quadro */
  function inquadra() {
    const W = scena.clientWidth, H = scena.clientHeight;
    const vx = W / H < 0.9 ? 150 : W / H < 1.3 ? 80 : 0;
    svg.setAttribute('viewBox', `${vx} 0 1600 1000`);
  }
  inquadra();

  /* il mouse sposta un poco il sole e fa scivolare i colli */
  const strati = [[el.sLontano, 6], [el.sMedio, 12], [el.sVicino, 20]];
  function spostaStrati() {
    strati.forEach(([n, k]) => gsap.set(n, { x: -mira.x * k }));
  }
  const mx = gsap.quickTo(mira, 'x', { duration: 1.4, ease: 'power3', onUpdate: () => { segna(); spostaStrati(); } });
  const my = gsap.quickTo(mira, 'y', { duration: 1.4, ease: 'power3', onUpdate: () => { segna(); spostaStrati(); } });
  if (!TOCCO && !STATICO) {
    addEventListener('pointermove', (ev) => {
      if (scrollY > innerHeight * 1.5) return;
      mx((ev.clientX / innerWidth) * 2 - 1);
      my((ev.clientY / innerHeight) * 2 - 1);
    }, { passive: true });
  } else if (!STATICO) {
    /* senza mouse il sole respira da solo */
    const respiro = gsap.to(mira, { x: 0.55, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true, onUpdate: () => { segna(); spostaStrati(); } });
    ScrollTrigger.create({ trigger: '.apertura', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? respiro.play() : respiro.pause()) });
  }

  /* l'apertura: l'abbaglio si ritira, i colli salgono, le lettere si alzano dal campo */
  function entrata() {
    const tl = gsap.timeline({ defaults: { ease: 'sole' } });
    tl.to('.abbaglio', { autoAlpha: 0, duration: 1.2 }, 0)
      .fromTo(scena, { filter: 'saturate(.35) brightness(1.35)' }, { filter: 'saturate(1) brightness(1)', duration: 1.3, clearProps: 'filter' }, 0)
      .from(el.sLontano, { y: 70, duration: 1.4 }, 0.05)
      .from(el.sMedio, { y: 110, duration: 1.4 }, 0.12)
      .from(el.sVicino, { y: 140, duration: 1.4 }, 0.19)
      .fromTo(cresce, { f: 0 }, { f: 1, duration: 1.1, ease: 'back.out(1.6)', onUpdate: segna }, 0.7)
      .from(pied.lettere, { scaleY: 0, duration: 1, ease: 'back.out(1.6)', stagger: 0.05 }, 0.4)
      .from(pied.ombre, { scaleY: 0, duration: 1, ease: 'back.out(1.6)', stagger: 0.05 }, 0.4)
      .from('.scena__sopra', { autoAlpha: 0, y: 14, duration: 0.9 }, 1.2)
      .from('.scena__motto', { autoAlpha: 0, y: 18, duration: 1.1 }, 1.5);
    /* il sole scende da mezzogiorno al pomeriggio: le ombre girano come su una meridiana */
    gsap.to(base, { el: 30, az: -30, duration: 3, ease: 'power2.inOut', onUpdate: segna });
    return tl;
  }

  /* lo scorrimento: il sole va verso sera, le ombre si allungano, poi il quadro si stacca e si aggancia */
  function scorrimento() {
    const mm = gsap.matchMedia();
    mm.add({ largo: '(min-width: 761px)', stretto: '(max-width: 760px)' }, (ctx) => {
      const { largo } = ctx.conditions;
      const testo = $('.apertura__testo');
      const lead = SplitText.create('.apertura__lead', { type: 'lines', mask: 'lines' });
      const origine = () => {
        const W = palco.clientWidth, H = palco.clientHeight, m = clamp(16, 64, W * 0.04);
        const s = largo ? 0.52 : 0.5;
        return largo ? `${W - m / (1 - s)}px ${H * 0.5}px` : `${W * 0.5}px ${(m + 70) / (1 - s)}px`;
      };
      gsap.set(scena, { transformOrigin: origine });
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.apertura', start: 'top top', end: '+=170%', pin: palco, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true },
      });
      tl.to(scorri, { el: -24, az: -16, duration: 0.62, onUpdate: segna }, 0)
        .fromTo(scena, { '--wdth': W0 }, { '--wdth': W1, duration: 0.62 }, 0)
        .to('.scena__sopra', { autoAlpha: 0, y: -18, duration: 0.18 }, 0)
        .to('.scena__motto', { autoAlpha: 0, y: 22, duration: 0.18 }, 0)
        .to(scena, { scale: largo ? 0.52 : 0.5, borderRadius: largo ? 40 : 34, duration: 0.42, ease: 'power2.inOut' }, 0.5)
        .set(testo, { visibility: 'visible' }, 0.7)
        .from(lead.lines, { yPercent: 110, duration: 0.22, stagger: 0.03, ease: 'power2.out' }, 0.7)
        .from('.apertura__azioni > *', { autoAlpha: 0, y: 20, duration: 0.16, stagger: 0.05 }, 0.84);
      return () => { lead.revert(); };
    });
  }

  function statico() {
    base.el = 22; base.az = -32; segna(); applica();
    gsap.set('.abbaglio', { autoAlpha: 0 });
    gsap.set('.apertura__testo', { visibility: 'visible' });
  }

  let attesa = 0;
  addEventListener('resize', () => { clearTimeout(attesa); attesa = setTimeout(() => { inquadra(); pied.misura(); segna(); }, 150); });
  ScrollTrigger.addEventListener('refreshInit', () => { inquadra(); pied.misura(); segna(); });

  const pomeriggio = () => { base.el = 30; base.az = -30; segna(); };
  return { entrata, scorrimento, statico, pomeriggio, pied, segna };
})();

/* ================================================================== TESTATA */
const testata = (() => {
  const t = $('#testata');
  let nascosta = false, consentita = false;
  const nascondi = (s) => {
    if (s === nascosta) return; nascosta = s;
    gsap.to(t, { yPercent: s ? -180 : 0, duration: s ? 0.35 : 0.6, ease: s ? 'power2.in' : 'sole', overwrite: true,
      onStart: () => { if (!s) t.style.visibility = 'visible'; },
      onComplete: () => { if (s) t.style.visibility = 'hidden'; } });
  };
  let accumulo = 0;
  const aggiorna = (dy) => {
    if (!consentita) return;
    const y = scrollY;
    if (y < 120) { accumulo = 0; nascondi(false); return; }
    accumulo = dy * accumulo > 0 ? accumulo + dy : dy;
    if (accumulo > 60) nascondi(true);
    if (accumulo < -80) nascondi(false);
  };
  if (lenis) lenis.on('scroll', (e) => aggiorna(e.velocity || 0));
  else { let prima = scrollY; addEventListener('scroll', () => { aggiorna(scrollY - prima); prima = scrollY; }, { passive: true }); }

  /* colore chiaro sopra le sezioni scure */
  $$('[data-tema="scuro"], .piede').forEach((s) => {
    ScrollTrigger.create({ trigger: s, start: 'top 44px', end: 'bottom 44px', toggleClass: { targets: t, className: 'is-scura' } });
  });
  /* l'ombra della meridiana del marchio gira con la pagina */
  gsap.fromTo('.marchio__ombra', { rotation: 0, svgOrigin: '24 26' }, { rotation: 158, svgOrigin: '24 26', ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.6 } });

  const entra = () => {
    gsap.fromTo(t, { yPercent: -180 }, { yPercent: 0, duration: 1, ease: 'sole', onStart: () => { t.style.visibility = 'visible'; } });
    consentita = true;
  };
  return { entra, nascondi };
})();

/* ------------------------------------------------------------------ menù: la tenda */
(function tenda() {
  const tenda = $('#tenda'), bottone = $('.testata__menu'), chiudi = $('.tenda__chiudi');
  const voci = $$('.tenda__voci a');
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'ombra' } })
    .set(tenda, { visibility: 'visible' })
    .fromTo('.tenda__telo', { scaleY: 0 }, { scaleY: 1, duration: 0.6 })
    .fromTo(voci, { autoAlpha: 0, y: -40, rotation: 4, transformOrigin: '0 0' }, { autoAlpha: 1, y: 0, rotation: 0, duration: 0.7, ease: 'elastic.out(1, .6)', stagger: 0.05 }, 0.3)
    .fromTo(chiudi, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(2)' }, 0.35);
  const apri = () => { tenda.classList.add('is-aperta'); tenda.setAttribute('aria-hidden', 'false'); bottone.setAttribute('aria-expanded', 'true'); lenis && lenis.stop(); tl.timeScale(1).play(); voci[0].focus({ preventScroll: true }); };
  const chiudiTenda = () => { bottone.setAttribute('aria-expanded', 'false'); tenda.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); tl.timeScale(1.7).reverse().then(() => tenda.classList.remove('is-aperta')); };
  bottone.addEventListener('click', apri);
  chiudi.addEventListener('click', chiudiTenda);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && tenda.classList.contains('is-aperta')) chiudiTenda(); });
  voci.forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); chiudiTenda(); const d = $(a.getAttribute('href')); setTimeout(() => d && vaiA(d), 350); }));
})();

/* collegamenti interni con lo scorrimento morbido */
$$('a[href^="#"]').forEach((a) => {
  if (a.closest('.tenda')) return;
  a.addEventListener('click', (e) => {
    const d = a.getAttribute('href'); if (d.length < 2) return;
    const dest = $(d); if (!dest) return;
    e.preventDefault(); vaiA(dest);
  });
});

/* ================================================================== TITOLI: entrano stretti e si allungano */
function titoli() {
  $$('.titolo').forEach((t) => {
    const w = parseFloat(getComputedStyle(t).getPropertyValue('--w')) || 80;
    const s = SplitText.create(t, { type: 'lines', mask: 'lines', linesClass: 'riga' });
    gsap.timeline({ scrollTrigger: { trigger: t, start: 'top 82%', once: true } })
      .from(s.lines, { yPercent: 105, duration: 1.1, stagger: 0.08 }, 0)
      .fromTo(t, { '--w': 62 }, { '--w': w, duration: 1.6, ease: 'ombra' }, 0.05);
  });
}

/* ================================================================== ALL'OMBRA: la nuvola passa sul manifesto */
function manifesto() {
  const palco = $('.ombra__palco');
  const sezione = $('.ombra');
  const testi = $('.ombra__testi');
  const stato = { p: 0 };
  const aggiorna = () => {
    palco.style.setProperty('--p', stato.p.toFixed(4));
    const x = testi.offsetLeft + (stato.p * 1.3 - 0.13) * testi.offsetWidth;
    palco.style.setProperty('--bordo', x.toFixed(1) + 'px');
  };
  gsap.to(stato, {
    p: 1, ease: 'none', onUpdate: aggiorna,
    scrollTrigger: { trigger: sezione, start: 'top top', end: () => '+=' + Math.max(1, sezione.offsetHeight - innerHeight * 2), scrub: 0.6 },
  });
  aggiorna();
  /* le icone nel testo ondeggiano come foglie */
  $$('.ombra__testo--nitido .ic').forEach((ic, i) => {
    gsap.fromTo(ic, { rotation: -7 }, { rotation: 7, duration: 2.2 + i * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1, transformOrigin: '50% 90%' });
  });
}

/* ================================================================== CALURA: il filtro che fa tremare l'aria */
function calura() {
  const rumore = $('.calura-rumore');
  const mappa = rumore.nextElementSibling;
  const stato = { f: 0.012, s: 14 };
  const tw = gsap.to(stato, {
    f: 0.02, s: 20, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true,
    onUpdate: () => { rumore.setAttribute('baseFrequency', `${stato.f.toFixed(4)} ${(stato.f * 5).toFixed(4)}`); mappa.setAttribute('scale', stato.s.toFixed(1)); },
  });
  const seme = gsap.to(rumore, { attr: { seed: 60 }, duration: 12, ease: 'none', repeat: -1, paused: true });
  ScrollTrigger.create({ trigger: '.ombra', start: 'top bottom', endTrigger: '.controra', end: 'bottom top',
    onToggle: (s) => { if (s.isActive) { tw.play(); seme.play(); } else { tw.pause(); seme.pause(); } } });
}

/* ================================================================== LE CAMERE: il portico */
function camere() {
  const portico = $('.portico');
  const binario = $('.portico__binario');
  const stanze = $$('.stanza', binario);
  const pavimento = $('.portico__pavimento');
  const distanza = () => Math.max(0, binario.scrollWidth - portico.clientWidth);
  const corsa = gsap.to(binario, {
    x: () => -distanza(), ease: 'none',
    scrollTrigger: { trigger: portico, start: 'top top', end: () => '+=' + distanza() * 1.05, pin: true, scrub: 0.6, invalidateOnRefresh: true },
  });
  /* la macchia di sole in ogni camera segue la posizione dell'arco, come se il sole girasse */
  const luci = stanze.map((s) => s.querySelector('.luce'));
  const archi = stanze.map((s) => s.querySelector('.stanza__arco'));
  const quadri = stanze.map((s) => s.querySelector('.quadro'));
  gsap.set(luci, { transformOrigin: '50% 100%' });
  function aggiornaLuci() {
    const W = innerWidth;
    /* prima si leggono tutte le posizioni, poi si scrive: niente letture e scritture alternate */
    const pos = stanze.map((s) => { const r = s.getBoundingClientRect(); return clamp(-1.3, 1.3, (r.left + r.width / 2 - W / 2) / (W / 2)); });
    pos.forEach((t, i) => {
      gsap.set(luci[i], { skewX: t * 22, x: t * 40, opacity: 0.95 - Math.abs(t) * 0.25 });
      if (!archi[i].classList.contains('in-volo')) gsap.set(quadri[i], { xPercent: -t * 5 });
    });
    pavimento.style.backgroundPosition = `${(-corsa.progress() * 900).toFixed(1)}px 0`;
  }
  ScrollTrigger.create({ trigger: portico, start: 'top bottom', end: 'bottom top', onUpdate: aggiornaLuci, onRefresh: aggiornaLuci });
  aggiornaLuci();
  /* gli archi si svelano dal basso: i primi quando arriva la sezione, gli altri quando arrivano nel portico */
  const W0 = innerWidth;
  stanze.forEach((s, i) => {
    const vis = s.offsetLeft < W0 * 0.9;
    const tw = { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 4px 4px)' };
    gsap.fromTo(archi[i], tw, {
      clipPath: 'inset(0% 0% 0% 0% round 999px 999px 4px 4px)', duration: 1.3, ease: 'ombra', delay: vis ? i * 0.12 : 0,
      scrollTrigger: vis ? { trigger: portico, start: 'top 75%', toggleActions: 'play none none reverse' }
        : { trigger: s, containerAnimation: corsa, start: 'left 92%', toggleActions: 'play none none reverse' },
    });
  });
  /* nome e dati entrano quando la camera arriva */
  stanze.forEach((s) => {
    const d = s.querySelector('.stanza__didascalia');
    gsap.from(d.children, { autoAlpha: 0, y: 26, stagger: 0.07, duration: 0.8,
      scrollTrigger: { trigger: s, containerAnimation: corsa, start: 'left 88%', toggleActions: 'play none none reverse' } });
    gsap.fromTo(s.querySelector('.stanza__nome'), { '--w': 62 }, { '--w': 80, duration: 1.2, ease: 'ombra',
      scrollTrigger: { trigger: s, containerAnimation: corsa, start: 'left 88%', toggleActions: 'play none none reverse' } });
  });
  /* "prenota questa camera" sceglie la camera nel modulo */
  $$('[data-scegli]').forEach((a) => a.addEventListener('click', () => {
    const sel = $('#camera'); sel.value = a.dataset.scegli;
    gsap.fromTo(sel, { backgroundColor: 'rgba(242,193,78,.5)' }, { backgroundColor: 'rgba(242,193,78,0)', duration: 1.8, delay: 1.4 });
  }));
}

/* ------------------------------------------------------------------ la scheda della camera: l'arco vola nella scheda */
function scheda() {
  const sch = $('#scheda'), velo = $('.scheda__velo'), corpo = $('.scheda__corpo'), posto = $('.scheda__posto');
  const nome = $('.scheda__nome'), frase = $('.scheda__frase'), dati = $('.scheda__dati'), prenota = $('.scheda__prenota');
  const testi = $$('.scheda__testo > *');
  let aperta = null, segnaposto = null, occupato = false;
  function apri(arco) {
    if (occupato || aperta) return; occupato = true;
    const st = arco.closest('.stanza');
    nome.textContent = st.dataset.camera;
    frase.textContent = st.querySelector('.stanza__didascalia p').textContent;
    dati.innerHTML = st.querySelector('.stanza__dati').innerHTML;
    prenota.dataset.scegli = st.dataset.camera;
    const stato = Flip.getState(arco);
    segnaposto = document.createElement('div'); segnaposto.className = 'stanza__segnaposto';
    arco.parentNode.insertBefore(segnaposto, arco);
    arco.classList.add('in-volo');
    posto.appendChild(arco);
    sch.classList.add('is-aperta'); sch.setAttribute('aria-hidden', 'false');
    lenis && lenis.stop();
    gsap.set(corpo, { opacity: 1 });
    gsap.fromTo(velo, { opacity: 0 }, { opacity: 1, duration: 0.5 });
    gsap.fromTo(corpo, { backgroundColor: 'rgba(239,214,174,0)', boxShadow: '0px 0px 0 rgba(91,84,150,0)' }, { backgroundColor: 'rgba(239,214,174,1)', boxShadow: '16px 20px 0 rgba(91,84,150,.35)', duration: 0.6, delay: 0.25 });
    Flip.from(stato, { duration: 0.95, ease: 'ombra', absolute: true, zIndex: 90, onComplete: () => { occupato = false; $('.scheda__chiudi').focus({ preventScroll: true }); } });
    gsap.fromTo(testi, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.07, delay: 0.45 });
    aperta = arco;
  }
  function chiudi(poi) {
    if (!aperta || occupato) return; occupato = true;
    const arco = aperta;
    gsap.to(testi, { autoAlpha: 0, y: -12, duration: 0.25, stagger: 0.03 });
    gsap.to(corpo, { backgroundColor: 'rgba(239,214,174,0)', boxShadow: '0px 0px 0 rgba(91,84,150,0)', duration: 0.35 });
    const stato = Flip.getState(arco);
    segnaposto.replaceWith(arco);
    Flip.from(stato, { duration: 0.8, ease: 'ombra', absolute: true, zIndex: 90, onComplete: () => {
      arco.classList.remove('in-volo'); gsap.set(arco, { clearProps: 'zIndex' });
      sch.classList.remove('is-aperta'); sch.setAttribute('aria-hidden', 'true');
      gsap.set(corpo, { opacity: 0 });
      lenis && lenis.start(); occupato = false; aperta = null; arco.focus({ preventScroll: true }); poi && poi();
    } });
    gsap.to(velo, { opacity: 0, duration: 0.6, delay: 0.2 });
  }
  $$('.stanza__arco').forEach((a) => {
    a.addEventListener('click', () => apri(a));
    a.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apri(a); } });
  });
  velo.addEventListener('click', () => chiudi());
  $('.scheda__chiudi').addEventListener('click', () => chiudi());
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && aperta) chiudi(); });
  prenota.addEventListener('click', (e) => {
    e.preventDefault();
    const scelta = prenota.dataset.scegli;
    chiudi(() => { $('#camera').value = scelta; vaiA($('#prenota')); });
  });
}

/* ================================================================== A TAVOLA: si apparecchia da sola */
const OGGETTI = [
  { p: 'pane', x: 16, y: 26, l: 17, n: 'Pane di casa', s: '<ellipse cx="50" cy="50" rx="48" ry="36" fill="#C99A5B"/><ellipse cx="50" cy="50" rx="40" ry="29" fill="#8C5A32"/><ellipse cx="36" cy="46" rx="16" ry="11" fill="#E0B070" transform="rotate(-20 36 46)"/><ellipse cx="62" cy="54" rx="18" ry="11" fill="#D9A45E" transform="rotate(15 62 54)"/><path d="M28 44l14 6M55 50l14 7" stroke="#B47A40" stroke-width="3" stroke-linecap="round"/>' },
  { p: 'pane', x: 30, y: 12, l: 10, n: 'Olio dei nostri ulivi', s: '<circle cx="50" cy="50" r="46" fill="#F4ECDD"/><circle cx="50" cy="50" r="34" fill="#B9A63A"/><circle cx="50" cy="50" r="22" fill="#CDB94A"/><circle cx="44" cy="44" r="6" fill="#E7DA86"/>' },
  { p: 'bigoli', x: 44, y: 30, l: 19, n: 'Bigoli al ragù d\'anatra', s: '<circle cx="50" cy="50" r="48" fill="#F7F1E4"/><circle cx="50" cy="50" r="40" fill="#EFE4CE"/><circle cx="50" cy="50" r="30" fill="#8C4A2C"/><path d="M26 46c10-12 18 12 28 0s18 10 22 2M28 56c8-8 18 8 26-2s16 6 22-2M34 38c8-6 14 6 22-2s12 4 16 0" fill="none" stroke="#C58A48" stroke-width="4" stroke-linecap="round"/><path d="M40 60l4-3M58 42l3 3" stroke="#3E6B3A" stroke-width="4" stroke-linecap="round"/>' },
  { p: 'risotto', x: 70, y: 28, l: 18, n: 'Risotto alle erbe', s: '<circle cx="50" cy="50" r="48" fill="#F7F1E4"/><circle cx="50" cy="50" r="40" fill="#EDE4CF"/><circle cx="50" cy="50" r="31" fill="#E7D9A4"/><g fill="#6F8C44"><circle cx="40" cy="44" r="4"/><circle cx="58" cy="40" r="3.5"/><circle cx="52" cy="58" r="4"/><circle cx="36" cy="58" r="3"/><circle cx="62" cy="54" r="3"/></g><path d="M44 30l6 8M62 60l6 4" stroke="#4E6B30" stroke-width="3" stroke-linecap="round"/>' },
  { p: 'faraona', x: 56, y: 62, l: 24, n: 'Faraona al forno', s: '<ellipse cx="50" cy="50" rx="48" ry="34" fill="#F4ECDD"/><ellipse cx="50" cy="50" rx="40" ry="27" fill="#DCCFB6"/><ellipse cx="52" cy="48" rx="22" ry="16" fill="#A8622F"/><ellipse cx="46" cy="44" rx="10" ry="6" fill="#C98546"/><g fill="#E0B55A"><circle cx="24" cy="54" r="7"/><circle cx="30" cy="40" r="6"/><circle cx="76" cy="56" r="7"/><circle cx="74" cy="40" r="6"/></g><path d="M20 44l6 2M78 48l4-4" stroke="#557A3A" stroke-width="3" stroke-linecap="round"/>' },
  { p: 'formaggi', x: 20, y: 66, l: 22, n: 'Formaggi e confettura di giuggiole', s: '<rect x="4" y="18" width="92" height="64" rx="8" fill="#A87448"/><rect x="4" y="18" width="92" height="64" rx="8" fill="none" stroke="#8C5A32" stroke-width="3"/><path d="M16 34l26 6-22 14Z" fill="#F2D27A"/><path d="M48 56l24-10 4 20Z" fill="#E9C86A"/><rect x="58" y="26" width="24" height="16" rx="3" fill="#F7EBC8"/><circle cx="30" cy="66" r="9" fill="#F4ECDD"/><circle cx="30" cy="66" r="6" fill="#8C2F2B"/>' },
  { p: 'insalata', x: 84, y: 64, l: 17, n: 'Insalata dell\'orto', s: '<circle cx="50" cy="50" r="46" fill="#F4ECDD"/><circle cx="50" cy="50" r="38" fill="#E4DCC6"/><g fill="#6E9A4A"><ellipse cx="40" cy="40" rx="14" ry="9" transform="rotate(-30 40 40)"/><ellipse cx="60" cy="42" rx="14" ry="9" transform="rotate(25 60 42)"/><ellipse cx="46" cy="60" rx="13" ry="8" transform="rotate(10 46 60)"/></g><g fill="#C9412F"><circle cx="58" cy="60" r="6"/><circle cx="36" cy="52" r="5"/></g><g fill="#8FB25C"><ellipse cx="52" cy="50" rx="9" ry="6"/></g>' },
  { p: 'zaleti', x: 38, y: 84, l: 14, n: 'Zaleti', s: '<circle cx="50" cy="50" r="46" fill="#F4ECDD"/><circle cx="50" cy="50" r="36" fill="#E6DCC4"/><g fill="#E0A94E"><ellipse cx="38" cy="42" rx="11" ry="7" transform="rotate(-20 38 42)"/><ellipse cx="60" cy="44" rx="11" ry="7" transform="rotate(20 60 44)"/><ellipse cx="48" cy="62" rx="11" ry="7"/></g><g fill="#5A2E2A"><circle cx="36" cy="41" r="1.8"/><circle cx="62" cy="45" r="1.8"/><circle cx="46" cy="62" r="1.8"/><circle cx="52" cy="60" r="1.6"/></g>' },
  { p: 'zaleti', x: 74, y: 86, l: 11, n: 'Fior d\'Arancio', s: '<circle cx="50" cy="50" r="40" fill="#F4ECDD" opacity=".85"/><circle cx="50" cy="50" r="31" fill="#E2A33A"/><circle cx="42" cy="42" r="8" fill="#F2C96A" opacity=".8"/><circle cx="50" cy="50" r="40" fill="none" stroke="#E9DFC9" stroke-width="4"/>' },
  { p: 'bigoli', x: 88, y: 16, l: 13, n: 'Vino rosso della casa', s: '<circle cx="50" cy="50" r="42" fill="#EFE7D6" opacity=".9"/><circle cx="50" cy="50" r="34" fill="#6E1428"/><circle cx="41" cy="41" r="9" fill="#9C2F45" opacity=".7"/><circle cx="50" cy="50" r="42" fill="none" stroke="#E4DAC4" stroke-width="5"/>' },
  { p: 'insalata', x: 50, y: 12, l: 13, n: 'Zinnie dell\'orto', s: '<g transform="translate(50 50)"><g fill="#E0643A"><ellipse rx="10" ry="22" transform="rotate(0)"/><ellipse rx="10" ry="22" transform="rotate(45)"/><ellipse rx="10" ry="22" transform="rotate(90)"/><ellipse rx="10" ry="22" transform="rotate(135)"/></g><g fill="#F2C14E" transform="translate(18 16) scale(.55)"><ellipse rx="10" ry="22"/><ellipse rx="10" ry="22" transform="rotate(60)"/><ellipse rx="10" ry="22" transform="rotate(120)"/></g><circle r="8" fill="#6B3A1E"/></g>' },
];

function tavola(fermo = false) {
  const contenitore = $('.oggetti');
  const nodi = OGGETTI.map((o) => {
    const d = document.createElement('div');
    d.className = 'oggetto'; d.dataset.piatto = o.p;
    d.style.cssText = `--x:${o.x}%;--y:${o.y}%;--l:${o.l}%;aspect-ratio:1`;
    d.innerHTML = `<div class="oggetto__ombra"><svg viewBox="0 0 100 100">${o.s}</svg></div><div class="oggetto__corpo"><svg viewBox="0 0 100 100">${o.s}</svg></div><span class="oggetto__cartellino">${o.n}</span>`;
    contenitore.appendChild(d);
    return d;
  });
  const voci = $$('.menu-del-giorno li');
  const ora = $('.tavola__ora');
  let ultimo = -1;
  const servito = (p, s) => voci.forEach((v) => { if (v.dataset.piatto === p) v.classList.toggle('is-servito', s); });
  const annuncia = (i) => {
    if (i === ultimo) return; ultimo = i;
    if (i < 0) { gsap.to(ora, { opacity: 0, duration: 0.2 }); return; }
    ora.textContent = OGGETTI[i].n;
    gsap.fromTo(ora, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, overwrite: true });
  };

  if (fermo) {
    nodi.forEach((n) => gsap.set(n.querySelector('.oggetto__ombra'), { x: 7, y: 9 }));
    voci.forEach((v) => v.classList.add('is-servito'));
    return;
  }
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.tavola', start: 'top top', end: '+=160%', pin: '.tavola__palco', scrub: 0.7, invalidateOnRefresh: true },
  });
  tl.fromTo('.tovaglia', { scaleX: 0.02, autoAlpha: 0.4 }, { scaleX: 1, autoAlpha: 1, duration: 0.8, ease: 'power2.out' }, 0);
  nodi.forEach((n, i) => {
    const corpo = n.querySelector('.oggetto__corpo'), ombra = n.querySelector('.oggetto__ombra');
    const giro = gsap.utils.random(-26, 26);
    const t0 = 0.5 + i * 0.32;
    tl.fromTo(n, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, t0)
      .fromTo(corpo, { y: -90, scale: 1.45, rotation: giro }, { y: 0, scale: 1, rotation: 0, duration: 0.55, ease: 'power2.in' }, t0)
      .fromTo(ombra, { x: 60, y: 80, scale: 1.55, opacity: 0.08 }, { x: 7, y: 9, scale: 1, opacity: 0.45, duration: 0.55, ease: 'power2.in' }, t0)
      .to(corpo, { scale: 1.035, duration: 0.07, ease: 'power1.out' }, t0 + 0.55)
      .to(corpo, { scale: 1, duration: 0.12, ease: 'power1.inOut' }, t0 + 0.62)
      .call(() => { servito(OGGETTI[i].p, true); annuncia(i); }, null, t0 + 0.5)
      .call(() => { servito(OGGETTI[i].p, false); annuncia(i - 1); }, null, t0 + 0.49);
  });
  tl.to({}, { duration: 0.6 });

  /* col mouse un piatto si solleva: l'ombra si allarga e si sposta */
  if (!TOCCO) nodi.forEach((n) => {
    const corpo = n.querySelector('.oggetto__corpo'), ombra = n.querySelector('.oggetto__ombra');
    n.addEventListener('pointerenter', () => { n.classList.add('is-su'); gsap.to(corpo, { y: -10, scale: 1.05, duration: 0.35, overwrite: 'auto' }); gsap.to(ombra, { x: 20, y: 26, scale: 1.1, opacity: 0.3, duration: 0.35, overwrite: 'auto' }); });
    n.addEventListener('pointerleave', () => { n.classList.remove('is-su'); gsap.to(corpo, { y: 0, scale: 1, duration: 0.6, ease: 'elastic.out(1, .55)', overwrite: 'auto' }); gsap.to(ombra, { x: 7, y: 9, scale: 1, opacity: 0.45, duration: 0.5, overwrite: 'auto' }); });
  });

  /* le foglie del pergolato: le loro ombre si muovono sulla tavola */
  const pergolato = creaPergolato($('.pergolato'));
  if (pergolato) ScrollTrigger.create({ trigger: '.tavola', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? pergolato.avvia() : pergolato.ferma()) });
}

/* ================================================================== LA CONTRORA: l'amaca sotto il noce */
function controra() {
  const amaca = creaAmaca($('.noce__svg'), { tocco: TOCCO });
  if (amaca) ScrollTrigger.create({ trigger: '.noce', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? amaca.avvia() : amaca.ferma()) });
  gsap.from('.controra__testo, .controra__cose li', { autoAlpha: 0, y: 30, stagger: 0.08, duration: 1, scrollTrigger: { trigger: '.controra__corpo', start: 'top 80%', once: true } });
  /* la parola si allarga pigra mentre passa */
  gsap.fromTo('.controra__titolo', { fontStretch: '62%' }, { fontStretch: '125%', ease: 'none', scrollTrigger: { trigger: '.controra__titolo', start: 'top 95%', end: 'top 30%', scrub: 0.8 } });
}

/* ================================================================== LA TENUTA: numeri che si allungano */
function tenuta() {
  $$('.numero').forEach((n) => {
    const fino = +n.dataset.fino;
    const da = fino > 1000 ? fino - 70 : 0;
    const o = { v: da, w: 62, s: 0 };
    n.textContent = da;
    gsap.to(o, {
      v: fino, w: 100, s: 12, duration: 2.2, ease: 'power3.out',
      scrollTrigger: { trigger: n, start: 'top 85%', once: true },
      onUpdate: () => { n.textContent = Math.round(o.v); n.style.setProperty('--w', o.w.toFixed(1)); n.style.setProperty('--ls', o.s.toFixed(1)); },
    });
  });
  gsap.from('.numeri li', { borderTopColor: 'rgba(43,34,51,0)', duration: 1.2, stagger: 0.1, scrollTrigger: { trigger: '.numeri', start: 'top 85%', once: true } });
}

/* ================================================================== MENTRE STATE ALL'OMBRA: le parole si sciolgono */
function muta() {
  const parole = $$('.muta__parola');
  const dove = $$('.muta__dove li');
  const sfoca = $('.sciogli-sfoca');
  const scatola = $('.muta__parole');
  const W = parole.map((w) => +w.dataset.w || 80);
  const n = parole.length / 2;
  const stato = { p: 0 };
  let corpo = 200;
  const misuraCorpo = () => { corpo = parseFloat(getComputedStyle(parole[0]).fontSize) || 200; };
  misuraCorpo();
  ScrollTrigger.addEventListener('refresh', misuraCorpo);
  function disegna() {
    const pp = clamp(0, 0.9999, stato.p) * n;
    const seg = Math.floor(pp), t = pp - seg;
    const grezzo = parole[seg * 2], fatto = parole[seg * 2 + 1], poi = parole[seg * 2 + 2];
    parole.forEach((w) => { if (w !== grezzo && w !== fatto && w !== poi) gsap.set(w, { opacity: 0 }); });
    dove.forEach((d, i) => { if (i !== seg) gsap.set(d, { opacity: 0 }); });
    const m = clamp(0, 1, (t - 0.12) / 0.46);
    const wOra = lerp(W[seg * 2], W[seg * 2 + 1], m);
    let sfuma = Math.sin(Math.PI * m) * corpo * 0.045;
    gsap.set(grezzo, { opacity: 1 - m, yPercent: 0, '--w': wOra });
    gsap.set(fatto, { opacity: m, '--w': wOra, yPercent: 0 });
    gsap.set(dove[seg], { opacity: clamp(0, 1, (t - 0.5) / 0.12) * (poi ? 1 - clamp(0, 1, (t - 0.82) / 0.1) : 1), y: 0 });
    if (poi) {
      const via = clamp(0, 1, (t - 0.8) / 0.1), entra = clamp(0, 1, (t - 0.88) / 0.12);
      gsap.set(fatto, { opacity: m * (1 - via), yPercent: -34 * via });
      gsap.set(poi, { opacity: entra, yPercent: 34 * (1 - entra), '--w': W[seg * 2 + 2] });
    }
    sfoca.setAttribute('stdDeviation', sfuma.toFixed(2));
    scatola.style.filter = sfuma > 0.1 ? '' : 'none';
  }
  gsap.to(stato, { p: 1, ease: 'none', onUpdate: disegna, scrollTrigger: { trigger: '.muta', start: 'top top', end: 'bottom bottom', scrub: 0.7 } });
  disegna();
}

/* ================================================================== DINTORNI: il panorama */
function dintorni() {
  const palco = $('.dintorni__palco');
  const binario = $('.panorama__binario');
  const distanza = () => Math.max(0, binario.offsetWidth - palco.clientWidth);
  const corsa = gsap.to(binario, {
    x: () => -distanza(), ease: 'none',
    scrollTrigger: { trigger: '.dintorni', start: 'top top', end: () => '+=' + distanza() * 1.05, pin: palco, scrub: 0.6, invalidateOnRefresh: true },
  });
  /* i colli lontani scorrono più lenti: profondità */
  const lontani = $('.p-strato--1'), medi = $('.p-strato--2'), luoghi = $('.p-luoghi');
  ScrollTrigger.create({
    trigger: '.dintorni', start: 'top top', end: () => '+=' + distanza() * 1.05, scrub: true,
    onUpdate: (s) => {
      const d = s.progress * 4800;
      lontani.setAttribute('transform', `translate(${(d * 0.34).toFixed(1)} 0)`);
      medi.setAttribute('transform', `translate(${(d * 0.14).toFixed(1)} 0)`);
      luoghi.setAttribute('transform', `translate(${(d * 0.14).toFixed(1)} 0)`);
    },
  });
  /* le ombre delle nuvole passano sui colli */
  const nubi = $$('.p-nube').map((n, i) => gsap.to(n, { attr: { cx: `+=${700 + i * 180}` }, duration: 26 + i * 6, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true }));
  ScrollTrigger.create({ trigger: '.dintorni', start: 'top bottom', end: 'bottom top', onToggle: (s) => nubi.forEach((t) => (s.isActive ? t.play() : t.pause())) });
  /* i cartelli si alzano dal prato quando arrivano */
  $$('.cartello').forEach((c) => {
    const tav = c.querySelector('.cartello__tavola'), palo = c.querySelector('.cartello__palo');
    gsap.timeline({ scrollTrigger: { trigger: c, containerAnimation: corsa, start: 'left 82%', toggleActions: 'play none none reverse' } })
      .fromTo(palo, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.45, ease: 'power2.out' }, 0)
      .fromTo(tav, { rotationX: -92, transformOrigin: '50% 100%' }, { rotationX: 0, duration: 1.1, ease: 'elastic.out(1, .6)' }, 0.2);
  });
}

/* ================================================================== IL VINO: l'ombra del campanile e il calice */
function vino(fermo = false) {
  /* terrazze: le strisce chiare si ritirano una alla volta, come i terrazzamenti di una vigna */
  const terr = $$('.terrazze i');
  const ordine = [2, 0, 3, 1, 4].map((i) => terr[i]);
  const tt = gsap.timeline({ scrollTrigger: { trigger: '.vino', start: 'top bottom', end: 'top 15%', scrub: 0.5 } });
  ordine.forEach((t, i) => tt.fromTo(t, { scaleY: 1 }, { scaleY: 0, duration: 0.5, ease: 'power2.in' }, i * 0.14));
  /* selciato in prospettiva */
  const righe = $('.piazza__righe');
  let d = '';
  for (let i = -12; i <= 12; i++) d += `M${500 + i * 18} 640L${500 + i * 120} 900`;
  for (let j = 0; j < 7; j++) { const y = 640 + Math.pow(j / 6, 1.7) * 260; d += `M0 ${y.toFixed(1)}H1000`; }
  righe.innerHTML = `<path d="${d}" fill="none"/>`;

  const ombra = $('.piazza__ombra'), banco = $('.banco');
  const piede = { x: 465, y: 690 };
  const disegna = (ang) => {
    const L = 330 + Math.abs(Math.cos(rad(ang))) * 120;
    const dx = Math.sin(rad(ang)) * L, dy = Math.cos(rad(ang)) * L * 0.42;
    const px = Math.cos(rad(ang)) * 38, py = -Math.sin(rad(ang)) * 16;
    ombra.setAttribute('d', `M${piede.x - px} ${piede.y - py}L${piede.x + px} ${piede.y + py}L${piede.x + dx + px * 0.8} ${piede.y + dy + py * 0.8}L${piede.x + dx - px * 0.8} ${piede.y + dy - py * 0.8}Z`);
    const bx = piede.x + dx * 0.72, by = piede.y + dy * 0.72;
    banco.setAttribute('transform', `translate(${bx.toFixed(1)} ${by.toFixed(1)}) scale(${(0.9 + (by - 690) / 900).toFixed(3)})`);
  };
  const stato = { a: -58 };
  disegna(stato.a);
  if (fermo) { disegna(22); return; }
  gsap.timeline({ scrollTrigger: { trigger: '.vino__piazza', start: 'top top', end: '+=140%', pin: true, scrub: 0.7 } })
    .to(stato, { a: 58, duration: 1, ease: 'none', onUpdate: () => disegna(stato.a) }, 0)
    .to('.piazza__cielo', { attr: { fill: '#C9644A' }, duration: 1, ease: 'none' }, 0)
    .from('.vino__riga', { autoAlpha: 0, y: 30, stagger: 0.18, duration: 0.3, ease: 'sole' }, 0.05);

  /* il calice si riempie scorrendo */
  const liquido = $('.calice__liquido');
  gsap.fromTo(liquido, { y: 170 }, { y: 0, ease: 'none', scrollTrigger: { trigger: '.vino__calice', start: 'top 85%', end: 'center 45%', scrub: 0.8 } });
  const onda = gsap.to('.calice__onda', { x: -60, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true });
  ScrollTrigger.create({ trigger: '.vino__calice', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? onda.play() : onda.pause()) });
  gsap.fromTo('.calice__ombra, .calice__caustica', { scaleX: 0.2, transformOrigin: '0% 50%', svgOrigin: '345 800' }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.vino__calice', start: 'top 85%', end: 'center 45%', scrub: 0.8 } });

  const calice = $('.calice');
  const causA = $('.caustica-a'), causB = $('.caustica-b');
  const scegli = (b) => {
    $$('.vino-voce').forEach((x) => x.classList.toggle('is-scelto', x === b));
    const o = { c: getComputedStyle(calice).getPropertyValue('--liquido').trim() || '#6E1428' };
    gsap.to(o, { c: b.dataset.colore, duration: 0.9, ease: 'ombra', onUpdate: () => calice.style.setProperty('--liquido', o.c) });
    gsap.to([causA, causB], { attr: { 'stop-color': b.dataset.caustica }, duration: 0.9, ease: 'ombra' });
    gsap.fromTo('.calice__onda', { y: -10 }, { y: 0, duration: 1.2, ease: 'elastic.out(1, .4)' });
  };
  $$('.vino-voce').forEach((b) => {
    b.addEventListener('click', () => scegli(b));
    if (!TOCCO) b.addEventListener('pointerenter', () => scegli(b));
  });
  scegli($('.vino-voce'));
}

/* ================================================================== NASTRO: al sole e all'ombra
   Due nastri uguali e sincronizzati, ognuno ritagliato su una metà: le parole entrano al sole
   con l'ombra netta e, passata la meridiana, sono all'ombra. L'ombra al sole pende con la velocità. */
function nastro() {
  const binari = $$('.nastro__binario');
  binari.forEach((b) => { const p = b.querySelector('.nastro__pezzo'); for (let i = 0; i < 3; i++) b.appendChild(p.cloneNode(true)); });
  const pezzo = $('.nastro__pezzo');
  const alSole = $$('.nastro__meta--sole .nastro__pezzo');
  let x = 0, vel = 0, pend = 0;
  if (lenis) lenis.on('scroll', (e) => { vel = clamp(-60, 60, e.velocity || 0); });
  const giro = () => {
    const w = pezzo.offsetWidth || 1;
    x -= 0.9 + Math.abs(vel) * 0.35;
    if (x <= -w) x += w;
    const t = `translate3d(${x.toFixed(2)}px,0,0)`;
    binari.forEach((b) => { b.style.transform = t; });
    pend += (vel * 0.6 - pend) * 0.08; vel *= 0.92;
    alSole.forEach((p) => p.style.setProperty('--pendenza', pend.toFixed(2)));
  };
  ScrollTrigger.create({ trigger: '.nastro', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? gsap.ticker.add(giro) : gsap.ticker.remove(giro)) });
}

/* ================================================================== PRENOTA */
function prenota() {
  const f = $('#modulo');
  gsap.from('.modulo .campo, .modulo__fondo', { autoAlpha: 0, y: 30, stagger: 0.06, duration: 0.9, scrollTrigger: { trigger: f, start: 'top 82%', once: true } });
  const oggi = new Date(); const iso = (d) => d.toISOString().slice(0, 10);
  $('#arrivo').min = iso(oggi); $('#partenza').min = iso(new Date(oggi.getTime() + 864e5));
  $('#arrivo').addEventListener('change', (e) => { const d = new Date(e.target.value); if (!isNaN(d)) $('#partenza').min = iso(new Date(d.getTime() + 864e5)); });
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const nota = $('.modulo__nota');
    nota.textContent = 'Grazie. Questo è un sito dimostrativo: la richiesta non è stata spedita a nessuno.';
    nota.classList.add('is-evidente');
    gsap.fromTo(nota, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6 });
  });
}

/* ================================================================== PIEDE: il nome sotto la luna */
function piede(fermo = false) {
  const palco = $('.piede__palco');
  const pied = inPiedi({
    palco, lettere: $('.piede__nome'), visibile: $('.piede__nome .nome__visibile'), ombra: $('.piede__terra .nome--ombra'), terra: $('.piede__terra'),
    larghezza: 0.92, baseFrazione: 0.62, altezzaMax: 0.5,
  });
  pied.stendi(24, 22, 1);
  const luna = { el: 34, az: 30 };
  if (fermo) { pied.stendi(16, 26); ScrollTrigger.addEventListener('refreshInit', () => { pied.misura(); pied.stendi(16, 26); }); return; }
  gsap.timeline({ scrollTrigger: { trigger: '.piede', start: 'top 75%', once: true } })
    .from(pied.lettere, { scaleY: 0, duration: 1.1, ease: 'back.out(1.5)', stagger: 0.05 }, 0)
    .from(pied.ombre, { scaleY: 0, duration: 1.1, ease: 'back.out(1.5)', stagger: 0.05 }, 0)
    .to(luna, { el: 14, az: 26, duration: 2.6, ease: 'power2.inOut', onUpdate: () => pied.stendi(luna.el, luna.az) }, 0);
  ScrollTrigger.addEventListener('refreshInit', () => { pied.misura(); pied.stendi(luna.el, luna.az); });
}

/* ================================================================== AVVIO */
function avvia() {
  titoli();
  manifesto();
  calura();
  camere();
  scheda();
  tavola();
  controra();
  tenuta();
  muta();
  dintorni();
  vino();
  nastro();
  prenota();
  piede();
  apertura.scorrimento();
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}

function statico() {
  apertura.statico();
  gsap.set('#testata', { visibility: 'visible' });
  $('.ombra__palco').style.setProperty('--p', '1');
  tavola(true);
  vino(true);
  scheda();
  prenota();
}

const caratteri = Promise.all([
  document.fonts.load('900 100px Archivo'), document.fonts.load('700 20px Archivo'),
  document.fonts.load('400 20px Newsreader'), document.fonts.load('italic 400 20px Newsreader'),
]).then(() => document.fonts.ready);
const pronti = Promise.race([caratteri, new Promise((r) => setTimeout(r, 3000))]);
document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', () => { apertura.pied.misura(); apertura.segna(); ScrollTrigger.refresh(); });
pronti.then(() => {
  apertura.pied.misura();
  if (STATICO) { statico(); piede(true); return; }
  if (lenis) lenis.stop();
  window.scrollTo(0, 0);
  avvia();
  if (QA) { gsap.set('.abbaglio', { autoAlpha: 0 }); apertura.pomeriggio(); testata.entra(); return; }
  const tl = apertura.entrata();
  tl.call(() => { lenis && lenis.start(); testata.entra(); }, null, 2.2);
  /* rete di sicurezza: se la scheda è in background la timeline può restare ferma */
  setTimeout(() => { if (tl.progress() < 1) tl.progress(1); lenis && lenis.start(); }, 6000);
});
addEventListener('load', () => ScrollTrigger.refresh());
