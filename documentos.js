// Documentos e Calendários da área restrita. Dados salvos no navegador (localStorage, chaves pr_docs, pr_ativ, ...).
//
// COMO ACRESCENTAR NO FUTURO (sem refazer a área):
//  - Nova área de documentos (ex.: "Regimentos"): acrescente um objeto em AREAS. Ela ganha sua aba, lista por ano e formulário.
//  - Nova categoria padrão: acrescente o nome em `cats` da área (ou em ATIV_CATS, para atividades). Os responsáveis também
//    podem criar categorias novas direto no formulário.
//  - Novo calendário (ex.: bimestral): acrescente um objeto em CALS com n = número de meses mostrados por vez.
//  - Datas fixas anuais (chave pr_datas_fixas): aparecem sozinhas em todos os anos. Novas datas: Calendário Anual > "Datas fixas anuais" ou aba Comunicação e Redes Sociais.
//  - O módulo de Comunicação (comunicacao.js) usa PR_DOCUMENTOS.eventos() para ler atividades + datas fixas.
//  - Atas (área 'atas'): cada ata pode ter ENCAMINHAMENTOS (d.enc = [{id, texto, resp, data, status, tipo, ativ}]). Ao marcar "Levar para o calendário",
//    nasce uma atividade (pr_ativ, origem 'ata') que aparece nos calendários e na Comunicação SEM expor a ata para quem só cuida da comunicação.
//  - Cada área tem um `lugar`: 'docs' aparece na aba "Documentos e Calendários"; 'mapa' aparece na aba "Documentação IP" (IP = Instituto Pangeia).
(function () {
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const AREAS = [
  { id: 'atas', nome: 'Atas das Reuniões de Escola', icone: 'fa-file-signature', lugar: 'docs', cats: ['Reunião de Escola', 'Reunião extraordinária', 'Outras atas'] },
  { id: 'pangeia', nome: 'Documentação IP', icone: 'fa-folder-open', lugar: 'mapa', cats: ['Estatuto e registros', 'Atas de assembleia', 'Prestação de contas', 'Contratos e convênios', 'Outros documentos'] }
];
const CALS = [
  { id: 'semana', nome: 'Calendário Semanal', semanal: true, n: 1, pers: [] },
  { id: 'mes', nome: 'Calendário Mensal', n: 1, perRot: 'Mês', pers: MESES },
  { id: 'tri', nome: 'Calendário Trimestral', n: 3, pers: ['1º trimestre (jan a mar)', '2º trimestre (abr a jun)', '3º trimestre (jul a set)', '4º trimestre (out a dez)'] },
  { id: 'sem', nome: 'Calendário Semestral', n: 6, pers: ['1º semestre (jan a jun)', '2º semestre (jul a dez)'] },
  { id: 'ano', nome: 'Calendário Anual', n: 12, pers: ['Ano inteiro'] }
];
const ATIV_CATS = ['Encontro Estacional', 'Reunião de Escola', 'Retiro / Seminário', 'Mutirão / Manutenção', 'Celebração / Evento', 'Outras atividades', 'Campanha'];
const CORES = ['#2a7ab5', '#a31d21', '#2e7d32', '#b8620f', '#6a3d9a', '#00838f', '#6c7a7b', '#c2185b'];
const pad = n => String(n).padStart(2, '0');
// Código padrão das atas (o Parque existe desde 2011; 2 Reuniões de Escola por ano):
//   RE-AAAA.N  = Reunião de Escola (N = 1ª ou 2ª do ano) · com um sufixo -D1, -D2 quando cada dia da reunião tem ata própria
//   REX-AAAA.N = Reunião extraordinária · ATA-AAAA.N = outras atas.   Ex.: RE-2026.1, RE-2026.2-D1, RE-2026.2-D2, RE-2011.1
const PREF_ATA = { 'Reunião de Escola': 'RE', 'Reunião extraordinária': 'REX' };
const codigoOk = c => /^(RE|REX|ATA)-(19|20)\d{2}\.\d{1,2}(-D\d)?$/.test(c || '');
const sugereCodigo = (lista, d) => { // próxima numeração livre do ano para o tipo da ata
  const pre = (PREF_ATA[d.categoria] || 'ATA') + '-' + String(d.data || '').slice(0, 4) + '.';
  const usados = lista.filter(x => x.id !== d.id && String(x.codigo || '').startsWith(pre)).map(x => parseInt(String(x.codigo).slice(pre.length), 10) || 0);
  return pre + ((usados.length ? Math.max(...usados) : 0) + 1);
};
const addDia = (iso, k) => { const x = new Date(iso + 'T12:00:00'); x.setDate(x.getDate() + k); return x.toISOString().slice(0, 10); };
const domingoDe = iso => addDia(iso, -new Date(iso + 'T12:00:00').getDay());
const CAT_FIXA = 'Data fixa anual';
const FIXAS_BASE = [
  { id: 'fx-10-02', dia: '10-02', titulo: 'Dia Internacional da Não Violência', descricao: 'Nascimento de Gandhi; data da ONU.' },
  { id: 'fx-05-04', dia: '05-04', titulo: 'Dia do Testemunho', descricao: 'A Cura do Sofrimento, Silo, Punta de Vacas, 1969.' },
  { id: 'fx-09-16', dia: '09-16', titulo: '16 de setembro', descricao: '' }
];
// Projeto 4 Estações (acrescentado em 09/11/2026): o início de cada estação lembra o festival. A data do festival é marcada
// a cada ano (em geral, no fim de semana mais próximo) e entra como atividade no Calendário Anual.
const FIXAS_V2 = [
  { id: 'fx-03-20', dia: '03-20', titulo: 'Início do outono · Festival de Outono', descricao: 'Projeto 4 Estações. Marque a data do festival deste ano no Calendário Anual.' },
  { id: 'fx-06-21', dia: '06-21', titulo: 'Início do inverno · Festival de Inverno', descricao: 'Projeto 4 Estações. Marque a data do festival deste ano no Calendário Anual.' },
  { id: 'fx-09-22', dia: '09-22', titulo: 'Início da primavera · Festival de Primavera', descricao: 'Projeto 4 Estações. Marque a data do festival deste ano no Calendário Anual.' },
  { id: 'fx-12-21', dia: '12-21', titulo: 'Início do verão · Festival de Verão', descricao: 'Projeto 4 Estações. Marque a data do festival deste ano no Calendário Anual.' }
];
const ATIV_V2 = [{ id: 'fest-verao-2026', titulo: 'Festival de Verão', data: '2026-12-20', fim: '', hora: '', categoria: 'Encontro Estacional', local: 'Parque de Estudo e Reflexão Retiro', descricao: 'Projeto 4 Estações.' }];
// Datas móveis: regra { n: 1..4 ou 5 (= último), sem: 0 (domingo) .. 6 } dentro do mês de `dia` (MM-..).
const SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const ORDEM = ['', '1º', '2º', '3º', '4º', 'último'];
const diaDaRegra = (ano, mes, r) => {
  if (r.n === 5) { const u = new Date(ano, mes, 0); return u.getDate() - ((u.getDay() - r.sem + 7) % 7); }
  const p = new Date(ano, mes - 1, 1); return 1 + ((r.sem - p.getDay() + 7) % 7) + (r.n - 1) * 7;
};
const descFixa = f => f.ate ? `${f.dia.slice(3)}/${f.dia.slice(0, 2)} a ${f.ate.slice(3)}/${f.ate.slice(0, 2)}` : f.regra ? `${ORDEM[f.regra.n]} ${SEMANA[f.regra.sem]} de ${MESES[+f.dia.slice(0, 2) - 1].toLowerCase()}` : f.dia.slice(3) + '/' + f.dia.slice(0, 2);
const FIXAS_V3 = [
  { id: 'fx-aniv-parque', dia: '11-08', regra: { n: 2, sem: 0 }, titulo: 'Aniversário Parque Retiro', descricao: 'Todo ano no 2º domingo de novembro.' },
  { id: 'fx-nv-marica', dia: '10-01', ate: '10-15', titulo: 'Dia Municipal da Não Violência de Maricá', descricao: 'Na 1ª quinzena de outubro. Marque o dia exato de cada ano no Calendário Anual.' }
];
const fixas = db => {
  let f = db.get('datas_fixas', null); if (!f) { f = FIXAS_BASE.map(x => ({ ...x })); db.set('datas_fixas', f); }
  if (!db.get('datas_fixas_v2', null)) { // uma vez só: renomeia as datas antigas e acrescenta as do Projeto 4 Estações
    FIXAS_BASE.forEach(b => { const ex = f.find(x => x.id === b.id); if (ex && (ex.titulo === '4 de maio' || ex.titulo === 'Dia Internacional da Não-Violência')) Object.assign(ex, { titulo: b.titulo, descricao: ex.descricao || b.descricao }); });
    FIXAS_V2.forEach(n => { if (!f.some(x => x.id === n.id || x.dia === n.dia && x.titulo === n.titulo)) f.push({ ...n }); });
    const at = db.get('ativ', []); ATIV_V2.forEach(a => { if (!at.some(x => x.id === a.id)) at.push({ ...a, criado: '2026-11-09', por: 'Sistema' }); });
    db.set('datas_fixas', f); db.set('ativ', at); db.set('datas_fixas_v2', { em: '2026-11-09' });
  }
  if (!db.get('datas_fixas_v4', null)) { FIXAS_V3.forEach(n => { const ex = f.find(x => x.id === n.id); if (ex) Object.assign(ex, n); else f.push({ ...n }); }); db.set('datas_fixas', f); db.set('datas_fixas_v4', { em: '2026-11-09' }); }
  return f;
};
// Atividades cadastradas + datas fixas repetidas em cada ano do intervalo [de, ate] (AAAA-MM-DD). Cada evento tem `key` estável.
const eventos = (db, de, ate) => {
  const anos = []; for (let a = +de.slice(0, 4); a <= +ate.slice(0, 4); a++) anos.push(a);
  const fx = []; anos.forEach(a => fixas(db).forEach(f => {
    const dia = f.regra ? pad(diaDaRegra(a, +f.dia.slice(0, 2), f.regra)) : f.dia.slice(3);
    const iso = `${a}-${f.dia.slice(0, 2)}-${dia}`, d = new Date(a, +f.dia.slice(0, 2) - 1, +dia);
    if (d.getMonth() !== +f.dia.slice(0, 2) - 1) return; // ex.: 29/02 em ano não bissexto
    fx.push({ id: `fx:${f.id}:${a}`, key: `f:${f.id}:${iso}`, fixa: true, titulo: f.titulo, descricao: f.descricao || '', data: iso, fim: f.ate ? `${a}-${f.ate}` : '', hora: '', local: '', categoria: CAT_FIXA });
  }));
  // Toda atividade cadastrada em Comissões > Atividades (inclusive rascunho) também entra no calendário, para planejar a divulgação nas redes sociais.
  const MAPA = { evento: 'Celebração / Evento', encontro: 'Encontro Estacional', retiro: 'Retiro / Seminário', reuniao: 'Reunião de Escola' };
  const doModulo = db.get('atividades', []).filter(a => a && a.dataAtiv && a.titulo).map(a => ({ id: 'at:' + a.id, key: 't:' + a.id, travada: true, modulo: 'Atividades', titulo: a.titulo + (a.status === 'publicada' ? '' : ' (rascunho)'), descricao: a.lide || '', data: a.dataAtiv, fim: '', hora: '', local: a.local || '', categoria: MAPA[a.categoria] || 'Outras atividades' }));
  // Atividade semanal (a.semanal): repete no mesmo dia da semana, da data inicial até a data final (sem data final = sem fim).
  const sem = [];
  db.get('ativ', []).forEach(a => {
    if (!a.semanal || !a.data) { sem.push({ ...a, key: 'a:' + a.id }); return; }
    const fim = a.fim && a.fim < ate ? a.fim : ate;
    for (let d = a.data, n = 0; d <= fim && n < 600; d = addDia(d, 7), n++) if (d >= de) sem.push({ ...a, data: d, fim: '', key: 'a:' + a.id + ':' + d, ocorrencia: true });
  });
  return sem.concat(doModulo, fx).filter(e => e.data <= ate && (e.fim || e.data) >= de)
    .sort((x, y) => x.data.localeCompare(y.data) || (x.hora || '').localeCompare(y.hora || '') || x.titulo.localeCompare(y.titulo, 'pt-BR'));
};
// Quadro de gestão das datas fixas (usado no Calendário Anual e na aba de Comunicação). aoMudar(msg) é chamado após cada alteração.
const gerirFixas = (el, H, pode, aoMudar) => {
  const { db, esc, $, uid } = H; let ed = null, erro = '';
  const dd = d => d.slice(3) + '/' + d.slice(0, 2);
  const draw = () => {
    const l = fixas(db).slice().sort((a, b) => a.dia.localeCompare(b.dia)), e = ed && l.find(x => x.id === ed);
    el.innerHTML = `<h3><i class="fas fa-redo"></i> Datas fixas anuais</h3>
    <p>Datas que se repetem todos os anos e aparecem automaticamente nos calendários de qualquer ano (semanal, mensal, trimestral, semestral e anual).${pode ? '' : ' Seu acesso é de consulta.'}</p>
    <div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Dia/mês</th><th>Data</th><th>Descrição</th><th></th></tr></thead><tbody>${l.map(f => `<tr><td>${esc(descFixa(f))}</td><td>${esc(f.titulo)}</td><td>${esc(f.descricao || '')}</td><td>${pode ? `<button class="icon-btn" data-fe="${f.id}" aria-label="Editar ${esc(f.titulo)}"><i class="fas fa-edit" style="color:var(--accent-color)"></i></button><button class="icon-btn" data-fd="${f.id}" aria-label="Excluir ${esc(f.titulo)}"><i class="fas fa-trash"></i></button>` : ''}</td></tr>`).join('') || '<tr><td colspan="4" class="vazio">Nenhuma data fixa.</td></tr>'}</tbody></table></div>
    ${pode ? `<form id="ff" class="form-reserva" novalidate style="margin-top:16px"><h4 style="margin-top:0">${e ? 'Editar data fixa' : 'Nova data fixa'}</h4>
      <div class="form-row"><label for="f-tp">Repete como?</label><select id="f-tp"><option value="dia">Mesmo dia todo ano (ex.: 02/10)</option><option value="sem"${e && e.regra ? ' selected' : ''}>Dia da semana do mês (ex.: 2º domingo de outubro)</option></select></div>
      <div class="form-row" id="f-dw"${e && e.regra ? ' hidden' : ''}><label for="f-d">Dia *</label><input id="f-d" type="number" min="1" max="31" value="${e && !e.regra ? +e.dia.slice(3) : ''}"></div>
      <div class="form-row" id="f-sw"${e && e.regra ? '' : ' hidden'}><label for="f-n">Qual *</label><select id="f-n">${[1, 2, 3, 4, 5].map(n => `<option value="${n}"${e && e.regra && e.regra.n === n ? ' selected' : ''}>${ORDEM[n]}</option>`).join('')}</select> <select id="f-sd" aria-label="Dia da semana">${SEMANA.map((w, i) => `<option value="${i}"${e && e.regra && e.regra.sem === i ? ' selected' : ''}>${w}</option>`).join('')}</select></div>
      <div class="form-row"><label for="f-m">Mês *</label><select id="f-m">${MESES.map((m, i) => `<option value="${i + 1}"${e && +e.dia.slice(0, 2) === i + 1 ? ' selected' : ''}>${m}</option>`).join('')}</select></div>
      <div class="form-row"><label for="f-t">Nome da data *</label><input id="f-t" maxlength="120" value="${esc(e ? e.titulo : '')}"></div>
      <div class="form-row"><label for="f-s">Descrição (opcional)</label><input id="f-s" maxlength="200" value="${esc(e ? e.descricao || '' : '')}"></div>
      <p class="form-erro" id="f-e" role="alert"${erro ? '' : ' hidden'}>${esc(erro)}</p>
      <button class="btn-visit"><i class="fas fa-save"></i> ${e ? 'Salvar' : 'Adicionar data fixa'}</button>${e ? ' <button type="button" class="btn-visit" id="f-x" style="background:#6c7a7b">Cancelar</button>' : ''}</form>` : ''}`;
    if (!pode) return;
    el.querySelectorAll('[data-fe]').forEach(b => b.onclick = () => { ed = b.dataset.fe; erro = ''; draw(); });
    el.querySelectorAll('[data-fd]').forEach(b => b.onclick = () => { if (confirm('Excluir esta data fixa? Ela some de todos os anos (publicações já planejadas continuam salvas).')) { db.set('datas_fixas', fixas(db).filter(f => f.id !== b.dataset.fd)); aoMudar('Data fixa excluída.'); } });
    const x = $('#f-x', el); if (x) x.onclick = () => { ed = null; erro = ''; draw(); };
    $('#f-tp', el).onchange = ev => { const sem = ev.target.value === 'sem'; $('#f-dw', el).hidden = sem; $('#f-sw', el).hidden = !sem; };
    $('#ff', el).onsubmit = ev => {
      ev.preventDefault(); const dia = parseInt($('#f-d', el).value, 10), mes = parseInt($('#f-m', el).value, 10), t = $('#f-t', el).value.trim(), ds = $('#f-s', el).value.trim();
      const falha = m => { erro = m; draw(); };
      if (!t) return falha('Informe o nome da data.');
      const movel = $('#f-tp', el).value === 'sem';
      let d, regra;
      if (movel) { regra = { n: +$('#f-n', el).value, sem: +$('#f-sd', el).value }; d = pad(mes) + '-' + pad(regra.n === 5 ? 22 : (regra.n - 1) * 7 + 1); }
      else {
        const teste = new Date(2024, mes - 1, dia); // 2024 é bissexto: aceita 29/02
        if (!(dia >= 1) || teste.getMonth() !== mes - 1) return falha('Dia inválido para o mês escolhido.');
        d = pad(mes) + '-' + pad(dia);
      }
      const l = fixas(db), dados = { dia: d, titulo: t, descricao: ds };
      if (e) { const alvo = l.find(f => f.id === e.id); Object.assign(alvo, dados); if (regra) alvo.regra = regra; else delete alvo.regra; } else l.push({ id: uid(), ...dados, ...(regra ? { regra } : {}) });
      db.set('datas_fixas', l); ed = null; erro = ''; aoMudar(e ? 'Data fixa atualizada.' : 'Data fixa cadastrada. Ela já aparece nos calendários de todos os anos.');
    };
  };
  draw();
};

const MAX_ARQ = 1024 * 1024; // 1 MB por arquivo anexado (o navegador guarda no máximo ~5 MB no total)

// ---------- Dar encaminhamento (usado pela área restrita e pelo app) ----------
const semRespM = r => !String(r || '').trim() || /^a definir$/i.test(String(r).trim());
const chaveReuniao = d => { const m = /^(RE-\d{4}\.\d+)/.exec(d.codigo || ''); return m ? m[1] : ''; };
const nomeReuniao = k => { const m = /^RE-(\d{4})\.(\d+)$/.exec(k); return m ? `${m[2]}ª Reunião de Escola ${m[1]}` : k; };
const curto = (t, n = 95) => { t = String(t || '').replace(/\s*\(Documento Oficial CONecta Retiro, (?:item|itens) [^)]*\)/, '').replace(/\s*·\s*a verificar/, ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const fmtBR = iso => iso ? iso.split('-').reverse().join('/') : '';
// Pendentes de UMA Reunião de Escola (r = 'RE-AAAA.N'; vazio = a mais recente), na ordem: sem responsável, sem data, por prazo.
const darEncaminhamento = (db, h, r) => {
  const atas = (db.get('docs', []) || []).filter(d => d.area === 'atas' && chaveReuniao(d)), al = db.get('ativ', []) || [];
  const reunioes = [...new Set(atas.slice().sort((a, b) => b.data.localeCompare(a.data)).map(chaveReuniao))];
  if (!r || !reunioes.includes(r)) r = reunioes[0] || '';
  const dias = iso => iso ? Math.max(0, Math.round((new Date(h + 'T12:00:00') - new Date(iso + 'T12:00:00')) / 864e5)) : 0, lim = addDia(h, 45), itens = [];
  atas.filter(d => chaveReuniao(d) === r).forEach(d => (d.enc || []).forEach(e => { if (e.status !== 'Em aberto') return;
    const at = e.ativ ? al.find(a => a.id === e.ativ) : null, data = at ? at.data : e.data || '';
    itens.push({ d, e, data, semResp: semRespM(e.resp), semData: !data, atraso: !!data && data < h, prox45: !!data && data >= h && data <= lim, parado: dias(e.atualizado || d.data) }); }));
  itens.sort((x, y) => (y.semResp - x.semResp) || (y.semData - x.semData) || (x.data || '').localeCompare(y.data || '') || (x.d.codigo || '').localeCompare(y.d.codigo || ''));
  return { r, nome: nomeReuniao(r), reunioes, itens, nR: itens.filter(i => i.semResp).length, nD: itens.filter(i => i.semData).length,
    atrasados: itens.filter(i => i.atraso), prox: itens.filter(i => i.prox45) };
};
// Ligação com o Zoom (função zoom no Supabase): só no modo servidor
const zoomLigado = () => !!(window.PR_SUPABASE && PR_SUPABASE.ligado && PR_SUPABASE.ligado() && PR_SUPABASE.funcao);
// ---------- Transcrição de reunião (Zoom .vtt, YouTube .vtt/.srt ou texto) -> rascunho de ata ----------
// Zoom: "Nome: fala" em cada trecho; YouTube (legenda automática): sem nomes, com marcações <00:00:01.234><c>…</c>
// e linhas repetidas que "rolam" – tudo isso é limpo aqui.
const segs = t => { const m = /(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})/.exec(t || ''); return m ? (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) : 0; };
const hhmm = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = Math.floor(s % 60); return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(x).padStart(2, '0'); };
const lerTranscricao = (texto, nomeArq = '') => {
  const t = String(texto || '').replace(/^﻿/, '').replace(/\r/g, '');
  const tipo = /^WEBVTT/.test(t) ? 'vtt' : /-->/.test(t) ? 'srt' : 'texto';
  const cues = [];
  if (tipo === 'texto') t.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).forEach(b => cues.push({ ini: 0, fim: 0, txt: b.replace(/\n/g, ' ') }));
  else t.split(/\n\s*\n/).forEach(b => {
    const ls = b.split('\n'), i = ls.findIndex(l => /-->/.test(l)); if (i < 0) return;
    const [a, z] = ls[i].split('-->');
    const txt = ls.slice(i + 1).join(' ').replace(/<\d{2}:\d{2}:\d{2}[.,]\d{3}>/g, '').replace(/<\/?[a-z][^>]*>/gi, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    if (txt) cues.push({ ini: segs(a), fim: segs(z), txt });
  });
  // tira repetições da legenda automática (cada trecho repete o fim do anterior)
  const limpos = [];
  cues.forEach(c => { const p = limpos[limpos.length - 1]; if (p && (p.txt === c.txt || p.txt.endsWith(c.txt))) { p.fim = Math.max(p.fim, c.fim); return; }
    if (p && c.txt.startsWith(p.txt)) { p.txt = c.txt; p.fim = Math.max(p.fim, c.fim); return; } limpos.push(Object.assign({}, c)); });
  const falas = [];
  limpos.forEach(c => {
    const m = /^([A-ZÀ-Ýa-zà-ÿ][^:]{0,60}):\s+(.+)$/.exec(c.txt), quem = m && !/^https?$/i.test(m[1]) ? m[1].trim() : '', txt = m ? m[2] : c.txt;
    const p = falas[falas.length - 1];
    if (p && p.quem === quem && (quem || c.ini - p.ini < 60) && p.txt.length < 1500) { p.txt += ' ' + txt; p.fim = c.fim; } else falas.push({ quem, ini: c.ini, fim: c.fim, txt });
  });
  const participantes = [...new Set(falas.map(f => f.quem).filter(Boolean))];
  const duracao = Math.max(0, ...limpos.map(c => c.fim));
  let data = '', md = /GMT(\d{4})(\d{2})(\d{2})-(\d{2})/.exec(nomeArq);
  if (md) { const d = new Date(Date.UTC(+md[1], +md[2] - 1, +md[3], +md[4]) - 3 * 3600e3); data = d.toISOString().slice(0, 10); } // horário de Brasília
  else if ((md = /(\d{4})-(\d{2})-(\d{2})/.exec(nomeArq))) data = md[0];
  const origem = /GMT\d{8}|zoom|transcript/i.test(nomeArq) || participantes.length ? 'Zoom' : tipo === 'texto' ? 'texto' : 'YouTube';
  const corpo = falas.map(f => `[${hhmm(f.ini)}] ${f.quem ? f.quem + ': ' : ''}${f.txt}`).join('\n\n');
  return { tipo, origem, data, falas, participantes, duracao, texto: corpo, palavras: corpo.split(/\s+/).filter(Boolean).length };
};

// Grava o encaminhamento (quem assume, prazo, próximo passo, situação); prazo novo de item em aberto entra no calendário.
const salvarEnc = (db, di, ei, v, por, h) => {
  const l = db.get('docs', []) || [], d = l.find(y => y.id === di), e = d && (d.enc || []).find(y => y.id === ei); if (!e) return null;
  const al = db.get('ativ', []) || [], at = e.ativ ? al.find(a => a.id === e.ativ) : null; let novoCal = false;
  e.resp = String(v.resp || '').trim().slice(0, 80) || (semRespM(e.resp) ? e.resp : '');
  if (v.passo !== undefined) e.passo = String(v.passo || '').trim().slice(0, 160);
  if (v.es !== undefined) e.es = String(v.es || '').trim().slice(0, 300);
  if (v.status) e.status = v.status;
  if (v.data !== undefined) e.data = v.data || '';
  e.atualizado = h; e.atualizadoPor = por;
  if (at) { if (e.data) at.data = e.data; at.resp = e.resp; }
  else if (e.data && e.status === 'Em aberto') { const id = 'enc-' + e.id; al.push({ id, titulo: e.texto.slice(0, 120), data: e.data, fim: '', hora: '', categoria: e.tipo || 'Outras atividades', local: '', descricao: `Encaminhamento da ata ${d.codigo || d.titulo}.`, resp: e.resp, criado: h, por, origem: 'ata' }); e.ativ = id; novoCal = true; }
  if (!db.set('ativ', al) || !db.set('docs', l)) return null;
  return { d, e, novoCal };
};
// Mensagens para os Mestres em português ('pt') ou espanhol ('es'). Em espanhol usa o texto traduzido do ponto (e.es) quando houver.
const MSG = {
  pt: { topo: r => `*Pendências que ficaram para decidir e fazer encaminhamento em relação à ${r}*`, reuniao: (n, a) => `${n}ª Reunião de Escola ${a}`, titR: 'Dar encaminhamento', introR: n => `Ainda temos *${n}* encaminhamento(s) em aberto da nossa reunião. Para nada ficar parado nem cair no esquecimento:`,
    precisaResp: n => `🙋 *Precisam de alguém que assuma (${n})*`, precisaData: n => `📅 *Precisam de prazo (${n})*`, atraso: '⚠️ *Em atraso*', proximos: '⏳ *Próximos prazos*', semResp: 'sem responsável',
    fimR: l => `Quem puder assumir ou já tiver novidade, responda aqui ou atualize em Área restrita › Documentos e Calendários › Dar encaminhamento: ${l}`, abraco: 'Um forte abraço!',
    titS: 'Status dos encaminhamentos', introS: (t, r, d, p, a) => `Hoje são *${t}* em aberto: ${r} sem responsável · ${d} sem data · ${p} com prazo nos próximos 45 dias${a ? ` · ${a} em atraso` : ''}.`,
    mSemResp: '🙋 *sem responsável*', mSemData: '📅 *sem data*', mAtraso: '⚠️ *em atraso* desde ', mProx: '⏳ próximos 45 dias', passo: 'Próximo passo',
    fimS: l => `Peço a ajuda de todos que participaram da reunião: quem puder assumir um ponto, dar um prazo ou trazer novidade, responda aqui ou atualize em Área restrita › Documentos e Calendários › Dar encaminhamento: ${l}` },
  es: { topo: r => `*Pendientes que quedaron por decidir y encaminar en relación con la ${r}*`, reuniao: (n, a) => `${n}ª Reunión de Escuela ${a}`, titR: 'Dar seguimiento', introR: n => `Todavía tenemos *${n}* encaminamiento(s) abiertos de nuestra reunión. Para que nada quede parado ni caiga en el olvido:`,
    precisaResp: n => `🙋 *Necesitan a alguien que los asuma (${n})*`, precisaData: n => `📅 *Necesitan plazo (${n})*`, atraso: '⚠️ *Atrasados*', proximos: '⏳ *Próximos plazos*', semResp: 'sin responsable',
    fimR: l => `Quien pueda asumir o ya tenga novedades, responda aquí o actualice en Área restringida › Documentos y Calendarios › Dar seguimiento: ${l}`, abraco: '¡Un fuerte abrazo!',
    titS: 'Estado de los encaminamientos', introS: (t, r, d, p, a) => `Hoy hay *${t}* abiertos: ${r} sin responsable · ${d} sin fecha · ${p} con plazo en los próximos 45 días${a ? ` · ${a} atrasados` : ''}.`,
    mSemResp: '🙋 *sin responsable*', mSemData: '📅 *sin fecha*', mAtraso: '⚠️ *atrasado* desde ', mProx: '⏳ próximos 45 días', passo: 'Próximo paso',
    fimS: l => `Pido la ayuda de todos los que participaron de la reunión: quien pueda asumir un punto, dar un plazo o traer novedades, responda aquí o actualice en Área restringida › Documentos y Calendarios › Dar seguimiento: ${l}` }
};
const RESP_ES = [[/Comissão de Construção/g, 'Comisión de Construcción'], [/Comissão de Biblioteca e Acervo/g, 'Comisión de Biblioteca y Acervo'], [/Frente de Ação/g, 'Frente de Acción'], [/Diretoria da Pangea/g, 'Directiva de Pangea'],
  [/representante legal/g, 'representante legal'], [/\bMestres\b/g, 'Maestros'], [/\bvoluntários\b/g, 'voluntarios'], [/\bTodos\b/g, 'Todos'], [/ e /g, ' y ']];
const respLang = (r, lang) => lang === 'es' ? RESP_ES.reduce((x, [a, b]) => x.replace(a, b), String(r || '')) : String(r || '');
const textoLang = (e, lang) => lang === 'es' && e.es ? e.es : e.texto;
const nomeLang = (D, lang) => { const m = /^RE-(\d{4})\.(\d+)$/.exec(D.r); return m ? MSG[lang].reuniao(m[2], m[1]) : D.nome; };
const msgResumo = (D, link, lang = 'pt') => {
  const T = MSG[lang] || MSG.pt, it = D.itens, tx = i => curto(textoLang(i.e, lang)), rs = i => respLang(i.e.resp, lang);
  const L = [T.topo(nomeLang(D, lang)), T.introR(it.length)];
  const sr = it.filter(i => i.semResp); if (sr.length) { L.push('', T.precisaResp(sr.length)); sr.forEach((i, k) => L.push(...(k ? [''] : []), `• ${tx(i)} [${i.d.codigo}]`)); }
  const sd = it.filter(i => i.semData && !i.semResp); if (sd.length) { L.push('', T.precisaData(sd.length)); sd.forEach((i, k) => L.push(...(k ? [''] : []), `• ${tx(i)} – ${rs(i)}`)); }
  if (D.atrasados.length) { L.push('', T.atraso); D.atrasados.forEach((i, k) => L.push(...(k ? [''] : []), `• ${fmtBR(i.data)} · ${tx(i)} – ${semRespM(i.e.resp) ? T.semResp : rs(i)}`)); }
  const px = D.prox.filter(i => !i.semResp); if (px.length) { L.push('', T.proximos); px.forEach((i, k) => L.push(...(k ? [''] : []), `• ${fmtBR(i.data)} · ${tx(i)} – ${rs(i)}`)); }
  L.push('', T.fimR(link), '', T.abraco);
  return L.join('\n');
};
const msgStatus = (D, link, lang = 'pt') => {
  const T = MSG[lang] || MSG.pt, L = [T.topo(nomeLang(D, lang)), T.introS(D.itens.length, D.nR, D.nD, D.prox.length, D.atrasados.length), ''];
  D.itens.forEach((i, n) => {
    const marcas = [i.semResp ? T.mSemResp : '👤 ' + respLang(i.e.resp, lang), i.semData ? T.mSemData : (i.atraso ? T.mAtraso : '📅 ') + fmtBR(i.data)];
    if (i.prox45) marcas.push(T.mProx);
    const passo = lang === 'es' && i.e.passoEs ? i.e.passoEs : i.e.passo;
    if (n) L.push('');
    L.push(`${n + 1}. ${curto(textoLang(i.e, lang), 110)} [${i.d.codigo}]`, '   ' + marcas.join(' · ') + (passo ? `\n   ➡️ ${T.passo}: ${passo}` : ''));
  });
  L.push('', T.fimS(link), '', T.abraco);
  return L.join('\n');
};
window.PR_DOCUMENTOS = { AREAS, CALS, CAT_FIXA, fixas, eventos, gerirFixas, codigoOk, sugereCodigo, darEncaminhamento, msgResumo, msgStatus, salvarEnc, curto, lerTranscricao, abrir(me, root, H, lugar = 'docs') { // lugar: 'docs' (Documentos e Calendários) ou 'mapa' (Documentação IP)
  const { db, esc, $, uid, hoje, fmtData, norm } = H;
  const pode = H.tem(me, 'documentos'); // administrador ou Responsável pelos Documentos e Calendários
  const anoHoje = +hoje().slice(0, 4);
  const areas = AREAS.filter(a => a.lugar === lugar), cals = lugar === 'docs' ? CALS : [];
  let sub = (areas[0] || cals[0]).id, form = null, msg = '', imp = null, trs = null; // trs: transcrição sendo conferida // imp: pacote de atas sendo conferido antes de importar
  const F = { ano: '', cat: '', q: '', aberto: false };                       // filtros da lista de documentos
  const mesHoje = +hoje().slice(5, 7) - 1;
  const W = { ini: domingoDe(hoje()) }; // semana mostrada no calendário semanal (domingo)
  const C = { ano: anoHoje, cat: '', per: { mes: mesHoje + 1, tri: Math.floor(mesHoje / 3) + 1, sem: mesHoje < 6 ? 1 : 2, ano: 1 } }; // navegação (período lembrado por calendário)

  const docs = () => db.get('docs', []);
  const ativs = () => db.get('ativ', []);
  const catsDe = a => a.cats.concat(db.get('doc_cats', {})[a.id] || []);
  const catsAtiv = () => ATIV_CATS.concat(db.get('ativ_cats', []));
  // Responsável escrito à mão ("Ana e Pablo", "Comissão de Construção (Marcos, Antônio)"): cada nome que bate com um cadastro
  // aprovado aparece marcado (✓ e o nome completo); os demais ficam como texto, "sem cadastro", até a pessoa se cadastrar.
  const cadastroDe = nome => { const n = norm(nome); if (n.length < 3) return null; const us = (db.get('users', []) || []).filter(u => (u.status || 'aprovado') === 'aprovado' && u.nome);
    return us.find(u => norm(u.nome) === n) || us.find(u => norm(u.nome).startsWith(n + ' ')) || null; };
  const respHtml = txt => {
    const partes = String(txt).split(/(\s*,\s*|\s+e\s+|\s*[()]\s*|\s*:\s*)/);
    let algum = false;
    const html = partes.map(p => { if (/^(\s*,\s*|\s+e\s+|\s*[()]\s*|\s*:\s*)$/.test(p) || !p.trim()) return esc(p); const u = cadastroDe(p.trim()); if (!u) return esc(p); algum = true; return `<strong title="Tem cadastro: ${esc(u.nome)}"><i class="fas fa-user-check" aria-hidden="true" style="color:#2e7d32"></i> ${esc(p)}</strong>`; }).join('');
    return `<i class="fas fa-user" aria-hidden="true"></i> Responsável: ${html}${algum ? '' : ' <em>(sem cadastro)</em>'}`;
  };
  const cor = c => c === CAT_FIXA ? '#6a3d9a' : CORES[Math.max(0, catsAtiv().indexOf(c)) % CORES.length];
  const novaCat = (chave, nome, base) => { // registra categoria nova sem duplicar
    nome = String(nome || '').trim().replace(/\s+/g, ' ').slice(0, 60); if (!nome) return '';
    const todas = base.concat(chave === 'ativ_cats' ? db.get('ativ_cats', []) : (db.get('doc_cats', {})[chave] || []));
    const ja = todas.find(c => norm(c) === norm(nome)); if (ja) return ja;
    if (chave === 'ativ_cats') db.set('ativ_cats', db.get('ativ_cats', []).concat(nome)); else { const m = db.get('doc_cats', {}); m[chave] = (m[chave] || []).concat(nome); db.set('doc_cats', m); }
    return nome;
  };
  const opt = (l, s) => l.map(x => `<option${x === s ? ' selected' : ''}>${esc(x)}</option>`).join('');
  const lerArq = f => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(f); });

  /* ---------- Encaminhamentos das atas ---------- */
  const ENC_ST = ['Em aberto', 'Feito', 'Cancelado'];
  const encCor = st => st === 'Feito' ? '#2e7d32' : st === 'Cancelado' ? '#6c7a7b' : '#b8620f';
  const encLinha = e => {
    const at = e && e.ativ ? ativs().find(a => a.id === e.ativ) : null, lbl = 'display:block;font-weight:600;font-size:.85em;margin-bottom:2px';
    return `<div class="enc-linha" data-eid="${esc(e ? e.id : '')}" data-ativ="${esc(at ? at.id : '')}" style="border:1px solid #d6dde0;border-radius:8px;padding:10px;margin:8px 0;display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
      <div style="grid-column:1/-1"><label style="${lbl}">O que ficou combinado *</label><input data-e="texto" maxlength="300" value="${esc(e ? e.texto : '')}"></div>
      <div><label style="${lbl}">Responsável</label><input data-e="resp" maxlength="80" value="${esc(e ? e.resp || '' : '')}"></div>
      <div><label style="${lbl}">Prazo / data</label><input type="date" data-e="data" value="${esc(at ? at.data : e ? e.data || '' : '')}"></div>
      <div><label style="${lbl}">Situação</label><select data-e="status">${opt(ENC_ST, e ? e.status : ENC_ST[0])}</select></div>
      <div><label style="${lbl}">Tipo de atividade</label><select data-e="tipo">${opt(catsAtiv(), at ? at.categoria : (e && e.tipo) || 'Outras atividades')}</select></div>
      <div style="grid-column:1/-1">${at ? '<small><i class="fas fa-calendar-check" aria-hidden="true"></i> Já está no calendário. Mudar o texto, a data ou o tipo aqui atualiza a atividade.</small>' : '<label style="font-weight:normal"><input type="checkbox" data-e="cal"> Levar para o calendário (precisa de data)</label>'}
        <button type="button" class="icon-btn" data-e-rm aria-label="Remover este encaminhamento" title="Remover" style="float:right"><i class="fas fa-trash"></i></button></div></div>`;
  };
  const encBloco = ed => `<h4 class="subsection-title">Encaminhamentos da ata</h4>
      <p>Decisões e tarefas combinadas na reunião. Marque <strong>Levar para o calendário</strong> e o encaminhamento vira uma atividade nos calendários; a Comunicação a enxerga em "Próximas atividades sem comunicação planejada", sem precisar abrir a ata.</p>
      <div id="d-enc">${((ed && ed.enc) || []).map(encLinha).join('')}</div>
      <p><button type="button" class="btn-visit" id="d-enc-add"><i class="fas fa-plus-circle"></i> Acrescentar encaminhamento</button></p>`;
  const encItem = (d, e) => { const at = e.ativ ? ativs().find(a => a.id === e.ativ) : null, dt = at ? at.data : e.data, atraso = e.status === 'Em aberto' && dt && dt < hoje();
    return `<li><span class="badge-status" style="background:${atraso ? '#a31d21' : encCor(e.status)};color:#fff">${esc(atraso ? 'Em atraso' : e.status)}</span> ${esc(e.texto)}${e.resp ? ` <small>(${esc(e.resp)})</small>` : ''}${dt ? ` <small>· prazo ${fmtData(dt)}</small>` : ''}${at ? ' <small title="Está nos calendários"><i class="fas fa-calendar-check" aria-hidden="true"></i> no calendário</small>' : ''}${pode ? ` <select data-es="${d.id}|${e.id}" aria-label="Situação do encaminhamento">${opt(ENC_ST, e.status)}</select>` : ''}</li>`; };

  /* ---------- Importar ata preparada (pacote .json montado pelo Claude a partir da ata) ----------
     { tipo: 'pr-atas', versao: 1, atas: [{ id, titulo, data, categoria, descricao, link, videos: [{titulo, url}], arquivo, arqNome,
       anexos: [{rotulo, nome, arquivo}], enc: [{id, texto, resp, data, status, tipo, cal}] }], atividades: [{id, titulo, data, fim, hora, categoria, local, descricao}] }
     Importar de novo o mesmo pacote não duplica nada: atas, encaminhamentos e atividades têm id fixo e são atualizados. */
  const okData = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
  const validaPacote = txt => {
    let p; try { p = JSON.parse(txt); } catch (e) { return 'Este arquivo não é um pacote de ata válido (.json).'; }
    if (!p || p.tipo !== 'pr-atas' || !Array.isArray(p.atas)) return 'Este arquivo não é um pacote de ata do CONecta Retiro.';
    for (const a of p.atas) { if (!a.id || !a.titulo || !okData(a.data)) return 'Uma das atas do pacote está sem título ou sem data.'; if (a.arquivo && !H.safeUrl(a.arquivo)) return 'Arquivo anexado de tipo não aceito na ata "' + a.titulo + '".'; }
    for (const t of p.atividades || []) if (!t.id || !t.titulo || !okData(t.data)) return 'Uma das datas do pacote está incompleta.';
    return p;
  };
  // Gravações na nuvem do Zoom (função zoom no Supabase): criar ata pela transcrição e apagar da nuvem
  const ZM = { aberto: false, ate: '', lista: null, erro: '', carregando: false };
  const zoomBloco = () => {
    const ate = ZM.ate || hoje(), de = addDia(ate, -30), mb = b => (b / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: b < 10485760 ? 1 : 0 });
    const tot = (ZM.lista || []).reduce((n, m) => n + (m.tamanho || 0), 0);
    return `<section class="tip-box" style="display:block" id="zm-box"><h4 style="margin-top:0"><i class="fas fa-video"></i> Gravações na nuvem do Zoom</h4>
      <p><small>De ${fmtData(de)} a ${fmtData(ate)}. ${ZM.lista ? `${ZM.lista.length} gravação(ões), ocupando ${mb(tot)} MB dos 10 GB da nuvem.` : ''}</small></p>
      ${ZM.carregando ? '<p>Buscando no Zoom…</p>' : ZM.erro ? `<p class="form-erro" role="alert">${esc(ZM.erro)}</p>` : ZM.lista && !ZM.lista.length ? '<p class="vazio">Nenhuma gravação neste período.</p>' : ZM.lista ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Data</th><th>Reunião</th><th>Duração</th><th>Tamanho</th><th></th></tr></thead><tbody>${ZM.lista.map((m, i) => `<tr>
        <td>${esc(fmtData(isoBR(m.inicio)))}<br><small>${esc(horaBR(m.inicio))}</small></td><td>${esc(m.topico || 'Reunião')}${m.transcricao ? ' <span class="badge-status" style="background:#2e7d32;color:#fff">com transcrição</span>' : ' <span class="badge-status badge-uso">sem transcrição</span>'}</td>
        <td>${m.duracao || 0} min</td><td>${mb(m.tamanho || 0)} MB</td>
        <td style="white-space:nowrap">${m.transcricao ? `<button type="button" class="btn-visit" data-zma="${i}"><i class="fas fa-file-alt"></i> Criar ata</button> ` : ''}${m.link ? `<a class="btn-visit" href="${esc(m.link)}" target="_blank" rel="noopener" style="background:#6c7a7b">Ver/baixar no Zoom</a> ` : ''}<button type="button" class="icon-btn" data-zmx="${i}" title="Apagar de vez da nuvem do Zoom" aria-label="Apagar do Zoom: ${esc(m.topico || '')}"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table></div>` : ''}
      <p><button type="button" class="btn-visit" id="zm-ant"><i class="fas fa-chevron-left"></i> 30 dias antes</button>${ZM.ate ? ' <button type="button" class="btn-visit" id="zm-dep">30 dias depois <i class="fas fa-chevron-right"></i></button>' : ''} <button type="button" class="btn-visit" id="zm-x" style="background:#6c7a7b">Fechar</button></p>
      <p><small>Antes de apagar: se o vídeo for importante, baixe ou publique no YouTube (não listado). Apagar libera o espaço na hora e não tem volta.</small></p></section>`;
  };
  const isoBR = z => { const d = new Date(z); return isNaN(d) ? '' : new Date(d.getTime() - 3 * 3600e3).toISOString().slice(0, 10); };
  const horaBR = z => { const d = new Date(z); return isNaN(d) ? '' : new Date(d.getTime() - 3 * 3600e3).toISOString().slice(11, 16); };
  const carregaZoom = () => { ZM.carregando = true; ZM.erro = ''; draw();
    const ate = ZM.ate || hoje();
    PR_SUPABASE.funcao('zoom', { acao: 'gravacoes', de: addDia(ate, -30), ate }).then(r => { ZM.carregando = false;
      if (r.status === 200 && r.corpo) ZM.lista = (r.corpo.reunioes || []).sort((a, b) => String(b.inicio).localeCompare(String(a.inicio)));
      else { ZM.lista = null; ZM.erro = r.status === 503 ? 'A ligação com o Zoom ainda não foi configurada no Supabase (função zoom e os códigos ZOOM_*).' : (r.corpo && r.corpo.erro) || 'Não foi possível falar com o Zoom (' + r.status + ').'; }
      draw(); }); };
  const trsBloco = (r, area) => {
    const cats = catsDe(area), cat = cats.find(c => c !== 'Reunião de Escola') || cats[0]; // Reunião de Escola só quando escolhida (ganha o código RE)
    return `<section class="tip-box" style="display:block" id="trs-box"><h4 style="margin-top:0"><i class="fas fa-closed-captioning"></i> Ata a partir da transcrição: conferir</h4>
      <p><small>Arquivo <strong>${esc(r.arquivo)}</strong> · ${esc(r.origem)} · ${r.duracao ? 'duração ' + hhmm(r.duracao) + ' · ' : ''}${r.falas.length} trecho(s) · ${r.palavras.toLocaleString('pt-BR')} palavras</small></p>
      ${r.participantes.length ? `<p><strong>Quem falou (${r.participantes.length}):</strong> ${r.participantes.map(esc).join(', ')}</p>` : '<p><small>Esta transcrição não traz os nomes de quem falou (a legenda do YouTube não tem nomes). Escreva os presentes na descrição, se quiser.</small></p>'}
      <div class="form-row"><label for="tr-t">Título da ata *</label><input id="tr-t" maxlength="140" value="${esc(r.titulo)}"></div>
      <div class="form-row"><label for="tr-d">Data da reunião *</label><input id="tr-d" type="date" value="${esc(r.data || hoje())}"></div>
      <div class="form-row"><label for="tr-c">Categoria *</label><select id="tr-c">${opt(cats, cat)}</select><small>Escolha "Reunião de Escola" só para a Reunião de Escola: ela ganha o código RE-ano.nº e entra em Dar encaminhamento.</small></div>
      <div class="form-row"><label for="tr-v">Link do vídeo no YouTube (opcional)</label><input id="tr-v" type="url" placeholder="https://youtu.be/..." value="${esc(r.video || '')}"></div>
      <details open><summary>Ver a transcrição (${r.falas.length} trechos)</summary><pre style="white-space:pre-wrap;max-height:320px;overflow:auto;background:#fff;border:1px solid #dfe6ec;padding:10px;border-radius:8px;font-family:inherit">${esc(r.texto.slice(0, 60000))}${r.texto.length > 60000 ? '\n…' : ''}</pre></details>
      <p class="form-erro" id="tr-er" role="alert" hidden></p>
      <p><button type="button" class="btn-visit btn-large" id="tr-ok"><i class="fas fa-check"></i> Criar a ata com esta transcrição</button> <button type="button" class="btn-visit" id="tr-x">Cancelar</button></p>
      <p><small>A ata é criada com a transcrição completa guardada nela. Em seguida abre a edição, para você escrever o resumo e os encaminhamentos.</small></p></section>`;
  };
  const impBloco = p => {
    const ativs0 = ativs(), novaAt = id => !ativs0.some(a => a.id === id), ja = id => docs().some(d => d.id === id);
    return `<section class="tip-box" style="display:block"><h4 style="margin-top:0"><i class="fas fa-file-import"></i> Conferir antes de importar</h4>
      ${p.atas.map(a => `<div style="border-top:1px solid #dfe6ec;padding:10px 0">${a.codigo ? `<span class="badge-status" style="background:#1d4a7a;color:#fff">${esc(a.codigo)}</span> ` : ''}<strong>${esc(a.titulo)}</strong> · ${fmtData(a.data)} ${ja(a.id) ? '<span class="badge-status badge-uso">já existe: será atualizada</span> <small>(o que você já mudou na plataforma fica como está; só entra o que falta)</small>' : '<span class="badge-status badge-aprovado">nova</span>'}
        ${a.descricao ? `<p style="margin:4px 0">${esc(a.descricao)}</p>` : ''}
        <p style="margin:4px 0"><small>${a.arquivo ? '<i class="fas fa-file-pdf"></i> ' + esc(a.arqNome || 'ata') + ' · ' : ''}${(a.anexos || []).length ? (a.anexos || []).length + ' anexo(s) · ' : ''}${(a.videos || []).length} vídeo(s)</small></p>
        ${(a.enc || []).length ? `<ul style="margin:4px 0 0 18px">${a.enc.map(e => `<li>${esc(e.texto)}${e.resp ? ` <em>(${esc(e.resp)})</em>` : ''}${e.data ? ' · ' + fmtData(e.data) : ''} · <span style="color:${encCor(e.status || ENC_ST[0])}">${esc(e.status || ENC_ST[0])}</span>${e.cal && e.data ? ' · <i class="fas fa-calendar-plus" title="vai para o calendário"></i>' : ''}</li>`).join('')}</ul>` : ''}</div>`).join('')}
      ${(p.atividades || []).length ? `<div style="border-top:1px solid #dfe6ec;padding:10px 0"><strong>Datas para o calendário</strong><ul style="margin:4px 0 0 18px">${p.atividades.map(t => `<li>${t.semanal ? 'toda semana desde ' : ''}${fmtData(t.data)}${t.fim ? ' a ' + fmtData(t.fim) : ''}${t.hora ? ' · ' + esc(t.hora) : ''} · ${esc(t.titulo)}${t.resp ? ` <em>(${esc(t.resp)})</em>` : ''} <small>(${esc(t.categoria || 'Outras atividades')})${novaAt(t.id) ? '' : ' · já existe: será atualizada'}</small></li>`).join('')}</ul></div>` : ''}
      <p><button type="button" class="btn-visit btn-large" id="imp-ok"><i class="fas fa-check"></i> Está certo, importar</button> <button type="button" class="btn-visit" id="imp-x">Cancelar</button></p></section>`;
  };
  // Importar de novo NUNCA desfaz o que foi mudado na plataforma: no que já existe, só completa o que está vazio
  // (ex.: o texto em espanhol); atas, pontos e datas novas entram normalmente.
  const vazio = x => x === undefined || x === null || x === '' || (Array.isArray(x) && !x.length);
  const completa = (dst, src) => { Object.keys(src).forEach(k => { if (vazio(dst[k]) && !vazio(src[k])) dst[k] = src[k]; }); return dst; };
  const importa = p => {
    const l = docs(), al = ativs(); let nAt = 0, nCal = 0;
    const poeAtiv = (id, x) => { const i = al.findIndex(a => a.id === id); const o = Object.assign({ fim: '', hora: '', local: '', descricao: '', resp: '', semanal: false }, x, { id, origem: 'ata', criado: hoje(), por: me.nome }); if (i >= 0) completa(al[i], o); else al.push(o); nCal++; };
    p.atas.forEach(a => {
      const i = l.findIndex(d => d.id === a.id), antes = i >= 0 ? (l[i].enc || []) : [];
      const enc = (a.enc || []).map(e => {
        const e1 = { id: e.id || uid(), texto: String(e.texto || '').slice(0, 300), es: String(e.es || '').slice(0, 300), resp: String(e.resp || '').slice(0, 80), data: okData(e.data) ? e.data : '', status: ENC_ST.includes(e.status) ? e.status : ENC_ST[0], tipo: e.tipo || 'Outras atividades', ativ: '' };
        const prev = antes.find(x => x.id === e1.id);
        if (prev) return completa(Object.assign({}, prev), { es: e1.es, tipo: e1.tipo });
        if (e.cal && e1.data) { e1.ativ = 'imp-' + e1.id; poeAtiv(e1.ativ, { titulo: e1.texto.slice(0, 120), data: e1.data, categoria: e1.tipo, resp: e1.resp, descricao: e.descricao || '' }); }
        return e1;
      }).concat(antes.filter(x => !(a.enc || []).some(e => e.id === x.id))); // pontos acrescentados na plataforma ficam
      const dados = { area: 'atas', codigo: codigoOk(a.codigo) ? a.codigo : '', titulo: a.titulo, data: a.data, ano: +a.data.slice(0, 4), categoria: a.categoria || 'Reunião de Escola', descricao: a.descricao || '', arquivo: a.arquivo || '', arqNome: a.arqNome || '', link: a.link || '', videos: (a.videos || []).filter(v => /^https:\/\//i.test(v.url || '')), anexos: (a.anexos || []).filter(x => H.safeUrl(x.arquivo || '')), origem: 'importacao' };
      if (i >= 0) { completa(l[i], dados); l[i].enc = enc; }
      else l.push(Object.assign({ id: a.id }, dados, { enc, criado: hoje(), por: me.nome }));
      nAt++;
    });
    (p.atividades || []).forEach(t => poeAtiv(t.id, { titulo: t.titulo, data: t.data, fim: okData(t.fim) ? t.fim : '', hora: t.hora || '', categoria: t.categoria || 'Outras atividades', local: t.local || '', descricao: t.descricao || '', resp: String(t.resp || '').slice(0, 160), semanal: !!t.semanal }));
    if (!db.set('ativ', al) || !db.set('docs', l)) return 'Não foi possível salvar a importação.';
    return `Importação concluída: ${nAt} ata(s) e ${nCal} data(s) no calendário. O que já tinha sido atualizado na plataforma foi mantido.`;
  };

  /* ---------- Atas e documentos ---------- */
  const docArea = (el, area) => {
    const todos = docs().filter(d => d.area === area.id), cats = catsDe(area), ed = typeof form === 'string' && form !== 'novo' ? todos.find(d => d.id === form) : null;
    const anos = [...new Set(todos.map(d => d.ano))].sort((a, b) => b - a);
    el.innerHTML = `<h3><i class="fas ${area.icone}"></i> ${esc(area.nome)}</h3>
    <p>Documentos organizados por ano e, dentro de cada ano, pela data (do mais recente ao mais antigo).${pode ? '' : ' Seu acesso é de consulta.'}</p>
    ${area.id === 'atas' ? (() => { const ab = todos.reduce((n, d) => n + (d.enc || []).filter(e => e.status === 'Em aberto').length, 0); return `<p class="tip-box" role="note"><i class="fas fa-tasks"></i> <strong>${ab}</strong> encaminhamento(s) em aberto nas atas. Decisões que precisam de data podem ser levadas ao calendário direto da ata.</p>`; })() : ''}
    ${msg ? `<p class="tip-box" role="status"><i class="fas fa-check-circle"></i> ${esc(msg)}</p>` : ''}
    ${pode && !form && !imp && !trs ? `<p><button class="btn-visit btn-large" id="d-novo"><i class="fas fa-plus-circle"></i> Novo documento</button>${area.id === 'atas' ? ` <label class="btn-visit btn-large" for="d-imp" style="cursor:pointer"><i class="fas fa-file-import"></i> Importar ata preparada</label><input id="d-imp" type="file" accept=".json,application/json" hidden> <label class="btn-visit btn-large" for="d-trs" style="cursor:pointer"><i class="fas fa-closed-captioning"></i> Ata a partir da transcrição</label><input id="d-trs" type="file" accept=".vtt,.srt,.txt,text/vtt,text/plain" hidden>${zoomLigado() ? ' <button type="button" class="btn-visit btn-large" id="d-zoom"><i class="fas fa-video"></i> Gravações do Zoom</button>' : ''}` : ''}</p>${area.id === 'atas' ? '<p class="vazio"><small>"Importar ata preparada": arquivo .json montado pelo Claude a partir da ata, com datas, encaminhamentos e vídeos. "Ata a partir da transcrição": o arquivo de transcrição do Zoom (.vtt) ou a legenda baixada do YouTube Studio (.vtt ou .srt) vira o rascunho da ata, com participantes e o link do vídeo. Você confere tudo antes de gravar.</small></p>' : ''}` : ''}
    ${pode && imp ? impBloco(imp) : ''}
    ${pode && trs ? trsBloco(trs, area) : ''}
    ${pode && ZM.aberto && !trs ? zoomBloco() : ''}
    ${pode && form ? `<form id="fd" class="form-reserva" novalidate><h4 style="margin-top:0">${ed ? 'Editar documento' : 'Cadastrar documento'}</h4>
      <div class="form-row"><label for="d-t">Título *</label><input id="d-t" maxlength="140" value="${esc(ed ? ed.titulo : '')}"></div>
      <div class="form-row"><label for="d-d">Data *</label><input id="d-d" type="date" value="${esc(ed ? ed.data : hoje())}"></div>
      <div class="form-row"><label for="d-a">Ano *</label><input id="d-a" type="number" min="1900" max="2100" value="${esc(ed ? ed.ano : anoHoje)}"><small>Preenchido pela data; pode ser corrigido.</small></div>
      ${area.id === 'atas' ? `<div class="form-row"><label for="d-cod">Código da ata</label><input id="d-cod" maxlength="16" value="${esc(ed ? ed.codigo || '' : '')}" placeholder="ex.: RE-2026.1 ou RE-2026.2-D1"><small>Padrão: RE-ano.nº da reunião no ano (1 ou 2); -D1, -D2 quando cada dia tem ata própria. Extraordinária: REX-…; outras: ATA-… Em branco, o código é sugerido ao salvar.</small></div>` : ''}
      <div class="form-row"><label for="d-c">Categoria *</label><select id="d-c">${opt(cats, ed ? ed.categoria : cats[0])}<option value="__novo">＋ Nova categoria...</option></select></div>
      <div class="form-row" id="d-cw" hidden><label for="d-cn">Nome da nova categoria *</label><input id="d-cn" maxlength="60"></div>
      <div class="form-row"><label for="d-s">Descrição</label><textarea id="d-s" rows="2" maxlength="400">${esc(ed ? ed.descricao : '')}</textarea></div>
      ${area.id === 'atas' ? encBloco(ed) : ''}
      <div class="form-row"><label for="d-f">Arquivo (até 1 MB)${ed && ed.arquivo ? ' - deixe vazio para manter ' + esc(ed.arqNome || 'o atual') : ''}</label><input id="d-f" type="file" accept=".pdf,.doc,.docx,.odt,.xls,.xlsx,.ods,.ppt,.pptx,image/*"></div>
      <div class="form-row"><label for="d-l">ou link do arquivo (Google Drive, site...)</label><input id="d-l" type="url" placeholder="https://" value="${esc(ed ? ed.link || '' : '')}"><small>Para arquivos grandes, use o link: o navegador só guarda cerca de 5 MB no total.</small></div>
      <p class="form-erro" id="d-e" role="alert" hidden></p>
      <button class="btn-visit btn-large"><i class="fas fa-save"></i> ${ed ? 'Salvar alterações' : 'Cadastrar'}</button> <button type="button" class="btn-visit btn-large" id="d-x" style="background:#6c7a7b;margin-left:8px">Cancelar</button></form>` : ''}
    <div class="inv-filtros no-print"><div class="form-row"><label for="l-a">Ano</label><select id="l-a"><option value="">Todos</option>${anos.map(a => `<option${String(a) === F.ano ? ' selected' : ''}>${a}</option>`).join('')}</select></div>
      <div class="form-row"><label for="l-c">Categoria</label><select id="l-c"><option value="">Todas</option>${cats.map(c => `<option${c === F.cat ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
      <div class="form-row"><label for="l-q">Buscar</label><input id="l-q" type="search" value="${esc(F.q)}" placeholder="Título, código ou descrição"></div>
      ${area.id === 'atas' ? `<div class="form-row"><label><input type="checkbox" id="l-ab"${F.aberto ? ' checked' : ''}> Só atas com encaminhamentos em aberto</label></div>` : ''}</div>
    <div id="l-res"></div>`;
    const lista = () => {
      const q = norm(F.q), f = todos.filter(d => (!F.ano || String(d.ano) === F.ano) && (!F.cat || d.categoria === F.cat) && (!F.aberto || (d.enc || []).some(e => e.status === 'Em aberto')) && (!q || norm(d.titulo + ' ' + d.descricao + ' ' + (d.codigo || '')).includes(q)));
      const por = {}; f.forEach(d => { (por[d.ano] = por[d.ano] || []).push(d); });
      $('#l-res', el).innerHTML = f.length ? Object.keys(por).sort((a, b) => b - a).map(a => `<h4>${a} <small>(${por[a].length} documento(s))</small></h4>` + por[a].sort((x, y) => (y.data || '').localeCompare(x.data || '') || x.titulo.localeCompare(y.titulo, 'pt-BR')).map(d => {
        const link = d.arquivo && H.safeUrl(d.arquivo) ? `<a class="btn-visit" href="${esc(d.arquivo)}" download="${esc(d.arqNome || 'documento')}"><i class="fas fa-download"></i> Baixar</a>` : '';
        const ext = (d.link && /^https?:\/\//i.test(d.link) ? `<a class="btn-visit" href="${esc(d.link)}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> Abrir link</a>` : '')
          + (d.videos || []).filter(v => /^https:\/\//i.test(v.url || '')).map(v => ` <a class="btn-visit" href="${esc(v.url)}" target="_blank" rel="noopener"><i class="fab fa-youtube"></i> ${esc(v.titulo || 'Vídeo')}</a>`).join('')
          + (d.anexos || []).filter(a => H.safeUrl(a.arquivo || '')).map(a => ` <a class="btn-visit" href="${esc(a.arquivo)}" download="${esc(a.nome || 'anexo')}"><i class="fas fa-paperclip"></i> ${esc(a.rotulo || a.nome || 'Anexo')}</a>`).join('');
        return `<div class="doc-item"><div class="doc-data">${fmtData(d.data)}</div><div class="doc-corpo" id="doc-${esc(d.id)}">${d.codigo ? `<span class="badge-status" style="background:#1d4a7a;color:#fff" title="Código da ata">${esc(d.codigo)}</span> ` : ''}<strong>${esc(d.titulo)}</strong> <span class="badge-status badge-uso">${esc(d.categoria)}</span>${d.descricao ? `<p>${esc(d.descricao)}</p>` : ''}${area.id === 'atas' && (d.enc || []).length ? `<ul class="enc-lista" style="margin:6px 0 6px 18px">${d.enc.map(e => encItem(d, e)).join('')}</ul>` : ''}${d.transcricao ? `<details style="margin:6px 0"><summary><i class="fas fa-closed-captioning" aria-hidden="true"></i> Ler a transcrição da reunião</summary><pre style="white-space:pre-wrap;max-height:360px;overflow:auto;background:#fff;border:1px solid #dfe6ec;padding:10px;border-radius:8px;font-family:inherit">${esc(d.transcricao)}</pre><button type="button" class="btn-visit" data-trb="${esc(d.id)}"><i class="fas fa-download"></i> Baixar a transcrição (.txt)</button></details>` : ''}<span class="acoes">${link}${ext}${!link && !ext && !d.transcricao ? '<small class="vazio">Sem arquivo anexado</small>' : ''}${pode ? ` <button class="icon-btn" data-ed="${d.id}" aria-label="Editar ${esc(d.titulo)}"><i class="fas fa-edit" style="color:var(--accent-color)"></i></button><button class="icon-btn" data-del="${d.id}" aria-label="Excluir ${esc(d.titulo)}"><i class="fas fa-trash"></i></button>` : ''}</span></div></div>`;
      }).join('')).join('') : `<p class="vazio">${todos.length ? 'Nenhum documento com esses filtros.' : 'Nenhum documento cadastrado ainda.'}</p>`;
      el.querySelectorAll('[data-es]').forEach(x => x.onchange = () => { if (!pode) return; const [di, ei] = x.dataset.es.split('|'), l = docs(), d = l.find(y => y.id === di), e = d && (d.enc || []).find(y => y.id === ei); if (!e) return; e.status = x.value; db.set('docs', l); msg = 'Situação do encaminhamento atualizada.'; draw(); });
      el.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { form = b.dataset.ed; msg = ''; draw(); window.scrollTo(0, 0); });
      el.querySelectorAll('[data-trb]').forEach(b => b.onclick = () => { const d = docs().find(x => x.id === b.dataset.trb); if (!d) return; const u = URL.createObjectURL(new Blob([d.titulo + '\n' + fmtData(d.data) + '\n\n' + d.transcricao], { type: 'text/plain;charset=utf-8' })), a = document.createElement('a'); a.href = u; a.download = 'transcricao-' + d.data + '.txt'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); });
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (!pode || !confirm('Excluir este documento?')) return; db.set('docs', docs().filter(d => d.id !== b.dataset.del)); msg = 'Documento excluído.'; draw(); });
    };
    $('#l-a', el).onchange = e => { F.ano = e.target.value; lista(); }; $('#l-c', el).onchange = e => { F.cat = e.target.value; lista(); }; $('#l-q', el).oninput = e => { F.q = e.target.value.trim(); lista(); }; const lab = $('#l-ab', el); if (lab) lab.onchange = () => { F.aberto = lab.checked; lista(); };
    lista();
    const nv = $('#d-novo', el); if (nv) nv.onclick = () => { form = 'novo'; msg = ''; draw(); };
    const fi = $('#d-imp', el); if (fi) fi.onchange = () => { const f = fi.files[0]; if (!f) return; const rd = new FileReader();
      rd.onload = () => { const v = validaPacote(rd.result); if (typeof v === 'string') { msg = v; draw(); return; } imp = v; msg = ''; draw(); window.scrollTo(0, 0); }; rd.readAsText(f); };
    const ft = $('#d-trs', el); if (ft) ft.onchange = () => { const f = ft.files[0]; if (!f) return; if (f.size > 3e6) { msg = 'Arquivo grande demais para uma transcrição (máximo 3 MB).'; draw(); return; } const rd = new FileReader();
      rd.onload = () => { const r = lerTranscricao(rd.result, f.name); if (!r.falas.length) { msg = 'Não encontrei texto de transcrição neste arquivo. Use o .vtt do Zoom ou a legenda (.vtt/.srt) baixada do YouTube Studio.'; draw(); return; }
        const dt = r.data || hoje(); trs = Object.assign(r, { arquivo: f.name.slice(0, 120), titulo: 'Reunião de ' + fmtData(dt), video: '' }); msg = ''; draw(); const bx = $('#trs-box', el); if (bx) bx.scrollIntoView({ block: 'start' }); }; rd.readAsText(f); };
    const bz = $('#d-zoom', el); if (bz) bz.onclick = () => { ZM.aberto = true; ZM.ate = ''; carregaZoom(); };
    if (ZM.aberto && $('#zm-box', el)) {
      $('#zm-x', el).onclick = () => { ZM.aberto = false; draw(); };
      $('#zm-ant', el).onclick = () => { ZM.ate = addDia(ZM.ate || hoje(), -30); carregaZoom(); };
      const dp = $('#zm-dep', el); if (dp) dp.onclick = () => { const n = addDia(ZM.ate, 30); ZM.ate = n >= hoje() ? '' : n; carregaZoom(); };
      el.querySelectorAll('[data-zma]').forEach(b => b.onclick = () => { const m = ZM.lista[+b.dataset.zma], ate = ZM.ate || hoje(); b.disabled = true; b.textContent = 'Buscando…';
        PR_SUPABASE.funcao('zoom', { acao: 'transcricao', uuid: m.uuid, de: addDia(ate, -30), ate }).then(r => {
          if (r.status !== 200 || !r.corpo) { ZM.erro = (r.corpo && r.corpo.erro) || 'Não foi possível buscar a transcrição (' + r.status + ').'; draw(); return; }
          const x = lerTranscricao(r.corpo.texto, ''), dt = isoBR(m.inicio) || hoje();
          if (!x.falas.length) { ZM.erro = 'A transcrição desta reunião veio vazia.'; draw(); return; }
          trs = Object.assign(x, { origem: 'Zoom', data: dt, arquivo: (m.topico || 'Reunião') + ' (Zoom)', titulo: (m.topico || 'Reunião') + ' – ' + fmtData(dt), video: '', zoomUuid: m.uuid });
          msg = ''; draw(); const bx = $('#trs-box', el); if (bx) bx.scrollIntoView({ block: 'start' }); }); });
      el.querySelectorAll('[data-zmx]').forEach(b => b.onclick = () => { const m = ZM.lista[+b.dataset.zmx];
        if (!confirm(`Apagar de vez a gravação "${m.topico || 'Reunião'}" de ${fmtData(isoBR(m.inicio))} da nuvem do Zoom?\n\nLibera o espaço na hora e NÃO tem volta. Se o vídeo for importante, baixe antes.`)) return;
        b.disabled = true;
        PR_SUPABASE.funcao('zoom', { acao: 'apagar', uuid: m.uuid, definitivo: true }).then(r => { if (r.status === 200) { msg = 'Gravação apagada da nuvem do Zoom.'; carregaZoom(); } else { ZM.erro = (r.corpo && r.corpo.erro) || 'O Zoom não apagou (' + r.status + ').'; draw(); } }); });
    }
    if (trs) {
      $('#tr-x', el).onclick = () => { trs = null; draw(); };
      $('#tr-ok', el).onclick = () => {
        const er = $('#tr-er', el), falha = m => { er.textContent = m; er.hidden = false; }, t = $('#tr-t', el).value.trim(), dt = $('#tr-d', el).value, cat = $('#tr-c', el).value, v = $('#tr-v', el).value.trim();
        if (!t) return falha('Escreva o título da ata.'); if (!okData(dt)) return falha('Informe a data da reunião.'); if (v && !/^https:\/\//i.test(v)) return falha('O link do vídeo precisa começar com https://');
        const l = docs(), id = uid(), r = trs, dur = r.duracao ? ` · ${hhmm(r.duracao)}` : '';
        const d = { id, area: 'atas', titulo: t, data: dt, ano: +dt.slice(0, 4), categoria: cat, codigo: '', arquivo: '', arqNome: '', link: '',
          descricao: `Rascunho a partir da transcrição automática (${r.origem}${dur}${r.participantes.length ? ' · ' + r.participantes.length + ' participante(s) com fala' : ''}). Falta revisar, resumir e registrar os encaminhamentos.`.slice(0, 400),
          videos: v ? [{ titulo: 'Vídeo da reunião', url: v }] : [], anexos: [], enc: [], participantes: r.participantes.slice(0, 200),
          transcricao: r.texto.slice(0, 400000), transcricaoOrigem: r.origem + ' · ' + r.arquivo, ...(r.zoomUuid ? { zoomUuid: r.zoomUuid } : {}), origem: 'transcricao', criado: hoje(), por: me.nome };
        if (cat === 'Reunião de Escola') d.codigo = sugereCodigo(l, d);
        l.push(d); if (!db.set('docs', l)) return falha('Não foi possível salvar (espaço cheio?).');
        trs = null; form = id; msg = 'Ata criada a partir da transcrição. Agora escreva o resumo e os encaminhamentos e salve.' + (r.zoomUuid ? ' Depois, se o vídeo já estiver guardado, apague a gravação em "Gravações do Zoom" para liberar espaço.' : ''); draw(); window.scrollTo(0, 0);
      };
    }
    if (imp) { $('#imp-x', el).onclick = () => { imp = null; draw(); }; $('#imp-ok', el).onclick = () => { msg = importa(imp); imp = null; draw(); }; }
    if (!form || !pode) return;
    $('#d-x', el).onclick = () => { form = null; draw(); };
    $('#d-d', el).onchange = e => { if (e.target.value) $('#d-a', el).value = e.target.value.slice(0, 4); };
    $('#d-c', el).onchange = e => { $('#d-cw', el).hidden = e.target.value !== '__novo'; };
    const encBox = $('#d-enc', el);
    if (encBox) {
      $('#d-enc-add', el).onclick = () => { encBox.insertAdjacentHTML('beforeend', encLinha(null)); const t = encBox.lastElementChild.querySelector('[data-e="texto"]'); if (t) t.focus(); };
      encBox.onclick = ev => { const b = ev.target.closest('[data-e-rm]'); if (!b) return; const ln = b.closest('.enc-linha'); if (ln.dataset.ativ && !confirm('Este encaminhamento já virou atividade no calendário. Remover aqui NÃO apaga a atividade. Continuar?')) return; ln.remove(); };
    }
    $('#fd', el).onsubmit = async e => {
      e.preventDefault(); if (!pode) return;
      const g = id => $('#' + id, el).value.trim(), er = $('#d-e', el), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
      const t = g('d-t'), dt = g('d-d'), ano = parseInt(g('d-a'), 10), link = g('d-l'), file = $('#d-f', el).files[0];
      if (!t || !dt) return falha('Informe o título e a data.');
      if (!(ano >= 1900 && ano <= 2100)) return falha('Informe um ano válido.');
      let cat = g('d-c'); if (cat === '__novo') { cat = novaCat(area.id, g('d-cn'), area.cats); if (!cat) return falha('Digite o nome da nova categoria.'); }
      if (link && !/^https?:\/\//i.test(link)) return falha('O link deve começar com http:// ou https://');
      let arquivo = ed ? ed.arquivo || '' : '', arqNome = ed ? ed.arqNome || '' : '';
      if (file) {
        if (file.size > MAX_ARQ) return falha('Arquivo maior que 1 MB. Use o campo de link (ex.: Google Drive) ou reduza o arquivo.');
        try { arquivo = await lerArq(file); } catch (x) { return falha('Não foi possível ler o arquivo.'); }
        if (!H.safeUrl(arquivo)) return falha('Tipo de arquivo não aceito.'); arqNome = file.name;
      }
      if (!arquivo && !link && !(ed && (ed.transcricao || (ed.videos || []).length || (ed.anexos || []).length))) return falha('Anexe o arquivo ou informe o link.');
      let enc = null, al = null, novasAt = 0;
      if (area.id === 'atas') {
        enc = []; al = ativs(); const antes = (ed && ed.enc) || [];
        for (const ln of el.querySelectorAll('.enc-linha')) {
          const v = k => { const x = ln.querySelector(`[data-e="${k}"]`); return x ? (x.type === 'checkbox' ? x.checked : x.value.trim()) : ''; };
          const texto = v('texto'); if (!texto && !v('resp') && !v('data')) continue;
          if (!texto) return falha('Descreva o que ficou combinado em cada encaminhamento (ou remova a linha em branco).');
          if (v('cal') && !v('data')) return falha(`Para levar ao calendário, informe a data de: "${texto.slice(0, 50)}".`);
          const e1 = { id: ln.dataset.eid || uid(), texto, resp: v('resp'), data: v('data'), status: v('status') || ENC_ST[0], tipo: v('tipo'), ativ: ln.dataset.ativ || '' }, prev = antes.find(x => x.id === e1.id), at = e1.ativ ? al.find(a => a.id === e1.ativ) : null;
          if (at) { if (!prev || prev.texto !== e1.texto || prev.data !== e1.data || prev.tipo !== e1.tipo) { at.titulo = e1.texto.slice(0, 120); if (e1.data) { at.data = e1.data; if (at.fim && at.fim < at.data) at.fim = ''; } if (e1.tipo) at.categoria = e1.tipo; } }
          else if (v('cal')) { const id = uid(); al.push({ id, titulo: e1.texto.slice(0, 120), data: e1.data, fim: '', hora: '', categoria: e1.tipo || 'Outras atividades', local: '', descricao: e1.resp ? 'Responsável: ' + e1.resp : '', criado: hoje(), por: me.nome, origem: 'ata' }); e1.ativ = id; novasAt++; }
          else e1.ativ = '';
          enc.push(e1);
        }
        if (!db.set('ativ', al)) return falha('Sem espaço no navegador para salvar as atividades.');
      }
      const l = docs(), dados = { area: area.id, titulo: t, data: dt, ano, categoria: cat, descricao: g('d-s'), arquivo, arqNome, link };
      if (enc) dados.enc = enc;
      if (area.id === 'atas') {
        let cod = g('d-cod').toUpperCase().replace(/\s+/g, '');
        if (cod && !codigoOk(cod)) return falha('Código fora do padrão. Use, por exemplo, RE-2026.1 ou RE-2026.2-D1.');
        if (cod && l.some(d => d.codigo === cod && (!ed || d.id !== ed.id))) return falha(`O código ${cod} já é de outra ata.`);
        dados.codigo = cod || sugereCodigo(l, { id: ed && ed.id, categoria: cat, data: dt });
      }
      if (ed) Object.assign(l.find(d => d.id === ed.id), dados, { editado: hoje(), editadoPor: me.nome }); else l.push({ id: uid(), ...dados, criado: hoje(), por: me.nome });
      if (!db.set('docs', l)) return falha('Sem espaço no navegador. Use o link do arquivo em vez de anexar.');
      msg = (ed ? 'Documento atualizado.' : 'Documento cadastrado.') + (novasAt ? ` ${novasAt} atividade(s) criada(s) no calendário.` : ''); form = null; draw();
    };
  };

  /* ---------- Pendências: todos os encaminhamentos em aberto das atas, com o código da ata de origem ----------
     Sinaliza os que estão sem data e sem responsável ("A definir" conta como sem responsável). */
  const P = { f: '', q: '' };
  const semResp = semRespM;
  const pendencias = () => {
    const al = ativs(), out = [];
    docs().filter(d => d.area === 'atas').forEach(d => (d.enc || []).forEach(e => {
      if (e.status !== 'Em aberto') return;
      const at = e.ativ ? al.find(a => a.id === e.ativ) : null, data = at ? at.data : e.data || '';
      out.push({ d, e, data, semData: !data, semResp: semResp(e.resp), atraso: !!data && data < hoje() });
    }));
    return out.sort((x, y) => (x.data ? 0 : 1) - (y.data ? 0 : 1) || (x.data || '').localeCompare(y.data || '') || (x.d.codigo || x.d.data).localeCompare(y.d.codigo || y.d.data));
  };
  const pendArea = el => {
    const todas = pendencias(), n = k => todas.filter(p => p[k]).length;
    const FIL = [['', 'Todas', todas.length], ['semData', 'Sem data', n('semData')], ['semResp', 'Sem responsável', n('semResp')], ['atraso', 'Em atraso', n('atraso')]];
    el.innerHTML = `<h3><i class="fas fa-tasks"></i> O que ainda está pendente</h3>
    <p>Todos os encaminhamentos em aberto das atas, cada um com o <strong>código da ata de origem</strong> (clique para abrir a ata). Quando algo for resolvido, marque <strong>Feito</strong> aqui mesmo ou na ata.${pode ? '' : ' Seu acesso é de consulta.'}</p>
    ${msg ? `<p class="tip-box" role="status"><i class="fas fa-check-circle"></i> ${esc(msg)}</p>` : ''}
    <p class="no-print" role="group" aria-label="Filtrar pendências">${FIL.map(([k, t, c]) => `<button type="button" class="btn-visit${P.f === k ? '' : ' btn-sec'}" data-pf="${k}" aria-pressed="${P.f === k}" style="margin:0 6px 6px 0${P.f === k ? '' : ';background:#e8eef3;color:#1d4a7a'}">${esc(t)} <strong>${c}</strong></button>`).join('')}</p>
    <div class="inv-filtros no-print"><div class="form-row"><label for="p-q">Buscar</label><input id="p-q" type="search" value="${esc(P.q)}" placeholder="Texto, responsável ou código da ata"></div></div>
    <div id="p-res"></div>
    <p class="vazio"><small>Código das atas: RE-ano.nº da reunião no ano (ex.: RE-2026.1 = 1ª Reunião de Escola de 2026); -D1, -D2 quando cada dia da reunião tem ata própria. REX = reunião extraordinária; ATA = outras atas.</small></p>`;
    const lista = () => {
      const q = norm(P.q), f = todas.filter(p => (!P.f || p[P.f]) && (!q || norm([p.e.texto, p.e.resp, p.d.codigo, p.d.titulo].join(' ')).includes(q)));
      $('#p-res', el).innerHTML = f.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Origem</th><th>O que está pendente</th><th>Responsável</th><th>Prazo</th><th>Situação</th></tr></thead><tbody>${f.map(p => `<tr>
        <td><a href="#" data-pa="${esc(p.d.id)}" title="${esc(p.d.titulo)}"><span class="badge-status" style="background:#1d4a7a;color:#fff">${esc(p.d.codigo || 'sem código')}</span></a><br><small>${esc(p.d.titulo)}</small></td>
        <td>${esc(p.e.texto)}${p.e.ativ ? ' <small title="Está nos calendários"><i class="fas fa-calendar-check" aria-hidden="true"></i></small>' : ''}</td>
        <td>${p.semResp ? `<span class="badge-status" style="background:#a31d21;color:#fff">Sem responsável</span>${p.e.resp ? ` <small>(${esc(p.e.resp)})</small>` : ''}` : `<small>${respHtml(p.e.resp)}</small>`}</td>
        <td>${p.semData ? '<span class="badge-status" style="background:#b8620f;color:#fff">Sem data</span>' : `${fmtData(p.data)}${p.atraso ? ' <span class="badge-status" style="background:#a31d21;color:#fff">Em atraso</span>' : ''}`}</td>
        <td>${pode ? `<select data-ps="${esc(p.d.id)}|${esc(p.e.id)}" aria-label="Situação">${opt(ENC_ST, p.e.status)}</select>` : esc(p.e.status)}</td></tr>`).join('')}</tbody></table></div>`
        : `<p class="vazio">${todas.length ? 'Nenhuma pendência com esse filtro.' : 'Nenhuma pendência: todos os encaminhamentos das atas estão resolvidos.'}</p>`;
      el.querySelectorAll('[data-pa]').forEach(a => a.onclick = ev => { ev.preventDefault(); const d = docs().find(x => x.id === a.dataset.pa); sub = 'atas'; form = null; msg = ''; F.ano = ''; F.cat = ''; F.aberto = false; F.q = d ? d.codigo || d.titulo : ''; draw(); const alvo = document.getElementById('doc-' + a.dataset.pa); if (alvo) alvo.scrollIntoView({ block: 'center' }); });
      el.querySelectorAll('[data-ps]').forEach(x => x.onchange = () => { if (!pode) return; const [di, ei] = x.dataset.ps.split('|'), l = docs(), d = l.find(y => y.id === di), e = d && (d.enc || []).find(y => y.id === ei); if (!e) return; e.status = x.value; db.set('docs', l); msg = `Situação atualizada: "${e.texto.slice(0, 60)}" agora está ${x.value}.`; draw(); });
    };
    el.querySelectorAll('[data-pf]').forEach(b => b.onclick = () => { P.f = b.dataset.pf; msg = ''; draw(); });
    $('#p-q', el).oninput = e => { P.q = e.target.value.trim(); lista(); };
    lista();
  };

  /* ---------- Dar encaminhamento: só o que ficou pendente de UMA Reunião de Escola (por padrão a mais recente),
     para nada ficar parado: completar responsável, prazo e próximo passo, e avisar o Grupo de Mestres. ---------- */
  const DE = { r: '', msg: 'status', lang: 'pt' }; // msg: 'status' (cada ponto, padrão) ou 'resumo' (versão curta)
  const encArea = el => {
    const D = darEncaminhamento(db, hoje(), DE.r); DE.r = D.r;
    const { reunioes, itens, nR, nD, prox } = D;
    const link = new URL('.', document.baseURI).href + 'area-restrita.html';
    const mensagem = () => msgResumo(D, link, DE.lang), mensagemStatus = () => msgStatus(D, link, DE.lang), semEs = itens.filter(i => !i.e.es).length;
    const caixaMsg = (titulo, texto) => `<section class="tip-box" style="display:block"><h4 style="margin-top:0"><i class="fab fa-whatsapp"></i> ${esc(titulo)}</h4><p class="no-print" role="group" aria-label="Tipo de mensagem"><button type="button" class="btn-visit" data-dm="status" aria-pressed="${DE.msg === 'status'}" style="${DE.msg === 'status' ? '' : 'background:#e8eef3;color:#1d4a7a'}">Cada ponto com o status</button> <button type="button" class="btn-visit" data-dm="resumo" aria-pressed="${DE.msg === 'resumo'}" style="${DE.msg === 'resumo' ? '' : 'background:#e8eef3;color:#1d4a7a'}">Versão curta (resumo)</button>
        <span style="display:inline-block;margin-left:12px">Idioma: <button type="button" class="btn-visit" data-dl="pt" aria-pressed="${DE.lang === 'pt'}" style="${DE.lang === 'pt' ? '' : 'background:#e8eef3;color:#1d4a7a'}">Português</button> <button type="button" class="btn-visit" data-dl="es" aria-pressed="${DE.lang === 'es'}" style="${DE.lang === 'es' ? '' : 'background:#e8eef3;color:#1d4a7a'}">Español</button></span></p>
      ${DE.lang === 'es' && semEs ? `<p class="tip-box" role="note" style="display:block"><i class="fas fa-language" aria-hidden="true"></i> ${semEs} ponto(s) ainda sem texto em espanhol: aparecem em português. Preencha "Em espanhol" no ponto, abaixo.</p>` : ''}
      <p><small>A mensagem se atualiza sozinha quando você salva um ponto. Confira, ajuste se quiser e envie: nada é enviado sozinho.</small></p>
      <textarea id="de-txt" rows="16" style="width:100%;font-family:inherit">${esc(texto)}</textarea>
      <p><button type="button" class="btn-visit" id="de-cp"><i class="fas fa-copy"></i> Copiar</button> <a class="btn-visit" id="de-wa" href="#" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Abrir no WhatsApp</a> </p></section>`;
    el.innerHTML = `<h3><i class="fas fa-share-square"></i> Dar encaminhamento</h3>
    <p>Somente o que ficou <strong>pendente da ${esc(nomeReuniao(DE.r) || 'última Reunião de Escola')}</strong>, para nada ficar parado nem cair no esquecimento. Aqui você cria a <strong>mensagem para os Mestres com cada ponto e o seu status</strong>: atualize os pontos abaixo (quem assume, prazo, próximo passo) e envie a mensagem pelo WhatsApp.${pode ? '' : ' Seu acesso é de consulta.'}</p>
    ${reunioes.length > 1 ? `<div class="form-row no-print" style="max-width:360px"><label for="de-r">Reunião</label><select id="de-r">${reunioes.map(k => `<option value="${esc(k)}"${k === DE.r ? ' selected' : ''}>${esc(nomeReuniao(k))} (${esc(k)})</option>`).join('')}</select></div>` : ''}
    ${msg ? `<p class="tip-box" role="status"><i class="fas fa-check-circle"></i> ${esc(msg)}</p>` : ''}
    ${DE.r ? `<p class="tip-box" role="note"><i class="fas fa-tasks"></i> <strong>${itens.length}</strong> em aberto · <strong style="color:#a31d21">${nR}</strong> sem responsável · <strong style="color:#b8620f">${nD}</strong> sem data · <strong>${prox.length}</strong> com prazo nos próximos 45 dias</p>
    ${itens.length ? caixaMsg('Mensagem para os Mestres', DE.msg === 'resumo' ? mensagem() : mensagemStatus()) : ''}
    ${itens.length ? '<h4 class="subsection-title"><i class="fas fa-edit" aria-hidden="true"></i> Atualizar o status de cada ponto</h4>' : ''}
    <div id="de-lista">${itens.length ? itens.map((i, n) => `<div class="doc-item" data-de="${esc(i.d.id)}|${esc(i.e.id)}" style="display:block">
      <p style="margin:0 0 6px"><span class="badge-status" style="background:#1d4a7a;color:#fff">${esc(i.d.codigo)}</span>
        ${i.semResp ? '<span class="badge-status" style="background:#a31d21;color:#fff">Sem responsável</span>' : ''} ${i.semData ? '<span class="badge-status" style="background:#b8620f;color:#fff">Sem data</span>' : ''}
        ${i.data && i.data < hoje() ? '<span class="badge-status" style="background:#a31d21;color:#fff">Em atraso</span>' : ''} <small>${i.e.atualizado ? 'atualizado há ' : 'parado há '}${i.parado} dia(s)</small></p>
      <strong>${esc(i.e.texto)}</strong>${i.e.passo ? `<p style="margin:4px 0"><i class="fas fa-shoe-prints" aria-hidden="true"></i> Próximo passo: ${esc(i.e.passo)}</p>` : ''}
      ${!i.semResp ? `<p style="margin:4px 0"><small>${respHtml(i.e.resp)}</small></p>` : ''}
      ${pode ? `<div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));margin-top:8px">
        <div><label for="de-rs${n}" style="display:block;font-weight:600;font-size:.85em">Quem assume</label><input id="de-rs${n}" data-k="resp" maxlength="80" value="${esc(semResp(i.e.resp) ? '' : i.e.resp)}" placeholder="Nome(s)"></div>
        <div><label for="de-dt${n}" style="display:block;font-weight:600;font-size:.85em">Prazo</label><input id="de-dt${n}" data-k="data" type="date" value="${esc(i.data)}"></div>
        <div style="grid-column:span 2;min-width:170px"><label for="de-ps${n}" style="display:block;font-weight:600;font-size:.85em">Próximo passo</label><input id="de-ps${n}" data-k="passo" maxlength="160" value="${esc(i.e.passo || '')}" placeholder="O que fazer agora para andar"></div>
        <div style="grid-column:1/-1"><label for="de-es${n}" style="display:block;font-weight:600;font-size:.85em">Em espanhol (para a mensagem em espanhol)</label><input id="de-es${n}" data-k="es" maxlength="300" value="${esc(i.e.es || '')}" placeholder="Traducción del punto"></div>
        <div><label for="de-st${n}" style="display:block;font-weight:600;font-size:.85em">Situação</label><select id="de-st${n}" data-k="status">${opt(ENC_ST, i.e.status)}</select></div>
        <div style="align-self:end"><button type="button" class="btn-visit" data-de-ok><i class="fas fa-save"></i> Salvar</button></div></div>` : ''}</div>`).join('')
      : '<p class="vazio">Tudo encaminhado: nenhuma pendência desta reunião. 🎉</p>'}</div>` : '<p class="vazio">Nenhuma ata de Reunião de Escola com código (RE-…) cadastrada ainda.</p>'}`;
    const sel = $('#de-r', el); if (sel) sel.onchange = () => { DE.r = sel.value; msg = ''; draw(); };
    el.querySelectorAll('[data-dm]').forEach(b => b.onclick = () => { DE.msg = b.dataset.dm; msg = ''; draw(); });
    el.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => { DE.lang = b.dataset.dl; msg = ''; draw(); });
    const tx = $('#de-txt', el);
    if (tx) {
      const wa = $('#de-wa', el), atual = () => { wa.href = 'https://wa.me/?text=' + encodeURIComponent(tx.value); }; atual(); tx.oninput = atual;
      $('#de-cp', el).onclick = async () => { try { await navigator.clipboard.writeText(tx.value); } catch (x) { tx.select(); try { document.execCommand('copy'); } catch (y) {} } $('#de-cp', el).innerHTML = '<i class="fas fa-check"></i> Copiado'; };
    }
    el.querySelectorAll('[data-de-ok]').forEach(b => b.onclick = () => {
      if (!pode) return; const box = b.closest('[data-de]'), [di, ei] = box.dataset.de.split('|'), v = k => box.querySelector(`[data-k="${k}"]`).value.trim();
      const r = salvarEnc(db, di, ei, { resp: v('resp'), data: v('data'), passo: v('passo'), es: v('es'), status: v('status') }, me.nome, hoje());
      const y = window.scrollY;
      if (!r) { msg = 'Não foi possível salvar.'; draw(); return; }
      msg = r.e.status === 'Em aberto' ? `Encaminhamento atualizado${r.novoCal ? ' e colocado no calendário' : ''}: "${curto(r.e.texto, 60)}".` : `"${curto(r.e.texto, 60)}" marcado como ${r.e.status}.`; draw(); window.scrollTo(0, y);
    });
  };

  /* ---------- Calendários (uma única lista de atividades alimenta todas as visões: semanal, mensal, trimestral, semestral e anual) ---------- */
  const calendario = (el, cal) => {
    const sem = !!cal.semanal; // visão semanal: 7 dias, de domingo a sábado
    const per = C.per[cal.id] || 1, m0 = (per - 1) * cal.n, meses = sem ? [] : Array.from({ length: cal.n }, (_, i) => m0 + i);
    const anoDe = sem ? W.ini : `${C.ano}-01-01`, anoAte = sem ? addDia(W.ini, 6) : `${C.ano}-12-31`;
    const todas = eventos(db, anoDe, anoAte).filter(a => !C.cat || a.categoria === C.cat), ed = typeof form === 'string' && form !== 'novo' ? ativs().find(a => a.id === form) : null;
    const anos = [...new Set([anoHoje - 1, anoHoje, anoHoje + 1, anoHoje + 2, C.ano].concat(ativs().map(a => +a.data.slice(0, 4))))].sort();
    const cats = catsAtiv(), catsFiltro = cats.concat(CAT_FIXA), ini = sem ? W.ini : `${C.ano}-${pad(m0 + 1)}-01`;
    const noDia = iso => todas.filter(a => a.data <= iso && (a.fim || a.data) >= iso);
    const noMes = m => { const a = `${C.ano}-${pad(m + 1)}-01`, b = `${C.ano}-${pad(m + 1)}-31`; return todas.filter(x => x.data <= b && (x.fim || x.data) >= a).sort((x, y) => x.data.localeCompare(y.data) || (x.hora || '').localeCompare(y.hora || '')); };
    const nPosts = key => db.get('com_posts', []).filter(p => p.evento && p.evento.ref === key).length;
    const botoes = a => { const n = nPosts(a.key);
      return (a.fixa ? ' <small class="badge-status badge-uso">data fixa</small>' : '') + (n ? ` <small class="badge-status badge-uso" title="Publicações planejadas para esta data">${n} publicação(ões)</small>` : '')
        + (a.travada ? ` <small class="badge-status badge-uso" title="${a.modulo ? 'Cadastrada em Atividades' : 'Gerida na Campanha Punta de Vacas'}">${a.modulo ? 'Atividades' : 'Campanha'}</small>` : '') + (pode && !a.fixa && !a.travada ? ` <button class="icon-btn" data-ed="${a.id}" aria-label="Editar ${esc(a.titulo)}"><i class="fas fa-edit" style="color:var(--accent-color)"></i></button><button class="icon-btn" data-del="${a.id}" aria-label="Excluir ${esc(a.titulo)}"><i class="fas fa-trash"></i></button>` : '')
        + (H.tem(me, 'comunicacao') && H.irPara ? ` <button class="icon-btn" data-com="${esc(a.key)}|${a.data}" aria-label="Planejar publicações de ${esc(a.titulo)}" title="Planejar publicações nas redes sociais"><i class="fas fa-bullhorn" style="color:var(--accent-color)"></i></button>` : ''); };
    const item = (a, porDia) => { // porDia = true na visão semanal (o dia já está no título do cartão)
      const multi = a.fim && a.fim !== a.data;
      const rot = porDia ? (multi ? `${fmtData(a.data).slice(0, 5)} a ${fmtData(a.fim).slice(0, 5)}` : '') + (a.hora ? ' ' + esc(a.hora) : '')
        : `${a.data.slice(8)}/${a.data.slice(5, 7)}${multi ? ' a ' + fmtData(a.fim).slice(0, 5) : ''}${a.hora ? ' ' + esc(a.hora) : ''}`;
      return `<li><span class="cal-ponto" style="background:${cor(a.categoria)}"></span><span>${rot.trim() ? `<strong>${rot.trim()}</strong> ` : ''}${esc(a.titulo)}${a.semanal ? ' <small title="Repete toda semana"><i class="fas fa-redo"></i> semanal</small>' : ''}${a.local ? ` <small>(${esc(a.local)})</small>` : ''}${a.zoom && /^https:\/\//.test(a.zoom) ? ` <a href="${esc(a.zoom)}" target="_blank" rel="noopener" title="Entrar na reunião pelo Zoom"><i class="fas fa-video" aria-hidden="true"></i> Zoom</a>` : ''}${a.resp ? `<br><small>${respHtml(a.resp)}</small>` : ''}${a.descricao ? `<br><small>${esc(a.descricao)}</small>` : ''}${botoes(a)}</span></li>`;
    };
    const mesCard = m => {
      const prim = new Date(C.ano, m, 1).getDay(), dias = new Date(C.ano, m + 1, 0).getDate(); let c = '';
      for (let i = 0; i < prim; i++) c += '<span></span>';
      for (let d = 1; d <= dias; d++) { const iso = `${C.ano}-${pad(m + 1)}-${pad(d)}`, as = noDia(iso); c += `<span class="cal-dia${as.length ? ' tem' : ''}${iso === hoje() ? ' hoje' : ''}"${as.length ? ` style="background:${cor(as[0].categoria)}" title="${esc(as.map(a => a.titulo).join(' | '))}"` : ''}>${d}</span>`; }
      const l = noMes(m);
      return `<div class="cal-mes"><h4>${MESES[m]} ${C.ano}</h4><div class="cal-grade">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(x => `<b>${x}</b>`).join('')}${c}</div>
      ${l.length ? `<ul class="cal-lista">${l.map(a => item(a, false)).join('')}</ul>` : '<p class="vazio">Sem atividades.</p>'}</div>`;
    };
    const diaCard = iso => {
      const l = noDia(iso).sort((x, y) => (x.hora || '').localeCompare(y.hora || '') || x.titulo.localeCompare(y.titulo, 'pt-BR'));
      return `<div class="cal-mes${iso === hoje() ? ' cal-hoje' : ''}"><h4>${DIAS[new Date(iso + 'T12:00:00').getDay()]} <small>${fmtData(iso).slice(0, 5)}</small></h4>
      ${l.length ? `<ul class="cal-lista">${l.map(a => item(a, true)).join('')}</ul>` : '<p class="vazio">Sem atividades.</p>'}</div>`;
    };
    const dias7 = Array.from({ length: 7 }, (_, i) => addDia(W.ini, i));
    const filtroTipo = `<div class="form-row"><label for="c-c">Tipo de atividade</label><select id="c-c"><option value="">Todos</option>${opt(catsFiltro, C.cat)}</select></div>`;
    el.innerHTML = `<h3><i class="fas fa-calendar-alt"></i> ${esc(cal.nome)}</h3>
    <p>As atividades do Parque são cadastradas uma só vez e aparecem automaticamente nos calendários semanal, mensal, trimestral, semestral e anual.${pode ? '' : ' Seu acesso é de consulta.'}</p>
    ${msg ? `<p class="tip-box" role="status"><i class="fas fa-check-circle"></i> ${esc(msg)}</p>` : ''}
    ${sem ? `<div class="inv-filtros no-print"><div class="form-row"><label for="w-d">Ir para a semana de</label><input id="w-d" type="date" value="${W.ini}"></div>${filtroTipo}</div>
      <p class="no-print"><button class="btn-visit" id="w-ant"><i class="fas fa-chevron-left"></i> Semana anterior</button> <button class="btn-visit" id="w-hoje">Semana atual</button> <button class="btn-visit" id="w-prox">Próxima semana <i class="fas fa-chevron-right"></i></button></p>
      <h4>Semana de ${fmtData(W.ini)} a ${fmtData(dias7[6])}</h4>`
    : `<div class="inv-filtros no-print"><div class="form-row"><label for="c-a">Ano</label><select id="c-a">${anos.map(a => `<option${a === C.ano ? ' selected' : ''}>${a}</option>`).join('')}</select></div>
      ${cal.pers.length > 1 ? `<div class="form-row"><label for="c-p">${cal.perRot || 'Período'}</label><select id="c-p">${cal.pers.map((p, i) => `<option value="${i + 1}"${i + 1 === per ? ' selected' : ''}>${p}</option>`).join('')}</select></div>` : ''}
      ${filtroTipo}</div>`}
    <p class="cal-legenda">${catsFiltro.map(c => `<span><i style="background:${cor(c)}"></i>${esc(c)}</span>`).join('')}</p>
    ${pode && !form ? '<p class="no-print"><button class="btn-visit btn-large" id="a-novo"><i class="fas fa-plus-circle"></i> Nova atividade</button></p>' : ''}
    ${pode && form ? `<form id="fa" class="form-reserva" novalidate><h4 style="margin-top:0">${ed ? 'Editar atividade' : 'Cadastrar atividade'}</h4>
      <div class="form-row"><label for="a-t">Título *</label><input id="a-t" maxlength="120" value="${esc(ed ? ed.titulo : '')}"></div>
      <div class="form-row"><label for="a-d">Data (início) *</label><input id="a-d" type="date" value="${esc(ed ? ed.data : ini)}"></div>
      <div class="form-row"><label for="a-f">Data final (se durar mais de um dia)</label><input id="a-f" type="date" value="${esc(ed ? ed.fim || '' : '')}"></div>
      <div class="form-row"><label for="a-h">Horário (opcional)</label><input id="a-h" type="time" value="${esc(ed ? ed.hora || '' : '')}"></div>
      <div class="form-row"><label for="a-c">Tipo de atividade *</label><select id="a-c">${opt(cats, ed ? ed.categoria : cats[0])}<option value="__novo">＋ Novo tipo...</option></select></div>
      <div class="form-row" id="a-cw" hidden><label for="a-cn">Nome do novo tipo *</label><input id="a-cn" maxlength="60"></div>
      <div class="form-row"><label><input type="checkbox" id="a-sem" ${ed && ed.semanal ? 'checked' : ''}> Repete toda semana, no mesmo dia (até a data final; sem data final, segue sempre)</label></div>
      <div class="form-row"><label for="a-l">Local</label><input id="a-l" maxlength="80" value="${esc(ed ? ed.local || '' : '')}"></div>
      ${zoomLigado() ? `<div class="form-row"><label><input type="checkbox" id="a-zoom" ${ed && ed.zoom ? 'checked disabled' : ''}> ${ed && ed.zoom ? 'Já tem reunião no Zoom' : 'Criar a reunião no Zoom do Parque para esta atividade (o link de entrada aparece no calendário)'}</label>${ed && ed.zoom ? ` <small><a href="${esc(ed.zoom)}" target="_blank" rel="noopener">${esc(ed.zoom)}</a></small>` : '<small>Precisa da hora. Atividade semanal vira reunião semanal no Zoom (mesmo link toda semana).</small>'}</div>` : ''}
      <div class="form-row"><label for="a-r">Responsável</label><input id="a-r" maxlength="160" value="${esc(ed ? ed.resp || '' : '')}" placeholder="Nome(s), mesmo de quem ainda não tem cadastro"><small>Quem tiver cadastro na área restrita aparece marcado no calendário.</small></div>
      <div class="form-row"><label for="a-s">Descrição</label><textarea id="a-s" rows="2" maxlength="300">${esc(ed ? ed.descricao || '' : '')}</textarea></div>
      <p class="form-erro" id="a-e" role="alert" hidden></p>
      <button class="btn-visit btn-large"><i class="fas fa-save"></i> ${ed ? 'Salvar alterações' : 'Cadastrar'}</button> <button type="button" class="btn-visit btn-large" id="a-x" style="background:#6c7a7b;margin-left:8px">Cancelar</button></form>` : ''}
    <div class="cal-meses">${sem ? dias7.map(diaCard).join('') : meses.map(mesCard).join('')}</div>
    ${cal.id === 'ano' ? '<div id="fx-box" style="margin-top:28px"></div>' : ''}`;
    if (sem) {
      $('#w-d', el).onchange = e => { if (e.target.value) { W.ini = domingoDe(e.target.value); draw(); } };
      $('#w-ant', el).onclick = () => { W.ini = addDia(W.ini, -7); draw(); };
      $('#w-prox', el).onclick = () => { W.ini = addDia(W.ini, 7); draw(); };
      $('#w-hoje', el).onclick = () => { W.ini = domingoDe(hoje()); draw(); };
    } else {
      $('#c-a', el).onchange = e => { C.ano = +e.target.value; draw(); };
      const p = $('#c-p', el); if (p) p.onchange = () => { C.per[cal.id] = +p.value; draw(); };
    }
    $('#c-c', el).onchange = e => { C.cat = e.target.value; draw(); };
    el.querySelectorAll('[data-com]').forEach(b => b.onclick = () => { sessionStorage.setItem('pr_com_evento', b.dataset.com); H.irPara('comunicacao'); });
    if (cal.id === 'ano') gerirFixas($('#fx-box', el), H, pode, m => { msg = m; draw(); });
    el.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { form = b.dataset.ed; msg = ''; draw(); window.scrollTo(0, 0); });
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (!pode || !confirm('Excluir esta atividade? Ela some de todos os calendários.')) return; db.set('ativ', ativs().filter(a => a.id !== b.dataset.del)); msg = 'Atividade excluída.'; draw(); });
    const nv = $('#a-novo', el); if (nv) nv.onclick = () => { form = 'novo'; msg = ''; draw(); window.scrollTo(0, 0); };
    if (!form || !pode) return;
    $('#a-x', el).onclick = () => { form = null; draw(); };
    $('#a-c', el).onchange = e => { $('#a-cw', el).hidden = e.target.value !== '__novo'; };
    $('#fa', el).onsubmit = e => {
      e.preventDefault(); if (!pode) return;
      const g = id => $('#' + id, el).value.trim(), er = $('#a-e', el), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
      const t = g('a-t'), d = g('a-d'), f = g('a-f');
      if (!t || !d) return falha('Informe o título e a data.');
      if (f && f < d) return falha('A data final não pode ser antes da data inicial.');
      let cat = g('a-c'); if (cat === '__novo') { cat = novaCat('ativ_cats', g('a-cn'), ATIV_CATS); if (!cat) return falha('Digite o nome do novo tipo.'); }
      const l = ativs(), dados = { titulo: t, data: d, fim: f && f !== d ? f : '', hora: g('a-h'), categoria: cat, local: g('a-l'), descricao: g('a-s'), resp: g('a-r'), semanal: $('#a-sem', el).checked };
      const querZoom = $('#a-zoom', el) && $('#a-zoom', el).checked && !(ed && ed.zoom);
      if (querZoom && !/^\d{1,2}:\d{2}/.test(dados.hora)) return falha('Para criar a reunião no Zoom, informe a hora.');
      const novoId = ed ? ed.id : uid();
      if (ed) Object.assign(l.find(a => a.id === ed.id), dados); else l.push({ id: novoId, ...dados, criado: hoje(), por: me.nome });
      if (!db.set('ativ', l)) return falha('Sem espaço no navegador para salvar.');
      if (querZoom) {
        const [hh, mi] = dados.hora.split(':'), dur = 60;
        PR_SUPABASE.funcao('zoom', { acao: 'criar_reuniao', topico: dados.titulo, inicio: `${dados.data}T${hh.padStart(2, '0')}:${mi.slice(0, 2)}`, duracao: dur, descricao: dados.descricao, semanal: dados.semanal }).then(r => {
          const l2 = ativs(), a = l2.find(x => x.id === novoId);
          if (r.status === 200 && r.corpo && r.corpo.link && a) { a.zoom = r.corpo.link; a.zoomId = r.corpo.id; if (r.corpo.senha) a.zoomSenha = r.corpo.senha; db.set('ativ', l2); msg = 'Reunião criada no Zoom. O link de entrada já está na atividade.'; }
          else msg = 'A atividade foi salva, mas o Zoom não criou a reunião: ' + ((r.corpo && r.corpo.erro) || 'erro ' + r.status) + (r.status === 503 ? ' (falta configurar a ligação com o Zoom no Supabase).' : '');
          draw();
        });
      }
      C.ano = +d.slice(0, 4); const mm = +d.slice(5, 7) - 1; C.per = { mes: mm + 1, tri: Math.floor(mm / 3) + 1, sem: mm < 6 ? 1 : 2, ano: 1 }; W.ini = domingoDe(d); // mostra o período da atividade salva
      msg = (ed ? 'Atividade atualizada' : 'Atividade cadastrada') + '. Ela já aparece nos calendários semanal, mensal, trimestral, semestral e anual.'; form = null; draw();
    };
  };

  /* ---------- Estrutura da aba ---------- */
  const SUB = areas.map(a => [a.id, a.nome]).concat(areas.some(a => a.id === 'atas') ? [['pend', 'Pendências'], ['dar', 'Dar encaminhamento']] : [], cals.map(c => [c.id, c.nome]));
  const draw = () => {
    root.innerHTML = `${SUB.length > 1 ? `<div class="tabs sub no-print" role="tablist">${SUB.map(t => `<button class="tab-btn${t[0] === sub ? ' active' : ''}" data-s="${t[0]}">${esc(t[1])}</button>`).join('')}</div>` : ''}<div id="doc-sub"></div>`;
    root.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sub = b.dataset.s; form = null; msg = ''; F.ano = F.cat = F.q = ''; F.aberto = false; draw(); });
    const area = areas.find(a => a.id === sub), cal = cals.find(c => c.id === sub);
    if (area) docArea($('#doc-sub', root), area); else if (sub === 'pend') pendArea($('#doc-sub', root)); else if (sub === 'dar') encArea($('#doc-sub', root)); else calendario($('#doc-sub', root), cal);
  };
  draw();
} };
})();
