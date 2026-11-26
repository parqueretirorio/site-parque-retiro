/**
 * com-feedback.js — Bloco 6: Formulário "Como foi a sua visita?"
 * Parque de Estudo e Reflexão Retiro
 *
 * Público  → visita-feedback.html  usa PR_VITRINE.enviar('feedback', dados)
 * Interno  → area-restrita.html   usa PR_FEEDBACK.renderPainel(container)
 */

(function () {
  'use strict';

  /* ── Constantes ─────────────────────────────────────────────────────────── */

  const COLECAO = 'com_feedbacks';

  const VOLTARIA_LABEL = { sim: 'Sim', talvez: 'Talvez', nao: 'Não' };

  /* ── Estado interno ─────────────────────────────────────────────────────── */

  let _db = null;
  let _feedbacks = [];

  /* ── Acesso a dados ─────────────────────────────────────────────────────── */

  function lerFeedbacks() {
    if (!_db) return [];
    const raw = _db.get(COLECAO);
    _feedbacks = Array.isArray(raw) ? raw : [];
    return _feedbacks;
  }

  function salvarFeedbacks() {
    if (!_db) return;
    _db.set(COLECAO, _feedbacks);
  }

  /* ── Consulta resumo via Supabase ───────────────────────────────────────── */

  async function buscarResumo(atividadeId) {
    if (!window.PR_SUPABASE) return null;
    try {
      const corpo = atividadeId ? { p_atividade_id: atividadeId } : {};
      const r = await window.PR_SUPABASE.rpc('pr_contagem_feedback', corpo);
      return r && r.status === 200 && r.corpo ? r.corpo : null;
    } catch (e) {
      console.warn('[PR_FEEDBACK] buscarResumo:', e);
      return null;
    }
  }

  /* ── Exportar CSV ───────────────────────────────────────────────────────── */

  function exportarCSV(lista) {
    const cabecalho = ['id', 'atividade', 'como_soube', 'destaque',
      'melhorar', 'voltaria', 'quer_avisos', 'email', 'criadoEm'];
    const linhas = [cabecalho.join(';')];
    (lista || _feedbacks).forEach(function (f) {
      linhas.push([
        f.id || '',
        f.atividade || '',
        (f.como_soube || '').replace(/;/g, ','),
        (f.destaque  || '').replace(/;/g, ','),
        (f.melhorar  || '').replace(/;/g, ','),
        f.voltaria   || '',
        f.quer_avisos ? 'sim' : 'nao',
        f.email      || '',
        f.criadoEm   || ''
      ].map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; })
       .join(';'));
    });
    const bom = '﻿';
    const blob = new Blob([bom + linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'feedbacks_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Painel interno (area-restrita.html) ────────────────────────────────── */

  function renderPainel(container) {
    if (!container) return;
    container.innerHTML = '';

    lerFeedbacks();

    var atividadesSet = {};
    _feedbacks.forEach(function (f) {
      if (f.atividade) atividadesSet[f.atividade] = true;
    });
    var atividades = Object.keys(atividadesSet);

    // ── Cabeçalho ──────────────────────────────────────────────────────────
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px';

    var titulo = document.createElement('h2');
    titulo.textContent = 'Feedbacks de Visita';
    titulo.style.cssText = 'margin:0;font-size:1.2rem;color:#1a3c2a';

    var acoes = document.createElement('div');
    acoes.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';

    var btnExportar = document.createElement('button');
    btnExportar.textContent = '⬇ Exportar CSV';
    btnExportar.style.cssText = _estiloBotao('#2d6a4f');
    btnExportar.onclick = function () { exportarCSV(); };

    acoes.appendChild(btnExportar);
    header.appendChild(titulo);
    header.appendChild(acoes);
    container.appendChild(header);

    // ── Filtro por atividade ───────────────────────────────────────────────
    var filtroDiv = document.createElement('div');
    filtroDiv.style.cssText = 'margin-bottom:16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap';

    var filtroLabel = document.createElement('label');
    filtroLabel.textContent = 'Atividade:';
    filtroLabel.style.cssText = 'font-weight:600;color:#1a3c2a;font-size:.95rem';

    var filtroSel = document.createElement('select');
    filtroSel.style.cssText = 'padding:8px 12px;border:2px solid #c8ddd2;border-radius:6px;font-size:.95rem;font-family:inherit';

    var optTodas = document.createElement('option');
    optTodas.value = '';
    optTodas.textContent = 'Todas';
    filtroSel.appendChild(optTodas);

    atividades.forEach(function (at) {
      var opt = document.createElement('option');
      opt.value = at;
      opt.textContent = at;
      filtroSel.appendChild(opt);
    });

    // Div de resumo (preenchido assincronamente)
    var resumoDiv = document.createElement('div');
    resumoDiv.id = 'fb-resumo';
    resumoDiv.style.cssText = 'width:100%;margin-bottom:16px';

    // Div de lista
    var listaDiv = document.createElement('div');

    function atualizar() {
      var atFiltro = filtroSel.value;
      var lista = atFiltro
        ? _feedbacks.filter(function (f) { return f.atividade === atFiltro; })
        : _feedbacks;
      _renderLista(listaDiv, lista);

      // Busca resumo assíncrono
      resumoDiv.innerHTML = '<p style="color:#888;font-size:.9rem">Carregando resumo…</p>';
      buscarResumo(atFiltro || null).then(function (res) {
        _renderResumo(resumoDiv, res);
      });
    }

    filtroSel.addEventListener('change', atualizar);

    filtroDiv.appendChild(filtroLabel);
    filtroDiv.appendChild(filtroSel);
    container.appendChild(filtroDiv);
    container.appendChild(resumoDiv);
    container.appendChild(listaDiv);

    atualizar();
  }

  /* ── Renderizar resumo de contagens ─────────────────────────────────────── */

  function _renderResumo(div, res) {
    if (!res) { div.innerHTML = ''; return; }

    var total      = res.total      || 0;
    var voltaria   = res.voltaria   || {};
    var querAvisos = res.quer_avisos || 0;

    div.innerHTML = '';

    var card = document.createElement('div');
    card.style.cssText = 'background:#f0f7f3;border:1px solid #c8ddd2;border-radius:10px;padding:16px 20px;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:20px';

    function _stat(label, val, cor) {
      var el = document.createElement('div');
      el.style.cssText = 'min-width:80px;text-align:center';
      el.innerHTML = '<div style="font-size:1.6rem;font-weight:700;color:' + cor + '">' + val + '</div>'
        + '<div style="font-size:.8rem;color:#555;margin-top:2px">' + label + '</div>';
      return el;
    }

    card.appendChild(_stat('Total', total, '#1a3c2a'));
    card.appendChild(_stat('Voltaria: Sim', voltaria.sim || 0, '#2d6a4f'));
    card.appendChild(_stat('Voltaria: Talvez', voltaria.talvez || 0, '#c05000'));
    card.appendChild(_stat('Voltaria: Não', voltaria.nao || 0, '#c00'));
    card.appendChild(_stat('Quer avisos', querAvisos, '#1a3c2a'));

    div.appendChild(card);
  }

  /* ── Renderizar lista de respostas ──────────────────────────────────────── */

  function _renderLista(div, lista) {
    div.innerHTML = '';

    if (!lista || lista.length === 0) {
      div.innerHTML = '<p style="color:#888;text-align:center;padding:32px 0">Nenhum feedback registrado ainda.</p>';
      return;
    }

    // Tabela
    var wrap = document.createElement('div');
    wrap.style.cssText = 'overflow-x:auto';

    var tabela = document.createElement('table');
    tabela.style.cssText = 'width:100%;border-collapse:collapse;font-size:.9rem';

    var cabCols = ['Data', 'Atividade', 'Como soube', 'Destaque', 'Melhorar', 'Voltaria?', 'Quer avisos', 'E-mail'];
    var thead   = document.createElement('thead');
    var trHead  = document.createElement('tr');
    cabCols.forEach(function (c) {
      var th = document.createElement('th');
      th.textContent = c;
      th.style.cssText = 'text-align:left;padding:10px 12px;background:#1a3c2a;color:#fff;white-space:nowrap';
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    tabela.appendChild(thead);

    var tbody = document.createElement('tbody');
    lista.slice().reverse().forEach(function (f, i) {
      var tr = document.createElement('tr');
      tr.style.background = i % 2 === 0 ? '#fff' : '#f5faf7';

      function td(val) {
        var el = document.createElement('td');
        el.textContent = val || '—';
        el.style.cssText = 'padding:8px 12px;border-bottom:1px solid #e0ede6;vertical-align:top;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
        return el;
      }

      var data = f.criadoEm ? new Date(f.criadoEm).toLocaleDateString('pt-BR') : '—';
      tr.appendChild(td(data));
      tr.appendChild(td(f.atividade));
      tr.appendChild(td(f.como_soube));
      tr.appendChild(td(f.destaque));
      tr.appendChild(td(f.melhorar));
      tr.appendChild(td(VOLTARIA_LABEL[f.voltaria] || f.voltaria || '—'));
      tr.appendChild(td(f.quer_avisos ? 'Sim' : 'Não'));
      tr.appendChild(td(f.email));

      tbody.appendChild(tr);
    });
    tabela.appendChild(tbody);
    wrap.appendChild(tabela);
    div.appendChild(wrap);

    // Contagem
    var contagem = document.createElement('p');
    contagem.textContent = lista.length + ' resposta' + (lista.length !== 1 ? 's' : '');
    contagem.style.cssText = 'font-size:.85rem;color:#888;margin-top:8px;text-align:right';
    div.appendChild(contagem);
  }

  /* ── Helpers ────────────────────────────────────────────────────────────── */

  function _estiloBotao(cor) {
    return 'padding:8px 16px;background:' + cor + ';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.9rem;font-weight:600;font-family:inherit';
  }

  /* ── Inicialização da página pública ────────────────────────────────────── */

  function _iniciarPaginaPublica() {
    var form   = document.getElementById('fb-formulario');
    var sucesso = document.getElementById('fb-sucesso');
    var errDiv  = document.getElementById('fb-erro');
    var btnEnv  = document.getElementById('fb-enviar');
    var avisoEmail = document.getElementById('fb-aviso-email');

    if (!form) return; // não estamos na página pública

    // Mostrar/ocultar campo de e-mail conforme resposta "Gostaria de avisos?"
    document.querySelectorAll('input[name="fb-avisos"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (avisoEmail) {
          avisoEmail.classList.toggle('visivel', r.value === 'sim' && r.checked);
        }
      });
    });

    btnEnv.addEventListener('click', async function () {
      errDiv.textContent = '';

      var voltaria   = (document.querySelector('input[name="fb-voltaria"]:checked') || {}).value || '';
      var avisosVal  = (document.querySelector('input[name="fb-avisos"]:checked')   || {}).value || '';
      var querAvisos = avisosVal === 'sim';
      var email      = (document.getElementById('fb-email') || {}).value || '';

      // Validação mínima
      if (querAvisos && !email.trim()) {
        errDiv.textContent = 'Por favor, informe seu e-mail para receber os avisos.';
        return;
      }

      var dados = {
        id:          'f' + Date.now().toString(36),
        como_soube:  (document.getElementById('fb-como-soube') || {}).value || '',
        destaque:    (document.getElementById('fb-destaque')   || {}).value || '',
        melhorar:    (document.getElementById('fb-melhorar')   || {}).value || '',
        voltaria:    voltaria,
        quer_avisos: querAvisos,
        email:       querAvisos ? email.trim() : '',
        criadoEm:    new Date().toISOString(),
        origem:      'publica'
      };

      // Pegar atividade da URL (?atividade=xxxx)
      try {
        var params = new URLSearchParams(window.location.search);
        var atParam = params.get('atividade');
        if (atParam) dados.atividade = atParam.slice(0, 40);
      } catch (_) {}

      btnEnv.disabled = true;
      btnEnv.textContent = 'Enviando…';

      try {
        if (window.PR_VITRINE && window.PR_VITRINE.enviar) {
          await window.PR_VITRINE.enviar('feedback', dados);
        }
        form.style.display    = 'none';
        sucesso.style.display = 'block';
      } catch (e) {
        errDiv.textContent = 'Ocorreu um erro ao enviar. Tente novamente.';
        btnEnv.disabled    = false;
        btnEnv.innerHTML   = '<i class="fas fa-paper-plane"></i> Enviar resposta';
      }
    });
  }

  /* ── API pública ────────────────────────────────────────────────────────── */

  window.PR_FEEDBACK = {
    iniciar: function (db) {
      _db = db;
      lerFeedbacks();
    },
    lerFeedbacks:   lerFeedbacks,
    salvarFeedbacks: salvarFeedbacks,
    buscarResumo:   buscarResumo,
    exportarCSV:    exportarCSV,
    renderPainel:   renderPainel
  };

  /* ── Auto-iniciar na página pública ─────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    var body = document.querySelector('body');
    if (body && body.getAttribute('data-page') === 'feedback') {
      _iniciarPaginaPublica();
    }
  });

})();
