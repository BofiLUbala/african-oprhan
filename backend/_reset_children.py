import os, sys, string, random as rnd
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
sys.path.insert(0, os.path.dirname(__file__))
import django
django.setup()
from django.db import connection

# Drop manually created tables and let Django recreate them
with connection.cursor() as cursor:
    cursor.execute("DROP TABLE IF EXISTS children_consultationhistorique")
    cursor.execute("DROP TABLE IF EXISTS children_fichierjoint")
    cursor.execute("DROP TABLE IF EXISTS children_childassignment")
    cursor.execute("DELETE FROM django_migrations WHERE app='children' AND name IN ('0006_childassignment', '0007_consultationhistorique_fichierjoint_and_more', '0008_alter_childhistory_child')")
    print('Dropped tables and migration records')

# Now run migrate
from django.core.management import call_command
call_command('migrate', 'children', '0008', verbosity=1)
print('Migrations applied')
