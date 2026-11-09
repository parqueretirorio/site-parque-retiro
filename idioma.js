// Idiomas do site público: Português (original), Espanhol, Italiano, Francês, Inglês e Alemão.
// Como funciona: o português continua nas páginas e é a fonte de tudo. Cada idioma tem uma tabela (i18n/<codigo>.js) que liga o texto em
// português à tradução. Este script troca os textos na hora, sem recarregar e sem chamar nenhum serviço externo (nada de tradutor do Google).
// Texto que não tem tradução na tabela fica em português (nunca quebra a página). Nomes próprios e termos da Escola não são traduzidos.
// Marque com translate="no" (ou class="notranslate") o que nunca deve ser traduzido. A área restrita e o login não carregam este script.
// A escolha da pessoa fica no navegador dela (chave pr_idioma); o endereço também aceita ?lang=en (útil para compartilhar).
(function () {
'use strict';
var LANGS = [['pt', 'Português', 'pt-BR'], ['es', 'Español', 'es'], ['it', 'Italiano', 'it'], ['fr', 'Français', 'fr'], ['en', 'English', 'en'], ['de', 'Deutsch', 'de']];
var ROTULO = { pt: 'Idioma', es: 'Idioma', it: 'Lingua', fr: 'Langue', en: 'Language', de: 'Sprache' };
var INLINE = { A: 1, STRONG: 1, EM: 1, B: 1, I: 1, SPAN: 1, SMALL: 1, BR: 1, MARK: 1, CODE: 1, SUP: 1, SUB: 1, U: 1, ABBR: 1, TIME: 1, LABEL: 0 };
var PULA = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, IFRAME: 1, SVG: 1, CANVAS: 1, TEXTAREA: 1, SELECT: 1, OPTION: 1, CODE: 1, PRE: 1 };
var ATTRS = ['title', 'alt', 'placeholder', 'aria-label'];
var atual = 'pt', dados = window.PR_I18N_DATA = window.PR_I18N_DATA || {}, orig = new WeakMap(), origAttr = new WeakMap(), ocupado = false, timer = null;

function guarda(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento: vale só nesta página */ } }
function le(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
function ehIcone(el) { return el.nodeType === 1 && el.tagName === 'I' && /(^|\s)fa[srbl]?(\s|$)|fa-/.test(el.className || '') && !el.textContent.trim(); }
function naoTraduzir(el) { return !!(el.closest && el.closest('[translate="no"],.notranslate,#pr-idioma')); }

// Um "bloco folha" é um elemento que tem texto e só tem filhos em linha (negrito, link, ícone...). Ele é traduzido inteiro, para a frase não ficar picada.
function ehFolha(el) {
  if (el.nodeType !== 1 || PULA[el.tagName] || naoTraduzir(el)) return false;
  var temTexto = false;
  for (var n = el.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === 3) { if (n.nodeValue.trim()) temTexto = true; }
    else if (n.nodeType === 1) { if (!(INLINE[n.tagName] || ehIcone(n)) || !folhaEmLinha(n)) return false; }
  }
  return temTexto;
}
function folhaEmLinha(el) { for (var n = el.firstChild; n; n = n.nextSibling) { if (n.nodeType === 1 && !(INLINE[n.tagName] || ehIcone(n))) return false; if (n.nodeType === 1 && !folhaEmLinha(n)) return false; } return true; }

// A chave é o conteúdo da folha sem os ícones do começo e do fim (que são preservados).
function partes(el) {
  var ini = [], fim = [], ns = Array.prototype.slice.call(el.childNodes);
  while (ns.length && (ehIcone(ns[0]) || (ns[0].nodeType === 3 && !ns[0].nodeValue.trim()))) ini.push(ns.shift());
  while (ns.length && (ehIcone(ns[ns.length - 1]) || (ns[ns.length - 1].nodeType === 3 && !ns[ns.length - 1].nodeValue.trim()))) fim.unshift(ns.pop());
  return { ini: ini, meio: ns, fim: fim };
}
function chaveDe(el) { var p = partes(el), d = document.createElement('div'); p.meio.forEach(function (n) { d.appendChild(n.cloneNode(true)); }); return norm(d.innerHTML); }

function varre(raiz, fn) {
  if (!raiz || raiz.nodeType !== 1 || PULA[raiz.tagName] || naoTraduzir(raiz)) return;
  if (ehFolha(raiz)) { fn(raiz); return; }
  for (var n = raiz.firstChild; n; n = n.nextSibling) { if (n.nodeType === 1) varre(n, fn); }
}
function atributos(raiz, fn) {
  var els = [raiz].concat(Array.prototype.slice.call(raiz.querySelectorAll('*')));
  els.forEach(function (el) { if (naoTraduzir(el)) return; ATTRS.forEach(function (a) { if (el.hasAttribute && el.hasAttribute(a)) fn(el, a); }); });
}

// Datas escritas em português ("31 de outubro de 2026", "Sábado, 31 de outubro de 2026", "outubro 2026") não vão para a tabela: o navegador formata em cada idioma.
var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
var DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
var RE_MES = MESES.join('|'), RE_DIA = '(?:domingo|segunda|terça|quarta|quinta|sexta|sábado)(?:-feira)?';
var RE_D1 = new RegExp('^(\\d{1,2}) de (' + RE_MES + ') de (\\d{4})$'), RE_D2 = new RegExp('^(' + RE_DIA + '), (\\d{1,2}) de (' + RE_MES + ') de (\\d{4})$', 'i'), RE_D3 = new RegExp('^(' + RE_MES + ') (\\d{4})$');
function ehData(k) { return RE_D1.test(k) || RE_D2.test(k) || RE_D3.test(k); }
function regra(k, lang) {
  var m, f = function (o) { try { return o; } catch (e) { return null; } };
  try {
    if ((m = RE_D1.exec(k))) return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[3], MESES.indexOf(m[2]), +m[1])));
    if ((m = RE_D2.exec(k))) return new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[4], MESES.indexOf(m[3].toLowerCase()), +m[2])));
    if ((m = RE_D3.exec(k))) return new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[2], MESES.indexOf(m[1]), 1)));
  } catch (e) { return null; }
  return null;
}
function coletar() { // usado pelo teste e pela extração: devolve todas as chaves de texto da página atual (em português)
  var ks = {}; restaura(document.body);
  varre(document.body, function (el) { var k = chaveDe(el); if (k && !ehData(k) && /[A-Za-zÀ-ÿ]/.test(k.replace(/<[^>]+>/g, ''))) ks[k] = 1; });
  atributos(document.body, function (el, a) { var k = norm(el.getAttribute(a)); if (k && !ehData(k) && /[A-Za-zÀ-ÿ]/.test(k)) ks[k] = 1; });
  var t = parteTitulo(document.title)[0]; if (t) ks[t] = 1;
  var m = document.querySelector('meta[name="description"]'); if (m && m.content) ks[norm(m.content)] = 1;
  return Object.keys(ks);
}

function restaura(raiz) {
  varreOrig(raiz, function (el, o) { el.innerHTML = o; });
  Array.prototype.slice.call(raiz.querySelectorAll('*')).forEach(function (el) { var oa = origAttr.get(el); if (oa) { Object.keys(oa).forEach(function (a) { el.setAttribute(a, oa[a]); }); origAttr.delete(el); } });
}
function varreOrig(raiz, fn) { var els = [raiz].concat(Array.prototype.slice.call(raiz.querySelectorAll('*'))); els.forEach(function (el) { if (orig.has(el)) { fn(el, orig.get(el)); orig.delete(el); } }); }

function traduz(raiz, lang) {
  var tab = dados[lang]; if (!tab) return;
  ocupado = true;
  try {
    varre(raiz, function (el) {
      var k = chaveDe(el), t = tab[k] || regra(k, lang); if (!t) return;
      var p = partes(el); if (!orig.has(el)) orig.set(el, el.innerHTML);
      var d = document.createElement('div'); d.innerHTML = t;
      p.meio.forEach(function (n) { el.removeChild(n); });
      var ref = p.fim.length ? p.fim[0] : null;
      while (d.firstChild) el.insertBefore(d.firstChild, ref);
    });
    atributos(raiz, function (el, a) {
      var v = norm(el.getAttribute(a)), t = tab[v] || regra(v, lang); if (!t) return;
      var oa = origAttr.get(el) || {}; if (!(a in oa)) oa[a] = el.getAttribute(a); origAttr.set(el, oa); el.setAttribute(a, t);
    });
  } finally { ocupado = false; }
}

// O título das páginas termina com " | Parque de Estudo e Reflexão Retiro" (nome próprio, não traduzido): só a parte da esquerda vai para a tabela.
function parteTitulo(t) { var i = t.indexOf(' | '); return i < 0 ? [norm(t), ''] : [norm(t.slice(0, i)), t.slice(i)]; }
function tituloTrad(tab, t) { var p = parteTitulo(t); return (tab[p[0]] || p[0]) + p[1]; }
function cabecalho(lang) {
  var tab = dados[lang] || {};
  if (!document.documentElement.hasAttribute('data-titulo-pt')) { document.documentElement.setAttribute('data-titulo-pt', document.title); var m0 = document.querySelector('meta[name="description"]'); if (m0) document.documentElement.setAttribute('data-desc-pt', m0.content); }
  var tpt = document.documentElement.getAttribute('data-titulo-pt'), dpt = document.documentElement.getAttribute('data-desc-pt');
  document.title = lang === 'pt' ? tpt : tituloTrad(tab, tpt);
  var m = document.querySelector('meta[name="description"]'); if (m && dpt != null) m.content = lang === 'pt' ? dpt : (tab[norm(dpt)] || dpt);
  var l = LANGS.filter(function (x) { return x[0] === lang; })[0]; document.documentElement.lang = l ? l[2] : 'pt-BR';
}

function carrega(lang, ok) {
  if (lang === 'pt' || dados[lang]) return ok();
  var s = document.createElement('script'); s.src = 'i18n/' + lang + '.js'; s.onload = ok; s.onerror = ok; document.head.appendChild(s); // arquivo do próprio site
}

function aplica(lang, guardar) {
  if (!LANGS.some(function (x) { return x[0] === lang; })) lang = 'pt';
  carrega(lang, function () {
    restaura(document.body); atual = lang;
    if (lang !== 'pt') traduz(document.body, lang);
    cabecalho(lang); if (guardar) guarda('pr_idioma', lang); marca(); ajustaTopo();
  });
}

// ---- Seletor flutuante (canto inferior esquerdo; o WhatsApp fica no direito)
function estilo() {
  var s = document.createElement('style');
  s.textContent = '#pr-idioma{position:fixed;left:16px;bottom:18px;z-index:9998;font-family:inherit;font-size:14px}' +
    '#pr-idioma .pri-bt{display:flex;align-items:center;gap:6px;min-height:44px;padding:0 12px;border:1px solid #c9d3d3;border-radius:22px;background:rgba(255,255,255,.94);color:#2c3e50;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.18);font:inherit;font-weight:600}' +
    '#pr-idioma .pri-bt:hover,#pr-idioma .pri-bt:focus-visible{background:#fff;outline:2px solid #3498db;outline-offset:1px}' +
    '#pr-idioma .pri-lista{display:none;position:absolute;left:0;bottom:52px;min-width:150px;margin:0;padding:6px;list-style:none;background:#fff;border:1px solid #c9d3d3;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.22)}' +
    '#pr-idioma.aberto .pri-lista{display:block}' +
    '#pr-idioma .pri-lista button{display:flex;justify-content:space-between;width:100%;gap:14px;padding:9px 10px;border:0;border-radius:6px;background:none;color:#2c3e50;font:inherit;text-align:left;cursor:pointer}' +
    '#pr-idioma .pri-lista button:hover,#pr-idioma .pri-lista button:focus-visible{background:#eef7fc;outline:none}' +
    '#pr-idioma .pri-lista button[aria-current="true"]{font-weight:700;background:#eef7fc}' +
    '#pr-idioma.no-topo{position:absolute;left:20px;right:auto;top:14px;bottom:auto}' +
    '#pr-idioma.no-topo .pri-bt{min-height:38px;padding:0 12px;border-radius:6px;box-shadow:none;background:#fff}' +
    '#pr-idioma.no-topo .pri-lista{bottom:auto;top:46px}' +
    '@media(max-width:768px){#pr-idioma.no-topo{left:auto;right:118px;top:8px}#pr-idioma.no-topo .pri-bt{padding:0 8px;gap:4px;font-size:13px}header:has(#pr-idioma.no-topo) .brand{padding-right:var(--pr-brand-dir,215px)}}' +
    '@media(max-width:480px){header:has(#pr-idioma.no-topo) .brand{padding-right:var(--pr-brand-dir,215px)}}' +
    '@media print{#pr-idioma{display:none}}';
  document.head.appendChild(s);
}
function seletor() {
  if (document.getElementById('pr-idioma')) return;
  estilo();
  var box = document.createElement('div'); box.id = 'pr-idioma'; box.setAttribute('translate', 'no'); box.className = 'notranslate';
  box.innerHTML = '<button type="button" class="pri-bt" aria-haspopup="true" aria-expanded="false"><i class="fas fa-globe" aria-hidden="true"></i><span class="pri-cod">PT</span></button>' +
    '<ul class="pri-lista" role="menu">' + LANGS.map(function (l) { return '<li role="none"><button type="button" role="menuitem" data-l="' + l[0] + '" lang="' + l[2] + '"><span>' + l[1] + '</span><span>' + l[0].toUpperCase() + '</span></button></li>'; }).join('') + '</ul>';
  var topo = document.querySelector('body > header');
  if (topo) { box.classList.add('no-topo'); topo.appendChild(box); } else document.body.appendChild(box);
  var bt = box.querySelector('.pri-bt');
  function fecha() { box.classList.remove('aberto'); bt.setAttribute('aria-expanded', 'false'); }
  bt.onclick = function (e) { e.stopPropagation(); var ab = !box.classList.contains('aberto'); box.classList.toggle('aberto', ab); bt.setAttribute('aria-expanded', String(ab)); if (ab) box.querySelector('[aria-current="true"]').focus(); };
  box.querySelectorAll('[data-l]').forEach(function (b) { b.onclick = function () { aplica(b.dataset.l, true); fecha(); bt.focus(); }; });
  document.addEventListener('click', function (e) { if (!box.contains(e.target)) fecha(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('aberto')) { fecha(); bt.focus(); } });
  marca();
}
// No celular o seletor de idioma fica à esquerda do botão Entrar. Como o texto traduzido muda a largura do Entrar
// (Entrar / Se connecter / Anmelden...), a posição é calculada a cada troca para um nunca cobrir o outro.
function ajustaTopo() {
  var box = document.getElementById('pr-idioma'), h = box && box.parentElement, ent = h && h.querySelector('.btn-entrar');
  if (!box || !h || h.tagName !== 'HEADER' || !ent) return;
  if (!window.matchMedia('(max-width: 768px)').matches) { box.style.right = ''; h.style.removeProperty('--pr-brand-dir'); return; }
  box.style.right = (h.clientWidth - ent.offsetLeft + 8) + 'px';
  h.style.setProperty('--pr-brand-dir', (h.clientWidth - box.offsetLeft + 8) + 'px');
}
function marca() {
  var box = document.getElementById('pr-idioma'); if (!box) return;
  box.querySelector('.pri-cod').textContent = atual.toUpperCase();
  box.querySelector('.pri-bt').setAttribute('aria-label', ROTULO[atual] + ': ' + LANGS.filter(function (x) { return x[0] === atual; })[0][1]);
  box.querySelectorAll('[data-l]').forEach(function (b) { b.setAttribute('aria-current', String(b.dataset.l === atual)); });
}

// Conteúdo que a própria página monta depois (listas de atividades, avisos...): traduz o que for aparecendo.
function observa() {
  if (!window.MutationObserver) return;
  new MutationObserver(function (muts) {
    if (ocupado || atual === 'pt') return;
    var tem = muts.some(function (m) { return Array.prototype.some.call(m.addedNodes, function (n) { return n.nodeType === 1 && n.id !== 'pr-idioma'; }); });
    if (!tem) return; clearTimeout(timer); timer = setTimeout(function () { traduz(document.body, atual); }, 120);
  }).observe(document.body, { childList: true, subtree: true });
}

function inicia() {
  seletor(); observa(); ajustaTopo(); window.addEventListener('resize', ajustaTopo); window.addEventListener('load', ajustaTopo);
  var q = (location.search.match(/[?&]lang=([a-z]{2})/) || [])[1], salvo = le('pr_idioma');
  var lang = q || salvo || 'pt'; if (lang !== 'pt') aplica(lang, !!q);
}
window.PR_IDIOMA = { LANGS: LANGS, coletar: coletar, aplica: aplica, atual: function () { return atual; } };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia); else inicia();
})();
