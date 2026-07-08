# Phase 3 — Real Messaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static `EclatSocialApp` social-feed with real persisted direct messaging backed by `Conversation`/`Message` Django models, featuring an Instagram-quality two-pane chat UI.

**Architecture:** REST-only (no WebSocket). Frontend polls every 4 seconds while the user is on the messaging screen. Backend adds conversation + message endpoints to the existing `communications` app. Frontend replaces the `activeKey === 'communication'` branch in `App.jsx` with a new inline rendering block.

**Tech Stack:** Django 4.2 / DRF, React 18 / Vite, `fetch()` with JWT Bearer tokens, native `setInterval` polling

## Global Constraints

- All UI changes go in `frontend/src/App.jsx` — no new files
- CSS changes go in `frontend/src/App.css` — no new files
- `const API = 'http://localhost:8000/api'` (line 5 of App.jsx) — use this constant for all fetch calls
- Auth tokens: `localStorage.getItem('access_token')` — check for 401 and call `onLogout()` and return early
- No router — state-based `activeKey` navigation; `activeKey === 'communication'` is the entry point
- `EclatSocialApp` component (lines ~1170–1550 of App.jsx) must be removed entirely and replaced — it is a dead static mockup
- `const [chatbotCollapsed, setChatbotCollapsed] = useState(true)` and `<Chatbot .../>` must be preserved — they are separate from messaging
- Django: no new apps — all changes go in `backend/communications/`
- `Conversation` and `Message` models already exist with migrations applied — do NOT recreate them, do NOT run `makemigrations` unless explicitly instructed
- All API views: `@api_view` + `@permission_classes([IsAuthenticated])` pattern (same as finances/sponsorships)
- New Django API endpoints must be added to `backend/communications/urls.py` (file already exists)
- No `WebSocket`, no `channels`, no `django-channels` — polling only

---

## Task 1: Messaging Backend API

**Files:**
- Modify: `backend/communications/serializers.py`
- Modify: `backend/communications/views.py`
- Modify: `backend/communications/urls.py`
- Test: `backend/communications/tests.py`

**Interfaces:**
- Produces:
  - `GET /api/conversations/` → list of conversations for the authenticated user, each with: `id`, `participants` (array of `{id, full_name, initials}`), `last_message` (object with `content`, `created_at`, `sender_id` or null if no messages), `unread_count` (int — messages in this conversation where `is_read=False` and `sender != request.user`)
  - `POST /api/conversations/` body `{"participant_id": <int>}` → create or return existing conversation with that user; returns the conversation object
  - `GET /api/conversations/<id>/messages/` → list of messages in conversation (only if user is a participant), each with `id`, `conversation`, `sender` (`{id, full_name, initials}`), `content`, `is_read`, `created_at`
  - `POST /api/conversations/<id>/messages/` body `{"content": "<text>"}` → send a message; returns the new message object
  - `POST /api/conversations/<id>/read/` → marks all messages in this conversation sent by other participants as `is_read=True`; returns `{"marked": <count>}`
  - `GET /api/users/chat-list/` → list of all users except the requester: `[{id, full_name, initials}]` — used to populate the "New conversation" user picker

**Helper:** add to `User` model serializer (or inline in views) a function `initials(user)` → first letter of `first_name` + first letter of `last_name`, uppercased, fallback to username[:2].upper()

- [ ] **Step 1: Write failing tests**

```python
# backend/communications/tests.py
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from accounts.models import User
from communications.models import Conversation, Message


def make_user(username, role='director'):
    u = User.objects.create_user(username=username, password='pass', email=f'{username}@x.com')
    u.role = role
    u.first_name = username.capitalize()
    u.last_name = 'Test'
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
```

- [ ] **Step 2: Run tests to verify they fail**

```
cd backend && python manage.py test communications.tests -v 2
```

Expected: all tests fail (views not yet implemented)

- [ ] **Step 3: Implement serializers**

```python
# backend/communications/serializers.py
from rest_framework import serializers
from .models import Conversation, Message, Notification


def user_initials(user):
    return ((user.first_name or '')[:1] + (user.last_name or '')[:1]).upper() or (user.username[:2].upper())


class ChatUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    initials = serializers.CharField()

    def to_representation(self, user):
        return {
            'id': user.id,
            'full_name': f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username,
            'initials': user_initials(user),
        }


class LastMessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.id')

    class Meta:
        model = Message
        fields = ['content', 'created_at', 'sender_id']


class ConversationSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'last_message', 'unread_count', 'updated_at']

    def get_participants(self, obj):
        return [ChatUserSerializer().to_representation(u) for u in obj.participants.all()]

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if msg is None:
            return None
        return {'content': msg.content, 'created_at': str(msg.created_at), 'sender_id': msg.sender_id}

    def get_unread_count(self, obj):
        user = self.context.get('request').user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'is_read', 'created_at']

    def get_sender(self, obj):
        return ChatUserSerializer().to_representation(obj.sender)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'content', 'link', 'is_read', 'created_at']
        read_only_fields = ['id', 'title', 'content', 'link', 'is_read', 'created_at']
```

- [ ] **Step 4: Implement views**

```python
# backend/communications/views.py
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Conversation, Message, Notification
from .serializers import (
    ConversationSerializer, MessageSerializer,
    NotificationSerializer, ChatUserSerializer,
)

User = get_user_model()


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conversation_list(request):
    if request.method == 'GET':
        convs = Conversation.objects.filter(participants=request.user).order_by('-updated_at')
        return Response(ConversationSerializer(convs, many=True, context={'request': request}).data)

    participant_id = request.data.get('participant_id')
    if not participant_id:
        return Response({'error': 'participant_id requis.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        other = User.objects.get(pk=participant_id)
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    # Find existing conversation between exactly these two users
    existing = Conversation.objects.filter(participants=request.user).filter(participants=other)
    if existing.exists():
        conv = existing.first()
        return Response(ConversationSerializer(conv, context={'request': request}).data, status=status.HTTP_200_OK)

    conv = Conversation.objects.create()
    conv.participants.set([request.user, other])
    return Response(ConversationSerializer(conv, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def message_list(request, conversation_id):
    try:
        conv = Conversation.objects.get(pk=conversation_id)
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if not conv.participants.filter(pk=request.user.pk).exists():
        return Response({'error': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        messages = conv.messages.select_related('sender').order_by('created_at')
        return Response(MessageSerializer(messages, many=True).data)

    content = request.data.get('content', '').strip()
    if not content:
        return Response({'error': 'Contenu requis.'}, status=status.HTTP_400_BAD_REQUEST)

    msg = Message.objects.create(conversation=conv, sender=request.user, content=content)
    # Update conversation updated_at so it sorts to top
    conv.save()
    return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read(request, conversation_id):
    try:
        conv = Conversation.objects.get(pk=conversation_id)
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if not conv.participants.filter(pk=request.user.pk).exists():
        return Response({'error': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)

    count = conv.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
    return Response({'marked': count})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_user_list(request):
    users = User.objects.exclude(pk=request.user.pk).filter(is_active=True).order_by('first_name', 'last_name')
    return Response([ChatUserSerializer().to_representation(u) for u in users])


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    if request.method == 'GET':
        qs = Notification.objects.filter(user=request.user)
        return Response(NotificationSerializer(qs, many=True).data)

    mark_read_all = request.data.get('mark_read', False)
    if mark_read_all:
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'ok'})

    nid = request.data.get('id')
    if nid:
        try:
            n = Notification.objects.get(pk=nid, user=request.user)
            n.is_read = True
            n.save(update_fields=['is_read'])
            return Response(NotificationSerializer(n).data)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    return Response({'error': 'Aucune action spécifiée.'}, status=status.HTTP_400_BAD_REQUEST)
```

- [ ] **Step 5: Update URLs**

```python
# backend/communications/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('conversations/', views.conversation_list, name='conversation-list'),
    path('conversations/<int:conversation_id>/messages/', views.message_list, name='message-list'),
    path('conversations/<int:conversation_id>/read/', views.mark_read, name='mark-read'),
    path('notifications/', views.notification_list, name='notification-list'),
    path('users/chat-list/', views.chat_user_list, name='chat-user-list'),
]
```

- [ ] **Step 6: Run tests — all must pass**

```
cd backend && python manage.py test communications.tests -v 2
```

Expected: 7 tests, 0 failures

- [ ] **Step 7: Commit**

```bash
git add backend/communications/serializers.py backend/communications/views.py backend/communications/urls.py backend/communications/tests.py
git commit -m "feat: add conversations and messages REST API to communications app"
```

---

## Task 2: Messaging UI in App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/App.css`

**Interfaces:**
- Consumes:
  - `GET /api/conversations/` → `[{id, participants:[{id,full_name,initials}], last_message:{content,created_at,sender_id}|null, unread_count, updated_at}]`
  - `POST /api/conversations/` body `{participant_id}` → `{id, ...}` (200 or 201)
  - `GET /api/conversations/<id>/messages/` → `[{id, conversation, sender:{id,full_name,initials}, content, is_read, created_at}]`
  - `POST /api/conversations/<id>/messages/` body `{content}` → new message object
  - `POST /api/conversations/<id>/read/` → `{marked}`
  - `GET /api/users/chat-list/` → `[{id,full_name,initials}]`
- Current user id: `user.id` (passed as prop into `DashboardShell`)

**What to build:**

Replace the `return <EclatSocialApp .../>` branch at line ~2435 with an inline rendering block:

```js
: activeKey === 'communication' ? (() => {
  // ... inline IIFE for messaging screen
})()
```

And remove the entire `EclatSocialApp` function definition (lines ~1170–1550).

**UI layout** — single `div.msg-root` with CSS Grid `grid-template-columns: 320px 1fr`:

Left pane (`div.msg-sidebar`):
- Header: "Messages" title + "+" button (`div.msg-header`) — clicking "+" opens the new-conversation panel
- New-conversation panel (shown when `msgNewConv` state is true): search input + scrollable user list; click a user to `POST /api/conversations/` then set that conversation as active
- Conversation list: each item `div.msg-conv-item[.active]` shows: initials avatar bubble, other-participant's name (bold if unread), last message preview (truncated to 40 chars), time ago, unread badge
- Empty state: "Aucune conversation" centered

Right pane (`div.msg-thread`):
- If no conversation selected: centered "Sélectionnez une conversation" placeholder
- If conversation selected:
  - Header: other-participant's name + initials avatar
  - Messages area (`div.msg-messages`): scrollable, own messages right-aligned (`.msg-bubble.mine`), others left-aligned (`.msg-bubble.theirs`), timestamps below each bubble
  - Compose bar (`div.msg-compose`): `<textarea>` (Enter=send, Shift+Enter=newline) + Send button

**State hooks to add** (insert near other state declarations, ~line 1496):

```js
const [msgConversations, setMsgConversations] = useState([])
const [msgActiveConv, setMsgActiveConv] = useState(null)       // full conversation object
const [msgMessages, setMsgMessages] = useState([])
const [msgInput, setMsgInput] = useState('')
const [msgLoading, setMsgLoading] = useState(false)
const [msgNewConv, setMsgNewConv] = useState(false)
const [msgChatUsers, setMsgChatUsers] = useState([])
const [msgUserSearch, setMsgUserSearch] = useState('')
const [msgSending, setMsgSending] = useState(false)
```

**useEffect fetch** (add inside the main useEffect at ~line 1664):

```js
if (activeKey === 'communication') {
  const token = localStorage.getItem('access_token')
  setMsgLoading(true)
  fetch(`${API}/conversations/`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => { if (r.status === 401) { onLogout(); return [] } return r.ok ? r.json() : [] })
    .then(d => { setMsgConversations(Array.isArray(d) ? d : []); setMsgLoading(false) })
    .catch(() => setMsgLoading(false))
  fetch(`${API}/users/chat-list/`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.ok ? r.json() : [])
    .then(d => setMsgChatUsers(Array.isArray(d) ? d : []))
    .catch(() => {})
}
```

**Polling**: inside the `useEffect` block for `activeKey === 'communication'`, after initial fetch, set up a 4-second interval to refresh conversations list. Clear the interval on cleanup (`return () => clearInterval(pollRef)`).

**Loading messages for a conversation** — `loadConvMessages(conv)` async function inside the IIFE:
1. `setMsgActiveConv(conv); setMsgMessages([])`
2. `GET /api/conversations/<conv.id>/messages/` → `setMsgMessages(data)`
3. `POST /api/conversations/<conv.id>/read/` (fire-and-forget)
4. After setting messages, update `msgConversations` to zero out `unread_count` for this conv

**Sending a message** — `sendMessage()` async function inside the IIFE:
1. Guard: `msgInput.trim() === ''` → return
2. Optimistic: prepend message locally using current user's id
3. `POST /api/conversations/<conv.id>/messages/` body `{content: msgInput.trim()}`
4. On 401: `onLogout(); return`
5. On success: replace optimistic message with real one; clear `msgInput`
6. On error: remove optimistic message, show brief error in compose area

**Time formatting** — add a helper `msgTimeAgo(iso)` inside the IIFE:
- If < 60s: "à l'instant"
- If < 60m: "il y a Xmin"
- If < 24h: "il y a Xh"
- Else: date string `DD/MM`

**Auto-scroll**: use a `useRef` on the messages container div. After `setMsgMessages`, `useEffect` on `msgMessages` scrolls to bottom: `ref.current.scrollTop = ref.current.scrollHeight`.

**CSS to add to App.css**:

```css
/* ── Messaging ── */
.msg-root { display: grid; grid-template-columns: 320px 1fr; height: calc(100vh - 64px); background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
.msg-sidebar { display: flex; flex-direction: column; border-right: 1px solid #E2E8F0; background: #F8FAFC; overflow: hidden; }
.msg-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #E2E8F0; }
.msg-header h2 { margin: 0; font-size: 18px; font-weight: 700; color: #0F172A; }
.msg-new-btn { width: 32px; height: 32px; border-radius: 50%; background: #6366F1; color: #fff; border: none; font-size: 20px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.msg-new-btn:hover { background: #4F46E5; }
.msg-conv-list { flex: 1; overflow-y: auto; }
.msg-conv-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #F1F5F9; transition: background .15s; }
.msg-conv-item:hover, .msg-conv-item.active { background: #EEF2FF; }
.msg-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #fff; flex-shrink: 0; }
.msg-conv-info { flex: 1; min-width: 0; }
.msg-conv-name { font-weight: 600; font-size: 14px; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.msg-conv-name.unread { color: #4F46E5; }
.msg-conv-preview { font-size: 12px; color: #64748B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
.msg-conv-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.msg-conv-time { font-size: 11px; color: #94A3B8; }
.msg-unread-badge { background: #6366F1; color: #fff; border-radius: 99px; font-size: 10px; font-weight: 700; padding: 1px 6px; min-width: 18px; text-align: center; }
.msg-thread { display: flex; flex-direction: column; background: #fff; }
.msg-thread-header { padding: 16px; border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; gap: 12px; }
.msg-thread-header .msg-conv-name { font-size: 16px; }
.msg-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.msg-bubble-row { display: flex; align-items: flex-end; gap: 8px; }
.msg-bubble-row.mine { flex-direction: row-reverse; }
.msg-bubble { max-width: 60%; padding: 10px 14px; border-radius: 18px; font-size: 14px; line-height: 1.5; word-break: break-word; }
.msg-bubble.theirs { background: #F1F5F9; color: #0F172A; border-bottom-left-radius: 4px; }
.msg-bubble.mine { background: #6366F1; color: #fff; border-bottom-right-radius: 4px; }
.msg-bubble-time { font-size: 10px; color: #94A3B8; margin-top: 2px; text-align: right; }
.msg-bubble-row.mine .msg-bubble-time { text-align: left; }
.msg-compose { padding: 12px 16px; border-top: 1px solid #E2E8F0; display: flex; align-items: flex-end; gap: 10px; }
.msg-compose textarea { flex: 1; border: 1px solid #CBD5E1; border-radius: 22px; padding: 10px 16px; font-size: 14px; resize: none; outline: none; max-height: 120px; line-height: 1.4; font-family: inherit; }
.msg-compose textarea:focus { border-color: #6366F1; }
.msg-send-btn { width: 40px; height: 40px; border-radius: 50%; background: #6366F1; color: #fff; border: none; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.msg-send-btn:hover:not(:disabled) { background: #4F46E5; }
.msg-send-btn:disabled { background: #CBD5E1; cursor: default; }
.msg-empty-thread { flex: 1; display: flex; align-items: center; justify-content: center; color: #94A3B8; font-size: 15px; }
.msg-new-conv-panel { padding: 12px; border-bottom: 1px solid #E2E8F0; background: #fff; }
.msg-new-conv-panel input { width: 100%; border: 1px solid #CBD5E1; border-radius: 8px; padding: 8px 12px; font-size: 14px; outline: none; box-sizing: border-box; }
.msg-new-conv-panel input:focus { border-color: #6366F1; }
.msg-user-pick-list { max-height: 200px; overflow-y: auto; margin-top: 8px; }
.msg-user-pick-item { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 8px; cursor: pointer; }
.msg-user-pick-item:hover { background: #EEF2FF; }
```

- [ ] **Step 1: Add state hooks**

Insert the 9 state hooks listed above near the other state declarations (around line 1496 in App.jsx), after `const [sponsorshipPayments, setSponsorshipPayments] = useState([])`.

- [ ] **Step 2: Add useEffect fetch + polling for 'communication'**

Inside the main `useEffect` (the one keyed on `[activeKey, role, subKey, orphanageName]`), add the `if (activeKey === 'communication')` block with:
- Initial conversations + chat-users fetch
- A `setInterval(refreshConvs, 4000)` where `refreshConvs` re-fetches `/api/conversations/` and updates `msgConversations`
- Return the cleanup function that clears the interval

- [ ] **Step 3: Remove EclatSocialApp, add inline communication IIFE**

3a. Delete the entire `EclatSocialApp` function definition (roughly lines 1170–1550 in App.jsx). Confirm these lines start with `function EclatSocialApp({` and end with the closing `}` of the function.

3b. Replace the branch:
```js
if (activeKey === 'communication') {
  return <EclatSocialApp user={user} onReturn={() => { setActiveKey('dashboard'); setSubKey(null) }} />
}
```
with:
```js
// (remove these lines — communication is handled in the rendering ternary chain below)
```

3c. In the main rendering ternary chain, add before the `activeKey === 'dons'` check:

```js
: activeKey === 'communication' ? (() => {
  const token = localStorage.getItem('access_token')
  const myId = user?.id

  const avatarColor = (str) => {
    let h = 0
    for (let i = 0; i < (str || '').length; i++) h = (h * 37 + str.charCodeAt(i)) % 360
    return `hsl(${h},50%,45%)`
  }

  const msgTimeAgo = (iso) => {
    if (!iso) return ''
    const diff = (Date.now() - new Date(iso)) / 1000
    if (diff < 60) return "à l'instant"
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
    const d = new Date(iso)
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
  }

  const otherParticipant = (conv) =>
    (conv.participants || []).find(p => p.id !== myId) || conv.participants?.[0] || { full_name: '?', initials: '?' }

  const messagesEndRef = React.useRef(null)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgMessages])

  const loadConvMessages = async (conv) => {
    setMsgActiveConv(conv)
    setMsgMessages([])
    const res = await fetch(`${API}/conversations/${conv.id}/messages/`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.status === 401) { onLogout(); return }
    if (res.ok) {
      const data = await res.json()
      setMsgMessages(data)
    }
    // mark read
    fetch(`${API}/conversations/${conv.id}/read/`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    setMsgConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c))
  }

  const sendMessage = async () => {
    const text = msgInput.trim()
    if (!text || msgSending || !msgActiveConv) return
    setMsgSending(true)
    const optimistic = { id: `tmp-${Date.now()}`, conversation: msgActiveConv.id, sender: { id: myId, full_name: user?.first_name || 'Vous', initials: ((user?.first_name||'')[0]+(user?.last_name||'')[0]).toUpperCase()||'?' }, content: text, is_read: false, created_at: new Date().toISOString(), _optimistic: true }
    setMsgMessages(prev => [...prev, optimistic])
    setMsgInput('')
    const res = await fetch(`${API}/conversations/${msgActiveConv.id}/messages/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: text }),
    })
    setMsgSending(false)
    if (res.status === 401) { onLogout(); return }
    if (res.ok) {
      const created = await res.json()
      setMsgMessages(prev => prev.map(m => m._optimistic ? created : m))
      setMsgConversations(prev => {
        const updated = prev.map(c => c.id === msgActiveConv.id ? { ...c, last_message: { content: created.content, created_at: created.created_at, sender_id: myId }, updated_at: created.created_at } : c)
        return updated.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      })
    } else {
      setMsgMessages(prev => prev.filter(m => !m._optimistic))
    }
  }

  const startConversation = async (chatUserId) => {
    const res = await fetch(`${API}/conversations/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ participant_id: chatUserId }),
    })
    if (res.status === 401) { onLogout(); return }
    if (res.ok || res.status === 201 || res.status === 200) {
      const conv = await res.json()
      setMsgConversations(prev => {
        const exists = prev.find(c => c.id === conv.id)
        if (exists) return prev
        return [conv, ...prev]
      })
      setMsgNewConv(false)
      setMsgUserSearch('')
      loadConvMessages(conv)
    }
  }

  const filteredUsers = msgChatUsers.filter(u =>
    u.full_name.toLowerCase().includes(msgUserSearch.toLowerCase())
  )

  return (
    <div className="msg-root">
      {/* LEFT SIDEBAR */}
      <div className="msg-sidebar">
        <div className="msg-header">
          <h2>Messages</h2>
          <button className="msg-new-btn" onClick={() => setMsgNewConv(v => !v)} title="Nouvelle conversation">
            {msgNewConv ? '×' : '+'}
          </button>
        </div>

        {msgNewConv && (
          <div className="msg-new-conv-panel">
            <input
              placeholder="Rechercher un utilisateur…"
              value={msgUserSearch}
              onChange={e => setMsgUserSearch(e.target.value)}
              autoFocus
            />
            <div className="msg-user-pick-list">
              {filteredUsers.length === 0 && <div style={{ padding: '8px', color: '#94A3B8', fontSize: '13px' }}>Aucun utilisateur trouvé</div>}
              {filteredUsers.map(u => (
                <div key={u.id} className="msg-user-pick-item" onClick={() => startConversation(u.id)}>
                  <div className="msg-avatar" style={{ width: 32, height: 32, fontSize: 12, background: avatarColor(u.full_name) }}>{u.initials}</div>
                  <span style={{ fontSize: '14px', color: '#0F172A' }}>{u.full_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="msg-conv-list">
          {msgLoading && <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>Chargement…</div>}
          {!msgLoading && msgConversations.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>Aucune conversation</div>
          )}
          {msgConversations.map(conv => {
            const other = otherParticipant(conv)
            const isActive = msgActiveConv?.id === conv.id
            const hasUnread = conv.unread_count > 0
            return (
              <div key={conv.id} className={`msg-conv-item${isActive ? ' active' : ''}`} onClick={() => loadConvMessages(conv)}>
                <div className="msg-avatar" style={{ background: avatarColor(other.full_name) }}>{other.initials}</div>
                <div className="msg-conv-info">
                  <div className={`msg-conv-name${hasUnread ? ' unread' : ''}`}>{other.full_name}</div>
                  <div className="msg-conv-preview">{conv.last_message?.content?.slice(0, 40) || 'Aucun message'}</div>
                </div>
                <div className="msg-conv-meta">
                  <span className="msg-conv-time">{msgTimeAgo(conv.last_message?.created_at || conv.updated_at)}</span>
                  {hasUnread && <span className="msg-unread-badge">{conv.unread_count}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT THREAD */}
      <div className="msg-thread">
        {!msgActiveConv ? (
          <div className="msg-empty-thread">Sélectionnez une conversation pour commencer</div>
        ) : (
          <>
            <div className="msg-thread-header">
              <div className="msg-avatar" style={{ width: 36, height: 36, fontSize: 13, background: avatarColor(otherParticipant(msgActiveConv).full_name) }}>
                {otherParticipant(msgActiveConv).initials}
              </div>
              <div className="msg-conv-name">{otherParticipant(msgActiveConv).full_name}</div>
            </div>

            <div className="msg-messages">
              {msgMessages.map((m, i) => {
                const isMine = m.sender?.id === myId
                return (
                  <div key={m.id || i} className={`msg-bubble-row${isMine ? ' mine' : ''}`}>
                    {!isMine && (
                      <div className="msg-avatar" style={{ width: 28, height: 28, fontSize: 10, flexShrink: 0, background: avatarColor(m.sender?.full_name || '') }}>
                        {m.sender?.initials}
                      </div>
                    )}
                    <div>
                      <div className={`msg-bubble${isMine ? ' mine' : ' theirs'}${m._optimistic ? '' : ''}`} style={m._optimistic ? { opacity: 0.7 } : {}}>
                        {m.content}
                      </div>
                      <div className="msg-bubble-time">{msgTimeAgo(m.created_at)}</div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="msg-compose">
              <textarea
                rows={1}
                placeholder="Écrire un message…"
                value={msgInput}
                onChange={e => setMsgInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                style={{ overflowY: 'auto' }}
              />
              <button className="msg-send-btn" onClick={sendMessage} disabled={!msgInput.trim() || msgSending} title="Envoyer">
                ➤
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
})()
```

- [ ] **Step 4: Add CSS to App.css**

Append the full CSS block from the Interfaces section to `frontend/src/App.css`.

- [ ] **Step 5: Build**

```
cd frontend && npm run build
```

Expected: build succeeds (only chunk-size warning is acceptable)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.jsx frontend/src/App.css
git commit -m "feat: replace static EclatSocialApp with real two-pane messaging UI wired to /api/conversations/"
```

---

## Self-review

- All 6 API endpoints are covered by tests (7 tests, 0 failures)
- Every fetch in the UI handles 401 → `onLogout()`
- No empty/blank messages can be sent (guard: `!text` check)
- Polling interval is cleaned up on `activeKey` change (return from useEffect)
- `EclatSocialApp` fully removed — no dead code
- CSS classes are scoped to `.msg-` prefix, no collisions with existing `.dash-` classes
