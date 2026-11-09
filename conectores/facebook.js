// Conector do Facebook (Página). Pedidos descritos em dados para facilitar a portagem (ex.: PHP).
// Documentação lida em 16/10/2026: https://developers.facebook.com/documentation/pages-api/posts
'use strict';
const { ErroConector, MIN, DIA } = require('./base.js');

const PERMISSOES_ESPERADAS = ['pages_manage_posts', 'pages_read_engagement', 'pages_manage_engagement', 'pages_read_user_engagement'];
const httpsPublico = u => { try { const x = new URL(u); return x.protocol === 'https:' && !/^(localhost|127\.|10\.|192\.168\.)/.test(x.hostname) && !x.hostname.endsWith('.local'); } catch (e) { return false; } };

// Monta o plano (um passo) ou devolve {erro}.
function plano(post, opcoes, ctx) {
  const c = ctx.config;
  if (!/^v\d+\.\d+$/.test(String(c.versaoApi || ''))) return { erro: 'Falta config.versaoApi (formato "vNN.N"). Este conector não assume versão padrão: confira a versão vigente na documentação oficial da Graph API.' };
  if (!c.pageId) return { erro: 'Falta config.pageId (identificador da Página).' };
  const perm = Array.isArray(c.permissoes) ? c.permissoes : null;
  if (!perm) return { erro: 'Declare em config.permissoes as permissões concedidas ao aplicativo (esperadas: ' + PERMISSOES_ESPERADAS.join(', ') + ' e, para vídeo, publish_video).' };
  if (!perm.includes('pages_manage_posts')) return { erro: 'Falta a permissão pages_manage_posts para publicar na Página.' };
  const tipo = String(post.tipo || '');
  let nivel = 'feed';
  if (/carross|stories/i.test(tipo)) return { erro: 'O conector do Facebook não publica o formato "' + tipo + '" (suporta texto/link, imagem e vídeo).' };
  if (/v[ií]deo/i.test(tipo)) nivel = 'videos'; else if (/imagem|foto/i.test(tipo)) nivel = 'photos';
  const texto = String(post.texto || '');
  const base = '/' + c.versaoApi + '/' + c.pageId;
  let corpo;
  if (nivel === 'feed') {
    const link = opcoes.link || post.link || (httpsPublico(post.midiaLink) ? post.midiaLink : '');
    if (!texto.trim() && !link) return { erro: 'A publicação não tem texto nem link.' };
    corpo = { message: texto }; if (link) corpo.link = link;
  } else {
    if (!httpsPublico(post.midiaLink)) return { erro: 'A mídia precisa estar numa URL pública https (campo midiaLink); imagem embutida (img) não é enviada.' };
    if (nivel === 'photos') corpo = { url: post.midiaLink, caption: texto };
    else {
      if (!perm.includes('publish_video')) return { erro: 'Vídeo exige a permissão publish_video, que não está declarada em config.permissoes.' };
      corpo = { file_url: post.midiaLink, description: texto };
    }
  }
  let agendado = null;
  const quando = opcoes.agendarPara || post.agendarPara;
  if (quando) {
    const t = new Date(quando).getTime();
    if (!Number.isFinite(t)) return { erro: 'Data de agendamento inválida.' };
    const d = t - ctx.agora();
    if (d < 10 * MIN) return { erro: 'Agendamento fora da janela: precisa ser pelo menos 10 minutos à frente.' };
    if (d > 30 * DIA) return { erro: 'Agendamento fora da janela: no máximo 30 dias à frente.' };
    corpo.published = false; corpo.scheduled_publish_time = Math.floor(t / 1000);
    agendado = new Date(t).toISOString();
  }
  return { passos: [{ metodo: 'POST', caminho: base + '/' + nivel, corpo }], agendado, nivel };
}

module.exports = {
  canal: 'facebook', servidor: 'https://graph.facebook.com', PERMISSOES_ESPERADAS,
  capacidades: { publica: true, agenda: true, mensagens: false, metricas: false },
  publicar: {
    validar: (p, o, ctx) => { const r = plano(p, o, ctx); return r.erro ? { ok: false, motivo: r.erro } : { ok: true }; },
    simular: (p, o, ctx) => { const r = plano(p, o, ctx); return { passos: r.passos, agendado: r.agendado }; },
    async executar(p, o, ctx) {
      const r = plano(p, o, ctx);
      const { dados } = await ctx.chamar(r.passos[0]);
      const id = dados.post_id || dados.id;
      if (!id) throw new ErroConector('O Facebook respondeu sem o identificador da publicação.');
      return Object.assign({ id: String(id), url: 'https://www.facebook.com/' + id }, r.agendado ? { agendado: r.agendado } : {});
    }
  }
};
