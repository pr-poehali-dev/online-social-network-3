import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";

interface FollowUser {
  id: string;
  username: string;
  display_name: string;
  is_verified: boolean;
  is_artist: boolean;
  avatar?: string | null;
}

export default function FollowList() {
  const { username, type } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [profile, setProfile] = useState<{ id: string } | null>(null);
  const [tab, setTab] = useState(type || "followers");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    api.profile(username).then((p) => {
      setProfile(p);
      loadTab(tab, p.id);
    });
  }, [username]);

  const loadTab = async (t: string, userId?: string) => {
    setLoading(true);
    const uid = userId || profile?.id;
    if (!uid) return;
    try {
      if (t === "followers") setUsers(await api.followers(uid));
      else if (t === "following") setUsers(await api.following(uid));
      else if (t === "friends") setUsers(await api.friends(uid));
    } catch { setUsers([]); }
    setLoading(false);
  };

  return (
    <div>
      <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: "var(--online-border)" }}>
        <button onClick={() => navigate(-1)}><Icon name="ArrowLeft" size={20} /></button>
        <h1 className="font-bold">@{username}</h1>
      </div>
      <div className="flex border-b" style={{ borderColor: "var(--online-border)" }}>
        {["followers", "following", "friends"].map((t) => (
          <button key={t} onClick={() => { setTab(t); loadTab(t); }}
            className="flex-1 py-3 text-sm font-medium text-center border-b-2 transition-all"
            style={{ borderColor: tab === t ? "var(--online-primary)" : "transparent", color: tab === t ? "var(--online-primary)" : "var(--online-muted)" }}>
            {t === "followers" ? "Подписчики" : t === "following" ? "Подписки" : "Друзья"}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="p-8 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto" style={{ color: "var(--online-muted)" }} /></div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center" style={{ color: "var(--online-muted)" }}>Пусто</div>
      ) : (
        users.map((u) => (
          <button key={u.id} onClick={() => navigate(`/u/${u.username}`)}
            className="w-full flex items-center gap-3 p-4 border-b text-left"
            style={{ borderColor: "var(--online-border)" }}>
            <div className="w-10 h-10 rounded-full overflow-hidden" style={{ background: "var(--online-border)" }}>
              {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ color: "var(--online-muted)" }}>{u.display_name?.[0]}</div>}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm">{u.display_name}</span>
                {u.is_verified && <Icon name="BadgeCheck" size={14} style={{ color: "var(--online-primary)" }} />}
              </div>
              <span className="text-xs" style={{ color: "var(--online-muted)" }}>@{u.username}</span>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
