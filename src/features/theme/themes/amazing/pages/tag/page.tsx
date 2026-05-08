import type { TagPageProps } from "@/features/theme/contract/pages";
import { m } from "@/paraglide/messages";
import { ArchivePanel } from "../../components/archive/archive-panel";

export function TagPage({ tagName, posts }: TagPageProps) {
  return (
    <div
      className="fuwari-onload-animation flex flex-col gap-4"
      style={{
        animationName: "amazing-fade-up",
        animationDuration: "700ms",
        animationTimingFunction: "var(--amazing-spring)",
      }}
    >
      <div className="fuwari-card-base px-6 py-8 md:px-10 md:py-12 text-center">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-(--fuwari-primary) mb-2">
          {m.tag_page_heading({ tagName })}
        </h1>
        <p className="fuwari-text-50 text-sm">
          {m.posts_count({ count: posts.length })}
        </p>
      </div>

      {posts.length > 0 ? (
        <ArchivePanel posts={posts} />
      ) : (
        <div className="fuwari-card-base w-full px-8 py-12 text-center text-sm fuwari-text-50">
          {m.tag_page_empty()}
        </div>
      )}
    </div>
  );
}
