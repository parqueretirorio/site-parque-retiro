# Passo 1 — O que a hospedagem permite (e qual caminho seguir)

Data: 12/10/2026.

## O que foi verificado
- Os servidores de nomes do domínio são `ns1.greengeeks.net` e `ns2.greengeeks.net`: a hospedagem é a **GreenGeeks** (informação do documento CLOUDIA de 12/10/2026).
- O `www.parqueretiro.org.br` roda WordPress + Elementor, que exigem PHP e MySQL. Os planos compartilhados da GreenGeeks usam cPanel, Apache, SSL grátis, backups diários, PHP 8, MySQL/MariaDB e SFTP.
- Os endereços `ns1`/`ns2` servem só para o domínio ser encontrado (DNS). **Não são** o endereço para enviar arquivos. O FileZilla continua com a configuração que já funciona hoje; não mexer.
- Ainda não confirmado: se o plano contratado permite criar bancos MySQL (cPanel, ícone "MySQL Databases"). Só importa quando o servidor for ligado.

## Decisão: caminho 1 (PHP + MySQL na hospedagem atual)
É o caminho que o plano de 10/10 chamava de "mais barato": nenhuma conta nova, nenhum custo mensal, e o Supabase deixa de ser necessário.

| Caminho | Custo | Situação |
|---|---|---|
| **1. PHP + MySQL na hospedagem atual** | R$ 0 extra | **Recomendado**. Compatível com o que já existe. |
| 2. Supabase grátis + "despertador" semanal | R$ 0 | Reserva, se o plano não permitir o caminho 1. |
| 3. Supabase Pro | US$ 25/mês | Só se a instituição quiser e puder pagar. |

## Confirmar no painel da hospedagem (só quando o servidor for ligar; a instituição decide, o suporte 24 h da GreenGeeks pode ajudar)
1. Versão do PHP: 8.1 ou superior. (WordPress recente já exige.)
2. Se o plano permite **criar um segundo banco MySQL** (ou um usuário só para o Conecta). Não usar o banco do WordPress.
3. Se há **backup automático** do plano (e por quantos dias). O backup JSON do sistema continua sendo obrigatório.
4. Se há **HTTPS** (certificado) no domínio. Obrigatório para login.
5. Onde o Conecta ficará: **subpasta** (`parqueretiro.org.br/conecta/`) ou **subdomínio** (`conecta.parqueretiro.org.br`). O subdomínio é mais seguro por não misturar com os arquivos do WordPress.
6. Se o acesso é por cPanel/FTP/SSH (muda só o jeito de enviar os arquivos).

## Cuidados específicos
- O `.htaccess` do pacote é para Apache: **não sobrescrever o `.htaccess` do WordPress**. Se for em subpasta, o do Conecta fica dentro dela.
- O arquivo `_headers` (Netlify/Cloudflare) é ignorado em Apache. Pode ficar; não faz mal.
- Senhas do banco ficam em um arquivo de configuração PHP **fora da pasta pública** ou protegido, nunca no JavaScript. `config-dados.js` é público e só leva a URL da API.
- Dados pessoais (nomes, reservas): login real, HTTPS e backup fora do servidor, em qualquer caminho.

## Ressalva honesta
Segurança e manutenção do PHP ficam com a instituição (não é serviço gerenciado). Por isso: login com senha em hash forte, atualização do PHP pelo plano, e restauração testada a cada trimestre (ver `docs/RESTAURACAO.md`).

## Segurança no Apache (já resolvido)
O `.htaccess` do pacote já traz os mesmos cabeçalhos de segurança do `_headers` (que a GreenGeeks ignora). Nada a migrar.

## Rotina de trabalho combinada (mantida)
Você ajusta, recebe os arquivos prontos e sobe pelo FileZilla. Nenhum teste técnico no cPanel. O modo atual do site (`config-dados.js`, `modo: 'local'`) segue valendo até o site ser aprovado pela comissão; a passagem de bastão continua pelo backup em JSON (`docs/PASSAGEM_DE_BASTAO.md`).
