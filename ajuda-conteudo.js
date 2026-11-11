// Base de conhecimento da ajuda do Parque Retiro (Central de Ajuda, dicas e "Saiba mais").
// ARQUIVO DE CONTEÚDO, não de código: pode ser gerado de novo pela área restrita (Administração > Central de Ajuda > Publicar)
// e substituído na hospedagem. A mesma base vai para o aplicativo em ajuda/conteudo.json (node tools/exportar_ajuda.js).
// Estrutura: categorias[], artigos[] (secoes: oQueE, finalidade, passos, exemplos, cuidados), dicas { chave: [titulo, texto, artigo] }
// e contextos { "p.pagina" | "r.aba" | "r.aba.sub.valor": artigo }. Chaves explicadas em docs/CENTRAL_AJUDA.md.
window.PR_AJUDA_CONTEUDO = {
 "formato": "parque-retiro-ajuda",
 "versao": "1.0.0",
 "atualizadoEm": "2026-11-02",
 "categorias": [
  {
   "id": "comecar",
   "ordem": 1,
   "nome": "Conhecendo a plataforma",
   "icone": "fa-compass",
   "descricao": "O que é o site, a área restrita (CONecta Retiro) e como usar a ajuda."
  },
  {
   "id": "navegacao",
   "ordem": 2,
   "nome": "Navegação pelo site",
   "icone": "fa-sitemap",
   "descricao": "Como encontrar cada assunto na área pública do site."
  },
  {
   "id": "participar",
   "ordem": 3,
   "nome": "Participar e ajudar o Parque",
   "icone": "fa-hands-helping",
   "descricao": "Reservas, fotos, voluntariado, doações, compras, rifa, vaquinha e Comunicado por e-mail."
  },
  {
   "id": "acesso",
   "ordem": 4,
   "nome": "Acesso, contas e permissões",
   "icone": "fa-user-lock",
   "descricao": "Criar conta, entrar, níveis de acesso e responsabilidades."
  },
  {
   "id": "conecta",
   "ordem": 5,
   "nome": "Área restrita: CONecta Retiro",
   "icone": "fa-th-large",
   "descricao": "O painel, as áreas e o uso de formulários, listas e relatórios."
  },
  {
   "id": "comissoes",
   "ordem": 6,
   "nome": "Ferramentas das comissões",
   "icone": "fa-users",
   "descricao": "Biblioteca, reservas, Estela, Álbum, calendários, atividades, Multiuso, Jardinagem, Lojinha, Rifa, Vaquinha e Voluntários."
  },
  {
   "id": "comunicacao",
   "ordem": 7,
   "nome": "Comunicação, redes sociais e site",
   "icone": "fa-bullhorn",
   "descricao": "Planejamento de publicações, banners do site, equipe e listas de e-mail."
  },
  {
   "id": "admin",
   "ordem": 8,
   "nome": "Administração e finanças",
   "icone": "fa-user-shield",
   "descricao": "Prestação de contas, compras, inventário, patrimônio, contas digitais, documentos e relatórios."
  },
  {
   "id": "dados",
   "ordem": 9,
   "nome": "Dados, backup e atualização",
   "icone": "fa-database",
   "descricao": "Onde os dados ficam, backup, lixeira e como o conteúdo do site é atualizado."
  },
  {
   "id": "ajuda-admin",
   "ordem": 10,
   "nome": "Gerenciando a Central de Ajuda",
   "icone": "fa-question-circle",
   "descricao": "Como escrever, organizar e publicar as orientações da plataforma."
  },
  {
   "id": "problemas",
   "ordem": 11,
   "nome": "Solução de problemas",
   "icone": "fa-life-ring",
   "descricao": "Respostas rápidas para as dificuldades mais comuns."
  }
 ],
 "artigos": [
  {
   "id": "o-que-e-a-plataforma",
   "categoria": "comecar",
   "ordem": 1,
   "titulo": "Conhecendo a plataforma do Parque Retiro",
   "resumo": "O site tem uma área aberta a todos e uma área restrita, o CONecta Retiro, onde as comissões organizam o trabalho do Parque.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "site",
    "plataforma",
    "conecta",
    "área restrita",
    "começar",
    "visão geral"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "A plataforma do Parque de Estudo e Reflexão Retiro reúne duas partes. A **área pública** (o site) apresenta o Parque, as atividades, o Centro de Estudo, as formas de ajudar e os formulários de reserva, voluntariado e envio de fotos. A **área restrita**, chamada **CONecta Retiro**, é usada por quem cuida do Parque: biblioteca, reservas, calendários, comunicação, finanças, inventário e as ferramentas de cada comissão.",
    "finalidade": "Concentrar em um só lugar as informações para visitantes e o trabalho voluntário das comissões, com orientações dentro da própria plataforma para que qualquer pessoa aprenda a usá-la com autonomia.",
    "passos": [
     "Use o **menu do topo** para navegar pela área pública (veja [[menu-do-site|O menu do site]]).",
     "Para trabalhar na área restrita, clique em **Entrar** no canto superior direito e faça o login (veja [[criar-conta-e-entrar|Criar conta e entrar]]).",
     "Dentro do CONecta Retiro, escolha a área (**Comissões Parque Retiro** ou **Administração**) e depois a ferramenta (veja [[painel-conecta|O painel CONecta Retiro]]).",
     "Em qualquer tela, o botão **? Ajuda** abre as orientações daquela tela."
    ],
    "exemplos": [
     "Um visitante consulta o Calendário de uso e pede uma reserva do Centro de Estudo.",
     "A Responsável pela Biblioteca registra o empréstimo de um livro na área restrita."
    ],
    "cuidados": [
     "Os dados da área restrita ficam no servidor do Parque: o que uma pessoa salva aparece para a equipe em qualquer computador ou celular, inclusive no app CONecta Retiro. Leia [[onde-ficam-os-dados|Onde ficam os dados]]."
    ]
   },
   "imagens": [],
   "relacionados": [
    "como-usar-a-ajuda",
    "menu-do-site",
    "painel-conecta",
    "onde-ficam-os-dados"
   ],
   "atualizadoEm": "2026-11-11"
  },
  {
   "id": "como-usar-a-ajuda",
   "categoria": "comecar",
   "ordem": 2,
   "titulo": "Como usar a ajuda: dicas, modo ajuda e Central de Ajuda",
   "resumo": "Passe o mouse (ou toque longo no celular) para ver o que cada item faz, ligue o modo ajuda para explorar a tela com segurança e consulte a Central para o passo a passo completo.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "ajuda",
    "dica",
    "tooltip",
    "modo ajuda",
    "interrogação",
    "saiba mais",
    "f1",
    "celular",
    "teclado"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "A ajuda funciona em três níveis. **1. Dica rápida:** uma caixinha que explica o botão, campo ou menu. **2. Saiba mais:** a dica leva ao artigo completo, que abre num painel ao lado, sem sair da tela em que você está. **3. Central de Ajuda:** todos os artigos, organizados por categorias, com busca, passo a passo, imagens e conteúdos relacionados.",
    "finalidade": "Permitir que você descubra sozinho(a) para que serve cada recurso e como usá-lo, sem precisar perguntar a outra pessoa.",
    "passos": [
     "**No computador:** pare o mouse sobre um botão, campo ou menu por meio segundo. A dica aparece; clique em **Saiba mais** para abrir o artigo.",
     "**No celular ou tablet:** toque e segure (toque longo) um botão para ver a explicação. Nos formulários, toque no símbolo **i** ao lado do nome do campo.",
     "**Modo ajuda:** clique no botão **? Ajuda** e depois em **Ligar o modo ajuda**. Os itens que têm explicação ficam contornados; clique ou toque em qualquer um para ler a explicação. Nada é executado enquanto o modo estiver ligado. Para sair, use **Sair do modo ajuda** ou a tecla Esc.",
     "**Pelo teclado:** use Tab para chegar ao item; a dica aparece sozinha. Pressione **F1** para abrir a explicação completa e Esc para fechar.",
     "**Central de Ajuda:** o botão **? Ajuda** abre a ajuda da tela atual, a busca e as categorias. O link **Abrir na Central de Ajuda completa** leva à página com todos os artigos."
    ],
    "exemplos": [
     "Não sabe o que é \"Centro de custo\" na Prestação de Contas? Pare o mouse sobre o campo e leia a dica.",
     "No celular, ligue o modo ajuda e toque nos botões da Lojinha para conhecer cada um antes de usar."
    ],
    "cuidados": [
     "Se as dicas ao passar o mouse estiverem incomodando, desmarque **Mostrar dicas ao passar o mouse** no painel de ajuda. O modo ajuda e a Central continuam disponíveis.",
     "Algumas dicas são montadas automaticamente a partir do nome do campo. Quem administra a ajuda pode escrever explicações mais completas (veja [[editar-explicacoes-rapidas|Escrever e corrigir explicações]])."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/ajuda-dica.jpg",
     "legenda": "Dica rápida: aparece ao parar o mouse sobre o campo. \"Saiba mais\" abre o artigo completo.",
     "alt": "Captura de tela: Dica rápida: aparece ao parar o mouse sobre o campo. \"Saiba mais\" abre o artigo completo."
    },
    {
     "src": "ajuda/img/ajuda-painel.jpg",
     "legenda": "O botão ? Ajuda abre o painel: 1. ajuda desta tela · 2. ligar o modo ajuda.",
     "alt": "Captura de tela: O botão ? Ajuda abre o painel: 1. ajuda desta tela · 2. ligar o modo ajuda."
    },
    {
     "src": "ajuda/img/ajuda-modo.jpg",
     "legenda": "Modo ajuda: os itens com explicação ficam contornados; clique em um deles para ler.",
     "alt": "Captura de tela: Modo ajuda: os itens com explicação ficam contornados; clique em um deles para ler."
    }
   ],
   "relacionados": [
    "o-que-e-a-plataforma",
    "acessibilidade-teclado",
    "problemas-frequentes"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "idiomas-do-site",
   "categoria": "comecar",
   "ordem": 3,
   "titulo": "Ler o site em outro idioma",
   "resumo": "O site público pode ser lido em português, espanhol, italiano, francês, inglês e alemão.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "idioma",
    "língua",
    "tradução",
    "inglês",
    "espanhol",
    "language"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "O botão de idioma, no canto superior esquerdo (com o símbolo de globo e a sigla, como **PT**), troca os textos da página para o idioma escolhido sem recarregar e sem usar tradutores externos.",
    "finalidade": "Acolher visitantes de outros países que acompanham os Parques de Estudo e Reflexão.",
    "passos": [
     "Clique no botão do globo (ex.: **PT**).",
     "Escolha o idioma na lista.",
     "A escolha fica guardada neste navegador e vale para as outras páginas do site."
    ],
    "exemplos": [
     "Compartilhe um link já em inglês acrescentando **?lang=en** ao endereço da página."
    ],
    "cuidados": [
     "Nomes próprios e termos da Escola não são traduzidos.",
     "A área restrita, o login, o app e esta Central de Ajuda estão em português e espanhol; nos outros idiomas, a área restrita e a ajuda continuam em português."
    ]
   },
   "imagens": [],
   "relacionados": [
    "menu-do-site",
    "acessibilidade-teclado"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "acessibilidade-teclado",
   "categoria": "comecar",
   "ordem": 4,
   "titulo": "Usar o site pelo teclado e com leitor de tela",
   "resumo": "Todas as dicas e a Central de Ajuda funcionam sem mouse: Tab, F1, Esc e leitor de tela.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "acessibilidade",
    "teclado",
    "leitor de tela",
    "f1",
    "esc",
    "tab",
    "nvda",
    "voiceover"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "A ajuda foi feita para funcionar com teclado e com leitores de tela (NVDA, JAWS, VoiceOver, TalkBack). Cada item com explicação tem uma descrição que o leitor de tela anuncia ao chegar nele.",
    "finalidade": "Garantir que pessoas com diferentes formas de acesso consigam aprender e usar a plataforma.",
    "passos": [
     "**Tab** e **Shift+Tab**: passam de um item para o outro; a dica aparece automaticamente.",
     "**F1**: abre a explicação completa do item em foco (ou a ajuda da tela, se o item não tiver explicação).",
     "**?** (fora de campos de texto): abre o painel de ajuda.",
     "**Esc**: fecha a dica, a explicação ou o painel, nesta ordem, e desliga o modo ajuda."
    ],
    "exemplos": [],
    "cuidados": [
     "As dicas não escondem informações importantes: elas somem ao rolar a página, ao clicar em outro lugar ou com Esc."
    ]
   },
   "imagens": [],
   "relacionados": [
    "como-usar-a-ajuda",
    "idiomas-do-site"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "menu-do-site",
   "categoria": "navegacao",
   "ordem": 1,
   "titulo": "O menu do site e onde encontrar cada assunto",
   "resumo": "Guia do menu do topo: O Parque, Reservas, Silo, Centro de Estudo, Ajude o Parque, Parques no Mundo e Blogger.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "menu",
    "navegar",
    "página",
    "submenu",
    "onde fica"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "O menu do topo aparece em todas as páginas. No computador, os submenus abrem ao passar o mouse sobre o item. No celular, o menu fica recolhido no botão **☰** e cada submenu abre na setinha ao lado do nome.",
    "finalidade": "Chegar rapidamente a qualquer assunto do site.",
    "passos": [
     "**Quem somos** e **Início**: apresentação e página inicial.",
     "**O Parque**: Sobre o Parque, Elementos, Como Chegar e Atividades (Eventos, Encontros, Retiros, Reuniões e Álbum de fotos).",
     "**Reservas**: Como Fazer (regras e formulário) e Calendário de uso.",
     "**Silo**: Mensagem de Silo, Comunidades da Mensagem e Organismos do Movimento.",
     "**Centro de Estudo**: Escola (e Nivelação), Biblioteca do Parque, Produções de Escola, Livros, Áudios e App, e Ofícios.",
     "**Ajude o Parque**: Doação, Pagar online, Livraria, Lojinha, Rifa Solidária, Vaquinha Coletiva, Voluntário e Comissões.",
     "**Parques no Mundo** e **Blogger** completam o menu. No rodapé ficam as redes sociais e o cadastro no Comunicado por e-mail."
    ],
    "exemplos": [],
    "cuidados": [
     "No celular, toque fora do menu ou em Esc para fechá-lo."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/menu-topo.jpg",
     "legenda": "1. Menu do site · 2. Entrar na área restrita · 3. Ajuda desta tela.",
     "alt": "Captura de tela: 1. Menu do site · 2. Entrar na área restrita · 3. Ajuda desta tela."
    }
   ],
   "relacionados": [
    "atividades-publicas",
    "pedir-reserva",
    "doar-e-pagar-online",
    "ser-voluntario"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "atividades-publicas",
   "categoria": "navegacao",
   "ordem": 2,
   "titulo": "Ver as atividades do Parque",
   "resumo": "Eventos, encontros, retiros e reuniões publicados pela Comissão, com artigo completo e fotos.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "atividades",
    "eventos",
    "encontros",
    "retiros",
    "reuniões",
    "notícias"
   ],
   "onde": "Menu **O Parque › Atividades**.",
   "secoes": {
    "oQueE": "A página Atividades lista o que acontece no Parque e atividades externas ligadas a ele. Cada atividade tem foto, título, tipo, data e um resumo; **Clique aqui e leia mais** abre o artigo completo, com autor e outras atividades.",
    "finalidade": "Acompanhar a vida do Parque e saber das próximas atividades.",
    "passos": [
     "Abra **O Parque › Atividades** (ou um dos tipos: Eventos, Encontros, Retiros, Reuniões).",
     "Clique em uma atividade para ler o artigo.",
     "Use **Ver todas as atividades** para voltar à lista."
    ],
    "exemplos": [],
    "cuidados": [
     "As atividades são publicadas pelo Responsável pelas Atividades na área restrita (veja [[atividades-gestao|Atividades: registrar e publicar]])."
    ]
   },
   "imagens": [],
   "relacionados": [
    "menu-do-site",
    "enviar-fotos-album",
    "calendario-de-uso"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "biblioteca-publica",
   "categoria": "navegacao",
   "ordem": 3,
   "titulo": "Consultar a Biblioteca do Parque",
   "resumo": "Lista dos livros disponíveis para leitura e consulta no Parque, com localização na estante.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "biblioteca",
    "livros",
    "acervo",
    "consulta",
    "leitura"
   ],
   "onde": "Menu **Centro de Estudo › Biblioteca do Parque** e o bloco \"Acervo Aberto\" da página inicial.",
   "secoes": {
    "oQueE": "O acervo físico do Parque, com capa, autor, resumo e onde o livro fica. Alguns livros têm link para leitura online.",
    "finalidade": "Saber, antes da visita, quais livros estão disponíveis para leitura no local.",
    "passos": [
     "Abra **Centro de Estudo › Biblioteca do Parque**.",
     "Percorra a lista; a localização (estante/prateleira) aparece em cada livro.",
     "Quando houver **Acessar leitura**, o livro pode ser lido online."
    ],
    "exemplos": [],
    "cuidados": [
     "Para comprar livros, use a [[comprar-livraria-lojinha|Livraria]]; o acervo da Biblioteca é só para leitura e empréstimo."
    ]
   },
   "imagens": [],
   "relacionados": [
    "comprar-livraria-lojinha",
    "biblioteca-gestao",
    "menu-do-site"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "como-chegar-ao-parque",
   "categoria": "navegacao",
   "ordem": 4,
   "titulo": "Como chegar ao Parque",
   "resumo": "Endereço, mapa e linhas de ônibus para chegar ao Parque Retiro, em Maricá (RJ).",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "endereço",
    "mapa",
    "ônibus",
    "chegar",
    "maricá",
    "google maps"
   ],
   "onde": "Menu **O Parque › Como Chegar**.",
   "secoes": {
    "oQueE": "Página com o endereço (Estrada do Retiro, 28A, Retiro, Maricá/RJ), o botão **Abrir no Google Maps** e as opções de transporte, com links para os horários das linhas.",
    "finalidade": "",
    "passos": [
     "Abra **O Parque › Como Chegar**.",
     "Clique em **Abrir no Google Maps** para traçar a rota a partir de onde você está.",
     "Para ônibus, use os links de horários das linhas indicadas."
    ],
    "exemplos": [],
    "cuidados": []
   },
   "imagens": [],
   "relacionados": [
    "pedir-reserva",
    "menu-do-site"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "pedir-reserva",
   "categoria": "participar",
   "ordem": 1,
   "titulo": "Pedir reserva do Centro de Estudo",
   "resumo": "Consulte o calendário, preencha o formulário em Reservas › Como Fazer e envie o pedido à Comissão por e-mail.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "reserva",
    "reservar",
    "centro de estudo",
    "alojamento",
    "cama",
    "hospedagem",
    "formulário"
   ],
   "onde": "Menu **Reservas › Como Fazer**.",
   "secoes": {
    "oQueE": "O Centro de Estudo é usado mediante reserva feita com antecedência. O formulário monta um e-mail com os seus dados e o envia à Comissão do Parque. A Sala, o Portal, o Monólito, a Fonte, a Estela e os passeios são de uso público e não precisam de reserva.",
    "finalidade": "Pedir o uso do Centro de Estudo (e, se precisar, cama no alojamento) para estudo, reunião ou retiro.",
    "passos": [
     "Consulte o [[calendario-de-uso|Calendário de uso]] para ver as datas desocupadas.",
     "Abra **Reservas › Como Fazer** e leia as recomendações de uso.",
     "Preencha nome, telefone, cidade, país, comunidade/organismo e e-mail.",
     "Informe o dia de chegada, o dia de saída, a hora de chegada e a quantidade de pessoas.",
     "Marque **Preciso de cama no alojamento** se for dormir no Parque e descreva necessidades específicas (por exemplo, cama de baixo por dificuldade de locomoção).",
     "Em **Detalhes**, conte o objetivo da atividade e, se for um grupo, o nome dos participantes.",
     "Clique em **Enviar solicitação**: o seu programa de e-mail abre com a mensagem pronta. Confira e envie."
    ],
    "exemplos": [
     "Grupo de 6 pessoas, chegada sexta 18h, saída domingo: informe as datas, marque cama no alojamento e liste os nomes em Detalhes."
    ],
    "cuidados": [
     "A reserva só vale depois da confirmação da Comissão.",
     "Para cancelar, avise com 24 horas de antecedência por e-mail (parqueretirorio@gmail.com).",
     "Se o seu computador não tiver programa de e-mail configurado, envie os mesmos dados para parqueretirorio@gmail.com ou pelo WhatsApp do Parque."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/reserva-formulario.jpg",
     "legenda": "1–2. Datas de chegada e saída · 3. Cama no alojamento · 4. Detalhes e nomes do grupo.",
     "alt": "Captura de tela: 1–2. Datas de chegada e saída · 3. Cama no alojamento · 4. Detalhes e nomes do grupo."
    }
   ],
   "relacionados": [
    "calendario-de-uso",
    "como-chegar-ao-parque",
    "reservas-alojamento"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "calendario-de-uso",
   "categoria": "participar",
   "ordem": 2,
   "titulo": "Consultar o Calendário de uso",
   "resumo": "Veja quais dias o Centro de Estudo está ocupado ou desocupado antes de pedir a reserva.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "calendário",
    "disponibilidade",
    "ocupado",
    "desocupado",
    "datas"
   ],
   "onde": "Menu **Reservas › Calendário de uso**.",
   "secoes": {
    "oQueE": "Um calendário mensal do Centro de Estudo (CE). Cada dia mostra **Desocupado** ou **Ocupado**; ao escolher um dia, os detalhes aparecem ao lado.",
    "finalidade": "",
    "passos": [
     "Use **Mês anterior** e **Mês seguinte** para navegar, ou escolha o mês e o ano em **Ir para**.",
     "**Hoje** volta ao mês atual.",
     "Clique em um dia para ver os detalhes; **Imprimir dia** imprime essas informações.",
     "Encontrou uma data livre? Siga para [[pedir-reserva|Pedir reserva]]."
    ],
    "exemplos": [],
    "cuidados": [
     "O calendário mostra as reservas já confirmadas pela Comissão. Um dia \"Desocupado\" ainda precisa do seu pedido e da confirmação."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/calendario.jpg",
     "legenda": "1. Mês anterior · 2. Hoje · 3. Mês seguinte. Cada dia mostra se o Centro de Estudo está ocupado.",
     "alt": "Captura de tela: 1. Mês anterior · 2. Hoje · 3. Mês seguinte. Cada dia mostra se o Centro de Estudo está ocupado."
    }
   ],
   "relacionados": [
    "pedir-reserva",
    "atualizar-conteudos-do-site"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "enviar-fotos-album",
   "categoria": "participar",
   "ordem": 3,
   "titulo": "Enviar fotos para o Álbum",
   "resumo": "Envie até 10 fotos por vez; a curadoria escolhe quais serão publicadas no Álbum de fotos.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "fotos",
    "álbum",
    "enviar",
    "imagem",
    "curadoria"
   ],
   "onde": "Menu **O Parque › Atividades › Álbum de fotos**, botão **Enviar minhas fotos**.",
   "secoes": {
    "oQueE": "Formulário para quem tirou fotos no Parque. As fotos chegam à curadoria do Álbum, que decide quais aparecem na área aberta.",
    "finalidade": "",
    "passos": [
     "Abra **Álbum de fotos** e vá até **Enviar fotos**.",
     "Em **Fotos**, escolha até 10 imagens (no celular, da galeria ou da câmera).",
     "Se souber, escolha a atividade em que as fotos foram tiradas e o dia.",
     "Informe o autor e escolha se o nome deve aparecer junto da foto, caso ela seja publicada.",
     "Clique em **Enviar fotos**."
    ],
    "exemplos": [],
    "cuidados": [
     "Ao enviar, você declara que as fotos são suas e autoriza o uso pelo Parque.",
     "Prefira fotos em que as pessoas autorizaram aparecer.",
     "Por enquanto, as páginas abertas do site ainda não estão ligadas ao servidor: o envio feito por elas fica guardado no navegador de quem enviou (veja [[onde-ficam-os-dados|Onde ficam os dados]])."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/fotos-envio.jpg",
     "legenda": "1. Escolha até 10 fotos · 2. Atividade · 3. Mostrar ou não o seu nome.",
     "alt": "Captura de tela: 1. Escolha até 10 fotos · 2. Atividade · 3. Mostrar ou não o seu nome."
    }
   ],
   "relacionados": [
    "album-gestao",
    "atividades-publicas",
    "arquivo-ou-imagem-recusado"
   ],
   "atualizadoEm": "2026-11-11"
  },
  {
   "id": "ser-voluntario",
   "categoria": "participar",
   "ordem": 4,
   "titulo": "Inscrever-se como voluntário(a)",
   "resumo": "Para quem quer ajudar com tempo e trabalho: informe contato, como quer colaborar e quando pode.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "voluntário",
    "voluntariado",
    "ajudar",
    "comissão",
    "jardinagem",
    "mutirão"
   ],
   "onde": "Menu **Ajude o Parque › Voluntário** ou o botão **Quero ser voluntário(a)** de cada comissão.",
   "secoes": {
    "oQueE": "Inscrição para cooperar com o Parque sem dinheiro: jardinagem e área externa, reflorestamento, limpeza e manutenção, apoio em encontros, comunicação, Multiuso ou outra forma.",
    "finalidade": "",
    "passos": [
     "Preencha nome completo e celular/WhatsApp (obrigatórios), e-mail e cidade.",
     "Marque uma ou mais formas de colaborar.",
     "Escolha quando pode ajudar e, se quiser, conte sua experiência, limitações ou ideias.",
     "Marque a autorização de uso dos dados e clique em **Enviar minha inscrição**.",
     "A Comissão entra em contato para combinar como e quando."
    ],
    "exemplos": [],
    "cuidados": [
     "Nada é cobrado.",
     "Os dados são usados apenas para o contato sobre o voluntariado."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/voluntario-form.jpg",
     "legenda": "1. Nome completo · 2. Celular/WhatsApp · 3. Formas de colaborar.",
     "alt": "Captura de tela: 1. Nome completo · 2. Celular/WhatsApp · 3. Formas de colaborar."
    }
   ],
   "relacionados": [
    "voluntarios-gestao",
    "menu-do-site",
    "doar-e-pagar-online"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "doar-e-pagar-online",
   "categoria": "participar",
   "ordem": 5,
   "titulo": "Doar e pagar online",
   "resumo": "Doação por PIX, Banco Mumbuca ou conta institucional, e pagamento online (PIX, cartão ou boleto) pelo Asaas.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "doação",
    "doar",
    "pix",
    "pagar",
    "cartão",
    "boleto",
    "asaas",
    "mumbuca",
    "contribuição"
   ],
   "onde": "Menu **Ajude o Parque › Doação** e **Ajude o Parque › Pagar online**.",
   "secoes": {
    "oQueE": "A página **Doação** mostra a chave PIX/Banco Mumbuca e a conta do Instituto Pangeia. A página **Pagar online** leva à tela segura do Asaas, onde você escolhe PIX, cartão de crédito, cartão de débito ou boleto.",
    "finalidade": "Os Parques são mantidos exclusivamente pela contribuição voluntária das pessoas. Os valores sustentam a manutenção e a construção dos elementos do Parque.",
    "passos": [
     "Em **Pagar online**, escolha o que deseja pagar (doação, contribuição mensal, compra...) e informe a referência, se houver.",
     "Digite o valor (mínimo R$ 5,00), nome completo, CPF ou CNPJ (exigido pelo Asaas) e e-mail.",
     "Marque a autorização de uso dos dados e clique em **Ir para o pagamento seguro**.",
     "Conclua o pagamento na tela do Asaas."
    ],
    "exemplos": [],
    "cuidados": [
     "Se aparecer o aviso \"O pagamento online ainda não está disponível\", use as formas da página Doação.",
     "No Parque, a Comissão aceita pagamento na maquininha.",
     "Dúvidas: parqueretirorio@gmail.com."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/pagar-online.jpg",
     "legenda": "1. O que pagar · 2. Valor · 3. Ir para o pagamento seguro (Asaas).",
     "alt": "Captura de tela: 1. O que pagar · 2. Valor · 3. Ir para o pagamento seguro (Asaas)."
    }
   ],
   "relacionados": [
    "comprar-livraria-lojinha",
    "contribuir-vaquinha",
    "prestacao-contas"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "comprar-livraria-lojinha",
   "categoria": "participar",
   "ordem": 6,
   "titulo": "Comprar na Livraria e na Lojinha",
   "resumo": "Livros e produtos do Parque são pedidos por e-mail; livros em pré-lançamento podem ser encomendados.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "livraria",
    "lojinha",
    "comprar",
    "livro",
    "produto",
    "encomenda",
    "pré-lançamento",
    "pré-venda"
   ],
   "onde": "Menu **Ajude o Parque › Livraria** e **Ajude o Parque › Lojinha**.",
   "secoes": {
    "oQueE": "A **Livraria** vende as Obras Completas de Silo, livros de Psicologia, Experiências Guiadas e produções do Centro de Estudos. A **Lojinha** oferece produtos promocionais e artesanais. O valor arrecadado sustenta o Parque.",
    "finalidade": "",
    "passos": [
     "Escolha o livro ou produto.",
     "Clique em **Fazer pedido por e-mail** (ou **Pedir por e-mail**): o seu programa de e-mail abre com o assunto preenchido.",
     "Livro em pré-lançamento: abra o link de encomenda, preencha o pedido e envie a confirmação pelos botões indicados. O Parque entra em contato para combinar o pagamento."
    ],
    "exemplos": [],
    "cuidados": [
     "Produto marcado **Esgotado** não está disponível no momento.",
     "Para apenas ler, use a [[biblioteca-publica|Biblioteca do Parque]]."
    ]
   },
   "imagens": [],
   "relacionados": [
    "doar-e-pagar-online",
    "livraria-gestao",
    "lojinha-gestao"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "participar-rifa",
   "categoria": "participar",
   "ordem": 7,
   "titulo": "Participar da Rifa Solidária",
   "resumo": "Pague, envie o comprovante e receba seus números na hora. Só números confirmados concorrem.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "rifa",
    "sorteio",
    "loteria federal",
    "número",
    "comprovante"
   ],
   "onde": "Menu **Ajude o Parque › Rifa Solidária**.",
   "secoes": {
    "oQueE": "Rifas em benefício do Parque, com sorteio pela Loteria Federal. Cada rifa mostra o prêmio, o valor do número e as formas de pagamento.",
    "finalidade": "",
    "passos": [
     "Leia a descrição do prêmio e as instruções de pagamento.",
     "Faça o pagamento.",
     "Preencha nome completo, celular, WhatsApp, e-mail e a quantidade de números, e anexe o comprovante (imagem ou PDF até 600 KB).",
     "Aceite o uso dos dados e envie: os números são sorteados entre os livres e aparecem na hora, junto com um código.",
     "Acompanhe a situação com seu e-mail e celular."
    ],
    "exemplos": [],
    "cuidados": [
     "Só concorrem números **confirmados** pela Comissão depois de conferir o comprovante.",
     "As inscrições fecham no dia anterior ao sorteio.",
     "O ganhador aparece no site só com o nome abreviado."
    ]
   },
   "imagens": [],
   "relacionados": [
    "contribuir-vaquinha",
    "rifa-gestao",
    "doar-e-pagar-online"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "contribuir-vaquinha",
   "categoria": "participar",
   "ordem": 8,
   "titulo": "Contribuir com uma Vaquinha Coletiva",
   "resumo": "Contribua com o valor que quiser para uma necessidade específica do Parque e acompanhe a meta.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "vaquinha",
    "contribuição",
    "meta",
    "arrecadação",
    "comprovante"
   ],
   "onde": "Menu **Ajude o Parque › Vaquinha Coletiva**.",
   "secoes": {
    "oQueE": "Campanhas para custear uma necessidade específica (por exemplo, manutenção da grama). O gráfico mostra a porcentagem da meta, o arrecadado e quanto falta.",
    "finalidade": "",
    "passos": [
     "Leia o objetivo e as instruções de pagamento.",
     "Faça o pagamento do valor que quiser.",
     "Preencha seus dados, o valor, a forma de pagamento e anexe o comprovante (imagem ou PDF até 600 KB).",
     "Aceite o uso dos dados e envie. Guarde o código para consultar a situação."
    ],
    "exemplos": [],
    "cuidados": [
     "O gráfico só soma contribuições confirmadas pela Comissão.",
     "Há também \"outras formas de ajudar\", como trabalho voluntário."
    ]
   },
   "imagens": [],
   "relacionados": [
    "participar-rifa",
    "vaquinha-gestao",
    "ser-voluntario"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "receber-comunicado",
   "categoria": "participar",
   "ordem": 9,
   "titulo": "Receber (ou deixar de receber) o Comunicado por e-mail",
   "resumo": "Cadastre seu e-mail para receber novidades, atividades e convites; descadastre quando quiser.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "newsletter",
    "comunicado",
    "e-mail",
    "cadastro",
    "descadastro",
    "wi-fi"
   ],
   "onde": "Rodapé: **Receba o Comunicado do Parque por e-mail**. Para sair: página Deixar de receber o Comunicado.",
   "secoes": {
    "oQueE": "O Comunicado por e-mail é a mensagem do Parque com novidades e convites. A página de cadastro de visitante (usada no Wi-Fi do Parque) faz o mesmo cadastro.",
    "finalidade": "",
    "passos": [
     "Abra **Receba o Comunicado do Parque por e-mail**, no rodapé.",
     "Informe seu nome (opcional) e e-mail.",
     "Marque que concorda em receber e clique em **Quero receber**.",
     "Para sair, abra a página de descadastro (link no próprio Comunicado), informe o e-mail e confirme."
    ],
    "exemplos": [],
    "cuidados": []
   },
   "imagens": [
    {
     "src": "ajuda/img/newsletter.jpg",
     "legenda": "1. Seu e-mail · 2. Concordar em receber.",
     "alt": "Captura de tela: 1. Seu e-mail · 2. Concordar em receber."
    }
   ],
   "relacionados": [
    "listas-email",
    "menu-do-site"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "estela-virtual",
   "categoria": "participar",
   "ordem": 10,
   "titulo": "A Estela Virtual",
   "resumo": "Homenagem com os nomes de quem contribuiu, direta e indiretamente, na construção do Parque.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "estela",
    "nomes",
    "homenagem",
    "construção"
   ],
   "onde": "Menu **O Parque › Elementos**, link para a Estela Virtual.",
   "secoes": {
    "oQueE": "Lista pública dos nomes completos das pessoas que contribuíram para a construção do Parque, publicada pela Comissão a partir do cadastro feito na área restrita.",
    "finalidade": "",
    "passos": [],
    "exemplos": [],
    "cuidados": [
     "Só aparecem nomes que a Comissão decidiu tornar públicos (veja [[estela-gestao|Estela: cadastro e publicação]])."
    ]
   },
   "imagens": [],
   "relacionados": [
    "estela-gestao",
    "menu-do-site"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "criar-conta-e-entrar",
   "categoria": "acesso",
   "ordem": 1,
   "titulo": "Criar conta e entrar na área restrita",
   "resumo": "Clique em Entrar, crie sua conta com nome completo, e-mail, WhatsApp e senha, confirme o e-mail e aguarde a aprovação da administração.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "login",
    "entrar",
    "senha",
    "cadastro",
    "conta",
    "acesso",
    "mestres"
   ],
   "onde": "Botão **Entrar**, no canto superior direito de todas as páginas.",
   "secoes": {
    "oQueE": "A área restrita (CONecta Retiro) é para quem cuida do Parque. Cada pessoa tem a sua conta, com nível de acesso e responsabilidades definidos pelo administrador.",
    "finalidade": "",
    "passos": [
     "Clique em **Entrar** (no site) ou abra o app **CONecta Retiro**.",
     "Toque em **Criar conta** e informe nome completo, e-mail, senha (repetida), WhatsApp com DDD e marque a autorização LGPD.",
     "Abra o e-mail de confirmação que chega na sua caixa de entrada e clique no link (olhe também no spam).",
     "O cadastro fica **aguardando aprovação** da administração.",
     "Depois de aprovado(a), volte em **Entrar** e use seu e-mail e senha.",
     "Para sair, use o botão **Sair** no topo do painel (ou **Sair do app**)."
    ],
    "exemplos": [
     "A mesma conta vale no site e no app, em qualquer computador ou celular."
    ],
    "cuidados": [
     "Use uma senha só sua; não a compartilhe.",
     "Esqueceu a senha? Use **Esqueci minha senha** na tela Entrar: chega um e-mail para criar uma senha nova.",
     "Se o cadastro estiver pendente, recusado ou bloqueado, o sistema avisa na tela de login (veja [[nao-consigo-entrar|Não consigo entrar]])."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/login.jpg",
     "legenda": "1. Entrar (conta aprovada) · 2. Criar conta (aguarda aprovação).",
     "alt": "Captura de tela: 1. Entrar (conta aprovada) · 2. Criar conta (aguarda aprovação)."
    }
   ],
   "relacionados": [
    "niveis-e-responsabilidades",
    "completar-cadastro-lgpd",
    "nao-consigo-entrar"
   ],
   "atualizadoEm": "2026-11-11"
  },
  {
   "id": "niveis-e-responsabilidades",
   "categoria": "acesso",
   "ordem": 2,
   "titulo": "Níveis de acesso e responsabilidades",
   "resumo": "O nível (Leitor, Comentador, Editor, Administrador) define o que a pessoa pode fazer; as responsabilidades liberam as ferramentas de cada comissão.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "nível",
    "permissão",
    "leitor",
    "editor",
    "administrador",
    "comentador",
    "responsável",
    "função"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "**Nível de acesso:** Leitor (vê acervo, avisos e aulas, sem alterar), Comentador (lê e comenta nas produções), Editor (responsável pelo acervo: cadastra livros, controla empréstimos e agenda aulas) e Administrador (acesso total, usuários e finanças). **Responsabilidades:** marcações que dão acesso a uma ferramenta específica, como Responsável de Reservas, pela Estela, pelo Inventário, Financeiro, pela Comunicação, pela Lojinha, pela Rifa, pela Vaquinha, pelos Voluntários, pela Jardinagem, pelas Atividades, pelo Multiuso e pela Central de Ajuda.",
    "finalidade": "Cada pessoa vê e altera apenas o que é da sua responsabilidade, protegendo dados pessoais e financeiros.",
    "passos": [
     "O administrador abre **Administração › Gestão de Responsáveis**.",
     "Escolhe o nível e marca as responsabilidades de cada pessoa.",
     "A pessoa passa a ver as ferramentas correspondentes no painel na próxima vez que abrir a área restrita."
    ],
    "exemplos": [
     "A Responsável pelo Inventário, com nível Leitor, vê e altera o Inventário e o Patrimônio, mas não a Prestação de Contas."
    ],
    "cuidados": [
     "Ninguém aumenta o próprio nível.",
     "Se você não vê uma ferramenta que deveria ver, peça ao administrador para conferir sua responsabilidade."
    ]
   },
   "imagens": [],
   "relacionados": [
    "gestao-de-responsaveis",
    "painel-conecta",
    "criar-conta-e-entrar"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "gestao-de-responsaveis",
   "categoria": "acesso",
   "ordem": 3,
   "titulo": "Aprovar cadastros e gerenciar responsáveis",
   "resumo": "Exclusivo do administrador: aprovar ou recusar pedidos de conta, mudar níveis e responsabilidades e bloquear contas.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "aprovar",
    "cadastro",
    "usuários",
    "responsáveis",
    "bloquear",
    "senha provisória"
   ],
   "onde": "**Administração › Gestão de Responsáveis**. O número em vermelho no botão mostra os cadastros aguardando aprovação.",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Em **Solicitações de cadastro**, confira os dados e clique em **Aprovar** ou **Não aprovar**.",
     "Cada pessoa cria a própria conta em **Entrar › Criar conta** (com e-mail e senha dela). Para incluir alguém, envie o link da página Entrar ou do app e aprove o cadastro quando chegar.",
     "Na lista **Responsáveis cadastrados**, ajuste nível e responsabilidades, ou use **Bloquear/Desbloquear**.",
     "Quem esqueceu a senha resolve sozinho em **Esqueci minha senha**; o administrador não vê nem define senhas."
    ],
    "exemplos": [],
    "cuidados": [
     "A autorização LGPD é da própria pessoa: ela aceita no primeiro acesso. Não marque por ela.",
     "Bloquear impede o acesso sem apagar o histórico da pessoa.",
     "Estes dados ficam no servidor do Parque e aparecem para quem tem acesso, em qualquer computador ou celular. Mesmo assim, baixe o backup completo de vez em quando (veja [[backup-e-restauracao|Backup e restauração]])."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/responsaveis.jpg",
     "legenda": "1. Nível de acesso · 2. Responsabilidades · 3. Senha provisória.",
     "alt": "Captura de tela: 1. Nível de acesso · 2. Responsabilidades · 3. Senha provisória."
    }
   ],
   "relacionados": [
    "niveis-e-responsabilidades",
    "completar-cadastro-lgpd",
    "criar-conta-e-entrar"
   ],
   "atualizadoEm": "2026-11-11"
  },
  {
   "id": "completar-cadastro-lgpd",
   "categoria": "acesso",
   "ordem": 4,
   "titulo": "Completar o cadastro e a autorização LGPD",
   "resumo": "Todos os níveis precisam de nome completo, WhatsApp e e-mail, com a autorização LGPD aceita pela própria pessoa.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "lgpd",
    "cadastro",
    "dados pessoais",
    "consentimento",
    "imagem",
    "whatsapp"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "Quando faltar algum dado, aparece no topo do painel o quadro **Complete seu cadastro**. A autorização LGPD principal é obrigatória; a autorização de uso de imagem e voz é opcional e pode ser revogada.",
    "finalidade": "",
    "passos": [
     "No quadro **Complete seu cadastro**, confira o nome completo (nome e sobrenome) e o WhatsApp com DDD.",
     "Leia os termos em **Ler os termos** e marque a autorização.",
     "Clique em **Salvar cadastro**."
    ],
    "exemplos": [],
    "cuidados": [
     "Seus direitos (acessar, corrigir, pedir eliminação, revogar) podem ser exercidos pelo e-mail parqueretirorio@gmail.com."
    ]
   },
   "imagens": [],
   "relacionados": [
    "criar-conta-e-entrar",
    "gestao-de-responsaveis"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "painel-conecta",
   "categoria": "conecta",
   "ordem": 1,
   "titulo": "O painel CONecta Retiro: áreas, grupos e ferramentas",
   "resumo": "O painel tem duas áreas, Comissões Parque Retiro e Administração; cada uma reúne as ferramentas que você pode usar.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "painel",
    "conecta",
    "área restrita",
    "menu",
    "abas",
    "ferramentas",
    "elementos",
    "ajude o parque"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "Depois de entrar, o painel mostra **Olá, (seu nome)**, o seu nível e as duas áreas: **Comissões Parque Retiro** (ferramentas de cada comissão) e **Administração** (finanças, inventário, responsáveis e segurança). Algumas ferramentas ficam em grupos que abrem uma caixa ao lado: **Elementos** (Estela e a descrição de cada elemento) e **Ajude o Parque** (Lojinha, Rifa, Vaquinha e Voluntário).",
    "finalidade": "Encontrar rapidamente a ferramenta certa, vendo somente aquilo que é da sua responsabilidade.",
    "passos": [
     "Clique no título da área (**Comissões Parque Retiro** ou **Administração**) para abrir a lista de ferramentas.",
     "Clique na ferramenta. Ela abre abaixo, e o título da área passa a mostrar a ferramenta aberta.",
     "Grupos (Elementos, Ajude o Parque): passe o mouse ou clique no grupo para abrir a caixa e escolha a ferramenta.",
     "Muitas ferramentas têm sub-abas no topo (por exemplo, Pedidos, Ocupação, Relatório). Use-as para mudar de parte.",
     "Para trocar de ferramenta, clique de novo no título da área."
    ],
    "exemplos": [],
    "cuidados": [
     "Você só vê as ferramentas do seu nível e das suas responsabilidades (veja [[niveis-e-responsabilidades|Níveis e responsabilidades]]).",
     "Em ferramentas de Comissões, aparece também o botão **Gerar Comunicado por e-mail** para quem cuida da Comunicação (veja [[listas-email|Listas de e-mail e Comunicado]])."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/painel.jpg",
     "legenda": "1. Comissões Parque Retiro · 2. Administração · 3. Ajuda desta tela.",
     "alt": "Captura de tela: 1. Comissões Parque Retiro · 2. Administração · 3. Ajuda desta tela."
    }
   ],
   "relacionados": [
    "formularios-e-listas",
    "niveis-e-responsabilidades",
    "como-usar-a-ajuda"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "usar-o-app",
   "categoria": "conecta",
   "ordem": 2,
   "titulo": "Usar o app CONecta Retiro no celular",
   "resumo": "O app CONecta Retiro leva a área restrita para o celular: mesma conta, mesmos dados, letra grande e ajuda passo a passo.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "app",
    "aplicativo",
    "celular",
    "instalar",
    "baixar",
    "android",
    "iphone",
    "atualizar",
    "versão",
    "ajuda"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "O **CONecta Retiro** também existe como **app no celular**, para as comissões e a administração. Ele usa a **mesma conta e os mesmos dados** da área restrita do site: o que você salva no app aparece no computador e vice-versa.",
    "finalidade": "Facilitar o dia a dia de quem cuida do Parque: ver avisos e agenda, consultar a biblioteca e abrir as ferramentas das suas responsabilidades direto do celular, com letra grande e um assunto por tela.",
    "passos": [
     "**Instale**: abra o endereço do app no celular (o botão **Baixar o app** aparece também na página Entrar do site). No Android, toque em **Baixar o app** ou nos três pontinhos ⋮ › **Instalar app**; no iPhone, toque em **Compartilhar** › **Adicionar à Tela de Início**.",
     "**Entre** com o seu e-mail e a sua senha (a mesma conta do site; veja [[criar-conta-e-entrar|Criar conta e entrar]]).",
     "Na tela **Início** aparecem: **Para toda a equipe** (Avisos e agenda, Biblioteca, Atividades, Reunião de Escola), **Minhas responsabilidades** (as ferramentas das suas funções) e **Ver todas as áreas**.",
     "Toque no nome de uma ferramenta para abri-la; para voltar, toque em **Voltar ao app**.",
     "Toque no **?** ao lado de uma ferramenta, ou em **Ajuda**, para ler a explicação. A Ajuda tem o guia do app e uma busca por assunto.",
     "Quando houver versão nova, toque em **Atualizar agora** na faixa que aparece. A versão em uso fica no fim da tela Início."
    ],
    "exemplos": [
     "Uma pessoa da comissão de Alojamento abre o app, toca em **Minhas responsabilidades › Alojamento** e confere os pedidos de reserva do fim de semana.",
     "Quem está com um livro emprestado abre **Biblioteca** e vê a data para devolver em \"Livros comigo\"."
    ],
    "cuidados": [
     "O app é só para as **comissões e a administração**; a área aberta do site continua para todos.",
     "O idioma do app segue o do celular e pode ser trocado no fim da tela Início.",
     "Sem internet, o app mostra o que já estava carregado e envia as alterações quando a conexão voltar."
    ]
   },
   "imagens": [],
   "relacionados": [
    "painel-conecta",
    "criar-conta-e-entrar",
    "nao-consigo-entrar"
   ],
   "atualizadoEm": "2026-11-11"
  },
  {
   "id": "formularios-e-listas",
   "categoria": "conecta",
   "ordem": 2,
   "titulo": "Formulários, listas, filtros, impressão e planilhas",
   "resumo": "O funcionamento comum a todas as ferramentas: campos obrigatórios, salvar, editar, excluir, filtrar, imprimir e baixar CSV.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "formulário",
    "salvar",
    "editar",
    "excluir",
    "filtro",
    "csv",
    "imprimir",
    "planilha",
    "obrigatório",
    "pdf"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "As ferramentas da área restrita seguem o mesmo padrão: um formulário para cadastrar, uma lista com o que foi cadastrado e, em muitos casos, filtros, relatório, impressão e exportação.",
    "finalidade": "",
    "passos": [
     "**Campos com * são obrigatórios.** Se faltar algo, a mensagem em vermelho diz o quê.",
     "**Cadastrar/Adicionar/Registrar** grava um item novo. **Editar** (ícone de lápis) carrega o item no formulário; faça as mudanças e salve. **Cancelar edição** volta sem gravar.",
     "**Excluir** (ícone de lixeira) remove o item. O que for excluído fica guardado na Lixeira do sistema (Administração › Backup e Segurança).",
     "**Filtros e busca** mudam só o que aparece na tela; nada é apagado.",
     "**Imprimir** abre a janela de impressão do navegador; escolha \"Salvar como PDF\" para guardar o relatório em PDF.",
     "**Baixar (CSV)** gera uma planilha que abre no Excel, LibreOffice ou Planilhas Google (separada por ponto e vírgula)."
    ],
    "exemplos": [
     "Para mandar o inventário de uma sala por WhatsApp: filtre a localização, clique em Imprimir e salve como PDF."
    ],
    "cuidados": [
     "Estes dados ficam no servidor do Parque e aparecem para quem tem acesso, em qualquer computador ou celular. Mesmo assim, baixe o backup completo de vez em quando (veja [[backup-e-restauracao|Backup e restauração]]).",
     "Arquivos e fotos têm limite de tamanho por envio. Prefira links do Drive para materiais pesados."
    ]
   },
   "imagens": [],
   "relacionados": [
    "painel-conecta",
    "backup-e-restauracao",
    "lixeira-e-auditoria",
    "relatorios-consolidados"
   ],
   "atualizadoEm": "2026-11-11"
  },
  {
   "id": "biblioteca-gestao",
   "categoria": "comissoes",
   "ordem": 1,
   "titulo": "Biblioteca: gestão do acervo e empréstimos",
   "resumo": "Consulte o acervo, cadastre livros com capa e localização, registre empréstimos e devoluções e tire relatórios.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "biblioteca",
    "acervo",
    "livro",
    "empréstimo",
    "devolução",
    "capa",
    "estante"
   ],
   "onde": "**Comissões Parque Retiro › Biblioteca** (sub-abas Consulta do acervo, Gestão do Acervo e Livraria).",
   "secoes": {
    "oQueE": "O cadastro do acervo físico do Parque, que alimenta a página pública Biblioteca do Parque e o \"Acervo Aberto\" da página inicial.",
    "finalidade": "",
    "passos": [
     "**Consulta do acervo:** busque por título, autor ou localização; cada livro mostra quantos exemplares estão disponíveis.",
     "**Gestão do Acervo › Cadastro e edição:** preencha título, autor, status inicial, localização física, número de exemplares, resumo, foto da capa e link de leitura (opcional). Clique em **Cadastrar livro**.",
     "**Empréstimos e devoluções:** registre quem levou o livro, a data e a previsão de devolução; use **Registrar devolução** quando ele voltar.",
     "**Relatórios:** imprima ou baixe em CSV a lista de empréstimos."
    ],
    "exemplos": [
     "Status inicial \"Empréstimo\" e \"Em poder de: Maria Silva\" para um livro que já está com alguém no dia do cadastro."
    ],
    "cuidados": [
     "A localização física aparece para o público; escreva de forma que qualquer pessoa encontre (ex.: Estante B, Prateleira 2).",
     "A capa é reduzida automaticamente, mas ocupa espaço no navegador.",
     "Estes dados ficam no servidor do Parque e aparecem para quem tem acesso, em qualquer computador ou celular. Mesmo assim, baixe o backup completo de vez em quando (veja [[backup-e-restauracao|Backup e restauração]])."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/biblioteca-cadastro.jpg",
     "legenda": "1. Título · 2. Localização física (aparece para o público) · 3. Foto da capa.",
     "alt": "Captura de tela: 1. Título · 2. Localização física (aparece para o público) · 3. Foto da capa."
    }
   ],
   "relacionados": [
    "livraria-gestao",
    "biblioteca-publica",
    "formularios-e-listas"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "livraria-gestao",
   "categoria": "comissoes",
   "ordem": 2,
   "titulo": "Livraria: catálogo, vendas e pré-lançamento",
   "resumo": "Cadastre livros à venda e o estoque, registre vendas (com lançamento na Prestação de Contas) e gerencie pré-lançamentos e encomendas.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "livraria",
    "venda",
    "estoque",
    "pré-lançamento",
    "encomenda",
    "pré-venda"
   ],
   "onde": "**Biblioteca › Livraria** (sub-abas Catálogo e estoque, Registrar venda, Vendas e relatório, Pré-lançamento e encomendas).",
   "secoes": {
    "oQueE": "O estoque da Livraria é separado do acervo de empréstimo da Biblioteca. Um livro pode ficar em **pré-lançamento**: aceita encomendas antecipadas, com preço de pré-venda, pelo link de compra antecipada.",
    "finalidade": "",
    "passos": [
     "**Catálogo e estoque:** título, autor, preço de venda, exemplares em estoque e observações.",
     "Pré-lançamento (só o administrador marca): data prevista, preço de pré-venda, prazo para encomendar pelo site, frase do convite e, se quiser, um **responsável temporário** que cuida das encomendas daquele livro.",
     "**Registrar venda:** escolha o livro, a quantidade e a forma de pagamento. O administrador pode lançar a entrada na Prestação de Contas no mesmo passo.",
     "**Pré-lançamento e encomendas:** acompanhe a fila, registre pagamentos, gere o convite (e-mail e WhatsApp) e, quando os livros chegarem, use **Lançar o livro**: ele entra no estoque e as encomendas são atendidas por ordem de chegada."
    ],
    "exemplos": [],
    "cuidados": [
     "Nada é enviado às pessoas automaticamente: os convites e avisos são copiados e enviados por você.",
     "Um livro com encomendas ativas não pode deixar de ser pré-lançamento sem antes lançar ou cancelar as encomendas."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/livraria.jpg",
     "legenda": "1. Catálogo e estoque · 2. Registrar venda · 3. Pré-lançamento e encomendas.",
     "alt": "Captura de tela: 1. Catálogo e estoque · 2. Registrar venda · 3. Pré-lançamento e encomendas."
    }
   ],
   "relacionados": [
    "encomendas-livros",
    "biblioteca-gestao",
    "prestacao-contas",
    "comprar-livraria-lojinha"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "encomendas-livros",
   "categoria": "comissoes",
   "ordem": 3,
   "titulo": "Encomendas de livros (responsável temporário)",
   "resumo": "Para quem foi indicado como responsável temporário de um lançamento: registrar pagamentos, entregar e lançar o livro.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "encomenda",
    "lançamento",
    "responsável temporário",
    "pré-venda"
   ],
   "onde": "**Comissões Parque Retiro › Encomendas de livros** (aparece só para quem foi indicado).",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Abra o livro na lista.",
     "Acompanhe as encomendas por ordem de chegada; use **Registrar pagamento** quando a pessoa pagar.",
     "Use **Gerar convite** para divulgar o link de compra antecipada.",
     "Quando os livros chegarem, informe quantos exemplares chegaram em **Lançar o livro**; depois marque as entregas."
    ],
    "exemplos": [],
    "cuidados": [
     "Você vê e trabalha só as encomendas do livro indicado; o catálogo continua com o administrador.",
     "O acesso termina na data final definida pelo administrador, se houver."
    ]
   },
   "imagens": [],
   "relacionados": [
    "livraria-gestao",
    "comprar-livraria-lojinha"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "zoom-agendamento",
   "categoria": "comissoes",
   "ordem": 4,
   "titulo": "Agendar transmissões no Zoom",
   "resumo": "Registre título, data, horário, duração e link das transmissões para que a equipe tenha tudo num só lugar.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "zoom",
    "transmissão",
    "online",
    "reunião virtual",
    "link"
   ],
   "onde": "**Comissões Parque Retiro › Zoom**.",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Informe o título da atividade ou encontro.",
     "Escolha a data e o horário e a duração estimada.",
     "Cole o link do Zoom (começa com https://zoom.us/...).",
     "Clique em **Agendar**. A transmissão aparece na lista."
    ],
    "exemplos": [],
    "cuidados": [
     "O site guarda o agendamento; a reunião em si é criada na conta do Zoom."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/zoom.jpg",
     "legenda": "1. Título · 2. Data e horário · 3. Link do Zoom.",
     "alt": "Captura de tela: 1. Título · 2. Data e horário · 3. Link do Zoom."
    }
   ],
   "relacionados": [
    "reuniao-de-escola",
    "documentos-calendarios"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "reservas-alojamento",
   "categoria": "comissoes",
   "ordem": 5,
   "titulo": "Alojamento: pedidos, ocupação e recebimentos",
   "resumo": "Registre os pedidos recebidos, distribua as camas, encaminhe para a ASSEFAZ quando preciso e lance os recebimentos.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "reserva",
    "alojamento",
    "cama",
    "quarto",
    "assefaz",
    "hospedagem",
    "recebimento",
    "ocupação"
   ],
   "onde": "**Comissões Parque Retiro › Alojamento** (Administrador e Responsável de Reservas).",
   "secoes": {
    "oQueE": "Os pedidos chegam por e-mail ou WhatsApp (formulário público) e são registrados aqui. A aba Ocupação mostra os quartos (Paz, Força, Alegria) e a ASSEFAZ, local externo próximo usado quando falta cama.",
    "finalidade": "",
    "passos": [
     "**Registrar pedido:** copie os dados do e-mail/WhatsApp (nome, contato, chegada, saída, pessoas, necessidades) e salve.",
     "**Pedidos:** confira os aguardando resposta, indique as camas e clique em **Confirmar** ou **Recusar**. **Alterar camas** muda a distribuição de um pedido confirmado.",
     "**Ocupação:** escolha a data para ver quem está em cada cama. Para a ASSEFAZ: **Encaminhar** deixa a pessoa \"Em alinhamento\"; depois registre **Aceitou** ou **Não quis**.",
     "**Relatório e recebimentos:** registre os valores recebidos (eles viram Entradas na Prestação de Contas, centro Alojamento), filtre o período, imprima ou baixe CSV."
    ],
    "exemplos": [
     "Pessoa com dificuldade de locomoção: marque \"Precisa de cama de baixo\" para facilitar a distribuição."
    ],
    "cuidados": [
     "Pedidos com recebimentos lançados não podem ser excluídos: exclua antes os recebimentos.",
     "O Calendário de uso público não é atualizado sozinho por esta ferramenta (veja [[atualizar-conteudos-do-site|Atualização do site]]).",
     "Estes dados ficam no servidor do Parque e aparecem para quem tem acesso, em qualquer computador ou celular. Mesmo assim, baixe o backup completo de vez em quando (veja [[backup-e-restauracao|Backup e restauração]])."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/reservas-abas.jpg",
     "legenda": "1. Pedidos · 2. Ocupação (camas e ASSEFAZ) · 3. Registrar pedido · 4. Relatório e recebimentos.",
     "alt": "Captura de tela: 1. Pedidos · 2. Ocupação (camas e ASSEFAZ) · 3. Registrar pedido · 4. Relatório e recebimentos."
    }
   ],
   "relacionados": [
    "pedir-reserva",
    "prestacao-contas",
    "calendario-de-uso"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "estela-gestao",
   "categoria": "comissoes",
   "ordem": 6,
   "titulo": "Estela: cadastro e publicação de nomes",
   "resumo": "Etapa 1: cadastrar quem contribuiu com a construção do Parque. Etapa 2: decidir quais nomes ficam públicos na Estela Virtual.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "estela",
    "nomes",
    "homenagem",
    "contribuição",
    "publicar"
   ],
   "onde": "**Comissões Parque Retiro › Elementos › Estela** (Responsável pela Estela).",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "**1. Cadastro de pessoas:** nome completo, tipo de contribuição (direta/indireta), como contribuiu, período, cidade/comunidade, contato e observações internas. Clique em **Salvar cadastro**.",
     "Para muitos nomes de uma vez, abra **Cadastrar vários nomes de uma vez**, cole um nome por linha e confirme; complete os dados depois.",
     "**2. Publicação na Estela:** filtre \"Aguardando decisão\", marque os nomes e clique em **Tornar públicos os selecionados** ou **Manter privados os selecionados**.",
     "Confira o resultado em **Estela Virtual**."
    ],
    "exemplos": [],
    "cuidados": [
     "Nada fica público na Etapa 1.",
     "Observações internas e contatos nunca aparecem no site."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/estela.jpg",
     "legenda": "1. Etapa 1: cadastro · 2. Etapa 2: publicação · 3. Nome completo.",
     "alt": "Captura de tela: 1. Etapa 1: cadastro · 2. Etapa 2: publicação · 3. Nome completo."
    }
   ],
   "relacionados": [
    "estela-virtual",
    "elementos-descricoes"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "elementos-descricoes",
   "categoria": "comissoes",
   "ordem": 7,
   "titulo": "Elementos do Parque: descrições",
   "resumo": "Cada elemento (Sala, Monólito, Portão, Fonte, Centro de Trabalho, Centro de Estudos, Oficinas) tem um campo de descrição.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "elementos",
    "sala",
    "monólito",
    "portão",
    "fonte",
    "oficinas",
    "descrição"
   ],
   "onde": "**Comissões Parque Retiro › Elementos** (caixa ao lado do botão).",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Abra o grupo **Elementos** e escolha o elemento.",
     "Escreva o que o elemento fará e para que servirá.",
     "Clique em **Salvar descrição**. A data e quem atualizou aparecem abaixo."
    ],
    "exemplos": [],
    "cuidados": [
     "Leitores veem; só Editores e Administradores alteram."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/elemento.jpg",
     "legenda": "Descrição do elemento (aqui, a Sala).",
     "alt": "Captura de tela: Descrição do elemento (aqui, a Sala)."
    }
   ],
   "relacionados": [
    "estela-gestao",
    "painel-conecta"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "album-gestao",
   "categoria": "comissoes",
   "ordem": 8,
   "titulo": "Álbum Parque Retiro: envio e curadoria",
   "resumo": "Envie fotos, organize por atividade e faça a curadoria: publicar, recusar ou retirar da área aberta.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "álbum",
    "fotos",
    "curadoria",
    "publicar",
    "atividade",
    "imagem"
   ],
   "onde": "**Comissões Parque Retiro › Álbum Parque Retiro**.",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "**Enviar e minhas fotos:** escolha até 10 fotos, a atividade (ou crie uma nova), o dia, o autor, se o nome do autor aparece e uma legenda opcional. Clique em **Enviar fotos**.",
     "**Fotos por atividade:** veja todas as fotos agrupadas.",
     "**Curadoria** (Responsável pelo Álbum): filtre **Aguardando**, e para cada foto clique em **Publicar** ou **Recusar**. **Retirar da área aberta** despublica.",
     "**Atividades:** crie, renomeie ou exclua as atividades usadas para organizar as fotos."
    ],
    "exemplos": [],
    "cuidados": [
     "As fotos são reduzidas para caber no navegador, mas ocupam espaço; publique as melhores.",
     "Prefira fotos com autorização de imagem das pessoas.",
     "Estes dados ficam no servidor do Parque e aparecem para quem tem acesso, em qualquer computador ou celular. Mesmo assim, baixe o backup completo de vez em quando (veja [[backup-e-restauracao|Backup e restauração]])."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/album.jpg",
     "legenda": "1. Enviar e minhas fotos · 2. Curadoria · 3. Escolher as fotos.",
     "alt": "Captura de tela: 1. Enviar e minhas fotos · 2. Curadoria · 3. Escolher as fotos."
    }
   ],
   "relacionados": [
    "enviar-fotos-album",
    "atividades-gestao",
    "arquivo-ou-imagem-recusado"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "documentos-calendarios",
   "categoria": "comissoes",
   "ordem": 9,
   "titulo": "Documentos e Calendários: atas, encaminhamentos e calendários",
   "resumo": "Registre as atas da Reunião de Escola com seus encaminhamentos e cadastre atividades que aparecem nos calendários semanal a anual.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "ata",
    "encaminhamento",
    "calendário",
    "semanal",
    "mensal",
    "anual",
    "data fixa",
    "documento"
   ],
   "onde": "**Comissões Parque Retiro › Documentos e Calendários**.",
   "secoes": {
    "oQueE": "As atividades são cadastradas uma só vez e aparecem automaticamente nos calendários semanal, mensal, trimestral, semestral e anual. Datas fixas anuais (como 4 de maio) aparecem em todos os anos.",
    "finalidade": "",
    "passos": [
     "**Atas das Reuniões de Escola:** **Novo documento**, preencha os dados e, em **Encaminhamentos da ata**, registre o que ficou combinado (texto, responsável, prazo, situação).",
     "Marque **Levar para o calendário** (com data) para o encaminhamento virar atividade no calendário.",
     "Use o filtro **Só atas com encaminhamentos em aberto** para acompanhar pendências; os vencidos aparecem como \"Em atraso\".",
     "**Calendários:** navegue por semana, mês, trimestre, semestre ou ano. **Nova atividade** cadastra uma atividade; o botão de megafone leva para **Planejar publicações** daquela data.",
     "**Datas fixas anuais** (no Calendário Anual): informe dia, mês e nome e clique em **Adicionar data fixa**."
    ],
    "exemplos": [],
    "cuidados": [
     "Quem cuida só da Comunicação vê as atividades, nunca o conteúdo das atas.",
     "Remover um encaminhamento da ata não apaga a atividade do calendário."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/documentos.jpg",
     "legenda": "1. Atas · 2. Calendários · 3. Novo documento · 4. Só atas com encaminhamentos em aberto.",
     "alt": "Captura de tela: 1. Atas · 2. Calendários · 3. Novo documento · 4. Só atas com encaminhamentos em aberto."
    }
   ],
   "relacionados": [
    "reuniao-de-escola",
    "calendario-comunicacao",
    "atividades-gestao"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "atividades-gestao",
   "categoria": "comissoes",
   "ordem": 10,
   "titulo": "Atividades: registrar e publicar no site",
   "resumo": "Cadastre eventos, encontros, retiros e reuniões (e atividades externas) e publique-os em O Parque › Atividades.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "atividade",
    "evento",
    "encontro",
    "retiro",
    "publicar",
    "banner",
    "notícia"
   ],
   "onde": "**Comissões Parque Retiro › Atividades** (edita: Responsável pelas Atividades ou administrador).",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Clique em **Nova atividade**.",
     "Preencha título, tipo, onde acontece (no Parque ou externa), data, local, lide (resumo), texto, foto pequena e autor.",
     "Para destacar no carrossel do Início, marque **Destacar no banner do Início** e envie a imagem de banner.",
     "Escolha a situação: **rascunho** (só na área restrita) ou **publicada** (aparece no site).",
     "Use **Mostrar** para filtrar por tipo; **Editar** e **Excluir** em cada atividade."
    ],
    "exemplos": [],
    "cuidados": [
     "No máximo 5 atividades aparecem no carrossel do Início.",
     "As imagens ficam dentro do registro: use fotos leves."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/atividades.jpg",
     "legenda": "1. Nova atividade · 2. Filtrar por tipo.",
     "alt": "Captura de tela: 1. Nova atividade · 2. Filtrar por tipo."
    }
   ],
   "relacionados": [
    "atividades-publicas",
    "album-gestao",
    "documentos-calendarios"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "reuniao-de-escola",
   "categoria": "comissoes",
   "ordem": 11,
   "titulo": "Reunião de Escola: datas, presença e temas",
   "resumo": "Pesquisa de datas, confirmação de presença (presencial ou virtual) e temas propostos pelos Mestres.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "reunião",
    "escola",
    "presença",
    "votação",
    "data",
    "tema"
   ],
   "onde": "**Comissões Parque Retiro › Reunião de Escola**.",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "O administrador ou o Responsável pelas Atividades clica em **Nova reunião** e propõe dois dias de fim de semana.",
     "Cada Mestre abre a reunião, vota nas datas e confirma presença (presencial ou virtual) em **Salvar resposta**.",
     "Qualquer Mestre pode **Propor tema**.",
     "Com a data decidida, use **Salvar a data**; depois, **Marcar como realizada**. **Copiar texto** prepara o convite para o WhatsApp."
    ],
    "exemplos": [],
    "cuidados": [
     "Votos e presenças aparecem com o nome de cada pessoa."
    ]
   },
   "imagens": [],
   "relacionados": [
    "documentos-calendarios",
    "grupos-discussao",
    "zoom-agendamento"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "grupos-discussao",
   "categoria": "comissoes",
   "ordem": 12,
   "titulo": "Grupos de Discussão",
   "resumo": "Grupos por tema para conversar, votar enquetes, confirmar presença e aprovar publicações, dentro da área restrita.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "grupo",
    "discussão",
    "mensagem",
    "enquete",
    "votação",
    "convite"
   ],
   "onde": "**Comissões Parque Retiro › Grupos de Discussão**.",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Clique em **Criar grupo**, dê um nome e convide os membros.",
     "No grupo, escreva mensagens, responda, publique enquetes e pedidos de confirmação de presença.",
     "Textos para publicação podem ir **para votação**; os membros clicam em **Aprovo** ou **Não aprovo**.",
     "Uma publicação aprovada é publicada manualmente: **Copiar texto** e **Marcar como publicada**."
    ],
    "exemplos": [],
    "cuidados": [
     "Não há ligação com o WhatsApp: os recursos funcionam só dentro da área restrita.",
     "A entrada é por convite de quem criou o grupo."
    ]
   },
   "imagens": [],
   "relacionados": [
    "reuniao-de-escola",
    "painel-publicacoes"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "multiuso-gestao",
   "categoria": "comissoes",
   "ordem": 13,
   "titulo": "Multiuso: agenda, planejamentos, regras e documentos",
   "resumo": "Organize o uso do espaço multiuso: agenda, planos de melhoria, regras de uso e documentos.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "multiuso",
    "agenda",
    "espaço",
    "planejamento",
    "regras"
   ],
   "onde": "**Comissões Parque Retiro › Multiuso** (edita: Responsável pelo Multiuso ou administrador).",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "**Agenda de uso:** data, horários, atividade, quem vai usar, responsável e situação (Reservado, Realizado, Cancelado). **Adicionar à agenda**.",
     "**Planejamentos:** título, período, situação, responsável, voluntários, materiais e descrição.",
     "**Regras e informações:** responsável pelo espaço, contato, regras de uso e observações. **Salvar**.",
     "**Documentos:** título, categoria, data, link (Drive) e/ou arquivo até 1 MB."
    ],
    "exemplos": [],
    "cuidados": [
     "Quem não é responsável só consulta.",
     "Estes dados ficam no servidor do Parque e aparecem para quem tem acesso, em qualquer computador ou celular. Mesmo assim, baixe o backup completo de vez em quando (veja [[backup-e-restauracao|Backup e restauração]])."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/multiuso.jpg",
     "legenda": "1. Agenda de uso · 2. Data · 3. Situação.",
     "alt": "Captura de tela: 1. Agenda de uso · 2. Data · 3. Situação."
    }
   ],
   "relacionados": [
    "jardinagem-gestao",
    "voluntarios-gestao",
    "formularios-e-listas"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "jardinagem-gestao",
   "categoria": "comissoes",
   "ordem": 14,
   "titulo": "Jardinagem / Área Externa",
   "resumo": "Planejamentos de jardinagem e de reflorestamento, documentos e resumo das ações.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "jardinagem",
    "reflorestamento",
    "mudas",
    "plantio",
    "área externa"
   ],
   "onde": "**Comissões Parque Retiro › Jardinagem / Área Externa** (edita: Responsável pela Jardinagem ou administrador).",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "**Planejamento de jardinagem:** título, local, período, situação, responsável, voluntários necessários, materiais e descrição.",
     "**Planejamento de reflorestamento:** os mesmos dados e mais espécies a plantar e quantidade de mudas.",
     "**Documentos:** mapas, licenças e orientações (link e/ou arquivo até 1 MB).",
     "**Resumo:** contagem por situação, mudas, voluntários necessários e próximas ações; imprima ou baixe CSV."
    ],
    "exemplos": [],
    "cuidados": [
     "Confira as espécies com orientação técnica antes de plantar."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/jardinagem.jpg",
     "legenda": "1. Jardinagem · 2. Reflorestamento · 3. Resumo.",
     "alt": "Captura de tela: 1. Jardinagem · 2. Reflorestamento · 3. Resumo."
    }
   ],
   "relacionados": [
    "voluntarios-gestao",
    "multiuso-gestao"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "comissoes-internas",
   "categoria": "comissoes",
   "ordem": 14,
   "titulo": "Construção, Manutenção e Traduções",
   "resumo": "Comissões que existem só na área restrita: lista de trabalhos, documentos e resumo de cada uma.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "construção",
    "obra",
    "manutenção",
    "conserto",
    "tradução",
    "idioma"
   ],
   "onde": "**Comissões Parque Retiro › Construção**, **› Manutenção** e **› Traduções** (vê e edita: o responsável de cada comissão ou o administrador).",
   "secoes": {
    "oQueE": "Três comissões internas do Parque. Elas não têm página pública nem aparecem no menu do site: existem só aqui, na área restrita.",
    "finalidade": "Organizar o trabalho de cada comissão num lugar só, com prazos, responsáveis e documentos.",
    "passos": [
     "**Construção › Obras e etapas:** título, local, início e fim previstos, situação, responsável, custo estimado, voluntários e materiais.",
     "**Manutenção › Pedidos de manutenção:** título, local, data do pedido, prazo, tipo (corretiva ou preventiva), prioridade, custo e peças.",
     "**Traduções › Traduções:** título, idioma de origem e de destino, tradutor(a), revisor(a), prazo e link do material.",
     "**Documentos:** projetos, orçamentos, manuais, textos originais e traduções (link e/ou arquivo até 1 MB).",
     "**Resumo:** contagem por situação, itens em aberto, prazos vencidos, custo estimado e próximos prazos; imprima ou baixe CSV."
    ],
    "exemplos": [],
    "cuidados": [
     "Para alguém ver e editar uma comissão, o administrador marca a responsabilidade correspondente em Gestão de Responsáveis."
    ]
   },
   "imagens": [],
   "relacionados": [
    "jardinagem-gestao",
    "multiuso-gestao",
    "niveis-e-responsabilidades"
   ],
   "atualizadoEm": "2026-11-05"
  },
  {
   "id": "lojinha-gestao",
   "categoria": "comissoes",
   "ordem": 15,
   "titulo": "Lojinha: produtos, custos, vendas e relatório",
   "resumo": "Cadastre produtos e estoque, calcule custo e preço sugerido, registre vendas e acompanhe o relatório.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "lojinha",
    "produto",
    "estoque",
    "venda",
    "preço",
    "custo",
    "margem"
   ],
   "onde": "**Comissões Parque Retiro › Ajude o Parque › Lojinha** (Responsável pela Lojinha).",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "**Produtos e estoque:** nome, descrição, categoria, como o produto chega (pronto ou produzido), preço, unidades e foto. Marque **Publicar no site** para aparecer na página Lojinha. **+ Repor** acrescenta estoque.",
     "**Custos e preço:** lance os custos e a quantidade do lote e a margem; **Aplicar preço sugerido** atualiza o preço.",
     "**Registrar venda:** produto, quantidade e forma de pagamento; o estoque baixa sozinho.",
     "**Vendas e relatório:** situação por produto e vendas; **Lançar** leva a venda à Prestação de Contas; imprima ou baixe CSV."
    ],
    "exemplos": [],
    "cuidados": [
     "Sem estoque, o produto aparece como Esgotado no site."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/lojinha.jpg",
     "legenda": "1. Nome do produto · 2. Preço · 3. Publicar no site.",
     "alt": "Captura de tela: 1. Nome do produto · 2. Preço · 3. Publicar no site."
    }
   ],
   "relacionados": [
    "comprar-livraria-lojinha",
    "prestacao-contas",
    "ajude-visao-geral"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "rifa-gestao",
   "categoria": "comissoes",
   "ordem": 16,
   "titulo": "Rifa Solidária: cadastro, conferência e sorteio",
   "resumo": "Cadastre a rifa, confira comprovantes, apure o sorteio pela Loteria Federal e preste contas do uso do recurso.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "rifa",
    "sorteio",
    "loteria federal",
    "participante",
    "comprovante",
    "arrecadação"
   ],
   "onde": "**Comissões Parque Retiro › Ajude o Parque › Rifa Solidária** (Responsável pela Rifa).",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "**Rifas:** título, descrição e foto do prêmio, valor do número, quantidade de números (10, 100 ou 1.000), dia do sorteio (quartas e sábados, Loteria Federal), formas de pagamento e instruções. Marque **Aberta no site**.",
     "**Participantes:** baixe o comprovante e clique em **Confirmar** ou **Recusar** (com motivo; os números voltam a ficar livres). Vendas presenciais: **Registrar participação manual**.",
     "Cada confirmação vira, sozinha, uma Entrada na Prestação de Contas (centro Campanhas). **Estornar** desfaz.",
     "**Sorteio:** no dia, o sistema tenta buscar o resultado; se não conseguir, digite os 5 prêmios e clique em **Apurar com os números digitados**.",
     "**Arrecadação** e **Uso do recurso:** totais por forma de pagamento, conferência com a Prestação de Contas e registro de como o dinheiro foi usado."
    ],
    "exemplos": [],
    "cuidados": [
     "Só números confirmados concorrem.",
     "Depois da apuração, as participações não mudam; só o administrador anula uma apuração (com motivo).",
     "Rifa com venda de números pode exigir autorização legal: confirme com a assessoria jurídica antes de divulgar."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/rifa.jpg",
     "legenda": "1. Quantidade de números · 2. Dia do sorteio · 3. Aberta no site.",
     "alt": "Captura de tela: 1. Quantidade de números · 2. Dia do sorteio · 3. Aberta no site."
    }
   ],
   "relacionados": [
    "participar-rifa",
    "vaquinha-gestao",
    "prestacao-contas"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "vaquinha-gestao",
   "categoria": "comissoes",
   "ordem": 17,
   "titulo": "Vaquinha Coletiva: metas, contribuições e arrecadação",
   "resumo": "Cadastre vaquinhas com meta, confira as contribuições e acompanhe o gráfico e a planilha consolidada.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "vaquinha",
    "meta",
    "contribuição",
    "arrecadação",
    "gráfico"
   ],
   "onde": "**Comissões Parque Retiro › Ajude o Parque › Vaquinha Coletiva** (Responsável pela Vaquinha).",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "**Vaquinhas:** nome, objetivo, meta em reais, prazo (opcional), formas de pagamento, instruções e outras formas de ajudar. Marque **Aberta no site**.",
     "**Contribuições:** baixe o comprovante, **Confirmar** ou **Recusar** (com motivo). **Estornar** desfaz uma confirmada. Valores recebidos em mãos: **Registrar contribuição manual**.",
     "**Arrecadação:** gráfico da meta, totais por forma de pagamento e conferência com a Prestação de Contas (**Lançar agora** se faltar algum lançamento)."
    ],
    "exemplos": [],
    "cuidados": [
     "Só o confirmado conta no gráfico e na planilha.",
     "M$ (Mumbuca) soma 1 para 1 com o real no gráfico.",
     "**Encerrar** para de receber, mas mantém o resultado no site; **Cancelar** tira do site."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/vaquinha.jpg",
     "legenda": "1. Meta · 2. Instruções de pagamento · 3. Aberta no site.",
     "alt": "Captura de tela: 1. Meta · 2. Instruções de pagamento · 3. Aberta no site."
    }
   ],
   "relacionados": [
    "contribuir-vaquinha",
    "rifa-gestao",
    "prestacao-contas"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "voluntarios-gestao",
   "categoria": "comissoes",
   "ordem": 18,
   "titulo": "Voluntários inscritos e Ações de Voluntário",
   "resumo": "Acompanhe as inscrições de voluntários e crie as ações em que eles podem ajudar.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "voluntário",
    "inscrição",
    "ação",
    "mutirão",
    "contato"
   ],
   "onde": "**Comissões Parque Retiro › Ajude o Parque › Voluntário** (Responsável pelos Voluntários).",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "**Voluntários inscritos:** filtre por situação e forma de colaborar, ou busque pelo nome.",
     "Mude a situação (Novo, Em contato, Voluntário(a) ativo(a), Sem retorno) e faça anotações. **Baixar (CSV)** exporta a lista.",
     "**Ações de Voluntário:** informe nome da ação, objetivo, plano (etapas, local, pessoas, materiais) e tempo de duração. Clique em **Criar ação**."
    ],
    "exemplos": [],
    "cuidados": [
     "Os dados de voluntários são pessoais: use-os só para o contato sobre o voluntariado.",
     "Por enquanto, as páginas abertas do site ainda não estão ligadas ao servidor: a inscrição feita no site fica no navegador de quem se inscreveu (veja [[onde-ficam-os-dados|Onde ficam os dados]])."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/voluntarios.jpg",
     "legenda": "Ações de Voluntário: 1. Nome · 2. Objetivo · 3. Plano.",
     "alt": "Captura de tela: Ações de Voluntário: 1. Nome · 2. Objetivo · 3. Plano."
    }
   ],
   "relacionados": [
    "ser-voluntario",
    "jardinagem-gestao",
    "ajude-visao-geral"
   ],
   "atualizadoEm": "2026-11-11"
  },
  {
   "id": "ajude-visao-geral",
   "categoria": "comissoes",
   "ordem": 19,
   "titulo": "Ajude o Parque (visão geral)",
   "resumo": "Cartões com todas as vias de ajuda que você acompanha: Lojinha, Rifa, Vaquinha e Voluntário.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "ajude o parque",
    "visão geral"
   ],
   "onde": "**Comissões Parque Retiro › Ajude o Parque › Ajude o Parque (visão geral)**.",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Abra a visão geral.",
     "Clique em **Abrir** no cartão da ferramenta que deseja."
    ],
    "exemplos": [],
    "cuidados": []
   },
   "imagens": [],
   "relacionados": [
    "lojinha-gestao",
    "rifa-gestao",
    "vaquinha-gestao",
    "voluntarios-gestao"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "comunicacao-visao-geral",
   "categoria": "comunicacao",
   "ordem": 1,
   "titulo": "Comunicação, Redes Sociais e Site: visão geral",
   "resumo": "Do encaminhamento da ata à publicação: planeje, produza, publique e meça a comunicação do Parque num só lugar.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "comunicação",
    "redes sociais",
    "instagram",
    "facebook",
    "whatsapp",
    "publicação",
    "campanha"
   ],
   "onde": "**Comissões Parque Retiro › Comunicação, Redes Sociais e Site** (administrador, Responsável pela Comunicação e convidados).",
   "secoes": {
    "oQueE": "A ferramenta tem 12 sub-abas: Calendário de Comunicação, Publicações, Criar a partir do calendário, Redes sociais, Projetos e campanhas, Tipos de publicação, Datas fixas anuais, Site, Equipe e convidados, Arquivos, Indicadores e Conectores.",
    "finalidade": "Ata → atividade no calendário → ação de comunicação (canais e formatos) → materiais → fila de publicação → publicada → relatório.",
    "passos": [
     "Planeje no [[calendario-comunicacao|Calendário de Comunicação]] ou crie publicações a partir das atividades.",
     "Organize as ações por canal e formato em [[painel-publicacoes|Publicações]].",
     "Configure os [[banners-do-site|banners do site]] na sub-aba Site.",
     "Acompanhe a fila de publicação e registre o link de cada postagem.",
     "Meça os resultados em Indicadores e nos Relatórios Consolidados."
    ],
    "exemplos": [],
    "cuidados": [
     "O sistema organiza e lembra; **não publica sozinho** nas redes sociais."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/comunicacao.jpg",
     "legenda": "As 12 sub-abas da Comunicação.",
     "alt": "Captura de tela: As 12 sub-abas da Comunicação."
    }
   ],
   "relacionados": [
    "calendario-comunicacao",
    "painel-publicacoes",
    "banners-do-site",
    "equipe-convidados"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "calendario-comunicacao",
   "categoria": "comunicacao",
   "ordem": 2,
   "titulo": "Calendário de Comunicação e Criar a partir do calendário",
   "resumo": "Veja as publicações junto das atividades do Parque e gere publicações a partir de uma atividade ou data.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "calendário",
    "publicação",
    "planejar",
    "data"
   ],
   "onde": "**Comunicação › Calendário de Comunicação** e **Criar a partir do calendário**.",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Escolha a **Visão** (semanal a anual), o ano e o mês; filtre por rede, status ou projeto.",
     "**Nova publicação** cria uma publicação avulsa.",
     "Em **Criar a partir do calendário**, escolha a atividade ou data e as redes: o sistema cria uma publicação para cada rede, com status \"Ideia\", para você completar."
    ],
    "exemplos": [],
    "cuidados": []
   },
   "imagens": [],
   "relacionados": [
    "comunicacao-visao-geral",
    "painel-publicacoes",
    "documentos-calendarios"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "painel-publicacoes",
   "categoria": "comunicacao",
   "ordem": 3,
   "titulo": "Publicações: painel por canal, fila e lista",
   "resumo": "Crie ações de comunicação com vários canais e formatos, prepare os materiais e acompanhe a fila até a publicação.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "painel",
    "fila",
    "publicação",
    "canal",
    "formato",
    "checklist",
    "ics",
    "agenda"
   ],
   "onde": "**Comunicação › Publicações** (botões Painel por canal e formato, Fila de publicação e Lista de publicações).",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "**Nova ação de comunicação:** título, data prevista, projeto/campanha, texto base e link da mídia.",
     "Marque os canais (Instagram, Facebook, YouTube, WhatsApp Canal/Comunidade/Grupo...) e escolha o formato de cada um; defina o status (Ideia → Publicada).",
     "Preencha a pasta dos materiais e o checklist (briefing, texto aprovado, arte pronta, autorização de imagem).",
     "Em **Próximas atividades sem comunicação planejada**, use **Planejar** para criar a ação já preenchida.",
     "**Fila de publicação:** atrasadas, hoje, próximos 7 dias e 30 dias. **Copiar texto**, publicar na rede e **Marcar como publicada** com o link. **Baixar agenda (.ics)** leva os lembretes para o seu calendário.",
     "**Lista de publicações:** todas as publicações, com mudança de status direto na lista."
    ],
    "exemplos": [],
    "cuidados": [
     "Desmarcar um canal e salvar remove apenas a publicação daquele canal.",
     "Ao aprovar ou publicar com checklist incompleto o sistema avisa, mas não bloqueia."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/publicacoes.jpg",
     "legenda": "1. Painel · 2. Fila de publicação · 3. Lista · 4. Nova ação de comunicação.",
     "alt": "Captura de tela: 1. Painel · 2. Fila de publicação · 3. Lista · 4. Nova ação de comunicação."
    }
   ],
   "relacionados": [
    "calendario-comunicacao",
    "banners-do-site",
    "equipe-convidados"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "banners-do-site",
   "categoria": "comunicacao",
   "ordem": 4,
   "titulo": "Banners do site: configurar e publicar",
   "resumo": "Cada página tem um espaço de banner (fixo ou carrossel) com medida exata; depois de configurar, baixe o pacote e publique na hospedagem.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "banner",
    "carrossel",
    "imagem",
    "site",
    "pacote",
    "zip",
    "medida"
   ],
   "onde": "**Comunicação › Site**.",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Clique em **Configurar** na página desejada. Veja a medida exata (ex.: 1600 × 533 px).",
     "Escolha **Fixo** (1 imagem) ou **Carrossel** (até 8 imagens, troca de 2 a 30 s).",
     "Envie as imagens (JPG, PNG ou WebP, até 15 MB) com a proporção certa; preencha a descrição (acessibilidade) e o link opcional.",
     "Salve e confira a pré-visualização (aparece só para você, com a etiqueta \"Pré-visualização\").",
     "Clique em **Baixar pacote para publicar (.zip)**, descompacte e copie a pasta **banners** para a pasta do site na hospedagem."
    ],
    "exemplos": [],
    "cuidados": [
     "Imagem com outra proporção é recusada (o sistema explica a medida certa).",
     "O público só vê o que estiver na pasta banners publicada.",
     "Páginas sem configuração continuam com o banner original."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/banners.jpg",
     "legenda": "1. Baixar pacote para publicar · 2. Configurar o banner de uma página.",
     "alt": "Captura de tela: 1. Baixar pacote para publicar · 2. Configurar o banner de uma página."
    }
   ],
   "relacionados": [
    "atualizar-conteudos-do-site",
    "painel-publicacoes",
    "arquivo-ou-imagem-recusado"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "equipe-convidados",
   "categoria": "comunicacao",
   "ordem": 5,
   "titulo": "Equipe e convidados",
   "resumo": "Autorize pessoas a colaborar em projetos específicos como autor, revisor, aprovador ou publicador, com prazo de validade.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "equipe",
    "convite",
    "autor",
    "revisor",
    "aprovador",
    "publicador",
    "permissão"
   ],
   "onde": "**Comunicação › Equipe e convidados**.",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Defina as regras gerais: **Quem criou a publicação não pode aprová-la** (recomendado) e o interruptor de emergência **Pausar toda publicação automática**.",
     "Em **Novo convite**, informe o e-mail (o mesmo da conta na área restrita), nome, tipo, funções e projetos, e a data **Válido até**.",
     "Confirme que a pessoa foi autorizada previamente pelo Instituto e clique em **Autorizar convite**."
    ],
    "exemplos": [],
    "cuidados": [
     "O convidado vê só os projetos indicados e só até a data de validade."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/equipe.jpg",
     "legenda": "1. Quem criou não aprova · 2. E-mail do convidado · 3. Válido até.",
     "alt": "Captura de tela: 1. Quem criou não aprova · 2. E-mail do convidado · 3. Válido até."
    }
   ],
   "relacionados": [
    "painel-publicacoes",
    "niveis-e-responsabilidades"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "cadastros-comunicacao",
   "categoria": "comunicacao",
   "ordem": 6,
   "titulo": "Redes sociais, projetos, tipos de publicação e datas fixas",
   "resumo": "As listas que alimentam a Comunicação: canais, campanhas, formatos e datas que se repetem todo ano.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "redes sociais",
    "projetos",
    "campanha",
    "tipos",
    "formato",
    "datas fixas"
   ],
   "onde": "Sub-abas **Redes sociais**, **Projetos e campanhas**, **Tipos de publicação** e **Datas fixas anuais**.",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Edite o nome, o ícone e a cor das redes; desmarque **Ativa** para esconder uma rede sem apagar o histórico.",
     "Cadastre os projetos/campanhas para filtrar publicações e convidar colaboradores.",
     "Tipos de publicação são os formatos (post, carrossel, reels, stories, banner...). Em Publicações, **Configurar quais formatos cada canal oferece** define o que aparece para cada canal.",
     "Datas fixas anuais aparecem em todos os calendários de todos os anos."
    ],
    "exemplos": [],
    "cuidados": [
     "Prefira desativar a excluir, para não perder a referência das publicações antigas."
    ]
   },
   "imagens": [],
   "relacionados": [
    "painel-publicacoes",
    "documentos-calendarios"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "arquivos-indicadores-conectores",
   "categoria": "comunicacao",
   "ordem": 7,
   "titulo": "Arquivos, Indicadores e Conectores",
   "resumo": "Cadastre materiais com direitos de uso, registre os números das redes e veja as regras para futuras publicações automáticas.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "arquivos",
    "direitos",
    "licença",
    "indicadores",
    "métricas",
    "conectores"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "**Arquivos:** nome, tipo, link (Drive), origem, direitos e licença (obrigatório para material de terceiros) e se aparecem pessoas na imagem.",
     "**Indicadores:** registre os números (alcance, curtidas...) por canal e por projeto.",
     "**Conectores:** regras que o servidor aplicará antes de qualquer publicação automática (ainda não ligadas)."
    ],
    "exemplos": [],
    "cuidados": [
     "Imagem com pessoas exige autorização de uso de imagem."
    ]
   },
   "imagens": [],
   "relacionados": [
    "painel-publicacoes",
    "comunicacao-visao-geral"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "listas-email",
   "categoria": "comunicacao",
   "ordem": 8,
   "titulo": "Listas de e-mail e Comunicado por e-mail",
   "resumo": "Organize os contatos por lista e gere o Comunicado por e-mail para enviar pelo seu serviço de e-mail.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "e-mail",
    "lista",
    "comunicado",
    "newsletter",
    "contatos",
    "importar",
    "métricas"
   ],
   "onde": "**Comissões Parque Retiro › Listas de e-mail** e o botão **Gerar Comunicado por e-mail** nas ferramentas.",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Escolha a lista (Visitante, Aderente, Interessados em lançamentos, Postulantes, Mestres 1, Mestres Comissão).",
     "Adicione um contato ou use **Importar** (um por linha: e-mail, ou nome;e-mail).",
     "**Gerar Comunicado por e-mail:** escolha a lista e o conteúdo; copie o HTML e os destinatários.",
     "Cole no seu serviço de envio (Mailchimp, Brevo, Gmail...) usando os destinatários em cópia oculta (CCO).",
     "Depois de enviar, registre os números em **Métricas**; eles ficam em **Comunicados enviados e métricas**."
    ],
    "exemplos": [],
    "cuidados": [
     "O site ainda não envia e-mails sozinho.",
     "Respeite os pedidos de descadastro."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/listas-email.jpg",
     "legenda": "1. Escolha a lista · 2. Importar vários contatos.",
     "alt": "Captura de tela: 1. Escolha a lista · 2. Importar vários contatos."
    }
   ],
   "relacionados": [
    "receber-comunicado",
    "comunicacao-visao-geral"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "prestacao-contas",
   "categoria": "admin",
   "ordem": 1,
   "titulo": "Prestação de Contas: lançamentos, centros de custo e contribuições",
   "resumo": "Registre entradas e saídas do Instituto Pangeia por centro de custo e tipo de operação, com comprovante, e acompanhe as contribuições mensais.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "prestação de contas",
    "financeiro",
    "lançamento",
    "entrada",
    "saída",
    "centro de custo",
    "comprovante",
    "contribuição mensal"
   ],
   "onde": "**Administração › Prestação de Contas** (administrador e Responsável Financeiro).",
   "secoes": {
    "oQueE": "O livro-caixa do Parque. Cada lançamento tem centro de custo (Manutenção, Construção, Eventos, Campanhas, Alojamento...), tipo de operação (entrada ou saída), valor, forma de pagamento, data, descrição e comprovante. Vendas, rifas, vaquinhas e recebimentos do alojamento podem gerar lançamentos sozinhos.",
    "finalidade": "Transparência: saber quanto entrou, quanto saiu e para onde foi cada valor, com resumos por centro de custo, categoria e vaquinha.",
    "passos": [
     "Escolha o **centro de custo** e o **tipo de operação**. Se faltar um, use **＋ Novo centro de custo** ou **＋ Novo tipo de operação**.",
     "Informe a pessoa/contribuinte (**Sou eu** preenche com o seu nome), o valor, a forma de pagamento e a data.",
     "Para a contribuição de manutenção, informe o mês de referência.",
     "Anexe o comprovante ou nota fiscal (até 1 MB) e, se for compra de um bem durável, marque **Esta compra gera bem patrimonial**.",
     "Clique em **Registrar lançamento**. Confira os resumos e a lista de lançamentos abaixo.",
     "**Contribuição Mensal de Manutenção:** cadastre cada contribuinte com o valor mensal e confira mês a mês em **Mês de conferência**."
    ],
    "exemplos": [],
    "cuidados": [
     "Lançamentos automáticos (rifa, vaquinha, alojamento) levam só o código, nunca o nome do participante.",
     "Excluir um recebimento na ferramenta de origem retira o lançamento correspondente.",
     "Estes dados ficam no servidor do Parque e aparecem para quem tem acesso, em qualquer computador ou celular. Mesmo assim, baixe o backup completo de vez em quando (veja [[backup-e-restauracao|Backup e restauração]])."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/contas.jpg",
     "legenda": "1. Centro de custo · 2. Tipo de operação · 3. Valor · 4. Forma de pagamento.",
     "alt": "Captura de tela: 1. Centro de custo · 2. Tipo de operação · 3. Valor · 4. Forma de pagamento."
    }
   ],
   "relacionados": [
    "compras-orcamento",
    "relatorios-consolidados",
    "patrimonio-gestao",
    "doar-e-pagar-online"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "compras-orcamento",
   "categoria": "admin",
   "ordem": 2,
   "titulo": "Compras e Orçamento: pedidos, planejamento anual e consolidado",
   "resumo": "Peça compras com até 3 cotações, aprove e registre; planeje o ano e compare previsto e realizado.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "compras",
    "cotação",
    "orçamento",
    "planejamento anual",
    "aprovação",
    "pedido de compra"
   ],
   "onde": "**Administração › Compras e Orçamento**.",
   "secoes": {
    "oQueE": "Papéis: o **Solicitante** pede (e vê os próprios pedidos); o **Departamento de Compras** cota e registra a compra; o **administrador** e o **Responsável Financeiro** aprovam e consolidam. Situações: Solicitada → Em cotação → Aguardando aprovação → Aprovada → Comprada (ou Cancelada).",
    "finalidade": "",
    "passos": [
     "**Novo pedido de compra:** descreva o que precisa, a área, a prioridade e, se for avulso, a justificativa. Clique em **Enviar pedido**.",
     "O Departamento de Compras acrescenta até 3 cotações (**Adicionar cotação**) e envia para aprovação.",
     "Quem aprova escolhe a cotação (não precisa ser a mais barata) e aprova.",
     "Depois de comprar, **Registrar compra** com valor e comprovante.",
     "**Planejamento anual** (de preferência em outubro do ano anterior): o que está previsto, centro de custo, categoria, quantidade, valor estimado, mês e se é bem patrimonial. **Fechar planejamento** trava o ano.",
     "**Consolidado:** previsto × realizado do ano; imprima ou baixe CSV."
    ],
    "exemplos": [],
    "cuidados": [
     "Anexos de cotação até 300 KB."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/compras.jpg",
     "legenda": "1. Pedidos · 2. Planejamento anual · 3. Consolidado · 4. Novo pedido de compra.",
     "alt": "Captura de tela: 1. Pedidos · 2. Planejamento anual · 3. Consolidado · 4. Novo pedido de compra."
    }
   ],
   "relacionados": [
    "prestacao-contas",
    "patrimonio-gestao",
    "relatorios-consolidados"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "inventario-gestao",
   "categoria": "admin",
   "ordem": 3,
   "titulo": "Inventário: cadastrar, consultar e movimentar itens",
   "resumo": "Cada bem ou material do Parque recebe um código permanente; registre entradas, saídas, empréstimos, manutenção e baixas.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "inventário",
    "item",
    "código",
    "estoque",
    "empréstimo",
    "movimentação",
    "baixa",
    "localização"
   ],
   "onde": "**Administração › Inventário** (Responsável pelo Inventário e administrador).",
   "secoes": {
    "oQueE": "O cadastro dos bens e materiais físicos. Cada item ganha um código permanente (INV-0001...) que **nunca é reutilizado**, mesmo depois da baixa. Algumas categorias têm controle de estoque e alerta de estoque mínimo.",
    "finalidade": "",
    "passos": [
     "**Cadastrar item:** categoria, nome, descrição, marca, modelo, número de série, quantidade, unidade, estoque mínimo, localização, estado de conservação, status, responsável, projeto/campanha, foto e observações. Clique em **Cadastrar item**.",
     "Se o item for um bem durável, marque **É patrimônio do Parque** e preencha os dados do patrimônio (número, valor, aquisição, origem, nota fiscal).",
     "**Consulta:** busque por código, nome, marca ou série e filtre por categoria, localização, status, patrimônio ou projeto. **Ver** abre a ficha com o histórico.",
     "**Movimentações:** registre entradas, saídas, empréstimos (e a devolução), transferências, manutenção, ajustes e baixas. Tudo fica no histórico do item.",
     "**Relatórios:** inventário geral, por categoria, por localização, materiais de campanhas, em estoque, emprestados e manutenção/baixa; imprima ou baixe CSV."
    ],
    "exemplos": [
     "Furadeira emprestada a um voluntário: Movimentações › Empréstimo, com nome e data prevista; na volta, Registrar devolução."
    ],
    "cuidados": [
     "Dar baixa não apaga o item: ele sai das listas \"em uso\" mas continua no histórico.",
     "Fotos ocupam espaço no navegador; use imagens leves.",
     "Estes dados ficam no servidor do Parque e aparecem para quem tem acesso, em qualquer computador ou celular. Mesmo assim, baixe o backup completo de vez em quando (veja [[backup-e-restauracao|Backup e restauração]])."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/inventario-cadastro.jpg",
     "legenda": "1. Categoria · 2. Nome do item · 3. Quantidade. Mais abaixo: localização, estado, foto e a opção É patrimônio do Parque.",
     "alt": "Captura de tela: 1. Categoria · 2. Nome do item · 3. Quantidade. Mais abaixo: localização, estado, foto e a opção É patrimônio do Parque."
    }
   ],
   "relacionados": [
    "inventario-importar",
    "patrimonio-gestao",
    "relatorios-consolidados"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "inventario-importar",
   "categoria": "admin",
   "ordem": 4,
   "titulo": "Importar itens do inventário por planilha",
   "resumo": "Baixe o modelo CSV, preencha no Excel ou Planilhas Google e importe com pré-visualização, sem duplicar itens.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "importar",
    "planilha",
    "csv",
    "excel",
    "modelo",
    "inventário"
   ],
   "onde": "**Administração › Inventário › Importar planilha**.",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Clique em **Baixar modelo (CSV)** e abra no Excel, LibreOffice ou Planilhas Google.",
     "Preencha uma linha por item, respeitando as colunas do modelo. Salve como CSV.",
     "Em **Arquivo CSV**, escolha o arquivo. O sistema mostra a pré-visualização: o que será criado, duplicados e erros.",
     "Confira e clique em **Confirmar importação**. Baixe o relatório de erros e duplicados, se houver."
    ],
    "exemplos": [],
    "cuidados": [
     "Itens já existentes e linhas repetidas são ignorados; nenhum item ou foto existente é alterado.",
     "Reimportar o mesmo arquivo não duplica.",
     "Textos que começam com =, +, - ou @ são neutralizados por segurança."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/inventario-importar.jpg",
     "legenda": "1. Baixar o modelo · 2. Escolher a planilha preenchida.",
     "alt": "Captura de tela: 1. Baixar o modelo · 2. Escolher a planilha preenchida."
    }
   ],
   "relacionados": [
    "inventario-gestao",
    "formularios-e-listas"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "patrimonio-gestao",
   "categoria": "admin",
   "ordem": 5,
   "titulo": "Patrimônio",
   "resumo": "Lista dos bens duráveis marcados como patrimônio, com número, valor, aquisição e nota fiscal.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "patrimônio",
    "bem",
    "nota fiscal",
    "valor",
    "aquisição"
   ],
   "onde": "**Administração › Patrimônio**.",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Busque por número, código, nome ou nota fiscal e filtre por categoria e situação.",
     "Use o filtro **Dados › Com dados em aberto** para completar o que falta (**Completar / editar**).",
     "Imprima ou baixe CSV para a prestação de contas."
    ],
    "exemplos": [],
    "cuidados": [
     "Um item entra no patrimônio pelo Inventário (**+ Patrimônio**) ou a partir de uma compra marcada como bem patrimonial."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/patrimonio.jpg",
     "legenda": "1. Buscar · 2. Bens com dados em aberto.",
     "alt": "Captura de tela: 1. Buscar · 2. Bens com dados em aberto."
    }
   ],
   "relacionados": [
    "inventario-gestao",
    "prestacao-contas",
    "compras-orcamento"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "mapa-de-contas",
   "categoria": "admin",
   "ordem": 6,
   "titulo": "Mapa de Contas digitais",
   "resumo": "Quem administra cada conta digital do Parque (site, WhatsApp, Instagram, Facebook, YouTube...), com segundo administrador e verificação em duas etapas.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "contas",
    "redes",
    "administrador",
    "segurança",
    "2fa",
    "domínio"
   ],
   "onde": "**Administração › Mapa de Contas** (exclusivo do administrador).",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Para cada conta, preencha o e-mail institucional, o responsável, o segundo administrador, marque **2FA ativo** e a data da última verificação.",
     "Para acrescentar uma conta (TikTok, Google Drive, Zoom...), digite o nome em **Adicionar conta ao mapa** e clique em **Adicionar**."
    ],
    "exemplos": [],
    "cuidados": [
     "**Não guarde senhas aqui.** Use um gerenciador de senhas.",
     "Toda conta deve ter pelo menos dois administradores, para o Parque não perder o acesso."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/mapa.jpg",
     "legenda": "Adicionar uma conta digital ao mapa.",
     "alt": "Captura de tela: Adicionar uma conta digital ao mapa."
    }
   ],
   "relacionados": [
    "backup-e-restauracao",
    "documentacao-ip"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "documentacao-ip",
   "categoria": "admin",
   "ordem": 7,
   "titulo": "Documentação IP (Instituto Pangeia)",
   "resumo": "Estatuto, atas de assembleia, prestações de contas e outros documentos institucionais, organizados por ano.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "documentação",
    "estatuto",
    "assembleia",
    "instituto pangeia",
    "documentos"
   ],
   "onde": "**Administração › Documentação IP** (exclusivo do administrador).",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Clique em **Novo documento**, informe título, categoria, data, descrição e o link ou arquivo.",
     "Use os filtros de ano, categoria e a busca para encontrar documentos."
    ],
    "exemplos": [],
    "cuidados": [
     "Para arquivos grandes, guarde no Drive da instituição e cadastre aqui só o link."
    ]
   },
   "imagens": [],
   "relacionados": [
    "documentos-calendarios",
    "mapa-de-contas"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "relatorios-consolidados",
   "categoria": "admin",
   "ordem": 8,
   "titulo": "Relatórios Consolidados",
   "resumo": "Orçamento e Fluxo Financeiro do ano, relatórios por módulo e gráficos do Parque, com filtros, impressão e CSV.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "relatório",
    "fluxo financeiro",
    "orçamento",
    "planilha",
    "consolidado",
    "filtro",
    "agrupar"
   ],
   "onde": "**Administração › Relatórios Consolidados**.",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "**Orçamento e Fluxo Financeiro:** escolha o ano e a forma de pagamento. Clique no nome de um item para ver os lançamentos que o compõem; a seta repete o primeiro valor previsto nos meses seguintes. Verde = dentro do previsto; vermelho = receita abaixo ou despesa acima.",
     "**Relatórios por módulo:** escolha o módulo e o relatório, aplique filtros (período, categoria, responsável...), ordene e agrupe.",
     "**Gráficos (só administrador):** veja entradas e saídas por mês, saldo do caixa, origem e destino do dinheiro, centros de custo, aportes do telhado, vaquinhas, inventário e alojamento. Escolha o ano e a forma de pagamento; imprima ou baixe os números em CSV.",
     "Use **Buscar em todas as colunas** para achar um registro; **Limpar filtros** volta ao início.",
     "Imprima ou baixe CSV."
    ],
    "exemplos": [],
    "cuidados": [
     "Você vê apenas os módulos pelos quais é responsável; o administrador vê todos."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/relatorios.jpg",
     "legenda": "1. Módulo · 2. Relatório · 3. Agrupar por.",
     "alt": "Captura de tela: 1. Módulo · 2. Relatório · 3. Agrupar por."
    }
   ],
   "relacionados": [
    "prestacao-contas",
    "formularios-e-listas",
    "inventario-gestao"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "onde-ficam-os-dados",
   "categoria": "dados",
   "ordem": 1,
   "titulo": "Onde ficam os dados (servidor do Parque)",
   "resumo": "Os dados da área restrita e do app ficam no servidor do Parque e são os mesmos em qualquer computador ou celular.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "dados",
    "navegador",
    "servidor",
    "localstorage",
    "outro computador",
    "celular",
    "sincronizar"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "Tudo o que é cadastrado na área restrita e no app CONecta Retiro (atas, inventário, reservas, usuários, edições da ajuda...) é gravado no **servidor do Parque**. Quem tem acesso vê os mesmos dados no computador, no celular ou no app. O indicador no rodapé do painel mostra se está tudo **sincronizado**.",
    "finalidade": "Saber que o trabalho fica guardado e compartilhado, e o que fazer nos raros casos de conflito ou falta de internet.",
    "passos": [
     "Trabalhe normalmente: cada alteração é enviada ao servidor em poucos segundos.",
     "Se duas pessoas mudarem a mesma lista ao mesmo tempo, o painel avisa e mostra botões para escolher qual versão fica.",
     "Sem internet, o que você fizer fica guardado e é enviado quando a conexão voltar; não feche a página antes de aparecer \"sincronizado\".",
     "Dados que ficaram num navegador da época anterior ao servidor podem ser trazidos em **Backup e Segurança › Trazer os dados deste navegador para o servidor**.",
     "Materiais pesados (artes, vídeos) ficam em pastas do Drive; o site guarda só o link."
    ],
    "exemplos": [],
    "cuidados": [
     "Mesmo com o servidor, baixe o **backup completo** de vez em quando e guarde em local seguro.",
     "As páginas abertas do site (inscrições, envio de fotos, formulários para o público) ainda não estão ligadas ao servidor: o que o visitante envia fica no navegador dele até essa ligação ser feita."
    ]
   },
   "imagens": [],
   "relacionados": [
    "backup-e-restauracao",
    "nao-vejo-meus-dados",
    "atualizar-conteudos-do-site"
   ],
   "atualizadoEm": "2026-11-11"
  },
  {
   "id": "backup-e-restauracao",
   "categoria": "dados",
   "ordem": 2,
   "titulo": "Backup e restauração",
   "resumo": "Baixe o backup completo com frequência; para restaurar, o sistema confere a integridade e exige o backup do estado atual antes.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "backup",
    "restaurar",
    "cópia de segurança",
    "json",
    "segurança",
    "recuperar"
   ],
   "onde": "**Administração › Backup e Segurança** (administrador).",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Clique em **Baixar backup completo**. O arquivo .json vai para a pasta de downloads; guarde-o em outro lugar (e-mail, nuvem, pen drive).",
     "A tela avisa quando o último backup tem mais de 7 dias.",
     "Para restaurar: em **Arquivo de backup (.json)**, escolha o arquivo. O sistema confere a integridade e mostra a comparação por coleção.",
     "Baixe antes o backup do estado atual (o botão de restaurar só é liberado depois disso).",
     "Clique em **Restaurar este backup** e confirme."
    ],
    "exemplos": [],
    "cuidados": [
     "Restaurar **substitui todos** os dados atuais pelos do backup.",
     "Arquivos alterados ou corrompidos são recusados.",
     "As edições da Central de Ajuda também entram no backup."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/backup.jpg",
     "legenda": "1. Baixar backup completo · 2. Arquivo para restaurar.",
     "alt": "Captura de tela: 1. Baixar backup completo · 2. Arquivo para restaurar."
    }
   ],
   "relacionados": [
    "lixeira-e-auditoria",
    "onde-ficam-os-dados",
    "nao-vejo-meus-dados"
   ],
   "atualizadoEm": "2026-11-11"
  },
  {
   "id": "lixeira-e-auditoria",
   "categoria": "dados",
   "ordem": 3,
   "titulo": "Lixeira e registro de alterações",
   "resumo": "Itens excluídos ficam guardados na lixeira e toda alteração é registrada (quem, quando, o quê).",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "lixeira",
    "excluído",
    "recuperar",
    "auditoria",
    "histórico",
    "alterações"
   ],
   "onde": "**Administração › Backup e Segurança**.",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Em **Registro de alterações (últimas 25)**, veja quando, quem e em qual coleção houve inclusão (+), alteração (~) ou remoção (−).",
     "Em **Itens excluídos recuperáveis na lixeira**, clique em **Baixar lixeira (JSON)** para obter a cópia dos itens excluídos."
    ],
    "exemplos": [],
    "cuidados": [
     "A lixeira guarda os 300 itens excluídos mais recentes; fotos muito grandes são omitidas.",
     "Para recolocar um item excluído, peça ajuda a quem administra o sistema (a cópia está no arquivo da lixeira)."
    ]
   },
   "imagens": [],
   "relacionados": [
    "backup-e-restauracao",
    "formularios-e-listas"
   ],
   "atualizadoEm": "2026-11-02"
  },
  {
   "id": "atualizar-conteudos-do-site",
   "categoria": "dados",
   "ordem": 4,
   "titulo": "Como o conteúdo do site é atualizado",
   "resumo": "O que muda sozinho, o que precisa de \"pacote para publicar\" e o que ainda é alterado no código.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "publicar",
    "atualizar",
    "hospedagem",
    "pacote",
    "banner",
    "calendário de uso",
    "alimentar dados"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "O que é cadastrado na área restrita fica no servidor; para o público ver no site aberto, cada conteúdo tem o seu caminho.",
    "finalidade": "",
    "passos": [
     "**Banners do site:** Comunicação › Site › **Baixar pacote para publicar (.zip)** e copiar a pasta banners para a hospedagem.",
     "**Central de Ajuda:** Administração › Central de Ajuda › Publicar › **Baixar ajuda-conteudo.js** e substituir o arquivo na hospedagem.",
     "**Calendário de uso (público):** as datas ocupadas ficam na lista RESERVAS dentro do arquivo calendario.html; peça a quem cuida do site para atualizar.",
     "**Atividades, Lojinha, Rifa, Vaquinha, Álbum e Biblioteca:** o que a equipe cadastra fica no servidor; a ligação das páginas abertas do site ao servidor é a próxima etapa (até lá, o público vê o que foi publicado no site)."
    ],
    "exemplos": [],
    "cuidados": [
     "Antes de substituir arquivos na hospedagem, guarde uma cópia dos atuais."
    ]
   },
   "imagens": [],
   "relacionados": [
    "banners-do-site",
    "publicar-ajuda",
    "onde-ficam-os-dados"
   ],
   "atualizadoEm": "2026-11-11"
  },
  {
   "id": "administrar-central-ajuda",
   "categoria": "ajuda-admin",
   "ordem": 1,
   "titulo": "Administrar a Central de Ajuda",
   "resumo": "Crie e edite artigos, categorias e explicações rápidas sem mexer no código, e acompanhe o que ainda precisa de orientação.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "central de ajuda",
    "artigo",
    "categoria",
    "editar ajuda",
    "administrar",
    "tutorial"
   ],
   "onde": "**Administração › Central de Ajuda** (administrador ou Responsável pela Central de Ajuda).",
   "secoes": {
    "oQueE": "A ferramenta tem cinco partes: **Artigos**, **Categorias**, **Explicações rápidas**, **Cobertura** e **Publicar**. O que é editado aqui fica no servidor e vale na hora para a equipe na área restrita; para aparecer no site aberto e no app, use **Publicar**.",
    "finalidade": "",
    "passos": [
     "**Artigos:** clique em **Novo artigo** ou em **Editar**. Preencha título, categoria, público, resumo, o que é, para que serve, passo a passo (um passo por linha), exemplos, cuidados, imagens e conteúdos relacionados. Salve.",
     "Use **Retirar do ar** para deixar um artigo como rascunho (só quem administra a ajuda vê) e **Publicar** para devolvê-lo.",
     "**Categorias:** crie, renomeie, mude o ícone, a descrição e a ordem.",
     "**Explicações rápidas:** veja e edite os textos das dicas de cada botão e campo.",
     "**Cobertura:** lista os itens que você abriu e que ainda usam texto automático; escreva a explicação de cada um.",
     "**Publicar:** baixe o arquivo para a hospedagem e o JSON para o aplicativo."
    ],
    "exemplos": [
     "Mudou o formulário de reservas? Edite o artigo \"Pedir reserva do Centro de Estudo\", troque a imagem e publique."
    ],
    "cuidados": [
     "Na imagem, prefira capturas da tela atual com o item destacado.",
     "Para criar um link para outro artigo no meio do texto, use colchetes duplos com o id do artigo e o texto do link, separados por uma barra vertical. O id aparece na lista de artigos."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/central-admin.jpg",
     "legenda": "1. Artigos, Categorias, Explicações rápidas, Cobertura e Publicar · 2. Novo artigo.",
     "alt": "Captura de tela: 1. Artigos, Categorias, Explicações rápidas, Cobertura e Publicar · 2. Novo artigo."
    }
   ],
   "relacionados": [
    "editar-explicacoes-rapidas",
    "publicar-ajuda",
    "como-usar-a-ajuda"
   ],
   "atualizadoEm": "2026-11-11"
  },
  {
   "id": "editar-explicacoes-rapidas",
   "categoria": "ajuda-admin",
   "ordem": 2,
   "titulo": "Escrever e corrigir as explicações rápidas",
   "resumo": "No próprio item: ligue o modo ajuda, clique no item e use \"Editar esta explicação\".",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "dica",
    "explicação",
    "tooltip",
    "editar",
    "chave",
    "cobertura"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "Cada botão, campo ou menu tem uma **chave** (por exemplo, r.inventario.f-n = campo Nome do item no Inventário). A explicação escrita para essa chave aparece na dica e no cartão. Se não houver texto escrito, o sistema monta um automático a partir do nome do campo e do tipo de ação.",
    "finalidade": "",
    "passos": [
     "Abra a tela onde está o item.",
     "Clique em **? Ajuda › Ligar o modo ajuda** e clique no item (ou chegue nele com Tab e pressione F1).",
     "No cartão, clique em **Editar esta explicação**.",
     "Escreva um título curto e 1 a 3 frases: o que é, o que acontece ao usar e, se preciso, como usar. Escolha o artigo do \"Saiba mais\".",
     "Clique em **Salvar**. **Voltar ao texto original** desfaz a sua edição."
    ],
    "exemplos": [
     "Bom: \"Centro de custo: área do Parque que recebe ou paga o valor (Manutenção, Construção...). Define em qual resumo o lançamento aparece.\"",
     "Evite: \"Campo de centro de custo.\""
    ],
    "cuidados": [
     "As edições valem na hora para a equipe na área restrita. Para aparecerem no site aberto e no app, publique (veja [[publicar-ajuda|Publicar a ajuda]])."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/editar-dica.jpg",
     "legenda": "No modo ajuda, clique no item e use \"Editar esta explicação\".",
     "alt": "Captura de tela: No modo ajuda, clique no item e use \"Editar esta explicação\"."
    }
   ],
   "relacionados": [
    "administrar-central-ajuda",
    "publicar-ajuda"
   ],
   "atualizadoEm": "2026-11-11"
  },
  {
   "id": "publicar-ajuda",
   "categoria": "ajuda-admin",
   "ordem": 3,
   "titulo": "Publicar a ajuda no site e no aplicativo",
   "resumo": "Baixe o arquivo ajuda-conteudo.js para a hospedagem e o conteudo.json para o aplicativo: a mesma base de conhecimento serve aos dois.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "publicar",
    "aplicativo",
    "app",
    "json",
    "hospedagem",
    "exportar",
    "importar"
   ],
   "onde": "**Administração › Central de Ajuda › Publicar**.",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Clique em **Baixar ajuda-conteudo.js** e substitua o arquivo de mesmo nome na pasta do site na hospedagem.",
     "Se trocou ou acrescentou imagens enviadas do computador, elas já vão dentro do arquivo.",
     "Clique em **Baixar conteudo.json** e entregue ao responsável pelo aplicativo (ele usa as mesmas chaves e artigos).",
     "Depois de publicar, use **Limpar edições já publicadas** para que este navegador volte a usar só o arquivo publicado.",
     "Para trazer edições de outro computador: **Importar** o JSON exportado lá."
    ],
    "exemplos": [],
    "cuidados": [
     "Guarde uma cópia do ajuda-conteudo.js anterior antes de substituir.",
     "O app CONecta Retiro e o site aberto mostram a versão publicada: publique depois de revisar."
    ]
   },
   "imagens": [
    {
     "src": "ajuda/img/publicar.jpg",
     "legenda": "1. Arquivo para a hospedagem do site · 2. JSON para o aplicativo.",
     "alt": "Captura de tela: 1. Arquivo para a hospedagem do site · 2. JSON para o aplicativo."
    }
   ],
   "relacionados": [
    "administrar-central-ajuda",
    "atualizar-conteudos-do-site"
   ],
   "atualizadoEm": "2026-11-11"
  },
  {
   "id": "problemas-frequentes",
   "categoria": "problemas",
   "ordem": 1,
   "titulo": "Problemas frequentes e como resolver",
   "resumo": "Respostas rápidas para as dúvidas que mais aparecem.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "problema",
    "erro",
    "não funciona",
    "dúvida",
    "faq",
    "perguntas frequentes"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "**Não vejo os dados em outro computador** → [[nao-vejo-meus-dados|Não vejo meus dados]].",
     "**Não consigo entrar** → [[nao-consigo-entrar|Não consigo entrar]].",
     "**A imagem ou o arquivo foi recusado** → [[arquivo-ou-imagem-recusado|Imagem ou arquivo recusado]].",
     "**Enviar solicitação abriu o e-mail e não enviou:** o formulário de reserva prepara a mensagem no seu programa de e-mail; você precisa clicar em Enviar nele.",
     "**Não encontro uma ferramenta na área restrita:** ela depende do seu nível e responsabilidades → [[niveis-e-responsabilidades|Níveis e responsabilidades]].",
     "**A dica está atrapalhando:** desligue \"Mostrar dicas ao passar o mouse\" no painel **? Ajuda**."
    ],
    "exemplos": [],
    "cuidados": [
     "Se nada resolver, fale com a Comissão: parqueretirorio@gmail.com ou pelo WhatsApp do Parque (botão verde)."
    ]
   },
   "imagens": [],
   "relacionados": [
    "nao-vejo-meus-dados",
    "nao-consigo-entrar",
    "arquivo-ou-imagem-recusado",
    "como-usar-a-ajuda"
   ],
   "atualizadoEm": "2026-11-11"
  },
  {
   "id": "nao-vejo-meus-dados",
   "categoria": "problemas",
   "ordem": 2,
   "titulo": "Não vejo os dados em outro computador ou celular",
   "resumo": "Com o servidor, os dados são os mesmos em todo lugar. Se algo não aparece, confira se entrou com a sua conta e se está sincronizado.",
   "publico": "equipe",
   "status": "publicado",
   "palavras": [
    "sumiu",
    "dados sumiram",
    "outro computador",
    "celular",
    "não aparece",
    "vazio"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Confira se você entrou com a sua conta (o seu nome aparece no topo).",
     "Veja o indicador no rodapé do painel: se não estiver \"sincronizado\", confira a internet e espere alguns segundos.",
     "Você só vê as ferramentas das suas responsabilidades: peça à administração para incluir a função, se faltar.",
     "Dados cadastrados antes do servidor, num computador específico: nesse computador, use **Backup e Segurança › Trazer os dados deste navegador para o servidor**."
    ],
    "exemplos": [],
    "cuidados": [
     "Se algo sumiu, a administração pode recuperar pela Lixeira do sistema ou pelo último backup (Backup e Segurança)."
    ]
   },
   "imagens": [],
   "relacionados": [
    "onde-ficam-os-dados",
    "backup-e-restauracao"
   ],
   "atualizadoEm": "2026-11-11"
  },
  {
   "id": "nao-consigo-entrar",
   "categoria": "problemas",
   "ordem": 3,
   "titulo": "Não consigo entrar na área restrita",
   "resumo": "Verifique se você confirmou o e-mail, se o cadastro foi aprovado e se o e-mail e a senha estão corretos.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "login",
    "senha",
    "entrar",
    "pendente",
    "bloqueado",
    "esqueci a senha"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Mensagem \"aguarda aprovação\": a administração ainda não aprovou o cadastro.",
     "Mensagem de recusado ou bloqueado: fale com a administração do Parque.",
     "Confirme o cadastro pelo link do e-mail que chegou (olhe também no spam).",
     "Confira o e-mail e a senha (maiúsculas e minúsculas fazem diferença).",
     "Esqueceu a senha: toque em **Esqueci minha senha** na tela Entrar e siga o e-mail que chega."
    ],
    "exemplos": [],
    "cuidados": []
   },
   "imagens": [],
   "relacionados": [
    "criar-conta-e-entrar",
    "gestao-de-responsaveis",
    "onde-ficam-os-dados"
   ],
   "atualizadoEm": "2026-11-11"
  },
  {
   "id": "arquivo-ou-imagem-recusado",
   "categoria": "problemas",
   "ordem": 4,
   "titulo": "Imagem ou arquivo recusado",
   "resumo": "Cada envio tem limite de tamanho e, nos banners, de proporção. Para materiais pesados, use links do Drive.",
   "publico": "todos",
   "status": "publicado",
   "palavras": [
    "imagem",
    "arquivo",
    "tamanho",
    "recusado",
    "espaço",
    "cheio",
    "proporção",
    "pdf"
   ],
   "onde": "",
   "secoes": {
    "oQueE": "",
    "finalidade": "",
    "passos": [
     "Confira o limite indicado ao lado do campo (ex.: até 1 MB, até 600 KB, até 10 fotos por vez).",
     "Reduza a imagem (por exemplo, envie pelo WhatsApp para você mesmo e baixe de novo, ou use um site de compressão).",
     "Banners: a imagem precisa ter a proporção exata do espaço (a mensagem diz a medida).",
     "Arquivos grandes (vídeos, apresentações, muitas fotos): guarde numa pasta do Drive do Parque e cole o link."
    ],
    "exemplos": [],
    "cuidados": []
   },
   "imagens": [],
   "relacionados": [
    "banners-do-site",
    "backup-e-restauracao",
    "enviar-fotos-album"
   ],
   "atualizadoEm": "2026-11-11"
  }
 ],
 "dicas": {
  "global.entrar": [
   "Entrar",
   "Acesso à área restrita (CONecta Retiro), para quem cuida do Parque. Também é por aqui que você cria a sua conta.",
   "criar-conta-e-entrar"
  ],
  "global.whatsapp": [
   "WhatsApp do Parque",
   "Abre uma conversa com o Parque Retiro no WhatsApp, com uma mensagem inicial já escrita. No computador, abre o WhatsApp Web.",
   "problemas-frequentes"
  ],
  "global.menu": [
   "Menu",
   "Abre ou fecha o menu de páginas do site. Toque na setinha ao lado de um item para ver o submenu dele.",
   "menu-do-site"
  ],
  "global.submenu": [
   "Abrir submenu",
   "Mostra as páginas que ficam dentro deste item do menu. Toque de novo para fechar.",
   "menu-do-site"
  ],
  "global.idioma": [
   "Idioma do site",
   "Troca o idioma dos textos da página (português, espanhol, italiano, francês, inglês ou alemão). A escolha fica guardada neste navegador.",
   "idiomas-do-site"
  ],
  "global.idioma.opcao": [
   "Escolher idioma",
   "Mostra o site neste idioma. Nomes próprios e termos da Escola continuam no original.",
   "idiomas-do-site"
  ],
  "global.marca": [
   "Início",
   "Volta para a página inicial do site.",
   "menu-do-site"
  ],
  "global.newsletter": [
   "Comunicado por e-mail",
   "Cadastre seu e-mail para receber o Comunicado do Parque, com novidades, atividades e convites.",
   "receber-comunicado"
  ],
  "global.rede.facebook": [
   "Facebook do Parque",
   "Abre a página do Parque Retiro no Facebook, em uma nova aba.",
   "menu-do-site"
  ],
  "global.rede.instagram": [
   "Instagram do Parque",
   "Abre o perfil do Parque Retiro no Instagram, em uma nova aba.",
   "menu-do-site"
  ],
  "global.rede.youtube": [
   "YouTube do Parque",
   "Abre o canal do Parque no YouTube, em uma nova aba.",
   "menu-do-site"
  ],
  "global.rede.blogger": [
   "Blogger",
   "Abre a página do Blogger do Parque.",
   "menu-do-site"
  ],
  "menu.comece-aqui": [
   "Quem somos",
   "Apresentação do Parque de Estudo e Reflexão Retiro: o que é, quem cuida e como participar."
  ],
  "menu.index": [
   "Início",
   "Página inicial: destaques, acervo aberto da Biblioteca e atalhos para as principais seções."
  ],
  "menu.o-parque": [
   "O Parque",
   "Sobre o Parque, seus Elementos, como chegar e as atividades."
  ],
  "menu.elementos": [
   "Elementos",
   "Os elementos do Parque (Sala, Portal, Monólito, Fonte, Estela...) e o significado de cada um."
  ],
  "menu.como-chegar": [
   "Como Chegar",
   "Endereço, mapa e linhas de ônibus para chegar ao Parque, em Maricá (RJ).",
   "como-chegar-ao-parque"
  ],
  "menu.atividades": [
   "Atividades",
   "Eventos, encontros, retiros e reuniões do Parque, com artigo completo de cada um.",
   "atividades-publicas"
  ],
  "menu.atividades.evento": [
   "Eventos",
   "Mostra só as atividades do tipo evento.",
   "atividades-publicas"
  ],
  "menu.atividades.encontro": [
   "Encontros",
   "Mostra só os encontros.",
   "atividades-publicas"
  ],
  "menu.atividades.retiro": [
   "Retiros",
   "Mostra só os retiros.",
   "atividades-publicas"
  ],
  "menu.atividades.reuniao": [
   "Reuniões",
   "Mostra só as reuniões.",
   "atividades-publicas"
  ],
  "menu.fotos": [
   "Álbum de fotos",
   "Fotos escolhidas pela curadoria e o formulário para enviar as suas.",
   "enviar-fotos-album"
  ],
  "menu.reservas": [
   "Reservas",
   "Como reservar o Centro de Estudo e o calendário de datas ocupadas e livres.",
   "pedir-reserva"
  ],
  "menu.como-fazer": [
   "Como Fazer",
   "Regras de uso e o formulário para pedir reserva do Centro de Estudo.",
   "pedir-reserva"
  ],
  "menu.calendario": [
   "Calendário de uso",
   "Mostra os dias em que o Centro de Estudo está ocupado ou livre. Consulte antes de pedir a reserva.",
   "calendario-de-uso"
  ],
  "menu.silo": [
   "Silo",
   "Silo, a Mensagem de Silo, as Comunidades da Mensagem e os Organismos do Movimento."
  ],
  "menu.mensagem-de-silo": [
   "Mensagem de Silo",
   "A Mensagem de Silo e as Comunidades da Mensagem."
  ],
  "menu.comunidades-da-mensagem": [
   "Comunidades da Mensagem",
   "Onde encontrar as Comunidades da Mensagem."
  ],
  "menu.organismos": [
   "Organismos do Movimento",
   "Os organismos do Movimento Humanista e os links para cada um."
  ],
  "menu.centro-estudo": [
   "Centro de Estudo",
   "Escola, Biblioteca, Produções de Escola, livros, áudios, aplicativo e Ofícios."
  ],
  "menu.escola": [
   "Escola",
   "Informações sobre a Escola e a Nivelação."
  ],
  "menu.nivelamento": [
   "Nivelação",
   "Material e orientações da Nivelação."
  ],
  "menu.biblioteca": [
   "Biblioteca do Parque",
   "Livros disponíveis para leitura e consulta no Parque, com a localização na estante.",
   "biblioteca-publica"
  ],
  "menu.producoes-de-escola": [
   "Produções de Escola",
   "Links para as produções dos Mestres de 18 Parques e as produções que aparecem em mais de um Parque."
  ],
  "menu.biblioteca-silo": [
   "Biblioteca de Silo",
   "Livros, conferências, entrevistas e outros documentos de Silo, com busca e filtros."
  ],
  "menu.livros-audios-app": [
   "Livros, Áudios e App",
   "Livros, áudios e o aplicativo com materiais de estudo."
  ],
  "menu.oficios": [
   "Ofícios",
   "Material sobre os Ofícios, como o Ofício do Fogo."
  ],
  "menu.ajude-o-parque": [
   "Ajude o Parque",
   "Todas as formas de ajudar: doação, pagamento online, Livraria, Lojinha, Rifa, Vaquinha, voluntariado e comissões.",
   "doar-e-pagar-online"
  ],
  "menu.doacao": [
   "Doação",
   "Dados para doar por PIX, Banco Mumbuca ou conta do Instituto Pangeia.",
   "doar-e-pagar-online"
  ],
  "menu.pagar": [
   "Pagar online",
   "Pague ou doe por PIX, cartão ou boleto na tela segura do Asaas.",
   "doar-e-pagar-online"
  ],
  "menu.livraria": [
   "Livraria",
   "Livros à venda; o valor sustenta o Parque. Pedido por e-mail.",
   "comprar-livraria-lojinha"
  ],
  "menu.lojinha": [
   "Lojinha",
   "Produtos promocionais e artesanais do Parque.",
   "comprar-livraria-lojinha"
  ],
  "menu.rifa-solidaria": [
   "Rifa Solidária",
   "Rifas em benefício do Parque, com sorteio pela Loteria Federal.",
   "participar-rifa"
  ],
  "menu.vaquinha-coletiva": [
   "Vaquinha Coletiva",
   "Contribua com o valor que quiser para uma necessidade específica do Parque.",
   "contribuir-vaquinha"
  ],
  "menu.voluntario": [
   "Voluntário",
   "Inscreva-se para ajudar com o seu tempo e trabalho.",
   "ser-voluntario"
  ],
  "menu.comissoes": [
   "Comissões",
   "Grupos de voluntários que cuidam de cada área do Parque.",
   "ser-voluntario"
  ],
  "menu.comissao-jardinagem": [
   "Jardinagem / Área Externa",
   "Comissão que cuida das plantas, da área externa e do reflorestamento.",
   "ser-voluntario"
  ],
  "menu.comissao-comunicacao": [
   "Comunicação, Redes Sociais e Site",
   "Comissão que divulga as atividades e cuida do site.",
   "ser-voluntario"
  ],
  "menu.comissao-multiuso": [
   "Multiuso",
   "Comissão que cuida da agenda e das regras do espaço multiuso.",
   "ser-voluntario"
  ],
  "menu.parques-mundo": [
   "Parques no Mundo",
   "Os Parques de Estudo e Reflexão em outros países."
  ],
  "menu.blogger": [
   "Blog",
   "Publicações e notícias do Parque no blog."
  ],
  "menu.movimento-humanista": [
   "Movimento Humanista",
   "Página do organismo Movimento Humanista."
  ],
  "menu.partido-humanista": [
   "Partido Humanista",
   "Página do organismo Partido Humanista."
  ],
  "menu.a-comunidade": [
   "A Comunidade",
   "Página do organismo A Comunidade para o Desenvolvimento Humano."
  ],
  "menu.centro-mundial-estudos-humanistas": [
   "Centro Mundial de Estudos Humanistas",
   "Página do organismo."
  ],
  "menu.convergencia-das-culturas": [
   "Convergência das Culturas",
   "Página do organismo."
  ],
  "menu.mundo-sem-guerras": [
   "Mundo sem Guerras e sem Violência",
   "Página do organismo."
  ],
  "painel.sair": [
   "Sair",
   "Encerra o seu acesso. Os dados continuam salvos no servidor; para voltar, use Entrar.",
   "painel-conecta"
  ],
  "painel.area.com": [
   "Comissões Parque Retiro",
   "Abre a lista de ferramentas das comissões: Biblioteca, Reservas, Elementos, Álbum, Calendários, Atividades, Comunicação, Ajude o Parque e outras.",
   "painel-conecta"
  ],
  "painel.area.adm": [
   "Administração",
   "Abre as ferramentas administrativas: Prestação de Contas, Compras, Inventário, Patrimônio, Responsáveis, Backup, Relatórios e Central de Ajuda.",
   "painel-conecta"
  ],
  "painel.grupo.elementos": [
   "Elementos",
   "Abre a caixa com a Estela e a descrição de cada elemento do Parque (Sala, Monólito, Portão, Fonte...).",
   "elementos-descricoes"
  ],
  "painel.grupo.ajude": [
   "Ajude o Parque",
   "Abre a caixa com as ferramentas de arrecadação e voluntariado: Lojinha, Rifa, Vaquinha e Voluntário.",
   "ajude-visao-geral"
  ],
  "painel.comunicado": [
   "Gerar Comunicado por e-mail",
   "Monta o Comunicado por e-mail com o conteúdo desta ferramenta. Você escolhe a lista e copia o texto para o seu serviço de e-mail.",
   "listas-email"
  ],
  "aba.acervo": [
   "Biblioteca",
   "Consulta do acervo, cadastro de livros, empréstimos e a Livraria.",
   "biblioteca-gestao"
  ],
  "aba.zoom": [
   "Zoom",
   "Agenda das transmissões no Zoom: título, data, duração e link.",
   "zoom-agendamento"
  ],
  "aba.contas": [
   "Prestação de Contas",
   "Entradas e saídas do Instituto Pangeia, com centros de custo, comprovantes e contribuições mensais.",
   "prestacao-contas"
  ],
  "aba.compras": [
   "Compras e Orçamento",
   "Pedidos de compra com cotações e aprovação, planejamento anual e consolidado.",
   "compras-orcamento"
  ],
  "aba.enc_livros": [
   "Encomendas de livros",
   "Encomendas do livro em pré-lançamento pelo qual você é responsável.",
   "encomendas-livros"
  ],
  "aba.users": [
   "Gestão de Responsáveis",
   "Aprovar cadastros, cadastrar responsáveis, definir nível de acesso e responsabilidades. O número vermelho mostra cadastros esperando aprovação.",
   "gestao-de-responsaveis"
  ],
  "aba.mapa": [
   "Mapa de Contas",
   "Quem administra cada conta digital do Parque (site, redes, WhatsApp), com segundo administrador e verificação em duas etapas.",
   "mapa-de-contas"
  ],
  "aba.docip": [
   "Documentação IP",
   "Documentos institucionais do Instituto Pangeia, por ano e categoria.",
   "documentacao-ip"
  ],
  "aba.backup": [
   "Backup e Segurança",
   "Baixar e restaurar o backup completo, ver o registro de alterações e a lixeira.",
   "backup-e-restauracao"
  ],
  "aba.reservas": [
   "Alojamento",
   "Pedidos de reserva, distribuição das camas, ASSEFAZ e recebimentos do alojamento.",
   "reservas-alojamento"
  ],
  "aba.estela": [
   "Estela",
   "Cadastro de quem contribuiu com a construção do Parque e escolha dos nomes publicados na Estela Virtual.",
   "estela-gestao"
  ],
  "aba.el_sala": [
   "Sala",
   "Descrição do elemento Sala: o que fará e para que servirá.",
   "elementos-descricoes"
  ],
  "aba.el_monolito": [
   "Monólito",
   "Descrição do elemento Monólito.",
   "elementos-descricoes"
  ],
  "aba.el_portao": [
   "Portão",
   "Descrição do elemento Portão.",
   "elementos-descricoes"
  ],
  "aba.el_fonte": [
   "Fonte",
   "Descrição do elemento Fonte.",
   "elementos-descricoes"
  ],
  "aba.el_centro-trabalho": [
   "Centro de Trabalho",
   "Descrição do elemento Centro de Trabalho.",
   "elementos-descricoes"
  ],
  "aba.el_centro-estudos": [
   "Centro de Estudos",
   "Descrição do elemento Centro de Estudos.",
   "elementos-descricoes"
  ],
  "aba.el_oficinas": [
   "Oficinas",
   "Descrição do elemento Oficinas.",
   "elementos-descricoes"
  ],
  "aba.album": [
   "Álbum Parque Retiro",
   "Envio de fotos, fotos por atividade e curadoria do que aparece no site.",
   "album-gestao"
  ],
  "aba.inventario": [
   "Inventário",
   "Bens e materiais do Parque com código permanente: cadastro, consulta, movimentações, importação e relatórios.",
   "inventario-gestao"
  ],
  "aba.patrimonio": [
   "Patrimônio",
   "Bens duráveis marcados como patrimônio, com número, valor e nota fiscal.",
   "patrimonio-gestao"
  ],
  "aba.documentos": [
   "Documentos e Calendários",
   "Atas da Reunião de Escola com encaminhamentos e os calendários semanal, mensal, trimestral, semestral e anual.",
   "documentos-calendarios"
  ],
  "aba.atividades": [
   "Atividades",
   "Cadastro das atividades publicadas em O Parque › Atividades e no carrossel do Início.",
   "atividades-gestao"
  ],
  "aba.campanha": [
   "Campanha Punta de Vacas",
   "Início e fim da campanha (entram no calendário como atividade) e lista, só para consulta, de quem aportou. Os aportes entram pela Prestação de Contas ou pela Conciliação bancária do extrato.",
   "atividades-gestao"
  ],
  "aba.reuniao": [
   "Reunião de Escola",
   "Pesquisa de datas, confirmação de presença e temas da Reunião de Escola.",
   "reuniao-de-escola"
  ],
  "aba.grupos": [
   "Grupos de Discussão",
   "Grupos por tema para conversar, votar e aprovar publicações.",
   "grupos-discussao"
  ],
  "aba.multiuso": [
   "Multiuso",
   "Agenda de uso, planejamentos, regras e documentos do espaço multiuso.",
   "multiuso-gestao"
  ],
  "aba.comunicacao": [
   "Comunicação, Redes Sociais e Site",
   "Calendário de comunicação, publicações por canal, banners do site, equipe, arquivos e indicadores.",
   "comunicacao-visao-geral"
  ],
  "aba.contatos": [
   "Listas de e-mail",
   "Contatos por lista e os Comunicados enviados, com métricas.",
   "listas-email"
  ],
  "aba.ajude": [
   "Ajude o Parque (visão geral)",
   "Cartões com as vias de ajuda que você acompanha.",
   "ajude-visao-geral"
  ],
  "aba.lojinha": [
   "Lojinha",
   "Produtos, estoque, custos, preço sugerido, vendas e relatório.",
   "lojinha-gestao"
  ],
  "aba.rifa": [
   "Rifa Solidária",
   "Rifas, participantes, conferência de comprovantes, sorteio e arrecadação.",
   "rifa-gestao"
  ],
  "aba.vaquinha": [
   "Vaquinha Coletiva",
   "Vaquinhas com meta, contribuições, conferência e arrecadação.",
   "vaquinha-gestao"
  ],
  "aba.voluntarios": [
   "Voluntários inscritos",
   "Inscrições feitas no site, com situação, filtros e anotações.",
   "voluntarios-gestao"
  ],
  "aba.vol_acoes": [
   "Ações de Voluntário",
   "Ações em que voluntários podem ajudar: objetivo, plano e duração.",
   "voluntarios-gestao"
  ],
  "aba.jardinagem": [
   "Jardinagem / Área Externa",
   "Planejamentos de jardinagem e reflorestamento, documentos e resumo.",
   "jardinagem-gestao"
  ],
  "aba.construcao": [
   "Construção",
   "Obras e etapas de construção, documentos e resumo. Só na área restrita.",
   "comissoes-internas"
  ],
  "aba.manutencao": [
   "Manutenção",
   "Pedidos de manutenção com prioridade e prazo, documentos e resumo. Só na área restrita.",
   "comissoes-internas"
  ],
  "aba.traducoes": [
   "Traduções",
   "Traduções com idiomas, tradutor, revisor e prazo, documentos e resumo. Só na área restrita.",
   "comissoes-internas"
  ],
  "aba.relatorios": [
   "Relatórios Consolidados",
   "Orçamento e fluxo financeiro e relatórios de cada módulo, com filtros, impressão e CSV.",
   "relatorios-consolidados"
  ],
  "aba.central_ajuda": [
   "Central de Ajuda",
   "Criar e editar artigos, categorias e explicações rápidas, ver a cobertura e publicar a ajuda.",
   "administrar-central-ajuda"
  ],
  "r.acervo.bs.consulta": [
   "Consulta do acervo",
   "Mostra todos os livros do acervo físico, com quantos exemplares estão disponíveis agora."
  ],
  "r.acervo.bs.gestao": [
   "Gestão do Acervo",
   "Cadastro e edição de livros, empréstimos e devoluções e relatórios da Biblioteca."
  ],
  "r.acervo.bs.livraria": [
   "Livraria",
   "Livros à venda (estoque separado do acervo de empréstimo), vendas e pré-lançamentos.",
   "livraria-gestao"
  ],
  "r.acervo.q": [
   "Buscar no acervo",
   "Digite parte do título, do autor ou da localização (ex.: Silo, Prateleira A1). A lista é filtrada enquanto você digita."
  ],
  "r.acervo.s.cad": [
   "Cadastro e edição",
   "Formulário para cadastrar um livro novo e a lista do acervo com Editar e Excluir."
  ],
  "r.acervo.s.emp": [
   "Empréstimos e devoluções",
   "Registre quem levou um livro e quando devolveu. O número de exemplares disponíveis é atualizado sozinho."
  ],
  "r.acervo.s.rel": [
   "Relatórios da Biblioteca",
   "Lista de empréstimos para imprimir ou baixar em planilha (CSV)."
  ],
  "r.acervo.g-t": [
   "Título do livro",
   "Nome da obra como aparece na capa. É o que o público vê na Biblioteca do Parque."
  ],
  "r.acervo.g-a": [
   "Autor",
   "Nome do autor ou dos autores. Use \"Vários Autores\" para coletâneas."
  ],
  "r.acervo.g-s": [
   "Status inicial",
   "Disponível: o livro está na estante. Empréstimo: já está com alguém hoje; informe com quem em \"Em poder de\"."
  ],
  "r.acervo.g-q": [
   "Em poder de",
   "Nome de quem está com o livro neste momento. O sistema já registra esse empréstimo."
  ],
  "r.acervo.g-l": [
   "Localização física no Parque",
   "Onde o livro fica (ex.: Estante B - Prateleira 2). Aparece para o público, para que qualquer pessoa encontre o livro."
  ],
  "r.acervo.g-n": [
   "Número de exemplares",
   "Quantos exemplares iguais o Parque tem. Cada empréstimo ocupa um exemplar."
  ],
  "r.acervo.g-d": [
   "Resumo / sinopse",
   "Breve descrição da obra, mostrada na área pública."
  ],
  "r.acervo.g-c": [
   "Foto da capa",
   "Imagem da capa (foto do celular serve). É reduzida automaticamente."
  ],
  "r.acervo.g-u": [
   "Link para leitura",
   "Opcional: endereço onde o livro pode ser lido online. Aparece como \"Acessar leitura\"."
  ],
  "r.acervo.t.cadastrar-livro": [
   "Cadastrar livro",
   "Grava o livro no acervo. Ele passa a aparecer na Biblioteca do Parque e na página inicial."
  ],
  "r.acervo.ed": [
   "Editar livro",
   "Carrega os dados deste livro no formulário acima para alteração."
  ],
  "r.acervo.del": [
   "Excluir livro",
   "Remove o livro do acervo. Uma cópia fica na Lixeira do sistema (Backup e Segurança)."
  ],
  "r.acervo.ls.est": [
   "Catálogo e estoque",
   "Livros à venda, preços e exemplares em estoque."
  ],
  "r.acervo.ls.venda": [
   "Registrar venda",
   "Registra a venda de um livro do estoque da Livraria."
  ],
  "r.acervo.ls.rel": [
   "Vendas e relatório",
   "Vendas da Livraria por período, com impressão e CSV."
  ],
  "r.acervo.ls.enc": [
   "Pré-lançamento e encomendas",
   "Livros em pré-lançamento, fila de encomendas, pagamentos, convites e o lançamento do livro."
  ],
  "r.acervo.l-t": [
   "Título",
   "Nome do livro à venda."
  ],
  "r.acervo.l-p": [
   "Preço de venda",
   "Valor cobrado por exemplar, em reais (ex.: 45,00)."
  ],
  "r.acervo.l-e": [
   "Exemplares em estoque",
   "Quantos exemplares estão disponíveis para venda. Cada venda registrada desconta do estoque."
  ],
  "r.acervo.l-o": [
   "Observações",
   "Informações internas: edição, origem do lote, onde o estoque fica guardado."
  ],
  "r.acervo.l-pre": [
   "Livro em pré-lançamento",
   "O livro ainda não chegou e aceita encomendas antecipadas pelo site, com preço de pré-venda. Só o administrador altera."
  ],
  "r.acervo.l-pd": [
   "Lançamento previsto",
   "Data em que o livro deve chegar. Aparece no convite e na página de encomenda."
  ],
  "r.acervo.l-pp": [
   "Preço de pré-venda",
   "Preço para quem encomenda antes do lançamento."
  ],
  "r.acervo.l-pz": [
   "Encomendar pelo site até",
   "Opcional: depois desta data, o link de compra antecipada deixa de aceitar encomendas."
  ],
  "r.acervo.l-pt": [
   "Frase do convite",
   "Opcional: frase curta usada no convite por e-mail e WhatsApp (ex.: Nova edição revista)."
  ],
  "r.acervo.l-pr": [
   "Responsável temporário",
   "Pessoa que cuida das encomendas deste livro (registrar pagamento, entregar, gerar convite) sem alterar o catálogo."
  ],
  "r.acervo.l-pa": [
   "Responsável até",
   "Opcional: data final do acesso do responsável temporário."
  ],
  "r.zoom.z-t": [
   "Título",
   "Nome da atividade ou encontro transmitido."
  ],
  "r.zoom.z-d": [
   "Data e horário",
   "Quando a transmissão começa."
  ],
  "r.zoom.z-u": [
   "Duração estimada",
   "Tempo previsto da transmissão."
  ],
  "r.zoom.z-l": [
   "Link do Zoom",
   "Endereço da reunião criada na conta do Zoom (começa com https://zoom.us/j/...)."
  ],
  "r.zoom.t.agendar": [
   "Agendar",
   "Grava a transmissão na lista de agendamentos."
  ],
  "r.reservas.s.ped": [
   "Pedidos",
   "Pedidos aguardando resposta, confirmados e recusados. Aqui você indica as camas e confirma ou recusa."
  ],
  "r.reservas.s.ocup": [
   "Ocupação",
   "Quem está em cada cama dos quartos e na ASSEFAZ em uma data, e o encaminhamento para a ASSEFAZ."
  ],
  "r.reservas.s.novo": [
   "Registrar pedido",
   "Cadastre um pedido que chegou por e-mail ou WhatsApp."
  ],
  "r.reservas.s.rel": [
   "Relatório e recebimentos",
   "Hóspedes, diárias e valores recebidos por local; registre os recebimentos."
  ],
  "r.reservas.n-n": [
   "Nome",
   "Nome de quem fez o pedido."
  ],
  "r.reservas.n-t": [
   "Telefone",
   "Telefone ou WhatsApp para a resposta."
  ],
  "r.reservas.n-c": [
   "Dia de chegada",
   "Primeiro dia da hospedagem."
  ],
  "r.reservas.n-s": [
   "Dia de saída",
   "Dia em que a pessoa ou o grupo vai embora. As diárias são contadas entre a chegada e a saída."
  ],
  "r.reservas.n-p": [
   "Quantidade de pessoas",
   "Quantas pessoas vêm. Para grupos, liste os nomes em Detalhes."
  ],
  "r.reservas.n-g": [
   "Precisa de cama no alojamento",
   "Marque se as pessoas vão dormir no Parque. Sem esta marcação, o pedido não ocupa camas."
  ],
  "r.reservas.n-b": [
   "Precisa de cama de baixo",
   "Para quem tem dificuldade de subir em beliche. Ajuda na distribuição das camas."
  ],
  "r.reservas.n-nec": [
   "Necessidades específicas",
   "Saúde, mobilidade, alimentação ou outras necessidades a considerar."
  ],
  "r.reservas.t.registrar-pedido": [
   "Registrar pedido",
   "Grava o pedido como \"Aguardando resposta\". Depois, indique as camas na aba Pedidos."
  ],
  "r.reservas.o-d": [
   "Data da ocupação",
   "Escolha o dia para ver quem está em cada cama."
  ],
  "r.reservas.r-de": [
   "Período: de",
   "Início do período do relatório (chegada ou recebimento)."
  ],
  "r.reservas.r-ate": [
   "Período: até",
   "Fim do período do relatório."
  ],
  "r.reservas.r-x": [
   "Limpar período",
   "Volta a mostrar todo o período."
  ],
  "r.estela.et": [
   "Etapas da Estela",
   "Etapa 1: cadastrar as pessoas. Etapa 2: decidir quais nomes ficam públicos na Estela Virtual."
  ],
  "r.estela.e-n": [
   "Nome completo",
   "Nome como deve aparecer na Estela, se for publicado."
  ],
  "r.estela.e-t": [
   "Tipo de contribuição",
   "Direta (trabalhou na construção) ou indireta (doou, apoiou, divulgou...)."
  ],
  "r.estela.e-d": [
   "Como contribuiu",
   "Descreva a contribuição (ex.: trabalhou na construção da Sala, doou materiais)."
  ],
  "r.estela.e-p": [
   "Período da contribuição",
   "Quando a pessoa contribuiu (ex.: 2012 a 2016)."
  ],
  "r.estela.e-m": [
   "Contato",
   "E-mail ou WhatsApp, para confirmar dados. Nunca aparece no site."
  ],
  "r.estela.e-o": [
   "Observações internas",
   "Visível apenas na área restrita."
  ],
  "r.estela.t.salvar-cadastro": [
   "Salvar cadastro",
   "Grava a pessoa na lista. Nada fica público nesta etapa."
  ],
  "r.estela.e-lote": [
   "Vários nomes de uma vez",
   "Cole um nome completo por linha. Depois complete os dados de cada pessoa."
  ],
  "r.estela.e-lote-b": [
   "Cadastrar nomes",
   "Cadastra todos os nomes colados acima, um por linha."
  ],
  "r.estela.e2-f": [
   "Mostrar",
   "Filtra os nomes: aguardando decisão, públicos, privados ou todos."
  ],
  "r.estela.e2-all": [
   "Selecionar todos",
   "Marca todos os nomes da lista que está na tela."
  ],
  "r.estela.e2-pub": [
   "Tornar públicos",
   "Os nomes marcados passam a aparecer na Estela Virtual do site."
  ],
  "r.estela.e2-priv": [
   "Manter privados",
   "Os nomes marcados ficam só na área restrita."
  ],
  "r.estela.t.estela-virtual": [
   "Estela Virtual",
   "Abre a página pública da Estela para conferir o resultado.",
   "estela-virtual"
  ],
  "r.el_sala.el-d": [
   "Descrição do elemento",
   "Escreva o que este elemento fará e para que servirá. Leitores consultam; Editores e Administradores alteram."
  ],
  "r.el_sala.t.salvar-descricao": [
   "Salvar descrição",
   "Grava a descrição e registra a data e quem atualizou."
  ],
  "r.el_monolito.el-d": [
   "Descrição do elemento",
   "Escreva o que este elemento fará e para que servirá. Leitores consultam; Editores e Administradores alteram."
  ],
  "r.el_monolito.t.salvar-descricao": [
   "Salvar descrição",
   "Grava a descrição e registra a data e quem atualizou."
  ],
  "r.el_portao.el-d": [
   "Descrição do elemento",
   "Escreva o que este elemento fará e para que servirá. Leitores consultam; Editores e Administradores alteram."
  ],
  "r.el_portao.t.salvar-descricao": [
   "Salvar descrição",
   "Grava a descrição e registra a data e quem atualizou."
  ],
  "r.el_fonte.el-d": [
   "Descrição do elemento",
   "Escreva o que este elemento fará e para que servirá. Leitores consultam; Editores e Administradores alteram."
  ],
  "r.el_fonte.t.salvar-descricao": [
   "Salvar descrição",
   "Grava a descrição e registra a data e quem atualizou."
  ],
  "r.el_centro-trabalho.el-d": [
   "Descrição do elemento",
   "Escreva o que este elemento fará e para que servirá. Leitores consultam; Editores e Administradores alteram."
  ],
  "r.el_centro-trabalho.t.salvar-descricao": [
   "Salvar descrição",
   "Grava a descrição e registra a data e quem atualizou."
  ],
  "r.el_centro-estudos.el-d": [
   "Descrição do elemento",
   "Escreva o que este elemento fará e para que servirá. Leitores consultam; Editores e Administradores alteram."
  ],
  "r.el_centro-estudos.t.salvar-descricao": [
   "Salvar descrição",
   "Grava a descrição e registra a data e quem atualizou."
  ],
  "r.el_oficinas.el-d": [
   "Descrição do elemento",
   "Escreva o que este elemento fará e para que servirá. Leitores consultam; Editores e Administradores alteram."
  ],
  "r.el_oficinas.t.salvar-descricao": [
   "Salvar descrição",
   "Grava a descrição e registra a data e quem atualizou."
  ],
  "r.album.s.minhas": [
   "Enviar e minhas fotos",
   "Envie fotos e veja as que você enviou, com a situação de cada uma."
  ],
  "r.album.s.todas": [
   "Fotos por atividade",
   "Todas as fotos, agrupadas pela atividade em que foram tiradas."
  ],
  "r.album.s.cur": [
   "Curadoria",
   "Escolha quais fotos aparecem no Álbum de fotos do site."
  ],
  "r.album.s.evs": [
   "Atividades do Álbum",
   "Crie, renomeie ou exclua as atividades usadas para organizar as fotos."
  ],
  "r.album.a-f": [
   "Fotos",
   "Escolha até 10 fotos por envio. Elas são reduzidas automaticamente."
  ],
  "r.album.a-e": [
   "Atividade",
   "Em qual atividade as fotos foram tiradas. Escolha \"nova atividade\" para criar uma."
  ],
  "r.album.a-n": [
   "Nome da nova atividade",
   "Nome da atividade que será criada junto com o envio."
  ],
  "r.album.a-d": [
   "Dia da foto",
   "Quando a foto foi tirada."
  ],
  "r.album.a-a": [
   "Autor da foto",
   "Quem tirou a foto."
  ],
  "r.album.a-m": [
   "Mostrar o nome do autor",
   "Se \"Sim\", o nome aparece junto da foto quando ela for publicada."
  ],
  "r.album.a-l": [
   "Legenda",
   "Opcional: texto que acompanha todas as fotos deste envio."
  ],
  "r.album.t.enviar-fotos": [
   "Enviar fotos",
   "Envia as fotos para a curadoria. Elas aparecem no site só depois de publicadas."
  ],
  "r.album.a-ev": [
   "Filtrar por atividade",
   "Mostra só as fotos da atividade escolhida."
  ],
  "r.album.f.pendente": [
   "Aguardando",
   "Fotos que ainda não passaram pela curadoria."
  ],
  "r.album.f.publicada": [
   "Publicadas",
   "Fotos que aparecem no Álbum de fotos do site."
  ],
  "r.album.f.recusada": [
   "Não publicadas",
   "Fotos recusadas pela curadoria; ficam só na área restrita."
  ],
  "r.album.f.todas": [
   "Todas",
   "Todas as fotos, em qualquer situação."
  ],
  "r.album.v-n": [
   "Nova atividade",
   "Nome de uma atividade para organizar as fotos (ex.: Encontro de Jovens)."
  ],
  "r.album.ren": [
   "Renomear atividade",
   "Muda o nome da atividade; as fotos continuam ligadas a ela."
  ],
  "r.album.exc": [
   "Excluir atividade",
   "Remove a atividade da lista. Uma cópia fica na Lixeira do sistema (Backup e Segurança)."
  ],
  "r.album.t.o-parque-atividades-album-de-fotos": [
   "Ver o Álbum público",
   "Abre a página pública do Álbum de fotos.",
   "enviar-fotos-album"
  ],
  "r.documentos.s.atas": [
   "Atas das Reuniões de Escola",
   "Atas organizadas por ano, com os encaminhamentos de cada reunião."
  ],
  "r.documentos.s.semana": [
   "Calendário Semanal",
   "Atividades da semana, dia a dia."
  ],
  "r.documentos.s.mes": [
   "Calendário Mensal",
   "Atividades do mês escolhido."
  ],
  "r.documentos.s.tri": [
   "Calendário Trimestral",
   "Três meses lado a lado."
  ],
  "r.documentos.s.sem": [
   "Calendário Semestral",
   "Seis meses lado a lado."
  ],
  "r.documentos.s.ano": [
   "Calendário Anual",
   "O ano inteiro e o cadastro das datas fixas anuais."
  ],
  "r.documentos.d-novo": [
   "Novo documento",
   "Abre o formulário para cadastrar uma ata ou outro documento, com seus encaminhamentos."
  ],
  "r.documentos.l-ab": [
   "Só atas com encaminhamentos em aberto",
   "Mostra apenas as atas que ainda têm algo combinado e não feito."
  ],
  "r.documentos.l-q": [
   "Buscar atas",
   "Procura no título e na descrição das atas."
  ],
  "r.documentos.a-novo": [
   "Nova atividade",
   "Cadastra uma atividade que aparece em todos os calendários (semanal a anual)."
  ],
  "r.documentos.w-d": [
   "Ir para a semana de",
   "Escolha uma data para ver a semana dela."
  ],
  "r.documentos.c-c": [
   "Tipo de atividade",
   "Mostra só as atividades do tipo escolhido."
  ],
  "r.documentos.com": [
   "Planejar publicações",
   "Abre a Comunicação para planejar as publicações desta atividade ou data.",
   "calendario-comunicacao"
  ],
  "r.documentos.fe": [
   "Editar data fixa",
   "Carrega a data fixa no formulário para alteração."
  ],
  "r.documentos.fd": [
   "Excluir data fixa",
   "Remove a data fixa de todos os anos. Uma cópia fica na Lixeira do sistema (Backup e Segurança)."
  ],
  "r.documentos.f-d": [
   "Dia",
   "Dia do mês em que a data se repete todos os anos."
  ],
  "r.documentos.f-m": [
   "Mês",
   "Mês da data fixa."
  ],
  "r.documentos.f-t": [
   "Nome da data",
   "Como a data aparece nos calendários (ex.: Dia Internacional da Não-Violência)."
  ],
  "r.documentos.t.adicionar-data-fixa": [
   "Adicionar data fixa",
   "Grava a data; ela aparece em todos os calendários de todos os anos."
  ],
  "r.atividades.at-novo": [
   "Nova atividade",
   "Abre o formulário: título, tipo, onde acontece, data, local, lide, texto, foto, autor, banner do Início e situação."
  ],
  "r.atividades.at-fil": [
   "Mostrar",
   "Filtra a lista por tipo: eventos, encontros, retiros ou reuniões."
  ],
  "r.atividades.t.o-parque-atividades": [
   "Ver no site",
   "Abre a página pública O Parque › Atividades.",
   "atividades-publicas"
  ],
  "r.reuniao.r-novo": [
   "Nova reunião",
   "Cria a pesquisa de datas (dois dias de fim de semana) para a próxima Reunião de Escola."
  ],
  "r.grupos.g-novo": [
   "Criar grupo",
   "Cria um grupo de discussão por tema. Depois, convide os membros."
  ],
  "r.multiuso.s.agenda": [
   "Agenda de uso",
   "Quem vai usar o espaço multiuso, quando e para quê."
  ],
  "r.multiuso.s.planos": [
   "Planejamentos",
   "Melhorias e projetos do espaço (reforma, compras, calendário)."
  ],
  "r.multiuso.s.info": [
   "Regras e informações",
   "Responsável pelo espaço, contato e regras de uso."
  ],
  "r.multiuso.s.docs": [
   "Documentos",
   "Regras, plantas, autorizações e orçamentos do Multiuso."
  ],
  "r.multiuso.m-d": [
   "Data",
   "Dia do uso do espaço."
  ],
  "r.multiuso.m-a": [
   "Atividade",
   "O que vai acontecer (ex.: oficina, reunião, encontro de jovens)."
  ],
  "r.multiuso.m-q": [
   "Quem vai usar",
   "Grupo ou pessoa que usará o espaço."
  ],
  "r.multiuso.m-r": [
   "Responsável pelo uso",
   "Quem responde pelo espaço durante o uso (abrir, fechar, limpeza)."
  ],
  "r.multiuso.m-s": [
   "Situação",
   "Reservado (previsto), Realizado ou Cancelado."
  ],
  "r.multiuso.t.adicionar-a-agenda": [
   "Adicionar à agenda",
   "Grava o uso na agenda do Multiuso."
  ],
  "r.multiuso.i-g": [
   "Regras de uso",
   "Como reservar, cuidados com o espaço, limpeza e horários. Visível para quem consulta o Multiuso."
  ],
  "r.jardinagem.s.jardinagem": [
   "Planejamento de jardinagem",
   "Ações de poda, adubação, plantio e manutenção dos jardins."
  ],
  "r.jardinagem.s.reflorestamento": [
   "Planejamento de reflorestamento",
   "Plantio de mudas, com espécies e quantidades."
  ],
  "r.jardinagem.s.docs": [
   "Documentos",
   "Mapas, licenças e orientações técnicas."
  ],
  "r.jardinagem.s.resumo": [
   "Resumo",
   "Contagem por situação, mudas planejadas, voluntários necessários e próximas ações."
  ],
  "r.jardinagem.p-l": [
   "Local / área do Parque",
   "Onde a ação acontece (ex.: entrada, entorno da Fonte)."
  ],
  "r.jardinagem.p-v": [
   "Voluntários necessários",
   "Quantas pessoas a ação precisa. Ajuda a convocar voluntários."
  ],
  "r.jardinagem.p-e": [
   "Espécies a plantar",
   "Quais mudas serão plantadas. Confira com orientação técnica."
  ],
  "r.jardinagem.p-m": [
   "Quantidade de mudas",
   "Total de mudas previstas; somado no Resumo."
  ],
  "r.multiuso.p-t": [
   "Título do planejamento",
   "Nome curto da ação planejada."
  ],
  "r.multiuso.p-s": [
   "Situação",
   "Planejado, Em andamento, Concluído ou Adiado. Usada nos filtros e no resumo."
  ],
  "r.multiuso.p-fil": [
   "Filtrar por situação",
   "Mostra só os planejamentos na situação escolhida. Nada é apagado."
  ],
  "r.multiuso.t.adicionar-planejamento": [
   "Adicionar planejamento",
   "Grava o planejamento na lista."
  ],
  "r.multiuso.d-l": [
   "Link do documento",
   "Endereço do arquivo no Drive ou em outro lugar. Prefira link para arquivos grandes."
  ],
  "r.multiuso.d-f": [
   "Arquivo",
   "PDF ou imagem de até 1 MB. Para arquivos maiores, use o link."
  ],
  "r.multiuso.t.adicionar-documento": [
   "Adicionar documento",
   "Grava o documento (link e/ou arquivo) na lista."
  ],
  "r.jardinagem.p-t": [
   "Título do planejamento",
   "Nome curto da ação planejada."
  ],
  "r.jardinagem.p-s": [
   "Situação",
   "Planejado, Em andamento, Concluído ou Adiado. Usada nos filtros e no resumo."
  ],
  "r.jardinagem.p-fil": [
   "Filtrar por situação",
   "Mostra só os planejamentos na situação escolhida. Nada é apagado."
  ],
  "r.jardinagem.t.adicionar-planejamento": [
   "Adicionar planejamento",
   "Grava o planejamento na lista."
  ],
  "r.jardinagem.d-l": [
   "Link do documento",
   "Endereço do arquivo no Drive ou em outro lugar. Prefira link para arquivos grandes."
  ],
  "r.jardinagem.d-f": [
   "Arquivo",
   "PDF ou imagem de até 1 MB. Para arquivos maiores, use o link."
  ],
  "r.jardinagem.t.adicionar-documento": [
   "Adicionar documento",
   "Grava o documento (link e/ou arquivo) na lista."
  ],
  "r.lojinha.lj.prod": [
   "Produtos e estoque",
   "Cadastro de produtos, estoque e publicação no site."
  ],
  "r.lojinha.lj.custo": [
   "Custos e preço",
   "Lance os custos do lote e a margem para calcular o preço sugerido."
  ],
  "r.lojinha.lj.venda": [
   "Registrar venda",
   "Registre uma venda; o estoque baixa sozinho."
  ],
  "r.lojinha.lj.rel": [
   "Vendas e relatório",
   "Situação por produto e vendas, com impressão, CSV e lançamento na Prestação de Contas."
  ],
  "r.lojinha.j-n": [
   "Nome do produto",
   "Como aparece na Lojinha do site (ex.: Camiseta Parque Retiro (M))."
  ],
  "r.lojinha.j-o": [
   "Como o produto chega",
   "Pronto para venda (comprado ou doado) ou produzido pelo Parque. Produzidos usam a aba Custos e preço."
  ],
  "r.lojinha.j-p": [
   "Preço de venda",
   "Valor cobrado por unidade."
  ],
  "r.lojinha.j-e": [
   "Unidades em estoque",
   "Quantas unidades existem agora. Sem estoque, o site mostra \"Esgotado\"."
  ],
  "r.lojinha.j-pub": [
   "Publicar no site",
   "Mostra o produto em Ajude o Parque › Lojinha."
  ],
  "r.lojinha.t.cadastrar-produto": [
   "Cadastrar produto",
   "Grava o produto. Se marcado para publicar, ele aparece na Lojinha do site."
  ],
  "r.rifa.rf.rifas": [
   "Rifas",
   "Cadastro das rifas e lista das rifas existentes."
  ],
  "r.rifa.rf.part": [
   "Participantes",
   "Conferência dos comprovantes: confirmar, recusar ou estornar participações."
  ],
  "r.rifa.rf.sorteio": [
   "Sorteio",
   "Apuração pela Loteria Federal (automática ou com os 5 prêmios digitados)."
  ],
  "r.rifa.rf.arrec": [
   "Arrecadação",
   "Totais por rifa e forma de pagamento, conferência com a Prestação de Contas e CSV."
  ],
  "r.rifa.rf.uso": [
   "Uso do recurso",
   "Registro de como o dinheiro arrecadado foi usado."
  ],
  "r.rifa.r-t": [
   "Título da rifa",
   "Nome que aparece no site (ex.: Rifa solidária - Cesta de produtos orgânicos)."
  ],
  "r.rifa.r-d": [
   "Descrição do prêmio",
   "O que será rifado, quem doou e como será entregue."
  ],
  "r.rifa.r-p": [
   "Valor de cada número",
   "Preço de um número, em reais."
  ],
  "r.rifa.r-n": [
   "Quantidade de números",
   "10, 100 ou 1.000 números. Define quantos dígitos do prêmio da Loteria Federal valem."
  ],
  "r.rifa.r-dt": [
   "Dia do sorteio",
   "Data da extração da Loteria Federal (quartas e sábados). As inscrições fecham no dia anterior."
  ],
  "r.rifa.r-i": [
   "Instruções de pagamento",
   "Chave PIX, banco, titular ou conta M$. Aparecem para quem vai participar."
  ],
  "r.rifa.r-pub": [
   "Aberta no site",
   "Mostra a rifa em Ajude o Parque › Rifa Solidária e aceita participações."
  ],
  "r.rifa.t.cadastrar-rifa": [
   "Cadastrar rifa",
   "Grava a rifa. Se estiver marcada como aberta, ela aparece no site."
  ],
  "r.rifa.pf-r": [
   "Rifa",
   "Mostra só os participantes da rifa escolhida."
  ],
  "r.rifa.pf-s": [
   "Situação",
   "Aguardando conferência, Confirmado ou Recusado."
  ],
  "r.rifa.t.registrar-participacao-manual-venda-pres": [
   "Participação manual",
   "Para venda presencial ou dinheiro em espécie: registra a participação já confirmada."
  ],
  "r.vaquinha.vq.vaq": [
   "Vaquinhas",
   "Cadastro das vaquinhas e lista das existentes."
  ],
  "r.vaquinha.vq.contr": [
   "Contribuições",
   "Conferência dos comprovantes: confirmar, recusar ou estornar."
  ],
  "r.vaquinha.vq.arrec": [
   "Arrecadação",
   "Gráfico da meta, totais por forma de pagamento e conferência com a Prestação de Contas."
  ],
  "r.vaquinha.v-t": [
   "Nome da vaquinha",
   "Nome que aparece no site (ex.: Vaquinha Manutenção da Grama)."
  ],
  "r.vaquinha.v-o": [
   "Objetivo",
   "Para que serve o dinheiro, o que será feito e por quê."
  ],
  "r.vaquinha.v-m": [
   "Meta de arrecadação",
   "Valor total a arrecadar, em reais. O gráfico mostra a porcentagem atingida."
  ],
  "r.vaquinha.v-p": [
   "Prazo",
   "Opcional: depois desta data a vaquinha para de receber contribuições."
  ],
  "r.vaquinha.v-i": [
   "Como ajudar",
   "Instruções de pagamento (chave PIX, banco, M$) que aparecem para quem vai contribuir."
  ],
  "r.vaquinha.v-x": [
   "Outras formas de ajudar",
   "Opcional: doar material, oferecer dias de trabalho voluntário etc."
  ],
  "r.vaquinha.v-pub": [
   "Aberta no site",
   "Mostra a vaquinha em Ajude o Parque › Vaquinha Coletiva."
  ],
  "r.vaquinha.t.cadastrar-vaquinha": [
   "Cadastrar vaquinha",
   "Grava a vaquinha; se aberta, ela aparece no site com o gráfico da meta."
  ],
  "r.vaquinha.cf-v": [
   "Vaquinha",
   "Mostra só as contribuições da vaquinha escolhida."
  ],
  "r.vaquinha.cf-s": [
   "Situação",
   "Aguardando conferência, Confirmado ou Recusado."
  ],
  "r.vaquinha.t.registrar-contribuicao-manual-valor-rece": [
   "Contribuição manual",
   "Para valor recebido em mãos: já entra confirmado, no gráfico e na Prestação de Contas."
  ],
  "r.rifa.v.pix": [
   "PIX / Banco Institucional",
   "Aceita pagamento por PIX ou transferência para a conta institucional."
  ],
  "r.rifa.v.mumbuca": [
   "M$ (Banco Mumbuca)",
   "Aceita a moeda social de Maricá. No gráfico, soma 1 para 1 com o real."
  ],
  "r.rifa.v.especie": [
   "Dinheiro em espécie",
   "Só por registro manual, feito pela Comissão ao receber o dinheiro."
  ],
  "r.rifa.v.asaas": [
   "Asaas",
   "PIX, cartão, boleto ou maquininha pelo Asaas. Só registro manual."
  ],
  "r.vaquinha.v.pix": [
   "PIX / Banco Institucional",
   "Aceita pagamento por PIX ou transferência para a conta institucional."
  ],
  "r.vaquinha.v.mumbuca": [
   "M$ (Banco Mumbuca)",
   "Aceita a moeda social de Maricá. No gráfico, soma 1 para 1 com o real."
  ],
  "r.vaquinha.v.especie": [
   "Dinheiro em espécie",
   "Só por registro manual, feito pela Comissão ao receber o dinheiro."
  ],
  "r.vaquinha.v.asaas": [
   "Asaas",
   "PIX, cartão, boleto ou maquininha pelo Asaas. Só registro manual."
  ],
  "r.voluntarios.vs-s": [
   "Situação",
   "Novo, Em contato, Voluntário(a) ativo(a) ou Sem retorno."
  ],
  "r.voluntarios.vs-a": [
   "Forma de colaborar",
   "Mostra só quem quer ajudar nesta área."
  ],
  "r.vol_acoes.va-n": [
   "Nome da ação",
   "Nome curto (ex.: Mutirão de limpeza da trilha)."
  ],
  "r.vol_acoes.va-o": [
   "Objetivo",
   "Para que serve esta ação e o que se quer alcançar."
  ],
  "r.vol_acoes.va-p": [
   "Plano",
   "Como será feita: etapas, local, quantas pessoas e materiais."
  ],
  "r.vol_acoes.va-q": [
   "Tempo de duração",
   "Quanto tempo a ação deve durar, se possível."
  ],
  "r.vol_acoes.va-u": [
   "Unidade de tempo",
   "Horas, dias, semanas ou meses."
  ],
  "r.vol_acoes.t.criar-acao": [
   "Criar ação",
   "Grava a ação de voluntário na lista."
  ],
  "r.ajude.ir": [
   "Abrir",
   "Abre esta ferramenta."
  ],
  "r.comunicacao.s.cal": [
   "Calendário de Comunicação",
   "Publicações planejadas junto das atividades e datas fixas do Parque."
  ],
  "r.comunicacao.s.pub": [
   "Publicações",
   "Painel por canal e formato, fila de publicação e lista. O número vermelho indica atrasadas ou para hoje."
  ],
  "r.comunicacao.s.gerar": [
   "Criar a partir do calendário",
   "Cria uma publicação por rede social a partir de uma atividade ou data dos calendários."
  ],
  "r.comunicacao.s.redes": [
   "Redes sociais",
   "Canais usados pelo Parque: nome, ícone, cor e se estão ativos."
  ],
  "r.comunicacao.s.proj": [
   "Projetos e campanhas",
   "Campanhas para agrupar e filtrar publicações (ex.: Celebração dos 15 anos)."
  ],
  "r.comunicacao.s.tipos": [
   "Tipos de publicação",
   "Formatos disponíveis: post, carrossel, reels, stories, banner do site etc."
  ],
  "r.comunicacao.s.fixas": [
   "Datas fixas anuais",
   "Datas que se repetem todos os anos e aparecem em todos os calendários."
  ],
  "r.comunicacao.s.site": [
   "Site",
   "Banners de cada página do site (fixo ou carrossel) e o pacote para publicar.",
   "banners-do-site"
  ],
  "r.comunicacao.s.equipe": [
   "Equipe e convidados",
   "Quem pode colaborar em cada projeto e com qual função."
  ],
  "r.comunicacao.s.arq": [
   "Arquivos",
   "Materiais com origem, direitos de uso e autorização de imagem."
  ],
  "r.comunicacao.s.ind": [
   "Indicadores",
   "Números das redes por canal e por projeto."
  ],
  "r.comunicacao.s.conect": [
   "Conectores",
   "Regras para futuras publicações automáticas pelo servidor."
  ],
  "r.comunicacao.p-novo": [
   "Nova publicação",
   "Cria uma publicação avulsa em uma rede social."
  ],
  "r.comunicacao.k-v": [
   "Visão",
   "Semanal, mensal, trimestral, semestral ou anual."
  ],
  "r.comunicacao.a-novo": [
   "Nova ação de comunicação",
   "Uma ação reúne vários canais e formatos para o mesmo assunto, com texto base, materiais e checklist.",
   "painel-publicacoes"
  ],
  "r.comunicacao.pv.painel": [
   "Painel por canal e formato",
   "Tabela de ações × canais, com o formato e o status de cada publicação.",
   "painel-publicacoes"
  ],
  "r.comunicacao.pv.fila": [
   "Fila de publicação",
   "O que falta publicar: atrasadas, hoje, próximos 7 e 30 dias, com texto pronto para copiar.",
   "painel-publicacoes"
  ],
  "r.comunicacao.pv.lista": [
   "Lista de publicações",
   "Todas as publicações por data, com mudança de status direto na lista.",
   "painel-publicacoes"
  ],
  "r.comunicacao.ban": [
   "Gerenciar banners",
   "Abre a sub-aba Site, com todos os banners das páginas.",
   "banners-do-site"
  ],
  "r.comunicacao.fr": [
   "Formato do canal",
   "Marque os formatos que este canal oferece. Só os marcados aparecem na escolha das ações.",
   "cadastros-comunicacao"
  ],
  "r.comunicacao.t.configurar-quais-formatos-cada-canal-ofe": [
   "Formatos por canal",
   "Abre a tabela para marcar quais formatos cada canal oferece.",
   "cadastros-comunicacao"
  ],
  "r.comunicacao.g-e": [
   "Atividade ou data",
   "Escolha a atividade ou data do calendário que será divulgada."
  ],
  "r.comunicacao.f.nome": [
   "Nome",
   "Como o item aparece nas listas, filtros e no calendário."
  ],
  "r.comunicacao.f.icone": [
   "Ícone",
   "Símbolo da rede social nas listas e no calendário."
  ],
  "r.comunicacao.f.cor": [
   "Cor",
   "Cor usada para identificar a rede no calendário."
  ],
  "r.comunicacao.f.ativa": [
   "Ativa",
   "Desmarque para esconder o item das escolhas sem apagar o histórico."
  ],
  "r.comunicacao.rm": [
   "Excluir",
   "Remove o item da lista. Prefira desmarcar \"Ativa\" para manter o histórico. Uma cópia fica na Lixeira do sistema (Backup e Segurança)."
  ],
  "r.comunicacao.c-n": [
   "Nova rede social",
   "Nome do novo canal (ex.: TikTok, Telegram)."
  ],
  "r.comunicacao.fe": [
   "Editar data fixa",
   "Carrega a data fixa no formulário para alteração."
  ],
  "r.comunicacao.fd": [
   "Excluir data fixa",
   "Remove a data fixa de todos os anos. Uma cópia fica na Lixeira do sistema (Backup e Segurança)."
  ],
  "r.comunicacao.f-d": [
   "Dia",
   "Dia do mês em que a data se repete todos os anos."
  ],
  "r.comunicacao.f-t": [
   "Nome da data",
   "Como a data aparece nos calendários."
  ],
  "r.comunicacao.bn-zip": [
   "Baixar pacote para publicar",
   "Gera o arquivo .zip com a pasta banners. Copie essa pasta para a hospedagem do site para o público ver os banners.",
   "banners-do-site"
  ],
  "r.comunicacao.a.abrir": [
   "Configurar banner",
   "Abre a configuração do banner desta página: fixo ou carrossel, imagens, descrição e link.",
   "banners-do-site"
  ],
  "r.comunicacao.eq-an": [
   "Quem criou não aprova",
   "Recomendado: quem criou a publicação não pode aprová-la. Garante uma segunda leitura.",
   "equipe-convidados"
  ],
  "r.comunicacao.eq-pg": [
   "Interruptor de emergência",
   "Pausa toda publicação automática (quando os conectores estiverem ligados).",
   "equipe-convidados"
  ],
  "r.comunicacao.eq-e": [
   "E-mail do convidado",
   "O mesmo e-mail da conta da pessoa na área restrita.",
   "equipe-convidados"
  ],
  "r.comunicacao.eq-j": [
   "Projetos ou campanhas",
   "Em quais projetos a pessoa pode colaborar. Segure Ctrl (Cmd no Mac) para marcar vários.",
   "equipe-convidados"
  ],
  "r.comunicacao.eq-a": [
   "Válido até",
   "Depois desta data o convite deixa de valer.",
   "equipe-convidados"
  ],
  "r.comunicacao.eq-ok": [
   "Autorização prévia",
   "Confirme que o Instituto autorizou esta pessoa antes de conceder o acesso.",
   "equipe-convidados"
  ],
  "r.comunicacao.v.autor": [
   "Autor",
   "Escreve e propõe publicações.",
   "equipe-convidados"
  ],
  "r.comunicacao.v.revisor": [
   "Revisor",
   "Revisa e comenta textos e materiais.",
   "equipe-convidados"
  ],
  "r.comunicacao.v.aprovador": [
   "Aprovador",
   "Aprova a publicação antes de ir para a fila.",
   "equipe-convidados"
  ],
  "r.comunicacao.v.publicador": [
   "Publicador",
   "Publica nas redes e marca como publicada, com o link.",
   "equipe-convidados"
  ],
  "r.comunicacao.t.autorizar-convite": [
   "Autorizar convite",
   "Concede o acesso ao convidado, nos projetos e funções escolhidos, até a data de validade.",
   "equipe-convidados"
  ],
  "r.comunicacao.ar-l": [
   "Link do arquivo",
   "Endereço do material no Drive ou em outro lugar.",
   "arquivos-indicadores-conectores"
  ],
  "r.comunicacao.ar-d": [
   "Direitos e licença",
   "Obrigatório para material de terceiros: quem autorizou e em que condições.",
   "arquivos-indicadores-conectores"
  ],
  "r.comunicacao.ar-i": [
   "Pessoas na imagem",
   "Imagem com pessoas exige autorização de uso de imagem.",
   "arquivos-indicadores-conectores"
  ],
  "r.contatos.l": [
   "Lista de contatos",
   "Mostra os contatos desta lista."
  ],
  "r.contatos.l.visitante": [
   "Visitante",
   "Pessoas que se cadastraram no site ou no Wi-Fi do Parque."
  ],
  "r.contatos.l.aderente": [
   "Aderente",
   "Lista de aderentes."
  ],
  "r.contatos.l.lancamentos": [
   "Interessados em lançamentos",
   "Quem pediu aviso de lançamentos de livros."
  ],
  "r.contatos.l.postulante": [
   "Postulantes",
   "Lista de postulantes."
  ],
  "r.contatos.ct-i": [
   "Importar vários",
   "Cole um contato por linha: só o e-mail, ou nome;e-mail."
  ],
  "r.contatos.ct-imp": [
   "Importar",
   "Acrescenta os contatos colados à lista, sem repetir e-mails."
  ],
  "r.contatos.t.comunicados-enviados-e-metricas": [
   "Comunicados enviados",
   "Histórico dos Comunicados e as métricas registradas após o envio."
  ],
  "r.contas.c-cc": [
   "Centro de custo",
   "Área do Parque que recebe ou paga o valor (Manutenção, Construção, Eventos, Campanhas, Alojamento...). Define em qual resumo o lançamento aparece."
  ],
  "r.contas.c-ncc": [
   "Novo centro de custo",
   "Cria um centro de custo que ainda não existe na lista."
  ],
  "r.contas.c-t": [
   "Tipo de operação",
   "Se é entrada (+) ou saída (−) e de que tipo (doação, livraria, luz, internet...). Define a categoria nos relatórios."
  ],
  "r.contas.c-nt": [
   "Novo tipo de operação",
   "Cria um tipo de entrada ou saída que ainda não existe (ex.: Seguro do Silo)."
  ],
  "r.contas.nt-t": [
   "É uma entrada ou saída",
   "Entrada soma ao caixa; saída subtrai."
  ],
  "r.contas.nt-g": [
   "Grupo",
   "Grupo do relatório em que o novo tipo vai aparecer."
  ],
  "r.contas.nt-n": [
   "Nome do tipo de operação",
   "Ex.: Seguro do Silo, Doação de materiais."
  ],
  "r.contas.nt-s": [
   "Criar tipo de operação",
   "Grava o novo tipo e já o seleciona no lançamento."
  ],
  "r.contas.c-p": [
   "Pessoa / contribuinte",
   "Nome de quem pagou ou de quem recebeu o valor."
  ],
  "r.contas.c-eu": [
   "Sou eu",
   "Preenche a pessoa com o seu nome."
  ],
  "r.contas.c-r": [
   "Mês de referência",
   "Para a contribuição de manutenção: a qual mês o pagamento se refere."
  ],
  "r.contas.c-v": [
   "Valor",
   "Valor em reais, com vírgula nos centavos (ex.: 150,00)."
  ],
  "r.contas.c-m": [
   "Moeda / forma de pagamento",
   "PIX/Banco Institucional, M$ (Mumbuca), espécie, Asaas... Os totais são separados por forma."
  ],
  "r.contas.c-fm": [
   "Forma usada no Asaas",
   "PIX, boleto, cartão de crédito, débito ou maquininha."
  ],
  "r.contas.c-d": [
   "Data",
   "Data em que o valor entrou ou saiu."
  ],
  "r.contas.c-pt": [
   "Gera bem patrimonial",
   "Marque quando a compra for um bem durável. Depois de registrar, abre o cadastro do Patrimônio já preenchido.",
   "patrimonio-gestao"
  ],
  "r.contas.c-f": [
   "Comprovante / nota fiscal",
   "Imagem ou PDF de até 1 MB. Fica anexado ao lançamento."
  ],
  "r.contas.t.registrar-lancamento": [
   "Registrar lançamento",
   "Grava o lançamento. Ele entra nos resumos e nos Relatórios Consolidados."
  ],
  "r.contas.mz-n": [
   "Nome do contribuinte",
   "Pessoa que contribui todo mês com a manutenção do Parque."
  ],
  "r.contas.mz-v": [
   "Valor mensal",
   "Valor combinado por mês."
  ],
  "r.contas.mz-m": [
   "Forma de pagamento habitual",
   "Como a pessoa costuma pagar."
  ],
  "r.contas.t.cadastrar-contribuinte": [
   "Cadastrar contribuinte",
   "Inclui a pessoa na lista de contribuição mensal."
  ],
  "r.contas.mz-mes": [
   "Mês de conferência",
   "Mostra quem já pagou e quem falta pagar neste mês."
  ],
  "r.compras.s.ped": [
   "Pedidos de compra",
   "Compras pedidas, com cotações, aprovação e registro."
  ],
  "r.compras.s.plano": [
   "Planejamento anual",
   "O que se prevê comprar no ano, mês a mês."
  ],
  "r.compras.s.cons": [
   "Consolidado",
   "Previsto × realizado do ano."
  ],
  "r.compras.pd-n": [
   "Novo pedido de compra",
   "Abre o formulário para pedir uma compra: o que, para qual área, prioridade e justificativa."
  ],
  "r.compras.pd-q": [
   "Buscar pedidos",
   "Por número, título ou área."
  ],
  "r.compras.pd-s": [
   "Situação",
   "Solicitada, Em cotação, Aguardando aprovação, Aprovada, Comprada ou Cancelada."
  ],
  "r.compras.pl-a": [
   "Ano do planejamento",
   "Escolha o ano; \"Abrir outro ano\" começa um planejamento novo."
  ],
  "r.compras.pl-fe": [
   "Fechar planejamento",
   "Trava o planejamento do ano. Pode ser reaberto depois."
  ],
  "r.compras.pi-t": [
   "O que está previsto",
   "Descrição da compra prevista (ex.: Troca do telhado da Sala)."
  ],
  "r.compras.pi-c": [
   "Centro de custo",
   "Área do Parque que vai pagar a compra."
  ],
  "r.compras.pi-nc": [
   "Novo centro de custo",
   "Cria um centro de custo que ainda não existe."
  ],
  "r.compras.pi-k": [
   "Categoria de despesa",
   "Luz, internet, limpeza, água... Usada no fluxo financeiro."
  ],
  "r.compras.pi-v": [
   "Valor estimado total",
   "Quanto se espera gastar no total, em reais."
  ],
  "r.compras.pi-m": [
   "Mês previsto",
   "Mês em que a compra deve acontecer."
  ],
  "r.compras.pi-pt": [
   "Bem para o patrimônio",
   "Marque se a compra será um bem durável do Parque."
  ],
  "r.compras.pi-ok": [
   "Adicionar ao planejamento",
   "Grava o item no planejamento do ano."
  ],
  "r.compras.cn-a": [
   "Ano",
   "Ano do consolidado."
  ],
  "r.users.u-n": [
   "Nome completo",
   "Nome e sobrenome do responsável."
  ],
  "r.users.u-e": [
   "E-mail de acesso",
   "E-mail que a pessoa usará para entrar."
  ],
  "r.users.u-w": [
   "WhatsApp",
   "Número com DDD, para contato."
  ],
  "r.users.u-v": [
   "Nível de acesso",
   "Leitor, Comentador, Editor ou Administrador. Define o que a pessoa pode fazer.",
   "niveis-e-responsabilidades"
  ],
  "r.users.u-s": [
   "Senha provisória",
   "Mínimo de 8 caracteres. Entregue à pessoa de forma segura."
  ],
  "r.users.t.cadastrar-responsavel": [
   "Cadastrar responsável",
   "Cria a conta já aprovada, com o nível e as responsabilidades marcadas."
  ],
  "r.users.v.ajuda": [
   "Responsável pela Central de Ajuda",
   "Pode criar e editar artigos, categorias e explicações rápidas, e publicar a ajuda.",
   "administrar-central-ajuda"
  ],
  "r.users.v.reservas": [
   "Responsabilidade",
   "Dá acesso a: Alojamento.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.reservas": [
   "Responsabilidade",
   "Marque para dar acesso a: Alojamento. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.estela": [
   "Responsabilidade",
   "Dá acesso a: Estela.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.estela": [
   "Responsabilidade",
   "Marque para dar acesso a: Estela. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.album": [
   "Responsabilidade",
   "Dá acesso a: Curadoria do Álbum.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.album": [
   "Responsabilidade",
   "Marque para dar acesso a: Curadoria do Álbum. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.inventario": [
   "Responsabilidade",
   "Dá acesso a: Inventário e Patrimônio.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.inventario": [
   "Responsabilidade",
   "Marque para dar acesso a: Inventário e Patrimônio. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.financeiro": [
   "Responsabilidade",
   "Dá acesso a: Prestação de Contas, aprovação de compras e relatórios financeiros.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.financeiro": [
   "Responsabilidade",
   "Marque para dar acesso a: Prestação de Contas, aprovação de compras e relatórios financeiros. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.compras": [
   "Responsabilidade",
   "Dá acesso a: cotações e registro das compras.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.compras": [
   "Responsabilidade",
   "Marque para dar acesso a: cotações e registro das compras. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.solicitante": [
   "Responsabilidade",
   "Dá acesso a: pedidos de compra (vê só os próprios).",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.solicitante": [
   "Responsabilidade",
   "Marque para dar acesso a: pedidos de compra (vê só os próprios). Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.documentos": [
   "Responsabilidade",
   "Dá acesso a: Documentos e Calendários.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.documentos": [
   "Responsabilidade",
   "Marque para dar acesso a: Documentos e Calendários. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.comunicacao": [
   "Responsabilidade",
   "Dá acesso a: Comunicação, Listas de e-mail e banners do site.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.comunicacao": [
   "Responsabilidade",
   "Marque para dar acesso a: Comunicação, Listas de e-mail e banners do site. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.lojinha": [
   "Responsabilidade",
   "Dá acesso a: Lojinha.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.lojinha": [
   "Responsabilidade",
   "Marque para dar acesso a: Lojinha. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.rifa": [
   "Responsabilidade",
   "Dá acesso a: Rifa Solidária.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.rifa": [
   "Responsabilidade",
   "Marque para dar acesso a: Rifa Solidária. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.vaquinha": [
   "Responsabilidade",
   "Dá acesso a: Vaquinha Coletiva.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.vaquinha": [
   "Responsabilidade",
   "Marque para dar acesso a: Vaquinha Coletiva. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.voluntario": [
   "Responsabilidade",
   "Dá acesso a: Voluntários inscritos e Ações de Voluntário.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.voluntario": [
   "Responsabilidade",
   "Marque para dar acesso a: Voluntários inscritos e Ações de Voluntário. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.jardinagem": [
   "Responsabilidade",
   "Dá acesso a: Jardinagem / Área Externa.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.jardinagem": [
   "Responsabilidade",
   "Marque para dar acesso a: Jardinagem / Área Externa. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.atividades": [
   "Responsabilidade",
   "Dá acesso a: Atividades e Reunião de Escola.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.atividades": [
   "Responsabilidade",
   "Marque para dar acesso a: Atividades e Reunião de Escola. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.multiuso": [
   "Responsabilidade",
   "Dá acesso a: Multiuso.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.multiuso": [
   "Responsabilidade",
   "Marque para dar acesso a: Multiuso. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.construcao": [
   "Responsabilidade",
   "Dá acesso a: Construção.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.construcao": [
   "Responsabilidade",
   "Marque para dar acesso a: Construção. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.manutencao": [
   "Responsabilidade",
   "Dá acesso a: Manutenção.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.manutencao": [
   "Responsabilidade",
   "Marque para dar acesso a: Manutenção. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.v.traducoes": [
   "Responsabilidade",
   "Dá acesso a: Traduções.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.traducoes": [
   "Responsabilidade",
   "Marque para dar acesso a: Traduções. Vale na próxima vez que a pessoa abrir a área restrita.",
   "niveis-e-responsabilidades"
  ],
  "r.users.fn.ajuda": [
   "Responsabilidade",
   "Marque para dar acesso à Central de Ajuda (artigos, explicações e publicação).",
   "administrar-central-ajuda"
  ],
  "r.mapa.f.email": [
   "E-mail institucional",
   "E-mail do Parque usado para entrar nesta conta (nunca um e-mail pessoal)."
  ],
  "r.mapa.f.resp": [
   "Responsável",
   "Pessoa que administra esta conta hoje."
  ],
  "r.mapa.f.seg": [
   "Segundo administrador",
   "Outra pessoa com acesso, para o Parque não perder a conta."
  ],
  "r.mapa.f.fa": [
   "2FA ativo",
   "Marque se a verificação em duas etapas está ligada nesta conta."
  ],
  "r.mapa.f.data": [
   "Última verificação",
   "Data em que os acessos desta conta foram conferidos."
  ],
  "r.mapa.del": [
   "Remover conta do mapa",
   "Tira esta conta do mapa (não apaga a conta na rede social). Uma cópia fica na Lixeira do sistema (Backup e Segurança)."
  ],
  "r.mapa.m-p": [
   "Adicionar conta",
   "Nome da conta digital a acrescentar (ex.: TikTok, Google Drive, Zoom institucional)."
  ],
  "r.mapa.t.adicionar": [
   "Adicionar",
   "Acrescenta a conta ao mapa."
  ],
  "r.docip.d-novo": [
   "Novo documento",
   "Cadastra um documento institucional (estatuto, ata de assembleia, prestação de contas...)."
  ],
  "r.backup.bk-baixar": [
   "Baixar backup completo",
   "Gera um arquivo .json com todos os dados da área restrita, com verificação de integridade. Guarde em outro lugar, como cópia de segurança."
  ],
  "r.backup.bk-arq": [
   "Arquivo de backup",
   "Escolha o .json para restaurar. Nada é alterado até você confirmar."
  ],
  "r.backup.bk-lixo": [
   "Baixar lixeira",
   "Baixa a cópia dos itens excluídos (até 300 mais recentes).",
   "lixeira-e-auditoria"
  ],
  "r.backup.bk-rest": [
   "Restaurar este backup",
   "Substitui TODOS os dados atuais pelos do backup. Só é liberado depois de baixar o backup do estado atual."
  ],
  "r.inventario.s.consulta": [
   "Consulta",
   "Busca e filtros dos itens do inventário."
  ],
  "r.inventario.s.cad": [
   "Cadastrar item",
   "Formulário de um item novo; o código permanente é gerado ao gravar."
  ],
  "r.inventario.s.mov": [
   "Movimentações",
   "Entradas, saídas, empréstimos, transferências, manutenção, ajustes e baixas."
  ],
  "r.inventario.s.imp": [
   "Importar planilha",
   "Cadastra vários itens de uma vez a partir de um arquivo CSV.",
   "inventario-importar"
  ],
  "r.inventario.s.rel": [
   "Relatórios",
   "Relatórios do inventário para imprimir ou baixar (administrador e responsável)."
  ],
  "r.inventario.i-q": [
   "Buscar itens",
   "Por código (INV-0001), nome, marca ou número de série."
  ],
  "r.inventario.f-c": [
   "Categoria",
   "Tipo do item. Algumas categorias controlam estoque e alertam quando ele fica baixo."
  ],
  "r.inventario.f-n": [
   "Nome do item",
   "Nome pelo qual o item é conhecido (ex.: Furadeira, Banner da Marcha Mundial)."
  ],
  "r.inventario.f-se": [
   "Número de série",
   "Identificação do fabricante, quando houver. Ajuda a distinguir itens iguais."
  ],
  "r.inventario.f-q": [
   "Quantidade",
   "Quantas unidades deste item existem."
  ],
  "r.inventario.f-u": [
   "Unidade",
   "Opcional: un, caixa, metro, litro..."
  ],
  "r.inventario.f-mi": [
   "Estoque mínimo",
   "Opcional: abaixo desta quantidade o item aparece com alerta de estoque."
  ],
  "r.inventario.f-l": [
   "Localização",
   "Onde o item fica (ex.: Depósito, Sala, Silo, Cozinha)."
  ],
  "r.inventario.f-e": [
   "Estado de conservação",
   "Novo, Bom, Regular, Ruim ou Inservível."
  ],
  "r.inventario.f-s": [
   "Status",
   "Disponível ou Em uso. Empréstimo e baixa são feitos em Movimentações."
  ],
  "r.inventario.f-r": [
   "Responsável",
   "Quem responde pelo item."
  ],
  "r.inventario.f-p": [
   "Projeto/Campanha",
   "Opcional: liga o item a um projeto (ex.: material da Marcha Mundial)."
  ],
  "r.inventario.f-f": [
   "Foto",
   "Foto do item (reduzida automaticamente)."
  ],
  "r.inventario.f-pc": [
   "É patrimônio do Parque",
   "Marque para bens duráveis. Abre os campos do patrimônio (número, valor, aquisição, nota fiscal).",
   "patrimonio-gestao"
  ],
  "r.inventario.f-pn2": [
   "Número do patrimônio",
   "Em branco, o sistema gera (PAT-0001...).",
   "patrimonio-gestao"
  ],
  "r.inventario.f-pv": [
   "Valor do bem",
   "Valor em reais; em branco se não souber.",
   "patrimonio-gestao"
  ],
  "r.inventario.f-po": [
   "Origem",
   "Compra, doação, obra/construção ou outra.",
   "patrimonio-gestao"
  ],
  "r.inventario.t.cadastrar-item": [
   "Cadastrar item",
   "Grava o item e gera o código permanente, que nunca será reutilizado."
  ],
  "r.inventario.im-mod": [
   "Baixar modelo",
   "Planilha com as colunas certas para preencher e importar.",
   "inventario-importar"
  ],
  "r.inventario.im-f": [
   "Arquivo CSV",
   "Escolha a planilha preenchida. Você verá a pré-visualização antes de confirmar.",
   "inventario-importar"
  ],
  "r.inventario.r.geral": [
   "Inventário geral",
   "Todos os itens em uso."
  ],
  "r.inventario.r.cat": [
   "Por categoria",
   "Itens agrupados por categoria."
  ],
  "r.inventario.r.loc": [
   "Por localização",
   "Itens agrupados pelo lugar onde ficam."
  ],
  "r.inventario.r.camp": [
   "Materiais de campanhas",
   "Itens ligados a projetos e campanhas."
  ],
  "r.inventario.r.est": [
   "Materiais em estoque",
   "Itens com controle de estoque e alertas de mínimo."
  ],
  "r.inventario.r.mov": [
   "Emprestados e em movimentação",
   "Quem está com cada item emprestado e desde quando."
  ],
  "r.inventario.r.man": [
   "Manutenção e baixa",
   "Itens em manutenção e os que receberam baixa."
  ],
  "r.patrimonio.p-q": [
   "Buscar no patrimônio",
   "Por número, código, nome ou nota fiscal."
  ],
  "r.patrimonio.p-p": [
   "Dados",
   "Use \"Com dados em aberto\" para encontrar bens com informações faltando."
  ],
  "r.relatorios.ab.fin": [
   "Orçamento e Fluxo Financeiro",
   "Previsto × realizado do ano, mês a mês, por tipo de entrada e categoria de saída."
  ],
  "r.relatorios.ab.mod": [
   "Relatórios por módulo",
   "Relatórios de cada ferramenta, com filtros, ordenação e agrupamento."
  ],
  "r.relatorios.rf-a": [
   "Ano",
   "Ano do fluxo financeiro."
  ],
  "r.relatorios.rf-mf": [
   "Moeda / forma de pagamento",
   "Mostra só os valores desta forma (PIX, M$, espécie...)."
  ],
  "r.relatorios.b": [
   "Valor previsto",
   "Digite o valor previsto para este item e mês. A seta ao lado do nome repete o primeiro valor nos meses seguintes."
  ],
  "r.relatorios.rep": [
   "Repetir valor",
   "Copia o primeiro valor previsto para os meses seguintes."
  ],
  "r.relatorios.ex": [
   "Ver lançamentos",
   "Mostra os lançamentos que compõem este item."
  ],
  "r.relatorios.cm": [
   "Comentário",
   "Anotação sobre este item do fluxo financeiro."
  ],
  "r.relatorios.rc-m": [
   "Módulo",
   "Ferramenta de onde vem o relatório (você vê só as suas)."
  ],
  "r.relatorios.rc-r": [
   "Relatório",
   "Qual relatório do módulo mostrar."
  ],
  "r.relatorios.rc-g": [
   "Agrupar por",
   "Junta as linhas por uma coluna e mostra os totais de cada grupo."
  ],
  "r.relatorios.rc-o": [
   "Ordenar por",
   "Coluna usada para ordenar as linhas."
  ],
  "r.relatorios.rc-d": [
   "Ordem",
   "Crescente ou decrescente."
  ],
  "r.relatorios.rc-q": [
   "Buscar em todas as colunas",
   "Filtra as linhas que contêm o texto digitado."
  ],
  "r.relatorios.rc-x": [
   "Limpar filtros",
   "Volta o relatório ao estado inicial."
  ],
  "p.como-fazer.f-nome": [
   "Nome",
   "Seu nome, ou o da pessoa responsável pelo grupo."
  ],
  "p.como-fazer.f-telefone": [
   "Telefone",
   "Número com DDD (de preferência com WhatsApp) para a Comissão responder."
  ],
  "p.como-fazer.f-pais": [
   "País",
   "País de onde você vem."
  ],
  "p.como-fazer.f-comunidade": [
   "Comunidade / Organismo",
   "Comunidade da Mensagem ou organismo a que você pertence, se houver."
  ],
  "p.como-fazer.f-email": [
   "E-mail",
   "Para onde a Comissão enviará a resposta."
  ],
  "p.como-fazer.f-chegada": [
   "Dia de chegada",
   "Primeiro dia em que você vai usar o Centro de Estudo. Consulte antes o Calendário de uso.",
   "calendario-de-uso"
  ],
  "p.como-fazer.f-saida": [
   "Dia de saída",
   "Último dia de uso."
  ],
  "p.como-fazer.f-hora": [
   "Hora de chegada",
   "Horário aproximado em que você chega, para alguém receber."
  ],
  "p.como-fazer.f-pessoas": [
   "Quantidade de pessoas",
   "Quantas pessoas vêm. Para grupos, liste os nomes em Detalhes."
  ],
  "p.como-fazer.f-hosp": [
   "Preciso de cama no alojamento",
   "Marque se vai dormir no Parque. A Comissão verifica as camas disponíveis."
  ],
  "p.como-fazer.f-nec": [
   "Necessidades específicas",
   "Ex.: dificuldade de locomoção (cama de baixo), alimentação, saúde."
  ],
  "p.como-fazer.f-detalhes": [
   "Detalhes",
   "Objetivo da atividade e, se for um grupo, o nome dos participantes."
  ],
  "p.como-fazer.t.enviar-solicitacao": [
   "Enviar solicitação",
   "Abre o seu programa de e-mail com o pedido pronto, endereçado à Comissão. Confira e clique em Enviar no e-mail."
  ],
  "p.calendario.cal-anterior": [
   "Mês anterior",
   "Mostra o mês anterior."
  ],
  "p.calendario.cal-proximo": [
   "Mês seguinte",
   "Mostra o próximo mês."
  ],
  "p.calendario.cal-hoje": [
   "Hoje",
   "Volta para o mês atual."
  ],
  "p.calendario.cal-mes": [
   "Ir para",
   "Escolha o mês que deseja ver."
  ],
  "p.calendario.cal-ano": [
   "Ano",
   "Escolha o ano."
  ],
  "p.calendario.data": [
   "Dia do calendário",
   "Mostra se o Centro de Estudo (CE) está ocupado ou desocupado neste dia. Clique para ver os detalhes."
  ],
  "p.calendario.cal-imprimir": [
   "Imprimir dia",
   "Imprime as informações do dia escolhido."
  ],
  "p.fotos.p-f": [
   "Fotos",
   "Escolha até 10 fotos. No celular, da galeria ou da câmera."
  ],
  "p.fotos.p-e": [
   "Atividade",
   "Se souber, em qual atividade as fotos foram tiradas."
  ],
  "p.fotos.p-d": [
   "Dia",
   "Quando você tirou as fotos."
  ],
  "p.fotos.p-a": [
   "Autor",
   "Seu nome, como autor das fotos."
  ],
  "p.fotos.p-m": [
   "Mostrar meu nome",
   "Se \"Sim\", seu nome aparece junto da foto caso ela seja publicada."
  ],
  "p.fotos.t.enviar-fotos": [
   "Enviar fotos",
   "Envia as fotos para a curadoria do Álbum. Ao enviar, você declara que são suas e autoriza o uso pelo Parque."
  ],
  "p.voluntario.v-n": [
   "Nome completo",
   "Nome e sobrenome."
  ],
  "p.voluntario.v-c": [
   "Celular / WhatsApp",
   "Número com DDD para a Comissão falar com você."
  ],
  "p.voluntario.v-d": [
   "Quando você pode ajudar",
   "Finais de semana, dias de semana ou outra disponibilidade."
  ],
  "p.voluntario.v-o": [
   "Quer contar algo?",
   "Experiência, limitações ou ideias que ajudem a encontrar a melhor forma de colaborar."
  ],
  "p.voluntario.v-ok": [
   "Autorização de uso dos dados",
   "Obrigatória: seus dados são usados apenas para o contato sobre o voluntariado."
  ],
  "p.voluntario.t.enviar-minha-inscricao": [
   "Enviar minha inscrição",
   "Envia a inscrição à Comissão, que entrará em contato."
  ],
  "p.pagar.pg-t": [
   "O que você deseja pagar",
   "Doação, contribuição mensal de manutenção, compra ou outro."
  ],
  "p.pagar.pg-r": [
   "Referência",
   "Opcional: a que se refere o pagamento (ex.: mês, produto, atividade)."
  ],
  "p.pagar.pg-v": [
   "Valor",
   "Valor em reais, mínimo R$ 5,00."
  ],
  "p.pagar.pg-c": [
   "CPF ou CNPJ",
   "Exigido pelo Asaas para emitir o pagamento."
  ],
  "p.pagar.pg-e": [
   "E-mail",
   "Para receber o comprovante do pagamento."
  ],
  "p.pagar.pg-ok": [
   "Autorização de uso dos dados",
   "Os dados são usados pelo Parque e pelo Asaas só para este pagamento."
  ],
  "p.pagar.pg-b": [
   "Ir para o pagamento seguro",
   "Leva você à tela do Asaas, onde escolhe PIX, cartão de crédito, débito ou boleto."
  ],
  "p.login.m.entrar": [
   "Entrar",
   "Para quem já tem conta aprovada.",
   "criar-conta-e-entrar"
  ],
  "p.login.m.cadastro": [
   "Criar conta",
   "Peça acesso à área restrita. O administrador aprova o cadastro.",
   "criar-conta-e-entrar"
  ],
  "p.login.e": [
   "E-mail",
   "O e-mail usado no cadastro.",
   "criar-conta-e-entrar"
  ],
  "p.login.s": [
   "Senha",
   "Sua senha (maiúsculas e minúsculas fazem diferença).",
   "nao-consigo-entrar"
  ],
  "p.newsletter.cad-e": [
   "E-mail",
   "Endereço que vai receber o Comunicado."
  ],
  "p.newsletter.cad-c": [
   "Concordo em receber",
   "Obrigatório para o cadastro. Você pode sair quando quiser."
  ],
  "p.newsletter.t.quero-receber": [
   "Quero receber",
   "Cadastra o seu e-mail na lista do Comunicado."
  ],
  "p.cadastro-wifi.cad-e": [
   "E-mail",
   "Endereço que vai receber o Comunicado do Parque."
  ],
  "p.cadastro-wifi.cad-c": [
   "Concordo em receber",
   "Obrigatório para o cadastro. Você pode sair quando quiser."
  ],
  "p.cadastro-wifi.t.quero-receber": [
   "Quero receber",
   "Cadastra o seu e-mail na lista de visitantes do Comunicado."
  ],
  "p.descadastro.sai-e": [
   "E-mail",
   "O e-mail que recebe o Comunicado e deve sair da lista."
  ],
  "p.descadastro.t.deixar-de-receber-o-comunicado-do-parque": [
   "Deixar de receber",
   "Retira o e-mail da lista do Comunicado."
  ],
  "p.como-chegar.t.abrir-no-google-maps": [
   "Abrir no Google Maps",
   "Abre o endereço do Parque no Google Maps para traçar a rota."
  ],
  "p.index.t.ver-acervo-completo": [
   "Ver acervo completo",
   "Abre a Biblioteca do Parque com todos os livros.",
   "biblioteca-publica"
  ],
  "p.livraria.t.fazer-pedido-por-e-mail": [
   "Fazer pedido por e-mail",
   "Abre o seu programa de e-mail com o pedido endereçado ao Parque."
  ],
  "p.lojinha.t.fazer-pedido-por-e-mail": [
   "Fazer pedido por e-mail",
   "Abre o seu programa de e-mail com o pedido endereçado ao Parque."
  ],
  "r.relatorios.rf-mo": [
   "Linhas do relatório",
   "Como as linhas são organizadas: entradas por tipo e saídas por categoria (Luz, Internet, Limpeza...), ou outro agrupamento da lista."
  ],
  "r.central_ajuda.ca.art": [
   "Artigos",
   "Lista dos artigos da Central de Ajuda, com busca, filtros e o editor.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca.cat": [
   "Categorias",
   "Nome, ícone, descrição e ordem das categorias da Central.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca.dic": [
   "Explicações rápidas",
   "Textos das dicas de cada botão, campo e menu (as que aparecem ao passar o mouse).",
   "editar-explicacoes-rapidas"
  ],
  "r.central_ajuda.ca.cob": [
   "Cobertura",
   "Itens já vistos na tela que ainda usam o texto automático e precisam de uma explicação escrita.",
   "editar-explicacoes-rapidas"
  ],
  "r.central_ajuda.ca.pub": [
   "Publicar",
   "Gera o arquivo para a hospedagem do site e o JSON para o aplicativo; importa e exporta edições.",
   "publicar-ajuda"
  ],
  "r.central_ajuda.ca-novo": [
   "Novo artigo",
   "Abre o editor para escrever um artigo novo: título, categoria, passo a passo, imagens e conteúdos relacionados.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-q": [
   "Buscar artigo",
   "Procura no título, no resumo, nas palavras-chave e no texto dos artigos.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ver": [
   "Ver artigo",
   "Abre o artigo no painel de ajuda, como as pessoas vão ver.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ed": [
   "Editar artigo",
   "Abre o artigo no editor.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.st": [
   "Publicar / retirar do ar",
   "Retirar do ar deixa o artigo como rascunho (só quem administra a ajuda vê). Publicar devolve ao ar.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.rs": [
   "Voltar ao publicado",
   "Descarta as edições ainda não publicadas e volta ao texto do arquivo publicado.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.del": [
   "Excluir artigo",
   "Remove o artigo da Central. Se quiser só tirar do ar por um tempo, use Retirar do ar.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-t": [
   "Título do artigo",
   "Comece com um verbo ou com o nome da funcionalidade (ex.: Registrar empréstimo de livro).",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-id": [
   "Identificador",
   "Endereço do artigo (ajuda.html?a=identificador) e referência para dicas, links e o aplicativo. Não muda depois de criado.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-c": [
   "Categoria",
   "Em qual grupo da Central o artigo aparece.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-p": [
   "Público",
   "Para todos (visitantes) ou para a equipe (funcionalidades da área restrita). Serve para filtrar na Central.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-s": [
   "Situação",
   "No ar ou Rascunho. Rascunhos só aparecem para quem administra a ajuda.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-o": [
   "Ordem",
   "Posição do artigo dentro da categoria (menor aparece primeiro).",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-r": [
   "Resumo",
   "Uma frase que diz o que a pessoa vai conseguir fazer. Aparece nas listas, na busca e nos conteúdos relacionados.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-k": [
   "Palavras-chave",
   "Outras palavras que as pessoas podem usar para procurar este assunto (sinônimos, termos populares).",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-w": [
   "Onde fica",
   "O caminho na tela até a funcionalidade (ex.: Administração › Inventário › Movimentações).",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-3": [
   "Passo a passo",
   "Um passo por linha, na ordem em que a pessoa faz. Use o nome exato dos botões, em negrito.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-5": [
   "Cuidados e observações",
   "O que pode dar errado, limites e regras importantes. Um por linha.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-if": [
   "Enviar imagem",
   "Captura de tela ou ilustração que mostre o botão, campo ou procedimento. É reduzida para 1200 px.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-iu": [
   "Endereço de imagem",
   "Imagem já publicada no site (ex.: ajuda/img/inventario-cadastro.jpg) ou na internet (https://).",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-rq": [
   "Filtrar relacionados",
   "Digite para encontrar artigos na lista de conteúdos relacionados.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-ver": [
   "Salvar e visualizar",
   "Grava o artigo e abre no painel de ajuda para conferir como ficou.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-csalva": [
   "Salvar categorias",
   "Grava as mudanças de nome, ícone, descrição e ordem.",
   "administrar-central-ajuda"
  ],
  "r.central_ajuda.ca-dq": [
   "Buscar explicação",
   "Procura na chave, no título e no texto das explicações rápidas.",
   "editar-explicacoes-rapidas"
  ],
  "r.central_ajuda.ca-dnova": [
   "Nova explicação",
   "Escreve a explicação de um item a partir da chave dele (veja a chave no cartão do modo ajuda).",
   "editar-explicacoes-rapidas"
  ],
  "r.central_ajuda.ca-dk": [
   "Chave",
   "Identificador do item na tela. Aparece no cartão do modo ajuda, para quem administra a ajuda.",
   "editar-explicacoes-rapidas"
  ],
  "r.central_ajuda.esc": [
   "Escrever explicação",
   "Abre o formulário já com a chave e o texto automático, para você melhorar.",
   "editar-explicacoes-rapidas"
  ],
  "r.central_ajuda.ca-pjs": [
   "Baixar ajuda-conteudo.js",
   "Gera o arquivo com toda a ajuda (publicado + edições). Substitua o arquivo de mesmo nome na hospedagem.",
   "publicar-ajuda"
  ],
  "r.central_ajuda.ca-pjson": [
   "Baixar conteudo.json",
   "A mesma base de conhecimento em JSON, para o aplicativo do Parque.",
   "publicar-ajuda"
  ],
  "r.central_ajuda.ca-pexp": [
   "Exportar edições",
   "Baixa só as edições ainda não publicadas, em arquivo.",
   "publicar-ajuda"
  ],
  "r.central_ajuda.ca-pimp": [
   "Importar edições",
   "Traz as edições exportadas em outro computador. Quando há duas versões do mesmo item, vale a mais recente.",
   "publicar-ajuda"
  ],
  "r.central_ajuda.ca-plimpa": [
   "Limpar edições já publicadas",
   "Depois de substituir o arquivo na hospedagem, remove daqui as edições que ficaram iguais ao publicado.",
   "publicar-ajuda"
  ],
  "r.central_ajuda.ca-vlimpa": [
   "Limpar registro",
   "Apaga a lista de itens vistos (não afeta as explicações).",
   "editar-explicacoes-rapidas"
  ],
  "r.comunicacao.gerar": [
   "Criar a partir do calendário",
   "Cria uma publicação por rede social a partir de uma atividade ou data dos calendários.",
   "calendario-comunicacao"
  ],
  "r.contas.im-ok": [
   "Importar as planilhas",
   "Grava os lançamentos das planilhas de novembro de 2026 na Prestação de Contas. Se já foram importados, atualiza sem duplicar.",
   "prestacao-contas"
  ]
 },
 "contextos": {
  "padrao": "como-usar-a-ajuda",
  "global": "como-usar-a-ajuda",
  "menu": "menu-do-site",
  "r.painel": "painel-conecta",
  "p.index": "o-que-e-a-plataforma",
  "p.comece-aqui": "o-que-e-a-plataforma",
  "p.ajuda": "como-usar-a-ajuda",
  "p.reservas": "pedir-reserva",
  "p.como-fazer": "pedir-reserva",
  "p.calendario": "calendario-de-uso",
  "p.fotos": "enviar-fotos-album",
  "p.voluntario": "ser-voluntario",
  "p.comissoes": "ser-voluntario",
  "p.comissao-jardinagem": "ser-voluntario",
  "p.comissao-comunicacao": "ser-voluntario",
  "p.comissao-multiuso": "ser-voluntario",
  "p.doacao": "doar-e-pagar-online",
  "p.pagar": "doar-e-pagar-online",
  "p.ajude-o-parque": "doar-e-pagar-online",
  "p.livraria": "comprar-livraria-lojinha",
  "p.lojinha": "comprar-livraria-lojinha",
  "p.encomenda": "comprar-livraria-lojinha",
  "p.rifa-solidaria": "participar-rifa",
  "p.vaquinha-coletiva": "contribuir-vaquinha",
  "p.newsletter": "receber-comunicado",
  "p.descadastro": "receber-comunicado",
  "p.cadastro-wifi": "receber-comunicado",
  "p.estela-virtual": "estela-virtual",
  "p.elementos": "estela-virtual",
  "p.login": "criar-conta-e-entrar",
  "p.atividades": "atividades-publicas",
  "p.atividade": "atividades-publicas",
  "p.biblioteca": "biblioteca-publica",
  "p.como-chegar": "como-chegar-ao-parque",
  "p.o-parque": "menu-do-site",
  "p.silo": "menu-do-site",
  "p.mensagem-de-silo": "menu-do-site",
  "p.comunidades-da-mensagem": "menu-do-site",
  "p.organismos": "menu-do-site",
  "p.centro-estudo": "menu-do-site",
  "p.escola": "menu-do-site",
  "p.nivelamento": "menu-do-site",
  "p.producoes-de-escola": "menu-do-site",
  "p.livros-audios-app": "menu-do-site",
  "p.oficios": "menu-do-site",
  "p.parques-mundo": "menu-do-site",
  "p.blogger": "menu-do-site",
  "r.acervo": "biblioteca-gestao",
  "r.acervo.bs.livraria": "livraria-gestao",
  "r.enc_livros": "encomendas-livros",
  "r.zoom": "zoom-agendamento",
  "r.reservas": "reservas-alojamento",
  "r.estela": "estela-gestao",
  "r.album": "album-gestao",
  "r.documentos": "documentos-calendarios",
  "r.atividades": "atividades-gestao",
  "r.reuniao": "reuniao-de-escola",
  "r.grupos": "grupos-discussao",
  "r.multiuso": "multiuso-gestao",
  "r.jardinagem": "jardinagem-gestao",
  "r.construcao": "comissoes-internas",
  "r.manutencao": "comissoes-internas",
  "r.traducoes": "comissoes-internas",
  "r.lojinha": "lojinha-gestao",
  "r.rifa": "rifa-gestao",
  "r.vaquinha": "vaquinha-gestao",
  "r.voluntarios": "voluntarios-gestao",
  "r.vol_acoes": "voluntarios-gestao",
  "r.ajude": "ajude-visao-geral",
  "r.comunicacao": "comunicacao-visao-geral",
  "r.comunicacao.s.cal": "calendario-comunicacao",
  "r.comunicacao.s.gerar": "calendario-comunicacao",
  "r.comunicacao.s.pub": "painel-publicacoes",
  "r.comunicacao.s.site": "banners-do-site",
  "r.comunicacao.s.equipe": "equipe-convidados",
  "r.comunicacao.s.redes": "cadastros-comunicacao",
  "r.comunicacao.s.proj": "cadastros-comunicacao",
  "r.comunicacao.s.tipos": "cadastros-comunicacao",
  "r.comunicacao.s.fixas": "cadastros-comunicacao",
  "r.comunicacao.s.arq": "arquivos-indicadores-conectores",
  "r.comunicacao.s.ind": "arquivos-indicadores-conectores",
  "r.comunicacao.s.conect": "arquivos-indicadores-conectores",
  "r.contatos": "listas-email",
  "r.contas": "prestacao-contas",
  "r.compras": "compras-orcamento",
  "r.inventario": "inventario-gestao",
  "r.inventario.s.imp": "inventario-importar",
  "r.patrimonio": "patrimonio-gestao",
  "r.users": "gestao-de-responsaveis",
  "r.mapa": "mapa-de-contas",
  "r.docip": "documentacao-ip",
  "r.backup": "backup-e-restauracao",
  "r.relatorios": "relatorios-consolidados",
  "r.central_ajuda": "administrar-central-ajuda",
  "r.el_sala": "elementos-descricoes",
  "r.el_monolito": "elementos-descricoes",
  "r.el_portao": "elementos-descricoes",
  "r.el_fonte": "elementos-descricoes",
  "r.el_centro-trabalho": "elementos-descricoes",
  "r.el_centro-estudos": "elementos-descricoes",
  "r.el_oficinas": "elementos-descricoes",
  "p.app": "usar-o-app"
 }
};
