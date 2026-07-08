import os, sys
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
sys.path.insert(0, os.path.dirname(__file__))
import django
django.setup()
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SELECT name FROM django_migrations WHERE app='children' ORDER BY name")
    print('Recorded migrations for children:')
    for r in cursor.fetchall():
        print(' ', r[0])

    # Create missing tables from migration 0006
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='children_childassignment'")
    if not cursor.fetchone():
        print('\nCreating children_childassignment table...')
        cursor.execute('''
            CREATE TABLE children_childassignment (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                note TEXT NOT NULL DEFAULT '',
                assigned_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                ambassador_id BIGINT NOT NULL REFERENCES accounts_user(id),
                assigned_by_id BIGINT REFERENCES accounts_user(id),
                child_id BIGINT NOT NULL REFERENCES children_child(id)
            )
        ''')
        print('Created children_childassignment')

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='children_consultationhistorique'")
    if not cursor.fetchone():
        print('\nCreating children_consultationhistorique table...')
        cursor.execute('''
            CREATE TABLE children_consultationhistorique (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                horodatage DATETIME NOT NULL,
                filtre_applique TEXT NOT NULL DEFAULT '{}',
                enfant_id BIGINT NOT NULL REFERENCES children_child(id),
                utilisateur_id BIGINT NOT NULL REFERENCES accounts_user(id)
            )
        ''')
        print('Created children_consultationhistorique')

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='children_fichierjoint'")
    if not cursor.fetchone():
        print('\nCreating children_fichierjoint table...')
        cursor.execute('''
            CREATE TABLE children_fichierjoint (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fichier VARCHAR(100) NOT NULL,
                nom VARCHAR(255) NOT NULL,
                taille INTEGER NOT NULL DEFAULT 0,
                type_mime VARCHAR(100) NOT NULL DEFAULT '',
                uploaded_at DATETIME NOT NULL,
                uploaded_by_id BIGINT REFERENCES accounts_user(id)
            )
        ''')
        print('Created children_fichierjoint')

print('\nMigration fix complete')
