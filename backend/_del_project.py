import sqlite3

conn = sqlite3.connect('db.sqlite3')
c = conn.cursor()

c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [t[0] for t in c.fetchall()]
print('All tables:', tables)

for tbl in [t for t in tables if 'projet' in t.lower()]:
    c.execute("PRAGMA table_info(%s)" % tbl)
    cols = [col[1] for col in c.fetchall()]
    print('\n%s columns: %s' % (tbl, cols))
    c.execute("SELECT * FROM %s LIMIT 10" % tbl)
    rows = c.fetchall()
    if rows:
        for r in rows:
            print(' ', dict(zip(cols, r)))
    else:
        print('  (empty)')

conn.close()
