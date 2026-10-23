import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, History, RotateCcw } from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { TypeSticker } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { workMap } from "@/data/seed";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { loadWorkVersions, publishWork, type WorkVersion } from "@/lib/userContent";
import { timeAgo } from "@/lib/utils";
import { workLink } from "@/lib/work";

export function WorkVersionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const work = id ? workMap.get(id) : undefined;
  const [versions] = useState<WorkVersion[]>(() => (id ? loadWorkVersions(id) : []));
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const pending = versions.find((version) => version.id === restoreId);
  useDocumentTitle(work ? `版本历史 · ${work.title} · 灵作` : "版本历史 · 灵作");

  if (!work) {
    return (
      <div className="versions-page">
        <div className="container versions-empty">
          <History size={28} />
          <h1>这件作品不在了。</h1>
          <Link className="btn btn--outline btn--sm" to="/me">回工作台</Link>
        </div>
      </div>
    );
  }

  const restore = () => {
    if (!pending?.form) return;
    publishWork(pending.form, work.id);
    setRestoreId(null);
    toast({
      title: "版本已恢复",
      desc: "当前内容已保存为一个历史版本，可以再次切换。",
      tone: "game",
    });
    navigate(workLink(work));
  };

  return (
    <div className="versions-page">
      <div className="container">
        <div className="versions-head">
          <div>
            <span className="eyebrow">HISTORY / 版本历史</span>
            <h1>每一次修改，都留了一手。</h1>
            <p>
              《{work.title}》保留了最近 {versions.length} 个历史版本。恢复旧版本时，当前内容也会自动留档。
            </p>
          </div>
          <Link className="btn btn--outline btn--sm" to={workLink(work)}>
            <ArrowLeft size={14} />
            返回作品
          </Link>
        </div>

        {versions.length ? (
          <div className="versions-list">
            {versions.map((version, index) => (
              <article className="version-item" key={version.id}>
                <div className="version-item__cover">
                  <Cover cover={version.work.cover} />
                </div>
                <div className="version-item__copy">
                  <div className="version-item__meta">
                    <TypeSticker type={version.work.type} />
                    <span>
                      <Clock3 size={11} />
                      {timeAgo(version.savedAt)}
                    </span>
                    <span>{index === 0 ? "最近保存" : `往前 ${index + 1} 版`}</span>
                  </div>
                  <h2>{version.work.title}</h2>
                  <p>{version.work.summary}</p>
                  <small>
                    {version.work.tools.join(" / ")} · {version.work.license} · {version.work.aiDisclosure}
                  </small>
                </div>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  disabled={!version.form}
                  onClick={() => setRestoreId(version.id)}
                  title={version.form ? "恢复这一版" : "这个旧版本没有保存可编辑表单"}
                >
                  <RotateCcw size={14} />
                  恢复此版本
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="versions-empty">
            <History size={28} />
            <h1>还没有历史版本。</h1>
            <p>编辑并保存一次之后，旧版本会出现在这里。</p>
            <Link className="btn btn--primary btn--sm" to={`/create/${work.type}?edit=${work.id}`}>
              去编辑
            </Link>
          </div>
        )}

        <p className="versions-note">
          版本历史只保存在本地浏览器，最多保留 8 个版本；旧版本引用的视频和图片在彻底删除作品前不会被清理。
        </p>
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending ? `恢复到「${pending.work.title}」这一版？` : "恢复版本？"}
        description="当前内容会先保存为一个新的历史版本，然后恢复这一版的标题、正文、封面和配方。作品链接和互动数据不变。"
        confirmLabel="恢复此版本"
        onClose={() => setRestoreId(null)}
        onConfirm={restore}
      />
    </div>
  );
}
