/**
 * com-forum.js — CONecta Retiro v1.6.5
 * Módulo: Fórum da Comunidade
 * Status: ESQUELETO — pendente de definição de moderação e autorização de merge
 *
 * Dependência de definição necessária:
 *   - Política de moderação aprovada pela coordenação do Parque
 *   - Definição de quem pode criar tópicos (apenas cadastrados? qualquer um?)
 *   - Definição de categorias/espaços temáticos
 *   - Fluxo de denúncia e resposta de moderadores
 *
 * O que este módulo fará:
 *   1. Listar tópicos por categoria (espaços temáticos do Parque)
 *   2. Criar tópicos (requer cadastro)
 *   3. Responder a tópicos
 *   4. Marcar tópico como resolvido
 *   5. Denunciar conteúdo impróprio
 *   6. Moderar (ocultar/restaurar) na área restrita
 *   7. Notificar por e-mail quando há resposta em tópico seguido
 *
 * Categorias previstas:
 *   - Dúvidas sobre o Parque e as visitas
 *   - Encontros e atividades
 *   - Estudo e reflexão
 *   - Avisos e comunicados
 *   - Sugestões
 *
 * Migrações necessárias:
 *   - 0022_forum.sql:
 *     - tabela forum_topicos (id, categoria, titulo, corpo, autor_id, resolvido, oculto, criadoEm)
 *     - tabela forum_respostas (id, topico_id, corpo, autor_id, oculto, criadoEm)
 *     - tabela forum_denuncias (id, tipo, referencia_id, motivo, criadoEm)
 *     - RLS: leitura pública de não-ocultos; escrita apenas para autenticados
 *
 * Para ativar: aprovar política de moderação com a coordenação
 */

window.PR_FORUM = (() => {
  // TODO: implementar após aprovação da política de moderação

  const CATEGORIAS = [
    { id: 'visitas',    nome: 'Dúvidas sobre visitas' },
    { id: 'atividades', nome: 'Encontros e atividades' },
    { id: 'estudo',     nome: 'Estudo e reflexão' },
    { id: 'avisos',     nome: 'Avisos e comunicados' },
    { id: 'sugestoes',  nome: 'Sugestões' },
  ];

  /**
   * Buscar tópicos de uma categoria
   * @param {string} categoriaId
   * @param {object} [opcoes] - { pagina, porPagina, incluirOcultos }
   * @returns {Promise<Array>}
   */
  async function buscarTopicos(categoriaId, opcoes = {}) {
    // TODO: PR_SUPABASE.buscar('forum_topicos', { categoria: categoriaId, oculto: false })
    console.warn('[PR_FORUM] buscarTopicos() ainda não implementado');
    return [];
  }

  /**
   * Criar novo tópico
   * @param {object} dados - { categoria, titulo, corpo }
   * @returns {Promise<object>}
   */
  async function criarTopico(dados) {
    // TODO: validar, inserir, notificar moderadores
    console.warn('[PR_FORUM] criarTopico() ainda não implementado');
  }

  /**
   * Responder a um tópico
   * @param {string} topicoId
   * @param {string} corpo
   * @returns {Promise<object>}
   */
  async function responder(topicoId, corpo) {
    // TODO: validar, inserir, notificar autor do tópico
    console.warn('[PR_FORUM] responder() ainda não implementado');
  }

  /**
   * Denunciar conteúdo
   * @param {'topico'|'resposta'} tipo
   * @param {string} referenciaId
   * @param {string} motivo
   */
  async function denunciar(tipo, referenciaId, motivo) {
    // TODO: inserir em forum_denuncias e notificar moderadores
    console.warn('[PR_FORUM] denunciar() ainda não implementado');
  }

  /**
   * Ocultar/restaurar (moderação)
   * @param {'topico'|'resposta'} tipo
   * @param {string} id
   * @param {boolean} oculto
   */
  async function moderar(tipo, id, oculto) {
    // TODO: atualizar campo oculto, registrar ação de moderação
    console.warn('[PR_FORUM] moderar() ainda não implementado — requer autenticação de moderador');
  }

  /**
   * Inicializar painel de moderação na área restrita
   * @param {object} db
   */
  async function iniciar(db) {
    // TODO: renderizar fila de denúncias e histórico de moderação
    console.warn('[PR_FORUM] iniciar() ainda não implementado — aguardando política de moderação');
  }

  return { CATEGORIAS, buscarTopicos, criarTopico, responder, denunciar, moderar, iniciar };
})();
