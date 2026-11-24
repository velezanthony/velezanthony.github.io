---
seo:
  title: "Dependencias de Flask: SSR o API"
  description: "Qué instalo en Flask para tener lo que Django trae de serie: ORM, migraciones, formularios, CSRF, login e i18n, para SSR con Jinja o para una API JSON."
  image:
    src: /og/articulos/desarrollo/python/flask/flask-dependencias.png
    alt: "Dependencias de Flask: SSR o API"
  schema:
    - '@type': TechArticle
      headline: "Montar tu Flask: las dependencias indispensables para un entorno SSR o API"
      description: "Qué instalo en Flask para tener lo que Django trae de serie: ORM, migraciones, formularios, CSRF, login e i18n, para SSR con Jinja o para una API JSON."
      image: https://velezanthony.github.io/og/articulos/desarrollo/python/flask/flask-dependencias.png
      inLanguage: es
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Montar tu Flask: las dependencias indispensables para un entorno SSR o API

Si vienes de Django, llegas a un piso amueblado: ORM, migraciones, formularios, CSRF, usuarios,
traducciones y el admin ya están en su sitio. [Flask](https://flask.palletsprojects.com/) es el
mismo piso, vacío. Trae las rutas y las plantillas Jinja; cada mueble lo eliges tú.

Eso es bueno, pero la primera vez no sabes qué comprar. Aquí cuento qué instalo en mis proyectos
Flask para tener lo mismo que en Django, qué cambia si el proyecto sirve HTML (SSR) o una API JSON
para un front en Angular o una aplicación móvil, y cómo lo declaro. Las versiones son las de hoy;
las he comprobado en PyPI.

Si te interesa cómo organizo el código una vez instalado, lo cuento en
[Cómo organizo un proyecto Python que crece](../organizar-proyecto-django.md).

## 1. Lo que trae Django y qué instalo en Flask

| En Django | En Flask instalo |
|---|---|
| El ORM | [SQLAlchemy](https://docs.sqlalchemy.org/) + [Flask-SQLAlchemy](https://flask-sqlalchemy.readthedocs.io/), que da la sesión `db.session` atada a la petición |
| `makemigrations` y `migrate` | [Alembic](https://alembic.sqlalchemy.org/) + [Flask-Migrate](https://flask-migrate.readthedocs.io/), que lo envuelve en `flask db migrate` y `flask db upgrade` |
| El driver de PostgreSQL | [psycopg](https://www.psycopg.org/psycopg3/docs/), igual que en Django: ahí tampoco viene |
| Formularios y CSRF | [Flask-WTF](https://flask-wtf.readthedocs.io/): WTForms más `CSRFProtect` |
| La sesión y el login | [Flask-Login](https://flask-login.readthedocs.io/) |
| Registro, recuperar contraseña, roles | [Flask-Security-Too](https://flask-security.readthedocs.io/), que se apoya en Flask-Login. Y además trae lo que Django no: segundo factor y *passkeys* (WebAuthn) |
| El hash de contraseñas | [argon2-cffi](https://argon2-cffi.readthedocs.io/). En Django, [Argon2 también pide este paquete](https://docs.djangoproject.com/es/5.2/topics/auth/passwords/) |
| Traducciones | [Flask-Babel](https://python-babel.github.io/flask-babel/) |
| El admin | Nada. Existe [Flask-Admin](https://flask-admin.readthedocs.io/), pero yo construyo las pantallas que el negocio necesita |

Una cosa que sorprende al llegar: en Flask, la configuración del `.env` tampoco se carga sola.
Lo hace [python-dotenv](https://pypi.org/project/python-dotenv/).

## 2. La base, y lo que añade cada tipo de proyecto

Haga lo que haga el proyecto, esto va siempre:

```toml
[project]
dependencies = [
    "Flask>=3.1,<4",
    "SQLAlchemy>=2.1,<3",        # el estilo 2.0: select(), nada de Model.query
    "Flask-SQLAlchemy>=3.1,<4",
    "alembic>=1.20,<2",
    "Flask-Migrate>=4.1,<5",
    "psycopg[binary]>=3.3,<4",   # [binary] trae la libpq compilada: nada que compilar al desplegar
    "Flask-Security-Too>=5.9,<6",
    "argon2-cffi>=25.1,<26",
    "python-dotenv>=1.2,<2",
]
```

Desde la versión 5.5, Flask-Security-Too usa Argon2 por defecto, pero no instala el algoritmo: sin
`argon2-cffi` arranca y falla al guardar la primera contraseña. Su extra `[common]` lo incluye, pero
también trae Flask-Mail y bcrypt; yo prefiero instalar solo lo que uso.

Sobre esa base, cada tipo de proyecto añade sus piezas:

::::tabs
:::tab[SSR]
Pantallas en HTML con Jinja. El usuario entra con una cookie de sesión, así que necesito
formularios con CSRF y, si el sitio tiene varios idiomas, traducciones.

```toml
dependencies = [
    # ...la base
    "Flask-Login>=0.6,<0.7",
    "Flask-WTF>=1.3,<2",
    "Flask-Babel>=4,<5",
    "nh3>=0.3.8,<0.4",
]
```

| Paquete | Para qué |
|---|---|
| Flask-Login | La sesión del usuario: `current_user`, `login_required` |
| Flask-WTF | Formularios validados y `CSRFProtect`, que protege todos los `POST` de la aplicación |
| Flask-Babel | `gettext` en Python y en Jinja, y el formato de fechas y números por idioma |
| [nh3](https://nh3.readthedocs.io/) | Limpiar el HTML que escribe un usuario, por ejemplo desde un editor de texto enriquecido, antes de pintarlo |

Flask-Login ya llega con Flask-Security-Too, pero lo declaro igual: mis vistas lo importan (en el
punto 5 explico por qué).
:::
:::tab[API]
JSON para un front en Angular o una aplicación móvil. Aquí lo importante es validar la entrada,
tipar la salida y publicar el contrato.

```toml
dependencies = [
    # ...la base
    "apiflask>=3.1,<4",
    "pydantic>=2.14,<3",
]
```

[APIFlask](https://apiflask.com/) es Flask con validación y OpenAPI: `APIFlask` hereda de `Flask`
y `APIBlueprint` de `Blueprint`, así que lo de siempre sigue funcionando. Desde la versión 3
[acepta modelos de Pydantic](https://apiflask.com/schema/pydantic/) en `@input` y `@output` sin
adaptadores, y publica `/openapi.json` y `/docs` solo:

```python
class PetIn(BaseModel):
    name: str


class PetOut(BaseModel):
    id: int
    name: str


@api.post("/pets")
@api.input(PetIn)
@api.output(PetOut, status_code=201)
def create_pet(json_data: PetIn) -> PetOut:
    pet = create_pet_service(name=json_data.name)
    return PetOut.model_validate(pet, from_attributes=True)
```

Si el cuerpo no es válido, APIFlask responde un 422 sin llegar a la vista.

La autenticación depende del cliente:

| Cliente | Cómo se autentica |
|---|---|
| Angular en el mismo dominio | La misma cookie de sesión que el SSR. `CSRFProtect` sigue activo: el front manda el token en la cabecera `X-CSRFToken` |
| Aplicación móvil u otro dominio | Un token en la cabecera, con el de Flask-Security-Too o con `HTTPTokenAuth` de APIFlask. Sin cookie no hay CSRF que proteger, así que eximo ese blueprint: `csrf.exempt(api_bp)` |
:::
::::

Si el proyecto sirve las dos cosas, como uno de los míos, instalo ambas pestañas: la aplicación es
un `APIFlask` y cada pantalla tiene su gemelo JSON.

## 3. Lo que tampoco trae Django

Estas piezas las instalarías igual en Django:

| Paquete | Para qué |
|---|---|
| [RQ](https://python-rq.org/) + [redis](https://redis.readthedocs.io/) | Tareas en segundo plano: enviar correos o generar un informe sin hacer esperar a la petición. RQ necesita Redis 5 o Valkey 7.2 |
| [Gunicorn](https://gunicorn.org/) | El servidor de producción. El de `flask run` es [solo para desarrollo](https://flask.palletsprojects.com/en/stable/deploying/). Cómo lo monto con Nginx, en [Django con Docker, Gunicorn y Nginx](../../../sistemas/contenedores/django-docker-gunicorn-nginx.md) |
| [httpx](https://www.python-httpx.org/) | Llamar a APIs externas, con *timeout* y cliente síncrono o asíncrono |
| [defusedxml](https://pypi.org/project/defusedxml/) | Leer XML que llega de fuera sin exponerte a una bomba de entidades |

RQ y redis van en la base, porque la aplicación encola en tiempo de ejecución; Gunicorn, en un grupo
de producción, porque solo lo arranca el servidor.

## 4. Desarrollo y calidad

| Paquete | Para qué |
|---|---|
| [pytest](https://docs.pytest.org/), [pytest-xdist](https://pytest-xdist.readthedocs.io/), [pytest-cov](https://pytest-cov.readthedocs.io/), [pytest-mock](https://pytest-mock.readthedocs.io/) | Los tests, en paralelo, con cobertura y *mocks* |
| [Playwright](https://playwright.dev/python/) | Probar las pantallas en un navegador real |
| [Ruff](https://docs.astral.sh/ruff/) y [Pyright](https://microsoft.github.io/pyright/) | El linter y los tipos |
| [types-WTForms](https://pypi.org/project/types-WTForms/) | Los tipos que WTForms no publica |
| [Bandit](https://bandit.readthedocs.io/) y [pip-audit](https://pypi.org/project/pip-audit/) | Fallos de seguridad en el código y en las dependencias |
| [pre-commit](https://pre-commit.com/) | Pasar todo eso antes de cada commit |
| [Flask-DebugToolbar](https://flask-debugtoolbar.readthedocs.io/) | Ver las consultas de cada pantalla, como la Django Debug Toolbar |

## 5. Cómo las declaro

Todo va en un único `pyproject.toml`. Lo de desarrollo, en
[grupos de dependencias](https://packaging.python.org/en/latest/specifications/dependency-groups/),
para que el servidor de producción instale solo lo suyo:

```toml
[dependency-groups]
prod = ["gunicorn>=27,<28"]
test = ["pytest>=9.2,<10", "pytest-xdist>=3.8", "pytest-cov>=7.1", "pytest-mock>=3.17", "playwright>=1.65"]
lint = ["ruff>=0.17", "pyright>=1.1.414", "types-wtforms>=3.3"]
security = ["bandit>=1.9", "pip-audit>=2.10"]
dev = [
    { include-group = "prod" }, { include-group = "test" },
    { include-group = "lint" }, { include-group = "security" },
    "pre-commit>=4.7",
    "Flask-DebugToolbar>=0.16,<0.17",
]
```

Y tres reglas que he aprendido manteniendo un CMS en Flask en producción:

1. **Si lo importas, decláralo.** Aunque ya llegue colgando de otro paquete. APIFlask trae Pydantic
   y Flask-Security-Too trae Flask-Login, pero el día que lo suelten tu código deja de arrancar sin
   que nada lo avise.
2. **Los rangos siguen a producción.** El suelo es la versión que corre en el servidor, no la que
   te gustaría; el techo, la siguiente versión mayor.
3. **Un aviso de seguridad sube el suelo.** Cuando pip-audit avisa, el mínimo pasa a la versión que
   lo corrige, con un comentario que diga por qué. Así nadie lo baja sin saberlo.

## En resumen

| Proyecto | Qué instalo |
|---|---|
| Siempre | Flask, SQLAlchemy, Flask-SQLAlchemy, Alembic, Flask-Migrate, psycopg, Flask-Security-Too, argon2-cffi, python-dotenv |
| SSR | Flask-Login, Flask-WTF, Flask-Babel, nh3 |
| API | APIFlask y Pydantic; CSRF por cabecera o blueprint exento, según el cliente |
| Tareas y producción | RQ + redis, Gunicorn |
| Desarrollo | pytest y sus plugins, Playwright, Ruff, Pyright, Bandit, pip-audit, pre-commit |

Django te da el piso amueblado; Flask te deja elegir cada mueble. Con esta lista, el piso queda
igual de habitable, y sabes por qué está cada cosa.

En el front pasa lo mismo. [Angular](https://angular.dev/) es el piso amueblado: router,
formularios, cliente HTTP e inyección de dependencias vienen de serie. [React](https://react.dev/)
es el piso vacío: pinta la interfaz, y el router, el estado o los formularios los eliges tú.

| | Todo de serie | Eliges cada pieza |
|---|---|---|
| Backend | Django | Flask |
| Front | Angular | React |
| A favor | Todos los proyectos se parecen; menos decisiones | Solo lo que necesitas; cada pieza, la mejor para tu caso |
| En contra | Te adaptas a su forma de hacer las cosas | Hay que elegir, mantener y hacer encajar cada pieza |

## Referencias

- [Flask: despliegue en producción](https://flask.palletsprojects.com/en/stable/deploying/)
- [Flask-SQLAlchemy](https://flask-sqlalchemy.readthedocs.io/) y [Flask-Migrate](https://flask-migrate.readthedocs.io/)
- [Flask-WTF: protección CSRF](https://flask-wtf.readthedocs.io/en/latest/csrf/)
- [Flask-Security-Too: instalación y extras](https://flask-security.readthedocs.io/en/stable/installation.html)
- [Flask-Security-Too: configuración de contraseñas](https://flask-security.readthedocs.io/en/stable/configuration.html)
- [APIFlask: Pydantic](https://apiflask.com/schema/pydantic/) y [autenticación](https://apiflask.com/authentication/)
- [Flask-Babel](https://python-babel.github.io/flask-babel/)
- [RQ](https://python-rq.org/)
- [Grupos de dependencias en `pyproject.toml`](https://packaging.python.org/en/latest/specifications/dependency-groups/)
