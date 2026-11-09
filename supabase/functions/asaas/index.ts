// Função de servidor do Supabase: ponte entre o site do Parque Retiro e o Asaas.
// Publicar SEM verificação de JWT (o site é público; a proteção está em nucleo.js):
//   supabase functions deploy asaas --no-verify-jwt
// Chaves (nunca no site): supabase secrets set ASAAS_API_KEY=... ADMIN_TOKEN=... ALLOWED_ORIGIN=... ASAAS_BASE_URL=...
import { criarNucleo } from './nucleo.js';

declare const Deno: { env: { get(k: string): string | undefined }; serve(h: (r: Request) => Response | Promise<Response>): void };
const nucleo = criarNucleo({ fetch, env: (k: string) => Deno.env.get(k) || '' });
Deno.serve((req) => nucleo.handler(req));
