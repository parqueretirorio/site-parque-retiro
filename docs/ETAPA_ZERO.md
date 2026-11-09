# Conecta Retiro — ETAPA ZERO (diagnóstico e proposta)
Status: **diagnóstico concluído; nenhuma nova alteração será feita até a sua autorização expressa.**
Data: 10/10/2026. Complementa `docs/PLANO.md` (detalhes técnicos) e segue o "Complemento ao prompt em execução".

## 0. Declaração sobre o que já foi feito (transparência)
Antes de receber o complemento, implementei melhorias **numa cópia do site** (não publicada): camada de dados com auditoria/lixeira (`dados.js`), aba Backup e Segurança, importação CSV do inventário, cabeçalhos de segurança e o esquema de banco `supabase/`. **Nada foi publicado, nenhum dado real foi tocado** (o sistema não tinha dados reais; os testes usaram dados fictícios em navegador descartável e num PostgreSQL local descartável). Trate tudo isso como **proposta pendente de aprovação**: se preferir, basta não publicar o pacote e o site original permanece intacto.

## 1. Inventário da plataforma atual
- 37 páginas públicas estáticas (HTML/CSS/JS), sem servidor, sem build. Hospedagem não confirmada (há `_headers` de Netlify/Cloudflare e `.htaccess` de Apache).
- Área restrita: `area-restrita.html` + `area.js` (90 KB, acervo, contas, usuários, reservas, estela, álbum, Zoom), `inventario.js`, `documentos.js`, `comunicacao.js`, `financeiro.js`, `relatorios.js`.
- Dados: 26 coleções no `localStorage` (`pr_*`). Login: `sessionStorage`. Fotos/anexos: base64 dentro do `localStorage`.
- Integrações existentes: link da Comunidade WhatsApp (`chat.whatsapp.com`, botão flutuante em todas as páginas), links `mailto:` (lojinha, livraria), PIX por texto na página de doação, PDFs hospedados em `parqueretiro.org.br`. Nada mais.

## 2. Funcionalidades: existentes, demonstrativas e pendentes
| Situação | Itens |
|---|---|
| **Existe e funciona** (num único navegador) | Navegação e páginas públicas; login/cadastro com aprovação; níveis e funções; Biblioteca + empréstimos; Reservas de alojamento (por cama); Estela; Álbum com curadoria; Inventário com códigos permanentes e relatórios; Documentos e calendários; Comunicação e redes sociais (planejamento); Prestação de contas e orçamento; relatórios consolidados em CSV/impressão |
| **Demonstrativa / limitada** | **Todo o armazenamento e o login** (valem só para quem usa aquele navegador). Formulário de envio de fotos de `fotos.html` e qualquer cadastro feito por visitante: **grava no navegador do próprio visitante; a equipe não recebe.** Zoom: só agenda/registra links, não integra com o Zoom. WhatsApp: só um link. |
| **Não existe (pendente)** | Servidor central; app Android/iPhone; chats e grupos internos; Conexão Retiro (Wi-Fi); integração com WhatsApp além do link; sincronização e resolução de conflitos; tarefas/comissões como módulo próprio (há calendários e responsáveis por função, não equipes/tarefas); indicadores/painel; importação/exportação além de CSV de relatórios (a importação de inventário e o backup foram propostos nesta fase, ainda não aprovados) |

## 3. Diagnóstico: arquitetura, autenticação, armazenamento
1. **Armazenamento:** navegador. Risco máximo: limpar dados do navegador/trocar de computador = perda total; limite ~5 MB; cópias divergentes entre pessoas.
2. **Autenticação:** feita no próprio navegador; o hash da senha fica ao lado dos dados; "primeiro cadastro vira administrador" vale por navegador. **Não oferece segurança real.**
3. **Permissões:** aplicadas só pelo JavaScript (contornáveis).
4. **Dados pessoais** (nomes, empréstimos, pedidos, fotos de pessoas, Estela) já são tratados, sem base legal documentada.
5. **Ponto forte:** regras de negócio maduras e já escritas (códigos nunca reutilizados, conflito de camas, empréstimos, curadoria) — devem ser preservadas, não reescritas.

## 4. Estratégia de backup e recuperação
- **Agora (proposto, testado em ambiente de teste):** backup JSON íntegro (SHA-256) com restauração guiada que exige backup prévio e reverte em caso de falha; lixeira; auditoria. Rotina: semanal, guardado fora do computador.
- **Com servidor:** `pg_dump` diário automatizado + cópia dos arquivos; retenção 30 diários/12 mensais; **simulado de restauração trimestral num projeto vazio**. O plano gratuito de nuvem normalmente não inclui backups gerenciados, então o backup próprio é obrigatório.
- Critério: só se considera protegido depois de uma restauração real bem-sucedida e conferida.

## 5. Arquitetura integrada recomendada
**Não é necessário uma só base física para tudo**, conforme o complemento. Recomendação:
```
 Visitantes ─► Site público (estático, CDN) ─┐
 Integrantes ─► Área restrita (web/PWA) ─────┤
 Comissões   ─► App Android/iPhone ──────────┼─► API Supabase ─► PostgreSQL (dados + RLS + auditoria)
                                             │                └► Storage privado (fotos, documentos)
 Wi-Fi (portal cativo) ─► webhook/API ───────┤   Auth (identidade única)
 WhatsApp (wa.me / API Meta) ◄──────────────┘   Backups ─► cofre externo
```
- **Núcleo único (Supabase):** identidade, permissões, inventário, comissões, documentos, chats internos, auditoria — tudo o que precisa ser consistente entre site e app.
- **Módulos separados com troca limitada de dados:** Wi-Fi (o controlador de rede tem sua própria base de sessões; o sistema só cadastra/ativa/desativa convidados) e WhatsApp (conversas ficam na Meta; o sistema guarda apenas contatos e links).
- **App:** PWA primeiro (câmera, mesmas telas); Capacitor depois, se as lojas forem necessárias. Sem reescrita.
- **Identificadores:** UUID por registro; códigos legíveis (INV-0001) com restrição de unicidade no banco.
- **Exclusão:** lógica (arquivar); delete físico bloqueado. **Duplicidade:** chaves únicas + verificação na importação. **Conflitos:** versão por registro (edição concorrente é rejeitada com aviso); no app, fila offline com reconciliação por versão.

## 6. Mapa de módulos (atuais e propostos)
- Público: Início · Quem somos · O Parque (Elementos, Como Chegar, Atividades, Fotos) · Reservas (Como Fazer, Calendário) · Silo/Organismos · Centro de Estudo (Escola, Biblioteca, Produções, Livros/Áudios, Ofícios) · Ajude (Doação, Livraria, Lojinha, Rifa, Vaquinha) · Parques no Mundo · **A Comunidade/WhatsApp**.
- Restrito **atual**: Biblioteca (Gestão do Acervo · Livraria) · Zoom · Prestação de Contas · Responsáveis · Mapa de Contas, Documentação IP · Reservas · Estela · Álbum · Inventário · Documentos/Calendários · Comunicação/Redes · Relatórios.
- **Propostos:** Comissões e Tarefas · Chats e Grupos internos · Comunicados · Conexão Retiro (Wi-Fi) · Painel de indicadores · Backup e Segurança · Importação/Exportação.

## 7. Organograma geral
```
Conecta Retiro
├─ Público: Site ───────────────► Acolhimento (WhatsApp), Reservas (pedido), Doações (PIX)
├─ Área restrita (login)
│   ├─ Administração: usuários · permissões · auditoria · backup
│   ├─ Comissões/Equipes: responsáveis · tarefas · calendário · documentos
│   ├─ Operação: inventário · reservas · biblioteca · estela/álbum · finanças
│   ├─ Comunicação: comunicados · redes sociais · chats internos
│   └─ Indicadores
├─ App (Android/iPhone) = mesmas funções, foco em inventário e atividades (câmera)
├─ Conexão Retiro (Wi-Fi) ──► cadastro de convidados / acesso de integrantes
└─ WhatsApp: Canal · Comunidade · Grupos · Acolhimento e Orientação
```

## 8. Fluxos de informação e integração
1. **Visitante → reserva:** formulário público → servidor → aviso à Resp. de Reservas → aprovação com camas → confirmação por e-mail/WhatsApp (hoje o pedido não chega à equipe).
2. **Inventário (app):** fotografar → enviar ao armazenamento privado → registro com código → auditoria → relatório.
3. **Cadastro de integrante:** conta → pendente → administrador aprova nível/funções → acesso.
4. **Wi-Fi:** convidado cadastra no portal → sistema valida → libera no controlador por tempo limitado → expira.
5. **Backup:** diário automático → cofre externo → simulado de restauração.

## 9. Avaliação: chats internos × WhatsApp
- **Chat interno (próprio):** viável sobre Supabase (tabelas `grupos`, `participantes`, `mensagens`; tempo real nativo; permissões por RLS; arquivamento = marcar grupo; histórico preservado). Pode criar, administrar (dono/moderador), convidar só cadastrados aprovados. Esforço médio; **sem custo adicional além do plano**. Limitações: sem criptografia de ponta a ponta nem notificações push no navegador até o app/PWA estar configurado; requer política de moderação e retenção (LGPD).
- **WhatsApp:** continua como canal externo. Direto: links `wa.me`, Comunidade/Grupos criados manualmente pelos responsáveis. **Depende da Meta:** automação, envio em massa, integração com o sistema e gestão de grupos por código (API oficial Business: conta verificada, número dedicado, modelos aprovados, cobrança por conversa; recursos de grupos sujeitos a regras vigentes — verificar). Recomendação inicial: `wa.me` + atendimento humano.

## 10. Avaliação: Conexão Retiro (cadastro Wi-Fi)
- **Já existe:** nada (nem equipamento mapeado).
- **Depende de infraestrutura:** roteador/controlador com portal cativo e VLAN de convidados (ex.: UniFi, MikroTik Hotspot, OpenWrt+Nodogsplash/pfSense). Sem isso, o cadastro por software não controla o acesso.
- **Desenvolvimento:** página de cadastro (nome, celular/WhatsApp), validação (formato, duplicidade, confirmação por código por e-mail ou WhatsApp), integração com o controlador (API/RADIUS/voucher), expiração de sessão.
- **Atenção ao pedido de "senha":** para convidados, prefira **código temporário** em vez de senha escolhida (menos dados e menos risco); para integrantes, reutilizar o login da plataforma. Coletar o mínimo (LGPD), informar finalidade, definir prazo de guarda; consultar assessoria jurídica sobre guarda de registros de conexão (Marco Civil).
- Segurança: rede de convidados isolada da rede administrativa; WPA2/WPA3; limite de banda e de dispositivos.

## 11. Aplicativo, comissões, arquivos e sincronização
- Integrantes de comissões usam o app conforme a função: consultar, cadastrar, editar e fotografar (câmera) dentro do que as permissões da função permitirem (modelo já definido no esquema: `colecoes.funcao_escrita`).
- Arquivos: Storage privado, URL assinada de curta duração, limite de 10 MB por arquivo, redução de imagem no aparelho, tipo validado, hash registrado.
- Offline: fila local de cadastros/fotos, envio ao reconectar; conflito resolvido por versão (a edição mais antiga é recusada e apresentada para decisão).
- Publicação nas lojas: Google Play (taxa única ~US$ 25), Apple Developer (~US$ 99/ano; possível isenção para entidades sem fins lucrativos), política de privacidade pública, Mac/Xcode ou build em nuvem. Valores a confirmar.

## 12. Matriz de permissões e privacidade
| Módulo | Visitante | Leitor | Comentador | Editor | Responsável da função | Administrador |
|---|---|---|---|---|---|---|
| Site público | ler | ler | ler | ler | ler | tudo |
| Biblioteca / acervo | ler | ler | ler | editar acervo | — | tudo |
| Inventário | — | ler | ler | ler | **cadastrar/editar/baixar/importar** (Resp. Inventário) | tudo |
| Reservas | solicitar | ler | ler | ler | **aprovar/alocar** (Resp. Reservas) | tudo |
| Estela / Álbum | ver publicado | ler | ler | ler | **curadoria** | tudo |
| Documentos/Calendários | — | ler | ler | ler | **gerir** (Resp. Documentos) | tudo |
| Comunicação/Redes | — | ler | ler | ler | **gerir** (Resp. Comunicação) | tudo |
| Contas, orçamento, mapa de contas | — | — | — | — | — | **só administrador** |
| Chats internos | — | participar | participar | participar | criar grupo da comissão | criar/arquivar/moderar |
| Usuários, auditoria, backup | — | — | — | — | — | tudo |
| Wi-Fi (convidados) | cadastrar-se | — | — | — | Resp. de rede (a definir) | tudo |

**Privacidade (LGPD):** mapear dados e finalidades; base legal (consentimento para foto/Estela/Wi-Fi marketing; atividade institucional para reservas e acesso); encarregado; prazos e eliminação; canal do titular; consentimento de imagem para o Álbum; incidente (plano de resposta); contrato com operadores (Supabase, Meta). Dados sensíveis marcados e com leitura restrita. Aba "Mapa de Contas": não guardar senhas.

## 13. Riscos, dependências e o que ainda NÃO foi verificado
- Servidor real, login real, backup automático, restauração em servidor, upload pelo celular: **não testados** (dependem de conta e infraestrutura).
- Hospedagem atual e equipamentos de rede: **desconhecidos**.
- Preços e limites de Supabase, lojas e API do WhatsApp: **confirmar** (mudam).
- Risco de adoção: equipe voluntária precisa de rotina simples (backup, aprovação de usuários); recomenda-se um **responsável técnico** e treinamento curto.
- Risco legal: LGPD e Marco Civil requerem validação jurídica; não substituo advogado.
- Risco de dados locais: até o servidor existir, **qualquer cadastro feito hoje no navegador pode ser perdido** — não usar como registro oficial.

## 14. Plano incremental e testes (cada fase só começa com a sua autorização)
| Fase | Entrega | Critério de aprovação |
|---|---|---|
| 0 | Esta etapa | Você aprova o diagnóstico |
| 1 | Homologação: projeto de testes + esquema + login real | 3 perfis (admin, resp. inventário, leitor) passam nos testes de permissão |
| 2 | Dados no servidor + arquivos no Storage + migração | Contagens idênticas por coleção; 3 registros com foto conferidos |
| 3 | Backups automáticos | 7 dias seguidos + **restauração real conferida** |
| 4 | Reservas e envio de fotos do site público chegando à equipe | Pedido de teste chega, é aprovado e notifica |
| 5 | App (PWA) para inventário/comissões | Foto tirada no celular aparece em outro aparelho |
| 6 | Comissões/tarefas e chats internos | Criar, administrar, arquivar grupo; permissões respeitadas |
| 7 | WhatsApp (wa.me → API se aprovado) e Conexão Retiro | Teste em rede real com equipamento |
| 8 | Produção | Checklist LGPD, backup restaurado, treinamento, plano de reversão |

## Decisões que preciso de você
1. Aprova o diagnóstico e a fase 1? (criar projeto de **testes** no Supabase)
2. Onde o site está hospedado hoje?
3. Quem será o encarregado de dados e o responsável técnico?
4. Existe equipamento de Wi-Fi? Qual marca/modelo?
5. Aprova ou rejeita o pacote já produzido (cópia não publicada)?
