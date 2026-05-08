import { createFileRoute } from "@tanstack/react-router";
import theme from "@theme";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import {
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  buildOrganizationJsonLd,
  canonicalLink,
} from "@/lib/seo";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_public/about")({
  component: AboutPage,
  loader: async ({ context }) => {
    const [domain, siteConfig] = await Promise.all([
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);
    return {
      canonicalHref: buildCanonicalUrl(domain, "/about"),
      domain,
      siteConfig,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: m.about_title() },
      { name: "description", content: m.about_description() },
    ],
    links: [canonicalLink(loaderData?.canonicalHref ?? "")],
    scripts: [
      {
        type: "application/ld+json" as const,
        children: buildOrganizationJsonLd({
          name: loaderData?.siteConfig?.title ?? "",
          domain: loaderData?.domain ?? "",
          description: m.about_description(),
        }),
      },
      {
        type: "application/ld+json" as const,
        children: buildBreadcrumbJsonLd([
          { name: m.nav_home(), href: `https://${loaderData?.domain ?? ""}/` },
          { name: m.about_title(), href: loaderData?.canonicalHref ?? "" },
        ]),
      },
    ],
  }),
});

function AboutPage() {
  return <theme.AboutPage />;
}
