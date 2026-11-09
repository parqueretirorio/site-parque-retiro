# Conecta Retiro — Análise e Plano de Preparação

Data da análise: 10/10/2026. Base: site `parque-retiro-site` (37 páginas HTML, 6 módulos JS, sem servidor).

## 1. Arquitetura existente e o que realmente funciona

| Parte | Situação real |
|---|---|
| Site público (37 páginas estáticas) | Funciona. HTML/CSS/JS puro, sem build. Pode ficar como está. |
| Área restrita (`area-restrita.html`) | Funciona, com 13 abas: Biblioteca (com Gestão do Acervo e Livraria), Zoom, Prestação de Contas, Gestão de Responsáveis, Mapa de Contas, Documentação IP, Reservas, Estela, Álbum, Inventário, Documentos e Calendários, Comunicação, Relatórios. |
| **Armazenamento** | **Tudo fica no `localStorage` do navegador** (26 coleções, chaves `pr_*`). Fotos e anexos são gravados como texto base64 dentro dele. |
| **Login e permissões** | **Feitos só no navegador** (senha com SHA-256 + sal, guardada junto com os dados). Níveis: leitor, comentador, editor, administrador + 6 funções de responsável. |
| Backup / restauração | Não existia. Só havia exportação em CSV de relatórios, que não restaura nada. |
| Importação | Não existia. |
| WhatsApp | Botão flutuante com link para a Comunidade (`chat.whatsapp.com`). Nada além disso. |
| Wi-Fi, app | Não existem. |

### Consequências diretas (o que isso significa na prática)
1. **Cada computador/navegador tem sua própria cópia dos dados.** Cadastro feito no computador da secretaria não aparece no do inventário nem no celular. O próprio site avisa isso na tela de login.
2. **O login não protege nada.** Os dados e as senhas estão no próprio navegador; quem abre o site num navegador novo vê um sistema vazio e o "primeiro cadastro vira administrador". Serve de organização pessoal, não de segurança.
3. **Limite de ~5 MB por navegador.** Fotos de inventário e documentos vão esgotar isso rapidamente. Limpar os dados do navegador apaga tudo.
4. **Aplicativo Android/iPhone e Wi-Fi/WhatsApp integrados exigem um servidor central.** Sem ele não há "mesma base de dados".

Conclusão: o site é um bom protótipo funcional (regras de negócio já escritas: códigos permanentes, empréstimos, reservas por cama, relatórios). Falta a camada de servidor. **As regras e telas devem ser mantidas; troca-se o lugar onde os dados moram.**

## 2. Manter, corrigir, desenvolver

- **Manter:** site público, todos os módulos da área restrita, regras de inventário (códigos nunca reutilizados), reservas, relatórios.
- **Corrigir (feito nesta etapa):** auditoria, lixeira, backup/restauração verificáveis, importação de inventário com pré-visualização, cabeçalhos de segurança.
- **Desenvolver (precisa de servidor):** login real, dados compartilhados, arquivos em armazenamento próprio, backups automáticos, app, integrações.

## 3. Banco de dados e arquivos — recomendação

**Supabase** (PostgreSQL + login + armazenamento de arquivos + permissões por linha), pelos motivos:
- Um único serviço cobre banco, autenticação, arquivos e API; o site estático continua estático e o app usa os mesmos serviços.
- Banco aberto (PostgreSQL): dá para exportar tudo e sair a qualquer momento — evita dependência.
- Camada gratuita costuma bastar para o volume de uma instituição pequena; **confirme os limites e preços atuais no site do Supabase antes de decidir** (mudam). Atenção: no plano gratuito não há backups automáticos gerenciados e projetos sem uso podem ser pausados — por isso o plano de backup abaixo não depende do provedor.
- Alternativa se a instituição preferir tudo em hospedagem própria: PostgreSQL + MinIO em um VPS pequeno (mais barato em escala, mais trabalho de administração). Não recomendada para equipe voluntária.

Esquema pronto em `supabase/migrations/0001_base.sql` (testado, veja seção 7): perfis e permissões, coleções, registros com versão e exclusão lógica, códigos de inventário únicos no banco, anexos (só metadados; o arquivo vai para o Storage), auditoria imutável. Estrutura híbrida: as 26 coleções atuais viram linhas em `registros` (migração 1:1, sem perda); módulos que precisarem de consultas complexas (inventário, reservas) são normalizados depois, um de cada vez.

## 4. Segurança, backups, permissões, auditoria

| Item | Agora (navegador) | Fase 2 (servidor) |
|---|---|---|
| Autenticação | Local, não segura | Supabase Auth (senha com hash forte, recuperação por e-mail, opção de 2FA) |
| Permissões | Regras no JS | Regras **no banco** (RLS): impossível burlar pelo navegador. Mapeadas em `colecoes`. Ninguém sobe de nível sozinho. |
| Auditoria | ✅ `pr_audit` (quem/quando/o que mudou, últimas 2000) | Tabela `auditoria` imutável, por gatilho |
| Exclusão | ✅ Lixeira local (300 últimos removidos) | Exclusão lógica; delete físico bloqueado |
| Backup | ✅ Backup JSON completo com verificação SHA-256, aba **Backup e Segurança** | `pg_dump` diário automático (GitHub Actions) + cópia dos arquivos, retenção 30 diários/12 mensais |
| Restauração | ✅ Pré-visualização, valida integridade, **obriga baixar backup do estado atual antes**, reverte se falhar no meio | Procedimento em `docs/RESTAURACAO.md`, com simulado trimestral |
| LGPD | Mapa abaixo | Idem + acordo de operador com o provedor |
| Segredos | Nenhum no código | Só a chave pública (anon) no site; chave de serviço nunca no código — fica em segredos do GitHub/servidor |
| Atualizações não apagam dados | ✅ Nenhuma migração faz DROP/TRUNCATE; só `create if not exists` | Migrações versionadas e reexecutáveis (testado) |

**LGPD — pontos a decidir:** dados pessoais tratados: nome/e-mail de usuários, pedidos de reserva, empréstimos (quem retirou), fotos do Álbum (imagem de pessoas → exigir autorização), Estela (nomes). Definir: base legal por finalidade (consentimento para fotos/Estela; execução de atividade institucional para reservas), responsável/encarregado, prazo de guarda e rotina de eliminação, canal do titular. As coleções `contas`, `orcamento`, `mapa`, `emprest`, `pedidos`, `inv_emp` já estão marcadas como sensíveis (leitura restrita). **Recomendação importante:** a aba "Mapa de Contas" não deve guardar senhas de contas externas; use um gerenciador de senhas.

## 5. Integração site ↔ app ↔ WhatsApp ↔ Wi-Fi

**App Android/iPhone — recomendado: PWA primeiro, depois Capacitor.**
1. *PWA* (instalável pelo navegador, câmera funciona): custo zero, mesma base de código, serve para começar a fotografar o inventário.
2. *Capacitor* empacota o mesmo site em app nativo para as lojas, sem reescrever. Só vale quando houver necessidade (notificações, presença nas lojas).
3. Evitar reescrever em React Native/Flutter: duplicaria as regras de negócio que já existem em JS.

Requisitos para publicar: conta Google Play (taxa única, ~US$ 25), Apple Developer Program (anual, ~US$ 99; entidades sem fins lucrativos podem pedir isenção), ícones/capturas de tela/política de privacidade publicada, **Mac com Xcode ou serviço de build em nuvem** para o iOS, e passar na revisão das lojas. Confirme valores atuais.

**WhatsApp**
- Direto, sem custo: links `wa.me` (conversa pré-preenchida, ex.: acolhimento, reservas) e link da Comunidade — já existe um; dá para criar um por tema.
- Depende de terceiros: respostas automáticas, envio em massa e integração com o sistema exigem a **API oficial (WhatsApp Business Platform / Meta)**: conta Meta Business verificada, número dedicado, modelos de mensagem aprovados, cobrança por conversa. Gestão automática de membros de grupos/comunidades tem restrições da Meta — **verificar disponibilidade antes de prometer**. Para o porte do Parque, comece com `wa.me` + atendimento humano.

**Wi-Fi seguro**
- Depende de equipamento: roteador/ponto de acesso com portal cativo e redes separadas (convidados × administração) — ex.: UniFi, MikroTik, OpenWrt/pfSense. Sem isso, não há como controlar acesso por software.
- Integração possível depois do servidor: cadastro de convidado (nome + aceite de termos) gera senha/voucher temporário via API do controlador; acesso dos moradores ligado ao perfil aprovado.
- Questão legal: guarda de registros de conexão (Marco Civil da Internet) — consultar assessoria jurídica sobre a obrigação para a instituição.

## 6. Dependências, custos previsíveis, limitações

- Banco/Storage: gratuito no início; plano pago do Supabase (backups gerenciados, sem pausa) é o primeiro custo provável quando houver muitas fotos.
- Domínio e hospedagem do site: já existentes (a confirmar onde estão — há arquivos para Netlify/Cloudflare **e** Apache).
- Lojas de aplicativos: valores da seção 5.
- WhatsApp API e equipamentos de Wi-Fi: só se decidirem ir além dos links.
- **Limitação desta sessão:** não tenho acesso à sua conta do Supabase, hospedagem, lojas ou equipamentos. Por isso a Fase 2 foi preparada e testada em PostgreSQL local, mas **não foi ligada** a um servidor real.

## 7. Plano de testes e critérios de aprovação para entrada em operação

Já executados (resultado em `tests/`):
- ✅ Auditoria registra inclusão/alteração/remoção; removidos vão para a lixeira.
- ✅ Backup completo → alterar dados → restaurar: dados voltam idênticos; backup adulterado é recusado; restaurar sem backup prévio é recusado.
- ✅ Importação CSV: pré-visualização, duplicados (contra itens existentes e dentro da planilha) ignorados, erros listados, nenhum item/foto existente alterado, códigos permanentes únicos, reimportar o mesmo arquivo não duplica, texto com fórmula (`=cmd…`) é neutralizado na exportação.
- ✅ Esquema do banco executado 2× sem erro (idempotente) em PostgreSQL 16; permissões: usuário não se promove, responsável de inventário só grava em inventário, leitor só lê, conta sem permissão não vê dados sensíveis, conflito de edição detectado, delete físico bloqueado, código de inventário duplicado/mal formado rejeitado, auditoria só admin lê e ninguém altera.

**Ainda NÃO verificado (precisam de ambiente real) — critérios para entrar em operação:**
1. Projeto Supabase criado, migração aplicada, login funcionando no site, **3 perfis testados com dados fictícios** num projeto de homologação separado.
2. Migração dos dados do navegador atual para o servidor, com conferência de contagem por coleção.
3. Backup automático rodando 7 dias seguidos **e uma restauração real num projeto vazio, conferida** (arquivos e banco).
4. Upload de foto pelo celular (câmera) e leitura em outro aparelho.
5. Revisão LGPD preenchida (seção 4).
