// Briefing para o Claude (área restrita > Comunicação, Redes Sociais e Site > "Briefing para o Claude").
// A pessoa responde perguntas simples sobre a campanha; o app monta um texto pronto para colar no claude.ai,
// que devolve as peças (textos por canal, artes, calendário) e o "pacote da campanha".
// Dados no navegador: pr_com_briefings  [{id, titulo, tipo, projeto, r:{campo:valor}, autor, criadoEm, atualizadoEm, enviadoEm}]
//
// COMO ACRESCENTAR NO FUTURO:
//  - Nova pergunta: acrescente [campo, pergunta, dica, 'linha'|'texto'] no bloco certo de BLOCOS.
//  - Novo tipo de campanha: acrescente em TIPOS e, se quiser perguntas próprias, em EXTRAS[tipo].
(function () {
const TIPOS = [['evento', 'Evento ou festival'], ['lancamento', 'Lançamento ou novidade'], ['arrecadacao', 'Arrecadação ou doação'], ['convite', 'Convite para atividade'], ['data', 'Data comemorativa'], ['outro', 'Outro']];
const CANAIS = ['Canal do WhatsApp', 'Comunidade do WhatsApp (Avisos)', 'Grupos do WhatsApp', 'Instagram', 'Facebook', 'YouTube', 'Site do Parque', 'Listas de e-mail', 'Cartaz impresso'];
const PECAS = ['Textos para cada canal', 'Post quadrado/vertical (Instagram e Facebook)', 'Stories (vertical)', 'Arte para o Canal e a Comunidade do WhatsApp', 'Banner do site', 'Cartaz para imprimir (A4/A3)', 'Convite digital', 'E-mail', 'Roteiro de vídeo curto'];
const BLOCOS = [
  ['A campanha', [
    ['nome', 'Qual é o nome da campanha?', 'Ex.: Festival de Verão do Parque Retiro', 'linha'],
    ['objetivo', 'O que queremos que as pessoas façam?', 'Ex.: venham ao festival, façam a inscrição, doem para a Sala, instalem o app', 'texto'],
    ['meta', 'Qual é a meta? (se houver)', 'Ex.: 80 pessoas, R$ 3.000, 100 instalações', 'linha']
  ]],
  ['Público e mensagem', [
    ['publico', 'Para quem é?', 'Ex.: membros, famílias, moradores de Maricá, quem nunca veio ao Parque', 'texto'],
    ['mensagem', 'Qual é a mensagem principal, em uma frase?', 'Ex.: Venha celebrar o verão com a gente, em paz e alegria', 'texto'],
    ['tom', 'Que sentimento a campanha deve passar?', 'Ex.: acolhedor, alegre, inspirador, convite simples', 'linha'],
    ['evitar', 'Tem algo que NÃO deve aparecer ou ser dito?', 'Ex.: não falar em preço; não usar fotos de crianças', 'texto']
  ]],
  ['Datas e canais', [
    ['dataEvento', 'Data principal (do evento ou do lançamento)', 'Ex.: 20/12/2026', 'linha'],
    ['inicio', 'Quando a divulgação começa e termina?', 'Ex.: de 22/11 a 20/12', 'linha'],
    ['canais', 'Onde vamos divulgar?', '', 'canais'],
    ['pecas', 'Quais peças você precisa?', '', 'pecas']
  ]],
  ['Informações práticas', [
    ['onde', 'Onde acontece?', 'Ex.: Parque de Estudo e Reflexão Retiro, Maricá (RJ)', 'linha'],
    ['horario', 'Horário', 'Ex.: das 9h às 17h', 'linha'],
    ['programacao', 'Programação (o que vai acontecer)', 'Ex.: 9h acolhida, 10h cerimônia, 12h almoço coletivo, 14h oficinas...', 'texto'],
    ['custo', 'É gratuito? Tem contribuição ou inscrição? Como pagar?', 'Ex.: gratuito, contribuição livre por Pix', 'texto'],
    ['levar', 'O que a pessoa precisa saber ou levar?', 'Ex.: roupa leve, protetor solar, um prato para o almoço', 'texto'],
    ['contato', 'Contato e links', 'Ex.: WhatsApp (21) 2888-1830, link de inscrição', 'texto']
  ]],
  ['Materiais', [
    ['fotos', 'Temos fotos, logos ou vídeos para usar? Onde estão?', 'Ex.: fotos do festival de 2025 no Álbum; logo do Parque. Envie junto na conversa com o Claude', 'texto'],
    ['obs', 'Mais alguma coisa importante?', '', 'texto']
  ]]
];
// Perguntas próprias de cada tipo: [bloco onde entram, [perguntas]]
const EXTRAS = {
  evento: ['Informações práticas', [['alojamento', 'Tem alojamento para quem quiser dormir no Parque?', 'Ex.: sim, reservas pelo app até 15/12', 'linha']]],
  lancamento: ['A campanha', [['novidades', 'Quais são as novidades? O que já está pronto e o que é "em breve"?', 'Ex.: site novo (pronto); app (em testes); IA do acervo (em breve)', 'texto']]],
  arrecadacao: ['A campanha', [['destino', 'Para onde vai o dinheiro arrecadado?', 'Ex.: telhado do alojamento', 'texto']]],
  data: ['A campanha', [['sentido', 'O que essa data significa para o Parque e o que queremos lembrar?', 'Ex.: a não violência ativa; o testemunho de Silo em Punta de Vacas (04/05/1969)', 'texto'], ['acao', 'Vai ter alguma ação no dia? (encontro, caminhada, cerimônia, só publicação)', 'Ex.: cerimônia às 17h no Parque e publicação nas redes', 'texto']]],
  convite: ['Informações práticas', [['vagas', 'Tem limite de vagas? Como se inscrever?', 'Ex.: 30 vagas, inscrição pelo app', 'texto']]]
};
const MEDIDAS = 'Post 1080×1350 px (4:5); Stories 1080×1920 px (9:16); banner do site conforme a página; cartaz A4 ou A3 para impressão';

window.PR_COM_BRIEFING = {
  TIPOS, CANAIS, PECAS, BLOCOS, EXTRAS,
  perguntas(tipo) { const x = EXTRAS[tipo]; return BLOCOS.map(([t, l]) => [t, x && x[0] === t ? l.concat(x[1]) : l]); },
  // Monta o texto que será colado no claude.ai
  texto(b, nomeProjeto) {
    const r = b.r || {}, tipo = (TIPOS.find(t => t[0] === b.tipo) || ['', 'Outro'])[1];
    const linhas = ['Olá, Claude! Sou da equipe de Comunicação do Parque de Estudo e Reflexão Retiro (Maricá, RJ).',
      'Preciso que você crie as peças de uma campanha a partir do briefing abaixo. Use linguagem simples, acolhedora e de fácil compreensão (parte do público tem pouca familiaridade com tecnologia). Não invente informações: o que estiver faltando, deixe entre [colchetes] e me pergunte.', '',
      '# BRIEFING DA CAMPANHA', `Tipo: ${tipo}`];
    if (nomeProjeto) linhas.push(`Projeto ligado: ${nomeProjeto}`);
    this.perguntas(b.tipo).forEach(([t, l]) => {
      const itens = l.map(([c, p]) => { const v = r[c]; const txt = Array.isArray(v) ? v.join(', ') : (v || '').trim(); return txt ? `- ${p.replace(/ \(se houver\)$/, '').replace(/\?$/, '')}: ${txt}` : null; }).filter(Boolean);
      if (itens.length) linhas.push('', `## ${t}`, ...itens);
    });
    linhas.push('', '# O QUE EU PRECISO QUE VOCÊ ENTREGUE',
      '1. Um calendário de publicações (data, canal, formato e objetivo de cada post), do início ao fim da divulgação.',
      '2. Os textos de cada publicação, adaptados a cada canal (mais curto para WhatsApp, com hashtags para Instagram, mais completo para site e e-mail).',
      `3. As artes das peças pedidas, no Design, com as cores do Parque. Medidas de referência: ${MEDIDAS}.`,
      '4. No final, o "pacote da campanha" em JSON para importar no CONecta Retiro, neste formato:',
      '{"campanha":{"nome":"","objetivo":"","meta":"","inicio":"AAAA-MM-DD","fim":"AAAA-MM-DD"},"publicacoes":[{"data":"AAAA-MM-DD","hora":"HH:MM","canal":"","formato":"","texto":"","arte":"nome-do-arquivo.png"}]}',
      '', 'Antes de criar tudo, confirme comigo se entendeu o briefing e me diga se falta alguma informação.');
    return linhas.join('\n');
  },
  abrir(el, ctx) {
    const { db, esc, $, uid, me, projs } = ctx;
    const lista = () => db.get('com_briefings', []);
    const salvarLista = l => db.set('com_briefings', l);
    let atual = null, aba = 'lista', aviso = '';
    const agora = () => new Date().toISOString();
    const fmt = iso => iso ? new Date(iso).toLocaleDateString('pt-BR') : '';
    const campo = (c, p, dica, tipo, val) => {
      const id = 'bf-' + c;
      if (tipo === 'canais' || tipo === 'pecas') {
        const ops = tipo === 'canais' ? CANAIS : PECAS, sel = Array.isArray(val) ? val : [];
        return `<fieldset class="bf-grupo"><legend>${esc(p)}</legend><div class="bf-checks">${ops.map((o, i) => `<label class="bf-check"><input type="checkbox" data-c="${c}" value="${esc(o)}"${sel.includes(o) ? ' checked' : ''}> ${esc(o)}</label>`).join('')}</div></fieldset>`;
      }
      return `<div class="form-row"><label for="${id}">${esc(p)}</label>${tipo === 'texto' ? `<textarea id="${id}" data-c="${c}" rows="3" placeholder="${esc(dica)}">${esc(val || '')}</textarea>` : `<input id="${id}" data-c="${c}" maxlength="200" placeholder="${esc(dica)}" value="${esc(val || '')}">`}</div>`;
    };
    const coleta = () => {
      const r = {};
      el.querySelectorAll('[data-c]').forEach(i => {
        const c = i.dataset.c;
        if (i.type === 'checkbox') { r[c] = r[c] || []; if (i.checked) r[c].push(i.value); }
        else r[c] = i.value;
      });
      return r;
    };
    const guarda = () => {
      if (!atual) return;
      atual.r = Object.assign({}, atual.r, coleta());
      atual.titulo = (atual.r.nome || '').trim() || 'Campanha sem nome';
      const t = $('#bf-tipo', el), pj = $('#bf-proj', el);
      if (t) atual.tipo = t.value; if (pj) atual.projeto = pj.value;
      atual.atualizadoEm = agora();
      const l = lista(), i = l.findIndex(x => x.id === atual.id);
      if (i >= 0) l[i] = atual; else l.unshift(atual);
      salvarLista(l);
    };
    const nomeProj = id => { const p = (projs ? projs() : []).find(x => x.id === id); return p ? p.nome + (p.pai ? ' (' + p.pai + ')' : '') : ''; };
    const draw = () => {
      if (aba === 'lista') {
        const l = lista();
        el.innerHTML = `<h3><i class="fas fa-robot" aria-hidden="true"></i> Briefing para o Claude</h3>
          <p>Responda as perguntas sobre a campanha. O app monta um texto pronto para você <strong>copiar e colar no Claude</strong> (claude.ai), que cria os textos, as artes e o calendário das publicações.</p>
          ${aviso ? `<p class="tip-box" role="status"><i class="fas fa-check-circle"></i> ${esc(aviso)}</p>` : ''}
          <button type="button" class="btn-visit btn-large" id="bf-novo"><i class="fas fa-plus-circle"></i> Novo briefing</button>
          ${l.length ? `<div style="overflow-x:auto;margin-top:16px"><table class="doc-table"><thead><tr><th>Campanha</th><th>Tipo</th><th>Atualizado</th><th>Enviado ao Claude</th><th></th></tr></thead><tbody>${l.map(b => `<tr><td>${esc(b.titulo)}<br><small>${esc(b.autor || '')}</small></td><td>${esc((TIPOS.find(t => t[0] === b.tipo) || ['', ''])[1])}</td><td>${fmt(b.atualizadoEm)}</td><td>${b.enviadoEm ? fmt(b.enviadoEm) : '-'}</td><td><button class="icon-btn" data-ab="${b.id}" aria-label="Abrir ${esc(b.titulo)}"><i class="fas fa-edit"></i></button> <button class="icon-btn" data-rm="${b.id}" aria-label="Excluir ${esc(b.titulo)}"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table></div>` : '<p class="vazio" style="margin-top:16px">Nenhum briefing ainda.</p>'}`;
        $('#bf-novo', el).onclick = () => { atual = { id: uid(), titulo: 'Campanha sem nome', tipo: 'evento', projeto: '', r: {}, autor: me && me.nome, criadoEm: agora(), atualizadoEm: agora() }; aba = 'form'; aviso = ''; draw(); };
        el.querySelectorAll('[data-ab]').forEach(b => b.onclick = () => { atual = JSON.parse(JSON.stringify(lista().find(x => x.id === b.dataset.ab))); aba = 'form'; aviso = ''; draw(); });
        el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { if (confirm('Excluir este briefing?')) { salvarLista(lista().filter(x => x.id !== b.dataset.rm)); aviso = 'Briefing excluído.'; draw(); } });
        return;
      }
      if (aba === 'form') {
        const ps = projs ? projs().filter(p => p.ativa || p.id === atual.projeto) : [];
        el.innerHTML = `<p><button type="button" class="btn-visit" id="bf-voltar"><i class="fas fa-arrow-left"></i> Voltar aos briefings</button></p>
          <h3>Briefing: ${esc(atual.titulo)}</h3>
          <p class="tip-box"><i class="fas fa-lightbulb" aria-hidden="true"></i> Responda só o que souber. O que faltar, o Claude vai perguntar. Tudo é salvo automaticamente.</p>
          <form id="bf-form" class="form-reserva" novalidate>
          ${ps.length ? `<div class="form-row"><label for="bf-proj">Qual projeto ou data do Parque? (opcional)</label><select id="bf-proj"><option value="">- Nenhum -</option>${(() => { const op = p => `<option value="${p.id}"${p.id === atual.projeto ? ' selected' : ''}>${esc(p.nome)}</option>`; const pais = [...new Set(ps.filter(p => p.pai).map(p => p.pai))]; return ps.filter(p => !p.pai && !pais.includes(p.nome)).map(op).join('') + pais.map(n => `<optgroup label="${esc(n)}">${ps.filter(p => p.nome === n).map(p => op(Object.assign({}, p, { nome: n + ' (os quatro festivais)' }))).join('')}${ps.filter(p => p.pai === n).map(op).join('')}</optgroup>`).join(''); })()}</select><small>Ao escolher, o tipo, o nome e a data já conhecida são preenchidos sozinhos.</small></div>` : ''}
          <div class="form-row"><label for="bf-tipo">Que tipo de campanha é?</label><select id="bf-tipo">${TIPOS.map(t => `<option value="${t[0]}"${t[0] === atual.tipo ? ' selected' : ''}>${esc(t[1])}</option>`).join('')}</select></div>
          ${this.perguntas(atual.tipo).map(([t, l]) => `<h4 class="bf-bloco">${esc(t)}</h4>${l.map(([c, p, d, tp]) => campo(c, p, d, tp, atual.r[c])).join('')}`).join('')}
          <button type="button" class="btn-visit btn-large" id="bf-gerar"><i class="fas fa-magic"></i> Gerar texto para o Claude</button>
          </form>`;
        $('#bf-voltar', el).onclick = () => { guarda(); aba = 'lista'; aviso = 'Briefing salvo.'; draw(); };
        $('#bf-tipo', el).onchange = () => { guarda(); draw(); };
        el.querySelectorAll('[data-c]').forEach(i => i.addEventListener('change', guarda));
        const pjSel = $('#bf-proj', el);
        if (pjSel) pjSel.onchange = () => {
          guarda(); const p = (projs ? projs() : []).find(x => x.id === pjSel.value);
          if (p) {
            if (p.tipo && TIPOS.some(t => t[0] === p.tipo)) atual.tipo = p.tipo;
            if (!(atual.r.nome || '').trim()) atual.r.nome = p.nome;
            if (p.data && !(atual.r.dataEvento || '').trim()) atual.r.dataEvento = p.data;
            atual.titulo = (atual.r.nome || '').trim() || 'Campanha sem nome';
            const l = lista(), i = l.findIndex(x => x.id === atual.id); if (i >= 0) l[i] = atual; else l.unshift(atual); salvarLista(l);
          }
          draw();
        };
        $('#bf-gerar', el).onclick = () => { guarda(); aba = 'texto'; draw(); };
        return;
      }
      // aba === 'texto'
      const txt = this.texto(atual, nomeProj(atual.projeto));
      el.innerHTML = `<p><button type="button" class="btn-visit" id="bf-editar"><i class="fas fa-arrow-left"></i> Voltar e editar respostas</button></p>
        <h3>Texto pronto para o Claude</h3>
        <ol class="bf-passos"><li>Toque em <strong>Copiar texto</strong>.</li><li>Toque em <strong>Abrir o Claude</strong> e comece uma conversa nova.</li><li><strong>Cole</strong> o texto e envie. Se tiver fotos ou logos, anexe na mesma mensagem.</li></ol>
        <div class="bf-botoes"><button type="button" class="btn-visit btn-large" id="bf-copiar"><i class="fas fa-copy"></i> Copiar texto</button>
        <a class="btn-visit btn-large" id="bf-abrir" href="https://claude.ai/new" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> Abrir o Claude</a>
        <button type="button" class="btn-visit" id="bf-baixar"><i class="fas fa-download"></i> Baixar como arquivo</button></div>
        <p id="bf-ok" class="tip-box" role="status" hidden><i class="fas fa-check-circle"></i> Texto copiado. Agora abra o Claude e cole.</p>
        <label for="bf-saida" class="bf-rotulo">Texto do briefing (pode ajustar antes de copiar)</label>
        <textarea id="bf-saida" rows="18" class="bf-saida">${esc(txt)}</textarea>`;
      $('#bf-editar', el).onclick = () => { aba = 'form'; draw(); };
      const marcaEnvio = () => { atual.enviadoEm = agora(); const l = lista(), i = l.findIndex(x => x.id === atual.id); if (i >= 0) { l[i].enviadoEm = atual.enviadoEm; salvarLista(l); } };
      $('#bf-copiar', el).onclick = async () => {
        const v = $('#bf-saida', el).value;
        try { await navigator.clipboard.writeText(v); } catch (e) { const t = $('#bf-saida', el); t.select(); try { document.execCommand('copy'); } catch (x) { /* ignora */ } }
        $('#bf-ok', el).hidden = false; marcaEnvio();
      };
      $('#bf-abrir', el).addEventListener('click', marcaEnvio);
      $('#bf-baixar', el).onclick = () => {
        const blob = new Blob([$('#bf-saida', el).value], { type: 'text/markdown;charset=utf-8' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'briefing-' + (atual.titulo || 'campanha').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.md';
        document.body.appendChild(a); a.click(); a.remove();
      };
    };
    draw();
  }
};
})();
