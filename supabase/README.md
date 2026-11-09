# Supabase — Fase 2

Conteúdo: `migrations/0001_base.sql` (esquema, permissões e auditoria). Testado em PostgreSQL 16 local (executar duas vezes, cenários de permissão em `tests/teste_permissoes_banco.sql`); **ainda não aplicado a um projeto Supabase real**.

Regras: migrações novas só adicionam (arquivos `0002_...`); nunca editar a que já rodou em produção; nunca `drop`/`truncate`. Use um projeto separado para homologação, com dados fictícios.

Próximos passos (ver docs/PLANO.md): (1) criar projeto homologação; (2) aplicar a migração; (3) trocar `dados.js` por um adaptador que lê/grava em `registros` via Supabase JS e usa Supabase Auth no `login()`; (4) bucket `anexos` privado; (5) migrar dados do navegador pela aba Backup (o JSON tem o mesmo formato por coleção).
