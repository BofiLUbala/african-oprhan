import importlib
import os

from django.test import TestCase, override_settings


class SettingsSecurityTests(TestCase):
    def test_cors_allow_all_disabled_when_debug_false(self):
        with override_settings(DEBUG=False):
            from django.conf import settings
            # CORS_ALLOW_ALL_ORIGINS must never be True outside DEBUG mode.
            self.assertFalse(
                getattr(settings, "CORS_ALLOW_ALL_ORIGINS", False) and not settings.DEBUG,
                "CORS_ALLOW_ALL_ORIGINS must be False when DEBUG is False",
            )

    def test_email_credentials_have_no_hardcoded_fallback(self):
        settings_path = os.path.join(os.path.dirname(__file__), "settings.py")
        with open(settings_path, encoding="utf-8") as f:
            source = f.read()
        self.assertNotIn("efandjaprince@gmail.com", source)
        self.assertNotIn("jcwvjeanvfrapadc", source)
