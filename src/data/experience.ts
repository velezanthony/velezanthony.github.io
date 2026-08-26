import type { Job } from '@data/types';

/** Newest first. Unknown facts are left out, never guessed. */
export const experience: Job[] = [
  {
    company: 'Zenit Solar',
    role: {
      es: 'Desarrollador Full Stack',
      en: 'Full Stack Developer',
    },
    location: { es: 'Donostia · Híbrido', en: 'Donostia · Hybrid' },
    start: '2025-10',
    end: null,
    highlights: {
      es: [
        'Propuesta de la arquitectura de código del refactor de una plataforma SaaS en producción, en un equipo de cuatro: estructura de directorios, separación de responsabilidades y convenciones de trabajo del repositorio.',
        'Design system con Django Cotton bajo atomic design: cerca de 90 componentes entre átomos, moléculas y layouts, más un sistema de formularios reutilizable por todo el equipo.',
        'Bases de calidad del repositorio: Ruff, MyPy, pytest y dependencias separadas por entorno, con devcontainer y un Makefile que reúne en alias todo el día a día del desarrollador.',
        'Modelado de datos e índices code first, migración del sistema legacy y seeders para pruebas de carga.',
      ],
      en: [
        'Proposed the code architecture for the refactor of a production SaaS platform, in a team of four: directory structure, separation of responsibilities and the repository’s working conventions.',
        'Design system in Django Cotton following atomic design: close to 90 components across atoms, molecules and layouts, plus a reusable form system for the whole team.',
        'Set the repository quality baseline: Ruff, MyPy, pytest and dependencies split per environment, with a devcontainer and a Makefile that wraps a developer’s whole day-to-day into aliases.',
        'Code-first data modelling and indexing, legacy system migration, and seeders for load testing.',
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
        'Web corporativa en Angular desde cero, SPA, entregada.',
        'SaaS de gestión de fincas en Symfony: monolito SSR con multi-tenancy de base de datos y esquema compartidos (shared database, shared schema) y aislamiento por fila. Refactor y nuevas funcionalidades de extremo a extremo, del modelo de datos y el ORM al backend y las vistas. Análisis preliminar de una aplicación React sobre Firebase (Firestore y Auth) para valorar qué funcionalidades podían llevarse al monolito.',
        'Telefonía del SaaS: llamadas de agente de voz con IA disparadas desde n8n según el número entrante. Centralita propia con VitalPBX sobre Asterisk frente a telefonía en la nube de terceros, con despliegue on-premise, migración a AWS y línea de operadora generando las extensiones: el coste por extensión pasa de tarifa a configuración, de modo que deja de crecer al añadir extensiones.',
        'Llamadas IP internas entre extensiones funcionando, a falta del troncal de operadora para la salida al exterior, con la configuración documentada para su continuidad.',
      ],
      en: [
        'Corporate website in Angular from scratch, an SPA, delivered.',
        'Property management SaaS in Symfony: an SSR monolith with shared database, shared schema multi-tenancy and row-level isolation. Refactoring and new features end to end, from the data model and the ORM through to the backend and the views. Preliminary assessment of a React application on Firebase (Firestore and Auth) to gauge which features could be brought into the monolith.',
        'The SaaS’s telephony: AI voice-agent calls triggered from n8n based on the incoming number. In-house PBX with VitalPBX on Asterisk against third-party cloud telephony, with on-premise deployment, migration to AWS and a conventional carrier line generating the extensions: cost per extension moves from a tariff to a configuration entry, so it stops growing as extensions are added.',
        'Internal IP calls between extensions working, pending the carrier trunk for outbound calls, with the configuration documented so someone else could pick it up.',
      ],
    },
    stack: ['Angular', 'Symfony', 'PHP', 'Bootstrap', 'React', 'VitalPBX', 'Asterisk', 'Twilio', 'ElevenLabs', 'n8n', 'AWS', 'Firebase', 'Firestore', 'Linux'],
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
        'Proxmox on-premise montado desde cero como pre-producción: réplicas locales de las máquinas cloud (Debian, Nginx como reverse proxy con terminación TLS, PostgreSQL y MariaDB), para no levantar un entorno cloud de pruebas por cada proyecto nuevo: coste fijo propio en lugar de coste recurrente por proyecto.',
        'Infraestructura AWS heredada y mantenida —EC2, RDS, S3, Lambda, ECR, balanceadores y redes privadas—, con el arreglo de los pipelines de CI/CD ya existentes en GitHub Actions, revisión de código, documentación y soporte interno.',
        'Trabajo de cara a los clientes del grupo: gestión de dominios y DNS, con la migración del correo corporativo entre proveedores mediante registros MX y la publicación de landings estáticas, y prototipos de maquetación interactivos en Figma antes de implementar.',
      ],
      en: [
        'In charge of the code and the entire infrastructure of a venture builder’s startups, plus one-off work for Eywa and others in the group.',
        'On-premise Proxmox built from scratch as pre-production: local replicas of the cloud machines (Debian, Nginx as a reverse proxy with TLS termination, PostgreSQL and MariaDB), so a new cloud test environment was not needed for every new project: a fixed in-house cost instead of a recurring per-project one.',
        'AWS infrastructure inherited and maintained —EC2, RDS, S3, Lambda, ECR, load balancers and private networks—, along with fixing the existing GitHub Actions CI/CD pipelines, code review, documentation and internal support.',
        'Client-facing work across the group: domain and DNS management, migrating corporate email between providers through MX records and publishing static landing pages, plus interactive layout prototypes in Figma before implementation.',
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
      'DNS',
      'Figma',
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
        'Aplicación de control horario en Laravel, desarrollada en solitario y llevada a producción: monolito SSR con multi-tenancy de base de datos por tenant y una base de datos central para identidad y enrutado (multi-database tenancy). Frontend sobre plantilla comercial; backend, modelo de datos code first y lógica de negocio propios.',
        'Fichaje con geolocalización e histórico, permisos y vacaciones con validación de solapamiento y flujo de aprobación, catálogos de departamentos y puestos, roles de administración, RRHH y empleado, y cuadros de mando por rol.',
        'Desarrollo a medida en Laravel y optimización técnica de los CMS y e-commerce de cliente (WordPress, PrestaShop y Wix), con su infraestructura: dominios, DNS, hosting y HTTPS, y las migraciones y redirecciones que exigía el SEO técnico.',
        'Responsable de los departamentos de desarrollo y de SEO, con estrategias SEO/SEM para clientes de distintos sectores y automatización de los procesos internos del equipo técnico.',
      ],
      en: [
        'Time-tracking application in Laravel, built single-handedly and taken to production: an SSR monolith with database-per-tenant multi-tenancy and a central database for identity and routing (multi-database tenancy). The frontend ran on a commercial template; the backend, code-first data model and business logic were my own.',
        'Clock-in with geolocation and history, leave and holiday requests with overlap validation and an approval flow, department and job-title catalogues, admin, HR and employee roles, and per-role dashboards.',
        'Bespoke development in Laravel and technical optimisation of client CMS and e-commerce sites (WordPress, PrestaShop and Wix), along with their infrastructure: domains, DNS, hosting and HTTPS, and the migrations and redirects technical SEO called for.',
        'Ran the development and SEO departments, with SEO/SEM strategy for clients across sectors and automation of the technical team’s internal processes.',
      ],
    },
    stack: ['Laravel', 'PHP', 'MySQL', 'JavaScript', 'Apache', 'DNS', 'SEO', 'SEM'],
  },
  {
    company: 'Emprendimiento propio',
    role: {
      es: 'Cofundador y Desarrollador Full Stack',
      en: 'Co-founder and Full Stack Developer',
    },
    location: { es: 'Gipuzkoa', en: 'Gipuzkoa' },
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
        'Producto interno de control de repuestos, desarrollado íntegro y en solitario: arquitectura desacoplada de API REST con sus propios clientes, sin SSR.',
        'Diseño de la base de datos en SQL Server y API REST en C#/.NET Framework sobre ella, con el modelo de entidades generado desde el esquema (database first). Recursos CRUD completos, autenticación JWT y control de acceso por roles.',
        'Dos clientes contra esa API: plataforma web en Angular (SPA) y aplicación nativa Android en Java, desarrollada en Android Studio.',
      ],
      en: [
        'An internal spare-parts product, built end to end single-handedly: a decoupled REST API architecture with its own clients, no SSR.',
        'Designed the SQL Server database and built a REST API in C#/.NET Framework on top of it, with the entity model generated from the schema (database first). Full CRUD resources, JWT authentication and role-based access control.',
        'Two clients against that API: a web platform in Angular (SPA) and a native Android app in Java, built in Android Studio.',
      ],
    },
    stack: ['C#', '.NET Framework', 'REST', 'SQL Server', 'Java', 'Android', 'Android Studio', 'Angular', 'TypeScript', 'JWT'],
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
        'Administración de Active Directory sobre Windows Server, incluido el DNS interno del dominio y la resolución de los servidores de la red, y gestión de usuarios y correo en Google Workspace.',
        'Automatización de tareas con Bash e instalaciones masivas de equipos con Clonezilla.',
        'Soporte técnico, mantenimiento del parque de equipos y configuración de red, impresoras y dispositivos.',
      ],
      en: [
        'Active Directory administration on Windows Server, including the domain’s internal DNS and name resolution for the network servers, plus user and email management in Google Workspace.',
        'Task automation with Bash and mass machine deployment with Clonezilla.',
        'Technical support, hardware maintenance, and configuration of the network, printers and devices.',
      ],
    },
    stack: ['Windows Server', 'Active Directory', 'DNS', 'Google Workspace', 'Bash', 'Clonezilla'],
  },
];
