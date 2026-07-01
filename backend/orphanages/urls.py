from django.urls import path

from . import views

urlpatterns = [
    path("orphanages/", views.orphanage_list, name="orphanage-list"),
    path("orphanages/<int:orphanage_id>/validate/", views.orphanage_validate, name="orphanage-validate"),
    path("document-types/", views.document_type_list, name="document-type-list"),
    path("document-types/<int:dt_id>/", views.document_type_detail, name="document-type-detail"),
    path("orphanages/<int:orphanage_id>/documents/", views.orphanage_document_list, name="orphanage-document-list"),
    path("orphanages/<int:orphanage_id>/documents/<int:doc_id>/review/", views.orphanage_document_review, name="orphanage-document-review"),
    path("orphanages/<int:orphanage_id>/documents/<int:doc_id>/", views.orphanage_document_detail, name="orphanage-document-detail"),
]
