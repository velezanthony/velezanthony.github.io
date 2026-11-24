---
slug: articles/development/python/flask/flask-dependencies
seo:
  title: "Flask dependencies: SSR or API"
  description: "What I install in Flask to get what Django ships with: ORM, migrations, forms, CSRF, login and i18n, for SSR with Jinja or for a JSON API."
  schema:
    - '@type': TechArticle
      headline: "Setting up your Flask: the essential dependencies for an SSR or API project"
      description: "What I install in Flask to get what Django ships with: ORM, migrations, forms, CSRF, login and i18n, for SSR with Jinja or for a JSON API."
      inLanguage: en
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Setting up your Flask: the essential dependencies for an SSR or API project

If you come from Django, you are moving into a furnished flat: ORM, migrations, forms, CSRF, users,
translations and the admin are already in place. [Flask](https://flask.palletsprojects.com/) is the
same flat, empty. It ships the routes and the Jinja templates; you choose every piece of furniture.

That is a good thing, but the first time you do not know what to buy. Here I explain what I install
in my Flask projects to get the same as in Django, what changes if the project serves HTML (SSR) or
a JSON API for an Angular front end or a mobile app, and how I declare it. The versions are today's;
I have checked them on PyPI.

If you are interested in how I organise the code once it is installed, I explain it in
[How I organise a growing Python project](../organizar-proyecto-django.md).

## 1. What Django ships with and what I install in Flask

| In Django | In Flask I install |
|---|---|
| The ORM | [SQLAlchemy](https://docs.sqlalchemy.org/) + [Flask-SQLAlchemy](https://flask-sqlalchemy.readthedocs.io/), which provides the `db.session` bound to the request |
| `makemigrations` and `migrate` | [Alembic](https://alembic.sqlalchemy.org/) + [Flask-Migrate](https://flask-migrate.readthedocs.io/), which wraps it in `flask db migrate` and `flask db upgrade` |
| The PostgreSQL driver | [psycopg](https://www.psycopg.org/psycopg3/docs/), same as in Django: it does not come with it there either |
| Forms and CSRF | [Flask-WTF](https://flask-wtf.readthedocs.io/): WTForms plus `CSRFProtect` |
| Sessions and login | [Flask-Login](https://flask-login.readthedocs.io/) |
| Sign-up, password recovery, roles | [Flask-Security-Too](https://flask-security.readthedocs.io/), which builds on Flask-Login. And it also brings what Django does not: two-factor authentication and *passkeys* (WebAuthn) |
| Password hashing | [argon2-cffi](https://argon2-cffi.readthedocs.io/). In Django, [Argon2 also needs this package](https://docs.djangoproject.com/en/5.2/topics/auth/passwords/) |
| Translations | [Flask-Babel](https://python-babel.github.io/flask-babel/) |
| The admin | Nothing. [Flask-Admin](https://flask-admin.readthedocs.io/) exists, but I build the screens the business needs |

One thing that surprises newcomers: in Flask, the `.env` configuration does not load itself either.
[python-dotenv](https://pypi.org/project/python-dotenv/) does it.

## 2. The base, and what each kind of project adds

Whatever the project does, this always goes in:

```toml
[project]
dependencies = [
    "Flask>=3.1,<4",
    "SQLAlchemy>=2.1,<3",        # the 2.0 style: select(), no Model.query
    "Flask-SQLAlchemy>=3.1,<4",
    "alembic>=1.20,<2",
    "Flask-Migrate>=4.1,<5",
    "psycopg[binary]>=3.3,<4",   # [binary] ships a compiled libpq: nothing to compile on deploy
    "Flask-Security-Too>=5.9,<6",
    "argon2-cffi>=25.1,<26",
    "python-dotenv>=1.2,<2",
]
```

Since version 5.5, Flask-Security-Too uses Argon2 by default, but it does not install the
algorithm: without `argon2-cffi` it starts and fails when saving the first password. Its `[common]`
extra includes it, but it also brings Flask-Mail and bcrypt; I prefer to install only what I use.

On top of that base, each kind of project adds its own pieces:

::::tabs
:::tab[SSR]
HTML screens with Jinja. The user logs in with a session cookie, so I need forms with CSRF and, if
the site has several languages, translations.

```toml
dependencies = [
    # ...the base
    "Flask-Login>=0.6,<0.7",
    "Flask-WTF>=1.3,<2",
    "Flask-Babel>=4,<5",
    "nh3>=0.3.8,<0.4",
]
```

| Package | What for |
|---|---|
| Flask-Login | The user's session: `current_user`, `login_required` |
| Flask-WTF | Validated forms and `CSRFProtect`, which protects every `POST` in the application |
| Flask-Babel | `gettext` in Python and in Jinja, and date and number formatting per language |
| [nh3](https://nh3.readthedocs.io/) | Cleaning the HTML a user writes, for example from a rich text editor, before rendering it |

Flask-Login already comes with Flask-Security-Too, but I declare it anyway: my views import it (in
point 5 I explain why).
:::
:::tab[API]
JSON for an Angular front end or a mobile app. What matters here is validating the input, typing
the output and publishing the contract.

```toml
dependencies = [
    # ...the base
    "apiflask>=3.1,<4",
    "pydantic>=2.14,<3",
]
```

[APIFlask](https://apiflask.com/) is Flask with validation and OpenAPI: `APIFlask` inherits from
`Flask` and `APIBlueprint` from `Blueprint`, so everything you know keeps working. Since version 3
it [accepts Pydantic models](https://apiflask.com/schema/pydantic/) in `@input` and `@output`
without adapters, and publishes `/openapi.json` and `/docs` on its own:

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

If the body is not valid, APIFlask responds with a 422 without reaching the view.

Authentication depends on the client:

| Client | How it authenticates |
|---|---|
| Angular on the same domain | The same session cookie as the SSR. `CSRFProtect` stays on: the front end sends the token in the `X-CSRFToken` header |
| Mobile app or another domain | A token in the header, with Flask-Security-Too's or with APIFlask's `HTTPTokenAuth`. Without a cookie there is no CSRF to protect against, so I exempt that blueprint: `csrf.exempt(api_bp)` |
:::
::::

If the project serves both, like one of mine, I install both tabs: the application is an `APIFlask`
and every screen has its JSON twin.

## 3. What Django does not ship either

You would install these pieces in Django too:

| Package | What for |
|---|---|
| [RQ](https://python-rq.org/) + [redis](https://redis.readthedocs.io/) | Background jobs: sending emails or generating a report without making the request wait. RQ needs Redis 5 or Valkey 7.2 |
| [Gunicorn](https://gunicorn.org/) | The production server. The one from `flask run` is [for development only](https://flask.palletsprojects.com/en/stable/deploying/). How I set it up with Nginx is in [Django with Docker, Gunicorn and Nginx](../../../sistemas/contenedores/django-docker-gunicorn-nginx.md) |
| [httpx](https://www.python-httpx.org/) | Calling external APIs, with a *timeout* and a sync or async client |
| [defusedxml](https://pypi.org/project/defusedxml/) | Reading XML that comes from outside without exposing yourself to an entity bomb |

RQ and redis go in the base, because the application enqueues at runtime; Gunicorn goes in a
production group, because only the server starts it.

## 4. Development and quality

| Package | What for |
|---|---|
| [pytest](https://docs.pytest.org/), [pytest-xdist](https://pytest-xdist.readthedocs.io/), [pytest-cov](https://pytest-cov.readthedocs.io/), [pytest-mock](https://pytest-mock.readthedocs.io/) | The tests, in parallel, with coverage and *mocks* |
| [Playwright](https://playwright.dev/python/) | Testing the screens in a real browser |
| [Ruff](https://docs.astral.sh/ruff/) and [Pyright](https://microsoft.github.io/pyright/) | The linter and the types |
| [types-WTForms](https://pypi.org/project/types-WTForms/) | The types WTForms does not publish |
| [Bandit](https://bandit.readthedocs.io/) and [pip-audit](https://pypi.org/project/pip-audit/) | Security flaws in the code and in the dependencies |
| [pre-commit](https://pre-commit.com/) | Running all of that before every commit |
| [Flask-DebugToolbar](https://flask-debugtoolbar.readthedocs.io/) | Seeing each screen's queries, like the Django Debug Toolbar |

## 5. How I declare them

Everything goes in a single `pyproject.toml`. The development tools go in
[dependency groups](https://packaging.python.org/en/latest/specifications/dependency-groups/), so
the production server installs only what it needs:

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

And three rules I have learnt maintaining a Flask CMS in production:

1. **If you import it, declare it.** Even if it already comes along with another package. APIFlask
   brings Pydantic and Flask-Security-Too brings Flask-Login, but the day they drop it your code
   stops starting without any warning.
2. **Ranges follow production.** The floor is the version running on the server, not the one you
   would like; the ceiling, the next major version.
3. **A security advisory raises the floor.** When pip-audit warns, the minimum moves to the version
   that fixes it, with a comment saying why. That way nobody lowers it without knowing.

## In short

| Project | What I install |
|---|---|
| Always | Flask, SQLAlchemy, Flask-SQLAlchemy, Alembic, Flask-Migrate, psycopg, Flask-Security-Too, argon2-cffi, python-dotenv |
| SSR | Flask-Login, Flask-WTF, Flask-Babel, nh3 |
| API | APIFlask and Pydantic; CSRF via header or an exempt blueprint, depending on the client |
| Jobs and production | RQ + redis, Gunicorn |
| Development | pytest and its plugins, Playwright, Ruff, Pyright, Bandit, pip-audit, pre-commit |

Django gives you the furnished flat; Flask lets you choose every piece of furniture. With this list,
the flat is just as liveable, and you know why everything is there.

The same happens on the front end. [Angular](https://angular.dev/) is the furnished flat: router,
forms, HTTP client and dependency injection come built in. [React](https://react.dev/) is the empty
flat: it renders the interface, and you choose the router, the state or the forms.

| | Everything built in | You choose each piece |
|---|---|---|
| Backend | Django | Flask |
| Front end | Angular | React |
| For | All projects look alike; fewer decisions | Only what you need; each piece, the best for your case |
| Against | You adapt to its way of doing things | You have to choose, maintain and fit together each piece |

## References

- [Flask: deploying to production](https://flask.palletsprojects.com/en/stable/deploying/)
- [Flask-SQLAlchemy](https://flask-sqlalchemy.readthedocs.io/) and [Flask-Migrate](https://flask-migrate.readthedocs.io/)
- [Flask-WTF: CSRF protection](https://flask-wtf.readthedocs.io/en/latest/csrf/)
- [Flask-Security-Too: installation and extras](https://flask-security.readthedocs.io/en/stable/installation.html)
- [Flask-Security-Too: password configuration](https://flask-security.readthedocs.io/en/stable/configuration.html)
- [APIFlask: Pydantic](https://apiflask.com/schema/pydantic/) and [authentication](https://apiflask.com/authentication/)
- [Flask-Babel](https://python-babel.github.io/flask-babel/)
- [RQ](https://python-rq.org/)
- [Dependency groups in `pyproject.toml`](https://packaging.python.org/en/latest/specifications/dependency-groups/)
