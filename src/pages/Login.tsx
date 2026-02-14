import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { api as apiClient } from "@/lib/api";
import Icon from "@/components/ui/icon";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockCount, setBlockCount] = useState(0);
  const [appealSent, setAppealSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.blocked) {
      setBlocked(true);
      setBlockCount(result.block_count || 0);
      return;
    }
    if (result.error) {
      setError(result.error === "Invalid credentials" ? "Неверный email или пароль" : result.error);
      return;
    }
    navigate("/");
  };

  const handleAppeal = async () => {
    try {
      const loginResult = await fetch("https://functions.poehali.dev/ec750196-a441-42ad-a02f-3433d782aef0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const data = await loginResult.json();
      if (data.token) {
        localStorage.setItem("online_token_temp", data.token);
        await apiClient.appeal("Прошу разблокировать мой аккаунт");
        localStorage.removeItem("online_token_temp");
      }
    } catch {}
    setAppealSent(true);
  };

  if (blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--online-bg)" }}>
        <div className="w-full max-w-sm p-6 rounded-2xl text-center" style={{ background: "var(--online-card)", border: "1px solid var(--online-border)" }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
            <Icon name="AlertTriangle" size={32} style={{ color: "#ef4444" }} />
          </div>
          <h2 className="text-lg font-bold mb-2">Аккаунт заблокирован</h2>
          <p className="text-sm mb-4" style={{ color: "var(--online-muted)" }}>
            Аккаунт был удалён из-за нарушений правил сообщества. ({blockCount}/3)
          </p>
          {!appealSent ? (
            <button onClick={handleAppeal} className="w-full py-2.5 rounded-xl font-medium text-white mb-2" style={{ background: "var(--online-primary)" }}>
              Подать апелляцию
            </button>
          ) : (
            <p className="text-sm mb-2" style={{ color: "var(--online-primary)" }}>Апелляция отправлена</p>
          )}
          <button onClick={() => { setBlocked(false); navigate("/"); }} className="w-full py-2.5 rounded-xl font-medium" style={{ background: "var(--online-border)", color: "var(--online-text)" }}>
            Выйти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--online-bg)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: "var(--online-primary)" }}>O</div>
          <h1 className="text-2xl font-bold">Online</h1>
          <p className="text-sm mt-1" style={{ color: "var(--online-muted)" }}>Войдите в аккаунт</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl space-y-4" style={{ background: "var(--online-card)", border: "1px solid var(--online-border)" }}>
          {error && <div className="p-3 rounded-lg text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)" }}>{error}</div>}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--online-muted)" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--online-bg)", border: "1px solid var(--online-border)", color: "var(--online-text)" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--online-muted)" }}>Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--online-bg)", border: "1px solid var(--online-border)", color: "var(--online-text)" }}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl font-medium text-white" style={{ background: "var(--online-primary)" }}>
            {loading ? "Вход..." : "Войти"}
          </button>
          <p className="text-center text-sm" style={{ color: "var(--online-muted)" }}>
            Нет аккаунта?{" "}
            <button type="button" onClick={() => navigate("/register")} style={{ color: "var(--online-primary)" }} className="font-medium">
              Регистрация
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
