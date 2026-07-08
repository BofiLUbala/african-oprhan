from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .constants import STATUTS_PROJET, TRANSITIONS_AUTORISEES, STATUTS_PARTENAIRE_VISIBLE
from .models import Project, CandidatureProjet, ProjetHistory
from .permissions import (
    PeutCreerProjet, PeutSoumettreProjet, PeutValiderProjet,
    PeutSuspendreProjet, PeutPostulerProjet, PeutGererCandidatures,
    est_ambassadeur_orphelinat,
)
from .serializers import (
    ProjetListSerializer, ProjetCreateSerializer,
    ProjetRejeterSerializer, ProjetDemanderModificationSerializer,
    CandidatureCreateSerializer, CandidatureSerializer,
    CandidatureRepondreSerializer, ProjetHistorySerializer,
)


def _creer_evenement(projet, type_evenement, auteur=None, statut_avant="", statut_apres="", description="", metadata=None):
    ProjetHistory.objects.create(
        projet=projet,
        type_evenement=type_evenement,
        statut_avant=statut_avant,
        statut_apres=statut_apres,
        auteur=auteur,
        description=description,
        metadata=metadata or {},
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def project_list(request):
    if request.method == "GET":
        user = request.user
        if user.role == 'partner':
            projets = Project.objects.filter(statut__in=STATUTS_PARTENAIRE_VISIBLE)
        elif user.role == 'director':
            projets = Project.objects.filter(createur=user)
        elif user.role == 'ambassador':
            from django.db.models import Q
            projets = Project.objects.filter(
                Q(createur=user) |
                Q(ambassadeur_validateur=user) |
                Q(createur_role='directeur', orphelinat__isnull=False)
            )
        elif user.role in ('federation', 'supermaster'):
            projets = Project.objects.all()
        else:
            projets = Project.objects.none()

        statut = request.query_params.get("statut")
        if statut:
            projets = projets.filter(statut=statut)
        type_projet = request.query_params.get("type")
        if type_projet:
            projets = projets.filter(type=type_projet)

        projets = projets.order_by("-created_at")
        serializer = ProjetListSerializer(projets, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        if not PeutCreerProjet().has_permission(request, None):
            return Response({"error": "Vous n'avez pas la permission de créer un projet."}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProjetCreateSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            projet = serializer.save()
            detail = ProjetListSerializer(projet)
            return Response(detail.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def project_detail(request, project_id):
    try:
        projet = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if user.role == 'partner' and projet.statut not in STATUTS_PARTENAIRE_VISIBLE:
        return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
    if user.role == 'director' and projet.createur != user:
        return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

    serializer = ProjetListSerializer(projet)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, PeutSoumettreProjet])
def project_soumettre(request, project_id):
    try:
        projet = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if projet.createur != request.user:
        return Response({"error": "Vous n'êtes pas le créateur de ce projet."}, status=status.HTTP_403_FORBIDDEN)
    if not projet.peut_transitionner_vers(STATUTS_PROJET['SOUMIS_VALIDATION']):
        return Response({"error": f"Impossible de soumettre ce projet (statut actuel: {projet.statut})."}, status=status.HTTP_400_BAD_REQUEST)

    statut_avant = projet.statut
    projet.statut = STATUTS_PROJET['SOUMIS_VALIDATION']
    projet.save()
    _creer_evenement(
        projet, 'projet_soumis', auteur=request.user,
        statut_avant=statut_avant, statut_apres=projet.statut,
        description=f"Projet soumis à validation par {request.user.full_name}",
    )
    return Response(ProjetListSerializer(projet).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, PeutValiderProjet])
def project_valider(request, project_id):
    try:
        projet = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if projet.createur_role != 'directeur':
        return Response({"error": "Ce projet n'a pas été soumis par un directeur."}, status=status.HTTP_400_BAD_REQUEST)
    if projet.statut != STATUTS_PROJET['SOUMIS_VALIDATION']:
        return Response({"error": f"Impossible de valider un projet au statut {projet.statut}."}, status=status.HTTP_400_BAD_REQUEST)

    if not est_ambassadeur_orphelinat(request.user, projet.orphelinat):
        return Response({"error": "Vous n'êtes pas l'ambassadeur assigné à cet orphelinat."}, status=status.HTTP_403_FORBIDDEN)

    statut_avant = projet.statut
    projet.statut = STATUTS_PROJET['PUBLIE']
    projet.ambassadeur_validateur = request.user
    projet.save()
    _creer_evenement(
        projet, 'projet_valide', auteur=request.user,
        statut_avant=statut_avant, statut_apres=projet.statut,
        description=f"Projet validé par l'ambassadeur {request.user.full_name}",
    )
    return Response(ProjetListSerializer(projet).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, PeutValiderProjet])
def project_rejeter(request, project_id):
    serializer = ProjetRejeterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        projet = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if projet.statut != STATUTS_PROJET['SOUMIS_VALIDATION']:
        return Response({"error": f"Impossible de rejeter un projet au statut {projet.statut}."}, status=status.HTTP_400_BAD_REQUEST)

    if not est_ambassadeur_orphelinat(request.user, projet.orphelinat):
        return Response({"error": "Vous n'êtes pas l'ambassadeur assigné à cet orphelinat."}, status=status.HTTP_403_FORBIDDEN)

    statut_avant = projet.statut
    projet.statut = STATUTS_PROJET['REJETE']
    projet.motif_rejet = serializer.validated_data["motif"]
    projet.save()
    _creer_evenement(
        projet, 'projet_rejete', auteur=request.user,
        statut_avant=statut_avant, statut_apres=projet.statut,
        description=f"Projet rejeté par l'ambassadeur {request.user.full_name}. Motif: {projet.motif_rejet}",
    )
    return Response(ProjetListSerializer(projet).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, PeutValiderProjet])
def project_demander_modification(request, project_id):
    serializer = ProjetDemanderModificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        projet = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if projet.statut != STATUTS_PROJET['SOUMIS_VALIDATION']:
        return Response({"error": f"Impossible de demander une modification au statut {projet.statut}."}, status=status.HTTP_400_BAD_REQUEST)

    if not est_ambassadeur_orphelinat(request.user, projet.orphelinat):
        return Response({"error": "Vous n'êtes pas l'ambassadeur assigné à cet orphelinat."}, status=status.HTTP_403_FORBIDDEN)

    statut_avant = projet.statut
    projet.statut = STATUTS_PROJET['MODIFICATION_DEMANDEE']
    projet.commentaire_modification = serializer.validated_data["commentaire"]
    projet.save()
    _creer_evenement(
        projet, 'modification_demandee', auteur=request.user,
        statut_avant=statut_avant, statut_apres=projet.statut,
        description=f"Modification demandée par l'ambassadeur {request.user.full_name}: {projet.commentaire_modification}",
    )
    return Response(ProjetListSerializer(projet).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, PeutSuspendreProjet])
def project_suspendre(request, project_id):
    try:
        projet = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if not projet.peut_transitionner_vers(STATUTS_PROJET['SUSPENDU']):
        return Response({"error": f"Impossible de suspendre ce projet (statut: {projet.statut})."}, status=status.HTTP_400_BAD_REQUEST)

    motif = request.data.get("motif", "")
    statut_avant = projet.statut
    projet.statut = STATUTS_PROJET['SUSPENDU']
    projet.save()
    _creer_evenement(
        projet, 'projet_suspendu', auteur=request.user,
        statut_avant=statut_avant, statut_apres=projet.statut,
        description=f"Projet suspendu par la fédération. Motif: {motif}",
        metadata={"motif": motif},
    )
    return Response(ProjetListSerializer(projet).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, PeutCreerProjet])
def project_modifier(request, project_id):
    try:
        projet = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if projet.createur != request.user:
        return Response({"error": "Vous n'êtes pas le créateur de ce projet."}, status=status.HTTP_403_FORBIDDEN)

    if projet.statut not in (STATUTS_PROJET['BROUILLON'], STATUTS_PROJET['MODIFICATION_DEMANDEE']):
        return Response({"error": "Ce projet ne peut plus être modifié."}, status=status.HTTP_400_BAD_REQUEST)

    allowed_fields = {"titre", "description", "resume", "budget_total", "beneficiaires", "date_debut", "date_fin", "documents"}
    data = {k: v for k, v in request.data.items() if k in allowed_fields}
    for key, value in data.items():
        setattr(projet, key, value)

    statut_avant = projet.statut
    if projet.statut == STATUTS_PROJET['MODIFICATION_DEMANDEE']:
        projet.statut = STATUTS_PROJET['SOUMIS_VALIDATION']
        projet.commentaire_modification = ""

    projet.save()

    evenement_type = 'projet_modifie' if statut_avant == STATUTS_PROJET['BROUILLON'] else 'projet_soumis'
    _creer_evenement(
        projet, evenement_type, auteur=request.user,
        statut_avant=statut_avant, statut_apres=projet.statut,
        description=f"Projet modifié par {request.user.full_name}",
    )
    return Response(ProjetListSerializer(projet).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, PeutPostulerProjet])
def project_candidature_create(request, project_id):
    try:
        projet = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if projet.statut not in STATUTS_PARTENAIRE_VISIBLE:
        return Response({"error": "Ce projet n'accepte pas les candidatures."}, status=status.HTTP_400_BAD_REQUEST)

    if CandidatureProjet.objects.filter(projet=projet, partenaire=request.user).exists():
        return Response({"error": "Vous avez déjà postulé à ce projet."}, status=status.HTTP_409_CONFLICT)

    serializer = CandidatureCreateSerializer(
        data=request.data, context={"request": request, "projet": projet},
    )
    if serializer.is_valid():
        candidature = serializer.save()
        _creer_evenement(
            projet, 'candidature_soumise', auteur=request.user,
            description=f"Candidature soumise par {request.user.full_name} — {candidature.montant_propose}€",
            metadata={
                "candidature_id": candidature.id,
                "montant": str(candidature.montant_propose),
                "modalite": candidature.modalite,
            },
        )
        return Response(CandidatureSerializer(candidature).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated, PeutGererCandidatures])
def project_candidature_list(request, project_id):
    try:
        projet = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if request.user.role == 'director' and projet.createur != request.user:
        return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

    candidatures = projet.candidatures.all()
    serializer = CandidatureSerializer(candidatures, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, PeutGererCandidatures])
def project_candidature_repondre(request, project_id, candidature_id):
    try:
        projet = Project.objects.get(pk=project_id)
        candidature = CandidatureProjet.objects.get(pk=candidature_id, projet=projet)
    except (Project.DoesNotExist, CandidatureProjet.DoesNotExist):
        return Response({"error": "Projet ou candidature introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if request.user.role == 'director' and projet.createur != request.user:
        return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

    if candidature.statut != 'en_attente_reponse':
        return Response({"error": "Cette candidature a déjà été traitée."}, status=status.HTTP_400_BAD_REQUEST)

    serializer = CandidatureRepondreSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    action = serializer.validated_data["action"]

    if action == "accepter":
        candidature.statut = 'acceptee'
        candidature.save()
        projet.montant_collecte += candidature.montant_propose
        if projet.statut == STATUTS_PROJET['PUBLIE']:
            projet.statut = STATUTS_PROJET['EN_FINANCEMENT']
        projet.save()
        _creer_evenement(
            projet, 'candidature_acceptee', auteur=request.user,
            description=f"Candidature acceptée — {candidature.partenaire.full_name} — {candidature.montant_propose}€",
            metadata={"candidature_id": candidature.id, "montant": str(candidature.montant_propose)},
        )
    elif action == "refuser":
        candidature.statut = 'refusee'
        candidature.save()
        _creer_evenement(
            projet, 'candidature_refusee', auteur=request.user,
            description=f"Candidature refusée — {candidature.partenaire.full_name}",
            metadata={"candidature_id": candidature.id},
        )

    return Response(CandidatureSerializer(candidature).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def project_history(request, project_id):
    try:
        projet = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)

    historique = projet.historique.all()
    serializer = ProjetHistorySerializer(historique, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def project_follow(request, project_id):
    try:
        projet = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)
    user = request.user
    if projet.followers.filter(pk=user.pk).exists():
        projet.followers.remove(user)
        return Response({"following": False})
    projet.followers.add(user)
    return Response({"following": True})
