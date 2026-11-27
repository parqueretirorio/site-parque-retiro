-- 0028 (27/11/2026): co-responsáveis da inscrição em evento (depende da 0027).
-- Regras: o responsável (ou o Administrador das Atividades) escolhe os co-responsáveis entre pessoas com conta aprovada.
-- O co-responsável vê só nome e telefone/WhatsApp dos inscritos, mais a situação do pagamento e a presença,
-- e pode confirmar/desfazer pagamento e marcar presença. Não vê e-mail, CEP nem alimentação de cada pessoa,
-- não vê a configuração (Pix, valores), não cancela inscrições e não escolhe outros co-responsáveis.
alter table public.participacao_eventos add column if not exists co_emails text[] not null default '{}';

-- papel de quem chama neste evento: 'admin' | 'resp' | 'co' | null
create or replace function public.pr_participacao_papel(p_evento text)
returns text
language sql stable security definer set search_path = public as $$
  select case
    when auth.uid() is null then null
    when exists (select 1 from public.perfis p where p.id = auth.uid() and p.status = 'aprovado' and (p.nivel = 'administrador' or 'atividades' = any(p.funcoes))) then 'admin'
    when not exists (select 1 from public.perfis p where p.id = auth.uid() and p.status = 'aprovado') then null
    else (
      select case
        when e.resp_email <> '' and lower(e.resp_email) = lower(coalesce(u.email, '')) then 'resp'
        when lower(coalesce(u.email, '')) = any(e.co_emails) then 'co'
        else null end
      from public.participacao_eventos e, auth.users u
      where e.id = p_evento and u.id = auth.uid())
  end
$$;
revoke all on function public.pr_participacao_papel(text) from public, anon;
grant execute on function public.pr_participacao_papel(text) to authenticated;

-- pode ver a lista e confirmar pagamento/presença (admin, responsável e co-responsável); p_so_admin = só administração
create or replace function public.pr_pode_participacao(p_evento text, p_so_admin boolean default false)
returns boolean
language sql stable security definer set search_path = public as $$
  select case when p_so_admin then coalesce(public.pr_participacao_papel(p_evento) = 'admin', false)
              else coalesce(public.pr_participacao_papel(p_evento) in ('admin', 'resp', 'co'), false) end
$$;
revoke all on function public.pr_pode_participacao(text, boolean) from public, anon;
grant execute on function public.pr_pode_participacao(text, boolean) to authenticated;

-- equipe: responsável (opcional) e co-responsáveis. Só administração ou o responsável atual.
create or replace function public.pr_participacao_equipe_salvar(p_id text, p_resp text, p_co jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_papel text; v_resp text; v_co text[];
begin
  v_papel := public.pr_participacao_papel(p_id);
  if v_papel is null or v_papel = 'co' then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  if not exists (select 1 from public.participacao_eventos where id = p_id) then return jsonb_build_object('ok', false, 'sem_evento', true); end if;
  v_resp := lower(left(coalesce(p_resp, ''), 160));
  select coalesce(array_agg(distinct x), '{}') into v_co
    from (select lower(left(trim(value), 160)) as x from jsonb_array_elements_text(coalesce(p_co, '[]'::jsonb)) limit 20) t
   where x ~ '^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$' and x <> v_resp;
  update public.participacao_eventos
     set co_emails = v_co, resp_email = case when v_resp <> '' then v_resp else resp_email end, atualizado = now()
   where id = p_id;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.pr_participacao_equipe_salvar(text, text, jsonb) from public, anon;
grant execute on function public.pr_participacao_equipe_salvar(text, text, jsonb) to authenticated;

-- lista: o co-responsável recebe só o que precisa (nome, telefone, participação, valor, situação, presença)
create or replace function public.pr_participacao_listar(p_id text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_cfg jsonb; v_ins jsonb; v_tot jsonb; v_papel text;
begin
  v_papel := public.pr_participacao_papel(p_id);
  if v_papel is null then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select to_jsonb(e) - 'atualizado' into v_cfg from public.participacao_eventos e where e.id = p_id;
  if v_papel = 'co' then
    v_cfg := jsonb_build_object('id', p_id, 'titulo', v_cfg ->> 'titulo', 'ativo', (v_cfg ->> 'ativo')::boolean);
    select coalesce(jsonb_agg(jsonb_build_object('codigo', i.codigo, 'nome', i.nome, 'telefone', i.telefone, 'opcao_nome', i.opcao_nome,
             'valor_centavos', i.valor_centavos, 'extra_centavos', i.extra_centavos, 'forma', i.forma, 'status', i.status,
             'presente', i.presente, 'criado_em', i.criado_em) order by i.criado_em), '[]'::jsonb)
      into v_ins from public.participacao_inscricoes i where i.evento_id = p_id;
  else
    select coalesce(jsonb_agg(to_jsonb(i) - 'token' - 'id' order by i.criado_em), '[]'::jsonb) into v_ins from public.participacao_inscricoes i where i.evento_id = p_id;
  end if;
  select jsonb_build_object(
      'inscritos',   count(*) filter (where status <> 'cancelado'),
      'confirmados', count(*) filter (where status = 'confirmado'),
      'a_pagar',     count(*) filter (where status in ('a_pagar', 'informou')),
      'presentes',   count(*) filter (where presente and status <> 'cancelado'),
      'vegetarianos',count(*) filter (where restricao = 'vegetariano' and status <> 'cancelado'),
      'esperado_centavos',   coalesce(sum(valor_centavos) filter (where status <> 'cancelado'), 0),
      'confirmado_centavos', coalesce(sum(valor_centavos + extra_centavos) filter (where status = 'confirmado'), 0))
    into v_tot from public.participacao_inscricoes where evento_id = p_id;
  return jsonb_build_object('papel', v_papel, 'config', v_cfg, 'inscricoes', v_ins, 'totais', v_tot);
end $$;
revoke all on function public.pr_participacao_listar(text) from public, anon;
grant execute on function public.pr_participacao_listar(text) to authenticated;

-- atualizar: co-responsável só confirma/desfaz pagamento e marca presença; cancelar/reabrir ficam com responsável e administração
create or replace function public.pr_participacao_atualizar(p_evento text, p_codigo text, p_acao text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_papel text;
begin
  v_papel := public.pr_participacao_papel(p_evento);
  if v_papel is null then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  if v_papel = 'co' and p_acao in ('cancelar', 'reabrir') then raise exception 'Sem permissão.' using errcode = '42501'; end if;
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

select 'ok - migração 0028 (co-responsáveis da inscrição) aplicada' as resultado;
