// Comunicado por e-mail do Parque Retiro.
//  - Listas: Visitante (cadastro pelo wifi), Aderente (cadastro pelo site), Postulantes (cadastro manual/importação),
//            Mestres 1 (todos os mestres aprovados na área restrita) e Mestres Comissão (mestres com alguma responsabilidade/comissão).
//  - Gerador: cria o e-mail (HTML pronto), mostra a prévia e entrega os destinatários da lista escolhida.
//  - Cadastros públicos: newsletter.html (Aderente) e cadastro-wifi.html (Visitante), que gravam em 'contatos'.
// O site ainda não tem servidor de envio: o Comunicado por e-mail é GERADO aqui e enviado pelo programa de e-mail (Gmail, Outlook, Mailchimp etc.).
(function () {
const LISTAS = {
  visitante:  { nome: 'Visitante',       desc: 'Quem se cadastrou pelo wifi do Parque', manual: true },
  aderente:   { nome: 'Aderente',        desc: 'Quem se cadastrou pelo site para receber o Comunicado por e-mail', manual: true },
  lancamentos:{ nome: 'Interessados em lançamentos', desc: 'Quem pediu para receber avisos de lançamentos de livros (marcou a opção ao encomendar)', manual: true },
  convite:    { nome: 'Convite área restrita', desc: 'Pessoas das comissões e da administração que vão receber o convite para criar conta na área restrita', manual: true },
  postulante: { nome: 'Postulantes',     desc: 'Quem está fazendo a Escola', manual: true },
  mestres1:   { nome: 'Mestres 1',       desc: 'Todos os mestres com acesso à área restrita (Gestão de Responsáveis)', manual: false },
  mestrescom: { nome: 'Mestres Comissão', desc: 'Mestres responsáveis por uma comissão ou módulo', manual: false }
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const hoje = () => new Date().toISOString().slice(0, 10);
const emailOk = e => /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/.test(e);
const urlOk = u => /^https?:\/\//i.test(u || '');
const getDb = () => (window.PR_DADOS && window.PR_DADOS.db) || {
  get(k, d) { try { const v = localStorage.getItem('pr_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('pr_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};
const statusDe = u => u.status || 'aprovado';

/* ---------- Listas ---------- */
const contatos = () => getDb().get('contatos', []);
function membros(lista) {
  if (lista === 'mestres1' || lista === 'mestrescom') {
    return getDb().get('users', []).filter(u => statusDe(u) === 'aprovado' && emailOk(u.email) && (lista === 'mestres1' || (u.funcoes || []).length > 0))
      .map(u => ({ nome: u.nome || '', email: u.email }));
  }
  return contatos().filter(c => c.lista === lista && c.ativo !== false).map(c => ({ nome: c.nome || '', email: c.email }));
}
function destinatarios(listas) {
  const vistos = new Set(), out = [];
  listas.forEach(l => membros(l).forEach(m => { const k = m.email.toLowerCase(); if (!vistos.has(k)) { vistos.add(k); out.push(m); } }));
  return out;
}
function adicionar(lista, email, nome, origem) {
  email = String(email || '').trim().toLowerCase();
  if (!LISTAS[lista] || !LISTAS[lista].manual || !emailOk(email)) return 'invalido';
  const db = getDb(), l = db.get('contatos', []);
  const ex = l.find(c => c.lista === lista && c.email === email);
  if (ex) { if (ex.ativo === false) { ex.ativo = true; db.set('contatos', l); return 'reativado'; } return 'existe'; }
  l.push({ id: uid(), lista, email, nome: String(nome || '').trim().slice(0, 120), origem: origem || 'manual', criado: hoje(), ativo: true });
  return db.set('contatos', l) ? 'ok' : 'erro';
}

function descadastrar(email) {
  email = String(email || '').trim().toLowerCase();
  if (!emailOk(email)) return 'invalido';
  const db = getDb(), l = db.get('contatos', []); let n = 0;
  l.forEach(c => { if (c.email === email && c.ativo !== false) { c.ativo = false; c.saiu = hoje(); n++; } });
  if (!n) return 'nao-encontrado';
  return db.set('contatos', l) ? 'ok' : 'erro';
}
function descadastroPublico(box) {
  const q = new URLSearchParams(location.search).get('e') || '';
  box.innerHTML = `<form id="sai-f" class="form-reserva" novalidate>
    <div class="form-row"><label for="sai-e">E-mail que recebe o Comunicado</label><input id="sai-e" type="email" maxlength="160" autocomplete="email" value="${esc(q)}" required></div>
    <p id="sai-m" class="form-erro" role="alert" hidden></p>
    <button class="btn-visit btn-large"><i class="fas fa-user-slash"></i> Deixar de receber o Comunicado do Parque Retiro</button></form>`;
  const m = box.querySelector('#sai-m');
  box.querySelector('#sai-f').onsubmit = ev => {
    ev.preventDefault(); m.hidden = false; m.className = 'form-erro';
    const r = descadastrar(box.querySelector('#sai-e').value);
    if (r === 'invalido') { m.textContent = 'Informe um e-mail válido.'; return; }
    if (r === 'erro') { m.textContent = 'Não foi possível salvar agora. Tente de novo.'; return; }
    m.className = 'tip-box'; m.textContent = r === 'nao-encontrado' ? 'Este e-mail não está ativo em nossas listas. Você não receberá o Comunicado.' : 'Pronto. Você deixou de receber o Comunicado do Parque Retiro.';
  };
}

/* ---------- Cadastros públicos (newsletter.html e cadastro-wifi.html) ---------- */
function cadastroPublico() {
  const box = document.getElementById('cadastro-box'); if (!box) return;
  if (box.dataset.acao === 'sair') { descadastroPublico(box); return; }
  const lista = box.dataset.lista, origem = lista === 'visitante' ? 'wifi' : 'site';
  box.innerHTML = `<form id="cad-f" class="form-reserva" novalidate>
    <div class="form-row"><label for="cad-n">Nome</label><input id="cad-n" type="text" maxlength="120" autocomplete="name"></div>
    <div class="form-row"><label for="cad-e">E-mail *</label><input id="cad-e" type="email" maxlength="160" autocomplete="email" required></div>
    <div class="form-row"><label class="fn"><input type="checkbox" id="cad-c"> Concordo em receber o Comunicado por e-mail do Parque de Estudo e Reflexão Retiro. Posso deixar de receber a qualquer momento.</label></div>
    <p id="cad-m" class="form-erro" role="alert" hidden></p>
    <button class="btn-visit btn-large"><i class="fas fa-envelope"></i> Quero receber</button></form>`;
  const m = document.getElementById('cad-m');
  document.getElementById('cad-f').onsubmit = ev => {
    ev.preventDefault(); m.hidden = false; m.className = 'form-erro';
    if (!document.getElementById('cad-c').checked) { m.textContent = 'Marque a caixa de concordância para continuar.'; return; }
    const r = adicionar(lista, document.getElementById('cad-e').value, document.getElementById('cad-n').value, origem);
    if (r === 'invalido') { m.textContent = 'Informe um e-mail válido.'; return; }
    if (r === 'erro') { m.textContent = 'Não foi possível salvar agora. Tente de novo.'; return; }
    m.className = 'tip-box'; m.textContent = r === 'existe' ? 'Este e-mail já está cadastrado. Obrigado!' : 'Cadastro feito. Obrigado!';
    ev.target.reset();
  };
}

/* ---------- Gerador do e-mail ---------- */
function paragrafos(t) { return String(t || '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean); }
// Acrescenta marcação UTM ao link do botão (CTA), para que o clique apareça por campanha no Google Analytics e no serviço de envio.
function linkRastreado(d) {
  if (!urlOk(d.link)) return '';
  try {
    const u = new URL(d.link), slug = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
    if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'comunicado-email');
    if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', 'email');
    if (!u.searchParams.has('utm_campaign')) u.searchParams.set('utm_campaign', slug(d.assunto || d.titulo) + '-' + hoje());
    if (!u.searchParams.has('utm_content')) u.searchParams.set('utm_content', 'cta-' + (slug(d.botao) || 'botao'));
    return u.toString();
  } catch (e) { return d.link; }
}
function montaHtml(d) {
  const cor = '#2c3e50', dest = '#a31d21';
  const ps = paragrafos(d.texto).map(p => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#444444;">${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  const img = urlOk(d.imagem) ? `<tr><td style="padding:0;"><img src="${esc(d.imagem)}" alt="${esc(d.titulo)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>` : '';
  const botao = urlOk(d.link) && d.botao ? `<p style="margin:24px 0 8px;"><a href="${esc(linkRastreado(d))}" style="background:${dest};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;display:inline-block;">${esc(d.botao)}</a></p>` : '';
  return `<!DOCTYPE html>
<html lang="${d.lang === 'es' ? 'es' : 'pt-br'}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(d.assunto || d.titulo)}</title></head>
<body style="margin:0;padding:0;background:#f4f6f6;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f6;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
<tr><td style="background:${cor};padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold;">${esc(d.remetente || 'Parque de Estudo e Reflexão Retiro')}</td></tr>
${img}
<tr><td style="padding:28px;">
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:${cor};">${esc(d.titulo)}</h1>
${ps}${botao}
</td></tr>
<tr><td style="padding:18px 28px;background:#f9fbfb;font-size:12px;line-height:1.5;color:#777777;">${esc(d.remetente || 'Parque de Estudo e Reflexão Retiro')} · Maricá, Rio de Janeiro, Brasil<br>${d.rodape ? esc(d.rodape) : `Você recebe este Comunicado por e-mail porque se cadastrou no Parque Retiro.<br>${urlOk(d.descadastro) ? `<a href="${esc(d.descadastro)}" style="color:#777777;text-decoration:underline;">Deixar de receber o Comunicado do Parque Retiro</a>` : 'Deixar de receber o Comunicado do Parque Retiro: responda este e-mail pedindo para sair.'}`}</td></tr>
</table></td></tr></table></body></html>`;
}
function montaTexto(d) {
  return [d.titulo, '', ...paragrafos(d.texto).flatMap(p => [p, '']), urlOk(d.link) ? (d.botao || 'Saiba mais') + ': ' + linkRastreado(d) : '', '', (d.remetente || 'Parque de Estudo e Reflexão Retiro') + ' · Maricá, RJ', d.rodape ? d.rodape : (urlOk(d.descadastro) ? 'Deixar de receber o Comunicado do Parque Retiro: ' + d.descadastro : 'Deixar de receber o Comunicado do Parque Retiro: responda pedindo para sair.')].join('\n').trim();
}
const copia = async t => { try { await navigator.clipboard.writeText(t); return true; } catch (e) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (x) { /* sem cópia */ } a.remove(); return ok; } };
const baixa = (nome, texto, tipo) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([texto], { type: tipo })); a.download = nome; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };

// ctx: { origem: 'Atividades', pre: {titulo, texto, link, botao}, atividades: [...] opcional }
function abrirGerador(me, ctx) {
  ctx = ctx || {};
  const antigo = document.getElementById('emkt-modal'); if (antigo) antigo.remove();
  const pre = ctx.pre || {};
  const baseSite = location.protocol.startsWith('http') ? location.origin + location.pathname.replace(/[^/]*$/, '') : '';
  const atv = (ctx.atividades || []);
  const wrap = document.createElement('div'); wrap.id = 'emkt-modal'; wrap.className = 'emkt-overlay'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Gerar Comunicado por e-mail');
  wrap.innerHTML = `<div class="emkt-box">
    <div class="emkt-top"><h3><i class="fas fa-envelope-open-text"></i> Gerar Comunicado por e-mail${ctx.origem ? ' · ' + esc(ctx.origem) : ''}</h3><button type="button" class="btn-visit" id="em-x" aria-label="Fechar">Fechar</button></div>
    <div class="emkt-cols"><div class="emkt-form">
      <fieldset class="funcoes"><legend>Para quem enviar (escolha uma ou mais listas)</legend>
        ${Object.keys(LISTAS).map(k => `<label class="fn" title="${esc(LISTAS[k].desc)}"><input type="checkbox" name="em-l" value="${k}"> ${esc(LISTAS[k].nome)} <small>(${membros(k).length})</small></label>`).join('')}
        <p class="vazio" id="em-total"></p></fieldset>
      ${atv.length ? `<div class="form-row"><label for="em-a">Preencher a partir de uma atividade publicada</label><select id="em-a"><option value="">— escolher —</option>${atv.map((a, i) => `<option value="${i}">${esc(a.titulo)}</option>`).join('')}</select></div>` : ''}
      <div class="form-row"><label for="em-as">Assunto do e-mail *</label><input id="em-as" type="text" maxlength="150" value="${esc(pre.assunto || pre.titulo || '')}"></div>
      <div class="form-row"><label for="em-t">Título *</label><input id="em-t" type="text" maxlength="150" value="${esc(pre.titulo || '')}"></div>
      <div class="form-row"><label for="em-x2">Texto (separe os parágrafos com uma linha em branco)</label><textarea id="em-x2" rows="8" maxlength="6000">${esc(pre.texto || '')}</textarea></div>
      <div class="form-row"><label for="em-i">Endereço (URL) de uma imagem, opcional</label><input id="em-i" type="url" placeholder="https://..." value="${esc(pre.imagem || '')}"><small>A imagem precisa estar hospedada na internet; imagens coladas direto no e-mail costumam ser bloqueadas.</small></div>
      <div class="form-row"><label for="em-b">Texto do botão</label><input id="em-b" type="text" maxlength="40" value="${esc(pre.botao || 'Saiba mais')}"></div>
      <div class="form-row"><label for="em-l2">Link do botão (CTA) *</label><input id="em-l2" type="url" placeholder="https://..." value="${esc(pre.link || '')}"><small>Link clicável que leva a pessoa à ação desejada (inscrever-se, doar, reservar...). O sistema acrescenta a marcação UTM para medir os cliques.</small><small id="em-lr" class="vazio"></small></div>
      <div class="form-row"><label for="em-d">Link para "Deixar de receber o Comunicado do Parque Retiro"</label><input id="em-d" type="url" placeholder="https://..." value="${esc(baseSite ? baseSite + 'descadastro.html' : '')}"><small>Aparece no final de todo comunicado. Se você usa Mailchimp, Brevo etc., troque pelo link de descadastro do próprio serviço (por exemplo *|UNSUB|*).</small></div>
      <div class="form-row"><label for="em-r">Nome do remetente</label><input id="em-r" type="text" maxlength="80" value="Parque de Estudo e Reflexão Retiro"></div>
    </div><div class="emkt-prev"><p class="vazio">Prévia do e-mail</p><iframe id="em-p" title="Prévia do e-mail" sandbox></iframe>
      <div class="emkt-acoes">
        <button type="button" class="btn-visit" id="em-ch"><i class="fas fa-code"></i> Copiar e-mail (HTML)</button>
        <button type="button" class="btn-visit" id="em-bh"><i class="fas fa-download"></i> Baixar .html</button>
        <button type="button" class="btn-visit" id="em-cd"><i class="fas fa-users"></i> Copiar destinatários</button>
        <button type="button" class="btn-visit" id="em-bc"><i class="fas fa-file-csv"></i> Baixar lista (.csv)</button>
        <button type="button" class="btn-visit" id="em-mt"><i class="fas fa-paper-plane"></i> Abrir no programa de e-mail</button>
      </div>
      <p class="tip-box" id="em-msg" role="status" hidden></p>
      <details id="em-met"><summary><strong>Métricas após o disparo</strong> (abertura, cliques, rejeição, cancelamento, spam, conversão, ROI)</summary>
        <p class="vazio">Depois de enviar, copie os números do relatório do seu serviço de envio e digite abaixo. O site calcula as taxas. Você também as encontra depois em Listas de e-mail › Comunicados enviados.</p><div id="em-mb"></div></details>
      <p class="vazio">O site ainda não envia e-mails sozinho. Cole o HTML copiado no seu serviço de envio (Mailchimp, Brevo, Gmail com modelo HTML etc.) e use os destinatários em cópia oculta (CCO).</p>
    </div></div></div>`;
  document.body.appendChild(wrap);
  const $ = s => wrap.querySelector(s);
  const dados = () => ({ assunto: $('#em-as').value.trim(), titulo: $('#em-t').value.trim(), texto: $('#em-x2').value, imagem: $('#em-i').value.trim(), botao: $('#em-b').value.trim(), link: $('#em-l2').value.trim(), remetente: $('#em-r').value.trim(), descadastro: $('#em-d').value.trim() });
  const listasSel = () => [...wrap.querySelectorAll('[name=em-l]:checked')].map(i => i.value);
  const msg = (t, erro) => { const m = $('#em-msg'); m.hidden = !t; m.textContent = t || ''; m.className = erro ? 'form-erro' : 'tip-box'; };
  const prev = () => { const dd = dados(); $('#em-p').srcdoc = montaHtml(dd); $('#em-lr').textContent = urlOk(dd.link) ? 'Link final com rastreio: ' + linkRastreado(dd) : ''; const n = destinatarios(listasSel()).length; $('#em-total').textContent = listasSel().length ? `${n} destinatário(s) únicos nas listas escolhidas.` : 'Nenhuma lista escolhida.'; };
  wrap.addEventListener('input', prev); wrap.addEventListener('change', prev);
  if ($('#em-a')) $('#em-a').onchange = e => {
    const a = atv[+e.target.value]; if (!a) return;
    $('#em-as').value = a.titulo; $('#em-t').value = a.titulo; $('#em-x2').value = a.lide || '';
    $('#em-l2').value = baseSite ? baseSite + 'atividade.html?id=' + encodeURIComponent(a.id) : (urlOk(a.linkExterno) ? a.linkExterno : '');
    $('#em-b').value = 'Leia mais'; prev();
  };
  const valida = precisaListas => {
    const d = dados();
    if (!d.assunto || !d.titulo) { msg('Preencha o assunto e o título.', true); return null; }
    if (d.imagem && !urlOk(d.imagem)) { msg('O endereço da imagem precisa começar com http:// ou https://.', true); return null; }
    if (!d.botao || !urlOk(d.link)) { msg('Informe o texto do botão e o link do botão (CTA), começando com http:// ou https://. É ele que permite medir a ação gerada.', true); return null; }
    if (d.descadastro && !urlOk(d.descadastro)) { msg('O link de descadastro precisa começar com http:// ou https://.', true); return null; }
    if (precisaListas && !listasSel().length) { msg('Escolha ao menos uma lista.', true); return null; }
    return d;
  };
  const cid = uid();
  const salvaCamp = c => { try { const db = getDb(), h = db.get('emailmkt', []), i = h.findIndex(x => x.id === c.id); if (i >= 0) h[i] = c; else h.push(c); db.set('emailmkt', h.slice(-300)); } catch (e) { /* histórico é opcional */ } };
  const campAtual = () => { const d = dados(), h = getDb().get('emailmkt', []), ex = h.find(x => x.id === cid) || {}; return Object.assign(ex, { id: cid, data: ex.data || hoje(), assunto: d.assunto, listas: listasSel(), total: destinatarios(listasSel()).length, origem: ctx.origem || '', por: me && me.nome || '', link: linkRastreado(d) }); };
  const registra = () => salvaCamp(campAtual());
  $('#em-x').onclick = () => wrap.remove();
  wrap.addEventListener('keydown', e => { if (e.key === 'Escape') wrap.remove(); });
  wrap.addEventListener('click', e => { if (e.target === wrap) wrap.remove(); });
  $('#em-ch').onclick = async () => { const d = valida(false); if (!d) return; registra(); msg((await copia(montaHtml(d))) ? 'E-mail (HTML) copiado.' : 'Não foi possível copiar; use "Baixar .html".', false); };
  $('#em-bh').onclick = () => { const d = valida(false); if (!d) return; registra(); baixa('email-parque-retiro-' + hoje() + '.html', montaHtml(d), 'text/html'); msg('Arquivo baixado.', false); };
  $('#em-cd').onclick = async () => { const d = valida(true); if (!d) return; const l = destinatarios(listasSel()); if (!l.length) { msg('As listas escolhidas estão vazias.', true); return; } msg((await copia(l.map(x => x.email).join(', '))) ? `${l.length} e-mail(s) copiados, prontos para colar em CCO.` : 'Não foi possível copiar.', false); };
  $('#em-bc').onclick = () => { const d = valida(true); if (!d) return; const l = destinatarios(listasSel()); if (!l.length) { msg('As listas escolhidas estão vazias.', true); return; } baixa('lista-email-' + hoje() + '.csv', '\ufeffnome;email\r\n' + l.map(x => `"${x.nome.replace(/"/g, '""')}";${x.email}`).join('\r\n'), 'text/csv'); msg('Lista baixada.', false); };
  $('#em-mt').onclick = () => {
    const d = valida(true); if (!d) return; const l = destinatarios(listasSel()); if (!l.length) { msg('As listas escolhidas estão vazias.', true); return; }
    registra();
    const url = 'mailto:?bcc=' + encodeURIComponent(l.map(x => x.email).join(',')) + '&subject=' + encodeURIComponent(d.assunto) + '&body=' + encodeURIComponent(montaTexto(d));
    if (url.length > 1800) { msg('A lista é grande demais para abrir direto no programa de e-mail. Use "Copiar destinatários" e "Copiar e-mail (HTML)".', true); return; }
    location.href = url;
  };
  $('#em-met').addEventListener('toggle', () => { if ($('#em-met').open && !$('#em-mb').firstChild) { const d = valida(false); if (!d) { $('#em-met').open = false; return; } const c = campAtual(); salvaCamp(c); painelMetricas($('#em-mb'), c, salvaCamp); } });
  prev(); $('#em-as').focus();
}

/* ---------- Métricas do disparo ---------- */
// Os números vêm do relatório do serviço que enviou o Comunicado (Mailchimp, Brevo, Gmail etc.); aqui se digitam e o site calcula as taxas.
const CAMPOS_M = [
  ['enviados', 'E-mails enviados'], ['soft', 'Soft bounce (falha temporária)'], ['hard', 'Hard bounce (falha permanente)'],
  ['aberturas', 'Aberturas (únicas)'], ['cliques', 'Cliques no link/botão (únicos)'], ['descad', 'Pedidos de cancelamento de inscrição'],
  ['spam', 'Reclamações de spam'], ['conversoes', 'Conversões (meta final: doação, reserva, inscrição...)'], ['receita', 'Receita gerada (R$)'], ['custo', 'Custo da campanha (R$)']
];
const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) && n >= 0 ? n : 0; };
const pct = (a, b) => b > 0 ? (a / b * 100).toFixed(2).replace('.', ',') + '%' : '—';
function calcMetricas(m) {
  m = m || {}; const env = num(m.enviados), soft = num(m.soft), hard = num(m.hard), ent = Math.max(0, env - soft - hard), ab = num(m.aberturas), cl = num(m.cliques), cv = num(m.conversoes), rec = num(m.receita), cu = num(m.custo);
  return [
    ['Entregues', ent ? String(ent) : '—', 'Enviados menos os que rejeitaram (soft + hard).'],
    ['Taxa de Abertura', pct(ab, ent), 'Aberturas ÷ entregues. Indica se o assunto e o remetente foram atrativos.'],
    ['Taxa de Cliques (CTR)', pct(cl, ent), 'Cliques ÷ entregues. Mostra se o conteúdo gerou interesse para agir.'],
    ['CTOR (Click-to-Open Rate)', pct(cl, ab), 'Cliques ÷ aberturas. Mede a relevância real do conteúdo para quem abriu.'],
    ['Taxa de Rejeição (Bounce)', pct(soft + hard, env), 'Não entregues ÷ enviados.'],
    ['· Soft Bounce', pct(soft, env), 'Falha temporária (caixa cheia, servidor instável).'],
    ['· Hard Bounce', pct(hard, env), 'Falha permanente (e-mail inexistente ou bloqueado): retire da lista.'],
    ['Taxa de Cancelamento (Unsubscribe)', pct(num(m.descad), ent), 'Descadastros ÷ entregues. Alto = frequência ou tema desagradando.'],
    ['Taxa de Reclamação de Spam', pct(num(m.spam), ent), 'Spam ÷ entregues. Mantenha o mais perto de zero para proteger a reputação de envio.'],
    ['Taxa de Conversão', pct(cv, cl), 'Conversões ÷ cliques no link.'],
    ['ROI', cu > 0 ? ((rec - cu) / cu * 100).toFixed(1).replace('.', ',') + '%' : '—', '(Receita − custo) ÷ custo. Informe o custo para calcular.']
  ];
}
function painelMetricas(box, camp, salvar) {
  const m = camp.metricas || {};
  box.innerHTML = `<div class="form-row-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px">${CAMPOS_M.map(([k, r]) => `<div class="form-row"><label for="mt-${k}">${esc(r)}</label><input id="mt-${k}" data-m="${k}" type="text" inputmode="decimal" value="${esc(m[k] == null ? '' : m[k])}"></div>`).join('')}</div>
    <div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Métrica</th><th>Resultado</th><th>O que mostra</th></tr></thead><tbody id="mt-tb"></tbody></table></div>
    <p><button type="button" class="btn-visit" id="mt-sv"><i class="fas fa-save"></i> Salvar métricas</button> <span id="mt-ok" class="vazio" role="status"></span></p>`;
  const ler = () => { const o = {}; box.querySelectorAll('[data-m]').forEach(i => { if (i.value.trim() !== '') o[i.dataset.m] = i.value.trim(); }); return o; };
  const tab = () => { box.querySelector('#mt-tb').innerHTML = calcMetricas(ler()).map(r => `<tr><td><strong>${esc(r[0])}</strong></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join(''); };
  box.addEventListener('input', tab); tab();
  box.querySelector('#mt-sv').onclick = () => { camp.metricas = ler(); salvar(camp); box.querySelector('#mt-ok').textContent = 'Métricas salvas.'; };
}

/* ---------- Botão fixo em cada ferramenta que produz conteúdo ---------- */
const ABAS = { acervo: 'Biblioteca', album: 'Álbum Parque Retiro', estela: 'Estela', documentos: 'Documentos e Calendários', atividades: 'Atividades', multiuso: 'Multiuso', comunicacao: 'Comunicação, Redes Sociais e Site', lojinha: 'Lojinha', rifa: 'Rifa Solidária', vaquinha: 'Vaquinha Coletiva', vol_acoes: 'Ações de Voluntário', jardinagem: 'Jardinagem / Área Externa', ajude: 'Ajude o Parque' };
const podeGerar = me => !!me && (me.nivel === 'administrador' || me.nivel === 'editor' || (me.funcoes || []).length > 0);
function barra(me, aba, el) {
  if (!el) return;
  if (!ABAS[aba] && !/^el_/.test(aba)) { el.hidden = true; el.innerHTML = ''; return; }
  if (!podeGerar(me)) { el.hidden = true; el.innerHTML = ''; return; }
  const origem = ABAS[aba] || 'Elementos do Parque';
  el.hidden = false;
  el.innerHTML = `<button type="button" class="btn-visit emkt-btn"><i class="fas fa-envelope-open-text"></i> Gerar Comunicado por e-mail</button><span class="vazio"> ${esc(origem)} · escolha a lista e gere o Comunicado por e-mail</span>`;
  el.querySelector('button').onclick = () => {
    const ctx = { origem };
    if (aba === 'atividades') ctx.atividades = getDb().get('atividades', []).filter(a => a.status === 'publicada');
    abrirGerador(me, ctx);
  };
}

/* ---------- Aba "Listas de e-mail" ---------- */
function abrirContatos(me, root) {
  const db = getDb(); const S = { l: 'visitante', msg: '', erro: '' };
  const draw = () => {
    const def = LISTAS[S.l], todos = membros(S.l);
    const bruto = S.l === 'mestres1' || S.l === 'mestrescom' ? [] : contatos().filter(c => c.lista === S.l).sort((a, b) => String(b.criado).localeCompare(String(a.criado)));
    root.innerHTML = `<h3><i class="fas fa-address-book"></i> Listas de e-mail</h3>
    <p>Quem recebe o Comunicado por e-mail. <strong>Mestres 1</strong> e <strong>Mestres Comissão</strong> vêm de Gestão de Responsáveis (Mestres Comissão são os que têm ao menos uma responsabilidade). As outras listas são preenchidas pelos cadastros do site ou por você.</p>
    <p class="tip-box" role="note">Para o cadastro público, use os endereços <strong>newsletter.html</strong> (Aderente) e <strong>cadastro-wifi.html</strong> (Visitante, para o portal do wifi). Enquanto o site não tiver servidor, o cadastro de cada pessoa fica no navegador dela; então cadastre aqui, ou importe, quem já tem consentimento.</p>
    <details id="ct-hist"><summary><strong>Comunicados enviados e métricas</strong></summary><div id="ct-hb"></div></details>
    <div class="tabs sub" role="tablist">${Object.keys(LISTAS).map(k => `<button type="button" class="tab-btn${k === S.l ? ' active' : ''}" data-l="${k}">${esc(LISTAS[k].nome)} (${membros(k).length})</button>`).join('')}</div>
    <p class="vazio">${esc(def.desc)}</p>
    ${S.msg ? `<p class="tip-box" role="status">${esc(S.msg)}</p>` : ''}${S.erro ? `<p class="form-erro" role="alert">${esc(S.erro)}</p>` : ''}
    ${def.manual ? `<form id="ct-f" class="form-reserva" novalidate><div class="form-row"><label for="ct-e">E-mail</label><input id="ct-e" type="email" maxlength="160"></div><div class="form-row"><label for="ct-n">Nome (opcional)</label><input id="ct-n" type="text" maxlength="120"></div><button class="btn-visit"><i class="fas fa-plus"></i> Adicionar</button></form>
    <div class="form-row"><label for="ct-i">Importar vários (um por linha: e-mail, ou nome;e-mail)</label><textarea id="ct-i" rows="4"></textarea></div><p><button class="btn-visit" id="ct-imp"><i class="fas fa-file-import"></i> Importar</button></p>` : ''}
    <p><button class="btn-visit" id="ct-csv" ${todos.length ? '' : 'disabled'}><i class="fas fa-file-csv"></i> Baixar esta lista (.csv)</button></p>
    ${todos.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Nome</th><th>E-mail</th>${def.manual ? '<th>Origem</th><th>Situação</th><th></th>' : ''}</tr></thead><tbody>${def.manual ? bruto.map(c => `<tr><td>${esc(c.nome)}</td><td>${esc(c.email)}</td><td>${esc(c.origem || '')}</td><td>${c.ativo === false ? 'Saiu da lista' : 'Ativo'}</td><td><button class="btn-visit" data-t="${esc(c.id)}">${c.ativo === false ? 'Reativar' : 'Tirar da lista'}</button></td></tr>`).join('') : todos.map(c => `<tr><td>${esc(c.nome)}</td><td>${esc(c.email)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="vazio">Esta lista ainda está vazia.</p>'}`;
    root.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { S.l = b.dataset.l; S.msg = S.erro = ''; draw(); });
    const hb = root.querySelector('#ct-hb'), hist = db.get('emailmkt', []).slice().reverse();
    const drawHist = () => {
      hb.innerHTML = hist.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Data</th><th>Assunto</th><th>Abertura</th><th>CTR</th><th>CTOR</th><th>Rejeição</th><th>Cancel.</th><th>Spam</th><th>Conversão</th><th>ROI</th><th></th></tr></thead><tbody>${hist.map((c, i) => { const r = calcMetricas(c.metricas); const v = n => esc(r.find(x => x[0] === n)[1]); return `<tr><td>${esc(c.data)}</td><td>${esc(c.assunto)}</td><td>${v('Taxa de Abertura')}</td><td>${v('Taxa de Cliques (CTR)')}</td><td>${v('CTOR (Click-to-Open Rate)')}</td><td>${v('Taxa de Rejeição (Bounce)')}</td><td>${v('Taxa de Cancelamento (Unsubscribe)')}</td><td>${v('Taxa de Reclamação de Spam')}</td><td>${v('Taxa de Conversão')}</td><td>${v('ROI')}</td><td><button type="button" class="btn-visit" data-mi="${i}">Métricas</button></td></tr>`; }).join('')}</tbody></table></div><div id="ct-mp"></div>` : '<p class="vazio">Nenhum Comunicado por e-mail gerado ainda.</p>';
      hb.querySelectorAll('[data-mi]').forEach(b => b.onclick = () => { const c = hist[+b.dataset.mi], mp = hb.querySelector('#ct-mp'); mp.innerHTML = `<h4>${esc(c.assunto)}</h4><div id="ct-mb"></div>`; painelMetricas(mp.querySelector('#ct-mb'), c, x => { const h = db.get('emailmkt', []), k = h.findIndex(y => y.id === x.id); if (k >= 0) { h[k] = x; db.set('emailmkt', h); } drawHist(); }); });
    };
    drawHist();
    const f = root.querySelector('#ct-f');
    if (f) {
      f.onsubmit = e => { e.preventDefault(); const r = adicionar(S.l, root.querySelector('#ct-e').value, root.querySelector('#ct-n').value, 'manual'); S.msg = r === 'ok' ? 'Contato adicionado.' : r === 'reativado' ? 'Contato reativado.' : r === 'existe' ? 'Este e-mail já está na lista.' : ''; S.erro = r === 'invalido' ? 'E-mail inválido.' : r === 'erro' ? 'Não foi possível salvar.' : ''; draw(); };
      root.querySelector('#ct-imp').onclick = () => {
        let ok = 0, ja = 0, mau = 0;
        root.querySelector('#ct-i').value.split(/\r?\n/).forEach(l => { l = l.trim(); if (!l) return; const p = l.split(/[;\t,]/).map(x => x.trim()); const em = p.find(x => emailOk(x)); const nm = p.find(x => x && x !== em) || ''; const r = em ? adicionar(S.l, em, nm, 'importação') : 'invalido'; if (r === 'ok' || r === 'reativado') ok++; else if (r === 'existe') ja++; else mau++; });
        S.msg = `${ok} adicionado(s), ${ja} já existiam, ${mau} linha(s) ignorada(s).`; S.erro = ''; draw();
      };
    }
    root.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const l = db.get('contatos', []), c = l.find(x => x.id === b.dataset.t); if (c) { c.ativo = c.ativo === false; db.set('contatos', l); } draw(); });
    const csvB = root.querySelector('#ct-csv'); if (csvB) csvB.onclick = () => baixa('lista-' + S.l + '-' + hoje() + '.csv', '\ufeffnome;email\r\n' + todos.map(x => `"${x.nome.replace(/"/g, '""')}";${x.email}`).join('\r\n'), 'text/csv');
  };
  draw();
}

window.PR_EMAILMKT = { descadastrar, calcMetricas, linkRastreado, LISTAS, membros, destinatarios, adicionar, montaHtml, montaTexto, abrirGerador, barra, abrirContatos };
document.addEventListener('DOMContentLoaded', cadastroPublico);
})();
