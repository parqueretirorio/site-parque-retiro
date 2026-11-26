/**
 * com-analytics.js — Bloco 7: Painel de Métricas e Indicadores
 * Parque de Estudo e Reflexão Retiro
 *
 * Consulta pr_metricas_comunicacao() e exibe um painel visual
 * com os indicadores de comunicação do Parque.
 *
 * Uso interno → area-restrita.html → window.PR_ANALYTICS
 */

(function () {
  'use strict';

  /* ── Paleta ─────────────────────────────────────────────────────────────── */

  var CORES = {
    verde:    '#2d6a4f',
    verde_e:  '#1a3c2a',
    amarelo:  '#c05000',
    cinza:    '#888',
    fundo:    '#f0f7f3',
    borda:    '#c8ddd2'
  };

  /* ── Buscar métricas via RPC ─────────────────────────────────────────────── */

  async function buscarMetricas() {
    if (!window.PR_SUPABASE) return null;
    try {
      var r = await window.PR_SUPABASE.rpc('pr_metricas_comunicacao', {});
      return r && r.status === 200 && r.corpo ? r.corpo : null;
    } catch (e) {
      console.warn('[PR_ANALYTICS] buscarMetricas:', e);
      return null;
    }
  }

  /* ── Renderizar painel ───────────────────────────────────────────────────── */

  function renderPainel(container) {
    if (!container) return;
    container.innerHTML = '';

    // Cabeçalho
    var header = _el('div', 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px');

    var titulo = _el('h2', 'margin:0;font-size:1.2rem;color:' + CORES.verde_e);
    titulo.textContent = 'Indicadores do Parque';
    header.appendChild(titulo);

    var btnAtualizar = _btn('↻ Atualizar', CORES.verde);
    header.appendChild(btnAtualizar);
    container.appendChild(header);

    // Área de conteúdo (preenchida assincronamente)
    var conteudo = _el('div', '');
    container.appendChild(conteudo);

    function carregar() {
      conteudo.innerHTML = '<p style="color:' + CORES.cinza + ';text-align:center;padding:32px 0">Carregando indicadores…</p>';
      buscarMetricas().then(function (dados) {
        _renderConteudo(conteudo, dados);
      });
    }

    btnAtualizar.onclick = carregar;
    carregar();
  }

  function _renderConteudo(container, dados) {
    container.innerHTML = '';

    if (!dados) {
      container.innerHTML = '<p style="color:' + CORES.cinza + ';text-align:center;padding:32px 0">Não foi possível carregar os indicadores. Verifique a conexão.</p>';
      return;
    }

    // Data de geração
    if (dados.gerado_em) {
      var gerado = _el('p', 'font-size:.8rem;color:' + CORES.cinza + ';text-align:right;margin:0 0 16px');
      gerado.textContent = 'Atualizado em: ' + new Date(dados.gerado_em).toLocaleString('pt-BR');
      container.appendChild(gerado);
    }

    // ── Seção: Pessoas ────────────────────────────────────────────────────
    _secao(container, 'Pessoas do Parque');

    var contatos = dados.contatos || {};
    var cardsP = [
      { label: 'Total de pessoas',   val: contatos.total       || 0, cor: CORES.verde_e },
      { label: 'Visitantes',          val: contatos.visitante   || 0, cor: CORES.verde   },
      { label: 'Participantes',       val: contatos.inscrito    || 0, cor: CORES.verde   },
      { label: 'Apoiadores',          val: contatos.doador      || 0, cor: CORES.verde   },
      { label: 'Compradores',         val: contatos.comprador   || 0, cor: CORES.cinza   },
      { label: 'Mestres',             val: contatos.mestre      || 0, cor: CORES.verde_e },
      { label: 'Voluntários',         val: contatos.voluntario  || 0, cor: CORES.verde   },
      { label: 'Aceitam avisos',      val: contatos.aceita_avisos || 0, cor: CORES.amarelo }
    ];
    _gridCards(container, cardsP);

    // ── Seção: Atividades ─────────────────────────────────────────────────
    _secao(container, 'Atividades e Encontros');

    var ativ = dados.atividades || {};
    var cardsA = [
      { label: 'Atividades cadastradas', val: ativ.total   || 0, cor: CORES.verde_e },
      { label: 'Ativas',                  val: ativ.ativas  || 0, cor: CORES.verde   },
      { label: 'Próximas',                val: ativ.futuras || 0, cor: CORES.amarelo  }
    ];
    _gridCards(container, cardsA);

    // Inscrições por atividade
    var inscricoes = Array.isArray(dados.inscricoes) ? dados.inscricoes : [];
    if (inscricoes.length > 0) {
      var tituloInsc = _el('p', 'font-weight:600;color:' + CORES.verde_e + ';margin:16px 0 8px;font-size:.95rem');
      tituloInsc.textContent = 'Participações por atividade:';
      container.appendChild(tituloInsc);
      _tabelaInscricoes(container, inscricoes);
    }

    // ── Seção: Avisos por e-mail ──────────────────────────────────────────
    _secao(container, 'Avisos por E-mail');

    var envios = Array.isArray(dados.envios) ? dados.envios : [];
    if (envios.length === 0) {
      var semEnvios = _el('p', 'color:' + CORES.cinza + ';font-size:.9rem');
      semEnvios.textContent = 'Nenhum aviso enviado ainda.';
      container.appendChild(semEnvios);
    } else {
      var totalEnvios = envios.reduce(function (s, e) { return s + (e.total_enviados || 0); }, 0);
      var cardsE = [
        { label: 'Avisos enviados', val: envios.length, cor: CORES.verde_e },
        { label: 'Pessoas alcançadas', val: totalEnvios, cor: CORES.verde }
      ];
      _gridCards(container, cardsE);
      _tabelaEnvios(container, envios);
    }

    // ── Seção: Retornos de visita ─────────────────────────────────────────
    _secao(container, 'Retornos de Visita');

    var fb = dados.feedback || {};
    var totalFb = fb.total || 0;

    if (totalFb === 0) {
      var semFb = _el('p', 'color:' + CORES.cinza + ';font-size:.9rem');
      semFb.textContent = 'Nenhum retorno de visita recebido ainda.';
      container.appendChild(semFb);
    } else {
      var cardsFb = [
        { label: 'Total de retornos', val: totalFb,              cor: CORES.verde_e },
        { label: 'Voltariam',          val: fb.voltaria_sim    || 0, cor: CORES.verde   },
        { label: 'Talvez',             val: fb.voltaria_talvez || 0, cor: CORES.amarelo  },
        { label: 'Pediram avisos',     val: fb.quer_avisos     || 0, cor: CORES.verde   }
      ];
      _gridCards(container, cardsFb);

      // Barra de proporção "voltaria"
      if (totalFb > 0) {
        _barraVoltaria(container, fb, totalFb);
      }
    }
  }

  /* ── Componentes visuais ─────────────────────────────────────────────────── */

  function _secao(container, titulo) {
    var sec = _el('h3', 'font-size:1rem;font-weight:700;color:' + CORES.verde_e
      + ';border-bottom:2px solid ' + CORES.borda + ';padding-bottom:6px;margin:28px 0 14px');
    sec.textContent = titulo;
    container.appendChild(sec);
  }

  function _gridCards(container, itens) {
    var grid = _el('div', 'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:12px');
    itens.forEach(function (item) {
      var card = _el('div', 'background:' + CORES.fundo + ';border:1px solid ' + CORES.borda
        + ';border-radius:10px;padding:14px 12px;text-align:center');
      var num = _el('div', 'font-size:1.8rem;font-weight:700;color:' + item.cor);
      num.textContent = typeof item.val === 'number' ? item.val.toLocaleString('pt-BR') : item.val;
      var lbl = _el('div', 'font-size:.8rem;color:#555;margin-top:4px');
      lbl.textContent = item.label;
      card.appendChild(num);
      card.appendChild(lbl);
      grid.appendChild(card);
    });
    container.appendChild(grid);
  }

  function _tabelaInscricoes(container, lista) {
    var wrap = _el('div', 'overflow-x:auto;margin-bottom:12px');
    var t = _tabela(['Atividade', 'Participações', 'Presentes']);
    lista.forEach(function (r, i) {
      var tr = _tr([
        r.atividade || '—',
        r.total     || 0,
        r.presentes || 0
      ], i);
      t.tBodies[0].appendChild(tr);
    });
    wrap.appendChild(t);
    container.appendChild(wrap);
  }

  function _tabelaEnvios(container, lista) {
    var wrap = _el('div', 'overflow-x:auto;margin-bottom:12px');
    var t = _tabela(['Assunto', 'Destinatários', 'Enviado em']);
    lista.forEach(function (r, i) {
      var data = r.enviado_em ? new Date(r.enviado_em).toLocaleDateString('pt-BR') : '—';
      var tr = _tr([
        r.assunto       || '—',
        r.total_enviados || 0,
        data
      ], i);
      t.tBodies[0].appendChild(tr);
    });
    wrap.appendChild(t);
    container.appendChild(wrap);
  }

  function _barraVoltaria(container, fb, total) {
    var pSim    = Math.round(((fb.voltaria_sim    || 0) / total) * 100);
    var pTalvez = Math.round(((fb.voltaria_talvez || 0) / total) * 100);
    var pNao    = Math.round(((fb.voltaria_nao    || 0) / total) * 100);

    var wrap = _el('div', 'margin:12px 0 4px');

    var titulo = _el('p', 'font-size:.85rem;color:#555;margin:0 0 6px');
    titulo.textContent = 'Voltaria ao Parque?';
    wrap.appendChild(titulo);

    var barra = _el('div', 'display:flex;border-radius:8px;overflow:hidden;height:28px');

    function segmento(pct, cor, label) {
      if (pct <= 0) return;
      var s = _el('div', 'flex:0 0 ' + pct + '%;background:' + cor
        + ';display:flex;align-items:center;justify-content:center;font-size:.75rem;color:#fff;font-weight:600');
      s.textContent = pct + '%';
      s.title = label + ': ' + pct + '%';
      barra.appendChild(s);
    }

    segmento(pSim,    CORES.verde,   'Sim');
    segmento(pTalvez, CORES.amarelo, 'Talvez');
    segmento(pNao,    '#c00',        'Não');

    wrap.appendChild(barra);

    var legenda = _el('div', 'display:flex;gap:16px;margin-top:6px;font-size:.8rem;color:#555');
    function leg(cor, txt) {
      var l = _el('span', 'display:flex;align-items:center;gap:4px');
      var dot = _el('span', 'width:10px;height:10px;border-radius:50%;background:' + cor + ';display:inline-block');
      l.appendChild(dot);
      l.appendChild(document.createTextNode(txt));
      legenda.appendChild(l);
    }
    leg(CORES.verde,   'Sim (' + (fb.voltaria_sim || 0) + ')');
    leg(CORES.amarelo, 'Talvez (' + (fb.voltaria_talvez || 0) + ')');
    leg('#c00',        'Não (' + (fb.voltaria_nao || 0) + ')');
    wrap.appendChild(legenda);

    container.appendChild(wrap);
  }

  /* ── Utilitários DOM ─────────────────────────────────────────────────────── */

  function _el(tag, style) {
    var el = document.createElement(tag);
    if (style) el.style.cssText = style;
    return el;
  }

  function _btn(texto, cor) {
    var b = _el('button',
      'padding:8px 16px;background:' + cor + ';color:#fff;border:none;border-radius:6px;'
      + 'cursor:pointer;font-size:.9rem;font-weight:600;font-family:inherit');
    b.textContent = texto;
    return b;
  }

  function _tabela(colunas) {
    var t = document.createElement('table');
    t.style.cssText = 'width:100%;border-collapse:collapse;font-size:.9rem';
    var thead = document.createElement('thead');
    var trH   = document.createElement('tr');
    colunas.forEach(function (c) {
      var th = document.createElement('th');
      th.textContent = c;
      th.style.cssText = 'text-align:left;padding:8px 12px;background:' + CORES.verde_e + ';color:#fff;white-space:nowrap';
      trH.appendChild(th);
    });
    thead.appendChild(trH);
    t.appendChild(thead);
    t.appendChild(document.createElement('tbody'));
    return t;
  }

  function _tr(vals, idx) {
    var tr = document.createElement('tr');
    tr.style.background = idx % 2 === 0 ? '#fff' : CORES.fundo;
    vals.forEach(function (v) {
      var td = document.createElement('td');
      td.textContent = typeof v === 'number' ? v.toLocaleString('pt-BR') : (v || '—');
      td.style.cssText = 'padding:7px 12px;border-bottom:1px solid ' + CORES.borda;
      tr.appendChild(td);
    });
    return tr;
  }

  /* ── API pública ─────────────────────────────────────────────────────────── */

  window.PR_ANALYTICS = {
    buscarMetricas: buscarMetricas,
    renderPainel:   renderPainel
  };

})();
