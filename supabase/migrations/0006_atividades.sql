-- Atividades (antigo "Eventos"): registro escrito de eventos, encontros, retiros e reuniões, com publicação no site.
-- Nova responsabilidade 'atividades' e a coleção 'atividades'. Não é dado pessoal (texto e imagens publicados no site).
-- Os registros 'publicada' precisam de leitura pública no servidor (como o Álbum e a Lojinha); veja docs/ATIVIDADES.md.
alter table public.perfis drop constraint if exists perfis_funcoes_check;
alter table public.perfis add constraint perfis_funcoes_check
  check (funcoes <@ array['reservas','estela','album','inventario','documentos','comunicacao','lojinha','rifa','vaquinha','voluntario','jardinagem','atividades']);
insert into public.colecoes(nome, funcao_escrita, nivel_leitura, nivel_escrita, sensivel) values
  ('atividades', 'atividades', 'leitor', 'administrador', false)
on conflict (nome) do nothing;
