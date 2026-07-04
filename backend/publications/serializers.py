from rest_framework import serializers
from .models import Post, PostMedia, PostView, PostLike, Comment, Story


class PostMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostMedia
        fields = ["id", "file", "media_type", "url"]


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "author", "author_name", "content", "created_at"]
        read_only_fields = ["author"]

    def get_author_name(self, obj):
        return obj.author.full_name

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

    class Meta:
        model = Post
        fields = [
            "id", "author", "author_name", "author_id", "author_avatar",
            "content", "post_type", "audience", "location", "media",
            "likes_count", "comments_count", "views_count", "is_liked",
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


class PostDetailSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_id = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    media = PostMediaSerializer(many=True, read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    views_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    viewers = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "author", "author_name", "author_id", "author_avatar",
            "content", "post_type", "audience", "location", "media",
            "likes_count", "comments_count", "views_count", "is_liked",
            "comments", "viewers", "created_at",
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

    class Meta:
        model = Post
        fields = ["content", "post_type", "audience", "location", "media"]

    def create(self, validated_data):
        media_data = validated_data.pop("media", [])
        validated_data["author"] = self.context["request"].user
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
