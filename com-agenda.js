// Comunicação › Agenda de Publicações (Bloco 1)
// Calendário visual para planejar tudo que a equipe vai publicar nas redes sociais.
// Cada publicação tem: texto, canal, data/hora, responsável, status e campanha.
// Acesso via: CONecta › Comunicação › Agenda de Publicações
// Depende de: PR_DADOS, PR_SUPABASE
(function () {

/* ── Constantes ──────────────────────────────────────────────────────────── */
const uid  = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const agora = () => new Date().toISOString();
const esc  = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const H    = {};

const CANAIS = {
  instagram:          { label: 'Instagram',           cor: '#c13584', icone: '📸' },
  facebook:           { label: 'Facebook',            cor: '#1877f2', icone: '👍' },
  whatsapp_canal:     { label: 'WhatsApp Canal',      cor: '#25d366', icone: '📢' },
  whatsapp_comunidade:{ label: 'WhatsApp Comunidade', cor: '#128c7e', icone: '💬' },
  site:               { label: 'Site / Blog',         cor: '#2d6a4f', icone: '🌐' },
  email:              { label: 'E-mail',              cor: '#f4511e', icone: '✉️' }
};

const STATUS = {
  rascunho: { label: 'Rascunho',           cor: '#999' },
  pronto:   { label: 'Pronto para publicar', cor: '#c05000' },
  publicado: { label: 'Publicado',          cor: '#2d6a4f' }
};

/* ── Leitura e escrita ───────────────────────────────────────────────────── */
function lerPublicacoes() {
  return (H.db && H.db.get('com_publicacoes')) || [];
}
function salvarPublicacoes(lista) {
  if (!H.db) return false;
  return H.db.set('com_publicacoes', lista);
}

/* ── CRUD ────────────────────────────────────────────────────────────────── */
function criarPublicacao(dados) {
  const lista = lerPublicacoes();
  const pub = {
    id:          uid(),
    titulo:      String(dados.titulo || '').trim(),
    texto:       String(dados.texto  || '').trim(),
    arte:        String(dados.arte   || '').trim(),
    canal:       dados.canal   || 'instagram',
    data:        dados.data    || '',
    horario:     dados.horario || '',
    responsavel: String(dados.responsavel || '').trim(),
    campanha:    dados.campanha || '',
    status:      dados.status  || 'rascunho',
    criadoEm:    agora(),
    publicadoEm: ''
  };
  lista.push(pub);
  salvarPublicacoes(lista);
  return { ok: true, pub };
}

function atualizarPublicacao(id, dados) {
  const lista = lerPublicacoes();
  const idx = lista.findIndex(p => p.id === id);
  if (idx < 0) return { ok: false, erro: 'Publicação não encontrada.' };
  // Se mudou para "publicado" e não tinha data, registra agora
  if (dados.status === 'publicado' && !lista[idx].publicadoEm) dados.publicadoEm = agora();
  Object.assign(lista[idx], dados, { id });
  salvarPublicacoes(lista);
  return { ok: true, pub: lista[idx] };
}

function removerPublicacao(id) {
  const lista = lerPublicacoes();
  const idx = lista.findIndex(p => p.id === id);
  if (idx < 0) return { ok: false, erro: 'Publicação não encontrada.' };
  lista.splice(idx, 1);
  salvarPublicacoes(lista);
  return { ok: true };
}

/* ── Importar pacote do Claude (Bloco 3) ─────────────────────────────────── */
// Formato do pacote: { publicacoes: [{ titulo, texto, canal, data, horario, campanha }] }
function importarPacote(json) {
  let pacote;
  try { pacote = typeof json === 'string' ? JSON.parse(json) : json; }
  catch (e) { return { ok: false, erro: 'JSON inválido: ' + e.message }; }

  const pubs = pacote.publicacoes || pacote.itens || pacote;
  if (!Array.isArray(pubs)) return { ok: false, erro: 'O pacote deve conter uma lista de publicações.' };

  let criados = 0;
  pubs.forEach(p => {
    if (p.texto || p.titulo) { criarPublicacao(p); criados++; }
  });
  return { ok: true, criados };
}

/* ── Exportar CSV ─────────────────────────────────────────────────────────── */
function exportarCSV(lista) {
  const cols = ['titulo', 'canal', 'data', 'horario', 'status', 'responsavel', 'campanha', 'texto'];
  const linhas = [cols.join(';')];
  lista.forEach(p => {
    linhas.push(cols.map(k => '"' + String(p[k] == null ? '' : p[k]).replace(/"/g, '""') + '"').join(';'));
  });
  const blob = new Blob(['﻿' + linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'agenda-publicacoes-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ── Helpers de data ─────────────────────────────────────────────────────── */
function semanasDe(ano, mes) {
  // Retorna array de semanas (cada semana = array de 7 datas)
  const primeiro = new Date(ano, mes, 1);
  const ultimo   = new Date(ano, mes + 1, 0);
  const semanas  = [];
  let atual = new Date(primeiro);
  // Recuar para domingo
  atual.setDate(atual.getDate() - atual.getDay());
  while (atual <= ultimo || semanas.length < 1) {
    const semana = [];
    for (let d = 0; d < 7; d++) {
      semana.push(new Date(atual));
      atual.setDate(atual.getDate() + 1);
    }
    semanas.push(semana);
    if (semanas[semanas.length - 1][6] >= ultimo) break;
  }
  return semanas;
}

function isoDate(d) { return d.toISOString().slice(0, 10); }
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

/* ── Renderização ────────────────────────────────────────────────────────── */
function renderPainel(container) {
  if (!container) return;

  // Estado local do painel
  const estado = {
    ano:       new Date().getFullYear(),
    mes:       new Date().getMonth(),
    vista:     'mes',    // 'mes' | 'semana' | 'lista'
    filtroCanal: '',
    filtroCampanha: '',
    filtroStatus: ''
  };

  container.innerHTML = `
    <div class="pr-agenda-painel">
      <!-- Toolbar -->
      <div class="pr-agenda-toolbar" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px">
        <button class="pr-btn" id="ag-prev">◀</button>
        <strong id="ag-titulo-periodo" style="min-width:160px;text-align:center"></strong>
        <button class="pr-btn" id="ag-next">▶</button>
        <button class="pr-btn pr-btn-secundario" id="ag-hoje">Hoje</button>
        <select class="pr-select" id="ag-vista" style="width:110px">
          <option value="mes">Mês</option>
          <option value="semana">Semana</option>
          <option value="lista">Lista</option>
        </select>
        <select class="pr-select" id="ag-canal" style="width:150px">
          <option value="">Todos os canais</option>
          ${Object.entries(CANAIS).map(([k,v]) => `<option value="${k}">${v.icone} ${v.label}</option>`).join('')}
        </select>
        <select class="pr-select" id="ag-status" style="width:150px">
          <option value="">Todos os status</option>
          ${Object.entries(STATUS).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}
        </select>
        <button class="pr-btn" id="ag-nova">+ Nova publicação</button>
        <button class="pr-btn pr-btn-secundario" id="ag-exportar">Exportar CSV</button>
        <button class="pr-btn pr-btn-secundario" id="ag-importar">Importar pacote</button>
      </div>
      <!-- Legenda canais -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;font-size:12px">
        ${Object.entries(CANAIS).map(([k,v]) => `
          <span style="display:inline-flex;align-items:center;gap:4px">
            <span style="width:10px;height:10px;border-radius:50%;background:${v.cor};display:inline-block"></span>
            ${v.icone} ${v.label}
          </span>`).join('')}
      </div>
      <div id="ag-msg" style="min-height:20px;font-size:13px;margin-bottom:4px"></div>
      <div id="ag-calendario"></div>
      <div id="ag-form-container"></div>
      <div id="ag-importar-container"></div>
    </div>`;

  const msgDiv     = document.getElementById('ag-msg');
  const cal        = document.getElementById('ag-calendario');
  const formCont   = document.getElementById('ag-form-container');
  const impCont    = document.getElementById('ag-importar-container');

  function msg(t, tipo) {
    msgDiv.textContent = t;
    msgDiv.style.color = tipo === 'erro' ? '#c00' : tipo === 'ok' ? '#080' : '#444';
  }

  function pubsFiltradas() {
    return lerPublicacoes().filter(p => {
      if (estado.filtroCanal    && p.canal    !== estado.filtroCanal)    return false;
      if (estado.filtroStatus   && p.status   !== estado.filtroStatus)   return false;
      if (estado.filtroCampanha && p.campanha !== estado.filtroCampanha) return false;
      return true;
    });
  }

  /* ── Vista: Mês ─────────────────────────────────────────────────────────── */
  function renderMes() {
    const semanas = semanasDe(estado.ano, estado.mes);
    const pubsMap = {};
    pubsFiltradas().forEach(p => { if (p.data) { if (!pubsMap[p.data]) pubsMap[p.data] = []; pubsMap[p.data].push(p); } });
    const hoje = isoDate(new Date());

    cal.innerHTML = `
      <table style="width:100%;border-collapse:collapse;table-layout:fixed">
        <thead><tr>
          ${DIAS.map(d => `<th style="padding:6px 4px;text-align:center;font-size:13px;color:#666;border-bottom:2px solid #ddd">${d}</th>`).join('')}
        </tr></thead>
        <tbody>
          ${semanas.map(semana => `<tr>${semana.map(d => {
            const iso = isoDate(d);
            const mesAtual = d.getMonth() === estado.mes;
            const ehHoje   = iso === hoje;
            const pubs     = pubsMap[iso] || [];
            return `<td style="vertical-align:top;padding:4px;border:1px solid #eee;min-height:80px;background:${ehHoje?'#f0f7f4':mesAtual?'#fff':'#f9f9f7'};cursor:pointer" data-data="${iso}">
              <div style="font-size:12px;font-weight:${ehHoje?'bold':'normal'};color:${mesAtual?'#333':'#bbb'};margin-bottom:4px">${d.getDate()}</div>
              ${pubs.slice(0,3).map(p => `
                <div class="ag-pub-chip" data-id="${esc(p.id)}" title="${esc(p.titulo || p.texto.slice(0,60))}"
                  style="background:${CANAIS[p.canal]?.cor||'#999'};color:#fff;border-radius:3px;padding:2px 5px;font-size:11px;margin-bottom:2px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:${p.status==='publicado'?'.6':'1'}">
                  ${CANAIS[p.canal]?.icone||''} ${esc(p.titulo || p.texto.slice(0, 25))}
                </div>`).join('')}
              ${pubs.length > 3 ? `<div style="font-size:11px;color:#888">+${pubs.length-3} mais</div>` : ''}
            </td>`;
          }).join('')}</tr>`).join('')}
        </tbody>
      </table>`;

    // Clique em dia vazio → nova publicação naquele dia
    cal.querySelectorAll('td[data-data]').forEach(td => {
      td.addEventListener('click', e => {
        if (e.target.closest('.ag-pub-chip')) return;
        renderForm(null, td.dataset.data);
      });
    });
    // Clique em chip → editar
    cal.querySelectorAll('.ag-pub-chip').forEach(chip => {
      chip.addEventListener('click', e => {
        e.stopPropagation();
        const p = lerPublicacoes().find(x => x.id === chip.dataset.id);
        if (p) renderForm(p);
      });
    });
  }

  /* ── Vista: Semana ───────────────────────────────────────────────────────── */
  function renderSemana() {
    // Encontra o domingo da semana atual dentro do mês/ano
    const ref = new Date(estado.ano, estado.mes, 1);
    const domingo = new Date(ref);
    domingo.setDate(ref.getDate() - ref.getDay());
    // Semanas da vista: usar a semana que contém o 1º do mês
    const dias = Array.from({length:7}, (_, i) => { const d = new Date(domingo); d.setDate(domingo.getDate()+i); return d; });
    const pubsMap = {};
    pubsFiltradas().forEach(p => { if (p.data) { if (!pubsMap[p.data]) pubsMap[p.data] = []; pubsMap[p.data].push(p); } });
    const hoje = isoDate(new Date());

    cal.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">
        ${dias.map(d => {
          const iso = isoDate(d);
          const pubs = pubsMap[iso] || [];
          return `<div style="border:1px solid #ddd;border-radius:6px;padding:8px;min-height:120px;background:${iso===hoje?'#f0f7f4':'#fff'}">
            <div style="font-weight:bold;font-size:13px;margin-bottom:6px;text-align:center">
              ${DIAS[d.getDay()]}<br><span style="font-size:18px">${d.getDate()}</span>
            </div>
            ${pubs.map(p => `
              <div class="ag-pub-chip" data-id="${esc(p.id)}" title="${esc(p.titulo || p.texto.slice(0,60))}"
                style="background:${CANAIS[p.canal]?.cor||'#999'};color:#fff;border-radius:4px;padding:4px 6px;font-size:12px;margin-bottom:4px;cursor:pointer;opacity:${p.status==='publicado'?'.6':'1'}">
                ${CANAIS[p.canal]?.icone||''} ${esc(p.horario||'')} ${esc(p.titulo || p.texto.slice(0,30))}
              </div>`).join('')}
            <button class="ag-add-dia pr-btn pr-btn-sm" data-data="${iso}" style="width:100%;margin-top:4px;font-size:11px;padding:3px">+</button>
          </div>`;
        }).join('')}
      </div>`;

    cal.querySelectorAll('.ag-pub-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const p = lerPublicacoes().find(x => x.id === chip.dataset.id);
        if (p) renderForm(p);
      });
    });
    cal.querySelectorAll('.ag-add-dia').forEach(btn => {
      btn.addEventListener('click', () => renderForm(null, btn.dataset.data));
    });
  }

  /* ── Vista: Lista ────────────────────────────────────────────────────────── */
  function renderLista() {
    const pubs = pubsFiltradas().sort((a,b) => (a.data+a.horario).localeCompare(b.data+b.horario));
    if (!pubs.length) {
      cal.innerHTML = '<p style="color:#888;text-align:center;padding:32px">Nenhuma publicação encontrada.</p>';
      return;
    }
    cal.innerHTML = `
      <p style="font-size:13px;color:#666;margin:0 0 8px">${pubs.length} publicação${pubs.length!==1?'ões':''}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead><tr style="background:#f5f5f0;text-align:left">
          <th style="padding:8px 10px">Data</th>
          <th style="padding:8px 10px">Canal</th>
          <th style="padding:8px 10px">Título</th>
          <th style="padding:8px 10px">Responsável</th>
          <th style="padding:8px 10px">Status</th>
          <th style="padding:8px 10px"></th>
        </tr></thead>
        <tbody>
          ${pubs.map(p => `
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 10px;white-space:nowrap">${p.data ? p.data.split('-').reverse().join('/') : '—'} ${p.horario||''}</td>
              <td style="padding:8px 10px">
                <span style="background:${CANAIS[p.canal]?.cor||'#999'};color:#fff;border-radius:4px;padding:2px 7px;font-size:12px">
                  ${CANAIS[p.canal]?.icone||''} ${CANAIS[p.canal]?.label||p.canal}
                </span>
              </td>
              <td style="padding:8px 10px">${esc(p.titulo || p.texto.slice(0,50))}</td>
              <td style="padding:8px 10px">${esc(p.responsavel||'—')}</td>
              <td style="padding:8px 10px">
                <span style="color:${STATUS[p.status]?.cor||'#999'};font-weight:bold">${STATUS[p.status]?.label||p.status}</span>
              </td>
              <td style="padding:8px 10px;white-space:nowrap">
                <button class="pr-btn pr-btn-sm ag-editar" data-id="${esc(p.id)}">Editar</button>
                <button class="pr-btn pr-btn-sm pr-btn-perigo ag-remover" data-id="${esc(p.id)}">Remover</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    cal.querySelectorAll('.ag-editar').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = lerPublicacoes().find(x => x.id === btn.dataset.id);
        if (p) renderForm(p);
      });
    });
    cal.querySelectorAll('.ag-remover').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Remover esta publicação da agenda?')) return;
        const r = removerPublicacao(btn.dataset.id);
        msg(r.ok ? 'Publicação removida.' : r.erro, r.ok ? 'ok' : 'erro');
        renderCalendario();
      });
    });
  }

  /* ── Renderiza calendário conforme vista ─────────────────────────────────── */
  function renderCalendario() {
    const titulo = document.getElementById('ag-titulo-periodo');
    titulo.textContent = MESES[estado.mes] + ' ' + estado.ano;
    if (estado.vista === 'mes')    renderMes();
    else if (estado.vista === 'semana') renderSemana();
    else renderLista();
  }

  /* ── Formulário de publicação ────────────────────────────────────────────── */
  function renderForm(pub, dataPreenchida) {
    const p = pub || {};
    const novo = !pub;
    // Monta lista de campanhas disponíveis
    const campanhas = H.db ? (H.db.get('com_campanhas') || H.db.get('campanhas') || []) : [];

    formCont.innerHTML = `
      <div class="pr-modal-fundo" style="position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:200;display:flex;align-items:center;justify-content:center">
        <div class="pr-modal" style="background:#fff;border-radius:8px;padding:24px;width:min(560px,96vw);max-height:90vh;overflow-y:auto">
          <h3 style="margin:0 0 16px">${novo ? 'Nova publicação' : 'Editar publicação'}</h3>

          <label class="pr-label">Título interno (só a equipe vê) *</label>
          <input class="pr-input" id="ag-f-titulo" value="${esc(p.titulo||'')}" placeholder="Ex.: Salve a data — Festival de Verão" style="width:100%;margin-bottom:12px">

          <label class="pr-label">Texto pronto (para copiar e publicar) *</label>
          <textarea class="pr-input" id="ag-f-texto" rows="4" placeholder="O texto que vai ser publicado" style="width:100%;margin-bottom:12px">${esc(p.texto||'')}</textarea>

          <label class="pr-label">Link da arte ou imagem</label>
          <input class="pr-input" id="ag-f-arte" value="${esc(p.arte||'')}" placeholder="https://... ou deixe em branco" style="width:100%;margin-bottom:12px">

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label class="pr-label">Canal *</label>
              <select class="pr-select" id="ag-f-canal" style="width:100%">
                ${Object.entries(CANAIS).map(([k,v]) => `<option value="${k}" ${(p.canal||'instagram')===k?'selected':''}>${v.icone} ${v.label}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="pr-label">Status</label>
              <select class="pr-select" id="ag-f-status" style="width:100%">
                ${Object.entries(STATUS).map(([k,v]) => `<option value="${k}" ${(p.status||'rascunho')===k?'selected':''}>${v.label}</option>`).join('')}
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label class="pr-label">Data</label>
              <input class="pr-input" type="date" id="ag-f-data" value="${esc(p.data || dataPreenchida || '')}" style="width:100%">
            </div>
            <div>
              <label class="pr-label">Horário</label>
              <input class="pr-input" type="time" id="ag-f-horario" value="${esc(p.horario||'')}" style="width:100%">
            </div>
          </div>

          <label class="pr-label">Responsável</label>
          <input class="pr-input" id="ag-f-resp" value="${esc(p.responsavel||'')}" placeholder="Quem vai publicar" style="width:100%;margin-bottom:12px">

          <label class="pr-label">Campanha vinculada</label>
          <select class="pr-select" id="ag-f-campanha" style="width:100%;margin-bottom:16px">
            <option value="">— Nenhuma —</option>
            ${campanhas.map(c => `<option value="${esc(c.id||c.titulo)}" ${p.campanha===(c.id||c.titulo)?'selected':''}>${esc(c.titulo||c.nome||c.id)}</option>`).join('')}
          </select>

          <div id="ag-f-erro" style="color:#c00;font-size:13px;min-height:18px;margin-bottom:8px"></div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="pr-btn pr-btn-secundario" id="ag-f-cancelar">Cancelar</button>
            ${!novo && p.status !== 'publicado' ? `<button class="pr-btn" id="ag-f-marcar-publicado" style="background:#2d6a4f">✓ Marcar como publicado</button>` : ''}
            ${p.canal && (p.canal.startsWith('whatsapp')) ? `<button class="pr-btn pr-btn-secundario" id="ag-f-abrir-wapp">Abrir WhatsApp</button>` : ''}
            <button class="pr-btn" id="ag-f-salvar">${novo ? 'Adicionar' : 'Salvar'}</button>
          </div>
        </div>
      </div>`;

    document.getElementById('ag-f-cancelar').addEventListener('click', () => { formCont.innerHTML = ''; });

    // Abrir WhatsApp com texto pronto
    const btnWapp = document.getElementById('ag-f-abrir-wapp');
    if (btnWapp) {
      btnWapp.addEventListener('click', () => {
        const texto = document.getElementById('ag-f-texto').value;
        window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
      });
    }

    // Marcar como publicado rapidamente
    const btnPub = document.getElementById('ag-f-marcar-publicado');
    if (btnPub) {
      btnPub.addEventListener('click', () => {
        const r = atualizarPublicacao(p.id, { status: 'publicado' });
        msg(r.ok ? 'Marcada como publicada.' : r.erro, r.ok ? 'ok' : 'erro');
        formCont.innerHTML = '';
        renderCalendario();
      });
    }

    document.getElementById('ag-f-salvar').addEventListener('click', () => {
      const titulo = document.getElementById('ag-f-titulo').value.trim();
      const texto  = document.getElementById('ag-f-texto').value.trim();
      const erroDiv = document.getElementById('ag-f-erro');
      if (!titulo) { erroDiv.textContent = 'Informe o título interno.'; return; }
      if (!texto)  { erroDiv.textContent = 'Escreva o texto da publicação.'; return; }

      const payload = {
        titulo,
        texto,
        arte:        document.getElementById('ag-f-arte').value.trim(),
        canal:       document.getElementById('ag-f-canal').value,
        status:      document.getElementById('ag-f-status').value,
        data:        document.getElementById('ag-f-data').value,
        horario:     document.getElementById('ag-f-horario').value,
        responsavel: document.getElementById('ag-f-resp').value.trim(),
        campanha:    document.getElementById('ag-f-campanha').value
      };

      const r = novo ? criarPublicacao(payload) : atualizarPublicacao(p.id, payload);
      if (!r.ok) { erroDiv.textContent = r.erro; return; }
      formCont.innerHTML = '';
      msg(novo ? 'Publicação adicionada.' : 'Publicação atualizada.', 'ok');
      renderCalendario();
    });
  }

  /* ── Importar pacote ─────────────────────────────────────────────────────── */
  function renderImportar() {
    impCont.innerHTML = `
      <div class="pr-modal-fundo" style="position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:200;display:flex;align-items:center;justify-content:center">
        <div style="background:#fff;border-radius:8px;padding:24px;width:min(500px,96vw)">
          <h4 style="margin:0 0 12px">Importar pacote do Claude</h4>
          <p style="font-size:13px;color:#555;margin:0 0 12px">
            Cole abaixo o JSON gerado pelo Claude a partir do briefing da campanha.
            O sistema vai criar os rascunhos automaticamente na agenda.
          </p>
          <textarea id="ag-imp-json" rows="8" class="pr-input" style="width:100%;font-size:12px;font-family:monospace" placeholder='{ "publicacoes": [ ... ] }'></textarea>
          <div id="ag-imp-erro" style="color:#c00;font-size:13px;min-height:18px;margin:6px 0"></div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
            <button class="pr-btn pr-btn-secundario" id="ag-imp-cancelar">Cancelar</button>
            <button class="pr-btn" id="ag-imp-ok">Importar</button>
          </div>
        </div>
      </div>`;

    document.getElementById('ag-imp-cancelar').addEventListener('click', () => { impCont.innerHTML = ''; });
    document.getElementById('ag-imp-ok').addEventListener('click', () => {
      const json = document.getElementById('ag-imp-json').value.trim();
      const r = importarPacote(json);
      if (!r.ok) { document.getElementById('ag-imp-erro').textContent = r.erro; return; }
      impCont.innerHTML = '';
      msg(`${r.criados} publicação${r.criados!==1?'ões':''} adicionada${r.criados!==1?'s':''} como rascunho.`, 'ok');
      renderCalendario();
    });
  }

  /* ── Eventos da toolbar ──────────────────────────────────────────────────── */
  document.getElementById('ag-prev').addEventListener('click', () => {
    estado.mes--;
    if (estado.mes < 0) { estado.mes = 11; estado.ano--; }
    renderCalendario();
  });
  document.getElementById('ag-next').addEventListener('click', () => {
    estado.mes++;
    if (estado.mes > 11) { estado.mes = 0; estado.ano++; }
    renderCalendario();
  });
  document.getElementById('ag-hoje').addEventListener('click', () => {
    estado.ano = new Date().getFullYear();
    estado.mes = new Date().getMonth();
    renderCalendario();
  });
  document.getElementById('ag-vista').addEventListener('change', e => {
    estado.vista = e.target.value; renderCalendario();
  });
  document.getElementById('ag-canal').addEventListener('change', e => {
    estado.filtroCanal = e.target.value; renderCalendario();
  });
  document.getElementById('ag-status').addEventListener('change', e => {
    estado.filtroStatus = e.target.value; renderCalendario();
  });
  document.getElementById('ag-nova').addEventListener('click', () => renderForm(null));
  document.getElementById('ag-exportar').addEventListener('click', () => exportarCSV(pubsFiltradas()));
  document.getElementById('ag-importar').addEventListener('click', renderImportar);

  renderCalendario();
}

/* ── Inicialização ───────────────────────────────────────────────────────── */
function iniciar(db) { H.db = db; }

/* ── API pública ──────────────────────────────────────────────────────────── */
window.PR_AGENDA = {
  iniciar,
  renderPainel,
  criarPublicacao,
  atualizarPublicacao,
  removerPublicacao,
  importarPacote,
  exportarCSV: lista => exportarCSV(lista || lerPublicacoes()),
  lerPublicacoes
};

})();
