// Notícias: monta a página "CONecta Retiro" (noticias-conecta.html) e o destaque da página Notícias (noticias.html)
// a partir de noticias-conecta.js. O texto das notícias vem em português e espanhol; os outros idiomas mostram o português.
(function () {
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var lista = (window.PR_NOTICIAS_CONECTA || []).slice().sort(function (a, b) { return a.data < b.data ? 1 : a.data > b.data ? -1 : 0; });
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var dataPt = function (iso) { var p = String(iso).split('-'); return +p[2] + ' de ' + MESES[+p[1] - 1] + ' de ' + p[0]; };
  var dataFmt = function (iso) { // data no idioma escolhido no site (marcada para o tradutor não mexer)
    var l = window.PR_IDIOMA && PR_IDIOMA.atual ? PR_IDIOMA.atual() : 'pt', p = String(iso).split('-'), t = dataPt(iso);
    if (l !== 'pt') { try { t = new Intl.DateTimeFormat(l, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]))); } catch (e) { /* fica em português */ } }
    return '<time datetime="' + esc(iso) + '" translate="no" class="notranslate">' + esc(t) + '</time>';
  };
  var idioma = function () { var l = window.PR_IDIOMA && PR_IDIOMA.atual ? PR_IDIOMA.atual() : 'pt'; return l === 'es' ? 'es' : 'pt'; };
  var texto = function (n) { var l = idioma(); return { t: n[l] || n.pt, l: n[l] ? l : 'pt' }; };
  var corpo = function (blocos) {
    return blocos.map(function (b) {
      if (b.h) return '<h3>' + esc(b.h) + '</h3>';
      if (b.li) return '<ul>' + b.li.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
      return '<p>' + b.p + '</p>';
    }).join('');
  };
  var param = function () { var m = location.search.match(/[?&]n=([0-9a-z-]+)/i); return m ? m[1] : ''; };

  // ---- Página CONecta Retiro
  var art = document.getElementById('nc-artigo'), ant = document.getElementById('nc-anteriores');
  function paginaConecta(abrir) {
    if (!lista.length) { art.innerHTML = '<p class="vazio">Ainda não há notícias publicadas.</p>'; return; }
    var id = param(), n = lista.filter(function (x) { return x.id === id; })[0] || lista[0], ehUltima = n === lista[0];
    var tx = texto(n), aberto = abrir != null ? abrir : /completa/.test(location.hash) || !!param();
    art.innerHTML =
      (ehUltima ? '' : '<p class="nc-aviso"><a href="noticias-conecta.html"><i class="fas fa-arrow-left" aria-hidden="true"></i> Ver a notícia mais recente</a></p>') +
      '<p class="nc-data"><i class="far fa-calendar" aria-hidden="true"></i> ' + dataFmt(n.data) + '</p>' +
      '<div lang="' + tx.l + '" translate="no" class="notranslate"><h2 class="nc-titulo">' + esc(tx.t.titulo) + '</h2>' +
      '<p class="nc-lide">' + esc(tx.t.lide) + '</p>' +
      '<div class="nc-corpo" id="completa"' + (aberto ? '' : ' hidden') + '>' + corpo(tx.t.corpo) + '</div></div>' +
      '<p><button type="button" class="btn-visit btn-large" id="nc-ler" aria-controls="completa" aria-expanded="' + aberto + '">' +
      (aberto ? '<i class="fas fa-chevron-up" aria-hidden="true"></i> Recolher a notícia' : '<i class="fas fa-book-open" aria-hidden="true"></i> Ler a notícia completa') + '</button></p>';
    document.getElementById('nc-ler').onclick = function () { paginaConecta(!aberto); if (!aberto) document.getElementById('completa').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    var outras = lista.filter(function (x) { return x !== n; });
    ant.innerHTML = '<h2><i class="fas fa-history" aria-hidden="true"></i> Alterações anteriores</h2>' +
      (outras.length ? '<ul>' + outras.map(function (x) {
        return '<li><a href="noticias-conecta.html?n=' + encodeURIComponent(x.id) + '#completa"><i class="far fa-calendar" aria-hidden="true"></i> ' + dataFmt(x.data) + '</a>' + (x === lista[0] ? ' <small>(mais recente)</small>' : '') + '</li>';
      }).join('') + '</ul>'
        : '<p class="vazio">As atualizações das próximas semanas vão aparecer aqui, pela data.</p>');
  }

  // ---- Destaque na página Notícias
  var dest = document.getElementById('nc-destaque');
  function destaque() {
    if (!lista.length) { dest.innerHTML = '<p class="vazio">Ainda não há notícias publicadas.</p>'; return; }
    var n = lista[0], tx = texto(n);
    dest.innerHTML = '<p class="nc-data"><i class="far fa-calendar" aria-hidden="true"></i> ' + dataFmt(n.data) + '</p>' +
      '<div lang="' + tx.l + '" translate="no" class="notranslate"><h3 class="nc-titulo">' + esc(tx.t.titulo) + '</h3><p class="nc-lide">' + esc(tx.t.lide) + '</p></div>' +
      '<p><a class="btn-visit btn-large" href="noticias-conecta.html?n=' + encodeURIComponent(n.id) + '#completa"><i class="fas fa-book-open" aria-hidden="true"></i> Ler a notícia completa</a></p>';
  }

  function monta() { if (art && ant) paginaConecta(); if (dest) destaque(); }
  monta();
  document.addEventListener('pr-idioma', function () { monta(); });
  window.PR_NOTICIAS = { lista: lista, dataPt: dataPt };
})();
