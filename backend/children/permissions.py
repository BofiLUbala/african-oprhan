from rest_framework.permissions import BasePermission

MATRICE_VISIBILITE = {
    'director': {
        'categories': {'SANTE': 'complet', 'SCOLARITE': 'complet', 'FAMILLE': 'complet',
                       'DOCUMENTS': 'complet', 'SOCIAL': 'complet', 'SYSTEME': 'complet'},
        'orphelinat': 'propre',
    },
    'staff': {
        'categories': {'SANTE': 'complet', 'SCOLARITE': 'complet', 'FAMILLE': 'complet',
                       'DOCUMENTS': 'complet', 'SOCIAL': 'complet', 'SYSTEME': 'complet'},
        'orphelinat': 'propre',
    },
    'ambassador': {
        'categories': {'SANTE': 'lecture', 'SCOLARITE': 'lecture', 'FAMILLE': 'limite',
                       'DOCUMENTS': 'lecture', 'SOCIAL': 'lecture', 'SYSTEME': 'lecture'},
        'orphelinat': 'assigne',
    },
    'federation': {
        'categories': {'SANTE': 'complet', 'SCOLARITE': 'complet', 'FAMILLE': 'complet',
                       'DOCUMENTS': 'complet', 'SOCIAL': 'complet', 'SYSTEME': 'complet'},
        'orphelinat': 'tous',
    },
    'supermaster': {
        'categories': {'SANTE': 'complet', 'SCOLARITE': 'complet', 'FAMILLE': 'complet',
                       'DOCUMENTS': 'complet', 'SOCIAL': 'complet', 'SYSTEME': 'complet'},
        'orphelinat': 'tous',
    },
    'auditor': {
        'categories': {'SANTE': 'lecture', 'SCOLARITE': 'lecture', 'FAMILLE': 'lecture',
                       'DOCUMENTS': 'lecture', 'SOCIAL': 'lecture', 'SYSTEME': 'lecture'},
        'orphelinat': 'tous',
    },
    'partner': {
        'categories': {'SANTE': 'non_visible', 'SCOLARITE': 'resume', 'FAMILLE': 'non_visible',
                       'DOCUMENTS': 'non_visible', 'SOCIAL': 'non_visible', 'SYSTEME': 'non_visible'},
        'orphelinat': 'aucun',
    },
    'sponsor': {
        'categories': {'SANTE': 'non_visible', 'SCOLARITE': 'resume', 'FAMILLE': 'non_visible',
                       'DOCUMENTS': 'non_visible', 'SOCIAL': 'non_visible', 'SYSTEME': 'non_visible'},
        'orphelinat': 'aucun',
    },
}

MAPPING_CATEGORIE = {
    'health': 'SANTE', 'education': 'SCOLARITE', 'family': 'FAMILLE',
    'documents': 'DOCUMENTS', 'social': 'SOCIAL',
    'general': 'SYSTEME', 'registration': 'SYSTEME', 'identity': 'SYSTEME',
    'status': 'SYSTEME', 'protection': 'SOCIAL', 'alert': 'SYSTEME',
    'system': 'SYSTEME', 'follow_up': 'SYSTEME',
}

ROLES_VALIDATION = {'federation', 'supermaster'}
ROLES_VOIR_CONFIDENTIEL = {'federation', 'supermaster', 'director', 'auditor'}
ROLES_VOIR_CONSULTATIONS = {'federation', 'supermaster', 'auditor'}


def filtrer_historique_par_role(queryset, user, enfant_id=None):
    role = user.role
    matrice = MATRICE_VISIBILITE.get(role, {})

    categories_visibles = []
    for cat_db, cat_metier in MAPPING_CATEGORIE.items():
        niveau = matrice.get('categories', {}).get(cat_metier, 'non_visible')
        if niveau != 'non_visible':
            categories_visibles.append(cat_db)
        elif niveau == 'resume':
            categories_visibles.append(cat_db)

    if categories_visibles:
        queryset = queryset.filter(category__in=categories_visibles)

    if role == 'partner':
        queryset = queryset.filter(
            niveau_sensibilite='PUBLIC',
            statut_validation='AUTO_VALIDE',
        )

    if role in ROLES_VOIR_CONFIDENTIEL:
        pass
    else:
        queryset = queryset.exclude(niveau_sensibilite='CONFIDENTIEL')
        if role != 'federation':
            queryset = queryset.exclude(niveau_sensibilite='RESTREINT')

    if role == 'director':
        queryset = queryset.filter(child__orphanage__director=user)
    elif role == 'staff':
        queryset = queryset.filter(child__orphanage_id=user.orphanage_id)
    elif role == 'ambassador':
        queryset = queryset.filter(
            child__assignments__ambassador=user,
        )

    return queryset


class PeutVoirHistorique(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated


class PeutCreerHistoriqueManuel(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('director', 'staff')


class PeutValiderHistorique(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ROLES_VALIDATION


class PeutVoirConfidentiel(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ROLES_VOIR_CONFIDENTIEL


class PeutVoirConsultations(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ROLES_VOIR_CONSULTATIONS
