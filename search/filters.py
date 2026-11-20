import django_filters
from django.db.models import Q

from units.models import Unit


class UnitSearchFilter(django_filters.FilterSet):
    # نوع العرض: sale أو rent
    listing_type = django_filters.CharFilter(field_name="listing_type", lookup_expr="exact")

    # كود الوحدة: بحث جزئي غير حساس لحالة الأحرف
    code = django_filters.CharFilter(field_name="code", lookup_expr="icontains")

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
        fields = ["listing_type", "code"]

    def filter_location(self, queryset, name, value):
        return queryset.filter(
            Q(city__icontains=value)
            | Q(district__icontains=value)
            | Q(address__icontains=value)
        )