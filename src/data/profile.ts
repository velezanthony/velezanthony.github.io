import type { ContactLink, SpokenLanguage, StackGroup, Localized } from '@core/types';
import { SITE, SITE_HOST } from '@data/site';

export const email = 'velezanthony2000@gmail.com';

export const profile = {
  name: 'Anthony Velez Tapia',

  role: 'Software Engineer',

  headline: {
    es: 'Desarrollo, despliego y mantengo software en producción, en la nube o en servidores propios. Desde la arquitectura de las aplicaciones hasta la infraestructura que las sostiene.',
    en: 'I build, deploy and maintain software in production, in the cloud or on my own servers. From the architecture of the applications to the infrastructure that runs them.',
  } satisfies Localized,

  summary: {
    es: 'Hoy defino la **arquitectura de código** del refactor de un marketplace SaaS en Python y Django, en un equipo de cuatro, y bajé su página principal de **12 s a 1–2 s** optimizando consultas. Antes, **a partir de los requisitos de negocio, diseñé, desarrollé y llevé a producción un SaaS multi-tenant** con la responsabilidad técnica completa, y me encargué de la **infraestructura AWS completa** de las startups de una venture builder, con su preproducción on-premise en Proxmox. He trabajado con API REST y clientes desacoplados, SPA y monolitos SSR con HTMX. **Cinco herramientas open source propias: dos en PyPI y una en el VS Code Marketplace.**',
    en: 'Today I define the **code architecture** for the refactor of a SaaS marketplace in Python and Django, in a team of four, and I brought its main page down from **12 s to 1–2 s** by optimising queries. Before that, **working from the business requirements, I designed, built and took a multi-tenant SaaS to production** with full technical responsibility, and ran the **full AWS infrastructure** of a venture builder’s startups, with their on-premise pre-production on Proxmox. I have worked with REST APIs and decoupled clients, SPAs and SSR monoliths with HTMX. **Five open source tools of my own: two on PyPI and one on the VS Code Marketplace.**',
  } satisfies Localized,

  /** The everyday stack, shown under the headline. */
  stack: {
    es: ['Python y Django', 'Angular', 'AWS', 'Proxmox', 'Open source'],
    en: ['Python and Django', 'Angular', 'AWS', 'Proxmox', 'Open source'],
  } satisfies Localized<string[]>,
  /** What I have also shipped with, smaller than the everyday stack. */
  otherStack: ['Flask', 'React', 'Laravel', 'Symfony', '.NET', 'Java'],

  location: 'Hernani, Gipuzkoa',

  /** A list, not a sentence: rendered with separators that never start or end a line. */
  availability: {
    es: ['Híbrido en Gipuzkoa', 'Remoto en España', 'Proyectos freelance'],
    en: ['Hybrid in Gipuzkoa', 'Remote within Spain', 'Freelance projects'],
  } satisfies Localized<string[]>,

  photo: '/photo.png',
} as const;

/** The stack I work with every day: the one I can defend in an interview right now. */
export const stackGroups: StackGroup[] = [
  {
    label: { es: 'Backend', en: 'Backend' },
    items: 'Python, Django, Flask',
  },
  {
    label: { es: 'Frontend', en: 'Frontend' },
    items: 'TypeScript, JavaScript, Angular, Astro, HTML, CSS, Tailwind CSS, Alpine.js, HTMX',
  },
  {
    label: { es: 'Bases de datos', en: 'Databases' },
    items: 'PostgreSQL, MySQL / MariaDB, SQL Server',
  },
  {
    label: { es: 'Cloud y despliegue', en: 'Cloud and deployment' },
    items:
      'AWS (EC2, ECR, RDS, S3, Lambda, VPC, Load Balancer), Docker, GitHub Actions, Gunicorn / WSGI',
  },
  {
    label: { es: 'Sistemas y redes', en: 'Systems and networking' },
    items:
      'Linux / Windows Server, Active Directory, DNS, Nginx, Apache, Proxmox, SSH, VitalPBX / Asterisk',
  },
  {
    label: { es: 'Herramientas', en: 'Tools' },
    items: 'Git / GitHub, uv, Ruff, MyPy, pytest, Figma',
  },
];

/** Shipped with in earlier jobs: real experience, picked up again when a project needs it. */
export const previousStack: StackGroup = {
  label: { es: 'Experiencia anterior', en: 'Earlier experience' },
  items: 'PHP (Laravel, Symfony), C# / .NET, Java, React, Bootstrap',
};

/**
 * Page titles. Separate from the in-page headings: a heading names the section
 * for a reader who is already here, a title has to earn the click from a SERP.
 */
export const pageTitles = {
  home: {
    es: 'Software Engineer en Gipuzkoa',
    en: 'Software Engineer in Gipuzkoa, Spain',
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
    es: 'CV · Software Engineer',
    en: 'CV · Software Engineer',
  },
} satisfies Record<string, Localized>;

/**
 * Meta descriptions. Broader than the headline on purpose: the headline
 * positions, this is what a search engine shows and what carries the
 * keywords someone would actually type.
 */
export const seo = {
  home: {
    es: 'Software Engineer en Gipuzkoa: desarrollo, despliego y mantengo software con Python, Django y Angular, en AWS o servidores propios. Cinco proyectos open source.',
    en: 'Software Engineer in Gipuzkoa, Spain: I build, deploy and maintain software with Python, Django and Angular, on AWS or my own servers. Five open source tools.',
  },
  projects: {
    es: 'Seis herramientas open source: un ORM Python tipado, dos extensiones de VS Code y un catálogo de componentes para Django, un panel Docker y una librería Astro.',
    en: 'Six open source tools: a typed Python ORM, two VS Code extensions and a component catalogue for Django, a terminal Docker dashboard and an Astro docs library.',
  },
  experience: {
    es: 'Cuatro años: arquitectura Django en Zenit Solar, AWS en Eywa Space, VoIP en SWAP y un SaaS multi-tenant en Laravel llevado a producción en VITE.',
    en: 'Four years: Django architecture at Zenit Solar, AWS at Eywa Space, VoIP at SWAP, and a multi-tenant SaaS in Laravel taken to production at VITE.',
  },
  cv: {
    es: 'Currículum de Anthony Velez Tapia, Software Engineer en Gipuzkoa. Python, Django, Angular, AWS y sistemas. Listo para imprimir o guardar en PDF.',
    en: 'CV of Anthony Velez Tapia, Software Engineer in Hernani, Gipuzkoa. Python, Django, Angular, AWS and systems. Ready to print or save as PDF.',
  },
} satisfies Record<string, Localized>;

export const contact: ContactLink[] = [
  {
    label: 'Email',
    href: `mailto:${email}`,
    handle: email,
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
 * Email and LinkedIn first: they fill the CV's left column.
 */
export const cvContact: ContactLink[] = [
  contact[0]!,
  contact[2]!,
  {
    label: 'Portfolio',
    href: SITE,
    handle: SITE_HOST,
    icon: 'external',
  },
  contact[1]!,
];

export const spokenLanguages: SpokenLanguage[] = [
  { code: 'es', name: { es: 'Castellano', en: 'Spanish' }, level: { es: 'Nativo', en: 'Native' } },
  { code: 'eu', name: { es: 'Euskera', en: 'Basque' }, level: { es: 'Nativo', en: 'Native' } },
  { code: 'en', name: { es: 'Inglés', en: 'English' }, level: { es: 'B1', en: 'B1' } },
];

/** Where the person is, for the JSON-LD. Town-level on purpose. */
export const address = { locality: 'Hernani', region: 'Gipuzkoa', country: 'ES' };

/** What the JSON-LD says the person knows. Technology names, so not translated. */
export const knowsAbout = [
  'Django',
  'Python',
  'Flask',
  'PHP',
  'Laravel',
  'Symfony',
  'C#',
  '.NET',
  'Java',
  'TypeScript',
  'Angular',
  'React',
  'HTMX',
  'PostgreSQL',
  'MySQL',
  'SQL Server',
  'AWS',
  'Docker',
  'GitHub Actions',
  'Linux',
  'Nginx',
  'Proxmox',
  'DNS',
  'Asterisk',
  'VoIP',
  'Software architecture',
  'Multi-tenancy',
];
