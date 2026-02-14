import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/time";
import Icon from "@/components/ui/icon";

interface Appeal {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  user_id: string;
  username: string;
  display_name: string;
}

export default function AdminAppeals() {
  const { user } = useAuth();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.adminGetAppeals();
      setAppeals(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (user?.is_admin) load(); }, [user]);

  const handleResolve = async (id: string, action: string) => {
    await api.adminResolveAppeal(id, action);
    load();
  };

  if (!user?.is_admin) return null;
  if (loading) return <div className="p-8 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto" style={{ color: "var(--online-muted)" }} /></div>;

  return (
    <div>
      <div className="p-4 border-b" style={{ borderColor: "var(--online-border)" }}>
        <h1 className="text-xl font-bold flex items-center gap-2"><Icon name="ShieldAlert" size={20} /> Апелляции</h1>
      </div>
      {appeals.length === 0 ? (
        <div className="p-12 text-center" style={{ color: "var(--online-muted)" }}>Нет апелляций</div>
      ) : appeals.map((a) => (
        <div key={a.id} className="p-4 border-b" style={{ borderColor: "var(--online-border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm">{a.display_name}</span>
            <span className="text-xs" style={{ color: "var(--online-muted)" }}>@{a.username}</span>
            <span className="text-xs ml-auto" style={{ color: "var(--online-muted)" }}>{formatTime(a.created_at)}</span>
          </div>
          <p className="text-sm mb-3" style={{ color: "var(--online-muted)" }}>{a.reason || "Без причины"}</p>
          <div className="flex gap-2">
            <button onClick={() => handleResolve(a.id, "approve")} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "var(--online-primary)" }}>
              Разблокировать
            </button>
            <button onClick={() => handleResolve(a.id, "reject")} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--online-border)" }}>
              Отклонить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
