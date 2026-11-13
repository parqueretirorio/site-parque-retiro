# Supabase

Conteúdo: `migrations/0001`–`0011` (esquema, permissões, auditoria; na 0010, login e coleções da Fase 1 — veja docs/FASE1_SUPABASE.md; na 0011, as páginas abertas do site: vitrines `pub_*` só de leitura e a caixa de entrada `envios_publicos`). Aplicadas ao projeto parque-retiro (São Paulo): 0001–0009 em 09/11/2026; a 0010 a partir de 10/11/2026; a 0011 em 13/11/2026.

Função de servidor `functions/enviar-email` (envio do E-mail marketing pelo Gmail do Parque): instalada em 12/11/2026, segredos GMAIL_USER e GMAIL_APP_PASSWORD em 13/11/2026, Verify JWT desligado.

Regras: migrações novas só adicionam (arquivos `0002_...`); nunca editar a que já rodou em produção; nunca `drop`/`truncate`. Use um projeto separado para homologação, com dados fictícios.

Próximos passos (ver docs/PLANO.md): (1) criar projeto homologação; (2) aplicar a migração; (3) trocar `dados.js` por um adaptador que lê/grava em `registros` via Supabase JS e usa Supabase Auth no `login()`; (4) bucket `anexos` privado; (5) migrar dados do navegador pela aba Backup (o JSON tem o mesmo formato por coleção).


## 0012_album_storage.sql — Álbum de fotos no Storage (envio em lote)
- Cria o bucket público **album** (fotos JPEG/PNG/WEBP até 5 MB cada) e as regras: ler é público; enviar, trocar e apagar só o administrador ou quem tem a função "album".
- Função `pr_album_uso()` mostra quantos arquivos e quanto espaço o Álbum ocupa.
- A área restrita (Álbum Parque Retiro › **Enviar em lote**) reduz cada foto no navegador (1600 px + miniatura de 480 px) e envia até 1000 por lote, 3 por vez.
- Rodar uma vez no SQL Editor. Resultado esperado: `ok`. **Aplicada em 13/11/2026 (resultado "ok").**
