// Colaboração da Comunicação (Prompt 07): detalhes da publicação (equipe, histórico, versões, comentários, tarefas),
// Equipe e convidados, Arquivos, Indicadores e Conectores. Montado por comunicacao.js (window.PR_COM_COLAB.montar).
// Dados no navegador (pr_*), como o resto do módulo; as regras de quem pode o quê ficam em com-regras.js.
//   pr_com_comentarios [{id,post,por,email,em,texto}]
//   pr_com_tarefas     [{id,post,texto,resp,prazo,feita,feitaEm,feitaPor,por,em}]
//   pr_com_equipe      convidados/colaboradores (ver com-regras.js)
//   pr_com_arquivos    [{id,nome,tipo,link,origem,direitos,imagem,versoes:[{n,link,em,por,nota}],posts:[ids],por,em,ativo}]
//   pr_com_metricas    [{id,post,indicador,valor,data,fonte,por,em}]
//   pr_com_conectores  [{canal,estado,obs}]  (NUNCA guarda senha, token ou chave)
//   pr_com_config      {autorNaoAprova,pausaGeral}
(function () {
const INDICADORES = [['alcance', 'Alcance (pessoas)'], ['impressoes', 'Impressões'], ['interacoes', 'Interações'], ['cliques', 'Cliques no link'], ['seguidores', 'Novos seguidores'], ['visualizacoes', 'Visualizações de vídeo'], ['inscricoes', 'Inscrições ou presenças atribuídas'], ['respondidas', 'Comentários e mensagens respondidos']];
const TIPOS_ARQ = [['arte', 'Arte / imagem'], ['foto', 'Foto'], ['video', 'Vídeo'], ['texto', 'Texto'], ['outro', 'Outro']];
const TIPOS_CONV = [['aderente1', 'Aderente 1'], ['voluntario', 'Voluntário(a)'], ['mestre', 'Mestre'], ['outro', 'Outro']];
const CANAIS_CONECTOR = [
  { id: 'facebook', nome: 'Facebook (Página)', existe: true, cap: 'Publica e agenda (10 min a 30 dias). Exige permissões da Página e a pessoa com tarefas de conteúdo.' },
  { id: 'instagram', nome: 'Instagram (conta profissional)', existe: true, cap: 'Publica foto, vídeo, carrossel, Reels e Stories. Limite de publicações por API em 24 h; sem agendamento pela API.' },
  { id: 'youtube', nome: 'YouTube', existe: true, cap: 'Envia vídeo (cota própria de 100 envios/dia). Sempre enviado como privado até a aprovação.' },
  { id: 'whatsapp', nome: 'WhatsApp (a ser criado)', existe: false, cap: 'Sem API oficial nesta fase (Prompt 04): modo assistido.' },
  { id: 'tiktok', nome: 'TikTok', existe: false, cap: 'Sem canal do Parque. Só publica ao público após auditoria.' },
  { id: 'linkedin', nome: 'LinkedIn', existe: false, cap: 'Sem canal do Parque. API só para organizações com uso comercial.' },
  { id: 'google', nome: 'Perfil da Empresa no Google', existe: false, cap: 'Sem perfil confirmado. API exige pedido de acesso e perfil verificado há 60+ dias.' }
];
window.PR_COM_COLAB = { INDICADORES, CANAIS_CONECTOR, montar(ctx) {
  const { me, db, H, RG, gestor } = ctx; const { esc, $, uid, hoje, fmtData } = H;
  const admin = me.nivel === 'administrador', agora = () => new Date().toISOString();
  const dh = iso => { try { return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return iso || ''; } };
  const emailOk = e => /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/.test(e);
  const lista = k => db.get(k, []), grava = (k, v) => db.set(k, v);
  const nomeProj = id => { const x = ctx.projs().find(p => p.id === id); return x ? x.nome : (id ? '(removido)' : '-'); };
  const rotuloPapeis = s => [...s].filter(r => RG.PAPEL_ROTULO[r]).map(r => RG.PAPEL_ROTULO[r]).join(', ') || (s.has('gestor') ? 'Gestão' : 'Convidado');
  const lerEmails = t => String(t || '').split(/[,;\s]+/).map(x => x.trim().toLowerCase()).filter(Boolean);

  /* ---------- Detalhes de uma publicação ---------- */
  const detalhes = el => {
    const id = ctx.getDet(); if (!id) return;
    const p = ctx.posts().find(x => x.id === id), r = p ? RG.papeis(me, p, db, agora()) : new Set();
    if (!p || !(gestor || r.size)) { ctx.setDet(''); return; }
    const eq = p.equipe || {}, com = lista('com_comentarios').filter(c => c.post === id), tar = lista('com_tarefas').filter(t => t.post === id);
    const campo = (k, rot) => `<div class="form-row"><label for="dt-${k}">${rot}</label><input id="dt-${k}" value="${esc((eq[k] || []).join(', '))}" placeholder="e-mails separados por vírgula" ${gestor ? '' : 'disabled'}></div>`;
    const hist = (p.hist || []).slice().reverse();
    const html = `<section class="tip-box no-print" id="dt-box" aria-label="Detalhes da publicação" style="margin:12px 0;padding:14px;border-left:5px solid var(--accent-color,#2a7ab5)">
      <h3 style="margin-top:0"><i class="fas fa-search-plus"></i> ${esc(p.tema)} <small>· ${esc(p.status)}</small> <button type="button" class="btn-visit" id="dt-fechar" style="float:right;background:#6c7a7b">Fechar</button></h3>
      <p><small>Seus papéis aqui: <strong>${esc(rotuloPapeis(r))}</strong>.${p.aprovadoPor ? ` Aprovada por <strong>${esc(p.aprovadoPor)}</strong> em ${fmtData(p.aprovadoEm)}${p.versoes && p.aprovadoVersao ? ' (versão ' + ((p.versoes.find(v => v.imp === p.aprovadoVersao) || {}).n || '?') + ')' : ''}.` : ' Ainda sem aprovação registrada.'}</small></p>
      <h4>Equipe desta publicação</h4>${campo('autores', 'Autores')}${campo('revisores', 'Revisores')}${campo('aprovadores', 'Aprovadores')}${campo('publicadores', 'Publicadores')}
      ${gestor ? '<p><button type="button" class="btn-visit" id="dt-eq">Salvar equipe</button> <small>Quem não é gestor só participa se estiver aqui ou tiver convite do projeto.</small></p><p class="form-erro" id="dt-eqe" role="alert" hidden></p>' : ''}
      <h4>Comentários <small>(${com.length})</small></h4>
      ${com.length ? com.map(c => `<div style="margin:6px 0;padding:6px 10px;background:#f4f7f8;border-radius:6px"><small><strong>${esc(c.por)}</strong> · ${esc(dh(c.em))}</small><div style="white-space:pre-wrap">${esc(c.texto)}</div></div>`).join('') : '<p class="vazio">Sem comentários.</p>'}
      <div class="form-row"><label for="dt-ct">Novo comentário</label><textarea id="dt-ct" rows="2" maxlength="1000"></textarea></div><button type="button" class="btn-visit" id="dt-ca">Comentar</button>
      <h4>Tarefas <small>(${tar.filter(t => !t.feita).length} abertas)</small></h4>
      ${tar.length ? `<ul style="list-style:none;padding:0">${tar.map(t => `<li style="margin:4px 0"><label><input type="checkbox" data-tf="${t.id}"${t.feita ? ' checked' : ''}> <span style="${t.feita ? 'text-decoration:line-through;color:#6c7a7b' : ''}">${esc(t.texto)}</span></label> <small>${t.resp ? '· ' + esc(t.resp) : ''}${t.prazo ? ' · até ' + fmtData(t.prazo) : ''}${t.feita ? ' · feita por ' + esc(t.feitaPor || '') : ''}</small></li>`).join('')}</ul>` : '<p class="vazio">Sem tarefas.</p>'}
      <div class="form-row"><label for="dt-tt">Nova tarefa</label><input id="dt-tt" maxlength="200"></div>
      <div class="form-row"><label for="dt-tr">Responsável (nome ou e-mail)</label><input id="dt-tr" maxlength="80"></div>
      <div class="form-row"><label for="dt-tp">Prazo</label><input id="dt-tp" type="date"></div><button type="button" class="btn-visit" id="dt-ta">Criar tarefa</button>
      <h4>Histórico de status</h4>
      ${hist.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Quando</th><th>Quem</th><th>De</th><th>Para</th><th>Motivo</th></tr></thead><tbody>${hist.map(h => `<tr><td>${esc(dh(h.em))}</td><td>${esc(h.por)}</td><td>${esc(h.de || '-')}</td><td>${esc(h.para)}</td><td>${esc(h.motivo || '')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="vazio">Nenhuma mudança de status registrada desde que o controle foi ligado.</p>'}
      <h4>Versões <small>(${(p.versoes || []).length})</small></h4>
      ${(p.versoes || []).length ? (p.versoes || []).slice().reverse().map(v => `<details><summary>Versão ${v.n} · ${esc(dh(v.em))} · ${esc(v.por)}${v.imp === p.aprovadoVersao ? ' · <strong>aprovada</strong>' : ''}</summary><div style="white-space:pre-wrap;background:#f4f7f8;border-radius:6px;padding:8px"><strong>${esc(v.tema)}</strong>\n${esc(v.texto)}${v.midiaLink ? '\nMídia: ' + esc(v.midiaLink) : ''}${v.temImg ? '\n(com imagem anexada)' : ''}</div></details>`).join('') : '<p class="vazio">As versões passam a ser guardadas a partir da próxima gravação.</p>'}
    </section>`;
    el.insertAdjacentHTML('afterbegin', html);
    $('#dt-fechar', el).onclick = () => { ctx.setDet(''); ctx.draw(); };
    const eqb = $('#dt-eq', el); if (eqb) eqb.onclick = () => {
      const l = ctx.posts(), q = l.find(x => x.id === id), er = $('#dt-eqe', el); const nv = {};
      for (const k of ['autores', 'revisores', 'aprovadores', 'publicadores']) { nv[k] = lerEmails($('#dt-' + k, el).value); if (nv[k].some(e => !emailOk(e))) { er.textContent = 'Há e-mail inválido em ' + k + '.'; er.hidden = false; return; } }
      q.equipe = nv; q.editado = hoje(); q.editadoPor = me.nome; ctx.salvar(l); ctx.setMsg('Equipe da publicação salva.'); ctx.draw();
    };
    $('#dt-ca', el).onclick = () => { const t = $('#dt-ct', el).value.trim(); if (!t) return; const l = lista('com_comentarios'); l.push({ id: uid(), post: id, por: me.nome, email: me.email, em: agora(), texto: t }); grava('com_comentarios', l); ctx.draw(); };
    $('#dt-ta', el).onclick = () => { const t = $('#dt-tt', el).value.trim(); if (!t) return; const l = lista('com_tarefas'); l.push({ id: uid(), post: id, texto: t, resp: $('#dt-tr', el).value.trim(), prazo: $('#dt-tp', el).value, feita: false, por: me.nome, em: agora() }); grava('com_tarefas', l); ctx.draw(); };
    el.querySelectorAll('[data-tf]').forEach(c => c.onchange = () => { const l = lista('com_tarefas'), t = l.find(x => x.id === c.dataset.tf); if (!t) return; t.feita = c.checked; t.feitaEm = c.checked ? agora() : ''; t.feitaPor = c.checked ? me.nome : ''; grava('com_tarefas', l); ctx.draw(); });
  };
  const botaoDet = p => `<button type="button" class="btn-visit" data-pdet="${p.id}" style="background:#455a64"><i class="fas fa-comments"></i> Detalhes</button>`;
  const ligaBotoesDet = el => el.querySelectorAll('[data-pdet]').forEach(b => b.onclick = () => { ctx.setDet(b.dataset.pdet); ctx.setMsg(''); ctx.draw(); window.scrollTo(0, 0); });

  /* ---------- Modo colaborador: só as publicações em que a pessoa tem papel ---------- */
  const colab = el => {
    const ps = RG.visiveis(me, ctx.posts(), db, agora()).sort((a, b) => a.data.localeCompare(b.data)), rs = ctx.redes();
    const opcoes = p => RG.ORDEM.filter(s => s === p.status || RG.podeMudar(me, p, s, db, agora()).ok);
    el.innerHTML = `<h3><i class="fas fa-user-friends"></i> Minhas publicações</h3>
      <p>Aqui aparecem só as publicações em que você tem um papel (autor, revisor, aprovador, publicador) ou que pertencem ao projeto do seu convite. Você pode comentar, criar tarefas e mudar o status quando o seu papel permitir.</p>
      ${ctx.aviso()}
      ${ps.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Data</th><th>Rede</th><th>Tema</th><th>Projeto</th><th>Seu papel</th><th>Status</th><th></th></tr></thead><tbody>${ps.map(p => `<tr><td>${fmtData(p.data)}</td><td>${esc((rs.find(r => r.id === p.rede) || {}).nome || p.rede)}</td><td><strong>${esc(p.tema)}</strong></td><td>${esc(nomeProj(p.projeto))}</td><td>${esc(rotuloPapeis(RG.papeis(me, p, db, agora())))}</td><td><select data-cst="${p.id}" aria-label="Status de ${esc(p.tema)}">${opcoes(p).map(s => `<option${s === p.status ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select></td><td>${botaoDet(p)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="vazio">Nenhuma publicação para você no momento.</p>'}`;
    el.querySelectorAll('[data-cst]').forEach(s => s.onchange = () => ctx.mudaStatus(s.dataset.cst, s.value));
    ligaBotoesDet(el); detalhes(el);
  };

  /* ---------- Equipe e convidados ---------- */
  const equipe = el => {
    const c = RG.cfg(db), cv = lista('com_equipe'), pj = ctx.projs().filter(x => x.ativa !== false);
    el.innerHTML = `<h3><i class="fas fa-user-shield"></i> Equipe e convidados</h3>
      <p>Quem pode revisar, aprovar e publicar. Além do administrador e do Responsável pela Comunicação, você designa pessoas <strong>por publicação</strong> (botão Detalhes) ou <strong>por convite de projeto</strong>, aqui. Aderentes 1 e voluntários entram só com autorização prévia de um administrador, com prazo.</p>
      ${ctx.aviso()}
      <div class="tip-box"><strong>Regras de aprovação</strong>
        <div class="form-row"><label><input type="checkbox" id="eq-an"${c.autorNaoAprova ? ' checked' : ''}${admin ? '' : ' disabled'}> Quem criou a publicação não pode aprová-la (recomendado quando houver dois ou mais aprovadores)</label></div>
        <div class="form-row"><label><input type="checkbox" id="eq-pg"${c.pausaGeral ? ' checked' : ''}${admin ? '' : ' disabled'}> <strong>Pausar toda publicação automática</strong> (interruptor de emergência dos conectores)</label></div>
        ${admin ? '' : '<small>Só administrador altera estas regras.</small>'}
        <p><small>Importante: nesta cópia de teste as regras valem pela tela. Só passam a proteger de verdade quando o servidor aplicar o mesmo código a cada alteração.</small></p></div>
      <h4>Convites e colaboradores</h4>
      ${cv.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Pessoa</th><th>Tipo</th><th>Papéis</th><th>Projetos</th><th>Válido até</th><th>Autorizado por</th><th>Situação</th><th></th></tr></thead><tbody>${cv.map(x => { const venc = x.ate && x.ate < hoje(); return `<tr><td>${esc(x.nome || '')}<br><small>${esc(x.email)}</small></td><td>${esc((TIPOS_CONV.find(t => t[0] === x.tipo) || [0, x.tipo])[1])}</td><td>${esc((x.papeis || []).map(r => RG.PAPEL_ROTULO[r] || r).join(', ') || '-')}</td><td>${esc((x.projetos || []).map(nomeProj).join(', ') || '-')}</td><td>${x.ate ? fmtData(x.ate) : 'sem prazo'}</td><td>${esc(x.autorizadoPor || '')}<br><small>${x.autorizadoEm ? fmtData(x.autorizadoEm) : ''}</small></td><td>${x.ativo === false ? 'Desligado' : venc ? 'Vencido' : 'Vigente'}</td><td>${admin ? `<button type="button" class="btn-visit" data-cv="${x.id}" style="background:#6c7a7b">${x.ativo === false ? 'Reativar' : 'Desligar'}</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="vazio">Nenhum convite.</p>'}
      ${admin ? `<h4>Novo convite</h4><form id="eq-f" class="form-reserva">
        <div class="form-row"><label for="eq-e">E-mail (o mesmo da conta na área restrita) *</label><input id="eq-e" type="email" required></div>
        <div class="form-row"><label for="eq-n">Nome</label><input id="eq-n" maxlength="80"></div>
        <div class="form-row"><label for="eq-t">Tipo</label><select id="eq-t">${TIPOS_CONV.map(t => `<option value="${t[0]}">${t[1]}</option>`).join('')}</select></div>
        <fieldset><legend>Papéis *</legend>${RG.PAPEIS.map(r => `<label style="margin-right:12px"><input type="checkbox" name="eq-p" value="${r}"> ${RG.PAPEL_ROTULO[r]}</label>`).join('')}</fieldset>
        <div class="form-row"><label for="eq-j">Projetos ou campanhas (segure Ctrl para vários) *</label><select id="eq-j" multiple size="4">${pj.map(x => `<option value="${esc(x.id)}">${esc(x.nome)}</option>`).join('')}</select></div>
        <div class="form-row"><label for="eq-a">Válido até *</label><input id="eq-a" type="date" required></div>
        <label><input type="checkbox" id="eq-ok"> Confirmo que esta pessoa foi autorizada previamente pelo Instituto</label>
        <p class="form-erro" id="eq-er" role="alert" hidden></p><button class="btn-visit btn-large">Autorizar convite</button></form>` : '<p><small>Só administrador cria ou desliga convites.</small></p>'}
      <p><small>A pessoa precisa ter conta aprovada na área restrita para entrar. Convidado vê somente as publicações dos projetos do convite, nunca listas de e-mail, atas ou administrativo.</small></p>`;
    const a = $('#eq-an', el), g = $('#eq-pg', el);
    if (a && admin) a.onchange = () => { const k = RG.cfg(db); k.autorNaoAprova = a.checked; grava('com_config', k); ctx.setMsg('Regra atualizada.'); ctx.draw(); };
    if (g && admin) g.onchange = () => { const k = RG.cfg(db); k.pausaGeral = g.checked; grava('com_config', k); ctx.setMsg(g.checked ? 'Publicação automática PAUSADA.' : 'Pausa desligada.'); ctx.draw(); };
    el.querySelectorAll('[data-cv]').forEach(b => b.onclick = () => { const l = lista('com_equipe'), x = l.find(y => y.id === b.dataset.cv); if (!x) return; x.ativo = x.ativo === false; grava('com_equipe', l); ctx.setMsg('Convite atualizado.'); ctx.draw(); });
    const f = $('#eq-f', el); if (f) f.onsubmit = e => {
      e.preventDefault(); const er = $('#eq-er', el), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
      const email = $('#eq-e', el).value.trim().toLowerCase(), papeis = [...el.querySelectorAll('[name=eq-p]:checked')].map(i => i.value), projetos = [...$('#eq-j', el).selectedOptions].map(o => o.value), ate = $('#eq-a', el).value;
      if (!emailOk(email)) return falha('Informe um e-mail válido.'); if (!papeis.length) return falha('Marque ao menos um papel.'); if (!projetos.length) return falha('Escolha ao menos um projeto.');
      if (!ate || ate < hoje()) return falha('Informe uma validade futura.'); if (!$('#eq-ok', el).checked) return falha('Confirme a autorização prévia.');
      const l = lista('com_equipe'); l.push({ id: uid(), email, nome: $('#eq-n', el).value.trim(), tipo: $('#eq-t', el).value, papeis, projetos, ate, autorizadoPor: me.nome, autorizadoEm: hoje(), ativo: true });
      grava('com_equipe', l); ctx.setMsg('Convite autorizado.'); ctx.draw();
    };
  };

  /* ---------- Arquivos (catálogo) ---------- */
  const arq = el => {
    const ar = lista('com_arquivos'), ps = ctx.posts();
    el.innerHTML = `<h3><i class="fas fa-folder-open"></i> Arquivos</h3>
      <p>Catálogo único das artes, fotos, vídeos e textos finais, com versão, origem e autorização de uso. <strong>Por enquanto guarda o link</strong> (Google Drive ou outro) e não o arquivo em si, porque o navegador guarda pouco; com o servidor, os arquivos passam a ficar numa pasta protegida do Parque.</p>
      ${ctx.aviso()}
      ${ar.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Arquivo</th><th>Tipo</th><th>Versão</th><th>Origem e direitos</th><th>Imagem de pessoas</th><th>Usado em</th><th></th></tr></thead><tbody>${ar.map(x => { const v = (x.versoes || []).slice(-1)[0] || {}; return `<tr><td><strong>${esc(x.nome)}</strong>${x.ativo === false ? ' <small>(arquivado)</small>' : ''}<br>${v.link && /^https?:\/\//i.test(v.link) ? `<a href="${esc(v.link)}" target="_blank" rel="noopener">abrir</a>` : ''}</td><td>${esc((TIPOS_ARQ.find(t => t[0] === x.tipo) || [0, x.tipo])[1])}</td><td>v${(x.versoes || []).length}<br><small>${v.em ? fmtData(v.em.slice(0, 10)) : ''}</small></td><td>${esc(x.origem || '-')}<br><small>${esc(x.direitos || 'sem informação de direitos')}</small></td><td>${esc({ sim: 'Autorizada', nao: 'SEM autorização', na: 'Não se aplica' }[x.imagem] || '-')}</td><td>${esc((x.posts || []).map(i => (ps.find(p => p.id === i) || {}).tema || '(removida)').join(', ') || '-')}</td><td><button type="button" class="btn-visit" data-av="${x.id}" style="background:#455a64">Nova versão</button> <button type="button" class="btn-visit" data-aa="${x.id}" style="background:#6c7a7b">${x.ativo === false ? 'Reativar' : 'Arquivar'}</button></td></tr>`; }).join('')}</tbody></table></div>` : '<p class="vazio">Nenhum arquivo cadastrado.</p>'}
      <h4>Cadastrar arquivo</h4><form id="ar-f" class="form-reserva">
        <div class="form-row"><label for="ar-n">Nome *</label><input id="ar-n" maxlength="120" required></div>
        <div class="form-row"><label for="ar-t">Tipo</label><select id="ar-t">${TIPOS_ARQ.map(t => `<option value="${t[0]}">${t[1]}</option>`).join('')}</select></div>
        <div class="form-row"><label for="ar-l">Link do arquivo (Drive ou outro) *</label><input id="ar-l" type="url" placeholder="https://" required></div>
        <div class="form-row"><label for="ar-o">Origem (quem criou, de onde veio)</label><input id="ar-o" maxlength="120"></div>
        <div class="form-row"><label for="ar-d">Direitos e licença (obrigatório para material de terceiros)</label><input id="ar-d" maxlength="160"></div>
        <div class="form-row"><label for="ar-i">Aparecem pessoas na imagem?</label><select id="ar-i"><option value="na">Não se aplica</option><option value="sim">Sim, com autorização de uso</option><option value="nao">Sim, SEM autorização</option></select></div>
        <div class="form-row"><label for="ar-p">Publicações que usam (opcional; Ctrl para várias)</label><select id="ar-p" multiple size="4">${ps.slice().sort((a, b) => b.data.localeCompare(a.data)).slice(0, 60).map(p => `<option value="${esc(p.id)}">${fmtData(p.data)} · ${esc(p.tema)}</option>`).join('')}</select></div>
        <p class="form-erro" id="ar-e" role="alert" hidden></p><button class="btn-visit btn-large">Cadastrar</button></form>`;
    el.querySelector('#ar-f').onsubmit = e => {
      e.preventDefault(); const er = $('#ar-e', el), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
      const nome = $('#ar-n', el).value.trim(), link = $('#ar-l', el).value.trim(); if (!nome) return falha('Informe o nome.'); if (!/^https?:\/\//i.test(link)) return falha('O link deve começar com http:// ou https://');
      const l = lista('com_arquivos'); l.push({ id: uid(), nome, tipo: $('#ar-t', el).value, origem: $('#ar-o', el).value.trim(), direitos: $('#ar-d', el).value.trim(), imagem: $('#ar-i', el).value, posts: [...$('#ar-p', el).selectedOptions].map(o => o.value), versoes: [{ n: 1, link, em: agora(), por: me.nome, nota: 'versão inicial' }], por: me.nome, em: agora(), ativo: true });
      grava('com_arquivos', l); ctx.setMsg('Arquivo cadastrado.'); ctx.draw();
    };
    el.querySelectorAll('[data-av]').forEach(b => b.onclick = () => { const link = prompt('Novo link desta versão (https://...)'); if (!link) return; if (!/^https?:\/\//i.test(link)) { ctx.setMsg('O link deve começar com http:// ou https://'); ctx.draw(); return; } const nota = prompt('O que mudou nesta versão? (opcional)') || ''; const l = lista('com_arquivos'), x = l.find(y => y.id === b.dataset.av); x.versoes.push({ n: x.versoes.length + 1, link, em: agora(), por: me.nome, nota }); grava('com_arquivos', l); ctx.setMsg('Nova versão registrada; a anterior continua guardada.'); ctx.draw(); });
    el.querySelectorAll('[data-aa]').forEach(b => b.onclick = () => { const l = lista('com_arquivos'), x = l.find(y => y.id === b.dataset.aa); x.ativo = x.ativo === false; grava('com_arquivos', l); ctx.draw(); });
  };

  /* ---------- Indicadores (painel) ---------- */
  const ind = el => {
    const m = lista('com_metricas'), ps = ctx.posts(), rs = ctx.redes();
    const nomeP = id => { const p = ps.find(x => x.id === id); return p ? p.tema : '(removida)'; };
    const porCanal = {}, porCamp = {};
    m.forEach(x => { const p = ps.find(y => y.id === x.post); if (!p) return; const k = x.indicador, v = Number(x.valor) || 0; (porCanal[p.rede] = porCanal[p.rede] || {})[k] = ((porCanal[p.rede] || {})[k] || 0) + v; (porCamp[p.projeto || ''] = porCamp[p.projeto || ''] || {})[k] = ((porCamp[p.projeto || ''] || {})[k] || 0) + v; });
    const usados = INDICADORES.filter(i => m.some(x => x.indicador === i[0]));
    const tabela = (obj, nomeDe) => Object.keys(obj).length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th></th>${usados.map(i => `<th>${esc(i[1])}</th>`).join('')}</tr></thead><tbody>${Object.keys(obj).map(k => `<tr><td><strong>${esc(nomeDe(k))}</strong></td>${usados.map(i => `<td>${obj[k][i[0]] != null ? obj[k][i[0]] : '-'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="vazio">Sem números ainda.</p>';
    const pub = ps.filter(p => p.status === 'Publicada').sort((a, b) => b.data.localeCompare(a.data));
    el.innerHTML = `<h3><i class="fas fa-chart-line"></i> Indicadores</h3>
      <p>Painel dos resultados das publicações. <strong>Por enquanto os números são digitados à mão</strong> (copie do painel de estatísticas da própria rede). Quando um conector estiver ligado, ele preencherá o que a API da rede permitir; o que ela não entregar continua manual. Medimos o conjunto, não pessoas.</p>
      ${ctx.aviso()}
      <h4>Por canal</h4>${tabela(porCanal, id => (rs.find(r => r.id === id) || { nome: id }).nome)}
      <h4>Por projeto ou campanha</h4>${tabela(porCamp, id => nomeProj(id))}
      <p><small>E-mail: as métricas do Comunicado por e-mail continuam em “Listas de e-mail”.</small></p>
      <h4>Registrar números</h4>${pub.length ? `<form id="in-f" class="form-reserva">
        <div class="form-row"><label for="in-p">Publicação (só as já publicadas) *</label><select id="in-p">${pub.slice(0, 80).map(p => `<option value="${esc(p.id)}">${fmtData(p.data)} · ${esc(p.tema)}</option>`).join('')}</select></div>
        <div class="form-row"><label for="in-i">Indicador *</label><select id="in-i">${INDICADORES.map(i => `<option value="${i[0]}">${esc(i[1])}</option>`).join('')}</select></div>
        <div class="form-row"><label for="in-v">Valor *</label><input id="in-v" type="number" min="0" step="1" required></div>
        <div class="form-row"><label for="in-d">Data da leitura</label><input id="in-d" type="date" value="${hoje()}"></div>
        <p class="form-erro" id="in-e" role="alert" hidden></p><button class="btn-visit btn-large">Registrar</button></form>` : '<p class="vazio">Marque ao menos uma publicação como Publicada para registrar números.</p>'}
      ${m.length ? `<h4>Registros</h4><div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Data</th><th>Publicação</th><th>Indicador</th><th>Valor</th><th>Fonte</th><th>Quem</th></tr></thead><tbody>${m.slice().reverse().slice(0, 100).map(x => `<tr><td>${fmtData(x.data)}</td><td>${esc(nomeP(x.post))}</td><td>${esc((INDICADORES.find(i => i[0] === x.indicador) || [0, x.indicador])[1])}</td><td>${esc(x.valor)}</td><td>${esc(x.fonte)}</td><td>${esc(x.por)}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
    const f = $('#in-f', el); if (f) f.onsubmit = e => {
      e.preventDefault(); const er = $('#in-e', el), v = $('#in-v', el).value; if (v === '' || Number(v) < 0) { er.textContent = 'Informe um valor igual ou maior que zero.'; er.hidden = false; return; }
      const l = lista('com_metricas'); l.push({ id: uid(), post: $('#in-p', el).value, indicador: $('#in-i', el).value, valor: Number(v), data: $('#in-d', el).value || hoje(), fonte: 'manual', por: me.nome, em: agora() });
      grava('com_metricas', l); ctx.setMsg('Números registrados.'); ctx.draw();
    };
  };

  /* ---------- Conectores (informação; nenhuma conta conectada) ---------- */
  const conect = el => {
    const cs = lista('com_conectores'), c = RG.cfg(db), est = id => (cs.find(x => x.canal === id) || {}).estado || (CANAIS_CONECTOR.find(x => x.id === id).existe ? 'desligado' : 'sem conta');
    el.innerHTML = `<h3><i class="fas fa-plug"></i> Conectores</h3>
      <p>Ligação direta com as redes. <strong>Nenhuma conta está conectada.</strong> Cada conector nasce desligado e só pode ser ligado com autorização expressa do Instituto e com o servidor guardando as chaves (chaves e senhas nunca ficam neste navegador nem nesta tela). Enquanto estiver desligado, vale o modo assistido: a Fila de publicação.</p>
      ${ctx.aviso()}
      ${c.pausaGeral ? '<p class="alert-box" style="background:#f6dede;padding:10px;border-radius:6px"><strong>Publicação automática pausada por um administrador.</strong></p>' : ''}
      <div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Canal</th><th>Situação</th><th>O que a API permite (resumo verificado em 16/10/2026)</th></tr></thead><tbody>${CANAIS_CONECTOR.map(x => `<tr><td><strong>${esc(x.nome)}</strong></td><td>${esc(est(x.id))}</td><td>${esc(x.cap)}</td></tr>`).join('')}</tbody></table></div>
      <h4>Regras que o servidor aplicará antes de qualquer publicação automática</h4>
      <ul><li>Só publica a <strong>versão exata que foi aprovada</strong>; se o texto mudou depois, a publicação volta para aprovação.</li><li>Só com o conector do canal <strong>ligado</strong> e sem a pausa geral.</li><li>YouTube sempre como <strong>privado</strong> até a aprovação.</li><li>Nenhum anúncio pago: o conector não cria nem impulsiona campanhas.</li></ul>
      <p><small>Especificação técnica em <code>docs/CONECTORES.md</code>; código de referência e testes em <code>conectores/</code>.</small></p>`;
  };

  return { detalhes, botaoDet, ligaBotoesDet, R: { colab, equipe, arq, ind, conect } };
} };
})();
