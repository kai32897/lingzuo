import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SectionHead } from "@/components/ui/primitives";
import { workMap } from "@/data/seed";
import { workLink } from "@/lib/work";

const PICKS = ["w-t-1", "w-t-2", "w-t-3"];

export function NewcomerSection() {
  const tutorials = PICKS.map((id) => workMap.get(id)).filter(
    (work): work is NonNullable<typeof work> => Boolean(work),
  );

  return (
    <section className="section section--newcomer" aria-labelledby="newcomer-title">
      <SectionHead
        num="05"
        title="新手 15 分钟"
        desc="不聊概念，直接交作业。三个短教程，今天就能做出第一件东西。"
        action={
          <Link className="arrow-link" to="/tutorials">
            全部教程
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        }
      />
      <div className="newcomer">
        {tutorials.map((tutorial, index) => (
          <Link key={tutorial.id} className="newcomer__item" to={workLink(tutorial)}>
            <span className="newcomer__num" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="newcomer__copy">
              <span className="newcomer__meta">
                {tutorial.type === "tutorial" ? tutorial.meta.difficulty : ""} ·{" "}
                {tutorial.type === "tutorial" ? tutorial.meta.minutes : 0} 分钟 · 产出：
                {tutorial.type === "tutorial" ? tutorial.meta.output : ""}
              </span>
              <h3>{tutorial.title}</h3>
              <span className="newcomer__go">
                学一手
                <ArrowUpRight size={15} aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
