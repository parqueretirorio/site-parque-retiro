// Servidor de REFERÊNCIA do contrato (docs/API_CONTRATO.md), em memória. Serve para testar o adaptador
// e, depois, para testar qualquer implementação real (PHP, etc.) com o mesmo conjunto de testes.
const http = require('http');
function criar({ token = 'tok' } = {}) {
  const col = new Map(); // nome -> { versao, dados }
  const log = [];
  let offline = false;
  const srv = http.createServer((req, res) => {
    let corpo = ''; req.on('data', d => corpo += d); req.on('end', () => {
      const send = (s, o) => { res.writeHead(s, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
      log.push(req.method + ' ' + req.url);
      if (offline) return req.socket.destroy();
      if (req.headers.authorization !== 'Bearer ' + token) return send(401, { erro: 'não autenticado' });
      const m = req.url.match(/^\/api\/colecoes(?:\/([^/?]+))?$/);
      if (!m) return send(404, { erro: 'rota' });
      const n = m[1] && decodeURIComponent(m[1]);
      if (req.method === 'GET' && !n) { const o = {}; col.forEach((v, k) => o[k] = v); return send(200, { colecoes: o }); }
      let b = {}; try { b = corpo ? JSON.parse(corpo) : {}; } catch (e) { return send(400, { erro: 'json' }); }
      const atual = col.get(n);
      if (req.method === 'PUT' && n) {
        const vAtual = atual ? atual.versao : 0;
        if ((b.versao_base | 0) !== vAtual) return send(409, { versao_atual: vAtual, dados: atual ? atual.dados : null });
        col.set(n, { versao: vAtual + 1, dados: b.dados }); return send(200, { versao: vAtual + 1 });
      }
      if (req.method === 'DELETE' && n) {
        if (!atual) return send(404, { erro: 'não existe' });
        if ((b.versao_base | 0) !== atual.versao) return send(409, { versao_atual: atual.versao, dados: atual.dados });
        col.delete(n); return send(200, { ok: true });
      }
      send(405, { erro: 'método' });
    });
  });
  return {
    col, log,
    iniciar: () => new Promise(r => srv.listen(0, '127.0.0.1', () => r('http://127.0.0.1:' + srv.address().port + '/api'))),
    parar: () => new Promise(r => srv.close(r)),
    offline: v => { offline = v; }
  };
}
module.exports = { criar };
