from rest_framework import serializers

from .models import Project, CandidatureProjet, ProjetHistory
from .constants import STATUTS_PROJET, ROLE_MAP


class ProjetListSerializer(serializers.ModelSerializer):
    createur_nom = serializers.SerializerMethodField()
    validateur_nom = serializers.SerializerMethodField()
    progression = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "code", "type", "titre", "resume", "description",
            "orphelinat", "enfant", "createur", "createur_nom",
            "createur_role", "ambassadeur_validateur", "validateur_nom",
            "statut", "motif_rejet", "commentaire_modification",
            "budget_total", "montant_collecte", "progression",
            "beneficiaires", "date_debut", "date_fin",
            "followers_count",
            "created_at", "updated_at",
        ]

    def get_createur_nom(self, obj):
        return obj.createur.full_name if obj.createur else ""

    def get_validateur_nom(self, obj):
        return obj.ambassadeur_validateur.full_name if obj.ambassadeur_validateur else ""

    def get_progression(self, obj):
        if obj.budget_total > 0:
            return round(float(obj.montant_collecte) / float(obj.budget_total) * 100, 1)
        return 0

    def get_followers_count(self, obj):
        return obj.followers.count()


class ProjetCreateSerializer(serializers.ModelSerializer):
    pdf_file = serializers.FileField(required=False, write_only=True)

    class Meta:
        model = Project
        fields = [
            "type", "titre", "description", "resume",
            "orphelinat", "enfant",
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
        fields = ["montant_propose", "modalite", "message"]

    def create(self, validated_data):
        projet = self.context["projet"]
        validated_data["projet"] = projet
        validated_data["partenaire"] = self.context["request"].user
        return super().create(validated_data)


class CandidatureSerializer(serializers.ModelSerializer):
    partenaire_nom = serializers.SerializerMethodField()

    class Meta:
        model = CandidatureProjet
        fields = [
            "id", "projet", "partenaire", "partenaire_nom",
            "montant_propose", "modalite", "message", "statut", "created_at",
        ]
        read_only_fields = ["partenaire", "projet", "statut"]

    def get_partenaire_nom(self, obj):
        return obj.partenaire.full_name if obj.partenaire else ""


class CandidatureRepondreSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["accepter", "refuser"])


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
