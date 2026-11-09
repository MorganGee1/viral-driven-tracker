import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/services", "/contact", "/privacy", "/terms"].map((p) => ({
    url: `${SITE.url}${p}`, lastModified: new Date(), changeFrequency: "monthly", priority: p === "" ? 1 : 0.6,
  }));
}
