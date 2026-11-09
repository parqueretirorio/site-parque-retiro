// Jardinagem / Área Externa (área restrita > Comissões Parque Retiro > Jardinagem / Área Externa).
// Reúne o planejamento de jardinagem, o planejamento de reflorestamento e os documentos da área.
// Dados: 'jard_planos' (tipo: jardinagem | reflorestamento) e 'jard_docs' (documentos, com link e/ou arquivo pequeno).
(function () {
const TIPOS = { jardinagem: 'Jardinagem', reflorestamento: 'Reflorestamento' };
const STATUS = ['Planejado', 'Em andamento', 'Concluído', 'Adiado'];
const CATS = ['Jardinagem', 'Reflorestamento', 'Mapa / croqui', 'Licença / autorização', 'Outro'];
const MAXARQ = 1024 * 1024; // 1 MB (os dados ficam no armazenamento do navegador)

window.PR_JARDINAGEM = {
  abrir(me, root, H) {
    const { esc, $, db, uid, hoje, fmtData, safeUrl, csv } = H;
    const edita = H.tem(me, 'jardinagem');
    const S = { sub: 'jardinagem', edit: '', fil: '', msg: '' };
    const planos = () => db.get('jard_planos', []), docs = () => db.get('jard_docs', []);
    const badge = s => `<span class="badge-status ${s === 'Concluído' ? 'badge-disponivel' : s === 'Adiado' ? 'badge-emprestado' : 'badge-pend'}">${esc(s)}</span>`;
    const periodo = p => p.inicio ? `${fmtData(p.inicio)}${p.fim ? ' a ' + fmtData(p.fim) : ''}` : '-';
    const aviso = () => S.msg ? `<p class="tip-box" role="status">${esc(S.msg)}</p>` : '';
    const SUB = () => [['jardinagem', 'Planejamento de jardinagem'], ['reflorestamento', 'Planejamento de reflorestamento'], ['docs', 'Documentos'], ['resumo', 'Resumo']];

    /* ---- Planejamentos (jardinagem e reflorestamento) ---- */
    const aba = (el, tipo) => {
      const ed = S.edit ? planos().find(p => p.id === S.edit && p.tipo === tipo) : null;
      const v = ed || { titulo: '', local: '', inicio: '', fim: '', status: 'Planejado', resp: '', voluntarios: '', materiais: '', especies: '', mudas: '', descricao: '' };
      const lista = planos().filter(p => p.tipo === tipo && (!S.fil || p.status === S.fil)).sort((a, b) => (a.inicio || '9999').localeCompare(b.inicio || '9999'));
      const refl = tipo === 'reflorestamento';
      el.innerHTML = `<h3><i class="fas fa-seedling"></i> Planejamento de ${TIPOS[tipo].toLowerCase()}</h3>${aviso()}
      ${edita ? `<form id="fp" class="form-reserva" novalidate>
        <h4>${ed ? 'Editar planejamento' : 'Novo planejamento'}</h4>
        <div class="form-row"><label for="p-t">Título *</label><input id="p-t" maxlength="100" value="${esc(v.titulo)}" placeholder="${refl ? 'Ex.: Plantio de mudas nativas na divisa leste' : 'Ex.: Poda e adubação do jardim da Sala'}"></div>
        <div class="form-row"><label for="p-l">Local / área do Parque</label><input id="p-l" maxlength="100" value="${esc(v.local)}" placeholder="Ex.: entrada, entorno da Fonte, divisa dos fundos"></div>
        <div class="form-row"><label for="p-i">Início previsto</label><input id="p-i" type="date" value="${esc(v.inicio)}"></div>
        <div class="form-row"><label for="p-f">Fim previsto</label><input id="p-f" type="date" value="${esc(v.fim)}"></div>
        <div class="form-row"><label for="p-s">Situação</label><select id="p-s">${STATUS.map(s => `<option${s === v.status ? ' selected' : ''}>${s}</option>`).join('')}</select></div>
        <div class="form-row"><label for="p-r">Responsável pela ação</label><input id="p-r" maxlength="80" value="${esc(v.resp)}"></div>
        <div class="form-row"><label for="p-v">Voluntários necessários</label><input id="p-v" type="number" min="0" max="999" value="${esc(v.voluntarios)}"></div>
        ${refl ? `<div class="form-row"><label for="p-e">Espécies a plantar</label><input id="p-e" maxlength="200" value="${esc(v.especies)}" placeholder="Ex.: ipê, pau-brasil, jerivá (conferir com orientação técnica)"></div>
        <div class="form-row"><label for="p-m">Quantidade de mudas</label><input id="p-m" type="number" min="0" max="99999" value="${esc(v.mudas)}"></div>` : ''}
        <div class="form-row"><label for="p-ma">Materiais e ferramentas</label><textarea id="p-ma" rows="2" maxlength="500">${esc(v.materiais)}</textarea></div>
        <div class="form-row"><label for="p-d">Descrição / como será feito</label><textarea id="p-d" rows="4" maxlength="2000">${esc(v.descricao)}</textarea></div>
        <p class="form-erro" id="p-er" role="alert" hidden></p>
        <button class="btn-visit btn-large"><i class="fas fa-save"></i> ${ed ? 'Salvar alterações' : 'Adicionar planejamento'}</button>${ed ? ' <button type="button" class="btn-visit" id="p-x" style="background:#6c7a7b">Cancelar</button>' : ''}
      </form>` : '<p class="vazio">Você pode consultar os planejamentos. Somente quem é responsável pela Jardinagem / Área Externa (ou o administrador) altera.</p>'}
      <div class="rc-filtros"><div class="form-row"><label for="p-fil">Filtrar por situação</label><select id="p-fil"><option value="">Todas</option>${STATUS.map(s => `<option${s === S.fil ? ' selected' : ''}>${s}</option>`).join('')}</select></div></div>
      <h4>Planejamentos (${lista.length})</h4>${lista.length ? `<table class="doc-table"><thead><tr><th>Título</th><th>Local</th><th>Período</th><th>Situação</th><th>Voluntários</th>${refl ? '<th>Mudas</th>' : ''}<th>Detalhes</th>${edita ? '<th></th>' : ''}</tr></thead><tbody>${lista.map(p => `<tr><td><strong>${esc(p.titulo)}</strong>${p.resp ? `<br><small>Resp.: ${esc(p.resp)}</small>` : ''}</td><td>${esc(p.local) || '-'}</td><td>${periodo(p)}</td><td>${badge(p.status)}</td><td>${p.voluntarios === '' || p.voluntarios == null ? '-' : esc(p.voluntarios)}</td>${refl ? `<td>${p.mudas === '' || p.mudas == null ? '-' : esc(p.mudas)}${p.especies ? `<br><small>${esc(p.especies)}</small>` : ''}</td>` : ''}<td>${p.materiais ? `<small><strong>Materiais:</strong> ${esc(p.materiais)}</small><br>` : ''}${esc(p.descricao) || ''}</td>${edita ? `<td><button class="btn-visit" data-ed="${p.id}">Editar</button> <button class="icon-btn" data-del="${p.id}" aria-label="Excluir ${esc(p.titulo)}"><i class="fas fa-trash"></i></button></td>` : ''}</tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhum planejamento cadastrado.</p>'}`;
      $('#p-fil', el).onchange = e => { S.fil = e.target.value; S.msg = ''; draw(); };
      el.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { S.edit = b.dataset.ed; S.msg = ''; draw(); });
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Excluir este planejamento?')) { db.set('jard_planos', planos().filter(p => p.id !== b.dataset.del)); S.edit = ''; draw(); } });
      const f = $('#fp', el); if (!f) return;
      const x = $('#p-x', el); if (x) x.onclick = () => { S.edit = ''; draw(); };
      f.onsubmit = e => {
        e.preventDefault(); if (!edita) return;
        const g = id => { const i = $('#' + id, el); return i ? i.value.trim() : ''; }, er = $('#p-er', el), falha = m => { er.textContent = m; er.hidden = false; };
        if (!g('p-t')) return falha('Informe o título.');
        if (g('p-i') && g('p-f') && g('p-f') < g('p-i')) return falha('O fim não pode ser antes do início.');
        const num = id => g(id) === '' ? '' : Math.max(0, parseInt(g(id), 10) || 0);
        const reg = { id: ed ? ed.id : uid(), tipo, titulo: g('p-t'), local: g('p-l'), inicio: g('p-i'), fim: g('p-f'), status: g('p-s'), resp: g('p-r'), voluntarios: num('p-v'), materiais: g('p-ma'), descricao: g('p-d'), especies: refl ? g('p-e') : '', mudas: refl ? num('p-m') : '', criado: ed ? ed.criado : hoje(), por: ed ? ed.por : me.nome, atualizado: hoje() };
        const l = planos().filter(p => p.id !== reg.id); l.push(reg);
        if (!db.set('jard_planos', l)) return falha('Não foi possível salvar (espaço do navegador cheio?).');
        S.edit = ''; S.msg = ed ? 'Planejamento atualizado.' : 'Planejamento adicionado.'; draw();
      };
    };

    /* ---- Documentos ---- */
    const abaDocs = el => {
      const lista = docs().slice().sort((a, b) => (b.data || '').localeCompare(a.data || ''));
      el.innerHTML = `<h3><i class="fas fa-folder-open"></i> Documentos da Jardinagem / Área Externa</h3>${aviso()}
      <p>Projetos, mapas, orientações técnicas, autorizações e outros documentos. Informe o <strong>link</strong> (ex.: pasta no Drive) e/ou anexe um arquivo pequeno (PDF ou imagem, até 1 MB).</p>
      ${edita ? `<form id="fd" class="form-reserva" novalidate>
        <div class="form-row"><label for="d-t">Título *</label><input id="d-t" maxlength="100"></div>
        <div class="form-row"><label for="d-c">Categoria</label><select id="d-c">${CATS.map(c => `<option>${c}</option>`).join('')}</select></div>
        <div class="form-row"><label for="d-dt">Data do documento</label><input id="d-dt" type="date" value="${hoje()}"></div>
        <div class="form-row"><label for="d-l">Link (https://...)</label><input id="d-l" type="url" maxlength="400" placeholder="https://drive.google.com/..."></div>
        <div class="form-row"><label for="d-f">Arquivo (PDF ou imagem, até 1 MB)</label><input id="d-f" type="file" accept=".pdf,image/*"></div>
        <div class="form-row"><label for="d-o">Descrição</label><textarea id="d-o" rows="2" maxlength="400"></textarea></div>
        <p class="form-erro" id="d-er" role="alert" hidden></p><button class="btn-visit btn-large"><i class="fas fa-plus"></i> Adicionar documento</button></form>` : '<p class="vazio">Somente o responsável pela Jardinagem / Área Externa (ou o administrador) inclui documentos.</p>'}
      <h4>Documentos (${lista.length})</h4>${lista.length ? `<table class="doc-table"><thead><tr><th>Título</th><th>Categoria</th><th>Data</th><th>Abrir</th>${edita ? '<th></th>' : ''}</tr></thead><tbody>${lista.map(d => `<tr><td><strong>${esc(d.titulo)}</strong>${d.desc ? `<br><small>${esc(d.desc)}</small>` : ''}</td><td>${esc(d.cat)}</td><td>${fmtData(d.data) || '-'}</td><td>${d.link && safeUrl(d.link) ? `<a href="${esc(d.link)}" target="_blank" rel="noopener">Abrir link</a>` : ''}${d.link && d.arq ? '<br>' : ''}${d.arq && safeUrl(d.arq) ? `<a href="${esc(d.arq)}" download="${esc(d.nomeArq || 'documento')}">Baixar arquivo</a>` : ''}${!d.link && !d.arq ? '-' : ''}</td>${edita ? `<td><button class="icon-btn" data-del="${d.id}" aria-label="Excluir ${esc(d.titulo)}"><i class="fas fa-trash"></i></button></td>` : ''}</tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhum documento cadastrado.</p>'}`;
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Excluir este documento?')) { db.set('jard_docs', docs().filter(d => d.id !== b.dataset.del)); draw(); } });
      const f = $('#fd', el); if (!f) return;
      f.onsubmit = e => {
        e.preventDefault();
        const g = id => $('#' + id, el).value.trim(), er = $('#d-er', el), falha = m => { er.textContent = m; er.hidden = false; }, arq = $('#d-f', el).files[0];
        er.hidden = true;
        if (!g('d-t')) return falha('Informe o título.');
        if (g('d-l') && !/^https?:\/\//i.test(g('d-l'))) return falha('O link precisa começar com http:// ou https://.');
        if (!g('d-l') && !arq) return falha('Informe um link ou anexe um arquivo.');
        if (arq && arq.size > MAXARQ) return falha('Arquivo maior que 1 MB. Guarde-o no Drive e informe o link.');
        const salva = dados => {
          const l = docs(); l.push({ id: uid(), titulo: g('d-t'), cat: g('d-c'), data: g('d-dt'), link: g('d-l'), desc: g('d-o'), arq: dados || '', nomeArq: arq ? arq.name.slice(0, 80) : '', por: me.nome, criado: hoje() });
          if (!db.set('jard_docs', l)) return falha('Sem espaço no navegador. Use o link em vez do arquivo.');
          S.msg = 'Documento adicionado.'; draw();
        };
        if (arq) { const r = new FileReader(); r.onload = () => safeUrl(r.result) ? salva(r.result) : falha('Tipo de arquivo não aceito (use PDF ou imagem).'); r.onerror = () => falha('Não foi possível ler o arquivo.'); r.readAsDataURL(arq); } else salva('');
      };
    };

    /* ---- Resumo ---- */
    const resumo = el => {
      const ps = planos(), cont = (t, s) => ps.filter(p => p.tipo === t && p.status === s).length;
      const mudas = ps.filter(p => p.tipo === 'reflorestamento' && p.status !== 'Adiado').reduce((t, p) => t + (+p.mudas || 0), 0);
      const plantadas = ps.filter(p => p.tipo === 'reflorestamento' && p.status === 'Concluído').reduce((t, p) => t + (+p.mudas || 0), 0);
      const vol = ps.filter(p => ['Planejado', 'Em andamento'].includes(p.status)).reduce((t, p) => t + (+p.voluntarios || 0), 0);
      const prox = ps.filter(p => ['Planejado', 'Em andamento'].includes(p.status) && p.inicio).sort((a, b) => a.inicio.localeCompare(b.inicio)).slice(0, 5);
      el.innerHTML = `<h3><i class="fas fa-chart-pie"></i> Resumo da Jardinagem / Área Externa</h3>
      <table class="doc-table"><thead><tr><th>Planejamentos</th>${STATUS.map(s => `<th>${s}</th>`).join('')}</tr></thead><tbody>${Object.entries(TIPOS).map(([k, n]) => `<tr><td><strong>${n}</strong></td>${STATUS.map(s => `<td>${cont(k, s)}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <div class="totais"><div><span>Mudas planejadas (sem adiados)</span><strong>${mudas}</strong></div><div><span>Mudas de planos concluídos</span><strong>${plantadas}</strong></div><div><span>Voluntários necessários (planos abertos)</span><strong>${vol}</strong></div><div><span>Documentos</span><strong>${docs().length}</strong></div></div>
      <h4>Próximas ações</h4>${prox.length ? `<ul>${prox.map(p => `<li><strong>${esc(p.titulo)}</strong> (${TIPOS[p.tipo]}) - ${periodo(p)}${p.local ? ' - ' + esc(p.local) : ''}</li>`).join('')}</ul>` : '<p class="vazio">Nenhuma ação com data prevista.</p>'}
      <p class="no-print"><button class="btn-visit" id="j-c"><i class="fas fa-file-csv"></i> Baixar planejamentos (CSV)</button> <button class="btn-visit" id="j-p"><i class="fas fa-print"></i> Imprimir</button></p>`;
      $('#j-p', el).onclick = () => window.print();
      $('#j-c', el).onclick = () => {
        const rows = [['Tipo', 'Título', 'Local', 'Início', 'Fim', 'Situação', 'Responsável', 'Voluntários', 'Espécies', 'Mudas', 'Materiais', 'Descrição']].concat(planos().map(p => [TIPOS[p.tipo], p.titulo, p.local, fmtData(p.inicio), fmtData(p.fim), p.status, p.resp, p.voluntarios, p.especies, p.mudas, p.materiais, p.descricao]));
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = `jardinagem-planejamentos-${hoje()}.csv`; a.click();
      };
    };

    const draw = () => {
      root.innerHTML = `<div class="tabs sub" role="tablist">${SUB().map(t => `<button class="tab-btn${t[0] === S.sub ? ' active' : ''}" data-s="${t[0]}">${t[1]}</button>`).join('')}</div><div id="jd-sub"></div>`;
      root.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { S.sub = b.dataset.s; S.edit = ''; S.fil = ''; S.msg = ''; draw(); });
      const el = $('#jd-sub', root);
      S.sub === 'docs' ? abaDocs(el) : S.sub === 'resumo' ? resumo(el) : aba(el, S.sub);
    };
    draw();
  }
};
})();
