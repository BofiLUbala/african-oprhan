import os, sys
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
sys.path.insert(0, os.path.dirname(__file__))
import django
django.setup()
from django.core.management import call_command
call_command('migrate', 'children', '0008', fake=True, verbosity=1)
print('Done')
