-- ===== 0010_login_e_colecoes.sql =====
-- Fase 1 do CONecta Retiro: login real (Supabase Auth) e dados da área restrita no servidor.
--
-- O site guarda cada "coleção" (pr_livros, pr_ativ, pr_com_posts...) como uma lista inteira. Nesta fase cada coleção vira
-- UMA linha em `registros` (id = '_'), com versão para nunca sobrescrever a edição de outra pessoa (conflito = 409).
-- As telas não mudam: o adaptador do site (adaptador-supabase.js) fala com as funções abaixo.
--
-- Regras desta fase (as mesmas que o site já aplica nas telas):
--   * só quem está logado E aprovado lê e grava;
--   * 'mapa' (Mapa de Contas) só o administrador;
--   * nível, status e funções de uma pessoa só o administrador muda (gatilho perfis_protege, já existente);
--   * nada é apagado de verdade: remover = exclusão lógica (excluido_em).
-- As regras finas por coleção (tabela `colecoes`) continuam valendo para o acesso direto à tabela `registros`
-- e serão aplicadas também por estas funções numa fase seguinte, coleção por coleção, depois dos testes.
--
-- Pode rodar mais de uma vez (idempotente). Não apaga nada.

-- 1) Perfis: WhatsApp e autorização LGPD (o cadastro do site já pede os dois)
alter table public.perfis add column if not exists whatsapp text;
alter table public.perfis add column if not exists lgpd jsonb;
-- A lista de funções agora é controlada pela área restrita (area.js); a restrição fixa impedia funções novas.
alter table public.perfis drop constraint if exists perfis_funcoes_check;

-- 2) Cadastro pelo site: quando alguém cria conta (Supabase Auth), o perfil nasce sozinho como leitor/pendente.
create or replace function public.pr_novo_usuario() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome, email, whatsapp, lgpd)
  values (new.id,
          coalesce(nullif(trim(new.raw_user_meta_data->>'nome'), ''), split_part(new.email, '@', 1)),
          lower(new.email),
          nullif(new.raw_user_meta_data->>'whatsapp', ''),
          case when new.raw_user_meta_data ? 'lgpd' then new.raw_user_meta_data->'lgpd' else null end)
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists pr_novo_usuario on auth.users;
create trigger pr_novo_usuario after insert on auth.users for each row execute function public.pr_novo_usuario();

-- 3) Auditoria mais leve para as coleções inteiras (id = '_'): guarda quem, quando, qual coleção e a versão,
--    sem copiar a lista toda (fotos em base64 lotariam o banco grátis).
create or replace function public.trg_registros() returns trigger language plpgsql security definer set search_path = public as $$
declare leve boolean := (coalesce(new.id, old.id) = '_');
begin
  if tg_op = 'INSERT' then
    new.criado_por := auth.uid(); new.atualizado_por := auth.uid(); new.versao := 1;
    insert into auditoria(quem,tabela,colecao,registro_id,operacao,depois)
      values (auth.uid(),'registros',new.colecao,new.id,'INSERT', case when leve then jsonb_build_object('versao',1) else new.dados end);
    return new;
  elsif tg_op = 'UPDATE' then
    if new.versao <> old.versao then
      raise exception 'Conflito de edição: o registro foi alterado por outra pessoa (versão % ≠ %).', new.versao, old.versao using errcode = '40001';
    end if;
    new.colecao := old.colecao; new.id := old.id; new.criado_em := old.criado_em; new.criado_por := old.criado_por;
    new.versao := old.versao + 1; new.atualizado_em := now(); new.atualizado_por := auth.uid();
    insert into auditoria(quem,tabela,colecao,registro_id,operacao,antes,depois)
      values (auth.uid(),'registros',new.colecao,new.id,
              case when old.excluido_em is null and new.excluido_em is not null then 'EXCLUSAO_LOGICA' else 'UPDATE' end,
              case when leve then jsonb_build_object('versao',old.versao) else old.dados end,
              case when leve then jsonb_build_object('versao',new.versao) else new.dados end);
    return new;
  end if;
  return null;
end $$;

-- 4) Quem sou eu
create or replace function public.pr_aprovado() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.perfis where id = auth.uid() and status = 'aprovado') $$;
create or replace function public.pr_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.perfis where id = auth.uid() and status = 'aprovado' and nivel = 'administrador') $$;

-- 5) Ler tudo o que a pessoa pode ver: { "nome": { "versao": n, "dados": ... }, ... }
create or replace function public.pr_ler_colecoes() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare adm boolean := public.pr_admin();
begin
  if not public.pr_aprovado() then raise exception 'Acesso só para cadastros aprovados.' using errcode = '42501'; end if;
  return coalesce((select jsonb_object_agg(r.colecao, jsonb_build_object('versao', r.versao, 'dados', r.dados))
                   from public.registros r
                   where r.id = '_' and r.excluido_em is null and (r.colecao <> 'mapa' or adm)), '{}'::jsonb);
end $$;

-- 6) Gravar uma coleção inteira, só se ninguém gravou antes (versao_base = versão atual).
--    Resposta: { "status": 200, "versao": n }  ou  { "status": 409, "versao_atual": n, "dados": ... }
create or replace function public.pr_gravar_colecao(p_nome text, p_versao_base integer, p_dados jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v integer; apagada timestamptz; atual jsonb;
begin
  if not public.pr_aprovado() then raise exception 'Acesso só para cadastros aprovados.' using errcode = '42501'; end if;
  if p_nome is null or p_nome !~ '^[a-z0-9_]{1,60}$' or p_nome in ('users', 'meta') then
    raise exception 'Coleção inválida: %', p_nome using errcode = '22023';
  end if;
  if p_nome = 'mapa' and not public.pr_admin() then raise exception 'Só o administrador grava o Mapa de Contas.' using errcode = '42501'; end if;
  insert into public.colecoes(nome, nivel_leitura, nivel_escrita) values (p_nome, 'leitor', 'leitor') on conflict (nome) do nothing;
  select versao, excluido_em, dados into v, apagada, atual from public.registros where colecao = p_nome and id = '_' for update;
  if not found then
    if coalesce(p_versao_base, 0) <> 0 then return jsonb_build_object('status', 409, 'versao_atual', 0, 'dados', null); end if;
    insert into public.registros(colecao, id, dados) values (p_nome, '_', p_dados);
    return jsonb_build_object('status', 200, 'versao', 1);
  end if;
  if v <> coalesce(p_versao_base, 0) then
    return jsonb_build_object('status', 409, 'versao_atual', v, 'dados', case when apagada is null then atual else null end);
  end if;
  update public.registros set dados = p_dados, excluido_em = null where colecao = p_nome and id = '_';
  return jsonb_build_object('status', 200, 'versao', v + 1);
end $$;

-- 7) "Apagar" uma coleção = exclusão lógica (recuperável).
create or replace function public.pr_excluir_colecao(p_nome text, p_versao_base integer) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v integer; atual jsonb;
begin
  if not public.pr_aprovado() then raise exception 'Acesso só para cadastros aprovados.' using errcode = '42501'; end if;
  if p_nome = 'mapa' and not public.pr_admin() then raise exception 'Só o administrador altera o Mapa de Contas.' using errcode = '42501'; end if;
  select versao, dados into v, atual from public.registros where colecao = p_nome and id = '_' and excluido_em is null for update;
  if not found then return jsonb_build_object('status', 404); end if;
  if v <> coalesce(p_versao_base, 0) then return jsonb_build_object('status', 409, 'versao_atual', v, 'dados', atual); end if;
  update public.registros set excluido_em = now() where colecao = p_nome and id = '_';
  return jsonb_build_object('status', 200, 'versao', v + 1);
end $$;

-- 8) Permissões de execução: só quem está logado chama as funções (o visitante anônimo, não).
revoke all on function public.pr_ler_colecoes() from public, anon;
revoke all on function public.pr_gravar_colecao(text, integer, jsonb) from public, anon;
revoke all on function public.pr_excluir_colecao(text, integer) from public, anon;
grant execute on function public.pr_ler_colecoes() to authenticated;
grant execute on function public.pr_gravar_colecao(text, integer, jsonb) to authenticated;
grant execute on function public.pr_excluir_colecao(text, integer) to authenticated;
grant execute on function public.pr_aprovado() to authenticated;
grant execute on function public.pr_admin() to authenticated;

-- Conferência (deve aparecer "ok"):
select 'ok' as fase1_instalada;
