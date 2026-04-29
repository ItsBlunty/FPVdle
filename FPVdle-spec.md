# FPVdle — Project Specification

A daily FPV troubleshooting puzzle game inspired by Doctordle. Players are given a series of clues about a malfunctioning quadcopter and must diagnose the problem from an open-ended autocomplete list of possible issues.

---

## 1. Overview

**What it is:** A daily web-based puzzle game. Each day, one new puzzle is published. Players see clues one at a time, type their guess into an autocomplete search box (selecting from a master list of FPV diagnoses), and submit. Wrong guesses reveal the next clue. Right guess wins. Running out of clues = loss. Same puzzle for everyone, rolling over at midnight UTC.

**Audience:** FPV pilots and builders, mixed skill levels. Difficulty varies per puzzle (set by the puzzle creator).

**Deliverable:** A Next.js full-stack app, runnable locally and deployable to Railway. Includes:
- Player-facing daily puzzle UI
- Admin panel (password-protected) for creating puzzles and managing the diagnosis dictionary
- Postgres-backed aggregate stats per puzzle
- Persistent media storage for puzzle images/videos

---

## 2. Game Mechanics

### Player flow
1. Visit site → today's puzzle loads automatically.
2. **Clue 1** is displayed. An autocomplete search box appears below it.
3. Player types a guess. As they type, the autocomplete filters the diagnosis dictionary (matching against `name` and `aliases`). Player picks an entry and clicks **Submit**.
4. **If correct:** Win screen — shows the answer, an explanation, and a shareable result. Stats record a win at clue N.
5. **If wrong:** That guess is logged (visible to the player as a struck-through entry), the next clue reveals, and the player guesses again.
6. **If they exhaust all clues with the last guess wrong:** Loss screen — shows the correct answer, the explanation, and a shareable result.
7. Player's progress for today is saved in `localStorage` — refreshing returns them to the same state. They cannot replay today's puzzle.
8. Next puzzle unlocks at midnight UTC.

### Puzzle structure
- Each puzzle has a **dynamic number of clues** (set by creator — can be 3, 5, 8, whatever).
- Number of guesses = number of clues. One guess per clue.
- Each clue is one of three types: **text**, **image**, or **video**. (Combined caption + media is supported.)
- Each puzzle has exactly one correct diagnosis (referenced by ID from the diagnosis dictionary).
- Each puzzle has a creator-written **explanation** shown on the end screen.
- Each puzzle has a **difficulty** label (`beginner` | `intermediate` | `advanced`) — shown on end screen only, not before solving.

### Per-puzzle stats (the "percent" metric)
Replacing Wordle-style global rankings. After completion, the end screen shows:
- **% of players who solved it** (e.g., "62% solved")
- **Average clues used to solve** (e.g., "Avg: 3.4 / 5")

These are aggregated server-side from anonymous play records. Player's individual streak / play history stays in `localStorage`.

### Sharing
On the end screen, a "Copy Result" button generates Wordle-style shareable text:
```
FPVdle #42 — 3/5 ✅
🟥🟥🟩
```
Or for a loss:
```
FPVdle #42 — X/5 ❌
🟥🟥🟥🟥🟥
```

---

## 3. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router)** | Single repo, full-stack, easy Railway deploy |
| Language | TypeScript | Type safety for puzzle/diagnosis schemas |
| Styling | Tailwind CSS | Fast iteration |
| Database | **PostgreSQL** | Hosted on Railway, used for stats and content |
| ORM | Prisma | Schema-first, migrations, great DX |
| Auth (admin) | JWT in HTTP-only cookie, password from env | Single admin user, no need for a full auth provider |
| File storage | **Railway Volume** mounted at `/data` | Persistent media across deploys |
| Hosting | Railway | Specified target |

---

## 4. Architecture

```
┌──────────────────────────────────────────┐
│           Next.js App (Railway)          │
│                                          │
│  ┌────────────┐    ┌──────────────────┐  │
│  │ Player UI  │    │   Admin UI       │  │
│  │  /         │    │   /admin/*       │  │
│  └─────┬──────┘    └────────┬─────────┘  │
│        │                    │            │
│        ▼                    ▼            │
│  ┌────────────────────────────────────┐  │
│  │         API Routes                 │  │
│  │  /api/puzzle/today                 │  │
│  │  /api/diagnoses                    │  │
│  │  /api/play (POST result)           │  │
│  │  /api/stats/[puzzleId]             │  │
│  │  /api/admin/* (protected)          │  │
│  │  /api/media/[...path]              │  │
│  └─────────────┬──────────────────────┘  │
│                │                          │
└────────────────┼──────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
  ┌──────────┐      ┌──────────────┐
  │ Postgres │      │ /data volume │
  │ (Railway)│      │ media files  │
  └──────────┘      └──────────────┘
```

---

## 5. Data Models

### Postgres schema (Prisma)

```prisma
model Diagnosis {
  id          String    @id              // slug, e.g. "esc-desync"
  name        String                     // display name, e.g. "ESC Desync"
  category    String                     // e.g. "motor-esc"
  aliases     String[]                   // e.g. ["motor desync", "desync"]
  description String?                    // optional, for admin reference
  createdAt   DateTime  @default(now())
  puzzles     Puzzle[]
}

model Puzzle {
  id            Int       @id @default(autoincrement())
  publishDate   DateTime  @unique          // date this puzzle goes live (midnight UTC)
  answerId      String
  answer        Diagnosis @relation(fields: [answerId], references: [id])
  explanation   String                     // shown on end screen
  difficulty    String                     // "beginner" | "intermediate" | "advanced"
  clues         Clue[]
  plays         Play[]
  createdAt     DateTime  @default(now())
}

model Clue {
  id        Int      @id @default(autoincrement())
  puzzleId  Int
  puzzle    Puzzle   @relation(fields: [puzzleId], references: [id], onDelete: Cascade)
  position  Int                             // 1, 2, 3... order shown
  type      String                          // "text" | "image" | "video"
  content   String                          // text content OR relative media path (e.g. "/media/images/abc.png")
  caption   String?                         // optional caption for media

  @@unique([puzzleId, position])
}

model Play {
  id         Int      @id @default(autoincrement())
  puzzleId   Int
  puzzle     Puzzle   @relation(fields: [puzzleId], references: [id], onDelete: Cascade)
  sessionId  String                          // anonymous UUID from client localStorage
  cluesUsed  Int                             // how many clues were revealed before completion
  solved     Boolean
  createdAt  DateTime @default(now())

  @@unique([puzzleId, sessionId])           // one play per session per puzzle
}
```

### LocalStorage shape (client-side)

```ts
{
  sessionId: "uuid-v4",           // generated once on first visit
  streak: { current: 3, max: 7 },
  plays: {
    "2026-04-29": {                // ISO date (UTC) of puzzle
      puzzleId: 42,
      guesses: ["wrong-id-1", "wrong-id-2", "esc-desync"],
      solved: true,
      cluesRevealed: 3,
      completed: true
    }
  }
}
```

---

## 6. File Structure

```
fpvdle/
├── app/
│   ├── page.tsx                    # main game (today's puzzle)
│   ├── layout.tsx
│   ├── stats/page.tsx              # personal stats / streak page
│   ├── admin/
│   │   ├── layout.tsx              # checks auth, redirects if not logged in
│   │   ├── login/page.tsx
│   │   ├── page.tsx                # dashboard: list of puzzles
│   │   ├── puzzles/
│   │   │   ├── new/page.tsx        # create puzzle form
│   │   │   └── [id]/page.tsx       # edit puzzle form
│   │   └── diagnoses/
│   │       ├── page.tsx            # list/manage diagnoses
│   │       └── new/page.tsx        # add diagnosis form
│   └── api/
│       ├── puzzle/today/route.ts
│       ├── diagnoses/route.ts
│       ├── play/route.ts
│       ├── stats/[puzzleId]/route.ts
│       ├── media/[...path]/route.ts
│       └── admin/
│           ├── login/route.ts
│           ├── logout/route.ts
│           ├── puzzles/route.ts            # GET list, POST new
│           ├── puzzles/[id]/route.ts       # GET, PATCH, DELETE
│           ├── diagnoses/route.ts          # GET list, POST new
│           ├── diagnoses/[id]/route.ts     # GET, PATCH, DELETE
│           └── upload/route.ts             # multipart media upload
├── components/
│   ├── game/
│   │   ├── ClueCard.tsx            # renders a text/image/video clue
│   │   ├── DiagnosisAutocomplete.tsx
│   │   ├── GuessHistory.tsx
│   │   └── EndScreen.tsx
│   └── admin/
│       ├── PuzzleForm.tsx
│       ├── ClueEditor.tsx
│       └── MediaUpload.tsx
├── lib/
│   ├── db.ts                       # Prisma client
│   ├── auth.ts                     # JWT helpers
│   ├── puzzle.ts                   # date-based puzzle lookup
│   └── storage.ts                  # localStorage helpers
├── middleware.ts                   # protects /admin routes
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── (static assets)
├── /data                           # mounted Railway volume in prod, ./data dir in dev
│   └── media/
│       ├── images/
│       └── videos/
├── .env.example
├── package.json
├── next.config.js
├── tailwind.config.ts
├── railway.json                    # Railway deploy config
└── README.md
```

---

## 7. UI/UX Flows

### Player flow (today's puzzle)
- **Header:** "FPVdle" wordmark, today's puzzle number, link to Stats page.
- **Clue stack:** Clue 1 visible at top. As clues are revealed, they stack vertically below. Each clue card shows its number ("Clue 1 of 5"), its content (text/image/video), and any caption.
- **Guess input:** Below the clue stack. An autocomplete field with placeholder "What's the issue?". As the player types, a dropdown shows up to ~8 matching diagnoses. Player picks one (or arrow-key navigates) and hits Submit.
- **Guess history:** Wrong guesses appear as a horizontal row of struck-through chips between clues and input.
- **End screen (modal or replaces guess area):** Big ✅ or ❌, the correct diagnosis name, the creator's explanation, the difficulty badge, the % solved + avg clues stats, and a "Copy Result" share button.
- **After completion:** Page locks. Shows countdown to next puzzle ("Next puzzle in 4h 12m").

### Admin flow
- `/admin/login` — username + password form. On success, sets JWT cookie, redirects to `/admin`.
- `/admin` — dashboard. Lists all puzzles with publish date, answer, status (past / today / scheduled). Buttons: "New Puzzle", "Manage Diagnoses".
- `/admin/puzzles/new` — form with:
  - Publish date picker
  - Difficulty dropdown
  - Answer: searchable dropdown of existing diagnoses + "+ Add new diagnosis" inline button
  - Clues: a dynamic list — add/remove/reorder. Each row picks a type (text/image/video). Text rows show a textarea. Image/video rows show a file upload button + caption field. Drag-handle to reorder.
  - Explanation: textarea
  - Save button
- `/admin/puzzles/[id]` — same form, pre-filled, with Delete button.
- `/admin/diagnoses` — table of all diagnoses with edit/delete.
- `/admin/diagnoses/new` — form: name, category, aliases (comma-separated), description.

---

## 8. Admin Panel — Auth Details

- Single admin user. Credentials set via env vars:
  - `ADMIN_USERNAME` (plain string)
  - `ADMIN_PASSWORD_HASH` (bcrypt hash, generated once)
  - `JWT_SECRET` (random string)
- `POST /api/admin/login`: checks credentials, on success issues a JWT, sets it as `HttpOnly`, `Secure`, `SameSite=Lax` cookie with 7-day expiry.
- `middleware.ts` runs on `/admin/*` and `/api/admin/*` (except `/api/admin/login`). Verifies JWT, redirects to login if invalid.
- `POST /api/admin/logout`: clears the cookie.

---

## 9. Deployment (Railway)

- Provision two Railway services:
  1. **Web** — the Next.js app, built from the GitHub repo.
  2. **Postgres** — Railway's managed Postgres plugin. Wires `DATABASE_URL` automatically.
- Add a **Volume** to the web service, mounted at `/data`. This is where uploaded media lives.
- Required env vars on the web service:
  - `DATABASE_URL` (auto from Postgres plugin)
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD_HASH`
  - `JWT_SECRET`
  - `MEDIA_DIR=/data/media` (so the same code works locally with `./data/media` and in prod with `/data/media`)
- Build command: `npm run build` (which runs `prisma generate && prisma migrate deploy && next build`)
- Start command: `npm start`
- `railway.json` should configure healthchecks and restart policy.

### Local dev
- `.env.local` mirrors prod env vars; `MEDIA_DIR=./data/media`; `DATABASE_URL` points to a local Postgres (or use Railway's connect-from-local URL).
- `npm run dev` runs Next.js dev server on `:3000`.
- A seed script (`npm run seed`) populates the test puzzle below.

---

## 10. Sample Test Puzzle (for development verification)

This is intentionally a *placeholder* puzzle to validate that everything wires up — text clues, image clue, video clue, autocomplete matching, and the end-screen flow. The real content will be authored later via the admin panel.

### Diagnosis dictionary (3 dummy entries)

```json
[
  {
    "id": "test-issue-a",
    "name": "Test Issue Alpha",
    "category": "test",
    "aliases": ["alpha test", "issue a"],
    "description": "Placeholder for development testing."
  },
  {
    "id": "test-issue-b",
    "name": "Test Issue Bravo",
    "category": "test",
    "aliases": ["bravo test"],
    "description": "Placeholder for development testing."
  },
  {
    "id": "test-issue-c",
    "name": "Test Issue Charlie",
    "category": "test",
    "aliases": ["charlie test"],
    "description": "Placeholder for development testing."
  }
]
```

### Test puzzle

```json
{
  "publishDate": "2026-05-01T00:00:00Z",
  "answerId": "test-issue-b",
  "difficulty": "beginner",
  "explanation": "This is a placeholder explanation. In a real puzzle, this paragraph explains why the answer was correct and teaches the player something about the underlying issue.",
  "clues": [
    {
      "position": 1,
      "type": "text",
      "content": "Placeholder symptom: the quad does the thing it shouldn't be doing."
    },
    {
      "position": 2,
      "type": "image",
      "content": "/media/images/test-placeholder.png",
      "caption": "Placeholder image — replace with a real screenshot or photo."
    },
    {
      "position": 3,
      "type": "video",
      "content": "/media/videos/test-placeholder.mp4",
      "caption": "Placeholder video — replace with a real flight clip."
    },
    {
      "position": 4,
      "type": "text",
      "content": "Final placeholder clue with the smoking-gun detail."
    }
  ]
}
```

The seed script should:
1. Insert the three test diagnoses.
2. Insert this puzzle.
3. Copy a small placeholder image and 1-second placeholder video into `./data/media/images/test-placeholder.png` and `./data/media/videos/test-placeholder.mp4` respectively (these can be checked into the repo under `/seed-assets/` and copied into the volume on first run).

This gives a 4-clue puzzle with one of each clue type, and 3 diagnoses to test autocomplete.

---

## 11. Development Phases

A suggested build order. Each phase is independently testable.

**Phase 1 — Foundation**
- Next.js + TypeScript + Tailwind scaffold
- Prisma schema + initial migration
- Local Postgres connection
- Seed script with test puzzle
- `lib/puzzle.ts` resolves "today's puzzle" by date

**Phase 2 — Player game**
- `/api/puzzle/today` and `/api/diagnoses` endpoints
- Main page renders today's puzzle with one clue visible
- DiagnosisAutocomplete component
- Guess submission, clue revealing, win/loss detection
- LocalStorage progress persistence
- End screen with copy-share

**Phase 3 — Stats**
- `/api/play` POST records a play
- `/api/stats/[puzzleId]` returns `% solved` and `avg clues`
- End screen shows the stats

**Phase 4 — Admin auth**
- Login page + login/logout API routes
- `middleware.ts` protecting `/admin/*` and `/api/admin/*`
- JWT helpers in `lib/auth.ts`

**Phase 5 — Admin diagnosis management**
- List, create, edit, delete diagnoses

**Phase 6 — Admin puzzle management**
- List puzzles
- Create/edit puzzle form with dynamic clue list, drag-reorder, inline media upload
- Media upload endpoint writes to `MEDIA_DIR`
- `/api/media/[...path]` serves files from `MEDIA_DIR`

**Phase 7 — Polish & deploy**
- Personal stats page (streak, history)
- Empty states (no puzzle today, no plays yet, etc.)
- Error states + loading states
- Mobile responsiveness pass
- Railway deploy config (`railway.json`, env vars docs in README)

---

## 12. Open / Deferred

- **Streak system details:** simple "consecutive days played" — but does a *loss* break the streak, or only a *miss* (no play at all)? Default assumption: only missing a day breaks the streak. Confirm during build.
- **Timezone edge cases:** the puzzle rolls over at midnight UTC, but a player's local "today" might disagree. Player-facing UI should show "Today's puzzle" clearly and base the rollover countdown on UTC.
- **Catalog growth:** as the diagnosis dictionary grows, autocomplete may need fuzzy matching (Fuse.js). Out of scope for v1; basic substring + alias match is sufficient.
- **Backups:** Railway Postgres has its own backup options; no app-level concern. Media volume backups are manual.
