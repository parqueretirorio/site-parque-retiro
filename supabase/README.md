# Supabase

Conteúdo: `migrations/0001`–`0010` (esquema, permissões, auditoria e, na 0010, login e coleções da Fase 1 — veja docs/FASE1_SUPABASE.md). Aplicadas ao projeto parque-retiro (São Paulo): 0001–0009 em 09/11/2026; a 0010 a partir de 10/11/2026.

Regras: migrações novas só adicionam (arquivos `0002_...`); nunca editar a que já rodou em produção; nunca `drop`/`truncate`. Use um projeto separado para homologação, com dados fictícios.

Próximos passos (ver docs/PLANO.md): (1) criar projeto homologação; (2) aplicar a migração; (3) trocar `dados.js` por um adaptador que lê/grava em `registros` via Supabase JS e usa Supabase Auth no `login()`; (4) bucket `anexos` privado; (5) migrar dados do navegador pela aba Backup (o JSON tem o mesmo formato por coleção).
