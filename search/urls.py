from django.urls import path
from .views import UnitSearchView

urlpatterns = [
    path("global-search", UnitSearchView.as_view()),
]