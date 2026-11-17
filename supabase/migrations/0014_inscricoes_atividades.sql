-- CONecta Retiro — Inscrições em Atividades do Parque (17/11/2026).
-- Permite que visitantes do site se inscrevam em encontros, festivais e retiros.
-- A coleção 'atividades_pub' guarda os encontros abertos ao público.
-- A caixa 'inscricoes' recebe o formulário de interesse dos visitantes.
-- Envio de confirmação por e-mail via função enviar-email (já instalada).
-- Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run.
-- Pode rodar de novo sem estragar nada. Não apaga nem altera dados existentes.

-- ---------- 1) Coleção de encontros públicos (gerida pela equipe na área restrita) ----------
insert into public.colecoes(nome, funcao_escrita, nivel_leitura, nivel_escrita, sensivel) values
  ('atividades_pub', 'comunicacao', 'leitor', 'administrador', false)
on conflict (nome) do nothing;

-- ---------- 2) Caixa de entrada para inscrições de visitantes ----------
-- A função pr_enviar_publico já existe (0013). Precisamos apenas adicioná-la como caixa aceita.
-- Como a função já usa uma lista fixa, recriamos com a nova lista.
create or replace function public.pr_enviar_publico(p_caixa text, p_dados jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n integer; t integer;
begin
  if p_caixa is null or p_caixa not in ('contatos', 'voluntarios', 'album', 'vaq_part', 'livraria_enc', 'inscricoes') then
    raise exception 'Envio não aceito: %', p_caixa using errcode = '22023';
  end if;
  if p_dados is null or jsonb_typeof(p_dados) <> 'object' then
    raise exception 'Envio inválido.' using errcode = '22023';
  end if;
  t := octet_length(p_dados::text);
  if t > (case when p_caixa = 'album' then 600000 when p_caixa = 'vaq_part' then 900000 else 20000 end) then
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

-- ---------- 3) Regra de validação das inscrições (usada pelo publico.js no frontend) ----------
-- A inscrição exige: nome completo, e-mail válido. Telefone e cidade são opcionais.
-- Nenhum dado sensível é exposto na vitrine.

-- ---------- 4) Vitrine: lista pública de quantos se inscreveram (sem dados pessoais) ----------
-- A vitrine pub_atividades_pub mostra só nome e contagem de inscritos.
-- A equipe usa a área restrita para ver a lista completa com contatos.
create or replace function public.pr_contagem_inscricoes(p_atividade_id text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare n integer; lst jsonb;
begin
  if p_atividade_id is null or length(p_atividade_id) < 1 then return '{"total":0}'::jsonb; end if;
  -- conta nas inscrições confirmadas
  select count(*) into n
    from public.registros r, jsonb_array_elements(
      case when jsonb_typeof(r.dados) = 'array' then r.dados else '[]'::jsonb end
    ) x
   where r.colecao = 'inscricoes' and r.id = '_' and r.excluido_em is null
     and x->>'atividade' = p_atividade_id
     and coalesce(x->>'cancelado', 'false') <> 'true';
  -- soma com os que ainda estão na caixa de entrada
  select count(*) + n into n
    from public.envios_publicos e
   where e.caixa = 'inscricoes'
     and e.dados->>'atividade' = p_atividade_id;
  return jsonb_build_object('total', n, 'atividade', p_atividade_id);
end $$;
revoke all on function public.pr_contagem_inscricoes(text) from public;
grant execute on function public.pr_contagem_inscricoes(text) to anon, authenticated;

-- Conferência (deve aparecer "ok"):
select 'ok' as inscricoes_atividades_instaladas;
