"""Fix empty UID records."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
import string, random
from children.models import Child
chars = string.ascii_uppercase + string.digits
records = Child.objects.filter(uid='')
for c in records:
    new = ''.join(random.choices(chars, k=12))
    while Child.objects.filter(uid=new).exists():
        new = ''.join(random.choices(chars, k=12))
    c.uid = new
    c.save()
    print('Fixed id=%d new_uid=%s' % (c.id, new))
print('Done. Fixed %d records' % len(records))
