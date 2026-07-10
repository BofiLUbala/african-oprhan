from django.urls import path
from . import views

urlpatterns = [
    path("posts/", views.post_list, name="post-list"),
    path("posts/<int:post_id>/", views.post_detail, name="post-detail"),
    path("posts/<int:post_id>/like/", views.toggle_like, name="post-like"),
    path("posts/<int:post_id>/dislike/", views.toggle_dislike, name="post-dislike"),
    path("posts/<int:post_id>/likes/", views.post_likes, name="post-likes"),
    path("posts/<int:post_id>/share/", views.share_post, name="post-share"),
    path("posts/<int:post_id>/shares/", views.post_shares, name="post-shares"),
    path("posts/pending/", views.pending_posts, name="pending-posts"),
    path("posts/<int:post_id>/review/", views.review_post, name="review-post"),
    path(
        "posts/<int:post_id>/comments/",
        views.comment_list,
        name="post-comments",
    ),
    path(
        "posts/<int:post_id>/comments/<int:comment_id>/",
        views.comment_detail,
        name="comment-detail",
    ),
    path("stories/", views.story_list, name="story-list"),
    path("stories/<int:story_id>/", views.story_detail, name="story-detail"),
]
