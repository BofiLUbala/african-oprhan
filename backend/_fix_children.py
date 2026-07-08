import os, sys, string, random as rnd
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
sys.path.insert(0, os.path.dirname(__file__))
import django
django.setup()
from children.models import Child
from django.core.files import File
from datetime import date, timedelta

def gen_uid():
    chars = string.ascii_uppercase + string.digits
    return ''.join(rnd.choices(chars, k=12))

# Disconnect signal
from django.db.models.signals import post_save
from children.signals import child_post_save
post_save.disconnect(child_post_save, sender=Child)

# Delete all existing children
Child.objects.all().delete()
print('Deleted existing children')

names = [
    ('Aminata', 'Diallo', 'S\u00e9n\u00e9gal', 'F'),
    ('Kofi', 'Annan', 'Ghana', 'M'),
    ('Zara', 'Mohamed', '\u00c9thiopie', 'F'),
    ('Moussa', 'Traor\u00e9', 'Mali', 'M'),
    ('Fatou', 'Diop', 'S\u00e9n\u00e9gal', 'F'),
    ('Jean', 'Kabongo', 'RDC', 'M'),
    ('Grace', 'Nkosi', 'Tanzanie', 'F'),
    ('Paul', 'Bizimana', 'Rwanda', 'M'),
]

# Map filenames to children (alphabetically sorted)
orphaned = sorted([f for f in os.listdir('media/enfants') if f.endswith('.jpg') and os.path.isfile(os.path.join('media/enfants', f))])
print('Found', len(orphaned), 'images:', orphaned)

created = 0
for i, fname in enumerate(orphaned[:8]):
    prenom, nom, nat, sexe = names[i]
    fpath = os.path.join('media/enfants', fname)

    uid = gen_uid()
    while Child.objects.filter(uid=uid).exists():
        uid = gen_uid()

    child = Child(
        uid=uid,
        nom=nom,
        prenom=prenom,
        sexe=sexe,
        nationalite=nat,
        date_naissance=date.today() - timedelta(days=rnd.randint(1500, 5000)),
        status='active',
    )
    with open(fpath, 'rb') as fp:
        child.photo.save(fname, File(fp), save=False)
    child.save()
    print('  Created:', prenom, nom, '(' + nat + ') ->', fname)
    created += 1

post_save.connect(child_post_save, sender=Child)

print('Total created:', created)
print('Total children in DB:', Child.objects.count())

# Verify
from children.serializers import ChildPublicSerializer
from rest_framework.test import APIRequestFactory
factory = APIRequestFactory()
request = factory.get('/api/enfants/public/')
for c in Child.objects.all().order_by('prenom'):
    ser = ChildPublicSerializer(c, context={'request': request})
    data = ser.data
    print('  ', data.get('prenom'), data.get('nom'), '- uid:', data.get('uid'), '- photo_url:', data.get('photo_url'))
