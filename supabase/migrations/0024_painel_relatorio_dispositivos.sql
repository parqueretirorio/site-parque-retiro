-- 0024 — Painel de visitantes: relatório por período, comparação e dispositivos (25/11/2026)
--
-- Precisa da 0021 já aplicada (usa visitas_site_dia). Usa também, SE existirem, as tabelas da 0022 (cliques) — sem elas o relatório
-- simplesmente vem sem a parte de cliques.
-- O que faz:
--   1) visitas_dispositivo_dia: UMA linha por dia, tipo de aparelho (celular, computador, tablet), sistema e navegador, só com a
--      quantidade de visitas. Não guarda IP, modelo, resolução nem nada que identifique alguém. Valores fora da lista viram 'outro'.
--   2) pr_registrar_dispositivo(...): chamada pelo site aberto (sem login), uma vez por visita. Nunca dá erro por entrada estranha.
--   3) pr_relatorio_visitas(ini, fim): usada só pela área restrita (exige login). Devolve, para QUALQUER período (até 400 dias),
--      os totais, origens, páginas, dias, cliques para as redes e dispositivos. A tela chama duas vezes para comparar dois períodos.
-- Não mexe em pr_enviar_publico nem em nada existente (lição da 0018). Seguro para rodar mais de uma vez.
-- Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run.

do $$ begin
  if to_regclass('public.visitas_site_dia') is null then
    raise exception 'Aplique a migração 0021 antes da 0024.';
  end if;
end $$;

create table if not exists public.visitas_dispositivo_dia (
  dia        date    not null,
  tipo       text    not null,
  so         text    not null,
  navegador  text    not null,
  visitas    integer not null default 0,
  primary key (dia, tipo, so, navegador)
);
alter table public.visitas_dispositivo_dia enable row level security;
revoke all on public.visitas_dispositivo_dia from anon, authenticated;

create or replace function public.pr_registrar_dispositivo(p_tipo text, p_so text, p_navegador text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
  v_t text := lower(coalesce(p_tipo, ''));
  v_s text := lower(coalesce(p_so, ''));
  v_n text := lower(coalesce(p_navegador, ''));
begin
  if v_t not in ('mobile', 'desktop', 'tablet') then v_t := 'outro'; end if;
  if v_s not in ('android', 'ios', 'windows', 'macos', 'linux') then v_s := 'outro'; end if;
  if v_n not in ('chrome', 'safari', 'firefox', 'edge', 'opera', 'samsung') then v_n := 'outro'; end if;
  insert into public.visitas_dispositivo_dia(dia, tipo, so, navegador, visitas) values (v_dia, v_t, v_s, v_n, 1)
  on conflict (dia, tipo, so, navegador) do update set visitas = public.visitas_dispositivo_dia.visitas + 1;
  return jsonb_build_object('ok', true);
exception when others then
  return jsonb_build_object('ok', false);
end $$;
revoke all on function public.pr_registrar_dispositivo(text, text, text) from public;
grant execute on function public.pr_registrar_dispositivo(text, text, text) to anon, authenticated;

create or replace function public.pr_relatorio_visitas(p_ini date, p_fim date)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_fim date := least(coalesce(p_fim, v_hoje), v_hoje);
  v_ini date := coalesce(p_ini, v_fim - 29);
  v_tot jsonb; v_ori jsonb; v_pag jsonb; v_dia jsonb; v_sai jsonb := '[]'::jsonb; v_dis jsonb;
begin
  if auth.uid() is null then
    raise exception 'Entre na área restrita para ver o relatório.' using errcode = '42501';
  end if;
  if v_ini > v_fim then raise exception 'A data inicial é depois da final.' using errcode = '22023'; end if;
  if v_fim - v_ini > 399 then raise exception 'Escolha um período de no máximo 400 dias.' using errcode = '22023'; end if;

  select jsonb_build_object('visitas', coalesce(sum(visitas), 0), 'paginas_vistas', coalesce(sum(paginas_vistas), 0), 'desde', min(dia))
    into v_tot from public.visitas_site_dia where dia between v_ini and v_fim;

  select coalesce(jsonb_agg(x order by (x->>'visitas')::int desc, x->>'origem'), '[]'::jsonb) into v_ori from (
    select jsonb_build_object('origem', origem, 'visitas', sum(visitas), 'paginas_vistas', sum(paginas_vistas)) as x
    from public.visitas_site_dia where dia between v_ini and v_fim group by origem having sum(visitas) > 0 or sum(paginas_vistas) > 0) t;

  select coalesce(jsonb_agg(x order by (x->>'paginas_vistas')::int desc, x->>'pagina'), '[]'::jsonb) into v_pag from (
    select jsonb_build_object('pagina', pagina, 'visitas', sum(visitas), 'paginas_vistas', sum(paginas_vistas)) as x
    from public.visitas_site_dia where dia between v_ini and v_fim group by pagina order by sum(paginas_vistas) desc limit 25) t;

  select coalesce(jsonb_agg(jsonb_build_object('dia', g.dia::date, 'visitas', coalesce(s.v, 0), 'paginas_vistas', coalesce(s.p, 0)) order by g.dia), '[]'::jsonb) into v_dia
  from generate_series(v_ini::timestamp, v_fim::timestamp, interval '1 day') as g(dia)
  left join (select dia, sum(visitas) v, sum(paginas_vistas) p from public.visitas_site_dia where dia between v_ini and v_fim group by dia) s on s.dia = g.dia::date;

  if to_regclass('public.cliques_saida_dia') is not null then
    execute 'select coalesce(jsonb_agg(x order by (x->>''cliques'')::int desc), ''[]''::jsonb) from (
      select jsonb_build_object(''origem'', origem, ''destino'', destino, ''cliques'', sum(cliques)) as x
      from public.cliques_saida_dia where dia between $1 and $2 group by origem, destino order by sum(cliques) desc limit 80) t'
    into v_sai using v_ini, v_fim;
  end if;

  select jsonb_build_object(
    'tipo', coalesce((select jsonb_agg(jsonb_build_object('nome', k, 'visitas', n) order by n desc) from (select tipo k, sum(visitas) n from public.visitas_dispositivo_dia where dia between v_ini and v_fim group by tipo) a), '[]'::jsonb),
    'so', coalesce((select jsonb_agg(jsonb_build_object('nome', k, 'visitas', n) order by n desc) from (select so k, sum(visitas) n from public.visitas_dispositivo_dia where dia between v_ini and v_fim group by so) a), '[]'::jsonb),
    'navegador', coalesce((select jsonb_agg(jsonb_build_object('nome', k, 'visitas', n) order by n desc) from (select navegador k, sum(visitas) n from public.visitas_dispositivo_dia where dia between v_ini and v_fim group by navegador) a), '[]'::jsonb)
  ) into v_dis;

  return jsonb_build_object('gerado_em', now(), 'ini', v_ini, 'fim', v_fim, 'totais', v_tot, 'por_origem', v_ori, 'paginas', v_pag,
                            'por_dia', v_dia, 'saidas', v_sai, 'dispositivos', v_dis);
end $$;
revoke all on function public.pr_relatorio_visitas(date, date) from public;
grant execute on function public.pr_relatorio_visitas(date, date) to authenticated;

select 'ok - migração 0024 (painel de visitantes) aplicada' as resultado;
