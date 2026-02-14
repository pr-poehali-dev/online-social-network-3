import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { api, upload } from "@/lib/api";
import PostCard from "@/components/PostCard";
import Icon from "@/components/ui/icon";
import { formatTime } from "@/lib/time";

export default function Profile() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [tab, setTab] = useState<"posts" | "likes" | "reposts" | "releases">("posts");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showAvatars, setShowAvatars] = useState(false);
  const [viewingAvatar, setViewingAvatar] = useState<string | null>(null);
  const [storyModal, setStoryModal] = useState(false);
  const [storyVisibility, setStoryVisibility] = useState("all");

  const profileUsername = username || me?.username;

  const loadProfile = useCallback(async () => {
    if (!profileUsername) return;
    setLoading(true);
    try {
      const p = await api.profile(profileUsername);
      if (p.error) { setNotFound(true); setLoading(false); return; }
      setProfile(p);
      const userPosts = await api.userPosts(p.id);
      setPosts(userPosts);
    } catch { setNotFound(true); }
    setLoading(false);
  }, [profileUsername]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const loadTab = async (t: string) => {
    if (!profile) return;
    if (t === "posts") { const d = await api.userPosts(profile.id); setPosts(d); }
    else if (t === "likes") { const d = await api.userLikes(profile.id); setPosts(d); }
    else if (t === "reposts") { const d = await api.userReposts(profile.id); setPosts(d); }
  };

  const handleFollow = async () => {
    if (!me || !profile) return;
    if (profile.is_following || profile.follow_status === "pending") {
      await api.unfollow(profile.id);
    } else {
      await api.follow(profile.id);
    }
    loadProfile();
  };

  const handleUploadAvatar = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await upload.file(base64, file.type, "avatars");
        await api.uploadAvatar(res.url);
        loadProfile();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleUploadStory = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await upload.file(base64, file.type, "stories");
        await api.createStory(res.url, storyVisibility);
        setStoryModal(false);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/u/${profile?.username}`);
  };

  if (loading) return <div className="p-8 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto" style={{ color: "var(--online-muted)" }} /></div>;

  if (notFound) return (
    <div className="p-12 text-center">
      <Icon name="UserX" size={48} className="mx-auto mb-3 opacity-50" style={{ color: "var(--online-muted)" }} />
      <h2 className="text-lg font-bold mb-1">Аккаунт не найден</h2>
      <p className="text-sm" style={{ color: "var(--online-muted)" }}>Пользователь не существует или был удалён</p>
    </div>
  );

  if (!profile) return null;
  const isOwn = me?.id === profile.id;

  return (
    <div>
      <div className="p-4 border-b" style={{ borderColor: "var(--online-border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full overflow-hidden cursor-pointer"
              style={{ background: "var(--online-border)" }}
              onClick={() => profile.avatars?.length > 0 ? setShowAvatars(true) : isOwn ? handleUploadAvatar() : null}
            >
              {profile.avatars?.find((a: any) => a.is_primary)?.url ? (
                <img src={profile.avatars.find((a: any) => a.is_primary).url} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ color: "var(--online-muted)" }}>
                  {profile.display_name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            {isOwn && (
              <button onClick={handleUploadAvatar} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--online-primary)" }}>
                <Icon name="Camera" size={14} className="text-white" />
              </button>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold">{profile.display_name}</h2>
              {profile.is_verified && <Icon name="BadgeCheck" size={18} style={{ color: "var(--online-primary)" }} />}
              {profile.is_artist && <span style={{ color: "var(--online-accent)" }}>🎵</span>}
            </div>
            <p className="text-sm" style={{ color: "var(--online-muted)" }}>@{profile.username}</p>
          </div>
        </div>

        {profile.bio && <p className="text-sm mb-3">{profile.bio}</p>}

        <div className="flex gap-6 mb-3 text-sm">
          <button onClick={() => navigate(`/u/${profile.username}/followers`)} className="flex flex-col items-center">
            <span className="font-bold">{profile.followers_count}</span>
            <span style={{ color: "var(--online-muted)" }}>подписчиков</span>
          </button>
          <button onClick={() => navigate(`/u/${profile.username}/following`)} className="flex flex-col items-center">
            <span className="font-bold">{profile.following_count}</span>
            <span style={{ color: "var(--online-muted)" }}>подписок</span>
          </button>
          <div className="flex flex-col items-center">
            <span className="font-bold">{profile.posts_count}</span>
            <span style={{ color: "var(--online-muted)" }}>постов</span>
          </div>
        </div>

        {(profile.telegram || profile.instagram || profile.website || profile.tiktok || profile.youtube) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {profile.telegram && <a href={`https://t.me/${profile.telegram}`} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--online-border)", color: "var(--online-primary)" }}>Telegram</a>}
            {profile.instagram && <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--online-border)", color: "var(--online-primary)" }}>Instagram</a>}
            {profile.tiktok && <a href={`https://tiktok.com/@${profile.tiktok}`} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--online-border)", color: "var(--online-primary)" }}>TikTok</a>}
            {profile.youtube && <a href={profile.youtube} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--online-border)", color: "var(--online-primary)" }}>YouTube</a>}
            {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--online-border)", color: "var(--online-primary)" }}>Сайт</a>}
          </div>
        )}

        <div className="flex gap-2">
          {isOwn ? (
            <>
              <button onClick={() => navigate("/settings")} className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: "var(--online-border)", color: "var(--online-text)" }}>
                Редактировать
              </button>
              <button onClick={() => setStoryModal(true)} className="py-2 px-3 rounded-xl text-sm" style={{ background: "var(--online-border)" }}>
                <Icon name="Plus" size={16} />
              </button>
              <button onClick={copyProfileLink} className="py-2 px-3 rounded-xl text-sm" style={{ background: "var(--online-border)" }}>
                <Icon name="Link" size={16} />
              </button>
            </>
          ) : me ? (
            <>
              <button onClick={handleFollow} className="flex-1 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: profile.is_following ? "var(--online-border)" : profile.follow_status === "pending" ? "var(--online-border)" : "var(--online-primary)", color: profile.is_following || profile.follow_status === "pending" ? "var(--online-text)" : "#fff" }}>
                {profile.is_following ? "Отписаться" : profile.follow_status === "pending" ? "Заявка отправлена" : profile.is_private ? "Подать заявку" : "Подписаться"}
              </button>
              {profile.allow_messages !== false && (
                <button onClick={() => navigate(`/messages/${profile.id}`)} className="py-2 px-3 rounded-xl text-sm" style={{ background: "var(--online-border)" }}>
                  <Icon name="MessageCircle" size={16} />
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>

      <div className="flex border-b" style={{ borderColor: "var(--online-border)" }}>
        {["posts", "likes", "reposts", ...(profile.is_artist ? ["releases"] : [])].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t as any); loadTab(t); }}
            className="flex-1 py-3 text-sm font-medium text-center border-b-2 transition-all"
            style={{ borderColor: tab === t ? "var(--online-primary)" : "transparent", color: tab === t ? "var(--online-primary)" : "var(--online-muted)" }}
          >
            {t === "posts" ? "Посты" : t === "likes" ? "Лайки" : t === "reposts" ? "Репосты" : "Релизы"}
          </button>
        ))}
      </div>

      {tab === "releases" && profile.releases ? (
        <div className="p-4 space-y-3">
          {profile.releases.map((r: any) => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--online-card)", border: "1px solid var(--online-border)" }}>
              {r.cover_url && <img src={r.cover_url} className="w-12 h-12 rounded-lg object-cover" alt="" />}
              <div>
                <p className="font-medium text-sm">{r.title}</p>
                <p className="text-xs" style={{ color: "var(--online-muted)" }}>{r.artist_name}</p>
              </div>
              {r.audio_url && (
                <audio controls className="ml-auto h-8">
                  <source src={r.audio_url} />
                </audio>
              )}
            </div>
          ))}
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} onUpdate={loadProfile} />)
      )}

      {showAvatars && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="max-w-sm w-full rounded-2xl p-4" style={{ background: "var(--online-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Аватарки</h3>
              <button onClick={() => setShowAvatars(false)}><Icon name="X" size={20} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {profile.avatars?.filter((a: any) => a.url !== "removed").map((a: any) => (
                <div key={a.id} className="relative">
                  <img src={a.url} className="w-full aspect-square rounded-xl object-cover cursor-pointer" onClick={() => setViewingAvatar(a.url)} alt="" />
                  {isOwn && (
                    <div className="absolute top-1 right-1 flex gap-1">
                      {!a.is_primary && (
                        <button onClick={async () => { await api.setPrimaryAvatar(a.id); loadProfile(); setShowAvatars(false); }} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "var(--online-primary)" }}>
                          <Icon name="Star" size={12} className="text-white" />
                        </button>
                      )}
                      <button onClick={async () => { await api.removeAvatar(a.id); loadProfile(); }} className="w-6 h-6 rounded-full flex items-center justify-center bg-red-500">
                        <Icon name="Trash2" size={12} className="text-white" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewingAvatar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.9)" }} onClick={() => setViewingAvatar(null)}>
          <img src={viewingAvatar} className="max-w-full max-h-[80vh] rounded-lg" alt="" />
        </div>
      )}

      {storyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="max-w-sm w-full rounded-2xl p-6" style={{ background: "var(--online-card)" }}>
            <h3 className="font-bold mb-4">Создать сторис</h3>
            <div className="space-y-3 mb-4">
              <label className="text-xs font-medium" style={{ color: "var(--online-muted)" }}>Кто может видеть</label>
              <select value={storyVisibility} onChange={(e) => setStoryVisibility(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: "var(--online-bg)", border: "1px solid var(--online-border)", color: "var(--online-text)" }}>
                <option value="all">Все</option>
                <option value="followers">Подписчики</option>
                <option value="mutual">Взаимные подписки</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleUploadStory} className="flex-1 py-2.5 rounded-xl font-medium text-white" style={{ background: "var(--online-primary)" }}>
                Выбрать фото
              </button>
              <button onClick={() => setStoryModal(false)} className="px-4 py-2.5 rounded-xl" style={{ background: "var(--online-border)" }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
