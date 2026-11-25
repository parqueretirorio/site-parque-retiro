-- 0021 — Contador de visitas do site, por origem (25/11/2026)
--
-- O que faz:
--   1) cria a tabela visitas_site_dia: UMA linha por dia, origem e página, só com números (visitas e páginas vistas).
--      Não guarda IP, nome, e-mail, cookie nem nada que identifique alguém.
--   2) cria pr_registrar_visita(...): chamada pelo site aberto (sem login). Nunca dá erro por entrada estranha:
--      se a origem ou a página vierem fora do padrão, contam como 'outros' / 'outras'.
--   3) cria pr_resumo_visitas(...): usada só pela área restrita (exige login) para montar o painel.
-- Não mexe em pr_enviar_publico nem em nenhuma função ou tabela existente (lição da 0018).
-- Seguro para rodar mais de uma vez. Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run.

create table if not exists public.visitas_site_dia (
  dia            date    not null,
  origem         text    not null,
  pagina         text    not null,
  visitas        integer not null default 0,
  paginas_vistas integer not null default 0,
  primary key (dia, origem, pagina)
);
alter table public.visitas_site_dia enable row level security;
-- Sem políticas de propósito: ninguém lê nem grava direto na tabela; só pelas funções abaixo.
revoke all on public.visitas_site_dia from anon, authenticated;

-- ---------- registrar (site aberto, sem login) ----------
create or replace function public.pr_registrar_visita(p_pagina text, p_origem text, p_nova_visita boolean default true)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
  v_pag text := lower(coalesce(p_pagina, ''));
  v_ori text := lower(coalesce(p_origem, ''));
  n integer;
begin
  if v_pag !~ '^[a-z0-9._-]{1,60}$' then v_pag := 'outras'; end if;
  if v_ori !~ '^[a-z0-9-]{1,40}$' then v_ori := 'outros'; end if;
  -- freio: no máximo 1.500 combinações (origem + página) por dia; passando disso, tudo novo cai em 'outros'/'outras'
  select count(*) into n from public.visitas_site_dia where dia = v_dia;
  if n >= 1500 and not exists (select 1 from public.visitas_site_dia where dia = v_dia and origem = v_ori and pagina = v_pag) then
    v_ori := 'outros'; v_pag := 'outras';
  end if;
  insert into public.visitas_site_dia(dia, origem, pagina, visitas, paginas_vistas)
  values (v_dia, v_ori, v_pag, case when coalesce(p_nova_visita, true) then 1 else 0 end, 1)
  on conflict (dia, origem, pagina) do update
    set visitas        = public.visitas_site_dia.visitas + case when coalesce(p_nova_visita, true) then 1 else 0 end,
        paginas_vistas = public.visitas_site_dia.paginas_vistas + 1;
  return jsonb_build_object('ok', true);
exception when others then
  return jsonb_build_object('ok', false); -- contar visita nunca pode atrapalhar quem visita
end $$;
revoke all on function public.pr_registrar_visita(text, text, boolean) from public;
grant execute on function public.pr_registrar_visita(text, text, boolean) to anon, authenticated;

-- ---------- resumo (área restrita, exige login) ----------
create or replace function public.pr_resumo_visitas(p_dias integer default 30)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  d integer := least(greatest(coalesce(p_dias, 30), 1), 365);
  v_totais jsonb; v_origens jsonb; v_paginas jsonb; v_dias jsonb;
begin
  if auth.uid() is null then
    raise exception 'Entre na área restrita para ver as visitas.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'hoje',        coalesce(sum(visitas) filter (where dia = v_hoje), 0),
    'ontem',       coalesce(sum(visitas) filter (where dia = v_hoje - 1), 0),
    'ultimos_7',   coalesce(sum(visitas) filter (where dia > v_hoje - 7), 0),
    'ultimos_30',  coalesce(sum(visitas) filter (where dia > v_hoje - 30), 0),
    'paginas_hoje',      coalesce(sum(paginas_vistas) filter (where dia = v_hoje), 0),
    'paginas_ultimos_7', coalesce(sum(paginas_vistas) filter (where dia > v_hoje - 7), 0),
    'paginas_ultimos_30',coalesce(sum(paginas_vistas) filter (where dia > v_hoje - 30), 0),
    'desde', min(dia)
  ) into v_totais from public.visitas_site_dia;

  select coalesce(jsonb_agg(x order by (x->>'visitas')::int desc), '[]'::jsonb) into v_origens from (
    select jsonb_build_object('origem', origem, 'visitas', sum(visitas), 'paginas_vistas', sum(paginas_vistas)) as x
    from public.visitas_site_dia where dia > v_hoje - d group by origem having sum(visitas) > 0 or sum(paginas_vistas) > 0
  ) t;

  select coalesce(jsonb_agg(x order by (x->>'paginas_vistas')::int desc), '[]'::jsonb) into v_paginas from (
    select jsonb_build_object('pagina', pagina, 'visitas', sum(visitas), 'paginas_vistas', sum(paginas_vistas)) as x
    from public.visitas_site_dia where dia > v_hoje - d group by pagina order by sum(paginas_vistas) desc limit 15
  ) t;

  select coalesce(jsonb_agg(jsonb_build_object('dia', g.dia, 'visitas', coalesce(s.v, 0)) order by g.dia), '[]'::jsonb) into v_dias
  from generate_series(v_hoje - 29, v_hoje, interval '1 day') as g(dia)
  left join (select dia, sum(visitas) v from public.visitas_site_dia group by dia) s on s.dia = g.dia::date;

  return jsonb_build_object('gerado_em', now(), 'dias', d, 'totais', v_totais, 'por_origem', v_origens, 'paginas', v_paginas, 'por_dia', v_dias);
end $$;
revoke all on function public.pr_resumo_visitas(integer) from public;
grant execute on function public.pr_resumo_visitas(integer) to authenticated;

select 'ok - migração 0021 (contador de visitas) aplicada' as resultado;
