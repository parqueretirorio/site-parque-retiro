# Fase 1 — Login real e dados da área restrita no Supabase

## O que entrou
- `supabase/migrations/0010_login_e_colecoes.sql`: perfis com WhatsApp e LGPD; perfil criado sozinho no cadastro (leitor/pendente);
  funções `pr_ler_colecoes`, `pr_gravar_colecao`, `pr_excluir_colecao` (cada coleção = 1 linha em `registros`, com versão);
  auditoria leve (sem copiar fotos). Só cadastros **aprovados** leem e gravam; `mapa` só o administrador.
- `adaptador-supabase.js`: login, criar conta, esqueci minha senha, nova senha pelo link do e-mail e sair (Supabase Auth);
  armazenamento com a mesma interface do navegador (as telas não mudaram); `users` = tabela `perfis`.
- `area.js`: tela de login do servidor; indicador "Tudo salvo no servidor / Salvando / Sem conexão"; escolha em caso de conflito;
  em Gestão de Responsáveis, sem formulário de senha (cada pessoa cria a própria conta e o administrador aprova).

## Como ligar
1. Rodar a migração 0010 no SQL Editor do Supabase (uma vez; pode repetir sem problema).
2. Testar só no seu navegador: `login.html?servidor=1` (volta com `login.html?servidor=0`).
3. Levar os dados do navegador para o servidor: no modo do navegador, **Backup e Segurança › Baixar backup**;
   depois, no modo servidor (como administrador), **Restaurar** esse arquivo. As pessoas (users) não vêm do backup: são os perfis do login.
4. Para todos: em `config-dados.js`, `modo: 'supabase'`.

## Limites desta fase
- As páginas públicas continuam como estão (não leem o servidor).
- Regras finas por coleção (ex.: só o Responsável pelo Inventário grava o inventário) continuam nas telas, como hoje;
  no servidor a regra é "aprovado". Serão apertadas coleção por coleção numa fase seguinte.
- E-mails do login saem no modelo padrão do Supabase (em inglês) até ligar o SMTP próprio.
- Tudo é carregado ao abrir a área restrita; com muitas fotos, a abertura fica mais lenta (fotos vão para o Storage depois).

## Teste
`python3 tests/teste_supabase_fase1.py` — roda contra o PostgreSQL local com as mesmas migrações (31 verificações:
login, pendente, aprovação, funções, leitor não se promove, mapa só do administrador, conflito sem sobrescrever,
cadastro com WhatsApp/LGPD, esqueci minha senha, nova senha, sair, páginas públicas no navegador).
