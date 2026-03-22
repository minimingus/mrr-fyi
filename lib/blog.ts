import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  description: string;
  content: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
}

export function getAllPosts(): BlogPostMeta[] {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((filename) => {
    const filepath = path.join(BLOG_DIR, filename);
    const raw = fs.readFileSync(filepath, "utf-8");
    const { data } = matter(raw);

    return {
      slug: data.slug as string,
      title: data.title as string,
      date: data.date as string,
      description: data.description as string,
    };
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

  for (const filename of files) {
    const filepath = path.join(BLOG_DIR, filename);
    const raw = fs.readFileSync(filepath, "utf-8");
    const { data, content } = matter(raw);

    if (data.slug === slug) {
      return {
        slug: data.slug as string,
        title: data.title as string,
        date: data.date as string,
        description: data.description as string,
        content,
      };
    }
  }

  return null;
}
