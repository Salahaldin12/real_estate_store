from rest_framework import viewsets

from .models import Unit
from .serializers import UnitSerializer


class UnitViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Unit.objects.prefetch_related("images")
    serializer_class = UnitSerializer

    # الفلترة بقيمة مطابقة: ?category=villa&floor=1&rooms=3
    filterset_fields = [
        "listing_type",
        "code",
        "category",
        "finishing",
        "floor",
        "rooms",
        "city",
        "district",
    ]

    # البحث النصي: ?search=التجمع أو بكود الوحدة
    search_fields = ["code", "name", "city", "district", "address"]

    # الترتيب: ?ordering=price أو ?ordering=-price أو ?ordering=rooms
    ordering_fields = ["price", "area", "rooms", "created_at"]