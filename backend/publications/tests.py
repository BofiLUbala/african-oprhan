from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from publications.models import Post, Comment, PostLike, PostShare


def make_user(prefix, role="director"):
    u = User.objects.create_user(
        email=f"{prefix}@x.com", password="pass",
        first_name=prefix.capitalize(), last_name="Test", role=role, country="SN",
    )
    u.is_active = True
    u.save()
    return u


class CommentAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.alice = make_user("calice")
        self.bob = make_user("cbob")
        self.post = Post.objects.create(author=self.alice, content="hello", status="approved")
        self.client.force_authenticate(user=self.alice)

    def test_add_text_comment(self):
        r = self.client.post(f"/api/posts/{self.post.id}/comments/", {"content": "nice"})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["content"], "nice")
        self.assertIn("author_avatar", r.data)
        self.assertIn("author_role", r.data)

    def test_add_comment_with_attachment(self):
        f = SimpleUploadedFile("doc.pdf", b"%PDF-1.4 x", content_type="application/pdf")
        r = self.client.post(f"/api/posts/{self.post.id}/comments/",
                             {"content": "voir pj", "files": f}, format="multipart")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(len(r.data["attachments"]), 1)
        self.assertEqual(r.data["attachments"][0]["kind"], "pdf")

    def test_empty_comment_rejected(self):
        r = self.client.post(f"/api/posts/{self.post.id}/comments/", {"content": "  "})
        self.assertEqual(r.status_code, 400)

    def test_edit_own_comment(self):
        c = Comment.objects.create(post=self.post, author=self.alice, content="old")
        r = self.client.patch(f"/api/posts/{self.post.id}/comments/{c.id}/", {"content": "new"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["content"], "new")
        self.assertTrue(r.data["edited"])

    def test_cannot_edit_others_comment(self):
        c = Comment.objects.create(post=self.post, author=self.bob, content="his")
        r = self.client.patch(f"/api/posts/{self.post.id}/comments/{c.id}/", {"content": "hack"})
        self.assertEqual(r.status_code, 403)

    def test_delete_own_comment(self):
        c = Comment.objects.create(post=self.post, author=self.alice, content="mine")
        r = self.client.delete(f"/api/posts/{self.post.id}/comments/{c.id}/")
        self.assertEqual(r.status_code, 204)

    def test_cannot_delete_others_comment(self):
        c = Comment.objects.create(post=self.post, author=self.bob, content="his")
        r = self.client.delete(f"/api/posts/{self.post.id}/comments/{c.id}/")
        self.assertEqual(r.status_code, 403)

    def test_moderator_can_delete_any_comment(self):
        boss = make_user("cboss", role="supermaster")
        c = Comment.objects.create(post=self.post, author=self.bob, content="his")
        self.client.force_authenticate(user=boss)
        r = self.client.delete(f"/api/posts/{self.post.id}/comments/{c.id}/")
        self.assertEqual(r.status_code, 204)


class ReactionShareAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.alice = make_user("ralice")
        self.bob = make_user("rbob")
        self.post = Post.objects.create(author=self.alice, content="p", status="approved")
        self.client.force_authenticate(user=self.alice)

    def test_who_liked(self):
        PostLike.objects.create(post=self.post, user=self.bob)
        r = self.client.get(f"/api/posts/{self.post.id}/likes/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["count"], 1)
        self.assertEqual(r.data["users"][0]["name"], self.bob.full_name)
        self.assertIn("avatar", r.data["users"][0])

    def test_share_increments_and_is_idempotent(self):
        r1 = self.client.post(f"/api/posts/{self.post.id}/share/", {"method": "whatsapp"})
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r1.data["shares_count"], 1)
        # même méthode+destination → pas de double comptage
        r2 = self.client.post(f"/api/posts/{self.post.id}/share/", {"method": "whatsapp"})
        self.assertEqual(r2.data["shares_count"], 1)
        # méthode différente → nouveau partage
        r3 = self.client.post(f"/api/posts/{self.post.id}/share/", {"method": "email"})
        self.assertEqual(r3.data["shares_count"], 2)

    def test_shares_count_in_post_list(self):
        PostShare.objects.create(post=self.post, user=self.bob, method="copy")
        r = self.client.get("/api/posts/")
        mine = next(p for p in r.data if p["id"] == self.post.id)
        self.assertEqual(mine["shares_count"], 1)

    def test_share_list_hidden_from_non_author(self):
        PostShare.objects.create(post=self.post, user=self.bob, method="copy")
        self.client.force_authenticate(user=self.bob)
        r = self.client.get(f"/api/posts/{self.post.id}/shares/")
        self.assertEqual(r.data["count"], 1)
        self.assertEqual(r.data["users"], [])  # masqué pour un non-auteur

    def test_share_list_visible_to_author(self):
        PostShare.objects.create(post=self.post, user=self.bob, method="copy")
        r = self.client.get(f"/api/posts/{self.post.id}/shares/")
        self.assertEqual(len(r.data["users"]), 1)
