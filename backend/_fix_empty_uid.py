import string, random
from children.models import Child

def _gen_uid():
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=12))

empty_uids = Child.objects.filter(uid='')
for c in empty_uids:
    new_uid = _gen_uid()
    while Child.objects.filter(uid=new_uid).exists():
        new_uid = _gen_uid()
    c.uid = new_uid
    c.save()
    print(f'Fixed: id={c.id} new_uid={new_uid} nom={c.nom}')
print(f'Done. Fixed {empty_uids.count()} records')
