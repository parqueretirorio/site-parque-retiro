# Painel de Comunicação (Comunicação e Redes Sociais > Publicações)

Para quem assumir as campanhas e publicações: **tudo se decide em um só lugar**.

Onde: área restrita → **Comunicação e Redes Sociais** → sub-aba **Publicações** → botão **Painel por canal e formato** (a **Lista de publicações** de antes está ao lado, igual).
Acesso: administrador e Responsável pela Comunicação (o mesmo de antes).

## Como usar (3 passos)
1. **Nova ação de comunicação**: dê um título (ex.: "Celebração dos 15 anos - convite"), a data prevista, o projeto/campanha e, se quiser, o texto base e o link da imagem/vídeo.
2. **Marque os canais e escolha o formato de cada um**: Instagram, Facebook, YouTube, WhatsApp Canal, WhatsApp Comunidade, WhatsApp Grupo (e outros que forem cadastrados). Cada canal só oferece os formatos que fazem sentido para ele (Instagram: post, carrossel, reels, stories; Comunidade: aviso, enquete/convite...). Defina também o **status** (Ideia → Publicada) e, depois de postar, o **link da postagem**.
3. **Banners do site**: em "Banners do site" da mesma tela, acrescente a página do site que vai receber o banner e o formato (fixo ou carrossel). O botão **Configurar imagem** abre a tela *Site* já naquela página (medida exata, upload, pacote para publicar).

Cada canal marcado vira uma publicação normal: aparece na **Lista**, no **Calendário de Comunicação** e nos filtros, com a cor da rede. Quem preferir continuar usando só a Lista e o formulário antigo pode: nada foi removido.

## O que o painel mostra
- Tabela **ações × canais**: em cada célula, o formato escolhido e o status. A última coluna mostra os banners do site da ação.
- **Banners do site**: cada página com banner configurado (ou planejado), a situação atual (fixo/carrossel, nº de imagens), a data da última alteração e as ações ligadas.
- **Configurar quais formatos cada canal oferece**: marque/desmarque os formatos de cada canal. Novos formatos entram em *Tipos de publicação*; novos canais, em *Redes sociais*.

## O que foi acrescentado (e o que não mudou)
- Canais novos, criados automaticamente na primeira abertura, **sem tocar nos existentes**: *WhatsApp / Comunidade*, *WhatsApp / Grupo* e *Site (banners)*. "WhatsApp / Canal" continua como estava.
- Formatos novos: Aviso na Comunidade, Mensagem em grupo, Enquete / convite, Banner do site - fixo, Banner do site - carrossel.
- Na **Lista**: filtro por **Formato**, a página do site aparece nas publicações de banner e, nas publicações que vêm do painel, há um botão para abrir a ação no painel.
- **Publicações anteriores** ficam como estão. Se quiser vê-las no painel, use **Organizar no painel**: elas só passam a ficar agrupadas em ações (por evento ou tema); nada é alterado nem apagado.
- Ao salvar uma ação, o texto base, o título e o link de mídia só substituem os de um canal se ele ainda não tiver um texto próprio (ou se for igual ao anterior). Ajustes feitos canal a canal na Lista não são sobrescritos.
- Desmarcar um canal e salvar remove **apenas** a publicação daquele canal (com confirmação; ela vai para a lixeira do sistema).

## Dados (no navegador, como o resto do módulo)
`pr_com_acoes` (ações), `pr_com_formatos` (formatos por canal), `pr_com_painel` (marca da atualização), além de `pr_com_posts`, `pr_com_redes`, `pr_com_tipos` (já existentes; as publicações do painel ganham `acao` e, no caso do site, `bannerSlug`). Todas entram no **backup** da aba Backup e Segurança.

## Limites conhecidos
- O painel **planeja e acompanha**; ele não publica sozinho nas redes sociais (isso exigiria as contas/APIs de cada rede).
- O banner do site continua sendo um **rascunho neste navegador** até baixar o pacote e copiá-lo para a hospedagem (ver `docs/BANNERS.md`). O painel mostra o estado do rascunho, não o do site público.
- Uma ação tem no máximo uma publicação por canal; para duas postagens no mesmo canal (ex.: dois posts no Instagram), crie duas ações ou use a Lista.

## Testes
`python3 tests/teste_painel_comunicacao.py` (a partir da pasta do site; precisa de Python + Playwright). Cobre: criação de ação com 5 canais + banner, formatos por canal, validações, edição, remoção de um canal, lista/filtro/calendário, atalho para o banner, organização de publicações antigas, backup e ausência de erros de JavaScript.

## Atualização: materiais, fila de publicação e relatórios
- **Materiais** (no editor da ação): pasta do Drive, checklist de 4 itens e observações; medida de referência ao escolher cada formato.
- **Status Agendada** (entre Aprovada e Publicada): para publicações já programadas na ferramenta da própria rede.
- **Fila de publicação**: terceira visão ao lado do Painel e da Lista (texto para copiar, mídia, pasta, marcar como publicada com link, agenda .ics).
- **Próximas atividades sem comunicação planejada**: no topo do Painel; inclui as atividades que nasceram dos encaminhamentos das atas.
- **Relatórios**: módulos *Comunicação e Redes Sociais* e *Atas e encaminhamentos* em Relatórios Consolidados.
Veja o fluxo inteiro em `docs/FLUXO_COMPLETO.md` e a passagem de bastão em `docs/PASSAGEM_DE_BASTAO.md`.
