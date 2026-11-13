import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Privacy() {
  return (
    <div className="prose-legal mx-auto max-w-3xl px-5 py-16 md:py-24">
      <div className="label mb-3">Legal</div>
      <h1 className="text-4xl font-extrabold tracking-tight">Privacy policy</h1>
      <p className="font-mono text-xs text-ink-3">Last updated {SITE.updated}</p>

      <p>
        This policy explains how {SITE.company} (&quot;we&quot;, &quot;us&quot;), operator of {SITE.name} at {SITE.url}, collects and uses personal data. Our registered office is {SITE.address}. You can contact us at {SITE.email}.
      </p>

      <h2>1. Who this covers</h2>
      <ul>
        <li><strong>Visitors</strong> to this website.</li>
        <li><strong>Clients</strong>: brands and their staff who engage our services.</li>
        <li><strong>Creators</strong>: people who sign in to the platform to create tracking links for a client&apos;s products.</li>
      </ul>

      <h2>2. What we collect</h2>
      <h3>Visitors</h3>
      <p>Standard server logs (IP address, browser, pages requested, timestamps) kept by our hosting provider for security and reliability. We do not run advertising trackers on the public site.</p>
      <h3>Creators and client users</h3>
      <ul>
        <li>Your Discord user ID, username, display name and avatar, provided by Discord when you sign in. We do not receive your Discord password, email or messages.</li>
        <li>The tracking links you create, the platform, account name and placement you choose for each, any notes you add, and when you created them.</li>
        <li>Performance data for those links from Amazon Attribution: clicks, detail page views, add to carts, purchases, units and sales. This is aggregate data about shoppers&apos; actions; we do not receive the identity of any shopper.</li>
        <li>Your role on the platform (owner, team or creator) and which products you have joined.</li>
      </ul>
      <h3>Clients</h3>
      <ul>
        <li>Business contact details and correspondence.</li>
        <li>Amazon Ads account authorisation tokens, where a client connects an account to the platform. Tokens are stored encrypted and used only to read Attribution reports and manage Attribution tags for that client.</li>
      </ul>

      <h2>3. Why we use it</h2>
      <ul>
        <li>To run the platform: sign you in, show you your links and the sales they drove.</li>
        <li>To provide our services to clients: reporting which creators and placements drive sales, and managing creator payments where the client has engaged us to do so.</li>
        <li>To respond to enquiries and manage our client relationships.</li>
        <li>To keep the service secure and to comply with law.</li>
      </ul>
      <p>Where UK or EU data protection law applies, our legal bases are performance of a contract (for clients and creators using the platform) and legitimate interests (running and securing the service, responding to enquiries).</p>

      <h2>4. Who we share it with</h2>
      <ul>
        <li><strong>Clients.</strong> Managers at a client brand can see the names, links and sales figures of creators working on that brand&apos;s products. Creators cannot see other creators&apos; data.</li>
        <li><strong>Amazon.</strong> Attribution tags are created in Amazon Ads. Amazon&apos;s own privacy notice governs what Amazon collects from shoppers. We receive only aggregate reports back.</li>
        <li><strong>Service providers.</strong> Supabase (database and authentication), Vercel (hosting), Discord (sign in). Each processes data on our instructions.</li>
        <li>Authorities, where required by law.</li>
      </ul>
      <p>We do not sell personal data.</p>

      <h2>5. International transfers</h2>
      <p>We are based in the United Arab Emirates and our service providers operate in the United States and the European Union. Where we transfer data of UK or EU residents, we rely on standard contractual clauses or the providers&apos; equivalent safeguards.</p>

      <h2>6. Retention</h2>
      <p>Platform accounts and link data are kept while the relevant product is active and for up to 24 months afterwards for reporting and payment reconciliation, then deleted or anonymised. Client correspondence is kept for the duration of the relationship plus the period required for accounting and legal purposes. You can ask us to delete your creator account at any time.</p>

      <h2>7. Your rights</h2>
      <p>Depending on where you live, you may have the right to access, correct, delete or restrict the use of your personal data, to object to processing, and to data portability. Email {SITE.email} and we will respond within one month. UK and EU residents may also complain to their supervisory authority.</p>

      <h2>8. Cookies</h2>
      <p>The platform (under /app) uses strictly necessary cookies to keep you signed in. The public site sets no analytics or advertising cookies.</p>

      <h2>9. Children</h2>
      <p>The platform is for people aged 18 and over. We do not knowingly collect data from anyone under 18.</p>

      <h2>10. Changes</h2>
      <p>We will post any changes here and update the date at the top. Material changes affecting platform users will be announced in the platform.</p>

      <h2>11. Contact</h2>
      <p>{SITE.company}, {SITE.address}. Email: {SITE.email}.</p>
    </div>
  );
}
