import type { Metadata } from "next";
import Link from "next/link";
import { posts, type Lang } from "@/content/blog/registry";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides et conseils sur le planning poker agile pour les équipes Scrum.",
};

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<Record<string, string>>;
}) {
  const { lang } = await params;
  const langPosts = posts[lang as Lang] ?? [];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
        <p className="text-muted">
          {lang === "fr"
            ? "Guides sur le planning poker pour les équipes agiles."
            : "Planning poker guides for agile teams."}
        </p>
      </header>

      {langPosts.length === 0 ? (
        <p className="text-muted">{lang === "fr" ? "Bientôt." : "Coming soon."}</p>
      ) : (
        <ul className="space-y-8">
          {langPosts.map((post) => (
            <li key={post.slug}>
              <article className="space-y-2">
                <time className="text-xs text-muted">
                  {new Date(post.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
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
