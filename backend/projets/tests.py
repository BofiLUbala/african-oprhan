from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from children.models import Child, ChildAssignment
from orphanages.models import Orphanage


class BaseTestMixin:
    def setUp(self):
        # is_active=True : par défaut un User n'est pas activé (vérification
        # email) — le fallback fédération de get_reviewer_for_child() filtre
        # explicitement is_active=True, donc un compte de test inactif ne
        # serait jamais trouvé comme reviewer.
        self.partner = User.objects.create(
            email="partner@test.com", first_name="P", last_name="Test",
            country="CD", role="partner", is_active=True,
        )
        self.directeur = User.objects.create(
            email="director@test.com", first_name="Dir", last_name="Test",
            country="CD", role="director", is_active=True,
        )
        self.ambassadeur = User.objects.create(
            email="amb@test.com", first_name="Amb", last_name="Test",
            country="CD", role="ambassador", is_active=True,
        )
        self.federation = User.objects.create(
            email="fed@test.com", first_name="Fed", last_name="Test",
            country="CD", role="federation", is_active=True,
        )
        self.orphelinat = Orphanage.objects.create(
            name="Orphelinat Test", director=self.directeur,
        )
        self.enfant = Child.objects.create(
            uid="TEST12345678", nom="Test", prenom="Child",
            created_by=self.directeur, orphanage=self.orphelinat,
        )
        ChildAssignment.objects.create(
            child=self.enfant, ambassador=self.ambassadeur,
            assigned_by=self.federation,
        )
        self.client = APIClient()


class TestCycleVieProjet(BaseTestMixin, TestCase):
    def test_directeur_cree_brouillon(self):
        self.client.force_authenticate(user=self.directeur)
        response = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Rénovation",
            "description": "Projet test",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["statut"], "brouillon")
        self.assertEqual(response.data["createur_role"], "directeur")

    def test_ambassadeur_cree_publie(self):
        self.client.force_authenticate(user=self.ambassadeur)
        response = self.client.post("/api/projets/", {
            "type": "enfant", "titre": "Scolarisation",
            "description": "Projet test", "enfant": self.enfant.pk,
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["statut"], "publie")

    def test_federation_cree_publie(self):
        self.client.force_authenticate(user=self.federation)
        response = self.client.post("/api/projets/", {
            "type": "federation", "titre": "National",
            "description": "Projet fédéral",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["statut"], "publie")

    def test_partner_ne_peut_pas_creer(self):
        self.client.force_authenticate(user=self.partner)
        response = self.client.post("/api/projets/", {
            "type": "enfant", "titre": "Test",
            "description": "Test",
        }, format="json")
        self.assertEqual(response.status_code, 403)

    def test_soumission_validation(self):
        # /soumettre/ enchaîne immédiatement _send_to_reviewer : un projet
        # orphelinat (pas d'enfant -> pas d'ambassadeur assigné) atterrit donc
        # directement en_attente_federation, jamais soumis_validation.
        self.client.force_authenticate(user=self.directeur)
        create = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Test",
            "description": "Test", "orphelinat": self.orphelinat.pk,
        }, format="json")
        projet_id = create.data["id"]
        response = self.client.post(f"/api/projets/{projet_id}/soumettre/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["statut"], "en_attente_federation")
        self.assertEqual(response.data["assigned_reviewer"], self.federation.id)


class TestValidationAmbassadeur(BaseTestMixin, TestCase):
    """Un projet orphelinat n'a pas d'enfant -> get_reviewer_for_child(None)
    retombe toujours sur la fédération (confirmé métier 2026-07-16) : c'est
    l'ambassadeur qui valide un projet ENFANT (via ChildAssignment), la
    fédération qui valide un projet ORPHELINAT. Ces tests utilisaient à tort
    self.ambassadeur pour un projet orphelinat."""
    def test_federation_valide_projet_orphelinat(self):
        self.client.force_authenticate(user=self.directeur)
        create = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Test",
            "description": "Test", "orphelinat": self.orphelinat.pk,
        }, format="json")
        projet_id = create.data["id"]
        self.client.post(f"/api/projets/{projet_id}/soumettre/")

        self.client.force_authenticate(user=self.federation)
        response = self.client.post(f"/api/projets/{projet_id}/valider/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["statut"], "approuve")
        self.assertEqual(response.data["ambassadeur_validateur"], self.federation.id)

        response = self.client.post(f"/api/projets/{projet_id}/publier/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["statut"], "publie")

    def test_federation_rejette_projet_orphelinat(self):
        self.client.force_authenticate(user=self.directeur)
        create = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Test",
            "description": "Test", "orphelinat": self.orphelinat.pk,
        }, format="json")
        projet_id = create.data["id"]
        self.client.post(f"/api/projets/{projet_id}/soumettre/")

        self.client.force_authenticate(user=self.federation)
        response = self.client.post(f"/api/projets/{projet_id}/rejeter/", {
            "motif": "Budget insuffisant",
        }, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["statut"], "rejete")
        self.assertEqual(response.data["motif_rejet"], "Budget insuffisant")

    def test_directeur_ne_peut_pas_valider(self):
        self.client.force_authenticate(user=self.directeur)
        create = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Test",
            "description": "Test", "orphelinat": self.orphelinat.pk,
        }, format="json")
        projet_id = create.data["id"]
        self.client.post(f"/api/projets/{projet_id}/soumettre/")

        response = self.client.post(f"/api/projets/{projet_id}/valider/")
        self.assertEqual(response.status_code, 403)

    def test_modification_demandee_puis_resoumission(self):
        self.client.force_authenticate(user=self.directeur)
        create = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Test",
            "description": "Test", "orphelinat": self.orphelinat.pk,
        }, format="json")
        projet_id = create.data["id"]
        self.client.post(f"/api/projets/{projet_id}/soumettre/")

        self.client.force_authenticate(user=self.federation)
        self.client.post(f"/api/projets/{projet_id}/demander-modification/", {
            "commentaire": "Ajouter le budget détaillé",
        }, format="json")

        self.client.force_authenticate(user=self.directeur)
        response = self.client.patch(f"/api/projets/{projet_id}/modifier/", {
            "titre": "Test modifié",
        }, format="json")
        self.assertEqual(response.status_code, 200)
        # modifier() repasse par _send_to_reviewer, qui pour un projet
        # orphelinat (pas d'enfant) retombe directement sur la fédération.
        self.assertEqual(response.data["statut"], "en_attente_federation")
        self.assertEqual(response.data["assigned_reviewer"], self.federation.id)

    def test_demande_modification_avec_fichier_joint(self):
        self.client.force_authenticate(user=self.directeur)
        create = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Test",
            "description": "Test", "orphelinat": self.orphelinat.pk,
        }, format="json")
        projet_id = create.data["id"]
        self.client.post(f"/api/projets/{projet_id}/soumettre/")

        self.client.force_authenticate(user=self.federation)
        fichier = SimpleUploadedFile("budget_corrige.pdf", b"%PDF-1.4 dummy content", content_type="application/pdf")
        response = self.client.post(f"/api/projets/{projet_id}/demander-modification/", {
            "commentaire": "Merci de joindre un budget détaillé, voir fichier joint.",
            "fichier": fichier,
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["statut"], "modification_demandee")
        self.assertIsNotNone(response.data["amelioration_fichier_url"])
        self.assertIn("budget_corrige", response.data["amelioration_fichier_url"])


class TestSuspensionFederation(BaseTestMixin, TestCase):
    def test_federation_suspend_projet(self):
        self.client.force_authenticate(user=self.ambassadeur)
        create = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Test",
            "description": "Test", "orphelinat": self.orphelinat.pk,
        }, format="json")
        projet_id = create.data["id"]

        self.client.force_authenticate(user=self.federation)
        response = self.client.post(f"/api/projets/{projet_id}/suspendre/", {
            "motif": "Non-conformité",
        }, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["statut"], "suspendu")

    def test_directeur_ne_peut_pas_suspendre(self):
        self.client.force_authenticate(user=self.directeur)
        create = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Test",
            "description": "Test", "orphelinat": self.orphelinat.pk,
        }, format="json")
        projet_id = create.data["id"]

        response = self.client.post(f"/api/projets/{projet_id}/suspendre/")
        self.assertEqual(response.status_code, 403)


class TestCandidatures(BaseTestMixin, TestCase):
    def test_partner_postule(self):
        self.client.force_authenticate(user=self.ambassadeur)
        create = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Test",
            "description": "Test", "orphelinat": self.orphelinat.pk,
        }, format="json")
        projet_id = create.data["id"]

        self.client.force_authenticate(user=self.partner)
        response = self.client.post(f"/api/projets/{projet_id}/candidature/", {
            "montant_propose": 5000, "modalite": "unique",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["statut"], "en_attente_reponse")

    def test_candidature_acceptee_augmente_collecte(self):
        self.client.force_authenticate(user=self.ambassadeur)
        create = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Test",
            "description": "Test", "budget_total": 10000, "orphelinat": self.orphelinat.pk,
        }, format="json")
        projet_id = create.data["id"]

        self.client.force_authenticate(user=self.partner)
        self.client.post(f"/api/projets/{projet_id}/candidature/", {
            "montant_propose": 5000, "modalite": "unique",
        }, format="json")

        self.client.force_authenticate(user=self.ambassadeur)
        candidatures = self.client.get(f"/api/projets/{projet_id}/candidatures/").data
        cid = candidatures[0]["id"]

        response = self.client.post(f"/api/projets/{projet_id}/candidatures/{cid}/repondre/", {
            "action": "accepter",
        }, format="json")
        self.assertEqual(response.status_code, 200)

        projet = self.client.get(f"/api/projets/{projet_id}/").data
        self.assertEqual(float(projet["montant_collecte"]), 5000)

    def test_candidature_double_refusee(self):
        self.client.force_authenticate(user=self.ambassadeur)
        create = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Test",
            "description": "Test", "orphelinat": self.orphelinat.pk,
        }, format="json")
        projet_id = create.data["id"]

        self.client.force_authenticate(user=self.partner)
        self.client.post(f"/api/projets/{projet_id}/candidature/", {
            "montant_propose": 5000, "modalite": "unique",
        }, format="json")
        response = self.client.post(f"/api/projets/{projet_id}/candidature/", {
            "montant_propose": 3000, "modalite": "unique",
        }, format="json")
        self.assertEqual(response.status_code, 409)

    def test_historique_creation(self):
        self.client.force_authenticate(user=self.ambassadeur)
        create = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Test",
            "description": "Test", "orphelinat": self.orphelinat.pk,
        }, format="json")
        projet_id = create.data["id"]

        response = self.client.get(f"/api/projets/{projet_id}/history/")
        self.assertEqual(response.status_code, 200)
        events = response.data
        self.assertGreaterEqual(len(events), 1)
        self.assertEqual(events[0]["type_evenement"], "projet_cree")


class TestCategorieEtCode(BaseTestMixin, TestCase):
    def test_enfant_sans_cible_refuse(self):
        self.client.force_authenticate(user=self.ambassadeur)
        response = self.client.post("/api/projets/", {
            "type": "enfant", "titre": "Sans enfant",
            "description": "Test",
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("enfant", response.data)

    def test_orphelinat_sans_cible_refuse_pour_non_directeur(self):
        self.client.force_authenticate(user=self.ambassadeur)
        response = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Sans orphelinat",
            "description": "Test",
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("orphelinat", response.data)

    def test_orphelinat_sans_cible_ok_pour_directeur_avec_orphelinat_gere(self):
        self.client.force_authenticate(user=self.directeur)
        response = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Auto-rempli",
            "description": "Test",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["orphelinat"], self.orphelinat.pk)

    def test_categorie_invalide_pour_type_refuse(self):
        self.client.force_authenticate(user=self.ambassadeur)
        response = self.client.post("/api/projets/", {
            "type": "enfant", "titre": "Mauvaise categorie",
            "description": "Test", "enfant": self.enfant.pk,
            "category": "food",
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("category", response.data)

    def test_categorie_valide_acceptee(self):
        self.client.force_authenticate(user=self.ambassadeur)
        response = self.client.post("/api/projets/", {
            "type": "enfant", "titre": "Bonne categorie",
            "description": "Test", "enfant": self.enfant.pk,
            "category": "health",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["category"], "health")

    def test_federation_avec_categorie_refuse(self):
        self.client.force_authenticate(user=self.federation)
        response = self.client.post("/api/projets/", {
            "type": "federation", "titre": "Federation categorisee",
            "description": "Test", "category": "food",
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("category", response.data)

    def test_code_prefixe_par_type_et_unique(self):
        self.client.force_authenticate(user=self.ambassadeur)
        r1 = self.client.post("/api/projets/", {
            "type": "enfant", "titre": "Code enfant",
            "description": "Test", "enfant": self.enfant.pk,
        }, format="json")
        r2 = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Code orphelinat",
            "description": "Test", "orphelinat": self.orphelinat.pk,
        }, format="json")
        self.client.force_authenticate(user=self.federation)
        r3 = self.client.post("/api/projets/", {
            "type": "federation", "titre": "Code federation",
            "description": "Test",
        }, format="json")
        self.assertTrue(r1.data["code"].startswith("CHD-"))
        self.assertTrue(r2.data["code"].startswith("ORP-"))
        self.assertTrue(r3.data["code"].startswith("FED-"))
        codes = {r1.data["code"], r2.data["code"], r3.data["code"]}
        self.assertEqual(len(codes), 3)


class TestVisibilitePartenaire(BaseTestMixin, TestCase):
    def test_partner_voit_projets_publies(self):
        self.client.force_authenticate(user=self.ambassadeur)
        create = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Visible",
            "description": "Test", "orphelinat": self.orphelinat.pk,
        }, format="json")
        self.assertEqual(create.status_code, 201)

        self.client.force_authenticate(user=self.partner)
        response = self.client.get("/api/projets/")
        self.assertEqual(response.status_code, 200)
        titres = [p["titre"] for p in response.data]
        self.assertIn("Visible", titres)

    def test_partner_ne_voit_pas_brouillons(self):
        self.client.force_authenticate(user=self.directeur)
        self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Cache",
            "description": "Test",
        }, format="json")

        self.client.force_authenticate(user=self.partner)
        response = self.client.get("/api/projets/")
        titres = [p["titre"] for p in response.data]
        self.assertNotIn("Cache", titres)


class TestPipelinePublication(BaseTestMixin, TestCase):
    """À la publication d'un projet : Post Accueil + notifications (signaux)."""

    def _creer_projet_publie(self, **extra):
        self.client.force_authenticate(user=self.ambassadeur)
        payload = {
            "type": "enfant", "titre": "Scolarisation Jane",
            "description": "Frais scolaires pour Jane",
            "enfant": self.enfant.pk, "orphelinat": self.orphelinat.pk,
        }
        payload.update(extra)
        response = self.client.post("/api/projets/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        from .models import Project
        return Project.objects.get(pk=response.data["id"])

    def test_publication_cree_post_accueil(self):
        from publications.models import Post
        projet = self._creer_projet_publie()
        posts = Post.objects.filter(project=projet)
        self.assertEqual(posts.count(), 1)
        post = posts.first()
        self.assertEqual(post.author, self.ambassadeur)
        self.assertEqual(post.audience, "public")
        self.assertEqual(post.status, "approved")
        self.assertEqual(post.child, self.enfant)
        self.assertIn("Scolarisation Jane", post.content)

    def test_publication_notifie_les_roles(self):
        from communications.models import Notification
        projet = self._creer_projet_publie()
        notifs = Notification.objects.filter(title__contains=projet.titre)
        destinataires = set(notifs.values_list("user_id", flat=True))
        self.assertIn(self.federation.pk, destinataires)
        self.assertIn(self.ambassadeur.pk, destinataires)  # createur
        self.assertIn(self.directeur.pk, destinataires)    # directeur orphelinat

    def test_validation_directeur_declenche_publication(self):
        from publications.models import Post
        self.client.force_authenticate(user=self.directeur)
        response = self.client.post("/api/projets/", {
            "type": "orphelinat", "titre": "Renovation toit",
            "description": "Toiture endommagee",
        }, format="json")
        projet_id = response.data["id"]
        self.assertEqual(Post.objects.filter(project_id=projet_id).count(), 0)

        self.client.post(f"/api/projets/{projet_id}/soumettre/")
        self.assertEqual(Post.objects.filter(project_id=projet_id).count(), 0)

        # Projet orphelinat -> pas d'enfant -> reviewer = fédération, pas
        # l'ambassadeur (cf. get_reviewer_for_child(None)).
        self.client.force_authenticate(user=self.federation)
        response = self.client.post(f"/api/projets/{projet_id}/valider/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["statut"], "approuve")
        self.assertEqual(Post.objects.filter(project_id=projet_id).count(), 0)

        response = self.client.post(f"/api/projets/{projet_id}/publier/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["statut"], "publie")
        self.assertEqual(Post.objects.filter(project_id=projet_id).count(), 1)

    def test_republication_ne_duplique_pas_le_post(self):
        from publications.models import Post
        from .constants import STATUTS_PROJET
        projet = self._creer_projet_publie()
        self.assertEqual(Post.objects.filter(project=projet).count(), 1)

        projet.statut = STATUTS_PROJET['SUSPENDU']
        projet.save()
        projet.statut = STATUTS_PROJET['PUBLIE']
        projet.save()
        self.assertEqual(Post.objects.filter(project=projet).count(), 1)

    def test_sauvegarde_sans_transition_ne_notifie_pas_deux_fois(self):
        from communications.models import Notification
        projet = self._creer_projet_publie()
        avant = Notification.objects.filter(title__contains=projet.titre).count()
        projet.beneficiaires = 5
        projet.save()
        apres = Notification.objects.filter(title__contains=projet.titre).count()
        self.assertEqual(avant, apres)

    def test_post_expose_project_info(self):
        projet = self._creer_projet_publie()
        self.client.force_authenticate(user=self.partner)
        response = self.client.get("/api/posts/")
        self.assertEqual(response.status_code, 200)
        items = response.data if isinstance(response.data, list) else response.data.get("results", [])
        lie = [p for p in items if p.get("project_info") and p["project_info"]["id"] == projet.pk]
        self.assertEqual(len(lie), 1)
        self.assertEqual(lie[0]["project_info"]["type"], "enfant")
        self.assertEqual(lie[0]["project_info"]["titre"], "Scolarisation Jane")
