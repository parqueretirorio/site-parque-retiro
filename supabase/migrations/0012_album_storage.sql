-- 0012 · Álbum de fotos no Storage do Supabase (envio em lote pela área restrita)
-- As fotos saem do banco (antes iam em base64 dentro da coleção "album") e passam a ser ARQUIVOS no bucket "album".
-- Na coleção fica só o endereço de cada foto e da miniatura. Leitura pública (o site mostra as publicadas);
-- enviar, trocar e apagar: só administrador ou quem tem a função "album" (Responsável pelo Álbum Parque Retiro).
-- Rodar uma vez no SQL Editor do Supabase. Pode rodar de novo sem problema.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('album', 'album', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.pr_pode_album() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.perfis where id = auth.uid() and status = 'aprovado' and (nivel = 'administrador' or 'album' = any(funcoes))) $$;
revoke all on function public.pr_pode_album() from public, anon;
grant execute on function public.pr_pode_album() to authenticated;

drop policy if exists "album: ver" on storage.objects;
create policy "album: ver" on storage.objects for select to authenticated using (bucket_id = 'album');
drop policy if exists "album: enviar" on storage.objects;
create policy "album: enviar" on storage.objects for insert to authenticated with check (bucket_id = 'album' and public.pr_pode_album());
drop policy if exists "album: trocar" on storage.objects;
create policy "album: trocar" on storage.objects for update to authenticated using (bucket_id = 'album' and public.pr_pode_album()) with check (bucket_id = 'album' and public.pr_pode_album());
drop policy if exists "album: apagar" on storage.objects;
create policy "album: apagar" on storage.objects for delete to authenticated using (bucket_id = 'album' and public.pr_pode_album());

-- Quanto o Álbum ocupa (para a tela de envio em lote mostrar o espaço usado do 1 GB do plano gratuito)
create or replace function public.pr_album_uso() returns jsonb language sql stable security definer set search_path = public, storage as
$$ select jsonb_build_object('arquivos', count(*), 'bytes', coalesce(sum((metadata->>'size')::bigint), 0))
   from storage.objects where bucket_id = 'album' $$;
revoke all on function public.pr_album_uso() from public, anon;
grant execute on function public.pr_album_uso() to authenticated;

-- Conferência (deve aparecer "ok"):
select 'ok' as album_storage_instalado;
