# Game Hub

A small, password-gated web hub with real-time two-player games, a few personal pages,
and an optional AI chat companion. Built with **React + Vite + TypeScript + Tailwind**,
**Supabase** (realtime + DB + storage + edge functions), and deployed on **GitHub Pages**.

---

## ✨ What's inside

- **🔒 Password gate** — `perfectaarya` (client-side; see the honest caveats below).
- **⏱️ Calendar** — live "together since midnight Oct 15 2024" counter to the second,
  montheversary number, and a countdown to the next 15th.
- **🎮 Games** (real-time, room-code based): Battleship, Connect 4, Snakes & Ladders,
  Ludo, Draw a Perfect Heart (accuracy-scored), and Phrase Chain (the linked-word game).
- **💌 Love Notes**, **📸 Memory Timeline** (with photos), **✨ Date Ideas / Bucket List**,
  **🫶 Reasons I Love You** jar, **🍿 Rom-Com Club** (watchlist + movie-night picker).
- **🤖 Chat with AI-Me** — text + voice, powered by Claude + ElevenLabs, keys kept
  server-side in Supabase edge functions.

> **Demo mode:** With no Supabase configured the whole app still runs — data lives in
> your browser and games sync across two tabs. Add Supabase to play across devices and
> turn on the AI.

---

## 🏃 Run locally

```bash
npm install
npm run dev          # http://localhost:5173
```

Optional, to enable the backend locally, create `.env.local`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

---

## ☁️ Supabase setup (games, shared data, AI)

1. Create a free project at [supabase.com](https://supabase.com).
2. **Database:** open the SQL editor and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   This creates all tables, the `memories` storage bucket, RLS policies, and realtime.
3. **Frontend env:** copy the project URL + anon key into `.env.local` (and into the
   GitHub repo secrets later). The anon key is **meant to be public** — it's guarded by RLS.

### AI companion (text)

```bash
npm i -g supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase functions deploy ai-chat
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...    # required
supabase secrets set AI_MODEL=claude-haiku-4-5       # optional (cheaper). Use claude-opus-4-8 for best persona quality.
```

Then open **Chat with AI-Me → ✍️ teach me your voice** and paste a handful of real
messages you'd actually send. The function feeds these to Claude as a style guide — the
more you add, the more it sounds like you. No fine-tuning required.

### Voice (sounds like me)

1. In [ElevenLabs](https://elevenlabs.io), create an **Instant Voice Clone** from a few
   minutes of your recorded audio. Copy the **Voice ID**.
2. Deploy + configure:

```bash
supabase functions deploy ai-tts
supabase secrets set ELEVENLABS_API_KEY=...
supabase secrets set ELEVENLABS_VOICE_ID=...
supabase secrets set ELEVENLABS_MODEL=eleven_multilingual_v2   # optional
```

Replies now have a **🔊 speak** button (and an auto-speak toggle).

---

## 🚀 Deploy to GitHub Pages

1. Push this folder to a new GitHub repo named **`game-hub`** (the app uses a relative
   base path + hash routing, so it works under any repo name).
2. **Settings → Secrets and variables → Actions** → add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`.
3. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
4. Push to `main`. The [`deploy.yml`](.github/workflows/deploy.yml) workflow builds and
   publishes automatically. Your site: `https://YOUR-USERNAME.github.io/game-hub/`.

---

## 🛠️ Customising

- **Theme / colours:** `src/index.css` (`@theme` block — rose/blush + sea-blue).
- **Start date, names, the two people:** `src/lib/config.ts`.
- **Sidebar pages:** `src/navConfig.ts`.
- **Password:** it's stored as a SHA-256 hash in `src/auth/Gate.tsx`. To change it, run
  `node -e "console.log(require('crypto').createHash('sha256').update('NEWPASS').digest('hex'))"`
  and paste the result into `PASSWORD_HASH`.

---

## ⚠️ Honest caveats

- **The password is a casual gate, not real security.** On a free GitHub Pages repo the
  source is public, so a determined person could find the hash/flow. It keeps strangers
  out — that's the goal. Want true privacy? Use a **private** repo (needs GitHub Pro) or
  a host like Cloudflare/Netlify with real access control.
- **Supabase anon key is public by design** (RLS-guarded). The **secret** AI/voice keys
  live only in Supabase function secrets — never in the frontend bundle.
- **Free Supabase projects pause after ~7 days idle.** A quick "Resume" in the dashboard
  brings games back. Use the hub regularly and it stays awake.
- **Battleship is honor-system:** ship positions live in shared room state, so don't peek
  in devtools 😉.
- **ElevenLabs voice has a per-use cost.** Text chat (Claude) is very cheap, especially
  with `claude-haiku-4-5`.
