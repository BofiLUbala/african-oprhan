from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from communications.models import Conversation, Message


def make_user(email_prefix, role='director'):
    u = User.objects.create_user(
        email=f'{email_prefix}@x.com',
        password='pass',
        first_name=email_prefix.capitalize(),
        last_name='Test',
        role=role,
        country='SN',
    )
    u.is_active = True
    u.save()
    return u


class ConversationAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.alice = make_user('alice')
        self.bob = make_user('bob')
        self.client.force_authenticate(user=self.alice)

    def test_list_conversations_empty(self):
        r = self.client.get('/api/conversations/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data, [])

    def test_start_conversation(self):
        r = self.client.post('/api/conversations/', {'participant_id': self.bob.id})
        self.assertEqual(r.status_code, 201)
        self.assertIn('id', r.data)
        conv_id = r.data['id']

        # second call returns same conversation, 200
        r2 = self.client.post('/api/conversations/', {'participant_id': self.bob.id})
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.data['id'], conv_id)

    def test_send_and_list_messages(self):
        conv = Conversation.objects.create()
        conv.participants.set([self.alice, self.bob])
        r = self.client.post(f'/api/conversations/{conv.id}/messages/', {'content': 'Hello'})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data['content'], 'Hello')
        self.assertEqual(r.data['sender']['id'], self.alice.id)

        r2 = self.client.get(f'/api/conversations/{conv.id}/messages/')
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(len(r2.data), 1)

    def test_mark_read(self):
        conv = Conversation.objects.create()
        conv.participants.set([self.alice, self.bob])
        Message.objects.create(conversation=conv, sender=self.bob, content='Hi', is_read=False)
        r = self.client.post(f'/api/conversations/{conv.id}/read/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['marked'], 1)

    def test_unread_count_in_list(self):
        conv = Conversation.objects.create()
        conv.participants.set([self.alice, self.bob])
        Message.objects.create(conversation=conv, sender=self.bob, content='Hey', is_read=False)
        r = self.client.get('/api/conversations/')
        self.assertEqual(r.data[0]['unread_count'], 1)

    def test_non_participant_cannot_read_messages(self):
        eve = make_user('eve')
        conv = Conversation.objects.create()
        conv.participants.set([self.alice, self.bob])
        self.client.force_authenticate(user=eve)
        r = self.client.get(f'/api/conversations/{conv.id}/messages/')
        self.assertEqual(r.status_code, 403)

    def test_chat_list_excludes_self(self):
        r = self.client.get('/api/users/chat-list/')
        self.assertEqual(r.status_code, 200)
        ids = [u['id'] for u in r.data]
        self.assertNotIn(self.alice.id, ids)
        self.assertIn(self.bob.id, ids)
