"""Copy an existing GOATPrep Supabase database into an EMPTY Neon database.
Run neon/schema.sql first. Requires DATABASE_URL and SOURCE_DATABASE_URL.
The source is read-only. The destination is committed only if every table verifies.
"""
import os
from pathlib import Path
import psycopg
from psycopg import sql
from psycopg.types.json import Jsonb

def main():
    for line in (Path(__file__).resolve().parents[1]/'.env.local').read_text().splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            k,v=line.split('=',1);os.environ.setdefault(k.strip(),v.strip().strip('"').strip("'"))
    source=os.environ.get('SOURCE_DATABASE_URL');target=os.environ.get('DATABASE_URL')
    if not source or not target or source==target:raise RuntimeError('Set distinct SOURCE_DATABASE_URL (Supabase) and DATABASE_URL (Neon).')
    tables=['profiles','tests','goat_questions','attempts','reviews','lesson_progress','jerry_usage','study_lessons']
    with psycopg.connect(source,sslmode='require',connect_timeout=30) as old, psycopg.connect(target,sslmode='require',connect_timeout=30) as new:
        old.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
        for table in tables:
            if new.execute(sql.SQL('SELECT count(*) FROM public.{}').format(sql.Identifier(table))).fetchone()[0]:
                raise RuntimeError('Destination must be empty. No rows copied. Use a fresh Neon branch/database.')
        # The auth service is retained; copy identities only, never passwords or tokens.
        accounts=old.execute('SELECT id,created_at FROM auth.users').fetchall()
        with new.cursor() as cursor:cursor.executemany('INSERT INTO public.profiles(id,created_at) VALUES(%s,%s)',accounts)
        for table in tables[1:]:
            if old.execute('SELECT to_regclass(%s)',('public.'+table,)).fetchone()[0] is None:
                if table=='study_lessons':continue
                raise RuntimeError('Missing source table: '+table)
            cursor=old.execute(sql.SQL('SELECT * FROM public.{}').format(sql.Identifier(table)))
            columns=[c.name for c in cursor.description]
            jsoncols={i for i,c in enumerate(cursor.description) if c.type_code in (114,3802)}
            statement=sql.SQL('INSERT INTO public.{} ({}) VALUES ({})').format(sql.Identifier(table),sql.SQL(',').join(map(sql.Identifier,columns)),sql.SQL(',').join(sql.Placeholder() for _ in columns))
            count=0
            while rows:=cursor.fetchmany(250):
                with new.cursor() as dest:dest.executemany(statement,[tuple(Jsonb(v) if i in jsoncols else v for i,v in enumerate(row)) for row in rows])
                count+=len(rows)
            actual=new.execute(sql.SQL('SELECT count(*) FROM public.{}').format(sql.Identifier(table))).fetchone()[0]
            if actual!=count:raise RuntimeError('Count mismatch: '+table)
            print(table,count,'verified')
    print('Migration committed. Supabase source unchanged. Test the website before retiring old database tables.')

if __name__=='__main__':
    try:main()
    except psycopg.Error:raise SystemExit('Database migration failed and rolled back. Check connection settings, schema, and source permissions.') from None
