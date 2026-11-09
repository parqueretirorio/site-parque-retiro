-- Vaquinha Coletiva: nova responsabilidade 'vaquinha' e as coleções de vaquinhas (campanhas) e contribuições.
-- 'vaquinhas' (objetivo, meta, formas de ajuda) é lida por todos; 'vaq_part' tem dados pessoais e comprovantes (LGPD): sensível.
-- Cada contribuição confirmada também é lançada em 'contas' (origem Vaquinha Coletiva), que alimenta a planilha consolidada em "Ajude o Parque".
-- ATENÇÃO: a contribuição feita por visitante (sem login) exige uma rota pública no servidor; veja docs/VAQUINHA_COLETIVA.md.
-- Esta migração só prepara as coleções e a permissão.
alter table public.perfis drop constraint if exists perfis_funcoes_check;
alter table public.perfis add constraint perfis_funcoes_check
  check (funcoes <@ array['reservas','estela','album','inventario','documentos','comunicacao','lojinha','rifa','vaquinha']);
insert into public.colecoes(nome, funcao_escrita, nivel_leitura, nivel_escrita, sensivel) values
  ('vaquinhas', 'vaquinha', 'leitor', 'administrador', false),
  ('vaq_part',  'vaquinha', 'leitor', 'administrador', true)
on conflict (nome) do nothing;
