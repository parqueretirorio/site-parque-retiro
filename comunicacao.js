// Comunicação e Redes Sociais (área restrita). Dados salvos no navegador (localStorage):
//   pr_com_redes     redes sociais        [{id, nome, icone, cor, ativa}]
//   pr_com_projetos  projetos/campanhas   [{id, nome, ativa}]
//   pr_com_tipos     tipos de publicação  [{id, nome, ativa}]
//   pr_com_posts     publicações          [{id, data, rede, tipo, tema, texto, img, midiaLink, evento:{ref,titulo,data}, projeto, resp, status, link, ...}]
//   pr_com_acoes     ações do Painel (Publicações > Painel)  [{id, tema, data, projeto, evento, resp, texto, midiaLink}]  -- cada ação gera 1 publicação por canal em pr_com_posts (campo p.acao = id da ação; p.bannerSlug = página do site, quando o canal é "Site")
//   pr_com_formatos  formatos oferecidos por canal  {redeId: [idDoTipo, ...]}
//   pr_com_painel    marca de que os canais/formatos novos já foram acrescentados (nunca remove nada)
//   pr_site_banners  banners do site (banners-admin.js); o Painel apenas lê e abre essa tela
//   pr_datas_fixas   datas fixas anuais (gerenciadas em documentos.js, compartilhadas com os calendários)
//
// COMO ACRESCENTAR NO FUTURO (sem refazer a área):
//  - Nova rede social / projeto / tipo de publicação: pela própria tela (sub-abas "Redes sociais", "Projetos e campanhas", "Tipos de publicação").
//    Para mudar os itens iniciais, edite REDES_BASE, PROJ_BASE ou TIPOS_BASE.
//  - Novo status: acrescente [nome, cor] em STATUS (a ordem do fluxo é a ordem da lista). "Agendada" = já programada na ferramenta da própria rede (ex.: Meta Business Suite).
//  - Novo calendário/visão de período: acrescente um objeto em CALS (documentos.js); ele aparece aqui automaticamente.
//  - Nova sub-aba/visualização: acrescente [id, nome] em SUBS e uma função com o mesmo id em R (dentro de abrir).
//  - Novo filtro: acrescente o campo em F (lista) ou K (calendário) e a condição em filtra()/calCom().
//  - Atividades e datas do calendário vêm de PR_DOCUMENTOS.eventos(db, de, ate): uma mesma atividade pode gerar várias publicações.
(function () {
const STATUS = [['Ideia', '#6c7a7b'], ['Planejada', '#2a7ab5'], ['Em produção', '#b8620f'], ['Aguardando aprovação', '#6a3d9a'], ['Aprovada', '#2e7d32'], ['Agendada', '#827717'], ['Publicada', '#00838f']];
const REDES_BASE = [
  { id: 'instagram', nome: 'Instagram', icone: 'fab fa-instagram', cor: '#c2185b' },
  { id: 'facebook', nome: 'Facebook', icone: 'fab fa-facebook', cor: '#1877f2' },
  { id: 'youtube', nome: 'YouTube', icone: 'fab fa-youtube', cor: '#d32f2f' },
  { id: 'whatsapp', nome: 'WhatsApp / Canal', icone: 'fab fa-whatsapp', cor: '#2e7d32' }
];
// Projetos e campanhas do Parque (lista ajustada em 09/11/2026). tipo = tipo sugerido no Briefing para o Claude; data = data já conhecida.
const PROJ_BASE = [
  { nome: 'Aniversário Parque Retiro', tipo: 'evento' },
  { nome: 'Festival de Verão', tipo: 'evento', data: '20/12/2026' },
  { nome: 'Festival de Outono', tipo: 'evento' },
  { nome: 'Festival de Inverno', tipo: 'evento' },
  { nome: 'Festival de Primavera', tipo: 'evento' },
  { nome: 'Projeto 4 Estações', tipo: 'evento' },
  { nome: 'Dia Internacional da Não Violência', tipo: 'data', data: '02/10' },
  { nome: 'Dia do Testemunho', tipo: 'data', data: '04/05' },
  { nome: 'Dia Municipal da Não Violência de Maricá', tipo: 'data' }
];
const PROJ_ANTIGOS = ['Celebração dos 15 anos', 'Marcha Mundial', 'Campanha da Sala', 'Construção do Parque'];
const TIPOS_BASE = ['Post com imagem', 'Carrossel', 'Vídeo curto / Reels', 'Stories', 'Mensagem de canal', 'Vídeo longo (YouTube)'];
// Acrescentados SEM alterar o que já existe (só entram se ainda não existirem; nada é removido nem renomeado).
const REDES_NOVAS = [
  { id: 'whatsapp-comunidade', nome: 'WhatsApp / Comunidade', icone: 'fab fa-whatsapp', cor: '#1b5e20' },
  { id: 'whatsapp-grupo', nome: 'WhatsApp / Grupo', icone: 'fab fa-whatsapp', cor: '#43a047' },
  { id: 'site', nome: 'Site (banners)', icone: 'fas fa-globe', cor: '#37474f' }
];
const TIPOS_NOVOS = ['Aviso na Comunidade', 'Mensagem em grupo', 'Enquete / convite', 'Banner do site - fixo', 'Banner do site - carrossel'];
// Formatos sugeridos por canal (editáveis na tela: Painel > "Configurar quais formatos cada canal oferece").
const FORMATOS_BASE = {
  instagram: ['Post com imagem', 'Carrossel', 'Vídeo curto / Reels', 'Stories'],
  facebook: ['Post com imagem', 'Carrossel', 'Vídeo curto / Reels', 'Stories'],
  youtube: ['Vídeo longo (YouTube)', 'Vídeo curto / Reels'],
  whatsapp: ['Mensagem de canal', 'Post com imagem', 'Enquete / convite'],
  'whatsapp-comunidade': ['Aviso na Comunidade', 'Post com imagem', 'Enquete / convite'],
  'whatsapp-grupo': ['Mensagem em grupo', 'Post com imagem', 'Enquete / convite'],
  site: ['Banner do site - fixo', 'Banner do site - carrossel']
};
// Medidas de REFERÊNCIA por formato (confirme nas redes, que mudam). Para banners do site a medida exata vem de banners.js.
const MEDIDAS_BASE = {
  'Post com imagem': '1080 × 1350 px (proporção 4:5)',
  'Carrossel': '1080 × 1350 px por imagem (4:5)',
  'Vídeo curto / Reels': '1080 × 1920 px (9:16, vertical)',
  'Stories': '1080 × 1920 px (9:16, vertical)',
  'Vídeo longo (YouTube)': '1920 × 1080 px (16:9); miniatura 1280 × 720 px'
};
// Checklist de materiais de cada ação (guardado na própria ação).
const MATS = [['briefing', 'Briefing e ideia definidos'], ['texto', 'Texto e legenda aprovados'], ['arte', 'Arte ou vídeo pronto'], ['autorizacao', 'Autorização de uso de imagem confirmada (ou não se aplica)']];
const ICONES = [['fab fa-instagram', 'Instagram'], ['fab fa-facebook', 'Facebook'], ['fab fa-youtube', 'YouTube'], ['fab fa-whatsapp', 'WhatsApp'], ['fab fa-tiktok', 'TikTok'], ['fab fa-telegram', 'Telegram'], ['fab fa-linkedin', 'LinkedIn'], ['fab fa-spotify', 'Spotify / podcast'], ['fas fa-envelope', 'E-mail / newsletter'], ['fas fa-globe', 'Site / blog'], ['fas fa-bullhorn', 'Outro']];
const SUBS = [['cal', 'Calendário de Comunicação'], ['pub', 'Publicações'], ['gerar', 'Criar a partir do calendário'], ['redes', 'Redes sociais'], ['proj', 'Projetos e campanhas'], ['tipos', 'Tipos de publicação'], ['fixas', 'Datas fixas anuais'], ['site', 'Site'], ['emkt', 'E-mail marketing'], ['brief', 'Briefing para o Claude']];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const pad = n => String(n).padStart(2, '0');
const addDia = (iso, k) => { const x = new Date(iso + 'T12:00:00'); x.setDate(x.getDate() + k); return x.toISOString().slice(0, 10); };
const domingoDe = iso => addDia(iso, -new Date(iso + 'T12:00:00').getDay());

window.PR_COMUNICACAO = { STATUS, abrir(me, root, H) {
  const { db, esc, $, uid, hoje, fmtData, norm, reduz, safeUrl } = H;
  const D = window.PR_DOCUMENTOS;
  // Somente administrador e Responsável pela Comunicação criam, editam, aprovam e publicam o planejamento.
  const RG = window.PR_COM_REGRAS, CB = window.PR_COM_COLAB, gestor = H.tem(me, 'comunicacao');
  const agoraIso = () => new Date().toISOString();
  if (!gestor && !(RG && RG.temAcesso(me, db, agoraIso()))) { root.innerHTML = '<p class="vazio">Acesso restrito ao administrador, ao Responsável pela Comunicação e a quem foi designado ou convidado para uma publicação.</p>'; return; }
  if (!D) { root.innerHTML = '<p class="vazio">Não foi possível carregar o módulo de calendários (arquivo documentos.js).</p>'; return; }

  const seed = (k, base) => { let l = db.get(k, null); if (!l) { l = base; db.set(k, l); } return l; };
  const redes = () => seed('com_redes', REDES_BASE.map(r => ({ ...r, ativa: true })));
  // Versão 2 da lista: os projetos antigos ficam desativados (publicações antigas continuam ligadas a eles) e entram os novos.
  const projs = () => {
    let l = db.get('com_projetos', null) || PROJ_ANTIGOS.map((n, i) => ({ id: 'p' + (i + 1), nome: n, ativa: true }));
    if (!db.get('com_projetos_v2', null)) {
      l.forEach(p => { if (PROJ_ANTIGOS.includes(p.nome)) p.ativa = false; });
      PROJ_BASE.forEach(b => { const ex = l.find(p => norm(p.nome) === norm(b.nome)); if (ex) Object.assign(ex, b, { ativa: true }); else l.push({ id: uid(), ...b, ativa: true }); });
      db.set('com_projetos', l); db.set('com_projetos_v2', { em: hoje() });
    }
    return l;
  };
  const tipos = () => seed('com_tipos', TIPOS_BASE.map((n, i) => ({ id: 't' + (i + 1), nome: n, ativa: true })));
  const posts = () => db.get('com_posts', []);
  // Primeira abertura depois da atualização: acrescenta canais e formatos novos (aditivo) e guarda a marca para não repetir.
  if (!db.get('com_painel', null)) {
    const rl = redes(); REDES_NOVAS.forEach(n => { if (!rl.some(r => r.id === n.id)) rl.push({ ...n, ativa: true }); }); db.set('com_redes', rl);
    const tl = tipos(); TIPOS_NOVOS.forEach(n => { if (!tl.some(t => norm(t.nome) === norm(n))) tl.push({ id: uid(), nome: n, ativa: true }); }); db.set('com_tipos', tl);
    const fm = {}; Object.keys(FORMATOS_BASE).forEach(rid => { fm[rid] = FORMATOS_BASE[rid].map(n => (tl.find(t => norm(t.nome) === norm(n)) || {}).id).filter(Boolean); });
    db.set('com_formatos', fm); db.set('com_painel', { versao: 1, em: hoje() });
  }
  const nomeDe = (l, id) => { const x = l.find(i => i.id === id); return x ? x.nome : (id ? '(removido)' : '-'); };
  const stCor = s => (STATUS.find(x => x[0] === s) || [0, '#6c7a7b'])[1];
  const badge = s => `<span class="badge-status" style="background:${stCor(s)};color:#fff">${esc(s)}</span>`;
  const iconeRede = r => r ? `<i class="${esc(r.icone)}" style="color:${esc(r.cor)}" aria-hidden="true"></i> ${esc(r.nome)}` : '(rede removida)';
  const corRede = id => (redes().find(r => r.id === id) || { cor: '#6c7a7b' }).cor;
  const opt = (l, s, vazio) => (vazio ? `<option value="">${esc(vazio)}</option>` : '') + l.map(x => `<option value="${esc(x[0])}"${x[0] === s ? ' selected' : ''}>${esc(x[1])}</option>`).join('');
  const link = u => u && /^https?:\/\//i.test(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> Ver postagem</a>` : '';
  const dm = iso => fmtData(iso).slice(0, 5);
  const anoHoje = +hoje().slice(0, 4), mesHoje = +hoje().slice(5, 7) - 1;

  let sub = gestor ? 'cal' : 'colab', form = null, msg = '', det = '';
  const F = { ano: '', rede: '', status: '', proj: '', tipo: '', q: '' };
  const K = { view: 'mes', ano: anoHoje, rede: '', status: '', proj: '', ini: domingoDe(hoje()), per: { mes: mesHoje + 1, tri: Math.floor(mesHoje / 3) + 1, sem: mesHoje < 6 ? 1 : 2, ano: 1 } };
  const G = { ano: anoHoje, key: '' };
  const pre = sessionStorage.getItem('pr_com_evento'); // vindo de um botão "Planejar publicações" nos calendários
  if (pre && !gestor) sessionStorage.removeItem('pr_com_evento');
  if (pre && gestor) { sessionStorage.removeItem('pr_com_evento'); const [k, d] = pre.split('|'); if (k && d) { sub = 'gerar'; G.key = k; G.ano = +d.slice(0, 4); } }

  const aviso = () => msg ? `<p class="tip-box" role="status"><i class="fas fa-check-circle"></i> ${esc(msg)}</p>` : '';
  const salvarPosts = l => db.set('com_posts', l);
  // Efeito de uma mudança de status: registra quem aprovou/publicou, histórico e versão (com-regras.js). Sem o arquivo, mantém o comportamento antigo.
  const aplicaEfeitos = (p, antes) => {
    if (RG) { RG.aoSalvar(p, antes, me, agoraIso()); return; }
    if (p.status === 'Aprovada' && antes !== 'Aprovada') { p.aprovadoPor = me.nome; p.aprovadoEm = hoje(); }
    if (p.status === 'Publicada' && antes !== 'Publicada') { p.publicadoPor = me.nome; p.publicadoEm = hoje(); }
  };
  // Mudança de status feita direto na lista, na fila ou na tela do colaborador: confere o papel antes de gravar.
  const mudaStatus = (id, novo) => {
    const l = posts(), p = l.find(x => x.id === id); if (!p) return { ok: false, motivo: 'Publicação não encontrada.' };
    if (RG) { const r = RG.podeMudar(me, p, novo, db, agoraIso()); if (!r.ok) return r; }
    const antes = p.status; p.status = novo; p.editado = hoje(); p.editadoPor = me.nome; aplicaEfeitos(p, antes);
    if (!salvarPosts(l)) return { ok: false, motivo: 'Sem espaço no navegador.' };
    return { ok: true };
  };

  /* ---------- Formulário de publicação ---------- */
  const formHtml = () => {
    const ed = form.id ? posts().find(p => p.id === form.id) : null, pr = form.pre || {};
    const v = (k, d = '') => ed ? (ed[k] == null ? d : ed[k]) : (pr[k] == null ? d : pr[k]);
    const data = v('data', hoje());
    const evs = D.eventos(db, addDia(data < hoje() ? data : hoje(), -60), addDia(data > hoje() ? data : hoje(), 400));
    const evAtual = v('evento', null), temEv = evAtual && evs.some(e => e.key === evAtual.ref);
    const evOpts = [['', '- Nenhum -']].concat(evAtual && !temEv ? [[evAtual.ref, `${fmtData(evAtual.data)} - ${evAtual.titulo}`]] : []).concat(evs.map(e => [e.key, `${fmtData(e.data)} - ${e.titulo}`]));
    const rs = redes().filter(r => r.ativa || r.id === v('rede')), ps = projs().filter(r => r.ativa || r.id === v('projeto')), ts = tipos().filter(r => r.ativa || r.id === v('tipo'));
    const nomes = [...new Set(db.get('users', []).map(u => u.nome).filter(Boolean))];
    return `<form id="fp" class="form-reserva" novalidate><h4 style="margin-top:0">${ed ? 'Editar publicação' : 'Nova publicação'}</h4>
      <div class="form-row"><label for="p-d">Data prevista *</label><input id="p-d" type="date" value="${esc(data)}"></div>
      <div class="form-row"><label for="p-r">Rede social *</label><select id="p-r">${opt(rs.map(r => [r.id, r.nome]), v('rede', rs[0] && rs[0].id))}</select></div>
      <div class="form-row"><label for="p-ti">Tipo de publicação</label><select id="p-ti">${opt(ts.map(r => [r.id, r.nome]), v('tipo'), '- Não definido -')}</select></div>
      <div class="form-row"><label for="p-t">Tema *</label><input id="p-t" maxlength="140" value="${esc(v('tema'))}"></div>
      <div class="form-row"><label for="p-x">Texto da publicação</label><textarea id="p-x" rows="5" maxlength="2200">${esc(v('texto'))}</textarea></div>
      <div class="form-row"><label for="p-i">Imagem${ed && ed.img ? ' (já anexada - deixe vazio para manter)' : ''}</label><input id="p-i" type="file" accept="image/*">${ed && ed.img ? `<img src="${esc(ed.img)}" alt="Imagem anexada" style="max-width:160px;margin-top:6px;border-radius:6px"> <label style="font-weight:normal"><input type="checkbox" id="p-ir"> remover imagem</label>` : ''}</div>
      <div class="form-row"><label for="p-ml">ou link da imagem / vídeo (Google Drive, YouTube...)</label><input id="p-ml" type="url" placeholder="https://" value="${esc(v('midiaLink'))}"><small>Vídeos devem ser informados por link: o navegador guarda só cerca de 5 MB no total.</small></div>
      <div class="form-row"><label for="p-ev">Atividade relacionada</label><select id="p-ev">${opt(evOpts, evAtual ? evAtual.ref : '')}</select></div>
      <div class="form-row"><label for="p-pj">Projeto ou campanha</label><select id="p-pj">${opt(ps.map(r => [r.id, r.nome]), v('projeto'), '- Nenhum -')}<option value="__novo">＋ Novo projeto/campanha...</option></select></div>
      <div class="form-row" id="p-pw" hidden><label for="p-pn">Nome do novo projeto/campanha *</label><input id="p-pn" maxlength="80"></div>
      <div class="form-row"><label for="p-rs">Responsável</label><input id="p-rs" maxlength="80" list="com-nomes" value="${esc(v('resp'))}"><datalist id="com-nomes">${nomes.map(n => `<option value="${esc(n)}">`).join('')}</datalist></div>
      <div class="form-row"><label for="p-st">Status *</label><select id="p-st">${opt(STATUS.map(s => [s[0], s[0]]), v('status', STATUS[0][0]))}</select>${ed && ed.aprovadoPor ? `<small>Aprovada por ${esc(ed.aprovadoPor)} em ${fmtData(ed.aprovadoEm)}.</small>` : ''}</div>
      <div class="form-row"><label for="p-lk">Link da postagem (registre depois de publicar)</label><input id="p-lk" type="url" placeholder="https://" value="${esc(v('link'))}"></div>
      <p class="form-erro" id="p-e" role="alert" hidden></p>
      <button class="btn-visit btn-large"><i class="fas fa-save"></i> ${ed ? 'Salvar alterações' : 'Cadastrar'}</button> <button type="button" class="btn-visit btn-large" id="p-x2" style="background:#6c7a7b;margin-left:8px">Cancelar</button></form>`;
  };
  const ligaForm = el => {
    if (!form) return;
    const ed = form.id ? posts().find(p => p.id === form.id) : null;
    $('#p-x2', el).onclick = () => { form = null; draw(); };
    $('#p-pj', el).onchange = e => { $('#p-pw', el).hidden = e.target.value !== '__novo'; };
    $('#p-ev', el).onchange = e => { const t = $('#p-t', el), o = e.target.selectedOptions[0]; if (e.target.value && !t.value.trim()) t.value = o.textContent.replace(/^[\d/]+ - /, ''); };
    $('#fp', el).onsubmit = async e => {
      e.preventDefault();
      const g = id => $('#' + id, el).value.trim(), er = $('#p-e', el), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
      const data = g('p-d'), rede = g('p-r'), tema = g('p-t'), ml = g('p-ml'), lk = g('p-lk'), status = g('p-st'), file = $('#p-i', el).files[0];
      if (!data || !rede || !tema) return falha('Informe a data prevista, a rede social e o tema.');
      if (ml && !/^https?:\/\//i.test(ml)) return falha('O link da imagem/vídeo deve começar com http:// ou https://');
      if (lk && !/^https?:\/\//i.test(lk)) return falha('O link da postagem deve começar com http:// ou https://');
      let projeto = g('p-pj');
      if (projeto === '__novo') {
        const n = g('p-pn').replace(/\s+/g, ' '); if (!n) return falha('Digite o nome do novo projeto/campanha.');
        const l = projs(), ja = l.find(x => norm(x.nome) === norm(n));
        if (ja) projeto = ja.id; else { projeto = uid(); l.push({ id: projeto, nome: n, ativa: true }); db.set('com_projetos', l); }
      }
      let img = ed ? ed.img || '' : ''; if (ed && $('#p-ir', el) && $('#p-ir', el).checked) img = '';
      if (file) { if (!/^image\//.test(file.type)) return falha('Anexe uma imagem (JPG, PNG ou WEBP). Para vídeo, use o campo de link.'); try { img = await reduz(file, 800, 0.7); } catch (x) { return falha('Não foi possível ler a imagem.'); } }
      const evRef = g('p-ev'), evs = D.eventos(db, addDia(data, -60), addDia(data, 400)).concat(D.eventos(db, hoje(), addDia(hoje(), 400)));
      const evTmp = evs.find(x => x.key === evRef), evAnt = ed && ed.evento && ed.evento.ref === evRef ? ed.evento : (form.pre && form.pre.evento && form.pre.evento.ref === evRef ? form.pre.evento : null);
      const evento = evRef ? (evTmp ? { ref: evRef, titulo: evTmp.titulo, data: evTmp.data } : evAnt) : null;
      const dados = { data, rede, tipo: g('p-ti'), tema, texto: $('#p-x', el).value.trim(), img, midiaLink: ml, evento, projeto, resp: g('p-rs'), status, link: lk };
      const l = posts(), antes = ed ? ed.status : '';
      if (RG && status !== (antes || STATUS[0][0])) { const ok = RG.podeMudar(me, ed ? { ...ed, status: antes } : { status: STATUS[0][0], porEmail: me.email, projeto: dados.projeto, equipe: {} }, status, db, agoraIso()); if (!ok.ok) return falha(ok.motivo); }
      let alvo;
      if (ed) { alvo = l.find(p => p.id === ed.id); Object.assign(alvo, dados, { editado: hoje(), editadoPor: me.nome }); } else { alvo = { id: uid(), ...dados, status: dados.status, criado: hoje(), por: me.nome, porEmail: String(me.email || '').toLowerCase() }; l.push(alvo); }
      if (RG) RG.aoSalvar(alvo, ed ? antes : '', me, agoraIso()); else { if (status === 'Aprovada' && antes !== 'Aprovada') { alvo.aprovadoPor = me.nome; alvo.aprovadoEm = hoje(); } if (status === 'Publicada' && antes !== 'Publicada') { alvo.publicadoPor = me.nome; alvo.publicadoEm = hoje(); } }
      if (!salvarPosts(l)) return falha('Sem espaço no navegador. Remova a imagem anexada e use o link.');
      msg = (ed ? 'Publicação atualizada.' : 'Publicação cadastrada.') + (status === 'Publicada' && !lk ? ' Lembre-se de registrar o link da postagem.' : '');
      form = null; draw();
    };
  };
  const ligaLista = el => {
    if (COL) COL.ligaBotoesDet(el);
    el.querySelectorAll('[data-pe]').forEach(b => b.onclick = () => { form = { id: b.dataset.pe }; msg = ''; draw(); window.scrollTo(0, 0); });
    el.querySelectorAll('[data-pd]').forEach(b => b.onclick = () => { if (!confirm('Excluir esta publicação?')) return; salvarPosts(posts().filter(p => p.id !== b.dataset.pd)); msg = 'Publicação excluída.'; draw(); });
    el.querySelectorAll('[data-gerar]').forEach(b => b.onclick = () => { const [k, d] = b.dataset.gerar.split('|'); G.key = k; G.ano = +d.slice(0, 4); sub = 'gerar'; msg = ''; draw(); window.scrollTo(0, 0); });
    el.querySelectorAll('[data-pa]').forEach(b => b.onclick = () => abreAcao(b.dataset.pa));
    const nv = $('#p-novo', el); if (nv) nv.onclick = () => { form = { pre: {} }; msg = ''; draw(); window.scrollTo(0, 0); };
    ligaForm(el);
  };
  const botoesPost = p => ` <button class="icon-btn" data-pe="${p.id}" aria-label="Editar ${esc(p.tema)}"><i class="fas fa-edit" style="color:var(--accent-color)"></i></button><button class="icon-btn" data-pd="${p.id}" aria-label="Excluir ${esc(p.tema)}"><i class="fas fa-trash"></i></button>${COL ? COL.botaoDet(p) : ''}`;
  const topo = () => `${aviso()}${!form ? '<p class="no-print"><button class="btn-visit btn-large" id="p-novo"><i class="fas fa-plus-circle"></i> Nova publicação</button></p>' : formHtml()}`;

  /* ---------- Calendário de Comunicação (publicações + atividades e datas fixas dos calendários do Parque) ---------- */
  const R = {};
  R.cal = el => {
    const cal = D.CALS.find(c => c.id === K.view) || D.CALS[0], sem = !!cal.semanal;
    const per = K.per[cal.id] || 1, m0 = (per - 1) * cal.n, meses = sem ? [] : Array.from({ length: cal.n }, (_, i) => m0 + i);
    const de = sem ? K.ini : `${K.ano}-${pad(m0 + 1)}-01`, ate = sem ? addDia(K.ini, 6) : `${K.ano}-${pad(m0 + cal.n)}-31`;
    const ps = posts().filter(p => (!K.rede || p.rede === K.rede) && (!K.status || p.status === K.status) && (!K.proj || p.projeto === K.proj) && p.data >= de && p.data <= ate);
    const evs = D.eventos(db, de, ate);
    const noDiaEv = iso => evs.filter(e => e.data <= iso && (e.fim || e.data) >= iso);
    const liEv = (e, sd) => { const n = posts().filter(p => p.evento && p.evento.ref === e.key).length;
      return `<li><span class="cal-ponto" style="background:#6a3d9a"></span><span>${sd ? '' : `<strong>${dm(e.data)}</strong> `}<i class="fas fa-calendar-day" aria-hidden="true"></i> ${esc(e.titulo)} <small>(${esc(e.categoria)})</small>${n ? ` <small class="badge-status badge-uso">${n} pub.</small>` : ''} <button class="icon-btn" data-gerar="${esc(e.key)}|${e.data}" aria-label="Planejar publicações de ${esc(e.titulo)}" title="Planejar publicações"><i class="fas fa-bullhorn" style="color:var(--accent-color)"></i></button></span></li>`; };
    const liPost = (p, sd) => `<li><span class="cal-ponto" style="background:${esc(corRede(p.rede))}"></span><span>${sd ? '' : `<strong>${dm(p.data)}</strong> `}${iconeRede(redes().find(r => r.id === p.rede))} - ${esc(p.tema)} ${badge(p.status)} ${link(p.link)}${botoesPost(p)}</span></li>`;
    const mesCard = m => {
      const prim = new Date(K.ano, m, 1).getDay(), dias = new Date(K.ano, m + 1, 0).getDate(); let c = '';
      for (let i = 0; i < prim; i++) c += '<span></span>';
      for (let d = 1; d <= dias; d++) {
        const iso = `${K.ano}-${pad(m + 1)}-${pad(d)}`, pd = ps.filter(p => p.data === iso), ev = noDiaEv(iso), tt = pd.map(p => p.tema).concat(ev.map(e => e.titulo));
        const st = pd.length ? `background:${esc(corRede(pd[0].rede))}` : ev.length ? 'box-shadow:inset 0 0 0 2px #6a3d9a;font-weight:bold' : '';
        c += `<span class="cal-dia${pd.length ? ' tem' : ''}${iso === hoje() ? ' hoje' : ''}"${st ? ` style="${st}" title="${esc(tt.join(' | '))}"` : ''}>${d}</span>`;
      }
      const a = `${K.ano}-${pad(m + 1)}-01`, b = `${K.ano}-${pad(m + 1)}-31`;
      const itens = evs.filter(e => e.data <= b && (e.fim || e.data) >= a).map(e => [e.data < a ? a : e.data, 0, liEv(e, false)]).concat(ps.filter(p => p.data >= a && p.data <= b).map(p => [p.data, 1, liPost(p, false)])).sort((x, y) => x[0].localeCompare(y[0]) || x[1] - y[1]);
      return `<div class="cal-mes"><h4>${MESES[m]} ${K.ano}</h4><div class="cal-grade">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(x => `<b>${x}</b>`).join('')}${c}</div>
      ${itens.length ? `<ul class="cal-lista">${itens.map(i => i[2]).join('')}</ul>` : '<p class="vazio">Sem atividades nem publicações.</p>'}</div>`;
    };
    const diaCard = iso => { const it = noDiaEv(iso).map(e => liEv(e, true)).concat(ps.filter(p => p.data === iso).map(p => liPost(p, true)));
      return `<div class="cal-mes${iso === hoje() ? ' cal-hoje' : ''}"><h4>${DIAS[new Date(iso + 'T12:00:00').getDay()]} <small>${dm(iso)}</small></h4>${it.length ? `<ul class="cal-lista">${it.join('')}</ul>` : '<p class="vazio">Nada planejado.</p>'}</div>`; };
    const anos = [...new Set([anoHoje - 1, anoHoje, anoHoje + 1, anoHoje + 2, K.ano].concat(posts().map(p => +p.data.slice(0, 4))))].sort();
    const sel = (id, rot, html) => `<div class="form-row"><label for="${id}">${rot}</label><select id="${id}">${html}</select></div>`;
    el.innerHTML = `<h3><i class="fas fa-bullhorn"></i> Calendário de Comunicação</h3>
    <p>Planeje as publicações das redes sociais junto das atividades e datas fixas dos calendários do Parque. <strong>Bolinha roxa = atividade ou data do calendário</strong> (use o megafone para criar publicações a partir dela); bolinhas coloridas = publicações, na cor da rede.</p>
    ${topo()}
    <div class="inv-filtros no-print">${sel('k-v', 'Visão', D.CALS.map(c => `<option value="${c.id}"${c.id === cal.id ? ' selected' : ''}>${esc(c.nome.replace('Calendário ', ''))}</option>`).join(''))}
      ${sem ? `<div class="form-row"><label for="k-d">Ir para a semana de</label><input id="k-d" type="date" value="${K.ini}"></div>` : sel('k-a', 'Ano', anos.map(a => `<option${a === K.ano ? ' selected' : ''}>${a}</option>`).join(''))}
      ${!sem && cal.pers.length > 1 ? sel('k-p', cal.perRot || 'Período', cal.pers.map((p, i) => `<option value="${i + 1}"${i + 1 === per ? ' selected' : ''}>${p}</option>`).join('')) : ''}
      ${sel('k-r', 'Rede social', opt(redes().map(r => [r.id, r.nome]), K.rede, 'Todas'))}
      ${sel('k-s', 'Status', opt(STATUS.map(s => [s[0], s[0]]), K.status, 'Todos'))}
      ${sel('k-j', 'Projeto/campanha', opt(projs().map(r => [r.id, r.nome]), K.proj, 'Todos'))}</div>
    <p class="cal-legenda">${redes().map(r => `<span><i style="background:${esc(r.cor)}"></i>${esc(r.nome)}</span>`).join('')}<span><i style="background:#6a3d9a"></i>Atividade / data do calendário</span></p>
    ${sem ? `<p class="no-print"><button class="btn-visit" id="k-ant"><i class="fas fa-chevron-left"></i> Semana anterior</button> <button class="btn-visit" id="k-hoje">Semana atual</button> <button class="btn-visit" id="k-prox">Próxima semana <i class="fas fa-chevron-right"></i></button></p><h4>Semana de ${fmtData(K.ini)} a ${fmtData(ate)}</h4>` : ''}
    <div class="cal-meses">${sem ? Array.from({ length: 7 }, (_, i) => diaCard(addDia(K.ini, i))).join('') : meses.map(mesCard).join('')}</div>`;
    const on = (id, f) => { const x = $('#' + id, el); if (x) x.onchange = f; };
    on('k-v', e => { K.view = e.target.value; draw(); }); on('k-a', e => { K.ano = +e.target.value; draw(); }); on('k-p', e => { K.per[cal.id] = +e.target.value; draw(); });
    on('k-r', e => { K.rede = e.target.value; draw(); }); on('k-s', e => { K.status = e.target.value; draw(); }); on('k-j', e => { K.proj = e.target.value; draw(); });
    on('k-d', e => { if (e.target.value) { K.ini = domingoDe(e.target.value); draw(); } });
    const bt = (id, f) => { const x = $('#' + id, el); if (x) x.onclick = f; };
    bt('k-ant', () => { K.ini = addDia(K.ini, -7); draw(); }); bt('k-prox', () => { K.ini = addDia(K.ini, 7); draw(); }); bt('k-hoje', () => { K.ini = domingoDe(hoje()); draw(); });
    ligaLista(el);
  };

  /* ---------- Lista de publicações ---------- */
  const filtra = () => { const q = norm(F.q); return posts().filter(p => (!F.ano || p.data.slice(0, 4) === F.ano) && (!F.rede || p.rede === F.rede) && (!F.status || p.status === F.status) && (!F.proj || p.projeto === F.proj) && (!F.tipo || p.tipo === F.tipo) && (!q || norm([p.tema, p.texto, p.resp, p.evento && p.evento.titulo].join(' ')).includes(q))).sort((a, b) => a.data.localeCompare(b.data) || a.tema.localeCompare(b.tema, 'pt-BR')); };
  R.lista = el => {
    const todas = posts(), anos = [...new Set(todas.map(p => p.data.slice(0, 4)))].sort().reverse(), rs = redes(), pj = projs(), ts = tipos();
    el.innerHTML = `<h3><i class="fas fa-list"></i> Publicações</h3>
    <p>Todas as publicações planejadas, da data mais próxima para a mais distante. Mude o status direto na lista; ao marcar "Publicada", registre o link da postagem.</p>
    ${topo()}
    <p class="no-print">${STATUS.map(s => `<button class="btn-visit" data-fs="${esc(s[0])}" style="background:${F.status === s[0] ? s[1] : '#fff'};color:${F.status === s[0] ? '#fff' : s[1]};border:1px solid ${s[1]};margin:0 6px 6px 0">${esc(s[0])} (${todas.filter(p => p.status === s[0]).length})</button>`).join('')}${F.status ? ' <button class="btn-visit" data-fs="" style="background:#6c7a7b">Limpar</button>' : ''}</p>
    <div class="inv-filtros no-print"><div class="form-row"><label for="l-a">Ano</label><select id="l-a"><option value="">Todos</option>${anos.map(a => `<option${a === F.ano ? ' selected' : ''}>${a}</option>`).join('')}</select></div>
      <div class="form-row"><label for="l-r">Rede social</label><select id="l-r">${opt(rs.map(r => [r.id, r.nome]), F.rede, 'Todas')}</select></div>
      <div class="form-row"><label for="l-j">Projeto/campanha</label><select id="l-j">${opt(pj.map(r => [r.id, r.nome]), F.proj, 'Todos')}</select></div>
      <div class="form-row"><label for="l-f">Formato</label><select id="l-f">${opt(ts.map(r => [r.id, r.nome]), F.tipo, 'Todos')}</select></div>
      <div class="form-row"><label for="l-q">Buscar</label><input id="l-q" type="search" value="${esc(F.q)}" placeholder="Tema, texto, responsável, atividade"></div></div>
    <div id="l-res"></div>`;
    const lista = () => {
      const f = filtra();
      $('#l-res', el).innerHTML = f.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Data</th><th>Rede</th><th>Tema</th><th>Atividade</th><th>Projeto</th><th>Responsável</th><th>Status</th><th>Link</th><th></th></tr></thead><tbody>${f.map(p => `<tr><td>${fmtData(p.data)}</td><td>${iconeRede(rs.find(r => r.id === p.rede))}</td><td><strong>${esc(p.tema)}</strong>${p.tipo ? `<br><small>${esc(nomeDe(ts, p.tipo))}${p.bannerSlug ? ' · página: ' + esc(slotNome(p.bannerSlug)) : ''}</small>` : ''}${p.texto ? `<br><small>${esc(p.texto.slice(0, 120))}${p.texto.length > 120 ? '...' : ''}</small>` : ''}${p.img ? ' <i class="fas fa-image" title="Tem imagem" aria-label="Tem imagem"></i>' : ''}${p.midiaLink && safeUrl(p.midiaLink) ? ` <a href="${esc(p.midiaLink)}" target="_blank" rel="noopener" title="Imagem ou vídeo"><i class="fas fa-photo-video"></i></a>` : ''}</td><td>${p.evento ? esc(p.evento.titulo) : '-'}</td><td>${esc(nomeDe(pj, p.projeto))}</td><td>${esc(p.resp || '-')}</td>
        <td><select data-st="${p.id}" aria-label="Status de ${esc(p.tema)}">${STATUS.map(s => `<option${s[0] === p.status ? ' selected' : ''}>${esc(s[0])}</option>`).join('')}</select></td>
        <td>${link(p.link) || (p.status === 'Publicada' ? '<span class="badge-emprestado">Sem link</span>' : '-')}</td><td>${botoesPost(p)}${p.acao ? ` <button class="icon-btn" data-pa="${p.acao}" aria-label="Abrir no painel: ${esc(p.tema)}" title="Abrir esta ação no painel"><i class="fas fa-th-large" style="color:var(--accent-color)"></i></button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : `<p class="vazio">${todas.length ? 'Nenhuma publicação com esses filtros.' : 'Nenhuma publicação planejada ainda. Use "Nova publicação" ou "Criar a partir do calendário".'}</p>`;
      el.querySelectorAll('[data-st]').forEach(s => s.onchange = () => {
        const r = mudaStatus(s.dataset.st, s.value); if (!r.ok) { msg = r.motivo; draw(); return; }
        const p = posts().find(x => x.id === s.dataset.st);
        if (p.status === 'Publicada' && !p.link) { form = { id: p.id }; msg = 'Status alterado para Publicada. Registre o link da postagem.'; } else msg = 'Status atualizado.';
        draw();
      });
      ligaLista(el);
    };
    el.querySelectorAll('[data-fs]').forEach(b => b.onclick = () => { F.status = b.dataset.fs; draw(); });
    $('#l-a', el).onchange = e => { F.ano = e.target.value; lista(); }; $('#l-r', el).onchange = e => { F.rede = e.target.value; lista(); }; $('#l-j', el).onchange = e => { F.proj = e.target.value; lista(); }; $('#l-f', el).onchange = e => { F.tipo = e.target.value; lista(); };
    $('#l-q', el).oninput = e => { F.q = e.target.value.trim(); lista(); };
    lista();
  };

  /* ---------- Criar publicações a partir de uma atividade ou data do calendário ---------- */
  R.gerar = el => {
    const evs = D.eventos(db, `${G.ano}-01-01`, `${G.ano}-12-31`), sel = evs.find(e => e.key === G.key) || null;
    const rs = redes().filter(r => r.ativa), ja = sel ? posts().filter(p => p.evento && p.evento.ref === sel.key) : [];
    const anos = [...new Set([anoHoje - 1, anoHoje, anoHoje + 1, anoHoje + 2, G.ano])].sort();
    el.innerHTML = `<h3><i class="fas fa-magic"></i> Criar publicações a partir do calendário</h3>
    <p>Escolha uma atividade ou data dos calendários do Parque (inclusive as datas fixas anuais) e as redes sociais. O sistema cria uma publicação para cada rede, com status "Ideia", para você completar depois.</p>
    ${aviso()}
    <div class="inv-filtros"><div class="form-row"><label for="g-a">Ano</label><select id="g-a">${anos.map(a => `<option${a === G.ano ? ' selected' : ''}>${a}</option>`).join('')}</select></div>
      <div class="form-row"><label for="g-e">Atividade ou data *</label><select id="g-e">${opt(evs.map(e => [e.key, `${fmtData(e.data).slice(0, 5)} - ${e.titulo} (${e.categoria})`]), G.key, evs.length ? '- Escolha -' : '- Nenhuma atividade neste ano -')}</select></div></div>
    ${sel ? `<form id="fg" class="form-reserva" novalidate><p><strong>${esc(sel.titulo)}</strong> - ${fmtData(sel.data)}${sel.fim ? ' a ' + fmtData(sel.fim) : ''}</p>
      ${ja.length ? `<p class="vazio">Já planejado: ${ja.map(p => `${esc(nomeDe(redes(), p.rede))} (${esc(p.status)})`).join(', ')}.</p>` : ''}
      <fieldset class="funcoes"><legend>Redes sociais *</legend>${rs.map(r => { const ex = ja.some(p => p.rede === r.id); return `<label><input type="checkbox" name="g-r" value="${esc(r.id)}"${ex ? ' disabled' : ' checked'}> ${iconeRede(r)}${ex ? ' <small>(já planejada)</small>' : ''}</label>`; }).join('')}</fieldset>
      <div class="form-row"><label for="g-d">Data prevista das publicações</label><input id="g-d" type="date" value="${esc(sel.data)}"><small>Pode ser antes da data (ex.: véspera) ou no próprio dia.</small></div>
      <div class="form-row"><label for="g-j">Projeto ou campanha</label><select id="g-j">${opt(projs().filter(r => r.ativa).map(r => [r.id, r.nome]), '', '- Nenhum -')}</select></div>
      <p class="form-erro" id="g-er" role="alert" hidden></p>
      <button class="btn-visit btn-large"><i class="fas fa-plus-circle"></i> Criar publicações</button></form>` : ''}`;
    $('#g-a', el).onchange = e => { G.ano = +e.target.value; G.key = ''; msg = ''; draw(); };
    $('#g-e', el).onchange = e => { G.key = e.target.value; msg = ''; draw(); };
    if (!sel) return;
    $('#fg', el).onsubmit = e => {
      e.preventDefault(); const er = $('#g-er', el), marc = [...el.querySelectorAll('[name=g-r]:checked')].map(i => i.value), data = $('#g-d', el).value;
      if (!marc.length) { er.textContent = 'Marque ao menos uma rede social.'; er.hidden = false; return; }
      if (!data) { er.textContent = 'Informe a data prevista.'; er.hidden = false; return; }
      const l = posts(), pj = $('#g-j', el).value;
      marc.forEach(r => l.push({ id: uid(), data, rede: r, tipo: '', tema: sel.titulo, texto: '', img: '', midiaLink: '', evento: { ref: sel.key, titulo: sel.titulo, data: sel.data }, projeto: pj, resp: '', status: STATUS[0][0], link: '', criado: hoje(), por: me.nome }));
      if (!salvarPosts(l)) { er.textContent = 'Sem espaço no navegador para salvar.'; er.hidden = false; return; }
      F.ano = F.rede = F.status = F.proj = F.tipo = F.q = ''; msg = `${marc.length} publicação(ões) criada(s) com status "${STATUS[0][0]}". Complete tema, texto e mídia abaixo.`; sub = 'pub'; draw();
    };
  };

  /* ---------- Painel de Comunicação (dentro de Publicações): cada ação = 1 publicação por canal, com formato, status, materiais e os banners do site ---------- */
  const acoes = () => db.get('com_acoes', []);
  const formatos = () => db.get('com_formatos', {});
  const tiposDe = (redeId, atual) => { const ids = formatos()[redeId]; return tipos().filter(t => (t.ativa || t.id === atual) && (!ids || ids.includes(t.id) || t.id === atual)); };
  const postsDe = id => posts().filter(p => p.acao === id);
  const slots = () => (window.PR_BANNERS ? window.PR_BANNERS.SLOTS : []);
  const slotNome = slug => { const s = slots().find(x => x.slug === slug); return s ? s.nome : (slug || '-'); };
  const bannerEstado = slug => { const c = db.get('site_banners', []).find(x => x.id === slug), n = c ? (c.slides || []).filter(x => x.ativo !== false && x.img).length : 0; return n ? `${c.modo === 'carrossel' ? 'Carrossel' : 'Fixo'} com ${n} imagem(ns) ativa(s)` : 'sem banner novo (a página usa o banner original)'; };
  const PV = { view: 'painel', ano: '', proj: '', q: '' };
  let acao = null; // ação aberta no editor do painel
  const URL_OK = u => /^https?:\/\//i.test(u);
  const matN = a => MATS.filter(m => a && a.mat && a.mat[m[0]]).length;
  const devidas = () => posts().filter(p => p.status !== 'Publicada' && p.data <= hoje()).length;
  // Medida de referência de um formato (ou a medida exata do banner da página escolhida).
  const medidaPorTipo = (tipoId, rede, slug) => {
    if (rede === 'site') { const s = slots().find(x => x.slug === slug); return s ? `${s.w} × ${s.h} px (medida exata do banner)` : ''; }
    const t = tipos().find(x => x.id === tipoId); if (!t) return '';
    const k = Object.keys(MEDIDAS_BASE).find(x => norm(x) === norm(t.nome)); return k ? MEDIDAS_BASE[k] : '';
  };
  const linhasPara = id => {
    const ps = id ? postsDe(id) : [], rs = redes().filter(r => r.id !== 'site' && (r.ativa || ps.some(p => p.rede === r.id)));
    const canais = rs.map(r => { const p = ps.find(x => x.rede === r.id); return { rede: r.id, usar: !!p, postId: p ? p.id : '', tipo: p ? p.tipo || '' : '', status: p ? p.status : STATUS[0][0], data: p ? p.data : '', link: p ? p.link || '' : '' }; });
    const site = ps.filter(p => p.rede === 'site').map(p => ({ rede: 'site', usar: true, postId: p.id, bannerSlug: p.bannerSlug || '', tipo: p.tipo || '', status: p.status, data: p.data, link: p.link || '' }));
    return canais.concat(site);
  };
  // pre = { tema, data, evento:{ref,titulo,data} } para começar uma ação nova já preenchida (ex.: a partir de uma atividade do calendário).
  const abreAcao = (id, pre) => {
    const a = id ? acoes().find(x => x.id === id) : null; if (id && !a) return; const q = !a && pre ? pre : null;
    acao = { id: id || '', tema: a ? a.tema : q ? q.tema : '', data: a ? a.data : q ? q.data : hoje(), projeto: a ? a.projeto || '' : '', evento: a && a.evento ? a.evento.ref : q && q.evento ? q.evento.ref : '', eventoObj: a ? a.evento || null : q ? q.evento || null : null, resp: a ? a.resp || '' : '', texto: a ? a.texto || '' : '', midiaLink: a ? a.midiaLink || '' : '', pasta: a ? a.pasta || '' : '', mat: a && a.mat ? { ...a.mat } : {}, obsMat: a ? a.obsMat || '' : '', rows: linhasPara(id) };
    sub = 'pub'; PV.view = 'painel'; form = null; msg = ''; draw(); window.scrollTo(0, 0);
  };
  const slugOpts = sel => { const g = []; slots().forEach(s => { let x = g.find(y => y[0] === s.grupo); if (!x) g.push(x = [s.grupo, []]); x[1].push(s); }); return '<option value="">- escolha a página -</option>' + g.map(x => `<optgroup label="${esc(x[0])}">${x[1].map(s => `<option value="${esc(s.slug)}"${s.slug === sel ? ' selected' : ''}>${esc(s.nome)}</option>`).join('')}</optgroup>`).join(''); };

  const editorHtml = () => {
    const a = acao, rr = redes(), hj = hoje();
    const evs = D.eventos(db, addDia(a.data < hj ? a.data : hj, -60), addDia(a.data > hj ? a.data : hj, 400));
    const temEv = a.evento && evs.some(e => e.key === a.evento);
    const evOpts = [['', '- Nenhum -']].concat(a.evento && !temEv ? [[a.evento, a.eventoObj ? `${fmtData(a.eventoObj.data)} - ${a.eventoObj.titulo}` : a.evento]] : []).concat(evs.map(e => [e.key, `${fmtData(e.data)} - ${e.titulo}`]));
    const ps = projs().filter(r => r.ativa || r.id === a.projeto), nomes = [...new Set(db.get('users', []).map(u => u.nome).filter(Boolean))];
    const celulas = (r, i, nomeCanal) => `<td><select data-f="tipo" aria-label="Formato - ${esc(nomeCanal)}">${opt(tiposDe(r.rede, r.tipo).map(t => [t.id, t.nome]), r.tipo, '- escolha -')}</select><small data-med style="display:block">${esc(medidaPorTipo(r.tipo, r.rede, r.bannerSlug))}</small></td>
        <td><select data-f="status" aria-label="Status - ${esc(nomeCanal)}">${opt(STATUS.map(s => [s[0], s[0]]), r.status)}</select></td>
        <td><input type="date" data-f="data" value="${esc(r.data)}" aria-label="Data - ${esc(nomeCanal)}"></td>
        <td><input type="url" data-f="link" placeholder="https://" value="${esc(r.link)}" aria-label="Link da postagem - ${esc(nomeCanal)}"></td>`;
    const canais = a.rows.map((r, i) => [r, i]).filter(x => x[0].rede !== 'site').map(([r, i]) => { const rd = rr.find(x => x.id === r.rede);
      return `<tr data-ri="${i}"><td><input type="checkbox" data-f="usar"${r.usar ? ' checked' : ''} aria-label="Usar ${esc(rd ? rd.nome : r.rede)}"></td><td>${iconeRede(rd)}</td>${celulas(r, i, rd ? rd.nome : r.rede)}</tr>`; }).join('');
    const siteRede = rr.find(x => x.id === 'site'), linhasSite = a.rows.map((r, i) => [r, i]).filter(x => x[0].rede === 'site');
    const site = linhasSite.map(([r, i]) => `<tr data-ri="${i}"><td><select data-f="bannerSlug" aria-label="Página do site">${slugOpts(r.bannerSlug)}</select>${r.bannerSlug ? `<br><small>Hoje: ${esc(bannerEstado(r.bannerSlug))}</small>` : ''}</td>${celulas(r, i, 'Banner do site')}
        <td><button type="button" class="icon-btn" data-rmsite="${i}" aria-label="Remover esta página do banner" title="Remover"><i class="fas fa-trash"></i></button>${r.postId && r.bannerSlug ? ` <button type="button" class="btn-visit" data-ban="${esc(r.bannerSlug)}" title="Abre a tela de banners já nesta página"><i class="fas fa-images"></i> Configurar imagem</button>` : ''}</td></tr>`).join('');
    return `<form id="fa" class="form-reserva" novalidate><h4 style="margin-top:0">${a.id ? 'Editar ação de comunicação' : 'Nova ação de comunicação'}</h4>
      <p>Uma <strong>ação</strong> é uma mensagem do Parque (atividade, campanha, aviso) que pode sair em vários canais. Marque os canais, escolha o <strong>formato</strong> de cada um e acompanhe o status. Cada canal marcado vira uma publicação na Lista e no Calendário.</p>
      <div class="form-row"><label for="a-t">Título da ação *</label><input id="a-t" maxlength="140" value="${esc(a.tema)}"></div>
      <div class="form-row"><label for="a-d">Data prevista *</label><input id="a-d" type="date" value="${esc(a.data)}"><small>Os canais seguem esta data; para um canal sair em outro dia, mude a data na linha dele.</small></div>
      <div class="form-row"><label for="a-pj">Projeto ou campanha</label><select id="a-pj">${opt(ps.map(r => [r.id, r.nome]), a.projeto, '- Nenhum -')}<option value="__novo"${a.projeto === '__novo' ? ' selected' : ''}>＋ Novo projeto/campanha...</option></select></div>
      <div class="form-row" id="a-pw"${a.projeto === '__novo' ? '' : ' hidden'}><label for="a-pn">Nome do novo projeto/campanha *</label><input id="a-pn" maxlength="80" value="${esc(a.novoProj || '')}"></div>
      <div class="form-row"><label for="a-ev">Atividade relacionada</label><select id="a-ev">${opt(evOpts, a.evento)}</select></div>
      <div class="form-row"><label for="a-rs">Responsável</label><input id="a-rs" maxlength="80" list="com-nomes" value="${esc(a.resp)}"><datalist id="com-nomes">${nomes.map(n => `<option value="${esc(n)}">`).join('')}</datalist></div>
      <div class="form-row"><label for="a-x">Texto base (vale para todos os canais; cada canal pode ser ajustado depois na Lista)</label><textarea id="a-x" rows="4" maxlength="2200">${esc(a.texto)}</textarea></div>
      <div class="form-row"><label for="a-ml">Link da imagem / vídeo (Google Drive, YouTube...)</label><input id="a-ml" type="url" placeholder="https://" value="${esc(a.midiaLink)}"></div>
      <h4 class="subsection-title">Materiais</h4>
      <div class="form-row"><label for="a-pa">Pasta dos materiais (Google Drive ou similar)</label><input id="a-pa" type="url" placeholder="https://" value="${esc(a.pasta)}"><small>Uma pasta por ação, com briefing, artes e vídeos: quem assumir a comunicação encontra tudo num lugar só.</small></div>
      <fieldset style="border:0;padding:0;margin:0 0 12px"><legend><strong>Checklist de materiais</strong></legend>${MATS.map(m => `<label style="display:block;margin:4px 0"><input type="checkbox" data-mat="${m[0]}"${a.mat[m[0]] ? ' checked' : ''}> ${esc(m[1])}</label>`).join('')}</fieldset>
      <div class="form-row"><label for="a-om">Observações sobre o material</label><textarea id="a-om" rows="2" maxlength="400">${esc(a.obsMat)}</textarea></div>
      <h4 class="subsection-title">Redes sociais e canais</h4>
      <div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Usar</th><th>Canal</th><th>Formato</th><th>Status</th><th>Data</th><th>Link da postagem</th></tr></thead><tbody>${canais}</tbody></table></div>
      <h4 class="subsection-title">Banners do site</h4>
      ${siteRede && (siteRede.ativa || linhasSite.length) ? `<p>Se esta ação também vai para o <strong>banner de alguma página do site</strong>, acrescente a página abaixo. A imagem em si é configurada em <em>Site</em> (medida exata e pacote para publicar); aqui você planeja e acompanha.</p>
      ${linhasSite.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Página do site</th><th>Formato</th><th>Status</th><th>Data</th><th>Link</th><th></th></tr></thead><tbody>${site}</tbody></table></div>` : '<p class="vazio">Nenhum banner do site nesta ação.</p>'}
      <p><button type="button" class="btn-visit" data-addsite="1"><i class="fas fa-plus-circle"></i> Acrescentar banner de uma página do site</button></p>` : '<p class="vazio">O canal "Site (banners)" está desativado em Redes sociais.</p>'}
      <p class="form-erro" id="a-e" role="alert" hidden></p>
      <button class="btn-visit btn-large"><i class="fas fa-save"></i> ${a.id ? 'Salvar ação' : 'Criar ação'}</button> <button type="button" class="btn-visit btn-large" id="a-cancel" style="background:#6c7a7b;margin-left:8px">Cancelar</button></form>`;
  };
  const lerEditor = el => {
    const a = acao, g = id => { const x = $('#' + id, el); return x ? x.value.trim() : ''; };
    a.tema = g('a-t'); a.data = g('a-d'); a.projeto = g('a-pj'); a.evento = g('a-ev'); a.resp = g('a-rs'); a.texto = g('a-x'); a.midiaLink = g('a-ml'); a.novoProj = g('a-pn'); a.pasta = g('a-pa'); a.obsMat = g('a-om');
    a.mat = {}; el.querySelectorAll('[data-mat]').forEach(c => { if (c.checked) a.mat[c.dataset.mat] = true; });
    el.querySelectorAll('tr[data-ri]').forEach(tr => { const r = a.rows[+tr.dataset.ri]; tr.querySelectorAll('[data-f]').forEach(f => { r[f.dataset.f] = f.type === 'checkbox' ? f.checked : f.value.trim(); }); });
  };
  const irParaBanner = slug => { if (slug) sessionStorage.setItem('pr_com_banner', slug); sub = 'site'; form = null; msg = ''; draw(); window.scrollTo(0, 0); };
  const ligaEditor = el => {
    $('#a-cancel', el).onclick = () => { acao = null; draw(); };
    $('#a-pj', el).onchange = e => { $('#a-pw', el).hidden = e.target.value !== '__novo'; };
    el.querySelectorAll('tr[data-ri] [data-f]').forEach(f => { if (f.dataset.f === 'usar') return; f.onchange = () => {
      const tr = f.closest('tr'), r = acao.rows[+tr.dataset.ri], v = k => { const x = tr.querySelector(`[data-f="${k}"]`); return x ? x.value : ''; };
      const m = tr.querySelector('[data-med]'); if (m && (f.dataset.f === 'tipo' || f.dataset.f === 'bannerSlug')) m.textContent = medidaPorTipo(v('tipo'), r.rede, v('bannerSlug'));
      const c = tr.querySelector('[data-f="usar"]'); if (c && f.dataset.f === 'tipo' && f.value) c.checked = true; }; });
    el.querySelectorAll('[data-rmsite]').forEach(b => b.onclick = () => { lerEditor(el); acao.rows.splice(+b.dataset.rmsite, 1); draw(); });
    const add = $('[data-addsite]', el); if (add) add.onclick = () => { lerEditor(el); acao.rows.push({ rede: 'site', usar: true, postId: '', bannerSlug: '', tipo: '', status: STATUS[0][0], data: '', link: '' }); draw(); };
    el.querySelectorAll('[data-ban]').forEach(b => b.onclick = () => { lerEditor(el); irParaBanner(b.dataset.ban); });
    $('#fa', el).onsubmit = e => {
      e.preventDefault(); lerEditor(el);
      const a = acao, er = $('#a-e', el), falha = m => { er.textContent = m; er.hidden = false; er.scrollIntoView({ block: 'center' }); }; er.hidden = true;
      if (!a.tema || !a.data) return falha('Informe o título da ação e a data prevista.');
      if (a.midiaLink && !URL_OK(a.midiaLink)) return falha('O link da imagem/vídeo deve começar com http:// ou https://');
      if (a.pasta && !URL_OK(a.pasta)) return falha('O link da pasta de materiais deve começar com http:// ou https://');
      const rr = redes(), nomeR = r => r.rede === 'site' ? 'Banner do site' : nomeDe(rr, r.rede), usadas = a.rows.filter(r => r.usar);
      if (!usadas.length) return falha('Marque ao menos um canal (ou acrescente um banner do site).');
      for (const r of usadas) {
        if (r.rede === 'site' && !r.bannerSlug) return falha('Escolha a página do site de cada banner.');
        if (!r.tipo) return falha(`Escolha o formato de: ${nomeR(r)}${r.rede === 'site' ? ' (' + slotNome(r.bannerSlug) + ')' : ''}.`);
        if (r.link && !URL_OK(r.link)) return falha(`O link da postagem de ${nomeR(r)} deve começar com http:// ou https://`);
      }
      const sl = usadas.filter(r => r.rede === 'site').map(r => r.bannerSlug); if (new Set(sl).size !== sl.length) return falha('Há duas linhas para a mesma página do site.');
      // Aviso (não bloqueia): canal aprovado/agendado/publicado com o checklist de materiais incompleto.
      const adiantados = usadas.filter(r => ['Aprovada', 'Agendada', 'Publicada'].includes(r.status));
      if (adiantados.length && matN(a) < MATS.length && !confirm(`Há canal(is) aprovado(s), agendado(s) ou publicado(s), mas o checklist de materiais está em ${matN(a)}/${MATS.length}. Salvar mesmo assim?`)) return;
      let projeto = a.projeto;
      if (projeto === '__novo') {
        const n = a.novoProj.replace(/\s+/g, ' '); if (!n) return falha('Digite o nome do novo projeto/campanha.');
        const l = projs(), ja = l.find(x => norm(x.nome) === norm(n));
        if (ja) projeto = ja.id; else { projeto = uid(); l.push({ id: projeto, nome: n, ativa: true }); db.set('com_projetos', l); }
      }
      const ant = a.id ? acoes().find(x => x.id === a.id) : null, id = a.id || uid(), l = posts();
      const evs = D.eventos(db, addDia(a.data, -60), addDia(a.data, 400)).concat(D.eventos(db, hoje(), addDia(hoje(), 400))), evTmp = evs.find(x => x.key === a.evento);
      const evento = a.evento ? (evTmp ? { ref: a.evento, titulo: evTmp.titulo, data: evTmp.data } : (a.eventoObj && a.eventoObj.ref === a.evento ? a.eventoObj : null)) : null;
      const manter = new Set(usadas.map(r => r.postId).filter(Boolean)), remover = l.filter(p => p.acao === id && !manter.has(p.id));
      if (remover.length && !confirm(`${remover.length} publicação(ões) deste painel será(ão) excluída(s) por não estarem mais marcadas. Continuar?`)) return;
      usadas.forEach(r => {
        const dados = { data: !r.data || (ant && r.data === ant.data) ? a.data : r.data, rede: r.rede, tipo: r.tipo, evento, projeto, resp: a.resp, status: r.status, link: r.link };
        if (r.rede === 'site') dados.bannerSlug = r.bannerSlug;
        const p = r.postId ? l.find(x => x.id === r.postId) : null;
        if (p) {
          const antes = p.status, temaAnt = ant ? ant.tema : p.tema, statusPedido = dados.status;
          if (!p.tema || p.tema === temaAnt) dados.tema = a.tema;
          if (!p.texto || (ant && p.texto === ant.texto)) dados.texto = a.texto;
          if (!p.midiaLink || (ant && p.midiaLink === ant.midiaLink)) dados.midiaLink = a.midiaLink;
          Object.assign(p, dados, { editado: hoje(), editadoPor: me.nome });
          aplicaEfeitos(p, antes);
        } else {
          const n = { id: uid(), ...dados, tema: a.tema, texto: a.texto, img: '', midiaLink: a.midiaLink, criado: hoje(), por: me.nome, porEmail: String(me.email || '').toLowerCase(), acao: id };
          aplicaEfeitos(n, '');
          l.push(n);
        }
      });
      const rem = new Set(remover.map(p => p.id)), final = l.filter(p => !rem.has(p.id));
      if (!salvarPosts(final)) return falha('Sem espaço no navegador para salvar.');
      const reg = { id, tema: a.tema, data: a.data, projeto, evento, resp: a.resp, texto: a.texto, midiaLink: a.midiaLink, pasta: a.pasta, mat: a.mat, obsMat: a.obsMat, criado: ant ? ant.criado : hoje(), por: ant ? ant.por : me.nome };
      if (ant) { reg.editado = hoje(); reg.editadoPor = me.nome; if (ant.organizada) reg.organizada = true; }
      const al = acoes().filter(x => x.id !== id); al.push(reg);
      if (!salvarAcoes(al)) return falha('Sem espaço no navegador para salvar.');
      msg = `Ação ${ant ? 'atualizada' : 'criada'}: ${usadas.length} canal(is).` + (usadas.some(r => r.status === 'Publicada' && !r.link) ? ' Lembre-se de registrar o link das postagens já publicadas.' : '');
      acao = null; draw();
    };
  };
  const salvarAcoes = l => db.set('com_acoes', l);

  // Organiza as publicações antigas (sem ação) em ações, SÓ acrescentando o vínculo; nada é alterado nem apagado.
  const organizarAntigas = () => {
    const l = posts(), soltas = l.filter(p => !p.acao).sort((x, y) => x.data.localeCompare(y.data)), grupos = [];
    soltas.forEach(p => {
      const chave = p.evento ? 'e:' + p.evento.ref : 't:' + norm(p.tema) + '|' + (p.projeto || '');
      const g = grupos.find(x => x.chave === chave && !x.ps.some(q => q.rede === p.rede && (q.bannerSlug || '') === (p.bannerSlug || '')));
      if (g) g.ps.push(p); else grupos.push({ chave, ps: [p] });
    });
    const al = acoes();
    grupos.forEach(g => { const p0 = g.ps[0], id = uid(); al.push({ id, tema: p0.tema, data: g.ps.map(p => p.data).sort()[0], projeto: p0.projeto || '', evento: p0.evento || null, resp: p0.resp || '', texto: '', midiaLink: '', criado: hoje(), por: me.nome, organizada: true }); g.ps.forEach(p => { p.acao = id; }); });
    if (!salvarPosts(l) || !salvarAcoes(al)) return -1;
    return grupos.length;
  };

  const cfgFormatosHtml = () => {
    const rs = redes().filter(r => r.ativa), ts = tipos().filter(t => t.ativa), fm = formatos();
    return `<details class="no-print" style="margin:16px 0"><summary><strong>Configurar quais formatos cada canal oferece</strong></summary>
      <p>Marque, para cada canal, os formatos que aparecem na escolha. Novos formatos entram em <em>Tipos de publicação</em>; novos canais, em <em>Redes sociais</em>.</p>
      <form id="ff" novalidate><div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Canal</th>${ts.map(t => `<th>${esc(t.nome)}</th>`).join('')}</tr></thead><tbody>${rs.map(r => `<tr><td>${iconeRede(r)}</td>${ts.map(t => `<td style="text-align:center"><input type="checkbox" data-fr="${esc(r.id)}" value="${esc(t.id)}"${!fm[r.id] || fm[r.id].includes(t.id) ? ' checked' : ''} aria-label="${esc(r.nome)}: ${esc(t.nome)}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="form-erro" id="ff-e" role="alert" hidden></p><button class="btn-visit"><i class="fas fa-save"></i> Salvar formatos</button></form></details>`;
  };

  R.painel = el => {
    if (acao) { el.innerHTML = `${aviso()}${editorHtml()}`; ligaEditor(el); return; }
    const as = acoes(), todos = posts(), rs = redes().filter(r => r.id !== 'site' && (r.ativa || todos.some(p => p.rede === r.id && p.acao))), ts = tipos(), pj = projs();
    const anos = [...new Set(as.map(a => a.data.slice(0, 4)))].sort().reverse(), soltas = todos.filter(p => !p.acao).length, q = norm(PV.q);
    const vis = as.filter(a => (!PV.ano || a.data.slice(0, 4) === PV.ano) && (!PV.proj || a.projeto === PV.proj) && (!q || norm([a.tema, a.resp].join(' ')).includes(q))).sort((x, y) => x.data.localeCompare(y.data) || x.tema.localeCompare(y.tema, 'pt-BR'));
    const cel = (a, rid) => { const p = postsDe(a.id).find(x => x.rede === rid); return p ? `<strong>${esc(nomeDe(ts, p.tipo))}</strong><br>${badge(p.status)}${p.link && URL_OK(p.link) ? ` <a href="${esc(p.link)}" target="_blank" rel="noopener" aria-label="Ver postagem"><i class="fas fa-external-link-alt"></i></a>` : ''}` : '<span aria-label="Não usa este canal">-</span>'; };
    const celSite = a => { const l = postsDe(a.id).filter(p => p.rede === 'site'); return l.length ? l.map(p => `${esc(slotNome(p.bannerSlug))} <small>(${esc(nomeDe(ts, p.tipo))})</small> ${badge(p.status)}`).join('<br>') : '-'; };
    const celMat = a => `${matN(a)}/${MATS.length}${a.pasta && URL_OK(a.pasta) ? ` <a href="${esc(a.pasta)}" target="_blank" rel="noopener" aria-label="Abrir a pasta de materiais"><i class="fas fa-folder-open"></i></a>` : ''}`;
    const slugs = [...new Set(db.get('site_banners', []).filter(c => (c.slides || []).some(x => x.img)).map(c => c.id).concat(todos.filter(p => p.rede === 'site' && p.bannerSlug).map(p => p.bannerSlug)))];
    const bn = slugs.map(sg => { const c = db.get('site_banners', []).find(x => x.id === sg), ligadas = as.filter(a => postsDe(a.id).some(p => p.rede === 'site' && p.bannerSlug === sg));
      return `<tr><td>${esc(slotNome(sg))}</td><td>${esc(bannerEstado(sg))}</td><td>${c && c.atualizado ? fmtData(c.atualizado.slice(0, 10)) : '-'}</td><td>${ligadas.length ? ligadas.map(a => `<a href="#" data-ae="${a.id}">${esc(a.tema)}</a>`).join('<br>') : '-'}</td><td><button type="button" class="btn-visit" data-ban="${esc(sg)}"><i class="fas fa-images"></i> Abrir</button></td></tr>`; }).join('');
    // Atividades dos calendários (inclui as que nasceram das atas) que ainda não têm comunicação planejada.
    const pend = D.eventos(db, hoje(), addDia(hoje(), 45)).filter(e => !todos.some(p => p.evento && p.evento.ref === e.key) && !as.some(a => a.evento && a.evento.ref === e.key));
    el.innerHTML = `<h3><i class="fas fa-th-large"></i> Painel de Comunicação</h3>
      <p>Um só lugar para decidir <strong>onde</strong> (Instagram, Facebook, WhatsApp Canal / Comunidade / Grupo, YouTube, site) e <strong>em que formato</strong> cada mensagem do Parque vai sair, com o status de cada canal. A Lista de publicações e o Calendário continuam funcionando e mostram as mesmas publicações.</p>
      ${aviso()}
      <p class="no-print"><button class="btn-visit btn-large" id="a-novo"><i class="fas fa-plus-circle"></i> Nova ação de comunicação</button></p>
      <div class="no-print" id="a-pend"><h4 class="subsection-title"><i class="fas fa-bullhorn"></i> Próximas atividades sem comunicação planejada</h4>
      ${pend.length ? `<p>Atividades e datas dos calendários nos próximos 45 dias que ainda não têm nenhuma ação aqui (inclui as que vieram das atas de reunião).</p><ul class="cal-lista">${pend.slice(0, 10).map(e => `<li><span class="cal-ponto" style="background:#b8620f"></span><span><strong>${fmtData(e.data).slice(0, 5)}</strong> ${esc(e.titulo)}${e.local ? ` <small>(${esc(e.local)})</small>` : ''} <button type="button" class="btn-visit" data-pl="${esc(e.key)}"><i class="fas fa-plus-circle"></i> Planejar</button></span></li>`).join('')}</ul>${pend.length > 10 ? `<p><small>E mais ${pend.length - 10} atividade(s) nos próximos 45 dias.</small></p>` : ''}` : '<p class="vazio">Tudo em dia: nenhuma atividade dos próximos 45 dias está sem comunicação planejada.</p>'}</div>
      ${soltas ? `<p class="tip-box no-print" role="note"><i class="fas fa-info-circle"></i> ${soltas} publicação(ões) anterior(es) ainda não estão no painel (continuam na Lista, sem alteração). <button type="button" class="btn-visit" id="a-org">Organizar no painel</button></p>` : ''}
      <div class="inv-filtros no-print"><div class="form-row"><label for="pa-a">Ano</label><select id="pa-a"><option value="">Todos</option>${anos.map(a => `<option${a === PV.ano ? ' selected' : ''}>${a}</option>`).join('')}</select></div>
        <div class="form-row"><label for="pa-j">Projeto/campanha</label><select id="pa-j">${opt(pj.map(r => [r.id, r.nome]), PV.proj, 'Todos')}</select></div>
        <div class="form-row"><label for="pa-q">Buscar</label><input id="pa-q" type="search" value="${esc(PV.q)}" placeholder="Título ou responsável"></div></div>
      ${vis.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Ação</th>${rs.map(r => `<th>${iconeRede(r)}</th>`).join('')}<th><i class="fas fa-globe" aria-hidden="true"></i> Site (banners)</th><th>Materiais</th><th></th></tr></thead><tbody>${vis.map(a => `<tr><td><strong>${esc(a.tema)}</strong><br><small>${fmtData(a.data)}${a.projeto ? ' · ' + esc(nomeDe(pj, a.projeto)) : ''}${a.resp ? ' · ' + esc(a.resp) : ''}</small></td>${rs.map(r => `<td>${cel(a, r.id)}</td>`).join('')}<td>${celSite(a)}</td><td>${celMat(a)}</td>
        <td><button class="icon-btn" data-ae="${a.id}" aria-label="Editar ${esc(a.tema)}"><i class="fas fa-edit" style="color:var(--accent-color)"></i></button><button class="icon-btn" data-ad="${a.id}" aria-label="Excluir ${esc(a.tema)}"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table></div>` : `<p class="vazio">${as.length ? 'Nenhuma ação com esses filtros.' : 'Nenhuma ação no painel ainda. Use "Nova ação de comunicação".'}</p>`}
      <h4 class="subsection-title"><i class="fas fa-images"></i> Banners do site</h4>
      <p>Cada página do site tem um espaço de banner (Fixo ou Carrossel). Aqui você vê o que está configurado e a quais ações cada banner está ligado; as imagens, medidas e o pacote para publicar ficam na tela <em>Site</em>.</p>
      ${bn ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Página</th><th>Situação (rascunho neste navegador)</th><th>Atualizado</th><th>Ações ligadas</th><th></th></tr></thead><tbody>${bn}</tbody></table></div>` : '<p class="vazio">Nenhum banner novo configurado: todas as páginas mantêm o banner original.</p>'}
      <p class="no-print"><button type="button" class="btn-visit" data-ban=""><i class="fas fa-images"></i> Gerenciar todos os banners do site</button></p>
      ${cfgFormatosHtml()}`;
    $('#a-novo', el).onclick = () => abreAcao('');
    el.querySelectorAll('[data-pl]').forEach(b => b.onclick = () => { const e = pend.find(x => x.key === b.dataset.pl); if (!e) return; const sug = addDia(e.data, -7); abreAcao('', { tema: e.titulo, data: sug < hoje() ? hoje() : sug, evento: { ref: e.key, titulo: e.titulo, data: e.data } }); });
    el.querySelectorAll('[data-ae]').forEach(b => b.onclick = ev => { ev.preventDefault(); abreAcao(b.dataset.ae); });
    el.querySelectorAll('[data-ad]').forEach(b => b.onclick = () => {
      const a = acoes().find(x => x.id === b.dataset.ad); if (!a) return; const n = postsDe(a.id).length;
      if (!confirm(`Excluir a ação "${a.tema}" e as ${n} publicação(ões) ligada(s) a ela?`)) return;
      salvarPosts(posts().filter(p => p.acao !== a.id)); salvarAcoes(acoes().filter(x => x.id !== a.id)); msg = 'Ação excluída.'; draw();
    });
    el.querySelectorAll('[data-ban]').forEach(b => b.onclick = () => irParaBanner(b.dataset.ban));
    const org = $('#a-org', el); if (org) org.onclick = () => { if (!confirm('Agrupar as publicações antigas em ações do painel? Nada é alterado nem apagado: as publicações só passam a ficar ligadas a uma ação.')) return; const n = organizarAntigas(); msg = n < 0 ? 'Sem espaço no navegador para salvar.' : `${n} ação(ões) criada(s) a partir das publicações anteriores.`; draw(); };
    $('#pa-a', el).onchange = e => { PV.ano = e.target.value; draw(); }; $('#pa-j', el).onchange = e => { PV.proj = e.target.value; draw(); };
    $('#pa-q', el).onchange = e => { PV.q = e.target.value.trim(); draw(); };
    $('#ff', el).onsubmit = e => {
      e.preventDefault(); const er = $('#ff-e', el), fm = formatos(), novo = {};
      const rsf = redes().filter(r => r.ativa);
      rsf.forEach(r => { novo[r.id] = [...el.querySelectorAll(`[data-fr="${r.id}"]:checked`)].map(i => i.value); });
      const vazio = rsf.find(r => !novo[r.id].length); if (vazio) { er.textContent = `Marque ao menos um formato para ${vazio.nome}.`; er.hidden = false; return; }
      db.set('com_formatos', { ...fm, ...novo }); msg = 'Formatos de cada canal salvos.'; draw();
    };
  };

  /* ---------- Fila de publicação: o que precisa sair, quando, com tudo à mão (texto para copiar, mídia, medidas) ---------- */
  const FILA = { abrir: '' };
  const icsEsc = x => String(x == null ? '' : x).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const dobra = l => { const o = []; while (l.length > 70) { o.push(l.slice(0, 70)); l = ' ' + l.slice(70); } o.push(l); return o.join('\r\n'); };
  // Agenda (.ics) das publicações pendentes: abre no Google Agenda/Apple/Outlook e avisa no celular às 9h do dia.
  const gerarIcs = () => {
    const rs = redes(), ts = tipos(), agora = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', as = acoes();
    const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Parque Retiro//Comunicacao//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Publicações do Parque Retiro'];
    posts().filter(p => p.status !== 'Publicada' && p.data).forEach(p => {
      const a = p.acao ? as.find(x => x.id === p.acao) : null;
      const desc = [`Canal: ${nomeDe(rs, p.rede)}`, p.tipo ? `Formato: ${nomeDe(ts, p.tipo)}` : '', `Status: ${p.status}`, p.bannerSlug ? `Página do site: ${slotNome(p.bannerSlug)}` : '', p.texto ? `Texto: ${p.texto.slice(0, 400)}` : '', p.midiaLink ? `Mídia: ${p.midiaLink}` : '', a && a.pasta ? `Pasta: ${a.pasta}` : ''].filter(Boolean).join('\n');
      out.push('BEGIN:VEVENT', `UID:${p.id}@parque-retiro`, `DTSTAMP:${agora}`, `DTSTART;VALUE=DATE:${p.data.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${addDia(p.data, 1).replace(/-/g, '')}`, dobra('SUMMARY:' + icsEsc(`Publicar: ${p.tema} (${nomeDe(rs, p.rede)}${p.tipo ? ' - ' + nomeDe(ts, p.tipo) : ''})`)), dobra('DESCRIPTION:' + icsEsc(desc)), 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Hora de publicar', 'TRIGGER:PT9H', 'END:VALARM', 'END:VEVENT');
    });
    out.push('END:VCALENDAR'); return out.join('\r\n');
  };
  const copiar = async t => { try { await navigator.clipboard.writeText(t); return true; } catch (e) { try { const x = document.createElement('textarea'); x.value = t; x.style.position = 'fixed'; x.style.opacity = '0'; document.body.appendChild(x); x.select(); const ok = document.execCommand('copy'); x.remove(); return ok; } catch (e2) { return false; } } };
  R.fila = el => {
    const hj = hoje(), l = posts().filter(p => p.status !== 'Publicada').sort((a, b) => a.data.localeCompare(b.data) || a.tema.localeCompare(b.tema, 'pt-BR')), rs = redes(), ts = tipos(), as = acoes(), pj = projs();
    const lim7 = addDia(hj, 7), lim30 = addDia(hj, 30);
    const blocos = [['Atrasadas', l.filter(p => p.data < hj), '#a31d21'], ['Hoje', l.filter(p => p.data === hj), '#2e7d32'], ['Próximos 7 dias', l.filter(p => p.data > hj && p.data <= lim7), '#2a7ab5'], ['Em até 30 dias', l.filter(p => p.data > lim7 && p.data <= lim30), '#6c7a7b']];
    const depois = l.filter(p => p.data > lim30).length;
    const card = p => {
      const rd = rs.find(x => x.id === p.rede), a = p.acao ? as.find(x => x.id === p.acao) : null, med = medidaPorTipo(p.tipo, p.rede, p.bannerSlug), n = a ? matN(a) : null;
      return `<div class="doc-item" style="border-left:5px solid ${stCor(p.status)};margin:10px 0;padding:10px 14px;background:#fff;border-radius:6px;display:block">
        <div><strong>${esc(p.tema)}</strong> ${badge(p.status)}</div>
        <div><small>${fmtData(p.data)} · ${iconeRede(rd)}${p.tipo ? ' · ' + esc(nomeDe(ts, p.tipo)) : ''}${p.bannerSlug ? ' · página: ' + esc(slotNome(p.bannerSlug)) : ''}${p.projeto ? ' · ' + esc(nomeDe(pj, p.projeto)) : ''}${p.resp ? ' · ' + esc(p.resp) : ''}</small></div>
        ${med ? `<div><small><i class="fas fa-ruler-combined" aria-hidden="true"></i> Medida de referência: ${esc(med)}</small></div>` : ''}
        ${n != null ? `<div><small><i class="fas fa-tasks" aria-hidden="true"></i> Materiais: ${n}/${MATS.length}${n < MATS.length ? ' (incompleto)' : ''}</small></div>` : ''}
        ${p.status === 'Agendada' ? '<div><small><i class="fas fa-clock" aria-hidden="true"></i> Já agendada na ferramenta da rede. Depois que sair no ar, marque como publicada e cole o link.</small></div>' : ''}
        ${p.texto ? `<div style="white-space:pre-wrap;background:#f4f7f8;border-radius:6px;padding:8px;margin:8px 0;max-height:160px;overflow:auto">${esc(p.texto)}</div>` : '<div><small class="vazio">Esta publicação ainda não tem texto.</small></div>'}
        <div class="acoes no-print" style="margin-top:6px">
          ${p.texto ? `<button type="button" class="btn-visit" data-fc="${p.id}"><i class="fas fa-copy"></i> Copiar texto</button> ` : ''}
          ${p.midiaLink && URL_OK(p.midiaLink) ? `<a class="btn-visit" href="${esc(p.midiaLink)}" target="_blank" rel="noopener"><i class="fas fa-photo-video"></i> Abrir mídia</a> ` : ''}
          ${a && a.pasta && URL_OK(a.pasta) ? `<a class="btn-visit" href="${esc(a.pasta)}" target="_blank" rel="noopener"><i class="fas fa-folder-open"></i> Pasta de materiais</a> ` : ''}
          ${p.rede === 'site' && p.bannerSlug ? `<button type="button" class="btn-visit" data-ban="${esc(p.bannerSlug)}"><i class="fas fa-images"></i> Configurar banner</button> ` : ''}
          ${p.acao ? `<button type="button" class="btn-visit" data-pa="${p.acao}"><i class="fas fa-th-large"></i> Abrir no painel</button> ` : ''}
          <select data-fst="${p.id}" aria-label="Status de ${esc(p.tema)}">${STATUS.map(s => `<option${s[0] === p.status ? ' selected' : ''}>${esc(s[0])}</option>`).join('')}</select>
          <button type="button" class="btn-visit" data-fp="${p.id}" style="background:#00838f"><i class="fas fa-check"></i> Marcar como publicada</button></div>
        ${FILA.abrir === p.id ? `<div class="form-reserva no-print" style="margin-top:8px"><div class="form-row"><label for="fp-l">Link da postagem publicada (opcional, mas recomendado)</label><input id="fp-l" type="url" placeholder="https://" value="${esc(p.link || '')}"></div><p class="form-erro" id="fp-e" role="alert" hidden></p><button type="button" class="btn-visit" data-fpok="${p.id}">Confirmar publicação</button> <button type="button" class="btn-visit" data-fpx="1" style="background:#6c7a7b">Cancelar</button></div>` : ''}</div>`;
    };
    el.innerHTML = `<h3><i class="fas fa-paper-plane"></i> Fila de publicação</h3>
      <p>Tudo o que ainda não foi publicado, por data, com o texto pronto para copiar, o link da mídia e a medida de referência. Para Instagram e Facebook você pode programar a postagem na ferramenta da própria rede (Meta Business Suite) e marcar aqui como <strong>Agendada</strong>; depois que sair no ar, marque como <strong>publicada</strong> e cole o link. Este painel organiza e lembra; não publica sozinho nas redes.</p>
      ${aviso()}
      <p class="no-print"><button type="button" class="btn-visit" id="f-ics"><i class="fas fa-calendar-plus"></i> Baixar agenda (.ics) das publicações pendentes</button> <small>Abre no Google Agenda, Apple ou Outlook e avisa no celular às 9h de cada dia de publicação.</small></p>
      ${l.length ? blocos.map(([t, g, c]) => g.length ? `<h4 style="color:${c}">${t} <small>(${g.length})</small></h4>${g.map(card).join('')}` : '').join('') + (depois ? `<p><small>Há ainda ${depois} publicação(ões) previstas para depois de 30 dias (veja na Lista ou no Painel).</small></p>` : '') : '<p class="vazio">Nada pendente: todas as publicações planejadas já foram publicadas.</p>'}`;
    $('#f-ics', el).onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([gerarIcs()], { type: 'text/calendar;charset=utf-8' })); a.download = 'publicacoes-parque-retiro.ics'; a.click(); msg = 'Agenda baixada. Abra o arquivo para importar no seu calendário.'; draw(); };
    el.querySelectorAll('[data-fc]').forEach(b => b.onclick = async () => { const p = posts().find(x => x.id === b.dataset.fc); if (!p) return; msg = (await copiar(p.texto || '')) ? 'Texto copiado. Cole na rede social.' : 'Não foi possível copiar automaticamente; selecione o texto e copie.'; draw(); });
    el.querySelectorAll('[data-ban]').forEach(b => b.onclick = () => irParaBanner(b.dataset.ban));
    el.querySelectorAll('[data-pa]').forEach(b => b.onclick = () => abreAcao(b.dataset.pa));
    el.querySelectorAll('[data-fst]').forEach(s => s.onchange = () => {
      const r = mudaStatus(s.dataset.fst, s.value); const p = posts().find(x => x.id === s.dataset.fst); if (!p) return; msg = r.ok ? `Status alterado para "${p.status}".` : r.motivo; draw();
    });
    el.querySelectorAll('[data-fp]').forEach(b => b.onclick = () => { FILA.abrir = b.dataset.fp; msg = ''; draw(); const i = document.getElementById('fp-l'); if (i) i.focus(); });
    const x = $('[data-fpx]', el); if (x) x.onclick = () => { FILA.abrir = ''; draw(); };
    const ok = $('[data-fpok]', el); if (ok) ok.onclick = () => {
      const lk = $('#fp-l', el).value.trim(), er = $('#fp-e', el); if (lk && !URL_OK(lk)) { er.textContent = 'O link deve começar com http:// ou https://'; er.hidden = false; return; }
      const pl = posts(), p = pl.find(y => y.id === ok.dataset.fpok); if (!p) return;
      p.status = 'Publicada'; p.publicadoPor = me.nome; p.publicadoEm = hoje(); if (lk) p.link = lk; p.editado = hoje(); p.editadoPor = me.nome;
      salvarPosts(pl); FILA.abrir = ''; msg = `"${p.tema}" marcada como publicada.` + (lk ? '' : ' Dica: registre o link da postagem depois.'); draw();
    };
  };

  R.pub = el => {
    const dv = devidas(), b = (v, ic, t, extra) => `<button type="button" class="btn-visit" data-pv="${v}" style="margin:0 8px 8px 0;${PV.view === v ? '' : 'background:#fff;color:var(--accent-color,#2a7ab5);border:1px solid var(--accent-color,#2a7ab5)'}"${PV.view === v ? ' aria-current="true"' : ''}><i class="fas ${ic}"></i> ${t}${extra || ''}</button>`;
    el.innerHTML = `<p class="no-print">${b('painel', 'fa-th-large', 'Painel por canal e formato')}${b('fila', 'fa-paper-plane', 'Fila de publicação', dv ? ` <span class="badge-status" style="background:#a31d21;color:#fff">${dv}</span>` : '')}${b('lista', 'fa-list', 'Lista de publicações')}</p><div id="pub-corpo"></div>`;
    el.querySelectorAll('[data-pv]').forEach(x => x.onclick = () => { PV.view = x.dataset.pv; form = null; acao = null; msg = ''; FILA.abrir = ''; draw(); });
    (PV.view === 'painel' ? R.painel : PV.view === 'fila' ? R.fila : R.lista)($('#pub-corpo', el));
  };

  /* ---------- Cadastros: redes sociais, projetos e tipos de publicação ---------- */
  const catalogo = (el, c) => {
    const l = c.get(), usos = i => posts().filter(p => p[c.campo] === i.id).length;
    el.innerHTML = `<h3><i class="fas ${c.icone}"></i> ${c.titulo}</h3><p>${c.intro}</p>${aviso()}
    <div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Nome</th>${c.visual ? '<th>Ícone</th><th>Cor</th>' : ''}<th>Ativa</th><th>Em uso</th><th></th></tr></thead><tbody>${l.map(i => `<tr><td><input data-id="${i.id}" data-f="nome" maxlength="80" value="${esc(i.nome)}" aria-label="Nome"></td>
      ${c.visual ? `<td><i class="${esc(i.icone)}" style="color:${esc(i.cor)}" aria-hidden="true"></i> <select data-id="${i.id}" data-f="icone" aria-label="Ícone de ${esc(i.nome)}">${ICONES.map(x => `<option value="${x[0]}"${x[0] === i.icone ? ' selected' : ''}>${x[1]}</option>`).join('')}</select></td><td><input type="color" data-id="${i.id}" data-f="cor" value="${esc(i.cor)}" aria-label="Cor de ${esc(i.nome)}"></td>` : ''}
      <td><input type="checkbox" data-id="${i.id}" data-f="ativa"${i.ativa ? ' checked' : ''} aria-label="Ativa"></td><td>${usos(i)} publicação(ões)</td>
      <td>${usos(i) ? '<small>Em uso: desative em vez de excluir</small>' : `<button class="icon-btn" data-rm="${i.id}" aria-label="Excluir ${esc(i.nome)}"><i class="fas fa-trash"></i></button>`}</td></tr>`).join('')}</tbody></table></div>
    <form id="fc" class="form-reserva" novalidate style="margin-top:16px"><div class="form-row"><label for="c-n">${c.novo}</label><input id="c-n" maxlength="80"></div>
      ${c.visual ? `<div class="form-row"><label for="c-i">Ícone</label><select id="c-i">${ICONES.map(x => `<option value="${x[0]}">${x[1]}</option>`).join('')}</select></div><div class="form-row"><label for="c-c">Cor</label><input id="c-c" type="color" value="#2a7ab5"></div>` : ''}
      <p class="form-erro" id="c-e" role="alert" hidden></p><button class="btn-visit"><i class="fas fa-plus-circle"></i> Adicionar</button></form>`;
    el.querySelectorAll('[data-f]').forEach(i => i.onchange = () => {
      const x = c.get(), it = x.find(y => y.id === i.dataset.id); if (!it) return;
      if (i.dataset.f === 'ativa') it.ativa = i.checked; else { it[i.dataset.f] = i.value.trim(); if (i.dataset.f === 'nome' && !it.nome) { msg = 'O nome não pode ficar vazio.'; draw(); return; } }
      db.set(c.chave, x); msg = 'Alteração salva.'; draw();
    });
    el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { if (confirm('Excluir este item?')) { db.set(c.chave, c.get().filter(x => x.id !== b.dataset.rm)); msg = 'Item excluído.'; draw(); } });
    $('#fc', el).onsubmit = e => {
      e.preventDefault(); const n = $('#c-n', el).value.trim().replace(/\s+/g, ' '), er = $('#c-e', el);
      if (!n) { er.textContent = 'Informe o nome.'; er.hidden = false; return; }
      if (c.get().some(x => norm(x.nome) === norm(n))) { er.textContent = 'Já existe um item com esse nome.'; er.hidden = false; return; }
      const x = c.get(); x.push(c.visual ? { id: uid(), nome: n, icone: $('#c-i', el).value, cor: $('#c-c', el).value, ativa: true } : { id: uid(), nome: n, ativa: true });
      db.set(c.chave, x); msg = 'Item adicionado.'; draw();
    };
  };
  R.site = el => { if (!window.PR_BANNERS_ADMIN) { el.innerHTML = '<p class="vazio">Não foi possível carregar o módulo de banners (arquivos banners.js e banners-admin.js).</p>'; return; } window.PR_BANNERS_ADMIN.abrir(el, H); };
  R.redes = el => catalogo(el, { chave: 'com_redes', get: redes, campo: 'rede', icone: 'fa-share-alt', visual: true, titulo: 'Redes sociais', novo: 'Nova rede social', intro: 'Redes usadas pelo Parque. Acrescente novas redes quando precisar; redes desativadas deixam de aparecer nas escolhas, mas as publicações antigas continuam salvas.' });
  R.proj = el => catalogo(el, { chave: 'com_projetos', get: projs, campo: 'projeto', icone: 'fa-flag', titulo: 'Projetos e campanhas', novo: 'Novo projeto ou campanha', intro: 'Cada publicação pode ser ligada a um projeto ou campanha (ex.: Festival de Verão, Dia Internacional da Não Violência).' });
  R.tipos = el => catalogo(el, { chave: 'com_tipos', get: tipos, campo: 'tipo', icone: 'fa-photo-video', titulo: 'Tipos de publicação', novo: 'Novo tipo de publicação', intro: 'Formatos das publicações (post, carrossel, vídeo...). Acrescente outros quando surgirem.' });
  R.emkt = el => { if (!window.PR_COM_EMKT) { el.innerHTML = '<p class="vazio">Não foi possível carregar o e-mail marketing (arquivo com-emailmkt.js).</p>'; return; } window.PR_COM_EMKT.abrir(el, { db, esc, uid, me }); };
  R.brief = el => { if (!window.PR_COM_BRIEFING) { el.innerHTML = '<p class="vazio">Não foi possível carregar o briefing (arquivo com-briefing.js).</p>'; return; } window.PR_COM_BRIEFING.abrir(el, { db, esc, $, uid, me, projs }); };
  R.fixas = el => D.gerirFixas(el, H, true, m => { msg = m; draw(); });

  /* ---------- Estrutura da aba ---------- */
  const SUBS_COLAB = [['colab', 'Minhas publicações'], ['brief', 'Briefing para o Claude']], SUBS_EXTRA = [['equipe', 'Equipe e convidados'], ['arq', 'Arquivos'], ['ind', 'Indicadores'], ['conect', 'Conectores']];
  const subsAtuais = () => !gestor ? SUBS_COLAB : (CB ? SUBS.concat(SUBS_EXTRA) : SUBS);
  const draw = () => {
    root.innerHTML = `<div class="tabs sub no-print" role="tablist">${subsAtuais().map(t => `<button class="tab-btn${t[0] === sub ? ' active' : ''}" data-s="${t[0]}">${esc(t[1])}${t[0] === 'pub' && devidas() ? ` <span class="badge-status" style="background:#a31d21;color:#fff" title="Publicações atrasadas ou para hoje">${devidas()}</span>` : ''}</button>`).join('')}</div><div id="com-sub"></div>`;
    root.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sub = b.dataset.s; form = null; acao = null; msg = ''; draw(); });
    R[sub]($('#com-sub', root));
    if (COL && det && sub !== 'colab') COL.detalhes($('#com-sub', root));
    if (sub === 'fixas' && msg) $('#com-sub', root).insertAdjacentHTML('afterbegin', aviso());
  };
  // Colaboração (Prompt 07): equipe, comentários, tarefas, versões, arquivos, indicadores, conectores.
  const COL = CB ? CB.montar({ me, db, H, RG, gestor, projs, posts, redes, aviso, draw: () => draw(), salvar: salvarPosts, mudaStatus, getDet: () => det, setDet: v => { det = v; }, setMsg: m => { msg = m; } }) : null;
  if (COL) Object.assign(R, COL.R);
  draw();
} };
})();
