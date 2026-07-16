import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from django.db import connection
cursor = connection.cursor()
cursor.execute('SELECT COUNT(*) FROM children_child')
print(f'Total children: {cursor.fetchone()[0]}')
cursor.execute('SELECT COUNT(*) FROM children_child WHERE photo IS NOT NULL AND photo != \'\'')
print(f'Children with photo: {cursor.fetchone()[0]}')
cursor.execute('SELECT prenom, nom, nationalite, photo, age FROM children_child ORDER BY created_at DESC LIMIT 10')
for row in cursor.fetchall():
    print(f'  {row[0]} {row[1]} - {row[2]} - photo: {bool(row[3])}')
