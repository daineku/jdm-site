-- READ-ONLY security audit for the public schema. Changes nothing.
-- Run in the Supabase SQL editor (or psql) and save all four result sets: they are the
-- snapshot to compare against before and after any migration.

-- 1. Tables: row count estimate, RLS state, policy count.
select c.relname                                   as table_name,
       c.reltuples::bigint                         as approx_rows,
       c.relrowsecurity                            as rls_enabled,
       c.relforcerowsecurity                       as rls_forced,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
order by c.relname;

-- 2. THE CRITICAL QUESTION: which tables can the public API roles WRITE?
--    anon = anyone holding the publishable/anon key. A row here for a table with
--    rls_enabled = false (query 1) means that key can modify or wipe the table.
select table_name,
       grantee,
       string_agg(privilege_type, ', ' order by privilege_type) as write_privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
group by table_name, grantee
order by table_name, grantee;

-- 3. Existing policies (so a later migration can be compared against them).
select tablename, policyname, cmd, roles, permissive, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 4. Default privileges: what a NEW table in public will grant to the API roles.
select pg_get_userbyid(d.defaclrole) as owner,
       d.defaclobjtype               as object_type,
       d.defaclacl                   as default_acl
from pg_default_acl d
join pg_namespace n on n.oid = d.defaclnamespace
where n.nspname = 'public';
