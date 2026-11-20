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
3. Project Settings > API keys: copy the **Project URL** and the **publishable** key (older projects call it the anon public key). Both are safe to expose. The secret key is only needed later, for the Amazon Ads API.

### 2. Discord sign-in
1. discord.com/developers/applications > New Application > `Viral Driven Tracker`.
2. OAuth2 > copy the **Client ID**, Reset Secret > copy the **Client Secret**.
3. Supabase > Authentication > Providers > Discord > enable, paste both. Copy the **Callback URL** it shows.
4. Discord > OAuth2 > Redirects > add that callback > Save.
5. Supabase > Authentication > URL Configuration:
   - Site URL: `https://app.viraldrivenmedia.com`
   - Redirect URLs: `https://app.viraldrivenmedia.com/**`, `https://*.vercel.app/**`, `http://localhost:3000/**`

### 3. Vercel
1. vercel.com/new > import `MorganGee1/viral-driven-tracker`.
2. Environment variables (see `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the publishable key)
   - `NEXT_PUBLIC_SITE_URL` = `https://app.viraldrivenmedia.com`
3. Deploy, then Settings > Domains > add `app.viraldrivenmedia.com`.

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
- Signed-out visitors see nothing, with two exceptions: the invite page (what the invite is for) and the client connect page (the brand's name and country).

`supabase/schema.sql` section 6 holds these rules.

## Amazon Ads API (switch on after Amazon approves access)

The code for this is in the repo and has been run end to end against a local stand-in for Amazon.
**It has never run against Amazon itself**, because API access had not been approved when it was written.
Expect a short fix-up the first time it meets real data (most likely the field names in report rows). `lib/amazon.ts` is the only file that talks to Amazon.

What it does once switched on:
- Brand page > Amazon connection > **Connect Amazon Ads**. The account owner signs in with Login with Amazon and approves access. One connection covers every product of the brand, which is why it sits on the brand page and not in a product's Settings.
- The tracker finds the brand's Amazon Attribution advertiser (asks you to pick if the login sees several), fetches the tag template, and tags every link that was waiting.
- Every new link is tagged the moment a creator makes it. Each link is its own ad group in Amazon, so sales and Brand Referral Bonus come back per link.
- Every night (and on **Sync now**) it pulls the last 31 days and replaces those days.

It calls only these: `GET /v2/profiles`, `GET /attribution/advertisers`, `GET /attribution/publishers`, `GET /attribution/tags/nonMacroTemplateTag`, `POST /attribution/report`.

To switch it on:
1. In the Login with Amazon security profile, add the allowed return URL `https://app.viraldrivenmedia.com/api/amazon/callback`.
2. Add these in Vercel > Environment variables, then redeploy:
   - `AMAZON_CLIENT_ID`, `AMAZON_CLIENT_SECRET` (from the Login with Amazon security profile)
   - `AMAZON_TOKEN_KEY` (any long random string; it encrypts the stored Amazon token, so never change it once brands are connected)
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase > Project Settings > API)
   - `CRON_SECRET` (any long random string; lets Vercel run the nightly sync)
3. Run `supabase/schema.sql` again if you have not since this was added.

Until those keys exist, the Connect button does not show and everything works on report uploads.

### Client connect link (the client holds the Amazon login)

When someone outside the team holds a brand's Amazon Ads login, send them a link instead of adding them to the tracker.

1. Brand page > Amazon connection > **Make a connect link** > Copy.
2. Send it to whoever holds that brand's Amazon login. They open it, press **Continue with Amazon**, sign in and approve.
3. The brand is now connected. If their login sees more than one Amazon Attribution advertiser, the brand page asks you to pick.

What the client sees: one page with the brand's name and country and what the tracker does with the access. No Discord, no tracker account, nothing of the app.

Rules:

- A link works once, lasts 14 days, and can be switched off. Making a new link switches the old one off.
- Only the team can make, see or switch off links (enforced in the database). Creators cannot.
- The public page and the Amazon routes look the link up on the server by its code. The link is the only permission, and the brand always comes from the link, never from the browser.
- If a try through the link fails, the client gets a plain message and the real reason shows on the brand page under the link.
- Needs `supabase/schema.sql` run again (it adds the `amazon_connect_links` table).

One thing to know before sending it to a client: Amazon's approval screen shows the name of the Login with Amazon app the brand connects through. Client brands go through the partner app (next section), which is the one Amazon approved for connecting other companies' accounts.

### Two Amazon apps: own brand and clients

The site can hold the keys of two Login with Amazon apps at once. Every brand connects through exactly one of them.

| App | Keys in Vercel | Who connects through it |
| --- | --- | --- |
| Own-brand app (`direct`) | `AMAZON_CLIENT_ID`, `AMAZON_CLIENT_SECRET` | MyCompanion. The app Amazon approved for the company's own brand. |
| Partner app (`partner`) | `AMAZON_PARTNER_CLIENT_ID`, `AMAZON_PARTNER_CLIENT_SECRET` | Every other brand, and every brand added from now on. The app Amazon approved for client accounts. |

- `brands.amazon_app` says which app a brand connects through. New brands get `partner`. The Amazon connection box on the brand page shows which one it is.
- `amazon_connections.app` records which app a stored connection came from. Syncs always use that app's keys, because Amazon only takes a token back from the app it was given to.
- There is no fallback between the two. If a brand's app has no keys on the site, its Connect button and connect link do not show, and the brand page names the keys that are missing.
- Both apps need the allowed return URL `https://app.viraldrivenmedia.com/api/amazon/callback` in their Login with Amazon security profile.
- To move a brand to the other app: `update public.brands set amazon_app = 'direct' where name = '...';` (or `'partner'`), then press Reconnect on the brand page. The old connection keeps syncing until then.

## Deep links (LinkTwin)

Optional. A deep link opens the Amazon app on a phone, where the shopper is already signed in, instead of the browser inside Instagram or TikTok.

1. In Vercel > Environment variables add `LINKTWIN_API_KEY` (LinkTwin dashboard > API), then redeploy. `LINKTWIN_DOMAIN` is optional, for a branded domain already added in LinkTwin.
2. In the tracker open a product > Settings > Deep links > Switch deep links on.

What happens after that:

- Every tracked, live link of that product gets a LinkTwin link pointing at its full tagged Amazon address. Creators copy that one. The plain Amazon link stays on the card as a fallback.
- A link gets its deep link the moment its Amazon tag is attached. If the tag or the Amazon page address changes later, the same deep link is moved, so links already posted keep working.
- If LinkTwin does not answer, the link is still made with the plain address, and Settings shows a button to make the missing deep links.
- Only the team and the server can write a deep link. Creators cannot change their own.
- Links that come out tagged the moment a creator makes them (once a brand has a tag template) get their deep link instantly only if `SUPABASE_SERVICE_ROLE_KEY` is set. Without it they wait for the next team action or the nightly job.
- Switching deep links off sends creators back to the plain Amazon link. Deep links already posted keep working.

## Security

Checked on 20 November 2026 against the live project. What holds it together:

- **Who can read what is decided in the database**, not the screens (`supabase/schema.sql` section 6). A signed-out visitor has no permission on any table. A creator reads and edits only their own links and numbers. Only the owner changes roles.
- **Amazon tokens** are stored encrypted (AES-256-GCM, key in `AMAZON_TOKEN_KEY`) in a table only the server can reach. A token is useless without that key and the Amazon app's secret, and both live only in Vercel.
- **Secrets** are Vercel environment variables marked sensitive. None are in this repository or its history. Only the two `NEXT_PUBLIC_` values reach the browser, and they are meant to.
- **Invite and connect links** are unguessable (64-bit and 160-bit codes). Connect links work once and expire.
- **The Amazon sign-in** carries a random state in an httpOnly cookie, so nobody can finish a connection they did not start.
- **Messages in the address** (`?ok=` / `?error=`) are signed (`lib/flash.ts`) and the middleware drops any the app did not write, so a hand-made link cannot put words in the app's mouth. `FLASH_SECRET` is optional: without it the signature uses `CRON_SECRET`.
- **Headers** on every page (`next.config.ts`): no framing by other sites, no content-type guessing, forms post only to this site, a tight referrer, and no camera, microphone, location or payment prompts.

Things only the owner can do, outside the code: keep two-step sign-in on for Vercel, Supabase, GitHub, Discord and Amazon; keep email sign-in switched off in Supabase (Discord only); switch creator invite links off when onboarding is done.

## Design

Dark, with one purple accent, used sparingly. The signed-in app is graphite and off-white. The accent is kept for one thing per page (the sales line on a product's Overview) and the logo. Bars, shares and the active tab are white and grey. Teal means good (connected, saved, up), amber needs a look, rose is wrong or down. No gradients or glows. Type is IBM Plex Sans with Plex Mono for figures, and names are joined to their numbers by dotted receipt lines. The one bright object is the paper receipt in the public hero. The design pass used the unslop skill by Damir Sokolovsky ([@heydamir](https://x.com/heydamir), https://github.com/heydamir/unslop, CC BY 4.0).

A product's Overview answers three questions in order: how much was sold (the total, against the same days of the month before, with sales per day), where it came from (by placement and by platform), and who sold it (creators ranked, then the individual links). `lib/overview.ts` builds those numbers and has no database in it. `components/app/Overview.tsx` lays them out.
