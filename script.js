// ACESSO TEMPORÁRIO À ÁREA RESTRITA (enquanto o site não está no ar definitivamente).
// Quem clica na mandala do topo (placaparqueretiro.png) entra na área restrita sem login e sem senha.
// Não há botão nem aviso na página: só sabe quem for informado por Leonidas França Junior.
// PARA DESLIGAR quando o site entrar no ar: troque  ativo: true  por  ativo: false  (a mandala volta a só levar ao Início).
// nivel: o que a pessoa pode fazer lá dentro: 'leitor', 'comentador', 'editor' ou 'administrador'.
window.PR_ACESSO_TEMPORARIO = { ativo: true, nivel: 'administrador' };
// WHATSAPP DO BOTÃO FLUTUANTE: único lugar para trocar o número. Formato internacional, só dígitos: 55 + DDD + número.
// O script abaixo aplica este número em todas as páginas; o endereço gravado em cada página é só reserva (sem JavaScript).
// WhatsApp oficial do Parque. Um lugar só para o número (botão flutuante), o Canal e a Comunidade.
// Para trocar um link (ex.: depois de redefinir o convite da Comunidade), mude aqui: o site inteiro passa a usar o novo.
window.PR_WHATSAPP = {
    numero: '552128881830',
    mensagem: 'Olá! Vim pelo site do Parque Retiro.',
    canal: 'https://whatsapp.com/channel/0029VbDmMh9ElagzPYbsg22t',
    comunidade: 'https://chat.whatsapp.com/HaH1ShGH9VUKVrs1QX25At'
};
document.addEventListener('click', e => {
    const logo = e.target.closest && e.target.closest('img.brand-logo');
    const cfg = window.PR_ACESSO_TEMPORARIO;
    if (!logo || !cfg || !cfg.ativo) return;
    e.preventDefault();
    e.stopPropagation();
    try { sessionStorage.setItem('pr_temp', '1'); } catch (err) { /* sem armazenamento: o painel não abre */ }
    window.location.href = 'area-restrita.html';
}, true);

// Destaca o link do menu correspondente à página atual
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
            const pai = link.closest('.nav-dropdown');
            if (pai) pai.querySelector(':scope > a').classList.add('active');
            const sub = link.closest('.nav-item-sub');
            if (sub && sub.firstElementChild !== link) sub.firstElementChild.classList.add('active');
        }
    });

    const whatsappBtn = document.querySelector('.whatsapp-float');
    if (whatsappBtn) {
        const wz = window.PR_WHATSAPP;
        if (wz && /^\d{10,15}$/.test(wz.numero || '')) whatsappBtn.href = 'https://wa.me/' + wz.numero + (wz.mensagem ? '?text=' + encodeURIComponent(wz.mensagem) : '');
    }
    // Links do Canal e da Comunidade (data-wz="canal" | "comunidade"): usam o endereço configurado em PR_WHATSAPP.
    const WZ_OK = { canal: /^https:\/\/(www\.)?whatsapp\.com\/channel\/[\w-]+$/, comunidade: /^https:\/\/chat\.whatsapp\.com\/[\w-]+$/ };
    document.querySelectorAll('a[data-wz]').forEach(a => {
        const tipo = a.dataset.wz, url = window.PR_WHATSAPP && window.PR_WHATSAPP[tipo];
        if (tipo === 'contato') { if (/^\d{10,15}$/.test((window.PR_WHATSAPP || {}).numero || '')) a.href = 'https://wa.me/' + window.PR_WHATSAPP.numero; return; }
        if (url && WZ_OK[tipo] && WZ_OK[tipo].test(url)) a.href = url;
    });

    // Revelação suave de cartões e títulos ao rolar a página
    const revealTargets = document.querySelectorAll('.section-title, .card, .park-section');
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        revealTargets.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(24px)';
            el.style.transition = 'all 0.6s ease-out';
            revealObserver.observe(el);
        });
    }
});

// Menu para celular: botão ☰ que abre/fecha o menu e botões ▾ que abrem um submenu de cada vez (o estilo está em style.css)
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    const nav = header && header.querySelector('nav');
    if (!nav) return;
    const mq = window.matchMedia('(max-width: 768px)');
    nav.id = nav.id || 'menu-principal';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-toggle';
    toggle.setAttribute('aria-controls', nav.id);
    toggle.innerHTML = '<span class="nav-toggle-barras" aria-hidden="true"></span>';
    header.insertBefore(toggle, nav);
    const setMenu = on => {
        header.classList.toggle('menu-open', on);
        toggle.setAttribute('aria-expanded', on);
        toggle.setAttribute('aria-label', on ? 'Fechar menu' : 'Abrir menu');
    };
    setMenu(false);
    toggle.addEventListener('click', () => setMenu(!header.classList.contains('menu-open')));

    const setSub = (item, on) => {
        item.classList.toggle('open', on);
        const b = item.querySelector(':scope > .sub-toggle'), a = item.querySelector(':scope > a');
        if (b && a) { b.setAttribute('aria-expanded', on); b.setAttribute('aria-label', (on ? 'Fechar' : 'Abrir') + ' submenu de ' + a.textContent.trim()); }
    };
    nav.querySelectorAll('.nav-dropdown, .nav-item-sub').forEach(item => {
        const a = item.querySelector(':scope > a');
        if (!a) return;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sub-toggle';
        a.after(b);
        setSub(item, false);
        b.addEventListener('click', () => {
            const abrir = !item.classList.contains('open');
            // fecha os outros submenus do mesmo nível
            (item.parentElement ? item.parentElement.querySelectorAll(':scope > .nav-dropdown, :scope > .nav-item-sub') : []).forEach(o => { if (o !== item) setSub(o, false); });
            setSub(item, abrir);
        });
    });
    // já deixa aberto o submenu da página em que a pessoa está
    nav.querySelectorAll('.nav-sub a.active, .nav-sub2 a.active').forEach(a => {
        let p = a.closest('.nav-item-sub, .nav-dropdown');
        while (p) { setSub(p, true); p = p.parentElement && p.parentElement.closest('.nav-item-sub, .nav-dropdown'); }
    });

    // fecha o menu ao escolher uma página, tocar fora, apertar Esc ou voltar para tela grande
    nav.addEventListener('click', e => { if (e.target.closest('a') && mq.matches) setMenu(false); });
    document.addEventListener('click', e => { if (header.classList.contains('menu-open') && !header.contains(e.target)) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', () => { if (!mq.matches) setMenu(false); });
});
