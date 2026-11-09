# Glossário e notas de tradução (para revisão da Comissão do Site)

Tradução feita por Claude (não é tradução automática do Google), sem revisão humana.
Fonte única: português nas páginas; tabelas em `i18n/es|it|fr|en|de.js`.
Para ajustar: editar `i18n/_trad_NN.txt` (id‖es‖it‖fr‖en‖de) e rodar `python3 tools/montar_traducoes.py`.
Não re-extrair as chaves (os ids ficam presos a `_ordem.json`).

## Mantidos em português (por decisão)
Nomes próprios: Parque Retiro, Instituto Pangeia, nomes dos demais Parques, EPT Maricá, Viação 1001, Asaas, PIX, CPF/CNPJ, ruas e linhas de ônibus (E15, E15A), nomes de pessoas.
Também: "Silo", "Mensagem de Silo" e "Blogger" no menu, "Escola" no menu, @parqueretirorio.

## Traduzidos, mas a revisar (termos doutrinários)
Escola (School/Escuela/Scuola/École/Schule), Ofícios (Trades), Nivelação (Leveling), Mestres (Masters), Profundo (the Profound), Experiências Guiadas (Guided Experiences), Humanismo Universalista (Universalist Humanism), Não-violência Ativa (Active Nonviolence), Comissão (Committee), Centro de Trabalho/Estudo (Work/Study Center), Comunicado (Newsletter), "pulcritude" (Neatness).

## Limites
- Título e meta description: só o que está na tabela.
- Conteúdo cadastrado dinamicamente (atividades, produtos) fica em português.
- Documentos e listas de produções (translate="no") ficam no idioma original.
- Área restrita e login: só português. `partido-humanista.html` e `eventos.html` sem seletor (modelo de página próprio).
