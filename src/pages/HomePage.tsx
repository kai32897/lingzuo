import { Hero } from "@/components/home/Hero";
import { InspirationSlot } from "@/components/home/InspirationSlot";
import { RecommendationSection } from "@/components/home/RecommendationSection";
import { FourDoors } from "@/components/home/FourDoors";
import { ChallengeSection } from "@/components/home/ChallengeSection";
import { RemixChain } from "@/components/home/RemixChain";
import { NewcomerSection } from "@/components/home/NewcomerSection";
import { FreshList } from "@/components/home/FreshList";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const TICKER_ITEMS = [
  "每个作品都可以带配方",
  "二创必须署名",
  "AI 声明不可隐藏",
  "不自动播放声音",
  "全站只有一个搜索入口",
  "390px 也能完整使用",
  "不按热度排，按「你要做什么」排",
];

function Ticker() {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__track">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => (
          <span className="ticker__item" key={`${item}-${index}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HomePage() {
  useDocumentTitle("灵作 · MADE WITH AI · 把 AI 做的东西，玩起来");
  return (
    <div className="home-page">
      <Hero />
      <Ticker />
      <div className="container">
        <InspirationSlot />
      </div>
      <div className="container">
        <RecommendationSection />
      </div>
      <div className="container">
        <FourDoors />
      </div>
      <ChallengeSection />
      <div className="container">
        <RemixChain />
      </div>
      <div className="container">
        <NewcomerSection />
      </div>
      <div className="container">
        <FreshList />
      </div>
    </div>
  );
}
