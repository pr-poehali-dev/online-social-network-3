import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, upload } from "@/lib/api";
import Icon from "@/components/ui/icon";

export default function CreatePost() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputPosition, setInputPosition] = useState<"top" | "bottom">("top");

  const handleImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        const res = await upload.file(base64, file.type, "posts");
        setImageUrl(res.url);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl) return;
    setLoading(true);
    await api.createPost(content, imageUrl || undefined);
    setLoading(false);
    navigate("/");
  };

  return (
    <div>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--online-border)" }}>
        <button onClick={() => navigate(-1)}><Icon name="ArrowLeft" size={20} /></button>
        <h1 className="font-bold">Новая публикация</h1>
        <button onClick={handleSubmit} disabled={loading || (!content.trim() && !imageUrl)} className="px-4 py-1.5 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ background: "var(--online-primary)" }}>
          {loading ? "..." : "Опубликовать"}
        </button>
      </div>

      <div className="p-4 flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--online-muted)" }}>Позиция текста</span>
        <button onClick={() => setInputPosition(inputPosition === "top" ? "bottom" : "top")} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: "var(--online-border)" }}>
          <Icon name={inputPosition === "top" ? "ArrowDown" : "ArrowUp"} size={12} />
          {inputPosition === "top" ? "Сверху" : "Снизу"}
        </button>
      </div>

      {inputPosition === "top" && (
        <div className="px-4">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Что нового?" rows={4}
            className="w-full p-3 rounded-xl text-sm outline-none resize-none"
            style={{ background: "var(--online-bg)", border: "1px solid var(--online-border)", color: "var(--online-text)" }}
          />
        </div>
      )}

      {imagePreview && (
        <div className="px-4 py-2 relative">
          <img src={imagePreview} className="w-full max-h-[300px] rounded-xl object-cover" alt="" />
          <button onClick={() => { setImagePreview(""); setImageUrl(""); }} className="absolute top-4 right-6 w-8 h-8 rounded-full flex items-center justify-center bg-black/50">
            <Icon name="X" size={16} className="text-white" />
          </button>
        </div>
      )}

      {inputPosition === "bottom" && (
        <div className="px-4">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Что нового?" rows={4}
            className="w-full p-3 rounded-xl text-sm outline-none resize-none"
            style={{ background: "var(--online-bg)", border: "1px solid var(--online-border)", color: "var(--online-text)" }}
          />
        </div>
      )}

      <div className="px-4 py-3 flex gap-3">
        <button onClick={handleImage} className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl" style={{ background: "var(--online-border)", color: "var(--online-primary)" }}>
          <Icon name="Image" size={18} /> Фото/Видео
        </button>
      </div>
    </div>
  );
}
