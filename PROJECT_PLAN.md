# PROJECT PLAN — AI Website Builder + Digital Agency Platform

Use this file as your master checklist. Work top to bottom. Do NOT jump ahead — finish and test each step before moving to the next. Check off items as you complete them.

Build order: **Agency Website first (fully working) → then add AI Website Generator features on top.**

---

## PART A — AGENCY WEBSITE (Build this first, completely)

### A1. Project Setup
- [x] Create `/frontend` (Next.js, App Router, TypeScript)
- [ ] Create `/backend` (Express.js)
- [ ] Setup MongoDB Atlas cluster + connection string
- [ ] Connect backend to MongoDB via Mongoose
- [ ] Setup Better Auth in backend (verify Mongoose adapter support first — see PROJECT_CONTEXT.md)
- [ ] Setup environment variables (.env) for both frontend and backend — DB URI, auth secrets, API keys, Cloudinary keys
- [ ] Install `framer-motion` and `recharts` in `/frontend`

### A2. Design System (do this before building pages — critical for "premium" look)
- [ ] Choose a design direction (e.g., modern minimal, dark-mode tech agency, bold colorful) — pick ONE, stay consistent
- [ ] Define color palette: 1 primary color, 1 accent color, neutral grays, background/foreground for light+dark mode
- [ ] Choose typography: 1 heading font, 1 body font (e.g., via Google Fonts — Inter, Geist, Manrope, Space Grotesk are good modern choices)
- [ ] Define spacing/sizing scale (use Tailwind CSS defaults or a custom scale — stay consistent across all pages)
- [ ] Define reusable UI primitives: buttons (primary/secondary/ghost), cards, section containers, badges, modal, toast, skeleton loader
- [ ] Build reusable Motion wrappers in `/components/motion`: `FadeInSection` (scroll-triggered), `StaggerList` (grid/list item entrance), `AnimatedCounter` (number count-up for stats)
- [ ] Avoid generic "AI-default" look: no purple-to-blue gradient hero clichés, no centered-everything layouts, no stock Bootstrap spacing — use asymmetry, real imagery/screenshots, intentional whitespace, subtle shadows/depth
- [ ] Respect `prefers-reduced-motion` in all motion components

### A3. Public Website Pages
- [ ] Home — hero, agency intro, featured projects, client reviews, how it works, services overview, pricing preview, FAQ, CTA, newsletter, footer — each section wrapped in `FadeInSection`
- [ ] About — agency story, mission, vision, founder profile, tech stack, achievements
- [ ] Services — website development types (portfolio/business/landing/SaaS/e-commerce/web app), other services (UI/UX, redesign, SEO, maintenance, hosting/domain setup) — cards use `StaggerList` on scroll
- [ ] Portfolio — project grid with screenshot (Cloudinary), live demo link, GitHub link, tech stack, description, features
- [ ] Case Studies — deeper write-ups of 2-3 projects (problem → solution → result)
- [ ] Pricing — plan comparison table (Free/Pro/Business — clearly labeled "Coming soon" for Pro/Business, no payment link yet)
- [ ] Blog — list + single post page (can start with static/manual posts)
- [ ] Contact — form (name, email, message) → saved to MongoDB `Contact` model, or emailed to you — loading state + toast on submit, not a plain alert

### A4. Authentication
- [ ] Register page (email/password via Better Auth)
- [ ] Login page
- [ ] Logout
- [ ] Google login (optional, can add later)
- [ ] Email verification (optional for MVP, can add later)
- [ ] Roles: `user` and `admin` stored on User model, plus `aiCreditsRemaining` (default value, e.g. 5)

### A5. Client Request System (agency side)
- [ ] "Request a project" form — client fills requirements, budget, timeline
- [ ] Saved to a `ProjectRequest` model, visible to admin
- [ ] Simple status field: pending / in-progress / completed (color-coded badge when displayed)

### A6. Admin Panel — must feel professional/premium, not a bare CRUD table
- [ ] Admin-only route (protected by role check middleware)
- [ ] Persistent collapsible sidebar + top bar (search/notifications/profile) — not a plain list of links
- [ ] Dashboard overview: animated stat cards (`AnimatedCounter`) for users count, project requests, contact messages
- [ ] Sortable/filterable/paginated data tables for users, project requests, contact messages
- [ ] Block/delete user — confirmation modal (never `window.confirm`), smooth open/close transition
- [ ] Same design tokens (color/type/spacing) as the public site's design system — should not look like a cheaper, separate product

### A7. Deploy Part A
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Render/Railway
- [ ] Connect production MongoDB Atlas
- [ ] Test full flow live: visit site → register → login → submit contact/request form → check admin panel

**✅ Milestone: A working, premium-looking agency website is live. This alone is a complete, usable product.**

---

## PART B — ADD AI WEBSITE GENERATOR (build only after Part A works)

### B1. Data Models
- [ ] `Website` model — ownerId, title, content (JSON), status (draft/published), createdAt
- [ ] `Template` model — name, category, previewImage (Cloudinary URL), structure (JSON)
- [ ] `AIGeneration` model — userId, inputPrompt, outputJSON, createdAt

### B2. User Dashboard
- [ ] Dashboard home — total websites, AI credits remaining (actual value from User model, not placeholder), recent activity — stat cards animated like the admin panel
- [ ] "My Websites" list page — skeleton loader while fetching, animated empty state if zero websites
- [ ] Website CRUD — create, view, edit, delete, preview (protected routes, user can only access own websites)

### B3. AI Generation Flow
- [ ] Form: website type, business info, design style, color choice, requirements
- [ ] Backend route `/api/ai-generate` — builds prompt, calls Anthropic API (claude-sonnet-4-6), forces JSON-only output, decrements `aiCreditsRemaining` by 1, rejects with clear error if credits are 0
- [ ] Save AI response to `AIGeneration` + linked `Website` document
- [ ] Pre-built React section components: Hero, About, Services, Testimonials, Pricing, Footer, Contact — each wrapped for entrance animation
- [ ] Component mapper — renders sections based on `content.sections[].type`
- [ ] Preview page — shows generated site in an iframe-like preview
- [ ] Basic inline text editing on preview
- [ ] Save / Publish actions — toast confirmation, not alert

### B4. Template System (basic)
- [ ] Template gallery page (Portfolio, Agency, Restaurant, Coaching, Hospital, SaaS) — grid with `StaggerList` entrance
- [ ] "Use this template" → pre-fills a Website with that template's structure
- [ ] Combine with AI: user can still customize content via AI generation after picking a template

### B5. Admin — AI Monitoring
- [ ] Admin view: total AI generations, usage per user, sparkline trend chart (recharts) for generations over time
- [ ] Admin can view/delete any generated website
- [ ] Admin can manually adjust a user's `aiCreditsRemaining` (simple number input + save)

### B6. Deploy Part B
- [ ] Push updates live
- [ ] Test full flow: register → go to dashboard → generate a website with AI → preview → publish

**✅ Milestone: Full MVP complete — premium agency website + working AI website builder.**

---

## Design Quality Checklist (apply to every page you build)
- [ ] Consistent spacing — same padding/margin scale used everywhere, not random values
- [ ] Consistent color usage — primary color used sparingly for emphasis, not everywhere
- [ ] Real content over placeholder — even draft copy should sound specific, not "Lorem ipsum" or generic AI phrasing
- [ ] Responsive on mobile — test every page at mobile width, not just desktop
- [ ] Loading states — buttons/forms show a loading indicator or skeleton during API calls, not a blank screen
- [ ] Empty states — dashboard/list pages look intentional even with zero data (illustration/message + CTA, not a blank page)
- [ ] Error states — failed API calls show a clear toast/message, not a silent failure or browser alert
- [ ] Scroll/entry animation present on every major section (via `FadeInSection`/`StaggerList`), but respects `prefers-reduced-motion`

## Rules for the AI Coding Assistant (Cursor/Antigravity)
- Reference this file (`@PROJECT_PLAN.md`) at the start of every session
- Work on ONE unchecked item at a time — do not jump ahead to Part B while Part A is incomplete
- After finishing an item, test it, commit to git, then move to the next
- Do not introduce new architecture, libraries, or folder structures not listed here without asking first
- Do not build Part B features until Part A is fully deployed and working
- Every page/panel must meet the "Design Quality Checklist" above — no bare unstyled UI, no `alert()`/`confirm()`, real animation via `framer-motion`
