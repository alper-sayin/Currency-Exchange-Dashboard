from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExchangeRateViewSet, CurrencyViewSet

router = DefaultRouter()
router.register(r'exchange-rates', ExchangeRateViewSet, basename='exchange-rates')
router.register(r'currencies', CurrencyViewSet, basename='currencies')

urlpatterns = router.urls