import type { PostItem } from "@/features/posts/schema/posts.schema";

export interface AuthorPageProps {
  authorName: string;
  posts: Array<PostItem>;
}
