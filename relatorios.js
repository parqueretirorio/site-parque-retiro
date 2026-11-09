// Relatórios Consolidados da área restrita.
//
// COMO ACRESCENTAR UM NOVO RELATÓRIO (sem mexer no motor):
//   PR_RELATORIOS.registrar({
//     id: 'meumodulo', nome: 'Meu módulo', icone: 'fa-star',
//     acesso: (me, H) => H.tem(me, 'funcao'),          // quem pode ver (administrador sempre passa em H.tem)
//     relatorios: [{
//       id: 'lista', nome: 'Lista de coisas',
//       periodo: { k: 'data', rot: 'Data' },            // opcional: coluna de data usada no filtro de período
//       colunas: [{ k: 'nome', rot: 'Nome' }, { k: 'data', rot: 'Data', tipo: 'data' }, { k: 'qtd', rot: 'Qtd.', tipo: 'num', soma: true }],
//       filtros: ['nome'],                              // colunas que viram filtros (as opções saem dos próprios dados)
//       linhas: H => [{ nome: 'A', data: '2026-01-31', qtd: 3 }]   // devolve uma lista de objetos simples
//     }]
//   });
// tipos de coluna: texto (padrão), 'data' (AAAA-MM-DD), 'num', 'cod' (código com selo).
(function () {
const REG = [];
const PRESETS = [['', 'Todo o período'], ['30', 'Últimos 30 dias'], ['mes', 'Este mês'], ['tri', 'Este trimestre'], ['sem', 'Este semestre'], ['ano', 'Este ano']];
const pad = n => String(n).padStart(2, '0');
const fmtQ = n => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
function faixa(p, h) {
  const y = +h.slice(0, 4), m = +h.slice(5, 7) - 1, ult = (a, b) => `${a}-${pad(b + 1)}-${pad(new Date(a, b + 1, 0).getDate())}`, ini = (a, b) => `${a}-${pad(b + 1)}-01`;
  if (p === '30') return [new Date(new Date(h + 'T12:00:00').getTime() - 30 * 864e5).toISOString().slice(0, 10), h];
  if (p === 'mes') return [ini(y, m), ult(y, m)];
  if (p === 'tri') { const a = Math.floor(m / 3) * 3; return [ini(y, a), ult(y, a + 2)]; }
  if (p === 'sem') { const a = m < 6 ? 0 : 6; return [ini(y, a), ult(y, a + 5)]; }
  if (p === 'ano') return [ini(y, 0), ult(y, 11)];
  return ['', ''];
}

window.PR_RELATORIOS = {
  registrar(def) { const i = REG.findIndex(m => m.id === def.id); if (i >= 0) REG[i] = def; else REG.push(def); },
  modulos(me, H) { return REG.filter(m => m.acesso(me, H)); },
  // Administrador: abre primeiro o Orçamento e Fluxo Financeiro (financeiro.js); os relatórios por módulo ficam na segunda aba.
  // Responsáveis de módulo: veem apenas os relatórios dos seus módulos.
  abrir(me, root, H) {
    if (me.nivel !== 'administrador' || !window.PR_FINANCEIRO) return this.abrirModulos(me, root, H);
    let aba = 'fin';
    const draw = () => {
      root.innerHTML = `<h3><i class="fas fa-chart-line"></i> Relatórios Consolidados</h3><div class="tabs sub no-print" role="tablist"><button class="tab-btn${aba === 'fin' ? ' active' : ''}" data-ab="fin">Orçamento e Fluxo Financeiro</button><button class="tab-btn${aba === 'mod' ? ' active' : ''}" data-ab="mod">Relatórios por módulo</button>${window.PR_GRAFICOS ? `<button class="tab-btn${aba === 'graf' ? ' active' : ''}" data-ab="graf"><i class="fas fa-chart-pie"></i> Gráficos</button>` : ''}</div><div id="rc-aba"></div>`;
      root.querySelectorAll('[data-ab]').forEach(b => b.onclick = () => { aba = b.dataset.ab; draw(); });
      const el = root.querySelector('#rc-aba');
      aba === 'fin' ? window.PR_FINANCEIRO.abrir(me, el, H) : aba === 'graf' ? window.PR_GRAFICOS.abrir(me, el, H) : this.abrirModulos(me, el, H);
    };
    draw();
  },
  abrirModulos(me, root, H) {
    const { esc, $, norm, fmtData, csv, hoje } = H;
    const mods = this.modulos(me, H);
    if (!mods.length) { root.innerHTML = '<p class="vazio">Você não tem acesso a nenhum relatório.</p>'; return; }
    const S = { mod: mods[0].id, rel: '', de: '', ate: '', preset: '', q: '', f: {}, grupo: '', ord: '', dir: 1 };
    let M, R, dados = [];
    const carrega = () => { M = mods.find(m => m.id === S.mod); R = M.relatorios.find(r => r.id === S.rel) || M.relatorios[0]; S.rel = R.id; dados = R.linhas(H); };
    const reinicia = () => { carrega(); Object.assign(S, { de: '', ate: '', preset: '', q: '', f: {}, grupo: '' }); S.ord = R.periodo ? R.periodo.k : R.colunas[0].k; S.dir = R.periodo ? -1 : 1; };
    const col = k => R.colunas.find(c => c.k === k);
    const vazio = x => x === '' || x == null;

    const cel = (c, v) => c.tipo === 'data' ? esc(fmtData(v) || '-') : c.tipo === 'num' ? fmtQ(v) : c.tipo === 'cod' ? `<span class="inv-code">${esc(v)}</span>` : esc(vazio(v) ? '-' : v);
    const txt = (c, v) => c.tipo === 'data' ? fmtData(v) : c.tipo === 'num' ? fmtQ(v) : (vazio(v) ? '' : v);
    const filtra = () => dados.filter(r => {
      if (R.periodo && (S.de || S.ate)) { const d = r[R.periodo.k]; if (!d || (S.de && d < S.de) || (S.ate && d > S.ate)) return false; }
      for (const [k, v] of Object.entries(S.f)) { if (!v) continue; if (v === '__vazio' ? !vazio(r[k]) : String(r[k]) !== v) return false; }
      return !S.q || norm(R.colunas.map(c => r[c.k]).join(' ')).includes(norm(S.q));
    });
    const ordena = l => { const c = col(S.ord) || R.colunas[0]; return l.slice().sort((a, b) => (c.tipo === 'num' ? (+a[c.k] || 0) - (+b[c.k] || 0) : String(vazio(a[c.k]) ? '' : a[c.k]).localeCompare(String(vazio(b[c.k]) ? '' : b[c.k]), 'pt-BR', { numeric: true, sensitivity: 'base' })) * S.dir); };
    const grupos = l => { if (!S.grupo) return [['', ordena(l)]]; const g = {}; l.forEach(r => { const k = vazio(r[S.grupo]) ? '(não informado)' : String(r[S.grupo]); (g[k] = g[k] || []).push(r); }); return Object.keys(g).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true })).map(k => [k, ordena(g[k])]); };
    const somas = l => R.colunas.filter(c => c.soma).map(c => [c.rot, l.reduce((s, r) => s + (+r[c.k] || 0), 0)]);
    const totais = l => `<div class="totais"><div><span>Registros</span><strong>${l.length}</strong></div>${somas(l).map(([r, v]) => `<div><span>Soma: ${esc(r)}</span><strong>${fmtQ(v)}</strong></div>`).join('')}</div>`;
    const th = c => `<th aria-sort="${S.ord === c.k ? (S.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button class="rc-th" data-o="${esc(c.k)}" title="Ordenar por ${esc(c.rot)}">${esc(c.rot)}${S.ord === c.k ? (S.dir > 0 ? ' ▲' : ' ▼') : ''}</button></th>`;
    const tabela = l => `<table class="doc-table"><thead><tr>${R.colunas.map(th).join('')}</tr></thead><tbody>${l.map(r => `<tr>${R.colunas.map(c => `<td>${cel(c, r[c.k])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const resumoFiltros = () => {
      const p = [];
      if (R.periodo && (S.de || S.ate)) p.push(`${R.periodo.rot}: ${S.de ? fmtData(S.de) : 'início'} a ${S.ate ? fmtData(S.ate) : 'hoje'}`);
      Object.entries(S.f).forEach(([k, v]) => { if (v) p.push(`${col(k).rot}: ${v === '__vazio' ? '(não informado)' : v}`); });
      if (S.q) p.push(`Busca: "${S.q}"`); if (S.grupo) p.push(`Agrupado por ${col(S.grupo).rot}`);
      return p.length ? p.join(' | ') : 'Sem filtros (todos os registros)';
    };

    const res = () => {
      const l = filtra(), gs = grupos(l);
      $('#rc-res', root).innerHTML = `<h3 class="print-head">Parque de Estudo e Reflexão Retiro - ${esc(M.nome)}: ${esc(R.nome)} (${fmtData(hoje())})</h3>
      <p class="rc-resumo"><i class="fas fa-filter"></i> ${esc(resumoFiltros())}</p>${totais(l)}` +
        (l.length ? gs.map(([k, g]) => (S.grupo ? `<h4>${esc(k)} <small>(${g.length} registro(s)${somas(g).map(([r, v]) => ` · ${esc(r)}: ${fmtQ(v)}`).join('')})</small></h4>` : '') + tabela(g)).join('') : '<p class="vazio">Nenhum registro com esses filtros.</p>');
      root.querySelectorAll('.rc-th').forEach(b => b.onclick = () => {
        S.dir = S.ord === b.dataset.o ? -S.dir : 1; S.ord = b.dataset.o;
        $('#rc-o', root).value = S.ord; $('#rc-d', root).value = String(S.dir); res();
      });
    };

    const draw = () => {
      const op = k => { const v = new Set(); let vz = false; dados.forEach(r => { vazio(r[k]) ? vz = true : v.add(String(r[k])); }); return { l: [...v].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true })), vz }; };
      root.innerHTML = `<h3><i class="fas fa-chart-line"></i> Relatórios Consolidados</h3>
      <p>Escolha o módulo e o relatório, aplique filtros e ordene os resultados. ${me.nivel === 'administrador' ? 'Como administrador, você vê todos os módulos.' : 'Você vê apenas os módulos pelos quais é responsável.'}</p>
      <div class="rc-filtros no-print">
        <div class="form-row"><label for="rc-m">Módulo</label><select id="rc-m">${mods.map(m => `<option value="${m.id}"${m.id === S.mod ? ' selected' : ''}>${esc(m.nome)}</option>`).join('')}</select></div>
        <div class="form-row"><label for="rc-r">Relatório</label><select id="rc-r">${M.relatorios.map(r => `<option value="${r.id}"${r.id === S.rel ? ' selected' : ''}>${esc(r.nome)}</option>`).join('')}</select></div>
        ${R.periodo ? `<div class="form-row"><label for="rc-pp">Período (${esc(R.periodo.rot)})</label><select id="rc-pp">${PRESETS.map(p => `<option value="${p[0]}"${p[0] === S.preset ? ' selected' : ''}>${p[1]}</option>`).join('')}<option value="x"${S.preset === 'x' ? ' selected' : ''}>Personalizado</option></select></div>
        <div class="form-row"><label for="rc-de">De</label><input id="rc-de" type="date" value="${S.de}"></div><div class="form-row"><label for="rc-ate">Até</label><input id="rc-ate" type="date" value="${S.ate}"></div>` : ''}
        ${(R.filtros || []).map(k => { const o = op(k); return `<div class="form-row"><label for="rc-f-${esc(k)}">${esc(col(k).rot)}</label><select id="rc-f-${esc(k)}" data-fk="${esc(k)}"><option value="">Todos</option>${o.vz ? `<option value="__vazio"${S.f[k] === '__vazio' ? ' selected' : ''}>(não informado)</option>` : ''}${o.l.map(x => `<option${S.f[k] === x ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></div>`; }).join('')}
        <div class="form-row"><label for="rc-q">Buscar em todas as colunas</label><input id="rc-q" type="search" value="${esc(S.q)}"></div>
        ${(R.filtros || []).length ? `<div class="form-row"><label for="rc-g">Agrupar por</label><select id="rc-g"><option value="">Sem agrupamento</option>${R.filtros.map(k => `<option value="${esc(k)}"${S.grupo === k ? ' selected' : ''}>${esc(col(k).rot)}</option>`).join('')}</select></div>` : ''}
        <div class="form-row"><label for="rc-o">Ordenar por</label><select id="rc-o">${R.colunas.map(c => `<option value="${esc(c.k)}"${c.k === S.ord ? ' selected' : ''}>${esc(c.rot)}</option>`).join('')}</select></div>
        <div class="form-row"><label for="rc-d">Ordem</label><select id="rc-d"><option value="1"${S.dir > 0 ? ' selected' : ''}>Crescente</option><option value="-1"${S.dir < 0 ? ' selected' : ''}>Decrescente</option></select></div>
      </div>
      <p class="no-print"><button class="btn-visit" id="rc-p"><i class="fas fa-print"></i> Imprimir</button> <button class="btn-visit" id="rc-c"><i class="fas fa-file-csv"></i> Baixar (CSV)</button> <button class="btn-visit" id="rc-x" style="background:#6c7a7b">Limpar filtros</button></p>
      <div id="rc-res" aria-live="polite"></div>`;
      $('#rc-m', root).onchange = e => { S.mod = e.target.value; S.rel = ''; reinicia(); draw(); };
      $('#rc-r', root).onchange = e => { S.rel = e.target.value; reinicia(); draw(); };
      $('#rc-x', root).onclick = () => { reinicia(); draw(); };
      const pp = $('#rc-pp', root);
      if (pp) {
        pp.onchange = e => { S.preset = e.target.value; if (S.preset !== 'x') [S.de, S.ate] = faixa(S.preset, hoje()); $('#rc-de', root).value = S.de; $('#rc-ate', root).value = S.ate; res(); };
        const man = () => { S.de = $('#rc-de', root).value; S.ate = $('#rc-ate', root).value; S.preset = (S.de || S.ate) ? 'x' : ''; pp.value = S.preset; res(); };
        $('#rc-de', root).onchange = man; $('#rc-ate', root).onchange = man;
      }
      root.querySelectorAll('[data-fk]').forEach(s => s.onchange = () => { S.f[s.dataset.fk] = s.value; res(); });
      $('#rc-q', root).oninput = e => { S.q = e.target.value.trim(); res(); };
      const g = $('#rc-g', root); if (g) g.onchange = () => { S.grupo = g.value; res(); };
      $('#rc-o', root).onchange = e => { S.ord = e.target.value; res(); };
      $('#rc-d', root).onchange = e => { S.dir = +e.target.value; res(); };
      $('#rc-p', root).onclick = () => window.print();
      $('#rc-c', root).onclick = () => {
        const gs = grupos(filtra()), cab = (S.grupo ? [col(S.grupo).rot + ' (grupo)'] : []).concat(R.colunas.map(c => c.rot)), rows = [cab];
        gs.forEach(([k, g2]) => g2.forEach(r => rows.push((S.grupo ? [k] : []).concat(R.colunas.map(c => txt(c, r[c.k]))))));
        rows.push([], ['Filtros: ' + resumoFiltros()]);
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = `relatorio-${S.mod}-${S.rel}-${hoje()}.csv`; a.click();
      };
      res();
    };
    reinicia(); draw();
  }
};

/* ---------- Relatórios iniciais ---------- */
const catNome = id => window.PR_INVENTARIO ? window.PR_INVENTARIO.catNome(id) : id;
const sit = (e, h) => e.devolvido ? 'Devolvido' : (e.prevista && e.prevista < h ? 'Atrasado' : 'Em aberto');
const R = window.PR_RELATORIOS;

R.registrar({
  id: 'inventario', nome: 'Inventário', icone: 'fa-boxes', acesso: (me, H) => H.tem(me, 'inventario'),
  relatorios: [
    { id: 'itens', nome: 'Itens do inventário', periodo: { k: 'cadastro', rot: 'Data de cadastro' },
      colunas: [{ k: 'codigo', rot: 'Código', tipo: 'cod' }, { k: 'nome', rot: 'Item' }, { k: 'categoria', rot: 'Categoria' }, { k: 'quantidade', rot: 'Quantidade', tipo: 'num', soma: true }, { k: 'local', rot: 'Localização' }, { k: 'conserv', rot: 'Conservação' }, { k: 'status', rot: 'Status' }, { k: 'responsavel', rot: 'Responsável' }, { k: 'projeto', rot: 'Projeto/Campanha' }, { k: 'cadastro', rot: 'Cadastro', tipo: 'data' }, { k: 'marca', rot: 'Marca' }, { k: 'modelo', rot: 'Modelo' }, { k: 'serie', rot: 'Nº de série' }],
      filtros: ['categoria', 'status', 'responsavel', 'local', 'projeto', 'conserv'],
      linhas: H => H.db.get('inv_itens', []).map(i => ({ ...i, categoria: catNome(i.cat) })) },
    { id: 'mov', nome: 'Movimentações do inventário', periodo: { k: 'data', rot: 'Data da movimentação' },
      colunas: [{ k: 'data', rot: 'Data', tipo: 'data' }, { k: 'codigo', rot: 'Código', tipo: 'cod' }, { k: 'nome', rot: 'Item' }, { k: 'tipo', rot: 'Tipo' }, { k: 'qtd', rot: 'Quantidade', tipo: 'num', soma: true }, { k: 'det', rot: 'Detalhe' }, { k: 'por', rot: 'Registrado por' }, { k: 'categoria', rot: 'Categoria' }, { k: 'local', rot: 'Localização atual' }, { k: 'projeto', rot: 'Projeto/Campanha' }],
      filtros: ['tipo', 'por', 'categoria', 'local', 'projeto'],
      linhas: H => { const m = {}; H.db.get('inv_itens', []).forEach(i => { m[i.id] = i; }); return H.db.get('inv_mov', []).map(x => { const i = m[x.item] || {}; return { ...x, categoria: i.cat ? catNome(i.cat) : '', local: i.local || '', projeto: i.projeto || '' }; }); } },
    { id: 'emp', nome: 'Empréstimos do inventário', periodo: { k: 'saida', rot: 'Data da retirada' },
      colunas: [{ k: 'codigo', rot: 'Código', tipo: 'cod' }, { k: 'nome', rot: 'Item' }, { k: 'qtd', rot: 'Quantidade', tipo: 'num', soma: true }, { k: 'pessoa', rot: 'Retirado por' }, { k: 'saida', rot: 'Retirada', tipo: 'data' }, { k: 'prevista', rot: 'Prevista', tipo: 'data' }, { k: 'devolvido', rot: 'Devolvido em', tipo: 'data' }, { k: 'situacao', rot: 'Situação' }, { k: 'por', rot: 'Registrado por' }],
      filtros: ['situacao', 'pessoa', 'por'],
      linhas: H => H.db.get('inv_emp', []).map(e => ({ ...e, situacao: sit(e, H.hoje()) })) }
  ]
});

R.registrar({
  id: 'biblioteca', nome: 'Biblioteca / Acervo', icone: 'fa-book', acesso: (me, H) => H.NIV[me.nivel] >= 3, // editor (responsável pelo acervo) e administrador
  relatorios: [
    { id: 'acervo', nome: 'Acervo', periodo: { k: 'cadastro', rot: 'Data de cadastro' },
      colunas: [{ k: 'titulo', rot: 'Título' }, { k: 'autor', rot: 'Autor' }, { k: 'local', rot: 'Localização' }, { k: 'exemplares', rot: 'Exemplares', tipo: 'num', soma: true }, { k: 'emprestados', rot: 'Emprestados', tipo: 'num', soma: true }, { k: 'disponiveis', rot: 'Disponíveis', tipo: 'num', soma: true }, { k: 'situacao', rot: 'Situação' }, { k: 'cadastro', rot: 'Cadastro', tipo: 'data' }, { k: 'por', rot: 'Cadastrado por' }],
      filtros: ['autor', 'local', 'situacao', 'por'],
      linhas: H => H.livros().map(l => { const e = H.ativos(l.id).length; return { titulo: l.titulo, autor: l.autor, local: l.local || '', exemplares: H.exm(l), emprestados: e, disponiveis: H.exm(l) - e, situacao: H.exm(l) - e > 0 ? 'Disponível' : 'Todos emprestados', cadastro: l.data || '', por: l.por || '' }; }) },
    { id: 'emp', nome: 'Empréstimos de livros', periodo: { k: 'saida', rot: 'Data da retirada' },
      colunas: [{ k: 'titulo', rot: 'Livro' }, { k: 'autor', rot: 'Autor' }, { k: 'local', rot: 'Localização' }, { k: 'nome', rot: 'Retirado por' }, { k: 'saida', rot: 'Retirada', tipo: 'data' }, { k: 'prevista', rot: 'Prevista', tipo: 'data' }, { k: 'devolvido', rot: 'Devolvido em', tipo: 'data' }, { k: 'situacao', rot: 'Situação' }],
      filtros: ['situacao', 'autor', 'local', 'nome'],
      linhas: H => { const m = {}; H.livros().forEach(l => { m[l.id] = l; }); return H.emprest().map(e => { const l = m[e.livro] || {}; return { ...e, titulo: l.titulo || '(livro removido)', autor: l.autor || '', local: l.local || '', situacao: sit(e, H.hoje()) }; }); } }
  ]
});

R.registrar({
  id: 'reservas', nome: 'Alojamento / Reservas', icone: 'fa-bed', acesso: (me, H) => H.tem(me, 'reservas'),
  relatorios: [
    { id: 'pedidos', nome: 'Pedidos de reserva', periodo: { k: 'chegada', rot: 'Data de chegada' },
      colunas: [{ k: 'nome', rot: 'Solicitante' }, { k: 'status', rot: 'Situação' }, { k: 'chegada', rot: 'Chegada', tipo: 'data' }, { k: 'saida', rot: 'Saída', tipo: 'data' }, { k: 'noites', rot: 'Noites', tipo: 'num', soma: true }, { k: 'pessoas', rot: 'Pessoas', tipo: 'num', soma: true }, { k: 'hospedagem', rot: 'Cama no alojamento' }, { k: 'quartos', rot: 'Quarto(s)' }, { k: 'camas', rot: 'Camas' }, { k: 'assefaz', rot: 'ASSEFAZ' }, { k: 'cidade', rot: 'Cidade' }, { k: 'comunidade', rot: 'Comunidade / Organismo' }, { k: 'necessidades', rot: 'Necessidades específicas' }, { k: 'criado', rot: 'Registrado em', tipo: 'data' }, { k: 'por', rot: 'Registrado por' }],
      filtros: ['status', 'hospedagem', 'cidade', 'comunidade', 'por'],
      linhas: H => H.pedidos().map(p => {
        const cs = p.camas || [], nt = Math.max(1, Math.round((new Date(p.saida + 'T12:00:00') - new Date(p.chegada + 'T12:00:00')) / 864e5));
        return { ...p, status: { pendente: 'Aguardando resposta', confirmada: 'Confirmada', recusada: 'Recusada' }[p.status] || p.status, noites: nt, hospedagem: p.hospedagem ? 'Sim' : 'Não', quartos: [...new Set(cs.map(c => H.quartoDe(c.cama)))].join(', '), camas: cs.map(c => `${c.pessoa}: ${String(c.cama).padStart(2, '0')}`).join('; '), assefaz: (p.assefaz || []).map(a => `${a.pessoa} (${{ alinhando: 'em alinhamento', confirmada: 'confirmada', recusada: 'não aceitou' }[a.status]})`).join('; '), necessidades: p.necessidades || '' };
      }) },
    { id: 'receb', nome: 'Recebimentos do alojamento (Parque Retiro e ASSEFAZ)', periodo: { k: 'data', rot: 'Data do recebimento' },
      colunas: [{ k: 'data', rot: 'Data', tipo: 'data' }, { k: 'local', rot: 'Local' }, { k: 'nome', rot: 'Reserva de' }, { k: 'chegada', rot: 'Chegada', tipo: 'data' }, { k: 'saida', rot: 'Saída', tipo: 'data' }, { k: 'moeda', rot: 'Moeda' }, { k: 'valor', rot: 'Valor', tipo: 'num', soma: true }, { k: 'obs', rot: 'Observação' }, { k: 'por', rot: 'Registrado por' }],
      filtros: ['local', 'moeda', 'por'],
      linhas: H => H.pedidos().flatMap(p => (p.pag || []).map(g => ({ data: g.data, local: g.local === 'assefaz' ? 'ASSEFAZ' : 'Alojamento Parque Retiro', nome: p.nome, chegada: p.chegada, saida: p.saida, moeda: H.MOEDA[g.moeda] || g.moeda, valor: g.valor, obs: g.obs || '', por: g.por || '' }))) },
    { id: 'camas', nome: 'Hóspedes por cama (reservas confirmadas)', periodo: { k: 'chegada', rot: 'Data de chegada' },
      colunas: [{ k: 'pessoa', rot: 'Hóspede' }, { k: 'cama', rot: 'Cama' }, { k: 'nivel', rot: 'Nível' }, { k: 'quarto', rot: 'Quarto' }, { k: 'chegada', rot: 'Chegada', tipo: 'data' }, { k: 'saida', rot: 'Saída', tipo: 'data' }, { k: 'solicitante', rot: 'Solicitante' }, { k: 'cidade', rot: 'Cidade' }, { k: 'comunidade', rot: 'Comunidade / Organismo' }],
      filtros: ['quarto', 'nivel', 'cidade', 'comunidade'],
      linhas: H => { const l = []; H.pedidos().filter(p => p.status === 'confirmada').forEach(p => (p.camas || []).forEach(c => l.push({ pessoa: c.pessoa, cama: String(c.cama).padStart(2, '0'), nivel: c.cama % 2 ? 'baixo' : 'cima', quarto: H.quartoDe(c.cama), chegada: p.chegada, saida: p.saida, solicitante: p.nome, cidade: p.cidade || '', comunidade: p.comunidade || '' }))); return l; } }
  ]
});

R.registrar({
  id: 'jardinagem', nome: 'Jardinagem / Área Externa', icone: 'fa-seedling', acesso: (me, H) => H.tem(me, 'jardinagem'),
  relatorios: [
    { id: 'planos', nome: 'Planejamentos de jardinagem e reflorestamento', periodo: { k: 'inicio', rot: 'Início previsto' },
      colunas: [{ k: 'tipo', rot: 'Tipo' }, { k: 'titulo', rot: 'Título' }, { k: 'local', rot: 'Local' }, { k: 'inicio', rot: 'Início', tipo: 'data' }, { k: 'fim', rot: 'Fim', tipo: 'data' }, { k: 'status', rot: 'Situação' }, { k: 'resp', rot: 'Responsável' }, { k: 'voluntarios', rot: 'Voluntários', tipo: 'num', soma: true }, { k: 'especies', rot: 'Espécies' }, { k: 'mudas', rot: 'Mudas', tipo: 'num', soma: true }],
      filtros: ['tipo', 'status', 'resp', 'local'],
      linhas: H => H.db.get('jard_planos', []).map(p => ({ ...p, tipo: p.tipo === 'reflorestamento' ? 'Reflorestamento' : 'Jardinagem' })) }
  ]
});

// Comissões internas (comissoes-internas.js): Construção, Manutenção e Traduções. Só na área restrita.
[['construcao', 'Construção', 'fa-hard-hat', 'constr', 'Obras e etapas', 'inicio', 'Início previsto', [{ k: 'local', rot: 'Local' }, { k: 'custo', rot: 'Custo estimado (R$)', tipo: 'num', soma: true }, { k: 'voluntarios', rot: 'Voluntários', tipo: 'num', soma: true }], ['status', 'resp', 'local']],
 ['manutencao', 'Manutenção', 'fa-tools', 'manut', 'Pedidos de manutenção', 'inicio', 'Data do pedido', [{ k: 'local', rot: 'Local' }, { k: 'tipoMan', rot: 'Tipo' }, { k: 'prioridade', rot: 'Prioridade' }, { k: 'custo', rot: 'Custo estimado (R$)', tipo: 'num', soma: true }], ['status', 'prioridade', 'tipoMan', 'local']],
 ['traducoes', 'Traduções', 'fa-language', 'trad', 'Traduções', 'inicio', 'Data do pedido', [{ k: 'origem', rot: 'Idioma de origem' }, { k: 'destino', rot: 'Idioma de destino' }, { k: 'revisor', rot: 'Revisor(a)' }], ['status', 'origem', 'destino', 'resp']]
].forEach(([id, nome, icone, chave, rel, per, rotPer, extra, filtros]) => R.registrar({
  id, nome, icone, acesso: (me, H) => H.tem(me, id),
  relatorios: [
    { id: 'itens', nome: rel, periodo: { k: per, rot: rotPer },
      colunas: [{ k: 'titulo', rot: 'Título' }, { k: 'inicio', rot: rotPer, tipo: 'data' }, { k: 'fim', rot: id === 'construcao' ? 'Fim previsto' : 'Prazo', tipo: 'data' }, { k: 'status', rot: 'Situação' }, { k: 'resp', rot: id === 'traducoes' ? 'Tradutor(a)' : 'Responsável' }].concat(extra),
      filtros,
      linhas: H => H.db.get(chave + '_itens', []) }
  ]
}));

R.registrar({
  id: 'voluntarios', nome: 'Voluntários inscritos', icone: 'fa-hands-helping', acesso: (me, H) => H.tem(me, 'voluntario'),
  relatorios: [
    { id: 'inscritos', nome: 'Inscrições de voluntários', periodo: { k: 'inscricao', rot: 'Data da inscrição' },
      colunas: [{ k: 'nome', rot: 'Nome' }, { k: 'celular', rot: 'Celular / WhatsApp' }, { k: 'email', rot: 'E-mail' }, { k: 'cidade', rot: 'Cidade' }, { k: 'areas', rot: 'Colaborar com' }, { k: 'disp', rot: 'Disponibilidade' }, { k: 'situacao', rot: 'Situação' }, { k: 'inscricao', rot: 'Inscrição', tipo: 'data' }],
      filtros: ['situacao', 'cidade', 'disp'],
      linhas: H => H.db.get('voluntarios', []).map(v => ({ ...v, areas: (v.areas || []).join('; '), situacao: { novo: 'Novo', contato: 'Em contato', ativo: 'Voluntário(a) ativo(a)', semretorno: 'Sem retorno' }[v.status] || v.status, inscricao: (v.criadoEm || '').slice(0, 10) })) }
  ]
});

R.registrar({
  id: 'comunicacao', nome: 'Comunicação, Redes Sociais e Site', icone: 'fa-bullhorn', acesso: (me, H) => H.tem(me, 'comunicacao'),
  relatorios: [
    // Planejado × publicado. Use "Agrupar por" Canal, Formato, Projeto ou Situação: as colunas numéricas viram totais por grupo.
    { id: 'publicacoes', nome: 'Publicações: planejado × publicado', periodo: { k: 'data', rot: 'Data prevista' },
      colunas: [{ k: 'data', rot: 'Data', tipo: 'data' }, { k: 'canal', rot: 'Canal' }, { k: 'formato', rot: 'Formato' }, { k: 'tema', rot: 'Publicação' }, { k: 'projeto', rot: 'Projeto/campanha' }, { k: 'status', rot: 'Status' }, { k: 'situacao', rot: 'Situação' }, { k: 'pagina', rot: 'Página do site' }, { k: 'materiais', rot: 'Materiais' }, { k: 'resp', rot: 'Responsável' }, { k: 'publicadoEm', rot: 'Publicada em', tipo: 'data' }, { k: 'link', rot: 'Link' },
        { k: 'planejada', rot: 'Planejadas', tipo: 'num', soma: true }, { k: 'publicada', rot: 'Publicadas', tipo: 'num', soma: true }, { k: 'atrasada', rot: 'Em atraso', tipo: 'num', soma: true }, { k: 'semlink', rot: 'Publicadas sem link', tipo: 'num', soma: true }],
      filtros: ['canal', 'formato', 'projeto', 'status', 'situacao', 'resp'],
      linhas: H => {
        const db = H.db, hj = H.hoje(), nm = (l, id) => { const x = l.find(y => y.id === id); return x ? x.nome : ''; };
        const rs = db.get('com_redes', []), ts = db.get('com_tipos', []), pj = db.get('com_projetos', []), as = db.get('com_acoes', []), MAT = 4;
        const sl = window.PR_BANNERS ? window.PR_BANNERS.SLOTS : [];
        return db.get('com_posts', []).map(p => {
          const a = p.acao ? as.find(x => x.id === p.acao) : null, n = a && a.mat ? Object.keys(a.mat).filter(k => a.mat[k]).length : null, pub = p.status === 'Publicada', atr = !pub && p.data && p.data < hj;
          return { ...p, canal: nm(rs, p.rede) || p.rede, formato: nm(ts, p.tipo), projeto: nm(pj, p.projeto), situacao: pub ? 'Publicada' : atr ? 'Em atraso' : 'No prazo',
            pagina: p.bannerSlug ? ((sl.find(s => s.slug === p.bannerSlug) || {}).nome || p.bannerSlug) : '', materiais: n == null ? '' : n + '/' + MAT,
            planejada: 1, publicada: pub ? 1 : 0, atrasada: atr ? 1 : 0, semlink: pub && !p.link ? 1 : 0 };
        });
      } },
    { id: 'acoes', nome: 'Ações de comunicação e materiais', periodo: { k: 'data', rot: 'Data prevista' },
      colunas: [{ k: 'data', rot: 'Data', tipo: 'data' }, { k: 'tema', rot: 'Ação' }, { k: 'projeto', rot: 'Projeto/campanha' }, { k: 'resp', rot: 'Responsável' }, { k: 'canais', rot: 'Canais e formatos' }, { k: 'materiais', rot: 'Materiais' }, { k: 'pasta', rot: 'Pasta de materiais' }, { k: 'publicadas', rot: 'Publicadas', tipo: 'num', soma: true }, { k: 'total', rot: 'Publicações', tipo: 'num', soma: true }],
      filtros: ['projeto', 'resp', 'materiais'],
      linhas: H => {
        const db = H.db, nm = (l, id) => { const x = l.find(y => y.id === id); return x ? x.nome : ''; }, rs = db.get('com_redes', []), ts = db.get('com_tipos', []), pj = db.get('com_projetos', []), ps = db.get('com_posts', []);
        return db.get('com_acoes', []).map(a => { const l = ps.filter(p => p.acao === a.id), n = a.mat ? Object.keys(a.mat).filter(k => a.mat[k]).length : 0;
          return { ...a, projeto: nm(pj, a.projeto), canais: l.map(p => `${nm(rs, p.rede) || p.rede}: ${nm(ts, p.tipo) || '-'}`).join(' | '), materiais: n + '/4', pasta: a.pasta || '', publicadas: l.filter(p => p.status === 'Publicada').length, total: l.length }; });
      } }
  ]
});

R.registrar({
  id: 'atas', nome: 'Atas e encaminhamentos', icone: 'fa-file-signature', acesso: (me, H) => H.tem(me, 'documentos'),
  relatorios: [
    { id: 'encaminhamentos', nome: 'Encaminhamentos das atas', periodo: { k: 'dataAta', rot: 'Data da ata' },
      colunas: [{ k: 'ata', rot: 'Ata' }, { k: 'dataAta', rot: 'Data da ata', tipo: 'data' }, { k: 'texto', rot: 'Encaminhamento' }, { k: 'resp', rot: 'Responsável' }, { k: 'prazo', rot: 'Prazo', tipo: 'data' }, { k: 'situacao', rot: 'Situação' }, { k: 'calendario', rot: 'No calendário' }],
      filtros: ['situacao', 'resp', 'calendario', 'ata'],
      linhas: H => { const hj = H.hoje(), at = H.db.get('ativ', []), l = [];
        H.db.get('docs', []).filter(d => d.area === 'atas').forEach(d => (d.enc || []).forEach(e => { const a = e.ativ ? at.find(x => x.id === e.ativ) : null, prazo = a ? a.data : e.data || '';
          l.push({ ata: d.titulo, dataAta: d.data, texto: e.texto, resp: e.resp || '', prazo, situacao: e.status === 'Em aberto' && prazo && prazo < hj ? 'Em atraso' : e.status, calendario: a ? 'Sim' : 'Não' }); }));
        return l; } }
  ]
});
})();
