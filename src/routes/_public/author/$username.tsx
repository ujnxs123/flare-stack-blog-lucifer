import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import theme from "@theme";
import { siteDomainQuery } from "@/features/config/queries";
import { postsInfiniteQueryOptions } from "@/features/posts/queries";
import {
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  buildProfilePageJsonLd,
  canonicalLink,
} from "@/lib/seo";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_public/author/$username")({
  component: AuthorPage,
  loader: async ({ context, params }) => {
    const domain = await context.queryClient.ensureQueryData(siteDomainQuery);
    const authorName = decodeURIComponent(params.username);
    const canonicalHref = buildCanonicalUrl(
      domain,
      `/author/${params.username}`,
    );
    return { domain, authorName, canonicalHref };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { authorName, canonicalHref } = loaderData;
    const description = m.author_page_description({ authorName });
    return {
      meta: [
        { title: m.author_page_title({ authorName }) },
        { name: "description", content: description },
        { property: "og:title", content: m.author_page_title({ authorName }) },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: canonicalHref },
      ],
      links: [canonicalLink(canonicalHref)],
      scripts: [
        {
          type: "application/ld+json",
          children: buildProfilePageJsonLd({
            name: authorName,
            canonicalHref,
          }),
        },
        {
          type: "application/ld+json",
          children: buildBreadcrumbJsonLd([
            {
              name: m.nav_home(),
              href: canonicalHref.replace(`/author/${authorName}`, "/"),
            },
            { name: authorName, href: canonicalHref },
          ]),
        },
      ],
    };
  },
});

function AuthorPage() {
  const { authorName } = Route.useLoaderData();
  const filters = { authorName, limit: 12 };
  const postsQuery = useSuspenseInfiniteQuery(
    postsInfiniteQueryOptions(filters),
  );

  const posts = postsQuery.data.pages.flatMap((page) => page.items);

  return <theme.AuthorPage authorName={authorName} posts={posts} />;
}
