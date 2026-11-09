-- Central de Ajuda: nova responsabilidade 'ajuda' e as coleções de edições da ajuda (artigos, categorias e explicações rápidas).
-- Leitura: qualquer usuário logado (a ajuda não tem dado pessoal). Escrita: administrador ou função 'ajuda'.
-- A lista de funções abaixo é a lista completa usada pela área restrita (area.js, constante FUNC): inclui também
-- 'financeiro', 'compras' e 'solicitante', que faltavam nas migrações anteriores.
alter table public.perfis drop constraint if exists perfis_funcoes_check;
alter table public.perfis add constraint perfis_funcoes_check
  check (funcoes <@ array['reservas','estela','album','inventario','financeiro','compras','solicitante','documentos','comunicacao','lojinha','rifa','vaquinha','voluntario','jardinagem','atividades','multiuso','ajuda']);
insert into public.colecoes(nome, funcao_escrita, nivel_leitura, nivel_escrita, sensivel) values
  ('ajuda_artigos',    'ajuda', 'leitor', 'administrador', false),
  ('ajuda_categorias', 'ajuda', 'leitor', 'administrador', false),
  ('ajuda_dicas',      'ajuda', 'leitor', 'administrador', false)
on conflict (nome) do nothing;
-- Observação: com o servidor ligado, as páginas públicas também precisam LER estas coleções sem login
-- (mesma pendência de leitura pública da Lojinha, Rifa e Álbum). Até lá, o público usa o arquivo publicado ajuda-conteudo.js.
