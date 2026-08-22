-- Jalankan di Supabase Dashboard → SQL Editor
-- Tabel keuangan khusus LKBB (struktur sama dengan financial_records)

create table if not exists public.lkbb_financial_records (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount bigint not null,
  type text not null check (type in ('income','expense')),
  category text not null default 'Lainnya',
  date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lkbb_financial_records enable row level security;

create policy "lkbb_fin_read" on public.lkbb_financial_records
  for select to authenticated using (true);
create policy "lkbb_fin_insert" on public.lkbb_financial_records
  for insert to authenticated with check (true);
create policy "lkbb_fin_update" on public.lkbb_financial_records
  for update to authenticated using (true) with check (true);
create policy "lkbb_fin_delete" on public.lkbb_financial_records
  for delete to authenticated using (true);

create index if not exists lkbb_fin_date_idx on public.lkbb_financial_records (date desc);
