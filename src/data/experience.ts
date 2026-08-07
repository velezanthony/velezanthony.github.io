import type { Job } from '@data/types';

/** Newest first. Unknown facts are left out, never guessed. */
export const experience: Job[] = [
  {
    company: 'Zenit',
    role: {
      es: 'Programador Full Stack',
      en: 'Full Stack Developer',
    },
    location: { es: 'Donostia · Híbrido', en: 'Donostia · Hybrid' },
    start: '2025-10',
    end: null,
    highlights: {
      es: [
        'Optimización de rendimiento y escalabilidad de una plataforma SaaS en producción construida con Django y PostgreSQL.',
        'Refactorización de código heredado y desarrollo de nuevas funcionalidades sobre esa base.',
        'Integración de APIs RESTful y despliegue con Docker sobre AWS.',
      ],
      en: [
        'Performance and scalability work on a production SaaS platform built with Django and PostgreSQL.',
        'Refactoring of legacy code, and new features built on top of it.',
        'RESTful API integration and deployment with Docker on AWS.',
      ],
    },
    stack: ['Django', 'Python', 'PostgreSQL', 'Docker', 'AWS', 'JavaScript'],
  },
  {
    company: 'SWAP Energia',
    role: { es: 'Full Stack Developer', en: 'Full Stack Developer' },
    location: { es: 'Donostia · Presencial', en: 'Donostia · On-site' },
    start: '2025-07',
    end: '2025-09',
    highlights: {
      es: [
        'Montaje y configuración de la centralita VoIP corporativa con VitalPBX sobre Asterisk: despliegue on-premise, migración a AWS y administración posterior.',
        'Asistente virtual con IA desarrollado en Symfony.',
        'Web corporativa en Angular desde cero, y análisis de una solución externa en React para integrarla con el asistente.',
      ],
      en: [
        'Set up and configured the corporate VoIP system with VitalPBX on Asterisk: on-premise deployment, migration to AWS, and running it afterwards.',
        'AI-powered virtual assistant built with Symfony.',
        'Corporate website in Angular from scratch, plus an assessment of an external React solution for integration with the assistant.',
      ],
    },
    stack: ['Asterisk', 'VitalPBX', 'AWS', 'Symfony', 'PHP', 'Angular', 'React', 'Linux'],
  },
  {
    company: 'Eywa Space',
    role: {
      es: 'Full Stack Developer y Responsable de Infraestructura AWS',
      en: 'Full Stack Developer and AWS Infrastructure Lead',
    },
    location: { es: 'Donostia · Presencial', en: 'Donostia · On-site' },
    start: '2024-11',
    end: '2025-07',
    highlights: {
      es: [
        'Diseño y operación de toda la infraestructura AWS de una venture builder: EC2, RDS, S3, Lambda, ECR, balanceadores y redes privadas.',
        'Virtualización on-premise con Proxmox: máquinas de testing en Debian con Nginx, PostgreSQL y MariaDB.',
        'Pipelines de CI/CD con GitHub Actions, revisión de código y soporte a los proyectos internos.',
      ],
      en: [
        'Designed and ran the entire AWS infrastructure of a venture builder: EC2, RDS, S3, Lambda, ECR, load balancers and private networks.',
        'On-premise virtualisation with Proxmox: Debian testing machines running Nginx, PostgreSQL and MariaDB.',
        'CI/CD pipelines with GitHub Actions, code review and support across the internal projects.',
      ],
    },
    stack: [
      'AWS',
      'EC2',
      'RDS',
      'S3',
      'Lambda',
      'ECR',
      'VPC',
      'Proxmox',
      'GitHub Actions',
      'Django',
      'Flask',
      'Python',
      'Laravel',
      'Angular',
    ],
  },
  {
    company: 'VITE Marketing',
    role: {
      es: 'Encargado de Desarrollo y Estrategia SEO/SEM',
      en: 'Head of Development and SEO/SEM Strategy',
    },
    location: { es: 'Irun · Presencial', en: 'Irun · On-site' },
    start: '2024-04',
    end: '2024-12',
    highlights: {
      es: [
        'Desarrollo full stack en Laravel, del diseño al despliegue y el mantenimiento del entorno de producción.',
        'Responsable de los departamentos de desarrollo y de SEO, y automatización de procesos internos del equipo técnico.',
        'Estrategias SEO/SEM para clientes de distintos sectores, orientadas a visibilidad orgánica y conversión.',
      ],
      en: [
        'Full stack development in Laravel, from design through deployment and running the production environment.',
        'Ran the development and SEO departments, and automated the technical team’s internal processes.',
        'SEO/SEM strategy for clients across sectors, aimed at organic visibility and conversion.',
      ],
    },
    stack: ['Laravel', 'PHP', 'MySQL', 'JavaScript', 'SEO', 'SEM'],
  },
  {
    company: 'Emprendimiento propio',
    role: {
      es: 'Fundador y Desarrollador Full Stack',
      en: 'Founder and Full Stack Developer',
    },
    location: { es: 'Gipuzkoa · Autónomo', en: 'Gipuzkoa · Self-employed' },
    start: '2023-01',
    end: '2024-02',
    highlights: {
      es: [
        'Agencia de marketing digital 360 montada desde cero, en paralelo al empleo en Grupo KIROL hasta junio de 2023.',
        'Sitios web con CMS y herramientas internas a medida en Laravel para optimizar procesos de cliente.',
        'Proyectos de principio a fin: alcance, presupuesto, entrega y soporte.',
      ],
      en: [
        'A 360 digital marketing agency built from scratch, alongside the Grupo KIROL job until June 2023.',
        'CMS-backed websites and bespoke internal tools in Laravel to streamline client processes.',
        'Projects end to end: scope, budget, delivery and support.',
      ],
    },
    stack: ['Laravel', 'PHP', 'CMS', 'JavaScript', 'SEO'],
  },
  {
    company: 'Grupo KIROL',
    role: { es: 'Desarrollador Full Stack', en: 'Full Stack Developer' },
    location: { es: 'Donostia · Híbrido', en: 'Donostia · Hybrid' },
    start: '2022-09',
    end: '2023-06',
    highlights: {
      es: [
        'Producto interno de control de repuestos, desarrollado íntegro: una API y dos clientes integrados contra ella.',
        'API REST en C#/.NET sobre SQL Server.',
        'Aplicación Android nativa en Java y plataforma web en Angular, con autenticación JWT y control de acceso por roles.',
      ],
      en: [
        'An internal spare-parts product, built end to end: one API and two clients running against it.',
        'REST API in C#/.NET over SQL Server.',
        'Native Android app in Java and a web platform in Angular, with JWT authentication and role-based access control.',
      ],
    },
    stack: ['C#', '.NET', 'SQL Server', 'Java', 'Android', 'Angular', 'TypeScript', 'JWT'],
  },
];
