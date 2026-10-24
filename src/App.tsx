import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { SearchProvider } from "@/components/search/SearchProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { AppErrorBoundary } from "@/components/ui/AppErrorBoundary";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { HomePage } from "@/pages/HomePage";
import { SITE } from "@/data/config";
import { creatorMap, postMap, toolMap, workBySlug } from "@/data/seed";
import { track } from "@/lib/analytics";

const DiscoverPage = lazy(() => import("@/pages/DiscoverPage").then((m) => ({ default: m.DiscoverPage })));
const SearchPage = lazy(() => import("@/pages/SearchPage").then((m) => ({ default: m.SearchPage })));
const CategoryPage = lazy(() => import("@/pages/CategoryPage").then((m) => ({ default: m.CategoryPage })));
const ToolsPage = lazy(() => import("@/pages/ToolsPage").then((m) => ({ default: m.ToolsPage })));
const RecipesPage = lazy(() => import("@/pages/RecipesPage").then((m) => ({ default: m.RecipesPage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));
const CreateIndexPage = lazy(() => import("@/pages/CreateIndexPage").then((m) => ({ default: m.CreateIndexPage })));
const CreateEditorPage = lazy(() => import("@/pages/CreateEditorPage").then((m) => ({ default: m.CreateEditorPage })));
const CreatePostPage = lazy(() => import("@/pages/CreatePostPage").then((m) => ({ default: m.CreatePostPage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const MePage = lazy(() => import("@/pages/MePage").then((m) => ({ default: m.MePage })));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const TrashPage = lazy(() => import("@/pages/TrashPage").then((m) => ({ default: m.TrashPage })));
const WorkVersionsPage = lazy(() => import("@/pages/WorkVersionsPage").then((m) => ({ default: m.WorkVersionsPage })));
const LoginPage = lazy(() => import("@/pages/AuthPages").then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import("@/pages/AuthPages").then((m) => ({ default: m.SignupPage })));
const AccountPage = lazy(() => import("@/pages/AccountPage").then((m) => ({ default: m.AccountPage })));
const AboutPage = lazy(() => import("@/pages/StaticPages").then((m) => ({ default: m.AboutPage })));
const GuidelinesPage = lazy(() => import("@/pages/StaticPages").then((m) => ({ default: m.GuidelinesPage })));
const AiPolicyPage = lazy(() => import("@/pages/StaticPages").then((m) => ({ default: m.AiPolicyPage })));
const GameDetailPage = lazy(() => import("@/pages/GameDetailPage").then((m) => ({ default: m.GameDetailPage })));
const GamePlayPage = lazy(() => import("@/pages/GamePlayPage").then((m) => ({ default: m.GamePlayPage })));
const DramaDetailPage = lazy(() => import("@/pages/DramaDetailPage").then((m) => ({ default: m.DramaDetailPage })));
const DramaWatchPage = lazy(() => import("@/pages/DramaWatchPage").then((m) => ({ default: m.DramaWatchPage })));
const NovelDetailPage = lazy(() => import("@/pages/NovelDetailPage").then((m) => ({ default: m.NovelDetailPage })));
const NovelReaderPage = lazy(() => import("@/pages/NovelReaderPage").then((m) => ({ default: m.NovelReaderPage })));
const TutorialDetailPage = lazy(() => import("@/pages/TutorialDetailPage").then((m) => ({ default: m.TutorialDetailPage })));
const ToolDetailPage = lazy(() => import("@/pages/ToolDetailPage").then((m) => ({ default: m.ToolDetailPage })));
const PostDetailPage = lazy(() => import("@/pages/PostDetailPage").then((m) => ({ default: m.PostDetailPage })));
const TopicPage = lazy(() => import("@/pages/TopicPage").then((m) => ({ default: m.TopicPage })));
const CollectionPage = lazy(() => import("@/pages/CollectionPage").then((m) => ({ default: m.CollectionPage })));
const ChallengeListPage = lazy(() => import("@/pages/ChallengeListPage").then((m) => ({ default: m.ChallengeListPage })));
const ChallengeDetailPage = lazy(() => import("@/pages/ChallengeDetailPage").then((m) => ({ default: m.ChallengeDetailPage })));

function ScrollManager() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const frame = window.requestAnimationFrame(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo({ top: 0, behavior: "auto" });
        }
      });
      return () => window.cancelAnimationFrame(frame);
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname, location.hash]);
  return null;
}

function setMeta(name: string, content: string, property = false): void {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(property ? "property" : "name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function MetaManager() {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    let title = SITE.name;
    let description = SITE.description;
    let type = "website";
    let ogImage = "/og-default.png";
    let ogAlt = `${SITE.name} · ${SITE.tagline}`;

    const detail = path.match(/^\/(games|dramas|novels|tutorials)\/([^/]+)/);
    if (detail) {
      const work = workBySlug.get(`${detail[1].slice(0, -1)}/${decodeURIComponent(detail[2])}`);
      if (work) {
        title = work.title;
        description = work.summary;
        type = "article";
        if (!work.id.startsWith("u-")) {
          ogImage = `/og/${work.type}-${work.slug}.png`;
          ogAlt = `${work.title} · ${work.summary}`;
        }
      }
    } else if (path.startsWith("/posts/")) {
      const post = postMap.get(decodeURIComponent(path.split("/")[2] ?? ""));
      if (post) {
        title = post.title;
        description = post.excerpt;
        type = "article";
      }
    } else if (path.startsWith("/tools/")) {
      const tool = toolMap.get(decodeURIComponent(path.split("/")[2] ?? ""));
      if (tool) {
        title = tool.name;
        description = tool.tagline;
      }
    } else if (path.startsWith("/u/")) {
      const creator = creatorMap.get(decodeURIComponent(path.split("/")[2] ?? ""));
      if (creator) {
        title = creator.name;
        description = creator.bio;
        type = "profile";
      }
    }

    const fullTitle =
      title === SITE.name
        ? `${SITE.name} · ${SITE.latin}`
        : title.includes("灵作")
          ? title
          : `${title} · 灵作`;
    setMeta("description", description);
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:type", type, true);
    setMeta("og:site_name", "灵作", true);
    setMeta("og:url", window.location.href, true);
    setMeta("og:image", `${window.location.origin}${ogImage}`, true);
    setMeta("og:image:width", "1200", true);
    setMeta("og:image:height", "630", true);
    setMeta("og:image:alt", ogAlt, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image", `${window.location.origin}${ogImage}`);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;
    track("page_view", { path, title: fullTitle });
  }, [location.pathname]);
  return null;
}

function RouteLoading() {
  return (
    <div className="route-loading" aria-live="polite">
      <span className="route-loading__mark" aria-hidden="true">灵</span>
      <span>正在打开这一页…</span>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const immersive = /^\/(games\/.+\/play|dramas\/.+\/watch|novels\/.+\/read\/.+)$/.test(
    location.pathname,
  );
  return (
    <>
      {!immersive ? (
        <a className="skip-link" href="#main">
          跳到主要内容
        </a>
      ) : null}
      {!immersive ? <SiteHeader /> : null}
      <main
        id="main"
        className={immersive ? "page-enter page-enter--immersive" : "page-enter"}
        key={location.pathname}
      >
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/search" element={<SearchPage />} />

            <Route path="/games" element={<CategoryPage type="game" />} />
            <Route path="/games/:slug" element={<GameDetailPage />} />
            <Route path="/games/:slug/play" element={<GamePlayPage />} />

            <Route path="/dramas" element={<CategoryPage type="drama" />} />
            <Route path="/dramas/:slug" element={<DramaDetailPage />} />
            <Route path="/dramas/:slug/watch" element={<DramaWatchPage />} />

            <Route path="/novels" element={<CategoryPage type="novel" />} />
            <Route path="/novels/:slug" element={<NovelDetailPage />} />
            <Route path="/novels/:slug/read/:chapter" element={<NovelReaderPage />} />

            <Route path="/tutorials" element={<CategoryPage type="tutorial" />} />
            <Route path="/tutorials/:slug" element={<TutorialDetailPage />} />

            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/tools/:slug" element={<ToolDetailPage />} />

            <Route path="/posts/:id" element={<PostDetailPage />} />
            <Route path="/collections/:id" element={<CollectionPage />} />
            <Route path="/topics/:tag" element={<TopicPage />} />
            <Route path="/challenges" element={<ChallengeListPage />} />
            <Route path="/challenges/:slug" element={<ChallengeDetailPage />} />

            <Route path="/create" element={<CreateIndexPage />} />
            <Route path="/create/post" element={<CreatePostPage />} />
            <Route path="/create/:type" element={<CreateEditorPage />} />

            <Route path="/u/:handle" element={<ProfilePage />} />
            <Route path="/me" element={<MePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/trash" element={<TrashPage />} />
            <Route path="/works/:id/versions" element={<WorkVersionsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/account" element={<AccountPage />} />

            <Route path="/about" element={<AboutPage />} />
            <Route path="/guidelines" element={<GuidelinesPage />} />
            <Route path="/ai-policy" element={<AiPolicyPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      {!immersive ? <SiteFooter /> : null}
      {!immersive ? <MobileTabBar /> : null}
      <ScrollManager />
      <MetaManager />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <SearchProvider>
            <AppErrorBoundary>
              <AppShell />
            </AppErrorBoundary>
          </SearchProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
