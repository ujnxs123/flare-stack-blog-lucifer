import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import theme from "@theme";
import { siteDomainQuery } from "@/features/config/queries";
import { postsInfiniteQueryOptions } from "@/features/posts/queries";
import {
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  buildCollectionPageJsonLd,
  canonicalLink,
} from "@/lib/seo";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_public/tags/$name")({
  component: TagPage,
  loader: async ({ context, params }) => {
    const domain = await context.queryClient.ensureQueryData(siteDomainQuery);
    const tagName = decodeURIComponent(params.name);
    const canonicalHref = buildCanonicalUrl(domain, `/tags/${params.name}`);
    return { domain, tagName, canonicalHref };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { tagName, canonicalHref } = loaderData;
    const description = m.tag_page_description({ tagName });
    return {
      meta: [
        { title: m.tag_page_title({ tagName }) },
        { name: "description", content: description },
        { property: "og:title", content: m.tag_page_title({ tagName }) },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalHref },
      ],
      links: [canonicalLink(canonicalHref)],
      scripts: [
        {
          type: "application/ld+json",
          children: buildCollectionPageJsonLd({
            name: tagName,
            canonicalHref,
            description,
          }),
        },
        {
          type: "application/ld+json",
          children: buildBreadcrumbJsonLd([
            {
              name: m.nav_home(),
              href: canonicalHref.replace(`/tags/${tagName}`, "/"),
            },
            { name: tagName, href: canonicalHref },
          ]),
        },
      ],
    };
  },
});

function TagPage() {
  const { tagName } = Route.useLoaderData();
  const filters = { tagName, limit: 12 };
  const postsQuery = useSuspenseInfiniteQuery(
    postsInfiniteQueryOptions(filters),
  );

  const posts = postsQuery.data.pages.flatMap((page) => page.items);

  return <theme.TagPage tagName={tagName} posts={posts} />;
}
