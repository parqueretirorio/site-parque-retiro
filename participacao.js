// Inscrição em evento com contribuição (26/11/2026). Depende da migração 0027.
//  - PR_PIX: monta o código "Pix Copia e Cola" (BR Code estático) com valor e identificador; o QR é desenhado por qr.js.
//  - Página pública participar.html?id=<atividade>: cadastro simples → informações importantes → contribuição → confirmação.
//  - Área restrita (Atividades › Participação): configuração do evento e painel de inscritos (confirmar pagamento, presença, CSV).
//  - Botão "Quero participar" em atividade.html quando o evento tem inscrição ativa.
// Valores e Pix ficam no servidor; nada de chave, senha ou token neste arquivo.
(function () {
'use strict';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = c => 'R$ ' + (Math.round(c) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+,)/g, '.');
const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

/* ---------- Pix (BR Code estático) ---------- */
function crc16(s) {
  let c = 0xFFFF;
  for (let i = 0; i < s.length; i++) { c ^= s.charCodeAt(i) << 8; for (let k = 0; k < 8; k++) c = (c & 0x8000) ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF; }
  return c.toString(16).toUpperCase().padStart(4, '0');
}
const campo = (id, v) => id + String(v.length).padStart(2, '0') + v;
// Escreve a chave como o banco espera: celular com +55, e-mail em minúsculas, CPF/CNPJ só com números, aleatória como está.
function normalizaChave(tipo, v) {
  v = String(v || '').trim();
  if (tipo === 'email') return v.toLowerCase();
  if (tipo === 'celular') { const d = v.replace(/\D/g, ''); return d ? '+' + (d.startsWith('55') && d.length >= 12 ? d : '55' + d) : ''; }
  if (tipo === 'cpfcnpj') return v.replace(/\D/g, '');
  return v;
}
function tipoDaChave(v) { v = String(v || ''); return /@/.test(v) ? 'email' : /^\+\d{10,15}$/.test(v) ? 'celular' : /^\d{11}$|^\d{14}$/.test(v) ? 'cpfcnpj' : 'aleatoria'; }
// opts: { chave, nome, cidade, centavos, txid }
function payload(o) {
  const nome = semAcento(o.nome).toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 25) || 'PARQUE RETIRO';
  const cidade = semAcento(o.cidade).toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 15) || 'MARICA';
  const txid = String(o.txid || '***').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', String(o.chave));
  const valor = o.centavos > 0 ? campo('54', (o.centavos / 100).toFixed(2)) : '';
  const base = campo('00', '01') + campo('01', '11') + campo('26', conta) + campo('52', '0000') + campo('53', '986') + valor + campo('58', 'BR') + campo('59', nome) + campo('60', cidade) + campo('62', campo('05', txid)) + '6304';
  return base + crc16(base);
}
window.PR_PIX = { crc16, payload, normalizaChave, tipoDaChave, brl };

const base = () => window.PR_CONFIG_DADOS && window.PR_CONFIG_DADOS.supabase && window.PR_CONFIG_DADOS.supabase.url;
const publicoRpc = (fn, corpo) => (window.PR_VITRINE && window.PR_VITRINE.rpc) ? window.PR_VITRINE.rpc(fn, corpo) : Promise.reject(new Error('Esta função só funciona no site publicado.'));
const copiar = async t => { try { await navigator.clipboard.writeText(t); return true; } catch (e) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { /* sem cópia */ } a.remove(); return ok; } };
const linkForm = id => location.origin.replace(/\/$/, '') + location.pathname.replace(/[^/]*$/, '') + 'participar.html?id=' + encodeURIComponent(id);

/* ---------- Página pública ---------- */
function paginaPublica() {
  const raiz = document.getElementById('pa-app'); if (!raiz) return;
  const id = new URLSearchParams(location.search).get('id') || '';
  const chaveLocal = 'pr-part-' + id;
  const S = { ev: null, etapa: 1, d: { nome: '', email: '', tel: '', cep: '', rest: '', outra: '', opcao: '', forma: 'pix', ok: false }, erro: '', env: false, res: null };
  try { S.res = JSON.parse(localStorage.getItem(chaveLocal) || 'null'); } catch (e) { S.res = null; }
  const msg = (t, cls) => { raiz.innerHTML = `<p class="${cls || 'vazio'}" role="status">${esc(t)}</p><p><a class="btn-visit" href="atividades.html">Ver as atividades do Parque</a></p>`; };

  function telaResultado() {
    const r = S.res, ev = S.ev, pix = ev.pix || {};
    const opc = r.forma === 'pix' && r.total_centavos > 0 && pix.chave;
    const copia = opc ? payload({ chave: pix.chave, nome: pix.nome, cidade: pix.cidade, centavos: r.total_centavos, txid: r.txid }) : '';
    let qr = ''; try { qr = copia && window.PR_QR ? window.PR_QR.svg(copia, { escala: 5 }) : ''; } catch (e) { qr = ''; }
    raiz.innerHTML = `<div class="pa-res" aria-live="polite"><h3><i class="fas fa-check-circle"></i> Inscrição recebida, ${esc((r.nome || '').split(' ')[0])}!</h3>
      <p>${esc(r.opcao_nome || '')} · seu código é <strong>${esc(r.codigo)}</strong>. Guarde este código.</p>
      ${r.forma === 'presencial' || !r.total_centavos ? `<p class="tip-box" role="note"><i class="fas fa-hand-holding-heart"></i> ${r.total_centavos ? 'Você escolheu <strong>pagar presencialmente</strong> (' + brl(r.total_centavos) + '). A equipe anota o pagamento na chegada.' : 'Sua participação não tem contribuição a pagar.'}</p>` : `
      <p class="tip-box" role="note"><i class="fas fa-qrcode"></i> Contribuição: <strong class="pa-valor">${brl(r.total_centavos)}</strong>${r.extra_centavos ? ` <small>(${brl(r.total_centavos - r.extra_centavos)} + ${r.extra_centavos} centavo${r.extra_centavos > 1 ? 's' : ''} que identificam o seu pagamento: não arredonde)</small>` : ''}</p>
      ${r.sem_centavos_livres ? '<p class="tip-box" role="note">Muitas pessoas pagaram ao mesmo tempo, então o valor ficou sem centavos. Depois de pagar, toque em “Já paguei” e escreva seu código no comprovante se puder.</p>' : ''}
      <p>Pague no aplicativo do seu banco, em <strong>Pix › Pix Copia e Cola</strong>, ou leia o QR Code. Recebedor: <strong>${esc(pix.nome || '')}</strong>.</p>
      ${qr ? `<div class="pa-qr" role="img" aria-label="QR Code do Pix">${qr}</div>` : ''}
      <div class="form-row"><label for="pa-copia">Pix Copia e Cola</label><textarea id="pa-copia" rows="4" readonly>${esc(copia)}</textarea></div>
      <p><button type="button" class="btn-visit" id="pa-cp"><i class="fas fa-copy"></i> Copiar código Pix</button></p>
      <p id="pa-cpmsg" role="status"></p>
      ${r.informou ? '<p class="tip-box" role="status"><i class="fas fa-check"></i> Avisamos a equipe que você pagou. Ela confirma em breve.</p>' : '<p><button type="button" class="btn-visit btn-large" id="pa-jap"><i class="fas fa-check"></i> Já paguei</button></p>'}`}
      <p class="pa-peq">Dúvidas? Fale com a equipe do Parque pelo WhatsApp ou e-mail informados no site.</p></div>`;
    const cp = raiz.querySelector('#pa-cp'); if (cp) cp.onclick = async () => { raiz.querySelector('#pa-cpmsg').textContent = (await copiar(copia)) ? 'Código copiado. Agora cole no app do banco.' : 'Não consegui copiar; selecione o texto acima e copie.'; };
    const jp = raiz.querySelector('#pa-jap'); if (jp) jp.onclick = async () => {
      jp.disabled = true;
      try { const x = await publicoRpc('pr_participacao_informar_pago', { p_codigo: r.codigo, p_token: r.token }); if (x && x.ok) { r.informou = true; try { localStorage.setItem(chaveLocal, JSON.stringify(r)); } catch (e) { /* sem armazenamento */ } telaResultado(); } else { jp.disabled = false; raiz.querySelector('#pa-cpmsg').textContent = (x && x.erro) || 'Não foi possível avisar agora. Tente de novo.'; } }
      catch (e) { jp.disabled = false; raiz.querySelector('#pa-cpmsg').textContent = e.message; }
    };
  }

  function lerCampos() {
    const g = n => { const el = raiz.querySelector('#pa-' + n); return el ? el.value : ''; };
    if (S.etapa === 1) Object.assign(S.d, { nome: g('nome'), email: g('email'), tel: g('tel'), cep: g('cep') });
    if (S.etapa === 2) { const r = raiz.querySelector('input[name=pa-rest]:checked'); S.d.rest = r ? r.value : ''; S.d.outra = g('outra'); }
    if (S.etapa === 3) { const o = raiz.querySelector('input[name=pa-opcao]:checked'), f = raiz.querySelector('input[name=pa-forma]:checked'), c = raiz.querySelector('#pa-ok'); S.d.opcao = o ? o.value : ''; S.d.forma = f ? f.value : 'pix'; S.d.ok = !!(c && c.checked); }
  }
  function valida() {
    const d = S.d;
    if (S.etapa === 1) {
      if (d.nome.trim().split(/\s+/).filter(Boolean).length < 2) return 'Informe nome e sobrenome.';
      if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/.test(d.email.trim())) return 'Informe um e-mail válido.';
      if (d.tel.replace(/\D/g, '').length < 10) return 'Informe o telefone/WhatsApp com DDD.';
      if (d.cep.replace(/\D/g, '').length !== 8) return 'Informe o CEP com 8 números.';
    }
    if (S.etapa === 2 && !d.rest) return 'Escolha uma opção de alimentação.';
    if (S.etapa === 3) { if (!d.opcao) return 'Escolha uma opção de participação.'; if (!d.ok) return 'Marque a confirmação para concluir.'; }
    return '';
  }
  async function enviar() {
    const d = S.d; S.env = true; draw();
    try {
      const x = await publicoRpc('pr_participacao_inscrever', { p_evento: id, p_nome: d.nome.trim(), p_email: d.email.trim(), p_telefone: d.tel.trim(), p_cep: d.cep.trim(), p_restricao: d.rest, p_outra: d.outra.trim(), p_opcao: d.opcao, p_forma: d.forma, p_consent: true });
      S.env = false;
      if (!x || !x.ok) { S.erro = (x && x.erro) || 'Não foi possível concluir a inscrição.'; draw(); return; }
      const o = (S.ev.opcoes || []).find(z => z.id === d.opcao) || {};
      S.res = { codigo: x.codigo, token: x.token, txid: x.txid, total_centavos: x.total_centavos, extra_centavos: x.extra_centavos, sem_centavos_livres: !!x.sem_centavos_livres, forma: d.forma, opcao_nome: o.nome || '', nome: d.nome.trim(), informou: false };
      try { localStorage.setItem(chaveLocal, JSON.stringify(S.res)); } catch (e) { /* sem armazenamento */ }
      telaResultado();
    } catch (e) { S.env = false; S.erro = e.message; draw(); }
  }
  function draw() {
    const ev = S.ev, d = S.d, e = S.etapa;
    const passos = ['Seus dados', 'Informações importantes', 'Contribuição'];
    raiz.innerHTML = `<ol class="pa-passos" aria-label="Etapas">${passos.map((p, i) => `<li${i + 1 === e ? ' aria-current="step" class="on"' : i + 1 < e ? ' class="feito"' : ''}><span>${i + 1}</span> ${p}</li>`).join('')}</ol>
    <form id="pa-form" class="form-reserva" novalidate>
    ${e === 1 ? `<h3>Seus dados</h3>
      <div class="form-row"><label for="pa-nome">Nome completo *</label><input id="pa-nome" maxlength="120" autocomplete="name" value="${esc(d.nome)}"></div>
      <div class="form-row"><label for="pa-email">E-mail *</label><input id="pa-email" type="email" maxlength="160" autocomplete="email" value="${esc(d.email)}"></div>
      <div class="form-row"><label for="pa-tel">Telefone / WhatsApp *</label><input id="pa-tel" type="tel" maxlength="30" autocomplete="tel" placeholder="(21) 99999-9999" value="${esc(d.tel)}"></div>
      <div class="form-row"><label for="pa-cep">CEP *</label><input id="pa-cep" inputmode="numeric" maxlength="9" autocomplete="postal-code" placeholder="00000-000" value="${esc(d.cep)}"></div>` : ''}
    ${e === 2 ? `<h3>Informações importantes</h3>
      <fieldset class="funcoes"><legend>Possui alguma restrição alimentar ou necessidade especial em relação à alimentação? *</legend>
        <label><input type="radio" name="pa-rest" value="nao_vegetariano"${d.rest === 'nao_vegetariano' ? ' checked' : ''}> Não vegetariano</label>
        <label><input type="radio" name="pa-rest" value="vegetariano"${d.rest === 'vegetariano' ? ' checked' : ''}> Vegetariano</label></fieldset>
      <div class="form-row"><label for="pa-outra">Outra necessidade (alergia, acessibilidade…) <small>opcional</small></label><input id="pa-outra" maxlength="200" value="${esc(d.outra)}"></div>` : ''}
    ${e === 3 ? `<h3>Contribuição</h3>
      <fieldset class="funcoes"><legend>Escolha a sua participação *</legend>${(ev.opcoes || []).map(o => `<label><input type="radio" name="pa-opcao" value="${esc(o.id)}"${d.opcao === o.id ? ' checked' : ''}> ${esc(o.nome)} — <strong>${o.valor_centavos ? brl(o.valor_centavos) : 'sem contribuição'}</strong></label>`).join('')}</fieldset>
      <fieldset class="funcoes"><legend>Como prefere pagar?</legend>
        <label><input type="radio" name="pa-forma" value="pix"${d.forma !== 'presencial' ? ' checked' : ''}> Pix (o código aparece na próxima tela)</label>
        <label><input type="radio" name="pa-forma" value="presencial"${d.forma === 'presencial' ? ' checked' : ''}> Pagar presencialmente no Parque</label></fieldset>
      <label class="pa-conf"><input type="checkbox" id="pa-ok"${d.ok ? ' checked' : ''}> Confirmo minha participação no evento e estou ciente da contribuição correspondente aos dias escolhidos.</label>
      <p class="pa-peq">Usamos seus dados (nome, e-mail, telefone, CEP e alimentação) só para organizar este evento e avaliá-lo depois. Não vendemos nem cedemos dados.</p>` : ''}
    <p class="form-erro" role="alert"${S.erro ? '' : ' hidden'}>${esc(S.erro)}</p>
    <p class="pa-botoes">${e > 1 ? '<button type="button" class="btn-visit" id="pa-volta"><i class="fas fa-arrow-left"></i> Voltar</button> ' : ''}<button class="btn-visit btn-large" id="pa-segue"${S.env ? ' disabled' : ''}>${e < 3 ? 'Continuar <i class="fas fa-arrow-right"></i>' : (S.env ? 'Enviando…' : '<i class="fas fa-check"></i> Concluir inscrição')}</button></p></form>`;
    const f = raiz.querySelector('#pa-form');
    f.onsubmit = ev2 => { ev2.preventDefault(); lerCampos(); const er = valida(); if (er) { S.erro = er; draw(); return; } S.erro = ''; if (S.etapa < 3) { S.etapa++; draw(); window.scrollTo(0, 0); } else enviar(); };
    const v = raiz.querySelector('#pa-volta'); if (v) v.onclick = () => { lerCampos(); S.erro = ''; S.etapa--; draw(); };
  }
  function cabecalho() {
    const ev = S.ev;
    const t = document.getElementById('pa-titulo'); if (t) t.textContent = ev.titulo || 'Participação no evento';
    const i = document.getElementById('pa-info'); if (i) i.innerHTML = `${ev.data_texto ? `<p><i class="far fa-calendar-alt"></i> ${esc(ev.data_texto)}</p>` : ''}${ev.local_texto ? `<p><i class="fas fa-map-marker-alt"></i> ${esc(ev.local_texto)}</p>` : ''}${ev.aviso ? `<p class="tip-box" role="note"><i class="fas fa-info-circle"></i> ${esc(ev.aviso)}</p>` : ''}`;
    document.title = (ev.titulo || 'Participação') + ' | Parque de Estudo e Reflexão Retiro';
  }
  if (!id) { msg('Evento não identificado. Use o link que o Parque divulgou.'); return; }
  raiz.innerHTML = '<p class="vazio">Carregando…</p>';
  publicoRpc('pr_participacao_evento', { p_id: id }).then(ev => {
    if (!ev || !ev.ok) { msg(S.res ? 'Este evento já não recebe novas inscrições.' : 'Este evento não está recebendo inscrições agora.'); return; }
    S.ev = ev; cabecalho();
    if (S.res) { telaResultado(); return; }
    if (ev.encerrado) { msg('As inscrições deste evento estão encerradas.'); return; }
    draw();
  }).catch(e => msg(e.message, 'form-erro'));
}

/* ---------- Botão em atividade.html ---------- */
function botaoParticipar(el, id) {
  if (!el || !id) return;
  publicoRpc('pr_participacao_evento', { p_id: id }).then(ev => {
    if (!ev || !ev.ok || ev.encerrado) return;
    const p = document.createElement('p'); p.className = 'atv-participar';
    p.innerHTML = `<a class="btn-visit btn-large" href="participar.html?id=${encodeURIComponent(id)}"><i class="fas fa-hand-point-right"></i> Quero participar</a>`;
    el.insertBefore(p, el.querySelector('.atv-corpo') || null);
  }).catch(() => { /* sem inscrição: nada a mostrar */ });
}

/* ---------- Área restrita ---------- */
const STATUS = { a_pagar: 'A pagar', informou: 'Disse que pagou', confirmado: 'Pago e confirmado', cancelado: 'Cancelada' };
function painel(me, root, H, at, voltar) {
  const S = { cfg: null, ins: [], tot: null, erro: '', msg: '', filtro: '', carregou: false, opc: null, tipo: '' };
  // PR_SUPABASE.rpc devolve { status, corpo }: aqui vira o corpo, ou um erro com a mensagem do servidor.
  const rpc = async (fn, c) => {
    if (!(window.PR_SUPABASE && window.PR_SUPABASE.rpc)) throw new Error('Disponível só no site publicado, com login.');
    const r = await window.PR_SUPABASE.rpc(fn, c);
    if (r && r.status >= 400) { const m = r.corpo && (r.corpo.message || r.corpo.msg); throw new Error(r.status === 404 ? 'A migração 0027 ainda não foi aplicada no servidor.' : (m || 'O servidor recusou (' + r.status + ').')); }
    return r && r.corpo !== undefined ? r.corpo : r;
  };
  const admAtiv = H.tem(me, 'atividades');
  const dataTxt = d => d ? String(d).split('-').reverse().join('/') : '';
  const q = s => root.querySelector(s);
  async function carregar() {
    try {
      const r = await rpc('pr_participacao_listar', { p_id: at.id });
      S.cfg = r.config; S.ins = r.inscricoes || []; S.tot = r.totais || {}; S.erro = '';
    } catch (e) { S.erro = /42501|Sem permiss/.test(e.message) ? 'Você não tem permissão para ver as inscrições desta atividade.' : e.message; }
    S.carregou = true; if (!S.opc) S.opc = ((S.cfg && S.cfg.opcoes) || []).map(o => ({ id: o.id, nome: o.nome, valor: (o.valor_centavos / 100).toFixed(2).replace('.', ',') }));
    if (!S.opc.length) S.opc = [{ id: '', nome: '', valor: '' }];
    draw();
  }
  const lerOpcoes = () => Array.from(root.querySelectorAll('.pa-op')).map(l => ({ id: l.dataset.id || '', nome: l.querySelector('.pa-on').value, valor: l.querySelector('.pa-ov').value }));
  function csv() {
    const cab = ['Código', 'Nome', 'E-mail', 'Telefone', 'CEP', 'Alimentação', 'Outra necessidade', 'Opção', 'Valor a pagar (R$)', 'Forma', 'Situação', 'Presente', 'Inscrição em'];
    const lin = S.ins.map(i => [i.codigo, i.nome, i.email, i.telefone, i.cep, i.restricao === 'vegetariano' ? 'Vegetariano' : 'Não vegetariano', i.outra || '', i.opcao_nome, ((i.valor_centavos + i.extra_centavos) / 100).toFixed(2).replace('.', ','), i.forma === 'pix' ? 'Pix' : 'Presencial', STATUS[i.status], i.presente ? 'Sim' : 'Não', i.criado_em]);
    const t = '﻿' + [cab].concat(lin).map(l => l.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(';')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/csv;charset=utf-8' })); a.download = 'inscricoes-' + at.id + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function draw() {
    const c = S.cfg || {}, t = S.tot || {}, ativo = c.ativo !== undefined ? c.ativo : false;
    const lista = S.ins.filter(i => !S.filtro || (S.filtro === 'pagar' ? ['a_pagar', 'informou'].includes(i.status) : i.status === S.filtro));
    root.innerHTML = `<div class="pa-painel"><p><button type="button" class="btn-visit" id="pa-fecha"><i class="fas fa-arrow-left"></i> Voltar às atividades</button></p>
    <h3><i class="fas fa-hand-holding-heart"></i> Participação: ${esc(at.titulo)}</h3>
    ${S.msg ? `<p class="tip-box" role="status">${esc(S.msg)}</p>` : ''}${S.erro ? `<p class="form-erro" role="alert">${esc(S.erro)}</p>` : ''}
    ${!S.carregou ? '<p class="vazio">Carregando…</p>' : `
    <div class="pa-cards" role="group" aria-label="Resumo">
      <div><strong>${t.inscritos || 0}</strong><span>inscritos</span></div><div><strong>${t.presentes || 0}</strong><span>presentes</span></div>
      <div><strong>${t.vegetarianos || 0}</strong><span>vegetarianos</span></div><div><strong>${t.confirmados || 0}</strong><span>pagos e confirmados</span></div>
      <div><strong>${t.a_pagar || 0}</strong><span>a confirmar</span></div><div><strong>${brl(t.confirmado_centavos || 0)}</strong><span>recebido (de ${brl(t.esperado_centavos || 0)} esperados)</span></div></div>
    ${admAtiv ? `<details class="pa-conf-det"${S.cfg ? '' : ' open'}><summary><strong>Configurar a inscrição</strong> ${ativo ? '(ativa)' : '(desativada)'}</summary>
      <form id="pa-cfg" class="form-reserva" novalidate>
        <label><input type="checkbox" id="pc-ativo"${ativo ? ' checked' : ''}> Receber inscrições deste evento</label>
        <div class="form-row"><label for="pc-t">Título do evento</label><input id="pc-t" maxlength="160" value="${esc(c.titulo || at.titulo)}"></div>
        <div class="form-row"><label for="pc-d">Data e horário (como aparecerá)</label><input id="pc-d" maxlength="160" value="${esc(c.data_texto || dataTxt(at.dataAtiv))}"></div>
        <div class="form-row"><label for="pc-l">Local</label><input id="pc-l" maxlength="160" value="${esc(c.local_texto || at.local || '')}"></div>
        <div class="form-row"><label for="pc-a">Aviso na página (opcional)</label><input id="pc-a" maxlength="400" value="${esc(c.aviso || '')}"></div>
        <fieldset class="funcoes"><legend>Opções de participação e valores</legend>
          ${S.opc.map((o, i) => `<div class="pa-op" data-id="${esc(o.id)}"><input class="pa-on" maxlength="120" placeholder="Ex.: Domingo 29/11" aria-label="Nome da opção ${i + 1}" value="${esc(o.nome)}"> <span>R$</span> <input class="pa-ov" inputmode="decimal" size="8" placeholder="35,00" aria-label="Valor da opção ${i + 1} em reais" value="${esc(o.valor)}"> <button type="button" class="btn-visit pa-rm" data-i="${i}" aria-label="Remover opção ${i + 1}"><i class="fas fa-times"></i></button></div>`).join('')}
          <p><button type="button" class="btn-visit" id="pc-add"><i class="fas fa-plus"></i> Adicionar opção</button></p></fieldset>
        <fieldset class="funcoes"><legend>Pix que recebe a contribuição</legend>
          <div class="form-row"><label for="pc-tp">Tipo da chave</label><select id="pc-tp">${[['celular', 'Celular'], ['email', 'E-mail'], ['cpfcnpj', 'CPF ou CNPJ'], ['aleatoria', 'Chave aleatória']].map(([k, n]) => `<option value="${k}"${(S.tipo || (c.pix_chave ? window.PR_PIX.tipoDaChave(c.pix_chave) : 'celular')) === k ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
          <div class="form-row"><label for="pc-k">Chave Pix</label><input id="pc-k" maxlength="80" value="${esc(c.pix_chave || '')}"></div>
          <div class="form-row"><label for="pc-n">Nome de quem recebe (como no banco, até 25 letras)</label><input id="pc-n" maxlength="25" value="${esc(c.pix_nome || '')}"></div>
          <div class="form-row"><label for="pc-c">Cidade de quem recebe (até 15 letras)</label><input id="pc-c" maxlength="15" value="${esc(c.pix_cidade || 'Maricá')}"></div></fieldset>
        <div class="form-row"><label for="pc-p">Último dia para se inscrever (opcional)</label><input id="pc-p" type="date" value="${esc(c.prazo || '')}"></div>
        <div class="form-row"><label for="pc-v">Número de vagas (opcional)</label><input id="pc-v" type="number" min="1" max="2000" value="${c.vagas || ''}"></div>
        <p class="form-erro" id="pc-er" role="alert" hidden></p>
        <button class="btn-visit btn-large"><i class="fas fa-save"></i> Salvar configuração</button></form></details>` : (S.cfg ? '' : '<p class="tip-box" role="note">A inscrição desta atividade ainda não foi configurada. Peça ao Administrador das Atividades.</p>')}
    ${S.cfg && ativo ? `<div class="form-row"><label for="pa-lk">Link do formulário (use no banner, Linktree e WhatsApp)</label><input id="pa-lk" readonly value="${esc(linkForm(at.id))}"> <button type="button" class="btn-visit" id="pa-lkc"><i class="fas fa-copy"></i> Copiar link</button></div>` : ''}
    ${S.cfg ? `<h4>Inscrições (${lista.length})</h4>
      <div class="rc-filtros"><div class="form-row"><label for="pa-fil">Mostrar</label><select id="pa-fil"><option value="">Todas</option><option value="pagar"${S.filtro === 'pagar' ? ' selected' : ''}>Falta confirmar pagamento</option><option value="confirmado"${S.filtro === 'confirmado' ? ' selected' : ''}>Pagas e confirmadas</option><option value="cancelado"${S.filtro === 'cancelado' ? ' selected' : ''}>Canceladas</option></select></div>
        <button type="button" class="btn-visit" id="pa-csv"${S.ins.length ? '' : ' disabled'}><i class="fas fa-file-csv"></i> Baixar lista (CSV)</button> <button type="button" class="btn-visit" id="pa-rec"><i class="fas fa-sync"></i> Atualizar</button></div>
      ${lista.length ? `<div class="doc-wrap"><table class="doc-table"><thead><tr><th>Código</th><th>Nome</th><th>Contato</th><th>Alimentação</th><th>Participação</th><th>Valor a receber</th><th>Situação</th><th></th></tr></thead><tbody>${lista.map(i => `<tr>
        <td>${esc(i.codigo)}</td><td>${esc(i.nome)}${i.presente ? ' <i class="fas fa-user-check" title="Presente"></i>' : ''}<br><small>CEP ${esc(i.cep)}</small></td><td>${esc(i.email)}<br>${esc(i.telefone)}</td>
        <td>${i.restricao === 'vegetariano' ? 'Vegetariano' : 'Não vegetariano'}${i.outra ? '<br><small>' + esc(i.outra) + '</small>' : ''}</td><td>${esc(i.opcao_nome)}<br><small>${i.forma === 'pix' ? 'Pix' : 'Presencial'}</small></td>
        <td><strong>${brl(i.valor_centavos + i.extra_centavos)}</strong></td><td>${esc(STATUS[i.status])}</td>
        <td>${i.status !== 'cancelado' ? `${i.status === 'confirmado' ? `<button type="button" class="btn-visit" data-a="desfazer" data-c="${esc(i.codigo)}">Desfazer</button>` : `<button type="button" class="btn-visit" data-a="confirmar" data-c="${esc(i.codigo)}"><i class="fas fa-check"></i> Confirmar pagamento</button>`} ${i.presente ? '' : `<button type="button" class="btn-visit" data-a="presente" data-c="${esc(i.codigo)}">Marcar presença</button>`} <button type="button" class="btn-visit" data-a="cancelar" data-c="${esc(i.codigo)}">Cancelar</button>` : `<button type="button" class="btn-visit" data-a="reabrir" data-c="${esc(i.codigo)}">Reabrir</button>`}</td></tr>`).join('')}</tbody></table></div>` : '<p class="vazio">Nenhuma inscrição por aqui ainda.</p>'}` : ''}`}</div>`;
    q('#pa-fecha').onclick = voltar;
    const lk = q('#pa-lkc'); if (lk) lk.onclick = async () => { S.msg = (await copiar(q('#pa-lk').value)) ? 'Link copiado.' : 'Selecione o link e copie.'; draw(); };
    const fi = q('#pa-fil'); if (fi) fi.onchange = e => { S.filtro = e.target.value; draw(); };
    const cs = q('#pa-csv'); if (cs) cs.onclick = csv;
    const rc = q('#pa-rec'); if (rc) rc.onclick = () => { S.msg = ''; carregar(); };
    root.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => {
      if (b.dataset.a === 'cancelar' && !confirm('Cancelar esta inscrição? Os centavos e a vaga ficam livres.')) return;
      try { await rpc('pr_participacao_atualizar', { p_evento: at.id, p_codigo: b.dataset.c, p_acao: b.dataset.a }); S.msg = ''; await carregar(); } catch (e) { S.erro = e.message; draw(); }
    });
    // Ao incluir/remover uma opção a tela é redesenhada: guarda antes o que já foi digitado nos outros campos.
    const guarda = () => { const v = id => (q('#' + id) || {}).value || ''; S.opc = lerOpcoes(); S.cfg = Object.assign({}, S.cfg || {}, { ativo: q('#pc-ativo').checked, titulo: v('pc-t'), data_texto: v('pc-d'), local_texto: v('pc-l'), aviso: v('pc-a'), pix_chave: v('pc-k'), pix_nome: v('pc-n'), pix_cidade: v('pc-c'), prazo: v('pc-p'), vagas: v('pc-v') || null }); S.tipo = v('pc-tp'); };
    const reabre = () => { draw(); root.querySelector('details').open = true; };
    const add = q('#pc-add'); if (add) add.onclick = () => { guarda(); S.opc.push({ id: '', nome: '', valor: '' }); reabre(); };
    root.querySelectorAll('.pa-rm').forEach(b => b.onclick = () => { guarda(); S.opc.splice(+b.dataset.i, 1); if (!S.opc.length) S.opc = [{ id: '', nome: '', valor: '' }]; reabre(); });
    const f = q('#pa-cfg'); if (f) f.onsubmit = async e => {
      e.preventDefault(); const er = q('#pc-er'), g = id => (q('#' + id).value || '').trim();
      const falha = m => { er.textContent = m; er.hidden = false; };
      const ops = []; for (const o of lerOpcoes()) {
        if (!o.nome.trim() && !o.valor.trim()) continue;
        const v = o.valor.trim() === '' ? NaN : Math.round(parseFloat(o.valor.replace(/\./g, '').replace(',', '.')) * 100);
        if (!o.nome.trim() || !(v >= 0)) return falha('Cada opção precisa de nome e valor (use 0 para sem contribuição).');
        ops.push({ id: o.id, nome: o.nome.trim(), valor_centavos: v });
      }
      const tipo = g('pc-tp'), chave = window.PR_PIX.normalizaChave(tipo, g('pc-k'));
      const ativoN = q('#pc-ativo').checked;
      if (ativoN && !ops.length) return falha('Inclua ao menos uma opção de participação.');
      if (ativoN && !chave) return falha('Informe a chave Pix.');
      if (ativoN && !g('pc-n')) return falha('Informe o nome de quem recebe o Pix.');
      const cfg = { ativo: ativoN, titulo: g('pc-t'), data_texto: g('pc-d'), local_texto: g('pc-l'), aviso: g('pc-a'), opcoes: ops, pix_chave: chave, pix_nome: g('pc-n'), pix_cidade: g('pc-c'), prazo: g('pc-p'), vagas: g('pc-v'), resp_email: at.respEmail || at.criadoPorEmail || me.email };
      try { await rpc('pr_participacao_config_salvar', { p_id: at.id, p_cfg: cfg }); S.opc = null; S.tipo = ''; S.msg = ativoN ? 'Configuração salva. A inscrição está ativa.' : 'Configuração salva (inscrição desativada).'; await carregar(); }
      catch (e2) { falha(e2.message); }
    };
  }
  draw(); carregar();
}

window.PR_PARTICIPACAO = { painel, botaoParticipar, linkForm };
const pg = document.body && document.body.dataset.page;
if (pg === 'participar') paginaPublica();
})();
