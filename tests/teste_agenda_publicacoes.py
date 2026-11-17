"""
Teste automático — Bloco 1: Agenda de Publicações (17/11/2026)
Verifica: com-agenda.js, migração 0016, inclusão em area-restrita.html.
"""
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
ok = []; falha = []

def check(desc, cond, detalhe=''):
    if cond: ok.append(desc)
    else: falha.append(desc + (f' | {detalhe}' if detalhe else ''))

# ── com-agenda.js ─────────────────────────────────────────────────────────────
js = open(os.path.join(ROOT, 'com-agenda.js'), encoding='utf-8').read()

check('com-agenda.js: renderPainel definida',            'function renderPainel' in js)
check('com-agenda.js: criarPublicacao definida',         'function criarPublicacao' in js)
check('com-agenda.js: atualizarPublicacao definida',     'function atualizarPublicacao' in js)
check('com-agenda.js: removerPublicacao definida',       'function removerPublicacao' in js)
check('com-agenda.js: importarPacote definida',          'function importarPacote' in js)
check('com-agenda.js: exportarCSV definida',             'function exportarCSV' in js)
check('com-agenda.js: lerPublicacoes definida',          'function lerPublicacoes' in js)
check('com-agenda.js: canal instagram',                  'instagram' in js)
check('com-agenda.js: canal facebook',                   'facebook' in js)
check('com-agenda.js: canal whatsapp_canal',             'whatsapp_canal' in js)
check('com-agenda.js: canal whatsapp_comunidade',        'whatsapp_comunidade' in js)
check('com-agenda.js: canal site',                       'site:' in js or "'site'" in js or '"site"' in js)
check('com-agenda.js: canal email',                      'email:' in js or "'email'" in js or '"email"' in js)
check('com-agenda.js: status rascunho',                  'rascunho' in js)
check('com-agenda.js: status pronto',                    'pronto' in js)
check('com-agenda.js: status publicado',                 'publicado' in js)
check('com-agenda.js: vista mes',                        "'mes'" in js or '"mes"' in js)
check('com-agenda.js: vista semana',                     "'semana'" in js or '"semana"' in js)
check('com-agenda.js: vista lista',                      "'lista'" in js or '"lista"' in js)
check('com-agenda.js: cores por canal',                  'cor:' in js or "cor'" in js)
check('com-agenda.js: filtro por campanha',              'campanha' in js)
check('com-agenda.js: botao abrir whatsapp',             'wa.me' in js)
check('com-agenda.js: marcar como publicado',            'Marcar como publicado' in js)
check('com-agenda.js: importar pacote do Claude',        'Importar pacote' in js)
check('com-agenda.js: PR_AGENDA exportado',              'window.PR_AGENDA' in js)
check('com-agenda.js: exporta CSV com BOM',              'ufeff' in js or 'utf-8' in js.lower())

# ── migração 0016 ─────────────────────────────────────────────────────────────
sql = open(os.path.join(ROOT, 'supabase/migrations/0016_agenda_publicacoes.sql'), encoding='utf-8').read()

check('migração 0016: função pr_buscar_publicacoes',     'pr_buscar_publicacoes' in sql)
check('migração 0016: colecao com_publicacoes',          'com_publicacoes' in sql)
check('migração 0016: filtro por canal',                 'p_canal' in sql)
check('migração 0016: filtro por status',                'p_status' in sql)
check('migração 0016: filtro por campanha',              'p_campanha' in sql)
check('migração 0016: grant para authenticated',         'authenticated' in sql)
check('migração 0016: confirmação ok',                   'ok' in sql)

# ── area-restrita.html ────────────────────────────────────────────────────────
html = open(os.path.join(ROOT, 'area-restrita.html'), encoding='utf-8').read()

check('area-restrita.html: carrega com-agenda.js',       'com-agenda.js' in html)
check('area-restrita.html: agenda antes do emailmkt',    html.index('com-agenda.js') < html.index('com-emailmkt.js'))

# ── Resultado ─────────────────────────────────────────────────────────────────
total = len(ok) + len(falha)
print(f'\n{"="*60}')
print(f'Bloco 1 — Agenda de Publicações: {len(ok)}/{total} verificações OK')
print(f'{"="*60}')
if falha:
    print('\nFALHAS:')
    for f in falha: print(f'  ✗ {f}')
else:
    print('\nTodas as verificações passaram.')
print()
