// Gerador de QR Code do próprio site (25/11/2026). Sem biblioteca externa e sem internet.
// Modo byte (UTF-8), correção de erro M, versões 1 a 10 (até 213 caracteres: sobra para os links do Parque).
// Uso: PR_QR.svg('https://parqueretiro.org.br/?o=canal', { escala: 8 })  |  PR_QR.matriz(texto)  |  PR_QR.pngUrl(texto, 8)
(function () {
'use strict';
// [codewords de correção por bloco, [blocos, dados por bloco], [blocos, dados por bloco] (opcional)] — nível M
var BLOCOS = [null,
  [10, [1, 16]], [16, [1, 28]], [26, [1, 44]], [18, [2, 32]], [24, [2, 43]],
  [16, [4, 27]], [18, [4, 31]], [22, [2, 38], [2, 39]], [22, [3, 36], [2, 37]], [26, [4, 43], [1, 44]]];
var ALINHA = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

// Corpo de Galois GF(256), polinômio 0x11D
var EXP = new Array(512), LOG = new Array(256);
(function () { var x = 1; for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11D; } for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
function geradora(n) { var g = [1]; for (var i = 0; i < n; i++) { var p = new Array(g.length + 1).fill(0); for (var j = 0; j < g.length; j++) { p[j] ^= g[j]; p[j + 1] ^= mul(g[j], EXP[i]); } g = p; } return g; }
function correcao(dados, n) { var g = geradora(n), r = dados.concat(new Array(n).fill(0)); for (var i = 0; i < dados.length; i++) { var c = r[i]; if (c) for (var j = 0; j < g.length; j++) r[i + j] ^= mul(g[j], c); } return r.slice(dados.length); }

function utf8(s) { return Array.prototype.slice.call(new TextEncoder().encode(String(s))); }
function totalDados(v) { var b = BLOCOS[v], t = 0; for (var i = 1; i < b.length; i++) t += b[i][0] * b[i][1]; return t; }
function escolheVersao(n) { for (var v = 1; v <= 10; v++) { var bits = 4 + (v <= 9 ? 8 : 16) + n * 8; if (bits <= totalDados(v) * 8) return v; } return 0; }

function codewords(bytes, v) {
  var bits = [], push = function (val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  push(4, 4); push(bytes.length, v <= 9 ? 8 : 16); bytes.forEach(function (b) { push(b, 8); });
  var cap = totalDados(v) * 8; for (var t = 0; t < 4 && bits.length < cap; t++) bits.push(0);
  while (bits.length % 8) bits.push(0);
  var dados = []; for (var i = 0; i < bits.length; i += 8) { var x = 0; for (var k = 0; k < 8; k++) x = (x << 1) | bits[i + k]; dados.push(x); }
  for (var pad = 0; dados.length < totalDados(v); pad++) dados.push(pad % 2 ? 0x11 : 0xEC);
  var b = BLOCOS[v], ecc = b[0], blocos = [], pos = 0;
  for (var g = 1; g < b.length; g++) for (var n = 0; n < b[g][0]; n++) { var d = dados.slice(pos, pos + b[g][1]); pos += b[g][1]; blocos.push({ d: d, e: correcao(d, ecc) }); }
  var out = [], maxD = Math.max.apply(null, blocos.map(function (x) { return x.d.length; }));
  for (i = 0; i < maxD; i++) blocos.forEach(function (x) { if (i < x.d.length) out.push(x.d[i]); });
  for (i = 0; i < ecc; i++) blocos.forEach(function (x) { out.push(x.e[i]); });
  return out;
}

function dig(x) { var n = 0; while (x) { n++; x >>>= 1; } return n; }
function bchFormato(d) { var G = 0x537, x = d << 10; while (dig(x) - dig(G) >= 0) x ^= G << (dig(x) - dig(G)); return ((d << 10) | x) ^ 0x5412; }
function bchVersao(v) { var G = 0x1F25, x = v << 12; while (dig(x) - dig(G) >= 0) x ^= G << (dig(x) - dig(G)); return (v << 12) | x; }
var MASCARAS = [
  function (i, j) { return (i + j) % 2 === 0; }, function (i) { return i % 2 === 0; }, function (i, j) { return j % 3 === 0; }, function (i, j) { return (i + j) % 3 === 0; },
  function (i, j) { return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0; }, function (i, j) { return (i * j) % 2 + (i * j) % 3 === 0; },
  function (i, j) { return ((i * j) % 2 + (i * j) % 3) % 2 === 0; }, function (i, j) { return ((i * j) % 3 + (i + j) % 2) % 2 === 0; }];

function monta(v, cw, mascara) {
  var N = v * 4 + 17, m = []; for (var r = 0; r < N; r++) m.push(new Array(N).fill(null));
  function localizador(r0, c0) { for (var r = -1; r <= 7; r++) for (var c = -1; c <= 7; c++) { var y = r0 + r, x = c0 + c; if (y < 0 || y >= N || x < 0 || x >= N) continue;
    m[y][x] = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6)) || (r >= 2 && r <= 4 && c >= 2 && c <= 4); } }
  localizador(0, 0); localizador(N - 7, 0); localizador(0, N - 7);
  var al = ALINHA[v]; al.forEach(function (cy) { al.forEach(function (cx) { if (m[cy][cx] !== null) return;
    for (var r = -2; r <= 2; r++) for (var c = -2; c <= 2; c++) m[cy + r][cx + c] = (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)); }); });
  for (var i = 8; i < N - 8; i++) { if (m[i][6] === null) m[i][6] = i % 2 === 0; if (m[6][i] === null) m[6][i] = i % 2 === 0; }
  var bf = bchFormato((0 << 3) | mascara); // nível M = 00
  for (i = 0; i < 15; i++) { var bit = ((bf >> i) & 1) === 1;
    if (i < 6) m[i][8] = bit; else if (i < 8) m[i + 1][8] = bit; else m[N - 15 + i][8] = bit;
    if (i < 8) m[8][N - i - 1] = bit; else if (i < 9) m[8][15 - i] = bit; else m[8][15 - i - 1] = bit; }
  m[N - 8][8] = true;
  if (v >= 7) { var bv = bchVersao(v); for (i = 0; i < 18; i++) { var b2 = ((bv >> i) & 1) === 1; m[Math.floor(i / 3)][i % 3 + N - 11] = b2; m[i % 3 + N - 11][Math.floor(i / 3)] = b2; } }
  var inc = -1, row = N - 1, bi = 7, by = 0, f = MASCARAS[mascara];
  for (var col = N - 1; col > 0; col -= 2) { if (col === 6) col--;
    for (;;) { for (var c = 0; c < 2; c++) { if (m[row][col - c] === null) { var d = false; if (by < cw.length) d = ((cw[by] >>> bi) & 1) === 1; if (f(row, col - c)) d = !d; m[row][col - c] = d; bi--; if (bi === -1) { by++; bi = 7; } } }
      row += inc; if (row < 0 || row >= N) { row -= inc; inc = -inc; break; } } }
  return m;
}
function penalidade(m) {
  var N = m.length, p = 0, r, c, k;
  for (var eixo = 0; eixo < 2; eixo++) for (r = 0; r < N; r++) { var run = 1, linha = ''; for (c = 0; c < N; c++) { var a = eixo ? m[c][r] : m[r][c]; linha += a ? '1' : '0';
    if (c > 0) { var b = eixo ? m[c - 1][r] : m[r][c - 1]; if (a === b) { run++; if (c === N - 1 && run >= 5) p += 3 + run - 5; } else { if (run >= 5) p += 3 + run - 5; run = 1; } } }
    var re = /10111010000|00001011101/g; while (re.exec(linha)) { p += 40; re.lastIndex -= 10; } }
  for (r = 0; r < N - 1; r++) for (c = 0; c < N - 1; c++) { var q = m[r][c]; if (q === m[r][c + 1] && q === m[r + 1][c] && q === m[r + 1][c + 1]) p += 3; }
  var escuros = 0; for (r = 0; r < N; r++) for (c = 0; c < N; c++) if (m[r][c]) escuros++;
  k = Math.floor(Math.abs(escuros * 100 / (N * N) - 50) / 5); return p + k * 10;
}
function matriz(texto) {
  var bytes = utf8(texto), v = escolheVersao(bytes.length);
  if (!v) throw new Error('Texto longo demais para o QR Code (máximo 213 caracteres).');
  var cw = codewords(bytes, v), melhor = null, pior = Infinity;
  for (var mk = 0; mk < 8; mk++) { var m = monta(v, cw, mk), pe = penalidade(m); if (pe < pior) { pior = pe; melhor = m; } }
  return melhor.map(function (l) { return l.map(function (x) { return x ? 1 : 0; }); });
}
function svg(texto, op) {
  op = op || {}; var m = matriz(texto), N = m.length, mg = op.margem == null ? 4 : op.margem, e = op.escala || 8, T = (N + 2 * mg) * e, d = '';
  for (var r = 0; r < N; r++) { var c = 0; while (c < N) { if (m[r][c]) { var ini = c; while (c < N && m[r][c]) c++; d += 'M' + ((ini + mg) * e) + ' ' + ((r + mg) * e) + 'h' + ((c - ini) * e) + 'v' + e + 'h-' + ((c - ini) * e) + 'z'; } else c++; } }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + T + ' ' + T + '" width="' + T + '" height="' + T + '" role="img" aria-label="' + (op.rotulo || 'QR Code').replace(/[<>&"]/g, '') + '"><rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
}
function pngUrl(texto, escala) {
  var m = matriz(texto), N = m.length, e = escala || 8, mg = 4, T = (N + 2 * mg) * e, cv = document.createElement('canvas'); cv.width = cv.height = T;
  var g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, T, T); g.fillStyle = '#000';
  for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (m[r][c]) g.fillRect((c + mg) * e, (r + mg) * e, e, e);
  return cv.toDataURL('image/png');
}
window.PR_QR = { matriz: matriz, svg: svg, pngUrl: pngUrl, limite: 213 };
})();
