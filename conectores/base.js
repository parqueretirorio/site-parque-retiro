// Conectores de publicação (Prompt 07) - NÚCLEO COMUM. Código de servidor de REFERÊNCIA e SIMULADO.
// Não faz chamada de rede por conta própria: só usa o `http` que lhe for entregue, e só em modo ao vivo
// (config.ao_vivo === true + conexão ligada + segredo obtido). Nenhum segredo é guardado: o segredo é lido
// a cada operação pela função injetada `segredo(nome)` (nome de variável de ambiente) e vive só numa variável local.
'use strict';
const REGRAS = require('../com-regras.js');

const MARCA = '[segredo oculto]';
const MIN = 60 * 1000, DIA = 24 * 60 * MIN;

// Erro previsto do conector: a mensagem já é em português e segura para mostrar à pessoa.
class ErroConector extends Error {
  constructor(mensagem, extra) { super(mensagem); this.name = 'ErroConector'; this.extra = extra || {}; this.http = !!(extra && extra.http); }
}

// Troca por [segredo oculto] os valores informados (e suas formas codificadas) e padrões comuns de credencial.
function ocultarSegredos(texto, valores) {
  let t = texto == null ? '' : String(texto);
  (valores || []).forEach(v => {
    if (v == null || v === '') return;
    const s = String(v);
    [s, encodeURIComponent(s), Buffer.from(s).toString('base64')].forEach(f => { if (f) t = t.split(f).join(MARCA); });
  });
  return t
    .replace(/\b(access_token|refresh_token|client_secret|token)=([^&\s"']+)/gi, '$1=' + MARCA)
    .replace(/Bearer\s+[A-Za-z0-9._~+\/=-]+/gi, 'Bearer ' + MARCA)
    .replace(/("(?:access_token|refresh_token|client_secret)"\s*:\s*")[^"]*(")/gi, '$1' + MARCA + '$2');
}

// Aplica ocultarSegredos em todas as strings de um objeto (cópia profunda, sem funções).
function limpar(x, valores) {
  if (typeof x === 'string') return ocultarSegredos(x, valores);
  if (Array.isArray(x)) return x.map(i => limpar(i, valores));
  if (x && typeof x === 'object') { const o = {}; Object.keys(x).forEach(k => { if (typeof x[k] !== 'function') o[k] = limpar(x[k], valores); }); return o; }
  return x;
}

// Contador de cota em memória (padrão dos testes). Em produção, injete um contador que grave em banco.
function criarContadorMemoria() {
  const m = {};
  return { usado: (balde, dia) => m[balde + '|' + dia] || 0, somar: (balde, dia, n) => { m[balde + '|' + dia] = (m[balde + '|' + dia] || 0) + n; } };
}

// Mensagens claras (sem repetir o corpo da resposta, que poderia conter credenciais).
function mensagemHttp(status, canal, interpretado) {
  if (interpretado) return interpretado;
  if (status === 401) return 'A rede social recusou a credencial (HTTP 401): o token venceu ou foi revogado. Uma pessoa administradora do canal precisa renovar a autorização no servidor.';
  if (status === 403) return 'Permissão insuficiente (HTTP 403): confira as permissões do aplicativo e as tarefas da pessoa na conta ou Página.';
  if (status === 429) return 'Limite de uso da API atingido (HTTP 429): aguarde antes de tentar de novo.';
  if (status >= 500) return 'A rede social está com falha temporária (HTTP ' + status + '): tente de novo mais tarde.';
  return 'A rede social recusou o pedido (HTTP ' + status + '). Confira os dados da publicação.';
}

const pediu = v => v !== undefined && v !== null && v !== false && v !== '' && v !== 0;
const SEGREDO_NA_CONFIG = /(token|secret|senha|password|api_?key)/i;

function criarConector({ canal, adaptador, config, db, http, segredo, auditar, agora, dormir, contador }) {
  config = Object.assign({}, config || {});
  Object.keys(config).forEach(k => { if (SEGREDO_NA_CONFIG.test(k) && typeof config[k] === 'string') throw new Error('A configuração do conector não pode conter segredos: informe só o NOME da variável (nomeSegredo).'); });
  if (!db || typeof db.get !== 'function') throw new Error('Informe o db (com get).');
  const relogio = agora || (() => new Date().toISOString());
  const agoraMs = () => new Date(relogio()).getTime();
  const esperar = dormir || (ms => new Promise(r => setTimeout(r, ms)));
  const cont = contador || criarContadorMemoria();
  const registra = ev => { try { if (typeof auditar === 'function') auditar(ev); } catch (e) { /* auditoria nunca derruba a operação */ } };

  async function operar(op, post, conexao, opcoes) {
    post = post || {}; opcoes = opcoes || {};
    const est = { token: null, categoria: 'recusado' };
    let res;
    try { res = await etapas(op, post, conexao, opcoes, est); }
    catch (e) {
      if (e instanceof ErroConector) {
        est.categoria = e.http ? 'erro' : 'recusado';
        const extra = Object.assign({}, e.extra); delete extra.http; delete extra.status;
        res = Object.assign({ ok: false, simulado: false, motivo: e.message }, extra);
      }
      else { est.categoria = 'erro'; res = { ok: false, simulado: false, motivo: 'Falha inesperada no conector: ' + (e && e.message ? e.message : 'erro desconhecido') }; }
    }
    res = limpar(res, [est.token]);
    registra(limpar({ canal, operacao: op, postId: post.id || null, resultado: res.ok ? (res.simulado ? 'simulado' : 'ok') : est.categoria, simulado: !!res.simulado, motivo: res.motivo || null, confirmadoPor: opcoes.confirmadoPor || null, quando: relogio() }, [est.token]));
    return res;
  }

  async function etapas(op, post, conexao, opcoes, est) {
    const recusa = motivo => ({ ok: false, simulado: false, motivo });
    // (a) regras de aprovação: SEMPRE primeiro
    const lib = REGRAS.conectorLiberado(post, conexao, db);
    if (!lib.ok) return recusa(lib.motivo);
    if (post.rede && post.rede !== canal) return recusa('Esta publicação é do canal "' + post.rede + '", não do conector "' + canal + '".');
    if (conexao.canal && conexao.canal !== canal) return recusa('A conexão informada é do canal "' + conexao.canal + '", não do conector "' + canal + '".');
    // (b) nada de anúncios
    if (pediu(opcoes.impulsionar) || pediu(post.impulsionar) || pediu(post.orcamento)) return recusa('Pedido recusado: publicidade paga não é permitida (este conector não cria anúncios nem impulsiona publicações).');
    const def = adaptador[op];
    if (!def) return recusa('Operação "' + op + '" não existe neste conector.');
    const ctx = { canal, config, post, opcoes, agora: agoraMs, contador: cont, dormir: esperar, dia: () => new Date(agoraMs()).toISOString().slice(0, 10) };
    // (c) validação do conteúdo
    const v = await def.validar(post, opcoes, ctx);
    if (!v.ok) return recusa(v.motivo);
    // (d) simulação é o padrão
    let motivoSim = null;
    if (config.ao_vivo !== true) motivoSim = 'Modo simulação (padrão): nada foi enviado. Este é o pedido que SERIA feito.';
    else {
      const nome = config.nomeSegredo;
      est.token = nome ? await segredo(nome) : null;
      if (!est.token) { est.token = null; motivoSim = 'Modo ao vivo pedido, mas o segredo não foi obtido no servidor: nada foi enviado.'; }
    }
    if (motivoSim) { const s = def.simular(post, opcoes, ctx); return Object.assign({ ok: true, simulado: true, motivo: motivoSim, pedido: { canal, operacao: op, passos: s.passos } }, s.agendado ? { agendado: s.agendado } : {}); }
    // ao vivo
    const token = est.token;
    ctx.chamar = async passo => {
      const url = /^https?:/i.test(passo.caminho) ? passo.caminho : (adaptador.servidor || '') + passo.caminho;
      if (!/^https:\/\//i.test(url)) throw new ErroConector('Endereço de API inválido (precisa ser https).');
      const cab = Object.assign({ Authorization: 'Bearer ' + token }, passo.cabecalhos || {});
      let corpo;
      if (passo.corpoBruto !== undefined) corpo = passo.corpoBruto;
      else if (passo.corpo !== undefined && passo.metodo !== 'GET') { corpo = JSON.stringify(passo.corpo); cab['Content-Type'] = 'application/json'; }
      const f = http || globalThis.fetch;
      const r = await f(url, { method: passo.metodo, headers: cab, body: corpo });
      let dados = null; try { dados = await r.json(); } catch (e) { dados = null; }
      const status = r.status, bom = typeof r.ok === 'boolean' ? r.ok : (status >= 200 && status < 300);
      if (!bom) throw new ErroConector(mensagemHttp(status, canal, def.interpretarErro ? def.interpretarErro(status, dados) : (adaptador.interpretarErro ? adaptador.interpretarErro(status, dados) : null)), { http: true, status });
      return { status, dados: dados || {}, cabecalho: n => (r.headers && typeof r.headers.get === 'function' ? r.headers.get(n) : null) };
    };
    const out = await def.executar(post, opcoes, ctx);
    est.categoria = 'ok';
    return Object.assign({ ok: true, simulado: false }, out);
  }

  const conector = { canal, publicar: (post, conexao, opcoes) => operar('publicar', post, conexao, opcoes) };
  if (adaptador.tornarPublico) conector.tornarPublico = (post, conexao, opcoes) => operar('tornarPublico', post, conexao, opcoes);
  return conector;
}

module.exports = { criarConector, ErroConector, ocultarSegredos, criarContadorMemoria, MIN, DIA, MARCA };
