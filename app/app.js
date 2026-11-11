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
const ferramenta = id => '../area-restrita.html?app=1#t=' + encodeURIComponent(id);
let me = null;
// Mensagens do login vêm em português do adaptador; aqui viram o idioma do app.
const traduzErro = m => /incorretos/.test(m) ? t('errCred') : /confirmar seu e-mail/.test(m) ? t('errConf') : /Sem conexão/.test(m) ? t('errRede') : /Muitas tentativas/.test(m) ? t('errMuitas') : m;

const VERSAO = '1.3.1', DATA_VERSAO = '11/11/2026'; // ao publicar mudança no app: trocar aqui, em versao.json e em sw.js
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
const linhaFerr = (tb, extra) => `<div class="linha-f"><a class="linha" href="${ferramenta(tb[0])}"><i class="fas ${tb[1]}" aria-hidden="true"></i><span>${esc(I.aba(tb[0], tb[2]))}</span>${extra || ''}<i class="fas fa-chevron-right seta" aria-hidden="true"></i></a><a class="q" href="#ajuda-f/${encodeURIComponent(tb[0])}" aria-label="${esc(H('ajudaDe', { n: I.aba(tb[0], tb[2]) }))}" title="${esc(H('ajudaDe', { n: I.aba(tb[0], tb[2]) }))}">?</a></div>`;
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
  if (!rotaAjuda(k)) (TELAS[k] || inicio)();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', rota);
rota();
})();
