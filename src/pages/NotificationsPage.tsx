import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AtSign, Bell, CheckCheck, Heart, MessageCircle, RotateCcw, Sparkles, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { workMap } from "@/data/seed";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useLocalStorage } from "@/lib/storage";
import { timeAgo } from "@/lib/utils";
import { workLink } from "@/lib/work";

type NotifType = "like" | "comment" | "follow" | "remix" | "system";

interface Notification {
  id: string;
  type: NotifType;
  actorHandle?: string;
  text: string;
  target?: string;
  createdAt: string;
}

const NOTIFICATIONS: Notification[] = [
  {
    id: "n-1",
    type: "like",
    actorHandle: "luming",
    text: "喜欢了你的动态《便利店夜班》的结局",
    target: "/posts/post-1",
    createdAt: new Date(Date.now() - 0.2 * 86400000).toISOString(),
  },
  {
    id: "n-2",
    type: "comment",
    actorHandle: "chenjiu",
    text: "回复了你的评论：那颗是留给第二天早班的人的",
    target: "/games/bianlidian-yeban#comments",
    createdAt: new Date(Date.now() - 0.4 * 86400000).toISOString(),
  },
  {
    id: "n-3",
    type: "follow",
    actorHandle: "lanqiao",
    text: "关注了你",
    target: "/u/lanqiao",
    createdAt: new Date(Date.now() - 0.8 * 86400000).toISOString(),
  },
  {
    id: "n-4",
    type: "remix",
    actorHandle: "luming",
    text: "用《便利店夜班》做了一件二创：《纸人今晚出嫁》",
    target: workLink(workMap.get("w-d-4")!),
    createdAt: new Date(Date.now() - 1.2 * 86400000).toISOString(),
  },
  {
    id: "n-5",
    type: "system",
    text: "你参加的本周挑战「只有两个按钮的游戏」还剩 2 天截止",
    target: "/challenges/two-buttons",
    createdAt: new Date(Date.now() - 1.5 * 86400000).toISOString(),
  },
  {
    id: "n-6",
    type: "like",
    actorHandle: "xiaoman",
    text: "喜欢了你的作品《便利店夜班》",
    target: "/games/bianlidian-yeban",
    createdAt: new Date(Date.now() - 2.1 * 86400000).toISOString(),
  },
  {
    id: "n-7",
    type: "comment",
    actorHandle: "shenchi",
    text: "在《月亮维修站》下回复：不用修得太好，能亮就行",
    target: "/novels/yueliang-weixiuzhan#comments",
    createdAt: new Date(Date.now() - 3.4 * 86400000).toISOString(),
  },
  {
    id: "n-8",
    type: "system",
    text: "欢迎来到灵作。先去看看今日灵作，或者发一件自己的东西。",
    target: "/",
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];

const TYPE_META: Record<NotifType, { label: string; icon: typeof Heart; color: string }> = {
  like: { label: "喜欢", icon: Heart, color: "#FF5A3C" },
  comment: { label: "评论", icon: MessageCircle, color: "#8FE3FF" },
  follow: { label: "关注", icon: UserPlus, color: "#B9A6FF" },
  remix: { label: "二创", icon: RotateCcw, color: "#D8FF3E" },
  system: { label: "系统", icon: Sparkles, color: "#FFC24B" },
};

export function NotificationsPage() {
  useDocumentTitle("消息 · 灵作");
  const { toast } = useToast();
  const [read, setRead] = useLocalStorage<string[]>("lz:notif-read", []);
  const [tab, setTab] = useState<"all" | "unread" | "social" | "system">("all");
  const unread = NOTIFICATIONS.filter((item) => !read.includes(item.id)).length;
  const list = useMemo(
    () =>
      NOTIFICATIONS.filter((item) => {
        if (tab === "unread") return !read.includes(item.id);
        if (tab === "social") return item.type !== "system";
        if (tab === "system") return item.type === "system";
        return true;
      }),
    [tab, read],
  );

  return (
    <div className="notifications-page">
      <div className="container">
        <div className="notif-head">
          <div>
            <span className="eyebrow">INBOX / 消息</span>
            <h1>消息</h1>
            <p>{unread ? `${unread} 条未读。` : "都看完了。"} 喜欢、评论、关注和系统通知都在这里。</p>
          </div>
          <div className="notif-head__actions">
            <Link className="btn btn--outline btn--sm" to="/settings#notifications">
              通知设置
            </Link>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={!unread}
              onClick={() => {
                setRead(NOTIFICATIONS.map((item) => item.id));
                toast({ title: "全部标为已读", desc: "未读提示会从列表里消失。" });
              }}
            >
              <CheckCheck size={14} />
              全部已读
            </button>
          </div>
        </div>

        <div className="notif-tabs" role="tablist">
          {[
            { value: "all" as const, label: "全部" },
            { value: "unread" as const, label: `未读 ${unread}` },
            { value: "social" as const, label: "互动" },
            { value: "system" as const, label: "系统" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              className={tab === item.value ? "notif-tab is-active" : ""}
              onClick={() => setTab(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="notif-list">
          {list.map((item) => {
            const meta = TYPE_META[item.type];
            const Icon = meta.icon;
            const isUnread = !read.includes(item.id);
            return (
              <Link
                key={item.id}
                to={item.target ?? "/"}
                className={`notif-row ${isUnread ? "is-unread" : ""}`}
                onClick={() => setRead((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]))}
              >
                <span className="notif-row__icon" style={{ background: meta.color }}>
                  <Icon size={15} />
                </span>
                {item.actorHandle ? (
                  <Avatar handle={item.actorHandle} size="sm" />
                ) : (
                  <span className="notif-row__system">
                    <Bell size={14} />
                  </span>
                )}
                <span className="notif-row__copy">
                  <span>{item.text}</span>
                  <small>
                    {meta.label} · {timeAgo(item.createdAt)}
                  </small>
                </span>
                {isUnread ? <span className="unread-dot notif-row__dot" aria-label="未读" /> : null}
              </Link>
            );
          })}
        </div>

        {!list.length ? (
          <div className="notif-empty">
            <AtSign size={20} />
            <p>这里没有消息。去发现页逛逛，或者发一件作品。</p>
            <Link className="arrow-link" to="/discover">
              去发现
            </Link>
          </div>
        ) : null}

        <p className="notif-foot">
          演示版消息为静态示例。真实互动（喜欢、评论、关注、二创）会在这里生成通知。
        </p>
      </div>
    </div>
  );
}
