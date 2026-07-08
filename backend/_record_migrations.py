import os, sys
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
sys.path.insert(0, os.path.dirname(__file__))
import django
django.setup()
from django.db import connection
from datetime import datetime

with connection.cursor() as cursor:
    # Check which are already recorded
    cursor.execute("SELECT name FROM django_migrations WHERE app='children' ORDER BY name")
    recorded = {r[0] for r in cursor.fetchall()}
    
    missing = ['0006_childassignment', '0007_consultationhistorique_fichierjoint_and_more', '0008_alter_childhistory_child']
    
    for name in missing:
        if name not in recorded:
            now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S.%f')
            cursor.execute(
                "INSERT INTO django_migrations (app, name, applied) VALUES (%s, %s, %s)",
                ['children', name, now]
            )
            print('Recorded:', name)
        else:
            print('Already recorded:', name)

print('Done')
