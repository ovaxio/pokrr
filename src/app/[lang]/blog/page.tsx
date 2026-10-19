import type { Metadata } from "next";
import Link from "next/link";
import { getPosts, type Lang } from "@/content/blog/registry";
import { getDict, locales } from "@/i18n/shared";

const SITE_URL = "https://pokrr.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<Record<string, string>>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = (locales as string[]).includes(lang) ? lang : "fr";
  const blogTitle =
    locale === "fr"
      ? "Blog Planning Poker : guides agile et Scrum pour équipes"
      : "Planning Poker Blog: Agile & Scrum guides for teams";
  const description =
    locale === "fr"
      ? "Guides pratiques sur le planning poker : règles du vote, échelles Fibonacci et T-Shirt, comparatif d'outils gratuits, conseils pour équipes Scrum."
      : "Practical planning poker guides: voting rules, Fibonacci and T-shirt scales, free tool comparisons and tips for Scrum and agile teams.";
  return {
    title: blogTitle,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog`,
      languages: {
        fr: `${SITE_URL}/fr/blog`,
        en: `${SITE_URL}/en/blog`,
        "x-default": `${SITE_URL}/en/blog`,
      },
    },
    openGraph: {
      title: blogTitle,
      description,
      url: `${SITE_URL}/${locale}/blog`,
      images: [{ url: `${SITE_URL}/${locale}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: blogTitle,
      description,
      images: [`${SITE_URL}/${locale}/opengraph-image`],
    },
  };
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<Record<string, string>>;
}) {
  const { lang } = await params;
  const locale = (locales as string[]).includes(lang) ? (lang as Lang) : "fr";
  const d = getDict(locale);
  const langPosts = getPosts(locale);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "pokrr", item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/${locale}/blog` },
    ],
  };

  const itemListJsonLd = langPosts.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: locale === "fr" ? "Articles Planning Poker" : "Planning Poker Articles",
        url: `${SITE_URL}/${locale}/blog`,
        itemListElement: langPosts.map((post, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: post.title,
          url: `${SITE_URL}/${locale}/blog/${post.slug}`,
          description: post.description,
        })),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      <div className="space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted">{d.blogSubtitle}</p>
        </header>

        {langPosts.length === 0 ? (
          <p className="text-muted">{d.blogEmpty}</p>
        ) : (
          <ul className="space-y-8">
            {langPosts.map((post) => {
              const isUpdated = post.updatedAt !== post.publishedAt;
              const datePrefix = locale === "fr"
                ? (isUpdated ? "Mis à jour le" : "Publié le")
                : (isUpdated ? "Updated" : "Published");
              const dateLabel = new Date(post.updatedAt).toLocaleDateString(
                locale === "fr" ? "fr-FR" : "en-US",
                { year: "numeric", month: "long", day: "numeric" },
              );
              return (
                <li key={post.slug}>
                  <article className="space-y-2">
                    <h2 className="text-xl font-semibold leading-snug">
                      <Link
                        href={`/${lang}/blog/${post.slug}`}
                        className="hover:text-accent transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    <p className="text-xs text-faint">
                      <time dateTime={post.updatedAt}>{datePrefix} {dateLabel}</time>
                    </p>
                    <p className="text-sm text-muted leading-relaxed">{post.description}</p>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
