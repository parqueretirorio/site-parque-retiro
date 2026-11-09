// Compras e Orçamento (área restrita, Administração). Dados no navegador (chaves pr_compras_*).
// Três visões: Pedidos de compra (até 3 cotações, aprovação, registro da compra), Planejamento anual (feito de preferência em
// outubro do ano anterior) e Consolidado. Uma compra pode nascer do planejamento ou ser avulsa (com justificativa).
// Papéis (só tela; a trava real vem com o servidor): administrador e Responsável Financeiro aprovam e consolidam;
// Departamento de Compras cota e registra a compra; Solicitante só pede (e vê os próprios pedidos).
(function () {
const STATUS = ['Solicitada', 'Em cotação', 'Aguardando aprovação', 'Aprovada', 'Comprada', 'Cancelada'];
const ST_CLASSE = { 'Solicitada': 'badge-pend', 'Em cotação': 'badge-pend', 'Aguardando aprovação': 'badge-pend', 'Aprovada': 'badge-uso', 'Comprada': 'badge-disponivel', 'Cancelada': 'badge-indisponivel' };
const PRIOR = ['Normal', 'Urgente', 'Baixa'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MAX_COT = 3, MAX_ANEXO = 300 * 1024;

// Previsto de despesas que vem do planejamento anual (somado ao que foi digitado no Orçamento). Itens cancelados não contam.
// Devolve { 'centro|D|<centro>': [12 meses], 'categoria|D|<categoria>': [12 meses], 'tipo|D|<centro>': [12 meses] }.
function previstoDoPlano(db, ano) {
  const pl = (db.get('compras_plano', {}) || {})[ano], out = {};
  if (!pl || !Array.isArray(pl.itens)) return out;
  const soma = (k, m, v) => { out[k] = out[k] || Array(12).fill(0); out[k][m] = Math.round((out[k][m] + v) * 100) / 100; };
  pl.itens.filter(i => i.status !== 'Cancelado' && i.mes >= 1 && i.mes <= 12).forEach(i => {
    const v = Number(i.estimado) || 0, m = i.mes - 1;
    soma('centro|D|' + i.centro, m, v); soma('tipo|D|' + i.centro, m, v); if (i.categoria) soma('categoria|D|' + i.categoria, m, v);
  });
  return out;
}
window.PR_COMPRAS = { previstoDoPlano, abrir(me, root, H) {
  const { db, esc, $, uid, hoje, fmtData, csv, norm, tem, safeUrl, CC } = H;
  const adm = me.nivel === 'administrador', fin = tem(me, 'financeiro'), comp = tem(me, 'compras'), sol = tem(me, 'solicitante');
  const aprova = fin, cota = fin || comp, planejaTudo = fin || comp;
  const veTudo = cota;
  let sub = 'ped', verId = null, novo = false, msg = '', erro = '', ano = null, fPed = { st: '', q: '' };

  /* ---------- Dados ---------- */
  const peds = () => db.get('compras_ped', []);
  const planos = () => db.get('compras_plano', {});
  const saveP = l => db.set('compras_ped', l);
  const saveL = o => db.set('compras_plano', o);
  const meus = p => p.por === me.nome;
  const visiveis = () => peds().filter(p => veTudo || meus(p));
  const r2 = n => Math.round(n * 100) / 100;
  const num = t => { let x = String(t == null ? '' : t).trim(); if (x === '') return ''; x = x.includes(',') ? x.replace(/\./g, '').replace(',', '.') : x; const n = Number(x); return isFinite(n) && n >= 0 ? r2(n) : NaN; };
  const brl = v => v === '' || v == null ? '-' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const stB = s => `<span class="badge-status ${ST_CLASSE[s] || 'badge-pend'}">${esc(s)}</span>`;
  const saidas = () => (window.PR_PLANO ? window.PR_PLANO.SAIDAS : []).flatMap(g => g.itens);
  const anoAtual = new Date().getFullYear();
  const anosPlano = () => [...new Set(Object.keys(planos()).map(Number).concat([anoAtual, anoAtual + 1]))].sort((a, b) => b - a);
  if (!ano) ano = new Date().getMonth() >= 8 ? anoAtual + 1 : anoAtual; // a partir de setembro o foco é o ano seguinte
  const hist = (p, txt) => { (p.hist = p.hist || []).push({ data: hoje(), por: me.nome, txt }); };
  const proximoNumero = () => { const n = (db.get('compras_seq', 0) || 0) + 1; db.set('compras_seq', n); return 'CMP-' + String(n).padStart(4, '0'); };
  const ccOpts = (sel) => Object.entries(CC).map(([k, v]) => `<option value="${esc(k)}"${k === sel ? ' selected' : ''}>${esc(k)}</option>`).join('');
  const catOpts = sel => '<option value="">(sem categoria)</option>' + saidas().map(c => `<option${c === sel ? ' selected' : ''}>${esc(c)}</option>`).join('');
  const novoCentro = cb => {
    if (!aprova) return;
    const n = (prompt('Nome do novo centro de custo (ex.: Biblioteca, Cozinha):') || '').replace(/\s+/g, ' ').trim();
    if (!n) return; if (n.length > 40) { alert('Use até 40 caracteres.'); return; }
    if (Object.keys(CC).some(k => norm(k) === norm(n))) { alert('Esse centro de custo já existe.'); return; }
    const ex = db.get('cc_extra', {}); ex[n] = n + ' (criado por ' + me.nome + ' em ' + fmtData(hoje()) + ')';
    if (!db.set('cc_extra', ex)) { alert('Sem espaço no navegador para salvar.'); return; }
    Object.assign(CC, ex); if (cb) cb(); else draw();
  };
  const salvarPed = (p, antes) => { const l = peds(), i = l.findIndex(x => x.id === p.id); if (i < 0) l.push(p); else l[i] = p; return saveP(l); };

  /* ---------- Planejamento: ligação com o pedido ---------- */
  const itemPlano = (a, id) => ((planos()[a] || {}).itens || []).find(x => x.id === id);
  const setItemPlano = (a, id, mudar) => { const o = planos(), pl = o[a]; if (!pl) return; const it = (pl.itens || []).find(x => x.id === id); if (!it) return; mudar(it); saveL(o); };

  /* ---------- Pedidos ---------- */
  const listaPed = el => {
    const todos = visiveis(), vis = todos.filter(p => (!fPed.st || p.status === fPed.st) && (!fPed.q || norm([p.numero, p.titulo, p.centro, p.por, p.categoria].join(' ')).includes(norm(fPed.q)))).sort((a, b) => b.numero.localeCompare(a.numero));
    const ab = todos.filter(p => !['Comprada', 'Cancelada'].includes(p.status));
    el.innerHTML = `<h3><i class="fas fa-shopping-cart"></i> Pedidos de compra</h3>
    <p>Compras pedidas a qualquer momento, com até ${MAX_COT} cotações (o cenário ideal, sem obrigar a escolher a mais barata). Podem nascer do planejamento anual ou ser avulsas.${veTudo ? '' : ' Você vê os pedidos que você mesmo fez.'}</p>
    ${msg ? `<p class="tip-box" role="status"><i class="fas fa-check-circle"></i> ${esc(msg)}</p>` : ''}
    <div class="totais"><div><span>Pedidos em andamento</span><strong>${ab.length}</strong></div><div><span>Aguardando aprovação</span><strong>${todos.filter(p => p.status === 'Aguardando aprovação').length}</strong></div><div><span>Aprovados, a comprar</span><strong>${todos.filter(p => p.status === 'Aprovada').length}</strong></div><div><span>Estimado em andamento</span><strong>${brl(ab.reduce((t, p) => t + (Number(p.estimado) || 0), 0))}</strong></div></div>
    <p class="inv-noprint"><button class="btn-visit" id="pd-n"><i class="fas fa-plus-circle"></i> Novo pedido de compra</button></p>
    <div class="inv-filtros"><div class="form-row"><label for="pd-q">Buscar (número, título, área...)</label><input id="pd-q" type="search" value="${esc(fPed.q)}"></div>
    <div class="form-row"><label for="pd-s">Situação</label><select id="pd-s"><option value="">Todas</option>${STATUS.map(s => `<option${s === fPed.st ? ' selected' : ''}>${s}</option>`).join('')}</select></div></div>
    ${vis.length ? `<table class="doc-table"><thead><tr><th>Nº</th><th>Pedido</th><th>Centro de custo</th><th>Origem</th><th>Estimado</th><th>Cotações</th><th>Situação</th><th></th></tr></thead><tbody>${vis.map(p => `<tr><td>${esc(p.numero)}</td><td><strong>${esc(p.titulo)}</strong>${p.prioridade === 'Urgente' ? ' <span class="badge-status badge-indisponivel">Urgente</span>' : ''}<br><small>${esc(p.por)} · ${fmtData(p.criado)}</small></td><td>${esc(p.centro)}</td><td>${p.origem === 'plano' ? 'Plano ' + esc(p.planoAno) : 'Fora do planejamento'}</td><td>${brl(p.estimado)}</td><td>${(p.cotacoes || []).length} de ${MAX_COT}</td><td>${stB(p.status)}</td><td><button class="btn-visit" data-v="${p.id}">Abrir</button></td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhum pedido encontrado.</p>'}`;
    $('#pd-n', el).onclick = () => { novo = true; msg = ''; erro = ''; draw(); };
    $('#pd-q', el).oninput = e => { fPed.q = e.target.value; const pos = e.target.selectionStart; listaPed(el); const i = $('#pd-q', el); i.focus(); i.setSelectionRange(pos, pos); };
    $('#pd-s', el).onchange = e => { fPed.st = e.target.value; listaPed(el); };
    el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { verId = b.dataset.v; msg = ''; erro = ''; draw(); window.scrollTo(0, 0); });
  };

  const formPed = (el, pre) => {
    pre = pre || {}; const planoAno = pre.planoAno || ano, itens = ((planos()[planoAno] || {}).itens || []).filter(i => i.status === 'Previsto' && !i.pedido);
    el.innerHTML = `<h3><i class="fas fa-plus-circle"></i> Novo pedido de compra</h3>
    ${erro ? `<p class="form-erro" role="alert">${esc(erro)}</p>` : ''}
    <form id="pf" class="form-reserva" novalidate>
      <div class="form-row"><label>Origem *</label><label><input type="radio" name="po" value="plano"${pre.origem === 'plano' ? ' checked' : ''}> Do planejamento anual</label> <label><input type="radio" name="po" value="fora"${pre.origem !== 'plano' ? ' checked' : ''}> Fora do planejamento (urgente ou imprevista)</label></div>
      <div class="form-row" id="pf-pl" hidden><label for="pf-pa">Item do planejamento de</label><select id="pf-pa">${anosPlano().map(a => `<option${a === planoAno ? ' selected' : ''}>${a}</option>`).join('')}</select><select id="pf-pi" aria-label="Item do planejamento"><option value="">Selecione o item...</option>${itens.map(i => `<option value="${i.id}"${i.id === pre.planoItem ? ' selected' : ''}>${esc(i.titulo)} (${esc(i.centro)}, ${brl(i.estimado)})</option>`).join('')}</select></div>
      <div class="form-row" id="pf-jr"><label for="pf-j">Justificativa (por que não estava no planejamento) *</label><input id="pf-j" maxlength="200"></div>
      <div class="form-row"><label for="pf-t">O que comprar *</label><input id="pf-t" maxlength="100" value="${esc(pre.titulo || '')}" placeholder="Ex.: Projetor para a Sala"></div>
      <div class="form-row"><label for="pf-d">Detalhes (marca, medida, especificação)</label><textarea id="pf-d" rows="2" maxlength="400">${esc(pre.descricao || '')}</textarea></div>
      <div class="form-row"><label for="pf-c">Centro de custo *</label><select id="pf-c"><option value="">Selecione...</option>${ccOpts(pre.centro)}</select>${aprova ? ' <button type="button" class="btn-visit" id="pf-nc">＋ Novo centro de custo</button>' : ''}</div>
      <div class="form-row"><label for="pf-k">Categoria de despesa (opcional)</label><select id="pf-k">${catOpts(pre.categoria)}</select></div>
      <div class="form-row"><label for="pf-q">Quantidade</label><input id="pf-q" type="number" min="1" step="1" value="${esc(pre.qtd || 1)}"></div>
      <div class="form-row"><label for="pf-v">Valor estimado total (R$, opcional)</label><input id="pf-v" inputmode="decimal" maxlength="14" value="${pre.estimado === '' || pre.estimado == null ? '' : String(pre.estimado).replace('.', ',')}"></div>
      <div class="form-row"><label for="pf-p">Prioridade</label><select id="pf-p">${PRIOR.map(x => `<option>${x}</option>`).join('')}</select></div>
      <div class="form-row"><label><input type="checkbox" id="pf-pt"${pre.patrimonio ? ' checked' : ''}> É um bem que vai para o patrimônio</label></div>
      <button class="btn-visit btn-large"><i class="fas fa-paper-plane"></i> Enviar pedido</button> <button type="button" class="btn-visit" id="pf-x" style="background:#6c7a7b">Cancelar</button>
    </form>`;
    const sync = () => { const pl = el.querySelector('[name=po]:checked').value === 'plano'; $('#pf-pl', el).hidden = !pl; $('#pf-jr', el).hidden = pl; };
    el.querySelectorAll('[name=po]').forEach(r => r.onchange = sync); sync();
    $('#pf-pa', el).onchange = e => { formPed(el, { origem: 'plano', planoAno: Number(e.target.value) }); };
    $('#pf-pi', el).onchange = e => { const it = itemPlano(Number($('#pf-pa', el).value), e.target.value); if (!it) return; $('#pf-t', el).value = it.titulo; $('#pf-c', el).value = it.centro; $('#pf-k', el).value = it.categoria || ''; $('#pf-q', el).value = it.qtd || 1; $('#pf-v', el).value = String(it.estimado).replace('.', ','); $('#pf-pt', el).checked = !!it.patrimonio; };
    const coleta = () => ({ origem: el.querySelector('[name=po]:checked').value, titulo: $('#pf-t', el).value, descricao: $('#pf-d', el).value, centro: $('#pf-c', el).value, categoria: $('#pf-k', el).value, qtd: $('#pf-q', el).value, estimado: $('#pf-v', el).value, patrimonio: $('#pf-pt', el).checked, planoAno: Number($('#pf-pa', el).value), planoItem: $('#pf-pi', el).value });
    const nc = $('#pf-nc', el); if (nc) nc.onclick = () => { const c = coleta(); novoCentro(() => { const k = Object.keys(CC).pop(); c.centro = c.centro || k; formPed(el, c); }); };
    $('#pf-x', el).onclick = () => { novo = false; erro = ''; draw(); };
    $('#pf', el).onsubmit = e => {
      e.preventDefault(); const g = id => $('#' + id, el).value.trim(), origem = el.querySelector('[name=po]:checked').value;
      const falha = m => { erro = m; formPed(el, { origem, titulo: g('pf-t'), descricao: g('pf-d'), centro: g('pf-c'), categoria: g('pf-k'), qtd: g('pf-q'), estimado: g('pf-v'), patrimonio: $('#pf-pt', el).checked, planoAno: Number($('#pf-pa', el).value), planoItem: $('#pf-pi', el).value }); };
      const t = g('pf-t'), c = g('pf-c'), v = num(g('pf-v')), q = parseInt(g('pf-q'), 10), pi = $('#pf-pi', el).value, pa = Number($('#pf-pa', el).value);
      if (!t || !c) return falha('Informe o que comprar e o centro de custo.');
      if (Number.isNaN(v)) return falha('O valor estimado deve ser um número maior ou igual a zero (ou ficar em branco).');
      if (!(q >= 1)) return falha('A quantidade deve ser 1 ou mais.');
      if (origem === 'plano' && !pi) return falha('Escolha o item do planejamento (ou marque "Fora do planejamento").');
      if (origem === 'fora' && !g('pf-j')) return falha('Explique em uma frase por que a compra não estava no planejamento.');
      const p = { id: uid(), numero: proximoNumero(), titulo: t, descricao: g('pf-d'), centro: c, categoria: g('pf-k'), qtd: q, estimado: v, prioridade: g('pf-p'), patrimonio: $('#pf-pt', el).checked, origem, justificativa: origem === 'fora' ? g('pf-j') : '', planoAno: origem === 'plano' ? pa : '', planoItem: origem === 'plano' ? pi : '', status: 'Solicitada', por: me.nome, criado: hoje(), cotacoes: [], hist: [] };
      hist(p, 'Pedido criado' + (origem === 'plano' ? ' a partir do planejamento de ' + pa : ' fora do planejamento: ' + p.justificativa));
      if (!salvarPed(p)) return falha('Sem espaço no navegador para salvar o pedido.');
      if (origem === 'plano') setItemPlano(pa, pi, it => { it.pedido = p.id; it.status = 'Em pedido'; });
      novo = false; erro = ''; verId = p.id; msg = `Pedido ${p.numero} enviado.`; draw();
    };
  };

  const detalhePed = el => {
    const p = peds().find(x => x.id === verId); if (!p || !(veTudo || meus(p))) { verId = null; return listaPed(el); }
    const cts = p.cotacoes || [], min = cts.length ? Math.min(...cts.map(c => c.valor)) : null, escolhida = cts.find(c => c.id === p.escolha);
    const aberto = !['Comprada', 'Cancelada'].includes(p.status), podeCotar = cota && ['Solicitada', 'Em cotação', 'Aguardando aprovação'].includes(p.status);
    const dados = [['Número', esc(p.numero)], ['Situação', stB(p.status)], ['Pedido por', esc(p.por) + ' em ' + fmtData(p.criado)], ['Centro de custo', esc(p.centro)], ['Categoria', esc(p.categoria || '-')], ['Quantidade', esc(p.qtd)], ['Valor estimado', brl(p.estimado)], ['Prioridade', esc(p.prioridade)],
      ['Origem', p.origem === 'plano' ? 'Planejamento de ' + esc(p.planoAno) : 'Fora do planejamento: ' + esc(p.justificativa)], ['Vai para o patrimônio', p.patrimonio ? 'Sim' : 'Não']].concat(p.descricao ? [['Detalhes', esc(p.descricao)]] : [])
      .concat(p.status === 'Aprovada' || p.status === 'Comprada' ? [['Aprovada por', esc(p.aprovadoPor) + ' em ' + fmtData(p.aprovadoEm) + ' (' + (p.cotacoesNaAprovacao || 0) + ' cotação(ões))']].concat(p.escolhaMotivo ? [['Motivo da escolha', esc(p.escolhaMotivo)]] : []) : [])
      .concat(p.status === 'Comprada' ? [['Compra', brl(p.valorPago) + ' em ' + fmtData(p.compradoEm) + (p.nf ? ' · NF ' + esc(p.nf) : '') + (p.fornecedorFinal ? ' · ' + esc(p.fornecedorFinal) : '')]] : []);
    el.innerHTML = `<p class="inv-noprint"><button class="btn-visit" id="d-v"><i class="fas fa-arrow-left"></i> Voltar aos pedidos</button></p>
    <h3>${esc(p.numero)} — ${esc(p.titulo)}</h3>
    ${msg ? `<p class="tip-box" role="status"><i class="fas fa-check-circle"></i> ${esc(msg)}</p>` : ''}${erro ? `<p class="form-erro" role="alert">${esc(erro)}</p>` : ''}
    <dl>${dados.map(d => `<dt>${d[0]}</dt><dd>${d[1]}</dd>`).join('')}</dl>
    <h4>Cotações <small>(${cts.length} de ${MAX_COT}${cts.length < MAX_COT ? ' — o cenário ideal é ter 3' : ''})</small></h4>
    ${cts.length ? `<table class="doc-table"><thead><tr><th></th><th>Fornecedor</th><th>Valor</th><th>Prazo / condições</th><th>Anexo</th><th></th></tr></thead><tbody>${cts.map(c => `<tr><td>${p.status === 'Aguardando aprovação' && aprova ? `<input type="radio" name="esc" value="${c.id}" aria-label="Escolher ${esc(c.fornecedor)}"${c.id === p.escolha ? ' checked' : ''}>` : (c.id === p.escolha ? '✔' : '')}</td><td>${esc(c.fornecedor)}${c.valor === min && cts.length > 1 ? ' <small>(menor valor)</small>' : ''}</td><td>${brl(c.valor)}</td><td>${esc(c.obs || '-')}</td><td>${c.anexo && safeUrl(c.anexo) ? `<a href="${esc(c.anexo)}" download="cotacao-${esc(p.numero)}-${c.id}">Baixar</a>` : '-'}</td><td>${podeCotar ? `<button class="icon-btn" data-rc="${c.id}" aria-label="Remover cotação"><i class="fas fa-trash"></i></button>` : ''}</td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhuma cotação ainda.</p>'}
    ${podeCotar && cts.length < MAX_COT ? `<form id="cf" class="form-reserva" novalidate><h4>Nova cotação</h4>
      <div class="form-row"><label for="cf-f">Fornecedor *</label><input id="cf-f" maxlength="80"></div>
      <div class="form-row"><label for="cf-v">Valor total (R$) *</label><input id="cf-v" inputmode="decimal" maxlength="14"></div>
      <div class="form-row"><label for="cf-o">Prazo, frete, condições</label><input id="cf-o" maxlength="160"></div>
      <div class="form-row"><label for="cf-a">Anexar orçamento (PDF ou imagem, até 300 KB)</label><input id="cf-a" type="file" accept=".pdf,image/*"></div>
      <button class="btn-visit"><i class="fas fa-plus"></i> Adicionar cotação</button></form>` : ''}
    <div class="inv-noprint" id="acoes"></div>
    <h4>Histórico</h4><table class="doc-table"><thead><tr><th>Data</th><th>Quem</th><th>O que aconteceu</th></tr></thead><tbody>${(p.hist || []).slice().reverse().map(h => `<tr><td>${fmtData(h.data)}</td><td>${esc(h.por)}</td><td>${esc(h.txt)}</td></tr>`).join('')}</tbody></table>`;
    const acoes = $('#acoes', el), btn = (id, ic, tx, st) => `<button class="btn-visit" id="${id}"${st ? ` style="${st}"` : ''}><i class="fas ${ic}"></i> ${tx}</button> `;
    let h = '';
    if (cota && ['Solicitada', 'Em cotação'].includes(p.status) && cts.length) h += btn('a-env', 'fa-paper-plane', 'Enviar para aprovação');
    if (cota && p.status === 'Solicitada') h += btn('a-cot', 'fa-search-dollar', 'Marcar "Em cotação"');
    if (aprova && p.status === 'Aguardando aprovação') h += `<div class="form-row"><label for="a-mo">Motivo da escolha (opcional; vale anotar quando não for a mais barata)</label><input id="a-mo" maxlength="200"></div>` + btn('a-apr', 'fa-check', 'Aprovar a cotação marcada') + btn('a-dev', 'fa-undo', 'Devolver para cotação', 'background:#b8620f');
    if ((cota || aprova) && p.status === 'Aprovada') h += `<form id="rcf" class="form-reserva"><h4>Registrar a compra</h4><div class="form-row"><label for="rc-v">Valor pago (R$) *</label><input id="rc-v" inputmode="decimal" value="${escolhida ? String(escolhida.valor).replace('.', ',') : ''}"></div><div class="form-row"><label for="rc-d">Data da compra *</label><input id="rc-d" type="date" max="${hoje()}" value="${hoje()}"></div><div class="form-row"><label for="rc-f">Fornecedor</label><input id="rc-f" maxlength="80" value="${esc(escolhida ? escolhida.fornecedor : '')}"></div><div class="form-row"><label for="rc-n">Nota fiscal (número, se houver)</label><input id="rc-n" maxlength="40"></div><button class="btn-visit"><i class="fas fa-shopping-bag"></i> Registrar compra</button></form>`;
    if (p.status === 'Comprada' && fin) h += p.lancamento ? '<p><small><i class="fas fa-check-circle"></i> Já lançado na Prestação de Contas.</small></p>' : btn('a-lan', 'fa-calculator', 'Lançar na Prestação de Contas');
    if (aberto && (aprova || (meus(p) && ['Solicitada', 'Em cotação'].includes(p.status)))) h += btn('a-can', 'fa-ban', 'Cancelar pedido', 'background:#b3261e');
    acoes.innerHTML = h;
    const mud = (st, txt, extra) => { const l = peds(), q = l.find(x => x.id === p.id); q.status = st; hist(q, txt); if (extra) extra(q); if (!saveP(l)) { erro = 'Sem espaço no navegador.'; } else erro = ''; draw(); };
    $('#d-v', el).onclick = () => { verId = null; msg = ''; erro = ''; draw(); };
    el.querySelectorAll('[data-rc]').forEach(b => b.onclick = () => { if (!confirm('Remover esta cotação?')) return; mud(p.status === 'Aguardando aprovação' ? 'Em cotação' : p.status, 'Cotação removida', q => { q.cotacoes = q.cotacoes.filter(c => c.id !== b.dataset.rc); if (q.escolha === b.dataset.rc) q.escolha = ''; }); });
    const cf = $('#cf', el); if (cf) cf.onsubmit = e => {
      e.preventDefault(); const f = $('#cf-f', el).value.trim(), v = num($('#cf-v', el).value), o = $('#cf-o', el).value.trim(), file = $('#cf-a', el).files[0];
      if (!f || v === '' || Number.isNaN(v) || !(v > 0)) { erro = 'Informe o fornecedor e um valor maior que zero.'; draw(); return; }
      const grava = anexo => mud(p.status === 'Solicitada' ? 'Em cotação' : p.status, `Cotação de ${f}: ${brl(v)}`, q => { q.cotacoes = (q.cotacoes || []).concat([{ id: uid(), fornecedor: f, valor: v, obs: o, anexo: anexo || '', por: me.nome, em: hoje() }]); });
      if (file) { if (file.size > MAX_ANEXO) { erro = 'Anexo maior que 300 KB. Reduza o arquivo ou registre sem anexo.'; draw(); return; } const r = new FileReader(); r.onload = () => safeUrl(r.result) ? grava(r.result) : (erro = 'Tipo de arquivo não aceito.', draw()); r.readAsDataURL(file); } else grava('');
    };
    const A = id => $('#' + id, el);
    if (A('a-cot')) A('a-cot').onclick = () => mud('Em cotação', 'Início das cotações');
    if (A('a-env')) A('a-env').onclick = () => mud('Aguardando aprovação', `Enviado para aprovação com ${cts.length} cotação(ões)${cts.length < MAX_COT ? ' (o ideal seriam ' + MAX_COT + ')' : ''}`);
    if (A('a-dev')) A('a-dev').onclick = () => { const m = prompt('Por que devolver para cotação? (ex.: pedir mais uma cotação)'); if (m === null) return; mud('Em cotação', 'Devolvido para cotação' + (m.trim() ? ': ' + m.trim() : '')); };
    if (A('a-apr')) A('a-apr').onclick = () => {
      const esc2 = el.querySelector('[name=esc]:checked'); if (!esc2) { erro = 'Marque a cotação escolhida.'; draw(); return; }
      const c = cts.find(x => x.id === esc2.value), mo = A('a-mo').value.trim();
      mud('Aprovada', `Aprovada a cotação de ${c.fornecedor} (${brl(c.valor)})${c.valor !== min ? ', que não é a de menor valor' : ''}${mo ? '. Motivo: ' + mo : ''}`, q => { q.escolha = c.id; q.escolhaMotivo = mo; q.aprovadoPor = me.nome; q.aprovadoEm = hoje(); q.cotacoesNaAprovacao = cts.length; });
    };
    const rcf = $('#rcf', el); if (rcf) rcf.onsubmit = e => {
      e.preventDefault(); const v = num($('#rc-v', el).value), d = $('#rc-d', el).value, f = $('#rc-f', el).value.trim(), n = $('#rc-n', el).value.trim();
      if (v === '' || Number.isNaN(v) || !(v > 0) || !d) { erro = 'Informe o valor pago e a data da compra.'; draw(); return; }
      if (d > hoje()) { erro = 'A data da compra não pode ser no futuro.'; draw(); return; }
      msg = 'Compra registrada.' + (p.patrimonio ? ' Como é patrimônio, use "Lançar na Prestação de Contas" e o painel do Patrimônio abre em seguida.' : '');
      if (p.origem === 'plano') setItemPlano(p.planoAno, p.planoItem, it => { it.status = 'Comprado'; });
      mud('Comprada', `Compra registrada: ${brl(v)} em ${fmtData(d)}${n ? ', NF ' + n : ''}`, q => { q.valorPago = v; q.compradoEm = d; q.nf = n; q.fornecedorFinal = f; });
    };
    if (A('a-lan')) A('a-lan').onclick = () => {
      const q = peds().find(x => x.id === p.id), cs = db.get('contas', []), id = uid();
      cs.push({ id, data: q.compradoEm, desc: `Compra ${q.numero}: ${q.titulo}`, centro: q.centro, tipo: 'Saída', origem: q.categoria || '', vaquinha: '', pessoa: q.fornecedorFinal || '', ref: '', forma: '', valor: q.valorPago, moeda: 'PIX', comp: '', compra: q.id, por: me.nome, em: hoje() });
      if (!db.set('contas', cs)) { erro = 'Sem espaço no navegador para lançar.'; draw(); return; }
      const l = peds(), q2 = l.find(x => x.id === p.id); q2.lancamento = id; hist(q2, 'Lançado na Prestação de Contas'); saveP(l);
      if (q.patrimonio) window.PR_ABRIR_PAT = id; if (H.irPara) H.irPara('contas'); else draw();
    };
    if (A('a-can')) A('a-can').onclick = () => { const m = prompt('Motivo do cancelamento:'); if (m === null || !m.trim()) return; mud('Cancelada', 'Cancelado: ' + m.trim()); if (p.origem === 'plano') setItemPlano(p.planoAno, p.planoItem, it => { it.pedido = ''; it.status = 'Previsto'; }); };
  };

  /* ---------- Planejamento anual ---------- */
  const planoDe = a => planos()[a] || { status: 'Em elaboração', itens: [] };
  const podeEditarPlano = pl => pl.status !== 'Fechado' ? (planejaTudo || sol) : fin;
  const planejamento = el => {
    const pl = planoDe(ano), o = planos(), itens = (pl.itens || []), ativos = itens.filter(i => i.status !== 'Cancelado'), tot = ativos.reduce((t, i) => t + (Number(i.estimado) || 0), 0), pode = podeEditarPlano(pl);
    const porMes = Array(12).fill(0); ativos.forEach(i => { porMes[i.mes - 1] += Number(i.estimado) || 0; });
    const porCc = {}; ativos.forEach(i => { porCc[i.centro] = (porCc[i.centro] || 0) + (Number(i.estimado) || 0); });
    el.innerHTML = `<h3><i class="fas fa-calendar-alt"></i> Planejamento anual</h3>
    <p>Lista do que o Parque pretende comprar ou fazer no ano, feita de preferência em <strong>outubro do ano anterior</strong>. Cada item pode virar um pedido de compra mais tarde, mas o pedido também pode ser avulso.</p>
    ${msg ? `<p class="tip-box" role="status"><i class="fas fa-check-circle"></i> ${esc(msg)}</p>` : ''}${erro ? `<p class="form-erro" role="alert">${esc(erro)}</p>` : ''}
    <div class="form-row" style="max-width:360px"><label for="pl-a">Ano do planejamento</label><select id="pl-a">${anosPlano().map(a => `<option${a === ano ? ' selected' : ''}>${a}</option>`).join('')}${fin ? '<option value="+">＋ Abrir outro ano...</option>' : ''}</select></div>
    ${ano === anoAtual + 1 && new Date().getMonth() >= 8 ? '<p class="tip-box" role="note"><i class="fas fa-info-circle"></i> Estamos na época de planejar o ano seguinte (a partir de setembro). Feche a lista até o fim de outubro.</p>' : ''}
    <div class="totais"><div><span>Situação do planejamento de ${ano}</span><strong>${esc(pl.status)}</strong></div><div><span>Itens previstos</span><strong>${ativos.length}</strong></div><div><span>Total estimado</span><strong>${brl(tot)}</strong></div><div><span>Já comprados</span><strong>${ativos.filter(i => i.status === 'Comprado').length}</strong></div></div>
    <p class="inv-noprint">${fin ? (pl.status === 'Fechado' ? '<button class="btn-visit" id="pl-ab">Reabrir planejamento</button> ' : '<button class="btn-visit" id="pl-fe"><i class="fas fa-lock"></i> Fechar planejamento</button> ') : ''}<button class="btn-visit" id="pl-c"><i class="fas fa-file-csv"></i> Baixar (CSV)</button> <button class="btn-visit" id="pl-i"><i class="fas fa-print"></i> Imprimir</button></p>
    <p><small><i class="fas fa-link"></i> Este planejamento está <strong>ligado ao Previsto de despesas</strong> do Orçamento e Fluxo Financeiro de ${ano} (Relatórios Consolidados): cada item entra no mês e no centro de custo (e categoria) indicados, e muda junto se o item mudar. Valores digitados direto no Previsto continuam valendo e somam ao plano.</small></p>
    ${pode ? `<form id="pi-f" class="form-reserva" novalidate><h4>Novo item do planejamento</h4>
      <div class="form-row"><label for="pi-t">O que está previsto *</label><input id="pi-t" maxlength="100" placeholder="Ex.: Troca do telhado da Sala"></div>
      <div class="form-row"><label for="pi-c">Centro de custo *</label><select id="pi-c"><option value="">Selecione...</option>${ccOpts('')}</select>${aprova ? ' <button type="button" class="btn-visit" id="pi-nc">＋ Novo centro de custo</button>' : ''}</div>
      <div class="form-row"><label for="pi-k">Categoria de despesa</label><select id="pi-k">${catOpts('')}</select></div>
      <div class="form-row"><label for="pi-q">Quantidade</label><input id="pi-q" type="number" min="1" step="1" value="1"></div>
      <div class="form-row"><label for="pi-v">Valor estimado total (R$) *</label><input id="pi-v" inputmode="decimal" maxlength="14"></div>
      <div class="form-row"><label for="pi-m">Mês previsto *</label><select id="pi-m">${MESES.map((m, k) => `<option value="${k + 1}">${m}</option>`).join('')}</select></div>
      <div class="form-row"><label><input type="checkbox" id="pi-pt"> Bem que vai para o patrimônio</label></div>
      <div class="form-row"><label for="pi-o">Observações</label><input id="pi-o" maxlength="200"></div>
      <button class="btn-visit" id="pi-ok"><i class="fas fa-plus"></i> Adicionar ao planejamento</button></form>` : `<p class="vazio">${pl.status === 'Fechado' ? 'Planejamento fechado: só o Responsável Financeiro altera.' : 'Seu perfil só consulta o planejamento.'}</p>`}
    ${ativos.length || itens.length ? `<table class="doc-table"><thead><tr><th>Mês</th><th>Item</th><th>Centro de custo</th><th>Categoria</th><th>Qtd.</th><th>Estimado</th><th>Situação</th><th></th></tr></thead><tbody>${itens.slice().sort((a, b) => a.mes - b.mes || a.titulo.localeCompare(b.titulo, 'pt-BR')).map(i => `<tr><td>${esc(MESES[i.mes - 1])}</td><td><strong>${esc(i.titulo)}</strong>${i.patrimonio ? ' <small>(patrimônio)</small>' : ''}${i.obs ? `<br><small>${esc(i.obs)}</small>` : ''}<br><small>${esc(i.por)}</small></td><td>${esc(i.centro)}</td><td>${esc(i.categoria || '-')}</td><td>${esc(i.qtd || 1)}</td><td>${brl(i.estimado)}</td><td>${esc(i.status)}</td><td>${i.status === 'Previsto' && !i.pedido && (cota || sol) ? `<button class="btn-visit" data-pp="${i.id}">Pedir compra</button> ` : ''}${pode && !i.pedido && i.status !== 'Comprado' ? `<button class="icon-btn" data-ir="${i.id}" aria-label="Remover item"><i class="fas fa-trash"></i></button>` : ''}</td></tr>`).join('')}</tbody></table>
      <h4>Por mês</h4><table class="doc-table"><thead><tr>${MESES.map(m => `<th>${m.slice(0, 3)}</th>`).join('')}</tr></thead><tbody><tr>${porMes.map(v => `<td>${v ? brl(v) : '-'}</td>`).join('')}</tr></tbody></table>
      <h4>Por centro de custo</h4><table class="doc-table"><thead><tr><th>Centro de custo</th><th>Estimado</th></tr></thead><tbody>${Object.entries(porCc).sort().map(([k, v]) => `<tr><td>${esc(k)}</td><td>${brl(v)}</td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhum item previsto para este ano ainda.</p>'}`;
    $('#pl-a', el).onchange = e => { if (e.target.value === '+') { const t = parseInt(prompt('Qual ano abrir? (ex.: ' + (anoAtual + 2) + ')'), 10); if (t >= anoAtual && t <= anoAtual + 5) { const oo = planos(); oo[t] = oo[t] || { status: 'Em elaboração', itens: [] }; saveL(oo); ano = t; } } else ano = Number(e.target.value); msg = ''; erro = ''; draw(); };
    const nc = $('#pi-nc', el); if (nc) nc.onclick = novoCentro;
    const f = $('#pi-f', el); if (f) f.onsubmit = e => {
      e.preventDefault(); const g = id => $('#' + id, el).value.trim(), t = g('pi-t'), c = g('pi-c'), v = num(g('pi-v')), q = parseInt(g('pi-q'), 10);
      if (!t || !c) { erro = 'Informe o item e o centro de custo.'; draw(); return; }
      if (v === '' || Number.isNaN(v) || !(v > 0)) { erro = 'Informe o valor estimado (maior que zero).'; draw(); return; }
      if (!(q >= 1)) { erro = 'A quantidade deve ser 1 ou mais.'; draw(); return; }
      const oo = planos(), p2 = oo[ano] = oo[ano] || { status: 'Em elaboração', itens: [] };
      p2.itens.push({ id: uid(), titulo: t, centro: c, categoria: g('pi-k'), qtd: q, estimado: v, mes: parseInt(g('pi-m'), 10), patrimonio: $('#pi-pt', el).checked, obs: g('pi-o'), status: 'Previsto', pedido: '', por: me.nome, em: hoje() });
      if (!saveL(oo)) { erro = 'Sem espaço no navegador.'; draw(); return; } erro = ''; msg = 'Item adicionado ao planejamento de ' + ano + '.'; draw();
    };
    el.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => { if (!confirm('Remover este item do planejamento?')) return; const oo = planos(); oo[ano].itens = oo[ano].itens.filter(x => x.id !== b.dataset.ir); saveL(oo); draw(); });
    el.querySelectorAll('[data-pp]').forEach(b => b.onclick = () => { const it = itemPlano(ano, b.dataset.pp); if (!it) return; novo = true; sub = 'ped'; formPedPre = { origem: 'plano', planoAno: ano, planoItem: it.id, titulo: it.titulo, centro: it.centro, categoria: it.categoria, qtd: it.qtd, estimado: it.estimado, patrimonio: it.patrimonio }; draw(); });
    const fe = $('#pl-fe', el); if (fe) fe.onclick = () => { if (!confirm('Fechar o planejamento de ' + ano + '? Depois só o Responsável Financeiro altera.')) return; const oo = planos(); oo[ano] = oo[ano] || { itens: [] }; oo[ano].status = 'Fechado'; oo[ano].fechadoPor = me.nome; oo[ano].fechadoEm = hoje(); saveL(oo); msg = 'Planejamento de ' + ano + ' fechado.'; draw(); };
    const ab = $('#pl-ab', el); if (ab) ab.onclick = () => { const oo = planos(); oo[ano].status = 'Em elaboração'; saveL(oo); msg = 'Planejamento reaberto.'; draw(); };
    $('#pl-c', el).onclick = () => { const rows = [['Ano', 'Mês', 'Item', 'Centro de custo', 'Categoria', 'Qtd.', 'Estimado (R$)', 'Patrimônio', 'Situação', 'Pedido', 'Pedido por']].concat(itens.map(i => [ano, MESES[i.mes - 1], i.titulo, i.centro, i.categoria || '', i.qtd || 1, String(i.estimado).replace('.', ','), i.patrimonio ? 'Sim' : 'Não', i.status, i.pedido ? (peds().find(p => p.id === i.pedido) || {}).numero || '' : '', i.por])); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = `planejamento-${ano}.csv`; a.click(); };
    $('#pl-i', el).onclick = () => window.print();
  };
  let formPedPre = null;
  /* ---------- Consolidado ---------- */
  const consolidado = el => {
    if (!veTudo) { el.innerHTML = '<p class="vazio">O consolidado é do Departamento de Compras, do Responsável Financeiro e do administrador.</p>'; return; }
    const pl = planoDe(ano), ps = peds(), no = p => (p.origem === 'plano' ? Number(p.planoAno) : Number(String(p.criado).slice(0, 4))) === ano;
    const doAno = ps.filter(no), cs = db.get('contas', []).filter(c => c.tipo === 'Saída' && String(c.data).slice(0, 4) === String(ano));
    const centros = [...new Set(Object.keys(CC).concat(pl.itens.map(i => i.centro), doAno.map(p => p.centro), cs.map(c => c.centro)))];
    const rows = centros.map(c => {
      const plan = pl.itens.filter(i => i.centro === c && i.status !== 'Cancelado').reduce((t, i) => t + (Number(i.estimado) || 0), 0);
      const ped = doAno.filter(p => p.centro === c && !['Comprada', 'Cancelada'].includes(p.status)).reduce((t, p) => t + (Number(p.estimado) || 0), 0);
      const comprado = doAno.filter(p => p.centro === c && p.status === 'Comprada').reduce((t, p) => t + (Number(p.valorPago) || 0), 0);
      const fora = doAno.filter(p => p.centro === c && p.status === 'Comprada' && p.origem === 'fora').reduce((t, p) => t + (Number(p.valorPago) || 0), 0);
      const caixa = cs.filter(x => x.centro === c && x.moeda !== 'MUMBUCA').reduce((t, x) => t + x.valor, 0);
      return [c, plan, ped, comprado, fora, caixa];
    }).filter(r => r.slice(1).some(v => v));
    const T = rows.reduce((t, r) => t.map((v, k) => v + (r[k + 1] || 0)), [0, 0, 0, 0, 0]);
    const H0 = ['Centro de custo', 'Planejado', 'Pedidos em andamento (estimado)', 'Comprado', 'Dele, fora do planejamento', 'Saídas no caixa (R$)'];
    el.innerHTML = `<h3><i class="fas fa-chart-bar"></i> Consolidado de ${ano}</h3>
    <div class="form-row" style="max-width:260px"><label for="cn-a">Ano</label><select id="cn-a">${anosPlano().map(a => `<option${a === ano ? ' selected' : ''}>${a}</option>`).join('')}</select></div>
    <p><small>Planejado = itens do planejamento do ano. Comprado = pedidos com compra registrada. "Fora do planejamento" = compras avulsas. Saídas no caixa = lançamentos de Saída da Prestação de Contas no ano (sem M$).</small></p>
    ${rows.length ? `<table class="doc-table"><thead><tr>${H0.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r[0])}</td>${r.slice(1).map(v => `<td>${brl(v)}</td>`).join('')}</tr>`).join('')}<tr><td><strong>Total</strong></td>${T.map(v => `<td><strong>${brl(v)}</strong></td>`).join('')}</tr></tbody></table>` : '<p class="vazio">Sem dados neste ano.</p>'}
    <p class="inv-noprint"><button class="btn-visit" id="cn-c"><i class="fas fa-file-csv"></i> Baixar (CSV)</button> <button class="btn-visit" id="cn-i"><i class="fas fa-print"></i> Imprimir</button></p>`;
    $('#cn-a', el).onchange = e => { ano = Number(e.target.value); draw(); };
    $('#cn-i', el).onclick = () => window.print();
    $('#cn-c', el).onclick = () => { const out = [H0].concat(rows.map(r => [r[0]].concat(r.slice(1).map(v => String(v).replace('.', ','))))).concat([['Total'].concat(T.map(v => String(v).replace('.', ',')))]); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv(out)], { type: 'text/csv;charset=utf-8' })); a.download = `compras-consolidado-${ano}.csv`; a.click(); };
  };

  /* ---------- Estrutura ---------- */
  const SUB = [['ped', 'Pedidos de compra'], ['plano', 'Planejamento anual']].concat(veTudo ? [['cons', 'Consolidado']] : []);
  const draw = () => {
    root.innerHTML = `<div class="tabs sub inv-noprint" role="tablist">${SUB.map(t => `<button class="tab-btn${t[0] === sub ? ' active' : ''}" data-s="${t[0]}">${t[1]}</button>`).join('')}</div><div id="cp-sub"></div>`;
    root.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sub = b.dataset.s; verId = null; novo = false; msg = ''; erro = ''; draw(); });
    const el = $('#cp-sub', root);
    if (sub === 'ped') { if (novo) { const pre = formPedPre; formPedPre = null; formPed(el, pre); } else if (verId) detalhePed(el); else listaPed(el); }
    else if (sub === 'plano') planejamento(el); else consolidado(el);
  };
  draw();
} };
})();
