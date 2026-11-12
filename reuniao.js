// Reunião de Escola (área restrita, Comissões Parque Retiro). Dados no navegador (chave pr_reuniao_escola).
// Substitui a rotina do grupo de WhatsApp: pesquisa de 2 datas de fim de semana, confirmação de presença (presencial ou virtual)
// e temas propostos livremente pelos Mestres. Votos e presenças são VISÍVEIS (com o nome de cada pessoa).
// Quem participa: qualquer pessoa com conta na área restrita (todos os Mestres, de qualquer nível; participação livre).
//   -> quando os perfis (Prompt 02) existirem, restringir a quem for Mestre.
// Quem cria a reunião, define e altera a data: administrador e Administrador das Atividades. A data pode ser alterada a qualquer momento.
// Pauta orgânica: qualquer pessoa propõe tema; ninguém barra tema dos outros (o autor pode retirar o próprio).
// A data definida vira atividade "Reunião de Escola" no calendário (chave 'ativ'). Só tela: a trava real vem com o servidor,
// e sem servidor cada navegador enxerga apenas os próprios dados (os votos de várias pessoas só se juntam com o servidor).
(function () {
const ST_CLASSE = { 'Escolhendo a data': 'badge-pend', 'Data definida': 'badge-uso', 'Realizada': 'badge-disponivel', 'Cancelada': 'badge-indisponivel' };
const DATA_RESP = [['ambas', 'Posso nas duas datas'], ['a', 'Só na data A'], ['b', 'Só na data B'], ['nenhuma', 'Não posso em nenhuma']];
const PRES_RESP = [['presencial', 'Presencial'], ['virtual', 'Virtual'], ['talvez', 'Ainda não sei'], ['nao', 'Não vou']];
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const rot = (lista, k) => (lista.find(x => x[0] === k) || [k, k])[1];

window.PR_REUNIAO = { abrir(me, root, H) {
  const { db, esc, $, uid, hoje, fmtData, csv, safeUrl } = H;
  const chave = String(me.email || me.nome || '').toLowerCase(), pode = H.tem(me, 'atividades'); // administrador ou Administrador das Atividades
  let selId = null, msg = '', erro = '', edit = null; // edit: 'novo' | 'dados' | 'data' | null
  const todas = () => db.get('reuniao_escola', []);
  const salva = l => db.set('reuniao_escola', l);
  const agora = () => { const d = new Date(), p = x => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; }; // hora local, com segundos
  const dow = d => new Date(d + 'T12:00:00').getDay();
  const fimDeSemana = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '') && (dow(d) === 0 || dow(d) === 6);
  const dataTxt = d => d ? `${DIAS[dow(d)]}, ${fmtData(d)}` : '-';
  const hist = (r, texto) => { (r.hist = r.hist || []).push({ em: agora(), por: me.nome, texto }); };
  const mut = (id, fn) => { const l = todas(), r = l.find(x => x.id === id); if (!r) return false; fn(r); return salva(l); };
  const encerrada = r => r.status === 'Realizada' || r.status === 'Cancelada';
  const nomes = o => Object.values(o || {}).map(v => v.nome);

  /* ---------- Atividade no calendário ---------- */
  const sincAtividade = r => {
    const al = db.get('ativ', []), f = r.final; if (!f || !f.data) return true;
    const dados = { titulo: r.titulo, data: f.data, fim: '', hora: f.hora || '', categoria: 'Reunião de Escola', local: f.local || '', descricao: 'Reunião de Escola. Presença e temas em Comissões Parque Retiro > Reunião de Escola.', origem: 'reuniao' };
    let a = r.ativId ? al.find(x => x.id === r.ativId) : null;
    if (a) Object.assign(a, dados); else { r.ativId = uid(); al.push({ id: r.ativId, ...dados, criado: hoje(), por: me.nome }); }
    return db.set('ativ', al);
  };

  /* ---------- Texto pronto para colar no WhatsApp ---------- */
  const textoWhats = r => {
    const dv = Object.values(r.votosData || {}), pr = Object.values(r.presenca || {}), ct = k => pr.filter(p => p.resp === k).length;
    const temas = (r.temas || []).filter(t => !t.retirado), L = [`*${r.titulo}*`];
    if (r.final && r.final.data) L.push(`Data: ${dataTxt(r.final.data)}${r.final.hora ? ' às ' + r.final.hora : ''}${r.final.local ? ' · ' + r.final.local : ''}`, r.final.link ? 'Link: ' + r.final.link : '');
    else { L.push('Escolha da data (responda na área restrita, Comissões Parque Retiro > Reunião de Escola):'); r.opcoes.forEach((o, i) => { const k = i ? 'b' : 'a'; L.push(`${i ? 'B' : 'A'}) ${dataTxt(o.data)}${r.horario ? ' às ' + r.horario : ''} — pode: ${dv.filter(v => v.resp === 'ambas' || v.resp === k).length}`); }); }
    if (r.prazo) L.push('Responder até ' + fmtData(r.prazo));
    L.push(`Presença: presencial ${ct('presencial')}, virtual ${ct('virtual')}, ainda não sabem ${ct('talvez')}, não vão ${ct('nao')}`);
    if (temas.length) { L.push('Temas propostos:'); temas.slice().sort((a, b) => Object.keys(b.apoios || {}).length - Object.keys(a.apoios || {}).length).forEach(t => L.push('• ' + t.titulo + (Object.keys(t.apoios || {}).length ? ` (${Object.keys(t.apoios).length} apoio(s))` : ''))); }
    return L.filter(x => x !== '').join('\n');
  };

  /* ---------- Lista ---------- */
  const listaView = el => {
    const l = todas().slice().sort((a, b) => (encerrada(a) - encerrada(b)) || (b.criado || '').localeCompare(a.criado || ''));
    el.innerHTML = `<h3><i class="fas fa-users"></i> Reunião de Escola</h3>
    <p>Pesquisa de datas (dois dias de fim de semana), confirmação de presença (presencial ou virtual) e temas propostos por qualquer Mestre. Participação livre; votos e presenças aparecem com o nome de cada pessoa.${pode ? '' : ' Criar reunião e definir a data é com o administrador e o Administrador das Atividades.'}</p>
    ${msg ? `<p class="tip-box" role="status"><i class="fas fa-check-circle"></i> ${esc(msg)}</p>` : ''}
    ${pode ? '<p><button class="btn-visit" id="r-novo"><i class="fas fa-plus-circle"></i> Nova reunião</button></p>' : ''}
    ${l.length ? `<table class="doc-table"><thead><tr><th>Reunião</th><th>Situação</th><th>Data</th><th>Respostas</th><th>Temas</th><th></th></tr></thead><tbody>${l.map(r => `<tr><td><strong>${esc(r.titulo)}</strong></td><td><span class="badge-status ${ST_CLASSE[r.status] || 'badge-pend'}">${esc(r.status)}</span></td><td>${r.final && r.final.data ? esc(dataTxt(r.final.data)) : r.opcoes.map(o => esc(fmtData(o.data))).join(' ou ')}</td><td>${Object.keys(r.votosData || {}).length} de data · ${Object.keys(r.presenca || {}).length} de presença</td><td>${(r.temas || []).filter(t => !t.retirado).length}</td><td><button class="btn-visit" data-abrir="${r.id}">Abrir</button></td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhuma reunião criada ainda.</p>'}`;
    const n = $('#r-novo', el); if (n) n.onclick = () => { edit = 'novo'; erro = ''; draw(); };
    el.querySelectorAll('[data-abrir]').forEach(b => b.onclick = () => { selId = b.dataset.abrir; msg = ''; draw(); window.scrollTo(0, 0); });
  };

  /* ---------- Criar / editar dados ---------- */
  const formDados = (el, r) => {
    const v = r || { titulo: 'Reunião de Escola', opcoes: [{ data: '' }, { data: '' }], horario: '', prazo: '' };
    el.innerHTML = `<h3><i class="fas ${r ? 'fa-edit' : 'fa-plus-circle'}"></i> ${r ? 'Editar a reunião' : 'Nova Reunião de Escola'}</h3>
    <form id="rf" class="form-reserva" novalidate>
      <div class="form-row"><label for="rf-t">Título *</label><input id="rf-t" maxlength="100" value="${esc(v.titulo)}" placeholder="Ex.: Reunião de Escola de novembro"></div>
      <div class="form-row"><label for="rf-a">Data A * (sábado ou domingo)</label><input id="rf-a" type="date" value="${esc(v.opcoes[0].data)}"></div>
      <div class="form-row"><label for="rf-b">Data B * (sábado ou domingo)</label><input id="rf-b" type="date" value="${esc(v.opcoes[1].data)}"></div>
      <div class="form-row"><label for="rf-h">Horário (opcional)</label><input id="rf-h" maxlength="20" value="${esc(v.horario || '')}" placeholder="Ex.: 19h"></div>
      <div class="form-row"><label for="rf-p">Responder até (opcional)</label><input id="rf-p" type="date" value="${esc(v.prazo || '')}"></div>
      <p class="form-erro" id="rf-e" role="alert" hidden></p>
      <button class="btn-visit btn-large"><i class="fas fa-save"></i> ${r ? 'Salvar' : 'Criar reunião'}</button> <button type="button" class="btn-visit btn-large" id="rf-x" style="background:#6c7a7b">Cancelar</button></form>`;
    $('#rf-x', el).onclick = () => { edit = null; erro = ''; draw(); };
    $('#rf', el).onsubmit = e => {
      e.preventDefault(); const g = id => $('#' + id, el).value.trim(), a = g('rf-a'), b = g('rf-b'), t = g('rf-t').replace(/\s+/g, ' ');
      const falha = m => { const x = $('#rf-e', el); x.textContent = m; x.hidden = false; };
      if (!pode) return falha('Só o administrador e o Administrador das Atividades criam ou editam a reunião.');
      if (!t) return falha('Informe o título.');
      if (!a || !b) return falha('Informe as duas datas.');
      if (a === b) return falha('As duas datas devem ser diferentes.');
      if (!fimDeSemana(a) || !fimDeSemana(b)) return falha('As datas da pesquisa devem cair em sábado ou domingo.');
      if (!r && (a < hoje() || b < hoje())) return falha('As datas não podem estar no passado.');
      const dados = { titulo: t, opcoes: [{ data: a }, { data: b }], horario: g('rf-h'), prazo: g('rf-p') };
      if (r) { const mudou = r.opcoes[0].data !== a || r.opcoes[1].data !== b; if (!mut(r.id, x => { Object.assign(x, dados); if (mudou) { x.votosData = {}; hist(x, 'Datas da pesquisa alteradas: os votos anteriores foram zerados'); } else hist(x, 'Dados da reunião atualizados'); })) return falha('Sem espaço no navegador para salvar.'); msg = 'Reunião atualizada.'; }
      else { const l = todas(), nova = { id: uid(), ...dados, status: 'Escolhendo a data', votosData: {}, presenca: {}, temas: [], final: null, ativId: '', criado: hoje(), por: me.nome, hist: [] }; hist(nova, 'Reunião criada'); l.push(nova); if (!salva(l)) return falha('Sem espaço no navegador para salvar.'); selId = nova.id; msg = 'Reunião criada. Compartilhe o texto do WhatsApp para chamar o pessoal.'; }
      edit = null; erro = ''; draw();
    };
  };

  /* ---------- Definir / alterar a data (organizador) ---------- */
  const formData = (el, r) => {
    const f = r.final || {};
    el.innerHTML = `<h3><i class="fas fa-calendar-check"></i> ${r.final ? 'Alterar' : 'Definir'} a data: ${esc(r.titulo)}</h3>
    <p><small>A data entra no calendário como "Reunião de Escola". Pode ser alterada depois; quem já respondeu a presença será avisado na tela de que a data mudou.</small></p>
    <form id="rd" class="form-reserva" novalidate>
      <div class="form-row"><label for="rd-o">Data *</label><select id="rd-o">${r.opcoes.map((o, i) => `<option value="${o.data}"${f.data === o.data ? ' selected' : ''}>${i ? 'B' : 'A'}: ${esc(dataTxt(o.data))}</option>`).join('')}<option value="__outra"${f.data && !r.opcoes.some(o => o.data === f.data) ? ' selected' : ''}>Outra data...</option></select></div>
      <div class="form-row" id="rd-ow"${f.data && !r.opcoes.some(o => o.data === f.data) ? '' : ' hidden'}><label for="rd-d">Outra data *</label><input id="rd-d" type="date" value="${esc(f.data && !r.opcoes.some(o => o.data === f.data) ? f.data : '')}"></div>
      <div class="form-row"><label for="rd-h">Horário</label><input id="rd-h" maxlength="20" value="${esc(f.hora || r.horario || '')}" placeholder="Ex.: 19h"></div>
      <div class="form-row"><label for="rd-l">Local</label><input id="rd-l" maxlength="100" value="${esc(f.local || 'Parque Retiro e Zoom')}"></div>
      <div class="form-row"><label for="rd-z">Link do Zoom (opcional)</label><input id="rd-z" maxlength="300" value="${esc(f.link || '')}" placeholder="https://..."></div>
      <p class="form-erro" id="rd-e" role="alert" hidden></p>
      <button class="btn-visit btn-large"><i class="fas fa-save"></i> Salvar a data</button> <button type="button" class="btn-visit btn-large" id="rd-x" style="background:#6c7a7b">Cancelar</button></form>`;
    $('#rd-o', el).onchange = e => { $('#rd-ow', el).hidden = e.target.value !== '__outra'; };
    $('#rd-x', el).onclick = () => { edit = null; erro = ''; draw(); };
    $('#rd', el).onsubmit = e => {
      e.preventDefault(); const g = id => $('#' + id, el).value.trim(), falha = m => { const x = $('#rd-e', el); x.textContent = m; x.hidden = false; };
      if (!pode) return falha('Só o administrador e o Administrador das Atividades definem a data.');
      const d = g('rd-o') === '__outra' ? g('rd-d') : g('rd-o'); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return falha('Informe a data.');
      const z = g('rd-z'); if (z && !(/^https:\/\//i.test(z) && safeUrl(z))) return falha('O link do Zoom deve começar com https://');
      const antes = r.final && r.final.data, novo = { data: d, hora: g('rd-h'), local: g('rd-l'), link: z };
      const ok = mut(r.id, x => { x.final = novo; x.status = 'Data definida'; if (antes && antes !== d) x.dataAlteradaEm = agora(); hist(x, antes ? (antes !== d ? `Data alterada de ${fmtData(antes)} para ${fmtData(d)}` : 'Detalhes da data atualizados') : 'Data definida: ' + fmtData(d)); });
      if (!ok) return falha('Sem espaço no navegador para salvar.');
      const r2 = todas().find(x => x.id === r.id); if (!sincAtividade(r2) || !salva(todas().map(x => x.id === r.id ? r2 : x))) return falha('A data foi salva, mas não coube no calendário (sem espaço no navegador).');
      edit = null; erro = ''; msg = 'Data salva e colocada no calendário.'; draw();
    };
  };

  /* ---------- Detalhe ---------- */
  const detalhe = (el, r) => {
    const dv = r.votosData || {}, pr = r.presenca || {}, meuV = (dv[chave] || {}).resp || '', meuP = (pr[chave] || {}).resp || '', fim = encerrada(r);
    const temas = (r.temas || []).slice().sort((a, b) => (a.retirado - b.retirado) || (Object.keys(b.apoios || {}).length - Object.keys(a.apoios || {}).length) || (a.em || '').localeCompare(b.em || ''));
    const visiveis = temas.filter(t => !t.retirado || t.autorKey === chave);
    const mudouData = r.dataAlteradaEm && pr[chave] && pr[chave].em < r.dataAlteradaEm;
    const porResp = (obj, lista) => lista.map(([k, tx]) => { const ns = Object.values(obj).filter(v => v.resp === k).map(v => v.nome); return `<tr><td>${esc(tx)}</td><td><strong>${ns.length}</strong></td><td>${lista_(ns)}</td></tr>`; }).join('');
    const lista_ = ns => ns.length ? ns.map(esc).join(', ') : '<small>ninguém ainda</small>';
    const ativ = (db.get('ativ', []).find(a => a.id === r.ativId) || null);
    el.innerHTML = `<p class="inv-noprint"><button class="btn-visit" id="d-v"><i class="fas fa-arrow-left"></i> Todas as reuniões</button>${pode ? ` <button class="btn-visit" id="d-e"><i class="fas fa-edit"></i> Editar dados</button> <button class="btn-visit" id="d-d"><i class="fas fa-calendar-check"></i> ${r.final ? 'Alterar a data' : 'Definir a data'}</button>${r.status === 'Realizada' || r.status === 'Cancelada' ? ' <button class="btn-visit" id="d-re">Reabrir</button>' : ' <button class="btn-visit" id="d-ok">Marcar como realizada</button> <button class="btn-visit" id="d-ca" style="background:#b8620f">Cancelar reunião</button>'}` : ''}</p>
    <h3>${esc(r.titulo)} <span class="badge-status ${ST_CLASSE[r.status] || 'badge-pend'}">${esc(r.status)}</span></h3>
    ${msg ? `<p class="tip-box" role="status"><i class="fas fa-check-circle"></i> ${esc(msg)}</p>` : ''}
    ${r.final && r.final.data ? `<p class="tip-box"><i class="fas fa-calendar-check"></i> <strong>${esc(dataTxt(r.final.data))}</strong>${r.final.hora ? ' às ' + esc(r.final.hora) : ''}${r.final.local ? ' · ' + esc(r.final.local) : ''}${r.final.link && safeUrl(r.final.link) ? ` · <a href="${esc(r.final.link)}" target="_blank" rel="noopener">Entrar no Zoom</a>` : ''}${ativ ? ' <small>(já está no calendário)</small>' : ''}</p>` : ''}
    ${mudouData ? '<p class="form-erro" role="alert"><i class="fas fa-exclamation-triangle"></i> A data mudou depois da sua resposta de presença. Confirme de novo abaixo.</p>' : ''}

    <h4><i class="fas fa-calendar-day"></i> 1. Qual data? ${r.prazo ? `<small>(responder até ${esc(fmtData(r.prazo))})</small>` : ''}</h4>
    <p><strong>Data A:</strong> ${esc(dataTxt(r.opcoes[0].data))} &nbsp; <strong>Data B:</strong> ${esc(dataTxt(r.opcoes[1].data))}${r.horario ? ' · ' + esc(r.horario) : ''}</p>
    ${fim ? '' : `<div class="form-row"><label for="v-r">Sua resposta</label><select id="v-r"><option value="">Escolha...</option>${DATA_RESP.map(([k, tx]) => `<option value="${k}"${k === meuV ? ' selected' : ''}>${esc(tx)}</option>`).join('')}</select> <button class="btn-visit" id="v-s">Salvar resposta</button></div>`}
    <table class="doc-table"><thead><tr><th>Resposta</th><th>Pessoas</th><th>Quem</th></tr></thead><tbody>${porResp(dv, DATA_RESP)}</tbody></table>
    <p><small>Podem na data A: <strong>${Object.values(dv).filter(v => v.resp === 'ambas' || v.resp === 'a').length}</strong> · Podem na data B: <strong>${Object.values(dv).filter(v => v.resp === 'ambas' || v.resp === 'b').length}</strong></small></p>

    <h4><i class="fas fa-user-check"></i> 2. Presença</h4>
    ${fim ? '' : `<div class="form-row"><label for="p-r">Você vem?</label><select id="p-r"><option value="">Escolha...</option>${PRES_RESP.map(([k, tx]) => `<option value="${k}"${k === meuP ? ' selected' : ''}>${esc(tx)}</option>`).join('')}</select> <button class="btn-visit" id="p-s">Confirmar</button></div>`}
    <div class="totais">${PRES_RESP.map(([k, tx]) => `<div><span>${esc(tx)}</span><strong>${Object.values(pr).filter(v => v.resp === k).length}</strong></div>`).join('')}</div>
    <table class="doc-table"><thead><tr><th>Resposta</th><th>Pessoas</th><th>Quem</th></tr></thead><tbody>${porResp(pr, PRES_RESP)}</tbody></table>

    <h4><i class="fas fa-lightbulb"></i> 3. Temas para a reunião <small>(qualquer Mestre propõe, sem aprovação prévia)</small></h4>
    ${fim ? '' : `<form id="t-f" class="form-reserva" novalidate><div class="form-row"><label for="t-t">Proponha um tema *</label><input id="t-t" maxlength="120"></div><div class="form-row"><label for="t-d">Descrição (opcional)</label><textarea id="t-d" rows="2" maxlength="600"></textarea></div><p class="form-erro" id="t-e" role="alert" hidden></p><button class="btn-visit"><i class="fas fa-plus"></i> Propor tema</button></form>`}
    ${visiveis.length ? visiveis.map(t => { const ap = t.apoios || {}, eu = !!ap[chave]; return `<div class="card" style="margin:10px 0;padding:12px;${t.retirado ? 'opacity:.6' : ''}">
      <strong>${esc(t.titulo)}</strong> ${t.tratado ? '<span class="badge-status badge-disponivel">Tratado</span>' : ''}${t.retirado ? '<span class="badge-status badge-indisponivel">Retirado por você</span>' : ''}
      <br><small>Proposto por ${esc(t.autor)} em ${esc(fmtData(t.em))}</small>${t.descricao ? `<p>${esc(t.descricao).replace(/\n/g, '<br>')}</p>` : ''}
      <p><small>Apoios (${Object.keys(ap).length}): ${lista_(Object.values(ap).map(a => a.nome))}</small></p>
      ${(t.coment || []).map(c => `<p style="margin:2px 0 2px 14px"><small><strong>${esc(c.nome)}</strong> (${esc(fmtData(c.em))}): ${esc(c.texto)}</small></p>`).join('')}
      <p class="inv-noprint">${fim || t.retirado ? '' : `<button class="btn-visit" data-ap="${t.id}">${eu ? 'Retirar meu apoio' : 'Apoiar este tema'}</button> `}${t.autorKey === chave && !fim && !t.retirado ? `<button class="btn-visit" data-ret="${t.id}" style="background:#6c7a7b">Retirar meu tema</button> ` : ''}${pode && !t.retirado ? `<button class="btn-visit" data-tr="${t.id}" style="background:#6c7a7b">${t.tratado ? 'Marcar como não tratado' : 'Marcar como tratado'}</button>` : ''}</p>
      ${t.retirado || fim ? '' : `<div class="form-row"><label for="c-${t.id}">Comentar</label><input id="c-${t.id}" maxlength="300"> <button class="btn-visit" data-co="${t.id}">Enviar</button></div>`}</div>`; }).join('') : '<p class="vazio">Nenhum tema proposto ainda.</p>'}

    <h4><i class="fas fa-share-alt"></i> Para o grupo do WhatsApp</h4>
    <p><small>Copie o texto e cole no grupo: o site não envia mensagens sozinho.</small></p>
    <textarea id="w-t" rows="8" readonly style="width:100%">${esc(textoWhats(r))}</textarea>
    <p class="inv-noprint"><button class="btn-visit" id="w-c"><i class="fas fa-copy"></i> Copiar texto</button> <button class="btn-visit" id="w-csv"><i class="fas fa-file-csv"></i> Baixar votos e presenças (CSV)</button></p>
    ${(r.hist || []).length ? `<h4>Histórico</h4><ul>${(r.hist || []).slice(-12).reverse().map(h => `<li><small>${esc(h.em)} · ${esc(h.por)}: ${esc(h.texto)}</small></li>`).join('')}</ul>` : ''}`;
    const saveMsg = (m, ok) => { msg = ok ? m : ''; if (!ok) alert('Sem espaço no navegador para salvar.'); draw(); };
    $('#d-v', el).onclick = () => { selId = null; msg = ''; draw(); };
    if (pode) {
      $('#d-e', el).onclick = () => { edit = 'dados'; erro = ''; draw(); };
      $('#d-d', el).onclick = () => { edit = 'data'; erro = ''; draw(); };
      const ok = $('#d-ok', el), ca = $('#d-ca', el), re = $('#d-re', el);
      if (ok) ok.onclick = () => { if (confirm('Marcar esta reunião como realizada? As respostas ficam guardadas, só para consulta.')) saveMsg('Reunião marcada como realizada.', mut(r.id, x => { x.status = 'Realizada'; hist(x, 'Marcada como realizada'); })); };
      if (ca) ca.onclick = () => { if (confirm('Cancelar esta reunião?')) saveMsg('Reunião cancelada.', mut(r.id, x => { x.status = 'Cancelada'; hist(x, 'Reunião cancelada'); })); };
      if (re) re.onclick = () => saveMsg('Reunião reaberta.', mut(r.id, x => { x.status = x.final && x.final.data ? 'Data definida' : 'Escolhendo a data'; hist(x, 'Reunião reaberta'); }));
      el.querySelectorAll('[data-tr]').forEach(b => b.onclick = () => saveMsg('', mut(r.id, x => { const t = x.temas.find(y => y.id === b.dataset.tr); if (t) t.tratado = !t.tratado; })));
    }
    const vs = $('#v-s', el); if (vs) vs.onclick = () => { const v = $('#v-r', el).value; if (!v) { erro = ''; msg = ''; alert('Escolha uma resposta.'); return; } saveMsg('Resposta de data salva.', mut(r.id, x => { (x.votosData = x.votosData || {})[chave] = { nome: me.nome, resp: v, em: agora() }; })); };
    const ps = $('#p-s', el); if (ps) ps.onclick = () => { const v = $('#p-r', el).value; if (!v) { alert('Escolha uma resposta.'); return; } saveMsg('Presença registrada.', mut(r.id, x => { (x.presenca = x.presenca || {})[chave] = { nome: me.nome, resp: v, em: agora() }; })); };
    const tf = $('#t-f', el); if (tf) tf.onsubmit = e => {
      e.preventDefault(); const t = $('#t-t', el).value.replace(/\s+/g, ' ').trim(), er = $('#t-e', el); if (!t) { er.textContent = 'Escreva o tema.'; er.hidden = false; return; }
      saveMsg('Tema proposto.', mut(r.id, x => { x.temas.push({ id: uid(), titulo: t, descricao: $('#t-d', el).value.trim(), autor: me.nome, autorKey: chave, em: hoje(), apoios: {}, coment: [], retirado: false, tratado: false }); }));
    };
    el.querySelectorAll('[data-ap]').forEach(b => b.onclick = () => saveMsg('', mut(r.id, x => { const t = x.temas.find(y => y.id === b.dataset.ap); if (!t) return; t.apoios = t.apoios || {}; if (t.apoios[chave]) delete t.apoios[chave]; else t.apoios[chave] = { nome: me.nome, em: hoje() }; })));
    el.querySelectorAll('[data-ret]').forEach(b => b.onclick = () => { if (confirm('Retirar o seu tema? Os outros deixam de vê-lo.')) saveMsg('Tema retirado.', mut(r.id, x => { const t = x.temas.find(y => y.id === b.dataset.ret); if (t && t.autorKey === chave) t.retirado = true; })); });
    el.querySelectorAll('[data-co]').forEach(b => b.onclick = () => { const tx = ($('#c-' + b.dataset.co, el).value || '').trim(); if (!tx) return; saveMsg('Comentário enviado.', mut(r.id, x => { const t = x.temas.find(y => y.id === b.dataset.co); if (t) (t.coment = t.coment || []).push({ nome: me.nome, texto: tx, em: hoje() }); })); });
    $('#w-c', el).onclick = () => { const t = $('#w-t', el); t.select(); let ok = false; try { ok = navigator.clipboard ? (navigator.clipboard.writeText(t.value), true) : document.execCommand('copy'); } catch (e) { try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } } alert(ok ? 'Texto copiado. Cole no grupo do WhatsApp.' : 'Selecione o texto e copie com Ctrl+C.'); };
    $('#w-csv', el).onclick = () => {
      const rows = [['Tipo', 'Pessoa', 'Resposta', 'Registrado em']];
      Object.values(dv).forEach(v => rows.push(['Data', v.nome, rot(DATA_RESP, v.resp), v.em])); Object.values(pr).forEach(v => rows.push(['Presença', v.nome, rot(PRES_RESP, v.resp), v.em]));
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = `reuniao-escola-${hoje()}.csv`; a.click();
    };
  };

  const draw = () => {
    const r = selId ? todas().find(x => x.id === selId) : null;
    if (selId && !r) selId = null;
    if (edit === 'novo' && pode) return formDados(root, null);
    if (edit === 'dados' && pode && r) return formDados(root, r);
    if (edit === 'data' && pode && r) return formData(root, r);
    edit = null; erro = '';
    r ? detalhe(root, r) : listaView(root);
  };
  draw();
} };
})();
