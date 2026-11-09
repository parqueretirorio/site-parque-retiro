// Plano de contas do Parque Retiro: todas as ENTRADAS e SAÍDAS previstas na Prestação de Contas.
// Cada item é a "origem" gravada no lançamento e a linha usada na planilha consolidada (Orçamento e Fluxo Financeiro).
// Para criar um item novo, basta acrescentá-lo à lista do grupo certo (ou criar um grupo): as telas se atualizam sozinhas.
window.PR_PLANO = {
  ENTRADAS: [
    { grupo: 'Ajude o Parque', itens: ['Doação', 'Livraria', 'Lojinha', 'Rifa Solidária', 'Vaquinha Coletiva'] },
    { grupo: 'Alojamento', itens: ['Reservas de Alojamentos'] },
    { grupo: 'Contribuição das pessoas', itens: ['Manutenção Mensal'] },
    { grupo: 'Atividades e serviços do Parque', itens: ['Atividades e Retiros', 'Alimentação e Refeições', 'Cessão de Espaço'] },
    { grupo: 'Apoios e repasses', itens: ['Patrocínio e Apoio', 'Convênios e Editais', 'Repasse do Instituto Pangeia'] },
    { grupo: 'Outras entradas', itens: ['Rendimentos Financeiros', 'Reembolso Recebido', 'Outras entradas'] }
  ],
  SAIDAS: [
    { grupo: 'Gastos fixos', itens: ['Luz', 'Internet', 'Limpeza do Parque', 'Água e Esgoto', 'Gás', 'Taxas e Impostos', 'Seguros'] },
    { grupo: 'Manutenção do Parque', itens: ['Jardinagem e Área Externa', 'Reparos e Manutenção Predial', 'Material de Limpeza e Higiene', 'Ferramentas e Equipamentos', 'Combustível e Transporte'] },
    { grupo: 'Atividades e Alojamento', itens: ['Alimentação e Refeições', 'Atividades e Retiros', 'Enxoval e Lavanderia'] },
    { grupo: 'Obras', itens: ['Obras e Construção', 'Materiais de Construção'] },
    { grupo: 'Livraria e Lojinha', itens: ['Compra de Livros e Insumos', 'Produção da Lojinha'] },
    { grupo: 'Administrativas e financeiras', itens: ['Serviços de Terceiros', 'Comunicação, Site e Domínio', 'Material de Escritório', 'Contabilidade e Jurídico', 'Tarifas Bancárias e Taxas Asaas', 'Devolução de Valores', 'Repasse ao Instituto Pangeia', 'Outras saídas'] }
  ],
  // Centro de custo sugerido ao escolher o tipo (só preenche se a pessoa ainda não escolheu).
  CENTRO_SUGERIDO: {
    'Entrada|Doação': 'Manutenção', 'Entrada|Livraria': 'Livraria e Lojinha', 'Entrada|Lojinha': 'Livraria e Lojinha', 'Entrada|Rifa Solidária': 'Campanhas', 'Entrada|Vaquinha Coletiva': 'Campanhas',
    'Entrada|Reservas de Alojamentos': 'Alojamento', 'Entrada|Manutenção Mensal': 'Manutenção', 'Entrada|Atividades e Retiros': 'Eventos', 'Entrada|Alimentação e Refeições': 'Eventos', 'Entrada|Cessão de Espaço': 'Manutenção',
    'Saída|Luz': 'Manutenção', 'Saída|Internet': 'Manutenção', 'Saída|Limpeza do Parque': 'Manutenção', 'Saída|Água e Esgoto': 'Manutenção', 'Saída|Gás': 'Manutenção', 'Saída|Taxas e Impostos': 'Manutenção', 'Saída|Seguros': 'Manutenção',
    'Saída|Jardinagem e Área Externa': 'Manutenção', 'Saída|Reparos e Manutenção Predial': 'Manutenção', 'Saída|Material de Limpeza e Higiene': 'Manutenção', 'Saída|Ferramentas e Equipamentos': 'Manutenção', 'Saída|Combustível e Transporte': 'Manutenção',
    'Saída|Alimentação e Refeições': 'Eventos', 'Saída|Atividades e Retiros': 'Eventos', 'Saída|Enxoval e Lavanderia': 'Alojamento',
    'Saída|Obras e Construção': 'Construção', 'Saída|Materiais de Construção': 'Construção',
    'Saída|Compra de Livros e Insumos': 'Livraria e Lojinha', 'Saída|Produção da Lojinha': 'Livraria e Lojinha'
  },
  // Formas detalhadas quando o dinheiro passa pelo Asaas.
  FORMAS_ASAAS: { PIX: 'PIX', BOLETO: 'Boleto', CARTAO_CREDITO: 'Cartão de crédito', CARTAO_DEBITO: 'Cartão de débito', MAQUININHA: 'Maquininha (presencial no Parque)' }
};
