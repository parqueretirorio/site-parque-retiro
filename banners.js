// Banners do site: lista de espaços (um por página) + exibição pública (fixo ou carrossel).
// Carregado em TODAS as páginas públicas e também na área restrita (que usa PR_BANNERS.SLOTS).
//
// Como funciona:
//  - Cada página tem 1 espaço de banner, identificado pelo nome do arquivo (ex.: "o-parque").
//  - Se NENHUM banner foi configurado para a página, nada muda (continua o banner/título que a página já tinha).
//  - Configuração publicada: arquivo banners/banners.json (gerado pela área restrita > Comunicação > Site).
//  - Pré-visualização: quem está logado vê, neste navegador, o rascunho ainda não publicado.
(function () {
// w × h = medida EXATA em pixels. As medidas de quem já tinha banner vêm do arquivo real; as demais usam 1600 × 533 (3:1),
// que é a largura máxima de exibição do site (max-width: 1600px).
const P = 1600, H3 = 533;
const SLOTS = [
  // [slug, nome na tela, arquivo, grupo, largura, altura]
  ['index', 'Início', 'index.html', 'Principal', 2172, 724],
  ['comece-aqui', 'Quem somos', 'comece-aqui.html', 'Principal', 2172, 724],
  ['o-parque', 'O Parque — Sobre o Parque', 'o-parque.html', 'O Parque', 2172, 724],
  ['elementos', 'O Parque — Elementos', 'elementos.html', 'O Parque', P, H3],
  ['como-chegar', 'O Parque — Como Chegar', 'como-chegar.html', 'O Parque', P, H3],
  ['atividades', 'O Parque — Atividades', 'atividades.html', 'O Parque', P, H3],
  ['atividade', 'O Parque — Atividade (artigo aberto)', 'atividade.html', 'O Parque', P, H3],
  ['fotos', 'O Parque — Fotos', 'fotos.html', 'O Parque', P, H3],
  ['reservas', 'Reservas', 'reservas.html', 'Reservas', P, H3],
  ['como-fazer', 'Reservas — Como Fazer', 'como-fazer.html', 'Reservas', P, H3],
  ['calendario', 'Reservas — Calendário de uso', 'calendario.html', 'Reservas', P, H3],
  ['silo', 'Silo', 'silo.html', 'Silo e Organismos', P, H3],
  ['organismos', 'Silo — Organismos do Movimento', 'organismos.html', 'Silo e Organismos', P, H3],
  ['movimento-humanista', 'Organismo — Movimento Humanista', 'movimento-humanista.html', 'Silo e Organismos', P, H3],
  ['partido-humanista', 'Organismo — Partido Humanista', 'partido-humanista.html', 'Silo e Organismos', P, H3],
  ['a-comunidade', 'Organismo — A Comunidade para o Desenvolvimento Humano', 'a-comunidade.html', 'Silo e Organismos', P, H3],
  ['centro-mundial-estudos-humanistas', 'Organismo — Centro Mundial de Estudos Humanistas', 'centro-mundial-estudos-humanistas.html', 'Silo e Organismos', P, H3],
  ['cmeh', 'Organismo — Centro Mundial de Estudo Humanistas (cmeh.html)', 'cmeh.html', 'Silo e Organismos', P, H3],
  ['convergencia-das-culturas', 'Organismo — Convergência das Culturas', 'convergencia-das-culturas.html', 'Silo e Organismos', P, H3],
  ['convergencia-culturas', 'Organismo — Convergência das Culturas (convergencia-culturas.html)', 'convergencia-culturas.html', 'Silo e Organismos', P, H3],
  ['mundo-sem-guerras', 'Organismo — Mundo sem Guerras e sem Violência', 'mundo-sem-guerras.html', 'Silo e Organismos', P, H3],
  ['centro-estudo', 'Centro de Estudo', 'centro-estudo.html', 'Centro de Estudo', P, H3],
  ['escola', 'Centro de Estudo — Escola', 'escola.html', 'Centro de Estudo', P, H3],
  ['nivelamento', 'Centro de Estudo — Nivelação', 'nivelamento.html', 'Centro de Estudo', P, H3],
  ['biblioteca', 'Centro de Estudo — Biblioteca do Parque', 'biblioteca.html', 'Centro de Estudo', P, H3],
  ['producoes-de-escola', 'Centro de Estudo — Produções de Escola', 'producoes-de-escola.html', 'Centro de Estudo', P, H3],
  ['livros-audios-app', 'Centro de Estudo — Livros, Áudios e App', 'livros-audios-app.html', 'Centro de Estudo', P, H3],
  ['oficios', 'Centro de Estudo — Ofícios', 'oficios.html', 'Centro de Estudo', P, H3],
  ['ajude-o-parque', 'Ajude o Parque', 'ajude-o-parque.html', 'Ajude o Parque', P, H3],
  ['doacao', 'Ajude — Doação', 'doacao.html', 'Ajude o Parque', P, H3],
  ['livraria', 'Ajude — Livraria', 'livraria.html', 'Ajude o Parque', P, H3],
  ['lojinha', 'Ajude — Lojinha', 'lojinha.html', 'Ajude o Parque', P, H3],
  ['rifa-solidaria', 'Ajude — Rifa Solidária', 'rifa-solidaria.html', 'Ajude o Parque', P, H3],
  ['vaquinha-coletiva', 'Ajude — Vaquinha Coletiva', 'vaquinha-coletiva.html', 'Ajude o Parque', P, H3],
  ['comissoes', 'Ajude — Comissões', 'comissoes.html', 'Ajude o Parque', P, H3],
  ['comissao-jardinagem', 'Comissão — Jardinagem / Área Externa', 'comissao-jardinagem.html', 'Ajude o Parque', P, H3],
  ['comissao-comunicacao', 'Comissão — Comunicação, Redes Sociais e Site', 'comissao-comunicacao.html', 'Ajude o Parque', P, H3],
  ['comissao-multiuso', 'Comissão — Multiuso', 'comissao-multiuso.html', 'Ajude o Parque', P, H3],
  ['voluntario', 'Ajude — Voluntário', 'voluntario.html', 'Ajude o Parque', P, H3],
  ['parques-mundo', 'Parques no Mundo', 'parques-mundo.html', 'Outras páginas', P, H3],
  ['estela-virtual', 'Estela Virtual', 'estela-virtual.html', 'Outras páginas', P, H3],
  ['login', 'Entrar (login)', 'login.html', 'Outras páginas', P, H3]
].map(a => ({ slug: a[0], nome: a[1], arquivo: a[2], grupo: a[3], w: a[4], h: a[5] }));

const MAX_SLIDES = 8, INTERVALO_PADRAO = 5;
const slotDe = slug => SLOTS.find(s => s.slug === slug);

/* ---------- Exibição pública ---------- */
const CSS = `
.pr-banner{background:var(--primary-color,#1e3a3a);line-height:0;position:relative}
.pr-banner .pr-b-box{position:relative;max-width:1600px;margin:0 auto;overflow:hidden}
.pr-banner .pr-b-slide{display:none;width:100%}
.pr-banner .pr-b-slide.on{display:block}
.pr-banner img{display:block;width:100%;height:auto}
.pr-banner a{display:block}
.pr-banner .pr-b-btn{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:50%;border:0;background:rgba(0,0,0,.45);color:#fff;font-size:20px;line-height:42px;cursor:pointer;z-index:2}
.pr-banner .pr-b-btn:hover,.pr-banner .pr-b-btn:focus-visible{background:rgba(0,0,0,.75)}
.pr-banner .pr-b-prev{left:10px}.pr-banner .pr-b-next{right:10px}
.pr-banner .pr-b-dots{position:absolute;left:0;right:0;bottom:10px;display:flex;gap:8px;justify-content:center;z-index:2;line-height:0}
.pr-banner .pr-b-dot{width:11px;height:11px;border-radius:50%;border:2px solid #fff;background:transparent;padding:0;cursor:pointer}
.pr-banner .pr-b-dot[aria-current="true"]{background:#fff}
.pr-banner .pr-b-rasc{position:absolute;top:6px;left:6px;background:#b8620f;color:#fff;font:600 12px/1 sans-serif;padding:5px 8px;border-radius:4px;z-index:3}
@media (max-width:600px){.pr-banner .pr-b-btn{width:34px;height:34px;line-height:34px;font-size:16px}}
`;
function injetaCss() { if (document.getElementById('pr-banner-css')) return; const s = document.createElement('style'); s.id = 'pr-banner-css'; s.textContent = CSS; document.head.appendChild(s); }

const cfgOk = c => c && Array.isArray(c.slides) && c.slides.some(x => x.src);
function monta(el, cfg, slot, rascunho) {
  const slides = cfg.slides.filter(x => x.src);
  const unico = cfg.modo !== 'carrossel' || slides.length < 2;
  const box = document.createElement('div'); box.className = 'pr-b-box';
  box.style.aspectRatio = slot.w + ' / ' + slot.h;
  slides.forEach((s, i) => {
    const f = document.createElement('div'); f.className = 'pr-b-slide' + (i === 0 ? ' on' : '');
    if (!unico) { f.setAttribute('role', 'group'); f.setAttribute('aria-roledescription', 'slide'); f.setAttribute('aria-label', (i + 1) + ' de ' + slides.length); }
    const im = document.createElement('img'); im.src = s.src; im.alt = s.alt || ''; im.width = slot.w; im.height = slot.h; if (i > 0) im.loading = 'lazy'; im.draggable = false;
    if (s.link && /^https?:\/\/|^[a-z0-9-]+\.html([?#].*)?$/i.test(s.link)) { const a = document.createElement('a'); a.href = s.link; if (/^https?:/i.test(s.link)) { a.target = '_blank'; a.rel = 'noopener'; } a.appendChild(im); f.appendChild(a); } else f.appendChild(im);
    box.appendChild(f);
  });
  el.textContent = ''; el.appendChild(box);
  if (rascunho) { const r = document.createElement('span'); r.className = 'pr-b-rasc'; r.textContent = 'Pré-visualização (rascunho não publicado)'; box.appendChild(r); }
  if (unico) return;
  el.setAttribute('role', 'region'); el.setAttribute('aria-roledescription', 'carrossel'); el.setAttribute('aria-label', 'Banners de ' + slot.nome);
  const fs = [...box.querySelectorAll('.pr-b-slide')];
  const dots = document.createElement('div'); dots.className = 'pr-b-dots';
  const mk = (cls, txt, lab) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pr-b-btn ' + cls; b.textContent = txt; b.setAttribute('aria-label', lab); return b; };
  const prev = mk('pr-b-prev', '‹', 'Banner anterior'), next = mk('pr-b-next', '›', 'Próximo banner');
  let i = 0, timer = null, pausado = false;
  const dotEls = fs.map((_, k) => { const d = document.createElement('button'); d.type = 'button'; d.className = 'pr-b-dot'; d.setAttribute('aria-label', 'Ir para o banner ' + (k + 1)); d.onclick = () => ir(k, true); dots.appendChild(d); return d; });
  const ir = (k, manual) => { i = (k + fs.length) % fs.length; fs.forEach((f, j) => f.classList.toggle('on', j === i)); dotEls.forEach((d, j) => d.setAttribute('aria-current', j === i)); if (manual) reinicia(); };
  const seg = Math.min(30, Math.max(2, +cfg.intervalo || INTERVALO_PADRAO)) * 1000;
  const reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const para = () => { if (timer) { clearInterval(timer); timer = null; } };
  const reinicia = () => { para(); if (!reduz && !pausado && !document.hidden) timer = setInterval(() => ir(i + 1), seg); };
  prev.onclick = () => ir(i - 1, true); next.onclick = () => ir(i + 1, true);
  el.addEventListener('mouseenter', () => { pausado = true; para(); }); el.addEventListener('mouseleave', () => { pausado = false; reinicia(); });
  el.addEventListener('focusin', () => { pausado = true; para(); }); el.addEventListener('focusout', () => { pausado = false; reinicia(); });
  document.addEventListener('visibilitychange', reinicia);
  let x0 = null; box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) ir(i + (dx < 0 ? 1 : -1), true); x0 = null; });
  box.append(prev, next, dots); ir(0); reinicia();
}

function rascunhoLocal() { // só para quem está logado (ou abriu a aba Site nas últimas 8 h, para valer em outras abas): mostra o que ainda não foi publicado
  try { const flag = +localStorage.getItem('pr_site_preview') || 0; if (!sessionStorage.getItem('pr_sess') && Date.now() - flag > 8 * 3600e3) return null; const l = JSON.parse(localStorage.getItem('pr_site_banners') || 'null'); return Array.isArray(l) ? l : null; } catch (e) { return null; }
}
function slugAtual() { const f = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/i, ''); return f || 'index'; }
function alvo(slug) {
  let el = document.querySelector('.hero-banner');
  if (el) return { el, existente: true };
  const h = document.querySelector('header'); if (!h) return null;
  el = document.createElement('div'); h.after(el); return { el, existente: false };
}
async function iniciaPagina() {
  const slug = slugAtual(), slot = slotDe(slug); if (!slot) return;
  let cfg = null, rasc = false;
  const rl = rascunhoLocal();
  if (rl) { const r = rl.find(x => x.id === slug); if (r) { const c = { modo: r.modo, intervalo: r.intervalo, slides: (r.slides || []).filter(s => s.ativo !== false && s.img).map(s => ({ src: s.img, alt: s.alt, link: s.link })) }; if (cfgOk(c)) { cfg = c; rasc = true; } } }
  if (!cfg) {
    try { const r = await fetch('banners/banners.json', { cache: 'no-cache' }); if (r.ok) { const j = await r.json(); const c = j && j.slots && j.slots[slug]; if (cfgOk(c)) cfg = c; } } catch (e) { /* sem banners publicados */ }
  }
  // Início: atividades marcadas como destaque (área restrita > Atividades) entram no carrossel e levam ao artigo.
  if (slug === 'index' && window.PR_ATIVIDADES) {
    const atv = window.PR_ATIVIDADES.slidesBanner();
    if (atv.length) {
      let base = cfgOk(cfg) ? cfg.slides.filter(x => x.src) : null;
      if (!base) { const im = document.querySelector('.hero-banner img'); base = im ? [{ src: im.getAttribute('src'), alt: im.getAttribute('alt') || '', link: '' }] : []; }
      cfg = { modo: 'carrossel', intervalo: cfg && cfg.intervalo, slides: base.concat(atv) };
    }
  }
  if (!cfgOk(cfg)) return;
  const a = alvo(slug); if (!a) return;
  injetaCss(); a.el.className = 'pr-banner'; if (a.existente) a.el.removeAttribute('style');
  const titulo = a.el.querySelector('h1.sr-only'); const h1 = titulo ? titulo.cloneNode(true) : null;
  monta(a.el, cfg, slot, rasc); if (h1) a.el.prepend(h1);
}
window.PR_BANNERS = { SLOTS, MAX_SLIDES, INTERVALO_PADRAO, slotDe, monta, injetaCss };
if (document.querySelector('header')) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciaPagina); else iniciaPagina();
}
})();
