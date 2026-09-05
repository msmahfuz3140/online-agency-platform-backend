export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    role: string;
    initials: string;
  };
  category: string;
  tags: string[];
  readingTime: string;
  publishedAt: string;
  coverGradient: string;
  coverIcon: string;
  featured?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "why-nextjs-is-the-best-framework-for-agency-websites",
    title: "Why Next.js 15 is the Best Framework for Agency Websites in 2025",
    excerpt:
      "After building 50+ client websites, here's exactly why we standardized on Next.js 15 App Router — and what it means for performance, SEO, and developer velocity.",
    content: `
## The Framework Decision That Changed Our Agency

When we started Nexora in 2024, we had a simple mandate: build the fastest, most scalable websites possible for our clients. After evaluating every major framework — Gatsby, Remix, Astro, SvelteKit, and yes, vanilla React — we landed on Next.js. Here's the honest breakdown.

### 1. App Router + Server Components = Zero JavaScript by Default

The App Router introduced React Server Components (RSC) to production Next.js. What this means in practice: every component is server-rendered by default. Only components you explicitly mark with \`"use client"\` ship JavaScript to the browser.

For a typical agency marketing site, this means your hero, about, services, and testimonials sections ship **zero JavaScript**. The result? A Time to Interactive (TTI) measured in milliseconds, not seconds.

\`\`\`tsx
// This ships ZERO JavaScript to the client
export function ServicesSection() {
  return (
    <section>
      <h2>Our Services</h2>
      {services.map(s => <ServiceCard key={s.id} {...s} />)}
    </section>
  );
}
\`\`\`

### 2. Built-in Image Optimization with next/image

Cloudinary is great. But next/image gives you automatic WebP/AVIF conversion, lazy loading, blur placeholders, and responsive srcsets — for free, with zero config. For clients with image-heavy portfolios, this alone can cut page weight by 60%.

### 3. TypeScript + Tailwind Tight Integration

Next.js ships with TypeScript support out of the box. Combined with Tailwind CSS v4's new CSS-first config system, you get a design system that's both type-safe and runtime-free. No className string bugs. No unused CSS shipped.

### 4. Turbopack in Development

In Next.js 15, Turbopack became the default dev bundler. Hot reload times dropped from ~800ms (Webpack) to under 80ms for our largest codebases. For agency dev workflows where you're iterating on component designs in real time, this is a game changer.

### 5. Edge Runtime for Global Performance

Next.js Middleware and Route Handlers can run on Vercel's Edge Network — 300+ PoPs globally. For clients with international audiences, this means sub-50ms TTFB anywhere in the world, without a CDN setup.

### The Numbers From Our Client Work

After standardizing on Next.js across all 50+ projects:
- Average Lighthouse Performance: **96/100**
- Average Time to Interactive: **1.1 seconds** (mobile, 4G)
- Average Largest Contentful Paint: **0.9 seconds**

If you're an agency not already on Next.js, the migration is worth the effort. Your clients will notice the difference immediately.
    `,
    author: {
      name: "MD Mahfuzul Haque",
      role: "Founder & Lead Engineer, Nexora Agency",
      initials: "MH",
    },
    category: "Engineering",
    tags: ["Next.js", "React", "Performance", "Agency"],
    readingTime: "6 min read",
    publishedAt: "2025-08-15",
    coverGradient: "from-primary-500/25 via-primary-500/10 to-transparent",
    coverIcon: "▲",
    featured: true,
  },
  {
    slug: "how-we-increased-conversion-rate-by-7x-in-5-days",
    title: "How We Increased a SaaS Landing Page Conversion Rate by 7.25x in 5 Days",
    excerpt:
      "A deep dive into the exact page architecture changes, copy rewrites, and performance improvements that took LaunchPad from 1.2% to 8.7% trial signups without touching their ad budget.",
    content: `
## The Brief

LaunchPad — a developer tooling startup — came to us with a painfully common problem: great product, terrible landing page. Their Notion-exported site had a 31/100 PageSpeed score, a 9-second TTFB on mobile, and copy that opened with the company tagline rather than a benefit hook.

They were spending $3,000/month on Google Ads getting a 1.2% trial signup conversion rate. At that CAC, they couldn't scale.

We had 5 days to fix it.

## Day 1: Audit & Architecture

Before writing a single line of code, we audited the existing page using:
- Google PageSpeed Insights (mobile)
- Chrome DevTools Network tab
- Hotjar heatmaps (provided by client)
- Microsoft Clarity session recordings

**Key findings:**
1. 94% of visitors never saw below the fold on mobile — the hero wasn't compelling enough
2. The CTA button was below the fold on 80% of mobile viewport sizes
3. The page loaded 3.4MB of unoptimized images
4. Zero social proof in the hero — GitHub stars widget was in the footer
5. The headline was "LaunchPad — The Future of Developer Tooling" (no benefit, no urgency)

## Day 2-3: Rebuild on Next.js

We rebuilt the page from scratch using Next.js static generation. Key decisions:

**Hero rewrite using AIDA framework:**
\`\`\`
Before: "LaunchPad — The Future of Developer Tooling"
After: "Ship API integrations 10x faster. Zero boilerplate. Zero configuration."
\`\`\`

The new hero included:
- Benefit-led headline (what, not what it is)
- Animated feature preview with live code snippets
- Social proof ticker: "1,247 developers signed up this month"
- Above-the-fold CTA with urgency: "Start Free — 500 spots remaining"

**Performance:**
- All images converted to AVIF via next/image
- Moved all fonts to next/font/google (zero layout shift)
- Static generation + Vercel Edge for global 80ms TTFB

## Day 4: Email Capture + Analytics

We integrated Resend for double opt-in email capture and Plausible Analytics for privacy-first conversion tracking.

## Day 5: QA + Launch

Full cross-device testing, A/B variant setup (two headline variants), and production deployment.

## Results (First 7 Days Post-Launch)

| Metric | Before | After |
|--------|--------|-------|
| Conversion Rate | 1.2% | 8.7% |
| PageSpeed (Mobile) | 31 | 98 |
| Cost Per Signup | $75.00 | $10.30 |
| Monthly Signups | ~40 | 290+ |

The lesson: most landing pages fail not because of the product, but because of how the product is communicated — and how slowly the page loads.
    `,
    author: {
      name: "MD Mahfuzul Haque",
      role: "Founder & Lead Engineer, Nexora Agency",
      initials: "MH",
    },
    category: "Case Study",
    tags: ["Conversion Rate", "Landing Page", "Next.js", "Performance"],
    readingTime: "8 min read",
    publishedAt: "2025-09-01",
    coverGradient: "from-violet-500/25 via-violet-500/10 to-transparent",
    coverIcon: "🚀",
    featured: true,
  },
  {
    slug: "building-ai-website-generator-claude-api",
    title: "Building an AI Website Generator with Claude API and Next.js",
    excerpt:
      "A technical walkthrough of how we engineered Nexora's AI website generation engine: structured JSON output from Claude, dynamic component mapping, and inline editing.",
    content: `
## The Core Architecture

Nexora's AI website generator takes a user's business description and returns a fully rendered website — in under 10 seconds. Here's the technical architecture behind it.

## Step 1: Structured Prompt Engineering

The key insight: LLMs are unpredictable when asked to return raw HTML. Instead, we ask Claude to return a strict JSON schema:

\`\`\`typescript
interface GeneratedWebsite {
  sections: Section[];
  theme: {
    primaryColor: string;
    font: string;
  };
}

interface Section {
  type: "hero" | "about" | "services" | "testimonials" | "pricing" | "contact" | "footer";
  heading: string;
  subtext?: string;
  content?: string;
  items?: Item[];
  cta?: { label: string; href: string };
}
\`\`\`

Our system prompt instructs Claude to populate this schema based on the user's business type, tone, and goals — and to return ONLY valid JSON with no surrounding prose.

## Step 2: Component Mapper

Once we have the JSON, a component mapper renders the appropriate React component for each section type:

\`\`\`typescript
const componentMap: Record<Section["type"], React.ComponentType<Section>> = {
  hero: HeroComponent,
  about: AboutComponent,
  services: ServicesComponent,
  testimonials: TestimonialsComponent,
  pricing: PricingComponent,
  contact: ContactComponent,
  footer: FooterComponent,
};

export function WebsiteRenderer({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section, idx) => {
        const Component = componentMap[section.type];
        return Component ? <Component key={idx} {...section} /> : null;
      })}
    </>
  );
}
\`\`\`

## Step 3: Credit System

Each generation costs 1 AI credit. Before calling the API, the backend checks \`user.aiCreditsRemaining\`. If 0, the request is rejected with a clear error message.

\`\`\`typescript
if (user.aiCreditsRemaining <= 0) {
  return res.status(402).json({
    error: "No AI credits remaining. Upgrade your plan to continue generating websites.",
  });
}
\`\`\`

## Step 4: Inline Editing

After generation, users can click any text on the preview to edit it inline. Each edit sends a PATCH request to update the Website document's \`content.sections[idx][field]\` in MongoDB.

## Performance

Average generation time: **6.2 seconds** (Claude API latency dominates).
We show a skeleton loader with animated progress indicators during generation to maintain perceived performance.

## What's Next

We're working on streaming the Claude response so sections render one-by-one as they're generated — reducing the perceived wait time significantly.
    `,
    author: {
      name: "MD Mahfuzul Haque",
      role: "Founder & Lead Engineer, Nexora Agency",
      initials: "MH",
    },
    category: "Engineering",
    tags: ["Claude API", "AI", "Next.js", "Architecture"],
    readingTime: "7 min read",
    publishedAt: "2025-09-10",
    coverGradient: "from-rose-500/25 via-rose-500/10 to-transparent",
    coverIcon: "🤖",
  },
  {
    slug: "tailwind-css-v4-what-changed",
    title: "Tailwind CSS v4: What Changed and Why We Migrated All Client Projects",
    excerpt:
      "Tailwind v4 dropped the tailwind.config.js entirely in favor of a CSS-first design token system. Here's our migration process and why the DX improvement was worth the effort.",
    content: `
## What Changed in Tailwind CSS v4

Tailwind v4 is a ground-up rewrite. The biggest breaking change: **no more \`tailwind.config.js\`**.

Instead, all theme customization happens in your CSS file using CSS custom properties and \`@theme\`:

\`\`\`css
@import "tailwindcss";

@theme {
  --color-primary-500: oklch(65% 0.18 175);
  --font-heading: "Space Grotesk", sans-serif;
  --radius-lg: 0.75rem;
}
\`\`\`

This means your design tokens are now actual CSS variables — accessible from any CSS property, JavaScript, and browser DevTools without any config.

## Why We Migrated

1. **Zero runtime overhead** — v4 generates purely static CSS with no JS runtime
2. **CSS variables everywhere** — \`var(--color-primary-500)\` works in inline styles, keyframes, and custom CSS
3. **Oxide engine** — the new Rust-based engine is 5x faster than Lightning CSS
4. **Better IntelliSense** — IDE autocomplete now reads from CSS, not a JS config object

## Our Migration Process

For each project, we:
1. Replaced \`tailwind.config.js\` with \`@theme\` blocks in \`globals.css\`
2. Updated all \`theme()\" function calls to \`var()\` references
3. Removed the \`@tailwindcss/typography\` plugin (now built-in with \`prose\`)
4. Updated \`content\` array to the new \`@source\` directive

The migration took ~2 hours per project. The result: smaller CSS bundles and faster dev server startup.
    `,
    author: {
      name: "Jahidul Islam",
      role: "Head of UI/UX Design, Nexora Agency",
      initials: "JI",
    },
    category: "Design Systems",
    tags: ["Tailwind CSS", "Design System", "CSS", "DX"],
    readingTime: "5 min read",
    publishedAt: "2025-07-20",
    coverGradient: "from-sky-500/25 via-sky-500/10 to-transparent",
    coverIcon: "🎨",
  },
  {
    slug: "mongodb-vs-postgresql-for-saas-apps",
    title: "MongoDB vs PostgreSQL for SaaS Apps: Our Honest Take After 50+ Builds",
    excerpt:
      "After building SaaS platforms on both databases, here's our straightforward framework for choosing between MongoDB and PostgreSQL — and the one case where you should use both.",
    content: `
## The Short Answer

Use **PostgreSQL** for SaaS apps with relational data and complex queries. Use **MongoDB** for content-heavy apps with flexible, document-shaped data. Use both when your SaaS has a CMS.

## When We Choose PostgreSQL

- Multi-tenant apps with complex JOIN queries across teams, users, and resources
- Financial data where ACID guarantees are non-negotiable
- Apps with heavy reporting needs (GROUP BY, window functions)
- When Prisma is in the stack (best TypeScript ORM support)

**Real example:** Finflow — our finance SaaS case study — uses PostgreSQL with Prisma. The tenant → workspace → user → report relationship is deeply relational. MongoDB would have required painful manual joins in application code.

## When We Choose MongoDB

- Agency websites and CMS-backed content (blog posts, portfolio projects, case studies)
- Apps where data shape varies per record (form builders, survey tools)
- Prototypes that need to iterate schema fast without migrations

**Real example:** Bloom Co's e-commerce store — product catalogs with variable attributes (plants have different care requirements, pot sizes, SKUs) are a natural document fit.

## The Hybrid Pattern

Our most scalable SaaS builds use both:
- **PostgreSQL** (via Prisma) for: users, workspaces, billing, and any relational business logic
- **MongoDB** (via Mongoose) for: CMS content, AI-generated outputs, activity logs, and any schemaless data

This isn't premature optimization — it's using the right tool for each data shape from the start.

## Bottom Line

If you're unsure: start with PostgreSQL. Its stricter schema discipline catches bugs early and Prisma's type-safe query builder is the best developer experience in the Node.js ecosystem.
    `,
    author: {
      name: "MD Mahfuzul Haque",
      role: "Founder & Lead Engineer, Nexora Agency",
      initials: "MH",
    },
    category: "Backend",
    tags: ["MongoDB", "PostgreSQL", "SaaS", "Database", "Backend"],
    readingTime: "6 min read",
    publishedAt: "2025-06-05",
    coverGradient: "from-emerald-500/25 via-emerald-500/10 to-transparent",
    coverIcon: "🗄️",
  },
];
