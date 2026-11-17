// CONecta Retiro — Inscrições em Atividades do Parque (17/11/2026).
//
// PARTE A — Página pública (encontro.html): formulário de interesse para visitantes.
//   Envia para a caixa 'inscricoes' via pr_enviar_publico. Sem login.
//   Após o envio, a função enviar-email do Supabase manda a confirmação.
//
// PARTE B — Área restrita (area-restrita.html): gestão pela equipe.
//   Lista de inscritos, check-in, envio de lembrete, cancelamento.
//   Requer login com função 'comunicacao' ou administrador.

(function () {
'use strict';

// ─── PARTE A — PÁGINA PÚBLICA ────────────────────────────────────────────────

function iniciarPaginaPublica() {
  const $ = id => document.getElementById(id);
  const ativId = new URLSearchParams(location.search).get('id') || '';
  const BASE_URL = window.PR_CONFIG_DADOS && window.PR_CONFIG_DADOS.supabase && window.PR_CONFIG_DADOS.supabase.url;

  if (!ativId) {
    const c = $('pi-conteudo'); if (c) c.innerHTML = '<p class="aviso-erro"><i class="fas fa-exclamation-circle"></i> Encontro não identificado.</p>';
    return;
  }

  // Carrega os dados do encontro da vitrine pública
  function carregarAtividade() {
    if (!window.PR_VITRINE || !window.PR_VITRINE.ligado()) {
      // modo local: busca do array em memória (dados.js)
      const todas = H && H.db ? H.db.get('pr_atividades_pub') : null;
      return JSON.parse(todas || '[]').find(a => a.id === ativId) || null;
    }
    // modo servidor: já veio na vitrine
    const todas = JSON.parse(window.PR_VITRINE && window.PR_VITRINE._cache && window.PR_VITRINE._cache.get('atividades_pub') || '[]');
    return todas.find(a => a.id === ativId) || null;
  }

  function formatarData(iso) {
    if (!iso) return '';
    const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function renderizarCabecalho(at) {
    const tit = $('pi-titulo'), sub = $('pi-subtitulo'), det = $('pi-detalhes'), img = $('pi-imagem');
    if (tit) tit.textContent = at.nome || 'Encontro';
    if (sub) sub.textContent = at.descricao_curta || '';
    if (img && at.imagem) { img.src = at.imagem; img.alt = at.nome || 'Encontro'; img.style.display = ''; }
    const linhas = [];
    if (at.data_inicio) linhas.push(`<p><i class="fas fa-calendar-alt"></i> <strong>${formatarData(at.data_inicio)}</strong>${at.data_fim && at.data_fim !== at.data_inicio ? ' até ' + formatarData(at.data_fim) : ''}</p>`);
    if (at.horario) linhas.push(`<p><i class="fas fa-clock"></i> ${at.horario}</p>`);
    if (at.local) linhas.push(`<p><i class="fas fa-map-marker-alt"></i> ${at.local}</p>`);
    if (at.valor) linhas.push(`<p><i class="fas fa-ticket-alt"></i> ${at.valor}</p>`);
    if (det) det.innerHTML = linhas.join('');
    document.title = (at.nome || 'Encontro') + ' | Parque de Estudo e Reflexão Retiro';
    if (at.vagas_max) {
      const v = $('pi-vagas');
      if (v) {
        carregarContagem(at.id).then(n => {
          const restam = at.vagas_max - n;
          v.innerHTML = restam > 5 ? `<i class="fas fa-users"></i> ${n} pessoa(s) já confirmaram interesse.`
            : restam > 0 ? `<i class="fas fa-users"></i> Últimas vagas — ${restam} restante(s).`
            : `<i class="fas fa-lock"></i> Vagas esgotadas. Você pode entrar na fila de espera.`;
          v.style.display = '';
        });
      }
    }
  }

  async function carregarContagem(id) {
    if (!BASE_URL || !window.PR_CONFIG_DADOS || !window.PR_CONFIG_DADOS.supabase) return 0;
    try {
      const r = await fetch(BASE_URL + '/rest/v1/rpc/pr_contagem_inscricoes', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: window.PR_CONFIG_DADOS.supabase.chavePublica },
        body: JSON.stringify({ p_atividade_id: id })
      });
      if (r.ok) { const j = await r.json(); return j.total || 0; }
    } catch (e) { /* sem internet */ }
    return 0;
  }

  function renderizarFormulario(at) {
    const form = $('pi-form');
    if (!form) return;
    if (at.inscricoes_encerradas) {
      form.innerHTML = '<p class="aviso-info"><i class="fas fa-info-circle"></i> As inscrições para este encontro estão encerradas.</p>';
      return;
    }
    form.innerHTML = `
      <div class="campo-grupo">
        <label for="pi-nome">Seu nome completo <span class="obrigatorio">*</span></label>
        <input type="text" id="pi-nome" name="nome" placeholder="Nome e sobrenome" autocomplete="name" required>
      </div>
      <div class="campo-grupo">
        <label for="pi-email">Seu e-mail <span class="obrigatorio">*</span></label>
        <input type="email" id="pi-email" name="email" placeholder="seunome@exemplo.com" autocomplete="email" required>
      </div>
      <div class="campo-grupo">
        <label for="pi-telefone">Telefone / WhatsApp <span class="opcional">(opcional)</span></label>
        <input type="tel" id="pi-telefone" name="telefone" placeholder="(21) 99999-9999" autocomplete="tel">
      </div>
      <div class="campo-grupo">
        <label for="pi-cidade">Cidade <span class="opcional">(opcional)</span></label>
        <input type="text" id="pi-cidade" name="cidade" placeholder="Sua cidade">
      </div>
      ${at.campo_extra ? `<div class="campo-grupo"><label for="pi-extra">${at.campo_extra}</label><input type="text" id="pi-extra" name="extra" placeholder=""></div>` : ''}
      <div class="campo-grupo campo-consentimento">
        <label><input type="checkbox" id="pi-consent" required>
        Concordo com o uso dos meus dados para organização deste encontro. Não serei inscrito em nenhuma lista de e-mails sem minha permissão.</label>
      </div>
      <div id="pi-msg" role="alert" style="display:none"></div>
      <button type="submit" id="pi-btn" class="btn-primario"><i class="fas fa-check"></i> Confirmar interesse</button>
    `;
    form.onsubmit = e => { e.preventDefault(); enviarInscricao(at); };
  }

  async function enviarInscricao(at) {
    const $ = id => document.getElementById(id);
    const btn = $('pi-btn'), msg = $('pi-msg');
    const nome = ($('pi-nome').value || '').trim();
    const email = ($('pi-email').value || '').trim().toLowerCase();
    const tel = ($('pi-telefone') && $('pi-telefone').value || '').trim();
    const cidade = ($('pi-cidade') && $('pi-cidade').value || '').trim();
    const extra = ($('pi-extra') && $('pi-extra').value || '').trim();
    const consent = $('pi-consent') && $('pi-consent').checked;

    if (nome.trim().split(/\s+/).length < 2) return mostrarMsg(msg, 'erro', 'Por favor, informe seu nome e sobrenome.');
    if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/.test(email)) return mostrarMsg(msg, 'erro', 'Por favor, informe um e-mail válido.');
    if (!consent) return mostrarMsg(msg, 'erro', 'É necessário concordar com o uso dos dados para confirmar o interesse.');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    const dados = {
      id: 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      atividade: at.id,
      atividade_nome: at.nome || '',
      nome: nome.slice(0, 120),
      email: email.slice(0, 160),
      telefone: tel.slice(0, 30),
      cidade: cidade.slice(0, 80),
      extra: extra.slice(0, 200),
      data_atividade: at.data_inicio || '',
      status: 'interesse',
      origem: 'publica',
      criadoEm: new Date().toISOString(),
      consentimento: true
    };

    let ok = false;
    try {
      if (window.PR_VITRINE && window.PR_VITRINE.ligado()) {
        const r = await window.PR_VITRINE.enviar('inscricoes', dados);
        ok = !!r;
      } else {
        // salva localmente se offline
        const fila = JSON.parse(localStorage.getItem('pr-inscricoes-fila') || '[]');
        fila.push({ caixa: 'inscricoes', dados });
        localStorage.setItem('pr-inscricoes-fila', JSON.stringify(fila.slice(-20)));
        ok = true;
      }
    } catch (e) {
      ok = false;
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check"></i> Confirmar interesse';

    if (ok) {
      $('pi-form').innerHTML = `
        <div class="aviso-sucesso" role="status">
          <i class="fas fa-check-circle"></i>
          <strong>Interesse registrado!</strong>
          <p>Enviamos uma confirmação para <strong>${email}</strong>. Verifique também a caixa de spam.</p>
          <p>Estamos felizes em ter você conosco no <strong>${at.nome || 'encontro'}</strong>.</p>
          ${at.link_calendario ? `<p><a href="${at.link_calendario}" target="_blank" rel="noopener"><i class="fas fa-calendar-plus"></i> Adicionar à agenda</a></p>` : ''}
        </div>`;
    } else {
      mostrarMsg(msg, 'erro', 'Não conseguimos enviar sua inscrição agora. Verifique a internet e tente de novo.');
    }
  }

  function mostrarMsg(el, tipo, texto) {
    if (!el) return;
    el.className = tipo === 'erro' ? 'aviso-erro' : 'aviso-sucesso';
    el.textContent = texto;
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Inicialização
  const atividade = carregarAtividade();
  if (!atividade) {
    // tenta novamente após a vitrine carregar
    window.addEventListener('pr-vitrine-pronta', () => {
      const a = carregarAtividade();
      if (a) { renderizarCabecalho(a); renderizarFormulario(a); }
      else {
        const c = $('pi-conteudo');
        if (c) c.innerHTML = '<p class="aviso-info"><i class="fas fa-info-circle"></i> Este encontro não está disponível no momento.</p>';
      }
    });
  } else {
    renderizarCabecalho(atividade);
    renderizarFormulario(atividade);
  }
}

// ─── PARTE B — ÁREA RESTRITA (gestão interna) ────────────────────────────────

function iniciarGestaoInterna() {
  if (!window.PR_DADOS || !window.PR_SUPABASE) return;
  const H = window.PR_DADOS;

  // Lê todas as inscrições
  function lerInscricoes() {
    return JSON.parse(H.db.get('pr_inscricoes') || '[]');
  }

  // Lê todos os encontros públicos cadastrados
  function lerAtividades() {
    return JSON.parse(H.db.get('pr_atividades_pub') || '[]');
  }

  // Renderiza o painel de inscrições de um encontro
  function renderPainelInscricoes(container, ativId) {
    const inscs = lerInscricoes().filter(i => i.atividade === ativId && !i.cancelado);
    const at = lerAtividades().find(a => a.id === ativId);
    if (!at) return;

    const presentes = inscs.filter(i => i.chegou).length;
    const total = inscs.length;

    container.innerHTML = `
      <div class="painel-topo">
        <h3><i class="fas fa-users"></i> ${at.nome}</h3>
        <p class="subtexto"><i class="fas fa-calendar-alt"></i> ${at.data_inicio || ''} &nbsp;|&nbsp; <i class="fas fa-user-check"></i> ${presentes} de ${total} confirmados presentes</p>
        <div class="acoes-topo">
          <button onclick="PR_INSCRICAO_GESTAO.exportarCSV('${ativId}')" class="btn-secundario"><i class="fas fa-download"></i> Exportar lista</button>
          <button onclick="PR_INSCRICAO_GESTAO.enviarLembrete('${ativId}')" class="btn-secundario"><i class="fas fa-paper-plane"></i> Enviar lembrete</button>
        </div>
      </div>
      <div class="lista-inscritos">
        ${inscs.length === 0
          ? '<p class="aviso-vazio"><i class="fas fa-info-circle"></i> Nenhuma inscrição registrada ainda.</p>'
          : inscs.map(i => `
              <div class="cartao-inscrito ${i.chegou ? 'chegou' : ''}">
                <div class="inscrito-info">
                  <strong>${i.nome || '—'}</strong>
                  <span class="inscrito-email"><a href="mailto:${i.email}">${i.email}</a></span>
                  ${i.telefone ? `<span class="inscrito-tel"><a href="tel:${i.telefone}">${i.telefone}</a></span>` : ''}
                  ${i.cidade ? `<span class="inscrito-cidade"><i class="fas fa-map-marker-alt"></i> ${i.cidade}</span>` : ''}
                  <span class="inscrito-data">${i.criadoEm ? new Date(i.criadoEm).toLocaleDateString('pt-BR') : ''}</span>
                </div>
                <div class="inscrito-acoes">
                  <button class="btn-checkin ${i.chegou ? 'ativo' : ''}" onclick="PR_INSCRICAO_GESTAO.toggleCheckin('${i.id}', '${ativId}')" title="${i.chegou ? 'Desfazer check-in' : 'Registrar chegada'}">
                    <i class="fas ${i.chegou ? 'fa-check-circle' : 'fa-circle'}"></i> ${i.chegou ? 'Presente' : 'Aguardando'}
                  </button>
                  <button class="btn-cancelar" onclick="PR_INSCRICAO_GESTAO.cancelarInscricao('${i.id}', '${ativId}')" title="Cancelar inscrição">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>`).join('')
        }
      </div>`;
  }

  // Renderiza o painel de cadastro de um novo encontro público
  function renderFormNovoEncontro(container) {
    container.innerHTML = `
      <form id="form-novo-encontro">
        <div class="campo-grupo">
          <label>Nome do encontro <span class="obrigatorio">*</span></label>
          <input type="text" id="ne-nome" placeholder="Festival de Verão 2026" required>
        </div>
        <div class="campo-grupo">
          <label>Descrição curta</label>
          <input type="text" id="ne-desc" placeholder="Uma linha que aparece abaixo do título na página pública">
        </div>
        <div class="campo-grupo cols-2">
          <div>
            <label>Data de início <span class="obrigatorio">*</span></label>
            <input type="date" id="ne-data-ini" required>
          </div>
          <div>
            <label>Data de encerramento</label>
            <input type="date" id="ne-data-fim">
          </div>
        </div>
        <div class="campo-grupo cols-2">
          <div>
            <label>Horário</label>
            <input type="text" id="ne-horario" placeholder="A partir das 9h">
          </div>
          <div>
            <label>Local</label>
            <input type="text" id="ne-local" placeholder="Parque Retiro — Maricá, RJ">
          </div>
        </div>
        <div class="campo-grupo cols-2">
          <div>
            <label>Valor / Contribuição</label>
            <input type="text" id="ne-valor" placeholder="Entrada gratuita">
          </div>
          <div>
            <label>Vagas máximas</label>
            <input type="number" id="ne-vagas" min="0" placeholder="0 = sem limite">
          </div>
        </div>
        <div class="campo-grupo">
          <label>Texto completo da página</label>
          <textarea id="ne-texto" rows="5" placeholder="Programação, o que trazer, como chegar..."></textarea>
        </div>
        <div class="campo-grupo">
          <label>Imagem de capa (URL)</label>
          <input type="url" id="ne-imagem" placeholder="https://...">
        </div>
        <div class="campo-grupo">
          <label>Campo extra no formulário de inscrição</label>
          <input type="text" id="ne-campo-extra" placeholder="Ex.: Você tem restrição alimentar?">
        </div>
        <div class="campo-grupo">
          <label><input type="checkbox" id="ne-ativo"> Exibir no site (ativar inscrições)</label>
        </div>
        <div id="ne-msg" role="alert" style="display:none"></div>
        <button type="submit" class="btn-primario"><i class="fas fa-plus"></i> Criar encontro</button>
      </form>`;

    document.getElementById('form-novo-encontro').onsubmit = e => {
      e.preventDefault();
      salvarNovoEncontro();
    };
  }

  function salvarNovoEncontro() {
    const g = id => (document.getElementById(id) || {}).value || '';
    const nome = g('ne-nome').trim();
    if (!nome) { mostrarMsgGestao('ne-msg', 'erro', 'Informe o nome do encontro.'); return; }
    const novoId = 'at' + Date.now().toString(36);
    const novoEncontro = {
      id: novoId,
      nome: nome.slice(0, 120),
      descricao_curta: g('ne-desc').slice(0, 200),
      data_inicio: g('ne-data-ini'),
      data_fim: g('ne-data-fim'),
      horario: g('ne-horario').slice(0, 60),
      local: g('ne-local').slice(0, 120),
      valor: g('ne-valor').slice(0, 80),
      vagas_max: parseInt(g('ne-vagas'), 10) || 0,
      texto: g('ne-texto').slice(0, 5000),
      imagem: g('ne-imagem').slice(0, 500),
      campo_extra: g('ne-campo-extra').slice(0, 100),
      ativo: !!(document.getElementById('ne-ativo') && document.getElementById('ne-ativo').checked),
      inscricoes_encerradas: false,
      criadoEm: new Date().toISOString()
    };
    const lista = lerAtividades();
    lista.unshift(novoEncontro);
    H.db.set('pr_atividades_pub', JSON.stringify(lista));
    mostrarMsgGestao('ne-msg', 'ok',
      `Encontro criado! Link público: <a href="encontro.html?id=${novoId}" target="_blank">encontro.html?id=${novoId}</a>`);
  }

  // Check-in
  function toggleCheckin(inscricaoId, ativId) {
    const inscs = lerInscricoes();
    const i = inscs.find(x => x.id === inscricaoId);
    if (!i) return;
    i.chegou = !i.chegou;
    i.chegouEm = i.chegou ? new Date().toISOString() : null;
    H.db.set('pr_inscricoes', JSON.stringify(inscs));
    // re-renderiza
    const cont = document.getElementById('painel-inscritos');
    if (cont) renderPainelInscricoes(cont, ativId);
  }

  // Cancelar inscrição
  function cancelarInscricao(inscricaoId, ativId) {
    if (!confirm('Cancelar a inscrição desta pessoa?')) return;
    const inscs = lerInscricoes();
    const i = inscs.find(x => x.id === inscricaoId);
    if (i) { i.cancelado = true; i.canceladoEm = new Date().toISOString(); }
    H.db.set('pr_inscricoes', JSON.stringify(inscs));
    const cont = document.getElementById('painel-inscritos');
    if (cont) renderPainelInscricoes(cont, ativId);
  }

  // Exportar CSV
  function exportarCSV(ativId) {
    const inscs = lerInscricoes().filter(i => i.atividade === ativId && !i.cancelado);
    const at = lerAtividades().find(a => a.id === ativId);
    const cabecalho = 'Nome;E-mail;Telefone;Cidade;Interesse registrado em;Presente';
    const linhas = inscs.map(i =>
      `"${(i.nome||'').replace(/"/g,'""')}";"${i.email||''}";"${i.telefone||''}";"${i.cidade||''}";"${i.criadoEm ? new Date(i.criadoEm).toLocaleDateString('pt-BR') : ''}";"${i.chegou ? 'Sim' : 'Não'}"`
    );
    const csv = '﻿' + [cabecalho, ...linhas].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'inscritos-' + (at ? at.nome.replace(/\s+/g,'-').toLowerCase() : ativId) + '-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
  }

  // Enviar lembrete por e-mail
  async function enviarLembrete(ativId) {
    const inscs = lerInscricoes().filter(i => i.atividade === ativId && !i.cancelado && !i.chegou);
    const at = lerAtividades().find(a => a.id === ativId);
    if (!inscs.length) { alert('Nenhuma inscrição ativa para este encontro.'); return; }
    if (!confirm(`Enviar lembrete para ${inscs.length} pessoa(s)?`)) return;
    if (!window.PR_SUPABASE || !window.PR_SUPABASE.funcao) { alert('Envio automático não disponível. Envie o lembrete manualmente.'); return; }
    const msgs = inscs.map(i => ({
      para: i.email, nome: i.nome || '',
      assunto: `Lembrete: ${at.nome}${at.data_inicio ? ' — ' + at.data_inicio.split('-').reverse().join('/') : ''}`,
      html: `<p>Olá, ${(i.nome || '').split(' ')[0] || 'amigo(a)'}!</p>
             <p>Este é um lembrete do <strong>${at.nome}</strong>.</p>
             ${at.data_inicio ? `<p><strong>Data:</strong> ${at.data_inicio.split('-').reverse().join('/')}</p>` : ''}
             ${at.horario ? `<p><strong>Horário:</strong> ${at.horario}</p>` : ''}
             ${at.local ? `<p><strong>Local:</strong> ${at.local}</p>` : ''}
             <p>Estamos ansiosos para recebê-lo(a)!</p>
             <p>Parque de Estudo e Reflexão Retiro</p>`,
      texto: `Olá, ${(i.nome || '').split(' ')[0] || 'amigo(a)'}!\nEste é um lembrete do ${at.nome}.\n${at.data_inicio ? 'Data: ' + at.data_inicio.split('-').reverse().join('/') + '\n' : ''}${at.horario ? 'Horário: ' + at.horario + '\n' : ''}${at.local ? 'Local: ' + at.local + '\n' : ''}\nParque de Estudo e Reflexão Retiro`
    }));
    try {
      const resp = await PR_SUPABASE.funcao('enviar-email', { mensagens: msgs });
      const cp = resp.corpo || {};
      if (resp.status === 200) alert(`Lembrete enviado para ${(cp.enviados || []).length} pessoa(s).`);
      else alert('Não foi possível enviar o lembrete agora. Tente de novo.');
    } catch (e) {
      alert('Erro ao enviar: ' + e.message);
    }
  }

  function mostrarMsgGestao(id, tipo, html) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = tipo === 'erro' ? 'aviso-erro' : 'aviso-sucesso';
    el.innerHTML = html;
    el.style.display = '';
  }

  window.PR_INSCRICAO_GESTAO = {
    renderPainelInscricoes, renderFormNovoEncontro,
    toggleCheckin, cancelarInscricao, exportarCSV, enviarLembrete,
    lerInscricoes, lerAtividades
  };
}

// ─── INICIALIZAÇÃO ────────────────────────────────────────────────────────────

// Página pública (encontro.html)
if (document.body && document.body.dataset.page === 'encontro') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarPaginaPublica);
  else iniciarPaginaPublica();
}

// Área restrita: a gestão é montada pelo area.js quando o módulo de Comunicação abre
window.PR_INSCRICAO = { iniciarGestaoInterna };

})();
