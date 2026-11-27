// Ajuda para escrever a descrição de uma imagem (texto alternativo), sem IA e sem custo (27/11/2026).
// O painel faz poucas perguntas e monta o texto seguindo as boas práticas de acessibilidade; o leitor de tela lê o texto em voz alta.
// Uso: PR_DESCREVER.abrir({ imagem: <url ou data:>, campo: <input/textarea que recebe o texto>, titulo: 'opcional' })
// Também gera um "pedido pronto" para colar no Claude (assinatura do próprio usuário), sem chave nem servidor.
(function () {
'use strict';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MODOS = {
  1: { nome: 'Texto alternativo', info: 'Curto, para o campo de descrição da imagem', fim: 'o campo "texto alternativo" (leitores de tela), curto, de uma frase, com até cerca de 125 caracteres' },
  2: { nome: 'Audiodescrição', info: 'Detalhada: cena, pessoas, cores e textos', fim: 'uma audiodescrição detalhada, em parágrafo corrido, com cena, pessoas, cores e textos visíveis' },
  3: { nome: 'Legenda acessível', info: 'Para redes sociais, com a descrição embutida', fim: 'uma legenda de rede social que já traga a descrição da imagem para quem não enxerga' },
  4: { nome: 'Leitura reflexiva', info: 'Símbolos, clima e mensagem da imagem', fim: 'uma leitura interpretativa curta: símbolos, clima e mensagem, sem inventar fatos' }
};
const limpa = s => String(s || '').trim().replace(/\s+/g, ' ').replace(/[.\s]+$/, '');
const semPrefixo = s => limpa(s).replace(/^(uma?\s+)?(imagem|foto|fotografia|banner)\s+(de|do|da|dos|das)\s+/i, '');
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
// d: { oque, texto, detalhes, clima }
function compor(modo, d) {
  const o = semPrefixo(d.oque), tx = limpa(d.texto), de = limpa(d.detalhes), cl = limpa(d.clima);
  if (!o && !tx) return '';
  if (modo === 2) return [`A imagem mostra ${o || 'um texto'}.`, de ? cap(de) + '.' : '', tx ? `Está escrito: “${tx}”.` : ''].filter(Boolean).join(' ');
  if (modo === 3) return `${tx ? cap(tx) : cap(o)}${de ? ' — ' + de : ''}. (Imagem: ${o || 'texto'}.)`;
  if (modo === 4) return [cap(o) + '.', cl ? cap(cl) + '.' : '', de ? cap(de) + '.' : ''].filter(Boolean).join(' ');
  return cap(o || 'Texto') + (tx && o ? `, com o texto “${tx}”` : '') + (de ? ', ' + de : '') + '.';
}
function pedido(modo, d, titulo) {
  const m = MODOS[modo] || MODOS[1];
  return `Você é especialista em acessibilidade digital. Descreva a imagem que estou anexando, em português do Brasil, para ${m.fim}.
Regras: não comece com "imagem de" nem "foto de"; seja objetivo; inclua qualquer texto que apareça na arte; não invente nomes, datas ou fatos que não estejam visíveis ou abaixo; evite opinião.
${titulo ? 'Imagem usada em: ' + limpa(titulo) + '\n' : ''}${limpa(d.oque) ? 'O que é: ' + limpa(d.oque) + '\n' : ''}${limpa(d.texto) ? 'Texto que aparece: ' + limpa(d.texto) + '\n' : ''}${limpa(d.detalhes) ? 'Detalhes importantes: ' + limpa(d.detalhes) + '\n' : ''}${limpa(d.clima) ? 'Clima ou mensagem: ' + limpa(d.clima) + '\n' : ''}Responda só com o texto final.`;
}
const copiar = async t => { try { await navigator.clipboard.writeText(t); return true; } catch (e) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { /* sem cópia */ } a.remove(); return ok; } };
let aberto = null;
function abrir(o) {
  if (aberto) aberto.fechar();
  const campo = o.campo, titulo = o.titulo || '', limite = (campo && +campo.maxLength > 0) ? +campo.maxLength : 0;
  let modo = 1; try { const m = +localStorage.getItem('pr-desc-modo'); if (MODOS[m]) modo = m; } catch (e) { /* sem armazenamento */ }
  const antes = document.activeElement;
  const ov = document.createElement('div'); ov.className = 'dsc-ov';
  ov.innerHTML = `<div class="dsc-box" role="dialog" aria-modal="true" aria-labelledby="dsc-t">
    <div class="dsc-cab"><h3 id="dsc-t">Descrever a imagem</h3><button type="button" class="dsc-x" id="dsc-fecha" aria-label="Fechar"><i class="fas fa-times" aria-hidden="true"></i></button></div>
    <div class="dsc-corpo">
      <div class="dsc-img">${o.imagem ? `<img src="${esc(o.imagem)}" alt="Imagem a descrever" loading="lazy">` : '<p class="vazio">Escolha a imagem antes.</p>'}</div>
      <div class="dsc-form">
        <div class="dsc-modo"><button type="button" class="dsc-chip" id="dsc-m" aria-haspopup="listbox" aria-expanded="false"><i class="fas fa-sliders-h" aria-hidden="true"></i> <span id="dsc-mt"></span> <i class="fas fa-chevron-down" aria-hidden="true"></i></button>
          <div class="dsc-pop" id="dsc-lista" role="listbox" aria-label="Modo" hidden>${Object.keys(MODOS).map(k => `<button type="button" role="option" class="dsc-op" data-m="${k}"><span class="dsc-n">${k}</span><span><b>${MODOS[k].nome}</b><small>${MODOS[k].info}</small></span></button>`).join('')}</div></div>
        <label for="dsc-o">O que é a imagem? <small>(ex.: ilustração do Parque com árvores)</small></label><input id="dsc-o" maxlength="200" autocomplete="off">
        <label for="dsc-tx">Texto que aparece nela <small>(opcional)</small></label><input id="dsc-tx" maxlength="200" autocomplete="off">
        <label for="dsc-d">Detalhes importantes <small>(opcional: data, local, pessoas, cores)</small></label><input id="dsc-d" maxlength="200" autocomplete="off">
        <div id="dsc-clw"><label for="dsc-c">Clima ou mensagem <small>(opcional)</small></label><input id="dsc-c" maxlength="200" autocomplete="off"></div>
        <p><button type="button" class="btn-visit" id="dsc-g"><i class="fas fa-magic" aria-hidden="true"></i> Montar texto</button> <button type="button" class="btn-visit" id="dsc-p"><i class="fas fa-copy" aria-hidden="true"></i> Copiar pedido para o Claude</button></p>
        <label for="dsc-r">Texto <small>(pode editar)</small></label><textarea id="dsc-r" rows="4"></textarea>
        <p class="dsc-cont" id="dsc-cont" role="status"></p>
        <p class="dsc-bot"><button type="button" class="btn-visit btn-large" id="dsc-u"><i class="fas fa-check" aria-hidden="true"></i> ${campo ? 'Usar no campo' : 'Fechar'}</button> <button type="button" class="btn-visit" id="dsc-c2"><i class="fas fa-copy" aria-hidden="true"></i> Copiar texto</button></p>
      </div></div></div>`;
  document.body.appendChild(ov);
  const q = s => ov.querySelector(s), $r = q('#dsc-r'), lista = q('#dsc-lista'), bm = q('#dsc-m');
  const dados = () => ({ oque: q('#dsc-o').value, texto: q('#dsc-tx').value, detalhes: q('#dsc-d').value, clima: q('#dsc-c').value });
  const cont = () => {
    const n = $r.value.length; let t = n + ' caracteres';
    if (modo === 1) t += n <= 125 ? ' · tamanho bom' : n <= 200 ? ' · um pouco longo; prefira até 125' : ' · longo para um texto alternativo';
    if (limite && n > limite) t += ` · o campo aceita até ${limite}; encurte`;
    q('#dsc-cont').textContent = t;
  };
  const setModo = m => { modo = m; q('#dsc-mt').textContent = m + ' · ' + MODOS[m].nome; q('#dsc-clw').hidden = m !== 4; lista.querySelectorAll('.dsc-op').forEach(b => { b.classList.toggle('sel', +b.dataset.m === m); b.setAttribute('aria-selected', +b.dataset.m === m ? 'true' : 'false'); }); try { localStorage.setItem('pr-desc-modo', String(m)); } catch (e) { /* sem armazenamento */ } cont(); };
  const fechaLista = () => { lista.hidden = true; bm.setAttribute('aria-expanded', 'false'); };
  bm.onclick = e => { e.stopPropagation(); lista.hidden = !lista.hidden; bm.setAttribute('aria-expanded', lista.hidden ? 'false' : 'true'); if (!lista.hidden) { const s = lista.querySelector('.sel') || lista.querySelector('.dsc-op'); s.focus(); } };
  lista.querySelectorAll('.dsc-op').forEach(b => { b.onclick = () => { setModo(+b.dataset.m); fechaLista(); bm.focus(); if ($r.value && q('#dsc-o').value) $r.value = compor(modo, dados()); cont(); }; });
  q('#dsc-g').onclick = () => { const t = compor(modo, dados()); if (!t) { q('#dsc-cont').textContent = 'Diga primeiro o que é a imagem.'; q('#dsc-o').focus(); return; } $r.value = t; cont(); $r.focus(); };
  q('#dsc-p').onclick = async () => { q('#dsc-cont').textContent = (await copiar(pedido(modo, dados(), titulo))) ? 'Pedido copiado. Cole no Claude e anexe a imagem; depois traga o texto para o campo “Texto”.' : 'Não consegui copiar.'; };
  q('#dsc-c2').onclick = async () => { q('#dsc-cont').textContent = (await copiar($r.value)) ? 'Texto copiado.' : 'Não consegui copiar.'; };
  $r.oninput = cont;
  const fecha = () => { if (!ov.isConnected) return; ov.remove(); document.removeEventListener('keydown', tecla, true); aberto = null; if (antes && antes.focus) antes.focus(); };
  q('#dsc-u').onclick = () => {
    if (!campo) return fecha();
    const t = $r.value.trim(); if (!t) { q('#dsc-cont').textContent = 'Monte ou escreva o texto antes.'; return; }
    if (limite && t.length > limite) { q('#dsc-cont').textContent = `O campo aceita até ${limite} caracteres e o texto tem ${t.length}. Encurte, ou use o modo 1.`; return; }
    campo.value = t; campo.dispatchEvent(new Event('input', { bubbles: true })); campo.dispatchEvent(new Event('change', { bubbles: true })); fecha();
  };
  q('#dsc-fecha').onclick = fecha;
  ov.addEventListener('mousedown', e => { if (e.target === ov && !(q('#dsc-o').value || q('#dsc-tx').value || q('#dsc-d').value || $r.value)) fecha(); });
  ov.addEventListener('click', e => { if (!e.target.closest('#dsc-lista') && !e.target.closest('#dsc-m')) fechaLista(); });
  function tecla(e) {
    if (e.key === 'Escape') { e.stopPropagation(); if (!lista.hidden) { fechaLista(); bm.focus(); } else fecha(); return; }
    if (e.key === 'Tab') { const f = Array.from(ov.querySelectorAll('button:not([hidden]), input, textarea')).filter(x => x.offsetParent !== null && !x.disabled); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    if (!lista.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); const ops = Array.from(lista.querySelectorAll('.dsc-op')), i = ops.indexOf(document.activeElement); ops[(i + (e.key === 'ArrowDown' ? 1 : -1) + ops.length) % ops.length].focus(); }
  }
  document.addEventListener('keydown', tecla, true);
  setModo(modo); if (campo && campo.value) $r.value = campo.value; cont(); q('#dsc-o').focus();
  aberto = { fechar: fecha };
}
window.PR_DESCREVER = { abrir, compor, pedido, MODOS };
})();
