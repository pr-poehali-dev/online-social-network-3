import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useTheme, themes, ThemeKey } from "@/lib/theme";
import Icon from "@/components/ui/icon";

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isPrivate, setIsPrivate] = useState(user?.is_private || false);
  const [allowMessages, setAllowMessages] = useState(user?.allow_messages !== false);
  const [telegram, setTelegram] = useState(user?.telegram || "");
  const [instagram, setInstagram] = useState(user?.instagram || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [tiktok, setTiktok] = useState(user?.tiktok || "");
  const [youtube, setYoutube] = useState(user?.youtube || "");
  const [showLikes, setShowLikes] = useState(user?.show_likes || "all");
  const [showReposts, setShowReposts] = useState(user?.show_reposts || "all");
  const [showFollowers, setShowFollowers] = useState(user?.show_followers || "all");
  const [showFollowing, setShowFollowing] = useState(user?.show_following || "all");
  const [showFriends, setShowFriends] = useState(user?.show_friends || "all");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await api.updateProfile({
      display_name: displayName, bio, is_private: isPrivate, allow_messages: allowMessages,
      telegram, instagram, website, tiktok, youtube,
      show_likes: showLikes, show_reposts: showReposts, show_followers: showFollowers,
      show_following: showFollowing, show_friends: showFriends, theme,
    });
    await refreshUser();
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    await api.deleteAccount();
    logout();
    navigate("/");
  };

  const handleVerification = async (type: string) => {
    await api.requestVerification(type);
  };

  if (!user) return null;

  const SelectField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div>
      <label className="text-xs font-medium mb-1 block" style={{ color: "var(--online-muted)" }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: "var(--online-bg)", border: "1px solid var(--online-border)", color: "var(--online-text)" }}>
        <option value="all">Все</option>
        <option value="followers">Подписчики</option>
        <option value="none">Никто</option>
      </select>
    </div>
  );

  return (
    <div>
      <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: "var(--online-border)" }}>
        <button onClick={() => navigate(-1)}><Icon name="ArrowLeft" size={20} /></button>
        <h1 className="text-xl font-bold">Настройки</h1>
      </div>

      <div className="p-4 space-y-6">
        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Icon name="Palette" size={16} /> Тема оформления</h3>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(themes) as [ThemeKey, typeof themes[ThemeKey]][]).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className="p-3 rounded-xl text-left text-sm font-medium transition-all"
                style={{
                  background: t.card,
                  color: t.text,
                  border: theme === key ? `2px solid ${t.primary}` : `1px solid ${t.border}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 rounded-full" style={{ background: t.primary }} />
                  {t.name}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Icon name="User" size={16} /> Профиль</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--online-muted)" }}>Имя</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: "var(--online-bg)", border: "1px solid var(--online-border)", color: "var(--online-text)" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--online-muted)" }}>Username (нельзя изменить)</label>
              <input value={user.username} disabled className="w-full px-3 py-2 rounded-xl text-sm opacity-50"
                style={{ background: "var(--online-bg)", border: "1px solid var(--online-border)", color: "var(--online-text)" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--online-muted)" }}>Описание</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                style={{ background: "var(--online-bg)", border: "1px solid var(--online-border)", color: "var(--online-text)" }}
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Icon name="Link" size={16} /> Ссылки</h3>
          <div className="space-y-3">
            {[
              { label: "Telegram", value: telegram, set: setTelegram, ph: "username" },
              { label: "Instagram", value: instagram, set: setInstagram, ph: "username" },
              { label: "TikTok", value: tiktok, set: setTiktok, ph: "username" },
              { label: "YouTube", value: youtube, set: setYoutube, ph: "https://youtube.com/..." },
              { label: "Сайт", value: website, set: setWebsite, ph: "https://..." },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--online-muted)" }}>{f.label}</label>
                <input value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.ph}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: "var(--online-bg)", border: "1px solid var(--online-border)", color: "var(--online-text)" }}
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Icon name="Shield" size={16} /> Приватность</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Приватный профиль</span>
              <button onClick={() => setIsPrivate(!isPrivate)} className="w-11 h-6 rounded-full p-0.5 transition-all"
                style={{ background: isPrivate ? "var(--online-primary)" : "var(--online-border)" }}>
                <div className="w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: isPrivate ? "translateX(20px)" : "translateX(0)" }} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Разрешить сообщения</span>
              <button onClick={() => setAllowMessages(!allowMessages)} className="w-11 h-6 rounded-full p-0.5 transition-all"
                style={{ background: allowMessages ? "var(--online-primary)" : "var(--online-border)" }}>
                <div className="w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: allowMessages ? "translateX(20px)" : "translateX(0)" }} />
              </button>
            </div>
            <SelectField label="Кто видит мои лайки" value={showLikes} onChange={setShowLikes} />
            <SelectField label="Кто видит мои репосты" value={showReposts} onChange={setShowReposts} />
            <SelectField label="Кто видит подписчиков" value={showFollowers} onChange={setShowFollowers} />
            <SelectField label="Кто видит подписки" value={showFollowing} onChange={setShowFollowing} />
            <SelectField label="Кто видит друзей" value={showFriends} onChange={setShowFriends} />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Icon name="BadgeCheck" size={16} /> Верификация</h3>
          <div className="space-y-2">
            <button onClick={() => handleVerification("standard")} className="w-full py-2 rounded-xl text-sm font-medium" style={{ background: "var(--online-border)" }}>
              Заявка на верификацию ✓
            </button>
            <button onClick={() => handleVerification("artist")} className="w-full py-2 rounded-xl text-sm font-medium" style={{ background: "var(--online-border)" }}>
              Заявка на верификацию артиста 🎵
            </button>
          </div>
        </section>

        <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl font-medium text-white" style={{ background: "var(--online-primary)" }}>
          {saving ? "Сохранение..." : "Сохранить"}
        </button>

        <section className="pt-4 border-t" style={{ borderColor: "var(--online-border)" }}>
          <h3 className="text-sm font-semibold mb-3 text-red-400 flex items-center gap-2"><Icon name="AlertTriangle" size={16} /> Опасная зона</h3>
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)} className="w-full py-2 rounded-xl text-sm font-medium text-red-400" style={{ background: "rgba(239,68,68,0.1)" }}>
              Удалить аккаунт
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-400">Вы уверены? Это действие необратимо.</p>
              <div className="flex gap-2">
                <button onClick={handleDeleteAccount} className="flex-1 py-2 rounded-xl text-sm font-medium text-white bg-red-500">Удалить навсегда</button>
                <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2 rounded-xl text-sm" style={{ background: "var(--online-border)" }}>Отмена</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
