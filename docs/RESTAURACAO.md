# Como restaurar os dados

## Hoje (dados no navegador) — testado
1. Entre como administrador → aba **Backup e Segurança**.
2. Clique **Baixar backup completo** (o sistema exige isso antes de restaurar, para você poder voltar atrás).
3. Escolha o arquivo `.json` do backup a restaurar. O sistema confere a integridade (SHA-256) e mostra, coleção por coleção, quantos registros há agora e quantos há no backup.
4. Clique **Restaurar este backup** e confirme. Se algo falhar no meio, o estado anterior é recolocado automaticamente.
5. Itens apagados por engano nas últimas operações: aba Backup → **Baixar lixeira**.

Rotina sugerida: backup toda sexta-feira, guardado fora do computador (e-mail/nuvem). A aba avisa quando passa de 7 dias.

## Fase 2 (servidor) — procedimento a ser testado em homologação
1. Criar projeto Supabase vazio. 2. `psql "$DB_URL" -f supabase/migrations/0001_base.sql`. 3. `pg_restore`/`psql` do dump mais recente. 4. Copiar o bucket de arquivos do backup. 5. Conferir contagens por coleção e abrir 3 registros com foto. Registrar a data do simulado.
