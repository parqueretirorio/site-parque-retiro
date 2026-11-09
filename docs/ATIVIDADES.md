# Atividades (antigo "Eventos"), Comissões e Voluntário

## Área aberta
- **O Parque > Atividades** (`atividades.html`). O menu flutuante tem: *Eventos*, *Encontros*, *Retiros* e *Reuniões* (`atividades.html?cat=evento|encontro|retiro|reuniao`) e *Álbum de fotos* (`fotos.html`).
  A lista mostra foto pequena, título, tipo, data, lide e **"Clique aqui e leia mais"**.
- **Artigo** (`atividade.html?id=...`): título, lide, foto, texto, **autor no final** e a lista "Outras atividades" (clicáveis).
- **Atividade externa**: no cadastro, "Onde acontece" = *Externa, com relação ao Parque Retiro*; aparece com o selo "Atividade externa", organizador e link opcional.
- O endereço antigo `eventos.html` apenas redireciona para `atividades.html`.
- **Banner do Início**: atividade publicada e marcada "Destacar no banner do Início" (com imagem de banner) entra no carrossel do Início e o clique leva ao artigo. Máximo de 5 atividades no carrossel; a imagem atual do Início continua como primeiro slide.

## Área restrita > Comissões Parque Retiro > Atividades
Cadastro com título, tipo, onde acontece, data, local, lide, texto, foto pequena, autor, banner e situação (rascunho/publicada). Quem edita: **Responsável pelas Atividades** (função `atividades`, concedida em *Gestão de Responsáveis*) ou administrador; os demais só consultam.
Dados: coleção `atividades`; migração `supabase/migrations/0006_atividades.sql` (não aplicada a projeto real). Imagens ficam dentro do registro, como no Álbum: use fotos leves.

## Comissões (Ajude o Parque)
- `comissoes.html` (lista), `comissao-jardinagem.html`, `comissao-comunicacao.html`. Cada comissão tem o botão "Quero ser voluntário(a)" que abre `voluntario.html?area=jardinagem|comunicacao#voluntario-form` já com a área marcada. A página *Voluntário* continua sendo o caminho geral.
- Nova forma de colaborar no formulário: **Comunicação, redes sociais e site**.
- Na **área restrita**, *Jardinagem / Área Externa* e *Comunicação, Redes Sociais e Site* ficam diretamente em **Comissões Parque Retiro** (não dentro de Voluntário).

## Multiuso
- **Área aberta:** `comissao-multiuso.html` (Ajude o Parque > Comissões > Multiuso), com o botão "Quero ser voluntário(a)" (`voluntario.html?area=multiuso#voluntario-form`); a área "Multiuso" também é opção no formulário de voluntário.
- **Área restrita:** Comissões Parque Retiro > **Multiuso** (`multiuso.js`), com 4 abas: *Agenda de uso* (data, horário, atividade, quem usa, responsável, situação), *Planejamentos* (situação, responsável, voluntários, materiais; CSV), *Regras e informações* e *Documentos* (link e/ou arquivo até 1 MB). Quem edita: **Responsável pelo Multiuso** (função `multiuso`) ou administrador.
- Dados: `multiuso_agenda`, `multiuso_planos`, `multiuso_info`, `multiuso_docs`. Migração: `supabase/migrations/0007_multiuso.sql` (não aplicada a projeto real).


## Atualização 03/11/2026: calendário e campanha
Todas as atividades cadastradas aqui entram nos calendários da área restrita e na Comunicação. A **Campanha Punta de Vacas** (início e fim) também vira atividade no calendário: ver `docs/CAMPANHA_PUNTA_DE_VACAS.md`.
