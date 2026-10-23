import { Link } from "react-router-dom";
import { ArrowUp, Asterisk } from "lucide-react";
import { SITE } from "@/data/config";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

const columns = [
  {
    title: "逛",
    links: [
      { label: "首页", to: "/" },
      { label: "发现", to: "/discover" },
      { label: "统一搜索", to: "/search" },
      { label: "配方库", to: "/recipes" },
      { label: "本周挑战", to: "/challenges" },
    ],
  },
  {
    title: "关于",
    links: [
      { label: "关于灵作", to: "/about" },
      { label: "社区规范", to: "/guidelines" },
      { label: "AI 使用声明", to: "/ai-policy" },
      { label: "联系编辑部", to: "/about#contact" },
    ],
  },
  {
    title: "做",
    links: [
      { label: "发布作品", to: "/create" },
      { label: "发布动态", to: "/create/post" },
      { label: "我的工作台", to: "/me" },
      { label: "收藏夹", to: "/me" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-wordmark">
              {SITE.name}
              <Asterisk size={28} className="footer-star" aria-hidden="true" />
            </div>
            <p className="footer-latin">{SITE.latin}</p>
            <p className="footer-tagline">
              把 AI 作品变成可玩、可读、可学、可二创的分享社区。
              <br />
              每个作品都可以带配方，每个人都能接力。
            </p>
            <div className="footer-tags">
              <span>配方公开</span>
              <span>AI 声明可见</span>
              <span>不自动播放声音</span>
            </div>
            <ThemeSwitcher compact />
          </div>
          {columns.map((column) => (
            <div key={column.title} className="footer-col">
              <h3>{column.title}</h3>
              {column.links.map((link) => (
                <Link key={link.label} to={link.to} className="footer-link">
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© 2026 灵作 · MADE WITH AI</span>
          <span>演示项目：作品、作者与数据均为虚构示例</span>
          <span className="footer-ai">含 AI 生成内容</span>
          <button
            type="button"
            className="footer-top-link"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            回到顶部 <ArrowUp size={13} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="footer-watermark" aria-hidden="true">
        <span>灵</span>
        <span>作</span>
      </div>
    </footer>
  );
}
