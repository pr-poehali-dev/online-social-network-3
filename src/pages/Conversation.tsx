import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/time";
import Icon from "@/components/ui/icon";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  reply_to_id?: string | null;
  is_read: boolean;
  is_pinned: boolean;
  edited_at?: string | null;
  created_at: string;
}

export default function Conversation() {
  const { partnerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null);
  const [partner, setPartner] = useState<{ username: string; display_name: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!partnerId) return;
    const msgs = await api.conversation(partnerId);
    setMessages(msgs);
    await api.markRead(partnerId);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, [partnerId]);

  useEffect(() => {
    if (partnerId && messages.length > 0) {
      const otherMsg = messages.find((m) => m.sender_id === partnerId);
      if (otherMsg) {
        api.profile("").catch(() => {});
      }
    }
  }, [partnerId, messages.length]);

  const handleSend = async () => {
    if (!text.trim() || !partnerId) return;
    if (editingId) {
      await api.editMessage(editingId, text);
      setEditingId(null);
    } else {
      await api.sendMessage(partnerId, text, replyToId || undefined);
      setReplyToId(null);
    }
    setText("");
    load();
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setSelectedMsg(null);
  };

  const handlePin = async (msgId: string, pinned: boolean) => {
    await api.pinMessage(msgId, !pinned);
    setSelectedMsg(null);
    load();
  };

  const handleEdit = (msg: Message) => {
    setEditingId(msg.id);
    setText(msg.content);
    setSelectedMsg(null);
  };

  const handleReply = (msgId: string) => {
    setReplyToId(msgId);
    setSelectedMsg(null);
  };

  const pinnedMessages = messages.filter((m) => m.is_pinned);
  const replyMsg = replyToId ? messages.find((m) => m.id === replyToId) : null;

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: "var(--online-border)", background: "var(--online-card)" }}>
        <button onClick={() => navigate("/messages")}><Icon name="ArrowLeft" size={20} /></button>
        <h1 className="font-bold text-sm">{partner?.display_name || "Диалог"}</h1>
      </div>

      {pinnedMessages.length > 0 && (
        <div className="px-4 py-2 border-b flex items-center gap-2 text-xs" style={{ borderColor: "var(--online-border)", background: "var(--online-card)" }}>
          <Icon name="Pin" size={12} style={{ color: "var(--online-primary)" }} />
          <span className="truncate">{pinnedMessages[pinnedMessages.length - 1].content}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[80%] px-3 py-2 rounded-2xl relative cursor-pointer"
                style={{
                  background: isMine ? "var(--online-primary)" : "var(--online-border)",
                  color: isMine ? "#fff" : "var(--online-text)",
                  borderBottomRightRadius: isMine ? "4px" : undefined,
                  borderBottomLeftRadius: !isMine ? "4px" : undefined,
                }}
                onClick={() => setSelectedMsg(selectedMsg === msg.id ? null : msg.id)}
              >
                {msg.reply_to_id && (
                  <div className="text-[10px] mb-1 px-2 py-0.5 rounded opacity-70" style={{ background: "rgba(0,0,0,0.1)" }}>
                    {messages.find((m) => m.id === msg.reply_to_id)?.content?.slice(0, 50) || "..."}
                  </div>
                )}
                <p className="text-sm">{msg.content}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] opacity-60">{formatTime(msg.created_at)}</span>
                  {msg.edited_at && <span className="text-[10px] opacity-60">ред.</span>}
                  {msg.is_pinned && <Icon name="Pin" size={10} className="opacity-60" />}
                  {isMine && msg.is_read && <Icon name="CheckCheck" size={10} className="opacity-60" />}
                </div>

                {selectedMsg === msg.id && (
                  <div className="absolute bottom-full mb-1 right-0 py-1 rounded-lg shadow-lg z-10 min-w-[140px]" style={{ background: "var(--online-card)", border: "1px solid var(--online-border)" }}>
                    <button onClick={() => handleReply(msg.id)} className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2" style={{ color: "var(--online-text)" }}>
                      <Icon name="Reply" size={12} /> Ответить
                    </button>
                    <button onClick={() => handleCopy(msg.content)} className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2" style={{ color: "var(--online-text)" }}>
                      <Icon name="Copy" size={12} /> Копировать
                    </button>
                    <button onClick={() => handlePin(msg.id, msg.is_pinned)} className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2" style={{ color: "var(--online-text)" }}>
                      <Icon name="Pin" size={12} /> {msg.is_pinned ? "Открепить" : "Закрепить"}
                    </button>
                    {isMine && (
                      <button onClick={() => handleEdit(msg)} className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2" style={{ color: "var(--online-text)" }}>
                        <Icon name="Pencil" size={12} /> Изменить
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {(replyMsg || editingId) && (
        <div className="px-4 py-2 border-t flex items-center gap-2 text-xs" style={{ borderColor: "var(--online-border)", background: "var(--online-card)" }}>
          <Icon name={editingId ? "Pencil" : "Reply"} size={12} style={{ color: "var(--online-primary)" }} />
          <span className="truncate">{editingId ? "Редактирование" : replyMsg?.content?.slice(0, 50)}</span>
          <button onClick={() => { setReplyToId(null); setEditingId(null); setText(""); }} className="ml-auto"><Icon name="X" size={14} /></button>
        </div>
      )}

      <div className="p-3 border-t flex gap-2" style={{ borderColor: "var(--online-border)", background: "var(--online-card)" }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение..."
          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: "var(--online-bg)", border: "1px solid var(--online-border)", color: "var(--online-text)" }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend} className="px-4 py-2 rounded-xl text-white" style={{ background: "var(--online-primary)" }}>
          <Icon name="Send" size={16} />
        </button>
      </div>
    </div>
  );
}
