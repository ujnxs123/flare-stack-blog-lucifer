import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import theme from "@theme";
import { useEffect } from "react";
import { z } from "zod";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import { recordPageViewFn } from "@/features/pageview/api/pageview.api";
import { postBySlugQuery, relatedPostsQuery } from "@/features/posts/queries";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  canonicalLink,
  hreflangLinks,
} from "@/lib/seo";
import { m } from "@/paraglide/messages";

const searchSchema = z.object({
  highlightCommentId: z.coerce.number().optional(),
  rootId: z.number().optional(),
});

const { relatedPostsLimit } = theme.config.post;

export const Route = createFileRoute("/_public/post/$slug")({
  validateSearch: searchSchema,
  component: RouteComponent,
  loader: async ({ context, params }) => {
    // 1. Critical: Main post data - use serverFn (executes directly on server, no HTTP)
    const [post, domain, siteConfig] = await Promise.all([
      context.queryClient.ensureQueryData(postBySlugQuery(params.slug)),
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);

    // 2. Deferred: Related posts (prefetch only, don't await)
    void context.queryClient.prefetchQuery(
      relatedPostsQuery(params.slug, relatedPostsLimit),
    );

    if (!post) throw notFound();

    return {
      post,
      authorName: siteConfig.author,
      canonicalHref: buildCanonicalUrl(
        domain,
        `/post/${encodeURIComponent(post.slug)}`,
      ),
    };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    const canonicalHref = loaderData?.canonicalHref ?? "";
    const domain = canonicalHref ? new URL(canonicalHref).hostname : "";

    const meta = [
      { title: post?.title },
      { name: "description", content: post?.summary ?? "" },
      { property: "og:title", content: post?.title ?? "" },
      { property: "og:description", content: post?.summary ?? "" },
      { property: "og:type", content: "article" },
      { property: "og:url", content: canonicalHref },
      { name: "twitter:card", content: "summary_large_image" },
    ];

    if (post?.publishedAt) {
      const publishedISO = new Date(post.publishedAt).toISOString();
      meta.push({ property: "article:published_time", content: publishedISO });
    }
    meta.push({
      property: "article:modified_time",
      content: new Date(post?.updatedAt ?? Date.now()).toISOString(),
    });

    if (post?.tags) {
      for (const tag of post.tags) {
        meta.push({ property: "article:tag", content: tag.name });
      }
    }

    const links = [
      canonicalLink(canonicalHref),
      ...(domain ? hreflangLinks(domain, `/post/${post?.slug ?? ""}`) : []),
    ];

    const scripts = post
      ? [
          {
            type: "application/ld+json" as const,
            children: buildArticleJsonLd({
              authorName: loaderData.authorName,
              canonicalHref,
              post,
            }),
          },
          {
            type: "application/ld+json" as const,
            children: buildBreadcrumbJsonLd([
              { name: m.nav_home(), href: `https://${domain}/` },
              { name: m.nav_posts(), href: `https://${domain}/posts` },
              { name: post.title, href: canonicalHref },
            ]),
          },
        ]
      : [];

    return { meta, links, scripts };
  },
  pendingComponent: () => <theme.PostPageSkeleton />,
  pendingMs: __THEME_CONFIG__.pendingMs,
});

function RouteComponent() {
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(postBySlugQuery(slug));

  useEffect(() => {
    if (!post?.id) return;
    try {
      const key = `pv:${post.id}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Safari private mode / storage disabled — record anyway
    }
    void recordPageViewFn({ data: { postId: post.id } });
  }, [post?.id]);

  if (!post) throw notFound();

  return <theme.PostPage post={post} />;
}
