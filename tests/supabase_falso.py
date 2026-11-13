# Supabase "falso" para os testes da Fase 1: imita as rotas que o site usa (Auth e REST), mas as regras de dados
# rodam no PostgreSQL DE VERDADE (local), com as mesmas migrações do Supabase (0001–0011).
# Assim o teste confere o banco real: RLS, gatilhos (perfis_protege), versões e conflitos.
# Requer PostgreSQL 16 local (usuário postgres). Usado por tests/teste_supabase_fase1.py.
import json, os, re, subprocess, uuid, itertools
from urllib.parse import urlparse, parse_qs

AQUI = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(AQUI)
STUB = """
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text unique, raw_user_meta_data jsonb default '{}'::jsonb, created_at timestamptz default now());
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.uid', true), '')::uuid $$;
grant usage on schema public, auth to anon, authenticated;
create extension if not exists pgcrypto;
create schema if not exists storage;
create table if not exists storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
create table if not exists storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid, metadata jsonb default '{}'::jsonb, created_at timestamptz default now(), unique (bucket_id, name));
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated;
grant select, insert, update, delete on storage.objects to authenticated;
"""
GRANTS = "grant select, insert, update on all tables in schema public to authenticated; grant usage, select on all sequences in schema public to authenticated;"


def psql(sql, db='prt_teste', papel=None, uid=None):
    pre = ''
    if papel: pre += f"set local role {papel};"
    if uid: pre += f"select set_config('request.uid', '{uid}', true);"
    corpo = f"begin; {pre} {sql}; commit;"
    r = subprocess.run(['su', 'postgres', '-c', f'psql -X -q -At -v ON_ERROR_STOP=1 -d {db}'], input=corpo, capture_output=True, text=True)
    if r.returncode != 0:
        m = re.search(r'ERROR:\s+(.*)', r.stderr)
        raise ErroBanco(m.group(1).strip() if m else r.stderr.strip())
    linhas = [l for l in r.stdout.splitlines() if l.strip() and l.strip() not in ('BEGIN', 'COMMIT', 'SET')]
    return linhas


class ErroBanco(Exception):
    pass


def lit(v):  # literal SQL seguro por dollar-quoting
    s = json.dumps(v) if not isinstance(v, str) else v
    tag = '$q' + uuid.uuid4().hex[:8] + '$'
    return f"{tag}{s}{tag}"


def preparar_banco(db='prt_teste'):
    subprocess.run(['su', 'postgres', '-c', f'dropdb --if-exists {db} && createdb {db}'], check=True, capture_output=True)
    arquivos = sorted(os.listdir(os.path.join(SITE, 'supabase', 'migrations')))
    sql = STUB + '\n'.join(open(os.path.join(SITE, 'supabase', 'migrations', a)).read() for a in arquivos if a.endswith('.sql')) + GRANTS
    r = subprocess.run(['su', 'postgres', '-c', f'psql -X -q -v ON_ERROR_STOP=1 -d {db}'], input=sql, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr)


class SupabaseFalso:
    def __init__(self, url, db='prt_teste'):
        self.url = url.rstrip('/')
        self.db = db
        self.contas = {}        # email -> {id, senha, confirmado}
        self.tokens = {}        # access_token -> uid
        self.refresh = {}       # refresh_token -> uid
        self.seq = itertools.count(1)
        self.log = []
        self.enviados = []      # e-mails "enviados" (confirmação, recuperação)
        self.arquivos = {}      # Storage: 'bucket/caminho' -> {bytes, tipo}
        self.r2 = False         # função album-r2: False = não configurada (503); True = ligada
        self.r2_arquivos = {}   # Cloudflare R2 simulada: caminho -> bytes
        self.zoom = False       # função zoom: False = não configurada (503)
        self.zoom_gravacoes = []  # [{uuid, topico, inicio, duracao, tamanho, transcricao(texto|None)}]
        self.zoom_reunioes = []
        self.ultimo_binario = None

    # ---------- dados de teste ----------
    def criar_conta(self, email, senha, nome, confirmado=True, nivel=None, status=None, funcoes=None, whatsapp=''):
        uid = str(uuid.uuid4())
        self.contas[email.lower()] = {'id': uid, 'senha': senha, 'confirmado': confirmado}
        meta = {'nome': nome, 'whatsapp': whatsapp, 'lgpd': {'aceite': True, 'versao': 1}}
        psql(f"insert into auth.users(id,email,raw_user_meta_data) values ('{uid}', {lit(email)}, {lit(meta)}::jsonb)", self.db)
        if nivel or status or funcoes:
            sets = []
            if nivel: sets.append(f"nivel={lit(nivel)}")
            if status: sets.append(f"status={lit(status)}")
            if funcoes is not None: sets.append(f"funcoes={lit('{' + ','.join(funcoes) + '}')}::text[]")
            psql(f"alter table perfis disable trigger perfis_protege; update perfis set {', '.join(sets)} where id='{uid}'; alter table perfis enable trigger perfis_protege", self.db)
        return uid

    def sessao_para(self, uid, expira_em=3600):
        n = next(self.seq)
        at, rt = f'tok-{n}-{uid}', f'ref-{n}-{uid}'
        self.tokens[at] = uid; self.refresh[rt] = uid
        email = next(e for e, c in self.contas.items() if c['id'] == uid)
        import time
        return {'access_token': at, 'refresh_token': rt, 'expires_in': expira_em, 'expires_at': int(time.time()) + expira_em, 'token_type': 'bearer', 'user': {'id': uid, 'email': email}}

    # ---------- roteamento ----------
    async def tratar(self, route):
        req = route.request
        u = urlparse(req.url)
        caminho, q = u.path, parse_qs(u.query)
        if caminho.startswith('/storage/v1/object/public/'):  # arquivo público (foto do Álbum)
            chave = caminho[len('/storage/v1/object/public/'):]
            b = self.arquivos.get(chave)
            await route.fulfill(status=200 if b else 404, content_type=(b or {}).get('tipo', 'text/plain'), headers={'Access-Control-Allow-Origin': '*'}, body=(b or {}).get('bytes', b'nao encontrado'))
            return
        if caminho.startswith('/storage/v1/object/') and req.method == 'POST':
            self.ultimo_binario = req.post_data_buffer
        corpo = None
        try:
            corpo = json.loads(req.post_data) if req.post_data else None
        except Exception:
            corpo = None
        tok = (req.headers.get('authorization') or '').replace('Bearer ', '')
        uid = self.tokens.get(tok)
        self.log.append((req.method, caminho + ('?' + u.query if u.query else '')))
        st, res = self.rotear(req.method, caminho, q, corpo, uid, tok)
        await route.fulfill(status=st, content_type='application/json', headers={'Access-Control-Allow-Origin': '*'}, body='' if res is None else json.dumps(res))

    def rotear(self, m, caminho, q, corpo, uid, tok):
        if m == 'OPTIONS':
            return 200, None
        if caminho == '/functions/v1/zoom':
            return self.funcao_zoom(corpo or {}, uid)
        if caminho == '/functions/v1/album-r2':
            return self.album_r2(corpo or {}, uid)
        if caminho.startswith('/storage/v1/'):
            return self.storage(m, caminho[len('/storage/v1/'):], corpo, uid)
        if caminho == '/auth/v1/token' and q.get('grant_type') == ['password']:
            c = self.contas.get(str(corpo.get('email', '')).lower())
            if not c or c['senha'] != corpo.get('password'):
                return 400, {'error_code': 'invalid_credentials', 'msg': 'Invalid login credentials'}
            if not c['confirmado']:
                return 400, {'error_code': 'email_not_confirmed', 'msg': 'Email not confirmed'}
            return 200, self.sessao_para(c['id'])
        if caminho == '/auth/v1/token' and q.get('grant_type') == ['refresh_token']:
            r = self.refresh.pop(corpo.get('refresh_token'), None)
            return (200, self.sessao_para(r)) if r else (400, {'msg': 'Invalid Refresh Token'})
        if caminho == '/auth/v1/signup':
            em = str(corpo.get('email', '')).lower()
            if em in self.contas:
                return 422, {'error_code': 'user_already_exists', 'msg': 'User already registered'}
            d = corpo.get('data') or {}
            self.criar_conta(em, corpo.get('password'), d.get('nome', ''), confirmado=False, whatsapp=d.get('whatsapp', ''))
            psql(f"update auth.users set raw_user_meta_data = raw_user_meta_data where email={lit(em)}", self.db)
            self.enviados.append(('confirmacao', em, q.get('redirect_to', [''])[0]))
            return 200, {'id': self.contas[em]['id'], 'email': em}
        if caminho == '/auth/v1/recover':
            self.enviados.append(('recuperacao', str(corpo.get('email', '')).lower(), q.get('redirect_to', [''])[0]))
            return 200, {}
        if caminho == '/auth/v1/user' and m == 'PUT':
            if not uid:
                return 401, {'msg': 'invalid JWT'}
            email = next(e for e, c in self.contas.items() if c['id'] == uid)
            if self.contas[email]['senha'] == corpo.get('password'):
                return 422, {'msg': 'New password should be different from the old password.'}
            self.contas[email]['senha'] = corpo.get('password')
            return 200, {'id': uid, 'email': email}
        if caminho == '/auth/v1/logout':
            self.tokens.pop(tok, None)
            return 204, None
        if caminho in ('/rest/v1/rpc/pr_ler_publico', '/rest/v1/rpc/pr_enviar_publico') and not uid:
            try:  # site aberto, sem login: papel anon (só a chave pública)
                if caminho.endswith('pr_ler_publico'):
                    nomes = '{' + ','.join('"' + n.replace('"', '') + '"' for n in (corpo or {}).get('p_nomes', [])) + '}'
                    r = psql(f"select pr_ler_publico({lit(nomes)}::text[])", self.db, 'anon')
                else:
                    r = psql(f"select pr_enviar_publico({lit(corpo['p_caixa'])}, {lit(corpo['p_dados'])}::jsonb)", self.db, 'anon')
                return 200, json.loads(r[-1])
            except ErroBanco as e:
                return 400, {'message': str(e)}
        if caminho.startswith('/rest/v1/'):
            if not uid:
                return 401, {'message': 'JWT expired'}
            try:
                return self.rest(m, caminho[len('/rest/v1/'):], q, corpo, uid)
            except ErroBanco as e:
                msg = str(e)
                st = 403 if ('aprovados' in msg or 'Só o administrador' in msg or 'permission denied' in msg) else 400
                return st, {'message': msg}
        return 404, {'message': 'rota desconhecida no Supabase falso: ' + caminho}

    def rest(self, m, rota, q, corpo, uid):
        if rota == 'perfis' and m == 'GET':
            filtro = ''
            if 'id' in q:
                filtro = f"where id = {lit(q['id'][0].replace('eq.', ''))}::uuid"
            r = psql(f"select coalesce(json_agg(x order by x.criado_em), '[]')::jsonb::text from (select id,nome,email,whatsapp,lgpd,nivel,status,funcoes,criado_em from perfis {filtro}) x", self.db, 'authenticated', uid)
            return 200, json.loads(r[-1])
        if rota == 'perfis' and m == 'PATCH':
            alvo = q['id'][0].replace('eq.', '')
            sets = []
            for k, v in corpo.items():
                if k == 'funcoes': sets.append(f"funcoes = {lit('{' + ','.join(v) + '}')}::text[]")
                elif k == 'lgpd': sets.append(f"lgpd = {lit(v)}::jsonb")
                else: sets.append(f"{k} = {lit(v if v is not None else '')}")
            psql(f"update perfis set {', '.join(sets)} where id = '{alvo}'", self.db, 'authenticated', uid)
            return 204, None
        if rota.startswith('rpc/'):
            fn = rota[4:]
            if fn == 'pr_ler_colecoes':
                r = psql("select pr_ler_colecoes()", self.db, 'authenticated', uid)
            elif fn == 'pr_gravar_colecao':
                r = psql(f"select pr_gravar_colecao({lit(corpo['p_nome'])}, {int(corpo['p_versao_base'])}, {lit(corpo['p_dados'])}::jsonb)", self.db, 'authenticated', uid)
            elif fn == 'pr_pegar_envios':
                r = psql("select pr_pegar_envios()", self.db, 'authenticated', uid)
            elif fn == 'pr_apagar_envios':
                r = psql(f"select pr_apagar_envios({lit('{' + ','.join(str(int(i)) for i in corpo.get('p_ids', [])) + '}')}::bigint[])", self.db, 'authenticated', uid)
            elif fn == 'pr_ler_publico':
                nomes = '{' + ','.join('"' + n.replace('"', '') + '"' for n in (corpo or {}).get('p_nomes', [])) + '}'
                r = psql(f"select pr_ler_publico({lit(nomes)}::text[])", self.db, 'authenticated', uid)
            elif fn == 'pr_album_uso':
                r = psql("select pr_album_uso()", self.db, 'authenticated', uid)
            elif fn == 'pr_excluir_colecao':
                r = psql(f"select pr_excluir_colecao({lit(corpo['p_nome'])}, {int(corpo['p_versao_base'])})", self.db, 'authenticated', uid)
            else:
                return 404, {'message': 'função desconhecida'}
            return 200, json.loads(r[-1])
        return 404, {'message': 'rota REST desconhecida: ' + rota}

    # ---------- Storage (só o que o Álbum usa); as permissões vêm das políticas reais de storage.objects ----------
    def storage(self, m, resto, corpo, uid):
        if m == 'POST' and resto.startswith('object/'):
            chave = resto[len('object/'):]
            bucket, nome = chave.split('/', 1)
            if not uid: return 400, {'error': 'Unauthorized', 'message': 'Invalid JWT'}
            dados = self.ultimo_binario or b''
            if len(dados) > 5242880: return 413, {'error': 'Payload too large'}
            try:
                psql(f"insert into storage.objects(bucket_id,name,owner,metadata) values ({lit(bucket)},{lit(nome)},'{uid}',{lit({'size': len(dados)})}::jsonb)", self.db, papel='authenticated', uid=uid)
            except ErroBanco as e:
                if 'duplicate' in str(e): return 409, {'error': 'Duplicate', 'message': 'The resource already exists'}
                return 403, {'error': 'Unauthorized', 'message': 'new row violates row-level security policy'}
            self.arquivos[chave] = {'bytes': dados, 'tipo': 'image/jpeg'}
            return 200, {'Key': chave}
        if m == 'DELETE' and resto.startswith('object/'):
            bucket = resto[len('object/'):].strip('/')
            nomes = (corpo or {}).get('prefixes', [])
            apagados = []
            for n in nomes:
                r = psql(f"delete from storage.objects where bucket_id={lit(bucket)} and name={lit(n)} returning name", self.db, papel='authenticated', uid=uid)
                if r: apagados.append({'name': n}); self.arquivos.pop(bucket + '/' + n, None)
            return 200, apagados
        return 404, {'error': 'not found'}

    # ---------- função album-r2 (Edge Function) + Cloudflare R2 simulada ----------
    def album_r2(self, corpo, uid):
        if not uid: return 403, {'erro': 'sem login'}
        p = psql(f"select nivel || '|' || status || '|' || array_to_string(funcoes, ',') from perfis where id='{uid}'", self.db)
        nivel, status, fn = (p[0].split('|') + ['', '', ''])[:3] if p else ('', '', '')
        if status != 'aprovado' or not (nivel == 'administrador' or 'album' in fn.split(',')): return 403, {'erro': 'sem permissão'}
        if not self.r2: return 503, {'erro': 'nao-configurado'}
        ac = corpo.get('acao')
        if ac == 'assinar':
            return 200, {'arquivos': [{'caminho': a['caminho'], 'url': 'https://r2-falso.test/put/' + a['caminho'], 'publica': 'https://fotos-falso.test/' + a['caminho']} for a in corpo.get('arquivos', [])[:20]]}
        if ac == 'apagar':
            ap = [c for c in corpo.get('caminhos', []) if self.r2_arquivos.pop(c, None) is not None]
            return 200, {'apagados': ap}
        if ac == 'uso':
            return 200, {'arquivos': len(self.r2_arquivos), 'bytes': sum(len(b) for b in self.r2_arquivos.values()), 'limiteGratis': 10 * 1024 ** 3}
        return 400, {'erro': 'ação'}

    async def tratar_r2(self, route):
        req = route.request; u = urlparse(req.url)
        cors = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'PUT, GET', 'Access-Control-Allow-Headers': 'content-type'}
        if req.method == 'OPTIONS': await route.fulfill(status=200, headers=cors, body=''); return
        if u.hostname == 'r2-falso.test' and req.method == 'PUT' and u.path.startswith('/put/'):
            self.r2_arquivos[u.path[len('/put/'):]] = req.post_data_buffer or b''
            await route.fulfill(status=200, headers=cors, body=''); return
        if u.hostname == 'fotos-falso.test':
            b = self.r2_arquivos.get(u.path.lstrip('/'))
            await route.fulfill(status=200 if b else 404, headers=cors, content_type='image/jpeg', body=b or b'')
            return
        await route.fulfill(status=404, body='')

    # ---------- função zoom (Edge Function) simulada ----------
    def funcao_zoom(self, corpo, uid):
        if not uid: return 403, {'erro': 'sem login'}
        p = psql(f"select nivel || '|' || status || '|' || array_to_string(funcoes, ',') from perfis where id='{uid}'", self.db)
        nivel, status, fn = (p[0].split('|') + ['', '', ''])[:3] if p else ('', '', '')
        if status != 'aprovado' or not (nivel == 'administrador' or 'documentos' in fn.split(',')): return 403, {'erro': 'sem permissão'}
        if not self.zoom: return 503, {'erro': 'nao-configurado'}
        ac = corpo.get('acao')
        if ac == 'gravacoes':
            return 200, {'reunioes': [{'uuid': g['uuid'], 'id': 1, 'topico': g['topico'], 'inicio': g['inicio'], 'duracao': g['duracao'], 'tamanho': g['tamanho'], 'link': 'https://zoom.us/rec/share/x', 'transcricao': bool(g.get('transcricao')), 'video': True, 'arquivos': 3} for g in self.zoom_gravacoes]}
        if ac == 'transcricao':
            g = next((g for g in self.zoom_gravacoes if g['uuid'] == corpo.get('uuid')), None)
            if not g or not g.get('transcricao'): return 404, {'erro': 'Esta gravação não tem transcrição.'}
            return 200, {'texto': g['transcricao'], 'topico': g['topico'], 'inicio': g['inicio'], 'duracao': g['duracao']}
        if ac == 'apagar':
            antes = len(self.zoom_gravacoes); self.zoom_gravacoes = [g for g in self.zoom_gravacoes if g['uuid'] != corpo.get('uuid')]
            return (200, {'apagado': True}) if len(self.zoom_gravacoes) < antes else (502, {'erro': 'não achei'})
        if ac == 'criar_reuniao':
            self.zoom_reunioes.append(corpo); n = len(self.zoom_reunioes)
            return 200, {'id': 900 + n, 'link': f'https://us02web.zoom.us/j/900{n}', 'senha': 'abc'}
        return 400, {'erro': 'ação'}
