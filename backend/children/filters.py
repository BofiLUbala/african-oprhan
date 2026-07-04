import django_filters
from .models import ChildHistory


class ChildHistoryFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(lookup_expr='exact')
    event_type = django_filters.CharFilter(lookup_expr='exact')
    priority = django_filters.CharFilter(lookup_expr='exact')
    source_module = django_filters.CharFilter(lookup_expr='exact')
    statut_validation = django_filters.CharFilter(lookup_expr='exact')
    niveau_sensibilite = django_filters.CharFilter(lookup_expr='exact')
    performed_by = django_filters.NumberFilter(lookup_expr='exact')
    performed_role = django_filters.CharFilter(lookup_expr='exact')

    date_from = django_filters.DateTimeFilter(field_name='event_date', lookup_expr='gte')
    date_to = django_filters.DateTimeFilter(field_name='event_date', lookup_expr='lte')

    search = django_filters.CharFilter(method='filter_search')

    status_change_only = django_filters.BooleanFilter(method='filter_status_only')

    class Meta:
        model = ChildHistory
        fields = [
            'category', 'event_type', 'priority', 'source_module',
            'statut_validation', 'niveau_sensibilite',
            'performed_by', 'performed_role',
            'date_from', 'date_to', 'search',
        ]

    def filter_search(self, queryset, name, value):
        from django.db.models import Q
        return queryset.filter(
            Q(title__icontains=value) |
            Q(description__icontains=value) |
            Q(reason__icontains=value) |
            Q(old_value__icontains=value) |
            Q(new_value__icontains=value) |
            Q(note__icontains=value)
        )

    def filter_status_only(self, queryset, name, value):
        if value:
            return queryset.filter(event_type='status_change')
        return queryset
