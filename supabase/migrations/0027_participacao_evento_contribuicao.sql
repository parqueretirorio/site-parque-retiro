-- 0027 — Inscrição em evento com contribuição (refeição) e Pix com centavos únicos (26/11/2026)
--
-- O que faz:
--   1) participacao_eventos: a configuração de cada atividade que pede inscrição com contribuição (opções com valor, dados do Pix,
--      vagas, prazo). Uma linha por atividade (id = id da atividade).
--   2) participacao_inscricoes: uma linha por pessoa inscrita (nome, e-mail, telefone, CEP, restrição alimentar, opção, valor,
--      forma de pagamento, situação do pagamento e presença no dia).
--   3) Funções públicas (site aberto, sem login): pr_participacao_evento (lê a configuração), pr_participacao_inscrever (inscreve),
--      pr_participacao_informar_pago (a pessoa avisa que pagou).
--   4) Funções da equipe (exigem login aprovado): pr_participacao_config_salvar, pr_participacao_listar, pr_participacao_atualizar.
-- PIX COM CENTAVOS ÚNICOS (decisão do Leonidas, 26/11): cada inscrição que paga por Pix recebe de 1 a 99 centavos a mais sobre o valor da opção,
-- sem repetir entre inscrições ainda abertas (a pagar / informou) do mesmo evento e do mesmo valor. Assim, quem confere o extrato sabe
-- quem pagou pelo valor exato. Passando de 99 inscrições abertas no mesmo valor, as demais pagam o valor cheio e a equipe confere pelo nome.
-- Não mexe em nenhuma função ou tabela existente (lição da 0018). Seguro para rodar mais de uma vez.
-- Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run.

create table if not exists public.participacao_eventos (
  id          text primary key,                         -- id da atividade
  titulo      text not null default '',
  data_texto  text not null default '',                 -- ex.: "Domingo, 29 de novembro, a partir das 11h"
  local_texto text not null default '',
  aviso       text not null default '',                 -- recado opcional mostrado na tela de contribuição
  opcoes      jsonb not null default '[]'::jsonb,       -- [{id, nome, valor_centavos}]
  pix_chave   text not null default '',
  pix_nome    text not null default '',                 -- nome do recebedor (até 25 caracteres, vai no código Pix)
  pix_cidade  text not null default '',                 -- cidade do recebedor (até 15 caracteres)
  vagas       integer,                                  -- null = sem limite
  prazo       date,                                     -- último dia para se inscrever; null = sem prazo
  ativo       boolean not null default false,
  resp_email  text not null default '',                 -- responsável pela atividade (também enxerga as inscrições)
  atualizado  timestamptz not null default now()
);
alter table public.participacao_eventos enable row level security;
revoke all on public.participacao_eventos from anon, authenticated;

create table if not exists public.participacao_inscricoes (
  id            uuid primary key default gen_random_uuid(),
  evento_id     text not null references public.participacao_eventos(id) on delete cascade,
  codigo        text not null unique,                   -- código curto (6 letras/números) que identifica a inscrição
  token         text not null,                          -- segredo que só a própria pessoa recebe (para "Já paguei")
  nome          text not null,
  email         text not null,
  telefone      text not null,
  cep           text not null,
  restricao     text not null check (restricao in ('nao_vegetariano', 'vegetariano')),
  outra         text not null default '',               -- outra necessidade especial (opcional)
  opcao_id      text not null,
  opcao_nome    text not null,
  valor_centavos integer not null,                      -- valor da opção
  extra_centavos integer not null default 0,            -- centavos de identificação (1 a 99; 0 = presencial ou sem centavos livres)
  forma         text not null check (forma in ('pix', 'presencial')),
  status        text not null default 'a_pagar' check (status in ('a_pagar', 'informou', 'confirmado', 'cancelado')),
  txid          text not null,
  consentimento boolean not null default true,
  presente      boolean not null default false,
  criado_em     timestamptz not null default now(),
  informou_em   timestamptz,
  confirmado_em timestamptz,
  presente_em   timestamptz
);
create index if not exists participacao_insc_evento on public.participacao_inscricoes(evento_id, status);
alter table public.participacao_inscricoes enable row level security;
revoke all on public.participacao_inscricoes from anon, authenticated;

-- ---------- quem pode ver/gerir ----------
create or replace function public.pr_pode_participacao(p_evento text, p_so_admin boolean default false)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.perfis p
     where p.id = auth.uid() and p.status = 'aprovado'
       and ( p.nivel = 'administrador' or 'atividades' = any(p.funcoes)
             or (not p_so_admin and exists (select 1 from public.participacao_eventos e
                   where e.id = p_evento and e.resp_email <> '' and lower(e.resp_email) = lower(coalesce((select u.email from auth.users u where u.id = auth.uid()), '')))) )
  )
$$;
revoke all on function public.pr_pode_participacao(text, boolean) from public, anon;
grant execute on function public.pr_pode_participacao(text, boolean) to authenticated;

-- ---------- público: ler a configuração do evento ----------
create or replace function public.pr_participacao_evento(p_id text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare e public.participacao_eventos%rowtype; v_hoje date := (now() at time zone 'America/Sao_Paulo')::date; v_n integer;
begin
  select * into e from public.participacao_eventos where id = p_id and ativo;
  if not found then return jsonb_build_object('ok', false); end if;
  select count(*) into v_n from public.participacao_inscricoes where evento_id = e.id and status <> 'cancelado';
  return jsonb_build_object('ok', true, 'id', e.id, 'titulo', e.titulo, 'data_texto', e.data_texto, 'local_texto', e.local_texto, 'aviso', e.aviso,
    'opcoes', e.opcoes, 'pix', jsonb_build_object('chave', e.pix_chave, 'nome', e.pix_nome, 'cidade', e.pix_cidade),
    'vagas', e.vagas, 'inscritos', v_n,
    'encerrado', (e.prazo is not null and v_hoje > e.prazo) or (e.vagas is not null and v_n >= e.vagas), 'prazo', e.prazo);
end $$;
revoke all on function public.pr_participacao_evento(text) from public;
grant execute on function public.pr_participacao_evento(text) to anon, authenticated;

-- ---------- público: inscrever ----------
create or replace function public.pr_participacao_inscrever(
  p_evento text, p_nome text, p_email text, p_telefone text, p_cep text,
  p_restricao text, p_outra text, p_opcao text, p_forma text, p_consent boolean)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  e public.participacao_eventos%rowtype; v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_nome text := btrim(regexp_replace(coalesce(p_nome, ''), '\s+', ' ', 'g'));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_tel text := btrim(coalesce(p_telefone, ''));
  v_cep text := regexp_replace(coalesce(p_cep, ''), '\D', '', 'g');
  v_op jsonb; v_valor integer; v_extra integer := 0; v_cod text; v_tok text; v_n integer; v_try integer := 0;
  v_alfa text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; v_livres integer[];
begin
  select * into e from public.participacao_eventos where id = p_evento and ativo;
  if not found then return jsonb_build_object('ok', false, 'erro', 'Este evento não está recebendo inscrições.'); end if;
  if e.prazo is not null and v_hoje > e.prazo then return jsonb_build_object('ok', false, 'erro', 'As inscrições deste evento foram encerradas.'); end if;
  select count(*) into v_n from public.participacao_inscricoes where evento_id = e.id and status <> 'cancelado';
  if e.vagas is not null and v_n >= e.vagas then return jsonb_build_object('ok', false, 'erro', 'As vagas deste evento esgotaram.'); end if;
  if p_consent is not true then return jsonb_build_object('ok', false, 'erro', 'É preciso confirmar a participação e a ciência da contribuição.'); end if;
  if array_length(string_to_array(v_nome, ' '), 1) < 2 or length(v_nome) > 120 then return jsonb_build_object('ok', false, 'erro', 'Informe nome e sobrenome.'); end if;
  if v_email !~ '^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$' or length(v_email) > 160 then return jsonb_build_object('ok', false, 'erro', 'Informe um e-mail válido.'); end if;
  if length(regexp_replace(v_tel, '\D', '', 'g')) < 10 or length(v_tel) > 30 then return jsonb_build_object('ok', false, 'erro', 'Informe um telefone/WhatsApp com DDD.'); end if;
  if length(v_cep) <> 8 then return jsonb_build_object('ok', false, 'erro', 'Informe o CEP com 8 números.'); end if;
  if p_restricao not in ('nao_vegetariano', 'vegetariano') then return jsonb_build_object('ok', false, 'erro', 'Escolha a opção de alimentação.'); end if;
  if p_forma not in ('pix', 'presencial') then return jsonb_build_object('ok', false, 'erro', 'Escolha a forma de pagamento.'); end if;
  select o into v_op from jsonb_array_elements(e.opcoes) o where o ->> 'id' = p_opcao limit 1;
  if v_op is null then return jsonb_build_object('ok', false, 'erro', 'Escolha uma das opções de participação.'); end if;
  v_valor := (v_op ->> 'valor_centavos')::integer;
  if exists (select 1 from public.participacao_inscricoes where evento_id = e.id and lower(email) = v_email and status <> 'cancelado') then
    return jsonb_build_object('ok', false, 'erro', 'Já existe uma inscrição com este e-mail neste evento. Se precisar mudar algo, fale com a equipe do Parque.');
  end if;
  -- centavos únicos entre as inscrições ainda abertas do mesmo evento, valor e forma Pix
  if p_forma = 'pix' and v_valor > 0 then
    select array(select g from generate_series(1, 99) g
                  where g not in (select extra_centavos from public.participacao_inscricoes
                                   where evento_id = e.id and forma = 'pix' and valor_centavos = v_valor and status in ('a_pagar', 'informou') and extra_centavos > 0)
                  order by random() limit 1) into v_livres;
    if array_length(v_livres, 1) > 0 then v_extra := v_livres[1]; end if;
  end if;
  loop
    v_cod := ''; for i in 1..6 loop v_cod := v_cod || substr(v_alfa, 1 + floor(random() * length(v_alfa))::int, 1); end loop;
    exit when not exists (select 1 from public.participacao_inscricoes where codigo = v_cod);
    v_try := v_try + 1; if v_try > 20 then return jsonb_build_object('ok', false, 'erro', 'Tente de novo em instantes.'); end if;
  end loop;
  v_tok := encode(gen_random_bytes(12), 'hex');
  insert into public.participacao_inscricoes(evento_id, codigo, token, nome, email, telefone, cep, restricao, outra, opcao_id, opcao_nome, valor_centavos, extra_centavos, forma, txid)
    values (e.id, v_cod, v_tok, left(v_nome, 120), left(v_email, 160), left(v_tel, 30), v_cep, p_restricao, left(btrim(coalesce(p_outra, '')), 200),
            p_opcao, left(coalesce(v_op ->> 'nome', ''), 120), v_valor, v_extra, p_forma, 'PR' || v_cod);
  return jsonb_build_object('ok', true, 'codigo', v_cod, 'token', v_tok, 'txid', 'PR' || v_cod, 'forma', p_forma, 'opcao_nome', v_op ->> 'nome',
    'valor_centavos', v_valor, 'extra_centavos', v_extra, 'total_centavos', v_valor + v_extra, 'sem_centavos_livres', (p_forma = 'pix' and v_valor > 0 and v_extra = 0));
exception when others then
  return jsonb_build_object('ok', false, 'erro', 'Não foi possível concluir a inscrição agora. Tente de novo.');
end $$;
revoke all on function public.pr_participacao_inscrever(text, text, text, text, text, text, text, text, text, boolean) from public;
grant execute on function public.pr_participacao_inscrever(text, text, text, text, text, text, text, text, text, boolean) to anon, authenticated;

-- ---------- público: "Já paguei" (só com o segredo recebido na inscrição) ----------
create or replace function public.pr_participacao_informar_pago(p_codigo text, p_token text)
returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  update public.participacao_inscricoes set status = 'informou', informou_em = now()
   where codigo = upper(coalesce(p_codigo, '')) and token = coalesce(p_token, '') and status = 'a_pagar' and forma = 'pix';
  return jsonb_build_object('ok', found);
end $$;
revoke all on function public.pr_participacao_informar_pago(text, text) from public;
grant execute on function public.pr_participacao_informar_pago(text, text) to anon, authenticated;

-- ---------- equipe: salvar configuração (só administrador ou Administrador das Atividades) ----------
create or replace function public.pr_participacao_config_salvar(p_id text, p_cfg jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_op jsonb; v_ops jsonb := '[]'::jsonb; v_n integer := 0; v_nome text; v_val integer;
begin
  if auth.uid() is null or not public.pr_pode_participacao(p_id, true) then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  if p_id is null or length(p_id) not between 1 and 80 then raise exception 'Atividade inválida.'; end if;
  for v_op in select * from jsonb_array_elements(coalesce(p_cfg -> 'opcoes', '[]'::jsonb)) loop
    v_nome := left(btrim(coalesce(v_op ->> 'nome', '')), 120); v_val := coalesce((v_op ->> 'valor_centavos')::integer, -1);
    if v_nome = '' or v_val < 0 or v_val > 10000000 then raise exception 'Cada opção precisa de nome e valor.'; end if;
    v_n := v_n + 1; if v_n > 10 then raise exception 'No máximo 10 opções.'; end if;
    v_ops := v_ops || jsonb_build_array(jsonb_build_object('id', coalesce(nullif(v_op ->> 'id', ''), 'o' || v_n), 'nome', v_nome, 'valor_centavos', v_val));
  end loop;
  if coalesce((p_cfg ->> 'ativo')::boolean, false) and (v_n = 0 or btrim(coalesce(p_cfg ->> 'pix_chave', '')) = '') then
    raise exception 'Para ativar, informe ao menos uma opção e a chave Pix.';
  end if;
  insert into public.participacao_eventos(id, titulo, data_texto, local_texto, aviso, opcoes, pix_chave, pix_nome, pix_cidade, vagas, prazo, ativo, resp_email, atualizado)
  values (p_id, left(coalesce(p_cfg ->> 'titulo', ''), 160), left(coalesce(p_cfg ->> 'data_texto', ''), 160), left(coalesce(p_cfg ->> 'local_texto', ''), 160), left(coalesce(p_cfg ->> 'aviso', ''), 400),
          v_ops, left(btrim(coalesce(p_cfg ->> 'pix_chave', '')), 80), left(upper(btrim(coalesce(p_cfg ->> 'pix_nome', ''))), 25), left(upper(btrim(coalesce(p_cfg ->> 'pix_cidade', ''))), 15),
          nullif(p_cfg ->> 'vagas', '')::integer, nullif(p_cfg ->> 'prazo', '')::date, coalesce((p_cfg ->> 'ativo')::boolean, false), lower(left(coalesce(p_cfg ->> 'resp_email', ''), 160)), now())
  on conflict (id) do update set titulo = excluded.titulo, data_texto = excluded.data_texto, local_texto = excluded.local_texto, aviso = excluded.aviso, opcoes = excluded.opcoes,
    pix_chave = excluded.pix_chave, pix_nome = excluded.pix_nome, pix_cidade = excluded.pix_cidade, vagas = excluded.vagas, prazo = excluded.prazo, ativo = excluded.ativo,
    resp_email = excluded.resp_email, atualizado = now();
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.pr_participacao_config_salvar(text, jsonb) from public, anon;
grant execute on function public.pr_participacao_config_salvar(text, jsonb) to authenticated;

-- ---------- equipe: listar inscrições + configuração + totais ----------
create or replace function public.pr_participacao_listar(p_id text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_cfg jsonb; v_ins jsonb; v_tot jsonb;
begin
  if auth.uid() is null or not public.pr_pode_participacao(p_id, false) then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select to_jsonb(e) - 'atualizado' into v_cfg from public.participacao_eventos e where e.id = p_id;
  select coalesce(jsonb_agg(to_jsonb(i) - 'token' - 'id' order by i.criado_em), '[]'::jsonb) into v_ins from public.participacao_inscricoes i where i.evento_id = p_id;
  select jsonb_build_object(
      'inscritos',   count(*) filter (where status <> 'cancelado'),
      'confirmados', count(*) filter (where status = 'confirmado'),
      'a_pagar',     count(*) filter (where status in ('a_pagar', 'informou')),
      'presentes',   count(*) filter (where presente and status <> 'cancelado'),
      'vegetarianos',count(*) filter (where restricao = 'vegetariano' and status <> 'cancelado'),
      'esperado_centavos',   coalesce(sum(valor_centavos) filter (where status <> 'cancelado'), 0),
      'confirmado_centavos', coalesce(sum(valor_centavos + extra_centavos) filter (where status = 'confirmado'), 0))
    into v_tot from public.participacao_inscricoes where evento_id = p_id;
  return jsonb_build_object('config', v_cfg, 'inscricoes', v_ins, 'totais', v_tot);
end $$;
revoke all on function public.pr_participacao_listar(text) from public, anon;
grant execute on function public.pr_participacao_listar(text) to authenticated;

-- ---------- equipe: atualizar uma inscrição (confirmar pagamento, desfazer, cancelar, presença) ----------
create or replace function public.pr_participacao_atualizar(p_evento text, p_codigo text, p_acao text)
returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.pr_pode_participacao(p_evento, false) then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  if p_acao = 'confirmar' then update public.participacao_inscricoes set status = 'confirmado', confirmado_em = now() where evento_id = p_evento and codigo = p_codigo and status <> 'cancelado';
  elsif p_acao = 'desfazer' then update public.participacao_inscricoes set status = 'a_pagar', confirmado_em = null where evento_id = p_evento and codigo = p_codigo and status = 'confirmado';
  elsif p_acao = 'cancelar' then update public.participacao_inscricoes set status = 'cancelado' where evento_id = p_evento and codigo = p_codigo;
  elsif p_acao = 'reabrir' then update public.participacao_inscricoes set status = 'a_pagar' where evento_id = p_evento and codigo = p_codigo and status = 'cancelado';
  elsif p_acao = 'presente' then update public.participacao_inscricoes set presente = true, presente_em = now() where evento_id = p_evento and codigo = p_codigo and status <> 'cancelado';
  elsif p_acao = 'ausente' then update public.participacao_inscricoes set presente = false, presente_em = null where evento_id = p_evento and codigo = p_codigo;
  else raise exception 'Ação inválida.'; end if;
  return jsonb_build_object('ok', found);
end $$;
revoke all on function public.pr_participacao_atualizar(text, text, text) from public, anon;
grant execute on function public.pr_participacao_atualizar(text, text, text) to authenticated;

select 'ok - migração 0027 (inscrição em evento com contribuição) aplicada' as resultado;
