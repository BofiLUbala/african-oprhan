import django
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
from django.db import connection
print("DB path:", connection.settings_dict["NAME"])
with connection.cursor() as c:
    c.execute("SELECT app, name, applied FROM django_migrations WHERE app='management'")
    print("Management migrations in DB:", c.fetchall())
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%management%'")
    print("Management tables in DB:", c.fetchall())
