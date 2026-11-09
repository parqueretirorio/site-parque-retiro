# Passagem de bastão (quem assume a comunicação e os documentos)

## Situação atual: os dados moram no navegador
Hoje todos os dados do site (atas, calendários, ações, publicações, banners, usuários) ficam no `localStorage` do navegador de quem usa. **Outra pessoa, em outro computador, não vê nada disso.** Isso só muda quando o servidor (Supabase, Fase 2) for ligado: ver `docs/PLANO.md` e `supabase/README.md`. A migração e o esquema estão prontos e testados em PostgreSQL local, mas **não foram aplicados a um projeto Supabase real** (isso exige a conta da instituição).

## Como passar o bastão HOJE (sem servidor)
1. Quem sai: área restrita → **Backup e Segurança** → baixar o backup completo (JSON) e guardar em local seguro da instituição (e uma cópia em outro lugar).
2. Quem entra: cadastrar-se no site, ser aprovado em **Gestão de Responsáveis** (função *Comunicação* e/ou *Documentos e Calendários*), e **restaurar o backup** na aba Backup e Segurança (o sistema confere a integridade e pede o backup do estado atual antes de substituir).
3. Combinar uma regra: **uma única pessoa/computador edita por vez** e baixa um backup novo ao terminar o dia de trabalho. Sem servidor, dois computadores editando ao mesmo tempo geram versões diferentes.
4. Materiais pesados (artes, vídeos) ficam em **pastas do Drive da instituição**, uma por ação; o site guarda só o link.
5. Banners do site: depois de configurar, baixar o pacote e publicar na hospedagem (ver `docs/BANNERS.md`).

## O que falta para a passagem de bastão ser de verdade
- Ligar o Supabase (login real, dados compartilhados, backups, arquivos). Pré-requisitos: projeto de homologação, a chave pública (anon) do projeto, decisão sobre plano pago (backups gerenciados). O adaptador que troca `dados.js` pelo Supabase é o próximo passo descrito em `supabase/README.md`.


## Atualização 12/10/2026
Hospedagem identificada: GreenGeeks (cPanel, PHP+MySQL): caminho recomendado é o servidor próprio em PHP, sem custo extra (`docs/HOSPEDAGEM.md`). A camada de dados já é independente do provedor (`config-dados.js`, `adaptador-remoto.js`, `docs/API_CONTRATO.md`). Enquanto `modo` for `'local'`, o procedimento acima continua valendo.


## Atualização 02/11/2026 — Central de Ajuda
Quem assume qualquer função encontra as orientações dentro da própria plataforma: botão **? Ajuda** em todas as telas, dicas ao passar o mouse (ou toque longo no celular), modo ajuda e a página `ajuda.html`. Para manter a ajuda atualizada: área restrita → **Administração › Central de Ajuda** (ver `docs/CENTRAL_AJUDA.md`).
