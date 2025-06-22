from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router para las APIs REST
router = DefaultRouter()
router.register(r'vendedores', views.VendedorViewSet)
router.register(r'reglas', views.ReglaViewSet)
router.register(r'ventas', views.VentaViewSet)
router.register(r'comisiones-calculadas', views.ComisionCalculadaViewSet)

urlpatterns = [
    # API endpoints usando ViewSets
    path('', include(router.urls)),
    
    # Endpoints personalizados para cálculo de comisiones
    path('comisiones/calcular/', views.CalcularComisionesView.as_view(), name='calcular-comisiones'),
    path('comisiones/resumen/', views.ResumenComisionesView.as_view(), name='resumen-comisiones'),
    
    # API browser para desarrollo
    path('api-auth/', include('rest_framework.urls')),
]