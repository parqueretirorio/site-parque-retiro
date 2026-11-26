// Passagem pelo site para as redes do Parque (25/11/2026). Ver supabase/migrations/0022_cliques_saida.sql.
// Endereço: ir.html?d=DESTINO&o=ORIGEM  (ex.: ir.html?d=canal&o=linktree)
// Conta 1 clique por (dia, origem, destino) e abre o destino em seguida. Não guarda IP, nome nem cookie.
// Falha em silêncio: se não der para contar, a pessoa vai ao destino do mesmo jeito.
(function () {
'use strict';
// Único lugar onde ficam os endereços de destino. Para trocar um convite, mude aqui.
var DESTINOS = {
  comunidade: { nome: 'Comunidade do Parque Retiro no WhatsApp', url: 'https://chat.whatsapp.com/HaH1ShGH9VUKVrs1QX25At' },
  canal: { nome: 'Canal do Parque Retiro no WhatsApp', url: 'https://whatsapp.com/channel/0029VbDmMh9ElagzPYbsg22t' },
  instagram: { nome: 'Instagram do Parque Retiro', url: 'https://www.instagram.com/parqueretirorio/' },
  'conecta-whatsapp': { nome: 'Grupo CONecta Retiro (WhatsApp)', url: 'https://chat.whatsapp.com/CfleoMcrPOmAKGEg3gToeq?s=cl&p=a&iam=2' },
  youtube: { nome: 'YouTube do Parque Retiro', url: 'https://youtube.com/@parquedeestudoereflexaoret6772' },
  facebook: { nome: 'Facebook do Parque Retiro', url: 'https://facebook.com/parqueretiro' },
  'grupo-geral': { nome: 'Grupo Geral do Parque Retiro (WhatsApp)', url: 'https://chat.whatsapp.com/KXM4pLhBpDhErHHdaRvgu9' },
  'grupo-silo': { nome: 'Grupo A Mensagem de Silo (WhatsApp)', url: 'https://chat.whatsapp.com/Hpsgjvsj37xICYZj8BeXg1?s=cl&p=a&iam=2' }
};
var CHAVE_LOGIN = 'pr-sb-sessao';
var ALIAS = { ig: 'instagram', insta: 'instagram', yt: 'youtube', fb: 'facebook', wa: 'whatsapp', zap: 'whatsapp', newsletter: 'email', 'e-mail': 'email', comunicado: 'email' };

function limpa(v) {
  v = String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return ALIAS[v] || v;
}
// Origem: ?o= (ou utm_source) > quem indicou (Linktree, Instagram...) > direto
function origemDe(busca, ref) {
  var q; try { q = new URLSearchParams(busca || ''); } catch (e) { q = new URLSearchParams(''); }
  var o = limpa(q.get('o') || q.get('utm_source') || q.get('origem') || '');
  if (o) return o;
  var h = ''; try { h = new URL(ref).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { /* sem referrer */ }
  if (/(^|\.)linktr\.ee$/.test(h)) return 'linktree';
  if (/(^|\.)instagram\.com$/.test(h)) return 'instagram';
  if (/(^|\.)(youtube\.com|youtu\.be)$/.test(h)) return 'youtube';
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(h)) return 'facebook';
  return 'direto';
}
function destinoDe(busca) {
  var q; try { q = new URLSearchParams(busca || ''); } catch (e) { return ''; }
  var d = limpa(q.get('d') || q.get('destino') || '');
  return DESTINOS[d] ? d : '';
}
function codigoDoLink(busca) {
  var q; try { q = new URLSearchParams(busca || ''); } catch (e) { return ''; }
  var c = String(q.get('l') || '').toLowerCase();
  return /^[a-z0-9]{4,12}$/.test(c) ? c : '';
}
function conta(destino, origem) {
  try {
    var host = location.hostname.toLowerCase();
    if (window.PR_VISITAS_FORCAR !== true && !/^(www\.)?parqueretiro\.org\.br$/.test(host)) return Promise.resolve();
    try { var s = JSON.parse(localStorage.getItem(CHAVE_LOGIN) || 'null'); if (s && s.access_token) return Promise.resolve(); } catch (e) { /* sem login */ }
    var conf = (window.PR_CONFIG_DADOS && window.PR_CONFIG_DADOS.supabase) || {};
    if (!conf.url || !conf.chavePublica) return Promise.resolve();
    var base = String(conf.url).replace(/\/+$/, '') + '/rest/v1/rpc/', cab = { 'Content-Type': 'application/json', Accept: 'application/json', apikey: conf.chavePublica };
    var cod = codigoDoLink(location.search); // link rastreável com código (?l=): conta também por link
    var extra = cod ? fetch(base + 'pr_registrar_acesso_link', { method: 'POST', keepalive: true, body: JSON.stringify({ p_codigo: cod, p_tipo: 'clique' }), headers: cab }).catch(function () { }) : null;
    return fetch(base + 'pr_registrar_clique', {
      method: 'POST', keepalive: true, body: JSON.stringify({ p_destino: destino, p_origem: origem }), headers: cab
    }).catch(function () { /* sem internet: segue */ }).then(function () { return extra; });
  } catch (e) { return Promise.resolve(); }
}
function botao(href, texto, cls) { var a = document.createElement('a'); a.className = 'bt' + (cls ? ' ' + cls : ''); a.href = href; a.textContent = texto; return a; }

function inicia() {
  var $ = function (id) { return document.getElementById(id); };
  var d = destinoDe(location.search), origem = origemDe(location.search, document.referrer);
  var caixa = $('b');
  if (!d) { // destino ausente ou desconhecido: oferece a escolha, sem contar
    $('t').textContent = 'Para onde você quer ir?'; $('m').textContent = 'Escolha uma das redes do Parque Retiro.';
    Object.keys(DESTINOS).forEach(function (k) { caixa.appendChild(botao('ir.html?d=' + k + (origem !== 'direto' ? '&o=' + origem : ''), DESTINOS[k].nome)); });
    caixa.appendChild(botao('index.html', 'Ir para o site do Parque Retiro', 'sec'));
    return;
  }
  var dest = DESTINOS[d];
  $('t').textContent = 'Indo para ' + dest.nome + '…'; $('m').textContent = 'Se não abrir sozinho, use o botão abaixo.';
  caixa.appendChild(botao(dest.url, 'Continuar para ' + dest.nome));
  caixa.appendChild(botao('index.html', 'Ir para o site do Parque Retiro', 'sec'));
  var foi = false, ir = function () { if (foi) return; foi = true; location.replace(dest.url); };
  var vai = function () {
    var timer = setTimeout(ir, 1200); // se o servidor demorar, não faz a pessoa esperar
    conta(d, origem).then(function () { clearTimeout(timer); setTimeout(ir, 150); });
  };
  if (window.PR_CONFIG_DADOS) vai();
  else { var s = document.createElement('script'); s.src = 'config-dados.js'; s.onload = vai; s.onerror = ir; document.head.appendChild(s); }
}
window.PR_IR = { codigoDoLink: codigoDoLink, DESTINOS: DESTINOS, limpa: limpa, origemDe: origemDe, destinoDe: destinoDe };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia); else inicia();
})();
