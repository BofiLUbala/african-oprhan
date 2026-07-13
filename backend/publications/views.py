from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Q

from .models import (
    Post, PostLike, PostDislike, PostView, Comment, CommentAttachment,
    PostShare, Story, StoryView, _comment_attachment_kind,
)
from .serializers import (
    PostListSerializer,
    PostDetailSerializer,
    PostCreateSerializer,
    CommentSerializer,
    StorySerializer,
    _avatar_of,
)

MAX_UPLOAD_BYTES = 25 * 1024 * 1024


def _is_moderator(user):
    return getattr(user, "role", "") in ("supermaster", "admin", "federation")


def visible_post_filter(user):
    if not user.is_authenticated:
        return Q(audience="public")

    role = getattr(user, "role", "")
    if role == "supermaster":
        return Q()  # Super Master voit toutes les publications, sans filtre
    return Q(audience="public") | Q(audience=role)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def post_list(request):
    # Lecture publique (visiteurs non connectés : posts « public » approuvés
    # uniquement, via visible_post_filter). Écriture réservée aux connectés.
    if request.method == "POST" and not request.user.is_authenticated:
        return Response({"detail": "Authentification requise."}, status=status.HTTP_401_UNAUTHORIZED)
    if request.method == "GET":
        # A Chef d'Orphelinat (or any author) can review the status of their
        # own submissions — including pending / rejected / needs_changes.
        if request.query_params.get("mine") and request.user.is_authenticated:
            posts = Post.objects.filter(author=request.user).prefetch_related(
                "media", "likes", "comments", "views"
            )
        else:
            posts = Post.objects.filter(status="approved").filter(
                visible_post_filter(request.user)
            ).prefetch_related(
                "media", "likes", "comments", "views"
            )
        # Pagination optionnelle (rétro-compatible : sans paramètre -> tout)
        try:
            limit = int(request.query_params.get("limit", 0))
            offset = int(request.query_params.get("offset", 0))
        except (ValueError, TypeError):
            limit, offset = 0, 0
        if limit > 0:
            posts = posts[offset:offset + limit]
        serializer = PostListSerializer(posts, many=True, context={"request": request})
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = PostCreateSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            post = serializer.save()
            detail = PostDetailSerializer(post, context={"request": request})
            return Response(detail.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "DELETE"])
def post_detail(request, post_id):
    try:
        post = Post.objects.prefetch_related(
            "media", "likes", "comments__author", "views__user"
        ).filter(visible_post_filter(request.user)).get(pk=post_id)
    except Post.DoesNotExist:
        return Response(
            {"error": "Publication introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        PostView.objects.get_or_create(post=post, user=request.user)
        serializer = PostDetailSerializer(post, context={"request": request})
        return Response(serializer.data)

    elif request.method == "DELETE":
        if post.author != request.user:
            return Response(
                {"error": "Vous ne pouvez supprimer que vos propres publications."},
                status=status.HTTP_403_FORBIDDEN,
            )
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def toggle_like(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response(
            {"error": "Publication introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    like, created = PostLike.objects.get_or_create(post=post, user=request.user)
    if not created:
        like.delete()
        return Response({"liked": False, "likes_count": post.likes.count()})
    return Response({"liked": True, "likes_count": post.likes.count()})


@api_view(["POST"])
def toggle_dislike(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response(
            {"error": "Publication introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    dislike, created = PostDislike.objects.get_or_create(post=post, user=request.user)
    if not created:
        dislike.delete()
        return Response({"disliked": False, "dislikes_count": post.dislikes.count()})
    return Response({"disliked": True, "dislikes_count": post.dislikes.count()})


@api_view(["GET", "POST"])
def comment_list(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response(
            {"error": "Publication introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        comments = post.comments.select_related("author").prefetch_related("attachments").all()
        serializer = CommentSerializer(comments, many=True, context={"request": request})
        return Response(serializer.data)

    elif request.method == "POST":
        content = (request.data.get("content") or "").strip()
        files = request.FILES.getlist("files")
        for f in files:
            if f.size > MAX_UPLOAD_BYTES:
                return Response({"error": f"« {f.name} » dépasse la taille maximale de 25 Mo."},
                                status=status.HTTP_400_BAD_REQUEST)
        if not content and not files:
            return Response({"error": "Un commentaire ou une pièce jointe est requis."},
                            status=status.HTTP_400_BAD_REQUEST)
        comment = Comment.objects.create(post=post, author=request.user, content=content)
        for f in files:
            CommentAttachment.objects.create(
                comment=comment, file=f, original_name=f.name[:255], size=f.size,
                mime=getattr(f, "content_type", "") or "",
                kind=_comment_attachment_kind(f.name, getattr(f, "content_type", "")),
            )
        return Response(CommentSerializer(comment, context={"request": request}).data,
                        status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
def comment_detail(request, post_id, comment_id):
    try:
        comment = Comment.objects.get(pk=comment_id, post_id=post_id)
    except Comment.DoesNotExist:
        return Response({"error": "Commentaire introuvable."}, status=status.HTTP_404_NOT_FOUND)

    is_owner = comment.author == request.user
    if request.method == "PATCH":
        if not is_owner:
            return Response({"error": "Vous ne pouvez modifier que vos propres commentaires."},
                            status=status.HTTP_403_FORBIDDEN)
        content = (request.data.get("content") or "").strip()
        if not content:
            return Response({"error": "Le contenu ne peut pas être vide."}, status=status.HTTP_400_BAD_REQUEST)
        comment.content = content
        comment.edited = True
        comment.save(update_fields=["content", "edited", "updated_at"])
        return Response(CommentSerializer(comment, context={"request": request}).data)

    # DELETE — owner OR moderator (elevated permission)
    if not is_owner and not _is_moderator(request.user):
        return Response({"error": "Vous ne pouvez supprimer que vos propres commentaires."},
                        status=status.HTTP_403_FORBIDDEN)
    comment.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# rétro-compat : l'ancien nom de vue reste appelable
delete_comment = comment_detail


@api_view(["GET"])
def post_likes(request, post_id):
    """Liste des utilisateurs ayant aimé la publication (qui a aimé)."""
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Publication introuvable."}, status=status.HTTP_404_NOT_FOUND)
    people = [
        {"id": l.user.pk, "name": l.user.full_name,
         "role": getattr(l.user, "role", ""), "avatar": _avatar_of(l.user)}
        for l in post.likes.select_related("user").all()
    ]
    return Response({"count": len(people), "users": people})


@api_view(["POST"])
def share_post(request, post_id):
    """Enregistre un partage (analytics) : méthode + destination. Idempotent
    par (utilisateur, méthode, destination) pour éviter le gonflage du compteur."""
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Publication introuvable."}, status=status.HTTP_404_NOT_FOUND)

    valid_methods = dict(PostShare.METHOD_CHOICES)
    method = request.data.get("method", "copy")
    if method not in valid_methods:
        method = "copy"
    destination = (request.data.get("destination") or "")[:120]
    PostShare.objects.get_or_create(
        post=post, user=request.user, method=method, destination=destination
    )
    return Response({"shared": True, "shares_count": post.shares.count()})


@api_view(["GET"])
def post_shares(request, post_id):
    """Liste des utilisateurs ayant partagé (analytics, sous réserve de droits)."""
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Publication introuvable."}, status=status.HTTP_404_NOT_FOUND)
    # confidentialité : l'auteur et les modérateurs voient la liste détaillée
    if post.author_id != request.user.pk and not _is_moderator(request.user):
        return Response({"count": post.shares.count(), "users": []})
    people = [
        {"id": s.user.pk, "name": s.user.full_name, "method": s.method,
         "destination": s.destination, "avatar": _avatar_of(s.user)}
        for s in post.shares.select_related("user").all()
    ]
    return Response({"count": len(people), "users": people})


@api_view(["GET", "POST"])
def story_list(request):
    if request.method == "GET":
        stories = Story.objects.select_related("author").all()
        serializer = StorySerializer(stories, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = StorySerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            story = serializer.save()
            return Response(
                StorySerializer(story).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def story_detail(request, story_id):
    try:
        story = Story.objects.select_related("author").prefetch_related(
            "story_views__user"
        ).get(pk=story_id)
    except Story.DoesNotExist:
        return Response(
            {"error": "Histoire introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    StoryView.objects.get_or_create(story=story, user=request.user)
    serializer = StorySerializer(story, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
def pending_posts(request):
    role = getattr(request.user, 'role', '')
    if role not in ['ambassador', 'admin', 'federation', 'supermaster']:
        return Response({"error": "Accès refusé. Réservé aux ambassadeurs."}, status=status.HTTP_403_FORBIDDEN)

    posts = Post.objects.filter(status="pending")
    # An ambassador only reviews posts routed to them (their assigned children).
    if role == 'ambassador':
        posts = posts.filter(review_ambassador=request.user)
    posts = posts.prefetch_related("media", "likes", "comments", "views")
    serializer = PostListSerializer(posts, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["POST"])
def review_post(request, post_id):
    role = getattr(request.user, 'role', '')
    if role not in ['ambassador', 'admin', 'federation', 'supermaster']:
        return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

    try:
        post = Post.objects.get(pk=post_id, status__in=["pending", "needs_changes"])
    except Post.DoesNotExist:
        return Response({"error": "Publication en attente introuvable."}, status=status.HTTP_404_NOT_FOUND)

    # An ambassador may only review posts routed to them.
    if role == 'ambassador' and post.review_ambassador_id and post.review_ambassador_id != request.user.pk:
        return Response({"error": "Cette publication est assignée à un autre ambassadeur."}, status=status.HTTP_403_FORBIDDEN)

    new_status = request.data.get("status")
    reason = request.data.get("reason", "")

    # approved -> published publicly | rejected -> back to author | needs_changes -> back with comments
    if new_status not in ["approved", "rejected", "needs_changes"]:
        return Response({"error": "Statut invalide."}, status=status.HTTP_400_BAD_REQUEST)

    if new_status in ("rejected", "needs_changes") and not reason.strip():
        return Response({"error": "Un motif est requis pour un rejet ou une demande de modification."}, status=status.HTTP_400_BAD_REQUEST)

    post.status = new_status
    post.rejection_reason = reason if new_status in ("rejected", "needs_changes") else ""
    post.save()
    labels = {"approved": "approuvée", "rejected": "refusée", "needs_changes": "renvoyée pour modification"}
    return Response({"message": f"Publication {labels[new_status]} avec succès.", "status": new_status})
