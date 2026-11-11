// CONecta Retiro — Fase 1: login real (Supabase Auth) e dados da área restrita no servidor (Supabase, São Paulo).
//
// Liga com modo: 'supabase' em config-dados.js. Para TESTAR sem afetar os outros, abra login.html?servidor=1
// (vale só para este navegador; login.html?servidor=0 volta ao modo do navegador).
//
// Como funciona:
//  - Só a área restrita e a página de login usam o servidor; as páginas públicas continuam como estão.
//  - Ao abrir a área restrita, tudo o que a pessoa pode ver é carregado de uma vez (chamada síncrona, para que
//    as telas existentes funcionem sem mudança). Cada gravação sai em segundo plano em ~0,8 s.
//  - Cada coleção tem versão: se outra pessoa gravou antes, NADA é sobrescrito; fica um conflito para escolher.
//  - 'users' (Gestão de Responsáveis) vem da tabela perfis: aprovar, mudar nível/funções e completar o cadastro
//    viram atualizações do perfil. Quem não é administrador só altera o próprio cadastro (regra do banco).
//  - Sem internet: o que foi gravado fica pendente e é reenviado. Ao fechar a página com pendência, o navegador avisa.
// Só usa a chave PÚBLICA (publishable). A proteção dos dados está no banco (RLS e funções da migração 0010).
(function () {
const SESSAO = 'pr-sb-sessao', MODO = 'pr-modo', PREF = 'pr_';
const LOCAIS = new Set(['meta']);
const MESCLA_LISTA = new Set(['audit', 'lixeira']);
const CAMPOS_PERFIL = ['nome', 'whatsapp', 'lgpd', 'nivel', 'status', 'funcoes'];

// ---------- chave de teste ?servidor=1 / ?servidor=0 ----------
try {
  const q = new URLSearchParams(location.search).get('servidor');
  if (q === '1') localStorage.setItem(MODO, 'supabase');
  if (q === '0') { localStorage.setItem(MODO, 'local'); localStorage.removeItem(SESSAO); }
} catch (e) { /* ignora */ }

const conf = () => (window.PR_CONFIG_DADOS && window.PR_CONFIG_DADOS.supabase) || {};
const base = () => String(conf().url || '').replace(/\/+$/, '');
function ligado() {
  const c = window.PR_CONFIG_DADOS || {}; let o = null;
  try { o = localStorage.getItem(MODO); } catch (e) { /* ignora */ }
  if (!base() || !conf().chavePublica) return false;
  if (o === 'local') return false;
  if (o === 'supabase') return true;
  // Testes no próprio computador (localhost) continuam no modo do navegador, a não ser com ?servidor=1.
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:') return false;
  return c.modo === 'supabase';
}
const paginaRestrita = () => { const p = document.body && document.body.dataset.page; return p === 'painel' || p === 'login' || p === 'app'; };

// ---------- sessão ----------
function sessao() { try { const s = JSON.parse(localStorage.getItem(SESSAO) || 'null'); return s && s.access_token ? s : null; } catch (e) { return null; } }
function guardaSessao(r) {
  const s = { access_token: r.access_token, refresh_token: r.refresh_token, expires_at: r.expires_at || Math.floor(Date.now() / 1000) + (r.expires_in || 3600), user: { id: r.user && r.user.id, email: String(r.user && r.user.email || '').toLowerCase() } };
  try { localStorage.setItem(SESSAO, JSON.stringify(s)); } catch (e) { /* ignora */ }
  return s;
}
function limpaSessao() { try { localStorage.removeItem(SESSAO); } catch (e) { /* ignora */ } }
const venceLogo = s => !s.expires_at || s.expires_at * 1000 - Date.now() < 90 * 1000;

// ---------- HTTP ----------
function cab(token) {
  const h = { 'Content-Type': 'application/json', 'Accept': 'application/json', apikey: conf().chavePublica };
  if (token) h.Authorization = 'Bearer ' + token; // a chave publishable não é JWT: sem login, vai só no cabeçalho apikey
  return h;
}
function xhrSync(metodo, caminho, corpo, token) {
  const x = new XMLHttpRequest();
  x.open(metodo, base() + caminho, false);
  const h = cab(token); Object.keys(h).forEach(k => x.setRequestHeader(k, h[k]));
  try { x.send(corpo === undefined ? null : JSON.stringify(corpo)); } catch (e) { return { status: 0, corpo: null }; }
  let j = null; try { j = JSON.parse(x.responseText); } catch (e) { /* vazio */ }
  return { status: x.status, corpo: j };
}
async function http(metodo, caminho, corpo, token, extra) {
  try {
    const r = await fetch(base() + caminho, Object.assign({ method: metodo, headers: Object.assign(cab(token), (extra && extra.headers) || {}), body: corpo === undefined ? undefined : JSON.stringify(corpo) }, extra && extra.keepalive ? { keepalive: true } : {}));
    let j = null; try { j = await r.json(); } catch (e) { /* vazio */ }
    return { status: r.status, corpo: j };
  } catch (e) { return { status: 0, corpo: null }; }
}
const msgErro = c => (c && (c.msg || c.message || c.error_description || c.error)) || '';

// Renova a sessão quando está para vencer (síncrono na abertura da página; assíncrono depois).
function sessaoValidaSync() {
  const s = sessao(); if (!s) return null;
  if (!venceLogo(s)) return s;
  const r = xhrSync('POST', '/auth/v1/token?grant_type=refresh_token', { refresh_token: s.refresh_token });
  if (r.status === 200 && r.corpo && r.corpo.access_token) return guardaSessao(r.corpo);
  if (r.status === 0) return s; // sem internet: tenta com o que tem
  limpaSessao(); return null;
}
async function renovar() {
  const s = sessao(); if (!s) return null;
  const r = await http('POST', '/auth/v1/token?grant_type=refresh_token', { refresh_token: s.refresh_token });
  if (r.status === 200 && r.corpo && r.corpo.access_token) return guardaSessao(r.corpo);
  if (r.status >= 400 && r.status < 500) limpaSessao();
  return null;
}
async function sessaoValida() { const s = sessao(); if (!s) return null; return venceLogo(s) ? (await renovar()) || null : s; }

// ---------- perfis <-> users do site ----------
const paraUser = p => ({ id: p.id, nome: p.nome, email: String(p.email || '').toLowerCase(), whatsapp: p.whatsapp || '', lgpd: p.lgpd || null, nivel: p.nivel, status: p.status, funcoes: p.funcoes || [], criado: String(p.criado_em || '').slice(0, 10) });
const SELECT_PERFIS = '/rest/v1/perfis?select=id,nome,email,whatsapp,lgpd,nivel,status,funcoes,criado_em&order=criado_em.asc';

// ---------- login, cadastro e senha ----------
const linkVolta = () => location.href.split(/[?#]/)[0].replace(/[^/]*$/, '').replace(/app\/$/, '') + 'login.html'; // do app também volta à página Entrar do site
async function entrar(email, senha) {
  const r = await http('POST', '/auth/v1/token?grant_type=password', { email, password: senha });
  if (r.status === 0) return { erro: 'Sem conexão com o servidor. Confira a internet e tente de novo.' };
  if (r.status !== 200 || !r.corpo || !r.corpo.access_token) {
    const m = msgErro(r.corpo), cod = r.corpo && r.corpo.error_code;
    if (cod === 'email_not_confirmed' || /not confirmed/i.test(m)) return { erro: 'Falta confirmar seu e-mail: abra a mensagem que enviamos e toque no link de confirmação.' };
    if (r.status === 429) return { erro: 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.' };
    return { erro: 'E-mail ou senha incorretos. Confira e tente de novo.' };
  }
  const s = guardaSessao(r.corpo);
  const p = await http('GET', SELECT_PERFIS.replace('&order', '&id=eq.' + encodeURIComponent(s.user.id) + '&order'), undefined, s.access_token);
  const perfil = p.status === 200 && Array.isArray(p.corpo) && p.corpo[0] ? paraUser(p.corpo[0]) : null;
  if (!perfil) { await sair(); return { erro: 'Seu cadastro não foi encontrado no Parque. Fale com o administrador.' }; }
  if (perfil.status !== 'aprovado') { await sair(); return { perfil, pendente: true }; }
  return { perfil };
}
// Idioma da pessoa (o mesmo do site e do app): vai junto no cadastro para o e-mail de confirmação sair na língua dela.
function idiomaAtual() {
  const ok = ['pt', 'es', 'it', 'fr', 'en', 'de']; let s = null; try { s = localStorage.getItem('pr_idioma'); } catch (e) { /* ignora */ }
  if (ok.includes(s)) return s;
  const l = String((navigator.languages && navigator.languages[0]) || navigator.language || 'pt').slice(0, 2).toLowerCase();
  return ok.includes(l) ? l : 'pt';
}
async function cadastrar(d) {
  const r = await http('POST', '/auth/v1/signup?redirect_to=' + encodeURIComponent(linkVolta()), { email: d.email, password: d.senha, data: { nome: d.nome, whatsapp: d.whatsapp, lgpd: d.lgpd, idioma: d.idioma || idiomaAtual() } });
  if (r.status === 0) return { erro: 'Sem conexão com o servidor. Confira a internet e tente de novo.' };
  if (r.status === 200 || r.status === 201) { if (r.corpo && r.corpo.access_token) await sair(); return { ok: true }; }
  const m = msgErro(r.corpo);
  if (/already|registered|exists/i.test(m)) return { erro: 'Este e-mail já tem cadastro. Use a aba Entrar (ou "Esqueci minha senha").' };
  if (/password/i.test(m)) return { erro: 'Senha fraca: use ao menos 8 caracteres, misturando letras e números.' };
  if (r.status === 429) return { erro: 'Muitos cadastros seguidos. Espere alguns minutos e tente de novo.' };
  return { erro: 'Não foi possível criar a conta agora (' + (m || r.status) + ').' };
}
async function recuperar(email) {
  const r = await http('POST', '/auth/v1/recover?redirect_to=' + encodeURIComponent(linkVolta() + '?redefinir=1'), { email, data: { idioma: idiomaAtual() } });
  if (r.status === 0) return { erro: 'Sem conexão com o servidor. Confira a internet e tente de novo.' };
  if (r.status === 429) return { erro: 'Muitos pedidos seguidos. Espere alguns minutos e tente de novo.' };
  return { ok: true }; // por segurança, a resposta é a mesma exista ou não o e-mail
}
// Volta do e-mail de "redefinir senha" (ou de confirmação): o Supabase manda #access_token=...&type=recovery
function lerRetornoDoEmail() {
  const h = new URLSearchParams(String(location.hash || '').replace(/^#/, ''));
  if (h.get('error_description')) return { erro: h.get('error_description').replace(/\+/g, ' ') };
  if (!h.get('access_token')) return null;
  return { tipo: h.get('type') || '', token: h.get('access_token'), refresh: h.get('refresh_token'), expira: +h.get('expires_at') || 0 };
}
async function novaSenha(token, senha) {
  const r = await http('PUT', '/auth/v1/user', { password: senha }, token);
  if (r.status === 200) return { ok: true };
  if (r.status === 0) return { erro: 'Sem conexão com o servidor. Confira a internet e tente de novo.' };
  const m = msgErro(r.corpo);
  if (/same/i.test(m)) return { erro: 'A nova senha precisa ser diferente da anterior.' };
  if (/expired|invalid/i.test(m) || r.status === 401) return { erro: 'O link expirou. Peça um novo em "Esqueci minha senha".' };
  return { erro: 'Não foi possível trocar a senha (' + (m || r.status) + ').' };
}
async function sair() {
  const s = sessao(); limpaSessao();
  if (s) await http('POST', '/auth/v1/logout', {}, s.access_token, { keepalive: true });
}

// ---------- armazenamento (mesma interface get/set/del/keys de dados.js) ----------
function criarArmazenamento(opc) {
  opc = opc || {};
  const atraso = opc.atrasoMs == null ? 800 : opc.atrasoMs;
  const cache = new Map(), versoes = new Map(), sujos = new Set(), apagar = new Set(), conflitos = new Map();
  const st = { estado: 'novo', erro: null, ultimaSync: null, usuario: null };
  let perfisBase = new Map(), usersSujo = false, timer = null, voando = null;
  const nome = k => k.slice(PREF.length);
  const sincronizavel = k => k.startsWith(PREF) && !LOCAIS.has(nome(k)) && nome(k) !== 'users';
  const avisa = () => { try { window.dispatchEvent(new CustomEvent('pr-sync', { detail: estado() })); } catch (e) { /* ignora */ } };
  function estado() { return Object.assign({}, st, { pendentes: sujos.size + apagar.size + (usersSujo ? 1 : 0), conflitos: conflitos.size }); }

  function poePerfis(lista) {
    const us = lista.map(paraUser);
    perfisBase = new Map(us.map(u => [u.id, JSON.parse(JSON.stringify(u))]));
    cache.set(PREF + 'users', JSON.stringify(us));
  }

  // Abertura: síncrona, para as telas lerem os dados logo em seguida.
  function iniciar() {
    const s = sessaoValidaSync();
    if (!s) { st.estado = 'sem-sessao'; poePerfis([]); return; }
    st.usuario = s.user.email;
    const p = xhrSync('GET', SELECT_PERFIS, undefined, s.access_token);
    if (p.status === 401) { limpaSessao(); st.estado = 'sem-sessao'; poePerfis([]); return; }
    if (p.status !== 200 || !Array.isArray(p.corpo)) { st.estado = 'offline'; st.erro = 'Não foi possível falar com o servidor (' + p.status + ').'; poePerfis([]); return; }
    poePerfis(p.corpo);
    const eu = p.corpo.find(x => x.id === s.user.id);
    if (!eu || eu.status !== 'aprovado') { st.estado = 'sem-permissao'; return; }
    const r = xhrSync('POST', '/rest/v1/rpc/pr_ler_colecoes', {}, s.access_token);
    if (r.status !== 200 || !r.corpo || typeof r.corpo !== 'object') { st.estado = r.status === 403 ? 'sem-permissao' : 'offline'; st.erro = 'Não foi possível carregar os dados (' + r.status + ').'; return; }
    Object.keys(r.corpo).forEach(n => { cache.set(PREF + n, JSON.stringify(r.corpo[n].dados)); versoes.set(n, r.corpo[n].versao | 0); });
    st.estado = 'ok'; st.ultimaSync = new Date().toISOString();
  }

  function agenda() { if (timer) clearTimeout(timer); timer = setTimeout(() => { timer = null; sincronizar().catch(() => { /* fica pendente */ }); }, atraso); }

  // Users: só o que existe como perfil; campos de senha do modo navegador não vão ao servidor.
  function normalizaUsers(v) {
    let l; try { l = JSON.parse(v); } catch (e) { return cache.get(PREF + 'users'); }
    if (!Array.isArray(l)) return cache.get(PREF + 'users');
    const porEmail = new Map([...perfisBase.values()].map(u => [u.email, u.id]));
    const out = l.map(u => { const id = u.id || porEmail.get(String(u.email || '').toLowerCase()); if (!id || !perfisBase.has(id)) return null; const o = { id }; Object.keys(u).forEach(k => { if (k !== 'hash' && k !== 'salt') o[k] = u[k]; }); o.email = perfisBase.get(id).email; return o; }).filter(Boolean);
    // quem saiu da lista (Remover responsável) continua no banco como bloqueado
    const ficam = new Set(out.map(u => u.id));
    perfisBase.forEach((u, id) => { if (!ficam.has(id)) out.push(Object.assign({}, u, { status: 'bloqueado', __removido: true })); });
    return JSON.stringify(out);
  }
  const visivel = l => l.filter(u => !u.__removido);

  const arm = {
    get(k) {
      if (k === PREF + 'users') { const v = cache.get(k); if (v == null) return null; try { return JSON.stringify(visivel(JSON.parse(v))); } catch (e) { return v; } }
      return cache.has(k) ? cache.get(k) : null;
    },
    set(k, v) {
      if (k === PREF + 'users') { cache.set(k, normalizaUsers(v)); usersSujo = true; agenda(); avisa(); return true; }
      cache.set(k, v);
      if (sincronizavel(k)) { sujos.add(nome(k)); apagar.delete(nome(k)); agenda(); avisa(); }
      return true;
    },
    del(k) {
      if (k === PREF + 'users') return;
      cache.delete(k);
      if (sincronizavel(k)) { apagar.add(nome(k)); sujos.delete(nome(k)); agenda(); avisa(); }
    },
    keys() { return [...cache.keys()]; },
    iniciar, sincronizar, estado,
    conflitos: () => [...conflitos.entries()].map(([n, c]) => Object.assign({ colecao: n }, c)),
    resolverConflito
  };

  async function rpc(nomeFn, corpo) {
    let s = await sessaoValida(); if (!s) { st.estado = 'sem-sessao'; throw new Error('Sua sessão terminou. Entre de novo para continuar salvando.'); }
    let r = await http('POST', '/rest/v1/rpc/' + nomeFn, corpo, s.access_token);
    if (r.status === 401) { s = await renovar(); if (!s) { st.estado = 'sem-sessao'; throw new Error('Sua sessão terminou. Entre de novo para continuar salvando.'); } r = await http('POST', '/rest/v1/rpc/' + nomeFn, corpo, s.access_token); }
    if (r.status === 0) throw new Error('Sem conexão com o servidor.');
    if (r.status === 403) { st.estado = 'sem-permissao'; throw new Error(msgErro(r.corpo) || 'Sem permissão.'); }
    if (r.status !== 200 || !r.corpo) throw new Error('Servidor respondeu ' + r.status + (msgErro(r.corpo) ? ': ' + msgErro(r.corpo) : '') + '.');
    return r.corpo;
  }

  async function enviaUma(n) {
    const texto = cache.get(PREF + n);
    let dados; try { dados = JSON.parse(texto); } catch (e) { dados = { __texto: texto }; }
    const r = await rpc('pr_gravar_colecao', { p_nome: n, p_versao_base: versoes.get(n) | 0, p_dados: dados });
    if (r.status === 200) { versoes.set(n, r.versao | 0); if (cache.get(PREF + n) === texto) sujos.delete(n); return; }
    if (r.status === 409) {
      const servidor = r.dados, vs = r.versao_atual | 0;
      if (MESCLA_LISTA.has(n) && Array.isArray(servidor) && Array.isArray(dados)) {
        const vistos = new Set(), uniao = [];
        servidor.concat(dados).forEach(x => { const s = JSON.stringify(x); if (!vistos.has(s)) { vistos.add(s); uniao.push(x); } });
        uniao.sort((a, b) => String(a.t || '').localeCompare(String(b.t || '')));
        cache.set(PREF + n, JSON.stringify(uniao)); versoes.set(n, vs); return enviaUma(n);
      }
      conflitos.set(n, { meu: dados, servidor, versaoServidor: vs }); sujos.delete(n);
      return;
    }
    throw new Error('Resposta inesperada ao gravar "' + n + '".');
  }
  async function removeUma(n) {
    const r = await rpc('pr_excluir_colecao', { p_nome: n, p_versao_base: versoes.get(n) | 0 });
    if (r.status === 200 || r.status === 404) { apagar.delete(n); versoes.delete(n); return; }
    if (r.status === 409) { apagar.delete(n); conflitos.set(n, { meu: null, servidor: r.dados, versaoServidor: r.versao_atual | 0 }); return; }
    throw new Error('Resposta inesperada ao remover "' + n + '".');
  }
  async function enviaUsers() {
    usersSujo = false;
    let l; try { l = JSON.parse(cache.get(PREF + 'users') || '[]'); } catch (e) { return; }
    for (const u of l) {
      const antes = perfisBase.get(u.id); if (!antes) continue;
      const mud = {}; CAMPOS_PERFIL.forEach(c => { if (u[c] !== undefined && JSON.stringify(u[c]) !== JSON.stringify(antes[c])) mud[c] = u[c]; });
      if (!Object.keys(mud).length) continue;
      const s = await sessaoValida(); if (!s) { usersSujo = true; st.estado = 'sem-sessao'; throw new Error('Sua sessão terminou. Entre de novo.'); }
      const r = await http('PATCH', '/rest/v1/perfis?id=eq.' + encodeURIComponent(u.id), mud, s.access_token, { headers: { Prefer: 'return=minimal' } });
      if (r.status === 0) { usersSujo = true; throw new Error('Sem conexão com o servidor.'); }
      if (r.status >= 400) {
        // recusado pelo banco (ex.: não-administrador tentando mudar nível): volta a tela ao que está no servidor
        const vol = l.map(x => x.id === u.id ? Object.assign({}, antes) : x); cache.set(PREF + 'users', JSON.stringify(vol));
        throw new Error('O servidor recusou a alteração do cadastro de ' + (antes.nome || antes.email) + (msgErro(r.corpo) ? ': ' + msgErro(r.corpo) : '.'));
      }
      perfisBase.set(u.id, Object.assign({}, antes, mud));
    }
  }

  function sincronizar() {
    if (voando) return voando;
    let terminou = false;
    const p = (async () => {
      try {
        while (sujos.size || apagar.size || usersSujo) {
          if (usersSujo) await enviaUsers();
          for (const n of [...sujos]) await enviaUma(n);
          for (const n of [...apagar]) await removeUma(n);
        }
        st.estado = 'ok'; st.erro = null; st.ultimaSync = new Date().toISOString();
      } catch (e) {
        if (st.estado !== 'sem-permissao' && st.estado !== 'sem-sessao') st.estado = 'offline';
        st.erro = e.message || String(e);
        if (st.estado === 'offline' && (sujos.size || apagar.size || usersSujo)) { timer = setTimeout(() => { timer = null; sincronizar().catch(() => {}); }, Math.max(atraso, 5000)); }
        throw e;
      } finally { terminou = true; voando = null; avisa(); }
    })();
    if (!terminou) voando = p;
    return p;
  }
  async function resolverConflito(n, escolha) {
    const c = conflitos.get(n); if (!c) return;
    if (escolha === 'servidor') { cache.set(PREF + n, JSON.stringify(c.servidor)); versoes.set(n, c.versaoServidor); conflitos.delete(n); avisa(); return; }
    versoes.set(n, c.versaoServidor); conflitos.delete(n); sujos.add(n); await sincronizar();
  }

  // Sessão sempre renovada enquanto a página estiver aberta; aviso ao fechar com algo ainda não salvo.
  setInterval(() => { const s = sessao(); if (s && venceLogo(s)) renovar(); }, 60 * 1000);
  window.addEventListener('beforeunload', e => { if (sujos.size || apagar.size || usersSujo) { sincronizar().catch(() => {}); e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('online', () => { if (sujos.size || apagar.size || usersSujo) sincronizar().catch(() => {}); });
  return arm;
}

window.PR_SUPABASE = { ligado, paginaRestrita, sessao, entrar, cadastrar, recuperar, lerRetornoDoEmail, novaSenha, sair, criarArmazenamento, guardaSessao };
})();
