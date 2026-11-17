/**
 * com-meta.js — CONecta Retiro v1.6.5
 * Módulo: Integração com Meta (Facebook + Instagram)
 * Status: ESQUELETO — ativar após 27/11/2026, requer app Meta aprovado
 *
 * Por que é pós-27/11:
 *   - A criação do App Meta (Meta for Developers) leva de 1 a 7 dias úteis para aprovação
 *   - As permissões de publicação (pages_manage_posts, instagram_content_publish)
 *     requerem revisão manual pela Meta — pode levar semanas
 *   - Precisa estar separada do lançamento do site para não bloquear o deploy
 *
 * O que este módulo fará:
 *   1. Publicar posts no Facebook (página do Parque) a partir da área restrita
 *   2. Publicar posts no Instagram (imagem + legenda) a partir da área restrita
 *   3. Agendar publicações para data/hora futura
 *   4. Listar publicações recentes e seus alcances
 *   5. Receber métricas básicas (alcance, curtidas, comentários)
 *   6. Sincronizar o calendário de posts com com-agenda.js
 *
 * Requisitos de infraestrutura:
 *   - App na Meta for Developers (https://developers.facebook.com)
 *   - Permissões solicitadas:
 *     * pages_manage_posts (Facebook)
 *     * pages_read_engagement
 *     * instagram_content_publish
 *     * instagram_basic
 *   - Token de longa duração armazenado no Supabase (secrets)
 *   - Edge Function para renovar tokens antes do vencimento (60 dias)
 *   - Edge Function como proxy para chamadas à Graph API (sem expor token no frontend)
 *
 * Migrações necessárias:
 *   - 0025_meta_integracao.sql (após 27/11):
 *     - tabela meta_posts (id, plataforma, conteudo, midia_url, agendado_para, publicado_em, post_id_meta, metricas jsonb)
 *     - tabela meta_config (chave, valor) — tokens criptografados
 *     - RLS: apenas autenticados com papel 'admin' podem ler meta_config
 *
 * Fluxo de autenticação OAuth:
 *   1. Admin acessa a página de configuração na área restrita
 *   2. Clica em "Conectar ao Facebook" → redireciona para OAuth da Meta
 *   3. Meta retorna token → Edge Function salva em meta_config (criptografado)
 *   4. Sistema usa token para publicar via proxy Edge Function
 *
 * Para ativar:
 *   1. Criar App na Meta for Developers
 *   2. Solicitar e aguardar aprovação das permissões
 *   3. Implementar Edge Function proxy
 *   4. Implementar OAuth flow na área restrita
 *   5. Testar em modo sandbox antes de publicar em produção
 */

window.PR_META = (() => {
  // TODO: implementar após 27/11/2026, mediante aprovação do App Meta

  const PLATAFORMAS = { FACEBOOK: 'facebook', INSTAGRAM: 'instagram' };

  /**
   * Verificar se a integração está configurada
   * @returns {Promise<boolean>}
   */
  async function estaConectado() {
    // TODO: verificar se existe token válido em meta_config
    console.warn('[PR_META] estaConectado() — integração ainda não configurada');
    return false;
  }

  /**
   * Iniciar fluxo OAuth com a Meta
   * Redireciona o usuário para a página de autorização da Meta
   */
  function iniciarOAuth() {
    // TODO: construir URL de autorização com APP_ID, redirect_uri e permissões
    console.warn('[PR_META] iniciarOAuth() — aguardando App Meta aprovado');
  }

  /**
   * Publicar post
   * @param {object} dados - { plataforma, texto, midia_url, agendado_para }
   * @returns {Promise<object>}
   */
  async function publicar(dados) {
    // TODO: chamar Edge Function proxy que usa a Graph API
    console.warn('[PR_META] publicar() — integração ainda não configurada');
  }

  /**
   * Buscar publicações recentes
   * @param {string} plataforma
   * @param {number} [limite=10]
   * @returns {Promise<Array>}
   */
  async function buscarPublicacoes(plataforma, limite = 10) {
    // TODO: buscar em meta_posts ordenado por publicado_em desc
    console.warn('[PR_META] buscarPublicacoes() — integração ainda não configurada');
    return [];
  }

  /**
   * Buscar métricas de um post
   * @param {string} postId
   * @returns {Promise<object>}
   */
  async function buscarMetricas(postId) {
    // TODO: chamar Graph API /metrics via Edge Function proxy
    console.warn('[PR_META] buscarMetricas() — integração ainda não configurada');
    return {};
  }

  /**
   * Inicializar painel na área restrita
   * @param {object} db
   */
  async function iniciar(db) {
    // TODO: renderizar painel de publicação e agendamento
    console.warn('[PR_META] iniciar() — aguardando App Meta aprovado e configurado');
  }

  return { PLATAFORMAS, estaConectado, iniciarOAuth, publicar, buscarPublicacoes, buscarMetricas, iniciar };
})();
