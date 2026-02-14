import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";

interface Story {
  id: string;
  image_url: string;
  user: { id: string; username: string; display_name: string; avatar?: string | null };
  created_at: string;
}

export default function StoriesBar() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [viewing, setViewing] = useState<Story | null>(null);

  useEffect(() => {
    if (user) api.stories().then(setStories).catch(() => {});
  }, [user]);

  if (!user || stories.length === 0) return null;

  const grouped: Record<string, Story[]> = {};
  stories.forEach((s) => {
    if (!grouped[s.user.id]) grouped[s.user.id] = [];
    grouped[s.user.id].push(s);
  });

  return (
    <>
      <div className="flex gap-3 p-4 overflow-x-auto border-b" style={{ borderColor: "var(--online-border)" }}>
        {Object.entries(grouped).map(([userId, userStories]) => {
          const u = userStories[0].user;
          return (
            <button
              key={userId}
              onClick={() => setViewing(userStories[0])}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div className="w-14 h-14 rounded-full p-0.5" style={{ background: `linear-gradient(135deg, var(--online-primary), var(--online-accent))` }}>
                <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "var(--online-bg)" }}>
                  {u.avatar ? (
                    <img src={u.avatar} className="w-full h-full object-cover rounded-full" style={{ border: "2px solid var(--online-bg)" }} alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: "var(--online-muted)" }}>
                      {u.display_name?.[0]}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] max-w-[60px] truncate" style={{ color: "var(--online-muted)" }}>{u.display_name}</span>
            </button>
          );
        })}
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.9)" }}>
          <button onClick={() => setViewing(null)} className="absolute top-4 right-4 text-white z-10">
            <Icon name="X" size={28} />
          </button>
          <div className="absolute top-4 left-4 flex items-center gap-2 text-white z-10">
            <div className="w-8 h-8 rounded-full overflow-hidden" style={{ background: "var(--online-border)" }}>
              {viewing.user.avatar ? <img src={viewing.user.avatar} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-xs">{viewing.user.display_name?.[0]}</div>}
            </div>
            <span className="text-sm font-medium">{viewing.user.display_name}</span>
          </div>
          <img src={viewing.image_url} className="max-w-full max-h-[80vh] rounded-lg" alt="" />
        </div>
      )}
    </>
  );
}
