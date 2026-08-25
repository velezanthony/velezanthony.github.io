import type { Job } from '@data/types';

/** Newest first. Unknown facts are left out, never guessed. */
export const experience: Job[] = [
  {
    company: 'Zenit',
    role: {
      es: 'Desarrollador Full Stack',
      en: 'Full Stack Developer',
    },
    location: { es: 'Donostia · Híbrido', en: 'Donostia · Hybrid' },
    start: '2025-10',
    end: null,
    highlights: {
      es: [
        'Propuesta de la arquitectura de código del refactor de una plataforma SaaS en producción: estructura de directorios, separación de responsabilidades y convenciones de trabajo del repositorio.',
        'Design system con Django Cotton bajo atomic design: cerca de 90 componentes entre átomos, moléculas y layouts, más un sistema de formularios reutilizable por todo el equipo.',
        'Bases de calidad del repositorio: Ruff, MyPy, pytest y dependencias separadas por entorno, con devcontainer y un Makefile que reúne en alias todo el día a día del desarrollador.',
        'Modelado de datos e índices, migración del sistema legacy y seeders para pruebas de carga.',
      ],
      en: [
        'Proposed the code architecture for the refactor of a production SaaS platform: directory structure, separation of responsibilities and the repository’s working conventions.',
        'Design system in Django Cotton following atomic design: close to 90 components across atoms, molecules and layouts, plus a reusable form system for the whole team.',
        'Set the repository quality baseline: Ruff, MyPy, pytest and dependencies split per environment, with a devcontainer and a Makefile that wraps a developer’s whole day-to-day into aliases.',
        'Data modelling and indexing, legacy system migration, and seeders for load testing.',
      ],
    },
    stack: ['Django', 'Django Cotton', 'Python', 'PostgreSQL', 'HTMX', 'Alpine.js', 'Tailwind CSS', 'Ruff', 'MyPy', 'pytest', 'Docker'],
  },
  {
    company: 'SWAP Energia',
    role: { es: 'Desarrollador Full Stack', en: 'Full Stack Developer' },
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
      es: 'Desarrollador Full Stack y Administrador de Infraestructura AWS',
      en: 'Full Stack Developer and AWS Infrastructure Administrator',
    },
    location: { es: 'Donostia · Presencial', en: 'Donostia · On-site' },
    start: '2024-12',
    end: '2025-07',
    highlights: {
      es: [
        'Encargado del código y la infraestructura completa de startups de una venture builder, más encargos puntuales de Eywa y de otras del grupo.',
        'Proxmox on-premise montado desde cero como pre-producción: réplicas locales de las máquinas cloud (Debian, Nginx, PostgreSQL, MariaDB) en lugar de pagar un staging en la nube.',
        'Infraestructura AWS heredada y mantenida: EC2, RDS, S3, Lambda, ECR, balanceadores y redes privadas.',
        'Arreglo de los pipelines de CI/CD en GitHub Actions ya existentes, revisión de código, documentación y soporte interno.',
      ],
      en: [
        'In charge of the code and the entire infrastructure of a venture builder’s startups, plus one-off work for Eywa and others in the group.',
        'On-premise Proxmox built from scratch as pre-production: local replicas of the cloud machines (Debian, Nginx, PostgreSQL, MariaDB) instead of paying for cloud staging.',
        'AWS infrastructure inherited and maintained: EC2, RDS, S3, Lambda, ECR, load balancers and private networks.',
        'Fixed the existing GitHub Actions CI/CD pipelines, plus code review, documentation and internal support.',
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
      'Debian',
      'Nginx',
      'GitHub Actions',
      'Django',
      'Flask',
      'Python',
      'Laravel',
      'Angular',
      'Tailwind CSS',
      'Alpine.js',
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
      es: 'Cofundador y Desarrollador Full Stack',
      en: 'Co-founder and Full Stack Developer',
    },
    location: { es: 'Gipuzkoa · Autónomo', en: 'Gipuzkoa · Self-employed' },
    start: '2023-01',
    end: '2024-02',
    highlights: {
      es: [
        'Agencia de marketing digital montada con un socio, en paralelo a Grupo KIROL hasta junio de 2023: los dos a todo, de la prospección al desarrollo, el SEO y el trato directo con el cliente.',
        'Webs con CMS y herramientas a medida en Laravel: propuesta, presupuesto, entrega y soporte.',
      ],
      en: [
        'A digital marketing agency set up with a partner, alongside Grupo KIROL until June 2023: the two of us on everything, from prospecting to development, SEO and dealing with clients directly.',
        'CMS-backed websites and bespoke tools in Laravel: proposal, quote, delivery and support.',
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
  {
    company: 'SJL',
    role: {
      es: 'Administrador de Sistemas · Formación Profesional Dual',
      en: 'Systems Administrator · Dual Vocational Training',
    },
    location: { es: 'Oiartzun · Presencial', en: 'Oiartzun · On-site' },
    start: '2019-09',
    end: '2020-09',
    highlights: {
      es: [
        'Administración de Active Directory sobre Windows Server, y gestión de usuarios y correo en Google Workspace.',
        'Automatización de tareas con Bash e instalaciones masivas de equipos con Clonezilla.',
        'Soporte técnico, mantenimiento del parque de equipos y configuración de red, impresoras y dispositivos.',
      ],
      en: [
        'Active Directory administration on Windows Server, plus user and email management in Google Workspace.',
        'Task automation with Bash and mass machine deployment with Clonezilla.',
        'Technical support, hardware maintenance, and configuration of the network, printers and devices.',
      ],
    },
    stack: ['Windows Server', 'Active Directory', 'Google Workspace', 'Bash', 'Clonezilla'],
  },
];
