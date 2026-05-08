import type { PostItem } from "@/features/posts/schema/posts.schema";

export interface TagPageProps {
  tagName: string;
  posts: Array<PostItem>;
}
