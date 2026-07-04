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
