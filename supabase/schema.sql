-- Kalo · onglet Social
-- À coller dans Supabase → SQL Editor → New query → Run (une seule fois).
-- Chaque utilisateur ne voit que son profil et ceux de ses amis ; un ami s'ajoute avec son code (le donner = accepter d'être suivi).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  code text unique not null check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  name text not null check (char_length(name) between 1 and 30),
  avatar text check (avatar is null or char_length(avatar) < 40000),
  created_at timestamptz not null default now()
);

create table if not exists public.friendships (
  a uuid not null references public.profiles(id) on delete cascade,
  b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (a, b),
  check (a <> b)
);

create table if not exists public.snapshots (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  data jsonb not null check (pg_column_size(data) < 60000),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.snapshots enable row level security;

drop policy if exists "profil lisible par moi et mes amis" on public.profiles;
create policy "profil lisible par moi et mes amis" on public.profiles for select to authenticated
  using (id = auth.uid() or exists (select 1 from public.friendships f where f.a = auth.uid() and f.b = profiles.id));
drop policy if exists "je crée mon profil" on public.profiles;
create policy "je crée mon profil" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "je modifie mon profil" on public.profiles;
create policy "je modifie mon profil" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "je vois mes amitiés" on public.friendships;
create policy "je vois mes amitiés" on public.friendships for select to authenticated using (a = auth.uid());

drop policy if exists "résumé lisible par moi et mes amis" on public.snapshots;
create policy "résumé lisible par moi et mes amis" on public.snapshots for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.friendships f where f.a = auth.uid() and f.b = snapshots.user_id));
drop policy if exists "j'écris mon résumé" on public.snapshots;
create policy "j'écris mon résumé" on public.snapshots for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "je mets à jour mon résumé" on public.snapshots;
create policy "je mets à jour mon résumé" on public.snapshots for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "je supprime mon résumé" on public.snapshots;
create policy "je supprime mon résumé" on public.snapshots for delete to authenticated using (user_id = auth.uid());

-- Ajouter un ami par son code : crée l'amitié dans les deux sens
create or replace function public.add_friend(p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare other public.profiles;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then raise exception 'profil manquant'; end if;
  select * into other from public.profiles where code = upper(trim(p_code));
  if other.id is null then raise exception 'code inconnu'; end if;
  if other.id = auth.uid() then raise exception 'c''est ton propre code'; end if;
  if (select count(*) from public.friendships where a = auth.uid()) >= 50 then raise exception 'limite de 50 amis'; end if;
  insert into public.friendships (a, b) values (auth.uid(), other.id), (other.id, auth.uid()) on conflict do nothing;
  return json_build_object('id', other.id, 'name', other.name);
end $$;

-- Retirer un ami : supprime l'amitié dans les deux sens
create or replace function public.remove_friend(p_id uuid) returns void
language sql security definer set search_path = public as $$
  delete from public.friendships where (a = auth.uid() and b = p_id) or (a = p_id and b = auth.uid());
$$;

-- Supprimer mon compte social : efface profil, amitiés et résumé (cascade)
create or replace function public.delete_me() returns void
language sql security definer set search_path = public as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.add_friend(text), public.remove_friend(uuid), public.delete_me() from public, anon;
grant execute on function public.add_friend(text), public.remove_friend(uuid), public.delete_me() to authenticated;
