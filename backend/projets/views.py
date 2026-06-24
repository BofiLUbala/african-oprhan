from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Project, ProjectApplication
from .serializers import (
    ProjectListSerializer,
    ProjectCreateSerializer,
    ProjectApplicationSerializer,
)


@api_view(["GET", "POST"])
def project_list(request):
    if request.method == "GET":
        projects = Project.objects.all().order_by("-created_at")
        serializer = ProjectListSerializer(projects, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = ProjectCreateSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            project = serializer.save()
            detail = ProjectListSerializer(project)
            return Response(detail.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def project_apply(request, project_id):
    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response(
            {"error": "Projet introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if project.status != "open":
        return Response(
            {"error": "Ce projet n'accepte plus de candidatures."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check for duplicate application
    if ProjectApplication.objects.filter(
        project=project, applicant=request.user
    ).exists():
        return Response(
            {"error": "Vous avez déjà postulé à ce projet."},
            status=status.HTTP_409_CONFLICT,
        )

    serializer = ProjectApplicationSerializer(
        data=request.data, context={"request": request}
    )
    if serializer.is_valid():
        serializer.save(project=project, applicant=request.user)
        return Response(
            {"message": "Candidature envoyée avec succès !"},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
