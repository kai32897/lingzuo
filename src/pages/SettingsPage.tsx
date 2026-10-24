import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Bell, Info, Lock, Palette, Save, SlidersHorizontal, Sparkles, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { loadSettings, saveSettings, type UserSettings } from "@/lib/userContent";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function SettingsPage() {
  useDocumentTitle("设置 · 灵作");
  const { toast } = useToast();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const update = (patch: Partial<UserSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
    setSaved(false);
  };

  useEffect(() => {
    if (!profile) return;
    setSettings((current) => ({
      ...current,
      name: profile.name,
      bio: profile.bio,
      location: profile.location,
      links: profile.links,
    }));
  }, [profile]);

  if (loading) return <div className="account-loading">正在读取资料…</div>;
  if (!user) return <Navigate to="/login" replace />;

  const save = async () => {
    setSaving(true);
    let failed = false;
    if (supabase) {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: settings.name.trim(),
          bio: settings.bio.trim(),
          location: settings.location.trim(),
          links: settings.links.trim(),
        })
        .eq("id", user.id);
      if (error) {
        failed = true;
        toast({ title: "资料保存失败", desc: error.message, tone: "ink" });
      }
    }
    saveSettings(settings);
    if (!failed) {
      await refreshProfile();
      setSaved(true);
      toast({ title: "设置已保存", desc: "公开资料已经同步到账号。", tone: "game" });
    }
    setSaving(false);
  };

  return (
    <div className="settings-page">
      <div className="container settings-layout">
        <aside className="settings-nav">
          <span className="eyebrow">SETTINGS / 设置</span>
          <a href="#appearance"><Palette size={15} /> 外观风格</a>
          <a href="#profile"><UserRound size={15} /> 公开资料</a>
          <a href="#recommend"><SlidersHorizontal size={15} /> 推荐偏好</a>
          <a href="#privacy"><Lock size={15} /> 隐私</a>
          <a href="#ai"><Sparkles size={15} /> AI 默认值</a>
          <a href="#notifications"><Bell size={15} /> 通知</a>
          <div className="settings-nav__note">
            <Info size={13} />
            所有设置只保存在本地浏览器，演示版不接后端。
          </div>
        </aside>

        <div className="settings-main">
          <div className="settings-head">
            <div>
              <span className="eyebrow">ACCOUNT / @{profile?.handle ?? "me"}</span>
              <h1>设置</h1>
              <p>改完之后记得保存。资料会显示在公开主页和作品详情里。</p>
            </div>
            <Link className="text-btn" to={profile?.handle ? `/u/${profile.handle}` : "/account"}>看公开主页</Link>
          </div>

          <section className="settings-section" id="appearance">
            <div className="settings-section__head">
              <h2>外观风格</h2>
              <span>立刻生效 · 本地保存</span>
            </div>
            <ThemeSwitcher />
            <p className="settings-small">风格只影响界面，不会改变作品数据和发布内容。</p>
          </section>

          <section className="settings-section" id="profile">
            <div className="settings-section__head">
              <h2>公开资料</h2>
              <span>所有人可见</span>
            </div>
            <div className="settings-avatar-row">
              <Avatar name={settings.name} text={settings.name.slice(0, 1)} color="#2F4BFF" size="xl" />
              <div>
                <strong>{settings.name}</strong>
                <span>@{profile?.handle ?? "me"}</span>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => toast({ title: "演示版暂不支持上传头像", desc: "用名字的第一个字作为头像。" })}
                >
                  更换头像
                </button>
              </div>
            </div>
            <label className="form-field">
              <span className="form-field__label">昵称</span>
              <input value={settings.name} onChange={(event) => update({ name: event.target.value })} maxLength={20} />
            </label>
            <label className="form-field">
              <span className="form-field__label">简介</span>
              <textarea value={settings.bio} onChange={(event) => update({ bio: event.target.value })} rows={3} maxLength={160} />
            </label>
            <div className="field-row">
              <label className="form-field">
                <span className="form-field__label">所在地</span>
                <input value={settings.location} onChange={(event) => update({ location: event.target.value })} />
              </label>
              <label className="form-field">
                <span className="form-field__label">联系邮箱</span>
                <input value={settings.email} onChange={(event) => update({ email: event.target.value })} placeholder="不会公开展示" />
              </label>
            </div>
            <label className="form-field">
              <span className="form-field__label">公开链接</span>
              <input value={settings.links} onChange={(event) => update({ links: event.target.value })} placeholder="个人站、社交主页，用逗号分隔" />
            </label>
          </section>

          <section className="settings-section" id="recommend">
            <div className="settings-section__head">
              <h2>推荐偏好</h2>
              <span>只影响首页推荐</span>
            </div>
            <div className="settings-range">
              <div>
                <span>探索比例</span>
                <strong>{settings.explore}%</strong>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={settings.explore}
                onChange={(event) => update({ explore: Number(event.target.value) })}
              />
              <p>{settings.explore < 30 ? "更偏熟悉的口味。" : settings.explore < 70 ? "熟悉的，加一点没见过的。" : "多给我看没刷到过的。"}</p>
            </div>
            <div className="settings-toggle">
              <div>
                <strong>在主页显示我的喜欢</strong>
                <span>关闭后，公开主页不会出现「喜欢」列表。</span>
              </div>
              <button
                type="button"
                className={cn("toggle", settings.showLikes && "is-on")}
                aria-pressed={settings.showLikes}
                onClick={() => update({ showLikes: !settings.showLikes })}
              >
                <span />
              </button>
            </div>
          </section>

          <section className="settings-section" id="privacy">
            <div className="settings-section__head">
              <h2>隐私</h2>
              <span>演示版只使用本地存储</span>
            </div>
            <div className="settings-note">
              <Lock size={15} />
              <p>
                生日、手机号、真实姓名不会收集。草稿只有你自己能看到，不会出现在搜索、发现或公开主页。
              </p>
            </div>
          </section>

          <section className="settings-section" id="ai">
            <div className="settings-section__head">
              <h2>AI 默认值</h2>
              <span>发布时仍然可以改</span>
            </div>
            <label className="form-field">
              <span className="form-field__label">默认 AI 声明</span>
              <select value={settings.defaultAiDisclosure} onChange={(event) => update({ defaultAiDisclosure: event.target.value })}>
                <option>含 AI 生成内容</option>
                <option>含 AI 生成图像</option>
                <option>含 AI 生成文本</option>
                <option>含 AI 生成影像、配音</option>
                <option>AI 辅助，主体为人工创作</option>
              </select>
            </label>
            <div className="field-row">
              <label className="form-field">
                <span className="form-field__label">默认二创权限</span>
                <select value={settings.defaultLicense} onChange={(event) => update({ defaultLicense: event.target.value as UserSettings["defaultLicense"] })}>
                  <option>允许二创（需署名）</option>
                  <option>仅非商业二创</option>
                  <option>不可二创</option>
                </select>
              </label>
              <label className="form-field">
                <span className="form-field__label">默认提示词可见性</span>
                <select value={settings.defaultVisibility} onChange={(event) => update({ defaultVisibility: event.target.value as UserSettings["defaultVisibility"] })}>
                  <option>完全公开</option>
                  <option>部分公开</option>
                  <option>仅展示思路</option>
                </select>
              </label>
            </div>
            <p className="settings-small">AI 声明会显示在作品详情和分享海报上，不能隐藏。</p>
          </section>

          <section className="settings-section" id="notifications">
            <div className="settings-section__head">
              <h2>通知</h2>
              <span>邮件通知在演示版不可用</span>
            </div>
            {[
              { key: "notifyLikes" as const, label: "有人喜欢我的作品" },
              { key: "notifyComments" as const, label: "有人评论或回复我" },
              { key: "notifyFollows" as const, label: "有人关注我" },
              { key: "notifySystem" as const, label: "挑战、系统与编辑部消息" },
            ].map((item) => (
              <div key={item.key} className="settings-toggle">
                <div>
                  <strong>{item.label}</strong>
                </div>
                <button
                  type="button"
                  className={cn("toggle", settings[item.key] && "is-on")}
                  aria-pressed={settings[item.key]}
                  onClick={() => update({ [item.key]: !settings[item.key] })}
                >
                  <span />
                </button>
              </div>
            ))}
          </section>

          <div className="settings-save">
            <span>{saved ? "已保存到这个浏览器" : "有修改还没保存"}</span>
            <button
              type="button"
              className="btn btn--primary"
              disabled={saving}
              onClick={() => void save()}
            >
              <Save size={15} />
              {saving ? "保存中…" : "保存设置"}
            </button>
          </div>
          <p className="settings-foot">
            昵称、简介、所在地和公开链接会同步到 Supabase 账号；推荐偏好和通知开关只保存在这个浏览器。
          </p>
        </div>
      </div>
    </div>
  );
}
