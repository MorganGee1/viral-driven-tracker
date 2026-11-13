# Viral Driven Tracker

Creators make their own Amazon tracking links. The team sees revenue per brand, product, creator, account and placement.
Built from the "In-House Tracking Software" doc (Basic tab). Operated by Viral Driven Marketing Agency - FZCO.

- Public site (what Amazon's reviewer sees): `/`, `/services`, `/about`, `/contact`, `/privacy`, `/terms`
- App (Discord sign-in only): `/app`
- Invite links: `/join/<code>`

Stack: Next.js 15, Supabase (Postgres + Discord sign-in), Tailwind 4, Vercel.

## How it works

| Who | What they do |
| --- | --- |
| Owner | The first person to sign in. Sees everything, adds team members (team invite link or the Team page). |
| Team | Sees everything. Adds brands, products and Amazon pages. Creates invite links. Exports sales. |
| Creator | Joins a product through an invite link, signs in with Discord, makes links, sees only their own links and numbers. |

1. Team adds a brand, then a product under it with its Amazon page.
2. Team creates an invite link on the product's Creators tab and sends it out.
3. Creator opens it, signs in with Discord, lands on the product.
4. Creator makes one link per account and placement (Bio, ManyChat, Post description, Story, Other).
5. Creator copies the plain Amazon address (tracking tag on the end, no redirect) and posts it.
6. Sales come in per link. Team sees them by brand, product, creator, account, placement and link.

Links are never deleted, only archived, so an old link in a bio keeps counting and past sales stay in the reports.

## Setup (about 15 minutes)

### 1. Supabase
1. supabase.com > New project > name `viral-driven-tracker`.
2. SQL Editor > New query > paste all of `supabase/schema.sql` > Run.
   It is safe to run again, and it upgrades a database made with the 9 Nov version without losing anything.
3. Project Settings > API: copy the **Project URL**, the **anon public** key and the **service_role** key.

### 2. Discord sign-in
1. discord.com/developers/applications > New Application > `Viral Driven Tracker`.
2. OAuth2 > copy the **Client ID**, Reset Secret > copy the **Client Secret**.
3. Supabase > Authentication > Providers > Discord > enable, paste both. Copy the **Callback URL** it shows.
4. Discord > OAuth2 > Redirects > add that callback > Save.
5. Supabase > Authentication > URL Configuration:
   - Site URL: `https://tracker.viraldrivenmedia.com`
   - Redirect URLs: `https://tracker.viraldrivenmedia.com/**`, `https://*.vercel.app/**`, `http://localhost:3000/**`

### 3. Vercel
1. vercel.com/new > import `MorganGee1/viral-driven-tracker`.
2. Environment variables (see `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://tracker.viraldrivenmedia.com`
3. Deploy, then Settings > Domains > add `tracker.viraldrivenmedia.com`.

The public site loads with no environment variables at all, so the Amazon submission never depends on Supabase being up.

### 4. Sign in first
**The first person to sign in with Discord becomes the owner.** Do that yourself straight after deploying, before sharing any link.
(If someone beat you to it: Supabase > SQL Editor > `update public.profiles set role = 'owner' where discord_username = 'your_discord_name';`)

### 5. Add a brand, a product and an invite link
Home > Add a brand > Add a product (name + Amazon page) > Creators tab > Invite creators > copy the link.

## Where the numbers come from

Numbers are Amazon Attribution numbers: clicks, detail page views, add to carts, purchases, units, total sales (brand halo included) and Brand Referral Bonus (team only). Days are Los Angeles days. Amazon restates recent days for up to 31 days, so every pull covers the last 31 days and each page shows a "data through" date.

**Until the Amazon Ads API is approved (report upload):**
1. A new link shows "not tracked yet". In Amazon Ads > Measurement and reporting > Amazon Attribution, make an ad group named with the link's ID (shown on the link in Tracking links), and paste the tagged address Amazon gives you into "Rename, tag or archive" on that link.
2. Download the Attribution report by day, split by ad group, for the last 31 days. Product > Import report > upload. Uploading the same days again replaces them.

**Once the Amazon Ads API is approved:** see "Amazon Ads API" below. Links get tagged the moment they are made and numbers sync every night.

## Who can see what (enforced in the database, not just the screens)

- Creators: their own profile, links and numbers. Not other creators, not brand totals, not invite links, not Brand Referral Bonus.
- A creator can rename, annotate or archive their own link. They cannot change its account, placement, Amazon page or tag.
- Team: everything, except team invite links and role changes, which are owner only.
- Nobody can delete a link.

`supabase/schema.sql` section 6 holds these rules.
