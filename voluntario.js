// Voluntário (Ajude o Parque > Voluntário) e, na área restrita (Comissões Parque Retiro > Ajude o Parque > Voluntário), a lista de inscrições e as Ações de Voluntário.
// Para quem não pode ajudar com dinheiro e quer cooperar com o seu tempo e o seu trabalho. Nada é cobrado nem pedido em dinheiro.
// Dado: 'voluntarios' = { id, nome, celular, email, cidade, areas[], disp, obs, status, consentimento, criadoEm, nota }.
// Dado: 'vol_acoes' = { id, nome, objetivo, plano, duracaoQtd, duracaoUn, criado, por, atualizado } (ações criadas pela Comissão; não têm dado pessoal).
// Modo local: a inscrição feita por visitante fica só no navegador de quem se inscreveu (veja docs/VOLUNTARIO_JARDINAGEM.md).
(function () {
const AREAS = ['Jardinagem e área externa', 'Reflorestamento', 'Limpeza e manutenção do Parque', 'Apoio em encontros e atividades', 'Comunicação, redes sociais e site', 'Multiuso', 'Outra forma (conte na mensagem)'];
const AREA_URL = { jardinagem: AREAS[0], reflorestamento: AREAS[1], comunicacao: 'Comunicação, redes sociais e site', multiuso: 'Multiuso' };
const DISP = ['Finais de semana', 'Dias de semana', 'Só em mutirões e dias combinados', 'Ainda não sei, combinamos conversando'];
const STATUS = { novo: 'Novo', contato: 'Em contato', ativo: 'Voluntário(a) ativo(a)', semretorno: 'Sem retorno' };
const CONSENTIMENTO = 'Autorizo o Parque Retiro a usar meus dados apenas para entrar em contato sobre o trabalho voluntário.';
const UNID = { horas: ['hora', 'horas'], dias: ['dia', 'dias'], semanas: ['semana', 'semanas'], meses: ['mês', 'meses'] };
const soDig = s => String(s || '').replace(/\D/g, '');
const modoLocal = () => !(window.PR_DADOS && window.PR_DADOS.modo === 'remoto');
const pad = n => String(n).padStart(2, '0');
const hojeLocal = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };

window.PR_VOLUNTARIO = {
  /* ===================== Página pública ===================== */
  publica(H) {
    const el = document.getElementById('voluntario-form'); if (!el) return;
    const { esc, db, uid } = H;
    let ok = null, pre = false;
    const draw = () => {
      el.innerHTML = `${modoLocal() ? `<p class="tip-box" role="note"><i class="fas fa-exclamation-triangle"></i> <strong>Modo de demonstração:</strong> as inscrições ficam gravadas só neste navegador e ainda não chegam à Comissão. Para se inscrever de verdade, escreva para a Comissão do Parque.</p>` : ''}
      ${ok ? `<section class="card rifa-ok" role="status"><h3><i class="fas fa-check-circle"></i> Inscrição recebida. Obrigado, ${esc(ok.nome.split(/\s+/)[0])}!</h3><p>A Comissão vai entrar em contato para combinar como e quando você pode colaborar.</p></section>` : `
      <section class="card"><h3><i class="fas fa-hand-holding-heart"></i> Quero ser voluntário(a)</h3>
        <form id="vl-form" class="form-reserva" novalidate>
          <div class="form-row"><label for="v-n">Nome completo *</label><input id="v-n" maxlength="100" autocomplete="name" required></div>
          <div class="form-row"><label for="v-c">Celular / WhatsApp *</label><input id="v-c" maxlength="20" inputmode="tel" autocomplete="tel" placeholder="(21) 99999-9999" required></div>
          <div class="form-row"><label for="v-e">E-mail</label><input id="v-e" type="email" maxlength="120" autocomplete="email"></div>
          <div class="form-row"><label for="v-ci">Cidade</label><input id="v-ci" maxlength="60"></div>
          <fieldset class="funcoes"><legend>Como você gostaria de colaborar? * <small>(marque quantas quiser)</small></legend>${AREAS.map((a, i) => `<label><input type="checkbox" name="va" value="${esc(a)}" id="va-${i}"> ${esc(a)}</label>`).join('')}</fieldset>
          <div class="form-row"><label for="v-d">Quando você pode ajudar?</label><select id="v-d"><option value="">Escolha...</option>${DISP.map(d => `<option>${esc(d)}</option>`).join('')}</select></div>
          <div class="form-row"><label for="v-o">Quer contar algo? <small>(experiência, limitações, ideias)</small></label><textarea id="v-o" rows="3" maxlength="500"></textarea></div>
          <div class="form-row"><label><input type="checkbox" id="v-ok"> ${esc(CONSENTIMENTO)} *</label></div>
          <p class="form-erro" id="v-er" role="alert" hidden></p>
          <button class="btn-visit btn-large"><i class="fas fa-check"></i> Enviar minha inscrição</button>
        </form></section>`}`;
      const f = document.getElementById('vl-form'); if (!f) return;
      // Vindo das páginas das Comissões (voluntario.html?area=jardinagem|comunicacao): já deixa a área marcada.
      if (!pre) { pre = true; try { const a = new URLSearchParams(location.search).get('area'), alvo = a && AREA_URL[a]; if (alvo) { const i = f.querySelector('[name=va][value="' + alvo.replace(/"/g, '') + '"]'); if (i) i.checked = true; } } catch (e) { /* sem parâmetro */ } }
      f.onsubmit = e => {
        e.preventDefault();
        const g = id => document.getElementById(id), er = g('v-er'), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
        const nome = g('v-n').value.trim(), cel = g('v-c').value.trim(), areas = [...f.querySelectorAll('[name=va]:checked')].map(i => i.value);
        if (nome.split(/\s+/).filter(Boolean).length < 2) return falha('Informe o nome completo (nome e sobrenome).');
        if (soDig(cel).length < 10) return falha('Informe o celular/WhatsApp com DDD.');
        if (g('v-e').value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g('v-e').value.trim())) return falha('O e-mail informado não parece válido.');
        if (!areas.length) return falha('Marque ao menos uma forma de colaborar.');
        if (!g('v-ok').checked) return falha('É preciso concordar com o uso dos dados para o contato.');
        const l = db.get('voluntarios', []);
        if (l.some(v => soDig(v.celular) === soDig(cel) && v.status !== 'semretorno' && (Date.now() - new Date(v.criadoEm).getTime()) < 864e5)) return falha('Já recebemos uma inscrição com esse celular. Aguarde o contato da Comissão.');
        const reg = { id: uid(), nome, celular: cel, email: g('v-e').value.trim(), cidade: g('v-ci').value.trim(), areas, disp: g('v-d').value, obs: g('v-o').value.trim(), status: 'novo', consentimento: true, criadoEm: new Date().toISOString(), nota: '' };
        l.push(reg);
        if (!db.set('voluntarios', l)) return falha('Não foi possível salvar a inscrição agora. Tente de novo ou escreva para a Comissão.');
        ok = reg; draw();
      };
    };
    draw();
  },

  /* ===================== Área restrita: ações de voluntário ===================== */
  // Quem é Responsável pelos Voluntários (ou administrador) cria, edita e exclui. As ações descrevem em que o voluntário pode ajudar.
  acoes(me, root, H) {
    const { esc, $, db, uid, hoje, fmtData } = H;
    const edita = H.tem(me, 'voluntario');
    const S = { edit: '', msg: '' };
    const lista = () => db.get('vol_acoes', []);
    const duracao = a => a.duracaoQtd ? `${a.duracaoQtd} ${(UNID[a.duracaoUn] || UNID.dias)[Number(a.duracaoQtd) === 1 ? 0 : 1]}` : 'Não informada';
    const draw = () => {
      const ed = S.edit ? lista().find(a => a.id === S.edit) : null;
      const v = ed || { nome: '', objetivo: '', plano: '', duracaoQtd: '', duracaoUn: 'dias' };
      const todas = lista().sort((a, b) => (b.criado || '').localeCompare(a.criado || ''));
      root.innerHTML = `<h3><i class="fas fa-clipboard-list"></i> Ações de Voluntário</h3>
      <p>Crie as ações em que as pessoas voluntárias podem ajudar o Parque: o que é a ação, para que serve, como será feita e, se souber, quanto tempo dura.</p>
      ${S.msg ? `<p class="tip-box" role="status">${esc(S.msg)}</p>` : ''}
      ${edita ? `<form id="va-form" class="form-reserva" novalidate>
        <h4>${ed ? 'Editar ação' : 'Criar uma ação de Voluntário'}</h4>
        <div class="form-row"><label for="va-n">Nome da ação *</label><input id="va-n" maxlength="100" value="${esc(v.nome)}" placeholder="Ex.: Mutirão de limpeza da trilha"></div>
        <div class="form-row"><label for="va-o">Objetivo *</label><textarea id="va-o" rows="3" maxlength="600" placeholder="Para que serve esta ação? O que queremos alcançar?">${esc(v.objetivo)}</textarea></div>
        <div class="form-row"><label for="va-p">Plano *</label><textarea id="va-p" rows="6" maxlength="3000" placeholder="Como será feita: etapas, local, quantas pessoas, o que levar...">${esc(v.plano)}</textarea></div>
        <div class="form-row"><label for="va-q">Tempo de duração <small>(se possível)</small></label><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="va-q" type="number" min="1" max="9999" style="max-width:110px" value="${esc(v.duracaoQtd)}" aria-label="Quantidade de tempo"><select id="va-u" aria-label="Unidade de tempo" style="max-width:160px">${Object.entries(UNID).map(([k, u]) => `<option value="${k}"${v.duracaoUn === k ? ' selected' : ''}>${u[1]}</option>`).join('')}</select></div></div>
        <p class="form-erro" id="va-er" role="alert" hidden></p>
        <button class="btn-visit btn-large"><i class="fas fa-save"></i> ${ed ? 'Salvar alterações' : 'Criar ação'}</button>${ed ? ' <button type="button" class="btn-visit" id="va-x" style="background:#6c7a7b">Cancelar</button>' : ''}
      </form>` : '<p class="vazio">Você pode consultar as ações. Somente quem é responsável pelos Voluntários (ou o administrador) cria e altera.</p>'}
      <h4>Ações criadas (${todas.length})</h4>
      ${todas.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Ação</th><th>Objetivo</th><th>Plano</th><th>Duração</th>${edita ? '<th></th>' : ''}</tr></thead><tbody>${todas.map(a => `<tr><td><strong>${esc(a.nome)}</strong><br><small>${a.por ? esc(a.por) + ' &middot; ' : ''}${a.criado ? fmtData(a.criado) : ''}</small></td><td style="white-space:pre-line">${esc(a.objetivo)}</td><td style="white-space:pre-line">${esc(a.plano)}</td><td>${esc(duracao(a))}</td>${edita ? `<td><button class="btn-visit" data-ed="${a.id}">Editar</button> <button class="icon-btn" data-del="${a.id}" aria-label="Excluir ${esc(a.nome)}"><i class="fas fa-trash"></i></button></td>` : ''}</tr>`).join('')}</tbody></table></div>` : '<p class="vazio">Nenhuma ação criada ainda.</p>'}`;
      root.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { S.edit = b.dataset.ed; S.msg = ''; draw(); const f = $('#va-form', root); if (f) f.scrollIntoView({ behavior: 'smooth' }); });
      root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Excluir esta ação de voluntário?')) { db.set('vol_acoes', lista().filter(a => a.id !== b.dataset.del)); S.edit = ''; S.msg = 'Ação excluída.'; draw(); } });
      const f = $('#va-form', root); if (!f) return;
      const x = $('#va-x', root); if (x) x.onclick = () => { S.edit = ''; S.msg = ''; draw(); };
      f.onsubmit = e => {
        e.preventDefault(); if (!edita) return;
        const g = id => $('#' + id, root).value.trim(), er = $('#va-er', root), falha = m => { er.textContent = m; er.hidden = false; };
        if (!g('va-n')) return falha('Informe o nome da ação.');
        if (!g('va-o')) return falha('Informe o objetivo da ação.');
        if (!g('va-p')) return falha('Descreva o plano da ação.');
        const qtd = g('va-q') === '' ? '' : Math.min(9999, Math.max(1, parseInt(g('va-q'), 10) || 0));
        if (g('va-q') !== '' && !qtd) return falha('O tempo de duração precisa ser um número maior que zero (ou deixe em branco).');
        const reg = { id: ed ? ed.id : uid(), nome: g('va-n'), objetivo: g('va-o'), plano: g('va-p'), duracaoQtd: qtd, duracaoUn: qtd === '' ? '' : g('va-u'), criado: ed ? ed.criado : hoje(), por: ed ? ed.por : me.nome, atualizado: hoje() };
        const l = lista().filter(a => a.id !== reg.id); l.push(reg);
        if (!db.set('vol_acoes', l)) return falha('Não foi possível salvar (espaço do navegador cheio?).');
        S.edit = ''; S.msg = ed ? 'Ação atualizada.' : 'Ação criada.'; draw();
      };
    };
    draw();
  },

  /* ===================== Área restrita: inscrições ===================== */
  abrir(me, root, H) {
    const { esc, $, db, hoje, fmtData, csv } = H;
    const edita = H.tem(me, 'voluntario');
    const S = { st: '', area: '', q: '' };
    const lista = () => db.get('voluntarios', []);
    const draw = () => {
      const todos = lista().sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
      const vis = todos.filter(v => (!S.st || v.status === S.st) && (!S.area || (v.areas || []).includes(S.area)) && (!S.q || H.norm([v.nome, v.cidade, v.email, v.celular].join(' ')).includes(H.norm(S.q))));
      const n = s => todos.filter(v => v.status === s).length;
      root.innerHTML = `<h3><i class="fas fa-hands-helping"></i> Voluntários inscritos</h3>
      <p>Pessoas que se inscreveram em <strong>Ajude o Parque &gt; Voluntário</strong> para cooperar sem aporte financeiro. Entre em contato, combine a atividade e acompanhe a situação.</p>
      ${modoLocal() ? '<p class="tip-box" role="note"><i class="fas fa-exclamation-triangle"></i> Em modo local, só aparecem aqui as inscrições feitas neste mesmo navegador. Para receber as inscrições de verdade, é preciso ligar o servidor (veja docs/VOLUNTARIO_JARDINAGEM.md).</p>' : ''}
      <div class="totais"><div><span>Inscritos</span><strong>${todos.length}</strong></div><div><span>Novos</span><strong>${n('novo')}</strong></div><div><span>Em contato</span><strong>${n('contato')}</strong></div><div><span>Ativos</span><strong>${n('ativo')}</strong></div></div>
      <div class="rc-filtros"><div class="form-row"><label for="vs-s">Situação</label><select id="vs-s"><option value="">Todas</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${S.st === k ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
        <div class="form-row"><label for="vs-a">Forma de colaborar</label><select id="vs-a"><option value="">Todas</option>${AREAS.map(a => `<option${S.area === a ? ' selected' : ''}>${esc(a)}</option>`).join('')}</select></div>
        <div class="form-row"><label for="vs-q">Buscar</label><input id="vs-q" type="search" value="${esc(S.q)}"></div></div>
      <p class="no-print"><button class="btn-visit" id="vs-c"><i class="fas fa-file-csv"></i> Baixar (CSV)</button></p>
      ${vis.length ? `<table class="doc-table"><thead><tr><th>Pessoa</th><th>Contato</th><th>Colaborar com</th><th>Disponibilidade</th><th>Situação</th><th>Anotação</th>${edita ? '<th></th>' : ''}</tr></thead><tbody>${vis.map(v => `<tr><td><strong>${esc(v.nome)}</strong><br><small>${esc(v.cidade) || ''} &middot; ${fmtData((v.criadoEm || '').slice(0, 10))}</small>${v.obs ? `<br><small>${esc(v.obs)}</small>` : ''}</td><td>${esc(v.celular)}${v.email ? `<br><small>${esc(v.email)}</small>` : ''}</td><td>${(v.areas || []).map(esc).join('<br>')}</td><td>${esc(v.disp) || '-'}</td><td>${edita ? `<select data-st="${v.id}" aria-label="Situação de ${esc(v.nome)}">${Object.entries(STATUS).map(([k, t]) => `<option value="${k}"${v.status === k ? ' selected' : ''}>${t}</option>`).join('')}</select>` : esc(STATUS[v.status] || v.status)}</td><td>${edita ? `<input data-nt="${v.id}" maxlength="200" value="${esc(v.nota)}" aria-label="Anotação sobre ${esc(v.nome)}">` : esc(v.nota) || '-'}</td>${edita ? `<td><button class="icon-btn" data-del="${v.id}" aria-label="Excluir inscrição de ${esc(v.nome)}"><i class="fas fa-trash"></i></button></td>` : ''}</tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhuma inscrição com esses filtros.</p>'}`;
      $('#vs-s', root).onchange = e => { S.st = e.target.value; draw(); };
      $('#vs-a', root).onchange = e => { S.area = e.target.value; draw(); };
      $('#vs-q', root).onchange = e => { S.q = e.target.value.trim(); draw(); };
      $('#vs-c', root).onclick = () => {
        const rows = [['Nome', 'Celular', 'E-mail', 'Cidade', 'Colaborar com', 'Disponibilidade', 'Situação', 'Inscrição', 'Anotação']].concat(vis.map(v => [v.nome, v.celular, v.email, v.cidade, (v.areas || []).join(' | '), v.disp, STATUS[v.status] || v.status, fmtData((v.criadoEm || '').slice(0, 10)), v.nota]));
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = `voluntarios-${hoje()}.csv`; a.click();
      };
      const muda = (id, fn) => { const l = lista(), v = l.find(x => x.id === id); if (v) { fn(v); db.set('voluntarios', l); } };
      root.querySelectorAll('[data-st]').forEach(s => s.onchange = () => { muda(s.dataset.st, v => { v.status = s.value; }); draw(); });
      root.querySelectorAll('[data-nt]').forEach(i => i.onchange = () => muda(i.dataset.nt, v => { v.nota = i.value.trim(); }));
      root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Excluir esta inscrição? Os dados da pessoa serão apagados.')) { db.set('voluntarios', lista().filter(v => v.id !== b.dataset.del)); draw(); } });
    };
    draw();
  }
};
})();
