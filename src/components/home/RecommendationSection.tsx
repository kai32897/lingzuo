import { useState } from "react";
import { RotateCcw, Shuffle } from "lucide-react";
import { SectionHead, EmptyState } from "@/components/ui/primitives";
import { WorkCard } from "@/components/work/WorkCard";
import { useToast } from "@/components/ui/Toast";
import {
  buildRecommendations,
  dismissWork,
  restoreWork,
  type Recommendation,
} from "@/lib/recommend";
import { LS_KEYS, readLocal, writeLocal } from "@/lib/storage";

export function RecommendationSection() {
  const { toast } = useToast();
  const [offset, setOffset] = useState(0);
  const [explore, setExplore] = useState(false);
  const [items, setItems] = useState<Recommendation[]>(() =>
    buildRecommendations({ count: 6 }),
  );

  const rebuild = (nextOffset: number, nextExplore: boolean) => {
    setItems(buildRecommendations({ count: 6, offset: nextOffset, explore: nextExplore }));
  };

  const refresh = () => {
    const nextOffset = offset + 3;
    const nextExplore = !explore;
    setOffset(nextOffset);
    setExplore(nextExplore);
    rebuild(nextOffset, nextExplore);
    toast({
      title: "换了一口味",
      desc: nextExplore
        ? "探索比例调高了，这次多给你看两件没刷到过的。"
        : "重新按本周的热度和完成度排了一次。",
      tone: "blue",
    });
  };

  const resetAll = () => {
    writeLocal<string[]>(LS_KEYS.dismissed, []);
    setOffset(0);
    setExplore(false);
    rebuild(0, false);
    toast({ title: "推荐已经恢复", desc: "之前标记过「不感兴趣」的作品都回来了。" });
  };

  return (
    <section className="section section--rec" aria-labelledby="rec-title">
      <SectionHead
        num="01"
        title="为你推荐"
        desc="每张卡都写了推荐理由。不是算法黑箱，也可以随时换一口味。"
        action={
          <div className="rec-actions">
            <span className="rec-actions__hint">悬停卡片右上角 × 可以少看一点</span>
            <button type="button" className="btn btn--outline btn--sm" onClick={refresh}>
              <Shuffle size={14} aria-hidden="true" />
              换一口味
            </button>
          </div>
        }
      />

      {items.length ? (
        <div className="rec-grid">
          {items.map(({ work, reason }) => (
            <WorkCard
              key={work.id}
              work={work}
              reason={reason}
              compact
              ratio="wide"
              onDismiss={() => {
                dismissWork(work.id);
                rebuild(offset, explore);
                toast({
                  title: "这类内容会少一点",
                  desc: `已经记下：暂时少看「${work.title}」这类。`,
                  action: {
                    label: "撤销",
                    onClick: () => {
                      restoreWork(work.id);
                      rebuild(offset, explore);
                    },
                  },
                });
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          glyph="空"
          title="你把推荐都清空了"
          desc="要么是口味太挑，要么是我们还不够懂你。可以恢复，也可以直接去发现页逛逛。"
          actions={
            <button type="button" className="btn btn--primary" onClick={resetAll}>
              <RotateCcw size={15} />
              恢复推荐
            </button>
          }
        />
      )}

      <p className="rec-footnote">
        推荐会参考你的浏览、喜欢和收藏
        {readLocal<string[]>(LS_KEYS.liked, []).length
          ? `，你目前喜欢了 ${readLocal<string[]>(LS_KEYS.liked, []).length} 件作品`
          : "。新用户先按编辑口味来，逛两件就会开始变准"}
        。
      </p>
    </section>
  );
}
