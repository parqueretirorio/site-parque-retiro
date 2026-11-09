# Voluntário e Jardinagem / Área Externa

## Página pública: Ajude o Parque > Voluntário (`voluntario.html`)
Mais uma forma de ajuda, para quem **não tem condições de contribuir com dinheiro** e quer cooperar com tempo e trabalho.
A pessoa informa nome completo, celular/WhatsApp, e-mail (opcional), cidade, **como quer colaborar** (jardinagem e área externa, reflorestamento,
limpeza e manutenção, encontros e atividades, outra forma), quando pode ajudar e dá o consentimento para contato (LGPD). Nada é cobrado.
Aparece no menu "Ajude o Parque" de todas as páginas e como cartão em `ajude-o-parque.html`. Tem espaço próprio para banner (slug `voluntario`).

## Área restrita > Comissões Parque Retiro > grupo **Voluntário**
O grupo reúne duas abas (cada uma com a sua responsabilidade, concedida em *Gestão de Responsáveis*; o administrador vê tudo):

| Aba | Responsabilidade | O que faz |
|---|---|---|
| **Voluntários inscritos** | Responsável pelos Voluntários (`voluntario`) | Lista as inscrições, filtra por situação/forma de colaborar, muda a situação (Novo, Em contato, Ativo, Sem retorno), anotações, CSV, exclusão |
| **Jardinagem / Área Externa** | Responsável pela Jardinagem / Área Externa (`jardinagem`) | Planejamento de jardinagem, planejamento de reflorestamento, documentos e resumo |

### Jardinagem / Área Externa
- **Planejamento de jardinagem** e **de reflorestamento**: título, local, período, situação (Planejado, Em andamento, Concluído, Adiado), responsável, voluntários necessários, materiais, descrição; no reflorestamento também espécies e quantidade de mudas. Filtro por situação.
- **Documentos**: título, categoria, data, descrição, **link** (ex.: Drive) e/ou arquivo PDF/imagem de até 1 MB.
- **Resumo**: contagem por situação, mudas planejadas e de planos concluídos, voluntários necessários, próximas ações; CSV e impressão.
- Quem não é responsável (nem administrador) só consulta.
- Relatórios Consolidados > Relatórios por módulo ganhou "Jardinagem / Área Externa" e "Voluntários inscritos".

## Dados e servidor
Coleções: `voluntarios` (sensível: dados pessoais), `jard_planos`, `jard_docs`. Migração: `supabase/migrations/0005_voluntario_jardinagem.sql`
(cria as funções `voluntario` e `jardinagem`; **não aplicada a um projeto real**).
**Atenção:** em modo local, a inscrição de um visitante fica só no navegador dele e não chega à tela da Comissão. Para valer de verdade é preciso uma
rota pública no servidor que receba a inscrição sem login, como já ocorre com Rifa e Vaquinha.
Teste: `python3 tests/teste_voluntario_jardinagem.py`.
