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
const MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const SEM = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const primeiro = n => String(n || '').trim().split(/\s+/)[0] || '';
const tela = $('#tela');
const ferramenta = id => '../area-restrita.html?app=1#t=' + encodeURIComponent(id);
let me = null;

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

const topo = (titulo, voltar) => `<header class="topo">${voltar ? '<a class="voltar" href="#inicio"><i class="fas fa-arrow-left" aria-hidden="true"></i> Início</a>' : ''}<h1>${titulo}</h1></header>`;
const aviso = () => { const e = D.estadoSync(); return e.estado === 'offline' ? `<p class="faixa faixa-alerta" role="status"><i class="fas fa-wifi" aria-hidden="true"></i> Sem conexão. ${e.pendentes ? e.pendentes + ' alteração(ões) aguardando.' : 'Mostrando o que já estava carregado.'}</p>` : ''; };

/* ---------- Entrar ---------- */
function entrar(msg) {
  document.title = 'Entrar · CONecta Retiro';
  tela.innerHTML = `<main class="entrar">
    <img class="logo" src="icone-192.png" alt="" width="96" height="96">
    <h1>CONecta Retiro</h1><p class="sub">Parque de Estudo e Reflexão Retiro<br>Comissões e administração</p>
    ${msg ? `<p class="faixa faixa-alerta" role="alert">${esc(msg)}</p>` : ''}
    <form id="fe" novalidate>
      <label for="e">Seu e-mail</label><input id="e" type="email" autocomplete="username" inputmode="email">
      <label for="s">Sua senha</label><input id="s" type="password" autocomplete="current-password">
      <label class="mostrar"><input type="checkbox" id="ms"> Mostrar a senha</label>
      <p class="erro" id="er" role="alert" hidden></p>
      <button class="bt bt-principal" id="be">Entrar</button>
    </form>
    <p class="links"><a href="../login.html">Esqueci minha senha</a><br><a href="../login.html">Ainda não tenho acesso</a></p>
  </main>`;
  $('#ms').onchange = ev => { $('#s').type = ev.target.checked ? 'text' : 'password'; };
  $('#fe').onsubmit = async ev => {
    ev.preventDefault();
    const er = $('#er'), b = $('#be'), em = $('#e').value.trim().toLowerCase(), sn = $('#s').value;
    const falha = m => { er.textContent = m; er.hidden = false; b.disabled = false; b.textContent = 'Entrar'; };
    if (!/^\S+@\S+\.\S+$/.test(em) || !sn) return falha('Digite seu e-mail e sua senha.');
    b.disabled = true; b.textContent = 'Entrando...';
    const r = await SB.entrar(em, sn);
    if (r.erro) return falha(r.erro);
    if (r.pendente) return falha('Seu cadastro ainda aguarda a aprovação da comissão do Parque Retiro.');
    sessionStorage.setItem('pr_sess', r.perfil.email);
    history.replaceState(null, '', location.pathname + location.search + '#inicio'); location.reload(); // recarrega já com os dados do servidor
  };
}

/* ---------- Início ---------- */
const botao = (href, ic, nome, extra) => `<a class="cartao" href="${href}"><i class="fas ${ic}" aria-hidden="true"></i><span>${esc(nome)}</span>${extra || ''}</a>`;
function abas() { return A ? A.abasDe(me) : []; }
function inicio() {
  document.title = 'Início · CONecta Retiro';
  const tabs = abas();
  // Minhas responsabilidades: ferramentas da administração (só o administrador) e as das funções da pessoa.
  const adm = me.nivel === 'administrador', fn = me.funcoes || [];
  const minhas = tabs.filter(t => t[3] === 4 || (typeof t[4] === 'string' && fn.includes(t[4])) || (typeof t[4] === 'function' && !adm));
  const pend = me.nivel === 'administrador' ? db.get('users', []).filter(u => (u.status || 'aprovado') === 'pendente').length : 0;
  const prox = DOC ? DOC.eventos(db, hoje(), somaDias(hoje(), 14)).length : 0;
  tela.innerHTML = `<header class="topo topo-ola"><p>Olá, ${esc(primeiro(me.nome))}!</p><h1>O que você quer fazer?</h1></header>${aviso()}
  <main>
    <h2>Para toda a equipe</h2>
    <div class="grade">
      ${botao('#agenda', 'fa-calendar-alt', 'Avisos e agenda', prox ? `<b class="selo">${prox}</b>` : '')}
      ${botao('#biblioteca', 'fa-book-reader', 'Biblioteca')}
      ${tabs.some(t => t[0] === 'atividades') ? botao(ferramenta('atividades'), 'fa-calendar-check', 'Atividades') : ''}
      ${tabs.some(t => t[0] === 'reuniao') ? botao(ferramenta('reuniao'), 'fa-users', 'Reunião de Escola') : ''}
    </div>
    ${minhas.length ? `<h2>Minhas responsabilidades</h2><div class="lista">${minhas.map(t => `<a class="linha" href="${ferramenta(t[0])}"><i class="fas ${t[1]}" aria-hidden="true"></i><span>${esc(t[2])}</span>${t[0] === 'users' && pend ? `<b class="selo">${pend}</b>` : ''}<i class="fas fa-chevron-right seta" aria-hidden="true"></i></a>`).join('')}</div>` : ''}
    <a class="bt bt-claro" href="#areas"><i class="fas fa-th-large" aria-hidden="true"></i> Ver todas as áreas</a>
    <button type="button" class="bt bt-texto" id="sair">Sair do app</button>
  </main>`;
  $('#sair').onclick = async () => { try { if (D.estadoSync().pendentes) await D.sincronizar(); } catch (e) { /* segue */ } await SB.sair(); sessionStorage.removeItem('pr_sess'); history.replaceState(null, '', location.pathname + location.search); location.reload(); };
}

/* ---------- Avisos e agenda ---------- */
function agenda() {
  document.title = 'Avisos e agenda · CONecta Retiro';
  const h = hoje(), l = DOC ? DOC.eventos(db, h, somaDias(h, 90)) : [];
  let mesAtual = '';
  const itens = l.map(e => {
    const d = new Date(e.data + 'T12:00:00'), m = MES[d.getMonth()] + ' de ' + d.getFullYear();
    const cab = m !== mesAtual ? `<h2>${m.charAt(0).toUpperCase() + m.slice(1)}</h2>` : ''; mesAtual = m;
    const fim = e.fim && e.fim !== e.data ? ` até ${e.fim.slice(8, 10)}/${e.fim.slice(5, 7)}` : '';
    return cab + `<article class="evento${e.data === h ? ' hoje' : ''}"><div class="dia"><b>${d.getDate()}</b><small>${SEM[d.getDay()].slice(0, 3)}</small></div>
      <div><h3>${esc(e.titulo)}</h3><p>${e.data === h ? '<b>Hoje</b> · ' : ''}${esc([e.hora, e.local].filter(Boolean).join(' · ') || (e.fixa ? 'Data anual do Parque' : ''))}${fim}</p>${e.descricao ? `<p class="desc">${esc(e.descricao)}</p>` : ''}</div></article>`;
  }).join('');
  tela.innerHTML = topo('Avisos e agenda', true) + aviso() + `<main>
    <p class="nota">Próximos 90 dias: datas do Parque, atividades e reuniões.</p>
    ${itens || '<p class="vazio">Nada marcado nos próximos 90 dias.</p>'}
    ${abas().some(t => t[0] === 'documentos') ? `<a class="bt bt-claro" href="${ferramenta('documentos')}"><i class="fas fa-folder-open" aria-hidden="true"></i> Calendário completo</a>` : ''}
  </main>`;
}

/* ---------- Biblioteca ---------- */
function biblioteca() {
  document.title = 'Biblioteca · CONecta Retiro';
  const livros = db.get('livros', []), emp = db.get('emprest', []).filter(e => !e.devolvido);
  const meus = emp.filter(e => norm(e.nome) === norm(me.nome) || (e.email && norm(e.email) === norm(me.email)));
  const livro = id => livros.find(l => l.id === id) || { titulo: 'Livro' };
  const livres = l => Math.max(1, +l.exemplares || 1) - emp.filter(e => e.livro === l.id).length;
  const cart = l => `<article class="livro"><h3>${esc(l.titulo)}</h3><p>${esc(l.autor || '')}</p><p>${livres(l) > 0 ? '<span class="tag tag-ok">Disponível</span>' : '<span class="tag tag-ocupado">Emprestado</span>'}${l.local ? ' · ' + esc(l.local) : ''}</p></article>`;
  tela.innerHTML = topo('Biblioteca', true) + aviso() + `<main>
    <h2>Livros comigo</h2>
    ${meus.length ? meus.map(e => `<article class="livro"><h3>${esc(livro(e.livro).titulo)}</h3><p>${e.prevista ? 'Devolver até <b>' + esc(e.prevista.split('-').reverse().join('/')) + '</b>' : 'Sem data de devolução'}</p></article>`).join('') : '<p class="vazio">Nenhum livro com você.</p>'}
    <h2>Procurar um livro</h2>
    <label for="bb" class="oculto">Título ou autor</label><input id="bb" type="search" placeholder="Digite o título ou o autor" autocomplete="off">
    <div id="res"></div>
    ${abas().some(t => t[0] === 'acervo') ? `<a class="bt bt-claro" href="${ferramenta('acervo')}"><i class="fas fa-book" aria-hidden="true"></i> Biblioteca completa</a>` : ''}
  </main>`;
  const mostra = () => {
    const q = norm($('#bb').value), l = livros.filter(x => !q || norm(x.titulo + ' ' + (x.autor || '')).includes(q)).slice(0, 40);
    $('#res').innerHTML = l.length ? l.map(cart).join('') + (livros.length > 40 && !q ? '<p class="nota">Digite para encontrar outros livros.</p>' : '') : '<p class="vazio">Nenhum livro encontrado.</p>';
  };
  $('#bb').oninput = mostra; mostra();
}

/* ---------- Todas as áreas ---------- */
function areas() {
  document.title = 'Todas as áreas · CONecta Retiro';
  const tabs = abas(), grupos = (A ? A.AREAS : []).map(a => [a, tabs.filter(t => t[5] === a.id)]).filter(g => g[1].length);
  tela.innerHTML = topo('Todas as áreas', true) + aviso() + `<main>
    ${grupos.map(([a, l]) => `<h2><i class="fas ${a.icone}" aria-hidden="true"></i> ${esc(a.nome)}</h2><div class="lista">${l.map(t => `<a class="linha" href="${ferramenta(t[0])}"><i class="fas ${t[1]}" aria-hidden="true"></i><span>${esc(t[2])}</span><i class="fas fa-chevron-right seta" aria-hidden="true"></i></a>`).join('')}</div>`).join('')}
  </main>`;
}

/* ---------- roteiro ---------- */
const TELAS = { inicio, agenda, biblioteca, areas };
function rota() {
  if (!SB || !D || D.modo !== 'supabase') { tela.innerHTML = '<main class="entrar"><h1>CONecta Retiro</h1><p class="faixa faixa-alerta">O app precisa do servidor do Parque. Abra pelo endereço oficial do site.</p></main>'; return; }
  const s = SB.sessao(), est = D.estadoSync();
  if (!s || est.estado === 'sem-sessao') return entrar();
  if (est.estado === 'offline' && !db.get('users', []).length) return entrar('Não foi possível falar com o servidor. Confira a internet e tente de novo.');
  me = db.get('users', []).find(u => u.email === s.user.email);
  if (!me || (me.status || 'aprovado') !== 'aprovado') { SB.sair(); return entrar('Seu cadastro ainda aguarda a aprovação da comissão do Parque Retiro.'); }
  sessionStorage.setItem('pr_sess', me.email);
  const k = location.hash.slice(1);
  (TELAS[k] || inicio)();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', rota);
rota();
})();
