// Vaquinha Coletiva (área restrita > Comissões Parque Retiro > Vaquinha Coletiva) e página pública (Ajude o Parque > Vaquinha Coletiva).
// Dados: 'vaquinhas' (cadastro: objetivo, meta, formas de ajuda) e 'vaq_part' (contribuições: dados da pessoa, valor livre, comprovante, situação).
// Fluxo: a pessoa se cadastra na página pública (nome completo, celular, WhatsApp, e-mail), informa o valor que quiser e anexa o comprovante;
// o Responsável pela Vaquinha confere o comprovante e CONFIRMA. Só valores confirmados entram no gráfico (% da meta, arrecadado e falta).
// Cada confirmação é lançada automaticamente na Prestação de Contas (origem "Vaquinha Coletiva", centro "Campanhas"), e por isso aparece
// na planilha consolidada geral em "Ajude o Parque" (Relatórios Consolidados > Orçamento e Fluxo Financeiro).
(function () {
const r2 = v => Math.round(v * 100) / 100;
const pad = (n, d) => String(n).padStart(d, '0');
const hojeLocal = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); };
const PUBLICAS = ['PIX', 'MUMBUCA'];   // formas aceitas na página pública (dinheiro só pelo registro manual)
const CONSENTIMENTO = 'Autorizo o uso dos meus dados pelo Parque Retiro apenas para esta vaquinha (contato, conferência do pagamento e prestação de contas).';
const soDig = s => String(s || '').replace(/\D/g, '');
const pct = (arrec, meta) => (meta > 0 ? Math.round((arrec / meta) * 1000) / 10 : 0);   // 1 casa decimal; pode passar de 100
const fmtPct = p => p.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';

/* ---------- Operações compartilhadas (painel e página pública) ---------- */
function api(H) {
  const { db, uid } = H;
  const vaqs = () => db.get('vaquinhas', []), parts = () => db.get('vaq_part', []);
  const doVaq = id => parts().filter(p => p.vaquinha === id);
  const aberta = v => !!v && v.ativa && !v.cancelada && !v.encerrada && (!v.prazo || hojeLocal() <= v.prazo);
  const codigo = () => 'V' + Array.from(crypto.getRandomValues(new Uint8Array(4))).map(b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
  // Totais de uma vaquinha. Só o confirmado conta para o gráfico; M$ (Mumbuca) vale 1 para 1 com o real.
  function total(id) {
    const o = { conf: 0, pend: 0, nConf: 0, nPend: 0, porMoeda: {} };
    doVaq(id).forEach(p => {
      if (p.status === 'confirmado') { o.conf += p.valor; o.nConf++; o.porMoeda[p.moeda] = r2((o.porMoeda[p.moeda] || 0) + p.valor); }
      else if (p.status === 'pendente') { o.pend += p.valor; o.nPend++; }
    });
    o.conf = r2(o.conf); o.pend = r2(o.pend); return o;
  }
  const lancaConta = (p, v) => {
    const cs = db.get('contas', []), id = uid();
    cs.push({ id, data: hojeLocal(), desc: `Vaquinha Coletiva: ${v.titulo} - ${p.codigo}`, centro: 'Campanhas', tipo: 'Entrada', origem: 'Vaquinha Coletiva', vaquinha: v.titulo, valor: p.valor, moeda: p.moeda, comp: '' });
    return db.set('contas', cs) ? id : '';
  };
  // Se o título da vaquinha mudar, os lançamentos já feitos acompanham (senão o "Resumo por Vaquinha" se divide em dois nomes).
  function renomearContas(v, antigo) {
    if (!antigo || antigo === v.titulo) return;
    const ids = new Set(doVaq(v.id).map(p => p.conta).filter(Boolean)); if (!ids.size) return;
    const cs = db.get('contas', []); cs.forEach(c => { if (ids.has(c.id)) { c.vaquinha = v.titulo; c.desc = String(c.desc || '').replace('Vaquinha Coletiva: ' + antigo, 'Vaquinha Coletiva: ' + v.titulo); } });
    db.set('contas', cs);
  }
  // Registra a contribuição. Pública: entra "pendente". Manual (Responsável, ex.: dinheiro em espécie): entra já confirmada e lançada.
  function contribuir(d) {
    const v = vaqs().find(x => x.id === d.vaquinha);
    if (!v) return { erro: 'Vaquinha não encontrada.' };
    if (!d.manual && !aberta(v)) return { erro: 'Esta vaquinha não está recebendo contribuições.' };
    if (d.manual && v.cancelada) return { erro: 'Esta vaquinha foi cancelada.' };
    const valor = r2(Number(d.valor));
    if (!(valor > 0) || valor > 1000000) return { erro: 'Informe um valor maior que zero.' };
    if (!d.manual && !(v.moedas || []).filter(m => PUBLICAS.includes(m)).includes(d.moeda)) return { erro: 'Forma de pagamento não aceita nesta vaquinha.' };
    if (d.manual && !(d.moeda in H.MOEDA)) return { erro: 'Forma de pagamento inválida.' };
    const p = { id: uid(), codigo: codigo(), vaquinha: v.id, nome: d.nome, celular: d.celular, whatsapp: d.whatsapp, email: d.email, valor, moeda: d.moeda, comprovante: d.comprovante || '', status: 'pendente', origem: d.manual ? 'manual' : 'publica', criadoEm: new Date().toISOString(), consentimento: !!d.consentimento, por: d.por || '', conta: '' };
    if (d.manual) { p.status = 'confirmado'; p.confirmadoEm = p.criadoEm; p.confirmadoPor = d.por || ''; p.conta = lancaConta(p, v); if (!p.conta) return { erro: 'Não foi possível lançar na Prestação de Contas.' }; }
    const l = parts(); l.push(p);
    if (!db.set('vaq_part', l)) { if (p.conta) db.set('contas', db.get('contas', []).filter(c => c.id !== p.conta)); return { erro: 'Não foi possível salvar (espaço do navegador cheio?). Tente um comprovante menor.' }; }
    return { part: p, vaq: v };
  }
  function confirmar(id, por) {
    const l = parts(), p = l.find(x => x.id === id), v = p && vaqs().find(x => x.id === p.vaquinha);
    if (!p || !v) return 'Contribuição não encontrada.';
    if (p.status === 'confirmado') return '';
    if (v.cancelada) return 'Esta vaquinha foi cancelada; não é possível confirmar contribuições.';
    p.conta = lancaConta(p, v); if (!p.conta) return 'Não foi possível lançar na Prestação de Contas.';
    p.status = 'confirmado'; p.confirmadoEm = new Date().toISOString(); p.confirmadoPor = por; p.motivo = '';
    return db.set('vaq_part', l) ? '' : 'Não foi possível salvar.';
  }
  // Recusa uma pendente ou estorna uma confirmada (tira o lançamento da Prestação de Contas).
  function recusar(id, motivo, por) {
    const l = parts(), p = l.find(x => x.id === id);
    if (!p) return 'Contribuição não encontrada.';
    if (p.conta) db.set('contas', db.get('contas', []).filter(c => c.id !== p.conta));
    p.conta = ''; p.status = 'recusado'; p.motivo = motivo; p.recusadoPor = por; p.recusadoEm = new Date().toISOString();
    return db.set('vaq_part', l) ? '' : 'Não foi possível salvar.';
  }
  return { db, uid, vaqs, parts, doVaq, aberta, total, contribuir, confirmar, recusar, lancaConta, renomearContas };
}

const ROT_PART = { pendente: ['Aguardando conferência', ''], confirmado: ['Confirmado', 'badge-disponivel'], recusado: ['Recusado', 'badge-emprestado'] };
const statusVaq = v => v.cancelada ? ['Cancelada', 'badge-emprestado'] : v.encerrada ? ['Encerrada', 'badge-emprestado'] : v.prazo && hojeLocal() > v.prazo ? ['Prazo encerrado', 'badge-emprestado'] : !v.ativa ? ['Oculta no site', ''] : ['Aberta', 'badge-disponivel'];
const modoLocal = () => !(window.PR_DADOS && window.PR_DADOS.modo === 'remoto');
const AVISO_LOCAL = 'Enquanto o site estiver em modo local (dados no navegador), as contribuições feitas por visitantes ficam gravadas só no navegador de quem contribuiu e NÃO chegam a esta tela. Para valer de verdade, é preciso ligar o servidor (veja docs/VAQUINHA_COLETIVA.md).';

// Gráfico da campanha: anel com a % da meta + Meta / Arrecadado / Falta. Só valores confirmados.
function grafico(v, t, brl, esc) {
  const p = pct(t.conf, v.meta), falta = r2(Math.max(v.meta - t.conf, 0)), C = 2 * Math.PI * 52, preench = Math.min(p, 100) / 100 * C;
  const rot = `Vaquinha ${v.titulo}: ${fmtPct(p)} da meta. Arrecadado ${brl(t.conf)} de ${brl(v.meta)}; ${falta > 0 ? 'faltam ' + brl(falta) : 'meta alcançada'}.`;
  return `<div class="vq-grafico" role="img" aria-label="${esc(rot)}">
    <svg viewBox="0 0 120 120" width="140" height="140" aria-hidden="true"><circle cx="60" cy="60" r="52" fill="none" stroke="#e3ece8" stroke-width="12"/><circle class="vq-arco" cx="60" cy="60" r="52" fill="none" stroke="${p >= 100 ? '#2e7d32' : 'var(--accent-color)'}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${preench.toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 60 60)"/><text x="60" y="66" text-anchor="middle" font-size="22" font-weight="700" fill="var(--primary-color)">${esc(fmtPct(p))}</text></svg>
    <div class="vq-valores"><div><span>Meta</span><strong>${brl(v.meta)}</strong></div><div><span>Arrecadado</span><strong class="vq-arrec">${brl(t.conf)}</strong></div><div><span>${falta > 0 ? 'Falta' : 'Meta'}</span><strong class="vq-falta">${falta > 0 ? brl(falta) : 'alcançada'}</strong></div></div>
  </div>${t.nConf ? `<p class="vazio">${t.nConf} contribuição(ões) confirmada(s).</p>` : ''}`;
}

const lerArqFn = (H) => file => new Promise((ok, no) => {
  const { reduz, safeUrl } = H;
  if (/^image\//.test(file.type)) return reduz(file, 1000, 0.65).then(ok, () => no('Não foi possível ler a imagem.'));
  if (file.type === 'application/pdf') { if (file.size > 600 * 1024) return no('PDF maior que 600 KB. Envie uma foto ou captura de tela do comprovante.'); const f = new FileReader(); f.onload = () => safeUrl(f.result) ? ok(f.result) : no('Tipo de arquivo não aceito.'); f.onerror = () => no('Não foi possível ler o arquivo.'); return f.readAsDataURL(file); }
  no('O comprovante precisa ser imagem (JPG, PNG) ou PDF.');
});

window.PR_VAQUINHA = {
  /* ===================== PAINEL (área restrita) ===================== */
  abrir(me, root, H) {
    const { esc, $, db, uid, hoje, fmtData, csv, MOEDA, money, safeUrl } = H;
    const A = api(H), brl = v => money(v, 'PIX'), lerArq = lerArqFn(H);
    const SUB = [['vaq', 'Vaquinhas'], ['contr', 'Contribuições'], ['arrec', 'Arrecadação']];
    let sub = 'vaq', editId = null, msg = '', filtroV = '', filtroS = '';
    const aviso = () => (msg ? `<p class="tip-box" role="status">${esc(msg)}</p>` : '') + (modoLocal() ? `<p class="tip-box" role="note"><i class="fas fa-exclamation-triangle"></i> ${esc(AVISO_LOCAL)}</p>` : '');
    const nomeVaq = id => (A.vaqs().find(v => v.id === id) || {}).titulo || '(vaquinha removida)';

    /* ---------- Vaquinhas (cadastro) ---------- */
    const vaqTab = el => {
      const ed = editId ? A.vaqs().find(v => v.id === editId) : null;
      const v = ed || { titulo: '', objetivo: '', meta: '', prazo: '', moedas: ['PIX'], instrucoes: '', outras: '', ativa: true };
      const lista = A.vaqs().slice().sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
      el.innerHTML = `<h3><i class="fas fa-hands-helping"></i> ${ed ? 'Editar vaquinha' : 'Cadastrar vaquinha'}</h3>
      <p>Vaquinhas coletivas do Parque. As marcadas como <strong>abertas no site</strong> aparecem em "Ajude o Parque &gt; Vaquinha Coletiva" com o objetivo, o gráfico da meta e o formulário de contribuição. Quem contribui escolhe o valor.</p>${aviso()}
      <form id="fv" class="form-reserva" novalidate>
        <div class="form-row"><label for="v-t">Nome da vaquinha *</label><input id="v-t" required maxlength="100" value="${esc(v.titulo)}" placeholder="Ex.: Vaquinha Manutenção da Grama"></div>
        <div class="form-row"><label for="v-o">Objetivo da vaquinha *</label><textarea id="v-o" rows="4" maxlength="1000" placeholder="Para que serve o dinheiro, o que será feito e por que é importante para o Parque.">${esc(v.objetivo)}</textarea></div>
        <div class="form-row"><label for="v-m">Meta de arrecadação (R$) *</label><input id="v-m" type="number" min="1" step="0.01" required value="${v.meta === '' ? '' : esc(v.meta)}"><small>É o valor total que a campanha quer alcançar. O gráfico mostra a % já arrecadada e quanto falta. Se a meta mudar, o gráfico se ajusta.</small></div>
        <div class="form-row"><label for="v-p">Prazo (opcional)</label><input id="v-p" type="date" value="${esc(v.prazo || '')}"><small>Até esse dia (inclusive) o site recebe contribuições. Sem prazo, a vaquinha fica aberta até você encerrar.</small></div>
        <fieldset class="funcoes"><legend>Formas de pagamento aceitas *</legend>${Object.entries(MOEDA).map(([k, t]) => `<label><input type="checkbox" name="vm" value="${k}"${(v.moedas || []).includes(k) ? ' checked' : ''}> ${esc(t)}${PUBLICAS.includes(k) ? '' : ' (só registro manual)'}</label>`).join('')}</fieldset>
        <div class="form-row"><label for="v-i">Como ajudar: instruções de pagamento (aparecem para quem vai contribuir) *</label><textarea id="v-i" rows="4" maxlength="800" placeholder="Chave PIX, banco, titular. Para M$: conta no Banco Mumbuca. Ex.: PIX CNPJ 00.000.000/0001-00 - Instituto Pangeia">${esc(v.instrucoes)}</textarea></div>
        <div class="form-row"><label for="v-x">Outras formas de ajudar (opcional)</label><textarea id="v-x" rows="3" maxlength="600" placeholder="Ex.: doar material, oferecer dias de trabalho voluntário, divulgar a vaquinha.">${esc(v.outras || '')}</textarea></div>
        <div class="form-row"><label><input type="checkbox" id="v-pub"${v.ativa ? ' checked' : ''}> Aberta no site (Ajude o Parque &gt; Vaquinha Coletiva)</label></div>
        <p class="form-erro" id="v-er" role="alert" hidden></p>
        <button class="btn-visit btn-large"><i class="fas ${ed ? 'fa-save' : 'fa-plus-circle'}"></i> ${ed ? 'Salvar alterações' : 'Cadastrar vaquinha'}</button>
        ${ed ? '<button type="button" class="btn-visit btn-large" id="v-x2" style="background:#6c7a7b;margin-left:8px">Cancelar edição</button>' : ''}
      </form>
      <h4>Vaquinhas cadastradas (${lista.length})</h4>${lista.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Vaquinha</th><th>Meta</th><th>Arrecadado (confirmado)</th><th>%</th><th>Situação</th><th>Ações</th></tr></thead><tbody>${lista.map(x => { const t = A.total(x.id), st = statusVaq(x); return `<tr><td>${esc(x.titulo)}${x.prazo ? `<br><small>até ${fmtData(x.prazo)}</small>` : ''}</td><td>${brl(x.meta)}</td><td>${brl(t.conf)}${t.nPend ? `<br><small>+ ${brl(t.pend)} aguardando</small>` : ''}</td><td>${esc(fmtPct(pct(t.conf, x.meta)))}</td><td><span class="${st[1]}">${st[0]}</span></td>
        <td style="white-space:nowrap">${x.cancelada ? '' : `<button class="btn-visit" data-pub="${x.id}" style="padding:5px 9px;font-size:.78rem">${x.ativa ? 'Fechar no site' : 'Abrir no site'}</button> <button class="btn-visit" data-enc="${x.id}" style="padding:5px 9px;font-size:.78rem">${x.encerrada ? 'Reabrir' : 'Encerrar'}</button> <button class="btn-visit" data-can="${x.id}" style="padding:5px 9px;font-size:.78rem">Cancelar vaquinha</button> <button class="icon-btn edit" data-ed="${x.id}" title="Editar" aria-label="Editar ${esc(x.titulo)}"><i class="fas fa-pen"></i></button>`}
        ${A.doVaq(x.id).length ? '' : `<button class="icon-btn" data-del="${x.id}" title="Excluir" aria-label="Excluir ${esc(x.titulo)}"><i class="fas fa-trash"></i></button>`}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="vazio">Nenhuma vaquinha cadastrada ainda.</p>'}`;
      msg = '';
      el.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { editId = b.dataset.ed; draw(); window.scrollTo(0, 0); });
      el.querySelectorAll('[data-pub]').forEach(b => b.onclick = () => { const l = A.vaqs(), x = l.find(y => y.id === b.dataset.pub); x.ativa = !x.ativa; db.set('vaquinhas', l); msg = x.titulo + (x.ativa ? ' foi aberta no site.' : ' foi fechada no site.'); draw(); });
      el.querySelectorAll('[data-enc]').forEach(b => b.onclick = () => { const l = A.vaqs(), x = l.find(y => y.id === b.dataset.enc); x.encerrada = !x.encerrada; db.set('vaquinhas', l); msg = x.titulo + (x.encerrada ? ' foi encerrada: não recebe mais contribuições, mas o resultado continua visível no site.' : ' foi reaberta.'); draw(); });
      el.querySelectorAll('[data-can]').forEach(b => b.onclick = () => {
        const x = A.vaqs().find(y => y.id === b.dataset.can), n = A.doVaq(x.id).filter(p => p.status === 'confirmado').length;
        if (!confirm(`Cancelar a vaquinha "${x.titulo}"?` + (n ? ` Há ${n} contribuição(ões) confirmada(s): os valores precisarão ser devolvidos (use Estornar em Contribuições para tirar cada lançamento da Prestação de Contas).` : ''))) return;
        const l = A.vaqs(), y = l.find(z => z.id === x.id); y.cancelada = true; y.ativa = false; db.set('vaquinhas', l); msg = 'Vaquinha cancelada.'; draw();
      });
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (!confirm('Excluir esta vaquinha?')) return; db.set('vaquinhas', A.vaqs().filter(x => x.id !== b.dataset.del)); draw(); });
      const x2 = $('#v-x2', el); if (x2) x2.onclick = () => { editId = null; draw(); };
      $('#fv', el).onsubmit = e => {
        e.preventDefault();
        const er = $('#v-er', el), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
        const titulo = $('#v-t', el).value.trim(), obj = $('#v-o', el).value.trim(), meta = parseFloat($('#v-m', el).value), prazo = $('#v-p', el).value, ins = $('#v-i', el).value.trim();
        const moedas = [...el.querySelectorAll('[name=vm]:checked')].map(c => c.value);
        if (!titulo) return falha('Informe o nome da vaquinha.');
        if (!obj) return falha('Descreva o objetivo da vaquinha.');
        if (!(meta >= 1)) return falha('Informe a meta de arrecadação (mínimo R$ 1,00).');
        if (prazo && !(ed && prazo === ed.prazo) && prazo < hojeLocal()) return falha('O prazo não pode ser uma data que já passou.');
        if (!moedas.length) return falha('Marque ao menos uma forma de pagamento.');
        if (!ins) return falha('Informe as instruções de pagamento (chave PIX, banco, titular).');
        const dados = { titulo, objetivo: obj, meta: r2(meta), prazo, moedas, instrucoes: ins, outras: $('#v-x', el).value.trim(), ativa: $('#v-pub', el).checked };
        const l = A.vaqs(); let antigo = '';
        if (ed) { const x = l.find(y => y.id === ed.id); antigo = x.titulo; Object.assign(x, dados); } else l.push({ id: uid(), ...dados, por: me.nome, criadoEm: hoje() });
        if (!db.set('vaquinhas', l)) return falha('Não foi possível salvar (espaço do navegador cheio?).');
        if (ed) A.renomearContas({ id: ed.id, titulo }, antigo);
        msg = ed ? 'Vaquinha atualizada.' : 'Vaquinha cadastrada.' + (dados.ativa ? ' Ela já aparece no site.' : ''); editId = null; draw();
      };
    };

    /* ---------- Contribuições (conferência dos comprovantes) ---------- */
    const comprovanteLink = p => p.comprovante && safeUrl(p.comprovante) ? `<a href="${esc(p.comprovante)}" download="comprovante-${esc(p.codigo)}">Baixar</a>` : '-';
    const contr = el => {
      const vs = A.vaqs().slice().sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
      let lista = A.parts().slice().sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
      if (filtroV) lista = lista.filter(p => p.vaquinha === filtroV);
      if (filtroS) lista = lista.filter(p => p.status === filtroS);
      const pend = A.parts().filter(p => p.status === 'pendente').length;
      const abertas = vs.filter(v => !v.cancelada);
      el.innerHTML = `<h3><i class="fas fa-users"></i> Contribuições</h3>${aviso()}
      ${pend ? `<p class="tip-box" role="status"><i class="fas fa-hourglass-half"></i> <strong>${pend}</strong> contribuição(ões) aguardando conferência do comprovante. Só valores <strong>confirmados</strong> entram no gráfico da vaquinha e na planilha consolidada.</p>` : ''}
      <div class="rc-filtros"><div class="form-row"><label for="cf-v">Vaquinha</label><select id="cf-v"><option value="">Todas</option>${vs.map(v => `<option value="${v.id}"${v.id === filtroV ? ' selected' : ''}>${esc(v.titulo)}</option>`).join('')}</select></div>
      <div class="form-row"><label for="cf-s">Situação</label><select id="cf-s"><option value="">Todas</option>${Object.entries(ROT_PART).map(([k, t]) => `<option value="${k}"${k === filtroS ? ' selected' : ''}>${t[0]}</option>`).join('')}</select></div></div>
      ${lista.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Data</th><th>Vaquinha</th><th>Participante</th><th>Contato</th><th>Valor</th><th>Comprovante</th><th>Situação</th><th>Ações</th></tr></thead><tbody>${lista.map(p => { const st = ROT_PART[p.status], wa = soDig(p.whatsapp); return `<tr><td>${fmtData(p.criadoEm.slice(0, 10))}</td><td>${esc(nomeVaq(p.vaquinha))}</td><td>${esc(p.nome)}<br><small>${esc(p.codigo)}${p.origem === 'manual' ? ' · manual' : ''}</small></td>
        <td><small>Cel.: ${esc(p.celular || '-')}<br>${wa ? `<a href="https://wa.me/${wa.length <= 11 ? '55' + wa : wa}" target="_blank" rel="noopener">WhatsApp: ${esc(p.whatsapp)}</a>` : 'WhatsApp: -'}<br>${p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : '-'}</small></td>
        <td>${money(p.valor, p.moeda)}<br><small>${esc(MOEDA[p.moeda])}</small></td><td>${comprovanteLink(p)}</td>
        <td><span class="${st[1]}">${st[0]}</span>${p.motivo ? `<br><small>${esc(p.motivo)}</small>` : ''}</td>
        <td style="white-space:nowrap">${p.status === 'pendente' ? `<button class="btn-visit" data-ok="${p.id}" style="padding:5px 9px;font-size:.78rem">Confirmar</button> <button class="btn-visit" data-no="${p.id}" style="padding:5px 9px;font-size:.78rem;background:#b3261e">Recusar</button>` : p.status === 'confirmado' ? `<button class="btn-visit" data-no="${p.id}" style="padding:5px 9px;font-size:.78rem;background:#6c7a7b">Estornar</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="vazio">Nenhuma contribuição encontrada.</p>'}
      <details style="margin-top:18px"><summary><strong>Registrar contribuição manual</strong> (valor recebido em mãos, dinheiro em espécie ou fora do site)</summary>
      ${abertas.length ? `<form id="fm" class="form-reserva" novalidate>
        <div class="form-row"><label for="m-v">Vaquinha *</label><select id="m-v">${abertas.map(v => `<option value="${v.id}">${esc(v.titulo)}</option>`).join('')}</select></div>
        <div class="form-row"><label for="m-n">Nome completo *</label><input id="m-n" maxlength="100"></div>
        <div class="form-row"><label for="m-w">WhatsApp ou celular *</label><input id="m-w" maxlength="20" inputmode="tel"></div>
        <div class="form-row"><label for="m-e">E-mail (opcional)</label><input id="m-e" type="email" maxlength="120"></div>
        <div class="form-row"><label for="m-q">Valor (R$) *</label><input id="m-q" type="number" min="0.01" step="0.01"></div>
        <div class="form-row"><label for="m-m">Forma de pagamento *</label><select id="m-m">${Object.entries(MOEDA).map(([k, t]) => `<option value="${k}">${esc(t)}</option>`).join('')}</select></div>
        <div class="form-row"><label for="m-f">Comprovante (opcional)</label><input id="m-f" type="file" accept=".pdf,image/*"></div>
        <p class="tip-box" role="note"><i class="fas fa-info-circle"></i> A contribuição manual já entra <strong>confirmada</strong>, atualiza o gráfico e é lançada na Prestação de Contas.</p>
        <p class="form-erro" id="m-er" role="alert" hidden></p>
        <button class="btn-visit btn-large"><i class="fas fa-check"></i> Registrar e confirmar</button></form>` : '<p class="vazio">Cadastre uma vaquinha para registrar contribuições.</p>'}</details>`;
      msg = '';
      $('#cf-v', el).onchange = e => { filtroV = e.target.value; draw(); };
      $('#cf-s', el).onchange = e => { filtroS = e.target.value; draw(); };
      el.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => { const e = A.confirmar(b.dataset.ok, me.nome); msg = e || 'Contribuição confirmada, somada ao gráfico e lançada na Prestação de Contas.'; draw(); });
      el.querySelectorAll('[data-no]').forEach(b => b.onclick = () => {
        const p = A.parts().find(x => x.id === b.dataset.no), conf = p.status === 'confirmado';
        const m = prompt(conf ? 'Estornar esta contribuição confirmada? O valor sai do gráfico e o lançamento sai da Prestação de Contas. Motivo:' : 'Recusar esta contribuição. Motivo (ex.: comprovante ilegível, valor divergente):', '');
        if (m === null) return; if (m.trim().length < 3) { msg = 'Informe um motivo.'; draw(); return; }
        const e = A.recusar(p.id, m.trim(), me.nome); msg = e || (conf ? 'Contribuição estornada.' : 'Contribuição recusada.'); draw();
      });
      const fm = $('#fm', el); if (!fm) return;
      fm.onsubmit = async e => {
        e.preventDefault();
        const er = $('#m-er', el), falha = t => { er.textContent = t; er.hidden = false; }; er.hidden = true;
        const nome = $('#m-n', el).value.trim(), w = $('#m-w', el).value.trim(), valor = parseFloat($('#m-q', el).value), arq = $('#m-f', el).files[0];
        if (!nome) return falha('Informe o nome completo.');
        if (soDig(w).length < 10) return falha('Informe um WhatsApp ou celular com DDD.');
        if (!(valor > 0)) return falha('Informe um valor maior que zero.');
        let comp = ''; if (arq) { try { comp = await lerArq(arq); } catch (x) { return falha(String(x)); } }
        const res = A.contribuir({ manual: true, vaquinha: $('#m-v', el).value, nome, celular: w, whatsapp: w, email: $('#m-e', el).value.trim(), valor, moeda: $('#m-m', el).value, comprovante: comp, consentimento: true, por: me.nome });
        if (res.erro) return falha(res.erro);
        msg = `Contribuição de ${nome} (${money(res.part.valor, res.part.moeda)}) registrada e confirmada.`; draw();
      };
    };

    /* ---------- Arrecadação (gráficos, totais e conferência com a Prestação de Contas) ---------- */
    const arrec = el => {
      const vs = A.vaqs().slice().sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || '')), tot = {}, pend = {};
      A.parts().forEach(p => { if (p.status === 'confirmado') tot[p.moeda] = r2((tot[p.moeda] || 0) + p.valor); else if (p.status === 'pendente') pend[p.moeda] = r2((pend[p.moeda] || 0) + p.valor); });
      const semLanc = A.parts().filter(p => p.status === 'confirmado' && !(p.conta && db.get('contas', []).some(c => c.id === p.conta)));
      el.innerHTML = `<h3><i class="fas fa-chart-pie"></i> Arrecadação das vaquinhas</h3>${aviso()}
      <div class="totais">${Object.keys(MOEDA).filter(m => tot[m]).map(m => `<div><span>Arrecadado (confirmado): ${esc(MOEDA[m])}</span><strong>${money(tot[m], m)}</strong></div>`).join('') || '<div><span>Arrecadado (confirmado)</span><strong>R$ 0,00</strong></div>'}${Object.keys(MOEDA).filter(m => pend[m]).map(m => `<div><span>Aguardando conferência: ${esc(MOEDA[m])}</span><strong>${money(pend[m], m)}</strong></div>`).join('')}</div>
      <p class="tip-box" role="note"><i class="fas fa-info-circle"></i> Cada contribuição confirmada é lançada automaticamente na Prestação de Contas (origem Vaquinha Coletiva) e entra na planilha consolidada geral (Relatórios Consolidados &gt; Orçamento e Fluxo Financeiro, linha Vaquinha Coletiva em "Ajude o Parque"). Valores aguardando conferência ainda não contam. No gráfico, M$ (Mumbuca) vale 1 para 1 com o real.</p>
      ${semLanc.length ? `<p class="form-erro" role="alert">Atenção: ${semLanc.length} contribuição(ões) confirmada(s) sem lançamento na Prestação de Contas. <button class="btn-visit" id="ar-l" style="padding:4px 8px;font-size:.75rem">Lançar agora</button></p>` : '<p class="vazio">Conferência: todas as contribuições confirmadas estão lançadas na Prestação de Contas.</p>'}
      <p><button class="btn-visit" id="ar-p"><i class="fas fa-print"></i> Imprimir</button> <button class="btn-visit" id="ar-c"><i class="fas fa-file-csv"></i> Baixar contribuições (CSV)</button></p>
      ${vs.length ? vs.map(v => { const t = A.total(v.id), st = statusVaq(v); return `<div class="card vq-card" style="margin:14px 0"><h4 style="margin-top:0">${esc(v.titulo)} <span class="${st[1]}">${st[0]}</span></h4>${grafico(v, t, brl, esc)}${t.nPend ? `<p class="vazio">${brl(t.pend)} em ${t.nPend} contribuição(ões) aguardando conferência (ainda fora do gráfico).</p>` : ''}${Object.keys(t.porMoeda).length ? `<p class="vazio">Por forma de pagamento: ${Object.keys(t.porMoeda).map(m => `${esc(MOEDA[m])} ${money(t.porMoeda[m], m)}`).join(' · ')}</p>` : ''}</div>`; }).join('') : '<p class="vazio">Nenhuma vaquinha cadastrada.</p>'}`;
      msg = '';
      $('#ar-p', el).onclick = () => window.print();
      $('#ar-c', el).onclick = () => {
        const rows = [['Código', 'Vaquinha', 'Data', 'Nome', 'Celular', 'WhatsApp', 'E-mail', 'Valor', 'Forma de pagamento', 'Situação', 'Origem']].concat(A.parts().map(p => [p.codigo, nomeVaq(p.vaquinha), p.criadoEm.slice(0, 10), p.nome, p.celular, p.whatsapp, p.email, p.valor, MOEDA[p.moeda], ROT_PART[p.status][0], p.origem === 'manual' ? 'manual' : 'site']));
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = 'contribuicoes-vaquinha-coletiva.csv'; a.click();
      };
      const bl = $('#ar-l', el); if (bl) bl.onclick = () => {
        const l = A.parts(); let n = 0;
        l.filter(p => p.status === 'confirmado' && !(p.conta && db.get('contas', []).some(c => c.id === p.conta))).forEach(p => { const v = A.vaqs().find(x => x.id === p.vaquinha); if (v) { p.conta = A.lancaConta(p, v); if (p.conta) n++; } });
        db.set('vaq_part', l); msg = n + ' lançamento(s) feito(s) na Prestação de Contas.'; draw();
      };
    };

    const draw = () => {
      root.innerHTML = `<div class="tabs sub" role="tablist" aria-label="Vaquinha Coletiva">${SUB.map(t => `<button class="tab-btn${t[0] === sub ? ' active' : ''}" data-vq="${t[0]}">${t[1]}</button>`).join('')}</div><div id="vq-sub"></div>`;
      root.querySelectorAll('[data-vq]').forEach(b => b.onclick = () => { sub = b.dataset.vq; editId = null; msg = ''; draw(); });
      ({ vaq: vaqTab, contr, arrec })[sub]($('#vq-sub', root));
    };
    draw();
  },

  /* ===================== PÁGINA PÚBLICA ===================== */
  publica(H) {
    const el = document.getElementById('vaquinhas'); if (!el) return;
    const { esc, fmtData, MOEDA, money } = H;
    const A = api(H), brl = v => money(v, 'PIX'), lerArq = lerArqFn(H);
    const S = { sel: '', ok: null, consulta: null };
    const cartao = v => {
      const t = A.total(v.id), aberta = A.aberta(v), st = statusVaq(v);
      return `<div class="card vq-card"><h3>${esc(v.titulo)}</h3><p class="vq-obj">${esc(v.objetivo)}</p>${grafico(v, t, brl, esc)}
        ${v.prazo ? `<p>Prazo: até <strong>${fmtData(v.prazo)}</strong>.</p>` : ''}
        <div class="tip-box vq-pay"><strong>Como ajudar</strong><br>${esc(v.instrucoes)}</div>
        ${v.outras ? `<div class="tip-box vq-pay"><strong>Outras formas de ajudar</strong><br>${esc(v.outras)}</div>` : ''}
        ${aberta ? `<button class="btn-visit" data-sel="${v.id}">Quero contribuir</button>` : `<span class="badge-emprestado">${st[0] === 'Aberta' || st[0] === 'Oculta no site' ? 'Não recebe contribuições' : st[0]}</span>`}</div>`;
    };
    const formulario = v => {
      const moedas = (v.moedas || []).filter(m => PUBLICAS.includes(m));
      return `<section class="card" id="vq-form-box" style="margin-top:18px"><h3><i class="fas fa-hands-helping"></i> Contribuir: ${esc(v.titulo)}</h3>
        <p><strong>Como funciona:</strong> 1) faça o pagamento do valor que quiser pela forma indicada; 2) preencha seus dados e anexe o comprovante; 3) a Comissão confere o comprovante e o valor entra no gráfico da vaquinha.</p>
        <div class="tip-box vq-pay"><strong>Instruções de pagamento</strong><br>${esc(v.instrucoes)}</div>
        <form id="vq-form" class="form-reserva" novalidate>
          <div class="form-row"><label for="q-n">Nome completo *</label><input id="q-n" maxlength="100" autocomplete="name" required></div>
          <div class="form-row"><label for="q-c">Celular *</label><input id="q-c" maxlength="20" inputmode="tel" autocomplete="tel" placeholder="(21) 99999-9999" required></div>
          <div class="form-row"><label for="q-w">WhatsApp *</label><input id="q-w" maxlength="20" inputmode="tel" placeholder="(21) 99999-9999" required><label><input type="checkbox" id="q-mesmo"> É o mesmo número do celular</label></div>
          <div class="form-row"><label for="q-e">E-mail *</label><input id="q-e" type="email" maxlength="120" autocomplete="email" required></div>
          <div class="form-row"><label for="q-v">Valor da contribuição (R$) * <small>qualquer valor</small></label><input id="q-v" type="number" min="0.01" step="0.01" inputmode="decimal" required></div>
          <div class="form-row"><label for="q-m">Forma de pagamento usada *</label><select id="q-m">${moedas.map(m => `<option value="${m}">${esc(MOEDA[m])}</option>`).join('')}</select></div>
          <div class="form-row"><label for="q-f">Comprovante de pagamento * (imagem ou PDF)</label><input id="q-f" type="file" accept=".pdf,image/*" required></div>
          <div class="form-row"><label><input type="checkbox" id="q-ok"> ${esc(CONSENTIMENTO)} *</label></div>
          <p class="form-erro" id="q-er" role="alert" hidden></p>
          <button class="btn-visit btn-large"><i class="fas fa-check"></i> Enviar minha contribuição</button>
        </form></section>`;
    };
    const draw = () => {
      const vs = A.vaqs().filter(v => !v.cancelada && v.ativa).sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
      const sel = vs.find(v => v.id === S.sel && A.aberta(v));
      el.innerHTML = `${modoLocal() ? `<p class="tip-box" role="note"><i class="fas fa-exclamation-triangle"></i> <strong>Modo de demonstração:</strong> as contribuições ficam gravadas só neste navegador e ainda não chegam à Comissão. Para contribuir de verdade, fale com a Comissão do Parque.</p>` : ''}
      ${vs.length ? `<h3 class="subsection-title">Vaquinhas em andamento</h3><div class="content-grid">${vs.map(cartao).join('')}</div>` : '<p class="vazio">No momento não há vaquinha aberta. Acompanhe as redes e a Comunidade do WhatsApp do Parque.</p>'}
      ${S.ok ? `<section class="card rifa-ok" role="status" style="margin-top:18px"><h3><i class="fas fa-check-circle"></i> Contribuição recebida!</h3><p>Seu código: <strong>${esc(S.ok.part.codigo)}</strong></p><p>Contribuição de <strong>${brl(S.ok.part.valor)}</strong> para <em>${esc(S.ok.vaq.titulo)}</em>. Ela entra no gráfico quando a Comissão conferir o comprovante. Guarde o código; você também pode consultar abaixo com seu e-mail e celular.</p></section>` : ''}
      ${sel ? formulario(sel) : ''}
      ${vs.length ? `<section class="card" style="margin-top:18px"><h3><i class="fas fa-search"></i> Consultar minha contribuição</h3><form id="vq-cons" class="form-reserva" novalidate><div class="form-row"><label for="k-e">E-mail usado</label><input id="k-e" type="email"></div><div class="form-row"><label for="k-c">Celular ou WhatsApp usado</label><input id="k-c" inputmode="tel"></div><button class="btn-visit">Consultar</button></form>
        ${S.consulta ? (S.consulta.length ? `<table class="doc-table"><thead><tr><th>Código</th><th>Vaquinha</th><th>Valor</th><th>Situação</th></tr></thead><tbody>${S.consulta.map(p => { const v = A.vaqs().find(x => x.id === p.vaquinha), st = ROT_PART[p.status]; return `<tr><td>${esc(p.codigo)}</td><td>${esc(v ? v.titulo : '')}</td><td>${brl(p.valor)}</td><td>${st[0]}${p.motivo ? `<br><small>${esc(p.motivo)}</small>` : ''}</td></tr>`; }).join('')}</tbody></table>` : '<p class="vazio">Nenhuma contribuição encontrada com esses dados.</p>') : ''}</section>` : ''}`;
      el.querySelectorAll('[data-sel]').forEach(b => b.onclick = () => { S.sel = b.dataset.sel; S.ok = null; draw(); const f = document.getElementById('vq-form-box'); if (f && f.scrollIntoView) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      const cons = document.getElementById('vq-cons');
      if (cons) cons.onsubmit = e => {
        e.preventDefault();
        const em = document.getElementById('k-e').value.trim().toLowerCase(), cel = soDig(document.getElementById('k-c').value);
        S.consulta = em && cel.length >= 10 ? A.parts().filter(p => String(p.email || '').toLowerCase() === em && (soDig(p.celular) === cel || soDig(p.whatsapp) === cel)).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)) : [];
        draw();
      };
      const f = document.getElementById('vq-form'); if (!f) return;
      document.getElementById('q-mesmo').onchange = e => { const w = document.getElementById('q-w'); if (e.target.checked) w.value = document.getElementById('q-c').value; };
      f.onsubmit = async e => {
        e.preventDefault();
        const er = document.getElementById('q-er'), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
        const g = id => document.getElementById(id), nome = g('q-n').value.trim(), cel = g('q-c').value.trim(), wa = g('q-w').value.trim(), em = g('q-e').value.trim(), valor = parseFloat(g('q-v').value), arq = g('q-f').files[0];
        if (nome.split(/\s+/).filter(Boolean).length < 2) return falha('Informe o nome completo (nome e sobrenome).');
        if (soDig(cel).length < 10) return falha('Informe o celular com DDD.');
        if (soDig(wa).length < 10) return falha('Informe o WhatsApp com DDD.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return falha('Informe um e-mail válido.');
        if (!(valor > 0)) return falha('Informe o valor da contribuição (maior que zero).');
        if (!arq) return falha('Anexe o comprovante de pagamento.');
        if (!g('q-ok').checked) return falha('É preciso concordar com o uso dos dados para participar.');
        let comp; try { comp = await lerArq(arq); } catch (x) { return falha(String(x)); }
        const res = A.contribuir({ vaquinha: S.sel, nome, celular: cel, whatsapp: wa, email: em, valor, moeda: g('q-m').value, comprovante: comp, consentimento: true });
        if (res.erro) return falha(res.erro);
        S.ok = res; S.sel = ''; draw(); const ok = el.querySelector('.rifa-ok'); if (ok && ok.scrollIntoView) ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
    };
    draw();
  }
};
})();
