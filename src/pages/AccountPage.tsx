import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { WorkCard } from "@/components/work/WorkCard";
import { works } from "@/data/seed";
import { useToast } from "@/components/ui/Toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { timeAgo } from "@/lib/utils";

export function AccountPage() {
  useDocumentTitle("我的账号 · 灵作");
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (loading) {
    return <div className="account-loading">正在读取账号…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;

  const name = profile?.name ?? user.email?.split("@")[0] ?? "灵作用户";
  const handle = profile?.handle ?? "";
  const myWorks = profile ? works.filter((work) => work.authorHandle === profile.handle) : [];

  return (
    <div className="account-page">
      <div className="container">
        <Link className="auth-back" to="/">
          <ArrowLeft size={15} />
          回灵作
        </Link>

        <div className="account-hero">
          <div className="account-avatar">{name.slice(0, 1)}</div>
          <div>
            <span className="eyebrow">ACCOUNT / 真实账号</span>
            <h1>{name}</h1>
            <p>{handle ? `@${handle}` : user.email}</p>
          </div>
          <div className="account-hero__actions">
            <Link className="btn btn--outline btn--sm" to="/settings">
              账号设置
            </Link>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await signOut();
                setBusy(false);
                toast({ title: "已退出登录" });
                navigate("/");
              }}
            >
              <LogOut size={14} />
              退出登录
            </button>
          </div>
        </div>

        <div className="account-grid">
          <section className="account-card">
            <span className="eyebrow">IDENTITY / 身份</span>
            <div className="account-row">
              <UserRound size={15} />
              <span>用户名</span>
              <strong>{handle ? `@${handle}` : "同步中"}</strong>
            </div>
            <div className="account-row">
              <Mail size={15} />
              <span>邮箱</span>
              <strong>{user.email}</strong>
            </div>
            <div className="account-row">
              <ShieldCheck size={15} />
              <span>状态</span>
              <strong>{user.email_confirmed_at ? "邮箱已验证" : "等待验证"}</strong>
            </div>
            <div className="account-row">
              <span className="auth-prefix">ID</span>
              <span>用户 ID</span>
              <strong className="account-id">{user.id}</strong>
            </div>
            <p className="account-note">
              账号由 Supabase Auth 管理。资料会保存在 Postgres，作品、评论和关注正在从本地演示数据迁移。
            </p>
          </section>

          <section className="account-card">
            <span className="eyebrow">PUBLISH / 发布</span>
            <h2>{myWorks.length ? "继续做下一件。" : "你的主页还差作品。"}</h2>
            <p>作品会直接写入 Supabase，封面和视频上传到 Storage，其他访客刷新后就能看到。</p>
            <div className="account-links">
              <Link className="btn btn--primary btn--sm" to="/create">
                发布作品
                <ArrowRight size={14} />
              </Link>
              {myWorks.length ? (
                <a className="btn btn--outline btn--sm" href="#account-works">
                  查看我的作品
                </a>
              ) : null}
            </div>
          </section>
        </div>

        <section className="account-works" id="account-works">
          <div className="account-works__head">
            <div>
              <span className="eyebrow">WORKS / 我的作品</span>
              <h2>{myWorks.length} 件</h2>
            </div>
            <Link className="btn btn--outline btn--sm" to="/create">
              新建作品
              <ArrowRight size={14} />
            </Link>
          </div>
          {myWorks.length ? (
            <div className="account-works__grid">
              {myWorks.map((work) => (
                <WorkCard key={work.id} work={work} ratio="type" />
              ))}
            </div>
          ) : (
            <div className="account-works__empty">
              <p>还没有发布作品。第一件不用很大，能打开就行。</p>
              <Link className="btn btn--primary btn--sm" to="/create">
                去发布
              </Link>
            </div>
          )}
        </section>

        <p className="account-foot">
          注册于 {timeAgo(user.created_at)}前 · 这是一个真实账号，不再使用演示用户「林一」。
        </p>
      </div>
    </div>
  );
}
