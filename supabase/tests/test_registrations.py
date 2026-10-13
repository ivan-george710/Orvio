"""Integration/security/concurrency tests against DISPOSABLE local PostgreSQL only.
Run with backend/venv/Scripts/python.exe supabase/tests/test_registrations.py.
Requires localhost:55432 postgres:17 container documented in docs/REGISTRATIONS.md.
"""
import concurrent.futures
import pathlib
import unittest
import uuid
import psycopg2

ROOT = pathlib.Path(__file__).resolve().parents[2]
DSN = 'host=127.0.0.1 port=55432 dbname=orvio_registration_test user=postgres password=orvio-local-test'

def query(sql, args=(), user=None, role='authenticated'):
    with psycopg2.connect(DSN) as con:
        with con.cursor() as cur:
            if user is not None or role == 'anon':
                cur.execute('set local role ' + role)
                cur.execute("select set_config('request.jwt.claim.sub', %s, true)", (str(user) if user else '',))
            cur.execute(sql, args or None)
            return cur.fetchall() if cur.description else []

class Registrations(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        con = psycopg2.connect(DSN.replace('dbname=orvio_registration_test', 'dbname=postgres'))
        con.autocommit = True
        with con.cursor() as cur:
            cur.execute("select 1 from pg_database where datname='orvio_registration_test'")
            if not cur.fetchone(): cur.execute('create database orvio_registration_test')
        con.close()
        if not query("select to_regclass('public.registrations')")[0][0]:
            query((ROOT/'supabase/tests/baseline.sql').read_text(encoding='utf-8-sig'))
        if not query("select 1 from information_schema.columns where table_schema='public' and table_name='registrations' and column_name='status'"):
            query((ROOT/'supabase/migrations/20261011054251_complete_event_registrations.sql').read_text(encoding='utf-8-sig'))

        if not query("select to_regprocedure('private.is_admin()')")[0][0]:
            query(next((ROOT/'supabase/migrations').glob('*_harden_existing_role_helper.sql')).read_text(encoding='utf-8-sig'))

    def setUp(self):
        query('truncate public.registrations, public.events, public.profiles, auth.users cascade')
        self.owner, self.user, self.other, self.admin = [uuid.uuid4() for _ in range(4)]
        for user in [self.owner,self.user,self.other,self.admin]:
            query("insert into auth.users(id,raw_user_meta_data) values(%s,'{\"full_name\":\"Test Person\",\"role\":\"admin\"}')",(str(user),))
        query("update public.profiles set role='admin' where id=%s",(str(self.admin),))
        self.event = self.event_create()

    def event_create(self, status='approved', capacity=2, past=False):
        return query("insert into public.events(created_by,title,venue,max_participants,status,event_datetime) values(%s,'Test Event','Test Venue',%s,%s,now() + (%s)::interval) returning id",(str(self.owner),capacity,status,'-1 day' if past else '1 day'))[0][0]
    def register(self,user=None,event=None):
        return query('select public.register_for_event(%s)',(event or self.event,),user or self.user)[0][0]
    def cancel(self,user=None,event=None):
        return query('select public.cancel_registration(%s)',(event or self.event,),user or self.user)
    def fail(self, message, callback):
        with self.assertRaises(psycopg2.Error) as caught: callback()
        self.assertIn(message,str(caught.exception))

    def test_register_and_summary(self):
        self.register()
        row=query('select * from public.registration_summaries(array[%s]::uuid[])',(self.event,),self.user)[0]
        self.assertEqual(row[1:5],(1,1,True,False))
    def test_anonymous_and_missing_user(self):
        self.fail('permission denied',lambda:query('select public.register_for_event(%s)',(self.event,),role='anon'))
        self.fail('AUTH_REQUIRED',lambda:query("set local role authenticated; select public.register_for_event(%s)",(self.event,)))
    def test_duplicate(self):
        self.register(); self.fail('ALREADY_REGISTERED',self.register)
    def test_ineligible_statuses(self):
        for status in ['pending','rejected','completed','cancelled']:
            with self.subTest(status=status):
                self.fail('EVENT_NOT_APPROVED',lambda:self.register(event=self.event_create(status)))
    def test_past_missing_and_unscheduled(self):
        self.fail('EVENT_STARTED',lambda:self.register(event=self.event_create(past=True)))
        self.fail('EVENT_NOT_FOUND',lambda:self.register(event=str(uuid.uuid4())))
        query('update public.events set event_datetime=null where id=%s',(self.event,))
        self.fail('EVENT_STARTED',self.register)
    def test_full(self):
        event=self.event_create(capacity=1); self.register(event=event)
        self.fail('EVENT_FULL',lambda:self.register(self.other,event))
    def test_concurrent_capacity_and_duplicate(self):
        event=self.event_create(capacity=3)
        users=[uuid.uuid4() for _ in range(20)]
        for user in users: query('insert into auth.users(id) values(%s)',(str(user),))
        def attempt(user):
            try: self.register(user,event); return 'ok'
            except psycopg2.Error as err: return str(err).splitlines()[0]
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool: results=list(pool.map(attempt,users))
        self.assertEqual(results.count('ok'),3)
        self.assertEqual(results.count('EVENT_FULL'),17)
        self.assertEqual(query("select count(*) from public.registrations where event_id=%s and status='registered'",(event,))[0][0],3)
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: results=list(pool.map(lambda _:attempt(self.user),range(8)))
        self.assertEqual(results.count('EVENT_FULL'),8)
    def test_concurrent_same_user_only_one_active(self):
        event = self.event_create(capacity=10)
        def attempt(_):
            try: self.register(event=event); return 'ok'
            except psycopg2.Error as err: return str(err).splitlines()[0]
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(attempt, range(8)))
        self.assertEqual(results.count('ok'), 1)
        self.assertEqual(results.count('ALREADY_REGISTERED'), 7)

    def test_fallback_names_and_function_permissions(self):
        query("update public.profiles set full_name='  ' where id=%s",(str(self.user),))
        self.register()
        self.assertEqual(query('select full_name from public.get_event_attendees(%s)',(self.event,),self.owner)[0][0], 'Unknown Attendee')
        for fn in ['register_for_event(uuid)','cancel_registration(uuid)','get_my_registrations()','get_event_attendees(uuid)','is_admin()']:
            self.assertFalse(query("select has_function_privilege('anon', %s, 'EXECUTE')",('public.'+fn,))[0][0])
        self.assertEqual(query("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef and has_function_privilege('authenticated',p.oid,'EXECUTE')")[0][0], 0)

    def test_cancel_and_reregister_history(self):
        first=self.register(); self.cancel(); second=self.register()
        self.assertNotEqual(first,second)
        rows=query('select status,cancelled_at from public.registrations order by registered_at')
        self.assertEqual([r[0] for r in rows],['cancelled','registered']); self.assertIsNotNone(rows[0][1])
        self.cancel(); self.fail('NO_ACTIVE_REGISTRATION',self.cancel)
    def test_cancel_releases_last_slot(self):
        event=self.event_create(capacity=1); self.register(event=event); self.cancel(event=event); self.register(self.other,event)
    def test_cancellation_after_start_and_other_user(self):
        self.register(); self.fail('NO_ACTIVE_REGISTRATION',lambda:self.cancel(self.other))
        query("update public.events set event_datetime=now()-interval '1 minute' where id=%s",(self.event,))
        self.fail('EVENT_STARTED',self.cancel)
    def test_direct_writes_and_impersonation_blocked(self):
        self.register()
        for sql,args in [
            ('insert into public.registrations(event_id,user_id) values(%s,%s)',(self.event,str(self.other))),
            ("update public.registrations set status='cancelled',cancelled_at=now()",()),
            ('delete from public.registrations',()),('truncate public.registrations',())]:
            self.fail('permission denied',lambda:query(sql,args,self.user))
        self.fail('does not exist',lambda:query('select public.register_for_event(%s,%s)',(self.event,str(self.other)),self.user))
    def test_rls_private_and_attendee_access(self):
        self.register()
        self.assertEqual(query('select * from public.registrations',user=self.other),[])
        self.assertEqual(len(query('select * from public.registrations',user=self.owner)),1)
        for user in [self.owner,self.admin]:
            self.assertEqual(query('select full_name from public.get_event_attendees(%s)',(self.event,),user)[0][0],'Test Person')
        for user in [self.user,self.other]: self.fail('ATTENDEES_FORBIDDEN',lambda:query('select * from public.get_event_attendees(%s)',(self.event,),user))
    def test_role_guard_and_admin_role_management(self):
        self.assertEqual(query('select role from public.profiles where id=%s',(str(self.user),))[0][0],'participant')
        self.fail('ROLE_CHANGE_FORBIDDEN',lambda:query("update public.profiles set role='admin' where id=%s",(str(self.user),),self.user))
        query("update public.profiles set role='organizer' where id=%s",(str(self.user),),self.admin)
        query("update public.profiles set full_name='Updated' where id=%s",(str(self.user),),self.user)
        self.fail('PROFILE_ID_IMMUTABLE',lambda:query('update public.profiles set id=%s where id=%s',(str(uuid.uuid4()),str(self.user)),self.user))
    def test_event_creation_edit_approval_rejection(self):
        event=query("insert into public.events(created_by,title,venue,max_participants,event_datetime) values(%s,'Pending','Venue',10,now()+interval '1 day') returning id",(str(self.owner),),self.owner)[0][0]
        query("update public.events set title='Edited' where id=%s",(event,),self.owner)
        self.fail('row-level security',lambda:query("update public.events set status='approved' where id=%s",(event,),self.owner))
        for status in ['approved','rejected']: query('update public.events set status=%s where id=%s',(status,event),self.admin)
        self.fail('row-level security',lambda:query("insert into public.events(created_by,title,venue,status) values(%s,'Bypass','Venue','approved')",(str(self.owner),),self.owner))
    def test_admin_cannot_mutate_registrations(self):
        self.register(); self.fail('permission denied',lambda:query('delete from public.registrations',user=self.admin))
    def test_capacity_reduction_protected(self):
        self.register(); self.fail('CAPACITY_BELOW_REGISTRATIONS',lambda:query('update public.events set max_participants=0 where id=%s',(self.event,),self.admin))
    def test_my_history_after_event_status_change(self):
        self.register(); query("update public.events set status='cancelled' where id=%s",(self.event,))
        self.assertEqual(len(query('select * from public.get_my_registrations()',user=self.user)),1)
        self.assertEqual(len(query('select * from public.events where id=%s',(self.event,),self.user)),1)
        self.assertEqual(query('select * from public.get_my_registrations()',user=self.other),[])
    def test_public_counts_no_private_identity(self):
        self.register()
        self.assertEqual(query('select active_count from public.registration_summaries(array[%s]::uuid[])',(self.event,),role='anon')[0][0],1)
        hidden=self.event_create(status='pending')
        self.assertEqual(query('select * from public.registration_summaries(array[%s]::uuid[])',(hidden,),role='anon'),[])

if __name__=='__main__': unittest.main(verbosity=2)
