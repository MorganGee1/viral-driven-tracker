import type { NextConfig } from "next";

/**
 * Headers sent with every page.
 * - The site may never be shown inside another site's frame (stops a page being laid over ours to steal clicks).
 * - Browsers must not guess file types, and only send our address (never the full link, which can carry an
 *   invite or connect code) to other sites.
 * - Forms may only post back to this site, and <base> and plugins are off.
 * - Camera, microphone, location and payment prompts are switched off: nothing here uses them.
 * Strict-Transport-Security is added by Vercel on the live domain.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { remotePatterns: [{ protocol: "https", hostname: "cdn.discordapp.com" }] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
export default nextConfig;
