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

const VERSAO = '1.2.1', DATA_VERSAO = '11/11/2026'; // ao publicar mudança no app: trocar aqui, em versao.json e em sw.js
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
    <p class="links"><a href="../login.html">${t('esqueci')}</a><br><a href="../login.html">${t('semAcesso')}</a></p>
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
    ${minhas.length ? `<h2>${t('minhas')}</h2><div class="lista">${minhas.map(t => `<a class="linha" href="${ferramenta(t[0])}"><i class="fas ${t[1]}" aria-hidden="true"></i><span>${esc(I.aba(t[0], t[2]))}</span>${t[0] === 'users' && pend ? `<b class="selo">${pend}</b>` : ''}<i class="fas fa-chevron-right seta" aria-hidden="true"></i></a>`).join('')}</div>` : ''}
    <a class="bt bt-claro" href="#areas"><i class="fas fa-th-large" aria-hidden="true"></i> ${t('todas')}</a>
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
    ${grupos.map(([a, l]) => `<h2><i class="fas ${a.icone}" aria-hidden="true"></i> ${esc(t('area_' + a.id) === 'area_' + a.id ? a.nome : t('area_' + a.id))}</h2><div class="lista">${l.map(t => `<a class="linha" href="${ferramenta(t[0])}"><i class="fas ${t[1]}" aria-hidden="true"></i><span>${esc(I.aba(t[0], t[2]))}</span><i class="fas fa-chevron-right seta" aria-hidden="true"></i></a>`).join('')}</div>`).join('')}
  </main>`;
}

/* ---------- roteiro ---------- */
const TELAS = { inicio, agenda, biblioteca, areas };
function rota() {
  if (!SB || !D || D.modo !== 'supabase') { tela.innerHTML = `<main class="entrar"><h1>CONecta Retiro</h1><p class="faixa faixa-alerta">${t('precisaServidor')}</p></main>`; return; }
  const s = SB.sessao(), est = D.estadoSync();
  if (!s || est.estado === 'sem-sessao') return entrar();
  if (est.estado === 'offline' && !db.get('users', []).length) return entrar(t('semServidor'));
  me = db.get('users', []).find(u => u.email === s.user.email);
  if (!me || (me.status || 'aprovado') !== 'aprovado') { SB.sair(); return entrar(t('pendente')); }
  sessionStorage.setItem('pr_sess', me.email);
  const k = location.hash.slice(1);
  (TELAS[k] || inicio)();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', rota);
rota();
})();
