import type { ContactLink, SpokenLanguage, StackGroup, Localized } from '@data/types';

export const profile = {
  name: 'Anthony Velez Tapia',

  headline: {
    es: 'Desarrollador Full Stack y administrador de sistemas. Hoy Django y Python con Angular y React; antes .NET, Java y Laravel: un stack nuevo en cada empresa. Construyo herramientas open source para el día a día del desarrollador.',
    en: 'Full Stack Developer and systems administrator. Django and Python today, with Angular and React; .NET, Java and Laravel before that: a new stack at every company. I build open source tools for a developer’s day-to-day.',
  } satisfies Localized,

  summary: {
    es: 'Desarrollador Full Stack con 4 años de experiencia, especializado en Django y Python, con frontend en Angular y React. Empecé en C#/.NET y Java, y he ido cambiando de stack según lo ha pedido cada empresa: Laravel, Symfony, Flask y Django. Actualmente trabajo en el refactor de una plataforma SaaS en producción, donde propuse la arquitectura de código y las bases de calidad del repositorio. Perfil híbrido desarrollo y sistemas: además del backend, he administrado infraestructura cloud en AWS (EC2, RDS, Lambda, S3, VPC) y entornos on-premise. Autor de cinco herramientas open source para desarrolladores, una de ellas publicada en PyPI.',
    en: 'Full Stack Developer with 4 years of experience, specialised in Django and Python, with frontend work in Angular and React. I started out in C#/.NET and Java, and have switched stacks as each company needed: Laravel, Symfony, Flask and Django. I currently work on the refactor of a production SaaS platform, where I proposed the code architecture and set the repository quality baseline. A hybrid development and systems profile: beyond the backend, I have administered cloud infrastructure on AWS (EC2, RDS, Lambda, S3, VPC) and on-premise environments. Author of five open source developer tools, one of them published on PyPI.',
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
    items: 'TypeScript, JavaScript, Angular, React, Astro, HTML, CSS, Tailwind CSS, Alpine.js, HTMX',
  },
  {
    label: { es: 'Bases de datos', en: 'Databases' },
    items: 'PostgreSQL, MySQL / MariaDB, SQL Server',
  },
  {
    label: { es: 'Cloud y DevOps', en: 'Cloud and DevOps' },
    items: 'AWS (EC2, ECR, RDS, S3, Lambda, VPC, Load Balancer), Docker, GitHub Actions',
  },
  {
    label: { es: 'Sistemas y redes', en: 'Systems and networking' },
    items: 'Linux / Windows Server, Active Directory, Nginx, Apache, Proxmox, SSH, DNS, VitalPBX / Asterisk, Firewall, VPN',
  },
  {
    label: { es: 'Herramientas', en: 'Tools' },
    items: 'Git / GitHub, uv, Ruff, MyPy, pytest, Neovim / LazyVim, Tmux, Postman, Figma',
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
    es: 'Cuatro años de Full Stack y sistemas: Django y arquitectura en Zenit, infraestructura AWS en Eywa Space, VoIP y Symfony en SWAP, Laravel y .NET antes.',
    en: 'Four years across development and systems: Django and architecture at Zenit, AWS infrastructure at Eywa, VoIP and Symfony at SWAP, Laravel and .NET before.',
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
