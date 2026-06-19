from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Child
from .serializers import ChildSerializer


@api_view(["GET", "POST"])
def child_list(request):
    if request.method == "GET":
        enfants = Child.objects.filter(created_by=request.user).order_by("-created_at")
        serializer = ChildSerializer(enfants, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = ChildSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            enfant = serializer.save()
            return Response(ChildSerializer(enfant).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
