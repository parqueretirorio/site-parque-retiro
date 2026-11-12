// Comunicação › E-mail marketing.
//  - Campanhas: escolhe uma, várias ou todas as listas; personaliza com o nome da pessoa ({{primeiro_nome}}, {{nome}});
//    filtra o público pelo perfil (interesses e engajamento).
//  - Aquecimento: limite diário que cresce aos poucos (rampa), mandando primeiro para quem mais abre e clica.
//    Assim o domínio novo ganha reputação e os e-mails não voltam nem caem no spam.
//  - Perfis: cada abertura e clique ensina o sistema; os interesses da pessoa crescem com o tema das campanhas em que ela clica.
// Enquanto o serviço de envio não estiver ligado, o lote do dia é enviado pelo programa de e-mail (um por pessoa ou mala direta)
// e marcado aqui como enviado. Quando o serviço estiver ligado (e-mail do domínio + Brevo/Resend), o mesmo lote sai sozinho.
(function () {
const RAMPA = [20, 30, 50, 80, 120, 170, 230, 300, 400, 500, 650, 800, 1000, 1300, 1600, 2000];
const INTERESSES = ['Eventos e festivais', 'Retiros e alojamento', 'Estudo e Escola', 'Livros e lançamentos', 'Voluntariado', 'Doações e campanhas', 'Meditação e ofícios', 'Notícias do Parque'];
const ENGAJ = { todos: 'Todos', engajados: 'Engajados (abriram ou clicaram nos últimos 90 dias)', novos: 'Novos (nunca receberam)', interessados: 'Só quem tem os interesses marcados abaixo' };
const SEM_RESPOSTA = 5; // depois de 5 envios sem nenhuma abertura, a pessoa sai do envio automático (higiene da lista)
const hoje = () => new Date().toISOString().slice(0, 10);
const diasEntre = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
const H = { db: null, esc: s => String(s == null ? '' : s), uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };

/* ---------- Convite para a área restrita ---------- */
const CONVITE = {
  pt: {
    assunto: 'Convite: sua conta na área restrita do Parque Retiro', saudacao: 'Olá, {{primeiro_nome}}!',
    titulo: 'Você está convidado(a) para o CONecta Retiro', botao: 'Criar minha conta',
    texto: 'O CONecta Retiro é a nova área restrita (site e app) dos Mestres, das Comissões e da Administração do Parque de Estudo e Reflexão Retiro. Nela ficam avisos, agenda, atividades, Reunião de Escola, documentos e as ferramentas de cada comissão.\n\nPara entrar, crie a sua conta (leva uns 3 minutos):\n1. Toque no botão abaixo.\n2. Preencha nome completo, e-mail, WhatsApp e crie uma senha.\n3. Você vai receber um e-mail do CONecta Retiro: abra e toque em confirmar. Se não aparecer, olhe no Spam ou em Promoções.\n4. Aguarde a aprovação. Depois é só entrar com o seu e-mail e senha, pelo site ou pelo app.\n\nImportante: a partir de 27/11 o endereço passa a ser parqueretiro.org.br. Seu e-mail e sua senha continuam os mesmos.\n\nDentro do site e do app há o botão Ajuda, que explica cada tela. Qualquer dúvida, é só responder este e-mail.',
    rodape: 'Você recebe este convite porque é Mestre ou faz parte das comissões ou da administração do Parque Retiro. Se não quiser participar, é só ignorar este e-mail.', lembrete: 'Lembrete: '
  },
  es: {
    assunto: 'Invitación: tu cuenta en el área restringida del Parque Retiro', saudacao: '¡Hola, {{primeiro_nome}}!',
    titulo: 'Estás invitado(a) a CONecta Retiro', botao: 'Crear mi cuenta',
    texto: 'CONecta Retiro es la nueva área restringida (sitio y app) de los Maestros, de las Comisiones y de la Administración del Parque de Estudio y Reflexión Retiro. Allí están los avisos, la agenda, las actividades, la Reunión de Escuela, los documentos y las herramientas de cada comisión.\n\nPara entrar, crea tu cuenta (toma unos 3 minutos):\n1. Toca el botón de abajo.\n2. Completa nombre completo, correo, WhatsApp y crea una contraseña.\n3. Recibirás un correo de CONecta Retiro: ábrelo y toca en confirmar. Si no aparece, revisa Spam o Promociones.\n4. Espera la aprobación. Después solo tienes que entrar con tu correo y contraseña, por el sitio o por la app.\n\nImportante: a partir del 27/11 la dirección pasa a ser parqueretiro.org.br. Tu correo y tu contraseña siguen siendo los mismos.\n\nDentro del sitio y de la app está el botón Ayuda, que explica cada pantalla. Cualquier duda, solo responde este correo.',
    rodape: 'Recibes esta invitación porque eres Maestro o formas parte de las comisiones o de la administración del Parque Retiro. Si no deseas participar, simplemente ignora este correo.', lembrete: 'Recordatorio: '
  }
};
const dataBR = iso => /^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : (iso || '');
const ehConvite = c => !!c && c.tipo === 'convite';
const linkCadastro = () => location.protocol.startsWith('http') ? location.origin + location.pathname.replace(/[^/]*$/, '') + 'login.html#criar-conta' : 'https://parqueretiro.org.br/login.html#criar-conta';
// Situação do cadastro de um e-mail na área restrita: 'aprovado', 'pendente', 'outro' (não aprovado) ou '' (ainda não se cadastrou).
function situacaoCadastro(email, users) {
  const e = String(email || '').toLowerCase(), u = (users || (H.db ? H.db.get('users', []) : [])).find(x => String(x.email || '').toLowerCase() === e);
  if (!u) return ''; const st = u.status || 'aprovado'; return st === 'aprovado' || st === 'pendente' ? st : 'outro';
}

/* ---------- Personalização ---------- */
function primeiroNome(nome) {
  const p = String(nome || '').trim().split(/\s+/)[0] || '';
  if (!p || /@/.test(p)) return '';
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}
function personaliza(t, pessoa) {
  const pn = primeiroNome(pessoa && pessoa.nome), nm = String(pessoa && pessoa.nome || '').trim();
  let s = String(t || '');
  if (!pn) s = s.replace(/,?\s*\{\{\s*primeiro_nome\s*\}\}/gi, '').replace(/,?\s*\{\{\s*nome\s*\}\}/gi, '');
  return s.replace(/\{\{\s*primeiro_nome\s*\}\}/gi, pn).replace(/\{\{\s*nome\s*\}\}/gi, nm || pn).replace(/\{\{\s*email\s*\}\}/gi, pessoa && pessoa.email || '');
}
function dadosPessoa(c, pessoa) {
  const sau = personaliza(c.saudacao, pessoa).trim();
  const base = location.protocol.startsWith('http') ? location.origin + location.pathname.replace(/[^/]*$/, '') : '';
  const conv = ehConvite(c), M = CONVITE[c.lang === 'es' ? 'es' : 'pt'];
  return {
    assunto: (conv && c.lembrete ? M.lembrete : '') + personaliza(c.assunto, pessoa), titulo: personaliza(c.titulo, pessoa), lang: c.lang || 'pt',
    rodape: conv ? M.rodape : '',
    texto: (sau ? sau + '\n\n' : '') + personaliza(c.texto, pessoa),
    imagem: c.imagem, botao: c.botao, link: c.link, remetente: c.remetente || 'Parque de Estudo e Reflexão Retiro',
    descadastro: conv ? '' : base ? base + 'descadastro.html?e=' + encodeURIComponent(pessoa.email) : ''
  };
}

/* ---------- Perfis ---------- */
const perfis = () => H.db.get('emkt_perfis', {});
const perfil = (P, email) => P[email] || (P[email] = { interesses: {}, enviados: 0, semAbrir: 0, aberturas: 0, cliques: 0 });
function pontuacao(p) {
  if (!p) return 0;
  const recente = p.ultimaAcao && diasEntre(p.ultimaAcao, hoje()) <= 90 ? 5 : 0;
  return p.cliques * 3 + p.aberturas + recente - p.semAbrir;
}
function engajado(p) { return !!(p && p.ultimaAcao && diasEntre(p.ultimaAcao, hoje()) <= 90); }
function interessesDe(p) { return Object.keys(p && p.interesses || {}).filter(k => p.interesses[k] > 0); }

/* ---------- Público da campanha ---------- */
function publico(c) {
  const E = window.PR_EMAILMKT, P = perfis();
  const listas = c.todas ? Object.keys(E.LISTAS) : (c.listas || []);
  if (ehConvite(c)) { const us = H.db ? H.db.get('users', []) : []; return E.destinatarios(listas).filter(m => !situacaoCadastro(m.email, us)); }
  return E.destinatarios(listas).filter(m => {
    const p = P[m.email.toLowerCase()];
    if (p && (p.bloqueado || p.semAbrir >= SEM_RESPOSTA)) return false;
    if (c.engaj === 'engajados') return engajado(p);
    if (c.engaj === 'novos') return !p || !p.enviados;
    if (c.engaj === 'interessados') { const mi = interessesDe(p); return (c.interesses || []).some(i => mi.includes(i)); }
    return true;
  });
}
// Fila: quem mais abre e clica vai primeiro (isso protege a reputação durante o aquecimento); depois quem tem o tema como interesse.
function montarFila(c) {
  const P = perfis();
  return publico(c).map(m => { const p = P[m.email.toLowerCase()]; return { m, s: pontuacao(p) + (c.tema && p && p.interesses && p.interesses[c.tema] ? 4 : 0) }; })
    .sort((a, b) => b.s - a.s).map(x => ({ nome: x.m.nome, email: x.m.email.toLowerCase() }));
}

/* ---------- Aquecimento ---------- */
const aquec = () => H.db.get('emkt_aquec', { nivel: 0, dias: {}, ultimoDia: '', segurar: false, checklist: {} });
function limiteHoje(a) {
  a = a || aquec();
  if (a.ultimoDia && a.ultimoDia !== hoje() && !a.segurar) return RAMPA[Math.min(a.nivel + 1, RAMPA.length - 1)];
  return RAMPA[Math.min(a.nivel, RAMPA.length - 1)];
}
function registraEnvio(n) {
  const a = aquec(), d = hoje();
  if (a.ultimoDia && a.ultimoDia !== d) { if (!a.segurar) a.nivel = Math.min(a.nivel + 1, RAMPA.length - 1); a.segurar = false; }
  a.dias[d] = (a.dias[d] || 0) + n; a.ultimoDia = d; H.db.set('emkt_aquec', a); return a;
}
const restanteHoje = () => { const a = aquec(); return Math.max(0, limiteHoje(a) - (a.dias[hoje()] || 0)); };

/* ---------- Resultados (relatório do serviço ou marcação manual) ---------- */
// linhas: e-mail;abriu;clicou;rejeitou  (sim/não, 1/0, x)
function aplicarResultados(c, linhas) {
  const P = perfis(), sim = v => /^(s|sim|1|x|y|yes|true)$/i.test(String(v || '').trim());
  let n = 0, rej = 0;
  linhas.forEach(r => {
    const em = String(r.email || '').trim().toLowerCase(); if (!em || !(c.enviados || {})[em]) return;
    const p = perfil(P, em), ant = (c.result || {})[em] || {};
    const abriu = sim(r.abriu) || sim(r.clicou), clicou = sim(r.clicou), rejeitou = sim(r.rejeitou);
    if (abriu && !ant.abriu) { p.aberturas++; p.semAbrir = 0; p.ultimaAcao = hoje(); }
    if (clicou && !ant.clicou) { p.cliques++; p.ultimaAcao = hoje(); if (c.tema) p.interesses[c.tema] = (p.interesses[c.tema] || 0) + 1; }
    if (rejeitou) { p.bloqueado = true; rej++; }
    c.result = c.result || {}; c.result[em] = { abriu: abriu || !!ant.abriu, clicou: clicou || !!ant.clicou, rejeitou };
    n++;
  });
  H.db.set('emkt_perfis', P);
  const env = Object.keys(c.enviados || {}).length;
  if (env && rej / env > 0.03) { const a = aquec(); a.segurar = true; H.db.set('emkt_aquec', a); }
  return { n, rej };
}
function resumo(c) {
  const env = Object.keys(c.enviados || {}).length, r = Object.values(c.result || {});
  const ab = r.filter(x => x.abriu).length, cl = r.filter(x => x.clicou).length, rj = r.filter(x => x.rejeitou).length;
  const pc = (a, b) => b ? (a / b * 100).toFixed(1).replace('.', ',') + '%' : '—';
  return { env, ab, cl, rj, tAb: pc(ab, env - rj), tCl: pc(cl, env - rj), tRj: pc(rj, env) };
}

/* ---------- Tela ---------- */
function abrir(el, h) {
  Object.assign(H, h); const esc = H.esc, E = window.PR_EMAILMKT;
  if (!E) { el.innerHTML = '<p class="vazio">Não foi possível carregar as listas de e-mail (arquivo emailmkt.js).</p>'; return; }
  const S = { v: 'camp', ed: null, ver: null, msg: '' };
  const camps = () => H.db.get('emkt_campanhas', []);
  const salva = c => { const l = camps(), i = l.findIndex(x => x.id === c.id); if (i >= 0) l[i] = c; else l.push(c); H.db.set('emkt_campanhas', l); };
  const $ = s => el.querySelector(s);
  const aviso = `<p class="tip-box" role="note"><i class="fas fa-info-circle"></i> O envio automático começa quando o e-mail do domínio parqueretiro.org.br e o serviço de envio estiverem ligados. Até lá, o sistema prepara o <strong>lote do dia</strong> já personalizado e você envia pelo seu programa de e-mail; depois é só marcar como enviado.</p>`;
  const draw = () => {
    el.innerHTML = `<h3><i class="fas fa-mail-bulk"></i> E-mail marketing</h3>
      <p>Campanhas por e-mail para uma, várias ou todas as listas, com o nome da pessoa no início e envio aos poucos (aquecimento), para que os e-mails cheguem na caixa de entrada.</p>
      <div class="tabs sub" role="tablist">${[['camp', 'Campanhas'], ['aq', 'Aquecimento'], ['perf', 'Perfis e interesses']].map(([k, n]) => `<button type="button" class="tab-btn${S.v === k ? ' active' : ''}" data-ev="${k}">${n}</button>`).join('')}</div>
      ${S.msg ? `<p class="tip-box" role="status" id="ek-msg">${esc(S.msg)}</p>` : ''}<div id="ek-c"></div>`;
    el.querySelectorAll('[data-ev]').forEach(b => b.onclick = () => { S.v = b.dataset.ev; S.ed = S.ver = null; S.msg = ''; draw(); });
    const c = $('#ek-c');
    if (S.v === 'aq') return telaAquec(c);
    if (S.v === 'perf') return telaPerfis(c);
    if (S.ed) return editor(c, S.ed);
    if (S.ver) return painel(c, camps().find(x => x.id === S.ver));
    lista(c);
  };

  function lista(c) {
    const l = camps().slice().reverse();
    c.innerHTML = `${aviso}<p><button type="button" class="btn-visit" id="ek-nova"><i class="fas fa-plus"></i> Nova campanha de e-mail</button> <button type="button" class="btn-visit" id="ek-conv"><i class="fas fa-user-plus"></i> Convite para a área restrita</button></p>
      ${l.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Campanha</th><th>Listas</th><th>Enviados</th><th>Abertura</th><th>Cliques</th><th></th></tr></thead><tbody>${l.map(x => { const r = resumo(x); return `<tr><td><strong>${esc(x.nome || x.assunto)}</strong><br><small>${esc(x.criado)}${x.tema ? ' · ' + esc(x.tema) : ''}</small></td><td>${x.todas ? 'Todas' : esc((x.listas || []).map(k => (E.LISTAS[k] || {}).nome || k).join(', '))}</td><td>${r.env} de ${(x.fila || []).length}</td><td>${r.tAb}</td><td>${r.tCl}</td><td><button type="button" class="btn-visit" data-ver="${esc(x.id)}">Abrir</button></td></tr>`; }).join('')}</tbody></table></div>` : '<p class="vazio">Nenhuma campanha de e-mail ainda.</p>'}`;
    c.querySelector('#ek-nova').onclick = () => { S.ed = { id: H.uid(), criado: hoje(), nome: '', tema: '', listas: [], todas: false, engaj: 'todos', interesses: [], assunto: '', saudacao: 'Olá, {{primeiro_nome}}!', titulo: '', texto: '', imagem: '', botao: 'Saiba mais', link: '', enviados: {}, result: {} }; S.msg = ''; draw(); };
    c.querySelector('#ek-conv').onclick = () => { const M = CONVITE.pt; S.ed = { id: H.uid(), criado: hoje(), tipo: 'convite', lang: 'pt', nome: 'Convite para a área restrita', tema: '', listas: ['convite'], todas: false, engaj: 'todos', interesses: [], assunto: M.assunto, saudacao: M.saudacao, titulo: M.titulo, texto: M.texto, imagem: '', botao: M.botao, link: linkCadastro(), enviados: {}, result: {} }; S.msg = ''; draw(); };
    c.querySelectorAll('[data-ver]').forEach(b => b.onclick = () => { S.ver = b.dataset.ver; S.msg = ''; draw(); });
  }

  function editor(c, d) {
    const nLista = k => E.membros(k).length, conv = ehConvite(d);
    c.innerHTML = `<form id="ek-f" novalidate><div class="emkt-cols"><div class="emkt-form">
      <div class="form-row"><label for="ek-nome">Nome da campanha (só para a equipe)</label><input id="ek-nome" maxlength="100" value="${esc(d.nome)}"></div>
      ${conv ? `<p class="tip-box" role="note"><i class="fas fa-user-plus"></i> Convite para criar conta na área restrita. O botão leva direto para <strong>Criar conta</strong>. Quem já tem cadastro não recebe. Monte a lista <strong>Convite área restrita</strong> em Listas de e-mail.</p>
      <div class="form-row"><label for="ek-lang">Idioma do convite</label><select id="ek-lang"><option value="pt" ${d.lang !== 'es' ? 'selected' : ''}>Português</option><option value="es" ${d.lang === 'es' ? 'selected' : ''}>Español</option></select><small>Ao trocar o idioma, o texto volta ao modelo daquele idioma. Para quem fala espanhol, faça um segundo convite em Español.</small></div>` : ''}
      <fieldset class="funcoes"><legend>Para quem enviar</legend>
        <label class="fn"><input type="checkbox" id="ek-todas" ${d.todas ? 'checked' : ''}> <strong>Todas as listas</strong></label>
        ${Object.keys(E.LISTAS).map(k => `<label class="fn" title="${esc(E.LISTAS[k].desc)}"><input type="checkbox" name="ek-l" value="${k}" ${d.todas || d.listas.includes(k) ? 'checked' : ''} ${d.todas ? 'disabled' : ''}> ${esc(E.LISTAS[k].nome)} <small>(${nLista(k)})</small></label>`).join('')}
      </fieldset>
      <div class="form-row"${conv ? ' hidden' : ''}><label for="ek-eng">Perfil do público</label><select id="ek-eng">${Object.keys(ENGAJ).map(k => `<option value="${k}" ${d.engaj === k ? 'selected' : ''}>${esc(ENGAJ[k])}</option>`).join('')}</select></div>
      <fieldset class="funcoes" id="ek-int"${conv ? ' hidden' : ''}><legend>Interesses (para o filtro "só quem tem os interesses")</legend>${INTERESSES.map(i => `<label class="fn"><input type="checkbox" name="ek-i" value="${esc(i)}" ${d.interesses.includes(i) ? 'checked' : ''}> ${esc(i)}</label>`).join('')}</fieldset>
      <div class="form-row"${conv ? ' hidden' : ''}><label for="ek-tema">Tema desta campanha</label><select id="ek-tema"><option value="">— nenhum —</option>${INTERESSES.map(i => `<option ${d.tema === i ? 'selected' : ''}>${esc(i)}</option>`).join('')}</select><small>Quem clicar ganha este interesse no perfil. Com o tempo, as campanhas vão para quem realmente se interessa pelo tema.</small></div>
      <p class="tip-box" id="ek-tot" role="status"></p>
      <div class="form-row"><label for="ek-as">Assunto *</label><input id="ek-as" maxlength="150" value="${esc(d.assunto)}"><small>Pode usar {{primeiro_nome}} também no assunto.</small></div>
      <div class="form-row"><label for="ek-sa">Saudação (primeira linha)</label><input id="ek-sa" maxlength="120" value="${esc(d.saudacao)}"><small>{{primeiro_nome}} vira o primeiro nome da pessoa. Se não tivermos o nome, fica só "Olá!".</small></div>
      <div class="form-row"><label for="ek-ti">Título *</label><input id="ek-ti" maxlength="150" value="${esc(d.titulo)}"></div>
      <div class="form-row"><label for="ek-tx">Texto (parágrafos separados por linha em branco)</label><textarea id="ek-tx" rows="8" maxlength="6000">${esc(d.texto)}</textarea></div>
      <div class="form-row"><label for="ek-im">Endereço (URL) de uma imagem, opcional</label><input id="ek-im" type="url" placeholder="https://..." value="${esc(d.imagem)}"></div>
      <div class="form-row"><label for="ek-bt">Texto do botão</label><input id="ek-bt" maxlength="40" value="${esc(d.botao)}"></div>
      <div class="form-row"><label for="ek-lk">Link do botão *</label><input id="ek-lk" type="url" placeholder="https://..." value="${esc(d.link)}"></div>
    </div><div class="emkt-prev">
      <div class="form-row"><label for="ek-pv">Ver a prévia como</label><select id="ek-pv"></select></div>
      <p class="vazio" id="ek-pas"></p><iframe id="ek-p" title="Prévia do e-mail" sandbox></iframe>
    </div></div>
    <p class="form-erro" id="ek-err" role="alert" hidden></p>
    <p><button class="btn-visit btn-large" id="ek-salvar"><i class="fas fa-save"></i> Salvar e montar a fila de envio</button> <button type="button" class="btn-visit" id="ek-cancel">Voltar</button></p></form>`;
    const ler = () => Object.assign(d, {
      nome: $('#ek-nome').value.trim(), todas: $('#ek-todas').checked, listas: [...c.querySelectorAll('[name=ek-l]:checked')].map(i => i.value),
      engaj: $('#ek-eng').value, interesses: [...c.querySelectorAll('[name=ek-i]:checked')].map(i => i.value), tema: $('#ek-tema').value,
      assunto: $('#ek-as').value.trim(), saudacao: $('#ek-sa').value, titulo: $('#ek-ti').value.trim(), texto: $('#ek-tx').value,
      imagem: $('#ek-im').value.trim(), botao: $('#ek-bt').value.trim(), link: $('#ek-lk').value.trim()
    }, conv ? { lang: $('#ek-lang').value } : {});
    if (conv) $('#ek-lang').addEventListener('change', () => { const M = CONVITE[$('#ek-lang').value === 'es' ? 'es' : 'pt']; $('#ek-as').value = M.assunto; $('#ek-sa').value = M.saudacao; $('#ek-ti').value = M.titulo; $('#ek-tx').value = M.texto; $('#ek-bt').value = M.botao; });
    let pub = [];
    const atualiza = () => {
      ler();
      c.querySelectorAll('[name=ek-l]').forEach(i => { i.disabled = d.todas; if (d.todas) i.checked = true; });
      pub = montarFila(d);
      const dias = Math.max(1, Math.ceil(pub.length / Math.max(1, limiteHoje())));
      $('#ek-tot').textContent = conv ? `${pub.length} pessoa(s) vão receber o convite (quem já se cadastrou fica de fora).` : `${pub.length} pessoa(s) vão receber (sem repetir quem está em mais de uma lista). No ritmo atual de aquecimento, cerca de ${dias} dia(s) de envio.`;
      const sel = $('#ek-pv'), atual = sel.value;
      sel.innerHTML = '<option value="">Exemplo: pessoa sem nome</option>' + pub.slice(0, 60).map(p => `<option value="${esc(p.email)}">${esc(p.nome || p.email)}</option>`).join('');
      if ([...sel.options].some(o => o.value === atual)) sel.value = atual; else if (pub[0]) sel.value = pub[0].email;
      const pessoa = pub.find(p => p.email === sel.value) || { nome: '', email: 'exemplo@email.com' };
      const dd = dadosPessoa(d, pessoa);
      $('#ek-pas').textContent = 'Assunto: ' + dd.assunto;
      $('#ek-p').srcdoc = E.montaHtml(dd);
    };
    c.addEventListener('input', atualiza); c.addEventListener('change', atualiza); atualiza();
    $('#ek-cancel').onclick = () => { S.ed = null; draw(); };
    $('#ek-f').onsubmit = ev => {
      ev.preventDefault(); ler(); const er = $('#ek-err'); er.hidden = false;
      if (!d.todas && !d.listas.length) { er.textContent = 'Escolha uma ou mais listas (ou Todas as listas).'; return; }
      if (!d.assunto || !d.titulo) { er.textContent = 'Preencha o assunto e o título.'; return; }
      if (!d.botao || !/^https?:\/\//i.test(d.link)) { er.textContent = 'Informe o texto e o link do botão (começando com https://).'; return; }
      if (d.imagem && !/^https?:\/\//i.test(d.imagem)) { er.textContent = 'O endereço da imagem precisa começar com https://.'; return; }
      if (d.engaj === 'interessados' && !d.interesses.length) { er.textContent = 'Marque ao menos um interesse para filtrar o público.'; return; }
      if (!pub.length) { er.textContent = conv ? 'Ninguém para convidar: a lista está vazia ou todos já se cadastraram.' : 'Nenhuma pessoa nas listas e no perfil escolhidos.'; return; }
      const enviados = d.enviados || {};
      d.fila = pub.map(p => p.email); d.nomes = Object.fromEntries(pub.map(p => [p.email, p.nome]));
      Object.keys(enviados).forEach(e => { if (!d.fila.includes(e)) d.fila.unshift(e); });
      d.por = H.me && H.me.nome || ''; salva(d); S.ed = null; S.ver = d.id; S.msg = 'Campanha salva. A fila está pronta.'; draw();
    };
  }

  function painel(c, d) {
    if (!d) { S.ver = null; return draw(); }
    const conv = ehConvite(d), us = H.db.get('users', []);
    const pend = (d.fila || []).filter(e => !(d.enviados || {})[e]);
    const P = perfis(), vivos = pend.filter(e => conv ? !situacaoCadastro(e, us) : !(P[e] && (P[e].bloqueado || P[e].semAbrir >= SEM_RESPOSTA)));
    const resto = conv ? 400 : restanteHoje(), lote = vivos.slice(0, resto).map(e => ({ email: e, nome: (d.nomes || {})[e] || '' }));
    const r = resumo(d), a = aquec();
    const auto = !!(window.PR_SUPABASE && window.PR_DADOS && PR_DADOS.modo === 'supabase' && PR_SUPABASE.funcao);
    const sit = conv ? (d.fila || []).map(e => ({ email: e, nome: (d.nomes || {})[e] || '', st: situacaoCadastro(e, us), env: (d.enviados || {})[e] || '', lemb: ((d.lembretes || {})[e] || []).length })) : [];
    const cont = k => sit.filter(x => x.st === k).length;
    const faltam = sit.filter(x => !x.st && x.env);
    const ROT = { aprovado: 'Já tem acesso', pendente: 'Cadastrou: aguardando aprovação', outro: 'Cadastro não aprovado', '': 'Ainda não se cadastrou' };
    c.innerHTML = `<p><button type="button" class="btn-visit" id="ek-volta"><i class="fas fa-arrow-left"></i> Campanhas</button> <button type="button" class="btn-visit" id="ek-edit"><i class="fas fa-pen"></i> Editar</button></p>
      <h4>${esc(d.nome || d.assunto)}</h4>
      ${conv ? `<p><strong>${r.env}</strong> convite(s) enviado(s) de <strong>${(d.fila || []).length}</strong> · <strong>${cont('aprovado')}</strong> já com acesso · <strong>${cont('pendente')}</strong> aguardando aprovação · <strong>${cont('')}</strong> ainda não se cadastraram</p>`
        : `<p><strong>${r.env}</strong> enviados de <strong>${(d.fila || []).length}</strong> · Abertura ${r.tAb} · Cliques ${r.tCl} · Rejeição ${r.tRj}</p>${aviso}`}
      <h4><i class="fas fa-calendar-day"></i> ${conv ? 'Para enviar agora' : 'Lote de hoje'}: ${lote.length} pessoa(s)</h4>
      ${conv ? (d.lembrete ? '<p class="vazio">Este envio é um lembrete: o assunto começa com "Lembrete:".</p>' : '') : `<p class="vazio">Limite de hoje no aquecimento: ${limiteHoje(a)} e-mail(s); já enviados hoje (todas as campanhas): ${a.dias[hoje()] || 0}.${a.segurar ? ' O volume está segurado porque a última rejeição passou de 3%: limpe a lista antes de crescer.' : ''}</p>`}
      ${lote.length ? `${auto ? `<p><button type="button" class="btn-visit btn-large" id="ek-auto"><i class="fas fa-paper-plane"></i> Enviar agora pelo Gmail do Parque</button></p><p class="vazio" id="ek-prog" role="status"></p>` : ''}
        <p><button type="button" class="btn-visit" id="ek-csv"><i class="fas fa-file-csv"></i> Baixar lote (.csv para mala direta)</button>
        <button type="button" class="btn-visit" id="ek-html"><i class="fas fa-code"></i> Baixar e-mail (.html com {{primeiro_nome}})</button>
        <button type="button" class="btn-visit" id="ek-env"><i class="fas fa-check"></i> Marcar ${conv ? 'como enviados' : 'lote de hoje como enviado'}</button></p>
        <div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Enviar um a um</th></tr></thead><tbody>${lote.map(p => { const dd = dadosPessoa(d, p); const corpo = E.montaTexto(dd); return `<tr><td>${esc(p.nome || '—')}</td><td>${esc(p.email)}</td><td><a class="btn-visit" href="mailto:${encodeURIComponent(p.email)}?subject=${encodeURIComponent(dd.assunto)}&body=${encodeURIComponent(corpo)}">Abrir e-mail para ${esc(primeiroNome(p.nome) || 'esta pessoa')}</a></td></tr>`; }).join('')}</tbody></table></div>`
        : `<p class="vazio">${conv ? 'Ninguém pendente: todos da lista já receberam o convite ou já se cadastraram.' : pend.length ? 'O limite de hoje já foi atingido. Amanhã o lote continua, um pouco maior.' : 'Todos da fila já receberam esta campanha.'}</p>`}
      ${conv ? `<h4><i class="fas fa-user-check"></i> Quem já se cadastrou</h4>
        <p class="vazio">Atualiza sozinho: quando a pessoa cria a conta, aparece aqui e em Gestão de Responsáveis, para você aprovar.</p>
        ${faltam.length ? `<p><button type="button" class="btn-visit" id="ek-lemb"><i class="fas fa-bell"></i> Preparar lembrete para quem ainda não se cadastrou (${faltam.length})</button></p>` : ''}
        <div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Pessoa</th><th>Convite enviado</th><th>Situação</th></tr></thead><tbody>${sit.map(x => `<tr><td>${esc(x.nome || '—')}<br><small>${esc(x.email)}</small></td><td>${x.env ? esc(dataBR(x.env)) : x.lemb ? esc(dataBR(d.lembretes[x.email][x.lemb - 1])) + '<br><small>lembrete a enviar</small>' : '—'}</td><td>${ROT[x.st]}</td></tr>`).join('')}</tbody></table></div>`
      : `<details id="ek-res"><summary><strong>Registrar resultados</strong> (quem abriu, clicou ou voltou)</summary>
        <p class="vazio">Cole o relatório do serviço de envio, uma pessoa por linha: <code>e-mail;abriu;clicou;rejeitou</code> (sim/não). Quem responder ou clicar no e-mail enviado um a um também conta como abertura. E-mails que voltaram saem das próximas campanhas.</p>
        <textarea id="ek-rel" rows="5" placeholder="maria@email.com;sim;sim;não"></textarea>
        <p><button type="button" class="btn-visit" id="ek-apl"><i class="fas fa-chart-line"></i> Aplicar resultados</button></p></details>`}`;
    $('#ek-volta').onclick = () => { S.ver = null; S.msg = ''; draw(); };
    $('#ek-edit').onclick = () => { S.ed = d; S.ver = null; S.msg = ''; draw(); };
    const baixa = (nome, txt, tipo) => { const x = document.createElement('a'); x.href = URL.createObjectURL(new Blob([txt], { type: tipo })); x.download = nome; x.click(); };
    const marca = emails => {
      if (!emails.length) return;
      d.enviados = d.enviados || {};
      if (conv) emails.forEach(e => { d.enviados[e] = hoje(); });
      else {
        const Pf = perfis();
        emails.forEach(e => { d.enviados[e] = hoje(); const pf = perfil(Pf, e); pf.enviados++; pf.semAbrir++; pf.ultimoEnvio = hoje(); });
        H.db.set('emkt_perfis', Pf); registraEnvio(emails.length);
      }
      salva(d);
    };
    if (lote.length) {
      $('#ek-csv').onclick = () => baixa('lote-' + hoje() + '.csv', '﻿primeiro_nome;nome;email;assunto\r\n' + lote.map(p => `"${primeiroNome(p.nome)}";"${String(p.nome).replace(/"/g, '""')}";${p.email};"${dadosPessoa(d, p).assunto.replace(/"/g, '""')}"`).join('\r\n'), 'text/csv');
      $('#ek-html').onclick = () => { const dd = dadosPessoa(d, { nome: '{{primeiro_nome}}', email: '' }); baixa('email-' + hoje() + '.html', E.montaHtml(Object.assign(dd, { texto: (d.saudacao ? d.saudacao + '\n\n' : '') + d.texto, descadastro: '' })), 'text/html'); };
      $('#ek-env').onclick = () => { marca(lote.map(p => p.email)); S.msg = `${lote.length} e-mail(s) marcados como enviados hoje.`; draw(); };
      const ba = $('#ek-auto');
      if (ba) ba.onclick = async () => {
        const prog = $('#ek-prog'); ba.disabled = true; let ok = [], falhas = [], parar = '';
        for (let i = 0; i < lote.length && !parar; i += 20) {
          const parte = lote.slice(i, i + 20);
          prog.textContent = `Enviando ${Math.min(i + 20, lote.length)} de ${lote.length}...`;
          const msgs = parte.map(p => { const dd = dadosPessoa(d, p); return { para: p.email, nome: p.nome || '', assunto: dd.assunto, html: E.montaHtml(dd), texto: E.montaTexto(dd) }; });
          const resp = await PR_SUPABASE.funcao('enviar-email', { mensagens: msgs });
          const cp = resp.corpo || {};
          if (resp.status === 200) { ok = ok.concat(cp.enviados || []); falhas = falhas.concat(cp.falhas || []); marca(cp.enviados || []); }
          else if (resp.status === 404) parar = 'O envio automático ainda não foi instalado no servidor. Por enquanto, use "Abrir e-mail" em cada pessoa.';
          else if (resp.status === 503) parar = 'O envio automático ainda não foi ligado (falta a senha de app do Gmail no servidor). Por enquanto, use "Abrir e-mail" em cada pessoa.';
          else if (resp.status === 403) parar = 'Só o administrador ou o Responsável pela Comunicação pode enviar.';
          else if (resp.status === 0) parar = 'Sem conexão com o servidor. Confira a internet e tente de novo.';
          else { if (cp.enviados && cp.enviados.length) { ok = ok.concat(cp.enviados); marca(cp.enviados); } parar = 'O servidor não conseguiu enviar (' + (cp.erro || resp.status) + ').'; }
        }
        S.msg = (ok.length ? `${ok.length} e-mail(s) enviados pelo Gmail do Parque.` : '') + (falhas.length ? ` ${falhas.length} não foram: ${falhas.map(f => f.email).join(', ')}.` : '') + (parar ? ' ' + parar : '');
        draw();
      };
    }
    const bl = $('#ek-lemb');
    if (bl) bl.onclick = () => {
      d.lembretes = d.lembretes || {};
      faltam.forEach(x => { (d.lembretes[x.email] = d.lembretes[x.email] || []).push(d.enviados[x.email]); delete d.enviados[x.email]; });
      d.lembrete = true; salva(d); S.msg = `Lembrete pronto para ${faltam.length} pessoa(s). O assunto começa com "${CONVITE[d.lang === 'es' ? 'es' : 'pt'].lembrete.trim()}".`; draw();
    };
    const ap = $('#ek-apl');
    if (ap) ap.onclick = () => {
      const linhas = $('#ek-rel').value.split(/\r?\n/).map(l => l.split(/[;\t,]/)).filter(p => p[0] && p[0].includes('@')).map(p => ({ email: p[0], abriu: p[1], clicou: p[2], rejeitou: p[3] }));
      const res = aplicarResultados(d, linhas); salva(d);
      S.msg = `Resultados aplicados a ${res.n} pessoa(s).${res.rej ? ` ${res.rej} e-mail(s) que voltaram saíram das próximas campanhas.` : ''}`; draw();
    };
  }

  function telaAquec(c) {
    const a = aquec(), CK = [['spf', 'SPF configurado no domínio (registro TXT no DNS)'], ['dkim', 'DKIM configurado (assinatura do serviço de envio)'], ['dmarc', 'DMARC configurado (começar com p=none)'], ['rem', 'Remetente fixo do domínio (ex.: comunicado@parqueretiro.org.br) e responder-para que alguém lê'], ['cons', 'Só contatos que deram consentimento (LGPD), com descadastro em todo e-mail']];
    const dias = Object.keys(a.dias).sort().slice(-14);
    c.innerHTML = `<p>O aquecimento faz o domínio ganhar confiança dos provedores (Gmail, Outlook, Yahoo) aos poucos. Mandar tudo de uma vez num domínio novo é o caminho mais rápido para o spam e para os e-mails voltarem.</p>
      <ul><li>O limite diário começa em <strong>${RAMPA[0]}</strong> e cresce a cada dia de envio, até <strong>${RAMPA[RAMPA.length - 1]}</strong>.</li><li>Quem mais abre e clica recebe primeiro: boas respostas no início contam muito.</li><li>Se a rejeição de um lote passar de 3%, o volume não cresce no dia seguinte.</li><li>Quem recebeu ${SEM_RESPOSTA} e-mails sem abrir nenhum sai do envio automático.</li></ul>
      <p class="tip-box">Hoje: limite <strong>${limiteHoje(a)}</strong> · enviados <strong>${a.dias[hoje()] || 0}</strong> · etapa ${Math.min(a.nivel + 1, RAMPA.length)} de ${RAMPA.length}${a.segurar ? ' · <strong>volume segurado</strong>' : ''}</p>
      <div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Dia de envio</th>${RAMPA.map((_, i) => `<th>${i + 1}</th>`).join('')}</tr></thead><tbody><tr><td>Limite</td>${RAMPA.map((n, i) => `<td${i === a.nivel ? ' style="font-weight:bold"' : ''}>${n}</td>`).join('')}</tr></tbody></table></div>
      ${dias.length ? `<h4>Últimos envios</h4><ul>${dias.map(k => `<li>${esc(k)}: ${a.dias[k]}</li>`).join('')}</ul>` : ''}
      <fieldset class="funcoes"><legend>Antes do primeiro envio</legend>${CK.map(([k, t]) => `<label class="fn"><input type="checkbox" data-ck="${k}" ${a.checklist && a.checklist[k] ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</fieldset>`;
    c.querySelectorAll('[data-ck]').forEach(i => i.onchange = () => { const x = aquec(); x.checklist = x.checklist || {}; x.checklist[i.dataset.ck] = i.checked; H.db.set('emkt_aquec', x); });
  }

  function telaPerfis(c) {
    const P = perfis(), gente = E.destinatarios(Object.keys(E.LISTAS));
    const linhas = gente.map(g => ({ g, p: P[g.email.toLowerCase()] })).sort((x, y) => pontuacao(y.p) - pontuacao(x.p));
    c.innerHTML = `<p>Cada pessoa tem um perfil que vai ficando mais preciso a cada campanha: aberturas, cliques e interesses. Os interesses crescem sozinhos quando a pessoa clica numa campanha com tema, e também podem ser marcados à mão.</p>
      ${linhas.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Pessoa</th><th>Recebeu</th><th>Abriu</th><th>Clicou</th><th>Situação</th><th>Interesses</th></tr></thead><tbody>${linhas.map(({ g, p }) => { const e = g.email.toLowerCase(), mi = interessesDe(p); return `<tr><td>${esc(g.nome || '—')}<br><small>${esc(g.email)}</small></td><td>${p ? p.enviados : 0}</td><td>${p ? p.aberturas : 0}</td><td>${p ? p.cliques : 0}</td><td>${p && p.bloqueado ? 'E-mail voltou' : p && p.semAbrir >= SEM_RESPOSTA ? 'Sem resposta (pausado)' : engajado(p) ? 'Engajado' : p && p.enviados ? 'Recebendo' : 'Novo'}</td><td><details><summary>${mi.length ? esc(mi.join(', ')) : 'Marcar'}</summary>${INTERESSES.map(i => `<label class="fn"><input type="checkbox" data-pe="${esc(e)}" value="${esc(i)}" ${mi.includes(i) ? 'checked' : ''}> ${esc(i)}</label>`).join('')}${p && (p.bloqueado || p.semAbrir >= SEM_RESPOSTA) ? `<button type="button" class="btn-visit" data-re="${esc(e)}">Voltar a enviar</button>` : ''}</details></td></tr>`; }).join('')}</tbody></table></div>` : '<p class="vazio">As listas de e-mail ainda estão vazias.</p>'}`;
    c.querySelectorAll('[data-pe]').forEach(i => i.onchange = () => { const Q = perfis(), p = perfil(Q, i.dataset.pe); p.interesses[i.value] = i.checked ? Math.max(1, p.interesses[i.value] || 0) : 0; H.db.set('emkt_perfis', Q); });
    c.querySelectorAll('[data-re]').forEach(b => b.onclick = () => { const Q = perfis(), p = perfil(Q, b.dataset.re); p.bloqueado = false; p.semAbrir = 0; H.db.set('emkt_perfis', Q); telaPerfis(c); });
  }
  draw();
}

window.PR_COM_EMKT = { CONVITE, situacaoCadastro, RAMPA, INTERESSES, primeiroNome, personaliza, dadosPessoa, pontuacao, montarFila, publico, limiteHoje, registraEnvio, aplicarResultados, abrir };
})();
