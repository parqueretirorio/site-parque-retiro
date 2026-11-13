// Função de servidor do Supabase: guarda as fotos do Álbum na Cloudflare R2 (10 GB grátis, tráfego grátis).
// O navegador NUNCA vê a chave da Cloudflare: ele pede aqui um endereço de envio assinado (vale 1 hora, só para
// aquele arquivo) e manda a foto direto para a R2. Também apaga fotos e informa o espaço usado.
//
// Quem pode usar: pessoa logada, aprovada, Administrador ou com a responsabilidade "album".
//
// Instalação pelo painel (Edge Functions › Deploy a new function › Via editor):
//   nome: album-r2   ·   desligar "Verify JWT" (a conferência do login é feita aqui dentro)
// Segredos (Edge Functions › Secrets), copiados da Cloudflare direto para o painel, nunca em conversa:
//   R2_ACCOUNT_ID        = número da conta Cloudflare (aparece na página da R2)
//   R2_ACCESS_KEY_ID     = "Access Key ID" do token da R2
//   R2_SECRET_ACCESS_KEY = "Secret Access Key" do token da R2
//   R2_BUCKET            = parque-retiro-album
//   R2_PUBLIC_URL        = endereço público do bucket (ex.: https://pub-xxxx.r2.dev)
import { AwsClient } from 'npm:aws4fetch@1.0.20';

const ORIGENS = ['https://parqueretirorio.github.io', 'https://parqueretiro.org.br', 'https://www.parqueretiro.org.br'];
const CAMINHO = /^[a-z0-9_-]{1,40}\/\d{4}-\d{2}\/[a-z0-9]{6,40}(-mini)?\.jpg$/i;
const MAX_ASSINAR = 20, MAX_APAGAR = 100;

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
  if (perfil.nivel === 'administrador' || (perfil.funcoes || []).includes('album')) return String(user.email || '');
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return resp(req, 405, { erro: 'Use POST.' });
  if (!(await quemPode(req))) return resp(req, 403, { erro: 'Só o administrador ou o Responsável pelo Álbum pode enviar fotos.' });

  const conta = Deno.env.get('R2_ACCOUNT_ID') || '', chave = Deno.env.get('R2_ACCESS_KEY_ID') || '',
    segredo = Deno.env.get('R2_SECRET_ACCESS_KEY') || '', bucket = Deno.env.get('R2_BUCKET') || '',
    publico = (Deno.env.get('R2_PUBLIC_URL') || '').replace(/\/+$/, '');
  if (!conta || !chave || !segredo || !bucket || !/^https:\/\//.test(publico)) return resp(req, 503, { erro: 'nao-configurado' });
  const aws = new AwsClient({ accessKeyId: chave, secretAccessKey: segredo, service: 's3', region: 'auto' });
  const base = `https://${conta}.r2.cloudflarestorage.com/${bucket}`;
  const enc = (c: string) => c.split('/').map(encodeURIComponent).join('/');

  let corpo: { acao?: string; arquivos?: Array<{ caminho: string }>; caminhos?: string[] };
  try { corpo = await req.json(); } catch { return resp(req, 400, { erro: 'Pedido inválido.' }); }

  if (corpo.acao === 'assinar') {
    const arqs = (Array.isArray(corpo.arquivos) ? corpo.arquivos : []).slice(0, MAX_ASSINAR).filter(a => CAMINHO.test(String(a.caminho || '')));
    if (!arqs.length) return resp(req, 400, { erro: 'Nenhum arquivo válido.' });
    const out = [];
    for (const a of arqs) {
      const u = new URL(`${base}/${enc(a.caminho)}`); u.searchParams.set('X-Amz-Expires', '3600');
      const s = await aws.sign(new Request(u.toString(), { method: 'PUT' }), { aws: { signQuery: true } });
      out.push({ caminho: a.caminho, url: s.url, publica: `${publico}/${enc(a.caminho)}` });
    }
    return resp(req, 200, { arquivos: out });
  }

  if (corpo.acao === 'apagar') {
    const cs = (Array.isArray(corpo.caminhos) ? corpo.caminhos : []).slice(0, MAX_APAGAR).filter(c => CAMINHO.test(String(c)));
    const apagados: string[] = [];
    for (const c of cs) { const r = await aws.fetch(`${base}/${enc(c)}`, { method: 'DELETE' }); if (r.ok || r.status === 404) apagados.push(c); }
    return resp(req, 200, { apagados });
  }

  if (corpo.acao === 'uso') {
    let arquivos = 0, bytes = 0, token = '';
    for (let i = 0; i < 50; i++) { // até 50 mil arquivos (1000 por página)
      const u = new URL(base); u.searchParams.set('list-type', '2'); if (token) u.searchParams.set('continuation-token', token);
      const r = await aws.fetch(u.toString()); if (!r.ok) return resp(req, 502, { erro: 'A Cloudflare não respondeu (' + r.status + '). Confira os segredos R2_*.' });
      const xml = await r.text();
      for (const m of xml.matchAll(/<Size>(\d+)<\/Size>/g)) { arquivos++; bytes += Number(m[1]); }
      const t = /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/.exec(xml);
      if (!t) break; token = t[1];
    }
    return resp(req, 200, { arquivos, bytes, limiteGratis: 10 * 1024 ** 3 });
  }

  return resp(req, 400, { erro: 'Ação desconhecida.' });
});
