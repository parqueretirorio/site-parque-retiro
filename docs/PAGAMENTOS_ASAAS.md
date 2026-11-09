# Pagamento online com o Asaas

Página pública **Ajude o Parque > Pagar online** (`pagar.html`) + painel do Administrador em **Prestação de Contas > Pagamentos online e maquininha (Asaas)**.
Código: `pagar.js`, `pagamentos-asaas.js`, `config-pagamentos.js` (site) e `supabase/functions/asaas/` (servidor). Testes: `tests/teste_asaas.mjs` (Asaas simulado) e `tests/teste_prestacao_contas.py`.

## Como funciona
1. A pessoa escolhe o que paga (doação, contribuição mensal de manutenção, Livraria, Lojinha, Rifa, Vaquinha, alojamento, atividade ou outro), o valor e informa nome, CPF/CNPJ e e-mail.
2. O site pede a cobrança à **função de servidor**, que fala com o Asaas usando a chave secreta e devolve o link da fatura.
3. A pessoa é levada à tela segura do Asaas e escolhe **PIX, cartão de crédito, cartão de débito ou boleto**. A cobrança é criada com forma `UNDEFINED`, que deixa a pessoa escolher; segundo a documentação do Asaas, nesse modo a opção de cartão de débito fica habilitada na fatura.
4. O Administrador abre a Prestação de Contas, informa a senha de conferência e clica **Buscar recebimentos no Asaas**. Cada pagamento recebido ou confirmado vira uma **Entrada** (moeda *Asaas*, com a forma usada e o nome de quem pagou) e a **tarifa do Asaas** vira uma **Saída** (*Tarifas Bancárias e Taxas Asaas*). O id da cobrança impede lançamento em duplicidade.

## Como ativar (nesta ordem)
1. **Conta Asaas**: comece pelo ambiente *sandbox* (conta de testes) e gere a chave de API em Configurações > Integrações.
2. **Publicar a função** (Supabase CLI): `supabase functions deploy asaas --no-verify-jwt`.
3. **Cadastrar os segredos** (nunca no site): `supabase secrets set ASAAS_API_KEY=... ADMIN_TOKEN=... ALLOWED_ORIGIN=https://www.parqueretiro.org.br ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3`.
   `ADMIN_TOKEN` é a senha de conferência (32+ caracteres); `SUCCESS_URL` é opcional (página de agradecimento, o domínio precisa estar cadastrado no Asaas).
4. **Ligar o site**: em `config-pagamentos.js`, `ativo: true` e `url: 'https://SEU-PROJETO.supabase.co/functions/v1/asaas'`.
5. **Testar no sandbox** com PIX, cartão e boleto de teste; conferir que o recebimento aparece ao buscar na Prestação de Contas.
6. **Produção**: trocar a chave e `ASAAS_BASE_URL=https://api.asaas.com/v3`, refazer um pagamento real de valor baixo.

## Segurança
- A chave do Asaas existe **só** no servidor. `config-pagamentos.js` é público e não leva nenhum segredo.
- A função valida tipo, valor (R$ 5,00 a R$ 50.000,00, ajustável em `VALOR_MIN`/`VALOR_MAX` no `nucleo.js`; confira o mínimo vigente na sua conta), nome, CPF/CNPJ (com dígitos verificadores), e-mail e consentimento; limita 10 tentativas por endereço a cada 10 minutos (barreira simples, por instância) e tem campo-isca contra robôs. Para tráfego público alto, acrescente um CAPTCHA (ex.: Cloudflare Turnstile).
- A busca de recebimentos exige a senha de conferência (comparação de tempo constante). A senha fica só na sessão do navegador do Administrador.
- O site só segue para endereços `asaas.com` devolvidos pela função.

## O que NÃO está resolvido
- **Maquininha física**: não consegui confirmar na documentação do Asaas que as vendas da maquininha apareçam na API de cobranças. Por isso o registro é **manual**: lance a venda escolhendo moeda *Asaas* e forma *Maquininha*, e confira com o extrato do Asaas. Se o Asaas confirmar esse recurso na sua conta, a busca pode ser estendida.
- **Sem webhook**: os recebimentos entram quando o Administrador clica em buscar. O webhook (`PAYMENT_RECEIVED`) só faz sentido quando o armazenamento remoto (`config-dados.js`, modo `remoto`) estiver no ar, porque hoje os lançamentos ficam no navegador do Administrador.
- **Estornos e chargebacks** feitos no Asaas não voltam sozinhos: lance a devolução (*Devolução de Valores*) ou exclua o lançamento.
- **Rifa e Vaquinha** continuam com a conferência de comprovante; o pagamento online delas entra pela página Pagar online (tipo Rifa ou Vaquinha, com o nome na referência) e cai em Vaquinha Coletiva / Rifa Solidária na Prestação de Contas, sem vincular a participação ao gráfico da campanha.
- **Cartão**: o valor aparece como *confirmado* antes de liquidar na conta; a busca importa pagamentos recebidos e confirmados.
- **LGPD e contrato**: o Asaas passa a tratar dados de quem paga; revisar aviso de privacidade, tarifas contratadas e a titularidade da conta (Instituto Pangeia) com a assessoria jurídica/contábil.
- Não testado contra uma conta Asaas real: os testes usam um Asaas simulado. Faça o ensaio no sandbox antes de abrir ao público.

## Prestação de Contas: plano de contas
Todas as entradas e saídas ficam em `plano-contas.js` (16 tipos de entrada, 27 de saída, incluindo os gastos fixos **Luz**, **Internet** e **Limpeza do Parque**). Para criar um tipo novo, acrescente o nome ao grupo certo: formulário e planilha consolidada (modo *Saídas por categoria*) se atualizam sozinhos. A **Contribuição Mensal de Manutenção** por pessoa é cadastrada e conferida mês a mês na própria aba.
