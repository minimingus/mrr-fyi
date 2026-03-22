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

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
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
        <p className="text-sm text-[var(--text-muted)]">
          Track your own MRR on{" "}
          <a
            href="/"
            className="underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            MRR.fyi — the public indie revenue leaderboard
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
