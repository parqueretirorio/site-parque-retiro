// Teste das regras de aprovação da Comunicação (sem navegador). Rodar: node tests/teste_com_regras.js
const assert = require('assert'); const R = require('../com-regras.js');
let n = 0; const ok = (c, m) => { assert(c, m); n++; console.log('OK  ' + m); };
const mkdb = (o = {}) => ({ get: (k, d) => (k in o ? JSON.parse(JSON.stringify(o[k])) : d), set: (k, v) => { o[k] = v; } });
const adm = { nome: 'Adm', email: 'adm@x.org', nivel: 'administrador', funcoes: [] };
const resp = { nome: 'Resp', email: 'resp@x.org', nivel: 'editor', funcoes: ['comunicacao'] };
const rev = { nome: 'Rev', email: 'rev@x.org', nivel: 'leitor', funcoes: [] };
const apr = { nome: 'Apr', email: 'apr@x.org', nivel: 'leitor', funcoes: [] };
const ext = { nome: 'Ext', email: 'ext@x.org', nivel: 'leitor', funcoes: [] };
const ninguem = { nome: 'Nin', email: 'nin@x.org', nivel: 'editor', funcoes: [] };
const ag = '2026-10-16T10:00:00.000Z';
const post = () => ({ id: 'p1', tema: 'Convite', texto: 'Venha ao Parque', status: 'Em produção', projeto: 'proj1', porEmail: 'adm@x.org', equipe: { revisores: ['rev@x.org'], aprovadores: ['apr@x.org'], publicadores: [], autores: [] } });
const db = mkdb({ com_equipe: [{ id: 'c1', email: 'ext@x.org', tipo: 'aderente1', projetos: ['proj1'], papeis: ['revisor'], ate: '2026-12-31', ativo: true }] });

// quem entra
ok(R.temAcesso(adm, db, ag) && R.temAcesso(resp, db, ag), 'administrador e Responsável pela Comunicação têm acesso');
ok(!R.temAcesso(ninguem, mkdb({ com_posts: [] }), ag), 'pessoa sem papel não tem acesso');
ok(R.temAcesso(ext, db, ag), 'convidado com convite vigente tem acesso');
ok(!R.temAcesso(ext, mkdb({ com_equipe: [{ email: 'ext@x.org', projetos: ['proj1'], ate: '2026-01-01', ativo: true }] }), ag), 'convite vencido encerra o acesso');
ok(!R.temAcesso(ext, mkdb({ com_equipe: [{ email: 'ext@x.org', projetos: ['proj1'], ate: '2026-12-31', ativo: false }] }), ag), 'convite desligado encerra o acesso');
ok(R.temAcesso(rev, mkdb({ com_posts: [post()] }), ag), 'quem está na equipe de uma publicação tem acesso');
// visibilidade
const p2 = Object.assign(post(), { id: 'p2', projeto: 'outro', equipe: {} });
ok(R.visiveis(ext, [post(), p2], db, ag).length === 1 && R.visiveis(ext, [post(), p2], db, ag)[0].id === 'p1', 'convidado só vê as publicações do seu projeto');
ok(R.visiveis(adm, [post(), p2], db, ag).length === 2, 'administrador vê todas');
// aprovação
ok(!R.podeMudar(rev, post(), 'Aprovada', db, ag).ok, 'revisor não aprova');
ok(R.podeMudar(apr, post(), 'Aprovada', db, ag).ok, 'aprovador aprova');
ok(!R.podeMudar(ninguem, post(), 'Aprovada', db, ag).ok, 'quem não é da equipe não muda nada');
ok(!R.podeMudar(ext, post(), 'Aprovada', db, ag).ok, 'convidado revisor não aprova');
ok(R.podeMudar(rev, post(), 'Aguardando aprovação', db, ag).ok, 'revisor envia para aprovação');
const dbA = mkdb({ com_config: { autorNaoAprova: true } });
ok(!R.podeMudar(adm, post(), 'Aprovada', dbA, ag).ok, 'regra ligada: quem criou não aprova a própria publicação');
ok(R.podeMudar(resp, post(), 'Aprovada', dbA, ag).ok, 'regra ligada: outro gestor aprova');
ok(R.podeMudar(adm, post(), 'Aprovada', mkdb(), ag).ok, 'regra desligada (padrão): administrador aprova o que criou');
// publicação
const aprovada = Object.assign(post(), { status: 'Aprovada' });
ok(!R.podeMudar(apr, aprovada, 'Publicada', db, ag).ok, 'aprovador não publica');
ok(R.podeMudar(resp, aprovada, 'Publicada', db, ag).ok, 'gestor publica');
const comPub = Object.assign(post(), { status: 'Aprovada', equipe: { publicadores: ['rev@x.org'] } });
ok(R.podeMudar(rev, comPub, 'Publicada', db, ag).ok, 'publicador designado publica');
ok(!R.podeMudar(rev, Object.assign(post(), { status: 'Publicada' }), 'Em produção', db, ag).ok, 'revisor não desfaz publicação');
// registro de quem aprovou + versões
let p = post(); const antes = p.status; R.aoSalvar(p, antes, adm, ag); // 1a gravação: versão 1
ok(p.versoes.length === 1 && p.versoes[0].n === 1, 'primeira gravação cria a versão 1');
const a0 = p.status; p.status = 'Aprovada'; R.aoSalvar(p, a0, apr, ag);
ok(p.aprovadoPor === 'Apr' && p.aprovadoEmail === 'apr@x.org' && p.aprovadoVersao === R.impressao(p), 'aprovação registra quem, quando e a versão');
ok(p.hist.length >= 1 && p.hist[p.hist.length - 1].para === 'Aprovada' && p.hist[p.hist.length - 1].email === 'apr@x.org', 'histórico registra a mudança');
const s0 = p.status; p.texto = 'Venha ao Parque, sábado'; const r = R.aoSalvar(p, s0, resp, ag);
ok(r.nova && r.devolvida && p.status === 'Aguardando aprovação', 'texto mudou depois de aprovado: volta para aprovação');
ok(p.versoes.length === 2, 'a mudança gera a versão 2 e a 1 continua guardada');
ok(p.hist[p.hist.length - 1].motivo.includes('mudou depois da aprovação'), 'o histórico guarda o motivo da devolução');
// conector
const con = { estado: 'ligado' }, dbl = mkdb();
p.status = 'Aprovada'; p.aprovadoVersao = R.impressao(p);
ok(R.conectorLiberado(p, con, dbl).ok, 'conector liberado para a versão aprovada');
p.texto += '!'; ok(!R.conectorLiberado(p, con, dbl).ok, 'conector barra versão diferente da aprovada');
p.aprovadoVersao = R.impressao(p);
ok(!R.conectorLiberado(p, { estado: 'desligado' }, dbl).ok, 'conector desligado não publica');
ok(!R.conectorLiberado(p, con, mkdb({ com_config: { pausaGeral: true } })).ok, 'pausa geral barra tudo');
ok(!R.conectorLiberado(Object.assign({}, p, { status: 'Em produção' }), con, dbl).ok, 'conector barra publicação não aprovada');
ok(R.impressao({ tema: 'a', texto: 'b' }) !== R.impressao({ tema: 'a', texto: 'c' }), 'impressão muda com o texto');
console.log('\n' + n + ' verificações OK');
