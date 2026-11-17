"""
Bloco 7 — Painel de Métricas e Indicadores
Testes: migration 0019, com-analytics.js, area-restrita.html,
        linguagem humanista nos módulos de comunicação.
"""

import os
import re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def ler(rel):
    with open(os.path.join(BASE, rel), encoding='utf-8') as f:
        return f.read()

def arquivo_existe(rel):
    return os.path.exists(os.path.join(BASE, rel))

# ── Migration 0019 ─────────────────────────────────────────────────────────

def test_migration_0019_existe():
    assert arquivo_existe('supabase/migrations/0019_metricas_comunicacao.sql'), \
        "migration 0019 não encontrada"

def test_migration_0019_funcao_metricas():
    sql = ler('supabase/migrations/0019_metricas_comunicacao.sql')
    assert 'pr_metricas_comunicacao' in sql, "deve ter função pr_metricas_comunicacao"

def test_migration_0019_contatos():
    sql = ler('supabase/migrations/0019_metricas_comunicacao.sql')
    assert 'com_contatos' in sql, "deve consultar coleção com_contatos"

def test_migration_0019_inscricoes():
    sql = ler('supabase/migrations/0019_metricas_comunicacao.sql')
    assert 'com_inscricoes' in sql, "deve consultar coleção com_inscricoes"

def test_migration_0019_feedback():
    sql = ler('supabase/migrations/0019_metricas_comunicacao.sql')
    assert 'com_feedbacks' in sql, "deve consultar coleção com_feedbacks"

def test_migration_0019_envios():
    sql = ler('supabase/migrations/0019_metricas_comunicacao.sql')
    assert 'com_envios' in sql, "deve consultar coleção com_envios"

def test_migration_0019_atividades():
    sql = ler('supabase/migrations/0019_metricas_comunicacao.sql')
    assert 'atividades' in sql, "deve consultar coleção atividades"

def test_migration_0019_grant_authenticated():
    sql = ler('supabase/migrations/0019_metricas_comunicacao.sql')
    assert 'authenticated' in sql, "deve ter grant para authenticated"

def test_migration_0019_retorna_jsonb():
    sql = ler('supabase/migrations/0019_metricas_comunicacao.sql')
    assert 'jsonb' in sql.lower(), "deve retornar jsonb"

# ── com-analytics.js ───────────────────────────────────────────────────────

def test_com_analytics_existe():
    assert arquivo_existe('com-analytics.js'), "com-analytics.js não encontrado"

def test_com_analytics_exporta():
    js = ler('com-analytics.js')
    assert 'PR_ANALYTICS' in js, "deve exportar window.PR_ANALYTICS"

def test_com_analytics_buscar_metricas():
    js = ler('com-analytics.js')
    assert 'buscarMetricas' in js, "deve ter função buscarMetricas"

def test_com_analytics_rpc():
    js = ler('com-analytics.js')
    assert 'pr_metricas_comunicacao' in js, "deve chamar RPC pr_metricas_comunicacao"

def test_com_analytics_render_painel():
    js = ler('com-analytics.js')
    assert 'renderPainel' in js, "deve ter função renderPainel"

def test_com_analytics_secao_pessoas():
    js = ler('com-analytics.js')
    assert 'Pessoas' in js or 'pessoas' in js, "deve ter seção de pessoas"

def test_com_analytics_secao_atividades():
    js = ler('com-analytics.js')
    assert 'Atividades' in js or 'atividades' in js, "deve ter seção de atividades"

def test_com_analytics_secao_feedback():
    js = ler('com-analytics.js')
    assert 'Retorno' in js or 'feedback' in js.lower(), "deve ter seção de retornos"

def test_com_analytics_secao_email():
    js = ler('com-analytics.js')
    assert 'Avisos' in js or 'envios' in js.lower(), "deve ter seção de avisos por e-mail"

def test_com_analytics_barra_voltaria():
    js = ler('com-analytics.js')
    assert 'voltaria' in js and ('Sim' in js or 'barra' in js.lower()), \
        "deve ter visualização de voltaria"

def test_com_analytics_sem_termos_corporativos():
    js = ler('com-analytics.js')
    termos = ['cliente', ' lead', 'prospect', ' CRM', 'conversão', 'negócio', 'lucro']
    encontrados = [t for t in termos if t.lower() in js.lower()]
    assert len(encontrados) == 0, \
        "com-analytics.js não deve ter termos corporativos: " + str(encontrados)

# ── area-restrita.html ─────────────────────────────────────────────────────

def test_area_restrita_inclui_com_analytics():
    html = ler('area-restrita.html')
    assert 'com-analytics.js' in html, "area-restrita.html deve incluir com-analytics.js"

# ── Linguagem humanista — módulos de comunicação ───────────────────────────

TERMOS_PROIBIDOS = ['cliente', ' lead ', 'prospect', 'mailing list',
                    'newsletter', 'blast', 'conversão', 'negócio', ' lucro']

def _verifica_linguagem(arquivo):
    """Retorna lista de termos corporativos encontrados no arquivo."""
    if not arquivo_existe(arquivo):
        return []
    conteudo = ler(arquivo).lower()
    return [t for t in TERMOS_PROIBIDOS if t.lower() in conteudo]

def test_linguagem_com_analytics():
    encontrados = _verifica_linguagem('com-analytics.js')
    assert len(encontrados) == 0, \
        "com-analytics.js tem termos corporativos: " + str(encontrados)

def test_linguagem_com_feedback():
    encontrados = _verifica_linguagem('com-feedback.js')
    assert len(encontrados) == 0, \
        "com-feedback.js tem termos corporativos: " + str(encontrados)

def test_linguagem_com_analytics_usa_pessoas():
    js = ler('com-analytics.js')
    termos_humanistas = ['visitante', 'participante', 'apoiador', 'mestre', 'voluntário', 'voluntario']
    encontrados = [t for t in termos_humanistas if t.lower() in js.lower()]
    assert len(encontrados) >= 2, \
        "com-analytics.js deve usar linguagem humanista (visitante, participante, etc.)"

def test_linguagem_painel_pessoas_nao_usa_crm():
    js = ler('com-analytics.js')
    assert 'CRM' not in js and 'crm' not in js.lower(), \
        "painel não deve referenciar CRM — usar 'Pessoas do Parque'"

def test_linguagem_painel_usa_pessoas_do_parque():
    js = ler('com-analytics.js')
    assert 'Pessoas do Parque' in js or 'pessoas do parque' in js.lower(), \
        "painel deve usar 'Pessoas do Parque' em vez de CRM"

def test_linguagem_painel_email_usa_avisos():
    js = ler('com-analytics.js')
    assert 'Avisos' in js or 'avisos' in js.lower(), \
        "seção de e-mail deve usar 'Avisos' em vez de 'E-mail Marketing'"

def test_linguagem_painel_feedback_usa_retorno():
    js = ler('com-analytics.js')
    assert 'Retorno' in js or 'retorno' in js.lower(), \
        "seção de feedback deve usar linguagem de retorno/escuta"

# ── Verificação estrutural da migration ───────────────────────────────────

def test_migration_0019_aceita_avisos():
    sql = ler('supabase/migrations/0019_metricas_comunicacao.sql')
    assert 'aceita_avisos' in sql, "deve contar pessoas que aceitam avisos"

def test_migration_0019_voltaria():
    sql = ler('supabase/migrations/0019_metricas_comunicacao.sql')
    assert 'voltaria' in sql, "deve agregar campo voltaria do feedback"

def test_migration_0019_presenca():
    sql = ler('supabase/migrations/0019_metricas_comunicacao.sql')
    assert 'presenca' in sql, "deve contar presentes nas atividades"

# ── Runner ─────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    import sys
    testes = [(n, f) for n, f in sorted(globals().items()) if n.startswith('test_')]
    ok = 0; falhas = []
    for nome, fn in testes:
        try:
            fn()
            print(f'  ✓ {nome}')
            ok += 1
        except AssertionError as e:
            print(f'  ✗ {nome}: {e}')
            falhas.append(nome)
        except Exception as e:
            print(f'  ✗ {nome}: ERRO — {e}')
            falhas.append(nome)
    print(f'\n{ok}/{len(testes)} testes passaram.')
    if falhas:
        print('Falhas:', ', '.join(falhas))
        sys.exit(1)
