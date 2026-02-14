import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/time";
import Icon from "@/components/ui/icon";

export default function AdminReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.adminGetReports();
      setReports(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (user?.is_admin) load(); }, [user]);

  const handleResolve = async (id: string, action: string, targetType?: string, targetId?: string) => {
    if (action === "block" && targetType === "post" && targetId) {
      await api.adminHidePost(targetId);
    } else if (action === "block" && targetType === "user" && targetId) {
      await api.adminBlockUser(targetId);
    }
    await api.adminResolveReport(id, action);
    load();
  };

  if (!user?.is_admin) return null;
  if (loading) return <div className="p-8 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto" style={{ color: "var(--online-muted)" }} /></div>;

  return (
    <div>
      <div className="p-4 border-b" style={{ borderColor: "var(--online-border)" }}>
        <h1 className="text-xl font-bold flex items-center gap-2"><Icon name="Flag" size={20} /> Жалобы</h1>
      </div>
      {reports.length === 0 ? (
        <div className="p-12 text-center" style={{ color: "var(--online-muted)" }}>Нет жалоб</div>
      ) : reports.map((r) => (
        <div key={r.id} className="p-4 border-b" style={{ borderColor: "var(--online-border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--online-border)" }}>{r.target_type}</span>
            <span className="text-xs" style={{ color: "var(--online-muted)" }}>от {r.reporter}</span>
            <span className="text-xs ml-auto" style={{ color: "var(--online-muted)" }}>{formatTime(r.created_at)}</span>
          </div>
          <p className="text-sm mb-3">{r.reason}</p>
          <div className="flex gap-2">
            <button onClick={() => handleResolve(r.id, "block", r.target_type, r.target_id)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-red-500">
              Заблокировать
            </button>
            <button onClick={() => handleResolve(r.id, "dismiss")} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--online-border)" }}>
              Отклонить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
