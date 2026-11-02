-- Run after schema.sql. Atomic publication: either every question is saved or nothing changes.
create or replace function public.publish_goat_test(test_id_value text,test_number integer,question_bank jsonb,make_public boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
 if jsonb_array_length(question_bank)<>147 then raise exception 'Expected 147 questions'; end if;
 if test_id_value <> 'test-' || test_number::text or test_number not between 1 and 18 then raise exception 'Invalid test identifier'; end if;
 insert into public.tests(id,number,title,published) values(test_id_value,test_number,'Practice Test '||test_number,false)
 on conflict(id) do nothing;
 perform 1 from public.tests where id=test_id_value for update;
 if exists(select 1 from public.attempts where test_id=test_id_value) then raise exception 'Cannot modify a test with student attempts'; end if;
 if exists(select 1 from jsonb_array_elements(question_bank) q where q->>'test_id'<>test_id_value) then raise exception 'Mixed test IDs'; end if;
 delete from public.goat_questions where test_id=test_id_value;
 insert into public.goat_questions
 select * from jsonb_populate_recordset(null::public.goat_questions,question_bank);
 if exists(select 1 from public.goat_questions where test_id=test_id_value group by module having count(*)<>case when module like 'rw%' then 27 else 22 end)
 or (select count(distinct module) from public.goat_questions where test_id=test_id_value)<>6 then raise exception 'Invalid module sizes'; end if;
 update public.tests set published=make_public where id=test_id_value;
end; $$;
revoke all on function public.publish_goat_test(text,integer,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.publish_goat_test(text,integer,jsonb,boolean) to service_role;
