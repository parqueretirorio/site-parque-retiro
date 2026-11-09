// Biblioteca de Silo (biblioteca-silo.html): busca e pesquisa no catálogo de biblioteca-silo-dados.js.
// Organizada como o Arquivo de Documentos de Silo: seções, ordem cronológica, formatos (texto, áudio, vídeo, foto) e idiomas.
// O estado da busca fica no endereço (#q=...&secao=...), para poder compartilhar uma pesquisa.
(function () {
const B = window.PR_BIBLIOTECA_SILO; const raiz = document.getElementById('bib-silo');
if (!B || !raiz) return;
const SECOES = [
  ['livros', 'Livros', 'fa-book'], ['conferencias', 'Conferências', 'fa-microphone'], ['apontamentos', 'Apontamentos', 'fa-pen-nib'],
  ['entrevistas', 'Entrevistas', 'fa-comments'], ['reunioes', 'Reuniões', 'fa-users'], ['seminarios', 'Seminários', 'fa-chalkboard-teacher'],
  ['materiais', 'Materiais', 'fa-folder-open'], ['expguia', 'Experiências Guiadas', 'fa-headphones'], ['outros', 'Outros autores', 'fa-feather-alt']
];
const NOME = Object.fromEntries(SECOES.map(s => [s[0], s[1]])), ICONE = Object.fromEntries(SECOES.map(s => [s[0], s[2]]));
const IDIOMAS = { pt: 'Português', es: 'Español', en: 'English', it: 'Italiano', fr: 'Français', de: 'Deutsch' };
const FORMATOS = { texto: ['Texto', 'fa-file-alt'], audio: ['Áudio', 'fa-volume-up'], video: ['Vídeo', 'fa-video'], foto: ['Foto', 'fa-camera'] };
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const urlOk = u => /^https?:\/\//i.test(u || '');
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const dataTxt = d => { const [a, m, dia] = String(d || '').split('-'); return dia ? `${+dia} ${MESES[+m - 1]} ${a}` : m ? `${MESES[+m - 1]} ${a}` : (a || 's/d'); };
const ITENS = (B.itens || []).filter(i => NOME[i.secao] && i.titulo).map((i, n) => ({ ...i, n,
  busca: norm([i.titulo, i.original, i.autor, i.local, i.desc, i.data, NOME[i.secao], (i.idiomas || []).map(x => IDIOMAS[x]).join(' ')].join(' ')) }));

// Estado (vem do endereço)
const S = { q: '', secao: '', idioma: '', formato: '', ordem: 'antigos' };
const lerHash = () => { const p = new URLSearchParams(location.hash.slice(1)); Object.keys(S).forEach(k => { if (p.has(k)) S[k] = p.get(k); }); if (!NOME[S.secao]) S.secao = ''; if (!IDIOMAS[S.idioma]) S.idioma = ''; if (!FORMATOS[S.formato]) S.formato = ''; if (!['antigos', 'recentes', 'titulo'].includes(S.ordem)) S.ordem = 'antigos'; };
const gravarHash = () => { const p = new URLSearchParams(); Object.entries(S).forEach(([k, v]) => { if (v && !(k === 'ordem' && v === 'antigos')) p.set(k, v); }); const h = p.toString(); history.replaceState(null, '', h ? '#' + h : location.pathname + location.search); };

const filtra = (ignorarSecao) => {
  const termos = norm(S.q).split(/\s+/).filter(Boolean);
  return ITENS.filter(i => (ignorarSecao || !S.secao || i.secao === S.secao)
    && (!S.idioma || (i.idiomas || []).includes(S.idioma))
    && (!S.formato || (i.formatos || []).includes(S.formato))
    && termos.every(t => i.busca.includes(t)));
};
const ordena = l => l.slice().sort(S.ordem === 'titulo' ? (a, b) => a.titulo.localeCompare(b.titulo, 'pt') : S.ordem === 'recentes' ? (a, b) => String(b.data).localeCompare(String(a.data)) || a.n - b.n : (a, b) => String(a.data).localeCompare(String(b.data)) || a.n - b.n);
const destaca = t => { const termos = norm(S.q).split(/\s+/).filter(t => t.length > 1); let h = esc(t); if (!termos.length) return h;
  const base = norm(t); const marcas = []; termos.forEach(x => { let i = base.indexOf(x); while (i >= 0) { marcas.push([i, i + x.length]); i = base.indexOf(x, i + x.length); } });
  if (!marcas.length || base.length !== t.length) return h; marcas.sort((a, b) => a[0] - b[0]); let out = '', pos = 0;
  marcas.forEach(([a, b]) => { if (a < pos) return; out += esc(t.slice(pos, a)) + '<mark>' + esc(t.slice(a, b)) + '</mark>'; pos = b; }); return out + esc(t.slice(pos)); };

const item = i => `<li class="bib-item">
  <div class="bib-data">${esc(dataTxt(i.data))}</div>
  <div class="bib-corpo">
    <h3 class="bib-titulo">${destaca(i.titulo)}</h3>
    ${i.original || i.autor ? `<p class="bib-orig">${i.autor ? esc(i.autor) + (i.original ? ' · ' : '') : ''}${i.original ? '<em>' + destaca(i.original) + '</em>' : ''}</p>` : ''}
    ${i.desc ? `<p class="bib-desc">${destaca(i.desc)}</p>` : ''}
    <p class="bib-meta">${!S.secao ? `<span class="bib-sec"><i class="fas ${ICONE[i.secao]}" aria-hidden="true"></i> ${esc(NOME[i.secao])}</span>` : ''}${i.local ? `<span><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${esc(i.local)}</span>` : ''}${(i.idiomas || []).length ? `<span title="Idiomas"><i class="fas fa-language" aria-hidden="true"></i> ${i.idiomas.map(x => esc(x.toUpperCase())).join(' · ')}</span>` : ''}</p>
  </div>
  <div class="bib-acoes">
    <span class="bib-formatos">${(i.formatos || []).filter(f => FORMATOS[f]).map(f => `<span class="bib-fmt" title="${FORMATOS[f][0]}"><i class="fas ${FORMATOS[f][1]}" aria-hidden="true"></i><span class="sr-only">${FORMATOS[f][0]}</span></span>`).join('')}</span>
    ${urlOk(i.link) ? `<a class="btn-visit bib-abrir" href="${esc(i.link)}" target="_blank" rel="noopener">${/archivo\/index\.htm$/.test(i.link) ? 'Buscar no Arquivo Silo' : 'Abrir'} <i class="fas fa-external-link-alt" aria-hidden="true"></i></a><small class="bib-fonte">${esc(i.fonte || '')}</small>` : ''}
  </div></li>`;

function desenha() {
  const tudo = filtra(true), lista = ordena(filtra(false));
  const cont = id => tudo.filter(i => i.secao === id).length;
  raiz.querySelector('#bib-secoes').innerHTML = `<button type="button" class="bib-chip${!S.secao ? ' ativo' : ''}" data-sec="" aria-pressed="${!S.secao}">Todas <span>${tudo.length}</span></button>` +
    SECOES.map(([id, nome, ic]) => `<button type="button" class="bib-chip${S.secao === id ? ' ativo' : ''}" data-sec="${id}" aria-pressed="${S.secao === id}"><i class="fas ${ic}" aria-hidden="true"></i> ${nome} <span>${cont(id)}</span></button>`).join('');
  raiz.querySelectorAll('[data-sec]').forEach(b => b.onclick = () => { S.secao = b.dataset.sec; atualiza(); });
  const res = raiz.querySelector('#bib-res');
  raiz.querySelector('#bib-cont').textContent = lista.length === 1 ? '1 documento encontrado' : `${lista.length} documentos encontrados`;
  if (!lista.length) { res.innerHTML = `<div class="bib-vazio"><p><strong>Nenhum documento encontrado com esses filtros.</strong></p><p>Tente outra palavra, limpe os filtros ou pesquise no <a href="${esc(B.arquivo.url)}" target="_blank" rel="noopener">Arquivo de Documentos de Silo</a>, que reúne o acervo completo.</p></div>`; return; }
  if (!S.secao && S.ordem !== 'titulo') {
    res.innerHTML = SECOES.map(([id, nome, ic]) => { const l = lista.filter(i => i.secao === id); return l.length ? `<section class="bib-grupo" aria-labelledby="bib-g-${id}"><h2 id="bib-g-${id}"><i class="fas ${ic}" aria-hidden="true"></i> ${nome} <small>${l.length}</small></h2><ul class="bib-lista">${l.map(item).join('')}</ul></section>` : ''; }).join('');
  } else res.innerHTML = `<ul class="bib-lista">${lista.map(item).join('')}</ul>`;
}
function atualiza() { gravarHash(); desenha(); }

raiz.innerHTML = `
  <div class="bib-busca" role="search">
    <label for="bib-q" class="sr-only">Pesquisar na Biblioteca de Silo</label>
    <i class="fas fa-search" aria-hidden="true"></i>
    <input id="bib-q" type="search" placeholder="Pesquisar por título, tema, lugar ou ano" autocomplete="off">
  </div>
  <div class="bib-filtros">
    <div class="form-row"><label for="bib-idioma">Idioma</label><select id="bib-idioma"><option value="">Todos</option>${Object.entries(IDIOMAS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
    <div class="form-row"><label for="bib-formato">Formato</label><select id="bib-formato"><option value="">Todos</option>${Object.entries(FORMATOS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></div>
    <div class="form-row"><label for="bib-ordem">Ordenar</label><select id="bib-ordem"><option value="antigos">Mais antigos primeiro</option><option value="recentes">Mais recentes primeiro</option><option value="titulo">Título (A a Z)</option></select></div>
    <div class="form-row bib-limpar"><button type="button" class="btn-visit" id="bib-limpar"><i class="fas fa-eraser" aria-hidden="true"></i> Limpar</button></div>
  </div>
  <div class="bib-secoes" id="bib-secoes" aria-label="Seções"></div>
  <p class="bib-cont" id="bib-cont" aria-live="polite"></p>
  <div id="bib-res"></div>`;
lerHash();
const q = raiz.querySelector('#bib-q'), id = raiz.querySelector('#bib-idioma'), fm = raiz.querySelector('#bib-formato'), od = raiz.querySelector('#bib-ordem');
q.value = S.q; id.value = S.idioma; fm.value = S.formato; od.value = S.ordem;
let t; q.oninput = () => { clearTimeout(t); t = setTimeout(() => { S.q = q.value.trim(); atualiza(); }, 150); };
id.onchange = () => { S.idioma = id.value; atualiza(); }; fm.onchange = () => { S.formato = fm.value; atualiza(); }; od.onchange = () => { S.ordem = od.value; atualiza(); };
raiz.querySelector('#bib-limpar').onclick = () => { Object.assign(S, { q: '', secao: '', idioma: '', formato: '', ordem: 'antigos' }); q.value = ''; id.value = ''; fm.value = ''; od.value = 'antigos'; atualiza(); q.focus(); };
window.addEventListener('hashchange', () => { lerHash(); q.value = S.q; id.value = S.idioma; fm.value = S.formato; od.value = S.ordem; desenha(); });
// Totais do acervo completo
const T = B.arquivo.totais, fmt = n => Number(n).toLocaleString('pt-BR'), tot = document.getElementById('bib-totais');
if (tot && T) tot.innerHTML = `<div><strong>${fmt(T.textos)}</strong><span>textos</span></div><div><strong>${fmt(T.audios)}</strong><span>áudios</span></div><div><strong>${fmt(T.videos)}</strong><span>vídeos</span></div><div><strong>${fmt(T.fotos)}</strong><span>fotos</span></div>`;
desenha();
window.PR_BIB_SILO = { filtra, ordena, S, ITENS };
})();
