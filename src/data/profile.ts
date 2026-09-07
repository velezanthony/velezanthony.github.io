import type { ContactLink, SpokenLanguage, StackGroup, Localized } from '@data/types';

export const profile = {
  name: 'Anthony Velez Tapia',

  headline: {
    es: 'Desarrollador Full Stack y administrador de sistemas. Django y Python con Angular; antes .NET, Java, Laravel y Symfony. Construyo herramientas open source para el día a día del desarrollador.',
    en: 'Full Stack Developer and systems administrator. Django and Python with Angular; .NET, Java, Laravel and Symfony before that. I build open source tools for a developer’s day-to-day.',
  } satisfies Localized,

  summary: {
    es: '**Cuatro años, seis stacks y tres arquitecturas en producción**: API REST con clientes desacoplados, SPA y monolito SSR con HTMX. Diseño el modelo de datos —SQL Server y PostgreSQL, database first y code first— y **levanté en solitario un SaaS multi-tenant hasta producción**. Hoy defino la **arquitectura de código** del refactor de un marketplace SaaS, en un equipo de cuatro. Bajé su página principal de **12 s a 1–2 s** optimizando consultas. Antes llevé la **infraestructura AWS completa** de las startups de una venture builder y monté su preproducción on-premise en Proxmox. **Cinco herramientas open source propias, dos en PyPI**, entre ellas un ORM en Python que mypy y Pyright resuelven sin generación de código.',
    en: '**Four years, six stacks and three architectures in production**: REST APIs with decoupled clients, SPAs and SSR monoliths with HTMX. I design the data model —SQL Server and PostgreSQL, database first and code first— and **took a multi-tenant SaaS to production single-handedly**. Today I define the **code architecture** for the refactor of a SaaS marketplace, in a team of four. I brought its main page down from **12 s to 1–2 s** by optimising queries. Before that I ran the **full AWS infrastructure** of a venture builder’s startups and built their on-premise pre-production on Proxmox. **Five open source tools of my own, two on PyPI**, among them a Python ORM whose typing mypy and Pyright resolve with no code generation.',
  } satisfies Localized,

  location: 'Hernani, Gipuzkoa',

  availability: {
    es: 'Híbrido en Gipuzkoa · Remoto en España · Proyectos freelance',
    en: 'Hybrid in Gipuzkoa · Remote within Spain · Freelance projects',
  } satisfies Localized,

  photo: '/photo.png',
} as const;

export const stackGroups: StackGroup[] = [
  {
    label: { es: 'Backend', en: 'Backend' },
    items: 'Python, Django, Flask, PHP, Laravel, Symfony, C# / .NET, Java',
  },
  {
    label: { es: 'Frontend', en: 'Frontend' },
    items: 'TypeScript, JavaScript, Angular, React, Astro, HTML, CSS, Tailwind CSS, Bootstrap, Alpine.js, HTMX',
  },
  {
    label: { es: 'Bases de datos', en: 'Databases' },
    items: 'PostgreSQL, MySQL / MariaDB, SQL Server',
  },
  {
    label: { es: 'Cloud y DevOps', en: 'Cloud and DevOps' },
    items: 'AWS (EC2, ECR, RDS, S3, Lambda, VPC, Load Balancer), Docker, GitHub Actions, Gunicorn / WSGI',
  },
  {
    label: { es: 'Sistemas y redes', en: 'Systems and networking' },
    items: 'Linux / Windows Server, Active Directory, DNS, Nginx, Apache, Proxmox, SSH, VitalPBX / Asterisk',
  },
  {
    label: { es: 'Herramientas', en: 'Tools' },
    items: 'Git / GitHub, uv, Ruff, MyPy, pytest, Figma',
  },
];

/**
 * Page titles. Separate from the in-page headings: a heading names the section
 * for a reader who is already here, a title has to earn the click from a SERP.
 */
export const pageTitles = {
  home: {
    es: 'Desarrollador Full Stack en Gipuzkoa',
    en: 'Full Stack Developer in Gipuzkoa, Spain',
  },
  experience: {
    es: 'Experiencia: Django, AWS y sistemas',
    en: 'Experience: Django, AWS and systems',
  },
  projects: {
    es: 'Herramientas open source para Django y Docker',
    en: 'Open source tools for Django and Docker',
  },
  cv: {
    es: 'CV · Desarrollador Full Stack y sistemas',
    en: 'CV · Full Stack Developer and systems',
  },
} satisfies Record<string, Localized>;

/**
 * Meta descriptions. Broader than the headline on purpose: the headline
 * positions, this is what a search engine shows and what carries the
 * keywords someone would actually type.
 */
export const seo = {
  home: {
    es: 'Desarrollador Full Stack y administrador de sistemas en Gipuzkoa. Django, Python, Laravel y .NET; Angular. Cinco herramientas open source propias.',
    en: 'Full Stack Developer and systems administrator in Gipuzkoa, Spain. Django, Python, Laravel and .NET; Angular. Five open source tools of my own.',
  },
  projects: {
    es: 'Cinco herramientas open source: dos extensiones de VS Code, un language server para Django, un ORM tipado en Python y un panel de Docker en terminal.',
    en: 'Five open source tools: two VS Code extensions, a Django language server, a typed Python ORM and a terminal Docker dashboard. All MIT licensed.',
  },
  experience: {
    es: 'Cuatro años: arquitectura Django en Zenit Solar, AWS en Eywa Space, VoIP en SWAP y un SaaS multi-tenant en Laravel llevado a producción en VITE.',
    en: 'Four years: Django architecture at Zenit Solar, AWS at Eywa Space, VoIP at SWAP, and a multi-tenant SaaS in Laravel taken to production at VITE.',
  },
  cv: {
    es: 'Currículum de Anthony Velez Tapia, desarrollador Full Stack en Gipuzkoa. Django, Laravel, .NET, Angular y sistemas. Listo para imprimir o guardar en PDF.',
    en: 'CV of Anthony Velez Tapia, Full Stack Developer in Hernani, Gipuzkoa. Django, Laravel, .NET, Angular and systems. Ready to print or save as PDF.',
  },
} satisfies Record<string, Localized>;

export const contact: ContactLink[] = [
  {
    label: 'Email',
    href: 'mailto:velezanthony2000@gmail.com',
    handle: 'velezanthony2000@gmail.com',
    icon: 'mail',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/velezanthony',
    handle: 'github.com/velezanthony',
    icon: 'github',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/anthony-velez-tapia',
    handle: 'linkedin.com/in/anthony-velez-tapia',
    icon: 'linkedin',
  },
];

/**
 * The CV is read on paper and as a PDF, where the site is not one click away.
 * Everywhere else the link would point at the page you are already on.
 */
export const cvContact: ContactLink[] = [
  contact[0]!,
  {
    label: 'Portfolio',
    href: 'https://velezanthony.github.io',
    handle: 'velezanthony.github.io',
    icon: 'external',
  },
  ...contact.slice(1),
];

export const spokenLanguages: SpokenLanguage[] = [
  { name: { es: 'Castellano', en: 'Spanish' }, level: { es: 'Nativo', en: 'Native' } },
  { name: { es: 'Euskera', en: 'Basque' }, level: { es: 'Nativo', en: 'Native' } },
  { name: { es: 'Inglés', en: 'English' }, level: { es: 'B1', en: 'B1' } },
];
