// Teste dos conectores de publicação (simulados, sem rede). Rodar: node tests/teste_conectores.js
const assert = require('assert'); const R = require('../com-regras.js');
const { criarRegistro, criarConector, ocultarSegredos, criarContadorMemoria } = require('../conectores/index.js');
const saida = console.log.bind(console);
let n = 0; const ok = (c, m) => { assert(c, m); n++; saida('OK  ' + m); };

// Guard: qualquer uso do fetch global (rede real) derruba o teste.
let usosFetch = 0; globalThis.fetch = () => { usosFetch++; throw new Error('REDE REAL BLOQUEADA no teste'); };
// Captura de logs: o token fictício nunca pode aparecer neles.
const logs = []; ['log', 'info', 'warn', 'error', 'debug'].forEach(k => { console[k] = (...a) => logs.push(a.map(String).join(' ')); });

const TOKEN = 'TOKEN-FALSO-123';
const mkdb = (o = {}) => ({ get: (k, d) => (k in o ? JSON.parse(JSON.stringify(o[k])) : d) });
const AGORA = '2026-10-18T12:00:00.000Z', T0 = Date.parse(AGORA);
const agora = () => AGORA;
const mais = ms => new Date(T0 + ms).toISOString();
const MIN = 60000, DIA = 86400000;
const lig = canal => ({ canal, estado: 'ligado' });

// http falso: registra chamadas; o roteador devolve {status, json, headers}.
function criarHttp(rota) {
  const chamadas = [];
  const f = async (url, init) => {
    const c = { url, metodo: init.method, cab: init.headers || {}, corpo: init.body }; chamadas.push(c);
    const r = Object.assign({ status: 200, json: { id: 'ID-' + chamadas.length }, headers: {} }, rota ? rota(c, chamadas.length) : {});
    return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => r.json, headers: { get: k => r.headers[k.toLowerCase()] } };
  };
  f.chamadas = chamadas; return f;
}
const aprovado = (extra = {}) => { const p = Object.assign({ id: 'p1', rede: 'facebook', tipo: 'Post de texto', tema: 'Convite', texto: 'Venha ao Parque', status: 'Aprovada' }, extra); p.aprovadoVersao = R.impressao(p); return p; };
const eventos = [];
function montar(opc = {}) {
  const http = opc.http || criarHttp(), dormiu = [];
  const reg = criarRegistro({
    db: opc.db || mkdb(), http, agora, dormir: async ms => { dormiu.push(ms); }, auditar: e => eventos.push(e), contador: opc.contador,
    segredo: nome => { assert.strictEqual(nome, 'VAR_TOKEN'); return opc.semSegredo ? undefined : TOKEN; },
    config: {
      facebook: Object.assign({ versaoApi: 'v0.0', pageId: 'PAGE123', nomeSegredo: 'VAR_TOKEN', permissoes: ['pages_manage_posts', 'pages_read_engagement', 'publish_video'], ao_vivo: !!opc.vivo }, opc.fb),
      instagram: Object.assign({ versaoApi: 'v0.0', igId: 'IG123', nomeSegredo: 'VAR_TOKEN', permissoes: ['instagram_content_publish', 'pages_read_engagement'], ao_vivo: !!opc.vivo }, opc.ig),
      youtube: Object.assign({ nomeSegredo: 'VAR_TOKEN', ao_vivo: !!opc.vivo }, opc.yt)
    }
  });
  return { reg, http, dormiu };
}
const fb = (m, p, op) => m.reg.obter('facebook').publicar(p, lig('facebook'), op);

(async () => {
  // ---- barras das regras de aprovação (mesmo com ao_vivo ligado, nada chega à rede)
  { const m = montar({ vivo: true }), c = m.reg.obter('facebook');
    let r = await c.publicar(aprovado({ status: 'Em produção' }), lig('facebook'));
    ok(!r.ok && /não está aprovada/.test(r.motivo), 'publicação não aprovada é barrada');
    const p = aprovado(); p.texto += '!';
    r = await c.publicar(p, lig('facebook'));
    ok(!r.ok && /versão aprovada/.test(r.motivo), 'versão diferente da aprovada é barrada');
    r = await c.publicar(aprovado(), { canal: 'facebook', estado: 'desligado' });
    ok(!r.ok && /desligado/.test(r.motivo), 'conector desligado não publica');
    r = await montar({ vivo: true, db: mkdb({ com_config: { pausaGeral: true } }) }).reg.obter('facebook').publicar(aprovado(), lig('facebook'));
    ok(!r.ok && /pausada/.test(r.motivo), 'pausa geral barra a publicação');
    r = await c.publicar(aprovado(), lig('instagram'));
    ok(!r.ok && /conexão informada é do canal/.test(r.motivo), 'conexão de outro canal é recusada');
    ok(m.http.chamadas.length === 0, 'barrada pelas regras: nenhuma chamada http');
    ok(eventos.some(e => e.resultado === 'recusado' && e.canal === 'facebook' && e.postId === 'p1' && e.quando === AGORA), 'auditoria registra a recusa (canal, post, resultado, quando)');
  }
  // ---- modo simulação
  { const m = montar(), r = await fb(m, aprovado({ link: 'https://parqueretiro.org' }));
    ok(r.ok && r.simulado === true && m.http.chamadas.length === 0, 'simulação é o padrão e não chama http');
    ok(r.pedido.passos[0].metodo === 'POST' && r.pedido.passos[0].caminho === '/v0.0/PAGE123/feed' && r.pedido.passos[0].corpo.message === 'Venha ao Parque' && r.pedido.passos[0].corpo.link === 'https://parqueretiro.org', 'simulação mostra método, caminho e corpo');
    ok(!JSON.stringify(r).includes(TOKEN) && !/Authorization/i.test(JSON.stringify(r)), 'pedido simulado não tem token nem cabeçalho de autorização');
    const m2 = montar({ vivo: true, semSegredo: true }), r2 = await fb(m2, aprovado());
    ok(r2.ok && r2.simulado && /segredo não foi obtido/.test(r2.motivo) && m2.http.chamadas.length === 0, 'ao vivo sem segredo volta para simulação');
    const m3 = montar({ fb: { ao_vivo: 'true' } }), r3 = await fb(m3, aprovado());
    ok(r3.simulado && m3.http.chamadas.length === 0, 'só ao_vivo === true liga o envio real');
  }
  // ---- Facebook ao vivo
  { let m = montar({ vivo: true }), r = await fb(m, aprovado());
    let c = m.http.chamadas[0];
    ok(r.ok && !r.simulado && c.metodo === 'POST' && c.url === 'https://graph.facebook.com/v0.0/PAGE123/feed' && JSON.parse(c.corpo).message === 'Venha ao Parque', 'Facebook texto: POST /{page-id}/feed');
    ok(c.cab.Authorization === 'Bearer ' + TOKEN && !c.url.includes(TOKEN) && !c.corpo.includes(TOKEN), 'token vai só no cabeçalho, nunca na URL nem no corpo');
    ok(r.id === 'ID-1' && /facebook\.com/.test(r.url), 'Facebook devolve id e url');
    m = montar({ vivo: true }); await fb(m, aprovado({ tipo: 'Post com imagem', midiaLink: 'https://exemplo.org/a.jpg' }));
    c = m.http.chamadas[0]; ok(c.url.endsWith('/PAGE123/photos') && JSON.parse(c.corpo).url === 'https://exemplo.org/a.jpg' && JSON.parse(c.corpo).caption === 'Venha ao Parque', 'Facebook imagem: /photos com url e caption');
    m = montar({ vivo: true }); await fb(m, aprovado({ tipo: 'Vídeo curto / Reels', midiaLink: 'https://exemplo.org/v.mp4' }));
    ok(m.http.chamadas[0].url.endsWith('/PAGE123/videos'), 'Facebook vídeo: /videos');
    m = montar({ vivo: true, fb: { permissoes: ['pages_manage_posts'] } }); r = await fb(m, aprovado({ tipo: 'Vídeo curto / Reels', midiaLink: 'https://exemplo.org/v.mp4' }));
    ok(!r.ok && /publish_video/.test(r.motivo) && m.http.chamadas.length === 0, 'Facebook vídeo exige a permissão publish_video');
    r = await fb(montar({ fb: { versaoApi: undefined } }), aprovado());
    ok(!r.ok && /versaoApi/.test(r.motivo) && /documentação/.test(r.motivo), 'Facebook sem versaoApi: erro pede conferir a documentação');
    r = await fb(montar(), aprovado({ tipo: 'Carrossel' }));
    ok(!r.ok && /não publica o formato/.test(r.motivo), 'Facebook recusa formato não suportado');
  }
  // ---- Facebook agendamento
  { const cen = async (ms, vivo) => { const m = montar({ vivo }); const r = await fb(m, aprovado(), { agendarPara: mais(ms) }); return { r, m }; };
    ok(!(await cen(10 * MIN - 1000)).r.ok, 'agendamento 1 s antes dos 10 minutos é recusado');
    ok((await cen(10 * MIN)).r.ok, 'agendamento em exatamente 10 minutos é aceito');
    ok((await cen(30 * DIA)).r.ok, 'agendamento em exatamente 30 dias é aceito');
    const x = await cen(30 * DIA + 1000); ok(!x.r.ok && /30 dias/.test(x.r.motivo), 'agendamento além de 30 dias é recusado');
    const v = await cen(2 * DIA, true), corpo = JSON.parse(v.m.http.chamadas[0].corpo);
    ok(corpo.published === false && corpo.scheduled_publish_time === Math.floor((T0 + 2 * DIA) / 1000) && v.r.agendado === mais(2 * DIA), 'agendamento envia published=false e scheduled_publish_time (segundos)');
    ok(!(await fb(montar(), aprovado(), { agendarPara: 'não é data' })).ok, 'data de agendamento inválida é recusada');
  }
  // ---- Instagram
  const ig = (m, p, op) => m.reg.obter('instagram').publicar(p, lig('instagram'), op);
  const pig = (extra = {}) => aprovado(Object.assign({ rede: 'instagram', tipo: 'Post com imagem', midiaLink: 'https://exemplo.org/a.jpg' }, extra));
  const rotaIg = (seq, uso = 3) => { let k = 0; return c => {
    if (c.url.includes('content_publishing_limit')) return { json: { data: [{ quota_usage: uso }] } };
    if (c.url.includes('status_code')) return { json: { status_code: seq[Math.min(k++, seq.length - 1)] } };
    if (c.url.endsWith('/media')) return { json: { id: 'CONT' + c.corpo.length } };
    if (c.url.endsWith('/media_publish')) return { json: { id: 'MEDIA-FINAL' } };
    return {}; }; };
  { const http = criarHttp(rotaIg(['FINISHED'])), m = montar({ vivo: true, http }), r = await ig(m, pig());
    const rotas = http.chamadas.map(c => c.metodo + ' ' + c.url.replace('https://graph.facebook.com/v0.0/', ''));
    ok(r.ok && r.id === 'MEDIA-FINAL' && rotas[0] === 'GET IG123/content_publishing_limit?fields=quota_usage' && rotas[1] === 'POST IG123/media' && /^GET CONT\d+\?fields=status_code$/.test(rotas[2]) && rotas[3] === 'POST IG123/media_publish', 'Instagram imagem: limite, criar contêiner, status, publicar (nesta ordem)');
    ok(JSON.parse(http.chamadas[1].corpo).image_url === 'https://exemplo.org/a.jpg' && JSON.parse(http.chamadas[3].corpo).creation_id.startsWith('CONT'), 'Instagram: image_url no contêiner e creation_id na publicação');
  }
  { const m = montar({ vivo: true, http: criarHttp(rotaIg(['IN_PROGRESS', 'IN_PROGRESS', 'IN_PROGRESS', 'FINISHED'])) }), t = Date.now(), r = await ig(m, pig());
    ok(r.ok && m.dormiu.length === 3 && m.dormiu.every(x => x === 60000) && Date.now() - t < 2000, 'polling: 1 consulta por minuto, sem espera real nos testes');
  }
  { const m = montar({ vivo: true, http: criarHttp(rotaIg(['IN_PROGRESS'])) }), r = await ig(m, pig());
    ok(!r.ok && m.dormiu.length === 5 && /5 minutos/.test(r.motivo) && !m.http.chamadas.some(c => c.url.endsWith('media_publish')), 'polling desiste em 5 minutos e não publica');
    const m2 = montar({ vivo: true, http: criarHttp(rotaIg(['ERROR'])) }), r2 = await ig(m2, pig());
    ok(!r2.ok && /ERROR/.test(r2.motivo), 'contêiner com ERROR é recusado');
  }
  { const itens = k => Array.from({ length: k }, (_, i) => 'https://exemplo.org/' + i + '.jpg');
    let r = await ig(montar(), pig({ tipo: 'Carrossel', itens: itens(11) }));
    ok(!r.ok && /no máximo 10/.test(r.motivo), 'carrossel com mais de 10 itens é recusado');
    r = await ig(montar(), pig({ tipo: 'Carrossel', itens: itens(10) }));
    ok(r.ok && r.pedido.passos.filter(p => p.corpo && p.corpo.is_carousel_item).length === 10 && r.pedido.passos.some(p => p.corpo && p.corpo.media_type === 'CAROUSEL' && p.corpo.children.split(',').length === 10), 'carrossel com 10 itens é aceito (itens + contêiner CAROUSEL com children)');
    const http = criarHttp(rotaIg(['FINISHED'])); r = await ig(montar({ vivo: true, http }), pig({ tipo: 'Carrossel', itens: itens(2) }));
    const cr = http.chamadas.filter(c => c.url.endsWith('/media')).map(c => JSON.parse(c.corpo));
    ok(r.ok && cr.length === 3 && cr[0].is_carousel_item === true && cr[2].media_type === 'CAROUSEL' && cr[2].children.split(',').length === 2, 'carrossel ao vivo: um contêiner por item e depois o do carrossel');
  }
  { let r = await ig(montar(), pig({ midiaLink: 'https://exemplo.org/a.png' }));
    ok(!r.ok && /JPEG/.test(r.motivo), 'imagem PNG é recusada (só JPEG)');
    r = await ig(montar(), pig({ midiaLink: 'http://exemplo.org/a.jpg' })); ok(!r.ok && /https/.test(r.motivo), 'mídia sem https é recusada');
    r = await ig(montar(), pig({ midiaLink: '', img: 'data:image/jpeg;base64,AAAA' })); ok(!r.ok && /URL pública/.test(r.motivo), 'imagem embutida (sem URL pública) é recusada');
    r = await ig(montar({ vivo: true }), pig(), { agendarPara: mais(DIA) });
    ok(r.ok === false && r.motivo === 'O Instagram não agenda pela API; use a fila de publicação ou o agendador nativo', 'Instagram não agenda pela API (mensagem exata)');
    r = await ig(montar(), pig({ tipo: 'Vídeo curto / Reels', midiaLink: 'https://exemplo.org/v.mp4' }));
    ok(r.ok && r.pedido.passos[1].corpo.media_type === 'REELS' && r.pedido.passos[1].corpo.video_url, 'Reels usa media_type REELS e video_url');
    r = await ig(montar(), pig({ tipo: 'Stories' })); ok(r.ok && r.pedido.passos[1].corpo.media_type === 'STORIES', 'Stories usa media_type STORIES');
    ok(!(await ig(montar(), pig({ tipo: 'Vídeo longo (YouTube)' }))).ok, 'Instagram recusa formato não suportado');
  }
  { let http = criarHttp(rotaIg(['FINISHED'], 50)), r = await ig(montar({ vivo: true, http }), pig());
    ok(!r.ok && /Limite de publicações/.test(r.motivo) && http.chamadas.length === 1, 'limite de 24 h (padrão seguro 50) atingido: recusa antes de criar contêiner');
    http = criarHttp(rotaIg(['FINISHED'], 60)); r = await ig(montar({ vivo: true, http, ig: { limite24h: 100 } }), pig());
    ok(r.ok, 'limite24h é configurável (100 permite 60 usadas)');
    r = await ig(montar({ vivo: true, http: criarHttp(() => ({ json: {} })) }), pig());
    ok(!r.ok && /ler o limite/.test(r.motivo), 'sem conseguir ler o limite, não publica');
    http = criarHttp(c => c.url.endsWith('/media') ? { status: 400, json: { error: { message: 'Page Publishing Authorization required' } } } : rotaIg(['FINISHED'])(c));
    r = await ig(montar({ vivo: true, http }), pig());
    ok(!r.ok && /Autorização de Publicação \(PPA\)/.test(r.motivo) && !/required/.test(r.motivo), 'bloqueio por PPA tem mensagem clara (sem repetir o corpo)');
  }
  // ---- YouTube
  const yt = (m, p, op) => m.reg.obter('youtube').publicar(p, lig('youtube'), op);
  const pyt = (extra = {}) => aprovado(Object.assign({ rede: 'youtube', tipo: 'Vídeo longo (YouTube)', tema: 'Aula aberta', midiaLink: 'arquivo.mp4' }, extra));
  const rotaYt = c => c.metodo === 'POST' ? { headers: { location: 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=SESSAO' } } : { json: { id: 'VID1' } };
  { const r = await yt(montar(), pyt()), s = r.pedido.passos[0];
    ok(r.ok && r.simulado && s.caminho === 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status' && s.escopo === 'https://www.googleapis.com/auth/youtube.upload', 'YouTube simulado: URL de envio resumível e escopo youtube.upload');
    ok(s.corpo.status.privacyStatus === 'private', 'YouTube simulado: privacyStatus explícito e private');
    const http = criarHttp(rotaYt), m = montar({ vivo: true, http }), r2 = await yt(m, pyt(), { lerVideo: async () => Buffer.from('bytes') });
    ok(r2.ok && !r2.simulado && JSON.parse(http.chamadas[0].corpo).status.privacyStatus === 'private' && r2.privacidade === 'private' && r2.id === 'VID1', 'YouTube ao vivo: envia sempre como private');
    ok(http.chamadas[1].metodo === 'PUT' && http.chamadas[1].url.endsWith('upload_id=SESSAO') && Buffer.isBuffer(http.chamadas[1].corpo), 'YouTube ao vivo: segundo passo envia os bytes à sessão');
    const r3 = await yt(montar({ vivo: true, http: criarHttp(rotaYt) }), pyt(), {});
    ok(!r3.ok && /lerVideo/.test(r3.motivo), 'YouTube ao vivo sem lerVideo é recusado');
    const r4 = await yt(montar(), pyt(), { privacidade: 'public' });
    ok(!r4.ok && /sempre privado/.test(r4.motivo), 'pedir envio público é recusado');
  }
  { const pub = (m, p, op) => m.reg.obter('youtube').tornarPublico(p, lig('youtube'), op);
    let r = await pub(montar(), pyt({ videoId: 'VID1' }), {});
    ok(!r.ok && /confirmação/.test(r.motivo), 'tornarPublico exige confirmadoPor');
    r = await pub(montar(), pyt({ videoId: 'VID1', status: 'Em produção' }), { confirmadoPor: 'ana@x.org' });
    ok(!r.ok && /não está aprovada/.test(r.motivo), 'tornarPublico também passa por conectorLiberado');
    const c = criarContadorMemoria(), http = criarHttp(), m = montar({ vivo: true, http, contador: c });
    r = await pub(m, pyt({ videoId: 'VID1' }), { confirmadoPor: 'ana@x.org' });
    const ch = http.chamadas[0];
    ok(r.ok && ch.metodo === 'PUT' && ch.url === 'https://www.googleapis.com/youtube/v3/videos?part=status' && JSON.parse(ch.corpo).status.privacyStatus === 'public', 'tornarPublico (confirmado) faz videos.update para public');
    ok(c.usado('geral', '2026-10-18') === 50 && eventos.some(e => e.operacao === 'tornarPublico' && e.confirmadoPor === 'ana@x.org'), 'videos.update custa 50 na cota geral e a confirmação fica na auditoria');
    ok((await pub(montar(), pyt({ videoId: 'VID1' }), { confirmadoPor: 'ana', privacidade: 'unlisted' })).pedido.passos[0].corpo.status.privacyStatus === 'unlisted', 'tornarPublico aceita não listado');
    const c1 = criarContadorMemoria(); c1.somar('envios', '2026-10-18', 100);
    r = await yt(montar({ contador: c1 }), pyt()); ok(!r.ok && /Cota diária/.test(r.motivo), 'balde de envios esgotado (100/dia) recusa');
    const c2 = criarContadorMemoria(); c2.somar('geral', '2026-10-18', 9960);
    r = await pub(montar({ contador: c2 }), pyt({ videoId: 'V' }), { confirmadoPor: 'ana' }); ok(!r.ok && /Cota diária/.test(r.motivo), 'cota geral (10.000) insuficiente para videos.update (50) recusa');
    const c3 = criarContadorMemoria(), m3 = montar({ vivo: true, http: criarHttp(rotaYt), contador: c3 });
    await yt(m3, pyt(), { lerVideo: async () => Buffer.from('x') });
    ok(c3.usado('envios', '2026-10-18') === 1 && c3.usado('geral', '2026-10-18') === 0, 'envio custa 1 no balde próprio e não gasta a cota geral');
  }
  // ---- erros HTTP e segredo
  { const falha = async (status, json) => { const m = montar({ vivo: true, http: criarHttp(() => ({ status, json: json || {} })) }); return fb(m, aprovado()); };
    let r = await falha(401); ok(!r.ok && /401/.test(r.motivo) && /renovar/.test(r.motivo), 'erro 401: mensagem clara em português');
    r = await falha(403); ok(!r.ok && /403/.test(r.motivo) && /permiss/i.test(r.motivo), 'erro 403: mensagem clara');
    r = await falha(429); ok(!r.ok && /429/.test(r.motivo) && /aguarde/.test(r.motivo), 'erro 429: mensagem clara');
    r = await falha(503); ok(!r.ok && /503/.test(r.motivo) && /falha temporária/.test(r.motivo), 'erro 5xx: mensagem clara');
    r = await falha(401, { error: { message: 'token ' + TOKEN + ' inválido', access_token: TOKEN } });
    ok(!JSON.stringify(r).includes(TOKEN), 'corpo de erro com token não é repetido');
    const m = montar({ vivo: true, http: async () => { throw new Error('falha de conexão com Bearer ' + TOKEN + ' e access_token=' + TOKEN); } });
    r = await fb(m, aprovado()); ok(!r.ok && /Falha inesperada/.test(r.motivo) && !JSON.stringify(r).includes(TOKEN), 'exceção do http com token é ocultada no erro devolvido');
  }
  ok(ocultarSegredos('a ' + TOKEN + ' b ' + encodeURIComponent(TOKEN + '/x') + ' ?access_token=zzz', [TOKEN]).split(TOKEN).length === 1 && !/zzz/.test(ocultarSegredos('?access_token=zzz', [])), 'ocultarSegredos troca o valor, a forma codificada e padrões de token');
  { let erro = null; try { criarConector({ canal: 'x', adaptador: {}, config: { token: 'abc' }, db: mkdb() }); } catch (e) { erro = e; }
    ok(erro && !/abc/.test(erro.message), 'configuração com segredo embutido é rejeitada (sem repetir o valor)'); }
  // ---- anúncios
  { const m = montar({ vivo: true });
    for (const [rot, op, extra] of [['opcoes.impulsionar', { impulsionar: true }, {}], ['post.impulsionar', {}, { impulsionar: true }], ['post.orcamento', {}, { orcamento: 50 }]]) {
      const r = await fb(m, aprovado(extra), op); ok(!r.ok && /publicidade paga não é permitida/.test(r.motivo), 'pedido de anúncio recusado via ' + rot);
    }
    const r = await yt(m, pyt({ orcamento: 10 })); ok(!r.ok && /publicidade paga/.test(r.motivo) && m.http.chamadas.length === 0, 'anúncio também é recusado no YouTube, sem chamada http');
  }
  // ---- registro e capacidades
  { const reg = montar().reg, cap = reg.capacidades();
    ok(cap.facebook.publica && cap.facebook.agenda && !cap.instagram.agenda && cap.instagram.publica && cap.youtube.publica && !cap.youtube.agenda, 'capacidades por canal (publica/agenda) corretas');
    ok(['facebook', 'instagram', 'youtube'].every(c => ['publica', 'agenda', 'mensagens', 'metricas'].every(k => typeof cap[c][k] === 'boolean')), 'capacidades trazem publica, agenda, mensagens e metricas');
    ok(['whatsapp', 'tiktok', 'linkedin', 'google'].every(c => cap[c].disponivel === false && cap[c].motivo), 'canais sem conta voltam {disponivel:false, motivo}');
    const r = await reg.publicar('tiktok', aprovado({ rede: 'tiktok' }), lig('tiktok')); ok(!r.ok && /indisponível/.test(r.motivo), 'publicar em canal sem conta é recusado');
  }
  // ---- o segredo nunca vaza; a rede real nunca foi usada
  ok(!JSON.stringify(eventos).includes(TOKEN) && eventos.length > 20, 'auditoria nunca contém o token (' + eventos.length + ' eventos)');
  ok(!logs.join('\n').includes(TOKEN), 'logs nunca contêm o token');
  ok(usosFetch === 0, 'o fetch global (rede real) nunca foi chamado');
  saida('\n' + n + ' verificações OK');
})().catch(e => { process.stderr.write('FALHOU: ' + (e && e.stack || e) + '\n'); process.exit(1); });
