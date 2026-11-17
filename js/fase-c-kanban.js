/**
 * fase-c-kanban.js — CONecta Retiro v1.6.5
 * Módulo: Kanban Visual de Projetos (Fase C)
 * Status: ESQUELETO — Fase C, não antes de concluir todos os blocos da Fase B
 *
 * Por que é Fase C:
 *   - Requer que os módulos de pessoas (Bloco 4), atividades (Bloco 2) e
 *     comunicação (Blocos 5, 6, 7) estejam estáveis e em produção
 *   - A equipe precisa estar familiarizada com o CONecta antes de usar Kanban
 *   - Requer definição prévia dos fluxos de trabalho com a coordenação
 *   - Complexidade de UI (drag-and-drop) exige testes extensos em dispositivos móveis
 *
 * O que este módulo fará:
 *   1. Visualização de tarefas em colunas (A Fazer / Em Andamento / Concluído)
 *   2. Drag-and-drop para mover tarefas entre colunas
 *   3. Atribuição de tarefas a pessoas do Parque
 *   4. Prazo e prioridade por tarefa
 *   5. Filtro por projeto, responsável e prazo
 *   6. Notificação por e-mail ao ser atribuído a uma tarefa
 *
 * Migrações necessárias (Fase C):
 *   - 0030_kanban.sql (numeração reservada para Fase C):
 *     - tabela kanban_projetos (id, nome, descricao, ativo, criadoEm)
 *     - tabela kanban_colunas (id, projeto_id, nome, ordem, cor)
 *     - tabela kanban_tarefas (id, coluna_id, titulo, descricao, responsavel_id, prazo, prioridade, ordem)
 *     - RLS: leitura/escrita apenas para autenticados com papel 'coordenador' ou 'admin'
 *
 * Dependências de UI:
 *   - Biblioteca de drag-and-drop acessível (SortableJS ou equivalente)
 *   - Garantir funcionamento em touch (tablets usados no Parque)
 *
 * Para ativar: concluir Fase B, aprovar fluxos com coordenação, testar em dispositivos móveis
 */

window.PR_KANBAN = (() => {
  // TODO: implementar na Fase C

  const COLUNAS_PADRAO = [
    { id: 'a_fazer',      nome: 'A Fazer',      cor: '#6c757d' },
    { id: 'em_andamento', nome: 'Em Andamento',  cor: '#0d6efd' },
    { id: 'em_revisao',   nome: 'Em Revisão',    cor: '#fd7e14' },
    { id: 'concluido',    nome: 'Concluído',     cor: '#198754' },
  ];

  async function buscarProjetos() {
    console.warn('[PR_KANBAN] buscarProjetos() — Fase C, ainda não implementado');
    return [];
  }

  async function buscarTarefas(projetoId) {
    console.warn('[PR_KANBAN] buscarTarefas() — Fase C, ainda não implementado');
    return [];
  }

  async function moverTarefa(tarefaId, novaColuna, novaOrdem) {
    console.warn('[PR_KANBAN] moverTarefa() — Fase C, ainda não implementado');
  }

  async function criarTarefa(dados) {
    console.warn('[PR_KANBAN] criarTarefa() — Fase C, ainda não implementado');
  }

  async function renderBoard(container, projetoId) {
    // TODO: renderizar colunas com drag-and-drop acessível
    console.warn('[PR_KANBAN] renderBoard() — Fase C, ainda não implementado');
    container.innerHTML = '<p class="aviso">Kanban disponível na Fase C.</p>';
  }

  async function iniciar(db) {
    console.warn('[PR_KANBAN] iniciar() — Fase C, ainda não implementado');
  }

  return { COLUNAS_PADRAO, buscarProjetos, buscarTarefas, moverTarefa, criarTarefa, renderBoard, iniciar };
})();
