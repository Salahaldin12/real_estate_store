from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from rest_framework.generics import ListAPIView

from units.models import Unit
from units.serializers import UnitSerializer

from .filters import UnitSearchFilter


class UnitSearchView(ListAPIView):
    queryset = Unit.objects.prefetch_related("images")
    serializer_class = UnitSerializer

    # الفلترة (المكان، السعر، المساحة) + إمكانية الترتيب
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = UnitSearchFilter

    # الترتيب: ?ordering=price أو ?ordering=-price
    ordering_fields = ["price", "area", "created_at"]
    ordering = ["-created_at"]