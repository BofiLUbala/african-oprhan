from django.urls import path
from . import views

urlpatterns = [
    path('channels/', views.channel_list, name='channel-list'),
    path('channels/<slug:slug>/messages/', views.channel_messages, name='channel-messages'),
    path('channels/messages/<int:message_id>/', views.channel_message_detail, name='channel-message-detail'),
    path('channels/messages/<int:message_id>/react/', views.channel_message_react, name='channel-message-react'),
    path('conversations/', views.conversation_list, name='conversation-list'),
    path('conversations/<int:conversation_id>/messages/', views.message_list, name='message-list'),
    path('conversations/<int:conversation_id>/read/', views.mark_read, name='mark-read'),
    path('conversations/messages/<int:message_id>/react/', views.message_react, name='message-react'),
    path('conversations/messages/<int:message_id>/', views.message_detail, name='message-detail'),
    path('notifications/', views.notification_list, name='notification-list'),
    path('notifications/unread-count/', views.notification_unread_count, name='notification-unread-count'),
    path('notifications/broadcast/', views.notification_broadcast, name='notification-broadcast'),
    path('users/chat-list/', views.chat_user_list, name='chat-user-list'),
]
