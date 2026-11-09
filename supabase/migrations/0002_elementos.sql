-- Elementos do Parque (Sala, Monólito, Portão, Fonte, Centro de Trabalho, Centro de Estudos, Oficinas):
-- uma lista de { id, descricao, atualizadoEm, por }. Todos leem; Editor e Administrador escrevem.
insert into public.colecoes(nome, funcao_escrita, nivel_leitura, nivel_escrita, sensivel) values
  ('elementos', null, 'leitor', 'editor', false)
on conflict (nome) do nothing;

-- Lojinha do Parque: nova responsabilidade 'lojinha' e as coleções de produtos e vendas.
-- Os produtos publicados aparecem na página pública (leitura por todos os níveis); as vendas são sensíveis.
-- Cada venda também é lançada em 'contas' (origem Lojinha), que alimenta a planilha consolidada em "Ajude o Parque".
alter table public.perfis drop constraint if exists perfis_funcoes_check;
alter table public.perfis add constraint perfis_funcoes_check
  check (funcoes <@ array['reservas','estela','album','inventario','documentos','comunicacao','lojinha']);
insert into public.colecoes(nome, funcao_escrita, nivel_leitura, nivel_escrita, sensivel) values
  ('loja_itens',  'lojinha', 'leitor', 'administrador', false),
  ('loja_vendas', 'lojinha', 'leitor', 'administrador', true)
on conflict (nome) do nothing;
