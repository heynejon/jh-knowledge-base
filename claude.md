# claude.md — Project Context and Operating Guidelines

---

## 1. Project Summary

**Project Name:** JH Knowledge Base

**High-Level Description:**
A personal note-taking web app for capturing, summarizing, and organizing online articles. Users paste a URL, the app extracts the article content, generates an LLM-powered summary using a customizable prompt, and saves it to a searchable knowledge base.

**Intended Usage:**
Personal private app for Jonathan. Single-user, no authentication initially. May add Supabase Auth later for multi-device access.

---

## 2. Communication Protocols

### PBEA — Play Back to Ensure Alignment

When I write **"PBEA"**:

- Restate the task in your own words.
- List key constraints and assumptions.
- Ask clarifying questions if something is ambiguous.
- Do **not** propose solutions.
- Do **not** write or modify any code.

PBEA is for **alignment only**.

---

### WYBP — What's Your Build Plan?

When I write **"WYBP"**, produce a **structured implementation plan**.
Your WYBP must include:

1. **Scope & Assumptions**
   - What exactly is in-scope and out-of-scope.
   - Any assumptions about existing behavior, data, or environment.

2. **Architecture & File Impact**
   - Which modules, components, routes, or scripts will change.
   - Any schema, interface, or contract changes.

3. **Testing Plan**
   - What tests you will add or update.
   - How correctness will be validated (unit, integration, E2E, manual checks).

4. **Risks & Rollback Strategy**
   - What could break or regress.
   - How we would revert if needed.

During WYBP you must **not** write or modify any code.
Only after I explicitly approve the plan and use a clear action verb ("implement", "fix", "update", "change", "do it", etc.) may you proceed to implementation.

---

### General Communication Style

- Be clear, direct, and concise.
- Avoid unnecessary verbosity or filler.
- Use bullet points and structured formatting where helpful.
- Don't over-compliment or use phrases like "you're absolutely right..."
- If you think a suggestion is wrong, say so and explain why.

---

## 3. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend + Backend | Next.js 14+ (App Router, TypeScript) |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS |
| Article Extraction | @mozilla/readability + jsdom |
| LLM | OpenAI API (gpt-4o-mini) |
| Hosting | Vercel |
| Export Format | JSON |

---

## 4. Project Structure

```
jh-knowledge-base/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with header
│   │   ├── page.tsx                # All Articles Screen (home)
│   │   ├── articles/
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Item View Screen
│   │   ├── new/
│   │   │   └── page.tsx            # New Item Screen
│   │   ├── settings/
│   │   │   └── page.tsx            # Settings Screen
│   │   └── api/
│   │       ├── articles/           # CRUD for articles
│   │       ├── extract/            # Article extraction from URL
│   │       ├── summarize/          # LLM summarization
│   │       ├── settings/           # User prompt settings
│   │       └── export/             # JSON export
│   ├── components/                 # Reusable UI components
│   ├── lib/                        # Utilities (supabase, openai, extractor)
│   └── types/                      # TypeScript types
├── .env.local                      # Local secrets (not committed)
├── .env.example                    # Template for env vars
└── ...
```

---

## 5. Supabase Architecture

  **Project structure:**
  - Two Supabase projects: **Personal Apps** (this project) and **Commercial Apps**
  - Each app within a project uses schema-based environment isolation
  - To avoid collisions and allow future spin-out, follow these rules strictly

  **Schema naming convention:**
  - Production: `App_[app_name]__prod` (e.g., `App_coursesummarizer__prod`)
  - Development: `App_[app_name]__dev` (e.g., `App_coursesummarizer__dev`)

  **Schema exposure:**
  - New schemas must be added to Supabase's exposed schemas for the API to access them:
    ```sql
    ALTER DATABASE postgres SET pgrst.db_schemas = 'public, graphql_public, App_[app_name]__prod, App_[app_name]__dev';
    NOTIFY pgrst, 'reload config';
    ```

  **Environment configuration:**
  - SUPABASE_SCHEMA env var determines which schema to use
  - Set in .env.local (localhost) and Vercel env vars (production)
  - These files are gitignored; code never hardcodes schema names
  - Production must have SUPABASE_SCHEMA set explicitly (fails fast if missing)

  **What IS isolated by schema:**
  - All database tables and data

  **What is NOT isolated (shared across schemas):**
  - Storage buckets (uploads, artifacts) - uses UUIDs so no practical conflict
  - Auth users - same login works in both environments

  **Row Level Security (RLS):**
  - Enable RLS on all app tables
  - Enforce owner-based access:
    - SELECT / UPDATE / DELETE: user_id = auth.uid()
    - INSERT: user_id = auth.uid()
  - Do not rely on application code for authorization; enforce it in SQL policies
  - Keep policies simple (user_id = auth.uid()) so core.app_access gating can be added later without refactoring

  **Storage (if applicable):**
  - Use a dedicated storage bucket: [app_name]-files
  - Store files under <user_id>/...
  - Enforce owner-only access via storage policies

  **Spin-out requirement:**
  - All app tables, enums, functions, and triggers must live in the app's schema
  - The schema must be exportable and deployable to a new Supabase project without refactoring

  **When making database changes:**
  1. Write migration in supabase/migrations/
  2. Test migration on the dev schema first via Supabase SQL Editor
  3. Before deploying to Vercel, run the same migration on the prod schema
  4. Deploy code to Vercel

Follow these conventions exactly unless explicitly instructed otherwise.


---

## 6. Database Schema

**Schemas:**
- Production: `App_jhknowledgebase__prod`
- Development: `App_jhknowledgebase__dev`

### articles
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner (references auth.users) |
| title | TEXT | Article title |
| publication_name | TEXT | Source publication |
| source_url | TEXT | Original URL |
| full_text | TEXT | Extracted article content |
| summary | TEXT | LLM-generated summary |
| created_at | TIMESTAMPTZ | When saved |

### settings
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner (references auth.users) |
| summary_prompt | TEXT | Custom prompt for LLM |
| updated_at | TIMESTAMPTZ | Last modified |

### settings_defaults
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner (references auth.users) |
| default_prompt | TEXT | Default prompt template |
| updated_at | TIMESTAMPTZ | Last modified |

---

## 7. Development Guidelines

### Code Style

- Follow consistent formatting (Prettier, ESLint).
- Use meaningful variable and function names.
- Keep functions small and focused.
- Prefer explicit types over `any`.

### Git Practices

- Write clear, descriptive commit messages.
- Commit logical chunks of work.
- Never commit `.env.local` or secrets.

### Testing

- Manual testing for MVP is acceptable.
- Add automated tests as the app matures.
- Always verify the full flow works before deploying.

---

## 8. Key Technical Decisions

### Article Extraction: @mozilla/readability
- Same library powering Firefox Reader View
- Battle-tested, handles messy real-world HTML
- Extracts title, byline, clean content automatically

### LLM Model: gpt-4o-mini
- Cost-efficient (~15x cheaper than gpt-4o)
- Fast response times for good UX
- Sufficient quality for summarization tasks
- 128K context handles long articles

### Styling: Tailwind CSS
- Consistent with other projects (Estimate King, Course Summarizer)
- Rapid prototyping with utility classes
- Built-in responsive design utilities

---

## 9. Screens Overview

1. **All Articles Screen** (Home)
   - URL input + "Add Knowledge Item" button
   - Search bar
   - List of saved articles (title, publication, date)
   - Settings and Export links

2. **Item View Screen**
   - Article title, metadata, source link
   - Toggle: Full Text / Summary
   - Edit button for summary

3. **New Item Screen**
   - Same as Item View, but with Save/Discard buttons
   - Shown immediately after extracting + summarizing

4. **Settings Screen**
   - Edit the LLM summary prompt
   - Reset to default option

---

## 10. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# OpenAI (server-only, never exposed to browser)
OPENAI_API_KEY=...
```

---

## 11. Roadmap

1. [x] Define requirements and tech decisions
2. [x] Set up Next.js project with Tailwind
3. [ ] Create Supabase tables
4. [ ] Implement article extraction API
5. [ ] Implement LLM summarization API
6. [ ] Build All Articles Screen
7. [ ] Build New Item Screen (save/discard flow)
8. [ ] Build Item View Screen (toggle + edit)
9. [ ] Build Settings Screen
10. [ ] Add search functionality
11. [ ] Add export functionality
12. [ ] Deploy to Vercel
13. [ ] (Future) Add Supabase Auth

---

## 12. Project-Specific Notes

### Single-User Architecture
This app currently has no authentication. All articles and settings are shared/global. When adding auth later:
- Add `user_id` to both tables
- Add RLS policies: `user_id = auth.uid()`
- Update all queries to be user-scoped

### API Key Security
- `OPENAI_API_KEY` must never be exposed to the client
- All LLM calls happen in API routes (server-side only)
- Supabase keys are `NEXT_PUBLIC_*` because the client needs them, but RLS will protect data once auth is added

---

## 13. Instructions for Claude Code

When working on this project:

1. Read this file fully before generating code.
2. Reference the `IMPLEMENTATION_PROMPT.md` for detailed specifications.
3. Keep code simple — avoid over-engineering.
4. Handle errors gracefully with user-friendly messages.
5. Ensure responsive design works on mobile.
6. Never commit secrets or `.env.local`.
7. Test the full flow before considering a feature complete.

---

*This file should remain in `.claude/` so Claude Code automatically loads context for each session.*
