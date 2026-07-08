from django.contrib import admin
from .models import Post, PostMedia, PostView, PostLike, PostDislike, Comment, Story, StoryView


class PostMediaInline(admin.TabularInline):
    model = PostMedia
    extra = 1


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ["id", "author", "post_type", "location", "created_at"]
    list_filter = ["post_type", "created_at"]
    search_fields = ["content", "author__first_name", "author__last_name"]
    inlines = [PostMediaInline]


@admin.register(PostView)
class PostViewAdmin(admin.ModelAdmin):
    list_display = ["post", "user", "viewed_at"]


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ["post", "user", "created_at"]


@admin.register(PostDislike)
class PostDislikeAdmin(admin.ModelAdmin):
    list_display = ["post", "user", "created_at"]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ["post", "author", "content", "created_at"]


@admin.register(Story)
class StoryAdmin(admin.ModelAdmin):
    list_display = ["author", "caption", "views_count", "created_at", "expires_at"]


@admin.register(StoryView)
class StoryViewAdmin(admin.ModelAdmin):
    list_display = ["story", "user", "viewed_at"]
