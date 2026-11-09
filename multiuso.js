// Multiuso (área restrita > Comissões Parque Retiro > Multiuso).
// Reúne: Agenda de uso do espaço multiuso, Planejamentos (com situação, responsável, voluntários e materiais),
// Regras e informações (responsável, regras de uso, observações) e Documentos.
// Dados: 'multiuso_agenda', 'multiuso_planos', 'multiuso_info' (um único registro) e 'multiuso_docs'.
(function () {
const STATUS = ['Planejado', 'Em andamento', 'Concluído', 'Adiado'];
const AG_STATUS = ['Reservado', 'Realizado', 'Cancelado'];
const CATS = ['Regras de uso', 'Planta / croqui', 'Autorização / licença', 'Orçamento', 'Outro'];
const MAXARQ = 1024 * 1024; // 1 MB (os dados ficam no armazenamento do navegador)

window.PR_MULTIUSO = {
  abrir(me, root, H) {
    const { esc, $, db, uid, hoje, fmtData, safeUrl, csv } = H;
    const edita = H.tem(me, 'multiuso');
    const S = { sub: 'agenda', edit: '', fil: '', msg: '' };
    const agenda = () => db.get('multiuso_agenda', []), planos = () => db.get('multiuso_planos', []), docs = () => db.get('multiuso_docs', []), info = () => db.get('multiuso_info', {}) || {};
    const aviso = () => S.msg ? `<p class="tip-box" role="status">${esc(S.msg)}</p>` : '';
    const badge = s => `<span class="badge-status ${s === 'Concluído' || s === 'Realizado' ? 'badge-disponivel' : s === 'Adiado' || s === 'Cancelado' ? 'badge-emprestado' : 'badge-pend'}">${esc(s)}</span>`;
    const SUB = [['agenda', 'Agenda de uso'], ['planos', 'Planejamentos'], ['info', 'Regras e informações'], ['docs', 'Documentos']];
    const somenteLeitura = '<p class="vazio">Você pode consultar. Somente quem é responsável pelo Multiuso (ou o administrador) altera.</p>';
    const campo = (el, id) => { const i = $('#' + id, el); return i ? i.value.trim() : ''; };
    const salvar = (k, l, el, er) => db.set(k, l) || (er('Não foi possível salvar (espaço do navegador cheio?).'), false);

    /* ---- Agenda de uso ---- */
    const abaAgenda = el => {
      const ed = S.edit ? agenda().find(a => a.id === S.edit) : null;
      const v = ed || { data: hoje(), ini: '', fim: '', atividade: '', quem: '', resp: '', status: 'Reservado', obs: '' };
      const lista = agenda().filter(a => !S.fil || a.status === S.fil).sort((a, b) => (b.data + (b.ini || '')).localeCompare(a.data + (a.ini || '')));
      el.innerHTML = `<h3><i class="fas fa-calendar-alt"></i> Agenda de uso do Multiuso</h3>${aviso()}
      ${edita ? `<form id="mu-f" class="form-reserva" novalidate><h4>${ed ? 'Editar uso' : 'Novo uso do espaço'}</h4>
        <div class="form-row"><label for="m-d">Data *</label><input id="m-d" type="date" value="${esc(v.data)}"></div>
        <div class="form-row"><label for="m-i">Horário de início</label><input id="m-i" type="time" value="${esc(v.ini)}"></div>
        <div class="form-row"><label for="m-fi">Horário de término</label><input id="m-fi" type="time" value="${esc(v.fim)}"></div>
        <div class="form-row"><label for="m-a">Atividade *</label><input id="m-a" maxlength="120" value="${esc(v.atividade)}" placeholder="Ex.: Oficina, reunião, encontro de jovens"></div>
        <div class="form-row"><label for="m-q">Quem vai usar (grupo ou pessoa)</label><input id="m-q" maxlength="100" value="${esc(v.quem)}"></div>
        <div class="form-row"><label for="m-r">Responsável pelo uso</label><input id="m-r" maxlength="80" value="${esc(v.resp)}"></div>
        <div class="form-row"><label for="m-s">Situação</label><select id="m-s">${AG_STATUS.map(s => `<option${s === v.status ? ' selected' : ''}>${s}</option>`).join('')}</select></div>
        <div class="form-row"><label for="m-o">Observações</label><textarea id="m-o" rows="2" maxlength="500">${esc(v.obs)}</textarea></div>
        <p class="form-erro" id="m-er" role="alert" hidden></p>
        <button class="btn-visit btn-large"><i class="fas fa-save"></i> ${ed ? 'Salvar alterações' : 'Adicionar à agenda'}</button>${ed ? ' <button type="button" class="btn-visit" id="m-x" style="background:#6c7a7b">Cancelar</button>' : ''}</form>` : somenteLeitura}
      <div class="rc-filtros"><div class="form-row"><label for="m-fil">Filtrar por situação</label><select id="m-fil"><option value="">Todas</option>${AG_STATUS.map(s => `<option${s === S.fil ? ' selected' : ''}>${s}</option>`).join('')}</select></div></div>
      <h4>Usos registrados (${lista.length})</h4>${lista.length ? `<table class="doc-table"><thead><tr><th>Data</th><th>Horário</th><th>Atividade</th><th>Quem</th><th>Responsável</th><th>Situação</th>${edita ? '<th></th>' : ''}</tr></thead><tbody>${lista.map(a => `<tr><td>${fmtData(a.data)}</td><td>${esc(a.ini || '')}${a.fim ? ' às ' + esc(a.fim) : ''}</td><td>${esc(a.atividade)}${a.obs ? `<br><small>${esc(a.obs)}</small>` : ''}</td><td>${esc(a.quem || '-')}</td><td>${esc(a.resp || '-')}</td><td>${badge(a.status)}</td>${edita ? `<td><button class="btn-visit" data-ed="${esc(a.id)}">Editar</button> <button class="btn-visit" data-del="${esc(a.id)}" style="background:#a33">Excluir</button></td>` : ''}</tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhum uso registrado.</p>'}`;
      $('#m-fil', el).onchange = e => { S.fil = e.target.value; S.msg = ''; draw(); };
      el.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { S.edit = b.dataset.ed; S.msg = ''; draw(); });
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Excluir este registro da agenda?')) { db.set('multiuso_agenda', agenda().filter(a => a.id !== b.dataset.del)); S.edit = ''; draw(); } });
      const f = $('#mu-f', el); if (!f) return;
      const x = $('#m-x', el); if (x) x.onclick = () => { S.edit = ''; draw(); };
      f.onsubmit = e => {
        e.preventDefault(); if (!edita) return;
        const er = $('#m-er', el), falha = m => { er.textContent = m; er.hidden = false; };
        if (!campo(el, 'm-d')) return falha('Informe a data.');
        if (!campo(el, 'm-a')) return falha('Informe a atividade.');
        if (campo(el, 'm-i') && campo(el, 'm-fi') && campo(el, 'm-fi') < campo(el, 'm-i')) return falha('O término não pode ser antes do início.');
        const reg = { id: ed ? ed.id : uid(), data: campo(el, 'm-d'), ini: campo(el, 'm-i'), fim: campo(el, 'm-fi'), atividade: campo(el, 'm-a'), quem: campo(el, 'm-q'), resp: campo(el, 'm-r'), status: campo(el, 'm-s'), obs: campo(el, 'm-o'), por: me.nome };
        const l = agenda().filter(a => a.id !== reg.id); l.push(reg);
        if (!salvar('multiuso_agenda', l, el, falha)) return;
        S.edit = ''; S.msg = ed ? 'Registro atualizado.' : 'Uso adicionado à agenda.'; draw();
      };
    };

    /* ---- Planejamentos ---- */
    const periodo = p => p.inicio ? `${fmtData(p.inicio)}${p.fim ? ' a ' + fmtData(p.fim) : ''}` : '-';
    const abaPlanos = el => {
      const ed = S.edit ? planos().find(p => p.id === S.edit) : null;
      const v = ed || { titulo: '', inicio: '', fim: '', status: 'Planejado', resp: '', voluntarios: '', materiais: '', descricao: '' };
      const lista = planos().filter(p => !S.fil || p.status === S.fil).sort((a, b) => (a.inicio || '9999').localeCompare(b.inicio || '9999'));
      el.innerHTML = `<h3><i class="fas fa-tasks"></i> Planejamentos do Multiuso</h3>${aviso()}
      ${edita ? `<form id="mu-f" class="form-reserva" novalidate><h4>${ed ? 'Editar planejamento' : 'Novo planejamento'}</h4>
        <div class="form-row"><label for="p-t">Título *</label><input id="p-t" maxlength="100" value="${esc(v.titulo)}" placeholder="Ex.: Reforma do piso, compra de cadeiras, calendário de oficinas"></div>
        <div class="form-row"><label for="p-i">Início previsto</label><input id="p-i" type="date" value="${esc(v.inicio)}"></div>
        <div class="form-row"><label for="p-f">Fim previsto</label><input id="p-f" type="date" value="${esc(v.fim)}"></div>
        <div class="form-row"><label for="p-s">Situação</label><select id="p-s">${STATUS.map(s => `<option${s === v.status ? ' selected' : ''}>${s}</option>`).join('')}</select></div>
        <div class="form-row"><label for="p-r">Responsável</label><input id="p-r" maxlength="80" value="${esc(v.resp)}"></div>
        <div class="form-row"><label for="p-v">Voluntários necessários</label><input id="p-v" type="number" min="0" max="999" value="${esc(v.voluntarios)}"></div>
        <div class="form-row"><label for="p-ma">Materiais e recursos</label><textarea id="p-ma" rows="2" maxlength="500">${esc(v.materiais)}</textarea></div>
        <div class="form-row"><label for="p-d">Descrição / como será feito</label><textarea id="p-d" rows="4" maxlength="2000">${esc(v.descricao)}</textarea></div>
        <p class="form-erro" id="p-er" role="alert" hidden></p>
        <button class="btn-visit btn-large"><i class="fas fa-save"></i> ${ed ? 'Salvar alterações' : 'Adicionar planejamento'}</button>${ed ? ' <button type="button" class="btn-visit" id="p-x" style="background:#6c7a7b">Cancelar</button>' : ''}</form>` : somenteLeitura}
      <div class="rc-filtros"><div class="form-row"><label for="p-fil">Filtrar por situação</label><select id="p-fil"><option value="">Todas</option>${STATUS.map(s => `<option${s === S.fil ? ' selected' : ''}>${s}</option>`).join('')}</select></div></div>
      <h4>Planejamentos (${lista.length})</h4>${lista.length ? `<table class="doc-table"><thead><tr><th>Título</th><th>Período</th><th>Situação</th><th>Responsável</th><th>Voluntários</th><th>Detalhes</th>${edita ? '<th></th>' : ''}</tr></thead><tbody>${lista.map(p => `<tr><td><strong>${esc(p.titulo)}</strong></td><td>${periodo(p)}</td><td>${badge(p.status)}</td><td>${esc(p.resp || '-')}</td><td>${p.voluntarios === '' || p.voluntarios == null ? '-' : esc(p.voluntarios)}</td><td>${p.materiais ? `<small><strong>Materiais:</strong> ${esc(p.materiais)}</small><br>` : ''}${esc(p.descricao || '')}</td>${edita ? `<td><button class="btn-visit" data-ed="${esc(p.id)}">Editar</button> <button class="btn-visit" data-del="${esc(p.id)}" style="background:#a33">Excluir</button></td>` : ''}</tr>`).join('')}</tbody></table>
      <p class="no-print"><button class="btn-visit" id="p-csv"><i class="fas fa-file-csv"></i> Baixar (CSV)</button></p>` : '<p class="vazio">Nenhum planejamento.</p>'}`;
      $('#p-fil', el).onchange = e => { S.fil = e.target.value; S.msg = ''; draw(); };
      el.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { S.edit = b.dataset.ed; S.msg = ''; draw(); });
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Excluir este planejamento?')) { db.set('multiuso_planos', planos().filter(p => p.id !== b.dataset.del)); S.edit = ''; draw(); } });
      const c = $('#p-csv', el); if (c) c.onclick = () => {
        const rows = [['Título', 'Início', 'Fim', 'Situação', 'Responsável', 'Voluntários', 'Materiais', 'Descrição']].concat(planos().map(p => [p.titulo, fmtData(p.inicio), fmtData(p.fim), p.status, p.resp, p.voluntarios, p.materiais, p.descricao]));
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = `multiuso-planejamentos-${hoje()}.csv`; a.click();
      };
      const f = $('#mu-f', el); if (!f) return;
      const x = $('#p-x', el); if (x) x.onclick = () => { S.edit = ''; draw(); };
      f.onsubmit = e => {
        e.preventDefault(); if (!edita) return;
        const er = $('#p-er', el), falha = m => { er.textContent = m; er.hidden = false; };
        if (!campo(el, 'p-t')) return falha('Informe o título.');
        if (campo(el, 'p-i') && campo(el, 'p-f') && campo(el, 'p-f') < campo(el, 'p-i')) return falha('O fim não pode ser antes do início.');
        const vol = campo(el, 'p-v');
        const reg = { id: ed ? ed.id : uid(), titulo: campo(el, 'p-t'), inicio: campo(el, 'p-i'), fim: campo(el, 'p-f'), status: campo(el, 'p-s'), resp: campo(el, 'p-r'), voluntarios: vol === '' ? '' : Math.max(0, parseInt(vol, 10) || 0), materiais: campo(el, 'p-ma'), descricao: campo(el, 'p-d'), por: me.nome };
        const l = planos().filter(p => p.id !== reg.id); l.push(reg);
        if (!salvar('multiuso_planos', l, el, falha)) return;
        S.edit = ''; S.msg = ed ? 'Planejamento atualizado.' : 'Planejamento adicionado.'; draw();
      };
    };

    /* ---- Regras e informações ---- */
    const abaInfo = el => {
      const v = info();
      el.innerHTML = `<h3><i class="fas fa-clipboard-list"></i> Regras e informações do Multiuso</h3>${aviso()}
      <form id="mu-f" class="form-reserva" novalidate>
        <div class="form-row"><label for="i-r">Responsável pelo espaço</label><input id="i-r" maxlength="100" value="${esc(v.resp || '')}" ${edita ? '' : 'readonly'}></div>
        <div class="form-row"><label for="i-c">Contato do responsável</label><input id="i-c" maxlength="100" value="${esc(v.contato || '')}" ${edita ? '' : 'readonly'}></div>
        <div class="form-row"><label for="i-g">Regras de uso</label><textarea id="i-g" rows="8" maxlength="4000" ${edita ? '' : 'readonly'} placeholder="Como reservar, cuidados com o espaço, limpeza, horários, o que é permitido.">${esc(v.regras || '')}</textarea></div>
        <div class="form-row"><label for="i-o">Observações</label><textarea id="i-o" rows="4" maxlength="2000" ${edita ? '' : 'readonly'}>${esc(v.obs || '')}</textarea></div>
        ${v.atualizadoEm ? `<p class="vazio">Última atualização: ${esc(fmtData(v.atualizadoEm))}${v.por ? ' por ' + esc(v.por) : ''}.</p>` : ''}
        ${edita ? '<button class="btn-visit btn-large"><i class="fas fa-save"></i> Salvar</button>' : somenteLeitura}
      </form>`;
      $('#mu-f', el).onsubmit = e => {
        e.preventDefault(); if (!edita) return;
        if (!db.set('multiuso_info', { resp: campo(el, 'i-r'), contato: campo(el, 'i-c'), regras: $('#i-g', el).value.trim(), obs: $('#i-o', el).value.trim(), atualizadoEm: hoje(), por: me.nome })) { S.msg = 'Não foi possível salvar.'; return draw(); }
        S.msg = 'Informações salvas.'; draw();
      };
    };

    /* ---- Documentos ---- */
    const abaDocs = el => {
      const lista = docs().slice().sort((a, b) => (b.data || '').localeCompare(a.data || ''));
      el.innerHTML = `<h3><i class="fas fa-folder-open"></i> Documentos do Multiuso</h3>${aviso()}
      <p>Regras, plantas, autorizações, orçamentos e outros documentos. Informe o <strong>link</strong> (ex.: pasta no Drive) e/ou anexe um arquivo pequeno (PDF ou imagem, até 1 MB).</p>
      ${edita ? `<form id="mu-f" class="form-reserva" novalidate>
        <div class="form-row"><label for="d-t">Título *</label><input id="d-t" maxlength="100"></div>
        <div class="form-row"><label for="d-c">Categoria</label><select id="d-c">${CATS.map(c => `<option>${c}</option>`).join('')}</select></div>
        <div class="form-row"><label for="d-dt">Data do documento</label><input id="d-dt" type="date" value="${hoje()}"></div>
        <div class="form-row"><label for="d-l">Link (https://...)</label><input id="d-l" type="url" maxlength="400" placeholder="https://drive.google.com/..."></div>
        <div class="form-row"><label for="d-f">Arquivo (PDF ou imagem, até 1 MB)</label><input id="d-f" type="file" accept=".pdf,image/*"></div>
        <div class="form-row"><label for="d-o">Descrição</label><textarea id="d-o" rows="2" maxlength="400"></textarea></div>
        <p class="form-erro" id="d-er" role="alert" hidden></p><button class="btn-visit btn-large"><i class="fas fa-plus"></i> Adicionar documento</button></form>` : somenteLeitura}
      <h4>Documentos (${lista.length})</h4>${lista.length ? `<table class="doc-table"><thead><tr><th>Título</th><th>Categoria</th><th>Data</th><th>Abrir</th>${edita ? '<th></th>' : ''}</tr></thead><tbody>${lista.map(d => `<tr><td><strong>${esc(d.titulo)}</strong>${d.desc ? `<br><small>${esc(d.desc)}</small>` : ''}</td><td>${esc(d.cat)}</td><td>${fmtData(d.data) || '-'}</td><td>${d.link && /^https?:\/\//i.test(d.link) ? `<a href="${esc(d.link)}" target="_blank" rel="noopener">Link</a>` : ''}${d.arq && safeUrl(d.arq) ? ` <a href="${esc(d.arq)}" download="${esc(d.nomeArq || 'documento')}">Arquivo</a>` : ''}</td>${edita ? `<td><button class="btn-visit" data-del="${esc(d.id)}" style="background:#a33">Excluir</button></td>` : ''}</tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhum documento.</p>'}`;
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Excluir este documento?')) { db.set('multiuso_docs', docs().filter(d => d.id !== b.dataset.del)); draw(); } });
      const f = $('#mu-f', el); if (!f) return;
      f.onsubmit = e => {
        e.preventDefault();
        const er = $('#d-er', el), falha = m => { er.textContent = m; er.hidden = false; }, arq = $('#d-f', el).files[0]; er.hidden = true;
        if (!campo(el, 'd-t')) return falha('Informe o título.');
        if (campo(el, 'd-l') && !/^https?:\/\//i.test(campo(el, 'd-l'))) return falha('O link precisa começar com http:// ou https://.');
        if (!campo(el, 'd-l') && !arq) return falha('Informe um link ou anexe um arquivo.');
        if (arq && arq.size > MAXARQ) return falha('Arquivo maior que 1 MB. Guarde-o no Drive e informe o link.');
        const salva = dados => {
          const l = docs(); l.push({ id: uid(), titulo: campo(el, 'd-t'), cat: campo(el, 'd-c'), data: campo(el, 'd-dt'), link: campo(el, 'd-l'), desc: campo(el, 'd-o'), arq: dados || '', nomeArq: arq ? arq.name.slice(0, 80) : '', por: me.nome, criado: hoje() });
          if (!db.set('multiuso_docs', l)) return falha('Sem espaço no navegador. Use o link em vez do arquivo.');
          S.msg = 'Documento adicionado.'; draw();
        };
        if (arq) { const r = new FileReader(); r.onload = () => safeUrl(r.result) ? salva(r.result) : falha('Tipo de arquivo não aceito (use PDF ou imagem).'); r.onerror = () => falha('Não foi possível ler o arquivo.'); r.readAsDataURL(arq); } else salva('');
      };
    };

    const draw = () => {
      root.innerHTML = `<div class="tabs sub" role="tablist">${SUB.map(t => `<button class="tab-btn${t[0] === S.sub ? ' active' : ''}" data-s="${t[0]}">${t[1]}</button>`).join('')}</div><div id="mu-sub"></div>`;
      root.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { S.sub = b.dataset.s; S.edit = ''; S.fil = ''; S.msg = ''; draw(); });
      const el = $('#mu-sub', root);
      ({ agenda: abaAgenda, planos: abaPlanos, info: abaInfo, docs: abaDocs })[S.sub](el);
    };
    draw();
  }
};
})();
