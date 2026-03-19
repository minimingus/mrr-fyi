import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/update/"],
      },
    ],
    sitemap: "https://mrr.fyi/sitemap.xml",
  };
}
