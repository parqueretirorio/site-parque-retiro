-- Multiuso (Comissões Parque Retiro): nova responsabilidade 'multiuso' e as coleções da agenda, planejamentos, regras e documentos.
alter table public.perfis drop constraint if exists perfis_funcoes_check;
alter table public.perfis add constraint perfis_funcoes_check
  check (funcoes <@ array['reservas','estela','album','inventario','documentos','comunicacao','lojinha','rifa','vaquinha','voluntario','jardinagem','atividades','multiuso']);
insert into public.colecoes(nome, funcao_escrita, nivel_leitura, nivel_escrita, sensivel) values
  ('multiuso_agenda', 'multiuso', 'leitor', 'administrador', false),
  ('multiuso_planos', 'multiuso', 'leitor', 'administrador', false),
  ('multiuso_info',   'multiuso', 'leitor', 'administrador', false),
  ('multiuso_docs',   'multiuso', 'leitor', 'administrador', false)
on conflict (nome) do nothing;
