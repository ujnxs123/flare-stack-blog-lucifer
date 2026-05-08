import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import theme from "@theme";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import {
  pinnedPostsQuery,
  popularPostsQuery,
  recentPostsQuery,
} from "@/features/posts/queries";
import {
  buildCanonicalUrl,
  buildWebSiteJsonLd,
  canonicalLink,
} from "@/lib/seo";

const { recentPostsLimit, popularPostsLimit } = theme.config.home;

export const Route = createFileRoute("/_public/")({
  loader: async ({ context }) => {
    const [, domain, siteConfig] = await Promise.all([
      context.queryClient.ensureQueryData(recentPostsQuery(recentPostsLimit)),
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
      context.queryClient.ensureQueryData(pinnedPostsQuery),
      context.queryClient.ensureQueryData(popularPostsQuery(popularPostsLimit)),
    ]);

    return {
      canonicalHref: buildCanonicalUrl(domain, "/"),
      domain,
      siteConfig,
    };
  },
  head: ({ loaderData }) => ({
    links: [canonicalLink(loaderData?.canonicalHref ?? "/")],
    scripts: [
      {
        type: "application/ld+json" as const,
        children: buildWebSiteJsonLd({
          domain: loaderData?.domain ?? "",
          siteName: loaderData?.siteConfig?.title ?? "",
        }),
      },
    ],
  }),
  pendingComponent: HomePageSkeleton,
  component: HomeRoute,
});

function HomeRoute() {
  const { data: posts } = useSuspenseQuery(recentPostsQuery(recentPostsLimit));
  const { data: pinnedPosts } = useSuspenseQuery(pinnedPostsQuery);
  const { data: popularPosts } = useSuspenseQuery(
    popularPostsQuery(popularPostsLimit),
  );

  return (
    <theme.HomePage
      posts={posts}
      pinnedPosts={pinnedPosts}
      popularPosts={popularPosts}
    />
  );
}

function HomePageSkeleton() {
  return <theme.HomePageSkeleton />;
}
