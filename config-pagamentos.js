// Pagamento online pelo Asaas (PIX, cartão de crédito, cartão de débito e boleto).
// Este arquivo é PÚBLICO: nunca coloque aqui a chave da API do Asaas nem senhas.
// A chave fica só no servidor (função do Supabase), conforme docs/PAGAMENTOS_ASAAS.md.
//   ativo: false  -> a página "Pagar online" mostra o aviso de que ainda não está disponível.
//   url:   endereço da função, ex.: 'https://SEU-PROJETO.supabase.co/functions/v1/asaas'
window.PR_PAGAMENTOS = {
  ativo: false,
  url: ''
};
