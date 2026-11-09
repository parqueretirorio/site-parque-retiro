-- Parque Retiro / Conecta Retiro — esquema base (Supabase = PostgreSQL + Auth + Storage)
-- Princípios: migrações só ADICIONAM (nunca DROP/TRUNCATE); exclusão lógica; auditoria por gatilho; RLS em tudo.
-- Estrutura "híbrida": tabelas próprias para o que exige integridade forte (perfis, códigos de inventário,
-- anexos, auditoria) e uma tabela de registros por coleção (jsonb) que espelha 1:1 os dados atuais do site,
-- permitindo migrar sem perda e normalizar módulo a módulo depois.

create extension if not exists pgcrypto;

-- ---------- Perfis e permissões ----------
create table if not exists public.perfis (
  id          uuid primary key,                       -- = auth.users.id
  nome        text not null check (length(trim(nome)) > 0),
  email       text not null unique,
  nivel       text not null default 'leitor' check (nivel in ('leitor','comentador','editor','administrador')),
  status      text not null default 'pendente' check (status in ('pendente','aprovado','recusado','bloqueado')),
  funcoes     text[] not null default '{}'
              check (funcoes <@ array['reservas','estela','album','inventario','documentos','comunicacao']),
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Quais coleções existem e quem pode ler/escrever (substitui as regras espalhadas pelo JS)
create table if not exists public.colecoes (
  nome            text primary key,
  funcao_escrita  text,                               -- função exigida (null = só administrador)
  nivel_leitura   text not null default 'leitor' check (nivel_leitura in ('leitor','comentador','editor','administrador')),
  nivel_escrita   text not null default 'administrador' check (nivel_escrita in ('leitor','comentador','editor','administrador')),
  sensivel        boolean not null default false      -- dado pessoal (LGPD): leitura restrita
);

create table if not exists public.registros (
  colecao     text not null references public.colecoes(nome),
  id          text not null,
  dados       jsonb not null,
  versao      integer not null default 1,             -- controle otimista de concorrência
  criado_por  uuid,
  criado_em   timestamptz not null default now(),
  atualizado_por uuid,
  atualizado_em timestamptz not null default now(),
  excluido_em timestamptz,                            -- exclusão lógica (recuperável)
  primary key (colecao, id)
);
create index if not exists registros_colecao_ativos on public.registros (colecao) where excluido_em is null;

-- Códigos de inventário: permanentes, únicos, nunca reutilizados (a restrição está no banco, não só no JS)
create table if not exists public.inv_codigos (
  codigo      text primary key check (codigo ~ '^[A-Z]{3}-[0-9]{4,}$'),
  item_id     text,
  nome        text,
  emitido_em  timestamptz not null default now(),
  emitido_por uuid,
  baixado_em  timestamptz
);

-- Metadados de arquivos (o arquivo em si fica no Storage; aqui só a referência — nada de base64 no banco)
create table if not exists public.anexos (
  id          uuid primary key default gen_random_uuid(),
  colecao     text not null,
  registro_id text not null,
  caminho     text not null unique,                   -- caminho no bucket
  nome_original text,
  mime        text not null,
  bytes       bigint not null check (bytes >= 0 and bytes <= 10485760),
  sha256      text,
  criado_por  uuid,
  criado_em   timestamptz not null default now(),
  excluido_em timestamptz
);

-- Auditoria: append-only
create table if not exists public.auditoria (
  id        bigserial primary key,
  quando    timestamptz not null default now(),
  quem      uuid,
  tabela    text not null,
  colecao   text,
  registro_id text,
  operacao  text not null,
  antes     jsonb,
  depois    jsonb
);

-- ---------- Funções de permissão ----------
create or replace function public.nivel_num(n text) returns int language sql immutable as
$$ select case n when 'leitor' then 1 when 'comentador' then 2 when 'editor' then 3 when 'administrador' then 4 else 0 end $$;

create or replace function public.meu_perfil() returns public.perfis language sql stable security definer set search_path = public as
$$ select p from public.perfis p where p.id = auth.uid() and p.status = 'aprovado' $$;

create or replace function public.pode_ler(col text) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.perfis p join public.colecoes c on c.nome = col
                  where p.id = auth.uid() and p.status = 'aprovado'
                    and (p.nivel = 'administrador' or nivel_num(p.nivel) >= nivel_num(c.nivel_leitura))
                    and (not c.sensivel or p.nivel = 'administrador' or c.funcao_escrita = any(p.funcoes))) $$;

create or replace function public.pode_escrever(col text) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.perfis p join public.colecoes c on c.nome = col
                  where p.id = auth.uid() and p.status = 'aprovado'
                    and (p.nivel = 'administrador'
                         or (c.funcao_escrita is not null and c.funcao_escrita = any(p.funcoes))
                         or (c.funcao_escrita is null and nivel_num(p.nivel) >= nivel_num(c.nivel_escrita)))) $$;

-- ---------- Auditoria e versão por gatilho ----------
create or replace function public.trg_registros() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.criado_por := auth.uid(); new.atualizado_por := auth.uid(); new.versao := 1;
    insert into auditoria(quem,tabela,colecao,registro_id,operacao,depois) values (auth.uid(),'registros',new.colecao,new.id,'INSERT',new.dados);
    return new;
  elsif tg_op = 'UPDATE' then
    if new.versao <> old.versao then
      raise exception 'Conflito de edição: o registro foi alterado por outra pessoa (versão % ≠ %).', new.versao, old.versao using errcode = '40001';
    end if;
    new.colecao := old.colecao; new.id := old.id; new.criado_em := old.criado_em; new.criado_por := old.criado_por;
    new.versao := old.versao + 1; new.atualizado_em := now(); new.atualizado_por := auth.uid();
    insert into auditoria(quem,tabela,colecao,registro_id,operacao,antes,depois)
      values (auth.uid(),'registros',new.colecao,new.id, case when old.excluido_em is null and new.excluido_em is not null then 'EXCLUSAO_LOGICA' else 'UPDATE' end, old.dados, new.dados);
    return new;
  end if;
  return null;
end $$;
drop trigger if exists registros_biu on public.registros;
create trigger registros_biu before insert or update on public.registros for each row execute function public.trg_registros();

create or replace function public.trg_perfis() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into auditoria(quem,tabela,registro_id,operacao,antes,depois)
    values (auth.uid(),'perfis',coalesce(new.id,old.id)::text,tg_op,to_jsonb(old),to_jsonb(new));
  if tg_op = 'UPDATE' then new.atualizado_em := now(); end if;
  return coalesce(new, old);
end $$;
drop trigger if exists perfis_biud on public.perfis;
create trigger perfis_biud before insert or update or delete on public.perfis for each row execute function public.trg_perfis();

-- Auditoria e registros não podem ser apagados/alterados por ninguém via API
create or replace function public.trg_somente_insercao() returns trigger language plpgsql as $$
begin raise exception 'Tabela somente de inserção.'; end $$;
drop trigger if exists auditoria_imutavel on public.auditoria;
create trigger auditoria_imutavel before update or delete on public.auditoria for each row execute function public.trg_somente_insercao();

create or replace function public.trg_sem_delete_fisico() returns trigger language plpgsql as $$
begin raise exception 'Exclusão física não permitida: use excluido_em (exclusão lógica).'; end $$;
drop trigger if exists registros_sem_delete on public.registros;
create trigger registros_sem_delete before delete on public.registros for each row execute function public.trg_sem_delete_fisico();
drop trigger if exists codigos_sem_delete on public.inv_codigos;
create trigger codigos_sem_delete before delete on public.inv_codigos for each row execute function public.trg_sem_delete_fisico();

-- Impede que um usuário comum se promova: só administrador altera nivel/status/funcoes
create or replace function public.trg_perfis_protege() returns trigger language plpgsql security definer set search_path = public as $$
declare adm boolean;
begin
  adm := exists (select 1 from perfis where id = auth.uid() and nivel = 'administrador' and status = 'aprovado');
  if tg_op = 'INSERT' then
    -- primeiro cadastro do sistema vira administrador; os demais entram como leitor/pendente
    if not exists (select 1 from perfis where nivel = 'administrador' and status = 'aprovado') and auth.uid() is not null then
      new.nivel := 'administrador'; new.status := 'aprovado';
    elsif not adm then
      new.nivel := 'leitor'; new.status := 'pendente'; new.funcoes := '{}';
    end if;
  elsif not adm and (new.nivel, new.status, new.funcoes) is distinct from (old.nivel, old.status, old.funcoes) then
    raise exception 'Apenas o administrador altera nível, status e funções.';
  end if;
  return new;
end $$;
drop trigger if exists perfis_protege on public.perfis;
create trigger perfis_protege before insert or update on public.perfis for each row execute function public.trg_perfis_protege();

-- ---------- RLS ----------
alter table public.perfis      enable row level security;
alter table public.colecoes    enable row level security;
alter table public.registros   enable row level security;
alter table public.inv_codigos enable row level security;
alter table public.anexos      enable row level security;
alter table public.auditoria   enable row level security;

drop policy if exists perfis_ler on public.perfis;
create policy perfis_ler on public.perfis for select using (id = auth.uid() or (select nivel from public.meu_perfil()) = 'administrador');
drop policy if exists perfis_inserir on public.perfis;
create policy perfis_inserir on public.perfis for insert with check (id = auth.uid());   -- o gatilho força leitor/pendente
drop policy if exists perfis_atualizar on public.perfis;
create policy perfis_atualizar on public.perfis for update using (id = auth.uid() or (select nivel from public.meu_perfil()) = 'administrador');

drop policy if exists colecoes_ler on public.colecoes;
create policy colecoes_ler on public.colecoes for select using (auth.uid() is not null);

drop policy if exists reg_ler on public.registros;
-- Registros com exclusao logica continuam legiveis por quem le a colecao (o app filtra excluido_em is null);
-- o PostgreSQL exige que a linha nova de um UPDATE ainda passe pela politica de leitura.
create policy reg_ler on public.registros for select using (public.pode_ler(colecao));
drop policy if exists reg_inserir on public.registros;
create policy reg_inserir on public.registros for insert with check (public.pode_escrever(colecao));
drop policy if exists reg_atualizar on public.registros;
create policy reg_atualizar on public.registros for update using (public.pode_escrever(colecao)) with check (public.pode_escrever(colecao));

drop policy if exists cod_ler on public.inv_codigos;
create policy cod_ler on public.inv_codigos for select using (public.pode_ler('inv_itens'));
drop policy if exists cod_inserir on public.inv_codigos;
create policy cod_inserir on public.inv_codigos for insert with check (public.pode_escrever('inv_itens'));
drop policy if exists cod_atualizar on public.inv_codigos;
create policy cod_atualizar on public.inv_codigos for update using (public.pode_escrever('inv_itens'));

drop policy if exists anexos_ler on public.anexos;
create policy anexos_ler on public.anexos for select using (excluido_em is null and public.pode_ler(colecao));
drop policy if exists anexos_inserir on public.anexos;
create policy anexos_inserir on public.anexos for insert with check (public.pode_escrever(colecao));
drop policy if exists anexos_atualizar on public.anexos;
create policy anexos_atualizar on public.anexos for update using (public.pode_escrever(colecao));

drop policy if exists aud_ler on public.auditoria;
create policy aud_ler on public.auditoria for select using ((select nivel from public.meu_perfil()) = 'administrador');
-- (sem política de insert: só os gatilhos security definer gravam)

-- ---------- Coleções atuais do site (mapeamento 1:1 das chaves pr_*) ----------
insert into public.colecoes(nome, funcao_escrita, nivel_leitura, nivel_escrita, sensivel) values
  ('livros',        null,           'leitor','editor',        false),
  ('emprest',       null,           'leitor','editor',        true),
  ('livraria_itens',null,           'editor','editor',        false),
  ('livraria_vendas',null,          'editor','editor',        true),
  ('pedidos',       'reservas',     'leitor','administrador', true),
  ('estela',        'estela',       'leitor','administrador', false),
  ('album',         'album',        'leitor','administrador', false),
  ('inv_itens',     'inventario',   'leitor','administrador', false),
  ('inv_mov',       'inventario',   'leitor','administrador', false),
  ('inv_emp',       'inventario',   'leitor','administrador', true),
  ('inv_proj',      'inventario',   'leitor','administrador', false),
  ('inv_seq',       'inventario',   'leitor','administrador', false),
  ('inv_cod',       'inventario',   'leitor','administrador', false),
  ('docs',          'documentos',   'leitor','administrador', false),
  ('doc_cats',      'documentos',   'leitor','administrador', false),
  ('ativ',          'documentos',   'leitor','administrador', false),
  ('ativ_cats',     'documentos',   'leitor','administrador', false),
  ('datas_fixas',   'documentos',   'leitor','administrador', false),
  ('eventos',       'documentos',   'leitor','administrador', false),
  ('com_posts',     'comunicacao',  'leitor','administrador', false),
  ('com_projetos',  'comunicacao',  'leitor','administrador', false),
  ('com_redes',     'comunicacao',  'leitor','administrador', false),
  ('com_tipos',     'comunicacao',  'leitor','administrador', false),
  ('aulas',         null,           'leitor','editor',        false),
  ('contas',        null,           'administrador','administrador', true),
  ('orcamento',     null,           'administrador','administrador', true),
  ('orcamento_com', 'comunicacao',  'administrador','administrador', true),
  ('mapa',          null,           'administrador','administrador', true)
on conflict (nome) do nothing;
