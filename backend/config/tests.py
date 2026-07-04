import os

from django.test import TestCase


class SettingsSecurityTests(TestCase):
    def test_cors_allow_all_origins_is_tied_to_debug(self):
        settings_path = os.path.join(os.path.dirname(__file__), "settings.py")
        with open(settings_path, encoding="utf-8") as f:
            source = f.read()
        self.assertIn("CORS_ALLOW_ALL_ORIGINS = DEBUG", source)
        self.assertNotRegex(source, r"CORS_ALLOW_ALL_ORIGINS\s*=\s*True\b")

    def test_email_credentials_have_no_hardcoded_fallback(self):
        settings_path = os.path.join(os.path.dirname(__file__), "settings.py")
        with open(settings_path, encoding="utf-8") as f:
            source = f.read()
        self.assertNotIn("efandjaprince@gmail.com", source)
        self.assertNotIn("jcwvjeanvfrapadc", source)
