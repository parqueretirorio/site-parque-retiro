-- 0029 (27/11/2026) — Corrige a inscrição em eventos (pr_participacao_inscrever).
-- Problema: a função usava gen_random_bytes() (extensão pgcrypto). No Supabase essa extensão fica no schema "extensions",
-- que não está no search_path da função (public), então toda inscrição caía no erro genérico
-- "Não foi possível concluir a inscrição agora". Correção: o token passa a ser gerado com gen_random_uuid() (nativo do PostgreSQL).
-- Seguro rodar mais de uma vez. Não altera dados nem tabelas; só substitui a função.

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
  v_tok := replace(gen_random_uuid()::text, '-', '');
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
