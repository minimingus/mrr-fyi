import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Footer } from "@/components/Footer";

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "MRR.fyi — Real MRR Profiles for Indie Founders",
  description:
    "Your public MRR profile — the social proof page every indie hacker needs. Real revenue from real founders building in public.",
  metadataBase: new URL("https://mrr.fyi"),
  openGraph: {
    title: "MRR.fyi — Real MRR Profiles for Indie Founders",
    description: "Your public MRR profile — the social proof page every indie hacker needs.",
    url: "https://mrr.fyi",
    siteName: "MRR.fyi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MRR.fyi — Real MRR Profiles for Indie Founders",
    description: "Your public MRR profile — the social proof page every indie hacker needs.",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MRR.fyi",
    url: "https://mrr.fyi",
    description:
      "Track and compare MRR from indie hackers building in public. See real revenue data from founders sharing their journey transparently.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://mrr.fyi/?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MRR.fyi",
    url: "https://mrr.fyi",
    description: "Public MRR profiles for indie founders building in public.",
    sameAs: ["https://x.com/mrrfyi"],
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSerif.variable} ${dmSans.variable} ${jetbrains.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
        <Script
          defer
          data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      )}
      <body className="antialiased">
        <nav className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 group">
              <span
                className="text-[var(--amber)] font-bold mono text-sm tracking-wider"
                style={{ fontFamily: "var(--font-jetbrains)" }}
              >
                MRR.fyi
              </span>
              <span className="text-[var(--text-dim)] text-xs">
                MRR profiles
              </span>
            </a>
            <div className="flex items-center gap-1">
              <a
                href="/changelog"
                className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                Changelog
              </a>
              <a
                href="/api-docs"
                className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                API
              </a>
              <a
                href="/pricing"
                className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                Pricing
              </a>
              <a
                href="/submit"
                className="px-3 py-1.5 text-xs bg-[var(--amber)] text-black font-semibold rounded-md hover:bg-amber-400 transition-colors"
              >
                Submit Revenue
              </a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
