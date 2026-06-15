from datetime import timedelta
from django.utils import timezone
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
import uuid


def generate_verification_token():
    return uuid.uuid4()


def is_token_valid(user):
    if not user.verification_sent_at:
        return False
    expiry = user.verification_sent_at + timedelta(hours=2)
    return timezone.now() <= expiry


def send_activation_email(user, request):
    token = generate_verification_token()
    user.email_verification_token = token
    user.verification_sent_at = timezone.now()
    user.save(update_fields=["email_verification_token", "verification_sent_at"])

    activation_url = f"{settings.FRONTEND_URL}/auth/verify-email?token={token}&uid={user.pk}"

    role_labels = dict(user._meta.get_field("role").choices)
    country_labels = dict(user._meta.get_field("country").choices)

    context = {
        "user": user,
        "activation_url": activation_url,
        "role_label": role_labels.get(user.role, user.role),
        "country_label": country_labels.get(user.country, user.country),
        "expiry_hours": 2,
    }

    subject = "Activez votre compte – Confédération des Orphelinats"
    html_body = render_to_string("accounts/activation_email.html", context)
    text_body = (
        f"Bonjour {user.first_name},\n\n"
        f"Merci de vous être inscrit en tant que {role_labels.get(user.role, user.role)} "
        f"pour {country_labels.get(user.country, user.country)}.\n\n"
        f"Veuillez activer votre compte en cliquant sur le lien ci-dessous :\n"
        f"{activation_url}\n\n"
        f"Ce lien est valable 2 heures et ne peut être utilisé qu'une seule fois.\n\n"
        f"L'équipe Confédération des Orphelinats"
    )

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    msg.attach_alternative(html_body, "text/html")
    msg.send()
