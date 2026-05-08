type BreadcrumbItem = {
  name: string;
  href: string;
};

type ArticleJsonLdInput = {
  authorName: string;
  canonicalHref: string;
  post: {
    slug: string;
    summary?: string | null;
    title: string;
    contentText?: string | null;
    heroImageUrl?: string | null;
    publishedAt?: Date | string | null;
    updatedAt: Date | string;
    tags?: Array<{ name: string }> | undefined;
  };
};

export function buildCanonicalHref(
  pathname: string,
  searchParams?: Record<string, string | undefined>,
) {
  const normalizedPath =
    pathname === "/" ? "/" : pathname.replace(/\/+$/, "") || "/";

  if (!searchParams) return normalizedPath;

  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `${normalizedPath}?${query}` : normalizedPath;
}

export function buildCanonicalUrl(
  domain: string,
  pathname: string,
  searchParams?: Record<string, string | undefined>,
) {
  return `https://${domain}${buildCanonicalHref(pathname, searchParams)}`;
}

export function canonicalLink(href: string) {
  return {
    rel: "canonical",
    href,
  } as const;
}

export function buildArticleJsonLd({
  authorName,
  canonicalHref,
  post,
}: ArticleJsonLdInput) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    url: canonicalHref,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalHref,
    },
    author: {
      "@type": "Person",
      name: authorName,
    },
    dateModified: new Date(post.updatedAt).toISOString(),
  };

  if (post.summary) {
    jsonLd.description = post.summary;
  }

  if (post.publishedAt) {
    jsonLd.datePublished = new Date(post.publishedAt).toISOString();
  }

  const keywords = post.tags?.map((tag) => tag.name).filter(Boolean);
  if (keywords?.length) {
    jsonLd.keywords = keywords;
  }

  return JSON.stringify(jsonLd);
}

export function buildBreadcrumbJsonLd(items: Array<BreadcrumbItem>) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.href,
    })),
  });
}

export function buildCollectionPageJsonLd({
  name,
  canonicalHref,
  description,
}: {
  name: string;
  canonicalHref: string;
  description?: string;
}) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: canonicalHref,
    ...(description ? { description } : {}),
  });
}

export function buildProfilePageJsonLd({
  name,
  canonicalHref,
  imageUrl,
}: {
  name: string;
  canonicalHref: string;
  imageUrl?: string | null;
}) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: canonicalHref,
    mainEntity: {
      "@type": "Person",
      name,
      ...(imageUrl ? { image: imageUrl } : {}),
    },
  });
}

export function buildWebSiteJsonLd({
  domain,
  siteName,
}: {
  domain: string;
  siteName: string;
}) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: `https://${domain}/`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `https://${domain}/search?query={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  });
}

export function hreflangLinks(
  domain: string,
  pathname: string,
  searchParams?: Record<string, string | undefined>,
) {
  const canonicalHref = buildCanonicalUrl(domain, pathname, searchParams);
  return [
    { rel: "alternate", hrefLang: "zh", href: canonicalHref },
    { rel: "alternate", hrefLang: "en", href: canonicalHref },
    { rel: "alternate", hrefLang: "x-default", href: canonicalHref },
  ] as const;
}

export function buildOrganizationJsonLd({
  name,
  domain,
  description,
}: {
  name: string;
  domain: string;
  description?: string;
}) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: `https://${domain}/`,
    ...(description ? { description } : {}),
  });
}
