-- 0020 — Restaura a função pr_enviar_publico (caixa de entrada do site aberto)
--
-- Por que existe: a migração 0018 recriou pr_enviar_publico com outra lista de caixas
-- (rifa_inscricoes, vaquinha_doacoes, encomenda_pedidos, inscricoes, feedback) e outro destino
-- (coleções em "registros", não a tabela envios_publicos). Com isso, as caixas que o site realmente usa
-- (contatos, voluntarios, album, vaq_part, livraria_enc) passaram a ser recusadas com {"ok": false} e
-- NADA era guardado, apesar de o site mostrar "enviado". A caixa 'inscricoes' e a 'feedback' também
-- deixaram de chegar ao lugar de onde a área restrita as recolhe.
--
-- O que faz: volta à versão da 0014 (tabela envios_publicos, freio contra robôs, limites de tamanho)
-- e acrescenta a caixa 'feedback', que a página "Como foi a sua visita?" usa.
-- Seguro para rodar mais de uma vez. Não apaga nem altera dados existentes.
create or replace function public.pr_enviar_publico(p_caixa text, p_dados jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n integer; t integer;
begin
  if p_caixa is null or p_caixa not in ('contatos', 'voluntarios', 'album', 'vaq_part', 'livraria_enc', 'inscricoes', 'feedback') then
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

select 'ok - migração 0020 (envios públicos restaurados) aplicada' as resultado;
