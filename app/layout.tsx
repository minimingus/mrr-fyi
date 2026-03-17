import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
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
  title: "MRR.fyi — Public Indie Revenue Leaderboard",
  description:
    "See who's making money building in public. Real MRR from real indie hackers, updated live.",
  openGraph: {
    title: "MRR.fyi — Public Indie Revenue Leaderboard",
    description: "Real MRR from real indie hackers. Build in public.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSerif.variable} ${dmSans.variable} ${jetbrains.variable}`}>
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
                indie revenue leaderboard
              </span>
            </a>
            <div className="flex items-center gap-1">
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
