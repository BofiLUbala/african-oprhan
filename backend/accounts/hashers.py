from django.contrib.auth.hashers import BCryptPasswordHasher


class CDOPasswordHasher(BCryptPasswordHasher):
    rounds = 12
    algorithm = "bcrypt_cdo"
