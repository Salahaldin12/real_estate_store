import django_filters
from django.db.models import Q

from units.models import Unit


class UnitSearchFilter(django_filters.FilterSet):
    # بحث بالمكان: يبحث في المدينة والحي والعنوان معًا
    location = django_filters.CharFilter(method="filter_location", label="المكان")

    # نطاق السعر
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    # نطاق المساحة
    min_area = django_filters.NumberFilter(field_name="area", lookup_expr="gte")
    max_area = django_filters.NumberFilter(field_name="area", lookup_expr="lte")

    class Meta:
        model = Unit
        fields = []

    def filter_location(self, queryset, name, value):
        return queryset.filter(
            Q(city__icontains=value)
            | Q(district__icontains=value)
            | Q(address__icontains=value)
        )