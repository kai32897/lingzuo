import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, PenLine } from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { SectionHead, WorkTypeDot } from "@/components/ui/primitives";
import { WORK_TYPE_CONFIG } from "@/data/config";
import { works } from "@/data/seed";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { workLink } from "@/lib/work";

export function NotFoundPage() {
  useDocumentTitle("404 · 这件作品还没被造出来 · 灵作");
  const suggestions = [...works]
    .sort((a, b) => b.stats.likes - a.stats.likes)
    .slice(0, 3);

  return (
    <div className="notfound container">
      <div className="notfound__card">
        <span className="notfound__code">404 / NOT MADE YET</span>
        <div className="notfound__glyph" aria-hidden="true">
          未
        </div>
        <div className="notfound__copy">
          <h1>这件作品还没被造出来。</h1>
          <p>
            链接可能写错了、被作者收回了，或者它只是还躺在某人的草稿箱里。
            你可以回首页，也可以把这个想法领走。
          </p>
          <div className="notfound__actions">
            <Link className="btn btn--primary" to="/">
              <ArrowLeft size={16} />
              回首页
            </Link>
            <Link className="btn btn--outline" to="/create?idea=404">
              <PenLine size={16} />
              发布这个想法
            </Link>
          </div>
        </div>
        <span className="notfound__stamp" aria-hidden="true">
          404
        </span>
      </div>

      <div className="notfound__suggest">
        <SectionHead
          num="TRY"
          title="或者，从这几件开始"
          desc="它们都还在，也都愿意被打开。"
          action={<Link className="arrow-link" to="/discover">去发现页 <ArrowUpRight size={15} /></Link>}
        />
        <div className="notfound__grid">
          {suggestions.map((work) => {
            const config = WORK_TYPE_CONFIG[work.type];
            return (
              <Link key={work.id} className="related-mini" to={workLink(work)}>
                <span className="related-mini__cover">
                  <Cover cover={work.cover} />
                </span>
                <span className="related-mini__copy">
                  <span className="related-mini__type">
                    <WorkTypeDot type={work.type} />
                    {config.label}
                  </span>
                  <strong>{work.title}</strong>
                  <small>{work.summary}</small>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
