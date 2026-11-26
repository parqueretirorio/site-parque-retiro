-- 0023 — Links rastreáveis com código, histórico e contagem por link (25/11/2026)
--
-- O que faz:
--   1) links_rastreaveis: um registro por link criado no "Gerador de links rastreáveis" (nome, categoria, UTMs, destino,
--      observações internas, ativo/inativo). Cada link tem um CÓDIGO curto exclusivo (ex.: a1b2c3) que vai no endereço (?l=a1b2c3).
--   2) links_acessos_dia: números por dia e por código (visitas, páginas vistas, cliques). Sem IP, nome ou cookie.
--   3) pr_criar_link / pr_listar_links / pr_atualizar_link: só para quem está logado na área restrita.
--   4) pr_registrar_acesso_link: chamada pelo site aberto (sem login). Só conta se o código existe e o link está ativo;
--      nunca dá erro por entrada estranha.
-- Independente da 0021 e da 0022. Não mexe em pr_enviar_publico nem em nada existente (lição da 0018).
-- Seguro para rodar mais de uma vez. Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run.

create table if not exists public.links_rastreaveis (
  codigo      text primary key check (codigo ~ '^[a-z0-9]{4,12}$'),
  nome        text not null check (char_length(nome) between 1 and 120),
  categoria   text not null default 'outros' check (categoria ~ '^[a-z0-9-]{1,30}$'),
  utm_source  text not null check (utm_source ~ '^[a-z0-9-]{1,40}$'),
  utm_medium  text not null default '' check (utm_medium ~ '^[a-z0-9-]{0,40}$'),
  utm_campaign text not null default '' check (utm_campaign ~ '^[a-z0-9-]{0,60}$'),
  utm_content text not null default '' check (utm_content ~ '^[a-z0-9-]{0,60}$'),
  utm_term    text not null default '' check (utm_term ~ '^[a-z0-9-]{0,60}$'),
  destino     text not null default '' check (char_length(destino) <= 120),  -- página do site (ex.: atividades.html) ou "ir:canal"
  observacoes text not null default '' check (char_length(observacoes) <= 500),
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now(),
  criado_por  uuid
);
alter table public.links_rastreaveis enable row level security;
revoke all on public.links_rastreaveis from anon, authenticated;

create table if not exists public.links_acessos_dia (
  dia            date    not null,
  codigo         text    not null references public.links_rastreaveis(codigo) on delete cascade,
  visitas        integer not null default 0,
  paginas_vistas integer not null default 0,
  cliques        integer not null default 0,
  primary key (dia, codigo)
);
alter table public.links_acessos_dia enable row level security;
revoke all on public.links_acessos_dia from anon, authenticated;

-- ---------- criar (área restrita) ----------
create or replace function public.pr_criar_link(p jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_cod text; i integer := 0;
  v_nome text := btrim(coalesce(p->>'nome', ''));
  v_src text := lower(btrim(coalesce(p->>'utm_source', '')));
  r public.links_rastreaveis;
begin
  if auth.uid() is null then
    raise exception 'Entre na área restrita para criar links.' using errcode = '42501';
  end if;
  if v_nome = '' then raise exception 'Informe o nome da campanha.' using errcode = '22023'; end if;
  if v_src !~ '^[a-z0-9-]{1,40}$' then raise exception 'Origem (utm_source) inválida: use letras minúsculas, números e hífen.' using errcode = '22023'; end if;
  loop
    v_cod := substr(md5(random()::text || clock_timestamp()::text || i::text), 1, 6);
    exit when not exists (select 1 from public.links_rastreaveis where codigo = v_cod);
    i := i + 1; if i > 20 then raise exception 'Não foi possível gerar o código. Tente de novo.'; end if;
  end loop;
  insert into public.links_rastreaveis(codigo, nome, categoria, utm_source, utm_medium, utm_campaign, utm_content, utm_term, destino, observacoes, criado_por)
  values (v_cod, v_nome, lower(coalesce(nullif(p->>'categoria', ''), 'outros')), v_src,
          lower(coalesce(p->>'utm_medium', '')), lower(coalesce(p->>'utm_campaign', '')), lower(coalesce(p->>'utm_content', '')),
          lower(coalesce(p->>'utm_term', '')), coalesce(p->>'destino', ''), coalesce(p->>'observacoes', ''), auth.uid())
  returning * into r;
  return to_jsonb(r);
end $$;
revoke all on function public.pr_criar_link(jsonb) from public;
grant execute on function public.pr_criar_link(jsonb) to authenticated;

-- ---------- listar com números (área restrita) ----------
create or replace function public.pr_listar_links(p_dias integer default 30)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  d integer := least(greatest(coalesce(p_dias, 30), 1), 3650);
  v jsonb;
begin
  if auth.uid() is null then
    raise exception 'Entre na área restrita para ver os links.' using errcode = '42501';
  end if;
  select coalesce(jsonb_agg(x order by (x->>'criado_em') desc), '[]'::jsonb) into v from (
    select to_jsonb(l) || jsonb_build_object(
      'visitas',        coalesce(sum(a.visitas) filter (where a.dia > v_hoje - d), 0),
      'paginas_vistas', coalesce(sum(a.paginas_vistas) filter (where a.dia > v_hoje - d), 0),
      'cliques',        coalesce(sum(a.cliques) filter (where a.dia > v_hoje - d), 0),
      'visitas_total',  coalesce(sum(a.visitas), 0),
      'cliques_total',  coalesce(sum(a.cliques), 0)
    ) as x
    from public.links_rastreaveis l left join public.links_acessos_dia a on a.codigo = l.codigo
    group by l.codigo
  ) t;
  return jsonb_build_object('gerado_em', now(), 'dias', d, 'links', v);
end $$;
revoke all on function public.pr_listar_links(integer) from public;
grant execute on function public.pr_listar_links(integer) to authenticated;

-- ---------- editar identificação / ativar e desativar (área restrita) ----------
create or replace function public.pr_atualizar_link(p_codigo text, p_nome text, p_observacoes text, p_ativo boolean)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare r public.links_rastreaveis;
begin
  if auth.uid() is null then
    raise exception 'Entre na área restrita para alterar links.' using errcode = '42501';
  end if;
  update public.links_rastreaveis set
    nome = coalesce(nullif(btrim(p_nome), ''), nome),
    observacoes = left(coalesce(p_observacoes, observacoes), 500),
    ativo = coalesce(p_ativo, ativo)
  where codigo = lower(coalesce(p_codigo, '')) returning * into r;
  if not found then raise exception 'Link não encontrado.' using errcode = 'P0002'; end if;
  return to_jsonb(r);
end $$;
revoke all on function public.pr_atualizar_link(text, text, text, boolean) from public;
grant execute on function public.pr_atualizar_link(text, text, text, boolean) to authenticated;

-- ---------- registrar acesso (site aberto, sem login) ----------
-- p_tipo: 'visita' (primeira página da sessão), 'pagina' (outra página da mesma sessão) ou 'clique' (passagem para uma rede).
create or replace function public.pr_registrar_acesso_link(p_codigo text, p_tipo text default 'visita')
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
  v_cod text := lower(coalesce(p_codigo, ''));
  v_tipo text := lower(coalesce(p_tipo, 'visita'));
begin
  if v_cod !~ '^[a-z0-9]{4,12}$' then return jsonb_build_object('ok', false); end if;
  if not exists (select 1 from public.links_rastreaveis where codigo = v_cod and ativo) then
    return jsonb_build_object('ok', false);   -- código desconhecido ou link desativado: não conta
  end if;
  insert into public.links_acessos_dia(dia, codigo, visitas, paginas_vistas, cliques)
  values (v_dia, v_cod,
          case when v_tipo = 'visita' then 1 else 0 end,
          case when v_tipo in ('visita', 'pagina') then 1 else 0 end,
          case when v_tipo = 'clique' then 1 else 0 end)
  on conflict (dia, codigo) do update set
    visitas        = public.links_acessos_dia.visitas + case when v_tipo = 'visita' then 1 else 0 end,
    paginas_vistas = public.links_acessos_dia.paginas_vistas + case when v_tipo in ('visita', 'pagina') then 1 else 0 end,
    cliques        = public.links_acessos_dia.cliques + case when v_tipo = 'clique' then 1 else 0 end;
  return jsonb_build_object('ok', true);
exception when others then
  return jsonb_build_object('ok', false);
end $$;
revoke all on function public.pr_registrar_acesso_link(text, text) from public;
grant execute on function public.pr_registrar_acesso_link(text, text) to anon, authenticated;

select 'ok - migração 0023 (links rastreáveis) aplicada' as resultado;
