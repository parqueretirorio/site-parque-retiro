// Camada de dados da área restrita (carregada ANTES dos módulos).
// Mantém a mesma interface usada pelo site (get/set), mas acrescenta:
//  - auditoria (quem alterou o quê e quando) em pr_audit;
//  - lixeira (registros removidos ficam recuperáveis) em pr_lixeira;
//  - backup completo (JSON com verificação SHA-256) e restauração com pré-visualização;
//  - proteção: restaurar NUNCA acontece sem antes baixar um backup do estado atual.
// Hoje o armazenamento é o navegador (localStorage). Para o modo servidor, veja docs/ e supabase/.
(function () {
const PREFIXO = 'pr_';
const ESQUEMA = 1;                       // versão do formato de dados
const SEM_AUDITORIA = new Set(['audit', 'lixeira', 'meta', 'seed3']);
const LIM_AUDIT = 2000, LIM_LIXEIRA = 300;

const armazenamentoLocal = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignora */ } },
  keys() { try { return Object.keys(localStorage); } catch (e) { return []; } }
};
// Armazenamento escolhido em config-dados.js. Local (padrão) = navegador. Remoto = servidor pelo contrato de docs/API_CONTRATO.md.
// Qualquer outro provedor entra aqui sem tocar nas telas: basta cumprir a interface get/set/del/keys.
const CFG = window.PR_CONFIG_DADOS || { modo: 'local' };
let ls = armazenamentoLocal, modo = CFG.modo || 'local';
const SB = window.PR_SUPABASE;
if (SB && SB.ligado() && SB.paginaRestrita()) { ls = SB.criarArmazenamento(); modo = 'supabase'; }   // Fase 1: login e dados no Supabase
else if (modo === 'supabase') modo = 'local';  // páginas públicas continuam no navegador
else if (CFG.modo === 'remoto') {
  if (!window.PR_ADAPTADOR_REMOTO) throw new Error('Modo remoto ligado, mas adaptador-remoto.js não foi carregado. Não vou gravar em silêncio no navegador.');
  ls = window.PR_ADAPTADOR_REMOTO.criar(CFG);
}
// Promessa que as telas devem aguardar antes de ler dados (no modo local já nasce resolvida).
const pronto = Promise.resolve(ls.iniciar ? ls.iniciar() : undefined);
const lerJson = (k, d) => { const v = ls.get(PREFIXO + k); if (v == null) return d; try { return JSON.parse(v); } catch (e) { return d; } };
const agora = () => new Date().toISOString();
const quem = () => { try { return sessionStorage.getItem('pr_sess') || (sessionStorage.getItem('pr_temp') === '1' ? 'acesso-temporario' : 'anonimo'); } catch (e) { return 'anonimo'; } };
const ehLista = v => Array.isArray(v);
const idDe = r => (r && typeof r === 'object') ? (r.id || r.codigo || r.email || null) : null;

function gravaBruto(k, v) { return ls.set(PREFIXO + k, JSON.stringify(v)); }

function registraAuditoria(k, antes, depois) {
  if (SEM_AUDITORIA.has(k)) return;
  let resumo;
  if (ehLista(antes) || ehLista(depois)) {
    const a = ehLista(antes) ? antes : [], d = ehLista(depois) ? depois : [];
    const ia = new Map(a.map((r, i) => [idDe(r) || 'i' + i, JSON.stringify(r)]));
    const id = new Map(d.map((r, i) => [idDe(r) || 'i' + i, JSON.stringify(r)]));
    let novos = 0, alt = 0, rem = 0;
    id.forEach((v, key) => { if (!ia.has(key)) novos++; else if (ia.get(key) !== v) alt++; });
    ia.forEach((v, key) => { if (!id.has(key)) rem++; });
    if (!novos && !alt && !rem) return;
    resumo = { novos, alterados: alt, removidos: rem, total: d.length };
  } else {
    if (JSON.stringify(antes) === JSON.stringify(depois)) return;
    resumo = { alterado: true };
  }
  const log = lerJson('audit', []);
  log.push({ t: agora(), por: quem(), colecao: k, ...resumo });
  gravaBruto('audit', log.slice(-LIM_AUDIT));
}

function guardaLixeira(k, antes, depois) {
  if (SEM_AUDITORIA.has(k) || !ehLista(antes) || !ehLista(depois)) return;
  const manter = new Set(depois.map(idDe).filter(Boolean));
  const removidos = antes.filter(r => { const i = idDe(r); return i && !manter.has(i); });
  if (!removidos.length) return;
  const lx = lerJson('lixeira', []);
  removidos.forEach(r => lx.push({ t: agora(), por: quem(), colecao: k, registro: r }));
  // a lixeira guarda só metadados pesados (fotos) de forma reduzida para não estourar a cota
  const leve = lx.slice(-LIM_LIXEIRA).map(x => {
    const r = { ...x.registro };
    ['foto', 'capa', 'arquivo'].forEach(c => { if (typeof r[c] === 'string' && r[c].length > 20000) r[c] = '[arquivo omitido da lixeira]'; });
    return { ...x, registro: r };
  });
  gravaBruto('lixeira', leve);
}

const db = {
  get(k, d) { return lerJson(k, d); },
  set(k, v) {
    let antes;
    if (!SEM_AUDITORIA.has(k)) { antes = lerJson(k, undefined); }
    const ok = gravaBruto(k, v);
    if (ok && !SEM_AUDITORIA.has(k)) {
      try { registraAuditoria(k, antes === undefined ? [] : antes, v); guardaLixeira(k, antes, v); } catch (e) { /* auditoria nunca pode impedir a gravação */ }
    }
    return ok;
  }
};

/* ---------- Hash (SHA-256 hex) ---------- */
async function sha256(txt) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

/* ---------- Backup ---------- */
function coletar() {
  const dados = {};
  ls.keys().filter(k => k.startsWith(PREFIXO)).sort().forEach(k => {
    const v = ls.get(k); try { dados[k.slice(PREFIXO.length)] = JSON.parse(v); } catch (e) { dados[k.slice(PREFIXO.length)] = { __texto: v }; }
  });
  return dados;
}
const contar = d => { const o = {}; Object.keys(d).forEach(k => { o[k] = ehLista(d[k]) ? d[k].length : 1; }); return o; };

async function montarBackup() {
  const dados = coletar();
  delete dados.meta;
  const corpo = JSON.stringify(dados);
  return { formato: 'parque-retiro-backup', esquema: ESQUEMA, criadoEm: agora(), criadoPor: quem(), contagem: contar(dados), sha256: await sha256(corpo), dados };
}
async function baixarBackup(prefixoNome) {
  const b = await montarBackup();
  const nome = `${prefixoNome || 'backup-parque-retiro'}-${b.criadoEm.slice(0, 19).replace(/[:T]/g, '-')}.json`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(b)], { type: 'application/json' }));
  a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  const m = lerJson('meta', {}); m.ultimoBackup = b.criadoEm; gravaBruto('meta', m);
  return { nome, backup: b };
}

// Valida um arquivo de backup SEM gravar nada. Devolve { ok, erros, resumo }.
async function validarBackup(obj) {
  const erros = [];
  if (!obj || typeof obj !== 'object') return { ok: false, erros: ['Arquivo não é um backup válido.'] };
  if (obj.formato !== 'parque-retiro-backup') erros.push('Formato desconhecido (não é um backup do Parque Retiro).');
  if (!(obj.esquema <= ESQUEMA)) erros.push('Backup de uma versão mais nova do sistema. Atualize o site antes de restaurar.');
  if (!obj.dados || typeof obj.dados !== 'object') erros.push('Backup sem dados.');
  else if (obj.sha256 !== await sha256(JSON.stringify(obj.dados))) erros.push('Verificação de integridade falhou: o arquivo foi alterado ou está corrompido.');
  if (erros.length) return { ok: false, erros };
  const atual = contar(coletar()), novo = contar(obj.dados), chaves = [...new Set(Object.keys(atual).concat(Object.keys(novo)))].sort();
  const resumo = chaves.map(k => ({ colecao: k, atual: atual[k] || 0, backup: novo[k] || 0 }));
  return { ok: true, erros: [], resumo };
}

// Restaura. Exige que o backup do estado atual já tenha sido baixado (flag), e valida de novo.
async function restaurarBackup(obj, { backupAtualBaixado } = {}) {
  if (!backupAtualBaixado) throw new Error('Baixe o backup do estado atual antes de restaurar.');
  const v = await validarBackup(obj);
  if (!v.ok) throw new Error(v.erros.join(' '));
  // grava tudo; se algo falhar no meio, desfaz para o estado anterior
  const anterior = coletar();
  const chavesAtuais = Object.keys(anterior).filter(k => k !== 'meta');
  try {
    const pula = k => modo === 'supabase' && k === 'users'; // no servidor, as pessoas são os perfis do login (não vêm do backup)
    chavesAtuais.forEach(k => { if (!(k in obj.dados) && !pula(k)) ls.del(PREFIXO + k); });
    Object.keys(obj.dados).filter(k => !pula(k)).forEach(k => {
      const val = obj.dados[k];
      const bruto = (val && typeof val === 'object' && '__texto' in val) ? val.__texto : JSON.stringify(val);
      if (!ls.set(PREFIXO + k, bruto)) throw new Error('Sem espaço no navegador para restaurar "' + k + '".');
    });
  } catch (e) {
    Object.keys(anterior).forEach(k => { const val = anterior[k]; ls.set(PREFIXO + k, (val && typeof val === 'object' && '__texto' in val) ? val.__texto : JSON.stringify(val)); });
    throw e;
  }
  const log = lerJson('audit', []); log.push({ t: agora(), por: quem(), colecao: '*', restauradoDe: obj.criadoEm, resumo: v.resumo.length + ' coleções' });
  gravaBruto('audit', log.slice(-LIM_AUDIT));
  return v;
}

/* ---------- Estado de saúde ---------- */
function uso() {
  let bytes = 0; ls.keys().filter(k => k.startsWith(PREFIXO)).forEach(k => { bytes += (ls.get(k) || '').length * 2; });
  return { bytes, limiteAprox: 5 * 1024 * 1024 };
}
function diasDesdeBackup() {
  const m = lerJson('meta', {}); if (!m.ultimoBackup) return null;
  return Math.floor((Date.now() - new Date(m.ultimoBackup).getTime()) / 86400000);
}

window.PR_DADOS = { db, pronto, modo, sincronizar: () => (ls.sincronizar ? ls.sincronizar() : Promise.resolve()), estadoSync: () => (ls.estado ? ls.estado() : { estado: 'local', pendentes: 0, conflitos: 0 }), conflitos: () => (ls.conflitos ? ls.conflitos() : []), resolverConflito: (n, e) => (ls.resolverConflito ? ls.resolverConflito(n, e) : Promise.resolve()), ESQUEMA, montarBackup, baixarBackup, validarBackup, restaurarBackup, uso, diasDesdeBackup, auditoria: () => lerJson('audit', []), lixeira: () => lerJson('lixeira', []), sha256, coletar };
})();
