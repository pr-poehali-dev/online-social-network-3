import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/time";
import Icon from "@/components/ui/icon";

interface Chat {
  partner_id: string;
  username: string;
  display_name: string;
  is_verified: boolean;
  is_artist: boolean;
  avatar?: string | null;
  last_message: string;
  last_time: string;
  unread: number;
}

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.messages().then(setChats).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <div className="p-8 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto" style={{ color: "var(--online-muted)" }} /></div>;

  return (
    <div>
      <div className="p-4 border-b" style={{ borderColor: "var(--online-border)" }}>
        <h1 className="text-xl font-bold">Сообщения</h1>
      </div>
      {chats.length === 0 ? (
        <div className="p-12 text-center" style={{ color: "var(--online-muted)" }}>
          <Icon name="MessageCircle" size={48} className="mx-auto mb-3 opacity-50" />
          <p>Нет сообщений</p>
        </div>
      ) : (
        chats.map((chat) => (
          <button key={chat.partner_id} onClick={() => navigate(`/messages/${chat.partner_id}`)}
            className="w-full flex items-center gap-3 p-4 border-b text-left hover:opacity-80 transition-all"
            style={{ borderColor: "var(--online-border)" }}>
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ background: "var(--online-border)" }}>
              {chat.avatar ? <img src={chat.avatar} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center font-bold" style={{ color: "var(--online-muted)" }}>{chat.display_name?.[0]}</div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm">{chat.display_name}</span>
                {chat.is_verified && <Icon name="BadgeCheck" size={14} style={{ color: "var(--online-primary)" }} />}
                <span className="text-xs ml-auto" style={{ color: "var(--online-muted)" }}>{formatTime(chat.last_time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs truncate" style={{ color: "var(--online-muted)" }}>{chat.last_message}</p>
                {chat.unread > 0 && (
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "var(--online-primary)" }}>{chat.unread}</span>
                )}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
