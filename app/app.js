// CONecta Retiro — app da área restrita (comissões e administração) do Parque Retiro.
// Fase 2, bloco 1: Entrar, Início (minhas responsabilidades + para toda a equipe), Avisos e agenda, Biblioteca e Todas as áreas.
// Usa o mesmo login e os mesmos dados do site (servidor do Parque). As ferramentas completas abrem a área restrita
// já na ferramenta certa, com o botão "Voltar ao app".
(function () {
const SB = window.PR_SUPABASE, D = window.PR_DADOS, A = window.PR_AREA, DOC = window.PR_DOCUMENTOS;
const db = D && D.db;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const hoje = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const somaDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const I = window.PR_APP_I18N, t = I.t; // idiomas: i18n.js
const fmtMes = d => { const s = d.toLocaleDateString(I.locale(), { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); };
const fmtSem = d => d.toLocaleDateString(I.locale(), { weekday: 'short' }).replace('.', '');
const fmtDia = iso => new Date(iso + 'T12:00:00').toLocaleDateString(I.locale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
const primeiro = n => String(n || '').trim().split(/\s+/)[0] || '';
const tela = $('#tela');
const ferramenta = id => 'ferramenta.html?app=1#t=' + encodeURIComponent(id); // mesma área restrita, mas dentro do app (abre na janela do app, sem barra do navegador)
// Ferramentas com tela própria no app (Bloco 2). As demais abrem a área restrita completa.
const NATIVAS = { reservas: 'alojamento', inventario: 'inventario', documentos: 'documentos' };
const destino = id => NATIVAS[id] ? '#' + NATIVAS[id] : ferramenta(id);
let me = null;
// Mensagens do login vêm em português do adaptador; aqui viram o idioma do app.
const traduzErro = m => /incorretos/.test(m) ? t('errCred') : /confirmar seu e-mail/.test(m) ? t('errConf') : /Sem conexão/.test(m) ? t('errRede') : /Muitas tentativas/.test(m) ? t('errMuitas') : m;

const VERSAO = '1.6.1', DATA_VERSAO = '13/11/2026'; // ao publicar mudança no app: trocar aqui, em versao.json e em sw.js
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

/* ---------- Instalar o app e atualizações ---------- */
let pedidoInstalar = null, novaVersao = null;
const instalado = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const ehIphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let fechouInstalar = false; try { fechouInstalar = sessionStorage.getItem('app-instalar-fechado') === '1'; } catch (e) { /* ignora */ }
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedidoInstalar = e; desenhaAvisos(); });
window.addEventListener('appinstalled', () => { pedidoInstalar = null; desenhaAvisos(); });
const cmp = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
fetch('versao.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(v => { if (v && cmp(v.versao, VERSAO) > 0) { novaVersao = v; desenhaAvisos(); } }).catch(() => {});
function cartaoInstalar() {
  if (instalado() || fechouInstalar) return '';
  const como = pedidoInstalar ? `<button type="button" class="bt bt-principal" id="bt-instalar"><i class="fas fa-download" aria-hidden="true"></i> ${t('baixar')}</button>`
    : ehIphone() ? `<ol class="passos">${t('iph')}</ol>`
    : `<ol class="passos">${t('and')}</ol>`;
  return `<section class="instalar" aria-label="Instalar o app"><img src="icone-192.png" alt="Ícone do app CONecta Retiro" width="72" height="72">
    <div><h2>${t('instTit')}</h2><p>${t('instTxt')}</p></div>
    ${como}<button type="button" class="fechar" id="fecha-instalar" aria-label="${t('agoraNao')}">${t('agoraNao')}</button></section>`;
}
function faixaAtualizar() {
  if (!novaVersao) return '';
  return `<section class="atualizar" role="status"><p><i class="fas fa-sync-alt" aria-hidden="true"></i> <b>${t('nova', { v: esc(novaVersao.versao) })}</b>${(novaVersao.novidades || []).length ? '<br><small>' + novaVersao.novidades.map(esc).join(' · ') + '</small>' : ''}</p>
    <button type="button" class="bt bt-principal" id="bt-atualizar"><i class="fas fa-download" aria-hidden="true"></i> ${t('atualizar')}</button></section>`;
}
const seletorIdioma = () => `<p class="idioma"><label for="lang"><i class="fas fa-globe" aria-hidden="true"></i> ${t('idioma')}</label> <select id="lang">${I.LINGUAS.map(l => `<option value="${l}"${l === I.atual() ? ' selected' : ''}>${I.NOMES[l]}</option>`).join('')}</select></p>`;
const rodape = () => `${seletorIdioma()}<p class="versao">CONecta Retiro · ${t('versao')} ${VERSAO} (${DATA_VERSAO})</p>`;
function ligaIdioma() { const sl = $('#lang'); if (sl) sl.onchange = () => { I.mudar(sl.value); ajustaAjuda(); rota(); }; }
function ajustaAjuda() { const a = $('#ajuda'); if (a) { a.innerHTML = `<i class="fab fa-whatsapp" aria-hidden="true"></i> ${esc(t('ajuda'))}`; a.href = 'https://wa.me/552128881830?text=' + encodeURIComponent(t('ajudaMsg')); } }
ajustaAjuda();
async function atualizar() {
  const b = $('#bt-atualizar'); if (b) { b.disabled = true; b.textContent = t('atualizando'); }
  try { if (navigator.serviceWorker) { const r = await navigator.serviceWorker.getRegistration(); if (r) { await r.update(); if (r.waiting) r.waiting.postMessage('atualizar'); } } } catch (e) { /* segue */ }
  try { if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); } } catch (e) { /* segue */ }
  location.reload();
}
function desenhaAvisos() {
  const box = $('#avisos-app'); if (!box) return;
  box.innerHTML = faixaAtualizar() + cartaoInstalar();
  const bi = $('#bt-instalar'); if (bi) bi.onclick = async () => { pedidoInstalar.prompt(); try { await pedidoInstalar.userChoice; } catch (e) { /* ignora */ } pedidoInstalar = null; desenhaAvisos(); };
  const fi = $('#fecha-instalar'); if (fi) fi.onclick = () => { fechouInstalar = true; try { sessionStorage.setItem('app-instalar-fechado', '1'); } catch (e) { /* ignora */ } desenhaAvisos(); };
  const ba = $('#bt-atualizar'); if (ba) ba.onclick = atualizar;
}

const topo = (titulo, voltar) => `<header class="topo">${voltar ? `<a class="voltar" href="#inicio"><i class="fas fa-arrow-left" aria-hidden="true"></i> ${t('inicio')}</a>` : ''}<h1>${titulo}</h1></header>`;
const aviso = () => { const e = D.estadoSync(); return e.estado === 'offline' ? `<p class="faixa faixa-alerta" role="status"><i class="fas fa-wifi" aria-hidden="true"></i> ${t('semRede')} ${e.pendentes ? t('aguardando', { n: e.pendentes }) : t('carregado')}</p>` : ''; };

/* ---------- Entrar ---------- */
function entrar(msg) {
  document.title = t('entrar') + ' · CONecta Retiro';
  tela.innerHTML = `<main class="entrar">
    <img class="logo" src="icone-192.png" alt="" width="96" height="96">
    <h1>CONecta Retiro</h1><p class="sub">${t('sub')}</p>
    <div id="avisos-app"></div>
    ${msg ? `<p class="faixa faixa-alerta" role="alert">${esc(msg)}</p>` : ''}
    <form id="fe" novalidate>
      <label for="e">${t('email')}</label><input id="e" type="email" autocomplete="username" inputmode="email">
      <label for="s">${t('senha')}</label><input id="s" type="password" autocomplete="current-password">
      <label class="mostrar"><input type="checkbox" id="ms"> ${t('mostrar')}</label>
      <p class="erro" id="er" role="alert" hidden></p>
      <button class="bt bt-principal" id="be">${t('entrar')}</button>
    </form>
    <p class="links"><a href="../login.html">${t('esqueci')}</a><br><a href="../login.html">${t('semAcesso')}</a><br><a href="#ajuda"><i class="fas fa-question-circle" aria-hidden="true"></i> ${H('ajudaBt')}</a></p>
    ${rodape()}
  </main>`;
  desenhaAvisos(); ligaIdioma();
  $('#ms').onchange = ev => { $('#s').type = ev.target.checked ? 'text' : 'password'; };
  $('#fe').onsubmit = async ev => {
    ev.preventDefault();
    const er = $('#er'), b = $('#be'), em = $('#e').value.trim().toLowerCase(), sn = $('#s').value;
    const falha = m => { er.textContent = m; er.hidden = false; b.disabled = false; b.textContent = t('entrar'); };
    if (!/^\S+@\S+\.\S+$/.test(em) || !sn) return falha(t('digite'));
    b.disabled = true; b.textContent = t('entrando');
    const r = await SB.entrar(em, sn);
    if (r.erro) return falha(traduzErro(r.erro));
    if (r.pendente) return falha(t('pendente'));
    sessionStorage.setItem('pr_sess', r.perfil.email);
    history.replaceState(null, '', location.pathname + location.search + '#inicio'); location.reload(); // recarrega já com os dados do servidor
  };
}

/* ---------- Início ---------- */
// Linha de ferramenta: o nome abre a ferramenta; o "?" ao lado abre a explicação dela (Ajuda).
const linhaFerr = (tb, extra) => `<div class="linha-f"><a class="linha" href="${destino(tb[0])}"><i class="fas ${tb[1]}" aria-hidden="true"></i><span>${esc(I.aba(tb[0], tb[2]))}</span>${extra || ''}<i class="fas fa-chevron-right seta" aria-hidden="true"></i></a><a class="q" href="#ajuda-f/${encodeURIComponent(tb[0])}" aria-label="${esc(H('ajudaDe', { n: I.aba(tb[0], tb[2]) }))}" title="${esc(H('ajudaDe', { n: I.aba(tb[0], tb[2]) }))}">?</a></div>`;
const botao = (href, ic, nome, extra) => `<a class="cartao" href="${href}"><i class="fas ${ic}" aria-hidden="true"></i><span>${esc(nome)}</span>${extra || ''}</a>`;
function abas() { return A ? A.abasDe(me) : []; }
function inicio() {
  document.title = t('inicio') + ' · CONecta Retiro';
  const tabs = abas();
  // Minhas responsabilidades: ferramentas da administração (só o administrador) e as das funções da pessoa.
  const adm = me.nivel === 'administrador', fn = me.funcoes || [];
  const minhas = tabs.filter(t => t[3] === 4 || (typeof t[4] === 'string' && fn.includes(t[4])) || (typeof t[4] === 'function' && !adm));
  const pend = me.nivel === 'administrador' ? db.get('users', []).filter(u => (u.status || 'aprovado') === 'pendente').length : 0;
  const prox = DOC ? DOC.eventos(db, hoje(), somaDias(hoje(), 14)).length : 0;
  tela.innerHTML = `<header class="topo topo-ola"><p>${t('ola', { n: esc(primeiro(me.nome)) })}</p><h1>${t('oQue')}</h1></header>${aviso()}
  <main><div id="avisos-app"></div>
    <h2>${t('equipe')}</h2>
    <div class="grade">
      ${botao('#agenda', 'fa-calendar-alt', t('agenda'), prox ? `<b class="selo">${prox}</b>` : '')}
      ${botao('#biblioteca', 'fa-book-reader', t('biblioteca'))}
      ${tabs.some(t => t[0] === 'atividades') ? botao(ferramenta('atividades'), 'fa-calendar-check', t('atividades')) : ''}
      ${tabs.some(t => t[0] === 'reuniao') ? botao(ferramenta('reuniao'), 'fa-users', t('reuniao')) : ''}
      ${tabs.some(t => t[0] === 'documentos') && DOC && DOC.darEncaminhamento ? (n => botao('#documentos/dar', 'fa-share-square', t('b2_dar'), n ? `<b class="selo">${n}</b>` : ''))(DOC.darEncaminhamento(db, hoje(), '').itens.length) : ''}
    </div>
    ${minhas.length ? `<h2>${t('minhas')}</h2><div class="lista">${minhas.map(t => linhaFerr(t, t[0] === 'users' && pend ? `<b class="selo">${pend}</b>` : '')).join('')}</div>` : ''}
    <a class="bt bt-claro" href="#areas"><i class="fas fa-th-large" aria-hidden="true"></i> ${t('todas')}</a>
    <a class="bt bt-claro" href="#ajuda" id="bt-ajuda"><i class="fas fa-question-circle" aria-hidden="true"></i> ${H('ajudaBt')}</a>
    <button type="button" class="bt bt-texto" id="sair">${t('sair')}</button>
    ${rodape()}
  </main>`;
  desenhaAvisos(); ligaIdioma();
  $('#sair').onclick = async () => { try { if (D.estadoSync().pendentes) await D.sincronizar(); } catch (e) { /* segue */ } await SB.sair(); sessionStorage.removeItem('pr_sess'); history.replaceState(null, '', location.pathname + location.search); location.reload(); };
}

/* ---------- Avisos e agenda ---------- */
function agenda() {
  document.title = t('agenda') + ' · CONecta Retiro';
  const h = hoje(), l = DOC ? DOC.eventos(db, h, somaDias(h, 90)) : [];
  let mesAtual = '';
  const itens = l.map(e => {
    const d = new Date(e.data + 'T12:00:00'), m = fmtMes(d);
    const cab = m !== mesAtual ? `<h2>${esc(m)}</h2>` : ''; mesAtual = m;
    const fim = e.fim && e.fim !== e.data ? ` ${t('ate')} ${fmtDia(e.fim).slice(0, 5)}` : '';
    return cab + `<article class="evento${e.data === h ? ' hoje' : ''}"><div class="dia"><b>${d.getDate()}</b><small>${esc(fmtSem(d))}</small></div>
      <div><h3>${esc(e.titulo)}</h3><p>${e.data === h ? `<b>${t('hoje')}</b> · ` : ''}${esc([e.hora, e.local].filter(Boolean).join(' · ') || (e.fixa ? t('anual') : ''))}${fim}</p>${e.descricao ? `<p class="desc">${esc(e.descricao)}</p>` : ''}</div></article>`;
  }).join('');
  tela.innerHTML = topo(t('agenda'), true) + aviso() + `<main>
    <p class="nota">${t('prox90')}</p>
    ${itens || `<p class="vazio">${t('nada90')}</p>`}
    ${abas().some(t => t[0] === 'documentos') ? `<a class="bt bt-claro" href="${ferramenta('documentos')}"><i class="fas fa-folder-open" aria-hidden="true"></i> ${t('calCompleto')}</a>` : ''}
  </main>`;
}

/* ---------- Biblioteca ---------- */
function biblioteca() {
  document.title = t('biblioteca') + ' · CONecta Retiro';
  const livros = db.get('livros', []), emp = db.get('emprest', []).filter(e => !e.devolvido);
  const meus = emp.filter(e => norm(e.nome) === norm(me.nome) || (e.email && norm(e.email) === norm(me.email)));
  const livro = id => livros.find(l => l.id === id) || { titulo: 'Livro' };
  const livres = l => Math.max(1, +l.exemplares || 1) - emp.filter(e => e.livro === l.id).length;
  const cart = l => `<article class="livro"><h3>${esc(l.titulo)}</h3><p>${esc(l.autor || '')}</p><p>${livres(l) > 0 ? `<span class="tag tag-ok">${t('disponivel')}</span>` : `<span class="tag tag-ocupado">${t('emprestado')}</span>`}${l.local ? ' · ' + esc(l.local) : ''}</p></article>`;
  tela.innerHTML = topo(t('biblioteca'), true) + aviso() + `<main>
    <h2>${t('comigo')}</h2>
    ${meus.length ? meus.map(e => `<article class="livro"><h3>${esc(livro(e.livro).titulo)}</h3><p>${e.prevista ? t('devolver') + ' <b>' + esc(fmtDia(e.prevista)) + '</b>' : t('semData')}</p></article>`).join('') : `<p class="vazio">${t('nenhumComigo')}</p>`}
    <h2>${t('procurar')}</h2>
    <label for="bb" class="oculto">${t('tituloAutor')}</label><input id="bb" type="search" placeholder="${t('tituloAutor')}" autocomplete="off">
    <div id="res"></div>
    ${abas().some(t => t[0] === 'acervo') ? `<a class="bt bt-claro" href="${ferramenta('acervo')}"><i class="fas fa-book" aria-hidden="true"></i> ${t('bibCompleta')}</a>` : ''}
  </main>`;
  const mostra = () => {
    const q = norm($('#bb').value), l = livros.filter(x => !q || norm(x.titulo + ' ' + (x.autor || '')).includes(q)).slice(0, 40);
    $('#res').innerHTML = l.length ? l.map(cart).join('') + (livros.length > 40 && !q ? `<p class="nota">${t('digiteOutros')}</p>` : '') : `<p class="vazio">${t('nenhumAchado')}</p>`;
  };
  $('#bb').oninput = mostra; mostra();
}

/* ---------- Todas as áreas ---------- */
function areas() {
  document.title = t('todasTit') + ' · CONecta Retiro';
  const tabs = abas(), grupos = (A ? A.AREAS : []).map(a => [a, tabs.filter(t => t[5] === a.id)]).filter(g => g[1].length);
  tela.innerHTML = topo(t('todasTit'), true) + aviso() + `<main>
    ${grupos.map(([a, l]) => `<h2><i class="fas ${a.icone}" aria-hidden="true"></i> ${esc(t('area_' + a.id) === 'area_' + a.id ? a.nome : t('area_' + a.id))}</h2><div class="lista">${l.map(t => linhaFerr(t)).join('')}</div>`).join('')}
  </main>`;
}

/* ---------- Ajuda ---------- */
// Guia do app (ajuda-app.js) + artigos da Central de Ajuda do site (../ajuda/conteudo.json, a mesma base do site).
// Funciona também sem entrar (para quem não consegue entrar); nesse caso mostra só os artigos abertos a todos.
const AJ = window.PR_APP_AJUDA, H = (k, v) => AJ.ui(I.atual(), k, v);
let base = null, basePromessa = null;
// Artigos traduzidos: ../ajuda/conteudo-<idioma>.json (hoje: espanhol). Sem tradução, ficam em português com aviso.
const TRAD_AJUDA = ['es'];
const traduzBase = (j, t) => { if (!t) return j; const ta = t.artigos || {};
  return { ...j, traduzido: true, artigos: j.artigos.map(a => { const x = ta[a.id]; if (!x) return a; const sec = { ...(a.secoes || {}) };
    Object.keys(x.secoes || {}).forEach(k => { const v = x.secoes[k]; sec[k] = Array.isArray(v) ? (sec[k] || []).map((y, i) => v[i] || y) : (v || sec[k]); });
    return { ...a, titulo: x.titulo || a.titulo, resumo: x.resumo || a.resumo, secoes: sec, imagens: (a.imagens || []).map((im, i) => ({ ...im, ...((x.imagens || [])[i] || {}) })), traduzido: true }; }) }; };
let baseLang = '';
const carregaBase = () => {
  const L = I.atual(); if (basePromessa && baseLang === L) return basePromessa; baseLang = L;
  const pega = u => fetch(u).then(r => { if (!r.ok) throw new Error('ajuda'); return r.json(); });
  return (basePromessa = Promise.all([pega('../ajuda/conteudo.json'), TRAD_AJUDA.includes(L) ? pega('../ajuda/conteudo-' + L + '.json').catch(() => null) : Promise.resolve(null)])
    .then(([j, t]) => { base = traduzBase(j, t); return base; }).catch(e => { basePromessa = null; throw e; }));
};
const artigosVisiveis = () => (base ? base.artigos : []).filter(a => (a.status || 'publicado') === 'publicado' && (me || a.publico !== 'equipe'));
const marca = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (m, id, txt) => `<a href="#artigo/${id}">${txt || id}</a>`);
const rodapeAjuda = () => `<p class="nota ajuda-fim">${H('aindaDuvida')}</p>`;
const voltarAjuda = () => `<header class="topo"><a class="voltar" href="#ajuda"><i class="fas fa-arrow-left" aria-hidden="true"></i> ${H('voltarAjuda')}</a>`;
function ajuda() {
  document.title = H('ajudaTit') + ' · CONecta Retiro';
  const g = AJ.guia(I.atual()), tabs = me ? abas() : [];
  tela.innerHTML = topo(H('ajudaTit'), !!me) + `<main class="ajuda-tela">
    ${me ? '' : `<p><a class="voltar-entrar" href="#"><i class="fas fa-arrow-left" aria-hidden="true"></i> ${t('entrar')}</a></p>`}
    <label for="ab" class="rotulo-busca"><i class="fas fa-search" aria-hidden="true"></i> ${H('buscar')}</label>
    <input id="ab" type="search" placeholder="${esc(H('buscarPh'))}" autocomplete="off">
    <div id="ares" aria-live="polite"></div>
    <div id="aguia"><h2>${H('comoUsar')}</h2>
    <div class="lista">${g.map(x => `<a class="linha" href="#guia/${x.id}"><i class="fas ${x.icone}" aria-hidden="true"></i><span>${esc(x.titulo)}</span><i class="fas fa-chevron-right seta" aria-hidden="true"></i></a>`).join('')}</div>
    ${tabs.length ? `<h2>${H('porFerramenta')}</h2><div class="lista">${tabs.map(tb => `<a class="linha" href="#ajuda-f/${encodeURIComponent(tb[0])}"><i class="fas ${tb[1]}" aria-hidden="true"></i><span>${esc(I.aba(tb[0], tb[2]))}</span><i class="fas fa-question-circle seta" aria-hidden="true"></i></a>`).join('')}</div>` : ''}
    <a class="bt bt-claro" href="../ajuda.html" target="_blank" rel="noopener"><i class="fas fa-book-open" aria-hidden="true"></i> ${H('centralSite')}</a></div>
    ${rodapeAjuda()}
  </main>`;
  const bv = $('.voltar-entrar'); if (bv) bv.onclick = ev => { ev.preventDefault(); history.replaceState(null, '', location.pathname + location.search); rota(); };
  const busca = () => {
    const q = norm($('#ab').value), res = $('#ares'), gl = $('#aguia');
    if (q.length < 2) { res.innerHTML = ''; gl.hidden = false; return; }
    gl.hidden = true;
    const ps = q.split(/\s+/).filter(Boolean), casa = txt => { const n = norm(txt); return ps.every(p => n.includes(p)); };
    const rg = g.filter(x => casa([x.titulo, x.intro, x.palavras, x.passos.join(' ')].join(' ')));
    const desenha = () => {
      const ra = artigosVisiveis().map(a => { const tit = norm(a.titulo), tudo = [a.titulo, a.resumo, (a.palavras || []).join(' '), a.secoes && a.secoes.oQueE].join(' ');
        return casa(tudo) ? { a, pts: ps.filter(p => tit.includes(p)).length * 3 + ps.filter(p => norm((a.palavras || []).join(' ')).includes(p)).length } : null; }).filter(Boolean).sort((x, y) => y.pts - x.pts).slice(0, 15);
      res.innerHTML = (rg.length ? `<h2>${H('guia')}</h2><div class="lista">${rg.map(x => `<a class="linha" href="#guia/${x.id}"><i class="fas ${x.icone}" aria-hidden="true"></i><span>${esc(x.titulo)}</span><i class="fas fa-chevron-right seta" aria-hidden="true"></i></a>`).join('')}</div>` : '')
        + (ra.length ? `<h2>${H('artigos')}</h2>${ra.map(({ a }) => `<a class="artigo-link" href="#artigo/${a.id}"><b>${esc(a.titulo)}</b><small>${esc(a.resumo || '')}</small></a>`).join('')}` : '')
        || `<p class="vazio">${H(base ? 'nadaAchado' : 'carregando')}</p>`;
    };
    desenha(); if (!base) carregaBase().then(() => { if ($('#ab') && norm($('#ab').value) === q) desenha(); }).catch(() => { res.innerHTML += `<p class="faixa faixa-alerta">${H('erroAjuda')}</p>`; });
  };
  $('#ab').oninput = busca;
  carregaBase().catch(() => {}); // já vai buscando os artigos
}
function guia(id) {
  const x = AJ.guia(I.atual()).find(g => g.id === id); if (!x) return ajuda();
  document.title = x.titulo + ' · CONecta Retiro';
  tela.innerHTML = voltarAjuda() + `<h1><i class="fas ${x.icone}" aria-hidden="true"></i> ${esc(x.titulo)}</h1></header><main class="ajuda-tela artigo">
    ${AJ.temGuia(I.atual()) ? '' : `<p class="nota">${H('soPt')}</p>`}
    <p class="intro">${esc(x.intro)}</p>
    <ol class="passos-ajuda">${x.passos.map(p => `<li>${p}</li>`).join('')}</ol>
    ${x.dica ? `<p class="dica"><i class="fas fa-lightbulb" aria-hidden="true"></i> <b>${H('dica')}:</b> ${x.dica}</p>` : ''}
    ${rodapeAjuda()}
  </main>`;
}
function artigo(id, ferr) {
  tela.innerHTML = voltarAjuda() + `<h1>${H('ajudaTit')}</h1></header><main class="ajuda-tela"><p class="vazio">${H('carregando')}</p></main>`;
  carregaBase().then(() => {
    const a = artigosVisiveis().find(x => x.id === id);
    if (!a) return semArtigo(ferr);
    const s = a.secoes || {}, lista = (tit, l, tag) => l && l.length ? `<h2>${tit}</h2><${tag} class="passos-ajuda">${l.map(i => `<li>${marca(i)}</li>`).join('')}</${tag}>` : '';
    const img = src => /^(data:|https?:)/.test(src) ? src : '../' + src;
    const rel = (a.relacionados || []).map(r => artigosVisiveis().find(x => x.id === r)).filter(Boolean);
    document.title = a.titulo + ' · CONecta Retiro';
    tela.innerHTML = voltarAjuda() + `<h1>${esc(a.titulo)}</h1></header><main class="ajuda-tela artigo">
      ${I.atual() !== 'pt' && !a.traduzido ? `<p class="nota">${H('soPt')}</p>` : ''}
      ${a.resumo ? `<p class="intro">${marca(a.resumo)}</p>` : ''}
      ${ferr ? `<a class="bt bt-principal" href="${ferramenta(ferr)}"><i class="fas fa-external-link-alt" aria-hidden="true"></i> ${H('abrirFerr')}</a>` : ''}
      ${s.oQueE ? `<h2>${H('oQueE')}</h2><p>${marca(s.oQueE)}</p>` : ''}
      ${s.finalidade ? `<h2>${H('paraQue')}</h2><p>${marca(s.finalidade)}</p>` : ''}
      ${lista(H('passos'), s.passos, 'ol')}
      ${(a.imagens || []).map(i => `<figure><img src="${esc(img(i.src))}" alt="${esc(i.alt || i.legenda || '')}" loading="lazy">${i.legenda ? `<figcaption>${esc(i.legenda)}</figcaption>` : ''}</figure>`).join('')}
      ${lista(H('exemplos'), s.exemplos, 'ul')}
      ${s.cuidados && s.cuidados.length ? `<div class="cuidados">${lista(H('cuidados'), s.cuidados, 'ul')}</div>` : ''}
      ${rel.length ? `<h2>${H('relacionados')}</h2><div class="lista">${rel.map(r => `<a class="linha" href="#artigo/${r.id}"><i class="fas fa-file-alt" aria-hidden="true"></i><span>${esc(r.titulo)}</span><i class="fas fa-chevron-right seta" aria-hidden="true"></i></a>`).join('')}</div>` : ''}
      ${rodapeAjuda()}
    </main>`;
    window.scrollTo(0, 0);
  }).catch(() => { $('main').innerHTML = `<p class="faixa faixa-alerta">${H('erroAjuda')}</p>`; });
}
function semArtigo(ferr) {
  $('main').innerHTML = `<p class="vazio">${H('semArtigo')}</p>${ferr ? `<a class="bt bt-principal" href="${ferramenta(ferr)}">${H('abrirFerr')}</a>` : ''}<a class="bt bt-claro" href="#ajuda">${H('comoUsar')}</a>${rodapeAjuda()}`;
}
// Ajuda de uma ferramenta: acha o artigo pela tabela de contextos da Central de Ajuda ("r.<ferramenta>").
function ajudaFerramenta(tab) {
  tela.innerHTML = voltarAjuda() + `<h1>${H('ajudaTit')}</h1></header><main class="ajuda-tela"><p class="vazio">${H('carregando')}</p></main>`;
  carregaBase().then(b => { const id = (b.contextos || {})['r.' + tab]; if (id) artigo(id, tab); else semArtigo(tab); })
    .catch(() => { $('main').innerHTML = `<p class="faixa faixa-alerta">${H('erroAjuda')}</p>`; });
}

/* ---------- Bloco 2: telas próprias de Alojamento, Inventário, Documentos e Calendários ---------- */
// Mesmos dados e regras da área restrita (coleções pedidos, inv_itens/inv_emp/inv_mov, docs, ativ); o que é mais raro fica na ferramenta completa.
const tv = v => { const k = 'val_' + v, x = t(k); return x === k ? v : x; }; // situações e tipos fixos traduzidos
let flash = '';
const mostraFlash = () => { const f = flash; flash = ''; return f ? `<p class="faixa faixa-ok" role="status"><i class="fas fa-check-circle" aria-hidden="true"></i> ${esc(f)}</p>` : ''; };
const grava = (col, l) => { try { return db.set(col, l) !== false; } catch (e) { return false; } };
const temAba = id => abas().some(x => x[0] === id);
const nomeAba = id => I.aba(id, (abas().find(x => x[0] === id) || [])[2] || id);
const abasSub = (lista, atual, base) => `<nav class="sub" aria-label="${esc(document.title.split(' · ')[0])}">${lista.map(([k, n]) => `<a href="#${base}${k ? '/' + k : ''}" class="${k === atual ? 'on' : ''}"${k === atual ? ' aria-current="page"' : ''}>${esc(n)}</a>`).join('')}</nav>`;
const rodapeFerr = (id, txt) => `${txt ? `<p class="nota">${esc(txt)}</p>` : ''}<a class="bt bt-claro" href="${ferramenta(id)}"><i class="fas fa-external-link-alt" aria-hidden="true"></i> ${t('b2_ferrCompleta')}</a>
  <a class="bt bt-texto" href="#ajuda-f/${encodeURIComponent(id)}"><i class="fas fa-question-circle" aria-hidden="true"></i> ${H('ajudaBt')}</a>`;
const telLink = tel => { const n = String(tel || '').replace(/\D/g, ''); return n ? ` <a href="tel:${n}" class="tel"><i class="fas fa-phone" aria-hidden="true"></i> ${t('b2_ligar')}</a> <a href="https://wa.me/${n.length <= 11 ? '55' + n : n}" class="tel" target="_blank" rel="noopener"><i class="fab fa-whatsapp" aria-hidden="true"></i> WhatsApp</a>` : ''; };

/* --- Alojamento (mesmas regras de area.js: 12 camas, ímpares embaixo, sem choque de datas) --- */
const QUARTOS = [['Paz', 1, 4], ['Força', 5, 8], ['Alegria', 9, 12]], NCAMAS = 12;
const quartoDe = n => (QUARTOS.find(q => n >= q[1] && n <= q[2]) || ['?'])[0];
const nivelCama = n => t(n % 2 ? 'b2_baixo' : 'b2_cima');
const pad2 = n => String(n).padStart(2, '0');
const camaTxt = n => t('b2_cama', { n: pad2(n), nv: nivelCama(n), q: quartoDe(n) });
const fimEf = r => r.saida > r.chegada ? r.saida : somaDias(r.chegada, 1);
const choca = (a, b) => a.chegada < fimEf(b) && b.chegada < fimEf(a);
const pedidos = () => db.get('pedidos', []) || [];
const ocupadas = r => { const m = {}; pedidos().filter(p => p.status === 'confirmada' && p.id !== r.id && choca(p, r)).forEach(p => (p.camas || []).forEach(c => { m[c.cama] = p; })); return m; };
const assefazDe = (r, st) => (r.assefaz || []).filter(a => !st || a.status === st);
const mesmoNome = (a, b) => norm(a) === norm(b);
let alojAbre = '';
function alojamento(sub) {
  if (!temAba('reservas')) return inicio();
  sub = sub || 'pedidos';
  document.title = nomeAba('reservas') + ' · CONecta Retiro';
  const SUBS = [['pedidos', t('b2_pedidos')], ['ocupacao', t('b2_ocup')], ['novo', t('b2_novo')]];
  const per = r => t('b2_periodo', { a: fmtDia(r.chegada).slice(0, 5), b: fmtDia(r.saida) });
  const info = r => `<h3>${esc(r.nome)}</h3><p>${t('b2_pessoas', { n: r.pessoas })} · ${per(r)}${r.hora ? ' · ' + t('b2_chegHora', { h: esc(r.hora) }) : ''}</p>
    ${r.telefone || r.email ? `<p class="contato">${esc([r.telefone, r.email].filter(Boolean).join(' · '))}${telLink(r.telefone)}</p>` : ''}
    ${r.necessidades || r.camaBaixa ? `<p class="aviso-nec"><i class="fas fa-exclamation-circle" aria-hidden="true"></i> ${r.necessidades ? `<b>${t('b2_nec')}:</b> ${esc(r.necessidades)} ` : ''}${r.camaBaixa ? `<b>(${t('b2_camaBaixa')})</b>` : ''}</p>` : ''}
    ${r.detalhes ? `<p class="desc">${esc(r.detalhes)}</p>` : ''}`;
  let corpo = '';
  if (sub === 'pedidos') {
    const ps = pedidos(), pend = ps.filter(r => r.status === 'pendente').sort((a, b) => a.chegada.localeCompare(b.chegada));
    const h = hoje(), lim = somaDias(h, 60), conf = ps.filter(r => r.status === 'confirmada' && fimEf(r) > h && r.chegada <= lim).sort((a, b) => a.chegada.localeCompare(b.chegada));
    const cartao = r => {
      const oc = ocupadas(r), livres = []; for (let n = 1; n <= NCAMAS; n++) if (!oc[n] && (!r.camaBaixa || n % 2)) livres.push(n);
      const total = NCAMAS - Object.keys(oc).length, fora = assefazDe(r, 'confirmada'), nCama = r.hospedagem ? Math.max(0, r.pessoas - fora.length) : 0, nomeFora = fora.some(a => mesmoNome(a.pessoa, r.nome));
      const aberto = alojAbre === r.id;
      const camas = aberto && nCama ? `<p class="nota">${t('b2_dicaCamas')}</p>` + Array.from({ length: nCama }, (_, i) => `<div class="cama-linha"><label class="oculto" for="p-${i}">${t('b2_nomePessoa', { n: i + 1 })}</label><input id="p-${i}" data-p="${i}" maxlength="80" value="${i === 0 && !nomeFora ? esc(r.nome) : ''}" placeholder="${esc(t('b2_nomePessoa', { n: i + 1 }))}">
        <label class="oculto" for="c-${i}">${esc(t('b2_escolhaCama'))}</label><select id="c-${i}" data-c="${i}"><option value="">${t('b2_escolhaCama')}</option>${livres.map(n => `<option value="${n}">${esc(t('b2_camaCurta', { n: pad2(n), nv: nivelCama(n), q: quartoDe(n) }))}</option>`).join('')}</select></div>`).join('') : '';
      return `<article class="cartao-b2" data-id="${esc(r.id)}">${info(r)}
        <p class="nota">${r.hospedagem ? t('b2_livres', { n: total, t: NCAMAS }) + (nCama > total ? ` <span class="tag tag-ocupado">${t('b2_naoCabe')}</span>` : '') : t('b2_semCama')}</p>
        ${fora.length ? `<p class="nota">${esc(t('b2_naAssefaz', { p: fora.map(a => a.pessoa).join(', ') }))}</p>` : ''}
        ${aberto ? `<div class="form-b2">${camas}<p class="erro" role="alert" hidden></p><button type="button" class="bt bt-principal" data-salva>${t(nCama ? 'b2_confirmar' : 'b2_confirmarSem')}</button>
          <label for="m-${esc(r.id)}">${t('b2_motivo')}</label><input id="m-${esc(r.id)}" data-motivo maxlength="200">
          <button type="button" class="bt bt-perigo" data-recusa>${t('b2_simRecusar')}</button><button type="button" class="bt bt-texto" data-fecha>${t('b2_cancelar')}</button></div>`
        : `<button type="button" class="bt bt-principal" data-abre>${t(nCama ? 'b2_confirmar' : 'b2_confirmarSem')} / ${t('b2_recusar')}</button>`}</article>`;
    };
    corpo = `<h2>${t('b2_aguard', { n: pend.length })}</h2>${pend.length ? pend.map(cartao).join('') : `<p class="vazio">${t('b2_semAguard')}</p>`}
      <h2>${t('b2_proxConf')}</h2>${conf.length ? conf.map(r => `<article class="cartao-b2 conf"><h3>${esc(r.nome)}</h3><p>${t('b2_pessoas', { n: r.pessoas })} · ${per(r)}</p><p class="desc">${(r.camas || []).map(c => esc(c.pessoa) + ': ' + esc(camaTxt(c.cama))).concat(assefazDe(r, 'confirmada').map(a => esc(a.pessoa) + ': ASSEFAZ')).join('<br>') || esc(t('b2_semCama'))}</p></article>`).join('') : `<p class="vazio">${t('b2_semConf')}</p>`}`;
  } else if (sub === 'ocupacao') {
    const dia = sessionStorage.getItem('pr_app_ocup') || hoje(), ocupa = {};
    const conf = pedidos().filter(r => r.status === 'confirmada' && r.chegada <= dia && dia < fimEf(r));
    conf.forEach(r => (r.camas || []).forEach(c => { ocupa[c.cama] = c.pessoa; }));
    const fora = []; conf.forEach(r => assefazDe(r, 'confirmada').forEach(a => fora.push(a.pessoa)));
    const n = Object.keys(ocupa).length;
    corpo = `<label for="o-d">${t('b2_data')}</label><input id="o-d" type="date" value="${dia}">
      <div class="totais"><div><span>${t('b2_ocupadas')}</span><b>${n} / ${NCAMAS}</b></div><div><span>${t('b2_livresT')}</span><b>${NCAMAS - n}</b></div></div>
      ${QUARTOS.map(q => { let b = ''; for (let c = q[1]; c <= q[2]; c++) b += `<div class="cama ${ocupa[c] ? 'ocupada' : 'livre'}"><b>${pad2(c)}</b><small>${nivelCama(c)}</small><span>${ocupa[c] ? esc(ocupa[c]) : t('b2_livre')}</span></div>`; return `<h2>${t('b2_quarto', { q: q[0] })}</h2><div class="camas">${b}</div>`; }).join('')}
      ${fora.length ? `<h2>${t('b2_assefazDia')}</h2><p>${esc(fora.join(', '))}</p>` : ''}`;
  } else {
    corpo = `<p class="nota">${t('b2_dicaNovo')}</p><form id="fn" class="form-b2" novalidate>
      <label for="n-n">${t('b2_nome')}</label><input id="n-n" maxlength="80" autocomplete="off">
      <label for="n-t">${t('b2_telefone')}</label><input id="n-t" type="tel" maxlength="30">
      <label for="n-e">${t('b2_email')}</label><input id="n-e" type="email" maxlength="80">
      <div class="duas"><div><label for="n-c">${t('b2_chegada')}</label><input id="n-c" type="date"></div><div><label for="n-s">${t('b2_saida')}</label><input id="n-s" type="date"></div></div>
      <div class="duas"><div><label for="n-h">${t('b2_hora')}</label><input id="n-h" type="time"></div><div><label for="n-p">${t('b2_nPessoas')}</label><input id="n-p" type="number" min="1" max="99" value="1" inputmode="numeric"></div></div>
      <label class="marca"><input type="checkbox" id="n-g" checked> ${t('b2_precisaCama')}</label>
      <label class="marca"><input type="checkbox" id="n-b"> ${t('b2_camaBaixa')}</label>
      <label for="n-nec">${t('b2_necessidades')}</label><textarea id="n-nec" rows="2" maxlength="500"></textarea>
      <label for="n-d">${t('b2_detalhes')}</label><textarea id="n-d" rows="3" maxlength="1500"></textarea>
      <p class="erro" role="alert" hidden></p><button class="bt bt-principal">${t('b2_salvarPedido')}</button></form>`;
  }
  tela.innerHTML = topo(nomeAba('reservas'), true) + aviso() + `<main class="b2">${abasSub(SUBS, sub, 'alojamento')}${mostraFlash()}${corpo}${rodapeFerr('reservas', t('b2_ferrCompletaAloj'))}</main>`;
  if (sub === 'pedidos') tela.querySelectorAll('.cartao-b2[data-id]').forEach(box => {
    const id = box.dataset.id, er = box.querySelector('.erro'), falha = m => { er.textContent = m; er.hidden = false; };
    const ab = box.querySelector('[data-abre]'); if (ab) ab.onclick = () => { alojAbre = id; alojamento('pedidos'); const b = $('.cartao-b2[data-id="' + id + '"]'); if (b) b.scrollIntoView({ block: 'start' }); };
    const fe = box.querySelector('[data-fecha]'); if (fe) fe.onclick = () => { alojAbre = ''; alojamento('pedidos'); };
    const sv = box.querySelector('[data-salva]'); if (sv) sv.onclick = () => {
      er.hidden = true; const l = pedidos(), x = l.find(r => r.id === id); if (!x) return;
      const camas = [], ns = [...box.querySelectorAll('[data-p]')], cs = [...box.querySelectorAll('[data-c]')];
      for (let i = 0; i < cs.length; i++) { const n = +cs[i].value; if (!n) return falha(t('b2_errCama')); camas.push({ pessoa: ns[i].value.trim() || t('b2_nomePessoa', { n: i + 1 }), cama: n }); }
      if (new Set(camas.map(c => c.cama)).size < camas.length) return falha(t('b2_errDupla'));
      const oc = ocupadas(x); if (camas.some(c => oc[c.cama])) return falha(t('b2_errOcupada'));
      x.status = 'confirmada'; x.camas = camas; x.motivo = '';
      if (!grava('pedidos', l)) return falha(t('b2_erroSalvar'));
      alojAbre = ''; flash = t('b2_okConf'); alojamento('pedidos');
    };
    const rc = box.querySelector('[data-recusa]'); if (rc) rc.onclick = () => {
      const l = pedidos(), x = l.find(r => r.id === id); if (!x) return;
      x.status = 'recusada'; x.motivo = (box.querySelector('[data-motivo]').value || '').trim(); x.camas = [];
      if (!grava('pedidos', l)) return falha(t('b2_erroSalvar'));
      alojAbre = ''; flash = t('b2_okRec'); alojamento('pedidos');
    };
  });
  if (sub === 'ocupacao') $('#o-d').onchange = e => { if (e.target.value) { sessionStorage.setItem('pr_app_ocup', e.target.value); alojamento('ocupacao'); } };
  if (sub === 'novo') $('#fn').onsubmit = e => {
    e.preventDefault(); const v = id => $('#' + id).value.trim(), er = $('#fn .erro'), falha = m => { er.textContent = m; er.hidden = false; er.scrollIntoView({ block: 'center' }); }; er.hidden = true;
    const p = parseInt(v('n-p'), 10);
    if (!v('n-n') || !v('n-c') || !v('n-s')) return falha(t('b2_errNovo1'));
    if (v('n-s') < v('n-c')) return falha(t('b2_errNovo2'));
    if (!(p >= 1)) return falha(t('b2_errNovo3'));
    if ($('#n-g').checked && p > NCAMAS) return falha(t('b2_errNovo4', { n: NCAMAS }));
    const l = pedidos(), id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    l.push({ id, status: 'pendente', nome: v('n-n'), telefone: v('n-t'), email: v('n-e'), cidade: '', comunidade: '', chegada: v('n-c'), saida: v('n-s'), hora: v('n-h'), pessoas: p, hospedagem: $('#n-g').checked, camaBaixa: $('#n-b').checked, necessidades: v('n-nec'), detalhes: v('n-d'), camas: [], criado: hoje(), por: me.nome });
    if (!grava('pedidos', l)) return falha(t('b2_erroSalvar'));
    alojAbre = id; flash = t('b2_okNovo'); location.hash = '#alojamento/pedidos';
  };
}

/* --- Inventário: consulta rápida, ficha do item e o que está emprestado; movimentar fica na ferramenta completa --- */
function inventario(itemId) {
  if (!temAba('inventario')) return inicio();
  document.title = nomeAba('inventario') + ' · CONecta Retiro';
  const itens = db.get('inv_itens', []) || [], emp = (db.get('inv_emp', []) || []).filter(e => !e.devolvido), h = hoje();
  const catNome = id => (window.PR_INVENTARIO && window.PR_INVENTARIO.catNome) ? window.PR_INVENTARIO.catNome(id) : id;
  const tag = st => `<span class="tag ${st === 'Disponível' ? 'tag-ok' : st === 'Baixado' ? 'tag-cinza' : st === 'Em uso' ? 'tag-azul' : 'tag-ocupado'}">${esc(tv(st))}</span>`;
  const empLinha = e => `<li><b>${esc(e.codigo)}</b> ${esc(e.nome)} · ${esc(t('b2_comPessoa', { p: e.pessoa }))}${e.prevista ? ` · <span class="${e.prevista < h ? 'atraso' : ''}">${t('b2_devolverAte', { d: fmtDia(e.prevista) })}${e.prevista < h ? ' (' + t('b2_atrasado') + ')' : ''}</span>` : ''}</li>`;
  if (itemId) {
    const it = itens.find(x => x.id === itemId);
    if (!it) { location.hash = '#inventario'; return; }
    const lo = emp.filter(e => e.item === it.id), mv = (db.get('inv_mov', []) || []).filter(m => m.item === it.id).slice(-8).reverse();
    const lin = (k, v) => v || v === 0 ? `<div class="ficha-l"><span>${t(k)}</span><b>${esc(v)}</b></div>` : '';
    tela.innerHTML = topo(esc(it.codigo), false).replace('<header class="topo">', `<header class="topo"><a class="voltar" href="#inventario"><i class="fas fa-arrow-left" aria-hidden="true"></i> ${t('b2_voltarLista')}</a>`) + aviso() + `<main class="b2">
      <h2 class="item-nome">${esc(it.nome)}</h2><p>${tag(it.status)}</p>
      ${it.foto ? `<img class="item-foto" src="${esc(it.foto)}" alt="${esc(it.nome)}">` : ''}
      <div class="ficha">${lin('b2_cat', catNome(it.cat))}${lin('b2_qtd', (it.quantidade ?? '') + (it.unidade ? ' ' + it.unidade : ''))}${lin('b2_local', it.local)}${lin('b2_conserv', it.conserv ? tv(it.conserv) : '')}${lin('b2_resp', it.responsavel)}${lin('b2_pat', it.patNumero)}${lin('b2_marcaSerie', [it.marca, it.modelo, it.serie].filter(Boolean).join(' · '))}${lin('b2_projeto', it.projeto)}</div>
      ${it.descricao ? `<p class="desc">${esc(it.descricao)}</p>` : ''}
      ${lo.length ? `<h2>${t('b2_emprestados', { n: lo.length })}</h2><ul class="lista-b2">${lo.map(empLinha).join('')}</ul>` : ''}
      <h2>${t('b2_ultMov')}</h2>${mv.length ? `<ul class="lista-b2">${mv.map(m => `<li>${esc(fmtDia(m.data))} · <b>${esc(tv(m.tipo))}</b>${m.qtd !== '' && m.qtd != null ? ' · ' + esc(m.qtd) : ''}${m.det ? ' · ' + esc(m.det) : ''}${m.por ? ` <small>(${esc(m.por)})</small>` : ''}</li>`).join('')}</ul>` : `<p class="vazio">${t('b2_semMov')}</p>`}
      <a class="bt bt-principal" href="${ferramenta('inventario')}"><i class="fas fa-exchange-alt" aria-hidden="true"></i> ${t('b2_movimentar')}</a>
      ${rodapeFerr('inventario')}
    </main>`;
    window.scrollTo(0, 0); return;
  }
  const q0 = sessionStorage.getItem('pr_app_invq') || '';
  tela.innerHTML = topo(nomeAba('inventario'), true) + aviso() + `<main class="b2">
    ${emp.length ? `<h2>${t('b2_emprestados', { n: emp.length })}</h2><ul class="lista-b2">${emp.sort((a, b) => (a.prevista || '9').localeCompare(b.prevista || '9')).map(e => `<li><a href="#inv/${encodeURIComponent(e.item)}">${empLinha(e).slice(4, -5)}</a></li>`).join('')}</ul>` : ''}
    <h2>${t('b2_procurarItem')}</h2>
    <label for="ib" class="oculto">${t('b2_invBusca')}</label><input id="ib" type="search" placeholder="${esc(t('b2_invBusca'))}" value="${esc(q0)}" autocomplete="off">
    <div id="ires" aria-live="polite"></div>
    ${rodapeFerr('inventario')}
  </main>`;
  const mostra = () => {
    const q = norm($('#ib').value); sessionStorage.setItem('pr_app_invq', $('#ib').value);
    const ord = itens.slice().sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));
    const l = ord.filter(x => !q || norm([x.codigo, x.nome, x.marca, x.modelo, x.serie, x.local, x.patNumero].join(' ')).includes(q));
    $('#ires').innerHTML = `<p class="nota">${t('b2_itens', { n: l.length })}</p>` + (l.length ? l.slice(0, 50).map(x => `<a class="item-b2" href="#inv/${encodeURIComponent(x.id)}"><b>${esc(x.codigo)}</b><span>${esc(x.nome)}</span><small>${esc(x.local || '')}${x.quantidade > 1 ? ' · ' + esc(x.quantidade) + ' ' + esc(x.unidade || '') : ''}</small>${tag(x.status)}</a>`).join('') + (l.length > 50 ? `<p class="nota">${t('b2_primeiros', { n: 50 })}</p>` : '') : `<p class="vazio">${t('b2_nadaInv')}</p>`);
  };
  $('#ib').oninput = mostra; mostra();
}

/* --- Documentos e Calendários: encaminhamentos das atas e nova atividade --- */
let darR = '', darMsg = 'status'; // Dar encaminhamento: reunião escolhida e mensagem aberta
function documentos(sub) {
  if (!temAba('documentos')) return inicio();
  // Como na ferramenta do site: todos consultam; só o Responsável pelos Documentos e Calendários (ou o administrador) altera.
  const pode = !!(A && A.tem && A.tem(me, 'documentos'));
  sub = sub === 'dar' ? 'dar' : pode ? (sub || 'enc') : 'enc';
  document.title = nomeAba('documentos') + ' · CONecta Retiro';
  const SUBS = [['enc', t('b2_encAberto', { n: '' }).replace(/\s*\(\)\s*$/, '')], ['dar', t('b2_dar')]].concat(pode ? [['nova', t('b2_novaAtiv')]] : []);
  const PD = window.PR_DOCUMENTOS, DAR = sub === 'dar' && PD && PD.darEncaminhamento ? PD.darEncaminhamento(db, hoje(), darR) : null;
  const linkArea = new URL('../area-restrita.html', location.href).href;
  const caixaMsg = (tit, txt) => `<section class="cartao-b2" id="dmsg"><h3><i class="fab fa-whatsapp" aria-hidden="true"></i> ${esc(tit)}</h3><nav class="sub" aria-label="${esc(tit)}"><a href="#" data-dm="status" class="${darMsg === 'status' ? 'on' : ''}">${t('b2_darCada')}</a><a href="#" data-dm="resumo" class="${darMsg === 'resumo' ? 'on' : ''}">${t('b2_darCurta')}</a></nav><p class="nota">${t('b2_darConfira')}</p>
    <textarea id="dtxt" rows="14" style="width:100%">${esc(txt)}</textarea>
    <div class="acoes"><button type="button" class="bt bt-principal" id="dcp"><i class="fas fa-copy" aria-hidden="true"></i> ${t('b2_darCopiar')}</button><a class="bt bt-claro" id="dwa" href="#" target="_blank" rel="noopener"><i class="fab fa-whatsapp" aria-hidden="true"></i> ${t('b2_darWhats')}</a></div></section>`;
  let corpo = '';
  if (sub === 'enc') {
    const h = hoje(), ab = [];
    (db.get('docs', []) || []).filter(d => d.area === 'atas').forEach(d => (d.enc || []).forEach(e => { if (e.status === 'Em aberto') ab.push({ d, e }); }));
    ab.sort((a, b) => (a.e.data || '9').localeCompare(b.e.data || '9'));
    corpo = `<p class="nota">${t('b2_dicaEnc')}</p><h2>${t('b2_encAberto', { n: ab.length })}</h2>` + (ab.length ? ab.map(({ d, e }) => {
      const atraso = e.data && e.data < h;
      return `<article class="cartao-b2${atraso ? ' atrasado' : ''}"><h3>${esc(e.texto)}</h3>
        <p>${e.resp ? esc(e.resp) + ' · ' : ''}${e.data ? `<span class="${atraso ? 'atraso' : ''}">${t('b2_prazo', { d: fmtDia(e.data) })}${atraso ? ' · ' + t('b2_emAtraso') : ''}</span>` : ''}</p>
        <p class="desc">${esc(t('b2_daAta', { t: d.titulo, d: d.data ? fmtDia(d.data) : '' }))}</p>
        ${pode ? `<div class="acoes"><button type="button" class="bt bt-principal" data-st="${esc(d.id)}|${esc(e.id)}|Feito"><i class="fas fa-check" aria-hidden="true"></i> ${t('b2_feito')}</button><button type="button" class="bt bt-texto" data-st="${esc(d.id)}|${esc(e.id)}|Cancelado">${t('b2_cancelarEnc')}</button></div>` : ''}</article>`;
    }).join('') : `<p class="vazio">${t('b2_semEnc')}</p>`);
  } else if (sub === 'dar') {
    const D = DAR;
    if (!D || !D.r) corpo = `<p class="vazio">${t('b2_darSemAta')}</p>`;
    else {
      darR = D.r;
      corpo = `<p class="nota">${t('b2_darDica', { r: D.nome })}</p>
      ${D.reunioes.length > 1 ? `<label for="dr">${t('b2_darReuniao')}</label><select id="dr">${D.reunioes.map(k => `<option value="${esc(k)}"${k === D.r ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select>` : ''}
      <p class="resumo-b2"><b>${D.itens.length}</b> ${t('b2_darAbertos')} · <b class="atraso">${D.nR}</b> ${t('b2_darSemResp')} · <b>${D.nD}</b> ${t('b2_darSemData')} · <b>${D.prox.length}</b> ${t('b2_darProx')}</p>
      ${D.itens.length ? caixaMsg(t('b2_darMsgTit'), darMsg === 'resumo' ? PD.msgResumo(D, linkArea) : PD.msgStatus(D, linkArea)) + `<h2>${t('b2_darAtualizar')}</h2>` : ''}
      ${D.itens.length ? D.itens.map((i, n) => `<article class="cartao-b2${i.atraso ? ' atrasado' : ''}" data-de="${esc(i.d.id)}|${esc(i.e.id)}">
        <p><span class="etq">${esc(i.d.codigo)}</span> ${i.semResp ? `<span class="etq etq-alerta">${t('b2_darSemResp1')}</span>` : ''} ${i.semData ? `<span class="etq etq-aviso">${t('b2_darSemData1')}</span>` : ''} ${i.atraso ? `<span class="etq etq-alerta">${t('b2_emAtraso')}</span>` : ''}</p>
        <h3>${esc(i.e.texto)}</h3>
        <p>${i.semResp ? '' : '<i class="fas fa-user" aria-hidden="true"></i> ' + esc(i.e.resp) + ' · '}${i.data ? t('b2_prazo', { d: fmtDia(i.data) }) : ''}</p>
        ${i.e.passo ? `<p class="desc"><i class="fas fa-shoe-prints" aria-hidden="true"></i> ${esc(i.e.passo)}</p>` : ''}
        <p class="desc">${t(i.e.atualizado ? 'b2_darAtualizado' : 'b2_darParado', { n: i.parado })}</p>
        ${pode ? `<details><summary>${t('b2_darEditar')}</summary><div class="form-b2">
          <label for="dq${n}">${t('b2_darQuem')}</label><input id="dq${n}" data-k="resp" maxlength="80" value="${esc(i.semResp ? '' : i.e.resp)}">
          <label for="dd${n}">${t('b2_darPrazo')}</label><input id="dd${n}" data-k="data" type="date" value="${esc(i.data)}">
          <label for="dp${n}">${t('b2_darPasso')}</label><input id="dp${n}" data-k="passo" maxlength="160" value="${esc(i.e.passo || '')}">
          <div class="acoes"><button type="button" class="bt bt-principal" data-dok><i class="fas fa-save" aria-hidden="true"></i> ${t('b2_darSalvar')}</button><button type="button" class="bt bt-claro" data-dfeito><i class="fas fa-check" aria-hidden="true"></i> ${t('b2_feito')}</button></div></div></details>` : ''}
      </article>`).join('') : `<p class="vazio">${t('b2_semEnc')}</p>`}`;
    }
  } else {
    const cats = ['Encontro Estacional', 'Reunião de Escola', 'Retiro / Seminário', 'Mutirão / Manutenção', 'Celebração / Evento', 'Outras atividades', 'Campanha'].concat(db.get('ativ_cats', []) || []);
    corpo = `<form id="fa" class="form-b2" novalidate>
      <label for="a-t">${t('b2_titulo')}</label><input id="a-t" maxlength="120">
      <div class="duas"><div><label for="a-d">${t('b2_dataIni')}</label><input id="a-d" type="date"></div><div><label for="a-f">${t('b2_dataFim')}</label><input id="a-f" type="date"></div></div>
      <label for="a-h">${t('b2_horaAtiv')}</label><input id="a-h" maxlength="20" placeholder="09:00">
      <label for="a-c">${t('b2_tipo')}</label><select id="a-c">${cats.map(c => `<option value="${esc(c)}">${esc(tv(c))}</option>`).join('')}</select>
      <label for="a-l">${t('b2_localAtiv')}</label><input id="a-l" maxlength="120">
      <label for="a-s">${t('b2_descricao')}</label><textarea id="a-s" rows="3" maxlength="1500"></textarea>
      <p class="erro" role="alert" hidden></p><button class="bt bt-principal">${t('b2_salvarAtiv')}</button></form>`;
  }
  tela.innerHTML = topo(nomeAba('documentos'), true) + aviso() + `<main class="b2">${abasSub(SUBS, sub, 'documentos')}${mostraFlash()}${corpo}<a class="bt bt-claro" href="#agenda"><i class="fas fa-calendar-alt" aria-hidden="true"></i> ${t('b2_verAgenda')}</a>${rodapeFerr('documentos')}</main>`;
  if (sub === 'dar' && DAR) {
    const dr = $('#dr'); if (dr) dr.onchange = () => { darR = dr.value; darMsg = ''; documentos('dar'); };
    tela.querySelectorAll('[data-dm]').forEach(a => a.onclick = ev => { ev.preventDefault(); darMsg = a.dataset.dm; documentos('dar'); const x = $('#dmsg'); if (x) x.scrollIntoView({ block: 'start' }); });
    const tx = $('#dtxt');
    if (tx) { const wa = $('#dwa'), at = () => { wa.href = 'https://wa.me/?text=' + encodeURIComponent(tx.value); }; at(); tx.oninput = at;
      $('#dcp').onclick = async () => { try { await navigator.clipboard.writeText(tx.value); } catch (x) { tx.select(); try { document.execCommand('copy'); } catch (y) {} } $('#dcp').textContent = t('b2_darCopiado'); }; }
    if (pode) tela.querySelectorAll('[data-de]').forEach(c => {
      const [di, ei] = c.dataset.de.split('|'), v = k => c.querySelector(`[data-k="${k}"]`).value.trim();
      const salva = st => { const r = PD.salvarEnc(db, di, ei, { resp: v('resp'), data: v('data'), passo: v('passo'), status: st }, me.nome, hoje()); if (!r) { alert(t('b2_erroSalvar')); return; } const y = window.scrollY; flash = t('b2_okEnc'); documentos('dar'); window.scrollTo(0, y); };
      const ok = c.querySelector('[data-dok]'); if (ok) ok.onclick = () => salva('Em aberto');
      const fe = c.querySelector('[data-dfeito]'); if (fe) fe.onclick = () => salva('Feito');
    });
  }
  if (pode) tela.querySelectorAll('[data-st]').forEach(b => b.onclick = () => {
    const [di, ei, st] = b.dataset.st.split('|'), l = db.get('docs', []) || [], d = l.find(x => x.id === di), e = d && (d.enc || []).find(x => x.id === ei);
    if (!e) return; e.status = st;
    if (!grava('docs', l)) { flash = ''; alert(t('b2_erroSalvar')); return; }
    flash = t('b2_okEnc'); documentos('enc');
  });
  if (sub === 'nova' && pode) $('#fa').onsubmit = ev => {
    ev.preventDefault(); const g = id => $('#' + id).value.trim(), er = $('#fa .erro'), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
    const ti = g('a-t'), d = g('a-d'), f = g('a-f');
    if (!ti || !d) return falha(t('b2_errAtiv1'));
    if (f && f < d) return falha(t('b2_errAtiv2'));
    const l = db.get('ativ', []) || [];
    l.push({ id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), titulo: ti, data: d, fim: f && f !== d ? f : '', hora: g('a-h'), categoria: g('a-c'), local: g('a-l'), descricao: g('a-s'), criado: hoje(), por: me.nome });
    if (!grava('ativ', l)) return falha(t('b2_erroSalvar'));
    flash = t('b2_okAtiv'); documentos('nova');
  };
}
function rotaBloco2(k) {
  const [n, arg] = [k.split('/')[0], decodeURIComponent(k.split('/').slice(1).join('/'))];
  if (n === 'alojamento') { alojamento(arg); return true; }
  if (n === 'inventario') { inventario(); return true; }
  if (n === 'inv') { inventario(arg); return true; }
  if (n === 'documentos') { documentos(arg); return true; }
  return false;
}

/* ---------- roteiro ---------- */
const TELAS = { inicio, agenda, biblioteca, areas };
// Telas de ajuda: #ajuda, #guia/<id>, #artigo/<id>, #ajuda-f/<ferramenta>.
function rotaAjuda(k) {
  const [n, arg] = [k.split('/')[0], decodeURIComponent(k.split('/').slice(1).join('/'))];
  if (n === 'ajuda') { ajuda(); return true; }
  if (n === 'guia') { guia(arg); return true; }
  if (n === 'artigo') { artigo(arg); return true; }
  if (n === 'ajuda-f') { ajudaFerramenta(arg); return true; }
  return false;
}
function rota() {
  const ehAjuda = /^(ajuda|guia|artigo|ajuda-f)(\/|$)/.test(location.hash.slice(1));
  if (ehAjuda && !(SB && D && D.modo === 'supabase' && SB.sessao())) { me = null; rotaAjuda(location.hash.slice(1)); window.scrollTo(0, 0); return; }
  if (!SB || !D || D.modo !== 'supabase') { tela.innerHTML = `<main class="entrar"><h1>CONecta Retiro</h1><p class="faixa faixa-alerta">${t('precisaServidor')}</p></main>`; return; }
  const s = SB.sessao(), est = D.estadoSync();
  if (!s || est.estado === 'sem-sessao') return entrar();
  if (est.estado === 'offline' && !db.get('users', []).length) return entrar(t('semServidor'));
  me = db.get('users', []).find(u => u.email === s.user.email);
  if (!me || (me.status || 'aprovado') !== 'aprovado') { SB.sair(); return entrar(t('pendente')); }
  sessionStorage.setItem('pr_sess', me.email);
  const k = location.hash.slice(1);
  if (!rotaAjuda(k) && !rotaBloco2(k)) (TELAS[k] || inicio)();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', rota);
rota();
})();
