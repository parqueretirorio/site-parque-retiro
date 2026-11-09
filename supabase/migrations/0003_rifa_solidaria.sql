-- Rifa Solidária: nova responsabilidade 'rifa' e as coleções de rifas e participações.
-- 'rifas' (cadastro, resultado da apuração) é lida por todos; 'rifa_part' tem dados pessoais e comprovantes (LGPD): sensível.
-- Cada participação confirmada também é lançada em 'contas' (origem Rifa Solidária), que alimenta a planilha consolidada em "Ajude o Parque".
-- ATENÇÃO: a inscrição feita por visitante (sem login) exige uma rota pública no servidor que reserve os números de forma atômica;
-- veja docs/RIFA_SOLIDARIA.md. Esta migração só prepara as coleções e a permissão.
alter table public.perfis drop constraint if exists perfis_funcoes_check;
alter table public.perfis add constraint perfis_funcoes_check
  check (funcoes <@ array['reservas','estela','album','inventario','documentos','comunicacao','lojinha','rifa']);
insert into public.colecoes(nome, funcao_escrita, nivel_leitura, nivel_escrita, sensivel) values
  ('rifas',     'rifa', 'leitor', 'administrador', false),
  ('rifa_part', 'rifa', 'leitor', 'administrador', true)
on conflict (nome) do nothing;
