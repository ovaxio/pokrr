import type { Metadata } from "next";
import Link from "next/link";
import { getPosts, type Lang } from "@/content/blog/registry";
import { getDict, locales } from "@/i18n/shared";

export async function generateMetadata({
  params,
}: {
  params: Promise<Record<string, string>>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = (locales as string[]).includes(lang) ? lang : "fr";
  const d = getDict(locale as Lang);
  return {
    title: "Blog",
    description: d.blogSubtitle,
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

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
        <p className="text-muted">{d.blogSubtitle}</p>
      </header>

      {langPosts.length === 0 ? (
        <p className="text-muted">{d.blogEmpty}</p>
      ) : (
        <ul className="space-y-8">
          {langPosts.map((post) => (
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
                <p className="text-sm text-muted leading-relaxed">{post.description}</p>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
