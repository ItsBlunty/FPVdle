# FPVdle

A daily FPV troubleshooting puzzle game. Players are given a series of clues about a malfunctioning quadcopter and must diagnose the problem from an autocomplete list of possible issues.

## Quick start (local dev)

```bash
# 1. Install deps
npm install

# 2. Configure env
cp .env.example .env.local
# Edit .env.local — at minimum set DATABASE_URL to your local Postgres
# Generate an admin password hash:
npm run hash-password -- 'your-password'
# Paste the result into ADMIN_PASSWORD_HASH

# 3. Run the migrations + seed the test puzzle
# First time only — creates prisma/migrations/<timestamp>_init/. Commit this.
npx prisma migrate dev --name init
npm run seed

# 4. Run the dev server
npm run dev
```

Visit `http://localhost:3000` for the player game and `http://localhost:3000/admin/login` for the admin panel.

## Tech stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **PostgreSQL** via Prisma
- **JWT** in HTTP-only cookie for admin auth
- **Local filesystem** for media (mounted volume in production)

## Deploying to Railway

1. Push the repo to GitHub.
2. Create a new Railway project from the repo.
3. Add the **Postgres** plugin — `DATABASE_URL` is wired automatically.
4. Add a **Volume** to the web service, mounted at `/data`.
5. Set env vars on the web service:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD_HASH` (run `npm run hash-password -- 'pw'` locally)
   - `JWT_SECRET` (e.g. `openssl rand -base64 48`)
   - `MEDIA_DIR=/data/media`
6. Deploy. The build runs `prisma migrate deploy && next build` automatically.

> **First-time deploy:** make sure you've committed `prisma/migrations/` from your local `prisma migrate dev --name init` step. `prisma migrate deploy` needs those migration files to set up the production database.

## Project layout

See `FPVdle-spec.md` for the full architectural spec.

```
app/         Next.js routes (player + admin + API)
components/  React components
lib/         DB, auth, puzzle, storage helpers
prisma/      Schema, migrations, seed
seed-assets/ Placeholder media copied into /data on first run
```

## Admin

- The first time you run, set `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` in `.env.local`.
- Log in at `/admin/login`.
- From there you can manage diagnoses and puzzles.
