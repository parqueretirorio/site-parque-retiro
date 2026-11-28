-- 0030 — Completa os cadastros institucionais (Instituto Pangeia e Parque Retiro).
-- WhatsApp = o mesmo do botão flutuante do site; aceite LGPD registrado pelo administrador (e-mails institucionais).
-- Não altera nível/status (continuam Administrador). Rode no SQL Editor do Supabase.
update public.perfis p
set whatsapp = '(21) 2888-1830',
    lgpd = jsonb_build_object('aceite', true, 'imagem', false, 'em', now(), 'versao', 'rascunho-1',
                              'obs', 'Registrado pelo administrador em 27/11/2026 (e-mail institucional)')
where lower(p.email) in ('institutopangeiario@gmail.com', 'parqueretirorio@gmail.com');

select email, nome, whatsapp, nivel, status, lgpd->>'aceite' as lgpd_aceite
from public.perfis
where lower(email) in ('institutopangeiario@gmail.com', 'parqueretirorio@gmail.com');
