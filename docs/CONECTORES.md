# Conectores de publicação (Facebook, Instagram, YouTube)

Módulo "Comunicação e Redes Sociais" do site do Parque Retiro. Código de servidor de **referência e SIMULADO**:
não faz chamada de rede por conta própria, não usa segredo real e **não conecta nenhuma conta**. Nenhuma conta está conectada.
Verificação das páginas oficiais: 16/10/2026.

Arquivos: `conectores/base.js` (núcleo), `facebook.js`, `instagram.js`, `youtube.js`, `index.js` (registro) e `tests/teste_conectores.js`.

## 1. Contrato comum

`criarConector({canal, adaptador, config, db, http, segredo, auditar, agora, dormir, contador})` devolve `publicar(post, conexao, opcoes)`
(o YouTube também tem `tornarPublico`). Ordem fixa:

1. **Regras de aprovação**: `conectorLiberado` de `com-regras.js` (o mesmo arquivo do navegador). Barra publicação não aprovada, versão
   diferente da aprovada, conector desligado e pausa geral. Também recusa post ou conexão de outro canal.
2. **Sem anúncios**: `opcoes.impulsionar`, `post.impulsionar` ou `post.orcamento` (diferente de vazio/falso/0) são recusados com
   "publicidade paga não é permitida".
3. **Validação do conteúdo** pelo adaptador (formato, mídia, janela de agendamento, permissões declaradas, limites, cota).
4. **Modo simulação é o padrão.** Só há chamada real se `config.ao_vivo === true` **e** conexão ligada **e** segredo obtido. Caso
   contrário devolve o pedido que SERIA feito, em dados (`pedido.passos[] = {metodo, caminho, corpo}`), sem token nem cabeçalhos.
5. Resultado: `{ok, simulado, motivo?, id?, url?, agendado?, pedido?}`. Erro previsto nunca lança; vira `{ok:false, motivo}` em português.

`auditar(evento)` recebe só `{canal, operacao, postId, resultado, simulado, motivo, confirmadoPor, quando}` (`resultado`: ok, simulado,
recusado ou erro). `http(url, {method, headers, body})` é injetado e tem a forma do `fetch`; o fetch global só é usado se nenhum `http` for dado.
`dormir(ms)` e `agora()` (texto ISO) também são injetáveis, para testar sem espera real.

Erros HTTP: 401 (credencial vencida/revogada), 403 (permissão), 429 (limite de uso) e 5xx (falha temporária) têm mensagem própria;
o corpo da resposta **não é repetido**. Se a API devolver outro erro, só o número HTTP aparece.

## 2. Capacidades (o que este código implementa)

| Canal | publica | agenda | mensagens | métricas |
|---|---|---|---|---|
| facebook | sim | sim (10 min a 30 dias) | não | não |
| instagram | sim | **não** (a API não agenda) | não | não |
| youtube | sim (sempre privado) | não | não | não |
| whatsapp, tiktok, linkedin, google | `{disponivel:false, motivo}`: sem conta/API nesta fase, **não implementados** | | | |

## 3. Endpoints, permissões e limites

### Facebook (Página) - https://developers.facebook.com/documentation/pages-api/posts
- Texto/link: `POST /{versao}/{page-id}/feed` (`message`, `link` opcional). Imagem: `/photos` (`url`, `caption`). Vídeo: `/videos`.
- Agendamento: `published=false` + `scheduled_publish_time` (UNIX, segundos), entre **10 minutos e 30 dias** à frente; fora disso, erro.
- Permissões esperadas: `pages_manage_posts`, `pages_read_engagement`, `pages_manage_engagement`, `pages_read_user_engagement`, mais `publish_video` para vídeo.
  A pessoa precisa poder `CREATE_CONTENT`, `MANAGE` e `MODERATE` na Página.
- O app **só atualiza posts que ele mesmo fez**.
- `config.versaoApi` é **obrigatória** (formato `vNN.N`); sem ela o conector recusa e pede para conferir a versão vigente na documentação.
  Não há versão padrão. (A página lida usa uma versão nos exemplos; ela não é adotada aqui.)

### Instagram (conta profissional ligada a Página) - https://developers.facebook.com/documentation/instagram-platform/content-publishing
- Passo 1: `POST /{versao}/{ig-id}/media` (`image_url` ou `video_url`, `caption`, `media_type` = `REELS`/`STORIES`/`VIDEO`; carrossel: itens com `is_carousel_item=true`
  e depois um contêiner `media_type=CAROUSEL` com `children`, **no máximo 10**). Passo 2: `POST /{ig-id}/media_publish` (`creation_id`).
- Status do contêiner: `GET /{container}?fields=status_code` (`IN_PROGRESS`, `FINISHED`, `ERROR`, `EXPIRED`, `PUBLISHED`), no máximo **1 vez por minuto, por até 5 minutos**.
- Só imagem **JPEG**; mídia em **URL pública https**; contêiner não publicado em **24 h expira**; **sem agendamento pela API** (o conector devolve a mensagem de orientação).
- Permissões: `instagram_business_content_publish` (Instagram Login) ou `instagram_content_publish` + `pages_read_engagement` (Facebook Login).
- Limite: consulta `GET /{ig-id}/content_publishing_limit` antes de publicar e recusa ao atingir `config.limite24h` (**padrão seguro 50**).
- Autorização de Publicação (PPA): se a Página exigir, a API bloqueia; o app não consegue saber de antemão. O conector traduz o erro (detecção pelo texto da mensagem; ver 4).

### YouTube - https://developers.google.com/youtube/v3/determine_quota_cost e https://developers.google.com/youtube/v3/docs/videos/insert
- Envio resumível: `POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status` (escopo `https://www.googleapis.com/auth/youtube.upload`);
  o endereço da sessão vem no cabeçalho `Location` e os bytes vão por `PUT`. Os bytes vêm de `opcoes.lerVideo(post)` (o conector não busca arquivos).
- **Regra central**: `status.privacyStatus` é sempre definido e sempre `private` no envio. Sem ele o YouTube publica como público, então omitir é proibido.
  Pedir outra privacidade no envio é recusado.
- `tornarPublico(post, conexao, {confirmadoPor, privacidade?})`: só se `conectorLiberado` estiver ok **e** `confirmadoPor` for informado; faz `videos.update` (`part=status`) para `public` (ou `unlisted`).
- Cota: `videos.insert` tem balde próprio de **100/dia (custo 1)**; as demais operações, **10.000 unidades/dia**; `videos.update` custa **50**. Contador injetável (`contador.usado/somar`); recusa ao esgotar.
- Shorts: a documentação lida não diz nada específico; **nenhuma regra foi inventada**.

## 4. NÃO CONFIRMADO (não verificado nas páginas lidas)
- **Limite do Instagram**: a página diz 100 publicações por API em 24 h (média móvel) e, na seção de carrossel, 50. Conflito sem conciliação: usamos 50 como padrão seguro e `limite24h` configurável.
- Formato exato da resposta de `content_publishing_limit` (o código lê `data[0].quota_usage`): vem de conhecimento prévio, não da página lida.
- Detecção de PPA: baseada no texto da mensagem de erro (`publishing authorization`/`PPA`); o código de erro não foi confirmado.
- Facebook: endpoint e parâmetros de **vídeo** (`/videos`, `file_url`, `description`) não aparecem na página de posts (ela remete à documentação de vídeo); `caption` de foto e agendamento de foto/vídeo também não foram confirmados.
- Instagram: número mínimo de itens de carrossel e tamanho máximo da legenda não foram confirmados; não há validação deles.
- YouTube: escopo exigido por `videos.update`, horário em que a cota diária zera e se `part=status` preserva os demais campos de `status` não foram confirmados. O contador usa a data de `agora()` (UTC).
- Facebook/Instagram: se a mídia por URL pública é aceita em todos os casos e as regras de URL "pública" (o código só rejeita localhost e redes privadas óbvias).
- Existência de carrossel só de vídeo, vídeos com `upload_type=resumable` e envio por `rupload.facebook.com` (página do Instagram) **não implementados**.

## 5. Segredos
- Só no **servidor**, em variável de ambiente. O código recebe a função `segredo(nome)` e a configuração guarda apenas o **nome** (`config.nomeSegredo`).
  Criar um conector com valor de token na configuração dá erro. O valor existe só numa variável local durante a operação e vai no cabeçalho `Authorization: Bearer`, nunca na URL.
- `ocultarSegredos(texto, valores)` troca o valor (e suas formas codificadas) e padrões comuns de credencial; é aplicada a todo resultado e a toda auditoria. Nada é registrado em log.
- Nada de chaves no navegador, no repositório ou nos testes (só o fictício `TOKEN-FALSO-123`).

## 6. Como rodar os testes
```
node tests/teste_conectores.js     # a partir da raiz do projeto; Node 22, sem dependências
```
O teste bloqueia o `fetch` global (prova que não há rede real), usa `http` falso, `dormir` falso e db falso. Sai com código diferente de 0 se algo falhar.

## 7. Checklist FUTURO para ligar um conector (hoje: nenhum)
1. **Autorização expressa do Instituto Pangeia**, por conta/canal.
2. Titular da conta = **o Instituto**; **duas pessoas administradoras** por canal.
3. Aplicativo de desenvolvedor **em nome do Instituto**.
4. Começar em **modo Desenvolvimento** (atende só quem tem papel no app); Live para outras pessoas exige App Review - https://developers.facebook.com/docs/development/build-and-test/app-modes
5. Segredos no servidor; conferir permissões, versão vigente da API (`versaoApi`) e a Autorização de Publicação (PPA) da Página.
6. Contador de cota e auditoria gravando em banco; testar primeiro com `ao_vivo` falso, depois com o YouTube sempre privado.

## 8. Nota de portabilidade
Esta é uma implementação de referência em **Node**. Se a hospedagem final for **PHP/MySQL** (GreenGeeks, plano ainda não confirmado), o contrato
(seção 1) e os pedidos HTTP precisam ser **portados**. Os pedidos estão descritos em dados (`{metodo, caminho, corpo}`), e `com-regras.js`
também precisa existir no servidor final (a regra de aprovação deve valer lá).
