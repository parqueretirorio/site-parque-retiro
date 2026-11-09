# Contrato da API de dados (Passo 2: independente do provedor)

Qualquer servidor que cumpra este contrato serve ao site: PHP+MySQL (caminho 1), Supabase por função, Node etc. As telas não mudam; só `config-dados.js`.

## Como ligar
Em `config-dados.js`: `modo: 'remoto'` e `url: 'https://.../api'`. Em `modo: 'local'` (padrão) nada muda: os dados continuam no navegador.

## Rotas (JSON, `Authorization: Bearer <token>`)
| Método e rota | Corpo | Resposta |
|---|---|---|
| `GET /colecoes` | — | `200 {"colecoes": {"nome": {"versao": 3, "dados": ...}}}` — só o que o usuário pode ler |
| `PUT /colecoes/{nome}` | `{"versao_base": 3, "dados": ...}` | `200 {"versao": 4}`; **`409 {"versao_atual": 5, "dados": ...}`** se `versao_base` ≠ versão atual (nunca sobrescrever); `403` sem permissão de escrita; `401` sem login |
| `DELETE /colecoes/{nome}` | `{"versao_base": n}` | `200`, `404` ou `409` como acima (no servidor real: exclusão lógica, nunca física) |

`nome` = nome da coleção sem o prefixo `pr_` (ex.: `users`, `calend`). A coleção `meta` nunca vai ao servidor.

## Regras que o servidor deve cumprir
1. Versão começa em 0 (coleção inexistente) e sobe de 1 em 1 a cada gravação aceita.
2. Permissões **no servidor**, não no JavaScript (mesma matriz de `docs/ETAPA_ZERO.md` §12).
3. `audit` e `lixeira` são só-acréscimo; o cliente já mescla em caso de 409.
4. Auditoria de quem gravou e quando; backup diário fora do servidor.

## Comportamento do cliente (`adaptador-remoto.js`)
- Lê tudo ao abrir; grava em segundo plano (atraso 0,8 s). Sem internet: fica pendente e reenvia.
- Conflito: não sobrescreve; guarda a versão local e a do servidor e oferece `PR_DADOS.resolverConflito(nome, 'meu' | 'servidor')`.
- Estado: `PR_DADOS.estadoSync()`; esperar `PR_DADOS.pronto` antes de desenhar telas.

## Como testar uma implementação real
`tests/servidor_referencia.js` é o servidor de referência; `tests/teste_adaptador_remoto.js` roda 12 verificações (carga, gravação, conflito, auditoria, offline, permissão, remoção). A implementação em PHP deve passar nos mesmos cenários apontando `url` para ela.

## O que ainda NÃO está ligado
- As telas ainda não esperam `PR_DADOS.pronto` (necessário só no modo remoto).
- Login real (hoje o login é do navegador) e a API em PHP: próximo passo.
