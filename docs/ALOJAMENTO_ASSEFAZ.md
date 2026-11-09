# Alojamento: ASSEFAZ, recebimentos e relatório

Área restrita > **Alojamento** (antes "Reservas de Alojamento" e "Apenas Alojamento") (Administrador e Responsável de Reservas).

## ASSEFAZ (aba Ocupação, abaixo dos quartos)
A ASSEFAZ é um local externo ao Parque, próximo. Só se usa **depois do pedido e de alinhar com a pessoa**:
1. **Encaminhar**: escolha o pedido (pendente ou confirmado) e o nome da pessoa → fica **Em alinhamento** (não conta como hospedada).
2. **Aceitou** → vira **Confirmada** (conta na ocupação da ASSEFAZ). Se a pessoa já tinha cama no Parque nesse pedido, a cama é liberada.
   **Não quis** → fica registrado como *Não aceitou*.
3. No pedido ainda pendente, as camas do Parque só são pedidas para quem **não** foi confirmado na ASSEFAZ.

## Recebimentos (aba Relatório e recebimentos)
O responsável da área recebe e administra os valores do Alojamento do Parque Retiro e da ASSEFAZ.
Cada recebimento registrado vira uma **Entrada** em Prestação de Contas (centro de custo *Alojamento*, origem *Reservas de Alojamentos*)
e aparece na **planilha consolidada geral**, na linha **Reservas de Alojamentos** (bloco próprio; não entra no subtotal "Ajude o Parque", mas soma em Receitas totais).
Excluir o recebimento remove o lançamento. Pedidos com recebimentos não podem ser excluídos.

## Relatório
Por local (Parque Retiro × ASSEFAZ): hóspedes, diárias (pessoa × noite) e valor recebido por moeda; listas de recebimentos e hospedagens; filtro por período; imprimir e CSV.
Também em *Relatórios Consolidados > Relatórios por módulo > Alojamento / Reservas* (novo relatório "Recebimentos do alojamento" e coluna ASSEFAZ nos pedidos).

## Dados
Tudo fica dentro de cada pedido (`pedidos`): `assefaz[]` e `pag[]`. Não há coleção nova nem migração de banco.
Atenção (modo servidor): `contas` hoje só aceita escrita do administrador no banco; como já ocorre com Rifa e Vaquinha, o Responsável de Reservas precisará de permissão para lançar em `contas`.
Teste: `python3 tests/teste_assefaz.py`.
