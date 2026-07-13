from rest_framework import serializers
from .models import Post, PostMedia, PostView, PostLike, Comment, Story
from children.models import Child, ChildAssignment


def _child_info(obj):
    """Auto-retrieved child summary for a post (never manually duplicated)."""
    child = obj.child
    if not child:
        return None
    assignment = (
        ChildAssignment.objects.filter(child=child)
        .select_related("ambassador")
        .first()
    )
    ambassador = assignment.ambassador if assignment else None
    return {
        "id": child.pk,
        "uid": child.uid,
        "name": f"{child.prenom} {child.nom}".strip() or child.uid,
        "photo": child.photo.url if child.photo else None,
        "nationalite": child.nationalite or "",
        "orphanage": child.orphanage.name if child.orphanage else None,
        "ambassador_id": ambassador.pk if ambassador else None,
        "ambassador_name": ambassador.full_name if ambassador else None,
    }


def _project_info(obj):
    """Minimal project summary for a post, used to render the 'Postulate' button."""
    project = obj.project
    if not project:
        return None
    return {
        "id": project.pk,
        "type": project.type,
        "titre": project.titre,
        "statut": project.statut,
        "budget_total": str(project.budget_total),
        "montant_collecte": str(project.montant_collecte),
    }


class PostMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostMedia
        fields = ["id", "file", "media_type", "url"]


def _avatar_of(user):
    hue = (user.first_name or "U").encode("utf-8")[0] * 37 % 360
    initials = (user.first_name[0] if user.first_name else "") + (
        user.last_name[0] if user.last_name else ""
    )
    return {"initials": (initials or "?").upper(), "hue": hue}


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    author_role = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "author", "author_name", "author_avatar", "author_role",
                  "content", "attachments", "edited", "created_at", "updated_at"]
        read_only_fields = ["author"]

    def get_author_name(self, obj):
        return obj.author.full_name

    def get_author_avatar(self, obj):
        return _avatar_of(obj.author)

    def get_author_role(self, obj):
        return getattr(obj.author, "role", "")

    def get_attachments(self, obj):
        return [
            {"id": a.pk, "url": a.file.url, "name": a.original_name,
             "size": a.size, "mime": a.mime, "kind": a.kind}
            for a in obj.attachments.all()
        ]

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)


class PostListSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_id = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    media = PostMediaSerializer(many=True, read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    views_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_disliked = serializers.SerializerMethodField()
    dislikes_count = serializers.IntegerField(read_only=True)
    shares_count = serializers.IntegerField(read_only=True)
    is_shared = serializers.SerializerMethodField()
    child_info = serializers.SerializerMethodField()
    project_info = serializers.SerializerMethodField()
    review_ambassador_name = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "author", "author_name", "author_id", "author_avatar",
            "content", "post_type", "audience", "location", "media",
            "likes_count", "comments_count", "views_count", "is_liked",
            "is_disliked", "dislikes_count", "shares_count", "is_shared",
            "status", "rejection_reason", "child_info", "project_info", "review_ambassador_name",
            "created_at",
        ]

    def get_author_name(self, obj):
        return obj.author.full_name

    def get_author_id(self, obj):
        return obj.author.pk

    def get_author_avatar(self, obj):
        user = obj.author
        hue = (user.first_name or "U").encode("utf-8")[0] * 37 % 360
        initials = (user.first_name[0] if user.first_name else "") + (
            user.last_name[0] if user.last_name else ""
        )
        return {
            "initials": initials or "?",
            "hue": hue,
        }

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_is_disliked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.dislikes.filter(user=request.user).exists()
        return False

    def get_is_shared(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.shares.filter(user=request.user).exists()
        return False

    def get_child_info(self, obj):
        return _child_info(obj)

    def get_project_info(self, obj):
        return _project_info(obj)

    def get_review_ambassador_name(self, obj):
        return obj.review_ambassador.full_name if obj.review_ambassador else None


class PostDetailSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_id = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    media = PostMediaSerializer(many=True, read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    views_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_disliked = serializers.SerializerMethodField()
    dislikes_count = serializers.IntegerField(read_only=True)
    shares_count = serializers.IntegerField(read_only=True)
    is_shared = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    viewers = serializers.SerializerMethodField()
    child_info = serializers.SerializerMethodField()
    project_info = serializers.SerializerMethodField()
    review_ambassador_name = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "author", "author_name", "author_id", "author_avatar",
            "content", "post_type", "audience", "location", "media",
            "likes_count", "comments_count", "views_count", "is_liked",
            "is_disliked", "dislikes_count", "shares_count", "is_shared",
            "status", "rejection_reason", "child_info", "project_info", "review_ambassador_name",
            "comments", "viewers", "created_at",
        ]

    def get_child_info(self, obj):
        return _child_info(obj)

    def get_project_info(self, obj):
        return _project_info(obj)

    def get_review_ambassador_name(self, obj):
        return obj.review_ambassador.full_name if obj.review_ambassador else None

    def get_author_name(self, obj):
        return obj.author.full_name

    def get_author_id(self, obj):
        return obj.author.pk

    def get_author_avatar(self, obj):
        user = obj.author
        hue = (user.first_name or "U").encode("utf-8")[0] * 37 % 360
        initials = (user.first_name[0] if user.first_name else "") + (
            user.last_name[0] if user.last_name else ""
        )
        return {
            "initials": initials or "?",
            "hue": hue,
        }

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_is_disliked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.dislikes.filter(user=request.user).exists()
        return False

    def get_is_shared(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.shares.filter(user=request.user).exists()
        return False

    def get_viewers(self, obj):
        return [
            {
                "id": v.user.pk,
                "name": v.user.full_name,
                "viewed_at": v.viewed_at,
            }
            for v in obj.views.select_related("user").all()
        ]


class PostCreateSerializer(serializers.ModelSerializer):
    media = PostMediaSerializer(many=True, required=False)
    child = serializers.PrimaryKeyRelatedField(
        queryset=Child.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Post
        fields = ["content", "post_type", "audience", "location", "media", "child"]

    def create(self, validated_data):
        media_data = validated_data.pop("media", [])
        user = self.context["request"].user
        validated_data["author"] = user
        child = validated_data.get("child")

        # ── Approval workflow ────────────────────────────────────────────
        # When a Chef d'Orphelinat publishes information about a child, the
        # post is NEVER public immediately. It is routed to the child's
        # assigned Ambassador for validation.
        if getattr(user, "role", "") == "director" and child is not None:
            validated_data["status"] = "pending"
            assignment = (
                ChildAssignment.objects.filter(child=child)
                .select_related("ambassador")
                .first()
            )
            if assignment:
                validated_data["review_ambassador"] = assignment.ambassador

        post = Post.objects.create(**validated_data)
        for m in media_data:
            PostMedia.objects.create(post=post, **m)
        return post


class StorySerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    views_count = serializers.IntegerField(read_only=True)
    viewers = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = [
            "id", "author", "author_name", "author_avatar",
            "media", "media_url", "caption", "views_count", "viewers",
            "created_at", "expires_at",
        ]
        read_only_fields = ["author"]

    def get_author_name(self, obj):
        return obj.author.full_name

    def get_author_avatar(self, obj):
        user = obj.author
        hue = (user.first_name or "U").encode("utf-8")[0] * 37 % 360
        initials = (user.first_name[0] if user.first_name else "") + (
            user.last_name[0] if user.last_name else ""
        )
        return {
            "initials": initials or "?",
            "hue": hue,
        }

    def get_viewers(self, obj):
        return [
            {
                "id": v.user.pk,
                "name": v.user.full_name,
                "viewed_at": v.viewed_at,
            }
            for v in obj.story_views.select_related("user").all()
        ]

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)
