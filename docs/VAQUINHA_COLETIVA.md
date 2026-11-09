# Vaquinha Coletiva

Área **Comissões Parque Retiro > Vaquinha Coletiva** (painel) e página pública **Ajude o Parque > Vaquinha Coletiva**. Código em `vaquinha.js`; testes em `tests/teste_vaquinha.py` (40 verificações).

## Como funciona
1. **Cadastrar a vaquinha** (aba *Vaquinhas*): nome, **objetivo**, **meta** em reais, prazo (opcional), formas de pagamento aceitas, **instruções de pagamento** (chave PIX, banco, M$) e **outras formas de ajudar** (opcional, ex.: trabalho voluntário). Marque *Aberta no site*.
2. **Contribuir** (página pública): a pessoa lê o objetivo, vê o gráfico, faz o pagamento do **valor que quiser**, informa nome completo, celular, WhatsApp, e-mail, valor e forma de pagamento, anexa o **comprovante** (imagem ou PDF até 600 KB) e aceita o uso dos dados. Recebe um código e pode consultar a situação por e-mail + celular.
3. **Conferir** (aba *Contribuições*): o Responsável baixa o comprovante e **Confirma** ou **Recusa** (com motivo). Uma confirmada pode ser **estornada** (motivo obrigatório).
4. **Gráfico da campanha**: anel com a **% da meta**, mais **Meta / Arrecadado / Falta**, na página pública e na aba *Arrecadação*. Atualiza a cada confirmação ou estorno. Passando da meta, o gráfico mostra a % real e "meta alcançada".
5. **Planilha consolidada**: cada confirmação vira, sozinha, uma Entrada na Prestação de Contas (centro *Campanhas*, origem *Vaquinha Coletiva*, com o nome da vaquinha). Ela aparece em *Relatórios Consolidados > Orçamento e Fluxo Financeiro*, linha **Vaquinha Coletiva** dentro de **Ajude o Parque**, e no *Resumo por Vaquinha* da Prestação de Contas. Estornar tira o lançamento. O lançamento leva só o código, nunca o nome da pessoa.
6. **Registro manual** (aba *Contribuições*): para valor recebido em mãos ou em espécie. Já entra confirmado, no gráfico e na Prestação de Contas.
7. **Arrecadação**: totais por forma de pagamento, conferência com a Prestação de Contas (com botão *Lançar agora* se faltar algum lançamento), CSV e impressão.

Quem gerencia: **Administrador** ou quem tiver a responsabilidade **Responsável pela Vaquinha Coletiva** (em Gestão de Responsáveis).

## Regras que valem saber
- **Só o confirmado conta** no gráfico e na planilha. Valores aguardando conferência aparecem à parte ("aguardando") e entram quando forem confirmados.
- **M$ (Mumbuca) soma 1 para 1 com o real** no gráfico (a meta é em reais). Na Prestação de Contas cada lançamento continua na sua forma de pagamento.
- **Encerrar** a vaquinha para de receber contribuições, mas o resultado continua visível no site. **Prazo** vencido faz o mesmo. **Cancelar** tira do site (contribuições confirmadas precisam ser estornadas uma a uma).
- Mudar o **nome** da vaquinha atualiza os lançamentos já feitos.

## O que ainda NÃO está resolvido (leia antes de abrir ao público)
1. **Contribuição de visitante só chega à Comissão com servidor.** Hoje os dados ficam no navegador (`modo: 'local'`), igual à Rifa: a contribuição fica gravada só no navegador de quem contribuiu. Por isso, em modo local, a página pública e o painel mostram aviso de demonstração. Para valer: ligar o servidor (`docs/HOSPEDAGEM.md`) **e** criar uma rota pública, porque o visitante não tem login:
   - `POST /publico/vaquinha/contribuir` com `{vaquinha, nome, celular, whatsapp, email, valor, moeda, comprovante, consentimento}` → o servidor grava a contribuição como `pendente` e devolve `{codigo}`;
   - leitura pública das vaquinhas abertas e dos **totais confirmados** (sem dados pessoais), e da consulta por e-mail + celular. É a mesma pendência da Rifa, da Lojinha e do Álbum;
   - comprovantes devem ir para o armazenamento de arquivos do servidor (hoje viram texto base64 no navegador, ~100 a 150 KB cada).
   A migração `supabase/migrations/0004_vaquinha_coletiva.sql` só prepara as coleções (`vaquinhas`, `vaq_part`) e a permissão `vaquinha`.
2. **Aspectos legais.** Arrecadação coletiva em nome do Instituto Pangeia: confirmar com a assessoria jurídica/contábil como os valores devem constar na prestação de contas e se há exigência de recibo.
3. **LGPD.** O formulário tem consentimento e a página pública não mostra nenhum dado pessoal. Falta definir o prazo de guarda dos dados e comprovantes (`docs/PLANO.md`, seção LGPD).
