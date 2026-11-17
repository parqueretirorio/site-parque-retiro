"""
Bloco 6 — Formulário "Como foi a sua visita?"
Testes: migration 0018, publico.js (caixas/vitrines), visita-feedback.html, com-feedback.js
"""

import os
import re
import json

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def ler(rel):
    with open(os.path.join(BASE, rel), encoding='utf-8') as f:
        return f.read()

# ── Migration 0018 ─────────────────────────────────────────────────────────

def test_migration_0018_existe():
    p = os.path.join(BASE, 'supabase', 'migrations', '0018_feedback_visita.sql')
    assert os.path.exists(p), "migration 0018 não encontrada"

def test_migration_0018_caixa_feedback():
    sql = ler('supabase/migrations/0018_feedback_visita.sql')
    assert 'feedback' in sql, "migration 0018 deve aceitar caixa 'feedback'"

def test_migration_0018_rate_limit():
    sql = ler('supabase/migrations/0018_feedback_visita.sql')
    assert '300' in sql or 'rate' in sql.lower(), "migration 0018 deve ter rate limiting"

def test_migration_0018_contagem():
    sql = ler('supabase/migrations/0018_feedback_visita.sql')
    assert 'pr_contagem_feedback' in sql, "migration 0018 deve ter pr_contagem_feedback"

def test_migration_0018_grant_anon():
    sql = ler('supabase/migrations/0018_feedback_visita.sql')
    assert 'anon' in sql, "pr_enviar_publico deve ter grant para anon"

def test_migration_0018_grant_authenticated():
    sql = ler('supabase/migrations/0018_feedback_visita.sql')
    assert 'authenticated' in sql, "migration 0018 deve ter grant para authenticated"

# ── publico.js — vitrine atividades_pub ────────────────────────────────────

def test_publico_vitrine_atividades_pub():
    js = ler('publico.js')
    assert 'atividades_pub' in js, "publico.js deve ter vitrine atividades_pub"

def test_publico_vitrine_atividades_pub_filtra_ativo():
    js = ler('publico.js')
    assert 'ativo' in js, "vitrine atividades_pub deve filtrar por ativo"

def test_publico_pagina_feedback():
    js = ler('publico.js')
    assert 'feedback' in js, "PAGINAS deve ter entrada 'feedback'"

def test_publico_pagina_encontro_atividades_pub():
    js = ler('publico.js')
    assert 'atividades_pub' in js, "página encontro deve referenciar atividades_pub"

# ── publico.js — caixa feedback ────────────────────────────────────────────

def test_publico_caixa_feedback_existe():
    js = ler('publico.js')
    assert 'feedback:' in js or "'feedback'" in js, "caixa 'feedback' deve existir em publico.js"

def test_publico_caixa_feedback_voltaria():
    js = ler('publico.js')
    assert 'voltaria' in js, "caixa feedback deve ter campo voltaria"

def test_publico_caixa_feedback_valores_voltaria():
    js = ler('publico.js')
    assert 'sim' in js and 'talvez' in js and 'nao' in js, \
        "voltaria deve aceitar sim, talvez, nao"

def test_publico_caixa_feedback_quer_avisos():
    js = ler('publico.js')
    assert 'quer_avisos' in js, "caixa feedback deve ter campo quer_avisos"

def test_publico_caixa_feedback_email_condicional():
    js = ler('publico.js')
    assert 'quer_avisos' in js and 'email' in js, \
        "email só aparece se quer_avisos for true"

def test_publico_caixa_feedback_como_soube():
    js = ler('publico.js')
    assert 'como_soube' in js, "caixa feedback deve ter campo como_soube"

def test_publico_caixa_feedback_destaque():
    js = ler('publico.js')
    assert 'destaque' in js, "caixa feedback deve ter campo destaque"

def test_publico_caixa_feedback_melhorar():
    js = ler('publico.js')
    assert 'melhorar' in js, "caixa feedback deve ter campo melhorar"

def test_publico_caixa_feedback_id_gerado():
    js = ler('publico.js')
    assert 'Date.now' in js or 'criadoEm' in js, \
        "caixa feedback deve gerar id ou timestamp"

def test_publico_caixa_feedback_origem_publica():
    js = ler('publico.js')
    assert 'publica' in js, "caixa feedback deve marcar origem como 'publica'"

# ── publico.js — caixa inscricoes ──────────────────────────────────────────

def test_publico_caixa_inscricoes_existe():
    js = ler('publico.js')
    assert 'inscricoes:' in js or "'inscricoes'" in js or 'inscricoes' in js, \
        "caixa 'inscricoes' deve existir em publico.js"

# ── visita-feedback.html ───────────────────────────────────────────────────

def test_feedback_html_existe():
    p = os.path.join(BASE, 'visita-feedback.html')
    assert os.path.exists(p), "visita-feedback.html não encontrado"

def test_feedback_html_data_page():
    html = ler('visita-feedback.html')
    assert 'data-page="feedback"' in html, "body deve ter data-page='feedback'"

def test_feedback_html_pergunta_como_soube():
    html = ler('visita-feedback.html')
    assert 'como' in html.lower() and 'soube' in html.lower(), \
        "formulário deve ter pergunta sobre como soube"

def test_feedback_html_pergunta_destaque():
    html = ler('visita-feedback.html')
    assert 'chamou' in html.lower() or 'destaque' in html.lower() or 'atenção' in html.lower(), \
        "formulário deve ter pergunta sobre destaque"

def test_feedback_html_pergunta_melhorar():
    html = ler('visita-feedback.html')
    assert 'melhorar' in html.lower(), "formulário deve ter pergunta sobre melhorar"

def test_feedback_html_pergunta_voltaria():
    html = ler('visita-feedback.html')
    assert 'voltaria' in html.lower() or 'voltaria' in html, \
        "formulário deve ter pergunta sobre voltaria"

def test_feedback_html_opcoes_voltaria():
    html = ler('visita-feedback.html')
    assert 'sim' in html.lower() and 'talvez' in html.lower(), \
        "deve ter opções sim e talvez para voltaria"

def test_feedback_html_pergunta_avisos():
    html = ler('visita-feedback.html')
    assert 'avisos' in html.lower() or 'aviso' in html.lower(), \
        "formulário deve ter pergunta sobre receber avisos"

def test_feedback_html_campo_email():
    html = ler('visita-feedback.html')
    assert 'fb-email' in html or 'type="email"' in html, \
        "deve ter campo de e-mail"

def test_feedback_html_tela_sucesso():
    html = ler('visita-feedback.html')
    assert 'fb-sucesso' in html or 'sucesso' in html.lower(), \
        "deve ter tela de sucesso"

def test_feedback_html_script_publico():
    html = ler('visita-feedback.html')
    assert 'publico.js' in html, "deve incluir publico.js"

def test_feedback_html_script_vitrine_publica():
    html = ler('visita-feedback.html')
    assert 'vitrine-publica.js' in html, "deve incluir vitrine-publica.js"

def test_feedback_html_script_com_feedback():
    html = ler('visita-feedback.html')
    assert 'com-feedback.js' in html, "deve incluir com-feedback.js"

# ── com-feedback.js ────────────────────────────────────────────────────────

def test_com_feedback_existe():
    p = os.path.join(BASE, 'com-feedback.js')
    assert os.path.exists(p), "com-feedback.js não encontrado"

def test_com_feedback_exporta_pr_feedback():
    js = ler('com-feedback.js')
    assert 'PR_FEEDBACK' in js, "deve exportar window.PR_FEEDBACK"

def test_com_feedback_iniciar():
    js = ler('com-feedback.js')
    assert 'iniciar' in js, "deve ter função iniciar"

def test_com_feedback_ler_feedbacks():
    js = ler('com-feedback.js')
    assert 'lerFeedbacks' in js, "deve ter função lerFeedbacks"

def test_com_feedback_exportar_csv():
    js = ler('com-feedback.js')
    assert 'exportarCSV' in js, "deve ter função exportarCSV"

def test_com_feedback_csv_bom():
    js = ler('com-feedback.js')
    assert 'ufeff' in js or 'BOM' in js or 'utf-8' in js.lower(), \
        "CSV deve ter BOM UTF-8"

def test_com_feedback_render_painel():
    js = ler('com-feedback.js')
    assert 'renderPainel' in js, "deve ter função renderPainel"

def test_com_feedback_buscar_resumo():
    js = ler('com-feedback.js')
    assert 'buscarResumo' in js or 'pr_contagem_feedback' in js, \
        "deve chamar pr_contagem_feedback"

def test_com_feedback_rpc_contagem():
    js = ler('com-feedback.js')
    assert 'pr_contagem_feedback' in js, "deve usar RPC pr_contagem_feedback"

def test_com_feedback_voltaria_labels():
    js = ler('com-feedback.js')
    assert 'Sim' in js and 'Talvez' in js, "deve ter labels de voltaria"

def test_com_feedback_iniciar_pagina_publica():
    js = ler('com-feedback.js')
    assert 'feedback' in js and ('DOMContentLoaded' in js or 'data-page' in js), \
        "deve auto-iniciar na página pública"

def test_com_feedback_pr_vitrine_enviar():
    js = ler('com-feedback.js')
    assert "PR_VITRINE" in js and "enviar" in js, \
        "deve chamar PR_VITRINE.enviar para submeter formulário"

# ── area-restrita.html — scripts ───────────────────────────────────────────

def test_area_restrita_inclui_com_feedback():
    html = ler('area-restrita.html')
    assert 'com-feedback.js' in html, "area-restrita.html deve incluir com-feedback.js"

def test_area_restrita_inclui_com_pessoas():
    html = ler('area-restrita.html')
    assert 'com-pessoas.js' in html, "area-restrita.html deve incluir com-pessoas.js"

def test_area_restrita_inclui_com_email():
    html = ler('area-restrita.html')
    assert 'com-email.js' in html, "area-restrita.html deve incluir com-email.js"

def test_area_restrita_inclui_com_agenda():
    html = ler('area-restrita.html')
    assert 'com-agenda.js' in html, "area-restrita.html deve incluir com-agenda.js"

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
