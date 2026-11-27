// Painel de visitantes (área restrita › CONecta Comunicação › Site). 25/11/2026. Usa pr_relatorio_visitas (migração 0024), pr_listar_links (0023).
// Períodos livres, comparação com o período anterior, origem em %, redes sociais (Linktree × link direto), dispositivos, relatório.
// Só números agregados: não identifica pessoas. Visitante único, tempo de permanência e localização ficam para as etapas F3 e F4.
(function () {
'use strict';
const TZ = 'America/Sao_Paulo';
const hojeStr = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
const parse = s => { const [a, m, d] = s.split('-').map(Number); return new Date(Date.UTC(a, m - 1, d)); };
const fmt = d => d.toISOString().slice(0, 10);
const soma = (s, n) => { const d = parse(s); d.setUTCDate(d.getUTCDate() + n); return fmt(d); };
const dias = (ini, fim) => Math.round((parse(fim) - parse(ini)) / 86400000) + 1;
const primeiroDoMes = s => s.slice(0, 8) + '01';
const ultimoDoMes = s => { const d = parse(primeiroDoMes(s)); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0); return fmt(d); };
const mesAnterior = s => { const d = parse(primeiroDoMes(s)); d.setUTCDate(0); return fmt(d); }; // último dia do mês anterior

const PERIODOS = [['hoje', 'Hoje'], ['ontem', 'Ontem'], ['7', 'Últimos 7 dias'], ['30', 'Últimos 30 dias'], ['90', 'Últimos 90 dias'], ['mes', 'Este mês'], ['mes-anterior', 'Mês anterior'], ['custom', 'Personalizado']];
// Intervalo do período escolhido e do período anterior (para comparar). Função pura, usada nos testes.
function intervalos(per, hoje, custom) {
  let ini, fim, ci, cf;
  if (per === 'hoje') { ini = fim = hoje; }
  else if (per === 'ontem') { ini = fim = soma(hoje, -1); }
  else if (per === 'mes') { ini = primeiroDoMes(hoje); fim = hoje; }
  else if (per === 'mes-anterior') { fim = mesAnterior(hoje); ini = primeiroDoMes(fim); }
  else if (per === 'custom') { ini = (custom && custom.ini) || soma(hoje, -29); fim = (custom && custom.fim) || hoje; }
  else { const n = +per || 30; fim = hoje; ini = soma(hoje, -(n - 1)); }
  if (per === 'mes' || per === 'mes-anterior') { // compara com o mês anterior ao escolhido (mesmo número de dias, no máximo)
    cf = mesAnterior(ini); ci = primeiroDoMes(cf); const n = dias(ini, fim); const lim = soma(ci, n - 1); cf = lim < cf ? lim : cf;
  } else { const n = dias(ini, fim); cf = soma(ini, -1); ci = soma(ini, -n); }
  return { ini, fim, ci, cf };
}
const variacao = (a, b) => (b > 0 ? Math.round((a - b) * 1000 / b) / 10 : null);

const NOMES_TIPO = { mobile: 'Celular / smartphone', desktop: 'Computador / notebook', tablet: 'Tablet', outro: 'Outro / não identificado' };
const NOMES_SO = { android: 'Android', ios: 'iOS (iPhone/iPad)', windows: 'Windows', macos: 'macOS', linux: 'Linux', outro: 'Outro' };
const NOMES_NAV = { chrome: 'Chrome', safari: 'Safari', firefox: 'Firefox', edge: 'Edge', opera: 'Opera', samsung: 'Samsung Internet', outro: 'Outro' };
const REDES = [ // [rótulo, origem no site, destino da passagem]
  ['Instagram', 'instagram', 'instagram'], ['Facebook', 'facebook', 'facebook'], ['YouTube', 'youtube', 'youtube'],
  ['Canal do Parque Retiro (WhatsApp)', 'canal', 'canal'], ['Comunidade do Parque (WhatsApp)', 'comunidade', 'comunidade'],
  ['Grupo Geral do Parque Retiro', 'grupo-geral', 'grupo-geral'], ['Grupo A Mensagem de Silo', 'grupo-silo', 'grupo-silo'],
  ['Grupo CONecta Retiro', 'grupo-conecta', 'conecta-whatsapp'], ['Grupo dos Mestres', 'grupo-mestres', '']];
const ABAS = [['geral', 'Visão geral'], ['origem', 'Origem dos acessos'], ['redes', 'Redes sociais'], ['linktree', 'Linktree'], ['emailwifi', 'E-mail e Wi-Fi'], ['paginas', 'Páginas mais acessadas'], ['dispositivos', 'Dispositivos'], ['relatorio', 'Relatórios']];

const v0 = (lista, chave, campo) => { const x = (lista || []).find(i => i[campo || 'origem'] === chave); return x ? +x.visitas || 0 : 0; };
const prefixo = (lista, base) => (lista || []).filter(i => i.origem === base || String(i.origem).indexOf(base + '-') === 0).reduce((s, i) => s + (+i.visitas || 0), 0);
const cliquesPara = (saidas, destino, origemFiltro) => (saidas || []).filter(x => x.destino === destino && (origemFiltro == null || (origemFiltro ? x.origem === 'linktree' : x.origem !== 'linktree'))).reduce((s, x) => s + (+x.cliques || 0), 0);
const csvCel = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';

function abrir(el, H) {
  const esc = (H && H.esc) || (s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const nf = n => (+n || 0).toLocaleString('pt-BR');
  const CV = window.PR_COM_VISITAS || {};
  const rotOrigem = CV.rotuloOrigem || (o => o), rotDestino = CV.rotuloDestino || (d => d), rotPagina = CV.rotuloPagina || (p => p);
  const dataBR = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? `${m[3]}/${m[2]}/${m[1]}` : ''; };
  let per = '30', custom = { ini: '', fim: '' }, comparar = false, aba = 'geral', a = null, b = null, links = [], erro = '', carregando = true, detalhe = '';

  async function rpc(nome, corpo) { if (!window.PR_SUPABASE || !window.PR_SUPABASE.rpc) throw new Error('local'); return window.PR_SUPABASE.rpc(nome, corpo); }
  const msgErro = r => r && (r.status === 404 || (r.corpo && /does not exist|Could not find the function|PGRST202/i.test(String(r.corpo.message || r.corpo.code || '')))) ? 'O painel ainda não foi instalado no servidor (falta aplicar a migração 0024 no Supabase).'
    : r && (r.status === 401 || r.status === 403) ? 'Entre de novo na área restrita para ver o painel.'
    : r && r.corpo && r.corpo.message && r.status >= 400 && r.status < 500 ? r.corpo.message : 'Não foi possível carregar o painel agora. Tente atualizar em instantes.';
  async function buscar() {
    carregando = true; erro = ''; draw();
    const iv = intervalos(per, hojeStr(), custom);
    try {
      const ra = await rpc('pr_relatorio_visitas', { p_ini: iv.ini, p_fim: iv.fim });
      if (!(ra && ra.status === 200 && ra.corpo && ra.corpo.totais)) { erro = msgErro(ra); a = null; }
      else {
        a = ra.corpo; b = null;
        if (comparar) { const rb = await rpc('pr_relatorio_visitas', { p_ini: iv.ci, p_fim: iv.cf }); if (rb && rb.status === 200 && rb.corpo && rb.corpo.totais) b = rb.corpo; }
        try { const rl = await rpc('pr_listar_links', { p_dias: Math.max(1, dias(iv.ini, hojeStr())) }); links = rl && rl.status === 200 && rl.corpo && rl.corpo.links ? rl.corpo.links : []; } catch (e) { links = []; }
      }
    } catch (e) { erro = e && e.message === 'local' ? 'O painel só aparece com a área restrita ligada ao servidor do Parque.' : 'Não foi possível carregar o painel agora. Verifique a conexão.'; }
    carregando = false; draw();
  }

  const delta = (x, y) => { if (!b) return ''; const v = variacao(x, y); return `<div style="font-size:.78rem;color:${v == null ? '#888' : v >= 0 ? '#1b7a3a' : '#b3261e'}">${v == null ? 'sem base para comparar' : (v >= 0 ? '▲ ' : '▼ ') + String(Math.abs(v)).replace('.', ',') + '% vs. período anterior (' + nf(y) + ')'}</div>`; };
  const cartao = (rot, x, y) => `<div class="card" style="padding:14px 16px;text-align:center"><div style="font-size:.85rem;color:#666">${esc(rot)}</div><div style="font-size:1.9rem;font-weight:700;color:#E55B0A;line-height:1.2">${nf(x)}</div>${delta(x, y)}</div>`;
  const barras = (lista, campo, rot, total, extra) => {
    const max = Math.max(1, ...lista.map(x => +x[campo] || 0)), tot = total == null ? lista.reduce((s, x) => s + (+x[campo] || 0), 0) : total;
    return `<div style="display:flex;flex-direction:column;gap:6px">` + lista.map(x => { const v = +x[campo] || 0, w = Math.max(2, Math.round(v * 100 / max)), pc = tot ? Math.round(v * 1000 / tot) / 10 : 0;
      return `<div ${extra ? extra(x) : ''} style="display:grid;grid-template-columns:minmax(120px,38%) 1fr auto;gap:10px;align-items:center;font-size:.9rem"><span>${esc(rot(x))}</span><span style="background:#f3e3d6;border-radius:6px;height:14px"><span style="display:block;background:#E55B0A;height:14px;border-radius:6px;width:${w}%"></span></span><strong>${nf(v)} <span style="font-weight:400;color:#666">(${String(pc).replace('.', ',')}%)</span></strong></div>`; }).join('') + `</div>`;
  };
  const vazio = '<p class="vazio">Sem dados neste período.</p>';
  function porDia(lista) {
    const max = Math.max(1, ...lista.map(x => +x.visitas || 0));
    return `<div role="img" aria-label="Visitas por dia no período" style="display:flex;align-items:flex-end;gap:2px;height:90px;margin:8px 0 4px">` + lista.map(x => { const v = +x.visitas || 0, h = v ? Math.max(4, Math.round(v * 86 / max)) : 2;
      return `<span title="${esc(dataBR(x.dia))}: ${nf(v)} visita(s)" style="flex:1;background:${v ? '#E55B0A' : '#e6e6e6'};height:${h}px;border-radius:3px 3px 0 0"></span>`; }).join('') + `</div><div style="display:flex;justify-content:space-between;font-size:.75rem;color:#888"><span>${esc(dataBR(lista[0] && lista[0].dia))}</span><span>${esc(dataBR(lista[lista.length - 1] && lista[lista.length - 1].dia))}</span></div>`;
  }
  const grupoDisp = (tit, lista, nomes) => `<div><h5 style="margin:14px 0 6px">${esc(tit)}</h5>` + (lista && lista.length ? barras(lista, 'visitas', x => nomes[x.nome] || x.nome) : vazio) + '</div>';
  const linksDe = f => links.filter(f).sort((x, y) => (+y.visitas || 0) - (+x.visitas || 0));

  const secoes = {
    geral() {
      const t = a.totais, tb = b && b.totais || {}, d = dias(a.ini, a.fim), v = +t.visitas || 0, p = +t.paginas_vistas || 0;
      return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:12px 0">${cartao('Visitas (sessões)', v, +tb.visitas || 0)}${cartao('Páginas vistas', p, +tb.paginas_vistas || 0)}
        <div class="card" style="padding:14px 16px;text-align:center"><div style="font-size:.85rem;color:#666">Páginas por visita</div><div style="font-size:1.9rem;font-weight:700;color:#E55B0A;line-height:1.2">${v ? String((p / v).toFixed(1)).replace('.', ',') : '0'}</div></div>
        <div class="card" style="padding:14px 16px;text-align:center"><div style="font-size:.85rem;color:#666">Média de visitas por dia</div><div style="font-size:1.9rem;font-weight:700;color:#E55B0A;line-height:1.2">${String((v / d).toFixed(1)).replace('.', ',')}</div></div></div>
        <h4 class="subsection-title">Quantidade de acessos por dia</h4>${porDia(a.por_dia || [])}
        <p style="font-size:.85rem;color:#666">Visita = uma sessão do navegador; não identifica pessoas. Visitantes únicos, novos × recorrentes e tempo de permanência dependem da etapa com consentimento (ainda não ativada).</p>`;
    },
    origem() {
      const o = a.por_origem || [];
      return `<h4 class="subsection-title">De onde vieram os visitantes</h4>` + (o.length ? barras(o, 'visitas', x => rotOrigem(x.origem), +a.totais.visitas, x => `data-or="${esc(x.origem)}" style="cursor:pointer" tabindex="0" role="button" aria-label="Detalhes de ${esc(rotOrigem(x.origem))}"`) : vazio)
        + `<p style="font-size:.85rem;color:#666">Clique em uma origem para ver os detalhes.</p>` + (detalhe ? detalheOrigem(detalhe) : '');
    },
    redes() {
      const s = a.saidas || [], o = a.por_origem || [];
      const linhas = REDES.map(r => { const direto = v0(o, r[1]), lt = r[2] ? cliquesPara(s, r[2], true) : 0, outros = r[2] ? cliquesPara(s, r[2], false) : 0; return { r, direto, lt, outros }; });
      const th = 'style="text-align:left;padding:6px 8px;border-bottom:1px solid #ddd;font-size:.85rem"', td = 'style="padding:6px 8px;border-bottom:1px solid #eee"', tdn = 'style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right"';
      const totDireto = linhas.reduce((x, l) => x + l.direto, 0), totLt = linhas.reduce((x, l) => x + l.lt, 0);
      return `<h4 class="subsection-title">Desempenho de cada rede: Linktree × link direto</h4>
        <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th ${th}>Rede</th><th ${th}>Visitas ao site vindas de links diretos da rede</th><th ${th}>Cliques do Linktree para a rede</th><th ${th}>Cliques de outros lugares para a rede</th></tr></thead><tbody>`
        + linhas.map(l => `<tr><td ${td}>${esc(l.r[0])}</td><td ${tdn}>${nf(l.direto)}</td><td ${tdn}>${nf(l.lt)}</td><td ${tdn}>${nf(l.outros)}</td></tr>`).join('') + `</tbody></table></div>
        <p style="margin-top:12px"><strong>Linktree × links diretos:</strong> ${nf(totLt)} clique(s) saíram do Linktree para as redes e ${nf(totDireto)} visita(s) chegaram ao site por links diretos das redes.</p>
        <p style="font-size:.85rem;color:#666">"Visitas ao site" contam quem entrou no site por um link marcado com a origem da rede (por exemplo, o link da bio do Instagram). "Cliques" contam quem passou pelo site a caminho da rede (links do tipo <code>ir.html</code>).</p>`;
    },
    linktree() {
      const s = (a.saidas || []).filter(x => x.origem === 'linktree'), por = {}; s.forEach(x => { por[x.destino] = (por[x.destino] || 0) + (+x.cliques || 0); });
      const lista = Object.keys(por).map(d => ({ destino: d, cliques: por[d] })).sort((x, y) => y.cliques - x.cliques), vis = v0(a.por_origem, 'linktree');
      return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:12px 0">${cartao('Visitas ao site vindas do Linktree', vis, b ? v0(b.por_origem, 'linktree') : 0)}${cartao('Cliques nos botões das redes', lista.reduce((x, y) => x + y.cliques, 0), b ? (b.saidas || []).filter(x => x.origem === 'linktree').reduce((x, y) => x + (+y.cliques || 0), 0) : 0)}</div>
        <h4 class="subsection-title">Cliques por botão do Linktree</h4>` + (lista.length ? barras(lista, 'cliques', x => rotDestino(x.destino)) : vazio);
    },
    emailwifi() {
      const o = a.por_origem || [], mk = (f, t) => { const l = linksDe(x => x.categoria === f); return `<h4 class="subsection-title">${esc(t)}</h4><p><strong>${nf(prefixo(o, f))}</strong> visita(s) no período com origem ${esc(f === 'email' ? 'e-mail' : 'Wi-Fi')}.</p>`
        + (l.length ? barras(l, 'visitas', x => x.nome, null) : '<p class="vazio">Nenhum link desta categoria no gerador ainda. Crie em "Gerador de links rastreáveis" (categoria ' + esc(f === 'email' ? 'E-mail' : 'Wi-Fi') + ').</p>'); };
      return mk('email', 'Campanhas de e-mail (comunicados)') + mk('wifi', 'Acessos via Wi-Fi do Parque');
    },
    paginas() {
      const p = a.paginas || [], tot = +a.totais.paginas_vistas || 0;
      return `<h4 class="subsection-title">Páginas mais acessadas</h4>` + (p.length ? barras(p, 'paginas_vistas', x => rotPagina(x.pagina), tot) : vazio) + `<p style="font-size:.85rem;color:#666">Percentual sobre o total de páginas vistas (${nf(tot)}). Tempo de permanência por página depende da etapa com consentimento.</p>`;
    },
    dispositivos() {
      const d = a.dispositivos || {}, tot = (d.tipo || []).reduce((s, x) => s + (+x.visitas || 0), 0);
      return `<h4 class="subsection-title">Dispositivos usados nas visitas</h4>${tot ? '' : '<p class="vazio">Os dispositivos passam a ser contados depois que o site atualizado for aberto por visitantes.</p>'}`
        + grupoDisp('Tipo de aparelho', d.tipo, NOMES_TIPO) + grupoDisp('Sistema operacional', d.so, NOMES_SO) + grupoDisp('Navegador', d.navegador, NOMES_NAV)
        + `<p style="font-size:.85rem;color:#666">Lido do próprio navegador, em categorias gerais. Não guardamos modelo, resolução nem qualquer identificador do aparelho.</p>`;
    },
    relatorio() {
      const o = a.por_origem || [], s = a.saidas || [], d = a.dispositivos || {}, tot = +a.totais.visitas || 0;
      const topo = (lista, f) => { const x = lista.filter(f).sort((p, q) => q.visitas - p.visitas)[0]; return x && x.visitas ? `${rotOrigem(x.origem)} (${nf(x.visitas)})` : 'sem visitas no período'; };
      const redes = ['instagram', 'facebook', 'youtube'], wapp = x => ['canal', 'comunidade', 'whatsapp'].indexOf(x.origem) >= 0 || /^grupo-/.test(x.origem);
      const lt = v0(o, 'linktree'), dir = redes.reduce((x, r) => x + v0(o, r), 0), cel = (d.tipo || []).find(x => x.nome === 'mobile'), totT = (d.tipo || []).reduce((x, y) => x + (+y.visitas || 0), 0);
      const lm = linksDe(() => true)[0], meses = {}; (a.por_dia || []).forEach(x => { const m = String(x.dia).slice(0, 7); meses[m] = (meses[m] || 0) + (+x.visitas || 0); });
      const P = (q, r) => `<li><strong>${esc(q)}</strong><br>${r}</li>`;
      return `<h4 class="subsection-title">Respostas do período (${esc(dataBR(a.ini))} a ${esc(dataBR(a.fim))})</h4><ol style="line-height:1.7">`
        + P('Qual rede social trouxe mais visitantes?', esc(topo(o, x => redes.indexOf(x.origem) >= 0)))
        + P('O Linktree gerou mais acessos do que os links individuais?', `Linktree: ${nf(lt)} visita(s) · links diretos das redes: ${nf(dir)} visita(s). ${lt > dir ? 'O Linktree está na frente.' : lt < dir ? 'Os links diretos estão na frente.' : 'Empate.'}`)
        + P('Qual canal de WhatsApp gerou mais visitas?', esc(topo(o, wapp)))
        + P('Quais comunicados por e-mail apresentaram melhores resultados?', (() => { const l = linksDe(x => x.categoria === 'email' || x.categoria === 'comunicados')[0]; return l && l.visitas ? `${esc(l.nome)} (${nf(l.visitas)} visita(s))` : `${nf(prefixo(o, 'email'))} visita(s) com origem e-mail; crie links de e-mail no gerador para comparar campanhas.`; })())
        + P('Quantas pessoas chegaram pelo Wi-Fi?', `${nf(prefixo(o, 'wifi'))} visita(s) com origem Wi-Fi.`)
        + P('Quais páginas são mais acessadas?', (a.paginas || []).slice(0, 5).map(x => esc(rotPagina(x.pagina)) + ' (' + nf(x.paginas_vistas) + ')').join(', ') || 'sem dados')
        + P('Qual o percentual de acessos por celular?', totT ? `${String(Math.round(((cel && cel.visitas) || 0) * 1000 / totT) / 10).replace('.', ',')}% das visitas com aparelho identificado (${nf(totT)}).` : 'Ainda sem dispositivos contados.')
        + P('Quais cidades e estados geram mais visitantes?', 'Ainda não disponível: depende da etapa de localização aproximada.')
        + P('Qual a evolução do tráfego ao longo dos meses?', Object.keys(meses).sort().map(m => esc(m.slice(5) + '/' + m.slice(0, 4)) + ': ' + nf(meses[m])).join(' · ') || 'sem dados')
        + P('Qual campanha apresentou o melhor resultado?', lm && lm.visitas ? `${esc(lm.nome)} (${nf(lm.visitas)} visita(s), ${nf(lm.cliques)} clique(s))` : 'Nenhum link rastreável com visitas no período.')
        + `</ol><p><button type="button" class="btn-visit" id="vp-csv"><i class="fas fa-file-csv"></i> Exportar CSV do período</button> <button type="button" class="btn-visit" id="vp-print"><i class="fas fa-print"></i> Imprimir / salvar em PDF</button></p>`;
    }
  };
  function detalheOrigem(o) {
    const s = (a.saidas || []).filter(x => x.origem === o), l = links.filter(x => x.utm_source === o);
    return `<div class="card" id="vp-det" style="padding:12px 14px;margin:12px 0"><strong>${esc(rotOrigem(o))}</strong>: ${nf(v0(a.por_origem, o))} visita(s)<br>`
      + (s.length ? 'Cliques para as redes a partir dela: ' + s.map(x => esc(rotDestino(x.destino)) + ' (' + nf(x.cliques) + ')').join(', ') : 'Sem cliques para as redes a partir dela.') + '<br>'
      + (l.length ? 'Links rastreáveis desta origem: ' + l.map(x => esc(x.nome) + ' (' + nf(x.visitas) + ')').join(', ') : 'Sem links rastreáveis registrados com esta origem.') + '</div>';
  }
  function csv() {
    const lin = [['Seção', 'Item', 'Visitas', 'Páginas vistas / cliques']];
    (a.por_origem || []).forEach(x => lin.push(['Origem', rotOrigem(x.origem), x.visitas, x.paginas_vistas]));
    (a.paginas || []).forEach(x => lin.push(['Página', rotPagina(x.pagina), x.visitas, x.paginas_vistas]));
    (a.saidas || []).forEach(x => lin.push(['Clique para rede', rotOrigem(x.origem) + ' → ' + rotDestino(x.destino), '', x.cliques]));
    ['tipo', 'so', 'navegador'].forEach(k => ((a.dispositivos || {})[k] || []).forEach(x => lin.push(['Dispositivo (' + k + ')', x.nome, x.visitas, ''])));
    (a.por_dia || []).forEach(x => lin.push(['Dia', dataBR(x.dia), x.visitas, x.paginas_vistas]));
    return '﻿' + lin.map(r => r.map(csvCel).join(';')).join('\r\n');
  }
  function draw() {
    const iv = intervalos(per, hojeStr(), custom);
    const controles = `<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:end;margin:10px 0"><div class="form-row" style="max-width:240px"><label for="vp-per">Período</label><select id="vp-per">${PERIODOS.map(p => `<option value="${p[0]}"${p[0] === per ? ' selected' : ''}>${p[1]}</option>`).join('')}</select></div>
      ${per === 'custom' ? `<div class="form-row"><label for="vp-ini">De</label><input id="vp-ini" type="date" value="${esc(custom.ini || iv.ini)}" max="${hojeStr()}"></div><div class="form-row"><label for="vp-fim">Até</label><input id="vp-fim" type="date" value="${esc(custom.fim || iv.fim)}" max="${hojeStr()}"></div>` : ''}
      <label style="display:flex;gap:6px;align-items:center"><input id="vp-cmp" type="checkbox"${comparar ? ' checked' : ''}> Comparar com o período anterior</label><button type="button" class="btn-visit" id="vp-at"><i class="fas fa-sync-alt"></i> Atualizar</button></div>
      <p style="font-size:.85rem;color:#666;margin:0">${esc(dataBR(iv.ini))} a ${esc(dataBR(iv.fim))}${comparar ? ` · comparando com ${esc(dataBR(iv.ci))} a ${esc(dataBR(iv.cf))}` : ''}</p>`;
    const nav = `<div role="tablist" aria-label="Seções do painel" style="display:flex;gap:6px;flex-wrap:wrap;margin:14px 0">${ABAS.map(x => `<button type="button" role="tab" class="btn-visit" data-aba="${x[0]}" aria-selected="${x[0] === aba}" style="${x[0] === aba ? 'background:#E55B0A;color:#fff' : ''}">${x[1]}</button>`).join('')}</div>`;
    const corpo = carregando && !a ? '<p class="vazio">Carregando o painel…</p>' : (erro && !a ? `<p class="vazio" role="alert">${esc(erro)}</p>` : (erro ? `<p class="vazio" role="alert">${esc(erro)}</p>` : '') + (a ? secoes[aba]() : ''));
    el.innerHTML = `<section aria-labelledby="vp-t" style="margin-bottom:34px"><h3 id="vp-t"><i class="fas fa-chart-pie"></i> Painel de visitantes</h3>${controles}${nav}<div id="vp-corpo">${corpo}</div></section>`;
    const $ = s => el.querySelector(s);
    $('#vp-per').onchange = e => { per = e.target.value; if (per === 'custom') { const iv2 = intervalos('30', hojeStr()); custom = { ini: iv2.ini, fim: iv2.fim }; } buscar(); };
    $('#vp-cmp').onchange = e => { comparar = e.target.checked; buscar(); };
    $('#vp-at').onclick = buscar;
    const ci = $('#vp-ini'), cf = $('#vp-fim'); if (ci) ci.onchange = cf.onchange = () => { custom = { ini: ci.value, fim: cf.value }; if (custom.ini && custom.fim && custom.ini <= custom.fim) buscar(); };
    el.querySelectorAll('[data-aba]').forEach(bt => bt.onclick = () => { aba = bt.dataset.aba; detalhe = ''; draw(); });
    el.querySelectorAll('[data-or]').forEach(r => { r.onclick = () => { detalhe = r.dataset.or; draw(); }; r.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); detalhe = r.dataset.or; draw(); } }; });
    const bc = $('#vp-csv'); if (bc) bc.onclick = () => { const u = URL.createObjectURL(new Blob([csv()], { type: 'text/csv;charset=utf-8' })), l = document.createElement('a'); l.href = u; l.download = 'painel-visitantes-' + a.ini + '-a-' + a.fim + '.csv'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); };
    const bp = $('#vp-print'); if (bp) bp.onclick = () => window.print();
  }
  draw(); buscar();
}
window.PR_COM_PAINEL = { abrir, intervalos, variacao };
})();
