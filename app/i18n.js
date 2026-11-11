// Idiomas do app CONecta Retiro: os mesmos 6 do site (pt, es, it, fr, en, de).
// O app abre no idioma escolhido antes (chave pr_idioma, a mesma do site) ou, se ninguém escolheu, no idioma do celular.
// Nomes das ferramentas da área restrita e termos da Escola ficam em português.
(function () {
const T = {
  pt: {
    sub: 'Parque de Estudo e Reflexão Retiro<br>Comissões e administração', email: 'Seu e-mail', senha: 'Sua senha', mostrar: 'Mostrar a senha', entrar: 'Entrar', entrando: 'Entrando...',
    esqueci: 'Esqueci minha senha', semAcesso: 'Ainda não tenho acesso', digite: 'Digite seu e-mail e sua senha.', pendente: 'Seu cadastro ainda aguarda a aprovação da comissão do Parque Retiro.',
    errCred: 'E-mail ou senha incorretos. Confira e tente de novo.', errConf: 'Falta confirmar seu e-mail: abra a mensagem que enviamos e toque no link de confirmação.', errRede: 'Sem conexão com o servidor. Confira a internet e tente de novo.', errMuitas: 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.',
    instTit: 'Tenha o app no celular', instTxt: 'O ícone do <b>CONecta Retiro</b> fica na tela do seu celular, como os outros apps.', baixar: 'Baixar o app', agoraNao: 'Agora não',
    iph: '<li>Toque em <b>Compartilhar</b> (embaixo, no Safari).</li><li>Toque em <b>Adicionar à Tela de Início</b>.</li><li>Toque em <b>Adicionar</b>.</li>',
    and: '<li>Toque nos <b>três pontinhos ⋮</b> do navegador (em cima, à direita).</li><li>Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li>',
    nova: 'Nova versão {v} disponível.', atualizar: 'Atualizar agora', atualizando: 'Atualizando...', versao: 'versão',
    ola: 'Olá, {n}!', oQue: 'O que você quer fazer?', equipe: 'Para toda a equipe', agenda: 'Avisos e agenda', biblioteca: 'Biblioteca', atividades: 'Atividades', reuniao: 'Reunião de Escola',
    minhas: 'Minhas responsabilidades', todas: 'Ver todas as áreas', todasTit: 'Todas as áreas', sair: 'Sair do app', inicio: 'Início', idioma: 'Idioma',
    semRede: 'Sem conexão.', aguardando: '{n} alteração(ões) aguardando.', carregado: 'Mostrando o que já estava carregado.',
    prox90: 'Próximos 90 dias: datas do Parque, atividades e reuniões.', nada90: 'Nada marcado nos próximos 90 dias.', hoje: 'Hoje', anual: 'Data anual do Parque', ate: 'até', calCompleto: 'Calendário completo',
    comigo: 'Livros comigo', devolver: 'Devolver até', semData: 'Sem data de devolução', nenhumComigo: 'Nenhum livro com você.', procurar: 'Procurar um livro', tituloAutor: 'Digite o título ou o autor',
    disponivel: 'Disponível', emprestado: 'Emprestado', digiteOutros: 'Digite para encontrar outros livros.', nenhumAchado: 'Nenhum livro encontrado.', bibCompleta: 'Biblioteca completa',
    area_com: 'Comissões Parque Retiro', area_adm: 'Administração', precisaServidor: 'O app precisa do servidor do Parque. Abra pelo endereço oficial do site.', semServidor: 'Não foi possível falar com o servidor. Confira a internet e tente de novo.',
    ajuda: 'Preciso de ajuda', ajudaMsg: 'Olá! Preciso de ajuda com o app CONecta Retiro.'
  },
  es: {
    sub: 'Parque de Estudio y Reflexión Retiro<br>Comisiones y administración', email: 'Tu correo electrónico', senha: 'Tu contraseña', mostrar: 'Mostrar la contraseña', entrar: 'Entrar', entrando: 'Entrando...',
    esqueci: 'Olvidé mi contraseña', semAcesso: 'Todavía no tengo acceso', digite: 'Escribe tu correo y tu contraseña.', pendente: 'Tu registro todavía espera la aprobación de la comisión del Parque Retiro.',
    errCred: 'Correo o contraseña incorrectos. Revisa e inténtalo de nuevo.', errConf: 'Falta confirmar tu correo: abre el mensaje que enviamos y toca el enlace de confirmación.', errRede: 'Sin conexión con el servidor. Revisa internet e inténtalo de nuevo.', errMuitas: 'Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.',
    instTit: 'Ten la app en tu celular', instTxt: 'El ícono de <b>CONecta Retiro</b> queda en la pantalla de tu celular, como las otras apps.', baixar: 'Descargar la app', agoraNao: 'Ahora no',
    iph: '<li>Toca <b>Compartir</b> (abajo, en Safari).</li><li>Toca <b>Agregar a pantalla de inicio</b>.</li><li>Toca <b>Agregar</b>.</li>',
    and: '<li>Toca los <b>tres puntos ⋮</b> del navegador (arriba, a la derecha).</li><li>Toca <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.</li>',
    nova: 'Nueva versión {v} disponible.', atualizar: 'Actualizar ahora', atualizando: 'Actualizando...', versao: 'versión',
    ola: '¡Hola, {n}!', oQue: '¿Qué quieres hacer?', equipe: 'Para todo el equipo', agenda: 'Avisos y agenda', biblioteca: 'Biblioteca', atividades: 'Actividades', reuniao: 'Reunión de Escuela',
    minhas: 'Mis responsabilidades', todas: 'Ver todas las áreas', todasTit: 'Todas las áreas', sair: 'Salir de la app', inicio: 'Inicio', idioma: 'Idioma',
    semRede: 'Sin conexión.', aguardando: '{n} cambio(s) esperando.', carregado: 'Mostrando lo que ya estaba cargado.',
    prox90: 'Próximos 90 días: fechas del Parque, actividades y reuniones.', nada90: 'Nada programado en los próximos 90 días.', hoje: 'Hoy', anual: 'Fecha anual del Parque', ate: 'hasta', calCompleto: 'Calendario completo',
    comigo: 'Libros conmigo', devolver: 'Devolver hasta', semData: 'Sin fecha de devolución', nenhumComigo: 'No tienes ningún libro.', procurar: 'Buscar un libro', tituloAutor: 'Escribe el título o el autor',
    disponivel: 'Disponible', emprestado: 'Prestado', digiteOutros: 'Escribe para encontrar otros libros.', nenhumAchado: 'No se encontró ningún libro.', bibCompleta: 'Biblioteca completa',
    area_com: 'Comisiones Parque Retiro', area_adm: 'Administración', precisaServidor: 'La app necesita el servidor del Parque. Ábrela desde la dirección oficial del sitio.', semServidor: 'No fue posible conectar con el servidor. Revisa internet e inténtalo de nuevo.',
    ajuda: 'Necesito ayuda', ajudaMsg: '¡Hola! Necesito ayuda con la app CONecta Retiro.'
  },
  it: {
    sub: 'Parco di Studio e Riflessione Retiro<br>Commissioni e amministrazione', email: 'La tua e-mail', senha: 'La tua password', mostrar: 'Mostra la password', entrar: 'Entra', entrando: 'Accesso in corso...',
    esqueci: 'Ho dimenticato la password', semAcesso: 'Non ho ancora accesso', digite: 'Scrivi la tua e-mail e la tua password.', pendente: 'La tua registrazione attende ancora l’approvazione della commissione del Parco Retiro.',
    errCred: 'E-mail o password errate. Controlla e riprova.', errConf: 'Devi confermare la tua e-mail: apri il messaggio che ti abbiamo inviato e tocca il link di conferma.', errRede: 'Nessuna connessione con il server. Controlla internet e riprova.', errMuitas: 'Troppi tentativi di fila. Attendi qualche minuto e riprova.',
    instTit: 'Installa l’app sul cellulare', instTxt: 'L’icona di <b>CONecta Retiro</b> resta sullo schermo del cellulare, come le altre app.', baixar: 'Scarica l’app', agoraNao: 'Non ora',
    iph: '<li>Tocca <b>Condividi</b> (in basso, in Safari).</li><li>Tocca <b>Aggiungi alla schermata Home</b>.</li><li>Tocca <b>Aggiungi</b>.</li>',
    and: '<li>Tocca i <b>tre puntini ⋮</b> del browser (in alto a destra).</li><li>Tocca <b>Installa app</b> o <b>Aggiungi a schermata Home</b>.</li>',
    nova: 'Nuova versione {v} disponibile.', atualizar: 'Aggiorna ora', atualizando: 'Aggiornamento...', versao: 'versione',
    ola: 'Ciao, {n}!', oQue: 'Cosa vuoi fare?', equipe: 'Per tutta la squadra', agenda: 'Avvisi e agenda', biblioteca: 'Biblioteca', atividades: 'Attività', reuniao: 'Riunione di Scuola',
    minhas: 'Le mie responsabilità', todas: 'Vedi tutte le aree', todasTit: 'Tutte le aree', sair: 'Esci dall’app', inicio: 'Inizio', idioma: 'Lingua',
    semRede: 'Nessuna connessione.', aguardando: '{n} modifica/e in attesa.', carregado: 'Mostro ciò che era già caricato.',
    prox90: 'Prossimi 90 giorni: date del Parco, attività e riunioni.', nada90: 'Niente in programma nei prossimi 90 giorni.', hoje: 'Oggi', anual: 'Data annuale del Parco', ate: 'fino al', calCompleto: 'Calendario completo',
    comigo: 'Libri con me', devolver: 'Restituire entro il', semData: 'Senza data di restituzione', nenhumComigo: 'Nessun libro con te.', procurar: 'Cerca un libro', tituloAutor: 'Scrivi il titolo o l’autore',
    disponivel: 'Disponibile', emprestado: 'In prestito', digiteOutros: 'Scrivi per trovare altri libri.', nenhumAchado: 'Nessun libro trovato.', bibCompleta: 'Biblioteca completa',
    area_com: 'Commissioni Parco Retiro', area_adm: 'Amministrazione', precisaServidor: 'L’app ha bisogno del server del Parco. Aprila dall’indirizzo ufficiale del sito.', semServidor: 'Impossibile collegarsi al server. Controlla internet e riprova.',
    ajuda: 'Ho bisogno di aiuto', ajudaMsg: 'Ciao! Ho bisogno di aiuto con l’app CONecta Retiro.'
  },
  fr: {
    sub: 'Parc d’Étude et de Réflexion Retiro<br>Commissions et administration', email: 'Votre e-mail', senha: 'Votre mot de passe', mostrar: 'Afficher le mot de passe', entrar: 'Entrer', entrando: 'Connexion...',
    esqueci: 'Mot de passe oublié', semAcesso: 'Je n’ai pas encore d’accès', digite: 'Saisissez votre e-mail et votre mot de passe.', pendente: 'Votre inscription attend encore l’approbation de la commission du Parc Retiro.',
    errCred: 'E-mail ou mot de passe incorrect. Vérifiez et réessayez.', errConf: 'Vous devez confirmer votre e-mail : ouvrez le message envoyé et touchez le lien de confirmation.', errRede: 'Pas de connexion au serveur. Vérifiez internet et réessayez.', errMuitas: 'Trop de tentatives de suite. Attendez quelques minutes et réessayez.',
    instTit: 'Ayez l’app sur votre téléphone', instTxt: 'L’icône de <b>CONecta Retiro</b> reste sur l’écran de votre téléphone, comme les autres apps.', baixar: 'Télécharger l’app', agoraNao: 'Pas maintenant',
    iph: '<li>Touchez <b>Partager</b> (en bas, dans Safari).</li><li>Touchez <b>Sur l’écran d’accueil</b>.</li><li>Touchez <b>Ajouter</b>.</li>',
    and: '<li>Touchez les <b>trois points ⋮</b> du navigateur (en haut à droite).</li><li>Touchez <b>Installer l’application</b> ou <b>Ajouter à l’écran d’accueil</b>.</li>',
    nova: 'Nouvelle version {v} disponible.', atualizar: 'Mettre à jour', atualizando: 'Mise à jour...', versao: 'version',
    ola: 'Bonjour, {n} !', oQue: 'Que voulez-vous faire ?', equipe: 'Pour toute l’équipe', agenda: 'Avis et agenda', biblioteca: 'Bibliothèque', atividades: 'Activités', reuniao: 'Réunion d’École',
    minhas: 'Mes responsabilités', todas: 'Voir toutes les zones', todasTit: 'Toutes les zones', sair: 'Quitter l’app', inicio: 'Accueil', idioma: 'Langue',
    semRede: 'Pas de connexion.', aguardando: '{n} modification(s) en attente.', carregado: 'Affichage de ce qui était déjà chargé.',
    prox90: 'Prochains 90 jours : dates du Parc, activités et réunions.', nada90: 'Rien de prévu dans les 90 prochains jours.', hoje: 'Aujourd’hui', anual: 'Date annuelle du Parc', ate: 'jusqu’au', calCompleto: 'Calendrier complet',
    comigo: 'Livres avec moi', devolver: 'À rendre avant le', semData: 'Sans date de retour', nenhumComigo: 'Aucun livre avec vous.', procurar: 'Chercher un livre', tituloAutor: 'Saisissez le titre ou l’auteur',
    disponivel: 'Disponible', emprestado: 'Emprunté', digiteOutros: 'Saisissez pour trouver d’autres livres.', nenhumAchado: 'Aucun livre trouvé.', bibCompleta: 'Bibliothèque complète',
    area_com: 'Commissions Parc Retiro', area_adm: 'Administration', precisaServidor: 'L’app a besoin du serveur du Parc. Ouvrez-la depuis l’adresse officielle du site.', semServidor: 'Impossible de joindre le serveur. Vérifiez internet et réessayez.',
    ajuda: 'J’ai besoin d’aide', ajudaMsg: 'Bonjour ! J’ai besoin d’aide avec l’app CONecta Retiro.'
  },
  en: {
    sub: 'Retiro Park of Study and Reflection<br>Committees and administration', email: 'Your e-mail', senha: 'Your password', mostrar: 'Show password', entrar: 'Sign in', entrando: 'Signing in...',
    esqueci: 'I forgot my password', semAcesso: 'I don’t have access yet', digite: 'Enter your e-mail and password.', pendente: 'Your registration is still waiting for approval by the Retiro Park committee.',
    errCred: 'Wrong e-mail or password. Check and try again.', errConf: 'Please confirm your e-mail: open the message we sent and tap the confirmation link.', errRede: 'No connection to the server. Check your internet and try again.', errMuitas: 'Too many attempts in a row. Wait a few minutes and try again.',
    instTit: 'Get the app on your phone', instTxt: 'The <b>CONecta Retiro</b> icon stays on your phone screen, like your other apps.', baixar: 'Download the app', agoraNao: 'Not now',
    iph: '<li>Tap <b>Share</b> (at the bottom, in Safari).</li><li>Tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li>',
    and: '<li>Tap the browser’s <b>three dots ⋮</b> (top right).</li><li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li>',
    nova: 'New version {v} available.', atualizar: 'Update now', atualizando: 'Updating...', versao: 'version',
    ola: 'Hello, {n}!', oQue: 'What would you like to do?', equipe: 'For the whole team', agenda: 'News and calendar', biblioteca: 'Library', atividades: 'Activities', reuniao: 'School Meeting',
    minhas: 'My responsibilities', todas: 'See all areas', todasTit: 'All areas', sair: 'Sign out', inicio: 'Home', idioma: 'Language',
    semRede: 'No connection.', aguardando: '{n} change(s) waiting.', carregado: 'Showing what was already loaded.',
    prox90: 'Next 90 days: Park dates, activities and meetings.', nada90: 'Nothing scheduled in the next 90 days.', hoje: 'Today', anual: 'Annual Park date', ate: 'until', calCompleto: 'Full calendar',
    comigo: 'Books with me', devolver: 'Return by', semData: 'No return date', nenhumComigo: 'You have no books.', procurar: 'Find a book', tituloAutor: 'Type the title or author',
    disponivel: 'Available', emprestado: 'On loan', digiteOutros: 'Type to find other books.', nenhumAchado: 'No books found.', bibCompleta: 'Full library',
    area_com: 'Retiro Park Committees', area_adm: 'Administration', precisaServidor: 'The app needs the Park server. Open it from the official site address.', semServidor: 'Could not reach the server. Check your internet and try again.',
    ajuda: 'I need help', ajudaMsg: 'Hello! I need help with the CONecta Retiro app.'
  },
  de: {
    sub: 'Park für Studium und Reflexion Retiro<br>Kommissionen und Verwaltung', email: 'Deine E-Mail', senha: 'Dein Passwort', mostrar: 'Passwort anzeigen', entrar: 'Anmelden', entrando: 'Anmeldung...',
    esqueci: 'Passwort vergessen', semAcesso: 'Ich habe noch keinen Zugang', digite: 'Gib deine E-Mail und dein Passwort ein.', pendente: 'Deine Registrierung wartet noch auf die Freigabe durch die Kommission des Parks Retiro.',
    errCred: 'E-Mail oder Passwort falsch. Bitte prüfen und erneut versuchen.', errConf: 'Bitte bestätige deine E-Mail: Öffne unsere Nachricht und tippe auf den Bestätigungslink.', errRede: 'Keine Verbindung zum Server. Prüfe das Internet und versuche es erneut.', errMuitas: 'Zu viele Versuche hintereinander. Warte ein paar Minuten und versuche es erneut.',
    instTit: 'Die App auf dein Handy', instTxt: 'Das Symbol von <b>CONecta Retiro</b> bleibt auf deinem Handybildschirm, wie andere Apps.', baixar: 'App herunterladen', agoraNao: 'Nicht jetzt',
    iph: '<li>Tippe auf <b>Teilen</b> (unten, in Safari).</li><li>Tippe auf <b>Zum Home-Bildschirm</b>.</li><li>Tippe auf <b>Hinzufügen</b>.</li>',
    and: '<li>Tippe auf die <b>drei Punkte ⋮</b> des Browsers (oben rechts).</li><li>Tippe auf <b>App installieren</b> oder <b>Zum Startbildschirm hinzufügen</b>.</li>',
    nova: 'Neue Version {v} verfügbar.', atualizar: 'Jetzt aktualisieren', atualizando: 'Aktualisierung...', versao: 'Version',
    ola: 'Hallo, {n}!', oQue: 'Was möchtest du tun?', equipe: 'Für das ganze Team', agenda: 'Hinweise und Kalender', biblioteca: 'Bibliothek', atividades: 'Aktivitäten', reuniao: 'Schultreffen',
    minhas: 'Meine Aufgaben', todas: 'Alle Bereiche ansehen', todasTit: 'Alle Bereiche', sair: 'App verlassen', inicio: 'Start', idioma: 'Sprache',
    semRede: 'Keine Verbindung.', aguardando: '{n} Änderung(en) warten.', carregado: 'Es wird angezeigt, was bereits geladen war.',
    prox90: 'Nächste 90 Tage: Termine des Parks, Aktivitäten und Treffen.', nada90: 'In den nächsten 90 Tagen ist nichts geplant.', hoje: 'Heute', anual: 'Jährlicher Termin des Parks', ate: 'bis', calCompleto: 'Ganzer Kalender',
    comigo: 'Bücher bei mir', devolver: 'Zurückgeben bis', semData: 'Ohne Rückgabedatum', nenhumComigo: 'Du hast keine Bücher.', procurar: 'Buch suchen', tituloAutor: 'Titel oder Autor eingeben',
    disponivel: 'Verfügbar', emprestado: 'Ausgeliehen', digiteOutros: 'Tippe, um weitere Bücher zu finden.', nenhumAchado: 'Kein Buch gefunden.', bibCompleta: 'Ganze Bibliothek',
    area_com: 'Kommissionen Park Retiro', area_adm: 'Verwaltung', precisaServidor: 'Die App braucht den Server des Parks. Öffne sie über die offizielle Adresse der Website.', semServidor: 'Der Server ist nicht erreichbar. Prüfe das Internet und versuche es erneut.',
    ajuda: 'Ich brauche Hilfe', ajudaMsg: 'Hallo! Ich brauche Hilfe mit der App CONecta Retiro.'
  }
};
const NOMES = { pt: 'Português', es: 'Español', it: 'Italiano', fr: 'Français', en: 'English', de: 'Deutsch' };
const LOCALE = { pt: 'pt-BR', es: 'es', it: 'it', fr: 'fr', en: 'en', de: 'de' };
function detectar() {
  let s = null; try { s = localStorage.getItem('pr_idioma'); } catch (e) { /* ignora */ }
  const q = new URLSearchParams(location.search).get('lang');
  if (q && T[q]) return q;
  if (s && T[s]) return s;
  const ls = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'pt']).map(l => String(l).slice(0, 2).toLowerCase());
  return ls.find(l => T[l]) || 'pt';
}
let atual = detectar();
const ABAS = window.PR_APP_ABAS_I18N || {};
const t = (k, vars) => { let s = (T[atual] && T[atual][k]) || (ABAS[atual] && ABAS[atual][k]) || T.pt[k] || k; if (vars) Object.keys(vars).forEach(v => { s = s.split('{' + v + '}').join(vars[v]); }); return s; };
function mudar(l) { if (!T[l]) return; atual = l; try { localStorage.setItem('pr_idioma', l); } catch (e) { /* ignora */ } document.documentElement.lang = LOCALE[l]; }
document.documentElement.lang = LOCALE[atual];
const aba = (id, ptNome) => (atual !== 'pt' && ABAS[atual] && ABAS[atual]['tab_' + id]) || ptNome;
window.PR_APP_I18N = { t, aba, mudar, atual: () => atual, locale: () => LOCALE[atual], NOMES, LINGUAS: Object.keys(T) };
})();
