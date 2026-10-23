import { useState } from "react";
import { Link } from "react-router-dom";
import { ArchiveRestore, ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { TypeSticker } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { loadTrash, purgeTrashItem, restoreTrash, type TrashItem } from "@/lib/userContent";
import { timeAgo } from "@/lib/utils";

export function TrashPage() {
  useDocumentTitle("回收站 · 灵作");
  const { toast } = useToast();
  const [items, setItems] = useState<TrashItem[]>(() => loadTrash());
  const [purgeId, setPurgeId] = useState<string | null>(null);
  const pending = items.find((item) => item.id === purgeId);

  const restore = (item: TrashItem) => {
    if (!restoreTrash(item.id)) {
      toast({ title: "恢复失败", desc: "这条内容可能已经被彻底删除。", tone: "ink" });
      setItems(loadTrash());
      return;
    }
    setItems(loadTrash());
    toast({
      title: "已恢复",
      desc: item.kind === "work" ? "作品已经回到主页和搜索，视频与封面一起恢复。" : "动态已经回到发现页和你的主页。",
      tone: "game",
    });
  };

  return (
    <div className="trash-page">
      <div className="container">
        <div className="trash-head">
          <div>
            <span className="eyebrow">TRASH / 回收站</span>
            <h1>先放这儿，别急着彻底删。</h1>
            <p>
              删除的作品和动态会先进入回收站，视频、封面和正文暂时保留。
              彻底删除后才会清理本地素材，无法恢复。
            </p>
          </div>
          <Link className="btn btn--outline btn--sm" to="/me">
            <ArrowLeft size={14} />
            返回工作台
          </Link>
        </div>

        {items.length ? (
          <div className="trash-list">
            {items.map((item) => (
              <article className="trash-item" key={`${item.kind}-${item.id}`}>
                <div className="trash-item__cover">
                  {item.kind === "work" && item.work ? (
                    <Cover cover={item.work.cover} />
                  ) : (
                    <span className="trash-item__post">{item.post?.type ?? "动态"}</span>
                  )}
                </div>
                <div className="trash-item__copy">
                  <div className="trash-item__meta">
                    <TypeSticker
                      type={item.kind === "work" && item.work ? item.work.type : "post"}
                      label={item.kind === "post" ? item.post?.type : undefined}
                    />
                    <span>{timeAgo(item.deletedAt)}删除</span>
                  </div>
                  <h2>{item.title}</h2>
                  <p>
                    {item.kind === "work" && item.work
                      ? item.work.summary
                      : (item.post?.excerpt ?? "这条动态已移入回收站。")}
                  </p>
                </div>
                <div className="trash-item__actions">
                  <button type="button" className="btn btn--primary btn--sm" onClick={() => restore(item)}>
                    <RotateCcw size={14} />
                    恢复
                  </button>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm trash-item__purge"
                    onClick={() => setPurgeId(item.id)}
                  >
                    <Trash2 size={14} />
                    彻底删除
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="trash-empty">
            <ArchiveRestore size={28} />
            <h2>回收站是空的。</h2>
            <p>删除作品或动态后会先出现在这里，可以恢复。</p>
            <div>
              <Link className="btn btn--outline btn--sm" to="/me">回工作台</Link>
              <Link className="btn btn--primary btn--sm" to="/create">去发布</Link>
            </div>
          </div>
        )}

        <p className="trash-note">
          回收站不会自动过期。确认不再需要时再彻底删除；彻底删除会同时移除作品用到的视频、图片和 HTML 文件。
        </p>
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending ? `彻底删除《${pending.title}》？` : "彻底删除？"}
        description="这会从回收站永久移除内容。如果是作品，还会删除它的视频、封面、教程图片和 HTML 文件；操作无法撤销。"
        confirmLabel="彻底删除"
        onClose={() => setPurgeId(null)}
        onConfirm={() => {
          if (!pending) return;
          purgeTrashItem(pending.id);
          setItems(loadTrash());
          setPurgeId(null);
          toast({ title: "已彻底删除", desc: "本地素材已清理。" });
        }}
      />
    </div>
  );
}
