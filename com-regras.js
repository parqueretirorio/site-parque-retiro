// Regras de aprovação da Comunicação e Redes Sociais (Prompt 07). Sem acesso à tela: o MESMO arquivo roda no navegador
// (window.PR_COM_REGRAS) e, depois, no servidor (require), para que a regra valha no backend e não só na interface.
//
// Dados usados (coleções pr_*; ver comunicacao.js):
//   com_posts    publicações; este módulo acrescenta nelas: equipe {autores,revisores,aprovadores,publicadores: [e-mails]},
//                hist [{em,por,email,de,para,motivo}], versoes [{n,imp,tema,texto,midiaLink,temImg,por,email,em}],
//                aprovadoPor/aprovadoEm/aprovadoEmail/aprovadoVersao, porEmail (quem criou)
//   com_equipe   colaboradores e convidados [{id,email,nome,tipo,projetos:[ids],papeis:[...],ate:'AAAA-MM-DD',autorizadoPor,autorizadoEm,ativo}]
//   com_config   {autorNaoAprova:false, pausaGeral:false}
//
// IMPORTANTE: na cópia de teste (sem servidor) estas regras só são aplicadas pela tela, e quem conhece o navegador consegue
// contorná-las. Elas só protegem de verdade quando o servidor chamar este mesmo código a cada alteração.
(function (root, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else root.PR_COM_REGRAS = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  const ORDEM = ['Ideia', 'Planejada', 'Em produção', 'Aguardando aprovação', 'Aprovada', 'Agendada', 'Publicada'];
  const PAPEIS = ['autor', 'revisor', 'aprovador', 'publicador'];
  const PAPEL_ROTULO = { autor: 'Autor', revisor: 'Revisor', aprovador: 'Aprovador', publicador: 'Publicador' };
  const mail = x => String(x == null ? '' : x).trim().toLowerCase();
  const gestor = me => !!me && (me.nivel === 'administrador' || (me.funcoes || []).includes('comunicacao'));
  const cfg = db => Object.assign({ autorNaoAprova: false, pausaGeral: false }, db.get('com_config', {}) || {});
  const hojeDe = agoraISO => String(agoraISO || new Date().toISOString()).slice(0, 10);

  // Convites vigentes da pessoa (não vencidos, não desligados).
  const convites = (me, db, agoraISO) => {
    if (!me) return [];
    const hj = hojeDe(agoraISO), m = mail(me.email);
    return (db.get('com_equipe', []) || []).filter(c => c && c.ativo !== false && mail(c.email) === m && (!c.ate || c.ate >= hj));
  };

  // Papéis da pessoa numa publicação: gestor, e os de equipe da publicação e dos convites do projeto.
  function papeis(me, p, db, agoraISO) {
    const s = new Set(); if (!me || !p) return s;
    if (gestor(me)) s.add('gestor');
    const m = mail(me.email), eq = p.equipe || {};
    PAPEIS.forEach(r => { if ((eq[r + 'es'] || eq[r + 's'] || []).map(mail).includes(m)) s.add(r); });
    if (p.porEmail && mail(p.porEmail) === m) s.add('autor');
    convites(me, db, agoraISO).forEach(c => {
      const dentro = (c.projetos || []).includes(p.projeto) || (c.posts || []).includes(p.id);
      if (dentro) { s.add('convidado'); (c.papeis || []).forEach(r => { if (PAPEIS.includes(r)) s.add(r); }); }
    });
    return s;
  }

  const temAcesso = (me, db, agoraISO) => {
    if (gestor(me)) return true;
    if (convites(me, db, agoraISO).length) return true;
    const m = mail(me && me.email); if (!m) return false;
    return (db.get('com_posts', []) || []).some(p => PAPEIS.some(r => ((p.equipe || {})[r + 'es'] || (p.equipe || {})[r + 's'] || []).map(mail).includes(m)));
  };
  const visiveis = (me, posts, db, agoraISO) => gestor(me) ? posts : posts.filter(p => papeis(me, p, db, agoraISO).size > 0);

  // Impressão digital do conteúdo (detecta mudança; NÃO é criptográfica).
  function impressao(p) {
    const t = [p.tema || '', p.texto || '', p.midiaLink || '', p.img ? 'img:' + p.img.length + ':' + p.img.slice(-40) : ''].join('\u0001');
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
  }

  // Quem pode mudar o status. Devolve {ok:true} ou {ok:false, motivo}.
  function podeMudar(me, p, para, db, agoraISO) {
    const de = p.status || ORDEM[0];
    if (de === para) return { ok: true };
    if (!ORDEM.includes(para)) return { ok: false, motivo: 'Status desconhecido.' };
    const r = papeis(me, p, db, agoraISO), g = r.has('gestor'), c = cfg(db);
    const nao = motivo => ({ ok: false, motivo });
    if (!g && !r.size) return nao('Você não faz parte da equipe desta publicação.');
    if (para === 'Aprovada') {
      if (!g && !r.has('aprovador')) return nao('Só aprovadores da publicação (ou o Responsável pela Comunicação e administradores) aprovam.');
      if (c.autorNaoAprova && p.porEmail && mail(p.porEmail) === mail(me.email)) return nao('Quem criou a publicação não pode aprová-la (regra ativada pelo administrador).');
      return { ok: true };
    }
    if (para === 'Agendada' || para === 'Publicada') {
      if (!g && !r.has('publicador')) return nao('Só publicadores da publicação (ou o Responsável pela Comunicação e administradores) agendam ou marcam como publicada.');
      return { ok: true };
    }
    if (de === 'Publicada' || ORDEM.indexOf(para) < ORDEM.indexOf(de) && (de === 'Aprovada' || de === 'Agendada')) {
      if (!g && !r.has('aprovador')) return nao('Só aprovadores, o Responsável pela Comunicação ou administradores devolvem uma publicação já aprovada ou publicada.');
      return { ok: true };
    }
    if (para === 'Aguardando aprovação') { if (g || r.has('autor') || r.has('revisor')) return { ok: true }; return nao('Só autor, revisor, Responsável pela Comunicação ou administrador enviam para aprovação.'); }
    if (g || r.has('autor') || r.has('revisor') || r.has('aprovador')) return { ok: true };
    return nao('Seu papel nesta publicação não permite esta mudança.');
  }

  const registra = (p, de, para, me, agoraISO, motivo) => {
    p.hist = p.hist || []; p.hist.push({ em: agoraISO, por: me ? me.nome : '', email: me ? mail(me.email) : '', de, para, motivo: motivo || '' });
  };

  // Aplica o efeito de uma mudança de status (registro de quem e quando). Quem chama já conferiu podeMudar.
  function aoMudar(p, de, me, agoraISO) {
    const para = p.status, hj = hojeDe(agoraISO);
    if (de === para) return;
    registra(p, de, para, me, agoraISO);
    if (para === 'Aprovada') { p.aprovadoPor = me.nome; p.aprovadoEm = hj; p.aprovadoEmail = mail(me.email); p.aprovadoVersao = impressao(p); }
    if (para === 'Publicada') { p.publicadoPor = me.nome; p.publicadoEm = hj; p.publicadoEmail = mail(me.email); }
  }

  // Versões: guarda uma nova versão quando tema, texto ou mídia mudam; se mudou DEPOIS da aprovação, volta para aprovação.
  function versionar(p, me, agoraISO, statusAntes) {
    p.versoes = p.versoes || [];
    const imp = impressao(p), ult = p.versoes[p.versoes.length - 1];
    if (ult && ult.imp === imp) return { nova: false, devolvida: false };
    p.versoes.push({ n: p.versoes.length + 1, imp, tema: p.tema || '', texto: p.texto || '', midiaLink: p.midiaLink || '', temImg: !!p.img, por: me ? me.nome : '', email: me ? mail(me.email) : '', em: agoraISO });
    let devolvida = false;
    if (statusAntes === p.status && ['Aprovada', 'Agendada'].includes(p.status) && p.aprovadoVersao && p.aprovadoVersao !== imp) {
      const de = p.status; p.status = 'Aguardando aprovação'; devolvida = true;
      registra(p, de, p.status, me, agoraISO, 'O conteúdo mudou depois da aprovação');
    }
    return { nova: true, devolvida };
  }

  // Chamada única depois de salvar uma publicação: registra mudança de status e versão.
  function aoSalvar(p, statusAntes, me, agoraISO) {
    aoMudar(p, statusAntes, me, agoraISO);
    return versionar(p, me, agoraISO, p.status === statusAntes ? statusAntes : null);
  }

  // Conector só publica a versão aprovada, com o canal ligado e sem pausa geral.
  function conectorLiberado(p, conexao, db) {
    const c = cfg(db);
    if (c.pausaGeral) return { ok: false, motivo: 'Publicação automática pausada por um administrador.' };
    if (!conexao || conexao.estado !== 'ligado') return { ok: false, motivo: 'O conector deste canal está desligado.' };
    if (!['Aprovada', 'Agendada'].includes(p.status)) return { ok: false, motivo: 'A publicação não está aprovada.' };
    if (!p.aprovadoVersao || p.aprovadoVersao !== impressao(p)) return { ok: false, motivo: 'O conteúdo atual não é a versão aprovada.' };
    return { ok: true };
  }

  return { ORDEM, PAPEIS, PAPEL_ROTULO, gestor, cfg, convites, papeis, temAcesso, visiveis, impressao, podeMudar, aoMudar, versionar, aoSalvar, conectorLiberado, mail };
});
