import { Link } from "react-router-dom";
import { Heart, MessageCircle } from "lucide-react";
import { AuthorLine, TypeSticker } from "@/components/ui/primitives";
import type { Post } from "@/types";
import { cn, timeAgo } from "@/lib/utils";

export function PostCard({ post, variant = "card" }: { post: Post; variant?: "card" | "row" | "compact" }) {
  return (
    <article className={cn("post-card", `post-card--${variant}`)}>
      <div className="post-card__top">
        <TypeSticker type="post" label={post.type} variant="tag" />
        <span className="post-card__time">{timeAgo(post.createdAt)}</span>
      </div>
      <Link className="post-card__link" to={`/posts/${post.id}`}>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
      </Link>
      <div className="post-card__foot">
        <AuthorLine handle={post.authorHandle} size="xs" />
        <div className="post-card__stats">
          <span>
            <Heart size={12} aria-hidden="true" />
            {post.stats.likes}
          </span>
          <span>
            <MessageCircle size={12} aria-hidden="true" />
            {post.stats.comments}
          </span>
        </div>
      </div>
    </article>
  );
}
