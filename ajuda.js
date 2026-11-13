// Sistema de Ajuda do Parque Retiro: ajuda contextual, orientação ampliada e Central de Ajuda.
// Carregado em TODAS as páginas (área pública e área restrita), depois dos outros scripts.
//
// Três níveis, uma única base de conhecimento (ajuda-conteudo.js, que também é exportada em JSON para o aplicativo):
//  1. Dica rápida: no computador, aparece com o mouse parado sobre o item (no menu do topo: 5 segundos parado, ou segurando o botão esquerdo) ou ao chegar pelo teclado (Tab). No celular: toque longo
//     em botões e ícones, ou o símbolo (i) ao lado dos campos que têm explicação escrita.
//  2. Cartão "Saiba mais": a dica leva ao artigo completo, aberto num painel lateral (sem sair da tela de trabalho).
//  3. Central de Ajuda: botão (?) em todas as páginas e a página ajuda.html, com busca, categorias e artigos ilustrados.
// Há ainda o "Modo ajuda": com ele ligado, clicar/tocar em qualquer item mostra a explicação em vez de executar a ação.
//
// Como uma tela encontra a sua explicação (ver docs/CENTRAL_AJUDA.md):
//  - cada elemento recebe uma CHAVE estável, calculada a partir do contexto (página ou aba da área restrita) e do próprio
//    elemento (id, atributos data-*, texto). Ex.: "r.inventario.f-n" = campo #f-n da aba Inventário; "aba.estela" = botão
//    da aba Estela; "p.como-fazer.f-email" = campo e-mail do formulário de reserva. Um elemento pode fixar a sua chave
//    com o atributo data-ajuda="...".
//  - se a chave tiver uma explicação escrita (base + edições feitas na área restrita), ela é usada; senão o sistema monta
//    uma explicação a partir do que o elemento realmente é (rótulo, tipo de campo, obrigatoriedade, ação do botão).
//    O relatório de Cobertura (área restrita > Central de Ajuda) lista o que ainda depende dessa explicação automática.
(function () {
'use strict';
if (window.PR_AJUDA) return;

/* ------------------------------------------------------------------ dados ------------------------------------------------------------------ */
const VAZIO = { versao: '0', categorias: [], artigos: [], dicas: {}, contextos: {} };
// Páginas que não carregam dados.js também mostram as edições feitas neste navegador (só leitura, modo local).
const leLocal = { get(k, d) { try { const v = localStorage.getItem('pr_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } } };
const dbx = () => (window.PR_DADOS && window.PR_DADOS.db) || ((window.PR_CONFIG_DADOS || {}).modo === 'remoto' ? null : leLocal);
const gravavel = () => !!(window.PR_DADOS && window.PR_DADOS.db);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const limpa = s => String(s || '').replace(/\s+/g, ' ').replace(/\s*\*\s*$/, '').replace(/\s*\*\s*/g, ' ').trim();
const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
const le = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const grava = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };
const sess = k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } };

// Dica: aceita [titulo, texto, artigo] (forma curta usada no arquivo-base), texto simples ou objeto.
function normDica(id, d) {
  if (!d) return null;
  if (typeof d === 'string') return { id, titulo: '', texto: d, artigo: '' };
  if (Array.isArray(d)) return { id, titulo: d[0] || '', texto: d[1] || '', artigo: d[2] || '' };
  return { id, titulo: d.titulo || '', texto: d.texto || '', artigo: d.artigo || '', em: d.em, por: d.por, editada: !!d.editada };
}
let cache = null;
// Conteúdo final = arquivo publicado (ajuda-conteudo.js) + edições guardadas na área restrita (coleções ajuda_*).
function conteudo() {
  if (cache) return cache;
  const c = window.PR_AJUDA_CONTEUDO || VAZIO, d = dbx();
  const cats = new Map((c.categorias || []).map(x => [x.id, { ...x, origem: 'base' }]));
  const arts = new Map((c.artigos || []).map(x => [x.id, { ...x, origem: 'base' }]));
  const dicas = new Map(Object.keys(c.dicas || {}).map(k => [k, { ...normDica(k, c.dicas[k]), origem: 'base' }]));
  if (d) {
    (d.get('ajuda_categorias', []) || []).forEach(x => { if (x && x.id) { if (x.excluido) cats.delete(x.id); else cats.set(x.id, { ...x, origem: cats.has(x.id) ? 'editado' : 'novo' }); } });
    (d.get('ajuda_artigos', []) || []).forEach(x => { if (x && x.id) { if (x.excluido) arts.delete(x.id); else arts.set(x.id, { ...x, origem: arts.has(x.id) ? 'editado' : 'novo' }); } });
    (d.get('ajuda_dicas', []) || []).forEach(x => { if (x && x.id) { if (x.excluido) dicas.delete(x.id); else dicas.set(x.id, { ...normDica(x.id, x), origem: dicas.has(x.id) ? 'editado' : 'novo' }); } });
  }
  cache = {
    versao: c.versao, atualizadoEm: c.atualizadoEm,
    categorias: [...cats.values()].sort((a, b) => (a.ordem || 99) - (b.ordem || 99) || String(a.nome).localeCompare(b.nome, 'pt-BR')),
    artigos: [...arts.values()], dicas, contextos: { ...(c.contextos || {}) }
  };
  return cache;
}
// Conteúdo para EXIBIR: no idioma escolhido, os textos publicados (origem "base") são trocados pela tradução
// (i18n/ajuda-<idioma>.js, carregada pelo motor de idiomas). O editor da Central continua usando conteudo(), em português.
const idiomaAtual = () => { try { return (window.PR_IDIOMA && window.PR_IDIOMA.atual()) || 'pt'; } catch (e) { return 'pt'; } };
let cacheEx = null, cacheExChave = '';
function exib() {
  const c = conteudo(), L = idiomaAtual(), T = L !== 'pt' && window.PR_AJUDA_TRAD && window.PR_AJUDA_TRAD[L];
  if (!T) return c;
  if (cacheEx && cacheExChave === L && cacheEx._base === c) return cacheEx;
  const ta = T.artigos || {}, tc = T.categorias || {}, td = T.dicas || {};
  const artigos = c.artigos.map(a => { const t = a.origem === 'base' && ta[a.id]; if (!t) return a;
    const sec = { ...(a.secoes || {}) }; Object.keys(t.secoes || {}).forEach(k => { const v = t.secoes[k]; sec[k] = Array.isArray(v) ? (sec[k] || []).map((x, i) => v[i] || x) : (v || sec[k]); });
    return { ...a, titulo: t.titulo || a.titulo, resumo: t.resumo || a.resumo, onde: t.onde || a.onde, secoes: sec,
      imagens: (a.imagens || []).map((im, i) => ({ ...im, ...((t.imagens || [])[i] || {}) })), traduzido: L }; });
  const categorias = c.categorias.map(x => { const t = x.origem === 'base' && tc[x.id]; return t ? { ...x, nome: t.nome || x.nome, descricao: t.descricao || x.descricao } : x; });
  const dicas = new Map([...c.dicas].map(([k, d]) => { const t = d.origem === 'base' && td[k]; return [k, t ? { ...d, titulo: t[0] || d.titulo, texto: t[1] || d.texto } : d]; }));
  cacheEx = { ...c, artigos, categorias, dicas, _base: c }; cacheExChave = L;
  return cacheEx;
}
// Dica automática no idioma escolhido: traduz frase a frase (tabela "auto" da tradução da ajuda); o que não tiver tradução fica como está.
function trAuto(txt) {
  const L = idiomaAtual(), A = L !== 'pt' && window.PR_AJUDA_TRAD && window.PR_AJUDA_TRAD[L] && window.PR_AJUDA_TRAD[L].auto;
  if (!A || !txt) return txt;
  const fr = A.frases || {}, pd = (A.padroes || []).map(([re, rep]) => [new RegExp(re), rep]);
  return txt.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/).map(s => { if (fr[s]) return fr[s]; for (const [re, rep] of pd) if (re.test(s)) return s.replace(re, rep); return s; }).join(' ');
}
const invalida = () => { cache = null; cacheEx = null; resolvidos = new WeakMap(); };

/* --------------------------------------------------------------- quem é você ---------------------------------------------------------------- */
function usuario() {
  const d = dbx(); if (!d) return null;
  const em = sess('pr_sess');
  const u = em && (d.get('users', []) || []).find(x => x.email === em && (x.status || 'aprovado') === 'aprovado');
  if (u) return u;
  const t = window.PR_ACESSO_TEMPORARIO;
  if (t && t.ativo && sess('pr_temp') === '1') return { nome: 'Acesso temporário', email: 'acesso-temporario', nivel: t.nivel || 'administrador', funcoes: [] };
  return null;
}
let pe = { t: 0, v: false };
const podeEditar = () => {
  if (Date.now() - pe.t < 1500) return pe.v;
  const u = usuario(); pe = { t: Date.now(), v: !!u && (u.nivel === 'administrador' || (u.funcoes || []).includes('ajuda')) }; return pe.v;
};
// Artigos "para a equipe" (área restrita) só aparecem para quem entrou na área restrita; na área pública só há ajuda da área pública.
const logado = () => !!usuario() || !!sess('pr_sess') || sess('pr_temp') === '1';
const visivel = a => a && (a.status !== 'rascunho' || podeEditar()) && ((a.publico || 'todos') !== 'equipe' || logado());
const artigos = () => exib().artigos.filter(visivel);
const artigo = id => artigos().find(a => a.id === id) || null;
const categoria = id => exib().categorias.find(c => c.id === id) || null;

/* ---------------------------------------------------------------- contexto ---------------------------------------------------------------- */
const pagina = () => ((location.pathname.split('/').pop() || 'index.html').replace(/\.html?$/i, '') || 'index');
function ctx() {
  const p = pagina();
  if (p === 'area-restrita') { const a = document.querySelector('#areas .tab-btn.active[data-tab]'); return 'r.' + (a ? a.dataset.tab : 'painel'); }
  return 'p.' + p;
}
const ehVerbo = v => /^[a-zA-Z][a-zA-Z_-]{0,24}$/.test(v || '') && !/^m[a-z0-9]{8,}$/.test(v); // valores tipo "salvar", "pendente" (não ids de registros)
const IGNORA_ATTR = new Set(['data-ajuda', 'data-ajuda-chave', 'data-i', 'data-sy', 'data-fixo', 'data-titulo-orig']);
// Chaves do elemento, da mais específica para a mais geral. A primeira é a usada para gravar uma explicação nova.
const GLOBAIS = [
  ['.whatsapp-float', () => 'global.whatsapp'], ['.btn-entrar', () => 'global.entrar'], ['.nav-toggle', () => 'global.menu'],
  ['.sub-toggle', () => 'global.submenu'], ['#pr-idioma .pri-bt', () => 'global.idioma'], ['#pr-idioma [data-l]', () => 'global.idioma.opcao'],
  ['a.brand', () => 'global.marca'], ['.rodape-news a', () => 'global.newsletter'],
  ['footer .social-links a', e => 'global.rede.' + slug(e.getAttribute('title') || e.textContent)],
  ['#sair', () => 'painel.sair'], ['.emkt-btn', () => 'painel.comunicado'], ['.area-titulo', e => 'painel.area.' + ((e.closest('[data-area]') || {}).dataset || {}).area],
  ['.area-grupo-bt', e => 'painel.grupo.' + ((e.closest('[data-grupo]') || {}).dataset || {}).grupo]
];
function chaves(el) {
  if (!el || el.nodeType !== 1) return [];
  if (el.dataset && el.dataset.ajuda) return [el.dataset.ajuda];
  for (const [sel, f] of GLOBAIS) if (el.matches(sel)) return [f(el)];
  if (el.dataset && el.dataset.tab && el.closest('#areas')) return ['aba.' + el.dataset.tab];
  if (el.tagName === 'A' && el.closest('header nav')) {
    let u; try { u = new URL(el.getAttribute('href') || '', location.href); } catch (e) { u = null; }
    const pg = u ? (u.pathname.split('/').pop() || 'index').replace(/\.html?$/i, '') || 'index' : 'index', cat = u && u.searchParams.get('cat');
    return ['menu.' + pg + (cat ? '.' + cat : '')];
  }
  const c = ctx(), out = [];
  if (el.id && !/^pr-aj/.test(el.id)) out.push(c + '.' + el.id);
  const verbos = [], outros = [];
  for (const a of el.attributes) {
    if (!a.name.startsWith('data-') || IGNORA_ATTR.has(a.name)) continue;
    const n = a.name.slice(5);
    if (ehVerbo(a.value)) verbos.push(c + '.' + n + '.' + a.value);
    outros.push(c + '.' + n);
  }
  out.push(...verbos, ...outros);
  if ((el.type === 'checkbox' || el.type === 'radio') && ehVerbo(el.value) && el.value !== 'on') out.push(c + '.v.' + el.value.toLowerCase());
  const t = slug(textoDe(el)); if (t) out.push(c + '.t.' + t);
  return [...new Set(out)];
}
function textoDe(el) {
  if (!el) return '';
  if (el.labels && el.labels.length) return limpa(el.labels[0].innerText);
  return limpa(el.getAttribute('aria-label') || el.innerText || el.textContent || el.value && el.type !== 'text' && el.type !== 'checkbox' && el.value || el.getAttribute('title') || el.getAttribute('data-titulo-orig') || el.getAttribute('placeholder') || '');
}

// Artigo do contexto: sub-aba ativa mais interna > aba/página.
function artigoDoContexto() {
  const m = conteudo().contextos, c = ctx();
  const subs = [...document.querySelectorAll('#tab .tabs.sub .tab-btn.active, main .tabs.sub .tab-btn.active, .container .tabs.sub .tab-btn.active')].reverse();
  for (const b of subs) for (const a of b.attributes) {
    if (!a.name.startsWith('data-')) continue;
    const k = c + '.' + a.name.slice(5) + '.' + a.value; if (m[k] && artigo(m[k])) return m[k];
  }
  if (m[c] && artigo(m[c])) return m[c];
  return m.padrao || null;
}
function artigoDaChave(k) {
  const m = conteudo().contextos;
  if (/^aba\./.test(k)) return m['r.' + k.slice(4)];
  if (/^menu\./.test(k)) { const p = 'p.' + k.slice(5).split('.')[0]; return m[p] || m.menu; }
  if (/^global\./.test(k)) return m.global;
  if (/^painel\./.test(k)) return m['r.painel'];
  return null;
}

/* ----------------------------------------------------- explicação automática (sem texto escrito) ----------------------------------------------------- */
const ACOES = [
  [/fa-trash|^(excluir|remover|apagar)\b/i, 'Exclui este item. Uma cópia do que foi excluído fica guardada na Lixeira do sistema (Administração › Backup e Segurança), que o administrador pode baixar se for preciso recuperar.'],
  [/fa-(edit|pen|pencil)|^(editar|renomear|alterar)\b/i, 'Abre este item para alteração. Faça as mudanças no formulário e salve.'],
  [/fa-print|^imprimir/i, 'Abre a janela de impressão do navegador com o conteúdo desta tela. Nela você também pode escolher “Salvar como PDF”.'],
  [/fa-file-csv|\bcsv\b/i, 'Baixa os dados em planilha (arquivo .csv, separado por ponto e vírgula), que abre no Excel, no LibreOffice ou nas Planilhas Google.'],
  [/fa-(file-)?download|^baixar/i, 'Baixa um arquivo para o seu computador ou celular.'],
  [/fa-(upload|cloud-upload)|^enviar (foto|arquivo)/i, 'Envia os arquivos escolhidos.'],
  [/fa-save|^salvar|^gravar/i, 'Grava as informações preenchidas. Os campos marcados com * são obrigatórios.'],
  [/^(cancelar|fechar|voltar)\b|fa-(times|xmark|arrow-left)\b/i, 'Fecha ou volta sem gravar o que não foi salvo.'],
  [/fa-chevron-left|anterior/i, 'Volta para o período ou item anterior.'],
  [/fa-chevron-right|pr[oó]xim[oa]|seguinte/i, 'Avança para o próximo período ou item.'],
  [/^(hoje|semana atual|m[eê]s atual)$/i, 'Volta para a data de hoje.'],
  [/fa-copy|^copiar/i, 'Copia o texto para a área de transferência, para colar em outro lugar (WhatsApp, e-mail, redes sociais).'],
  [/fa-whatsapp/i, 'Abre o WhatsApp com a conversa ou a mensagem já preparada.'],
  [/fa-envelope|e-mail/i, 'Abre o seu programa de e-mail com a mensagem preparada.'],
  [/fa-eye-slash|privad/i, 'Mantém privado: o item não aparece na área aberta do site.'],
  [/fa-eye\b|^(tornar p[uú]blic|publicar|visualizar|ver\b)/i, 'Mostra ou publica este item.'],
  [/fa-(check|thumbs-up)\b|^(confirmar|aprovar|aceitar)/i, 'Confirma ou aprova este item. A situação dele muda na hora.'],
  [/fa-(ban|times-circle)|^(recusar|rejeitar|n[aã]o publicar)/i, 'Recusa este item. Normalmente o sistema pede o motivo.'],
  [/fa-search|^buscar|^pesquisar/i, 'Procura pelo que foi digitado.'],
  [/fa-sign-out|^sair$/i, 'Encerra o acesso neste navegador.'],
  [/^(abrir|configurar)\b/i, 'Abre esta parte para consultar ou configurar.'],
  [/fa-(plus|plus-circle|user-plus)|^(cadastrar|adicionar|criar|registrar|incluir|nov[oa])\b/i, null] // tratado em acaoNovo()
];
function acaoNovo(el, t) {
  const emForm = el.type === 'submit' || (el.closest('form') && el.type !== 'button');
  return emForm ? 'Grava um novo registro com os dados preenchidos neste formulário. Os campos marcados com * são obrigatórios.' : 'Abre o formulário para criar um novo registro' + (t ? ' (“' + t + '”)' : '') + '.';
}
function automatica(el) {
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return autoCampo(el);
  if (tag === 'SUMMARY') { const t = limpa(el.innerText); return t ? { titulo: t, texto: 'Clique para abrir ou fechar esta seção.' } : null; }
  if (tag === 'BUTTON' || el.getAttribute('role') === 'button' || el.getAttribute('role') === 'tab' || (tag === 'A' && el.classList.contains('btn-visit'))) {
    const t = textoDe(el), ic = (el.querySelector('i') || {}).className || '';
    if (el.closest('.tabs') && el.classList.contains('tab-btn')) return t ? { titulo: t, texto: 'Mostra a parte “' + t.replace(/\s*\(\d+\)$/, '') + '” desta ferramenta.' } : null;
    for (const [re, txt] of ACOES) if (re.test(ic) || re.test(t)) return { titulo: t || 'Botão', texto: txt || acaoNovo(el, t) };
    if (tag === 'A') return autoLink(el, t);
    return null;
  }
  if (tag === 'A') return autoLink(el, textoDe(el));
  return null;
}
// Links: só quando o destino muda o que a pessoa espera (e-mail, WhatsApp, arquivo, outro site) ou é um cartão/botão de navegação.
function autoLink(el, t) {
  const h = el.getAttribute('href') || '', tit = limpa((el.querySelector('h3, h4, strong') || {}).innerText || t).slice(0, 70);
  if (!tit) return null;
  if (/^mailto:/i.test(h)) return { titulo: tit, texto: 'Abre o seu programa de e-mail com uma mensagem para ' + h.slice(7).split('?')[0] + '.' };
  if (/wa\.me|whatsapp\.com/i.test(h)) return { titulo: tit, texto: 'Abre o WhatsApp (no computador, o WhatsApp Web).' };
  if (/^tel:/i.test(h)) return { titulo: tit, texto: 'No celular, liga para este número.' };
  const ext = (h.split(/[?#]/)[0].match(/\.(pdf|docx?|xlsx?|pptx?|mp3|mp4|zip|epub)$/i) || [])[1];
  if (el.hasAttribute('download') || ext) return { titulo: tit, texto: 'Baixa o arquivo' + (ext ? ' (' + ext.toUpperCase() + ')' : '') + ' para o seu computador ou celular.' + (/\(\d+\s*MB/i.test(t) ? ' Arquivo grande: prefira uma conexão Wi-Fi.' : '') };
  let ext2 = false; try { ext2 = new URL(h, location.href).origin !== location.origin; } catch (e) { /* ignora */ }
  if (ext2 || el.target === '_blank') return { titulo: tit, texto: (ext2 ? 'Abre outro site' : 'Abre') + ' em uma nova aba' + (ext2 ? ' (fora do site do Parque).' : '.') };
  if (el.matches('.card, .nav-card, .quick-link-btn, .btn-visit, .park-card a')) return { titulo: tit, texto: 'Abre a página “' + tit + '”.' };
  return null;
}
function autoCampo(el) {
  const tp = (el.type || '').toLowerCase();
  if (tp === 'hidden' || tp === 'submit' || tp === 'button') return null;
  const lab = el.labels && el.labels.length ? el.labels[0].innerText : (el.getAttribute('aria-label') || el.getAttribute('placeholder') || '');
  const titulo = limpa(lab); if (!titulo) return null;
  const obrig = /\*/.test(lab) || el.required, ph = el.getAttribute('placeholder') || '', p = [];
  const filtro = !el.closest('form') && /^(buscar|filtrar|mostrar|situa|status|categoria|ano\b|m[eê]s\b|per[ií]odo|vis[aã]o|rede social|projeto|localiza|patrim|dados|atividade$|rifa$|vaquinha$|forma de colaborar|tipo de atividade|ir para)/i.test(titulo);
  if (obrig) p.push('Preenchimento obrigatório.');
  if (el.readOnly || el.disabled) p.push('Somente consulta: este campo não pode ser alterado por você aqui.');
  else if (tag(el) === 'SELECT') p.push(filtro ? 'Escolha uma opção para filtrar o que aparece na tela. Nada é alterado nem apagado.' : el.multiple ? 'Escolha uma ou mais opções (segure Ctrl, ou Cmd no Mac, para marcar várias).' : 'Escolha uma das opções da lista.');
  else if (/^buscar|^pesquisar/i.test(titulo)) p.push('Digite parte do texto: a lista é filtrada enquanto você digita.');
  else if (tp === 'date') p.push('Escolha a data no calendário que se abre (ou digite dia, mês e ano).');
  else if (tp === 'month') p.push('Escolha o mês e o ano.');
  else if (tp === 'time') p.push('Informe o horário (hora e minutos).');
  else if (tp === 'datetime-local') p.push('Escolha a data e o horário.');
  else if (tp === 'number') p.push('Digite apenas números' + (el.min !== '' && el.max !== '' ? ', de ' + el.min + ' a ' + el.max : el.min !== '' ? ', a partir de ' + el.min : '') + '.');
  else if (tp === 'email') p.push('Informe um e-mail válido, por exemplo nome@exemplo.com.');
  else if (tp === 'tel') p.push('Informe o número com DDD.');
  else if (tp === 'url') p.push('Cole o endereço completo, começando com https://.');
  else if (tp === 'password') p.push('Por segurança, a senha não aparece enquanto você digita.');
  else if (tp === 'color') p.push('Clique para escolher a cor.');
  else if (tp === 'file') p.push((/image/.test(el.accept || '') ? 'Escolha a imagem no seu computador; no celular, você pode escolher da galeria ou tirar uma foto.' : 'Escolha o arquivo no seu computador ou celular.') + (el.multiple ? ' Pode escolher vários de uma vez.' : ''));
  else if (tp === 'checkbox') p.push('Marque para ativar esta opção; desmarque para desativar.');
  else if (tp === 'radio') p.push('Escolha uma das alternativas.');
  else if (tag(el) === 'TEXTAREA') p.push('Escreva livremente; o campo aceita várias linhas.');
  else if (/^0,00$/.test(ph) || /\(R\$\)|valor/i.test(titulo)) p.push('Valor em reais, com vírgula nos centavos (ex.: 25,00).');
  else p.push('Digite a informação pedida.');
  if (/^ex\.?:/i.test(ph)) p.push('Exemplo: ' + ph.replace(/^ex\.?:\s*/i, '') + '.');
  const ml = +el.getAttribute('maxlength'); if (ml && ml < 5000 && tp !== 'checkbox') p.push('Até ' + ml + ' caracteres.');
  return { titulo, texto: p.join(' ').replace(/\.\./g, '.') };
}
const tag = el => el.tagName;

/* ---------------------------------------------------------------- resolução ---------------------------------------------------------------- */
let resolvidos = new WeakMap();
// Devolve { chave, titulo, texto, artigo, fonte: 'escrita'|'automatica' } ou null.
function resolver(el) {
  if (!el || el.nodeType !== 1 || el.closest('.pr-aj-ui')) return null;
  if (el.tagName === 'LABEL' && el.control) el = el.control;
  if (el.closest('[aria-hidden="true"]') || (el.getAttribute('tabindex') === '-1' && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return null; // campos-armadilha contra robôs
  const c = ctx() + '|' + (el.labels && el.labels[0] ? el.labels[0].innerText.length : 0) + '|' + (el.textContent || '').length, r0 = resolvidos.get(el);
  if (r0 && r0.c === c) return r0.r;
  const ks = chaves(el), D = exib().dicas;
  let r = null;
  for (const k of ks) { const d = D.get(k); if (d && d.texto) { r = { chave: k, titulo: d.titulo || textoDe(el) || 'Ajuda', texto: d.texto, artigo: d.artigo || artigoDaChave(k) || artigoDoContexto(), fonte: 'escrita', origem: d.origem }; break; } }
  if (!r) { const a = automatica(el); if (a && ks.length) r = { chave: ks[0], titulo: a.titulo, texto: trAuto(a.texto), artigo: artigoDaChave(ks[0]) || artigoDoContexto(), fonte: 'automatica' }; }
  if (r && r.artigo && !artigo(r.artigo)) r.artigo = artigoDoContexto();
  resolvidos.set(el, { c, r });
  if (r) registraVisto(el, r);
  return r;
}
// Cobertura: guarda (só para quem administra a ajuda) as chaves vistas e se tinham texto escrito.
let vistos = null, tVistos = 0;
function registraVisto(el, r) {
  if (!podeEditar()) return;
  if (!vistos) { try { vistos = JSON.parse(le('pr_ajuda_vistos') || '{}'); } catch (e) { vistos = {}; } }
  const v = vistos[r.chave];
  if (v && v.f === r.fonte) return;
  vistos[r.chave] = { f: r.fonte, t: r.titulo.slice(0, 80), x: r.fonte === 'automatica' ? r.texto.slice(0, 200) : '', c: ctx(), em: new Date().toISOString().slice(0, 10) };
  clearTimeout(tVistos); tVistos = setTimeout(() => { const ks = Object.keys(vistos); if (ks.length > 3000) ks.slice(0, ks.length - 3000).forEach(k => delete vistos[k]); grava('pr_ajuda_vistos', JSON.stringify(vistos)); }, 800);
}
const INTERATIVOS = 'button, a[href], input:not([type=hidden]), select, textarea, summary, [role=tab], [role=button], label[for]';
function alvo(t) {
  if (!t || !t.closest) return null;
  if (t.closest('.pr-aj-ui')) return null;
  const e = t.closest(INTERATIVOS); if (!e) return null;
  if (e.tagName === 'LABEL') return e.control || null;
  return e;
}
// Para o teste e o relatório de cobertura: classifica todos os elementos interativos de uma área da tela.
function auditar(raiz) {
  raiz = raiz || document.body; const out = [];
  raiz.querySelectorAll(INTERATIVOS.replace(', label[for]', '')).forEach(el => {
    if (el.closest('.pr-aj-ui') || el.type === 'hidden' || el.closest('[aria-hidden="true"]') || (el.tagName !== 'SUMMARY' && el.closest('details:not([open])')) || !(el.offsetWidth || el.offsetHeight || el.getClientRects().length)) return;
    const r = resolver(el);
    out.push({ chave: r ? r.chave : (chaves(el)[0] || ''), fonte: r ? r.fonte : 'nenhuma', titulo: r ? r.titulo : textoDe(el), artigo: r ? r.artigo : null, tag: el.tagName.toLowerCase() });
  });
  return out;
}

/* ---------------------------------------------------------- texto com marcações simples ---------------------------------------------------------- */
// **negrito**, [[id-do-artigo|texto do link]] e quebras de linha. Tudo é escapado antes (nunca injeta HTML).
function fmt(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[\[([a-z0-9-]+)\|(.+?)\]\]/g, (m, id, t) => `<a href="${linkArtigo(id)}" data-aj-art="${id}">${t}</a>`)
    .replace(/\n/g, '<br>');
}
const BASE = (() => { const s = document.currentScript && document.currentScript.src; return s ? s.replace(/[^/]*$/, '') : ''; })();
const linkArtigo = id => BASE + 'ajuda.html?a=' + encodeURIComponent(id);
const srcImg = s => /^(https?:|data:image\/)/.test(s) ? s : BASE + String(s).replace(/^\.?\//, '');

/* ----------------------------------------------------------------- busca ----------------------------------------------------------------- */
function textoArtigo(a) {
  const s = a.secoes || {};
  return [a.titulo, a.resumo, (a.palavras || []).join(' '), s.oQueE, s.finalidade, (s.passos || []).join(' '), (s.exemplos || []).join(' '), (s.cuidados || []).join(' ')].join(' ');
}
function buscar(q, lista) {
  const ts = norm(q).split(/\s+/).filter(t => t.length > 1); if (!ts.length) return [];
  return (lista || artigos()).map(a => {
    const t = norm(a.titulo), p = norm((a.palavras || []).join(' ')), r = norm(a.resumo), b = norm(textoArtigo(a));
    let sc = 0;
    for (const x of ts) { const s0 = (t.includes(x) ? 6 : 0) + (p.includes(x) ? 4 : 0) + (r.includes(x) ? 2 : 0) + (b.includes(x) ? 1 : 0); if (!s0) return null; sc += s0; }
    return { a, sc };
  }).filter(Boolean).sort((x, y) => y.sc - x.sc).map(x => x.a);
}
function relacionados(a) {
  const ids = (a.relacionados || []).filter(id => id !== a.id && artigo(id)), out = ids.map(artigo);
  if (out.length < 3) artigos().filter(x => x.categoria === a.categoria && x.id !== a.id && !ids.includes(x.id)).slice(0, 3 - out.length).forEach(x => out.push(x));
  return out;
}

/* ----------------------------------------------------------- artigo em HTML (painel e página) ----------------------------------------------------------- */
const PUBLICO = { todos: 'Para todos', equipe: 'Para a equipe (área restrita)' };
function renderArtigo(a, modo) {
  if (!a) return '<p class="pr-aj-vazio">Artigo não encontrado. Ele pode ter sido retirado do ar.</p>';
  const s = a.secoes || {}, cat = categoria(a.categoria), lista = (arr, ord) => arr && arr.length ? `<${ord ? 'ol' : 'ul'}>${arr.map(x => `<li>${fmt(x)}</li>`).join('')}</${ord ? 'ol' : 'ul'}>` : '';
  const imgs = (a.imagens || []).filter(i => i && i.src).map(i => `<figure class="pr-aj-fig"><a href="${esc(srcImg(i.src))}" target="_blank" rel="noopener" title="Abrir a imagem em tamanho real"><img src="${esc(srcImg(i.src))}" alt="${esc(i.alt || i.legenda || '')}" loading="lazy"></a>${i.legenda ? `<figcaption>${fmt(i.legenda)}</figcaption>` : ''}</figure>`).join('');
  const rel = relacionados(a);
  const h = modo === 'pagina' ? 'h1' : 'h2', h2 = modo === 'pagina' ? 'h2' : 'h3';
  return `<article class="pr-aj-artigo" data-artigo="${esc(a.id)}">
    <p class="pr-aj-meta">${cat ? `<span class="pr-aj-chip"><i class="fas ${esc(cat.icone || 'fa-folder')}" aria-hidden="true"></i> ${esc(cat.nome)}</span>` : ''}<span class="pr-aj-chip pr-aj-chip-${esc(a.publico || 'todos')}">${esc(PUBLICO[a.publico] || PUBLICO.todos)}</span>${a.status === 'rascunho' ? '<span class="pr-aj-chip pr-aj-rasc">Rascunho (fora do ar)</span>' : ''}</p>
    <${h} class="pr-aj-titulo">${esc(a.titulo)}</${h}>
    ${a.resumo ? `<p class="pr-aj-resumo">${fmt(a.resumo)}</p>` : ''}
    ${s.oQueE ? `<section><${h2}><i class="fas fa-info-circle" aria-hidden="true"></i> O que é</${h2}><p>${fmt(s.oQueE)}</p></section>` : ''}
    ${s.finalidade ? `<section><${h2}><i class="fas fa-bullseye" aria-hidden="true"></i> Para que serve</${h2}><p>${fmt(s.finalidade)}</p></section>` : ''}
    ${s.passos && s.passos.length ? `<section class="pr-aj-passos"><${h2}><i class="fas fa-list-ol" aria-hidden="true"></i> Passo a passo</${h2}>${lista(s.passos, true)}</section>` : ''}
    ${imgs ? `<section class="pr-aj-imagens"><${h2}><i class="fas fa-image" aria-hidden="true"></i> Veja na tela</${h2}>${imgs}</section>` : ''}
    ${s.exemplos && s.exemplos.length ? `<section><${h2}><i class="fas fa-lightbulb" aria-hidden="true"></i> Exemplos práticos</${h2}>${lista(s.exemplos)}</section>` : ''}
    ${s.cuidados && s.cuidados.length ? `<section class="pr-aj-cuidados"><${h2}><i class="fas fa-exclamation-triangle" aria-hidden="true"></i> Cuidados e observações</${h2}>${lista(s.cuidados)}</section>` : ''}
    ${a.onde ? `<p class="pr-aj-onde"><i class="fas fa-map-signs" aria-hidden="true"></i> <strong>Onde fica:</strong> ${fmt(a.onde)}</p>` : ''}
    ${rel.length ? `<section class="pr-aj-rel"><${h2}><i class="fas fa-link" aria-hidden="true"></i> Conteúdos relacionados</${h2}><ul>${rel.map(r => `<li><a href="${linkArtigo(r.id)}" data-aj-art="${esc(r.id)}">${esc(r.titulo)}</a>${r.resumo ? `<small>${esc(r.resumo.length > 110 ? r.resumo.slice(0, 107) + '…' : r.resumo)}</small>` : ''}</li>`).join('')}</ul></section>` : ''}
    ${a.atualizadoEm ? `<p class="pr-aj-atual">Atualizado em ${esc(String(a.atualizadoEm).slice(0, 10).split('-').reverse().join('/'))}.</p>` : ''}
  </article>`;
}

/* ------------------------------------------------------------- interface (UI) ------------------------------------------------------------- */
const toque = () => window.matchMedia('(hover: none), (pointer: coarse)').matches;
const estreito = () => window.matchMedia('(max-width: 768px)').matches;
const dicasLigadas = () => le('pr_ajuda_dicas') !== 'off';
let ui = null, tecladoUltimo = false, modo = false;

function criaUI() {
  if (ui) return ui;
  if (!document.querySelector('link[href$="ajuda.css"]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = BASE + 'ajuda.css'; document.head.appendChild(l); }
  const mk = (tagN, attrs, html) => { const e = document.createElement(tagN); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); if (html) e.innerHTML = html; return e; };
  const tip = mk('div', { id: 'pr-aj-tip', role: 'tooltip', class: 'pr-aj-ui pr-aj-tip notranslate', translate: 'no', hidden: '' },
    '<span class="pr-aj-seta" aria-hidden="true"></span><strong class="pr-aj-tt"></strong><span class="pr-aj-tx"></span><span class="pr-aj-tl"><a class="pr-aj-mais" href="#">Saiba mais <i class="fas fa-arrow-right" aria-hidden="true"></i></a><small class="pr-aj-f1">F1: abrir explicação</small></span>');
  const card = mk('div', { id: 'pr-aj-card', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'pr-aj-card-t', class: 'pr-aj-ui pr-aj-card notranslate', translate: 'no', hidden: '' });
  const fundo = mk('div', { class: 'pr-aj-ui pr-aj-fundo', hidden: '' });
  const painel = mk('aside', { id: 'pr-aj-painel', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'pr-aj-painel-t', class: 'pr-aj-ui pr-aj-painel notranslate', translate: 'no', hidden: '' });
  const faixa = mk('div', { id: 'pr-aj-faixa', class: 'pr-aj-ui pr-aj-faixa', role: 'status', hidden: '' },
    '<i class="fas fa-hand-pointer" aria-hidden="true"></i><span>Modo ajuda ligado: ' + (toque() ? 'toque' : 'clique') + ' em qualquer botão, campo ou menu para ver a explicação. Nada é executado.</span><button type="button" class="pr-aj-faixa-sair">Sair do modo ajuda</button>');
  // O botão Ajuda é um link para a página ajuda.html (Central de Ajuda): nada de painel flutuante por cima da tela.
  const botao = mk('a', { href: BASE + 'ajuda.html', id: 'pr-aj-botao', class: 'pr-aj-ui pr-aj-botao', 'aria-label': 'Ajuda: abrir a Central de Ajuda' },
    '<i class="fas fa-question" aria-hidden="true"></i><span class="pr-aj-botao-tx">Ajuda</span>');
  const vivo = mk('div', { class: 'pr-aj-ui pr-aj-sr', 'aria-live': 'polite' });
  document.body.append(tip, fundo, card, painel, faixa, vivo);
  // Posição: item do menu principal, logo à esquerda de "Notícias" (antes, "Blogger") (ou no fim do menu, se a página não tiver o item).
  // Sem menu (páginas sem cabeçalho), continua flutuante no canto inferior esquerdo.
  const menu = document.querySelector('body > header nav');
  if (menu) {
    const not = menu.querySelector(':scope > .nav-dropdown > a[href="noticias.html"]');
    const blog = not ? not.parentElement : menu.querySelector(':scope > a[href="blogger.html"]'); // "Notícias" (com Blog e CONecta Retiro) ocupa o lugar do antigo "Blog"
    // Item de menu comum: sem o "?" e sem a classe do botão flutuante, para valerem as mesmas regras de fonte, cor e espaço dos demais itens
    botao.className = 'pr-aj-ui no-menu'; const ic = botao.querySelector('i'); if (ic) ic.remove(); botao.querySelector('span').className = '';
    if (/(^|\/)ajuda\.html$/.test(location.pathname)) { botao.classList.add('active'); botao.setAttribute('aria-current', 'page'); }
    if (blog) {
      // Ajuda e Blogger num mesmo grupo sem quebra de linha: a Ajuda fica sempre colada, à esquerda do Blogger
      const grupo = document.createElement('span'); grupo.className = 'nav-grupo-ajuda';
      menu.insertBefore(grupo, blog); grupo.append(botao, blog);
    } else menu.appendChild(botao);
  } else document.body.appendChild(botao);
  ui = { tip, card, fundo, painel, faixa, botao, vivo };
  posBotao(); window.addEventListener('resize', posBotao);
  faixa.querySelector('.pr-aj-faixa-sair').onclick = () => modoAjuda(false);
  tip.addEventListener('mouseenter', () => clearTimeout(tEsconde));
  tip.addEventListener('mouseleave', () => escondeTip(150));
  tip.querySelector('.pr-aj-mais').addEventListener('click', e => { e.preventDefault(); const r = tipAtual; escondeTip(0); if (r) abreDoResultado(r); });
  fundo.addEventListener('click', () => { fechaCard(); if (estreito()) fechaPainel(); });
  // links para artigos dentro do painel/cartão abrem no próprio painel
  [card, painel].forEach(box => box.addEventListener('click', e => {
    const a = e.target.closest('[data-aj-art]'); if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault(); fechaCard(); abrePainel(a.dataset.ajArt);
  }));
  return ui;
}
// No computador o (?) fica no cabeçalho, à esquerda do botão Entrar; no celular, flutuante no canto inferior esquerdo.
function posBotao() {
  if (!ui) return; const b = ui.botao;
  if (b.classList.contains('no-menu') || !b.classList.contains('no-topo') || estreito()) { b.style.right = ''; return; }
  const h = b.parentElement, ent = h.querySelector('.btn-entrar'), id = h.querySelector('#pr-idioma.no-topo');
  if (ent) b.style.right = (h.clientWidth - ent.offsetLeft + 10) + 'px';
  if (id) id.style.left = ''; // o seletor de idioma continua no canto esquerdo
}

/* --- dica rápida (tooltip) --- */
let tMostra = 0, tEsconde = 0, tipAtual = null, tipEl = null, aquecido = 0, candidato = null;
// Tempo com o mouse parado sobre o item até a dica aparecer (ms)
const ESPERA_DICA = 1200;       // botões e campos das páginas
const ESPERA_DICA_MENU = 5000;  // itens do menu principal (topo)
function agendaDica() {
  clearTimeout(tMostra);
  const c = candidato; if (!c) return;
  tMostra = setTimeout(() => { if (candidato === c && document.contains(c.el)) mostraTip(c.el, c.r, false); }, c.espera || ESPERA_DICA);
}
function posiciona(box, el, pref) {
  const r = el.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
  box.style.left = box.style.top = '0px'; box.style.maxWidth = Math.min(340, W - 16) + 'px';
  const w = box.offsetWidth, h = box.offsetHeight, gap = 10;
  let lado = pref || (r.top > h + gap + 70 ? 'cima' : 'baixo');
  if (lado === 'lado') lado = r.right + w + gap < W - 8 ? 'dir' : (r.left - w - gap > 8 ? 'esq' : 'baixo');
  if (lado === 'baixo' && r.bottom + h + gap > H - 8 && r.top > h + gap) lado = 'cima';
  let x, y;
  if (lado === 'dir') { x = r.right + gap; y = r.top + r.height / 2 - h / 2; }
  else if (lado === 'esq') { x = r.left - w - gap; y = r.top + r.height / 2 - h / 2; }
  else { x = r.left + r.width / 2 - w / 2; y = lado === 'cima' ? r.top - h - gap : r.bottom + gap; }
  x = Math.max(8, Math.min(x, W - w - 8)); y = Math.max(8, Math.min(y, H - h - 8));
  box.style.left = Math.round(x) + 'px'; box.style.top = Math.round(y) + 'px'; box.dataset.lado = lado;
  const s = box.querySelector('.pr-aj-seta');
  if (s) { if (lado === 'cima' || lado === 'baixo') { s.style.left = Math.max(12, Math.min(r.left + r.width / 2 - x, w - 12)) + 'px'; s.style.top = ''; } else { s.style.top = Math.max(12, Math.min(r.top + r.height / 2 - y, h - 12)) + 'px'; s.style.left = ''; } }
}
const ladoPref = el => el.closest('.nav-sub, .nav-sub2, .grupo-flutuante') ? 'lado' : (el.closest('body > header') ? 'baixo' : null);
function mostraTip(el, r, viaTeclado) {
  criaUI(); const t = ui.tip;
  t.querySelector('.pr-aj-tt').textContent = r.titulo;
  t.querySelector('.pr-aj-tx').textContent = r.texto;
  const mais = t.querySelector('.pr-aj-mais'), a = r.artigo && artigo(r.artigo);
  mais.hidden = !a; if (a) { mais.href = linkArtigo(a.id); mais.title = 'Abrir: ' + a.titulo; }
  t.querySelector('.pr-aj-f1').hidden = !viaTeclado;
  t.hidden = false; t.classList.add('on'); posiciona(t, el, ladoPref(el));
  if (tipEl && tipEl !== el) desliga(tipEl);
  tipEl = el; tipAtual = r; aquecido = Date.now();
  const db0 = el.getAttribute('aria-describedby') || '';
  if (!/\bpr-aj-tip\b/.test(db0)) { el.dataset.ajudaDb = db0; el.setAttribute('aria-describedby', (db0 + ' pr-aj-tip').trim()); }
}
function desliga(el) {
  if (!el || el.dataset.ajudaDb === undefined) return;
  const v = el.dataset.ajudaDb; if (v) el.setAttribute('aria-describedby', v); else el.removeAttribute('aria-describedby'); delete el.dataset.ajudaDb;
}
function escondeTip(ms) {
  clearTimeout(tMostra); clearTimeout(tEsconde);
  const f = () => { if (!ui) return; ui.tip.hidden = true; ui.tip.classList.remove('on'); desliga(tipEl); tipEl = null; tipAtual = null; };
  if (ms) tEsconde = setTimeout(f, ms); else f();
}

/* --- cartão (explicação aberta; no celular, folha que sobe da parte de baixo) --- */
let cardEl = null, cardFoco = null, cardY = 0;
function abreCard(el, r) {
  criaUI(); escondeTip(0);
  const c = ui.card, folha = estreito() || toque();
  cardFoco = document.activeElement; cardEl = el; cardY = window.scrollY;
  c.classList.toggle('folha', folha); c.setAttribute('aria-modal', folha ? 'true' : 'false');
  const a = r && r.artigo && artigo(r.artigo), edit = podeEditar() && gravavel() && r;
  c.innerHTML = r ? `<div class="pr-aj-card-cab"><span class="pr-aj-pega" aria-hidden="true"></span><h2 id="pr-aj-card-t"><i class="fas fa-info-circle" aria-hidden="true"></i> ${esc(r.titulo)}</h2><button type="button" class="pr-aj-x" data-fecha aria-label="Fechar explicação"><i class="fas fa-times" aria-hidden="true"></i></button></div>
    <p class="pr-aj-card-tx">${esc(r.texto)}</p>
    ${a ? `<button type="button" class="pr-aj-btn pr-aj-btn-p" data-art="${esc(a.id)}"><i class="fas fa-book-open" aria-hidden="true"></i> Saiba mais: ${esc(a.titulo)}</button>` : ''}
    <div class="pr-aj-card-rod">${edit ? `<button type="button" class="pr-aj-lnk" data-edita><i class="fas fa-pen" aria-hidden="true"></i> Editar esta explicação</button>` : ''}<button type="button" class="pr-aj-lnk" data-central><i class="fas fa-question-circle" aria-hidden="true"></i> Central de Ajuda</button></div>
    ${edit ? `<p class="pr-aj-chave">Chave: <code>${esc(r.chave)}</code> · ${r.fonte === 'escrita' ? (r.origem === 'base' ? 'texto escrito' : 'texto editado aqui') : 'texto automático (ainda sem explicação escrita)'}</p>` : ''}`
    : `<div class="pr-aj-card-cab"><h2 id="pr-aj-card-t"><i class="fas fa-info-circle" aria-hidden="true"></i> Sem explicação específica</h2><button type="button" class="pr-aj-x" data-fecha aria-label="Fechar"><i class="fas fa-times" aria-hidden="true"></i></button></div>
    <p class="pr-aj-card-tx">Este item ainda não tem uma explicação própria. Veja a ajuda desta tela na Central de Ajuda.</p><button type="button" class="pr-aj-btn pr-aj-btn-p" data-central><i class="fas fa-question-circle" aria-hidden="true"></i> Ajuda desta tela</button>`;
  c.hidden = false; ui.fundo.hidden = !folha; ui.fundo.classList.toggle('on', folha);
  if (!folha && el) posiciona(c, el, null); else { c.style.left = c.style.top = c.style.maxWidth = ''; }
  c.querySelector('[data-fecha]').onclick = fechaCard;
  const b = c.querySelector('[data-art]'); if (b) b.onclick = () => { fechaCard(); abrePainel(b.dataset.art); };
  c.querySelectorAll('[data-central]').forEach(x => x.onclick = () => { fechaCard(); abrePainel(); });
  const ed = c.querySelector('[data-edita]'); if (ed) ed.onclick = () => editaDica(r);
  (c.querySelector('[data-art]') || c.querySelector('[data-fecha]')).focus();
}
function fechaCard() {
  if (!ui || ui.card.hidden) return;
  ui.card.hidden = true; if (ui.painel.hidden || !estreito()) { ui.fundo.hidden = true; ui.fundo.classList.remove('on'); }
  const f = cardFoco; cardFoco = null; cardEl = null; if (f && f.focus && document.contains(f) && !modo) try { f.focus({ preventScroll: true }); } catch (e) { /* ignora */ }
}
// Edição rápida (administrador ou Responsável pela Central de Ajuda): grava em ajuda_dicas, sem mexer no código.
function editaDica(r) {
  const c = ui.card, arts = conteudo().artigos.slice().sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
  const ed = (dbx().get('ajuda_dicas', []) || []).find(x => x.id === r.chave);
  { const o = conteudo().dicas.get(r.chave); if (o && o.texto) r = { ...r, titulo: o.titulo || r.titulo, texto: o.texto }; } // edita sempre o original em português
  c.innerHTML = `<div class="pr-aj-card-cab"><h2 id="pr-aj-card-t"><i class="fas fa-pen" aria-hidden="true"></i> Editar explicação</h2><button type="button" class="pr-aj-x" data-fecha aria-label="Fechar sem salvar"><i class="fas fa-times" aria-hidden="true"></i></button></div>
  <form class="pr-aj-form" novalidate><p class="pr-aj-chave">Chave: <code>${esc(r.chave)}</code></p>
  <label>Título curto<input name="t" maxlength="80" value="${esc(r.titulo)}"></label>
  <label>Explicação (1 a 3 frases: o que é, o que acontece, como usar)<textarea name="x" rows="4" maxlength="400">${esc(r.texto)}</textarea></label>
  <label>“Saiba mais” leva ao artigo<select name="a"><option value="">(artigo da tela)</option>${arts.map(a => `<option value="${esc(a.id)}"${a.id === r.artigo ? ' selected' : ''}>${esc(a.titulo)}</option>`).join('')}</select></label>
  <p class="pr-aj-erro" role="alert" hidden></p>
  <div class="pr-aj-card-rod"><button class="pr-aj-btn pr-aj-btn-p"><i class="fas fa-save" aria-hidden="true"></i> Salvar</button>${ed ? '<button type="button" class="pr-aj-lnk" data-restaura>Voltar ao texto original</button>' : ''}</div></form>`;
  c.querySelector('[data-fecha]').onclick = fechaCard;
  const f = c.querySelector('form');
  f.onsubmit = e => {
    e.preventDefault(); const t = f.t.value.trim(), x = f.x.value.trim();
    if (x.length < 10) { const er = f.querySelector('.pr-aj-erro'); er.textContent = 'Escreva uma explicação (pelo menos 10 caracteres).'; er.hidden = false; return; }
    const u = usuario(), l = (dbx().get('ajuda_dicas', []) || []).filter(d => d.id !== r.chave);
    l.push({ id: r.chave, titulo: t, texto: x, artigo: f.a.value, em: new Date().toISOString(), por: u ? u.nome : '' });
    dbx().set('ajuda_dicas', l); invalida(); fechaCard(); avisa('Explicação salva.');
  };
  const rs = c.querySelector('[data-restaura]');
  if (rs) rs.onclick = () => { dbx().set('ajuda_dicas', (dbx().get('ajuda_dicas', []) || []).filter(d => d.id !== r.chave)); invalida(); fechaCard(); avisa('Texto original restaurado.'); };
  f.t.focus();
}
const avisa = m => { if (ui) { ui.vivo.textContent = ''; setTimeout(() => { ui.vivo.textContent = m; }, 30); } };

/* --- painel lateral: ajuda desta tela, busca, categorias e artigos --- */
let painelFoco = null, pilha = [];
function abrePainel(artId, opts) {
  criaUI(); escondeTip(0); fechaCard();
  const p = ui.painel; if (p.hidden) { painelFoco = document.activeElement; pilha = []; }
  p.hidden = false; requestAnimationFrame(() => p.classList.add('on'));
  ui.botao.setAttribute('aria-expanded', 'true');
  const m = estreito(); p.setAttribute('aria-modal', m ? 'true' : 'false'); ui.fundo.hidden = !m; ui.fundo.classList.toggle('on', m);
  if (artId) vaiPara({ v: 'artigo', id: artId }); else if (opts && opts.busca) vaiPara({ v: 'busca', q: opts.busca }); else vaiPara({ v: 'inicio' });
}
function fechaPainel() {
  if (!ui || ui.painel.hidden) return;
  ui.painel.classList.remove('on'); ui.painel.hidden = true; ui.fundo.hidden = true; ui.fundo.classList.remove('on');
  ui.botao.setAttribute('aria-expanded', 'false');
  const f = painelFoco; painelFoco = null; if (f && f.focus && document.contains(f)) try { f.focus({ preventScroll: true }); } catch (e) { /* ignora */ }
}
function vaiPara(est, voltar) {
  if (!voltar && ui.painel.dataset.v) pilha.push(JSON.parse(ui.painel.dataset.v));
  ui.painel.dataset.v = JSON.stringify(est); desenhaPainel(est);
}
function desenhaPainel(est) {
  const p = ui.painel, ctxArt = artigoDoContexto(), cats = exib().categorias;
  let corpo = '', titulo = 'Central de Ajuda';
  if (est.v === 'artigo') { const a = artigo(est.id); titulo = a ? a.titulo : 'Artigo'; corpo = renderArtigo(a, 'painel'); }
  else if (est.v === 'cat') {
    const c = categoria(est.id), l = artigos().filter(a => a.categoria === est.id).sort((a, b) => (a.ordem || 99) - (b.ordem || 99) || a.titulo.localeCompare(b.titulo, 'pt-BR'));
    titulo = c ? c.nome : 'Categoria'; corpo = `${c && c.descricao ? `<p class="pr-aj-resumo">${esc(c.descricao)}</p>` : ''}${listaArt(l)}`;
  } else if (est.v === 'busca') {
    const r = buscar(est.q); titulo = 'Busca';
    corpo = r.length ? `<p class="pr-aj-n">${r.length} resultado(s) para “${esc(est.q)}”.</p>${listaArt(r)}` : `<p class="pr-aj-vazio">Nada encontrado para “${esc(est.q)}”. Tente outra palavra (por exemplo: reserva, backup, foto, senha) ou navegue pelas categorias.</p>${listaCats(cats)}`;
  } else {
    const a = ctxArt && artigo(ctxArt), rel = a ? relacionados(a).slice(0, 3) : [];
    corpo = `${a ? `<section class="pr-aj-nesta"><h3>Ajuda desta tela</h3><button type="button" class="pr-aj-destaque" data-aj-art="${esc(a.id)}"><strong>${esc(a.titulo)}</strong><span>${esc(a.resumo || '')}</span></button>${rel.length ? `<ul class="pr-aj-mini">${rel.map(r => `<li><a href="${linkArtigo(r.id)}" data-aj-art="${esc(r.id)}">${esc(r.titulo)}</a></li>`).join('')}</ul>` : ''}</section>` : ''}
    <section class="pr-aj-opcoes"><h3>Como receber ajuda</h3>
      <button type="button" class="pr-aj-btn${modo ? ' pr-aj-btn-on' : ''}" data-modo aria-pressed="${modo}"><i class="fas fa-hand-pointer" aria-hidden="true"></i> ${modo ? 'Desligar' : 'Ligar'} o modo ajuda</button>
      <p class="pr-aj-pq">${toque() ? 'Com o modo ajuda ligado, toque em qualquer item para ver o que ele faz. Fora dele: toque longo em um botão, ou toque no símbolo <i class="fas fa-info-circle" aria-hidden="true"></i> ao lado de um campo.' : 'Com o modo ajuda ligado, clique em qualquer item para ver o que ele faz. Fora dele, basta parar o mouse sobre um item. No menu do topo, a dica aparece depois de 5 segundos com o mouse parado (ou segurando o botão esquerdo). Pelo teclado: Tab até o item e F1 para abrir a explicação.'}</p>
      ${toque() ? '' : `<label class="pr-aj-chk"><input type="checkbox" data-dicas${dicasLigadas() ? ' checked' : ''}> Mostrar dicas ao passar o mouse</label>`}
    </section>
    <section><h3>Categorias</h3>${listaCats(cats)}</section>`;
  }
  p.innerHTML = `<div class="pr-aj-pcab">${pilha.length ? '<button type="button" class="pr-aj-x" data-volta aria-label="Voltar"><i class="fas fa-arrow-left" aria-hidden="true"></i></button>' : '<i class="fas fa-question-circle pr-aj-pico" aria-hidden="true"></i>'}<h2 id="pr-aj-painel-t">${esc(titulo)}</h2><button type="button" class="pr-aj-x" data-fecha aria-label="Fechar a ajuda"><i class="fas fa-times" aria-hidden="true"></i></button></div>
  <form class="pr-aj-busca" role="search"><label class="pr-aj-sr" for="pr-aj-q">Buscar na ajuda</label><i class="fas fa-search" aria-hidden="true"></i><input id="pr-aj-q" type="search" placeholder="Buscar na ajuda (ex.: reserva, backup, foto)" value="${est.v === 'busca' ? esc(est.q) : ''}" autocomplete="off"></form>
  <div class="pr-aj-pcorpo" tabindex="-1">${corpo}</div>
  <div class="pr-aj-prod"><a href="${est.v === 'artigo' ? linkArtigo(est.id) : BASE + 'ajuda.html'}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt" aria-hidden="true"></i> Abrir na Central de Ajuda completa</a>${podeEditar() && est.v === 'artigo' && pagina() === 'area-restrita' ? ` <button type="button" class="pr-aj-lnk" data-edart="${esc(est.id)}"><i class="fas fa-pen" aria-hidden="true"></i> Editar artigo</button>` : ''}</div>`;
  p.querySelector('[data-fecha]').onclick = fechaPainel;
  const v = p.querySelector('[data-volta]'); if (v) v.onclick = () => { const e = pilha.pop(); ui.painel.dataset.v = JSON.stringify(e); desenhaPainel(e); };
  p.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => vaiPara({ v: 'cat', id: b.dataset.cat }));
  const md = p.querySelector('[data-modo]'); if (md) md.onclick = () => { modoAjuda(!modo); if (modo) fechaPainel(); else desenhaPainel(est); };
  const dc = p.querySelector('[data-dicas]'); if (dc) dc.onchange = () => grava('pr_ajuda_dicas', dc.checked ? 'on' : 'off');
  const ea = p.querySelector('[data-edart]'); if (ea) ea.onclick = () => { fechaPainel(); if (window.PR_AJUDA_ADMIN) window.PR_AJUDA_ADMIN.editarArtigo(ea.dataset.edart); };
  const q = p.querySelector('#pr-aj-q'); let tq = 0;
  p.querySelector('.pr-aj-busca').onsubmit = e => { e.preventDefault(); if (q.value.trim()) vaiPara({ v: 'busca', q: q.value.trim() }); };
  q.oninput = () => { clearTimeout(tq); tq = setTimeout(() => { const s = q.value.trim(); if (s.length >= 3) { const pos = q.selectionStart; vaiPara({ v: 'busca', q: s }, est.v === 'busca'); const q2 = ui.painel.querySelector('#pr-aj-q'); q2.focus(); try { q2.setSelectionRange(pos, pos); } catch (e) { /* ignora */ } } }, 350); };
  const alvoFoco = est.v === 'busca' ? null : (est.v === 'inicio' && !pilha.length ? q : p.querySelector('.pr-aj-pcorpo'));
  if (alvoFoco) alvoFoco.focus({ preventScroll: true });
  p.querySelector('.pr-aj-pcorpo').scrollTop = 0;
}
const listaArt = l => l.length ? `<ul class="pr-aj-lista">${l.map(a => `<li><a href="${linkArtigo(a.id)}" data-aj-art="${esc(a.id)}"><strong>${esc(a.titulo)}</strong>${a.resumo ? `<span>${esc(a.resumo)}</span>` : ''}</a></li>`).join('')}</ul>` : '<p class="pr-aj-vazio">Nenhum artigo nesta categoria.</p>';
const listaCats = cs => `<ul class="pr-aj-cats">${cs.map(c => { const n = artigos().filter(a => a.categoria === c.id).length; return n ? `<li><button type="button" data-cat="${esc(c.id)}"><i class="fas ${esc(c.icone || 'fa-folder')}" aria-hidden="true"></i><span><strong>${esc(c.nome)}</strong><small>${n} artigo(s)</small></span></button></li>` : ''; }).join('')}</ul>`;
function abreDoResultado(r) { if (r && r.artigo && artigo(r.artigo)) abrePainel(r.artigo); else abrePainel(); }

/* --- modo ajuda --- */
function modoAjuda(on) {
  criaUI(); modo = !!on; try { sessionStorage.setItem('pr_aj_modo', modo ? '1' : ''); } catch (e) { /* sem armazenamento */ }
  document.documentElement.classList.toggle('pr-aj-modo', modo); ui.faixa.hidden = !modo;
  if (modo) { escondeTip(0); varrer(); avisa('Modo ajuda ligado.'); } else { fechaCard(); avisa('Modo ajuda desligado.'); }
}

/* --- varredura: marca o que tem ajuda, descrição para leitores de tela e símbolo (i) nos campos (celular) --- */
let tVarre = 0;
function varrer() {
  const raiz = document.body; if (!raiz) return;
  const marcaI = toque();
  raiz.querySelectorAll(INTERATIVOS.replace(', label[for]', '')).forEach(el => {
    if (el.closest('.pr-aj-ui') || el.type === 'hidden') return;
    const r = resolver(el); el.classList.toggle('pr-aj-tem', !!r);
    if (!r) return;
    const desc = r.titulo + ': ' + r.texto;
    if (el.getAttribute('aria-description') !== desc) el.setAttribute('aria-description', desc);
    // título nativo do navegador duplicaria a nossa dica: guardado em data-titulo-orig (o nome acessível é preservado)
    if (el.hasAttribute('title') && !el.closest('#pr-idioma')) { const t = el.getAttribute('title'); if (!el.getAttribute('aria-label') && !limpa(el.innerText)) el.setAttribute('aria-label', t); el.setAttribute('data-titulo-orig', t); el.removeAttribute('title'); }
    if (marcaI && r.fonte === 'escrita' && el.labels && el.labels[0] && !el.labels[0].querySelector('.pr-aj-i') && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
      const i = document.createElement('span'); i.className = 'pr-aj-i pr-aj-ui'; i.setAttribute('role', 'button'); i.setAttribute('aria-hidden', 'true'); i.dataset.para = '1';
      i._alvo = el; el.labels[0].appendChild(i);
    }
  });
}
const agenda = () => { clearTimeout(tVarre); tVarre = setTimeout(() => (window.requestIdleCallback || (f => f()))(varrer), 300); };

/* --------------------------------------------------------------- eventos ---------------------------------------------------------------- */
function liga() {
  document.addEventListener('keydown', e => { if (e.key === 'Tab' || e.key === 'F1' || /^Arrow/.test(e.key)) tecladoUltimo = true; }, true);
  document.addEventListener('pointerdown', e => { tecladoUltimo = false; if (tipEl && !e.target.closest('.pr-aj-tip')) escondeTip(0); }, true);
  // passar o mouse
  document.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse' || modo || !dicasLigadas()) return;
    if (e.target.closest && e.target.closest('.pr-aj-tip')) { clearTimeout(tEsconde); return; }
    const el = alvo(e.target); if (!el || el === tipEl) { if (el === tipEl) clearTimeout(tEsconde); return; }
    const r = resolver(el); clearTimeout(tMostra);
    if (!r) { if (tipEl) escondeTip(120); return; }
    // Menu principal: a caixinha só aparece depois de 5 s com o mouse parado, tempo para a pessoa escolher para onde ir
    candidato = { el, r, espera: el.closest('body > header') ? ESPERA_DICA_MENU : ESPERA_DICA }; agendaDica();
  });
  // A dica só aparece quando o mouse PARA sobre o item: enquanto ele se mexe, a contagem recomeça.
  // Assim, quem só está passando o mouse para procurar onde clicar não é interrompido.
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !candidato || tipEl === candidato.el) return;
    if (!candidato.el.contains(e.target)) { candidato = null; clearTimeout(tMostra); return; }
    agendaDica();
  }, { passive: true });
  document.addEventListener('pointerout', e => {
    if (e.pointerType !== 'mouse') return;
    const el = alvo(e.target), para = e.relatedTarget;
    if (para && para.closest && (para.closest('.pr-aj-tip') || (el && el.contains(para)))) return;
    clearTimeout(tMostra); candidato = null; if (tipEl) escondeTip(200);
  });
  // teclado: a dica aparece ao chegar no item com Tab; F1 (ou ? fora de campos de texto) abre a explicação completa
  document.addEventListener('focusin', e => {
    if (!tecladoUltimo || modo || !dicasLigadas()) return;
    const el = alvo(e.target); if (!el) return; const r = resolver(el);
    if (r) mostraTip(el, r, true); else if (tipEl) escondeTip(0);
  });
  document.addEventListener('focusout', e => { if (tipEl && e.target === tipEl) escondeTip(150); });
  document.addEventListener('keydown', e => {
    const digitando = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '') || (e.target && e.target.isContentEditable);
    if (e.key === 'Escape') {
      if (ui && !ui.tip.hidden) { escondeTip(0); e.stopPropagation(); return; }
      if (ui && !ui.card.hidden) { fechaCard(); e.stopPropagation(); return; }
      if (ui && !ui.painel.hidden) { fechaPainel(); e.stopPropagation(); return; }
      if (modo) { modoAjuda(false); return; }
      return;
    }
    if (e.key === 'F1' || (e.key === '?' && !digitando && !e.ctrlKey && !e.metaKey && !e.altKey)) {
      e.preventDefault();
      const foco = document.activeElement, el = foco && !foco.closest('.pr-aj-ui') ? alvo(foco) : null, r = el && resolver(el);
      if (r) abreCard(el, r); else abrePainel();
    }
    if (e.key === 'Tab' && ui) prendeFoco(e);
  });
  // modo ajuda: o clique mostra a explicação e não executa nada
  const intercepta = e => {
    if (!modo || !e.target.closest || e.target.closest('.pr-aj-ui')) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (e.type !== 'click') return;
    const el = alvo(e.target); abreCard(el || e.target, el ? resolver(el) : null);
  };
  ['mousedown', 'pointerdown', 'click', 'submit', 'dblclick'].forEach(t => document.addEventListener(t, intercepta, true));
  // símbolo (i) dos campos e toque longo (celular)
  document.addEventListener('click', e => {
    const i = e.target.closest && e.target.closest('.pr-aj-i'); if (!i || modo) return;
    e.preventDefault(); e.stopPropagation(); const el = i._alvo; if (el) abreCard(el, resolver(el));
  }, true);
  let tLongo = 0, ini = null, longo = false;
  document.addEventListener('pointerdown', e => {
    if (modo) return;
    // Menu principal no computador: segurar o botão esquerdo do mouse sobre o item mostra a caixinha de ajuda
    // (o clique normal continua abrindo a página). No celular: toque longo, como em todo o site.
    const menuMouse = e.pointerType === 'mouse' && e.button === 0 && e.target.closest && e.target.closest('body > header');
    if (e.pointerType !== 'touch' && !menuMouse) return;
    const el = alvo(e.target); if (!el || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    const r = resolver(el); if (!r) return;
    ini = { x: e.clientX, y: e.clientY }; longo = false; clearTimeout(tLongo);
    tLongo = setTimeout(() => {
      longo = true;
      if (menuMouse) { mostraTip(el, r, false); return; }
      if (navigator.vibrate) try { navigator.vibrate(15); } catch (x) { /* ignora */ }
      abreCard(el, r);
    }, menuMouse ? 500 : 550);
  }, true);
  document.addEventListener('pointermove', e => { if (ini && Math.hypot(e.clientX - ini.x, e.clientY - ini.y) > 10 && !longo) { clearTimeout(tLongo); ini = null; } }, true);
  ['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, () => { clearTimeout(tLongo); ini = null; }, true));
  document.addEventListener('click', e => { if (longo) { longo = false; e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('dragstart', e => { if (longo || (ini && e.target.closest && e.target.closest('body > header'))) e.preventDefault(); }, true);
  document.addEventListener('contextmenu', e => { if (longo || (ui && !ui.card.hidden && e.pointerType === 'touch')) e.preventDefault(); }, true);
  window.addEventListener('scroll', () => { if (tipEl) escondeTip(0); if (ui && !ui.card.hidden && !ui.card.classList.contains('folha') && Math.abs(window.scrollY - cardY) > 80) fechaCard(); }, { passive: true });
  if (window.MutationObserver) new MutationObserver(ms => { if (ms.some(m => !(m.target.closest && m.target.closest('.pr-aj-ui')))) { invalidaParcial(); agenda(); } }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('storage', e => { if (e.key && /^pr_ajuda_/.test(e.key)) invalida(); });
}
const invalidaParcial = () => { if (tipEl && !document.contains(tipEl)) escondeTip(0); };
// mantém o foco dentro da folha (celular) ou do painel modal
function prendeFoco(e) {
  const box = !ui.card.hidden && ui.card.getAttribute('aria-modal') === 'true' ? ui.card : (!ui.painel.hidden && ui.painel.getAttribute('aria-modal') === 'true' ? ui.painel : null);
  if (!box) return;
  const f = [...box.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(x => !x.disabled && x.offsetParent !== null);
  if (!f.length) return; const a = f[0], z = f[f.length - 1];
  if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
}

/* ---------------------------------------------------------- página ajuda.html ---------------------------------------------------------- */
function paginaCentral(raiz) {
  const pr = new URLSearchParams(location.search);
  let estado = { a: pr.get('a') || '', c: pr.get('c') || '', q: pr.get('q') || '', p: pr.get('p') || '' };
  const url = s => 'ajuda.html' + (s.a ? '?a=' + encodeURIComponent(s.a) : s.q ? '?q=' + encodeURIComponent(s.q) : s.c ? '?c=' + encodeURIComponent(s.c) : s.p ? '?p=' + s.p : '');
  const vai = (s, push) => { estado = s; if (push !== false) history.pushState(s, '', url(s)); desenha(); window.scrollTo(0, 0); };
  window.addEventListener('popstate', e => { estado = e.state || { a: '', c: '', q: '', p: '' }; desenha(); });
  function desenha() {
    const cats = exib().categorias, todos = artigos().filter(a => !estado.p || (a.publico || 'todos') === estado.p);
    const cab = `<div class="pr-aj-trilha" role="navigation" aria-label="Você está em"><a href="ajuda.html" data-ir="{}">Central de Ajuda</a>${estado.c || estado.a ? (() => { const a = estado.a && artigo(estado.a), c = categoria(estado.c || (a && a.categoria)); return (c ? ` <span aria-hidden="true">›</span> <a href="ajuda.html?c=${esc(c.id)}" data-ir='${esc(JSON.stringify({ c: c.id }))}'>${esc(c.nome)}</a>` : '') + (a ? ` <span aria-hidden="true">›</span> <span aria-current="page">${esc(a.titulo)}</span>` : ''); })() : estado.q ? ' <span aria-hidden="true">›</span> <span aria-current="page">Busca</span>' : ''}</div>
    <form class="pr-aj-busca pr-aj-busca-g" role="search"><label class="pr-aj-sr" for="pa-q">Buscar na Central de Ajuda</label><i class="fas fa-search" aria-hidden="true"></i><input id="pa-q" type="search" placeholder="O que você quer fazer? Ex.: pedir reserva, cadastrar livro, fazer backup" value="${esc(estado.q)}" autocomplete="off"><button class="btn-visit">Buscar</button></form>`;
    let corpo = '';
    if (estado.a) {
      const a = artigo(estado.a), irmaos = a ? artigos().filter(x => x.categoria === a.categoria).sort((x, y) => (x.ordem || 99) - (y.ordem || 99) || x.titulo.localeCompare(y.titulo, 'pt-BR')) : [];
      corpo = `<div class="pr-aj-pg-art"><div class="pr-aj-pg-main">${renderArtigo(a, 'pagina')}<p class="pr-aj-util"><a href="ajuda.html" data-ir="{}"><i class="fas fa-th-large" aria-hidden="true"></i> Ver todas as categorias</a></p></div>
      ${irmaos.length > 1 ? `<aside class="pr-aj-pg-lado" aria-label="Outros artigos desta categoria"><h2>Nesta categoria</h2><ul>${irmaos.map(x => `<li><a href="${linkArtigo(x.id)}" data-aj-pg="${esc(x.id)}"${x.id === a.id ? ' aria-current="page"' : ''}>${esc(x.titulo)}</a></li>`).join('')}</ul></aside>` : ''}</div>`;
      if (a) document.title = a.titulo + ' | Central de Ajuda | Parque de Estudo e Reflexão Retiro';
    } else if (estado.q) {
      const r = buscar(estado.q, todos);
      corpo = `<h2 class="section-title">Resultados para “${esc(estado.q)}”</h2>${r.length ? cartoes(r) : '<p class="pr-aj-vazio">Nada encontrado. Tente outra palavra ou escolha uma categoria abaixo.</p>' + gradeCats(cats, todos)}`;
    } else if (estado.c) {
      const c = categoria(estado.c), l = todos.filter(a => a.categoria === estado.c).sort((x, y) => (x.ordem || 99) - (y.ordem || 99) || x.titulo.localeCompare(y.titulo, 'pt-BR'));
      corpo = `<h2 class="section-title"><i class="fas ${esc(c ? c.icone : 'fa-folder')}" aria-hidden="true"></i> ${esc(c ? c.nome : 'Categoria')}</h2>${c && c.descricao ? `<p class="lead-text">${esc(c.descricao)}</p>` : ''}${cartoes(l)}`;
    } else {
      corpo = `${!logado() ? '' : `<div class="pr-aj-filtro" role="group" aria-label="Mostrar artigos">${[['', 'Todos'], ['todos', 'Para visitantes'], ['equipe', 'Para a equipe']].map(([v, t]) => `<button type="button" class="tab-btn${estado.p === v ? ' active' : ''}" aria-pressed="${estado.p === v}" data-p="${v}">${t}</button>`).join('')}</div>`}
      <div class="pr-aj-comecar"><button type="button" class="pr-aj-destaque" data-aj-pg="como-usar-a-ajuda"><i class="fas fa-question-circle" aria-hidden="true"></i><strong>Primeira vez aqui?</strong><span>Veja como funcionam as dicas, o modo ajuda e esta Central.</span></button></div>
      <section class="pr-aj-opcoes pr-aj-opcoes-pg"><h2 class="section-title">Como receber ajuda nas telas</h2>
        <button type="button" class="pr-aj-btn${modo ? ' pr-aj-btn-on' : ''}" data-modo-pg aria-pressed="${modo}"><i class="fas fa-hand-pointer" aria-hidden="true"></i> ${modo ? 'Desligar' : 'Ligar'} o modo ajuda</button>
        <p class="pr-aj-pq">${toque() ? 'Com o modo ajuda ligado, toque em qualquer item de qualquer página para ver o que ele faz, sem executar nada.' : 'Com o modo ajuda ligado, clique em qualquer item de qualquer página para ver o que ele faz, sem executar nada. Fora dele, basta parar o mouse sobre um item. No menu do topo, a dica aparece depois de 5 segundos com o mouse parado (ou segurando o botão esquerdo). Pelo teclado: Tab até o item e F1 para abrir a explicação.'}</p>
        ${toque() ? '' : `<label class="pr-aj-chk"><input type="checkbox" data-dicas-pg${dicasLigadas() ? ' checked' : ''}> Mostrar dicas ao passar o mouse</label>`}
      </section>
      ${gradeCats(cats, todos)}`;
    }
    raiz.innerHTML = cab + corpo;
    const q = raiz.querySelector('#pa-q');
    raiz.querySelector('.pr-aj-busca').onsubmit = e => { e.preventDefault(); const s = q.value.trim(); if (s) vai({ q: s, p: estado.p }); };
    raiz.querySelectorAll('[data-ir]').forEach(a => a.onclick = e => { e.preventDefault(); vai({ a: '', c: '', q: '', p: '', ...JSON.parse(a.dataset.ir) }); });
    raiz.querySelectorAll('[data-pcat]').forEach(a => a.onclick = e => { e.preventDefault(); vai({ c: a.dataset.pcat, p: estado.p }); });
    raiz.querySelectorAll('[data-aj-pg], .pr-aj-artigo [data-aj-art]').forEach(a => a.onclick = e => { if (e.ctrlKey || e.metaKey) return; e.preventDefault(); vai({ a: a.dataset.ajPg || a.dataset.ajArt }); });
    raiz.querySelectorAll('[data-p]').forEach(b => b.onclick = () => vai({ p: b.dataset.p }));
    raiz.querySelectorAll('[data-modo-pg]').forEach(b => b.onclick = () => { modoAjuda(!modo); desenha(); });
    raiz.querySelectorAll('[data-dicas-pg]').forEach(c => c.onchange = () => grava('pr_ajuda_dicas', c.checked ? 'on' : 'off'));
  }
  const cartoes = l => l.length ? `<div class="pr-aj-grade">${l.map(a => `<a class="card pr-aj-cartao" href="${linkArtigo(a.id)}" data-aj-pg="${esc(a.id)}"><h3>${esc(a.titulo)}</h3>${a.resumo ? `<p>${esc(a.resumo)}</p>` : ''}<span class="pr-aj-chip pr-aj-chip-${esc(a.publico || 'todos')}">${esc(PUBLICO[a.publico] || PUBLICO.todos)}</span></a>`).join('')}</div>` : '<p class="pr-aj-vazio">Nenhum artigo aqui ainda.</p>';
  const gradeCats = (cats, todos) => `<div class="pr-aj-grade pr-aj-grade-cats">${cats.map(c => { const l = todos.filter(a => a.categoria === c.id); return l.length ? `<a class="card pr-aj-cartao-cat" href="ajuda.html?c=${esc(c.id)}" data-pcat="${esc(c.id)}"><i class="fas ${esc(c.icone || 'fa-folder')}" aria-hidden="true"></i><h3>${esc(c.nome)}</h3>${c.descricao ? `<p>${esc(c.descricao)}</p>` : ''}<small>${l.length} artigo(s)</small></a>` : ''; }).join('')}</div>`;
  history.replaceState(estado, '', location.href);
  desenha();
  document.addEventListener('pr-idioma', () => { cacheEx = null; desenha(); });
}

// A moldura da ajuda (botões, títulos, avisos) só é traduzida pelo motor de idiomas quando há tradução do conteúdo
// para o idioma escolhido; nos outros idiomas fica toda em português, para não misturar.
function marcaTraducao() {
  const L = idiomaAtual(), ok = L !== 'pt' && !!(window.PR_AJUDA_TRAD && window.PR_AJUDA_TRAD[L]);
  document.querySelectorAll('#central-ajuda, .pr-aj-ui').forEach(el => { el.classList.toggle('notranslate', !ok); if (ok) el.removeAttribute('translate'); else el.setAttribute('translate', 'no'); });
}
/* ------------------------------------------------------------------ início ------------------------------------------------------------------ */
function inicia() {
  criaUI(); liga(); varrer();
  if (sess('pr_aj_modo') === '1') modoAjuda(true);
  const raiz = document.getElementById('central-ajuda'); if (raiz) paginaCentral(raiz);
  // ?ajuda=artigo-id em qualquer página abre o painel direto no artigo (útil para links em mensagens e no app)
  const q = new URLSearchParams(location.search).get('ajuda'); if (q && !raiz) abrePainel(q);
  window.addEventListener('load', posBotao);
  marcaTraducao();
  document.addEventListener('pr-idioma', () => { cacheEx = null; resolvidos = new WeakMap(); marcaTraducao(); });
}
window.PR_AJUDA = {
  conteudo, exibir: exib, invalida, artigos, artigo, categoria, buscar, relacionados, renderArtigo, resolver, chaves, auditar, ctx,
  abrir: abrePainel, fechar: fechaPainel, abrirExplicacao: (el) => abreCard(el, resolver(el)), modo: modoAjuda, emModo: () => modo,
  podeEditar, usuario, linkArtigo, fmt, normDica
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia); else inicia();
})();
