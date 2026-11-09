// Módulo Inventário da área restrita. Dados salvos no navegador (localStorage, chaves pr_inv_*).
// Carregado antes de area.js, que o chama pela aba "Inventário".
(function () {
/* ---------- Tabelas fixas ---------- */
// pref = prefixo do código. INV: bens gerais. MAT: materiais de estoque/consumo. COM: comunicação e campanhas.
// Para mudar o prefixo de uma categoria, altere só a linha dela (códigos já emitidos não mudam).
const CATS = [
  { id: 'mov', nome: 'Móveis, Utensílios e Equipamentos', pref: 'INV', equip: true, pat: true },
  { id: 'fer', nome: 'Ferramentas e Máquinas', pref: 'INV', equip: true, pat: true },
  { id: 'obra', nome: 'Materiais de Obra', pref: 'MAT', estoque: true },
  { id: 'jar', nome: 'Jardinagem e Área Externa', pref: 'INV', pat: true },
  { id: 'lim', nome: 'Limpeza e Consumo', pref: 'MAT', estoque: true },
  { id: 'com', nome: 'Comunicação, Divulgação e Campanhas', pref: 'COM', estoque: true }
];
const catDe = id => CATS.find(c => c.id === id) || { id, nome: '(categoria removida)', pref: 'INV' };
const ORIGENS_PAT = ['Compra', 'Doação', 'Obra / construção', 'Outra'];
const CONSERV = ['Novo', 'Bom', 'Regular', 'Ruim', 'Inservível'];
const STATUS = ['Disponível', 'Em uso', 'Emprestado', 'Em manutenção', 'Baixado'];
const TIPOS = ['Entrada', 'Saída', 'Empréstimo', 'Transferência', 'Manutenção', 'Retorno de manutenção', 'Ajuste de estoque', 'Baixa', 'Reativação'];
const PROJ_SEED = ['Celebração 15 anos do Parque', 'Marcha Mundial', 'Campanha da Sala', 'Construção do Parque'];
const ST_CLASSE = { 'Disponível': 'badge-disponivel', 'Em uso': 'badge-uso', 'Emprestado': 'badge-pend', 'Em manutenção': 'badge-pend', 'Baixado': 'badge-indisponivel' };
const fmtCod = (p, n) => p + '-' + String(n).padStart(4, '0');
const fmtQ = n => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

const abrirApi = (me, H) => { const saida = {}; window.PR_INVENTARIO.abrir(me, document.createElement('div'), Object.assign({}, H, { modo: 'api', saida })); return saida.api; };
window.PR_INVENTARIO = { catNome: id => catDe(id).nome,
  // Usados pela Prestação de Contas (area.js): quem chama decide a permissão.
  painelCompra(me, H, el, lanc, onFim, modoIni) { abrirApi(me, H).painel(el, lanc, onFim, modoIni); },
  lancamentoRemovido(me, H, id) { return abrirApi(me, H).lancamentoRemovido(id); },
  bensDoLancamento(me, H, id) { return abrirApi(me, H).doLanc(id); },
  abrir(me, root, H) {
  const { db, esc, $, uid, hoje, fmtData, csv, reduz, norm } = H;
  const pode = H.modo === 'api' || H.tem(me, 'inventario'); // administrador ou Responsável pelo Inventário (no modo 'api', a permissão é decidida por quem chama: Prestação de Contas)
  let sub = 'consulta', verId = null, editId = null, movItem = '', msg = '', rsub = 'geral';

  /* ---------- Dados ---------- */
  const itens = () => db.get('inv_itens', []);
  const emps = () => db.get('inv_emp', []);
  const movs = () => db.get('inv_mov', []);
  const projetos = () => { let l = db.get('inv_proj', null); if (!l) { l = PROJ_SEED.slice(); db.set('inv_proj', l); } return l; };
  const emAberto = id => emps().filter(e => e.item === id && !e.devolvido).reduce((s, e) => s + e.qtd, 0);
  const mapaEmp = () => { const m = {}; emps().filter(e => !e.devolvido).forEach(e => { m[e.item] = (m[e.item] || 0) + e.qtd; }); return m; };
  const porCod = (a, b) => a.codigo.localeCompare(b.codigo);
  const qtdRaw = i => fmtQ(i.quantidade) + (i.unidade && i.unidade !== 'un' ? ' ' + i.unidade : '');
  const stBadge = s => `<span class="badge-status ${ST_CLASSE[s] || 'badge-pend'}">${esc(s)}</span>`;
  const codBadge = c => `<span class="inv-code">${esc(c)}</span>`;
  const sinc = it => {
    if (it.status === 'Baixado' || it.status === 'Em manutenção') return;
    const e = emAberto(it.id);
    if (e > 0 && e >= it.quantidade) it.status = 'Emprestado'; else if (it.status === 'Emprestado') it.status = 'Disponível';
  };
  const regMov = (it, tipo, qtd, det, extra) => { const l = movs(); l.push({ id: uid(), item: it.id, codigo: it.codigo, nome: it.nome, tipo, qtd: qtd === '' ? '' : qtd, det: det || '', data: hoje(), por: me.nome, saldo: it.quantidade, ...(extra || {}) }); return db.set('inv_mov', l); };

  /* ---------- Códigos: únicos, sequenciais, permanentes, nunca reutilizados ---------- */
  // O contador (inv_seq) só cresce. O registro (inv_cod) guarda todo código já emitido, mesmo de itens excluídos.
  const calcCodigo = pref => {
    const seq = db.get('inv_seq', {}), reg = db.get('inv_cod', []);
    const usados = new Set(reg.map(r => r.codigo).concat(itens().map(i => i.codigo)));
    let n = [...usados].filter(c => c.startsWith(pref + '-')).reduce((m, c) => Math.max(m, parseInt(c.slice(pref.length + 1), 10) || 0), seq[pref] || 0) + 1;
    while (usados.has(fmtCod(pref, n))) n++;
    return { n, cod: fmtCod(pref, n), seq, reg };
  };
  const emitirCodigo = (pref, id, nome) => {
    const c = calcCodigo(pref);
    c.seq[pref] = c.n; c.reg.push({ codigo: c.cod, item: id, nome, emitido: hoje(), por: me.nome });
    return db.set('inv_seq', c.seq) && db.set('inv_cod', c.reg) ? c.cod : null;
  };
  const marcaCodigoFora = (cod, motivo, nome) => { const r = db.get('inv_cod', []), x = r.find(y => y.codigo === cod); if (x) { x.excluidoEm = hoje(); x.motivo = motivo; x.por2 = me.nome; if (nome) x.nome = nome; db.set('inv_cod', r); } };

  /* ---------- Patrimônio ---------- */
  // Marca no próprio item (campos pat*), sem duplicar dados. O número PAT-0000 é permanente e nunca reutilizado (registro inv_pat_cod).
  // Valor, data de aquisição, origem e nota fiscal são opcionais: podem ser completados depois.
  const elegivelPat = it => !!catDe(it.cat).pat;
  const ehPat = it => !!it.patrimonio;
  const patLivre = (num, idIgnora) => !db.get('inv_pat_cod', []).some(r => r.numero.toLowerCase() === num.toLowerCase() && r.item !== idIgnora);
  const proximoPat = () => {
    const seq = db.get('inv_pat_seq', 0), reg = db.get('inv_pat_cod', []);
    let n = Math.max(seq, reg.reduce((m, r) => Math.max(m, /^PAT-\d+$/.test(r.numero) ? parseInt(r.numero.slice(4), 10) : 0), 0)) + 1;
    while (!patLivre(fmtCod('PAT', n))) n++;
    return { n, numero: fmtCod('PAT', n) };
  };
  const lerValor = t => { const x = String(t == null ? '' : t).trim().replace(/\./g, '').replace(',', '.'); if (x === '') return ''; const n = Number(x); return isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN; };
  // dados: { plaqueta, valor, aquisicao, origem, nf, obs }. Devolve mensagem de erro ou null. Altera o objeto 'it' (o chamador grava).
  const validaPat = (it, d) => {
    if (!elegivelPat(it)) return 'Esta categoria não entra no patrimônio (materiais de consumo e de estoque ficam só no inventário).';
    if (Number.isNaN(lerValor(d.valor))) return 'O valor do patrimônio deve ser um número maior ou igual a zero (ou ficar em branco).';
    if (d.aquisicao && d.aquisicao > hoje()) return 'A data de aquisição não pode ser no futuro.';
    if (!it.patNumero && (d.plaqueta || '').trim() && !patLivre(d.plaqueta.trim(), it.id)) return 'Este número de patrimônio já foi usado em outro item.';
    return null;
  };
  const aplicaPat = (it, d) => {
    const ev = validaPat(it, d); if (ev) return ev;
    const valor = lerValor(d.valor);
    if (!it.patNumero) {
      const plaq = (d.plaqueta || '').trim();
      if (plaq) { it.patNumero = plaq; it.patManual = true; }
      else { const p = proximoPat(); it.patNumero = p.numero; db.set('inv_pat_seq', p.n); }
      const reg = db.get('inv_pat_cod', []); reg.push({ numero: it.patNumero, item: it.id, codigo: it.codigo, nome: it.nome, emitido: hoje(), por: me.nome }); db.set('inv_pat_cod', reg);
    }
    it.patrimonio = true; if (!it.patEm) it.patEm = hoje();
    if (d.valor !== undefined) it.patValor = valor;
    if (d.aquisicao !== undefined) it.patAquisicao = d.aquisicao || '';
    if (d.origem !== undefined) it.patOrigem = d.origem || '';
    if (d.nf !== undefined) it.patNF = (d.nf || '').trim();
    if (d.obs !== undefined) it.patObs = (d.obs || '').trim();
    return null;
  };
  const marcarPat = (id, d, det) => {
    if (!pode) return 'Você não tem permissão para marcar patrimônio.';
    const l = itens(), it = l.find(x => x.id === id); if (!it) return 'Item não encontrado.';
    const era = ehPat(it), er = aplicaPat(it, d || {}); if (er) return er;
    if (!db.set('inv_itens', l)) return 'Sem espaço no navegador para salvar.';
    regMov(it, 'Patrimônio', '', era ? 'Dados do patrimônio atualizados (' + it.patNumero + ')' : 'Marcado como patrimônio: ' + it.patNumero + (det ? '. ' + det : '')); return null;
  };
  const desmarcarPat = (id, motivo) => {
    if (!pode) return 'Você não tem permissão para alterar o patrimônio.';
    const l = itens(), it = l.find(x => x.id === id); if (!it || !ehPat(it)) return 'O item não está no patrimônio.';
    if (!motivo) return 'Informe o motivo da retirada do patrimônio.';
    it.patrimonio = false; it.patSaiu = hoje(); it.patSaiuMotivo = motivo;
    if (!db.set('inv_itens', l)) return 'Sem espaço no navegador para salvar.';
    regMov(it, 'Patrimônio', '', 'Retirado do patrimônio (' + it.patNumero + '): ' + motivo); return null;
  };
  const moneyPat = v => v === '' || v == null ? '-' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const faltaPat = it => [it.patValor === '' || it.patValor == null ? 'valor' : '', it.patAquisicao ? '' : 'data', it.patNF ? '' : 'nota fiscal'].filter(Boolean);
  const patBadge = it => ehPat(it) ? ` <span class="badge-status badge-uso" title="${esc(it.patNumero)}">Patrimônio ${esc(it.patNumero)}</span>` : '';

  /* ---------- Movimentações ---------- */
  const aplicar = (tipo, id, d) => {
    if (!pode) return 'Você não tem permissão para registrar movimentações.';
    const l = itens(), it = l.find(x => x.id === id);
    if (!it) return 'Item não encontrado.';
    if (it.status === 'Baixado' && tipo !== 'Reativação') return 'Este item está baixado. Reative-o antes de movimentar.';
    const disp = it.quantidade - emAberto(id), q = parseFloat(d.qtd), det = (d.det || '').trim();
    let reg = det, qr = '', loan = null;
    if (tipo === 'Entrada') { if (!(q > 0)) return 'Informe a quantidade.'; it.quantidade = Math.round((it.quantidade + q) * 100) / 100; qr = q; }
    else if (tipo === 'Saída') {
      if (!(q > 0)) return 'Informe a quantidade.'; if (q > disp) return `Só há ${fmtQ(disp)} disponível para saída.`;
      if (!det) return 'Informe o destino ou motivo da saída.'; it.quantidade = Math.round((it.quantidade - q) * 100) / 100; qr = q;
    } else if (tipo === 'Empréstimo') {
      if (!(q > 0)) return 'Informe a quantidade.'; if (q > disp) return `Só há ${fmtQ(disp)} disponível para empréstimo.`;
      if (!d.pessoa) return 'Informe quem está retirando.'; if (d.prevista && d.prevista < hoje()) return 'A devolução prevista não pode ser no passado.';
      if (it.status === 'Em manutenção') return 'Item em manutenção não pode ser emprestado.';
      loan = { id: uid(), item: it.id, codigo: it.codigo, nome: it.nome, qtd: q, pessoa: d.pessoa, saida: hoje(), prevista: d.prevista || '', devolvido: '', por: me.nome };
      reg = `Para ${d.pessoa}${d.prevista ? ', devolução prevista ' + fmtData(d.prevista) : ''}`; qr = q;
    } else if (tipo === 'Transferência') {
      if (!d.local) return 'Informe a nova localização.'; reg = `${it.local || '-'} → ${d.local}`; it.local = d.local;
    } else if (tipo === 'Manutenção') {
      if (emAberto(id) > 0) return 'Há unidades emprestadas. Registre a devolução antes.'; if (it.status === 'Em manutenção') return 'O item já está em manutenção.';
      it.status = 'Em manutenção'; it.manutDesde = hoje(); it.manutObs = det;
    } else if (tipo === 'Retorno de manutenção') {
      if (it.status !== 'Em manutenção') return 'Este item não está em manutenção.'; it.status = 'Disponível'; it.manutDesde = ''; it.manutObs = '';
    } else if (tipo === 'Ajuste de estoque') {
      if (!(q >= 0)) return 'Informe a quantidade correta em estoque.'; if (q < emAberto(id)) return 'A quantidade não pode ser menor que a emprestada.';
      if (!det) return 'Informe o motivo do ajuste (contagem, perda, correção...).'; reg = `${fmtQ(it.quantidade)} → ${fmtQ(q)}. ${det}`; it.quantidade = q; qr = q;
    } else if (tipo === 'Baixa') {
      if (!det) return 'Informe o motivo da baixa.'; if (emAberto(id) > 0) return 'Há unidades emprestadas. Registre a devolução antes.';
      it.status = 'Baixado'; it.baixaData = hoje(); it.baixaMotivo = det;
    } else if (tipo === 'Reativação') {
      if (it.status !== 'Baixado') return 'O item não está baixado.'; it.status = 'Disponível'; it.baixaData = ''; it.baixaMotivo = '';
    } else return 'Tipo de movimentação inválido.';
    sinc(it);
    const le = emps(); if (loan) le.push(loan);
    if (!(db.set('inv_itens', l) && db.set('inv_emp', le) && regMov(it, tipo, qr, reg))) return 'Sem espaço no navegador para salvar a movimentação.';
    return null;
  };
  const devolver = idEmp => {
    if (!pode) return;
    const le = emps(), e = le.find(x => x.id === idEmp); if (!e || e.devolvido) return;
    e.devolvido = hoje(); db.set('inv_emp', le);
    const l = itens(), it = l.find(x => x.id === e.item);
    if (it) { sinc(it); db.set('inv_itens', l); regMov(it, 'Devolução', e.qtd, `De ${e.pessoa}`); }
    else { const m = movs(); m.push({ id: uid(), item: e.item, codigo: e.codigo, nome: e.nome, tipo: 'Devolução', qtd: e.qtd, det: `De ${e.pessoa}`, data: hoje(), por: me.nome, saldo: '' }); db.set('inv_mov', m); }
  };
  const exclui = it => {
    if (!pode) return;
    if (emAberto(it.id)) return alert('Este item tem empréstimo em aberto. Registre a devolução antes de excluir.');
    if (!confirm(`Excluir definitivamente ${it.codigo} - ${it.nome}?\n\nO código ${it.codigo} será mantido no registro e nunca será reutilizado. Se o objetivo é só tirar o item de uso, prefira "Dar baixa".`)) return;
    regMov(it, 'Exclusão', '', 'Item excluído do inventário');
    marcaCodigoFora(it.codigo, 'Excluído', it.nome);
    db.set('inv_itens', itens().filter(x => x.id !== it.id)); verId = null; draw();
  };

  /* ---------- Consulta (todos os usuários autorizados) ---------- */
  const miniFoto = i => i.foto && /^data:image\//.test(i.foto) ? `<img class="inv-thumb" src="${esc(i.foto)}" alt="Foto de ${esc(i.nome)}" loading="lazy">` : '<div class="inv-thumb inv-thumb-ph" aria-hidden="true"><i class="fas fa-box"></i></div>';
  const consulta = el => {
    if (verId) return detalhe(el);
    const its = itens(), n = s => its.filter(i => i.status === s).length;
    const locs = [...new Set(its.map(i => i.local).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    el.innerHTML = `<h3><i class="fas fa-boxes"></i> Inventário do Parque</h3><p>Bens e materiais físicos do Parque. Cada item tem um código permanente gerado pelo sistema.${pode ? ' Bens duráveis podem ser marcados como patrimônio (botão <strong>+ Patrimônio</strong>, ou no cadastro).' : ' Seu acesso é de consulta.'}</p>
    ${msg ? `<p class="tip-box" role="status"><i class="fas fa-check-circle"></i> ${esc(msg)}</p>` : ''}
    <div class="totais"><div><span>Itens em uso no Parque</span><strong>${its.length - n('Baixado')}</strong></div><div><span>Emprestados</span><strong>${n('Emprestado')}</strong></div><div><span>Em manutenção</span><strong>${n('Em manutenção')}</strong></div><div><span>Baixados</span><strong>${n('Baixado')}</strong></div></div>
    <div class="inv-filtros">
      <div class="form-row"><label for="i-q">Buscar (código, nome, marca, série...)</label><input id="i-q" type="search" placeholder="Ex.: INV-0001, furadeira, banner"></div>
      <div class="form-row"><label for="i-c">Categoria</label><select id="i-c"><option value="">Todas</option>${CATS.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('')}</select></div>
      <div class="form-row"><label for="i-l">Localização</label><select id="i-l"><option value="">Todas</option>${locs.map(x => `<option>${esc(x)}</option>`).join('')}</select></div>
      <div class="form-row"><label for="i-s">Status</label><select id="i-s"><option value="">Todos, exceto baixados</option>${STATUS.map(s => `<option>${s}</option>`).join('')}<option value="*">Todos, inclusive baixados</option></select></div>
      <div class="form-row"><label for="i-pa">Patrimônio</label><select id="i-pa"><option value="">Todos</option><option value="s">Só patrimônio</option><option value="n">Fora do patrimônio</option></select></div>
      <div class="form-row"><label for="i-p">Projeto/Campanha</label><select id="i-p"><option value="">Todos</option><option value="__sem">Sem projeto</option>${projetos().map(p => `<option>${esc(p)}</option>`).join('')}</select></div>
    </div><p id="i-n" class="vazio" aria-live="polite"></p><div id="i-l2"></div>`;
    const lista = () => {
      const q = norm($('#i-q', el).value.trim()), c = $('#i-c', el).value, lo = $('#i-l', el).value, st = $('#i-s', el).value, pj = $('#i-p', el).value, pa = $('#i-pa', el).value, em = mapaEmp();
      const f = its.filter(i => (!q || norm([i.codigo, i.nome, i.descricao, i.marca, i.modelo, i.serie, i.local, i.responsavel, i.projeto, i.obs].join(' ')).includes(q)) && (!c || i.cat === c) && (!lo || i.local === lo) && (st === '*' || (st ? i.status === st : i.status !== 'Baixado')) && (!pj || (pj === '__sem' ? !i.projeto : i.projeto === pj)) && (!pa || (pa === 's' ? ehPat(i) : !ehPat(i)))).sort(porCod);
      $('#i-n', el).textContent = its.length ? f.length + ' item(ns) encontrado(s).' : 'Nenhum item cadastrado ainda.';
      $('#i-l2', el).innerHTML = f.length ? `<table class="doc-table"><thead><tr><th>Foto</th><th>Código</th><th>Item</th><th>Categoria</th><th>Qtd.</th><th>Localização</th><th>Conservação</th><th>Status</th><th>Projeto/Campanha</th><th></th></tr></thead><tbody>${f.map(i => `<tr><td>${miniFoto(i)}</td><td>${codBadge(i.codigo)}</td><td><strong>${esc(i.nome)}</strong>${patBadge(i)}${i.marca || i.modelo ? `<br><small>${esc([i.marca, i.modelo].filter(Boolean).join(' '))}</small>` : ''}</td><td>${esc(catDe(i.cat).nome)}</td><td>${em[i.id] ? `${fmtQ(i.quantidade - em[i.id])} de ${esc(qtdRaw(i))}` : esc(qtdRaw(i))}</td><td>${esc(i.local || '-')}</td><td>${esc(i.conserv)}</td><td>${stBadge(i.status)}</td><td>${esc(i.projeto || '-')}</td><td><button class="btn-visit" data-ver="${i.id}">Ver</button>${pode && elegivelPat(i) && !ehPat(i) && i.status !== 'Baixado' ? ` <button class="btn-visit" data-pat="${i.id}" title="Marcar este item como patrimônio (valor, data e nota fiscal podem ser preenchidos depois)">+ Patrimônio</button>` : ''}</td></tr>`).join('')}</tbody></table>` : '';
      el.querySelectorAll('[data-ver]').forEach(b => b.onclick = () => { verId = b.dataset.ver; draw(); window.scrollTo(0, 0); });
      el.querySelectorAll('[data-pat]').forEach(b => b.onclick = () => {
        const it = itens().find(x => x.id === b.dataset.pat); if (!it || !confirm(`Marcar ${it.codigo} - ${it.nome} como patrimônio?\n\nValor, data de aquisição e nota fiscal podem ficar em branco e ser preenchidos depois (Editar, ou aba Patrimônio).`)) return;
        const er = marcarPat(it.id, {}); if (er) alert(er); else { msg = `${it.codigo} marcado como patrimônio.`; draw(); }
      });
    };
    $('#i-q', el).oninput = lista; // só 'input': o 'change' do campo de texto redesenharia a lista no meio do clique em "Ver"
    el.querySelectorAll('.inv-filtros select').forEach(x => { x.onchange = lista; });
    lista();
  };

  const detalhe = el => {
    const i = itens().find(x => x.id === verId);
    if (!i) { verId = null; return consulta(el); }
    const lo = emps().filter(e => e.item === i.id && !e.devolvido), fora = emAberto(i.id), hist = movs().filter(m => m.item === i.id).reverse().slice(0, 40);
    const eq = catDe(i.cat).equip;
    const campos = [['Código', codBadge(i.codigo)], ['Nome do item', esc(i.nome)], ['Categoria', esc(catDe(i.cat).nome)], ['Descrição', esc(i.descricao) || '-'],
      ['Quantidade', `${esc(qtdRaw(i))}${fora ? ` (${fmtQ(fora)} emprestada(s), ${fmtQ(i.quantidade - fora)} disponível)` : ''}`], ['Localização', esc(i.local || '-')], ['Estado de conservação', esc(i.conserv)], ['Status', stBadge(i.status)],
      ['Responsável', esc(i.responsavel || '-')], ['Data de cadastro', fmtData(i.cadastro)], ['Projeto/Campanha', esc(i.projeto || '-')]]
      .concat(eq || i.marca || i.modelo || i.serie ? [['Marca', esc(i.marca || '-')], ['Modelo', esc(i.modelo || '-')], ['Número de série', esc(i.serie || '-')]] : [])
      .concat(i.estoqueMin ? [['Estoque mínimo', fmtQ(i.estoqueMin)]] : [])
      .concat(ehPat(i) ? [['Patrimônio', esc(i.patNumero) + ' <small>desde ' + fmtData(i.patEm) + '</small>'], ['Valor', moneyPat(i.patValor)], ['Data de aquisição', i.patAquisicao ? fmtData(i.patAquisicao) : 'em aberto'], ['Origem', esc(i.patOrigem || 'em aberto')], ['Nota fiscal', esc(i.patNF || 'em aberto')]].concat(i.patLancInfo ? [['Lançamento (Prestação de Contas)', fmtData(i.patLancInfo.data) + ' - ' + esc(i.patLancInfo.desc) + (i.patLancRemovido ? ' <strong>(lançamento removido)</strong>' : '')]] : []).concat(i.patObs ? [['Obs. do patrimônio', esc(i.patObs)]] : []) : i.patNumero ? [['Patrimônio', esc(i.patNumero) + ' <small>retirado em ' + fmtData(i.patSaiu) + ': ' + esc(i.patSaiuMotivo || '') + '</small>']] : [])
      .concat(i.status === 'Em manutenção' ? [['Em manutenção desde', fmtData(i.manutDesde) + (i.manutObs ? ' - ' + esc(i.manutObs) : '')]] : [])
      .concat(i.status === 'Baixado' ? [['Baixa', fmtData(i.baixaData) + ' - ' + esc(i.baixaMotivo)]] : [])
      .concat([['Observações', esc(i.obs) || '-']]);
    el.innerHTML = `<p class="inv-noprint"><button class="btn-visit" id="d-v"><i class="fas fa-arrow-left"></i> Voltar à lista</button>${pode ? ` <button class="btn-visit" id="d-e"><i class="fas fa-edit"></i> Editar</button> <button class="btn-visit" id="d-m"><i class="fas fa-exchange-alt"></i> Movimentar</button> ${i.status === 'Baixado' ? '<button class="btn-visit" id="d-r">Reativar</button>' : '<button class="btn-visit" id="d-b" style="background:#b8620f">Dar baixa</button>'} ${elegivelPat(i) ? (ehPat(i) ? '<button class="btn-visit" id="d-pr" style="background:#6c7a7b">Retirar do patrimônio</button>' : '<button class="btn-visit" id="d-pm">+ Patrimônio</button>') : ''} <button class="btn-visit" id="d-x" style="background:#b3261e"><i class="fas fa-trash"></i> Excluir</button>` : ''}</p>
    <div class="inv-det">${i.foto && /^data:image\//.test(i.foto) ? `<img class="inv-foto" src="${esc(i.foto)}" alt="Foto de ${esc(i.nome)}">` : '<div class="inv-foto inv-thumb-ph"><i class="fas fa-box"></i><span>Sem foto</span></div>'}
    <dl>${campos.map(c => `<dt>${c[0]}</dt><dd>${c[1]}</dd>`).join('')}</dl></div>
    ${lo.length ? `<h4>Empréstimos em aberto</h4><ul>${lo.map(e => `<li>${fmtQ(e.qtd)} un. com ${esc(e.pessoa)} desde ${fmtData(e.saida)}${e.prevista ? ', prevista ' + fmtData(e.prevista) : ''}</li>`).join('')}</ul>` : ''}
    <h4>Histórico de movimentações</h4>${hist.length ? `<table class="doc-table"><thead><tr><th>Data</th><th>Tipo</th><th>Qtd.</th><th>Detalhe</th><th>Registrado por</th></tr></thead><tbody>${hist.map(m => `<tr><td>${fmtData(m.data)}</td><td>${esc(m.tipo)}</td><td>${m.qtd === '' ? '-' : fmtQ(m.qtd)}</td><td>${esc(m.det) || '-'}</td><td>${esc(m.por)}</td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhuma movimentação registrada.</p>'}`;
    $('#d-v', el).onclick = () => { verId = null; draw(); };
    if (!pode) return;
    $('#d-e', el).onclick = () => { editId = i.id; sub = 'cad'; draw(); window.scrollTo(0, 0); };
    $('#d-m', el).onclick = () => { movItem = i.id; sub = 'mov'; draw(); window.scrollTo(0, 0); };
    $('#d-x', el).onclick = () => exclui(i);
    const pm = $('#d-pm', el); if (pm) pm.onclick = () => { if (!confirm(`Marcar ${i.codigo} - ${i.nome} como patrimônio?\n\nValor, data de aquisição e nota fiscal podem ficar em branco e ser preenchidos depois (Editar).`)) return; const er = marcarPat(i.id, {}); if (er) alert(er); draw(); };
    const pr = $('#d-pr', el); if (pr) pr.onclick = () => { const m = prompt('Motivo da retirada do patrimônio (ex.: lançado por engano, doado, descartado):'); if (m === null) return; const er = desmarcarPat(i.id, m.trim()); if (er) alert(er); draw(); };
    const b = $('#d-b', el); if (b) b.onclick = () => { const m = prompt('Motivo da baixa (ex.: quebrado, doado, perdido, consumido):'); if (m === null) return; const er = aplicar('Baixa', i.id, { det: m }); if (er) alert(er); draw(); };
    const r = $('#d-r', el); if (r) r.onclick = () => { if (confirm('Reativar este item?')) { const er = aplicar('Reativação', i.id, {}); if (er) alert(er); draw(); } };
  };

  /* ---------- Cadastro e edição (administrador / responsável) ---------- */
  const cad = el => {
    const ed = editId ? itens().find(i => i.id === editId) : null;
    const v = ed || { cat: CATS[0].id, nome: '', descricao: '', quantidade: 1, unidade: 'un', local: '', conserv: 'Bom', status: 'Disponível', responsavel: me.nome, obs: '', projeto: '', marca: '', modelo: '', serie: '', estoqueMin: '' };
    const locs = [...new Set(itens().map(i => i.local).filter(Boolean))], nomes = db.get('users', []).map(u => u.nome);
    const stLivre = ['Disponível', 'Em uso'].includes(v.status);
    const opt = (l, s) => l.map(x => `<option${x === s ? ' selected' : ''}>${esc(x)}</option>`).join('');
    el.innerHTML = `<h3><i class="fas ${ed ? 'fa-edit' : 'fa-plus-circle'}"></i> ${ed ? 'Editar item' : 'Cadastrar item no inventário'}</h3>
    ${msg ? `<p class="tip-box" role="status"><i class="fas fa-check-circle"></i> ${msg}</p>` : ''}
    <form id="fi" class="form-reserva" novalidate>
      <div class="form-row"><label>Código de identificação</label><div class="inv-cod-box" id="i-cod">${ed ? codBadge(ed.codigo) + ' <small>permanente, não pode ser alterado</small>' : ''}</div></div>
      <div class="form-row"><label for="f-c">Categoria *</label><select id="f-c">${CATS.map(c => `<option value="${c.id}"${c.id === v.cat ? ' selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></div>
      <div class="form-row"><label for="f-n">Nome do item *</label><input id="f-n" maxlength="100" value="${esc(v.nome)}" placeholder="Ex.: Furadeira, Banner da Marcha Mundial, Cadeira"></div>
      <div class="form-row"><label for="f-d">Descrição</label><textarea id="f-d" rows="2" maxlength="400">${esc(v.descricao)}</textarea></div>
      <div id="f-eq"><div class="form-row"><label for="f-ma">Marca</label><input id="f-ma" maxlength="60" value="${esc(v.marca)}"></div>
      <div class="form-row"><label for="f-mo">Modelo</label><input id="f-mo" maxlength="60" value="${esc(v.modelo)}"></div>
      <div class="form-row"><label for="f-se">Número de série</label><input id="f-se" maxlength="60" value="${esc(v.serie)}"></div></div>
      <div class="form-row"><label for="f-q">Quantidade *</label><input id="f-q" type="number" min="0" step="any" value="${v.quantidade}"${ed ? ' disabled' : ''}>${ed ? '<small>Para alterar o estoque, use a aba Movimentações (entrada, saída ou ajuste). Assim fica tudo registrado.</small>' : ''}</div>
      <div class="form-row"><label for="f-u">Unidade (opcional)</label><input id="f-u" maxlength="15" value="${esc(v.unidade || 'un')}" placeholder="un, kg, L, pacote..."></div>
      <div class="form-row" id="f-mw"><label for="f-mi">Estoque mínimo para alerta (opcional)</label><input id="f-mi" type="number" min="0" step="any" value="${esc(v.estoqueMin)}"></div>
      <div class="form-row"><label for="f-l">Localização *</label><input id="f-l" list="dl-loc" maxlength="80" value="${esc(v.local)}" placeholder="Ex.: Depósito, Sala, Silo, Cozinha"><datalist id="dl-loc">${locs.map(x => `<option value="${esc(x)}">`).join('')}</datalist></div>
      <div class="form-row"><label for="f-e">Estado de conservação *</label><select id="f-e">${opt(CONSERV, v.conserv)}</select></div>
      <div class="form-row"><label for="f-s">Status *</label>${stLivre ? `<select id="f-s">${opt(['Disponível', 'Em uso'], v.status)}</select>` : `<input id="f-s" value="${esc(v.status)}" disabled><small>Este status é alterado pelas movimentações (empréstimo, manutenção, baixa).</small>`}</div>
      <div class="form-row"><label for="f-r">Responsável *</label><input id="f-r" list="dl-resp" maxlength="80" value="${esc(v.responsavel)}"><datalist id="dl-resp">${nomes.map(x => `<option value="${esc(x)}">`).join('')}</datalist></div>
      <div class="form-row"><label for="f-dt">Data de cadastro</label><input id="f-dt" value="${fmtData(ed ? ed.cadastro : hoje())}" disabled></div>
      <div class="form-row vaquinha"><label for="f-p">Projeto/Campanha (opcional)</label><select id="f-p"><option value="">Nenhum</option>${projetos().map(p => `<option${p === v.projeto ? ' selected' : ''}>${esc(p)}</option>`).join('')}<option value="__novo">＋ Outro projeto...</option></select></div>
      <div class="form-row" id="f-pw" hidden><label for="f-pn">Nome do novo projeto/campanha *</label><input id="f-pn" maxlength="80"></div>
      <div class="form-row"><label for="f-f">Foto${ed && v.foto ? ' (deixe vazio para manter a atual)' : ''}</label><input id="f-f" type="file" accept="image/png,image/jpeg,image/webp"></div>
      <div class="form-row"><label for="f-o">Observações</label><textarea id="f-o" rows="2" maxlength="400">${esc(v.obs)}</textarea></div>
      <fieldset id="f-pt" class="inv-pat" style="border:1px solid #c9d2d8;border-radius:8px;padding:10px 14px;margin:10px 0"><legend><label><input type="checkbox" id="f-pc"${ehPat(v) ? ' checked' : ''}> <strong>É patrimônio do Parque</strong></label></legend>
        <div id="f-pd"${ehPat(v) ? '' : ' hidden'}><p><small>Tudo abaixo é opcional: preencha o que já souber e complete depois.</small></p>
        <div class="form-row"><label for="f-pn2">Número do patrimônio</label>${v.patNumero ? `<div class="inv-cod-box">${codBadge(v.patNumero)} <small>permanente</small></div>` : '<input id="f-pn2" maxlength="30" placeholder="Em branco = gerado automaticamente (PAT-0001...). Se o bem já tem plaqueta, digite o número dela."><small>Fica gravado para sempre e não é reutilizado.</small>'}</div>
        <div class="form-row"><label for="f-pv">Valor (R$)</label><input id="f-pv" inputmode="decimal" maxlength="14" value="${v.patValor === '' || v.patValor == null ? '' : String(v.patValor).replace('.', ',')}" placeholder="Ex.: 350,00 (em branco se não souber)"></div>
        <div class="form-row"><label for="f-pda">Data de aquisição</label><input id="f-pda" type="date" max="${hoje()}" value="${esc(v.patAquisicao || '')}"></div>
        <div class="form-row"><label for="f-po">Origem</label><select id="f-po"><option value="">Em aberto</option>${ORIGENS_PAT.map(o => `<option${o === v.patOrigem ? ' selected' : ''}>${o}</option>`).join('')}</select></div>
        <div class="form-row"><label for="f-pnf">Nota fiscal (número, se houver)</label><input id="f-pnf" maxlength="40" value="${esc(v.patNF || '')}"></div>
        <div class="form-row"><label for="f-pob">Observações do patrimônio</label><input id="f-pob" maxlength="200" value="${esc(v.patObs || '')}"></div></div>
        <p id="f-pi" hidden><small>Esta categoria não entra no patrimônio (materiais de consumo e de estoque).</small></p></fieldset>
      <p class="form-erro" id="f-er" role="alert" hidden></p>
      <button class="btn-visit btn-large"><i class="fas ${ed ? 'fa-save' : 'fa-plus-circle'}"></i> ${ed ? 'Salvar alterações' : 'Cadastrar item'}</button>
      ${ed ? '<button type="button" class="btn-visit btn-large" id="f-x" style="background:#6c7a7b;margin-left:8px">Cancelar edição</button>' : ''}
    </form>`;
    const prev = () => {
      const c = catDe($('#f-c', el).value); $('#f-eq', el).hidden = !c.equip; $('#f-mw', el).hidden = !c.estoque;
      if (!ed) $('#i-cod', el).innerHTML = `<small>Gerado automaticamente ao salvar. Próximo desta série: </small>${codBadge(calcCodigo(c.pref).cod)}`;
    };
    const prevPat = () => { const ok = !!catDe($('#f-c', el).value).pat; $('#f-pc', el).disabled = !ok; $('#f-pi', el).hidden = ok; if (!ok) { $('#f-pc', el).checked = false; } $('#f-pd', el).hidden = !($('#f-pc', el).checked); };
    $('#f-c', el).addEventListener('change', prevPat); $('#f-pc', el).onchange = prevPat; prevPat();
    $('#f-c', el).onchange = prev; prev();
    $('#f-p', el).onchange = e => { $('#f-pw', el).hidden = e.target.value !== '__novo'; };
    const x = $('#f-x', el); if (x) x.onclick = () => { editId = null; sub = 'consulta'; draw(); };
    $('#fi', el).onsubmit = async e => {
      e.preventDefault(); if (!pode) return;
      const g = id => $('#' + id, el).value.trim(), er = $('#f-er', el), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
      const cat = g('f-c'), nome = g('f-n'), local = g('f-l'), resp = g('f-r'), q = ed ? ed.quantidade : parseFloat(g('f-q')), file = $('#f-f', el).files[0];
      if (!nome || !local || !resp) return falha('Preencha nome, localização e responsável.');
      if (!(q >= 0)) return falha('Informe a quantidade (zero ou mais).');
      let proj = g('f-p');
      if (proj === '__novo') {
        proj = g('f-pn').replace(/\s+/g, ' '); if (!proj) return falha('Digite o nome do novo projeto/campanha.');
        const pl = projetos(), ja = pl.find(p => norm(p) === norm(proj)); if (ja) proj = ja; else { pl.push(proj); db.set('inv_proj', pl); }
      }
      let foto = ed ? ed.foto || '' : '';
      if (file) { try { foto = await reduz(file, 640, 0.72); } catch (x2) { return falha('Não foi possível ler a foto.'); } }
      const dados = { cat, nome, descricao: g('f-d'), marca: g('f-ma'), modelo: g('f-mo'), serie: g('f-se'), unidade: g('f-u') || 'un', estoqueMin: g('f-mi'), local, conserv: g('f-e'), responsavel: resp, projeto: proj, foto, obs: g('f-o') };
      const l = itens();
      const querPat = $('#f-pc', el).checked && !$('#f-pc', el).disabled, pd = { plaqueta: ($('#f-pn2', el) || { value: '' }).value, valor: g('f-pv'), aquisicao: g('f-pda'), origem: g('f-po'), nf: g('f-pnf'), obs: g('f-pob') };
      if (ed) {
        const it = l.find(i => i.id === ed.id), eraPat = ehPat(it), copia = JSON.stringify(it);
        Object.assign(it, dados); if (stLivre) it.status = g('f-s');
        if (querPat) { const ep = aplicaPat(it, pd); if (ep) { Object.assign(it, JSON.parse(copia)); return falha(ep); } }
        else if (eraPat) { if (!confirm('Retirar este item do patrimônio? O número ' + it.patNumero + ' continua reservado para ele.')) return; const m = prompt('Motivo da retirada do patrimônio:'); if (!m || !m.trim()) return falha('Informe o motivo da retirada do patrimônio.'); it.patrimonio = false; it.patSaiu = hoje(); it.patSaiuMotivo = m.trim(); }
        if (!db.set('inv_itens', l)) return falha('Sem espaço no navegador. Use uma foto menor.');
        regMov(it, 'Edição', '', 'Dados do item atualizados');
        if (querPat && !eraPat) regMov(it, 'Patrimônio', '', 'Marcado como patrimônio: ' + it.patNumero); else if (querPat) regMov(it, 'Patrimônio', '', 'Dados do patrimônio atualizados (' + it.patNumero + ')'); else if (eraPat) regMov(it, 'Patrimônio', '', 'Retirado do patrimônio (' + it.patNumero + '): ' + it.patSaiuMotivo);
        msg = ''; editId = null; verId = it.id; sub = 'consulta'; draw(); return;
      }
      if (querPat) { const ev = validaPat({ cat, id: null }, pd); if (ev) return falha(ev); }
      const id = uid(), cod = emitirCodigo(catDe(cat).pref, id, nome);
      if (!cod) return falha('Não foi possível gerar o código (sem espaço no navegador).');
      if (l.some(i => i.codigo === cod)) { marcaCodigoFora(cod, 'Conflito evitado'); return falha('Conflito de código evitado. Tente salvar de novo.'); }
      const it = { id, codigo: cod, ...dados, quantidade: q, status: g('f-s'), cadastro: hoje(), por: me.nome };
      if (querPat) { const ep = aplicaPat(it, pd); if (ep) { marcaCodigoFora(cod, 'Cadastro não concluído'); return falha(ep); } }
      l.push(it);
      if (!db.set('inv_itens', l)) { marcaCodigoFora(cod, 'Cadastro não concluído'); return falha('Sem espaço no navegador. Use uma foto menor ou remova fotos antigas.'); }
      regMov(it, 'Cadastro', q, 'Item cadastrado');
      if (querPat) regMov(it, 'Patrimônio', '', 'Marcado como patrimônio: ' + it.patNumero);
      msg = `Item cadastrado com o código <strong>${esc(cod)}</strong>${querPat ? ` e número de patrimônio <strong>${esc(it.patNumero)}</strong>` : ''}. Anote ou cole esse código na etiqueta do item.`; draw(); window.scrollTo(0, 0);
    };
  };

  /* ---------- Movimentações ---------- */
  const campo = (id, rot, tipo, extra) => `<div class="form-row"><label for="m-${id}">${rot}</label><input id="m-${id}" type="${tipo || 'text'}" ${extra || ''}></div>`;
  const CAMPOS = {
    'Entrada': () => campo('q', 'Quantidade recebida *', 'number', 'min="0.01" step="any"') + campo('d', 'Origem / observação (compra, doação...)', 'text', 'maxlength="120"'),
    'Saída': () => campo('q', 'Quantidade *', 'number', 'min="0.01" step="any"') + campo('d', 'Destino ou motivo * (atividade, campanha, consumo...)', 'text', 'maxlength="120"'),
    'Empréstimo': () => campo('q', 'Quantidade *', 'number', 'min="0.01" step="any" value="1"') + campo('p', 'Quem está retirando *', 'text', 'maxlength="80"') + campo('v', 'Devolução prevista', 'date', `min="${hoje()}"`),
    'Transferência': () => campo('l', 'Nova localização *', 'text', 'maxlength="80" list="dl-loc2"') + `<datalist id="dl-loc2">${[...new Set(itens().map(i => i.local).filter(Boolean))].map(x => `<option value="${esc(x)}">`).join('')}</datalist>`,
    'Manutenção': () => campo('d', 'Motivo / oficina', 'text', 'maxlength="120"'),
    'Retorno de manutenção': () => campo('d', 'Observação', 'text', 'maxlength="120"'),
    'Ajuste de estoque': () => campo('q', 'Quantidade correta em estoque *', 'number', 'min="0" step="any"') + campo('d', 'Motivo do ajuste * (contagem, perda, correção...)', 'text', 'maxlength="120"'),
    'Baixa': () => campo('d', 'Motivo da baixa * (quebrado, doado, perdido, consumido...)', 'text', 'maxlength="120"'),
    'Reativação': () => campo('d', 'Observação', 'text', 'maxlength="120"')
  };
  const mov = el => {
    const todos = itens().sort(porCod), des = emps().filter(e => !e.devolvido).sort((a, b) => (a.prevista || '9').localeCompare(b.prevista || '9')), ult = movs().slice(-30).reverse();
    el.innerHTML = `<h3><i class="fas fa-exchange-alt"></i> Movimentações e estoque</h3>
    <p>Entradas, saídas, empréstimos, transferências, manutenção, ajustes e baixas. Tudo fica registrado no histórico do item.</p>
    ${msg ? `<p class="tip-box" role="status"><i class="fas fa-check-circle"></i> ${esc(msg)}</p>` : ''}
    ${todos.length ? `<form id="fm" class="form-reserva" novalidate>
      <div class="form-row"><label for="m-i">Item *</label><select id="m-i"><option value="">Selecione...</option>${todos.map(i => `<option value="${i.id}"${i.id === movItem ? ' selected' : ''}>${esc(i.codigo)} - ${esc(i.nome)} (${esc(i.status)}, ${esc(qtdRaw(i))})</option>`).join('')}</select></div>
      <div class="form-row"><label for="m-t">Tipo de movimentação *</label><select id="m-t">${TIPOS.map(t => `<option>${t}</option>`).join('')}</select></div>
      <div id="m-c"></div><p class="form-erro" id="m-e" role="alert" hidden></p>
      <button class="btn-visit btn-large"><i class="fas fa-save"></i> Registrar movimentação</button></form>` : '<p class="vazio">Cadastre itens antes de registrar movimentações.</p>'}
    <h4>Empréstimos em aberto</h4>${des.length ? `<table class="doc-table"><thead><tr><th>Código</th><th>Item</th><th>Qtd.</th><th>Retirado por</th><th>Retirada</th><th>Prevista</th><th></th></tr></thead><tbody>${des.map(e => `<tr><td>${codBadge(e.codigo)}</td><td>${esc(e.nome)}</td><td>${fmtQ(e.qtd)}</td><td>${esc(e.pessoa)}</td><td>${fmtData(e.saida)}</td><td>${e.prevista ? fmtData(e.prevista) : '-'}${e.prevista && e.prevista < hoje() ? ' <span class="badge-emprestado">Atrasado</span>' : ''}</td><td><button class="btn-visit" data-dev="${e.id}">Registrar devolução</button></td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhum empréstimo em aberto.</p>'}
    <h4>Últimas movimentações</h4>${ult.length ? `<table class="doc-table"><thead><tr><th>Data</th><th>Código</th><th>Item</th><th>Tipo</th><th>Qtd.</th><th>Detalhe</th><th>Por</th></tr></thead><tbody>${ult.map(m => `<tr><td>${fmtData(m.data)}</td><td>${codBadge(m.codigo)}</td><td>${esc(m.nome)}</td><td>${esc(m.tipo)}</td><td>${m.qtd === '' ? '-' : fmtQ(m.qtd)}</td><td>${esc(m.det) || '-'}</td><td>${esc(m.por)}</td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhuma movimentação ainda.</p>'}`;
    el.querySelectorAll('[data-dev]').forEach(b => b.onclick = () => { devolver(b.dataset.dev); msg = 'Devolução registrada.'; draw(); });
    const f = $('#fm', el); if (!f) return;
    const campos = () => { $('#m-c', el).innerHTML = CAMPOS[$('#m-t', el).value](); };
    $('#m-t', el).onchange = campos; $('#m-i', el).onchange = e => { movItem = e.target.value; }; campos();
    f.onsubmit = e => {
      e.preventDefault(); const er = $('#m-e', el), v = id => { const x = $('#m-' + id, el); return x ? x.value.trim() : ''; };
      const id = $('#m-i', el).value; if (!id) { er.textContent = 'Selecione o item.'; er.hidden = false; return; }
      const tipo = $('#m-t', el).value, erro = aplicar(tipo, id, { qtd: v('q'), det: v('d'), pessoa: v('p'), prevista: v('v'), local: v('l') });
      if (erro) { er.textContent = erro; er.hidden = false; return; }
      msg = `${tipo} registrada com sucesso.`; draw();
    };
  };

  /* ---------- Relatórios consolidados (administrador / responsável) ---------- */
  const COLS = ['Código', 'Item', 'Categoria', 'Quantidade', 'Localização', 'Conservação', 'Status', 'Responsável', 'Projeto/Campanha'];
  const linha = i => [i.codigo, i.nome + (i.marca || i.modelo ? ` (${[i.marca, i.modelo].filter(Boolean).join(' ')})` : ''), catDe(i.cat).nome, qtdRaw(i), i.local || '-', i.conserv, i.status, i.responsavel || '-', i.projeto || '-'];
  const tab = (head, rows) => rows.length ? `<table class="doc-table"><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, k) => k === 0 && /^[A-Z]{3}-\d{4,}$/.test(c) ? `<td>${codBadge(c)}</td>` : `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhum registro.</p>';
  const agrupa = (its, chave, vazioRot) => {
    const g = {}; its.forEach(i => { const k = chave(i) || vazioRot; (g[k] = g[k] || []).push(i); });
    const ks = Object.keys(g).sort((a, b) => a.localeCompare(b, 'pt-BR')), rows = [['Grupo'].concat(COLS)];
    const html = ks.map(k => { const l = g[k].sort(porCod); l.forEach(i => rows.push([k].concat(linha(i)))); return `<h4>${esc(k)} <small>(${l.length} item(ns))</small></h4>${tab(COLS, l.map(linha))}`; }).join('') || '<p class="vazio">Nenhum registro.</p>';
    return { html, rows };
  };
  const totaisHtml = l => `<div class="totais">${l.map(([r, v]) => `<div><span>${r}</span><strong>${v}</strong></div>`).join('')}</div>`;
  const REL = {
    geral: ['Inventário geral', () => {
      const its = itens().sort(porCod), reg = db.get('inv_cod', []), fora = reg.filter(r => !its.some(i => i.codigo === r.codigo));
      const foraRows = fora.map(r => [r.codigo, r.nome || '-', fmtData(r.emitido), r.excluidoEm ? fmtData(r.excluidoEm) : '-', r.motivo || 'Excluído']), FH = ['Código', 'Último nome', 'Emitido em', 'Retirado em', 'Situação'];
      return { html: totaisHtml([['Itens cadastrados', its.length], ['Em uso no Parque', its.filter(i => i.status !== 'Baixado').length], ['Baixados', its.filter(i => i.status === 'Baixado').length], ['Códigos emitidos', reg.length]]) + tab(COLS, its.map(linha)) + `<h4>Códigos retirados de uso <small>(nunca serão reutilizados)</small></h4>` + (foraRows.length ? tab(FH, foraRows) : '<p class="vazio">Nenhum código foi excluído até agora.</p>'),
        rows: [COLS].concat(its.map(linha)).concat([[], ['Códigos retirados de uso (nunca reutilizados)'], FH]).concat(foraRows) };
    }],
    cat: ['Por categoria', () => agrupa(itens(), i => catDe(i.cat).nome, '')],
    loc: ['Por localização', () => agrupa(itens().filter(i => i.status !== 'Baixado'), i => i.local, 'Sem localização')],
    camp: ['Materiais de campanhas', () => agrupa(itens().filter(i => i.cat === 'com' || i.projeto), i => i.projeto, 'Sem projeto/campanha vinculado')],
    est: ['Materiais em estoque', () => {
      const its = itens().filter(i => catDe(i.cat).estoque && i.status !== 'Baixado').sort(porCod), em = mapaEmp();
      const sit = i => { const mi = parseFloat(i.estoqueMin); return i.quantidade <= 0 ? 'Zerado' : (mi > 0 && i.quantidade <= mi ? 'No mínimo ou abaixo' : 'OK'); };
      const H = ['Código', 'Item', 'Categoria', 'Em estoque', 'Emprestado', 'Disponível', 'Mínimo', 'Localização', 'Projeto/Campanha', 'Situação'];
      const rows = its.map(i => [i.codigo, i.nome, catDe(i.cat).nome, qtdRaw(i), fmtQ(em[i.id] || 0), fmtQ(i.quantidade - (em[i.id] || 0)), i.estoqueMin ? fmtQ(i.estoqueMin) : '-', i.local || '-', i.projeto || '-', sit(i)]);
      return { html: `<p>Categorias com controle de estoque: ${CATS.filter(c => c.estoque).map(c => esc(c.nome)).join('; ')}.</p>` + totaisHtml([['Itens em estoque', its.length], ['Zerados', rows.filter(r => r[9] === 'Zerado').length], ['No mínimo ou abaixo', rows.filter(r => r[9] === 'No mínimo ou abaixo').length]]) + tab(H, rows), rows: [H].concat(rows) };
    }],
    mov: ['Emprestados e em movimentação', () => {
      const des = emps().filter(e => !e.devolvido).sort((a, b) => (a.prevista || '9').localeCompare(b.prevista || '9')), lim = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
      const H1 = ['Código', 'Item', 'Quantidade', 'Retirado por', 'Retirada', 'Prevista', 'Situação'], H2 = ['Data', 'Código', 'Item', 'Tipo', 'Quantidade', 'Detalhe', 'Registrado por'];
      const r1 = des.map(e => [e.codigo, e.nome, fmtQ(e.qtd), e.pessoa, fmtData(e.saida), e.prevista ? fmtData(e.prevista) : '-', e.prevista && e.prevista < hoje() ? 'Atrasado' : 'Em aberto']);
      const r2 = movs().filter(m => m.data >= lim && !['Cadastro', 'Edição'].includes(m.tipo)).reverse().map(m => [fmtData(m.data), m.codigo, m.nome, m.tipo, m.qtd === '' ? '-' : fmtQ(m.qtd), m.det || '-', m.por]);
      const t2 = r2.map(r => [r[1], r[0], ...r.slice(2)]); // código primeiro na tela (recebe o selo)
      return { html: `<h4>Itens emprestados (em aberto)</h4>${tab(H1, r1)}<h4>Movimentações dos últimos 30 dias</h4>${tab(['Código', 'Data', 'Item', 'Tipo', 'Quantidade', 'Detalhe', 'Registrado por'], t2)}`, rows: [H1].concat(r1).concat([[], ['Movimentações dos últimos 30 dias'], H2]).concat(r2) };
    }],
    man: ['Manutenção e baixa', () => {
      const its = itens().filter(i => ['Em manutenção', 'Baixado'].includes(i.status)).sort(porCod);
      const H = ['Código', 'Item', 'Categoria', 'Localização', 'Status', 'Desde', 'Motivo / observação', 'Responsável'];
      const rows = its.map(i => [i.codigo, i.nome, catDe(i.cat).nome, i.local || '-', i.status, fmtData(i.status === 'Baixado' ? i.baixaData : i.manutDesde) || '-', (i.status === 'Baixado' ? i.baixaMotivo : i.manutObs) || '-', i.responsavel || '-']);
      return { html: totaisHtml([['Em manutenção', its.filter(i => i.status === 'Em manutenção').length], ['Baixados', its.filter(i => i.status === 'Baixado').length]]) + tab(H, rows), rows: [H].concat(rows) };
    }]
  };
  const rel = el => {
    if (!pode) { el.innerHTML = '<p class="vazio">Os relatórios são exclusivos do administrador e do responsável pelo Inventário.</p>'; return; }
    const r = REL[rsub][1](), tit = REL[rsub][0];
    el.innerHTML = `<h3><i class="fas fa-chart-bar"></i> Relatórios do Inventário</h3>
    <div class="tabs sub inv-noprint">${Object.entries(REL).map(([k, v]) => `<button class="tab-btn${k === rsub ? ' active' : ''}" data-r="${k}">${v[0]}</button>`).join('')}</div>
    <p class="inv-noprint"><button class="btn-visit" id="r-p"><i class="fas fa-print"></i> Imprimir relatório</button> <button class="btn-visit" id="r-c"><i class="fas fa-file-csv"></i> Baixar (CSV)</button></p>
    <div id="inv-rel"><h3 class="inv-print-head">Parque de Estudo e Reflexão Retiro - Inventário: ${esc(tit)} (${fmtData(hoje())})</h3><h4 class="inv-tit">${esc(tit)} <small>posição em ${fmtData(hoje())}</small></h4>${r.html}</div>`;
    el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { rsub = b.dataset.r; draw(); });
    $('#r-p', el).onclick = () => window.print();
    $('#r-c', el).onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv(r.rows)], { type: 'text/csv;charset=utf-8' })); a.download = `inventario-${rsub}-${hoje()}.csv`; a.click(); };
  };


  /* ---------- Importação por planilha (CSV) ---------- */
  // Nunca substitui itens existentes: linhas duplicadas são ignoradas e listadas no relatório.
  // Excel: salve a planilha como "CSV (separado por vírgulas ou ponto e vírgula)" antes de importar.
  const IMP_COLS = ['Nome', 'Categoria', 'Quantidade', 'Unidade', 'Localização', 'Conservação', 'Status', 'Responsável', 'Projeto/Campanha', 'Marca', 'Modelo', 'Número de série', 'Descrição', 'Observações'];
  const parseCsv = txt => {
    txt = txt.replace(/^﻿/, '');
    const first = txt.split(/\r?\n/, 1)[0] || '', cnt = c => first.split(c).length - 1;
    const sep = cnt(';') >= cnt(',') && cnt(';') >= cnt('\t') ? ';' : cnt('\t') > cnt(',') ? '\t' : ',';
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      if (q) { if (ch === '"') { if (txt[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === sep) { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && txt[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.some(c => c.trim() !== '')) rows.push(row); row = []; }
      else cur += ch;
    }
    row.push(cur); if (row.some(c => c.trim() !== '')) rows.push(row);
    return rows;
  };
  const analisaImport = txt => {
    const rows = parseCsv(txt); if (rows.length < 2) return { erro: 'A planilha precisa ter o cabeçalho e ao menos uma linha.' };
    const cab = rows[0].map(c => norm(c.trim())), idx = n => cab.indexOf(norm(n));
    if (idx('Nome') < 0 || idx('Localização') < 0) return { erro: 'Cabeçalho inválido: as colunas "Nome" e "Localização" são obrigatórias. Baixe o modelo.' };
    const g = (r, n) => { const i = idx(n); return i < 0 ? '' : String(r[i] == null ? '' : r[i]).trim().replace(/^'(?=[=+\-@])/, ''); };
    const exist = itens(), chave = (n, l, se) => se ? 'S|' + norm(se) : 'N|' + norm(n) + '|' + norm(l);
    const vistos = new Map(); exist.forEach(i => { vistos.set(chave(i.nome, i.local, i.serie), i.codigo); if (i.serie) vistos.set(chave('', '', i.serie), i.codigo); });
    const catPor = v => CATS.find(c => norm(c.id) === norm(v) || norm(c.nome) === norm(v));
    const out = rows.slice(1).map((r, k) => {
      const l = { linha: k + 2, nome: g(r, 'Nome'), local: g(r, 'Localização'), erros: [], status: 'novo' };
      const cat = g(r, 'Categoria') ? catPor(g(r, 'Categoria')) : CATS[0];
      if (!cat) l.erros.push('Categoria desconhecida: ' + g(r, 'Categoria'));
      const qt = g(r, 'Quantidade') === '' ? 1 : parseFloat(g(r, 'Quantidade').replace(',', '.'));
      if (!(qt >= 0)) l.erros.push('Quantidade inválida');
      const conserv = g(r, 'Conservação') ? CONSERV.find(c => norm(c) === norm(g(r, 'Conservação'))) : 'Bom';
      if (!conserv) l.erros.push('Conservação inválida (use: ' + CONSERV.join(', ') + ')');
      const st = g(r, 'Status') ? STATUS.find(c => norm(c) === norm(g(r, 'Status'))) : 'Disponível';
      if (!st || st === 'Emprestado') l.erros.push('Status inválido (use: ' + STATUS.filter(x => x !== 'Emprestado').join(', ') + ')');
      if (!l.nome) l.erros.push('Nome vazio'); if (!l.local) l.erros.push('Localização vazia');
      if (l.nome.length > 120) l.erros.push('Nome muito longo');
      l.dados = { cat: cat && cat.id, nome: l.nome, descricao: g(r, 'Descrição'), marca: g(r, 'Marca'), modelo: g(r, 'Modelo'), serie: g(r, 'Número de série'), unidade: g(r, 'Unidade') || 'un', estoqueMin: '', local: l.local, conserv, responsavel: g(r, 'Responsável') || me.nome, projeto: g(r, 'Projeto/Campanha'), foto: '', obs: g(r, 'Observações'), quantidade: qt, status: st };
      if (l.erros.length) l.status = 'erro';
      else {
        const k1 = chave(l.nome, l.local, l.dados.serie), k2 = l.dados.serie ? chave('', '', l.dados.serie) : null;
        const dup = vistos.get(k1) || (k2 && vistos.get(k2));
        if (dup) { l.status = 'duplicado'; l.ref = dup === true ? 'outra linha desta planilha' : dup; } else { vistos.set(k1, true); if (k2) vistos.set(k2, true); }
      }
      return l;
    });
    return { linhas: out };
  };
  const importar = el => {
    let res = null, msgI = '';
    const draw2 = () => {
      const c = k => res ? res.linhas.filter(l => l.status === k).length : 0;
      el.innerHTML = `<h3>Importar itens por planilha</h3>
      <p>1) Baixe o modelo, 2) preencha no Excel e salve como <strong>CSV</strong>, 3) envie aqui. Você verá uma pré-visualização antes de gravar. Itens já existentes <strong>não são substituídos</strong>; cada item novo recebe um código permanente.</p>
      <p><button class="btn-visit" id="im-mod"><i class="fas fa-file-download"></i> Baixar modelo (CSV)</button></p>
      <div class="form-row"><label for="im-f">Arquivo CSV</label><input id="im-f" type="file" accept=".csv,text/csv,text/plain"></div>
      ${msgI ? `<p class="tip-box" role="status">${msgI}</p>` : ''}
      ${res && res.erro ? `<p class="form-erro" role="alert">${esc(res.erro)}</p>` : ''}
      ${res && res.linhas ? `<p><strong>${c('novo')}</strong> novo(s) · <strong>${c('duplicado')}</strong> duplicado(s) (serão ignorados) · <strong>${c('erro')}</strong> com erro (serão ignorados)</p>
      <div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Linha</th><th>Nome</th><th>Local</th><th>Situação</th></tr></thead><tbody>${res.linhas.slice(0, 200).map(l => `<tr><td>${l.linha}</td><td>${esc(l.nome)}</td><td>${esc(l.local)}</td><td>${l.status === 'novo' ? 'Novo' : l.status === 'duplicado' ? 'Duplicado de ' + esc(l.ref) : 'Erro: ' + esc(l.erros.join('; '))}</td></tr>`).join('')}</tbody></table></div>${res.linhas.length > 200 ? '<p class="vazio">Mostrando as 200 primeiras linhas; todas serão processadas.</p>' : ''}
      <p><button class="btn-visit" id="im-ok" ${c('novo') ? '' : 'disabled'}>Confirmar importação de ${c('novo')} item(ns)</button> <button class="btn-visit" id="im-rel" ${c('erro') + c('duplicado') ? '' : 'disabled'}>Baixar relatório de erros e duplicados</button></p>` : ''}`;
      $('#im-mod', el).onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv([IMP_COLS, ['Mesa de reunião', 'Móveis, Utensílios e Equipamentos', '1', 'un', 'Sala 1', 'Bom', 'Disponível', 'Nome do responsável', '', '', '', '', 'Exemplo — apague esta linha', '']])], { type: 'text/csv;charset=utf-8' })); a.download = 'modelo-importacao-inventario.csv'; a.click(); };
      $('#im-f', el).onchange = async ev => { const f = ev.target.files[0]; if (!f) return; if (f.size > 2 * 1048576) { res = { erro: 'Arquivo grande demais (máx. 2 MB). Divida a planilha.' }; draw2(); return; } msgI = ''; res = analisaImport(await f.text()); draw2(); };
      const ok = $('#im-ok', el); if (ok) ok.onclick = () => {
        if (!pode) return;
        const novos = res.linhas.filter(l => l.status === 'novo'); if (!novos.length) return;
        if (!confirm(`Gravar ${novos.length} item(ns) novo(s) no inventário?`)) return;
        const l = itens(), pl = projetos(); let feitos = 0, falhou = '';
        for (const n of novos) {
          const d = { ...n.dados }, q = d.quantidade, status = d.status; delete d.quantidade; delete d.status;
          if (d.projeto && !pl.some(p => norm(p) === norm(d.projeto))) pl.push(d.projeto);
          const id = uid(), cod = emitirCodigo(catDe(d.cat).pref, id, d.nome);
          if (!cod) { falhou = 'Sem espaço no navegador; importação interrompida.'; break; }
          const it = { id, codigo: cod, ...d, quantidade: q, status, cadastro: hoje(), por: me.nome, origem: 'importacao' };
          l.push(it); n.codigo = cod; n.status = 'importado'; feitos++;
          if (!db.set('inv_itens', l)) { l.pop(); marcaCodigoFora(cod, 'Importação não concluída'); falhou = 'Sem espaço no navegador; importação interrompida.'; n.status = 'erro'; feitos--; break; }
          regMov(it, 'Cadastro', q, 'Importado por planilha');
        }
        db.set('inv_proj', pl);
        msgI = `${feitos} item(ns) importado(s).${falhou ? ' ' + esc(falhou) : ''}`; res = null; draw2();
      };
      const rel = $('#im-rel', el); if (rel) rel.onclick = () => { const rows = [['Linha', 'Nome', 'Localização', 'Situação', 'Detalhe']].concat(res.linhas.filter(l => l.status !== 'novo').map(l => [l.linha, l.nome, l.local, l.status, l.status === 'duplicado' ? 'Duplicado de ' + l.ref : l.erros.join('; ')])); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = 'relatorio-importacao.csv'; a.click(); };
    };
    draw2();
  };


  /* ---------- Ligação com a Prestação de Contas (modo 'api') ---------- */
  // Cada bem criado ou vinculado guarda patLancamento (id do lançamento) e patLancInfo (cópia de data, descrição e valor),
  // para o vínculo continuar legível mesmo que o lançamento seja excluído (patLancRemovido). Nunca apaga bem nenhum.
  const resumoLanc = l => ({ data: l.data, desc: l.desc || '', valor: l.valor, moeda: l.moeda });
  const valoresPorBem = (lanc, n, unitTxt) => {
    // Devolve uma lista de n valores. Valor unitário informado vale para todos; senão divide o total do lançamento (a última parcela fecha o centavo). M$ não vira R$.
    const u = lerValor(unitTxt); if (Number.isNaN(u)) return null;
    if (u !== '') return Array(n).fill(u);
    if (lanc.moeda === 'MUMBUCA') return Array(n).fill('');
    const tot = Math.round(lanc.valor * 100), base = Math.floor(tot / n), v = Array(n).fill(base / 100); v[n - 1] = (tot - base * (n - 1)) / 100; return v;
  };
  const criarBens = (lanc, d) => {
    const nome = (d.nome || '').trim(), local = (d.local || '').trim(), q = Number(d.qtd), cat = d.cat;
    if (!nome || !local) return { erro: 'Informe o nome do bem e a localização.' };
    if (!Number.isInteger(q) || q < 1 || q > 100) return { erro: 'A quantidade deve ser um número inteiro de 1 a 100 (cada unidade vira um bem com número próprio).' };
    const vals = valoresPorBem(lanc, q, d.valorUnit); if (!vals) return { erro: 'O valor unitário deve ser um número maior ou igual a zero (ou ficar em branco).' };
    const modelo = { cat, id: null }, ev = validaPat(modelo, { valor: '', aquisicao: lanc.data, plaqueta: '' }); if (ev) return { erro: ev };
    const novos = [], l = itens();
    for (let k = 0; k < q; k++) {
      const id = uid(), cod = emitirCodigo(catDe(cat).pref, id, nome);
      if (!cod) { novos.forEach(x => marcaCodigoFora(x.codigo, 'Cadastro não concluído')); return { erro: 'Não foi possível gerar o código (sem espaço no navegador).' }; }
      const it = { id, codigo: cod, cat, nome, descricao: '', marca: '', modelo: '', serie: '', unidade: 'un', estoqueMin: '', local, conserv: 'Novo', status: 'Disponível', responsavel: me.nome, projeto: '', foto: '', obs: 'Criado a partir de um lançamento da Prestação de Contas.', quantidade: 1, cadastro: hoje(), por: me.nome, patLancamento: lanc.id, patLancInfo: resumoLanc(lanc) };
      const ep = aplicaPat(it, { valor: vals[k] === '' ? '' : String(vals[k]).replace('.', ','), aquisicao: lanc.data, origem: 'Compra', nf: d.nf || '' });
      if (ep) { novos.forEach(x => marcaCodigoFora(x.codigo, 'Cadastro não concluído')); marcaCodigoFora(cod, 'Cadastro não concluído'); return { erro: ep }; }
      novos.push(it);
    }
    if (!db.set('inv_itens', l.concat(novos))) { novos.forEach(x => marcaCodigoFora(x.codigo, 'Cadastro não concluído')); return { erro: 'Sem espaço no navegador para salvar os bens.' }; }
    novos.forEach(it => { regMov(it, 'Cadastro', 1, 'Criado a partir de lançamento da Prestação de Contas'); regMov(it, 'Patrimônio', '', 'Marcado como patrimônio: ' + it.patNumero + (d.nf ? '. NF ' + d.nf : '')); });
    return { ok: novos.map(i => i.patNumero) };
  };
  const vincular = (lanc, ids, d) => {
    if (!ids.length) return { erro: 'Selecione ao menos um bem.' };
    const vals = valoresPorBem(lanc, ids.length, d.valorUnit); if (!vals) return { erro: 'O valor unitário deve ser um número maior ou igual a zero (ou ficar em branco).' };
    const l = itens(), avisos = [], feitos = [], copias = {};
    for (let k = 0; k < ids.length; k++) {
      const it = l.find(x => x.id === ids[k]); if (!it) continue;
      if (it.patLancamento && it.patLancamento !== lanc.id) { avisos.push(`${it.codigo}: já está ligado a outro lançamento; não alterado.`); continue; }
      if (!elegivelPat(it)) { avisos.push(`${it.codigo}: a categoria não entra no patrimônio.`); continue; }
      copias[it.id] = JSON.stringify(it);
      const ep = aplicaPat(it, {}); if (ep) { avisos.push(`${it.codigo}: ${ep}`); continue; }
      const nota = [];
      if (it.patValor === '' || it.patValor == null) { if (vals[k] !== '') it.patValor = vals[k]; } else if (vals[k] !== '' && Number(it.patValor) !== vals[k]) nota.push('valor já informado mantido');
      if (!it.patAquisicao) it.patAquisicao = lanc.data; else if (it.patAquisicao !== lanc.data) nota.push('data de aquisição já informada mantida');
      if (!it.patOrigem) it.patOrigem = 'Compra';
      const nf = (d.nf || '').trim(); if (nf) { if (!it.patNF) it.patNF = nf; else if (it.patNF !== nf) nota.push('nota fiscal já informada mantida (' + it.patNF + ')'); }
      it.patLancamento = lanc.id; it.patLancInfo = resumoLanc(lanc); it.patLancRemovido = false;
      if (nota.length) avisos.push(`${it.patNumero}: ${nota.join('; ')}.`);
      feitos.push(it);
    }
    if (!feitos.length) return { erro: avisos.join(' ') || 'Nada a vincular.' };
    if (!db.set('inv_itens', l)) return { erro: 'Sem espaço no navegador para salvar.' };
    feitos.forEach(it => regMov(it, 'Patrimônio', '', 'Vinculado ao lançamento de ' + fmtData(lanc.data) + (it.patNF ? '. NF ' + it.patNF : '')));
    return { ok: feitos.map(i => i.patNumero), avisos };
  };
  const desvincular = (itemId) => {
    const l = itens(), it = l.find(x => x.id === itemId); if (!it || !it.patLancamento) return 'O bem não está ligado a um lançamento.';
    const antes = it.patLancInfo; it.patLancamento = ''; it.patLancInfo = null; it.patLancRemovido = false;
    if (!db.set('inv_itens', l)) return 'Sem espaço no navegador para salvar.';
    regMov(it, 'Patrimônio', '', 'Desvinculado do lançamento' + (antes ? ' de ' + fmtData(antes.data) : '') + ' (valor, data e nota fiscal continuam no bem)'); return null;
  };
  const lancamentoRemovido = idLanc => {
    const l = itens(), afet = l.filter(i => i.patLancamento === idLanc); if (!afet.length) return 0;
    afet.forEach(i => { i.patLancRemovido = true; });
    db.set('inv_itens', l); afet.forEach(i => regMov(i, 'Patrimônio', '', 'O lançamento da Prestação de Contas foi excluído; o bem continua no patrimônio')); return afet.length;
  };
  const doLanc = id => itens().filter(i => i.patLancamento === id);
  // Painel da Prestação de Contas: criar bens novos a partir da compra ou vincular a bens já cadastrados.
  const painel = (el, lanc, onFim, modoIni) => {
    let modo = modoIni || (doLanc(lanc.id).length ? 'vinc' : 'novo'), aviso = '', erro = '', busca = '';
    const brl = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const draw2 = () => {
      const lig = doLanc(lanc.id), cands = itens().filter(i => elegivelPat(i) && i.status !== 'Baixado' && !(i.patLancamento && i.patLancamento !== lanc.id)), q = norm(busca);
      const vis = cands.filter(i => !q || norm([i.codigo, i.patNumero, i.nome, i.marca, i.modelo, i.local].join(' ')).includes(q)).sort((a, b) => (ehPat(a) && !a.patNF ? 0 : 1) - (ehPat(b) && !b.patNF ? 0 : 1) || porCod(a, b)).slice(0, 60);
      const cats = CATS.filter(c => c.pat);
      el.innerHTML = `<div class="inv-pat" style="border:2px solid #c9d2d8;border-radius:10px;padding:14px;margin:14px 0">
        <h4><i class="fas fa-landmark"></i> Patrimônio desta compra</h4>
        <p><small>Lançamento de ${fmtData(lanc.data)} · ${esc(lanc.desc || lanc.origem || '')} · ${brl(lanc.valor)}${lanc.moeda === 'MUMBUCA' ? ' (em M$: o valor não é copiado para o bem, informe o valor em R$ se quiser)' : ''}</small></p>
        ${aviso ? `<p class="tip-box" role="status"><i class="fas fa-check-circle"></i> ${aviso}</p>` : ''}${erro ? `<p class="form-erro" role="alert">${esc(erro)}</p>` : ''}
        ${lig.length ? `<p><strong>Bens ligados a este lançamento (${lig.length}):</strong></p><table class="doc-table"><thead><tr><th>Patrimônio</th><th>Código</th><th>Bem</th><th>Valor</th><th>Nota fiscal</th><th></th></tr></thead><tbody>${lig.map(i => `<tr><td>${codBadge(i.patNumero)}</td><td>${codBadge(i.codigo)}</td><td>${esc(i.nome)}</td><td>${moneyPat(i.patValor)}</td><td>${esc(i.patNF || 'em aberto')}</td><td><button class="icon-btn" data-dv="${i.id}" title="Desvincular (o bem continua no patrimônio)" aria-label="Desvincular ${esc(i.codigo)}"><i class="fas fa-unlink"></i></button></td></tr>`).join('')}</tbody></table>` : '<p><small>Nenhum bem ligado a este lançamento ainda.</small></p>'}
        <div class="tabs sub inv-noprint"><button type="button" class="tab-btn${modo === 'novo' ? ' active' : ''}" data-pm="novo">Criar bem(ns) novo(s)</button><button type="button" class="tab-btn${modo === 'vinc' ? ' active' : ''}" data-pm="vinc">Vincular a bem já cadastrado</button></div>
        ${modo === 'novo' ? `<form id="pp-f" class="form-reserva" novalidate>
          <p><small>Cada unidade vira um bem separado, com código do inventário e número de patrimônio próprios.</small></p>
          <div class="form-row"><label for="pp-n">Nome do bem *</label><input id="pp-n" maxlength="100" value="${esc((lanc.desc || '').slice(0, 100))}" placeholder="Ex.: Cadeira"></div>
          <div class="form-row"><label for="pp-c">Categoria *</label><select id="pp-c">${cats.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('')}</select></div>
          <div class="form-row"><label for="pp-q">Quantidade *</label><input id="pp-q" type="number" min="1" max="100" step="1" value="1"></div>
          <div class="form-row"><label for="pp-l">Localização *</label><input id="pp-l" maxlength="80" list="pp-dl" placeholder="Ex.: Sala, Depósito"><datalist id="pp-dl">${[...new Set(itens().map(i => i.local).filter(Boolean))].map(x => `<option value="${esc(x)}">`).join('')}</datalist></div>
          <div class="form-row"><label for="pp-v">Valor de cada unidade (R$)</label><input id="pp-v" inputmode="decimal" maxlength="14" placeholder="Em branco = valor do lançamento dividido pela quantidade"></div>
          <div class="form-row"><label for="pp-nf">Nota fiscal (número, se houver)</label><input id="pp-nf" maxlength="40"></div>
          <button class="btn-visit"><i class="fas fa-plus-circle"></i> Criar no patrimônio</button></form>`
        : `<div class="form-row"><label for="pp-b">Buscar bem já cadastrado (nome, código ou PAT)</label><input id="pp-b" type="search" value="${esc(busca)}"></div>
          <p><small>Bens do Inventário elegíveis ao patrimônio. Os que já estão no patrimônio sem nota fiscal aparecem primeiro. Nada é duplicado: o lançamento só completa nota fiscal, valor e data que estiverem em branco.</small></p>
          ${vis.length ? `<table class="doc-table"><thead><tr><th></th><th>Código</th><th>Patrimônio</th><th>Bem</th><th>Local</th><th>Nota fiscal</th></tr></thead><tbody>${vis.map(i => `<tr><td><input type="checkbox" data-pc="${i.id}" aria-label="Selecionar ${esc(i.codigo)}"${i.patLancamento === lanc.id ? ' checked disabled' : ''}></td><td>${codBadge(i.codigo)}</td><td>${ehPat(i) ? codBadge(i.patNumero) : '<small>ainda não</small>'}</td><td>${esc(i.nome)}</td><td>${esc(i.local || '-')}</td><td>${esc(i.patNF || (ehPat(i) ? 'em aberto' : '-'))}</td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhum bem encontrado.</p>'}
          <div class="form-row"><label for="pp-nf2">Nota fiscal (número, se houver)</label><input id="pp-nf2" maxlength="40"></div>
          <div class="form-row"><label for="pp-v2">Valor de cada bem (R$)</label><input id="pp-v2" inputmode="decimal" maxlength="14" placeholder="Em branco = valor do lançamento dividido pelos bens selecionados"></div>
          <button class="btn-visit" id="pp-vb"><i class="fas fa-link"></i> Vincular selecionados</button>`}
        <p><button type="button" class="btn-visit" id="pp-x" style="background:#6c7a7b">Fechar</button></p></div>`;
      el.querySelectorAll('[data-pm]').forEach(b => b.onclick = () => { modo = b.dataset.pm; aviso = ''; erro = ''; draw2(); });
      el.querySelectorAll('[data-dv]').forEach(b => b.onclick = () => { if (!confirm('Desvincular este bem do lançamento? Ele continua no patrimônio, com o valor, a data e a nota fiscal já gravados.')) return; const e = desmarcarLig(b.dataset.dv); erro = e || ''; aviso = e ? '' : 'Bem desvinculado.'; draw2(); });
      $('#pp-x', el).onclick = () => { el.innerHTML = ''; if (onFim) onFim(); };
      const f = $('#pp-f', el); if (f) f.onsubmit = e => {
        e.preventDefault(); const g = id => $('#' + id, el).value.trim();
        const r = criarBens(lanc, { nome: g('pp-n'), cat: g('pp-c'), qtd: g('pp-q'), local: g('pp-l'), valorUnit: g('pp-v'), nf: g('pp-nf') });
        if (r.erro) { erro = r.erro; aviso = ''; } else { erro = ''; aviso = `Criado(s) no patrimônio: <strong>${esc(r.ok.join(', '))}</strong>.`; modo = 'vinc'; }
        draw2();
      };
      const b = $('#pp-b', el); if (b) { b.oninput = () => { busca = b.value; const pos = b.selectionStart; draw2(); const nb = $('#pp-b', el); nb.focus(); nb.setSelectionRange(pos, pos); }; }
      const vb = $('#pp-vb', el); if (vb) vb.onclick = () => {
        const ids = [...el.querySelectorAll('[data-pc]:checked:not(:disabled)')].map(x => x.dataset.pc);
        const r = vincular(lanc, ids, { nf: $('#pp-nf2', el).value, valorUnit: $('#pp-v2', el).value });
        if (r.erro) { erro = r.erro; aviso = ''; } else { erro = ''; aviso = `Vinculado(s): <strong>${esc(r.ok.join(', '))}</strong>.` + (r.avisos.length ? '<br><small>' + r.avisos.map(esc).join('<br>') + '</small>' : ''); }
        draw2();
      };
    };
    draw2();
  };
  const desmarcarLig = desvincular;
  if (H.modo === 'api') { H.saida.api = { criarBens, vincular, desvincular, lancamentoRemovido, doLanc, painel }; return; }

  /* ---------- Aba Patrimônio (Administração) ---------- */
  const PCOLS = ['Nº patrimônio', 'Código', 'Item', 'Categoria', 'Localização', 'Status', 'Valor (R$)', 'Data de aquisição', 'Origem', 'Nota fiscal', 'Em aberto'];
  const plinha = i => [i.patNumero, i.codigo, i.nome + (i.marca || i.modelo ? ` (${[i.marca, i.modelo].filter(Boolean).join(' ')})` : ''), catDe(i.cat).nome, i.local || '-', i.status, i.patValor === '' || i.patValor == null ? '' : Number(i.patValor).toFixed(2).replace('.', ','), i.patAquisicao ? fmtData(i.patAquisicao) : '', i.patOrigem || '', i.patNF || '', faltaPat(i).join(', ')];
  let pfiltro = { q: '', c: '', st: '', pend: '' };
  const patrimonio = el => {
    const todos = itens().filter(ehPat).sort((a, b) => a.patNumero.localeCompare(b.patNumero, 'pt-BR', { numeric: true }));
    const ativos = todos.filter(i => i.status !== 'Baixado'), semV = ativos.filter(i => i.patValor === '' || i.patValor == null), somaV = ativos.reduce((t, i) => t + (Number(i.patValor) || 0), 0);
    const candidatos = itens().filter(i => elegivelPat(i) && !ehPat(i) && i.status !== 'Baixado').length;
    el.innerHTML = `<h3><i class="fas fa-landmark"></i> Patrimônio do Parque</h3>
    <p>Bens duráveis do Instituto, marcados a partir do Inventário (botão <strong>+ Patrimônio</strong> ou caixa "É patrimônio" no cadastro). Valor, data de aquisição e nota fiscal são opcionais e podem ser completados depois.${pode ? '' : ' Seu acesso é de consulta.'}</p>
    <div class="totais"><div><span>Bens no patrimônio (em uso)</span><strong>${ativos.length}</strong></div><div><span>Valor informado</span><strong>${moneyPat(somaV)}</strong></div><div><span>Sem valor informado</span><strong>${semV.length}</strong></div><div><span>Baixados</span><strong>${todos.length - ativos.length}</strong></div><div><span>Bens elegíveis ainda fora do patrimônio</span><strong>${candidatos}</strong></div></div>
    <div class="inv-filtros">
      <div class="form-row"><label for="p-q">Buscar (nº, código, nome, nota fiscal...)</label><input id="p-q" type="search" value="${esc(pfiltro.q)}"></div>
      <div class="form-row"><label for="p-c">Categoria</label><select id="p-c"><option value="">Todas</option>${CATS.filter(c => c.pat).map(c => `<option value="${c.id}"${c.id === pfiltro.c ? ' selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></div>
      <div class="form-row"><label for="p-s">Situação</label><select id="p-s"><option value="">Em uso (exceto baixados)</option><option value="*"${pfiltro.st === '*' ? ' selected' : ''}>Todos, inclusive baixados</option>${STATUS.map(x => `<option${x === pfiltro.st ? ' selected' : ''}>${x}</option>`).join('')}</select></div>
      <div class="form-row"><label for="p-p">Dados</label><select id="p-p"><option value="">Todos</option><option value="1"${pfiltro.pend ? ' selected' : ''}>Com dados em aberto</option></select></div>
    </div>
    <p class="inv-noprint"><button class="btn-visit" id="p-i"><i class="fas fa-print"></i> Imprimir</button> <button class="btn-visit" id="p-c2"><i class="fas fa-file-csv"></i> Baixar (CSV)</button></p>
    <p id="p-n" class="vazio" aria-live="polite"></p><div id="p-l"></div>`;
    let vis = [];
    const lista = () => {
      pfiltro = { q: $('#p-q', el).value.trim(), c: $('#p-c', el).value, st: $('#p-s', el).value, pend: $('#p-p', el).value };
      const q = norm(pfiltro.q);
      vis = todos.filter(i => (!q || norm([i.patNumero, i.codigo, i.nome, i.marca, i.modelo, i.serie, i.local, i.patNF, i.patObs].join(' ')).includes(q)) && (!pfiltro.c || i.cat === pfiltro.c) && (pfiltro.st === '*' || (pfiltro.st ? i.status === pfiltro.st : i.status !== 'Baixado')) && (!pfiltro.pend || faltaPat(i).length));
      $('#p-n', el).textContent = todos.length ? vis.length + ' bem(ns) encontrado(s).' : 'Nenhum bem marcado como patrimônio ainda. No Inventário, use o botão + Patrimônio no item.';
      $('#p-l', el).innerHTML = vis.length ? `<table class="doc-table"><thead><tr>${PCOLS.map(h => `<th>${esc(h)}</th>`).join('')}<th></th></tr></thead><tbody>${vis.map(i => { const r = plinha(i); return `<tr><td>${codBadge(r[0])}</td><td>${codBadge(r[1])}</td><td><strong>${esc(i.nome)}</strong></td><td>${esc(r[3])}</td><td>${esc(r[4])}</td><td>${stBadge(i.status)}</td><td>${esc(r[6] || '-')}</td><td>${esc(r[7] || '-')}</td><td>${esc(r[8] || '-')}</td><td>${esc(r[9] || '-')}</td><td>${r[10] ? `<small>${esc(r[10])}</small>` : 'completo'}</td><td>${pode ? `<button class="btn-visit" data-pe="${i.id}">Completar / editar</button>` : ''}</td></tr>`; }).join('')}</tbody></table>` : '';
      el.querySelectorAll('[data-pe]').forEach(b => b.onclick = () => { window.PR_INV_EDITAR = b.dataset.pe; if (H.irPara) H.irPara('inventario'); });
    };
    $('#p-q', el).oninput = lista; el.querySelectorAll('.inv-filtros select').forEach(x => { x.onchange = lista; });
    $('#p-i', el).onclick = () => window.print();
    $('#p-c2', el).onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv([PCOLS].concat(vis.map(plinha)))], { type: 'text/csv;charset=utf-8' })); a.download = `patrimonio-${hoje()}.csv`; a.click(); };
    lista();
  };
  if (H.modo === 'patrimonio') { patrimonio(root); return; }

  /* ---------- Estrutura da aba ---------- */
  const SUB = [['consulta', 'Consulta']].concat(pode ? [['cad', 'Cadastrar item'], ['mov', 'Movimentações'], ['imp', 'Importar planilha'], ['rel', 'Relatórios']] : []);
  if (window.PR_INV_EDITAR) { const alvo = itens().find(i => i.id === window.PR_INV_EDITAR); window.PR_INV_EDITAR = null; if (alvo && pode) { editId = alvo.id; sub = 'cad'; } }
  const draw = () => {
    if (!pode && sub !== 'consulta') sub = 'consulta';
    root.innerHTML = `<div class="tabs sub inv-noprint" role="tablist">${SUB.map(t => `<button class="tab-btn${t[0] === sub ? ' active' : ''}" data-s="${t[0]}">${t[1]}</button>`).join('')}</div><div id="inv-sub"></div>`;
    root.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sub = b.dataset.s; verId = null; editId = null; msg = ''; draw(); });
    ({ consulta, cad, mov, rel, imp: importar })[sub]($('#inv-sub', root));
  };
  draw();
} };
})();
