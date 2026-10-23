import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Dices, PenLine } from "lucide-react";
import { SectionHead } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { INSPIRATION_FORMS, INSPIRATION_LIMITS, INSPIRATION_TOPICS } from "@/data/config";
import { copyText } from "@/lib/utils";

interface SlotState {
  form: number;
  topic: number;
  limit: number;
}

function randomSlot(): SlotState {
  return {
    form: Math.floor(Math.random() * INSPIRATION_FORMS.length),
    topic: Math.floor(Math.random() * INSPIRATION_TOPICS.length),
    limit: Math.floor(Math.random() * INSPIRATION_LIMITS.length),
  };
}

export function InspirationSlot() {
  const { toast } = useToast();
  const [slot, setSlot] = useState<SlotState>({ form: 0, topic: 0, limit: 0 });
  const [rolling, setRolling] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const sentence = INSPIRATION_FORMS[slot.form].template(
    INSPIRATION_TOPICS[slot.topic],
    INSPIRATION_LIMITS[slot.limit],
  );

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    intervalRef.current = window.setInterval(() => setSlot(randomSlot()), 65);
    timeoutRef.current = window.setTimeout(() => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      const next = randomSlot();
      setSlot(next);
      setRolling(false);
    }, 380);
  };

  const onCopy = async () => {
    const ok = await copyText(sentence);
    toast({
      title: ok ? "灵感已复制" : "复制没有成功",
      desc: ok ? "拿去问 AI，或者直接开一个草稿。" : "可以手动选中这句话复制。",
      tone: ok ? "game" : "ink",
    });
  };

  return (
    <section className="section section--slot" aria-labelledby="slot-title">
      <SectionHead
        num="00"
        title="灵感老虎机"
        desc="摇一个具体的创作命题：形式 × 题材 × 限制。复制走，或者直接开做。"
        action={<span className="mono-small">随机生成 · 可以一直摇</span>}
      />
      <div className={rolling ? "slot is-rolling" : "slot"} id="inspiration">
        <div className="slot__body">
          {[
            { label: "形式 / FORM", value: INSPIRATION_FORMS[slot.form].name, index: slot.form },
            { label: "题材 / TOPIC", value: INSPIRATION_TOPICS[slot.topic], index: slot.topic },
            { label: "限制 / LIMIT", value: INSPIRATION_LIMITS[slot.limit], index: slot.limit },
          ].map((wheel) => (
            <div className="slot__wheel" key={wheel.label}>
              <span className="slot__label">{wheel.label}</span>
              <span className="slot__value" key={`${wheel.label}-${wheel.index}-${rolling ? "r" : "s"}`}>
                {wheel.value}
              </span>
            </div>
          ))}
          <div className="slot__roll">
            <button type="button" className="slot__roll-btn" onClick={roll} disabled={rolling}>
              <span className="slot__roll-icon">
                <Dices size={22} />
              </span>
              <span>{rolling ? "摇动中" : "摇一个"}</span>
            </button>
            <span className="slot__roll-note">一次摇三列 · 可以一直摇</span>
          </div>
        </div>
        <div className="slot__result">
          <div className="slot__sentence-wrap">
            <span className="eyebrow">你的命题 / BRIEF</span>
            <p className="slot__sentence" aria-live="polite">
              {sentence}
            </p>
          </div>
          <div className="slot__actions">
            <button type="button" className="btn btn--outline btn--sm" onClick={onCopy}>
              <Copy size={14} aria-hidden="true" />
              复制灵感
            </button>
            <Link
              className="btn btn--primary btn--sm"
              to={`/create?idea=${encodeURIComponent(sentence)}&from=slot`}
            >
              <PenLine size={14} aria-hidden="true" />
              用这个灵感去创作
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
