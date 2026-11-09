// Conector do YouTube. REGRA CENTRAL: o envio é SEMPRE privado (privacyStatus definido explicitamente como 'private');
// sem esse campo o YouTube publica como público. Só tornarPublico (com confirmação de uma pessoa) muda isso.
// Documentação lida em 16/10/2026: https://developers.google.com/youtube/v3/determine_quota_cost e .../docs/videos/insert
'use strict';
const { ErroConector } = require('./base.js');

const URL_ENVIO = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';
const URL_ATUALIZAR = 'https://www.googleapis.com/youtube/v3/videos?part=status';
const ESCOPO_ENVIO = 'https://www.googleapis.com/auth/youtube.upload';
const LIMITE_ENVIOS = 100, LIMITE_GERAL = 10000, CUSTO_ENVIO = 1, CUSTO_UPDATE = 50;

// Confere a cota (balde próprio de envios; balde geral para as demais operações).
function cota(ctx, balde, custo, limite) {
  const usado = ctx.contador.usado(balde, ctx.dia());
  return usado + custo > limite ? 'Cota diária do YouTube esgotada (' + (balde === 'envios' ? 'envios' : 'demais operações') + ': ' + usado + ' de ' + limite + ' usados; esta operação custa ' + custo + '). Tente amanhã.' : null;
}

function corpoEnvio(post) {
  const corpo = { snippet: { title: String(post.tema || ''), description: String(post.texto || '') }, status: { privacyStatus: 'private' } };
  if (corpo.status.privacyStatus !== 'private') throw new Error('Violação da regra central: envio precisa ser private.'); // trava de segurança
  return corpo;
}

module.exports = {
  canal: 'youtube', servidor: '', ESCOPO_ENVIO, LIMITE_ENVIOS, LIMITE_GERAL, CUSTO_UPDATE,
  capacidades: { publica: true, agenda: false, mensagens: false, metricas: false },
  publicar: {
    validar(p, o, ctx) {
      if (o.privacidade !== undefined && o.privacidade !== 'private') return { ok: false, motivo: 'O envio ao YouTube é sempre privado. Para tornar público use tornarPublico, com confirmação de uma pessoa.' };
      if (o.agendarPara || p.agendarPara) return { ok: false, motivo: 'Este conector não agenda no YouTube: o envio é privado e a mudança para público é manual (tornarPublico).' };
      if (!/v[ií]deo/i.test(String(p.tipo || ''))) return { ok: false, motivo: 'O conector do YouTube só envia vídeo (tipo recebido: "' + (p.tipo || '') + '").' };
      if (!String(p.tema || '').trim()) return { ok: false, motivo: 'O vídeo precisa de título (campo tema).' };
      const c = cota(ctx, 'envios', CUSTO_ENVIO, ctx.config.limiteEnvios || LIMITE_ENVIOS);
      return c ? { ok: false, motivo: c } : { ok: true };
    },
    simular: p => ({ passos: [
      { metodo: 'POST', caminho: URL_ENVIO, escopo: ESCOPO_ENVIO, cabecalhos: { 'X-Upload-Content-Type': 'application/octet-stream' }, corpo: corpoEnvio(p), custo: { balde: 'envios', unidades: CUSTO_ENVIO } },
      { metodo: 'PUT', caminho: '<endereço da sessão, vindo do cabeçalho Location da resposta anterior>', corpo: '[bytes do vídeo]' }
    ] }),
    async executar(p, o, ctx) {
      if (typeof o.lerVideo !== 'function') throw new ErroConector('Informe opcoes.lerVideo (função que devolve os bytes do vídeo): o conector não busca arquivos sozinho.');
      ctx.contador.somar('envios', ctx.dia(), CUSTO_ENVIO);
      const ini = await ctx.chamar({ metodo: 'POST', caminho: URL_ENVIO, cabecalhos: { 'X-Upload-Content-Type': 'application/octet-stream' }, corpo: corpoEnvio(p) });
      const sessao = ini.cabecalho('location');
      if (!sessao) throw new ErroConector('O YouTube não devolveu o endereço da sessão de envio.');
      const bytes = await o.lerVideo(p);
      const fim = await ctx.chamar({ metodo: 'PUT', caminho: sessao, cabecalhos: { 'Content-Type': 'application/octet-stream' }, corpoBruto: bytes });
      if (!fim.dados.id) throw new ErroConector('O YouTube respondeu sem o identificador do vídeo.');
      return { id: String(fim.dados.id), url: 'https://www.youtube.com/watch?v=' + fim.dados.id, privacidade: 'private' };
    }
  },
  tornarPublico: {
    validar(p, o, ctx) {
      if (!String(o.confirmadoPor || '').trim()) return { ok: false, motivo: 'Tornar público exige a confirmação de uma pessoa (informe confirmadoPor).' };
      if (!p.videoId) return { ok: false, motivo: 'Falta o identificador do vídeo já enviado (post.videoId).' };
      if (o.privacidade !== undefined && !['public', 'unlisted'].includes(o.privacidade)) return { ok: false, motivo: 'Privacidade de destino precisa ser "public" ou "unlisted".' };
      const c = cota(ctx, 'geral', CUSTO_UPDATE, ctx.config.limiteGeral || LIMITE_GERAL);
      return c ? { ok: false, motivo: c } : { ok: true };
    },
    simular: (p, o) => ({ passos: [{ metodo: 'PUT', caminho: URL_ATUALIZAR, corpo: { id: p.videoId, status: { privacyStatus: o.privacidade || 'public' } }, custo: { balde: 'geral', unidades: CUSTO_UPDATE } }] }),
    async executar(p, o, ctx) {
      const destino = o.privacidade || 'public';
      ctx.contador.somar('geral', ctx.dia(), CUSTO_UPDATE);
      await ctx.chamar({ metodo: 'PUT', caminho: URL_ATUALIZAR, corpo: { id: p.videoId, status: { privacyStatus: destino } } });
      return { id: String(p.videoId), url: 'https://www.youtube.com/watch?v=' + p.videoId, privacidade: destino };
    }
  }
};
