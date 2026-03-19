// app/sitemap.ts
import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const founders = await prisma.founder.findMany({
    select: { slug: true, updatedAt: true },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: "https://mrr.fyi", lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: "https://mrr.fyi/submit", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: "https://mrr.fyi/pricing", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: "https://mrr.fyi/changelog", lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  ];

  const founderRoutes: MetadataRoute.Sitemap = founders.map((f) => ({
    url: `https://mrr.fyi/${f.slug}`,
    lastModified: f.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...founderRoutes];
}
