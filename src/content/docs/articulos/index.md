---
seo:
  description: "Artículos técnicos sobre Django, Python, arquitectura de aplicaciones e infraestructura: rendimiento, multi-tenancy, tipado, Docker, AWS y Proxmox."
---

# Artículos

Notas técnicas sobre problemas que me he encontrado y cómo los resuelvo, agrupadas por área.

## Desarrollo

- **Conceptos**
  - [API REST y SPA vs monolito con HTMX y Alpine](api-rest-spa-vs-htmx.md): con cuál es más
    sencillo cada aspecto, y cómo decido.
- **Python**
  - [Un ORM tipado sin generar código](orm-tipado-sin-generar-codigo.md): cómo conseguir que mypy
    y Pyright entiendan un ORM con descriptores, genéricos y `dataclass_transform`.
  - **Django**
    - [Consultas N+1 en Django](consultas-n-mas-1-django.md): qué son, cómo detectarlas y cómo
      organizar las consultas para que no vuelvan.
    - [Multi-tenancy en Django](multi-tenancy-django.md): cuatro estrategias para aislar a los
      clientes de un SaaS y cuándo elegir cada una.
- **TypeScript**
  - **Angular**
    - [Directiva o componente para un input en Angular](angular-directivas-o-componentes.md): por
      qué con Reactive Forms prefiero una directiva sobre el input nativo, y cuándo no.
    - [Tu componente de Angular no ocupa el ancho](angular-componente-no-ocupa-el-ancho.md): el
      elemento host que envuelve cada componente, por qué es `inline` y cómo arreglarlo.

## Sistemas

- **Cloud**
  - **AWS**
    - [Arquitectura básica en AWS](aws-arquitectura-basica.md): las piezas básicas, Django en AWS
      y webs estáticas con S3 y CloudFront.
- **Contenedores**
  - [Django con Docker, Gunicorn y Nginx](django-docker-gunicorn-nginx.md): un despliegue
    completo con Dockerfile, Gunicorn, Nginx y PostgreSQL en Compose.
- **Virtualización**
  - [Proxmox para un laboratorio o preproducción](proxmox-laboratorio.md): qué es Proxmox VE, para
    qué lo uso y por qué no lo elegiría para producción seria.
