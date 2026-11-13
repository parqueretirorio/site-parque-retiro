// Ajuda do app CONecta Retiro: textos da tela "Ajuda" e o guia "Como usar o app".
// O guia está em português e espanhol; os outros idiomas mostram o guia em português (a tela em si é traduzida nos 6).
// Os artigos de cada ferramenta vêm da Central de Ajuda do site (../ajuda/conteudo.json), a mesma base de conhecimento.
(function () {
const UI = {
  pt: { ajudaBt: 'Ajuda', ajudaTit: 'Ajuda', comoUsar: 'Como usar o app', porFerramenta: 'Ajuda de cada ferramenta', buscar: 'Procure um assunto', buscarPh: 'Ex.: reserva, senha, livro',
    nadaAchado: 'Nada encontrado. Tente outra palavra ou fale com o Parque pelo WhatsApp.', oQueE: 'O que é', paraQue: 'Para que serve', passos: 'Passo a passo', exemplos: 'Exemplos', cuidados: 'Atenção',
    relacionados: 'Veja também', soPt: '', carregando: 'Carregando a ajuda...', erroAjuda: 'Não foi possível abrir a ajuda agora. Confira a internet e tente de novo.',
    aindaDuvida: 'Ainda com dúvida? Toque em <b>Preciso de ajuda</b> (embaixo) e fale com o Parque pelo WhatsApp.', abrirFerr: 'Abrir a ferramenta', semArtigo: 'Esta ferramenta ainda não tem explicação própria. Veja o guia do app ou fale com o Parque.',
    centralSite: 'Central de Ajuda completa (no site)', dica: 'Dica', guia: 'Guia do app', artigos: 'Artigos da Central de Ajuda', ajudaDe: 'Ajuda: {n}', voltarAjuda: 'Ajuda' },
  es: { ajudaBt: 'Ayuda', ajudaTit: 'Ayuda', comoUsar: 'Cómo usar la app', porFerramenta: 'Ayuda de cada herramienta', buscar: 'Busca un tema', buscarPh: 'Ej.: reserva, contraseña, libro',
    nadaAchado: 'No se encontró nada. Prueba otra palabra o habla con el Parque por WhatsApp.', oQueE: 'Qué es', paraQue: 'Para qué sirve', passos: 'Paso a paso', exemplos: 'Ejemplos', cuidados: 'Atención',
    relacionados: 'Ver también', soPt: 'Este artículo todavía está en portugués.', carregando: 'Cargando la ayuda...', erroAjuda: 'No se pudo abrir la ayuda ahora. Revisa internet e inténtalo de nuevo.',
    aindaDuvida: '¿Todavía tienes dudas? Toca <b>Necesito ayuda</b> (abajo) y habla con el Parque por WhatsApp.', abrirFerr: 'Abrir la herramienta', semArtigo: 'Esta herramienta todavía no tiene explicación propia. Mira la guía de la app o habla con el Parque.',
    centralSite: 'Centro de Ayuda completo (en el sitio)', dica: 'Consejo', guia: 'Guía de la app', artigos: 'Artículos del Centro de Ayuda', ajudaDe: 'Ayuda: {n}', voltarAjuda: 'Ayuda' },
  it: { ajudaBt: 'Aiuto', ajudaTit: 'Aiuto', comoUsar: "Come usare l'app", porFerramenta: 'Aiuto per ogni strumento', buscar: 'Cerca un argomento', buscarPh: 'Es.: prenotazione, password, libro',
    nadaAchado: 'Nessun risultato. Prova un’altra parola o scrivi al Parco su WhatsApp.', oQueE: "Che cos'è", paraQue: 'A cosa serve', passos: 'Passo dopo passo', exemplos: 'Esempi', cuidados: 'Attenzione',
    relacionados: 'Vedi anche', soPt: 'Questo contenuto è ancora in portoghese.', carregando: 'Caricamento...', erroAjuda: "Impossibile aprire l'aiuto ora. Controlla internet e riprova.",
    aindaDuvida: 'Hai ancora dubbi? Tocca il pulsante WhatsApp in basso e scrivi al Parco.', abrirFerr: 'Apri lo strumento', semArtigo: "Questo strumento non ha ancora una spiegazione propria. Guarda la guida dell'app o scrivi al Parco.",
    centralSite: 'Centro assistenza completo (sul sito)', dica: 'Consiglio', guia: "Guida dell'app", artigos: 'Articoli del Centro assistenza', ajudaDe: 'Aiuto: {n}', voltarAjuda: 'Aiuto' },
  fr: { ajudaBt: 'Aide', ajudaTit: 'Aide', comoUsar: "Comment utiliser l'app", porFerramenta: 'Aide pour chaque outil', buscar: 'Cherchez un sujet', buscarPh: 'Ex. : réservation, mot de passe, livre',
    nadaAchado: 'Aucun résultat. Essayez un autre mot ou écrivez au Parc sur WhatsApp.', oQueE: "Qu'est-ce que c'est", paraQue: 'À quoi ça sert', passos: 'Étape par étape', exemplos: 'Exemples', cuidados: 'Attention',
    relacionados: 'Voir aussi', soPt: 'Ce contenu est encore en portugais.', carregando: 'Chargement...', erroAjuda: "Impossible d'ouvrir l'aide maintenant. Vérifiez internet et réessayez.",
    aindaDuvida: 'Encore un doute ? Touchez le bouton WhatsApp en bas et écrivez au Parc.', abrirFerr: "Ouvrir l'outil", semArtigo: "Cet outil n'a pas encore d'explication propre. Consultez le guide de l'app ou écrivez au Parc.",
    centralSite: "Centre d'aide complet (sur le site)", dica: 'Conseil', guia: "Guide de l'app", artigos: "Articles du Centre d'aide", ajudaDe: 'Aide : {n}', voltarAjuda: 'Aide' },
  en: { ajudaBt: 'Help', ajudaTit: 'Help', comoUsar: 'How to use the app', porFerramenta: 'Help for each tool', buscar: 'Search a topic', buscarPh: 'E.g.: booking, password, book',
    nadaAchado: 'Nothing found. Try another word or message the Park on WhatsApp.', oQueE: 'What it is', paraQue: 'What it is for', passos: 'Step by step', exemplos: 'Examples', cuidados: 'Watch out',
    relacionados: 'See also', soPt: 'This content is still in Portuguese.', carregando: 'Loading help...', erroAjuda: 'Could not open help right now. Check your internet and try again.',
    aindaDuvida: 'Still unsure? Tap the WhatsApp button below and message the Park.', abrirFerr: 'Open the tool', semArtigo: 'This tool has no explanation of its own yet. See the app guide or message the Park.',
    centralSite: 'Full Help Center (on the website)', dica: 'Tip', guia: 'App guide', artigos: 'Help Center articles', ajudaDe: 'Help: {n}', voltarAjuda: 'Help' },
  de: { ajudaBt: 'Hilfe', ajudaTit: 'Hilfe', comoUsar: 'So nutzen Sie die App', porFerramenta: 'Hilfe zu jedem Werkzeug', buscar: 'Thema suchen', buscarPh: 'z. B.: Reservierung, Passwort, Buch',
    nadaAchado: 'Nichts gefunden. Versuchen Sie ein anderes Wort oder schreiben Sie dem Park per WhatsApp.', oQueE: 'Was ist das', paraQue: 'Wozu dient es', passos: 'Schritt für Schritt', exemplos: 'Beispiele', cuidados: 'Achtung',
    relacionados: 'Siehe auch', soPt: 'Dieser Inhalt ist noch auf Portugiesisch.', carregando: 'Hilfe wird geladen...', erroAjuda: 'Die Hilfe konnte gerade nicht geöffnet werden. Prüfen Sie das Internet und versuchen Sie es erneut.',
    aindaDuvida: 'Noch Fragen? Tippen Sie unten auf den WhatsApp-Knopf und schreiben Sie dem Park.', abrirFerr: 'Werkzeug öffnen', semArtigo: 'Für dieses Werkzeug gibt es noch keine eigene Erklärung. Sehen Sie im App-Leitfaden nach oder schreiben Sie dem Park.',
    centralSite: 'Vollständiges Hilfe-Center (auf der Website)', dica: 'Tipp', guia: 'App-Leitfaden', artigos: 'Artikel des Hilfe-Centers', ajudaDe: 'Hilfe: {n}', voltarAjuda: 'Hilfe' }
};

// Guia do app: um assunto por tela, frases curtas, passos numerados. [id, ícone, título, introdução, passos[], dica, palavras de busca]
const GUIA = {
  pt: [
    ['instalar', 'fa-mobile-alt', 'Colocar o app no celular', 'O app não vem da loja: ele é instalado pelo navegador do celular e fica com ícone na tela, como os outros apps.', [
      'Abra o endereço do app no navegador do celular (Chrome no Android, Safari no iPhone).',
      '<b>Android:</b> toque em <b>Baixar o app</b> quando aparecer. Se não aparecer, toque nos <b>três pontinhos ⋮</b> (em cima, à direita) e depois em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.',
      '<b>iPhone:</b> toque em <b>Compartilhar</b> (o quadrado com a seta, embaixo), depois em <b>Adicionar à Tela de Início</b> e em <b>Adicionar</b>.',
      'Pronto: procure o ícone <b>CONecta Retiro</b> na tela do celular e abra por ele.'], 'Se tocar em "Agora não", o aviso volta da próxima vez que você abrir o app.', 'instalar baixar celular icone tela iphone android'],
    ['entrar', 'fa-sign-in-alt', 'Entrar, criar conta e esqueci a senha', 'Cada pessoa tem a sua conta, com o seu e-mail e a sua senha. A conta é a mesma do site do Parque.', [
      'Digite o seu <b>e-mail</b> e a sua <b>senha</b> e toque em <b>Entrar</b>. Marque <b>Mostrar a senha</b> para ver o que digitou.',
      '<b>Ainda não tem conta?</b> Toque em <b>Ainda não tenho acesso</b>, preencha o cadastro e confirme o e-mail que chega na sua caixa de entrada.',
      'Depois do cadastro, a comissão do Parque precisa <b>aprovar</b> o seu acesso. Até lá aparece o aviso "aguarda a aprovação".',
      '<b>Esqueceu a senha?</b> Toque em <b>Esqueci minha senha</b>, digite o e-mail e abra a mensagem que chega para criar uma senha nova.'], 'Não encontrou o e-mail? Olhe também na pasta de spam ou lixo eletrônico.', 'entrar login senha cadastro conta esqueci aprovacao email confirmar'],
    ['inicio', 'fa-home', 'A tela Início', 'É a primeira tela depois de entrar. Ela mostra só o que você pode usar.', [
      '<b>Para toda a equipe:</b> Avisos e agenda, Biblioteca, Atividades e Reunião de Escola.',
      '<b>Minhas responsabilidades:</b> as ferramentas das funções que você tem no Parque (por exemplo, Alojamento ou Inventário).',
      '<b>Ver todas as áreas:</b> todas as ferramentas que você pode abrir, separadas em Comissões e Administração.',
      'O <b>?</b> ao lado de cada ferramenta abre a explicação dela.'], 'Os números em destaque mostram quantas coisas novas há (por exemplo, cadastros esperando aprovação).', 'inicio tela principal responsabilidades areas ferramentas'],
    ['ferramentas', 'fa-tools', 'Abrir uma ferramenta e voltar ao app', 'As ferramentas abrem dentro do app, já no lugar certo, com a barra azul do app no alto.', [
      'Toque no nome da ferramenta.',
      'Use a ferramenta normalmente. As explicações de cada campo aparecem ao tocar no ícone de ajuda da página.',
      'Para voltar, toque em <b>Início</b>, no canto de cima à esquerda.',
      'O que você salva fica guardado no servidor do Parque e aparece para a equipe em qualquer celular ou computador.'], 'Toque em <b>Ajuda</b>, no canto de cima à direita, para ler a explicação da ferramenta que está aberta.', 'ferramenta abrir voltar salvar area restrita'],
    ['agenda', 'fa-calendar-alt', 'Avisos, agenda e biblioteca', 'Duas telas feitas para o celular, para consultar rápido.', [
      '<b>Avisos e agenda:</b> mostra as datas do Parque, as atividades e as reuniões dos próximos 90 dias. O dia de hoje fica em destaque.',
      'Para ver o calendário inteiro, toque em <b>Calendário completo</b>.',
      '<b>Biblioteca:</b> em "Livros comigo" aparecem os livros emprestados a você e a data para devolver.',
      'Para procurar um livro, digite parte do título ou do autor. A etiqueta mostra se ele está disponível ou emprestado.'], 'Se aparecer "Sem conexão", o app mostra o que já estava carregado e envia as suas alterações quando a internet voltar.', 'agenda avisos calendario datas biblioteca livro emprestimo devolver'],
    ['idioma', 'fa-globe', 'Idioma e tamanho da letra', 'O app abre no idioma do seu celular, mas você pode trocar.', [
      'Vá até o fim da tela Início.',
      'Em <b>Idioma</b>, escolha a língua. O app muda na hora e lembra da escolha.',
      'A letra acompanha o tamanho de letra do seu celular. Para aumentar, vá nas configurações do celular, em <b>Tela</b> ou <b>Acessibilidade</b>, e aumente o tamanho da fonte.'], 'Nomes, títulos e textos escritos pelas pessoas continuam como foram digitados.', 'idioma lingua espanhol portugues letra grande fonte tamanho'],
    ['atualizar', 'fa-sync-alt', 'Atualizar o app', 'O app recebe melhorias de tempos em tempos.', [
      'Quando houver uma versão nova, aparece a faixa <b>Nova versão disponível</b>.',
      'Toque em <b>Atualizar agora</b>. O app fecha e abre de novo, já atualizado.',
      'A versão que você está usando aparece no fim da tela Início.'], 'Seus dados não se perdem ao atualizar: eles ficam no servidor do Parque.', 'atualizar versao nova faixa'],
    ['problemas', 'fa-life-ring', 'Quando algo não funciona', 'Os problemas mais comuns e o que fazer.', [
      '<b>"E-mail ou senha incorretos":</b> confira as letras e use <b>Esqueci minha senha</b> se precisar.',
      '<b>"Aguarda a aprovação":</b> a comissão ainda não liberou o seu acesso. Avise pelo WhatsApp do Parque.',
      '<b>"Sem conexão":</b> confira a internet. O que você fez fica guardado e é enviado quando a conexão voltar.',
      '<b>Não acho uma ferramenta:</b> você só vê as ferramentas das suas funções. Peça à administração para incluir a função.',
      'Em qualquer dúvida, toque em <b>Preciso de ajuda</b> para falar com o Parque pelo WhatsApp.'], '', 'problema erro nao funciona sem conexao internet aprovacao senha incorreta whatsapp']
  ],
  es: [
    ['instalar', 'fa-mobile-alt', 'Poner la app en el celular', 'La app no viene de la tienda: se instala desde el navegador del celular y queda con un ícono en la pantalla, como las otras apps.', [
      'Abre la dirección de la app en el navegador del celular (Chrome en Android, Safari en iPhone).',
      '<b>Android:</b> toca <b>Descargar la app</b> cuando aparezca. Si no aparece, toca los <b>tres puntos ⋮</b> (arriba, a la derecha) y luego <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.',
      '<b>iPhone:</b> toca <b>Compartir</b> (el cuadrado con la flecha, abajo), luego <b>Agregar a pantalla de inicio</b> y <b>Agregar</b>.',
      'Listo: busca el ícono <b>CONecta Retiro</b> en la pantalla del celular y ábrela desde allí.'], 'Si tocas "Ahora no", el aviso vuelve la próxima vez que abras la app.', 'instalar descargar celular icono pantalla iphone android'],
    ['entrar', 'fa-sign-in-alt', 'Entrar, crear cuenta y olvidé la contraseña', 'Cada persona tiene su cuenta, con su correo y su contraseña. La cuenta es la misma del sitio del Parque.', [
      'Escribe tu <b>correo</b> y tu <b>contraseña</b> y toca <b>Entrar</b>. Marca <b>Mostrar la contraseña</b> para ver lo que escribiste.',
      '<b>¿Todavía no tienes cuenta?</b> Toca <b>Todavía no tengo acceso</b>, completa el registro y confirma el correo que llega a tu bandeja de entrada.',
      'Después del registro, la comisión del Parque debe <b>aprobar</b> tu acceso. Mientras tanto aparece el aviso "espera la aprobación".',
      '<b>¿Olvidaste la contraseña?</b> Toca <b>Olvidé mi contraseña</b>, escribe el correo y abre el mensaje que llega para crear una contraseña nueva.'], '¿No encuentras el correo? Mira también en la carpeta de spam o correo no deseado.', 'entrar login contrasena registro cuenta olvide aprobacion correo confirmar'],
    ['inicio', 'fa-home', 'La pantalla Inicio', 'Es la primera pantalla después de entrar. Muestra solo lo que puedes usar.', [
      '<b>Para todo el equipo:</b> Avisos y agenda, Biblioteca, Actividades y Reunión de Escuela.',
      '<b>Mis responsabilidades:</b> las herramientas de las funciones que tienes en el Parque (por ejemplo, Alojamiento o Inventario).',
      '<b>Ver todas las áreas:</b> todas las herramientas que puedes abrir, separadas en Comisiones y Administración.',
      'El <b>?</b> al lado de cada herramienta abre su explicación.'], 'Los números destacados muestran cuántas novedades hay (por ejemplo, registros esperando aprobación).', 'inicio pantalla principal responsabilidades areas herramientas'],
    ['ferramentas', 'fa-tools', 'Abrir una herramienta y volver a la app', 'Las herramientas abren dentro de la app, ya en el lugar correcto, con la barra azul de la app arriba.', [
      'Toca el nombre de la herramienta.',
      'Usa la herramienta normalmente. Las explicaciones de cada campo aparecen al tocar el ícono de ayuda de la página.',
      'Para volver, toca <b>Inicio</b>, en la esquina de arriba a la izquierda.',
      'Lo que guardas queda en el servidor del Parque y aparece para el equipo en cualquier celular o computadora.'], 'Toca <b>Ayuda</b>, en la esquina de arriba a la derecha, para leer la explicación de la herramienta abierta.', 'herramienta abrir volver guardar area restringida'],
    ['agenda', 'fa-calendar-alt', 'Avisos, agenda y biblioteca', 'Dos pantallas hechas para el celular, para consultar rápido.', [
      '<b>Avisos y agenda:</b> muestra las fechas del Parque, las actividades y las reuniones de los próximos 90 días. El día de hoy aparece destacado.',
      'Para ver el calendario entero, toca <b>Calendario completo</b>.',
      '<b>Biblioteca:</b> en "Libros conmigo" aparecen los libros que tienes prestados y la fecha para devolverlos.',
      'Para buscar un libro, escribe parte del título o del autor. La etiqueta indica si está disponible o prestado.'], 'Si aparece "Sin conexión", la app muestra lo que ya estaba cargado y envía tus cambios cuando vuelva internet.', 'agenda avisos calendario fechas biblioteca libro prestamo devolver'],
    ['idioma', 'fa-globe', 'Idioma y tamaño de la letra', 'La app se abre en el idioma de tu celular, pero puedes cambiarlo.', [
      'Ve al final de la pantalla Inicio.',
      'En <b>Idioma</b>, elige la lengua. La app cambia al instante y recuerda tu elección.',
      'La letra sigue el tamaño de letra de tu celular. Para agrandarla, ve a la configuración del celular, en <b>Pantalla</b> o <b>Accesibilidad</b>, y aumenta el tamaño de la fuente.'], 'Los nombres, títulos y textos escritos por las personas quedan como fueron escritos.', 'idioma lengua espanol portugues letra grande fuente tamano'],
    ['atualizar', 'fa-sync-alt', 'Actualizar la app', 'La app recibe mejoras de vez en cuando.', [
      'Cuando haya una versión nueva, aparece la franja <b>Nueva versión disponible</b>.',
      'Toca <b>Actualizar ahora</b>. La app se cierra y se abre de nuevo, ya actualizada.',
      'La versión que estás usando aparece al final de la pantalla Inicio.'], 'Tus datos no se pierden al actualizar: quedan en el servidor del Parque.', 'actualizar version nueva franja'],
    ['problemas', 'fa-life-ring', 'Cuando algo no funciona', 'Los problemas más comunes y qué hacer.', [
      '<b>"Correo o contraseña incorrectos":</b> revisa las letras y usa <b>Olvidé mi contraseña</b> si hace falta.',
      '<b>"Espera la aprobación":</b> la comisión todavía no habilitó tu acceso. Avisa por el WhatsApp del Parque.',
      '<b>"Sin conexión":</b> revisa internet. Lo que hiciste queda guardado y se envía cuando vuelva la conexión.',
      '<b>No encuentro una herramienta:</b> solo ves las herramientas de tus funciones. Pide a la administración que incluya la función.',
      'Ante cualquier duda, toca <b>Necesito ayuda</b> para hablar con el Parque por WhatsApp.'], '', 'problema error no funciona sin conexion internet aprobacion contrasena incorrecta whatsapp']
  ]
};

window.PR_APP_AJUDA = {
  ui: (lang, k, vars) => { let s = (UI[lang] && UI[lang][k]) || UI.pt[k] || k; if (vars) Object.keys(vars).forEach(v => { s = s.split('{' + v + '}').join(vars[v]); }); return s; },
  guia: lang => (GUIA[lang] || GUIA.pt).map(g => ({ id: g[0], icone: g[1], titulo: g[2], intro: g[3], passos: g[4], dica: g[5], palavras: g[6] })),
  temGuia: lang => !!GUIA[lang]
};
})();
