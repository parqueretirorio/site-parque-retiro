// Função de servidor do Supabase: liga o Zoom do Parque à plataforma CONecta Retiro.
//   - lista as gravações na nuvem do Zoom (com ou sem transcrição);
//   - traz o texto da transcrição de uma reunião (vira rascunho de ata em Documentos e Calendários);
//   - apaga a gravação da nuvem do Zoom (para não lotar os 10 GB);
//   - cria reunião no Zoom (link de entrada para uma atividade do calendário).
// Usa um aplicativo "Server-to-Server OAuth" do Zoom Marketplace (conta Parque Retiro), com as permissões:
//   cloud_recording:read:list_account_recordings:admin · cloud_recording:read:list_user_recordings:admin
//   cloud_recording:delete:meeting_recording:admin · meeting:write:meeting:admin · meeting:read:meeting:admin
//
// Quem pode usar: pessoa logada e aprovada, Administrador ou Responsável pelos Documentos e Calendários.
//
// Instalação pelo painel (Edge Functions › Deploy a new function › Via editor):
//   nome: zoom   ·   desligar "Verify JWT" (a conferência do login é feita aqui dentro)
// Segredos (Edge Functions › Secrets), copiados do Zoom direto para o painel, nunca em conversa:
//   ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET   (aba "App Credentials" do app CONecta Retiro)
//   ZOOM_USER = e-mail da conta do Zoom que hospeda as reuniões (para "criar reunião")

const ORIGENS = ['https://parqueretirorio.github.io', 'https://parqueretiro.org.br', 'https://www.parqueretiro.org.br'];
const API = 'https://api.zoom.us/v2';

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
  if (perfil.nivel === 'administrador' || (perfil.funcoes || []).includes('documentos')) return String(user.email || '');
  return null;
}

// token do Zoom (vale 1 hora); guardado enquanto a função estiver "quente"
let tok = { valor: '', ate: 0 };
async function tokenZoom(): Promise<string | null> {
  if (tok.valor && Date.now() < tok.ate - 60000) return tok.valor;
  const conta = Deno.env.get('ZOOM_ACCOUNT_ID') || '', id = Deno.env.get('ZOOM_CLIENT_ID') || '', seg = Deno.env.get('ZOOM_CLIENT_SECRET') || '';
  const r = await fetch('https://zoom.us/oauth/token?grant_type=account_credentials&account_id=' + encodeURIComponent(conta),
    { method: 'POST', headers: { Authorization: 'Basic ' + btoa(id + ':' + seg) } });
  if (!r.ok) return null;
  const j = await r.json();
  tok = { valor: j.access_token, ate: Date.now() + (j.expires_in || 3600) * 1000 };
  return tok.valor;
}
const zoom = async (t: string, caminho: string, init: RequestInit = {}) =>
  fetch(API + caminho, { ...init, headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', ...(init.headers || {}) } });
// o "uuid" da reunião precisa de codificação dupla quando começa com "/" ou tem "//"
const uuidUrl = (u: string) => /^\/|\/\//.test(u) ? encodeURIComponent(encodeURIComponent(u)) : encodeURIComponent(u);
const dia = (d: Date) => d.toISOString().slice(0, 10);

async function gravacoes(t: string, de: string, ate: string) {
  const out: any[] = []; let prox = '';
  for (let i = 0; i < 10; i++) {
    const q = `/accounts/me/recordings?page_size=100&from=${de}&to=${ate}${prox ? '&next_page_token=' + encodeURIComponent(prox) : ''}`;
    const r = await zoom(t, q); if (!r.ok) return { erro: r.status, texto: (await r.text()).slice(0, 300) };
    const j = await r.json(); out.push(...(j.meetings || [])); prox = j.next_page_token || ''; if (!prox) break;
  }
  return { reunioes: out };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return resp(req, 405, { erro: 'Use POST.' });
  if (!(await quemPode(req))) return resp(req, 403, { erro: 'Só o administrador ou o Responsável pelos Documentos e Calendários pode usar o Zoom pela plataforma.' });
  if (!Deno.env.get('ZOOM_ACCOUNT_ID') || !Deno.env.get('ZOOM_CLIENT_ID') || !Deno.env.get('ZOOM_CLIENT_SECRET')) return resp(req, 503, { erro: 'nao-configurado' });
  const t = await tokenZoom();
  if (!t) return resp(req, 502, { erro: 'O Zoom recusou os códigos do aplicativo. Confira ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID e ZOOM_CLIENT_SECRET e se o app CONecta Retiro está ativado.' });

  let c: any; try { c = await req.json(); } catch { return resp(req, 400, { erro: 'Pedido inválido.' }); }
  const hoje = new Date(), okDia = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
  // o Zoom aceita no máximo ~1 mês por consulta
  const ate = okDia(c.ate) ? c.ate : dia(hoje), de = okDia(c.de) ? c.de : dia(new Date(new Date(ate + 'T12:00:00Z').getTime() - 30 * 864e5));

  if (c.acao === 'gravacoes') {
    const g = await gravacoes(t, de, ate);
    if ('erro' in g) return resp(req, 502, { erro: 'O Zoom não devolveu a lista de gravações (' + g.erro + ').', detalhe: g.texto });
    return resp(req, 200, { de, ate, reunioes: g.reunioes.map((m: any) => ({
      uuid: m.uuid, id: m.id, topico: m.topic, inicio: m.start_time, duracao: m.duration, tamanho: m.total_size || 0, link: m.share_url || '',
      transcricao: (m.recording_files || []).some((f: any) => f.file_type === 'TRANSCRIPT'),
      video: (m.recording_files || []).some((f: any) => f.file_type === 'MP4'),
      arquivos: (m.recording_files || []).length,
    })) });
  }

  if (c.acao === 'transcricao') {
    if (!c.uuid) return resp(req, 400, { erro: 'Falta a reunião.' });
    const g = await gravacoes(t, de, ate);
    if ('erro' in g) return resp(req, 502, { erro: 'O Zoom não devolveu as gravações (' + g.erro + ').' });
    const m = g.reunioes.find((x: any) => x.uuid === c.uuid);
    const f = m && (m.recording_files || []).find((x: any) => x.file_type === 'TRANSCRIPT');
    if (!f) return resp(req, 404, { erro: 'Esta gravação não tem transcrição. Confira se "Criar transcrição de áudio" estava ligado e se o Zoom já terminou de processar.' });
    const r = await fetch(f.download_url, { headers: { Authorization: 'Bearer ' + t } });
    if (!r.ok) return resp(req, 502, { erro: 'Não foi possível baixar a transcrição (' + r.status + ').' });
    const texto = await r.text();
    return resp(req, 200, { texto: texto.slice(0, 3_000_000), topico: m.topic, inicio: m.start_time, duracao: m.duration, link: m.share_url || '' });
  }

  if (c.acao === 'apagar') {
    if (!c.uuid) return resp(req, 400, { erro: 'Falta a reunião.' });
    const r = await zoom(t, `/meetings/${uuidUrl(c.uuid)}/recordings?action=${c.definitivo ? 'delete' : 'trash'}`, { method: 'DELETE' });
    if (r.status === 204 || r.status === 200) return resp(req, 200, { apagado: true, definitivo: !!c.definitivo });
    return resp(req, 502, { erro: 'O Zoom não apagou a gravação (' + r.status + ').', detalhe: (await r.text()).slice(0, 300) });
  }

  if (c.acao === 'criar_reuniao') {
    const host = Deno.env.get('ZOOM_USER') || '';
    if (!host) return resp(req, 503, { erro: 'Falta o segredo ZOOM_USER (e-mail da conta do Zoom que hospeda as reuniões).' });
    const topico = String(c.topico || '').slice(0, 200), inicio = String(c.inicio || ''), dur = Math.min(Math.max(+c.duracao || 60, 15), 720);
    if (!topico || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(inicio)) return resp(req, 400, { erro: 'Informe o título, a data e a hora.' });
    const corpo: any = { topic: topico, type: 2, start_time: inicio.slice(0, 16) + ':00', timezone: 'America/Sao_Paulo', duration: dur, agenda: String(c.descricao || '').slice(0, 1900),
      settings: { join_before_host: true, waiting_room: false, mute_upon_entry: true, auto_recording: 'none' } };
    if (c.semanal) { corpo.type = 8; corpo.recurrence = { type: 2, repeat_interval: 1, weekly_days: String(new Date(inicio.slice(0, 10) + 'T12:00:00Z').getUTCDay() + 1), end_times: Math.min(+c.vezes || 50, 60) }; }
    const r = await zoom(t, `/users/${encodeURIComponent(host)}/meetings`, { method: 'POST', body: JSON.stringify(corpo) });
    if (!r.ok) return resp(req, 502, { erro: 'O Zoom não criou a reunião (' + r.status + ').', detalhe: (await r.text()).slice(0, 300) });
    const m = await r.json();
    return resp(req, 200, { id: m.id, link: m.join_url, senha: m.password || '', inicio: m.start_time });
  }

  return resp(req, 400, { erro: 'Ação desconhecida.' });
});
