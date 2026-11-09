/* Produções de Escola: menu flutuante de Parques. Ao escolher um Parque, a página mostra tudo o que ele produziu.
   Dados: producoes-dados.js (Parques e repetidas) e producoes-catalogo.js (catálogo de cada Parque, gerado). */
(function () {
  'use strict';
  var D = window.PR_PRODUCOES, C = window.PR_PRODUCOES_CATALOGO || {};
  var menu = document.getElementById('prod-parques');
  var area = document.getElementById('prod-area');
  if (!D || !menu || !area) return;
  var P = D.parques, R = D.repetidas, chaves = Object.keys(P);

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nivel(n) { return n >= 5 ? 'n5' : n === 4 ? 'n4' : n === 3 ? 'n3' : 'n2'; }
  function selo(n, prefixo) {
    return '<span class="prod-selo ' + nivel(n) + '" title="Aparece nas páginas de ' + n + ' Parques"><i class="fas fa-clone" aria-hidden="true"></i> ' + (prefixo || 'em') + ' ' + n + ' parques</span>';
  }
  function chipParque(k, atual) {
    var p = P[k]; if (!p) return '';
    return '<a class="prod-parque' + (k === atual ? ' ativo' : '') + '" href="#parque=' + k + '" data-ir="' + k + '" translate="no">' + esc(p.nome) + '</a>';
  }
  function totalParque(k) { return (C[k] || []).length; }

  /* ---------- Menu flutuante ---------- */
  function montarMenu() {
    var h = '<div class="prod-cx-topo"><h2 id="prod-cx-t"><i class="fas fa-map-marked-alt" aria-hidden="true"></i> Escolha o Parque</h2>' +
      '<button type="button" class="prod-cx-fechar" aria-label="Fechar o menu de Parques"><i class="fas fa-times" aria-hidden="true"></i></button></div>' +
      '<ul class="prod-menu" role="list">' +
      '<li><button type="button" class="prod-op" data-ir="repetidas"><span class="prod-op-nome"><i class="fas fa-clone" aria-hidden="true"></i> Produções repetidas</span><span class="prod-op-n">' + R.length + '</span></button></li>';
    chaves.forEach(function (k) {
      var p = P[k], n = totalParque(k);
      h += '<li><button type="button" class="prod-op" data-ir="' + k + '"><span class="prod-op-nome" translate="no">' + esc(p.nome) +
        '<small>' + esc(p.pais) + '</small></span><span class="prod-op-n' + (n ? '' : ' zero') + '" title="' + n + ' produções">' + n + '</span></button></li>';
    });
    menu.innerHTML = h + '</ul>';
  }

  /* ---------- Vista: produções repetidas ---------- */
  function vistaRepetidas() {
    var itens = R.slice().sort(function (a, b) { return b[3].length - a[3].length || a[0].localeCompare(b[0], 'es'); });
    var h = '<h2 class="prod-h2" id="prod-titulo-vista" tabindex="-1"><i class="fas fa-clone" aria-hidden="true"></i> Produções que aparecem em mais de um Parque</h2>' +
      '<p class="prod-total">' + R.length + ' produções aparecem em mais de um Parque (levantamento de ' + esc(D.atualizado) + '). Escolha um Parque no menu para ver tudo o que ele produziu.</p>' + legenda() +
      '<ul class="prod-lista">';
    itens.forEach(function (r) {
      h += '<li class="prod-item ' + nivel(r[3].length) + '">' + selo(r[3].length) +
        '<div class="prod-corpo"><p class="prod-titulo" translate="no">' + esc(r[0]) + '</p>' +
        '<p class="prod-autor"><span translate="no">' + esc(r[1]) + '</span> · origem: <span translate="no">' + esc(r[2]) + '</span></p>' +
        '<p class="prod-onde">Aparece em: ' + r[3].map(function (k) { return chipParque(k); }).join(' ') + '</p></div></li>';
    });
    return h + '</ul>';
  }
  function legenda() {
    return '<div class="prod-legenda" aria-label="Legenda"><span class="prod-selo n2">em 2 parques</span><span class="prod-selo n3">em 3 parques</span>' +
      '<span class="prod-selo n4">em 4 parques</span><span class="prod-selo n5">em 5 ou mais</span></div>';
  }

  /* ---------- Vista: um Parque ---------- */
  function vistaParque(k) {
    var p = P[k], itens = C[k] || [];
    var nRep = itens.filter(function (x) { return x[3] >= 0; }).length;
    var h = '<h2 class="prod-h2" id="prod-titulo-vista" tabindex="-1"><i class="fas fa-landmark" aria-hidden="true"></i> <span translate="no">Parque ' + esc(p.nome) + '</span> <small>' + esc(p.pais) + '</small></h2>' +
      '<p class="prod-links-parque">' + p.links.map(function (l) {
        return '<a class="btn-visit prod-btn" href="' + esc(l[1]) + '" target="_blank" rel="noopener"><i class="fas fa-external-link-alt" aria-hidden="true"></i> ' + esc(l[0]) + '</a>';
      }).join(' ') + '</p>';
    if (!itens.length) {
      h += '<div class="prod-vazio">Não foi possível ler a lista de produções da página deste Parque no levantamento de ' + esc(D.atualizado) +
        '. Use os botões acima para ver as produções direto no site do Parque.</div>';
    } else {
      h += '<p class="prod-total"><strong>' + itens.length + '</strong> produções' + (nRep ? ', das quais <strong>' + nRep + '</strong> aparecem também em outros Parques (marcadas com o selo).' : '.') + '</p>';
      if (nRep) h += legenda();
      var grupos = [], porCat = {};
      itens.forEach(function (x) { if (!porCat[x[0]]) { porCat[x[0]] = []; grupos.push(x[0]); } porCat[x[0]].push(x); });
      if (grupos.length > 1) {
        h += '<div class="prod-cats" role="navigation" aria-label="Categorias">' + grupos.map(function (g, i) {
          return '<a href="#prod-cat-' + i + '">' + esc(g) + ' <span>' + porCat[g].length + '</span></a>';
        }).join('') + '</div>';
      }
      grupos.forEach(function (g, i) {
        h += '<h3 class="prod-cat" id="prod-cat-' + i + '">' + esc(g) + ' <small>' + porCat[g].length + '</small></h3><ul class="prod-lista prod-lista-parque">';
        var autor = null;
        porCat[g].forEach(function (x) {
          var rep = x[3] >= 0 ? R[x[3]] : null;
          if (x[1] !== autor) { autor = x[1]; h += '<li class="prod-autor-cab" translate="no">' + esc(autor) + '</li>'; }
          h += '<li class="prod-item' + (rep ? ' ' + nivel(rep[3].length) : ' unica') + '"><div class="prod-corpo">' +
            '<p class="prod-titulo" translate="no">' + esc(x[2]) + '</p>' +
            (rep ? '<p class="prod-onde">' + selo(rep[3].length) + ' ' + rep[3].map(function (q) { return chipParque(q, k); }).join(' ') + '</p>' : '') +
            '</div></li>';
        });
        h += '</ul>';
      });
    }
    // Produções de outros Parques publicadas na página deste Parque
    var usados = {}; itens.forEach(function (x) { if (x[3] >= 0) usados[x[3]] = 1; });
    var outros = R.map(function (r, i) { return [r, i]; }).filter(function (ri) { return ri[0][3].indexOf(k) >= 0 && !usados[ri[1]]; });
    if (outros.length) {
      h += '<h3 class="prod-cat">Produções de outros Parques publicadas aqui <small>' + outros.length + '</small></h3>' +
        '<p class="prod-nota">A página deste Parque também publica estas produções, feitas em outros Parques.</p><ul class="prod-lista">';
      outros.forEach(function (ri) {
        var r = ri[0];
        h += '<li class="prod-item ' + nivel(r[3].length) + '">' + selo(r[3].length) + '<div class="prod-corpo"><p class="prod-titulo" translate="no">' + esc(r[0]) + '</p>' +
          '<p class="prod-autor"><span translate="no">' + esc(r[1]) + '</span> · origem: <span translate="no">' + esc(r[2]) + '</span></p>' +
          '<p class="prod-onde">Aparece em: ' + r[3].map(function (q) { return chipParque(q, k); }).join(' ') + '</p></div></li>';
      });
      h += '</ul>';
    }
    return h;
  }

  /* ---------- Navegação ---------- */
  var atual = '';
  function ir(k, rolar) {
    if (k !== 'repetidas' && !P[k]) k = 'repetidas';
    atual = k;
    area.innerHTML = k === 'repetidas' ? vistaRepetidas() : vistaParque(k);
    Array.prototype.forEach.call(menu.querySelectorAll('.prod-op'), function (b) {
      var sim = b.getAttribute('data-ir') === k;
      b.classList.toggle('ativo', sim); b.setAttribute('aria-current', sim ? 'true' : 'false');
    });
    var novo = '#parque=' + k;
    if (location.hash !== novo) { try { history.replaceState(null, '', novo); } catch (e) { /* ignora */ } }
    if (rolar) {
      fecharMenu();
      var t = document.getElementById('prod-titulo-vista');
      if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); try { t.focus({ preventScroll: true }); } catch (e) { /* ignora */ } }
    }
  }

  var botao = document.getElementById('prod-abrir');
  function abrirMenu() { menu.classList.add('aberta'); if (botao) botao.setAttribute('aria-expanded', 'true'); }
  function fecharMenu() { menu.classList.remove('aberta'); if (botao) botao.setAttribute('aria-expanded', 'false'); }
  if (botao) botao.addEventListener('click', function () { menu.classList.contains('aberta') ? fecharMenu() : abrirMenu(); });
  menu.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ir]'); if (b) { ir(b.getAttribute('data-ir'), true); return; }
    if (e.target.closest('.prod-cx-fechar')) fecharMenu();
  });
  area.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-ir]'); if (!a) return;
    e.preventDefault(); ir(a.getAttribute('data-ir'), true);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecharMenu(); });
  window.addEventListener('hashchange', function () {
    var m = /parque=(\w+)/.exec(location.hash); if (m && m[1] !== atual) ir(m[1], true);
  });

  montarMenu();
  var m0 = /parque=(\w+)/.exec(location.hash);
  ir(m0 ? m0[1] : 'repetidas', false);
})();
