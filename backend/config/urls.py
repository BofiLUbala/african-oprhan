from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from config.throttles import LoginRateThrottle, TokenRefreshRateThrottle


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_classes = [TokenRefreshRateThrottle]


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/token/", ThrottledTokenObtainPairView.as_view(), name="token-obtain"),
    path("api/token/refresh/", ThrottledTokenRefreshView.as_view(), name="token-refresh"),
    path("api/", include("publications.urls")),
    path("api/", include("children.urls")),
    path("api/", include("projets.urls")),
    path("api/", include("orphanages.urls")),
    path("api/", include("needs.urls")),
    path("api/", include("finances.urls")),
    path("api/", include("sponsorships.urls")),
    path("api/", include("communications.urls")),
    path("api/", include("management.urls")),
    path("api/", include("opportunities.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
