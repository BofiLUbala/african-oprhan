import sqlite3
conn = sqlite3.connect('db.sqlite3')
c = conn.cursor()
c.execute('SELECT COUNT(*) FROM publications_post')
print(f'Posts: {c.fetchone()[0]}')
c.execute('SELECT id, child_id, project_id FROM publications_post')
for row in c.fetchall():
    print(f'  Post {row[0]}: child_id={row[1]}, project_id={row[2]}')
c.execute('SELECT id, title, status FROM projets_project')
rows = c.fetchall()
print(f'Projects: {len(rows)}')
for row in rows:
    print(f'  Project {row[0]}: {row[1]} - {row[2]}')
