# Database Setup Guide

## Overview

Orchestra Sheets uses **PostgreSQL** via **Supabase** with **Drizzle ORM** for type-safe database operations.

## Prerequisites

1. **Supabase Project** — Create at https://supabase.com
2. **Environment Variables** — Set in `.env.local` (never commit):
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
   ```

## Schema

The database includes the following tables:

### Core Tables

- **users** — User profiles (synced with Auth.js)
- **api_keys** — Encrypted LLM provider credentials (AES-256-GCM)
- **folders** — Nested folder hierarchy for organization
- **tags** — User-defined tags for categorization
- **prompts** — Prompt templates with variables
- **prompt_versions** — Version history with diffs
- **test_runs** — A/B test results and cost tracking
- **audit_logs** — Compliance audit trail

### Auth Tables (Auth.js)

- **session** — OAuth session tokens
- **verificationToken** — Email verification tokens

## Security: Row Level Security (RLS)

All tables have RLS policies enabled to enforce **multi-tenant isolation**:

- **Users can only access their own data**
- **API keys encrypted with per-user DEK + cloud KMS**
- **Audit logs tied to user ID for compliance**
- **Cascade deletes for data cleanup on user removal**

### RLS Policies Applied

Each table has policies ensuring:

1. SELECT — User can only query rows where `user_id = auth.uid()`
2. INSERT/UPDATE/DELETE — User can only modify their own rows

Example (prompts table):

```sql
CREATE POLICY prompts_user_isolation ON prompts FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
```

## Migration Process

### 1. Run Initial Schema (Stage 03)

```bash
# From psql or Supabase SQL Editor:
psql $DATABASE_URL -f drizzle/0001_initial_schema.sql
```

### 2. Enable RLS Policies (Stage 03)

```bash
# From psql or Supabase SQL Editor:
psql $DATABASE_URL -f drizzle/0002_enable_rls_and_policies.sql
```

### 3. Verify Schema

```bash
npm run db:inspect  # (When CI/CD adds this command)
```

## Database Operations in Code

### Get Database Instance

```typescript
import { getDatabase } from '$lib/server/db/client';

const db = getDatabase();
```

### Query Examples

**Select user's own prompts:**

```typescript
const db = getDatabase();
const myPrompts = await db.select().from(prompts).where(eq(prompts.userId, userId));
```

**Create new prompt:**

```typescript
await db.insert(prompts).values({
	userId: userId,
	name: 'My Prompt',
	content: 'Hello {{variable}}',
	variables: { variable: 'default' }
});
```

**Version a prompt:**

```typescript
await db.insert(promptVersions).values({
	promptId: promptId,
	versionNumber: 2,
	content: 'Updated content',
	createdBy: userId
});
```

## Cost Tracking

Cost is tracked as DECIMAL(10, 6) for precision:

```typescript
await db
	.update(testRuns)
	.set({
		totalCost: 0.00245, // $0.00245
		status: 'completed'
	})
	.where(eq(testRuns.id, runId));
```

## Audit Logging

All data modifications should log to audit_logs:

```typescript
await db.insert(auditLogs).values({
  userId: userId,
  action: 'create_prompt',
  resourceType: 'prompt',
  resourceId: String(promptId),
  details: { name: 'My Prompt', variables: {...} },
  ipAddress: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent')
});
```

## Testing

Database operations are tested in `tests/unit/db.test.ts` with 42 test cases covering:

- Schema structure validation
- User isolation (RLS)
- Relationships and cascades
- Security fields (encrypted keys, audit trails)
- Versioning and audit capabilities

Run tests:

```bash
npm run test:unit
```

## Backups and Recovery

Supabase provides:

- **Daily automated backups** (7-day retention, configurable)
- **Point-in-time recovery** (7 days by default)
- **Backup restoration** via dashboard

Set up in Supabase Dashboard:

1. Go to Project > Settings > Backups
2. Configure retention period
3. Enable automatic backups

## Monitoring

Monitor database health via Supabase Dashboard:

- Query performance (slow logs)
- Connection count
- Storage usage
- RLS policy violations

Set up alerts for:

- High query latency
- Connection pool exhaustion
- Storage quota warnings
