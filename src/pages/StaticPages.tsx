import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Mail, Sparkles } from "lucide-react";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

function StaticShell({
  eyebrow,
  title,
  lead,
  children,
  toc,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
  toc: { id: string; label: string }[];
}) {
  return (
    <div className="static-page">
      <section className="static-hero">
        <div className="container">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{lead}</p>
        </div>
      </section>
      <div className="container static-layout">
        <aside className="static-toc">
          <span className="eyebrow">ON THIS PAGE</span>
          {toc.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
          <div className="static-toc__note">
            <Sparkles size={13} />
            演示版说明
          </div>
        </aside>
        <article className="static-body">
          {children}
          <div className="static-foot">
            <span>最后更新：2026 年 10 月</span>
            <Link to="/guidelines">社区规范</Link>
            <Link to="/ai-policy">AI 声明</Link>
          </div>
        </article>
      </div>
    </div>
  );
}

export function AboutPage() {
  useDocumentTitle("关于灵作 · 灵作");
  return (
    <StaticShell
      eyebrow="ABOUT / 关于"
      title="让 AI 作品有地方被玩、被拆、被接力。"
      lead="灵作是一个把 AI 作品变成可玩、可读、可学、可二创的分享社区。每个作品都可以带配方，每个人都能接力。"
      toc={[
        { id: "position", label: "我们是什么" },
        { id: "areas", label: "五个区域" },
        { id: "principles", label: "编辑原则" },
        { id: "demo", label: "演示版说明" },
        { id: "contact", label: "联系" },
      ]}
    >
      <section id="position">
        <span className="eyebrow">01 / POSITION</span>
        <h2>不是一个工具导航站，也不是一个作品画廊</h2>
        <p>
          灵作把「作品」和「做法」放在同一页。你可以先玩一局、看一集、读两页，再决定要不要拆开看它怎么被做出来。
          如果喜欢，可以收藏、评论、二创，或者用同样的配方做一个自己的版本。
        </p>
        <div className="static-quote">
          「玩一局、追一集、读两页、学一手。每个作品都可以带配方，每个人都能接力。」
        </div>
        <div className="static-pillars">
          <div><strong>可体验</strong><span>首屏就能打开一件作品，不是只有封面和点赞。</span></div>
          <div><strong>可拆解</strong><span>提示词、工具、参数、工作流都可以公开。</span></div>
          <div><strong>可接力</strong><span>二创必须署名，血缘链公开可查。</span></div>
        </div>
      </section>

      <section id="areas">
        <span className="eyebrow">02 / FIVE AREAS</span>
        <h2>五个区域，各司其职</h2>
        <div className="static-table">
          <div className="static-table__head">
            <span>区域</span><span>用户状态</span><span>主要任务</span>
          </div>
          {[
            ["首页", "刚进来，还不知道看什么", "快速理解，给一个可体验作品，进入分类"],
            ["发现", "没有目标，想逛", "编辑精选、热门、潜力新作、合集、创作者"],
            ["分类", "明确想看某一种", "深入浏览、筛选、榜单、学习路径"],
            ["搜索", "已经知道想找什么", "输入 → 统一结果 → 分类筛选 → 打开"],
            ["详情", "已经找到目标", "体验、拆配方、二创、讨论"],
          ].map(([area, status, task]) => (
            <div key={area} className="static-table__row">
              <span>{area}</span><span>{status}</span><span>{task}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="principles">
        <span className="eyebrow">03 / PRINCIPLES</span>
        <h2>编辑原则</h2>
        <ul className="static-list static-list--check">
          <li><Check size={14} /> 先让人体验，再讲理念。</li>
          <li><Check size={14} /> 配方是作品的一部分，可以公开，也可以留白。</li>
          <li><Check size={14} /> 不按热度堆首页；推荐要写清楚理由。</li>
          <li><Check size={14} /> 不做假按钮、假数据、假播放器。</li>
          <li><Check size={14} /> AI 声明不可隐藏，二创必须署名。</li>
          <li><Check size={14} /> 移动优先，390px 也要完整可用。</li>
        </ul>
      </section>

      <section id="demo">
        <span className="eyebrow">04 / DEMO</span>
        <h2>这是一个可以点击的演示</h2>
        <p>
          当前站点是本地演示版：没有后端、没有真实账号、没有调用真实 AI API。
          作品、作者和互动数据都是虚构示例，发布的内容和上传的素材只保存在你的浏览器里。
        </p>
        <p className="static-note">
          演示版里没有登录、支付、真实审核和真实二维码。视频、图片和 HTML 都只存在本地；正式版需要云存储、转码和审核。
        </p>
      </section>

      <section id="contact">
        <span className="eyebrow">05 / CONTACT</span>
        <h2>联系我们</h2>
        <p>想投稿、合作、提建议，或者发现内容问题，可以写信给编辑部。</p>
        <a className="static-mail" href="mailto:hello@lingzuo.demo">
          <Mail size={16} />
          hello@lingzuo.demo
          <ArrowRight size={14} />
        </a>
      </section>
    </StaticShell>
  );
}

export function GuidelinesPage() {
  useDocumentTitle("社区规范 · 灵作");
  return (
    <StaticShell
      eyebrow="GUIDELINES / 社区规范"
      title="发布、评论、二创，都有边界。"
      lead="我们希望这里是一个愿意把做法讲清楚的社区。规则不复杂，但会认真执行。"
      toc={[
        { id: "publish", label: "发布" },
        { id: "lineage", label: "二创与版权" },
        { id: "comments", label: "评论与剧透" },
        { id: "ai", label: "AI 声明" },
        { id: "report", label: "举报与处理" },
        { id: "minors", label: "未成年人保护" },
      ]}
    >
      <section id="publish">
        <span className="eyebrow">01 / PUBLISH</span>
        <h2>发布</h2>
        <ul className="static-list">
          <li>作品必须有可体验或可阅读的内容，不能只有封面和一句标题。</li>
          <li>必须选择 AI 使用声明，填写使用工具与生成范围。</li>
          <li>提示词、工作流和步骤都是可选的；可以公开，也可以留空。</li>
          <li>二创必须 credit 原作者，并遵守原作的二创权限。</li>
          <li>标题和简介要具体，不要用「震惊」「必看」这类诱导词。</li>
        </ul>
      </section>
      <section id="lineage">
        <span className="eyebrow">02 / LINEAGE</span>
        <h2>二创与版权</h2>
        <p>二创不是复制。可以借世界观、角色或结构，但要有你自己的表达，并填写原作者和原作链接。血缘链会公开显示，不能删除或隐藏。</p>
        <p>禁止使用未授权的 IP、真实人物肖像、他人隐私信息，或把别人的配方直接写成自己的。改编他人作品时，以原作者的授权选项为准。</p>
      </section>
      <section id="comments">
        <span className="eyebrow">03 / COMMENTS</span>
        <h2>评论与剧透</h2>
        <ul className="static-list">
          <li>评论说具体的事：哪一段、哪个选择、哪句台词。</li>
          <li>涉及关键剧情的评论必须勾选「含剧透」，由读者主动展开。</li>
          <li>不攻击创作者，不刷屏，不导流。</li>
        </ul>
      </section>
      <section id="ai">
        <span className="eyebrow">04 / AI DISCLOSURE</span>
        <h2>AI 声明</h2>
        <p>所有含 AI 生成内容（图像、文本、影像、配音、音乐）的作品都必须声明。「含 AI 生成内容」标签默认展示，作者不能隐藏。</p>
        <Link className="static-link" to="/ai-policy">看完整的 AI 使用声明<ArrowRight size={14} /></Link>
      </section>
      <section id="report">
        <span className="eyebrow">05 / REPORT</span>
        <h2>举报与处理</h2>
        <p>作品、评论、动态和用户主页都有举报入口。高风险内容会进入人工复核；恶意举报会被记录。</p>
      </section>
      <section id="minors">
        <span className="eyebrow">06 / MINORS</span>
        <h2>未成年人保护</h2>
        <p>禁止发布涉及未成年人的性化、暴力或隐私内容。涉及未成年人的作品需要监护人或指导教师确认。</p>
      </section>
    </StaticShell>
  );
}

export function AiPolicyPage() {
  useDocumentTitle("AI 使用声明 · 灵作");
  return (
    <StaticShell
      eyebrow="AI POLICY / AI 声明"
      title="AI 生成的内容，必须说清楚。"
      lead="我们不反对 AI 参与创作，但反对把 AI 藏起来。声明不是免责声明，是对读者的基本交代。"
      toc={[
        { id: "must", label: "必须声明什么" },
        { id: "labels", label: "标签与展示" },
        { id: "prompts", label: "提示词可见性" },
        { id: "license", label: "授权与二创" },
        { id: "prohibited", label: "禁止内容" },
        { id: "limits", label: "声明的边界" },
      ]}
    >
      <section id="must">
        <span className="eyebrow">01 / MUST</span>
        <h2>必须声明什么</h2>
        <ul className="static-list">
          <li>使用了哪些 AI 工具或模型。</li>
          <li>AI 参与了哪些部分：图像、文本、影像、配音、音乐、代码。</li>
          <li>是否包含 AI 生成的真人风格肖像或声音。</li>
          <li>是否允许商用，以及二创权限。</li>
        </ul>
      </section>
      <section id="labels">
        <span className="eyebrow">02 / LABELS</span>
        <h2>标签与展示</h2>
        <p>含 AI 生成内容的作品默认显示「含 AI 生成内容」标签，位置在详情页标题区，不可隐藏。分享海报也会带上声明。</p>
        <div className="static-quote">声明不完整 ≠ 不是 AI 作品。它只是没被说清楚。</div>
      </section>
      <section id="prompts">
        <span className="eyebrow">03 / PROMPTS</span>
        <h2>提示词可见性</h2>
        <p>作者可以选择完全公开、部分公开或仅展示思路，也可以完全留空。搜索不会返回未公开的提示词。</p>
      </section>
      <section id="license">
        <span className="eyebrow">04 / LICENSE</span>
        <h2>授权与二创</h2>
        <p>发布时必须选择二创权限：允许（需署名）、仅非商业、或不允许。二创作品必须保留原作者署名和原作链接。</p>
      </section>
      <section id="prohibited">
        <span className="eyebrow">05 / PROHIBITED</span>
        <h2>禁止内容</h2>
        <ul className="static-list">
          <li>未授权的 IP、角色、品牌和影视素材。</li>
          <li>真实人物肖像、声音克隆、隐私信息。</li>
          <li>冒充他人或伪造 AI 声明。</li>
          <li>色情、未成年人相关、暴力和仇恨内容。</li>
          <li>批量生成的垃圾内容或纯导流页面。</li>
        </ul>
      </section>
      <section id="limits">
        <span className="eyebrow">06 / LIMITS</span>
        <h2>声明的边界</h2>
        <p>AI 声明不能替代版权授权，也不能免除作者对内容的责任。演示版没有真实审核流程；正式上线前会接入人工复核、举报处理和版权申诉。</p>
      </section>
    </StaticShell>
  );
}
