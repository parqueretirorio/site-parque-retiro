-- CONecta Retiro — Fase 2: páginas ABERTAS do site ligadas ao servidor do Parque (13/11/2026).
-- Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run. Pode rodar de novo sem estragar nada.
--
-- 1) VITRINES (leitura pública): a equipe, ao usar a área restrita, gera cópias "pub_<coleção>" só com o que pode
--    aparecer no site (atividades publicadas, fotos selecionadas, nomes da Estela, produtos da Lojinha, acervo...),
--    SEM e-mails nem dados pessoais. Quem visita o site (sem login) só consegue ler essas vitrines.
-- 2) ENVIOS (gravação pública): cadastro no Comunicado/Wi-Fi, descadastro, inscrição de voluntário e envio de fotos
--    entram numa CAIXA DE ENTRADA (envios_publicos). Visitante só consegue acrescentar, nunca ler, mudar ou apagar.
--    A equipe, ao abrir a área restrita, recolhe a caixa e leva cada envio para a coleção certa.

-- ---------- 1) Vitrines ----------
create or replace function public.pr_ler_publico(p_nomes text[]) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(r.colecao, r.dados), '{}'::jsonb)
  from public.registros r
  where r.id = '_' and r.excluido_em is null
    and r.colecao like 'pub\_%'                       -- só vitrines; nunca a coleção original
    and r.colecao = any (coalesce(p_nomes, '{}'::text[]));
$$;
revoke all on function public.pr_ler_publico(text[]) from public;
grant execute on function public.pr_ler_publico(text[]) to anon, authenticated;

-- ---------- 2) Caixa de entrada dos envios públicos ----------
create table if not exists public.envios_publicos (
  id        bigserial primary key,
  caixa     text not null,
  dados     jsonb not null,
  criado_em timestamptz not null default now()
);
alter table public.envios_publicos enable row level security;   -- sem políticas: ninguém acessa a tabela direto
revoke all on table public.envios_publicos from public, anon, authenticated;

create or replace function public.pr_enviar_publico(p_caixa text, p_dados jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n integer; t integer;
begin
  if p_caixa is null or p_caixa not in ('contatos', 'voluntarios', 'album') then
    raise exception 'Envio não aceito: %', p_caixa using errcode = '22023';
  end if;
  if p_dados is null or jsonb_typeof(p_dados) <> 'object' then
    raise exception 'Envio inválido.' using errcode = '22023';
  end if;
  t := octet_length(p_dados::text);
  if t > (case when p_caixa = 'album' then 600000 else 20000 end) then
    raise exception 'Envio grande demais.' using errcode = '22023';
  end if;
  -- freio contra robôs: no máximo 300 envios por hora no total e 1.500 por dia
  select count(*) into n from public.envios_publicos where criado_em > now() - interval '1 hour';
  if n >= 300 then raise exception 'Muitos envios agora. Tente de novo mais tarde.' using errcode = '54000'; end if;
  select count(*) into n from public.envios_publicos where criado_em > now() - interval '1 day';
  if n >= 1500 then raise exception 'Muitos envios hoje. Tente de novo amanhã.' using errcode = '54000'; end if;
  insert into public.envios_publicos(caixa, dados) values (p_caixa, p_dados) returning id into n;
  return jsonb_build_object('ok', true, 'id', n);
end $$;
revoke all on function public.pr_enviar_publico(text, jsonb) from public;
grant execute on function public.pr_enviar_publico(text, jsonb) to anon, authenticated;

-- A equipe (cadastro aprovado) recolhe os envios e, depois de guardá-los nas coleções, apaga da caixa.
create or replace function public.pr_pegar_envios() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.pr_aprovado() then raise exception 'Acesso só para cadastros aprovados.' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'caixa', e.caixa, 'dados', e.dados, 'criado_em', e.criado_em) order by e.id)
                   from (select * from public.envios_publicos order by id limit 200) e), '[]'::jsonb);
end $$;
create or replace function public.pr_apagar_envios(p_ids bigint[]) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not public.pr_aprovado() then raise exception 'Acesso só para cadastros aprovados.' using errcode = '42501'; end if;
  delete from public.envios_publicos where id = any (coalesce(p_ids, '{}'::bigint[]));
  get diagnostics n = row_count;
  return jsonb_build_object('apagados', n);
end $$;
revoke all on function public.pr_pegar_envios() from public, anon;
revoke all on function public.pr_apagar_envios(bigint[]) from public, anon;
grant execute on function public.pr_pegar_envios() to authenticated;
grant execute on function public.pr_apagar_envios(bigint[]) to authenticated;

-- Conferência (deve aparecer "ok"):
select 'ok' as paginas_publicas_instaladas;
