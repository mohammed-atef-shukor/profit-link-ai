
create type public.product_status as enum ('draft', 'published');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  commission_percent numeric(5,2) not null default 10 check (commission_percent >= 0 and commission_percent <= 100),
  image_url text,
  status public.product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_seller on public.products(seller_id);
create index idx_products_status on public.products(status);

alter table public.products enable row level security;

create policy "Sellers view own products"
  on public.products for select
  to authenticated
  using (auth.uid() = seller_id);

create policy "Authenticated view published products"
  on public.products for select
  to authenticated
  using (status = 'published');

create policy "Sellers insert own products"
  on public.products for insert
  to authenticated
  with check (auth.uid() = seller_id and public.has_role(auth.uid(), 'seller'));

create policy "Sellers update own products"
  on public.products for update
  to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy "Sellers delete own products"
  on public.products for delete
  to authenticated
  using (auth.uid() = seller_id);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();
