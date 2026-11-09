// Registro dos conectores por canal. Canais sem conta (whatsapp, tiktok, linkedin, google) NÃO são implementados.
'use strict';
const { criarConector, ocultarSegredos, criarContadorMemoria } = require('./base.js');
const ADAPTADORES = { facebook: require('./facebook.js'), instagram: require('./instagram.js'), youtube: require('./youtube.js') };
const SEM_CONTA = {
  whatsapp: 'Sem API oficial nesta fase: modo assistido (fila de publicação).',
  tiktok: 'O Parque não tem canal; a API só publica ao público após auditoria.',
  linkedin: 'O Parque não tem canal; a API é para organizações com uso comercial.',
  google: 'Sem Perfil da Empresa confirmado; a API exige pedido de acesso e perfil verificado há mais de 60 dias.'
};

// deps: {config:{facebook:{...},instagram:{...},youtube:{...}}, db, http, segredo, auditar, agora, dormir, contador}
function criarRegistro(deps) {
  deps = deps || {};
  const contador = deps.contador || criarContadorMemoria();
  const conectores = {};
  Object.keys(ADAPTADORES).forEach(canal => {
    conectores[canal] = criarConector({ canal, adaptador: ADAPTADORES[canal], config: (deps.config || {})[canal], db: deps.db, http: deps.http, segredo: deps.segredo, auditar: deps.auditar, agora: deps.agora, dormir: deps.dormir, contador });
  });
  const indisponivel = canal => ({ disponivel: false, motivo: SEM_CONTA[canal] || 'Canal desconhecido.' });
  return {
    obter: canal => conectores[canal] || indisponivel(canal),
    capacidades() {
      const o = {};
      Object.keys(ADAPTADORES).forEach(c => { o[c] = Object.assign({}, ADAPTADORES[c].capacidades); });
      Object.keys(SEM_CONTA).forEach(c => { o[c] = indisponivel(c); });
      return o;
    },
    async publicar(canal, post, conexao, opcoes) {
      if (!conectores[canal]) return { ok: false, simulado: false, motivo: 'Canal "' + canal + '" indisponível: ' + indisponivel(canal).motivo };
      return conectores[canal].publicar(post, conexao, opcoes);
    }
  };
}

module.exports = { criarRegistro, ADAPTADORES, SEM_CONTA, ocultarSegredos, criarConector, criarContadorMemoria };
