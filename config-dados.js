// Onde os dados moram. Troque SOMENTE esta linha quando o servidor existir.
//   modo: 'local'  -> navegador (localStorage). É o comportamento atual; nada muda.
//   modo: 'remoto' -> servidor que fale o contrato de docs/API_CONTRATO.md (PHP+MySQL etc.).
//   modo: 'supabase' -> login real e dados da área restrita no Supabase (Fase 1, adaptador-supabase.js).
//   Para TESTAR o Supabase só neste navegador, sem mudar esta linha: abra login.html?servidor=1 (volta com ?servidor=0).
// Não coloque senhas nem chaves secretas aqui: este arquivo é público.
window.PR_CONFIG_DADOS = {
  modo: 'supabase', // ligado para todos em 11/11/2026 (no localhost continua 'local' para testes)
  url: '',            // ex.: 'https://www.parqueretiro.org.br/conecta/api'
  token: null,
  // Banco do Parque no Supabase (São Paulo). A chave "publishable" é PÚBLICA por natureza: a proteção dos dados
  // vem das regras RLS do banco. NUNCA coloque aqui a "secret key" (sb_secret_...) nem a service_role.
  // Usados quando modo for 'supabase' (ou no teste com login.html?servidor=1). Exige a migração 0010 no banco.
  supabase: {
    url: 'https://yhzsuokwglznehvbclwd.supabase.co',
    chavePublica: 'sb_publishable_0ctrZKumwET1OtLe7jVMKw_AxyzJAuR'
  },        // string, ou função () => 'token da sessão' (definida pelo login real, fase seguinte)
  // Contato direto: chat ao vivo (Tawk.to) + e-mail, no lugar do botão do WhatsApp (o Canal e a Comunidade do WhatsApp não mudam).
  // Para ligar: ativo: true e id = 'PROPRIEDADE/WIDGET' (do endereço do widget no Tawk.to, Administração › Widget de chat).
  // Esse código é público (não é senha). Enquanto ativo for false, o botão do WhatsApp continua como está.
  livechat: { provedor: 'tawkto', ativo: false, id: '', email: 'parqueretirorio@gmail.com' },
  // Rifa Solidária: de onde buscar o resultado da Loteria Federal para apurar o sorteio automaticamente.
  // Se o serviço não responder (ou o navegador bloquear), o Responsável digita os 5 prêmios na aba Sorteio.
  rifa: { fontesResultado: ['https://servicebus2.caixa.gov.br/portaldeloterias/api/federal/'] }
};
