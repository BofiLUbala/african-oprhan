from django.db import models
from django.conf import settings
from django.utils import timezone


class SubscriptionPlan(models.Model):
    INTERVAL_CHOICES = [
        ("monthly", "Mensuel"),
        ("quarterly", "Trimestriel"),
        ("yearly", "Annuel"),
    ]
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    interval = models.CharField(max_length=20, choices=INTERVAL_CHOICES, default="monthly")
    max_orphanages = models.IntegerField(default=1)
    max_children = models.IntegerField(default=0, help_text="0 = illimité")
    max_users = models.IntegerField(default=0)
    features = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Plan d'abonnement"
        verbose_name_plural = "Plans d'abonnement"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return f"{self.name} ({self.price} USD/{self.interval})"


class OrganizationSubscription(models.Model):
    STATUS_CHOICES = [
        ("active", "Actif"),
        ("trialing", "Essai"),
        ("past_due", "En retard"),
        ("canceled", "Annulé"),
        ("expired", "Expiré"),
    ]
    orphanage = models.ForeignKey("orphanages.Orphanage", on_delete=models.CASCADE, related_name="subscriptions")
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, related_name="subscriptions")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="trialing")
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    trial_end = models.DateTimeField(null=True, blank=True)
    auto_renew = models.BooleanField(default=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Abonnement"
        verbose_name_plural = "Abonnements"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.orphanage.name} - {self.plan.name if self.plan else 'Aucun'}"


class Invoice(models.Model):
    STATUS_CHOICES = [
        ("draft", "Brouillon"),
        ("sent", "Envoyée"),
        ("paid", "Payée"),
        ("overdue", "En retard"),
        ("canceled", "Annulée"),
        ("refunded", "Remboursée"),
    ]
    subscription = models.ForeignKey(OrganizationSubscription, on_delete=models.CASCADE, related_name="invoices")
    number = models.CharField(max_length=50, unique=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    due_date = models.DateField()
    paid_at = models.DateTimeField(null=True, blank=True)
    stripe_invoice_id = models.CharField(max_length=255, blank=True)
    pdf_url = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Facture"
        verbose_name_plural = "Factures"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.number} - {self.total} {self.currency}"


class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ("create", "Création"),
        ("update", "Modification"),
        ("delete", "Suppression"),
        ("login", "Connexion"),
        ("logout", "Déconnexion"),
        ("approve", "Approbation"),
        ("reject", "Rejet"),
        ("suspend", "Suspension"),
        ("archive", "Archivage"),
        ("export", "Export"),
        ("other", "Autre"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="activities")
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    model_id = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    orphanage = models.ForeignKey("orphanages.Orphanage", on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Journal d'activité"
        verbose_name_plural = "Journaux d'activité"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["model_name", "model_id"]),
            models.Index(fields=["action"]),
        ]

    def __str__(self):
        return f"{self.user or 'Système'} - {self.action} - {self.model_name}"


class LoginAttempt(models.Model):
    username = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    success = models.BooleanField(default=False)
    failure_reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Tentative de connexion"
        verbose_name_plural = "Tentatives de connexion"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["ip_address"]),
            models.Index(fields=["success"]),
        ]


class SecurityEvent(models.Model):
    EVENT_TYPES = [
        ("password_change", "Changement de mot de passe"),
        ("password_reset", "Réinitialisation de mot de passe"),
        ("permission_change", "Changement de permissions"),
        ("role_change", "Changement de rôle"),
        ("account_locked", "Compte verrouillé"),
        ("account_unlocked", "Compte déverrouillé"),
        ("2fa_enabled", "2FA activé"),
        ("2fa_disabled", "2FA désactivé"),
        ("email_change", "Changement d'email"),
        ("suspicious_activity", "Activité suspecte"),
        ("other", "Autre"),
    ]
    SEVERITY_CHOICES = [
        ("info", "Information"),
        ("warning", "Avertissement"),
        ("critical", "Critique"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="security_events")
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="info")
    description = models.TextField()
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Événement de sécurité"
        verbose_name_plural = "Événements de sécurité"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["user"]),
            models.Index(fields=["event_type"]),
            models.Index(fields=["severity"]),
        ]


class IpBlock(models.Model):
    ip_address = models.GenericIPAddressField(unique=True)
    reason = models.TextField(blank=True)
    blocked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Blocage IP"
        verbose_name_plural = "Blocages IP"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.ip_address} ({'Actif' if self.is_active else 'Inactif'})"


class SystemConfiguration(models.Model):
    VALUE_TYPE_CHOICES = [
        ("string", "Texte"),
        ("number", "Nombre"),
        ("boolean", "Booléen"),
        ("json", "JSON"),
    ]
    CATEGORY_CHOICES = [
        ("general", "Général"),
        ("security", "Sécurité"),
        ("email", "Email"),
        ("features", "Fonctionnalités"),
        ("limits", "Limites"),
        ("integrations", "Intégrations"),
        ("appearance", "Apparence"),
    ]
    key = models.CharField(max_length=100, unique=True)
    label = models.CharField(max_length=200)
    value = models.TextField()
    value_type = models.CharField(max_length=20, choices=VALUE_TYPE_CHOICES, default="string")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="general")
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)
    is_encrypted = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuration système"
        verbose_name_plural = "Configurations système"
        ordering = ["category", "sort_order", "key"]

    def __str__(self):
        return f"{self.key}"


class Report(models.Model):
    REPORT_TYPES = [
        ("financial", "Rapport financier"),
        ("children", "Rapport enfants"),
        ("users", "Rapport utilisateurs"),
        ("donations", "Rapport dons"),
        ("sponsorships", "Rapport parrainages"),
        ("activities", "Rapport d'activités"),
        ("custom", "Rapport personnalisé"),
    ]
    FORMAT_CHOICES = [
        ("pdf", "PDF"),
        ("csv", "CSV"),
        ("xlsx", "Excel"),
        ("html", "HTML"),
    ]
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("generating", "Génération en cours"),
        ("completed", "Terminé"),
        ("failed", "Échoué"),
    ]
    title = models.CharField(max_length=200)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default="pdf")
    parameters = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    file = models.FileField(upload_to="reports/", null=True, blank=True)
    file_size = models.IntegerField(default=0)
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    orphanage = models.ForeignKey("orphanages.Orphanage", on_delete=models.SET_NULL, null=True, blank=True)
    error_message = models.TextField(blank=True)
    scheduled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Rapport"
        verbose_name_plural = "Rapports"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.get_report_type_display()})"


class ReportSchedule(models.Model):
    FREQUENCY_CHOICES = [
        ("daily", "Quotidien"),
        ("weekly", "Hebdomadaire"),
        ("monthly", "Mensuel"),
        ("quarterly", "Trimestriel"),
        ("yearly", "Annuel"),
    ]
    report = models.OneToOneField(Report, on_delete=models.CASCADE, related_name="schedule")
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    day_of_week = models.IntegerField(null=True, blank=True, help_text="0=Lundi, 6=Dimanche")
    day_of_month = models.IntegerField(null=True, blank=True)
    time = models.TimeField(default="08:00")
    recipients = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    last_run = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Planification de rapport"
        verbose_name_plural = "Planifications de rapports"
        ordering = ["next_run"]

    def __str__(self):
        return f"{self.report.title} - {self.get_frequency_display()}"


class SupportTicket(models.Model):
    PRIORITY_CHOICES = [
        ("low", "Basse"),
        ("medium", "Moyenne"),
        ("high", "Haute"),
        ("urgent", "Urgente"),
    ]
    STATUS_CHOICES = [
        ("new", "Nouveau"),
        ("open", "Ouvert"),
        ("in_progress", "En cours"),
        ("waiting_on_user", "En attente de l'utilisateur"),
        ("resolved", "Résolu"),
        ("closed", "Fermé"),
    ]
    CATEGORY_CHOICES = [
        ("technical", "Problème technique"),
        ("billing", "Facturation"),
        ("account", "Compte"),
        ("feature", "Demande de fonctionnalité"),
        ("report", "Signaler un problème"),
        ("other", "Autre"),
    ]
    subject = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="other")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tickets_created")
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="tickets_assigned")
    orphanage = models.ForeignKey("orphanages.Orphanage", on_delete=models.SET_NULL, null=True, blank=True)
    attachments = models.JSONField(default=list, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Ticket de support"
        verbose_name_plural = "Tickets de support"
        ordering = ["-created_at"]

    def __str__(self):
        return f"#{self.pk} {self.subject}"


class TicketComment(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    is_internal = models.BooleanField(default=False, help_text="Visible uniquement par le staff")
    attachments = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Commentaire de ticket"
        verbose_name_plural = "Commentaires de tickets"
        ordering = ["created_at"]

    def __str__(self):
        return f"Commentaire de {self.author} sur #{self.ticket.pk}"


class PlatformDocument(models.Model):
    CATEGORY_CHOICES = [
        ("legal", "Documents légaux"),
        ("policy", "Politiques"),
        ("guide", "Guides"),
        ("report", "Rapports"),
        ("contract", "Contrats"),
        ("other", "Autre"),
    ]
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="other")
    file = models.FileField(upload_to="platform_documents/")
    file_size = models.IntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    is_public = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Document plateforme"
        verbose_name_plural = "Documents plateforme"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
