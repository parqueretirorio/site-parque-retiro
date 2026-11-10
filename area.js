// Área restrita, login e biblioteca. Dados salvos no navegador (localStorage).
(function () {
const NIV = { leitor: 1, comentador: 2, editor: 3, administrador: 4 };
const NIVN = { leitor: 'Leitor', comentador: 'Comentador', editor: 'Editor', administrador: 'Administrador' };
const FUNC = { reservas: 'Responsável de Reservas', estela: 'Responsável pela Estela', album: 'Responsável pelo Álbum Parque Retiro', inventario: 'Responsável pelo Inventário', financeiro: 'Responsável Financeiro (Prestação de Contas e Compras)', compras: 'Departamento de Compras (cotações e registro das compras)', solicitante: 'Solicitante de compras (faz pedidos de compra)', documentos: 'Responsável pelos Documentos e Calendários', comunicacao: 'Responsável pela Comunicação, Redes Sociais e Site', lojinha: 'Responsável pela Lojinha', rifa: 'Responsável pela Rifa Solidária', vaquinha: 'Responsável pela Vaquinha Coletiva', voluntario: 'Responsável pelos Voluntários', jardinagem: 'Responsável pela Jardinagem / Área Externa', atividades: 'Responsável pelas Atividades', multiuso: 'Responsável pelo Multiuso', construcao: 'Responsável pela Construção', manutencao: 'Responsável pela Manutenção', traducoes: 'Responsável pelas Traduções', ajuda: 'Responsável pela Central de Ajuda' };
const tem = (me, f) => me.nivel === 'administrador' || (me.funcoes || []).includes(f);
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const db = (window.PR_DADOS && window.PR_DADOS.db) || { // dados.js (auditoria, lixeira, backup); este bloco é só reserva
  get(k, d) { try { const v = localStorage.getItem('pr_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('pr_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const brl = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtData = d => d ? d.split('-').reverse().join('/') : '';
/* Cadastro mínimo de pessoas (Nome completo, WhatsApp e e-mail) e autorização LGPD. Texto em rascunho até haver encarregado e advogado. */
const LGPD_VERSAO = 'rascunho-1';
const nomeCompletoOk = n => String(n || '').trim().split(/\s+/).filter(p => p.replace(/[^A-Za-zÀ-ÿ]/g, '').length >= 2).length >= 2;
const zapDigitos = v => String(v || '').replace(/\D/g, '');
const zapOk = v => { const d = zapDigitos(v); return d.length >= 10 && d.length <= 13; };
const emailOk = e => /^\S+@\S+\.\S+$/.test(String(e || '').trim());
const cadastroIncompleto = u => !u || !nomeCompletoOk(u.nome) || !zapOk(u.whatsapp) || !emailOk(u.email) || !(u.lgpd && u.lgpd.aceite);
const lgpdBloco = (p) => `<fieldset class="funcoes" id="${p}-lgpd"><legend>Autorização LGPD</legend>
  <label><input type="checkbox" id="${p}-lgpd-ok"> Estou de acordo com o tratamento dos meus dados pessoais (nome completo, e-mail e WhatsApp) pelo Parque de Estudo e Reflexão Retiro, nos termos da LGPD (Lei 13.709/2018). *</label>
  <label><input type="checkbox" id="${p}-lgpd-img"> Autorizo o uso da minha imagem, voz, fotos e vídeos (atividades, Zoom, redes sociais e site do Parque). Opcional: posso revogar quando quiser.</label>
  <details><summary>Ler os termos</summary><div class="tip-box" role="note"><p><strong>Quem trata os dados:</strong> Instituto Pangeia (CNPJ 13.102.436/0001-33), mantenedor do Parque de Estudo e Reflexão Retiro.</p>
  <p><strong>Para quê:</strong> identificar você na área restrita, avisar sobre atividades, reuniões e reservas, e organizar o trabalho das comissões. Não vendemos nem cedemos dados.</p>
  <p><strong>Imagem e voz:</strong> só com a autorização opcional acima, separada da principal. Dados sensíveis (por exemplo, saúde ou convicção religiosa e filosófica) só são tratados com consentimento específico, pedido no ponto em que forem necessários.</p>
  <p><strong>Seus direitos:</strong> confirmar o tratamento, acessar, corrigir, pedir eliminação, revogar o consentimento e pedir informação sobre compartilhamento, por e-mail para parqueretirorio@gmail.com.</p>
  <p><em>Texto em revisão jurídica (${LGPD_VERSAO}).</em></p></div></details></fieldset>`;
const lgpdLe = p => ({ aceite: !!$('#' + p + '-lgpd-ok').checked, imagem: !!$('#' + p + '-lgpd-img').checked, em: new Date().toISOString(), versao: LGPD_VERSAO });
const safeUrl = u => /^https?:\/\//i.test(u) || /^data:(application|image)\//.test(u);

async function hash(p, salt) {
  if (window.crypto && crypto.subtle) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + p));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  let h = 0; const s = salt + p;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return 'f' + h;
}

/* ---------- Acervo ---------- */
const SEED = [
  { id: 'b1', titulo: 'Obras Completas - Vol. I', autor: 'Silo', local: 'Prateleira A1 - Parque', exemplares: 1, arquivo: 'http://www.silo.net', descricao: 'Coletânea que reúne Humanizar a Terra, O Olhar Interno, A Paisagem Interna e A Paisagem Humana. Leituras fundamentais de reflexão sobre a existência.' },
  { id: 'b2', titulo: 'Apontamentos de Psicologia', autor: 'Silo', local: 'Prateleira A2 - Parque', exemplares: 1, descricao: 'Estudo sobre a mente, a função da imagem na ação humana, a consciência e o espaço de representação para a auto-observação.' },
  { id: 'b3', titulo: 'Fala de Silo', autor: 'Silo', local: 'Prateleira B1 - Parque', exemplares: 1, descricao: 'Compilado dos discursos, apresentações e intervenções públicas pronunciadas em encontros e Parques pelo mundo.' },
  { id: 'b5', titulo: 'Dicionário do Novo Humanismo', autor: 'Vários Autores', local: '', exemplares: 1, emp0: 'Não informado', descricao: '' },
  { id: 'b4', titulo: 'Investigações sobre a Consciência Inspirada', autor: 'Centro de Estudos Parque La Reja / Luis Milani', local: '', exemplares: 1, descricao: 'Estudo de campo sobre a consciência inspirada em momentos de convergência psicossocial.' }
];
const hoje = () => new Date().toISOString().slice(0, 10);
function livros() {
  if (!db.get('seed3', false)) {
    const ex = db.get('livros', []), ids = new Set(ex.map(l => l.id)), lo = db.get('emprest', []);
    const falt = SEED.filter(x => !ids.has(x.id));
    falt.forEach(x => { if (x.emp0) lo.push({ id: uid(), livro: x.id, nome: x.emp0, saida: hoje(), prevista: '', devolvido: '' }); });
    const all = ex.concat(falt.map(x => { const r = { ...x }; delete r.emp0; return r; }));
    if (db.set('livros', all) && db.set('emprest', lo)) db.set('seed3', true); else return all;
  }
  return db.get('livros', SEED);
}
const emprest = () => db.get('emprest', []);
const exm = l => Math.max(1, +l.exemplares || 1);
const ativos = id => emprest().filter(e => e.livro === id && !e.devolvido);
const livre = l => exm(l) - ativos(l.id).length;
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const capaHtml = l => l.capa && /^data:image\//.test(l.capa)
  ? `<img class="book-cover" src="${esc(l.capa)}" alt="Capa de ${esc(l.titulo)}">`
  : `<div class="book-cover cover-ph" role="img" aria-label="Livro sem capa cadastrada"><i class="fas fa-book"></i><span>${esc(l.titulo)}</span></div>`;
function bookCard(l, o) {
  o = o || {};
  const link = l.arquivo && safeUrl(l.arquivo) ? `<a class="btn-visit" href="${esc(l.arquivo)}" target="_blank" rel="noopener">Acessar leitura</a>` : '';
  const loc = `<span class="badge-disponivel"><i class="fas fa-map-marker-alt"></i> ${esc(l.local || 'Localização a definir')}</span>`;
  const n = livre(l);
  const disp = o.live ? (n > 0 ? `<span class="badge-disponivel">Disponível (${n} de ${exm(l)})</span>` : '<span class="badge-emprestado">Emprestado</span>') : '';
  return `<div class="book-card">${capaHtml(l)}<div class="book-info"><div class="book-title">${esc(l.titulo)}</div><div class="book-author">${esc(l.autor)}</div><div class="book-desc">${esc(l.descricao)}</div><div class="badges">${loc}${disp}</div>${link}${o.extra || ''}</div></div>`;
}
function bookMini(l) {
  const img = l.capa && /^data:image\//.test(l.capa) ? `<img class="book-cover-small" src="${esc(l.capa)}" alt="Capa de ${esc(l.titulo)}">` : `<div class="book-cover-small cover-ph-mini" role="img" aria-label="Livro sem capa cadastrada"><i class="fas fa-book"></i></div>`;
  return `<div class="book-item-mini">${img}<div class="book-details-mini"><h3 class="book-title-mini">${esc(l.titulo)}</h3></div></div>`;
}
const reduz = (file, max = 360, q = 0.8) => new Promise((ok, no) => {
  const u = URL.createObjectURL(file), im = new Image();
  im.onload = () => { const k = Math.min(1, max / im.width), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg', q)); };
  im.onerror = () => { URL.revokeObjectURL(u); no(); };
  im.src = u;
});
const csv = rows => rows.map(r => r.map(c => { c = String(c == null ? '' : c); if (/^[=+\-@\t\r]/.test(c)) c = "'" + c; return '"' + c.replace(/"/g, '""') + '"'; }).join(';')).join('\r\n');

/* ---------- Abas do painel ---------- */
const V = {};
const consultaAcervo = (me, root) => {
  root.innerHTML = `<h3><i class="fas fa-book-reader"></i> Biblioteca do Parque</h3><p>Busque livros do acervo do Parque.</p>
  <div class="form-row"><label for="q">Buscar por título, autor ou localização</label><input id="q" type="search" placeholder="Ex.: Silo, Prateleira A1"></div>
  <p id="qn" class="vazio" aria-live="polite"></p><div class="book-list-compact" id="grid"></div>`;
  const draw = () => {
    const q = norm($('#q', root).value.trim());
    const ls = livros().filter(l => !q || norm([l.titulo, l.autor, l.local, l.descricao].join(' ')).includes(q));
    $('#qn', root).textContent = ls.length ? ls.length + ' livro(s) encontrado(s).' : 'Nenhum livro encontrado.';
    $('#grid', root).innerHTML = ls.map(bookMini).join('');
  };
  $('#q', root).oninput = draw;
  draw();
};

V.gestao = (me, root) => {
  let sub = 'cad', editId = null;
  const SUB = [['cad', 'Cadastro e edição'], ['emp', 'Empréstimos e devoluções'], ['rel', 'Relatórios']];
  const nomeLivro = id => (livros().find(l => l.id === id) || { titulo: '(livro removido)' }).titulo;

  const cad = el => {
    const ed = editId ? livros().find(l => l.id === editId) : null;
    const v = ed || { titulo: '', autor: '', local: '', exemplares: 1, descricao: '', arquivo: '' };
    el.innerHTML = `<h3><i class="fas fa-book"></i> ${ed ? 'Editar livro do acervo' : 'Cadastrar livro do acervo físico'}</h3>
    <form id="fl" class="form-reserva" novalidate>
      <div class="form-row"><label for="g-t">Título do livro *</label><input id="g-t" required value="${esc(v.titulo)}" placeholder="Digite o título da obra"></div>
      <div class="form-row"><label for="g-a">Autor *</label><input id="g-a" required value="${esc(v.autor)}" placeholder="Nome do autor"></div>
      ${ed ? '' : '<div class="form-row"><label for="g-s">Status inicial *</label><select id="g-s"><option value="Disponível">Disponível</option><option value="Empréstimo">Empréstimo</option></select></div><div class="form-row" id="g-qw" hidden><label for="g-q">Em poder de *</label><input id="g-q" maxlength="80"></div>'}
      <div class="form-row"><label for="g-l">Localização física no Parque *</label><input id="g-l" required value="${esc(v.local)}" placeholder="Ex.: Estante B - Prateleira 2"></div>
      <div class="form-row"><label for="g-n">Número de exemplares *</label><input id="g-n" type="number" min="1" max="99" value="${exm(v)}" required></div>
      <div class="form-row"><label for="g-d">Resumo / sinopse</label><textarea id="g-d" rows="3" placeholder="Breve descrição da obra para a área pública...">${esc(v.descricao)}</textarea></div>
      <div class="form-row"><label for="g-c">Foto da capa${ed && v.capa ? ' (deixe vazio para manter a atual)' : ''}</label><input id="g-c" type="file" accept="image/png,image/jpeg,image/webp"></div>
      <div class="form-row"><label for="g-u">Link para leitura (opcional)</label><input id="g-u" type="url" value="${esc(v.arquivo)}" placeholder="https://"></div>
      <p class="form-erro" id="g-e" role="alert" hidden></p>
      <button class="btn-visit btn-large"><i class="fas ${ed ? 'fa-save' : 'fa-plus-circle'}"></i> ${ed ? 'Salvar alterações' : 'Cadastrar livro'}</button>
      ${ed ? '<button type="button" class="btn-visit btn-large" id="g-x" style="background:#6c7a7b;margin-left:8px">Cancelar edição</button>' : ''}
    </form>
    <h4>Acervo cadastrado</h4>
    <table class="doc-table"><thead><tr><th>Título</th><th>Autor</th><th>Localização</th><th>Exemplares</th><th></th></tr></thead><tbody>${livros().map(l => `<tr><td>${esc(l.titulo)}</td><td>${esc(l.autor)}</td><td>${esc(l.local || '-')}</td><td>${exm(l)}</td><td><button class="icon-btn" data-ed="${l.id}" aria-label="Editar ${esc(l.titulo)}"><i class="fas fa-edit" style="color:var(--accent-color)"></i></button><button class="icon-btn" data-del="${l.id}" aria-label="Excluir ${esc(l.titulo)}"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table>`;
    el.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { editId = b.dataset.ed; draw(); window.scrollTo(0, 0); });
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      if (ativos(b.dataset.del).length) return alert('Este livro tem empréstimo em aberto. Registre a devolução antes de excluir.');
      if (!confirm('Excluir este livro do acervo?')) return;
      db.set('livros', livros().filter(l => l.id !== b.dataset.del)); draw();
    });
    const gs = $('#g-s', el); if (gs) gs.onchange = () => { $('#g-qw', el).hidden = gs.value !== 'Empréstimo'; };
    const x = $('#g-x', el); if (x) x.onclick = () => { editId = null; draw(); };
    $('#fl', el).onsubmit = async e => {
      e.preventDefault();
      const er = $('#g-e', el), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
      const t = $('#g-t').value.trim(), a = $('#g-a').value.trim(), lo = $('#g-l').value.trim(), n = parseInt($('#g-n').value, 10), url = $('#g-u').value.trim(), file = $('#g-c').files[0];
      if (!t || !a || !lo) return falha('Preencha título, autor e localização física.');
      if (!(n >= 1)) return falha('Informe ao menos 1 exemplar.');
      if (url && !/^https?:\/\//i.test(url)) return falha('O link deve começar com http:// ou https://');
      if (ed && n < ativos(ed.id).length) return falha('Há mais exemplares emprestados do que o número informado.');
      const emprestado = !ed && $('#g-s').value === 'Empréstimo', quem = emprestado ? $('#g-q').value.trim() : '';
      if (emprestado && !quem) return falha('Informe com quem o livro está emprestado.');
      let capa = ed ? ed.capa : '';
      if (file) { try { capa = await reduz(file); } catch (x2) { return falha('Não foi possível ler a imagem da capa.'); } }
      const ls = livros(), dados = { titulo: t, autor: a, local: lo, exemplares: n, descricao: $('#g-d').value.trim(), arquivo: url, capa };
      const novoId = uid();
      if (ed) Object.assign(ls.find(l => l.id === ed.id), dados); else ls.push({ id: novoId, ...dados, por: me.nome, data: hoje() });
      if (emprestado) { const lo = emprest(); lo.push({ id: uid(), livro: novoId, nome: quem, saida: hoje(), prevista: '', devolvido: '' }); db.set('emprest', lo); }
      if (!db.set('livros', ls)) return falha('Sem espaço no navegador. Use uma capa menor ou remova livros antigos.');
      editId = null; draw();
    };
  };

  const emp = el => {
    const ls = livros(), disp = ls.filter(l => livre(l) > 0), es = emprest();
    const abertos = es.filter(e => !e.devolvido).sort((a, b) => (a.prevista || '9').localeCompare(b.prevista || '9'));
    const fechados = es.filter(e => e.devolvido).sort((a, b) => b.devolvido.localeCompare(a.devolvido)).slice(0, 15);
    el.innerHTML = `<h3><i class="fas fa-exchange-alt"></i> Empréstimos e devoluções</h3>` + (disp.length ? `<form id="fe" class="form-reserva" novalidate>
      <div class="form-row"><label for="m-l">Livro *</label><select id="m-l">${disp.map(l => `<option value="${l.id}">${esc(l.titulo)} (${livre(l)} disponível)</option>`).join('')}</select></div>
      <div class="form-row"><label for="m-n">Nome de quem retira *</label><input id="m-n" maxlength="80" required></div>
      <div class="form-row"><label for="m-s">Data da retirada *</label><input id="m-s" type="date" value="${hoje()}" required></div>
      <div class="form-row"><label for="m-p">Devolução prevista</label><input id="m-p" type="date"></div>
      <p class="form-erro" id="m-e" role="alert" hidden></p><button class="btn-visit btn-large"><i class="fas fa-hand-holding"></i> Registrar empréstimo</button></form>` : '<p class="vazio">Nenhum exemplar disponível para empréstimo.</p>') +
      `<h4>Empréstimos em aberto</h4>` + (abertos.length ? `<table class="doc-table"><thead><tr><th>Livro</th><th>Retirado por</th><th>Retirada</th><th>Prevista</th><th></th></tr></thead><tbody>${abertos.map(e => { const at = e.prevista && e.prevista < hoje(); return `<tr><td>${esc(nomeLivro(e.livro))}</td><td>${esc(e.nome)}</td><td>${fmtData(e.saida)}</td><td>${e.prevista ? fmtData(e.prevista) : '-'}${at ? ' <span class="badge-emprestado">Atrasado</span>' : ''}</td><td><button class="btn-visit" data-dev="${e.id}">Registrar devolução</button></td></tr>`; }).join('')}</tbody></table>` : '<p class="vazio">Nenhum empréstimo em aberto.</p>') +
      `<h4>Últimas devoluções</h4>` + (fechados.length ? `<table class="doc-table"><thead><tr><th>Livro</th><th>Retirado por</th><th>Retirada</th><th>Devolvido em</th></tr></thead><tbody>${fechados.map(e => `<tr><td>${esc(nomeLivro(e.livro))}</td><td>${esc(e.nome)}</td><td>${fmtData(e.saida)}</td><td>${fmtData(e.devolvido)}</td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhuma devolução registrada.</p>');
    el.querySelectorAll('[data-dev]').forEach(b => b.onclick = () => { const l = emprest(); l.find(e => e.id === b.dataset.dev).devolvido = hoje(); db.set('emprest', l); draw(); });
    const f = $('#fe', el);
    if (f) f.onsubmit = e => {
      e.preventDefault();
      const n = $('#m-n').value.trim(), s = $('#m-s').value, p = $('#m-p').value, er = $('#m-e');
      if (!n || !s) { er.textContent = 'Informe o nome e a data da retirada.'; er.hidden = false; return; }
      if (p && p < s) { er.textContent = 'A devolução prevista não pode ser antes da retirada.'; er.hidden = false; return; }
      const l = emprest(); l.push({ id: uid(), livro: $('#m-l').value, nome: n, saida: s, prevista: p, devolvido: '' }); db.set('emprest', l); draw();
    };
  };

  const rel = el => {
    const ls = livros(), es = emprest(), ab = es.filter(e => !e.devolvido), at = ab.filter(e => e.prevista && e.prevista < hoje());
    const tot = ls.reduce((s, l) => s + exm(l), 0), em = ls.reduce((s, l) => s + ativos(l.id).length, 0);
    el.innerHTML = `<h3><i class="fas fa-chart-bar"></i> Relatório consolidado do acervo</h3><p>Posição em ${fmtData(hoje())}.</p>
    <div class="totais"><div><span>Títulos</span><strong>${ls.length}</strong></div><div><span>Exemplares</span><strong>${tot}</strong></div><div><span>Emprestados</span><strong>${em}</strong></div><div><span>Disponíveis</span><strong>${tot - em}</strong></div><div><span>Atrasados</span><strong>${at.length}</strong></div><div><span>Empréstimos no total</span><strong>${es.length}</strong></div></div>
    <p><button class="btn-visit" id="r-p"><i class="fas fa-print"></i> Imprimir relatório</button> <button class="btn-visit" id="r-c"><i class="fas fa-file-csv"></i> Baixar empréstimos (CSV)</button></p>
    <h4>Situação por livro</h4><table class="doc-table"><thead><tr><th>Título</th><th>Localização</th><th>Exemplares</th><th>Emprestados</th><th>Disponíveis</th><th>Empréstimos (histórico)</th></tr></thead><tbody>${ls.map(l => `<tr><td>${esc(l.titulo)}</td><td>${esc(l.local || '-')}</td><td>${exm(l)}</td><td>${ativos(l.id).length}</td><td>${livre(l)}</td><td>${es.filter(e => e.livro === l.id).length}</td></tr>`).join('')}</tbody></table>
    <h4>Devoluções atrasadas</h4>${at.length ? `<table class="doc-table"><thead><tr><th>Livro</th><th>Retirado por</th><th>Prevista</th></tr></thead><tbody>${at.map(e => `<tr><td>${esc(nomeLivro(e.livro))}</td><td>${esc(e.nome)}</td><td>${fmtData(e.prevista)}</td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhuma devolução atrasada.</p>'}`;
    $('#r-p', el).onclick = () => window.print();
    $('#r-c', el).onclick = () => {
      const rows = [['Livro', 'Localização', 'Retirado por', 'Retirada', 'Prevista', 'Devolução', 'Situação']].concat(es.map(e => { const l = ls.find(x => x.id === e.livro) || {}; return [nomeLivro(e.livro), l.local || '', e.nome, e.saida, e.prevista, e.devolvido, e.devolvido ? 'Devolvido' : (e.prevista && e.prevista < hoje() ? 'Atrasado' : 'Em aberto')]; }));
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = 'emprestimos-biblioteca.csv'; a.click();
    };
  };

  const draw = () => {
    root.innerHTML = `<div class="tabs sub" role="tablist">${SUB.map(t => `<button class="tab-btn${t[0] === sub ? ' active' : ''}" data-s="${t[0]}">${t[1]}</button>`).join('')}</div><div id="sub"></div>`;
    root.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sub = b.dataset.s; editId = null; draw(); });
    ({ cad, emp, rel })[sub]($('#sub', root));
  };
  draw();
};

/* ---------- Biblioteca: consulta do acervo, Gestão do Acervo e Livraria (sub-abas) ---------- */
V.acervo = (me, root) => {
  const n = NIV[me.nivel];
  const SUB = [['consulta', 'fa-book-reader', 'Consulta do acervo', 1], ['gestao', 'fa-book-medical', 'Gestão do Acervo', 3], ['livraria', 'fa-store', 'Livraria', 3]].filter(t => n >= t[3]);
  if (SUB.length < 2) { consultaAcervo(me, root); return; }
  let sub = 'consulta';
  const draw = () => {
    root.innerHTML = `<div class="tabs sub" role="tablist" aria-label="Biblioteca">${SUB.map(t => `<button class="tab-btn${t[0] === sub ? ' active' : ''}" role="tab" aria-selected="${t[0] === sub}" data-bs="${t[0]}"><i class="fas ${t[1]}"></i> ${t[2]}</button>`).join('')}</div><div id="bib-sub"></div>`;
    root.querySelectorAll('[data-bs]').forEach(b => b.onclick = () => { sub = b.dataset.bs; draw(); });
    ({ consulta: consultaAcervo, gestao: V.gestao, livraria: V.livraria })[sub](me, $('#bib-sub', root));
  };
  draw();
};

/* ---------- Livraria (gestão das vendas de livros; a loja pública fica em "Ajude o Parque") ---------- */
const lvItens = () => db.get('livraria_itens', []);
const lvVendas = () => db.get('livraria_vendas', []);
V.livraria = (me, root) => {
  let sub = 'est', editId = null, msg = '';
  const adm = NIV[me.nivel] >= 4; // 'contas' é restrita ao administrador
  const SUB = [['est', 'Catálogo e estoque'], ['venda', 'Registrar venda'], ['rel', 'Vendas e relatório']].concat(adm ? [['enc', 'Pré-lançamento e encomendas']] : []);
  const brlv = v => money(v, 'PIX');
  const aviso = () => msg ? `<p class="tip-box" role="status">${esc(msg)}</p>` : '';
  const lancaConta = v => {
    const cs = db.get('contas', []), id = uid();
    cs.push({ id, data: v.data, desc: `Venda de livro: ${v.titulo} (${v.qtd}x)`, centro: 'Livraria e Lojinha', tipo: 'Entrada', origem: 'Livraria', vaquinha: '', valor: v.total, moeda: v.moeda, comp: '' });
    return db.set('contas', cs) ? id : '';
  };

  const enc = el => { if (!window.PR_ENCOMENDA) { el.innerHTML = '<p class="vazio">Não foi possível carregar o módulo de encomendas (arquivo encomenda.js).</p>'; return; } window.PR_ENCOMENDA.painel(me, el, ajudaModulos()); };
  const encsDe = id => db.get('livraria_enc', []).filter(e => e.livro === id && !e.cancelado);
  const est = el => {
    const ed = editId ? lvItens().find(i => i.id === editId) : null;
    const v = ed || { titulo: '', autor: '', preco: '', estoque: 0, obs: '' };
    const usuarios = db.get('users', []).filter(u => statusDe(u) === 'aprovado' && u.email);
    const vend = id => lvVendas().filter(s => s.item === id).reduce((t, s) => t + s.qtd, 0);
    el.innerHTML = `<h3><i class="fas fa-store"></i> ${ed ? 'Editar livro da livraria' : 'Cadastrar livro para venda'}</h3>
    <p>Livros à venda na Livraria do Parque (a loja continua aparecendo na página pública "Ajude o Parque"). O estoque da livraria é separado do acervo de empréstimo da Biblioteca.</p>${aviso()}
    <form id="fli" class="form-reserva" novalidate>
      <div class="form-row"><label for="l-t">Título *</label><input id="l-t" required maxlength="120" value="${esc(v.titulo)}"></div>
      <div class="form-row"><label for="l-a">Autor</label><input id="l-a" maxlength="120" value="${esc(v.autor)}"></div>
      <div class="form-row"><label for="l-p">Preço de venda (R$) *</label><input id="l-p" type="number" min="0" step="0.01" required value="${v.preco === '' ? '' : esc(v.preco)}" placeholder="0,00"></div>
      <div class="form-row"><label for="l-e">${ed ? 'Estoque atual (exemplares)' : 'Exemplares em estoque'} *</label><input id="l-e" type="number" min="0" max="9999" step="1" required value="${esc(v.estoque)}">${adm ? '<small>Em pré-lançamento, deixe 0: o estoque é informado ao lançar o livro.</small>' : ''}</div>
      <div class="form-row"><label for="l-o">Observações</label><input id="l-o" maxlength="160" value="${esc(v.obs)}" placeholder="Ex.: edição, origem do lote, local do estoque"></div>
      ${adm ? `<fieldset class="funcoes"><legend>Pré-lançamento e encomendas</legend>
        <div class="form-row"><label><input type="checkbox" id="l-pre"${v.pre ? ' checked' : ''}> Livro em pré-lançamento (aceita encomendas antecipadas, por ordem de chegada e sem limite)</label></div>
        <div id="l-prebox"${v.pre ? '' : ' hidden'}>
          <div class="form-row"><label for="l-pd">Lançamento previsto *</label><input id="l-pd" type="date" value="${esc(v.preData || '')}"></div>
          <div class="form-row"><label for="l-pp">Preço de pré-venda (R$) *</label><input id="l-pp" type="number" min="0" step="0.01" value="${v.prePreco === undefined || v.prePreco === '' ? '' : esc(v.prePreco)}" placeholder="0,00"><small>O preço de venda acima passa a valer depois do lançamento.</small></div>
          <div class="form-row"><label for="l-pz">Encomendar pelo site até (opcional)</label><input id="l-pz" type="date" value="${esc(v.prePrazo || '')}"></div>
          <div class="form-row"><label for="l-pt">Frase curta para o convite (opcional)</label><input id="l-pt" maxlength="200" value="${esc(v.preTexto || '')}" placeholder="Ex.: Nova edição revista, com prefácio inédito"></div>
          <div class="form-row"><label for="l-pr">Responsável temporário pelo lançamento</label><select id="l-pr"><option value="">— nenhum —</option>${usuarios.map(u => `<option value="${esc(u.email)}"${u.email === v.preResp ? ' selected' : ''}>${esc(u.nome)} (${esc(u.email)})</option>`).join('')}</select><small>Essa pessoa vê e trabalha as encomendas deste livro (registrar pagamento, entregar, gerar convite) e pode lançar o livro. Não altera o catálogo.</small></div>
          <div class="form-row"><label for="l-pa">Responsável até (data final, opcional)</label><input id="l-pa" type="date" value="${esc(v.preRespAte || '')}"><small>Depois dessa data o acesso dele a este livro termina sozinho.</small></div>
        </div></fieldset>` : (v.pre ? `<p class="tip-box" role="note">Este livro está em pré-lançamento (previsto ${esc(fmtData(v.preData))}). Só o Administrador altera essa marcação.</p>` : '')}
      <p class="form-erro" id="l-er" role="alert" hidden></p>
      <button class="btn-visit btn-large"><i class="fas ${ed ? 'fa-save' : 'fa-plus-circle'}"></i> ${ed ? 'Salvar alterações' : 'Cadastrar livro'}</button>
      ${ed ? '<button type="button" class="btn-visit btn-large" id="l-x" style="background:#6c7a7b;margin-left:8px">Cancelar edição</button>' : ''}
    </form>
    <h4>Catálogo da livraria</h4>${lvItens().length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Título</th><th>Autor</th><th>Preço</th><th>Estoque</th><th>Vendidos</th><th></th></tr></thead><tbody>${lvItens().map(i => `<tr><td>${esc(i.titulo)}${i.pre ? `<br><span class="badge st-pendente">Pré-lançamento</span> <small>${esc(fmtData(i.preData))} · pré-venda ${brlv(i.prePreco)} · ${encsDe(i.id).length} encomenda(s)</small>` : ''}</td><td>${esc(i.autor || '-')}</td><td>${brlv(i.preco)}</td><td>${i.pre ? '<small>a informar no lançamento</small>' : (i.estoque > 0 ? i.estoque : '<span class="badge-emprestado">Esgotado</span>')}</td><td>${vend(i.id)}</td><td><button class="icon-btn" data-ed="${i.id}" aria-label="Editar ${esc(i.titulo)}"><i class="fas fa-edit"></i></button> <button class="icon-btn" data-del="${i.id}" aria-label="Excluir ${esc(i.titulo)}"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table></div>` : '<p class="vazio">Nenhum livro cadastrado na livraria.</p>'}`;
    msg = '';
    el.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { editId = b.dataset.ed; draw(); window.scrollTo(0, 0); });
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      if (db.get('livraria_enc', []).some(e => e.livro === b.dataset.del)) { msg = 'Este livro tem encomendas registradas. Para manter o histórico, não é possível excluir.'; draw(); return; }
      if (lvVendas().some(s => s.item === b.dataset.del)) { msg = 'Este livro já tem vendas registradas. Para manter o histórico, zere o estoque em vez de excluir.'; draw(); return; }
      if (!confirm('Excluir este livro do catálogo da livraria?')) return;
      db.set('livraria_itens', lvItens().filter(i => i.id !== b.dataset.del)); draw();
    });
    const x = $('#l-x', el); if (x) x.onclick = () => { editId = null; draw(); };
    const cp = $('#l-pre', el); if (cp) cp.onchange = () => { $('#l-prebox', el).hidden = !cp.checked; };
    $('#fli', el).onsubmit = e => {
      e.preventDefault();
      const er = $('#l-er', el), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
      const t = $('#l-t', el).value.trim(), p = parseFloat($('#l-p', el).value), q = parseInt($('#l-e', el).value, 10);
      if (!t) return falha('Informe o título.');
      if (!(p >= 0)) return falha('Informe o preço de venda.');
      if (!(q >= 0)) return falha('Informe o estoque (0 ou mais).');
      const ls = lvItens(), dados = { titulo: t, autor: $('#l-a', el).value.trim(), preco: Math.round(p * 100) / 100, estoque: q, obs: $('#l-o', el).value.trim() };
      if (adm) {
        const pre = $('#l-pre', el).checked;
        if (pre) {
          const pd = $('#l-pd', el).value, pp = $('#l-pp', el).value, pz = $('#l-pz', el).value, pa = $('#l-pa', el).value, pr = $('#l-pr', el).value;
          if (!pd) return falha('Informe o lançamento previsto.');
          if (pp === '' || !(parseFloat(pp) >= 0)) return falha('Informe o preço de pré-venda.');
          if (pz && pz > pd) return falha('O prazo das encomendas não pode ser depois do lançamento previsto.');
          if (pa && !pr) return falha('Escolha o responsável temporário ou apague a data final.');
          Object.assign(dados, { pre: true, preData: pd, prePreco: Math.round(parseFloat(pp) * 100) / 100, prePrazo: pz, preTexto: $('#l-pt', el).value.trim(), preResp: pr, preRespNome: pr ? ((usuarios.find(u => u.email === pr) || {}).nome || pr) : '', preRespAte: pr ? pa : '' });
          if (ed && !ed.pre) { dados.lancadoEm = ''; dados.lancEstoque = null; }
        } else if (ed && ed.pre) {
          if (encsDe(ed.id).length) return falha('Este livro tem ' + encsDe(ed.id).length + ' encomenda(s) ativa(s). Use "Lançar o livro" na aba Pré-lançamento e encomendas, ou cancele as encomendas antes de tirar a marcação.');
          dados.pre = false;
        }
      }
      if (ed) Object.assign(ls.find(i => i.id === ed.id), dados); else ls.push({ id: uid(), ...dados, por: me.nome, data: hoje() });
      if (!db.set('livraria_itens', ls)) return falha('Não foi possível salvar neste navegador.');
      editId = null; draw();
    };
  };

  const venda = el => {
    const disp = lvItens().filter(i => i.estoque > 0 && !i.pre);
    el.innerHTML = `<h3><i class="fas fa-cash-register"></i> Registrar venda</h3>${aviso()}` + (disp.length ? `<form id="flv" class="form-reserva" novalidate>
      <div class="form-row"><label for="v-i">Livro *</label><select id="v-i">${disp.map(i => `<option value="${i.id}">${esc(i.titulo)} (${brlv(i.preco)} - ${i.estoque} em estoque)</option>`).join('')}</select></div>
      <div class="form-row"><label for="v-q">Quantidade *</label><input id="v-q" type="number" min="1" step="1" value="1" required></div>
      <div class="form-row"><label for="v-p">Preço unitário (R$) *</label><input id="v-p" type="number" min="0" step="0.01" required></div>
      <div class="form-row"><label for="v-m">Forma de pagamento *</label><select id="v-m">${Object.entries(MOEDA).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></div>
      <div class="form-row"><label for="v-d">Data *</label><input id="v-d" type="date" value="${hoje()}" required></div>
      <div class="form-row"><label for="v-c">Comprador (opcional)</label><input id="v-c" maxlength="80"></div>
      ${adm ? '<div class="form-row"><label><input type="checkbox" id="v-l" checked> Lançar a entrada em Prestação de Contas (centro Livraria e Lojinha, origem Livraria)</label></div>' : '<p class="vazio">O lançamento financeiro desta venda é feito pelo Administrador, na aba Vendas e relatório.</p>'}
      <p id="v-tot" aria-live="polite"><strong></strong></p>
      <p class="form-erro" id="v-er" role="alert" hidden></p>
      <button class="btn-visit btn-large"><i class="fas fa-check"></i> Registrar venda</button></form>` : '<p class="vazio">Nenhum livro com estoque. Cadastre ou reponha o estoque na aba Catálogo e estoque.</p>');
    const f = $('#flv', el); if (!f) return;
    const item = () => lvItens().find(i => i.id === $('#v-i', el).value);
    const tot = () => { const q = parseInt($('#v-q', el).value, 10), p = parseFloat($('#v-p', el).value); $('#v-tot strong', el).textContent = q > 0 && p >= 0 ? 'Total: ' + brlv(Math.round(q * p * 100) / 100) : ''; };
    $('#v-i', el).onchange = () => { $('#v-p', el).value = item().preco; tot(); };
    $('#v-q', el).oninput = $('#v-p', el).oninput = tot;
    $('#v-p', el).value = item().preco; tot();
    f.onsubmit = e => {
      e.preventDefault();
      const er = $('#v-er', el), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
      const it = item(), q = parseInt($('#v-q', el).value, 10), p = parseFloat($('#v-p', el).value), d = $('#v-d', el).value;
      if (!it) return falha('Selecione o livro.');
      if (!(q >= 1)) return falha('Informe a quantidade.');
      if (q > it.estoque) return falha('Só há ' + it.estoque + ' exemplar(es) em estoque.');
      if (!(p >= 0) || !d) return falha('Informe o preço e a data.');
      const v = { id: uid(), item: it.id, titulo: it.titulo, qtd: q, unit: Math.round(p * 100) / 100, total: Math.round(q * p * 100) / 100, moeda: $('#v-m', el).value, data: d, comprador: $('#v-c', el).value.trim(), por: me.nome, conta: '' };
      const itens = lvItens(); itens.find(i => i.id === it.id).estoque -= q;
      const l = $('#v-l', el); let lancou = true;
      if (l && l.checked) { v.conta = lancaConta(v); lancou = !!v.conta; }
      const vs = lvVendas(); vs.push(v);
      if (!db.set('livraria_vendas', vs) || !db.set('livraria_itens', itens)) return falha('Não foi possível salvar a venda neste navegador.');
      msg = 'Venda registrada: ' + q + 'x ' + it.titulo + ' (' + money(v.total, v.moeda) + ').' + (lancou ? '' : ' Atenção: o lançamento em Prestação de Contas falhou; lance manualmente.');
      draw();
    };
  };

  const rel = el => {
    const vs = lvVendas().slice().sort((a, b) => b.data.localeCompare(a.data)), itens = lvItens();
    const porMoeda = {}; vs.forEach(s => porMoeda[s.moeda] = (porMoeda[s.moeda] || 0) + s.total);
    const qtdTot = vs.reduce((t, s) => t + s.qtd, 0), estTot = itens.reduce((t, i) => t + i.estoque, 0);
    el.innerHTML = `<h3><i class="fas fa-chart-bar"></i> Vendas e relatório da Livraria</h3>${aviso()}
    <div class="totais"><div><span>Vendas registradas</span><strong>${vs.length}</strong></div><div><span>Exemplares vendidos</span><strong>${qtdTot}</strong></div><div><span>Exemplares em estoque</span><strong>${estTot}</strong></div>${Object.keys(MOEDA).filter(m => porMoeda[m]).map(m => `<div><span>Vendido: ${MOEDA[m]}</span><strong>${money(porMoeda[m], m)}</strong></div>`).join('')}</div>
    <p><button class="btn-visit" id="lr-p"><i class="fas fa-print"></i> Imprimir relatório</button> <button class="btn-visit" id="lr-c"><i class="fas fa-file-csv"></i> Baixar vendas (CSV)</button></p>
    <h4>Situação por livro</h4>${itens.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Título</th><th>Preço</th><th>Estoque</th><th>Vendidos</th></tr></thead><tbody>${itens.map(i => `<tr><td>${esc(i.titulo)}</td><td>${brlv(i.preco)}</td><td>${i.estoque}</td><td>${vs.filter(s => s.item === i.id).reduce((t, s) => t + s.qtd, 0)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="vazio">Nenhum livro cadastrado.</p>'}
    <h4>Vendas</h4>${vs.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Data</th><th>Livro</th><th>Qtd</th><th>Total</th><th>Comprador</th><th>Contas</th><th></th></tr></thead><tbody>${vs.map(s => `<tr><td>${fmtData(s.data)}</td><td>${esc(s.titulo)}</td><td>${s.qtd}</td><td>${money(s.total, s.moeda)}<br><small>${esc(MOEDA[s.moeda])}</small></td><td>${esc(s.comprador || '-')}</td><td>${s.conta ? '<span class="badge-disponivel">Lançada</span>' : (adm ? `<button class="btn-visit" data-lc="${s.id}">Lançar</button>` : '<span class="badge-emprestado">Pendente</span>')}</td><td><button class="icon-btn" data-es="${s.id}" aria-label="Estornar venda de ${esc(s.titulo)}" title="Estornar venda"><i class="fas fa-undo"></i></button></td></tr>`).join('')}</tbody></table></div>` : '<p class="vazio">Nenhuma venda registrada.</p>'}`;
    msg = '';
    $('#lr-p', el).onclick = () => window.print();
    $('#lr-c', el).onclick = () => {
      const rows = [['Data', 'Livro', 'Quantidade', 'Preço unitário', 'Total', 'Forma de pagamento', 'Comprador', 'Registrada por', 'Lançada em Prestação de Contas']].concat(vs.map(s => [s.data, s.titulo, s.qtd, s.unit, s.total, MOEDA[s.moeda], s.comprador, s.por, s.conta ? 'Sim' : 'Não']));
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = 'vendas-livraria.csv'; a.click();
    };
    el.querySelectorAll('[data-lc]').forEach(b => b.onclick = () => {
      const l = lvVendas(), s = l.find(x => x.id === b.dataset.lc), id = lancaConta(s);
      if (!id) { msg = 'Não foi possível lançar em Prestação de Contas.'; draw(); return; }
      s.conta = id; db.set('livraria_vendas', l); draw();
    });
    el.querySelectorAll('[data-es]').forEach(b => b.onclick = () => {
      const s = lvVendas().find(x => x.id === b.dataset.es);
      if (!confirm('Estornar esta venda? O estoque será devolvido' + (s.conta ? ' e o lançamento em Prestação de Contas será removido.' : '.'))) return;
      if (s.conta) { if (!adm) { msg = 'Esta venda já foi lançada em Prestação de Contas. Peça ao Administrador para estornar.'; draw(); return; } db.set('contas', db.get('contas', []).filter(c => c.id !== s.conta)); }
      const itens = lvItens(), it = itens.find(i => i.id === s.item); if (it) { it.estoque += s.qtd; db.set('livraria_itens', itens); }
      db.set('livraria_vendas', lvVendas().filter(x => x.id !== s.id));
      if (s.enc && window.PR_ENCOMENDA) window.PR_ENCOMENDA.api(db).aoEstornarVenda(s.id, !!s.conta);
      msg = 'Venda estornada.'; draw();
    });
  };

  const draw = () => {
    root.innerHTML = `<div class="tabs sub" role="tablist" aria-label="Livraria">${SUB.map(t => `<button class="tab-btn${t[0] === sub ? ' active' : ''}" data-ls="${t[0]}">${t[1]}</button>`).join('')}</div><div id="lv-sub"></div>`;
    root.querySelectorAll('[data-ls]').forEach(b => b.onclick = () => { sub = b.dataset.ls; editId = null; msg = ''; draw(); });
    ({ est, venda, rel, enc })[sub]($('#lv-sub', root));
  };
  draw();
};

V.zoom = (me, root) => {
  const edita = NIV[me.nivel] >= 3;
  const draw = () => {
    const as = db.get('aulas', []).sort((x, y) => (x.data + x.hora).localeCompare(y.data + y.hora));
    root.innerHTML = `<h3><i class="fas fa-video"></i> Agendamento de transmissão no Zoom</h3>` + (edita ? `<form id="fz" class="form-reserva" novalidate>
      <div class="form-row"><label for="z-t">Título *</label><input id="z-t" required placeholder="Digite o título da atividade ou encontro"></div>
      <div class="form-row"><label for="z-d">Data e horário *</label><input id="z-d" type="datetime-local" required></div>
      <div class="form-row"><label for="z-u">Duração estimada</label><select id="z-u"><option value="60">1 hora</option><option value="120">2 horas</option><option value="180">3 horas</option></select></div>
      <div class="form-row"><label for="z-l">Link do Zoom *</label><input id="z-l" type="url" required placeholder="https://zoom.us/j/..."></div>
      <p class="form-erro" id="z-e" role="alert" hidden></p><button class="btn-visit btn-large"><i class="fas fa-calendar-check"></i> Agendar</button></form>` : '') +
      (as.length ? `<table class="doc-table"><thead><tr><th>Data</th><th>Título</th><th>Duração</th><th>Entrar</th>${edita ? '<th></th>' : ''}</tr></thead><tbody>${as.map(a => `<tr><td>${fmtData(a.data)} ${esc(a.hora)}</td><td>${esc(a.titulo)}</td><td>${a.duracao ? a.duracao / 60 + ' h' : ''}</td><td><a href="${esc(a.link)}" target="_blank" rel="noopener">Abrir no Zoom</a></td>${edita ? `<td><button class="icon-btn" data-del="${a.id}" aria-label="Excluir ${esc(a.titulo)}"><i class="fas fa-trash"></i></button></td>` : ''}</tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhuma transmissão agendada.</p>');
    root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { db.set('aulas', db.get('aulas', []).filter(a => a.id !== b.dataset.del)); draw(); });
    const f = $('#fz', root);
    if (f) f.onsubmit = e => {
      e.preventDefault();
      const t = $('#z-t').value.trim(), d = $('#z-d').value, l = $('#z-l').value.trim(), er = $('#z-e');
      if (!t || !d || !/^https?:\/\//i.test(l)) { er.textContent = 'Informe título, data e horário e um link começando com https://'; er.hidden = false; return; }
      const as2 = db.get('aulas', []); as2.push({ id: uid(), titulo: t, data: d.slice(0, 10), hora: d.slice(11, 16), duracao: +$('#z-u').value, link: l }); db.set('aulas', as2); draw();
    };
  };
  draw();
};

V.users = (me, root) => {
  if (me.nivel !== 'administrador') { root.innerHTML = '<p class="vazio">Esta área é exclusiva do administrador.</p>'; return; }
  const ST = { pendente: 'Aguardando', aprovado: 'Aprovado', recusado: 'Recusado', bloqueado: 'Bloqueado' };
  const salva = (email, fn) => { const l = db.get('users', []), u = l.find(x => x.email === email); if (u) fn(u); db.set('users', l); draw(); const b = document.querySelector('[data-tab="users"] .badge'); const n = l.filter(x => statusDe(x) === 'pendente').length; if (b) { n ? b.textContent = n : b.remove(); } };
  const draw = () => {
    const us = db.get('users', []), pend = us.filter(u => statusDe(u) === 'pendente'), demais = us.filter(u => statusDe(u) !== 'pendente');
    const fnCell = u => u.nivel === 'administrador' ? '<small>Todas (administrador)</small>' : Object.entries(FUNC).map(([k, v]) => `<label class="fn"><input type="checkbox" data-fn="${k}" data-em="${esc(u.email)}"${(u.funcoes || []).includes(k) ? ' checked' : ''}> ${v}</label>`).join('');
    const acoes = u => {
      if (u.email === me.email) return '';
      const st = statusDe(u), e = esc(u.email);
      return (st === 'aprovado' ? `<button class="btn-visit btn-bloq" data-st="bloqueado" data-em="${e}"><i class="fas fa-ban"></i> Bloquear</button>` : '')
        + (st === 'bloqueado' ? `<button class="btn-visit" data-st="aprovado" data-em="${e}"><i class="fas fa-unlock"></i> Desbloquear</button>` : '')
        + (st === 'recusado' ? `<button class="btn-visit" data-st="aprovado" data-em="${e}"><i class="fas fa-check"></i> Aprovar</button>` : '')
        + ` <button class="icon-btn" data-del="${e}" aria-label="Remover ${esc(u.nome)}"><i class="fas fa-trash"></i></button>`;
    };
    root.innerHTML = `<h3><i class="fas fa-user-clock"></i> Solicitações de cadastro (${pend.length})</h3>
    <p>Pessoas que usaram <strong>Criar conta</strong> na página Entrar. Escolha o nível de acesso e aprove, ou não aprove o cadastro.</p>
    ${pend.length ? `<table class="doc-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Pedido em</th><th>Nível ao aprovar</th><th></th></tr></thead><tbody>${pend.map(u => `<tr><td>${esc(u.nome)}</td><td>${esc(u.email)}</td><td>${u.criado ? fmtData(u.criado) : '-'}</td>
      <td><select data-nvp="${esc(u.email)}" aria-label="Nível de ${esc(u.nome)}">${Object.keys(NIVN).map(k => `<option value="${k}"${k === 'leitor' ? ' selected' : ''}>${NIVN[k]}</option>`).join('')}</select></td>
      <td><button class="btn-visit" data-ap="${esc(u.email)}"><i class="fas fa-check"></i> Aprovar</button> <button class="btn-visit btn-bloq" data-st="recusado" data-em="${esc(u.email)}"><i class="fas fa-times"></i> Não aprovar</button></td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhuma solicitação aguardando.</p>'}
    <h3 style="margin-top:28px">Cadastrar responsáveis e níveis de acesso</h3><p>Exclusivo do administrador. Defina a senha provisória e combine com a pessoa uma forma segura de recebê-la.</p>
    <form id="fu" class="form-reserva" novalidate>
      <div class="form-row"><label for="u-n">Nome completo do responsável *</label><input id="u-n" required autocomplete="off"></div>
      <div class="form-row"><label for="u-e">E-mail de acesso *</label><input id="u-e" type="email" required autocomplete="off"></div>
      <div class="form-row"><label for="u-w">WhatsApp (com DDD) *</label><input id="u-w" type="tel" required autocomplete="off" maxlength="20" placeholder="(21) 99999-9999"></div>
      <p class="tip-box" role="note">A autorização LGPD é da própria pessoa: no primeiro acesso ela vai ver o aviso para aceitar. Não marque por ela.</p>
      <div class="form-row"><label for="u-v">Nível de acesso *</label><select id="u-v">
        <option value="leitor">Leitor: vê acervo, avisos e aulas, sem alterar</option>
        <option value="comentador">Comentador: lê e comenta nas produções</option>
        <option value="editor">Editor (responsável pelo acervo): cadastra livros, controla empréstimos e agenda aulas</option>
        <option value="administrador">Administrador: acesso total, usuários e finanças</option></select></div>
      <fieldset class="funcoes"><legend>Responsabilidades (opcional)</legend>${Object.entries(FUNC).map(([k, v]) => `<label><input type="checkbox" name="fn" value="${k}"> ${v}</label>`).join('')}</fieldset>
      <div class="form-row"><label for="u-s">Senha provisória (mín. 8 caracteres) *</label><input id="u-s" type="password" autocomplete="new-password" required></div>
      <p class="form-erro" id="u-er" role="alert" hidden></p><button class="btn-visit btn-large"><i class="fas fa-user-shield"></i> Cadastrar responsável</button></form>
    <h4>Responsáveis cadastrados</h4>
    <table class="doc-table"><thead><tr><th>Nome</th><th>E-mail</th><th>WhatsApp</th><th>Perfil</th><th>Situação</th><th>Responsabilidades</th><th></th></tr></thead><tbody>${demais.map(u => {
      const eu = u.email === me.email;
      return `<tr><td>${esc(u.nome)}${eu ? ' (você)' : ''}${cadastroIncompleto(u) ? ' <span class="badge st-pendente" title="Falta WhatsApp, nome completo ou autorização LGPD">cadastro incompleto</span>' : ''}</td><td>${esc(u.email)}</td><td>${esc(u.whatsapp || '—')}</td><td>${eu ? `<span class="badge ${u.nivel}">${NIVN[u.nivel]}</span>` : `<select data-nv="${esc(u.email)}" aria-label="Perfil de ${esc(u.nome)}">${Object.keys(NIVN).map(k => `<option value="${k}"${k === u.nivel ? ' selected' : ''}>${NIVN[k]}</option>`).join('')}</select>`}</td><td><span class="badge st-${statusDe(u)}">${ST[statusDe(u)]}</span></td><td>${fnCell(u)}</td><td>${acoes(u)}</td></tr>`;
    }).join('')}</tbody></table>`;
    root.querySelectorAll('[data-ap]').forEach(b => b.onclick = () => { const nv = root.querySelector(`[data-nvp="${CSS.escape(b.dataset.ap)}"]`).value; salva(b.dataset.ap, u => { u.status = 'aprovado'; u.nivel = nv; }); });
    root.querySelectorAll('[data-st]').forEach(b => b.onclick = () => {
      const novo = b.dataset.st, msg = novo === 'bloqueado' ? 'Bloquear este usuário? Ele perde o acesso à área restrita.' : novo === 'recusado' ? 'Não aprovar este cadastro?' : null;
      if (msg && !confirm(msg)) return;
      salva(b.dataset.em, u => { u.status = novo; });
    });
    root.querySelectorAll('[data-nv]').forEach(s => s.onchange = () => { const l = db.get('users', []); l.find(u => u.email === s.dataset.nv).nivel = s.value; db.set('users', l); draw(); });
    root.querySelectorAll('[data-fn]').forEach(c => c.onchange = () => { const l = db.get('users', []), u = l.find(x => x.email === c.dataset.em), f = new Set(u.funcoes || []); c.checked ? f.add(c.dataset.fn) : f.delete(c.dataset.fn); u.funcoes = [...f]; db.set('users', l); });
    root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Remover este responsável?')) { db.set('users', db.get('users', []).filter(u => u.email !== b.dataset.del)); draw(); } });
    if (window.PR_DADOS && PR_DADOS.modo === 'supabase') { // no servidor, a senha é de cada pessoa: ninguém cria conta pelos outros
      const fu = $('#fu', root), t = fu && fu.previousElementSibling;
      if (t) t.innerHTML = 'Cada pessoa cria a própria conta em <strong>Entrar › Criar conta</strong>, com a senha dela. O pedido aparece acima, em Solicitações de cadastro, para você aprovar e escolher o nível e as funções.';
      if (fu) fu.remove();
      return;
    }
    $('#fu', root).onsubmit = async e => {
      e.preventDefault();
      const n = $('#u-n').value.trim(), em = $('#u-e').value.trim().toLowerCase(), s = $('#u-s').value, er = $('#u-er');
      const falha = m => { er.textContent = m; er.hidden = false; };
      const w = $('#u-w').value.trim();
      if (!nomeCompletoOk(n)) return falha('Informe o nome completo (nome e sobrenome).');
      if (!/^\S+@\S+\.\S+$/.test(em)) return falha('Informe um e-mail válido.');
      if (!zapOk(w)) return falha('Informe um WhatsApp válido, com DDD.');
      if (s.length < 8) return falha('A senha provisória precisa ter ao menos 8 caracteres.');
      const l = db.get('users', []); if (l.some(u => u.email === em)) return falha('Este e-mail já está cadastrado.');
      const salt = uid(); l.push({ nome: n, email: em, whatsapp: zapDigitos(w), nivel: $('#u-v').value, status: 'aprovado', funcoes: [...root.querySelectorAll('[name=fn]:checked')].map(i => i.value), criado: hoje(), salt, hash: await hash(s, salt) }); db.set('users', l); draw();
    };
  };
  draw();
};

const CC = {
  'Manutenção': 'Manutenção (zelo da Sala, Portal, Monólito, Fonte, limpeza e fixos)',
  'Construção': 'Construção (obras do Centro de Estudo, alojamentos, muros)',
  'Eventos': 'Atividades (Encontros Estacionais, retiros, seminários, refeições)',
  'Campanhas': 'Campanhas (fundraising pontual com meta de valor)',
  'Alojamento': 'Alojamento (quartos Paz, Força e Alegria, camas 01 a 12)',
  'Livraria e Lojinha': 'Livraria da Biblioteca e Lojinha (livros e artesanatos)'
};
try { Object.assign(CC, db.get('cc_extra', {})); } catch (e) { /* centros de custo criados nas telas Prestação de Contas e Compras e Orçamento */ }
// Tipos de operação criados na Prestação de Contas (db 'plano_extra': { tipo: 'Entrada'|'Saída', grupo, nome, centro }). Entram no plano de contas, no Orçamento e nas Compras.
const aplicaPlanoExtra = () => { try {
  const P = window.PR_PLANO; if (!P) return;
  (db.get('plano_extra', []) || []).forEach(x => {
    const lista = x.tipo === 'Entrada' ? P.ENTRADAS : P.SAIDAS; if (!lista || !x.nome) return;
    let g = lista.find(y => y.grupo === x.grupo); if (!g) { g = { grupo: x.grupo || 'Criados na tela', itens: [] }; lista.push(g); }
    if (!lista.some(y => y.itens.includes(x.nome))) g.itens.push(x.nome);
    if (x.centro) P.CENTRO_SUGERIDO[x.tipo + '|' + x.nome] = x.centro;
  });
} catch (e) { /* sem tipos extras */ } };
aplicaPlanoExtra();
const MOEDA = { PIX: 'PIX / Banco Institucional', MUMBUCA: 'M$ (Banco Mumbuca Maricá)', ESPECIE: 'Dinheiro em espécie', ASAAS: 'Asaas (PIX, cartão, boleto ou maquininha)' };
const money = (v, m) => (m === 'MUMBUCA' ? 'M$ ' : 'R$ ') + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Converte lançamentos da versão anterior (receita/despesa, sem centro de custo)
const normConta = c => ({ ...c, tipo: c.tipo === 'receita' ? 'Entrada' : c.tipo === 'despesa' ? 'Saída' : c.tipo, centro: c.centro || 'Sem centro de custo', moeda: c.moeda || 'PIX', vaquinha: c.vaquinha || '' });
function resumo(cs, chave, titulo, vazio) {
  const g = {};
  cs.forEach(c => { const k = chave(c); if (!k) return; const o = g[k + '|' + c.moeda] = g[k + '|' + c.moeda] || { k, m: c.moeda, e: 0, s: 0 }; c.tipo === 'Entrada' ? o.e += c.valor : o.s += c.valor; });
  const rows = Object.values(g).sort((a, b) => a.k.localeCompare(b.k));
  return `<h4>${titulo}</h4>` + (rows.length ? `<table class="doc-table"><thead><tr><th>${titulo.split(' ').pop()}</th><th>Moeda</th><th>Entradas</th><th>Saídas</th><th>Saldo</th></tr></thead><tbody>${rows.map(o => `<tr><td>${esc(o.k)}</td><td>${esc(MOEDA[o.m])}</td><td>${money(o.e, o.m)}</td><td>${money(o.s, o.m)}</td><td><strong>${money(o.e - o.s, o.m)}</strong></td></tr>`).join('')}</tbody></table>` : `<p class="vazio">${vazio}</p>`);
}
const opTipos = () => {
  const P = window.PR_PLANO, og = (arr, tipo, sinal) => arr.map(g => `<optgroup label="${tipo} - ${g.grupo}">${g.itens.map(i => `<option value="${tipo}|${esc(i)}">${tipo} / ${esc(i)} (${sinal})</option>`).join('')}</optgroup>`).join('');
  return og(P.ENTRADAS, 'Entrada', '+') + og(P.SAIDAS, 'Saída', '-');
};
V.contas = (me, root) => {
  let mesRef = hoje().slice(0, 7);
  // Contribuição Mensal de Manutenção: valor combinado de cada pessoa, conferido mês a mês contra os lançamentos.
  const mensalistas = () => db.get('mensalistas', []);
  const recebidoMes = (cs, nome) => Math.round(cs.filter(c => c.tipo === 'Entrada' && c.origem === 'Manutenção Mensal' && c.ref === mesRef && norm(c.pessoa || '') === norm(nome)).reduce((t, c) => t + c.valor, 0) * 100) / 100;
  const mensalidades = cs => {
    const ms = mensalistas().filter(m => m.ativo !== false), prev = ms.reduce((t, m) => t + m.valor, 0);
    const nomes = new Set(ms.map(m => norm(m.nome)));
    const avulso = cs.filter(c => c.tipo === 'Entrada' && c.origem === 'Manutenção Mensal' && c.ref === mesRef && !nomes.has(norm(c.pessoa || ''))).reduce((t, c) => t + c.valor, 0);
    const rec = ms.reduce((t, m) => t + recebidoMes(cs, m.nome), 0) + avulso, aberto = ms.reduce((t, m) => t + Math.max(0, m.valor - recebidoMes(cs, m.nome)), 0);
    return `<h4><i class="fas fa-users"></i> Contribuição Mensal de Manutenção (por pessoa)</h4>
    <p class="tip-box" role="note"><i class="fas fa-info-circle"></i> Cadastre o valor mensal combinado com cada pessoa. A cada mês, <strong>Registrar pagamento</strong> lança a Entrada (origem Manutenção Mensal) na Prestação de Contas. Pagamentos feitos pelo Asaas ou lançados no formulário acima (com a pessoa e o mês) também são reconhecidos aqui.</p>
    <form id="fmz" class="form-reserva" novalidate>
      <div class="form-row"><label for="mz-n">Nome da pessoa *</label><input id="mz-n" maxlength="80"></div>
      <div class="form-row"><label for="mz-v">Valor mensal *</label><input id="mz-v" type="number" min="0.01" step="0.01" placeholder="0,00"></div>
      <div class="form-row"><label for="mz-m">Forma de pagamento habitual</label><select id="mz-m">${Object.entries(MOEDA).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></div>
      <p class="form-erro" id="mz-e" role="alert" hidden></p><button class="btn-visit"><i class="fas fa-user-plus"></i> Cadastrar contribuinte</button></form>
    <div class="form-row" style="max-width:260px;margin-top:14px"><label for="mz-mes">Mês de conferência</label><input id="mz-mes" type="month" value="${mesRef}"></div>
    <div class="totais"><div><span>Previsto no mês (${ms.length} pessoa(s))</span><strong>${money(prev, 'PIX')}</strong></div><div><span>Recebido no mês (manutenção)</span><strong>${money(rec, 'PIX')}</strong></div><div><span>Em aberto</span><strong>${money(aberto, 'PIX')}</strong></div></div>
    ${ms.length ? `<table class="doc-table"><thead><tr><th>Pessoa</th><th>Valor mensal</th><th>Recebido em ${esc(mesRef)}</th><th>Situação</th><th></th></tr></thead><tbody>${ms.map(m => { const r = recebidoMes(cs, m.nome), ok = r >= m.valor, par = r > 0 && !ok; return `<tr><td>${esc(m.nome)}</td><td>${money(m.valor, m.moeda)}<br><small>${esc(MOEDA[m.moeda])}</small></td><td>${money(r, m.moeda)}</td><td>${ok ? '<span class="badge-disponivel">Pago</span>' : par ? '<span class="badge-emprestado">Parcial</span>' : '<span class="badge-emprestado">Em aberto</span>'}</td><td style="white-space:nowrap">${ok ? '' : `<button class="btn-visit" data-mzp="${m.id}" style="padding:5px 9px;font-size:.78rem">Registrar pagamento</button> `}<button class="icon-btn" data-mzx="${m.id}" aria-label="Remover ${esc(m.nome)} da lista de contribuintes"><i class="fas fa-trash"></i></button></td></tr>`; }).join('')}</tbody></table>` : '<p class="vazio">Nenhum contribuinte cadastrado.</p>'}`;
  };
  const HI = () => ({ db, esc, $, uid, hoje, fmtData, csv, reduz, norm, tem, irPara });
  const draw = () => {
    const cs = db.get('contas', []).map(normConta).sort((a, b) => b.data.localeCompare(a.data));
    const ptMap = {}; db.get('inv_itens', []).forEach(i => { if (i.patLancamento) (ptMap[i.patLancamento] = ptMap[i.patLancamento] || []).push(i.patNumero || i.codigo); });
    const tot = {}; cs.forEach(c => { if (c.terceiro) return; const o = tot[c.moeda] = tot[c.moeda] || { e: 0, s: 0 }; c.tipo === 'Entrada' ? o.e += c.valor : o.s += c.valor; });
    const reemb = Math.round(cs.filter(c => c.terceiro && c.tipo === 'Saída').reduce((t, c) => t + c.valor, 0) * 100) / 100; // despesas pagas do próprio bolso por voluntários (não saíram do caixa)
    root.innerHTML = `<h3><i class="fas fa-calculator"></i> Lançamento financeiro - Instituto Pangeia</h3>
    <div class="totais">${Object.keys(MOEDA).map(m => { const o = tot[m] || { e: 0, s: 0 }; return `<div><span>Saldo: ${MOEDA[m]}</span><strong>${money(o.e - o.s, m)}</strong></div>`; }).join('')}${reemb ? `<div><span>A reembolsar a quem pagou do próprio bolso</span><strong>${money(reemb, 'PIX')}</strong></div>` : ''}</div>
    <form id="fc" class="form-reserva" novalidate>
      <div class="form-row"><label for="c-cc">Centro de custo *</label><select id="c-cc" required><option value="">Selecione o centro de custo...</option>${Object.entries(CC).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join('')}</select> <button type="button" class="btn-visit" id="c-ncc">＋ Novo centro de custo</button></div>
      <div class="form-row"><label for="c-t">Tipo de operação *</label><select id="c-t">${opTipos()}</select> <button type="button" class="btn-visit" id="c-nt">＋ Novo tipo de operação</button></div>
      <div id="c-novo-t" hidden class="inv-pat" style="border:2px solid #c9d2d8;border-radius:10px;padding:12px;margin:8px 0">
        <h4><i class="fas fa-plus-circle"></i> Novo tipo de operação</h4>
        <p><small>Entra no plano de contas, no Orçamento e Fluxo Financeiro e nas Compras. Não altera lançamentos já feitos.</small></p>
        <div class="form-row"><label for="nt-t">É uma *</label><select id="nt-t"><option>Entrada</option><option>Saída</option></select></div>
        <div class="form-row"><label for="nt-g">Grupo *</label><select id="nt-g"></select></div>
        <div class="form-row" id="nt-gw" hidden><label for="nt-gn">Nome do novo grupo *</label><input id="nt-gn" maxlength="50"></div>
        <div class="form-row"><label for="nt-n">Nome do tipo de operação *</label><input id="nt-n" maxlength="50" placeholder="Ex.: Seguro do Silo, Doação de materiais"></div>
        <div class="form-row"><label for="nt-c">Centro de custo sugerido (opcional)</label><select id="nt-c"><option value="">Nenhum</option>${Object.keys(CC).map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join('')}</select></div>
        <p class="form-erro" id="nt-e" role="alert" hidden></p>
        <button type="button" class="btn-visit" id="nt-s"><i class="fas fa-save"></i> Criar tipo de operação</button> <button type="button" class="btn-visit" id="nt-x" style="background:#6c7a7b">Cancelar</button></div>
      <div class="form-row" id="c-pr"><label for="c-p">Pessoa / contribuinte</label><input id="c-p" maxlength="80" list="c-pl" placeholder="Nome de quem pagou ou de quem recebeu o valor"><datalist id="c-pl">${[...new Set([me.nome].concat(mensalistas().map(m => m.nome), db.get('contas', []).map(c => c.pessoa)).filter(Boolean))].map(x => `<option value="${esc(x)}">`).join('')}</datalist> <button type="button" class="btn-visit" id="c-eu" title="Preencher com o seu nome">Sou eu (${esc(me.nome)})</button><small> Lançamento registrado por: ${esc(me.nome)}</small></div>
      <div class="form-row" id="c-cpr"><label for="c-camp">Campanha (opcional)</label><select id="c-camp"><option value="">Nenhuma</option>${(window.PR_CAMPANHA ? window.PR_CAMPANHA.lista(db) : []).map(c => `<option value="${esc(c.id)}">${esc(c.titulo)}</option>`).join('')}</select> <small>Se o lançamento for um aporte da campanha, escolha aqui: ele aparece na tela da campanha.</small></div>
      <div class="form-row" id="c-rr" hidden><label for="c-r">Mês de referência da manutenção</label><input id="c-r" type="month"></div>
      <div class="form-row"><label for="c-v">Valor *</label><input id="c-v" type="number" min="0.01" step="0.01" required placeholder="0,00"></div>
      <div class="form-row"><label for="c-m">Moeda / forma de pagamento *</label><select id="c-m">${Object.entries(MOEDA).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      <div class="form-row" id="c-fr" hidden><label for="c-fm">Forma usada no Asaas</label><select id="c-fm">${Object.entries(window.PR_PLANO.FORMAS_ASAAS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      <div class="form-row"><label for="c-d">Data *</label><input id="c-d" type="date" required value="${new Date().toISOString().slice(0, 10)}"></div>
      <div class="form-row"><label for="c-s">Descrição</label><input id="c-s" maxlength="120"></div>
      <div class="form-row" id="c-ptr" hidden><label><input type="checkbox" id="c-pt"> Esta compra gera bem patrimonial (depois de registrar, abre o cadastro do bem no Patrimônio)</label></div>
      <div class="form-row"><label for="c-f">Anexar comprovante / nota fiscal (até 1 MB)</label><input id="c-f" type="file" accept=".pdf,image/*"></div>
      <p class="form-erro" id="c-e" role="alert" hidden></p><button class="btn-visit btn-large"><i class="fas fa-save"></i> Registrar lançamento</button></form>
    <div id="asaas-painel"></div>
    <div id="imp-painel"></div>
    <div id="concil-painel"></div>
    ${mensalidades(cs)}
    ${resumo(cs, c => c.centro, 'Resumo por Centro de custo', 'Sem lançamentos.')}
    ${resumo(cs, c => c.tipo === 'Saída' ? c.origem : '', 'Resumo por Categoria de saída', 'Nenhuma saída categorizada.')}
    ${resumo(cs, c => c.vaquinha, 'Resumo por Vaquinha', 'Nenhuma vaquinha coletiva registrada.')}
    ${resumo(cs, c => c.campanha ? ((window.PR_CAMPANHA && (window.PR_CAMPANHA.porId(db, c.campanha) || {}).titulo) || c.campanha) : '', 'Resumo por Campanha', 'Nenhum lançamento ligado a uma campanha.')}
    <div id="pt-painel"></div>
    <h4>Lançamentos</h4>${cs.length ? `<table class="doc-table"><thead><tr><th>Data</th><th>Centro de custo</th><th>Vaquinha</th><th>Descrição</th><th>Tipo</th><th>Valor</th><th>Comprovante</th><th></th></tr></thead><tbody>${cs.map(c => `<tr><td>${fmtData(c.data)}</td><td>${esc(c.centro)}</td><td>${esc(c.vaquinha) || '-'}${c.campanha ? `<br><small><i class="fas fa-flag"></i> ${esc((window.PR_CAMPANHA && (window.PR_CAMPANHA.porId(db, c.campanha) || {}).titulo) || c.campanha)}</small>` : ''}</td><td>${esc(c.desc)}${c.por ? `<br><small>Lançado por ${esc(c.por)}</small>` : ''}${ptMap[c.id] ? `<br><small><i class="fas fa-landmark"></i> Patrimônio: ${ptMap[c.id].map(esc).join(', ')}</small>` : ''}${c.concil ? '<br><small><i class="fas fa-university"></i> Conciliado com o extrato</small>' : ''}${c.pessoa ? `<br><small>${esc(c.pessoa)}${c.ref ? ' · ref. ' + esc(c.ref) : ''}</small>` : ''}${c.forma ? `<br><small>${esc(window.PR_PLANO.FORMAS_ASAAS[c.forma] || c.forma)}</small>` : ''}</td><td>${c.tipo}${c.origem ? ' / ' + esc(c.origem) : ''}</td><td>${money(c.valor, c.moeda)}<br><small>${esc(MOEDA[c.moeda])}</small></td><td>${c.comp && safeUrl(c.comp) ? `<a href="${esc(c.comp)}" download="comprovante-${c.id}">Baixar</a>` : '-'}</td><td>${c.tipo === 'Saída' ? `<button class="icon-btn" data-pt="${c.id}" title="Patrimônio: criar bens a partir desta compra ou vincular a bens já cadastrados" aria-label="Patrimônio desta compra"><i class="fas fa-landmark"></i></button> ` : ''}<button class="icon-btn" data-del="${c.id}" aria-label="Excluir lançamento"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhum lançamento registrado.</p>'}`;
    const abrirPatrimonio = (lanc, modo) => { if (!lanc || !window.PR_INVENTARIO) return; const box = $('#pt-painel', root); window.PR_INVENTARIO.painelCompra(me, HI(), box, lanc, draw, modo); box.scrollIntoView({ block: 'center' }); };
    root.querySelectorAll('[data-pt]').forEach(b => b.onclick = () => abrirPatrimonio(cs.find(c => c.id === b.dataset.pt)));
    root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const lig = ptMap[b.dataset.del] || [];
      if (!confirm('Excluir este lançamento?' + (lig.length ? `\n\nHá ${lig.length} bem(ns) no patrimônio ligado(s) a ele (${lig.join(', ')}). Eles NÃO serão apagados: continuam no patrimônio, marcados como "lançamento removido".` : ''))) return;
      db.set('contas', db.get('contas', []).filter(c => c.id !== b.dataset.del));
      if (lig.length && window.PR_INVENTARIO) window.PR_INVENTARIO.lancamentoRemovido(me, HI(), b.dataset.del);
      draw();
    });
    // formulário: campos que dependem do tipo e da forma de pagamento; centro de custo sugerido
    const sincroniza = () => {
      const t = $('#c-t', root).value; $('#c-ptr', root).hidden = !t.startsWith('Saída|'); if ($('#c-ptr', root).hidden) $('#c-pt', root).checked = false; $('#c-rr', root).hidden = t !== 'Entrada|Manutenção Mensal'; $('#c-fr', root).hidden = $('#c-m', root).value !== 'ASAAS';
      if (t === 'Entrada|Manutenção Mensal' && !$('#c-r', root).value) $('#c-r', root).value = mesRef;
      const sug = window.PR_PLANO.CENTRO_SUGERIDO[t]; if (sug && !$('#c-cc', root).value) $('#c-cc', root).value = sug;
    };
    $('#c-t', root).onchange = sincroniza; $('#c-m', root).onchange = sincroniza; sincroniza();
    $('#c-eu', root).onclick = () => { $('#c-p', root).value = me.nome; };
    $('#c-ncc', root).onclick = () => {
      const n = (prompt('Nome do novo centro de custo (ex.: Biblioteca, Cozinha):') || '').replace(/\s+/g, ' ').trim();
      if (!n) return; if (n.length > 40) { alert('Use até 40 caracteres.'); return; }
      if (Object.keys(CC).some(k => norm(k) === norm(n))) { alert('Esse centro de custo já existe.'); return; }
      const ex = db.get('cc_extra', {}); ex[n] = n + ' (criado por ' + me.nome + ' em ' + fmtData(hoje()) + ')';
      if (!db.set('cc_extra', ex)) { alert('Sem espaço no navegador para salvar.'); return; }
      Object.assign(CC, ex); draw(); $('#c-cc', root).value = n;
    };
    const ntGrupos = () => { const P = window.PR_PLANO, t = $('#nt-t', root).value, l = t === 'Entrada' ? P.ENTRADAS : P.SAIDAS; $('#nt-g', root).innerHTML = l.map(g => `<option>${esc(g.grupo)}</option>`).join('') + '<option value="__novo">＋ Novo grupo...</option>'; $('#nt-gw', root).hidden = true; };
    $('#c-nt', root).onclick = () => { $('#c-novo-t', root).hidden = false; ntGrupos(); $('#nt-n', root).focus(); };
    $('#nt-x', root).onclick = () => { $('#c-novo-t', root).hidden = true; };
    $('#nt-t', root).onchange = ntGrupos; $('#nt-g', root).onchange = e => { $('#nt-gw', root).hidden = e.target.value !== '__novo'; };
    $('#nt-s', root).onclick = () => {
      const er = $('#nt-e', root), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
      const P = window.PR_PLANO, tipo = $('#nt-t', root).value, lista = tipo === 'Entrada' ? P.ENTRADAS : P.SAIDAS, nome = $('#nt-n', root).value.replace(/\s+/g, ' ').trim();
      let grupo = $('#nt-g', root).value; if (grupo === '__novo') grupo = $('#nt-gn', root).value.replace(/\s+/g, ' ').trim();
      if (!nome || !grupo) return falha('Informe o grupo e o nome do tipo de operação.');
      if (lista.some(g => g.itens.some(i => norm(i) === norm(nome)))) return falha('Já existe um tipo de ' + (tipo === 'Entrada' ? 'entrada' : 'saída') + ' com esse nome.');
      const ex = db.get('plano_extra', []); ex.push({ tipo, grupo, nome, centro: $('#nt-c', root).value, por: me.nome, em: hoje() });
      if (!db.set('plano_extra', ex)) return falha('Sem espaço no navegador para salvar.');
      const cEsc = $('#nt-c', root).value; aplicaPlanoExtra(); draw(); $('#c-t', root).value = tipo + '|' + nome; $('#c-t', root).dispatchEvent(new Event('change')); if (cEsc) $('#c-cc', root).value = cEsc;
    };
    // mensalistas
    $('#mz-mes', root).onchange = e => { mesRef = e.target.value || hoje().slice(0, 7); draw(); };
    $('#fmz', root).onsubmit = e => {
      e.preventDefault(); const n = $('#mz-n', root).value.trim(), v = parseFloat($('#mz-v', root).value), er = $('#mz-e', root);
      if (!n || !(v > 0)) { er.textContent = 'Informe o nome e um valor mensal maior que zero.'; er.hidden = false; return; }
      const l = mensalistas(); if (l.some(m => m.ativo !== false && norm(m.nome) === norm(n))) { er.textContent = 'Esta pessoa já está na lista.'; er.hidden = false; return; }
      l.push({ id: uid(), nome: n, valor: Math.round(v * 100) / 100, moeda: $('#mz-m', root).value, ativo: true, criado: hoje() }); db.set('mensalistas', l); draw();
    };
    root.querySelectorAll('[data-mzx]').forEach(b => b.onclick = () => { const m = mensalistas().find(x => x.id === b.dataset.mzx); if (m && confirm('Remover ' + m.nome + ' da lista de contribuintes? Os pagamentos já lançados continuam na Prestação de Contas.')) { db.set('mensalistas', mensalistas().filter(x => x.id !== m.id)); draw(); } });
    root.querySelectorAll('[data-mzp]').forEach(b => b.onclick = () => {
      const m = mensalistas().find(x => x.id === b.dataset.mzp); if (!m) return;
      const falta = Math.round((m.valor - recebidoMes(cs, m.nome)) * 100) / 100, l = db.get('contas', []);
      l.push({ id: uid(), data: hoje(), desc: 'Manutenção mensal ' + mesRef + ' - ' + m.nome, centro: 'Manutenção', tipo: 'Entrada', origem: 'Manutenção Mensal', vaquinha: '', pessoa: m.nome, ref: mesRef, forma: '', valor: falta > 0 ? falta : m.valor, moeda: m.moeda, comp: '', por: me.nome, em: hoje() });
      if (!db.set('contas', l)) { alert('Sem espaço no navegador para salvar o lançamento.'); return; } draw();
    });
    if (window.PR_ABRIR_PAT) { const alvo = cs.find(c => c.id === window.PR_ABRIR_PAT); window.PR_ABRIR_PAT = null; if (alvo) abrirPatrimonio(alvo, 'novo'); }
    if (window.PR_ASAAS) window.PR_ASAAS.painel($('#asaas-painel', root), { db, uid, hoje, esc, $, money, MOEDA, norm, fmtData }, draw);
    if (window.PR_CAMPANHA) window.PR_CAMPANHA.conciliacao($('#concil-painel', root), { db, uid, hoje, esc, $, money, fmtData, MOEDA, CC, me }, draw);
    if (window.PR_IMP2611) window.PR_IMP2611.painel($('#imp-painel', root), { db, uid, hoje, esc, $, money, MOEDA, fmtData, me }, draw);
    $('#fc', root).onsubmit = e => {
      e.preventDefault();
      const cc = $('#c-cc').value, d = $('#c-d').value, v = parseFloat($('#c-v').value), er = $('#c-e'), file = $('#c-f').files[0];
      const falha = m => { er.textContent = m; er.hidden = false; };
      er.hidden = true;
      if (!cc) return falha('Selecione o centro de custo.');
      if (!d || !(v > 0)) return falha('Informe a data e um valor maior que zero.');
      const [tp, og] = $('#c-t').value.split('|'), pessoa = $('#c-p').value.trim(), ref = $('#c-r').value;
      if (og === 'Manutenção Mensal' && (!pessoa || !ref)) return falha('Para Manutenção Mensal, informe a pessoa e o mês de referência.');
      const salvar = comp => {
        const l = db.get('contas', []), novoId = uid(), geraPat = !!($('#c-pt') && $('#c-pt').checked && tp === 'Saída'); l.push({ id: novoId, data: d, desc: $('#c-s').value.trim(), centro: cc, tipo: tp, origem: og || '', vaquinha: '', campanha: $('#c-camp').value, pessoa, ref: og === 'Manutenção Mensal' ? ref : '', forma: $('#c-m').value === 'ASAAS' ? $('#c-fm').value : '', valor: Math.round(v * 100) / 100, moeda: $('#c-m').value, comp: comp || '', por: me.nome, em: hoje() });
        if (!db.set('contas', l)) return falha('Sem espaço no navegador. Registre sem anexar o comprovante.');
        draw();
        if (geraPat) abrirPatrimonio(l.find(x => x.id === novoId), 'novo');
      };
      if (file) {
        if (file.size > 1024 * 1024) return falha('Comprovante maior que 1 MB. Reduza o arquivo ou registre sem anexo.');
        const r = new FileReader(); r.onload = () => safeUrl(r.result) ? salvar(r.result) : falha('Tipo de arquivo não aceito.'); r.readAsDataURL(file);
      } else salvar('');
    };
  };
  draw();
};

const MAPA_BASE = ['Site oficial / domínio', 'WhatsApp Business (Fale conosco)', 'Canal do WhatsApp (O Parque informa)', 'Comunidade do WhatsApp (As pessoas se organizam)', 'Instagram', 'Facebook', 'YouTube / Google'];
const mapaContas = (me, root) => {
  let m = db.get('mapa', null);
  if (!m) { m = MAPA_BASE.map(p => ({ id: uid(), plataforma: p, email: '', resp: '', seg: '', fa: false, data: '' })); db.set('mapa', m); }
  const falta = a => {
    const f = [];
    if (!a.email) f.push('e-mail institucional'); else if (/@(gmail|hotmail|outlook|yahoo|live|icloud)\./i.test(a.email)) f.push('e-mail não institucional');
    if (!a.resp) f.push('responsável'); if (!a.seg) f.push('segundo administrador'); if (!a.fa) f.push('2FA');
    return f.length ? `<span class="badge-emprestado">Pendente: ${f.join(', ')}</span>` : '<span class="badge-disponivel">Em conformidade</span>';
  };
  const draw = () => {
    m = db.get('mapa', []);
    const inp = (a, f, t, ph) => `<input type="${t || 'text'}" data-id="${a.id}" data-f="${f}" value="${esc(a[f])}" maxlength="120" placeholder="${ph || ''}" aria-label="${esc(f === 'email' ? 'E-mail institucional' : f === 'resp' ? 'Responsável' : f === 'seg' ? 'Segundo administrador' : 'Última verificação')} de ${esc(a.plataforma)}"${f === 'email' ? ' list="emails-inst"' : ''}>`;
    root.innerHTML = `<h3><i class="fas fa-shield-alt"></i> Contas Digitais</h3>
    <p>Todas as contas pertencem à estrutura do Parque e devem estar vinculadas a e-mails institucionais (contato@, comunicacao@, administrativo@), com autenticação em dois fatores (2FA) e um segundo administrador. <strong>Não registre senhas aqui.</strong></p>
    <datalist id="emails-inst"><option value="contato@"><option value="comunicacao@"><option value="administrativo@"></datalist>
    <div style="overflow-x:auto"><table class="doc-table mapa"><thead><tr><th>Conta</th><th>E-mail institucional</th><th>Responsável</th><th>Segundo administrador</th><th>2FA</th><th>Verificado em</th><th>Situação</th><th></th></tr></thead><tbody>${m.map(a => `<tr><td>${esc(a.plataforma)}</td><td>${inp(a, 'email', 'text', 'contato@...')}</td><td>${inp(a, 'resp')}</td><td>${inp(a, 'seg')}</td><td><input type="checkbox" data-id="${a.id}" data-f="fa" ${a.fa ? 'checked' : ''} aria-label="2FA ativo em ${esc(a.plataforma)}"></td><td>${inp(a, 'data', 'date')}</td><td id="st-${a.id}">${falta(a)}</td><td><button class="icon-btn" data-del="${a.id}" aria-label="Remover ${esc(a.plataforma)}"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table></div>
    <form id="fm" class="form-reserva" novalidate style="margin-top:20px"><div class="form-row"><label for="m-p">Adicionar conta ao mapa</label><input id="m-p" maxlength="80" placeholder="Ex.: TikTok, Google Drive, Zoom institucional"></div><button class="btn-visit">Adicionar</button></form>`;
    root.querySelectorAll('[data-f]').forEach(i => i.onchange = () => {
      const l = db.get('mapa', []), a = l.find(x => x.id === i.dataset.id); a[i.dataset.f] = i.type === 'checkbox' ? i.checked : i.value.trim();
      db.set('mapa', l); $('#st-' + a.id, root).innerHTML = falta(a);
    });
    root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Remover esta conta do mapa?')) { db.set('mapa', db.get('mapa', []).filter(a => a.id !== b.dataset.del)); draw(); } });
    $('#fm', root).onsubmit = e => { e.preventDefault(); const p = $('#m-p', root).value.trim(); if (!p) return; const l = db.get('mapa', []); l.push({ id: uid(), plataforma: p, email: '', resp: '', seg: '', fa: false, data: '' }); db.set('mapa', l); draw(); };
  };
  draw();
};

// Aba "Mapa de Contas" (administrador): somente as contas digitais.
V.mapa = (me, root) => { mapaContas(me, root); };

// Aba "Documentação IP" (administrador): documentos do Instituto Pangeia (módulo em documentos.js).
V.docip = (me, root) => {
  if (!window.PR_DOCUMENTOS) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo de documentos (arquivo documentos.js).</p>'; return; }
  window.PR_DOCUMENTOS.abrir(me, root, ajudaModulos(), 'mapa');
};

/* ---------- Alojamento (antes "Reservas de Alojamento" e "Apenas Alojamento"; Responsável de Reservas) ---------- */
// Quartos e camas: numeração contínua 01 a 12. Ímpares = cama de baixo, pares = cama de cima.
const QUARTOS = [['Paz', 1, 4], ['Força', 5, 8], ['Alegria', 9, 12]];
const NCAMAS = 12;
const quartoDe = n => (QUARTOS.find(q => n >= q[1] && n <= q[2]) || ['?'])[0];
const nivelCama = n => n % 2 ? 'baixo' : 'cima';
const pad2 = n => String(n).padStart(2, '0');
const camaTxt = n => `Cama ${pad2(n)} (${nivelCama(n)}) - Quarto ${quartoDe(n)}`;
const addDia = (d, k) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + k); return x.toISOString().slice(0, 10); };
const fimEf = r => r.saida > r.chegada ? r.saida : addDia(r.chegada, 1);
const choca = (a, b) => a.chegada < fimEf(b) && b.chegada < fimEf(a);
const pedidos = () => db.get('pedidos', []);
// Camas já ocupadas por reservas confirmadas que coincidem com o período do pedido r
const ocupadas = r => { const m = {}; pedidos().filter(p => p.status === 'confirmada' && p.id !== r.id && choca(p, r)).forEach(p => (p.camas || []).forEach(c => { m[c.cama] = p; })); return m; };

// ASSEFAZ: local externo ao Parque, próximo, usado quando o Alojamento não comporta ou não serve à pessoa.
// Só é feito depois do pedido e de o responsável alinhar com quem pediu. Cada item de r.assefaz = { id, pessoa, status, obs, criado }
// status: 'alinhando' (conversando com a pessoa) | 'confirmada' (a pessoa aceitou) | 'recusada' (a pessoa preferiu não ir).
// Recebimentos (Parque ou ASSEFAZ) ficam em r.pag = [{ id, local, valor, moeda, data, obs, conta }] e cada um vira uma Entrada em Prestação de Contas.
const ST_ASSEFAZ = { alinhando: 'Em alinhamento', confirmada: 'Confirmada', recusada: 'Não aceitou' };
const LOCAL = { parque: 'Alojamento Parque Retiro', assefaz: 'ASSEFAZ' };
const ORIG_ALOJ = 'Reservas de Alojamentos';
const noites = r => Math.max(1, Math.round((new Date(fimEf(r) + 'T12:00:00') - new Date(r.chegada + 'T12:00:00')) / 864e5));
const assefazDe = (r, st) => (r.assefaz || []).filter(a => !st || a.status === st);
const mesmoNome = (a, b) => norm(a || '') === norm(b || '');

V.reservas = (me, root) => {
  let sub = 'ped', dia = hoje(), rde = '', rate = '';
  const SUB = [['ped', 'Pedidos'], ['ocup', 'Ocupação'], ['novo', 'Registrar pedido'], ['rel', 'Relatório e recebimentos']];
  const salvar = l => db.set('pedidos', l);
  const info = r => `<p><strong>${esc(r.nome)}</strong> &middot; ${r.pessoas} pessoa(s) &middot; ${fmtData(r.chegada)} a ${fmtData(r.saida)}${r.hora ? ' &middot; chegada às ' + esc(r.hora) : ''}<br><small>${[r.telefone, r.email, r.cidade, r.comunidade].filter(Boolean).map(esc).join(' &middot; ')}</small></p>` +
    (r.necessidades ? `<p class="aviso-nec"><i class="fas fa-exclamation-circle"></i> <strong>Necessidades específicas:</strong> ${esc(r.necessidades)}${r.camaBaixa ? ' <strong>(cama de baixo)</strong>' : ''}</p>` : (r.camaBaixa ? '<p class="aviso-nec"><strong>Precisa de cama de baixo.</strong></p>' : '')) +
    (r.detalhes ? `<p><small>${esc(r.detalhes)}</small></p>` : '');
  const camasTxt = r => {
    const l = (r.camas || []).map(c => `${esc(c.pessoa)}: ${camaTxt(c.cama)}`).concat(assefazDe(r).filter(a => a.status !== 'recusada').map(a => `${esc(a.pessoa)}: ASSEFAZ (externo)${a.status === 'alinhando' ? ' - aguardando resposta da pessoa' : ''}`));
    return l.length ? l.join('<br>') : 'Sem cama no alojamento';
  };
  const lancaConta = (r, local, v) => {
    const cs = db.get('contas', []), id = uid();
    cs.push({ id, data: v.data, desc: `Alojamento ${LOCAL[local]}: ${r.nome} (${fmtData(r.chegada)} a ${fmtData(r.saida)})${v.obs ? ' - ' + v.obs : ''}`, centro: 'Alojamento', tipo: 'Entrada', origem: ORIG_ALOJ, vaquinha: '', valor: v.valor, moeda: v.moeda, comp: '' });
    return db.set('contas', cs) ? id : '';
  };
  const temPag = r => (r.pag || []).length > 0;

  const cartao = r => {
    const oc = ocupadas(r), livres = [];
    for (let n = 1; n <= NCAMAS; n++) if (!oc[n] && (!r.camaBaixa || n % 2)) livres.push(n);
    const total = NCAMAS - Object.keys(oc).length;
    const fora = assefazDe(r, 'confirmada'), nCama = Math.max(0, r.pessoas - fora.length), nomeFora = fora.some(a => mesmoNome(a.pessoa, r.nome));
    let linhas = fora.length ? `<p class="tip-box"><i class="fas fa-map-marker-alt"></i> Na ASSEFAZ (confirmado): <strong>${fora.map(a => esc(a.pessoa)).join(', ')}</strong>. ${nCama ? 'Escolha a cama das demais pessoas.' : 'Ninguém deste pedido precisa de cama no Alojamento.'}</p>` : '';
    if (r.hospedagem) for (let i = 0; i < nCama; i++) linhas += `<div class="cama-linha"><input data-p="${i}" maxlength="80" value="${i === 0 && !nomeFora ? esc(r.nome) : ''}" placeholder="Nome da pessoa ${i + 1}" aria-label="Nome da pessoa ${i + 1}"><select data-c="${i}" aria-label="Cama da pessoa ${i + 1}"><option value="">Escolha a cama...</option>${livres.map(n => `<option value="${n}">${camaTxt(n)}</option>`).join('')}</select></div>`;
    return `<div class="pedido" data-id="${r.id}">${info(r)}<p class="vazio">${r.hospedagem ? `Camas livres no período: <strong>${total} de ${NCAMAS}</strong>${nCama > total ? ' <span class="badge-emprestado">Não há camas para todos</span>' : ''}` : 'Este pedido não precisa de cama no alojamento.'}</p>${linhas}<p class="form-erro" role="alert" hidden></p><button class="btn-visit" data-ok><i class="fas fa-check"></i> Confirmar</button> <button class="btn-visit" data-no style="background:#b3261e"><i class="fas fa-times"></i> Recusar</button> <button class="icon-btn" data-del="${r.id}" aria-label="Excluir pedido de ${esc(r.nome)}"><i class="fas fa-trash"></i></button></div>`;
  };

  const ped = el => {
    const ps = pedidos(), por = s => ps.filter(r => r.status === s).sort((a, b) => a.chegada.localeCompare(b.chegada));
    const pend = por('pendente'), conf = por('confirmada'), rec = por('recusada');
    el.innerHTML = `<h3><i class="fas fa-bed"></i> Pedidos de reserva</h3><p>Veja o pedido e indique o quarto e a cama de cada pessoa. <strong>Camas ímpares são as de baixo; pares, as de cima.</strong> Só aparecem camas livres no período solicitado, o que evita conflitos.</p>
    <h4>Aguardando resposta (${pend.length})</h4>${pend.length ? pend.map(cartao).join('') : '<p class="vazio">Nenhum pedido aguardando.</p>'}
    <h4>Confirmadas (${conf.length})</h4>${conf.length ? `<table class="doc-table"><thead><tr><th>Solicitante</th><th>Período</th><th>Quarto e cama</th><th></th></tr></thead><tbody>${conf.map(r => `<tr><td>${esc(r.nome)}<br><small>${r.pessoas} pessoa(s)</small></td><td>${fmtData(r.chegada)} a ${fmtData(r.saida)}</td><td>${camasTxt(r)}</td><td><button class="btn-visit" data-reab="${r.id}">Alterar camas</button> <button class="icon-btn" data-del="${r.id}" aria-label="Excluir reserva de ${esc(r.nome)}"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhuma reserva confirmada.</p>'}
    <h4>Recusadas (${rec.length})</h4>${rec.length ? `<table class="doc-table"><thead><tr><th>Solicitante</th><th>Período</th><th>Motivo</th><th></th></tr></thead><tbody>${rec.map(r => `<tr><td>${esc(r.nome)}</td><td>${fmtData(r.chegada)} a ${fmtData(r.saida)}</td><td>${esc(r.motivo) || '-'}</td><td><button class="btn-visit" data-reab="${r.id}">Reabrir</button> <button class="icon-btn" data-del="${r.id}" aria-label="Excluir pedido de ${esc(r.nome)}"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhum pedido recusado.</p>'}`;
    el.querySelectorAll('.pedido').forEach(box => {
      const er = $('.form-erro', box), falha = m => { er.textContent = m; er.hidden = false; };
      $('[data-ok]', box).onclick = () => {
        er.hidden = true;
        const l = pedidos(), x = l.find(r => r.id === box.dataset.id), camas = [];
        if (x.hospedagem) {
          const ns = [...box.querySelectorAll('[data-p]')], cs = [...box.querySelectorAll('[data-c]')];
          for (let i = 0; i < cs.length; i++) {
            const n = +cs[i].value; if (!n) return falha('Escolha a cama de cada pessoa.');
            camas.push({ pessoa: ns[i].value.trim() || 'Pessoa ' + (i + 1), cama: n });
          }
          if (new Set(camas.map(c => c.cama)).size < camas.length) return falha('Há duas pessoas na mesma cama.');
          const oc = ocupadas(x); if (camas.some(c => oc[c.cama])) return falha('Uma dessas camas já foi ocupada por outra reserva nesse período.');
        }
        x.status = 'confirmada'; x.camas = camas; x.motivo = ''; salvar(l); draw();
      };
      $('[data-no]', box).onclick = () => {
        const m = prompt('Motivo da recusa (opcional):'); if (m === null) return;
        const l = pedidos(), x = l.find(r => r.id === box.dataset.id); x.status = 'recusada'; x.motivo = m.trim(); x.camas = []; salvar(l); draw();
      };
    });
    el.querySelectorAll('[data-reab]').forEach(b => b.onclick = () => { const l = pedidos(), x = l.find(r => r.id === b.dataset.reab); x.status = 'pendente'; x.camas = []; x.motivo = ''; salvar(l); draw(); });
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const x = pedidos().find(r => r.id === b.dataset.del);
      if (x && temPag(x)) { alert('Este pedido tem recebimentos lançados na Prestação de Contas. Exclua primeiro os recebimentos na aba "Relatório e recebimentos".'); return; }
      if (confirm('Excluir este pedido?')) { salvar(pedidos().filter(r => r.id !== b.dataset.del)); draw(); }
    });
  };

  const ocup = el => {
    const ocupa = {};
    pedidos().filter(r => r.status === 'confirmada' && r.chegada <= dia && dia < fimEf(r)).forEach(r => (r.camas || []).forEach(c => { ocupa[c.cama] = c.pessoa; }));
    const n = Object.keys(ocupa).length;
    el.innerHTML = `<h3><i class="fas fa-door-open"></i> Ocupação do alojamento</h3>
    <div class="form-row"><label for="o-d">Data</label><input id="o-d" type="date" value="${dia}"></div>
    <div class="totais"><div><span>Camas ocupadas</span><strong>${n} de ${NCAMAS}</strong></div><div><span>Camas livres</span><strong>${NCAMAS - n}</strong></div></div>
    <div class="quartos">${QUARTOS.map(q => { let b = ''; for (let c = q[1]; c <= q[2]; c++) b += `<div class="cama ${ocupa[c] ? 'ocupada' : 'livre'}"><strong>${pad2(c)}</strong><small>${nivelCama(c)}</small><span>${ocupa[c] ? esc(ocupa[c]) : 'livre'}</span></div>`; return `<div class="quarto"><h4>Quarto ${q[0]}</h4>${b}</div>`; }).join('')}</div>
    <div id="o-as"></div>`;
    $('#o-d', el).onchange = e => { if (e.target.value) { dia = e.target.value; draw(); } };
    assefaz($('#o-as', el));
  };

  // ASSEFAZ (local externo, próximo ao Parque): o responsável só coloca alguém aqui depois do pedido e de alinhar com a pessoa.
  const assefaz = el => {
    const todos = [];
    pedidos().filter(r => r.status !== 'recusada').forEach(r => assefazDe(r).forEach(a => todos.push({ r, a })));
    const naData = todos.filter(x => x.a.status === 'confirmada' && x.r.chegada <= dia && dia < fimEf(x.r));
    const alin = todos.filter(x => x.a.status === 'alinhando').sort((a, b) => a.r.chegada.localeCompare(b.r.chegada));
    const elegiveis = pedidos().filter(r => ['pendente', 'confirmada'].includes(r.status) && fimEf(r) > hoje()).sort((a, b) => a.chegada.localeCompare(b.chegada));
    const per = r => `${fmtData(r.chegada)} a ${fmtData(r.saida)}`;
    const nomes = r => [r.nome, ...(r.camas || []).map(c => c.pessoa)].filter((n, i, l) => n && l.findIndex(m => mesmoNome(m, n)) === i);
    el.innerHTML = `<h3><i class="fas fa-map-marker-alt"></i> ASSEFAZ <small>(local externo ao Parque, próximo)</small></h3>
    <p>Use somente <strong>depois que o pedido foi feito e você alinhou com a pessoa</strong>. Primeiro registre como <em>Em alinhamento</em>; quando a pessoa responder, marque se <em>aceitou</em> ou <em>não quis</em>. Só quem aceitou conta como hospedado na ASSEFAZ.</p>
    <div class="totais"><div><span>Na ASSEFAZ em ${fmtData(dia)}</span><strong>${naData.length}</strong></div><div><span>Em alinhamento</span><strong>${alin.length}</strong></div></div>
    <h4>Hospedados na ASSEFAZ nesta data</h4>${naData.length ? `<table class="doc-table"><thead><tr><th>Pessoa</th><th>Pedido de</th><th>Período</th><th>Observação</th><th></th></tr></thead><tbody>${naData.map(({ r, a }) => `<tr><td>${esc(a.pessoa)}</td><td>${esc(r.nome)}</td><td>${per(r)}</td><td>${esc(a.obs) || '-'}</td><td><button class="icon-btn" data-asdel="${r.id}|${a.id}" aria-label="Remover ${esc(a.pessoa)} da ASSEFAZ"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Ninguém na ASSEFAZ nesta data.</p>'}
    <h4>Em alinhamento (aguardando a resposta da pessoa)</h4>${alin.length ? `<table class="doc-table"><thead><tr><th>Pessoa</th><th>Pedido de</th><th>Período</th><th>Observação</th><th></th></tr></thead><tbody>${alin.map(({ r, a }) => `<tr><td>${esc(a.pessoa)}</td><td>${esc(r.nome)}${r.status === 'pendente' ? '<br><small>pedido ainda aguardando resposta</small>' : ''}</td><td>${per(r)}</td><td>${esc(a.obs) || '-'}</td><td><button class="btn-visit" data-asok="${r.id}|${a.id}"><i class="fas fa-check"></i> Aceitou</button> <button class="btn-visit" data-asno="${r.id}|${a.id}" style="background:#b3261e"><i class="fas fa-times"></i> Não quis</button> <button class="icon-btn" data-asdel="${r.id}|${a.id}" aria-label="Remover ${esc(a.pessoa)} do alinhamento"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhuma pessoa em alinhamento.</p>'}
    <h4>Encaminhar uma pessoa para a ASSEFAZ</h4>${elegiveis.length ? `<form id="fas" class="form-reserva" novalidate>
      <div class="form-row"><label for="as-r">Pedido *</label><select id="as-r"><option value="">Escolha o pedido...</option>${elegiveis.map(r => `<option value="${r.id}">${esc(r.nome)} - ${per(r)} (${r.status === 'pendente' ? 'aguardando' : 'confirmado'})</option>`).join('')}</select></div>
      <div class="form-row"><label for="as-p">Nome da pessoa *</label><input id="as-p" maxlength="80" list="as-n" placeholder="Quem vai para a ASSEFAZ"><datalist id="as-n"></datalist></div>
      <div class="form-row"><label for="as-o">Observação</label><input id="as-o" maxlength="160" placeholder="Ex.: combinado por telefone em 10/10; precisa de transporte"></div>
      <p class="form-erro" id="as-er" role="alert" hidden></p><button class="btn-visit"><i class="fas fa-plus"></i> Registrar como em alinhamento</button></form>` : '<p class="vazio">Não há pedidos pendentes ou confirmados para encaminhar.</p>'}`;
    const achar = ref => { const [rid, aid] = ref.split('|'), l = pedidos(), r = l.find(x => x.id === rid); return { l, r, a: r && assefazDe(r).find(x => x.id === aid) }; };
    el.querySelectorAll('[data-asok]').forEach(b => b.onclick = () => {
      const { l, r, a } = achar(b.dataset.asok); if (!a) return;
      const cama = (r.camas || []).find(c => mesmoNome(c.pessoa, a.pessoa));
      if (cama && !confirm(`${a.pessoa} está na cama ${pad2(cama.cama)} do Alojamento neste pedido. Ao confirmar a ASSEFAZ essa cama será liberada. Continuar?`)) return;
      if (cama) r.camas = r.camas.filter(c => c !== cama);
      a.status = 'confirmada'; a.decidido = hoje(); salvar(l); draw();
    });
    el.querySelectorAll('[data-asno]').forEach(b => b.onclick = () => { const { l, a } = achar(b.dataset.asno); if (!a) return; a.status = 'recusada'; a.decidido = hoje(); salvar(l); draw(); });
    el.querySelectorAll('[data-asdel]').forEach(b => b.onclick = () => {
      const { l, r, a } = achar(b.dataset.asdel); if (!a) return;
      if (!confirm(`Remover ${a.pessoa} da ASSEFAZ?${a.status === 'confirmada' ? ' A pessoa ficará sem hospedagem neste pedido; para dar cama no Parque use "Alterar camas" na aba Pedidos.' : ''}`)) return;
      r.assefaz = r.assefaz.filter(x => x.id !== a.id); salvar(l); draw();
    });
    const f = $('#fas', el);
    if (f) {
      $('#as-r', el).onchange = e => { const r = pedidos().find(x => x.id === e.target.value); $('#as-n', el).innerHTML = r ? nomes(r).map(n => `<option value="${esc(n)}">`).join('') : ''; if (r && !$('#as-p', el).value) $('#as-p', el).value = r.nome; };
      f.onsubmit = e => {
        e.preventDefault();
        const er = $('#as-er', el), falha = m => { er.textContent = m; er.hidden = false; }, nome = $('#as-p', el).value.trim(), l = pedidos(), r = l.find(x => x.id === $('#as-r', el).value);
        if (!r) return falha('Escolha o pedido.'); if (!nome) return falha('Informe o nome da pessoa.');
        if (assefazDe(r).some(a => a.status !== 'recusada' && mesmoNome(a.pessoa, nome))) return falha('Essa pessoa já está na ASSEFAZ ou em alinhamento neste pedido.');
        if (assefazDe(r).filter(a => a.status !== 'recusada').length >= r.pessoas) return falha('Todas as pessoas deste pedido já foram encaminhadas à ASSEFAZ.');
        r.assefaz = (r.assefaz || []).filter(a => !(a.status === 'recusada' && mesmoNome(a.pessoa, nome))).concat({ id: uid(), pessoa: nome, status: 'alinhando', obs: $('#as-o', el).value.trim(), criado: hoje(), por: me.nome });
        if (!salvar(l)) return falha('Sem espaço no navegador para salvar.');
        draw();
      };
    }
  };

  const novo = el => {
    el.innerHTML = `<h3><i class="fas fa-plus-circle"></i> Registrar pedido recebido</h3><p>Use quando o pedido chegar por e-mail ou WhatsApp. Copie os dados para cá e depois indique as camas na aba Pedidos.</p>
    <form id="fn" class="form-reserva" novalidate>
      <div class="form-row"><label for="n-n">Nome *</label><input id="n-n" maxlength="80" required></div>
      <div class="form-row"><label for="n-t">Telefone</label><input id="n-t" type="tel" maxlength="30"></div>
      <div class="form-row"><label for="n-e">E-mail</label><input id="n-e" type="email" maxlength="80"></div>
      <div class="form-row"><label for="n-ci">Cidade</label><input id="n-ci" maxlength="60"></div>
      <div class="form-row"><label for="n-co">Comunidade / Organismo</label><input id="n-co" maxlength="80"></div>
      <div class="form-row"><label for="n-c">Dia de chegada *</label><input id="n-c" type="date" required></div>
      <div class="form-row"><label for="n-s">Dia de saída *</label><input id="n-s" type="date" required></div>
      <div class="form-row"><label for="n-h">Hora de chegada</label><input id="n-h" type="time"></div>
      <div class="form-row"><label for="n-p">Quantidade de pessoas *</label><input id="n-p" type="number" min="1" max="${NCAMAS}" value="1" required></div>
      <div class="form-row"><label><input type="checkbox" id="n-g" checked style="width:auto;margin-right:8px">Precisa de cama no alojamento</label></div>
      <div class="form-row"><label><input type="checkbox" id="n-b" style="width:auto;margin-right:8px">Precisa de cama de baixo</label></div>
      <div class="form-row"><label for="n-nec">Necessidades específicas</label><textarea id="n-nec" rows="2" maxlength="300"></textarea></div>
      <div class="form-row"><label for="n-d">Detalhes</label><textarea id="n-d" rows="3" maxlength="500"></textarea></div>
      <p class="form-erro" id="n-er" role="alert" hidden></p><button class="btn-visit btn-large"><i class="fas fa-save"></i> Registrar pedido</button></form>`;
    $('#fn', el).onsubmit = e => {
      e.preventDefault();
      const v = id => $('#' + id, el).value.trim(), er = $('#n-er', el), falha = m => { er.textContent = m; er.hidden = false; };
      const p = parseInt(v('n-p'), 10);
      if (!v('n-n') || !v('n-c') || !v('n-s')) return falha('Informe nome, chegada e saída.');
      if (v('n-s') < v('n-c')) return falha('A saída não pode ser antes da chegada.');
      if (!(p >= 1)) return falha('Informe a quantidade de pessoas.');
      if ($('#n-g', el).checked && p > NCAMAS) return falha('O alojamento tem ' + NCAMAS + ' camas. Divida o grupo em mais de um pedido.');
      const l = pedidos();
      l.push({ id: uid(), status: 'pendente', nome: v('n-n'), telefone: v('n-t'), email: v('n-e'), cidade: v('n-ci'), comunidade: v('n-co'), chegada: v('n-c'), saida: v('n-s'), hora: v('n-h'), pessoas: p, hospedagem: $('#n-g', el).checked, camaBaixa: $('#n-b', el).checked, necessidades: v('n-nec'), detalhes: v('n-d'), camas: [], criado: hoje(), por: me.nome });
      if (!salvar(l)) return falha('Sem espaço no navegador para salvar o pedido.');
      sub = 'ped'; draw();
    };
  };

  // Relatório consolidado do alojamento (Parque Retiro + ASSEFAZ) e registro dos recebimentos.
  // Cada recebimento vira uma Entrada em Prestação de Contas (centro Alojamento, origem Reservas de Alojamentos) e entra na planilha consolidada.
  const rel = el => {
    const dentro = (d, a, b) => !!d && (!a || d >= a) && (!b || d <= b);
    const conf = pedidos().filter(r => r.status === 'confirmada');
    const stays = [];
    conf.filter(r => dentro(r.chegada, rde, rate)).forEach(r => {
      (r.camas || []).forEach(c => stays.push({ local: 'parque', pessoa: c.pessoa, r, sit: `Cama ${pad2(c.cama)} - Quarto ${quartoDe(c.cama)}` }));
      assefazDe(r, 'confirmada').forEach(a => stays.push({ local: 'assefaz', pessoa: a.pessoa, r, sit: 'Confirmada' }));
    });
    const alin = pedidos().filter(r => r.status !== 'recusada' && dentro(r.chegada, rde, rate)).flatMap(r => assefazDe(r));
    const pags = [];
    const contas = new Set(db.get('contas', []).map(c => c.id));
    pedidos().forEach(r => (r.pag || []).forEach(g => { if (dentro(g.data, rde, rate)) pags.push({ r, g, ok: contas.has(g.conta) }); }));
    pags.sort((a, b) => b.g.data.localeCompare(a.g.data));
    stays.sort((a, b) => a.r.chegada.localeCompare(b.r.chegada) || a.pessoa.localeCompare(b.pessoa, 'pt-BR'));
    const porMoeda = l => { const t = {}; l.forEach(x => { t[x.g.moeda] = (t[x.g.moeda] || 0) + x.g.valor; }); const k = Object.keys(MOEDA).filter(m => t[m]); return k.length ? k.map(m => money(t[m], m)).join('<br>') : '-'; };
    const resumoLocal = lc => { const st = stays.filter(x => x.local === lc), pg = pags.filter(x => x.g.local === lc); return { n: st.length, d: st.reduce((t, x) => t + noites(x.r), 0), pg }; };
    const L = ['parque', 'assefaz'].map(lc => [lc, resumoLocal(lc)]);
    const temConf = conf.length > 0;
    const per = r => `${fmtData(r.chegada)} a ${fmtData(r.saida)}`;
    el.innerHTML = `<h3><i class="fas fa-chart-pie"></i> Relatório e recebimentos do alojamento</h3>
    <p>Controle do <strong>Alojamento do Parque Retiro</strong> e da <strong>ASSEFAZ</strong>. Os valores são recebidos e administrados pelo responsável desta área; cada recebimento registrado aqui entra automaticamente na Prestação de Contas e na planilha consolidada geral, na linha <strong>Reservas de Alojamentos</strong>.</p>
    <div class="rc-filtros no-print"><div class="form-row"><label for="r-de">Chegada / recebimento de</label><input id="r-de" type="date" value="${rde}"></div><div class="form-row"><label for="r-ate">até</label><input id="r-ate" type="date" value="${rate}"></div></div>
    <p class="no-print"><button class="btn-visit" id="r-p"><i class="fas fa-print"></i> Imprimir</button> <button class="btn-visit" id="r-c"><i class="fas fa-file-csv"></i> Baixar (CSV)</button> <button class="btn-visit" id="r-x" style="background:#6c7a7b">Limpar período</button></p>
    <h3 class="print-head">Parque de Estudo e Reflexão Retiro - Relatório do Alojamento (${rde || rate ? `${rde ? fmtData(rde) : 'início'} a ${rate ? fmtData(rate) : 'hoje'}` : 'todo o período'}) - ${fmtData(hoje())}</h3>
    <table class="doc-table"><thead><tr><th>Local</th><th>Hóspedes</th><th>Diárias (pessoa x noite)</th><th>Recebido</th></tr></thead><tbody>
      ${L.map(([lc, x]) => `<tr><td><strong>${LOCAL[lc]}</strong></td><td>${x.n}</td><td>${x.d}</td><td>${porMoeda(x.pg)}</td></tr>`).join('')}
      <tr><td><strong>Total</strong></td><td><strong>${L[0][1].n + L[1][1].n}</strong></td><td><strong>${L[0][1].d + L[1][1].d}</strong></td><td><strong>${porMoeda(pags)}</strong></td></tr></tbody></table>
    <p><small>ASSEFAZ: ${assefazDe({ assefaz: alin }, 'alinhando').length} em alinhamento &middot; ${assefazDe({ assefaz: alin }, 'recusada').length} não aceitaram. Hospedagens contadas pela data de chegada; recebimentos, pela data do recebimento.</small></p>
    <h4 class="no-print">Registrar recebimento</h4>
    ${temConf ? `<form id="fr" class="form-reserva no-print" novalidate>
      <div class="form-row"><label for="g-r">Reserva *</label><select id="g-r"><option value="">Escolha a reserva confirmada...</option>${conf.slice().sort((a, b) => b.chegada.localeCompare(a.chegada)).map(r => `<option value="${r.id}">${esc(r.nome)} - ${per(r)}</option>`).join('')}</select></div>
      <div class="form-row"><label for="g-l">Onde a pessoa ficou *</label><select id="g-l">${Object.entries(LOCAL).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      <div class="form-row"><label for="g-v">Valor recebido *</label><input id="g-v" type="number" min="0.01" step="0.01" placeholder="0,00"></div>
      <div class="form-row"><label for="g-m">Moeda / forma de pagamento *</label><select id="g-m">${Object.entries(MOEDA).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      <div class="form-row"><label for="g-d">Data do recebimento *</label><input id="g-d" type="date" value="${hoje()}"></div>
      <div class="form-row"><label for="g-o">Observação</label><input id="g-o" maxlength="120" placeholder="Ex.: 2 diárias de 3 pessoas"></div>
      <p class="form-erro" id="g-er" role="alert" hidden></p><button class="btn-visit"><i class="fas fa-save"></i> Registrar recebimento</button></form>` : '<p class="vazio no-print">Ainda não há reservas confirmadas.</p>'}
    <h4>Recebimentos (${pags.length})</h4>${pags.length ? `<table class="doc-table"><thead><tr><th>Data</th><th>Local</th><th>Reserva</th><th>Valor</th><th>Observação</th><th class="no-print"></th></tr></thead><tbody>${pags.map(({ r, g, ok }) => `<tr><td>${fmtData(g.data)}</td><td>${LOCAL[g.local]}</td><td>${esc(r.nome)}<br><small>${per(r)}</small></td><td>${money(g.valor, g.moeda)}<br><small>${esc(MOEDA[g.moeda])}</small></td><td>${esc(g.obs) || '-'}${ok ? '' : '<br><span class="badge-emprestado">Fora da Prestação de Contas</span>'}</td><td class="no-print"><button class="icon-btn" data-gdel="${r.id}|${g.id}" aria-label="Excluir recebimento"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhum recebimento no período.</p>'}
    <h4>Hospedagens confirmadas (${stays.length})</h4>${stays.length ? `<table class="doc-table"><thead><tr><th>Local</th><th>Hóspede</th><th>Pedido de</th><th>Período</th><th>Noites</th><th>Acomodação</th></tr></thead><tbody>${stays.map(x => `<tr><td>${LOCAL[x.local]}</td><td>${esc(x.pessoa)}</td><td>${esc(x.r.nome)}</td><td>${per(x.r)}</td><td>${noites(x.r)}</td><td>${esc(x.sit)}</td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhuma hospedagem confirmada no período.</p>'}`;
    const per2 = () => { rde = $('#r-de', el).value; rate = $('#r-ate', el).value; draw(); };
    $('#r-de', el).onchange = per2; $('#r-ate', el).onchange = per2;
    $('#r-x', el).onclick = () => { rde = ''; rate = ''; draw(); };
    $('#r-p', el).onclick = () => window.print();
    $('#r-c', el).onclick = () => {
      const rows = [['Hospedagens'], ['Local', 'Hóspede', 'Pedido de', 'Chegada', 'Saída', 'Noites', 'Acomodação']].concat(stays.map(x => [LOCAL[x.local], x.pessoa, x.r.nome, fmtData(x.r.chegada), fmtData(x.r.saida), noites(x.r), x.sit]));
      rows.push([], ['Recebimentos'], ['Data', 'Local', 'Reserva', 'Chegada', 'Saída', 'Valor', 'Moeda', 'Observação']);
      pags.forEach(({ r, g }) => rows.push([fmtData(g.data), LOCAL[g.local], r.nome, fmtData(r.chegada), fmtData(r.saida), String(g.valor).replace('.', ','), MOEDA[g.moeda], g.obs || '']));
      rows.push([], [`Período: ${rde || rate ? `${rde ? fmtData(rde) : 'início'} a ${rate ? fmtData(rate) : 'hoje'}` : 'todo o período'} | Gerado em ${fmtData(hoje())}`]);
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = `relatorio-alojamento-${hoje()}.csv`; a.click();
    };
    el.querySelectorAll('[data-gdel]').forEach(b => b.onclick = () => {
      if (!confirm('Excluir este recebimento? O lançamento correspondente também será removido da Prestação de Contas e da planilha consolidada.')) return;
      const [rid, gid] = b.dataset.gdel.split('|'), l = pedidos(), r = l.find(x => x.id === rid), g = r && (r.pag || []).find(x => x.id === gid); if (!g) return;
      if (g.conta) db.set('contas', db.get('contas', []).filter(c => c.id !== g.conta));
      r.pag = r.pag.filter(x => x.id !== gid); salvar(l); draw();
    });
    const f = $('#fr', el);
    if (f) f.onsubmit = e => {
      e.preventDefault();
      const er = $('#g-er', el), falha = m => { er.textContent = m; er.hidden = false; }, v = Math.round(parseFloat($('#g-v', el).value) * 100) / 100, d = $('#g-d', el).value, lc = $('#g-l', el).value;
      const l = pedidos(), r = l.find(x => x.id === $('#g-r', el).value);
      if (!r) return falha('Escolha a reserva.');
      if (!(v > 0) || !d) return falha('Informe um valor maior que zero e a data.');
      if (lc === 'parque' && !(r.camas || []).length) return falha('Esta reserva não tem pessoas no Alojamento do Parque. Escolha ASSEFAZ ou ajuste as camas.');
      if (lc === 'assefaz' && !assefazDe(r, 'confirmada').length) return falha('Esta reserva não tem ninguém confirmado na ASSEFAZ.');
      const dados = { data: d, valor: v, moeda: $('#g-m', el).value, obs: $('#g-o', el).value.trim() }, conta = lancaConta(r, lc, dados);
      if (!conta) return falha('Não foi possível lançar na Prestação de Contas (espaço do navegador cheio?).');
      r.pag = (r.pag || []).concat({ id: uid(), local: lc, ...dados, conta, por: me.nome });
      if (!salvar(l)) { db.set('contas', db.get('contas', []).filter(c => c.id !== conta)); return falha('Não foi possível salvar o recebimento.'); }
      draw();
    };
  };

  const draw = () => {
    root.innerHTML = `<div class="tabs sub" role="tablist">${SUB.map(t => `<button class="tab-btn${t[0] === sub ? ' active' : ''}" data-s="${t[0]}">${t[1]}</button>`).join('')}</div><div id="sub"></div>`;
    root.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sub = b.dataset.s; draw(); });
    ({ ped, ocup, novo, rel })[sub]($('#sub', root));
  };
  draw();
};

/* ---------- Estela (Responsável pela Estela) ---------- */
// Etapa 1: cadastro dos dados da pessoa. Etapa 2: decidir quais nomes ficam públicos na página Estela Virtual.
// pub: true = público | false = privado | null = aguardando decisão. Cadastros antigos (sem o campo pub) já eram públicos e continuam assim.
const ordNomes = l => l.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
const estPub = n => n.pub === undefined ? true : n.pub;
const CONTRIB = { direta: 'Direta', indireta: 'Indireta' };
const estBadge = n => { const p = estPub(n); return p === true ? '<span class="est-badge est-pub">Público</span>' : p === false ? '<span class="est-badge est-priv">Privado</span>' : '<span class="est-badge est-pend">Aguardando decisão</span>'; };
V.estela = (me, root) => {
  let etapa = 1, editId = '', msg = '', fil = 'pend', q1 = '', q2 = '';
  const lista = () => db.get('estela', []);
  const nPend = () => lista().filter(n => estPub(n) === null).length;

  const etapa1 = el => {
    const ns = ordNomes(lista()), ed = ns.find(n => n.id === editId) || {};
    el.innerHTML = `<p>Cadastre aqui os dados de cada pessoa que contribuiu, direta ou indiretamente, na construção do Parque. Nada fica público neste momento: depois de cadastrar, vá à <strong>Etapa 2</strong> para decidir quais nomes aparecem na <a href="estela-virtual.html">Estela Virtual</a>.</p>
    <form id="fe" class="form-reserva" novalidate>
      <h4 style="margin-top:0">${ed.id ? 'Editar cadastro' : 'Novo cadastro'}</h4>
      <div class="form-row"><label for="e-n">Nome completo *</label><input id="e-n" type="text" maxlength="120" required value="${esc(ed.nome)}"></div>
      <div class="form-row"><label for="e-t">Tipo de contribuição</label><select id="e-t"><option value="">Não informado</option>${Object.entries(CONTRIB).map(([k, v]) => `<option value="${k}"${ed.contrib === k ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="form-row"><label for="e-d">Como contribuiu</label><textarea id="e-d" rows="3" maxlength="400" placeholder="Ex.: trabalhou na construção da Sala, doou materiais, participou dos mutirões...">${esc(ed.descricao)}</textarea></div>
      <div class="form-row"><label for="e-p">Período da contribuição</label><input id="e-p" type="text" maxlength="40" placeholder="Ex.: 2012 a 2016" value="${esc(ed.periodo)}"></div>
      <div class="form-row"><label for="e-c">Cidade / Comunidade</label><input id="e-c" type="text" maxlength="80" value="${esc(ed.cidade)}"></div>
      <div class="form-row"><label for="e-m">Contato (e-mail ou WhatsApp)</label><input id="e-m" type="text" maxlength="100" value="${esc(ed.contato)}"></div>
      <div class="form-row"><label for="e-o">Observações internas</label><textarea id="e-o" rows="2" maxlength="300" placeholder="Visível apenas nesta área restrita">${esc(ed.obs)}</textarea></div>
      <p class="tip-box"><i class="fas fa-lock"></i> Somente o <strong>nome completo</strong> pode ser publicado. Os demais dados ficam apenas na área restrita.</p>
      <p class="form-erro" id="e-er" role="alert" hidden></p>${msg ? `<p class="tip-box" role="status">${esc(msg)} ${nPend() ? '<button type="button" class="btn-visit" id="e-go">Ir para a Etapa 2</button>' : ''}</p>` : ''}
      <button class="btn-visit btn-large"><i class="fas fa-save"></i> ${ed.id ? 'Salvar alterações' : 'Salvar cadastro'}</button>
      ${ed.id ? ' <button type="button" class="btn-visit" id="e-cancel" style="background:#6c7a7b">Cancelar edição</button>' : ''}</form>
    <details class="est-lote"><summary>Cadastrar vários nomes de uma vez (só o nome, completar os dados depois)</summary>
      <div class="form-row"><label for="e-lote">Nomes completos (um por linha)</label><textarea id="e-lote" rows="5" placeholder="Maria da Silva&#10;João de Souza"></textarea></div>
      <p class="form-erro" id="e-er2" role="alert" hidden></p><button type="button" class="btn-visit" id="e-lote-b"><i class="fas fa-plus-circle"></i> Cadastrar nomes</button></details>
    <h4>Pessoas cadastradas (${ns.length})</h4>
    <div class="form-row"><label for="e-q">Buscar nome</label><input id="e-q" type="search" value="${esc(q1)}"></div><div id="e-l"></div>`;
    msg = '';
    const go = $('#e-go', el); if (go) go.onclick = () => { etapa = 2; fil = 'pend'; draw(); };
    const lst = () => {
      q1 = $('#e-q', el).value.trim(); const q = norm(q1), f = ns.filter(n => !q || norm(n.nome + ' ' + (n.cidade || '')).includes(q));
      $('#e-l', el).innerHTML = f.length ? `<table class="doc-table"><thead><tr><th>Nome</th><th>Contribuição</th><th>Cidade / Comunidade</th><th>Situação</th><th></th></tr></thead><tbody>${f.map(n => `<tr><td>${esc(n.nome)}</td><td>${esc(CONTRIB[n.contrib] || '-')}</td><td>${esc(n.cidade) || '-'}</td><td>${estBadge(n)}</td><td style="white-space:nowrap"><button class="icon-btn edit" data-ed="${n.id}" aria-label="Editar ${esc(n.nome)}"><i class="fas fa-pen"></i></button><button class="icon-btn" data-del="${n.id}" aria-label="Remover ${esc(n.nome)}"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhum nome encontrado.</p>';
      el.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { editId = b.dataset.ed; draw(); $('#fe').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Remover esta pessoa do cadastro da Estela?')) { db.set('estela', lista().filter(n => n.id !== b.dataset.del)); if (editId === b.dataset.del) editId = ''; draw(); } });
    };
    $('#e-q', el).oninput = lst; lst();
    const cancel = $('#e-cancel', el); if (cancel) cancel.onclick = () => { editId = ''; draw(); };
    $('#fe', el).onsubmit = e => {
      e.preventDefault();
      const er = $('#e-er', el), nome = $('#e-n', el).value.trim().replace(/\s+/g, ' ');
      const falha = m => { er.textContent = m; er.hidden = false; };
      if (!nome) return falha('Informe o nome completo.');
      const l = lista();
      if (l.some(n => n.id !== editId && norm(n.nome) === norm(nome))) return falha('Já existe uma pessoa cadastrada com este nome.');
      const dados = { nome, contrib: $('#e-t', el).value, descricao: $('#e-d', el).value.trim(), periodo: $('#e-p', el).value.trim(), cidade: $('#e-c', el).value.trim(), contato: $('#e-m', el).value.trim(), obs: $('#e-o', el).value.trim() };
      if (editId) { const i = l.findIndex(n => n.id === editId); if (i >= 0) l[i] = { ...l[i], ...dados }; }
      else l.push({ id: uid(), ...dados, pub: null, cad: hoje(), por: me.nome });
      if (!db.set('estela', l)) return falha('Sem espaço no navegador para salvar.');
      msg = editId ? 'Cadastro atualizado.' : 'Cadastro salvo. A pessoa aguarda a decisão de publicação (Etapa 2).'; editId = ''; draw();
    };
    $('#e-lote-b', el).onclick = () => {
      const er = $('#e-er2', el), linhas = $('#e-lote', el).value.split('\n').map(s => s.trim().replace(/\s+/g, ' ')).filter(Boolean);
      if (!linhas.length) { er.textContent = 'Digite ao menos um nome.'; er.hidden = false; return; }
      const l = lista(), ja = new Set(l.map(n => norm(n.nome)));
      let novos = 0, rep = 0;
      linhas.slice(0, 500).forEach(nome => { const k = norm(nome); if (ja.has(k)) { rep++; return; } ja.add(k); l.push({ id: uid(), nome: nome.slice(0, 120), pub: null, cad: hoje(), por: me.nome }); novos++; });
      if (!db.set('estela', l)) { er.textContent = 'Sem espaço no navegador para salvar.'; er.hidden = false; return; }
      msg = `${novos} nome(s) cadastrado(s)${rep ? ` e ${rep} já constava(m)` : ''}.`; draw();
    };
  };

  const etapa2 = el => {
    const todos = ordNomes(lista()), cont = { pend: 0, pub: 0, priv: 0 };
    todos.forEach(n => { const p = estPub(n); cont[p === true ? 'pub' : p === false ? 'priv' : 'pend']++; });
    el.innerHTML = `<p>Decida quais nomes aparecem na página pública <a href="estela-virtual.html" target="_blank" rel="noopener">Estela Virtual</a>. Apenas o <strong>nome completo</strong> é exibido; os outros dados continuam somente na área restrita. Nomes marcados como <em>Privado</em> ou <em>Aguardando decisão</em> não aparecem.</p>
    <div class="totais"><div><span>Aguardando decisão</span><strong>${cont.pend}</strong></div><div><span>Públicos</span><strong>${cont.pub}</strong></div><div><span>Privados</span><strong>${cont.priv}</strong></div></div>
    <div class="rc-filtros no-print"><div class="form-row"><label for="e2-f">Mostrar</label><select id="e2-f">${[['pend', 'Aguardando decisão'], ['pub', 'Públicos'], ['priv', 'Privados'], ['todos', 'Todos']].map(o => `<option value="${o[0]}"${fil === o[0] ? ' selected' : ''}>${o[1]}</option>`).join('')}</select></div>
    <div class="form-row"><label for="e2-q">Buscar nome</label><input id="e2-q" type="search" value="${esc(q2)}"></div></div>
    <div class="est-bulk no-print"><label><input type="checkbox" id="e2-all"> Selecionar todos da lista</label>
      <button type="button" class="btn-visit" id="e2-pub"><i class="fas fa-eye"></i> Tornar públicos os selecionados</button>
      <button type="button" class="btn-visit" id="e2-priv" style="background:#6c7a7b"><i class="fas fa-eye-slash"></i> Manter privados os selecionados</button></div>
    <div id="e2-l"></div>`;
    const visiveis = () => { const q = norm(q2); return todos.filter(n => { const p = estPub(n); const k = p === true ? 'pub' : p === false ? 'priv' : 'pend'; return (fil === 'todos' || fil === k) && (!q || norm(n.nome).includes(q)); }); };
    const aplica = (ids, v) => { if (!ids.length) return; const s = new Set(ids), l = lista(); l.forEach(n => { if (s.has(n.id)) n.pub = v; }); if (!db.set('estela', l)) { alert('Sem espaço no navegador para salvar.'); return; } draw(); };
    const lst = () => {
      const f = visiveis();
      $('#e2-l', el).innerHTML = f.length ? `<table class="doc-table"><thead><tr><th class="no-print"></th><th>Nome</th><th>Contribuição</th><th>Cidade / Comunidade</th><th>Situação</th><th class="no-print">Publicar na Estela?</th></tr></thead><tbody>${f.map(n => { const p = estPub(n); return `<tr><td class="no-print"><input type="checkbox" class="e2-ck" value="${n.id}" aria-label="Selecionar ${esc(n.nome)}"></td><td>${esc(n.nome)}</td><td>${esc(CONTRIB[n.contrib] || '-')}</td><td>${esc(n.cidade) || '-'}</td><td>${estBadge(n)}</td><td class="no-print est-seg"><button type="button" class="${p === true ? 'on' : ''}" data-s="${n.id}|1">Público</button><button type="button" class="${p === false ? 'on' : ''}" data-s="${n.id}|0">Privado</button></td></tr>`; }).join('')}</tbody></table>` : `<p class="vazio">${todos.length ? 'Nenhum nome nesta lista.' : 'Nenhuma pessoa cadastrada ainda. Faça o cadastro na Etapa 1.'}</p>`;
      el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { const [id, v] = b.dataset.s.split('|'); aplica([id], v === '1'); });
      $('#e2-all', el).checked = false;
    };
    const marcados = () => [...el.querySelectorAll('.e2-ck:checked')].map(c => c.value);
    $('#e2-f', el).onchange = e => { fil = e.target.value; draw(); };
    $('#e2-q', el).oninput = e => { q2 = e.target.value.trim(); lst(); };
    $('#e2-all', el).onchange = e => el.querySelectorAll('.e2-ck').forEach(c => { c.checked = e.target.checked; });
    $('#e2-pub', el).onclick = () => { const m = marcados(); if (!m.length) return alert('Marque ao menos um nome.'); aplica(m, true); };
    $('#e2-priv', el).onclick = () => { const m = marcados(); if (!m.length) return alert('Marque ao menos um nome.'); aplica(m, false); };
    lst();
  };

  const draw = () => {
    const n = lista().length, p = nPend();
    root.innerHTML = `<h3><i class="fas fa-monument"></i> Estela do Parque Retiro</h3>
    <div class="tabs sub no-print" role="tablist"><button class="tab-btn${etapa === 1 ? ' active' : ''}" data-et="1">1. Cadastro de pessoas (${n})</button><button class="tab-btn${etapa === 2 ? ' active' : ''}" data-et="2">2. Publicação na Estela${p ? ` <span class="badge st-pendente" title="Aguardando decisão">${p}</span>` : ''}</button></div><div id="est-corpo"></div>`;
    root.querySelectorAll('[data-et]').forEach(b => b.onclick = () => { etapa = +b.dataset.et; msg = ''; if (etapa === 1) editId = ''; draw(); });
    (etapa === 1 ? etapa1 : etapa2)($('#est-corpo', root));
  };
  draw();
};

/* ---------- Álbum Parque Retiro (Responsável pelo Álbum) ---------- */
const FOTO_ST = { pendente: ['Aguardando curadoria', 'badge-pend'], publicada: ['Publicada na área aberta', 'badge-disponivel'], recusada: ['Não publicada', 'badge-emprestado'] };
const fotoOk = f => f && /^data:image\//.test(f.foto || '');
const EV_SEED = ['Estacional de Primavera', 'Estacional de Verão', 'Estacional de Outono', 'Estacional de Inverno', 'Reunião de Escola', 'Aniversário Parque'];
const eventos = () => {
  let l = db.get('eventos', null);
  if (!l) { l = EV_SEED.map((nome, i) => ({ id: 'ev' + (i + 1), nome })); db.set('eventos', l); }
  return l;
};
const nomeEv = id => (eventos().find(e => e.id === id) || { nome: '' }).nome;
const evOpts = sel => `<option value="">Sem atividade</option>${eventos().map(e => `<option value="${e.id}"${e.id === sel ? ' selected' : ''}>${esc(e.nome)}</option>`).join('')}`;
const novoEvento = nome => { nome = String(nome || '').trim().replace(/\s+/g, ' ').slice(0, 80); if (!nome) return null; const l = eventos(), ja = l.find(e => norm(e.nome) === norm(nome)); if (ja) return ja.id; const id = uid(); l.push({ id, nome }); db.set('eventos', l); return id; };
const fotoLinha = f => `<small>Foto: ${esc(f.autor || 'não informado')}${f.dataFoto ? ' &middot; dia ' + fmtData(f.dataFoto) : ''}</small>`;
const baixar = f => `<a class="btn-visit" href="${esc(f.foto)}" download="foto-parque-retiro-${esc(f.id)}.jpg"><i class="fas fa-download"></i> Baixar</a>`;

V.album = (me, root) => {
  const cur = tem(me, 'album');
  let sub = 'minhas', filtro = 'pendente', evF = '*', msg = '';
  const SUB = [['minhas', 'Enviar e minhas fotos'], ['todas', 'Fotos por atividade']].concat(cur ? [['cur', 'Curadoria'], ['evs', 'Atividades']] : []);
  const todas = () => db.get('album', []).filter(fotoOk);
  const evFiltro = () => `<div class="form-row"><label for="a-ev">Atividade</label><select id="a-ev"><option value="*">Todas as atividades</option>${eventos().map(e => `<option value="${e.id}"${evF === e.id ? ' selected' : ''}>${esc(e.nome)}</option>`).join('')}<option value=""${evF === '' ? ' selected' : ''}>Sem evento</option></select></div>`;
  const passa = f => evF === '*' || (f.evento || '') === evF || (evF === '' && !nomeEv(f.evento));
  const cartao = (f, acoes) => `<figure class="foto-card"><img src="${esc(f.foto)}" alt="${esc(f.legenda || 'Foto enviada por ' + (f.autor || 'autor não informado'))}" loading="lazy"><figcaption>${f.legenda ? `<span>${esc(f.legenda)}</span>` : ''}<small class="ev-nome">${esc(nomeEv(f.evento) || 'Sem evento')}</small>${fotoLinha(f)}<small>Nome do autor na área aberta: <strong>${f.mostrarAutor ? 'Sim' : 'Não'}</strong></small><span class="badge-status ${FOTO_ST[f.status][1]}">${FOTO_ST[f.status][0]}</span><span class="acoes">${acoes}</span></figcaption></figure>`;
  const muda = (id, fn) => { const l = db.get('album', []), x = l.find(f => f.id === id); if (x) fn(x); db.set('album', l); draw(); };
  const exclui = id => { if (confirm('Excluir esta foto?')) { db.set('album', db.get('album', []).filter(f => f.id !== id)); draw(); } };
  const liga = el => {
    el.querySelectorAll('[data-x]').forEach(b => b.onclick = () => exclui(b.dataset.x));
    const s = $('#a-ev', el); if (s) s.onchange = () => { evF = s.value; draw(); };
  };

  const minhas = el => {
    const mias = todas().filter(f => f.email === me.email).sort((a, b) => b.data.localeCompare(a.data));
    el.innerHTML = `<h3><i class="fas fa-images"></i> Álbum Parque Retiro</h3><p>Envie as fotos que você acha mais bonitas do Parque. A curadoria escolhe quais aparecem na área aberta (<a href="fotos.html">O Parque &rsaquo; Atividades &rsaquo; Álbum de fotos</a>).</p>
    <form id="ff" class="form-reserva" novalidate>
      <div class="form-row"><label for="a-f">Fotos (até 10 por envio) *</label><input id="a-f" type="file" accept="image/png,image/jpeg,image/webp" multiple></div>
      <div class="form-row"><label for="a-e">Atividade *</label><select id="a-e">${evOpts('')}<option value="__novo">＋ Criar nova atividade...</option></select></div>
      <div class="form-row" id="a-nw" hidden><label for="a-n">Nome da nova atividade *</label><input id="a-n" maxlength="80"></div>
      <div class="form-row"><label for="a-d">Dia em que a foto foi tirada</label><input id="a-d" type="date" max="${hoje()}"></div>
      <div class="form-row"><label for="a-a">Autor da foto</label><input id="a-a" maxlength="80" value="${esc(me.nome)}"></div>
      <div class="form-row"><label for="a-m">Mostrar o nome do autor na área aberta do site?</label><select id="a-m"><option value="0">Não</option><option value="1">Sim</option></select></div>
      <div class="form-row"><label for="a-l">Legenda (opcional, vale para todas do envio)</label><input id="a-l" maxlength="120"></div>
      <p class="form-erro" id="a-er" role="alert" hidden></p>${msg ? `<p class="tip-box" role="status">${esc(msg)}</p>` : ''}
      <button class="btn-visit btn-large"><i class="fas fa-upload"></i> Enviar fotos</button></form>
    <h4>Minhas fotos (${mias.length})</h4>${mias.length ? `<div class="album-grid">${mias.map(f => cartao(f, baixar(f) + ` <button class="icon-btn" data-x="${f.id}" aria-label="Excluir foto"><i class="fas fa-trash"></i></button>`)).join('')}</div>` : '<p class="vazio">Você ainda não enviou fotos.</p>'}`;
    liga(el);
    $('#a-e', el).onchange = e => { $('#a-nw', el).hidden = e.target.value !== '__novo'; };
    $('#ff', el).onsubmit = async e => {
      e.preventDefault(); msg = '';
      const er = $('#a-er', el), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
      const fs = [...$('#a-f', el).files].filter(f => /^image\//.test(f.type)).slice(0, 10);
      if (!fs.length) return falha('Escolha ao menos uma imagem (JPG, PNG ou WEBP).');
      let ev = $('#a-e', el).value;
      if (ev === '__novo') { ev = novoEvento($('#a-n', el).value); if (!ev) return falha('Digite o nome da nova atividade.'); }
      const dados = { evento: ev, dataFoto: $('#a-d', el).value, autor: $('#a-a', el).value.trim(), mostrarAutor: $('#a-m', el).value === '1', legenda: $('#a-l', el).value.trim() };
      if (dados.mostrarAutor && !dados.autor) return falha('Para mostrar o autor, informe o nome do autor.');
      const l = db.get('album', []); let ok = 0;
      for (const f of fs) { try { l.push({ id: uid(), foto: await reduz(f, 1000, 0.7), ...dados, email: me.email, data: hoje(), status: 'pendente', origem: 'restrita' }); ok++; } catch (x) { /* ignora arquivo ilegível */ } }
      if (!ok) return falha('Não foi possível ler as imagens escolhidas.');
      if (!db.set('album', l)) return falha('Sem espaço no navegador. Exclua fotos antigas ou envie menos fotos.');
      msg = `${ok} foto(s) enviada(s). Elas aparecem na área aberta depois da curadoria.`; draw();
    };
  };

  const porEvento = el => {
    const fs = todas().filter(passa).sort((a, b) => (b.dataFoto || b.data).localeCompare(a.dataFoto || a.data));
    el.innerHTML = `<h3><i class="fas fa-folder-open"></i> Fotos por atividade</h3><p>Todas as fotos do Álbum. Aqui você pode baixá-las; na área aberta do site isso não é possível.</p>${evFiltro()}
    ${fs.length ? `<p class="vazio">${fs.length} foto(s).</p><div class="album-grid">${fs.map(f => cartao(f, baixar(f))).join('')}</div>` : '<p class="vazio">Nenhuma foto nesta atividade.</p>'}`;
    liga(el);
  };

  const curadoria = el => {
    const fs = todas(), cont = s => fs.filter(f => f.status === s).length;
    const F = [['pendente', 'Aguardando'], ['publicada', 'Publicadas'], ['recusada', 'Não publicadas'], ['todas', 'Todas']];
    const lista = fs.filter(f => filtro === 'todas' || f.status === filtro).sort((a, b) => b.data.localeCompare(a.data));
    el.innerHTML = `<h3><i class="fas fa-photo-video"></i> Curadoria do Álbum</h3><p>Somente as fotos <strong>publicadas</strong> aparecem na área aberta. Você também define a atividade de cada foto e se o nome do autor aparece.</p>
    <div class="tabs sub">${F.map(t => `<button class="tab-btn${t[0] === filtro ? ' active' : ''}" data-f="${t[0]}">${t[1]}${t[0] === 'todas' ? ` (${fs.length})` : ` (${cont(t[0])})`}</button>`).join('')}</div>
    ${lista.length ? `<div class="album-grid">${lista.map(f => cartao(f, `<select data-ev="${f.id}" aria-label="Atividade da foto">${evOpts(f.evento)}</select>` + (f.status !== 'publicada' ? `<button class="btn-visit" data-pub="${f.id}">Publicar</button>` : `<button class="btn-visit" data-des="${f.id}">Retirar da área aberta</button>`) + (f.status === 'pendente' ? `<button class="btn-visit" data-rec="${f.id}" style="background:#6c7a7b">Recusar</button>` : '') + `<button class="btn-visit" data-au="${f.id}" style="background:#6c7a7b">${f.mostrarAutor ? 'Ocultar autor' : 'Mostrar autor'}</button>` + baixar(f) + `<button class="icon-btn" data-x="${f.id}" aria-label="Excluir foto"><i class="fas fa-trash"></i></button>`)).join('')}</div>` : '<p class="vazio">Nenhuma foto nesta lista.</p>'}`;
    liga(el);
    el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filtro = b.dataset.f; draw(); });
    el.querySelectorAll('[data-pub]').forEach(b => b.onclick = () => muda(b.dataset.pub, x => { x.status = 'publicada'; }));
    el.querySelectorAll('[data-des]').forEach(b => b.onclick = () => muda(b.dataset.des, x => { x.status = 'pendente'; }));
    el.querySelectorAll('[data-rec]').forEach(b => b.onclick = () => muda(b.dataset.rec, x => { x.status = 'recusada'; }));
    el.querySelectorAll('[data-ev]').forEach(s => s.onchange = () => muda(s.dataset.ev, x => { x.evento = s.value; }));
    el.querySelectorAll('[data-au]').forEach(b => b.onclick = () => muda(b.dataset.au, x => { if (!x.mostrarAutor && !x.autor) { alert('Esta foto não tem autor informado.'); return; } x.mostrarAutor = !x.mostrarAutor; }));
  };

  const evs = el => {
    const fs = todas(), n = id => fs.filter(f => f.evento === id).length;
    el.innerHTML = `<h3><i class="fas fa-calendar-day"></i> Atividades do Álbum</h3><p>Renomeie, exclua ou crie atividades. Ao excluir uma atividade, as fotos <strong>não</strong> são apagadas: ficam como "Sem atividade".</p>
    <form id="fv" class="form-reserva" novalidate><div class="form-row"><label for="v-n">Criar nova atividade</label><input id="v-n" maxlength="80" placeholder="Ex.: Encontro de Jovens"></div><p class="form-erro" id="v-er" role="alert" hidden></p><button class="btn-visit"><i class="fas fa-plus-circle"></i> Criar atividade</button></form>
    <table class="doc-table"><thead><tr><th>Atividade</th><th>Fotos</th><th></th></tr></thead><tbody>${eventos().map(e => `<tr><td>${esc(e.nome)}</td><td>${n(e.id)}</td><td><button class="btn-visit" data-ren="${e.id}"><i class="fas fa-edit"></i> Renomear</button> <button class="icon-btn" data-exc="${e.id}" aria-label="Excluir ${esc(e.nome)}"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table>${eventos().length ? '' : '<p class="vazio">Nenhum evento. Crie o primeiro acima.</p>'}`;
    el.querySelectorAll('[data-ren]').forEach(b => b.onclick = () => {
      const l = eventos(), x = l.find(e => e.id === b.dataset.ren), nv = prompt('Novo nome da atividade:', x.nome);
      if (nv === null) return; const t = nv.trim().replace(/\s+/g, ' ').slice(0, 80); if (!t) return;
      if (l.some(e => e.id !== x.id && norm(e.nome) === norm(t))) return alert('Já existe uma atividade com esse nome.');
      x.nome = t; db.set('eventos', l); draw();
    });
    el.querySelectorAll('[data-exc]').forEach(b => b.onclick = () => {
      const x = eventos().find(e => e.id === b.dataset.exc), q = n(x.id);
      if (!confirm(`Excluir a atividade "${x.nome}"?${q ? ` As ${q} foto(s) ficarão sem atividade.` : ''}`)) return;
      db.set('eventos', eventos().filter(e => e.id !== x.id));
      const a = db.get('album', []); a.forEach(f => { if (f.evento === x.id) f.evento = ''; }); db.set('album', a); draw();
    });
    $('#fv', el).onsubmit = e => { e.preventDefault(); const er = $('#v-er', el); if (!novoEvento($('#v-n', el).value)) { er.textContent = 'Digite o nome da atividade.'; er.hidden = false; return; } draw(); };
  };

  const draw = () => {
    root.innerHTML = `<div class="tabs sub" role="tablist">${SUB.map(t => `<button class="tab-btn${t[0] === sub ? ' active' : ''}" data-s="${t[0]}">${t[1]}</button>`).join('')}</div><div id="sub"></div>`;
    root.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sub = b.dataset.s; msg = ''; draw(); });
    ({ minhas, todas: porEvento, cur: curadoria, evs })[sub]($('#sub', root));
  };
  draw();
};

/* ---------- Inventário (módulo em inventario.js) ---------- */
// Consulta: todos os usuários autorizados. Cadastro, movimentações e relatórios: administrador e Responsável pelo Inventário.
V.inventario = (me, root) => {
  if (!window.PR_INVENTARIO) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo Inventário (arquivo inventario.js).</p>'; return; }
  window.PR_INVENTARIO.abrir(me, root, { db, esc, $, uid, hoje, fmtData, csv, reduz, norm, tem, irPara });
};
// Reunião de Escola (módulo em reuniao.js): pesquisa de 2 datas de fim de semana, presença (presencial/virtual) e temas propostos por qualquer Mestre.
V.reuniao = (me, root) => {
  if (!window.PR_REUNIAO) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo Reunião de Escola (arquivo reuniao.js).</p>'; return; }
  window.PR_REUNIAO.abrir(me, root, ajudaModulos());
};
// Grupos de Discussão (módulo em grupos.js): grupos por tema com conversa, enquetes, presença, publicações aprovadas em 72 h e backup por sigla.
V.grupos = (me, root) => {
  if (!window.PR_GRUPOS) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo Grupos de Discussão (arquivo grupos.js).</p>'; return; }
  window.PR_GRUPOS.abrir(me, root, ajudaModulos());
};
// Compras e Orçamento (módulo em compras.js): pedidos com até 3 cotações, planejamento anual e consolidado.
V.compras = (me, root) => {
  if (!window.PR_COMPRAS) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo Compras e Orçamento (arquivo compras.js).</p>'; return; }
  window.PR_COMPRAS.abrir(me, root, ajudaModulos());
};
// Patrimônio (Administração): lista dos itens do Inventário marcados como patrimônio. Mesmo módulo, outra visão (inventario.js).
V.patrimonio = (me, root) => {
  if (!window.PR_INVENTARIO) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo Patrimônio (arquivo inventario.js).</p>'; return; }
  window.PR_INVENTARIO.abrir(me, root, { db, esc, $, uid, hoje, fmtData, csv, reduz, norm, tem, irPara, modo: 'patrimonio' });
};

/* ---------- Documentos e Calendários / Relatórios Consolidados (módulos em documentos.js e relatorios.js) ---------- */
// Ferramentas que o painel entrega aos módulos externos. Para um módulo novo ler dados existentes, acrescente aqui.
let irPara = null; // definido em painel(): abre outra aba do painel (usado pelos botões "Planejar publicações" dos calendários)
const ajudaModulos = () => ({ irPara, db, esc, $, uid, hoje, fmtData, csv, reduz, norm, tem, safeUrl, NIV, livros, emprest, exm, ativos, livre, pedidos, quartoDe, camaTxt, CC, MOEDA, money, normConta });
// Encomendas de livros (módulo em encomenda.js) para o responsável temporário de um lançamento; o Administrador usa a sub-aba da Livraria.
V.enc_livros = (me, root) => {
  if (!window.PR_ENCOMENDA) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo de encomendas (arquivo encomenda.js).</p>'; return; }
  window.PR_ENCOMENDA.painel(me, root, ajudaModulos());
};
// Comunicação e Redes Sociais (módulo em comunicacao.js): administrador e Responsável pela Comunicação.
V.comunicacao = (me, root) => {
  if (!window.PR_COMUNICACAO) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo Comunicação e Redes Sociais (arquivo comunicacao.js).</p>'; return; }
  window.PR_COMUNICACAO.abrir(me, root, ajudaModulos());
};
// Lojinha (módulo em lojinha.js): produtos, estoque, publicação no site, custos e preço, vendas. Vendas vão para Prestação de Contas (origem Lojinha).
// Voluntário (módulo em voluntario.js): inscrições de quem quer cooperar sem aporte financeiro. Jardinagem / Área Externa (jardinagem.js): planejamentos e documentos; fica direto em Comissões Parque Retiro.
// Atividades (módulo em atividades.js): registro escrito de eventos, encontros, retiros e reuniões, com banner do Início.
V.contatos = (me, root) => {
  if (!window.PR_EMAILMKT) { root.innerHTML = '<p class="vazio">Não foi possível carregar as Listas de e-mail (arquivo emailmkt.js).</p>'; return; }
  window.PR_EMAILMKT.abrirContatos(me, root);
};
// Comissões internas (módulo em comissoes-internas.js): Construção, Manutenção e Traduções. Só na área restrita, sem página pública.
['construcao', 'manutencao', 'traducoes'].forEach(k => {
  V[k] = (me, root) => {
    if (!window.PR_COMISSOES_INTERNAS) { root.innerHTML = '<p class="vazio">Não foi possível carregar as comissões internas (arquivo comissoes-internas.js).</p>'; return; }
    window.PR_COMISSOES_INTERNAS.abrir(k, me, root, ajudaModulos());
  };
});
V.multiuso = (me, root) => {
  if (!window.PR_MULTIUSO) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo Multiuso (arquivo multiuso.js).</p>'; return; }
  window.PR_MULTIUSO.abrir(me, root, ajudaModulos());
};
// Central de Ajuda (ajuda-admin.js): artigos, categorias, explicações rápidas, cobertura e publicação. Administrador e função 'ajuda'.
V.central_ajuda = (me, root) => {
  if (!window.PR_AJUDA_ADMIN || !window.PR_AJUDA) { root.innerHTML = '<p class="vazio">Não foi possível carregar a Central de Ajuda (arquivos ajuda.js e ajuda-admin.js).</p>'; return; }
  window.PR_AJUDA_ADMIN.abrir(me, root, ajudaModulos());
};
V.atividades = (me, root) => {
  if (!window.PR_ATIVIDADES) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo Atividades (arquivo atividades.js).</p>'; return; }
  window.PR_ATIVIDADES.abrir(me, root, ajudaModulos());
};
// Campanha Punta de Vacas (módulo em campanha.js): início e fim da campanha (viram atividade no calendário) e lista, só para consulta,
// de quem aportou. Os aportes entram pela Prestação de Contas (campo Campanha) ou pela Conciliação bancária do extrato.
V.campanha = (me, root) => {
  if (!window.PR_CAMPANHA) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo Campanha (arquivo campanha.js).</p>'; return; }
  window.PR_CAMPANHA.abrir(me, root, ajudaModulos());
};
V.voluntarios = (me, root) => {
  if (!window.PR_VOLUNTARIO) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo Voluntário (arquivo voluntario.js).</p>'; return; }
  window.PR_VOLUNTARIO.abrir(me, root, ajudaModulos());
};
V.jardinagem = (me, root) => {
  if (!window.PR_JARDINAGEM) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo Jardinagem / Área Externa (arquivo jardinagem.js).</p>'; return; }
  window.PR_JARDINAGEM.abrir(me, root, ajudaModulos());
};
// Rifa Solidária (módulo em rifa.js): cadastro das rifas, participantes e comprovantes, sorteio pela Loteria Federal e arrecadação.
// Cada participação confirmada é lançada em Prestação de Contas (origem Rifa Solidária) e entra na planilha consolidada em "Ajude o Parque".
V.rifa = (me, root) => {
  if (!window.PR_RIFA) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo Rifa Solidária (arquivo rifa.js).</p>'; return; }
  window.PR_RIFA.abrir(me, root, ajudaModulos());
};
// Vaquinha Coletiva (módulo em vaquinha.js): vaquinhas com meta, contribuições com comprovante e valor livre, gráfico da meta e arrecadação.
// Cada contribuição confirmada é lançada em Prestação de Contas (origem Vaquinha Coletiva) e entra na planilha consolidada em "Ajude o Parque".
V.vaquinha = (me, root) => {
  if (!window.PR_VAQUINHA) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo Vaquinha Coletiva (arquivo vaquinha.js).</p>'; return; }
  window.PR_VAQUINHA.abrir(me, root, ajudaModulos());
};
V.lojinha = (me, root) => {
  if (!window.PR_LOJINHA) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo Lojinha (arquivo lojinha.js).</p>'; return; }
  window.PR_LOJINHA.abrir(me, root, ajudaModulos());
};
V.documentos = (me, root) => {
  if (!window.PR_DOCUMENTOS) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo Documentos e Calendários (arquivo documentos.js).</p>'; return; }
  window.PR_DOCUMENTOS.abrir(me, root, ajudaModulos());
};
// Cada relatório só aparece para o administrador e para os responsáveis do módulo correspondente (regras em relatorios.js).
V.relatorios = (me, root) => {
  if (!window.PR_RELATORIOS) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo Relatórios Consolidados (arquivo relatorios.js).</p>'; return; }
  window.PR_RELATORIOS.abrir(me, root, ajudaModulos());
};

V.backup = (me, root) => {
  const D = window.PR_DADOS;
  if (!D) { root.innerHTML = '<p class="vazio">Não foi possível carregar dados.js.</p>'; return; }
  let baixou = false, lido = null, msg = '';
  const fmtB = n => n > 1048576 ? (n / 1048576).toFixed(2) + ' MB' : Math.round(n / 1024) + ' KB';
  // Modo servidor: dados que ficaram guardados NESTE navegador (do tempo do modo antigo) podem subir para o servidor.
  const NAO_LEVA = new Set(['users', 'meta']);
  const doNavegador = () => { const o = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('pr_') && !NAO_LEVA.has(k.slice(3))) { let v; try { v = JSON.parse(localStorage.getItem(k)); } catch (e) { continue; } o.push([k.slice(3), v]); } } } catch (e) { /* sem acesso */ } return o.sort((a, b) => a[0].localeCompare(b[0])); };
  const qtd = v => Array.isArray(v) ? v.length + ' item(ns)' : v && typeof v === 'object' ? Object.keys(v).length + ' campo(s)' : '1 valor';
  function blocoTrazer() {
    const l = doNavegador(); let feito = null; try { feito = localStorage.getItem('pr-migrado'); } catch (e) { /* ignora */ }
    if (!l.length) return '';
    return `<details class="tip-box" ${feito ? '' : 'open'}><summary><strong>Trazer os dados deste navegador para o servidor</strong> (${l.length} conjunto(s) de dados)${feito ? ' · já enviados em ' + esc(feito.slice(0, 10)) : ''}</summary>
      <p>Encontrei dados guardados <strong>neste navegador</strong>, do tempo em que a área restrita funcionava só no navegador. Ao enviar: o que ainda não existe no servidor entra inteiro; nas listas que já existem, entram só os itens que faltam (nada do servidor é apagado ou trocado). As pessoas não entram por aqui: são as contas do login.</p>
      <div style="overflow-x:auto;max-height:240px"><table class="doc-table"><thead><tr><th>Dados</th><th>Neste navegador</th><th>No servidor</th></tr></thead><tbody>${l.map(([k, v]) => { const sv = db.get(k, null); return `<tr><td>${esc(k)}</td><td>${qtd(v)}</td><td>${sv == null ? '—' : qtd(sv)}</td></tr>`; }).join('')}</tbody></table></div>
      <p><button type="button" class="btn-visit btn-large" id="bk-trazer"><i class="fas fa-cloud-upload-alt"></i> Enviar para o servidor</button></p></details>`;
  }
  async function trazer() {
    if (!confirm('Enviar os dados deste navegador para o servidor do Parque? Nada do que já está no servidor será apagado.')) return;
    let novos = 0, somados = 0, mantidos = 0;
    doNavegador().forEach(([k, v]) => {
      const sv = db.get(k, null);
      if (sv == null || (Array.isArray(sv) && !sv.length) || (sv && typeof sv === 'object' && !Array.isArray(sv) && !Object.keys(sv).length)) { db.set(k, v); novos++; return; }
      if (Array.isArray(sv) && Array.isArray(v)) {
        const chave = x => x && typeof x === 'object' && x.id != null ? 'id:' + x.id : JSON.stringify(x);
        const tem = new Set(sv.map(chave)), falta = v.filter(x => !tem.has(chave(x)));
        if (falta.length) { db.set(k, sv.concat(falta)); somados++; } else mantidos++;
        return;
      }
      mantidos++;
    });
    try { await D.sincronizar(); } catch (e) { msg = 'Parte dos dados ainda está sendo enviada (' + e.message + '). Deixe a página aberta e confira o aviso no alto.'; draw(); return; }
    try { localStorage.setItem('pr-migrado', new Date().toISOString()); } catch (e) { /* ignora */ }
    msg = `Pronto! ${novos} conjunto(s) entraram no servidor, ${somados} receberam itens que faltavam e ${mantidos} já estavam iguais (ou foram mantidos como estavam no servidor).`; draw();
  }
  const draw = () => {
    const u = D.uso(), d = D.diasDesdeBackup(), aud = D.auditoria().slice(-25).reverse(), lx = D.lixeira();
    const alerta = d === null ? 'Nenhum backup foi baixado ainda.' : d > 7 ? `O último backup foi há ${d} dias.` : '';
    root.innerHTML = `<h3><i class="fas fa-database"></i> Backup e Segurança</h3>
    ${D.modo === 'supabase' ? `<p class="tip-box" role="note">Os dados ficam no <strong>servidor do Parque</strong> (Supabase, São Paulo) e aparecem para todos os responsáveis. Mesmo assim, baixe o backup de vez em quando e guarde o arquivo em outro lugar.</p>${blocoTrazer()}` : '<p class="tip-box" role="note">Hoje os dados ficam <strong>neste navegador</strong>. Baixe o backup com frequência e guarde o arquivo em outro lugar (e-mail, nuvem, pen drive). Para uso em vários computadores e no aplicativo, o site precisa do servidor (veja docs/PLANO.md).</p>'}
    ${alerta ? `<p class="form-erro" role="alert">${esc(alerta)}</p>` : `<p class="vazio">Último backup há ${d} dia(s).</p>`}
    ${msg ? `<p class="tip-box" role="status">${esc(msg)}</p>` : ''}
    <p>Espaço usado no navegador: <strong>${fmtB(u.bytes)}</strong> de ~${fmtB(u.limiteAprox)} ${u.bytes > u.limiteAprox * 0.8 ? '<span class="form-erro">(quase cheio)</span>' : ''}</p>
    <p><button class="btn-visit" id="bk-baixar"><i class="fas fa-download"></i> Baixar backup completo</button></p>
    <h4>Restaurar de um backup</h4>
    <div class="form-row"><label for="bk-arq">Arquivo de backup (.json)</label><input id="bk-arq" type="file" accept="application/json,.json"></div>
    <div id="bk-prev"></div>
    <h4>Registro de alterações (últimas 25)</h4>
    ${aud.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Quando</th><th>Quem</th><th>Coleção</th><th>O que mudou</th></tr></thead><tbody>${aud.map(a => `<tr><td>${esc(a.t.slice(0, 19).replace('T', ' '))}</td><td>${esc(a.por)}</td><td>${esc(a.colecao)}</td><td>${a.restauradoDe ? 'Restauração de backup de ' + esc(a.restauradoDe.slice(0, 10)) : a.total === undefined ? 'alterado' : `+${a.novos} / ~${a.alterados} / −${a.removidos}`}</td></tr>`).join('')}</tbody></table></div>` : '<p class="vazio">Sem registros ainda.</p>'}
    <p class="vazio">Itens excluídos recuperáveis na lixeira: ${lx.length}. <button class="btn-visit" id="bk-lixo" ${lx.length ? '' : 'disabled'}>Baixar lixeira (JSON)</button></p>`;
    const bt = $('#bk-trazer', root); if (bt) bt.onclick = trazer;
    $('#bk-baixar', root).onclick = async () => { await D.baixarBackup(); baixou = true; msg = 'Backup baixado. Confira o arquivo na pasta de downloads.'; draw(); };
    $('#bk-lixo', root).onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(D.lixeira(), null, 1)], { type: 'application/json' })); a.download = 'lixeira-parque-retiro.json'; a.click(); };
    $('#bk-arq', root).onchange = async ev => {
      const f = ev.target.files[0]; if (!f) return;
      let obj; try { obj = JSON.parse(await f.text()); } catch (e) { $('#bk-prev', root).innerHTML = '<p class="form-erro">Arquivo ilegível (não é JSON).</p>'; return; }
      const v = await D.validarBackup(obj);
      if (!v.ok) { $('#bk-prev', root).innerHTML = `<p class="form-erro" role="alert">${esc(v.erros.join(' '))}</p>`; return; }
      lido = obj;
      $('#bk-prev', root).innerHTML = `<p>Backup de <strong>${esc(obj.criadoEm.slice(0, 19).replace('T', ' '))}</strong> por ${esc(obj.criadoPor)}. Integridade verificada.</p>
        <div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Coleção</th><th>Agora</th><th>No backup</th></tr></thead><tbody>${v.resumo.map(r => `<tr><td>${esc(r.colecao)}</td><td>${r.atual}</td><td>${r.backup}</td></tr>`).join('')}</tbody></table></div>
        <p class="form-erro">Restaurar SUBSTITUI os dados atuais pelos do backup. ${baixou ? 'O backup do estado atual já foi baixado.' : 'Antes, baixe o backup do estado atual (botão acima).'}</p>
        <button class="btn-visit" id="bk-rest" ${baixou ? '' : 'disabled'}>Restaurar este backup</button>`;
      $('#bk-rest', root).onclick = async () => {
        if (!confirm('Substituir TODOS os dados atuais pelo backup selecionado?')) return;
        try { await D.restaurarBackup(lido, { backupAtualBaixado: baixou }); msg = 'Backup restaurado com sucesso.'; lido = null; draw(); } catch (e) { msg = 'Falha ao restaurar: ' + e.message; draw(); }
      };
    };
  };
  draw();
};

/* Áreas do CONecta Retiro: cada ferramenta pertence a uma das duas áreas. Para uma ferramenta nova, acrescente-a em painel() e aqui. */
const AREAS = [
  { id: 'com', nome: 'Comissões Parque Retiro', icone: 'fa-users', desc: 'Ferramentas de cada comissão do Parque' },
  { id: 'adm', nome: 'Administração', icone: 'fa-user-shield', desc: 'Finanças, inventário, responsáveis e segurança' }
];
const AREA_DE = { enc_livros: 'com', contatos: 'com', acervo: 'com', zoom: 'com', reservas: 'com', estela: 'com', album: 'com', inventario: 'adm', patrimonio: 'adm', compras: 'adm', documentos: 'com', comunicacao: 'com', lojinha: 'com', rifa: 'com', vaquinha: 'com', voluntarios: 'com', jardinagem: 'com', construcao: 'com', manutencao: 'com', traducoes: 'com', atividades: 'com', campanha: 'com', reuniao: 'com', grupos: 'com', multiuso: 'com', ajude: 'com', vol_acoes: 'com', contas: 'adm', users: 'adm', mapa: 'adm', docip: 'adm', backup: 'adm', relatorios: 'adm', central_ajuda: 'adm' };
/* Ajude o Parque (dentro de Comissões Parque Retiro): visão geral de todas as vias de ajudar o Parque, na mesma ordem da área pública. */
const AJUDE_CARTOES = [
  ['lojinha', 'fa-store', 'Lojinha', 'Produtos artesanais do Parque: estoque, vendas e relatório.'],
  ['rifa', 'fa-ticket-alt', 'Rifa Solidária', 'Rifas em benefício do Parque: participantes, sorteio, arrecadação e uso do recurso.'],
  ['vaquinha', 'fa-hands-helping', 'Vaquinha Coletiva', 'Vaquinhas para custear uma necessidade específica do Parque.'],
  ['voluntarios', 'fa-hands-helping', 'Voluntário · Voluntários inscritos', 'Pessoas que querem cooperar com o seu tempo e o seu trabalho.'],
  ['vol_acoes', 'fa-clipboard-list', 'Voluntário · Ações de Voluntário', 'Crie ações com nome, objetivo, plano e tempo de duração.']
];
let ajudaAbertas = []; // abas das vias de ajuda que a pessoa logada pode abrir (preenchido em painel())
V.ajude = (me, root) => {
  const cartoes = AJUDE_CARTOES.filter(c => ajudaAbertas.includes(c[0]));
  root.innerHTML = `<h3><i class="fas fa-hand-holding-heart"></i> Ajude o Parque</h3>
  <p>Todas as vias de ajudar o Parque que você acompanha aqui na área restrita, na mesma ordem da página pública <strong>Ajude o Parque</strong>. Você também encontra cada uma delas no menu <strong>Ajude o Parque</strong>, em Comissões Parque Retiro.</p>
  <div class="content-grid">${cartoes.map(c => `<div class="card"><h3><i class="fas ${c[1]}"></i> ${esc(c[2])}</h3><p>${esc(c[3])}</p><button type="button" class="btn-visit" data-ir="${c[0]}">Abrir</button></div>`).join('')}</div>`;
  root.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => irPara(b.dataset.ir));
};
V.vol_acoes = (me, root) => {
  if (!window.PR_VOLUNTARIO || !window.PR_VOLUNTARIO.acoes) { root.innerHTML = '<p class="vazio">Não foi possível carregar as Ações de Voluntário (arquivo voluntario.js).</p>'; return; }
  window.PR_VOLUNTARIO.acoes(me, root, ajudaModulos());
};
/* Elementos (dentro de Comissões Parque Retiro): a Estela já existente + um campo de Descrição para cada elemento do Parque. */
const ELEMENTOS = [['sala', 'Sala', 'fa-door-open'], ['monolito', 'Monólito', 'fa-landmark'], ['portao', 'Portão', 'fa-archway'], ['fonte', 'Fonte', 'fa-water'], ['centro-trabalho', 'Centro de Trabalho', 'fa-tools'], ['centro-estudos', 'Centro de Estudos', 'fa-book-open'], ['oficinas', 'Oficinas', 'fa-hammer']];
// Grupos de abas dentro de uma área (ex.: Elementos, Ajude o Parque). Cada grupo é uma caixa flutuante que abre ao lado do botão do grupo.
// Uma aba entra num grupo por GRUPO_DE. Dentro de "Ajude o Parque", as ferramentas do Voluntário ficam sob um subtítulo (SUBGRUPO_DE).
const GRUPOS = [{ id: 'elementos', nome: 'Elementos', icone: 'fa-shapes' }, { id: 'ajude', nome: 'Ajude o Parque', icone: 'fa-hand-holding-heart' }];
const GRUPO_DE = { estela: 'elementos', ajude: 'ajude', lojinha: 'ajude', rifa: 'ajude', vaquinha: 'ajude', voluntarios: 'ajude', vol_acoes: 'ajude' };
const SUBGRUPO_DE = { voluntarios: 'Voluntário', vol_acoes: 'Voluntário' };
// Funções que dão acesso a alguma via de ajudar o Parque (a página "Ajude o Parque" aparece para quem tem ao menos uma delas).
const AJUDE_FUNC = ['lojinha', 'rifa', 'vaquinha', 'voluntario'];
ELEMENTOS.forEach(([id, nome, ic]) => {
  const k = 'el_' + id; AREA_DE[k] = 'com'; GRUPO_DE[k] = 'elementos';
  // Cada elemento tem só o campo Descrição (o que ele fará). Leitores veem; editores e administradores editam.
  V[k] = (me, root) => {
    const edita = NIV[me.nivel] >= 3;
    const reg = () => db.get('elementos', []).find(x => x.id === id) || {};
    const draw = (msg = '') => {
      const r = reg();
      root.innerHTML = `<h3><i class="fas ${ic}"></i> ${esc(nome)}</h3>
      <form id="fel" class="form-reserva" novalidate>
        <div class="form-row"><label for="el-d">Descrição</label><textarea id="el-d" rows="9" maxlength="4000" placeholder="Descreva o que o elemento ${esc(nome)} fará e para que servirá." ${edita ? '' : 'readonly'}>${esc(r.descricao || '')}</textarea></div>
        ${r.atualizadoEm ? `<p class="vazio">Última atualização: ${esc(fmtData(r.atualizadoEm))}${r.por ? ' por ' + esc(r.por) : ''}.</p>` : ''}
        ${msg ? `<p class="tip-box" role="status">${esc(msg)}</p>` : ''}
        ${edita ? '<button class="btn-visit btn-large"><i class="fas fa-save"></i> Salvar descrição</button>' : '<p class="vazio">Somente Editores e Administradores alteram a descrição.</p>'}
      </form>`;
      $('#fel', root).onsubmit = e => {
        e.preventDefault(); if (!edita) return;
        const l = db.get('elementos', []).filter(x => x.id !== id);
        l.push({ id, descricao: $('#el-d', root).value.trim(), atualizadoEm: hoje(), por: me.nome });
        db.set('elementos', l); draw('Descrição salva.');
      };
    };
    draw();
  };
});

/* ---------- Páginas ---------- */
function painel() {
  const SRV = window.PR_DADOS && PR_DADOS.modo === 'supabase', SB = window.PR_SUPABASE;
  if (SRV) {
    const s = SB.sessao(), est = PR_DADOS.estadoSync();
    if (!s || est.estado === 'sem-sessao') { sessionStorage.removeItem('pr_sess'); location.replace('login.html'); return; }
    sessionStorage.setItem('pr_sess', s.user.email);
    if (est.estado === 'offline' && !db.get('users', []).length) { $('#app').innerHTML = `<p class="tip-box" role="alert"><strong>Não foi possível falar com o servidor.</strong> Confira a internet e <a href="area-restrita.html">tente de novo</a>. ${esc(est.erro || '')}</p>`; return; }
  }
  const pendN = () => db.get('users', []).filter(u => statusDe(u) === 'pendente').length;
  let me = db.get('users', []).find(u => u.email === sessionStorage.getItem('pr_sess'));
  // Acesso temporário (script.js): enquanto estiver ativo, quem clicou na mandala entra sem login.
  const cfgTemp = window.PR_ACESSO_TEMPORARIO, temp = !!(cfgTemp && cfgTemp.ativo && sessionStorage.getItem('pr_temp') === '1');
  if (temp && (!me || statusDe(me) !== 'aprovado')) me = { email: 'acesso-temporario', nome: 'Acesso temporário', nivel: NIV[cfgTemp.nivel] ? cfgTemp.nivel : 'administrador', status: 'aprovado', funcoes: [] };
  if (!me || statusDe(me) !== 'aprovado') { sessionStorage.removeItem('pr_sess'); location.replace('login.html'); return; }
  const n = NIV[me.nivel];
  if (window.PR_IMP2611 && window.PR_IMP2611.autoImportar) window.PR_IMP2611.autoImportar(db, me, hoje); // planilhas de nov/2026 já entram na primeira visita do administrador
  const tabs = [['acervo', 'fa-book-reader', 'Biblioteca', 1], ['zoom', 'fa-video', 'Zoom', 1], ['contas', 'fa-calculator', 'Prestação de Contas', 1, 'financeiro'], ['compras', 'fa-shopping-cart', 'Compras e Orçamento', 1, m => tem(m, 'financeiro') || tem(m, 'compras') || tem(m, 'solicitante')], ['enc_livros', 'fa-bookmark', 'Encomendas de livros', 1, m => m.nivel !== 'administrador' && !!window.PR_ENCOMENDA && window.PR_ENCOMENDA.responsavelDe(m, db).length > 0], ['users', 'fa-users-cog', 'Gestão de Responsáveis', 4], ['mapa', 'fa-shield-alt', 'Mapa de Contas', 4], ['docip', 'fa-folder-open', 'Documentação IP', 4], ['backup', 'fa-database', 'Backup e Segurança', 4], ['reservas', 'fa-bed', 'Alojamento', 1, 'reservas'], ['estela', 'fa-monument', 'Estela', 1, 'estela'], ...ELEMENTOS.map(([id, nome, ic]) => ['el_' + id, ic, nome, 1]), ['album', 'fa-images', 'Álbum Parque Retiro', 1], ['inventario', 'fa-boxes', 'Inventário', 1], ['patrimonio', 'fa-landmark', 'Patrimônio', 1, 'inventario'], ['documentos', 'fa-folder-open', 'Documentos e Calendários', 1], ['atividades', 'fa-calendar-check', 'Atividades', 1], ['campanha', 'fa-flag', 'Campanha Punta de Vacas', 1, m => tem(m, 'financeiro') || tem(m, 'atividades')], ['reuniao', 'fa-users', 'Reunião de Escola', 1], ['grupos', 'fa-comments', 'Grupos de Discussão', 1], ['multiuso', 'fa-th-large', 'Multiuso', 1, 'multiuso'], ['comunicacao', 'fa-bullhorn', 'Comunicação, Redes Sociais e Site', 1, m => tem(m, 'comunicacao') || !!(window.PR_COM_REGRAS && window.PR_COM_REGRAS.temAcesso(m, db))], ['contatos', 'fa-address-book', 'Listas de e-mail', 1, 'comunicacao'], ['ajude', 'fa-hand-holding-heart', 'Ajude o Parque (visão geral)', 1, m => AJUDE_FUNC.some(f => tem(m, f))], ['lojinha', 'fa-store', 'Lojinha', 1, 'lojinha'], ['rifa', 'fa-ticket-alt', 'Rifa Solidária', 1, 'rifa'], ['vaquinha', 'fa-hands-helping', 'Vaquinha Coletiva', 1, 'vaquinha'], ['voluntarios', 'fa-hands-helping', 'Voluntários inscritos', 1, 'voluntario'], ['vol_acoes', 'fa-clipboard-list', 'Ações de Voluntário', 1, 'voluntario'], ['jardinagem', 'fa-seedling', 'Jardinagem / Área Externa', 1, 'jardinagem'], ['construcao', 'fa-hard-hat', 'Construção', 1, 'construcao'], ['manutencao', 'fa-tools', 'Manutenção', 1, 'manutencao'], ['traducoes', 'fa-language', 'Traduções', 1, 'traducoes'], ['relatorios', 'fa-chart-line', 'Relatórios Consolidados', 1, m => !!window.PR_RELATORIOS && window.PR_RELATORIOS.modulos(m, ajudaModulos()).length > 0], ['central_ajuda', 'fa-question-circle', 'Central de Ajuda', 1, 'ajuda']].map(t => [t[0], t[1], t[2], t[3], t[4], AREA_DE[t[0]], GRUPO_DE[t[0]]]).filter(t => n >= t[3] && (!t[4] || (typeof t[4] === 'function' ? t[4](me) : tem(me, t[4]))));
  ajudaAbertas = tabs.filter(t => GRUPO_DE[t[0]] === 'ajude' && t[0] !== 'ajude').map(t => t[0]);
  const btnAba = t => `<button class="tab-btn" role="tab" data-tab="${t[0]}"><i class="fas ${t[1]}"></i> ${t[2]}${t[0] === 'users' && pendN() ? ` <span class="badge st-pendente" title="Cadastros aguardando aprovação">${pendN()}</span>` : ''}</button>`;
  const areasVis = AREAS.filter(a => tabs.some(t => t[5] === a.id));
  const primeiroNome = String(me.nome || '').trim().split(/\s+/)[0] || 'bem-vindo(a)';
  $('#app').innerHTML = `<div class="painel-top"><div><h2 class="section-title" style="margin:0 0 6px;border:0;padding:0">Olá, ${esc(primeiroNome)}</h2><p style="margin:0">${esc(me.nome)} <span class="badge ${me.nivel}">${NIVN[me.nivel]}</span></p></div><button class="btn-visit" id="sair"><i class="fas fa-sign-out-alt"></i> Sair</button></div>
  <div class="areas inicio" id="areas" role="navigation" aria-label="Áreas do CONecta Retiro">${areasVis.map(a => `<div class="area-col" data-area="${a.id}">
    <button type="button" class="area-titulo" aria-expanded="true" aria-controls="box-${a.id}"><i class="fas ${a.icone} area-ico" aria-hidden="true"></i><span class="area-txt"><strong>${a.nome}</strong><small data-atual>${a.desc}</small></span><i class="fas fa-chevron-down area-seta" aria-hidden="true"></i></button>
    <div class="area-box" id="box-${a.id}" role="tablist" aria-label="${a.nome}">${tabs.filter(t => t[5] === a.id && !t[6]).map(btnAba).join('')}${GRUPOS.filter(g => tabs.some(t => t[5] === a.id && t[6] === g.id)).map(g => `<div class="area-grupo" role="group" aria-label="${g.nome}" data-grupo="${g.id}"><button type="button" class="area-grupo-bt" aria-expanded="false" aria-haspopup="true"><i class="fas ${g.icone}" aria-hidden="true"></i><span>${g.nome}</span><i class="fas fa-chevron-right gseta" aria-hidden="true"></i></button><div class="grupo-flutuante" role="group" aria-label="${g.nome}">${tabs.filter(t => t[5] === a.id && t[6] === g.id).map((t, i, arr) => (SUBGRUPO_DE[t[0]] && (i === 0 || SUBGRUPO_DE[arr[i - 1][0]] !== SUBGRUPO_DE[t[0]]) ? `<div class="grupo-sub">${SUBGRUPO_DE[t[0]]}</div>` : '') + btnAba(t)).join('')}</div></div>`).join('')}</div>
  </div>`).join('')}</div>
  <div id="emkt-bar" class="emkt-bar" hidden></div>
  <div id="tab" class="panel" role="tabpanel" hidden></div>`;
  const nav = $('#areas');
  // Grupos (Elementos, Ajude o Parque): caixa flutuante ao lado do botão. Abre ao passar o mouse (computador) ou ao clicar/tocar.
  const estreito = () => window.matchMedia('(max-width: 720px)').matches;
  const fechaGrupo = g => { g.classList.remove('aberto'); delete g.dataset.fixo; g.querySelector('.area-grupo-bt').setAttribute('aria-expanded', 'false'); };
  const fechaGrupos = () => nav.querySelectorAll('.area-grupo.aberto').forEach(fechaGrupo);
  const abreGrupo = g => {
    nav.querySelectorAll('.area-grupo.aberto').forEach(o => { if (o !== g) fechaGrupo(o); });
    g.classList.add('aberto'); g.dataset.sy = String(window.scrollY); g.querySelector('.area-grupo-bt').setAttribute('aria-expanded', 'true');
    const p = g.querySelector('.grupo-flutuante'); p.style.top = p.style.left = '';
    if (estreito()) return; // em tela estreita a caixa abre dentro do menu, logo abaixo do botão
    const r = g.querySelector('.area-grupo-bt').getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight, W = window.innerWidth, H = window.innerHeight;
    let left, top = Math.min(Math.max(8, r.top), Math.max(8, H - h - 8));
    if (r.right - 4 + w <= W - 8) left = r.right - 4;          // cabe à direita do botão
    else if (r.left + 4 - w >= 8) left = r.left + 4 - w;       // senão, à esquerda
    else { left = Math.min(Math.max(8, r.left), Math.max(8, W - w - 8)); top = Math.min(r.bottom + 4, Math.max(8, H - h - 8)); } // senão, logo abaixo
    p.style.left = left + 'px'; p.style.top = top + 'px';
  };
  const fechaTudo = () => { fechaGrupos(); nav.querySelectorAll('.area-col').forEach(c => { c.classList.remove('aberta'); c.querySelector('.area-titulo').setAttribute('aria-expanded', 'false'); }); };
  const alterna = col => { const abrirEla = !col.classList.contains('aberta'); fechaTudo(); if (abrirEla) { col.classList.add('aberta'); col.querySelector('.area-titulo').setAttribute('aria-expanded', 'true'); } };
  const abrir = k => {
    const t = tabs.find(x => x[0] === k); if (!t) return;
    nav.classList.remove('inicio'); $('#tab').hidden = false;
    nav.querySelectorAll('.tab-btn').forEach(b => { const on = b.dataset.tab === k; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
    nav.querySelectorAll('.area-col').forEach(c => { const on = c.dataset.area === t[5]; c.classList.toggle('ativa', on); c.querySelector('[data-atual]').textContent = on ? t[2] : AREAS.find(a => a.id === c.dataset.area).desc; });
    nav.querySelectorAll('.area-grupo').forEach(g => g.classList.toggle('tem-ativa', !!g.querySelector('.tab-btn.active')));
    fechaTudo(); nav.querySelectorAll('.area-col').forEach(c => c.classList.add('fechada')); // não reabre sob o mouse até ele sair e voltar
    if (document.activeElement && nav.contains(document.activeElement)) document.activeElement.blur();
    if (window.PR_EMAILMKT) window.PR_EMAILMKT.barra(me, k, $('#emkt-bar'));
    V[k](me, $('#tab'));
  };
  irPara = k => { if (tabs.some(t => t[0] === k)) abrir(k); };
  nav.querySelectorAll('.area-col').forEach(c => c.addEventListener('mouseleave', () => c.classList.remove('fechada')));
  nav.querySelectorAll('.area-titulo').forEach(b => b.onclick = () => { if (!nav.classList.contains('inicio')) alterna(b.closest('.area-col')); });
  nav.querySelectorAll('.tab-btn').forEach(b => b.onclick = () => abrir(b.dataset.tab));
  const comMouse = window.matchMedia('(hover: hover)').matches;
  nav.querySelectorAll('.area-grupo').forEach(g => {
    let t = 0;
    g.querySelector('.area-grupo-bt').onclick = () => {
      if (!g.classList.contains('aberto')) { abreGrupo(g); g.dataset.fixo = '1'; }
      else if (g.dataset.fixo !== '1' && comMouse && !estreito()) g.dataset.fixo = '1'; // já aberta pelo mouse: o clique a mantém aberta
      else fechaGrupo(g);
    };
    g.addEventListener('mouseenter', () => { if (!comMouse || estreito()) return; clearTimeout(t); if (!g.classList.contains('aberto')) abreGrupo(g); });
    g.addEventListener('mouseleave', () => { if (!comMouse || estreito()) return; clearTimeout(t); t = setTimeout(() => { if (g.dataset.fixo !== '1') fechaGrupo(g); }, 300); });
  });
  document.addEventListener('click', ev => { if (!ev.target.closest('.area-grupo')) fechaGrupos(); });
  // a caixa é fixa na tela: se a página rolar bastante, ela fecha (pequenos ajustes de rolagem não fecham)
  window.addEventListener('scroll', () => { if (!estreito()) nav.querySelectorAll('.area-grupo.aberto').forEach(g => { if (Math.abs(window.scrollY - Number(g.dataset.sy || 0)) > 80) fechaGrupo(g); }); }, { passive: true });
  window.addEventListener('resize', () => { if (!estreito()) fechaGrupos(); });
  document.addEventListener('click', ev => { if (!nav.contains(ev.target)) fechaTudo(); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') fechaTudo(); });
  if (!temp && cadastroIncompleto(me)) {
    const falt = [!nomeCompletoOk(me.nome) && 'nome completo', !zapOk(me.whatsapp) && 'WhatsApp', !(me.lgpd && me.lgpd.aceite) && 'autorização LGPD'].filter(Boolean).join(', ');
    const box = document.createElement('div'); box.id = 'cad-aviso'; box.className = 'tip-box'; box.setAttribute('role', 'region'); box.setAttribute('aria-label', 'Complete seu cadastro');
    box.innerHTML = `<h3><i class="fas fa-id-card"></i> Complete seu cadastro</h3><p>O cadastro mínimo de todos os níveis é nome completo, WhatsApp e e-mail, com a autorização LGPD. Falta: <strong>${esc(falt)}</strong>.</p>
    <form id="fcad" class="form-reserva" novalidate>
      <div class="form-row"><label for="cd-n">Nome completo *</label><input id="cd-n" maxlength="80" value="${esc(me.nome || '')}"></div>
      <div class="form-row"><label for="cd-w">WhatsApp (com DDD) *</label><input id="cd-w" type="tel" maxlength="20" value="${esc(me.whatsapp || '')}" placeholder="(21) 99999-9999"></div>
      ${(me.lgpd && me.lgpd.aceite) ? '' : lgpdBloco('cd')}
      <p class="form-erro" id="cd-er" role="alert" hidden></p><button class="btn-visit"><i class="fas fa-save"></i> Salvar cadastro</button></form>`;
    $('#app').prepend(box);
    $('#fcad').onsubmit = ev => {
      ev.preventDefault(); const er = $('#cd-er'), falha = m => { er.textContent = m; er.hidden = false; };
      const n = $('#cd-n').value.trim().replace(/\s+/g, ' '), w = $('#cd-w').value.trim(), precisaLgpd = !(me.lgpd && me.lgpd.aceite);
      if (!nomeCompletoOk(n)) return falha('Informe o nome completo (nome e sobrenome).');
      if (!zapOk(w)) return falha('Informe um WhatsApp válido, com DDD.');
      if (precisaLgpd && !$('#cd-lgpd-ok').checked) return falha('Marque a autorização LGPD para concluir.');
      const l = db.get('users', []), u = l.find(x => x.email === me.email); if (!u) return falha('Cadastro não encontrado.');
      u.nome = n; u.whatsapp = zapDigitos(w); if (precisaLgpd) u.lgpd = lgpdLe('cd');
      if (!db.set('users', l)) return falha('Não foi possível salvar neste navegador.');
      painel();
    };
  }
  $('#sair').onclick = async () => {
    if (SRV) { const e = PR_DADOS.estadoSync(); if (e.pendentes) { try { await PR_DADOS.sincronizar(); } catch (x) { if (!confirm('Ainda há alterações que não chegaram ao servidor (' + (x.message || 'sem conexão') + '). Sair mesmo assim? Elas serão perdidas.')) return; } } await SB.sair(); }
    sessionStorage.removeItem('pr_sess'); sessionStorage.removeItem('pr_temp'); location.href = temp ? 'index.html' : 'login.html';
  };
  if (SRV) { // indicador de gravação no servidor
    const top = $('.painel-top'), ind = document.createElement('p'); ind.id = 'sync-ind'; ind.setAttribute('role', 'status'); ind.style.margin = '6px 0 0'; ind.style.fontSize = '.85rem';
    const mostra = e => {
      const t = e.conflitos ? ['fa-exclamation-triangle', 'Outra pessoa alterou os mesmos dados ao mesmo tempo. Escolha abaixo qual versão fica.', 'st-pendente']
        : e.estado === 'sem-sessao' ? ['fa-sign-in-alt', 'Sua sessão terminou: entre de novo para continuar salvando.', 'st-recusado']
        : e.estado === 'sem-permissao' ? ['fa-lock', 'O servidor recusou uma gravação: ' + (e.erro || 'sem permissão') + '.', 'st-recusado']
        : e.estado === 'offline' ? ['fa-wifi', 'Sem conexão: ' + e.pendentes + ' alteração(ões) aguardando para salvar.', 'st-pendente']
        : e.pendentes ? ['fa-sync', 'Salvando no servidor...', 'st-pendente'] : ['fa-cloud', 'Tudo salvo no servidor do Parque.', 'st-aprovado'];
      ind.innerHTML = `<span class="badge ${t[2]}"><i class="fas ${t[0]}"></i> ${esc(t[1])}</span>` + (e.conflitos ? PR_DADOS.conflitos().map(c => `<span class="sync-conf" style="display:block;margin-top:6px">Dados "${esc(c.colecao)}": <button type="button" class="btn-visit" data-cf="${esc(c.colecao)}" data-esc="servidor">Ficar com a versão do servidor (recarrega)</button> <button type="button" class="btn-visit" data-cf="${esc(c.colecao)}" data-esc="meu">Manter a minha alteração</button></span>`).join('') : '');
      ind.style.cssText = e.conflitos || e.estado === 'sem-sessao' ? 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;margin:0;padding:12px;background:#fff;border:2px solid #c0392b;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.2);font-size:.9rem' : 'margin:6px 0 0;font-size:.85rem';
      ind.querySelectorAll('[data-cf]').forEach(b => b.onclick = async () => { await PR_DADOS.resolverConflito(b.dataset.cf, b.dataset.esc); if (b.dataset.esc === 'servidor') location.reload(); });
    };
    mostra(PR_DADOS.estadoSync()); window.addEventListener('pr-sync', ev => mostra(ev.detail));
    if (top && top.firstElementChild) top.firstElementChild.appendChild(ind);
  }
}

const STATUS_MSG = {
  pendente: 'Seu cadastro ainda aguarda aprovação do administrador. Você receberá o acesso assim que for aprovado.',
  recusado: 'Seu cadastro não foi aprovado. Fale com o administrador do Parque.',
  bloqueado: 'Esta conta está bloqueada. Fale com o administrador do Parque.'
};
const statusDe = u => u.status || 'aprovado'; // contas antigas, sem status, contam como aprovadas

// Login com o servidor do Parque (Supabase Auth): entrar, criar conta, esqueci minha senha e nova senha.
function loginServidor() {
  const SB = window.PR_SUPABASE;
  const ret = SB.lerRetornoDoEmail();
  if (ret && ret.tipo !== 'recovery' && !ret.erro) { history.replaceState(null, '', location.pathname); } // volta da confirmação de e-mail
  const s = SB.sessao(), eu = s && db.get('users', []).find(u => u.email === s.user.email);
  if (!ret && eu && statusDe(eu) === 'aprovado') { sessionStorage.setItem('pr_sess', eu.email); location.replace('area-restrita.html'); return; }
  let modo = ret && ret.tipo === 'recovery' ? 'nova' : 'entrar', aviso = '', ocupado = false;
  if (ret && ret.erro) aviso = 'O link do e-mail não funcionou (' + ret.erro + '). Se for de senha, peça outro em "Esqueci minha senha".';
  else if (ret && ret.tipo === 'signup') aviso = 'E-mail confirmado! Agora aguarde: o administrador vai aprovar ou não o seu acesso. Você pode tentar entrar depois da aprovação.';
  else if (ret && ret.tipo !== 'recovery') aviso = 'E-mail confirmado.';
  const TIT = { entrar: 'Entrar', cadastro: 'Criar conta', esqueci: 'Esqueci minha senha', nova: 'Criar nova senha' };
  const desenha = () => {
    const cad = modo === 'cadastro';
    $('#loginBox').innerHTML = `${modo === 'nova' ? '' : `<div class="tabs sub login-tabs" role="tablist">
      <button type="button" class="tab-btn${modo === 'entrar' || modo === 'esqueci' ? ' active' : ''}" data-m="entrar">Entrar</button>
      <button type="button" class="tab-btn${cad ? ' active' : ''}" data-m="cadastro">Criar conta</button></div>`}
    <h2>${TIT[modo]}</h2>
    <p>${cad ? 'Preencha os dados abaixo. Vamos mandar um e-mail para você confirmar o endereço; depois, a comissão do Parque Retiro aprova ou não o seu acesso.' : modo === 'esqueci' ? 'Digite o e-mail do seu cadastro. Vamos mandar um link para você criar uma senha nova.' : modo === 'nova' ? 'Digite a nova senha duas vezes.' : 'Acesso para Mestres'}</p>
    ${aviso ? `<p class="tip-box" role="status">${esc(aviso)}</p>` : ''}
    <form id="f" novalidate>${cad ? '<div class="form-row"><label for="n">Nome completo *</label><input id="n" autocomplete="name" maxlength="80"></div>' : ''}
    ${modo === 'nova' ? '' : '<div class="form-row"><label for="e">E-mail *</label><input id="e" type="email" autocomplete="username"></div>'}
    ${cad ? '<div class="form-row"><label for="w">WhatsApp (com DDD) *</label><input id="w" type="tel" autocomplete="tel" maxlength="20" placeholder="(21) 99999-9999"></div>' : ''}
    ${modo === 'esqueci' ? '' : `<div class="form-row"><label for="s">${modo === 'nova' ? 'Nova senha (mín. 8 caracteres)' : 'Senha' + (cad ? ' (mín. 8 caracteres)' : '')}</label><input id="s" type="password" autocomplete="${modo === 'entrar' ? 'current-password' : 'new-password'}"></div>`}
    ${cad || modo === 'nova' ? '<div class="form-row"><label for="s2">Repita a senha</label><input id="s2" type="password" autocomplete="new-password"></div>' : ''}
    ${modo === 'entrar' || modo === 'nova' || modo === 'esqueci' ? '' : '<p class="tip-box" role="note"><strong>Antes de continuar:</strong> o cadastro na área restrita está sujeito à aprovação da comissão do Parque Retiro. O acesso só é liberado quando o cadastro for aprovado.</p>' + lgpdBloco('cc')}
    <p class="form-erro" id="er" role="alert" hidden></p><button class="btn-visit btn-large">${{ entrar: 'Entrar', cadastro: 'Enviar cadastro', esqueci: 'Enviar o link', nova: 'Salvar a nova senha' }[modo]}</button>
    ${modo === 'entrar' ? '<p style="margin-top:12px"><button type="button" class="link-btn" id="esq" style="background:none;border:0;color:inherit;text-decoration:underline;cursor:pointer;padding:0">Esqueci minha senha</button></p>' : modo === 'esqueci' ? '<p style="margin-top:12px"><button type="button" class="link-btn" id="volt" style="background:none;border:0;color:inherit;text-decoration:underline;cursor:pointer;padding:0">Voltar para Entrar</button></p>' : ''}</form>`;
    document.querySelectorAll('.login-tabs [data-m]').forEach(b => b.onclick = () => { modo = b.dataset.m; aviso = ''; desenha(); });
    const esq = $('#esq'); if (esq) esq.onclick = () => { modo = 'esqueci'; aviso = ''; desenha(); };
    const vol = $('#volt'); if (vol) vol.onclick = () => { modo = 'entrar'; aviso = ''; desenha(); };
    $('#f').onsubmit = ev => { ev.preventDefault(); if (ocupado) return; ({ entrar: entra, cadastro: cadastra, esqueci: esquece, nova: troca }[modo])(); };
  };
  const falha = m => { const er = $('#er'); er.textContent = m; er.hidden = false; };
  const espera = async (fn) => { ocupado = true; const b = $('#f button.btn-large'); const t = b.textContent; b.disabled = true; b.textContent = 'Aguarde...'; try { await fn(); } finally { ocupado = false; if (document.body.contains(b)) { b.disabled = false; b.textContent = t; } } };
  const entra = () => espera(async () => {
    const em = $('#e').value.trim().toLowerCase(), sn = $('#s').value;
    if (!/^\S+@\S+\.\S+$/.test(em) || !sn) return falha('Informe e-mail e senha.');
    const r = await SB.entrar(em, sn);
    if (r.erro) return falha(r.erro);
    if (r.pendente) return falha(STATUS_MSG[r.perfil.status] || STATUS_MSG.pendente);
    sessionStorage.setItem('pr_sess', r.perfil.email); location.href = 'area-restrita.html';
  });
  const cadastra = () => espera(async () => {
    const n = $('#n').value.trim().replace(/\s+/g, ' '), em = $('#e').value.trim().toLowerCase(), sn = $('#s').value, s2 = $('#s2').value, w = $('#w').value.trim();
    if (!nomeCompletoOk(n)) return falha('Informe seu nome completo (nome e sobrenome).');
    if (!/^\S+@\S+\.\S+$/.test(em)) return falha('Informe um e-mail válido.');
    if (!zapOk(w)) return falha('Informe um WhatsApp válido, com DDD.');
    if (!$('#cc-lgpd-ok').checked) return falha('Para criar a conta é preciso aceitar a autorização LGPD.');
    if (sn.length < 8) return falha('A senha precisa ter ao menos 8 caracteres.');
    if (sn !== s2) return falha('As senhas não conferem.');
    const r = await SB.cadastrar({ nome: n, email: em, senha: sn, whatsapp: zapDigitos(w), lgpd: lgpdLe('cc') });
    if (r.erro) return falha(r.erro);
    modo = 'entrar'; aviso = 'Cadastro enviado! Abra o e-mail que mandamos para ' + em + ' e toque no link de confirmação (veja também a caixa de spam). Depois, aguarde a aprovação do administrador.'; desenha();
  });
  const esquece = () => espera(async () => {
    const em = $('#e').value.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(em)) return falha('Informe um e-mail válido.');
    const r = await SB.recuperar(em);
    if (r.erro) return falha(r.erro);
    modo = 'entrar'; aviso = 'Se este e-mail tiver cadastro, enviamos um link para criar uma senha nova. Veja também a caixa de spam.'; desenha();
  });
  const troca = () => espera(async () => {
    const sn = $('#s').value, s2 = $('#s2').value;
    if (sn.length < 8) return falha('A senha precisa ter ao menos 8 caracteres.');
    if (sn !== s2) return falha('As senhas não conferem.');
    const r = await SB.novaSenha(ret.token, sn);
    if (r.erro) return falha(r.erro);
    history.replaceState(null, '', location.pathname);
    modo = 'entrar'; aviso = 'Senha nova salva! Agora entre com ela.'; desenha();
  });
  desenha();
}

function login() {
  if (window.PR_DADOS && PR_DADOS.modo === 'supabase') return loginServidor();
  const users = db.get('users', []);
  const logado = users.find(u => u.email === sessionStorage.getItem('pr_sess'));
  if (logado && statusDe(logado) === 'aprovado') { location.replace('area-restrita.html'); return; }
  const primeiro = !users.some(u => u.nivel === 'administrador' && statusDe(u) === 'aprovado'); // o primeiro cadastro sempre vira Administrador
  let modo = 'entrar', aviso = '';

  const desenha = () => {
    const cad = modo === 'cadastro';
    $('#loginBox').innerHTML = `<div class="tabs sub login-tabs" role="tablist">
      <button type="button" class="tab-btn${cad ? '' : ' active'}" data-m="entrar">Entrar</button>
      <button type="button" class="tab-btn${cad ? ' active' : ''}" data-m="cadastro">Criar conta</button></div>
    <h2>${cad ? 'Criar conta' : 'Entrar'}</h2>
    <p>${cad ? (primeiro ? 'Este é o primeiro cadastro: ele será o Administrador e já entra na área restrita.' : 'Preencha os dados abaixo. Depois do envio, a comissão do Parque Retiro vai aprovar ou não o seu acesso.') : 'Acesso para Mestres'}</p>
    ${aviso ? `<p class="tip-box" role="status">${esc(aviso)}</p>` : ''}
    <form id="f" novalidate>${cad ? '<div class="form-row"><label for="n">Nome completo *</label><input id="n" autocomplete="name" maxlength="80"></div>' : ''}
    <div class="form-row"><label for="e">E-mail *</label><input id="e" type="email" autocomplete="username"></div>
    ${cad ? '<div class="form-row"><label for="w">WhatsApp (com DDD) *</label><input id="w" type="tel" autocomplete="tel" maxlength="20" placeholder="(21) 99999-9999"></div>' : ''}
    <div class="form-row"><label for="s">Senha${cad ? ' (mín. 8 caracteres)' : ''}</label><input id="s" type="password" autocomplete="${cad ? 'new-password' : 'current-password'}"></div>
    ${cad ? '<div class="form-row"><label for="s2">Repita a senha</label><input id="s2" type="password" autocomplete="new-password"></div>' + (primeiro ? '' : '<p class="tip-box" role="note"><strong>Antes de continuar:</strong> o cadastro na área restrita está sujeito à aprovação da comissão do Parque Retiro. Depois de enviar, aguarde a confirmação: o acesso só é liberado quando o cadastro for aprovado.</p>') + lgpdBloco('cc') : ''}
    <p class="form-erro" id="er" role="alert" hidden></p><button class="btn-visit btn-large">${cad ? 'Enviar cadastro' : 'Entrar'}</button></form>`;
    document.querySelectorAll('.login-tabs [data-m]').forEach(b => b.onclick = () => { modo = b.dataset.m; aviso = ''; desenha(); });
    $('#f').onsubmit = cad ? enviaCadastro : entra;
  };

  const falha = m => { const er = $('#er'); er.textContent = m; er.hidden = false; };

  async function entra(ev) {
    ev.preventDefault();
    const em = $('#e').value.trim().toLowerCase(), s = $('#s').value;
    if (!/^\S+@\S+\.\S+$/.test(em) || !s) return falha('Informe e-mail e senha.');
    const u = db.get('users', []).find(x => x.email === em);
    if (!u || u.hash !== await hash(s, u.salt)) return falha('E-mail ou senha incorretos. Confira e tente de novo.');
    const st = statusDe(u);
    if (st !== 'aprovado') return falha(STATUS_MSG[st] || STATUS_MSG.pendente);
    sessionStorage.setItem('pr_sess', em); location.href = 'area-restrita.html';
  }

  async function enviaCadastro(ev) {
    ev.preventDefault();
    const n = $('#n').value.trim().replace(/\s+/g, ' '), em = $('#e').value.trim().toLowerCase(), s = $('#s').value, s2 = $('#s2').value;
    const w = $('#w').value.trim();
    if (!nomeCompletoOk(n)) return falha('Informe seu nome completo (nome e sobrenome).');
    if (!/^\S+@\S+\.\S+$/.test(em)) return falha('Informe um e-mail válido.');
    if (!zapOk(w)) return falha('Informe um WhatsApp válido, com DDD.');
    if (!$('#cc-lgpd-ok').checked) return falha('Para criar a conta é preciso aceitar a autorização LGPD.');
    if (s.length < 8) return falha('A senha precisa ter ao menos 8 caracteres.');
    if (s !== s2) return falha('As senhas não conferem.');
    const l = db.get('users', []);
    if (l.some(u => u.email === em)) return falha('Este e-mail já tem cadastro. Use a aba Entrar.');
    const salt = uid();
    const adm = !l.some(u => u.nivel === 'administrador' && statusDe(u) === 'aprovado'); // primeiro cadastro = Administrador
    l.push({ nome: n, email: em, whatsapp: zapDigitos(w), lgpd: lgpdLe('cc'), nivel: adm ? 'administrador' : 'leitor', status: adm ? 'aprovado' : 'pendente', funcoes: [], criado: hoje(), salt, hash: await hash(s, salt) });
    if (!db.set('users', l)) return falha('Não foi possível salvar o cadastro neste navegador.');
    if (adm) { sessionStorage.setItem('pr_sess', em); location.href = 'area-restrita.html'; return; }
    modo = 'entrar'; aviso = 'Cadastro enviado! Agora aguarde: o administrador vai aprovar ou não o seu acesso.'; desenha();
  }

  desenha();
}

function estelaPag() {
  const ns = ordNomes(db.get('estela', []).filter(n => estPub(n) === true));
  $('#nomes').innerHTML = ns.length ? `<p class="vazio">${ns.length} nome(s) na Estela.</p><ul class="estela-nomes">${ns.map(n => `<li>${esc(n.nome)}</li>`).join('')}</ul>` : '<p class="vazio">Os nomes estão sendo reunidos aos poucos. Volte em breve.</p>';
}
function fotosPag() {
  const fs = db.get('album', []).filter(f => f.status === 'publicada' && fotoOk(f)).sort((a, b) => (b.dataFoto || b.data).localeCompare(a.dataFoto || a.data));
  const el = $('#galeria'), ordem = eventos().map(e => e.id);
  const grupos = ordem.map(id => [nomeEv(id), fs.filter(f => f.evento === id)]).filter(g => g[1].length);
  const outras = fs.filter(f => !ordem.includes(f.evento)); if (outras.length) grupos.push(['Outros momentos', outras]);
  const lista = []; // ordem de exibição para o lightbox
  el.innerHTML = grupos.length ? grupos.map(([nome, ps]) => `<h3 class="subsection-title">${esc(nome)}</h3><div class="album-grid">${ps.map(f => { lista.push(f); const i = lista.length - 1;
    return `<figure class="foto-card"><button class="foto-abre" data-i="${i}" aria-label="Ampliar foto${f.legenda ? ': ' + esc(f.legenda) : ''}"><img src="${esc(f.foto)}" alt="${esc(f.legenda || 'Foto do Parque Retiro')}" loading="lazy" draggable="false" oncontextmenu="return false"></button><figcaption>${f.legenda ? `<span>${esc(f.legenda)}</span>` : ''}${f.dataFoto ? `<small>Dia ${fmtData(f.dataFoto)}</small>` : ''}${f.mostrarAutor && f.autor ? `<small>Foto: ${esc(f.autor)}</small>` : ''}</figcaption></figure>`; }).join('')}</div>`).join('') : '<p class="vazio">As fotos selecionadas pela curadoria aparecerão aqui.</p>';
  const box = document.createElement('div'); box.className = 'lightbox'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Foto ampliada');
  box.innerHTML = '<button class="lb-x" aria-label="Fechar"><i class="fas fa-times"></i></button><img alt="" draggable="false" oncontextmenu="return false">'; document.body.appendChild(box);
  const fecha = () => { box.hidden = true; };
  box.onclick = fecha; document.addEventListener('keydown', e => { if (e.key === 'Escape') fecha(); });
  el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const f = lista[+b.dataset.i], im = $('img', box); im.src = f.foto; im.alt = f.legenda || ''; box.hidden = false; });

  // Envio de fotos pela área aberta
  const form = $('#fenvio'); if (!form) return;
  const ev = $('#p-e'); ev.innerHTML = '<option value="">Não sei / sem atividade</option>' + eventos().map(e => `<option value="${e.id}">${esc(e.nome)}</option>`).join('');
  let msg = $('#p-msg');
  form.onsubmit = async e => {
    e.preventDefault(); msg.hidden = true; const er = $('#p-er'); er.hidden = true;
    const falha = m => { er.textContent = m; er.hidden = false; };
    const files = [...$('#p-f').files].filter(f => /^image\//.test(f.type));
    if (!files.length) return falha('Escolha ao menos uma foto (JPG, PNG ou WEBP).');
    if (files.length > 10) return falha('Envie no máximo 10 fotos por vez. Você escolheu ' + files.length + '.');
    const dia = $('#p-d').value, autor = $('#p-a').value.trim(), mostrar = $('#p-m').value === '1';
    if (!dia && !autor) return falha('Informe o dia em que tirou as fotos e/ou o nome do autor.');
    if (mostrar && !autor) return falha('Para mostrar seu nome junto da foto, informe o nome do autor.');
    const l = db.get('album', []); let ok = 0;
    for (const f of files) { try { l.push({ id: uid(), foto: await reduz(f, 1000, 0.7), evento: ev.value, dataFoto: dia, autor, mostrarAutor: mostrar, legenda: '', email: '', data: hoje(), status: 'pendente', origem: 'publica' }); ok++; } catch (x) { /* ignora */ } }
    if (!ok) return falha('Não foi possível ler as imagens.');
    if (!db.set('album', l)) return falha('Não foi possível salvar: o espaço do navegador acabou. Tente com menos fotos.');
    form.reset(); msg.textContent = ok + ' foto(s) recebida(s). Obrigado! Elas aparecem aqui depois de selecionadas pela curadoria.'; msg.hidden = false;
  };
}
// Página pública Ajude o Parque > Lojinha: mostra só os produtos marcados como publicados na área restrita.
function lojinhaPag() {
  const el = $('#produtos'); if (!el) return;
  const ps = db.get('loja_itens', []).filter(i => i.publicado).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  el.innerHTML = ps.length ? `<h3 class="subsection-title">Produtos disponíveis</h3><div class="content-grid">${ps.map(i => {
    const foto = i.foto && /^data:image\//.test(i.foto) ? `<img class="loja-foto" src="${esc(i.foto)}" alt="${esc(i.nome)}" loading="lazy">` : '<div class="loja-foto loja-foto-ph" role="img" aria-label="Produto sem foto"><i class="fas fa-gift"></i></div>';
    return `<div class="card loja-card">${foto}<h3>${esc(i.nome)}</h3>${i.categoria ? `<p class="loja-cat">${esc(i.categoria)}</p>` : ''}${i.descricao ? `<p>${esc(i.descricao)}</p>` : ''}<p class="loja-preco">${brl(i.preco)}</p>${i.estoque > 0 ? `<a class="btn-visit" href="mailto:parqueretirorio@gmail.com?subject=${encodeURIComponent('Lojinha do Parque - Pedido: ' + i.nome)}">Pedir por e-mail</a>` : '<span class="badge-emprestado">Esgotado</span>'}</div>`;
  }).join('')}</div>` : '';
}
// Página pública Ajude o Parque > Rifa Solidária (rifa.js): rifas abertas, formulário de participação, resultados.
function rifaPag() { if (window.PR_RIFA) window.PR_RIFA.publica(ajudaModulos()); }
// Página pública Ajude o Parque > Vaquinha Coletiva (vaquinha.js): vaquinhas abertas, gráfico da meta, formulário de contribuição.
function vaquinhaPag() { if (window.PR_VAQUINHA) window.PR_VAQUINHA.publica(ajudaModulos()); }
// Página pública Ajude o Parque > Voluntário (voluntario.js): formulário de inscrição para quem quer cooperar sem dinheiro.
function voluntarioPag() { if (window.PR_VOLUNTARIO) window.PR_VOLUNTARIO.publica(ajudaModulos()); }
function biblioteca() { $('#catalogo').innerHTML = livros().map(bookMini).join(''); }
function acervoHome() { $('#acervoHome').innerHTML = livros().slice(0, 4).map(bookMini).join(''); }

const p = document.body.dataset.page;
({ painel, login, biblioteca, estela: estelaPag, fotos: fotosPag, lojinha: lojinhaPag, rifa: rifaPag, vaquinha: vaquinhaPag, voluntario: voluntarioPag }[p] || (() => {}))();
if ($('#acervoHome')) acervoHome();
})();
