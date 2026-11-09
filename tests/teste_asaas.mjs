// Teste da integração com o Asaas (sem rede: o Asaas é simulado).
// Rodar a partir da pasta do site:  node tests/teste_asaas.mjs
import { criarNucleo, cpfCnpjValido } from '../supabase/functions/asaas/nucleo.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const A = require('../pagamentos-asaas.js');
let falhas = 0;
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHOU ') + m); if (!c) falhas++; };

// ---- Asaas simulado ----
const chamadas = [];
const pagamentosAsaas = [
  { id: 'pay_1', value: 100, netValue: 98.01, billingType: 'PIX', status: 'RECEIVED', paymentDate: '2026-10-05', customer: 'cus_1', externalReference: 'PR|doacao|', description: 'Doação' },
  { id: 'pay_2', value: 50, netValue: 48.2, billingType: 'CREDIT_CARD', status: 'CONFIRMED', paymentDate: '2026-10-06', customer: 'cus_2', externalReference: 'PR|vaquinha|Vaquinha Manutenção da Grama' },
  { id: 'pay_3', value: 30, netValue: 30, billingType: 'BOLETO', status: 'RECEIVED', paymentDate: '2026-09-01', customer: 'cus_1', externalReference: '', description: 'Antigo' },
  { id: 'pay_4', value: 80, netValue: 79, billingType: 'DEBIT_CARD', status: 'RECEIVED', paymentDate: '2026-10-07', customer: 'cus_3', externalReference: '', description: 'Venda criada direto no painel do Asaas' }
];
const fetchFalso = async (url, op = {}) => {
  const u = new URL(url), corpo = op.body ? JSON.parse(op.body) : null;
  chamadas.push({ metodo: op.method || 'GET', caminho: u.pathname + u.search, h: op.headers, corpo });
  const res = (status, j) => new Response(JSON.stringify(j), { status });
  if (op.headers.access_token !== 'chave-secreta-teste') return res(401, { errors: [{ description: 'chave inválida' }] });
  if (u.pathname === '/v3/customers' && (op.method || 'GET') === 'GET') return res(200, { data: u.searchParams.get('cpfCnpj') === '52998224725' ? [{ id: 'cus_existente' }] : [] });
  if (u.pathname === '/v3/customers' && op.method === 'POST') return res(200, { id: 'cus_novo' });
  if (u.pathname.startsWith('/v3/customers/')) return res(200, { name: { cus_1: 'Maria da Silva', cus_2: 'João Souza', cus_3: 'Ana Lima' }[u.pathname.split('/').pop()] });
  if (u.pathname === '/v3/payments' && op.method === 'POST') return res(200, { id: 'pay_novo', invoiceUrl: 'https://sandbox.asaas.com/i/abc123' });
  if (u.pathname === '/v3/payments') { const st = u.searchParams.get('status'); return res(200, { data: pagamentosAsaas.filter(p => p.status === st), hasMore: false }); }
  return res(404, {});
};
const env = { ASAAS_API_KEY: 'chave-secreta-teste', ADMIN_TOKEN: 'senha-de-conferencia-com-32-caracteres', ALLOWED_ORIGIN: 'https://www.parqueretiro.org.br', SUCCESS_URL: 'https://www.parqueretiro.org.br/obrigado.html' };
const { handler } = criarNucleo({ fetch: fetchFalso, env });
const post = (corpo, ip = '1.1.1.1') => handler(new Request('https://x.supabase.co/functions/v1/asaas/criar-cobranca', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, origin: env.ALLOWED_ORIGIN }, body: JSON.stringify(corpo) }));
const valido = { tipo: 'doacao', valor: 100, nome: 'Maria da Silva', cpfCnpj: '529.982.247-25', email: 'maria@exemplo.com', celular: '(21) 99999-0000', referencia: '', consentimento: true };

// ---- CPF/CNPJ ----
ok(cpfCnpjValido('529.982.247-25') && cpfCnpjValido('11.222.333/0001-81'), 'aceita CPF e CNPJ válidos');
ok(!cpfCnpjValido('111.111.111-11') && !cpfCnpjValido('123') && !cpfCnpjValido('529.982.247-26'), 'recusa CPF repetido, curto e com dígito errado');

// ---- criar cobrança ----
let r = await post(valido), j = await r.json();
ok(r.status === 200 && j.invoiceUrl === 'https://sandbox.asaas.com/i/abc123' && j.id === 'pay_novo', 'cria a cobrança e devolve o link da fatura do Asaas');
const cria = chamadas.find(c => c.metodo === 'POST' && c.caminho === '/v3/payments');
ok(cria.corpo.billingType === 'UNDEFINED', 'cobrança deixa a pessoa escolher PIX, cartão (crédito/débito) ou boleto');
ok(cria.corpo.customer === 'cus_existente', 'reaproveita o cliente já cadastrado pelo CPF');
ok(cria.corpo.externalReference === 'PR|doacao|' && cria.corpo.value === 100 && cria.corpo.callback.autoRedirect === true, 'grava a referência do Parque, o valor e a URL de retorno');
ok(cria.h['User-Agent'] && cria.h.access_token === 'chave-secreta-teste', 'envia a chave só no servidor e o User-Agent exigido');
ok(!JSON.stringify(j).includes('chave-secreta'), 'a resposta pública não vaza a chave');
r = await post({ ...valido, cpfCnpj: '11.222.333/0001-81' }); await r.json();
ok(chamadas.some(c => c.metodo === 'POST' && c.caminho === '/v3/customers' && c.corpo.cpfCnpj === '11222333000181'), 'cria o cliente quando o CPF/CNPJ é novo');
for (const [rot, mud, trecho] of [['tipo inválido', { tipo: 'hack' }, 'Tipo'], ['valor abaixo do mínimo', { valor: 2 }, 'valor'], ['valor acima do máximo', { valor: 99999 }, 'valor'], ['nome sem sobrenome', { nome: 'Maria' }, 'nome'], ['CPF inválido', { cpfCnpj: '123' }, 'CPF'], ['e-mail inválido', { email: 'x' }, 'E-mail'], ['sem consentimento', { consentimento: false }, 'autorizar'], ['campo-isca preenchido', { site: 'http://spam' }, 'inválido']]) {
  const x = await post({ ...valido, ...mud }); const y = await x.json();
  ok(x.status === 400 && y.erro.includes(trecho), 'recusa ' + rot);
}
const antes = chamadas.length; await post({ ...valido, valor: 2 }); ok(chamadas.length === antes, 'pedido inválido não chega ao Asaas');
let ultimo; for (let i = 0; i < 12; i++) ultimo = await post({ ...valido, valor: 2 }, '9.9.9.9'); ok(ultimo.status === 429, 'limita tentativas repetidas do mesmo endereço');
ok((await handler(new Request('https://x/asaas/criar-cobranca', { method: 'OPTIONS', headers: { origin: env.ALLOWED_ORIGIN } }))).headers.get('access-control-allow-origin') === env.ALLOWED_ORIGIN, 'CORS libera só o site do Parque');
const semChave = criarNucleo({ fetch: fetchFalso, env: { ...env, ASAAS_API_KEY: '' } }); const rs = await semChave.handler(new Request('https://x/asaas/criar-cobranca', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(valido) }));
ok(rs.status === 502 && !(await rs.text()).includes('ASAAS_API_KEY'), 'sem chave no servidor: erro genérico, sem detalhe interno');

// ---- recebimentos ----
const get = (q, tk) => handler(new Request('https://x/functions/v1/asaas/recebimentos' + q, { headers: tk ? { 'x-admin-token': tk } : {} }));
ok((await get('?desde=2026-10-01')).status === 401 && (await get('?desde=2026-10-01', 'errada')).status === 401, 'recebimentos exige a senha de conferência');
ok((await get('?desde=ontem', env.ADMIN_TOKEN)).status === 400, 'exige data inicial válida');
const lista = (await (await get('?desde=2026-10-01', env.ADMIN_TOKEN)).json()).recebimentos;
ok(lista.length === 3 && !lista.some(p => p.id === 'pay_3'), 'traz recebidos e confirmados a partir da data (o de setembro fica de fora)');
const p1 = lista.find(p => p.id === 'pay_1'), p2 = lista.find(p => p.id === 'pay_2'), p4 = lista.find(p => p.id === 'pay_4');
ok(p1.forma === 'PIX' && p2.forma === 'CARTAO_CREDITO' && p4.forma === 'CARTAO_DEBITO', 'identifica PIX, cartão de crédito e cartão de débito');
ok(p1.nome === 'Maria da Silva' && p1.tipo === 'doacao' && p2.tipo === 'vaquinha' && p2.referencia === 'Vaquinha Manutenção da Grama', 'devolve nome, tipo e referência');
ok(p4.tipo === 'outro' && p4.referencia.includes('painel do Asaas'), 'cobrança criada direto no Asaas entra como "outro"');

// ---- importação para a Prestação de Contas ----
let contas = [{ id: 'x', asaas: '' }];
let res = A.importar(lista, contas, { uid: (() => { let n = 0; return () => 'id' + (++n); })() });
const ent = res.novas.filter(c => c.tipo === 'Entrada'), sai = res.novas.filter(c => c.tipo === 'Saída');
ok(ent.length === 3 && sai.length === 3, 'cada recebimento vira uma Entrada e a tarifa do Asaas vira uma Saída');
ok(ent.every(c => c.moeda === 'ASAAS') && ent.find(c => c.asaas === 'pay_1').origem === 'Doação' && ent.find(c => c.asaas === 'pay_2').origem === 'Vaquinha Coletiva' && ent.find(c => c.asaas === 'pay_2').vaquinha === 'Vaquinha Manutenção da Grama' && ent.find(c => c.asaas === 'pay_4').origem === 'Outras entradas', 'origem e centro de custo corretos por tipo');
ok(sai.find(c => c.asaas === 'pay_1:tarifa').valor === 1.99 && sai[0].origem === 'Tarifas Bancárias e Taxas Asaas', 'tarifa = valor menos o líquido (R$ 1,99)');
ok(ent.find(c => c.asaas === 'pay_1').pessoa === 'Maria da Silva' && ent.find(c => c.asaas === 'pay_1').forma === 'PIX', 'guarda quem pagou e a forma de pagamento');
contas = contas.concat(res.novas);
res = A.importar(lista, contas); ok(res.novas.length === 0 && res.repetidas === 3, 'importar de novo não duplica nada');
res = A.importar(lista.slice(0, 1), [], { tarifa: false }); ok(res.novas.length === 1, 'tarifa pode ser desligada');
const man = A.importar([{ id: 'pay_9', valor: 60, liquido: 60, data: '2026-10-09', forma: 'PIX', tipo: 'manutencao', nome: 'Carlos Lima' }], []).novas[0];
ok(man.origem === 'Manutenção Mensal' && man.ref === '2026-10' && man.pessoa === 'Carlos Lima', 'manutenção mensal pelo Asaas já vem com pessoa e mês de referência');
ok(A.importar([{ id: 'a', valor: -5, data: '2026-10-01' }, { id: 'b', valor: 5, data: 'hoje' }, null], []).novas.length === 0, 'ignora recebimentos inválidos');
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTUDO OK'); process.exit(falhas ? 1 : 0);
