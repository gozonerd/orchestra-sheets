# Canonical Session-Start Instruction (auto-prepended by wire-consumer-repo.sh)

## Session-Start Discipline (READ FIRST)

This repo consumes the Martinez Methods SSOT via two git submodules under
`.claude/canonical/`. Before reading any other file in this repo, including the
rest of this CLAUDE.md, the SessionStart hook should have run:

```bash
git submodule update --remote --recursive .claude/canonical/
```

If that hook did NOT run (e.g., older settings.json, hook disabled), run it
manually before reading skills. Stale canonical content is a load-bearing
failure mode.

### Skill resolution order

1. **Repo-local override** — `.claude/skills/<name>/SKILL.md`
2. **Canonical (general)** — `.claude/canonical/mm-claude-canonical/skills/<name>/SKILL.md`
3. **Canonical (D2R)** — `.claude/canonical/mm-d2r-code-plan-stack/skills/<name>/SKILL.md`

### Memory partition

Loaded from `.claude/canonical/mm-claude-canonical/memory/<detected-user>/`
where `<detected-user>` ∈ {krystal, cody, shared}. See
`.claude/canonical/mm-claude-canonical/skills/load-memory/SKILL.md` for the
detection algorithm.

**Fail-closed:** if user-detection cannot resolve to a definitive user AND the
session is non-interactive (no opportunity to ask), NO memory loads. Surface
warning at session top; continue session without memory. Cross-user
contamination is a load-bearing failure mode (handoff §2.2 + design doc §11.8).

### Failure mode — submodule update fails

If `git submodule update --remote` fails (network, conflict, auth):

1. The session continues with the existing local SHA (stale-but-functional).
2. Warning surfaces at session start (`session-start-pull.sh` writes to
   `~/.claude/sync-failure.log` and prints to stderr).
3. Investigate before authoring; running on stale canonical risks losing recent
   methodology updates.

### Persona attribution

- Krystal: Clauda or Claudette family persona (one-per-workstream pattern;
  see `_grand_repo/role-manifests/` and SSOT-migrated copies at
  `.claude/canonical/mm-claude-canonical/role-manifests/`).
- Cody: single persona "Claude & Cody" (`claude-and-cody.yaml`); broad scope;
  pronouns they/them. Cody opted out of multi-persona overhead per decision
  11.6 lock 2026-04-28.

### ASAE-Gate enforcement

Every commit goes through `.githooks/commit-msg` (or whatever hook this repo
has installed). Threshold derives from this repo's `.asae-policy`:
- `audit_threshold: strict-5` → 5 passes + 2 raters + both CONFIRMED (canonical SSOT repos)
- `going-public: true` → strict-3 + 1 rater (default for going-public repos)
- `going-public: false` → standard-2 (default for stable-private repos)

See `.claude/canonical/mm-claude-canonical/references/ASAE_Gate_Quickstart_*.md`
when Spec Genius authors it (Batch 3 Lock A1) for the full quickstart.

---

---

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
