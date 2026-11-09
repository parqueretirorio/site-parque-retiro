# Biblioteca de Silo

Menu **Silo › Biblioteca de Silo** (`biblioteca-silo.html`). Também há um cartão na página Silo.

## Como está organizada

Do mesmo jeito que o Arquivo de Documentos de Silo (archivosilo.org), com o visual do site do Parque:

- **Seções:** Livros, Conferências, Apontamentos, Entrevistas, Reuniões, Seminários, Materiais, Experiências Guiadas e Outros autores (as mesmas colunas do Arquivo: Libros, Conferencias, Apuntes, Entrevistas, Reuniones, Seminarios, Materiales, Exp. Guía e Otros Autores).
- **Ordem cronológica** dentro de cada seção (dá para trocar para "mais recentes" ou "título A a Z").
- **Formatos** de cada documento: texto, áudio, vídeo e foto (ícones à direita).
- **Idiomas** em que o documento existe.
- **Busca** por título, título original, lugar, ano ou tema, sem precisar de acento. O termo encontrado aparece destacado.
- A pesquisa fica no endereço da página (ex.: `biblioteca-silo.html#secao=livros&q=leao`), para poder enviar a alguém.
- **Acervo completo:** caixa no fim da página com os números do Arquivo de Documentos de Silo e os links para ele e para silo.net.

## Acrescentar documentos

O catálogo fica em `biblioteca-silo-dados.js`. Cada documento é uma linha; o próprio arquivo explica os campos. Basta copiar uma linha do mesmo tipo e trocar título, data, seção, idiomas, formatos e link.

A primeira versão tem 41 documentos: as obras de Silo, conferências marcantes, alguns apontamentos, entrevistas, reuniões, seminários e materiais. O Arquivo de Documentos de Silo usa páginas antigas (com quadros) e não deixou copiar a lista completa automaticamente; por isso vários itens levam ao Arquivo para a busca, e os livros levam a silo.net.

## Arquivos

- `biblioteca-silo.html`, `biblioteca-silo.js`, `biblioteca-silo-dados.js`
- estilos no fim de `style.css` (bloco "Biblioteca de Silo")
- traduções dos textos fixos nas cinco tabelas de `i18n/`
- teste: `python3 tests/teste_biblioteca_silo.py`
