import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) return {};

  return {
    title: `${post.title} — MRR.fyi`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://mrr.fyi/blog/${post.slug}`,
      siteName: "MRR.fyi",
      type: "article",
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    alternates: {
      canonical: `https://mrr.fyi/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    url: `https://mrr.fyi/blog/${post.slug}`,
    publisher: {
      "@type": "Organization",
      name: "MRR.fyi",
      url: "https://mrr.fyi",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://mrr.fyi/blog/${post.slug}`,
    },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <a
        href="/blog"
        className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] mb-8 transition-colors"
      >
        &larr; Back to blog
      </a>

      <header className="mb-10">
        <p className="text-xs text-[var(--text-dim)] mono mb-3">
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1
          className="text-4xl leading-tight mb-4"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          {post.title}
        </h1>
        <p className="text-base text-[var(--text-muted)] leading-relaxed max-w-2xl">
          {post.description}
        </p>
      </header>

      <article className="prose-blog">
        <MDXRemote source={post.content} />
      </article>

      <footer className="mt-12 pt-8 border-t border-[var(--border)]">
        <div className="rounded-xl border border-[var(--amber)] bg-[var(--amber-glow)] p-6 text-center">
          <p
            className="text-xl mb-2"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Put your MRR on the record.
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-5 max-w-sm mx-auto">
            Free profile, Pro badge, MRR history chart. Takes 60 seconds.
            7-day free trial on Pro.
          </p>
          <a
            href="/submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--amber)] text-black font-semibold rounded-md hover:bg-amber-400 transition-all hover:scale-[1.02] text-sm"
          >
            Get Your Pro Profile →
          </a>
          <p className="text-xs text-[var(--text-dim)] mt-3">
            Already listed?{" "}
            <a href="/" className="hover:text-[var(--text-muted)] transition-colors">
              Browse profiles
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
