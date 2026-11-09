// Grupos de Discussão por tema (área restrita, Comissões Parque Retiro). Dados no navegador (chaves pr_grupos, pr_grupos_itens e pr_grupos_bkp_<SIGLA>).
// Substitui, aos poucos, o uso do WhatsApp para conversar, votar enquetes, confirmar presença e aprovar publicações.
// Regras decididas pelo responsável: qualquer Mestre (qualquer pessoa com conta aprovada) cria grupos; a entrada é por convite de quem criou
// (ou do Administrador); a publicação nas redes e no Blogger só segue depois que o grupo aprovar, com prazo de 72 horas contado desde o
// lançamento; passado o prazo, se a maioria dos votos não for "aprovo" (ou ninguém votou), a publicação é CANCELADA.
// Limites (sem servidor): cada navegador só enxerga o que ele mesmo gravou, então as mensagens de várias pessoas só se juntam com o servidor;
// a publicação direta nas redes e no Blogger exige conectar contas externas (não ativado): o site entrega o texto aprovado pronto e os atalhos.
// Backup por sigla: a cada alteração o site guarda uma cópia do grupo em pr_grupos_bkp_<SIGLA> (entra no backup geral) e o criador ou o
// Administrador baixa o arquivo. A gravação automática na pasta de dados do servidor fica para quando houver servidor.
(function () {
const HORAS = 72, REACOES = ['👍', '❤️', '🙏', '👏'];
const DESTINOS = [['Instagram', 'https://www.instagram.com/parqueretirorio/'], ['Facebook', 'https://www.facebook.com/parqueretiro/'], ['YouTube', 'https://www.youtube.com/@parquedeestudoereflexaoret6772'], ['Blogger', 'blogger.html'], ['Site do Parque', 'index.html']];
const PRES = [['presencial', 'Presencial'], ['virtual', 'Virtual'], ['talvez', 'Ainda não sei'], ['nao', 'Não vou']];
const ST_PUB = { votando: 'Em votação', aprovada: 'Aprovada pelo grupo', cancelada: 'Cancelada', publicada: 'Publicada' };

window.PR_GRUPOS = { HORAS, abrir(me, root, H) {
  const { db, esc, uid, fmtData } = H;
  const eu = String(me.email || '').toLowerCase(), adm = me.nivel === 'administrador';
  let gSel = null, aba = 'conversa', msg = '', erro = '', novo = false, cita = null, tick = null;
  const grupos = () => db.get('grupos', []), itens = () => db.get('grupos_itens', []);
  const iso = () => new Date().toISOString();
  const dh = s => { const d = new Date(s); if (isNaN(d)) return ''; const p = x => String(x).padStart(2, '0'); return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  const nomeDe = em => { const u = db.get('users', []).find(x => String(x.email).toLowerCase() === String(em).toLowerCase()); return u ? u.nome : em; };
  const ehMembro = g => (g.membros || []).includes(eu) || g.criador === eu;
  const gestor = g => adm || g.criador === eu;
  const visiveis = () => grupos().filter(g => adm || ehMembro(g));
  const falha = m => { erro = m; msg = ''; const e = root.querySelector('.form-erro'); if (e) { e.textContent = m; e.hidden = false; } else draw(); }; // erro na própria tela, sem apagar o digitado
  const backup = g => { // cópia por sigla (ex.: pr_grupos_bkp_MPR); não apaga nada, só substitui a cópia anterior do mesmo grupo
    try { db.set('grupos_bkp_' + g.sigla, { grupo: g, itens: itens().filter(i => i.g === g.id), salvoEm: iso() }); } catch (e) { /* sem espaço: o aviso aparece ao baixar */ }
  };
  const salvaItens = (l, g) => { if (!db.set('grupos_itens', l)) { falha('Não foi possível salvar neste navegador (espaço cheio?).'); return false; } if (g) backup(g); return true; };
  const add = (g, it) => { const l = itens(); l.push({ id: uid(), g: g.id, autor: eu, nome: me.nome, em: iso(), ...it }); return salvaItens(l, g); };
  const mud = (g, id, fn) => { const l = itens(), it = l.find(x => x.id === id && x.g === g.id); if (!it) return false; fn(it); return salvaItens(l, g); };
  const resolve = g => { // fecha as publicações cujo prazo de 72 h acabou
    const l = itens(); let mudou = false;
    l.filter(i => i.g === g.id && i.tipo === 'pub' && i.status === 'votando' && Date.now() >= Date.parse(i.prazo)).forEach(i => {
      const v = Object.values(i.votos || {}), sim = v.filter(x => x === 'sim').length, nao = v.filter(x => x === 'nao').length;
      i.status = sim > nao ? 'aprovada' : 'cancelada'; i.resolvida = iso(); i.motivo = v.length === 0 ? 'ninguém votou no prazo' : (sim > nao ? sim + ' a favor, ' + nao + ' contra' : 'sem maioria a favor (' + sim + ' a favor, ' + nao + ' contra)'); mudou = true;
    });
    if (mudou) salvaItens(l, g);
  };

  // Aviso aos membros: o site monta o texto e os atalhos (e-mail com cópia oculta e conversa de WhatsApp com cada pessoa); quem envia é a pessoa.
  const avisoTxt = (g, p, fase) => fase === 'abre'
    ? `Grupo "${g.nome}" (Parque Retiro): há uma publicação para votar: "${p.titulo}". Entre na área restrita > Grupos de Discussão > Publicações e vote "aprovo" ou "não aprovo" até ${dh(p.prazo)} (${HORAS} horas). Sem maioria a favor ou sem votos até lá, a publicação é cancelada.`
    : `Grupo "${g.nome}" (Parque Retiro): a publicação "${p.titulo}" foi ${p.status === 'cancelada' ? 'CANCELADA (' + (p.motivo || '') + ')' : 'APROVADA pelo grupo (' + (p.motivo || '') + ')'}.`;
  const avisoHtml = (g, p, fase) => {
    const txt = avisoTxt(g, p, fase), us = db.get('users', []), ms = (g.membros || []).map(e => us.find(u => String(u.email).toLowerCase() === e)).filter(Boolean);
    const emails = ms.map(u => u.email).filter(e => e !== me.email), assunto = (fase === 'abre' ? 'Votação aberta: ' : 'Resultado da votação: ') + p.titulo;
    return `<details class="no-print"><summary><i class="fas fa-bell"></i> Avisar os membros (${fase === 'abre' ? 'votação aberta' : 'resultado'})</summary>
      <p style="white-space:pre-wrap">${esc(txt)}</p>
      <p><a class="btn-visit" href="mailto:?bcc=${encodeURIComponent(emails.join(','))}&subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(txt)}"><i class="fas fa-envelope"></i> Avisar por e-mail</a>
      <button class="btn-visit" data-cpa="${esc(p.id)}" data-fase="${fase}"><i class="fas fa-copy"></i> Copiar texto (para o grupo de WhatsApp)</button></p>
      <p>Por WhatsApp, pessoa a pessoa: ${ms.filter(u => u.email !== me.email && zapDig(u.whatsapp).length >= 10).map(u => `<a class="btn-visit" target="_blank" rel="noopener" href="https://wa.me/${esc(zapDig(u.whatsapp).length <= 11 ? '55' + zapDig(u.whatsapp) : zapDig(u.whatsapp))}?text=${encodeURIComponent(txt)}">${esc(String(u.nome).split(' ')[0])}</a>`).join(' ') || '<em>nenhum membro com WhatsApp cadastrado</em>'}</p>
      <p><small>O site não envia sozinho: o e-mail e o WhatsApp abrem prontos para você enviar. O envio automático depende de servidor.</small></p></details>`;
  };
  const zapDig = v => String(v || '').replace(/\D/g, '');

  const lista = () => {
    visiveis().forEach(resolve);
    const vs = visiveis(), usuarios = db.get('users', []).filter(u => (u.status || 'aprovado') === 'aprovado' && u.email && String(u.email).toLowerCase() !== eu);
    root.innerHTML = `<h3><i class="fas fa-comments"></i> Grupos de Discussão</h3>
    <p>Grupos por tema para conversar, votar enquetes, confirmar presença e aprovar publicações. Qualquer Mestre pode criar um grupo; a entrada é por convite de quem criou.</p>
    ${msg ? `<p class="tip-box" role="status">${esc(msg)}</p>` : ''}
    <p><button class="btn-visit" id="g-novo"><i class="fas fa-plus-circle"></i> ${novo ? 'Fechar' : 'Criar grupo'}</button></p>
    ${novo ? `<form id="g-f" class="form-reserva" novalidate><h4>Novo grupo</h4>
      <div class="form-row"><label for="g-n">Nome do grupo *</label><input id="g-n" maxlength="60" placeholder="Ex.: Mestres do Parque Retiro"></div>
      <div class="form-row"><label for="g-s">Sigla do backup *</label><input id="g-s" maxlength="10" placeholder="Ex.: MPR" style="text-transform:uppercase"><small>Serve só para nomear o arquivo de backup do grupo (já sugerida pelo nome). O nome do grupo pode ser o que você quiser. 2 a 10 letras ou números; não muda depois.</small></div>
      <div class="form-row"><label for="g-d">Tema ou finalidade</label><input id="g-d" maxlength="200"></div>
      <fieldset class="funcoes"><legend>Convidar pessoas agora (você pode convidar depois)</legend>${usuarios.length ? usuarios.map(u => `<label><input type="checkbox" name="gm" value="${esc(String(u.email).toLowerCase())}"> ${esc(u.nome)}</label>`).join('') : '<p class="vazio">Ainda não há outras pessoas cadastradas.</p>'}</fieldset>
      <p class="form-erro" id="g-er" role="alert"${erro ? '' : ' hidden'}>${esc(erro)}</p><button class="btn-visit btn-large"><i class="fas fa-check"></i> Criar grupo</button></form>` : ''}
    <h4>Seus grupos</h4>${vs.length ? `<div class="content-grid">${vs.map(g => `<div class="card"><h3>${esc(g.nome)}</h3><p>${esc(g.descricao || '')}</p><p><small>${(g.membros || []).length} membro(s) · criado por ${esc(nomeDe(g.criador))}</small></p><button class="btn-visit" data-abre="${g.id}">Abrir</button></div>`).join('')}</div>` : '<p class="vazio">Você ainda não participa de nenhum grupo. Crie um ou peça um convite.</p>'}`;
    root.querySelector('#g-novo').onclick = () => { novo = !novo; erro = ''; draw(); };
    root.querySelectorAll('[data-abre]').forEach(b => b.onclick = () => { gSel = b.dataset.abre; aba = 'conversa'; msg = ''; erro = ''; draw(); });
    const f = root.querySelector('#g-f');
    if (f) { // sugere a sigla pelas iniciais do nome, enquanto a pessoa não escrever a dela
      let mexeu = false; const sg = f.querySelector('#g-s'), nm = f.querySelector('#g-n');
      sg.oninput = () => { mexeu = true; };
      nm.oninput = () => { if (mexeu) return; const ini = nm.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(w => w.length > 2 || /^[A-Za-z]/.test(w)).map(w => w[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); let c = ini, k = 2; while (c && grupos().some(g => g.sigla === c)) c = ini + (k++); sg.value = c; };
    }
    if (f) f.onsubmit = e => {
      e.preventDefault();
      const n = f.querySelector('#g-n').value.trim().replace(/\s+/g, ' '), sg = f.querySelector('#g-s').value.trim().toUpperCase(), d = f.querySelector('#g-d').value.trim();
      if (!n) return falha('Informe o nome do grupo.');
      if (!/^[A-Z0-9]{2,10}$/.test(sg)) return falha('A sigla precisa ter de 2 a 10 letras ou números, sem espaço.');
      if (grupos().some(g => g.sigla === sg)) return falha('Já existe um grupo com a sigla ' + sg + '. Escolha outra.');
      const ms = [...f.querySelectorAll('[name=gm]:checked')].map(i => i.value);
      const g = { id: uid(), nome: n, sigla: sg, descricao: d, criador: eu, criadorNome: me.nome, criado: iso(), membros: [eu, ...ms] };
      const l = grupos(); l.push(g); if (!db.set('grupos', l)) return falha('Não foi possível salvar neste navegador.');
      backup(g); novo = false; erro = ''; gSel = g.id; aba = 'conversa'; msg = 'Grupo criado.'; draw();
    };
  };

  const ETIQ = ['Importante', 'Decisão', 'Pendente', 'Concluído'];
  let fBusca = '', fEtiq = '', fEstrela = false;
  const mencao = (t, g) => { let h = esc(t); (g.membros || []).forEach(e => { const n = nomeDe(e), pr = String(n).split(' ')[0]; if (pr) h = h.split('@' + esc(pr)).join('<mark>@' + esc(pr) + '</mark>'); }); return h; };
  const bolha = (g, i, todos) => {
    const cit = i.resp ? todos.find(x => x.id === i.resp) : null, rs = i.reacoes || {}, vistos = Object.keys(i.vistos || {}).filter(e => e !== i.autor);
    const cont = REACOES.map(r => [r, Object.values(rs).filter(x => x === r).length]).filter(x => x[1]);
    const estr = (i.estrelas || {})[eu];
    return `<div class="card" style="margin:8px 0;${i.fixa ? 'border-left:4px solid #b08d2b;' : ''}"><small><strong>${esc(i.nome || nomeDe(i.autor))}</strong> · ${dh(i.em)}${i.editada ? ' · editada' : ''}${i.fixa ? ' · <i class="fas fa-thumbtack"></i> fixada' : ''}${i.encaminhada ? ' · <i class="fas fa-share"></i> encaminhada de ' + esc(i.de || '') : ''}${i.etiqueta ? ` · <span class="badge st-pendente">${esc(i.etiqueta)}</span>` : ''}</small>
      ${cit ? `<blockquote style="margin:6px 0;padding:4px 8px;border-left:3px solid #ccc"><small>${esc(cit.nome || '')}: ${esc(cit.apagada ? 'mensagem apagada' : String(cit.texto || '').slice(0, 120))}</small></blockquote>` : ''}
      <p style="white-space:pre-wrap;margin:6px 0">${i.apagada ? '<em>Mensagem apagada.</em>' : mencao(i.texto, g)}</p>
      ${i.anexo ? `<p><a href="${esc(i.anexo.dados)}" download="${esc(i.anexo.nome)}"><i class="fas fa-paperclip"></i> ${esc(i.anexo.nome)}</a> <small>(${Math.round(i.anexo.tam / 1024)} KB)</small></p>` : ''}
      ${i.apagada ? '' : `<p class="no-print" style="margin:0">${REACOES.map(r => `<button class="btn-visit" style="padding:2px 8px;${rs[eu] === r ? 'outline:2px solid #2d7' : ''}" data-re="${i.id}" data-r="${r}" aria-label="Reagir ${r}">${r}${(cont.find(c => c[0] === r) || [0, ''])[1] || ''}</button>`).join(' ')}
        <button class="btn-visit" data-ci="${i.id}"><i class="fas fa-reply"></i> Responder</button>
        <button class="btn-visit" data-es="${i.id}" aria-label="Favoritar"><i class="${estr ? 'fas' : 'far'} fa-star"></i></button>
        <button class="btn-visit" data-en="${i.id}"><i class="fas fa-share"></i> Encaminhar</button>
        ${i.autor === eu ? `<button class="btn-visit" data-ed="${i.id}"><i class="fas fa-edit"></i> Editar</button>` : ''}
        ${gestor(g) ? `<button class="btn-visit" data-fx="${i.id}"><i class="fas fa-thumbtack"></i> ${i.fixa ? 'Desafixar' : 'Fixar'}</button>` : ''}
        ${gestor(g) || i.autor === eu ? `<select data-et="${i.id}" aria-label="Etiqueta"><option value="">Etiqueta…</option>${ETIQ.map(e => `<option${i.etiqueta === e ? ' selected' : ''}>${e}</option>`).join('')}</select>` : ''}
        ${i.autor === eu || adm ? `<button class="btn-visit" data-ap="${i.id}"><i class="fas fa-trash"></i> Apagar</button>` : ''}</p>
        ${i.autor === eu && vistos.length ? `<small>Visto por ${vistos.length}: ${esc(vistos.map(nomeDe).join(', '))}</small>` : ''}`}</div>`;
  };
  const lerArquivo = (f, ok, no) => { if (!f) return ok(null); if (f.size > 150 * 1024) return no('O anexo pode ter até 150 KB. Para arquivos maiores, cole um link na mensagem.'); const r = new FileReader(); r.onload = () => ok({ nome: f.name, tam: f.size, dados: r.result }); r.onerror = () => no('Não foi possível ler o arquivo.'); r.readAsDataURL(f); };

  const conversa = (g, el) => {
    const todos = itens().filter(i => i.g === g.id), ms0 = todos.filter(i => i.tipo === 'msg');
    // confirmação de leitura: marca como vista pela pessoa (só grava quando muda)
    const novas = ms0.filter(i => !i.apagada && i.autor !== eu && !(i.vistos || {})[eu]);
    if (novas.length && ehMembro(g)) { const l = itens(); l.forEach(i => { if (novas.some(n => n.id === i.id)) { i.vistos = i.vistos || {}; i.vistos[eu] = iso(); } }); db.set('grupos_itens', l); }
    const q = fBusca.toLowerCase();
    const ms = ms0.filter(i => (!q || String(i.texto || '').toLowerCase().includes(q) || String(i.nome || '').toLowerCase().includes(q)) && (!fEtiq || i.etiqueta === fEtiq) && (!fEstrela || (i.estrelas || {})[eu]));
    const fix = ms0.filter(i => i.fixa && !i.apagada), podeEscrever = gestor(g) || !g.soAvisos, rap = g.rapidas || [];
    el.innerHTML = `${g.saudacao ? `<div class="tip-box" role="note"><strong><i class="fas fa-hand-sparkles"></i> Sobre este grupo</strong><p style="white-space:pre-wrap;margin:4px 0">${esc(g.saudacao)}</p></div>` : ''}
      ${g.soAvisos ? '<p class="tip-box"><i class="fas fa-bullhorn"></i> Grupo de avisos: só o criador e o Administrador enviam mensagens. Todos podem reagir, favoritar e encaminhar.</p>' : ''}
      ${fix.length ? `<div class="tip-box"><strong><i class="fas fa-thumbtack"></i> Fixadas</strong>${fix.map(i => `<p style="margin:4px 0">${esc(i.texto)} <small>— ${esc(i.nome)}</small></p>`).join('')}</div>` : ''}
      <form id="f-f" class="form-reserva no-print" novalidate style="display:flex;gap:6px;flex-wrap:wrap;align-items:end"><div class="form-row"><label for="f-b">Buscar na conversa</label><input id="f-b" value="${esc(fBusca)}"></div>
        <div class="form-row"><label for="f-e">Etiqueta</label><select id="f-e"><option value="">Todas</option>${ETIQ.map(e => `<option${fEtiq === e ? ' selected' : ''}>${e}</option>`).join('')}</select></div>
        <div class="form-row"><label><input type="checkbox" id="f-s"${fEstrela ? ' checked' : ''}> Só favoritas</label></div><button class="btn-visit"><i class="fas fa-search"></i> Filtrar</button></form>
      ${ms.length ? ms.map(i => bolha(g, i, todos)).join('') : '<p class="vazio">' + (ms0.length ? 'Nenhuma mensagem com esse filtro.' : 'Nenhuma mensagem ainda. Comece a conversa.') + '</p>'}
      ${podeEscrever ? `<form id="m-f" class="form-reserva" novalidate>${cita ? `<p class="tip-box">Respondendo a: ${esc((ms0.find(x => x.id === cita) || {}).texto || '')} <button type="button" class="btn-visit" id="m-x">Cancelar resposta</button></p>` : ''}
      <div class="form-row"><label for="m-t">Mensagem (use @Nome para mencionar)</label><textarea id="m-t" rows="3" maxlength="2000"></textarea></div>
      ${rap.length ? `<div class="form-row"><label for="m-r">Resposta rápida</label><select id="m-r"><option value="">Escolher…</option>${rap.map((r, k) => `<option value="${k}">${esc(r.atalho)}</option>`).join('')}</select></div>` : ''}
      <div class="form-row"><label for="m-a">Anexo (opcional, até 150 KB)</label><input id="m-a" type="file"></div>
      <p class="form-erro" id="m-er" role="alert"${erro ? '' : ' hidden'}>${esc(erro)}</p><button class="btn-visit"><i class="fas fa-paper-plane"></i> Enviar</button></form>` : ''}`;
    const ff = el.querySelector('#f-f'); ff.onsubmit = e => { e.preventDefault(); fBusca = el.querySelector('#f-b').value.trim(); fEtiq = el.querySelector('#f-e').value; fEstrela = el.querySelector('#f-s').checked; draw(); };
    const mf = el.querySelector('#m-f');
    if (mf) {
      mf.onsubmit = e => { e.preventDefault(); const t = el.querySelector('#m-t').value.trim(), arq = el.querySelector('#m-a').files[0]; if (!t && !arq) return falha('Escreva a mensagem ou escolha um anexo.');
        lerArquivo(arq, a => { erro = ''; if (add(g, { tipo: 'msg', texto: t, resp: cita || '', ...(a ? { anexo: a } : {}) })) { cita = null; draw(); } }, falha); };
      const r = el.querySelector('#m-r'); if (r) r.onchange = () => { if (r.value === '') return; const t = el.querySelector('#m-t'); t.value = (t.value ? t.value + '\n' : '') + rap[+r.value].texto; r.value = ''; };
      const x = el.querySelector('#m-x'); if (x) x.onclick = () => { cita = null; draw(); };
    }
    el.querySelectorAll('[data-ci]').forEach(b => b.onclick = () => { cita = b.dataset.ci; draw(); });
    el.querySelectorAll('[data-re]').forEach(b => b.onclick = () => { if (mud(g, b.dataset.re, it => { it.reacoes = it.reacoes || {}; if (it.reacoes[eu] === b.dataset.r) delete it.reacoes[eu]; else it.reacoes[eu] = b.dataset.r; })) draw(); });
    el.querySelectorAll('[data-es]').forEach(b => b.onclick = () => { if (mud(g, b.dataset.es, it => { it.estrelas = it.estrelas || {}; if (it.estrelas[eu]) delete it.estrelas[eu]; else it.estrelas[eu] = true; })) draw(); });
    el.querySelectorAll('[data-et]').forEach(b => b.onchange = () => { if (mud(g, b.dataset.et, it => { it.etiqueta = b.value; })) draw(); });
    el.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { const it = itens().find(x => x.id === b.dataset.ed); const t = prompt('Editar a mensagem:', it.texto); if (t === null) return; if (!t.trim()) return falha('A mensagem não pode ficar vazia.'); if (mud(g, b.dataset.ed, x => { x.texto = t.trim(); x.editada = true; })) draw(); });
    el.querySelectorAll('[data-en]').forEach(b => b.onclick = () => {
      const outros = grupos().filter(x => x.id !== g.id && ehMembro(x)); if (!outros.length) return falha('Você não participa de outro grupo para encaminhar.');
      const nome = prompt('Encaminhar para qual grupo? Digite o nome exato:\n' + outros.map(x => '- ' + x.nome).join('\n'), outros[0].nome); if (nome === null) return;
      const dest = outros.find(x => x.nome.toLowerCase() === nome.trim().toLowerCase()); if (!dest) return falha('Grupo não encontrado entre os seus.');
      const it = itens().find(x => x.id === b.dataset.en); if (add(dest, { tipo: 'msg', texto: it.texto, anexo: it.anexo, encaminhada: true, de: g.nome })) { msg = 'Mensagem encaminhada para ' + dest.nome + '.'; draw(); }
    });
    el.querySelectorAll('[data-fx]').forEach(b => b.onclick = () => { if (mud(g, b.dataset.fx, it => { it.fixa = !it.fixa; })) draw(); });
    el.querySelectorAll('[data-ap]').forEach(b => b.onclick = () => { if (!confirm('Apagar esta mensagem?')) return; if (mud(g, b.dataset.ap, it => { it.apagada = true; it.texto = ''; it.fixa = false; delete it.anexo; })) draw(); });
  };

  const ajustes = (g, el) => { // saudação, grupo de avisos e respostas rápidas (como no WhatsApp Business)
    const rap = g.rapidas || [];
    el.innerHTML = `<p class="tip-box" role="note">Recursos no estilo do WhatsApp Business, só dentro da área restrita. Não há ligação com o WhatsApp.</p>
    <form id="a-f" class="form-reserva" novalidate>
      <div class="form-row"><label for="a-s">Saudação e regras do grupo (aparece no topo da conversa)</label><textarea id="a-s" rows="4" maxlength="1000">${esc(g.saudacao || '')}</textarea></div>
      <div class="form-row"><label><input type="checkbox" id="a-v"${g.soAvisos ? ' checked' : ''}> Grupo de avisos: só o criador e o Administrador enviam mensagens</label></div>
      <p class="form-erro" id="a-er" role="alert" hidden></p><button class="btn-visit"><i class="fas fa-save"></i> Salvar ajustes</button></form>
    <h4>Respostas rápidas</h4><p>Textos prontos que qualquer membro insere na conversa.</p>
    <ul>${rap.length ? rap.map((r, k) => `<li><strong>${esc(r.atalho)}</strong>: ${esc(r.texto)} <button class="btn-visit" data-rr="${k}">Remover</button></li>`).join('') : '<li class="vazio">Nenhuma ainda.</li>'}</ul>
    <form id="r-f" class="form-reserva" novalidate><div class="form-row"><label for="r-a">Nome do atalho *</label><input id="r-a" maxlength="40" placeholder="Ex.: Convite da reunião"></div><div class="form-row"><label for="r-t">Texto *</label><textarea id="r-t" rows="3" maxlength="500"></textarea></div><p class="form-erro" id="r-er" role="alert" hidden></p><button class="btn-visit"><i class="fas fa-plus"></i> Adicionar</button></form>`;
    const grava = fn => { const l = grupos(), x = l.find(y => y.id === g.id); fn(x); if (db.set('grupos', l)) { backup(x); return true; } return false; };
    el.querySelector('#a-f').onsubmit = e => { e.preventDefault(); if (grava(x => { x.saudacao = el.querySelector('#a-s').value.trim(); x.soAvisos = el.querySelector('#a-v').checked; })) { msg = 'Ajustes salvos.'; draw(); } };
    el.querySelector('#r-f').onsubmit = e => { e.preventDefault(); const a = el.querySelector('#r-a').value.trim(), t = el.querySelector('#r-t').value.trim(); if (!a || !t) { const er = el.querySelector('#r-er'); er.textContent = 'Informe o atalho e o texto.'; er.hidden = false; return; } if (grava(x => { x.rapidas = [...(x.rapidas || []), { atalho: a, texto: t }]; })) draw(); };
    el.querySelectorAll('[data-rr]').forEach(b => b.onclick = () => { if (grava(x => { x.rapidas = (x.rapidas || []).filter((_, k) => k !== +b.dataset.rr); })) draw(); });
  };

  const enquetes = (g, el) => {
    const ps = itens().filter(i => i.g === g.id && i.tipo === 'enquete').reverse();
    el.innerHTML = `<form id="q-f" class="form-reserva" novalidate><h4>Nova enquete</h4>
      <div class="form-row"><label for="q-p">Pergunta *</label><input id="q-p" maxlength="200"></div>
      <div class="form-row"><label for="q-o">Opções * (uma por linha, de 2 a 10)</label><textarea id="q-o" rows="4" maxlength="800" placeholder="Sábado 14\nDomingo 15"></textarea></div>
      <div class="form-row"><label><input type="checkbox" id="q-m"> Permitir marcar mais de uma opção</label></div>
      <p class="form-erro" id="q-er" role="alert"${erro ? '' : ' hidden'}>${esc(erro)}</p><button class="btn-visit"><i class="fas fa-poll"></i> Publicar enquete</button></form>
    ${ps.length ? ps.map(p => { const v = p.votos || {}, tot = Object.keys(v).length; return `<div class="card" style="margin:10px 0"><h4>${esc(p.pergunta)}${p.encerrada ? ' <span class="badge">encerrada</span>' : ''}</h4><small>por ${esc(p.nome)} · ${dh(p.em)} · ${tot} participante(s)</small>
      ${p.opcoes.map((o, k) => { const n = Object.values(v).filter(a => a.includes(k)).length, quem = Object.entries(v).filter(([, a]) => a.includes(k)).map(([e]) => nomeDe(e)); return `<p style="margin:6px 0"><label><input type="${p.multipla ? 'checkbox' : 'radio'}" name="v-${p.id}" value="${k}"${(v[eu] || []).includes(k) ? ' checked' : ''}${p.encerrada ? ' disabled' : ''}> ${esc(o)}</label> — <strong>${n}</strong>${quem.length ? ' <small>(' + esc(quem.join(', ')) + ')</small>' : ''}</p>`; }).join('')}
      ${p.encerrada ? '' : `<button class="btn-visit" data-vq="${p.id}">Registrar meu voto</button> ${gestor(g) || p.autor === eu ? `<button class="btn-visit" data-eq="${p.id}">Encerrar enquete</button>` : ''}`}</div>`; }).join('') : '<p class="vazio">Nenhuma enquete ainda.</p>'}`;
    el.querySelector('#q-f').onsubmit = e => {
      e.preventDefault(); const q = el.querySelector('#q-p').value.trim(), os = el.querySelector('#q-o').value.split('\n').map(x => x.trim()).filter(Boolean);
      if (!q) return falha('Escreva a pergunta.'); if (os.length < 2 || os.length > 10) return falha('Informe de 2 a 10 opções, uma por linha.');
      erro = ''; if (add(g, { tipo: 'enquete', pergunta: q, opcoes: os, multipla: el.querySelector('#q-m').checked, votos: {}, encerrada: false })) draw();
    };
    el.querySelectorAll('[data-vq]').forEach(b => b.onclick = () => { const sel = [...el.querySelectorAll(`[name="v-${b.dataset.vq}"]:checked`)].map(i => +i.value); if (!sel.length) return falha('Marque ao menos uma opção.'); if (mud(g, b.dataset.vq, it => { it.votos = it.votos || {}; it.votos[eu] = sel; })) { msg = 'Voto registrado.'; draw(); } });
    el.querySelectorAll('[data-eq]').forEach(b => b.onclick = () => { if (mud(g, b.dataset.eq, it => { it.encerrada = true; })) draw(); });
  };

  const presenca = (g, el) => {
    const ps = itens().filter(i => i.g === g.id && i.tipo === 'presenca').reverse();
    el.innerHTML = `<form id="p-f" class="form-reserva" novalidate><h4>Nova confirmação de presença</h4>
      <div class="form-row"><label for="p-t">Encontro *</label><input id="p-t" maxlength="120" placeholder="Ex.: Reunião de Escola"></div>
      <div class="form-row"><label for="p-d">Data *</label><input id="p-d" type="date"></div>
      <p class="form-erro" id="p-er" role="alert"${erro ? '' : ' hidden'}>${esc(erro)}</p><button class="btn-visit"><i class="fas fa-user-check"></i> Abrir confirmação</button></form>
    ${ps.length ? ps.map(p => { const r = p.respostas || {}; return `<div class="card" style="margin:10px 0"><h4>${esc(p.titulo)} — ${esc(fmtData(p.data))}</h4><small>aberta por ${esc(p.nome)}</small>
      <p>${PRES.map(([k, t]) => `<button class="btn-visit" style="${r[eu] === k ? 'outline:2px solid #2d7' : ''}" data-pr="${p.id}" data-k="${k}">${t}</button>`).join(' ')}</p>
      ${PRES.map(([k, t]) => { const q = Object.entries(r).filter(([, v]) => v === k).map(([e]) => nomeDe(e)); return `<p style="margin:4px 0"><strong>${t}</strong> (${q.length})${q.length ? ': ' + esc(q.join(', ')) : ''}</p>`; }).join('')}</div>`; }).join('') : '<p class="vazio">Nenhuma confirmação aberta.</p>'}`;
    el.querySelector('#p-f').onsubmit = e => { e.preventDefault(); const t = el.querySelector('#p-t').value.trim(), d = el.querySelector('#p-d').value; if (!t || !d) return falha('Informe o encontro e a data.'); erro = ''; if (add(g, { tipo: 'presenca', titulo: t, data: d, respostas: {} })) draw(); };
    el.querySelectorAll('[data-pr]').forEach(b => b.onclick = () => { if (mud(g, b.dataset.pr, it => { it.respostas = it.respostas || {}; it.respostas[eu] = b.dataset.k; })) draw(); });
  };

  const publicar = (g, el) => {
    resolve(g);
    const ps = itens().filter(i => i.g === g.id && i.tipo === 'pub').reverse();
    el.innerHTML = `<p class="tip-box" role="note"><i class="fas fa-info-circle"></i> Toda publicação precisa da aprovação do grupo: os membros têm <strong>${HORAS} horas</strong> para votar. Passado o prazo, se a maioria dos votos não for "aprovo" (ou ninguém votar), a publicação é <strong>cancelada</strong>. A publicação direta nas redes e no Blogger ainda não está ativada: depois da aprovação o site entrega o texto pronto e os atalhos.</p>
    <form id="b-f" class="form-reserva" novalidate><h4>Propor publicação</h4>
      <div class="form-row"><label for="b-t">Título *</label><input id="b-t" maxlength="120"></div>
      <div class="form-row"><label for="b-x">Texto *</label><textarea id="b-x" rows="5" maxlength="3000"></textarea></div>
      <div class="form-row"><label for="b-l">Link de imagem ou vídeo (opcional, https)</label><input id="b-l" type="url" maxlength="300"></div>
      <fieldset class="funcoes"><legend>Onde publicar *</legend>${DESTINOS.map(([n]) => `<label><input type="checkbox" name="bd" value="${esc(n)}"> ${esc(n)}</label>`).join('')}</fieldset>
      <p class="form-erro" id="b-er" role="alert"${erro ? '' : ' hidden'}>${esc(erro)}</p><button class="btn-visit"><i class="fas fa-vote-yea"></i> Lançar para votação (${HORAS} h)</button></form>
    ${ps.length ? ps.map(p => { const v = p.votos || {}, sim = Object.values(v).filter(x => x === 'sim').length, nao = Object.values(v).filter(x => x === 'nao').length;
      return `<div class="card" style="margin:10px 0"><h4>${esc(p.titulo)} <span class="badge">${ST_PUB[p.status] || p.status}</span></h4>
      <small>proposta por ${esc(p.nome)} · ${dh(p.em)} · destinos: ${esc((p.destinos || []).join(', '))}</small>
      ${p.status === 'votando' ? avisoHtml(g, p, 'abre') : (p.status === 'aprovada' || p.status === 'cancelada') ? avisoHtml(g, p, 'res') : ''}
      <p style="white-space:pre-wrap">${esc(p.texto)}</p>${p.link ? `<p><a href="${esc(p.link)}" target="_blank" rel="noopener">Imagem ou vídeo</a></p>` : ''}
      <p><strong>Aprovo:</strong> ${sim} · <strong>Não aprovo:</strong> ${nao}${Object.keys(v).length ? ' <small>(' + esc(Object.entries(v).map(([e, x]) => nomeDe(e) + ': ' + (x === 'sim' ? 'aprovo' : 'não aprovo')).join('; ')) + ')</small>' : ''}</p>
      ${p.status === 'votando' ? `<p><i class="fas fa-hourglass-half"></i> Votação aberta (${HORAS} h), encerra em ${dh(p.prazo)}.</p><p><button class="btn-visit" data-vp="${p.id}" data-v="sim"${v[eu] === 'sim' ? ' style="outline:2px solid #2d7"' : ''}>Aprovo</button> <button class="btn-visit" data-vp="${p.id}" data-v="nao"${v[eu] === 'nao' ? ' style="outline:2px solid #c33"' : ''}>Não aprovo</button></p>` : ''}
      ${p.status === 'cancelada' ? `<p class="vazio">Cancelada: ${esc(p.motivo || '')}. Nada foi publicado.</p>` : ''}
      ${p.status === 'aprovada' ? `<p class="tip-box">Aprovada (${esc(p.motivo || '')}). Publique manualmente: copie o texto e use os atalhos.</p><p><button class="btn-visit" data-cp="${p.id}"><i class="fas fa-copy"></i> Copiar texto</button> ${(p.destinos || []).map(n => { const d = DESTINOS.find(x => x[0] === n); return d ? `<a class="btn-visit" href="${esc(d[1])}" target="_blank" rel="noopener">${esc(n)}</a>` : ''; }).join(' ')} <button class="btn-visit" data-mp="${p.id}">Marcar como publicada</button></p>` : ''}
      ${p.status === 'publicada' ? `<p class="vazio">Marcada como publicada por ${esc(nomeDe(p.publicadaPor || ''))} em ${dh(p.publicadaEm)}.</p>` : ''}</div>`; }).join('') : '<p class="vazio">Nenhuma publicação proposta.</p>'}`;
    el.querySelector('#b-f').onsubmit = e => {
      e.preventDefault(); const t = el.querySelector('#b-t').value.trim(), x = el.querySelector('#b-x').value.trim(), l = el.querySelector('#b-l').value.trim(), ds = [...el.querySelectorAll('[name=bd]:checked')].map(i => i.value);
      if (!t || !x) return falha('Informe o título e o texto.'); if (!ds.length) return falha('Escolha ao menos um destino.'); if (l && !/^https:\/\//i.test(l)) return falha('O link precisa começar com https://');
      erro = ''; if (add(g, { tipo: 'pub', titulo: t, texto: x, link: l, destinos: ds, votos: {}, status: 'votando', prazo: new Date(Date.now() + HORAS * 3600000).toISOString() })) { msg = 'Publicação lançada. O grupo tem ' + HORAS + ' horas para votar.'; draw(); }
    };
    el.querySelectorAll('[data-cpa]').forEach(b => b.onclick = () => { const p = itens().find(i => i.id === b.dataset.cpa); try { navigator.clipboard.writeText(avisoTxt(g, p, b.dataset.fase)); msg = 'Texto do aviso copiado.'; } catch (e) { msg = 'Não foi possível copiar: selecione o texto à mão.'; } draw(); });
    el.querySelectorAll('[data-vp]').forEach(b => b.onclick = () => { if (mud(g, b.dataset.vp, it => { if (it.status !== 'votando' || Date.now() >= Date.parse(it.prazo)) return; it.votos = it.votos || {}; it.votos[eu] = b.dataset.v; })) draw(); });
    el.querySelectorAll('[data-cp]').forEach(b => b.onclick = () => { const p = itens().find(i => i.id === b.dataset.cp); try { navigator.clipboard.writeText(p.titulo + '\n\n' + p.texto + (p.link ? '\n' + p.link : '')); msg = 'Texto copiado.'; } catch (e) { msg = 'Não foi possível copiar: selecione o texto à mão.'; } draw(); });
    el.querySelectorAll('[data-mp]').forEach(b => b.onclick = () => { if (mud(g, b.dataset.mp, it => { it.status = 'publicada'; it.publicadaPor = eu; it.publicadaEm = iso(); })) draw(); });
  };

  const membros = (g, el) => {
    const ms = g.membros || [], outros = db.get('users', []).filter(u => (u.status || 'aprovado') === 'aprovado' && u.email && !ms.includes(String(u.email).toLowerCase()));
    el.innerHTML = `<h4>Membros (${ms.length})</h4><ul>${ms.map(e => `<li>${esc(nomeDe(e))}${e === g.criador ? ' <small>(criou o grupo)</small>' : ''}${gestor(g) && e !== g.criador ? ` <button class="btn-visit" data-rm="${esc(e)}">Remover</button>` : ''}${e === eu && e !== g.criador ? ` <button class="btn-visit" data-sai="1">Sair do grupo</button>` : ''}</li>`).join('')}</ul>
    ${gestor(g) ? `<h4>Convidar</h4>${outros.length ? `<p><select id="c-s">${outros.map(u => `<option value="${esc(String(u.email).toLowerCase())}">${esc(u.nome)}</option>`).join('')}</select> <button class="btn-visit" id="c-b">Convidar</button></p>` : '<p class="vazio">Todas as pessoas cadastradas já estão no grupo.</p>'}` : ''}
    <h4>Resumo do grupo</h4>${(() => { const it = itens().filter(i => i.g === g.id), ms2 = it.filter(i => i.tipo === 'msg' && !i.apagada), pb = it.filter(i => i.tipo === 'pub'); return `<p>${ms2.length} mensagem(ns) · ${it.filter(i => i.tipo === 'enquete').length} enquete(s) · ${it.filter(i => i.tipo === 'presenca').length} confirmação(ões) de presença · publicações: ${pb.filter(i => i.status === 'aprovada' || i.status === 'publicada').length} aprovada(s), ${pb.filter(i => i.status === 'cancelada').length} cancelada(s), ${pb.filter(i => i.status === 'votando').length} em votação.</p><p><small>Mensagens por pessoa: ${esc((g.membros || []).map(e => nomeDe(e) + ' ' + ms2.filter(i => i.autor === e).length).join(' · '))}</small></p>`; })()}
    <h4>Backup do grupo (sigla ${esc(g.sigla)})</h4><p>O site guarda uma cópia automática do grupo no navegador (chave <code>pr_grupos_bkp_${esc(g.sigla)}</code>, incluída no backup geral). A gravação automática na pasta de dados do servidor entra quando houver servidor.</p>
    ${gestor(g) ? '<p><button class="btn-visit" id="b-dl"><i class="fas fa-download"></i> Baixar backup do grupo (JSON)</button></p>' : '<p class="vazio">O backup para download é do criador do grupo e do Administrador.</p>'}`;
    el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { if (!confirm('Remover esta pessoa do grupo? O histórico dela continua.')) return; const l = grupos(); const x = l.find(y => y.id === g.id); x.membros = x.membros.filter(m => m !== b.dataset.rm); if (db.set('grupos', l)) { backup(x); draw(); } });
    el.querySelectorAll('[data-sai]').forEach(b => b.onclick = () => { if (!confirm('Sair deste grupo?')) return; const l = grupos(); const x = l.find(y => y.id === g.id); x.membros = x.membros.filter(m => m !== eu); if (db.set('grupos', l)) { backup(x); gSel = null; draw(); } });
    const cb = el.querySelector('#c-b'); if (cb) cb.onclick = () => { const l = grupos(), x = l.find(y => y.id === g.id), em = el.querySelector('#c-s').value; if (!x.membros.includes(em)) x.membros.push(em); if (db.set('grupos', l)) { backup(x); msg = 'Convite feito: a pessoa já vê o grupo.'; draw(); } };
    const dl = el.querySelector('#b-dl'); if (dl) dl.onclick = () => {
      const dados = { grupo: grupos().find(y => y.id === g.id), itens: itens().filter(i => i.g === g.id), baixadoEm: iso(), baixadoPor: eu };
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })); a.download = 'grupo-' + g.sigla + '-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); a.remove();
    };
  };

  const interno = () => {
    const g = grupos().find(x => x.id === gSel);
    if (!g || !(adm || ehMembro(g))) { gSel = null; return lista(); }
    const ABAS = [['conversa', 'fa-comment-dots', 'Conversa'], ['enquetes', 'fa-poll', 'Enquetes'], ['presenca', 'fa-user-check', 'Presença'], ['publicar', 'fa-bullhorn', 'Publicações'], ['membros', 'fa-users-cog', 'Membros e backup']].concat(gestor(g) ? [['ajustes', 'fa-cog', 'Ajustes']] : []);
    root.innerHTML = `<p><button class="btn-visit" id="g-volta"><i class="fas fa-arrow-left"></i> Todos os grupos</button></p>
    <h3><i class="fas fa-comments"></i> ${esc(g.nome)}</h3><p>${esc(g.descricao || '')}</p>
    ${ehMembro(g) ? '' : '<p class="tip-box">Você vê este grupo como Administrador, sem ser membro: para escrever ou votar, convide a si mesmo na aba Membros.</p>'}
    ${msg ? `<p class="tip-box" role="status">${esc(msg)}</p>` : ''}
    <div class="tabs sub" role="tablist">${ABAS.map(a => `<button class="tab-btn${aba === a[0] ? ' active' : ''}" data-ga="${a[0]}"><i class="fas ${a[1]}"></i> ${a[2]}</button>`).join('')}</div><div id="g-c"></div>`;
    root.querySelector('#g-volta').onclick = () => { gSel = null; msg = ''; erro = ''; draw(); };
    root.querySelectorAll('[data-ga]').forEach(b => b.onclick = () => { aba = b.dataset.ga; msg = ''; erro = ''; draw(); });
    const c = root.querySelector('#g-c'), pode = ehMembro(g);
    if (aba !== 'membros' && !pode) { c.innerHTML = '<p class="vazio">Só membros participam. Veja a aba Membros.</p>'; return; }
    if (aba === 'ajustes' && !gestor(g)) aba = 'conversa';
    resolve(g);
    ({ conversa, enquetes, presenca, publicar, membros, ajustes })[aba](g, c);
    msg = '';
  };

  function draw() { if (tick) { clearInterval(tick); tick = null; } if (gSel) interno(); else lista();
    // relógio interno (não aparece na tela): a cada minuto fecha as votações vencidas e atualiza a tela se algo mudou
    tick = setInterval(() => { if (!root.isConnected) { clearInterval(tick); tick = null; return; } const antes = JSON.stringify(itens().filter(i => i.tipo === 'pub').map(i => i.status)); visiveis().forEach(resolve); const depois = JSON.stringify(itens().filter(i => i.tipo === 'pub').map(i => i.status)); if (antes !== depois && !document.activeElement.closest('form')) draw(); }, 60000); }
  draw();
} };
})();
