
from django.conf.urls.static import static
from django.contrib import admin

from django.urls import include, path
from django.views.generic import TemplateView

from real_estate_store import settings

urlpatterns = [
    path("unit/<int:pk>/", TemplateView.as_view(template_name="unit.html")),
    path("", TemplateView.as_view(template_name="index.html")),
    path('admin/', admin.site.urls),

    path('api/units/', include('units.urls')),
    path('api/search/', include('search.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)