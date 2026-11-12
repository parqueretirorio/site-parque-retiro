// Campanha Punta de Vacas (área restrita > Comissões Parque Retiro > Campanha Punta de Vacas) + Conciliação bancária por extrato.
//
//  1) A CAMPANHA tem início e fim. Ao salvar as datas, ela vira uma atividade do Parque no calendário (coleção 'ativ', categoria "Campanha"),
//     e por isso aparece nos calendários e na Comunicação (Próximas atividades sem comunicação planejada), para a campanha nas redes sociais.
//  2) A tela da campanha é SÓ DE CONSULTA para quem aportou. Nada é digitado ali. O dinheiro entra de duas formas:
//       a) Prestação de Contas: o lançamento (Entrada) recebe o campo "Campanha";
//       b) Conciliação bancária: o extrato do banco (CSV ou OFX) é importado em Prestação de Contas e cada crédito vira lançamento da campanha.
//  3) Dados: 'campanhas' = [{ id, titulo, inicio, fim, descricao, meta, ativId }]; lançamentos em 'contas' ganham { campanha, concil };
//     'extrato_linhas' = [{ id, data, desc, valor (com sinal), arq, status: 'pendente'|'lancado'|'conciliado'|'ignorado', conta, criou }].
(function () {
const ID_PUNTA = 'punta-de-vacas';
const CAT_CAL = 'Campanha';
const r2 = v => Math.round(v * 100) / 100;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fd = d => d ? String(d).split('-').reverse().join('/') : '';
const hojeIso = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/* ---------- Dados ---------- */
function lista(db) {
  let l = db.get('campanhas', null);
  if (!Array.isArray(l) || !l.length) { l = [{ id: ID_PUNTA, titulo: 'Campanha Punta de Vacas', inicio: '', fim: '', descricao: '', meta: 0, ativId: '' }]; db.set('campanhas', l); }
  return l;
}
const porId = (db, id) => lista(db).find(c => c.id === id) || null;
const aportes = (db, id) => db.get('contas', []).filter(c => c.campanha === id && (c.tipo === 'Entrada' || c.tipo === 'receita'));

// Põe (ou tira) a campanha no calendário do Parque como uma atividade com início e fim.
function sincronizar(db, c) {
  const ativ = db.get('ativ', []), id = c.ativId || ('camp-' + c.id), resto = ativ.filter(a => a.id !== id);
  if (!c.inicio) { if (resto.length !== ativ.length) db.set('ativ', resto); return ''; }
  const fim = c.fim && c.fim > c.inicio ? c.fim : '';
  resto.push({ id, titulo: c.titulo, data: c.inicio, fim, hora: '', categoria: CAT_CAL, local: 'Parque Retiro', descricao: (c.descricao || 'Campanha de arrecadação do Parque Retiro.').slice(0, 300), origem: 'campanha', campanha: c.id, travada: true });
  db.set('ativ', resto); return id;
}
function situacao(c) {
  const h = hojeIso();
  if (!c.inicio) return ['Datas a definir', '#6c7a89'];
  if (h < c.inicio) return ['Ainda não começou', '#d68910'];
  if (c.fim && h > c.fim) return ['Encerrada', '#6c7a89'];
  return ['Em andamento', '#2e8b57'];
}

/* ---------- Tela da campanha (consulta) ---------- */
function abrir(me, root, H) {
  const { db, irPara, tem } = H;
  const pode = tem(me, 'atividades'); // administrador ou Responsável pelas Atividades editam as datas
  let msg = '', erro = '', sel = (lista(db)[0] || {}).id;
  const draw = () => {
    const cs = lista(db), c = cs.find(x => x.id === sel) || cs[0], ap = aportes(db, c.id).sort((a, b) => String(b.data).localeCompare(String(a.data)));
    const total = r2(ap.reduce((t, x) => t + x.valor, 0)), [st, cor] = situacao(c);
    const pess = {}; ap.forEach(x => { const nome = (x.pessoa || '').trim() || '(sem nome)', k = norm(nome), o = pess[k] = pess[k] || { nome, n: 0, v: 0, ult: '' }; o.n++; o.v = r2(o.v + x.valor); if (String(x.data) > o.ult) o.ult = x.data; });
    const pl = Object.values(pess).sort((a, b) => b.v - a.v), max = Math.max(1, ...pl.map(p => p.v));
    const fora = ap.filter(x => c.inicio && (x.data < c.inicio || (c.fim && x.data > c.fim))).length;
    const via = x => x.concil ? '<span title="Veio da conciliação do extrato bancário"><i class="fas fa-university"></i> Extrato bancário</span>' : '<span title="Lançado direto na Prestação de Contas"><i class="fas fa-calculator"></i> Prestação de Contas</span>';
    root.innerHTML = `<style>.cp-card{background:#fff;border:1px solid #d5dde3;border-radius:10px;padding:12px 14px;margin:0 0 14px}.cp-card h4{margin:0 0 8px}.cp-sel{display:inline-block;color:#fff;border-radius:12px;padding:2px 10px;font-size:.8rem}.cp-b{display:grid;grid-template-columns:minmax(110px,220px) 1fr auto;gap:8px;align-items:center;font-size:.85rem;margin:4px 0}.cp-b i{display:block;height:14px;border-radius:5px;background:#d68910}.cp-t{background:#eef2f5;border-radius:5px;overflow:hidden}</style>
    <h3><i class="fas fa-flag"></i> ${esc(c.titulo)} <span class="cp-sel" style="background:${cor}">${esc(st)}</span></h3>
    ${cs.length > 1 ? `<div class="form-row" style="max-width:340px"><label for="cp-s">Campanha</label><select id="cp-s">${cs.map(x => `<option value="${esc(x.id)}"${x.id === c.id ? ' selected' : ''}>${esc(x.titulo)}</option>`).join('')}</select></div>` : ''}
    <p class="tip-box" role="note"><i class="fas fa-eye"></i> Esta tela é <strong>só de consulta</strong>. Os aportes <strong>não são digitados aqui</strong>: entram pela <strong>Prestação de Contas</strong> (campo <em>Campanha</em> no lançamento) ou pela <strong>Conciliação bancária</strong> (importando o extrato do banco, também em Prestação de Contas).${tem(me, 'financeiro') && irPara ? ' <button type="button" class="btn-visit" id="cp-ir" style="margin-left:8px"><i class="fas fa-calculator"></i> Abrir Prestação de Contas</button>' : ''}</p>
    <div class="cp-card"><h4><i class="far fa-calendar-alt"></i> Período da campanha</h4>
      <p>${c.inicio ? `De <strong>${fd(c.inicio)}</strong> ${c.fim ? `até <strong>${fd(c.fim)}</strong>` : '(sem data de término)'}. Está no <strong>calendário do Parque</strong> como a atividade "${esc(c.titulo)}" e, por isso, aparece na <strong>Comunicação</strong> para planejar as publicações nas redes sociais.` : 'Ainda sem datas. Quando o início for informado, a campanha entra sozinha no calendário do Parque como uma atividade.'}</p>
      ${pode ? `<form id="cp-f" class="form-reserva" novalidate>
        <div class="form-row"><label for="cp-i">Início da campanha *</label><input id="cp-i" type="date" value="${esc(c.inicio)}"></div>
        <div class="form-row"><label for="cp-e">Fim da campanha</label><input id="cp-e" type="date" value="${esc(c.fim)}"></div>
        <div class="form-row"><label for="cp-m">Meta de arrecadação (opcional)</label><input id="cp-m" type="number" min="0" step="0.01" value="${c.meta || ''}" placeholder="0,00"></div>
        <div class="form-row"><label for="cp-d">Descrição curta (aparece no calendário)</label><input id="cp-d" maxlength="300" value="${esc(c.descricao)}"></div>
        <p class="form-erro" id="cp-er" role="alert"${erro ? '' : ' hidden'}>${esc(erro)}</p>
        <button class="btn-visit"><i class="fas fa-save"></i> Salvar e colocar no calendário</button></form>` : '<p><small>Só o administrador e o Administrador das Atividades alteram as datas.</small></p>'}
      ${msg ? `<p class="tip-box" role="status"><i class="fas fa-check-circle"></i> ${esc(msg)}</p>` : ''}</div>
    <div class="totais"><div><span>Total aportado</span><strong>${brl(total)}</strong></div><div><span>Pessoas que aportaram</span><strong>${pl.length}</strong></div><div><span>Aportes</span><strong>${ap.length}</strong></div>${c.meta > 0 ? `<div><span>Meta ${brl(c.meta)}</span><strong>${Math.round((total / c.meta) * 1000) / 10}%</strong></div>` : ''}</div>
    ${fora ? `<p class="aviso-local"><i class="fas fa-exclamation-triangle"></i> ${fora} aporte(s) têm data fora do período da campanha. Estão incluídos no total; confira em Prestação de Contas se for o caso.</p>` : ''}
    <div class="cp-card"><h4><i class="fas fa-users"></i> Quem aportou</h4>${pl.length ? `<div>${pl.map(p => `<div class="cp-b"><span title="${esc(p.nome)}">${esc(p.nome)}</span><span class="cp-t"><i style="width:${Math.max(2, (p.v / max) * 100)}%"></i></span><span>${brl(p.v)} <small>(${p.n}x)</small></span></div>`).join('')}</div>` : '<p class="vazio">Ainda não há aportes. Quando um lançamento for ligado a esta campanha (Prestação de Contas ou conciliação do extrato), ele aparece aqui.</p>'}</div>
    <div class="cp-card"><h4><i class="fas fa-list"></i> Todos os aportes</h4>${ap.length ? `<p class="no-print"><button class="btn-visit" id="cp-csv"><i class="fas fa-file-csv"></i> Baixar (CSV)</button></p><div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Data</th><th>Pessoa</th><th>Valor</th><th>Forma</th><th>Como entrou</th><th>Descrição</th></tr></thead><tbody>${ap.map(x => `<tr><td>${fd(x.data)}</td><td>${esc(x.pessoa || '-')}</td><td>${(H.money || brl)(x.valor, x.moeda)}</td><td>${esc((H.MOEDA || {})[x.moeda] || x.moeda || '')}</td><td>${via(x)}</td><td>${esc(x.desc || '')}</td></tr>`).join('')}</tbody><tfoot><tr><th colspan="2">Total</th><th>${brl(total)}</th><th colspan="3"></th></tr></tfoot></table></div>` : '<p class="vazio">Nenhum aporte registrado.</p>'}</div>`;
    const s = root.querySelector('#cp-s'); if (s) s.onchange = e => { sel = e.target.value; msg = ''; erro = ''; draw(); };
    const ir = root.querySelector('#cp-ir'); if (ir) ir.onclick = () => irPara('contas');
    const csvb = root.querySelector('#cp-csv'); if (csvb) csvb.onclick = () => {
      const rows = [['Data', 'Pessoa', 'Valor', 'Forma', 'Como entrou', 'Descrição']].concat(ap.map(x => [fd(x.data), x.pessoa || '', String(x.valor).replace('.', ','), (H.MOEDA || {})[x.moeda] || x.moeda || '', x.concil ? 'Extrato bancário' : 'Prestação de Contas', x.desc || '']));
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + H.csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = 'campanha-' + c.id + '.csv'; a.click();
    };
    const f = root.querySelector('#cp-f'); if (f) f.onsubmit = e => {
      e.preventDefault(); msg = ''; erro = '';
      const ini = root.querySelector('#cp-i').value, fim = root.querySelector('#cp-e').value;
      if (!ini) erro = 'Informe o início da campanha.'; else if (fim && fim < ini) erro = 'O fim não pode ser antes do início.';
      if (erro) { draw(); return; }
      const l = lista(db), x = l.find(z => z.id === c.id);
      x.inicio = ini; x.fim = fim; x.meta = Math.max(0, parseFloat(root.querySelector('#cp-m').value) || 0); x.descricao = root.querySelector('#cp-d').value.trim(); x.ativId = sincronizar(db, x);
      if (!db.set('campanhas', l)) { erro = 'Sem espaço no navegador para salvar.'; draw(); return; }
      msg = 'Campanha salva. Ela já está no calendário do Parque (semanal, mensal, trimestral, semestral e anual) e na Comunicação.'; draw();
    };
  };
  draw();
}

/* ---------- Leitura do extrato (CSV ou OFX) ---------- */
function numero(s) {
  let t = String(s == null ? '' : s).trim(); if (!t) return NaN;
  let neg = /^\(.*\)$/.test(t) || /^-/.test(t) || /-$/.test(t) || /\bD\b$/i.test(t); // (100,00), -100,00, 100,00-, 100,00 D
  t = t.replace(/[^\d.,]/g, '');
  if (t.includes(',') && t.includes('.')) t = t.lastIndexOf(',') > t.lastIndexOf('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  else if (t.includes(',')) t = t.replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  const v = parseFloat(t); return isNaN(v) ? NaN : (neg ? -v : v);
}
function dataIso(s) {
  const t = String(s || '').trim(); let m;
  if ((m = t.match(/^(\d{4})-(\d{2})-(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`;
  if ((m = t.match(/^(\d{4})(\d{2})(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`;            // OFX: 20261103...
  if ((m = t.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/))) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
  return '';
}
function celulas(linha, sep) { // divide uma linha de CSV respeitando aspas
  const o = []; let cur = '', q = false;
  for (let i = 0; i < linha.length; i++) { const ch = linha[i];
    if (q) { if (ch === '"') { if (linha[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true; else if (ch === sep) { o.push(cur); cur = ''; } else cur += ch; }
  o.push(cur); return o.map(x => x.trim());
}
function lerExtrato(txt) {
  const out = [];
  if (/<STMTTRN>/i.test(txt)) { // OFX
    txt.split(/<STMTTRN>/i).slice(1).forEach(b => {
      const g = tag => { const m = b.match(new RegExp('<' + tag + '>([^<\\r\\n]*)', 'i')); return m ? m[1].trim() : ''; };
      const v = numero(g('TRNAMT').replace(',', '.')), d = dataIso(g('DTPOSTED'));
      if (d && !isNaN(v)) out.push({ data: d, desc: (g('MEMO') || g('NAME') || g('FITID')).slice(0, 160), valor: r2(v), fit: g('FITID') });
    });
    return { linhas: out, aviso: out.length ? '' : 'Não encontrei lançamentos neste arquivo OFX.' };
  }
  const ls = txt.split(/\r?\n/).filter(l => l.trim()); if (!ls.length) return { linhas: [], aviso: 'Arquivo vazio.' };
  const cont = ch => ls.slice(0, 15).reduce((n, l) => n + (l.split(ch).length - 1), 0), sep = [';', '\t', ','].map(c => [c, cont(c)]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = ls.map(l => celulas(l, sep));
  let h = rows.findIndex(r => r.some(c => /^data/i.test(norm(c))) && r.some(c => /valor|cr[eé]dito|d[eé]bito|entrada|sa[ií]da/i.test(c)));
  let iD = -1, iV = -1, iC = -1, iB = -1, iT = -1;
  if (h >= 0) { rows[h].forEach((c, i) => { const n = norm(c);
      if (iD < 0 && /^data/.test(n)) iD = i; else if (/^valor/.test(n) && iV < 0) iV = i; else if (/credito|entrada/.test(n) && iC < 0) iC = i; else if (/debito|saida/.test(n) && iB < 0) iB = i;
      else if (/descri|historico|lancamento|memo|detalhe/.test(n) && iT < 0) iT = i; }); h++; }
  else { h = 0; const a = rows.find(r => r.some(c => dataIso(c) && /[\/-]/.test(c))) || []; iD = a.findIndex(c => dataIso(c) && /[\/-]/.test(c)); iV = a.findIndex((c, i) => i !== iD && !isNaN(numero(c)) && /\d[.,]\d{2}\b/.test(c)); iT = a.findIndex((c, i) => i !== iD && i !== iV && /[A-Za-zÀ-ú]{3}/.test(c)); }
  if (iD < 0 || (iV < 0 && iC < 0 && iB < 0)) return { linhas: [], aviso: 'Não reconheci as colunas. O extrato precisa ter ao menos Data e Valor (ou Crédito e Débito). Se for possível, exporte em OFX.' };
  for (let i = h; i < rows.length; i++) { const r = rows[i], d = dataIso(r[iD]); if (!d) continue; let v = NaN;
    if (iV >= 0) v = numero(r[iV]);
    if (isNaN(v) && (iC >= 0 || iB >= 0)) { const c = iC >= 0 ? numero(r[iC]) : NaN, b = iB >= 0 ? numero(r[iB]) : NaN; v = !isNaN(c) && c !== 0 ? Math.abs(c) : (!isNaN(b) && b !== 0 ? -Math.abs(b) : NaN); }
    if (isNaN(v) || v === 0) continue; // linhas de saldo e totais não têm valor de movimento
    out.push({ data: d, desc: (iT >= 0 ? r[iT] : r.filter((c, k) => k !== iD && k !== iV && isNaN(numero(c))).join(' ')).slice(0, 160), valor: r2(v), fit: '' }); }
  return { linhas: out, aviso: out.length ? '' : 'Não encontrei lançamentos neste arquivo.' };
}
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

/* ---------- Conciliação bancária (painel dentro da Prestação de Contas) ---------- */
function conciliacao(el, H, redesenha) {
  if (!el) return;
  const { db, esc: e2, $, uid, hoje, fmtData, MOEDA, CC, me } = H, plano = window.PR_PLANO || { ENTRADAS: [], SAIDAS: [], CENTRO_SUGERIDO: {} };
  const entradas = plano.ENTRADAS.flatMap(g => g.itens), saidas = plano.SAIDAS.flatMap(g => g.itens);
  const camps = lista(db);
  const linhas = () => db.get('extrato_linhas', []);
  const contas = () => db.get('contas', []);
  const aberto = (el.dataset.aberto === '1');
  const pend = linhas().filter(l => l.status === 'pendente').sort((a, b) => a.data.localeCompare(b.data));
  const cont = { p: pend.length, l: linhas().filter(l => l.status === 'lancado').length, c: linhas().filter(l => l.status === 'conciliado').length, i: linhas().filter(l => l.status === 'ignorado').length };
  const candidatas = l => { const t = l.valor > 0 ? 'Entrada' : 'Saída', d0 = new Date(l.data + 'T12:00:00').getTime();
    return contas().filter(c => !c.concil && (c.tipo === t) && Math.abs(Math.abs(l.valor) - c.valor) < 0.005 && Math.abs(new Date(c.data + 'T12:00:00').getTime() - d0) <= 4 * 86400000); };
  const opts = (arr, v) => arr.map(x => `<option${x === v ? ' selected' : ''}>${e2(x)}</option>`).join('');
  const nomeLimpo = d => String(d || '').replace(/^(pix|ted|doc|transf\w*|cr[eé]dito|recebimento|pagamento)\s*(recebido|enviado)?\s*[-:]?\s*/i, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const linhaHtml = l => { const ent = l.valor > 0, cs = candidatas(l), cp = camps;
    return `<tr data-l="${e2(l.id)}"><td>${fmtData(l.data)}</td><td>${e2(l.desc) || '-'}</td><td style="white-space:nowrap;color:${ent ? '#1d6b3f' : '#a31d21'}"><strong>${ent ? '+' : '-'} ${Math.abs(l.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
      <td>${ent ? `<input data-f="p" maxlength="80" value="${e2(nomeLimpo(l.desc))}" aria-label="Pessoa" placeholder="Quem aportou" style="width:100%;min-width:130px"><br><select data-f="c" aria-label="Campanha" style="margin-top:4px"><option value="">Sem campanha</option>${cp.map(c => `<option value="${e2(c.id)}">${e2(c.titulo)}</option>`).join('')}</select><br><select data-f="o" aria-label="Tipo de entrada" style="margin-top:4px">${opts(entradas, 'Doação')}</select>`
        : `<select data-f="o" aria-label="Categoria da saída" style="width:100%"><option value="">Categoria da saída...</option>${opts(saidas, '')}</select><br><select data-f="cc" aria-label="Centro de custo" style="margin-top:4px">${Object.keys(CC).map(k => `<option>${e2(k)}</option>`).join('')}</select>`}</td>
      <td style="white-space:nowrap">${cs.length ? `<div style="margin-bottom:4px"><small>Já lançado? ${cs.map(c => `<button type="button" class="btn-visit" data-a="conc|${e2(c.id)}" style="padding:2px 8px;font-size:.75rem" title="${e2(c.desc || '')}">Conciliar com ${fmtData(c.data)}${c.pessoa ? ' · ' + e2(c.pessoa) : ''}</button>`).join(' ')}</small></div>` : ''}
        <button type="button" class="btn-visit" data-a="lanca"><i class="fas fa-plus"></i> Lançar</button> <button type="button" class="btn-visit" data-a="ign" style="background:#6c7a89">Ignorar</button></td></tr>`; };
  const todasLinhas = linhas().slice().sort((a, b) => b.data.localeCompare(a.data));
  el.innerHTML = `<div class="card" style="margin:18px 0;padding:14px 16px;border:2px solid #c9d2d8;border-radius:10px">
    <h4 style="margin-top:0"><i class="fas fa-university"></i> Conciliação bancária (extrato)</h4>
    <p><small>Importe o extrato do banco (arquivo <strong>OFX</strong> ou <strong>CSV</strong>). Cada crédito pode virar um lançamento de Entrada, inclusive ligado a uma <strong>campanha</strong> (ex.: Punta de Vacas), e cada débito vira uma Saída. Se o lançamento já existe em Prestação de Contas, use <em>Conciliar</em>: nada é lançado em dobro, e importar o mesmo extrato duas vezes não repete linhas.</small></p>
    <div class="form-row" style="max-width:460px"><label for="ex-f">Arquivo do extrato (.ofx ou .csv)</label><input id="ex-f" type="file" accept=".ofx,.csv,.txt"></div>
    <p class="form-erro" id="ex-e" role="alert" hidden></p>
    <p id="ex-r"><small>${cont.p || cont.l || cont.c || cont.i ? `Extrato carregado: <strong>${cont.p}</strong> pendente(s), ${cont.l} lançada(s), ${cont.c} conciliada(s), ${cont.i} ignorada(s).` : 'Nenhum extrato importado ainda.'}</small></p>
    ${pend.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Data</th><th>Descrição no extrato</th><th>Valor</th><th>Como lançar</th><th></th></tr></thead><tbody>${pend.map(linhaHtml).join('')}</tbody></table></div>` : ''}
    ${todasLinhas.length > pend.length ? `<details style="margin-top:10px"${aberto ? ' open' : ''}><summary>Já tratadas (${todasLinhas.length - pend.length}) — clique para ver ou desfazer</summary><table class="doc-table"><thead><tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Situação</th><th></th></tr></thead><tbody>${todasLinhas.filter(l => l.status !== 'pendente').map(l => `<tr data-l="${e2(l.id)}"><td>${fmtData(l.data)}</td><td>${e2(l.desc)}</td><td>${l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td><td>${{ lancado: 'Lançada em Prestação de Contas', conciliado: 'Conciliada com lançamento existente', ignorado: 'Ignorada' }[l.status]}</td><td><button type="button" class="btn-visit" data-a="des" style="padding:2px 8px;font-size:.75rem;background:#a94442">Desfazer</button></td></tr>`).join('')}</tbody></table></details>` : ''}
  </div>`;
  const erro = m => { const x = $('#ex-e', el); x.textContent = m; x.hidden = !m; };
  const grava = (ls, cs) => { if (cs && !db.set('contas', cs)) { erro('Sem espaço no navegador para salvar.'); return false; } if (!db.set('extrato_linhas', ls)) { erro('Sem espaço no navegador para salvar o extrato.'); return false; } return true; };
  $('#ex-f', el).onchange = async ev => {
    const f = ev.target.files[0]; if (!f) return; erro('');
    if (f.size > 2 * 1024 * 1024) return erro('Arquivo maior que 2 MB. Exporte um período menor.');
    const buf = await f.arrayBuffer(); let txt; try { txt = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (x) { txt = new TextDecoder('windows-1252').decode(buf); } // extratos de banco costumam vir em Windows-1252
    const { linhas: novas, aviso } = lerExtrato(txt); if (aviso) return erro(aviso);
    const ls = linhas(), ja = new Set(ls.map(l => l.id)), vistos = {}; let add = 0, rep = 0;
    novas.forEach(n => { const base = hash([n.data, n.valor, n.desc, n.fit].join('|')); vistos[base] = (vistos[base] || 0) + 1; const id = 'x' + base + (vistos[base] > 1 ? '-' + vistos[base] : '');
      if (ja.has(id)) { rep++; return; } ls.push({ id, data: n.data, desc: n.desc, valor: n.valor, arq: f.name, status: 'pendente', conta: '', criou: false }); ja.add(id); add++; });
    if (ls.length > 4000) return erro('Há linhas demais guardadas. Desfaça ou limpe extratos antigos.');
    if (!grava(ls, null)) return; el.dataset.aberto = '0';
    redesenha(); setTimeout(() => { const r = document.querySelector('#ex-r'); if (r) r.innerHTML = `<small><strong>${add}</strong> linha(s) nova(s) importada(s); ${rep} já estavam no sistema e foram ignoradas.</small>`; }, 0);
  };
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    const tr = b.closest('tr'), ls = linhas(), l = ls.find(x => x.id === tr.dataset.l); if (!l) return; const [acao, arg] = b.dataset.a.split('|'), cs = contas();
    const q = f => { const x = tr.querySelector(`[data-f="${f}"]`); return x ? x.value : ''; };
    if (acao === 'ign') { l.status = 'ignorado'; grava(ls) && redesenha(); return; }
    if (acao === 'des') {
      if (l.criou && l.conta) { if (!confirm('Desfazer? O lançamento criado a partir desta linha sai da Prestação de Contas.')) return; if (!grava(ls.map(x => x.id === l.id ? { ...x, status: 'pendente', conta: '', criou: false } : x), cs.filter(c => c.id !== l.conta))) return; }
      else { const c = cs.find(c => c.concil === l.id); if (c) delete c.concil; l.status = 'pendente'; l.conta = ''; if (!grava(ls, cs)) return; }
      el.dataset.aberto = '1'; redesenha(); return;
    }
    if (acao === 'conc') { const c = cs.find(x => x.id === arg); if (!c) return; c.concil = l.id; const camp = q('c'); if (camp && l.valor > 0) { c.campanha = camp; if (!c.pessoa) c.pessoa = q('p').trim(); }
      l.status = 'conciliado'; l.conta = c.id; l.criou = false; grava(ls, cs) && redesenha(); return; }
    const ent = l.valor > 0, org = q('o'), camp = ent ? q('c') : '', pessoa = ent ? q('p').trim() : '';
    if (!ent && !org) return erro('Escolha a categoria da saída antes de lançar.');
    const centro = ent ? (camp ? 'Campanhas' : (plano.CENTRO_SUGERIDO['Entrada|' + org] || 'Manutenção')) : q('cc');
    const novo = { id: uid(), data: l.data, desc: 'Extrato bancário: ' + l.desc, centro, tipo: ent ? 'Entrada' : 'Saída', origem: org, vaquinha: '', pessoa, ref: '', forma: '', valor: Math.abs(l.valor), moeda: 'PIX', comp: '', por: me.nome, em: hoje(), concil: l.id };
    if (camp) novo.campanha = camp;
    cs.push(novo); l.status = 'lancado'; l.conta = novo.id; l.criou = true; grava(ls, cs) && redesenha();
  });
}

window.PR_CAMPANHA = { ID_PUNTA, CAT_CAL, lista, porId, aportes, sincronizar, situacao, abrir, conciliacao, _lerExtrato: lerExtrato };
})();
