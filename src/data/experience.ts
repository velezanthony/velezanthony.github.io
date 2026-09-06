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
        'Propongo la **arquitectura de código** del refactor de una **plataforma SaaS en producción**, en un equipo de cuatro: estructura, responsabilidades y convenciones del repositorio.',
        'Construyo un **design system con Django Cotton** bajo atomic design: cerca de **90 componentes** y un sistema de formularios que reutiliza todo el equipo.',
        'Fijé las **bases de calidad** del repositorio —Ruff, MyPy, tests de Django, devcontainer— y un Makefile que deja el día a día del desarrollador en un alias.',
        'Modelo datos e índices **code first** para la migración del sistema legacy y escribo los seeders de las pruebas de carga.',
      ],
      en: [
        'I propose the **code architecture** for the refactor of a **production SaaS platform**, in a team of four: structure, responsibilities and repository conventions.',
        'I build a **design system in Django Cotton** under atomic design: close to **90 components** and a form system the whole team reuses.',
        'Set the repository **quality baseline** —Ruff, MyPy, Django tests, devcontainer— and a Makefile that puts a developer’s whole day behind one alias.',
        'I model the data and its indexes **code first** for the legacy migration, and write the seeders for the load tests.',
      ],
    },
    stack: ['Django', 'Django Cotton', 'Python', 'PostgreSQL', 'HTMX', 'Alpine.js', 'Tailwind CSS', 'Ruff', 'MyPy', 'Docker'],
  },
  {
    company: 'SWAP Energia',
    role: { es: 'Desarrollador Full Stack', en: 'Full Stack Developer' },
    location: { es: 'Donostia · Presencial', en: 'Donostia · On-site' },
    start: '2025-07',
    end: '2025-09',
    highlights: {
      es: [
        'Entregué la **web corporativa en Angular** desde cero, una SPA.',
        'Refactoricé de extremo a extremo un **SaaS de gestión de fincas en Symfony**: monolito SSR con **multi-tenancy** de base de datos y esquema compartidos, con aislamiento por fila.',
        'Sustituí la telefonía en la nube (Twilio) por una **centralita propia con VitalPBX sobre Asterisk**: el coste por extensión pasa de tarifa a configuración y **deja de crecer**.',
        'Disparé **llamadas de agente de voz con IA** (ElevenLabs) desde n8n según el número entrante, con despliegue on-premise y migración a AWS.',
        'Analicé una aplicación **React sobre Firebase** (Firestore y Auth) para decidir qué funcionalidades llevar al monolito.',
      ],
      en: [
        'Delivered the **corporate website in Angular** from scratch, an SPA.',
        'Refactored end to end a **property management SaaS in Symfony**: an SSR monolith with shared database and schema **multi-tenancy**, with row-level isolation.',
        'Replaced cloud telephony (Twilio) with an **in-house PBX on VitalPBX over Asterisk**: cost per extension moves from a tariff to a config entry and **stops growing**.',
        'Triggered **AI voice-agent calls** (ElevenLabs) from n8n based on the incoming number, with on-premise deployment and migration to AWS.',
        'Assessed a **React application on Firebase** (Firestore and Auth) to decide which features to bring into the monolith.',
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
        'Me encargué del **código y la infraestructura completa** de las startups de una **venture builder**, más encargos de Eywa y de otras del grupo.',
        'Monté un **Proxmox on-premise desde cero** como preproducción —Debian, Nginx con TLS, PostgreSQL y MariaDB—: **coste fijo propio** en lugar de un entorno cloud por proyecto.',
        'Heredé y mantuve la **infraestructura AWS** —EC2, RDS, S3, Lambda, ECR, balanceadores y redes privadas— y arreglé los **pipelines de CI/CD** en GitHub Actions.',
        'Gestioné dominios y DNS de los clientes del grupo, migré el correo corporativo entre proveedores vía MX y prototipé en **Figma** antes de implementar.',
      ],
      en: [
        'Took charge of the **code and the entire infrastructure** of a **venture builder**’s startups, plus work for Eywa and others in the group.',
        'Built an **on-premise Proxmox from scratch** as pre-production —Debian, Nginx with TLS, PostgreSQL and MariaDB—: a **fixed in-house cost** instead of a cloud environment per project.',
        'Inherited and maintained the **AWS infrastructure** —EC2, RDS, S3, Lambda, ECR, load balancers and private networks— and fixed the **CI/CD pipelines** in GitHub Actions.',
        'Managed domains and DNS for the group’s clients, migrated corporate email between providers via MX and prototyped in **Figma** before implementing.',
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
        'Desarrollé **en solitario** y llevé a producción una **aplicación de control horario en Laravel**: monolito SSR con **una base de datos por tenant** y una central para identidad y enrutado.',
        'Fichaje con geolocalización, vacaciones con validación de solapamiento y flujo de aprobación, roles de administración, RRHH y empleado, y cuadros de mando por rol.',
        'Optimicé los CMS y e-commerce de cliente (WordPress, PrestaShop, Wix) y su infraestructura: dominios, DNS, hosting, HTTPS y las redirecciones del **SEO técnico**.',
        'Dirigí los **departamentos de desarrollo y SEO**, con estrategia SEO/SEM por sector y automatización de los procesos internos del equipo.',
      ],
      en: [
        'Built **single-handedly** and took to production a **time-tracking application in Laravel**: an SSR monolith with **a database per tenant** and a central one for identity and routing.',
        'Clock-in with geolocation, leave with overlap validation and an approval flow, admin, HR and employee roles, and per-role dashboards.',
        'Optimised client CMS and e-commerce sites (WordPress, PrestaShop, Wix) and their infrastructure: domains, DNS, hosting, HTTPS and the redirects **technical SEO** called for.',
        'Ran the **development and SEO departments**, with SEO/SEM strategy per sector and automation of the team’s internal processes.',
      ],
    },
    stack: ['Laravel', 'PHP', 'MySQL', 'JavaScript', 'Apache', 'DNS', 'SEO', 'SEM'],
  },
  {
    company: 'Agencia digital propia',
    role: {
      es: 'Cofundador y Desarrollador Full Stack',
      en: 'Co-founder and Full Stack Developer',
    },
    location: { es: 'Gipuzkoa', en: 'Gipuzkoa' },
    start: '2023-01',
    end: '2024-02',
    highlights: {
      es: [
        'Monté una **agencia de marketing digital** con un socio, en paralelo a Grupo KIROL hasta junio de 2023: de la prospección al desarrollo, el SEO y el cliente.',
        'Entregué webs con CMS y **herramientas a medida en Laravel**: propuesta, presupuesto, entrega y soporte.',
      ],
      en: [
        'Set up a **digital marketing agency** with a partner, alongside Grupo KIROL until June 2023: from prospecting to development, SEO and the client.',
        'Delivered CMS-backed websites and **bespoke tools in Laravel**: proposal, quote, delivery and support.',
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
        'Desarrollé **íntegro y en solitario** un producto interno de control de repuestos: arquitectura **desacoplada de API REST** con sus propios clientes, sin SSR.',
        'Diseñé la base de datos en **SQL Server** y monté encima una **API REST en C#/.NET Framework** (database first): CRUD completo, **autenticación JWT** y acceso por roles.',
        'Construí dos clientes contra esa API: plataforma web en **Angular** (SPA) y **app nativa Android en Java**, en Android Studio.',
      ],
      en: [
        'Built **end to end and single-handedly** an internal spare-parts product: a **decoupled REST API** architecture with its own clients, no SSR.',
        'Designed the **SQL Server** database and built a **REST API in C#/.NET Framework** on top (database first): full CRUD, **JWT authentication** and role-based access.',
        'Built two clients against that API: a web platform in **Angular** (SPA) and a **native Android app in Java**, in Android Studio.',
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
        'Administré **Active Directory sobre Windows Server** —incluido el DNS interno del dominio— y los usuarios y el correo en **Google Workspace**.',
        'Automaticé tareas con **Bash** e instalé equipos en masa con **Clonezilla**.',
        'Di soporte técnico y mantuve el parque de equipos, la red, impresoras y dispositivos.',
      ],
      en: [
        'Administered **Active Directory on Windows Server** —including the domain’s internal DNS— and users and email in **Google Workspace**.',
        'Automated tasks with **Bash** and deployed machines en masse with **Clonezilla**.',
        'Provided technical support and maintained the machine estate, network, printers and devices.',
      ],
    },
    stack: ['Windows Server', 'Active Directory', 'DNS', 'Google Workspace', 'Bash', 'Clonezilla'],
  },
];
