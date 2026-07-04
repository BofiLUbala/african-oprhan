CATEGORIES = {
    'SANTE': 'Santé',
    'SCOLARITE': 'Scolarité',
    'FAMILLE': 'Famille',
    'DOCUMENTS': 'Documents',
    'SOCIAL': 'Social',
    'SYSTEME': 'Système',
}

PRIORITES = {
    'INFO': 'Info',
    'IMPORTANT': 'Important',
    'CRITIQUE': 'Critique',
}

NIVEAUX_SENSIBILITE = {
    'PUBLIC': 'Public',
    'RESTREINT': 'Restreint',
    'CONFIDENTIEL': 'Confidentiel',
}

STATUTS_VALIDATION = {
    'AUTO_VALIDE': 'Auto-validé',
    'EN_ATTENTE': 'En attente',
    'VALIDE': 'Validé',
    'REJETE': 'Rejeté',
}

CLASSIFICATION_EVENEMENTS = {
    'created': {'categorie': 'SYSTEME', 'priorite': 'INFO', 'module': 'registration'},
    'updated': {'categorie': 'SYSTEME', 'priorite': 'INFO', 'module': 'child_profile'},
    'update_added': {'categorie': 'SYSTEME', 'priorite': 'INFO', 'module': 'update_center'},
    'document_added': {'categorie': 'DOCUMENTS', 'priorite': 'INFO', 'module': 'documents'},
    'document_verified': {'categorie': 'DOCUMENTS', 'priorite': 'IMPORTANT', 'module': 'documents'},
    'document_replaced': {'categorie': 'DOCUMENTS', 'priorite': 'INFO', 'module': 'documents'},
    'document_expired': {'categorie': 'DOCUMENTS', 'priorite': 'IMPORTANT', 'module': 'documents'},
    'health_update': {'categorie': 'SANTE', 'priorite': 'IMPORTANT', 'module': 'health'},
    'vaccination_added': {'categorie': 'SANTE', 'priorite': 'IMPORTANT', 'module': 'health'},
    'illness_added': {'categorie': 'SANTE', 'priorite': 'IMPORTANT', 'module': 'health'},
    'treatment_started': {'categorie': 'SANTE', 'priorite': 'IMPORTANT', 'module': 'health'},
    'treatment_ended': {'categorie': 'SANTE', 'priorite': 'INFO', 'module': 'health'},
    'consultation_added': {'categorie': 'SANTE', 'priorite': 'INFO', 'module': 'health'},
    'hospitalization_added': {'categorie': 'SANTE', 'priorite': 'CRITIQUE', 'module': 'health'},
    'allergy_added': {'categorie': 'SANTE', 'priorite': 'IMPORTANT', 'module': 'health'},
    'education_update': {'categorie': 'SCOLARITE', 'priorite': 'INFO', 'module': 'education'},
    'school_enrolled': {'categorie': 'SCOLARITE', 'priorite': 'IMPORTANT', 'module': 'education'},
    'school_changed': {'categorie': 'SCOLARITE', 'priorite': 'IMPORTANT', 'module': 'education'},
    'grade_added': {'categorie': 'SCOLARITE', 'priorite': 'INFO', 'module': 'education'},
    'exam_result_added': {'categorie': 'SCOLARITE', 'priorite': 'INFO', 'module': 'education'},
    'family_update': {'categorie': 'FAMILLE', 'priorite': 'IMPORTANT', 'module': 'family'},
    'guardian_assigned': {'categorie': 'FAMILLE', 'priorite': 'CRITIQUE', 'module': 'family'},
    'parent_identified': {'categorie': 'FAMILLE', 'priorite': 'CRITIQUE', 'module': 'family'},
    'family_reunified': {'categorie': 'FAMILLE', 'priorite': 'CRITIQUE', 'module': 'family'},
    'foster_placement': {'categorie': 'FAMILLE', 'priorite': 'CRITIQUE', 'module': 'family'},
    'adoption_progress': {'categorie': 'FAMILLE', 'priorite': 'CRITIQUE', 'module': 'family'},
    'social_update': {'categorie': 'SOCIAL', 'priorite': 'INFO', 'module': 'social'},
    'social_note_added': {'categorie': 'SOCIAL', 'priorite': 'INFO', 'module': 'social'},
    'home_visit': {'categorie': 'SOCIAL', 'priorite': 'INFO', 'module': 'social'},
    'counseling_session': {'categorie': 'SOCIAL', 'priorite': 'INFO', 'module': 'social'},
    'incident_reported': {'categorie': 'SOCIAL', 'priorite': 'CRITIQUE', 'module': 'social'},
    'protection_concern': {'categorie': 'SOCIAL', 'priorite': 'CRITIQUE', 'module': 'social'},
    'status_change': {'categorie': 'SYSTEME', 'priorite': 'IMPORTANT', 'module': 'status'},
    'alert_triggered': {'categorie': 'SYSTEME', 'priorite': 'CRITIQUE', 'module': 'alert'},
    'note_added': {'categorie': 'SYSTEME', 'priorite': 'INFO', 'module': 'follow_up'},
    'case_note': {'categorie': 'SYSTEME', 'priorite': 'INFO', 'module': 'follow_up'},
    'file_downloaded': {'categorie': 'SYSTEME', 'priorite': 'INFO', 'module': 'system'},
    'record_approved': {'categorie': 'SYSTEME', 'priorite': 'IMPORTANT', 'module': 'system'},
    'record_rejected': {'categorie': 'SYSTEME', 'priorite': 'IMPORTANT', 'module': 'system'},
    'notification_sent': {'categorie': 'SYSTEME', 'priorite': 'INFO', 'module': 'system'},
    'child_archived': {'categorie': 'SYSTEME', 'priorite': 'IMPORTANT', 'module': 'system'},
    'child_restored': {'categorie': 'SYSTEME', 'priorite': 'IMPORTANT', 'module': 'system'},
    'follow_up': {'categorie': 'SYSTEME', 'priorite': 'INFO', 'module': 'follow_up'},
    'observation_added': {'categorie': 'SOCIAL', 'priorite': 'INFO', 'module': 'social'},
    'transfer_initiated': {'categorie': 'SYSTEME', 'priorite': 'CRITIQUE', 'module': 'system'},
    'exit_registered': {'categorie': 'SYSTEME', 'priorite': 'CRITIQUE', 'module': 'system'},
}

STATUTS_STATIQUES = {'active', 'healthy', 'enrolled'}
STATUTS_CRITIQUES = {'hospitalized', 'missing', 'deceased'}
STATUTS_HAUTE_PRIORITE = {'at_risk', 'sick', 'transferred'}

EVENEMENTS_VALIDATION_REQUISE = {
    'guardian_assigned', 'parent_identified', 'family_reunified',
    'foster_placement', 'adoption_progress', 'incident_reported',
    'protection_concern', 'transfer_initiated', 'exit_registered',
}
