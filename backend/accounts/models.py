from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import uuid

AFRICAN_COUNTRIES = [
    ("AO", "Angola"), ("BJ", "Bénin"), ("BW", "Botswana"), ("BF", "Burkina Faso"),
    ("BI", "Burundi"), ("CM", "Cameroun"), ("CV", "Cap-Vert"), ("CF", "République centrafricaine"),
    ("KM", "Comores"), ("CG", "Congo-Brazzaville"), ("CD", "République démocratique du Congo"),
    ("CI", "Côte d'Ivoire"), ("DJ", "Djibouti"), ("EG", "Égypte"), ("GQ", "Guinée équatoriale"),
    ("ER", "Érythrée"), ("SZ", "Eswatini"), ("ET", "Éthiopie"), ("GA", "Gabon"),
    ("GM", "Gambie"), ("GH", "Ghana"), ("GN", "Guinée"), ("GW", "Guinée-Bissau"),
    ("KE", "Kenya"), ("LS", "Lesotho"), ("LR", "Libéria"), ("LY", "Libye"),
    ("MG", "Madagascar"), ("MW", "Malawi"), ("ML", "Mali"), ("MR", "Mauritanie"),
    ("MU", "Maurice"), ("MA", "Maroc"), ("MZ", "Mozambique"), ("NA", "Namibie"),
    ("NE", "Niger"), ("NG", "Nigeria"), ("RW", "Rwanda"), ("ST", "Sao Tomé-et-Principe"),
    ("SN", "Sénégal"), ("SC", "Seychelles"), ("SL", "Sierra Leone"), ("SO", "Somalie"),
    ("ZA", "Afrique du Sud"), ("SS", "Soudan du Sud"), ("SD", "Soudan"), ("TZ", "Tanzanie"),
    ("TG", "Togo"), ("TN", "Tunisie"), ("UG", "Ouganda"), ("ZM", "Zambie"), ("ZW", "Zimbabwe"),
]

ROLES = [
    ("ambassador", "Ambassadeur"),
    ("federation", "Administrateur Federation"),
    ("supermaster", "Super Master"),
    ("partner", "Partenaire"),
    ("director", "Chef d'orphelinat"),
]


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, verbose_name="Adresse email")
    first_name = models.CharField(max_length=100, verbose_name="Prénom")
    last_name = models.CharField(max_length=100, verbose_name="Nom")
    country = models.CharField(max_length=2, choices=AFRICAN_COUNTRIES, verbose_name="Pays")
    role = models.CharField(max_length=20, choices=ROLES, verbose_name="Rôle")
    is_active = models.BooleanField(default=False, verbose_name="Compte activé")
    is_staff = models.BooleanField(default=False, verbose_name="Staff")
    
    orphanage = models.ForeignKey(
        "orphanages.Orphanage",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_members",
        verbose_name="Orphelinat affilié"
    )

    email_verification_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, null=True)
    verification_sent_at = models.DateTimeField(null=True, blank=True)
    email_verified_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name", "country", "role"]

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        return f"{self.first_name} {self.last_name} <{self.email}>"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
