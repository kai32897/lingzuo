import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Bookmark } from "lucide-react";
import type { Tool } from "@/types";
import { formatCount } from "@/lib/utils";

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <article className="tool-card" style={{ "--tool-color": tool.color } as CSSProperties}>
      <Link className="tool-card__link" to={`/tools/${tool.slug}`}>
        <div className="tool-card__head">
          <span className="tool-mark" aria-hidden="true">
            {tool.mark}
          </span>
          <div className="tool-card__title">
            <h3>{tool.name}</h3>
            <span>
              {tool.pricing} · {tool.platform.join(" / ")}
            </span>
          </div>
          <ArrowUpRight size={17} className="tool-card__arrow" aria-hidden="true" />
        </div>
        <p className="tool-card__tagline">{tool.tagline}</p>
        <div className="tool-card__uses">
          {tool.useCases.slice(0, 3).map((useCase) => (
            <span key={useCase}>{useCase}</span>
          ))}
        </div>
        <div className="tool-card__foot">
          <span>相关教程 {tool.relatedTutorialIds.length}</span>
          <span className="tool-card__saves">
            <Bookmark size={12} aria-hidden="true" />
            {formatCount(tool.stats.saves)}
          </span>
        </div>
      </Link>
    </article>
  );
}
