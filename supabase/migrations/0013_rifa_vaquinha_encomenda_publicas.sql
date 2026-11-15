-- CONecta Retiro — Rifa, Vaquinha e Encomendas ligadas ao servidor nas páginas ABERTAS do site (15/11/2026).
-- Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run. Pode rodar de novo sem estragar nada.
-- Depende da 0011 (vitrines e caixa de entrada). Não apaga nem altera nenhum dado que já existe.
--
-- 1) A caixa de entrada passa a aceitar também contribuições da Vaquinha (vaq_part) e encomendas de livros
--    (livraria_enc). A equipe recolhe ao abrir a área restrita, como já acontece com voluntários e fotos.
-- 2) Rifa: o SERVIDOR sorteia os números na hora da inscrição, um de cada vez (trava a lista), para que duas pessoas
--    nunca recebam o mesmo número. A inscrição entra "pendente" para a Comissão conferir o comprovante.
-- 3) Consulta pública "meus números / minha contribuição": só com o e-mail E o celular usados, e só devolve código,
--    números/valor e situação (nunca nome, contato ou comprovante).

-- ---------- 1) Caixa de entrada: aceita Vaquinha e Encomendas ----------
create or replace function public.pr_enviar_publico(p_caixa text, p_dados jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n integer; t integer;
begin
  if p_caixa is null or p_caixa not in ('contatos', 'voluntarios', 'album', 'vaq_part', 'livraria_enc') then
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

-- ---------- 2) Rifa: inscrição pública com sorteio dos números no servidor ----------
create or replace function public.pr_rifa_inscrever(p_dados jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  partes jsonb; v integer; rs jsonb; r jsonb; qtd integer; total integer; preco numeric;
  ocup integer[]; livres integer[]; escolhidos integer[]; cod text; novo jsonb; vit jsonb; n integer;
  v_nome text := btrim(coalesce(p_dados->>'nome', ''));
  email text := lower(btrim(coalesce(p_dados->>'email', '')));
  cel text := left(btrim(coalesce(p_dados->>'celular', '')), 30);
  wpp text := left(btrim(coalesce(p_dados->>'whatsapp', '')), 30);
  comp text := coalesce(p_dados->>'comprovante', '');
  partesNome text[];
begin
  if p_dados is null or jsonb_typeof(p_dados) <> 'object' then raise exception 'Inscrição inválida.' using errcode = '22023'; end if;
  if octet_length(p_dados::text) > 900000 then raise exception 'Comprovante grande demais. Envie uma foto ou um PDF menor.' using errcode = '22023'; end if;
  partesNome := regexp_split_to_array(v_nome, '\s+');
  if length(v_nome) > 120 or coalesce(array_length(partesNome, 1), 0) < 2 then raise exception 'Informe o nome completo (nome e sobrenome).' using errcode = '22023'; end if;
  if length(regexp_replace(cel, '\D', '', 'g')) < 10 then raise exception 'Informe o celular com DDD.' using errcode = '22023'; end if;
  if length(regexp_replace(wpp, '\D', '', 'g')) < 10 then raise exception 'Informe o WhatsApp com DDD.' using errcode = '22023'; end if;
  if email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(email) > 160 then raise exception 'Informe um e-mail válido.' using errcode = '22023'; end if;
  if comp !~ '^data:(image/(jpeg|png|webp)|application/pdf);base64,' then raise exception 'Anexe o comprovante de pagamento (imagem ou PDF).' using errcode = '22023'; end if;
  if coalesce(p_dados->>'consentimento', '') <> 'true' then raise exception 'É preciso concordar com o uso dos dados para participar.' using errcode = '22023'; end if;
  begin qtd := (p_dados->>'qtd')::integer; exception when others then qtd := null; end;
  if qtd is null or qtd < 1 or qtd > 20 then raise exception 'Escolha de 1 a 20 números.' using errcode = '22023'; end if;

  -- trava a lista de participações: inscrições ao mesmo tempo esperam a vez (nunca repetem número)
  select dados, versao into partes, v from public.registros where colecao = 'rifa_part' and id = '_' for update;
  if not found then partes := '[]'::jsonb; v := 0; end if;
  if partes is null or jsonb_typeof(partes) <> 'array' then partes := '[]'::jsonb; end if;

  -- freio contra robôs: no máximo 60 inscrições pelo site por hora
  select count(*) into n from jsonb_array_elements(partes) x
   where x->>'origem' = 'publica' and coalesce(x->>'criadoEm', '') > to_char((now() - interval '1 hour') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS');
  if n >= 60 then raise exception 'Muitas inscrições agora. Tente de novo mais tarde.' using errcode = '54000'; end if;

  select dados into rs from public.registros where colecao = 'rifas' and id = '_' and excluido_em is null;
  select x into r from jsonb_array_elements(coalesce(rs, '[]'::jsonb)) x where x->>'id' = p_dados->>'rifa' limit 1;
  if r is null then raise exception 'Rifa não encontrada.' using errcode = '22023'; end if;
  if not (coalesce((r->>'ativa')::boolean, false) and not coalesce((r->>'cancelada')::boolean, false)
          and coalesce(jsonb_typeof(r->'apuracao'), 'null') = 'null'
          and (r->>'dataSorteio') ~ '^\d{4}-\d{2}-\d{2}' and hoje < left(r->>'dataSorteio', 10)::date) then
    raise exception 'As inscrições desta rifa estão encerradas.' using errcode = '22023';
  end if;
  if coalesce(p_dados->>'moeda', '') <> all (array(select jsonb_array_elements_text(coalesce(r->'moedas', '["PIX"]'::jsonb)))) then
    raise exception 'Forma de pagamento não aceita nesta rifa.' using errcode = '22023';
  end if;
  total := coalesce((r->>'total')::integer, 0); preco := coalesce((r->>'preco')::numeric, 0);

  ocup := array(select (jsonb_array_elements_text(x->'numeros'))::integer from jsonb_array_elements(partes) x
                 where x->>'rifa' = r->>'id' and coalesce(x->>'status', '') <> 'recusado');
  livres := array(select g from generate_series(0, total - 1) g where not (g = any (ocup)));
  if coalesce(array_length(livres, 1), 0) < qtd then
    if coalesce(array_length(livres, 1), 0) = 0 then raise exception 'Todos os números já foram reservados.' using errcode = '22023'; end if;
    raise exception 'Só restam % número(s) disponível(is).', array_length(livres, 1) using errcode = '22023';
  end if;
  escolhidos := array(select g from (select g from unnest(livres) g order by random() limit qtd) s order by g);

  loop  -- código único, no mesmo formato do site (R + 4 letras/números)
    cod := 'R' || (select string_agg(substr(alfabeto, 1 + floor(random() * 32)::integer, 1), '') from generate_series(1, 4));
    exit when not exists (select 1 from jsonb_array_elements(partes) x where x->>'codigo' = cod);
  end loop;

  novo := jsonb_build_object(
    'id', 's' || to_hex((extract(epoch from clock_timestamp()) * 1000)::bigint) || substr(md5(random()::text), 1, 6),
    'codigo', cod, 'rifa', r->>'id', 'nome', v_nome, 'celular', cel, 'whatsapp', wpp, 'email', email,
    'numeros', to_jsonb(escolhidos), 'moeda', p_dados->>'moeda', 'total', round(qtd * preco, 2), 'comprovante', comp,
    'status', 'pendente', 'origem', 'publica', 'criadoEm', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'consentimento', true, 'por', '', 'conta', '');

  if v = 0 then
    insert into public.registros(colecao, id, dados) values ('rifa_part', '_', jsonb_build_array(novo));
  else
    update public.registros set dados = partes || jsonb_build_array(novo) where colecao = 'rifa_part' and id = '_';
  end if;

  -- a vitrine do site já mostra os números como reservados (sem nome completo nem contato)
  vit := jsonb_build_object('id', novo->>'id', 'rifa', r->>'id', 'numeros', to_jsonb(escolhidos), 'status', 'pendente',
                            'nome', partesNome[1] || ' ' || upper(left(partesNome[array_length(partesNome, 1)], 1)) || '.');
  insert into public.colecoes(nome, nivel_leitura, nivel_escrita) values ('pub_rifa_part', 'leitor', 'leitor') on conflict (nome) do nothing;
  update public.registros set dados = case when jsonb_typeof(dados) = 'array' then dados else '[]'::jsonb end || jsonb_build_array(vit)
   where colecao = 'pub_rifa_part' and id = '_';
  if not found then insert into public.registros(colecao, id, dados) values ('pub_rifa_part', '_', jsonb_build_array(vit)); end if;

  return jsonb_build_object('id', novo->>'id', 'codigo', cod, 'rifa', r->>'id', 'numeros', to_jsonb(escolhidos),
                            'total', novo->'total', 'moeda', novo->'moeda', 'status', 'pendente');
end $$;
revoke all on function public.pr_rifa_inscrever(jsonb) from public;
grant execute on function public.pr_rifa_inscrever(jsonb) to anon, authenticated;

-- ---------- 3) Consulta pública: "meus números" (Rifa) e "minha contribuição" (Vaquinha) ----------
create or replace function public.pr_consultar_publico(p_tipo text, p_email text, p_contato text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare em text := lower(btrim(coalesce(p_email, ''))); ct text := regexp_replace(coalesce(p_contato, ''), '\D', '', 'g'); lst jsonb;
begin
  if p_tipo is null or p_tipo not in ('rifa_part', 'vaq_part') then raise exception 'Consulta não aceita.' using errcode = '22023'; end if;
  if em = '' or length(ct) < 8 then return '[]'::jsonb; end if;
  with todos as (
    select x from public.registros r, jsonb_array_elements(case when jsonb_typeof(r.dados) = 'array' then r.dados else '[]'::jsonb end) x
     where r.colecao = p_tipo and r.id = '_' and r.excluido_em is null
    union all
    select e.dados from public.envios_publicos e where e.caixa = p_tipo     -- ainda na caixa de entrada: aguardando a equipe
  )
  select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
           'codigo', x->'codigo', 'rifa', x->'rifa', 'vaquinha', x->'vaquinha', 'numeros', x->'numeros',
           'valor', x->'valor', 'total', x->'total', 'moeda', x->'moeda', 'status', coalesce(x->'status', '"pendente"'::jsonb),
           'criadoEm', x->'criadoEm')) order by x->>'criadoEm' desc), '[]'::jsonb)
    into lst
    from todos
   where lower(coalesce(x->>'email', '')) = em
     and (regexp_replace(coalesce(x->>'celular', ''), '\D', '', 'g') = ct or regexp_replace(coalesce(x->>'whatsapp', ''), '\D', '', 'g') = ct);
  return lst;
end $$;
revoke all on function public.pr_consultar_publico(text, text, text) from public;
grant execute on function public.pr_consultar_publico(text, text, text) to anon, authenticated;

-- Conferência (deve aparecer "ok"):
select 'ok' as rifa_vaquinha_encomenda_instaladas;
