-- Migration 0019 — Métricas de Comunicação
-- Retorna resumo de indicadores do Parque para o painel de métricas.
-- Acesso: apenas usuários autenticados (equipe).

-- ── Função principal ───────────────────────────────────────────────────────

create or replace function pr_metricas_comunicacao()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_contatos        jsonb;
  v_inscricoes      jsonb;
  v_feedback        jsonb;
  v_envios          jsonb;
  v_atividades      jsonb;
begin

  -- Contatos por vínculo
  select jsonb_build_object(
    'total',       count(*),
    'visitante',   count(*) filter (where dados->>'vinculo' = 'visitante'),
    'inscrito',    count(*) filter (where dados->>'vinculo' = 'inscrito'),
    'doador',      count(*) filter (where dados->>'vinculo' = 'doador'),
    'comprador',   count(*) filter (where dados->>'vinculo' = 'comprador'),
    'mestre',      count(*) filter (where dados->>'vinculo' = 'mestre'),
    'voluntario',  count(*) filter (where dados->>'vinculo' = 'voluntario'),
    'aceita_avisos', count(*) filter (where (dados->>'aceita_avisos')::boolean = true)
  )
  into v_contatos
  from registros
  where colecao = 'com_contatos';

  -- Inscrições por atividade (top 10 mais recentes)
  select coalesce(
    jsonb_agg(r order by r.total desc),
    '[]'::jsonb
  )
  into v_inscricoes
  from (
    select
      dados->>'atividade' as atividade,
      count(*) as total,
      count(*) filter (where dados->>'presenca' = 'sim') as presentes
    from registros
    where colecao = 'com_inscricoes'
      and dados->>'atividade' is not null
    group by dados->>'atividade'
    order by total desc
    limit 10
  ) r;

  -- Feedback: resumo geral
  select jsonb_build_object(
    'total',       count(*),
    'voltaria_sim',    count(*) filter (where dados->>'voltaria' = 'sim'),
    'voltaria_talvez', count(*) filter (where dados->>'voltaria' = 'talvez'),
    'voltaria_nao',    count(*) filter (where dados->>'voltaria' = 'nao'),
    'quer_avisos',     count(*) filter (where (dados->>'quer_avisos')::boolean = true)
  )
  into v_feedback
  from registros
  where colecao = 'com_feedbacks';

  -- Envios de e-mail (histórico, últimos 10)
  select coalesce(
    jsonb_agg(r order by r.enviado_em desc),
    '[]'::jsonb
  )
  into v_envios
  from (
    select
      dados->>'assunto'    as assunto,
      dados->>'tipo_dest'  as tipo_dest,
      (dados->>'total_enviados')::int as total_enviados,
      dados->>'enviado_em' as enviado_em
    from registros
    where colecao = 'com_envios'
    order by dados->>'enviado_em' desc
    limit 10
  ) r;

  -- Atividades cadastradas
  select jsonb_build_object(
    'total',   count(*),
    'ativas',  count(*) filter (where (dados->>'ativo')::boolean = true),
    'futuras', count(*) filter (
      where (dados->>'ativo')::boolean = true
        and (dados->>'data')::date >= current_date
    )
  )
  into v_atividades
  from registros
  where colecao = 'atividades';

  return jsonb_build_object(
    'gerado_em',  now(),
    'contatos',   coalesce(v_contatos,   '{}'::jsonb),
    'inscricoes', coalesce(v_inscricoes, '[]'::jsonb),
    'feedback',   coalesce(v_feedback,   '{}'::jsonb),
    'envios',     coalesce(v_envios,     '[]'::jsonb),
    'atividades', coalesce(v_atividades, '{}'::jsonb)
  );
end;
$$;

grant execute on function pr_metricas_comunicacao() to authenticated;
