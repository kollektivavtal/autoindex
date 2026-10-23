import type { MetadataRoute } from "next";
import { loadAgreements } from "@/lib/agreements";

export const dynamic = "force-static";

const baseUrl = `https://kollektivavtal.github.io/${process.env.NEXT_PUBLIC_YEAR}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const agreements = await loadAgreements(process.env.SOURCE_DIRECTORY_PATH!);

  return agreements
    .filter((agreement) => !agreement.redirectTo)
    .map((agreement) => ({
      url: `${baseUrl}/${agreement.slug}`,
    }));
}
