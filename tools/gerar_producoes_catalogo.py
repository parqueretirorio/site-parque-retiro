"""Gera producoes-catalogo.js a partir de tools/producoes_catalogo.txt.
Marca cada produção que também está na lista de repetidas (producoes-dados.js).
Rodar na pasta do site: python3 tools/gerar_producoes_catalogo.py"""
import json, re, os, sys, unicodedata
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def norm(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9 ]', ' ', s)
PARAR = set('el la los las de del en y a al un una e o the of and di il le les des du et sobre con com da do dos das como por para que lo su sus se nel nella dans'.split())
def toks(s): return {w for w in norm(s).split() if len(w) > 2 and w not in PARAR}
# repetidas: lê o array do JS
js = open(os.path.join(SITE, 'producoes-dados.js'), encoding='utf-8').read()
bloco = js[js.index('repetidas: [') + len('repetidas: '):js.rindex(']') + 1]
bloco = re.sub(r'//.*', '', bloco); bloco = re.sub(r",\s*\]", ']', bloco)
rep = json.loads(bloco.replace("'", '"').replace('L"Homme', "L'Homme").replace('"Homme', "'Homme")) if False else None
rep = []
for m in re.finditer(r"\[\s*(['\"])(.*?)\1\s*,\s*(['\"])(.*?)\3\s*,\s*(['\"])(.*?)\5\s*,\s*\[([^\]]*)\]\s*\]", bloco):
    rep.append((m.group(2), m.group(4), m.group(6), re.findall(r"'(\w+)'", m.group(7))))
def sobren(a): return {w for w in norm(a).split() if len(w) > 3}
NOMES = {'pdv': 'Punta de Vacas', 'lr': 'La Reja', 'man': 'Manantiales', 'car': 'Carcarañá', 'cg': 'Casa Giorgi', 'cau': 'Caucaia', 'lbi': 'La Belle Idée', 'att': 'Attigliano', 'bos': 'Bosques'}
# Títulos da mesma obra em outro idioma (título da lista de repetidas -> título no catálogo do Parque)
ALIAS = {
  'Experiencias de una peregrinación y sus consecuencias en el proceso de Ascesis': 'Experiências de uma peregrinação e suas consequências no processo de ascese',
  'Comentarios al Mensaje de Silo: experiencias espirituales de reconciliación parental': 'Comentários à Mensagem de Silo: experiências espirituais de reconciliação parental',
  'Ascesis Conjunta': 'Ascese Conjunta',
  'Intercambio sobre El Camino': 'Intercâmbio sobre O Caminho',
  'Las espirales en los lugares sagrados de la Europa neolítica': 'Le spirali nei luoghi sacri dell Europa neolitica',
  'Los laberintos y el acceso a lo sagrado': 'I labirinti e l accesso al sacro',
  'El acceso a lo Profundo a través de la naturaleza': 'L accesso al Profondo attraverso la natura',
  'La vía devocional del sufismo en Irak (siglos VIII y IX)': 'La voie dévotionnelle du soufisme en Irak',
  'El propósito del Homo sapiens en el Paleolítico superior': 'Le Dessein d Homo sapiens au Paléolithique supérieur',
  'El agradecimiento como vía de Ascesis': 'Le remerciement comme voie d Ascèse',
  '4 vías de predisposición a la adivinación': '4 voies de prédisposition à la divination',
  'Reflexión y meditación sobre los Principios de la Acción Válida': 'Réflexion et méditation sur les Principes de l Action Valable',
  'Akenatón y Moisés: contacto con el Centro Luminoso y sus traducciones': 'Akhenaton et Moïse: contact avec le Centre Lumineux',
  'Sobre el tema del Ser': 'Sur le thème de l Être',
  'Investigación sobre la posibilidad de desplazarse en el Tiempo': 'Investigation sur la possibilité de voyager dans le temps',
  'Método de expresión corporal para el teatro y la danza': 'Méthode d expression corporelle pour le théâtre et la danse',
  'El Mensaje de María Magdalena': 'Le Message de Marie Madeleine',
  'La mística femenina en la región renano-flamenca': 'La mystique féminine dans la région rhéno-flamande',
  'Experiencia espiritual de la Bondad / La superación del sufrimiento': 'Expérience spirituelle de la Bonté',
  'Estudio de los procesos': 'Étude des processus',
  'Experiencia con la muerte y el agradecimiento': 'Expérience avec la mort et le remerciement',
  'La invención de la escritura': 'L invention de l écriture',
  'Dionisio o la búsqueda de la unidad interna / El canto de las mujeres': 'Dionysos ou la recherche de l unité intérieure',
  'Osiris, la más grande de las esperanzas': 'Osiris, le plus grand des espoirs',
  'El camino interior de Teresa del Niño Jesús': 'Le Chemin intérieur de Thérèse de l Enfant-Jésus',
  'Lo insignificante, el loco y el exaltado (viaje a Irán)': 'L insignifiant, le fou et l exalté',
  'Ligo: fiesta del solsticio de verano en Letonia': 'Ligo: fête du solstice d été en Lettonie',
  'El fuego y la especie humana: el primer encuentro': 'Il Fuoco e la Specie umana',
  'Antecedentes de la Disciplina Mental: la vía mental en Parménides': 'Antecedenti della Disciplina mentale: la via mentale in Parmenide',
  'Espiritualidad en Anatolia y la Media Luna Fértil (2ª parte)': 'Spiritualità in Anatolia e Mezzaluna Fertile',
  'El idiota y la espiral / Breve historia de la espiritualidad primitiva': 'L idiota e la spirale',
  'Las prácticas de incubación en la antigua Grecia': 'Le pratiche di incubazione nell antica Grecia',
  'Empédocles, el Sfero y los cuatro elementos': 'Empedocle, lo Sfero e i quattro elementi',
  'El Círculo y la Centralidad, símbolos del Amor equidistante y universal': 'Cerchio e Centralità, simboli dell Amore Equidistante',
  'El Universo casual': 'L Universo Casuale',
  'El "salvavidas" de las experiencias con El Mensaje de Silo en el fracaso de la ascesis': 'Il Salvagente delle esperienze con il Messaggio di Silo nel fallimento dell ascesi',
  'Comentarios al libro La Mirada Interna': 'Commenti al libro Lo sguardo interno',
  'La sombra de la diosa': 'L ombra della Dea',
  'La naturaleza como puerta de acceso a estados de conciencia inspirada': 'La Natura come porta d accesso a stati di coscienza ispirata',
  'Un café en el infierno': 'Un caffè all inferno',
  'Espacialidad y temporalidad en la pintura, escultura y arquitectura (1ª parte)': 'Spazialità e temporalità in pittura, scultura e architettura',
  'Introducción al Oficio de Perfumería': 'Introducción a la Perfumería: nuestro Oficio',
  'Intercambio sobre El Camino ': '',
}
def casa(titulo, autor, chave):
    t = toks(titulo); best, bi = 0, -1
    for i, (rt, ra, ro, ps) in enumerate(rep):
        if (chave not in ps and NOMES.get(chave) != ro) or not (sobren(autor) & sobren(ra)): continue
        if ALIAS.get(rt) and toks(ALIAS[rt]) <= t | toks(ALIAS[rt]) and len(toks(ALIAS[rt]) & t) / max(1, len(toks(ALIAS[rt]))) >= 0.6: return i
        r = toks(rt)
        if not t or not r: continue
        j = len(t & r) / min(len(t), len(r))
        if j > best: best, bi = j, i
    return bi if best >= 0.6 else -1
cat = {}; k = None; c = ''; a = ''
for ln in open(os.path.join(SITE, 'tools/producoes_catalogo.txt'), encoding='utf-8'):
    ln = ln.rstrip('\n').strip()
    if not ln or (ln.startswith('# ') and k is None): continue
    if ln.startswith('['): k = ln[1:-1]; cat[k] = []; continue
    if ln.startswith('# '): c = ln[2:]; continue
    if ln.startswith('@'): a = ln[1:]; continue
    cat[k].append([c, a, ln, casa(ln, a, k)])
usados = {i for v in cat.values() for x in v for i in [x[3]] if i >= 0}
saida = 'window.PR_PRODUCOES_CATALOGO = ' + json.dumps(cat, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(os.path.join(SITE, 'producoes-catalogo.js'), 'w', encoding='utf-8').write(
    '/* GERADO por tools/gerar_producoes_catalogo.py a partir de tools/producoes_catalogo.txt. Não edite à mão.\n'
    '   Cada item: [categoria, autor, título, índice em PR_PRODUCOES.repetidas ou -1] */\n' + saida)
print('total', sum(len(v) for v in cat.values()), {k: len(v) for k, v in cat.items()})
print('repetidas marcadas', len(usados), 'de', len(rep))
if '-v' in sys.argv:
    for i, r in enumerate(rep):
        if i not in usados: print('  sem par:', r[2], '|', r[0], '|', r[1])
