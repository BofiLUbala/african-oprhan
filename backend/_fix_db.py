import os, sys
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
sys.path.insert(0, os.path.dirname(__file__))
import django
django.setup()
from django.db import connection

cols_to_add = {
    'niveau_sensibilite': "varchar(20) NOT NULL DEFAULT 'PUBLIC'",
    'statut_validation': "varchar(20) NOT NULL DEFAULT 'AUTO_VALIDE'",
    'hash_precedent': 'varchar(64) NULL',
    'hash_courant': 'varchar(64) NULL',
    'evenement_parent_id': 'bigint NULL',
    'piece_jointe_id': 'bigint NULL',
}

with connection.cursor() as cursor:
    cursor.execute('PRAGMA table_info(children_childhistory)')
    existing = {row[1] for row in cursor.fetchall()}
    for col, coltype in cols_to_add.items():
        if col not in existing:
            sql = f'ALTER TABLE children_childhistory ADD COLUMN {col} {coltype}'
            print(f'Adding column: {col}')
            cursor.execute(sql)
        else:
            print(f'Column {col} already exists')

print('Database fix complete')
