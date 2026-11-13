// Site aberto ligado ao servidor do Parque (sem login): lê as VITRINES e manda os ENVIOS (ver publico.js e a
// migração supabase/migrations/0011_paginas_publicas.sql). Usado por dados.js nas páginas abertas.
//  - Leitura: na abertura da página, busca só as vitrines que ela usa (chamada rápida, só leitura).
//  - Gravação: o que a pessoa envia (cadastro no Comunicado, voluntário, fotos) vai para a caixa de entrada do
//    servidor. Sem internet, fica guardado neste aparelho e é reenviado na próxima visita.
// Só usa a chave PÚBLICA (publishable). Ninguém de fora consegue ler a caixa de entrada nem as coleções da equipe.
(function () {
const MODO = 'pr-modo', PREF = 'pr_', FILA = 'pr-envios-fila';
const conf = () => (window.PR_CONFIG_DADOS && window.PR_CONFIG_DADOS.supabase) || {};
const base = () => String(conf().url || '').replace(/\/+$/, '');
function ligado() {
  const c = window.PR_CONFIG_DADOS || {}; let o = null;
  try { const q = new URLSearchParams(location.search).get('servidor'); if (q === '1') localStorage.setItem(MODO, 'supabase'); if (q === '0') localStorage.setItem(MODO, 'local'); o = localStorage.getItem(MODO); } catch (e) { /* ignora */ }
  if (!base() || !conf().chavePublica || !window.PR_PUBLICO) return false;
  if (o === 'local') return false;
  if (o === 'supabase') return true;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:') return false;
  return c.modo === 'supabase';
}
const cab = () => ({ 'Content-Type': 'application/json', Accept: 'application/json', apikey: conf().chavePublica });
const lerFila = () => { try { return JSON.parse(localStorage.getItem(FILA) || '[]'); } catch (e) { return []; } };
const gravaFila = l => { try { localStorage.setItem(FILA, JSON.stringify(l.slice(-50))); } catch (e) { /* aparelho cheio: segue sem fila */ } };

async function enviar(caixa, dados) {
  try {
    const r = await fetch(base() + '/rest/v1/rpc/pr_enviar_publico', { method: 'POST', headers: cab(), body: JSON.stringify({ p_caixa: caixa, p_dados: dados }) });
    if (r.ok) return true;
    if (r.status >= 400 && r.status < 500 && ![404, 408, 429].includes(r.status)) return true; // recusado pelo servidor (inválido/grande): não adianta repetir
    // 404 = caixa de entrada ainda não instalada no servidor: guarda e reenvia depois
  } catch (e) { /* sem internet */ }
  const f = lerFila(); f.push({ caixa, dados }); gravaFila(f); return false;
}
async function reenviarFila() {
  const f = lerFila(); if (!f.length) return; gravaFila([]);
  for (const x of f) await enviar(x.caixa, x.dados);
}

function criar() {
  const P = window.PR_PUBLICO, pagina = (document.body && document.body.dataset.page) || '';
  const nomes = P.PAGINAS[pagina] || [], servidor = new Map(), st = { estado: 'ok' };
  if (nomes.length) {
    try {
      const x = new XMLHttpRequest();
      x.open('POST', base() + '/rest/v1/rpc/pr_ler_publico', false);
      Object.entries(cab()).forEach(([k, v]) => x.setRequestHeader(k, v));
      x.send(JSON.stringify({ p_nomes: nomes.map(n => 'pub_' + n) }));
      if (x.status === 200) { const c = JSON.parse(x.responseText || '{}'); nomes.forEach(n => { if (c['pub_' + n] !== undefined) servidor.set(n, JSON.stringify(c['pub_' + n])); }); }
      else st.estado = 'offline';
    } catch (e) { st.estado = 'offline'; }
  }
  setTimeout(() => { reenviarFila(); }, 1500);
  const nome = k => k.slice(PREF.length);
  const local = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } } };
  const ids = v => { try { const l = JSON.parse(v || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } };
  return {
    get(k) { const n = nome(k); return servidor.has(n) ? servidor.get(n) : local.get(k); },
    set(k, v) {
      const n = nome(k), caixa = k.startsWith(PREF) && P.CAIXAS[n];
      if (caixa) {
        // manda ao servidor só o que é novo ou mudou desde a última leitura
        const antes = new Map(ids(this.get(k)).map(x => [x && (x.id || x.email), JSON.stringify(x)]));
        ids(v).forEach(x => { if (!x || typeof x !== 'object') return; const ch = x.id || x.email; if (antes.get(ch) !== JSON.stringify(x)) enviar(n, x); });
      }
      if (servidor.has(n)) { servidor.set(n, v); return true; } // vitrine: fica só na memória desta página (não enche o aparelho)
      return local.set(k, v);
    },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignora */ } },
    keys() { const s = new Set([...servidor.keys()].map(n => PREF + n)); try { for (let i = 0; i < localStorage.length; i++) s.add(localStorage.key(i)); } catch (e) { /* ignora */ } return [...s]; },
    estado: () => Object.assign({ pendentes: lerFila().length, conflitos: 0 }, st)
  };
}
window.PR_VITRINE = { ligado, criar, enviar, reenviarFila };
})();
