import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Service } from '../models/Service.js';
import { Product } from '../models/Product.js';
import { CaseStudy } from '../models/CaseStudy.js';
import { Company } from '../models/Company.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zubyte_db';

// ─── 1. SERVICES DATA ────────────────────────────────────────────────────────
const SERVICES_SEED = [
  {
    group: 'Build',
    slug: 'build',
    portfolioKey: 'Web Development',
    icon: '⬡',
    color: '#1b1b1b',
    tagline: 'Web, mobile & bespoke software built to your specification.',
    img: 'photo-1555066931-4365d14bab8c',
    order: 1,
    items: [
      {
        name: 'Web Development',
        desc: 'Performant, scalable web applications built to your exact specification with modern frameworks.',
      },
      {
        name: 'Web Apps',
        desc: 'Full-stack SaaS platforms and custom business tools engineered for reliability at scale.',
      },
      {
        name: 'Mobile App Development',
        desc: 'Native and cross-platform apps for iOS and Android with seamless user experiences.',
      },
      {
        name: 'Software Development',
        desc: 'Bespoke software engineered around your workflows — from MVP to enterprise grade.',
      },
    ],
  },
  {
    group: 'Design',
    slug: 'design',
    portfolioKey: 'UI/UX Design',
    icon: '◇',
    color: '#F1681D',
    tagline: 'Research-led interfaces that convert and delight users.',
    img: 'photo-1561070791-2526d30994b5',
    order: 2,
    items: [
      {
        name: 'UI/UX Design',
        desc: 'Research-led interfaces that convert and retain users through clarity and delight.',
      },
      {
        name: 'Web Design',
        desc: 'Visually refined, fast-loading websites that communicate authority and trust.',
      },
      {
        name: 'Mobile App Design',
        desc: 'Intuitive mobile experiences from concept to handoff — every tap considered.',
      },
      {
        name: 'Product Design',
        desc: 'End-to-end product thinking from discovery to launch and beyond.',
      },
    ],
  },
  {
    group: 'Grow',
    slug: 'grow',
    portfolioKey: 'Digital Marketing',
    icon: '△',
    color: '#0ea5e9',
    tagline: 'Data-driven organic visibility and modern AI search presence.',
    img: 'photo-1460925895917-afdab827c52f',
    order: 3,
    items: [
      {
        name: 'SEO',
        desc: 'Technical and content SEO that builds lasting organic visibility across competitive markets.',
      },
      {
        name: 'AEO',
        desc: 'Answer Engine Optimization for the AI-search era — visibility where it matters most.',
      },
      {
        name: 'Google Business Profile',
        desc: 'Local visibility and reputation management to drive footfall and trust.',
      },
      {
        name: 'Digital Marketing',
        desc: 'Data-driven campaigns across search, social and display that move the needle.',
      },
    ],
  },
  {
    group: 'Deploy',
    slug: 'deploy',
    portfolioKey: 'Cloud & DevOps',
    icon: '◈',
    color: '#6366f1',
    tagline: 'Automated pipelines, cloud architecture, and zero-downtime releases.',
    img: 'photo-1558494949-ef010cbdcc31',
    order: 4,
    items: [
      {
        name: 'Deployment',
        desc: 'Reliable, repeatable deployment pipelines for any stack — zero surprises at launch.',
      },
      {
        name: 'Cloud Solutions',
        desc: 'Architecture, migration and optimization across AWS, GCP and Azure.',
      },
      {
        name: 'CI/CD',
        desc: 'Automated pipelines that ship code faster with confidence and full audit trails.',
      },
      {
        name: 'DevOps',
        desc: 'Infrastructure as code, monitoring and on-call support so you sleep soundly.',
      },
    ],
  },
  {
    group: 'Engineering',
    slug: 'engineering',
    portfolioKey: 'AI & Automation',
    icon: '⬢',
    color: '#10b981',
    tagline: 'System design, testing, structured observability, and repository hygiene.',
    img: 'photo-1504384308090-c894fdcc538d',
    order: 5,
    items: [
      {
        name: 'Architecture',
        desc: 'Scalable system design and technical blueprints engineered for growth and resilience.',
      },
      {
        name: 'Testing',
        desc: 'End-to-end test strategies — unit, integration, and E2E — that ship confidence, not bugs.',
      },
      {
        name: 'Logging',
        desc: 'Structured logging pipelines that surface insight and accelerate root-cause analysis.',
      },
      {
        name: 'Monitoring',
        desc: 'Real-time observability with alerts and dashboards so issues are caught before users are.',
      },
      {
        name: 'Git & Version Control',
        desc: 'Branch strategies, code review workflows, and repository hygiene that keep teams moving fast.',
      },
    ],
  },
];

// ─── 2. PRODUCTS DATA ────────────────────────────────────────────────────────
const PRODUCTS_SEED = [
  {
    id: 'edu',
    label: 'Education Technology',
    suite: 'Zubyte Edu',
    color: '#6366f1',
    tagline: 'End-to-end digital infrastructure for institutions, learners, and talent ecosystems.',
    desc: 'Zubyte Edu powers the full education lifecycle on a single connected platform — from admissions and campus administration through to learning delivery, skills assessment, and graduate placement.',
    subcategories: ['Education ERP', 'LMS', 'Digital Assessment', 'Student Lifecycle Management', 'Skill Development', 'Placement & Talent'],
    img: 'photo-1523050854058-8df90110c9f1',
    order: 1,
    products: [
      {
        name: 'One Digital Campus',
        type: 'Education ERP / Campus Management',
        desc: 'A unified ERP that digitises every administrative and academic process — admissions, fee management, timetabling, examinations, and alumni engagement.',
        status: 'Live',
      },
      {
        name: 'Zubyte LMS',
        type: 'Learning, Skills & Talent Platform',
        desc: 'An adaptive learning management system that delivers personalised learning paths, tracks competency progression, and bridges skill development with industry placement pipelines.',
        status: 'Live',
      },
    ],
  },
  {
    id: 'biz',
    label: 'Business Management',
    suite: 'Zubyte Business',
    color: '#10b981',
    tagline: 'A unified operational layer for billing, inventory, sales, and business intelligence.',
    desc: 'Zubyte Business consolidates the day-to-day operational tools that growing enterprises rely on — replacing fragmented point solutions with a single source of truth.',
    subcategories: ['Billing', 'Inventory', 'Sales', 'Purchase', 'Business Operations', 'Reporting & Analytics'],
    img: 'photo-1664575599736-c5197c684b36',
    order: 2,
    products: [
      {
        name: 'Zubyte Billing & Inventory',
        type: 'Business Operations Platform',
        desc: 'An integrated platform covering invoicing, inventory tracking, purchase management, sales operations, and real-time financial reporting — built to scale.',
        status: 'Live',
      },
    ],
  },
  {
    id: 'work',
    label: 'Workforce & Productivity',
    suite: 'Zubyte Work',
    color: '#0ea5e9',
    tagline: 'Unified project, team, and employee management for modern organisations.',
    desc: 'Zubyte Work brings project planning, task execution, team collaboration, and employee management into a single productivity layer.',
    subcategories: ['Project Management', 'Task Management', 'Team Management', 'Employee Management', 'Agile & Sprint', 'Productivity'],
    img: 'photo-1600880292203-757bb62b4baf',
    order: 3,
    products: [
      {
        name: 'Zubyte Workforce Management',
        type: 'Team & Project Management Platform',
        desc: 'A comprehensive management suite covering project delivery, task workflows, sprint planning, employee records, and productivity analytics.',
        status: 'Live',
      },
    ],
  },
  {
    id: 'staff',
    label: 'Workforce Marketplace',
    suite: 'Zubyte Staff',
    color: '#F1681D',
    tagline: 'Verified workforce on demand — sourced, deployed, and managed through one platform.',
    desc: 'Zubyte Staff connects enterprises with a pre-screened pool of temporary, contract, and blue-collar workers, automating the complete deployment lifecycle.',
    subcategories: ['Temporary Staffing', 'Blue-Collar Workforce', 'Contractor Hiring', 'On-demand Workforce', 'Workforce Deployment'],
    img: 'photo-1504307651254-35680f356dfd',
    order: 4,
    products: [
      {
        name: 'Zubyte Get Staff',
        type: 'Workforce Marketplace & Deployment Platform',
        desc: 'A structured marketplace that matches businesses with qualified temporary and contract workers, handling sourcing, compliance checks, and deployment coordination.',
        status: 'Beta',
      },
    ],
  },
];

// ─── 3. PORTFOLIO CASE STUDIES (21 SERVICES) ─────────────────────────────────
const CASE_STUDIES_SEED = [
  {
    service: 'Web Development',
    group: 'Build',
    subcategory: 'Financial Portal',
    tags: ['Build', 'Web Development', 'Next.js', 'React', 'Node.js'],
    title: 'Enterprise Client Portal',
    img: 'photo-1460925895917-afdab827c52f',
    shortDesc: 'A secure, multi-tenant client portal built for a financial services firm handling 50,000+ monthly active users.',
    stars: [
      { label: 'Situation', text: 'The client relied on a legacy intranet that caused frequent downtime and frustrated both staff and customers.' },
      { label: 'Task', text: 'Design and deliver a modern, scalable web portal with role-based access, real-time data dashboards, and document management.' },
      { label: 'Action', text: 'Built a Next.js frontend with a Node.js API layer, PostgreSQL database, and AWS infrastructure with CI/CD pipelines.' },
      { label: 'Result', text: 'Reduced support tickets by 42%, improved page load time by 3×, and achieved 99.97% uptime in the first six months.' },
    ],
  },
  {
    service: 'Web Apps',
    group: 'Build',
    subcategory: 'SaaS Platform',
    tags: ['Build', 'Web Apps', 'React', 'WebSockets', 'Recharts'],
    title: 'SaaS Analytics Dashboard',
    img: 'photo-1551288049-bebda4e38f71',
    shortDesc: 'Real-time analytics web application for a logistics SaaS platform with live shipment tracking and KPI monitoring.',
    stars: [
      { label: 'Situation', text: 'Operations teams were exporting CSVs manually to produce weekly reports — a process that took 4–6 hours per cycle.' },
      { label: 'Task', text: 'Build a live dashboard web app that surfaces shipment status, delay predictions, and cost analytics without manual intervention.' },
      { label: 'Action', text: 'Developed a React web app with WebSocket feeds, Recharts visualisations, and a Python data pipeline on GCP.' },
      { label: 'Result', text: 'Reporting time dropped from 5 hours to under 10 minutes, and on-time delivery rate improved by 11% within one quarter.' },
    ],
  },
  {
    service: 'Mobile App Development',
    group: 'Build',
    subcategory: 'Mobile App',
    tags: ['Build', 'Mobile App Development', 'React Native', 'iOS', 'Android'],
    title: 'Cross-Platform Logistics Fleet App',
    img: 'photo-1512941937669-90a1b58e7e9c',
    shortDesc: 'Native iOS & Android mobile application for field delivery drivers with offline routing and instant proof-of-delivery.',
    stars: [
      { label: 'Situation', text: 'Delivery drivers faced spotty connectivity in rural areas, resulting in dropped delivery confirmations and delayed invoicing.' },
      { label: 'Task', text: 'Develop a robust cross-platform mobile app with offline-first SQLite sync, GPS telemetry, and camera barcode scanning.' },
      { label: 'Action', text: 'Engineered a React Native application with background location tracking, encrypted local storage, and automated cloud sync on reconnect.' },
      { label: 'Result', text: 'Eliminated 100% of lost delivery records, reduced driver onboarding time to 15 minutes, and processed 1.2M deliveries in year one.' },
    ],
  },
  {
    service: 'Software Development',
    group: 'Build',
    subcategory: 'Enterprise ERP',
    tags: ['Build', 'Software Development', 'Python', 'Go', 'PostgreSQL'],
    title: 'Bespoke Warehouse ERP Engine',
    img: 'photo-1553877522-43269d4ea984',
    shortDesc: 'Custom inventory management and supply chain software engineered to replace three disjointed legacy systems.',
    stars: [
      { label: 'Situation', text: 'A national distributor struggled with inventory discrepancies between warehouses, causing £450k in annual overstock waste.' },
      { label: 'Task', text: 'Engineer bespoke software tailored to complex picking workflows, automated replenishment rules, and vendor EDI feeds.' },
      { label: 'Action', text: 'Architected a modular Go backend with high-concurrency order reconciliation, real-time inventory locking, and audit trails.' },
      { label: 'Result', text: 'Inventory accuracy increased from 84% to 99.4%, carrying costs dropped by 28%, and order dispatch cycle sped up by 2.4×.' },
    ],
  },
  {
    service: 'UI/UX Design',
    group: 'Design',
    subcategory: 'FinTech UX',
    tags: ['Design', 'UI/UX Design', 'Figma', 'Research', 'Wireframing'],
    title: 'Mobile Banking App Redesign',
    img: 'photo-1563986768609-322da13575f3',
    shortDesc: 'End-to-end UX overhaul of a retail banking app serving 200,000+ customers across three regions.',
    stars: [
      { label: 'Situation', text: 'App store ratings had fallen to 2.8 stars due to navigation confusion and an inconsistent visual language.' },
      { label: 'Task', text: 'Redesign the complete user experience — from onboarding to recurring payments — within a 12-week timeline.' },
      { label: 'Action', text: 'Conducted user research with 60 participants, rebuilt the design system in Figma, and delivered high-fidelity prototypes for developer handoff.' },
      { label: 'Result', text: 'App rating rose to 4.6 stars post-launch, onboarding drop-off reduced by 34%, and task completion time improved by 28%.' },
    ],
  },
  {
    service: 'Web Design',
    group: 'Design',
    subcategory: 'Brand & Web',
    tags: ['Design', 'Web Design', 'Figma', 'Responsive', 'Motion'],
    title: 'Headless E-Commerce Web Design',
    img: 'photo-1556742049-0cfed4f6a45d',
    shortDesc: 'Visually refined, high-converting digital storefront design for a luxury D2C apparel brand.',
    stars: [
      { label: 'Situation', text: 'The client previous website looked generic and failed to communicate luxury brand authority, hurting high-ticket conversion.' },
      { label: 'Task', text: 'Craft an editorial-style web design system with fluid micro-interactions, responsive typography, and frictionless checkout.' },
      { label: 'Action', text: 'Created bespoke 3D product showcase layouts, intuitive filter drawers, and rapid checkout patterns with full accessibility compliance.' },
      { label: 'Result', text: 'Average order value (AOV) increased by 23%, bounce rate decreased from 54% to 31%, and brand affinity scores reached all-time highs.' },
    ],
  },
  {
    service: 'Mobile App Design',
    group: 'Design',
    subcategory: 'App Interface',
    tags: ['Design', 'Mobile App Design', 'iOS Design', 'Android Material'],
    title: 'Healthcare Telemedicine App Design',
    img: 'photo-1576091160399-112ba8d25d1d',
    shortDesc: 'Patient-centered mobile interface designed for accessible video consultations and prescription tracking.',
    stars: [
      { label: 'Situation', text: 'Elderly patients struggled with tiny tap targets and convoluted navigation in an existing healthcare app.' },
      { label: 'Task', text: 'Design an empathetic, AA-accessible mobile interface that makes booking doctors and reviewing vitals effortless.' },
      { label: 'Action', text: 'Introduced high-contrast typographic scales, thumb-friendly navigation sheets, and simple step-by-step appointment wizards.' },
      { label: 'Result', text: 'Appointment completion rates increased by 47%, customer support call volume dropped by 60%, and user satisfaction reached 94%.' },
    ],
  },
  {
    service: 'Product Design',
    group: 'Design',
    subcategory: 'SaaS Product',
    tags: ['Design', 'Product Design', 'Design System', 'Storybook'],
    title: 'B2B SaaS Product Onboarding Flow',
    img: 'photo-1586717791821-3f44a563fa4c',
    shortDesc: 'Redesigned the onboarding experience and design system for a 15,000-seat HR SaaS platform.',
    stars: [
      { label: 'Situation', text: 'New enterprise accounts were taking an average of 11 days to complete setup, leading to high churn in the first month.' },
      { label: 'Task', text: 'Identify friction points in the onboarding funnel and design a guided setup experience that gets teams productive within 48 hours.' },
      { label: 'Action', text: 'Ran jobs-to-be-done interviews, mapped 23 user journeys, and shipped a progress-based onboarding wizard with contextual help.' },
      { label: 'Result', text: 'Time-to-first-value dropped from 11 days to 2.5 days, 30-day retention increased by 22%, and NPS improved from 31 to 54.' },
    ],
  },
  {
    service: 'SEO',
    group: 'Grow',
    subcategory: 'Technical SEO',
    tags: ['Grow', 'SEO', 'Technical SEO', 'Content Strategy', 'Core Web Vitals'],
    title: 'Technical & Content SEO Growth Programme',
    img: 'photo-1432888622747-4eb9a8efeb07',
    shortDesc: '12-month organic search growth programme for a B2B SaaS platform in a highly competitive market.',
    stars: [
      { label: 'Situation', text: 'The company blog received fewer than 3,000 monthly organic visits despite publishing two articles per week.' },
      { label: 'Task', text: 'Develop and execute a technical and content SEO strategy that captures high-intent purchase searches.' },
      { label: 'Action', text: 'Performed a full technical crawl audit, rebuilt site schema structure, resolved Core Web Vitals, and published 40+ topic cluster pillars.' },
      { label: 'Result', text: 'Organic traffic grew from 3,000 to 38,000 monthly sessions in 12 months, driving 34% of all demo pipeline.' },
    ],
  },
  {
    service: 'AEO',
    group: 'Grow',
    subcategory: 'AI Search Optimization',
    tags: ['Grow', 'AEO', 'AI Search', 'Perplexity', 'ChatGPT Search', 'Schema'],
    title: 'Answer Engine Optimization (AEO) Framework',
    img: 'photo-1618005182384-a83a8bd57fbe',
    shortDesc: 'Next-gen Answer Engine Optimization campaign positioning an enterprise SaaS brand inside AI search models.',
    stars: [
      { label: 'Situation', text: 'Prospective buyers were increasingly researching software via ChatGPT, Perplexity, and Google AI Overviews where the client was unreferenced.' },
      { label: 'Task', text: 'Restructure company digital assets and knowledge graphs so LLMs cite the client as a recommended market solution.' },
      { label: 'Action', text: 'Implemented structured JSON-LD entity schemas, published authoritative factual comparison datasets, and optimized digital PR citations.' },
      { label: 'Result', text: 'Achieved 78% brand citation frequency across top 5 AI engines for target search prompts, generating 140+ qualified monthly leads.' },
    ],
  },
  {
    service: 'Google Business Profile',
    group: 'Grow',
    subcategory: 'Local Search',
    tags: ['Grow', 'Google Business Profile', 'Local SEO', 'Reputation'],
    title: 'Multi-Location GBP Local Dominance',
    img: 'photo-1557804506-669a67965ba0',
    shortDesc: 'Complete optimization and reputation strategy for a 24-location retail network across major metropolitan areas.',
    stars: [
      { label: 'Situation', text: 'Local branches were losing footfall to competitors due to incomplete profiles, outdated photos, and unmanaged review scores.' },
      { label: 'Task', text: 'Standardize, claim, and systematically optimize Google Business Profiles for all 24 locations to rank in Google Maps 3-Pack.' },
      { label: 'Action', text: 'Audited local citations, established automated review collection workflows, added geocoded photos, and scheduled weekly location posts.' },
      { label: 'Result', text: 'Map discovery impressions surged by 210%, direct phone calls grew by 64%, and average review score rose from 3.6 to 4.8 stars.' },
    ],
  },
  {
    service: 'Digital Marketing',
    group: 'Grow',
    subcategory: 'Performance Marketing',
    tags: ['Grow', 'Digital Marketing', 'PPC', 'Paid Social', 'ROAS'],
    title: 'Multi-Channel Performance Marketing',
    img: 'photo-1533750349088-cd871a92f312',
    shortDesc: 'End-to-end paid acquisition strategy across Google, Meta, and LinkedIn targeting B2B decision makers.',
    stars: [
      { label: 'Situation', text: 'The client was burning £45,000/month on paid media with an unsustainable cost-per-acquisition (CPA) and declining ROAS.' },
      { label: 'Task', text: 'Restructure the paid media architecture to cut acquisition costs by 40% while accelerating qualified pipeline volume.' },
      { label: 'Action', text: 'Segmented audiences by buying intent, deployed creative video assets, and installed server-side conversion tracking via CRM webhooks.' },
      { label: 'Result', text: 'Cost-per-acquisition dropped by 46%, qualified pipeline increased 2.3×, and blended return on ad spend (ROAS) reached 3.1×.' },
    ],
  },
  {
    service: 'Deployment',
    group: 'Deploy',
    subcategory: 'Zero-Downtime Releases',
    tags: ['Deploy', 'Deployment', 'Blue-Green', 'Rollback', 'Docker'],
    title: 'Zero-Downtime Blue-Green Deployment',
    img: 'photo-1618401471353-b98afee0b2eb',
    shortDesc: 'Production release orchestration engine enabling risk-free, instant deployments for a high-traffic fintech app.',
    stars: [
      { label: 'Situation', text: 'Software deployments required scheduled 2:00 AM maintenance windows with 30-minute system blackouts.' },
      { label: 'Task', text: 'Design and implement a blue-green deployment strategy enabling zero-downtime releases during normal business hours.' },
      { label: 'Action', text: 'Configured AWS ALB traffic splitting, automated health-check gates, containerized microservices, and instant automated rollback triggers.' },
      { label: 'Result', text: 'Achieved 100% zero-downtime releases, cut release anxiety, and enabled engineering to ship 5+ production updates per day.' },
    ],
  },
  {
    service: 'Cloud Solutions',
    group: 'Deploy',
    subcategory: 'AWS & GCP Architecture',
    tags: ['Deploy', 'Cloud Solutions', 'AWS', 'Terraform', 'Cloud Migration'],
    title: 'Multi-Region Cloud Infrastructure Migration',
    img: 'photo-1451187580459-43490279c0fa',
    shortDesc: 'Full cloud modernization from legacy on-premise hardware to an auto-scaling multi-region AWS architecture.',
    stars: [
      { label: 'Situation', text: 'Ageing on-premise servers were causing monthly outages and limiting international expansion.' },
      { label: 'Task', text: 'Migrate all production workloads to AWS with zero data loss, low latency for global users, and strict SOC-2 compliance.' },
      { label: 'Action', text: 'Provisioned infrastructure as code with Terraform, containerized services onto AWS ECS, and set up Amazon Aurora multi-region replication.' },
      { label: 'Result', text: 'Infrastructure costs dropped by 31%, uptime hit 99.99%, and mean time to recovery (MTTR) dropped from 4 hours to 22 minutes.' },
    ],
  },
  {
    service: 'CI/CD',
    group: 'Deploy',
    subcategory: 'Automation Pipelines',
    tags: ['Deploy', 'CI/CD', 'GitHub Actions', 'Docker', 'Automated Testing'],
    title: 'Automated CI/CD Pipeline Modernisation',
    img: 'photo-1518432031352-d6fc5c10da5a',
    shortDesc: 'Redesigned a fragmented deployment process into a fully automated continuous integration & continuous deployment pipeline.',
    stars: [
      { label: 'Situation', text: 'Releases were manual and required dedicated engineer babysitting — resulting in infrequent fortnightly releases.' },
      { label: 'Task', text: 'Implement a GitHub Actions CI/CD pipeline with automated linting, test suites, preview environments, and safe deployment gates.' },
      { label: 'Action', text: 'Wrote modular workflow actions, ephemeral preview deployments per PR, automated security vulnerability scans, and Slack webhooks.' },
      { label: 'Result', text: 'Release cadence improved from fortnightly to multiple times daily, test execution time dropped by 65%, and zero failed releases.' },
    ],
  },
  {
    service: 'DevOps',
    group: 'Deploy',
    subcategory: 'Kubernetes & Infrastructure',
    tags: ['Deploy', 'DevOps', 'Kubernetes', 'Helm', 'Infrastructure as Code'],
    title: 'Kubernetes Orchestration & DevOps Pipeline',
    img: 'photo-1558494949-ef010cbdcc31',
    shortDesc: 'Enterprise Kubernetes cluster setup with automated pod autoscaling and self-healing infrastructure.',
    stars: [
      { label: 'Situation', text: 'Sudden traffic spikes caused service thrashing and manual server scaling was too slow to prevent user drops.' },
      { label: 'Task', text: 'Deploy production-grade Kubernetes (EKS) with Horizontal Pod Autoscaling (HPA) and automated node provisioning.' },
      { label: 'Action', text: 'Configured Helm charts, Karpenter autoscaling, secrets management via HashiCorp Vault, and isolated dev/staging/prod namespaces.' },
      { label: 'Result', text: 'Handled 10× sudden traffic spikes without manual intervention, reduced compute idle costs by 40%, and achieved automated self-healing.' },
    ],
  },
  {
    service: 'Architecture',
    group: 'Engineering',
    subcategory: 'System Architecture',
    tags: ['Engineering', 'Architecture', 'Microservices', 'Event-Driven', 'Kafka'],
    title: 'Event-Driven Microservices Architecture',
    img: 'photo-1504384308090-c894fdcc538d',
    shortDesc: 'Architectural blueprint and implementation for an event-driven distributed system processing 25,000 events/sec.',
    stars: [
      { label: 'Situation', text: 'A monolithic database was experiencing lock contention under heavy write loads, blocking order processing.' },
      { label: 'Task', text: 'Architect a resilient event-driven architecture using message queues to decouple services and ensure eventual consistency.' },
      { label: 'Action', text: 'Designed Kafka event streaming topics, domain-driven CQRS models, and dead-letter queue recovery mechanisms.' },
      { label: 'Result', text: 'System throughput scaled 8× to 25k events/sec with zero message loss and eliminated single points of failure.' },
    ],
  },
  {
    service: 'Testing',
    group: 'Engineering',
    subcategory: 'Quality Assurance',
    tags: ['Engineering', 'Testing', 'Playwright', 'Jest', 'End-to-End'],
    title: 'End-to-End QA Automation Suite',
    img: 'photo-1516321318423-f06f85e504b3',
    shortDesc: 'Comprehensive automated testing suite covering unit, integration, visual regression, and E2E flows.',
    stars: [
      { label: 'Situation', text: 'Manual regression testing took 3 full days prior to each release, creating a massive engineering bottleneck.' },
      { label: 'Task', text: 'Build an automated testing pipeline that validates all critical user journeys in under 10 minutes.' },
      { label: 'Action', text: 'Implemented Playwright E2E suites, Jest unit mocks, and visual regression testing in parallel CI runners.' },
      { label: 'Result', text: 'Regression test duration plummeted from 3 days to 8 minutes, catching 98% of bugs before reaching staging environments.' },
    ],
  },
  {
    service: 'Logging',
    group: 'Engineering',
    subcategory: 'Structured Logs',
    tags: ['Engineering', 'Logging', 'Grafana Loki', 'OpenTelemetry', 'ELK'],
    title: 'Centralized Structured Logging Infrastructure',
    img: 'photo-1551288049-bebda4e38f71',
    shortDesc: 'High-volume structured logging and distributed trace pipeline across 45 microservices.',
    stars: [
      { label: 'Situation', text: 'Developers spent hours SSH-ing into individual instances and grepping unstructured text logs to diagnose production bugs.' },
      { label: 'Task', text: 'Standardize JSON logging and build a unified search and aggregation pipeline with millisecond query speeds.' },
      { label: 'Action', text: 'Deployed vector log forwarders, Grafana Loki storage, correlation trace IDs across all HTTP requests, and sanitized PII data.' },
      { label: 'Result', text: 'Issue diagnosis time dropped from 2 hours to under 3 minutes, and log storage costs reduced by 55% via stream compression.' },
    ],
  },
  {
    service: 'Monitoring',
    group: 'Engineering',
    subcategory: 'Observability',
    tags: ['Engineering', 'Monitoring', 'Prometheus', 'Datadog', 'PagerDuty'],
    title: 'Real-Time Observability & Monitoring Stack',
    img: 'photo-1504868584819-f8e8b4b6d7e3',
    shortDesc: 'Unified monitoring platform covering metrics, latency SLAs, real-time alerting, and on-call runbooks.',
    stars: [
      { label: 'Situation', text: 'Engineering teams were reactive — incidents were discovered by customers on Twitter before internal ops was alerted.' },
      { label: 'Task', text: 'Establish proactive observability with synthetic uptime checks, error rate thresholds, and automated escalation policies.' },
      { label: 'Action', text: 'Set up Prometheus & Grafana dashboards, Datadog APM tracing, SLA anomaly alerts, and integrated with PagerDuty.' },
      { label: 'Result', text: 'Mean time to detect (MTTD) fell from 47 minutes to under 4 minutes, and customer-reported incidents dropped by 71%.' },
    ],
  },
  {
    service: 'Git & Version Control',
    group: 'Engineering',
    subcategory: 'Repository Hygiene',
    tags: ['Engineering', 'Git & Version Control', 'Monorepo', 'Turborepo', 'Trunk-Based'],
    title: 'Enterprise Monorepo & Branching Strategy',
    img: 'photo-1618401471353-b98afee0b2eb',
    shortDesc: 'Consolidation of 18 disparate repos into a unified high-performance monorepo with automated code ownership.',
    stars: [
      { label: 'Situation', text: 'Fragmented repositories caused cross-team dependency hell, version mismatches, and duplicated utility code.' },
      { label: 'Task', text: 'Design a unified monorepo with trunk-based development, shared UI libraries, and automated CODEOWNERS reviews.' },
      { label: 'Action', text: 'Migrated codebases using Turborepo and npm workspaces, configured branch protection rules, semantic versioning, and auto-releases.' },
      { label: 'Result', text: 'Cross-team pull request velocity accelerated by 3×, duplicated packages were eliminated, and developer onboarding took under an hour.' },
    ],
  },
];

// ─── 4. COMPANY PROFILE & FAQS ───────────────────────────────────────────────
const COMPANY_SEED = {
  name: 'Zubyte Solution',
  legalName: 'Zubyte IT Solutions Inc.',
  tagline: 'Where Ideas Evolve Into Products',
  description:
    'End-to-end technology partner for companies that want to build, grow and operate with confidence. We engineer bespoke software, intelligent systems, and scalable product platforms.',
  email: 'hello@zubyte.com',
  phone: '+1 (800) 555-0199',
  stats: [
    { stat: '50+', label: 'Products launched', sub: 'across 12 industries' },
    { stat: '98%', label: 'Retention rate', sub: 'clients return for more' },
    { stat: '4×', label: 'Average ROI', sub: 'within 12 months' },
    { stat: '8 wk', label: 'Time to market', sub: 'from brief to live MVP' },
  ],
  clientLogos: [
    { name: 'APEX SYSTEMS', order: 1, active: true },
    { name: 'NOVACORP', order: 2, active: true },
    { name: 'SYNTHESIS', order: 3, active: true },
    { name: 'VERTEX AI', order: 4, active: true },
    { name: 'HYPERION', order: 5, active: true },
    { name: 'LUMEN LABS', order: 6, active: true },
  ],
  leadership: {

    name: 'Dinesh Murugan',
    role: 'CEO, ZuByte Solution',
    quote:
      'Zubyte was built with the desire to liberate creative teams from menial tasks, allowing them to focus on true strategic innovation.',
  },
  offices: [
    {
      city: 'New York',
      role: 'Headquarters',
      address: 'One World Trade Center, Suite 4500, New York, NY 10007, United States',
    },
    {
      city: 'London',
      role: 'European Hub',
      address: '25 Bank Street, Canary Wharf, London E14 5JP, United Kingdom',
    },
    {
      city: 'Singapore',
      role: 'APAC Region',
      address: 'Marina Bay Financial Centre, Tower 1, Singapore 018981',
    },
  ],
  faqs: [
    {
      q: 'How does a typical project start?',
      a: 'We begin with a discovery call to understand your goals, timeline and constraints. Within 48 hours we share a scoped proposal with a clear breakdown of deliverables, timeline and cost.',
    },
    {
      q: 'Do you work with early-stage startups?',
      a: 'Yes. We work with founders from pre-product through to Series A. Our modular approach means you pay for what you actually need right now.',
    },
    {
      q: 'Can you take over an existing codebase?',
      a: 'Absolutely. We have rescued and extended projects in React, Vue, Next.js, Node, Python, and more. We start with a codebase audit before committing to a scope.',
    },
    {
      q: 'What is your delivery process?',
      a: 'Discover → Design → Build → Deploy → Improve. We work in two-week sprints with regular demos, so you always see what is being built.',
    },
    {
      q: 'Do you offer ongoing support after launch?',
      a: 'Yes. We offer retainer-based maintenance and support packages, or ad-hoc engagements for post-launch iterations.',
    },
  ],
};

// ─── SEED EXECUTION ──────────────────────────────────────────────────────────
const seedDatabase = async () => {
  try {
    console.log(`[Seed] Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      Service.deleteMany({}),
      Product.deleteMany({}),
      CaseStudy.deleteMany({}),
      Company.deleteMany({}),
    ]);

    console.log('[Seed] Inserting Services (5 disciplines & 21 services)...');
    await Service.insertMany(SERVICES_SEED);

    console.log('[Seed] Inserting Product Suites (4 enterprise suites)...');
    await Product.insertMany(PRODUCTS_SEED);

    console.log('[Seed] Inserting Case Studies (21 STAR case studies)...');
    await CaseStudy.insertMany(CASE_STUDIES_SEED);

    console.log('[Seed] Inserting Company Profile & FAQs...');
    await Company.create(COMPANY_SEED);

    console.log('✅ [Seed] Database successfully seeded with Zubyte data!');
    process.exit(0);
  } catch (error) {
    console.error(`❌ [Seed Error] ${error.message}`);
    process.exit(1);
  }
};

export { SERVICES_SEED, PRODUCTS_SEED, CASE_STUDIES_SEED, COMPANY_SEED };

if (process.argv[1] && process.argv[1].includes('seedData.js')) {
  seedDatabase();
}

