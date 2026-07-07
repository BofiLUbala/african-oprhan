from django.urls import path
from . import views

urlpatterns = [
    path("signup/", views.signup, name="signup"),
    path("verify-email/", views.verify_email, name="verify-email"),
    path("me/", views.me, name="me"),
    path("me/avatar/", views.update_avatar, name="update-avatar"),
    path("users/", views.user_list, name="user-list"),
    path("stats/", views.dashboard_stats, name="dashboard-stats"),
    path("executive/", views.executive_stats, name="executive-stats"),
]
