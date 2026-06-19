from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Post, PostLike, PostView, Comment, Story, StoryView
from .serializers import (
    PostListSerializer,
    PostDetailSerializer,
    PostCreateSerializer,
    CommentSerializer,
    StorySerializer,
)


@api_view(["GET", "POST"])
def post_list(request):
    if request.method == "GET":
        posts = Post.objects.all().prefetch_related(
            "media", "likes", "comments", "views"
        )
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
        ).get(pk=post_id)
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
        comments = post.comments.select_related("author").all()
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = CommentSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save(post=post)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
def delete_comment(request, post_id, comment_id):
    try:
        comment = Comment.objects.get(pk=comment_id, post_id=post_id)
    except Comment.DoesNotExist:
        return Response(
            {"error": "Commentaire introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if comment.author != request.user:
        return Response(
            {"error": "Vous ne pouvez supprimer que vos propres commentaires."},
            status=status.HTTP_403_FORBIDDEN,
        )
    comment.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


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
