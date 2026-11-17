// Comunicação › Aviso por E-mail para Grupos (Bloco 5)
// Editor de aviso + seletor de público + pré-visualização + envio + histórico.
// Acesso via: CONecta › Comunicação › Avisos por E-mail
// Depende de: PR_DADOS, PR_SUPABASE, PR_PESSOAS (Bloco 4)
(function () {

/* ── Utilitários ─────────────────────────────────────────────────────────── */
const uid  = () => 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const agora = () => new Date().toISOString();
const esc  = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const H    = {};

// Limite diário do Gmail gratuito
const LIMITE_GMAIL = 500;

const TIPOS_DEST = {
  todos:       'Todas as pessoas da lista',
  inscritos:   'Só quem está inscrito em alguma atividade',
  doadores:    'Só doadores',
  aceita:      'Só quem aceita receber avisos'
};

/* ── Leitura e escrita ───────────────────────────────────────────────────── */
function lerEnvios() {
  return (H.db && H.db.get('com_envios')) || [];
}
function salvarEnvio(envio) {
  if (!H.db) return false;
  const lista = lerEnvios();
  const idx = lista.findIndex(e => e.id === envio.id);
  if (idx >= 0) lista[idx] = envio; else lista.push(envio);
  return H.db.set('com_envios', lista);
}

/* ── Montar lista de destinatários ───────────────────────────────────────── */
function montarDestinatarios(tipo) {
  const contatos = window.PR_PESSOAS ? PR_PESSOAS.lerContatos() : (H.db && H.db.get('com_contatos')) || [];
  switch (tipo) {
    case 'inscritos': return contatos.filter(c => (c.vinculo || []).includes('inscrito'));
    case 'doadores':  return contatos.filter(c => (c.vinculo || []).includes('doador'));
    case 'aceita':    return contatos.filter(c => c.aceita_avisos !== false);
    default:          return contatos; // 'todos'
  }
}

/* ── Montar HTML do e-mail ───────────────────────────────────────────────── */
function montarHtml(aviso, pessoa) {
  const pn = String(pessoa && pessoa.nome || '').trim().split(/\s+/)[0] || '';
  const saudacao = pn ? `Olá, ${pn}!` : 'Olá!';
  const baseUrl  = location.protocol.startsWith('http') ? new URL('.', document.baseURI).href : 'https://parqueretiro.org.br/';
  const logoUrl  = baseUrl + 'imagens/logo-parque-retiro.png';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(aviso.assunto)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:24px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:8px;overflow:hidden">
        <!-- Cabeçalho -->
        <tr><td style="background:#2d6a4f;padding:24px;text-align:center">
          <img src="${logoUrl}" alt="Parque Retiro" width="120" style="max-width:120px;height:auto">
        </td></tr>
        <!-- Conteúdo -->
        <tr><td style="padding:32px 40px 24px">
          <p style="font-size:16px;color:#333;margin:0 0 16px">${esc(saudacao)}</p>
          <h2 style="font-size:22px;color:#1a3c2a;margin:0 0 20px">${esc(aviso.titulo || aviso.assunto)}</h2>
          <div style="font-size:16px;color:#444;line-height:1.6">
            ${String(aviso.corpo_texto || '').split('\n').map(p => p.trim() ? `<p style="margin:0 0 14px">${esc(p)}</p>` : '<br>').join('')}
          </div>
          ${aviso.botao_texto ? `
          <div style="text-align:center;margin:28px 0">
            <a href="${esc(aviso.botao_link || baseUrl)}" style="display:inline-block;background:#2d6a4f;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:bold">${esc(aviso.botao_texto)}</a>
          </div>` : ''}
        </td></tr>
        <!-- Rodapé -->
        <tr><td style="background:#f5f5f0;padding:16px 40px;text-align:center">
          <p style="font-size:12px;color:#888;margin:0">
            Parque de Estudo e Reflexão Retiro · Maricá, RJ<br>
            Você recebe este aviso por ter se relacionado com o Parque Retiro.<br>
            Para parar de receber, responda este e-mail com "descadastrar".
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/* ── Enviar aviso ─────────────────────────────────────────────────────────── */
async function enviarAviso(aviso, tipo) {
  if (!window.PR_SUPABASE || !PR_SUPABASE.ligado()) {
    return { ok: false, erro: 'Sem conexão com o servidor.' };
  }

  const destinatarios = montarDestinatarios(tipo);
  if (!destinatarios.length) return { ok: false, erro: 'Nenhum destinatário encontrado para este público.' };
  if (destinatarios.length > LIMITE_GMAIL) {
    return { ok: false, erro: `Esta lista tem ${destinatarios.length} pessoas. O Gmail gratuito envia até ${LIMITE_GMAIL}/dia. Envie em lotes ou use o Google Workspace.` };
  }

  const msgs = destinatarios.map(p => ({
    para:   p.email,
    nome:   p.nome,
    assunto: aviso.assunto,
    html:   montarHtml(aviso, p),
    texto:  String(aviso.corpo_texto || '').substring(0, 500)
  }));

  let enviados = 0, erros = 0;

  // Envia em lotes de 20 para não sobrecarregar
  for (let i = 0; i < msgs.length; i += 20) {
    const lote = msgs.slice(i, i + 20);
    try {
      const r = await PR_SUPABASE.funcao('enviar-email', { mensagens: lote });
      if (r.status >= 400) erros += lote.length;
      else enviados += lote.length;
    } catch (_) {
      erros += lote.length;
    }
  }

  // Registra o envio
  const envioRegistro = {
    id:               aviso.id,
    titulo:           aviso.titulo,
    assunto:          aviso.assunto,
    destinatario_tipo: tipo,
    total:            destinatarios.length,
    enviados,
    erros,
    status:           erros === destinatarios.length ? 'erro' : erros > 0 ? 'parcial' : 'concluido',
    criadoEm:         aviso.criadoEm || agora(),
    enviadoEm:        agora()
  };

  salvarEnvio(envioRegistro);
  try {
    await PR_SUPABASE.rpc('pr_registrar_envio', { p_envio: envioRegistro });
  } catch (_) { /* log local já foi salvo; falha no servidor não impede o retorno */ }

  return {
    ok:       erros < destinatarios.length,
    enviados, erros,
    total:    destinatarios.length,
    status:   envioRegistro.status
  };
}

/* ── Renderização do painel ──────────────────────────────────────────────── */
function renderPainel(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="pr-email-painel">
      <div style="display:flex;gap:12px;margin-bottom:12px">
        <button class="pr-btn" id="pem-novo-btn">+ Novo aviso</button>
        <span style="color:#666;font-size:13px;align-self:center">Envie um comunicado para grupos de pessoas do Parque.</span>
      </div>
      <div id="pem-editor" style="display:none"></div>
      <div id="pem-preview" style="display:none"></div>
      <div id="pem-msg" style="min-height:24px;font-size:13px;margin:4px 0"></div>
      <h4 style="margin:16px 0 8px">Histórico de envios</h4>
      <div id="pem-historico"></div>
    </div>`;

  const msg = document.getElementById('pem-msg');
  const editor = document.getElementById('pem-editor');
  const preview = document.getElementById('pem-preview');

  function mostrarMsg(t, tipo) {
    msg.textContent = t;
    msg.style.color = tipo === 'erro' ? '#c00' : tipo === 'ok' ? '#080' : '#444';
  }

  function renderHistorico() {
    const lista = lerEnvios().slice().reverse();
    const div = document.getElementById('pem-historico');
    if (!lista.length) {
      div.innerHTML = '<p style="color:#888;text-align:center;padding:16px">Nenhum aviso enviado ainda.</p>';
      return;
    }
    div.innerHTML = `<table class="pr-tabela" style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f5f5f0;text-align:left">
        <th style="padding:8px 10px">Assunto</th>
        <th style="padding:8px 10px">Público</th>
        <th style="padding:8px 10px">Enviados</th>
        <th style="padding:8px 10px">Erros</th>
        <th style="padding:8px 10px">Situação</th>
        <th style="padding:8px 10px">Data</th>
      </tr></thead>
      <tbody>${lista.map(e => `
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:8px 10px">${esc(e.assunto)}</td>
          <td style="padding:8px 10px">${esc(TIPOS_DEST[e.destinatario_tipo] || e.destinatario_tipo)}</td>
          <td style="padding:8px 10px">${e.enviados || 0}</td>
          <td style="padding:8px 10px">${e.erros || 0}</td>
          <td style="padding:8px 10px">${e.status === 'concluido' ? '✓ Enviado' : e.status === 'parcial' ? '⚠ Parcial' : '✗ Erro'}</td>
          <td style="padding:8px 10px">${e.enviadoEm ? e.enviadoEm.slice(0,10) : '—'}</td>
        </tr>`).join('')}
      </tbody></table>`;
  }

  function renderEditor(aviso) {
    const a = aviso || {};
    editor.style.display = '';
    editor.innerHTML = `
      <div style="border:1px solid #ddd;border-radius:8px;padding:20px;margin-bottom:12px;background:#fafaf8">
        <h4 style="margin:0 0 16px">${a.id ? 'Editar aviso' : 'Novo aviso'}</h4>
        <label class="pr-label">Assunto (linha do e-mail) *</label>
        <input class="pr-input" id="pem-assunto" value="${esc(a.assunto || '')}" placeholder="Ex.: Festival de Verão — Salve a data!" style="width:100%;margin-bottom:12px">
        <label class="pr-label">Título (dentro do e-mail)</label>
        <input class="pr-input" id="pem-titulo" value="${esc(a.titulo || '')}" placeholder="Igual ao assunto se deixar vazio" style="width:100%;margin-bottom:12px">
        <label class="pr-label">Texto *</label>
        <textarea class="pr-input" id="pem-corpo" rows="6" placeholder="Escreva o texto do aviso aqui. Cada linha em branco vira um parágrafo." style="width:100%;margin-bottom:12px">${esc(a.corpo_texto || '')}</textarea>
        <label class="pr-label">Botão (opcional)</label>
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <input class="pr-input" id="pem-btn-texto" value="${esc(a.botao_texto || '')}" placeholder="Texto do botão (ex.: Ver programação)" style="flex:1">
          <input class="pr-input" id="pem-btn-link"  value="${esc(a.botao_link  || '')}" placeholder="Link do botão" style="flex:1">
        </div>
        <label class="pr-label">Quem vai receber *</label>
        <select class="pr-select" id="pem-tipo" style="width:100%;margin-bottom:4px">
          ${Object.entries(TIPOS_DEST).map(([k,v]) => `<option value="${k}" ${(a.destinatario_tipo||'aceita')===k?'selected':''}>${v}</option>`).join('')}
        </select>
        <p id="pem-contagem" style="font-size:13px;color:#666;margin:4px 0 16px"></p>
        <div id="pem-ed-erro" style="color:#c00;font-size:13px;min-height:18px;margin-bottom:8px"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="pr-btn pr-btn-secundario" id="pem-cancelar">Cancelar</button>
          <button class="pr-btn pr-btn-secundario" id="pem-previsualizar">Pré-visualizar</button>
          <button class="pr-btn pr-btn-primario" id="pem-enviar" style="background:#c05000">Enviar agora</button>
        </div>
      </div>`;

    function atualizarContagem() {
      const tipo = document.getElementById('pem-tipo').value;
      const dests = montarDestinatarios(tipo);
      const p = document.getElementById('pem-contagem');
      p.textContent = `${dests.length} pessoa${dests.length !== 1 ? 's' : ''} vão receber este aviso.`;
      p.style.color = dests.length > LIMITE_GMAIL ? '#c05000' : '#555';
    }
    document.getElementById('pem-tipo').addEventListener('change', atualizarContagem);
    atualizarContagem();

    document.getElementById('pem-cancelar').addEventListener('click', () => { editor.style.display = 'none'; });

    document.getElementById('pem-previsualizar').addEventListener('click', () => {
      const aviso = lerCampos();
      if (!aviso) return;
      const html = montarHtml(aviso, { nome: 'Fulano de Tal', email: 'teste@exemplo.com' });
      preview.style.display = '';
      preview.innerHTML = `
        <div style="border:2px solid #2d6a4f;border-radius:8px;overflow:hidden;margin-bottom:12px">
          <div style="background:#2d6a4f;color:#fff;padding:10px 16px;display:flex;justify-content:space-between;align-items:center">
            <strong>Pré-visualização</strong>
            <button id="pem-fechar-preview" style="background:none;border:none;color:#fff;cursor:pointer;font-size:18px">✕</button>
          </div>
          <iframe srcdoc="${html.replace(/"/g, '&quot;')}" style="width:100%;height:400px;border:none"></iframe>
        </div>`;
      document.getElementById('pem-fechar-preview').addEventListener('click', () => { preview.style.display = 'none'; preview.innerHTML = ''; });
    });

    document.getElementById('pem-enviar').addEventListener('click', async () => {
      const aviso = lerCampos();
      if (!aviso) return;
      const tipo = document.getElementById('pem-tipo').value;
      const dests = montarDestinatarios(tipo);
      if (!confirm(`Enviar este aviso para ${dests.length} pessoa${dests.length !== 1 ? 's' : ''}?`)) return;

      document.getElementById('pem-enviar').disabled = true;
      document.getElementById('pem-enviar').textContent = 'Enviando…';
      mostrarMsg('Enviando…', '');

      const r = await enviarAviso(aviso, tipo);
      document.getElementById('pem-enviar').disabled = false;
      document.getElementById('pem-enviar').textContent = 'Enviar agora';
      editor.style.display = 'none';

      if (r.ok) {
        mostrarMsg(`Aviso enviado para ${r.enviados} pessoa${r.enviados !== 1 ? 's' : ''}${r.erros ? ` (${r.erros} com erro)` : ''}.`, 'ok');
      } else {
        mostrarMsg('Erro ao enviar: ' + (r.erro || `${r.erros} erros de ${r.total}`), 'erro');
      }
      renderHistorico();
    });

    function lerCampos() {
      const assunto = document.getElementById('pem-assunto').value.trim();
      const corpo   = document.getElementById('pem-corpo').value.trim();
      const erroDiv = document.getElementById('pem-ed-erro');
      if (!assunto) { erroDiv.textContent = 'O assunto é obrigatório.'; return null; }
      if (!corpo)   { erroDiv.textContent = 'Escreva o texto do aviso.'; return null; }
      erroDiv.textContent = '';
      return {
        id:             a.id || uid(),
        assunto,
        titulo:         document.getElementById('pem-titulo').value.trim() || assunto,
        corpo_texto:    corpo,
        botao_texto:    document.getElementById('pem-btn-texto').value.trim(),
        botao_link:     document.getElementById('pem-btn-link').value.trim(),
        destinatario_tipo: document.getElementById('pem-tipo').value,
        criadoEm:       a.criadoEm || agora()
      };
    }
  }

  document.getElementById('pem-novo-btn').addEventListener('click', () => renderEditor(null));
  renderHistorico();
}

/* ── Inicialização ───────────────────────────────────────────────────────── */
function iniciar(db) {
  H.db = db;
}

/* ── API pública ──────────────────────────────────────────────────────────── */
window.PR_EMAIL_GRUPOS = {
  iniciar,
  renderPainel,
  enviarAviso,
  lerEnvios,
  montarHtml,
  montarDestinatarios
};

})();
