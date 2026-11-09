// Rifa Solidária (área restrita > Comissões Parque Retiro > Rifa Solidária) e página pública (Ajude o Parque > Rifa Solidária).
// Dados: 'rifas' (cadastro de cada rifa) e 'rifa_part' (participações: dados do participante, números, comprovante, situação).
// Fluxo: a pessoa se inscreve na página pública (nome, celular, WhatsApp, e-mail, comprovante) e recebe número(s) na hora;
// o Responsável pela Rifa confere o comprovante e CONFIRMA; só números confirmados concorrem. Cada confirmação é lançada
// automaticamente na Prestação de Contas (origem "Rifa Solidária"), e por isso aparece na planilha consolidada em "Ajude o Parque".
// Sorteio: pela Loteria Federal, no dia previsto. A apuração é automática (regra fixa e pública, função vencedor() abaixo) assim que
// o resultado da Federal está disponível; o Responsável pode informar o resultado à mão se a busca automática não funcionar.
(function () {
const r2 = v => Math.round(v * 100) / 100;
const pad = (n, d) => String(n).padStart(d, '0');
const hojeLocal = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); };
const TOTAIS = [[10, 1], [100, 2], [1000, 3]];           // [quantidade de números, dígitos]. Números vão de 0 a total-1.
const PUBLICAS = ['PIX', 'MUMBUCA'];                       // formas aceitas na página pública (dinheiro só pelo registro manual)
const REGRA = 'O número sorteado é o que termina igual ao 1º prêmio da Loteria Federal (últimos dígitos, conforme a quantidade de números da rifa). Se esse número não foi vendido, vale o 2º prêmio; depois o 3º, o 4º e o 5º. Se nenhum dos cinco foi vendido, ganha o próximo número vendido acima do 1º prêmio (voltando ao início se preciso). Só concorrem números com pagamento confirmado.';
const CONSENTIMENTO = 'Autorizo o uso dos meus dados pelo Parque Retiro apenas para esta rifa (contato, conferência do pagamento e divulgação do resultado com meu nome abreviado).';

/* ---------- Regra do sorteio (funções puras; o servidor PHP deve repetir exatamente esta lógica) ---------- */
const ultimos = (premio, d) => parseInt(String(premio).padStart(5, '0').slice(-d), 10);
function vencedor(digitos, vendidos, premios) {
  const set = new Set(vendidos);
  for (let i = 0; i < premios.length; i++) { const n = ultimos(premios[i], digitos); if (set.has(n)) return { numero: n, premioRef: i + 1, regra: 'premio' }; }
  if (!set.size) return null;
  const total = Math.pow(10, digitos), base = ultimos(premios[0], digitos);
  for (let k = 1; k < total; k++) { const n = (base + k) % total; if (set.has(n)) return { numero: n, premioRef: 1, regra: 'proximo' }; }
  return null;
}
const premiosValidos = p => Array.isArray(p) && p.length === 5 && p.every(x => /^\d{5}$/.test(String(x))) && new Set(p.map(String)).size === 5;
// Lê a resposta de um serviço de resultado: procura 5 números de 5 dígitos distintos e a data do concurso (dd/mm/aaaa ou aaaa-mm-dd).
function lerResultado(j) {
  if (!j || typeof j !== 'object') return null;
  let premios = null;
  Object.keys(j).forEach(k => { const v = j[k]; if (!premios && Array.isArray(v) && v.length >= 5 && v.slice(0, 5).every(x => /^\d{5}$/.test(String(x)))) premios = v.slice(0, 5).map(String); });
  const d = String(j.dataApuracao || j.data || j.dataConcurso || '');
  const data = /^\d{2}\/\d{2}\/\d{4}$/.test(d) ? d.split('/').reverse().join('-') : (/^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : '');
  if (!premios || !data || !premiosValidos(premios)) return null;
  return { premios, data, concurso: String(j.numero || j.concurso || '') };
}
const ehFederal = iso => { const [y, m, d] = iso.split('-').map(Number), w = new Date(y, m - 1, d).getDay(); return w === 3 || w === 6; };
const nomePublico = n => { const p = String(n || '').trim().split(/\s+/); return p.length > 1 ? p[0] + ' ' + p[p.length - 1][0].toUpperCase() + '.' : (p[0] || ''); };
const soDig = s => String(s || '').replace(/\D/g, '');

/* ---------- Operações compartilhadas (painel e página pública) ---------- */
function api(H) {
  const { db, uid, safeUrl } = H;
  const rifas = () => db.get('rifas', []), parts = () => db.get('rifa_part', []);
  const ativos = id => parts().filter(p => p.rifa === id && p.status !== 'recusado');
  const confirmados = id => parts().filter(p => p.rifa === id && p.status === 'confirmado');
  const ocupados = id => new Set(ativos(id).flatMap(p => p.numeros));
  const aberta = r => !!r && r.ativa && !r.cancelada && !r.apuracao && hojeLocal() < r.dataSorteio;
  const livres = r => r.total - ocupados(r.id).size;
  const codigo = () => 'R' + Array.from(crypto.getRandomValues(new Uint8Array(4))).map(b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
  const sorteia = (lista, n) => { const a = lista.slice(), out = []; while (out.length < n && a.length) { const i = crypto.getRandomValues(new Uint32Array(1))[0] % a.length; out.push(a.splice(i, 1)[0]); } return out.sort((x, y) => x - y); };
  const lancaConta = (p, r) => {
    const cs = db.get('contas', []), id = uid();
    cs.push({ id, data: hojeLocal(), desc: `Rifa Solidária: ${r.titulo} (${p.numeros.length} nº) - ${p.codigo}`, centro: 'Campanhas', tipo: 'Entrada', origem: 'Rifa Solidária', vaquinha: '', valor: p.total, moeda: p.moeda, comp: '' });
    return db.set('contas', cs) ? id : '';
  };
  // Cria a inscrição e já reserva os números. Devolve { part } ou { erro }.
  function inscrever(d) {
    const r = rifas().find(x => x.id === d.rifa);
    if (!r) return { erro: 'Rifa não encontrada.' };
    if (!d.manual && !aberta(r)) return { erro: 'As inscrições desta rifa estão encerradas.' };
    if (d.manual && (r.apuracao || r.cancelada)) return { erro: 'Esta rifa já foi apurada ou cancelada.' };
    const qtd = d.qtd, livre = []; const oc = ocupados(r.id);
    for (let n = 0; n < r.total; n++) if (!oc.has(n)) livre.push(n);
    if (!(qtd >= 1 && qtd <= 20)) return { erro: 'Escolha de 1 a 20 números.' };
    if (livre.length < qtd) return { erro: livre.length ? `Só restam ${livre.length} número(s) disponível(is).` : 'Todos os números já foram reservados.' };
    const p = { id: uid(), codigo: codigo(), rifa: r.id, nome: d.nome, celular: d.celular, whatsapp: d.whatsapp, email: d.email, numeros: sorteia(livre, qtd), moeda: d.moeda, total: r2(qtd * r.preco), comprovante: d.comprovante || '', status: 'pendente', origem: d.manual ? 'manual' : 'publica', criadoEm: new Date().toISOString(), consentimento: !!d.consentimento, por: d.por || '', conta: '' };
    if (d.manual) { p.status = 'confirmado'; p.confirmadoEm = p.criadoEm; p.conta = lancaConta(p, r); if (!p.conta) return { erro: 'Não foi possível lançar na Prestação de Contas.' }; }
    const l = parts(); l.push(p);
    if (!db.set('rifa_part', l)) { if (p.conta) db.set('contas', db.get('contas', []).filter(c => c.id !== p.conta)); return { erro: 'Não foi possível salvar (espaço do navegador cheio?). Tente um comprovante menor.' }; }
    return { part: p };
  }
  function confirmar(id, por) {
    const l = parts(), p = l.find(x => x.id === id), r = p && rifas().find(x => x.id === p.rifa);
    if (!p || !r) return 'Participação não encontrada.';
    if (r.apuracao) return 'Esta rifa já foi apurada; não é possível alterar participações.';
    if (p.status === 'confirmado') return '';
    p.conta = lancaConta(p, r); if (!p.conta) return 'Não foi possível lançar na Prestação de Contas.';
    p.status = 'confirmado'; p.confirmadoEm = new Date().toISOString(); p.confirmadoPor = por; p.motivo = '';
    return db.set('rifa_part', l) ? '' : 'Não foi possível salvar.';
  }
  function recusar(id, motivo, por) {
    const l = parts(), p = l.find(x => x.id === id), r = p && rifas().find(x => x.id === p.rifa);
    if (!p || !r) return 'Participação não encontrada.';
    if (r.apuracao) return 'Esta rifa já foi apurada; não é possível alterar participações.';
    if (p.conta) db.set('contas', db.get('contas', []).filter(c => c.id !== p.conta));
    p.conta = ''; p.status = 'recusado'; p.motivo = motivo; p.recusadoPor = por; p.recusadoEm = new Date().toISOString();
    return db.set('rifa_part', l) ? '' : 'Não foi possível salvar.';
  }
  async function apurar(id, premios, meta) {
    const l = rifas(), r = l.find(x => x.id === id);
    if (!r || r.apuracao || r.cancelada) return 'Rifa não disponível para apuração.';
    if (hojeLocal() < r.dataSorteio) return 'Só é possível apurar a partir do dia do sorteio.';
    if (!premiosValidos(premios)) return 'Informe os 5 prêmios da Loteria Federal (5 dígitos cada, sem repetir).';
    const vend = confirmados(r.id).flatMap(p => p.numeros).sort((a, b) => a - b), v = vencedor(r.digitos, vend, premios);
    const dono = v && confirmados(r.id).find(p => p.numeros.includes(v.numero));
    let sha = ''; try { sha = window.PR_DADOS && window.PR_DADOS.sha256 ? await window.PR_DADOS.sha256(JSON.stringify({ rifa: r.id, vendidos: vend, premios })) : ''; } catch (e) { /* opcional */ }
    r.apuracao = { em: new Date().toISOString(), modo: meta.modo, por: meta.por || '', concurso: meta.concurso || '', fonte: meta.fonte || '', premios, numero: v ? v.numero : null, premioRef: v ? v.premioRef : null, regra: v ? v.regra : '', part: dono ? dono.id : '', vendidos: vend.length, sha256: sha };
    r.ativa = false;
    return db.set('rifas', l) ? '' : 'Não foi possível salvar a apuração.';
  }
  async function buscarResultado(r) {
    const fontes = ((window.PR_CONFIG_DADOS || {}).rifa || {}).fontesResultado || [];
    for (const url of fontes) {
      try {
        const ctl = typeof AbortController === 'function' ? new AbortController() : null, t = ctl && setTimeout(() => ctl.abort(), 8000);
        const resp = await fetch(url, { headers: { Accept: 'application/json' }, signal: ctl ? ctl.signal : undefined }); if (t) clearTimeout(t);
        if (!resp.ok) continue;
        const res = lerResultado(await resp.json());
        if (res && res.data === r.dataSorteio) return { ...res, fonte: url };
      } catch (e) { /* tenta a próxima fonte */ }
    }
    return null;
  }
  // Apuração automática: roda ao abrir o site/painel. Para cada rifa com o dia do sorteio chegado, busca o resultado e apura.
  async function apurarVencidas(forcar) {
    let mudou = false;
    for (const r0 of rifas().filter(x => !x.apuracao && !x.cancelada && hojeLocal() >= x.dataSorteio)) {
      if (!forcar && r0.tentativaEm && Date.now() - new Date(r0.tentativaEm).getTime() < 30 * 60000) continue;
      const res = await buscarResultado(r0);
      const l = rifas(), r = l.find(x => x.id === r0.id); if (!r || r.apuracao) continue;
      r.tentativaEm = new Date().toISOString(); r.tentativaMsg = res ? '' : 'Resultado da Loteria Federal ainda não disponível automaticamente.';
      db.set('rifas', l);
      if (res) { const e = await apurar(r.id, res.premios, { modo: 'automático', concurso: res.concurso, fonte: res.fonte }); mudou = mudou || !e; }
    }
    return mudou;
  }
  return { db, uid, safeUrl, rifas, parts, ativos, confirmados, ocupados, aberta, livres, inscrever, confirmar, recusar, apurar, buscarResultado, apurarVencidas, lancaConta };
}

const statusRifa = r => r.cancelada ? ['Cancelada', 'badge-emprestado'] : r.apuracao ? ['Apurada', 'badge-disponivel'] : !r.ativa ? ['Oculta no site', ''] : hojeLocal() < r.dataSorteio ? ['Aberta', 'badge-disponivel'] : ['Vendas encerradas', 'badge-emprestado'];
const ROT_PART = { pendente: ['Aguardando conferência', ''], confirmado: ['Confirmado', 'badge-disponivel'], recusado: ['Recusado', 'badge-emprestado'] };
const modoLocal = () => !(window.PR_DADOS && window.PR_DADOS.modo === 'remoto');
const AVISO_LOCAL = 'Enquanto o site estiver em modo local (dados no navegador), as inscrições feitas por visitantes ficam gravadas só no navegador de quem se inscreveu e NÃO chegam a esta tela. Para valer de verdade, é preciso ligar o servidor (veja docs/RIFA_SOLIDARIA.md).';
const textoResultado = (r, p, d, esc, fmtData) => {
  const a = r.apuracao; if (!a) return '';
  const pp = i => String(a.premios[i]);
  return a.numero == null
    ? `<p><strong>Sorteio realizado em ${fmtData(r.dataSorteio)}.</strong> Nenhuma participação confirmada; não há ganhador.</p>`
    : `<p><strong>Loteria Federal${a.concurso ? ' (concurso ' + esc(a.concurso) + ')' : ''} de ${fmtData(r.dataSorteio)}:</strong> 1º ${pp(0)} · 2º ${pp(1)} · 3º ${pp(2)} · 4º ${pp(3)} · 5º ${pp(4)}</p>
    <p class="rifa-ganhador">Número sorteado: <strong>${pad(a.numero, r.digitos)}</strong>${p ? ` — ${esc(d(p))}` : ''}</p>
    <p class="vazio">${a.regra === 'premio' ? `Número que termina igual ao ${a.premioRef}º prêmio da Federal.` : 'Nenhum dos cinco prêmios correspondia a número vendido; vale o próximo número vendido acima do 1º prêmio.'}</p>`;
};

window.PR_RIFA = {
  regra: { vencedor, lerResultado, premiosValidos, ultimos, REGRA },

  /* ===================== PAINEL (área restrita) ===================== */
  abrir(me, root, H) {
    const { esc, $, db, uid, hoje, fmtData, csv, reduz, MOEDA, money, safeUrl } = H;
    const A = api(H), brl = v => money(v, 'PIX');
    const SUB = [['rifas', 'Rifas'], ['part', 'Participantes'], ['sorteio', 'Sorteio'], ['arrec', 'Arrecadação'], ['uso', 'Uso do recurso']];
    let sub = 'rifas', editId = null, msg = '', filtroR = '', filtroS = '';
    const aviso = () => (msg ? `<p class="tip-box" role="status">${esc(msg)}</p>` : '') + (modoLocal() ? `<p class="tip-box" role="note"><i class="fas fa-exclamation-triangle"></i> ${esc(AVISO_LOCAL)}</p>` : '');
    const admin = me.nivel === 'administrador';
    const nomeRifa = id => (A.rifas().find(r => r.id === id) || {}).titulo || '(rifa removida)';
    const miniatura = r => r.foto && /^data:image\//.test(r.foto) ? `<img class="loja-thumb" src="${esc(r.foto)}" alt="Foto de ${esc(r.titulo)}">` : '<span class="loja-thumb loja-thumb-ph" aria-hidden="true"><i class="fas fa-ticket-alt"></i></span>';
    const lerArq = (file, max) => new Promise((ok, no) => {
      if (/^image\//.test(file.type)) return reduz(file, 1000, 0.65).then(ok, () => no('Não foi possível ler a imagem.'));
      if (file.type === 'application/pdf') { if (file.size > 600 * 1024) return no('PDF maior que 600 KB. Envie uma foto/captura do comprovante ou um PDF menor.'); const f = new FileReader(); f.onload = () => safeUrl(f.result) ? ok(f.result) : no('Tipo de arquivo não aceito.'); f.onerror = () => no('Não foi possível ler o arquivo.'); return f.readAsDataURL(file); }
      no('O comprovante precisa ser imagem (JPG, PNG) ou PDF.');
    });

    /* ---------- Rifas ---------- */
    const rifasTab = el => {
      const ed = editId ? A.rifas().find(r => r.id === editId) : null, travado = ed && A.ativos(ed.id).length > 0;
      const v = ed || { titulo: '', premio: '', preco: '', total: 100, dataSorteio: '', instrucoes: '', moedas: ['PIX'], ativa: true, foto: '' };
      const lista = A.rifas().slice().sort((a, b) => b.dataSorteio.localeCompare(a.dataSorteio));
      el.innerHTML = `<h3><i class="fas fa-ticket-alt"></i> ${ed ? 'Editar rifa' : 'Cadastrar rifa'}</h3>
      <p>Rifas solidárias do Parque. As marcadas como <strong>abertas no site</strong> aparecem em "Ajude o Parque &gt; Rifa Solidária" com o formulário de participação. O sorteio é pela <strong>Loteria Federal</strong> no dia informado.</p>${aviso()}
      <form id="fr" class="form-reserva" novalidate>
        <div class="form-row"><label for="r-t">Título da rifa *</label><input id="r-t" required maxlength="100" value="${esc(v.titulo)}" placeholder="Ex.: Rifa solidária - Cesta de produtos orgânicos"></div>
        <div class="form-row"><label for="r-d">O que será rifado (descrição do prêmio)</label><textarea id="r-d" rows="3" maxlength="600" placeholder="Descreva o prêmio, quem doou, como será entregue...">${esc(v.premio)}</textarea></div>
        <div class="form-row"><label for="r-f">Foto do prêmio</label><input id="r-f" type="file" accept="image/*">${v.foto ? '<label><input type="checkbox" id="r-xf"> Remover a foto atual</label>' : ''}</div>
        <div class="form-row"><label for="r-p">Valor de cada número (R$) *</label><input id="r-p" type="number" min="0.5" step="0.01" required value="${v.preco === '' ? '' : esc(v.preco)}" ${travado ? 'disabled' : ''}></div>
        <div class="form-row"><label for="r-n">Quantidade de números *</label><select id="r-n" ${travado ? 'disabled' : ''}>${TOTAIS.map(([t, d]) => `<option value="${t}"${t === v.total ? ' selected' : ''}>${t} números (${pad(0, d)} a ${pad(t - 1, d)})</option>`).join('')}</select>${travado ? '<small>Já há participações: valor e quantidade não podem mais mudar.</small>' : '<small>O número vencedor usa os últimos dígitos do 1º prêmio da Federal; por isso a quantidade é 10, 100 ou 1.000.</small>'}</div>
        <div class="form-row"><label for="r-dt">Dia do sorteio (Loteria Federal) *</label><input id="r-dt" type="date" required value="${esc(v.dataSorteio)}"><small>A Federal sorteia às quartas e aos sábados. As inscrições fecham no dia anterior ao sorteio.</small></div>
        <fieldset class="funcoes"><legend>Formas de pagamento aceitas *</legend>${Object.entries(MOEDA).map(([k, t]) => `<label><input type="checkbox" name="rm" value="${k}"${(v.moedas || []).includes(k) ? ' checked' : ''}> ${esc(t)}${PUBLICAS.includes(k) ? '' : ' (só registro manual na portaria)'}</label>`).join('')}</fieldset>
        <div class="form-row"><label for="r-i">Instruções de pagamento (aparecem para quem vai participar) *</label><textarea id="r-i" rows="4" maxlength="800" placeholder="Chave PIX, banco, titular. Para M$: conta no Banco Mumbuca. Ex.: PIX CNPJ 00.000.000/0001-00 - Instituto Pangeia">${esc(v.instrucoes)}</textarea></div>
        <div class="form-row"><label><input type="checkbox" id="r-pub"${v.ativa ? ' checked' : ''}> Aberta no site (Ajude o Parque &gt; Rifa Solidária)</label></div>
        <p class="form-erro" id="r-er" role="alert" hidden></p>
        <button class="btn-visit btn-large"><i class="fas ${ed ? 'fa-save' : 'fa-plus-circle'}"></i> ${ed ? 'Salvar alterações' : 'Cadastrar rifa'}</button>
        ${ed ? '<button type="button" class="btn-visit btn-large" id="r-x" style="background:#6c7a7b;margin-left:8px">Cancelar edição</button>' : ''}
      </form>
      <h4>Rifas cadastradas (${lista.length})</h4>${lista.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th></th><th>Rifa</th><th>Sorteio</th><th>Número</th><th>Confirmados / total</th><th>Situação</th><th>Ações</th></tr></thead><tbody>${lista.map(r => { const st = statusRifa(r); return `<tr><td>${miniatura(r)}</td><td>${esc(r.titulo)}</td><td>${fmtData(r.dataSorteio)}</td><td>${brl(r.preco)}</td><td>${A.confirmados(r.id).reduce((t, p) => t + p.numeros.length, 0)} / ${r.total}</td><td><span class="${st[1]}">${st[0]}</span></td>
        <td style="white-space:nowrap">${r.apuracao || r.cancelada ? '' : `<button class="btn-visit" data-pub="${r.id}" style="padding:5px 9px;font-size:.78rem">${r.ativa ? 'Fechar no site' : 'Abrir no site'}</button> <button class="btn-visit" data-can="${r.id}" style="padding:5px 9px;font-size:.78rem">Cancelar rifa</button> <button class="icon-btn edit" data-ed="${r.id}" title="Editar" aria-label="Editar ${esc(r.titulo)}"><i class="fas fa-edit"></i></button>`}
        ${A.parts().some(p => p.rifa === r.id) ? '' : `<button class="icon-btn" data-del="${r.id}" title="Excluir" aria-label="Excluir ${esc(r.titulo)}"><i class="fas fa-trash"></i></button>`}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="vazio">Nenhuma rifa cadastrada ainda.</p>'}`;
      msg = '';
      el.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { editId = b.dataset.ed; draw(); window.scrollTo(0, 0); });
      el.querySelectorAll('[data-pub]').forEach(b => b.onclick = () => { const l = A.rifas(), r = l.find(x => x.id === b.dataset.pub); r.ativa = !r.ativa; db.set('rifas', l); msg = r.titulo + (r.ativa ? ' foi aberta no site.' : ' foi fechada no site.'); draw(); });
      el.querySelectorAll('[data-can]').forEach(b => b.onclick = () => {
        const r = A.rifas().find(x => x.id === b.dataset.can), n = A.confirmados(r.id).length;
        if (!confirm(`Cancelar a rifa "${r.titulo}"?` + (n ? ` Há ${n} participação(ões) confirmada(s): os pagamentos precisarão ser devolvidos (use Recusar/estornar em Participantes para tirar cada lançamento da Prestação de Contas).` : ''))) return;
        const l = A.rifas(), x = l.find(y => y.id === r.id); x.cancelada = true; x.ativa = false; db.set('rifas', l); msg = 'Rifa cancelada.'; draw();
      });
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (!confirm('Excluir esta rifa?')) return; db.set('rifas', A.rifas().filter(x => x.id !== b.dataset.del)); draw(); });
      const x = $('#r-x', el); if (x) x.onclick = () => { editId = null; draw(); };
      $('#fr', el).onsubmit = async e => {
        e.preventDefault();
        const er = $('#r-er', el), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
        const titulo = $('#r-t', el).value.trim(), dt = $('#r-dt', el).value, ins = $('#r-i', el).value.trim(), arq = $('#r-f', el).files[0];
        const moedas = [...el.querySelectorAll('[name=rm]:checked')].map(c => c.value);
        const preco = travado ? ed.preco : parseFloat($('#r-p', el).value), total = travado ? ed.total : parseInt($('#r-n', el).value, 10);
        if (!titulo) return falha('Informe o título da rifa.');
        if (!(preco >= 0.5)) return falha('Informe o valor de cada número (mínimo R$ 0,50).');
        if (!dt) return falha('Informe o dia do sorteio.');
        if (!(ed && dt === ed.dataSorteio) && dt <= hojeLocal()) return falha('O dia do sorteio precisa ser depois de hoje (as inscrições fecham no dia anterior).');
        if (!moedas.length) return falha('Marque ao menos uma forma de pagamento.');
        if (!ins) return falha('Informe as instruções de pagamento (chave PIX, banco, titular).');
        if (!(ed && dt === ed.dataSorteio) && !ehFederal(dt) && !confirm('A Loteria Federal sorteia às quartas e aos sábados e essa data cai em outro dia. Continuar mesmo assim?')) return;
        let foto = ed ? ed.foto || '' : '';
        if ($('#r-xf', el) && $('#r-xf', el).checked) foto = '';
        if (arq) { if (!/^image\//.test(arq.type)) return falha('A foto precisa ser uma imagem.'); try { foto = await reduz(arq, 800, 0.78); } catch (x2) { return falha('Não foi possível ler a imagem.'); } }
        const dg = (TOTAIS.find(t => t[0] === total) || [100, 2])[1];
        const dados = { titulo, premio: $('#r-d', el).value.trim(), foto, preco: r2(preco), total, digitos: dg, dataSorteio: dt, moedas, instrucoes: ins, ativa: $('#r-pub', el).checked };
        const l = A.rifas(); if (ed) Object.assign(l.find(r => r.id === ed.id), dados); else l.push({ id: uid(), ...dados, por: me.nome, criadoEm: hoje() });
        if (!db.set('rifas', l)) return falha('Não foi possível salvar (espaço do navegador cheio?). Tente uma foto menor ou sem foto.');
        msg = ed ? 'Rifa atualizada.' : 'Rifa cadastrada.' + (dados.ativa ? ' Ela já aparece no site.' : ''); editId = null; draw();
      };
    };

    /* ---------- Participantes ---------- */
    const comprovanteLink = p => p.comprovante && safeUrl(p.comprovante) ? `<a href="${esc(p.comprovante)}" download="comprovante-${esc(p.codigo)}">Baixar</a>` : '-';
    const part = el => {
      const rs = A.rifas().slice().sort((a, b) => b.dataSorteio.localeCompare(a.dataSorteio));
      let lista = A.parts().slice().sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
      if (filtroR) lista = lista.filter(p => p.rifa === filtroR);
      if (filtroS) lista = lista.filter(p => p.status === filtroS);
      const pend = A.parts().filter(p => p.status === 'pendente').length;
      const abertas = rs.filter(r => !r.apuracao && !r.cancelada);
      el.innerHTML = `<h3><i class="fas fa-users"></i> Participantes</h3>${aviso()}
      ${pend ? `<p class="tip-box" role="status"><i class="fas fa-hourglass-half"></i> <strong>${pend}</strong> participação(ões) aguardando conferência do comprovante. Só números <strong>confirmados</strong> concorrem ao sorteio; confira tudo antes do dia do sorteio.</p>` : ''}
      <div class="rc-filtros"><div class="form-row"><label for="pf-r">Rifa</label><select id="pf-r"><option value="">Todas</option>${rs.map(r => `<option value="${r.id}"${r.id === filtroR ? ' selected' : ''}>${esc(r.titulo)}</option>`).join('')}</select></div>
      <div class="form-row"><label for="pf-s">Situação</label><select id="pf-s"><option value="">Todas</option>${Object.entries(ROT_PART).map(([k, t]) => `<option value="${k}"${k === filtroS ? ' selected' : ''}>${t[0]}</option>`).join('')}</select></div></div>
      ${lista.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Data</th><th>Rifa</th><th>Participante</th><th>Contato</th><th>Números</th><th>Valor</th><th>Comprovante</th><th>Situação</th><th>Ações</th></tr></thead><tbody>${lista.map(p => { const r = A.rifas().find(x => x.id === p.rifa) || { digitos: 2 }, st = ROT_PART[p.status], wa = soDig(p.whatsapp); return `<tr><td>${fmtData(p.criadoEm.slice(0, 10))}<br><small>${esc(p.codigo)}</small></td><td>${esc(nomeRifa(p.rifa))}</td><td>${esc(p.nome)}${p.origem === 'manual' ? '<br><small>registro manual</small>' : ''}</td>
        <td><small>Cel.: ${esc(p.celular || '-')}<br>${wa ? `<a href="https://wa.me/${wa.length <= 11 ? '55' + wa : wa}" target="_blank" rel="noopener">WhatsApp: ${esc(p.whatsapp)}</a>` : 'WhatsApp: -'}<br>${p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : '-'}</small></td>
        <td>${p.numeros.map(n => pad(n, r.digitos)).join(', ')}</td><td>${money(p.total, p.moeda)}<br><small>${esc(MOEDA[p.moeda])}</small></td><td>${comprovanteLink(p)}</td>
        <td><span class="${st[1]}">${st[0]}</span>${p.motivo ? `<br><small>${esc(p.motivo)}</small>` : ''}</td>
        <td style="white-space:nowrap">${p.status === 'pendente' ? `<button class="btn-visit" data-ok="${p.id}" style="padding:5px 9px;font-size:.78rem">Confirmar</button> <button class="btn-visit" data-no="${p.id}" style="padding:5px 9px;font-size:.78rem;background:#b3261e">Recusar</button>` : p.status === 'confirmado' ? `<button class="btn-visit" data-no="${p.id}" style="padding:5px 9px;font-size:.78rem;background:#6c7a7b" title="Estornar: tira o lançamento da Prestação de Contas e libera os números">Estornar</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="vazio">Nenhuma participação encontrada.</p>'}
      <details style="margin-top:18px"><summary><strong>Registrar participação manual</strong> (venda presencial, dinheiro em espécie)</summary>
      ${abertas.length ? `<form id="fm" class="form-reserva" novalidate>
        <div class="form-row"><label for="m-r">Rifa *</label><select id="m-r">${abertas.map(r => `<option value="${r.id}">${esc(r.titulo)} (${brl(r.preco)} por número)</option>`).join('')}</select></div>
        <div class="form-row"><label for="m-n">Nome completo *</label><input id="m-n" maxlength="100"></div>
        <div class="form-row"><label for="m-w">WhatsApp ou celular *</label><input id="m-w" maxlength="20" inputmode="tel"></div>
        <div class="form-row"><label for="m-e">E-mail (opcional)</label><input id="m-e" type="email" maxlength="120"></div>
        <div class="form-row"><label for="m-q">Quantidade de números *</label><input id="m-q" type="number" min="1" max="20" value="1"></div>
        <div class="form-row"><label for="m-m">Forma de pagamento *</label><select id="m-m">${Object.entries(MOEDA).map(([k, t]) => `<option value="${k}">${esc(t)}</option>`).join('')}</select></div>
        <div class="form-row"><label for="m-f">Comprovante (opcional)</label><input id="m-f" type="file" accept=".pdf,image/*"></div>
        <p class="tip-box" role="note"><i class="fas fa-info-circle"></i> A participação manual já entra <strong>confirmada</strong> e é lançada na Prestação de Contas.</p>
        <p class="form-erro" id="m-er" role="alert" hidden></p>
        <button class="btn-visit btn-large"><i class="fas fa-check"></i> Registrar e confirmar</button></form>` : '<p class="vazio">Não há rifa aberta para registro.</p>'}</details>`;
      msg = '';
      $('#pf-r', el).onchange = e => { filtroR = e.target.value; draw(); };
      $('#pf-s', el).onchange = e => { filtroS = e.target.value; draw(); };
      el.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => { const e = A.confirmar(b.dataset.ok, me.nome); msg = e || 'Participação confirmada e lançada na Prestação de Contas.'; draw(); });
      el.querySelectorAll('[data-no]').forEach(b => b.onclick = () => {
        const p = A.parts().find(x => x.id === b.dataset.no), conf = p.status === 'confirmado';
        const m = prompt(conf ? 'Estornar esta participação confirmada? O lançamento sai da Prestação de Contas e os números voltam a ficar livres. Motivo:' : 'Recusar esta participação (os números voltam a ficar livres). Motivo (ex.: comprovante ilegível, valor incorreto):', '');
        if (m === null) return; if (m.trim().length < 3) { msg = 'Informe um motivo.'; draw(); return; }
        const e = A.recusar(p.id, m.trim(), me.nome); msg = e || (conf ? 'Participação estornada.' : 'Participação recusada.'); draw();
      });
      const fm = $('#fm', el); if (!fm) return;
      fm.onsubmit = async e => {
        e.preventDefault();
        const er = $('#m-er', el), falha = t => { er.textContent = t; er.hidden = false; }; er.hidden = true;
        const nome = $('#m-n', el).value.trim(), w = $('#m-w', el).value.trim(), q = parseInt($('#m-q', el).value, 10), arq = $('#m-f', el).files[0];
        if (!nome) return falha('Informe o nome completo.');
        if (soDig(w).length < 10) return falha('Informe um WhatsApp ou celular com DDD.');
        let comp = ''; if (arq) { try { comp = await lerArq(arq); } catch (x) { return falha(String(x)); } }
        const res = A.inscrever({ manual: true, rifa: $('#m-r', el).value, nome, celular: w, whatsapp: w, email: $('#m-e', el).value.trim(), qtd: q, moeda: $('#m-m', el).value, comprovante: comp, consentimento: true, por: me.nome });
        if (res.erro) return falha(res.erro);
        const r = A.rifas().find(x => x.id === res.part.rifa);
        msg = `Participação registrada e confirmada. Números de ${nome}: ${res.part.numeros.map(n => pad(n, r.digitos)).join(', ')}.`; draw();
      };
    };

    /* ---------- Sorteio ---------- */
    const sorteio = el => {
      const rs = A.rifas().filter(r => !r.cancelada).sort((a, b) => a.dataSorteio.localeCompare(b.dataSorteio));
      const dono = (r) => r.apuracao && A.parts().find(p => p.id === r.apuracao.part);
      el.innerHTML = `<h3><i class="fas fa-dice"></i> Sorteio pela Loteria Federal</h3>${aviso()}
      <p class="tip-box" role="note"><i class="fas fa-balance-scale"></i> <strong>Regra (também publicada no site):</strong> ${esc(REGRA)}</p>
      <p>A apuração é <strong>automática</strong>: a partir do dia do sorteio, assim que o resultado da Loteria Federal estiver disponível, o sistema aplica a regra e registra o ganhador. Se a busca automática não conseguir o resultado, digite os 5 prêmios abaixo. Como o site hoje funciona sem servidor, a apuração roda quando alguém abre o site ou este painel; veja <code>docs/RIFA_SOLIDARIA.md</code> para a execução totalmente automática.</p>
      ${rs.length ? rs.map(r => {
        const a = r.apuracao, pend = A.parts().filter(p => p.rifa === r.id && p.status === 'pendente').length, chegou = hojeLocal() >= r.dataSorteio;
        return `<div class="card" style="margin:14px 0"><h4 style="margin-top:0">${esc(r.titulo)} <small>— sorteio em ${fmtData(r.dataSorteio)}</small></h4>
        ${a ? `${textoResultado(r, dono(r), p => `${p.nome} · WhatsApp ${p.whatsapp} · ${p.email || 'sem e-mail'} (código ${p.codigo})`, esc, fmtData)}
          <p class="vazio">Apurada em ${esc(a.em.slice(0, 16).replace('T', ' '))} (${esc(a.modo)}${a.por ? ' por ' + esc(a.por) : ''}). ${a.vendidos} número(s) confirmado(s) concorreram.${a.sha256 ? ' Selo de conferência: ' + esc(a.sha256.slice(0, 16)) + '…' : ''}</p>
          ${(r.historico || []).length ? `<details><summary>Apurações anuladas (${r.historico.length})</summary><ul>${r.historico.map(h => `<li>${esc(h.em.slice(0, 16).replace('T', ' '))} por ${esc(h.por)}: ${esc(h.motivo)} (número ${h.numero == null ? '-' : h.numero})</li>`).join('')}</ul></details>` : ''}
          ${admin ? `<button class="btn-visit" data-an="${r.id}" style="padding:5px 9px;font-size:.78rem;background:#6c7a7b">Anular apuração e refazer</button>` : '<p class="vazio">Só o Administrador pode anular uma apuração.</p>'}`
        : `<p>${chegou ? 'Dia do sorteio chegou.' : 'Aguardando o dia do sorteio.'} ${pend ? `<strong>${pend}</strong> participação(ões) ainda sem conferência: <em>só as confirmadas concorrem</em>.` : ''}</p>
          ${r.tentativaMsg ? `<p class="vazio">${esc(r.tentativaMsg)}</p>` : ''}
          ${chegou ? `<div class="form-row"><label>Resultado da Loteria Federal (1º ao 5º prêmio, 5 dígitos cada)</label><div style="display:flex;gap:6px;flex-wrap:wrap">${[0, 1, 2, 3, 4].map(i => `<input data-r="${r.id}" data-i="${i}" inputmode="numeric" maxlength="5" size="6" placeholder="${i + 1}º" aria-label="${i + 1}º prêmio">`).join('')}<input data-co="${r.id}" maxlength="10" size="10" placeholder="Concurso" aria-label="Número do concurso"></div></div>
          <p class="form-erro" data-er="${r.id}" role="alert" hidden></p>
          <button class="btn-visit" data-bu="${r.id}"><i class="fas fa-search"></i> Buscar resultado automaticamente</button> <button class="btn-visit" data-ap="${r.id}"><i class="fas fa-check"></i> Apurar com os números digitados</button>` : '<p class="vazio">A apuração fica disponível a partir do dia do sorteio.</p>'}`}</div>`;
      }).join('') : '<p class="vazio">Nenhuma rifa cadastrada.</p>'}`;
      msg = '';
      const falha = (id, m) => { const e = el.querySelector(`[data-er="${id}"]`); e.textContent = m; e.hidden = false; };
      el.querySelectorAll('[data-bu]').forEach(b => b.onclick = async () => {
        b.disabled = true; b.textContent = 'Buscando...';
        const ok = await A.apurarVencidas(true);
        msg = ok ? 'Resultado encontrado e sorteio apurado automaticamente.' : 'Não foi possível obter o resultado automaticamente (serviço indisponível, bloqueado pelo navegador ou resultado do dia ainda não publicado). Digite os 5 prêmios.'; draw();
      });
      el.querySelectorAll('[data-ap]').forEach(b => b.onclick = async () => {
        const id = b.dataset.ap, pr = [0, 1, 2, 3, 4].map(i => el.querySelector(`[data-r="${id}"][data-i="${i}"]`).value.trim());
        if (!premiosValidos(pr)) return falha(id, 'Digite os 5 prêmios da Loteria Federal: 5 dígitos cada, todos diferentes.');
        if (!confirm('Conferir: ' + pr.map((x, i) => `${i + 1}º ${x}`).join(' · ') + '. Apurar o sorteio com estes números?')) return;
        const e = await A.apurar(id, pr, { modo: 'manual', por: me.nome, concurso: el.querySelector(`[data-co="${id}"]`).value.trim() });
        if (e) return falha(id, e); msg = 'Sorteio apurado.'; draw();
      });
      el.querySelectorAll('[data-an]').forEach(b => b.onclick = () => {
        const m = prompt('Anular a apuração desta rifa? O resultado fica guardado no histórico. Motivo (obrigatório):', ''); if (m === null) return;
        if (m.trim().length < 5) { msg = 'Informe o motivo da anulação (pelo menos 5 letras).'; draw(); return; }
        const l = A.rifas(), r = l.find(x => x.id === b.dataset.an); r.historico = (r.historico || []).concat({ em: new Date().toISOString(), por: me.nome, motivo: m.trim(), numero: r.apuracao.numero, premios: r.apuracao.premios });
        r.apuracao = null; r.tentativaEm = new Date(Date.now() + 365 * 86400000).toISOString(); // evita nova busca automática até o responsável decidir
        db.set('rifas', l); msg = 'Apuração anulada. Digite o resultado correto para apurar de novo.'; draw();
      });
    };

    /* ---------- Arrecadação ---------- */
    const arrec = el => {
      const rs = A.rifas().slice().sort((a, b) => b.dataSorteio.localeCompare(a.dataSorteio)), tot = {}, pend = {};
      A.parts().forEach(p => { if (p.status === 'confirmado') tot[p.moeda] = (tot[p.moeda] || 0) + p.total; else if (p.status === 'pendente') pend[p.moeda] = (pend[p.moeda] || 0) + p.total; });
      const semLanc = A.parts().filter(p => p.status === 'confirmado' && !(p.conta && db.get('contas', []).some(c => c.id === p.conta)));
      el.innerHTML = `<h3><i class="fas fa-chart-bar"></i> Arrecadação das rifas</h3>${aviso()}
      <div class="totais">${Object.keys(MOEDA).filter(m => tot[m]).map(m => `<div><span>Arrecadado (confirmado): ${esc(MOEDA[m])}</span><strong>${money(tot[m], m)}</strong></div>`).join('') || '<div><span>Arrecadado (confirmado)</span><strong>R$ 0,00</strong></div>'}${Object.keys(MOEDA).filter(m => pend[m]).map(m => `<div><span>Aguardando conferência: ${esc(MOEDA[m])}</span><strong>${money(pend[m], m)}</strong></div>`).join('')}</div>
      <p class="tip-box" role="note"><i class="fas fa-info-circle"></i> Cada participação confirmada é lançada automaticamente na Prestação de Contas (origem Rifa Solidária) e entra na planilha consolidada (Relatórios Consolidados &gt; Orçamento e Fluxo Financeiro, linha Rifa Solidária em "Ajude o Parque"). Valores aguardando conferência ainda não contam.</p>
      ${semLanc.length ? `<p class="form-erro" role="alert">Atenção: ${semLanc.length} participação(ões) confirmada(s) sem lançamento na Prestação de Contas. <button class="btn-visit" id="ar-l" style="padding:4px 8px;font-size:.75rem">Lançar agora</button></p>` : '<p class="vazio">Conferência: todas as participações confirmadas estão lançadas na Prestação de Contas.</p>'}
      <p><button class="btn-visit" id="ar-p"><i class="fas fa-print"></i> Imprimir</button> <button class="btn-visit" id="ar-c"><i class="fas fa-file-csv"></i> Baixar participantes (CSV)</button></p>
      ${rs.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Rifa</th><th>Sorteio</th><th>Números confirmados</th><th>Aguardando</th><th>Arrecadado</th><th>Situação</th></tr></thead><tbody>${rs.map(r => { const c = A.confirmados(r.id), pe = A.parts().filter(p => p.rifa === r.id && p.status === 'pendente'), st = statusRifa(r); const pm = {}; c.forEach(p => pm[p.moeda] = (pm[p.moeda] || 0) + p.total); return `<tr><td>${esc(r.titulo)}</td><td>${fmtData(r.dataSorteio)}</td><td>${c.reduce((t, p) => t + p.numeros.length, 0)} de ${r.total}</td><td>${pe.reduce((t, p) => t + p.numeros.length, 0)}</td><td>${Object.keys(pm).map(m => money(pm[m], m)).join('<br>') || '-'}</td><td><span class="${st[1]}">${st[0]}</span></td></tr>`; }).join('')}</tbody></table></div>` : '<p class="vazio">Nenhuma rifa cadastrada.</p>'}`;
      msg = '';
      $('#ar-p', el).onclick = () => window.print();
      $('#ar-c', el).onclick = () => {
        const rows = [['Código', 'Rifa', 'Data', 'Nome', 'Celular', 'WhatsApp', 'E-mail', 'Números', 'Valor', 'Forma de pagamento', 'Situação', 'Origem']].concat(A.parts().map(p => { const r = A.rifas().find(x => x.id === p.rifa) || { digitos: 2 }; return [p.codigo, nomeRifa(p.rifa), p.criadoEm.slice(0, 10), p.nome, p.celular, p.whatsapp, p.email, p.numeros.map(n => pad(n, r.digitos)).join(' '), p.total, MOEDA[p.moeda], ROT_PART[p.status][0], p.origem]; }));
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = 'participantes-rifa-solidaria.csv'; a.click();
      };
      const bl = $('#ar-l', el); if (bl) bl.onclick = () => {
        const l = A.parts(); let n = 0;
        l.filter(p => p.status === 'confirmado' && !(p.conta && db.get('contas', []).some(c => c.id === p.conta))).forEach(p => { const r = A.rifas().find(x => x.id === p.rifa); if (r) { p.conta = A.lancaConta(p, r); if (p.conta) n++; } });
        db.set('rifa_part', l); msg = n + ' lançamento(s) feito(s) na Prestação de Contas.'; draw();
      };
    };

    /* Uso do recurso: para cada rifa finalizada (apurada), o texto e a foto que comprovam em que o dinheiro foi usado. Aparece no site, dentro da rifa. */
    const uso = el => {
      const fin = A.rifas().filter(r => r.apuracao).sort((a, b) => b.dataSorteio.localeCompare(a.dataSorteio));
      const faltam = A.rifas().filter(r => !r.apuracao && !r.cancelada).length;
      const foto = r => r.uso && r.uso.foto && /^data:image\//.test(r.uso.foto) ? r.uso.foto : '';
      el.innerHTML = `<h3><i class="fas fa-receipt"></i> Uso do recurso arrecadado</h3>${aviso()}
      <p>Quando a rifa é finalizada (sorteio apurado), registre aqui <strong>para que o recurso foi usado</strong> e anexe uma <strong>foto que comprove</strong> (compra, obra, material, nota...). O texto e a foto são publicados no site, dentro da própria rifa, junto com o resultado.</p>
      ${faltam ? `<p class="vazio">${faltam} rifa(s) ainda não finalizada(s): aparecem aqui depois que o sorteio for apurado.</p>` : ''}
      ${fin.length ? fin.map(r => { const f = foto(r), u = r.uso || {}; return `<div class="card" style="margin:14px 0"><h4 style="margin-top:0">${esc(r.titulo)} <small>— sorteio em ${fmtData(r.dataSorteio)}</small></h4>
        <form data-uso="${r.id}" class="form-reserva" novalidate>
          <div class="form-row"><label for="u-t-${r.id}">Para que o recurso foi usado</label><textarea id="u-t-${r.id}" rows="4" maxlength="2000" placeholder="Ex.: Compra de 20 mudas nativas e ferramentas de jardinagem para a entrada do Parque.">${esc(u.texto || '')}</textarea></div>
          <div class="form-row"><label for="u-f-${r.id}">Foto que comprova o uso</label>${f ? `<img class="loja-foto" style="max-width:260px" src="${esc(f)}" alt="Foto atual do uso do recurso">` : ''}<input id="u-f-${r.id}" type="file" accept="image/*">${f ? `<label><input type="checkbox" data-xf="${r.id}"> Remover a foto atual</label>` : ''}</div>
          ${u.em ? `<p class="vazio">Última atualização: ${esc(fmtData(u.em))}${u.por ? ' por ' + esc(u.por) : ''}. ${u.texto || f ? 'Publicado no site.' : ''}</p>` : '<p class="vazio">Ainda não publicado no site.</p>'}
          <p class="form-erro" data-er="${r.id}" role="alert" hidden></p>
          <button class="btn-visit"><i class="fas fa-save"></i> Salvar e publicar</button>
        </form></div>`; }).join('') : '<p class="vazio">Nenhuma rifa finalizada ainda.</p>'}`;
      el.querySelectorAll('[data-uso]').forEach(f => f.onsubmit = async e => {
        e.preventDefault();
        const id = f.dataset.uso, er = el.querySelector(`[data-er="${id}"]`), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
        const l = A.rifas(), r = l.find(x => x.id === id); if (!r || !r.apuracao) return falha('Só rifas finalizadas podem receber o uso do recurso.');
        const texto = el.querySelector(`#u-t-${id}`).value.trim(), arq = el.querySelector(`#u-f-${id}`).files[0], xf = el.querySelector(`[data-xf="${id}"]`);
        let fto = r.uso && r.uso.foto || '';
        if (xf && xf.checked) fto = '';
        if (arq) { if (!/^image\//.test(arq.type)) return falha('A foto precisa ser uma imagem (JPG ou PNG).'); try { fto = await reduz(arq, 900, 0.75); } catch (x2) { return falha('Não foi possível ler a imagem.'); } }
        if (!texto && !fto) return falha('Escreva para que o recurso foi usado e/ou anexe uma foto.');
        r.uso = { texto, foto: fto, em: hoje(), por: me.nome };
        if (!db.set('rifas', l)) return falha('Não foi possível salvar (espaço do navegador cheio?). Tente uma foto menor.');
        msg = 'Uso do recurso salvo e publicado na rifa "' + r.titulo + '".'; draw();
      });
    };

    const draw = () => {
      root.innerHTML = `<div class="tabs sub" role="tablist" aria-label="Rifa Solidária">${SUB.map(t => `<button class="tab-btn${t[0] === sub ? ' active' : ''}" data-rf="${t[0]}">${t[1]}</button>`).join('')}</div><div id="rf-sub"></div>`;
      root.querySelectorAll('[data-rf]').forEach(b => b.onclick = () => { sub = b.dataset.rf; editId = null; msg = ''; draw(); });
      ({ rifas: rifasTab, part, sorteio, arrec, uso })[sub]($('#rf-sub', root));
    };
    draw();
    A.apurarVencidas().then(m => { if (m && root.isConnected) { msg = 'Um sorteio foi apurado automaticamente com o resultado da Loteria Federal.'; sub = 'sorteio'; draw(); } });
  },

  /* ===================== PÁGINA PÚBLICA ===================== */
  publica(H) {
    const el = document.getElementById('rifas'); if (!el) return;
    const { esc, fmtData, reduz, MOEDA, money, safeUrl } = H;
    const A = api(H), brl = v => money(v, 'PIX');
    const S = { sel: '', ok: null, erro: '', consulta: null };
    const lerArq = file => new Promise((ok, no) => {
      if (/^image\//.test(file.type)) return reduz(file, 1000, 0.65).then(ok, () => no('Não foi possível ler a imagem.'));
      if (file.type === 'application/pdf') { if (file.size > 600 * 1024) return no('PDF maior que 600 KB. Envie uma foto ou captura de tela do comprovante.'); const f = new FileReader(); f.onload = () => safeUrl(f.result) ? ok(f.result) : no('Tipo de arquivo não aceito.'); f.onerror = () => no('Não foi possível ler o arquivo.'); return f.readAsDataURL(file); }
      no('O comprovante precisa ser imagem (JPG, PNG) ou PDF.');
    });
    const num = (r, n) => pad(n, r.digitos);
    const grade = r => { if (r.total > 100) return ''; const oc = A.ocupados(r.id); return `<div class="rifa-grid" role="img" aria-label="Números da rifa: ${oc.size} reservados de ${r.total}">${Array.from({ length: r.total }, (_, n) => `<span class="rifa-n${oc.has(n) ? ' ocupado' : ''}">${num(r, n)}</span>`).join('')}</div>`; };
    const usoPublico = r => {
      const u = r.uso; if (!r.apuracao || !u) return '';
      const f = u.foto && /^data:image\//.test(u.foto) ? `<img class="loja-foto" src="${esc(u.foto)}" alt="Foto que comprova o uso do recurso da rifa ${esc(r.titulo)}" loading="lazy">` : '';
      if (!u.texto && !f) return '';
      return `<div class="rifa-uso" style="margin-top:12px;border-top:1px solid var(--border-color);padding-top:10px"><p><strong><i class="fas fa-receipt"></i> Uso do recurso arrecadado</strong></p>${u.texto ? `<p style="white-space:pre-line">${esc(u.texto)}</p>` : ''}${f}</div>`;
    };
    const cartao = r => {
      const foto = r.foto && /^data:image\//.test(r.foto) ? `<img class="loja-foto" src="${esc(r.foto)}" alt="${esc(r.titulo)}" loading="lazy">` : '<div class="loja-foto loja-foto-ph" role="img" aria-label="Prêmio sem foto"><i class="fas fa-ticket-alt"></i></div>';
      const aberta = A.aberta(r), a = r.apuracao, ganhador = a && A.parts().find(p => p.id === a.part);
      return `<div class="card loja-card rifa-card">${foto}<h3>${esc(r.titulo)}</h3>${r.premio ? `<p>${esc(r.premio)}</p>` : ''}
        <p class="loja-preco">${brl(r.preco)} por número</p><p>Sorteio pela <strong>Loteria Federal</strong> em <strong>${fmtData(r.dataSorteio)}</strong>. ${A.livres(r)} de ${r.total} números disponíveis.</p>${grade(r)}
        ${a ? `<div class="rifa-resultado">${textoResultado(r, ganhador, p => nomePublico(p.nome), esc, fmtData)}${usoPublico(r)}</div>` : aberta ? `<button class="btn-visit" data-sel="${r.id}">Quero participar</button>` : '<span class="badge-emprestado">Inscrições encerradas · aguardando o sorteio</span>'}</div>`;
    };
    const formulario = r => {
      const moedas = (r.moedas || []).filter(m => PUBLICAS.includes(m));
      return `<section class="card" id="rifa-form-box" style="margin-top:18px"><h3><i class="fas fa-ticket-alt"></i> Participar: ${esc(r.titulo)}</h3>
        <p><strong>Como funciona:</strong> 1) pague pela forma indicada; 2) preencha seus dados e anexe o comprovante; 3) você recebe seu(s) número(s) na hora. Eles passam a concorrer quando a Comissão conferir o pagamento.</p>
        <div class="tip-box rifa-pay"><strong>Instruções de pagamento</strong><br>${esc(r.instrucoes)}</div>
        <form id="rifa-form" class="form-reserva" novalidate>
          <div class="form-row"><label for="p-n">Nome completo *</label><input id="p-n" maxlength="100" autocomplete="name" required></div>
          <div class="form-row"><label for="p-c">Celular *</label><input id="p-c" maxlength="20" inputmode="tel" autocomplete="tel" placeholder="(21) 99999-9999" required></div>
          <div class="form-row"><label for="p-w">WhatsApp *</label><input id="p-w" maxlength="20" inputmode="tel" placeholder="(21) 99999-9999" required><label><input type="checkbox" id="p-mesmo"> É o mesmo número do celular</label></div>
          <div class="form-row"><label for="p-e">E-mail *</label><input id="p-e" type="email" maxlength="120" autocomplete="email" required></div>
          <div class="form-row"><label for="p-q">Quantos números? *</label><input id="p-q" type="number" min="1" max="${Math.min(20, A.livres(r))}" value="1" required></div>
          <div class="form-row"><label for="p-m">Forma de pagamento usada *</label><select id="p-m">${moedas.map(m => `<option value="${m}">${esc(MOEDA[m])}</option>`).join('')}</select></div>
          <p id="p-tot" aria-live="polite"><strong></strong></p>
          <div class="form-row"><label for="p-f">Comprovante de pagamento * (imagem ou PDF)</label><input id="p-f" type="file" accept=".pdf,image/*" required></div>
          <div class="form-row"><label><input type="checkbox" id="p-ok"> ${esc(CONSENTIMENTO)} *</label></div>
          <p class="form-erro" id="p-er" role="alert" hidden></p>
          <button class="btn-visit btn-large"><i class="fas fa-check"></i> Enviar e receber meus números</button>
        </form></section>`;
    };
    const draw = () => {
      const rs = A.rifas().filter(r => !r.cancelada && (r.ativa || r.apuracao)).sort((a, b) => a.dataSorteio.localeCompare(b.dataSorteio));
      const sel = rs.find(r => r.id === S.sel && A.aberta(r));
      el.innerHTML = `${modoLocal() ? `<p class="tip-box" role="note"><i class="fas fa-exclamation-triangle"></i> <strong>Modo de demonstração:</strong> as inscrições ficam gravadas só neste navegador e ainda não chegam à Comissão. Para participar de verdade, fale com a Comissão do Parque.</p>` : ''}
      ${rs.length ? `<h3 class="subsection-title">Rifas em andamento e resultados</h3><div class="content-grid">${rs.map(cartao).join('')}</div>
      <details class="tip-box" style="margin-top:14px"><summary><strong>Como é feito o sorteio</strong></summary><p>${esc(REGRA)}</p></details>` : ''}
      ${S.ok ? `<section class="card rifa-ok" role="status" style="margin-top:18px"><h3><i class="fas fa-check-circle"></i> Inscrição recebida!</h3><p>Seu código: <strong>${esc(S.ok.part.codigo)}</strong></p><p>Seu(s) número(s) na rifa <em>${esc(S.ok.rifa.titulo)}</em>: <strong class="rifa-ganhador">${S.ok.part.numeros.map(n => num(S.ok.rifa, n)).join(' · ')}</strong></p><p>Eles passam a concorrer ao sorteio de <strong>${fmtData(S.ok.rifa.dataSorteio)}</strong> quando a Comissão conferir seu comprovante. Guarde este código.</p></section>` : sel ? formulario(sel) : ''}
      ${rs.length ? `<section class="card" style="margin-top:18px"><h3><i class="fas fa-search"></i> Consultar meus números</h3><form id="rifa-cons" class="form-reserva" novalidate><div class="form-row"><label for="k-e">E-mail usado na inscrição</label><input id="k-e" type="email"></div><div class="form-row"><label for="k-c">Celular ou WhatsApp usado</label><input id="k-c" inputmode="tel"></div><button class="btn-visit">Consultar</button></form>
      ${S.consulta ? (S.consulta.length ? `<table class="doc-table"><thead><tr><th>Rifa</th><th>Números</th><th>Situação</th></tr></thead><tbody>${S.consulta.map(p => { const r = A.rifas().find(x => x.id === p.rifa); return `<tr><td>${esc(r ? r.titulo : '')}</td><td>${p.numeros.map(n => num(r || { digitos: 2 }, n)).join(', ')}</td><td>${esc(ROT_PART[p.status][0])}</td></tr>`; }).join('')}</tbody></table>` : '<p class="vazio">Nenhuma inscrição encontrada com estes dados.</p>') : ''}</section>` : ''}`;
      el.querySelectorAll('[data-sel]').forEach(b => b.onclick = () => { S.sel = b.dataset.sel; S.ok = null; draw(); const f = document.getElementById('rifa-form-box'); if (f) f.scrollIntoView({ behavior: 'smooth' }); });
      const kc = document.getElementById('rifa-cons');
      if (kc) kc.onsubmit = e => {
        e.preventDefault();
        const em = document.getElementById('k-e').value.trim().toLowerCase(), ce = soDig(document.getElementById('k-c').value);
        S.consulta = em && ce.length >= 8 ? A.parts().filter(p => String(p.email).toLowerCase() === em && [p.celular, p.whatsapp].some(t => soDig(t) === ce)) : []; draw();
      };
      const f = document.getElementById('rifa-form'); if (!f || !sel) return;
      const tot = () => { const q = parseInt(document.getElementById('p-q').value, 10); document.querySelector('#p-tot strong').textContent = q >= 1 ? 'Total a pagar: ' + brl(r2(q * sel.preco)) : ''; };
      document.getElementById('p-q').oninput = tot; tot();
      document.getElementById('p-mesmo').onchange = e => { const w = document.getElementById('p-w'); if (e.target.checked) w.value = document.getElementById('p-c').value; w.readOnly = e.target.checked; };
      f.onsubmit = async e => {
        e.preventDefault();
        const er = document.getElementById('p-er'), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
        const v = id => document.getElementById(id).value.trim(), arq = document.getElementById('p-f').files[0];
        const nome = v('p-n'), cel = v('p-c'), wpp = v('p-w'), em = v('p-e'), q = parseInt(v('p-q'), 10);
        if (nome.split(/\s+/).length < 2) return falha('Informe o nome completo (nome e sobrenome).');
        if (soDig(cel).length < 10) return falha('Informe o celular com DDD.');
        if (soDig(wpp).length < 10) return falha('Informe o WhatsApp com DDD.');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return falha('Informe um e-mail válido.');
        if (!(q >= 1)) return falha('Informe quantos números.');
        if (!arq) return falha('Anexe o comprovante de pagamento.');
        if (!document.getElementById('p-ok').checked) return falha('É preciso concordar com o uso dos dados para participar.');
        let comp; try { comp = await lerArq(arq); } catch (x) { return falha(String(x)); }
        const res = A.inscrever({ rifa: sel.id, nome, celular: cel, whatsapp: wpp, email: em, qtd: q, moeda: v('p-m'), comprovante: comp, consentimento: true });
        if (res.erro) return falha(res.erro);
        S.ok = { part: res.part, rifa: sel }; S.sel = ''; draw(); el.querySelector('.rifa-ok').scrollIntoView({ behavior: 'smooth' });
      };
    };
    draw();
    A.apurarVencidas().then(m => { if (m) draw(); });
  }
};
})();
