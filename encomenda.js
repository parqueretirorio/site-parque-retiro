// Livraria: pré-lançamento de livros e encomendas (pedido antecipado).
// Dados (todos no navegador, chaves pr_*):
//   livraria_itens  -> o livro ganha: pre (true enquanto em pré-lançamento), preData (lançamento previsto), prePreco (preço de pré-venda),
//                      prePrazo (último dia para encomendar, opcional), preResp / preRespNome / preRespAte (responsável TEMPORÁRIO e até quando),
//                      preTexto (frase curta para o convite), lancadoEm / lancEstoque (preenchidos quando o livro é lançado).
//   livraria_enc    -> uma encomenda: codigo, seq (ordem de chegada por livro, nunca reaproveitada), nome, email, whatsapp, qtd, unit, total,
//                      pago {em, forma, por, obs, conta}, entregue {em, por, venda}, cancelado {em, por, motivo}, consent (LGPD).
// Regras decididas pelo Parque: sem limite de encomendas; vale a ordem de chegada; o preço da pré-venda é diferenciado e obrigatório;
// o pagamento antecipado é registrado à mão por enquanto (Asaas ainda não ativado); o convite por e-mail/WhatsApp é GERADO aqui e
// enviado por quem tem a conta (o site não tem servidor de envio).
// Quem faz o quê: o Administrador marca o pré-lançamento e designa o responsável temporário; o responsável vê e trabalha só as
// encomendas do(s) livro(s) dele enquanto a data final não passa. Observação: sem servidor, essa regra vale na tela (ver pendências).
(function () {
const MAXQ = 20;                                    // exemplares por pedido (evita pedido por engano)
const CONSENT = 'Autorizo o Parque Retiro a usar meus dados apenas para tratar desta encomenda (contato, pagamento e entrega) e, se eu marcar a opção abaixo, para avisos de novos lançamentos.';
const r2 = v => Math.round(v * 100) / 100;
const pad = n => String(n).padStart(2, '0');
const hojeLocal = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const brl = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD = iso => /^\d{4}-\d{2}-\d{2}/.test(iso || '') ? iso.slice(0, 10).split('-').reverse().join('/') : '';
const fmtHora = iso => { const d = new Date(iso); return isNaN(d) ? '' : pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const emailOk = e => /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/.test(e || '');
const soDig = s => String(s || '').replace(/\D/g, '');
const getDb = () => (window.PR_DADOS && window.PR_DADOS.db) || {
  get(k, d) { try { const v = localStorage.getItem('pr_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('pr_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};
const waNum = n => { const d = soDig(n); return d.length <= 11 ? '55' + d : d; };

/* ---------- Regras puras ---------- */
const itens = db => db.get('livraria_itens', []);
const encs = db => db.get('livraria_enc', []);
const ativa = e => !e.cancelado;                                       // conta na fila e no total
const aberto = i => !!i && i.pre === true && (!i.prePrazo || hojeLocal() <= i.prePrazo); // aceita encomenda pelo site
const respValido = (i, email) => !!(i && i.preResp && email && i.preResp === email && (!i.preRespAte || hojeLocal() <= i.preRespAte));
const situacao = e => e.cancelado ? 'Cancelada' : e.entregue ? 'Entregue' : e.pago ? 'Paga' : 'Pedido';
const doLivro = (db, id) => encs(db).filter(e => e.livro === id).sort((a, b) => (a.seq || 0) - (b.seq || 0));
// Livros que o responsável (não administrador) pode trabalhar agora.
const responsavelDe = (me, db) => itens(db || getDb()).filter(i => respValido(i, me && me.email));
// Cobertura depois do lançamento: quem chegou primeiro é atendido primeiro com o estoque recebido.
function cobertura(item, lista) {
  const out = {}; if (item.pre || item.lancEstoque == null) return out;
  let acum = 0;
  lista.filter(ativa).forEach(e => { const antes = acum; acum += e.qtd; out[e.id] = acum <= item.lancEstoque ? 'total' : antes >= item.lancEstoque ? 'espera' : 'parcial'; });
  return out;
}
const link = id => { const base = location.protocol.startsWith('http') ? new URL('.', document.baseURI).href : ''; return base + 'encomenda.html?livro=' + encodeURIComponent(id); };
function textoWhats(i) {
  const l = [`Pré-lançamento: "${i.titulo}"${i.autor ? ' de ' + i.autor : ''}.`];
  if (i.preTexto) l.push(i.preTexto);
  l.push(`Encomende antes do lançamento, por ordem de chegada, com o preço de pré-venda de ${brl(i.prePreco)}${i.preco > 0 ? ' (depois do lançamento: ' + brl(i.preco) + ')' : ''}.`);
  l.push('Lançamento previsto: ' + fmtD(i.preData) + (i.prePrazo ? '. Encomendas até ' + fmtD(i.prePrazo) + '.' : '.'));
  l.push('Para encomendar: ' + link(i.id));
  l.push('Parque de Estudo e Reflexão Retiro. Se você não quer receber avisos de lançamentos, responda "sair".');
  return l.join('\n');
}
function textoEmail(i) {
  const p = [];
  p.push(`Estamos preparando o lançamento de "${i.titulo}"${i.autor ? ', de ' + i.autor : ''}, previsto para ${fmtD(i.preData)}.`);
  if (i.preTexto) p.push(i.preTexto);
  p.push(`Quem encomendar agora paga o preço de pré-venda de ${brl(i.prePreco)}${i.preco > 0 ? ' (depois do lançamento: ' + brl(i.preco) + ')' : ''}. As encomendas são atendidas por ordem de chegada${i.prePrazo ? ' e vão até ' + fmtD(i.prePrazo) : ''}.`);
  return p.join('\n\n');
}

/* ---------- Operações (usadas pelo painel e pela página pública) ---------- */
function api(db) {
  const cod = () => { const usados = new Set(encs(db).map(e => e.codigo)); let c; do { c = 'E' + Array.from(crypto.getRandomValues(new Uint8Array(4))).map(b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join(''); } while (usados.has(c)); return c; };
  const lancaConta = (e, forma) => {
    const cs = db.get('contas', []), id = uid();
    cs.push({ id, data: hojeLocal(), desc: `Encomenda de livro: ${e.titulo} (${e.qtd}x) - ${e.codigo}`, centro: 'Livraria e Lojinha', tipo: 'Entrada', origem: 'Livraria', vaquinha: '', valor: e.total, moeda: forma, comp: '' });
    return db.set('contas', cs) ? id : '';
  };
  const salva = l => db.set('livraria_enc', l);
  function encomendar(d) {
    const it = itens(db).find(x => x.id === d.livro);
    if (!it || !it.pre) return { erro: 'Este livro não está em pré-lançamento.' };
    if (!d.manual && !aberto(it)) return { erro: 'As encomendas deste livro foram encerradas.' };
    const nome = String(d.nome || '').trim().slice(0, 120), email = String(d.email || '').trim().toLowerCase(), wa = soDig(d.whatsapp), qtd = parseInt(d.qtd, 10);
    if (nome.length < 2) return { erro: 'Informe o seu nome.' };
    if (!(qtd >= 1 && qtd <= MAXQ)) return { erro: 'Escolha de 1 a ' + MAXQ + ' exemplares.' };
    if (email && !emailOk(email)) return { erro: 'O e-mail parece incompleto.' };
    if (wa && (wa.length < 10 || wa.length > 13)) return { erro: 'O WhatsApp precisa ter DDD e número (10 a 13 dígitos).' };
    if (!email && !wa) return { erro: 'Informe o e-mail ou o WhatsApp para o Parque falar com você.' };
    if (!d.consent) return { erro: d.manual ? 'Confirme que a pessoa autorizou o contato.' : 'Marque a autorização de uso dos dados para enviar a encomenda.' };
    const l = encs(db), seq = Math.max(0, ...l.filter(e => e.livro === it.id).map(e => e.seq || 0)) + 1;
    const e = { id: uid(), codigo: cod(), seq, livro: it.id, titulo: it.titulo, nome, email, whatsapp: wa, qtd, unit: r2(Number(it.prePreco) || 0), total: r2(qtd * (Number(it.prePreco) || 0)), origem: d.manual ? 'manual' : 'publica', criadoEm: new Date().toISOString(), consent: true, consentTexto: CONSENT, por: d.por || '', pago: null, entregue: null, cancelado: null };
    l.push(e);
    if (!salva(l)) return { erro: 'Não foi possível salvar a encomenda neste navegador.' };
    return { enc: e };
  }
  const acha = id => { const l = encs(db); return { l, e: l.find(x => x.id === id) }; };
  function pagar(id, forma, obs, por, adm) {
    const { l, e } = acha(id); if (!e) return 'Encomenda não encontrada.';
    if (e.cancelado) return 'Esta encomenda está cancelada.'; if (e.pago) return 'O pagamento já foi registrado.';
    e.pago = { em: hojeLocal(), forma, obs: String(obs || '').slice(0, 160), por, conta: '' };
    if (adm) { e.pago.conta = lancaConta(e, forma); if (!e.pago.conta) return 'Não foi possível lançar em Prestação de Contas.'; }
    return salva(l) ? '' : 'Não foi possível salvar.';
  }
  function lancarConta(id) {
    const { l, e } = acha(id); if (!e || !e.pago || e.pago.conta) return 'Nada a lançar.';
    e.pago.conta = lancaConta(e, e.pago.forma); if (!e.pago.conta) return 'Não foi possível lançar em Prestação de Contas.';
    if (e.entregue) { const vs = db.get('livraria_vendas', []), v = vs.find(x => x.id === e.entregue.venda); if (v) { v.conta = e.pago.conta; db.set('livraria_vendas', vs); } }
    return salva(l) ? '' : 'Não foi possível salvar.';
  }
  function desfazerPagamento(id, adm) {
    const { l, e } = acha(id); if (!e || !e.pago) return 'Nada a desfazer.';
    if (e.entregue) return 'A encomenda já foi entregue. Estorne a venda em Vendas e relatório primeiro.';
    if (e.pago.conta) { if (!adm) return 'Este pagamento já foi lançado em Prestação de Contas. Peça ao Administrador.'; db.set('contas', db.get('contas', []).filter(c => c.id !== e.pago.conta)); }
    e.pago = null; return salva(l) ? '' : 'Não foi possível salvar.';
  }
  function entregar(id, por) {
    const { l, e } = acha(id); if (!e) return 'Encomenda não encontrada.';
    const is = itens(db), it = is.find(x => x.id === e.livro);
    if (!it) return 'Livro não encontrado.'; if (it.pre) return 'O livro ainda está em pré-lançamento. Lance o livro (informe o estoque recebido) antes de entregar.';
    if (e.cancelado || e.entregue) return 'Esta encomenda não pode ser entregue.'; if (!e.pago) return 'Registre o pagamento antes de entregar.';
    if (it.estoque < e.qtd) return 'Estoque insuficiente: há ' + it.estoque + ' exemplar(es) e a encomenda pede ' + e.qtd + '.';
    it.estoque -= e.qtd;
    const vs = db.get('livraria_vendas', []), v = { id: uid(), item: it.id, titulo: it.titulo, qtd: e.qtd, unit: e.unit, total: e.total, moeda: e.pago.forma, data: hojeLocal(), comprador: e.nome, por, conta: e.pago.conta || '', enc: e.id };
    vs.push(v); e.entregue = { em: hojeLocal(), por, venda: v.id };
    if (!db.set('livraria_vendas', vs) || !db.set('livraria_itens', is) || !salva(l)) return 'Não foi possível salvar a entrega.';
    return '';
  }
  function cancelar(id, motivo, por) {
    const { l, e } = acha(id); if (!e) return 'Encomenda não encontrada.';
    if (e.entregue) return 'Já entregue: use o estorno da venda.'; if (e.pago) return 'Há pagamento registrado. Desfaça o pagamento antes de cancelar.';
    if (e.cancelado) return ''; e.cancelado = { em: hojeLocal(), por, motivo: String(motivo || '').slice(0, 160) };
    return salva(l) ? '' : 'Não foi possível salvar.';
  }
  function reativar(id) { const { l, e } = acha(id); if (!e || !e.cancelado) return ''; e.cancelado = null; return salva(l) ? '' : 'Não foi possível salvar.'; }
  function lancarLivro(id, estoque) {
    const is = itens(db), it = is.find(x => x.id === id); if (!it || !it.pre) return 'Este livro não está em pré-lançamento.';
    if (!(estoque >= 0 && Number.isInteger(estoque))) return 'Informe o estoque recebido (número inteiro, 0 ou mais).';
    it.pre = false; it.lancadoEm = hojeLocal(); it.lancEstoque = estoque; it.estoque = estoque;
    return db.set('livraria_itens', is) ? '' : 'Não foi possível salvar.';
  }
  // Quando a venda de uma encomenda é estornada em "Vendas e relatório": a encomenda volta a "paga" (ou "pedido", se o lançamento foi removido).
  function aoEstornarVenda(vendaId, contaRemovida) {
    const l = encs(db), e = l.find(x => x.entregue && x.entregue.venda === vendaId); if (!e) return;
    e.entregue = null; if (contaRemovida && e.pago) e.pago.conta = '';
    salva(l);
  }
  return { encomendar, pagar, lancarConta, desfazerPagamento, entregar, cancelar, reativar, lancarLivro, aoEstornarVenda };
}

/* ---------- Painel (área restrita) ---------- */
function painel(me, root, H) {
  const db = H.db, A = api(db), adm = H.NIV[me.nivel] >= 4, $ = (s, r) => (r || root).querySelector(s);
  const meus = () => adm ? itens(db).filter(i => i.pre || encs(db).some(e => e.livro === i.id)) : responsavelDe(me, db);
  let sel = '', msg = '', erro = '', fase = '', payId = '';
  const aviso = () => (msg ? `<p class="tip-box" role="status">${esc(msg)}</p>` : '') + (erro ? `<p class="form-erro" role="alert">${esc(erro)}</p>` : '');
  const fail = t => { erro = t; msg = ''; draw(); };
  const ok = t => { msg = t; erro = ''; fase = ''; payId = ''; draw(); };
  const resumo = i => { const l = doLivro(db, i.id), a = l.filter(ativa); return { n: a.length, ex: a.reduce((t, e) => t + e.qtd, 0), pagos: a.filter(e => e.pago).length, ent: a.filter(e => e.entregue).length, total: r2(a.reduce((t, e) => t + e.total, 0)) }; };

  function lista() {
    const ls = meus();
    return `<h4>Livros</h4>` + (ls.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Livro</th><th>Situação</th><th>Responsável temporário</th><th>Encomendas</th><th></th></tr></thead><tbody>${ls.map(i => {
      const r = resumo(i);
      return `<tr><td>${esc(i.titulo)}${i.autor ? '<br><small>' + esc(i.autor) + '</small>' : ''}</td><td>${i.pre ? `<span class="badge st-pendente">Pré-lançamento</span><br><small>Lançamento previsto: ${esc(fmtD(i.preData))}${i.prePrazo ? '<br>Encomendas até ' + esc(fmtD(i.prePrazo)) : ''}</small>` : `<span class="badge-disponivel">Lançado${i.lancadoEm ? ' em ' + esc(fmtD(i.lancadoEm)) : ''}</span>`}</td><td>${i.preResp ? esc(i.preRespNome || i.preResp) + (i.preRespAte ? '<br><small>até ' + esc(fmtD(i.preRespAte)) + '</small>' : '') : '<small>não definido</small>'}</td><td>${r.n} pedido(s)<br><small>${r.ex} exemplar(es) · ${brl(r.total)}</small></td><td><button class="btn-visit" data-abre="${esc(i.id)}">Abrir</button></td></tr>`;
    }).join('')}</tbody></table></div>` : `<p class="vazio">${adm ? 'Nenhum livro em pré-lançamento. Marque a opção "Pré-lançamento" ao cadastrar o livro, na aba Catálogo e estoque.' : 'Você não é responsável por nenhum livro neste momento.'}</p>`);
  }

  function detalhe(i) {
    const l = doLivro(db, i.id), cob = cobertura(i, l), r = resumo(i), lancavel = i.pre;
    const contato = e => [e.email ? `<a href="mailto:${esc(e.email)}">${esc(e.email)}</a>` : '', e.whatsapp ? `<a href="https://wa.me/${waNum(e.whatsapp)}" target="_blank" rel="noopener">WhatsApp ${esc(e.whatsapp)}</a>` : ''].filter(Boolean).join('<br>');
    const cobTxt = e => ({ total: '<span class="badge-disponivel">Coberta pelo estoque</span>', parcial: '<span class="badge st-pendente">Parcial</span>', espera: '<span class="badge-emprestado">Lista de espera</span>' }[cob[e.id]] || '<small>—</small>');
    const sit = e => { const s = situacao(e); return `<span class="${s === 'Cancelada' ? 'badge-emprestado' : s === 'Pedido' ? 'badge st-pendente' : 'badge-disponivel'}">${s}</span>${e.pago && !e.pago.conta ? '<br><small>lançamento pendente</small>' : ''}`; };
    const acoes = e => {
      if (e.cancelado) return `<button class="btn-visit" data-re="${e.id}">Reativar</button>`;
      const b = [];
      if (!e.pago) b.push(`<button class="btn-visit" data-pg="${e.id}">Registrar pagamento</button>`);
      else if (!e.entregue) { b.push(`<button class="btn-visit" data-en="${e.id}"${i.pre ? ' disabled title="Lance o livro antes de entregar"' : ''}>Entregar</button>`); b.push(`<button class="icon-btn" data-dp="${e.id}" title="Desfazer pagamento" aria-label="Desfazer pagamento de ${esc(e.nome)}"><i class="fas fa-undo"></i></button>`); }
      if (e.pago && !e.pago.conta && adm) b.push(`<button class="btn-visit" data-lc="${e.id}">Lançar em Contas</button>`);
      if (!e.pago && !e.entregue) b.push(`<button class="icon-btn" data-cn="${e.id}" title="Cancelar" aria-label="Cancelar encomenda de ${esc(e.nome)}"><i class="fas fa-times"></i></button>`);
      return b.join(' ');
    };
    const pagForm = () => { const e = encs(db).find(x => x.id === payId); return e ? `<form id="pg-f" class="form-reserva" novalidate><h4>Pagamento da encomenda ${esc(e.codigo)} (${esc(e.nome)}, ${brl(e.total)})</h4>
      <div class="form-row"><label for="pg-m">Forma de pagamento *</label><select id="pg-m">${Object.entries(H.MOEDA).map(([k, t]) => `<option value="${k}">${esc(t)}</option>`).join('')}</select></div>
      <div class="form-row"><label for="pg-o">Observação (ex.: comprovante conferido)</label><input id="pg-o" maxlength="160"></div>
      <p class="vazio">${adm ? 'A entrada será lançada em Prestação de Contas (centro Livraria e Lojinha).' : 'O lançamento em Prestação de Contas será feito pelo Administrador.'} O pagamento online (Asaas) ainda não está ativado: o recebimento é conferido à mão.</p>
      <button class="btn-visit btn-large" id="pg-ok">Confirmar pagamento</button> <button type="button" class="btn-visit" id="pg-x" style="background:#6c7a7b">Fechar</button></form>` : ''; };
    const manual = () => `<form id="mn-f" class="form-reserva" novalidate><h4>Registrar encomenda recebida por outro canal</h4>
      <div class="form-row"><label for="mn-n">Nome *</label><input id="mn-n" maxlength="120"></div>
      <div class="form-row"><label for="mn-e">E-mail</label><input id="mn-e" type="email" maxlength="160"></div>
      <div class="form-row"><label for="mn-w">WhatsApp (com DDD)</label><input id="mn-w" inputmode="tel" maxlength="20"></div>
      <div class="form-row"><label for="mn-q">Exemplares *</label><input id="mn-q" type="number" min="1" max="${MAXQ}" value="1"></div>
      <div class="form-row"><label><input type="checkbox" id="mn-c"> A pessoa autorizou o contato para tratar desta encomenda *</label></div>
      <p class="form-erro" id="mn-er" role="alert" hidden></p>
      <button class="btn-visit btn-large">Registrar na fila</button> <button type="button" class="btn-visit" id="mn-x" style="background:#6c7a7b">Fechar</button></form>`;
    return `<h3><i class="fas fa-bookmark"></i> ${esc(i.titulo)}</h3>
      <p><button class="btn-visit" id="vl" style="background:#6c7a7b"><i class="fas fa-arrow-left"></i> Voltar aos livros</button></p>
      <div class="totais"><div><span>Pedidos ativos</span><strong>${r.n}</strong></div><div><span>Exemplares encomendados</span><strong>${r.ex}</strong></div><div><span>Pagos</span><strong>${r.pagos}</strong></div><div><span>Entregues</span><strong>${r.ent}</strong></div><div><span>Total encomendado</span><strong>${brl(r.total)}</strong></div>${i.pre ? '' : `<div><span>Estoque recebido no lançamento</span><strong>${i.lancEstoque != null ? i.lancEstoque : '-'}</strong></div><div><span>Estoque agora</span><strong>${i.estoque}</strong></div>`}</div>
      <p>${i.pre ? `Preço de pré-venda: <strong>${brl(i.prePreco)}</strong> · lançamento previsto ${esc(fmtD(i.preData))}${i.prePrazo ? ' · encomendas pelo site até ' + esc(fmtD(i.prePrazo)) : ''}.` : `Livro lançado. As encomendas mantêm o preço de pré-venda (${brl(i.prePreco)}); valem a ordem de chegada.`}</p>
      <p><button class="btn-visit" id="cv"><i class="fas fa-paper-plane"></i> Gerar convite (e-mail e WhatsApp)</button> <button class="btn-visit" id="cl"><i class="fas fa-link"></i> Copiar link de compra antecipada</button> <button class="btn-visit" id="mn"><i class="fas fa-plus-circle"></i> Registrar encomenda</button> <button class="btn-visit" id="csv"><i class="fas fa-file-csv"></i> Baixar (CSV)</button> <button class="btn-visit" id="imp"><i class="fas fa-print"></i> Imprimir</button>${lancavel ? ' <button class="btn-visit" id="lv"><i class="fas fa-rocket"></i> Lançar o livro</button>' : ''}</p>
      ${aviso()}<div id="cv-box"></div>${fase === 'manual' ? manual() : ''}${fase === 'lancar' ? `<form id="lv-f" class="form-reserva" novalidate><h4>Lançar o livro</h4><p>Informe quantos exemplares chegaram. O livro sai do pré-lançamento, entra no estoque da Livraria e as encomendas são atendidas por ordem de chegada. Nada é enviado às pessoas automaticamente.</p><div class="form-row"><label for="lv-e">Exemplares recebidos *</label><input id="lv-e" type="number" min="0" max="9999" step="1"></div><p class="form-erro" id="lv-er" role="alert" hidden></p><button class="btn-visit btn-large">Confirmar lançamento</button> <button type="button" class="btn-visit" id="lv-x" style="background:#6c7a7b">Fechar</button></form>` : ''}${pagForm()}
      <h4>Fila de encomendas (ordem de chegada)</h4>${l.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Fila</th><th>Código</th><th>Recebida</th><th>Pessoa</th><th>Qtd</th><th>Total</th><th>Situação</th>${i.pre ? '' : '<th>Estoque</th>'}<th></th></tr></thead><tbody>${l.map(e => `<tr${e.cancelado ? ' style="opacity:.6"' : ''}><td>${e.seq}</td><td>${esc(e.codigo)}${e.origem === 'manual' ? '<br><small>registrada à mão</small>' : ''}</td><td>${esc(fmtHora(e.criadoEm))}</td><td>${esc(e.nome)}<br><small>${contato(e)}</small></td><td>${e.qtd}</td><td>${brl(e.total)}${e.pago ? `<br><small>${esc(H.MOEDA[e.pago.forma] || e.pago.forma)}</small>` : ''}</td><td>${sit(e)}</td>${i.pre ? '' : `<td>${cobTxt(e)}</td>`}<td>${acoes(e)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="vazio">Nenhuma encomenda ainda. Gere o convite e envie para as listas.</p>'}
      <p class="vazio">O pagamento online (Asaas) ainda não está ativado. Pedidos feitos pela página pública ficam neste navegador; sem servidor, quem encomenda recebe um botão para enviar a confirmação por WhatsApp ou e-mail, e você pode registrar o pedido aqui. Vale a ordem de chegada; não há limite de encomendas.</p>`;
  }

  function convite(i) {
    const box = $('#cv-box'), lk = link(i.id), tw = textoWhats(i);
    box.innerHTML = `<div class="card" style="margin:12px 0;padding:14px"><h4>Convite de compra antecipada</h4>
      <p class="vazio">O site não envia mensagens sozinho. Revise o texto e envie você mesmo: pelo WhatsApp (grupo ou lista de transmissão de pessoas que aceitaram receber) e pelo e-mail (listas existentes ou "Interessados em lançamentos"). ${location.protocol.startsWith('http') ? '' : '<strong>Atenção:</strong> o link só será completo depois que o site estiver publicado.'}</p>
      <div class="form-row"><label for="cv-l">Link de compra antecipada</label><input id="cv-l" readonly value="${esc(lk)}"></div>
      <div class="form-row"><label for="cv-w">Texto para o WhatsApp</label><textarea id="cv-w" rows="9">${esc(tw)}</textarea></div>
      <p><button class="btn-visit" id="cv-cw"><i class="fas fa-copy"></i> Copiar texto</button> <a class="btn-visit" id="cv-aw" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(tw)}"><i class="fab fa-whatsapp"></i> Abrir no WhatsApp</a> <button class="btn-visit" id="cv-em"><i class="fas fa-envelope-open-text"></i> Gerar e-mail</button></p>
      <p class="tip-box" id="cv-m" role="status" hidden></p></div>`;
    const m = t => { const x = $('#cv-m'); x.textContent = t; x.hidden = false; };
    const copia = (t, ok) => { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => m(ok), () => { const a = $('#cv-w'); a.select(); m('Selecione e copie o texto (Ctrl+C).'); }); };
    $('#cv-w').oninput = () => { $('#cv-aw').href = 'https://wa.me/?text=' + encodeURIComponent($('#cv-w').value); };
    $('#cv-cw').onclick = () => copia($('#cv-w').value, 'Texto copiado. Cole no WhatsApp.');
    $('#cv-em').onclick = () => {
      if (!window.PR_EMAILMKT) return m('O módulo de e-mail (emailmkt.js) não foi carregado.');
      window.PR_EMAILMKT.abrirGerador(me, { origem: 'Livraria', pre: { assunto: 'Pré-lançamento: ' + i.titulo, titulo: 'Pré-lançamento: ' + i.titulo, texto: textoEmail(i), botao: 'Encomendar com preço de pré-venda', link: lk } });
    };
  }

  function draw() {
    const i = sel && itens(db).find(x => x.id === sel);
    if (sel && (!i || !meus().some(x => x.id === i.id))) sel = '';
    root.innerHTML = `<div id="enc-p">` + (sel ? detalhe(itens(db).find(x => x.id === sel)) : `<h3><i class="fas fa-bookmark"></i> Pré-lançamento e encomendas de livros</h3>
      <p>Livros marcados como pré-lançamento no cadastro da Livraria. As pessoas encomendam pelo link de compra antecipada, sem limite e por ordem de chegada, com o preço de pré-venda.</p>${aviso()}${lista()}`) + `</div>`;
    if (!sel) { root.querySelectorAll('[data-abre]').forEach(b => b.onclick = () => { sel = b.dataset.abre; msg = erro = fase = payId = ''; draw(); }); return; }
    const it = itens(db).find(x => x.id === sel), dados = () => ({ por: me.nome });
    $('#vl').onclick = () => { sel = ''; msg = erro = fase = payId = ''; draw(); };
    $('#cv').onclick = () => convite(it);
    $('#cl').onclick = () => { const t = link(it.id); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => ok('Link copiado: ' + t), () => ok('Link: ' + t)); };
    $('#mn').onclick = () => { fase = fase === 'manual' ? '' : 'manual'; draw(); };
    $('#imp').onclick = () => window.print();
    $('#csv').onclick = () => {
      const l = doLivro(db, it.id), rows = [['Fila', 'Código', 'Recebida', 'Nome', 'E-mail', 'WhatsApp', 'Quantidade', 'Preço unitário', 'Total', 'Situação', 'Forma de pagamento', 'Origem', 'Autorizou contato']].concat(l.map(e => [e.seq, e.codigo, fmtHora(e.criadoEm), e.nome, e.email, e.whatsapp, e.qtd, e.unit, e.total, situacao(e), e.pago ? H.MOEDA[e.pago.forma] || e.pago.forma : '', e.origem, e.consent ? 'Sim' : 'Não']));
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + H.csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = 'encomendas-' + (it.titulo || 'livro').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '.csv'; a.click();
    };
    const lv = $('#lv'); if (lv) lv.onclick = () => { fase = 'lancar'; draw(); };
    const f1 = $('#mn-f'); if (f1) {
      $('#mn-x').onclick = () => { fase = ''; draw(); };
      f1.onsubmit = e => { e.preventDefault(); const r = A.encomendar({ livro: it.id, nome: $('#mn-n').value, email: $('#mn-e').value, whatsapp: $('#mn-w').value, qtd: $('#mn-q').value, consent: $('#mn-c').checked, manual: true, por: me.nome }); const er = $('#mn-er'); if (r.erro) { er.textContent = r.erro; er.hidden = false; return; } ok('Encomenda ' + r.enc.codigo + ' registrada na fila, posição ' + r.enc.seq + '.'); };
    }
    const f2 = $('#lv-f'); if (f2) {
      $('#lv-x').onclick = () => { fase = ''; draw(); };
      f2.onsubmit = e => { e.preventDefault(); const t = $('#lv-e').value, r = A.lancarLivro(it.id, t === '' ? NaN : Number(t)); if (r) { const er = $('#lv-er'); er.textContent = r; er.hidden = false; return; } ok('Livro lançado. As encomendas seguem a ordem de chegada.'); };
    }
    const f3 = $('#pg-f'); if (f3) {
      $('#pg-x').onclick = () => { payId = ''; draw(); };
      f3.onsubmit = e => { e.preventDefault(); const r = A.pagar(payId, $('#pg-m').value, $('#pg-o').value, me.nome, adm); r ? fail(r) : ok('Pagamento registrado.'); };
    }
    root.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => { payId = b.dataset.pg; fase = ''; draw(); const f = $('#pg-f'); if (f && f.scrollIntoView) f.scrollIntoView(); });
    root.querySelectorAll('[data-en]').forEach(b => b.onclick = () => { const r = A.entregar(b.dataset.en, me.nome); r ? fail(r) : ok('Entrega registrada: o estoque foi baixado e a venda aparece em Vendas e relatório.'); });
    root.querySelectorAll('[data-lc]').forEach(b => b.onclick = () => { const r = A.lancarConta(b.dataset.lc); r ? fail(r) : ok('Lançado em Prestação de Contas.'); });
    root.querySelectorAll('[data-dp]').forEach(b => b.onclick = () => { if (!confirm('Desfazer o pagamento desta encomenda?')) return; const r = A.desfazerPagamento(b.dataset.dp, adm); r ? fail(r) : ok('Pagamento desfeito.'); });
    root.querySelectorAll('[data-cn]').forEach(b => b.onclick = () => { const mo = prompt('Motivo do cancelamento (opcional):', ''); if (mo === null) return; const r = A.cancelar(b.dataset.cn, mo, me.nome); r ? fail(r) : ok('Encomenda cancelada. A posição na fila é mantida no histórico.'); });
    root.querySelectorAll('[data-re]').forEach(b => b.onclick = () => { const r = A.reativar(b.dataset.re); r ? fail(r) : ok('Encomenda reativada na posição original da fila.'); });
  }
  draw();
}

/* ---------- Páginas públicas (livraria.html e encomenda.html) ---------- */
function publica() {
  const db = getDb();
  const lst = document.getElementById('prelanc-lista');
  if (lst) {
    const ps = itens(db).filter(aberto);
    lst.innerHTML = ps.length ? `<h3 class="subsection-title">Pré-lançamentos: encomende com preço de pré-venda</h3><div class="content-grid">${ps.map(i => `<div class="card"><h3><i class="fas fa-book-open"></i> ${esc(i.titulo)}</h3>${i.autor ? `<p><small>${esc(i.autor)}</small></p>` : ''}${i.preTexto ? `<p>${esc(i.preTexto)}</p>` : ''}<p>Lançamento previsto: <strong>${esc(fmtD(i.preData))}</strong></p><p class="loja-preco">${brl(i.prePreco)}</p><a class="btn-visit" href="encomenda.html?livro=${encodeURIComponent(i.id)}">Encomendar</a></div>`).join('')}</div>` : '';
  }
  const el = document.getElementById('encomenda-pub'); if (!el) return;
  const id = new URLSearchParams(location.search).get('livro') || '', it = itens(db).find(x => x.id === id);
  const outros = itens(db).filter(aberto);
  const lista = () => outros.length ? `<p>Livros em pré-lançamento agora:</p><ul>${outros.map(i => `<li><a href="encomenda.html?livro=${encodeURIComponent(i.id)}">${esc(i.titulo)}</a></li>`).join('')}</ul>` : '';
  if (!it || !it.pre) { el.innerHTML = `<p class="tip-box" role="status">${it ? 'Este livro já foi lançado. Veja como adquirir na <a href="livraria.html">Livraria</a>.' : 'Não encontramos o livro deste link.'}</p>${lista()}<p><a href="livraria.html">Voltar à Livraria</a></p>`; return; }
  if (!aberto(it)) { el.innerHTML = `<h2>${esc(it.titulo)}</h2><p class="tip-box" role="status">As encomendas com preço de pré-venda foram encerradas em ${esc(fmtD(it.prePrazo))}. Fale com o Parque pela <a href="livraria.html">Livraria</a>.</p>`; return; }
  const A = api(db);
  el.innerHTML = `<div class="card"><h2>${esc(it.titulo)}</h2>${it.autor ? `<p>${esc(it.autor)}</p>` : ''}${it.preTexto ? `<p>${esc(it.preTexto)}</p>` : ''}
    <p>Preço de pré-venda: <strong class="loja-preco">${brl(it.prePreco)}</strong>${it.preco > 0 ? ` <small>(depois do lançamento: ${brl(it.preco)})</small>` : ''}</p>
    <p>Lançamento previsto: <strong>${esc(fmtD(it.preData))}</strong>${it.prePrazo ? ` · encomendas até <strong>${esc(fmtD(it.prePrazo))}</strong>` : ''}</p>
    <p class="vazio">Não há limite de encomendas. Os pedidos são atendidos por ordem de chegada. Nenhum valor é cobrado por este formulário: o Parque entra em contato para combinar o pagamento (o pagamento online será habilitado em breve).</p></div>
    <form id="en-f" class="form-reserva" novalidate>
      <div class="form-row"><label for="en-n">Nome *</label><input id="en-n" maxlength="120" autocomplete="name"></div>
      <div class="form-row"><label for="en-e">E-mail</label><input id="en-e" type="email" maxlength="160" autocomplete="email"></div>
      <div class="form-row"><label for="en-w">WhatsApp (com DDD)</label><input id="en-w" inputmode="tel" maxlength="20" autocomplete="tel" placeholder="21 99999-9999"><small>Informe o e-mail, o WhatsApp ou os dois.</small></div>
      <div class="form-row"><label for="en-q">Quantos exemplares? *</label><input id="en-q" type="number" min="1" max="${MAXQ}" value="1"></div>
      <div style="position:absolute;left:-9999px" aria-hidden="true"><label>Não preencha<input id="en-hp" tabindex="-1" autocomplete="off"></label></div>
      <p id="en-tot" aria-live="polite"><strong></strong></p>
      <div class="form-row"><label><input type="checkbox" id="en-c"> ${esc(CONSENT)} *</label></div>
      <div class="form-row"><label><input type="checkbox" id="en-nl"> Quero receber por e-mail avisos de novos lançamentos de livros (opcional; posso sair a qualquer momento).</label></div>
      <p class="form-erro" id="en-er" role="alert" hidden></p>
      <button class="btn-visit btn-large"><i class="fas fa-check"></i> Fazer minha encomenda</button></form>`;
  const tot = () => { const q = parseInt(document.getElementById('en-q').value, 10); document.querySelector('#en-tot strong').textContent = q >= 1 ? 'Total: ' + brl(r2(q * it.prePreco)) : ''; };
  document.getElementById('en-q').oninput = tot; tot();
  document.getElementById('en-f').onsubmit = ev => {
    ev.preventDefault(); const er = document.getElementById('en-er'); er.hidden = true;
    if (document.getElementById('en-hp').value) return;
    const v = i => document.getElementById(i).value;
    const r = A.encomendar({ livro: it.id, nome: v('en-n'), email: v('en-e'), whatsapp: v('en-w'), qtd: v('en-q'), consent: document.getElementById('en-c').checked });
    if (r.erro) { er.textContent = r.erro; er.hidden = false; return; }
    const e = r.enc;
    if (document.getElementById('en-nl').checked && e.email && window.PR_EMAILMKT) window.PR_EMAILMKT.adicionar('lancamentos', e.email, e.nome, 'encomenda');
    const num = (window.PR_WHATSAPP && window.PR_WHATSAPP.numero) || '552128881830';
    const txt = `Olá! Fiz a encomenda ${e.codigo} do livro "${it.titulo}": ${e.qtd} exemplar(es), ${brl(e.total)} (pré-venda). Nome: ${e.nome}.`;
    el.innerHTML = `<div class="card"><h2><i class="fas fa-check-circle"></i> Encomenda recebida</h2>
      <p>Seu código: <strong>${esc(e.codigo)}</strong>. Você é o <strong>nº ${e.seq}</strong> na ordem de chegada.</p>
      <p>${e.qtd} exemplar(es) de <strong>${esc(it.titulo)}</strong> · total <strong>${brl(e.total)}</strong> (preço de pré-venda). Guarde o código.</p>
      <p>O Parque entra em contato para combinar o pagamento. Para garantir que o Parque receba o seu pedido, envie a confirmação por um dos botões:</p>
      <p><a class="btn-visit" href="https://wa.me/${num}?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Confirmar pelo WhatsApp</a> <a class="btn-visit" href="mailto:parqueretirorio@gmail.com?subject=${encodeURIComponent('Encomenda ' + e.codigo + ' - ' + it.titulo)}&body=${encodeURIComponent(txt)}"><i class="fas fa-envelope"></i> Confirmar por e-mail</a></p>
      <p><a href="livraria.html">Voltar à Livraria</a></p></div>`;
  };
}

window.PR_ENCOMENDA = { painel, publica, responsavelDe, respValido, aberto, api, cobertura, link, textoWhats, textoEmail, situacao };
if (document.getElementById('encomenda-pub') || document.getElementById('prelanc-lista')) publica();
})();
