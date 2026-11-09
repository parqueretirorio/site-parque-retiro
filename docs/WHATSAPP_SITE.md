# WhatsApp do Parque Retiro no site

Implementa a proposta "WhatsApp do Parque Retiro" (reunião Conecta Retiro): o Canal ganha destaque, a Comunidade fica discreta e os links dos grupos não aparecem no site.

## Onde está cada coisa

| Lugar | O que aparece |
| --- | --- |
| Página inicial | Bloco "Fique por dentro do Parque Retiro" com o botão **Seguir o Canal**, e um cartão do Canal junto das redes sociais |
| Atividades | Chamada "Receba os avisos pelo Canal" |
| Rodapé de todas as páginas | Ícone do Canal ao lado de Facebook, Instagram, YouTube e Blogger |
| Voluntário | Convite "Faça parte da Comunidade do Parque Retiro" com o botão **Entrar na Comunidade** |
| Quem somos > Opinião e Participação | Leva ao convite da Comunidade em Voluntário |
| Quem somos > Como Apoiar e Como fazer > dúvidas sobre reservas | WhatsApp oficial (contato) |
| Botão flutuante | Continua só para contato com o número oficial |

O antigo link de grupo (`chat.whatsapp.com/BuHW...`) saiu do site.

## Trocar um link

Os links ficam num lugar só, em `script.js`:

```js
window.PR_WHATSAPP = {
    numero: '552128881830',
    mensagem: 'Olá! Vim pelo site do Parque Retiro.',
    canal: 'https://whatsapp.com/channel/...',
    comunidade: 'https://chat.whatsapp.com/...'
};
```

Todo link com `data-wz="canal"`, `data-wz="comunidade"` ou `data-wz="contato"` passa a usar o endereço daqui. Se a Comunidade tiver o link redefinido, basta trocar `comunidade` em `script.js`. Só são aceitos endereços do próprio WhatsApp. (O HTML também traz o link escrito, para funcionar mesmo sem JavaScript; ao trocar o link, vale atualizar também o HTML de `index.html`, `atividades.html`, `voluntario.html` e o rodapé.)

## Idiomas

Os textos novos estão traduzidos nas cinco tabelas (`i18n/es.js`, `it.js`, `fr.js`, `en.js`, `de.js`).

## Teste

`python3 tests/teste_whatsapp_site.py`
