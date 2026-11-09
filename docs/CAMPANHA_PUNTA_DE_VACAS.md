# Campanha Punta de Vacas e Conciliação bancária

## Onde fica
Área restrita › **Comissões Parque Retiro › Campanha Punta de Vacas** (`campanha.js`). Aparece para o administrador, o Responsável Financeiro e o Responsável pelas Atividades.

## Período e calendário
- Informe **início** e **fim** (e, se quiser, uma meta e uma descrição curta) e clique em *Salvar e colocar no calendário*. Só o administrador e o Responsável pelas Atividades alteram as datas.
- A campanha vira uma **atividade do Parque** (coleção `ativ`, tipo *Campanha*, com início e fim) e aparece nos calendários semanal, mensal, trimestral, semestral e anual e na **Comunicação** (botão do megafone e "Próximas atividades sem comunicação planejada"), para a campanha nas redes sociais. Salvar de novo não duplica.
- **Todas as atividades cadastradas em Comissões › Atividades** (inclusive rascunhos, marcadas "(rascunho)") também entram nos calendários, só para leitura ali; edite-as em *Atividades*.

## Quem aportou (só consulta)
A tela mostra total, nº de pessoas, % da meta, barras por pessoa, e a lista de todos os aportes com data, valor, forma e **como entrou** (Prestação de Contas ou Extrato bancário). Há download em CSV. Nada é digitado ali.

## Como o dinheiro entra
1. **Prestação de Contas**: no lançamento, escolha o campo **Campanha**.
2. **Conciliação bancária** (Prestação de Contas › painel "Conciliação bancária"): importe o extrato (`.ofx` ou `.csv`; CSV com colunas Data e Valor, ou Crédito e Débito; aceita UTF-8 e Windows-1252). Para cada linha: **Lançar** (cria a Entrada/Saída, com pessoa, tipo e campanha), **Conciliar** com um lançamento que já existe (mesmo valor, data até 4 dias de diferença; não duplica) ou **Ignorar**. *Desfazer* volta a linha para pendente. Importar o mesmo extrato duas vezes não repete linhas.

Dados: `campanhas`, `extrato_linhas`; lançamentos em `contas` ganham `campanha` e `concil`. Teste: `python3 tests/teste_campanha.py`.
