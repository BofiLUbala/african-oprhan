from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def notification_list(request):
    if request.method == "GET":
        qs = Notification.objects.filter(user=request.user)
        return Response(NotificationSerializer(qs, many=True).data)

    mark_read = request.data.get("mark_read", False)
    if mark_read:
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "ok"})

    nid = request.data.get("id")
    if nid:
        try:
            n = Notification.objects.get(pk=nid, user=request.user)
            n.is_read = True
            n.save(update_fields=["is_read"])
            return Response(NotificationSerializer(n).data)
        except Notification.DoesNotExist:
            return Response({"error": "Notification introuvable."}, status=status.HTTP_404_NOT_FOUND)

    return Response({"error": "Aucune action spécifiée."}, status=status.HTTP_400_BAD_REQUEST)
