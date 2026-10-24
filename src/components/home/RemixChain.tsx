import { Link } from "react-router-dom";
import { ArrowRight, GitBranch, Plus } from "lucide-react";
import { SectionHead } from "@/components/ui/primitives";
import { Cover } from "@/components/work/Cover";
import { creatorMap, works } from "@/data/seed";
import { WORK_TYPE_CONFIG } from "@/data/config";
import { workLink } from "@/lib/work";

export function RemixChain() {
  const nodes = works.filter((work) => work.remixOf).slice(0, 3);
  if (nodes.length < 2) return null;

  return (
    <section className="section section--remix" aria-labelledby="remix-title">
      <SectionHead
        num="04"
        title="接力创作"
        desc="谁启发了谁，谁把故事往下接了。血缘公开，二创必须署名。"
        action={
          <Link className="arrow-link" to="/discover">
            去发现更多
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        }
      />
      <div className="remix-panel">
        <div className="remix-panel__head">
          <div>
            <span className="eyebrow">CASE FILE / 二创血缘</span>
            <h3>从一个世界，长出新的打开方式</h3>
          </div>
          <p>
            一个作品可以启发另一个作品：游戏变成短剧，短剧长成小说。
            它们不是续集，是同一个世界观的再次接力。
          </p>
        </div>

        <div className="remix-chain">
          <span className="remix-chain__label" aria-hidden="true">
            <GitBranch size={14} />
            血缘链
          </span>
          {nodes.map((work, index) => {
            const config = WORK_TYPE_CONFIG[work.type];
            const author = creatorMap.get(work.authorHandle);
            return (
              <div className="remix-step" key={work.id}>
                {index > 0 ? (
                  <span className="remix-arrow" aria-hidden="true">
                    <span>二创</span>
                    <ArrowRight size={18} />
                  </span>
                ) : null}
                <Link className="remix-node" to={workLink(work)}>
                  <span className="remix-node__label">{String.fromCharCode(65 + index)}</span>
                  <span className="remix-node__cover">
                    <Cover cover={work.cover} />
                  </span>
                  <strong>{work.title}</strong>
                  <small>
                    {config.label} · {author?.name}
                  </small>
                </Link>
              </div>
            );
          })}
          <span className="remix-arrow remix-arrow--ghost" aria-hidden="true">
            <span>下一棒</span>
            <ArrowRight size={18} />
          </span>
          <Link className="remix-add" to="/create">
            <Plus size={20} aria-hidden="true" />
            <strong>加入接力</strong>
            <small>从一个已授权的世界观开始</small>
          </Link>
        </div>
      </div>
    </section>
  );
}
