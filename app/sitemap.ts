// app/sitemap.ts
import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { NICHE_SLUGS } from "@/app/niche/[niche]/page";
import { getAllPosts } from "@/lib/blog";

export const revalidate = 3600; // rebuild sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const founders = await prisma.founder.findMany({
    where: { emailVerified: true },
    select: { slug: true, updatedAt: true },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: "https://mrr.fyi", lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: "https://mrr.fyi/submit", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: "https://mrr.fyi/pricing", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: "https://mrr.fyi/changelog", lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  ];

  const nicheRoutes: MetadataRoute.Sitemap = NICHE_SLUGS.map((niche) => ({
    url: `https://mrr.fyi/niche/${niche}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const founderRoutes: MetadataRoute.Sitemap = founders.map((f) => ({
    url: `https://mrr.fyi/${f.slug}`,
    lastModified: f.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogPosts = getAllPosts();
  const blogRoutes: MetadataRoute.Sitemap = [
    {
      url: "https://mrr.fyi/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...blogPosts.map((post) => ({
      url: `https://mrr.fyi/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return [...staticRoutes, ...nicheRoutes, ...blogRoutes, ...founderRoutes];
}
