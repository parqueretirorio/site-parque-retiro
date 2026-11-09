# Produções de Escola

Página: `producoes-de-escola.html` · Funcionamento: `producoes.js` · Estilos: blocos "Produções de Escola" no fim de `style.css`
Dados: `producoes-dados.js` (Parques, links e produções repetidas) e `producoes-catalogo.js` (catálogo de cada Parque, GERADO)
Teste: `python3 tests/teste_producoes_escola.py`

## O que a página mostra

- **Menu flutuante "Escolha o Parque"**: "Produções repetidas" e os 18 Parques, cada um com o número de produções. No computador fica à direita e acompanha a rolagem. No celular abre pelo botão **Escolher Parque**, no canto de baixo à esquerda.
- **Ao escolher um Parque**: botões para as páginas de produções do Parque, todas as produções dele por categoria e por autor, com o selo colorido nas que aparecem também em outros Parques, e a lista "Produções de outros Parques publicadas aqui". O endereço guarda o Parque (ex.: `producoes-de-escola.html#parque=pdv`), bom para compartilhar.
- **Produções repetidas**: todas as produções que aparecem em 2 Parques ou mais. Selo: amarelo = 2, laranja = 3, vermelho claro = 4, vermelho = 5 ou mais.

## Como atualizar

1. Produções de um Parque: edite `tools/producoes_catalogo.txt` (`[chave]` abre o Parque, `# Categoria`, `@Autor`, depois um título por linha).
2. Repetidas e links dos Parques: edite `producoes-dados.js`.
3. Rode `python3 tools/gerar_producoes_catalogo.py` para gerar `producoes-catalogo.js`. Com `-v`, ele lista as repetidas que não encontrou no catálogo. Quando a mesma obra está em outro idioma, acrescente o par em `ALIAS` no gerador.

## Critério do levantamento (novembro de 2026)

- Cada produção aparece uma vez, no idioma original.
- Manantiales e Attigliano: além das próprias páginas, entraram produções desses Parques listadas em La Belle Idée e Aldama.
- Navas del Rey (só nomes de arquivos) e Chapadmalal (seção vazia): sem lista. A página mostra um aviso e os links.
