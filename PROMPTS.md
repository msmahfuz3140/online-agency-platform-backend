# PROMPTS — Use One at a Time

Rules:
- Always keep `PROJECT_CONTEXT.md` and `PROJECT_PLAN.md` in your project root.
- Copy ONE prompt below into Cursor/Antigravity, run it, TEST it yourself, git commit, then move to the next prompt.
- Do not skip ahead. Do not combine multiple prompts into one message.

---

## PART A — AGENCY WEBSITE

### Prompt 1 — Project Initialization
```
@PROJECT_CONTEXT.md
Initialize the project structure exactly as described in PROJECT_CONTEXT.md:
- Create /frontend as a Next.js app (App Router, TypeScript, Tailwind CSS)
- Create /backend as an Express.js app with a basic server.js/index.js
- Add package.json scripts to run both in dev mode
- Install framer-motion and recharts in /frontend (do not use them yet, just install)
Do not add any pages, routes, or models yet. Just the base setup.
```

### Prompt 2 — MongoDB + Better Auth Setup
```
@PROJECT_CONTEXT.md
In /backend, connect to MongoDB using Mongoose (use an environment variable MONGODB_URI).
Set up Better Auth for authentication. Verify Better Auth's Mongoose adapter support first (see PROJECT_CONTEXT.md) — if it's not well supported, tell me before proceeding instead of guessing a workaround.
Do not create the User model or any routes yet — just the connection and Better Auth base configuration.
```

### Prompt 3 — User Model + Auth Routes
```
@PROJECT_CONTEXT.md
Create the User model in /backend/models with fields: name, email, password (handled by Better Auth), role (enum: "user" | "admin", default "user"), aiCreditsRemaining (Number, default 5).
Create register, login, and logout routes using Better Auth.
Do not build any frontend pages yet.
```

### Prompt 4 — Design System Foundation (premium, animated)
```
@PROJECT_CONTEXT.md
In /frontend, set up the design system foundation as a PREMIUM SaaS product, not a generic AI-default template:
- Configure Tailwind theme with a primary color, accent color, and neutral gray scale — avoid the generic purple-to-blue gradient cliché
- Add Google Fonts for one heading font and one body font
- Create reusable UI components: Button (primary/secondary/ghost variants with hover/tap micro-interactions), Card, Section container, Badge, Modal, Toast, SkeletonLoader
- Create reusable Framer Motion wrapper components in /components/motion: FadeInSection (scroll-triggered fade/slide), StaggerList (staggered entrance for grids/lists), AnimatedCounter (count-up animation for numbers)
- All motion components must respect prefers-reduced-motion
Do not build any actual pages yet — just the design system, motion wrappers, and reusable components.
```

### Prompt 5 — Home Page
```
@PROJECT_CONTEXT.md
Build the Home page in /frontend using the design system components from the previous step.
Include: hero section, agency intro, featured projects placeholder, client reviews placeholder, how-it-works section, services overview, pricing preview, FAQ, CTA section, newsletter signup form (UI only, no backend yet), footer.
Wrap each major section in the FadeInSection motion component so it animates in on scroll.
Use realistic placeholder content, not generic Lorem ipsum.
```

### Prompt 6 — About Page
```
@PROJECT_CONTEXT.md
Build the About page: agency story, mission, vision, founder profile, technology stack, achievements.
Match the design system and scroll-animation pattern already established on the Home page.
```

### Prompt 7 — Services Page
```
@PROJECT_CONTEXT.md
Build the Services page listing: Portfolio Website, Business Website, Landing Page, SaaS Website, E-commerce Website, Web Application, UI/UX Design, Website Redesign, SEO Optimization, Website Maintenance, Hosting Setup, Domain Setup, AI Solution Development.
Use cards in a grid layout wrapped in StaggerList so they animate in with a stagger effect on scroll, consistent with the design system.
```

### Prompt 8 — Portfolio + Case Studies Pages
```
@PROJECT_CONTEXT.md
Build the Portfolio page: a project grid (StaggerList entrance) where each project shows screenshot, live demo link, GitHub link, tech stack, description, features. Use placeholder project data for now.
Also build the Case Studies page: 2-3 detailed write-ups (problem → solution → result format).
```

### Prompt 9 — Pricing + Blog Pages
```
@PROJECT_CONTEXT.md
Build the Pricing page with a plan comparison table for Free, Pro, and Business tiers. Clearly label Pro/Business as "Coming soon" (no payment integration yet) — do not link them to any checkout flow.
Build the Blog page: a list view and a single blog post view, using placeholder posts for now.
```

### Prompt 10 — Contact Page + Backend Route
```
@PROJECT_CONTEXT.md
Build the Contact page with a form: name, email, message.
Show a loading state on submit and a Toast confirmation on success/failure — no browser alert().
In /backend, create a Contact model and a route to save submissions to MongoDB.
Connect the frontend form to this backend route.
```

### Prompt 11 — Register/Login Frontend Pages
```
@PROJECT_CONTEXT.md
Build the Register and Login pages in /frontend, connected to the Better Auth routes created in Prompt 3.
Include basic form validation and error messages (inline, not alert()).
After login, redirect to a placeholder /dashboard route (dashboard itself will be built later).
```

### Prompt 12 — Client Project Request System
```
@PROJECT_CONTEXT.md
Create a ProjectRequest model in /backend (fields: clientId or contact info, requirements, budget, timeline, status: pending/in-progress/completed).
Build a "Request a Project" form page in /frontend connected to this route.
```

### Prompt 13 — Basic Admin Panel (professional/premium)
```
@PROJECT_CONTEXT.md
Build a protected /admin route in /frontend, accessible only to users with role "admin" (check via middleware/backend route protection).
Make this feel like a professional, premium admin dashboard — NOT a bare list of links or plain table:
- Persistent collapsible sidebar nav + top bar (search, profile)
- Dashboard overview page with animated stat cards (use AnimatedCounter) for: total users, total project requests, total contact messages
- Sortable/filterable/paginated data tables for: all users, all project requests, all contact submissions — with color-coded status badges
- A "block/delete user" action that opens a Modal for confirmation (never window.confirm), with a smooth transition
- Reuse the same design tokens (colors, fonts, spacing) as the public site — it should look like part of the same premium product
```

### Prompt 14 — Deployment Prep
```
@PROJECT_CONTEXT.md
Prepare the project for deployment:
- Add a .env.example file for both /frontend and /backend listing required environment variables (including Cloudinary keys and Anthropic API key)
- Add basic build scripts if missing
- Do not deploy automatically — just make sure the project is deploy-ready
```

**→ After Prompt 14: deploy manually to Vercel (frontend) + Render/Railway (backend) + MongoDB Atlas. Test the whole flow live before moving to Part B.**

---

## PART B — AI WEBSITE GENERATOR

### Prompt 15 — Website/Template/AIGeneration Models
```
@PROJECT_CONTEXT.md
In /backend, create these models:
- Website: ownerId, title, content (JSON), status ("draft"|"published"), createdAt
- Template: name, category, previewImage (Cloudinary URL), structure (JSON)
- AIGeneration: userId, inputPrompt, outputJSON, createdAt
Do not build any routes yet.
```

### Prompt 16 — User Dashboard
```
@PROJECT_CONTEXT.md
Build the User Dashboard home in /frontend: total websites count, AI credits remaining (real value from the logged-in User, not a placeholder), recent activity list (placeholder for now).
Use the same AnimatedCounter stat-card pattern as the admin panel dashboard.
```

### Prompt 17 — Website CRUD
```
@PROJECT_CONTEXT.md
In /backend, create protected CRUD routes for the Website model (create, read, update, delete, list-by-owner). Users can only access their own websites.
In /frontend, build a "My Websites" list page showing the user's websites with edit/delete/preview actions. Show a SkeletonLoader while fetching and an animated empty state (with CTA to create a website) if the user has none.
```

### Prompt 18 — AI Generation Form
```
@PROJECT_CONTEXT.md
Build the AI website generation form in /frontend: website type (Portfolio/Business/Landing Page), business info (name, industry, description), design style, color preference, extra requirements text field.
Do not connect it to the backend yet — just the form UI and validation.
```

### Prompt 19 — AI Generate Backend Route
```
@PROJECT_CONTEXT.md
Create the /api/ai-generate route in /backend. It should:
- Accept the form data from Prompt 18
- Check the logged-in user's aiCreditsRemaining — if 0, reject with a clear error message and do not call the AI API
- Build a structured prompt for the Anthropic API (model: claude-sonnet-4-6)
- Call the API, instructing it to return ONLY JSON matching this shape: { sections: [{type, heading, subtext, content, items, cta}], theme: {primaryColor, font} }
- Decrement aiCreditsRemaining by 1 on success
- Save the result to AIGeneration and create a linked Website document with status "draft"
- Return the generated website's ID to the frontend
```

### Prompt 20 — Section Components
```
@PROJECT_CONTEXT.md
Build the pre-built section components in /frontend for rendering AI-generated content: Hero, About, Services, Testimonials, Pricing, Footer, Contact.
Each component should accept props matching the JSON shape from Prompt 19, and be wrapped for a smooth entrance animation (fade/slide) when rendered.
```

### Prompt 21 — Component Mapper + Preview Page
```
@PROJECT_CONTEXT.md
Build a component mapper function that takes the sections array from a Website's content and renders the matching component from Prompt 20 for each section type.
Build a Preview page that fetches a Website by ID and renders it using this mapper, with a SkeletonLoader while loading.
Connect the form from Prompt 18 to the backend route from Prompt 19, redirecting to this Preview page after generation.
```

### Prompt 22 — Inline Editing + Save/Publish
```
@PROJECT_CONTEXT.md
On the Preview page, add inline editing for text fields (heading, subtext, content) that updates the Website's content JSON in the backend on save.
Add "Save as Draft" and "Publish" buttons with a loading state and a Toast confirmation on success/failure — no alert().
```

### Prompt 23 — Template Gallery
```
@PROJECT_CONTEXT.md
Build a Template gallery page showing available templates (Portfolio, Agency, Restaurant, Coaching, Hospital, SaaS) using the Template model, rendered with StaggerList entrance.
Add a "Use this template" action that creates a new Website pre-filled with that template's structure, then redirects to the Preview page for further AI customization.
```

### Prompt 24 — Admin AI Monitoring
```
@PROJECT_CONTEXT.md
In the Admin panel, add a section showing: total AI generations count (AnimatedCounter), generations per user, a sparkline trend chart (recharts) of generations over time, and a sortable/filterable table of all generated websites with the ability to view or delete any of them.
Also allow the admin to manually adjust a user's aiCreditsRemaining (simple number input + save, inside a Modal).
```

### Prompt 25 — Final Deploy
```
@PROJECT_CONTEXT.md
Review the full project against PROJECT_PLAN.md Part A and Part B checklists, including the Design Quality Checklist (animations, loading/empty/error states, no alert()/confirm()). Point out anything missing or inconsistent. Do not make changes yet — just report gaps.
```

**→ After Prompt 25: fix any gaps manually or with a follow-up targeted prompt, then deploy the updated version live. This completes the MVP.**
