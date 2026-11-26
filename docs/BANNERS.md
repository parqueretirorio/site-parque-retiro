# Banners do site (Comunicação e Redes Sociais > Site)

Onde: área restrita → **Comunicação e Redes Sociais** → sub-aba **Site** (acesso: administrador e Responsável pela Comunicação).

Cada página do site (37 espaços, agrupados) tem um cartão com o nome, o arquivo e a **medida exata em pixels**:
- Todas as páginas, inclusive Início, Quem somos e O Parque — Sobre o Parque: **1920 × 640 px** (proporção 3:1; largura máxima de exibição do site, a resolução de monitor mais comum, Full HD). Histórico: até 25/11 essas três usavam 2172 × 724; em 26/11 passaram para 1600 × 533 e, no mesmo dia, todas para 1920 × 640. Banners antigos de 1600 × 533 têm a mesma proporção e continuam válidos (ampliados, com aviso de pouca nitidez no painel).
- **Imagem para celular (opcional, por imagem):** **1200 × 900 px (4:3)**, usada em telas de até 700 px de largura (`PR_BANNERS.MOBILE`). Sem ela, o celular usa a imagem do computador. Em carrossel, o formato 4:3 só vale no celular se **todas** as imagens tiveram a versão celular; do contrário, o celular mostra o formato 3:1. No pacote publicado: `banners/<página>-<n>-m.jpg`, e o campo `mobile` em `banners.json`. Dica de arte: texto grande e rostos dentro dos 1600 px centrais (computador) e dentro de 90% (celular).
- Formatos: JPG, PNG ou WebP, até 15 MB. A imagem precisa ter a **proporção** do espaço; o sistema recusa outra proporção (explicando a medida certa) e converte imagens de mesma proporção para a medida exata.

Cada espaço pode ser **Fixo** (1 imagem) ou **Carrossel** (até 8 imagens, troca automática de 2 a 30 s, setas, pontos, arrastar no celular; pausa ao passar o mouse/focar; sem troca automática para quem pediu menos movimento no aparelho). Cada imagem tem descrição (acessibilidade), link opcional, ordem e "exibir".

Se nada for configurado em uma página, ela continua com o banner/título que já tinha.

## Como publicar (enquanto não há servidor)
1. Configure os banners → **Baixar pacote para publicar (.zip)**.
2. Descompacte e copie a pasta `banners` para a pasta do site na hospedagem, ao lado de `index.html`.
3. Para voltar aos banners originais, remova a pasta `banners`.

O que é configurado na tela é um **rascunho**: aparece só neste navegador (para quem está logado ou abriu a aba Site nas últimas 8 h), com a etiqueta "Pré-visualização". O público só vê o que estiver na pasta `banners` publicada.

## Limites conhecidos
- Espaço do navegador (~5 MB): comporta algumas dezenas de imagens; a tela mostra o uso. Com o servidor (fase 2) as imagens vão para o armazenamento próprio e o passo manual de publicar deixa de existir.
- Os banners atuais (arquivos `banner-*.jpg`) não são apagados nem alterados.

> **Planejamento junto com as publicações:** o painel em *Publicações > Painel por canal e formato* (ver `docs/PAINEL_COMUNICACAO.md`) mostra todos os banners configurados, liga cada banner a uma ação de comunicação e abre esta tela direto na página escolhida. A configuração das imagens continua aqui, em *Site*.
