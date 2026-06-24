from django.urls import path
from . import views

urlpatterns = [
    # Child CRUD
    path("enfants/", views.child_list, name="child-list"),
    path("enfants/<int:child_id>/", views.child_detail, name="child-detail"),
    # Child Updates
    path("enfants/<int:child_id>/updates/", views.child_update_list, name="child-update-list"),
    # Child History
    path("enfants/<int:child_id>/history/", views.child_history_list, name="child-history-list"),
    path("enfants/<int:child_id>/history/create/", views.child_history_create, name="child-history-create"),
    path("enfants/<int:child_id>/history/stats/", views.child_history_stats, name="child-history-stats"),
    path("enfants/<int:child_id>/history/calendar/", views.child_calendar_events, name="child-history-calendar"),
    # Bulk / Cross-child
    path("history/bulk/", views.child_bulk_history, name="child-history-bulk"),
    path("history/all/", views.all_children_history, name="all-children-history"),
]
