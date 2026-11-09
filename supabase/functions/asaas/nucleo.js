// Núcleo da integração com o Asaas. Roda igual no Supabase Edge Function (Deno) e no Node 18+ (testes):
// usa só fetch, Request e Response padrão. A CHAVE DA API só existe aqui, no servidor, via variáveis de ambiente:
//   ASAAS_API_KEY   chave da API do Asaas (sandbox ou produção)
//   ASAAS_BASE_URL  https://api-sandbox.asaas.com/v3 (padrão) ou https://api.asaas.com/v3 (produção)
//   ADMIN_TOKEN     senha de conferência usada pela Prestação de Contas para buscar recebimentos (use 32+ caracteres)
//   ALLOWED_ORIGIN  site que pode chamar a função, ex.: https://www.parqueretiro.org.br
//   SUCCESS_URL     (opcional) página para onde o Asaas devolve a pessoa depois de pagar; o domínio precisa estar cadastrado no Asaas
export const TIPOS = ['doacao', 'manutencao', 'livraria', 'lojinha', 'rifa', 'vaquinha', 'alojamento', 'atividade', 'outro'];
const ROTULO = { doacao: 'Doação', manutencao: 'Contribuição mensal de manutenção', livraria: 'Compra na Livraria', lojinha: 'Compra na Lojinha', rifa: 'Rifa Solidária', vaquinha: 'Vaquinha Coletiva', alojamento: 'Reserva de alojamento', atividade: 'Atividade ou retiro', outro: 'Outro pagamento' };
export const VALOR_MIN = 5, VALOR_MAX = 50000;
const LIMITE = { janelaMs: 10 * 60 * 1000, max: 10 };

const soDigitos = s => String(s || '').replace(/\D/g, '');
export function cpfCnpjValido(v) {
  const d = soDigitos(v);
  if (/^(\d)\1+$/.test(d)) return false;
  const dig = (base, pesos) => { const s = base.split('').reduce((t, n, i) => t + (+n) * pesos[i], 0) % 11; return s < 2 ? 0 : 11 - s; };
  if (d.length === 11) return dig(d.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]) === +d[9] && dig(d.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) === +d[10];
  if (d.length === 14) return dig(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === +d[12] && dig(d.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === +d[13];
  return false;
}
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e || '');
const limpa = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const hojeISO = () => new Date().toISOString().slice(0, 10);
const maisDias = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const igual = (a, b) => { a = String(a || ''); b = String(b || ''); if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
const FORMA = { PIX: 'PIX', BOLETO: 'BOLETO', CREDIT_CARD: 'CARTAO_CREDITO', DEBIT_CARD: 'CARTAO_DEBITO' };

export function criarNucleo({ fetch: f, env }) {
  const e = k => (typeof env === 'function' ? env(k) : (env || {})[k]) || '';
  const base = () => (e('ASAAS_BASE_URL') || 'https://api-sandbox.asaas.com/v3').replace(/\/+$/, '');
  const tentativas = new Map(); // limitador simples em memória (cada instância tem o seu; é só uma barreira extra)

  const cors = req => {
    const o = e('ALLOWED_ORIGIN'), origem = req.headers.get('origin') || '';
    return { 'Access-Control-Allow-Origin': o && origem === o ? o : (o || 'null'), 'Access-Control-Allow-Headers': 'content-type, x-admin-token', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', Vary: 'Origin' };
  };
  const json = (req, status, corpo) => new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors(req) } });

  async function asaas(metodo, caminho, corpo) {
    const chave = e('ASAAS_API_KEY');
    if (!chave) throw Object.assign(new Error('Servidor sem ASAAS_API_KEY.'), { status: 500 });
    const r = await f(base() + caminho, { method: metodo, headers: { 'Content-Type': 'application/json', access_token: chave, 'User-Agent': 'ParqueRetiro-Site/1.0' }, body: corpo ? JSON.stringify(corpo) : undefined });
    let j = null; try { j = await r.json(); } catch (x) { /* corpo vazio */ }
    if (!r.ok) { const msg = j && j.errors && j.errors[0] && j.errors[0].description; throw Object.assign(new Error(msg || ('Asaas respondeu ' + r.status)), { status: r.status === 400 ? 400 : 502, asaas: true }); }
    return j;
  }

  async function clienteDe({ nome, cpfCnpj, email, celular }) {
    const achado = await asaas('GET', '/customers?cpfCnpj=' + soDigitos(cpfCnpj) + '&limit=1');
    if (achado && achado.data && achado.data[0]) return achado.data[0].id;
    const c = await asaas('POST', '/customers', { name: nome, cpfCnpj: soDigitos(cpfCnpj), email, mobilePhone: soDigitos(celular) || undefined, notificationDisabled: false });
    return c.id;
  }

  async function criarCobranca(req) {
    const ip = (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim(), agora = Date.now();
    const lista = (tentativas.get(ip) || []).filter(t => agora - t < LIMITE.janelaMs);
    if (lista.length >= LIMITE.max) return json(req, 429, { erro: 'Muitas tentativas. Aguarde alguns minutos.' });
    lista.push(agora); tentativas.set(ip, lista);
    let d; try { d = await req.json(); } catch (x) { return json(req, 400, { erro: 'Pedido inválido.' }); }
    if (d && d.site) return json(req, 400, { erro: 'Pedido inválido.' }); // campo-isca para robôs
    const tipo = String(d.tipo || ''), valor = Math.round(Number(d.valor) * 100) / 100, nome = limpa(d.nome, 100), email = limpa(d.email, 120), referencia = limpa(d.referencia, 120);
    if (!TIPOS.includes(tipo)) return json(req, 400, { erro: 'Tipo de pagamento inválido.' });
    if (!(valor >= VALOR_MIN && valor <= VALOR_MAX)) return json(req, 400, { erro: `O valor deve estar entre R$ ${VALOR_MIN},00 e R$ ${VALOR_MAX.toLocaleString('pt-BR')},00.` });
    if (nome.split(' ').length < 2) return json(req, 400, { erro: 'Informe o nome completo.' });
    if (!cpfCnpjValido(d.cpfCnpj)) return json(req, 400, { erro: 'CPF ou CNPJ inválido.' });
    if (!emailOk(email)) return json(req, 400, { erro: 'E-mail inválido.' });
    if (d.consentimento !== true) return json(req, 400, { erro: 'É preciso autorizar o uso dos dados para este pagamento.' });
    try {
      const customer = await clienteDe({ nome, cpfCnpj: d.cpfCnpj, email, celular: d.celular });
      const corpo = { customer, billingType: 'UNDEFINED', value: valor, dueDate: maisDias(3), description: (ROTULO[tipo] + (referencia ? ': ' + referencia : '')).slice(0, 200), externalReference: ('PR|' + tipo + '|' + referencia).slice(0, 100) };
      if (e('SUCCESS_URL')) corpo.callback = { successUrl: e('SUCCESS_URL'), autoRedirect: true };
      const p = await asaas('POST', '/payments', corpo);
      return json(req, 200, { id: p.id, invoiceUrl: p.invoiceUrl, valor });
    } catch (x) {
      return json(req, x.status === 400 ? 400 : 502, { erro: x.asaas ? x.message : 'Não foi possível gerar o pagamento agora. Tente de novo em instantes.' });
    }
  }

  async function recebimentos(req) {
    const t = e('ADMIN_TOKEN');
    if (t.length < 16 || !igual(req.headers.get('x-admin-token'), t)) return json(req, 401, { erro: 'Senha de conferência inválida.' });
    const desde = new URL(req.url).searchParams.get('desde') || '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(desde)) return json(req, 400, { erro: 'Informe desde=AAAA-MM-DD.' });
    try {
      const itens = [], clientes = new Map();
      for (const status of ['RECEIVED', 'CONFIRMED']) {
        for (let off = 0, mais = true; mais && off < 1000; off += 100) {
          const r = await asaas('GET', `/payments?status=${status}&paymentDate[ge]=${desde}&limit=100&offset=${off}`);
          (r.data || []).forEach(p => itens.push(p)); mais = !!r.hasMore;
        }
      }
      const vistos = new Set(), saida = [];
      for (const p of itens) {
        const data = String(p.paymentDate || p.clientPaymentDate || p.confirmedDate || '').slice(0, 10);
        if (!p.id || vistos.has(p.id) || !data || data < desde) continue;
        vistos.add(p.id);
        if (p.customer && !clientes.has(p.customer) && clientes.size < 80) { try { clientes.set(p.customer, (await asaas('GET', '/customers/' + p.customer)).name || ''); } catch (x) { clientes.set(p.customer, ''); } }
        const ext = String(p.externalReference || '').split('|'), tipo = ext[0] === 'PR' && TIPOS.includes(ext[1]) ? ext[1] : 'outro';
        saida.push({ id: p.id, valor: p.value, liquido: p.netValue, data, forma: FORMA[p.billingType] || '', tipo, referencia: tipo === 'outro' && !ext[2] ? limpa(p.description, 120) : limpa(ext.slice(2).join('|'), 120), nome: clientes.get(p.customer) || '' });
      }
      return json(req, 200, { recebimentos: saida });
    } catch (x) { return json(req, 502, { erro: x.asaas ? x.message : 'Não foi possível consultar o Asaas agora.' }); }
  }

  async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    const caminho = new URL(req.url).pathname.replace(/\/+$/, '');
    if (req.method === 'POST' && caminho.endsWith('/criar-cobranca')) return criarCobranca(req);
    if (req.method === 'GET' && caminho.endsWith('/recebimentos')) return recebimentos(req);
    return json(req, 404, { erro: 'Não encontrado.' });
  }
  return { handler };
}
