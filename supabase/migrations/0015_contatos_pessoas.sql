-- Migração 0015 — Lista de Pessoas do Parque (Bloco 4)
-- Cria a coleção com_contatos, funções de consulta com filtros e
-- função de sincronização que consolida inscrições, doações e encomendas.

-- ── 1. Garantir permissões base ───────────────────────────────────────────────
grant usage on schema public to anon, authenticated;

-- ── 2. Função: buscar contatos com filtros ────────────────────────────────────
-- Retorna a lista completa de contatos, opcionalmente filtrada.
-- Parâmetros (todos opcionais, null = sem filtro):
--   p_vinculo  text   : 'visitante' | 'inscrito' | 'doador' | 'comprador' | 'mestre' | 'voluntario'
--   p_cidade   text   : filtra por cidade (ilike)
--   p_aceita   boolean: filtra por aceita_avisos
--   p_q        text   : busca livre em nome e e-mail (ilike)
-- Retorna jsonb com { total, contatos[] }
create or replace function pr_buscar_contatos(
  p_vinculo  text    default null,
  p_cidade   text    default null,
  p_aceita   boolean default null,
  p_q        text    default null
) returns jsonb
language plpgsql security definer
as $$
declare
  v_registro  record;
  v_contatos  jsonb := '[]'::jsonb;
  v_item      jsonb;
  v_ok        boolean;
  v_total     integer := 0;
begin
  -- Lê a coleção com_contatos; se não existir, retorna vazio
  select dados into v_item from registros where colecao = 'com_contatos' limit 1;
  if not found or v_item is null then
    return jsonb_build_object('total', 0, 'contatos', '[]'::jsonb);
  end if;

  -- Percorre o array e aplica filtros
  for v_item in select * from jsonb_array_elements(v_item)
  loop
    v_ok := true;
    -- filtro vínculo
    if p_vinculo is not null and not (v_item ? 'vinculo' and v_item->'vinculo' @> to_jsonb(p_vinculo)) then
      v_ok := false;
    end if;
    -- filtro cidade
    if v_ok and p_cidade is not null and not (
      lower(v_item->>'cidade') ilike '%' || lower(p_cidade) || '%'
    ) then v_ok := false; end if;
    -- filtro aceita_avisos
    if v_ok and p_aceita is not null and (v_item->>'aceita_avisos')::boolean is distinct from p_aceita then
      v_ok := false;
    end if;
    -- busca livre
    if v_ok and p_q is not null and not (
      lower(v_item->>'nome')  ilike '%' || lower(p_q) || '%' or
      lower(v_item->>'email') ilike '%' || lower(p_q) || '%'
    ) then v_ok := false; end if;

    if v_ok then
      v_contatos := v_contatos || jsonb_build_array(v_item);
      v_total := v_total + 1;
    end if;
  end loop;

  return jsonb_build_object('total', v_total, 'contatos', v_contatos);
end;
$$;

revoke all on function pr_buscar_contatos(text, text, boolean, text) from public;
grant execute on function pr_buscar_contatos(text, text, boolean, text) to authenticated;

-- ── 3. Função: sincronizar contatos ──────────────────────────────────────────
-- Lê inscricoes, doacoes e encomendas e garante que cada e-mail
-- esteja na lista com_contatos com o vínculo correto.
-- Não apaga contatos existentes; só adiciona novos e enriquece vínculos.
-- Retorna jsonb { adicionados, atualizados, total }
create or replace function pr_sincronizar_contatos()
returns jsonb
language plpgsql security definer
as $$
declare
  v_contatos   jsonb := '[]'::jsonb;
  v_mapa       jsonb := '{}'::jsonb;  -- email → contato
  v_item       jsonb;
  v_email      text;
  v_existente  jsonb;
  v_novos      integer := 0;
  v_atualizados integer := 0;
  v_vinculos   jsonb;
begin
  -- Carrega lista atual
  select dados into v_contatos from registros where colecao = 'com_contatos' limit 1;
  if v_contatos is null then v_contatos := '[]'::jsonb; end if;

  -- Monta mapa email → índice
  for v_item in select * from jsonb_array_elements(v_contatos)
  loop
    v_email := lower(trim(v_item->>'email'));
    if v_email <> '' then
      v_mapa := jsonb_set(v_mapa, array[v_email], v_item);
    end if;
  end loop;

  -- ── Inscrições em atividades ──────────────────────────────────────────────
  declare v_inscricoes jsonb;
  begin
    select dados into v_inscricoes from registros where colecao = 'com_inscricoes' limit 1;
    if v_inscricoes is not null then
      for v_item in select * from jsonb_array_elements(v_inscricoes)
      loop
        v_email := lower(trim(v_item->>'email'));
        if v_email = '' then continue; end if;
        v_existente := v_mapa->v_email;
        if v_existente is null then
          v_existente := jsonb_build_object(
            'id',           'c' || encode(gen_random_bytes(6), 'hex'),
            'nome',         v_item->>'nome',
            'email',        v_item->>'email',
            'telefone',     coalesce(v_item->>'telefone', ''),
            'cidade',       coalesce(v_item->>'cidade', ''),
            'vinculo',      '["inscrito"]'::jsonb,
            'origem',       'inscricao',
            'aceita_avisos', true,
            'criadoEm',     coalesce(v_item->>'criadoEm', now()::text),
            'historico',    '[]'::jsonb
          );
          v_novos := v_novos + 1;
        else
          v_vinculos := coalesce(v_existente->'vinculo', '[]'::jsonb);
          if not (v_vinculos @> '"inscrito"') then
            v_vinculos := v_vinculos || '"inscrito"'::jsonb;
            v_existente := jsonb_set(v_existente, '{vinculo}', v_vinculos);
            v_atualizados := v_atualizados + 1;
          end if;
        end if;
        v_mapa := jsonb_set(v_mapa, array[v_email], v_existente);
      end loop;
    end if;
  end;

  -- ── Doações (vaquinha) ────────────────────────────────────────────────────
  declare v_doacoes jsonb;
  begin
    select dados into v_doacoes from registros where colecao = 'com_doacoes' limit 1;
    if v_doacoes is null then
      select dados into v_doacoes from registros where colecao = 'vaquinha_doacoes' limit 1;
    end if;
    if v_doacoes is not null then
      for v_item in select * from jsonb_array_elements(v_doacoes)
      loop
        v_email := lower(trim(v_item->>'email'));
        if v_email = '' then continue; end if;
        v_existente := v_mapa->v_email;
        if v_existente is null then
          v_existente := jsonb_build_object(
            'id',           'c' || encode(gen_random_bytes(6), 'hex'),
            'nome',         coalesce(v_item->>'nome', ''),
            'email',        v_item->>'email',
            'telefone',     coalesce(v_item->>'telefone', ''),
            'cidade',       coalesce(v_item->>'cidade', ''),
            'vinculo',      '["doador"]'::jsonb,
            'origem',       'vaquinha',
            'aceita_avisos', true,
            'criadoEm',     coalesce(v_item->>'criadoEm', now()::text),
            'historico',    '[]'::jsonb
          );
          v_novos := v_novos + 1;
        else
          v_vinculos := coalesce(v_existente->'vinculo', '[]'::jsonb);
          if not (v_vinculos @> '"doador"') then
            v_vinculos := v_vinculos || '"doador"'::jsonb;
            v_existente := jsonb_set(v_existente, '{vinculo}', v_vinculos);
            v_atualizados := v_atualizados + 1;
          end if;
        end if;
        v_mapa := jsonb_set(v_mapa, array[v_email], v_existente);
      end loop;
    end if;
  end;

  -- Reconstrói o array a partir do mapa
  v_contatos := '[]'::jsonb;
  for v_item in select value from jsonb_each(v_mapa)
  loop
    v_contatos := v_contatos || jsonb_build_array(v_item);
  end loop;

  -- Salva de volta
  insert into registros (colecao, id, dados)
    values ('com_contatos', 'lista', v_contatos)
    on conflict (colecao, id) do update set dados = excluded.dados, atualizado_em = now();

  return jsonb_build_object(
    'adicionados',  v_novos,
    'atualizados',  v_atualizados,
    'total',        jsonb_array_length(v_contatos)
  );
end;
$$;

revoke all on function pr_sincronizar_contatos() from public;
grant execute on function pr_sincronizar_contatos() to authenticated;

-- ── Confirmação ──────────────────────────────────────────────────────────────
select 'ok - migração 0015 (contatos) aplicada' as resultado;
