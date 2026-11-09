// Testa o adaptador remoto contra o servidor de referência. Uso: node tests/teste_adaptador_remoto.js
const assert = require('assert');
const { criar: criarServ } = require('./servidor_referencia');
const { criar } = require('../adaptador-remoto');
const esp = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const S = criarServ(); const url = await S.iniciar();
  const mk = (o = {}) => criar({ url, token: 'tok', atrasoMs: 5, ...o });
  S.col.set('users', { versao: 3, dados: [{ email: 'a@x' }] });

  // 1) carrega do servidor
  const A = mk(); await A.iniciar();
  assert.deepStrictEqual(JSON.parse(A.get('pr_users')), [{ email: 'a@x' }]); console.log('ok 1 carrega coleções do servidor');

  // 2) grava -> servidor recebe e versão sobe
  A.set('pr_users', JSON.stringify([{ email: 'a@x' }, { email: 'b@x' }])); await A.sincronizar();
  assert.strictEqual(S.col.get('users').versao, 4); assert.strictEqual(S.col.get('users').dados.length, 2); console.log('ok 2 gravação chega ao servidor (v3->v4)');

  // 3) segundo computador vê o dado do primeiro
  const B = mk(); await B.iniciar(); assert.strictEqual(JSON.parse(B.get('pr_users')).length, 2); console.log('ok 3 outro computador enxerga os mesmos dados');

  // 4) conflito: A e B editam a mesma coleção a partir da mesma versão -> a segunda é recusada, nada é sobrescrito
  A.set('pr_users', JSON.stringify([{ email: 'A' }])); await A.sincronizar();
  B.set('pr_users', JSON.stringify([{ email: 'B' }])); let avisado = null;
  const B2 = B; await B2.sincronizar();
  assert.deepStrictEqual(S.col.get('users').dados, [{ email: 'A' }], 'servidor manteve a versão de A');
  assert.strictEqual(B.conflitos().length, 1); assert.strictEqual(B.estado().conflitos, 1); console.log('ok 4 conflito detectado, servidor não foi sobrescrito');

  // 5) resolver: 'servidor' descarta o meu
  await B.resolverConflito('users', 'servidor'); assert.deepStrictEqual(JSON.parse(B.get('pr_users')), [{ email: 'A' }]); assert.strictEqual(B.conflitos().length, 0); console.log('ok 5 resolução "usar a do servidor"');
  // 5b) resolver: 'meu' insiste
  B.set('pr_users', JSON.stringify([{ email: 'B2' }])); A.set('pr_users', JSON.stringify([{ email: 'A2' }])); await A.sincronizar(); await B.sincronizar();
  await B.resolverConflito('users', 'meu'); assert.deepStrictEqual(S.col.get('users').dados, [{ email: 'B2' }]); console.log('ok 5b resolução "manter a minha"');

  // 6) auditoria (só-acréscimo) é mesclada, não recusada
  A.set('pr_audit', JSON.stringify([{ t: '2026-01-01', x: 1 }])); await A.sincronizar();
  const C = mk(); await C.iniciar(); A.set('pr_audit', JSON.stringify([{ t: '2026-01-01', x: 1 }, { t: '2026-01-02', x: 2 }])); await A.sincronizar();
  C.set('pr_audit', JSON.stringify([{ t: '2026-01-01', x: 1 }, { t: '2026-01-03', x: 3 }])); await C.sincronizar();
  assert.deepStrictEqual(S.col.get('audit').dados.map(r => r.x), [1, 2, 3]); console.log('ok 6 auditoria mesclada sem perder registros');

  // 7) offline: nada se perde; ao voltar, envia
  S.offline(true); A.set('pr_calend', JSON.stringify([1, 2])); await A.sincronizar().then(() => assert.fail('deveria falhar'), () => {});
  assert.strictEqual(A.estado().estado, 'offline'); assert.strictEqual(A.estado().pendentes, 1); assert.strictEqual(JSON.parse(A.get('pr_calend')).length, 2);
  S.offline(false); await A.sincronizar(); assert.strictEqual(S.col.get('calend').versao, 1); assert.strictEqual(A.estado().pendentes, 0); console.log('ok 7 offline mantém pendente e reenvia ao reconectar');

  // 8) 'meta' nunca sobe; sem token = recusado
  A.set('pr_meta', '{"ultimoBackup":"x"}'); await A.sincronizar(); assert.ok(!S.col.has('meta')); console.log('ok 8 dados locais (meta) não vão ao servidor');
  const D = criar({ url, token: 'errado', atrasoMs: 5 }); await D.iniciar().then(() => assert.fail(), e => assert.match(e.message, /permissão/)); console.log('ok 9 sem login válido o servidor recusa e o adaptador avisa');

  // 9b) sincronizar sem nada pendente não pode travar a fila
  await A.sincronizar(); await A.sincronizar(); A.set('pr_extra', '[1]'); await A.sincronizar(); assert.ok(S.col.has('extra')); console.log('ok 9b fila não trava após sincronização vazia');
  // 10) remoção
  A.del('pr_calend'); await A.sincronizar(); assert.ok(!S.col.has('calend')); console.log('ok 10 remoção sincroniza');
  await S.parar(); console.log('\nTODOS OS TESTES PASSARAM');
})().catch(e => { console.error('FALHOU:', e); process.exit(1); });
