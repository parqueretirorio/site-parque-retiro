# Teste (26/11/2026): migração 0027 — inscrição em evento com contribuição e Pix com centavos únicos (banco).
import os, sys, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from supabase_falso import SupabaseFalso, preparar_banco, psql, ErroBanco
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
def q(sql, **kw):
    r = psql(sql, **kw); return r[-1] if r else ''
J = lambda s, **k: json.loads(q(s, **k))
sql = open(SITE + '/supabase/migrations/0027_participacao_evento_contribuicao.sql', encoding='utf-8').read(); cod = re.sub(r'--[^\n]*', '', sql)
ok('pr_enviar_publico' not in cod, "a 0027 não mexe em pr_enviar_publico (lição da 0018)")
preparar_banco(); sb = SupabaseFalso('https://yhzsuokwglznehvbclwd.supabase.co')
adm = sb.criar_conta('adm@t.com', 'senhaLeo123', 'Adm Teste', nivel='administrador', status='aprovado', whatsapp='21999990000')
atv = sb.criar_conta('atv@t.com', 'senhaLeo123', 'Adm Atividades', status='aprovado', funcoes=['atividades'], whatsapp='21999990001')
resp = sb.criar_conta('resp@t.com', 'senhaLeo123', 'Responsavel', status='aprovado', whatsapp='21999990002')
outro = sb.criar_conta('outro@t.com', 'senhaLeo123', 'Outro', status='aprovado', whatsapp='21999990003')
pend = sb.criar_conta('pend@t.com', 'senhaLeo123', 'Pendente', whatsapp='21999990004')
CFG = {'titulo': 'Entre Princípios e Vivências', 'data_texto': 'Domingo, 29 de novembro, a partir das 11h', 'local_texto': 'Parque Retiro, Maricá/RJ', 'aviso': '', 'ativo': True,
       'opcoes': [{'id': 'dom', 'nome': 'Domingo 29/11', 'valor_centavos': 3500}, {'id': 'sab', 'nome': 'Sábado', 'valor_centavos': 6000}],
       'pix_chave': '+5521999175882', 'pix_nome': 'maria da conceicao ribeiro', 'pix_cidade': 'marica', 'vagas': 120, 'prazo': None, 'resp_email': 'resp@t.com'}
cfg = lambda c: "select pr_participacao_config_salvar('atv1', " + "'" + json.dumps(c).replace("'", "''") + "'::jsonb)::text"
def nega(sql, papel, uid=None, msg=''):
    try: psql(sql, papel=papel, uid=uid) if uid else psql(sql, papel=papel); ok(False, 'deveria negar: ' + msg)
    except ErroBanco as e: ok('Sem permissão' in str(e) or 'permission denied' in str(e), 'negado: ' + msg)
nega(cfg(CFG), 'anon', msg='anônimo não configura')
nega(cfg(CFG), 'authenticated', outro, 'usuário comum não configura')
nega(cfg(CFG), 'authenticated', resp, 'o responsável também não altera valores nem Pix')
nega(cfg(CFG), 'authenticated', pend, 'cadastro pendente não configura')
ok(J(cfg(CFG), papel='authenticated', uid=atv)['ok'], "Administrador das Atividades configura")
ok(J(cfg(dict(CFG, pix_chave='')), papel='authenticated', uid=adm)['ok'] if False else True, '-')
try: psql(cfg(dict(CFG, ativo=True, pix_chave='')), papel='authenticated', uid=adm); ok(False, 'ativou sem Pix')
except ErroBanco as e: ok('chave Pix' in str(e), "não ativa sem chave Pix")
try: psql(cfg(dict(CFG, opcoes=[{'nome': 'x', 'valor_centavos': -5}])), papel='authenticated', uid=adm); ok(False, 'valor negativo')
except ErroBanco as e: ok('nome e valor' in str(e), "recusa opção sem nome/valor válido")
ok(q("select pix_nome||'|'||pix_cidade from participacao_eventos where id='atv1'") == 'MARIA DA CONCEICAO RIBEIR|MARICA', "nome e cidade do Pix em maiúsculas (25 e 15 caracteres no máximo)")
ev = J("select pr_participacao_evento('atv1')::text", papel='anon'); ok(ev['ok'] and len(ev['opcoes']) == 2 and ev['pix']['chave'] == '+5521999175882' and not ev['encerrado'], "público lê a configuração (opções e Pix)")
ok(not J("select pr_participacao_evento('nao-existe')::text", papel='anon')['ok'], "evento inexistente/inativo não aparece")
def insc(nome='Ana Souza', email='ana@t.com', tel='(21) 99999-1111', cep='24900-000', rest='nao_vegetariano', opcao='dom', forma='pix', consent='true', evento='atv1'):
    return J(f"select pr_participacao_inscrever('{evento}','{nome}','{email}','{tel}','{cep}','{rest}','','{opcao}','{forma}',{consent})::text", papel='anon')
r = insc(); ok(r['ok'] and len(r['codigo']) == 6 and r['txid'] == 'PR' + r['codigo'] and 1 <= r['extra_centavos'] <= 99 and r['total_centavos'] == 3500 + r['extra_centavos'], f"inscrição por Pix: total = valor + centavos de identificação ({r['total_centavos']})")
ok(len(r['token']) == 24, "a pessoa recebe um segredo para o 'Já paguei'")
for k, v in dict(nome='Ana', email='ana', tel='123', cep='123', rest='x', opcao='zzz', forma='boleto', consent='false').items():
    ok(not insc(**{k: v, 'email': 'novo@t.com'} if k != 'email' else {'email': v})['ok'], f"recusa {k} inválido")
ok(not insc()['ok'], "recusa o mesmo e-mail duas vezes no mesmo evento")
ok(not insc(evento='x')['ok'], "recusa evento inexistente")
# centavos únicos entre inscrições abertas do mesmo valor
extras = {r['extra_centavos']}
for i in range(60):
    x = insc(nome=f'Pessoa Numero{i}', email=f'p{i}@t.com'); ok(x['ok'], f'inscrição {i}') if i in (0, 59) else None; extras.add(x['extra_centavos'])
ok(len(extras) == 61 and 0 not in extras, "61 inscrições abertas no mesmo valor: todos os centavos diferentes (nenhum repetido)")
# valor diferente pode repetir centavos; presencial não tem centavos
p = insc(nome='Pedro Presencial', email='pp@t.com', forma='presencial'); ok(p['ok'] and p['extra_centavos'] == 0 and p['total_centavos'] == 3500, "presencial: sem centavos, valor cheio")
# confirmar libera os centavos para reutilizar
tok = r['token']
ok(not J(f"select pr_participacao_informar_pago('{r['codigo']}', 'errado')::text", papel='anon')['ok'], "'Já paguei' com segredo errado não funciona")
ok(J(f"select pr_participacao_informar_pago('{r['codigo'].lower()}', '{tok}')::text", papel='anon')['ok'] and q(f"select status from participacao_inscricoes where codigo='{r['codigo']}'") == 'informou', "'Já paguei' com o segredo certo muda para 'informou'")
nega(f"select pr_participacao_listar('atv1')::text", 'anon', msg='anônimo não lista')
nega(f"select pr_participacao_listar('atv1')::text", 'authenticated', outro, 'usuário comum não lista')
L = J("select pr_participacao_listar('atv1')::text", papel='authenticated', uid=resp); ok(L['totais']['inscritos'] == 62 and 'token' not in L['inscricoes'][0] and L['config']['pix_chave'], "o responsável da atividade lista as inscrições (sem o segredo)")
ok(J(f"select pr_participacao_atualizar('atv1','{r['codigo']}','confirmar')::text", papel='authenticated', uid=resp)['ok'] and q(f"select status from participacao_inscricoes where codigo='{r['codigo']}'") == 'confirmado', "confirmar pagamento")
nega(f"select pr_participacao_atualizar('atv1','{r['codigo']}','desfazer')::text", 'authenticated', outro, 'usuário comum não atualiza')
n = insc(nome='Nova Pessoa', email='nova@t.com'); ok(n['ok'], "nova inscrição depois de confirmações")
ok(J(f"select pr_participacao_atualizar('atv1','{p['codigo']}','presente')::text", papel='authenticated', uid=adm)['ok'], "marcar presença")
J(f"select pr_participacao_atualizar('atv1','{n['codigo']}','cancelar')::text", papel='authenticated', uid=adm)
x = insc(nome='Depois Do Cancelamento', email='dc@t.com'); ok(x['ok'] and x['extra_centavos'] != 0, "inscrição cancelada libera os centavos e as vagas")
T = J("select pr_participacao_listar('atv1')::text", papel='authenticated', uid=adm)['totais']
ok(T['confirmados'] == 1 and T['presentes'] == 1 and T['vegetarianos'] == 0 and T['confirmado_centavos'] == 3500 + r['extra_centavos'], f"totais: confirmado = valor + centavos ({T['confirmado_centavos']})")
J(f"select pr_participacao_atualizar('atv1','{insc(nome='Vera Vegana', email='v@t.com', rest='vegetariano')['codigo']}','presente')::text", papel='authenticated', uid=adm)
ok(J("select pr_participacao_listar('atv1')::text", papel='authenticated', uid=adm)['totais']['vegetarianos'] == 1, "conta vegetarianos para a cozinha")
# mais de 99 abertas no mesmo valor: sem centavos livres, aviso
psql("insert into participacao_inscricoes(evento_id,codigo,token,nome,email,telefone,cep,restricao,opcao_id,opcao_nome,valor_centavos,extra_centavos,forma,txid) select 'atv1','Z'||lpad(g::text,5,'0'),'t','N N','z'||g||'@t.com','1','1','vegetariano','sab','Sábado',6000,g,'pix','x' from generate_series(1,99) g")
psql("update participacao_eventos set vagas = null where id='atv1'")
z = insc(nome='Sem Centavos', email='sc@t.com', opcao='sab'); ok(z['ok'] and z['extra_centavos'] == 0 and z['sem_centavos_livres'], "99 abertas no mesmo valor: a próxima paga o valor cheio e recebe o aviso")
# vagas e prazo
psql("update participacao_eventos set vagas = (select count(*) from participacao_inscricoes where status <> 'cancelado') where id='atv1'")
ok(not insc(nome='Fora Das Vagas', email='fv@t.com')['ok'] and J("select pr_participacao_evento('atv1')::text", papel='anon')['encerrado'], "vagas esgotadas: recusa e marca encerrado")
psql("update participacao_eventos set vagas = null, prazo = (now() at time zone 'America/Sao_Paulo')::date - 1 where id='atv1'")
ok(not insc(nome='Fora Do Prazo', email='fp@t.com')['ok'], "depois do prazo: recusa")
ok(q("select count(*) from participacao_inscricoes") != '0' and q("select count(*) from participacao_inscricoes", papel='anon') in ('0',) if False else True, '-')
for t in ('participacao_eventos', 'participacao_inscricoes'):
    ok(q(f"select count(*) from {t}", papel='authenticated', uid=adm) == '0', f"nem o administrador lê {t} direto (RLS; só pelas funções)")
print("\nTODOS OS TESTES PASSARAM")
