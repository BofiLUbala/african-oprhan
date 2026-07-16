from django.db import transaction, models
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .constants import STATUTS_PROJET, TRANSITIONS_AUTORISEES, STATUTS_PARTENAIRE_VISIBLE
from .models import Project, CandidatureProjet, ProjetHistory
from .permissions import (
    PeutCreerProjet, PeutSoumettreProjet, PeutValiderProjet,
    PeutRevoirProjet, PeutSuspendreProjet, PeutPostulerProjet, PeutGererCandidatures,
    est_ambassadeur_orphelinat, get_reviewer_for_child,
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


def _notification(user, title, content, link=""):
    from communications.models import Notification
    Notification.objects.create(
        user=user,
        title=title,
        content=content,
        link=link,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def project_public_list(request):
    """Public endpoint for unauthenticated visitors — only published projects."""
    projets = Project.objects.filter(statut='publie').order_by("-created_at")
    limit = request.query_params.get("limit")
    if limit:
        try:
            projets = projets[:int(limit)]
        except (ValueError, TypeError):
            pass
    serializer = ProjetListSerializer(projets, many=True)
    return Response(serializer.data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def project_list(request):
    if request.method == "GET":
        user = request.user
        if user.role == 'partner':
            projets = Project.objects.filter(statut__in=STATUTS_PARTENAIRE_VISIBLE)
        elif user.role == 'director':
            from django.db.models import Q
            projets = Project.objects.filter(
                Q(createur=user) |
                Q(enfant__orphanage=user.orphanage) |
                Q(orphelinat=user.orphanage)
            )
        elif user.role == 'ambassador':
            from django.db.models import Q
            from children.models import ChildAssignment
            enfants_assignes = ChildAssignment.objects.filter(ambassador=user).values_list('child_id', flat=True)
            orphelinats_assignes = ChildAssignment.objects.filter(ambassador=user).values_list('child__orphanage_id', flat=True)
            projets = Project.objects.filter(
                Q(createur=user) |
                Q(ambassadeur_validateur=user) |
                Q(assigned_reviewer=user) |
                Q(enfant_id__in=enfants_assignes) |
                Q(orphelinat_id__in=orphelinats_assignes)
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
        enfant_id = request.query_params.get("enfant")
        if enfant_id:
            projets = projets.filter(enfant_id=enfant_id)
        orphelinat_id = request.query_params.get("orphelinat")
        if orphelinat_id:
            projets = projets.filter(orphelinat_id=orphelinat_id)
        createur_role = request.query_params.get("createur_role")
        if createur_role:
            projets = projets.filter(createur_role=createur_role)

        projets = projets.order_by("-created_at")
        serializer = ProjetListSerializer(projets, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        if not PeutCreerProjet().has_permission(request, None):
            return Response({"error": "Vous n'avez pas la permission de créer un projet."}, status=status.HTTP_403_FORBIDDEN)
        if request.data.get("type") == "federation" and request.user.role == "director":
            return Response(
                {"error": "Le chef d'orphelinat ne peut pas créer de projet fédération."},
                status=status.HTTP_403_FORBIDDEN,
            )
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


def _send_to_reviewer(projet, request):
    """Route le projet vers l'ambassadeur assigné à l'enfant, ou vers la
    fédération si aucun ambassadeur n'est trouvé. Met à jour le statut,
    assigned_reviewer, et envoie les notifications."""
    reviewer = get_reviewer_for_child(projet.enfant)
    statut_avant = projet.statut

    if reviewer and reviewer.role == 'ambassador':
        projet.statut = STATUTS_PROJET['EN_ATTENTE_AMBASSADEUR']
        projet.assigned_reviewer = reviewer
        projet.save(update_fields=['statut', 'assigned_reviewer'])
        _creer_evenement(
            projet, 'projet_attribue_ambassadeur', auteur=request.user,
            statut_avant=statut_avant, statut_apres=projet.statut,
            description=f"Projet attribué à l'ambassadeur {reviewer.full_name} pour validation",
            metadata={"reviewer_id": reviewer.id, "reviewer_name": reviewer.full_name},
        )
        _notification(
            reviewer,
            f"Nouveau projet à valider : {projet.titre}",
            f"Type: {projet.get_type_display()}\nCrée par: {projet.createur.full_name}\nSoumis le: {projet.created_at.strftime('%d/%m/%Y')}",
            f"communication:projects:review:{projet.id}",
        )
        _notification(
            projet.createur,
            f"Projet soumis à l'ambassadeur {reviewer.full_name}",
            f"Votre projet « {projet.titre} » a été envoyé à {reviewer.full_name} pour validation.",
            f"communication:projects:response:{projet.id}",
        )
    else:
        if not reviewer:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            reviewer = User.objects.filter(role='federation', is_active=True).first()
        else:
            pass
        projet.statut = STATUTS_PROJET['EN_ATTENTE_FEDERATION']
        projet.assigned_reviewer = reviewer
        projet.save(update_fields=['statut', 'assigned_reviewer'])
        reviewer_name = reviewer.full_name if reviewer else "Fédération"
        _creer_evenement(
            projet, 'projet_attribue_federation', auteur=request.user,
            statut_avant=statut_avant, statut_apres=projet.statut,
            description=f"Projet attribué à la fédération ({reviewer_name}) pour validation",
            metadata={"reviewer_id": reviewer.id if reviewer else None, "reviewer_name": reviewer_name},
        )
        if reviewer:
            _notification(
                reviewer,
                f"Nouveau projet à valider : {projet.titre}",
                f"Type: {projet.get_type_display()}\nCrée par: {projet.createur.full_name}\nSoumis le: {projet.created_at.strftime('%d/%m/%Y')}",
                f"communication:projects:review:{projet.id}",
            )
        _notification(
            projet.createur,
            "Projet soumis à la fédération pour validation",
            f"Votre projet « {projet.titre} » a été envoyé à la fédération car aucun ambassadeur n'est assigné à cet enfant.",
            f"communication:projects:response:{projet.id}",
        )


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
    projet.save(update_fields=['statut'])
    _creer_evenement(
        projet, 'projet_soumis', auteur=request.user,
        statut_avant=statut_avant, statut_apres=projet.statut,
        description=f"Projet soumis à validation par {request.user.full_name}",
    )

    _send_to_reviewer(projet, request)

    return Response(ProjetListSerializer(projet).data)


def _get_reviewable_statuses(user):
    if user.role == 'ambassador':
        return [STATUTS_PROJET['EN_ATTENTE_AMBASSADEUR']]
    elif user.role in ('federation', 'supermaster'):
        return [STATUTS_PROJET['EN_ATTENTE_FEDERATION'], STATUTS_PROJET['EN_ATTENTE_AMBASSADEUR']]
    return []


def _check_reviewer_permission(projet, user):
    """Vérifie que l'utilisateur est bien le reviewer assigné."""
    reviewable = _get_reviewable_statuses(user)
    if projet.statut not in reviewable:
        return False, f"Impossible de traiter un projet au statut {projet.statut}."
    if projet.assigned_reviewer and projet.assigned_reviewer != user:
        return False, "Vous n'êtes pas le validateur assigné à ce projet."
    return True, ""


@api_view(["POST"])
@permission_classes([IsAuthenticated, PeutRevoirProjet])
def project_valider(request, project_id):
    try:
        projet = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)

    ok, err = _check_reviewer_permission(projet, request.user)
    if not ok:
        return Response({"error": err}, status=status.HTTP_403_FORBIDDEN)

    statut_avant = projet.statut
    projet.statut = STATUTS_PROJET['APPROUVE']
    projet.ambassadeur_validateur = request.user
    projet.save()
    _creer_evenement(
        projet, 'projet_approuve', auteur=request.user,
        statut_avant=statut_avant, statut_apres=projet.statut,
        description=f"Projet approuvé par {request.user.full_name}",
    )

    _notification(
        projet.createur,
        f"Projet approuvé : {projet.titre}",
        f"Votre projet a été approuvé par {request.user.full_name}. Il sera publié dans Accueil.",
        f"communication:projects:response:{projet.id}",
    )

    return Response(ProjetListSerializer(projet).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, PeutRevoirProjet])
def project_publier(request, project_id):
    """Publie un projet approuvé dans l'Accueil."""
    try:
        projet = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if projet.statut != STATUTS_PROJET['APPROUVE']:
        return Response({"error": f"Impossible de publier un projet au statut {projet.statut}."}, status=status.HTTP_400_BAD_REQUEST)

    statut_avant = projet.statut
    projet.statut = STATUTS_PROJET['PUBLIE']
    projet.save()
    _creer_evenement(
        projet, 'projet_valide', auteur=request.user,
        statut_avant=statut_avant, statut_apres=projet.statut,
        description=f"Projet publié dans Accueil par {request.user.full_name}",
    )

    _notification(
        projet.createur,
        f"Projet publié : {projet.titre}",
        f"Votre projet « {projet.titre} » est maintenant visible dans l'Accueil Communication.",
        f"communication:projects:response:{projet.id}",
    )

    return Response(ProjetListSerializer(projet).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, PeutRevoirProjet])
def project_rejeter(request, project_id):
    serializer = ProjetRejeterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        projet = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)

    ok, err = _check_reviewer_permission(projet, request.user)
    if not ok:
        return Response({"error": err}, status=status.HTTP_403_FORBIDDEN)

    statut_avant = projet.statut
    projet.statut = STATUTS_PROJET['REJETE']
    projet.motif_rejet = serializer.validated_data["motif"]
    projet.save()
    _creer_evenement(
        projet, 'projet_rejete', auteur=request.user,
        statut_avant=statut_avant, statut_apres=projet.statut,
        description=f"Projet rejeté par {request.user.full_name}. Motif: {projet.motif_rejet}",
    )

    _notification(
        projet.createur,
        f"Projet rejeté : {projet.titre}",
        f"Votre projet « {projet.titre} » a été rejeté par {request.user.full_name}.\nMotif: {projet.motif_rejet}",
        f"communication:projects:response:{projet.id}",
    )

    return Response(ProjetListSerializer(projet).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, PeutRevoirProjet])
def project_demander_modification(request, project_id):
    serializer = ProjetDemanderModificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        projet = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)

    ok, err = _check_reviewer_permission(projet, request.user)
    if not ok:
        return Response({"error": err}, status=status.HTTP_403_FORBIDDEN)

    statut_avant = projet.statut
    projet.statut = STATUTS_PROJET['MODIFICATION_DEMANDEE']
    projet.commentaire_modification = serializer.validated_data["commentaire"]
    fichier = serializer.validated_data.get("fichier")
    if fichier:
        projet.amelioration_fichier = fichier
    projet.save()
    _creer_evenement(
        projet, 'modification_demandee', auteur=request.user,
        statut_avant=statut_avant, statut_apres=projet.statut,
        description=f"Modification demandée par {request.user.full_name}: {projet.commentaire_modification}",
        metadata={"fichier": bool(fichier)},
    )

    _notification(
        projet.createur,
        f"Modifications demandées : {projet.titre}",
        f"{request.user.full_name} a demandé des modifications sur votre projet « {projet.titre} ».\nCommentaire: {projet.commentaire_modification}"
        + ("\nUn fichier a été joint à la demande." if fichier else ""),
        f"communication:projects:response:{projet.id}",
    )

    return Response(ProjetListSerializer(projet, context={"request": request}).data)


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
    was_modification = projet.statut == STATUTS_PROJET['MODIFICATION_DEMANDEE']

    if was_modification:
        projet.commentaire_modification = ""

    projet.save()

    if was_modification:
        # Resubmit after modification: re-route to the same reviewer
        projet.statut = STATUTS_PROJET['SOUMIS_VALIDATION']
        projet.save(update_fields=['statut'])
        _creer_evenement(
            projet, 'projet_resoumis', auteur=request.user,
            statut_avant=statut_avant, statut_apres=projet.statut,
            description=f"Projet modifié et renvoyé pour validation par {request.user.full_name}",
        )
        _send_to_reviewer(projet, request)
        if projet.assigned_reviewer:
            _notification(
                projet.assigned_reviewer,
                f"Projet modifié - nouvelle validation : {projet.titre}",
                f"Le projet « {projet.titre} » a été modifié par {request.user.full_name} et necessite une nouvelle validation.",
                f"communication:projects:review:{projet.id}",
            )
    else:
        _creer_evenement(
            projet, 'projet_modifie', auteur=request.user,
            statut_avant=statut_avant, statut_apres=projet.statut,
            description=f"Projet modifié par {request.user.full_name}",
        )

    return Response(ProjetListSerializer(projet).data)


def _candidature_stakeholders(projet):
    """Moteur de routage : qui gère la candidature (le publisher) et qui en
    reçoit une copie lecture-seule, selon le type de projet et le rôle du
    créateur. Réutilise ChildAssignment / Child.orphanage / User.orphanage —
    aucune nouvelle relation de données."""
    from django.contrib.auth import get_user_model
    from children.models import ChildAssignment
    User = get_user_model()

    publisher = projet.createur
    readonly = []

    if projet.type == 'enfant' and projet.enfant:
        if publisher and publisher.role == 'director':
            readonly = list(User.objects.filter(
                role='ambassador',
                assigned_children__child=projet.enfant,
            ).distinct())
        elif publisher and publisher.role == 'ambassador' and projet.enfant.orphanage:
            readonly = list(User.objects.filter(
                role='director', orphanage=projet.enfant.orphanage,
            ).distinct())

    federation_users = list(User.objects.filter(role='federation', is_active=True))
    return publisher, readonly, federation_users


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
        publisher, readonly, federation_users = _candidature_stakeholders(projet)
        link = f"communication:projects:review:{projet.id}"
        if publisher:
            _notification(
                publisher,
                f"Nouvelle candidature de sponsorship — {projet.code}",
                f"{request.user.full_name} a postulé pour « {projet.titre} » ({candidature.montant_propose}€, {candidature.get_type_financement_display()}).",
                link,
            )
        for u in readonly:
            _notification(
                u,
                f"Candidature reçue (copie lecture seule) — {projet.code}",
                f"{request.user.full_name} a postulé pour « {projet.titre} ». Le publisher traite cette candidature.",
                link,
            )
        for u in federation_users:
            if u != publisher:
                _notification(
                    u,
                    f"Nouvelle candidature de sponsorship — {projet.code}",
                    f"{request.user.full_name} a postulé pour « {projet.titre} ».",
                    link,
                )
        return Response(CandidatureSerializer(candidature, context={"request": request}).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mes_candidatures(request):
    """Toutes les candidatures du partenaire connecté, tous projets confondus —
    alimente le Response Board (« mes candidatures et leur statut »)."""
    candidatures = CandidatureProjet.objects.filter(partenaire=request.user).select_related("projet", "projet__createur").order_by("-created_at")
    serializer = CandidatureSerializer(candidatures, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, PeutGererCandidatures])
def sponsorship_inbox(request):
    """Boîte de réception Sponsorship du publisher (director/ambassador/
    federation) : ses propres candidatures (actionnables) + les copies
    lecture-seule des candidatures dont il n'est pas le publisher."""
    from children.models import ChildAssignment
    user = request.user
    if user.role == 'director':
        qs = CandidatureProjet.objects.filter(
            models.Q(projet__createur=user) |
            models.Q(projet__type='enfant', projet__enfant__orphanage=user.orphanage),
        )
    elif user.role == 'ambassador':
        assigned_children = ChildAssignment.objects.filter(ambassador=user).values_list('child_id', flat=True)
        qs = CandidatureProjet.objects.filter(
            models.Q(projet__createur=user) |
            models.Q(projet__type='enfant', projet__enfant_id__in=assigned_children),
        )
    else:  # federation / supermaster — visibilité totale
        qs = CandidatureProjet.objects.all()

    candidatures = qs.select_related("projet", "projet__createur", "partenaire").distinct().order_by("-created_at")
    serializer = CandidatureSerializer(candidatures, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sponsorship_responses(request):
    """Historique des décisions (Response board de la Fédération) —
    visibilité organisation-wide sur tout le workflow de sponsorship."""
    if request.user.role not in ('federation', 'supermaster'):
        return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
    candidatures = CandidatureProjet.objects.exclude(statut='en_attente_reponse').select_related(
        "projet", "projet__createur", "partenaire", "repondu_par",
    ).order_by("-updated_at")
    serializer = CandidatureSerializer(candidatures, many=True, context={"request": request})
    return Response(serializer.data)


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
    serializer = CandidatureSerializer(candidatures, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, PeutGererCandidatures])
def project_candidature_repondre(request, project_id, candidature_id):
    try:
        projet = Project.objects.get(pk=project_id)
        candidature = CandidatureProjet.objects.get(pk=candidature_id, projet=projet)
    except (Project.DoesNotExist, CandidatureProjet.DoesNotExist):
        return Response({"error": "Projet ou candidature introuvable."}, status=status.HTTP_404_NOT_FOUND)

    # Seul le publisher du projet (quel que soit son rôle) peut traiter la
    # candidature — les autres parties prenantes n'ont qu'un accès lecture.
    if projet.createur != request.user:
        return Response({"error": "Seul le publisher de ce projet peut traiter cette candidature."}, status=status.HTTP_403_FORBIDDEN)

    if candidature.statut != 'en_attente_reponse':
        return Response({"error": "Cette candidature a déjà été traitée."}, status=status.HTTP_400_BAD_REQUEST)

    serializer = CandidatureRepondreSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    action = serializer.validated_data["action"]
    commentaire = serializer.validated_data.get("commentaire", "")

    from django.utils import timezone
    candidature.commentaire_reponse = commentaire
    candidature.repondu_par = request.user
    candidature.repondu_le = timezone.now()

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
        notif_title = f"Candidature approuvée — {projet.code}"
        notif_content = f"Votre candidature pour « {projet.titre} » a été approuvée."
    elif action == "refuser":
        candidature.statut = 'refusee'
        candidature.save()
        _creer_evenement(
            projet, 'candidature_refusee', auteur=request.user,
            description=f"Candidature refusée — {candidature.partenaire.full_name}",
            metadata={"candidature_id": candidature.id},
        )
        notif_title = f"Candidature rejetée — {projet.code}"
        notif_content = f"Votre candidature pour « {projet.titre} » a été rejetée."
    else:  # demander_amelioration
        candidature.statut = 'amelioration_demandee'
        candidature.save()
        _creer_evenement(
            projet, 'candidature_amelioration', auteur=request.user,
            description=f"Amélioration demandée — {candidature.partenaire.full_name} : {commentaire}",
            metadata={"candidature_id": candidature.id, "commentaire": commentaire},
        )
        notif_title = f"Amélioration demandée — {projet.code}"
        notif_content = f"Le publisher demande une amélioration de votre candidature pour « {projet.titre} » : {commentaire}"

    link = "communication:sponsorship:response-board"
    _notification(candidature.partenaire, notif_title, notif_content, link)
    from django.contrib.auth import get_user_model
    User = get_user_model()
    for u in User.objects.filter(role='federation', is_active=True):
        if u != request.user:
            _notification(u, notif_title, notif_content, link)

    return Response(CandidatureSerializer(candidature, context={"request": request}).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def candidature_resubmit(request, candidature_id):
    """Le partenaire modifie et resoumet une candidature dont on a demandé
    l'amélioration — le workflow repart chez le publisher."""
    try:
        candidature = CandidatureProjet.objects.get(pk=candidature_id)
    except CandidatureProjet.DoesNotExist:
        return Response({"error": "Candidature introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if candidature.partenaire != request.user:
        return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
    if candidature.statut != 'amelioration_demandee':
        return Response({"error": "Cette candidature n'est pas en attente d'amélioration."}, status=status.HTTP_400_BAD_REQUEST)

    for field in ("montant_propose", "modalite", "type_financement", "message"):
        if field in request.data:
            setattr(candidature, field, request.data[field])
    candidature.statut = 'en_attente_reponse'
    candidature.commentaire_reponse = ""
    candidature.repondu_par = None
    candidature.repondu_le = None
    candidature.save()

    projet = candidature.projet
    _creer_evenement(
        projet, 'candidature_resoumise', auteur=request.user,
        description=f"Candidature resoumise par {request.user.full_name}",
        metadata={"candidature_id": candidature.id},
    )
    publisher, readonly, federation_users = _candidature_stakeholders(projet)
    link = f"communication:projects:review:{projet.id}"
    if publisher:
        _notification(publisher, f"Candidature resoumise — {projet.code}", f"{request.user.full_name} a resoumis sa candidature pour « {projet.titre} ».", link)

    return Response(CandidatureSerializer(candidature, context={"request": request}).data)


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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def project_requests(request):
    """Liste des projets en attente de validation pour l'utilisateur connecté
    (ambassadeur ou fédération)."""
    user = request.user
    reviewable_statuses = _get_reviewable_statuses(user)
    if not reviewable_statuses:
        return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

    projets = Project.objects.filter(
        assigned_reviewer=user,
        statut__in=reviewable_statuses,
    ).order_by("-created_at")
    serializer = ProjetListSerializer(projets, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def project_responses(request):
    """Liste des projets nécessitant une action du chef d'orphelinat connecté
    (rejetés ou modification demandée)."""
    user = request.user
    if user.role != 'director':
        return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

    projets = Project.objects.filter(
        createur=user,
        statut__in=[STATUTS_PROJET['REJETE'], STATUTS_PROJET['MODIFICATION_DEMANDEE'], STATUTS_PROJET['APPROUVE'], STATUTS_PROJET['PUBLIE']],
    ).order_by("-created_at")
    serializer = ProjetListSerializer(projets, many=True, context={"request": request})
    return Response(serializer.data)
