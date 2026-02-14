import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/time";
import Icon from "@/components/ui/icon";
import VerifiedBadge from "@/components/VerifiedBadge";

interface PostUser {
  id: string;
  username: string;
  display_name: string;
  is_verified: boolean;
  is_artist: boolean;
  avatar?: string | null;
}

interface Post {
  id: string;
  content: string;
  image_url?: string | null;
  views_count: number;
  created_at: string;
  user: PostUser;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  liked: boolean;
  reposted: boolean;
}

export default function PostCard({ post, onUpdate }: { post: Post; onUpdate?: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [reposted, setReposted] = useState(post.reposted);
  const [repostsCount, setRepostsCount] = useState(post.reposts_count);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    api.viewPost(post.id).catch(() => {});
  }, [post.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (liked) {
      setLiked(false);
      setLikesCount((c) => c - 1);
      await api.unlikePost(post.id);
    } else {
      setLiked(true);
      setLikesCount((c) => c + 1);
      await api.likePost(post.id);
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (reposted) {
      setReposted(false);
      setRepostsCount((c) => c - 1);
      await api.unrepost(post.id);
    } else {
      setReposted(true);
      setRepostsCount((c) => c + 1);
      await api.repost(post.id);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await api.hidePost(post.id);
    setShowMenu(false);
    onUpdate?.();
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await api.report("post", post.id, "Нарушение правил");
    setShowMenu(false);
  };

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    setShowMenu(false);
  };

  return (
    <div className="p-4 border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden cursor-pointer bg-secondary"
          onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.user.username}`); }}
        >
          {post.user.avatar ? (
            <img src={post.user.avatar} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
              {post.user.display_name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.user.username}`); }}>
              {post.user.display_name}
            </span>
            <VerifiedBadge isVerified={post.user.is_verified} isArtist={post.user.is_artist} />
            <span className="text-xs text-muted-foreground">@{post.user.username}</span>
            <span className="text-xs text-muted-foreground">· {formatTime(post.created_at)}</span>
            <div className="relative ml-auto">
              <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-1 rounded text-muted-foreground hover:bg-secondary">
                <Icon name="MoreHorizontal" size={16} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 py-1 rounded-xl shadow-lg z-20 min-w-[160px] bg-card border border-border">
                  <button onClick={copyLink} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-secondary">
                    <Icon name="Link" size={14} /> Копировать ссылку
                  </button>
                  {user && user.id !== post.user.id && (
                    <button onClick={handleReport} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-secondary text-destructive">
                      <Icon name="Flag" size={14} /> Пожаловаться
                    </button>
                  )}
                  {user && user.id === post.user.id && (
                    <button onClick={handleDelete} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-secondary text-destructive">
                      <Icon name="Trash2" size={14} /> Удалить
                    </button>
                  )}
                  {user?.is_admin && user.id !== post.user.id && (
                    <button onClick={(e) => { e.stopPropagation(); api.adminHidePost(post.id); setShowMenu(false); onUpdate?.(); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-secondary text-destructive">
                      <Icon name="ShieldX" size={14} /> Удалить (Админ)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {post.content && <p className="mt-1.5 text-sm whitespace-pre-wrap break-words">{post.content}</p>}
          {post.image_url && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border">
              <img src={post.image_url} className="w-full max-h-[500px] object-cover" alt="" />
            </div>
          )}
          <div className="flex items-center gap-5 mt-3">
            <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm transition-all ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}>
              <Icon name="Heart" size={18} className={liked ? "fill-current" : ""} />
              {likesCount > 0 && likesCount}
            </button>
            <button onClick={(e) => { e.stopPropagation(); navigate(`/post/${post.id}`); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Icon name="MessageCircle" size={18} />
              {post.comments_count > 0 && post.comments_count}
            </button>
            <button onClick={handleRepost} className={`flex items-center gap-1.5 text-sm transition-all ${reposted ? "text-green-500" : "text-muted-foreground hover:text-green-500"}`}>
              <Icon name="Repeat2" size={18} />
              {repostsCount > 0 && repostsCount}
            </button>
            <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Icon name="Eye" size={14} />
              {post.views_count}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
