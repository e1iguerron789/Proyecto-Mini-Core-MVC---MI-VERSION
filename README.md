# Proyecto Mini Core - Aplicación de Gestión de Comisiones (Versión Elizabeth Guerrón)

## Link Video:

https://youtu.be/4aXk34PDsB0

## Link Deployed NETLIFY:

https://proyecto-mini-core-mvc-mi-version.netlify.app/

---

## Descripción General

Aplicación web desarrollada con arquitectura **MVC (Modelo - Vista - Controlador)** que combina **Django REST Framework** en el backend y **React + Vite** en el frontend.  
El objetivo principal es gestionar ventas y calcular comisiones basadas en reglas configurables, manteniendo una separación clara entre la lógica del servidor y la interfaz de usuario.

El sistema permite registrar vendedores, administrar reglas de comisión, realizar cálculos automáticos y generar reportes dinámicos.  
Esta versión adapta el proyecto de semestres anteriores e incluye despliegue completo en la nube mediante **Render** (backend) y **Netlify** (frontend).

---

## Funcionalidades Principales

- Gestión de Vendedores: crear, listar y eliminar registros.
- Gestión de Ventas: registrar ventas con monto, fecha y vendedor asignado.
- Reglas de Comisión: definir reglas según monto mínimo y porcentaje.
- Cálculo Automático: generar comisiones automáticamente según las reglas configuradas.
- Reportes y Filtros: visualizar comisiones por vendedor y filtrar por rango de fechas.
- Interfaz Reactiva: aplicación moderna con soporte para modo oscuro y diseño adaptable.

---

## Tecnologías Utilizadas

### Backend
- Python 3.11+
- Django 4.2+
- Django REST Framework
- django-cors-headers
- SQLite (desarrollo) / PostgreSQL (producción en Render)

### Frontend
- React 19 con Vite
- Axios para comunicación con la API REST
- date-fns para manejo de fechas

---

---

#
