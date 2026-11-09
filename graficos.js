// Relatórios Consolidados > Gráficos: visão gráfica do que acontece no Parque (só administrador).
// Tudo desenhado aqui mesmo (SVG e barras), sem biblioteca externa. Os números saem dos mesmos dados das outras telas.
(function () {
const MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const COR = { e: '#2e8b57', s: '#c0392b', saldo: '#2c6fbb', neutra: '#6c7a89', apoio: '#d68910' };
const r2 = v => Math.round(v * 100) / 100;
const brl = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const curto = v => { const a = Math.abs(v); return (v < 0 ? '-' : '') + (a >= 1000 ? (a / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil' : a.toLocaleString('pt-BR', { maximumFractionDigits: 0 })); };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Barras agrupadas por mês (ou por rótulo). series: [{ nome, cor, vals }]
function barrasSvg(labels, series, titulo) {
  const W = 720, Ht = 300, L = 52, R = 10, T = 14, B = 34, iw = W - L - R, ih = Ht - T - B;
  const max = Math.max(1, ...series.flatMap(s => s.vals)), min = Math.min(0, ...series.flatMap(s => s.vals));
  const faixa = max - min, y = v => T + ih - ((v - min) / faixa) * ih, y0 = y(0);
  const gw = iw / labels.length, bw = Math.min(26, (gw - 8) / series.length);
  const passos = [0, 1, 2, 3, 4].map(i => min + (faixa * i) / 4);
  let g = passos.map(p => `<line x1="${L}" x2="${W - R}" y1="${y(p)}" y2="${y(p)}" stroke="#e1e6ea"/><text x="${L - 6}" y="${y(p) + 4}" text-anchor="end" font-size="10" fill="#556">${curto(p)}</text>`).join('');
  labels.forEach((lb, i) => {
    const cx = L + gw * i + gw / 2;
    series.forEach((s, k) => {
      const v = s.vals[i] || 0, x = cx - (bw * series.length) / 2 + k * bw, yy = Math.min(y(v), y0), h = Math.abs(y(v) - y0);
      if (h > 0) g += `<rect x="${x}" y="${yy}" width="${bw - 2}" height="${h}" fill="${s.cor}" rx="2"><title>${esc(lb)} - ${esc(s.nome)}: ${brl(v)}</title></rect>`;
    });
    g += `<text x="${cx}" y="${Ht - 12}" text-anchor="middle" font-size="10" fill="#556">${esc(lb)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${Ht}" role="img" aria-label="${esc(titulo)}" style="width:100%;height:auto;max-width:760px">${g}<line x1="${L}" x2="${W - R}" y1="${y0}" y2="${y0}" stroke="#9aa5ae"/></svg>`;
}
function linhaSvg(labels, vals, cor, titulo) {
  const W = 720, Ht = 260, L = 52, R = 14, T = 14, B = 30, iw = W - L - R, ih = Ht - T - B;
  const max = Math.max(1, ...vals), min = Math.min(0, ...vals), faixa = max - min, y = v => T + ih - ((v - min) / faixa) * ih, x = i => L + (iw * i) / Math.max(1, labels.length - 1);
  const grade = [0, 1, 2, 3, 4].map(i => min + (faixa * i) / 4).map(p => `<line x1="${L}" x2="${W - R}" y1="${y(p)}" y2="${y(p)}" stroke="#e1e6ea"/><text x="${L - 6}" y="${y(p) + 4}" text-anchor="end" font-size="10" fill="#556">${curto(p)}</text>`).join('');
  const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  return `<svg viewBox="0 0 ${W} ${Ht}" role="img" aria-label="${esc(titulo)}" style="width:100%;height:auto;max-width:760px">${grade}<polyline points="${pts}" fill="none" stroke="${cor}" stroke-width="2.5"/>${vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${cor}"><title>${esc(labels[i])}: ${brl(v)}</title></circle><text x="${x(i)}" y="${Ht - 10}" text-anchor="middle" font-size="10" fill="#556">${esc(labels[i])}</text>`).join('')}</svg>`;
}
// Barras horizontais em HTML. itens: [{ rot, val, cor, extra }]
function hbarras(itens, vazio) {
  if (!itens.length) return `<p class="vazio">${vazio || 'Sem dados neste período.'}</p>`;
  const max = Math.max(...itens.map(i => i.val), 1);
  return `<div class="gf-h">${itens.map(i => `<div class="gf-l"><span class="gf-r" title="${esc(i.rot)}">${esc(i.rot)}</span><span class="gf-t"><span class="gf-b" style="width:${Math.max(1.5, (i.val / max) * 100)}%;background:${i.cor || COR.neutra}"></span></span><span class="gf-v">${i.fmt || brl(i.val)}</span></div>`).join('')}</div>`;
}
const legenda = ser => `<p class="gf-leg">${ser.map(s => `<span><i style="background:${s.cor}"></i>${esc(s.nome)}</span>`).join('')}</p>`;

window.PR_GRAFICOS = {
  abrir(me, root, H) {
    const { db, hoje, normConta } = H, hj = hoje(), S = { ano: +hj.slice(0, 4), moeda: '' };
    const todas = () => db.get('contas', []).map(normConta);
    const draw = () => {
      const all = todas(), anos = [...new Set([+hj.slice(0, 4)].concat(all.map(c => +String(c.data).slice(0, 4)).filter(Boolean)))].sort((a, b) => b - a);
      const lc = all.filter(c => String(c.data).slice(0, 4) === String(S.ano) && (!S.moeda || c.moeda === S.moeda));
      const E = Array(12).fill(0), Sd = Array(12).fill(0), Cx = Array(12).fill(0);
      lc.forEach(c => { const m = +String(c.data).slice(5, 7) - 1; if (m < 0 || m > 11) return; if (c.tipo === 'Entrada') { E[m] += c.valor; if (!c.terceiro) Cx[m] += c.valor; } else { Sd[m] += c.valor; if (!c.terceiro) Cx[m] -= c.valor; } });
      const totE = r2(E.reduce((a, b) => a + b, 0)), totS = r2(Sd.reduce((a, b) => a + b, 0));
      const reemb = r2(lc.filter(c => c.terceiro && c.tipo === 'Saída').reduce((t, c) => t + c.valor, 0));
      // saldo de caixa acumulado: começa com o que veio dos anos anteriores (o que foi pago por terceiro não sai do caixa)
      let acum = r2(all.filter(c => +String(c.data).slice(0, 4) < S.ano && (!S.moeda || c.moeda === S.moeda) && !c.terceiro).reduce((t, c) => t + (c.tipo === 'Entrada' ? c.valor : -c.valor), 0));
      const sal = Cx.map(v => (acum = r2(acum + v)));
      const ultimo = Math.max(0, ...lc.map(c => +String(c.data).slice(5, 7)).filter(Boolean)) || 12;
      const grupo = (filtro, chave) => { const g = {}; lc.filter(filtro).forEach(c => { const k = chave(c) || 'Sem classificação'; g[k] = r2((g[k] || 0) + c.valor); }); return Object.entries(g).sort((a, b) => b[1] - a[1]); };
      const origE = grupo(c => c.tipo === 'Entrada', c => c.origem), catS = grupo(c => c.tipo === 'Saída', c => c.origem);
      const cc = {}; lc.forEach(c => { const o = cc[c.centro] = cc[c.centro] || { e: 0, s: 0 }; c.tipo === 'Entrada' ? o.e += c.valor : o.s += c.valor; });

      // aportes do telhado
      const ap = db.get('aportes_telhado', null);
      const apMeses = ap && ap.itens ? ap.meses.map(m => ({ m, v: r2(ap.itens.filter(i => (i.pagos || []).includes(m)).reduce((t, i) => t + i.valor, 0)) })) : [];
      // vaquinhas
      const vaqs = db.get('vaquinhas', []).filter(v => !v.cancelada), parts = db.get('vaq_part', []);
      const vq = vaqs.map(v => ({ rot: v.titulo, val: r2(parts.filter(p => p.vaquinha === v.id && p.status === 'confirmado').reduce((t, p) => t + p.valor, 0)), meta: v.meta || 0 }));
      // inventário
      const inv = db.get('inv_itens', []), invCat = {}, invSt = {};
      inv.forEach(i => { const n = window.PR_INVENTARIO ? window.PR_INVENTARIO.catNome(i.cat) : i.cat, q = Number(i.quantidade) || 1; invCat[n] = (invCat[n] || 0) + q; invSt[i.status || 'Sem status'] = (invSt[i.status || 'Sem status'] || 0) + q; });
      // alojamento
      const ped = db.get('pedidos', []).filter(r => r && r.chegada && !['recusado', 'recusada', 'cancelado', 'cancelada'].includes(String(r.status || '').toLowerCase()));
      const pedMes = Array(12).fill(0), pesMes = Array(12).fill(0);
      ped.filter(r => String(r.chegada).slice(0, 4) === String(S.ano)).forEach(r => { const m = +String(r.chegada).slice(5, 7) - 1; if (m >= 0 && m < 12) { pedMes[m]++; pesMes[m] += Number(r.pessoas) || 0; } });

      const sec = (ico, tit, corpo, nota) => `<section class="gf-sec"><h4><i class="fas ${ico}"></i> ${tit}</h4>${corpo}${nota ? `<p class="gf-nota">${nota}</p>` : ''}</section>`;
      root.innerHTML = `<style>
        .gf-top{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin:6px 0 14px}.gf-top label{font-size:.82rem;display:block}.gf-top select{font:inherit;padding:6px 8px}
        .gf-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:0 0 14px}.gf-card{background:#fff;border:1px solid #d5dde3;border-left:5px solid #6c7a89;border-radius:8px;padding:10px 12px}.gf-card span{display:block;font-size:.78rem;color:#556}.gf-card strong{font-size:1.15rem}
        .gf-sec{background:#fff;border:1px solid #d5dde3;border-radius:10px;padding:12px 14px;margin:0 0 14px;break-inside:avoid}.gf-sec h4{margin:0 0 8px}.gf-nota{font-size:.8rem;color:#667;margin:8px 0 0}
        .gf-leg{display:flex;flex-wrap:wrap;gap:14px;font-size:.8rem;margin:0 0 4px}.gf-leg i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:5px;vertical-align:-1px}
        .gf-h{display:grid;gap:6px}.gf-l{display:grid;grid-template-columns:minmax(90px,200px) 1fr auto;gap:8px;align-items:center;font-size:.85rem}.gf-r{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gf-t{background:#eef2f5;border-radius:5px;height:16px;overflow:hidden}.gf-b{display:block;height:100%;border-radius:5px}.gf-v{font-variant-numeric:tabular-nums;white-space:nowrap}
        .gf-duo{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
        @media (max-width:600px){.gf-l{grid-template-columns:90px 1fr auto;font-size:.78rem}}
        @media print{.no-print{display:none!important}.gf-sec{border:1px solid #999}}
      </style>
      <h3><i class="fas fa-chart-pie"></i> Gráficos do Parque</h3>
      <div class="gf-top no-print"><div><label for="gf-a">Ano</label><select id="gf-a">${anos.map(a => `<option${a === S.ano ? ' selected' : ''}>${a}</option>`).join('')}</select></div>
        <div><label for="gf-m">Forma de pagamento</label><select id="gf-m"><option value="">Todas</option>${Object.entries(H.MOEDA || {}).map(([k, v]) => `<option value="${k}"${S.moeda === k ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></div>
        <button class="btn-visit" id="gf-p"><i class="fas fa-print"></i> Imprimir</button> <button class="btn-visit" id="gf-c"><i class="fas fa-file-csv"></i> Baixar números (CSV)</button></div>
      <div class="gf-cards">
        <div class="gf-card" style="border-left-color:${COR.e}"><span>Entradas em ${S.ano}</span><strong>${brl(totE)}</strong></div>
        <div class="gf-card" style="border-left-color:${COR.s}"><span>Saídas em ${S.ano}</span><strong>${brl(totS)}</strong></div>
        <div class="gf-card" style="border-left-color:${COR.saldo}"><span>Resultado do ano (entradas - saídas)</span><strong>${brl(totE - totS)}</strong></div>
        <div class="gf-card" style="border-left-color:${COR.saldo}"><span>Saldo do caixa no fim do período</span><strong>${brl(sal[Math.max(0, ultimo - 1)])}</strong></div>
        ${reemb ? `<div class="gf-card" style="border-left-color:${COR.apoio}"><span>A reembolsar (pago do próprio bolso)</span><strong>${brl(reemb)}</strong></div>` : ''}</div>
      ${sec('fa-chart-bar', 'Entradas e saídas por mês', legenda([{ nome: 'Entradas', cor: COR.e }, { nome: 'Saídas', cor: COR.s }]) + barrasSvg(MES, [{ nome: 'Entradas', cor: COR.e, vals: E.map(r2) }, { nome: 'Saídas', cor: COR.s, vals: Sd.map(r2) }], 'Entradas e saídas por mês'))}
      ${sec('fa-chart-line', 'Saldo do caixa mês a mês', linhaSvg(MES.slice(0, ultimo), sal.slice(0, ultimo), COR.saldo, 'Saldo do caixa mês a mês'), 'Despesas pagas do próprio bolso por voluntários não diminuem o caixa; ficam em "A reembolsar".')}
      <div class="gf-duo">${sec('fa-arrow-down', 'De onde vem o dinheiro (entradas por origem)', hbarras(origE.slice(0, 10).map(([rot, val]) => ({ rot, val, cor: COR.e }))))}
      ${sec('fa-arrow-up', 'Para onde vai o dinheiro (saídas por categoria)', hbarras(catS.slice(0, 10).map(([rot, val]) => ({ rot, val, cor: COR.s }))))}</div>
      ${sec('fa-sitemap', 'Por centro de custo', legenda([{ nome: 'Entradas', cor: COR.e }, { nome: 'Saídas', cor: COR.s }]) + hbarras(Object.entries(cc).flatMap(([k, o]) => [{ rot: k + ' (entradas)', val: r2(o.e), cor: COR.e }, { rot: k + ' (saídas)', val: r2(o.s), cor: COR.s }])))}
      ${apMeses.length ? sec('fa-home', 'Aportes do telhado por mês', barrasSvg(apMeses.map(x => x.m.slice(5) + '/' + x.m.slice(2, 4)), [{ nome: 'Recebido', cor: COR.apoio, vals: apMeses.map(x => x.v) }], 'Aportes do telhado por mês'), `Total recebido: ${brl(apMeses.reduce((t, x) => t + x.v, 0))}, de ${ap.itens.length} linhas de contribuintes.`) : ''}
      ${vq.length ? sec('fa-hand-holding-heart', 'Vaquinhas: arrecadado e meta', hbarras(vq.map(v => ({ rot: v.rot, val: v.val, cor: COR.apoio, fmt: brl(v.val) + (v.meta ? ' de ' + brl(v.meta) + ' (' + Math.round((v.val / v.meta) * 100) + '%)' : '') })))) : ''}
      <div class="gf-duo">${inv.length ? sec('fa-boxes', 'Inventário por categoria (unidades)', hbarras(Object.entries(invCat).sort((a, b) => b[1] - a[1]).map(([rot, val]) => ({ rot, val, fmt: String(val) })))) : ''}
      ${inv.length ? sec('fa-clipboard-check', 'Inventário por situação (unidades)', hbarras(Object.entries(invSt).sort((a, b) => b[1] - a[1]).map(([rot, val]) => ({ rot, val, fmt: String(val), cor: COR.saldo })))) : ''}</div>
      ${ped.length ? sec('fa-bed', 'Alojamento: pedidos de hospedagem por mês de chegada', legenda([{ nome: 'Pedidos', cor: COR.saldo }, { nome: 'Pessoas', cor: COR.neutra }]) + barrasSvg(MES, [{ nome: 'Pedidos', cor: COR.saldo, vals: pedMes }, { nome: 'Pessoas', cor: COR.neutra, vals: pesMes }], 'Pedidos de hospedagem por mês')) : ''}
      ${!lc.length && !ap && !vq.length && !inv.length && !ped.length ? '<p class="vazio">Ainda não há dados para mostrar. Quando houver lançamentos, os gráficos aparecem aqui.</p>' : ''}`;
      root.querySelector('#gf-a').onchange = e => { S.ano = +e.target.value; draw(); };
      root.querySelector('#gf-m').onchange = e => { S.moeda = e.target.value; draw(); };
      root.querySelector('#gf-p').onclick = () => window.print();
      root.querySelector('#gf-c').onclick = () => {
        const rows = [['Mês', 'Entradas', 'Saídas', 'Saldo do caixa']].concat(MES.map((m, i) => [m + '/' + S.ano, String(r2(E[i])).replace('.', ','), String(r2(Sd[i])).replace('.', ','), String(sal[i]).replace('.', ',')]));
        const txt = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\r\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + txt], { type: 'text/csv;charset=utf-8' })); a.download = 'graficos-parque-' + S.ano + '.csv'; a.click();
      };
    };
    draw();
  }
};
})();
