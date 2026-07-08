import hashlib
import json

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.db import models
from django.utils import timezone

from .constants import CLASSIFICATION_EVENEMENTS, EVENEMENTS_VALIDATION_REQUISE


class ChildAssignment(models.Model):
    child = models.ForeignKey("Child", on_delete=models.CASCADE, related_name="assignments", verbose_name="Enfant")
    ambassador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assigned_children",
        verbose_name="Ambassadeur",
        limit_choices_to={"role": "ambassador"},
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="child_assignments_made",
        verbose_name="Assigné par",
    )
    note = models.TextField(blank=True, default="", verbose_name="Note")
    assigned_at = models.DateTimeField(auto_now_add=True, verbose_name="Assigné le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        verbose_name = "Assignation d'enfant"
        verbose_name_plural = "Assignations d'enfants"
        ordering = ["-assigned_at"]
        unique_together = [("child", "ambassador")]

    def __str__(self):
        return f"{self.child} → {self.ambassador}"


class Child(models.Model):
    SEXE_CHOICES = [
        ("M", "Masculin"),
        ("F", "Féminin"),
    ]

    STATUS_CHOICES = [
        ("active", "Actif"),
        ("sick", "Malade"),
        ("hospitalized", "Hospitalisé"),
        ("healthy", "En bonne santé"),
        ("enrolled", "Scolarisé"),
        ("dropped_out", "Déscolarisé"),
        ("with_guardian", "Chez le tuteur"),
        ("missing", "Disparu"),
        ("at_risk", "À risque"),
        ("reunified", "Réunifié"),
        ("adopted", "Adopté"),
        ("transferred", "Transféré"),
        ("exited", "Sorti"),
        ("deceased", "Décédé"),
    ]
    STATUS_CATEGORIES = {
        "active": "general",
        "sick": "health",
        "hospitalized": "health",
        "healthy": "health",
        "enrolled": "education",
        "dropped_out": "education",
        "with_guardian": "family",
        "missing": "protection",
        "at_risk": "protection",
        "reunified": "family",
        "adopted": "family",
        "transferred": "general",
        "exited": "general",
        "deceased": "general",
    }

    uid = models.CharField(max_length=12, unique=True, editable=False, verbose_name="UID")
    nom = models.CharField(max_length=100, blank=True, default="", verbose_name="Nom")
    prenom = models.CharField(max_length=100, blank=True, default="", verbose_name="Prénom")
    sexe = models.CharField(max_length=1, choices=SEXE_CHOICES, blank=True, default="", verbose_name="Sexe")
    date_naissance = models.DateField(null=True, blank=True, verbose_name="Date de naissance")
    nationalite = models.CharField(max_length=100, blank=True, default="", verbose_name="Nationalité")
    photo = models.ImageField(upload_to="enfants/", blank=True, null=True, verbose_name="Photo")
    adresse = models.TextField(blank=True, verbose_name="Adresse d'origine")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active", verbose_name="Statut")
    extra_data = models.JSONField(default=dict, blank=True, verbose_name="Données supplémentaires")

    biography = models.TextField(blank=True, default="", verbose_name="Biographie")
    dream = models.TextField(blank=True, default="", verbose_name="Rêve")
    skills = models.JSONField(default=list, blank=True, verbose_name="Talents")
    interests = models.JSONField(default=list, blank=True, verbose_name="Centres d'intérêt")

    school_name = models.CharField(max_length=255, blank=True, default="", verbose_name="Nom de l'école")
    school_level = models.CharField(max_length=100, blank=True, default="", verbose_name="Niveau scolaire")
    school_progress = models.CharField(max_length=100, blank=True, default="", verbose_name="Progrès scolaire")

    medical_info = models.JSONField(default=dict, blank=True, verbose_name="Informations médicales")

    followers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="followed_children",
        verbose_name="Followers",
    )

    orphanage = models.ForeignKey(
        "orphanages.Orphanage",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
        verbose_name="Orphelinat"
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="enfants",
        verbose_name="Créé par",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        verbose_name = "Enfant"
        verbose_name_plural = "Enfants"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.uid})"


class ChildUpdate(models.Model):
    CATEGORY_CHOICES = [
        ("health", "Santé"),
        ("education", "Éducation"),
        ("family", "Famille"),
        ("documents", "Documents"),
        ("social", "Social"),
    ]

    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name="updates", verbose_name="Enfant")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, verbose_name="Catégorie")
    update_type = models.CharField(max_length=50, verbose_name="Type de mise à jour")
    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(blank=True, default="", verbose_name="Description")
    previous_value = models.TextField(blank=True, default="", verbose_name="Ancienne valeur")
    new_value = models.TextField(blank=True, default="", verbose_name="Nouvelle valeur")
    reason = models.TextField(blank=True, default="", verbose_name="Raison")
    attachments = models.JSONField(blank=True, default=list, verbose_name="Pièces jointes")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="child_updates",
        verbose_name="Créé par",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")

    class Meta:
        verbose_name = "Mise à jour enfant"
        verbose_name_plural = "Mises à jour enfants"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.child.uid})"


class FichierJoint(models.Model):
    fichier = models.FileField(upload_to="historique/", verbose_name="Fichier")
    nom = models.CharField(max_length=255, verbose_name="Nom du fichier")
    taille = models.IntegerField(default=0, verbose_name="Taille (octets)")
    type_mime = models.CharField(max_length=100, blank=True, default="", verbose_name="Type MIME")
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="Téléversé le")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Téléversé par",
    )

    class Meta:
        verbose_name = "Fichier joint"
        verbose_name_plural = "Fichiers joints"

    def __str__(self):
        return self.nom


class ChildHistoryQuerySet(models.QuerySet):
    def update(self, *args, **kwargs):
        raise PermissionDenied("Les événements d'historique sont immuables et ne peuvent pas être modifiés via update.")


class ChildHistory(models.Model):
    objects = ChildHistoryQuerySet.as_manager()
    EVENT_TYPE_CHOICES = [
        ("created", "Création"),
        ("updated", "Modification"),
        ("update_added", "Mise à jour ajoutée"),
        ("document_added", "Document ajouté"),
        ("document_verified", "Document vérifié"),
        ("document_replaced", "Document remplacé"),
        ("document_expired", "Document expiré"),
        ("health_update", "Mise à jour santé"),
        ("vaccination_added", "Vaccination ajoutée"),
        ("illness_added", "Maladie ajoutée"),
        ("treatment_started", "Traitement commencé"),
        ("treatment_ended", "Traitement terminé"),
        ("consultation_added", "Consultation ajoutée"),
        ("hospitalization_added", "Hospitalisation ajoutée"),
        ("allergy_added", "Allergie ajoutée"),
        ("education_update", "Mise à jour éducation"),
        ("school_enrolled", "Inscription scolaire"),
        ("school_changed", "Changement d'école"),
        ("grade_added", "Note ajoutée"),
        ("exam_result_added", "Résultat examen ajouté"),
        ("family_update", "Mise à jour famille"),
        ("guardian_assigned", "Tuteur attribué"),
        ("parent_identified", "Parent identifié"),
        ("family_reunified", "Réunification familiale"),
        ("foster_placement", "Placement familial"),
        ("adoption_progress", "Progrès adoption"),
        ("social_update", "Mise à jour sociale"),
        ("social_note_added", "Note sociale ajoutée"),
        ("home_visit", "Visite domicile"),
        ("counseling_session", "Session counseling"),
        ("incident_reported", "Incident signalé"),
        ("protection_concern", "Préoccupation protection"),
        ("status_change", "Changement de statut"),
        ("alert_triggered", "Alerte déclenchée"),
        ("note_added", "Note ajoutée"),
        ("case_note", "Note de suivi"),
        ("file_downloaded", "Fichier téléchargé"),
        ("record_approved", "Enregistrement approuvé"),
        ("record_rejected", "Enregistrement rejeté"),
        ("notification_sent", "Notification envoyée"),
        ("child_archived", "Enfant archivé"),
        ("child_restored", "Enfant restauré"),
        ("follow_up", "Action de suivi"),
        ("observation_added", "Observation ajoutée"),
        ("transfer_initiated", "Transfert initié"),
        ("exit_registered", "Sortie enregistrée"),
    ]

    CATEGORY_CHOICES = [
        ("general", "Général"),
        ("registration", "Enregistrement"),
        ("identity", "Identité"),
        ("status", "Statut"),
        ("health", "Santé"),
        ("education", "Éducation"),
        ("family", "Famille"),
        ("documents", "Documents"),
        ("social", "Social"),
        ("protection", "Protection"),
        ("alert", "Alerte"),
        ("system", "Système"),
        ("follow_up", "Suivi"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Basse"),
        ("normal", "Normale"),
        ("high", "Haute"),
        ("critical", "Critique"),
    ]

    SOURCE_MODULE_CHOICES = [
        ("registration", "Enregistrement"),
        ("child_profile", "Profil enfant"),
        ("health", "Santé"),
        ("education", "Éducation"),
        ("family", "Famille"),
        ("documents", "Documents"),
        ("social", "Social"),
        ("update_center", "Centre de mise à jour"),
        ("status", "Statut"),
        ("system", "Système"),
        ("alert", "Alerte"),
        ("follow_up", "Suivi"),
    ]

    child = models.ForeignKey(Child, on_delete=models.SET_NULL, null=True, related_name="history", verbose_name="Enfant")
    event_type = models.CharField(max_length=30, choices=EVENT_TYPE_CHOICES, verbose_name="Type d'événement")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="general", verbose_name="Catégorie")
    subcategory = models.CharField(max_length=50, blank=True, default="", verbose_name="Sous-catégorie")
    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(blank=True, default="", verbose_name="Description")
    old_value = models.TextField(blank=True, default="", verbose_name="Ancienne valeur")
    new_value = models.TextField(blank=True, default="", verbose_name="Nouvelle valeur")
    status_before = models.CharField(max_length=20, blank=True, default="", verbose_name="Statut avant")
    status_after = models.CharField(max_length=20, blank=True, default="", verbose_name="Statut après")
    reason = models.TextField(blank=True, default="", verbose_name="Raison")
    note = models.TextField(blank=True, default="", verbose_name="Note")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="normal", verbose_name="Priorité")
    source_module = models.CharField(max_length=20, choices=SOURCE_MODULE_CHOICES, default="system", verbose_name="Module source")
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="performed_history",
        verbose_name="Effectué par",
    )
    performed_role = models.CharField(max_length=50, blank=True, default="", verbose_name="Rôle")
    department = models.CharField(max_length=100, blank=True, default="", verbose_name="Département")
    attachments = models.JSONField(blank=True, default=list, verbose_name="Pièces jointes")
    metadata = models.JSONField(blank=True, default=dict, verbose_name="Métadonnées")
    linked_update = models.ForeignKey(
        ChildUpdate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="history_events",
        verbose_name="Mise à jour liée",
    )
    niveau_sensibilite = models.CharField(
        max_length=20,
        choices=[("PUBLIC", "Public"), ("RESTREINT", "Restreint"), ("CONFIDENTIEL", "Confidentiel")],
        default="PUBLIC",
        verbose_name="Niveau de sensibilité",
    )
    statut_validation = models.CharField(
        max_length=20,
        choices=[
            ("AUTO_VALIDE", "Auto-validé"), ("EN_ATTENTE", "En attente"),
            ("VALIDE", "Validé"), ("REJETE", "Rejeté"),
        ],
        default="AUTO_VALIDE",
        verbose_name="Statut de validation",
    )
    hash_precedent = models.CharField(max_length=64, null=True, blank=True, verbose_name="Hash précédent")
    hash_courant = models.CharField(max_length=64, null=True, blank=True, verbose_name="Hash courant")
    evenement_parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="corrections",
        verbose_name="Événement parent",
    )
    piece_jointe = models.ForeignKey(
        FichierJoint,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Pièce jointe",
    )

    event_date = models.DateTimeField(verbose_name="Date de l'événement")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")

    class Meta:
        verbose_name = "Historique enfant"
        verbose_name_plural = "Historiques enfants"
        ordering = ["-event_date"]
        indexes = [
            models.Index(fields=["child", "-event_date"]),
            models.Index(fields=["child", "category"]),
            models.Index(fields=["child", "event_type"]),
            models.Index(fields=["child", "priority"]),
            models.Index(fields=["child", "statut_validation"]),
            models.Index(fields=["child", "niveau_sensibilite"]),
        ]
        permissions = [
            ("validate_history", "Peut valider/rejeter des événements d'historique"),
            ("view_confidential_history", "Peut voir les événements confidentiels"),
            ("view_consultation_log", "Peut voir le journal des consultations"),
        ]

    def __str__(self):
        return f"{self.title} — {self.child} ({self.event_date.strftime('%d/%m/%Y')})"

    def _contenu_a_hacher(self):
        data = {
            'enfant_id': self.child_id,
            'type_evenement': self.event_type,
            'categorie': self.category,
            'priorite': self.priority,
            'horodatage': self.event_date.isoformat() if self.event_date else None,
            'auteur_id': self.performed_by_id,
            'auteur_role': self.performed_role,
            'module_source': self.source_module,
            'ancienne_valeur': self.old_value,
            'nouvelle_valeur': self.new_value,
            'raison': self.reason,
            'statut_validation': self.statut_validation,
            'niveau_sensibilite': self.niveau_sensibilite,
            'hash_precedent': self.hash_precedent,
        }
        return json.dumps(data, sort_keys=True, ensure_ascii=False)

    def calculate_hash(self):
        return hashlib.sha256(self._contenu_a_hacher().encode('utf-8')).hexdigest()

    def save(self, *args, **kwargs):
        if self.pk and not kwargs.pop('_force', False):
            raise PermissionDenied("Les événements d'historique sont immuables et ne peuvent pas être modifiés.")
        if not self.hash_courant:
            dernier = ChildHistory.objects.filter(child=self.child).exclude(pk=self.pk).order_by('-event_date').first()
            if dernier and dernier.hash_courant:
                self.hash_precedent = dernier.hash_courant
            self.hash_courant = self.calculate_hash()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if not kwargs.pop('_force', False):
            raise PermissionDenied("Les événements d'historique sont immuables et ne peuvent pas être supprimés.")
        super().delete(*args, **kwargs)


class ConsultationHistorique(models.Model):
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="consultations_historique",
        verbose_name="Utilisateur",
    )
    enfant = models.ForeignKey(
        Child,
        on_delete=models.CASCADE,
        related_name="consultations_historique",
        verbose_name="Enfant",
    )
    horodatage = models.DateTimeField(auto_now_add=True, verbose_name="Horodatage")
    filtre_applique = models.JSONField(blank=True, default=dict, verbose_name="Filtre appliqué")

    class Meta:
        verbose_name = "Consultation d'historique"
        verbose_name_plural = "Consultations d'historique"
        ordering = ["-horodatage"]
        indexes = [
            models.Index(fields=["utilisateur", "-horodatage"]),
            models.Index(fields=["enfant", "-horodatage"]),
        ]

    def __str__(self):
        return f"{self.utilisateur} → {self.enfant} ({self.horodatage.strftime('%d/%m/%Y %H:%M')})"
