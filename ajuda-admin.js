// Central de Ajuda — administração (área restrita > Administração > Central de Ajuda).
// Quem usa: administrador e quem tiver a responsabilidade "Responsável pela Central de Ajuda" (função 'ajuda').
// Tudo é guardado como EDIÇÕES sobre o arquivo publicado (ajuda-conteudo.js), nas coleções:
//   ajuda_artigos (artigo inteiro, por id), ajuda_categorias (categoria inteira, por id), ajuda_dicas (explicação rápida, por chave).
// Um registro com excluido:true esconde o item do arquivo publicado. As edições valem na hora neste navegador e entram no backup.
// "Publicar" gera o novo ajuda-conteudo.js (para a hospedagem) e o conteudo.json (para o aplicativo), sem tocar no código.
(function () {
'use strict';
const SUBS = [['art', 'fa-book-open', 'Artigos'], ['cat', 'fa-folder', 'Categorias'], ['dic', 'fa-comment-dots', 'Explicações rápidas'], ['cob', 'fa-tasks', 'Cobertura'], ['pub', 'fa-upload', 'Publicar']];
const PUB = { todos: 'Para todos', equipe: 'Para a equipe' };
let H = null, pendente = null;

const A = () => window.PR_AJUDA;
const base = () => window.PR_AJUDA_CONTEUDO || { categorias: [], artigos: [], dicas: {}, contextos: {} };
const linhas = s => String(s || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const agora = () => new Date().toISOString();
const semMeta = o => { const c = { ...o }; ['em', 'por', 'origem', 'excluido'].forEach(k => delete c[k]); return JSON.stringify(c); };

function baixa(nome, texto, tipo) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([texto], { type: tipo || 'application/octet-stream' }));
  a.download = nome; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
// Grava um registro (por id) numa coleção de edições.
function grava(col, reg, me) {
  const l = H.db.get(col, []).filter(x => x.id !== reg.id);
  l.push({ ...reg, em: agora(), por: me.nome || me.email });
  const ok = H.db.set(col, l); A().invalida(); return ok;
}
function remove(col, id) { const ok = H.db.set(col, H.db.get(col, []).filter(x => x.id !== id)); A().invalida(); return ok; }
const temEdicao = (col, id) => H.db.get(col, []).some(x => x.id === id);
const naBase = (tipo, id) => tipo === 'dica' ? Object.prototype.hasOwnProperty.call(base().dicas || {}, id) : (base()[tipo] || []).some(x => x.id === id);

/* ---------------------------------------------------------- conteúdo final (para publicar) ---------------------------------------------------------- */
function montaPublicacao(paraApp) {
  const C = A().conteudo(), b = base();
  const v = String(b.versao || '1.0.0').split('.').map(n => +n || 0); while (v.length < 3) v.push(0); v[2]++;
  const limpaArt = a => { const x = { ...a }; delete x.origem; delete x.em; delete x.por; delete x.excluido; return x; };
  const cats = C.categorias.map(c => { const x = { ...c }; delete x.origem; delete x.em; delete x.por; return x; });
  const arts = C.artigos.map(limpaArt).sort((a, b2) => a.categoria.localeCompare(b2.categoria) || (a.ordem || 99) - (b2.ordem || 99));
  const dicas = {};
  [...C.dicas.keys()].sort().forEach(k => { const d = C.dicas.get(k); dicas[k] = d.artigo ? [d.titulo, d.texto, d.artigo] : [d.titulo, d.texto]; });
  const out = { formato: 'parque-retiro-ajuda', versao: v.join('.'), atualizadoEm: agora().slice(0, 10), categorias: cats, artigos: arts, dicas, contextos: C.contextos };
  if (!paraApp) return out;
  // Formato do aplicativo: dicas como lista de objetos, sem dependência da interface web.
  return { ...out, dicas: Object.keys(dicas).map(k => ({ id: k, titulo: dicas[k][0], texto: dicas[k][1], artigo: dicas[k][2] || null })),
    esquema: { artigo: 'id, categoria, ordem, titulo, resumo, publico (todos|equipe), status (publicado|rascunho), palavras[], onde, secoes{oQueE, finalidade, passos[], exemplos[], cuidados[]}, imagens[{src, legenda, alt}], relacionados[], atualizadoEm', marcacao: '**negrito** e [[id-do-artigo|texto]] para links entre artigos', imagens: 'src relativo à raiz do site (ex.: ajuda/img/x.jpg) ou data:image' } };
}
const CAB = `// Base de conhecimento da ajuda do Parque Retiro (Central de Ajuda, dicas e "Saiba mais").
// ARQUIVO DE CONTEÚDO, não de código: pode ser gerado de novo pela área restrita (Administração > Central de Ajuda > Publicar)
// e substituído na hospedagem. A mesma base vai para o aplicativo em ajuda/conteudo.json (node tools/exportar_ajuda.js).
// Estrutura: categorias[], artigos[] (secoes: oQueE, finalidade, passos, exemplos, cuidados), dicas { chave: [titulo, texto, artigo] }
// e contextos { "p.pagina" | "r.aba" | "r.aba.sub.valor": artigo }. Chaves explicadas em docs/CENTRAL_AJUDA.md.
`;

/* --------------------------------------------------------------------- tela --------------------------------------------------------------------- */
function abrir(me, root, h) {
  H = h; const { esc, $ } = H;
  const S = { sub: pendente ? 'art' : 'art', edit: pendente, q: '', fc: '', fs: '', dq: '', df: '', msg: '', erro: '' };
  pendente = null;
  const pode = me.nivel === 'administrador' || (me.funcoes || []).includes('ajuda');
  const aviso = () => (S.msg ? `<p class="tip-box" role="status">${esc(S.msg)}</p>` : '') + (S.erro ? `<p class="form-erro" role="alert">${esc(S.erro)}</p>` : '');
  const desenha = () => {
    root.innerHTML = `<h3><i class="fas fa-question-circle"></i> Central de Ajuda</h3>
    <p>Artigos, categorias e explicações rápidas que aparecem em todo o site. As edições valem na hora neste navegador; para valer para todos, use <strong>Publicar</strong>. <a href="ajuda.html" target="_blank" rel="noopener">Abrir a Central de Ajuda <i class="fas fa-external-link-alt" aria-hidden="true"></i></a></p>
    <div class="tabs sub" role="tablist" aria-label="Central de Ajuda">${SUBS.map(t => `<button type="button" class="tab-btn${t[0] === S.sub ? ' active' : ''}" role="tab" aria-selected="${t[0] === S.sub}" data-ca="${t[0]}"><i class="fas ${t[1]}" aria-hidden="true"></i> ${t[2]}</button>`).join('')}</div>
    ${aviso()}<div id="ca-corpo"></div>`;
    root.querySelectorAll('[data-ca]').forEach(b => b.onclick = () => { S.sub = b.dataset.ca; S.edit = null; S.msg = S.erro = ''; desenha(); });
    const c = $('#ca-corpo', root);
    if (!pode) { c.innerHTML = '<p class="vazio">Você pode consultar a ajuda pelo botão ? Ajuda. Somente o administrador e o Responsável pela Central de Ajuda alteram o conteúdo.</p>'; return; }
    ({ art: S.edit !== null && S.edit !== undefined ? editor : artigos, cat: categorias, dic: dicas, cob: cobertura, pub: publicar })[S.sub](c);
    S.msg = S.erro = '';
  };
  const ok = m => { S.msg = m; S.erro = ''; }, falha = m => { S.erro = m; S.msg = ''; };

  /* ---------- Artigos ---------- */
  function artigos(el) {
    const C = A().conteudo(), cats = C.categorias, nq = A().buscar && S.q ? new Set(A().buscar(S.q, C.artigos).map(a => a.id)) : null;
    const l = C.artigos.filter(a => (!S.fc || a.categoria === S.fc) && (!S.fs || (a.status || 'publicado') === S.fs) && (!nq || nq.has(a.id)))
      .sort((a, b) => (cats.findIndex(c => c.id === a.categoria) - cats.findIndex(c => c.id === b.categoria)) || (a.ordem || 99) - (b.ordem || 99));
    const catN = id => (cats.find(c => c.id === id) || {}).nome || id;
    const orig = a => a.origem === 'novo' ? '<span class="badge-status badge-pend">novo</span>' : a.origem === 'editado' ? '<span class="badge-status badge-uso">editado aqui</span>' : '<span class="vazio">publicado</span>';
    el.innerHTML = `<div class="form-reserva" style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
      <div class="form-row" style="flex:2 1 220px;margin:0"><label for="ca-q">Buscar artigo</label><input id="ca-q" type="search" value="${esc(S.q)}" placeholder="Título ou palavra-chave"></div>
      <div class="form-row" style="flex:1 1 160px;margin:0"><label for="ca-fc">Categoria</label><select id="ca-fc"><option value="">Todas</option>${cats.map(c => `<option value="${esc(c.id)}"${c.id === S.fc ? ' selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></div>
      <div class="form-row" style="flex:1 1 140px;margin:0"><label for="ca-fs">Situação</label><select id="ca-fs"><option value="">Todas</option><option value="publicado"${S.fs === 'publicado' ? ' selected' : ''}>Publicados</option><option value="rascunho"${S.fs === 'rascunho' ? ' selected' : ''}>Rascunhos (fora do ar)</option></select></div>
      <button type="button" class="btn-visit" id="ca-novo"><i class="fas fa-plus-circle"></i> Novo artigo</button></div>
    <p class="vazio">${l.length} de ${C.artigos.length} artigo(s).</p>
    <div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Artigo</th><th>Categoria</th><th>Público</th><th>Situação</th><th>Ações</th></tr></thead><tbody>
    ${l.map(a => `<tr><td><strong>${esc(a.titulo)}</strong><br><small class="vazio">${esc(a.id)}</small></td><td>${esc(catN(a.categoria))}</td><td>${esc(PUB[a.publico] || PUB.todos)}</td>
      <td>${a.status === 'rascunho' ? '<span class="badge-status badge-emprestado">Rascunho</span>' : '<span class="badge-status badge-disponivel">No ar</span>'} ${orig(a)}</td>
      <td style="white-space:nowrap"><button type="button" class="btn-visit" data-ver="${esc(a.id)}" aria-label="Ver ${esc(a.titulo)}"><i class="fas fa-eye"></i></button>
      <button type="button" class="btn-visit" data-ed="${esc(a.id)}" aria-label="Editar ${esc(a.titulo)}"><i class="fas fa-edit"></i></button>
      <button type="button" class="btn-visit" data-st="${esc(a.id)}">${a.status === 'rascunho' ? 'Publicar' : 'Retirar do ar'}</button>
      ${a.origem === 'editado' ? `<button type="button" class="btn-visit" data-rs="${esc(a.id)}">Voltar ao publicado</button>` : ''}
      <button type="button" class="btn-visit" data-del="${esc(a.id)}" aria-label="Excluir ${esc(a.titulo)}"><i class="fas fa-trash"></i></button></td></tr>`).join('') || '<tr><td colspan="5" class="vazio">Nenhum artigo com esses filtros.</td></tr>'}
    </tbody></table></div>`;
    let t = 0; $('#ca-q', el).oninput = e => { clearTimeout(t); t = setTimeout(() => { S.q = e.target.value.trim(); const p = e.target.selectionStart; artigos(el); const q = $('#ca-q', el); q.focus(); try { q.setSelectionRange(p, p); } catch (x) { /* ignora */ } }, 300); };
    $('#ca-fc', el).onchange = e => { S.fc = e.target.value; artigos(el); };
    $('#ca-fs', el).onchange = e => { S.fs = e.target.value; artigos(el); };
    $('#ca-novo', el).onclick = () => { S.edit = ''; desenha(); };
    el.querySelectorAll('[data-ver]').forEach(b => b.onclick = () => A().abrir(b.dataset.ver));
    el.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { S.edit = b.dataset.ed; desenha(); });
    el.querySelectorAll('[data-st]').forEach(b => b.onclick = () => {
      const a = A().conteudo().artigos.find(x => x.id === b.dataset.st); if (!a) return;
      const n = { ...a, status: a.status === 'rascunho' ? 'publicado' : 'rascunho' }; delete n.origem;
      grava('ajuda_artigos', n, me); ok(n.status === 'rascunho' ? 'Artigo retirado do ar (rascunho).' : 'Artigo publicado.'); desenha();
    });
    el.querySelectorAll('[data-rs]').forEach(b => b.onclick = () => { if (!confirm('Descartar as edições feitas aqui e voltar ao texto publicado?')) return; remove('ajuda_artigos', b.dataset.rs); ok('Artigo voltou ao texto publicado.'); desenha(); });
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const id = b.dataset.del, usos = A().conteudo().artigos.filter(x => (x.relacionados || []).includes(id)).length;
      if (!confirm(`Excluir este artigo?${usos ? ` Ele aparece como relacionado em ${usos} artigo(s); esses links deixam de aparecer.` : ''} Para só tirar do ar, use "Retirar do ar".`)) return;
      if (naBase('artigos', id)) grava('ajuda_artigos', { id, excluido: true }, me); else remove('ajuda_artigos', id);
      ok('Artigo excluído.'); desenha();
    });
  }

  function editor(el) {
    const C = A().conteudo(), novo = !S.edit, a0 = novo ? null : C.artigos.find(x => x.id === S.edit);
    if (!novo && !a0) { S.edit = null; return artigos(el); }
    const a = a0 || { id: '', categoria: (C.categorias[0] || {}).id, titulo: '', resumo: '', publico: 'equipe', status: 'publicado', ordem: 50, palavras: [], onde: '', secoes: {}, imagens: [], relacionados: [] };
    const s = a.secoes || {}; let imgs = (a.imagens || []).map(x => ({ ...x }));
    const outros = C.artigos.filter(x => x.id !== a.id).sort((x, y) => x.titulo.localeCompare(y.titulo, 'pt-BR'));
    el.innerHTML = `<form id="ca-f" class="form-reserva" novalidate>
      <h4>${novo ? 'Novo artigo' : 'Editar artigo'}</h4>
      <div class="form-row"><label for="ca-t">Título *</label><input id="ca-t" maxlength="120" value="${esc(a.titulo)}" placeholder="Ex.: Como registrar um empréstimo de livro"></div>
      <div class="form-row"><label for="ca-id">Identificador (usado nos links) *</label><input id="ca-id" maxlength="60" value="${esc(a.id)}" ${novo ? '' : 'readonly'} placeholder="gerado a partir do título"><small>${novo ? 'Só letras minúsculas, números e hífen. Não muda depois de criado.' : 'Não pode ser alterado: outros artigos, dicas e o aplicativo apontam para ele.'}</small></div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div class="form-row" style="flex:2 1 200px"><label for="ca-c">Categoria *</label><select id="ca-c">${C.categorias.map(c => `<option value="${esc(c.id)}"${c.id === a.categoria ? ' selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></div>
        <div class="form-row" style="flex:1 1 150px"><label for="ca-p">Público</label><select id="ca-p"><option value="todos"${a.publico === 'todos' ? ' selected' : ''}>Para todos</option><option value="equipe"${a.publico !== 'todos' ? ' selected' : ''}>Para a equipe</option></select></div>
        <div class="form-row" style="flex:1 1 150px"><label for="ca-s">Situação</label><select id="ca-s"><option value="publicado"${a.status !== 'rascunho' ? ' selected' : ''}>No ar</option><option value="rascunho"${a.status === 'rascunho' ? ' selected' : ''}>Rascunho (fora do ar)</option></select></div>
        <div class="form-row" style="flex:0 1 110px"><label for="ca-o">Ordem</label><input id="ca-o" type="number" min="1" max="999" value="${esc(a.ordem || 50)}"></div>
      </div>
      <div class="form-row"><label for="ca-r">Resumo (1 frase, aparece nas listas e na busca)</label><textarea id="ca-r" rows="2" maxlength="300">${esc(a.resumo)}</textarea></div>
      <div class="form-row"><label for="ca-k">Palavras-chave para a busca (separadas por vírgula)</label><input id="ca-k" maxlength="300" value="${esc((a.palavras || []).join(', '))}" placeholder="Ex.: empréstimo, devolução, livro"></div>
      <div class="form-row"><label for="ca-w">Onde fica (caminho na tela)</label><input id="ca-w" maxlength="200" value="${esc(a.onde || '')}" placeholder="Ex.: **Comissões Parque Retiro › Biblioteca**"></div>
      <div class="form-row"><label for="ca-1">O que é</label><textarea id="ca-1" rows="3" maxlength="2000">${esc(s.oQueE || '')}</textarea></div>
      <div class="form-row"><label for="ca-2">Para que serve</label><textarea id="ca-2" rows="2" maxlength="1500">${esc(s.finalidade || '')}</textarea></div>
      <div class="form-row"><label for="ca-3">Passo a passo (um passo por linha)</label><textarea id="ca-3" rows="7" maxlength="6000">${esc((s.passos || []).join('\n'))}</textarea></div>
      <div class="form-row"><label for="ca-4">Exemplos práticos (um por linha)</label><textarea id="ca-4" rows="3" maxlength="3000">${esc((s.exemplos || []).join('\n'))}</textarea></div>
      <div class="form-row"><label for="ca-5">Cuidados e observações (um por linha)</label><textarea id="ca-5" rows="3" maxlength="3000">${esc((s.cuidados || []).join('\n'))}</textarea></div>
      <p class="vazio">Formatação: **texto** fica em negrito; para link a outro artigo, use colchetes duplos com o identificador e o texto separados por barra vertical.</p>
      <fieldset class="funcoes"><legend>Imagens, capturas de tela e ilustrações</legend><div id="ca-imgs"></div>
        <div class="form-row"><label for="ca-if">Enviar imagem do computador</label><input id="ca-if" type="file" accept="image/*"><small>A imagem é reduzida para 1200 px de largura. Prefira capturas da tela atual com o item destacado.</small></div>
        <div class="form-row"><label for="ca-iu">ou endereço de uma imagem já publicada</label><div style="display:flex;gap:8px"><input id="ca-iu" placeholder="ajuda/img/nome.jpg ou https://..." style="flex:1"><button type="button" class="btn-visit" id="ca-iub">Acrescentar</button></div></div>
      </fieldset>
      <fieldset class="funcoes"><legend>Conteúdos relacionados (aparecem no fim do artigo)</legend>
        <div class="form-row"><label for="ca-rq">Filtrar a lista</label><input id="ca-rq" type="search" placeholder="Digite para filtrar"></div>
        <div id="ca-rel" style="max-height:220px;overflow:auto;border:1px solid var(--border-color);border-radius:6px;padding:6px 10px">${outros.map(o => `<label style="display:block"><input type="checkbox" value="${esc(o.id)}"${(a.relacionados || []).includes(o.id) ? ' checked' : ''}> ${esc(o.titulo)}</label>`).join('')}</div>
      </fieldset>
      <p class="form-erro" id="ca-er" role="alert" hidden></p>
      <button class="btn-visit btn-large" id="ca-salvar"><i class="fas fa-save"></i> Salvar artigo</button>
      <button type="button" class="btn-visit" id="ca-ver"><i class="fas fa-eye"></i> Salvar e visualizar</button>
      <button type="button" class="btn-visit" id="ca-cancel">Cancelar</button>
    </form>`;
    const f = $('#ca-f', el), er = $('#ca-er', el), erro = m => { er.textContent = m; er.hidden = false; er.scrollIntoView({ block: 'center' }); return false; };
    if (novo) $('#ca-t', el).oninput = e => { $('#ca-id', el).value = slug(e.target.value); };
    const desenhaImgs = () => {
      $('#ca-imgs', el).innerHTML = imgs.length ? imgs.map((im, i) => `<div style="display:flex;gap:10px;align-items:flex-start;margin:0 0 10px;padding:8px;border:1px solid var(--border-color);border-radius:6px">
        <img src="${esc(/^(https?:|data:image\/)/.test(im.src) ? im.src : im.src)}" alt="" style="width:120px;height:80px;object-fit:cover;border-radius:4px;background:#eee">
        <div style="flex:1"><label class="vazio" for="ca-il${i}">Legenda (aparece abaixo da imagem)</label><input id="ca-il${i}" data-il="${i}" value="${esc(im.legenda || '')}" style="width:100%">
        <label class="vazio" for="ca-ia${i}">Descrição para leitor de tela</label><input id="ca-ia${i}" data-ia="${i}" value="${esc(im.alt || '')}" style="width:100%"></div>
        <div><button type="button" class="btn-visit" data-iup="${i}" aria-label="Subir imagem"${i ? '' : ' disabled'}><i class="fas fa-arrow-up"></i></button> <button type="button" class="btn-visit" data-irm="${i}" aria-label="Remover imagem"><i class="fas fa-trash"></i></button></div></div>`).join('') : '<p class="vazio">Nenhuma imagem.</p>';
      el.querySelectorAll('[data-il]').forEach(i => i.oninput = () => { imgs[+i.dataset.il].legenda = i.value; });
      el.querySelectorAll('[data-ia]').forEach(i => i.oninput = () => { imgs[+i.dataset.ia].alt = i.value; });
      el.querySelectorAll('[data-irm]').forEach(b => b.onclick = () => { imgs.splice(+b.dataset.irm, 1); desenhaImgs(); });
      el.querySelectorAll('[data-iup]').forEach(b => b.onclick = () => { const i = +b.dataset.iup; [imgs[i - 1], imgs[i]] = [imgs[i], imgs[i - 1]]; desenhaImgs(); });
      el.querySelectorAll('#ca-imgs img').forEach((im, i) => { const src = imgs[i].src; if (!/^(https?:|data:)/.test(src)) im.src = src; });
    };
    desenhaImgs();
    $('#ca-if', el).onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      try { const src = await H.reduz(file, 1200, 0.8); imgs.push({ src, legenda: '', alt: '' }); desenhaImgs(); e.target.value = ''; } catch (x) { erro('Não foi possível ler a imagem.'); }
    };
    $('#ca-iub', el).onclick = () => { const u = $('#ca-iu', el).value.trim(); if (!u) return; if (!/^(https:\/\/|ajuda\/img\/|[a-z0-9_\-/]+\.(png|jpe?g|webp|gif|svg)$)/i.test(u)) return erro('Endereço de imagem inválido. Use https://... ou um caminho do site, como ajuda/img/nome.jpg.'); imgs.push({ src: u, legenda: '', alt: '' }); $('#ca-iu', el).value = ''; desenhaImgs(); };
    $('#ca-rq', el).oninput = e => { const q = slug(e.target.value); el.querySelectorAll('#ca-rel label').forEach(l => { l.hidden = q && !slug(l.textContent).includes(q); }); };
    $('#ca-cancel', el).onclick = () => { S.edit = null; desenha(); };
    const salvar = () => {
      er.hidden = true;
      const id = $('#ca-id', el).value.trim(), titulo = $('#ca-t', el).value.trim();
      if (!titulo) return erro('Informe o título.');
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) return erro('Identificador inválido: use letras minúsculas, números e hífen.');
      if (novo && A().conteudo().artigos.some(x => x.id === id)) return erro('Já existe um artigo com este identificador. Mude o título ou o identificador.');
      const reg = { id, categoria: $('#ca-c', el).value, ordem: +$('#ca-o', el).value || 50, titulo, resumo: $('#ca-r', el).value.trim(), publico: $('#ca-p', el).value, status: $('#ca-s', el).value,
        palavras: $('#ca-k', el).value.split(',').map(x => x.trim()).filter(Boolean), onde: $('#ca-w', el).value.trim(),
        secoes: { oQueE: $('#ca-1', el).value.trim(), finalidade: $('#ca-2', el).value.trim(), passos: linhas($('#ca-3', el).value), exemplos: linhas($('#ca-4', el).value), cuidados: linhas($('#ca-5', el).value) },
        imagens: imgs.filter(i => i.src), relacionados: [...el.querySelectorAll('#ca-rel input:checked')].map(i => i.value), atualizadoEm: agora().slice(0, 10) };
      if (!reg.resumo && !reg.secoes.oQueE && !reg.secoes.passos.length) return erro('Escreva pelo menos o resumo, o "O que é" ou o passo a passo.');
      if (!grava('ajuda_artigos', reg, me)) return erro('Não foi possível salvar: o espaço do navegador pode estar cheio (imagens ocupam bastante). Remova imagens ou use endereços de imagens publicadas.');
      return reg;
    };
    f.onsubmit = e => { e.preventDefault(); const r = salvar(); if (r) { S.edit = null; ok('Artigo salvo.'); desenha(); } };
    $('#ca-ver', el).onclick = () => { const r = salvar(); if (r) { S.edit = r.id; ok('Artigo salvo.'); desenha(); A().abrir(r.id); } };
    $('#ca-t', el).focus();
  }

  /* ---------- Categorias ---------- */
  function categorias(el) {
    const C = A().conteudo(), n = id => C.artigos.filter(a => a.categoria === id).length;
    el.innerHTML = `<p>Organize os artigos em categorias. A ordem define a posição na Central de Ajuda. Ícones: nomes do Font Awesome (ex.: fa-book, fa-users, fa-calendar).</p>
    <div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Ordem</th><th>Nome</th><th>Ícone</th><th>Descrição</th><th>Artigos</th><th></th></tr></thead><tbody>
    ${C.categorias.map(c => `<tr data-cid="${esc(c.id)}"><td><input type="number" data-k="ordem" value="${esc(c.ordem || 50)}" style="width:64px" aria-label="Ordem de ${esc(c.nome)}"></td>
      <td><input data-k="nome" value="${esc(c.nome)}" aria-label="Nome da categoria" maxlength="80"></td>
      <td><i class="fas ${esc(c.icone || 'fa-folder')}" aria-hidden="true"></i> <input data-k="icone" value="${esc(c.icone || '')}" style="width:130px" aria-label="Ícone de ${esc(c.nome)}"></td>
      <td><input data-k="descricao" value="${esc(c.descricao || '')}" aria-label="Descrição de ${esc(c.nome)}" maxlength="200" style="min-width:240px"></td>
      <td>${n(c.id)}</td><td>${c.origem === 'editado' ? `<button type="button" class="btn-visit" data-crs="${esc(c.id)}">Voltar ao publicado</button> ` : ''}<button type="button" class="btn-visit" data-cdel="${esc(c.id)}" aria-label="Excluir categoria ${esc(c.nome)}"${n(c.id) ? ' disabled title="Mova os artigos antes de excluir"' : ''}><i class="fas fa-trash"></i></button></td></tr>`).join('')}
    </tbody></table></div>
    <p><button type="button" class="btn-visit" id="ca-csalva"><i class="fas fa-save"></i> Salvar alterações</button></p>
    <form id="ca-cf" class="form-reserva" novalidate><h4>Nova categoria</h4>
      <div class="form-row"><label for="ca-cn">Nome *</label><input id="ca-cn" maxlength="80"></div>
      <div class="form-row"><label for="ca-ci">Ícone</label><input id="ca-ci" placeholder="fa-folder"></div>
      <div class="form-row"><label for="ca-cd">Descrição</label><input id="ca-cd" maxlength="200"></div>
      <button class="btn-visit"><i class="fas fa-plus-circle"></i> Criar categoria</button></form>`;
    $('#ca-csalva', el).onclick = () => {
      let n2 = 0;
      el.querySelectorAll('tr[data-cid]').forEach(tr => {
        const c = C.categorias.find(x => x.id === tr.dataset.cid), novo = { ...c }; delete novo.origem;
        tr.querySelectorAll('[data-k]').forEach(i => { novo[i.dataset.k] = i.dataset.k === 'ordem' ? (+i.value || 50) : i.value.trim(); });
        if (semMeta(novo) !== semMeta(c)) { grava('ajuda_categorias', novo, me); n2++; }
      });
      ok(n2 ? n2 + ' categoria(s) atualizada(s).' : 'Nenhuma alteração.'); desenha();
    };
    el.querySelectorAll('[data-crs]').forEach(b => b.onclick = () => { remove('ajuda_categorias', b.dataset.crs); ok('Categoria voltou ao publicado.'); desenha(); });
    el.querySelectorAll('[data-cdel]').forEach(b => b.onclick = () => { if (!confirm('Excluir esta categoria?')) return; const id = b.dataset.cdel; if (naBase('categorias', id)) grava('ajuda_categorias', { id, excluido: true }, me); else remove('ajuda_categorias', id); ok('Categoria excluída.'); desenha(); });
    $('#ca-cf', el).onsubmit = e => {
      e.preventDefault(); const nome = $('#ca-cn', el).value.trim(); if (!nome) { falha('Informe o nome da categoria.'); return desenha(); }
      let id = slug(nome) || 'categoria'; while (A().conteudo().categorias.some(c => c.id === id)) id += '-2';
      grava('ajuda_categorias', { id, nome, icone: $('#ca-ci', el).value.trim() || 'fa-folder', descricao: $('#ca-cd', el).value.trim(), ordem: A().conteudo().categorias.length + 1 }, me);
      ok('Categoria criada.'); desenha();
    };
  }

  /* ---------- Explicações rápidas (dicas) ---------- */
  function dicas(el) {
    const C = A().conteudo(), q = slug(S.dq), arts = C.artigos.slice().sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
    const todas = [...C.dicas.values()].filter(d => (!q || slug(d.id + ' ' + d.titulo + ' ' + d.texto).includes(q)) && (!S.df || (S.df === 'editadas' ? d.origem !== 'base' : d.id.startsWith(S.df))));
    const lim = 150, l = todas.sort((a, b) => a.id.localeCompare(b.id)).slice(0, lim);
    const areas = [['', 'Todas'], ['editadas', 'Editadas aqui'], ['global.', 'Todas as páginas'], ['menu.', 'Menu do site'], ['painel.', 'Painel'], ['aba.', 'Botões das ferramentas'], ['r.', 'Área restrita (dentro das ferramentas)'], ['p.', 'Páginas públicas']];
    el.innerHTML = `<p>Textos das dicas que aparecem ao passar o mouse, no toque longo e no modo ajuda. <strong>Jeito mais fácil de editar:</strong> abra a tela, ligue o <strong>modo ajuda</strong> (botão ? Ajuda), clique no item e use <em>Editar esta explicação</em>.</p>
    <div class="form-reserva" style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
      <div class="form-row" style="flex:2 1 240px;margin:0"><label for="ca-dq">Buscar (chave, título ou texto)</label><input id="ca-dq" type="search" value="${esc(S.dq)}"></div>
      <div class="form-row" style="flex:1 1 200px;margin:0"><label for="ca-df">Mostrar</label><select id="ca-df">${areas.map(([v, t]) => `<option value="${v}"${v === S.df ? ' selected' : ''}>${t}</option>`).join('')}</select></div>
      <button type="button" class="btn-visit" id="ca-dnova"><i class="fas fa-plus-circle"></i> Nova explicação</button></div>
    <p class="vazio">${todas.length} explicação(ões)${todas.length > lim ? `; mostrando as ${lim} primeiras, refine a busca` : ''}.</p>
    <div id="ca-dform"></div>
    <div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Chave</th><th>Título e texto</th><th>Saiba mais</th><th></th></tr></thead><tbody>
    ${l.map(d => `<tr><td><code style="font-size:.75rem;word-break:break-all">${esc(d.id)}</code>${d.origem !== 'base' ? '<br><span class="badge-status badge-uso">editada aqui</span>' : ''}</td><td><strong>${esc(d.titulo)}</strong><br><small>${esc(d.texto)}</small></td><td><small>${esc((arts.find(a => a.id === d.artigo) || {}).titulo || '(da tela)')}</small></td>
      <td style="white-space:nowrap"><button type="button" class="btn-visit" data-ded="${esc(d.id)}" aria-label="Editar explicação ${esc(d.titulo)}"><i class="fas fa-edit"></i></button>${d.origem !== 'base' ? ` <button type="button" class="btn-visit" data-drs="${esc(d.id)}">${naBase('dica', d.id) ? 'Voltar ao publicado' : 'Excluir'}</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="4" class="vazio">Nenhuma explicação com esses filtros.</td></tr>'}
    </tbody></table></div>`;
    let t = 0; $('#ca-dq', el).oninput = e => { clearTimeout(t); t = setTimeout(() => { S.dq = e.target.value; const p = e.target.selectionStart; dicas(el); const i = $('#ca-dq', el); i.focus(); try { i.setSelectionRange(p, p); } catch (x) { /* ignora */ } }, 300); };
    $('#ca-df', el).onchange = e => { S.df = e.target.value; dicas(el); };
    $('#ca-dnova', el).onclick = () => formDica($('#ca-dform', el), null);
    el.querySelectorAll('[data-ded]').forEach(b => b.onclick = () => formDica($('#ca-dform', el), C.dicas.get(b.dataset.ded)));
    el.querySelectorAll('[data-drs]').forEach(b => b.onclick = () => { remove('ajuda_dicas', b.dataset.drs); ok('Explicação restaurada.'); desenha(); });
  }
  function formDica(box, d, auto) {
    const arts = A().conteudo().artigos.slice().sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
    d = d || auto || { id: '', titulo: '', texto: '', artigo: '' };
    box.innerHTML = `<form class="form-reserva" id="ca-dfm" novalidate style="border:1px solid var(--accent-color);border-radius:8px;padding:12px 16px;margin:0 0 16px"><h4>${d.id && !auto ? 'Editar explicação' : 'Nova explicação'}</h4>
      <div class="form-row"><label for="ca-dk">Chave *</label><input id="ca-dk" value="${esc(d.id)}" ${d.id ? 'readonly' : ''} placeholder="Ex.: r.inventario.f-n"><small>Veja a chave de qualquer item no cartão do modo ajuda.</small></div>
      <div class="form-row"><label for="ca-dt">Título curto</label><input id="ca-dt" maxlength="80" value="${esc(d.titulo)}"></div>
      <div class="form-row"><label for="ca-dx">Explicação (1 a 3 frases) *</label><textarea id="ca-dx" rows="3" maxlength="400">${esc(d.texto)}</textarea></div>
      <div class="form-row"><label for="ca-da">“Saiba mais” leva ao artigo</label><select id="ca-da"><option value="">(artigo da tela)</option>${arts.map(a => `<option value="${esc(a.id)}"${a.id === d.artigo ? ' selected' : ''}>${esc(a.titulo)}</option>`).join('')}</select></div>
      <p class="form-erro" id="ca-der" role="alert" hidden></p>
      <button class="btn-visit"><i class="fas fa-save"></i> Salvar explicação</button> <button type="button" class="btn-visit" id="ca-dx-c">Cancelar</button></form>`;
    $('#ca-dx-c', box).onclick = () => { box.innerHTML = ''; };
    $('#ca-dfm', box).onsubmit = e => {
      e.preventDefault(); const k = $('#ca-dk', box).value.trim(), x = $('#ca-dx', box).value.trim(), er = $('#ca-der', box);
      if (!/^[a-z][a-z0-9_.\-]+$/i.test(k)) { er.textContent = 'Chave inválida.'; er.hidden = false; return; }
      if (x.length < 10) { er.textContent = 'Escreva a explicação (pelo menos 10 caracteres).'; er.hidden = false; return; }
      grava('ajuda_dicas', { id: k, titulo: $('#ca-dt', box).value.trim(), texto: x, artigo: $('#ca-da', box).value }, me);
      ok('Explicação salva.'); desenha();
    };
    $('#ca-dx', box).focus(); box.scrollIntoView({ block: 'nearest' });
  }

  /* ---------- Cobertura ---------- */
  function cobertura(el) {
    let v = {}; try { v = JSON.parse(localStorage.getItem('pr_ajuda_vistos') || '{}'); } catch (e) { v = {}; }
    const D = A().conteudo().dicas, ks = Object.keys(v);
    const faltam = ks.filter(k => !D.has(k) && v[k].f === 'automatica').sort();
    const escritos = ks.filter(k => D.has(k)).length;
    const grupos = {}; faltam.forEach(k => { const g = v[k].c || k.split('.').slice(0, 2).join('.'); (grupos[g] = grupos[g] || []).push(k); });
    const nomeCtx = c => c.startsWith('r.') ? 'Área restrita › ' + (c.slice(2) === 'painel' ? 'Painel' : c.slice(2)) : c.startsWith('p.') ? 'Página ' + c.slice(2) + '.html' : c;
    el.innerHTML = `<p>Enquanto você (ou outra pessoa que administra a ajuda) usa a plataforma, o sistema anota os botões e campos que apareceram na tela e se eles têm explicação escrita. Os que ainda usam o <strong>texto automático</strong> estão listados abaixo: escreva uma explicação melhor para os mais importantes.</p>
    <p><strong>${ks.length}</strong> item(ns) vistos neste navegador · <strong>${escritos}</strong> com explicação escrita · <strong>${faltam.length}</strong> com texto automático.</p>
    <p class="vazio">Dica: para registrar uma tela inteira, abra a ferramenta e as sub-abas dela. Itens só com texto automático já têm uma explicação básica (nome do campo, tipo, obrigatoriedade), mas sem detalhes do funcionamento.</p>
    <div id="ca-dform"></div>
    ${Object.keys(grupos).sort().map(g => `<details class="funcoes" style="margin:0 0 8px"><summary><strong>${esc(nomeCtx(g))}</strong> (${grupos[g].length})</summary><table class="doc-table"><tbody>${grupos[g].map(k => `<tr><td><code style="font-size:.75rem;word-break:break-all">${esc(k)}</code></td><td><strong>${esc(v[k].t)}</strong><br><small class="vazio">${esc(v[k].x || '')}</small></td><td><button type="button" class="btn-visit" data-esc="${esc(k)}">Escrever explicação</button></td></tr>`).join('')}</tbody></table></details>`).join('') || '<p class="vazio">Nada pendente entre os itens vistos.</p>'}
    <p><button type="button" class="btn-visit" id="ca-vlimpa">Limpar o registro de itens vistos</button></p>`;
    el.querySelectorAll('[data-esc]').forEach(b => b.onclick = () => { const k = b.dataset.esc; formDica($('#ca-dform', el), null, { id: k, titulo: v[k].t, texto: v[k].x || '', artigo: '' }); });
    $('#ca-vlimpa', el).onclick = () => { if (!confirm('Apagar o registro de itens vistos? As explicações não são afetadas.')) return; try { localStorage.removeItem('pr_ajuda_vistos'); } catch (e) { /* ignora */ } ok('Registro limpo.'); desenha(); };
  }

  /* ---------- Publicar ---------- */
  function publicar(el) {
    const ed = ['ajuda_artigos', 'ajuda_categorias', 'ajuda_dicas'].map(c => H.db.get(c, []).length), tot = ed.reduce((a, b) => a + b, 0);
    const b = base();
    el.innerHTML = `<p>Arquivo publicado: versão <strong>${esc(b.versao || '—')}</strong> de ${esc(String(b.atualizadoEm || '').split('-').reverse().join('/'))}. Edições feitas neste navegador: <strong>${ed[0]}</strong> artigo(s), <strong>${ed[1]}</strong> categoria(s), <strong>${ed[2]}</strong> explicação(ões).</p>
    <h4><i class="fas fa-globe"></i> Site</h4>
    <ol><li>Clique em <strong>Baixar ajuda-conteudo.js</strong>.</li><li>Na hospedagem, guarde uma cópia do arquivo atual e substitua-o pelo novo, na pasta do site (ao lado de index.html).</li><li>Abra o site em outro navegador e confira. Depois use <strong>Limpar edições já publicadas</strong>.</li></ol>
    <p><button type="button" class="btn-visit" id="ca-pjs"><i class="fas fa-download"></i> Baixar ajuda-conteudo.js</button></p>
    <h4><i class="fas fa-mobile-alt"></i> Aplicativo</h4>
    <p>O aplicativo usa a mesma base: os mesmos artigos, categorias e chaves das explicações, em JSON. Entregue o arquivo ao responsável pelo aplicativo (ou coloque-o em ajuda/conteudo.json na hospedagem).</p>
    <p><button type="button" class="btn-visit" id="ca-pjson"><i class="fas fa-download"></i> Baixar conteudo.json</button></p>
    <h4><i class="fas fa-exchange-alt"></i> Levar edições para outro computador</h4>
    <p><button type="button" class="btn-visit" id="ca-pexp"${tot ? '' : ' disabled'}><i class="fas fa-file-export"></i> Exportar edições (JSON)</button></p>
    <div class="form-row"><label for="ca-pimp">Importar edições (JSON exportado em outro computador)</label><input id="ca-pimp" type="file" accept=".json,application/json"></div>
    <h4><i class="fas fa-broom"></i> Depois de publicar</h4>
    <p><button type="button" class="btn-visit" id="ca-plimpa"${tot ? '' : ' disabled'}>Limpar edições já publicadas</button> <small class="vazio">Remove deste navegador as edições que já estão iguais ao arquivo publicado.</small></p>`;
    $('#ca-pjs', el).onclick = () => { baixa('ajuda-conteudo.js', CAB + 'window.PR_AJUDA_CONTEUDO = ' + JSON.stringify(montaPublicacao(false), null, 1) + ';\n', 'application/javascript'); ok('Arquivo ajuda-conteudo.js gerado. Substitua-o na hospedagem.'); desenha(); };
    $('#ca-pjson', el).onclick = () => { baixa('conteudo.json', JSON.stringify(montaPublicacao(true), null, 1), 'application/json'); };
    $('#ca-pexp', el).onclick = () => baixa('ajuda-edicoes-' + agora().slice(0, 10) + '.json', JSON.stringify({ formato: 'parque-retiro-ajuda-edicoes', criadoEm: agora(), artigos: H.db.get('ajuda_artigos', []), categorias: H.db.get('ajuda_categorias', []), dicas: H.db.get('ajuda_dicas', []) }, null, 1), 'application/json');
    $('#ca-pimp', el).onchange = async e => {
      const f = e.target.files[0]; if (!f) return; let o;
      try { o = JSON.parse(await f.text()); } catch (x) { falha('Arquivo ilegível (não é JSON).'); return desenha(); }
      if (!o || o.formato !== 'parque-retiro-ajuda-edicoes') { falha('Este arquivo não é uma exportação de edições da Central de Ajuda.'); return desenha(); }
      let n = 0;
      [['ajuda_artigos', o.artigos], ['ajuda_categorias', o.categorias], ['ajuda_dicas', o.dicas]].forEach(([col, lista]) => {
        if (!Array.isArray(lista)) return; const atual = H.db.get(col, []), m = new Map(atual.map(x => [x.id, x]));
        lista.forEach(x => { if (!x || !x.id) return; const y = m.get(x.id); if (!y || String(x.em || '') > String(y.em || '')) { m.set(x.id, x); n++; } });
        H.db.set(col, [...m.values()]);
      });
      A().invalida(); ok(n + ' edição(ões) importada(s) (a mais recente vale quando há duas do mesmo item).'); desenha();
    };
    $('#ca-plimpa', el).onclick = () => {
      const b2 = base(); let n = 0;
      const igual = (col, lista, achaBase) => H.db.set(col, H.db.get(col, []).filter(x => { const y = achaBase(x.id); const mesmo = y && !x.excluido && semMeta(x) === semMeta(y); if (mesmo) n++; return !mesmo; }));
      igual('ajuda_artigos', null, id => (b2.artigos || []).find(a => a.id === id));
      igual('ajuda_categorias', null, id => (b2.categorias || []).find(c => c.id === id));
      H.db.set('ajuda_dicas', H.db.get('ajuda_dicas', []).filter(x => { const y = (b2.dicas || {})[x.id], yn = y && A().normDica(x.id, y); const mesmo = yn && yn.titulo === x.titulo && yn.texto === x.texto && (yn.artigo || '') === (x.artigo || ''); if (mesmo) n++; return !mesmo; }));
      A().invalida(); ok(n ? n + ' edição(ões) já publicada(s) removida(s) deste navegador.' : 'Nenhuma edição igual ao arquivo publicado. Publique primeiro o novo ajuda-conteudo.js.'); desenha();
    };
  }
  desenha();
}

window.PR_AJUDA_ADMIN = {
  abrir,
  montaPublicacao,
  // Chamado pelo painel de ajuda ("Editar artigo"): abre esta ferramenta já no editor do artigo.
  editarArtigo(id) { pendente = id; const b = document.querySelector('[data-tab="central_ajuda"]'); if (b) b.click(); }
};
})();
