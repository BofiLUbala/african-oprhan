import os, sys
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
sys.path.insert(0, os.path.dirname(__file__))
import django
django.setup()
from django.db import connection

with connection.cursor() as cursor:
    for tbl in ['children_consultationhistorique', 'children_fichierjoint', 'children_childassignment']:
        cursor.execute("PRAGMA table_info(" + tbl + ")")
        cols = cursor.fetchall()
        print(tbl + ':')
        for c in cols:
            print(' ', c)
        print()
