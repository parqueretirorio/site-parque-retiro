// Atividades (antigo "Eventos"): registro escrito das atividades do Parque Retiro e de atividades externas ligadas a ele.
//  - Área aberta:  atividades.html (lista com foto pequena, título, lide e "Clique aqui e leia mais")
//                  atividade.html?id=... (artigo completo, com autor no final e lista de outras atividades)
//  - Área restrita: Comissões Parque Retiro > Atividades (cadastro, edição, publicação, banner do Início)
//  - Início:       atividades marcadas com "Destacar no banner do Início" entram no carrossel (banners.js usa slidesBanner()).
// Dado: 'atividades' = [{ id, titulo, categoria, origem, dataAtiv, local, organizacao, linkExterno, lide, texto,
//        foto, banner, bannerAlt, destaque, autor, status('rascunho'|'publicada'), criadoEm, atualizadoEm, por }]
// Fotos e banners ficam como imagem reduzida dentro do próprio registro (mesma regra do Álbum e da Lojinha).
(function () {
const CATS = { evento: 'Eventos', encontro: 'Encontros', retiro: 'Retiros', reuniao: 'Reuniões' };
const CAT1 = { evento: 'Evento', encontro: 'Encontro', retiro: 'Retiro', reuniao: 'Reunião' };
const ORIGENS = { parque: 'No Parque Retiro', externa: 'Externa, com relação ao Parque Retiro' };
const BANNER_W = 1800, BANNER_H = 600; // 3:1, a mesma proporção dos banners do Início
const MAX_BANNER = 5;                    // quantas atividades no máximo aparecem no banner do Início

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtData = d => d ? String(d).split('-').reverse().join('/') : '';
const hoje = () => new Date().toISOString().slice(0, 10);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const imgOk = s => typeof s === 'string' && /^data:image\//.test(s);
const urlOk = u => /^https?:\/\//i.test(u || '');
const getDb = () => (window.PR_DADOS && window.PR_DADOS.db) || {
  get(k, d) { try { const v = localStorage.getItem('pr_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('pr_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};
const todas = () => getDb().get('atividades', []);
const publicadas = () => todas().filter(a => a.status === 'publicada').sort((a, b) => String(b.dataAtiv || '').localeCompare(String(a.dataAtiv || '')) || String(b.criadoEm || '').localeCompare(String(a.criadoEm || '')));
const hrefArtigo = id => 'atividade.html?id=' + encodeURIComponent(id);
const catDe = c => CATS[c] ? c : 'evento';

// Texto do artigo: parágrafos separados por linha em branco; endereços http(s) viram link. Tudo é escapado antes.
function corpoHtml(t) {
  return String(t || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => '<p>' + esc(p).replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s<]+)/g, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`) + '</p>').join('');
}
function miniatura(a, cls) {
  return imgOk(a.foto) ? `<img class="${cls}" src="${esc(a.foto)}" alt="${esc(a.bannerAlt || a.titulo)}" loading="lazy">` : `<div class="${cls} atv-sem-foto" role="img" aria-label="Atividade sem foto"><i class="fas fa-seedling"></i></div>`;
}
const selos = a => `<span class="atv-cat">${esc(CAT1[catDe(a.categoria)])}</span>${a.origem === 'externa' ? '<span class="atv-ext"><i class="fas fa-external-link-alt"></i> Atividade externa</span>' : ''}`;

/* ---------- Área aberta ---------- */
function paginaLista() {
  const el = document.getElementById('atv-lista'); if (!el) return;
  let cat = ''; try { cat = new URLSearchParams(location.search).get('cat') || ''; } catch (e) { /* sem parâmetro */ }
  if (!CATS[cat]) cat = '';
  const todasPub = publicadas(), ls = cat ? todasPub.filter(a => catDe(a.categoria) === cat) : todasPub;
  const abas = [['', 'Todas']].concat(Object.keys(CATS).map(k => [k, CATS[k]]));
  const titulo = document.querySelector('.page-hero h1'); if (titulo && cat) titulo.textContent = 'Atividades · ' + CATS[cat];
  el.innerHTML = `<nav class="atv-abas" aria-label="Tipos de atividade">${abas.map(([k, n]) => `<a href="atividades.html${k ? '?cat=' + k : ''}"${k === cat ? ' aria-current="page" class="on"' : ''}>${esc(n)}</a>`).join('')}</nav>
  ${ls.length ? `<div class="atv-lista">${ls.map(a => `<article class="atv-item">
      <a class="atv-foto" href="${hrefArtigo(a.id)}" tabindex="-1" aria-hidden="true">${miniatura(a, 'atv-img')}</a>
      <div class="atv-txt"><p class="atv-meta">${selos(a)}${a.dataAtiv ? `<span class="atv-data"><i class="far fa-calendar-alt"></i> ${esc(fmtData(a.dataAtiv))}</span>` : ''}</p>
        <h3><a href="${hrefArtigo(a.id)}">${esc(a.titulo)}</a></h3>
        <p class="atv-lide">${esc(a.lide)}</p>
        <a class="atv-mais" href="${hrefArtigo(a.id)}">Clique aqui e leia mais <i class="fas fa-arrow-right" aria-hidden="true"></i></a></div></article>`).join('')}</div>`
    : `<p class="vazio">${cat ? 'Ainda não há atividades publicadas nesta categoria.' : 'As atividades serão publicadas aqui. Volte em breve.'}</p>`}`;
}

function paginaArtigo() {
  const el = document.getElementById('atv-artigo'); if (!el) return;
  let id = ''; try { id = new URLSearchParams(location.search).get('id') || ''; } catch (e) { /* sem parâmetro */ }
  const a = publicadas().find(x => x.id === id);
  if (!a) { el.innerHTML = '<p class="vazio">Esta atividade não foi encontrada ou ainda não foi publicada.</p><p><a class="btn-visit" href="atividades.html">Ver todas as atividades</a></p>'; return; }
  document.title = a.titulo + ' | Atividades | Parque de Estudo e Reflexão Retiro';
  const outras = publicadas().filter(x => x.id !== a.id).sort((x, y) => (catDe(y.categoria) === catDe(a.categoria)) - (catDe(x.categoria) === catDe(a.categoria))).slice(0, 6);
  el.innerHTML = `<p class="atv-voltar"><a href="atividades.html?cat=${catDe(a.categoria)}"><i class="fas fa-arrow-left" aria-hidden="true"></i> ${esc(CATS[catDe(a.categoria)])}</a> &nbsp;·&nbsp; <a href="atividades.html">Todas as atividades</a></p>
  <p class="atv-meta">${selos(a)}${a.dataAtiv ? `<span class="atv-data"><i class="far fa-calendar-alt"></i> ${esc(fmtData(a.dataAtiv))}</span>` : ''}${a.local ? `<span class="atv-data"><i class="fas fa-map-marker-alt"></i> ${esc(a.local)}</span>` : ''}</p>
  <h2 class="atv-titulo">${esc(a.titulo)}</h2>
  <p class="atv-lide atv-lide-grande">${esc(a.lide)}</p>
  ${imgOk(a.foto) ? `<figure class="atv-figura"><img src="${esc(a.foto)}" alt="${esc(a.bannerAlt || a.titulo)}"></figure>` : ''}
  <div class="atv-corpo">${corpoHtml(a.texto)}</div>
  ${a.origem === 'externa' ? `<p class="tip-box" role="note"><i class="fas fa-info-circle"></i> Atividade realizada fora do Parque${a.organizacao ? ' por <strong>' + esc(a.organizacao) + '</strong>' : ''}, com relação ao Parque Retiro.${urlOk(a.linkExterno) ? ` <a href="${esc(a.linkExterno)}" target="_blank" rel="noopener">Mais informações</a>.` : ''}</p>` : ''}
  <p class="atv-autor"><i class="fas fa-pen-nib" aria-hidden="true"></i> <strong>Autor:</strong> ${esc(a.autor || 'Parque Retiro')}</p>
  ${outras.length ? `<section class="atv-outras" aria-labelledby="atv-outras-t"><h3 id="atv-outras-t">Outras atividades</h3><ul>${outras.map(o => `<li><a href="${hrefArtigo(o.id)}">${esc(o.titulo)}</a> <small>${esc(CAT1[catDe(o.categoria)])}${o.dataAtiv ? ' · ' + esc(fmtData(o.dataAtiv)) : ''}</small></li>`).join('')}</ul></section>` : ''}`;
}

// Slides para o banner do Início: só atividades publicadas, com banner e marcadas como destaque.
function slidesBanner() {
  try {
    return publicadas().filter(a => a.destaque && imgOk(a.banner)).slice(0, MAX_BANNER).map(a => ({ src: a.banner, alt: a.bannerAlt || a.titulo, link: hrefArtigo(a.id) }));
  } catch (e) { return []; }
}

/* ---------- Imagens ---------- */
function carrega(file) {
  return new Promise((ok, no) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); ok(im); }; im.onerror = () => { URL.revokeObjectURL(u); no(new Error('Não foi possível ler a imagem.')); }; im.src = u; });
}
function checa(file) {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) throw new Error('Use uma imagem JPG, PNG ou WebP.');
  if (file.size > 15 * 1048576) throw new Error('Imagem grande demais (máximo 15 MB).');
}
async function fotoPequena(file) { // lado maior 640 px
  checa(file); const im = await carrega(file), k = Math.min(1, 640 / Math.max(im.width, im.height)), c = document.createElement('canvas');
  c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.78);
}
async function imagemBanner(file) { // recorte centralizado na proporção 3:1 (sem esticar)
  checa(file); const im = await carrega(file), alvo = BANNER_W / BANNER_H, r = im.width / im.height;
  let sw = im.width, sh = im.height, sx = 0, sy = 0;
  if (r > alvo) { sw = Math.round(im.height * alvo); sx = Math.round((im.width - sw) / 2); } else { sh = Math.round(im.width / alvo); sy = Math.round((im.height - sh) / 2); }
  const w = Math.min(BANNER_W, sw), h = Math.round(w / alvo), c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, sx, sy, sw, sh, 0, 0, w, h);
  return { img: c.toDataURL('image/jpeg', 0.8), aviso: im.width < BANNER_W ? `A imagem tem ${im.width} px de largura (o ideal é ${BANNER_W}); pode perder nitidez no banner.` : '' };
}

/* ---------- Área restrita ---------- */
function abrir(me, root, H) {
  const { $, db, uid: uid2 } = H;
  const edita = H.tem(me, 'atividades');
  const S = { edit: '', msg: '', erro: '', foto: null, banner: null, cat: '' };
  const lista = () => db.get('atividades', []);
  const draw = () => {
    const ed = S.edit && S.edit !== 'novo' ? lista().find(a => a.id === S.edit) : null;
    const forma = !!S.edit && edita;
    const v = ed || { titulo: '', categoria: 'evento', origem: 'parque', dataAtiv: hoje(), local: '', organizacao: '', linkExterno: '', lide: '', texto: '', foto: '', banner: '', bannerAlt: '', destaque: false, autor: me.nome || '', status: 'rascunho' };
    if (S.foto === null) S.foto = v.foto || ''; if (S.banner === null) S.banner = v.banner || '';
    const itens = lista().filter(a => !S.cat || catDe(a.categoria) === S.cat).sort((a, b) => String(b.dataAtiv || '').localeCompare(String(a.dataAtiv || '')));
    root.innerHTML = `<h3><i class="fas fa-calendar-check"></i> Atividades</h3>
    <p>Registre por escrito o que acontece no Parque (eventos, encontros, retiros e reuniões) e também atividades externas que tenham relação com o Parque Retiro. As atividades <strong>publicadas</strong> aparecem na área aberta, em <a href="atividades.html" target="_blank" rel="noopener">O Parque &rsaquo; Atividades</a>, e as marcadas como destaque entram no banner do Início.</p>
    ${S.msg ? `<p class="tip-box" role="status">${esc(S.msg)}</p>` : ''}
    ${edita && !forma ? '<p><button type="button" class="btn-visit" id="at-novo"><i class="fas fa-plus"></i> Nova atividade</button></p>' : ''}
    ${!edita ? '<p class="vazio">Você pode consultar as atividades. Somente quem é responsável pelas Atividades (ou o administrador) cria e altera.</p>' : ''}
    ${forma ? `<form id="at-form" class="form-reserva" novalidate><h4>${ed ? 'Editar atividade' : 'Nova atividade'}</h4>
      <div class="form-row"><label for="at-t">Título *</label><input id="at-t" maxlength="120" value="${esc(v.titulo)}"></div>
      <div class="form-row"><label for="at-c">Tipo *</label><select id="at-c">${Object.keys(CATS).map(k => `<option value="${k}"${catDe(v.categoria) === k ? ' selected' : ''}>${esc(CAT1[k])}</option>`).join('')}</select></div>
      <div class="form-row"><label for="at-o">Onde acontece *</label><select id="at-o">${Object.keys(ORIGENS).map(k => `<option value="${k}"${v.origem === k ? ' selected' : ''}>${esc(ORIGENS[k])}</option>`).join('')}</select></div>
      <div class="form-row"><label for="at-d">Data da atividade *</label><input id="at-d" type="date" value="${esc(v.dataAtiv)}"></div>
      <div class="form-row"><label for="at-l">Local</label><input id="at-l" maxlength="120" value="${esc(v.local)}" placeholder="Ex.: Sala do Parque Retiro, Maricá/RJ"></div>
      <div id="at-ext" ${v.origem === 'externa' ? '' : 'hidden'}>
        <div class="form-row"><label for="at-og">Quem organiza (atividade externa)</label><input id="at-og" maxlength="120" value="${esc(v.organizacao)}"></div>
        <div class="form-row"><label for="at-u">Link com mais informações (opcional, começa com https://)</label><input id="at-u" maxlength="300" inputmode="url" value="${esc(v.linkExterno)}"></div>
      </div>
      <div class="form-row"><label for="at-li">Lide (resumo de 1 ou 2 frases, aparece na lista) *</label><textarea id="at-li" rows="2" maxlength="300">${esc(v.lide)}</textarea></div>
      <div class="form-row"><label for="at-x">Texto da atividade * <small>(separe os parágrafos com uma linha em branco)</small></label><textarea id="at-x" rows="12" maxlength="12000">${esc(v.texto)}</textarea></div>
      <div class="form-row"><label for="at-f">Foto pequena (aparece na lista e no artigo)</label><input id="at-f" type="file" accept="image/jpeg,image/png,image/webp">
        <div id="at-fp">${S.foto ? `<img src="${esc(S.foto)}" alt="Foto atual" style="max-width:160px;height:auto;margin-top:6px"> <button type="button" class="btn-visit" id="at-fx">Remover foto</button>` : ''}</div></div>
      <div class="form-row"><label for="at-a">Autor *</label><input id="at-a" maxlength="80" value="${esc(v.autor)}"></div>
      <fieldset class="funcoes"><legend>Banner do Início</legend>
        <label><input type="checkbox" id="at-dest"${v.destaque ? ' checked' : ''}> Destacar no banner do Início (leva para esta atividade)</label>
        <div class="form-row"><label for="at-b">Imagem do banner <small>(ideal: ${BANNER_W} × ${BANNER_H} px; imagens de outra proporção são recortadas no centro)</small></label><input id="at-b" type="file" accept="image/jpeg,image/png,image/webp">
          <div id="at-bp">${S.banner ? `<img src="${esc(S.banner)}" alt="Banner atual" style="max-width:360px;width:100%;height:auto;margin-top:6px;border:1px solid #ccd"> <button type="button" class="btn-visit" id="at-bx">Remover banner</button>` : ''}</div></div>
        <div class="form-row"><label for="at-ba">Descrição do banner e da foto (para quem não enxerga a imagem)</label><input id="at-ba" maxlength="200" value="${esc(v.bannerAlt)}"></div>
      </fieldset>
      <div class="form-row"><label for="at-s">Situação</label><select id="at-s"><option value="rascunho"${v.status !== 'publicada' ? ' selected' : ''}>Rascunho (só aparece aqui)</option><option value="publicada"${v.status === 'publicada' ? ' selected' : ''}>Publicada (aparece no site)</option></select></div>
      <p class="form-erro" id="at-er" role="alert"${S.erro ? '' : ' hidden'}>${esc(S.erro)}</p>
      <button class="btn-visit btn-large"><i class="fas fa-save"></i> ${ed ? 'Salvar alterações' : 'Salvar atividade'}</button> <button type="button" class="btn-visit" id="at-cancel" style="background:#6c7a7b">Cancelar</button>
    </form>` : ''}
    <div class="rc-filtros"><div class="form-row"><label for="at-fil">Mostrar</label><select id="at-fil"><option value="">Todos os tipos</option>${Object.keys(CATS).map(k => `<option value="${k}"${S.cat === k ? ' selected' : ''}>${esc(CATS[k])}</option>`).join('')}</select></div></div>
    <h4>Atividades registradas (${itens.length})</h4>
    ${itens.length ? `<table class="doc-table"><thead><tr><th>Título</th><th>Tipo</th><th>Data</th><th>Situação</th><th>Banner</th>${edita ? '<th></th>' : ''}</tr></thead><tbody>${itens.map(a => `<tr><td>${esc(a.titulo)}${a.origem === 'externa' ? ' <small>(externa)</small>' : ''}</td><td>${esc(CAT1[catDe(a.categoria)])}</td><td>${esc(fmtData(a.dataAtiv))}</td><td><span class="badge-status ${a.status === 'publicada' ? 'badge-disponivel' : 'badge-pend'}">${a.status === 'publicada' ? 'Publicada' : 'Rascunho'}</span></td><td>${a.destaque && imgOk(a.banner) ? 'No Início' : '-'}</td>${edita ? `<td><button class="btn-visit" data-ed="${esc(a.id)}">Editar</button> <button class="btn-visit" data-pub="${esc(a.id)}">${a.status === 'publicada' ? 'Tirar do site' : 'Publicar'}</button> <button class="btn-visit" data-del="${esc(a.id)}" style="background:#a33">Excluir</button></td>` : ''}</tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhuma atividade registrada ainda.</p>'}`;
    const nv = $('#at-novo', root); if (nv) nv.onclick = () => { S.edit = 'novo'; S.foto = null; S.banner = null; S.msg = ''; S.erro = ''; draw(); };
    $('#at-fil', root).onchange = e => { S.cat = e.target.value; draw(); };
    root.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { S.edit = b.dataset.ed; S.foto = null; S.banner = null; S.msg = ''; S.erro = ''; draw(); window.scrollTo({ top: root.getBoundingClientRect().top + scrollY - 20 }); });
    root.querySelectorAll('[data-pub]').forEach(b => b.onclick = () => { const l = lista(), x = l.find(a => a.id === b.dataset.pub); if (!x) return; x.status = x.status === 'publicada' ? 'rascunho' : 'publicada'; x.atualizadoEm = new Date().toISOString(); db.set('atividades', l); S.msg = x.status === 'publicada' ? 'Atividade publicada no site.' : 'Atividade retirada do site (voltou a rascunho).'; draw(); });
    root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const x = lista().find(a => a.id === b.dataset.del); if (x && confirm(`Excluir a atividade "${x.titulo}"?`)) { db.set('atividades', lista().filter(a => a.id !== x.id)); S.edit = ''; S.msg = 'Atividade excluída.'; draw(); } });
    const f = $('#at-form', root); if (!f) return;
    $('#at-cancel', root).onclick = () => { S.edit = ''; S.erro = ''; draw(); };
    $('#at-o', root).onchange = e => { $('#at-ext', root).hidden = e.target.value !== 'externa'; };
    const erro = m => { const er = $('#at-er', root); er.textContent = m; er.hidden = false; };
    const px = $('#at-fx', root); if (px) px.onclick = () => { S.foto = ''; $('#at-fp', root).innerHTML = ''; };
    const bx = $('#at-bx', root); if (bx) bx.onclick = () => { S.banner = ''; $('#at-bp', root).innerHTML = ''; };
    $('#at-f', root).onchange = async e => { const fl = e.target.files[0]; if (!fl) return; try { S.foto = await fotoPequena(fl); $('#at-fp', root).innerHTML = `<img src="${esc(S.foto)}" alt="Foto escolhida" style="max-width:160px;height:auto;margin-top:6px">`; $('#at-er', root).hidden = true; } catch (x) { e.target.value = ''; erro(x.message || 'Imagem inválida.'); } };
    $('#at-b', root).onchange = async e => { const fl = e.target.files[0]; if (!fl) return; try { const r = await imagemBanner(fl); S.banner = r.img; $('#at-bp', root).innerHTML = `<img src="${esc(S.banner)}" alt="Banner escolhido" style="max-width:360px;width:100%;height:auto;margin-top:6px;border:1px solid #ccd">`; if (r.aviso) erro(r.aviso); else $('#at-er', root).hidden = true; } catch (x) { e.target.value = ''; erro(x.message || 'Imagem inválida.'); } };
    f.onsubmit = e => {
      e.preventDefault(); if (!edita) return;
      const g = id => ($('#' + id, root).value || '').trim();
      if (!g('at-t')) return erro('Informe o título.');
      if (!g('at-d')) return erro('Informe a data da atividade.');
      if (!g('at-li')) return erro('Escreva o lide (um resumo curto).');
      if (!g('at-x')) return erro('Escreva o texto da atividade.');
      if (!g('at-a')) return erro('Informe o autor.');
      const ext = g('at-o') === 'externa', link = ext ? g('at-u') : '';
      if (link && !urlOk(link)) return erro('O link precisa começar com http:// ou https://.');
      const destaque = $('#at-dest', root).checked;
      if (destaque && !S.banner) return erro('Para destacar no banner do Início, escolha a imagem do banner.');
      const agora = new Date().toISOString();
      const reg = { id: ed ? ed.id : uid2(), titulo: g('at-t'), categoria: g('at-c'), origem: g('at-o'), dataAtiv: g('at-d'), local: g('at-l'), organizacao: ext ? g('at-og') : '', linkExterno: link, lide: g('at-li'), texto: $('#at-x', root).value.trim(), foto: S.foto || '', banner: S.banner || '', bannerAlt: g('at-ba'), destaque, autor: g('at-a'), status: g('at-s'), criadoEm: ed ? ed.criadoEm : agora, atualizadoEm: agora, por: me.nome };
      const l = lista().filter(a => a.id !== reg.id); l.push(reg);
      if (!db.set('atividades', l)) return erro('Não foi possível salvar: o espaço do navegador está cheio. Use imagens menores ou remova atividades antigas.');
      S.msg = reg.status === 'publicada' ? 'Atividade salva e publicada no site.' : 'Atividade salva como rascunho.'; S.edit = ''; S.erro = ''; S.foto = S.banner = null; draw();
    };
  };
  draw();
}

window.PR_ATIVIDADES = { CATS, CAT1, publicadas, slidesBanner, corpoHtml, abrir };
const pg = document.body && document.body.dataset.page;
if (pg === 'atividades') paginaLista(); else if (pg === 'atividade') paginaArtigo();
})();
