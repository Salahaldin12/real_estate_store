from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from rest_framework.generics import ListAPIView

from units.models import Unit
from units.serializers import UnitSerializer

from .filters import UnitSearchFilter


class UnitSearchView(ListAPIView):
    queryset = Unit.objects.prefetch_related("images")
    serializer_class = UnitSerializer

    # الفلترة (النوع، الكود، المكان، السعر، المساحة) + الترتيب
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = UnitSearchFilter

    # الترتيب: ?ordering=price أو ?ordering=-price أو ?ordering=rooms
    ordering_fields = ["price", "area", "rooms", "created_at"]
    ordering = ["-created_at"]