-- Migração 0017 — Aviso por E-mail para Grupos (Bloco 5)
-- Cria a coleção com_envios para guardar o histórico de e-mails enviados
-- e a função pr_registrar_envio para salvar cada disparo.
-- (Migração 0016 é reservada para o Bloco 1 — Agenda de Publicações)

grant usage on schema public to anon, authenticated;

-- ── Função: registrar envio ───────────────────────────────────────────────────
-- Grava um envio na coleção com_envios.
-- Parâmetros:
--   p_envio jsonb — objeto completo do envio (ver estrutura abaixo)
-- Estrutura esperada:
--   { id, titulo, assunto, corpo_html, destinatario_tipo,
--     total, enviados, erros, status, criadoEm, enviadoEm }
create or replace function pr_registrar_envio(p_envio jsonb)
returns jsonb
language plpgsql security definer
as $$
declare
  v_lista jsonb;
begin
  select dados into v_lista from registros where colecao = 'com_envios' limit 1;
  if v_lista is null then v_lista := '[]'::jsonb; end if;

  -- Atualiza se já existe, senão adiciona
  declare v_novo jsonb := '[]'::jsonb; v_encontrado boolean := false;
  begin
    for v_item in select * from jsonb_array_elements(v_lista)
    loop
      if (v_item->>'id') = (p_envio->>'id') then
        v_novo := v_novo || jsonb_build_array(p_envio);
        v_encontrado := true;
      else
        v_novo := v_novo || jsonb_build_array(v_item);
      end if;
    end loop;
    if not v_encontrado then
      v_novo := v_novo || jsonb_build_array(p_envio);
    end if;
  end;

  insert into registros (colecao, id, dados)
    values ('com_envios', 'lista', v_novo)
    on conflict (colecao, id) do update set dados = excluded.dados, atualizado_em = now();

  return jsonb_build_object('ok', true, 'id', p_envio->>'id');
end;
$$;

revoke all on function pr_registrar_envio(jsonb) from public;
grant execute on function pr_registrar_envio(jsonb) to authenticated;

-- ── Confirmação ──────────────────────────────────────────────────────────────
select 'ok - migração 0017 (envios) aplicada' as resultado;
