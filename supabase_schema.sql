-- 1. Profiles Table (Linked to Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Accounts Table
create table public.accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null,
  balance numeric default 0,
  is_credit boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Categories Table
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color text not null,
  subcategories text[] default '{}',
  is_income boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Transactions Table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  account_id uuid references public.accounts(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric not null,
  label text not null,
  notes text,
  type text not null check (type in ('income', 'expense', 'transfer')),
  date timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Services Table
create table public.services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  category text not null,
  amount numeric not null,
  billing_day integer not null check (billing_day >= 1 and billing_day <= 31),
  type text not null check (type in ('recurring', 'fixed')),
  icon_name text default 'Other',
  end_date text, -- Format YYYY-MM
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Saving Goals Table
create table public.savings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  deadline text not null, -- Format YYYY-MM-DD
  category text default 'General',
  icon text default 'Target',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ENABLE RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.services enable row level security;
alter table public.savings enable row level security;

-- RLS POLICIES (Users can only see their own data)
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can manage own accounts" on public.accounts for all using (auth.uid() = user_id);
create policy "Users can manage own categories" on public.categories for all using (auth.uid() = user_id);
create policy "Users can manage own transactions" on public.transactions for all using (auth.uid() = user_id);
create policy "Users can manage own services" on public.services for all using (auth.uid() = user_id);
create policy "Users can manage own savings" on public.savings for all using (auth.uid() = user_id);

-- TRIGGER FOR NEW USER PROFILE
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
