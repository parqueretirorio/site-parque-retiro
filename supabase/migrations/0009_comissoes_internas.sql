-- Comissões internas (só na área restrita): Construção, Manutenção e Traduções.
-- Novas responsabilidades 'construcao', 'manutencao' e 'traducoes' e as coleções de cada comissão.
-- A lista de funções abaixo é a lista completa usada pela área restrita (area.js, constante FUNC).
alter table public.perfis drop constraint if exists perfis_funcoes_check;
alter table public.perfis add constraint perfis_funcoes_check
  check (funcoes <@ array['reservas','estela','album','inventario','financeiro','compras','solicitante','documentos','comunicacao','lojinha','rifa','vaquinha','voluntario','jardinagem','atividades','multiuso','construcao','manutencao','traducoes','ajuda']);
insert into public.colecoes(nome, funcao_escrita, nivel_leitura, nivel_escrita, sensivel) values
  ('constr_itens', 'construcao', 'leitor', 'administrador', false),
  ('constr_docs',  'construcao', 'leitor', 'administrador', false),
  ('manut_itens',  'manutencao', 'leitor', 'administrador', false),
  ('manut_docs',   'manutencao', 'leitor', 'administrador', false),
  ('trad_itens',   'traducoes',  'leitor', 'administrador', false),
  ('trad_docs',    'traducoes',  'leitor', 'administrador', false)
on conflict (nome) do nothing;
-- Estas coleções não têm leitura pública: as comissões não aparecem no site.
