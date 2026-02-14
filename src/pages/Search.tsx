import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";

interface SearchUser {
  id: string;
  username: string;
  display_name: string;
  is_verified: boolean;
  is_artist: boolean;
  bio: string;
  avatar?: string | null;
}

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await api.search(q);
      setResults(data);
    } catch { setResults([]); }
    setLoading(false);
  };

  return (
    <div>
      <div className="p-4 border-b" style={{ borderColor: "var(--online-border)" }}>
        <div className="relative">
          <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--online-muted)" }} />
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Поиск пользователей..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--online-bg)", border: "1px solid var(--online-border)", color: "var(--online-text)" }}
          />
        </div>
      </div>
      {loading ? (
        <div className="p-8 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto" style={{ color: "var(--online-muted)" }} /></div>
      ) : results.length === 0 ? (
        query.length >= 2 ? (
          <div className="p-12 text-center" style={{ color: "var(--online-muted)" }}>Никого не найдено</div>
        ) : (
          <div className="p-12 text-center" style={{ color: "var(--online-muted)" }}>
            <Icon name="Search" size={48} className="mx-auto mb-3 opacity-50" />
            <p>Найдите людей по имени</p>
          </div>
        )
      ) : (
        <div>
          {results.map((u) => (
            <button key={u.id} onClick={() => navigate(`/u/${u.username}`)} className="w-full flex items-center gap-3 p-4 border-b text-left hover:opacity-80 transition-all" style={{ borderColor: "var(--online-border)" }}>
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ background: "var(--online-border)" }}>
                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center font-bold" style={{ color: "var(--online-muted)" }}>{u.display_name?.[0]}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm">{u.display_name}</span>
                  {u.is_verified && <Icon name="BadgeCheck" size={14} style={{ color: "var(--online-primary)" }} />}
                  {u.is_artist && <span>🎵</span>}
                </div>
                <p className="text-xs" style={{ color: "var(--online-muted)" }}>@{u.username}</p>
                {u.bio && <p className="text-xs mt-0.5 truncate" style={{ color: "var(--online-muted)" }}>{u.bio}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
