-- 0022 — Cliques para as redes do Parque, passando pelo site (25/11/2026)
--
-- Precisa da 0021 já aplicada? NÃO: esta é independente. Pode rodar antes ou depois.
-- O que faz:
--   1) cria a tabela cliques_saida_dia: UMA linha por dia, origem (de onde a pessoa veio) e destino (para onde foi:
--      canal, comunidade, youtube...), só com o número de cliques. Não guarda IP, nome, e-mail nem cookie.
--   2) cria pr_registrar_clique(destino, origem): chamada pela página ir.html do site (sem login). Nunca dá erro por
--      entrada estranha: destino ou origem fora do padrão contam como 'outros'.
--   3) cria pr_resumo_cliques(dias): usada só pela área restrita (exige login) para montar o painel.
-- Não mexe em pr_enviar_publico nem em nenhuma função ou tabela existente (lição da 0018).
-- Seguro para rodar mais de uma vez. Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run.

create table if not exists public.cliques_saida_dia (
  dia      date    not null,
  origem   text    not null,
  destino  text    not null,
  cliques  integer not null default 0,
  primary key (dia, origem, destino)
);
alter table public.cliques_saida_dia enable row level security;
-- Sem políticas de propósito: ninguém lê nem grava direto na tabela; só pelas funções abaixo.
revoke all on public.cliques_saida_dia from anon, authenticated;

create or replace function public.pr_registrar_clique(p_destino text, p_origem text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
  v_des text := lower(coalesce(p_destino, ''));
  v_ori text := lower(coalesce(p_origem, ''));
  n integer;
begin
  if v_des !~ '^[a-z0-9-]{1,40}$' then v_des := 'outros'; end if;
  if v_ori !~ '^[a-z0-9-]{1,40}$' then v_ori := 'outros'; end if;
  -- freio: no máximo 500 combinações (origem + destino) por dia; passando disso, tudo novo cai em 'outros'
  select count(*) into n from public.cliques_saida_dia where dia = v_dia;
  if n >= 500 and not exists (select 1 from public.cliques_saida_dia where dia = v_dia and origem = v_ori and destino = v_des) then
    v_ori := 'outros'; v_des := 'outros';
  end if;
  insert into public.cliques_saida_dia(dia, origem, destino, cliques) values (v_dia, v_ori, v_des, 1)
  on conflict (dia, origem, destino) do update set cliques = public.cliques_saida_dia.cliques + 1;
  return jsonb_build_object('ok', true);
exception when others then
  return jsonb_build_object('ok', false); -- contar clique nunca pode atrapalhar quem clica
end $$;
revoke all on function public.pr_registrar_clique(text, text) from public;
grant execute on function public.pr_registrar_clique(text, text) to anon, authenticated;

create or replace function public.pr_resumo_cliques(p_dias integer default 30)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  d integer := least(greatest(coalesce(p_dias, 30), 1), 365);
  v_totais jsonb; v_destinos jsonb; v_pares jsonb;
begin
  if auth.uid() is null then
    raise exception 'Entre na área restrita para ver os cliques.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'hoje',       coalesce(sum(cliques) filter (where dia = v_hoje), 0),
    'ultimos_7',  coalesce(sum(cliques) filter (where dia > v_hoje - 7), 0),
    'ultimos_30', coalesce(sum(cliques) filter (where dia > v_hoje - 30), 0),
    'desde', min(dia)
  ) into v_totais from public.cliques_saida_dia;

  select coalesce(jsonb_agg(x order by (x->>'cliques')::int desc), '[]'::jsonb) into v_destinos from (
    select jsonb_build_object('destino', destino, 'cliques', sum(cliques)) as x
    from public.cliques_saida_dia where dia > v_hoje - d group by destino
  ) t;

  select coalesce(jsonb_agg(x order by (x->>'cliques')::int desc), '[]'::jsonb) into v_pares from (
    select jsonb_build_object('origem', origem, 'destino', destino, 'cliques', sum(cliques)) as x
    from public.cliques_saida_dia where dia > v_hoje - d group by origem, destino order by sum(cliques) desc limit 30
  ) t;

  return jsonb_build_object('gerado_em', now(), 'dias', d, 'totais', v_totais, 'por_destino', v_destinos, 'por_origem_destino', v_pares);
end $$;
revoke all on function public.pr_resumo_cliques(integer) from public;
grant execute on function public.pr_resumo_cliques(integer) to authenticated;

select 'ok - migração 0022 (cliques para as redes do Parque) aplicada' as resultado;
