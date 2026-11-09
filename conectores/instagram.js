// Conector do Instagram (conta profissional ligada a uma Página). Fluxo de 2 passos: criar contêiner e publicar.
// Documentação lida em 16/10/2026: https://developers.facebook.com/documentation/instagram-platform/content-publishing
'use strict';
const { ErroConector, MIN } = require('./base.js');

const MSG_SEM_AGENDA = 'O Instagram não agenda pela API; use a fila de publicação ou o agendador nativo';
const LIMITE_PADRAO = 50; // SEGURO: a documentação cita 100 e, noutro trecho, 50 (conflito não conciliado)
const ESPERAS_MAX = 5, ESPERA_MS = MIN; // consulta no máximo 1x por minuto, por no máximo 5 minutos

const ehVideo = i => i.tipo === 'video' || /\.(mp4|mov)(\?|#|$)/i.test(i.url);
const ehJpeg = i => i.mime ? i.mime === 'image/jpeg' : /\.(jpe?g)(\?|#|$)/i.test(i.url);
const publica = u => { try { const x = new URL(u); return x.protocol === 'https:' && !/^(localhost|127\.|10\.|192\.168\.)/.test(x.hostname) && !x.hostname.endsWith('.local'); } catch (e) { return false; } };

// Itens de mídia: post.itens (textos ou {url,tipo,mime}) ou os endereços do midiaLink separados por espaço, vírgula ou ;.
function itensDe(post) {
  const bruto = Array.isArray(post.itens) ? post.itens : String(post.midiaLink || '').split(/[\s,;]+/).filter(Boolean);
  return bruto.map(i => typeof i === 'string' ? { url: i } : Object.assign({}, i));
}

function plano(post, opcoes, ctx) {
  if (opcoes.agendarPara || post.agendarPara) return { erro: MSG_SEM_AGENDA };
  const c = ctx.config;
  if (!/^v\d+\.\d+$/.test(String(c.versaoApi || ''))) return { erro: 'Falta config.versaoApi (formato "vNN.N"). Confira a versão vigente na documentação oficial da Graph API; este conector não assume versão padrão.' };
  if (!c.igId) return { erro: 'Falta config.igId (identificador da conta profissional do Instagram).' };
  const perm = Array.isArray(c.permissoes) ? c.permissoes : null;
  if (!perm) return { erro: 'Declare em config.permissoes as permissões concedidas (instagram_business_content_publish, ou instagram_content_publish + pages_read_engagement).' };
  if (!(perm.includes('instagram_business_content_publish') || (perm.includes('instagram_content_publish') && perm.includes('pages_read_engagement')))) return { erro: 'Faltam permissões de publicação do Instagram (instagram_business_content_publish, ou instagram_content_publish + pages_read_engagement).' };
  const limite = c.limite24h === undefined ? LIMITE_PADRAO : c.limite24h;
  if (!Number.isInteger(limite) || limite < 1) return { erro: 'config.limite24h precisa ser um número inteiro positivo.' };
  const tipo = String(post.tipo || '');
  let modo;
  if (/carross/i.test(tipo)) modo = 'CAROUSEL'; else if (/reels|v[ií]deo curto/i.test(tipo)) modo = 'REELS'; else if (/stories/i.test(tipo)) modo = 'STORIES'; else if (/imagem|foto/i.test(tipo)) modo = 'IMAGE';
  else return { erro: 'O Instagram não publica o formato "' + tipo + '" por este conector (suporta imagem, carrossel, Reels e Stories).' };
  const itens = itensDe(post);
  if (!itens.length) return { erro: 'Informe a mídia em URL pública https (midiaLink ou itens); imagem embutida (img) não é aceita.' };
  if (modo === 'CAROUSEL' && itens.length > 10) return { erro: 'Carrossel aceita no máximo 10 itens (recebi ' + itens.length + ').' };
  if (modo !== 'CAROUSEL' && itens.length > 1) return { erro: 'Este formato aceita uma só mídia.' };
  for (const [n, i] of itens.entries()) {
    if (!publica(i.url)) return { erro: 'A mídia ' + (n + 1) + ' precisa estar numa URL pública https.' };
    if (!ehVideo(i) && !ehJpeg(i)) return { erro: 'O Instagram só aceita imagem JPEG (mídia ' + (n + 1) + ' recusada).' };
    if (modo === 'REELS' && !ehVideo(i)) return { erro: 'Reels exige vídeo.' };
    if (modo === 'IMAGE' && ehVideo(i)) return { erro: 'Post com imagem não aceita vídeo; use o formato Reels ou Stories.' };
  }
  const v = '/' + c.versaoApi, ig = v + '/' + c.igId, legenda = String(post.texto || '');
  const corpoItem = (i, filho) => { const o = {}; if (filho) o.is_carousel_item = true; if (ehVideo(i)) { o.media_type = modo === 'REELS' ? 'REELS' : modo === 'STORIES' ? 'STORIES' : 'VIDEO'; o.video_url = i.url; } else { o.image_url = i.url; if (modo === 'STORIES') o.media_type = 'STORIES'; } return o; };
  const status = id => ({ metodo: 'GET', caminho: v + '/' + id + '?fields=status_code' });
  return { modo, itens, v, ig, legenda, corpoItem, status, limite };
}

// Espera o contêiner ficar FINISHED: 1 consulta por minuto, no máximo 5 minutos.
async function esperar(ctx, pl, id) {
  for (let i = 0; ; i++) {
    const { dados } = await ctx.chamar(pl.status(id));
    const s = dados.status_code;
    if (s === 'FINISHED') return;
    if (s === 'ERROR') throw new ErroConector('O Instagram não conseguiu processar a mídia (status ERROR). Confira formato e endereço.', { container: id });
    if (s === 'EXPIRED') throw new ErroConector('O contêiner expirou (não foi publicado em 24 horas). Crie de novo.', { container: id });
    if (s === 'PUBLISHED') throw new ErroConector('Este contêiner já foi publicado.', { container: id });
    if (s !== 'IN_PROGRESS') throw new ErroConector('Status inesperado do contêiner do Instagram.', { container: id });
    if (i >= ESPERAS_MAX) throw new ErroConector('O Instagram ainda processava a mídia depois de 5 minutos. O contêiner vale por 24 horas; tente publicar de novo mais tarde.', { container: id });
    await ctx.dormir(ESPERA_MS);
  }
}

module.exports = {
  canal: 'instagram', servidor: 'https://graph.facebook.com', MSG_SEM_AGENDA, LIMITE_PADRAO,
  capacidades: { publica: true, agenda: false, mensagens: false, metricas: false },
  // O app não sabe se a Página exige PPA; a API bloqueia e aqui só traduzimos o erro (sem repetir o corpo).
  interpretarErro(status, dados) {
    const m = dados && dados.error && dados.error.message;
    if (typeof m === 'string' && /publishing authorization|\bPPA\b/i.test(m)) return 'A Página ligada a esta conta exige a Autorização de Publicação (PPA) e a API bloqueia até ela ser concluída. Uma pessoa administradora da Página deve concluí-la no Facebook antes de publicar.';
    return null;
  },
  publicar: {
    validar: (p, o, ctx) => { const r = plano(p, o, ctx); return r.erro ? { ok: false, motivo: r.erro } : { ok: true }; },
    simular(p, o, ctx) {
      const r = plano(p, o, ctx), passos = [];
      passos.push({ metodo: 'GET', caminho: r.ig + '/content_publishing_limit?fields=quota_usage', obs: 'Recusa se o uso em 24 h chegar a ' + r.limite + '.' });
      let cont;
      if (r.modo === 'CAROUSEL') {
        r.itens.forEach((i, n) => { passos.push({ metodo: 'POST', caminho: r.ig + '/media', corpo: r.corpoItem(i, true) }); passos.push(Object.assign(r.status('<id do item ' + (n + 1) + '>'), { obs: 'no máximo 1x por minuto, por até 5 minutos' })); });
        passos.push({ metodo: 'POST', caminho: r.ig + '/media', corpo: { media_type: 'CAROUSEL', children: r.itens.map((_, n) => '<id do item ' + (n + 1) + '>').join(','), caption: r.legenda } });
        cont = '<id do carrossel>';
      } else {
        const corpo = r.corpoItem(r.itens[0], false); if (r.modo !== 'STORIES') corpo.caption = r.legenda;
        passos.push({ metodo: 'POST', caminho: r.ig + '/media', corpo }); cont = '<id do contêiner>';
      }
      passos.push(Object.assign(r.status(cont), { obs: 'no máximo 1x por minuto, por até 5 minutos' }));
      passos.push({ metodo: 'POST', caminho: r.ig + '/media_publish', corpo: { creation_id: cont } });
      return { passos };
    },
    async executar(p, o, ctx) {
      const r = plano(p, o, ctx);
      const lim = await ctx.chamar({ metodo: 'GET', caminho: r.ig + '/content_publishing_limit?fields=quota_usage' });
      const uso = Number(lim.dados.data && lim.dados.data[0] && lim.dados.data[0].quota_usage);
      if (!Number.isFinite(uso)) throw new ErroConector('Não consegui ler o limite de publicações em 24 h; por segurança nada foi publicado.');
      if (uso >= r.limite) throw new ErroConector('Limite de publicações por API em 24 h atingido (' + uso + ' de ' + r.limite + '). Tente de novo mais tarde.');
      let cont;
      if (r.modo === 'CAROUSEL') {
        const filhos = [];
        for (const i of r.itens) { const c = await ctx.chamar({ metodo: 'POST', caminho: r.ig + '/media', corpo: r.corpoItem(i, true) }); await esperar(ctx, r, c.dados.id); filhos.push(c.dados.id); }
        cont = (await ctx.chamar({ metodo: 'POST', caminho: r.ig + '/media', corpo: { media_type: 'CAROUSEL', children: filhos.join(','), caption: r.legenda } })).dados.id;
      } else {
        const corpo = r.corpoItem(r.itens[0], false); if (r.modo !== 'STORIES') corpo.caption = r.legenda;
        cont = (await ctx.chamar({ metodo: 'POST', caminho: r.ig + '/media', corpo })).dados.id;
      }
      if (!cont) throw new ErroConector('O Instagram respondeu sem o identificador do contêiner.');
      await esperar(ctx, r, cont);
      const pub = await ctx.chamar({ metodo: 'POST', caminho: r.ig + '/media_publish', corpo: { creation_id: cont } });
      if (!pub.dados.id) throw new ErroConector('O Instagram respondeu sem o identificador da publicação.');
      return { id: String(pub.dados.id), container: cont };
    }
  }
};
