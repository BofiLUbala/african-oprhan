import os, sys
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
sys.path.insert(0, os.path.dirname(__file__))
import django
django.setup()
from django.db import connection

with connection.cursor() as cursor:
    # Recreate tables that were dropped
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS children_consultationhistorique (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            horodatage DATETIME NOT NULL,
            filtre_applique TEXT NOT NULL,
            enfant_id BIGINT NOT NULL REFERENCES children_child(id),
            utilisateur_id BIGINT NOT NULL REFERENCES accounts_user(id)
        )
    """)
    print('Created children_consultationhistorique')

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS children_fichierjoint (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            fichier VARCHAR(100) NOT NULL,
            nom VARCHAR(255) NOT NULL,
            taille INTEGER NOT NULL,
            type_mime VARCHAR(100) NOT NULL,
            uploaded_at DATETIME NOT NULL,
            uploaded_by_id BIGINT REFERENCES accounts_user(id)
        )
    """)
    print('Created children_fichierjoint')

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS children_childassignment (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            note TEXT NOT NULL,
            assigned_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            ambassador_id BIGINT NOT NULL REFERENCES accounts_user(id),
            assigned_by_id BIGINT REFERENCES accounts_user(id),
            child_id BIGINT NOT NULL REFERENCES children_child(id)
        )
    """)
    print('Created children_childassignment')

print('All tables created')
