import type { ContactLink, SpokenLanguage, StackGroup, Localized } from '@data/types';

export const profile = {
  name: 'Anthony Velez Tapia',

  headline: {
    es: 'Desarrollador Full Stack y administrador de sistemas. Backend con Django y Python, frontend con Angular y React, infraestructura sobre AWS. Construyo herramientas para desarrolladores y opero lo que las sostiene.',
    en: 'Full Stack Developer and systems administrator. Backend in Django and Python, frontend in Angular and React, infrastructure on AWS. I build tooling for other developers and run what holds it up.',
  } satisfies Localized,

  summary: {
    es: 'Desarrollador Full Stack con 4 años de experiencia, especializado en Django/Python y arquitectura SaaS sobre AWS, con frontend en Angular y React. Actualmente trabajo en la optimización de rendimiento y escalabilidad de una plataforma SaaS en producción. Perfil híbrido desarrollo y sistemas: además del backend, gestiono infraestructura cloud (EC2, RDS, Lambda, S3, VPC) y entornos on-premise. Autor de cinco herramientas open source para el ecosistema Django, una de ellas publicada en PyPI.',
    en: 'Full Stack Developer with 4 years of experience, specialised in Django/Python and SaaS architecture on AWS, with frontend work in Angular and React. I currently work on the performance and scalability of a production SaaS platform. A hybrid development and systems profile: beyond the backend, I run cloud infrastructure (EC2, RDS, Lambda, S3, VPC) and on-premise environments. Author of five open source tools for the Django ecosystem, one of them published on PyPI.',
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
    items: 'Python, Django, Flask, PHP, Laravel, Symfony, C#/.NET, Java',
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
    items: 'AWS (EC2, ECR, RDS, S3, Lambda, VPC, Load Balancer), Docker, GitHub Actions, Git',
  },
  {
    label: { es: 'Sistemas y redes', en: 'Systems and networking' },
    items: 'Linux / Windows Server, Nginx, Apache, Proxmox, SSH, DNS, VitalPBX / Asterisk, Firewall, VPN',
  },
  {
    label: { es: 'Herramientas', en: 'Tools' },
    items: 'Git / GitHub, Docker, Postman, Figma, IntelliJ IDEA',
  },
];

/**
 * Meta descriptions. Broader than the headline on purpose: the headline
 * positions, this is what a search engine shows and what carries the
 * keywords someone would actually type.
 */
export const seo = {
  home: {
    es: 'Desarrollador Full Stack en Gipuzkoa. Django y Python en backend, Angular y React en frontend, AWS en infraestructura. Cinco herramientas open source.',
    en: 'Full Stack Developer in Gipuzkoa, Spain. Django and Python on the backend, Angular and React on the front, AWS for infrastructure. Five open source tools.',
  },
  projects: {
    es: 'Cinco herramientas open source: dos extensiones de VS Code, un language server para Django, un ORM tipado en Python y un panel de Docker en terminal.',
    en: 'Five open source tools: two VS Code extensions, a Django language server, a typed Python ORM and a terminal Docker dashboard. All MIT licensed.',
  },
  experience: {
    es: 'Cuatro años de Full Stack y sistemas: Django y AWS en Zenit, infraestructura cloud en Eywa Space, VoIP y Symfony en SWAP Energia, Laravel y .NET antes.',
    en: 'Four years across development and systems: Django and AWS at Zenit, cloud infrastructure at Eywa Space, VoIP and Symfony at SWAP Energia, .NET before.',
  },
  cv: {
    es: 'Currículum de Anthony Velez Tapia, desarrollador Full Stack en Hernani, Gipuzkoa. Django, Angular, AWS y sistemas. Listo para imprimir o guardar en PDF.',
    en: 'Résumé of Anthony Velez Tapia, Full Stack Developer in Hernani, Gipuzkoa. Django, Angular, AWS and systems. Ready to print or save as PDF.',
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
