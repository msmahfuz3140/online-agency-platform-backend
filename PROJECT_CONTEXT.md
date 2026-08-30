# PROJECT CONTEXT — AI Website Builder + Digital Agency Platform

## What this project is
An AI-powered website builder combined with a digital agency SaaS platform.
- Public agency website (portfolio, services, pricing, contact)
- User accounts where users generate their own website using AI (input business info → AI generates layout/content → renders via pre-built components)
- Admin panel to manage users, websites, and AI generation stats

This is Phase 1 (MVP) only. Do NOT build marketplace, mobile app, drag-drop visual editor, custom hosting/domain system, or enterprise multi-tenant features yet — those are future phases.

## Tech Stack
- **Frontend:** Next.js (App Router)
- **Backend:** Express.js (REST API)
- **Auth:** Better Auth (Mongoose adapter — Better Auth is primarily built/tested against Prisma & Drizzle; when configuring in Prompt 2, explicitly verify Mongoose adapter support or use the community/community-maintained Mongoose adapter. If it's unstable, fall back to raw MongoDB collections that Better Auth can read via its custom adapter interface — flag this to the user before proceeding.)
- **Database:** MongoDB with Mongoose
- **AI Provider:** Anthropic Claude API (model: claude-sonnet-4-6) via `/v1/messages`, JSON-only structured output. (Explicitly pinned so the coding assistant doesn't guess a provider.)
- **File/Image storage:** Cloudinary (free tier) for portfolio screenshots, template preview images, and any user-uploaded assets. Store only the returned URL in MongoDB — never store binary image data in the DB.
- **Animation:** Framer Motion (`framer-motion`) for section-level scroll/entry animations across both the public site and the admin panel.

## Design Direction — PREMIUM, not generic AI-default
Every page (public site AND admin panel) must feel like a paid, polished SaaS product — not a default AI-generated template. Concretely:
- **Motion:** Use Framer Motion for fade/slide-in on scroll for sections, staggered list/grid item entrances, smooth hover/tap micro-interactions on buttons and cards, animated number counters for stats (dashboard, admin), and page-transition fades between routes.
- **Depth & polish:** subtle shadows, soft borders, glassmorphism sparingly (e.g. sticky nav), gradient accents used intentionally (not the generic purple-blue hero cliché — pick a distinctive palette per A2 in the plan).
- **Micro-details:** skeleton loaders (not spinners) during data fetch, animated empty states, toast notifications for actions (not browser alerts), smooth accordion/tab transitions.
- Keep animations performant — respect `prefers-reduced-motion`, avoid layout-shift-causing animations, lazy-load heavy motion only when a section scrolls into view.

## Admin Panel — must be professional/premium, not a bare CRUD table
- **Layout:** persistent sidebar nav (collapsible) + top bar with search/notifications/profile — not a plain list of links.
- **Dashboard overview:** animated stat cards (users count, active websites, AI generations today, revenue-placeholder) with small trend charts (sparklines) — use `recharts` for graphs.
- **Data tables:** sortable/filterable/paginated tables (users, project requests, contact messages, AI generations) with row hover states, bulk actions, and status badges (color-coded: pending/in-progress/completed).
- **Actions:** confirmation modals (not `window.confirm`) for destructive actions like block/delete, with smooth open/close transitions.
- **Visual consistency:** admin panel uses the same design tokens (colors, type scale, spacing) as A2's design system, just in a dashboard layout — should not look like a different, cheaper product bolted onto the main site.

## Folder Structure
```
/project-root
/frontend (Next.js)
  /app
    /(public) → home, about, services, portfolio, pricing, blog, contact
    /(auth) → login, register
    /(dashboard) → user dashboard, website management
    /(admin) → admin panel
  /components
    /ui → Button, Card, Section, Badge, Modal, Toast, SkeletonLoader
    /motion → reusable Framer Motion wrappers (FadeInSection, StaggerList, AnimatedCounter)
/backend (Express)
  /routes → auth, websites, templates, ai-generate, admin
  /models → User, Website, Template, AIGeneration, Contact, ProjectRequest
  /middleware → auth-check, admin-check
```

## Database Models (MVP scope)
- **User:** name, email, password (handled by Better Auth), role (user/admin), aiCreditsRemaining
- **Website:** ownerId, title, content (JSON), status (draft/published), createdAt
- **Template:** name, category, previewImage (Cloudinary URL), structure (JSON)
- **AIGeneration:** userId, inputPrompt, outputJSON, createdAt
- **Contact:** name, email, message, createdAt
- **ProjectRequest:** clientId/contact info, requirements, budget, timeline, status (pending/in-progress/completed)

## AI Website Generator — How It Works
1. User fills a form: website type, business info, design style, color preference, extra requirements
2. Frontend sends this to backend route `/api/ai-generate`
3. Backend builds a structured prompt and calls the Anthropic API (claude-sonnet-4-6), instructing it to return ONLY JSON (no prose), shaped like:
```json
{
  "sections": [
    { "type": "hero", "heading": "...", "subtext": "...", "cta": "..." },
    { "type": "about", "content": "..." },
    { "type": "services", "items": ["..."] }
  ],
  "theme": { "primaryColor": "#000000", "font": "Inter" }
}
```
4. Response is saved to MongoDB (AIGeneration + linked Website document)
5. Frontend renders this JSON using pre-built React components (Hero, About, Services, etc.) — a component mapper picks the right component per section type, wrapped in the reusable Motion components for entry animation
6. User can preview, edit text inline, and save/publish

**Important:** AI should NOT generate raw HTML/full code in this phase — only structured JSON content that maps to pre-built components. This keeps output reliable and consistent.

## AI Credits System (MVP scope)
- Add `aiCreditsRemaining` (Number, default e.g. 5) to the User model.
- Every successful `/api/ai-generate` call decrements it by 1; reject the request with a clear error if it hits 0.
- No payment integration in MVP — credits are just a fixed starting allowance. Admin can manually adjust a user's credits from the Admin panel (simple number input + save).
- Pricing page's Pro/Business tiers should be clearly labeled "Coming soon" and not link to any payment flow yet, to avoid user confusion.

## Build Order (do NOT skip ahead)
1. Express server + MongoDB connection (mongoose)
2. User model + Better Auth register/login routes
3. Website model + CRUD routes (protected by auth middleware)
4. Next.js login/register pages wired to backend
5. Dashboard page listing user's websites
6. AI generation route + form + rendering via component mapper
7. Admin panel (user list, website list, basic stats)
8. Deploy (Vercel for frontend, Render/Railway for backend, MongoDB Atlas for DB)

## Rules for AI coding assistant (follow strictly, every prompt)
1. Always follow the folder structure and models defined in this file — never invent a different architecture, rename folders, or restructure existing code without being asked.
2. Only do the exact task given in the current prompt. Do not build extra pages, routes, or features "while you're at it," even if they seem related or useful.
3. Do not touch, refactor, or "improve" files/code outside the scope of the current prompt.
4. After finishing the task, STOP. Do not continue to the next feature automatically. Wait for the user to test and give the next prompt.
5. Do not add Phase 2 features (marketplace, mobile app, visual drag-drop editor, hosting/domain system, enterprise features) unless explicitly asked.
6. Keep code consistent with whatever has already been built in earlier prompts (naming conventions, styling approach, folder patterns) — check existing files before creating new ones.
7. If something in the prompt is unclear or conflicts with this context file, ask before proceeding instead of guessing.
8. Never generate raw HTML/full custom code for the AI website generator's output — only structured JSON content mapped to pre-built components, as described above.
9. Every UI surface (public site AND admin panel) must follow the "Design Direction — PREMIUM" and "Admin Panel" sections above: real animation via Framer Motion, no bare unstyled tables/lists, no browser-native `alert`/`confirm`.
10. Use Cloudinary for any image upload/storage — never store raw binary/base64 images in MongoDB.
