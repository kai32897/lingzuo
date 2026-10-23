import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { workMap } from "@/data/seed";
import type { Collection } from "@/types";

export function CollectionCard({ collection }: { collection: Collection }) {
  const works = collection.workIds
    .map((id) => workMap.get(id))
    .filter((work): work is NonNullable<typeof work> => Boolean(work));

  return (
    <Link className="collection-card" to={`/collections/${collection.id}`}>
      <div className="collection-card__stack" aria-hidden="true">
        {works.slice(0, 3).map((work, index) => (
          <span key={work.id} className={`collection-card__mini collection-card__mini--${index}`}>
            <Cover cover={work.cover} />
          </span>
        ))}
        <span className="collection-card__count">{collection.workIds.length} 件</span>
      </div>
      <div className="collection-card__body">
        <span className="eyebrow">
          {collection.editor} 编辑 · COLLECTION
        </span>
        <h3>{collection.title}</h3>
        <p>{collection.desc}</p>
        <span className="collection-card__open">
          打开合集 <ArrowUpRight size={14} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
