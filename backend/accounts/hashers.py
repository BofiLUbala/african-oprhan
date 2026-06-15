from django.contrib.auth.hashers import BCryptPasswordHasher


class CDOPasswordHasher(BCryptPasswordHasher):
    rounds = 20
    algorithm = "bcrypt_cdo"
