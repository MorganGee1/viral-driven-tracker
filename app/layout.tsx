import type { Metadata } from "next";
import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description:
    "Viral Driven Tracker is the Amazon attribution and creator measurement platform from Viral Driven Marketing Agency - FZCO. We set up Amazon Attribution for brands, give every creator their own tagged links, and report the sales each creator drives.",
  openGraph: {
    title: `${SITE.name}: ${SITE.tagline}`,
    description: "Amazon Attribution setup, per-creator tracking links and sales reporting for brands selling on Amazon.",
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
  },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
