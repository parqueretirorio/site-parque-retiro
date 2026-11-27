# Teste (27/11/2026): migração 0029 — a inscrição funciona com o pgcrypto fora do search_path (como no Supabase real).
import os, sys, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from supabase_falso import SupabaseFalso, preparar_banco, psql
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
def q(sql, **kw):
    r = psql(sql, **kw); return r[-1] if r else ''
J = lambda s, **k: json.loads(q(s, **k))
preparar_banco(); sb = SupabaseFalso('https://yhzsuokwglznehvbclwd.supabase.co')
adm = sb.criar_conta('adm@t.com', 'senhaLeo123', 'Adm Teste', nivel='administrador', status='aprovado', whatsapp='21999990000')
CFG = {'titulo': 'Almoço', 'data_texto': 'Domingo', 'local_texto': 'Parque', 'aviso': '', 'ativo': True, 'opcoes': [{'id': 'dom', 'nome': 'Domingo', 'valor_centavos': 3500}], 'pix_chave': '+5521999175882', 'pix_nome': 'maria', 'pix_cidade': 'marica', 'vagas': None, 'prazo': None, 'resp_email': ''}
psql("select pr_participacao_config_salvar('t1', '" + json.dumps(CFG) + "'::jsonb)::text", papel='authenticated', uid=adm)
# como no Supabase: pgcrypto no schema "extensions", fora do search_path da função
psql("create schema if not exists extensions; alter extension pgcrypto set schema extensions;")
ins = lambda e: J(f"select pr_participacao_inscrever('t1','Ana Souza','{e}','(21) 99999-1111','24900-000','nao_vegetariano','','dom','pix',true)::text", papel='anon')
# versão antiga (0027), com gen_random_bytes: reproduz o erro de produção
old = open(SITE + '/supabase/migrations/0027_participacao_evento_contribuicao.sql', encoding='utf-8').read()
i = old.index('create or replace function public.pr_participacao_inscrever('); j = old.index('end $$;', i) + len('end $$;')
psql(old[i:j]); r = ins('a@t.com'); ok(not r['ok'] and 'agora' in r['erro'], "versão antiga reproduz o erro genérico quando o pgcrypto está fora do search_path")
new = open(SITE + '/supabase/migrations/0029_participacao_corrige_token.sql', encoding='utf-8').read(); psql(new)
r = ins('b@t.com'); ok(r['ok'] and len(r['token']) == 32 and len(r['codigo']) == 6, "com a 0029 a inscrição conclui e gera código e token")
ok(not ins('b@t.com')['ok'], "e-mail repetido continua sendo recusado")
ok(q("select count(*) from participacao_inscricoes where evento_id='t1'") == '1', "só a inscrição válida foi gravada")
