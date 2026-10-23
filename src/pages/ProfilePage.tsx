import { useMemo, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Copy,
  MapPin,
  MessageCircle,
  Plus,
  Settings2,
  X,
} from "lucide-react";
import { WorkCard } from "@/components/work/WorkCard";
import { Avatar, EmptyState } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { CURRENT_USER, WORK_TYPE_CONFIG } from "@/data/config";
import { creatorMap, works } from "@/data/seed";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { LS_KEYS, readLocal, useLocalStorage } from "@/lib/storage";
import { loadSettings, type UserSettings } from "@/lib/userContent";
import { copyText, formatCount } from "@/lib/utils";
import { workLink } from "@/lib/work";
import type { Work } from "@/types";

type ProfileTab = "works" | "remix" | "saved" | "liked" | "about";

export function ProfilePage() {
  const { handle } = useParams();
  const isCurrent = handle === CURRENT_USER.handle;
  const creator = handle ? creatorMap.get(handle) : undefined;
  const settings = loadSettings();
  useDocumentTitle(creator ? `${creator.name} · 灵作` : isCurrent ? `${settings.name} · 灵作` : "创作者 · 灵作");
  if (!handle || (!creator && !isCurrent)) return <NotFoundPage />;
  return <Profile handle={handle} isCurrent={isCurrent} settings={settings} />;
}

function Profile({
  handle,
  isCurrent,
  settings,
}: {
  handle: string;
  isCurrent: boolean;
  settings: UserSettings;
}) {
  const { toast } = useToast();
  const creator = creatorMap.get(handle);
  const [followed, setFollowed] = useLocalStorage<string[]>(LS_KEYS.followedCreators, []);
  const [contactOpen, setContactOpen] = useState(false);
  const [tab, setTab] = useState<ProfileTab>("works");
  const isFollowing = followed.includes(handle);
  const name = isCurrent ? settings.name : creator?.name ?? handle;
  const role = isCurrent ? CURRENT_USER.role : creator?.role ?? "社区成员";
  const bio = isCurrent ? settings.bio : creator?.bio ?? "还没有填写简介。";
  const location = isCurrent ? settings.location : creator?.location ?? "未知";
  const avatarColor = isCurrent ? CURRENT_USER.avatarColor : creator?.avatarColor ?? "#D8FF3E";
  const avatarText = isCurrent ? settings.name.slice(0, 1) : creator?.avatarText ?? name.slice(0, 1);
  const joined = isCurrent ? "2026 年 10 月" : creator?.joined ?? "2026 年";
  const allByAuthor = works.filter((work) => work.authorHandle === handle);
  const remixes = allByAuthor.filter((work) => work.remixOf);
  const liked = readLocal<string[]>(LS_KEYS.liked, []);
  const saved = readLocal<string[]>(LS_KEYS.saved, []);
  const likedWorks = useMemo(
    () => works.filter((work) => liked.includes(work.id)),
    [liked],
  );
  const savedWorks = useMemo(
    () => works.filter((work) => saved.includes(work.id)),
    [saved],
  );
  const totalLikes = allByAuthor.reduce((sum, work) => sum + work.stats.likes, 0);
  const tools = Array.from(
    new Set([...(creator?.tools ?? []), ...allByAuthor.flatMap((work) => work.tools)]),
  ).slice(0, 6);
  const badges = isCurrent
    ? allByAuthor.length
      ? ["第一件作品"]
      : ["刚刚开始"]
    : creator?.badges ?? [];
  const tabs: { value: ProfileTab; label: string; count?: number }[] = [
    { value: "works", label: "作品", count: allByAuthor.length },
    { value: "remix", label: "二创", count: remixes.length },
    ...(isCurrent
      ? [
          { value: "saved" as const, label: "收藏", count: savedWorks.length },
          ...(settings.showLikes
            ? [{ value: "liked" as const, label: "喜欢", count: likedWorks.length }]
            : []),
        ]
      : []),
    { value: "about", label: "关于" },
  ];
  const currentList =
    tab === "works"
      ? allByAuthor
      : tab === "remix"
        ? remixes
        : tab === "saved"
          ? savedWorks
          : tab === "liked"
            ? likedWorks
            : [];

  const timeline = useMemo(() => {
    const map = new Map<string, Work[]>();
    for (const work of [...allByAuthor].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )) {
      const date = new Date(work.createdAt);
      const key = `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`;
      map.set(key, [...(map.get(key) ?? []), work]);
    }
    return Array.from(map.entries());
  }, [allByAuthor]);

  return (
    <div className="profile-page">
      <section className="profile-hero" style={{ "--profile-color": avatarColor } as CSSProperties}>
        <div className="profile-cover" aria-hidden="true">
          <span>{avatarText}</span>
          <span className="profile-cover__code">{isCurrent ? "YOU / 2026" : "CREATOR / 2026"}</span>
        </div>
        <div className="container profile-hero__body">
          <div className="profile-avatar">
            <Avatar name={name} text={avatarText} color={avatarColor} size="xl" />
          </div>
          <div className="profile-id">
            <span className="eyebrow">{role}</span>
            <h1>{name}</h1>
            <div className="profile-handle">
              @{handle}
              <span>
                <MapPin size={12} />
                {location}
              </span>
              <span>加入于 {joined}</span>
            </div>
            <p className="profile-bio">{bio}</p>
            <div className="profile-links">
              {creator?.links.map((link) => (
                <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label}
                  <ArrowRight size={12} />
                </a>
              ))}
              {isCurrent && settings.links ? <span>{settings.links}</span> : null}
            </div>
          </div>
          <div className="profile-actions">
            {isCurrent ? (
              <Link className="btn btn--outline btn--sm" to="/settings">
                <Settings2 size={14} />
                编辑主页
              </Link>
            ) : (
              <button
                type="button"
                className={isFollowing ? "btn btn--outline btn--sm is-following" : "btn btn--primary btn--sm"}
                aria-pressed={isFollowing}
                onClick={() => {
                  setFollowed((prev) =>
                    isFollowing ? prev.filter((item) => item !== handle) : [...prev, handle],
                  );
                  toast({
                    title: isFollowing ? `已取消关注 ${name}` : `关注了 ${name}`,
                    desc: isFollowing ? "之后的新作品不会再优先出现。" : "新作品会优先出现在你的首页。",
                  });
                }}
              >
                {isFollowing ? <Check size={14} /> : <Plus size={14} />}
                {isFollowing ? "已关注" : "关注"}
              </button>
            )}
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setContactOpen(true)}>
              <MessageCircle size={14} />
              合作邀请
            </button>
          </div>
        </div>
      </section>

      <div className="container profile-body">
        <div className="profile-stats">
          <div>
            <strong>{allByAuthor.length}</strong>
            <span>作品</span>
          </div>
          <div>
            <strong>{formatCount(totalLikes)}</strong>
            <span>被喜欢</span>
          </div>
          <div>
            <strong>{formatCount(isCurrent ? 0 : creator?.stats.followers ?? 0)}</strong>
            <span>关注者</span>
          </div>
          <div>
            <strong>{tools.length}</strong>
            <span>常用工具</span>
          </div>
        </div>

        <div className="profile-tabs" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              className={tab === item.value ? "profile-tab is-active" : "profile-tab"}
              onClick={() => setTab(item.value)}
            >
              {item.label}
              {typeof item.count === "number" ? <span>{item.count}</span> : null}
            </button>
          ))}
        </div>

        {tab === "about" ? (
          <div className="profile-about">
            <section>
              <span className="eyebrow">ABOUT / 关于</span>
              <h2>在做的东西</h2>
              <p>{bio}</p>
              <div className="profile-about__row">
                <span>所在地</span>
                <strong>{location}</strong>
              </div>
              <div className="profile-about__row">
                <span>加入时间</span>
                <strong>{joined}</strong>
              </div>
              <div className="profile-about__row">
                <span>常用工具</span>
                <strong>{tools.join(" / ") || "还没有公开"}</strong>
              </div>
              <div className="profile-badges">
                {badges.map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              </div>
            </section>
            <section>
              <span className="eyebrow">TIMELINE / 创作年表</span>
              <h2>从第一件开始</h2>
              {timeline.length ? (
                <div className="profile-timeline">
                  {timeline.map(([month, items]) => (
                    <div key={month}>
                      <strong>{month}</strong>
                      {items.map((work) => (
                        <Link key={work.id} to={workLink(work)}>
                          <span>{WORK_TYPE_CONFIG[work.type].label}</span>
                          {work.title}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="detail-empty-text">还没有作品。第一件不用很大，能打开就行。</p>
              )}
            </section>
          </div>
        ) : currentList.length ? (
          <div className="profile-work-grid">
            {currentList.map((work) => (
              <WorkCard key={work.id} work={work} ratio="wide" />
            ))}
          </div>
        ) : (
          <EmptyState
            glyph="空"
            title={tab === "saved" ? "还没有收藏" : tab === "liked" ? "还没有喜欢" : tab === "remix" ? "还没有二创" : "还没有作品"}
            desc={
              isCurrent
                ? "你的第一件作品不用完美，能打开、能拆开看就行。"
                : "这位创作者还在准备第一件作品。"
            }
            actions={
              isCurrent ? (
                <Link className="btn btn--primary" to="/create">
                  发布第一件
                </Link>
              ) : (
                <Link className="btn btn--outline" to="/discover">
                  去发现页逛逛
                </Link>
              )
            }
          />
        )}

        <section className="profile-invite">
          <div>
            <span className="eyebrow">COLLAB / 共创邀请</span>
            <h2>想一起做点什么？</h2>
            <p>可以借一个世界观，也可以只借一个限制。合作作品会同时出现在两个人的主页。</p>
          </div>
          <button type="button" className="btn btn--outline" onClick={() => setContactOpen(true)}>
            <MessageCircle size={15} />
            发起邀请
          </button>
        </section>
      </div>

      {contactOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setContactOpen(false)}>
          <div className="modal contact-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal__head">
              <div>
                <span className="eyebrow">COLLAB / 合作</span>
                <h2>给 {name} 发一条邀请</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setContactOpen(false)} aria-label="关闭">
                <X size={18} />
              </button>
            </div>
            <p className="modal__desc">
              演示版不接私信。可以复制下面这段邀请，通过作者公开链接联系。
            </p>
            <div className="contact-copy">
              <p>
                你好，我在灵作看到《{allByAuthor[0]?.title ?? "你的作品"}》。想邀请你一起做一个短篇，
                我负责分镜，你负责世界观。如果你有兴趣，我们可以先从一条 30 秒的试片开始。
              </p>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={async () => {
                  const ok = await copyText(
                    `你好，我在灵作看到《${allByAuthor[0]?.title ?? "你的作品"}》。想邀请你一起做一个短篇。`,
                  );
                  toast({ title: ok ? "邀请文案已复制" : "复制失败", desc: "可以附在邮件或社交私信里。" });
                }}
              >
                <Copy size={13} />
                复制邀请
              </button>
            </div>
            <div className="modal__actions">
              <button type="button" className="btn btn--primary" onClick={() => setContactOpen(false)}>
                知道了
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
