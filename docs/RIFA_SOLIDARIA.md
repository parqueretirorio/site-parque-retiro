# Rifa Solidária

Área **Comissões Parque Retiro > Rifa Solidária** (painel) e página pública **Ajude o Parque > Rifa Solidária**. Código em `rifa.js`; testes em `tests/teste_rifa.py` (43 verificações).

## Como funciona
1. **Cadastrar a rifa** (aba *Rifas*): título, o que será rifado, foto, valor do número, quantidade de números (10, 100 ou 1.000), **dia do sorteio** (Loteria Federal: quartas e sábados), formas de pagamento aceitas e instruções (chave PIX, banco, M$). Marque *Aberta no site*.
2. **Participar** (página pública): a pessoa vê o prêmio, paga, informa nome completo, celular, WhatsApp, e-mail, quantidade, anexa o **comprovante** (imagem ou PDF até 600 KB) e aceita o uso dos dados. Recebe **o(s) número(s) na hora**, sorteados entre os livres, e um código. Pode consultar a situação por e-mail + celular.
3. **Conferir** (aba *Participantes*): o Responsável baixa o comprovante e **Confirma** ou **Recusa** (com motivo; os números voltam a ficar livres). **Só números confirmados concorrem.**
4. **Prestação de Contas**: cada confirmação vira, sozinha, uma Entrada (centro *Campanhas*, origem *Rifa Solidária*), que aparece na planilha consolidada em *Ajude o Parque*. Estornar tira o lançamento. O lançamento não leva o nome do participante, só o código.
5. **Sorteio** (aba *Sorteio*): as inscrições fecham no dia anterior. No dia do sorteio o sistema busca o resultado da Loteria Federal e apura sozinho; se não conseguir, o Responsável digita os 5 prêmios. Depois da apuração, participações não mudam. O Administrador pode **anular** uma apuração (motivo obrigatório; o resultado anterior fica no histórico).
6. **Arrecadação** (aba *Arrecadação*): totais por rifa e forma de pagamento, conferência com a Prestação de Contas, CSV dos participantes.

Quem gerencia: **Administrador** ou quem tiver a responsabilidade **Responsável pela Rifa Solidária** (em Gestão de Responsáveis).

## Regra do sorteio (publicada no site)
O número sorteado é o que termina igual ao 1º prêmio da Federal (2 dígitos para 100 números, 3 para 1.000). Se não foi vendido, vale o 2º prêmio, depois 3º, 4º e 5º. Se nenhum dos cinco foi vendido, ganha o próximo número vendido acima do 1º prêmio (voltando ao início). Implementada na função `vencedor()` de `rifa.js`; qualquer servidor deve repetir exatamente esta lógica.

## O que ainda NÃO está resolvido (leia antes de abrir ao público)
1. **Inscrição de visitante só chega à Comissão com servidor.** Hoje os dados ficam no navegador (`modo: 'local'`): a inscrição fica gravada só no navegador de quem se inscreveu. Por isso, em modo local, a página pública e o painel mostram um aviso de demonstração. Para valer: ligar o servidor (`docs/HOSPEDAGEM.md`) **e** criar uma rota pública de inscrição, porque o visitante não tem login:
   - `POST /publico/rifa/participar` com `{rifa, nome, celular, whatsapp, email, qtd, moeda, comprovante, consentimento}` → o servidor reserva os números **de forma atômica**, grava a participação como `pendente` e devolve `{codigo, numeros}`;
   - leitura pública das rifas abertas (campos sem dados pessoais) e da consulta por e-mail + celular. A leitura pública de coleções é a mesma pendência da Lojinha e do Álbum.
   - Comprovantes devem ir para o armazenamento de arquivos do servidor (hoje viram texto base64 no navegador, ~100 a 150 KB cada, dividindo os ~5 MB do navegador).
   A migração `supabase/migrations/0003_rifa_solidaria.sql` só prepara as coleções e a permissão `rifa`.
2. **"Automático no dia" com o site sem servidor** significa: a apuração roda quando alguém abre o site ou o painel, depois que o resultado da Federal sai (cerca das 19h). Para rodar sozinha, mesmo sem ninguém abrir, é preciso uma tarefa agendada no servidor (cron do cPanel) executando a mesma regra.
3. **Busca do resultado da Loteria Federal não foi testada de verdade.** Esta sessão não tinha internet. O endereço está em `config-dados.js` (`rifa.fontesResultado`); o navegador pode bloquear esse endereço (CORS) ou o formato da resposta pode ser diferente do esperado. O leitor só aceita 5 números de 5 dígitos distintos e data igual à do sorteio; o teste usou um serviço simulado. Se falhar, o Responsável digita os 5 prêmios e a apuração segue igual.
4. **Aspectos legais.** Rifa com venda de números costuma exigir autorização prévia no Brasil (confirmar com a assessoria jurídica do Instituto Pangeia antes de divulgar).
5. **LGPD.** O formulário tem consentimento; o ganhador aparece no site só com nome abreviado (ex.: Maria S.). Falta definir prazo de guarda dos dados e comprovantes (`docs/PLANO.md`, seção LGPD).
