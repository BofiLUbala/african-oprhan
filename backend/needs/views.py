from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Need
from .serializers import NeedSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def need_list(request):
    if request.method == "GET":
        qs = Need.objects.all().order_by("-created_at")
        orphanage_id = request.query_params.get("orphanage_id")
        if orphanage_id:
            qs = qs.filter(orphanage_id=orphanage_id)
        serializer = NeedSerializer(qs, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = NeedSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
