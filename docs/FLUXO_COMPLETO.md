# Do encaminhamento da ata à publicação: o fluxo completo

```
Ata da Escola ──► Atividade no calendário ──► Ação de comunicação ──► Materiais ──► Fila de publicação ──► Publicada ──► Relatório
 (encaminhamentos)   (semanal ... anual)        (canais + formatos       (pasta +        (copiar texto,        (link +        (planejado ×
                                                 + banners do site)       checklist)      Agendada, .ics)       quem/quando)   publicado)
```

## 1. Ata → encaminhamentos (Documentos e Calendários > Atas das Reuniões de Escola)
Ao cadastrar ou editar uma ata, a seção **Encaminhamentos da ata** registra o que ficou combinado: texto, responsável, prazo, situação (Em aberto / Feito / Cancelado) e o tipo de atividade.
Marcando **Levar para o calendário** (precisa de data), o encaminhamento vira uma **atividade** que aparece nos calendários semanal, mensal, trimestral, semestral e anual. Alterar texto, data ou tipo na ata atualiza a atividade (sem duplicar). Remover o encaminhamento **não** apaga a atividade.
Quem cuida só da Comunicação **não precisa ter acesso às atas**: ela vê apenas a atividade (título, data, tipo), nunca o conteúdo da ata.
No topo da lista de atas há o contador de encaminhamentos em aberto e o filtro "só atas com encaminhamentos em aberto". Encaminhamentos com prazo vencido aparecem como "Em atraso".

## 2. Atividade → ação de comunicação (Comunicação > Publicações > Painel)
O painel lista **"Próximas atividades sem comunicação planejada"** (45 dias à frente, inclui as vindas das atas e as datas fixas anuais). **Planejar** abre a ação já preenchida (título, evento, data sugerida 7 dias antes). Veja o passo a passo em `docs/PAINEL_COMUNICACAO.md`.

## 3. Materiais
Cada ação tem a **pasta dos materiais** (link do Drive) e um **checklist** (briefing, texto aprovado, arte pronta, autorização de imagem). O painel mostra "n/4" por ação. Ao aprovar, agendar ou publicar com o checklist incompleto, o sistema **avisa** (não bloqueia). A **medida de referência** de cada formato aparece ao escolhê-lo; para banners do site vale a medida exata da página.

## 4. Fila de publicação (Publicações > Fila de publicação)
Mostra o que ainda não foi publicado, em blocos: **Atrasadas, Hoje, Próximos 7 dias, Em até 30 dias**. Cada cartão traz o texto (botão **Copiar texto**), a mídia, a pasta, a medida e o checklist. A sub-aba Publicações exibe um número vermelho com o que está atrasado ou para hoje.
- **Agendada** = já programada na ferramenta da própria rede (ex.: Meta Business Suite para Instagram/Facebook). Confirme o que cada rede oferece antes de depender disso (WhatsApp, em especial).
- **Marcar como publicada** pede o link da postagem e registra quem publicou e quando.
- **Baixar agenda (.ics)**: gera um arquivo para importar no Google Agenda/Apple/Outlook, com lembrete às 9h de cada dia de publicação.
O sistema **organiza e lembra; não publica sozinho** nas redes.

## 5. Fechamento (Relatórios Consolidados)
- **Comunicação e Redes Sociais > Publicações: planejado × publicado**: situação (publicada / no prazo / em atraso), publicadas sem link, materiais; agrupe por Canal, Formato, Projeto ou Situação para obter os totais.
- **Comunicação e Redes Sociais > Ações de comunicação e materiais**: canais e formatos de cada ação, checklist e pasta.
- **Atas e encaminhamentos > Encaminhamentos das atas**: o que foi decidido, quem responde, prazo, situação e se está no calendário.
Todos permitem filtro por período, impressão e CSV.

## Quem faz o quê
| Função (Gestão de Responsáveis) | Faz |
|---|---|
| Documentos e Calendários | Atas, encaminhamentos, atividades e calendários |
| Comunicação | Painel, fila de publicação, banners do site, relatórios de comunicação |
| Administrador | Tudo, mais Backup e Segurança |

## Testes
`python3 tests/teste_fluxo_ata_ate_publicacao.py` e `python3 tests/teste_painel_comunicacao.py` (a partir da pasta do site).
