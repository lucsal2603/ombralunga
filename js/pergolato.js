/* Ombralunga: l'ombra a macchie del pergolato.
   Un solo shader a schermo intero, disegnato a metà risoluzione (le macchie devono essere morbide),
   fuso sulla tavola con mix-blend-mode: multiply. Gira solo quando la tavola è sullo schermo. */

const VS = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `
precision mediump float;
uniform vec2 uRes;
uniform float uT;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), u.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * n(p); p = p * 2.03 + 11.7; a *= 0.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes.y;
  float brezza = sin(uT * 0.55) * 0.12 + sin(uT * 1.3) * 0.04;
  vec2 q = uv * 2.6 + vec2(brezza, brezza * 0.4) + vec2(uT * 0.015, 0.0);
  float w = fbm(q * 1.6 + uT * 0.04);
  float foglie = fbm(q + w * 0.9);
  /* 1 = sole che passa fra le foglie, 0 = ombra */
  float sole = smoothstep(0.5, 0.58, foglie);
  float riflessi = smoothstep(0.7, 0.76, fbm(uv * 7.0 + vec2(uT * 0.05, -uT * 0.03))) * 0.5;
  float luce = clamp(sole + riflessi * (1.0 - sole), 0.0, 1.0);
  vec3 ombra = vec3(0.80, 0.77, 0.90);
  vec3 col = mix(ombra, vec3(1.0, 0.985, 0.94), luce);
  gl_FragColor = vec4(col, 1.0);
}`;

export function creaPergolato(canvas) {
  if (!canvas) return null;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'low-power' });
  if (!gl) { canvas.style.display = 'none'; return null; }
  const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.display = 'none'; return null; }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uT = gl.getUniformLocation(prog, 'uT');

  const scala = 0.5;
  function misura() {
    const w = Math.max(2, Math.round(canvas.clientWidth * scala));
    const hh = Math.max(2, Math.round(canvas.clientHeight * scala));
    if (canvas.width !== w || canvas.height !== hh) { canvas.width = w; canvas.height = hh; }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  let attivo = false, t0 = performance.now();
  function disegna() {
    gl.uniform1f(uT, (performance.now() - t0) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  const giro = () => { if (attivo) disegna(); };
  misura(); disegna();
  addEventListener('resize', () => { misura(); disegna(); });
  return {
    avvia() { if (attivo) return; attivo = true; misura(); gsap.ticker.add(giro); },
    ferma() { attivo = false; gsap.ticker.remove(giro); },
  };
}
