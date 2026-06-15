from django.urls import path
from . import views

urlpatterns = [
    path("signup/", views.signup, name="signup"),
    path("verify-email/", views.verify_email, name="verify-email"),
    path("me/", views.me, name="me"),
]
