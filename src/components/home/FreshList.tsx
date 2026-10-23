import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SectionHead, AuthorLine, WorkTypeDot } from "@/components/ui/primitives";
import { works } from "@/data/seed";
import { WORK_TYPE_CONFIG } from "@/data/config";
import { timeAgo } from "@/lib/utils";
import { workLink } from "@/lib/work";

export function FreshList() {
  const latest = [...works]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <section className="section section--fresh" aria-labelledby="fresh-title">
      <SectionHead
        num="06"
        title="今日上新"
        desc="刚发布的作品。新作品会先在这里出现，再去更大的推荐池。"
        action={
          <Link className="arrow-link" to="/discover">
            去发现更多
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        }
      />
      <div className="fresh-list">
        {latest.map((work) => {
          const config = WORK_TYPE_CONFIG[work.type];
          return (
            <Link key={work.id} className="fresh-row" to={workLink(work)}>
              <span className="fresh-type">
                <WorkTypeDot type={work.type} />
                {config.label}
              </span>
              <span className="fresh-title">
                {work.title}
                <small>{work.hook}</small>
              </span>
              <span className="fresh-author">
                <AuthorLine handle={work.authorHandle} size="xs" link={false} />
              </span>
              <span className="fresh-time">{timeAgo(work.createdAt)}</span>
              <span className="fresh-arrow" aria-hidden="true">
                <ArrowUpRight size={15} />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
