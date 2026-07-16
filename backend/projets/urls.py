from django.urls import path
from . import views

urlpatterns = [
    path("projets/public/", views.project_public_list, name="project-public-list"),
    path("projets/", views.project_list, name="project-list"),
    path("projets/<int:project_id>/", views.project_detail, name="project-detail"),
    path("projets/<int:project_id>/soumettre/", views.project_soumettre, name="project-soumettre"),
    path("projets/<int:project_id>/valider/", views.project_valider, name="project-valider"),
    path("projets/<int:project_id>/publier/", views.project_publier, name="project-publier"),
    path("projets/<int:project_id>/rejeter/", views.project_rejeter, name="project-rejeter"),
    path("projets/<int:project_id>/demander-modification/", views.project_demander_modification, name="project-demander-modification"),
    path("projets/<int:project_id>/suspendre/", views.project_suspendre, name="project-suspendre"),
    path("projets/<int:project_id>/modifier/", views.project_modifier, name="project-modifier"),
    path("projets/mes-candidatures/", views.mes_candidatures, name="mes-candidatures"),
    path("projets/candidatures/inbox/", views.sponsorship_inbox, name="sponsorship-inbox"),
    path("projets/candidatures/responses/", views.sponsorship_responses, name="sponsorship-responses"),
    path("projets/candidatures/<int:candidature_id>/", views.candidature_resubmit, name="candidature-resubmit"),
    path("projets/<int:project_id>/candidatures/", views.project_candidature_list, name="project-candidature-list"),
    path("projets/<int:project_id>/candidature/", views.project_candidature_create, name="project-candidature-create"),
    path("projets/<int:project_id>/candidatures/<int:candidature_id>/repondre/", views.project_candidature_repondre, name="project-candidature-repondre"),
    path("projets/<int:project_id>/history/", views.project_history, name="project-history"),
    path("projets/<int:project_id>/follow/", views.project_follow, name="project-follow"),
    path("projets/requests/", views.project_requests, name="project-requests"),
    path("projets/responses/", views.project_responses, name="project-responses"),
]
