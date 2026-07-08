from django.urls import path
from . import views

urlpatterns = [
    # User Management (Module 3)
    path("admin/users/", views.admin_user_list, name="admin-user-list"),
    path("admin/users/<int:user_id>/", views.admin_user_detail, name="admin-user-detail"),
    path("admin/users/<int:user_id>/toggle-active/", views.admin_user_toggle_active, name="admin-user-toggle-active"),

    # Subscription Plans (Module 4)
    path("admin/subscription-plans/", views.subscription_plan_list, name="subscription-plan-list"),
    path("admin/subscription-plans/<int:plan_id>/", views.subscription_plan_detail, name="subscription-plan-detail"),
    path("admin/subscriptions/", views.organization_subscription_list, name="organization-subscription-list"),
    path("admin/subscriptions/<int:sub_id>/", views.organization_subscription_detail, name="organization-subscription-detail"),
    path("admin/invoices/", views.invoice_list, name="invoice-list"),

    # Platform Monitoring (Module 7)
    path("admin/health/", views.platform_health, name="platform-health"),
    path("admin/metrics/", views.platform_metrics, name="platform-metrics"),

    # Audit Logs (Module 8)
    path("admin/audit-logs/", views.audit_log_list, name="audit-log-list"),

    # Financial Management (Module 9)
    path("admin/finance/summary/", views.finance_summary, name="finance-summary"),
    path("admin/donations/<int:donation_id>/", views.admin_donation_detail, name="admin-donation-detail"),
    path("admin/donations/summary/", views.admin_donation_summary, name="admin-donation-summary"),

    # Security Center (Module 14)
    path("admin/security/login-attempts/", views.login_attempt_list, name="login-attempt-list"),
    path("admin/security/events/", views.security_event_list, name="security-event-list"),
    path("admin/security/ip-blocks/", views.ip_block_list, name="ip-block-list"),
    path("admin/security/ip-blocks/<int:block_id>/", views.ip_block_detail, name="ip-block-detail"),

    # System Settings (Module 15)
    path("admin/settings/", views.system_config_list, name="system-config-list"),
    path("admin/settings/bulk/", views.system_config_bulk_update, name="system-config-bulk"),
    path("admin/settings/<int:config_id>/", views.system_config_detail, name="system-config-detail"),

    # Reports (Module 16)
    path("admin/reports/", views.report_list, name="report-list"),
    path("admin/reports/<int:report_id>/", views.report_detail, name="report-detail"),
    path("admin/reports/<int:report_id>/generate/", views.report_generate, name="report-generate"),
    path("admin/report-schedules/", views.report_schedule_list, name="report-schedule-list"),

    # Support Center (Module 18)
    path("admin/support/tickets/", views.support_ticket_list, name="support-ticket-list"),
    path("admin/support/tickets/<int:ticket_id>/", views.support_ticket_detail, name="support-ticket-detail"),
    path("admin/support/tickets/<int:ticket_id>/comments/", views.ticket_comment_list, name="ticket-comment-list"),

    # Document Management (Module 17)
    path("admin/documents/", views.platform_document_list, name="platform-document-list"),
    path("admin/documents/<int:doc_id>/", views.platform_document_detail, name="platform-document-detail"),

    # Activity Feed (Module 19)
    path("admin/activity-feed/", views.activity_feed, name="activity-feed"),

    # Children Management (Module 6 - read-only)
    path("admin/children/", views.admin_children_list, name="admin-children-list"),

    # Content Management (Module 11)
    path("admin/content/summary/", views.admin_content_summary, name="admin-content-summary"),

    # Communication Center (Module 12)
    path("admin/communication/summary/", views.admin_communication_summary, name="admin-communication-summary"),

    # Aggregated summaries
    path("admin/dashboard/summary/", views.admin_dashboard_summary, name="admin-dashboard-summary"),
    path("admin/subscriptions/summary/", views.admin_subscription_summary, name="admin-subscription-summary"),
    path("admin/security/summary/", views.admin_security_summary, name="admin-security-summary"),
]
