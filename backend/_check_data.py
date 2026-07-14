import sqlite3

conn = sqlite3.connect('db.sqlite3')
c = conn.cursor()

# Check children
c.execute("SELECT id, uid, prenom, nom, nationalite FROM children_child")
print('Children:')
for r in c.fetchall():
    print(' ', r)

# Check child updates
c.execute("SELECT id, child_id, title, description, attachments, created_at FROM children_childupdate")
print('\nChildUpdates:')
for r in c.fetchall():
    print(' ', r)

conn.close()
