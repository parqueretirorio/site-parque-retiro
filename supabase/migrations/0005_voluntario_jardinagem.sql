-- Voluntário e Jardinagem / Área Externa: novas responsabilidades 'voluntario' e 'jardinagem' e as coleções correspondentes.
-- 'voluntarios' (inscrições de quem quer cooperar sem dinheiro) tem dados pessoais (LGPD): sensível.
-- ATENÇÃO: a inscrição feita por visitante (sem login) exige uma rota pública no servidor; veja docs/VOLUNTARIO_JARDINAGEM.md.
-- Esta migração só prepara as coleções e a permissão.
alter table public.perfis drop constraint if exists perfis_funcoes_check;
alter table public.perfis add constraint perfis_funcoes_check
  check (funcoes <@ array['reservas','estela','album','inventario','documentos','comunicacao','lojinha','rifa','vaquinha','voluntario','jardinagem']);
insert into public.colecoes(nome, funcao_escrita, nivel_leitura, nivel_escrita, sensivel) values
  ('voluntarios',  'voluntario', 'leitor', 'administrador', true),
  ('jard_planos',  'jardinagem', 'leitor', 'administrador', false),
  ('jard_docs',    'jardinagem', 'leitor', 'administrador', false)
on conflict (nome) do nothing;
