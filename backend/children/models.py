from django.conf import settings
from django.db import models


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


class ChildHistory(models.Model):
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

    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name="history", verbose_name="Enfant")
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
        ]

    def __str__(self):
        return f"{self.title} — {self.child} ({self.event_date.strftime('%d/%m/%Y')})"
