// Onde os dados moram. Troque SOMENTE esta linha quando o servidor existir.
//   modo: 'local'  -> navegador (localStorage). É o comportamento atual; nada muda.
//   modo: 'remoto' -> servidor que fale o contrato de docs/API_CONTRATO.md (PHP+MySQL, Supabase, etc.).
// Não coloque senhas nem chaves secretas aqui: este arquivo é público.
window.PR_CONFIG_DADOS = {
  modo: 'local',
  url: '',            // ex.: 'https://www.parqueretiro.org.br/conecta/api'
  token: null,
  // Banco do Parque no Supabase (São Paulo). A chave "publishable" é PÚBLICA por natureza: a proteção dos dados
  // vem das regras RLS do banco. NUNCA coloque aqui a "secret key" (sb_secret_...) nem a service_role.
  // Enquanto modo for 'local', estes dados ainda não são usados (o adaptador Supabase está em desenvolvimento).
  supabase: {
    url: 'https://yhzsuokwglznehvbclwd.supabase.co',
    chavePublica: 'sb_publishable_0ctrZKumwET1OtLe7jVMKw_AxyzJAuR'
  },        // string, ou função () => 'token da sessão' (definida pelo login real, fase seguinte)
  // Rifa Solidária: de onde buscar o resultado da Loteria Federal para apurar o sorteio automaticamente.
  // Se o serviço não responder (ou o navegador bloquear), o Responsável digita os 5 prêmios na aba Sorteio.
  rifa: { fontesResultado: ['https://servicebus2.caixa.gov.br/portaldeloterias/api/federal/'] }
};
