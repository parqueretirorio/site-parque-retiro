-- 0025 — Exportar os números do contador de visitas e dos links rastreáveis (26/11/2026)
--
-- Por quê: o backup da área restrita NÃO cobre as tabelas de contagem das migrações 0021–0024. Esta função entrega tudo
-- (todas as linhas, por dia) para a tela Backup e Segurança baixar em CSV, na rotina da sexta.
-- O que faz: cria pr_exportar_numeros_visitas() — só para quem está logado na área restrita. Só LÊ; não cria tabela nem
-- altera nada existente. Tabelas que ainda não existem (migração não aplicada) vêm como lista vazia.
-- Seguro para rodar mais de uma vez. Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run.

create or replace function public.pr_exportar_numeros_visitas()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_vis jsonb := '[]'::jsonb; v_dis jsonb := '[]'::jsonb; v_cli jsonb := '[]'::jsonb; v_lin jsonb := '[]'::jsonb; v_ace jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'Entre na área restrita para exportar os números.' using errcode = '42501';
  end if;
  if to_regclass('public.visitas_site_dia') is not null then
    execute 'select coalesce(jsonb_agg(to_jsonb(t) order by t.dia, t.origem, t.pagina), ''[]''::jsonb) from public.visitas_site_dia t' into v_vis;
  end if;
  if to_regclass('public.visitas_dispositivo_dia') is not null then
    execute 'select coalesce(jsonb_agg(to_jsonb(t) order by t.dia, t.tipo, t.so, t.navegador), ''[]''::jsonb) from public.visitas_dispositivo_dia t' into v_dis;
  end if;
  if to_regclass('public.cliques_saida_dia') is not null then
    execute 'select coalesce(jsonb_agg(to_jsonb(t) order by t.dia, t.origem, t.destino), ''[]''::jsonb) from public.cliques_saida_dia t' into v_cli;
  end if;
  if to_regclass('public.links_rastreaveis') is not null then
    execute 'select coalesce(jsonb_agg(to_jsonb(t) - ''criado_por'' order by t.criado_em), ''[]''::jsonb) from public.links_rastreaveis t' into v_lin;
  end if;
  if to_regclass('public.links_acessos_dia') is not null then
    execute 'select coalesce(jsonb_agg(to_jsonb(t) order by t.dia, t.codigo), ''[]''::jsonb) from public.links_acessos_dia t' into v_ace;
  end if;
  return jsonb_build_object('gerado_em', now(), 'visitas', v_vis, 'dispositivos', v_dis, 'cliques', v_cli, 'links', v_lin, 'acessos_links', v_ace);
end $$;
revoke all on function public.pr_exportar_numeros_visitas() from public;
grant execute on function public.pr_exportar_numeros_visitas() to authenticated;

select 'ok - migração 0025 (exportar números de visitas) aplicada' as resultado;
