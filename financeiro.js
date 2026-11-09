// Relatório Consolidado - Orçamento e Fluxo Financeiro (modelo: planilha "Orçamento e Planejamento Familiar").
// Colunas: cada mês em Previsto x Realizado + total do ano + comentários.
// Realizado = soma automática dos lançamentos da aba Prestação de Contas (entradas e saídas).
// Previsto = valores digitados aqui (guardados em 'orcamento', por ano), comentários em 'orcamento_com'.
(function () {
const MES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const ORIGENS = ['Doação', 'Livraria', 'Lojinha', 'Rifa Solidária', 'Vaquinha Coletiva'];
// Receita própria do Parque (não faz parte do subtotal "Ajude o Parque"): diárias do Alojamento do Parque Retiro e da ASSEFAZ.
const ORIG_ALOJ = 'Reservas de Alojamentos';
const FIXAS = ORIGENS.length + 1; // linhas fixas de Receitas na visão por tipo
// Demais entradas e todas as categorias de saída vêm do plano de contas (plano-contas.js).
const plano = () => window.PR_PLANO || { ENTRADAS: [], SAIDAS: [] };
const OUTRAS_R = () => plano().ENTRADAS.flatMap(g => g.itens).filter(i => !ORIGENS.includes(i) && i !== ORIG_ALOJ);
const SAIDAS_FLAT = () => plano().SAIDAS.flatMap(g => g.itens);
const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cel = v => v === 0 ? '–' : fmt(v);
const r2 = v => Math.round(v * 100) / 100;

window.PR_FINANCEIRO = {
  abrir(me, root, H) {
    const { esc, $, db, hoje, fmtData, CC, MOEDA, normConta } = H;
    const hj = hoje(), anoAtual = +hj.slice(0, 4), mesAtual = +hj.slice(5, 7) - 1;
    const S = { ano: anoAtual, modo: 'categoria', moeda: '', aberto: new Set() };
    const kmod = sec => (S.modo === 'categoria' && sec === 'R') ? 'tipo' : S.modo; // as receitas por tipo compartilham o previsto
    const todas = () => db.get('contas', []).map(normConta);
    const anos = () => [...new Set([anoAtual, ...todas().map(c => +String(c.data).slice(0, 4)).filter(Boolean), ...Object.keys(db.get('orcamento', {})).map(Number).filter(Boolean), ...Object.keys(db.get('compras_plano', {})).map(Number).filter(Boolean)])].sort((a, b) => b - a);
    const padrao = sec => sec === 'R' ? (S.modo === 'centro' ? Object.keys(CC) : ORIGENS.concat(ORIG_ALOJ, OUTRAS_R())) : (S.modo === 'categoria' ? SAIDAS_FLAT() : Object.keys(CC));
    const rotulo = (c, sec) => sec === 'R' ? (S.modo === 'centro' ? c.centro : (c.origem || 'Outras entradas')) : (S.modo === 'categoria' ? (c.origem || 'Outras saídas') : c.centro);
    const semPrev = () => !!S.moeda; // o previsto vale para todas as moedas somadas
    let M = {}, PL = {};

    const monta = () => {
      const lc = todas().filter(c => String(c.data).slice(0, 4) === String(S.ano) && (!S.moeda || c.moeda === S.moeda));
      const orc = db.get('orcamento', {})[S.ano] || {}, com = db.get('orcamento_com', {})[S.ano] || {};
      PL = window.PR_COMPRAS && window.PR_COMPRAS.previstoDoPlano ? window.PR_COMPRAS.previstoDoPlano(db, S.ano) : {}; // despesas vindas do Planejamento anual (Compras e Orçamento)
      M = {};
      ['R', 'D'].forEach(sec => {
        const rows = {};
        const get = lab => rows[lab] = rows[lab] || { lab, key: `${kmod(sec)}|${sec}|${lab}`, prev: Array(12).fill(0), real: Array(12).fill(0), lanc: [] };
        padrao(sec).forEach(get);
        Object.keys(orc).concat(Object.keys(PL)).forEach(k => { const p = k.split('|'); if (p[0] === kmod(sec) && p[1] === sec) get(p.slice(2).join('|')); });
        lc.filter(c => (c.tipo === 'Entrada') === (sec === 'R')).forEach(c => {
          const r = get(rotulo(c, sec)), m = +String(c.data).slice(5, 7) - 1;
          if (m >= 0 && m < 12) { r.real[m] += c.valor; r.lanc.push(c); }
        });
        Object.values(rows).forEach(r => { const b = orc[r.key], q = PL[r.key]; r.plano = q ? q.slice() : Array(12).fill(0); for (let m = 0; m < 12; m++) r.prev[m] = Math.max(0, r2((b ? +b[m] || 0 : 0) + r.plano[m])); r.real = r.real.map(r2); r.com = com[r.key] || ''; });
        M[sec] = Object.values(rows);
      });
    };

    // Totais calculados a partir do modelo (usados na tela e no CSV)
    const calc = () => {
      const T = {};
      ['R', 'D'].forEach(sec => {
        T[sec] = { p: Array(13).fill(0), r: Array(13).fill(0), rows: M[sec].map(r => ({ p: r.prev.reduce((a, b) => a + b, 0), r: r.real.reduce((a, b) => a + b, 0) })) };
        M[sec].forEach(r => { for (let m = 0; m < 12; m++) { T[sec].p[m] += r.prev[m]; T[sec].r[m] += r.real[m]; } });
        for (let m = 0; m < 12; m++) { T[sec].p[12] += T[sec].p[m]; T[sec].r[12] += T[sec].r[m]; }
      });
      // Subtotal "Ajude o Parque": as origens Doação, Livraria, Lojinha, Rifa Solidária e Vaquinha Coletiva (só na visão por tipo)
      T.A = { p: Array(13).fill(0), r: Array(13).fill(0) };
      if (S.modo !== 'centro') M.R.slice(0, ORIGENS.length).forEach(r => { for (let m = 0; m < 12; m++) { T.A.p[m] += r.prev[m]; T.A.r[m] += r.real[m]; T.A.p[12] += r.prev[m]; T.A.r[12] += r.real[m]; } });
      T.xp = T.R.p.map((v, m) => r2(v - T.D.p[m])); T.xr = T.R.r.map((v, m) => r2(v - T.D.r[m]));
      T.ap = []; T.ar = []; let ap = 0, ar = 0;
      for (let m = 0; m < 12; m++) { ap += T.xp[m]; ar += T.xr[m]; T.ap[m] = r2(ap); T.ar[m] = r2(ar); }
      T.ap[12] = T.ap[11]; T.ar[12] = T.ar[11];
      return T;
    };
    // situação do realizado em relação ao previsto (só para meses já iniciados)
    const status = (sec, p, r, m) => {
      if (semPrev() || !(p > 0) || (S.ano > anoAtual) || (S.ano === anoAtual && m !== 12 && m > mesAtual)) return '';
      if (m === 12 && S.ano === anoAtual) return '';
      return sec === 'R' ? (r >= p ? 'ok' : 'baixo') : (r <= p ? 'ok' : 'acima');
    };

    const detalhe = r => {
      const l = r.lanc.slice().sort((a, b) => a.data.localeCompare(b.data));
      return `<tr class="rf-det"><td colspan="29"><div class="rf-det-in">${l.length ? `<table class="doc-table"><thead><tr><th>Data</th><th>Descrição</th><th>Origem / tipo</th><th>Centro de custo</th><th>Moeda</th><th>Valor</th></tr></thead><tbody>${l.map(c => `<tr><td>${fmtData(c.data)}</td><td>${esc(c.desc) || '-'}${c.vaquinha ? ` <small>(${esc(c.vaquinha)})</small>` : ''}</td><td>${esc(c.tipo)}${c.origem ? ' / ' + esc(c.origem) : ''}</td><td>${esc(c.centro)}</td><td>${esc(MOEDA[c.moeda])}</td><td>${H.money(c.valor, c.moeda)}</td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhum lançamento neste item no ano.</p>'}</div></td></tr>`;
    };

    const linhas = (sec, de = 0, ate = 1e9) => M[sec].map((r, ri) => {
      if (ri < de || ri >= ate) return '';
      const pc = Array.from({ length: 12 }, (_, m) => `${semPrev() ? '<td class="rf-p">–</td>' : `<td class="rf-p"><input type="number" min="0" step="0.01" data-b="${esc(r.key)}" data-m="${m}" value="${r.prev[m] || ''}"${r.plano[m] ? ` class="rf-plan" style="background:#fff3d6" title="Inclui ${fmt(r.plano[m])} do Planejamento anual (Compras e Orçamento)"` : ''} aria-label="Previsto de ${esc(r.lab)} em ${MES[m]}${r.plano[m] ? ' (inclui o planejamento anual)' : ''}"></td>`}<td class="rf-r" data-k="rr|${sec}|${ri}|${m}"></td>`).join('');
      const aberto = S.aberto.has(r.key);
      return `<tr><th class="rf-l"><button type="button" class="rf-ex" data-ex="${esc(r.key)}" aria-expanded="${aberto}" title="Ver lançamentos deste item">${aberto ? '▾' : '▸'} ${esc(r.lab)}</button>${semPrev() ? '' : `<button type="button" class="rf-rep" data-rep="${esc(r.key)}" title="Repetir o primeiro valor previsto nos meses seguintes" aria-label="Repetir previsto de ${esc(r.lab)}"><i class="fas fa-arrow-right"></i></button>`}</th>${pc}<td class="rf-p rf-tot" data-k="rp|${sec}|${ri}|12"></td><td class="rf-r rf-tot" data-k="rr|${sec}|${ri}|12"></td><td class="rf-c"><input type="text" maxlength="200" data-cm="${esc(r.key)}" value="${esc(r.com)}" aria-label="Comentário sobre ${esc(r.lab)}"></td></tr>${aberto ? detalhe(r) : ''}`;
    }).join('');
    const parLinha = (cls, rot, kp, kr, comentario) => `<tr class="${cls}"><th class="rf-l">${rot}</th>${Array.from({ length: 13 }, (_, m) => `<td class="rf-p${m === 12 ? ' rf-tot' : ''}" data-k="${kp}|${m}"></td><td class="rf-r${m === 12 ? ' rf-tot' : ''}" data-k="${kr}|${m}"></td>`).join('')}<td class="rf-c">${comentario || ''}</td></tr>`;
    // Despesas por categoria: gastos fixos (Luz, Internet, Limpeza do Parque...) e demais grupos do plano de contas.
    const despesasPorGrupo = () => {
      let off = 0, out = '';
      plano().SAIDAS.forEach(g => { out += banda(g.grupo) + linhas('D', off, off + g.itens.length); off += g.itens.length; });
      return out + (M.D.length > off ? banda('Outras categorias') + linhas('D', off) : '');
    };
    const banda = t => `<tr class="rf-banda"><th class="rf-l">${t}</th><td colspan="27"></td></tr>`;

    // Preenche os valores calculados nas células (rápido; não recria a tabela, para não perder o foco ao digitar)
    const pinta = () => {
      const T = calc(), cells = {};
      root.querySelectorAll('[data-k]').forEach(e => { cells[e.dataset.k] = e; });
      const put = (k, v, cls, neg) => { const e = cells[k]; if (!e) return; e.textContent = cel(v); e.className = e.className.replace(/\b(ok|baixo|acima|neg)\b/g, '').trim() + (cls ? ' ' + cls : '') + (neg && v < 0 ? ' neg' : ''); };
      ['R', 'D'].forEach(sec => {
        M[sec].forEach((r, ri) => {
          for (let m = 0; m < 12; m++) put(`rr|${sec}|${ri}|${m}`, r.real[m], status(sec, r.prev[m], r.real[m], m));
          const t = T[sec].rows[ri];
          if (cells[`rp|${sec}|${ri}|12`]) { cells[`rp|${sec}|${ri}|12`].textContent = semPrev() ? '–' : cel(t.p); }
          put(`rr|${sec}|${ri}|12`, t.r, status(sec, t.p, t.r, 12));
        });
        for (let m = 0; m <= 12; m++) {
          cells[`sp|${sec}|${m}`].textContent = semPrev() ? '–' : cel(T[sec].p[m]);
          put(`sr|${sec}|${m}`, T[sec].r[m], status(sec, T[sec].p[m], T[sec].r[m], m));
        }
      });
      if (S.modo !== 'centro') for (let m = 0; m <= 12; m++) { if (cells[`sp|A|${m}`]) cells[`sp|A|${m}`].textContent = semPrev() ? '–' : cel(T.A.p[m]); put(`sr|A|${m}`, T.A.r[m], status('R', T.A.p[m], T.A.r[m], m)); }
      for (let m = 0; m <= 12; m++) {
        if (m < 12 || true) {
          if (semPrev()) { ['xp', 'ap'].forEach(k => { cells[`${k}|${m}`].textContent = '–'; }); } else { put(`xp|${m}`, T.xp[m] === undefined ? T.R.p[12] - T.D.p[12] : T.xp[m], '', true); put(`ap|${m}`, T.ap[m], '', true); }
          put(`xr|${m}`, T.xr[m] === undefined ? r2(T.R.r[12] - T.D.r[12]) : T.xr[m], '', true); put(`ar|${m}`, T.ar[m], '', true);
        }
      }
      // cartões de resumo
      const tot = (id, v, neg) => { const e = $('#' + id, root); if (e) { e.textContent = H.money(v, 'PIX'); e.style.color = neg && v < 0 ? '#b3261e' : ''; } };
      tot('rf-er', T.R.r[12]); tot('rf-sr', T.D.r[12]); tot('rf-rr', r2(T.R.r[12] - T.D.r[12]), true);
      tot('rf-ep', T.R.p[12]); tot('rf-sp', T.D.p[12]); tot('rf-rp', r2(T.R.p[12] - T.D.p[12]), true);
    };

    const draw = () => {
      const wrap = $('.rf-scroll', root), sl = wrap ? wrap.scrollLeft : 0, st = wrap ? wrap.scrollTop : 0;
      monta();
      const cab1 = `<tr><th class="rf-l" rowspan="2">${S.ano}</th>${MES.map(m => `<th colspan="2">${m}</th>`).join('')}<th colspan="2" class="rf-tot">Total do ano</th><th rowspan="2" class="rf-c">Comentários</th></tr>`;
      const cab2 = `<tr>${Array.from({ length: 13 }, () => '<th class="rf-p">Previsto</th><th class="rf-r">Realizado</th>').join('')}</tr>`;
      root.innerHTML = `<p>Visão consolidada de <strong>tudo o que foi lançado</strong> na Prestação de Contas (todas as entradas e saídas), no formato do orçamento mensal: <strong>Previsto × Realizado</strong>, mês a mês. O <em>Realizado</em> é calculado automaticamente; o <em>Previsto</em> você digita direto na tabela.</p>
      <div class="rc-filtros no-print">
        <div class="form-row"><label for="rf-a">Ano</label><select id="rf-a">${anos().map(a => `<option${a === S.ano ? ' selected' : ''}>${a}</option>`).join('')}</select></div>
        <div class="form-row"><label for="rf-m">Linhas</label><select id="rf-mo"><option value="categoria"${S.modo === 'categoria' ? ' selected' : ''}>Entradas por tipo / Saídas por categoria (Luz, Internet, Limpeza...)</option><option value="tipo"${S.modo === 'tipo' ? ' selected' : ''}>Entradas por tipo / Saídas por centro de custo</option><option value="centro"${S.modo === 'centro' ? ' selected' : ''}>Entradas e saídas por centro de custo</option></select></div>
        <div class="form-row"><label for="rf-mf">Moeda / forma de pagamento</label><select id="rf-mf"><option value="">Todas (R$ e M$ somados 1 para 1)</option>${Object.entries(MOEDA).map(([k, v]) => `<option value="${k}"${S.moeda === k ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></div>
      </div>
      <p class="no-print"><button class="btn-visit" id="rf-p"><i class="fas fa-print"></i> Imprimir</button> <button class="btn-visit" id="rf-c"><i class="fas fa-file-csv"></i> Baixar (CSV)</button></p>
      <h3 class="print-head">Parque de Estudo e Reflexão Retiro - Orçamento e Fluxo Financeiro ${S.ano} (${fmtData(hj)})</h3>
      <div class="totais"><div><span>Entradas realizadas</span><strong id="rf-er"></strong></div><div><span>Saídas realizadas</span><strong id="rf-sr"></strong></div><div><span>Resultado realizado</span><strong id="rf-rr"></strong></div>
      ${semPrev() ? '' : '<div><span>Entradas previstas</span><strong id="rf-ep"></strong></div><div><span>Saídas previstas</span><strong id="rf-sp"></strong></div><div><span>Resultado previsto</span><strong id="rf-rp"></strong></div>'}</div>
      ${semPrev() ? '<p class="tip-box"><i class="fas fa-info-circle"></i> O <strong>Previsto</strong> é cadastrado para todas as moedas somadas. Volte para "Todas" para editar ou comparar com o previsto.</p>' : ''}
      <div class="rf-scroll"><table class="rf-tab"><thead>${cab1}${cab2}</thead><tbody>
        ${banda('Receitas')}${parLinha('rf-total', 'RECEITAS TOTAIS', 'sp|R', 'sr|R')}${S.modo !== 'centro' ? `${banda('Ajude o Parque (Doação, Livraria, Lojinha, Rifa Solidária e Vaquinha Coletiva)')}${linhas('R', 0, ORIGENS.length)}${parLinha('rf-total', 'SUBTOTAL AJUDE O PARQUE', 'sp|A', 'sr|A')}${banda('Reservas de Alojamentos (Alojamento do Parque Retiro e ASSEFAZ)')}${linhas('R', ORIGENS.length, FIXAS)}${M.R.length > FIXAS ? `${banda('Contribuições, atividades, apoios e outras receitas do Parque')}${linhas('R', FIXAS)}` : ''}` : linhas('R')}
        ${banda('Despesas')}${S.modo === 'categoria' ? despesasPorGrupo() : linhas('D')}${parLinha('rf-total', 'DESPESAS TOTAIS', 'sp|D', 'sr|D')}
        ${banda('Resultado')}${parLinha('rf-total', 'RESULTADO DO MÊS', 'xp', 'xr')}${parLinha('rf-saldo', 'Saldo acumulado', 'ap', 'ar')}
      </tbody></table></div>
      <p class="aviso-local">Clique no nome de um item para ver os lançamentos que o compõem. A seta ao lado do nome repete o primeiro valor previsto nos meses seguintes. Cores do Realizado (meses já iniciados): verde = dentro do previsto; vermelho = receita abaixo ou despesa acima do previsto.</p>`;

      const novo = $('.rf-scroll', root); novo.scrollLeft = sl; novo.scrollTop = st;
      $('#rf-a', root).onchange = e => { S.ano = +e.target.value; S.aberto.clear(); draw(); };
      $('#rf-mo', root).onchange = e => { S.modo = e.target.value; S.aberto.clear(); draw(); };
      $('#rf-mf', root).onchange = e => { S.moeda = e.target.value; draw(); };
      $('#rf-p', root).onclick = () => window.print();
      $('#rf-c', root).onclick = csvOut;
      root.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => { S.aberto.has(b.dataset.ex) ? S.aberto.delete(b.dataset.ex) : S.aberto.add(b.dataset.ex); draw(); });
      root.querySelectorAll('[data-rep]').forEach(b => b.onclick = () => {
        const o = db.get('orcamento', {}), a = o[S.ano] = o[S.ano] || {}, arr = (a[b.dataset.rep] || Array(12).fill(0)).map(Number), lin = [...M.R, ...M.D].find(x => x.key === b.dataset.rep), f = lin ? lin.prev.findIndex(v => v > 0) : -1;
        if (f < 0) { alert('Digite o valor previsto de ao menos um mês primeiro.'); return; }
        // o Previsto de cada mês é o digitado mais o que vem do planejamento; guarda só a diferença para o total ficar igual ao do primeiro mês
        for (let m = f + 1; m < 12; m++) arr[m] = r2(lin.prev[f] - lin.plano[m]);
        a[b.dataset.rep] = arr; db.set('orcamento', o); draw();
      });
      root.querySelectorAll('[data-b]').forEach(i => i.onchange = () => {
        const v = Math.max(0, parseFloat(i.value) || 0), o = db.get('orcamento', {}), a = o[S.ano] = o[S.ano] || {}, arr = a[i.dataset.b] || Array(12).fill(0);
        const lin0 = [...M.R, ...M.D].find(x => x.key === i.dataset.b), pl0 = lin0 ? lin0.plano[+i.dataset.m] : 0;
        arr[+i.dataset.m] = r2(v - pl0); a[i.dataset.b] = arr; // o que se digita é o total do mês; guarda a diferença para o plano
        if (!db.set('orcamento', o)) { alert('Sem espaço no navegador para salvar o previsto.'); return; }
        i.value = v || '';
        const [mo, sec] = i.dataset.b.split('|'), r = M[sec].find(x => x.key === i.dataset.b); if (r) r.prev[+i.dataset.m] = r2(v);
        pinta();
      });
      root.querySelectorAll('[data-cm]').forEach(i => i.onchange = () => {
        const o = db.get('orcamento_com', {}), a = o[S.ano] = o[S.ano] || {}; a[i.dataset.cm] = i.value.trim();
        if (!db.set('orcamento_com', o)) alert('Sem espaço no navegador para salvar o comentário.');
      });
      pinta();
    };

    const csvOut = () => {
      const T = calc(), n = v => String(r2(v)).replace('.', ','), ps = semPrev();
      const rows = [['Item'].concat(MES.flatMap(m => [m + ' - Previsto', m + ' - Realizado']), ['Total - Previsto', 'Total - Realizado', 'Comentários'])];
      const par = (rot, p, r, com) => rows.push([rot].concat(Array.from({ length: 13 }, (_, m) => [ps ? '' : n(p[m]), n(r[m])]).flat(), [com || '']));
      const sec = (s, tit, tt) => {
        rows.push([tit]);
        if (s === 'R') par('RECEITAS TOTAIS', T.R.p, T.R.r);
        M[s].forEach((r, ri) => { par(r.lab, r.prev.concat(T[s].rows[ri].p), r.real.concat(T[s].rows[ri].r), r.com); if (s === 'R' && S.modo !== 'centro' && ri === ORIGENS.length - 1) par('SUBTOTAL AJUDE O PARQUE', T.A.p, T.A.r); });
        if (s === 'D') par('DESPESAS TOTAIS', T.D.p, T.D.r);
      };
      sec('R', 'Receitas'); sec('D', 'Despesas'); rows.push(['Resultado']);
      par('RESULTADO DO MÊS', T.xp.map((v, m) => m === 12 ? r2(T.R.p[12] - T.D.p[12]) : v), T.xr.map((v, m) => m === 12 ? r2(T.R.r[12] - T.D.r[12]) : v));
      par('Saldo acumulado', T.ap, T.ar);
      rows.push([], [`Ano ${S.ano} | Moeda: ${S.moeda ? MOEDA[S.moeda] : 'Todas (R$ e M$ somados 1 para 1)'} | Gerado em ${fmtData(hj)}`]);
      const linha = r => r.map(c => { c = String(c == null ? '' : c); if (!/^-?\d+(,\d+)?$/.test(c) && /^[=+\-@\t\r]/.test(c)) c = "'" + c; return '"' + c.replace(/"/g, '""') + '"'; }).join(';');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map(linha).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
      a.download = `orcamento-fluxo-financeiro-${S.ano}.csv`; a.click();
    };
    draw();
  }
};
})();
