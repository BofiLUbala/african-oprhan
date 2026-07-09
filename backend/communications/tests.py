from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from communications.models import (
    Channel, ChannelMessage, Conversation, Message, Notification,
)


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

    def test_start_conversation_invalid_participant(self):
        r = self.client.post('/api/conversations/', {'participant_id': 99999})
        self.assertEqual(r.status_code, 404)

    def test_start_conversation_missing_participant_id(self):
        r = self.client.post('/api/conversations/', {})
        self.assertEqual(r.status_code, 400)

    def test_chat_list_excludes_self(self):
        r = self.client.get('/api/users/chat-list/')
        self.assertEqual(r.status_code, 200)
        ids = [u['id'] for u in r.data]
        self.assertNotIn(self.alice.id, ids)
        self.assertIn(self.bob.id, ids)

    def test_dm_reply_and_attachment_and_reaction(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        conv = Conversation.objects.create()
        conv.participants.set([self.alice, self.bob])
        original = Message.objects.create(conversation=conv, sender=self.bob, content='original')

        # réponse avec pièce jointe
        f = SimpleUploadedFile('doc.pdf', b'%PDF-1.4 test', content_type='application/pdf')
        r = self.client.post(
            f'/api/conversations/{conv.id}/messages/',
            {'content': 'ma réponse', 'reply_to': original.id, 'files': f},
            format='multipart',
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data['reply_to']['id'], original.id)
        self.assertEqual(len(r.data['attachments']), 1)
        self.assertEqual(r.data['attachments'][0]['kind'], 'pdf')

        # réaction WhatsApp sur le message original
        url = f'/api/conversations/messages/{original.id}/react/'
        r1 = self.client.post(url, {'emoji': '👍'})
        self.assertEqual([g['emoji'] for g in r1.data['reactions']], ['👍'])
        r2 = self.client.post(url, {'emoji': '🎉'})
        self.assertEqual([g['emoji'] for g in r2.data['reactions']], ['🎉'])
        r3 = self.client.post(url, {'emoji': '🎉'})
        self.assertEqual(r3.data['reactions'], [])

    def test_dm_read_receipt_timestamp(self):
        conv = Conversation.objects.create()
        conv.participants.set([self.alice, self.bob])
        Message.objects.create(conversation=conv, sender=self.bob, content='Hi')
        self.client.post(f'/api/conversations/{conv.id}/read/')
        r = self.client.get(f'/api/conversations/{conv.id}/messages/')
        self.assertTrue(r.data[0]['is_read'])
        self.assertIsNotNone(r.data[0]['read_at'])

    def test_dm_pagination_before_id(self):
        conv = Conversation.objects.create()
        conv.participants.set([self.alice, self.bob])
        msgs = [Message.objects.create(conversation=conv, sender=self.alice, content=f'm{i}') for i in range(5)]
        r = self.client.get(f'/api/conversations/{conv.id}/messages/?before_id={msgs[2].id}')
        self.assertEqual([m['content'] for m in r.data], ['m0', 'm1'])

    def test_non_participant_cannot_react(self):
        eve = make_user('eve2')
        conv = Conversation.objects.create()
        conv.participants.set([self.alice, self.bob])
        msg = Message.objects.create(conversation=conv, sender=self.bob, content='secret')
        self.client.force_authenticate(user=eve)
        r = self.client.post(f'/api/conversations/messages/{msg.id}/react/', {'emoji': '👍'})
        self.assertEqual(r.status_code, 403)

    def test_delete_own_dm_for_everyone(self):
        conv = Conversation.objects.create()
        conv.participants.set([self.alice, self.bob])
        msg = Message.objects.create(conversation=conv, sender=self.alice, content='à supprimer')
        r = self.client.delete(f'/api/conversations/messages/{msg.id}/')
        self.assertEqual(r.status_code, 204)
        self.assertFalse(Message.objects.filter(pk=msg.id).exists())

    def test_cannot_delete_others_dm(self):
        conv = Conversation.objects.create()
        conv.participants.set([self.alice, self.bob])
        msg = Message.objects.create(conversation=conv, sender=self.bob, content='pas la mienne')
        r = self.client.delete(f'/api/conversations/messages/{msg.id}/')
        self.assertEqual(r.status_code, 403)
        self.assertTrue(Message.objects.filter(pk=msg.id).exists())


class ChannelPermissionMatrixTest(TestCase):
    """Visibilité par message des canaux role_filtered :
    - tout le monde voit le canal et peut y publier
    - le rôle propriétaire (+ supermaster) voit tous les messages
    - les autres ne voient que leurs propres messages
    """

    def setUp(self):
        self.client = APIClient()
        self.ambassador = make_user('amb', role='ambassador')
        self.ambassador2 = make_user('amb2', role='ambassador')
        self.director = make_user('dir', role='director')
        self.supermaster = make_user('boss', role='supermaster')
        self.channel = Channel.objects.create(
            slug='ambassadeurs-test', name='Ambassadeurs',
            allowed_roles=['ambassador'], visibility_mode='role_filtered',
        )
        # un message de chaque profil
        self.msg_amb = ChannelMessage.objects.create(channel=self.channel, sender=self.ambassador, content='par ambassadeur')
        self.msg_amb2 = ChannelMessage.objects.create(channel=self.channel, sender=self.ambassador2, content='par ambassadeur 2')
        self.msg_dir = ChannelMessage.objects.create(channel=self.channel, sender=self.director, content='par directeur')

    def _messages_for(self, user):
        self.client.force_authenticate(user=user)
        r = self.client.get(f'/api/channels/{self.channel.slug}/messages/')
        self.assertEqual(r.status_code, 200)
        return {m['content'] for m in r.data}

    def test_channel_listed_for_everyone(self):
        for user in (self.director, self.ambassador, self.supermaster):
            self.client.force_authenticate(user=user)
            r = self.client.get('/api/channels/')
            self.assertIn(self.channel.slug, [c['slug'] for c in r.data])

    def test_non_role_user_sees_only_own_messages(self):
        self.assertEqual(self._messages_for(self.director), {'par directeur'})

    def test_role_owner_sees_everything(self):
        self.assertEqual(
            self._messages_for(self.ambassador),
            {'par ambassadeur', 'par ambassadeur 2', 'par directeur'},
        )

    def test_supermaster_sees_everything(self):
        self.assertEqual(
            self._messages_for(self.supermaster),
            {'par ambassadeur', 'par ambassadeur 2', 'par directeur'},
        )

    def test_non_role_user_can_post(self):
        self.client.force_authenticate(user=self.director)
        r = self.client.post(f'/api/channels/{self.channel.slug}/messages/', {'content': 'nouveau'})
        self.assertEqual(r.status_code, 201)

    def test_messages_count_is_per_user(self):
        self.client.force_authenticate(user=self.director)
        r = self.client.get('/api/channels/')
        ch = next(c for c in r.data if c['slug'] == self.channel.slug)
        self.assertEqual(ch['messages_count'], 1)
        self.assertFalse(ch['sees_all'])

    def test_non_role_user_cannot_react_to_hidden_message(self):
        self.client.force_authenticate(user=self.director)
        r = self.client.post(f'/api/channels/messages/{self.msg_amb.id}/react/', {'emoji': '👍'})
        self.assertEqual(r.status_code, 403)

    def test_role_owner_can_react_to_any_message(self):
        self.client.force_authenticate(user=self.ambassador)
        r = self.client.post(f'/api/channels/messages/{self.msg_dir.id}/react/', {'emoji': '👍'})
        self.assertEqual(r.status_code, 200)

    def test_reply_to_channel_message(self):
        self.client.force_authenticate(user=self.ambassador)
        r = self.client.post(
            f'/api/channels/{self.channel.slug}/messages/',
            {'content': 'réponse', 'reply_to': self.msg_amb2.id},
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data['reply_to']['id'], self.msg_amb2.id)
        self.assertEqual(r.data['reply_to']['content'], 'par ambassadeur 2')

    def test_reply_to_hidden_message_is_dropped(self):
        # un non-membre ne peut pas citer un message qu'il ne voit pas
        self.client.force_authenticate(user=self.director)
        r = self.client.post(
            f'/api/channels/{self.channel.slug}/messages/',
            {'content': 'tentative', 'reply_to': self.msg_amb.id},
        )
        self.assertEqual(r.status_code, 201)
        self.assertIsNone(r.data['reply_to'])

    def test_whatsapp_reaction_semantics(self):
        self.client.force_authenticate(user=self.ambassador)
        url = f'/api/channels/messages/{self.msg_amb2.id}/react/'
        # réagir 👍
        r1 = self.client.post(url, {'emoji': '👍'})
        self.assertEqual([g['emoji'] for g in r1.data['reactions']], ['👍'])
        # changer pour ❤️ → remplace, ne cumule pas
        r2 = self.client.post(url, {'emoji': '❤️'})
        self.assertEqual([g['emoji'] for g in r2.data['reactions']], ['❤️'])
        # re-cliquer ❤️ → retire
        r3 = self.client.post(url, {'emoji': '❤️'})
        self.assertEqual(r3.data['reactions'], [])

    def test_private_mode_still_hides_channel(self):
        private = Channel.objects.create(
            slug='prive-test', name='Privé',
            allowed_roles=['supermaster'], visibility_mode='private',
        )
        self.client.force_authenticate(user=self.director)
        r = self.client.get('/api/channels/')
        self.assertNotIn(private.slug, [c['slug'] for c in r.data])
        r2 = self.client.get(f'/api/channels/{private.slug}/messages/')
        self.assertEqual(r2.status_code, 403)


class NotificationEngineTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.ambassador = make_user('namb', role='ambassador')
        self.director = make_user('ndir', role='director')
        self.supermaster = make_user('nboss', role='supermaster')

    def test_channel_message_notifies_only_users_who_can_see_it(self):
        ch = Channel.objects.create(
            slug='notif-amb', name='Ambassadeurs',
            allowed_roles=['ambassador'], visibility_mode='role_filtered',
        )
        Notification.objects.all().delete()
        # le directeur publie : seuls ambassadeur + supermaster voient → sont notifiés
        ChannelMessage.objects.create(channel=ch, sender=self.director, content='bonjour')
        notified = set(Notification.objects.values_list('user_id', flat=True))
        self.assertEqual(notified, {self.ambassador.pk, self.supermaster.pk})

    def test_dm_notifies_recipient_only(self):
        conv = Conversation.objects.create()
        conv.participants.set([self.ambassador, self.director])
        Notification.objects.all().delete()
        Message.objects.create(conversation=conv, sender=self.ambassador, content='salut')
        notified = list(Notification.objects.values_list('user_id', flat=True))
        self.assertEqual(notified, [self.director.pk])

    def test_unread_count_endpoint(self):
        Notification.objects.create(user=self.director, title='a', content='')
        Notification.objects.create(user=self.director, title='b', content='')
        Notification.objects.create(user=self.director, title='c', content='', is_read=True)
        self.client.force_authenticate(user=self.director)
        r = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['count'], 2)

    def test_opening_channel_clears_its_notifications(self):
        ch = Channel.objects.create(slug='notif-open', name='Open')
        ChannelMessage.objects.create(channel=ch, sender=self.director, content='ping')
        self.client.force_authenticate(user=self.ambassador)
        self.assertEqual(
            Notification.objects.filter(user=self.ambassador, is_read=False,
                                        link=f'communication:channel:{ch.slug}').count(), 1)
        self.client.get(f'/api/channels/{ch.slug}/messages/')
        self.assertEqual(
            Notification.objects.filter(user=self.ambassador, is_read=False,
                                        link=f'communication:channel:{ch.slug}').count(), 0)

    def test_reading_conversation_clears_its_notifications(self):
        conv = Conversation.objects.create()
        conv.participants.set([self.ambassador, self.director])
        Message.objects.create(conversation=conv, sender=self.ambassador, content='salut')
        self.client.force_authenticate(user=self.director)
        self.client.post(f'/api/conversations/{conv.id}/read/')
        self.assertEqual(
            Notification.objects.filter(user=self.director, is_read=False,
                                        link=f'communication:dm:{conv.id}').count(), 0)

    def test_broadcast_restricted_to_admin_roles(self):
        self.client.force_authenticate(user=self.director)
        r = self.client.post('/api/notifications/broadcast/', {'title': 'spam'})
        self.assertEqual(r.status_code, 403)
        self.client.force_authenticate(user=self.supermaster)
        r2 = self.client.post('/api/notifications/broadcast/', {'title': 'annonce officielle'})
        self.assertEqual(r2.status_code, 200)
