create table tasks (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone default now() not null,
  task_name text,
  is_completed boolean default false not null
);
