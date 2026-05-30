import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { registry, getPost, type Lang } from "@/content/blog/registry";
import { getDict, locales } from "@/i18n/shared";

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
    openGraph: { title: post.title, description: post.description },
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

  return (
    <article className="space-y-8">

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
  );
}
