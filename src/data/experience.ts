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
        'Refactorizamos entre cuatro una **plataforma SaaS de autoconsumo solar** en producción: evalué la **viabilidad del stack** midiendo tiempos de carga y definí su **arquitectura de código** y el **design system en Django Cotton**, con cerca de **90 componentes** reutilizables.',
        'Optimicé el acceso a datos reescribiendo sus consultas —N+1, anotaciones, agregados y subconsultas—: el **marketplace**, un mapa con proyectos de toda España, bajó de **12 s en producción a 1–2 s**, y a **800 ms** con el nuevo stack.',
        'Establecí la **base de calidad**: Ruff, MyPy, tests de Django, devcontainer, dependencias por entorno y un Makefile que deja el día a día en un alias.',
        'Definí **con el equipo** el modelo de datos y sus índices, code first para la migración del sistema legacy, con seeders para las pruebas de carga.',
      ],
      en: [
        'The four of us are refactoring a **production SaaS platform for solar self-consumption**: I assessed the **stack’s viability** by measuring load times and defined its **code architecture** and the **design system in Django Cotton**, with close to **90 reusable components**.',
        'Optimised data access by reworking its queries —N+1, annotations, aggregates and subqueries—: the **marketplace**, a map of projects across Spain, went from **12 s in production to 1–2 s**, and to **800 ms** on the new stack.',
        'Set the **quality baseline**: Ruff, MyPy, Django tests, devcontainer, per-environment dependencies and a Makefile that puts the whole day behind one alias.',
        'Defined the data model and its indexes **with the team**, code first for the legacy migration, with seeders for the load tests.',
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
        'Web corporativa en **Angular** desde cero, SPA, entregada.',
        'Desarrollé **nuevas funcionalidades** en un SaaS de gestión de fincas en **Symfony**: monolito SSR con **multi-tenancy** de esquema compartido.',
        '**Centralita propia con VitalPBX sobre Asterisk** para autohospedar la telefonía en la nube y **ahorrar**: llamadas internas funcionando en local, a falta del troncal y del salto a AWS, todo documentado.',
      ],
      en: [
        'Corporate website in **Angular** from scratch, an SPA, delivered.',
        'Developed **new features** in a property management SaaS in **Symfony**: an SSR monolith with shared-schema **multi-tenancy**.',
        '**In-house PBX with VitalPBX on Asterisk** to self-host cloud telephony and **cut its cost**: internal calls working locally, pending the carrier trunk and the move to AWS, all documented.',
      ],
    },
    stack: ['Angular', 'Symfony', 'PHP', 'Bootstrap', 'VitalPBX', 'Asterisk', 'Linux'],
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
        'Monté un **Proxmox on-premise desde cero** como entorno de producto y desarrollo, con réplicas locales de las máquinas cloud: **coste fijo propio** en lugar de un entorno cloud por proyecto.',
        'Heredé y mantuve la **infraestructura AWS** —EC2, RDS, S3, Lambda, ECR, balanceadores y redes privadas— y arreglé los **pipelines de CI/CD** en GitHub Actions.',
        'Gestioné dominios y DNS de los clientes del grupo, migré el correo corporativo vía MX, publiqué landings estáticas —alguna en el propio Proxmox— y prototipé en **Figma**.',
      ],
      en: [
        'Took charge of the **code and the entire infrastructure** of a **venture builder**’s startups, plus work for Eywa and others in the group.',
        'Built an **on-premise Proxmox from scratch** as a product and development environment, with local replicas of the cloud machines: a **fixed in-house cost** instead of a cloud environment per project.',
        'Inherited and maintained the **AWS infrastructure** —EC2, RDS, S3, Lambda, ECR, load balancers and private networks— and fixed the **CI/CD pipelines** in GitHub Actions.',
        'Managed domains and DNS for the group’s clients, migrated corporate email over MX, published static landings —some on that same Proxmox— and prototyped in **Figma**.',
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
        'Frontend sobre plantilla comercial; **backend, modelo de datos code first y lógica de negocio propios**.',
        'Fichaje con geolocalización, vacaciones con validación de solapamiento y flujo de aprobación, roles de administración, RRHH y empleado, y cuadros de mando por rol.',
        'Desarrollo a medida en Laravel y optimización de los CMS y e-commerce de cliente (WordPress, PrestaShop, Wix): dominios, DNS, hosting, HTTPS y las redirecciones del **SEO técnico**.',
        'Dirigí los **departamentos de desarrollo y SEO**, con estrategia SEO/SEM por sector y automatización de los procesos internos del equipo.',
      ],
      en: [
        'Built **single-handedly** and took to production a **time-tracking application in Laravel**: an SSR monolith with **a database per tenant** and a central one for identity and routing.',
        'The frontend ran on a commercial template; the **backend, code-first data model and business logic were my own**.',
        'Clock-in with geolocation, leave with overlap validation and an approval flow, admin, HR and employee roles, and per-role dashboards.',
        'Bespoke development in Laravel and optimisation of client CMS and e-commerce sites (WordPress, PrestaShop, Wix): domains, DNS, hosting, HTTPS and the redirects **technical SEO** called for.',
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
