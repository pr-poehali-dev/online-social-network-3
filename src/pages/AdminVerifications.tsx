import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/time";
import Icon from "@/components/ui/icon";

interface VerRequest {
  id: string;
  type: string;
  status: string;
  created_at: string;
  user_id: string;
  username: string;
  display_name: string;
}

export default function AdminVerifications() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.adminGetVerifications();
      setRequests(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (user?.is_admin) load(); }, [user]);

  const handleApprove = async (id: string) => {
    await api.adminVerify(id);
    load();
  };

  const handleReject = async (id: string) => {
    await api.adminRejectVerify(id);
    load();
  };

  if (!user?.is_admin) return null;
  if (loading) return <div className="p-8 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto" style={{ color: "var(--online-muted)" }} /></div>;

  return (
    <div>
      <div className="p-4 border-b" style={{ borderColor: "var(--online-border)" }}>
        <h1 className="text-xl font-bold flex items-center gap-2"><Icon name="BadgeCheck" size={20} /> Заявки на верификацию</h1>
      </div>
      {requests.length === 0 ? (
        <div className="p-12 text-center" style={{ color: "var(--online-muted)" }}>Нет заявок</div>
      ) : requests.map((r) => (
        <div key={r.id} className="p-4 border-b" style={{ borderColor: "var(--online-border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm">{r.display_name}</span>
            <span className="text-xs" style={{ color: "var(--online-muted)" }}>@{r.username}</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--online-border)" }}>{r.type === "artist" ? "🎵 Артист" : "✓ Стандарт"}</span>
            <span className="text-xs ml-auto" style={{ color: "var(--online-muted)" }}>{formatTime(r.created_at)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleApprove(r.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "var(--online-primary)" }}>
              Одобрить
            </button>
            <button onClick={() => handleReject(r.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--online-border)" }}>
              Отклонить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
