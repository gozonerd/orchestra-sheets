# Orchestra Sheets

**Owner:** Krystal Martinez / Stahl Systems  
**Type:** Git repository  
**Purpose:** Web application for prompt management, multi-model A/B testing, versioning, and reuse with cost tracking. Built for non-developers. Deployed to cloud via Vercel.

## Tech Stack

- **Framework:** SvelteKit + Svelte 5
- **Auth:** Auth.js (SvelteKit adapter)
- **ORM:** Drizzle ORM (PostgreSQL)
- **Database:** Supabase PostgreSQL (Row Level Security)
- **UI:** Tailwind CSS 4 + Skeleton UI
- **Code editor:** CodeMirror 6 via sveltemirror
- **LLM abstraction:** Vercel AI SDK
- **Testing:** Vitest + Playwright
- **Deployment:** Vercel
- **CI/CD:** GitHub Actions (comprehensive pipeline with SAST, secret detection, accessibility, E2E, Lighthouse)

## Critical Constraints

- Tests built at every stage, not after. Coverage target: 100% line, 100% branch (min 80% line, 70% branch per stage)
- WCAG 2.1 AA accessibility checked at every UI stage. Zero violations.
- API keys: envelope encryption (per-user DEK + cloud KMS), never plaintext
- Every stage includes -A (audit gate: 5 consecutive null edits) and -B (commit gate) exits
- Commit and push after every stage
- Follow D2R skill execution protocol exactly

## Setup

**Supabase Project** (manual setup required):
- Create a Supabase project at https://supabase.com
- Get project URL and anon key, store in `.env.local` (never commit)
- Copy values to `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- Database migrations run in Stage 03

**Vercel Project** (automatic via GitHub Actions):
- Vercel deployment auto-configured in CI/CD pipeline
- Set Vercel env vars in GitHub Actions: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

## Directory Structure

```
orchestra-sheets/
├── CLAUDE.md                   (this file)
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── auth.ts
│   │   │   ├── db/
│   │   │   └── crypto/
│   │   ├── client/
│   │   │   └── utils/
│   │   ├── components/
│   │   └── types/
│   ├── routes/
│   └── app.html
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .github/
│   └── workflows/
├── drizzle/
│   └── migrations/
├── .env.example
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

## Enterprise Standards

All code adheres to:
- OWASP Top 10 Web (A01, A02, A03, A05, A07 priority)
- OWASP ASVS Level 2 (V2, V3, V6, V8, V13)
- WCAG 2.1 AA (all 50 success criteria)
- CWE Top 25 (CWE-79, CWE-89, CWE-862/863, CWE-312, CWE-918)
- SOC 2 alignment (audit logging, encryption, least privilege)
- GDPR/CCPA (API keys as personal data — encryption, right to deletion, processing records)
- Web security headers (HSTS, CSP strict, CORS allowlist, CSRF tokens, X-Frame-Options: DENY)
- Lighthouse targets: Performance ≥90, Accessibility ≥95, LCP <2.5s, CLS <0.1

## Stage Plan

See `D2R_Orchestra_Sheets_MVP_2026-04-13_v02_I.md` for the complete D2R plan skeleton with all stages through Stage QA.

## Development

```bash
npm install
npm run dev            # Local dev server
npm run build          # Production build
npm test               # All tests (unit + integration + E2E)
npm run test:unit      # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e       # Playwright E2E tests
npm run type-check     # TypeScript check
npm run lint           # ESLint + Prettier
```
