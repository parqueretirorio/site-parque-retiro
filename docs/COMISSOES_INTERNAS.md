# Comissões internas: Construção, Manutenção e Traduções

Área restrita > **Comissões Parque Retiro** > **Construção**, **Manutenção** e **Traduções**.

Estas três comissões existem **só na área restrita**. Elas não têm página pública, não aparecem no menu do site, na página Comissões nem no formulário de Voluntário.

## Quem vê e quem edita

Cada comissão tem uma responsabilidade própria em **Gestão de Responsáveis**:

| Comissão | Responsabilidade | Coleções |
| --- | --- | --- |
| Construção | `construcao` (Responsável pela Construção) | `constr_itens`, `constr_docs` |
| Manutenção | `manutencao` (Responsável pela Manutenção) | `manut_itens`, `manut_docs` |
| Traduções | `traducoes` (Responsável pelas Traduções) | `trad_itens`, `trad_docs` |

A ferramenta aparece para quem tem a responsabilidade e para o administrador, igual à Jardinagem / Área Externa e ao Multiuso.

## O que cada comissão tem

Três sub-abas: a lista de trabalhos, **Documentos** e **Resumo**.

- **Construção > Obras e etapas:** título, local, início e fim previstos, situação (Planejado, Em andamento, Concluído, Adiado), responsável, custo estimado, voluntários necessários, materiais e descrição.
- **Manutenção > Pedidos de manutenção:** título, local, data do pedido, prazo, situação (Aberto, Em andamento, Concluído, Adiado), responsável, tipo (corretiva ou preventiva), prioridade (Baixa, Média, Alta, Urgente), custo estimado, peças e descrição.
- **Traduções > Traduções:** título, data do pedido, prazo, situação (A fazer, Em tradução, Em revisão, Concluído), tradutor(a), idioma de origem e de destino, revisor(a), link do material e descrição.
- **Documentos:** link e/ou arquivo pequeno (PDF ou imagem, até 1 MB), com categoria própria de cada comissão.
- **Resumo:** contagem por situação, itens em aberto, prazos vencidos, prioridade alta ou urgente (Manutenção), custo estimado (Construção e Manutenção), próximos prazos, impressão e CSV.

Os três também aparecem em **Relatórios Consolidados** para quem tem acesso.

## Arquivos

- `comissoes-internas.js`: o módulo (uma configuração por comissão).
- `area.js`: responsabilidades (`FUNC`), abas e área (`AREA_DE`).
- `relatorios.js`: relatórios das três comissões.
- `supabase/migrations/0009_comissoes_internas.sql`: responsabilidades e coleções no servidor.
- `tests/teste_comissoes_internas.py`: teste.

## Outra mudança nesta versão

A ferramenta **Reservas de Alojamento** passou a se chamar **Alojamento** na área restrita (por um tempo foi "Apenas Alojamento"). Só o nome mudou: o identificador interno (`reservas`), os dados e a linha "Reservas de Alojamentos" da Prestação de Contas continuam iguais, para não quebrar lançamentos já feitos.
