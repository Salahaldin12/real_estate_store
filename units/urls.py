from django.conf.urls.static import static
from django.urls import path
from django.views.generic import TemplateView

from real_estate_store import settings

from .views import UnitViewSet

unit_list = UnitViewSet.as_view({"get": "list"})
unit_detail = UnitViewSet.as_view({"get": "retrieve"})

urlpatterns = [
    
    path("", unit_list, name="unit-list"),
    path("<int:pk>/", unit_detail, name="unit-detail"),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)