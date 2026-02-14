import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import PostCard from "@/components/PostCard";
import StoriesBar from "@/components/StoriesBar";
import Icon from "@/components/ui/icon";

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const data = await api.feed();
      setPosts(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadFeed(); }, []);

  return (
    <div>
      <div className="p-4 border-b flex items-center" style={{ borderColor: "var(--online-border)" }}>
        <h1 className="text-xl font-bold">Лента</h1>
        <button onClick={loadFeed} className="ml-auto p-2 rounded-lg hover:opacity-70" style={{ color: "var(--online-primary)" }}>
          <Icon name="RefreshCw" size={18} />
        </button>
      </div>
      <StoriesBar />
      {loading ? (
        <div className="p-8 text-center" style={{ color: "var(--online-muted)" }}>
          <Icon name="Loader2" size={24} className="animate-spin mx-auto" />
        </div>
      ) : posts.length === 0 ? (
        <div className="p-12 text-center" style={{ color: "var(--online-muted)" }}>
          <Icon name="Inbox" size={48} className="mx-auto mb-3 opacity-50" />
          <p>Пока нет публикаций</p>
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} onUpdate={loadFeed} />)
      )}
    </div>
  );
}
