// Contador de visitas do site, por origem (25/11/2026). Ver supabase/migrations/0021_visitas_site.sql.
//
// O que conta: UMA visita por sessão do navegador (aba aberta) e cada página aberta como "página vista".
// O que NÃO guarda: IP, nome, e-mail, cookie, impressão digital do aparelho. Só números por dia, origem e página.
// Quem NÃO é contado: quem está logado na área restrita (equipe), testes em localhost, o endereço antigo github.io,
// e as páginas da própria área restrita. Falha em silêncio: contar visita nunca atrapalha a página.
//
// Origem da visita (nesta ordem):
//   1) ?o=NOME no endereço (ex.: ?o=canal, ?o=instagram, ?o=grupo-mestres). Também aceita ?utm_source=NOME.
//   2) o site de onde a pessoa veio (referrer): Instagram, YouTube, Facebook, Google...
//   3) 'direto' (digitou o endereço, favorito, ou o WhatsApp, que não informa a origem).
// O WhatsApp esconde de onde a pessoa veio; por isso o Canal, a Comunidade e os grupos só aparecem com o ?o= no link.
(function () {
'use strict';
var CHAVE_SESSAO = 'pr-vis-sessao', CHAVE_LOGIN = 'pr-sb-sessao';
var MEU_ENDERECO = (document.currentScript && document.currentScript.src) || '';
// Páginas que nunca são contadas (área da equipe e telas pessoais)
var FORA = { 'area-restrita': 1, 'ajuda-area-restrita': 1, 'descadastro': 1, 'cadastro-wifi': 1 };
var ALIAS = { ig: 'instagram', insta: 'instagram', yt: 'youtube', fb: 'facebook', wa: 'whatsapp', zap: 'whatsapp', newsletter: 'email', 'e-mail': 'email', comunicado: 'email' };

function limpa(v) {
  v = String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return ALIAS[v] || v;
}

// De onde a pessoa veio, pelo endereço de quem indicou (referrer). Devolve '' quando é o próprio site ou não há como saber.
function origemPorReferrer(ref, hostAtual) {
  var h; try { h = new URL(ref).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; }
  if (!h) return '';
  var atual = String(hostAtual || '').toLowerCase().replace(/^www\./, '');
  if (h === atual) return '';
  if (/(^|\.)instagram\.com$/.test(h)) return 'instagram';
  if (/(^|\.)(youtube\.com|youtu\.be)$/.test(h)) return 'youtube';
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me|fb\.watch|messenger\.com)$/.test(h)) return 'facebook';
  if (/(^|\.)(whatsapp\.com|wa\.me|whats\.app)$/.test(h)) return 'whatsapp';
  if (/(^|\.)google\.[a-z.]+$/.test(h)) return h.indexOf('mail.google') === 0 ? 'email' : 'google';
  if (/(^|\.)(bing\.com|duckduckgo\.com|yahoo\.com|ecosia\.org|search\.brave\.com)$/.test(h)) return 'busca';
  if (/(^|\.)(t\.co|twitter\.com|x\.com)$/.test(h)) return 'x';
  if (/(^|\.)(linkedin\.com|lnkd\.in)$/.test(h)) return 'linkedin';
  if (/(^|\.)(t\.me|telegram\.org)$/.test(h)) return 'telegram';
  if (/(^|\.)(pressenza\.com)$/.test(h)) return 'pressenza';
  if (/(^|\.)(outlook\.live\.com|mail\.yahoo\.com|mail\.proton\.me)$/.test(h)) return 'email';
  return 'outros-sites';
}

function paginaAtual(caminho) {
  var p = String(caminho || '/').split('?')[0].split('#')[0].replace(/\/+$/, '');
  if (/(^|\/)app(\/index\.html)?$/.test(p)) return 'app';
  if (/(^|\/)app\//.test(p)) return 'app';
  var f = p.split('/').pop().replace(/\.html?$/, '').toLowerCase();
  return !f || f === 'site-parque-retiro' ? 'index' : f.replace(/[^a-z0-9._-]/g, '').slice(0, 60) || 'outras';
}

// Decide a origem, mantendo a mesma durante a sessão (a menos que um novo ?o= apareça). Função pura, usada nos testes.
function decide(ctx) {
  var q; try { q = new URLSearchParams(ctx.busca || ''); } catch (e) { q = new URLSearchParams(''); }
  var marca = limpa(q.get('o') || q.get('utm_source') || q.get('origem') || '');
  var sessao = ctx.sessao || null;
  if (marca) {
    if (sessao && sessao.o === marca) return { origem: marca, nova: false };
    return { origem: marca, nova: true };
  }
  if (sessao && sessao.o) return { origem: sessao.o, nova: false };
  return { origem: origemPorReferrer(ctx.referrer || '', ctx.host) || 'direto', nova: true };
}

function conta() {
  try {
    var host = location.hostname.toLowerCase();
    var forcar = window.PR_VISITAS_FORCAR === true; // só os testes automáticos usam
    if (!forcar && !/^(www\.)?parqueretiro\.org\.br$/.test(host)) return; // não conta localhost, github.io, cópias de teste
    var pagina = paginaAtual(location.pathname);
    if (FORA[pagina]) return;
    try { var s = JSON.parse(localStorage.getItem(CHAVE_LOGIN) || 'null'); if (s && s.access_token) return; } catch (e) { /* sem login guardado */ }
    var conf = (window.PR_CONFIG_DADOS && window.PR_CONFIG_DADOS.supabase) || {};
    if (!conf.url || !conf.chavePublica) return;
    var sessao = null; try { sessao = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO) || 'null'); } catch (e) { /* sessionStorage bloqueado */ }
    var d = decide({ busca: location.search, referrer: document.referrer, host: host, sessao: sessao });
    try { sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify({ o: d.origem })); } catch (e) { /* segue sem lembrar */ }
    var corpo = JSON.stringify({ p_pagina: pagina, p_origem: d.origem, p_nova_visita: d.nova });
    fetch(String(conf.url).replace(/\/+$/, '') + '/rest/v1/rpc/pr_registrar_visita', {
      method: 'POST', keepalive: true, body: corpo,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: conf.chavePublica }
    }).catch(function () { /* sem internet: não faz mal perder uma contagem */ });
  } catch (e) { /* nunca atrapalha a página */ }
}

window.PR_VISITAS = { limpa: limpa, origemPorReferrer: origemPorReferrer, paginaAtual: paginaAtual, decide: decide, conta: conta };

// Algumas páginas abertas não carregam config-dados.js: busca só quando falta, depois conta.
function inicia() {
  if (window.PR_CONFIG_DADOS) return conta();
  var s = document.createElement('script'); s.src = MEU_ENDERECO ? MEU_ENDERECO.replace(/visitas\.js(\?.*)?$/, 'config-dados.js') : 'config-dados.js'; s.onload = conta; s.onerror = function () { /* sem config: não conta */ };
  document.head.appendChild(s);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia); else inicia();
})();
