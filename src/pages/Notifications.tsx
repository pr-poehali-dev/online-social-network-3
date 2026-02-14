import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/time";
import Icon from "@/components/ui/icon";

interface Notification {
  id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
  post_id?: string;
  from_user?: { id: string; username: string; display_name: string; is_verified: boolean; avatar?: string | null } | null;
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.notifications();
      setNotifications(data);
      api.readNotifications().catch(() => {});
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleAcceptFollow = async (fromUserId: string) => {
    await api.acceptFollow(fromUserId);
    load();
  };

  const handleRejectFollow = async (fromUserId: string) => {
    await api.rejectFollow(fromUserId);
    load();
  };

  const typeIcon: Record<string, string> = {
    like: "Heart",
    comment: "MessageCircle",
    follow: "UserPlus",
    follow_request: "UserPlus",
    follow_accepted: "UserCheck",
    verification: "BadgeCheck",
    message: "MessageCircle",
  };

  if (loading) return <div className="p-8 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto" style={{ color: "var(--online-muted)" }} /></div>;

  return (
    <div>
      <div className="p-4 border-b" style={{ borderColor: "var(--online-border)" }}>
        <h1 className="text-xl font-bold">Уведомления</h1>
      </div>
      {notifications.length === 0 ? (
        <div className="p-12 text-center" style={{ color: "var(--online-muted)" }}>
          <Icon name="Bell" size={48} className="mx-auto mb-3 opacity-50" />
          <p>Нет уведомлений</p>
        </div>
      ) : (
        notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-3 p-4 border-b transition-all"
            style={{ borderColor: "var(--online-border)", background: n.is_read ? "transparent" : "rgba(var(--online-primary-rgb, 34, 197, 94), 0.05)" }}>
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ background: "var(--online-border)" }}>
              {n.from_user?.avatar ? <img src={n.from_user.avatar} className="w-full h-full object-cover" alt="" /> : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name={typeIcon[n.type] || "Bell"} size={16} style={{ color: "var(--online-primary)" }} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1">
                {n.from_user && (
                  <span className="font-semibold text-sm cursor-pointer" onClick={() => navigate(`/u/${n.from_user!.username}`)}>{n.from_user.display_name}</span>
                )}
                <span className="text-sm" style={{ color: "var(--online-muted)" }}>
                  {n.type === "like" ? "нравится ваш пост" :
                   n.type === "comment" ? "прокомментировал(а)" :
                   n.type === "follow" ? "подписался(ась)" :
                   n.type === "follow_request" ? "хочет подписаться" :
                   n.type === "follow_accepted" ? "принял(а) заявку" :
                   n.type === "verification" ? n.content :
                   n.type === "message" ? "отправил(а) сообщение" : n.content}
                </span>
              </div>
              <span className="text-xs" style={{ color: "var(--online-muted)" }}>{formatTime(n.created_at)}</span>
              {n.type === "follow_request" && n.from_user && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleAcceptFollow(n.from_user!.id)} className="px-3 py-1 rounded-lg text-xs font-medium text-white" style={{ background: "var(--online-primary)" }}>Принять</button>
                  <button onClick={() => handleRejectFollow(n.from_user!.id)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: "var(--online-border)" }}>Отклонить</button>
                </div>
              )}
            </div>
            {n.post_id && (
              <button onClick={() => navigate(`/post/${n.post_id}`)} className="p-1.5 rounded" style={{ color: "var(--online-muted)" }}>
                <Icon name="ExternalLink" size={14} />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
