from django.contrib import admin
from .models import Vendedor, Regla, Venta, ComisionCalculada


@admin.register(Vendedor)
class VendedorAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'fecha_creacion', 'total_ventas', 'total_comisiones']
    search_fields = ['nombre']
    readonly_fields = ['fecha_creacion']
    
    def total_ventas(self, obj):
        return obj.ventas.count()
    total_ventas.short_description = 'Total Ventas'
    
    def total_comisiones(self, obj):
        total = sum([venta.calcular_comision()['comision'] for venta in obj.ventas.all()])
        return f"${total:.2f}"
    total_comisiones.short_description = 'Total Comisiones'


@admin.register(Regla)
class ReglaAdmin(admin.ModelAdmin):
    list_display = ['id', 'porcentaje_display', 'monto_minimo', 'activa', 'fecha_creacion']
    list_filter = ['activa', 'fecha_creacion']
    list_editable = ['activa']
    readonly_fields = ['fecha_creacion']
    ordering = ['monto_minimo']
    
    def porcentaje_display(self, obj):
        return f"{float(obj.porcentaje) * 100:.2f}%"
    porcentaje_display.short_description = 'Porcentaje'


@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = ['vendedor', 'fecha_venta', 'monto', 'comision_calculada_display', 'fecha_creacion']
    list_filter = ['vendedor', 'fecha_venta', 'fecha_creacion']
    search_fields = ['vendedor__nombre']
    date_hierarchy = 'fecha_venta'
    readonly_fields = ['fecha_creacion', 'fecha_modificacion']
    
    def comision_calculada_display(self, obj):
        comision_data = obj.calcular_comision()
        return f"${comision_data['comision']:.2f}"
    comision_calculada_display.short_description = 'Comisión'


@admin.register(ComisionCalculada)
class ComisionCalculadaAdmin(admin.ModelAdmin):
    list_display = ['venta', 'monto_comision', 'porcentaje_aplicado', 'regla_aplicada', 'fecha_calculo']
    list_filter = ['regla_aplicada', 'fecha_calculo']
    readonly_fields = ['fecha_calculo']
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Si el objeto ya existe
            return self.readonly_fields + ['venta', 'regla_aplicada', 'monto_comision', 'porcentaje_aplicado']
        return self.readonly_fields