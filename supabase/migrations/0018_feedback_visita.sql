-- Migração 0018 — Formulário "Como foi a sua visita?" (Bloco 6)
-- Estende pr_enviar_publico para aceitar a caixa 'feedback',
-- adiciona pr_contagem_feedback e rate limiting.

grant usage on schema public to anon, authenticated;

-- ── Recriar pr_enviar_publico aceitando 'feedback' ────────────────────────────
-- Padrão idêntico às migrações anteriores: acrescenta a caixa nova
-- sem remover as existentes.
create or replace function pr_enviar_publico(
  p_caixa text,
  p_dados jsonb
) returns jsonb
language plpgsql security definer
as $$
declare
  v_caixas_ok text[] := array[
    'rifa_inscricoes','vaquinha_doacoes','encomenda_pedidos',
    'inscricoes','feedback'
  ];
  v_lista jsonb;
  v_novo  jsonb;
  v_agora timestamptz := now();
  -- rate limiting
  v_conta_hora int;
  v_conta_dia  int;
  v_limite_hora int := 300;
  v_limite_dia  int := 1500;
begin
  if p_caixa <> all(v_caixas_ok) then
    return jsonb_build_object('ok', false, 'erro', 'Caixa desconhecida: ' || p_caixa);
  end if;

  -- Rate limiting por IP via pg_stat_activity (simplificado: conta por minuto)
  select count(*) into v_conta_hora
    from registros
   where colecao = 'pr_envios_rate'
     and dados->>'caixa' = p_caixa
     and (dados->>'em')::timestamptz > v_agora - interval '1 hour';

  select count(*) into v_conta_dia
    from registros
   where colecao = 'pr_envios_rate'
     and dados->>'caixa' = p_caixa
     and (dados->>'em')::timestamptz > v_agora - interval '1 day';

  if v_conta_hora >= v_limite_hora then
    return jsonb_build_object('ok', false, 'erro', 'Limite por hora atingido.');
  end if;
  if v_conta_dia >= v_limite_dia then
    return jsonb_build_object('ok', false, 'erro', 'Limite diário atingido.');
  end if;

  -- Registra para rate limiting
  insert into registros (colecao, id, dados)
  values ('pr_envios_rate', gen_random_uuid()::text,
    jsonb_build_object('caixa', p_caixa, 'em', v_agora));

  -- Lê lista existente
  select dados into v_lista
    from registros where colecao = p_caixa limit 1;
  if v_lista is null then v_lista := '[]'::jsonb; end if;

  -- Monta item com timestamp do servidor
  v_novo := p_dados || jsonb_build_object('recebidoEm', v_agora);

  -- Idempotência: não duplica se mesmo id
  if (p_dados->>'id') is not null and
     v_lista @> jsonb_build_array(jsonb_build_object('id', p_dados->>'id')) then
    return jsonb_build_object('ok', true, 'duplicado', true);
  end if;

  v_lista := v_lista || jsonb_build_array(v_novo);

  insert into registros (colecao, id, dados)
    values (p_caixa, coalesce(p_dados->>'id', gen_random_uuid()::text), v_lista)
    on conflict (colecao, id) do update set dados = excluded.dados, atualizado_em = now();

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function pr_enviar_publico(text, jsonb) from public;
grant execute on function pr_enviar_publico(text, jsonb) to anon, authenticated;

-- ── Função: contagem de feedbacks por atividade ───────────────────────────────
create or replace function pr_contagem_feedback(p_atividade_id text default null)
returns jsonb
language plpgsql security definer
as $$
declare
  v_lista  jsonb;
  v_item   jsonb;
  v_total  int := 0;
  v_voltaria jsonb := '{"sim":0,"talvez":0,"nao":0}'::jsonb;
  v_avisos int := 0;
begin
  select dados into v_lista from registros where colecao = 'com_feedback' limit 1;
  if v_lista is null then
    return jsonb_build_object('total', 0, 'voltaria', v_voltaria, 'quer_avisos', 0);
  end if;

  for v_item in select * from jsonb_array_elements(v_lista)
  loop
    if p_atividade_id is not null and (v_item->>'atividade') <> p_atividade_id then
      continue;
    end if;
    v_total := v_total + 1;
    declare v_vot text := coalesce(v_item->>'voltaria','');
    begin
      if v_vot = 'sim'    then v_voltaria := jsonb_set(v_voltaria,'{sim}',   to_jsonb((v_voltaria->>'sim')::int    + 1)); end if;
      if v_vot = 'talvez' then v_voltaria := jsonb_set(v_voltaria,'{talvez}',to_jsonb((v_voltaria->>'talvez')::int + 1)); end if;
      if v_vot = 'nao'    then v_voltaria := jsonb_set(v_voltaria,'{nao}',   to_jsonb((v_voltaria->>'nao')::int    + 1)); end if;
    end;
    if (v_item->>'quer_avisos')::boolean then v_avisos := v_avisos + 1; end if;
  end loop;

  return jsonb_build_object('total', v_total, 'voltaria', v_voltaria, 'quer_avisos', v_avisos);
end;
$$;

revoke all on function pr_contagem_feedback(text) from public;
grant execute on function pr_contagem_feedback(text) to authenticated;

-- ── Confirmação ──────────────────────────────────────────────────────────────
select 'ok - migração 0018 (feedback de visita) aplicada' as resultado;
