import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { posts, importers, type Lang } from "@/content/blog/registry";

export async function generateStaticParams() {
  const params: { lang: string; slug: string }[] = [];
  for (const [lang, langPosts] of Object.entries(posts)) {
    for (const post of langPosts) {
      params.push({ lang, slug: post.slug });
    }
  }
  return params;
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Record<string, string>>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = (posts[lang as Lang] ?? []).find((p) => p.slug === slug);
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
  const langImporters = importers[lang as Lang] ?? {};
  const importer = langImporters[slug];
  if (!importer) notFound();

  const { default: Post, meta } = await importer();
  const post = meta ?? (posts[lang as Lang] ?? []).find((p) => p.slug === slug);

  return (
    <article className="space-y-8">
      {post && (
        <header className="space-y-3">
          <time className="text-xs text-muted">
            {new Date(post.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <h1 className="text-3xl font-bold leading-tight tracking-tight">{post.title}</h1>
          <p className="text-muted">{post.description}</p>
          <hr className="border-token" />
        </header>
      )}

      <div className="prose prose-neutral dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-accent prose-a:no-underline hover:prose-a:underline max-w-none">
        <Post />
      </div>

      <div className="border-t border-token pt-8">
        <Link
          href={`/${lang}/blog`}
          className="text-sm text-muted hover:text-fg transition-colors"
        >
          ← {lang === "fr" ? "Tous les articles" : "All articles"}
        </Link>
      </div>

      <div className="rounded-lg border border-accent/20 bg-accent-soft p-6 space-y-3">
        <p className="font-semibold text-fg">
          {lang === "fr"
            ? "Essaie pokrr avec ton équipe — gratuit, sans inscription."
            : "Try pokrr with your team — free, no account needed."}
        </p>
        <Link
          href={`/${lang}`}
          className="inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          {lang === "fr" ? "Créer une salle →" : "Create a room →"}
        </Link>
      </div>
    </article>
  );
}
