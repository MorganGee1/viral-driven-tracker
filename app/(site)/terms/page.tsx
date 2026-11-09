import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of service" };

export default function Terms() {
  return (
    <div className="prose-legal mx-auto max-w-3xl px-5 py-16 md:py-24">
      <div className="label mb-3">Legal</div>
      <h1 className="text-4xl font-extrabold tracking-tight">Terms of service</h1>
      <p className="font-mono text-xs text-ink-3">Last updated {SITE.updated}</p>

      <p>These terms govern use of the {SITE.name} website and platform (the &quot;Service&quot;) operated by {SITE.company} (&quot;we&quot;, &quot;us&quot;), {SITE.address}. By using the Service you agree to them.</p>

      <h2>1. The Service</h2>
      <p>The Service provides Amazon Attribution setup, creator tracking links and sales reporting for brands selling on Amazon, together with related creator management and content services agreed separately in writing with each client. Access to the platform is by invitation of a client or of us.</p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You sign in with Discord. You are responsible for keeping your Discord account secure.</li>
        <li>You must be 18 or over.</li>
        <li>Managers may be given access to a client&apos;s data as part of that client&apos;s engagement. Creators see only their own links and results.</li>
        <li>We may suspend or remove accounts that misuse the Service.</li>
      </ul>

      <h2>3. Creators</h2>
      <ul>
        <li>Links generated in the platform are for use in content agreed with the client brand. Do not place them anywhere the client has not approved, and do not click them yourself or encourage artificial clicks.</li>
        <li>Content you post must comply with the platform you post on, with applicable advertising law, and with any disclosure requirements for paid or incentivised content.</li>
        <li>Any payment for your content or results is governed by your separate agreement with the client or with us, not by these terms.</li>
      </ul>

      <h2>4. Clients</h2>
      <ul>
        <li>Where you connect an Amazon Ads account, you authorise us to create and manage Amazon Attribution tags and to read Attribution reports for that account, and you confirm you are permitted to grant that access.</li>
        <li>You are responsible for your compliance with Amazon&apos;s policies, including the Amazon Ads and Brand Referral Bonus terms.</li>
        <li>Fees, scope and term are set out in your service agreement or order form.</li>
      </ul>

      <h2>5. Data</h2>
      <p>Our <a href="/privacy" className="text-accent">privacy policy</a> explains what we collect and why. Sales and attribution figures are supplied by Amazon and shown as received; Amazon&apos;s reporting may lag or be revised and we do not guarantee it.</p>

      <h2>6. Acceptable use</h2>
      <p>Do not attempt to access data you are not assigned to, interfere with the Service, reverse engineer it, or use it for anything unlawful.</p>

      <h2>7. Intellectual property</h2>
      <p>The Service, its design and software are ours. Client data stays the client&apos;s. We may use aggregated, non-identifying statistics to improve the Service.</p>

      <h2>8. Availability and liability</h2>
      <p>The Service is provided as is. We aim for high availability but do not guarantee it. To the fullest extent permitted by law we exclude liability for indirect or consequential loss, and our total liability to any client is limited to the fees paid by that client in the 12 months before the claim. Nothing in these terms limits liability that cannot be limited by law.</p>

      <h2>9. Termination</h2>
      <p>Creators may stop using the Service at any time and may ask us to delete their account. Client engagements end as set out in the service agreement. Sections 5 to 10 survive termination.</p>

      <h2>10. Governing law</h2>
      <p>These terms are governed by the laws of the Emirate of Dubai and the federal laws of the United Arab Emirates. Disputes go to the courts of Dubai, unless your service agreement says otherwise.</p>

      <h2>11. Contact</h2>
      <p>{SITE.company}, {SITE.address}. Email: {SITE.email}.</p>
    </div>
  );
}
