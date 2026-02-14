import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import PostCard from "@/components/PostCard";
import { formatTime } from "@/lib/time";
import Icon from "@/components/ui/icon";

interface Comment {
  id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  user: { id: string; username: string; display_name: string; is_verified: boolean; is_artist: boolean; avatar?: string | null };
  likes_count: number;
  is_author_like: boolean;
  liked: boolean;
}

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    try {
      const p = await api.post(id);
      setPost(p);
      const c = await api.comments(id);
      setComments(c);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleComment = async () => {
    if (!text.trim() || !id) return;
    await api.comment(id, text, replyTo || undefined);
    setText("");
    setReplyTo(null);
    load();
  };

  const handleLikeComment = async (c: Comment) => {
    if (!user) return;
    if (c.liked) await api.unlikeComment(c.id);
    else await api.likeComment(c.id);
    load();
  };

  const handleDeleteComment = async (commentId: string) => {
    await api.hideComment(commentId);
    load();
  };

  if (loading) return <div className="p-8 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto" style={{ color: "var(--online-muted)" }} /></div>;
  if (!post) return <div className="p-12 text-center" style={{ color: "var(--online-muted)" }}>Пост не найден</div>;

  const rootComments = comments.filter((c) => !c.parent_id);
  const replies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => (
    <div className="py-3" style={{ paddingLeft: depth * 32 }}>
      <div className="flex gap-2.5">
        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden cursor-pointer" style={{ background: "var(--online-border)" }} onClick={() => navigate(`/u/${comment.user.username}`)}>
          {comment.user.avatar ? <img src={comment.user.avatar} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: "var(--online-muted)" }}>{comment.user.display_name?.[0]}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold cursor-pointer" onClick={() => navigate(`/u/${comment.user.username}`)}>{comment.user.display_name}</span>
            {comment.user.is_verified && <Icon name="BadgeCheck" size={12} style={{ color: "var(--online-primary)" }} />}
            <span className="text-xs" style={{ color: "var(--online-muted)" }}>{formatTime(comment.created_at)}</span>
          </div>
          <p className="text-sm mt-0.5">{comment.content}</p>
          <div className="flex items-center gap-3 mt-1">
            <button onClick={() => handleLikeComment(comment)} className="flex items-center gap-1 text-xs" style={{ color: comment.liked ? "#ef4444" : "var(--online-muted)" }}>
              <Icon name="Heart" size={14} className={comment.liked ? "fill-current" : ""} />
              {comment.likes_count > 0 && comment.likes_count}
              {comment.is_author_like && <span className="text-[10px]" style={{ color: "var(--online-primary)" }}>автор</span>}
            </button>
            {user && (
              <button onClick={() => { setReplyTo(comment.id); setText(`@${comment.user.username} `); }} className="text-xs" style={{ color: "var(--online-muted)" }}>Ответить</button>
            )}
            {user && (user.id === comment.user.id || user.id === post.user.id) && (
              <button onClick={() => handleDeleteComment(comment.id)} className="text-xs text-red-400">Удалить</button>
            )}
          </div>
        </div>
      </div>
      {replies(comment.id).map((r) => <CommentItem key={r.id} comment={r} depth={depth + 1} />)}
    </div>
  );

  return (
    <div>
      <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: "var(--online-border)" }}>
        <button onClick={() => navigate(-1)}><Icon name="ArrowLeft" size={20} /></button>
        <h1 className="font-bold">Публикация</h1>
      </div>
      <PostCard post={post} onUpdate={load} />
      <div className="px-4 py-2 border-b" style={{ borderColor: "var(--online-border)" }}>
        <span className="text-sm font-semibold">Комментарии ({comments.length})</span>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--online-border)" }}>
        {rootComments.map((c) => <CommentItem key={c.id} comment={c} />)}
      </div>
      {user && (
        <div className="fixed bottom-0 left-0 right-0 md:relative p-3 border-t flex gap-2" style={{ background: "var(--online-card)", borderColor: "var(--online-border)" }}>
          {replyTo && (
            <button onClick={() => { setReplyTo(null); setText(""); }} className="text-xs px-2 py-1 rounded" style={{ background: "var(--online-border)" }}>
              <Icon name="X" size={12} />
            </button>
          )}
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Комментарий..."
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: "var(--online-bg)", border: "1px solid var(--online-border)", color: "var(--online-text)" }}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
          />
          <button onClick={handleComment} className="px-4 py-2 rounded-xl text-white text-sm" style={{ background: "var(--online-primary)" }}>
            <Icon name="Send" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
