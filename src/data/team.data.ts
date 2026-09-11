export interface TeamMemberStat {
  label: string;
  value: string;
}

export interface DomainExpertise {
  title: string;
  description: string;
  badge: string;
  highlightSkills: string[];
}

export interface FeaturedProject {
  title: string;
  role: string;
  description: string;
  metrics: string;
  tech: string[];
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface EducationCredential {
  degree: string;
  institution: string;
  period: string;
  description: string;
  type: "degree" | "certification";
}

export interface TeamMemberDetails {
  slug: string;
  name: string;
  role: string;
  shortRole: string;
  department: string;
  institute: string;
  location: string;
  tagline: string;
  bio: string;
  fullBio: string[];
  philosophy: string;
  initials: string;
  image?: string;
  gradient: string;
  roleBadgeVariant: "primary" | "warning" | "success" | "default";
  stats: TeamMemberStat[];
  coreExpertise: DomainExpertise[];
  featuredProjects: FeaturedProject[];
  skills: string[];
  categorizedSkills: SkillCategory[];
  credentials: EducationCredential[];
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    email?: string;
    portfolio?: string;
  };
}

export const teamMembersData: TeamMemberDetails[] = [
  {
    slug: "md-mahfuzul-haque",
    name: "MD Mahfuzul Haque",
    role: "Fullstack Web Developer & Systems Architect",
    shortRole: "Fullstack Web Developer",
    department: "Computer Science & Technology (CST)",
    institute: "Mymensingh Polytechnic Institute",
    location: "Mymensingh, Bangladesh",
    tagline: "Architecting high-performance distributed web systems, Next.js applications, and Claude-powered deterministic AI engines.",
    bio: "Specializing in modern full-stack architectures, Next.js, high-performance APIs, and scalable SaaS solutions.",
    fullBio: [
      "Mahfuzul is the foundational architect behind Nexora's core engineering framework. With a rigorous computer science foundation from Mymensingh Polytechnic Institute (CST), he focuses on the intersection of bleeding-edge modern web runtimes and distributed backend architectures.",
      "His engineering standard is rooted in uncompromising performance: sub-100ms API response latency, zero layout shifts, CWV 100/100 scores, and modular design token standards. He leads the development of production Next.js 15+ systems, Express microservices, and AI pipelines that transform business requirements into production-ready software.",
      "Beyond coding, Mahfuzul oversees technical design reviews, database indexing strategies, and automated CI/CD deployment pipelines to ensure every client platform remains resilient under heavy concurrent traffic."
    ],
    philosophy: "A web application is not an ornament—it is a mission-critical business engine. If it takes 3 seconds to load or fails under traffic spikes, it has failed its fundamental purpose. Engineering purity and speed are non-negotiable.",
    initials: "MH",
    gradient: "from-primary-500/25 via-primary-500/10 to-transparent",
    roleBadgeVariant: "primary",
    stats: [
      { label: "Core Web Vitals", value: "100/100" },
      { label: "Production Deployments", value: "35+" },
      { label: "Client Uptime Record", value: "99.98%" },
      { label: "Code Coverage", value: "94%" },
    ],
    coreExpertise: [
      {
        title: "Enterprise Next.js 15 & React 19 Architecture",
        badge: "Full-Stack Core",
        description: "Mastery of React Server Components (RSC), Incremental Static Regeneration (ISR), Server Actions, parallel routes, and edge runtime middleware for zero-bundle-overhead client delivery.",
        highlightSkills: ["Next.js 15 App Router", "React 19", "TypeScript", "Edge Runtime", "Turbopack"],
      },
      {
        title: "High-Throughput Node.js & Express REST APIs",
        badge: "Backend Engineering",
        description: "Designing robust, stateless microservices with structured JSON error boundaries, rate-limiting, JWT authentication, and high-concurrency event loops.",
        highlightSkills: ["Node.js", "Express.js", "REST Architecture", "Better-Auth", "API Security"],
      },
      {
        title: "Database Modeling & High-Performance Indexing",
        badge: "Data Layer",
        description: "Architecting scalable MongoDB schemas, compound index optimization, Mongoose middleware hooks, and caching layers with Redis for instant data retrieval.",
        highlightSkills: ["MongoDB", "Mongoose", "Aggregation Pipelines", "Redis", "Schema Design"],
      },
      {
        title: "Deterministic AI Workflow Orchestration",
        badge: "AI leverage",
        description: "Integrating Anthropic Claude Sonnet pipelines with strict JSON schemas to deliver automated website generation, real-time code generation, and intelligent project estimations.",
        highlightSkills: ["Claude 3.7 / 3.5 Sonnet", "JSON Schema Enforcement", "Prompt Engineering", "Streaming Responses"],
      },
    ],
    featuredProjects: [
      {
        title: "Nexora Agency Architecture & AI Builder",
        role: "Lead Architect & Fullstack Engineer",
        description: "Engineered the full-stack architecture combining a Next.js 15 client with an Express API and Claude-powered AI component playground.",
        metrics: "Sub-50ms API response time, 100/100 Core Web Vitals score across all marketing pages.",
        tech: ["Next.js 15", "TypeScript", "Tailwind CSS v4", "Express.js", "MongoDB", "Framer Motion"],
      },
      {
        title: "Enterprise SaaS Analytics & Auth Hub",
        role: "Principal Systems Architect",
        description: "Built high-security session authentication, real-time metrics visualizer, and multi-tenant authorization layer.",
        metrics: "Supported 10,000+ concurrent state updates without frame drops or memory leaks.",
        tech: ["Node.js", "Recharts", "Better-Auth", "TypeScript", "MongoDB Aggregation"],
      },
      {
        title: "Interactive Dynamic Cost Calculator",
        role: "Fullstack Developer",
        description: "Architected a real-time reactive quotation algorithm calculating agency deliverables, sprint timelines, and PDF-ready breakdowns.",
        metrics: "Generated 500+ client proposals with 100% pricing accuracy and zero client-side latency.",
        tech: ["TypeScript", "Next.js", "State Machines", "Framer Motion"],
      },
    ],
    skills: ["Next.js", "TypeScript", "Node.js", "MongoDB", "Express.js"],
    categorizedSkills: [
      {
        category: "Frontend & UI Runtimes",
        items: ["Next.js 15+", "React 19", "TypeScript", "Tailwind CSS v4", "Framer Motion", "Recharts"],
      },
      {
        category: "Backend & Cloud Systems",
        items: ["Node.js", "Express.js", "RESTful Architecture", "JWT / Better-Auth", "Nginx", "Linux Server Admin"],
      },
      {
        category: "Databases & Storage",
        items: ["MongoDB", "Mongoose ORM", "Redis Caching", "Compound Indexing", "Data Aggregation"],
      },
      {
        category: "Engineering Practices",
        items: ["Git Version Control", "CI/CD Pipelines", "Clean Architecture", "Unit & Integration Testing", "CWV Performance"],
      },
    ],
    credentials: [
      {
        degree: "Diploma in Engineering (Computer Science & Technology)",
        institution: "Mymensingh Polytechnic Institute",
        period: "Ongoing / CST Division",
        description: "Specialized in data structures, database management systems, software architecture, operating systems, and computer network protocols.",
        type: "degree",
      },
      {
        degree: "Advanced Full-Stack TypeScript & Next.js Architecture",
        institution: "Industry Specialization",
        period: "2024 - Present",
        description: "Hands-on mastery in enterprise server-component state management, asynchronous distributed queues, and production security.",
        type: "certification",
      },
    ],
    socialLinks: {
      github: "https://github.com/msmahfuz3140",
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
      email: "mahfuzul@nexora.agency",
      portfolio: "https://mahfuzulhaque.dev",
    },
  },
  {
    slug: "jahidul-islam",
    name: "Jahidul Islam",
    role: "Co-Founder & Head of UI/UX Design",
    shortRole: "UI/UX Designer",
    department: "Computer Science & Technology (CST)",
    institute: "Mymensingh Polytechnic Institute",
    location: "Mymensingh, Bangladesh",
    tagline: "Crafting intuitive, accessible, and high-conversion design systems, interactive prototypes, and luxury digital product experiences.",
    bio: "Crafting intuitive, accessible, and high-conversion design systems, wireframes, and digital product experiences.",
    fullBio: [
      "Jahidul is Nexora's design visionary and human-computer interaction specialist. Blending computer science fundamentals with refined aesthetic discipline, he builds digital experiences that look stunning while driving tangible business conversion.",
      "His design philosophy revolves around 'Invisible Design'—interfaces so intuitive, fluid, and predictable that users accomplish complex workflows without a second of cognitive friction. He specializes in Figma component token architectures, atomic design hierarchy, WCAG 2.1 AA accessibility standards, and micro-interactions.",
      "At Nexora, Jahidul bridges the gap between Figma mockups and front-end reality, collaborating closely with developers to ensure that every pixel, bezier curve, and responsive breakpoint is faithfully rendered in production."
    ],
    philosophy: "Design is not what it looks like and feels like; design is how it works. A beautiful website that confuses its users is a failure. True design excellence exists at the intersection of emotional delight and conversion psychology.",
    initials: "JI",
    gradient: "from-amber-500/25 via-amber-500/10 to-transparent",
    roleBadgeVariant: "warning",
    stats: [
      { label: "Design Systems Built", value: "12+" },
      { label: "Avg Conversion Uplift", value: "+38%" },
      { label: "Accessibility Rating", value: "WCAG AA" },
      { label: "Component Libraries", value: "500+ Assets" },
    ],
    coreExpertise: [
      {
        title: "Enterprise Figma Design Systems & Token Architectures",
        badge: "Design Systems",
        description: "Creating scalable, tokenized multi-brand Figma libraries with auto-layout v5, variants, component properties, and dark/light adaptive color tokens.",
        highlightSkills: ["Figma Enterprise", "Design Tokens", "Atomic Design", "Style Guides", "Auto-Layout"],
      },
      {
        title: "Conversion-Focused UX Research & User Journey Mapping",
        badge: "User Experience",
        description: "Conducting qualitative user interviews, user journey friction audits, wireframing, heuristic evaluations, and high-impact information architecture restructuring.",
        highlightSkills: ["UX Research", "Information Architecture", "Wireframing", "Journey Mapping", "A/B Layout Testing"],
      },
      {
        title: "Interactive Prototyping & Motion Choreography",
        badge: "Micro-Interactions",
        description: "Prototyping state transitions, spring physics, scroll-triggered narrative pacing, and interactive components ready for developer handoff.",
        highlightSkills: ["Figma Smart Animate", "Motion Timing Curves", "Micro-interactions", "Prototype Usability"],
      },
      {
        title: "Accessibility & Cross-Platform Responsive Design",
        badge: "Inclusive Design",
        description: "Ensuring 100% compliance with WCAG 2.1 AA standards, high-contrast color ratios, ergonomic mobile touch targets, and resilient typography scales.",
        highlightSkills: ["WCAG 2.1 AA", "Color Contrast Science", "Mobile-First UX", "Responsive Grids"],
      },
    ],
    featuredProjects: [
      {
        title: "Nexora Unified Dark Design Token System",
        role: "Lead Product Designer",
        description: "Architected the comprehensive design system featuring custom HSL color palettes, cyber-glow accents, and ergonomic typography for the Nexora web ecosystem.",
        metrics: "Decreased front-end implementation time by 45% with direct token-to-Tailwind parity.",
        tech: ["Figma", "Tailwind CSS Token Mapping", "WCAG AA Auditing", "Vector Design"],
      },
      {
        title: "SaaS Enterprise Dashboard UI Overhaul",
        role: "Senior UI/UX Specialist",
        description: "Redesigned a high-density financial analytics dashboard with customizable widgets, chart readability enhancements, and contextual flyout drawers.",
        metrics: "Boosted daily active user retention by 28% and reduced task completion time by 3.2 minutes.",
        tech: ["Figma", "Interaction Design", "User Testing", "Information Architecture"],
      },
      {
        title: "High-Converting AI Agency Landing Page Suite",
        role: "Lead UI Designer",
        description: "Designed responsive hero sections, interactive service cards, and frictionless lead generation forms tailored for enterprise tech buyers.",
        metrics: "Delivered an average 34% increase in consultation booking conversion rates across 8 clients.",
        tech: ["Figma", "Conversion Rate Optimization", "Visual Design", "Micro-Interactions"],
      },
    ],
    skills: ["Figma", "UI/UX Design", "Design Systems", "Prototyping", "User Research"],
    categorizedSkills: [
      {
        category: "Design Software & Tools",
        items: ["Figma", "FigJam", "Adobe Illustrator", "Photoshop", "Penpot"],
      },
      {
        category: "UI & Visual Disciplines",
        items: ["Design Systems", "Dark Mode Styling", "Typography Hierarchy", "Color Science", "Iconography"],
      },
      {
        category: "UX & Research Disciplines",
        items: ["User Journey Mapping", "Wireframing & Lo-Fi", "Hi-Fi Prototyping", "Usability Testing", "CRO"],
      },
      {
        category: "Handoff & Collaboration",
        items: ["Tailwind CSS Tokens", "Design-to-Code Reviews", "Component Specs", "Responsive Breakpoint Specs"],
      },
    ],
    credentials: [
      {
        degree: "Diploma in Engineering (Computer Science & Technology)",
        institution: "Mymensingh Polytechnic Institute",
        period: "Ongoing / CST Division",
        description: "Studying human-computer interaction, software engineering principles, algorithms, and digital system design.",
        type: "degree",
      },
      {
        degree: "Advanced Design Systems & User Experience Architecture",
        institution: "Product Design Specialization",
        period: "2024 - Present",
        description: "Specialized training in scalable design token engineering, heuristic usability analysis, and conversion design.",
        type: "certification",
      },
    ],
    socialLinks: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
      email: "jahidul@nexora.agency",
      portfolio: "https://dribbble.com",
    },
  },
  {
    slug: "saif-khan",
    name: "Saif Khan",
    role: "Co-Founder & Cyber Security Lead",
    shortRole: "Cyber Security Specialist",
    department: "Computer Science & Technology (CST)",
    institute: "Mymensingh Polytechnic Institute",
    location: "Mymensingh, Bangladesh",
    tagline: "Hardening Linux infrastructure, engineering Zero-Trust network defenses, threat modeling, and securing mission-critical web applications.",
    bio: "Focused on hardening infrastructure, threat modeling, network defense, and web application security auditing.",
    fullBio: [
      "Saif leads Nexora's infrastructure defense and cyber resilience discipline. With a deep technical background from Mymensingh Polytechnic Institute (CST), he approaches web systems through the lens of zero-trust security and proactive defense-in-depth.",
      "He specializes in locking down cloud and bare-metal environments: configuring kernel-level firewall rules, enforcing strict SSH public key authentication, isolating services via Docker networks, deploying automated Intrusion Detection Systems (IDS), and eliminating all unnecessary attack surfaces.",
      "Saif works closely with the development team to ensure that security is integrated into every phase of the software development lifecycle (DevSecOps), from secret encryption and TLS 1.3 enforcement to robust rate limiting and DDoS prevention."
    ],
    philosophy: "Security is not a plugin you install at the end of a project. It is an architectural mindset. If your server is open to unauthorized ports or your database trusts unvalidated inputs, your business is operating on borrowed time.",
    initials: "SK",
    gradient: "from-emerald-500/25 via-emerald-500/10 to-transparent",
    roleBadgeVariant: "success",
    stats: [
      { label: "Server Hardening Audits", value: "40+" },
      { label: "Zero-Trust Deployments", value: "100%" },
      { label: "Unauthorized Breaches", value: "0" },
      { label: "Attack Surface Reduced", value: "85%" },
    ],
    coreExpertise: [
      {
        title: "Linux Server Hardening & Kernel-Level Security",
        badge: "Infrastructure Defense",
        description: "Hardening Ubuntu/Debian server fleets: CIS benchmark compliance, fail2ban rule configuration, UFW/iptables stateful inspection, and root login elimination.",
        highlightSkills: ["Linux Kernel Hardening", "Fail2ban", "UFW / iptables", "CIS Benchmarks", "SSH Key Infrastructure"],
      },
      {
        title: "Zero-Trust Architecture & Network Defense",
        badge: "Network Security",
        description: "Implementing strict least-privilege access control, isolated Docker bridge networks, mutual TLS, and private VPC subnetting for database protection.",
        highlightSkills: ["Zero-Trust Model", "Network Segmentation", "Docker Security", "TLS 1.3", "Reverse Proxy Hardening"],
      },
      {
        title: "DevSecOps & Automated Vulnerability Scanning",
        badge: "Pipeline Security",
        description: "Integrating static and dynamic code analysis (SAST/DAST), automated dependency auditing (npm audit, Snyk), and secret leak prevention into Git workflows.",
        highlightSkills: ["DevSecOps", "SAST / DAST", "Dependency Auditing", "Secret Management", "CI/CD Hardening"],
      },
      {
        title: "API Gateway Defense & DDoS Mitigation",
        badge: "Application Armor",
        description: "Engineering robust rate-limiting tiers, reverse proxy request inspection with Nginx, CORS policy sanitization, and automated anomalous traffic dropping.",
        highlightSkills: ["Nginx Hardening", "Rate Limiting", "DDoS Mitigation", "CORS Policy", "JWT Security"],
      },
    ],
    featuredProjects: [
      {
        title: "Nexora Zero-Trust Infrastructure Blueprint",
        role: "Lead Cyber Security Architect",
        description: "Designed and deployed the hardened multi-tier hosting architecture protecting client Node.js and MongoDB instances behind isolated Nginx reverse proxies.",
        metrics: "Repelled 150,000+ malicious automated scanner probes with zero downtime or unauthorized system access.",
        tech: ["Linux", "Nginx Hardening", "UFW", "Fail2ban", "Docker Isolation", "TLS 1.3"],
      },
      {
        title: "Enterprise Multi-Tenant API Armor",
        role: "Security Systems Engineer",
        description: "Configured adaptive IP rate-limiting, token replay prevention, and strict payload validation across all client-facing endpoints.",
        metrics: "Reduced bot and credential stuffing traffic by 99.4% on public authentication endpoints.",
        tech: ["Node.js Security", "Express Middleware", "Redis Rate Limiter", "OWASP Best Practices"],
      },
      {
        title: "Cloud Server Penetration & Vulnerability Lockdown",
        role: "Lead Auditor",
        description: "Performed comprehensive end-to-end port scans, privilege escalation simulations, and automated patch verifications for 10+ business servers.",
        metrics: "Closed 100% of discovered open ports and established automated daily security patch notifications.",
        tech: ["Nmap", "Wireshark", "OpenVAS", "Bash Automation", "Systemd Services"],
      },
    ],
    skills: ["Network Security", "App Hardening", "Penetration Testing", "Threat Analysis"],
    categorizedSkills: [
      {
        category: "Server & Operating System Security",
        items: ["Linux Administration (Ubuntu/Debian)", "UFW & Iptables", "Fail2ban", "Systemd Hardening", "SSH Protocol"],
      },
      {
        category: "Network Defense & Traffic",
        items: ["Nginx Reverse Proxy", "TLS / SSL Certificates", "Network Segmentation", "DDoS Mitigation", "Wireshark Analysis"],
      },
      {
        category: "DevSecOps & Code Protection",
        items: ["Git Secret Scanning", "Dependency Auditing", "Environment Key Protection", "Docker Container Hardening"],
      },
      {
        category: "Threat Management",
        items: ["Threat Modeling (STRIDE)", "Incident Response", "Log Auditing & Syslog", "Zero-Trust Enforcement"],
      },
    ],
    credentials: [
      {
        degree: "Diploma in Engineering (Computer Science & Technology)",
        institution: "Mymensingh Polytechnic Institute",
        period: "Ongoing / CST Division",
        description: "Focusing on telecommunications, computer networks, distributed systems, cryptography, and network security protocols.",
        type: "degree",
      },
      {
        degree: "Infrastructure Defense & Linux Server Security Certification",
        institution: "Cyber Security Practical Discipline",
        period: "2024 - Present",
        description: "Practical engineering certification covering advanced network packet inspection, intrusion prevention systems, and infrastructure hardening.",
        type: "certification",
      },
    ],
    socialLinks: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
      email: "saif@nexora.agency",
      portfolio: "https://saifkhan.security",
    },
  },
  {
    slug: "koushik-komar-paul",
    name: "Koushik Komar Paul",
    role: "Lead Security Auditor & Ethical Hacker",
    shortRole: "Ethical Hacking & Cyber Security",
    department: "Computer Science & Technology (CST)",
    institute: "Mymensingh Polytechnic Institute",
    location: "Mymensingh, Bangladesh",
    tagline: "Proactively uncovering zero-day vulnerabilities, OWASP Top 10 penetration testing, API bug auditing, and ensuring watertight client digital assets.",
    bio: "Conducting proactive vulnerability assessments, ethical hacking, and ensuring zero-day security resilience.",
    fullBio: [
      "Koushik is Nexora's offensive security lead and red-team penetration tester. Grounded in rigorous computer science principles from Mymensingh Polytechnic Institute (CST), he approaches digital products from the exact mindset of an adversary to expose weaknesses before they can ever be exploited.",
      "His technical expertise spans OWASP Top 10 vulnerability verification, Broken Object Level Authorization (BOLA) hunting in modern REST/GraphQL APIs, Server-Side Request Forgery (SSRF) prevention, Cross-Site Scripting (XSS), SQL Injection (SQLi), and business logic flaw remediation.",
      "Koushik has participated in responsible bug bounty programs, responsibly discovering and reporting critical vulnerabilities across global web properties. At Nexora, he subjects every client web application to rigorous stress tests, fuzzing, and penetration audits prior to public launch."
    ],
    philosophy: "To defend a fortress effectively, you must think, probe, and attack like the enemy outside the gates. We uncover the invisible cracks in your application's armor long before malicious actors have the chance to find them.",
    initials: "KP",
    gradient: "from-violet-500/25 via-violet-500/10 to-transparent",
    roleBadgeVariant: "default",
    stats: [
      { label: "Vulnerabilities Identified", value: "70+" },
      { label: "OWASP Top 10 Audits", value: "100% Pass" },
      { label: "API Flaws Discovered", value: "35+" },
      { label: "Bug Bounty Disclosures", value: "100% Responsible" },
    ],
    coreExpertise: [
      {
        title: "OWASP Top 10 Deep Penetration Testing",
        badge: "Offensive Security",
        description: "Exhaustive manual and automated testing for Injection (SQLi/NoSQLi), Broken Authentication, Sensitive Data Exposure, XML External Entities (XXE), and Security Misconfigurations.",
        highlightSkills: ["OWASP Top 10", "Burp Suite Pro", "SQLMap", "Payload Crafting", "Manual Penetration Testing"],
      },
      {
        title: "REST & GraphQL API Vulnerability Auditing",
        badge: "API Security",
        description: "Specialized in finding API vulnerabilities: IDOR/BOLA, mass assignment, unauthenticated administrative endpoints, rate limit bypasses, and improper asset management.",
        highlightSkills: ["API Pentesting", "IDOR / BOLA Hunting", "Postman Security Testing", "JWT Cracking / Validation", "SSRF Exploits"],
      },
      {
        title: "Vulnerability Assessment & Threat Reporting",
        badge: "Security Audits",
        description: "Generating comprehensive executive and developer-level remediation reports with CVSS v3.1 scoring, proof-of-concept exploits, and step-by-step patch verification.",
        highlightSkills: ["CVSS v3.1 Scoring", "Proof of Concept (PoC)", "Remediation Roadmaps", "Vulnerability Management"],
      },
      {
        title: "Bug Bounty Methodology & Reconnaissance",
        badge: "Red Teaming",
        description: "Advanced passive and active OSINT reconnaissance, sub-domain takeover discovery, directory brute-forcing, and zero-day threat vector simulation.",
        highlightSkills: ["Amass / Sublist3r", "Ffuf / Gobuster", "OSINT Recon", "Attack Surface Mapping", "Bug Hunting"],
      },
    ],
    featuredProjects: [
      {
        title: "Nexora Pre-Launch Red-Team Security Audit",
        role: "Lead Penetration Tester",
        description: "Conducted black-box and grey-box penetration testing across Nexora's web ecosystem, APIs, and authentication endpoints.",
        metrics: "Discovered and remediated 8 potential security oversights before production deployment, achieving 100% OWASP Top 10 compliance.",
        tech: ["Burp Suite Pro", "Nmap", "OWASP ZAP", "Custom Python Fuzzers", "API Stress Testing"],
      },
      {
        title: "Client Fintech Platform Security Certification",
        role: "Ethical Hacker & Security Auditor",
        description: "Performed end-to-end penetration audit on client payment gateway integration and user credential vault.",
        metrics: "Eliminated critical BOLA and authorization bypass risks, providing a certified clean bill of security health.",
        tech: ["Burp Suite", "Postman", "JWT Analyzer", "SQLMap", "CVSS Reporting"],
      },
      {
        title: "Responsible Vulnerability Disclosure Research",
        role: "Independent Ethical Hacker",
        description: "Engaged in authorized bug bounty programs identifying critical authorization flaws and data leak vectors.",
        metrics: "Acknowledged by multiple software organizations for responsible disclosures and patch suggestions.",
        tech: ["OSINT Tools", "Reconnaissance Pipelines", "Burp Suite", "Bash Scripting"],
      },
    ],
    skills: ["Ethical Hacking", "Vulnerability Assessment", "Security Audits", "Bug Bounty"],
    categorizedSkills: [
      {
        category: "Penetration Testing Tools",
        items: ["Burp Suite Professional", "OWASP ZAP", "SQLMap", "Nmap", "Metasploit", "Ffuf / Gobuster"],
      },
      {
        category: "Application Attack Surfaces",
        items: ["OWASP Top 10", "API Security (REST/GraphQL)", "IDOR / BOLA", "XSS & CSRF", "NoSQL Injection", "SSRF"],
      },
      {
        category: "Reconnaissance & OSINT",
        items: ["Subdomain Enumeration", "Passive DNS Analysis", "Port Scanning", "HTTP Header Inspection", "Directory Fuzzing"],
      },
      {
        category: "Reporting & Verification",
        items: ["CVSS v3.1 Scoring", "PoC Exploit Demonstration", "Developer Patch Validation", "Executive Risk Summaries"],
      },
    ],
    credentials: [
      {
        degree: "Diploma in Engineering (Computer Science & Technology)",
        institution: "Mymensingh Polytechnic Institute",
        period: "Ongoing / CST Division",
        description: "Focusing on computer systems architecture, data communications, network protocols, cryptography, and operating systems.",
        type: "degree",
      },
      {
        degree: "Certified Practical Ethical Hacking & Web Penetration Testing",
        institution: "Cyber Security & Red Teaming Specialization",
        period: "2024 - Present",
        description: "Extensive hands-on laboratories and practical examinations covering web application attacks, API security, and ethical vulnerability disclosure.",
        type: "certification",
      },
    ],
    socialLinks: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
      email: "koushik@nexora.agency",
      portfolio: "https://koushikpaul.tech",
    },
  },
  {
    slug: "sakib-al-hasan",
    name: "Sakib Al Hasan",
    role: "Head of Digital Marketing & Paid Ads Strategist",
    shortRole: "Digital Marketer & Ads Specialist",
    department: "Computer Science & Technology (CST)",
    institute: "Mymensingh Polytechnic Institute",
    location: "Mymensingh, Bangladesh",
    tagline: "Engineering high-ROI paid ad campaigns, algorithmic audience targeting, multi-platform ad funnels, and data-backed performance marketing.",
    bio: "Professional digital marketer running high-converting Meta, Google, and multi-channel paid ad campaigns with data-driven ROAS optimization.",
    fullBio: [
      "Sakib leads Nexora's performance marketing, paid acquisition, and growth engineering division. Studying Computer Science & Technology (CST) at Mymensingh Polytechnic Institute alongside the engineering core, he combines algorithmic data analysis with consumer psychology to scale businesses predictably.",
      "His methodology treats marketing as an exact science: structured A/B creative testing, server-side Conversion API (CAPI) tracking, dynamic retargeting matrices, and relentless return on ad spend (ROAS) optimization across Meta Ads Manager, Google Ads, and TikTok.",
      "At Nexora, Sakib works synergistically with UI/UX designers and full-stack engineers to ensure that marketing funnels, landing pages, and lead capture systems convert incoming traffic at industry-leading benchmarks."
    ],
    philosophy: "Traffic without conversion is vanity; ads without measurable ROAS are just an expense. We architect high-intent paid campaigns where every single taka or dollar invested yields compound revenue growth.",
    initials: "SH",
    gradient: "from-sky-500/25 via-blue-500/10 to-transparent",
    roleBadgeVariant: "primary",
    stats: [
      { label: "Average Campaign ROAS", value: "4.8x" },
      { label: "Ad Spend Managed", value: "$45K+" },
      { label: "Conversion Lift", value: "+52%" },
      { label: "A/B Creatives Tested", value: "350+" },
    ],
    coreExpertise: [
      {
        title: "Meta Ads & Algorithmic Campaign Architecture",
        badge: "Performance Marketing",
        description: "Executing Advantage+ campaigns, lookalike audience segmentation, dynamic creative optimization (DCO), and server-side Conversions API (CAPI) setup.",
        highlightSkills: ["Meta Ads Manager", "Audience Segmentation", "Conversions API (CAPI)", "Pixel Tracking", "Retargeting"],
      },
      {
        title: "Google Search & High-Intent PPC Campaigns",
        badge: "Search Marketing",
        description: "Deploying high-intent keyword architectures, negative keyword pruning, responsive search ads, Quality Score optimization, and Google Performance Max.",
        highlightSkills: ["Google Ads", "PPC Strategy", "Quality Score Optimization", "Performance Max", "Keyword Research"],
      },
      {
        title: "Conversion Rate Optimization & Funnel Engineering",
        badge: "Growth Engineering",
        description: "Collaborating directly with design and development teams to craft frictionless landing page offer flows, heat-map audits, and high-conversion hooks.",
        highlightSkills: ["Funnel Architecture", "CRO Audits", "A/B Testing", "Copywriting", "Offer Structuring"],
      },
      {
        title: "Data Analytics & Full-Funnel Attribution",
        badge: "Marketing Analytics",
        description: "Configuring Google Analytics 4 (GA4), UTM parameter tracking frameworks, customer acquisition cost (CAC) modeling, and customer lifetime value (LTV) projections.",
        highlightSkills: ["Google Analytics 4", "Attribution Modeling", "CAC & LTV Analysis", "Looker Studio", "Event Tracking"],
      },
    ],
    featuredProjects: [
      {
        title: "E-Commerce High-ROAS Scaling Campaign",
        role: "Lead Paid Ads Strategist",
        description: "Restructured ad account hierarchy, implemented full-funnel dynamic retargeting, and optimized CAPI server tracking for a direct-to-consumer brand.",
        metrics: "Delivered 5.2x sustained ROAS over 90 days and scaled monthly revenue by 210%.",
        tech: ["Meta Ads Manager", "Conversions API", "Google Tag Manager", "Shopify Analytics"],
      },
      {
        title: "B2B SaaS Enterprise Lead Generation Pipeline",
        role: "Growth Marketer & Media Buyer",
        description: "Built multi-stage search and retargeting ads capturing qualified tech decision makers with high-intent demo booking offers.",
        metrics: "Lowered Cost Per Lead (CPL) by 43% while increasing consultation show-up rates to 88%.",
        tech: ["Google Ads", "LinkedIn Ads", "GA4", "Custom Funnel Optimization"],
      },
      {
        title: "Omni-Channel Brand Launch Blitz",
        role: "Campaign Architect",
        description: "Orchestrated coordinated multi-platform launch combining Google Search capture with Meta storytelling ads for a regional tech startup.",
        metrics: "Generated 1,200+ qualified signups within the first 14 days of campaign launch.",
        tech: ["Multi-Channel Ads", "Meta Ads", "Google Ads", "Creative Testing"],
      },
    ],
    skills: ["Meta Ads", "Google Ads", "Performance Marketing", "Conversion Funnels", "Data Analytics"],
    categorizedSkills: [
      {
        category: "Paid Advertising Channels",
        items: ["Meta Ads Manager (FB/IG)", "Google Ads (Search & PMax)", "TikTok Ads Manager", "YouTube Video Ads"],
      },
      {
        category: "Tracking & Marketing Tech",
        items: ["Conversions API (CAPI)", "Google Tag Manager", "Google Analytics 4", "Pixel Configuration", "Event Tracking"],
      },
      {
        category: "Strategy & Optimization",
        items: ["ROAS Optimization", "Audience Segmentation", "Lookalike Modeling", "A/B Creative Testing", "Budget Pacing"],
      },
      {
        category: "Conversion & Growth",
        items: ["Funnel Architecture", "Landing Page CRO", "Ad Copywriting", "Hook Formulation", "Offer Strategy"],
      },
    ],
    credentials: [
      {
        degree: "Diploma in Engineering (Computer Science & Technology)",
        institution: "Mymensingh Polytechnic Institute",
        period: "Ongoing / CST Division",
        description: "Combining computer systems, algorithms, and data logic with advanced digital marketing and audience targeting systems.",
        type: "degree",
      },
      {
        degree: "Professional Paid Media & Performance Marketing Specialization",
        institution: "Digital Advertising Industry Certification",
        period: "2024 - Present",
        description: "Hands-on mastery in high-budget campaign management, conversion tracking APIs, and scalable media buying frameworks.",
        type: "certification",
      },
    ],
    socialLinks: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
      email: "sakib@nexora.agency",
      portfolio: "https://sakibalhasan.marketing",
    },
  },
  {
    slug: "mehedi-hasan-saim",
    name: "Mehedi Hasan Saim",
    role: "Python Engineer & Cyber Security Specialist",
    shortRole: "Python Developer & Cyber Security",
    department: "Computer Science & Technology (CST)",
    institute: "Mymensingh Polytechnic Institute",
    location: "Mymensingh, Bangladesh",
    tagline: "Engineering high-efficiency Python backends, automated vulnerability scanners, threat detection scripts, and secure asynchronous microservices.",
    bio: "Specializing in Python automation, secure backend architecture, offensive vulnerability tools, and custom security scripts.",
    fullBio: [
      "Mehedi Hasan Saim bridges software engineering and information security through Python. As a CST student at Mymensingh Polytechnic Institute studying alongside the Nexora engineering collective, he focuses on turning security audits into automated, repeatable code.",
      "His technical repertoire covers building custom asynchronous Python scripts, multi-threaded vulnerability scanners, secure FastAPI backend services, and automated log analysis daemons. He analyzes raw network packets and application responses using Python to detect anomalies that traditional commercial scanners miss.",
      "At Nexora, Saim develops internal automated security testing tools and maintains backend microservices, ensuring client codebases are hardened against automated exploitation before public deployment."
    ],
    philosophy: "Manual security testing finds today's bugs; Python automation ensures tomorrow's builds never introduce them again. Code with precision, automate your defenses, and treat every input as hostile.",
    initials: "MS",
    gradient: "from-teal-500/25 via-emerald-500/10 to-transparent",
    roleBadgeVariant: "success",
    stats: [
      { label: "Automated Scripts Written", value: "120+" },
      { label: "Security Tools Built", value: "15+" },
      { label: "Threat Response Rate", value: "< 5 Min" },
      { label: "Code Integrity Score", value: "99.5%" },
    ],
    coreExpertise: [
      {
        title: "Python Security Scripting & Exploit Analysis",
        badge: "SecOps Engineering",
        description: "Developing custom multi-threaded Python tooling for automated endpoint fuzzing, port verification, header inspection, and payload verification.",
        highlightSkills: ["Python 3", "Asyncio / Multi-threading", "Scapy / Socket Programming", "Custom Fuzzing", "Requests"],
      },
      {
        title: "Secure Python Backend Architecture (FastAPI)",
        badge: "Backend Engineering",
        description: "Building production-grade microservices with FastAPI and Pydantic: enforcing strict schema typing, rate-limiting, JWT validation, and SQL/NoSQL injection immunity.",
        highlightSkills: ["FastAPI", "Pydantic", "SQLAlchemy", "Async APIs", "Input Sanitization"],
      },
      {
        title: "Automated Threat Detection & Log Analysis",
        badge: "Threat Intelligence",
        description: "Parsing high-volume server logs with Python regular expressions and anomaly detection algorithms to identify credential stuffing, brute force, and probe patterns.",
        highlightSkills: ["Log Parsing", "Regex Optimization", "Pattern Matching", "Automated Alerts", "Syslog Integration"],
      },
      {
        title: "Linux Environment Automation & Bot Defense",
        badge: "Infrastructure Defense",
        description: "Writing automated maintenance, integrity verification, and firewall rule-updating scripts to shield Linux instances from automated malicious bots.",
        highlightSkills: ["Bash & Python Automation", "Cron Jobs", "Botnet Mitigation", "Linux Daemons"],
      },
    ],
    featuredProjects: [
      {
        title: "Automated Vulnerability Scanner & Recon Daemon",
        role: "Lead Python Developer & Security Engineer",
        description: "Engineered an asynchronous Python utility that crawls web applications, tests SSL configurations, inspects HTTP security headers, and generates remediation logs.",
        metrics: "Scanned 50+ enterprise web endpoints in sub-60 seconds with zero false positives.",
        tech: ["Python 3", "Asyncio", "Aiohttp", "Colorama", "JSON Reporting Engine"],
      },
      {
        title: "High-Throughput Threat Intel Log Analyzer",
        role: "Systems & Security Developer",
        description: "Built a continuous background Python daemon analyzing Nginx access logs to automatically flag and block malicious IP subnets in real time.",
        metrics: "Blocked 8,000+ malicious scraping and vulnerability probing attempts automatically.",
        tech: ["Python", "Iptables Integration", "Nginx Logs", "Multi-processing"],
      },
      {
        title: "Secure Microservice API Gateway",
        role: "Backend Engineer",
        description: "Constructed an authenticated data bridge using FastAPI with strict request sanitization, token hashing, and encrypted payload transit.",
        metrics: "Achieved sub-15ms response latency under continuous high-concurrency load testing.",
        tech: ["FastAPI", "Pydantic", "Uvicorn", "JWT Auth", "Docker"],
      },
    ],
    skills: ["Python", "FastAPI", "Cyber Security", "Security Scripting", "Automation"],
    categorizedSkills: [
      {
        category: "Programming & Frameworks",
        items: ["Python 3 (Asyncio)", "FastAPI", "Pydantic", "Flask", "Shell Scripting"],
      },
      {
        category: "Security & Penetration Tools",
        items: ["Custom Scanners", "Scapy", "Wireshark", "Burp Suite", "Socket Programming"],
      },
      {
        category: "Data & Automation",
        items: ["Log Parsing & Analysis", "Automated Fuzzing", "Regex Engineering", "REST API Hardening"],
      },
      {
        category: "Systems & DevOps",
        items: ["Linux (Ubuntu/Debian)", "Docker Containers", "Git Version Control", "CI/CD Testing"],
      },
    ],
    credentials: [
      {
        degree: "Diploma in Engineering (Computer Science & Technology)",
        institution: "Mymensingh Polytechnic Institute",
        period: "Ongoing / CST Division",
        description: "Studying software engineering, algorithmic logic, computer network architecture, and applied cryptography.",
        type: "degree",
      },
      {
        degree: "Python for Cyber Security & Network Defense",
        institution: "Practical Security Engineering Specialization",
        period: "2024 - Present",
        description: "Hands-on specialization in writing offensive security scripts, automated defensive tools, and secure backend microservices.",
        type: "certification",
      },
    ],
    socialLinks: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
      email: "saim@nexora.agency",
      portfolio: "https://mehedisaim.tech",
    },
  },
  {
    slug: "mehedi",
    name: "Mehedi",
    role: "Cyber Security Analyst & Perimeter Defender",
    shortRole: "Cyber Security Specialist",
    department: "Computer Science & Technology (CST)",
    institute: "Mymensingh Polytechnic Institute",
    location: "Mymensingh, Bangladesh",
    tagline: "Proactive network monitoring, firewall architecture, vulnerability assessment, and defending enterprise digital perimeters.",
    bio: "Specializing in network defense, zero-trust architecture, threat analysis, and continuous infrastructure monitoring.",
    fullBio: [
      "Mehedi is an integral member of Nexora's cyber resilience and defensive operations squad. Learning alongside his fellow classmates in the Computer Science & Technology (CST) department at Mymensingh Polytechnic Institute, he is committed to building unbreachable infrastructure.",
      "His focus centers on blue-team defense: security perimeter configurations, stateful firewall rules, intrusion detection systems (IDS/IPS), network segmentation, and incident response readiness. He monitors web server telemetry to identify emerging attack vectors before they disrupt live systems.",
      "At Nexora, Mehedi collaborates with the development and deployment teams to enforce zero-trust access controls, verify security posture compliance, and ensure every client web asset is safeguarded against modern cyber threats."
    ],
    philosophy: "The best cybersecurity is proactive, not reactive. You don't wait for an alarm to sound; you fortify the perimeter, monitor the traffic flows, and eliminate every single vulnerability before it can be leveraged.",
    initials: "ME",
    gradient: "from-blue-500/25 via-indigo-500/10 to-transparent",
    roleBadgeVariant: "default",
    stats: [
      { label: "Perimeter Audits", value: "30+" },
      { label: "Intrusion Defense Rate", value: "100%" },
      { label: "Incident Resolution", value: "< 15m" },
      { label: "Security Compliance", value: "Zero-Trust" },
    ],
    coreExpertise: [
      {
        title: "Network Perimeter Defense & Firewall Configuration",
        badge: "Perimeter Security",
        description: "Configuring stateful firewall rules, port isolation, anti-spoofing policies, and access-control lists across production cloud droplets.",
        highlightSkills: ["UFW & Iptables", "Network Segmentation", "Port Hardening", "Access Control Lists", "Traffic Filtering"],
      },
      {
        title: "Threat Analysis & Vulnerability Assessment",
        badge: "Threat Assessment",
        description: "Executing regular system audits, scanning network services for unpatched flaws, checking cipher suites, and validating TLS implementations.",
        highlightSkills: ["Nmap", "OpenVAS", "Vulnerability Auditing", "TLS 1.3 Ciphers", "Attack Surface Mapping"],
      },
      {
        title: "Intrusion Detection & Traffic Telemetry",
        badge: "Blue Team Defense",
        description: "Deploying automated intrusion monitoring (Fail2ban, Snort), analyzing packet anomalies, and establishing incident response playbooks.",
        highlightSkills: ["Fail2ban", "Packet Inspection", "Traffic Anomaly Detection", "Incident Response", "Security Monitoring"],
      },
      {
        title: "Web Application Armor & Secure Configuration",
        badge: "Application Defense",
        description: "Implementing defensive HTTP security headers (CSP, HSTS, X-Frame-Options), cookie flags, and protecting against common client-side threats.",
        highlightSkills: ["Security Headers", "HSTS / CSP", "Cookie Security", "CORS Hardening", "OWASP Defensive Standards"],
      },
    ],
    featuredProjects: [
      {
        title: "Cloud Server Perimeter Lockdown & Defense",
        role: "Cyber Security Analyst",
        description: "Implemented comprehensive network segmentation and automated firewall rules for a multi-tenant client production infrastructure.",
        metrics: "Deflected 20,000+ unauthorized brute-force and port probe attempts with 100% service uptime.",
        tech: ["Linux", "UFW", "Fail2ban", "Nginx Hardening", "Syslog Analysis"],
      },
      {
        title: "Enterprise Web App Security Posture Audit",
        role: "Defensive Security Auditor",
        description: "Conducted exhaustive defense-in-depth reviews, auditing server headers, cipher suites, SSL/TLS handshake latency, and internal access privileges.",
        metrics: "Attained an A+ rating on SSL Labs and certified zero-trust perimeter verification.",
        tech: ["SSL Labs Audit", "Nmap", "Wireshark", "HTTP Header Hardening"],
      },
      {
        title: "Zero-Trust Incident Response Playbook",
        role: "Threat Defender",
        description: "Architected rapid-containment workflows and automated notifications for detecting abnormal traffic spikes and unauthorized administrative attempts.",
        metrics: "Reduced average threat containment response time to under 12 minutes.",
        tech: ["Incident Response", "Bash Scripts", "Monitoring Daemons", "Alert Webhooks"],
      },
    ],
    skills: ["Cyber Security", "Network Defense", "Threat Analysis", "Firewall Configuration", "Vulnerability Auditing"],
    categorizedSkills: [
      {
        category: "Network Defense & Perimeters",
        items: ["UFW & Iptables", "Network Segmentation", "Port Isolation", "TLS / SSL Standards", "Reverse Proxy Protection"],
      },
      {
        category: "Threat Management & Monitoring",
        items: ["Threat Analysis", "Fail2ban Defense", "Traffic Telemetry", "Incident Response Playbooks", "Log Auditing"],
      },
      {
        category: "Auditing & Assessment Tools",
        items: ["Nmap Network Scanning", "Wireshark Packet Analysis", "SSL Labs Auditing", "Vulnerability Mapping"],
      },
      {
        category: "Security Standards",
        items: ["Zero-Trust Model", "Defense-in-Depth", "Security Headers (CSP/HSTS)", "OWASP Blue Team Standards"],
      },
    ],
    credentials: [
      {
        degree: "Diploma in Engineering (Computer Science & Technology)",
        institution: "Mymensingh Polytechnic Institute",
        period: "Ongoing / CST Division",
        description: "Specializing in computer networks, telecommunications, distributed systems security, and hardware architecture.",
        type: "degree",
      },
      {
        degree: "Certified Network Defense & Cyber Threat Analysis",
        institution: "Information Security Practical Certification",
        period: "2024 - Present",
        description: "Comprehensive training in perimeter hardening, threat monitoring, incident response, and defensive cyber resilience.",
        type: "certification",
      },
    ],
    socialLinks: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
      email: "mehedi@nexora.agency",
      portfolio: "https://mehedihasan.security",
    },
  },
];

export function getAllTeamMembers(): TeamMemberDetails[] {
  return teamMembersData;
}

export function getTeamMemberBySlug(slug: string): TeamMemberDetails | undefined {
  return teamMembersData.find((m) => m.slug === slug);
}

