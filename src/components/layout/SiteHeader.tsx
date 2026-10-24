import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Bell, LogIn, Menu, Palette, Plus, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { useAuth } from "@/components/auth/AuthProvider";
import { GlobalSearchBox } from "@/components/search/GlobalSearchBox";
import { useSearch } from "@/components/search/SearchProvider";
import { CURRENT_USER, PRIMARY_NAV, SITE } from "@/data/config";
import { THEMES, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const location = useLocation();
  const { openSearch } = useSearch();
  const { user, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const currentTheme = THEMES.find((item) => item.id === theme) ?? THEMES[0];
  const nextTheme = THEMES[(THEMES.findIndex((item) => item.id === theme) + 1) % THEMES.length];

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navClass = ({ isActive }: { isActive: boolean }) => cn("nav-link", isActive && "is-active");

  return (
    <header className="site-header">
      <div className="header-inner container">
        <Link className="wordmark" to="/" aria-label={`${SITE.name} 首页`}>
          <span className="wordmark__name">{SITE.name}</span>
          <span className="wordmark__seal">{SITE.latin}</span>
        </Link>

        <nav className="primary-nav" aria-label="主导航">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={navClass}
              end={item.href === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <div className="header-search">
            <GlobalSearchBox />
          </div>
          <button
            type="button"
            className="icon-btn header-search-icon"
            onClick={openSearch}
            aria-label="打开全站搜索"
          >
            <Search size={20} />
          </button>
          <button
            type="button"
            className="icon-btn header-style"
            onClick={() => setTheme(nextTheme.id)}
            aria-label={`切换网站风格，当前${currentTheme.label}`}
            title={`切换风格：当前${currentTheme.label}，下一个${nextTheme.label}`}
          >
            <Palette size={19} />
          </button>
          <Link className="icon-btn header-message" to="/notifications" aria-label="消息">
            <Bell size={19} />
            <span className="unread-dot" aria-hidden="true" />
          </Link>
          <Link className="btn btn--primary btn--sm header-publish" to="/create">
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            发布作品
          </Link>
          {user ? (
            <Link className="header-avatar" to="/account" aria-label={`${profile?.name ?? "我的"} 的账号`}>
              <Avatar
                name={profile?.name ?? "我"}
                text={(profile?.name ?? "我").slice(0, 1)}
                color={CURRENT_USER.avatarColor}
                size="sm"
              />
            </Link>
          ) : (
            <Link className="btn btn--outline btn--sm header-login" to="/login">
              <LogIn size={14} />
              登录
            </Link>
          )}
          <button
            type="button"
            className={cn("icon-btn nav-toggle", menuOpen && "is-active")}
            aria-label={menuOpen ? "关闭分类菜单" : "打开分类菜单"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="nav-backdrop"
            aria-label="关闭菜单"
            onClick={() => setMenuOpen(false)}
          />
          <div className="nav-dropdown">
            <div className="nav-dropdown__inner container">
              <div className="nav-dropdown__col">
                <span className="nav-dropdown__label">逛</span>
                {PRIMARY_NAV.map((item) => (
                  <NavLink key={item.href} to={item.href} className={navClass} end={item.href === "/"}>
                    {item.label}
                    <span aria-hidden="true">↗</span>
                  </NavLink>
                ))}
              </div>
              <div className="nav-dropdown__col">
                <span className="nav-dropdown__label">做</span>
                <Link className="nav-dropdown__link" to="/create">
                  发布作品
                </Link>
                <Link className="nav-dropdown__link" to="/create/post">
                  发布动态
                </Link>
                <Link className="nav-dropdown__link" to="/challenges">
                  本周挑战
                </Link>
                <Link className="nav-dropdown__link" to="/me">
                  我的工作台
                </Link>
              </div>
              <div className="nav-dropdown__note">
                <span className="eyebrow">ONE SEARCH, WHOLE SITE</span>
                <p>全站只有一个搜索入口。想找具体内容，直接用顶栏搜索，不用先选分类。</p>
                <button type="button" className="btn btn--outline btn--sm" onClick={openSearch}>
                  <Search size={15} />
                  打开搜索
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
