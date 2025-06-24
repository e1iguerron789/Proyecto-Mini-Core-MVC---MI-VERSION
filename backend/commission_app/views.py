from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count, Avg
from datetime import datetime
from decimal import Decimal

from .models import Vendedor, Regla, Venta, ComisionCalculada
from .serializers import (
    VendedorSerializer, ReglaSerializer, VentaSerializer, 
    ComisionCalculadaSerializer, CalcularComisionesSerializer,
    ResumenComisionesSerializer
)


class VendedorViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar vendedores"""
    queryset = Vendedor.objects.all()
    serializer_class = VendedorSerializer
    
    @action(detail=True, methods=['get'])
    def ventas(self, request, pk=None):
        """Obtener todas las ventas de un vendedor específico"""
        vendedor = self.get_object()
        ventas = vendedor.ventas.all()
        serializer = VentaSerializer(ventas, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def comisiones(self, request, pk=None):
        """Obtener resumen de comisiones de un vendedor específico"""
        vendedor = self.get_object()
        ventas = vendedor.ventas.all()
        
        total_comisiones = Decimal('0.00')
        total_ventas = Decimal('0.00')
        ventas_con_comision = []
        
        for venta in ventas:
            comision_data = venta.calcular_comision()
            total_comisiones += comision_data['comision']
            total_ventas += venta.monto
            
            ventas_con_comision.append({
                'venta_id': venta.id,
                'fecha': venta.fecha_venta,
                'monto': venta.monto,
                'comision': comision_data['comision'],
                'porcentaje': comision_data['porcentaje']
            })
        
        return Response({
            'vendedor': vendedor.nombre,
            'total_ventas': len(ventas_con_comision),
            'total_monto_ventas': total_ventas,
            'total_comisiones': total_comisiones,
            'promedio_comision': total_comisiones / len(ventas_con_comision) if ventas_con_comision else 0,
            'ventas': ventas_con_comision
        })


class ReglaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar reglas de comisión"""
    queryset = Regla.objects.filter(activa=True).order_by('monto_minimo')
    serializer_class = ReglaSerializer


class VentaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar ventas"""
    queryset = Venta.objects.all()
    serializer_class = VentaSerializer
    
    def get_queryset(self):
        queryset = Venta.objects.all()
        vendedor_id = self.request.query_params.get('vendedor', None)
        if vendedor_id is not None:
            queryset = queryset.filter(vendedor__id=vendedor_id)
    
        fecha_inicio = self.request.query_params.get('fecha_inicio', None)
        fecha_fin = self.request.query_params.get('fecha_fin', None)
        
        if fecha_inicio:
            queryset = queryset.filter(fecha_venta__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha_venta__lte=fecha_fin)
        
        return queryset.order_by('-fecha_venta')


class ComisionCalculadaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet de solo lectura para comisiones calculadas"""
    queryset = ComisionCalculada.objects.all()
    serializer_class = ComisionCalculadaSerializer


class CalcularComisionesView(APIView):
    """Vista para calcular comisiones por rango de fechas con detalles individuales"""
    
    def post(self, request):
        serializer = CalcularComisionesSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        fecha_inicio = serializer.validated_data['fecha_inicio']
        fecha_fin = serializer.validated_data['fecha_fin']
        ventas = Venta.objects.filter(
            fecha_venta__gte=fecha_inicio,
            fecha_venta__lte=fecha_fin
        ).select_related('vendedor').order_by('vendedor__nombre', 'fecha_venta')
        
        vendedores_comisiones = {}
        
        for venta in ventas:
            vendedor_nombre = venta.vendedor.nombre
            
            if vendedor_nombre not in vendedores_comisiones:
                vendedores_comisiones[vendedor_nombre] = {
                    'vendedor_id': venta.vendedor.id,
                    'vendedor_nombre': vendedor_nombre,
                    'total_ventas': 0,
                    'total_monto_ventas': Decimal('0.00'),
                    'total_comisiones': Decimal('0.00'),
                    'ventas_detalle': [],
                    'comisiones_individuales': []
                }
            
            comision_data = venta.calcular_comision()
        
            vendedores_comisiones[vendedor_nombre]['total_ventas'] += 1
            vendedores_comisiones[vendedor_nombre]['total_monto_ventas'] += venta.monto
            vendedores_comisiones[vendedor_nombre]['total_comisiones'] += comision_data['comision']
            vendedores_comisiones[vendedor_nombre]['ventas_detalle'].append({
                'venta_id': venta.id,
                'fecha': venta.fecha_venta,
                'monto': venta.monto,
                'comision': comision_data['comision'],
                'porcentaje': comision_data['porcentaje'],
                'regla_aplicada': comision_data['regla_aplicada'].id if comision_data['regla_aplicada'] else None
            })
            
            vendedores_comisiones[vendedor_nombre]['comisiones_individuales'].append({
                'id': venta.id,
                'fecha': venta.fecha_venta.strftime('%d/%m/%Y'),
                'monto_venta': float(venta.monto),
                'porcentaje_aplicado': float(comision_data['porcentaje']),
                'monto_comision': float(comision_data['comision']),
                'regla_aplicada': {
                    'id': comision_data['regla_aplicada'].id if comision_data['regla_aplicada'] else None,
                    'descripcion': f"{float(comision_data['porcentaje']) * 100:.2f}% - Min: ${comision_data['regla_aplicada'].monto_minimo}" if comision_data['regla_aplicada'] else "Sin regla aplicable"
                }
            })
        
        for vendedor_data in vendedores_comisiones.values():
            if vendedor_data['total_monto_ventas'] > 0:
                vendedor_data['porcentaje_promedio'] = (
                    vendedor_data['total_comisiones'] / vendedor_data['total_monto_ventas']
                )
            else:
                vendedor_data['porcentaje_promedio'] = Decimal('0.0000')
        
        resultado = list(vendedores_comisiones.values())
        resultado.sort(key=lambda x: x['total_comisiones'], reverse=True)
        
        return Response({
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'total_vendedores': len(resultado),
            'total_ventas': sum(v['total_ventas'] for v in resultado),
            'total_monto_ventas': sum(v['total_monto_ventas'] for v in resultado),
            'total_comisiones': sum(v['total_comisiones'] for v in resultado),
            'periodo_info': {
                'dias_total': (fecha_fin - fecha_inicio).days + 1,
                'fecha_inicio_formateada': fecha_inicio.strftime('%d/%m/%Y'),
                'fecha_fin_formateada': fecha_fin.strftime('%d/%m/%Y')
            },
            'vendedores': resultado
        })


class ResumenComisionesView(APIView):
    """Vista para obtener resumen general de comisiones"""
    
    def get(self, request):
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        ventas_query = Venta.objects.all()
        
        if fecha_inicio:
            ventas_query = ventas_query.filter(fecha_venta__gte=fecha_inicio)
        if fecha_fin:
            ventas_query = ventas_query.filter(fecha_venta__lte=fecha_fin)
        
        total_ventas = ventas_query.count()
        total_monto = ventas_query.aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
        
        total_comisiones = Decimal('0.00')
        for venta in ventas_query:
            comision_data = venta.calcular_comision()
            total_comisiones += comision_data['comision']
        
        return Response({
            'periodo': {
                'fecha_inicio': fecha_inicio,
                'fecha_fin': fecha_fin
            },
            'resumen': {
                'total_ventas': total_ventas,
                'total_monto_ventas': total_monto,
                'total_comisiones': total_comisiones,
                'promedio_comision_por_venta': total_comisiones / total_ventas if total_ventas > 0 else 0,
                'porcentaje_comision_total': (total_comisiones / total_monto * 100) if total_monto > 0 else 0
            }
        })