// Área restrita > Comunicação e Redes Sociais > Site: gestão dos banners de cada página.
// Dados (rascunho, neste navegador): pr_site_banners = [{ id: slug, modo: 'fixo'|'carrossel', intervalo, slides: [{id, img, alt, link, ativo}], atualizado }]
// Publicação: botão "Baixar pacote" gera um ZIP com banners/banners.json + imagens; basta copiar a pasta "banners" para o site.
(function () {
const B = window.PR_BANNERS;
const IMG_Q = 0.85, TOL = 0.02; // qualidade JPEG; tolerância da proporção (2%)

/* ---------- ZIP mínimo (sem compressão) ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zip(arquivos) { // [{nome, dados:Uint8Array}]
  const enc = new TextEncoder(), partes = [], central = []; let off = 0;
  const d = new Date(), dt = ((d.getFullYear() - 1980) << 9 | (d.getMonth() + 1) << 5 | d.getDate()) & 0xFFFF, hr = (d.getHours() << 11 | d.getMinutes() << 5 | (d.getSeconds() >> 1)) & 0xFFFF;
  arquivos.forEach(f => {
    const nome = enc.encode(f.nome), crc = crc32(f.dados), n = f.dados.length;
    const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true); lh.setUint16(10, hr, true); lh.setUint16(12, dt, true); lh.setUint32(14, crc, true); lh.setUint32(18, n, true); lh.setUint32(22, n, true); lh.setUint16(26, nome.length, true); lh.setUint16(28, 0, true);
    partes.push(new Uint8Array(lh.buffer), nome, f.dados);
    const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, hr, true); ch.setUint16(14, dt, true); ch.setUint32(16, crc, true); ch.setUint32(20, n, true); ch.setUint32(24, n, true); ch.setUint16(28, nome.length, true); ch.setUint32(42, off, true);
    central.push(new Uint8Array(ch.buffer), nome); off += 30 + nome.length + n;
  });
  const tam = central.reduce((s, x) => s + x.length, 0), fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, arquivos.length, true); fim.setUint16(10, arquivos.length, true); fim.setUint32(12, tam, true); fim.setUint32(16, off, true);
  return new Blob(partes.concat(central, [new Uint8Array(fim.buffer)]), { type: 'application/zip' });
}
const dataUrlBytes = u => { const b = atob(u.split(',')[1]), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; };

/* ---------- Imagem: valida proporção e ajusta para a medida exata ---------- */
function carregaImg(file) {
  return new Promise((ok, no) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); ok(im); }; im.onerror = () => { URL.revokeObjectURL(u); no(new Error('Não foi possível ler a imagem.')); }; im.src = u; });
}
async function preparaImagem(file, slot) {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) throw new Error(`"${file.name}": use JPG, PNG ou WebP.`);
  if (file.size > 15 * 1048576) throw new Error(`"${file.name}": arquivo grande demais (máx. 15 MB).`);
  const im = await carregaImg(file), r = im.width / im.height, alvo = slot.w / slot.h;
  if (Math.abs(r - alvo) / alvo > TOL) throw new Error(`"${file.name}" tem ${im.width} × ${im.height} px (proporção ${r.toFixed(2)}:1). Este espaço exige ${slot.w} × ${slot.h} px (proporção ${alvo.toFixed(2)}:1). Ajuste a imagem e envie de novo.`);
  const c = document.createElement('canvas'); c.width = slot.w; c.height = slot.h;
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, slot.w, slot.h);
  return { img: c.toDataURL('image/jpeg', IMG_Q), aviso: im.width < slot.w ? `"${file.name}" tem só ${im.width} px de largura (o ideal é ${slot.w}); pode ficar com pouca nitidez.` : '' };
}

window.PR_BANNERS_ADMIN = { zip, crc32, abrir(el, H) {
  const { db, esc, $, uid, hoje } = H;
  try { localStorage.setItem('pr_site_preview', String(Date.now())); } catch (e) { /* sem pré-visualização em outras abas */ }
  const todos = () => db.get('site_banners', []);
  const cfgDe = slug => todos().find(x => x.id === slug) || { id: slug, modo: 'fixo', intervalo: B.INTERVALO_PADRAO, slides: [] };
  const salva = c => { const l = todos(), i = l.findIndex(x => x.id === c.id); c.atualizado = new Date().toISOString(); if (i >= 0) l[i] = c; else l.push(c); return db.set('site_banners', l); };
  let aberto = '', msg = '', erro = '', aviso = '';
  try { aberto = sessionStorage.getItem('pr_com_banner') || ''; sessionStorage.removeItem('pr_com_banner'); } catch (e) { /* sem atalho vindo do Painel */ }
  const kb = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB';
  const tamSlot = c => (c.slides || []).reduce((s, x) => s + (x.img ? x.img.length : 0), 0);
  const grupos = () => { const g = []; B.SLOTS.forEach(s => { let x = g.find(y => y[0] === s.grupo); if (!x) g.push(x = [s.grupo, []]); x[1].push(s); }); return g; };

  const cartao = s => {
    const c = cfgDe(s.slug), n = c.slides.length, ativos = c.slides.filter(x => x.ativo !== false && x.img).length, ab = aberto === s.slug;
    const estado = !n ? '<span class="badge-status badge-pend">Sem banner novo (usa o da página)</span>' : `<span class="badge-status badge-disponivel">${c.modo === 'carrossel' ? 'Carrossel' : 'Fixo'} · ${ativos} imagem(ns) ativa(s)</span>`;
    const corpo = !ab ? '' : `<div class="bn-corpo">
      <p><label><input type="radio" name="m-${s.slug}" value="fixo" ${c.modo !== 'carrossel' ? 'checked' : ''}> <strong>Fixo</strong> (1 imagem)</label> &nbsp; <label><input type="radio" name="m-${s.slug}" value="carrossel" ${c.modo === 'carrossel' ? 'checked' : ''}> <strong>Carrossel</strong> (várias imagens que se alternam)</label></p>
      ${c.modo === 'carrossel' ? `<div class="form-row"><label for="iv-${s.slug}">Trocar de imagem a cada (segundos)</label><input id="iv-${s.slug}" type="number" min="2" max="30" value="${+c.intervalo || B.INTERVALO_PADRAO}" style="max-width:120px"></div>` : ''}
      <div class="bn-slides">${c.slides.map((x, i) => `<div class="bn-slide" data-i="${i}">
        <img src="${esc(x.img)}" alt="Miniatura do banner ${i + 1}" style="width:100%;max-width:360px;flex:0 0 auto;align-self:flex-start;height:auto;aspect-ratio:${s.w} / ${s.h};object-fit:contain;border:1px solid #ccd">
        <div>
          <div class="form-row"><label>Descrição da imagem (para leitores de tela) ${x.alt ? '' : '<span class="form-erro">— falta preencher</span>'}</label><input data-f="alt" maxlength="300" value="${esc(x.alt || '')}"></div>
          <div class="form-row"><label>Link ao clicar (opcional: https://… ou página do site, ex.: reservas.html)</label><input data-f="link" maxlength="300" value="${esc(x.link || '')}"></div>
          <label><input type="checkbox" data-f="ativo" ${x.ativo !== false ? 'checked' : ''}> Exibir</label>
          <span class="bn-acoes"><button type="button" class="btn-visit" data-a="up" ${i === 0 ? 'disabled' : ''} aria-label="Mover para cima">↑</button> <button type="button" class="btn-visit" data-a="down" ${i === c.slides.length - 1 ? 'disabled' : ''} aria-label="Mover para baixo">↓</button> <button type="button" class="btn-visit" data-a="del"><i class="fas fa-trash"></i> Remover</button></span>
        </div></div>`).join('') || '<p class="vazio">Nenhuma imagem ainda.</p>'}</div>
      ${c.modo === 'fixo' && n >= 1 ? '<p class="vazio">No modo Fixo só a primeira imagem ativa é exibida. Para alternar imagens, escolha Carrossel.</p>' : ''}
      ${(c.modo === 'carrossel' ? n < B.MAX_SLIDES : n < 1) ? `<div class="form-row"><label for="up-${s.slug}">Enviar ${c.modo === 'carrossel' ? 'imagem(ns) (até ' + B.MAX_SLIDES + ')' : 'imagem'} — exatamente ${s.w} × ${s.h} px</label><input id="up-${s.slug}" type="file" accept="image/jpeg,image/png,image/webp" ${c.modo === 'carrossel' ? 'multiple' : ''}></div>` : `<p class="vazio">Limite de ${c.modo === 'carrossel' ? B.MAX_SLIDES : 1} imagem(ns) atingido.</p>`}
      <p><button type="button" class="btn-visit" data-a="salvar"><i class="fas fa-save"></i> Salvar descrições e links</button> <button type="button" class="btn-visit" data-a="prev"><i class="fas fa-eye"></i> Pré-visualizar</button> <button type="button" class="btn-visit" data-a="limpar" ${n ? '' : 'disabled'}>Voltar ao banner original da página</button></p>
      <div id="pv-${s.slug}"></div></div>`;
    return `<section class="bn-card card" data-slug="${s.slug}" style="margin:12px 0;padding:14px">
      <h4 style="margin:0 0 4px">${esc(s.nome)}</h4>
      <p style="margin:0 0 6px"><code>${esc(s.arquivo)}</code> · Medida exata: <strong>${s.w} × ${s.h} px</strong> (JPG, PNG ou WebP) · ${estado}</p>
      <button type="button" class="btn-visit" data-a="abrir">${ab ? 'Fechar' : 'Configurar'}</button>${corpo}</section>`;
  };

  const draw = () => {
    const all = todos(), usado = all.reduce((s, c) => s + tamSlot(c), 0), ps = window.PR_DADOS ? window.PR_DADOS.uso() : { bytes: usado, limiteAprox: 5242880 };
    el.innerHTML = `<h3><i class="fas fa-images"></i> Site — banners das páginas</h3>
    <p>Cada espaço abaixo é o banner de uma página do site, com a <strong>medida exata em pixels</strong>. Em cada um você escolhe <strong>Fixo</strong> (uma imagem) ou <strong>Carrossel</strong> (várias imagens que se alternam). Enquanto nada for configurado, a página mantém o banner/título que já tem.</p>
    <div class="tip-box" role="note"><strong>Como publicar:</strong> o que você configura aqui é um <em>rascunho</em> e só aparece, para você logado, neste navegador. Para o público ver: clique em <strong>Baixar pacote para publicar</strong>, descompacte e copie a pasta <code>banners</code> para a pasta do site na hospedagem (junto com os arquivos .html). Quando o site tiver servidor, esse passo deixa de ser necessário.</div>
    <p>Espaço usado pelo site neste navegador: <strong>${kb(ps.bytes)}</strong> de ~${kb(ps.limiteAprox)} (banners: ${kb(usado)}) ${ps.bytes > ps.limiteAprox * 0.8 ? '<span class="form-erro">— quase cheio: publique e remova imagens antigas</span>' : ''}</p>
    ${msg ? `<p class="tip-box" role="status">${esc(msg)}</p>` : ''}${aviso ? `<p class="tip-box" role="status">${esc(aviso)}</p>` : ''}${erro ? `<p class="form-erro" role="alert">${esc(erro)}</p>` : ''}
    <p><button type="button" class="btn-visit" id="bn-zip"><i class="fas fa-download"></i> Baixar pacote para publicar (.zip)</button></p>
    ${grupos().map(g => `<h4 class="subsection-title">${esc(g[0])}</h4>${g[1].map(cartao).join('')}`).join('')}
    <style>.bn-slide{display:flex;gap:14px;flex-wrap:wrap;margin:10px 0;padding:10px;border:1px solid #dde}.bn-slide>div{flex:1;min-width:240px}.bn-acoes{display:inline-flex;gap:6px;margin-left:10px}.bn-corpo{margin-top:10px}</style>`;
    el.querySelectorAll('.bn-card').forEach(card => {
      const slug = card.dataset.slug, s = B.slotDe(slug);
      const lerCampos = c => card.querySelectorAll('.bn-slide').forEach(d => { const x = c.slides[+d.dataset.i]; d.querySelectorAll('[data-f]').forEach(f => { const k = f.dataset.f; x[k] = f.type === 'checkbox' ? f.checked : f.value.trim(); }); const iv = card.querySelector('#iv-' + slug); if (iv) c.intervalo = Math.min(30, Math.max(2, +iv.value || B.INTERVALO_PADRAO)); });
      const grava = c => { if (!salva(c)) { erro = 'Sem espaço no navegador para salvar. Publique e remova imagens antigas.'; return false; } erro = ''; return true; };
      card.querySelectorAll('[data-a]').forEach(b => b.onclick = ev => {
        const a = b.dataset.a, c = cfgDe(slug); msg = ''; aviso = '';
        if (a === 'abrir') { aberto = aberto === slug ? '' : slug; return draw(); }
        if (b.closest('.bn-slide') && ['up', 'down', 'del'].includes(a)) {
          lerCampos(c); const i = +b.closest('.bn-slide').dataset.i;
          if (a === 'del') { if (!confirm('Remover esta imagem do banner?')) return; c.slides.splice(i, 1); }
          else { const j = a === 'up' ? i - 1 : i + 1; [c.slides[i], c.slides[j]] = [c.slides[j], c.slides[i]]; }
          grava(c); return draw();
        }
        if (a === 'salvar') { lerCampos(c); if (grava(c)) msg = 'Salvo.'; return draw(); }
        if (a === 'limpar') { if (!confirm('Remover todas as imagens deste espaço e voltar ao banner original da página?')) return; c.slides = []; grava(c); return draw(); }
        if (a === 'prev') { lerCampos(c); const ss = c.slides.filter(x => x.ativo !== false && x.img).map(x => ({ src: x.img, alt: x.alt, link: '' })); const box = card.querySelector('#pv-' + slug); if (!ss.length) { box.innerHTML = '<p class="vazio">Nada para pré-visualizar.</p>'; return; } B.injetaCss(); const d = document.createElement('div'); d.className = 'pr-banner'; box.textContent = ''; box.appendChild(d); B.monta(d, { modo: c.modo, intervalo: c.intervalo, slides: ss }, s, false); }
      });
      card.querySelectorAll('input[type=radio]').forEach(r => r.onchange = () => { const c = cfgDe(slug); lerCampos(c); c.modo = r.value; if (c.modo === 'fixo' && c.slides.length > 1 && !confirm('No modo Fixo só uma imagem é exibida. As outras ficam guardadas, mas não aparecem. Continuar?')) { draw(); return; } grava(c); draw(); });
      const up = card.querySelector('#up-' + slug);
      if (up) up.onchange = async () => {
        const c = cfgDe(slug); lerCampos(c); msg = ''; aviso = ''; erro = ''; let errUp = '';
        const livres = (c.modo === 'carrossel' ? B.MAX_SLIDES : 1) - c.slides.length, arqs = [...up.files].slice(0, livres), avs = [];
        if (up.files.length > livres) avs.push(`Só cabem mais ${livres} imagem(ns); as demais foram ignoradas.`);
        for (const f of arqs) { try { const r = await preparaImagem(f, s); c.slides.push({ id: uid(), img: r.img, alt: '', link: '', ativo: true }); if (r.aviso) avs.push(r.aviso); } catch (e) { errUp += (errUp ? ' ' : '') + e.message; } }
        aviso = avs.join(' '); const gravou = grava(c); if (gravou && errUp) erro = errUp; draw();
      };
    });
    $('#bn-zip', el).onclick = () => {
      const slots = {}, arqs = [], enc = new TextEncoder(); let n = 0;
      todos().forEach(c => {
        const ss = (c.slides || []).filter(x => x.ativo !== false && x.img); if (!ss.length) return;
        const lista = c.modo === 'carrossel' ? ss : ss.slice(0, 1);
        slots[c.id] = { modo: lista.length > 1 ? 'carrossel' : 'fixo', intervalo: c.intervalo || B.INTERVALO_PADRAO, slides: lista.map((x, i) => { const nome = `banners/${c.id}-${i + 1}.jpg`; arqs.push({ nome, dados: dataUrlBytes(x.img) }); n++; return { src: nome, alt: x.alt || '', link: x.link || '' }; }) };
      });
      if (!n) { erro = 'Não há banners para publicar. Configure ao menos um.'; msg = ''; return draw(); }
      arqs.unshift({ nome: 'banners/banners.json', dados: enc.encode(JSON.stringify({ versao: 1, gerado: new Date().toISOString(), slots }, null, 1)) });
      arqs.push({ nome: 'banners/LEIA-ME.txt', dados: enc.encode('Copie a pasta "banners" para a pasta do site na hospedagem (ao lado de index.html), substituindo a anterior. Remova a pasta para voltar aos banners originais.\n') });
      const a = document.createElement('a'); a.href = URL.createObjectURL(zip(arqs)); a.download = `banners-site-${hoje()}.zip`; document.body.appendChild(a); a.click(); a.remove();
      msg = `Pacote gerado com ${n} imagem(ns) em ${Object.keys(slots).length} página(s). Copie a pasta "banners" para o site.`; erro = ''; draw();
    };
  };
  draw();
} };
})();
