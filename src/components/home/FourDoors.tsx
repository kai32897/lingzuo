import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SectionHead } from "@/components/ui/primitives";
import { WORK_TYPE_CONFIG } from "@/data/config";
import { works } from "@/data/seed";
import type { ContentType } from "@/types";

const DOORS: { type: ContentType; note: string }[] = [
  { type: "game", note: "16:10 网格 · 点开就玩" },
  { type: "drama", note: "9:16 竖屏 · 一集三分钟" },
  { type: "novel", note: "3:4 书封 · 先读三行" },
  { type: "tutorial", note: "步骤清单 · 直接交作业" },
];

function DoorArt({ type }: { type: ContentType }) {
  if (type === "game") {
    return (
      <div className="door-art door-art--game" aria-hidden="true">
        <span className="door-pixel-grid" />
        <span className="door-play">▶</span>
        <span className="door-art__hint">PRESS START</span>
      </div>
    );
  }
  if (type === "drama") {
    return (
      <div className="door-art door-art--drama" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span key={index} className={`door-phone door-phone--${index}`}>
            <span />
          </span>
        ))}
        <span className="door-art__hint">SWIPE TO WATCH</span>
      </div>
    );
  }
  if (type === "novel") {
    return (
      <div className="door-art door-art--novel" aria-hidden="true">
        <span className="door-quote">“</span>
        <p>
          月亮碎成七块，
          <br />
          签收单上写着：
          <br />
          能亮就行。
        </p>
        <span className="door-art__hint">READ 3 LINES</span>
      </div>
    );
  }
  return (
    <div className="door-art door-art--tutorial" aria-hidden="true">
      <ol className="door-steps">
        <li>
          <b>01</b>写三句话分镜
        </li>
        <li>
          <b>02</b>选一束光
        </li>
        <li>
          <b>03</b>剪出呼吸
        </li>
      </ol>
      <span className="door-art__hint">MAKE IT YOURSELF</span>
    </div>
  );
}

export function FourDoors() {
  return (
    <section className="section section--doors" aria-labelledby="doors-title">
      <SectionHead
        num="02"
        title="四扇门"
        desc="同一套骨架，四种逛法。进去之后，卡片比例、主行动和舞台都不一样。"
        action={
          <Link className="arrow-link" to="/tools">
            去工具库找工具
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        }
      />
      <div className="doors">
        {DOORS.map(({ type, note }) => {
          const config = WORK_TYPE_CONFIG[type];
          const count = works.filter((work) => work.type === type).length;
          return (
            <Link
              key={type}
              className="door"
              to={config.href}
              style={{ "--cat": config.color } as CSSProperties}
            >
              <div className="door__preview">
                <DoorArt type={type} />
              </div>
              <div className="door__body">
                <div className="door__title-row">
                  <h3>{config.label}</h3>
                  <span className="door__count">{count}</span>
                </div>
                <p className="door__desc">{config.description}</p>
                <span className="door__note">{note}</span>
                <span className="door__go">
                  {config.action}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
