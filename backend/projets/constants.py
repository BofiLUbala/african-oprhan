STATUTS_PROJET = {
    'BROUILLON': 'brouillon',
    'SOUMIS_VALIDATION': 'soumis_validation',
    'EN_ATTENTE_AMBASSADEUR': 'en_attente_ambassadeur',
    'EN_ATTENTE_FEDERATION': 'en_attente_federation',
    'MODIFICATION_DEMANDEE': 'modification_demandee',
    'REJETE': 'rejete',
    'APPROUVE': 'approuve',
    'PUBLIE': 'publie',
    'EN_FINANCEMENT': 'en_financement',
    'FINANCE': 'finance',
    'CLOTURE': 'cloture',
    'SUSPENDU': 'suspendu',
}

STATUTS_CHOICES = [(v, k.replace('_', ' ').title()) for k, v in STATUTS_PROJET.items()]

TYPES_PROJET = {
    'ENFANT': 'enfant',
    'ORPHELINAT': 'orphelinat',
    'FEDERATION': 'federation',
}

TYPES_PROJET_CHOICES = [(v, f"Pour un {v}" if v != 'federation' else "Pour la fédération") for v in TYPES_PROJET.values()]

ROLES_CREATEUR = {
    'DIRECTEUR': 'directeur',
    'AMBASSADEUR': 'ambassadeur',
    'FEDERATION': 'federation',
}

ROLES_CREATEUR_CHOICES = [(v, k.title()) for k, v in ROLES_CREATEUR.items()]

ROLE_MAP = {
    'director': 'directeur',
    'ambassador': 'ambassadeur',
    'federation': 'federation',
}

STATUTS_CANDIDATURE = {
    'EN_ATTENTE': 'en_attente_reponse',
    'ACCEPTEE': 'acceptee',
    'REFUSEE': 'refusee',
}

STATUTS_CANDIDATURE_CHOICES = [(v, k.replace('_', ' ').title()) for k, v in STATUTS_CANDIDATURE.items()]

MODALITES_FINANCEMENT = {
    'UNIQUE': 'unique',
    'ECHELONNE': 'echelonne',
}

MODALITES_CHOICES = [(v, k.title()) for k, v in MODALITES_FINANCEMENT.items()]

TYPES_EVENEMENTS_PROJET = {
    'PROJET_CREE': 'projet_cree',
    'PROJET_SOUMIS': 'projet_soumis',
    'PROJET_ATTRIBUE_AMBASSADEUR': 'projet_attribue_ambassadeur',
    'PROJET_ATTRIBUE_FEDERATION': 'projet_attribue_federation',
    'PROJET_VALIDE': 'projet_valide',
    'PROJET_APPROUVE': 'projet_approuve',
    'PROJET_REJETE': 'projet_rejete',
    'MODIFICATION_DEMANDEE': 'modification_demandee',
    'PROJET_MODIFIE': 'projet_modifie',
    'PROJET_RESOUMIS': 'projet_resoumis',
    'PROJET_SUSPENDU': 'projet_suspendu',
    'PROJET_REACTIVE': 'projet_reactive',
    'CANDIDATURE_SOUMISE': 'candidature_soumise',
    'CANDIDATURE_ACCEPTEE': 'candidature_acceptee',
    'CANDIDATURE_REFUSEE': 'candidature_refusee',
    'PROJET_FINANCE': 'projet_finance',
    'PROJET_CLOTURE': 'projet_cloture',
}

TYPES_EVENEMENTS_CHOICES = [(v, k.replace('_', ' ').title()) for k, v in TYPES_EVENEMENTS_PROJET.items()]

TRANSITIONS_AUTORISEES = {
    'brouillon': ['soumis_validation', 'modification_demandee'],
    'soumis_validation': ['en_attente_ambassadeur', 'en_attente_federation'],
    'en_attente_ambassadeur': ['approuve', 'rejete', 'modification_demandee'],
    'en_attente_federation': ['approuve', 'rejete', 'modification_demandee'],
    'modification_demandee': ['soumis_validation', 'brouillon'],
    'rejete': ['brouillon'],
    'approuve': ['publie'],
    'publie': ['en_financement', 'suspendu', 'cloture'],
    'en_financement': ['finance', 'suspendu', 'cloture'],
    'finance': ['cloture', 'suspendu'],
    'cloture': [],
    'suspendu': ['publie', 'en_financement', 'cloture'],
}

STATUTS_PARTENAIRE_VISIBLE = {'publie', 'en_financement', 'finance', 'cloture'}
