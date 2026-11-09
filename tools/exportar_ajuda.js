// Exporta a base de conhecimento da ajuda (ajuda-conteudo.js) para ajuda/conteudo.json, o formato usado pelo aplicativo.
// Uso, a partir da pasta do site:  node tools/exportar_ajuda.js
// O JSON tem os mesmos artigos, categorias, contextos e chaves de explicação do site; só as "dicas" viram lista de objetos.
const fs = require('fs'), path = require('path'), vm = require('vm');
const raiz = path.join(__dirname, '..');
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(raiz, 'ajuda-conteudo.js'), 'utf8'), ctx);
const c = ctx.window.PR_AJUDA_CONTEUDO; if (!c) { console.error('ajuda-conteudo.js sem PR_AJUDA_CONTEUDO'); process.exit(1); }
const norm = (id, d) => Array.isArray(d) ? { id, titulo: d[0] || '', texto: d[1] || '', artigo: d[2] || null } : typeof d === 'string' ? { id, titulo: '', texto: d, artigo: null } : { id, titulo: d.titulo || '', texto: d.texto || '', artigo: d.artigo || null };
const out = { ...c, dicas: Object.keys(c.dicas || {}).sort().map(k => norm(k, c.dicas[k])),
  esquema: { artigo: 'id, categoria, ordem, titulo, resumo, publico (todos|equipe), status (publicado|rascunho), palavras[], onde, secoes{oQueE, finalidade, passos[], exemplos[], cuidados[]}, imagens[{src, legenda, alt}], relacionados[], atualizadoEm',
    marcacao: '**negrito** e [[id-do-artigo|texto]] para links entre artigos', imagens: 'src relativo à raiz do site (ex.: ajuda/img/x.jpg) ou data:image',
    chaves: 'global.* (todas as páginas), menu.<pagina>, aba.<ferramenta>, painel.*, p.<pagina>.<elemento>, r.<ferramenta>.<elemento>. Ver docs/CENTRAL_AJUDA.md' } };
fs.mkdirSync(path.join(raiz, 'ajuda'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'ajuda', 'conteudo.json'), JSON.stringify(out, null, 1));
console.log('ajuda/conteudo.json:', out.artigos.length, 'artigos,', out.dicas.length, 'explicações, versão', out.versao);
