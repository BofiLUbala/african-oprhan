from rest_framework.permissions import BasePermission

from children.models import ChildAssignment


class PeutCreerProjet(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('director', 'ambassador', 'federation')


class PeutSoumettreProjet(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'director'


class PeutValiderProjet(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ambassador'


class PeutRevoirProjet(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('ambassador', 'federation', 'supermaster')


class PeutSuspendreProjet(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'federation'


class PeutPostulerProjet(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'partner'


class PeutGererCandidatures(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('director', 'ambassador', 'federation')


def est_ambassadeur_orphelinat(ambassador, orphelinat):
    if not orphelinat or not ambassador:
        return False
    return ChildAssignment.objects.filter(
        child__orphanage=orphelinat,
        ambassador=ambassador,
    ).exists()


def get_reviewer_for_child(child):
    """Retourne l'ambassadeur assigné à l'enfant, ou le premier utilisateur
    federation si aucun ambassadeur n'est trouvé."""
    if not child:
        return None
    assignment = ChildAssignment.objects.filter(child=child).select_related('ambassador').first()
    if assignment and assignment.ambassador:
        return assignment.ambassador
    from django.contrib.auth import get_user_model
    User = get_user_model()
    fed_user = User.objects.filter(role='federation', is_active=True).first()
    return fed_user
