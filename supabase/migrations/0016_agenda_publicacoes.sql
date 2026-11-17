-- Migração 0016 — Agenda de Publicações (Bloco 1)
-- Cria a coleção com_publicacoes e funções de apoio para a agenda de redes sociais.

grant usage on schema public to anon, authenticated;

-- ── Função: buscar publicações por período ────────────────────────────────────
-- Retorna publicações dentro de um intervalo de datas, opcionalmente filtradas.
-- Parâmetros (todos opcionais, null = sem filtro):
--   p_de      date : início do período (inclusive)
--   p_ate     date : fim do período (inclusive)
--   p_canal   text : 'instagram' | 'facebook' | 'whatsapp_canal' | 'whatsapp_comunidade' | 'site' | 'email'
--   p_status  text : 'rascunho' | 'pronto' | 'publicado'
--   p_campanha text : id da campanha vinculada
-- Retorna jsonb { total, publicacoes[] }
create or replace function pr_buscar_publicacoes(
  p_de       date    default null,
  p_ate      date    default null,
  p_canal    text    default null,
  p_status   text    default null,
  p_campanha text    default null
) returns jsonb
language plpgsql security definer
as $$
declare
  v_lista     jsonb := '[]'::jsonb;
  v_item      jsonb;
  v_ok        boolean;
  v_data_pub  date;
  v_total     integer := 0;
  v_resultado jsonb := '[]'::jsonb;
begin
  select dados into v_lista from registros where colecao = 'com_publicacoes' limit 1;
  if v_lista is null then
    return jsonb_build_object('total', 0, 'publicacoes', '[]'::jsonb);
  end if;

  for v_item in select * from jsonb_array_elements(v_lista)
  loop
    v_ok := true;
    -- filtro data
    begin
      v_data_pub := (v_item->>'data')::date;
      if p_de  is not null and v_data_pub < p_de  then v_ok := false; end if;
      if p_ate is not null and v_data_pub > p_ate  then v_ok := false; end if;
    exception when others then null; end;
    -- filtro canal
    if v_ok and p_canal    is not null and (v_item->>'canal')    is distinct from p_canal    then v_ok := false; end if;
    -- filtro status
    if v_ok and p_status   is not null and (v_item->>'status')   is distinct from p_status   then v_ok := false; end if;
    -- filtro campanha
    if v_ok and p_campanha is not null and (v_item->>'campanha') is distinct from p_campanha then v_ok := false; end if;

    if v_ok then
      v_resultado := v_resultado || jsonb_build_array(v_item);
      v_total := v_total + 1;
    end if;
  end loop;

  return jsonb_build_object('total', v_total, 'publicacoes', v_resultado);
end;
$$;

revoke all on function pr_buscar_publicacoes(date, date, text, text, text) from public;
grant execute on function pr_buscar_publicacoes(date, date, text, text, text) to authenticated;

-- ── Confirmação ──────────────────────────────────────────────────────────────
select 'ok - migração 0016 (agenda de publicações) aplicada' as resultado;
