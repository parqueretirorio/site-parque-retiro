# Sistema de Ajuda e Central de Ajuda

Três recursos integrados, em todas as páginas (área pública, login e área restrita), usando **uma única base de conhecimento**:

| Nível | No computador | No celular / tablet |
|---|---|---|
| **A. Dica rápida** | Parar o mouse sobre botão, campo, menu ou ícone (≈0,5 s). Pelo teclado: chegar com Tab. | Toque longo em botões e ícones; símbolo **(i)** ao lado dos campos que têm explicação escrita. |
| **B. Orientação ampliada** | "Saiba mais" na dica, ou **F1** no item em foco: abre o artigo num painel lateral, sem sair da tela. | A explicação abre numa folha que sobe da parte de baixo (bottom sheet); "Saiba mais" abre o artigo em tela cheia. |
| **C. Central de Ajuda** | Botão **? Ajuda** no cabeçalho (ao lado de Entrar) e a página `ajuda.html`. | Botão **?** flutuante no canto inferior esquerdo (o WhatsApp fica no direito). |

Extra: **Modo ajuda** (no painel ? Ajuda). Com ele ligado, clicar/tocar em qualquer item mostra a explicação **e não executa a ação**; os itens com explicação ficam contornados. Esc ou "Sair do modo ajuda" desligam. Também: `?ajuda=<id-do-artigo>` em qualquer página abre o painel direto no artigo (útil em mensagens de WhatsApp).

Acessibilidade: dica ligada ao campo por `aria-describedby` (padrão de tooltip WAI-ARIA), `aria-description` em cada item com explicação, F1/?/Esc, foco preso na folha e no painel quando modais, contraste do tema do site, sem animação para quem pediu menos movimento. A dica some ao rolar, ao clicar fora ou com Esc e pode ser desligada ("Mostrar dicas ao passar o mouse").

## Arquivos

| Arquivo | O que é |
|---|---|
| `ajuda-conteudo.js` | **Base de conhecimento** (conteúdo, não código): 11 categorias, 70 artigos, 612 explicações rápidas, 98 contextos. Gerado de novo pela área restrita em *Publicar*. |
| `ajuda.js` | Motor: chaves, dicas, cartão/folha, painel, modo ajuda, teclado, página da Central. Carregado em todas as páginas. |
| `ajuda.css` | Visual da ajuda (carregado sozinho por `ajuda.js`; usa as cores de `style.css`). |
| `ajuda-admin.js` | Ferramenta **Administração › Central de Ajuda**. |
| `ajuda.html` | Central de Ajuda pública: busca, filtro (visitantes/equipe), categorias, artigo com trilha e "Nesta categoria". |
| `ajuda/img/*.jpg` | 44 capturas da interface atual com os itens destacados (moldura vermelha numerada). |
| `ajuda/conteudo.json` | A mesma base em JSON para o aplicativo (`node tools/exportar_ajuda.js`). |
| `tools/gerar_capturas_ajuda.py` | Refaz as capturas quando a interface mudar. |
| `tests/teste_central_ajuda.py` | 38 verificações; grava `tests/cobertura_ajuda.json`. |
| `supabase/migrations/0008_central_ajuda.sql` | Função `ajuda` e coleções `ajuda_*` para o servidor (não aplicada a projeto real). |

## Como cada item encontra a sua explicação (chaves)

Cada elemento recebe uma **chave estável**, calculada a partir do contexto e do próprio elemento — sem precisar alterar os módulos:

- Contexto: `p.<página>` (área pública, ex. `p.como-fazer`) ou `r.<ferramenta>` (área restrita, ex. `r.inventario`).
- Elemento: `<contexto>.<id>` (ex. `r.inventario.f-n`), `<contexto>.<atributo-data>.<valor>` (ex. `r.reservas.s.ped` = sub-aba Pedidos), `<contexto>.v.<valor>` (caixas de marcar), `<contexto>.t.<texto>` (último recurso).
- Globais: `global.*` (Entrar, WhatsApp, idioma, redes), `menu.<página>`, `aba.<ferramenta>` (botões do painel), `painel.*`.
- Um elemento pode fixar a chave com `data-ajuda="..."`.

Se a chave tem **explicação escrita**, ela é usada. Senão o sistema monta uma **explicação automática fiel ao elemento** (rótulo, obrigatório, tipo do campo, exemplo do placeholder, limite de caracteres; ou a ação do botão: excluir → Lixeira, imprimir → PDF, CSV → planilha etc.). "Saiba mais" leva ao artigo da sub-aba aberta, da ferramenta ou da página (`contextos`).

Cobertura atual da área restrita (todas as ferramentas e sub-abas, conta de administrador): **399 itens com explicação escrita, 151 com explicação automática, 0 sem explicação** (`tests/cobertura_ajuda.json`). Na área pública todos os formulários, menus e botões têm texto escrito; links simples dentro dos textos não recebem dica (são autoexplicativos).

## Administração do conteúdo (sem mexer no código)

Área restrita › **Administração › Central de Ajuda** (administrador ou *Responsável pela Central de Ajuda*, nova responsabilidade em Gestão de Responsáveis):

- **Artigos:** criar, editar (título, categoria, público, situação, resumo, palavras-chave, onde fica, o que é, para que serve, passo a passo, exemplos, cuidados, imagens com legenda e descrição, conteúdos relacionados), retirar do ar (rascunho), voltar ao publicado, excluir.
- **Categorias:** nome, ícone, descrição, ordem.
- **Explicações rápidas:** busca e edição de todas as dicas. Mais fácil: ligar o modo ajuda, clicar no item e usar **Editar esta explicação** (mostra a chave).
- **Cobertura:** itens vistos que ainda usam texto automático, com "Escrever explicação".
- **Publicar:** baixar `ajuda-conteudo.js` (substituir na hospedagem), baixar `conteudo.json` (aplicativo), exportar/importar edições entre computadores, limpar edições já publicadas.

As edições ficam nas coleções `ajuda_artigos`, `ajuda_categorias`, `ajuda_dicas` (entram no backup e na auditoria) e valem na hora neste navegador, inclusive na `ajuda.html`. Para valerem para todos, enquanto não houver servidor: **Publicar** e substituir o arquivo (mesmo procedimento dos banners).

## Aplicativo

O app deve ler `ajuda/conteudo.json` (ou o mesmo conteúdo do servidor, quando houver) e só trocar a apresentação:
artigos e categorias são independentes da interface; as explicações são `{id, titulo, texto, artigo}`. Recomendação: as telas do app usam **as mesmas chaves** das telas equivalentes do site (ex. tela de cadastro do inventário → `r.inventario.f-n`), assim a mesma explicação aparece nos dois. Padrão de interação sugerido no app: ícone (i) ao lado dos campos, toque longo em botões, folha inferior e "Saiba mais" em tela cheia — o mesmo já usado no celular. Imagens: caminho relativo à raiz do site. Marcação: `**negrito**` e `[[id|texto]]`.

## O que ainda falta / limites

- **Sem servidor**, edições feitas num computador não aparecem nos outros até publicar o arquivo (ou exportar/importar edições).
- **Idiomas:** a ajuda está só em português (a estrutura permite acrescentar traduções por artigo depois).
- **151 itens** da área restrita usam explicação automática (filtros de lista, datas, observações): corretos, mas genéricos. Use a aba Cobertura para priorizar.
- Telas que só aparecem com dados (ex.: ficha de um item do inventário, editor de uma publicação, conferência de comprovantes) usam explicações automáticas até alguém abrir e escrever as delas.
- **Calendário de uso público** continua sendo editado no arquivo `calendario.html` (lista RESERVAS); não é alimentado pela ferramenta Reservas.
- As capturas de tela precisam ser refeitas quando uma tela mudar (`python3 tools/gerar_capturas_ajuda.py`).
