# Viral Driven Tracker

Amazon attribution and creator tracking platform, operated by Viral Driven Marketing Agency - FZCO.

- Public site (what Amazon's Partner Network reviewer sees): `/`, `/services`, `/about`, `/contact`, `/privacy`, `/terms`
- App (Discord login): `/app`

Stack: Next.js 15, Supabase (Postgres + auth), Tailwind 4, Vercel.

## Setup (about 15 minutes)

### 1. Supabase
1. supabase.com → New project → name `viral-driven-tracker`, region closest to you, save the DB password somewhere.
2. SQL Editor → New query → paste the whole of `supabase/schema.sql` → Run.
3. Project Settings → API. You need **Project URL**, **anon public** key and **service_role** key.

### 2. Discord login
1. discord.com/developers/applications → New Application → `Viral Driven Tracker`.
2. OAuth2 → copy **Client ID**, Reset Secret → copy **Client Secret**.
3. Supabase → Authentication → Providers → Discord → enable, paste both. Copy the **Callback URL** it shows (`https://xxxx.supabase.co/auth/v1/callback`).
4. Discord → OAuth2 → Redirects → Add Redirect → paste that callback → Save Changes.
5. Supabase → Authentication → URL Configuration:
   - Site URL: `https://tracker.viraldrivenmedia.com`
   - Redirect URLs: `https://tracker.viraldrivenmedia.com/auth/callback`, `https://*.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`

### 3. Vercel
1. vercel.com/new → Import `MorganGee1/viral-driven-tracker`.
2. Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://tracker.viraldrivenmedia.com`
3. Deploy. Then Settings → Domains → add `tracker.viraldrivenmedia.com`. The domain is already in your Vercel account, so it just needs confirming.

The public site works even with no env vars set, so the Amazon submission never depends on Supabase being up.

### 4. Make yourself a manager
Sign in once with Discord, then in Supabase SQL Editor:

```sql
update public.profiles set role = 'manager' where username = 'Morgan';
```

(Match the username shown bottom-left in the app.) After that, promote others from Team.

### 5. Add a brand and a campaign
Home → Add a brand → Add a campaign (brand, name, Amazon product URL). Creators who sign in see it immediately and can make links.

## Getting sales numbers in

Until the Amazon Ads API is approved, numbers come from the Attribution report:

1. Amazon Ads → Measurement & Reporting → Amazon Attribution → create an ad group per link. Name it with the link's 8-character id (shown under each link in Tracking links), or paste the link's generated tag into **Save tag** on the link.
2. Weekly, download the campaign report CSV → campaign → **Import report** → upload. Re-uploading the same days overwrites them.

When API access lands, add a cron route that calls the Attribution report endpoint and upserts into `link_stats`. Nothing else changes.

## Amazon Partner Network submission

Submit `https://tracker.viraldrivenmedia.com` as the company website. The site:
- loads publicly with no login
- names Viral Driven Marketing Agency - FZCO as the operating entity (footer, About)
- describes advertising services to other advertisers (Services, homepage)
- has Privacy and Terms pages and a contact page

## Local dev
```
cp .env.example .env.local   # fill in
npm install
npm run dev
```
