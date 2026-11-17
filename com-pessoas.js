// Comunicação › Lista de Pessoas do Parque (Bloco 4)
// Painel interno para ver, filtrar, adicionar e exportar contatos.
// Acesso via: CONecta › Comunicação › Pessoas do Parque
// Depende de: PR_DADOS, PR_SUPABASE
(function () {

/* ── Utilitários ─────────────────────────────────────────────────────────── */
const uid  = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const agora = () => new Date().toISOString();
const esc  = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const H    = {};

const VINCULOS = {
  visitante:  'Visitante',
  inscrito:   'Inscrito em atividade',
  doador:     'Doador',
  comprador:  'Comprador',
  mestre:     'Mestre',
  voluntario: 'Voluntário'
};

const ORIGENS = {
  inscricao:  'Formulário de atividade',
  vaquinha:   'Vaquinha coletiva',
  encomenda:  'Livraria',
  manual:     'Adicionado pela equipe',
  instagram:  'Instagram',
  whatsapp:   'WhatsApp',
  indicacao:  'Indicação',
  site:       'Site',
  evento:     'Evento presencial'
};

/* ── Leitura e escrita ───────────────────────────────────────────────────── */
function lerContatos() {
  return (H.db && H.db.get('com_contatos')) || [];
}

function salvarContatos(lista) {
  if (!H.db) return false;
  return H.db.set('com_contatos', lista);
}

/* ── Filtros ─────────────────────────────────────────────────────────────── */
function filtrar(lista, f) {
  return lista.filter(c => {
    if (f.vinculo && !(c.vinculo || []).includes(f.vinculo)) return false;
    if (f.cidade  && !String(c.cidade || '').toLowerCase().includes(f.cidade.toLowerCase())) return false;
    if (f.aceita  && !c.aceita_avisos) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      if (!String(c.nome || '').toLowerCase().includes(q) &&
          !String(c.email || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

/* ── Adicionar / editar contato ─────────────────────────────────────────── */
function adicionarContato(dados) {
  const lista = lerContatos();
  const emailNorm = String(dados.email || '').toLowerCase().trim();
  if (!emailNorm) return { ok: false, erro: 'E-mail obrigatório.' };

  const existente = lista.find(c => String(c.email || '').toLowerCase() === emailNorm);
  if (existente) return { ok: false, erro: 'Este e-mail já está na lista.' };

  const contato = {
    id:           uid(),
    nome:         String(dados.nome || '').trim(),
    email:        emailNorm,
    telefone:     String(dados.telefone || '').trim(),
    cidade:       String(dados.cidade || '').trim(),
    vinculo:      Array.isArray(dados.vinculo) ? dados.vinculo : [dados.vinculo || 'visitante'],
    origem:       dados.origem || 'manual',
    aceita_avisos: dados.aceita_avisos !== false,
    historico:    [],
    criadoEm:     agora()
  };
  lista.push(contato);
  salvarContatos(lista);
  return { ok: true, contato };
}

function atualizarContato(id, dados) {
  const lista = lerContatos();
  const idx = lista.findIndex(c => c.id === id);
  if (idx < 0) return { ok: false, erro: 'Contato não encontrado.' };
  Object.assign(lista[idx], dados, { id }); // id nunca muda
  salvarContatos(lista);
  return { ok: true, contato: lista[idx] };
}

function removerContato(id) {
  const lista = lerContatos();
  const idx = lista.findIndex(c => c.id === id);
  if (idx < 0) return { ok: false, erro: 'Contato não encontrado.' };
  lista.splice(idx, 1);
  salvarContatos(lista);
  return { ok: true };
}

/* ── Sincronizar com servidor ────────────────────────────────────────────── */
async function sincronizar() {
  if (!window.PR_SUPABASE || !PR_SUPABASE.ligado()) return { ok: false, erro: 'Sem conexão com o servidor.' };
  try {
    const r = await PR_SUPABASE.rpc('pr_sincronizar_contatos', {});
    if (r.status >= 400) return { ok: false, erro: 'Erro ' + r.status };
    const dados = await r.json();
    return { ok: true, ...dados };
  } catch (e) {
    return { ok: false, erro: String(e.message || e) };
  }
}

/* ── Exportar CSV ─────────────────────────────────────────────────────────── */
function exportarCSV(lista) {
  const cols = ['nome', 'email', 'telefone', 'cidade', 'vinculo', 'origem', 'aceita_avisos', 'criadoEm'];
  const linhas = [cols.join(';')];
  lista.forEach(c => {
    linhas.push(cols.map(k => {
      const v = k === 'vinculo' ? (c.vinculo || []).join('|') : String(c[k] == null ? '' : c[k]);
      return '"' + v.replace(/"/g, '""') + '"';
    }).join(';'));
  });
  const blob = new Blob(['﻿' + linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pessoas-parque-retiro-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ── Renderização do painel ──────────────────────────────────────────────── */
function renderPainel(container) {
  if (!container) return;
  const lista = lerContatos();

  container.innerHTML = `
    <div class="pr-pessoas-painel">
      <div class="pr-pessoas-toolbar">
        <input class="pr-input" id="pss-q"       placeholder="Buscar por nome ou e-mail" style="flex:1;min-width:140px">
        <select class="pr-select" id="pss-vinculo">
          <option value="">Todos os vínculos</option>
          ${Object.entries(VINCULOS).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
        </select>
        <input class="pr-input" id="pss-cidade" placeholder="Cidade" style="width:120px">
        <label style="display:flex;align-items:center;gap:4px;font-size:14px;white-space:nowrap">
          <input type="checkbox" id="pss-aceita"> Aceita avisos
        </label>
        <button class="pr-btn" id="pss-filtrar">Filtrar</button>
        <button class="pr-btn pr-btn-secundario" id="pss-exportar">Exportar CSV</button>
        <button class="pr-btn" id="pss-adicionar">+ Adicionar</button>
        <button class="pr-btn pr-btn-secundario" id="pss-sincronizar">↺ Sincronizar</button>
      </div>
      <div id="pss-msg" style="margin:8px 0;min-height:24px;font-size:13px"></div>
      <div id="pss-lista"></div>
      <div id="pss-form-container"></div>
    </div>`;

  const q = document.getElementById('pss-q');
  const vincSelect = document.getElementById('pss-vinculo');
  const cidadeInput = document.getElementById('pss-cidade');
  const aceitaCk = document.getElementById('pss-aceita');
  const msg = document.getElementById('pss-msg');
  const listaDiv = document.getElementById('pss-lista');
  const formContainer = document.getElementById('pss-form-container');

  function mostrarMsg(t, tipo) {
    msg.textContent = t;
    msg.style.color = tipo === 'erro' ? '#c00' : tipo === 'ok' ? '#080' : '#444';
  }

  function renderLista() {
    const f = {
      q:       q.value.trim(),
      vinculo: vincSelect.value,
      cidade:  cidadeInput.value.trim(),
      aceita:  aceitaCk.checked || null
    };
    const resultado = filtrar(lerContatos(), f);
    if (!resultado.length) {
      listaDiv.innerHTML = '<p style="color:#888;text-align:center;padding:24px">Nenhuma pessoa encontrada.</p>';
      return;
    }
    listaDiv.innerHTML = `
      <p style="font-size:13px;color:#666;margin:4px 0">${resultado.length} pessoa${resultado.length !== 1 ? 's' : ''}</p>
      <table class="pr-tabela" style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f5f5f0;text-align:left">
            <th style="padding:8px 10px">Nome</th>
            <th style="padding:8px 10px">E-mail</th>
            <th style="padding:8px 10px">Cidade</th>
            <th style="padding:8px 10px">Vínculo</th>
            <th style="padding:8px 10px">Avisos</th>
            <th style="padding:8px 10px"></th>
          </tr>
        </thead>
        <tbody>
          ${resultado.map(c => `
            <tr data-id="${esc(c.id)}" style="border-bottom:1px solid #eee">
              <td style="padding:8px 10px">${esc(c.nome)}</td>
              <td style="padding:8px 10px">${esc(c.email)}</td>
              <td style="padding:8px 10px">${esc(c.cidade)}</td>
              <td style="padding:8px 10px">${(c.vinculo || []).map(v => VINCULOS[v] || v).join(', ')}</td>
              <td style="padding:8px 10px;text-align:center">${c.aceita_avisos ? '✓' : '—'}</td>
              <td style="padding:8px 10px">
                <button class="pr-btn pr-btn-sm pss-editar" data-id="${esc(c.id)}">Editar</button>
                <button class="pr-btn pr-btn-sm pr-btn-perigo pss-remover" data-id="${esc(c.id)}">Remover</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    listaDiv.querySelectorAll('.pss-editar').forEach(btn => {
      btn.addEventListener('click', () => {
        const contato = lerContatos().find(c => c.id === btn.dataset.id);
        if (contato) renderForm(contato);
      });
    });
    listaDiv.querySelectorAll('.pss-remover').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Remover esta pessoa da lista?')) return;
        const r = removerContato(btn.dataset.id);
        mostrarMsg(r.ok ? 'Pessoa removida.' : r.erro, r.ok ? 'ok' : 'erro');
        renderLista();
      });
    });
  }

  function renderForm(contato) {
    const novo = !contato;
    const c = contato || {};
    formContainer.innerHTML = `
      <div class="pr-modal-fundo" style="position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:200;display:flex;align-items:center;justify-content:center">
        <div class="pr-modal" style="background:#fff;border-radius:8px;padding:24px;width:min(480px,96vw);max-height:90vh;overflow-y:auto">
          <h3 style="margin:0 0 16px">${novo ? 'Adicionar pessoa' : 'Editar contato'}</h3>
          <label class="pr-label">Nome completo *</label>
          <input class="pr-input" id="pss-fn" value="${esc(c.nome || '')}" style="width:100%;margin-bottom:12px">
          <label class="pr-label">E-mail *</label>
          <input class="pr-input" id="pss-fe" type="email" value="${esc(c.email || '')}" ${novo ? '' : 'readonly'} style="width:100%;margin-bottom:12px">
          <label class="pr-label">Telefone</label>
          <input class="pr-input" id="pss-ft" value="${esc(c.telefone || '')}" style="width:100%;margin-bottom:12px">
          <label class="pr-label">Cidade</label>
          <input class="pr-input" id="pss-fc" value="${esc(c.cidade || '')}" style="width:100%;margin-bottom:12px">
          <label class="pr-label">Vínculo</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
            ${Object.entries(VINCULOS).map(([k,v]) => `
              <label style="display:flex;align-items:center;gap:4px;font-size:14px">
                <input type="checkbox" class="pss-fv" value="${k}" ${(c.vinculo||[]).includes(k) ? 'checked' : ''}> ${v}
              </label>`).join('')}
          </div>
          <label class="pr-label">Como chegou ao Parque</label>
          <select class="pr-select" id="pss-fo" style="width:100%;margin-bottom:12px">
            ${Object.entries(ORIGENS).map(([k,v]) => `<option value="${k}" ${c.origem===k?'selected':''}>${v}</option>`).join('')}
          </select>
          <label style="display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:16px">
            <input type="checkbox" id="pss-fac" ${c.aceita_avisos !== false ? 'checked' : ''}> Aceita receber avisos
          </label>
          <div id="pss-form-erro" style="color:#c00;font-size:13px;min-height:18px;margin-bottom:8px"></div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="pr-btn pr-btn-secundario" id="pss-cancelar">Cancelar</button>
            <button class="pr-btn" id="pss-salvar">${novo ? 'Adicionar' : 'Salvar'}</button>
          </div>
        </div>
      </div>`;

    document.getElementById('pss-cancelar').addEventListener('click', () => { formContainer.innerHTML = ''; });

    document.getElementById('pss-salvar').addEventListener('click', () => {
      const nome  = document.getElementById('pss-fn').value.trim();
      const email = document.getElementById('pss-fe').value.trim();
      const erroDiv = document.getElementById('pss-form-erro');
      if (!nome)  { erroDiv.textContent = 'Informe o nome.'; return; }
      if (!email) { erroDiv.textContent = 'Informe o e-mail.'; return; }
      const vinculos = [...document.querySelectorAll('.pss-fv:checked')].map(x => x.value);

      const payload = {
        nome, email,
        telefone:     document.getElementById('pss-ft').value.trim(),
        cidade:       document.getElementById('pss-fc').value.trim(),
        vinculo:      vinculos.length ? vinculos : ['visitante'],
        origem:       document.getElementById('pss-fo').value,
        aceita_avisos: document.getElementById('pss-fac').checked
      };

      const r = novo ? adicionarContato(payload) : atualizarContato(c.id, payload);
      if (!r.ok) { erroDiv.textContent = r.erro; return; }
      formContainer.innerHTML = '';
      mostrarMsg(novo ? 'Pessoa adicionada.' : 'Contato atualizado.', 'ok');
      renderLista();
    });
  }

  document.getElementById('pss-filtrar').addEventListener('click', renderLista);
  document.getElementById('pss-exportar').addEventListener('click', () => {
    const f = { q: q.value.trim(), vinculo: vincSelect.value, cidade: cidadeInput.value.trim(), aceita: aceitaCk.checked || null };
    exportarCSV(filtrar(lerContatos(), f));
  });
  document.getElementById('pss-adicionar').addEventListener('click', () => renderForm(null));
  document.getElementById('pss-sincronizar').addEventListener('click', async () => {
    mostrarMsg('Sincronizando…', '');
    const r = await sincronizar();
    if (r.ok) {
      mostrarMsg(`Sincronizado: ${r.adicionados} adicionado(s), ${r.atualizados} atualizado(s). Total: ${r.total}.`, 'ok');
      renderLista();
    } else {
      mostrarMsg('Erro ao sincronizar: ' + r.erro, 'erro');
    }
  });

  // Enter no campo busca dispara filtro
  q.addEventListener('keydown', e => { if (e.key === 'Enter') renderLista(); });

  renderLista();
}

/* ── Inicialização ───────────────────────────────────────────────────────── */
function iniciar(db) {
  H.db = db;
}

/* ── API pública ──────────────────────────────────────────────────────────── */
window.PR_PESSOAS = {
  iniciar,
  renderPainel,
  adicionarContato,
  atualizarContato,
  removerContato,
  exportarCSV: lista => exportarCSV(lista || lerContatos()),
  sincronizar,
  lerContatos,
  filtrar
};

})();
