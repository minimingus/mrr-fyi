import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — MRR.fyi",
  description:
    "Guides and insights for indie hackers tracking MRR, building in public, and growing bootstrapped SaaS businesses.",
  openGraph: {
    title: "Blog — MRR.fyi",
    description:
      "Guides and insights for indie hackers tracking MRR and building in public.",
    url: "https://mrr.fyi/blog",
    siteName: "MRR.fyi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — MRR.fyi",
    description: "Guides and insights for indie hackers tracking MRR.",
  },
  alternates: {
    canonical: "https://mrr.fyi/blog",
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] mb-8 transition-colors"
      >
        &larr; Back to leaderboard
      </a>

      <div className="mb-12">
        <h1
          className="text-4xl mb-3"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Blog
        </h1>
        <p className="text-[var(--text-muted)] max-w-lg">
          Guides for indie hackers tracking MRR, building in public, and growing
          bootstrapped businesses.
        </p>
      </div>

      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.slug} className="group">
            <a href={`/blog/${post.slug}`} className="block space-y-2">
              <p className="text-xs text-[var(--text-dim)] mono">
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h2
                className="text-xl group-hover:opacity-70 transition-opacity"
                style={{ fontFamily: "var(--font-dm-serif)" }}
              >
                {post.title}
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {post.description}
              </p>
              <span className="text-xs text-[var(--text-dim)] group-hover:text-[var(--text-muted)] transition-colors">
                Read more &rarr;
              </span>
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
