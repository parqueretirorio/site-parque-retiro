// Biblioteca de Silo: catálogo da página biblioteca-silo.html.
// Organização inspirada no Arquivo de Documentos de Silo (archivosilo.org): seções por tipo de documento,
// ordem cronológica, ícones de formato (texto, áudio, vídeo, foto) e busca.
//
// COMO ACRESCENTAR UM ITEM: copie uma linha do mesmo tipo e troque os campos.
//   secao:    livros | conferencias | apontamentos | entrevistas | reunioes | seminarios | materiais | expguia | outros
//   data:     'AAAA' ou 'AAAA-MM' ou 'AAAA-MM-DD' (usada para a ordem cronológica)
//   titulo:   título em português;  original: título original (opcional)
//   local:    cidade / país (opcional);  idiomas: idiomas em que o documento existe
//   formatos: texto | audio | video | foto (os que existem)
//   link:     endereço (https://...) onde ler, ouvir ou ver;  fonte: nome do site do link
//   desc:     uma frase curta (opcional)
// Só são aceitos links http(s). Se não houver link próprio, use o do Arquivo Silo ou o de silo.net.
window.PR_BIBLIOTECA_SILO = {
  atualizado: '2026-11-07',
  arquivo: { url: 'https://www.archivosilo.org/archivo/index.htm', conteudo: 'http://www.archivosilo.org/docidiom2020.htm',
             totais: { textos: 4404, audios: 859, videos: 1053, fotos: 13334, referencia: 'junho de 2020' } },
  obras: 'http://www.silo.net',
  itens: [
    /* ---------------- Livros ---------------- */
    { secao: 'livros', data: '1972', titulo: 'O Olhar Interno', original: 'La Mirada Interna', idiomas: ['es', 'pt', 'en', 'it', 'fr', 'de'], formatos: ['texto'], link: 'http://www.silo.net', fonte: 'silo.net', desc: 'Primeira obra de Silo, em prosa poética, sobre o sentido da vida. É também o Livro da Mensagem de Silo.' },
    { secao: 'livros', data: '1981', titulo: 'A Paisagem Interna', original: 'El Paisaje Interno', idiomas: ['es', 'pt', 'en', 'it', 'fr', 'de'], formatos: ['texto'], link: 'http://www.silo.net', fonte: 'silo.net', desc: 'Segunda parte da trilogia reunida em Humanizar a Terra.' },
    { secao: 'livros', data: '1988', titulo: 'A Paisagem Humana', original: 'El Paisaje Humano', idiomas: ['es', 'pt', 'en', 'it', 'fr', 'de'], formatos: ['texto'], link: 'http://www.silo.net', fonte: 'silo.net', desc: 'Terceira parte da trilogia reunida em Humanizar a Terra.' },
    { secao: 'livros', data: '1989', titulo: 'Humanizar a Terra', original: 'Humanizar la Tierra', idiomas: ['es', 'pt', 'en', 'it', 'fr', 'de'], formatos: ['texto'], link: 'http://www.silo.net', fonte: 'silo.net', desc: 'Reúne O Olhar Interno, A Paisagem Interna e A Paisagem Humana: a primeira compilação editorial do pensamento de Silo.' },
    { secao: 'livros', data: '1989', titulo: 'Experiências Guiadas', original: 'Experiencias Guiadas', idiomas: ['es', 'pt', 'en', 'it', 'fr', 'de'], formatos: ['texto'], link: 'http://www.silo.net', fonte: 'silo.net', desc: 'Contos curtos escritos em primeira pessoa para serem vividos como experiências. Redigido em 1980.' },
    { secao: 'livros', data: '1990', titulo: 'Contribuições ao Pensamento', original: 'Contribuciones al Pensamiento', idiomas: ['es', 'pt', 'en', 'it', 'fr', 'de'], formatos: ['texto'], link: 'http://www.silo.net', fonte: 'silo.net', desc: 'Psicologia da Imagem e Discussões Historiológicas.' },
    { secao: 'livros', data: '1991', titulo: 'Mitos Raízes Universais', original: 'Mitos Raíces Universales', idiomas: ['es', 'pt', 'en', 'it', 'fr', 'de'], formatos: ['texto'], link: 'http://www.silo.net', fonte: 'silo.net', desc: 'Comenta as imagens coletivas mais antigas que as culturas plasmaram como mitos.' },
    { secao: 'livros', data: '1991', titulo: 'O Dia do Leão Alado', original: 'El Día del León Alado', idiomas: ['es', 'pt', 'en', 'it', 'fr', 'de'], formatos: ['texto'], link: 'http://www.silo.net', fonte: 'silo.net', desc: 'Contos.' },
    { secao: 'livros', data: '1993', titulo: 'Cartas a Meus Amigos', original: 'Cartas a mis Amigos', idiomas: ['es', 'pt', 'en', 'it', 'fr', 'de'], formatos: ['texto'], link: 'http://www.silo.net', fonte: 'silo.net', desc: 'Sobre a crise social e pessoal no momento atual.' },
    { secao: 'livros', data: '1996', titulo: 'Dicionário do Novo Humanismo', original: 'Diccionario del Nuevo Humanismo', idiomas: ['es', 'pt', 'en', 'it', 'fr', 'de'], formatos: ['texto'], link: 'http://www.silo.net', fonte: 'silo.net' },
    { secao: 'livros', data: '1996', titulo: 'Fala Silo', original: 'Habla Silo', idiomas: ['es', 'pt', 'en', 'it', 'fr', 'de'], formatos: ['texto'], link: 'http://www.silo.net', fonte: 'silo.net', desc: 'Seleção de conferências e intervenções públicas de Silo.' },
    { secao: 'livros', data: '2002', titulo: 'Obras Completas, Volumes I e II', original: 'Obras Completas', idiomas: ['es', 'pt', 'en', 'it'], formatos: ['texto'], link: 'http://www.silo.net', fonte: 'silo.net' },
    { secao: 'livros', data: '2002', titulo: 'A Mensagem de Silo', original: 'El Mensaje de Silo', idiomas: ['es', 'pt', 'en', 'it', 'fr', 'de'], formatos: ['texto'], link: 'http://www.silo.net', fonte: 'silo.net', desc: 'O Livro, a Experiência e o Caminho. Edição em livro em 2008.' },
    { secao: 'livros', data: '2006', titulo: 'Apontamentos de Psicologia', original: 'Apuntes de Psicología', idiomas: ['es', 'pt', 'en', 'it'], formatos: ['texto'], link: 'http://www.silo.net', fonte: 'silo.net' },
    { secao: 'livros', data: '2010', titulo: 'Silo a céu aberto', original: 'Silo a cielo abierto', idiomas: ['es'], formatos: ['texto'], link: 'http://www.archivosilo.org/archivopro/espanol/libros/cieloesp.pdf', fonte: 'Arquivo Silo (PDF)', desc: 'Compilação, feita após a morte de Silo em 2010, das suas palavras no Parque de Estudo e Reflexão Punta de Vacas.' },
    { secao: 'livros', data: '2019-02', titulo: 'Contribuições ao Pensamento: audiolivro (introdução)', original: 'Contribuciones al Pensamiento', local: 'Madri, Espanha', idiomas: ['es'], formatos: ['texto', 'audio'], link: 'https://www.archivosilo.org/archivopro/Espanol/libros/contaudi/introcon.pdf', fonte: 'Arquivo Silo (PDF)', desc: 'Gravação em áudio do livro, a partir do texto de silo.net.' },

    /* ---------------- Conferências ---------------- */
    { secao: 'conferencias', data: '1969-05-04', titulo: 'A Cura do Sofrimento', original: 'La Curación del Sufrimiento', local: 'Punta de Vacas, Argentina', idiomas: ['es', 'pt', 'en', 'it', 'fr', 'de'], formatos: ['texto'], link: 'http://www.silo.net', fonte: 'silo.net', desc: 'Primeira intervenção pública de Silo, considerada o ato fundador do Movimento Humanista.' },
    { secao: 'conferencias', data: '1990', titulo: 'Conferência sobre o livro Contribuições ao Pensamento', local: 'Buenos Aires, Argentina', idiomas: ['es'], formatos: ['texto'], link: 'https://www.archivosilo.org/archivo/index.htm', fonte: 'Arquivo Silo' },
    { secao: 'conferencias', data: '1991', titulo: 'Conferência sobre Mitos Raízes Universais', idiomas: ['es'], formatos: ['texto'], link: 'https://www.archivosilo.org/archivo/index.htm', fonte: 'Arquivo Silo' },
    { secao: 'conferencias', data: '1991-07-04', titulo: 'Conferência sobre seu pensamento e sua obra literária', local: 'México', idiomas: ['es'], formatos: ['texto', 'foto'], link: 'http://www.archivosilo.org/fotosilo.htm', fonte: 'Arquivo Silo (fotos)' },
    { secao: 'conferencias', data: '1998-01-04', titulo: 'Conferência no Estádio Obras Sanitárias', local: 'Buenos Aires, Argentina', idiomas: ['es'], formatos: ['texto'], link: 'https://www.archivosilo.org/archivo/index.htm', fonte: 'Arquivo Silo' },
    { secao: 'conferencias', data: '1999-04-15', titulo: 'Apresentação das Obras Completas de Silo', local: 'Rosário, Argentina', idiomas: ['es'], formatos: ['texto', 'foto'], link: 'http://www.archivosilo.org/fotosilo.htm', fonte: 'Arquivo Silo (fotos)' },
    { secao: 'conferencias', data: '1999-05-14', titulo: 'Discurso no ato do Partido Humanista', local: 'Buenos Aires, Argentina', idiomas: ['es'], formatos: ['texto', 'foto'], link: 'http://www.archivosilo.org/fotosilo.htm', fonte: 'Arquivo Silo (fotos)' },
    { secao: 'conferencias', data: '2004-05-04', titulo: 'Primeira Celebração Anual da Mensagem de Silo', local: 'Punta de Vacas, Argentina', idiomas: ['es', 'pt', 'en', 'it'], formatos: ['texto', 'foto'], link: 'http://www.archivosilo.org/fotosilo.htm', fonte: 'Arquivo Silo (fotos)' },
    { secao: 'conferencias', data: '2005-05-07', titulo: 'Inauguração da Sala da América do Sul', local: 'La Reja, Buenos Aires, Argentina', idiomas: ['es', 'pt', 'en', 'it'], formatos: ['texto', 'foto'], link: 'http://www.archivosilo.org/fotosilo.htm', fonte: 'Arquivo Silo (fotos)' },
    { secao: 'conferencias', data: '2009-11', titulo: 'Intervenção na Cúpula dos Prêmios Nobel da Paz', local: 'Berlim, Alemanha', idiomas: ['es', 'en'], formatos: ['texto'], link: 'https://www.archivosilo.org/archivo/index.htm', fonte: 'Arquivo Silo', desc: 'Encontro pelos 20 anos da queda do Muro de Berlim.' },

    /* ---------------- Apontamentos (charlas e anotações) ---------------- */
    { secao: 'apontamentos', data: '1975', titulo: 'Fundamentos do Pensar: Conversas de Corfu', original: 'Fundamentos del Pensar. Charlas de Corfú', local: 'Corfu, Grécia', idiomas: ['es'], formatos: ['texto'], link: 'https://www.archivosilo.org/archivo/index.htm', fonte: 'Arquivo Silo' },
    { secao: 'apontamentos', data: '1989', titulo: 'Comentários sobre o livro Contribuições ao Pensamento', local: 'Mar del Plata, Argentina', idiomas: ['es'], formatos: ['texto'], link: 'https://www.archivosilo.org/archivo/index.htm', fonte: 'Arquivo Silo' },
    { secao: 'apontamentos', data: '1990', titulo: 'Conversa em Farellones', original: 'Charla en Farellones', local: 'Farellones, Chile', idiomas: ['es'], formatos: ['texto'], link: 'https://www.archivosilo.org/archivo/index.htm', fonte: 'Arquivo Silo' },
    { secao: 'apontamentos', data: '2006-11-10', titulo: 'Conversa com Silo em Grotte', original: 'Charla con Silo en Grotte', local: 'Grotte, Itália', idiomas: ['es'], formatos: ['texto'], link: 'https://www.archivosilo.org/archivopro/Espanol/apuntes/ap061110.pdf', fonte: 'Arquivo Silo (PDF)', desc: 'Sobre comunicação nos meios massivos e a referência do Novo Humanismo.' },

    /* ---------------- Entrevistas ---------------- */
    { secao: 'entrevistas', data: '1971-06-26', titulo: 'Revista Claves: "Metamorfose"', original: 'Revista Claves: Metamorfosis', local: 'Chile', idiomas: ['es'], formatos: ['texto'], link: 'https://www.archivosilo.org/archivopro/Espanol/entrevis/710626rc.pdf', fonte: 'Arquivo Silo (PDF)' },
    { secao: 'entrevistas', data: '1998-10-07', titulo: 'Entrevista ao jornalista Koli Bder, canal 5 de ATS', local: 'Tucumán, Argentina', idiomas: ['es'], formatos: ['texto', 'foto'], link: 'http://www.archivosilo.org/fotosilo.htm', fonte: 'Arquivo Silo (fotos)' },

    /* ---------------- Reuniões ---------------- */
    { secao: 'reunioes', data: '1988-07', titulo: 'Encontro com Silo', local: 'Buenos Aires, Argentina', idiomas: ['es'], formatos: ['foto'], link: 'http://www.archivosilo.org/fotosilo.htm', fonte: 'Arquivo Silo (fotos)' },
    { secao: 'reunioes', data: '1990', titulo: 'Reunião Fênix', original: 'Reunión Fénix', local: 'Paris, França', idiomas: ['es'], formatos: ['texto'], link: 'https://www.archivosilo.org/archivo/index.htm', fonte: 'Arquivo Silo' },
    { secao: 'reunioes', data: '2005-06-11', titulo: 'Visita de Silo à construção da Sala do Parque Manantiales', local: 'Chile', idiomas: ['es'], formatos: ['foto'], link: 'http://www.archivosilo.org/fotosilo.htm', fonte: 'Arquivo Silo (fotos)' },

    /* ---------------- Seminários ---------------- */
    { secao: 'seminarios', data: '1980', titulo: 'Seminários da Espanha: segundo dia', original: 'Seminarios de España. Día segundo', local: 'Espanha', idiomas: ['es'], formatos: ['texto'], link: 'https://www.archivosilo.org/archivo/index.htm', fonte: 'Arquivo Silo' },

    /* ---------------- Materiais ---------------- */
    { secao: 'materiais', data: '1973', titulo: 'Cadernos de Escola', original: 'Cuadernos de Escuela', idiomas: ['es'], formatos: ['texto'], link: 'https://www.archivosilo.org/archivo/index.htm', fonte: 'Arquivo Silo' },
    { secao: 'materiais', data: '1974', titulo: 'Pasta Laranja', original: 'Carpeta Naranja', idiomas: ['es'], formatos: ['texto'], link: 'https://www.archivosilo.org/archivo/index.htm', fonte: 'Arquivo Silo' },

    /* ---------------- Experiências Guiadas (áudios) ---------------- */
    { secao: 'expguia', data: '1989', titulo: 'Experiências Guiadas: áudios das experiências', idiomas: ['es', 'pt', 'en', 'it'], formatos: ['audio'], link: 'https://www.archivosilo.org/expeguid.htm', fonte: 'Arquivo Silo', desc: 'Gravações das experiências do livro, para acompanhar com os olhos fechados.' },

    /* ---------------- Outros autores ---------------- */
    { secao: 'outros', data: '2015', titulo: 'O Informe Tokarev', original: 'El Informe Tokárev', autor: 'Salvatore Puledda', idiomas: ['es'], formatos: ['texto'], link: 'https://www.archivosilo.org/archivo/index.htm', fonte: 'Arquivo Silo', desc: 'Romance publicado pelas Ediciones León Alado.' },
    { secao: 'outros', data: '2017', titulo: 'Nas Asas da Intenção: uma biografia de Silo', original: 'On Wings of Intent: A Biography of Silo', idiomas: ['en'], formatos: ['texto'], link: 'https://www.archivosilo.org/archivo/index.htm', fonte: 'Arquivo Silo', desc: 'Biografia publicada pelas Ediciones León Alado.' }
  ]
};
