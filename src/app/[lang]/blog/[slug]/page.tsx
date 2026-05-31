import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { registry, getPost, type Lang } from "@/content/blog/registry";
import { getDict, locales } from "@/i18n/shared";

const SITE_URL = "https://pokrr.app";

export async function generateStaticParams() {
  return Object.entries(registry).flatMap(([lang, posts]) =>
    posts.map((post) => ({ lang, slug: post.slug })),
  );
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Record<string, string>>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = getPost(lang as Lang, slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    authors: [{ name: "Guillaume Chambard" }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      url: `${SITE_URL}/${lang}/blog/${slug}`,
    },
    alternates: {
      canonical: `${SITE_URL}/${lang}/blog/${slug}`,
      languages: {
        [lang]: `${SITE_URL}/${lang}/blog/${slug}`,
        ...post.translations &&
          Object.fromEntries(
            Object.entries(post.translations).map(([l, s]) => [l, `${SITE_URL}/${l}/blog/${s}`]),
          ),
        "x-default": `${SITE_URL}/en/blog/${post.translations?.en ?? slug}`,
      },
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Record<string, string>>;
}) {
  const { lang, slug } = await params;
  const locale = (locales as string[]).includes(lang) ? (lang as Lang) : "fr";
  const post = getPost(locale, slug);
  if (!post) notFound();

  const { default: Post } = await post.load();
  const d = getDict(locale);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: locale === "fr" ? "fr-FR" : "en-US",
    url: `${SITE_URL}/${locale}/blog/${slug}`,
    author: {
      "@type": "Person",
      name: "Guillaume Chambard",
      url: SITE_URL,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
    isPartOf: { "@type": "Blog", url: `${SITE_URL}/${locale}/blog` },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "pokrr", item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/${locale}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/${locale}/blog/${slug}` },
    ],
  };

  const faqJsonLd = post.faq?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: locale === "fr" ? "fr-FR" : "en-US",
        mainEntity: post.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }
    : null;

  const dateLabel = new Date(post.updatedAt).toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <article className="space-y-8">
        <p className="text-sm text-muted">
          <time dateTime={post.updatedAt}>{dateLabel}</time>
        </p>

        <div className="prose prose-neutral dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-accent prose-a:no-underline hover:prose-a:underline max-w-none">
          <Post />
        </div>

        <div className="border-t border-token pt-8">
          <Link href={`/${lang}/blog`} className="text-sm text-muted hover:text-fg transition-colors">
            ← {d.blogBackLink}
          </Link>
        </div>

        <div className="rounded-lg border border-accent/20 bg-accent-soft p-6 space-y-3">
          <p className="font-semibold text-fg">{d.blogCta}</p>
          <Link
            href={`/${lang}`}
            className="inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            {d.blogCtaButton}
          </Link>
        </div>
      </article>
    </>
  );
}
