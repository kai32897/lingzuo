import { Link } from "react-router-dom";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { LS_KEYS, useLocalStorage } from "@/lib/storage";
import type { Creator } from "@/types";
import { formatCount } from "@/lib/utils";

export function CreatorCard({ creator }: { creator: Creator }) {
  const { toast } = useToast();
  const [followed, setFollowed] = useLocalStorage<string[]>(LS_KEYS.followedCreators, []);
  const isFollowing = followed.includes(creator.handle);

  return (
    <article className="creator-card">
      <div className="creator-card__head">
        <Avatar
          name={creator.name}
          text={creator.avatarText}
          color={creator.avatarColor}
          size="lg"
        />
        <div className="creator-card__id">
          <Link to={`/u/${creator.handle}`}>{creator.name}</Link>
          <span>{creator.role}</span>
        </div>
        <button
          type="button"
          className={isFollowing ? "follow-btn is-following" : "follow-btn"}
          aria-pressed={isFollowing}
          onClick={() => {
            setFollowed((prev) =>
              isFollowing ? prev.filter((item) => item !== creator.handle) : [...prev, creator.handle],
            );
            toast({
              title: isFollowing ? `已取消关注 ${creator.name}` : `关注了 ${creator.name}`,
              desc: isFollowing ? "他之后的新作品不会再优先出现。" : "他发布新作品时，会在「关注」里看到。",
              tone: isFollowing ? "ink" : "game",
            });
          }}
        >
          {isFollowing ? <Check size={13} /> : <Plus size={13} />}
          {isFollowing ? "已关注" : "关注"}
        </button>
      </div>
      <p className="creator-card__bio">{creator.bio}</p>
      <div className="creator-card__tools">
        {creator.tools.slice(0, 3).map((tool) => (
          <span key={tool}>{tool}</span>
        ))}
      </div>
      <div className="creator-card__foot">
        <span>{formatCount(creator.stats.works)} 件作品</span>
        <span>{formatCount(creator.stats.followers)} 关注者</span>
        <Link to={`/u/${creator.handle}`} className="creator-card__link">
          看主页 <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
