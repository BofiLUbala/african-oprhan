import string
import random

from django.db import IntegrityError
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Child
from .serializers import ChildSerializer


def _gen_uid():
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=12))


@api_view(["GET", "POST"])
def child_list(request):
    if request.method == "GET":
        enfants = Child.objects.filter(created_by=request.user).order_by("-created_at")
        serializer = ChildSerializer(enfants, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        uid = request.data.get("uid", "")
        if not uid or len(uid) < 8:
            uid = _gen_uid()
        for _ in range(10):
            if not Child.objects.filter(uid=uid).exists():
                break
            uid = _gen_uid()
        for attempt in range(10):
            data = {**request.data, "uid": uid}
            serializer = ChildSerializer(data=data, context={"request": request})
            if serializer.is_valid():
                try:
                    enfant = serializer.save()
                    return Response(ChildSerializer(enfant).data, status=status.HTTP_201_CREATED)
                except IntegrityError:
                    uid = _gen_uid()
                    continue
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response({"error": "Impossible de générer un UID unique"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response({"error": "Méthode non autorisée"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(["GET", "PUT", "DELETE"])
def child_detail(request, child_id):
    try:
        enfant = Child.objects.get(pk=child_id, created_by=request.user)
    except Child.DoesNotExist:
        return Response(
            {"error": "Enfant introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        serializer = ChildSerializer(enfant)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = ChildSerializer(enfant, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            enfant = serializer.save()
            return Response(ChildSerializer(enfant).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        enfant.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
