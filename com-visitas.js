// Visitas do site, por origem (área restrita › Comunicação › Site). 25/11/2026.
// Lê o resumo do servidor (pr_resumo_visitas, migração 0021) e oferece o GERADOR DE LINKS com origem (?o=NOME).
// Quem conta as visitas é o visitas.js, em cada página pública. Aqui só se mostra o resultado.
(function () {
'use strict';
const BASE = 'https://parqueretiro.org.br/';
const ROTULOS = {
  instagram: 'Instagram', youtube: 'YouTube', facebook: 'Facebook', whatsapp: 'WhatsApp (conversas e contatos)',
  canal: 'Canal do Parque Retiro no WhatsApp', comunidade: 'Comunidade do Parque no WhatsApp (aviso geral)',
  email: 'Comunicado por e-mail', google: 'Google', busca: 'Outros buscadores', direto: 'Acesso direto (ou origem não informada)',
  'outros-sites': 'Outros sites', outros: 'Outras marcas', x: 'X (Twitter)', linkedin: 'LinkedIn', telegram: 'Telegram', pressenza: 'Pressenza'
};
const PAGINAS_ROTULO = { index: 'Início', app: 'Aplicativo', newsletter: 'Comunicado', login: 'Entrar', baixar: 'Baixar materiais' };
// Origens do gerador de links (valor, rótulo). "grupo-" pede o nome do grupo.
const ORIGENS_GERADOR = [
  ['instagram', 'Instagram'], ['youtube', 'YouTube'], ['facebook', 'Facebook'], ['whatsapp', 'WhatsApp (conversas e contatos)'],
  ['canal', 'Canal do Parque Retiro no WhatsApp'], ['comunidade', 'Comunidade do Parque no WhatsApp (aviso geral)'],
  ['grupo-mestres', 'Grupo dos Mestres (WhatsApp)'], ['grupo-geral', 'Bate-papo Geral do Parque (WhatsApp)'],
  ['grupo-', 'Outro grupo da Comunidade (WhatsApp): informe o nome'], ['email', 'Comunicado por e-mail'], ['outro', 'Outra origem: informe o nome']
];
const PAGINAS_GERADOR = [
  ['', 'Início'], ['newsletter.html', 'Comunicado (cadastro)'], ['atividades.html', 'Atividades'], ['reservas.html', 'Reservas'],
  ['ajude-o-parque.html', 'Ajude o Parque'], ['rifa-solidaria.html', 'Rifa Solidária'], ['vaquinha-coletiva.html', 'Vaquinha Coletiva'],
  ['livraria.html', 'Livraria'], ['como-chegar.html', 'Como chegar'], ['o-parque.html', 'O Parque'], ['app/', 'Aplicativo (instalar)'], ['login.html', 'Entrar']
];

function limpa(v) {
  return String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}
// Monta o link marcado. Usa ? se o endereço ainda não tem parâmetros; a marca vai antes de um eventual #.
function montaLink(pagina, origem) {
  const o = limpa(origem); if (!o) return '';
  let url = BASE + String(pagina || '').replace(/^\/+/, ''), hash = '';
  const i = url.indexOf('#'); if (i >= 0) { hash = url.slice(i); url = url.slice(0, i); }
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'o=' + o + hash;
}
function rotuloOrigem(o) {
  if (ROTULOS[o]) return ROTULOS[o];
  if (/^grupo-/.test(o)) return 'Grupo ' + o.slice(6).replace(/-/g, ' ') + ' (WhatsApp)';
  return o;
}
const rotuloPagina = p => PAGINAS_ROTULO[p] || p;

function abrir(el, H) {
  const esc = (H && H.esc) || (s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const nf = n => (+n || 0).toLocaleString('pt-BR');
  let dias = 30, dados = null, erro = '', carregando = true;

  const dataBR = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? `${m[3]}/${m[2]}/${m[1]}` : ''; };
  async function buscar() {
    carregando = true; erro = ''; draw();
    try {
      if (!window.PR_SUPABASE || !window.PR_SUPABASE.rpc) throw new Error('local');
      const r = await window.PR_SUPABASE.rpc('pr_resumo_visitas', { p_dias: dias });
      if (r && r.status === 200 && r.corpo && r.corpo.totais) dados = r.corpo;
      else if (r && r.status === 404) erro = 'O contador ainda não foi instalado no servidor (falta aplicar a migração 0021 no Supabase).';
      else if (r && (r.status === 401 || r.status === 403)) erro = 'Entre de novo na área restrita para ver as visitas.';
      else erro = 'Não foi possível carregar as visitas agora. Tente atualizar em instantes.';
    } catch (e) {
      erro = e && e.message === 'local' ? 'As visitas só aparecem com a área restrita ligada ao servidor do Parque.' : 'Não foi possível carregar as visitas agora. Verifique a conexão.';
    }
    carregando = false; draw();
  }

  function cards(t) {
    const c = (rot, v, sub) => `<div class="card" style="padding:14px 16px;text-align:center"><div style="font-size:.85rem;color:#666">${esc(rot)}</div><div style="font-size:1.9rem;font-weight:700;color:#E55B0A;line-height:1.2">${nf(v)}</div>${sub == null ? '' : `<div style="font-size:.78rem;color:#888">${nf(sub)} páginas vistas</div>`}</div>`;
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:12px 0">`
      + c('Hoje', t.hoje, t.paginas_hoje) + c('Ontem', t.ontem, null)
      + c('Últimos 7 dias', t.ultimos_7, t.paginas_ultimos_7) + c('Últimos 30 dias', t.ultimos_30, t.paginas_ultimos_30) + `</div>`;
  }
  function barras(lista, campo, rotulo) {
    const max = Math.max(1, ...lista.map(x => +x[campo] || 0));
    return `<div style="display:flex;flex-direction:column;gap:6px">` + lista.map(x => {
      const v = +x[campo] || 0, w = Math.max(2, Math.round(v * 100 / max));
      return `<div style="display:grid;grid-template-columns:minmax(120px,38%) 1fr auto;gap:10px;align-items:center;font-size:.9rem"><span>${esc(rotulo(x))}</span><span style="background:#f3e3d6;border-radius:6px;height:14px"><span style="display:block;background:#E55B0A;height:14px;border-radius:6px;width:${w}%"></span></span><strong>${nf(v)}</strong></div>`;
    }).join('') + `</div>`;
  }
  function porDia(lista) {
    const max = Math.max(1, ...lista.map(x => +x.visitas || 0));
    return `<div role="img" aria-label="Visitas por dia nos últimos 30 dias" style="display:flex;align-items:flex-end;gap:3px;height:90px;margin:8px 0 4px">` + lista.map(x => {
      const v = +x.visitas || 0, h = v ? Math.max(4, Math.round(v * 86 / max)) : 2;
      return `<span title="${esc(dataBR(x.dia))}: ${nf(v)} visita(s)" style="flex:1;background:${v ? '#E55B0A' : '#e6e6e6'};height:${h}px;border-radius:3px 3px 0 0"></span>`;
    }).join('') + `</div><div style="display:flex;justify-content:space-between;font-size:.75rem;color:#888"><span>${esc(dataBR(lista[0] && lista[0].dia))}</span><span>${esc(dataBR(lista[lista.length - 1] && lista[lista.length - 1].dia))}</span></div>`;
  }

  function gerador() {
    return `<h4 class="subsection-title" style="margin-top:26px">Gerar link com origem</h4>
    <p>O WhatsApp não informa de onde a pessoa veio. Por isso, <strong>para saber se a visita veio do Canal, da Comunidade ou de um grupo, poste sempre o link gerado aqui</strong> (ele termina em <code>?o=nome</code>). Link sem a marca conta como “acesso direto”.</p>
    <div class="form-row"><label for="vg-o">Onde você vai postar o link</label><select id="vg-o">${ORIGENS_GERADOR.map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select></div>
    <div class="form-row" id="vg-nome-box" hidden><label for="vg-nome">Nome curto (ex.: comunicacao, jardinagem)</label><input id="vg-nome" type="text" maxlength="30" autocomplete="off"></div>
    <div class="form-row"><label for="vg-p">Página que o link abre</label><select id="vg-p">${PAGINAS_GERADOR.map(p => `<option value="${esc(p[0])}">${esc(p[1])}</option>`).join('')}</select></div>
    <div class="form-row"><label for="vg-l">Link pronto (sem ponto no final)</label><input id="vg-l" type="text" readonly style="width:100%;font-family:monospace"></div>
    <p><button type="button" class="btn-visit" id="vg-c"><i class="fas fa-copy"></i> Copiar link</button> <span id="vg-m" class="vazio" role="status"></span></p>`;
  }

  function draw() {
    let corpo;
    if (carregando && !dados) corpo = '<p class="vazio">Carregando as visitas…</p>';
    else if (erro && !dados) corpo = `<p class="vazio" role="alert">${esc(erro)}</p>`;
    else {
      const t = dados.totais || {}, origens = dados.por_origem || [], pags = dados.paginas || [];
      corpo = (erro ? `<p class="vazio" role="alert">${esc(erro)}</p>` : '')
        + (t.desde ? `<p style="font-size:.85rem;color:#666;margin:0">A contagem começou em ${esc(dataBR(t.desde))}. Visita = uma sessão do navegador; não identifica pessoas.</p>` : '<p class="vazio">Ainda não há visitas contadas. Elas começam a aparecer depois que o site novo for aberto por alguém de fora da equipe.</p>')
        + cards(t)
        + `<h4 class="subsection-title" style="margin-top:20px">Visitas por dia (últimos 30 dias)</h4>` + porDia(dados.por_dia || [])
        + `<div class="form-row" style="margin-top:18px;max-width:320px"><label for="vv-d">Período dos quadros abaixo</label><select id="vv-d">${[7, 30, 90, 365].map(d => `<option value="${d}"${d === dias ? ' selected' : ''}>Últimos ${d} dias</option>`).join('')}</select></div>`
        + `<h4 class="subsection-title">De onde vieram as visitas</h4>` + (origens.length ? barras(origens, 'visitas', x => rotuloOrigem(x.origem)) : '<p class="vazio">Sem visitas neste período.</p>')
        + `<h4 class="subsection-title" style="margin-top:22px">Páginas mais vistas</h4>` + (pags.length ? barras(pags, 'paginas_vistas', x => rotuloPagina(x.pagina)) : '<p class="vazio">Sem visitas neste período.</p>');
    }
    el.innerHTML = `<section aria-labelledby="vis-t" style="margin-bottom:34px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><h3 id="vis-t" style="margin:0"><i class="fas fa-chart-line"></i> Visitas do site</h3><button type="button" class="btn-visit" id="vv-a"><i class="fas fa-sync-alt"></i> Atualizar</button></div>
      ${corpo}${gerador()}</section>`;
    const $ = s => el.querySelector(s);
    $('#vv-a').onclick = buscar;
    const sd = $('#vv-d'); if (sd) sd.onchange = () => { dias = +sd.value || 30; buscar(); };
    const so = $('#vg-o'), sn = $('#vg-nome'), sp = $('#vg-p'), sl = $('#vg-l'), box = $('#vg-nome-box');
    function atualizaLink() {
      const v = so.value, pedeNome = v === 'grupo-' || v === 'outro';
      box.hidden = !pedeNome;
      let origem = v;
      if (v === 'grupo-') origem = limpa(sn.value) ? 'grupo-' + limpa(sn.value) : '';
      else if (v === 'outro') origem = limpa(sn.value);
      sl.value = origem ? montaLink(sp.value, origem) : '';
      sl.placeholder = pedeNome ? 'Informe o nome curto acima' : '';
    }
    so.onchange = sn.oninput = sp.onchange = atualizaLink; atualizaLink();
    $('#vg-c').onclick = async () => {
      const m = $('#vg-m'); if (!sl.value) { m.textContent = 'Escolha a origem (e o nome, se pedir).'; return; }
      try { await navigator.clipboard.writeText(sl.value); m.textContent = 'Link copiado.'; }
      catch (e) { sl.select(); m.textContent = 'Selecione e copie o link acima (Ctrl+C).'; }
    };
  }
  buscar();
}

window.PR_COM_VISITAS = { abrir, montaLink, limpa, rotuloOrigem };
})();
