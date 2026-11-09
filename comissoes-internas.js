// Comissões internas (área restrita > Comissões Parque Retiro): Construção, Manutenção e Traduções.
// Só existem na área restrita: não têm página pública nem aparecem no menu do site.
// Cada comissão tem: uma lista de trabalhos (obras, pedidos de manutenção ou traduções), Documentos e Resumo.
// Dados: '<chave>_itens' e '<chave>_docs' (constr_*, manut_*, trad_*). Edita: responsável da comissão ou administrador.
(function () {
const MAXARQ = 1024 * 1024; // 1 MB (os dados ficam no armazenamento do navegador)
const IDIOMAS = ['Português', 'Espanhol', 'Italiano', 'Francês', 'Inglês', 'Alemão', 'Outro'];

const COMISSOES = {
  construcao: {
    nome: 'Construção', icone: 'fa-hard-hat', func: 'construcao', chave: 'constr',
    aba: 'Obras e etapas', item: 'obra ou etapa', novo: 'Nova obra ou etapa',
    desc: 'Obras e etapas de construção do Parque: o que será feito, onde, quando, com que materiais e quanto deve custar.',
    status: ['Planejado', 'Em andamento', 'Concluído', 'Adiado'], abertos: ['Planejado', 'Em andamento'],
    rotInicio: 'Início previsto', rotFim: 'Fim previsto', rotResp: 'Responsável pela obra',
    phTitulo: 'Ex.: Cobertura do Centro de Estudo',
    campos: [
      { k: 'local', rot: 'Local / área do Parque', tipo: 'text', max: 100, ph: 'Ex.: Centro de Estudo, alojamentos, muro dos fundos' },
      { k: 'custo', rot: 'Custo estimado (R$)', tipo: 'num' },
      { k: 'voluntarios', rot: 'Voluntários necessários', tipo: 'int' },
      { k: 'materiais', rot: 'Materiais e ferramentas', tipo: 'area', max: 500 }
    ],
    colunas: ['local', 'custo', 'voluntarios'],
    cats: ['Projeto / planta', 'Orçamento', 'Licença / autorização', 'Contrato', 'Fotos', 'Outro']
  },
  manutencao: {
    nome: 'Manutenção', icone: 'fa-tools', func: 'manutencao', chave: 'manut',
    aba: 'Pedidos de manutenção', item: 'pedido de manutenção', novo: 'Novo pedido de manutenção',
    desc: 'Consertos e cuidados periódicos do Parque: o que precisa de reparo, a prioridade e o andamento de cada pedido.',
    status: ['Aberto', 'Em andamento', 'Concluído', 'Adiado'], abertos: ['Aberto', 'Em andamento'],
    rotInicio: 'Data do pedido', rotFim: 'Prazo', rotResp: 'Responsável pelo serviço',
    phTitulo: 'Ex.: Trocar a torneira da cozinha',
    campos: [
      { k: 'local', rot: 'Local / área do Parque', tipo: 'text', max: 100, ph: 'Ex.: cozinha, quarto Paz, caixa d\'água' },
      { k: 'tipoMan', rot: 'Tipo', tipo: 'sel', ops: ['Corretiva (conserto)', 'Preventiva (cuidado periódico)'] },
      { k: 'prioridade', rot: 'Prioridade', tipo: 'sel', ops: ['Baixa', 'Média', 'Alta', 'Urgente'], padrao: 'Média' },
      { k: 'custo', rot: 'Custo estimado (R$)', tipo: 'num' },
      { k: 'materiais', rot: 'Materiais e peças', tipo: 'area', max: 500 }
    ],
    colunas: ['local', 'tipoMan', 'prioridade', 'custo'],
    cats: ['Manual / garantia', 'Orçamento', 'Nota fiscal', 'Fotos', 'Outro']
  },
  traducoes: {
    nome: 'Traduções', icone: 'fa-language', func: 'traducoes', chave: 'trad',
    aba: 'Traduções', item: 'tradução', novo: 'Nova tradução',
    desc: 'Traduções de textos, materiais e conteúdos do Parque: de qual idioma, para qual, quem traduz, quem revisa e o prazo.',
    status: ['A fazer', 'Em tradução', 'Em revisão', 'Concluído'], abertos: ['A fazer', 'Em tradução', 'Em revisão'],
    rotInicio: 'Data do pedido', rotFim: 'Prazo', rotResp: 'Tradutor(a)',
    phTitulo: 'Ex.: Folheto de boas-vindas do Parque',
    campos: [
      { k: 'origem', rot: 'Idioma de origem', tipo: 'sel', ops: IDIOMAS, padrao: 'Português' },
      { k: 'destino', rot: 'Idioma de destino', tipo: 'sel', ops: IDIOMAS, padrao: 'Espanhol' },
      { k: 'revisor', rot: 'Revisor(a)', tipo: 'text', max: 80 },
      { k: 'link', rot: 'Link do material (https://...)', tipo: 'url', max: 400, ph: 'https://drive.google.com/...' }
    ],
    colunas: ['origem', 'destino', 'revisor', 'link'],
    cats: ['Texto original', 'Tradução', 'Glossário', 'Outro']
  }
};

window.PR_COMISSOES_INTERNAS = {
  COMISSOES,
  abrir(id, me, root, H) {
    const C = COMISSOES[id]; if (!C) { root.innerHTML = '<p class="vazio">Comissão desconhecida.</p>'; return; }
    const { esc, $, db, uid, hoje, fmtData, safeUrl, csv } = H;
    const edita = H.tem(me, C.func);
    const KI = C.chave + '_itens', KD = C.chave + '_docs';
    const S = { sub: 'itens', edit: '', fil: '', msg: '' };
    const itens = () => db.get(KI, []), docs = () => db.get(KD, []);
    const campo = k => C.campos.find(c => c.k === k);
    const dinheiro = v => v === '' || v == null ? '-' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const valor = (p, k) => {
      const c = campo(k), v = p[k];
      if (v === '' || v == null) return '-';
      if (k === 'custo') return dinheiro(v);
      if (c && c.tipo === 'url') return safeUrl(v) ? `<a href="${esc(v)}" target="_blank" rel="noopener">Abrir</a>` : '-';
      return esc(v);
    };
    const concluido = s => s === 'Concluído';
    const badge = s => `<span class="badge-status ${concluido(s) ? 'badge-disponivel' : s === 'Adiado' ? 'badge-emprestado' : 'badge-pend'}">${esc(s)}</span>`;
    const periodo = p => p.inicio || p.fim ? `${p.inicio ? fmtData(p.inicio) : '-'}${p.fim ? ' a ' + fmtData(p.fim) : ''}` : '-';
    const aviso = () => S.msg ? `<p class="tip-box" role="status">${esc(S.msg)}</p>` : '';
    const SUB = [['itens', C.aba], ['docs', 'Documentos'], ['resumo', 'Resumo']];
    const soLeitura = `Somente quem é responsável pela comissão ${C.nome} (ou o administrador) altera.`;

    const entrada = (c, v) => {
      const id = 'ci-' + c.k, val = v[c.k] == null ? '' : v[c.k];
      if (c.tipo === 'sel') return `<div class="form-row"><label for="${id}">${c.rot}</label><select id="${id}">${c.ops.map(o => `<option${o === (val || c.padrao) ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`;
      if (c.tipo === 'area') return `<div class="form-row"><label for="${id}">${c.rot}</label><textarea id="${id}" rows="2" maxlength="${c.max || 500}">${esc(val)}</textarea></div>`;
      if (c.tipo === 'num') return `<div class="form-row"><label for="${id}">${c.rot}</label><input id="${id}" type="number" min="0" step="0.01" max="99999999" value="${esc(val)}"></div>`;
      if (c.tipo === 'int') return `<div class="form-row"><label for="${id}">${c.rot}</label><input id="${id}" type="number" min="0" max="999" value="${esc(val)}"></div>`;
      return `<div class="form-row"><label for="${id}">${c.rot}</label><input id="${id}"${c.tipo === 'url' ? ' type="url"' : ''} maxlength="${c.max || 100}" value="${esc(val)}" placeholder="${esc(c.ph || '')}"></div>`;
    };

    /* ---- Lista de trabalhos (obras, pedidos ou traduções) ---- */
    const abaItens = el => {
      const ed = S.edit ? itens().find(p => p.id === S.edit) : null;
      const v = ed || { titulo: '', inicio: C.rotInicio === 'Data do pedido' ? hoje() : '', fim: '', status: C.status[0], resp: '', descricao: '' };
      const lista = itens().filter(p => !S.fil || p.status === S.fil).sort((a, b) => (a.fim || a.inicio || '9999').localeCompare(b.fim || b.inicio || '9999'));
      el.innerHTML = `<h3><i class="fas ${C.icone}"></i> ${esc(C.aba)}</h3><p>${esc(C.desc)}</p>${aviso()}
      ${edita ? `<form id="ci-f" class="form-reserva" novalidate>
        <h4>${ed ? 'Editar ' + esc(C.item) : esc(C.novo)}</h4>
        <div class="form-row"><label for="ci-t">Título *</label><input id="ci-t" maxlength="100" value="${esc(v.titulo)}" placeholder="${esc(C.phTitulo)}"></div>
        <div class="form-row"><label for="ci-i">${C.rotInicio}</label><input id="ci-i" type="date" value="${esc(v.inicio)}"></div>
        <div class="form-row"><label for="ci-fi">${C.rotFim}</label><input id="ci-fi" type="date" value="${esc(v.fim)}"></div>
        <div class="form-row"><label for="ci-s">Situação</label><select id="ci-s">${C.status.map(s => `<option${s === v.status ? ' selected' : ''}>${s}</option>`).join('')}</select></div>
        <div class="form-row"><label for="ci-r">${C.rotResp}</label><input id="ci-r" maxlength="80" value="${esc(v.resp)}"></div>
        ${C.campos.map(c => entrada(c, v)).join('')}
        <div class="form-row"><label for="ci-d">Descrição / observações</label><textarea id="ci-d" rows="3" maxlength="2000">${esc(v.descricao)}</textarea></div>
        <p class="form-erro" id="ci-er" role="alert" hidden></p>
        <button class="btn-visit btn-large"><i class="fas fa-save"></i> ${ed ? 'Salvar alterações' : 'Adicionar'}</button>${ed ? ' <button type="button" class="btn-visit" id="ci-x" style="background:#6c7a7b">Cancelar</button>' : ''}
      </form>` : `<p class="vazio">Você pode consultar. ${soLeitura}</p>`}
      <div class="rc-filtros"><div class="form-row"><label for="ci-fil">Filtrar por situação</label><select id="ci-fil"><option value="">Todas</option>${C.status.map(s => `<option${s === S.fil ? ' selected' : ''}>${s}</option>`).join('')}</select></div></div>
      <h4>${esc(C.aba)} (${lista.length})</h4>${lista.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Título</th>${C.colunas.map(k => `<th>${esc(campo(k).rot.replace(/ \(.*\)$/, ''))}</th>`).join('')}<th>${C.rotInicio} / ${C.rotFim}</th><th>Situação</th><th>Detalhes</th>${edita ? '<th></th>' : ''}</tr></thead><tbody>${lista.map(p => `<tr><td><strong>${esc(p.titulo)}</strong>${p.resp ? `<br><small>${esc(C.rotResp)}: ${esc(p.resp)}</small>` : ''}</td>${C.colunas.map(k => `<td>${valor(p, k)}</td>`).join('')}<td>${periodo(p)}</td><td>${badge(p.status)}</td><td>${p.materiais ? `<small><strong>${esc((campo('materiais') || {}).rot || 'Materiais')}:</strong> ${esc(p.materiais)}</small><br>` : ''}${esc(p.descricao) || ''}</td>${edita ? `<td><button class="btn-visit" data-ed="${p.id}">Editar</button> <button class="icon-btn" data-del="${p.id}" aria-label="Excluir ${esc(p.titulo)}"><i class="fas fa-trash"></i></button></td>` : ''}</tr>`).join('')}</tbody></table></div>` : '<p class="vazio">Nada cadastrado ainda.</p>'}`;
      $('#ci-fil', el).onchange = e => { S.fil = e.target.value; S.msg = ''; draw(); };
      el.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { S.edit = b.dataset.ed; S.msg = ''; draw(); });
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Excluir este registro?')) { db.set(KI, itens().filter(p => p.id !== b.dataset.del)); S.edit = ''; draw(); } });
      const f = $('#ci-f', el); if (!f) return;
      const x = $('#ci-x', el); if (x) x.onclick = () => { S.edit = ''; draw(); };
      f.onsubmit = e => {
        e.preventDefault(); if (!edita) return;
        const g = id => { const i = $('#' + id, el); return i ? i.value.trim() : ''; }, er = $('#ci-er', el), falha = m => { er.textContent = m; er.hidden = false; };
        if (!g('ci-t')) return falha('Informe o título.');
        if (g('ci-i') && g('ci-fi') && g('ci-fi') < g('ci-i')) return falha(`${C.rotFim} não pode ser antes de ${C.rotInicio.toLowerCase()}.`);
        const extra = {};
        for (const c of C.campos) {
          const val = g('ci-' + c.k);
          if (c.tipo === 'num') extra[c.k] = val === '' ? '' : Math.max(0, Math.round((parseFloat(val.replace(',', '.')) || 0) * 100) / 100);
          else if (c.tipo === 'int') extra[c.k] = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
          else if (c.tipo === 'url') { if (val && !/^https?:\/\//i.test(val)) return falha('O link precisa começar com http:// ou https://.'); extra[c.k] = val; }
          else extra[c.k] = val;
        }
        if (extra.origem && extra.destino && extra.origem === extra.destino && extra.origem !== 'Outro') return falha('O idioma de destino precisa ser diferente do idioma de origem.');
        const reg = { id: ed ? ed.id : uid(), titulo: g('ci-t'), inicio: g('ci-i'), fim: g('ci-fi'), status: g('ci-s'), resp: g('ci-r'), descricao: g('ci-d'), ...extra, criado: ed ? ed.criado : hoje(), por: ed ? ed.por : me.nome, atualizado: hoje() };
        const l = itens().filter(p => p.id !== reg.id); l.push(reg);
        if (!db.set(KI, l)) return falha('Não foi possível salvar (espaço do navegador cheio?).');
        S.edit = ''; S.msg = ed ? 'Registro atualizado.' : 'Registro adicionado.'; draw();
      };
    };

    /* ---- Documentos ---- */
    const abaDocs = el => {
      const lista = docs().slice().sort((a, b) => (b.data || '').localeCompare(a.data || ''));
      el.innerHTML = `<h3><i class="fas fa-folder-open"></i> Documentos da comissão ${esc(C.nome)}</h3>${aviso()}
      <p>Informe o <strong>link</strong> (ex.: pasta no Drive) e/ou anexe um arquivo pequeno (PDF ou imagem, até 1 MB).</p>
      ${edita ? `<form id="ci-fd" class="form-reserva" novalidate>
        <div class="form-row"><label for="cd-t">Título *</label><input id="cd-t" maxlength="100"></div>
        <div class="form-row"><label for="cd-c">Categoria</label><select id="cd-c">${C.cats.map(c => `<option>${c}</option>`).join('')}</select></div>
        <div class="form-row"><label for="cd-dt">Data do documento</label><input id="cd-dt" type="date" value="${hoje()}"></div>
        <div class="form-row"><label for="cd-l">Link (https://...)</label><input id="cd-l" type="url" maxlength="400" placeholder="https://drive.google.com/..."></div>
        <div class="form-row"><label for="cd-f">Arquivo (PDF ou imagem, até 1 MB)</label><input id="cd-f" type="file" accept=".pdf,image/*"></div>
        <div class="form-row"><label for="cd-o">Descrição</label><textarea id="cd-o" rows="2" maxlength="400"></textarea></div>
        <p class="form-erro" id="cd-er" role="alert" hidden></p><button class="btn-visit btn-large"><i class="fas fa-plus"></i> Adicionar documento</button></form>` : `<p class="vazio">${soLeitura}</p>`}
      <h4>Documentos (${lista.length})</h4>${lista.length ? `<table class="doc-table"><thead><tr><th>Título</th><th>Categoria</th><th>Data</th><th>Abrir</th>${edita ? '<th></th>' : ''}</tr></thead><tbody>${lista.map(d => `<tr><td><strong>${esc(d.titulo)}</strong>${d.desc ? `<br><small>${esc(d.desc)}</small>` : ''}</td><td>${esc(d.cat)}</td><td>${fmtData(d.data) || '-'}</td><td>${d.link && safeUrl(d.link) ? `<a href="${esc(d.link)}" target="_blank" rel="noopener">Abrir link</a>` : ''}${d.link && d.arq ? '<br>' : ''}${d.arq && safeUrl(d.arq) ? `<a href="${esc(d.arq)}" download="${esc(d.nomeArq || 'documento')}">Baixar arquivo</a>` : ''}${!d.link && !d.arq ? '-' : ''}</td>${edita ? `<td><button class="icon-btn" data-del="${d.id}" aria-label="Excluir ${esc(d.titulo)}"><i class="fas fa-trash"></i></button></td>` : ''}</tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhum documento cadastrado.</p>'}`;
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Excluir este documento?')) { db.set(KD, docs().filter(d => d.id !== b.dataset.del)); draw(); } });
      const f = $('#ci-fd', el); if (!f) return;
      f.onsubmit = e => {
        e.preventDefault(); if (!edita) return;
        const g = id => $('#' + id, el).value.trim(), er = $('#cd-er', el), falha = m => { er.textContent = m; er.hidden = false; }, arq = $('#cd-f', el).files[0];
        er.hidden = true;
        if (!g('cd-t')) return falha('Informe o título.');
        if (g('cd-l') && !/^https?:\/\//i.test(g('cd-l'))) return falha('O link precisa começar com http:// ou https://.');
        if (!g('cd-l') && !arq) return falha('Informe um link ou anexe um arquivo.');
        if (arq && arq.size > MAXARQ) return falha('Arquivo maior que 1 MB. Guarde-o no Drive e informe o link.');
        const salva = dados => {
          const l = docs(); l.push({ id: uid(), titulo: g('cd-t'), cat: g('cd-c'), data: g('cd-dt'), link: g('cd-l'), desc: g('cd-o'), arq: dados || '', nomeArq: arq ? arq.name.slice(0, 80) : '', por: me.nome, criado: hoje() });
          if (!db.set(KD, l)) return falha('Sem espaço no navegador. Use o link em vez do arquivo.');
          S.msg = 'Documento adicionado.'; draw();
        };
        if (arq) { const r = new FileReader(); r.onload = () => safeUrl(r.result) ? salva(r.result) : falha('Tipo de arquivo não aceito (use PDF ou imagem).'); r.onerror = () => falha('Não foi possível ler o arquivo.'); r.readAsDataURL(arq); } else salva('');
      };
    };

    /* ---- Resumo ---- */
    const resumo = el => {
      const ps = itens(), abertos = ps.filter(p => C.abertos.includes(p.status));
      const temCusto = !!campo('custo'), custo = ps.filter(p => p.status !== 'Adiado').reduce((t, p) => t + (+p.custo || 0), 0);
      const atrasados = abertos.filter(p => p.fim && p.fim < hoje());
      const urgentes = campo('prioridade') ? abertos.filter(p => p.prioridade === 'Urgente' || p.prioridade === 'Alta') : [];
      const prox = abertos.filter(p => p.fim || p.inicio).sort((a, b) => (a.fim || a.inicio).localeCompare(b.fim || b.inicio)).slice(0, 5);
      el.innerHTML = `<h3><i class="fas fa-chart-pie"></i> Resumo da comissão ${esc(C.nome)}</h3>
      <table class="doc-table"><thead><tr>${C.status.map(s => `<th>${s}</th>`).join('')}<th>Total</th></tr></thead><tbody><tr>${C.status.map(s => `<td>${ps.filter(p => p.status === s).length}</td>`).join('')}<td><strong>${ps.length}</strong></td></tr></tbody></table>
      <div class="totais"><div><span>Em aberto</span><strong>${abertos.length}</strong></div><div><span>Com ${C.rotFim.toLowerCase()} vencido</span><strong>${atrasados.length}</strong></div>${campo('prioridade') ? `<div><span>Alta ou urgente (em aberto)</span><strong>${urgentes.length}</strong></div>` : ''}${temCusto ? `<div><span>Custo estimado (sem adiados)</span><strong>${dinheiro(Math.round(custo * 100) / 100)}</strong></div>` : ''}<div><span>Documentos</span><strong>${docs().length}</strong></div></div>
      <h4>Próximos prazos</h4>${prox.length ? `<ul>${prox.map(p => `<li><strong>${esc(p.titulo)}</strong> - ${periodo(p)} - ${esc(p.status)}${p.resp ? ' - ' + esc(p.resp) : ''}</li>`).join('')}</ul>` : '<p class="vazio">Nenhum trabalho em aberto com data.</p>'}
      <p class="no-print"><button class="btn-visit" id="ci-csv"><i class="fas fa-file-csv"></i> Baixar lista (CSV)</button> <button class="btn-visit" id="ci-pr"><i class="fas fa-print"></i> Imprimir</button></p>`;
      $('#ci-pr', el).onclick = () => window.print();
      $('#ci-csv', el).onclick = () => {
        const cab = ['Título', C.rotInicio, C.rotFim, 'Situação', C.rotResp].concat(C.campos.map(c => c.rot), ['Descrição']);
        const rows = [cab].concat(itens().map(p => [p.titulo, fmtData(p.inicio), fmtData(p.fim), p.status, p.resp].concat(C.campos.map(c => p[c.k] == null ? '' : p[c.k]), [p.descricao])));
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = `comissao-${id}-${hoje()}.csv`; a.click();
      };
    };

    const draw = () => {
      root.innerHTML = `<div class="tabs sub" role="tablist">${SUB.map(t => `<button class="tab-btn${t[0] === S.sub ? ' active' : ''}" data-s="${t[0]}">${esc(t[1])}</button>`).join('')}</div><div id="ci-sub"></div>`;
      root.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { S.sub = b.dataset.s; S.edit = ''; S.fil = ''; S.msg = ''; draw(); });
      const el = $('#ci-sub', root);
      S.sub === 'docs' ? abaDocs(el) : S.sub === 'resumo' ? resumo(el) : abaItens(el);
    };
    draw();
  }
};
})();
