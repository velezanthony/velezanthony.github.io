import type { ContactLink, SpokenLanguage, StackGroup, Localized } from '@data/types';

export const profile = {
  name: 'Anthony Velez Tapia',

  headline: {
    es: 'Desarrollador Full Stack y administrador de sistemas. Django y Python con Angular y React; antes .NET, Java, Laravel y Symfony. Construyo herramientas open source para el día a día del desarrollador.',
    en: 'Full Stack Developer and systems administrator. Django and Python with Angular and React; .NET, Java, Laravel and Symfony before that. I build open source tools for a developer’s day-to-day.',
  } satisfies Localized,

  summary: {
    es: 'Desarrollador de software. Cuatro años, seis stacks y cuatro arquitecturas en producción: API REST con clientes desacoplados, SPA, monolito SSR e hipermedia con HTMX. Aprendo el lenguaje, no el framework. Diseño el modelo de datos —SQL Server y PostgreSQL, database first y code first— y levanté en solitario un SaaS multi-tenant hasta producción. Hoy propongo la arquitectura de código y las bases de calidad del refactor de una plataforma SaaS, en un equipo de cuatro. Infraestructura AWS completa de las startups de una venture builder y una preproducción on-premise montada desde cero en Proxmox. Cinco herramientas open source propias, una en PyPI, entre ellas un ORM en Python cuyo tipado resuelven mypy y Pyright sin generación de código.',
    en: 'Software developer. Four years, six stacks and four architectures in production: REST APIs with decoupled clients, SPAs, SSR monoliths and hypermedia with HTMX. I learn the language, not the framework. I design the data model —SQL Server and PostgreSQL, database first and code first— and built a multi-tenant SaaS single-handedly through to production. Today I propose the code architecture and the quality baseline for the refactor of a SaaS platform, in a team of four. The full AWS infrastructure of a venture builder’s startups and an on-premise pre-production environment built from scratch on Proxmox. Five open source tools of my own, one on PyPI, among them a Python ORM whose typing mypy and Pyright resolve with no code generation.',
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
 * Meta descriptions. Broader than the headline on purpose: the headline
 * positions, this is what a search engine shows and what carries the
 * keywords someone would actually type.
 */
export const seo = {
  home: {
    es: 'Desarrollador Full Stack en Gipuzkoa. Django y Python, Laravel y .NET en backend; Angular y React en frontend. Cinco herramientas open source propias.',
    en: 'Full Stack Developer in Gipuzkoa, Spain. Django and Python, Laravel and .NET on the backend, Angular and React on the front. Five open source tools of my own.',
  },
  projects: {
    es: 'Cinco herramientas open source: dos extensiones de VS Code, un language server para Django, un ORM tipado en Python y un panel de Docker en terminal.',
    en: 'Five open source tools: two VS Code extensions, a Django language server, a typed Python ORM and a terminal Docker dashboard. All MIT licensed.',
  },
  experience: {
    es: 'Cuatro años de Full Stack y sistemas: Django y arquitectura en Zenit Solar, infraestructura AWS en Eywa Space, VoIP y Symfony en SWAP, Laravel y .NET antes.',
    en: 'Four years of development and systems: Django and architecture at Zenit Solar, AWS infrastructure at Eywa, VoIP and Symfony at SWAP, Laravel and .NET before.',
  },
  cv: {
    es: 'Currículum de Anthony Velez Tapia, desarrollador Full Stack en Gipuzkoa. Django, Laravel, .NET, Angular y sistemas. Listo para imprimir o guardar en PDF.',
    en: 'CV of Anthony Velez Tapia, Full Stack Developer in Hernani, Gipuzkoa. Django, Laravel, .NET, Angular, React and systems. Ready to print or save as PDF.',
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
    label: 'Portfolio',
    href: 'https://velezanthony.github.io',
    handle: 'velezanthony.github.io',
    icon: 'external',
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

export const spokenLanguages: SpokenLanguage[] = [
  { name: { es: 'Castellano', en: 'Spanish' }, level: { es: 'Nativo', en: 'Native' } },
  { name: { es: 'Euskera', en: 'Basque' }, level: { es: 'Nativo', en: 'Native' } },
  { name: { es: 'Inglés', en: 'English' }, level: { es: 'B1', en: 'B1' } },
];
