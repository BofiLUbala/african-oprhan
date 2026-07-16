from rest_framework import serializers

from .models import Project, CandidatureProjet, ProjetHistory
from .constants import STATUTS_PROJET, ROLE_MAP


class ProjetListSerializer(serializers.ModelSerializer):
    createur_nom = serializers.SerializerMethodField()
    validateur_nom = serializers.SerializerMethodField()
    assigned_reviewer_nom = serializers.SerializerMethodField()
    enfant_info = serializers.SerializerMethodField()
    progression = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    date_status = serializers.SerializerMethodField()
    source_update_category = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "code", "type", "titre", "resume", "description",
            "orphelinat", "enfant", "source_update", "source_update_category",
            "createur", "createur_nom",
            "createur_role", "ambassadeur_validateur", "validateur_nom",
            "assigned_reviewer", "assigned_reviewer_nom",
            "statut", "motif_rejet", "commentaire_modification",
            "budget_total", "montant_collecte", "progression",
            "beneficiaires", "date_debut", "date_fin", "date_status",
            "enfant_info",
            "followers_count",
            "created_at", "updated_at",
        ]

    def get_createur_nom(self, obj):
        return obj.createur.full_name if obj.createur else ""

    def get_validateur_nom(self, obj):
        return obj.ambassadeur_validateur.full_name if obj.ambassadeur_validateur else ""

    def get_assigned_reviewer_nom(self, obj):
        return obj.assigned_reviewer.full_name if obj.assigned_reviewer else ""

    def get_enfant_info(self, obj):
        if not obj.enfant:
            return None
        return {
            "id": obj.enfant.id,
            "uid": obj.enfant.uid,
            "prenom": obj.enfant.prenom,
            "nom": obj.enfant.nom,
            "photo": obj.enfant.photo.url if obj.enfant.photo else None,
            "nationalite": obj.enfant.nationalite,
            "status_label": (obj.enfant.get_status_display() if hasattr(obj.enfant, 'get_status_display') else obj.enfant.status or ""),
            "orphanage_name": getattr(obj.enfant.orphanage, 'name', "") if obj.enfant.orphanage else "",
        }

    def get_progression(self, obj):
        if obj.budget_total > 0:
            return round(float(obj.montant_collecte) / float(obj.budget_total) * 100, 1)
        return 0

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_date_status(self, obj):
        """Statut calculé à partir de date_fin, distinct du statut de workflow
        (`statut`) : active / ending_soon (<=7j) / closed. None si aucune
        date_fin n'est définie (projets historiques sans échéance)."""
        if not obj.date_fin:
            return None
        from datetime import date
        today = date.today()
        if obj.date_fin < today:
            return "closed"
        if (obj.date_fin - today).days <= 7:
            return "ending_soon"
        return "active"

    def get_source_update_category(self, obj):
        return obj.source_update.category if obj.source_update else None


class ProjetCreateSerializer(serializers.ModelSerializer):
    pdf_file = serializers.FileField(required=False, write_only=True)

    class Meta:
        model = Project
        fields = [
            "type", "titre", "description", "resume",
            "orphelinat", "enfant", "source_update",
            "budget_total", "beneficiaires",
            "date_debut", "date_fin",
            "pdf_file", "documents",
        ]

    def validate_type(self, value):
        request = self.context.get("request")
        if request and request.user.role == "director" and value == "federation":
            raise serializers.ValidationError("Un chef d'orphelinat ne peut pas créer un projet de type fédération.")
        return value

    def create(self, validated_data):
        validated_data.pop("pdf_file", None)
        request = self.context["request"]
        user = request.user
        validated_data["createur"] = user
        validated_data["createur_role"] = ROLE_MAP.get(user.role, user.role)

        if not validated_data.get("orphelinat") and user.role == "director":
            try:
                if user.managed_orphanage:
                    validated_data["orphelinat"] = user.managed_orphanage
            except Exception:
                pass

        if user.role in ('ambassador', 'federation'):
            validated_data["statut"] = STATUTS_PROJET['PUBLIE']
        else:
            validated_data["statut"] = STATUTS_PROJET['BROUILLON']

        if not validated_data.get("resume") and validated_data.get("description"):
            validated_data["resume"] = validated_data["description"][:80]

        return super().create(validated_data)


class ProjetSoumettreSerializer(serializers.Serializer):
    pass


class ProjetValiderSerializer(serializers.Serializer):
    pass


class ProjetRejeterSerializer(serializers.Serializer):
    motif = serializers.CharField(required=True)


class ProjetDemanderModificationSerializer(serializers.Serializer):
    commentaire = serializers.CharField(required=True)


class ProjetSuspendreSerializer(serializers.Serializer):
    motif = serializers.CharField(required=False, allow_blank=True)


class CandidatureCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidatureProjet
        fields = ["montant_propose", "modalite", "type_financement", "message"]

    def create(self, validated_data):
        projet = self.context["projet"]
        validated_data["projet"] = projet
        validated_data["partenaire"] = self.context["request"].user
        return super().create(validated_data)


class CandidatureSerializer(serializers.ModelSerializer):
    partenaire_nom = serializers.SerializerMethodField()
    partenaire_country = serializers.SerializerMethodField()
    partenaire_avatar = serializers.SerializerMethodField()
    projet_titre = serializers.SerializerMethodField()
    projet_code = serializers.SerializerMethodField()
    projet_type = serializers.SerializerMethodField()
    createur = serializers.SerializerMethodField()
    createur_nom = serializers.SerializerMethodField()
    createur_role = serializers.SerializerMethodField()
    repondu_par_nom = serializers.SerializerMethodField()
    can_manage = serializers.SerializerMethodField()

    class Meta:
        model = CandidatureProjet
        fields = [
            "id", "projet", "projet_titre", "projet_code", "projet_type",
            "partenaire", "partenaire_nom", "partenaire_country", "partenaire_avatar",
            "createur", "createur_nom", "createur_role",
            "montant_propose", "modalite", "type_financement", "message", "statut",
            "commentaire_reponse", "repondu_par", "repondu_par_nom", "repondu_le",
            "can_manage", "created_at", "updated_at",
        ]
        read_only_fields = ["partenaire", "projet", "statut", "repondu_par", "repondu_le"]

    def get_partenaire_nom(self, obj):
        return obj.partenaire.full_name if obj.partenaire else ""

    def get_partenaire_country(self, obj):
        return obj.partenaire.country if obj.partenaire else ""

    def get_partenaire_avatar(self, obj):
        if obj.partenaire and obj.partenaire.avatar:
            return obj.partenaire.avatar.url
        return None

    def get_projet_titre(self, obj):
        return obj.projet.titre if obj.projet else ""

    def get_projet_code(self, obj):
        return obj.projet.code if obj.projet else ""

    def get_projet_type(self, obj):
        return obj.projet.type if obj.projet else ""

    def get_createur(self, obj):
        return obj.projet.createur_id if obj.projet else None

    def get_createur_nom(self, obj):
        return obj.projet.createur.full_name if obj.projet and obj.projet.createur else ""

    def get_createur_role(self, obj):
        return obj.projet.createur.role if obj.projet and obj.projet.createur else ""

    def get_repondu_par_nom(self, obj):
        return obj.repondu_par.full_name if obj.repondu_par else ""

    def get_can_manage(self, obj):
        request = self.context.get("request")
        if not request or not obj.projet:
            return False
        return obj.projet.createur_id == request.user.id


class CandidatureRepondreSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["accepter", "refuser", "demander_amelioration"])
    commentaire = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, data):
        if data.get("action") == "demander_amelioration" and not data.get("commentaire", "").strip():
            raise serializers.ValidationError({"commentaire": "Un commentaire est requis pour demander une amélioration."})
        return data


class ProjetHistorySerializer(serializers.ModelSerializer):
    auteur_nom = serializers.SerializerMethodField()

    class Meta:
        model = ProjetHistory
        fields = [
            "id", "projet", "type_evenement", "statut_avant", "statut_apres",
            "auteur", "auteur_nom", "description", "metadata", "created_at",
        ]

    def get_auteur_nom(self, obj):
        return obj.auteur.full_name if obj.auteur else ""
