import sqlite3

conn = sqlite3.connect('db.sqlite3')
c = conn.cursor()

c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [t[0] for t in c.fetchall()]

for tbl in tables:
    c.execute("SELECT COUNT(*) FROM %s" % tbl)
    count = c.fetchone()[0]
    if count > 0:
        c.execute("PRAGMA table_info(%s)" % tbl)
        cols = [col[1] for col in c.fetchall()]
        print("\n%s (%d rows): %s" % (tbl, count, cols))
        c.execute("SELECT * FROM %s LIMIT 3" % tbl)
        for r in c.fetchall():
            print("  ", dict(zip(cols, r)))

conn.close()
