import { Bell, Compass, Home, Plus, User } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "首页", href: "/", icon: Home, end: true },
  { label: "发现", href: "/discover", icon: Compass, end: false },
  { label: "消息", href: "/notifications", icon: Bell, end: false },
  { label: "我的", href: "/me", icon: User, end: false },
];

export function MobileTabBar() {
  return (
    <nav className="mobile-tabbar" aria-label="移动端导航">
      {tabs.slice(0, 2).map((tab) => (
        <NavLink
          key={tab.href}
          to={tab.href}
          end={tab.end}
          className={({ isActive }) => cn("mobile-tab", isActive && "is-active")}
        >
          <tab.icon size={20} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
      <Link className="mobile-tab mobile-tab--publish" to="/create" aria-label="发布作品">
        <span className="mobile-tab__plus">
          <Plus size={24} strokeWidth={2.5} />
        </span>
        <span>发布</span>
      </Link>
      {tabs.slice(2).map((tab) => (
        <NavLink
          key={tab.href}
          to={tab.href}
          end={tab.end}
          className={({ isActive }) => cn("mobile-tab", isActive && "is-active")}
        >
          <tab.icon size={20} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
