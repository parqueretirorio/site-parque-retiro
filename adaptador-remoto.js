// Adaptador de armazenamento REMOTO, neutro quanto ao provedor.
// Expõe a MESMA interface síncrona do armazenamento local usada por dados.js: get / set / del / keys.
// Por baixo: cache em memória + fila de gravação em segundo plano falando o contrato REST de docs/API_CONTRATO.md.
// Qualquer servidor que cumpra o contrato (PHP+MySQL, Supabase via função, Node...) serve; as telas não mudam.
// Conflito: cada coleção tem uma "versão". Gravar com versão velha é RECUSADO (409) e nunca sobrescreve em silêncio.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PR_ADAPTADOR_REMOTO = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const PREF = 'pr_';
  const LOCAIS = new Set(['meta']);                 // nunca vão ao servidor (ex.: data do último backup deste computador)
  const MESCLA_LISTA = new Set(['audit', 'lixeira']); // listas só-acréscimo: no conflito, une em vez de recusar

  function criar(cfg, amb) {
    amb = amb || {};
    const f = amb.fetch || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    if (!f) throw new Error('Sem fetch: o modo remoto precisa de um navegador moderno.');
    const base = String(cfg.url || '').replace(/\/+$/, '');
    if (!base) throw new Error('Modo remoto sem URL em config-dados.js.');
    const atraso = cfg.atrasoMs == null ? 800 : cfg.atrasoMs;
    const cache = new Map();      // 'pr_x' -> texto JSON (igual ao localStorage)
    const versoes = new Map();    // 'x' -> versão conhecida no servidor
    const sujos = new Set();      // coleções com gravação pendente
    const apagar = new Set();     // coleções com remoção pendente
    const conflitos = new Map();  // 'x' -> { meu, servidor, versaoServidor }
    const st = { estado: 'novo', erro: null, ultimaSync: null };
    let timer = null, voando = null;

    const nome = k => k.slice(PREF.length);
    const sincronizavel = k => k.startsWith(PREF) && !LOCAIS.has(nome(k));
    const avisa = () => { try { cfg.aoMudar && cfg.aoMudar(estado()); } catch (e) { /* ignora */ } };
    const cab = () => {
      const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      const t = typeof cfg.token === 'function' ? cfg.token() : cfg.token;
      if (t) h.Authorization = 'Bearer ' + t;
      return h;
    };
    async function http(metodo, caminho, corpo) {
      const r = await f(base + caminho, { method: metodo, headers: cab(), body: corpo === undefined ? undefined : JSON.stringify(corpo), credentials: cfg.credenciais || 'same-origin' });
      let j = null; try { j = await r.json(); } catch (e) { /* corpo vazio */ }
      return { status: r.status, corpo: j };
    }

    // Carrega tudo do servidor para a memória. Chamar uma vez; o site deve esperar por isso antes de desenhar telas.
    async function iniciar() {
      st.estado = 'carregando'; avisa();
      const r = await http('GET', '/colecoes');
      if (r.status === 401 || r.status === 403) { st.estado = 'sem-permissao'; st.erro = 'Sem permissão (faça login).'; avisa(); throw new Error(st.erro); }
      if (r.status !== 200 || !r.corpo || typeof r.corpo.colecoes !== 'object') { st.estado = 'erro'; st.erro = 'Resposta inesperada do servidor (' + r.status + ').'; avisa(); throw new Error(st.erro); }
      Object.keys(r.corpo.colecoes).forEach(n => {
        const c = r.corpo.colecoes[n];
        cache.set(PREF + n, JSON.stringify(c.dados));
        versoes.set(n, c.versao | 0);
      });
      st.estado = 'ok'; st.ultimaSync = new Date().toISOString(); st.erro = null; avisa();
    }

    function agenda() { if (timer) clearTimeout(timer); timer = setTimeout(() => { timer = null; sincronizar().catch(() => { /* fica pendente */ }); }, atraso); }

    const adaptador = {
      // --- mesma interface do localStorage usado por dados.js ---
      get(k) { return cache.has(k) ? cache.get(k) : null; },
      set(k, v) {
        cache.set(k, v);
        if (sincronizavel(k)) { sujos.add(nome(k)); apagar.delete(nome(k)); agenda(); avisa(); }
        return true;
      },
      del(k) {
        cache.delete(k);
        if (sincronizavel(k)) { apagar.add(nome(k)); sujos.delete(nome(k)); agenda(); avisa(); }
      },
      keys() { return [...cache.keys()]; },
      // --- específico do remoto ---
      iniciar,
      sincronizar,
      estado,
      conflitos: () => [...conflitos.entries()].map(([n, c]) => ({ colecao: n, ...c })),
      resolverConflito
    };

    function estado() {
      return { ...st, pendentes: sujos.size + apagar.size, conflitos: conflitos.size };
    }

    async function enviaUma(n) {
      const texto = cache.get(PREF + n);
      let dados; try { dados = JSON.parse(texto); } catch (e) { dados = { __texto: texto }; }
      const r = await http('PUT', '/colecoes/' + encodeURIComponent(n), { versao_base: versoes.get(n) | 0, dados });
      if (r.status === 200 && r.corpo) { versoes.set(n, r.corpo.versao | 0); if (cache.get(PREF + n) === texto) sujos.delete(n); return; } // se mudou durante o envio, continua pendente
      if (r.status === 409 && r.corpo) {
        const servidor = r.corpo.dados, vs = r.corpo.versao_atual | 0;
        if (MESCLA_LISTA.has(n) && Array.isArray(servidor) && Array.isArray(dados)) {
          const vistos = new Set(); const uniao = [];
          servidor.concat(dados).forEach(x => { const s = JSON.stringify(x); if (!vistos.has(s)) { vistos.add(s); uniao.push(x); } });
          uniao.sort((a, b) => String(a.t || '').localeCompare(String(b.t || '')));
          cache.set(PREF + n, JSON.stringify(uniao)); versoes.set(n, vs); return enviaUma(n); // tenta de novo já mesclado
        }
        conflitos.set(n, { meu: dados, servidor, versaoServidor: vs }); sujos.delete(n);
        try { cfg.aoConflito && cfg.aoConflito(n); } catch (e) { /* ignora */ }
        return;
      }
      if (r.status === 401 || r.status === 403) { st.estado = 'sem-permissao'; st.erro = 'Sem permissão para gravar "' + n + '".'; throw new Error(st.erro); }
      throw new Error('Servidor respondeu ' + r.status + ' ao gravar "' + n + '".');
    }
    async function removeUma(n) {
      const r = await http('DELETE', '/colecoes/' + encodeURIComponent(n), { versao_base: versoes.get(n) | 0 });
      if (r.status === 200 || r.status === 404) { apagar.delete(n); versoes.delete(n); return; }
      if (r.status === 409) { apagar.delete(n); conflitos.set(n, { meu: null, servidor: r.corpo && r.corpo.dados, versaoServidor: (r.corpo && r.corpo.versao_atual) | 0 }); return; }
      throw new Error('Servidor respondeu ' + r.status + ' ao remover "' + n + '".');
    }

    // Envia o que está pendente. Falha de rede NÃO perde nada: continua pendente e tenta de novo.
    function sincronizar() {
      if (voando) return voando;
      let terminou = false;
      const p = (async () => {
        try {
          // repete enquanto houver pendência: alterações feitas durante o envio também saem
          while (sujos.size || apagar.size) {
            for (const n of [...sujos]) await enviaUma(n);
            for (const n of [...apagar]) await removeUma(n);
          }
          st.estado = 'ok'; st.erro = null; st.ultimaSync = new Date().toISOString();
        } catch (e) {
          if (st.estado !== 'sem-permissao') st.estado = 'offline';
          st.erro = e.message || String(e);
          if (st.estado === 'offline' && (sujos.size || apagar.size)) { timer = setTimeout(() => { timer = null; sincronizar().catch(() => {}); }, Math.max(atraso, 5000)); }
          throw e;
        } finally { terminou = true; voando = null; avisa(); }
      })();
      if (!terminou) voando = p; // se não havia pendência, o corpo já terminou: não deixa promessa velha "em voo"
      return p;
    }

    // 'meu' = insiste na versão local (grava sobre a do servidor); 'servidor' = descarta a local.
    async function resolverConflito(n, escolha) {
      const c = conflitos.get(n); if (!c) return;
      if (escolha === 'servidor') { cache.set(PREF + n, JSON.stringify(c.servidor)); versoes.set(n, c.versaoServidor); conflitos.delete(n); avisa(); return; }
      versoes.set(n, c.versaoServidor); conflitos.delete(n); sujos.add(n); await sincronizar();
    }
    return adaptador;
  }
  return { criar };
});
