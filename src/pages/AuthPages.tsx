import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

function AuthShell({ children, title, eyebrow }: { children: ReactNode; title: string; eyebrow: string }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link className="auth-back" to="/">
          <ArrowLeft size={15} />
          回灵作
        </Link>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children}
      </div>
      <div className="auth-aside" aria-hidden="true">
        <span className="auth-aside__mark">灵</span>
        <p>每个作品都可以带配方，<br />每个人都能接力。</p>
        <small>MADE WITH AI / 2026</small>
      </div>
    </div>
  );
}

export function LoginPage() {
  useDocumentTitle("登录 · 灵作");
  const { configured, user, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) navigate("/account", { replace: true });
  }, [user, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result = await signIn(email, password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast({ title: "登录成功", desc: "欢迎回到灵作。", tone: "game" });
    navigate("/account");
  };

  return (
    <AuthShell eyebrow="SIGN IN / 登录" title="继续你的创作。">
      {!configured ? (
        <div className="auth-warning">
          后端还没有配置。管理员需要先在 `.env.production` 填入 Supabase URL 和 anon key。
        </div>
      ) : null}
      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>邮箱</span>
          <div className="auth-input">
            <Mail size={15} />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
        </label>
        <label>
          <span>密码</span>
          <div className="auth-input">
            <LockKeyhole size={15} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 8 位"
              autoComplete="current-password"
              required
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="显示或隐藏密码">
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="submit" className="btn btn--primary auth-submit" disabled={busy || !configured}>
          {busy ? "登录中…" : "登录"}
          <ArrowRight size={15} />
        </button>
      </form>
      <p className="auth-switch">
        还没有账号？<Link to="/signup">注册一个</Link>
      </p>
    </AuthShell>
  );
}

export function SignupPage() {
  useDocumentTitle("注册 · 灵作");
  const { configured, user, signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [rights, setRights] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user) navigate("/account", { replace: true });
  }, [user, navigate]);

  const handleOk = /^[a-z0-9_]{3,20}$/.test(handle.trim().toLowerCase());
  const valid =
    name.trim().length >= 2 &&
    handleOk &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) &&
    password.length >= 8 &&
    password === confirm &&
    rights;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setError("");
    setBusy(true);
    const result = await signUp({
      email,
      password,
      handle: handle.trim().toLowerCase(),
      name: name.trim(),
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsConfirmation) setDone(true);
    else navigate("/account");
  };

  if (done) {
    return (
      <AuthShell eyebrow="CHECK YOUR EMAIL / 验证邮箱" title="还差一步。">
        <p className="auth-copy">
          验证邮件已经发到 <strong>{email}</strong>。点开邮件里的确认链接后，就可以登录了。
        </p>
        <div className="auth-done">
          <Check size={18} />
          账号已创建，资料还没有公开。
        </div>
        <Link className="btn btn--primary auth-submit" to="/login">
          去登录
          <ArrowRight size={15} />
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="JOIN / 注册" title="留下一个名字。">
      {!configured ? (
        <div className="auth-warning">
          后端还没有配置。管理员需要先在 `.env.production` 填入 Supabase URL 和 anon key。
        </div>
      ) : null}
      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>显示名称</span>
          <div className="auth-input">
            <UserRound size={15} />
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="比如：林一"
              autoComplete="name"
              required
            />
          </div>
        </label>
        <label>
          <span>用户名</span>
          <div className="auth-input">
            <span className="auth-prefix">@</span>
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="linyi"
              autoComplete="username"
              maxLength={20}
              required
            />
          </div>
          <small className={handle && !handleOk ? "auth-hint is-error" : "auth-hint"}>
            3–20 位，小写字母、数字或下划线；会出现在你的主页链接里。
          </small>
        </label>
        <label>
          <span>邮箱</span>
          <div className="auth-input">
            <Mail size={15} />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
        </label>
        <label>
          <span>密码</span>
          <div className="auth-input">
            <LockKeyhole size={15} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 8 位"
              autoComplete="new-password"
              required
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="显示或隐藏密码">
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </label>
        <label>
          <span>确认密码</span>
          <div className="auth-input">
            <LockKeyhole size={15} />
            <input
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="再输入一次"
              autoComplete="new-password"
              required
            />
          </div>
          {confirm && confirm !== password ? <small className="auth-hint is-error">两次密码不一致</small> : null}
        </label>
        <label className="checkbox auth-rights">
          <input type="checkbox" checked={rights} onChange={(event) => setRights(event.target.checked)} />
          我确认发布的内容和素材拥有授权，并会在作品里标明 AI 使用情况。
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="submit" className="btn btn--primary auth-submit" disabled={busy || !valid || !configured}>
          {busy ? "创建中…" : "创建账号"}
          <ArrowRight size={15} />
        </button>
      </form>
      <p className="auth-switch">
        已经有账号？<Link to="/login">直接登录</Link>
      </p>
    </AuthShell>
  );
}
