// Páginas ABERTAS do site ligadas ao servidor do Parque (migração supabase/migrations/0011_paginas_publicas.sql).
//
// VITRINES: o que cada coleção pode mostrar no site, sem dados pessoais. A área restrita gera "pub_<coleção>"
// sozinha sempre que a coleção muda (adaptador-supabase.js); o site aberto lê só essas vitrines (vitrine-publica.js).
// CAIXAS: o que quem visita o site pode ENVIAR. O envio fica numa caixa de entrada no servidor; quando alguém da
// equipe abre a área restrita, cada envio entra na coleção certa (regras abaixo) e sai da caixa.
// Para mostrar uma coleção nova no site: acrescente-a em VITRINES e diga em PAGINAS quais páginas a usam.
(function () {
const SENSIVEL = /e-?mail|whats|celular|telefone|fone|cpf|rg\b|senha|hash|salt|^por$|criadoPor|respEmail|lgpd|ip$/i;
const limpa = o => { const r = {}; Object.keys(o || {}).forEach(k => { if (!SENSIVEL.test(k)) r[k] = o[k]; }); return r; };
const lista = v => Array.isArray(v) ? v : [];
const txt = (v, n) => String(v == null ? '' : v).slice(0, n || 200);
const emailOk = e => /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/.test(e);
const hoje = () => new Date().toISOString().slice(0, 10);
// Nome que pode aparecer no site: primeiro nome + inicial do último ("Maria S.").
const nomeCurto = n => { const p = String(n || '').trim().split(/\s+/).filter(Boolean); return p.length > 1 ? p[0] + ' ' + p[p.length - 1][0].toUpperCase() + '.' : (p[0] || ''); };
const dataOk = s => /^data:(image\/(jpeg|png|webp)|application\/pdf);base64,/.test(s || '');

const VITRINES = {
  atividades: l => lista(l).filter(a => a && a.status === 'publicada').map(limpa),
  album: l => lista(l).filter(f => f && f.status === 'publicada' && /^data:image\/|^https:\/\//.test(f.foto || '')).map(f => { const x = limpa(f); if (!f.mostrarAutor) delete x.autor; return x; }),
  eventos: l => lista(l).map(e => ({ id: e.id, nome: e.nome })),
  estela: l => lista(l).filter(n => n && (n.pub === undefined || n.pub === true)).map(n => ({ id: n.id, nome: n.nome })),
  livros: l => lista(l).map(limpa),
  loja_itens: l => lista(l).filter(i => i && i.publicado).map(limpa),
  vol_acoes: l => lista(l).map(limpa),
  // Encontros públicos (17/11/2026): o site mostra nome, datas, local e descrição. Sem dados de inscritos.
  atividades_pub: l => lista(l).filter(a => a && a.ativo).map(a => {
    const x = limpa(a); delete x.criadoEm; return x;
  }),
  // Rifa, Vaquinha e Encomendas (15/11/2026): o site mostra o que está cadastrado e quanto já foi reservado/arrecadado,
  // sem nome completo, contato nem comprovante de ninguém.
  // Atividades públicas (Bloco 2 — 17/11/2026): exibe só as ativas; remove data de criação.
  atividades_pub: l => lista(l).filter(a => a && a.ativo).map(a => { const x = limpa(a); delete x.criadoEm; return x; }),
  rifas: l => lista(l).map(r => { const x = limpa(r); delete x.historico; delete x.tentativaMsg; if (x.apuracao) x.apuracao = limpa(x.apuracao); if (x.uso) x.uso = limpa(x.uso); return x; }),
  rifa_part: l => lista(l).filter(p => p && p.status !== 'recusado').map(p => ({ id: p.id, rifa: p.rifa, numeros: lista(p.numeros), status: p.status, nome: nomeCurto(p.nome) })),
  vaquinhas: l => lista(l).map(limpa),
  vaq_part: l => lista(l).filter(p => p && p.status === 'confirmado').map(p => ({ id: p.id, vaquinha: p.vaquinha, valor: p.valor, status: p.status })),
  livraria_itens: l => lista(l).filter(i => i && i.pre).map(i => { const x = limpa(i); delete x.preResp; delete x.preRespAte; delete x.preRespNome; return x; }),
  livraria_enc: l => lista(l).map(e => ({ id: e.id, livro: e.livro, seq: e.seq, qtd: e.qtd, cancelado: e.cancelado ? true : null }))
};
// Quais vitrines cada página aberta lê (pelo data-page do <body>; sem data-page = Início).
const PAGINAS = {
  atividades: ['atividades'], atividade: ['atividades'], '': ['atividades', 'livros'],
  biblioteca: ['livros'], fotos: ['album', 'eventos'], estela: ['estela'], lojinha: ['loja_itens'], voluntario: ['vol_acoes'],
  rifa: ['rifas', 'rifa_part'], vaquinha: ['vaquinhas', 'vaq_part'], livraria: ['livraria_itens', 'livraria_enc'], encomenda: ['livraria_itens', 'livraria_enc'],
  encontro: ['atividades_pub'],
  feedback: []
};

// Regras de cada caixa: limpam o envio e dizem como ele entra na coleção (sem nunca apagar o que já existe).
const CAIXAS = {
  contatos: {
    limpa: d => d && d.acao === 'sair' ? (emailOk(String(d.email || '').toLowerCase()) ? { acao: 'sair', email: String(d.email).toLowerCase() } : null)
      : (emailOk(String(d && d.email || '').toLowerCase()) && ['aderente', 'visitante'].includes(d.lista)
        ? { id: txt(d.id, 40) || ('pub' + Date.now().toString(36)), lista: d.lista, email: String(d.email).toLowerCase().slice(0, 160), nome: txt(d.nome, 120), origem: d.lista === 'visitante' ? 'wifi' : 'site', criado: txt(d.criado, 10) || hoje(), ativo: true } : null),
    junta: (l, d) => {
      if (d.acao === 'sair') { let n = 0; l.forEach(c => { if (c.email === d.email && c.ativo !== false) { c.ativo = false; c.saiu = hoje(); n++; } }); return n > 0; }
      const ex = l.find(c => c.lista === d.lista && c.email === d.email);
      if (ex) { if (ex.ativo === false) { ex.ativo = true; return true; } return false; }
      l.push(d); return true;
    }
  },
  voluntarios: {
    limpa: d => { if (!d || !d.id || !d.nome) return null; const r = {}; Object.keys(d).slice(0, 40).forEach(k => { const v = d[k]; r[k] = Array.isArray(v) ? v.slice(0, 30).map(x => txt(x, 200)) : typeof v === 'boolean' || typeof v === 'number' ? v : txt(v, 2000); }); r.origem = 'publica'; return r; },
    junta: (l, d) => { if (l.some(x => x.id === d.id)) return false; l.push(d); return true; }
  },
  // Vaquinha (15/11/2026): a contribuição chega "pendente" para o Responsável conferir o comprovante.
  vaq_part: {
    limpa: d => d && d.id && d.vaquinha && txt(d.nome).trim().split(/\s+/).length >= 2 && Number(d.valor) > 0 && Number(d.valor) <= 1000000 && emailOk(String(d.email || '').toLowerCase()) && dataOk(d.comprovante) && d.consentimento
      ? { id: txt(d.id, 40), codigo: txt(d.codigo, 12), vaquinha: txt(d.vaquinha, 40), nome: txt(d.nome, 120), celular: txt(d.celular, 30), whatsapp: txt(d.whatsapp, 30), email: String(d.email).toLowerCase().slice(0, 160), valor: Math.round(Number(d.valor) * 100) / 100, moeda: txt(d.moeda, 20), comprovante: d.comprovante, status: 'pendente', origem: 'publica', criadoEm: txt(d.criadoEm, 30) || new Date().toISOString(), consentimento: true, por: '', conta: '' }
      : null,
    junta: (l, d) => { if (l.some(x => x.id === d.id)) return false; l.push(d); return true; }
  },
  // Encomenda de livro (15/11/2026): a posição na fila é conferida na chegada, para nunca repetir.
  livraria_enc: {
    limpa: d => d && d.id && d.livro && txt(d.nome).trim().length >= 2 && parseInt(d.qtd, 10) >= 1 && parseInt(d.qtd, 10) <= 50 && (emailOk(String(d.email || '').toLowerCase()) || String(d.whatsapp || '').replace(/\D/g, '').length >= 10) && d.consent !== false
      ? Object.assign({}, ...Object.keys(d).slice(0, 40).map(k => ({ [k]: typeof d[k] === 'string' ? txt(d[k], 400) : (typeof d[k] === 'number' || typeof d[k] === 'boolean' ? d[k] : null) })), { origem: 'publica', por: '', pago: null, entregue: null, cancelado: null })
      : null,
    junta: (l, d) => {
      if (l.some(x => x.id === d.id)) return false;
      const doLivro = l.filter(x => x.livro === d.livro).map(x => x.seq || 0);
      if (doLivro.includes(d.seq) || !(d.seq >= 1)) d.seq = Math.max(0, ...doLivro) + 1;
      l.push(d); return true;
    }
  },
  album: {
    limpa: d => d && d.id && /^data:image\/(jpeg|png|webp);base64,/.test(d.foto || '') ? { id: txt(d.id, 40), foto: d.foto, evento: txt(d.evento, 40), dataFoto: txt(d.dataFoto, 10), autor: txt(d.autor, 120), mostrarAutor: !!d.mostrarAutor, legenda: '', email: '', data: txt(d.data, 10) || hoje(), status: 'pendente', origem: 'publica' } : null,
    junta: (l, d) => { if (l.some(x => x.id === d.id)) return false; l.push(d); return true; }
  },
  // Inscrições em atividades (Bloco 2 — 17/11/2026, melhorado no Bloco 6)
  inscricoes: {
    limpa: d => {
      if (!d || !d.atividade || !d.consentimento) return null;
      const partes = txt(d.nome, 120).trim().split(/\s+/).filter(Boolean);
      if (partes.length < 2) return null;
      if (!emailOk(String(d.email || '').toLowerCase())) return null;
      return {
        id:            txt(d.id, 40) || ('i' + Date.now().toString(36)),
        atividade:     txt(d.atividade, 40),
        atividade_nome: txt(d.atividade_nome, 200),
        nome:          partes.join(' '),
        email:         String(d.email).toLowerCase().slice(0, 160),
        telefone:      txt(d.telefone, 30),
        cidade:        txt(d.cidade, 100),
        extra:         txt(d.extra, 500),
        data_atividade: txt(d.data_atividade, 20),
        status:        'interesse',
        origem:        'publica',
        criadoEm:      txt(d.criadoEm, 30) || new Date().toISOString(),
        consentimento: true,
        chegou:        false,
        cancelado:     false
      };
    },
    junta: (l, d) => { if (l.some(x => x.id === d.id)) return false; l.push(d); return true; }
  },
  // Feedback de visita (Bloco 6 — 17/11/2026)
  feedback: {
    limpa: d => {
      if (!d) return null;
      return {
        id:          txt(d.id, 40) || ('f' + Date.now().toString(36)),
        atividade:   txt(d.atividade, 40),
        como_soube:  txt(d.como_soube, 200),
        destaque:    txt(d.destaque, 1000),
        melhorar:    txt(d.melhorar, 1000),
        voltaria:    ['sim', 'talvez', 'nao'].includes(d.voltaria) ? d.voltaria : '',
        quer_avisos: !!d.quer_avisos,
        email:       d.quer_avisos && emailOk(String(d.email || '').toLowerCase())
                       ? String(d.email).toLowerCase().slice(0, 160) : '',
        criadoEm:    txt(d.criadoEm, 30) || new Date().toISOString(),
        origem:      'publica'
      };
    },
    junta: (l, d) => { if (l.some(x => x.id === d.id)) return false; l.push(d); return true; }
  }
};

window.PR_PUBLICO = {
  VITRINES, PAGINAS, CAIXAS,
  vitrine: (nome, dados) => VITRINES[nome] ? VITRINES[nome](dados) : null,
  // envios da caixa de entrada → coleções. Recebe { coleção: lista atual } e devolve as coleções alteradas.
  juntar(envios, ler) {
    const mudou = {};
    (envios || []).forEach(e => {
      const R = CAIXAS[e.caixa]; if (!R) return;
      const d = R.limpa(e.dados); if (!d) return;
      const l = mudou[e.caixa] || lista(ler(e.caixa)).slice();
      if (R.junta(l, d)) mudou[e.caixa] = l;
    });
    return mudou;
  }
};
})();
