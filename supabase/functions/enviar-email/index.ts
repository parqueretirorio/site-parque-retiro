// Função de servidor do Supabase: envia e-mails do E-mail marketing (e do convite para a área restrita)
// pelo Gmail do Parque (parqueretirorio@gmail.com), com a senha de app guardada SÓ no servidor.
//
// Quem pode usar: pessoa logada, aprovada, com nível Administrador ou com a responsabilidade "comunicacao".
// A função confere isso sozinha (pergunta ao próprio Supabase quem é o dono do login).
//
// Instalação pelo painel (Edge Functions › Deploy a new function › Via editor):
//   nome: enviar-email   ·   desligar "Verify JWT" (a conferência do login é feita aqui dentro)
// Segredos (Edge Functions › Secrets), digitados direto no painel, nunca em conversa:
//   GMAIL_USER = parqueretirorio@gmail.com
//   GMAIL_APP_PASSWORD = (as 16 letras da senha de app, sem espaços)
// Opcional: REMETENTE_NOME (padrão "Parque de Estudo e Reflexão Retiro")
import nodemailer from 'npm:nodemailer@6.9.16';

declare const Deno: { env: { get(k: string): string | undefined }; serve(h: (r: Request) => Response | Promise<Response>): void };

const ORIGENS = ['https://parqueretirorio.github.io', 'https://parqueretiro.org.br', 'https://www.parqueretiro.org.br'];
const MAX_POR_CHAMADA = 20;
const emailOk = (e: string) => /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/.test(e);

function cors(req: Request): Record<string, string> {
  const o = req.headers.get('origin') || '';
  const ok = ORIGENS.includes(o) || /^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(o);
  return {
    'Access-Control-Allow-Origin': ok ? o : ORIGENS[0],
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, accept, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}
const resp = (req: Request, status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } });

async function quemPode(req: Request): Promise<string | null> {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const apikey = req.headers.get('apikey') || Deno.env.get('SUPABASE_ANON_KEY') || '';
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!url || !apikey || !token) return null;
  const u = await fetch(url + '/auth/v1/user', { headers: { apikey, Authorization: 'Bearer ' + token } });
  if (!u.ok) return null;
  const user = await u.json();
  const p = await fetch(url + '/rest/v1/perfis?select=nivel,status,funcoes&id=eq.' + encodeURIComponent(user.id),
    { headers: { apikey, Authorization: 'Bearer ' + token, Accept: 'application/json' } });
  if (!p.ok) return null;
  const [perfil] = await p.json();
  if (!perfil || perfil.status !== 'aprovado') return null;
  if (perfil.nivel === 'administrador' || (perfil.funcoes || []).includes('comunicacao')) return String(user.email || '');
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return resp(req, 405, { erro: 'Use POST.' });

  const quem = await quemPode(req);
  if (!quem) return resp(req, 403, { erro: 'Só o administrador ou o Responsável pela Comunicação pode enviar.' });

  const user = Deno.env.get('GMAIL_USER') || '', senha = (Deno.env.get('GMAIL_APP_PASSWORD') || '').replace(/\s+/g, '');
  if (!user || !senha) return resp(req, 503, { erro: 'nao-configurado' });

  let corpo: { mensagens?: Array<{ para: string; nome?: string; assunto: string; html: string; texto?: string }> };
  try { corpo = await req.json(); } catch { return resp(req, 400, { erro: 'Pedido inválido.' }); }
  const msgs = Array.isArray(corpo.mensagens) ? corpo.mensagens.slice(0, MAX_POR_CHAMADA) : [];
  if (!msgs.length) return resp(req, 400, { erro: 'Nenhuma mensagem.' });

  const nomeRem = Deno.env.get('REMETENTE_NOME') || 'Parque de Estudo e Reflexão Retiro';
  const t = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass: senha } });
  const enviados: string[] = [], falhas: Array<{ email: string; erro: string }> = [];
  for (const m of msgs) {
    const para = String(m.para || '').trim().toLowerCase();
    if (!emailOk(para) || !m.assunto || !m.html || String(m.html).length > 300000) { falhas.push({ email: para, erro: 'dados inválidos' }); continue; }
    try {
      await t.sendMail({
        from: { name: nomeRem, address: user }, replyTo: user,
        to: m.nome ? { name: String(m.nome).slice(0, 120), address: para } : para,
        subject: String(m.assunto).slice(0, 200), html: String(m.html), text: m.texto ? String(m.texto) : undefined,
      });
      enviados.push(para);
    } catch (e) {
      falhas.push({ email: para, erro: String((e as Error).message || e).slice(0, 200) });
      if (/Invalid login|Username and Password not accepted|EAUTH/i.test(String((e as Error).message || ''))) // senha errada: não adianta seguir
        return resp(req, 502, { erro: 'O Gmail recusou a senha de app. Confira o segredo GMAIL_APP_PASSWORD no Supabase.', enviados, falhas });
    }
  }
  console.log(`enviar-email: ${quem} enviou ${enviados.length}, falhas ${falhas.length}`);
  return resp(req, 200, { enviados, falhas });
});
