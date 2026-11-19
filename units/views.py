from rest_framework import viewsets

from .models import Unit
from .serializers import UnitSerializer


class UnitViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer

    # الفلترة بقيمة مطابقة: ?category=villa&floor=1
    filterset_fields = ["listing_type", "category", "finishing", "floor", "city", "district"]

    # البحث النصي: ?search=التجمع
    search_fields = ["name", "city", "district", "address"]

    # الترتيب: ?ordering=price أو ?ordering=-price
    ordering_fields = ["price", "area", "created_at"]