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

const VITRINES = {
  atividades: l => lista(l).filter(a => a && a.status === 'publicada').map(limpa),
  album: l => lista(l).filter(f => f && f.status === 'publicada' && /^data:image\/|^https:\/\//.test(f.foto || '')).map(f => { const x = limpa(f); if (!f.mostrarAutor) delete x.autor; return x; }),
  eventos: l => lista(l).map(e => ({ id: e.id, nome: e.nome })),
  estela: l => lista(l).filter(n => n && (n.pub === undefined || n.pub === true)).map(n => ({ id: n.id, nome: n.nome })),
  livros: l => lista(l).map(limpa),
  loja_itens: l => lista(l).filter(i => i && i.publicado).map(limpa),
  vol_acoes: l => lista(l).map(limpa)
};
// Quais vitrines cada página aberta lê (pelo data-page do <body>; sem data-page = Início).
const PAGINAS = {
  atividades: ['atividades'], atividade: ['atividades'], '': ['atividades', 'livros'],
  biblioteca: ['livros'], fotos: ['album', 'eventos'], estela: ['estela'], lojinha: ['loja_itens'], voluntario: ['vol_acoes']
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
  album: {
    limpa: d => d && d.id && /^data:image\/(jpeg|png|webp);base64,/.test(d.foto || '') ? { id: txt(d.id, 40), foto: d.foto, evento: txt(d.evento, 40), dataFoto: txt(d.dataFoto, 10), autor: txt(d.autor, 120), mostrarAutor: !!d.mostrarAutor, legenda: '', email: '', data: txt(d.data, 10) || hoje(), status: 'pendente', origem: 'publica' } : null,
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
