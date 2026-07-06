from django.urls import path
from . import views

urlpatterns = [
    path('channels/', views.channel_list, name='channel-list'),
    path('channels/<slug:slug>/messages/', views.channel_messages, name='channel-messages'),
    path('conversations/', views.conversation_list, name='conversation-list'),
    path('conversations/<int:conversation_id>/messages/', views.message_list, name='message-list'),
    path('conversations/<int:conversation_id>/read/', views.mark_read, name='mark-read'),
    path('notifications/', views.notification_list, name='notification-list'),
    path('users/chat-list/', views.chat_user_list, name='chat-user-list'),
]
