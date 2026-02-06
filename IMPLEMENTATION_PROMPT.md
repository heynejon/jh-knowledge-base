# JH Knowledge Base — Implementation Prompt

Use this prompt to guide an LLM through building the complete application.

---

## Project Overview

**App Name:** JH Knowledge Base

**Purpose:** A personal note-taking app that allows the user to quickly understand the gist of online articles and save interesting ones to a searchable knowledge base for future reference.

**Tech Stack:**
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

## Core Data Model

### Article Item (Database Schema)

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  publication_name TEXT,
  source_url TEXT NOT NULL,
  full_text TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Settings (Database Schema)

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_prompt TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Note: For now, this is a single-user app without authentication. Settings will have exactly one row. When authentication is added later, both tables will get a `user_id` column.

---

## Core Functionality Requirements

### 1. URL Input & Article Extraction

When the user pastes a URL and clicks "Add Knowledge Item":

1. **Fetch the webpage** server-side (to avoid CORS issues)
2. **Extract clean article content** using `@mozilla/readability`:
   - Title
   - Publication/site name (from metadata or domain)
   - Full article text (cleaned of ads, navigation, etc.)
   - Source URL (the original URL)
3. **Handle errors gracefully** - Show user-friendly messages if:
   - URL is invalid
   - Page cannot be fetched (404, timeout, etc.)
   - No article content could be extracted (e.g., it's a login-gated page)

### 2. LLM Summarization

After extracting the article:

1. **Retrieve the user's summary prompt** from the settings table
2. **Call OpenAI API** with gpt-4o-mini:
   - System message: The user's custom prompt from settings
   - User message: The full article text
3. **Return the summary** to display in the New Item Screen
4. **Handle API errors** - Show error message if OpenAI call fails

**Default Summary Prompt** (used if none is set):
```
You are a helpful assistant that summarizes articles. Create a clear, concise summary that captures the key points and main arguments. Use bullet points for the main takeaways. Keep the summary under 300 words.
```

### 3. Save/Discard Flow

After summary is generated:

1. **Show the New Item Screen** with title, full text (toggleable), and summary
2. **User chooses:**
   - **Save**: Insert the item into the `articles` table with current timestamp
   - **Discard**: Do not save; return to All Articles Screen

### 4. Article Storage & Retrieval

- **Save** articles to Supabase with all fields (title, publication, URL, full text, summary, date)
- **List** all articles ordered by `created_at DESC` (newest first)
- **Search** articles by title, publication name, full text, or summary content
- **Delete** articles (optional but recommended for usability)

### 5. View & Edit

- **View article** with toggle between full text and summary
- **Edit summary** - Allow user to modify the saved summary text
- **Title always visible** in both views

### 6. Settings

- **View current prompt** used for summarization
- **Edit prompt** - Save changes to database
- **Reset to default** - Option to restore the default prompt

### 7. Export

- **Export all articles** as a JSON file download
- **JSON structure:**
```json
{
  "exported_at": "2024-01-15T10:30:00Z",
  "articles": [
    {
      "id": "uuid",
      "title": "Article Title",
      "publication_name": "Publication Name",
      "source_url": "https://...",
      "full_text": "...",
      "summary": "...",
      "created_at": "2024-01-10T08:00:00Z"
    }
  ]
}
```

---

## Screen Specifications

### Screen 1: All Articles Screen (Home)

**Layout:**
- App name "JH Knowledge Base" at top
- URL input field with placeholder "Paste article URL..."
- "Add Knowledge Item" button below the input
- Search bar for filtering articles
- List of saved articles showing:
  - Title (clickable, opens Item View)
  - Publication name
  - Date added (formatted nicely, e.g., "Jan 15, 2024")
- Settings icon/link (gear icon in header or navigation)
- Export button (download icon)

**Behavior:**
- Clicking an article opens Item View Screen
- Clicking "Add Knowledge Item" with a valid URL:
  1. Shows loading state
  2. Fetches and extracts article
  3. Generates summary
  4. Navigates to New Item Screen
- Search filters the list in real-time (client-side) or with debounced server query

### Screen 2: Item View Screen

**Layout:**
- App name "JH Knowledge Base" at top
- Back button/link to return to All Articles
- Article title (prominent, always visible)
- Publication name and date added (smaller, below title)
- Source URL (clickable link to original article)
- Toggle switch or tabs: "Full Text" | "Summary"
- Content area showing either full text or summary based on toggle
- Edit button (only visible in Summary view) - opens inline editor or modal

**Behavior:**
- Toggle switches between full article text and summary
- Edit button enables editing the summary text
- Save button appears when editing; saves changes to database
- Cancel button discards edits

### Screen 3: New Item Screen

**Layout:**
- Identical to Item View Screen, but with different action buttons
- Instead of "Back", show: "Discard" and "Save to Knowledge Base" buttons

**Behavior:**
- "Save to Knowledge Base": Saves article to database, navigates to All Articles (or Item View of saved article)
- "Discard": Does not save, navigates to All Articles
- User can still toggle between views and see the full text before deciding

### Screen 4: Settings Screen

**Layout:**
- App name "JH Knowledge Base" at top
- Back button to All Articles
- "Summary Prompt" section:
  - Label explaining what this does
  - Large textarea showing current prompt
  - "Save Changes" button
  - "Reset to Default" button

**Behavior:**
- Editing the textarea and clicking Save updates the prompt in the database
- Reset to Default replaces the textarea content with the default prompt and saves it

---

## UI/UX Requirements

### Responsive Design
- **Desktop**: Full-width content area, comfortable reading width (max ~800px for text)
- **Tablet**: Similar to desktop, with adjusted padding
- **Mobile**:
  - Full-width layout
  - Hamburger menu or bottom navigation if needed
  - Touch-friendly button sizes (min 44px tap targets)
  - URL input and buttons stack vertically

### Visual Design
- Clean, minimal aesthetic
- Good typography for reading (system fonts or clean sans-serif)
- Clear visual hierarchy (title > metadata > content)
- Subtle hover/focus states for interactive elements
- Loading spinners/skeletons during async operations

### Accessibility
- Semantic HTML (proper headings, labels, buttons)
- Keyboard navigable
- Sufficient color contrast
- ARIA labels where needed

---

## Project Structure

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
│   │       ├── articles/
│   │       │   ├── route.ts        # GET all, POST new article
│   │       │   └── [id]/
│   │       │       └── route.ts    # GET, PATCH, DELETE single article
│   │       ├── extract/
│   │       │   └── route.ts        # POST: extract article from URL
│   │       ├── summarize/
│   │       │   └── route.ts        # POST: generate summary
│   │       ├── settings/
│   │       │   └── route.ts        # GET, PATCH settings
│   │       └── export/
│   │           └── route.ts        # GET: export all as JSON
│   ├── components/
│   │   ├── Header.tsx              # App header with nav
│   │   ├── ArticleList.tsx         # List of articles
│   │   ├── ArticleCard.tsx         # Single article in list
│   │   ├── ArticleView.tsx         # Full/summary toggle view
│   │   ├── SearchBar.tsx           # Search input
│   │   ├── UrlInput.tsx            # URL input + add button
│   │   └── PromptEditor.tsx        # Settings prompt textarea
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client
│   │   ├── openai.ts               # OpenAI client
│   │   ├── extractor.ts            # Article extraction logic
│   │   └── constants.ts            # Default prompt, etc.
│   └── types/
│       └── index.ts                # TypeScript types
├── public/
├── .env.local                      # Local environment variables
├── .env.example                    # Template for env vars
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## Environment Variables

```env
# .env.local (and Vercel environment variables)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

**Security Notes:**
- `NEXT_PUBLIC_*` variables are exposed to the browser (needed for Supabase client)
- `OPENAI_API_KEY` is server-only (never exposed to browser)
- Never commit `.env.local` to git (add to `.gitignore`)

---

## Implementation Steps

### Phase 1: Project Setup
1. Create Next.js project with TypeScript and Tailwind
2. Set up Supabase project and create tables
3. Configure environment variables
4. Create basic layout and routing structure

### Phase 2: Core Backend
5. Implement article extraction API (`/api/extract`)
6. Implement summarization API (`/api/summarize`)
7. Implement articles CRUD API (`/api/articles`)
8. Implement settings API (`/api/settings`)

### Phase 3: Frontend Screens
9. Build All Articles Screen (home page)
10. Build Item View Screen
11. Build New Item Screen
12. Build Settings Screen

### Phase 4: Features & Polish
13. Add search functionality
14. Add export functionality
15. Add responsive design refinements
16. Add loading states and error handling
17. Test end-to-end flow

### Phase 5: Deployment
18. Deploy to Vercel
19. Configure Vercel environment variables
20. Test production deployment

---

## Package Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "openai": "^4.0.0",
    "@mozilla/readability": "^0.5.0",
    "jsdom": "^24.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "tailwindcss": "^3.0.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0",
    "@types/jsdom": "^21.0.0"
  }
}
```

---

## Error Handling Guidelines

### User-Facing Errors
Always show clear, actionable error messages:
- "Could not fetch the article. Please check the URL and try again."
- "Could not extract article content. This page may require login or have no readable content."
- "Could not generate summary. Please try again later."
- "Could not save the article. Please try again."

### Technical Errors
Log detailed errors server-side for debugging:
- Include URL, timestamp, error type, stack trace
- Never expose internal error details to users

---

## Future Enhancements (Out of Scope for MVP)

- User authentication (Supabase Auth)
- Multiple users with separate knowledge bases
- Tags/categories for articles
- Import from JSON backup
- Browser extension for one-click saving
- Full-text search with PostgreSQL tsvector
- AI-powered Q&A over saved articles

---

## Testing Checklist

Before considering the app complete, verify:

- [ ] Can paste a URL and see extracted article content
- [ ] Summary is generated using the custom prompt
- [ ] Can save an article to the database
- [ ] Can discard an article without saving
- [ ] Saved articles appear in All Articles list
- [ ] Can search articles by title/content
- [ ] Can view full text and summary (toggle works)
- [ ] Can edit and save summary changes
- [ ] Can change the summary prompt in settings
- [ ] Can export all articles as JSON
- [ ] App is responsive on mobile
- [ ] Error states are handled gracefully
- [ ] Works in production on Vercel
