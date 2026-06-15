import threading
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers import SignupSerializer
from .utils import send_activation_email, is_token_valid

User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()

    try:
        t = threading.Thread(target=send_activation_email, args=(user, request), daemon=True)
        t.start()
    except Exception:
        pass

    return Response(
        {
            "message": (
                "Inscription réussie. Un email d'activation vous a été envoyé. "
                "Veuillez vérifier votre boîte de réception."
            )
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_email(request):
    token = request.data.get("token")
    uid = request.data.get("uid")

    if not token or not uid:
        return Response(
            {"error": "Token et identifiant utilisateur requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(pk=uid, email_verification_token=token)
    except User.DoesNotExist:
        return Response(
            {"error": "Lien d'activation invalide ou déjà utilisé."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if user.is_active:
        return Response(
            {"message": "Ce compte est déjà activé."},
            status=status.HTTP_200_OK,
        )

    if not is_token_valid(user):
        return Response(
            {"error": "Le lien d'activation a expiré (valable 2 heures). Veuillez vous réinscrire."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.is_active = True
    user.email_verified_at = timezone.now()
    user.email_verification_token = None
    user.verification_sent_at = None
    user.save(update_fields=["is_active", "email_verified_at", "email_verification_token", "verification_sent_at"])

    return Response(
        {"message": "Votre compte a été activé avec succès !"},
        status=status.HTTP_200_OK,
    )
